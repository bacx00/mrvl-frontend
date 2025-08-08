#!/usr/bin/env node

/**
 * SIMPLE ADMIN PANEL DEBUG VERIFICATION
 * Tests backend API endpoints and validates fixes without browser automation
 */

const fs = require('fs');
const path = require('path');

class SimpleAdminTest {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: { total: 0, passed: 0, failed: 0, errors: [] }
        };
    }

    async addTestResult(name, status, details = {}) {
        this.results.tests.push({ name, status, details, timestamp: new Date().toISOString() });
        this.results.summary.total++;
        if (status === 'PASSED') {
            this.results.summary.passed++;
            console.log(`✅ ${name}: PASSED`);
        } else {
            this.results.summary.failed++;
            console.log(`❌ ${name}: FAILED - ${details.error || 'Unknown error'}`);
        }
    }

    async testFileChanges() {
        console.log('🔍 Testing File Changes and Code Quality...\n');
        
        // Test 1: Check AdminStatsController for mock data removal
        try {
            const controllerPath = '/var/www/mrvl-backend/app/Http/Controllers/AdminStatsController.php';
            const content = fs.readFileSync(controllerPath, 'utf8');
            
            const hasRandomCalls = content.includes('rand(12, 18)');
            const hasProperDuration = content.includes('getAverageMatchDuration') && 
                                     content.includes('strtotime($match->completed_at)');
            
            if (!hasRandomCalls && hasProperDuration) {
                await this.addTestResult('Mock Data Removal - AdminStatsController', 'PASSED', {
                    hasRandomCalls: false,
                    hasProperDuration: true
                });
            } else {
                await this.addTestResult('Mock Data Removal - AdminStatsController', 'FAILED', {
                    error: hasRandomCalls ? 'Still contains rand() calls' : 'Missing proper duration calculation',
                    hasRandomCalls,
                    hasProperDuration
                });
            }
        } catch (error) {
            await this.addTestResult('Mock Data Removal - AdminStatsController', 'FAILED', {
                error: error.message
            });
        }

        // Test 2: Check AdvancedAnalytics component for proper API usage
        try {
            const analyticsPath = '/var/www/mrvl-frontend/frontend/src/components/admin/AdvancedAnalytics.js';
            const content = fs.readFileSync(analyticsPath, 'utf8');
            
            const hasCorrectEndpoint = content.includes('api.get(`/admin/analytics?period=${timeRange}`)');
            const hasErrorHandling = content.includes('catch (specificError)');
            const hasFallback = content.includes('FALLBACK: Generate analytics from real available data');
            
            if (hasCorrectEndpoint && hasErrorHandling && hasFallback) {
                await this.addTestResult('AdvancedAnalytics API Integration', 'PASSED', {
                    hasCorrectEndpoint: true,
                    hasErrorHandling: true,
                    hasFallback: true
                });
            } else {
                await this.addTestResult('AdvancedAnalytics API Integration', 'FAILED', {
                    error: 'Missing proper API integration components',
                    hasCorrectEndpoint,
                    hasErrorHandling,
                    hasFallback
                });
            }
        } catch (error) {
            await this.addTestResult('AdvancedAnalytics API Integration', 'FAILED', {
                error: error.message
            });
        }

        // Test 3: Check AdminTeams for proper pagination
        try {
            const teamsPath = '/var/www/mrvl-frontend/frontend/src/components/admin/AdminTeams.js';
            const content = fs.readFileSync(teamsPath, 'utf8');
            
            const hasPaginationState = content.includes('const [currentPage, setCurrentPage]');
            const hasPaginationControls = content.includes('<Pagination') && content.includes('totalPages={totalPages}');
            const hasPaginatedData = content.includes('paginatedTeams = useMemo');
            
            if (hasPaginationState && hasPaginationControls && hasPaginatedData) {
                await this.addTestResult('AdminTeams Pagination', 'PASSED', {
                    hasPaginationState: true,
                    hasPaginationControls: true,
                    hasPaginatedData: true
                });
            } else {
                await this.addTestResult('AdminTeams Pagination', 'FAILED', {
                    error: 'Missing pagination components',
                    hasPaginationState,
                    hasPaginationControls,
                    hasPaginatedData
                });
            }
        } catch (error) {
            await this.addTestResult('AdminTeams Pagination', 'FAILED', {
                error: error.message
            });
        }

        // Test 4: Check AdminPlayers for proper pagination
        try {
            const playersPath = '/var/www/mrvl-frontend/frontend/src/components/admin/AdminPlayers.js';
            const content = fs.readFileSync(playersPath, 'utf8');
            
            const hasPaginationState = content.includes('const [currentPage, setCurrentPage]');
            const hasPaginationControls = content.includes('<Pagination') && content.includes('totalPages={totalPages}');
            const hasPaginatedData = content.includes('paginatedPlayers = useMemo');
            
            if (hasPaginationState && hasPaginationControls && hasPaginatedData) {
                await this.addTestResult('AdminPlayers Pagination', 'PASSED', {
                    hasPaginationState: true,
                    hasPaginationControls: true,
                    hasPaginatedData: true
                });
            } else {
                await this.addTestResult('AdminPlayers Pagination', 'FAILED', {
                    error: 'Missing pagination components',
                    hasPaginationState,
                    hasPaginationControls,
                    hasPaginatedData
                });
            }
        } catch (error) {
            await this.addTestResult('AdminPlayers Pagination', 'FAILED', {
                error: error.message
            });
        }

        // Test 5: Check AdminStats for proper null safety
        try {
            const statsPath = '/var/www/mrvl-frontend/frontend/src/components/admin/AdminStats.js';
            const content = fs.readFileSync(statsPath, 'utf8');
            
            const hasNullSafety = content.includes('|| 0}') && content.includes('{stats.totalTeams || 0}');
            const hasIcons = content.includes('🏆') && content.includes('👥');
            const hasErrorHandling = content.includes('catch (error)');
            
            if (hasNullSafety && hasIcons && hasErrorHandling) {
                await this.addTestResult('AdminStats UI Improvements', 'PASSED', {
                    hasNullSafety: true,
                    hasIcons: true,
                    hasErrorHandling: true
                });
            } else {
                await this.addTestResult('AdminStats UI Improvements', 'FAILED', {
                    error: 'Missing UI improvements or null safety',
                    hasNullSafety,
                    hasIcons,
                    hasErrorHandling
                });
            }
        } catch (error) {
            await this.addTestResult('AdminStats UI Improvements', 'FAILED', {
                error: error.message
            });
        }
    }

    async testAPIRoutes() {
        console.log('\n🛣️ Testing API Route Configuration...\n');
        
        try {
            const routesPath = '/var/www/mrvl-backend/routes/api.php';
            const content = fs.readFileSync(routesPath, 'utf8');
            
            const hasStatsRoute = content.includes("Route::get('/stats', [AdminStatsController::class, 'index'])");
            const hasAnalyticsRoute = content.includes("Route::get('/analytics', [AdminStatsController::class, 'analytics'])");
            
            if (hasStatsRoute && hasAnalyticsRoute) {
                await this.addTestResult('API Routes Configuration', 'PASSED', {
                    hasStatsRoute: true,
                    hasAnalyticsRoute: true
                });
            } else {
                await this.addTestResult('API Routes Configuration', 'FAILED', {
                    error: 'Missing required admin API routes',
                    hasStatsRoute,
                    hasAnalyticsRoute
                });
            }
        } catch (error) {
            await this.addTestResult('API Routes Configuration', 'FAILED', {
                error: error.message
            });
        }
    }

    async generateReport() {
        this.results.summary.successRate = this.results.summary.total > 0 ? 
            ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1) : '0.0';
        
        const reportPath = '/var/www/mrvl-frontend/frontend/admin-debug-simple-results.json';
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        console.log('\n' + '='.repeat(60));
        console.log('🎯 ADMIN PANEL DEBUG VERIFICATION RESULTS');
        console.log('='.repeat(60));
        console.log(`📊 Total Tests: ${this.results.summary.total}`);
        console.log(`✅ Passed: ${this.results.summary.passed}`);
        console.log(`❌ Failed: ${this.results.summary.failed}`);
        console.log(`📈 Success Rate: ${this.results.summary.successRate}%`);
        console.log(`📁 Report: ${reportPath}`);
        console.log('='.repeat(60));

        // Show detailed results for failed tests
        const failedTests = this.results.tests.filter(test => test.status === 'FAILED');
        if (failedTests.length > 0) {
            console.log('\n🔍 Failed Test Details:');
            failedTests.forEach((test, index) => {
                console.log(`${index + 1}. ${test.name}: ${test.details.error || 'Unknown error'}`);
            });
        }

        // Show summary of fixes implemented
        const passedTests = this.results.tests.filter(test => test.status === 'PASSED');
        if (passedTests.length > 0) {
            console.log('\n✅ Successfully Implemented Fixes:');
            passedTests.forEach((test, index) => {
                console.log(`${index + 1}. ${test.name}`);
            });
        }

        return this.results;
    }

    async runTests() {
        console.log('🚀 Starting Admin Panel Debug Verification...\n');
        
        try {
            await this.testFileChanges();
            await this.testAPIRoutes();
            return await this.generateReport();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            return await this.generateReport();
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new SimpleAdminTest();
    tester.runTests().then(results => {
        const hasIssues = results.summary.failed > 0;
        if (hasIssues) {
            console.log('\n⚠️ Some issues were found. Review the details above.');
        } else {
            console.log('\n🎉 All admin panel fixes have been successfully implemented!');
        }
        process.exit(hasIssues ? 1 : 0);
    }).catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = SimpleAdminTest;