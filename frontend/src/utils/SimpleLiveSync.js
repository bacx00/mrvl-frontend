/**
 * SimpleLiveSync - Pure localStorage events between LiveScoring Panel and MatchDetailPage
 * No SSE, no WebSocket, no complex services - just localStorage events
 */

class SimpleLiveSync {
  constructor() {
    this.listeners = new Map(); // componentId -> callback
    this.handleStorageChange = this.handleStorageChange.bind(this);
    
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.handleStorageChange);
    }
    
    console.log('📦 SimpleLiveSync initialized - Pure localStorage events');
  }

  /**
   * Subscribe to live updates for a match
   */
  subscribe(componentId, matchId, callback) {
    if (!componentId || !matchId || typeof callback !== 'function') {
      console.error('SimpleLiveSync: Invalid subscription parameters');
      return;
    }

    this.listeners.set(componentId, { matchId, callback });
    console.log(`✅ ${componentId} subscribed to match ${matchId} localStorage updates`);
    
    return () => this.unsubscribe(componentId);
  }

  /**
   * Unsubscribe from live updates
   */
  unsubscribe(componentId) {
    this.listeners.delete(componentId);
    console.log(`❌ ${componentId} unsubscribed from live updates`);
  }

  /**
   * Broadcast score update via localStorage
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
      console.error('SimpleLiveSync broadcast error:', error);
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
      
      // Notify all listeners for this match
      for (const [componentId, listener] of this.listeners.entries()) {
        if (listener.matchId === matchId) {
          try {
            listener.callback(payload.data);
            console.log(`📥 Notified ${componentId} of match ${matchId} update`);
          } catch (error) {
            console.error(`Error notifying ${componentId}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('SimpleLiveSync storage parse error:', error);
    }
  }

  /**
   * Clean up
   */
  cleanup() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
    }
    this.listeners.clear();
    console.log('🧹 SimpleLiveSync cleaned up');
  }
}

// Create singleton
const simpleLiveSync = new SimpleLiveSync();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    simpleLiveSync.cleanup();
  });
}

export default simpleLiveSync;