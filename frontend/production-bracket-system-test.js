#!/usr/bin/env node

/**
 * PRODUCTION BRACKET SYSTEM VALIDATION
 * 
 * Tests the MRVL bracket system using available public endpoints
 * and validates the frontend components functionality.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    API_BASE: 'http://localhost:8000/api',
    FRONTEND_PATH: '/var/www/mrvl-frontend/frontend/src',
    TEST_TIMEOUT: 30000
};

// Test Results
const TEST_RESULTS = {
    timestamp: new Date().toISOString(),
    summary: {
        totalTests: 0,
        passed: 0,
        failed: 0,
        warnings: 0
    },
    categories: {},
    issues: [],
    recommendations: []
};

class BracketSystemValidator {
    constructor() {
        this.componentTests = [];
        this.apiTests = [];
    }
    
    log(message, type = 'INFO') {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${type}] ${message}`);
    }
    
    async testApiEndpoints() {
        this.log('🔍 Testing API Endpoints', 'INFO');
        const results = [];
        
        const endpoints = [
            { path: '/events', name: 'List Tournaments' },
            { path: '/teams', name: 'List Teams' },
            { path: '/matches', name: 'List Matches' },
            { path: '/rankings', name: 'Get Rankings' },
            { path: '/live-matches', name: 'Live Matches' }
        ];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${CONFIG.API_BASE}${endpoint.path}`);
                const data = await response.json();
                
                if (response.ok) {
                    this.log(`✅ ${endpoint.name}: Working (${response.status})`, 'PASS');
                    results.push({
                        endpoint: endpoint.name,
                        status: response.status,
                        passed: true,
                        data: Array.isArray(data) ? `${data.length} items` : typeof data
                    });
                } else {
                    this.log(`❌ ${endpoint.name}: Failed (${response.status})`, 'FAIL');
                    results.push({
                        endpoint: endpoint.name,
                        status: response.status,
                        passed: false,
                        error: data.message || response.statusText
                    });
                }
            } catch (error) {
                this.log(`🔥 ${endpoint.name}: Exception (${error.message})`, 'CRITICAL');
                results.push({
                    endpoint: endpoint.name,
                    status: 0,
                    passed: false,
                    error: error.message
                });
            }
        }
        
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        
        TEST_RESULTS.categories.api_endpoints = {
            passed,
            failed,
            total: results.length,
            results
        };
        
        this.log(`📊 API Endpoints: ${passed}/${results.length} passed`);
    }
    
    async testFrontendComponents() {
        this.log('🎨 Testing Frontend Components', 'INFO');
        const results = [];
        
        const components = [
            'LiquipediaDoubleEliminationBracket.js',
            'LiquipediaSwissBracket.js', 
            'LiquipediaRoundRobinBracket.js',
            'LiquipediaGSLBracket.js',
            'LiquipediaSingleEliminationBracket.js'
        ];
        
        const componentPath = path.join(CONFIG.FRONTEND_PATH, 'components');
        
        for (const component of components) {
            const filePath = path.join(componentPath, component);
            
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    const analysis = this.analyzeComponent(component, content);
                    
                    results.push({
                        component,
                        exists: true,
                        passed: analysis.valid,
                        issues: analysis.issues,
                        features: analysis.features
                    });
                    
                    if (analysis.valid) {
                        this.log(`✅ ${component}: Valid component`, 'PASS');
                    } else {
                        this.log(`⚠️ ${component}: Has issues`, 'WARN');
                    }
                } else {
                    this.log(`❌ ${component}: Missing component`, 'FAIL');
                    results.push({
                        component,
                        exists: false,
                        passed: false,
                        error: 'Component file not found'
                    });
                }
            } catch (error) {
                this.log(`🔥 ${component}: Analysis failed (${error.message})`, 'CRITICAL');
                results.push({
                    component,
                    exists: false,
                    passed: false,
                    error: error.message
                });
            }
        }
        
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        
        TEST_RESULTS.categories.frontend_components = {
            passed,
            failed,
            total: results.length,
            results
        };
        
        this.log(`📊 Frontend Components: ${passed}/${results.length} passed`);
    }
    
    analyzeComponent(componentName, content) {
        const analysis = {
            valid: true,
            issues: [],
            features: []
        };
        
        // Check for React component structure
        if (!content.includes('function ') && !content.includes('const ') && !content.includes('class ')) {
            analysis.valid = false;
            analysis.issues.push('No React component function/class found');
        }
        
        // Check for export
        if (!content.includes('export')) {
            analysis.valid = false;
            analysis.issues.push('No export statement found');
        }
        
        // Check for bracket-specific features
        const bracketFeatures = [
            { pattern: /onMatchClick|handleMatchClick/, feature: 'Match Click Handling' },
            { pattern: /onTeamClick|handleTeamClick/, feature: 'Team Click Handling' },
            { pattern: /bracket\.|tournament\./, feature: 'Bracket Data Handling' },
            { pattern: /standings|matches|rounds/, feature: 'Tournament Structure' },
            { pattern: /useState|useEffect/, feature: 'React Hooks' },
            { pattern: /className|style/, feature: 'Styling' }
        ];
        
        bracketFeatures.forEach(({ pattern, feature }) => {
            if (pattern.test(content)) {
                analysis.features.push(feature);
            }
        });
        
        // Format-specific checks
        if (componentName.includes('Double')) {
            if (content.includes('upper_bracket') && content.includes('lower_bracket')) {
                analysis.features.push('Double Elimination Structure');
            } else {
                analysis.issues.push('Missing double elimination structure');
            }
        }
        
        if (componentName.includes('Swiss')) {
            if (content.includes('standings') && content.includes('rounds')) {
                analysis.features.push('Swiss System Structure');
            } else {
                analysis.issues.push('Missing Swiss system structure');
            }
        }
        
        if (componentName.includes('RoundRobin')) {
            if (content.includes('groups') || content.includes('matrix')) {
                analysis.features.push('Round Robin Structure');
            } else {
                analysis.issues.push('Missing round robin structure');
            }
        }
        
        if (componentName.includes('GSL')) {
            if (content.includes('groups') && content.includes('winners') && content.includes('elimination')) {
                analysis.features.push('GSL Format Structure');
            } else {
                analysis.issues.push('Missing GSL format structure');
            }
        }
        
        return analysis;
    }
    
    async testBracketVisualization() {
        this.log('🖼️ Testing Bracket Visualization', 'INFO');
        
        // Test CSS files
        const cssFiles = [
            'liquipedia-tournament.css',
            'tournament-bracket.css',
            'bracket-clean.css'
        ];
        
        const cssPath = path.join(CONFIG.FRONTEND_PATH, 'styles');
        const cssResults = [];
        
        for (const cssFile of cssFiles) {
            const filePath = path.join(cssPath, cssFile);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const hasResponsive = content.includes('@media') || content.includes('responsive');
                const hasBracketStyles = content.includes('bracket') || content.includes('tournament');
                
                cssResults.push({
                    file: cssFile,
                    exists: true,
                    passed: hasResponsive && hasBracketStyles,
                    features: {
                        responsive: hasResponsive,
                        bracketStyles: hasBracketStyles
                    }
                });
                
                this.log(`✅ ${cssFile}: Found with ${hasResponsive ? 'responsive' : 'no responsive'} styles`, 'PASS');
            } else {
                cssResults.push({
                    file: cssFile,
                    exists: false,
                    passed: false
                });
                this.log(`❌ ${cssFile}: Missing`, 'FAIL');
            }
        }
        
        const passed = cssResults.filter(r => r.passed).length;
        const failed = cssResults.filter(r => !r.passed).length;
        
        TEST_RESULTS.categories.visualization = {
            passed,
            failed,
            total: cssResults.length,
            results: cssResults
        };
        
        this.log(`📊 Visualization: ${passed}/${cssResults.length} passed`);
    }
    
    async testServices() {
        this.log('🔧 Testing Services', 'INFO');
        
        const services = [
            'bracketApi.js',
            'tournamentApi.js',
            'liveUpdateService.js'
        ];
        
        const servicesPath = path.join(CONFIG.FRONTEND_PATH, 'services');
        const results = [];
        
        for (const service of services) {
            const filePath = path.join(servicesPath, service);
            
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                const analysis = this.analyzeService(service, content);
                
                results.push({
                    service,
                    exists: true,
                    passed: analysis.valid,
                    features: analysis.features,
                    issues: analysis.issues
                });
                
                if (analysis.valid) {
                    this.log(`✅ ${service}: Valid service`, 'PASS');
                } else {
                    this.log(`⚠️ ${service}: Has issues`, 'WARN');
                }
            } else {
                results.push({
                    service,
                    exists: false,
                    passed: false,
                    error: 'Service file not found'
                });
                this.log(`❌ ${service}: Missing`, 'FAIL');
            }
        }
        
        const passed = results.filter(r => r.passed).length;
        const failed = results.filter(r => !r.passed).length;
        
        TEST_RESULTS.categories.services = {
            passed,
            failed,
            total: results.length,
            results
        };
        
        this.log(`📊 Services: ${passed}/${results.length} passed`);
    }
    
    analyzeService(serviceName, content) {
        const analysis = {
            valid: true,
            issues: [],
            features: []
        };
        
        // Check for API functions
        const apiFunctions = [
            { pattern: /async|Promise/, feature: 'Async Operations' },
            { pattern: /fetch|axios/, feature: 'HTTP Requests' },
            { pattern: /error|catch/, feature: 'Error Handling' },
            { pattern: /export/, feature: 'Module Export' }
        ];
        
        apiFunctions.forEach(({ pattern, feature }) => {
            if (pattern.test(content)) {
                analysis.features.push(feature);
            }
        });
        
        // Service-specific checks
        if (serviceName.includes('bracket')) {
            const bracketFeatures = [
                { pattern: /getBracket|createBracket/, feature: 'Bracket CRUD' },
                { pattern: /updateMatch|getMatch/, feature: 'Match Operations' },
                { pattern: /standings|teams/, feature: 'Tournament Data' }
            ];
            
            bracketFeatures.forEach(({ pattern, feature }) => {
                if (pattern.test(content)) {
                    analysis.features.push(feature);
                }
            });
        }
        
        if (serviceName.includes('tournament')) {
            const tournamentFeatures = [
                { pattern: /getTournaments?|createTournament/, feature: 'Tournament CRUD' },
                { pattern: /addTeam|removeTeam/, feature: 'Team Management' },
                { pattern: /generateBracket|resetBracket/, feature: 'Bracket Management' }
            ];
            
            tournamentFeatures.forEach(({ pattern, feature }) => {
                if (pattern.test(content)) {
                    analysis.features.push(feature);
                }
            });
        }
        
        if (serviceName.includes('live')) {
            const liveFeatures = [
                { pattern: /WebSocket|EventSource/, feature: 'Real-time Connection' },
                { pattern: /subscribe|unsubscribe/, feature: 'Event Subscription' },
                { pattern: /update|notify/, feature: 'Live Updates' }
            ];
            
            liveFeatures.forEach(({ pattern, feature }) => {
                if (pattern.test(content)) {
                    analysis.features.push(feature);
                }
            });
        }
        
        return analysis;
    }
    
    async testBackendIntegration() {
        this.log('🔗 Testing Backend Integration', 'INFO');
        
        try {
            // Test if we can get tournament data and validate structure
            const tournamentsResponse = await fetch(`${CONFIG.API_BASE}/events`);
            const tournaments = await tournamentsResponse.json();
            
            const integrationResults = [];
            
            if (tournamentsResponse.ok) {
                this.log(`✅ Tournament data fetch: Working`, 'PASS');
                
                const tournamentData = Array.isArray(tournaments) ? tournaments : tournaments.data || [];
                
                if (tournamentData.length > 0) {
                    const sampleTournament = tournamentData[0];
                    
                    // Test tournament bracket endpoint
                    try {
                        const bracketResponse = await fetch(`${CONFIG.API_BASE}/events/${sampleTournament.id}/bracket`);
                        
                        if (bracketResponse.ok) {
                            this.log(`✅ Bracket data fetch: Working`, 'PASS');
                            integrationResults.push({ test: 'Bracket Fetch', passed: true });
                            
                            const bracketData = await bracketResponse.json();
                            
                            // Validate bracket structure
                            const hasValidStructure = this.validateBracketStructure(bracketData);
                            integrationResults.push({ 
                                test: 'Bracket Structure', 
                                passed: hasValidStructure,
                                details: hasValidStructure ? 'Valid structure' : 'Invalid or empty structure'
                            });
                            
                        } else {
                            this.log(`⚠️ Bracket data fetch: No bracket data (${bracketResponse.status})`, 'WARN');
                            integrationResults.push({ 
                                test: 'Bracket Fetch', 
                                passed: false, 
                                error: 'No bracket data available'
                            });
                        }
                    } catch (bracketError) {
                        this.log(`❌ Bracket fetch error: ${bracketError.message}`, 'FAIL');
                        integrationResults.push({ 
                            test: 'Bracket Fetch', 
                            passed: false, 
                            error: bracketError.message 
                        });
                    }
                    
                    // Test teams endpoint
                    try {
                        const teamsResponse = await fetch(`${CONFIG.API_BASE}/events/${sampleTournament.id}/teams`);
                        
                        if (teamsResponse.ok) {
                            this.log(`✅ Tournament teams fetch: Working`, 'PASS');
                            integrationResults.push({ test: 'Tournament Teams', passed: true });
                        } else {
                            this.log(`⚠️ Tournament teams: No team data (${teamsResponse.status})`, 'WARN');
                            integrationResults.push({ 
                                test: 'Tournament Teams', 
                                passed: false, 
                                error: 'No team data'
                            });
                        }
                    } catch (teamsError) {
                        integrationResults.push({ 
                            test: 'Tournament Teams', 
                            passed: false, 
                            error: teamsError.message 
                        });
                    }
                    
                } else {
                    this.log(`⚠️ No tournament data available`, 'WARN');
                    integrationResults.push({ 
                        test: 'Tournament Data', 
                        passed: false, 
                        error: 'No tournaments in database'
                    });
                }
                
            } else {
                this.log(`❌ Tournament data fetch failed: ${tournamentsResponse.status}`, 'FAIL');
                integrationResults.push({ 
                    test: 'Tournament Data Fetch', 
                    passed: false, 
                    error: `HTTP ${tournamentsResponse.status}`
                });
            }
            
            const passed = integrationResults.filter(r => r.passed).length;
            const failed = integrationResults.filter(r => !r.passed).length;
            
            TEST_RESULTS.categories.backend_integration = {
                passed,
                failed,
                total: integrationResults.length,
                results: integrationResults
            };
            
            this.log(`📊 Backend Integration: ${passed}/${integrationResults.length} passed`);
            
        } catch (error) {
            this.log(`🔥 Backend integration test failed: ${error.message}`, 'CRITICAL');
            TEST_RESULTS.categories.backend_integration = {
                passed: 0,
                failed: 1,
                total: 1,
                results: [{ test: 'Integration Test', passed: false, error: error.message }]
            };
        }
    }
    
    validateBracketStructure(bracketData) {
        if (!bracketData) return false;
        
        // Check for common bracket structures
        const hasRounds = bracketData.rounds && Array.isArray(bracketData.rounds);
        const hasUpperBracket = bracketData.upper_bracket;
        const hasLowerBracket = bracketData.lower_bracket;
        const hasGroups = bracketData.groups;
        const hasStandings = bracketData.standings && Array.isArray(bracketData.standings);
        
        // Valid if it has any recognized bracket structure
        return hasRounds || hasUpperBracket || hasLowerBracket || hasGroups || hasStandings;
    }
    
    generateRecommendations() {
        const categories = TEST_RESULTS.categories;
        
        // API recommendations
        if (categories.api_endpoints && categories.api_endpoints.failed > 0) {
            TEST_RESULTS.recommendations.push({
                category: 'API',
                priority: 'HIGH',
                issue: 'Some API endpoints are not working',
                solution: 'Fix failing API endpoints and ensure proper error handling'
            });
        }
        
        // Frontend component recommendations
        if (categories.frontend_components && categories.frontend_components.failed > 0) {
            TEST_RESULTS.recommendations.push({
                category: 'Frontend',
                priority: 'MEDIUM',
                issue: 'Some bracket components have issues',
                solution: 'Review and fix component issues to ensure proper bracket rendering'
            });
        }
        
        // Backend integration recommendations
        if (categories.backend_integration && categories.backend_integration.failed > 0) {
            TEST_RESULTS.recommendations.push({
                category: 'Integration',
                priority: 'HIGH',
                issue: 'Backend integration has problems',
                solution: 'Fix backend connectivity and data structure issues'
            });
        }
        
        // Service recommendations
        if (categories.services && categories.services.failed > 0) {
            TEST_RESULTS.recommendations.push({
                category: 'Services',
                priority: 'MEDIUM',
                issue: 'Some services are missing or have issues',
                solution: 'Implement missing services and fix service layer issues'
            });
        }
    }
    
    async runValidation() {
        this.log('🚀 Starting MRVL Bracket System Validation');
        
        try {
            // Run all test categories
            await this.testApiEndpoints();
            await this.testFrontendComponents();
            await this.testBracketVisualization();
            await this.testServices();
            await this.testBackendIntegration();
            
            // Calculate totals
            const categories = Object.values(TEST_RESULTS.categories);
            TEST_RESULTS.summary.totalTests = categories.reduce((sum, cat) => sum + cat.total, 0);
            TEST_RESULTS.summary.passed = categories.reduce((sum, cat) => sum + cat.passed, 0);
            TEST_RESULTS.summary.failed = categories.reduce((sum, cat) => sum + cat.failed, 0);
            
            // Generate recommendations
            this.generateRecommendations();
            
            // Save results
            const reportPath = path.join(__dirname, `bracket-validation-report-${Date.now()}.json`);
            fs.writeFileSync(reportPath, JSON.stringify(TEST_RESULTS, null, 2));
            
            // Print summary
            const passRate = ((TEST_RESULTS.summary.passed / TEST_RESULTS.summary.totalTests) * 100).toFixed(1);
            
            console.log('\n' + '='.repeat(60));
            console.log('🏁 MRVL BRACKET SYSTEM VALIDATION COMPLETE');
            console.log('='.repeat(60));
            console.log(`📊 Overall Pass Rate: ${passRate}%`);
            console.log(`✅ Tests Passed: ${TEST_RESULTS.summary.passed}`);
            console.log(`❌ Tests Failed: ${TEST_RESULTS.summary.failed}`);
            console.log(`📋 Report: ${reportPath}`);
            console.log('='.repeat(60));
            
            // Category breakdown
            Object.entries(TEST_RESULTS.categories).forEach(([category, results]) => {
                const categoryPassRate = ((results.passed / results.total) * 100).toFixed(1);
                console.log(`${category.toUpperCase()}: ${categoryPassRate}% (${results.passed}/${results.total})`);
            });
            
            console.log('\nRECOMMENDATIONS:');
            TEST_RESULTS.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.issue}`);
                console.log(`   Solution: ${rec.solution}`);
            });
            
            if (passRate >= 80) {
                this.log('🎉 Bracket system validation PASSED - System is functional!', 'PASS');
            } else if (passRate >= 60) {
                this.log('⚠️ Bracket system validation PARTIAL - Some issues need attention', 'WARN');
            } else {
                this.log('🚨 Bracket system validation FAILED - Significant issues found', 'FAIL');
            }
            
            return TEST_RESULTS;
            
        } catch (error) {
            this.log(`🔥 Validation failed: ${error.message}`, 'CRITICAL');
            throw error;
        }
    }
}

// Run the validation
if (require.main === module) {
    const validator = new BracketSystemValidator();
    
    validator.runValidation()
        .then(() => {
            console.log('\n✅ Validation completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Validation failed:', error.message);
            process.exit(1);
        });
}

module.exports = BracketSystemValidator;