/**
 * Tournament API Service
 * Handles all tournament-related API calls with proper error handling and real-time updates
 */

import { apiHelpers } from '../utils/apiHelpers';

class TournamentApiService {
  constructor(apiInstance) {
    this.api = apiInstance;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    this.subscribers = new Map(); // For real-time updates
  }

  /**
   * Clear cache for a specific tournament or all tournaments
   */
  clearCache(tournamentId = null) {
    if (tournamentId) {
      this.cache.delete(`tournament-${tournamentId}`);
      this.cache.delete(`tournament-${tournamentId}-matches`);
      this.cache.delete(`tournament-${tournamentId}-teams`);
      this.cache.delete(`tournament-${tournamentId}-bracket`);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cached data if available and not expired
   */
  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * Set cache data
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ============================================
  // TOURNAMENT CRUD OPERATIONS
  // ============================================

  /**
   * Fetch all tournaments with filtering and sorting
   */
  async getTournaments(params = {}) {
    const cacheKey = `tournaments-${JSON.stringify(params)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔄 TournamentAPI: Fetching tournaments with params:', params);
      
      const queryParams = new URLSearchParams();
      
      // Add supported filters
      if (params.status) queryParams.append('status', params.status);
      if (params.format) queryParams.append('format', params.format);
      if (params.region) queryParams.append('region', params.region);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.offset) queryParams.append('offset', params.offset);
      if (params.search) queryParams.append('search', params.search);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.prize_pool_min) queryParams.append('prize_pool_min', params.prize_pool_min);
      if (params.prize_pool_max) queryParams.append('prize_pool_max', params.prize_pool_max);

      const url = `/events${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await apiHelpers.withRetry(() => this.api.get(url));
      
      const tournaments = response.data?.data || response.data || [];
      console.log('✅ TournamentAPI: Fetched', tournaments.length, 'tournaments');
      
      this.setCache(cacheKey, tournaments);
      return tournaments;
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournaments:', error);
      throw new Error(`Failed to fetch tournaments: ${error.message}`);
    }
  }

  /**
   * Fetch a specific tournament by ID with full details
   */
  async getTournament(tournamentId, includeRelated = true) {
    const cacheKey = `tournament-${tournamentId}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔄 TournamentAPI: Fetching tournament:', tournamentId);
      
      const params = new URLSearchParams();
      if (includeRelated) {
        params.append('include', 'teams,matches,bracket');
      }

      const url = `/events/${tournamentId}${params.toString() ? `?${params}` : ''}`;
      const response = await apiHelpers.withRetry(() => this.api.get(url));
      
      const tournament = response.data?.data || response.data;
      console.log('✅ TournamentAPI: Fetched tournament details');
      
      this.setCache(cacheKey, tournament);
      return tournament;
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournament:', error);
      throw new Error(`Failed to fetch tournament: ${error.message}`);
    }
  }

  /**
   * Create a new tournament (admin only)
   */
  async createTournament(tournamentData) {
    try {
      console.log('🔄 TournamentAPI: Creating tournament');
      
      const response = await this.api.post('/admin/events', tournamentData);
      const tournament = response.data?.data || response.data;
      
      console.log('✅ TournamentAPI: Tournament created');
      this.clearCache(); // Clear tournaments cache
      return tournament;
    } catch (error) {
      console.error('❌ TournamentAPI: Error creating tournament:', error);
      throw new Error(`Failed to create tournament: ${error.message}`);
    }
  }

  /**
   * Update an existing tournament (admin only)
   */
  async updateTournament(tournamentId, updates) {
    try {
      console.log('🔄 TournamentAPI: Updating tournament:', tournamentId);
      
      const response = await this.api.put(`/admin/events/${tournamentId}`, updates);
      const tournament = response.data?.data || response.data;
      
      console.log('✅ TournamentAPI: Tournament updated');
      this.clearCache(tournamentId);
      return tournament;
    } catch (error) {
      console.error('❌ TournamentAPI: Error updating tournament:', error);
      throw new Error(`Failed to update tournament: ${error.message}`);
    }
  }

  /**
   * Delete a tournament (admin only)
   */
  async deleteTournament(tournamentId) {
    try {
      console.log('🔄 TournamentAPI: Deleting tournament:', tournamentId);
      
      await this.api.delete(`/admin/events/${tournamentId}`);
      
      console.log('✅ TournamentAPI: Tournament deleted');
      this.clearCache(tournamentId);
      return true;
    } catch (error) {
      console.error('❌ TournamentAPI: Error deleting tournament:', error);
      throw new Error(`Failed to delete tournament: ${error.message}`);
    }
  }

  // ============================================
  // TOURNAMENT TEAMS MANAGEMENT
  // ============================================

  /**
   * Get teams participating in a tournament
   */
  async getTournamentTeams(tournamentId) {
    const cacheKey = `tournament-${tournamentId}-teams`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔄 TournamentAPI: Fetching tournament teams:', tournamentId);
      
      const response = await apiHelpers.withRetry(() => 
        this.api.get(`/events/${tournamentId}/teams`)
      );
      
      const teams = response.data?.data || response.data || [];
      console.log('✅ TournamentAPI: Fetched', teams.length, 'teams');
      
      this.setCache(cacheKey, teams);
      return teams;
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournament teams:', error);
      throw new Error(`Failed to fetch tournament teams: ${error.message}`);
    }
  }

  /**
   * Add a team to a tournament (admin only)
   */
  async addTeamToTournament(tournamentId, teamId) {
    try {
      console.log('🔄 TournamentAPI: Adding team to tournament:', { tournamentId, teamId });
      
      const response = await this.api.post(`/admin/events/${tournamentId}/teams`, {
        team_id: teamId
      });
      
      console.log('✅ TournamentAPI: Team added to tournament');
      this.clearCache(tournamentId);
      return response.data;
    } catch (error) {
      console.error('❌ TournamentAPI: Error adding team to tournament:', error);
      throw new Error(`Failed to add team to tournament: ${error.message}`);
    }
  }

  /**
   * Remove a team from a tournament (admin only)
   */
  async removeTeamFromTournament(tournamentId, teamId) {
    try {
      console.log('🔄 TournamentAPI: Removing team from tournament:', { tournamentId, teamId });
      
      await this.api.delete(`/admin/events/${tournamentId}/teams/${teamId}`);
      
      console.log('✅ TournamentAPI: Team removed from tournament');
      this.clearCache(tournamentId);
      return true;
    } catch (error) {
      console.error('❌ TournamentAPI: Error removing team from tournament:', error);
      throw new Error(`Failed to remove team from tournament: ${error.message}`);
    }
  }

  // ============================================
  // TOURNAMENT MATCHES
  // ============================================

  /**
   * Get matches for a tournament
   */
  async getTournamentMatches(tournamentId, params = {}) {
    const cacheKey = `tournament-${tournamentId}-matches-${JSON.stringify(params)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔄 TournamentAPI: Fetching tournament matches:', tournamentId);
      
      const queryParams = new URLSearchParams();
      if (params.status) queryParams.append('status', params.status);
      if (params.round) queryParams.append('round', params.round);
      if (params.phase) queryParams.append('phase', params.phase);

      const url = `/events/${tournamentId}/matches${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await apiHelpers.withRetry(() => this.api.get(url));
      
      const matches = response.data?.data || response.data || [];
      console.log('✅ TournamentAPI: Fetched', matches.length, 'matches');
      
      this.setCache(cacheKey, matches);
      return matches;
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournament matches:', error);
      throw new Error(`Failed to fetch tournament matches: ${error.message}`);
    }
  }

  /**
   * Update match score (admin only)
   */
  async updateMatchScore(tournamentId, matchId, scoreData) {
    try {
      console.log('🔄 TournamentAPI: Updating match score:', { tournamentId, matchId });
      
      const response = await this.api.put(`/admin/events/${tournamentId}/matches/${matchId}/score`, scoreData);
      
      console.log('✅ TournamentAPI: Match score updated');
      this.clearCache(tournamentId);
      this.notifySubscribers('match-updated', { tournamentId, matchId, ...response.data });
      return response.data;
    } catch (error) {
      console.error('❌ TournamentAPI: Error updating match score:', error);
      throw new Error(`Failed to update match score: ${error.message}`);
    }
  }

  // ============================================
  // TOURNAMENT BRACKETS
  // ============================================

  /**
   * Get tournament bracket
   */
  async getTournamentBracket(tournamentId) {
    const cacheKey = `tournament-${tournamentId}-bracket`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔄 TournamentAPI: Fetching tournament bracket:', tournamentId);
      
      const response = await apiHelpers.withRetry(() => 
        this.api.get(`/events/${tournamentId}/bracket`)
      );
      
      const bracket = response.data?.data || response.data;
      console.log('✅ TournamentAPI: Fetched tournament bracket');
      
      this.setCache(cacheKey, bracket);
      return bracket;
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournament bracket:', error);
      throw new Error(`Failed to fetch tournament bracket: ${error.message}`);
    }
  }

  /**
   * Generate tournament bracket (admin only)
   */
  async generateBracket(tournamentId, bracketOptions = {}) {
    try {
      console.log('🔄 TournamentAPI: Generating tournament bracket:', tournamentId);
      
      const response = await this.api.post(`/admin/events/${tournamentId}/generate-bracket`, bracketOptions);
      const bracket = response.data?.data || response.data;
      
      console.log('✅ TournamentAPI: Tournament bracket generated');
      this.clearCache(tournamentId);
      this.notifySubscribers('bracket-generated', { tournamentId, bracket });
      return bracket;
    } catch (error) {
      console.error('❌ TournamentAPI: Error generating tournament bracket:', error);
      throw new Error(`Failed to generate tournament bracket: ${error.message}`);
    }
  }

  /**
   * Reset tournament bracket (admin only)
   */
  async resetBracket(tournamentId) {
    try {
      console.log('🔄 TournamentAPI: Resetting tournament bracket:', tournamentId);
      
      await this.api.delete(`/admin/events/${tournamentId}/bracket`);
      
      console.log('✅ TournamentAPI: Tournament bracket reset');
      this.clearCache(tournamentId);
      this.notifySubscribers('bracket-reset', { tournamentId });
      return true;
    } catch (error) {
      console.error('❌ TournamentAPI: Error resetting tournament bracket:', error);
      throw new Error(`Failed to reset tournament bracket: ${error.message}`);
    }
  }

  // ============================================
  // TOURNAMENT STATISTICS
  // ============================================

  /**
   * Get tournament statistics
   */
  async getTournamentStats(tournamentId) {
    try {
      console.log('🔄 TournamentAPI: Fetching tournament statistics:', tournamentId);
      
      const response = await apiHelpers.withRetry(() => 
        this.api.get(`/events/${tournamentId}/stats`)
      );
      
      const stats = response.data?.data || response.data;
      console.log('✅ TournamentAPI: Fetched tournament statistics');
      
      return stats;
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournament statistics:', error);
      throw new Error(`Failed to fetch tournament statistics: ${error.message}`);
    }
  }

  /**
   * Get player statistics for a tournament
   */
  async getTournamentPlayerStats(tournamentId, params = {}) {
    try {
      console.log('🔄 TournamentAPI: Fetching tournament player stats:', tournamentId);
      
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.metric) queryParams.append('metric', params.metric);

      const url = `/events/${tournamentId}/player-stats${queryParams.toString() ? `?${queryParams}` : ''}`;
      const response = await apiHelpers.withRetry(() => this.api.get(url));
      
      const stats = response.data?.data || response.data || [];
      console.log('✅ TournamentAPI: Fetched player statistics');
      
      return stats;
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournament player stats:', error);
      throw new Error(`Failed to fetch tournament player statistics: ${error.message}`);
    }
  }

  // ============================================
  // REAL-TIME UPDATES
  // ============================================

  /**
   * Subscribe to tournament updates
   */
  subscribe(tournamentId, eventType, callback) {
    const key = `${tournamentId}-${eventType}`;
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key).add(callback);

    console.log('📡 TournamentAPI: Subscribed to', eventType, 'for tournament', tournamentId);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(key);
        }
      }
      console.log('📡 TournamentAPI: Unsubscribed from', eventType, 'for tournament', tournamentId);
    };
  }

  /**
   * Notify subscribers of updates
   */
  notifySubscribers(eventType, data) {
    const key = `${data.tournamentId}-${eventType}`;
    const callbacks = this.subscribers.get(key);
    
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ TournamentAPI: Error in subscriber callback:', error);
        }
      });
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Search tournaments
   */
  async searchTournaments(query, filters = {}) {
    return this.getTournaments({
      search: query,
      ...filters,
      limit: 20
    });
  }

  /**
   * Get upcoming tournaments
   */
  async getUpcomingTournaments(limit = 10) {
    return this.getTournaments({
      status: 'upcoming',
      sort: 'start_date_asc',
      limit
    });
  }

  /**
   * Get live tournaments
   */
  async getLiveTournaments() {
    return this.getTournaments({
      status: 'ongoing,live',
      sort: 'start_date_desc'
    });
  }

  /**
   * Get completed tournaments
   */
  async getCompletedTournaments(limit = 20) {
    return this.getTournaments({
      status: 'completed',
      sort: 'end_date_desc',
      limit
    });
  }

  /**
   * Get tournament by slug/name
   */
  async getTournamentBySlug(slug) {
    try {
      const tournaments = await this.getTournaments({
        search: slug,
        limit: 1
      });
      
      if (tournaments.length === 0) {
        throw new Error('Tournament not found');
      }
      
      return tournaments[0];
    } catch (error) {
      console.error('❌ TournamentAPI: Error fetching tournament by slug:', error);
      throw new Error(`Failed to fetch tournament by slug: ${error.message}`);
    }
  }
}

// Export singleton instance factory
export const createTournamentApiService = (apiInstance) => {
  return new TournamentApiService(apiInstance);
};

export default TournamentApiService;