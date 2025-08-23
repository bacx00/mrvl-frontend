class MentionService {
  constructor() {
    // Simple polling-based service for mention updates
    this.pollingIntervals = new Map();
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

  // Cleanup method
  disconnect() {
    // Clear all polling intervals
    this.pollingIntervals.forEach(interval => clearInterval(interval));
    this.pollingIntervals.clear();
  }
}

// Create singleton instance
const mentionService = new MentionService();

export default mentionService;