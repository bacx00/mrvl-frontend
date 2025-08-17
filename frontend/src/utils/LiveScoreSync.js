/**
 * Live Score Sync - Unified Real-Time Updates via localStorage and Polling
 * 
 * Features:
 * - localStorage events for instant cross-tab updates
 * - Polling fallback for server synchronization
 * - Immediate reflection of all changes (heroes, stats, scores)
 * - No Pusher/WebSocket dependencies
 * - Debounced updates to prevent excessive re-renders
 * - Proper cleanup to prevent memory leaks
 */

import { debounce, UpdateBatcher } from './debounce';
import cleanupManager from './cleanupManager';

class LiveScoreSync {
  constructor() {
    this.listeners = new Map();
    this.pollingIntervals = new Map();
    this.STORAGE_KEY_PREFIX = 'mrvl_live_match_';
    this.POLLING_INTERVAL = 2000; // 2 seconds for balanced real-time updates
    this.API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
    this.lastPollTime = new Map(); // Track last poll time to prevent overwhelming
    this.updateBatchers = new Map(); // Batch rapid updates per match
    this.abortControllers = new Map(); // Track fetch requests for cleanup
    this.isPaused = false; // Track if operations are paused
    
    // Bind event handlers
    this.handleStorageChange = this.handleStorageChange.bind(this);
    this.handlePause = this.handlePause.bind(this);
    this.handleResume = this.handleResume.bind(this);
    this.destroy = this.destroy.bind(this);
    
    // Start listening to storage events
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
      window.addEventListener('mrvl-pause-operations', this.handlePause);
      window.addEventListener('mrvl-resume-operations', this.handleResume);
      
      // Register cleanup with global manager
      cleanupManager.register(this.destroy);
    }
    
    console.log('⚡ LiveScoreSync initialized - localStorage + 2s polling ready');
  }
  
  /**
   * Handle pause operations (tab hidden)
   */
  handlePause() {
    this.isPaused = true;
    console.log('⏸️ LiveScoreSync paused - tab hidden');
  }
  
  /**
   * Handle resume operations (tab visible)
   */
  handleResume() {
    this.isPaused = false;
    console.log('▶️ LiveScoreSync resumed - tab visible');
  }
  
  /**
   * Cleanup all resources
   */
  destroy() {
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
      window.removeEventListener('mrvl-pause-operations', this.handlePause);
      window.removeEventListener('mrvl-resume-operations', this.handleResume);
    }
    
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    
    // Abort all pending requests
    this.abortControllers.forEach(controller => controller.abort());
    this.abortControllers.clear();
    
    // Clear all batchers
    this.updateBatchers.forEach(batcher => batcher.clear());
    this.updateBatchers.clear();
    
    // Clear all listeners
    this.listeners.clear();
    this.lastPollTime.clear();
    
    console.log('🧹 LiveScoreSync destroyed - all resources cleaned up');
  }
  
  /**
   * Subscribe to match updates
   */
  subscribe(matchId, callback) {
    const key = `match_${matchId}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    // Wrap callback in debounce to prevent rapid re-renders
    const debouncedCallback = debounce(callback, 100);
    debouncedCallback.original = callback; // Store original for unsubscribe
    
    this.listeners.get(key).add(debouncedCallback);
    
    // Initialize update batcher for this match
    if (!this.updateBatchers.has(matchId)) {
      this.updateBatchers.set(matchId, new UpdateBatcher((updates) => {
        // Merge all updates and notify listeners once
        const mergedUpdate = updates.reduce((acc, update) => ({ ...acc, ...update }), {});
        this.notifyListeners(matchId, mergedUpdate);
      }, 50)); // 50ms batch window
    }
    
    // Start polling for this match
    this.startPolling(matchId);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(matchId, debouncedCallback);
    };
  }
  
  /**
   * Unsubscribe from match updates
   */
  unsubscribe(matchId, callback) {
    const key = `match_${matchId}`;
    
    if (this.listeners.has(key)) {
      // Find and remove the debounced callback
      const listeners = this.listeners.get(key);
      listeners.forEach(listener => {
        if (listener === callback || listener.original === callback) {
          if (listener.cancel) listener.cancel(); // Cancel any pending debounced calls
          listeners.delete(listener);
        }
      });
      
      // Stop polling if no more listeners
      if (this.listeners.get(key).size === 0) {
        this.stopPolling(matchId);
        this.listeners.delete(key);
        
        // Clean up batcher
        if (this.updateBatchers.has(matchId)) {
          this.updateBatchers.get(matchId).clear();
          this.updateBatchers.delete(matchId);
        }
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
   * Start polling for match updates with proper cleanup
   */
  startPolling(matchId) {
    // Clear existing interval if any
    this.stopPolling(matchId);
    
    // Initialize last poll time
    this.lastPollTime.set(matchId, 0);
    
    // Create abort controller for this match
    const abortController = new AbortController();
    this.abortControllers.set(matchId, abortController);
    
    // Poll for updates with rate limiting
    const pollInterval = setInterval(async () => {
      // Skip if paused (tab hidden)
      if (this.isPaused) {
        return;
      }
      
      // Rate limiting - ensure minimum 2000ms between requests
      const now = Date.now();
      const lastPoll = this.lastPollTime.get(matchId) || 0;
      if (now - lastPoll < 2000) {
        return; // Skip this poll if too soon
      }
      this.lastPollTime.set(matchId, now);
      
      try {
        const response = await fetch(`${this.API_BASE}/api/matches/${matchId}`, {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
          },
          signal: abortController.signal // Allow aborting of fetch
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
            
            // Use batcher if available for this match
            if (this.updateBatchers.has(matchId)) {
              this.updateBatchers.get(matchId).add(updateData);
            } else {
              // Direct update if no batcher
              localStorage.setItem(storageKey, JSON.stringify(updateData));
              this.notifyListeners(matchId, updateData);
            }
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(`Polling error for match ${matchId}:`, error);
        }
      }
    }, this.POLLING_INTERVAL);
    
    this.pollingIntervals.set(matchId, pollInterval);
    console.log(`⚡ Started polling for match ${matchId} (2s intervals with debouncing)`);
  }
  
  /**
   * Stop polling for match updates
   */
  stopPolling(matchId) {
    // Clear polling interval
    if (this.pollingIntervals.has(matchId)) {
      clearInterval(this.pollingIntervals.get(matchId));
      this.pollingIntervals.delete(matchId);
      this.lastPollTime.delete(matchId);
      console.log(`⏹️ Stopped polling for match ${matchId}`);
    }
    
    // Abort any pending fetch requests
    if (this.abortControllers.has(matchId)) {
      this.abortControllers.get(matchId).abort();
      this.abortControllers.delete(matchId);
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
        console.log(`⚡ Field changed: ${field} from ${oldActualData[field]} to ${newActualData[field]}`);
        return true;
      }
    }
    
    // Deep check maps for changes including player compositions
    const newMapsData = newActualData.maps || newData.maps;
    const oldMapsData = oldActualData.maps || oldData.maps;
    
    if (newMapsData && oldMapsData) {
      const newMapsStr = JSON.stringify(newMapsData);
      const oldMapsStr = JSON.stringify(oldMapsData);
      
      if (newMapsStr !== oldMapsStr) {
        // Log specific changes for debugging
        for (let i = 0; i < Math.max(newMapsData?.length || 0, oldMapsData?.length || 0); i++) {
          const newMap = newMapsData?.[i];
          const oldMap = oldMapsData?.[i];
          
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
    } else if (newMapsData || oldMapsData) {
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