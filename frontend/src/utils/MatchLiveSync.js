/**
 * MatchLiveSync - Efficient Live Updates for MatchDetailPage ↔ LiveScoring Panel Only
 * 
 * This replaces the over-engineered LiveScoreManager with a targeted approach:
 * - Only creates SSE connections for active match detail pages
 * - Only syncs between MatchDetailPage and its LiveScoring panel
 * - No unnecessary subscriptions for HomePage or other components
 * - Connection pooling to prevent multiple SSE connections per match
 */

class MatchLiveSync {
  constructor() {
    this.activeConnections = new Map(); // matchId -> { connection, subscribers, lastActivity }
    this.subscribers = new Map(); // componentId -> { callback, matchId, type }
    this.connectionTimeout = 30000; // 30 seconds of inactivity before cleanup
    this.maxConnectionsPerMatch = 1; // Only one SSE connection per match
    
    console.log('🎯 MatchLiveSync initialized - Efficient match-specific live updates');
  }

  /**
   * Subscribe to live updates for a specific match
   * Only intended for MatchDetailPage and LiveScoring components
   */
  subscribe(componentId, matchId, callback, options = {}) {
    if (!componentId || !matchId || typeof callback !== 'function') {
      console.error('MatchLiveSync: Invalid subscription parameters');
      return;
    }

    const subscription = {
      componentId,
      matchId,
      callback,
      type: options.type || 'match_update', // 'match_update', 'score_update', 'hero_update'
      subscribedAt: Date.now()
    };

    this.subscribers.set(componentId, subscription);
    console.log(`✅ "${componentId}" subscribed to match ${matchId} updates`);
    
    // Ensure SSE connection exists for this match
    this.ensureConnection(matchId);
    
    return () => this.unsubscribe(componentId);
  }

  /**
   * Unsubscribe a component from live updates
   */
  unsubscribe(componentId) {
    const subscription = this.subscribers.get(componentId);
    if (!subscription) return;

    this.subscribers.delete(componentId);
    console.log(`🔕 "${componentId}" unsubscribed from match ${subscription.matchId}`);
    
    // Check if we can cleanup the connection
    this.scheduleConnectionCleanup(subscription.matchId);
  }

  /**
   * Ensure SSE connection exists for a match (max 1 per match)
   */
  async ensureConnection(matchId) {
    if (this.activeConnections.has(matchId)) {
      const connection = this.activeConnections.get(matchId);
      connection.subscribers += 1;
      connection.lastActivity = Date.now();
      console.log(`⚡ Reusing existing SSE connection for match ${matchId}`);
      return;
    }

    try {
      console.log(`🔌 Creating SSE connection for match ${matchId}`);
      
      const eventSource = new EventSource(`/api/public/matches/${matchId}/live-stream`);
      
      eventSource.onopen = () => {
        console.log(`✅ SSE connected to match ${matchId}`);
      };
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleLiveUpdate(matchId, data);
        } catch (error) {
          console.warn('Failed to parse SSE message:', error);
        }
      };
      
      eventSource.onerror = (error) => {
        console.error(`❌ SSE error for match ${matchId}:`, error);
        this.handleConnectionError(matchId);
      };

      this.activeConnections.set(matchId, {
        eventSource,
        subscribers: 1,
        lastActivity: Date.now(),
        createdAt: Date.now()
      });

    } catch (error) {
      console.error(`Failed to create SSE connection for match ${matchId}:`, error);
    }
  }

  /**
   * Handle incoming live updates and notify relevant subscribers
   */
  handleLiveUpdate(matchId, data) {
    const connection = this.activeConnections.get(matchId);
    if (connection) {
      connection.lastActivity = Date.now();
    }

    console.log(`📡 Live update for match ${matchId}:`, data.type || 'update');
    
    // Notify all subscribers for this match
    for (const [componentId, subscription] of this.subscribers.entries()) {
      if (subscription.matchId === matchId) {
        try {
          subscription.callback(data);
        } catch (error) {
          console.error(`Error in live update callback for ${componentId}:`, error);
        }
      }
    }
  }

  /**
   * Handle connection errors with automatic cleanup
   */
  handleConnectionError(matchId) {
    console.warn(`Connection error for match ${matchId}, cleaning up...`);
    this.closeConnection(matchId);
    
    // Try to reconnect if there are still subscribers
    const hasSubscribers = Array.from(this.subscribers.values())
      .some(sub => sub.matchId === matchId);
    
    if (hasSubscribers) {
      console.log(`🔄 Attempting to reconnect to match ${matchId}...`);
      setTimeout(() => this.ensureConnection(matchId), 5000);
    }
  }

  /**
   * Schedule connection cleanup after inactivity
   */
  scheduleConnectionCleanup(matchId) {
    setTimeout(() => {
      const hasSubscribers = Array.from(this.subscribers.values())
        .some(sub => sub.matchId === matchId);
      
      if (!hasSubscribers) {
        console.log(`🧹 Cleaning up unused connection for match ${matchId}`);
        this.closeConnection(matchId);
      }
    }, this.connectionTimeout);
  }

  /**
   * Close SSE connection for a match
   */
  closeConnection(matchId) {
    const connection = this.activeConnections.get(matchId);
    if (connection) {
      connection.eventSource.close();
      this.activeConnections.delete(matchId);
      console.log(`🔌 SSE connection closed for match ${matchId}`);
    }
  }

  /**
   * Broadcast update to other tabs/windows (optional)
   */
  broadcastUpdate(matchId, data) {
    try {
      localStorage.setItem(`match_update_${matchId}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      // Clean up old localStorage entries
      setTimeout(() => {
        localStorage.removeItem(`match_update_${matchId}`);
      }, 5000);
    } catch (error) {
      console.warn('Failed to broadcast update via localStorage:', error);
    }
  }

  /**
   * Get connection status for debugging
   */
  getStatus() {
    return {
      activeConnections: this.activeConnections.size,
      subscribers: this.subscribers.size,
      connections: Array.from(this.activeConnections.entries()).map(([matchId, conn]) => ({
        matchId,
        subscribers: conn.subscribers,
        uptime: Date.now() - conn.createdAt,
        lastActivity: Date.now() - conn.lastActivity
      }))
    };
  }

  /**
   * Cleanup all connections (called on page unload)
   */
  cleanup() {
    console.log('🧹 MatchLiveSync cleanup - closing all connections');
    for (const [matchId] of this.activeConnections) {
      this.closeConnection(matchId);
    }
    this.subscribers.clear();
  }
}

// Create singleton instance
const matchLiveSync = new MatchLiveSync();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    matchLiveSync.cleanup();
  });
}

export default matchLiveSync;