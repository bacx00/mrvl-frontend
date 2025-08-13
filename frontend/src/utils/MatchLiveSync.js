/**
 * MatchLiveSync - Pure localStorage sync between MatchDetailPage and LiveScoring Panel
 * Simple, no SSE, no WebSocket - just localStorage events
 */

class MatchLiveSync {
  constructor() {
    this.subscribers = new Map(); // componentId -> { callback, matchId }
    this.handleStorageChange = this.handleStorageChange.bind(this);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
    
    console.log('📦 MatchLiveSync initialized - Pure localStorage sync');
  }

  /**
   * Subscribe to localStorage updates for a match
   */
  subscribe(componentId, matchId, callback) {
    if (!componentId || !matchId || typeof callback !== 'function') {
      console.error('MatchLiveSync: Invalid subscription parameters');
      return;
    }

    this.subscribers.set(componentId, { matchId, callback });
    console.log(`✅ ${componentId} subscribed to match ${matchId} localStorage updates`);
    
    return () => this.unsubscribe(componentId);
  }

  /**
   * Unsubscribe from localStorage updates
   */
  unsubscribe(componentId) {
    this.subscribers.delete(componentId);
    console.log(`❌ ${componentId} unsubscribed from live updates`);
  }

  /**
   * Broadcast update via localStorage
   */
  broadcast(matchId, data) {
    if (!matchId || !data) return;

    const payload = {
      matchId: parseInt(matchId),
      timestamp: Date.now(),
      data: data
    };

    try {
      localStorage.setItem(`live_match_${matchId}`, JSON.stringify(payload));
      console.log(`📤 Broadcast update for match ${matchId}:`, data);
    } catch (error) {
      console.error('MatchLiveSync broadcast error:', error);
    }
  }

  /**
   * Handle localStorage changes
   */
  handleStorageChange(event) {
    if (!event.key || !event.key.startsWith('live_match_') || !event.newValue) {
      return;
    }

    try {
      const matchId = parseInt(event.key.replace('live_match_', ''));
      const payload = JSON.parse(event.newValue);
      
      // Notify all subscribers for this match
      for (const [componentId, subscription] of this.subscribers.entries()) {
        if (subscription.matchId === matchId) {
          try {
            subscription.callback(payload.data);
            console.log(`📥 Notified ${componentId} of match ${matchId} update`);
          } catch (error) {
            console.error(`Error notifying ${componentId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('MatchLiveSync storage parse error:', error);
    }
  }

  /**
   * Clean up
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
    }
    this.subscribers.clear();
    console.log('🧹 MatchLiveSync cleaned up');
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