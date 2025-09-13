import { apiCache, memoryCache } from './cache';

// Cache strategies
export enum CacheStrategy {
  NETWORK_FIRST = 'network-first',
  CACHE_FIRST = 'cache-first',
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  CACHE_ONLY = 'cache-only',
  NETWORK_ONLY = 'network-only'
}

interface CacheConfig {
  strategy: CacheStrategy;
  ttl?: number;
  revalidate?: number;
  maxSize?: number;
}

class AdvancedCache {
  private config: CacheConfig;
  private revalidateTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: CacheConfig) {
    this.config = {
      ttl: 5 * 60 * 1000, // 5 minutes default
      revalidate: 60 * 1000, // 1 minute default
      maxSize: 100,
      ...config
    };
  }

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    switch (this.config.strategy) {
      case CacheStrategy.NETWORK_FIRST:
        return await this.networkFirst(key, fetcher);
      case CacheStrategy.CACHE_FIRST:
        return await this.cacheFirst(key, fetcher);
      case CacheStrategy.STALE_WHILE_REVALIDATE:
        return await this.staleWhileRevalidate(key, fetcher);
      case CacheStrategy.CACHE_ONLY:
        return await this.cacheOnly(key);
      case CacheStrategy.NETWORK_ONLY:
        return await this.networkOnly(key, fetcher);
      default:
        return await this.networkFirst(key, fetcher);
    }
  }

  private async networkFirst<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    try {
      // Try network first
      const data = await fetcher();
      
      // Cache the result
      memoryCache.set(key, data, this.config.ttl);
      
      return data;
    } catch (error) {
      // Fallback to cache
      const cached = memoryCache.get<T>(key);
      if (cached) {
        return cached;
      }
      
      throw error;
    }
  }

  private async cacheFirst<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Try cache first
    const cached = memoryCache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fetch from network
    const data = await fetcher();
    memoryCache.set(key, data, this.config.ttl);
    
    return data;
  }

  private async staleWhileRevalidate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    // Return cached data immediately if available
    const cached = memoryCache.get<T>(key);
    
    // Revalidate in background
    if (cached) {
      this.revalidate(key, fetcher);
      return cached;
    }

    // No cached data, fetch from network
    const data = await fetcher();
    memoryCache.set(key, data, this.config.ttl);
    
    return data;
  }

  private async cacheOnly<T>(key: string): Promise<T> {
    const cached = memoryCache.get<T>(key);
    if (!cached) {
      throw new Error('No cached data available');
    }
    return cached;
  }

  private async networkOnly<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    return await fetcher();
  }

  private revalidate<T>(key: string, fetcher: () => Promise<T>): void {
    // Clear existing timer
    const existingTimer = this.revalidateTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        const data = await fetcher();
        memoryCache.set(key, data, this.config.ttl);
      } catch (error) {
        console.warn(`Failed to revalidate cache for key: ${key}`, error);
      }
    }, this.config.revalidate);

    this.revalidateTimers.set(key, timer);
  }

  invalidate(key: string): void {
    memoryCache.delete(key);
    const timer = this.revalidateTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.revalidateTimers.delete(key);
    }
  }

  clear(): void {
    memoryCache.clear();
    this.revalidateTimers.forEach(timer => clearTimeout(timer));
    this.revalidateTimers.clear();
  }

  cleanup(): void {
    memoryCache.cleanup();
  }
}

// React hook for advanced caching
import { useState, useEffect, useCallback } from 'react';

export function useAdvancedCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  config: CacheConfig
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [cache] = useState(() => new AdvancedCache(config));

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await cache.get(key, fetcher);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, cache]);

  const refetch = useCallback(() => {
    cache.invalidate(key);
    fetchData();
  }, [key, cache, fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      cache.cleanup();
    };
  }, [cache]);

  return { data, loading, error, refetch };
}

// Predefined cache configurations
export const cacheConfigs = {
  // For frequently changing data
  frequent: {
    strategy: CacheStrategy.STALE_WHILE_REVALIDATE,
    ttl: 60 * 1000, // 1 minute
    revalidate: 30 * 1000, // 30 seconds
    maxSize: 200
  },
  // For rarely changing data
  static: {
    strategy: CacheStrategy.CACHE_FIRST,
    ttl: 60 * 60 * 1000, // 1 hour
    revalidate: 10 * 60 * 1000, // 10 minutes
    maxSize: 100
  },
  // For real-time data
  realtime: {
    strategy: CacheStrategy.NETWORK_FIRST,
    ttl: 30 * 1000, // 30 seconds
    revalidate: 5 * 1000, // 5 seconds
    maxSize: 50
  },
  // For user-specific data
  user: {
    strategy: CacheStrategy.CACHE_FIRST,
    ttl: 10 * 60 * 1000, // 10 minutes
    revalidate: 2 * 60 * 1000, // 2 minutes
    maxSize: 150
  }
} as const;

// Cache utilities
export const cacheUtils = {
  // Generate cache key from arguments
  generateKey: (prefix: string, ...args: any[]): string => {
    const serializedArgs = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join('|');
    return `${prefix}:${serializedArgs}`;
  },

  // Cache decorator for functions
  cacheFunction: <T extends (...args: any[]) => Promise<any>>(
    fn: T,
    config: CacheConfig
  ) => {
    const cache = new AdvancedCache(config);
    
    return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      const key = cacheUtils.generateKey(fn.name, ...args);
      return cache.get(key, () => fn(...args));
    };
  },

  // Cache API responses
  cacheAPI: async <T>(
    url: string,
    options?: RequestInit,
    config: CacheConfig = cacheConfigs.frequent
  ): Promise<T> => {
    const cache = new AdvancedCache(config);
    const key = cacheUtils.generateKey('api', url, options);
    
    return cache.get(key, async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    });
  }
};

export default AdvancedCache;