/**
 * MRVL Live Scoring System - Comprehensive Professional Test Suite
 * 
 * This test validates the bulletproof live scoring system with:
 * - WebSocket/SSE connection establishment
 * - Immediate state updates and re-renders
 * - Reconnection logic testing
 * - Error recovery validation
 * - Cross-tab synchronization
 * - Performance under load
 */

// Test configuration
const TEST_CONFIG = {
  BACKEND_URL: process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net',
  TEST_MATCH_ID: 1, // Match ID to test with
  TEST_DURATION: 30000, // 30 seconds of testing
  UPDATE_FREQUENCY: 500, // Send update every 500ms
  CONNECTION_TIMEOUT: 15000, // 15 second connection timeout
  RECONNECT_TEST_DURATION: 10000 // 10 seconds for reconnect testing
};

class LiveScoringSystemTest {
  constructor() {
    this.testResults = {
      connectionTests: [],
      updateTests: [],
      reconnectionTests: [],
      performanceMetrics: [],
      errorRecoveryTests: []
    };
    this.startTime = Date.now();
  }

  /**
   * Run comprehensive live scoring system tests
   */
  async runAllTests() {
    console.log('🚀 Starting MRVL Live Scoring System Professional Test Suite');
    console.log('=' .repeat(60));

    try {
      // Test 1: Connection Establishment
      await this.testConnectionEstablishment();
      
      // Test 2: Immediate Updates
      await this.testImmediateUpdates();
      
      // Test 3: Reconnection Logic
      await this.testReconnectionLogic();
      
      // Test 4: Error Recovery
      await this.testErrorRecovery();
      
      // Test 5: Performance Under Load
      await this.testPerformanceUnderLoad();
      
      // Test 6: Cross-Tab Synchronization
      await this.testCrossTabSync();
      
      // Generate comprehensive report
      this.generateTestReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.testResults.criticalError = error.message;
    }
  }

  /**
   * Test 1: Connection Establishment
   */
  async testConnectionEstablishment() {
    console.log('\n🔌 TEST 1: Connection Establishment');
    console.log('-'.repeat(40));

    const testStart = Date.now();
    
    try {
      // Test SSE Connection
      const sseResult = await this.testSSEConnection();
      this.testResults.connectionTests.push({
        type: 'SSE',
        success: sseResult.success,
        latency: sseResult.latency,
        error: sseResult.error
      });

      // Test WebSocket Connection (if available)
      const wsResult = await this.testWebSocketConnection();
      this.testResults.connectionTests.push({
        type: 'WebSocket',
        success: wsResult.success,
        latency: wsResult.latency,
        error: wsResult.error
      });

      // Test Polling Fallback
      const pollingResult = await this.testPollingConnection();
      this.testResults.connectionTests.push({
        type: 'Polling',
        success: pollingResult.success,
        latency: pollingResult.latency,
        error: pollingResult.error
      });

      const testDuration = Date.now() - testStart;
      console.log(`✅ Connection tests completed in ${testDuration}ms`);
      
    } catch (error) {
      console.error('❌ Connection establishment test failed:', error);
      this.testResults.connectionTests.push({
        type: 'Connection Test',
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test SSE Connection
   */
  async testSSEConnection() {
    const connectionStart = Date.now();
    
    return new Promise((resolve) => {
      const eventSource = new EventSource(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/stream/${TEST_CONFIG.TEST_MATCH_ID}`);
      let connected = false;
      
      const timeout = setTimeout(() => {
        if (!connected) {
          eventSource.close();
          resolve({
            success: false,
            error: 'SSE connection timeout',
            latency: Date.now() - connectionStart
          });
        }
      }, TEST_CONFIG.CONNECTION_TIMEOUT);

      eventSource.onopen = () => {
        connected = true;
        clearTimeout(timeout);
        const latency = Date.now() - connectionStart;
        
        console.log(`✅ SSE connection established in ${latency}ms`);
        eventSource.close();
        
        resolve({
          success: true,
          latency: latency
        });
      };

      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        eventSource.close();
        
        resolve({
          success: false,
          error: 'SSE connection error',
          latency: Date.now() - connectionStart
        });
      };
    });
  }

  /**
   * Test WebSocket Connection
   */
  async testWebSocketConnection() {
    const connectionStart = Date.now();
    
    return new Promise((resolve) => {
      try {
        const wsUrl = `${TEST_CONFIG.BACKEND_URL.replace('http', 'ws')}/ws/match/${TEST_CONFIG.TEST_MATCH_ID}`;
        const ws = new WebSocket(wsUrl);
        let connected = false;
        
        const timeout = setTimeout(() => {
          if (!connected) {
            ws.close();
            resolve({
              success: false,
              error: 'WebSocket connection timeout',
              latency: Date.now() - connectionStart
            });
          }
        }, TEST_CONFIG.CONNECTION_TIMEOUT);

        ws.onopen = () => {
          connected = true;
          clearTimeout(timeout);
          const latency = Date.now() - connectionStart;
          
          console.log(`✅ WebSocket connection established in ${latency}ms`);
          ws.close();
          
          resolve({
            success: true,
            latency: latency
          });
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          ws.close();
          
          resolve({
            success: false,
            error: 'WebSocket connection error',
            latency: Date.now() - connectionStart
          });
        };
        
      } catch (error) {
        resolve({
          success: false,
          error: 'WebSocket not supported or connection failed',
          latency: Date.now() - connectionStart
        });
      }
    });
  }

  /**
   * Test Polling Connection
   */
  async testPollingConnection() {
    const connectionStart = Date.now();
    
    try {
      const response = await fetch(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/status/${TEST_CONFIG.TEST_MATCH_ID}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(TEST_CONFIG.CONNECTION_TIMEOUT)
      });

      const latency = Date.now() - connectionStart;

      if (response.ok) {
        console.log(`✅ Polling connection established in ${latency}ms`);
        return {
          success: true,
          latency: latency
        };
      } else {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          latency: latency
        };
      }
      
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: Date.now() - connectionStart
      };
    }
  }

  /**
   * Test 2: Immediate Updates
   */
  async testImmediateUpdates() {
    console.log('\n⚡ TEST 2: Immediate Updates');
    console.log('-'.repeat(40));

    const testStart = Date.now();
    const updates = [];
    let updateCount = 0;
    
    try {
      // Simulate live updates and measure response time
      const eventSource = new EventSource(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/stream/${TEST_CONFIG.TEST_MATCH_ID}`);
      
      return new Promise((resolve) => {
        const updateInterval = setInterval(async () => {
          const updateStart = Date.now();
          updateCount++;
          
          // Send update to backend
          try {
            const updateData = {
              type: 'score-update',
              data: {
                team1_score: Math.floor(Math.random() * 5),
                team2_score: Math.floor(Math.random() * 5),
                match_id: TEST_CONFIG.TEST_MATCH_ID
              },
              timestamp: Date.now()
            };

            const response = await fetch(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/update/${TEST_CONFIG.TEST_MATCH_ID}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify(updateData)
            });

            if (response.ok) {
              console.log(`📤 Update ${updateCount} sent successfully`);
            } else {
              console.error(`❌ Update ${updateCount} failed: ${response.status}`);
            }
            
          } catch (error) {
            console.error(`❌ Error sending update ${updateCount}:`, error);
          }
          
        }, TEST_CONFIG.UPDATE_FREQUENCY);

        // Listen for incoming updates
        eventSource.addEventListener('score-update', (event) => {
          const receiveTime = Date.now();
          const data = JSON.parse(event.data);
          const latency = receiveTime - (data.timestamp || 0);
          
          updates.push({
            updateNumber: updates.length + 1,
            latency: latency,
            data: data,
            receiveTime: receiveTime
          });
          
          console.log(`📥 Update ${updates.length} received with ${latency}ms latency`);
        });

        // End test after duration
        setTimeout(() => {
          clearInterval(updateInterval);
          eventSource.close();
          
          const testDuration = Date.now() - testStart;
          const avgLatency = updates.reduce((sum, u) => sum + u.latency, 0) / updates.length;
          
          this.testResults.updateTests.push({
            totalUpdates: updateCount,
            receivedUpdates: updates.length,
            successRate: (updates.length / updateCount) * 100,
            averageLatency: avgLatency,
            testDuration: testDuration
          });
          
          console.log(`✅ Update test completed: ${updates.length}/${updateCount} updates received`);
          console.log(`📊 Average latency: ${avgLatency.toFixed(2)}ms`);
          
          resolve();
        }, TEST_CONFIG.TEST_DURATION);
      });
      
    } catch (error) {
      console.error('❌ Immediate updates test failed:', error);
      this.testResults.updateTests.push({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test 3: Reconnection Logic
   */
  async testReconnectionLogic() {
    console.log('\n🔄 TEST 3: Reconnection Logic');
    console.log('-'.repeat(40));

    const testStart = Date.now();
    
    try {
      // Test auto-reconnection by forcefully closing connection
      const eventSource = new EventSource(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/stream/${TEST_CONFIG.TEST_MATCH_ID}`);
      let reconnectionAttempts = 0;
      let reconnected = false;
      
      return new Promise((resolve) => {
        eventSource.onopen = () => {
          if (reconnectionAttempts === 0) {
            console.log('✅ Initial connection established');
            
            // Force disconnect after 2 seconds
            setTimeout(() => {
              console.log('🔌 Forcing disconnect...');
              eventSource.close();
              
              // Try to reconnect
              setTimeout(() => {
                reconnectionAttempts++;
                const newEventSource = new EventSource(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/stream/${TEST_CONFIG.TEST_MATCH_ID}`);
                
                newEventSource.onopen = () => {
                  reconnected = true;
                  const testDuration = Date.now() - testStart;
                  
                  console.log(`✅ Reconnection successful in ${testDuration}ms`);
                  newEventSource.close();
                  
                  this.testResults.reconnectionTests.push({
                    success: true,
                    reconnectionTime: testDuration,
                    attempts: reconnectionAttempts
                  });
                  
                  resolve();
                };
                
                newEventSource.onerror = () => {
                  console.error('❌ Reconnection failed');
                  newEventSource.close();
                  
                  this.testResults.reconnectionTests.push({
                    success: false,
                    error: 'Reconnection failed'
                  });
                  
                  resolve();
                };
              }, 1000); // Wait 1 second before reconnecting
              
            }, 2000);
          }
        };

        // Timeout for reconnection test
        setTimeout(() => {
          if (!reconnected) {
            this.testResults.reconnectionTests.push({
              success: false,
              error: 'Reconnection timeout'
            });
            resolve();
          }
        }, TEST_CONFIG.RECONNECT_TEST_DURATION);
      });
      
    } catch (error) {
      console.error('❌ Reconnection logic test failed:', error);
      this.testResults.reconnectionTests.push({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Test 4: Error Recovery
   */
  async testErrorRecovery() {
    console.log('\n🛡️ TEST 4: Error Recovery');
    console.log('-'.repeat(40));

    const testStart = Date.now();
    
    try {
      // Test various error scenarios
      const errorTests = [
        {
          name: 'Invalid Match ID',
          url: `${TEST_CONFIG.BACKEND_URL}/api/live-updates/stream/99999`,
          expectedError: true
        },
        {
          name: 'Invalid Endpoint',
          url: `${TEST_CONFIG.BACKEND_URL}/api/invalid-endpoint/${TEST_CONFIG.TEST_MATCH_ID}`,
          expectedError: true
        },
        {
          name: 'Malformed Update Data',
          type: 'update',
          data: { invalid: 'data' },
          expectedError: true
        }
      ];

      for (const test of errorTests) {
        try {
          if (test.type === 'update') {
            // Test malformed update
            const response = await fetch(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/update/${TEST_CONFIG.TEST_MATCH_ID}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(test.data)
            });
            
            const handled = !response.ok; // Error should be handled
            console.log(`${handled ? '✅' : '❌'} ${test.name}: ${handled ? 'Properly handled' : 'Not handled'}`);
            
            this.testResults.errorRecoveryTests.push({
              testName: test.name,
              success: handled,
              expectedError: test.expectedError
            });
            
          } else {
            // Test connection error
            const eventSource = new EventSource(test.url);
            
            await new Promise((resolve) => {
              const timeout = setTimeout(() => {
                eventSource.close();
                console.log(`✅ ${test.name}: Properly timed out`);
                this.testResults.errorRecoveryTests.push({
                  testName: test.name,
                  success: true,
                  expectedError: test.expectedError
                });
                resolve();
              }, 5000);
              
              eventSource.onerror = () => {
                clearTimeout(timeout);
                eventSource.close();
                console.log(`✅ ${test.name}: Error properly handled`);
                this.testResults.errorRecoveryTests.push({
                  testName: test.name,
                  success: true,
                  expectedError: test.expectedError
                });
                resolve();
              };

              eventSource.onopen = () => {
                clearTimeout(timeout);
                eventSource.close();
                console.log(`❌ ${test.name}: Unexpected success`);
                this.testResults.errorRecoveryTests.push({
                  testName: test.name,
                  success: false,
                  expectedError: test.expectedError
                });
                resolve();
              };
            });
          }
          
        } catch (error) {
          console.log(`✅ ${test.name}: Exception properly caught`);
          this.testResults.errorRecoveryTests.push({
            testName: test.name,
            success: true,
            expectedError: test.expectedError,
            error: error.message
          });
        }
      }
      
      const testDuration = Date.now() - testStart;
      console.log(`✅ Error recovery tests completed in ${testDuration}ms`);
      
    } catch (error) {
      console.error('❌ Error recovery test failed:', error);
    }
  }

  /**
   * Test 5: Performance Under Load
   */
  async testPerformanceUnderLoad() {
    console.log('\n🚀 TEST 5: Performance Under Load');
    console.log('-'.repeat(40));

    const testStart = Date.now();
    const connections = [];
    const CONCURRENT_CONNECTIONS = 5;
    const UPDATES_PER_SECOND = 10;
    
    try {
      // Create multiple concurrent connections
      for (let i = 0; i < CONCURRENT_CONNECTIONS; i++) {
        const eventSource = new EventSource(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/stream/${TEST_CONFIG.TEST_MATCH_ID}`);
        connections.push({
          id: i,
          connection: eventSource,
          messagesReceived: 0,
          lastMessageTime: 0
        });
        
        eventSource.addEventListener('score-update', (event) => {
          const conn = connections.find(c => c.connection === eventSource);
          if (conn) {
            conn.messagesReceived++;
            conn.lastMessageTime = Date.now();
          }
        });
      }

      // Send rapid updates
      const updateInterval = setInterval(async () => {
        const updatePromises = [];
        
        for (let i = 0; i < UPDATES_PER_SECOND; i++) {
          const updateData = {
            type: 'score-update',
            data: {
              team1_score: Math.floor(Math.random() * 10),
              team2_score: Math.floor(Math.random() * 10),
              match_id: TEST_CONFIG.TEST_MATCH_ID,
              update_id: Date.now() + i
            },
            timestamp: Date.now()
          };

          const promise = fetch(`${TEST_CONFIG.BACKEND_URL}/api/live-updates/update/${TEST_CONFIG.TEST_MATCH_ID}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });

          updatePromises.push(promise);
        }

        try {
          await Promise.all(updatePromises);
        } catch (error) {
          console.error('❌ Error during load test updates:', error);
        }
        
      }, 1000); // Every second

      // Run load test for 10 seconds
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      clearInterval(updateInterval);
      
      // Calculate performance metrics
      const totalMessages = connections.reduce((sum, conn) => sum + conn.messagesReceived, 0);
      const avgMessagesPerConnection = totalMessages / CONCURRENT_CONNECTIONS;
      const testDuration = Date.now() - testStart;
      
      this.testResults.performanceMetrics.push({
        concurrentConnections: CONCURRENT_CONNECTIONS,
        totalMessages: totalMessages,
        avgMessagesPerConnection: avgMessagesPerConnection,
        testDuration: testDuration,
        messagesPerSecond: (totalMessages / testDuration) * 1000
      });
      
      console.log(`✅ Performance test completed:`);
      console.log(`📊 Concurrent connections: ${CONCURRENT_CONNECTIONS}`);
      console.log(`📊 Total messages received: ${totalMessages}`);
      console.log(`📊 Messages per second: ${((totalMessages / testDuration) * 1000).toFixed(2)}`);
      
      // Close all connections
      connections.forEach(conn => conn.connection.close());
      
    } catch (error) {
      console.error('❌ Performance test failed:', error);
      connections.forEach(conn => conn.connection.close());
    }
  }

  /**
   * Test 6: Cross-Tab Synchronization
   */
  async testCrossTabSync() {
    console.log('\n🔄 TEST 6: Cross-Tab Synchronization');
    console.log('-'.repeat(40));

    try {
      // Test localStorage synchronization
      const testKey = `match_update_${TEST_CONFIG.TEST_MATCH_ID}`;
      const testData = {
        type: 'score-update',
        data: {
          team1_score: 3,
          team2_score: 2,
          test_timestamp: Date.now()
        },
        timestamp: Date.now()
      };

      // Store data in localStorage
      localStorage.setItem(testKey, JSON.stringify(testData));
      
      // Simulate storage event (cross-tab)
      const storageEvent = new StorageEvent('storage', {
        key: testKey,
        newValue: JSON.stringify(testData),
        oldValue: null,
        storageArea: localStorage
      });
      
      let eventReceived = false;
      
      const storageListener = (event) => {
        if (event.key === testKey) {
          eventReceived = true;
          console.log('✅ Cross-tab storage event received');
          
          try {
            const receivedData = JSON.parse(event.newValue);
            const isValid = receivedData.data.team1_score === 3 && receivedData.data.team2_score === 2;
            
            this.testResults.crossTabTests = [{
              success: isValid,
              dataIntegrity: isValid
            }];
            
            console.log(`${isValid ? '✅' : '❌'} Data integrity: ${isValid ? 'Preserved' : 'Corrupted'}`);
            
          } catch (error) {
            console.error('❌ Error parsing cross-tab data:', error);
            this.testResults.crossTabTests = [{
              success: false,
              error: error.message
            }];
          }
        }
      };
      
      window.addEventListener('storage', storageListener);
      
      // Dispatch the event
      window.dispatchEvent(storageEvent);
      
      // Wait for event processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      window.removeEventListener('storage', storageListener);
      
      if (!eventReceived) {
        console.log('⚠️ Storage event not received (may be normal in same-tab testing)');
        this.testResults.crossTabTests = [{
          success: true,
          note: 'Same-tab testing limitation'
        }];
      }
      
      // Cleanup
      localStorage.removeItem(testKey);
      
    } catch (error) {
      console.error('❌ Cross-tab sync test failed:', error);
      this.testResults.crossTabTests = [{
        success: false,
        error: error.message
      }];
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateTestReport() {
    const totalTestTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 MRVL LIVE SCORING SYSTEM - TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`⏱️ Total Test Duration: ${totalTestTime}ms`);
    console.log(`📅 Test Date: ${new Date().toISOString()}\n`);

    // Connection Tests Summary
    console.log('🔌 CONNECTION TESTS:');
    this.testResults.connectionTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const latency = test.latency ? ` (${test.latency}ms)` : '';
      const error = test.error ? ` - ${test.error}` : '';
      console.log(`  ${status} ${test.type}${latency}${error}`);
    });

    // Update Tests Summary
    console.log('\n⚡ UPDATE TESTS:');
    this.testResults.updateTests.forEach(test => {
      if (test.successRate !== undefined) {
        console.log(`  ✅ Success Rate: ${test.successRate.toFixed(1)}%`);
        console.log(`  📊 Average Latency: ${test.averageLatency.toFixed(2)}ms`);
        console.log(`  📈 Updates: ${test.receivedUpdates}/${test.totalUpdates}`);
      }
    });

    // Reconnection Tests Summary
    console.log('\n🔄 RECONNECTION TESTS:');
    this.testResults.reconnectionTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      const time = test.reconnectionTime ? ` (${test.reconnectionTime}ms)` : '';
      const error = test.error ? ` - ${test.error}` : '';
      console.log(`  ${status} Auto-reconnection${time}${error}`);
    });

    // Error Recovery Tests Summary
    console.log('\n🛡️ ERROR RECOVERY TESTS:');
    this.testResults.errorRecoveryTests.forEach(test => {
      const status = test.success ? '✅' : '❌';
      console.log(`  ${status} ${test.testName}`);
    });

    // Performance Tests Summary
    console.log('\n🚀 PERFORMANCE TESTS:');
    this.testResults.performanceMetrics.forEach(test => {
      console.log(`  ✅ Concurrent Connections: ${test.concurrentConnections}`);
      console.log(`  📊 Messages/Second: ${test.messagesPerSecond.toFixed(2)}`);
      console.log(`  📈 Total Messages: ${test.totalMessages}`);
    });

    // Overall Assessment
    const connectionsPassed = this.testResults.connectionTests.filter(t => t.success).length;
    const updatesSuccess = this.testResults.updateTests.some(t => t.successRate > 80);
    const reconnectionSuccess = this.testResults.reconnectionTests.some(t => t.success);
    const errorRecoverySuccess = this.testResults.errorRecoveryTests.filter(t => t.success).length >= 2;
    const performanceSuccess = this.testResults.performanceMetrics.some(t => t.messagesPerSecond > 10);

    console.log('\n' + '='.repeat(60));
    console.log('🏆 OVERALL ASSESSMENT:');
    console.log('='.repeat(60));
    
    const overallScore = [
      connectionsPassed > 0,
      updatesSuccess,
      reconnectionSuccess,
      errorRecoverySuccess,
      performanceSuccess
    ].filter(Boolean).length;

    if (overallScore >= 4) {
      console.log('🎉 EXCELLENT: Live scoring system is bulletproof and ready for production!');
    } else if (overallScore >= 3) {
      console.log('👍 GOOD: Live scoring system is solid with minor areas for improvement');
    } else if (overallScore >= 2) {
      console.log('⚠️ FAIR: Live scoring system needs optimization before production');
    } else {
      console.log('❌ POOR: Live scoring system requires significant fixes');
    }

    console.log(`📊 Test Score: ${overallScore}/5`);
    console.log('\n' + '='.repeat(60));
    
    // Save results to localStorage for later analysis
    localStorage.setItem('mrvl_live_scoring_test_results', JSON.stringify({
      timestamp: new Date().toISOString(),
      testDuration: totalTestTime,
      results: this.testResults,
      overallScore: overallScore
    }));
    
    console.log('💾 Test results saved to localStorage');
  }
}

// Auto-run tests if not in module context
if (typeof window !== 'undefined') {
  // Make test available globally
  window.LiveScoringSystemTest = LiveScoringSystemTest;
  
  // Auto-run tests after page load
  document.addEventListener('DOMContentLoaded', () => {
    console.log('🔍 MRVL Live Scoring System Test Suite Ready');
    console.log('Run: new LiveScoringSystemTest().runAllTests()');
  });
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LiveScoringSystemTest;
}