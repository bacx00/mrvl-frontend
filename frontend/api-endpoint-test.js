/**
 * API ENDPOINT VALIDATION TEST
 * Tests critical API endpoints for live scoring system
 */

const axios = require('axios');
const fs = require('fs');

class APIEndpointTester {
  constructor() {
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    this.results = {
      timestamp: new Date().toISOString(),
      endpoints: [],
      summary: {}
    };
  }

  async testAllEndpoints() {
    console.log('🔗 API ENDPOINT VALIDATION');
    console.log('==========================');
    console.log(`Base URL: ${this.baseUrl}`);
    
    try {
      // Test Match-related endpoints
      await this.testEndpoint('GET', '/api/matches', 'Get All Matches');
      await this.testEndpoint('GET', '/api/matches/1', 'Get Match Details');
      await this.testEndpoint('GET', '/api/teams', 'Get All Teams');
      await this.testEndpoint('GET', '/api/players', 'Get All Players');
      
      // Test Live Scoring endpoints (if they exist)
      await this.testEndpoint('GET', '/api/live-matches', 'Get Live Matches');
      await this.testEndpoint('GET', '/api/matches/1/stats', 'Get Match Stats');
      
      // Test Admin endpoints
      await this.testEndpoint('GET', '/api/admin/matches', 'Admin Match Management');
      await this.testEndpoint('GET', '/api/admin/dashboard', 'Admin Dashboard Data');
      
      this.generateAPIReport();
      
    } catch (error) {
      console.error('Critical API test failure:', error.message);
    }
  }

  async testEndpoint(method, endpoint, description) {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    const startTime = Date.now();
    
    try {
      console.log(`\n🔍 Testing: ${description}`);
      console.log(`   ${method} ${fullUrl}`);
      
      const response = await axios({
        method: method.toLowerCase(),
        url: fullUrl,
        timeout: 10000,
        validateStatus: (status) => status < 500 // Accept 4xx as valid responses
      });
      
      const responseTime = Date.now() - startTime;
      
      const result = {
        endpoint: endpoint,
        method: method,
        description: description,
        status: response.status,
        responseTime: responseTime,
        success: response.status >= 200 && response.status < 400,
        contentType: response.headers['content-type'],
        dataSize: JSON.stringify(response.data).length
      };
      
      // Analyze response data
      if (response.data && typeof response.data === 'object') {
        if (Array.isArray(response.data)) {
          result.dataType = 'array';
          result.itemCount = response.data.length;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          result.dataType = 'paginated';
          result.itemCount = response.data.data.length;
          result.meta = response.data.meta;
        } else {
          result.dataType = 'object';
          result.keys = Object.keys(response.data);
        }
      }
      
      this.results.endpoints.push(result);
      
      if (result.success) {
        console.log(`   ✅ ${response.status} - ${responseTime}ms - ${result.dataSize} bytes`);
        if (result.itemCount !== undefined) {
          console.log(`      📊 ${result.itemCount} items returned`);
        }
      } else {
        console.log(`   ⚠️  ${response.status} - ${response.statusText}`);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      const result = {
        endpoint: endpoint,
        method: method,
        description: description,
        success: false,
        error: error.message,
        responseTime: responseTime,
        errorType: error.code || 'UNKNOWN'
      };
      
      this.results.endpoints.push(result);
      
      console.log(`   ❌ ERROR: ${error.message}`);
      
      if (error.response) {
        console.log(`      Status: ${error.response.status}`);
        console.log(`      Data: ${JSON.stringify(error.response.data).slice(0, 200)}`);
      }
    }
  }

  generateAPIReport() {
    const successful = this.results.endpoints.filter(e => e.success).length;
    const failed = this.results.endpoints.filter(e => !e.success).length;
    const total = this.results.endpoints.length;
    
    const avgResponseTime = this.results.endpoints
      .filter(e => e.responseTime)
      .reduce((sum, e) => sum + e.responseTime, 0) / this.results.endpoints.length;
    
    this.results.summary = {
      total: total,
      successful: successful,
      failed: failed,
      successRate: ((successful / total) * 100).toFixed(1),
      averageResponseTime: Math.round(avgResponseTime)
    };
    
    // Save report
    const reportPath = '/var/www/mrvl-frontend/frontend/api-endpoint-test-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n📊 API ENDPOINT SUMMARY');
    console.log('=======================');
    console.log(`Success Rate: ${successful}/${total} (${this.results.summary.successRate}%)`);
    console.log(`Average Response Time: ${this.results.summary.averageResponseTime}ms`);
    console.log(`Report saved: ${reportPath}`);
    
    // Show critical issues
    const criticalFailures = this.results.endpoints.filter(e => 
      !e.success && e.endpoint.includes('/matches')
    );
    
    if (criticalFailures.length > 0) {
      console.log('\n🚨 CRITICAL FAILURES (Match-related):');
      criticalFailures.forEach(failure => {
        console.log(`   ${failure.method} ${failure.endpoint}: ${failure.error}`);
      });
    }
    
    // Show slow endpoints
    const slowEndpoints = this.results.endpoints.filter(e => 
      e.responseTime && e.responseTime > 2000
    );
    
    if (slowEndpoints.length > 0) {
      console.log('\n⚡ SLOW ENDPOINTS (>2s):');
      slowEndpoints.forEach(slow => {
        console.log(`   ${slow.endpoint}: ${slow.responseTime}ms`);
      });
    }
  }
}

// Check if axios is available, if not provide instructions
try {
  const tester = new APIEndpointTester();
  tester.testAllEndpoints().catch(console.error);
} catch (error) {
  console.log('❌ axios not found. Install with: npm install axios');
  console.log('   Alternatively, this test can be skipped as it focuses on backend validation');
}

module.exports = APIEndpointTester;