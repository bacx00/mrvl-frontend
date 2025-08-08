import { useState, useCallback, useRef, useEffect } from 'react';

// Custom hook for managing loading states with automatic error handling
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (asyncFunction) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await asyncFunction();
      
      if (mountedRef.current) {
        setData(result);
        return result;
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        throw err;
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    isLoading,
    error,
    data,
    execute,
    reset,
    setIsLoading,
    setError,
    setData
  };
};

// Hook for managing multiple loading states
export const useMultipleLoading = (keys = []) => {
  const initialState = keys.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {});

  const [loadingStates, setLoadingStates] = useState(initialState);
  const [errors, setErrors] = useState({});

  const setLoading = useCallback((key, value) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);

  const setError = useCallback((key, error) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  }, []);

  const execute = useCallback(async (key, asyncFunction) => {
    try {
      setLoading(key, true);
      setError(key, null);
      
      const result = await asyncFunction();
      
      return result;
    } catch (err) {
      setError(key, err);
      throw err;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading, setError]);

  const isAnyLoading = Object.values(loadingStates).some(state => state);
  const hasAnyError = Object.values(errors).some(error => error !== null);

  return {
    loadingStates,
    errors,
    isAnyLoading,
    hasAnyError,
    setLoading,
    setError,
    execute
  };
};

// Hook for retry mechanism
export const useRetry = (fn, maxRetries = 3, delay = 1000) => {
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async (...args) => {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        if (i > 0) {
          setIsRetrying(true);
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i - 1)));
        }
        
        const result = await fn(...args);
        setRetryCount(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error;
        setRetryCount(i);
        
        if (i === maxRetries) {
          setIsRetrying(false);
          throw error;
        }
      }
    }
    
    throw lastError;
  }, [fn, maxRetries, delay]);

  return {
    executeWithRetry,
    retryCount,
    isRetrying,
    reset: () => {
      setRetryCount(0);
      setIsRetrying(false);
    }
  };
};

export default useLoading;