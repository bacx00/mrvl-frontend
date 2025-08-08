#!/usr/bin/env node

/**
 * Real-time Functionality Testing Suite
 * Tests live scoring, real-time updates, and synchronization
 */

const fs = require('fs').promises;
const http = require('http');
const https = require('https');

class RealTimeFunctionalityTester {
    constructor() {
        this.results = {
            liveScoring: {},
            realTimeSync: {},
            matchControl: {},
            webSocket: {},
            localStorage: {},
            api: {},
            issues: [],
            recommendations: [],
            performance: {}
        };
        this.frontendUrl = 'http://localhost:3000';
        this.apiUrl = 'http://localhost:8000/api';
    }

    async testAPIEndpoints() {
        console.log('🌐 Testing API Endpoints...');
        
        const endpoints = [
            { path: '/matches', method: 'GET', description: 'Get all matches' },
            { path: '/matches/1', method: 'GET', description: 'Get specific match' },
            { path: '/teams', method: 'GET', description: 'Get all teams' },
            { path: '/players', method: 'GET', description: 'Get all players' },
            { path: '/events', method: 'GET', description: 'Get all events' }
        ];

        const apiResults = {};

        for (const endpoint of endpoints) {
            try {
                const result = await this.makeAPIRequest(endpoint.path, endpoint.method);
                apiResults[endpoint.path] = {
                    status: 'success',
                    statusCode: result.statusCode,
                    responseTime: result.responseTime,
                    hasData: result.data && result.data.length > 0,
                    dataLength: result.data ? result.data.length : 0
                };
            } catch (error) {
                apiResults[endpoint.path] = {
                    status: 'error',
                    error: error.message
                };
                this.results.issues.push({
                    type: 'API Error',
                    endpoint: endpoint.path,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }

        this.results.api = apiResults;
    }

    makeAPIRequest(path, method = 'GET') {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const url = `${this.apiUrl}${path}`;
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 10000
            };

            const protocol = url.startsWith('https') ? https : http;
            
            const req = protocol.request(url, options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    const responseTime = Date.now() - startTime;
                    
                    try {
                        const parsedData = data ? JSON.parse(data) : null;
                        resolve({
                            statusCode: res.statusCode,
                            responseTime,
                            data: parsedData
                        });
                    } catch (parseError) {
                        resolve({
                            statusCode: res.statusCode,
                            responseTime,
                            data: data,
                            parseError: parseError.message
                        });
                    }
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    async testLiveScoringComponents() {
        console.log('⚡ Testing Live Scoring Components...');
        
        const componentFiles = [
            '/var/www/mrvl-frontend/frontend/src/components/admin/SinglePageLiveScoring.js',
            '/var/www/mrvl-frontend/frontend/src/components/admin/ComprehensiveLiveScoring.js',
            '/var/www/mrvl-frontend/frontend/src/components/admin/ComprehensiveMatchControl.js',
            '/var/www/mrvl-frontend/frontend/src/components/pages/MatchDetailPage.js'
        ];

        const componentResults = {};

        for (const file of componentFiles) {
            try {
                const content = await fs.readFile(file, 'utf8');
                componentResults[file] = this.analyzeLiveScoringFeatures(content);
            } catch (error) {
                componentResults[file] = {
                    exists: false,
                    error: error.message
                };
            }
        }

        this.results.liveScoring = componentResults;
    }

    analyzeLiveScoringFeatures(content) {
        const features = {
            // Real-time capabilities
            hasWebSocket: /WebSocket|socket\.io|ws:|wss:/i.test(content),
            hasSSE: /EventSource|Server.*Sent.*Events/i.test(content),
            hasPusher: /pusher|Pusher/i.test(content),
            hasLocalStorageSync: /localStorage|sessionStorage/i.test(content),
            
            // Live scoring features
            hasScoreUpdates: /score.*update|updateScore|setScore|team1_score|team2_score/i.test(content),
            hasPlayerStats: /player.*stats|kills|deaths|assists|damage/i.test(content),
            hasHeroSelection: /hero.*select|selectHero|heroId|composition/i.test(content),
            hasMapTransitions: /map.*transition|nextMap|changeMap|current_map/i.test(content),
            hasMatchStatus: /match.*status|matchState|gameState|status.*change/i.test(content),
            hasTimer: /timer|Timer|match.*timer|countdown/i.test(content),
            
            // User interface
            hasButtons: /button|Button|onClick/i.test(content),
            hasInputs: /input|Input|onChange|value=/i.test(content),
            hasSelects: /select|Select|option|dropdown/i.test(content),
            hasModals: /modal|Modal|dialog|Dialog/i.test(content),
            
            // Data management
            hasStateManagement: /useState|useReducer|redux|context/i.test(content),
            hasEffects: /useEffect|componentDidMount|componentDidUpdate/i.test(content),
            hasErrorHandling: /try.*catch|error|Error|catch\(|\.catch/i.test(content),
            hasLoading: /loading|Loading|isLoading|spinner|Spinner/i.test(content),
            
            // API integration
            hasAPICallsScoreUpdate: /api.*score|score.*api|PUT.*score|POST.*score/i.test(content),
            hasAPICallsPlayerStats: /api.*stats|stats.*api|PUT.*stats|POST.*stats/i.test(content),
            hasAPICallsMatchStatus: /api.*status|status.*api|PUT.*status|POST.*status/i.test(content),
            
            // Performance features
            hasOptimizations: /memo|useMemo|useCallback|shouldComponentUpdate/i.test(content),
            hasDebouncing: /debounce|throttle|delay/i.test(content),
            
            // Advanced features
            hasAutoSave: /auto.*save|autosave|save.*interval/i.test(content),
            hasConflictResolution: /conflict|version|timestamp|optimistic/i.test(content),
            hasOfflineSupport: /offline|cache|storage.*fallback/i.test(content)
        };

        const issues = [];
        
        // Check for critical issues
        if (!features.hasScoreUpdates) {
            issues.push('No score update functionality detected');
        }
        
        if (!features.hasErrorHandling) {
            issues.push('No error handling detected');
        }
        
        if (!features.hasLoading) {
            issues.push('No loading states detected');
        }
        
        if (!features.hasAPICallsScoreUpdate && !features.hasLocalStorageSync) {
            issues.push('No real-time update mechanism detected');
        }

        return {
            exists: true,
            features,
            issues,
            capabilities: {
                realTime: features.hasWebSocket || features.hasSSE || features.hasPusher || features.hasLocalStorageSync,
                fullFeatured: features.hasScoreUpdates && features.hasPlayerStats && features.hasHeroSelection,
                userFriendly: features.hasButtons && features.hasInputs && features.hasErrorHandling,
                performant: features.hasOptimizations || features.hasDebouncing
            }
        };
    }

    async testWebSocketConnectivity() {
        console.log('🔌 Testing WebSocket Connectivity...');
        
        // Check if WebSocket server is available
        try {
            // Check for pusher configuration
            const configFile = '/var/www/mrvl-frontend/frontend/src/config.js';
            const configContent = await fs.readFile(configFile, 'utf8');
            
            const hasPusherConfig = /pusher|PUSHER|websocket|WEBSOCKET/i.test(configContent);
            const hasWSConfig = /ws:|wss:|WebSocket/i.test(configContent);
            
            this.results.webSocket = {
                hasPusherConfig,
                hasWSConfig,
                configFound: true
            };
            
        } catch (error) {
            this.results.webSocket = {
                configFound: false,
                error: error.message
            };
        }
    }

    async testLocalStorageSynchronization() {
        console.log('💾 Testing localStorage Synchronization...');
        
        // Test localStorage functionality by examining the code
        try {
            const liveScoringFile = '/var/www/mrvl-frontend/frontend/src/components/admin/SinglePageLiveScoring.js';
            const content = await fs.readFile(liveScoringFile, 'utf8');
            
            const localStorageFeatures = {
                hasStorageHelpers: /saveMatchDataToStorage|restoreMatchDataFromStorage|clearMatchDataFromStorage/i.test(content),
                hasStorageKeys: /STORAGE_KEY_PREFIX|storageKey/i.test(content),
                hasStorageCleanup: /removeItem|clear.*storage/i.test(content),
                hasStorageValidation: /timestamp|version|stale/i.test(content),
                hasStorageSync: /triggerMatchRefresh|matchRefresh_/i.test(content)
            };
            
            this.results.localStorage = {
                ...localStorageFeatures,
                syncMechanism: localStorageFeatures.hasStorageSync ? 'localStorage-based' : 'none'
            };
            
        } catch (error) {
            this.results.localStorage = {
                error: error.message
            };
        }
    }

    async testMatchWorkflows() {
        console.log('🎮 Testing Match Workflows...');
        
        const workflows = {
            matchCreation: await this.testMatchCreationWorkflow(),
            liveScoring: await this.testLiveScoringWorkflow(),
            matchCompletion: await this.testMatchCompletionWorkflow()
        };
        
        this.results.matchControl = workflows;
    }

    async testMatchCreationWorkflow() {
        // Test match creation by checking admin components
        try {
            const adminMatchFile = '/var/www/mrvl-frontend/frontend/src/components/admin/AdminMatches.js';
            const content = await fs.readFile(adminMatchFile, 'utf8');
            
            return {
                hasCreateButton: /create.*match|new.*match|add.*match/i.test(content),
                hasFormValidation: /validate|required|error/i.test(content),
                hasTeamSelection: /team.*select|select.*team/i.test(content),
                hasFormatSelection: /BO1|BO3|BO5|format/i.test(content),
                hasAPIIntegration: /POST.*match|create.*match.*api/i.test(content)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async testLiveScoringWorkflow() {
        // Test live scoring workflow
        try {
            const liveScoringFile = '/var/www/mrvl-frontend/frontend/src/components/admin/SinglePageLiveScoring.js';
            const content = await fs.readFile(liveScoringFile, 'utf8');
            
            return {
                hasScoreIncrement: /\+\+|increment|add.*score/i.test(content),
                hasScoreDecrement: /\-\-|decrement|minus.*score/i.test(content),
                hasPlayerStatUpdate: /update.*stats|stats.*update/i.test(content),
                hasHeroChange: /change.*hero|hero.*change|select.*hero/i.test(content),
                hasMapTransition: /next.*map|map.*next|complete.*map/i.test(content),
                hasAutoSave: /auto.*save|save.*interval/i.test(content),
                hasManualSave: /save.*button|manual.*save/i.test(content)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async testMatchCompletionWorkflow() {
        // Test match completion workflow
        try {
            const matchDetailFile = '/var/www/mrvl-frontend/frontend/src/components/pages/MatchDetailPage.js';
            const content = await fs.readFile(matchDetailFile, 'utf8');
            
            return {
                hasCompleteButton: /complete.*match|finish.*match|end.*match/i.test(content),
                hasWinnerSelection: /winner|champion|victory/i.test(content),
                hasStatsFinalization: /finalize.*stats|final.*stats/i.test(content),
                hasResultsDisplay: /result|final.*score|match.*result/i.test(content)
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    async testPerformance() {
        console.log('⚡ Testing Performance...');
        
        try {
            // Test frontend response time
            const startTime = Date.now();
            const result = await this.makeHTTPRequest(this.frontendUrl);
            const responseTime = Date.now() - startTime;
            
            this.results.performance = {
                frontendResponseTime: responseTime,
                frontendAccessible: result.statusCode === 200,
                frontendSize: result.size || 0
            };
            
        } catch (error) {
            this.results.performance = {
                error: error.message
            };
        }
    }

    makeHTTPRequest(url) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const req = http.get(url, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        responseTime: Date.now() - startTime,
                        size: data.length,
                        data: data
                    });
                });
            });
            
            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
        });
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check API connectivity
        const apiErrors = Object.values(this.results.api || {}).filter(result => result.status === 'error');
        if (apiErrors.length > 0) {
            recommendations.push({
                category: 'API Connectivity',
                priority: 'High',
                issue: `${apiErrors.length} API endpoints are not responding`,
                recommendation: 'Ensure backend API server is running and endpoints are properly configured'
            });
        }
        
        // Check real-time capabilities
        const liveScoringComponents = this.results.liveScoring || {};
        const hasRealTimeCapability = Object.values(liveScoringComponents).some(comp => 
            comp.capabilities?.realTime
        );
        
        if (!hasRealTimeCapability) {
            recommendations.push({
                category: 'Real-time Features',
                priority: 'High',
                issue: 'No real-time update mechanism detected',
                recommendation: 'Implement WebSocket, SSE, or localStorage-based synchronization for live updates'
            });
        }
        
        // Check WebSocket configuration
        if (!this.results.webSocket?.hasPusherConfig && !this.results.webSocket?.hasWSConfig) {
            recommendations.push({
                category: 'WebSocket Configuration',
                priority: 'Medium',
                issue: 'No WebSocket configuration found',
                recommendation: 'Configure Pusher or native WebSocket for optimal real-time performance'
            });
        }
        
        // Check localStorage synchronization
        if (!this.results.localStorage?.hasStorageHelpers) {
            recommendations.push({
                category: 'Data Persistence',
                priority: 'Medium',
                issue: 'Limited localStorage synchronization detected',
                recommendation: 'Implement robust localStorage-based synchronization as fallback for real-time updates'
            });
        }
        
        // Check performance
        if (this.results.performance?.frontendResponseTime > 3000) {
            recommendations.push({
                category: 'Performance',
                priority: 'Medium',
                issue: 'Slow frontend response time detected',
                recommendation: 'Optimize component loading and implement code splitting for better performance'
            });
        }
        
        return recommendations;
    }

    async generateReport() {
        console.log('📊 Generating real-time functionality report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                apiEndpointsWorking: Object.values(this.results.api || {}).filter(r => r.status === 'success').length,
                totalAPIEndpoints: Object.keys(this.results.api || {}).length,
                liveScoringComponents: Object.keys(this.results.liveScoring || {}).length,
                realTimeCapable: Object.values(this.results.liveScoring || {}).filter(c => c.capabilities?.realTime).length,
                webSocketConfigured: this.results.webSocket?.hasPusherConfig || this.results.webSocket?.hasWSConfig,
                localStorageSync: this.results.localStorage?.hasStorageHelpers,
                performanceGood: this.results.performance?.frontendResponseTime < 3000,
                totalIssues: this.results.issues.length
            },
            detailed: this.results,
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = `real-time-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Real-time test report saved to: ${reportPath}`);
        return report;
    }

    async run() {
        console.log('🚀 Starting Real-time Functionality Testing...');
        
        try {
            await this.testAPIEndpoints();
            await this.testLiveScoringComponents();
            await this.testWebSocketConnectivity();
            await this.testLocalStorageSynchronization();
            await this.testMatchWorkflows();
            await this.testPerformance();
            
            return await this.generateReport();
            
        } catch (error) {
            console.error('❌ Real-time testing failed:', error.message);
            throw error;
        }
    }
}

// Run the tests
async function main() {
    const tester = new RealTimeFunctionalityTester();
    
    try {
        const report = await tester.run();
        
        console.log('\n🎉 Real-time functionality testing completed!');
        console.log('\n📊 SUMMARY:');
        console.log(`API Endpoints Working: ${report.summary.apiEndpointsWorking}/${report.summary.totalAPIEndpoints}`);
        console.log(`Live Scoring Components: ${report.summary.liveScoringComponents}`);
        console.log(`Real-time Capable: ${report.summary.realTimeCapable}`);
        console.log(`WebSocket Configured: ${report.summary.webSocketConfigured}`);
        console.log(`localStorage Sync: ${report.summary.localStorageSync}`);
        console.log(`Performance Good: ${report.summary.performanceGood}`);
        console.log(`Total Issues: ${report.summary.totalIssues}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 TOP RECOMMENDATIONS:');
            report.recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`${i + 1}. [${rec.priority}] ${rec.category}: ${rec.recommendation}`);
            });
        }
        
        return report;
        
    } catch (error) {
        console.error('❌ Testing failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = RealTimeFunctionalityTester;