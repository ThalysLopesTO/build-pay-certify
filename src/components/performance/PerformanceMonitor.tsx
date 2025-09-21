import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface PerformanceMetrics {
  queryCount: number;
  cacheHitRatio: number;
  averageQueryTime: number;
  failedQueries: number;
}

export const usePerformanceMonitor = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    let queryCount = 0;
    let cacheHits = 0;
    let totalQueryTime = 0;
    let failedQueries = 0;

    const cache = queryClient.getQueryCache();
    
    const unsubscribe = cache.subscribe((event) => {
      switch (event.type) {
        case 'added':
          queryCount++;
          break;
        case 'updated':
          if (event.query.state.status === 'success') {
            const queryTime = event.query.state.dataUpdatedAt - (event.query.state.fetchFailureCount > 0 ? 0 : Date.now());
            if (queryTime > 0) {
              totalQueryTime += queryTime;
            }
            
            // Check if data came from cache (no network request)
            if (event.query.state.fetchStatus === 'idle') {
              cacheHits++;
            }
          } else if (event.query.state.status === 'error') {
            failedQueries++;
          }
          break;
      }
    });

    // Log performance metrics every 30 seconds in development
    const interval = setInterval(() => {
      if (process.env.NODE_ENV === 'development' && queryCount > 0) {
        const metrics: PerformanceMetrics = {
          queryCount,
          cacheHitRatio: (cacheHits / queryCount) * 100,
          averageQueryTime: totalQueryTime / queryCount,
          failedQueries,
        };
        
        console.group('🚀 Performance Metrics');
        console.log('Queries executed:', metrics.queryCount);
        console.log('Cache hit ratio:', `${metrics.cacheHitRatio.toFixed(1)}%`);
        console.log('Average query time:', `${metrics.averageQueryTime.toFixed(0)}ms`);
        console.log('Failed queries:', metrics.failedQueries);
        console.log('Cache size:', cache.getAll().length);
        console.groupEnd();
        
        // Reset counters
        queryCount = 0;
        cacheHits = 0;
        totalQueryTime = 0;
        failedQueries = 0;
      }
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [queryClient]);
};

export const PerformanceMonitor = () => {
  usePerformanceMonitor();
  return null;
};