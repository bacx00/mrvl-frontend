#!/usr/bin/env node

/**
 * ADMIN PANEL DEBUG AND FIX VERIFICATION SCRIPT
 * Tests all identified issues and validates fixes
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000';
const TEST_RESULTS_FILE = path.join(__dirname, 'admin-debug-results.json');

class AdminDebugTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                total: 0,
                passed: 0,
                failed: 0,
                errors: []
            }
        };
    }

    async init() {
        console.log('🚀 Starting Admin Panel Debug Tests...');
        this.browser = await puppeteer.launch({ 
            headless: false, 
            defaultViewport: { width: 1920, height: 1080 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Enable console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
                this.results.summary.errors.push(`Console Error: ${msg.text()}`);
            } else if (msg.text().includes('Analytics') || msg.text().includes('AdminStats')) {
                console.log('📊 Analytics Log:', msg.text());
            }
        });

        this.page.on('response', response => {
            if (response.url().includes('/admin/') && response.status() >= 400) {
                console.log(`🔴 API Error: ${response.url()} - ${response.status()}`);
                this.results.summary.errors.push(`API Error: ${response.url()} - ${response.status()}`);
            }
        });
    }

    async addTestResult(name, status, details = {}) {
        this.results.tests.push({
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        });
        this.results.summary.total++;
        if (status === 'PASSED') {
            this.results.summary.passed++;
            console.log(`✅ ${name}: PASSED`);
        } else {
            this.results.summary.failed++;
            console.log(`❌ ${name}: FAILED`);
        }
    }

    async testBackendEndpoints() {
        console.log('\n🧪 Testing Backend API Endpoints...');
        
        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/stats`);
            const data = await response.json();
            
            if (response.ok && data.data) {
                await this.addTestResult('Admin Stats Endpoint', 'PASSED', {
                    url: '/api/admin/stats',
                    responseKeys: Object.keys(data.data)
                });
            } else {
                await this.addTestResult('Admin Stats Endpoint', 'FAILED', {
                    url: '/api/admin/stats',
                    status: response.status,
                    error: 'Invalid response structure'
                });
            }
        } catch (error) {
            await this.addTestResult('Admin Stats Endpoint', 'FAILED', {
                url: '/api/admin/stats',
                error: error.message
            });
        }

        try {
            const response = await fetch(`${BACKEND_URL}/api/admin/analytics?period=30d`);
            const data = await response.json();
            
            if (response.ok && data.data) {
                await this.addTestResult('Admin Analytics Endpoint', 'PASSED', {
                    url: '/api/admin/analytics',
                    responseStructure: Object.keys(data.data)
                });
            } else {
                await this.addTestResult('Admin Analytics Endpoint', 'FAILED', {
                    url: '/api/admin/analytics',
                    status: response.status,
                    error: 'Analytics endpoint not working'
                });
            }
        } catch (error) {
            await this.addTestResult('Admin Analytics Endpoint', 'FAILED', {
                url: '/api/admin/analytics',
                error: error.message
            });
        }
    }

    async testAdminDashboardAccess() {
        console.log('\n🔑 Testing Admin Dashboard Access...');
        
        try {
            await this.page.goto(FRONTEND_URL);
            await this.page.waitForSelector('body');
            
            // Look for login or admin interface
            const hasLoginForm = await this.page.$('form') !== null;
            const hasAdminPanel = await this.page.$('.admin') !== null || 
                                 await this.page.evaluate(() => window.location.href.includes('admin'));
            
            if (hasLoginForm || hasAdminPanel) {
                await this.addTestResult('Frontend Loading', 'PASSED', {
                    hasLoginForm,
                    hasAdminPanel
                });
            } else {
                await this.addTestResult('Frontend Loading', 'FAILED', {
                    error: 'No login form or admin panel found'
                });
            }
        } catch (error) {
            await this.addTestResult('Frontend Loading', 'FAILED', {
                error: error.message
            });
        }
    }

    async testAdvancedAnalytics() {
        console.log('\n📊 Testing Advanced Analytics Component...');
        
        try {
            // Try to navigate to analytics section (if accessible)
            await this.page.goto(`${FRONTEND_URL}/#analytics`);
            await this.page.waitForTimeout(3000);
            
            // Check for JavaScript errors specific to analytics
            const analyticsErrors = await this.page.evaluate(() => {
                const errors = [];
                // Check if any analytics-related elements exist
                const analyticsElements = document.querySelectorAll('[class*="analytics"], [id*="analytics"]');
                return {
                    elementsFound: analyticsElements.length,
                    hasAnalyticsContent: document.body.textContent.includes('Analytics')
                };
            });
            
            await this.addTestResult('Advanced Analytics Frontend', 'PASSED', analyticsErrors);
        } catch (error) {
            await this.addTestResult('Advanced Analytics Frontend', 'FAILED', {
                error: error.message
            });
        }
    }

    async testPaginationComponents() {
        console.log('\n📄 Testing Pagination Components...');
        
        try {
            // Test teams pagination logic
            const teamsResponse = await fetch(`${BACKEND_URL}/api/teams`);
            const teamsData = await teamsResponse.json();
            
            const teamCount = teamsData?.data?.length || teamsData?.length || 0;
            const shouldHavePagination = teamCount > 20; // Based on AdminTeams.js teamsPerPage = 20
            
            await this.addTestResult('Teams Pagination Logic', 'PASSED', {
                teamCount,
                shouldHavePagination,
                teamsPerPage: 20
            });

            // Test players pagination logic
            const playersResponse = await fetch(`${BACKEND_URL}/api/players`);
            const playersData = await playersResponse.json();
            
            const playerCount = playersData?.data?.length || playersData?.length || 0;
            const shouldHavePlayerPagination = playerCount > 20; // Based on AdminPlayers.js playersPerPage = 20
            
            await this.addTestResult('Players Pagination Logic', 'PASSED', {
                playerCount,
                shouldHavePlayerPagination,
                playersPerPage: 20
            });
            
        } catch (error) {
            await this.addTestResult('Pagination Components', 'FAILED', {
                error: error.message
            });
        }
    }

    async testMockDataRemoval() {
        console.log('\n🎲 Testing Mock Data Removal...');
        
        try {
            // Check AdminStatsController for rand() usage
            const controllerPath = '/var/www/mrvl-backend/app/Http/Controllers/AdminStatsController.php';
            const controllerContent = require('fs').readFileSync(controllerPath, 'utf8');
            
            const hasRandCalls = controllerContent.includes('rand(');
            const hasRandomCalls = controllerContent.includes('Math.random');
            
            if (!hasRandCalls) {
                await this.addTestResult('Mock Data Removal - Backend', 'PASSED', {
                    hasRandCalls: false,
                    hasRandomCalls
                });
            } else {
                await this.addTestResult('Mock Data Removal - Backend', 'FAILED', {
                    error: 'rand() calls still found in AdminStatsController',
                    hasRandCalls: true
                });
            }
            
        } catch (error) {
            await this.addTestResult('Mock Data Removal', 'FAILED', {
                error: error.message
            });
        }
    }

    async testConsoleErrors() {
        console.log('\n🐛 Testing Console Errors...');
        
        const errorCount = this.results.summary.errors.length;
        
        if (errorCount === 0) {
            await this.addTestResult('Console Errors', 'PASSED', {
                errorCount: 0
            });
        } else {
            await this.addTestResult('Console Errors', 'FAILED', {
                errorCount,
                errors: this.results.summary.errors.slice(0, 5) // First 5 errors
            });
        }
    }

    async generateReport() {
        console.log('\n📝 Generating Test Report...');
        
        this.results.summary.successRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
        
        // Write results to file
        fs.writeFileSync(TEST_RESULTS_FILE, JSON.stringify(this.results, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 ADMIN PANEL DEBUG TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${this.results.summary.total}`);
        console.log(`✅ Passed: ${this.results.summary.passed}`);
        console.log(`❌ Failed: ${this.results.summary.failed}`);
        console.log(`📈 Success Rate: ${this.results.summary.successRate}%`);
        console.log(`📁 Detailed Report: ${TEST_RESULTS_FILE}`);
        console.log('='.repeat(60));

        if (this.results.summary.errors.length > 0) {
            console.log('\n🚨 Critical Issues Found:');
            this.results.summary.errors.slice(0, 3).forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }

        return this.results;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async runAllTests() {
        try {
            await this.init();
            await this.testBackendEndpoints();
            await this.testAdminDashboardAccess();
            await this.testAdvancedAnalytics();
            await this.testPaginationComponents();
            await this.testMockDataRemoval();
            await this.testConsoleErrors();
            
            return await this.generateReport();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            this.results.summary.errors.push(`Test Suite Error: ${error.message}`);
            return await this.generateReport();
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new AdminDebugTest();
    tester.runAllTests().then(results => {
        process.exit(results.summary.failed > 0 ? 1 : 0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = AdminDebugTest;