'use client';

import React, { useEffect, useState } from 'react';
import { cacheManager } from '@/lib/cache/strategies';

interface CacheInfoProps {
  strategyName: string;
}

export const CacheInfo: React.FC<CacheInfoProps> = ({ strategyName }) => {
  const [cacheSize, setCacheSize] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const updateCacheInfo = () => {
      // This is a simplified version - in a real app, you'd get this info from the cache strategy
      setCacheSize(Math.floor(Math.random() * 100));
      setLastUpdate(new Date());
    };

    updateCacheInfo();
    const interval = setInterval(updateCacheInfo, 5000);

    return () => clearInterval(interval);
  }, [strategyName]);

  const handleClearCache = async () => {
    try {
      await cacheManager.clear(strategyName);
      setCacheSize(0);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  };

  return (
    <div className="p-4 bg-muted rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold">{strategyName} Cache</h3>
        <button
          onClick={handleClearCache}
          className="text-sm text-destructive hover:underline"
        >
          Clear Cache
        </button>
      </div>
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Items: {cacheSize}</p>
        {lastUpdate && (
          <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
        )}
      </div>
    </div>
  );
};