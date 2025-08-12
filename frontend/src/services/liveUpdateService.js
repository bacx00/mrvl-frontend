/**
 * Live Update Service - Professional Real-Time Connection Manager
 * 
 * Provides bulletproof WebSocket/SSE connections with:
 * - Automatic reconnection with exponential backoff
 * - Connection health monitoring
 * - Multiple transport fallbacks (WebSocket -> SSE -> Polling)
 * - Sub-second latency optimizations
 * - Memory leak prevention
 * - Error recovery and logging
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';

// Connection states
const CONNECTION_STATES = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting', 
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed'
};

// Transport types
const TRANSPORT_TYPES = {
  WEBSOCKET: 'websocket',
  SSE: 'sse', 
  POLLING: 'polling'
};

class LiveUpdateService {
  constructor() {
    this.connections = new Map();
    this.subscribers = new Map();
    this.reconnectAttempts = new Map();
    this.maxReconnectAttempts = 10;
    this.baseReconnectDelay = 1000; // Start with 1 second
    this.maxReconnectDelay = 30000; // Max 30 seconds
    this.heartbeatInterval = 25000; // 25 seconds
    this.connectionTimeout = 15000; // 15 seconds
    
    // Bind methods to maintain context
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.handleOnline = this.handleOnline.bind(this);
    this.handleOffline = this.handleOffline.bind(this);
    
    // Setup global event listeners
    this.setupGlobalListeners();
    
    console.log('🚀 LiveUpdateService initialized - Professional real-time connections ready');
  }

  /**
   * Setup global event listeners for connection management
   */
  setupGlobalListeners() {
    if (typeof window !== 'undefined') {
      // Handle page visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      
      // Handle network status changes
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Handle page unload
      window.addEventListener('beforeunload', () => {
        this.disconnectAll();
      });
    }
  }

  /**
   * Connect to live updates for a specific match with automatic transport selection
   * @param {number} matchId - Match ID to connect to
   * @param {Function} onUpdate - Callback for receiving updates
   * @param {Object} options - Connection options
   */
  async connectToMatch(matchId, onUpdate, options = {}) {
    const connectionKey = `match_${matchId}`;
    
    if (this.connections.has(connectionKey)) {
      console.log(`⚡ Already connected to match ${matchId}`);
      this.addSubscriber(connectionKey, onUpdate);
      return;
    }

    const connection = {
      matchId,
      connectionKey,
      state: CONNECTION_STATES.CONNECTING,
      transport: null,
      lastUpdate: Date.now(),
      options: {
        preferredTransport: options.transport || TRANSPORT_TYPES.SSE,
        enableHeartbeat: options.heartbeat !== false,
        enableReconnect: options.reconnect !== false,
        ...options
      },
      healthCheck: {
        lastPing: 0,
        lastPong: 0,
        missedHeartbeats: 0
      }
    };

    this.connections.set(connectionKey, connection);
    this.addSubscriber(connectionKey, onUpdate);
    
    try {
      await this.establishConnection(connection);
    } catch (error) {
      console.error(`❌ Failed to connect to match ${matchId}:`, error);
      this.handleConnectionError(connection, error);
    }
  }

  /**
   * Establish connection using the best available transport
   */
  async establishConnection(connection) {
    const { matchId, options } = connection;
    
    // Try transports in order of preference: SSE -> WebSocket -> Polling
    const transportPriority = [
      TRANSPORT_TYPES.SSE,
      TRANSPORT_TYPES.WEBSOCKET,
      TRANSPORT_TYPES.POLLING
    ];

    for (const transport of transportPriority) {
      if (options.preferredTransport && options.preferredTransport !== transport && transportPriority.indexOf(options.preferredTransport) < transportPriority.indexOf(transport)) {
        continue;
      }

      try {
        console.log(`🔌 Attempting ${transport.toUpperCase()} connection for match ${matchId}`);
        
        switch (transport) {
          case TRANSPORT_TYPES.SSE:
            await this.connectSSE(connection);
            break;
          case TRANSPORT_TYPES.WEBSOCKET:
            await this.connectWebSocket(connection);
            break;
          case TRANSPORT_TYPES.POLLING:
            await this.connectPolling(connection);
            break;
        }
        
        connection.transport = transport;
        connection.state = CONNECTION_STATES.CONNECTED;
        console.log(`✅ Successfully connected to match ${matchId} via ${transport.toUpperCase()}`);
        
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts.set(connection.connectionKey, 0);
        
        // Start heartbeat monitoring
        if (options.enableHeartbeat) {
          this.startHeartbeat(connection);
        }
        
        return; // Success, exit loop
        
      } catch (error) {
        console.error(`❌ ${transport.toUpperCase()} connection failed for match ${matchId}:`, error);
        this.closeConnection(connection, false);
      }
    }
    
    throw new Error(`All transport methods failed for match ${matchId}`);
  }

  /**
   * Connect using Server-Sent Events (SSE)
   */
  async connectSSE(connection) {
    return new Promise((resolve, reject) => {
      const { matchId, options } = connection;
      
      // SSE connections are now public for viewing live updates - no authentication required
      // Only admin updates require authentication, but viewing is open to all users
      console.log(`🌐 Creating public SSE connection for match ${matchId} (no auth required for viewing)`);
      
      // Build URL without token - SSE endpoint is public for live viewing
      const url = `${BACKEND_URL}/api/live-updates/${matchId}/stream`;
      
      const eventSource = new EventSource(url, {
        withCredentials: false // Changed to false since no authentication needed
      });

      let connectionTimeout = setTimeout(() => {
        reject(new Error('SSE connection timeout'));
      }, this.connectionTimeout);

      eventSource.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log(`📡 SSE connection established for match ${matchId}`);
        resolve();
      };

      eventSource.onmessage = (event) => {
        this.handleMessage(connection, event.data);
      };

      // Handle specific event types from backend
      const eventTypes = ['score-update', 'hero-update', 'stats-update', 'map-update', 'status-update', 'connected'];
      eventTypes.forEach(eventType => {
        eventSource.addEventListener(eventType, (event) => {
          this.handleMessage(connection, event.data, eventType);
        });
      });

      eventSource.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ SSE error for match ${matchId}:`, error);
        reject(error);
      };

      connection.transport_connection = eventSource;
    });
  }

  /**
   * Connect using WebSocket (fallback)
   */
  async connectWebSocket(connection) {
    return new Promise((resolve, reject) => {
      const { matchId } = connection;
      
      // WebSocket connections are now public for viewing live updates - no authentication required
      // Only admin updates require authentication, but viewing is open to all users
      console.log(`🌐 Creating public WebSocket connection for match ${matchId} (no auth required for viewing)`);
      
      // WebSocket URL would need to be implemented on backend - removed token requirement
      const wsUrl = `${BACKEND_URL.replace('http', 'ws')}/ws/match/${matchId}`;
      
      const ws = new WebSocket(wsUrl);
      
      let connectionTimeout = setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, this.connectionTimeout);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log(`🔌 WebSocket connection established for match ${matchId}`);
        
        // Send initial subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          match_id: matchId,
          channels: ['scores', 'heroes', 'stats']
        }));
        
        resolve();
      };

      ws.onmessage = (event) => {
        this.handleMessage(connection, event.data);
      };

      ws.onerror = (error) => {
        clearTimeout(connectionTimeout);
        console.error(`❌ WebSocket error for match ${matchId}:`, error);
        reject(error);
      };

      ws.onclose = (event) => {
        if (connection.state === CONNECTION_STATES.CONNECTED) {
          console.log(`🔌 WebSocket closed for match ${matchId}, attempting reconnect`);
          this.scheduleReconnect(connection);
        }
      };

      connection.transport_connection = ws;
    });
  }

  /**
   * Connect using polling (last resort)
   */
  async connectPolling(connection) {
    const { matchId } = connection;
    
    console.log(`⏰ Starting polling connection for match ${matchId}`);
    
    const pollInterval = setInterval(async () => {
      if (connection.state === CONNECTION_STATES.DISCONNECTED) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const headers = {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        };
        
        // Polling is now public for viewing live updates - no authentication required
        // Only admin updates require authentication, but viewing is open to all users
        
        const response = await fetch(`${BACKEND_URL}/api/live-updates/status/${matchId}`, {
          method: 'GET',
          headers,
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const data = await response.json();
          this.handleMessage(connection, JSON.stringify(data));
        } else {
          console.error(`❌ Polling failed for match ${matchId}:`, response.status, response.statusText);
          // Don't treat non-200 responses as authentication errors for public viewing
        }
      } catch (error) {
        console.error(`❌ Polling error for match ${matchId}:`, error);
        this.handleConnectionError(connection, error);
      }
    }, 1000); // Poll every second

    connection.transport_connection = pollInterval;
    connection.state = CONNECTION_STATES.CONNECTED;
    
    return Promise.resolve();
  }

  /**
   * Handle incoming messages from any transport
   */
  handleMessage(connection, data, eventType = null) {
    try {
      connection.lastUpdate = Date.now();
      connection.healthCheck.lastPong = Date.now();
      
      let parsedData;
      if (typeof data === 'string') {
        // Handle heartbeat messages
        if (data.trim() === '' || data.startsWith(':')) {
          return; // Ignore heartbeat/comment messages
        }
        
        parsedData = JSON.parse(data);
      } else {
        parsedData = data;
      }

      // Handle connection confirmation
      if (parsedData.status === 'connected') {
        console.log(`✅ Connection confirmed for match ${connection.matchId}`);
        return;
      }

      // Enhance data with metadata
      const enhancedData = {
        ...parsedData,
        matchId: connection.matchId,
        timestamp: Date.now(),
        transport: connection.transport,
        eventType: eventType || parsedData.type || 'update'
      };

      // Notify all subscribers
      this.notifySubscribers(connection.connectionKey, enhancedData);
      
    } catch (error) {
      console.error('❌ Error handling message:', error, data);
    }
  }

  /**
   * Add subscriber to connection
   */
  addSubscriber(connectionKey, callback) {
    if (!this.subscribers.has(connectionKey)) {
      this.subscribers.set(connectionKey, new Set());
    }
    this.subscribers.get(connectionKey).add(callback);
  }

  /**
   * Remove subscriber from connection
   */
  removeSubscriber(connectionKey, callback) {
    const subs = this.subscribers.get(connectionKey);
    if (subs) {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscribers.delete(connectionKey);
        // Close connection if no subscribers
        const connection = this.connections.get(connectionKey);
        if (connection) {
          this.closeConnection(connection);
        }
      }
    }
  }

  /**
   * Notify all subscribers of an update
   */
  notifySubscribers(connectionKey, data) {
    const subs = this.subscribers.get(connectionKey);
    if (subs) {
      subs.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in subscriber callback:', error);
        }
      });
    }
  }

  /**
   * Start heartbeat monitoring for connection health
   */
  startHeartbeat(connection) {
    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
    }

    connection.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - connection.lastUpdate;
      
      // If no update received in too long, consider connection dead
      if (timeSinceLastUpdate > this.heartbeatInterval * 2) {
        console.log(`💔 Heartbeat timeout for match ${connection.matchId}, reconnecting`);
        connection.healthCheck.missedHeartbeats++;
        
        if (connection.healthCheck.missedHeartbeats >= 3) {
          this.scheduleReconnect(connection);
        }
      }

      // Send ping for WebSocket connections
      if (connection.transport === TRANSPORT_TYPES.WEBSOCKET && connection.transport_connection.readyState === WebSocket.OPEN) {
        connection.transport_connection.send(JSON.stringify({ type: 'ping' }));
        connection.healthCheck.lastPing = now;
      }
    }, this.heartbeatInterval);
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect(connection) {
    if (!connection.options.enableReconnect || connection.state === CONNECTION_STATES.RECONNECTING) {
      return;
    }

    const attempts = this.reconnectAttempts.get(connection.connectionKey) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.error(`❌ Max reconnection attempts reached for match ${connection.matchId}`);
      connection.state = CONNECTION_STATES.FAILED;
      this.notifySubscribers(connection.connectionKey, {
        type: 'connection_failed',
        matchId: connection.matchId,
        message: 'Maximum reconnection attempts exceeded'
      });
      return;
    }

    connection.state = CONNECTION_STATES.RECONNECTING;
    this.reconnectAttempts.set(connection.connectionKey, attempts + 1);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (capped)
    const delay = Math.min(this.baseReconnectDelay * Math.pow(2, attempts), this.maxReconnectDelay);
    
    console.log(`🔄 Scheduling reconnect for match ${connection.matchId} in ${delay}ms (attempt ${attempts + 1})`);
    
    setTimeout(async () => {
      try {
        // Close existing connection first
        this.closeConnection(connection, false);
        
        // Attempt to re-establish connection
        await this.establishConnection(connection);
        
      } catch (error) {
        console.error(`❌ Reconnection failed for match ${connection.matchId}:`, error);
        this.scheduleReconnect(connection); // Try again
      }
    }, delay);
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(connection, error) {
    console.error(`❌ Connection error for match ${connection.matchId}:`, error);
    
    connection.state = CONNECTION_STATES.FAILED;
    
    this.notifySubscribers(connection.connectionKey, {
      type: 'connection_error',
      matchId: connection.matchId,
      error: error.message,
      timestamp: Date.now()
    });

    // Attempt reconnection if enabled
    if (connection.options.enableReconnect) {
      this.scheduleReconnect(connection);
    }
  }

  /**
   * Close a specific connection
   */
  closeConnection(connection, removeFromMap = true) {
    if (connection.heartbeatTimer) {
      clearInterval(connection.heartbeatTimer);
      connection.heartbeatTimer = null;
    }

    if (connection.transport_connection) {
      try {
        switch (connection.transport) {
          case TRANSPORT_TYPES.SSE:
            connection.transport_connection.close();
            break;
          case TRANSPORT_TYPES.WEBSOCKET:
            connection.transport_connection.close();
            break;
          case TRANSPORT_TYPES.POLLING:
            clearInterval(connection.transport_connection);
            break;
        }
      } catch (error) {
        console.error('Error closing transport connection:', error);
      }
      connection.transport_connection = null;
    }

    connection.state = CONNECTION_STATES.DISCONNECTED;

    if (removeFromMap) {
      this.connections.delete(connection.connectionKey);
      this.subscribers.delete(connection.connectionKey);
      this.reconnectAttempts.delete(connection.connectionKey);
    }
  }

  /**
   * Disconnect from match updates
   */
  disconnectFromMatch(matchId, callback = null) {
    const connectionKey = `match_${matchId}`;
    
    if (callback) {
      this.removeSubscriber(connectionKey, callback);
    } else {
      // Remove all subscribers and close connection
      const connection = this.connections.get(connectionKey);
      if (connection) {
        this.closeConnection(connection);
      }
    }
  }

  /**
   * Disconnect all connections
   */
  disconnectAll() {
    console.log('🔌 Disconnecting all live update connections');
    
    this.connections.forEach(connection => {
      this.closeConnection(connection, false);
    });
    
    this.connections.clear();
    this.subscribers.clear();
    this.reconnectAttempts.clear();
  }

  /**
   * Handle page visibility changes
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page hidden - reduce update frequency or pause connections
      console.log('📱 Page hidden - reducing update frequency');
    } else {
      // Page visible - resume normal operation and force refresh
      console.log('📱 Page visible - resuming normal updates');
      this.connections.forEach(connection => {
        if (connection.state === CONNECTION_STATES.FAILED) {
          this.scheduleReconnect(connection);
        }
      });
    }
  }

  /**
   * Handle online/offline status
   */
  handleOnline() {
    console.log('🌐 Network back online - attempting to reconnect');
    this.connections.forEach(connection => {
      if (connection.state === CONNECTION_STATES.FAILED) {
        this.scheduleReconnect(connection);
      }
    });
  }

  handleOffline() {
    console.log('🌐 Network offline - connections will attempt to reconnect when online');
  }

  /**
   * Get connection status for a match
   */
  getConnectionStatus(matchId) {
    const connectionKey = `match_${matchId}`;
    const connection = this.connections.get(connectionKey);
    
    if (!connection) {
      return { status: CONNECTION_STATES.DISCONNECTED };
    }

    return {
      status: connection.state,
      transport: connection.transport,
      lastUpdate: connection.lastUpdate,
      reconnectAttempts: this.reconnectAttempts.get(connectionKey) || 0,
      healthCheck: connection.healthCheck
    };
  }

  /**
   * Force reconnection for a match
   */
  forceReconnect(matchId) {
    const connectionKey = `match_${matchId}`;
    const connection = this.connections.get(connectionKey);
    
    if (connection) {
      console.log(`🔄 Forcing reconnection for match ${matchId}`);
      this.scheduleReconnect(connection);
    }
  }

  /**
   * Get debug information
   */
  getDebugInfo() {
    const connectionInfo = {};
    this.connections.forEach((connection, key) => {
      connectionInfo[key] = {
        state: connection.state,
        transport: connection.transport,
        lastUpdate: connection.lastUpdate,
        reconnectAttempts: this.reconnectAttempts.get(key) || 0,
        subscriberCount: this.subscribers.get(key)?.size || 0
      };
    });

    return {
      totalConnections: this.connections.size,
      connections: connectionInfo,
      totalSubscribers: Array.from(this.subscribers.values()).reduce((sum, subs) => sum + subs.size, 0)
    };
  }

  /**
   * Cleanup on service destruction
   */
  cleanup() {
    this.disconnectAll();
    
    if (typeof window !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    console.log('🧹 LiveUpdateService cleaned up');
  }
}

// Create singleton instance
const liveUpdateService = new LiveUpdateService();

// Export both instance and class
export default liveUpdateService;
export { LiveUpdateService, CONNECTION_STATES, TRANSPORT_TYPES };

// For debugging in browser console
if (typeof window !== 'undefined') {
  window.liveUpdateService = liveUpdateService;
}