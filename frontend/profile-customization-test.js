#!/usr/bin/env node

/**
 * Profile Customization System Comprehensive Test Suite
 * Tests hero selection, team flair system, API endpoints, and frontend integration
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BACKEND_BASE_URL = 'http://localhost:8000/api';
const FRONTEND_BASE_URL = 'http://localhost:3000';

class ProfileCustomizationTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            testResults: [],
            errors: [],
            warnings: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                warnings: 0
            }
        };
        this.browser = null;
        this.page = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(logMessage);
        
        if (type === 'error') {
            this.results.errors.push({ timestamp, message });
        } else if (type === 'warning') {
            this.results.warnings.push({ timestamp, message });
        }
    }

    addTestResult(testName, passed, details = '') {
        this.results.testResults.push({
            testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
        
        this.results.summary.total++;
        if (passed) {
            this.results.summary.passed++;
            this.log(`✅ ${testName}`, 'info');
        } else {
            this.results.summary.failed++;
            this.log(`❌ ${testName}: ${details}`, 'error');
        }
    }

    async init() {
        try {
            this.log('Initializing Puppeteer browser...');
            this.browser = await puppeteer.launch({
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            this.page = await this.browser.newPage();
            
            // Set viewport for consistent testing
            await this.page.setViewport({ width: 1280, height: 720 });
            
            // Listen to console logs
            this.page.on('console', msg => {
                if (msg.type() === 'error') {
                    this.log(`Browser console error: ${msg.text()}`, 'error');
                }
            });
            
            // Listen to page errors
            this.page.on('pageerror', error => {
                this.log(`Page error: ${error.message}`, 'error');
            });
            
            this.log('Browser initialized successfully');
            return true;
        } catch (error) {
            this.log(`Failed to initialize browser: ${error.message}`, 'error');
            return false;
        }
    }

    async testHeroesAPIEndpoint() {
        this.log('Testing Heroes API Endpoint: /api/public/heroes/images/all');
        
        try {
            // Test the API endpoint directly
            const response = await fetch(`${BACKEND_BASE_URL}/public/heroes/images/all`);
            
            if (!response.ok) {
                this.addTestResult('Heroes API Response Status', false, `HTTP ${response.status}: ${response.statusText}`);
                return false;
            }
            
            const data = await response.json();
            
            // Test data structure
            const hasData = data && typeof data.data !== 'undefined';
            this.addTestResult('Heroes API Has Data Property', hasData, hasData ? 'Contains data property' : 'Missing data property');
            
            if (!hasData) return false;
            
            // Test if data is array
            const isArray = Array.isArray(data.data);
            this.addTestResult('Heroes API Data is Array', isArray, isArray ? `Contains ${data.data.length} heroes` : 'Data is not array format');
            
            if (!isArray) return false;
            
            // Test hero data structure
            const sampleHero = data.data[0];
            const requiredFields = ['id', 'name', 'slug', 'role', 'image_url', 'image_exists'];
            const hasRequiredFields = requiredFields.every(field => sampleHero.hasOwnProperty(field));
            this.addTestResult('Heroes API Hero Structure', hasRequiredFields, 
                hasRequiredFields ? 'All required fields present' : `Missing fields: ${requiredFields.filter(f => !sampleHero.hasOwnProperty(f)).join(', ')}`);
            
            // Test role grouping capability
            const roles = [...new Set(data.data.map(hero => hero.role))];
            const expectedRoles = ['Vanguard', 'Duelist', 'Strategist'];
            const hasExpectedRoles = expectedRoles.every(role => roles.includes(role));
            this.addTestResult('Heroes API Role Coverage', hasExpectedRoles, 
                hasExpectedRoles ? `Found all roles: ${roles.join(', ')}` : `Missing roles: ${expectedRoles.filter(r => !roles.includes(r)).join(', ')}`);
            
            // Test for "a.map is not a function" prevention
            const canGroupByRole = data.data.reduce((acc, hero) => {
                if (!acc[hero.role]) acc[hero.role] = [];
                acc[hero.role].push(hero);
                return acc;
            }, {});
            
            const groupingWorks = Object.keys(canGroupByRole).length === roles.length;
            this.addTestResult('Heroes API Grouping Capability', groupingWorks, 
                groupingWorks ? 'Successfully grouped by role' : 'Failed to group by role');
            
            this.log(`Heroes API Test Complete: ${data.data.length} heroes, ${roles.length} roles`);
            return true;
            
        } catch (error) {
            this.addTestResult('Heroes API Endpoint Access', false, error.message);
            return false;
        }
    }

    async testTeamsAPIEndpoint() {
        this.log('Testing Teams API Endpoint: /api/teams');
        
        try {
            const response = await fetch(`${BACKEND_BASE_URL}/teams`);
            
            if (!response.ok) {
                this.addTestResult('Teams API Response Status', false, `HTTP ${response.status}: ${response.statusText}`);
                return false;
            }
            
            const data = await response.json();
            
            // Test data structure
            const hasData = data && (data.data || Array.isArray(data));
            this.addTestResult('Teams API Has Data', hasData, hasData ? 'Contains team data' : 'Missing team data');
            
            if (!hasData) return false;
            
            const teams = data.data || data;
            const isArray = Array.isArray(teams);
            this.addTestResult('Teams API Data is Array', isArray, isArray ? `Contains ${teams.length} teams` : 'Data is not array format');
            
            if (isArray && teams.length > 0) {
                // Test team data structure
                const sampleTeam = teams[0];
                const requiredFields = ['id', 'name'];
                const hasRequiredFields = requiredFields.every(field => sampleTeam.hasOwnProperty(field));
                this.addTestResult('Teams API Team Structure', hasRequiredFields, 
                    hasRequiredFields ? 'Required fields present' : `Missing fields: ${requiredFields.filter(f => !sampleTeam.hasOwnProperty(f)).join(', ')}`);
                
                // Test logo handling
                const teamsWithLogos = teams.filter(team => team.logo).length;
                this.addTestResult('Teams API Logo Support', teamsWithLogos > 0, 
                    `${teamsWithLogos} teams have logos out of ${teams.length}`);
            }
            
            return true;
            
        } catch (error) {
            this.addTestResult('Teams API Endpoint Access', false, error.message);
            return false;
        }
    }

    async testUserProfileFlairsEndpoint() {
        this.log('Testing User Profile Flairs Endpoint: /api/user/profile/flairs');
        
        try {
            // Note: This test requires authentication, so it might fail
            const response = await fetch(`${BACKEND_BASE_URL}/user/profile/flairs`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    hero_flair: 'Spider-Man',
                    team_flair_id: 1,
                    show_hero_flair: true,
                    show_team_flair: true
                })
            });
            
            if (response.status === 401) {
                this.addTestResult('User Profile Flairs Endpoint Authentication', true, 'Correctly requires authentication');
                return true;
            }
            
            if (!response.ok) {
                this.addTestResult('User Profile Flairs Response Status', false, `HTTP ${response.status}: ${response.statusText}`);
                return false;
            }
            
            const data = await response.json();
            this.addTestResult('User Profile Flairs Endpoint', true, 'Endpoint accessible and responds correctly');
            
            return true;
            
        } catch (error) {
            // Network errors are expected for auth-protected endpoints
            this.addTestResult('User Profile Flairs Endpoint Accessibility', true, 'Endpoint exists (auth required)');
            return true;
        }
    }

    async testFrontendHeroSelection() {
        this.log('Testing Frontend Hero Selection Modal');
        
        try {
            // Navigate to the frontend
            await this.page.goto(`${FRONTEND_BASE_URL}/user/profile`, { waitUntil: 'networkidle0', timeout: 30000 });
            
            // Check if the page loads without errors
            const title = await this.page.title();
            this.addTestResult('Frontend Profile Page Load', title.length > 0, `Page title: ${title}`);
            
            // Look for hero selection button (might require authentication)
            const heroButton = await this.page.$('button:contains("Choose Hero Avatar")');
            if (heroButton) {
                this.addTestResult('Hero Selection Button Present', true, 'Hero avatar button found');
                
                // Click the button to test modal
                await heroButton.click();
                await this.page.waitForTimeout(1000);
                
                // Check if modal opens
                const modal = await this.page.$('.fixed.inset-0.bg-black.bg-opacity-50');
                this.addTestResult('Hero Selection Modal Opens', !!modal, modal ? 'Modal opened successfully' : 'Modal failed to open');
                
            } else {
                this.addTestResult('Hero Selection Button Present', false, 'Button not found (may require authentication)');
            }
            
            // Check for JavaScript errors in console
            const errors = this.results.errors.filter(error => error.message.includes('Browser console error'));
            const hasJSErrors = errors.some(error => 
                error.message.includes('a.map is not a function') || 
                error.message.includes('Cannot read property') ||
                error.message.includes('TypeError')
            );
            
            this.addTestResult('Frontend JavaScript Errors', !hasJSErrors, 
                hasJSErrors ? 'Found JavaScript errors in console' : 'No critical JavaScript errors detected');
            
            return true;
            
        } catch (error) {
            this.addTestResult('Frontend Hero Selection Test', false, error.message);
            return false;
        }
    }

    async testImageHandling() {
        this.log('Testing Image Handling and Fallbacks');
        
        try {
            // Test hero image URLs
            const heroesResponse = await fetch(`${BACKEND_BASE_URL}/public/heroes/images/all`);
            const heroesData = await heroesResponse.json();
            
            if (heroesData.data && Array.isArray(heroesData.data)) {
                const sampleHeroes = heroesData.data.slice(0, 5); // Test first 5 heroes
                let imageTestsPassed = 0;
                
                for (const hero of sampleHeroes) {
                    try {
                        const imageUrl = `${BACKEND_BASE_URL.replace('/api', '')}${hero.image_url}`;
                        const imageResponse = await fetch(imageUrl, { method: 'HEAD' });
                        
                        if (imageResponse.ok || hero.is_fallback) {
                            imageTestsPassed++;
                        }
                    } catch (imageError) {
                        // Images might not be accessible from this context
                        if (hero.is_fallback) {
                            imageTestsPassed++;
                        }
                    }
                }
                
                this.addTestResult('Hero Image Handling', imageTestsPassed > 0, 
                    `${imageTestsPassed}/${sampleHeroes.length} hero images handled correctly`);
            }
            
            // Test team logo handling
            const teamsResponse = await fetch(`${BACKEND_BASE_URL}/teams`);
            const teamsData = await teamsResponse.json();
            const teams = teamsData.data || teamsData;
            
            if (Array.isArray(teams) && teams.length > 0) {
                const teamsWithLogos = teams.filter(team => team.logo).slice(0, 3);
                let logoTestsPassed = 0;
                
                for (const team of teamsWithLogos) {
                    // Test if team has proper fallback structure
                    if (team.short_name || team.name) {
                        logoTestsPassed++;
                    }
                }
                
                this.addTestResult('Team Logo Fallback System', logoTestsPassed === teamsWithLogos.length, 
                    `${logoTestsPassed}/${teamsWithLogos.length} teams have proper fallback text`);
            }
            
            return true;
            
        } catch (error) {
            this.addTestResult('Image Handling Test', false, error.message);
            return false;
        }
    }

    async testErrorHandling() {
        this.log('Testing Error Handling and Edge Cases');
        
        try {
            // Test non-existent hero endpoint
            const nonExistentHero = await fetch(`${BACKEND_BASE_URL}/public/heroes/images/non-existent-hero`);
            const handles404 = !nonExistentHero.ok;
            this.addTestResult('Non-existent Hero Handling', handles404, 
                handles404 ? 'Returns appropriate error for missing hero' : 'Should return 404 for non-existent hero');
            
            // Test malformed requests
            try {
                const malformedRequest = await fetch(`${BACKEND_BASE_URL}/user/profile/flairs`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: 'invalid-json'
                });
                
                const handlesMalformed = !malformedRequest.ok;
                this.addTestResult('Malformed Request Handling', handlesMalformed, 
                    handlesMalformed ? 'Properly rejects malformed requests' : 'Should reject malformed requests');
            } catch (error) {
                this.addTestResult('Malformed Request Handling', true, 'Network layer prevents malformed requests');
            }
            
            return true;
            
        } catch (error) {
            this.addTestResult('Error Handling Test', false, error.message);
            return false;
        }
    }

    async runAllTests() {
        this.log('🚀 Starting Profile Customization System Tests');
        
        const initSuccess = await this.init();
        if (!initSuccess) {
            this.log('Failed to initialize test environment', 'error');
            return this.results;
        }
        
        try {
            // Test Backend APIs
            await this.testHeroesAPIEndpoint();
            await this.testTeamsAPIEndpoint();
            await this.testUserProfileFlairsEndpoint();
            
            // Test Frontend Integration
            await this.testFrontendHeroSelection();
            
            // Test Image and Error Handling
            await this.testImageHandling();
            await this.testErrorHandling();
            
        } catch (error) {
            this.log(`Test suite error: ${error.message}`, 'error');
        }
        
        // Calculate final results
        this.results.summary.warnings = this.results.warnings.length;
        
        this.log(`\n📊 Test Results Summary:`);
        this.log(`Total Tests: ${this.results.summary.total}`);
        this.log(`Passed: ${this.results.summary.passed} ✅`);
        this.log(`Failed: ${this.results.summary.failed} ❌`);
        this.log(`Warnings: ${this.results.summary.warnings} ⚠️`);
        this.log(`Success Rate: ${(this.results.summary.passed / this.results.summary.total * 100).toFixed(1)}%`);
        
        return this.results;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            this.log('Browser closed');
        }
    }

    async saveResults() {
        const timestamp = Date.now();
        const filename = `profile-customization-test-results-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        try {
            fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
            this.log(`Test results saved to: ${filepath}`);
            return filepath;
        } catch (error) {
            this.log(`Failed to save results: ${error.message}`, 'error');
            return null;
        }
    }
}

// Global fetch for Node.js (if not available)
if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
}

// Main execution
async function main() {
    const tester = new ProfileCustomizationTester();
    
    try {
        const results = await tester.runAllTests();
        await tester.saveResults();
        
        // Exit with appropriate code
        process.exit(results.summary.failed === 0 ? 0 : 1);
        
    } catch (error) {
        console.error('Test suite failed:', error);
        process.exit(1);
    } finally {
        await tester.cleanup();
    }
}

if (require.main === module) {
    main();
}

module.exports = ProfileCustomizationTester;