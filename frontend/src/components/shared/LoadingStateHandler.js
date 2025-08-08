import React, { useState, useEffect } from 'react';
import { Loader2, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Enhanced loading states with error handling
 */
export const LoadingStates = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  RETRY: 'retry',
  TIMEOUT: 'timeout',
  OFFLINE: 'offline'
};

/**
 * Hook for managing loading states with error handling
 */
export const useLoadingState = (initialState = LoadingStates.IDLE) => {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const setLoading = (isLoading) => {
    if (isLoading) {
      setState(LoadingStates.LOADING);
      setStartTime(Date.now());
      setProgress(0);
      setError(null);
    } else {
      setState(LoadingStates.IDLE);
      setStartTime(null);
      setProgress(100);
    }
  };

  const setSuccess = () => {
    setState(LoadingStates.SUCCESS);
    setProgress(100);
    setError(null);
  };

  const setErrorState = (errorInfo) => {
    setState(LoadingStates.ERROR);
    setError(errorInfo);
    setProgress(0);
  };

  const setRetry = () => {
    setState(LoadingStates.RETRY);
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  const setOffline = () => {
    setState(LoadingStates.OFFLINE);
    setError({ message: 'No internet connection', code: 'OFFLINE' });
  };

  const reset = () => {
    setState(LoadingStates.IDLE);
    setError(null);
    setProgress(0);
    setStartTime(null);
    setRetryCount(0);
  };

  return {
    state,
    error,
    progress,
    retryCount,
    startTime,
    isLoading: state === LoadingStates.LOADING || state === LoadingStates.RETRY,
    isError: state === LoadingStates.ERROR || state === LoadingStates.TIMEOUT || state === LoadingStates.OFFLINE,
    isSuccess: state === LoadingStates.SUCCESS,
    setLoading,
    setSuccess,
    setError: setErrorState,
    setRetry,
    setOffline,
    reset,
    setProgress
  };
};

/**
 * Loading indicator component with error states
 */
export const LoadingIndicator = ({ 
  state, 
  error, 
  progress = 0, 
  retryCount = 0,
  onRetry,
  size = 'medium',
  message = '',
  showProgress = false,
  timeout = 30000 
}) => {
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (state === LoadingStates.LOADING && timeout > 0) {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, timeout);
      
      return () => clearTimeout(timer);
    }
    setTimeoutReached(false);
  }, [state, timeout]);

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const getSizeClass = () => sizeClasses[size] || sizeClasses.medium;

  const renderContent = () => {
    switch (state) {
      case LoadingStates.LOADING:
      case LoadingStates.RETRY:
        return (
          <div className="flex flex-col items-center space-y-3">
            <div className="relative">
              <Loader2 className={`${getSizeClass()} animate-spin text-blue-500`} />
              {showProgress && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-600">
                    {Math.round(progress)}%
                  </span>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {state === LoadingStates.RETRY 
                  ? `Retrying... (${retryCount}/3)`
                  : message || 'Loading...'
                }
              </p>
              
              {showProgress && (
                <div className="w-32 bg-gray-200 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              
              {timeoutReached && (
                <p className="text-xs text-yellow-600 mt-2">
                  Taking longer than expected...
                </p>
              )}
            </div>
          </div>
        );

      case LoadingStates.ERROR:
        return (
          <div className="flex flex-col items-center space-y-3 text-center">
            <AlertTriangle className={`${getSizeClass()} text-red-500`} />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                {error?.message || 'Something went wrong'}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </button>
              )}
            </div>
          </div>
        );

      case LoadingStates.OFFLINE:
        return (
          <div className="flex flex-col items-center space-y-3 text-center">
            <WifiOff className={`${getSizeClass()} text-gray-500`} />
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No internet connection
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Check your connection and try again
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                >
                  <Wifi className="w-3 h-3 mr-1" />
                  Retry
                </button>
              )}
            </div>
          </div>
        );

      case LoadingStates.SUCCESS:
        return (
          <div className="flex flex-col items-center space-y-2">
            <div className={`${getSizeClass()} text-green-500`}>
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm text-green-700 dark:text-green-400">
              {message || 'Success!'}
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  const content = renderContent();
  if (!content) return null;

  return (
    <div className="flex items-center justify-center p-4">
      {content}
    </div>
  );
};

/**
 * Higher-order component that wraps components with loading state handling
 */
export const withLoadingState = (WrappedComponent, options = {}) => {
  return function WithLoadingStateComponent(props) {
    const loadingState = useLoadingState();
    const { 
      showLoadingOverlay = true,
      overlayClassName = '',
      ...restOptions 
    } = options;

    const enhancedProps = {
      ...props,
      loadingState,
      ...restOptions
    };

    return (
      <div className="relative">
        <WrappedComponent {...enhancedProps} />
        
        {showLoadingOverlay && loadingState.isLoading && (
          <div className={`
            absolute inset-0 bg-white/80 dark:bg-gray-900/80 
            flex items-center justify-center z-10 
            ${overlayClassName}
          `}>
            <LoadingIndicator 
              state={loadingState.state}
              error={loadingState.error}
              progress={loadingState.progress}
              retryCount={loadingState.retryCount}
            />
          </div>
        )}
      </div>
    );
  };
};

/**
 * Component that handles async operations with loading states
 */
export const AsyncHandler = ({ 
  children,
  operation,
  dependencies = [],
  loadingComponent,
  errorComponent,
  retryable = true,
  maxRetries = 3
}) => {
  const loadingState = useLoadingState();
  const [retryCount, setRetryCount] = useState(0);

  const executeOperation = async () => {
    try {
      loadingState.setLoading(true);
      await operation();
      loadingState.setSuccess();
    } catch (error) {
      if (retryable && retryCount < maxRetries) {
        loadingState.setRetry();
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          executeOperation();
        }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        loadingState.setError({
          message: error.message,
          code: error.code,
          retryable: retryCount < maxRetries
        });
      }
    }
  };

  useEffect(() => {
    executeOperation();
  }, dependencies);

  const handleRetry = () => {
    setRetryCount(0);
    executeOperation();
  };

  if (loadingState.isLoading && loadingComponent) {
    return loadingComponent;
  }

  if (loadingState.isError && errorComponent) {
    return React.cloneElement(errorComponent, { onRetry: handleRetry });
  }

  if (loadingState.isLoading || loadingState.isError) {
    return (
      <LoadingIndicator
        state={loadingState.state}
        error={loadingState.error}
        retryCount={loadingState.retryCount}
        onRetry={loadingState.error?.retryable ? handleRetry : null}
      />
    );
  }

  return children;
};

export default {
  LoadingStates,
  useLoadingState,
  LoadingIndicator,
  withLoadingState,
  AsyncHandler
};