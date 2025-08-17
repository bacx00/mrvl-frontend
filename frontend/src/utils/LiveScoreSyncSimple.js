/**
 * Simple Live Score Sync - Immediate Updates
 * 
 * Features:
 * - Instant updates via localStorage events
 * - 2-second polling for server sync
 * - No debouncing - immediate display
 * - Simple and reliable
 */

class LiveScoreSyncSimple {
  constructor() {
    this.listeners = new Map();
    this.pollingIntervals = new Map();
    this.STORAGE_KEY_PREFIX = 'mrvl_live_match_';
    this.POLLING_INTERVAL = 2000; // 2 seconds
    this.API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
    
    // Bind event handler
    this.handleStorageChange = this.handleStorageChange.bind(this);
    
    // Start listening to storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
    
    console.log('⚡ LiveScoreSync initialized - Immediate updates ready');
  }
  
  /**
   * Subscribe to match updates
   */
  subscribe(matchId, callback) {
    const key = `match_${matchId}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key).add(callback);
    
    // Start polling for this match
    this.startPolling(matchId);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(matchId, callback);
    };
  }
  
  /**
   * Unsubscribe from match updates
   */
  unsubscribe(matchId, callback) {
    const key = `match_${matchId}`;
    
    if (this.listeners.has(key)) {
      this.listeners.get(key).delete(callback);
      
      // Stop polling if no more listeners
      if (this.listeners.get(key).size === 0) {
        this.stopPolling(matchId);
        this.listeners.delete(key);
      }
    }
  }
  
  /**
   * Broadcast update to all tabs via localStorage
   */
  broadcastUpdate(matchId, data) {
    const storageKey = `${this.STORAGE_KEY_PREFIX}${matchId}`;
    const updateData = {
      ...data,
      timestamp: Date.now(),
      source: 'admin_panel'
    };
    
    try {
      // Store in localStorage to trigger storage event in other tabs
      localStorage.setItem(storageKey, JSON.stringify(updateData));
      
      // Immediately notify local listeners
      this.notifyListeners(matchId, updateData);
      
      console.log(`📡 Broadcasting immediate update for match ${matchId}`);
    } catch (error) {
      console.error('Failed to broadcast update:', error);
    }
  }
  
  /**
   * Handle storage events from other tabs
   */
  handleStorageChange(event) {
    if (!event.key || !event.key.startsWith(this.STORAGE_KEY_PREFIX)) {
      return;
    }
    
    const matchId = event.key.replace(this.STORAGE_KEY_PREFIX, '');
    
    if (event.newValue) {
      try {
        const data = JSON.parse(event.newValue);
        // Immediately notify listeners - no delay
        this.notifyListeners(matchId, data);
        console.log(`📨 Immediate update received for match ${matchId}`);
      } catch (error) {
        console.error('Failed to parse storage update:', error);
      }
    }
  }
  
  /**
   * Start polling for match updates
   */
  startPolling(matchId) {
    // Clear existing interval if any
    this.stopPolling(matchId);
    
    // Poll for updates
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.API_BASE}/api/matches/${matchId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if data has changed by comparing with localStorage
          const storageKey = `${this.STORAGE_KEY_PREFIX}${matchId}`;
          const storedData = localStorage.getItem(storageKey);
          const lastUpdate = storedData ? JSON.parse(storedData) : null;
          
          // Only update if server data is newer or different
          if (!lastUpdate || this.hasChanges(data, lastUpdate)) {
            const updateData = {
              ...data,
              timestamp: Date.now(),
              source: 'polling'
            };
            
            // Store and immediately notify
            localStorage.setItem(storageKey, JSON.stringify(updateData));
            this.notifyListeners(matchId, updateData);
            console.log(`🔄 Polling update applied for match ${matchId}`);
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(`Polling error for match ${matchId}:`, error);
        }
      }
    }, this.POLLING_INTERVAL);
    
    this.pollingIntervals.set(matchId, pollInterval);
    console.log(`⚡ Started polling for match ${matchId} (2s intervals)`);
  }
  
  /**
   * Stop polling for match updates
   */
  stopPolling(matchId) {
    if (this.pollingIntervals.has(matchId)) {
      clearInterval(this.pollingIntervals.get(matchId));
      this.pollingIntervals.delete(matchId);
      console.log(`⏹️ Stopped polling for match ${matchId}`);
    }
  }
  
  /**
   * Check if data has meaningful changes
   */
  hasChanges(newData, oldData) {
    // Extract the actual data object if it exists
    const newActualData = newData.data || newData;
    const oldActualData = oldData.data || oldData;
    
    // Check critical fields for changes
    const fieldsToCheck = [
      'team1_score', 'team2_score', 'status',
      'current_map', 'series_score_team1', 'series_score_team2',
      'current_map_number'
    ];
    
    for (const field of fieldsToCheck) {
      if (newActualData[field] !== oldActualData[field]) {
        return true;
      }
    }
    
    // Check maps for changes (includes hero selections and stats)
    const newMaps = JSON.stringify(newActualData.maps || newData.maps || []);
    const oldMaps = JSON.stringify(oldActualData.maps || oldData.maps || []);
    
    if (newMaps !== oldMaps) {
      return true;
    }
    
    // Check for player/hero/stats changes
    const newPlayers = JSON.stringify(newActualData.team1_players || []) + 
                       JSON.stringify(newActualData.team2_players || []);
    const oldPlayers = JSON.stringify(oldActualData.team1_players || []) + 
                       JSON.stringify(oldActualData.team2_players || []);
    
    return newPlayers !== oldPlayers;
  }
  
  /**
   * Notify all listeners for a match - IMMEDIATE, NO DELAY
   */
  notifyListeners(matchId, data) {
    const key = `match_${matchId}`;
    
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          // Call immediately - no setTimeout, no delay
          callback(data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }
  
  /**
   * Update match score from admin panel
   */
  async updateMatchScore(matchId, team1Score, team2Score, currentMap = null) {
    const token = localStorage.getItem('authToken');
    
    try {
      const updateData = {
        team1_score: team1Score,
        team2_score: team2Score
      };
      
      if (currentMap !== null) {
        updateData.current_map = currentMap;
      }
      
      const response = await fetch(`${this.API_BASE}/api/matches/${matchId}/live-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Immediately broadcast the update
        this.broadcastUpdate(matchId, data);
        
        console.log(`✅ Score updated immediately for match ${matchId}`);
        return data;
      }
    } catch (error) {
      console.error('Failed to update match score:', error);
    }
    
    return null;
  }
  
  /**
   * Simple cleanup
   */
  destroy() {
    // Remove event listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
    }
    
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    
    // Clear all listeners
    this.listeners.clear();
    
    console.log('🧹 LiveScoreSync destroyed');
  }
}

// Create singleton instance
const liveScoreSyncSimple = new LiveScoreSyncSimple();

// Export singleton
export default liveScoreSyncSimple;