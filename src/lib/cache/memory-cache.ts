// Cache configuration and utilities
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
  strategy: 'lru' | 'fifo' | 'lfu'; // Cache eviction strategy
}

export interface CacheItem<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class MemoryCache {
  private cache: Map<string, CacheItem>;
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    this.config = config;
    this.cache = new Map();
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.cache.set(key, item);

    // Check cache size and evict if necessary
    if (this.config.maxSize && this.cache.size > this.config.maxSize) {
      this.evict();
    }
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if item is expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  has(key: string): boolean {
    return this.cache.has(key) && this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  private evict(): void {
    const keys = Array.from(this.cache.keys());
    
    switch (this.config.strategy) {
      case 'lru': // Least Recently Used
        keys.sort((a, b) => {
          const itemA = this.cache.get(a)!;
          const itemB = this.cache.get(b)!;
          return itemA.timestamp - itemB.timestamp;
        });
        break;
      case 'fifo': // First In First Out
        // Keep original order
        break;
      case 'lfu': // Least Frequently Used
        // For simplicity, we'll use LRU as LFU requires tracking access frequency
        keys.sort((a, b) => {
          const itemA = this.cache.get(a)!;
          const itemB = this.cache.get(b)!;
          return itemA.timestamp - itemB.timestamp;
        });
        break;
    }

    // Remove the first item (oldest/least used)
    if (keys.length > 0) {
      this.cache.delete(keys[0]);
    }
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Default cache configurations
export const defaultCacheConfig: CacheConfig = {
  ttl: 1000 * 60 * 5, // 5 minutes
  maxSize: 100,
  strategy: 'lru',
};

export const shortCacheConfig: CacheConfig = {
  ttl: 1000 * 60, // 1 minute
  maxSize: 50,
  strategy: 'lru',
};

export const longCacheConfig: CacheConfig = {
  ttl: 1000 * 60 * 60, // 1 hour
  maxSize: 200,
  strategy: 'lru',
};

// Create cache instances
export const authCache = new MemoryCache(shortCacheConfig);
export const sitesCache = new MemoryCache(defaultCacheConfig);
export const contentCache = new MemoryCache(defaultCacheConfig);
export const apiCache = new MemoryCache(shortCacheConfig);