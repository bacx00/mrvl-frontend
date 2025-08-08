/**
 * Comprehensive Error Handler Utility
 * Provides centralized error handling, logging, and user-friendly error messages
 */

import React from 'react';

// Error codes and messages mapping
export const ERROR_CODES = {
  // Network errors
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  CONNECTION_ERROR: 'connection_error',
  
  // Authentication errors
  AUTH_REQUIRED: 'auth_required',
  AUTH_EXPIRED: 'auth_expired',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  
  // Validation errors
  VALIDATION_ERROR: 'validation_error',
  INVALID_INPUT: 'invalid_input',
  
  // Resource errors
  NOT_FOUND: 'not_found',
  RESOURCE_UNAVAILABLE: 'resource_unavailable',
  
  // Server errors
  SERVER_ERROR: 'server_error',
  DATABASE_ERROR: 'database_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  
  // Application errors
  FEATURE_DISABLED: 'feature_disabled',
  RATE_LIMITED: 'rate_limited',
  
  // Unknown errors
  UNKNOWN_ERROR: 'unknown_error'
};

export const ERROR_MESSAGES = {
  [ERROR_CODES.NETWORK_ERROR]: 'Unable to connect to the server. Please check your internet connection and try again.',
  [ERROR_CODES.TIMEOUT_ERROR]: 'The request took too long. Please try again.',
  [ERROR_CODES.CONNECTION_ERROR]: 'Connection lost. Please check your internet connection.',
  
  [ERROR_CODES.AUTH_REQUIRED]: 'Please log in to continue.',
  [ERROR_CODES.AUTH_EXPIRED]: 'Your session has expired. Please log in again.',
  [ERROR_CODES.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ERROR_CODES.FORBIDDEN]: 'You do not have permission to access this resource.',
  
  [ERROR_CODES.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ERROR_CODES.INVALID_INPUT]: 'Some information you entered is invalid. Please review and correct.',
  
  [ERROR_CODES.NOT_FOUND]: 'The requested item could not be found.',
  [ERROR_CODES.RESOURCE_UNAVAILABLE]: 'This resource is temporarily unavailable. Please try again later.',
  
  [ERROR_CODES.SERVER_ERROR]: 'Server error occurred. Please try again later.',
  [ERROR_CODES.DATABASE_ERROR]: 'Database connection issue. Please try again later.',
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  
  [ERROR_CODES.FEATURE_DISABLED]: 'This feature is currently disabled.',
  [ERROR_CODES.RATE_LIMITED]: 'Too many requests. Please wait a moment and try again.',
  
  [ERROR_CODES.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.'
};

/**
 * Maps HTTP status codes to error codes
 */
export const statusToErrorCode = (status) => {
  const statusMap = {
    400: ERROR_CODES.INVALID_INPUT,
    401: ERROR_CODES.AUTH_REQUIRED,
    403: ERROR_CODES.FORBIDDEN,
    404: ERROR_CODES.NOT_FOUND,
    408: ERROR_CODES.TIMEOUT_ERROR,
    422: ERROR_CODES.VALIDATION_ERROR,
    429: ERROR_CODES.RATE_LIMITED,
    500: ERROR_CODES.SERVER_ERROR,
    502: ERROR_CODES.SERVICE_UNAVAILABLE,
    503: ERROR_CODES.SERVICE_UNAVAILABLE,
    504: ERROR_CODES.TIMEOUT_ERROR
  };
  
  return statusMap[status] || ERROR_CODES.UNKNOWN_ERROR;
};

/**
 * Extracts error information from various error types
 */
export const parseError = (error) => {
  // Default error structure
  let errorInfo = {
    code: ERROR_CODES.UNKNOWN_ERROR,
    message: ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR],
    details: null,
    statusCode: null,
    retryable: true,
    originalError: error
  };

  // Network/Axios errors
  if (error?.response) {
    const { status, data } = error.response;
    errorInfo.statusCode = status;
    errorInfo.code = data?.error_code || statusToErrorCode(status);
    errorInfo.message = data?.message || ERROR_MESSAGES[errorInfo.code];
    errorInfo.details = data?.errors || data?.details;
    errorInfo.retryable = status >= 500 || status === 408 || status === 429;
  }
  // Request timeout or network failure
  else if (error?.request) {
    errorInfo.code = error.code === 'ECONNABORTED' ? ERROR_CODES.TIMEOUT_ERROR : ERROR_CODES.NETWORK_ERROR;
    errorInfo.message = ERROR_MESSAGES[errorInfo.code];
    errorInfo.retryable = true;
  }
  // JavaScript errors
  else if (error instanceof Error) {
    errorInfo.code = ERROR_CODES.UNKNOWN_ERROR;
    errorInfo.message = error.message || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
    errorInfo.retryable = false;
  }
  // String errors
  else if (typeof error === 'string') {
    errorInfo.message = error;
    errorInfo.retryable = false;
  }

  return errorInfo;
};

/**
 * Logs error information to console and external services
 */
export const logError = (error, context = {}) => {
  const errorInfo = parseError(error);
  
  const logData = {
    ...errorInfo,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: context.userId || 'anonymous'
  };

  // Console logging (always in development)
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error: ${errorInfo.code}`);
    console.error('Message:', errorInfo.message);
    console.error('Original Error:', error);
    console.error('Context:', context);
    console.error('Full Log Data:', logData);
    console.groupEnd();
  }

  // Production error logging
  if (process.env.NODE_ENV === 'production') {
    // Send to external logging service
    if (window.logError) {
      window.logError(logData);
    }
    
    // Send to analytics
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: errorInfo.message,
        fatal: false,
        error_code: errorInfo.code,
        status_code: errorInfo.statusCode
      });
    }
  }

  return errorInfo;
};

/**
 * Creates a standardized error handler for API calls
 */
export const createErrorHandler = (options = {}) => {
  const {
    context = {},
    onError = null,
    showNotification = true,
    retryable = true
  } = options;

  return (error) => {
    const errorInfo = logError(error, context);

    // Call custom error handler if provided
    if (onError) {
      onError(errorInfo);
    }

    // Error notifications disabled to remove red banners
    // if (showNotification && window.showErrorNotification) {
    //   window.showErrorNotification(errorInfo.message);
    // }

    // Return parsed error info for further handling
    return errorInfo;
  };
};

/**
 * Wraps async functions with error handling
 */
export const withErrorHandling = (asyncFunction, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      const errorHandler = createErrorHandler(options);
      const errorInfo = errorHandler(error);
      
      // Re-throw if specified
      if (options.rethrow !== false) {
        throw errorInfo;
      }
      
      return { error: errorInfo };
    }
  };
};

/**
 * Hook for handling errors in React components
 */
export const useErrorHandler = (options = {}) => {
  const handleError = React.useCallback((error, context = {}) => {
    const mergedContext = { ...options.context, ...context };
    return createErrorHandler({ ...options, context: mergedContext })(error);
  }, [options]);

  return handleError;
};

/**
 * Retry utility for failed operations
 */
export const retryOperation = async (operation, options = {}) => {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = 2,
    retryCondition = (error) => parseError(error).retryable
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry on last attempt or if not retryable
      if (attempt === maxRetries || !retryCondition(error)) {
        break;
      }
      
      // Wait before retrying with exponential backoff
      const waitTime = delay * Math.pow(backoff, attempt);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
};

/**
 * Circuit breaker pattern for preventing cascading failures
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'closed'; // closed, open, half-open
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }

  async call(operation) {
    if (this.state === 'open') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is open');
      }
      this.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'closed';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}

export default {
  ERROR_CODES,
  ERROR_MESSAGES,
  parseError,
  logError,
  createErrorHandler,
  withErrorHandling,
  useErrorHandler,
  retryOperation,
  CircuitBreaker
};