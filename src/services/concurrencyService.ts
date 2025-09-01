import { supabase } from '@/integrations/supabase/client';

export interface OptimisticUpdate<T> {
  id: string;
  data: Partial<T>;
  version: number;
  timestamp: Date;
}

export interface ConflictResolution<T> {
  resolved: boolean;
  data?: T;
  error?: string;
  retryCount: number;
}

class ConcurrencyService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Perform optimistic update with conflict resolution
   */
  async optimisticUpdate<T>(
    table: string,
    id: string,
    updates: Partial<T>,
    versionField: string = 'version'
  ): Promise<ConflictResolution<T>> {
    let retryCount = 0;

    while (retryCount < this.MAX_RETRIES) {
      try {
        // First, get current version
        const { data: current, error: fetchError } = await supabase
          .from(table)
          .select(`*, ${versionField}`)
          .eq('id', id)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch current data: ${fetchError.message}`);
        }

        const currentVersion = current[versionField] || 0;
        const newVersion = currentVersion + 1;

        // Attempt update with version check
        const { data: updated, error: updateError } = await supabase
          .from(table)
          .update({
            ...updates,
            [versionField]: newVersion,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq(versionField, currentVersion)
          .select()
          .single();

        if (updateError) {
          if (updateError.code === '23514') { // Constraint violation (version mismatch)
            retryCount++;
            if (retryCount < this.MAX_RETRIES) {
              await this.delay(this.RETRY_DELAY * retryCount);
              continue;
            }
            return {
              resolved: false,
              error: 'Data was modified by another user. Please refresh and try again.',
              retryCount
            };
          }
          throw updateError;
        }

        return {
          resolved: true,
          data: updated,
          retryCount
        };

      } catch (error) {
        retryCount++;
        if (retryCount >= this.MAX_RETRIES) {
          return {
            resolved: false,
            error: `Update failed after ${this.MAX_RETRIES} attempts: ${error.message}`,
            retryCount
          };
        }
        await this.delay(this.RETRY_DELAY * retryCount);
      }
    }

    return {
      resolved: false,
      error: 'Maximum retry attempts exceeded',
      retryCount
    };
  }

  /**
   * Perform transaction with rollback on failure
   */
  async transaction<T>(
    operations: (() => Promise<T>)[],
    rollbackOperations: (() => Promise<void>)[] = []
  ): Promise<T[]> {
    const results: T[] = [];
    const completedOperations: number[] = [];

    try {
      for (let i = 0; i < operations.length; i++) {
        const result = await operations[i]();
        results.push(result);
        completedOperations.push(i);
      }
      return results;
    } catch (error) {
      // Rollback completed operations in reverse order
      for (let i = completedOperations.length - 1; i >= 0; i--) {
        const operationIndex = completedOperations[i];
        if (rollbackOperations[operationIndex]) {
          try {
            await rollbackOperations[operationIndex]();
          } catch (rollbackError) {
            console.error(`Rollback failed for operation ${operationIndex}:`, rollbackError);
          }
        }
      }
      throw error;
    }
  }

  /**
   * Lock a record for exclusive access
   */
  async acquireLock(table: string, id: string, lockTimeout: number = 30000): Promise<boolean> {
    try {
      const lockId = `lock_${table}_${id}`;
      const expiresAt = new Date(Date.now() + lockTimeout);

      const { error } = await supabase
        .from('locks')
        .upsert({
          id: lockId,
          table_name: table,
          record_id: id,
          expires_at: expiresAt.toISOString(),
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        // Check if lock is expired
        const { data: existingLock } = await supabase
          .from('locks')
          .select('*')
          .eq('id', lockId)
          .single();

        if (existingLock && new Date(existingLock.expires_at) < new Date()) {
          // Lock is expired, remove it and try again
          await supabase
            .from('locks')
            .delete()
            .eq('id', lockId);

          return this.acquireLock(table, id, lockTimeout);
        }
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error acquiring lock:', error);
      return false;
    }
  }

  /**
   * Release a lock
   */
  async releaseLock(table: string, id: string): Promise<void> {
    try {
      const lockId = `lock_${table}_${id}`;
      await supabase
        .from('locks')
        .delete()
        .eq('id', lockId);
    } catch (error) {
      console.error('Error releasing lock:', error);
    }
  }

  /**
   * Check for data conflicts
   */
  async checkConflicts<T>(
    table: string,
    id: string,
    expectedData: Partial<T>
  ): Promise<{ hasConflicts: boolean; conflicts: string[] }> {
    try {
      const { data: current } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (!current) {
        return { hasConflicts: true, conflicts: ['Record not found'] };
      }

      const conflicts: string[] = [];
      for (const [key, expectedValue] of Object.entries(expectedData)) {
        if (current[key] !== expectedValue) {
          conflicts.push(`${key}: expected ${expectedValue}, got ${current[key]}`);
        }
      }

      return {
        hasConflicts: conflicts.length > 0,
        conflicts
      };
    } catch (error) {
      return { hasConflicts: true, conflicts: [error.message] };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const concurrencyService = new ConcurrencyService(); 