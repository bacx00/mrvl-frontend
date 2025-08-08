/**
 * API Helper Functions
 * Standardized utilities for handling API responses and errors
 */

/**
 * Standardized API response handler
 * @param {Object} response - API response object
 * @returns {Object|null} - Extracted data or null
 */
export const handleApiResponse = (response) => {
  if (!response) return null;
  
  // Handle axios response structure
  if (response.data !== undefined) {
    // Handle nested data structure (e.g., { data: { data: [...] } })
    if (response.data?.data !== undefined) {
      return response.data;
    }
    // Handle direct data structure (e.g., { data: [...] })
    return response.data;
  }
  
  // Handle direct response object
  return response;
};

/**
 * Safe JSON parsing utility
 * @param {string|Object} jsonString - JSON string or object to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} - Parsed object or fallback
 */
export const safeJsonParse = (jsonString, fallback = null) => {
  try {
    if (typeof jsonString === 'object') {
      return jsonString;
    }
    return jsonString ? JSON.parse(jsonString) : fallback;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
};

/**
 * Validate required fields for match data
 * @param {Object} matchStats - Match statistics object
 * @param {Object} playerStats - Player statistics object
 * @returns {Array} - Array of error messages
 */
export const validateMatchData = (matchStats, playerStats) => {
  const errors = [];
  
  if (!matchStats?.matchId) {
    errors.push('Match ID is required');
  }
  
  if (matchStats.team1Score === undefined || matchStats.team1Score === null) {
    errors.push('Team 1 score is required');
  }
  
  if (matchStats.team2Score === undefined || matchStats.team2Score === null) {
    errors.push('Team 2 score is required');
  }
  
  if (!matchStats.format) {
    errors.push('Match format is required');
  }
  
  if (!matchStats.maps || !Array.isArray(matchStats.maps)) {
    errors.push('Maps data is required');
  }
  
  return errors;
};

/**
 * Extract error message from API error response
 * @param {Error} error - Error object from API call
 * @returns {string} - User-friendly error message
 */
export const getApiErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.error;
    
    switch (status) {
      case 400:
        return message || 'Invalid request data. Please check your input.';
      case 401:
        return 'Authentication required. Please log in.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        const validationErrors = error.response.data?.errors;
        if (validationErrors) {
          return Object.values(validationErrors).flat().join(', ');
        }
        return message || 'Validation error. Please check your input.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return message || `Request failed with status ${status}`;
    }
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error. Please check your connection.';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred.';
  }
};

/**
 * Filter out placeholder players without IDs
 * @param {Object} playerStats - Player statistics object
 * @returns {Object} - Filtered player statistics
 */
export const filterValidPlayers = (playerStats) => {
  if (!playerStats || typeof playerStats !== 'object') {
    return {};
  }
  
  return Object.fromEntries(
    Object.entries(playerStats).filter(([id, stats]) => {
      return id && 
             !id.startsWith('placeholder_') && 
             !id.includes('undefined') &&
             stats?.player_id;
    })
  );
};

/**
 * Debounce function to prevent duplicate API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Create a unique event ID for deduplication
 * @param {string} eventType - Type of event
 * @param {*} data - Event data
 * @returns {string} - Unique event ID
 */
export const createEventId = (eventType, data) => {
  const timestamp = Date.now();
  const dataString = JSON.stringify(data);
  return `${eventType}-${timestamp}-${hashCode(dataString)}`;
};

/**
 * Simple hash code function for creating event IDs
 * @param {string} str - String to hash
 * @returns {number} - Hash code
 */
const hashCode = (str) => {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

/**
 * Create a deduplicated event handler
 * @param {Function} handler - The actual event handler
 * @param {number} windowMs - Time window for deduplication in milliseconds
 * @returns {Function} - Wrapped handler with deduplication
 */
export const createDeduplicatedHandler = (handler, windowMs = 500) => {
  const processedEvents = new Map();
  
  return (event) => {
    const eventKey = `${event.detail?.matchId}-${event.detail?.updateType}-${event.detail?.timestamp || Date.now()}`;
    const now = Date.now();
    
    // Check if we've seen this event recently
    const lastProcessed = processedEvents.get(eventKey);
    if (lastProcessed && (now - lastProcessed) < windowMs) {
      console.log('⏭️ Skipping duplicate event:', eventKey);
      return;
    }
    
    // Mark as processed
    processedEvents.set(eventKey, now);
    
    // Clean up old entries
    for (const [key, time] of processedEvents.entries()) {
      if (now - time > windowMs * 2) {
        processedEvents.delete(key);
      }
    }
    
    // Call the actual handler
    handler(event);
  };
};