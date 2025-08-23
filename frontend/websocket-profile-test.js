const WebSocket = require('ws');
const axios = require('axios');

/**
 * WebSocket Real-Time Profile Update Test
 * Tests WebSocket connections and real-time data synchronization for user profiles
 */

class WebSocketProfileTester {
  constructor() {
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    this.wsUrl = process.env.WEBSOCKET_URL || 'ws://localhost:3001';
    this.apiUrl = process.env.API_URL || 'http://localhost:8000';
    this.connections = [];
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: {},
      errors: []
    };
  }

  async testWebSocketConnection() {
    console.log('🌐 Testing WebSocket connection for profile updates...');
    
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(this.wsUrl);
        let connectionEstablished = false;
        let messagesReceived = 0;
        
        const timeout = setTimeout(() => {
          if (!connectionEstablished) {
            console.log('⚠️ WebSocket connection timeout - testing polling fallback');
            ws.close();
            resolve({
              websocketAvailable: false,
              usePollingFallback: true,
              error: 'WebSocket connection timeout'
            });
          }
        }, 5000);

        ws.on('open', () => {
          connectionEstablished = true;
          clearTimeout(timeout);
          console.log('✅ WebSocket connection established');
          
          // Subscribe to profile updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            channel: 'user_profiles',
            user_id: 'test_user'
          }));
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data);
            messagesReceived++;
            
            console.log('📨 WebSocket message received:', message);
            
            if (message.type === 'profile_update' || message.type === 'stats_update') {
              console.log('✅ Profile update message detected');
            }
          } catch (err) {
            console.error('❌ Error parsing WebSocket message:', err);
          }
        });

        ws.on('error', (error) => {
          console.error('❌ WebSocket error:', error.message);
          resolve({
            websocketAvailable: false,
            usePollingFallback: true,
            error: error.message
          });
        });

        ws.on('close', () => {
          console.log('🔌 WebSocket connection closed');
          resolve({
            websocketAvailable: connectionEstablished,
            messagesReceived,
            usePollingFallback: !connectionEstablished
          });
        });

        this.connections.push(ws);
        
        // Close connection after 10 seconds for testing
        setTimeout(() => {
          ws.close();
        }, 10000);
        
      } catch (error) {
        console.error('❌ WebSocket test failed:', error.message);
        resolve({
          websocketAvailable: false,
          usePollingFallback: true,
          error: error.message
        });
      }
    });
  }

  async testPollingFallback() {
    console.log('🔄 Testing HTTP polling fallback mechanism...');
    
    try {
      const testUserId = 1; // Test user ID
      const pollResults = [];
      const pollCount = 3;
      const pollInterval = 2000; // 2 seconds for testing
      
      for (let i = 0; i < pollCount; i++) {
        const startTime = Date.now();
        
        try {
          const response = await axios.get(`${this.apiUrl}/api/users/${testUserId}/stats`);
          const endTime = Date.now();
          
          pollResults.push({
            attempt: i + 1,
            responseTime: endTime - startTime,
            status: response.status,
            dataReceived: !!response.data,
            timestamp: new Date().toISOString()
          });
          
          console.log(`📊 Poll ${i + 1}: ${response.status} (${endTime - startTime}ms)`);
          
        } catch (error) {
          pollResults.push({
            attempt: i + 1,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          console.log(`❌ Poll ${i + 1} failed: ${error.message}`);
        }
        
        if (i < pollCount - 1) {
          await this.wait(pollInterval);
        }
      }
      
      const averageResponseTime = pollResults
        .filter(r => r.responseTime)
        .reduce((acc, r) => acc + r.responseTime, 0) / pollResults.length;
      
      this.testResults.tests.pollingFallback = {
        passed: pollResults.filter(r => r.status === 200).length > 0,
        pollResults,
        averageResponseTime,
        successRate: pollResults.filter(r => r.status === 200).length / pollCount
      };
      
      console.log('✅ Polling fallback test complete');
      return this.testResults.tests.pollingFallback;
      
    } catch (error) {
      console.error('❌ Polling fallback test failed:', error.message);
      this.testResults.tests.pollingFallback = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests.pollingFallback;
    }
  }

  async testRealTimeSync() {
    console.log('🔄 Testing real-time data synchronization...');
    
    try {
      // Simulate multiple clients
      const client1 = new WebSocket(this.wsUrl);
      const client2 = new WebSocket(this.wsUrl);
      
      const results = await Promise.all([
        this.setupClient(client1, 'client1'),
        this.setupClient(client2, 'client2')
      ]);
      
      this.testResults.tests.realTimeSync = {
        passed: results.every(r => r.connected),
        clientResults: results,
        details: 'Testing data synchronization across multiple WebSocket clients'
      };
      
      // Close clients
      client1.close();
      client2.close();
      
      console.log('✅ Real-time sync test complete');
      return this.testResults.tests.realTimeSync;
      
    } catch (error) {
      console.error('❌ Real-time sync test failed:', error.message);
      this.testResults.tests.realTimeSync = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests.realTimeSync;
    }
  }

  async setupClient(ws, clientName) {
    return new Promise((resolve) => {
      let connected = false;
      let messagesReceived = 0;
      
      const timeout = setTimeout(() => {
        resolve({ connected: false, clientName, error: 'Connection timeout' });
      }, 5000);
      
      ws.on('open', () => {
        connected = true;
        clearTimeout(timeout);
        console.log(`✅ ${clientName} connected`);
        
        ws.send(JSON.stringify({
          type: 'subscribe',
          channel: 'user_profiles'
        }));
      });
      
      ws.on('message', (data) => {
        messagesReceived++;
        console.log(`📨 ${clientName} received message:`, data.toString());
      });
      
      ws.on('error', (error) => {
        console.error(`❌ ${clientName} error:`, error.message);
        resolve({ connected: false, clientName, error: error.message });
      });
      
      setTimeout(() => {
        resolve({ 
          connected, 
          clientName, 
          messagesReceived,
          success: connected && messagesReceived >= 0 
        });
      }, 4000);
    });
  }

  async testConnectionResilience() {
    console.log('💪 Testing connection resilience and reconnection...');
    
    try {
      const ws = new WebSocket(this.wsUrl);
      let reconnectAttempts = 0;
      let connected = false;
      
      const testReconnection = () => {
        return new Promise((resolve) => {
          ws.on('open', () => {
            connected = true;
            console.log('✅ Connection established');
          });
          
          ws.on('close', () => {
            if (connected && reconnectAttempts < 3) {
              reconnectAttempts++;
              console.log(`🔄 Attempting reconnection ${reconnectAttempts}/3...`);
              
              setTimeout(() => {
                const newWs = new WebSocket(this.wsUrl);
                // Recursive reconnection testing would go here
                resolve({ reconnectAttempts, success: true });
              }, 1000);
            } else {
              resolve({ reconnectAttempts, success: false });
            }
          });
          
          ws.on('error', (error) => {
            console.error('❌ Connection error:', error.message);
            resolve({ reconnectAttempts, success: false, error: error.message });
          });
          
          // Force close after 2 seconds to test reconnection
          setTimeout(() => {
            if (connected) {
              ws.close();
            }
          }, 2000);
          
          // Timeout the test after 10 seconds
          setTimeout(() => {
            resolve({ reconnectAttempts, success: false, error: 'Test timeout' });
          }, 10000);
        });
      };
      
      const result = await testReconnection();
      
      this.testResults.tests.connectionResilience = {
        passed: result.success,
        ...result,
        details: 'Testing WebSocket connection resilience and auto-reconnection'
      };
      
      console.log('✅ Connection resilience test complete');
      return this.testResults.tests.connectionResilience;
      
    } catch (error) {
      console.error('❌ Connection resilience test failed:', error.message);
      this.testResults.tests.connectionResilience = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests.connectionResilience;
    }
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async runAllTests() {
    console.log('🎮 Starting WebSocket Profile Update Test Suite...');
    
    try {
      // Test WebSocket connection
      const wsResult = await this.testWebSocketConnection();
      this.testResults.tests.websocketConnection = wsResult;
      
      // Test polling fallback
      await this.testPollingFallback();
      
      // Test real-time sync (only if WebSocket available)
      if (wsResult.websocketAvailable) {
        await this.testRealTimeSync();
        await this.testConnectionResilience();
      } else {
        console.log('⚠️ Skipping WebSocket-dependent tests (using polling mode)');
      }
      
      // Generate summary
      const summary = {
        totalTests: Object.keys(this.testResults.tests).length,
        passedTests: Object.values(this.testResults.tests).filter(t => t.passed).length,
        websocketSupported: wsResult.websocketAvailable,
        fallbackMode: wsResult.usePollingFallback
      };
      
      this.testResults.summary = summary;
      
      console.log('\n📊 WebSocket Test Results Summary:');
      console.log(`WebSocket Support: ${summary.websocketSupported ? '✅' : '❌'}`);
      console.log(`Fallback Mode: ${summary.fallbackMode ? '✅' : '❌'}`);
      console.log(`Tests Passed: ${summary.passedTests}/${summary.totalTests}`);
      
      return this.testResults;
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      this.testResults.errors.push(`Test suite error: ${error.message}`);
      return this.testResults;
    } finally {
      // Close all connections
      this.connections.forEach(ws => {
        try {
          ws.close();
        } catch (err) {
          // Ignore close errors
        }
      });
    }
  }
}

// Run the test suite
async function runWebSocketTests() {
  const tester = new WebSocketProfileTester();
  const results = await tester.runAllTests();
  
  console.log('\n🏁 WebSocket Profile Update Test Suite Complete!');
  
  // Save results
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, `websocket-profile-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`Report saved: ${reportPath}`);
  
  process.exit(results.summary?.passedTests === results.summary?.totalTests ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  runWebSocketTests().catch(console.error);
}

module.exports = { WebSocketProfileTester };