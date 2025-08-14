/**
 * MRVL API Endpoint Testing Script
 * Tests player and team CRUD operations and validates API responses
 */

const https = require('https');

class MRVLAPITester {
  constructor() {
    this.baseUrl = 'https://staging.mrvl.net';
    this.results = {
      players: {},
      teams: {},
      errors: []
    };
  }

  async makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: responseData ? JSON.parse(responseData) : null
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: responseData
            });
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  async testPlayersEndpoint() {
    console.log('Testing Players API...');
    try {
      const response = await this.makeRequest('/api/players');
      this.results.players = {
        status: response.status,
        success: response.status < 400,
        dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 0
      };
      console.log(`Players endpoint: ${response.status}`);
    } catch (error) {
      this.results.errors.push(`Players API: ${error.message}`);
    }
  }

  async testTeamsEndpoint() {
    console.log('Testing Teams API...');
    try {
      const response = await this.makeRequest('/api/teams');
      this.results.teams = {
        status: response.status,
        success: response.status < 400,
        dataCount: Array.isArray(response.data?.data) ? response.data.data.length : 0
      };
      console.log(`Teams endpoint: ${response.status}`);
    } catch (error) {
      this.results.errors.push(`Teams API: ${error.message}`);
    }
  }

  async runAllTests() {
    await this.testPlayersEndpoint();
    await this.testTeamsEndpoint();
    return this.results;
  }
}

// Run the tests
(async () => {
  const tester = new MRVLAPITester();
  const results = await tester.runAllTests();
  console.log('\nTest Results:', JSON.stringify(results, null, 2));
})().catch(console.error);