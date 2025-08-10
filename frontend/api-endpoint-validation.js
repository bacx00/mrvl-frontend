/**
 * API ENDPOINT VALIDATION FOR LIVE SCORING SYSTEM
 * 
 * Tests all critical endpoints in the live scoring pipeline
 * to ensure bulletproof real-time updates.
 */

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';

class APIEndpointValidator {
  constructor() {
    this.results = {};
    this.errors = [];
    this.latencyMeasurements = [];
  }

  /**
   * Test all critical API endpoints
   */
  async validateAllEndpoints() {
    console.log('🔍 Validating Live Scoring API Endpoints...\n');

    const endpoints = [
      {
        name: 'Live Matches',
        method: 'GET',
        url: '/api/matches/live',
        expected: { type: 'array', status: 200 }
      },
      {
        name: 'Match Detail',
        method: 'GET', 
        url: '/api/matches/1', // Test with ID 1
        expected: { status: [200, 404] } // 404 is OK if match doesn't exist
      },
      {
        name: 'Live Updates Stream',
        method: 'GET',
        url: '/api/live-updates/stream/1',
        expected: { type: 'sse', status: 200 },
        timeout: 5000
      },
      {
        name: 'Live Updates Status',
        method: 'GET',
        url: '/api/live-updates/status/1',
        expected: { status: [200, 404] }
      },
      {
        name: 'Match Live Control (Admin)',
        method: 'POST',
        url: '/api/admin/matches/1/live-control',
        expected: { status: [200, 401, 403, 404] }, // Auth errors are OK
        requiresAuth: true
      }
    ];

    let passedTests = 0;
    let totalTests = endpoints.length;

    for (const endpoint of endpoints) {
      try {
        console.log(`\n🧪 Testing: ${endpoint.name}`);
        console.log(`   ${endpoint.method} ${endpoint.url}`);
        
        const result = await this.testEndpoint(endpoint);
        
        if (result.success) {
          console.log(`   ✅ PASSED - ${result.details}`);
          passedTests++;
        } else {
          console.log(`   ❌ FAILED - ${result.error}`);
          this.errors.push(`${endpoint.name}: ${result.error}`);
        }
        
        this.results[endpoint.name] = result;
        
      } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
        this.errors.push(`${endpoint.name}: ${error.message}`);
        this.results[endpoint.name] = { success: false, error: error.message };
      }
    }

    // Generate report
    this.generateEndpointReport(passedTests, totalTests);
    
    return {
      success: passedTests >= totalTests - 1, // Allow 1 failure
      passedTests,
      totalTests,
      results: this.results,
      errors: this.errors
    };
  }

  /**
   * Test individual endpoint
   */
  async testEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      if (endpoint.expected.type === 'sse') {
        return await this.testSSEEndpoint(endpoint);
      } else {
        return await this.testHttpEndpoint(endpoint);
      }
    } finally {
      const latency = Date.now() - startTime;
      this.latencyMeasurements.push({ endpoint: endpoint.name, latency });
    }
  }

  /**
   * Test HTTP endpoint
   */
  async testHttpEndpoint(endpoint) {
    const url = `${BACKEND_URL}${endpoint.url}`;
    
    const options = {
      method: endpoint.method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };

    // Add sample data for POST requests
    if (endpoint.method === 'POST') {
      options.body = JSON.stringify({
        action: 'test_validation',
        data: { test: true }
      });
    }

    const response = await fetch(url, options);
    
    // Check if status is expected
    const expectedStatuses = Array.isArray(endpoint.expected.status) 
      ? endpoint.expected.status 
      : [endpoint.expected.status];
      
    if (!expectedStatuses.includes(response.status)) {
      return {
        success: false,
        error: `Unexpected status ${response.status}, expected ${expectedStatuses.join(' or ')}`
      };
    }

    // Check response type for successful responses
    if (response.status === 200) {
      try {
        const data = await response.json();
        
        if (endpoint.expected.type === 'array' && !Array.isArray(data)) {
          return {
            success: false,
            error: 'Expected array response, got object'
          };
        }
        
        return {
          success: true,
          details: `Status ${response.status}, valid JSON response`,
          data: Array.isArray(data) ? `Array with ${data.length} items` : 'Object response'
        };
        
      } catch (jsonError) {
        return {
          success: false,
          error: 'Invalid JSON response'
        };
      }
    }
    
    return {
      success: true,
      details: `Status ${response.status} (${response.statusText})`,
      status: response.status
    };
  }

  /**
   * Test Server-Sent Events endpoint
   */
  async testSSEEndpoint(endpoint) {
    return new Promise((resolve) => {
      const url = `${BACKEND_URL}${endpoint.url}`;
      const eventSource = new EventSource(url);
      let connectionEstablished = false;
      let messagesReceived = 0;
      
      const timeout = setTimeout(() => {
        eventSource.close();
        resolve({
          success: connectionEstablished,
          details: connectionEstablished 
            ? `SSE connection OK, ${messagesReceived} messages` 
            : 'SSE connection failed',
          connectionEstablished,
          messagesReceived
        });
      }, endpoint.timeout || 5000);
      
      eventSource.onopen = () => {
        connectionEstablished = true;
      };
      
      eventSource.onmessage = (event) => {
        messagesReceived++;
      };
      
      eventSource.addEventListener('connected', () => {
        messagesReceived++;
      });
      
      eventSource.onerror = (error) => {
        clearTimeout(timeout);
        eventSource.close();
        resolve({
          success: false,
          error: 'SSE connection error',
          connectionEstablished: false
        });
      };
    });
  }

  /**
   * Test complete data flow from API to frontend
   */
  async testDataFlow() {
    console.log('\n🔄 Testing Complete Data Flow...\n');
    
    try {
      // 1. Get live matches
      const matchesResponse = await fetch(`${BACKEND_URL}/api/matches/live`);
      const matches = await matchesResponse.json();
      
      console.log(`📊 Found ${matches.length} live matches`);
      
      if (matches.length === 0) {
        return {
          success: true,
          warning: 'No live matches to test data flow',
          details: 'API working but no live matches available'
        };
      }
      
      const testMatch = matches[0];
      console.log(`🎯 Testing data flow for match ID: ${testMatch.id}`);
      
      // 2. Get match details
      const detailResponse = await fetch(`${BACKEND_URL}/api/matches/${testMatch.id}`);
      const matchDetail = await detailResponse.json();
      
      console.log(`📋 Match details loaded: ${matchDetail.team1_name} vs ${matchDetail.team2_name}`);
      
      // 3. Test live updates connection
      let liveUpdatesWorking = false;
      
      const liveUpdatePromise = new Promise((resolve) => {
        const eventSource = new EventSource(`${BACKEND_URL}/api/live-updates/stream/${testMatch.id}`);
        
        const timeout = setTimeout(() => {
          eventSource.close();
          resolve(liveUpdatesWorking);
        }, 3000);
        
        eventSource.onopen = () => {
          liveUpdatesWorking = true;
          console.log('📡 Live updates connection established');
        };
        
        eventSource.onmessage = (event) => {
          console.log('📨 Live update received');
          liveUpdatesWorking = true;
        };
        
        eventSource.onerror = () => {
          eventSource.close();
          clearTimeout(timeout);
          resolve(false);
        };
      });
      
      const liveConnectionResult = await liveUpdatePromise;
      
      // 4. Validate data structure
      const requiredFields = ['id', 'status', 'team1_name', 'team2_name', 'team1_score', 'team2_score'];
      const missingFields = requiredFields.filter(field => !matchDetail.hasOwnProperty(field));
      
      const dataIntegrity = missingFields.length === 0;
      
      if (!dataIntegrity) {
        console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      } else {
        console.log('✅ All required fields present');
      }
      
      const success = dataIntegrity && liveConnectionResult;
      
      return {
        success,
        details: `Data flow test: ${success ? 'PASSED' : 'ISSUES DETECTED'}`,
        matchTested: testMatch.id,
        dataIntegrity,
        liveConnection: liveConnectionResult,
        missingFields: missingFields
      };
      
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate endpoint validation report
   */
  generateEndpointReport(passed, total) {
    const successRate = ((passed / total) * 100).toFixed(1);
    
    console.log('\n═══════════════════════════════════════');
    console.log('📊 API ENDPOINT VALIDATION REPORT');
    console.log('═══════════════════════════════════════');
    console.log(`✅ Passed: ${passed}/${total} (${successRate}%)`);
    console.log(`❌ Failed: ${total - passed}`);
    
    if (this.errors.length > 0) {
      console.log('\n🚨 ENDPOINT ERRORS:');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    // Latency report
    if (this.latencyMeasurements.length > 0) {
      const avgLatency = this.latencyMeasurements.reduce((sum, m) => sum + m.latency, 0) / this.latencyMeasurements.length;
      console.log('\n📈 LATENCY MEASUREMENTS:');
      console.log(`   • Average: ${avgLatency.toFixed(2)}ms`);
      
      this.latencyMeasurements.forEach(({ endpoint, latency }) => {
        const status = latency < 1000 ? '🟢' : latency < 3000 ? '🟡' : '🔴';
        console.log(`   ${status} ${endpoint}: ${latency}ms`);
      });
    }
    
    console.log('═══════════════════════════════════════\n');
  }
}

/**
 * Run API validation
 */
async function runAPIValidation() {
  const validator = new APIEndpointValidator();
  
  console.log('🚀 Starting API Endpoint Validation for Live Scoring System\n');
  
  try {
    // Test all endpoints
    const endpointResults = await validator.validateAllEndpoints();
    
    // Test complete data flow
    console.log('\n' + '='.repeat(50));
    const dataFlowResults = await validator.testDataFlow();
    
    const overallResults = {
      endpoints: endpointResults,
      dataFlow: dataFlowResults,
      timestamp: new Date().toISOString(),
      success: endpointResults.success && dataFlowResults.success
    };
    
    // Store results
    localStorage.setItem('api_validation_results', JSON.stringify(overallResults));
    
    console.log('\n🎯 API VALIDATION COMPLETED');
    console.log(`📊 Overall Status: ${overallResults.success ? '🟢 READY' : '🔴 ISSUES DETECTED'}`);
    
    return overallResults;
    
  } catch (error) {
    console.error('❌ API Validation failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// Auto-export and setup
if (typeof window !== 'undefined') {
  window.runAPIValidation = runAPIValidation;
  window.APIEndpointValidator = APIEndpointValidator;
  
  console.log('💡 API Validation ready. Run: runAPIValidation()');
}

export { APIEndpointValidator, runAPIValidation };