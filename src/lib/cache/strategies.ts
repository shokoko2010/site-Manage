import { MemoryCache } from './memory-cache';

export interface CacheStrategy {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  clear(): Promise<void>;
}

export class ApiCacheStrategy implements CacheStrategy {
  private cache: MemoryCache;

  constructor() {
    this.cache = new MemoryCache({
      ttl: 1000 * 60 * 5, // 5 minutes
      maxSize: 100,
      strategy: 'lru',
    });
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    this.cache.set(key, data, ttl);
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export class DatabaseCacheStrategy implements CacheStrategy {
  private cache: MemoryCache;

  constructor() {
    this.cache = new MemoryCache({
      ttl: 1000 * 60 * 30, // 30 minutes
      maxSize: 200,
      strategy: 'lru',
    });
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    this.cache.set(key, data, ttl);
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = this.cache.keys();
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

// Cache manager
export class CacheManager {
  private strategies: Map<string, CacheStrategy>;

  constructor() {
    this.strategies = new Map();
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    this.strategies.set('api', new ApiCacheStrategy());
    this.strategies.set('database', new DatabaseCacheStrategy());
  }

  getStrategy(name: string): CacheStrategy {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`Cache strategy '${name}' not found`);
    }
    return strategy;
  }

  async get<T>(strategyName: string, key: string): Promise<T | null> {
    const strategy = this.getStrategy(strategyName);
    return await strategy.get<T>(key);
  }

  async set<T>(strategyName: string, key: string, data: T, ttl?: number): Promise<void> {
    const strategy = this.getStrategy(strategyName);
    await strategy.set(key, data, ttl);
  }

  async invalidate(strategyName: string, pattern: string): Promise<void> {
    const strategy = this.getStrategy(strategyName);
    await strategy.invalidate(pattern);
  }

  async clear(strategyName?: string): Promise<void> {
    if (strategyName) {
      const strategy = this.getStrategy(strategyName);
      await strategy.clear();
    } else {
      // Clear all strategies
      for (const [name, strategy] of this.strategies) {
        await strategy.clear();
      }
    }
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager();