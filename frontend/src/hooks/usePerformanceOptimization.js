import { useCallback, useRef, useMemo } from 'react';

/**
 * Performance optimization hook for React components
 * Provides memoization, debouncing, and performance monitoring
 */
export const usePerformanceOptimization = () => {
  const apiCallsRef = useRef(new Map());
  const timersRef = useRef(new Map());

  /**
   * Debounced callback to prevent excessive API calls
   */
  const debouncedCallback = useCallback((key, callback, delay = 300) => {
    // Clear existing timer
    if (timersRef.current.has(key)) {
      clearTimeout(timersRef.current.get(key));
    }

    // Set new timer
    const timerId = setTimeout(() => {
      callback();
      timersRef.current.delete(key);
    }, delay);

    timersRef.current.set(key, timerId);
  }, []);

  /**
   * API call deduplication to prevent duplicate requests
   */
  const deduplicatedApiCall = useCallback(async (key, apiCall) => {
    // If the same API call is already in progress, return the existing promise
    if (apiCallsRef.current.has(key)) {
      return apiCallsRef.current.get(key);
    }

    // Create new API call promise
    const promise = apiCall().finally(() => {
      // Remove from cache when completed
      apiCallsRef.current.delete(key);
    });

    // Cache the promise
    apiCallsRef.current.set(key, promise);

    return promise;
  }, []);

  /**
   * Memoized comparison function for React.memo
   */
  const shallowEqual = useMemo(() => (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps);
    const nextKeys = Object.keys(nextProps);

    if (prevKeys.length !== nextKeys.length) {
      return false;
    }

    for (const key of prevKeys) {
      if (prevProps[key] !== nextProps[key]) {
        return false;
      }
    }

    return true;
  }, []);

  /**
   * Performance monitoring for component renders
   */
  const measurePerformance = useCallback((componentName, operation) => {
    return (...args) => {
      const startTime = performance.now();
      const result = operation(...args);
      const endTime = performance.now();
      
      // Log slow operations (> 16ms for 60fps)
      if (endTime - startTime > 16) {
        console.warn(`⚠️ Slow ${componentName}:`, `${(endTime - startTime).toFixed(2)}ms`);
      }

      return result;
    };
  }, []);

  return {
    debouncedCallback,
    deduplicatedApiCall,
    shallowEqual,
    measurePerformance
  };
};