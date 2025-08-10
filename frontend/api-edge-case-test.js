/**
 * API Edge Case Testing Suite
 * Tests API endpoints for vulnerabilities, edge cases, and error handling
 * Runs without external dependencies
 */

const API_BASE = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

class APIEdgeCaseDetector {
    constructor() {
        this.testResults = [];
        this.criticalBugs = [];
        this.highBugs = [];
        this.mediumBugs = [];
    }

    logBug(severity, title, description, category, endpoint = null) {
        const bug = {
            timestamp: new Date().toISOString(),
            severity,
            title,
            description,
            category,
            endpoint,
            testContext: this.currentTest || 'Unknown'
        };
        
        this.testResults.push(bug);
        
        switch(severity) {
            case 'CRITICAL':
                this.criticalBugs.push(bug);
                console.log(`🚨 CRITICAL: ${title} - ${description}`);
                break;
            case 'HIGH':
                this.highBugs.push(bug);
                console.log(`⚠️  HIGH: ${title} - ${description}`);
                break;
            case 'MEDIUM':
                this.mediumBugs.push(bug);
                console.log(`📋 MEDIUM: ${title} - ${description}`);
                break;
            case 'LOW':
                console.log(`📝 LOW: ${title} - ${description}`);
                break;
        }
    }

    async makeRequest(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                timeout: 10000,
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                }
            });
            
            return {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                data: response.ok ? await response.json().catch(() => null) : null,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            return {
                status: 0,
                error: error.message,
                networkError: true
            };
        }
    }

    // Test SQL injection attempts on live scoring endpoints
    async testSQLInjectionVulnerabilities() {
        this.currentTest = 'SQL Injection Testing';
        console.log('\n🧪 Testing SQL Injection Vulnerabilities...');
        
        const sqlPayloads = [
            "1' OR '1'='1",
            "1; DROP TABLE matches; --",
            "1' UNION SELECT * FROM users --",
            "'; SELECT * FROM events; --",
            "1' OR 1=1 LIMIT 1; --",
            "admin'--",
            "1' AND (SELECT COUNT(*) FROM information_schema.tables)>0 --"
        ];

        const endpoints = [
            { method: 'POST', path: '/admin/matches/1/scores' },
            { method: 'GET', path: '/matches' },
            { method: 'GET', path: '/events' },
            { method: 'POST', path: '/admin/events' },
            { method: 'PUT', path: '/admin/matches/1' }
        ];

        for (const endpoint of endpoints) {
            for (const payload of sqlPayloads) {
                try {
                    let requestOptions = { method: endpoint.method };
                    
                    if (endpoint.method === 'GET') {
                        // Test SQL injection in query parameters
                        const testPath = `${endpoint.path}?id=${encodeURIComponent(payload)}&search=${encodeURIComponent(payload)}`;
                        const response = await this.makeRequest(testPath);
                        
                        if (response.status === 500) {
                            this.logBug('HIGH', 'Potential SQL Injection', 
                                `500 error on GET ${endpoint.path} with payload: ${payload}`, 
                                'Security', endpoint.path);
                        }
                    } else {
                        // Test SQL injection in request body
                        requestOptions.body = JSON.stringify({
                            team1_score: payload,
                            team2_score: payload,
                            name: payload,
                            description: payload,
                            search: payload
                        });
                        
                        const response = await this.makeRequest(endpoint.path, requestOptions);
                        
                        if (response.status === 500) {
                            this.logBug('HIGH', 'Potential SQL Injection', 
                                `500 error on ${endpoint.method} ${endpoint.path} with SQL payload`, 
                                'Security', endpoint.path);
                        }
                        
                        // Check if error message reveals database information
                        if (response.data && typeof response.data === 'string') {
                            if (response.data.includes('SQL') || response.data.includes('mysql') || 
                                response.data.includes('postgres') || response.data.includes('database')) {
                                this.logBug('CRITICAL', 'Database Information Disclosure', 
                                    `SQL error details exposed in API response from ${endpoint.path}`, 
                                    'Security', endpoint.path);
                            }
                        }
                    }
                } catch (error) {
                    // Network errors are expected for malicious requests
                }
            }
        }
    }

    // Test XSS vulnerabilities in API responses
    async testXSSVulnerabilities() {
        this.currentTest = 'XSS Vulnerability Testing';
        console.log('\n🧪 Testing XSS Vulnerabilities...');
        
        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '"><script>alert("XSS")</script>',
            'javascript:alert("XSS")',
            '<img src="x" onerror="alert(\'XSS\')">',
            '<svg onload="alert(\'XSS\')">',
            '&lt;script&gt;alert("XSS")&lt;/script&gt;'
        ];

        const endpoints = [
            { method: 'POST', path: '/admin/events', field: 'name' },
            { method: 'POST', path: '/admin/teams', field: 'name' },
            { method: 'POST', path: '/admin/players', field: 'name' },
            { method: 'POST', path: '/admin/matches', field: 'name' }
        ];

        for (const endpoint of endpoints) {
            for (const payload of xssPayloads) {
                try {
                    const requestBody = {};
                    requestBody[endpoint.field] = payload;
                    requestBody.description = payload;
                    
                    const response = await this.makeRequest(endpoint.path, {
                        method: endpoint.method,
                        body: JSON.stringify(requestBody)
                    });
                    
                    // Check if XSS payload is reflected without encoding
                    if (response.data && JSON.stringify(response.data).includes(payload)) {
                        this.logBug('HIGH', 'Potential XSS Vulnerability', 
                            `Unencoded script tag reflected in API response from ${endpoint.path}`, 
                            'Security', endpoint.path);
                    }
                    
                    // Check response headers for security headers
                    if (!response.headers['x-content-type-options']) {
                        this.logBug('MEDIUM', 'Missing Security Header', 
                            `X-Content-Type-Options header missing on ${endpoint.path}`, 
                            'Security', endpoint.path);
                    }
                    
                } catch (error) {
                    // Expected for malicious requests
                }
            }
        }
    }

    // Test authentication bypass attempts
    async testAuthenticationBypass() {
        this.currentTest = 'Authentication Bypass Testing';
        console.log('\n🧪 Testing Authentication Bypass...');
        
        const adminEndpoints = [
            '/admin/events',
            '/admin/matches',
            '/admin/teams',
            '/admin/players',
            '/admin/users',
            '/admin/stats'
        ];

        const bypassAttempts = [
            { headers: {} }, // No auth header
            { headers: { 'Authorization': 'Bearer invalid-token' } },
            { headers: { 'Authorization': 'Bearer null' } },
            { headers: { 'Authorization': 'Bearer undefined' } },
            { headers: { 'Authorization': 'Bearer ' } },
            { headers: { 'Authorization': 'Basic YWRtaW46cGFzc3dvcmQ=' } }, // admin:password
            { headers: { 'X-Admin-Override': 'true' } },
            { headers: { 'X-Forwarded-For': '127.0.0.1' } }
        ];

        for (const endpoint of adminEndpoints) {
            for (const attempt of bypassAttempts) {
                const response = await this.makeRequest(endpoint, {
                    method: 'GET',
                    headers: attempt.headers
                });
                
                // Admin endpoints should return 401/403, not 200
                if (response.status === 200) {
                    this.logBug('CRITICAL', 'Authentication Bypass', 
                        `Admin endpoint ${endpoint} accessible without proper authentication`, 
                        'Security', endpoint);
                }
                
                // Check for information disclosure in error responses
                if (response.status === 500) {
                    this.logBug('MEDIUM', 'Error Information Disclosure', 
                        `500 error on ${endpoint} may reveal internal information`, 
                        'Security', endpoint);
                }
            }
        }
    }

    // Test input validation edge cases
    async testInputValidationEdgeCases() {
        this.currentTest = 'Input Validation Testing';
        console.log('\n🧪 Testing Input Validation Edge Cases...');
        
        const edgeCaseInputs = [
            // Numeric edge cases
            { team1_score: -999999, team2_score: -999999 },
            { team1_score: Number.MAX_SAFE_INTEGER, team2_score: Number.MAX_SAFE_INTEGER },
            { team1_score: 'NaN', team2_score: 'Infinity' },
            { team1_score: null, team2_score: undefined },
            
            // String edge cases  
            { name: 'A'.repeat(10000) }, // Very long string
            { name: '' }, // Empty string
            { description: '\x00\x01\x02' }, // Control characters
            { name: '🎮'.repeat(1000) }, // Unicode overflow
            
            // Object/Array injection
            { name: { toString: () => 'injected' } },
            { metadata: ['array', 'injection'] },
            
            // Type confusion
            { start_date: 'not-a-date' },
            { end_date: 9999999999999 },
            { prize_pool: 'free' }
        ];

        const endpoints = [
            '/admin/matches/1/scores',
            '/admin/events',
            '/admin/teams',
            '/admin/matches'
        ];

        for (const endpoint of endpoints) {
            for (const testInput of edgeCaseInputs) {
                const response = await this.makeRequest(endpoint, {
                    method: 'POST',
                    body: JSON.stringify(testInput)
                });
                
                // Check for 500 errors indicating unhandled edge cases
                if (response.status === 500) {
                    this.logBug('HIGH', 'Unhandled Input Edge Case', 
                        `500 error on ${endpoint} with input: ${JSON.stringify(testInput).substr(0, 100)}`, 
                        'Input Validation', endpoint);
                }
                
                // Check if invalid data was accepted (should be 400, not 200/201)
                if (response.status >= 200 && response.status < 300) {
                    this.logBug('MEDIUM', 'Insufficient Input Validation', 
                        `Invalid input accepted on ${endpoint}: ${JSON.stringify(testInput).substr(0, 100)}`, 
                        'Input Validation', endpoint);
                }
            }
        }
    }

    // Test rate limiting and DoS protection
    async testRateLimiting() {
        this.currentTest = 'Rate Limiting Testing';
        console.log('\n🧪 Testing Rate Limiting...');
        
        const testEndpoints = [
            '/matches',
            '/events', 
            '/admin/matches/1/scores'
        ];

        for (const endpoint of testEndpoints) {
            // Send rapid requests
            const promises = [];
            for (let i = 0; i < 50; i++) {
                promises.push(this.makeRequest(endpoint, { method: 'GET' }));
            }
            
            const responses = await Promise.all(promises);
            
            // Check if any responses indicate rate limiting
            const rateLimited = responses.filter(r => r.status === 429).length;
            const successful = responses.filter(r => r.status >= 200 && r.status < 300).length;
            
            if (rateLimited === 0 && successful > 30) {
                this.logBug('MEDIUM', 'No Rate Limiting Detected', 
                    `${endpoint} processed ${successful}/50 rapid requests without rate limiting`, 
                    'DoS Protection', endpoint);
            }
        }
    }

    // Test concurrent update scenarios (race conditions)
    async testConcurrentUpdates() {
        this.currentTest = 'Concurrent Update Testing';
        console.log('\n🧪 Testing Concurrent Updates...');
        
        // Test simultaneous score updates
        const scoreUpdatePromises = [];
        for (let i = 0; i < 10; i++) {
            scoreUpdatePromises.push(
                this.makeRequest('/admin/matches/1/scores', {
                    method: 'POST',
                    body: JSON.stringify({
                        map_number: 1,
                        team1_score: i,
                        team2_score: i + 1,
                        timestamp: Date.now() + i
                    })
                })
            );
        }
        
        const responses = await Promise.all(scoreUpdatePromises);
        const successful = responses.filter(r => r.status >= 200 && r.status < 300).length;
        const errors = responses.filter(r => r.status >= 500).length;
        
        if (errors > 0) {
            this.logBug('HIGH', 'Concurrent Update Race Condition', 
                `${errors}/${responses.length} concurrent score updates failed with 500 errors`, 
                'Race Condition', '/admin/matches/1/scores');
        }
        
        // Test concurrent event creation
        const eventPromises = [];
        for (let i = 0; i < 5; i++) {
            eventPromises.push(
                this.makeRequest('/admin/events', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: `Test Event ${i} ${Date.now()}`,
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 86400000).toISOString()
                    })
                })
            );
        }
        
        const eventResponses = await Promise.all(eventPromises);
        const eventErrors = eventResponses.filter(r => r.status >= 500).length;
        
        if (eventErrors > 0) {
            this.logBug('HIGH', 'Concurrent Creation Race Condition', 
                `${eventErrors}/${eventResponses.length} concurrent event creations failed`, 
                'Race Condition', '/admin/events');
        }
    }

    // Test malformed JSON and content type attacks
    async testMalformedRequests() {
        this.currentTest = 'Malformed Request Testing';
        console.log('\n🧪 Testing Malformed Requests...');
        
        const endpoints = ['/admin/events', '/admin/matches', '/admin/teams'];
        
        const malformedPayloads = [
            '{"incomplete": json', // Invalid JSON
            '{}{}', // Double JSON objects
            'not-json-at-all', // Plain text
            new Array(10000).fill('a').join(''), // Huge payload
            '{"deeply": {"nested": {"object": {"with": {"many": {"levels": {}}}}}}}', // Deep nesting
            Buffer.alloc(50000, 'x').toString(), // Large buffer
        ];
        
        for (const endpoint of endpoints) {
            for (const payload of malformedPayloads) {
                const response = await this.makeRequest(endpoint, {
                    method: 'POST',
                    body: payload,
                    headers: { 'Content-Type': 'application/json' }
                });
                
                if (response.status === 500) {
                    this.logBug('MEDIUM', 'Malformed Request Handling', 
                        `500 error on ${endpoint} with malformed payload`, 
                        'Error Handling', endpoint);
                }
            }
            
            // Test with wrong content type
            const wrongContentResponse = await this.makeRequest(endpoint, {
                method: 'POST',
                body: JSON.stringify({ name: 'test' }),
                headers: { 'Content-Type': 'text/plain' }
            });
            
            if (wrongContentResponse.status === 500) {
                this.logBug('MEDIUM', 'Content-Type Handling Issue', 
                    `500 error on ${endpoint} with wrong Content-Type header`, 
                    'Error Handling', endpoint);
            }
        }
    }

    // Run all API tests
    async runAllTests() {
        console.log('\n🚀 Starting API Edge Case Detection...');
        console.log('='.repeat(60));
        
        try {
            await this.testSQLInjectionVulnerabilities();
            await this.testXSSVulnerabilities();
            await this.testAuthenticationBypass();
            await this.testInputValidationEdgeCases();
            await this.testRateLimiting();
            await this.testConcurrentUpdates();
            await this.testMalformedRequests();
            
            this.generateReport();
            
        } catch (error) {
            console.error('🚨 API test suite failed:', error);
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total_tests: 7,
                critical_bugs: this.criticalBugs.length,
                high_bugs: this.highBugs.length,
                medium_bugs: this.mediumBugs.length,
                total_issues: this.testResults.length
            },
            critical_findings: this.criticalBugs,
            high_findings: this.highBugs,
            all_findings: this.testResults,
            security_recommendations: [
                'Implement proper input sanitization for all API endpoints',
                'Add SQL injection protection using parameterized queries',
                'Implement proper authentication middleware for admin endpoints',
                'Add rate limiting to prevent DoS attacks',
                'Implement proper error handling to prevent information disclosure',
                'Add CSRF protection for state-changing operations',
                'Implement request size limits to prevent memory exhaustion'
            ]
        };
        
        const fs = require('fs');
        const filename = `API-BUG-DETECTION-REPORT-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        
        console.log('\n📊 API BUG DETECTION COMPLETE');
        console.log('='.repeat(60));
        console.log(`🚨 Critical Issues: ${report.summary.critical_bugs}`);
        console.log(`⚠️  High Issues: ${report.summary.high_bugs}`);
        console.log(`📋 Medium Issues: ${report.summary.medium_bugs}`);
        console.log(`📄 Full report saved: ${filename}`);
        
        return report;
    }
}

// Run the test suite
if (typeof module !== 'undefined' && require.main === module) {
    (async () => {
        const detector = new APIEdgeCaseDetector();
        const report = await detector.runAllTests();
        
        if (report.summary.critical_bugs > 0) {
            console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND');
            process.exit(1);
        }
    })();
}

module.exports = APIEdgeCaseDetector;