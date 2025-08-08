/**
 * Bracket API Service
 * Handles all bracket-related API communications with proper error handling
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

class BracketApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'BracketApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Generic API request handler with retry logic
 */
async function apiRequest(endpoint, options = {}) {
  const {
    method = 'GET',
    data = null,
    headers = {},
    timeout = 10000,
    retries = 2,
    retryDelay = 1000
  } = options;

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...headers
    },
    signal: AbortSignal.timeout(timeout)
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  let lastError;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BracketApiError(
          errorData.message || `HTTP Error: ${response.status}`,
          response.status,
          errorData
        );
      }

      const result = await response.json();
      return result;

    } catch (error) {
      lastError = error;
      
      if (attempt < retries && !error.name === 'AbortError') {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        continue;
      }
      
      break;
    }
  }

  throw lastError;
}

/**
 * Bracket API Methods
 */
export const bracketApi = {
  /**
   * Get bracket by event ID
   */
  async getBracket(eventId) {
    try {
      return await apiRequest(`/events/${eventId}/bracket`);
    } catch (error) {
      console.error(`Failed to fetch bracket for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Get multiple brackets
   */
  async getBrackets(eventIds) {
    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      eventIds.forEach(id => params.append('event_ids[]', id));
      return await apiRequest(`/brackets?${params.toString()}`);
    } catch (error) {
      console.error('Failed to fetch multiple brackets:', error);
      throw error;
    }
  },

  /**
   * Create/Generate bracket
   */
  async createBracket(eventId, bracketData) {
    try {
      return await apiRequest(`/events/${eventId}/bracket`, {
        method: 'POST',
        data: {
          format: bracketData.format,
          teams: bracketData.teams,
          settings: bracketData.settings || {}
        }
      });
    } catch (error) {
      console.error(`Failed to create bracket for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Update bracket settings
   */
  async updateBracket(eventId, updates) {
    try {
      return await apiRequest(`/events/${eventId}/bracket`, {
        method: 'PATCH',
        data: updates
      });
    } catch (error) {
      console.error(`Failed to update bracket for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Delete bracket
   */
  async deleteBracket(eventId) {
    try {
      return await apiRequest(`/events/${eventId}/bracket`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(`Failed to delete bracket for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Get bracket standings
   */
  async getStandings(eventId, options = {}) {
    try {
      const params = new URLSearchParams(options);
      return await apiRequest(`/events/${eventId}/standings?${params.toString()}`);
    } catch (error) {
      console.error(`Failed to fetch standings for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Get Swiss system standings
   */
  async getSwissStandings(eventId) {
    try {
      return await apiRequest(`/events/${eventId}/swiss-standings`);
    } catch (error) {
      console.error(`Failed to fetch Swiss standings for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Update match result
   */
  async updateMatch(matchId, matchData) {
    try {
      return await apiRequest(`/matches/${matchId}`, {
        method: 'PATCH',
        data: matchData
      });
    } catch (error) {
      console.error(`Failed to update match ${matchId}:`, error);
      throw error;
    }
  },

  /**
   * Get match details
   */
  async getMatch(matchId) {
    try {
      return await apiRequest(`/matches/${matchId}`);
    } catch (error) {
      console.error(`Failed to fetch match ${matchId}:`, error);
      throw error;
    }
  },

  /**
   * Get live matches
   */
  async getLiveMatches() {
    try {
      return await apiRequest('/live-matches');
    } catch (error) {
      console.error('Failed to fetch live matches:', error);
      throw error;
    }
  },

  /**
   * Advanced match scheduling
   */
  async scheduleMatch(matchId, scheduleData) {
    try {
      return await apiRequest(`/matches/${matchId}/schedule`, {
        method: 'POST',
        data: scheduleData
      });
    } catch (error) {
      console.error(`Failed to schedule match ${matchId}:`, error);
      throw error;
    }
  },

  /**
   * Bulk update matches
   */
  async bulkUpdateMatches(updates) {
    try {
      return await apiRequest('/matches/bulk-update', {
        method: 'POST',
        data: { updates }
      });
    } catch (error) {
      console.error('Failed to bulk update matches:', error);
      throw error;
    }
  },

  /**
   * Get team details for bracket
   */
  async getTeamDetails(teamIds) {
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      teamIds.forEach(id => params.append('ids[]', id));
      return await apiRequest(`/teams?${params.toString()}`);
    } catch (error) {
      console.error('Failed to fetch team details:', error);
      throw error;
    }
  },

  /**
   * Get available teams for tournament
   */
  async getAvailableTeams(eventId) {
    try {
      return await apiRequest(`/events/${eventId}/available-teams`);
    } catch (error) {
      console.error(`Failed to fetch available teams for event ${eventId}:`, error);
      throw error;
    }
  },

  /**
   * Reset bracket to initial state
   */
  async resetBracket(eventId, options = {}) {
    try {
      return await apiRequest(`/events/${eventId}/bracket/reset`, {
        method: 'POST',
        data: options
      });
    } catch (error) {
      console.error(`Failed to reset bracket for event ${eventId}:`, error);
      throw error;
    }
  }
};

/**
 * React Hook for bracket API operations
 */
export function useBracketApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = async (apiMethod, ...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiMethod(...args);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    clearError: () => setError(null),
    
    // Wrapped API methods
    getBracket: (eventId) => apiCall(bracketApi.getBracket, eventId),
    getBrackets: (eventIds) => apiCall(bracketApi.getBrackets, eventIds),
    createBracket: (eventId, data) => apiCall(bracketApi.createBracket, eventId, data),
    updateBracket: (eventId, updates) => apiCall(bracketApi.updateBracket, eventId, updates),
    deleteBracket: (eventId) => apiCall(bracketApi.deleteBracket, eventId),
    getStandings: (eventId, options) => apiCall(bracketApi.getStandings, eventId, options),
    getSwissStandings: (eventId) => apiCall(bracketApi.getSwissStandings, eventId),
    updateMatch: (matchId, data) => apiCall(bracketApi.updateMatch, matchId, data),
    getMatch: (matchId) => apiCall(bracketApi.getMatch, matchId),
    getLiveMatches: () => apiCall(bracketApi.getLiveMatches),
    scheduleMatch: (matchId, data) => apiCall(bracketApi.scheduleMatch, matchId, data),
    bulkUpdateMatches: (updates) => apiCall(bracketApi.bulkUpdateMatches, updates),
    getTeamDetails: (teamIds) => apiCall(bracketApi.getTeamDetails, teamIds),
    getAvailableTeams: (eventId) => apiCall(bracketApi.getAvailableTeams, eventId),
    resetBracket: (eventId, options) => apiCall(bracketApi.resetBracket, eventId, options)
  };
}

/**
 * Error handler utility
 */
export function handleBracketApiError(error) {
  if (error instanceof BracketApiError) {
    switch (error.status) {
      case 400:
        return 'Invalid bracket configuration. Please check your settings.';
      case 401:
        return 'You need to be logged in to manage brackets.';
      case 403:
        return 'You don\'t have permission to modify this bracket.';
      case 404:
        return 'Bracket not found. It may have been deleted or moved.';
      case 409:
        return 'Bracket conflict. Another update may be in progress.';
      case 422:
        return 'Invalid data provided. Please verify all required fields.';
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      case 500:
        return 'Server error occurred. Our team has been notified.';
      default:
        return error.message || 'An unexpected error occurred.';
    }
  }
  
  if (error.name === 'AbortError') {
    return 'Request timed out. Please check your connection and try again.';
  }
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return 'Network error. Please check your internet connection.';
  }
  
  return error.message || 'An unexpected error occurred.';
}

/**
 * Cache manager for bracket data
 */
class BracketCache {
  constructor(maxSize = 50, ttl = 300000) { // 5 minutes TTL
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.hitCount / (this.hitCount + this.missCount) || 0
    };
  }
}

// Global bracket cache instance
export const bracketCache = new BracketCache();

/**
 * Enhanced bracket API with caching
 */
export const cachedBracketApi = {
  async getBracket(eventId) {
    const cacheKey = `bracket_${eventId}`;
    const cached = bracketCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const data = await bracketApi.getBracket(eventId);
    bracketCache.set(cacheKey, data);
    return data;
  },

  async getStandings(eventId, options = {}) {
    const cacheKey = `standings_${eventId}_${JSON.stringify(options)}`;
    const cached = bracketCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const data = await bracketApi.getStandings(eventId, options);
    bracketCache.set(cacheKey, data);
    return data;
  },

  // Clear cache when data is modified
  async updateMatch(matchId, matchData) {
    const result = await bracketApi.updateMatch(matchId, matchData);
    
    // Clear related cache entries
    for (const key of bracketCache.cache.keys()) {
      if (key.includes('bracket_') || key.includes('standings_')) {
        bracketCache.delete(key);
      }
    }
    
    return result;
  }
};

// Import statement needed for React hooks
import { useState } from 'react';

export default bracketApi;