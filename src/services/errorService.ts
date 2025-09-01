import { supabase } from '@/integrations/supabase/client';

interface ErrorLog {
  id: string;
  timestamp: Date;
  level: 'error' | 'warning' | 'info';
  message: string;
  stack?: string;
  userId?: string;
  context?: Record<string, any>;
}

class ErrorService {
  private readonly MAX_LOGS = 1000;

  async logError(error: Error | string, context?: Record<string, any>): Promise<void> {
    const errorLog: Omit<ErrorLog, 'id'> = {
      timestamp: new Date(),
      level: 'error',
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      context,
    };

    await this.saveLog(errorLog);
    console.error('Application Error:', errorLog);
  }

  async logWarning(message: string, context?: Record<string, any>): Promise<void> {
    const warningLog: Omit<ErrorLog, 'id'> = {
      timestamp: new Date(),
      level: 'warning',
      message,
      context,
    };

    await this.saveLog(warningLog);
    console.warn('Application Warning:', warningLog);
  }

  async logInfo(message: string, context?: Record<string, any>): Promise<void> {
    const infoLog: Omit<ErrorLog, 'id'> = {
      timestamp: new Date(),
      level: 'info',
      message,
      context,
    };

    await this.saveLog(infoLog);
    console.info('Application Info:', infoLog);
  }

  private async saveLog(log: Omit<ErrorLog, 'id'>): Promise<void> {
    try {
      // Get current user if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('error_logs')
        .insert({
          timestamp: log.timestamp.toISOString(),
          level: log.level,
          message: log.message,
          stack: log.stack || null,
          user_id: user?.id || null,
          context: log.context || null
        });

      if (error) {
        console.error('Failed to save error log to Supabase:', error);
      }
    } catch (error) {
      console.error('Failed to save error log:', error);
    }
  }

  async getLogs(limit: number = 100): Promise<ErrorLog[]> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch error logs:', error);
        return [];
      }

      return data?.map(log => ({
        id: log.id,
        timestamp: new Date(log.timestamp),
        level: log.level as 'error' | 'warning' | 'info',
        message: log.message,
        stack: log.stack,
        userId: log.user_id,
        context: log.context as Record<string, any> | undefined
      })) || [];
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  async clearLogs(): Promise<void> {
    try {
      const { error } = await supabase
        .from('error_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all logs

      if (error) {
        console.error('Failed to clear error logs:', error);
      }
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }

  async exportLogs(): Promise<string> {
    try {
      const logs = await this.getLogs(1000);
      return JSON.stringify(logs, null, 2);
    } catch (error) {
      console.error('Failed to export error logs:', error);
      return '[]';
    }
  }

  async getLogStats(): Promise<{ total: number; errors: number; warnings: number; info: number }> {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('level');

      if (error) {
        console.error('Failed to fetch log stats:', error);
        return { total: 0, errors: 0, warnings: 0, info: 0 };
      }

      const stats = {
        total: data?.length || 0,
        errors: data?.filter(log => log.level === 'error').length || 0,
        warnings: data?.filter(log => log.level === 'warning').length || 0,
        info: data?.filter(log => log.level === 'info').length || 0
      };

      return stats;
    } catch (error) {
      console.error('Failed to get log stats:', error);
      return { total: 0, errors: 0, warnings: 0, info: 0 };
    }
  }
}

export const errorService = new ErrorService();

// Global error handler
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorService.logError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorService.logError(`Unhandled Promise Rejection: ${event.reason}`, {
      type: 'unhandledrejection',
    });
  });
}
