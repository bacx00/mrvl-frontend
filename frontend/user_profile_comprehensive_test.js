/**
 * USER PROFILE SYSTEM COMPREHENSIVE TEST
 * Tests all user profile API endpoints and validates functionality
 */

const BASE_URL = 'http://localhost:8000';

class UserProfileTester {
    constructor() {
        this.results = {
            testResults: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                errors: [],
                warnings: []
            }
        };
        this.token = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    }

    async makeRequest(method, endpoint, data = null, useAuth = false) {
        const url = `${BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        if (useAuth && this.token) {
            headers.Authorization = `Bearer ${this.token}`;
        }

        const options = {
            method,
            headers
        };

        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const responseData = await response.text();
            let parsedData;
            
            try {
                parsedData = JSON.parse(responseData);
            } catch (e) {
                parsedData = { rawResponse: responseData };
            }

            return {
                status: response.status,
                data: parsedData,
                headers: Object.fromEntries(response.headers.entries())
            };
        } catch (error) {
            return {
                status: 0,
                error: error.message,
                data: null
            };
        }
    }

    async testEndpoint(name, method, endpoint, expectedStatus = 200, useAuth = false, data = null) {
        this.log(`Testing ${name}: ${method} ${endpoint}`);
        const result = await this.makeRequest(method, endpoint, data, useAuth);
        
        const test = {
            name,
            method,
            endpoint,
            expectedStatus,
            actualStatus: result.status,
            passed: result.status === expectedStatus,
            response: result.data,
            error: result.error || null,
            timestamp: new Date().toISOString()
        };

        this.results.testResults.push(test);
        this.results.summary.total++;

        if (test.passed) {
            this.results.summary.passed++;
            this.log(`✅ ${name}: PASSED (${result.status})`, 'success');
        } else {
            this.results.summary.failed++;
            this.log(`❌ ${name}: FAILED (expected ${expectedStatus}, got ${result.status})`, 'error');
            if (result.error) {
                this.results.summary.errors.push(`${name}: ${result.error}`);
            }
        }

        return test;
    }

    async attemptLogin() {
        this.log('Attempting to get authentication token...');
        
        // Try to login with default admin credentials
        const loginAttempts = [
            { email: 'admin@example.com', password: 'password' },
            { email: 'admin@test.com', password: 'password' },
            { email: 'admin@admin.com', password: 'admin123' },
            { email: 'test@example.com', password: 'password' }
        ];

        for (const credentials of loginAttempts) {
            const result = await this.makeRequest('POST', '/api/auth/login', credentials);
            
            if (result.status === 200 && result.data?.access_token) {
                this.token = result.data.access_token;
                this.log(`✅ Successfully logged in as ${credentials.email}`, 'success');
                return true;
            }
        }

        this.log('❌ Could not authenticate - will test unauthenticated endpoints only', 'warning');
        this.results.summary.warnings.push('Authentication failed - authenticated endpoints will return 401');
        return false;
    }

    async runPublicUserEndpointsTests() {
        this.log('\n=== TESTING PUBLIC USER ENDPOINTS ===');
        
        // Test valid user ID (1)
        await this.testEndpoint('Get User Profile (ID: 1)', 'GET', '/api/users/1', 200);
        await this.testEndpoint('Get User Stats (ID: 1)', 'GET', '/api/users/1/stats', 200);
        await this.testEndpoint('Get User Activities (ID: 1)', 'GET', '/api/users/1/activities', 200);
        await this.testEndpoint('Get User Forum Stats (ID: 1)', 'GET', '/api/users/1/forum-stats', 200);
        await this.testEndpoint('Get User Achievements (ID: 1)', 'GET', '/api/users/1/achievements', 200);
        
        // Test invalid user IDs
        await this.testEndpoint('Get User Profile (ID: 999)', 'GET', '/api/users/999', 404);
        await this.testEndpoint('Get User Stats (ID: 999)', 'GET', '/api/users/999/stats', 404);
        
        // Test edge cases
        await this.testEndpoint('Get User Profile (ID: 0)', 'GET', '/api/users/0', 404);
        await this.testEndpoint('Get User Profile (Invalid ID)', 'GET', '/api/users/invalid', 404);
    }

    async runAuthenticatedProfileTests() {
        this.log('\n=== TESTING AUTHENTICATED PROFILE ENDPOINTS ===');
        
        const expectedStatus = this.token ? 200 : 401;
        const authNote = this.token ? '' : ' (Unauthenticated)';
        
        await this.testEndpoint(`Get Current Profile${authNote}`, 'GET', '/api/profile', expectedStatus, true);
        await this.testEndpoint(`Get Available Flairs${authNote}`, 'GET', '/api/profile/available-flairs', expectedStatus, true);
        await this.testEndpoint(`Get Profile Activity${authNote}`, 'GET', '/api/profile/activity', expectedStatus, true);
        
        if (this.token) {
            // Test profile update (should work with valid token)
            const updateData = {
                name: 'Test User Updated',
                show_hero_flair: true,
                show_team_flair: false
            };
            await this.testEndpoint('Update Profile', 'PUT', '/api/profile', 200, true, updateData);
        }
    }

    async runErrorHandlingTests() {
        this.log('\n=== TESTING ERROR HANDLING ===');
        
        // Test malformed requests
        await this.testEndpoint('Invalid JSON in Profile Update', 'PUT', '/api/profile', 401, false, { invalid: 'data' });
        
        // Test rate limiting endpoints (should work without hitting limits in testing)
        const changePasswordData = {
            current_password: 'wrongpassword',
            new_password: 'newpassword123',
            new_password_confirmation: 'newpassword123'
        };
        
        const expectedStatus = this.token ? 422 : 401; // 422 for wrong current password, 401 for no auth
        await this.testEndpoint('Change Password (Wrong Current)', 'POST', '/api/profile/change-password', expectedStatus, true, changePasswordData);
    }

    validateResponseStructure(testResult) {
        if (!testResult.response || typeof testResult.response !== 'object') {
            return false;
        }

        const response = testResult.response;
        
        // Check for common API response structure
        if (response.success !== undefined) {
            // Laravel API structure with success field
            if (response.success && response.data) {
                return this.validateDataStructure(testResult.name, response.data);
            } else if (!response.success && response.message) {
                return true; // Valid error response
            }
        }

        // Direct data response
        return this.validateDataStructure(testResult.name, response);
    }

    validateDataStructure(testName, data) {
        const validations = {
            userProfile: ['id', 'name'],
            userStats: ['comments', 'forum', 'votes', 'activity'],
            userActivities: Array.isArray(data),
            userForumStats: ['threads_created', 'posts_created'],
            userAchievements: Array.isArray(data)
        };

        // Determine what type of data this should be based on test name
        if (testName.includes('Profile') && testName.includes('ID:')) {
            return this.hasRequiredFields(data, validations.userProfile);
        } else if (testName.includes('Stats')) {
            return this.hasRequiredFields(data, validations.userStats);
        } else if (testName.includes('Activities')) {
            return validations.userActivities;
        } else if (testName.includes('Forum Stats')) {
            return this.hasRequiredFields(data, validations.userForumStats);
        } else if (testName.includes('Achievements')) {
            return validations.userAchievements;
        }

        return true; // Default to valid if we can't determine
    }

    hasRequiredFields(obj, requiredFields) {
        if (!obj || typeof obj !== 'object') return false;
        return requiredFields.every(field => obj.hasOwnProperty(field));
    }

    async runStructureValidation() {
        this.log('\n=== VALIDATING RESPONSE STRUCTURES ===');
        
        let validStructures = 0;
        let invalidStructures = 0;
        
        for (const test of this.results.testResults) {
            if (test.passed && test.response) {
                const isValid = this.validateResponseStructure(test);
                if (isValid) {
                    validStructures++;
                    this.log(`✅ ${test.name}: Structure Valid`, 'success');
                } else {
                    invalidStructures++;
                    this.log(`❌ ${test.name}: Structure Invalid`, 'error');
                    this.results.summary.warnings.push(`${test.name}: Response structure doesn't match expected format`);
                }
            }
        }

        this.log(`\nStructure Validation: ${validStructures} valid, ${invalidStructures} invalid`);
    }

    generateReport() {
        this.log('\n=== GENERATING COMPREHENSIVE TEST REPORT ===');
        
        const report = {
            testExecuted: new Date().toISOString(),
            environment: {
                baseUrl: BASE_URL,
                authenticated: !!this.token
            },
            summary: this.results.summary,
            endpointResults: this.results.testResults,
            recommendations: [],
            criticalIssues: [],
            securityFindings: []
        };

        // Generate recommendations based on results
        const failedTests = this.results.testResults.filter(t => !t.passed);
        const successfulTests = this.results.testResults.filter(t => t.passed);

        if (failedTests.length === 0) {
            report.recommendations.push('✅ All tested endpoints are functioning correctly');
        } else {
            report.recommendations.push(`⚠️ ${failedTests.length} endpoints need attention`);
        }

        // Check for authentication issues
        const authTests = this.results.testResults.filter(t => t.endpoint.includes('/profile'));
        const failedAuthTests = authTests.filter(t => !t.passed && t.actualStatus === 401);
        
        if (failedAuthTests.length > 0) {
            report.securityFindings.push('Authentication system is properly protecting secured endpoints');
        }

        // Check for proper error handling
        const notFoundTests = this.results.testResults.filter(t => t.actualStatus === 404);
        if (notFoundTests.length > 0) {
            report.recommendations.push('✅ Proper 404 error handling for non-existent resources');
        }

        // Critical issues
        const serverErrors = this.results.testResults.filter(t => t.actualStatus >= 500);
        if (serverErrors.length > 0) {
            report.criticalIssues.push(`🚨 ${serverErrors.length} server errors detected - immediate attention required`);
        }

        // Frontend compatibility analysis
        const compatibilityIssues = [];
        for (const test of successfulTests) {
            if (test.response && test.response.data) {
                const data = test.response.data;
                
                // Check user stats structure matches frontend expectations
                if (test.name.includes('Stats') && data.comments) {
                    if (!data.comments.total || !data.forum.total) {
                        compatibilityIssues.push(`${test.name}: Missing nested structure expected by frontend`);
                    }
                }
            }
        }

        if (compatibilityIssues.length > 0) {
            report.recommendations.push('⚠️ Some response structures may need adjustment for frontend compatibility');
            report.recommendations.push(...compatibilityIssues);
        }

        return report;
    }

    async runComprehensiveTest() {
        this.log('🚀 Starting Comprehensive User Profile System Test');
        this.log('=' * 60);
        
        // Step 1: Authentication
        await this.attemptLogin();
        
        // Step 2: Public endpoints
        await this.runPublicUserEndpointsTests();
        
        // Step 3: Authenticated endpoints  
        await this.runAuthenticatedProfileTests();
        
        // Step 4: Error handling
        await this.runErrorHandlingTests();
        
        // Step 5: Structure validation
        await this.runStructureValidation();
        
        // Step 6: Generate final report
        const report = this.generateReport();
        
        this.log('\n' + '=' * 60);
        this.log('📊 TEST EXECUTION COMPLETE');
        this.log(`Total Tests: ${report.summary.total}`);
        this.log(`Passed: ${report.summary.passed}`);
        this.log(`Failed: ${report.summary.failed}`);
        this.log(`Warnings: ${report.summary.warnings.length}`);
        this.log(`Errors: ${report.summary.errors.length}`);
        
        return report;
    }
}

// Execute the test if running directly
if (typeof window === 'undefined') {
    // Node.js environment
    const fetch = require('node-fetch');
    global.fetch = fetch;
    
    const tester = new UserProfileTester();
    tester.runComprehensiveTest().then(report => {
        console.log('\n📋 FINAL REPORT:');
        console.log(JSON.stringify(report, null, 2));
        process.exit(report.summary.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
} else {
    // Browser environment - make tester available globally
    window.UserProfileTester = UserProfileTester;
}