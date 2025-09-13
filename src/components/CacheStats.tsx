import React, { useState, useEffect } from 'react';
import { localCache, apiCache } from '@/lib/cache';

interface CacheStatsProps {
  className?: string;
}

const CacheStats: React.FC<CacheStatsProps> = ({ className = '' }) => {
  const [stats, setStats] = useState({
    localCacheSize: 0,
    memoryCacheSize: 0,
    apiCacheSize: 0
  });

  useEffect(() => {
    const updateStats = () => {
      setStats({
        localCacheSize: localCache.size(),
        memoryCacheSize: (localCache as any).memoryCache?.size() || 0,
        apiCacheSize: (apiCache as any).cache?.size() || 0
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const clearAllCaches = () => {
    localCache.clear();
    (apiCache as any).clear?.();
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className={`modern-card p-4 ${className}`}>
      <h3 className="font-semibold text-foreground mb-3">Cache Statistics</h3>
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Local Cache</span>
          <span className="text-sm font-medium">{stats.localCacheSize} items</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">API Cache</span>
          <span className="text-sm font-medium">{stats.apiCacheSize} items</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Memory Cache</span>
          <span className="text-sm font-medium">{stats.memoryCacheSize} items</span>
        </div>
      </div>
      <button
        onClick={clearAllCaches}
        className="modern-button-secondary mt-3 w-full text-sm"
      >
        Clear All Caches
      </button>
    </div>
  );
};

export default CacheStats;