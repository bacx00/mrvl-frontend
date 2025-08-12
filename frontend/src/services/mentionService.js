import api from '../utils/api';

class MentionService {
  constructor() {
    this.listeners = new Map();
    this.websocket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  // Initialize WebSocket connection for real-time updates
  initializeWebSocket() {
    try {
      // In a real implementation, this would connect to Laravel Echo/Pusher
      // For now, we'll simulate the connection
      console.log('Initializing mention WebSocket connection...');
      
      // Simulate connection success
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Setup heartbeat to maintain connection
      this.setupHeartbeat();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      this.handleConnectionError();
      return Promise.reject(error);
    }
  }

  // Subscribe to mention updates for a specific entity
  subscribe(entityType, entityId, callback) {
    const key = `${entityType}-${entityId}`;
    
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key).add(callback);

    // Initialize WebSocket if not already connected
    if (!this.isConnected) {
      this.initializeWebSocket();
    }

    console.log(`Subscribed to mentions for ${entityType} ${entityId}`);
    
    // Return unsubscribe function
    return () => this.unsubscribe(entityType, entityId, callback);
  }

  // Unsubscribe from mention updates
  unsubscribe(entityType, entityId, callback) {
    const key = `${entityType}-${entityId}`;
    
    if (this.listeners.has(key)) {
      this.listeners.get(key).delete(callback);
      
      // Remove the key if no more listeners
      if (this.listeners.get(key).size === 0) {
        this.listeners.delete(key);
      }
    }
    
    console.log(`Unsubscribed from mentions for ${entityType} ${entityId}`);
  }

  // Simulate receiving a mention update (in real implementation, this would come from WebSocket)
  simulateMentionUpdate(entityType, entityId, updateType, data) {
    const key = `${entityType}-${entityId}`;
    
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        callback({
          type: updateType,
          entityType,
          entityId,
          data
        });
      });
    }
  }

  // Handle incoming WebSocket messages
  handleMessage(message) {
    try {
      const data = typeof message === 'string' ? JSON.parse(message) : message;
      
      if (data.type === 'mention.created' || data.type === 'mention.deleted') {
        this.handleMentionUpdate(data);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  // Handle mention updates from WebSocket
  handleMentionUpdate(data) {
    // Determine which entities were mentioned
    const entities = [];
    
    if (data.mentioned_user) {
      entities.push({ type: 'user', id: data.mentioned_user.id });
    }
    
    if (data.content) {
      if (data.content.type === 'team') {
        entities.push({ type: 'team', id: data.content.id });
      } else if (data.content.type === 'player') {
        entities.push({ type: 'player', id: data.content.id });
      }
    }

    // Notify all relevant listeners
    entities.forEach(entity => {
      const key = `${entity.type}-${entity.id}`;
      
      if (this.listeners.has(key)) {
        this.listeners.get(key).forEach(callback => {
          callback({
            type: data.type,
            entityType: entity.type,
            entityId: entity.id,
            data: data
          });
        });
      }
    });
  }

  // Setup heartbeat to maintain WebSocket connection
  setupHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        // Send ping to maintain connection
        this.ping();
      }
    }, 30000); // 30 seconds
  }

  // Send ping to server
  ping() {
    try {
      // In real implementation, send ping through WebSocket
      console.log('Sending WebSocket ping...');
    } catch (error) {
      console.error('Failed to send ping:', error);
      this.handleConnectionError();
    }
  }

  // Handle connection errors
  handleConnectionError() {
    this.isConnected = false;
    
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeWebSocket();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached. Giving up.');
    }
  }

  // API methods for mention data
  async getMentionCounts(entityType, entityId, period = 'all') {
    try {
      const response = await api.get(`/mentions/${entityType}/${entityId}/counts`, {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mention counts:', error);
      throw error;
    }
  }

  async getRecentMentions(entityType, entityId, limit = 10) {
    try {
      const response = await api.get(`/mentions/${entityType}/${entityId}/recent`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent mentions:', error);
      throw error;
    }
  }

  async createMentions(content, mentionableType, mentionableId, mentionedBy) {
    try {
      const response = await api.post('/mentions/create', {
        content,
        mentionable_type: mentionableType,
        mentionable_id: mentionableId,
        mentioned_by: mentionedBy
      });
      return response.data;
    } catch (error) {
      console.error('Error creating mentions:', error);
      throw error;
    }
  }

  async deleteMentions(mentionableType, mentionableId) {
    try {
      const response = await api.delete('/mentions/delete', {
        data: {
          mentionable_type: mentionableType,
          mentionable_id: mentionableId
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting mentions:', error);
      throw error;
    }
  }

  // Cleanup method
  disconnect() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
    
    this.isConnected = false;
    this.listeners.clear();
    
    console.log('Mention service disconnected');
  }
}

// Create singleton instance
const mentionService = new MentionService();

export default mentionService;