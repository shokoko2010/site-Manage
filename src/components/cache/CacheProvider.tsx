'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { cacheManager, type CacheStrategy } from '@/lib/cache/strategies';

interface CacheContextType {
  get: <T>(strategyName: string, key: string) => Promise<T | null>;
  set: <T>(strategyName: string, key: string, data: T, ttl?: number) => Promise<void>;
  invalidate: (strategyName: string, pattern: string) => Promise<void>;
  clear: (strategyName?: string) => Promise<void>;
}

const CacheContext = createContext<CacheContextType | undefined>(undefined);

interface CacheProviderProps {
  children: ReactNode;
}

export const CacheProvider: React.FC<CacheProviderProps> = ({ children }) => {
  const get = async <T,>(strategyName: string, key: string): Promise<T | null> => {
    return await cacheManager.get<T>(strategyName, key);
  };

  const set = async <T,>(strategyName: string, key: string, data: T, ttl?: number): Promise<void> => {
    await cacheManager.set(strategyName, key, data, ttl);
  };

  const invalidate = async (strategyName: string, pattern: string): Promise<void> => {
    await cacheManager.invalidate(strategyName, pattern);
  };

  const clear = async (strategyName?: string): Promise<void> => {
    await cacheManager.clear(strategyName);
  };

  return (
    <CacheContext.Provider value={{ get, set, invalidate, clear }}>
      {children}
    </CacheContext.Provider>
  );
};

export const useCache = () => {
  const context = useContext(CacheContext);
  if (context === undefined) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

// Custom hooks for specific cache strategies
export const useApiCache = () => {
  const { get, set, invalidate, clear } = useCache();

  return {
    get: <T,>(key: string) => get<T>('api', key),
    set: <T,>(key: string, data: T, ttl?: number) => set('api', key, data, ttl),
    invalidate: (pattern: string) => invalidate('api', pattern),
    clear: () => clear('api'),
  };
};

export const useDatabaseCache = () => {
  const { get, set, invalidate, clear } = useCache();

  return {
    get: <T,>(key: string) => get<T>('database', key),
    set: <T,>(key: string, data: T, ttl?: number) => set('database', key, data, ttl),
    invalidate: (pattern: string) => invalidate('database', pattern),
    clear: () => clear('database'),
  };
};