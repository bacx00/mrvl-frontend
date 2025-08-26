import axios from 'axios';

const API_BASE_URL = window.location.hostname === 'status.mrvl.net' 
  ? 'https://staging.mrvl.net/api' 
  : (process.env.REACT_APP_API_URL || 'http://localhost:8000/api');

class StatusService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30000; // 30 seconds cache
  }

  // Check endpoint health
  async checkEndpointHealth(endpoint, timeout = 5000) {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${API_BASE_URL}${endpoint}/health`, {
        timeout,
        validateStatus: () => true // Accept any status
      });
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: response.status < 300 ? 'operational' : 
                response.status < 500 ? 'degraded' : 'major',
        responseTime,
        statusCode: response.status,
        timestamp: new Date(),
        details: response.data
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'major',
        responseTime,
        statusCode: 0,
        timestamp: new Date(),
        error: error.message,
        details: null
      };
    }
  }

  // Batch health check for multiple endpoints
  async batchHealthCheck(endpoints) {
    const checks = endpoints.map(endpoint => 
      this.checkEndpointHealth(endpoint.path || endpoint)
    );
    
    const results = await Promise.allSettled(checks);
    
    return results.map((result, index) => ({
      endpoint: endpoints[index],
      ...result.value || { status: 'unknown', error: result.reason }
    }));
  }

  // Get system metrics
  async getSystemMetrics() {
    try {
      const response = await axios.get(`${API_BASE_URL}/status/metrics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
      throw error; // Throw error - no mock data
    }
  }

  // Get uptime statistics
  async getUptimeStats(timeRange = '24h') {
    const cacheKey = `uptime_${timeRange}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }
    
    try {
      const response = await axios.get(`${API_BASE_URL}/status/uptime`, {
        params: { range: timeRange }
      });
      
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch uptime stats:', error);
      throw error; // Throw error - no mock data
    }
  }

  // Get incident history
  async getIncidents(limit = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/status/incidents`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      throw error; // Throw error - no mock data
    }
  }

  // Get response time history
  async getResponseTimeHistory(service, timeRange = '24h') {
    try {
      const response = await axios.get(`${API_BASE_URL}/status/response-times`, {
        params: { service, range: timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch response time history:', error);
      throw error; // Throw error - no mock data
    }
  }

  // Subscribe to status updates via WebSocket
  subscribeToUpdates(onUpdate) {
    const ws = new WebSocket(`ws://localhost:8000/status/subscribe`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onUpdate(data);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.subscribeToUpdates(onUpdate), 5000);
    };
    
    return () => ws.close();
  }


  // Report an issue
  async reportIssue(issue) {
    try {
      const response = await axios.post(`${API_BASE_URL}/status/report`, issue);
      return response.data;
    } catch (error) {
      console.error('Failed to report issue:', error);
      throw error;
    }
  }

  // Get maintenance schedule
  async getMaintenanceSchedule() {
    try {
      const response = await axios.get(`${API_BASE_URL}/status/maintenance`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch maintenance schedule:', error);
      throw error; // Throw error - no mock data
    }
  }
}

export default new StatusService();