// Real-time updates using Server-Sent Events (SSE)
// Provides immediate updates without external dependencies

class RealtimeManager {
  constructor() {
    this.connections = new Map();
    this.pollingIntervals = new Map();
    this.reconnectTimeouts = new Map();
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
  }

  // Subscribe to match updates via SSE
  subscribeToMatch(matchId, callbacks) {
    const key = `match-${matchId}`;
    
    // Close existing connection if any
    this.unsubscribeFromMatch(matchId);
    
    // Create new EventSource connection to the public SSE endpoint
    const eventSource = new EventSource(`${this.baseUrl}/api/public/matches/${matchId}/live-stream`);
    
    // Store connection
    this.connections.set(key, eventSource);
    
    // Debug: Log readyState changes
    console.log('🔄 SSE: Connecting to match', matchId);

    // Handle different event types
    eventSource.addEventListener('score-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📊 SSE: Score update received', data);
        if (callbacks.onScoreUpdate) {
          callbacks.onScoreUpdate(data);
        }
      } catch (error) {
        console.error('❌ SSE: Error parsing score update', error);
      }
    });

    eventSource.addEventListener('hero-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🦸 SSE: Hero update received', data);
        if (callbacks.onHeroUpdate) {
          callbacks.onHeroUpdate(data);
        }
      } catch (error) {
        console.error('❌ SSE: Error parsing hero update', error);
      }
    });

    eventSource.addEventListener('stats-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📈 SSE: Stats update received', data);
        if (callbacks.onStatsUpdate) {
          callbacks.onStatsUpdate(data);
        }
      } catch (error) {
        console.error('❌ SSE: Error parsing stats update', error);
      }
    });

    eventSource.addEventListener('map-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('🗺️ SSE: Map update received', data);
        if (callbacks.onMapUpdate) {
          callbacks.onMapUpdate(data);
        }
      } catch (error) {
        console.error('❌ SSE: Error parsing map update', error);
      }
    });

    eventSource.addEventListener('status-update', (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('📢 SSE: Status update received', data);
        if (callbacks.onStatusUpdate) {
          callbacks.onStatusUpdate(data);
        }
      } catch (error) {
        console.error('❌ SSE: Error parsing status update', error);
      }
    });

    // Handle connection events
    eventSource.onopen = () => {
      console.log('✅ SSE: Connected to match', matchId);
      if (callbacks.onConnect) {
        callbacks.onConnect();
      }
    };

    eventSource.onerror = (error) => {
      console.error('❌ SSE: Connection error for match', matchId, error);
      
      // Check if this is a network error or server error
      if (eventSource.readyState === EventSource.CONNECTING) {
        console.log('🔄 SSE: Reconnecting...');
      } else if (eventSource.readyState === EventSource.CLOSED) {
        console.log('❌ SSE: Connection closed');
      }
      
      if (callbacks.onError) {
        callbacks.onError(error);
      }
      
      // Don't reconnect if the connection was explicitly closed
      if (eventSource.readyState !== EventSource.CLOSED) {
        // Reconnect after 5 seconds
        const existingTimeout = this.reconnectTimeouts.get(key);
        
        // Clear any existing timeout
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }
        
        this.reconnectTimeouts.set(key, setTimeout(() => {
          console.log('🔄 SSE: Attempting reconnection for match', matchId);
          this.subscribeToMatch(matchId, callbacks);
        }, 5000));
      }
    };

    return eventSource;
  }

  // Unsubscribe from match updates
  unsubscribeFromMatch(matchId) {
    const key = `match-${matchId}`;
    const connection = this.connections.get(key);
    
    if (connection) {
      connection.close();
      this.connections.delete(key);
      console.log('🔌 SSE: Disconnected from match', matchId);
    }

    // Clear reconnect timeout
    const timeout = this.reconnectTimeouts.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.reconnectTimeouts.delete(key);
    }
  }

  // Send immediate update to backend (for admin actions)
  async sendUpdate(matchId, updateType, data) {
    try {
      const response = await fetch(`${this.baseUrl}/api/admin/matches/${matchId}/live-update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          type: updateType,
          data: data,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send update: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ Update sent successfully', result);
      return result;
    } catch (error) {
      console.error('❌ Error sending update', error);
      throw error;
    }
  }

  // Polling fallback for browsers that don't support SSE
  startPolling(matchId, callbacks, interval = 1000) {
    const key = `match-${matchId}`;
    
    // Stop existing polling
    this.stopPolling(matchId);
    
    const poll = async () => {
      try {
        const response = await fetch(`${this.baseUrl}/api/public/matches/${matchId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Trigger appropriate callbacks based on data changes
          if (callbacks.onScoreUpdate && data.scores) {
            callbacks.onScoreUpdate(data.scores);
          }
          if (callbacks.onStatsUpdate && data.player_stats) {
            callbacks.onStatsUpdate(data.player_stats);
          }
          if (callbacks.onStatusUpdate && data.status) {
            callbacks.onStatusUpdate({ status: data.status });
          }
        }
      } catch (error) {
        console.error('❌ Polling error', error);
      }
    };

    // Start polling
    const intervalId = setInterval(poll, interval);
    this.pollingIntervals.set(key, intervalId);
    
    // Initial poll
    poll();
  }

  stopPolling(matchId) {
    const key = `match-${matchId}`;
    const intervalId = this.pollingIntervals.get(key);
    
    if (intervalId) {
      clearInterval(intervalId);
      this.pollingIntervals.delete(key);
    }
  }

  // Clean up all connections
  cleanup() {
    // Close all SSE connections
    this.connections.forEach((connection, key) => {
      if (connection instanceof EventSource) {
        connection.close();
      }
    });
    this.connections.clear();

    // Clear all polling intervals
    this.pollingIntervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.pollingIntervals.clear();

    // Clear all timeouts
    this.reconnectTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.reconnectTimeouts.clear();
  }
}

// Create singleton instance
const realtimeManager = new RealtimeManager();

// Export convenience functions
export const subscribeToMatch = (matchId, callbacks) => {
  return realtimeManager.subscribeToMatch(matchId, callbacks);
};

export const unsubscribeFromMatch = (matchId) => {
  realtimeManager.unsubscribeFromMatch(matchId);
};

export const sendLiveUpdate = async (matchId, updateType, data) => {
  return realtimeManager.sendUpdate(matchId, updateType, data);
};

export const startPolling = (matchId, callbacks, interval) => {
  realtimeManager.startPolling(matchId, callbacks, interval);
};

export const stopPolling = (matchId) => {
  realtimeManager.stopPolling(matchId);
};

export const cleanup = () => {
  realtimeManager.cleanup();
};

export default realtimeManager;