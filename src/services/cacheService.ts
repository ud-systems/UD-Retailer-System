interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version?: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  cleanupInterval: number;
}

class CacheService {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig = {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    cleanupInterval: 60 * 1000 // 1 minute
  };

  constructor() {
    this.startCleanup();
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, data: T, ttl?: number, version?: number): void {
    // Remove oldest items if cache is full
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      version
    };

    this.cache.set(key, item);
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  /**
   * Get cache item with metadata
   */
  getWithMetadata<T>(key: string): { data: T; version?: number; age: number } | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return {
      data: item.data,
      version: item.version,
      age: Date.now() - item.timestamp
    };
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Remove a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    totalHits: number;
    totalMisses: number;
  } {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.calculateHitRate(),
      totalHits: this.totalHits,
      totalMisses: this.totalMisses
    };
  }

  /**
   * Invalidate cache by pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    return count;
  }

  /**
   * Invalidate cache for specific entity type
   */
  invalidateEntity(entityType: string): number {
    return this.invalidatePattern(`^${entityType}:`);
  }

  /**
   * Invalidate cache for specific entity
   */
  invalidateEntityById(entityType: string, id: string): number {
    return this.invalidatePattern(`^${entityType}:${id}$`);
  }

  // Private methods
  private totalHits = 0;
  private totalMisses = 0;

  private calculateHitRate(): number {
    const total = this.totalHits + this.totalMisses;
    return total > 0 ? this.totalHits / total : 0;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private startCleanup(): void {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Cache key generators
export const cacheKeys = {
  retailers: (id?: string) => id ? `retailers:${id}` : 'retailers:all',
  orders: (id?: string) => id ? `orders:${id}` : 'orders:all',
  products: (id?: string) => id ? `products:${id}` : 'products:all',
  salespersons: (id?: string) => id ? `salespersons:${id}` : 'salespersons:all',
  users: (id?: string) => id ? `users:${id}` : 'users:all',
  stats: (type: string) => `stats:${type}`,
  search: (query: string, filters: string) => `search:${query}:${filters}`,
  dashboard: (userId: string) => `dashboard:${userId}`,
  analytics: (type: string, params: string) => `analytics:${type}:${params}`
};

export const cacheService = new CacheService(); 