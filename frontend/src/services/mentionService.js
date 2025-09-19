class MentionService {
  constructor() {
    // Simple polling-based service for mention updates
    this.pollingIntervals = new Map();
    // Event listeners for real-time updates
    this.eventListeners = new Map();
  }

  // Subscribe to mention updates for a specific entity (polling-based)
  subscribe(entityType, entityId, callback, intervalMs = 30000) {
    const key = `${entityType}-${entityId}`;
    
    // Clear any existing interval for this entity
    if (this.pollingIntervals.has(key)) {
      clearInterval(this.pollingIntervals.get(key));
    }
    
    // Set up polling interval
    const interval = setInterval(() => {
      callback({ type: 'refresh' });
    }, intervalMs);
    
    this.pollingIntervals.set(key, interval);
    
    // Return unsubscribe function
    return () => this.unsubscribe(entityType, entityId);
  }

  // Unsubscribe from mention updates
  unsubscribe(entityType, entityId) {
    const key = `${entityType}-${entityId}`;
    
    if (this.pollingIntervals.has(key)) {
      clearInterval(this.pollingIntervals.get(key));
      this.pollingIntervals.delete(key);
    }
  }

  // Trigger mention deletion event
  notifyMentionDeleted(mentionId, entityType, entityId) {
    const key = `${entityType}-${entityId}`;

    if (this.eventListeners.has(key)) {
      const listeners = this.eventListeners.get(key);
      listeners.forEach(callback => {
        callback({
          type: 'mention_deleted',
          mentionId,
          entityType,
          entityId
        });
      });
    }
  }

  // Add event listener for mention updates
  addEventListener(entityType, entityId, callback) {
    const key = `${entityType}-${entityId}`;

    if (!this.eventListeners.has(key)) {
      this.eventListeners.set(key, new Set());
    }

    this.eventListeners.get(key).add(callback);

    return () => {
      const listeners = this.eventListeners.get(key);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(key);
        }
      }
    };
  }

  // Cleanup method
  disconnect() {
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
    // Clear all event listeners
    this.eventListeners.clear();
  }
}

// Create singleton instance
const mentionService = new MentionService();

export default mentionService;