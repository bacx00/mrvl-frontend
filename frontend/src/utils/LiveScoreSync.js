/**
 * Live Score Sync - Unified Real-Time Updates via localStorage and Polling
 * 
 * Features:
 * - localStorage events for instant cross-tab updates
 * - Polling fallback for server synchronization
 * - Immediate reflection of all changes (heroes, stats, scores)
 * - No Pusher/WebSocket dependencies
 */

class LiveScoreSync {
  constructor() {
    this.listeners = new Map();
    this.pollingIntervals = new Map();
    this.STORAGE_KEY_PREFIX = 'mrvl_live_match_';
    this.POLLING_INTERVAL = 200; // 200ms (0.2 seconds) for ultra-fast updates
    this.API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
    this.lastPollTime = new Map(); // Track last poll time to prevent overwhelming
    
    // Bind event handler
    this.handleStorageChange = this.handleStorageChange.bind(this);
    
    // Start listening to storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
    
    console.log('⚡ LiveScoreSync initialized - localStorage + 200ms ultra-fast polling ready');
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
      
      // Also notify local listeners immediately
      this.notifyListeners(matchId, updateData);
      
      console.log(`📡 Broadcasting update for match ${matchId}:`, updateData);
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
        this.notifyListeners(matchId, data);
        console.log(`📨 Received update for match ${matchId} from another tab`);
      } catch (error) {
        console.error('Failed to parse storage update:', error);
      }
    }
  }
  
  /**
   * Start ultra-fast polling for match updates
   */
  startPolling(matchId) {
    // Clear existing interval if any
    this.stopPolling(matchId);
    
    // Initialize last poll time
    this.lastPollTime.set(matchId, 0);
    
    // Poll for updates with rate limiting
    const pollInterval = setInterval(async () => {
      // Rate limiting - ensure minimum 200ms between requests
      const now = Date.now();
      const lastPoll = this.lastPollTime.get(matchId) || 0;
      if (now - lastPoll < 200) {
        return; // Skip this poll if too soon
      }
      this.lastPollTime.set(matchId, now);
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
            
            // Store and notify
            localStorage.setItem(storageKey, JSON.stringify(updateData));
            this.notifyListeners(matchId, updateData);
          }
        }
      } catch (error) {
        console.error(`Polling error for match ${matchId}:`, error);
      }
    }, this.POLLING_INTERVAL);
    
    this.pollingIntervals.set(matchId, pollInterval);
    console.log(`⚡ Started ultra-fast polling for match ${matchId} (200ms intervals)`);
  }
  
  /**
   * Stop polling for match updates
   */
  stopPolling(matchId) {
    if (this.pollingIntervals.has(matchId)) {
      clearInterval(this.pollingIntervals.get(matchId));
      this.pollingIntervals.delete(matchId);
      this.lastPollTime.delete(matchId);
      console.log(`⏹️ Stopped ultra-fast polling for match ${matchId}`);
    }
  }
  
  /**
   * Check if data has meaningful changes
   */
  hasChanges(newData, oldData) {
    // Check critical fields for changes
    const fieldsToCheck = [
      'team1_score', 'team2_score', 'status',
      'current_map', 'series_score_team1', 'series_score_team2',
      'current_map_number'
    ];
    
    for (const field of fieldsToCheck) {
      if (newData[field] !== oldData[field]) {
        console.log(`⚡ Field changed: ${field} from ${oldData[field]} to ${newData[field]}`);
        return true;
      }
    }
    
    // Deep check maps for changes including player compositions
    if (newData.maps && oldData.maps) {
      const newMapsStr = JSON.stringify(newData.maps);
      const oldMapsStr = JSON.stringify(oldData.maps);
      
      if (newMapsStr !== oldMapsStr) {
        // Log specific changes for debugging
        for (let i = 0; i < Math.max(newData.maps?.length || 0, oldData.maps?.length || 0); i++) {
          const newMap = newData.maps?.[i];
          const oldMap = oldData.maps?.[i];
          
          if (JSON.stringify(newMap) !== JSON.stringify(oldMap)) {
            console.log(`⚡ Map ${i + 1} changed`);
            
            // Check specific map fields
            if (newMap?.team1_score !== oldMap?.team1_score || newMap?.team2_score !== oldMap?.team2_score) {
              console.log(`  - Score: ${oldMap?.team1_score}-${oldMap?.team2_score} → ${newMap?.team1_score}-${newMap?.team2_score}`);
            }
            
            // Check player compositions
            if (JSON.stringify(newMap?.team1_composition) !== JSON.stringify(oldMap?.team1_composition)) {
              console.log(`  - Team1 composition updated`);
            }
            if (JSON.stringify(newMap?.team2_composition) !== JSON.stringify(oldMap?.team2_composition)) {
              console.log(`  - Team2 composition updated`);
            }
          }
        }
        return true;
      }
    } else if (newData.maps || oldData.maps) {
      // One has maps, the other doesn't
      return true;
    }
    
    // Check player stats for changes
    if (JSON.stringify(newData.player_stats) !== JSON.stringify(oldData.player_stats)) {
      console.log(`⚡ Player stats changed`);
      return true;
    }
    
    // Check team rosters for hero changes
    const checkRosterChanges = (newRoster, oldRoster, teamName) => {
      if (!newRoster && !oldRoster) return false;
      if (!newRoster || !oldRoster) return true;
      
      for (let i = 0; i < Math.max(newRoster.length, oldRoster.length); i++) {
        const newPlayer = newRoster[i];
        const oldPlayer = oldRoster[i];
        
        if (newPlayer?.hero !== oldPlayer?.hero) {
          console.log(`⚡ ${teamName} player ${newPlayer?.name || i} hero changed: ${oldPlayer?.hero} → ${newPlayer?.hero}`);
          return true;
        }
        if (JSON.stringify(newPlayer?.stats) !== JSON.stringify(oldPlayer?.stats)) {
          console.log(`⚡ ${teamName} player ${newPlayer?.name || i} stats updated`);
          return true;
        }
      }
      return false;
    };
    
    if (checkRosterChanges(newData.team1?.roster, oldData.team1?.roster, 'Team1')) return true;
    if (checkRosterChanges(newData.team2?.roster, oldData.team2?.roster, 'Team2')) return true;
    if (checkRosterChanges(newData.team1?.players, oldData.team1?.players, 'Team1')) return true;
    if (checkRosterChanges(newData.team2?.players, oldData.team2?.players, 'Team2')) return true;
    
    return false;
  }
  
  /**
   * Notify all listeners for a match
   */
  notifyListeners(matchId, data) {
    const key = `match_${matchId}`;
    
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in listener callback:', error);
        }
      });
    }
  }
  
  /**
   * Get current match data from localStorage
   */
  getMatchData(matchId) {
    const storageKey = `${this.STORAGE_KEY_PREFIX}${matchId}`;
    const data = localStorage.getItem(storageKey);
    
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.error('Failed to parse stored match data:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Clear match data from localStorage
   */
  clearMatchData(matchId) {
    const storageKey = `${this.STORAGE_KEY_PREFIX}${matchId}`;
    localStorage.removeItem(storageKey);
  }
  
  /**
   * Clean up all resources
   */
  destroy() {
    // Stop all polling
    this.pollingIntervals.forEach((interval, matchId) => {
      clearInterval(interval);
    });
    this.pollingIntervals.clear();
    
    // Clear listeners and poll times
    this.listeners.clear();
    this.lastPollTime.clear();
    
    // Remove event listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
    }
    
    console.log('🛑 LiveScoreSync destroyed');
  }
}

// Create singleton instance
const liveScoreSync = new LiveScoreSync();

// Prevent multiple instances
if (typeof window !== 'undefined') {
  if (window.__liveScoreSync) {
    window.__liveScoreSync.destroy();
  }
  window.__liveScoreSync = liveScoreSync;
}

export default liveScoreSync;