import { MemoryCache, CacheConfig } from './memory-cache';

export interface PersistentCacheConfig extends CacheConfig {
  storageKey: string;
  version: string;
}

export class PersistentCache {
  private memoryCache: MemoryCache;
  private config: PersistentCacheConfig;

  constructor(config: PersistentCacheConfig) {
    this.config = config;
    this.memoryCache = new MemoryCache(config);
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        const { data, version } = JSON.parse(stored);
        
        // Check version compatibility
        if (version === this.config.version) {
          Object.entries(data).forEach(([key, item]) => {
            this.memoryCache.set(key, item.data, item.ttl);
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const data: Record<string, any> = {};
      this.memoryCache.keys().forEach(key => {
        const item = this.memoryCache.get(key);
        if (item !== null) {
          data[key] = {
            data: item,
            ttl: this.config.ttl,
          };
        }
      });

      const cacheData = {
        data,
        version: this.config.version,
        timestamp: Date.now(),
      };

      localStorage.setItem(this.config.storageKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  set<T>(key: string, data: T, customTtl?: number): void {
    this.memoryCache.set(key, data, customTtl);
    this.saveToStorage();
  }

  get<T>(key: string): T | null {
    return this.memoryCache.get<T>(key);
  }

  has(key: string): boolean {
    return this.memoryCache.has(key);
  }

  delete(key: string): boolean {
    const result = this.memoryCache.delete(key);
    this.saveToStorage();
    return result;
  }

  clear(): void {
    this.memoryCache.clear();
    this.saveToStorage();
  }

  keys(): string[] {
    return this.memoryCache.keys();
  }

  size(): number {
    return this.memoryCache.size();
  }

  cleanup(): void {
    this.memoryCache.cleanup();
    this.saveToStorage();
  }
}

// Persistent cache configurations
export const authPersistentConfig: PersistentCacheConfig = {
  storageKey: 'zex_auth_cache',
  version: '1.0.0',
  ttl: 1000 * 60 * 60 * 24, // 24 hours
  maxSize: 10,
  strategy: 'lru',
};

export const preferencesPersistentConfig: PersistentCacheConfig = {
  storageKey: 'zex_preferences_cache',
  version: '1.0.0',
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
  maxSize: 50,
  strategy: 'lru',
};

// Create persistent cache instances
export const authPersistentCache = new PersistentCache(authPersistentConfig);
export const preferencesPersistentCache = new PersistentCache(preferencesPersistentConfig);