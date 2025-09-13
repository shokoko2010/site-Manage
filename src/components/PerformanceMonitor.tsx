import React, { useState, useEffect } from 'react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ 
  enabled = true, 
  onMetricsUpdate 
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    // Check if Performance API is available
    if ('performance' in window) {
      // Get TTFB
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        setMetrics(prev => ({
          ...prev,
          ttfb: navigation.responseStart - navigation.requestStart
        }));
      }

      // Get FCP
      const paintObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              fcp: entry.startTime
            }));
          }
        });
      });

      // Get LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setMetrics(prev => ({
          ...prev,
          lcp: lastEntry.startTime
        }));
      });

      // Get FID
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          setMetrics(prev => ({
            ...prev,
            fid: entry.processingStart - entry.startTime
          }));
        });
      });

      // Get CLS
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let clsValue = 0;
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
        setMetrics(prev => ({
          ...prev,
          cls: clsValue
        }));
      });

      try {
        paintObserver.observe({ entryTypes: ['paint'] });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        fidObserver.observe({ entryTypes: ['first-input'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('Performance monitoring not fully supported:', e);
      }

      return () => {
        paintObserver.disconnect();
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    }
  }, [enabled]);

  useEffect(() => {
    if (onMetricsUpdate) {
      onMetricsUpdate(metrics);
    }
  }, [metrics, onMetricsUpdate]);

  const formatMetric = (value: number | null) => {
    if (value === null) return 'N/A';
    if (value < 1000) return `${Math.round(value)}ms`;
    return `${(value / 1000).toFixed(2)}s`;
  };

  const getMetricStatus = (value: number | null, good: number, poor: number) => {
    if (value === null) return 'unknown';
    if (value <= good) return 'good';
    if (value <= poor) return 'needs-improvement';
    return 'poor';
  };

  const metricStatuses = {
    fcp: getMetricStatus(metrics.fcp, 1800, 3000),
    lcp: getMetricStatus(metrics.lcp, 2500, 4000),
    fid: getMetricStatus(metrics.fid, 100, 300),
    cls: getMetricStatus(metrics.cls, 0.1, 0.25),
    ttfb: getMetricStatus(metrics.ttfb, 200, 500)
  };

  if (!enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="modern-button-primary p-2 rounded-full shadow-lg"
        title="Toggle Performance Monitor"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      {isVisible && (
        <div className="modern-card mt-2 p-4 min-w-80">
          <h3 className="font-semibold text-foreground mb-3">Performance Metrics</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">FCP</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{formatMetric(metrics.fcp)}</span>
                <div className={`w-2 h-2 rounded-full ${
                  metricStatuses.fcp === 'good' ? 'bg-green-500' :
                  metricStatuses.fcp === 'needs-improvement' ? 'bg-yellow-500' :
                  metricStatuses.fcp === 'poor' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">LCP</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{formatMetric(metrics.lcp)}</span>
                <div className={`w-2 h-2 rounded-full ${
                  metricStatuses.lcp === 'good' ? 'bg-green-500' :
                  metricStatuses.lcp === 'needs-improvement' ? 'bg-yellow-500' :
                  metricStatuses.lcp === 'poor' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">FID</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{formatMetric(metrics.fid)}</span>
                <div className={`w-2 h-2 rounded-full ${
                  metricStatuses.fid === 'good' ? 'bg-green-500' :
                  metricStatuses.fid === 'needs-improvement' ? 'bg-yellow-500' :
                  metricStatuses.fid === 'poor' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">CLS</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{metrics.cls !== null ? metrics.cls.toFixed(3) : 'N/A'}</span>
                <div className={`w-2 h-2 rounded-full ${
                  metricStatuses.cls === 'good' ? 'bg-green-500' :
                  metricStatuses.cls === 'needs-improvement' ? 'bg-yellow-500' :
                  metricStatuses.cls === 'poor' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">TTFB</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{formatMetric(metrics.ttfb)}</span>
                <div className={`w-2 h-2 rounded-full ${
                  metricStatuses.ttfb === 'good' ? 'bg-green-500' :
                  metricStatuses.ttfb === 'needs-improvement' ? 'bg-yellow-500' :
                  metricStatuses.ttfb === 'poor' ? 'bg-red-500' : 'bg-gray-500'
                }`} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;