// API retry utility with exponential backoff
export const apiRetry = async (
  fn,
  options = {}
) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = (error) => {
      // Retry on network errors and 5xx server errors
      return (
        error.name === 'TypeError' ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('Network') ||
        (error.status && error.status >= 500 && error.status < 600)
      );
    },
    onRetry = (error, retryCount) => {
      console.log(`Retry attempt ${retryCount} after error:`, error.message);
    }
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * backoffFactor, maxDelay);
      }

      // Execute the function
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (i < maxRetries && retryCondition(error)) {
        onRetry(error, i + 1);
      } else {
        // Don't retry - throw the error
        throw error;
      }
    }
  }

  // All retries exhausted
  throw lastError;
};

// Wrapper for API calls with automatic retry
export const withRetry = (apiCall, options = {}) => {
  return apiRetry(apiCall, options);
};

// React hook for retry state
export const useApiRetry = () => {
  const retry = (apiCall, options) => withRetry(apiCall, options);
  
  return { retry };
};