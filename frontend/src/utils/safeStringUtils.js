/**
 * Safe String Utilities
 * Prevents [object Object] display issues in React components
 */

/**
 * Safely converts any value to a string, handling objects that might display as [object Object]
 * @param {*} value - The value to convert to string
 * @returns {string} - A safe string representation
 */
export const safeString = (value) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  
  // Handle objects that might be displayed as [object Object]
  if (typeof value === 'object') {
    // If it's an error object, extract the message
    if (value.message) return String(value.message);
    if (value.error && typeof value.error === 'string') return value.error;
    
    // If it has a content property, use that
    if (value.content) return String(value.content);
    
    // If it's an array, join with commas
    if (Array.isArray(value)) {
      return value.map(item => safeString(item)).join(', ');
    }
    
    // For plain objects, try to extract meaningful text
    if (value.text) return String(value.text);
    if (value.title) return String(value.title);
    if (value.name) return String(value.name);
    
    // If it's a Response object or similar, try to extract useful info
    if (value.statusText) return value.statusText;
    if (value.status) return `Status: ${value.status}`;
    
    // Fallback to empty string to prevent [object Object]
    console.warn('Object could not be safely converted to string:', value);
    return '';
  }
  
  return String(value);
};

/**
 * Safely extracts error message from various error formats
 * @param {*} error - Error object or message
 * @returns {string} - Safe error message
 */
export const safeErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  
  // Direct string message
  if (typeof error === 'string') return error;
  
  // HTTP response error
  if (error.response?.data?.message) {
    return safeString(error.response.data.message);
  }
  
  // Standard error object
  if (error.message) {
    return safeString(error.message);
  }
  
  // Axios error
  if (error.response?.statusText) {
    return `${error.response.status}: ${error.response.statusText}`;
  }
  
  // Network error
  if (error.code === 'NETWORK_ERROR') {
    return 'Network connection failed';
  }
  
  // Fallback
  return safeString(error) || 'An error occurred';
};

/**
 * Safely displays content, preventing [object Object] issues in forum posts/comments
 * @param {*} content - Content to display
 * @returns {string} - Safe content string
 */
export const safeContent = (content) => {
  const safe = safeString(content);
  
  // Additional validation for empty or whitespace-only content
  if (!safe || !safe.trim()) {
    return '';
  }
  
  return safe;
};

/**
 * Safely handles API response data extraction
 * @param {Object} response - API response object
 * @param {string} defaultMessage - Default message if extraction fails
 * @returns {Object} - Safe response data
 */
export const safeResponseData = (response, defaultMessage = 'Operation completed') => {
  if (!response || !response.data) {
    return {
      success: false,
      message: 'Invalid response received',
      data: null
    };
  }
  
  return {
    success: response.data.success || false,
    message: safeString(response.data.message || defaultMessage),
    data: response.data.data || response.data.post || response.data.comment || null
  };
};

export default {
  safeString,
  safeErrorMessage,
  safeContent,
  safeResponseData
};