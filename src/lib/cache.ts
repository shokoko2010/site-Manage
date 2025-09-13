export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

class LocalCache {
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  // Clean up expired entries
  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Memory cache for server-side
class MemoryCache {
  private static instance: MemoryCache;
  private cache: Map<string, CacheEntry<any>>;
  private maxSize: number;

  private constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  static getInstance(): MemoryCache {
    if (!MemoryCache.instance) {
      MemoryCache.instance = new MemoryCache();
    }
    return MemoryCache.instance;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// API response caching
export class APICache {
  private cache: LocalCache;

  constructor(maxSize: number = 200) {
    this.cache = new LocalCache(maxSize);
  }

  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = 5 * 60 * 1000): Promise<T> {
    // Try to get from cache first
    const cached = this.cache.get<T>(key);
    if (cached) {
      return cached;
    }

    // Fetch fresh data
    const data = await fetcher();
    
    // Cache the result
    this.cache.set(key, data, ttl);
    
    return data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// React hook for caching
import { useState, useEffect } from 'react';

export function useCache<T>(key: string, fetcher: () => Promise<T>, options: CacheOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const cacheKey = `cache_${key}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const { data: cachedData, timestamp, ttl } = JSON.parse(cached);
          
          // Check if cache is still valid
          if (Date.now() - timestamp < ttl) {
            setData(cachedData);
            setLoading(false);
            return;
          }
        }

        // Fetch fresh data
        const freshData = await fetcher();
        setData(freshData);
        
        // Cache the result
        const cacheEntry = {
          data: freshData,
          timestamp: Date.now(),
          ttl: options.ttl || 5 * 60 * 1000
        };
        
        localStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [key, fetcher, options.ttl]);

  return { data, loading, error };
}

// Export instances
export const localCache = new LocalCache();
export const memoryCache = MemoryCache.getInstance();
export const apiCache = new APICache();

export default LocalCache;