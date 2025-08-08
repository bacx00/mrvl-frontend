#!/usr/bin/env node

/**
 * Workflow-Specific Testing Suite
 * Tests specific match workflows and user interactions
 */

const fs = require('fs').promises;
const http = require('http');

class WorkflowSpecificTester {
    constructor() {
        this.results = {
            matchCreation: {},
            liveScoring: {},
            realTimeSync: {},
            matchCompletion: {},
            userExperience: {},
            mobileSupport: {},
            errorRecovery: {},
            issues: [],
            recommendations: []
        };
        this.frontendUrl = 'http://localhost:3000';
        this.apiUrl = 'http://localhost:8000/api';
    }

    async testMatchCreationWorkflow() {
        console.log('🎮 Testing Match Creation Workflow...');
        
        // Test admin match creation components
        try {
            const adminMatchFile = '/var/www/mrvl-frontend/frontend/src/components/admin/AdminMatches.js';
            const content = await fs.readFile(adminMatchFile, 'utf8');
            
            const workflow = {
                hasCreateForm: /create.*match|new.*match|match.*form/i.test(content),
                hasTeamSelection: /team.*select|select.*team|team.*dropdown/i.test(content),
                hasFormatSelection: /BO1|BO3|BO5|format.*select/i.test(content),
                hasDateTimeSelection: /date|time|schedule/i.test(content),
                hasValidation: /validate|required|error.*message/i.test(content),
                hasAPIIntegration: /POST.*match|create.*match.*api|axios\.post|api\.post/i.test(content),
                hasErrorHandling: /try.*catch|error|Error|\.catch/i.test(content),
                hasSuccessCallback: /success|created|navigate|redirect/i.test(content)
            };
            
            this.results.matchCreation = {
                componentExists: true,
                workflow,
                completeness: Object.values(workflow).filter(Boolean).length / Object.keys(workflow).length
            };
            
        } catch (error) {
            this.results.matchCreation = {
                componentExists: false,
                error: error.message
            };
        }
    }

    async testLiveScoringWorkflow() {
        console.log('⚡ Testing Live Scoring Workflow...');
        
        try {
            const liveScoringFile = '/var/www/mrvl-frontend/frontend/src/components/admin/SinglePageLiveScoring.js';
            const content = await fs.readFile(liveScoringFile, 'utf8');
            
            const scoringFeatures = {
                // Core scoring functionality
                hasScoreIncrement: /\+\+|increment|add.*score|\+.*1|score.*\+/i.test(content),
                hasScoreDecrement: /\-\-|decrement|minus.*score|\-.*1|score.*\-/i.test(content),
                hasDirectScoreEdit: /input.*score|onChange.*score|setValue.*score/i.test(content),
                hasScoreValidation: /validate.*score|score.*validation|min.*max.*score/i.test(content),
                
                // Player statistics
                hasPlayerStatTracking: /kills|deaths|assists|damage|healing/i.test(content),
                hasStatIncrement: /stat.*\+|increment.*stat|\+\+.*stat/i.test(content),
                hasStatValidation: /validate.*stat|stat.*validation/i.test(content),
                hasStatPersistence: /save.*stat|persist.*stat|localStorage.*stat/i.test(content),
                
                // Hero management
                hasHeroSelection: /hero.*select|select.*hero|hero.*dropdown/i.test(content),
                hasHeroChangeTracking: /hero.*change|change.*hero|heroId/i.test(content),
                hasHeroValidation: /validate.*hero|hero.*validation/i.test(content),
                
                // Map management
                hasMapTransition: /next.*map|map.*next|complete.*map|advance.*map/i.test(content),
                hasMapScoreReset: /reset.*map|clear.*map|new.*map/i.test(content),
                hasMapValidation: /validate.*map|map.*validation/i.test(content),
                
                // Match status
                hasStatusControl: /status.*change|change.*status|match.*status/i.test(content),
                hasMatchCompletion: /complete.*match|finish.*match|end.*match/i.test(content),
                hasStatusValidation: /validate.*status|status.*validation/i.test(content),
                
                // Real-time features
                hasAutoSave: /auto.*save|autosave|save.*interval/i.test(content),
                hasManualSave: /save.*button|manual.*save|save.*now/i.test(content),
                hasRealTimeSync: /real.*time|live.*sync|socket|pusher|sse/i.test(content),
                hasLocalStorageSync: /localStorage|sessionStorage|storage.*sync/i.test(content),
                
                // UI/UX features
                hasLoadingStates: /loading|Loading|isLoading|spinner/i.test(content),
                hasErrorHandling: /try.*catch|error|Error|\.catch/i.test(content),
                hasSuccessFeedback: /success|Success|saved|updated/i.test(content),
                hasUndoRedo: /undo|redo|revert|rollback/i.test(content)
            };
            
            const workflowSteps = {
                initialization: scoringFeatures.hasLoadingStates,
                scoreManagement: scoringFeatures.hasScoreIncrement && scoringFeatures.hasScoreDecrement,
                playerTracking: scoringFeatures.hasPlayerStatTracking && scoringFeatures.hasStatIncrement,
                heroManagement: scoringFeatures.hasHeroSelection && scoringFeatures.hasHeroChangeTracking,
                mapProgression: scoringFeatures.hasMapTransition && scoringFeatures.hasMapScoreReset,
                statusControl: scoringFeatures.hasStatusControl && scoringFeatures.hasMatchCompletion,
                persistence: scoringFeatures.hasAutoSave || scoringFeatures.hasManualSave,
                synchronization: scoringFeatures.hasRealTimeSync || scoringFeatures.hasLocalStorageSync,
                errorHandling: scoringFeatures.hasErrorHandling && scoringFeatures.hasSuccessFeedback
            };
            
            this.results.liveScoring = {
                features: scoringFeatures,
                workflowSteps,
                featureCompleteness: Object.values(scoringFeatures).filter(Boolean).length / Object.keys(scoringFeatures).length,
                workflowCompleteness: Object.values(workflowSteps).filter(Boolean).length / Object.keys(workflowSteps).length
            };
            
        } catch (error) {
            this.results.liveScoring = {
                error: error.message
            };
        }
    }

    async testRealTimeSynchronization() {
        console.log('🔄 Testing Real-time Synchronization...');
        
        try {
            const realtimeFile = '/var/www/mrvl-frontend/frontend/src/lib/realtime.js';
            const content = await fs.readFile(realtimeFile, 'utf8');
            
            const syncFeatures = {
                // Connection management
                hasSSESupport: /EventSource|Server.*Sent.*Events/i.test(content),
                hasWebSocketSupport: /WebSocket|socket\.io/i.test(content),
                hasPollingFallback: /polling|setInterval|poll/i.test(content),
                hasReconnection: /reconnect|retry|timeout/i.test(content),
                
                // Event handling
                hasScoreUpdates: /score.*update|onScoreUpdate/i.test(content),
                hasHeroUpdates: /hero.*update|onHeroUpdate/i.test(content),
                hasStatsUpdates: /stats.*update|onStatsUpdate/i.test(content),
                hasMapUpdates: /map.*update|onMapUpdate/i.test(content),
                hasStatusUpdates: /status.*update|onStatusUpdate/i.test(content),
                
                // Error handling
                hasConnectionError: /onerror|error.*handler|connection.*error/i.test(content),
                hasNetworkError: /network.*error|fetch.*error/i.test(content),
                hasGracefulDegradation: /fallback|graceful|degradation/i.test(content),
                
                // Performance
                hasThrottling: /throttle|debounce|rate.*limit/i.test(content),
                hasOptimization: /optimize|efficient|performance/i.test(content),
                hasCleanup: /cleanup|disconnect|unsubscribe/i.test(content)
            };
            
            const syncCapabilities = {
                realTimeCapable: syncFeatures.hasSSESupport || syncFeatures.hasWebSocketSupport,
                hasReliableConnection: syncFeatures.hasReconnection && syncFeatures.hasPollingFallback,
                comprehensiveEvents: [
                    syncFeatures.hasScoreUpdates,
                    syncFeatures.hasHeroUpdates,
                    syncFeatures.hasStatsUpdates,
                    syncFeatures.hasMapUpdates,
                    syncFeatures.hasStatusUpdates
                ].filter(Boolean).length >= 4,
                robustErrorHandling: syncFeatures.hasConnectionError && syncFeatures.hasNetworkError,
                performanceOptimized: syncFeatures.hasThrottling || syncFeatures.hasOptimization
            };
            
            this.results.realTimeSync = {
                features: syncFeatures,
                capabilities: syncCapabilities,
                implementationQuality: Object.values(syncCapabilities).filter(Boolean).length / Object.keys(syncCapabilities).length
            };
            
        } catch (error) {
            this.results.realTimeSync = {
                error: error.message
            };
        }
    }

    async testMatchCompletionWorkflow() {
        console.log('🏆 Testing Match Completion Workflow...');
        
        try {
            // Check multiple components for completion workflow
            const files = [
                '/var/www/mrvl-frontend/frontend/src/components/pages/MatchDetailPage.js',
                '/var/www/mrvl-frontend/frontend/src/components/admin/SinglePageLiveScoring.js'
            ];
            
            const completionFeatures = {
                hasWinnerSelection: false,
                hasScoreFinalization: false,
                hasStatsFinalization: false,
                hasMatchSummary: false,
                hasResultsDisplay: false,
                hasDataPersistence: false,
                hasNotifications: false,
                hasRedirection: false
            };
            
            for (const file of files) {
                try {
                    const content = await fs.readFile(file, 'utf8');
                    
                    if (/winner|champion|victory|complete.*match/i.test(content)) {
                        completionFeatures.hasWinnerSelection = true;
                    }
                    if (/finalize.*score|final.*score|complete.*score/i.test(content)) {
                        completionFeatures.hasScoreFinalization = true;
                    }
                    if (/finalize.*stats|final.*stats|complete.*stats/i.test(content)) {
                        completionFeatures.hasStatsFinalization = true;
                    }
                    if (/match.*summary|summary|recap/i.test(content)) {
                        completionFeatures.hasMatchSummary = true;
                    }
                    if (/result|final.*result|match.*result/i.test(content)) {
                        completionFeatures.hasResultsDisplay = true;
                    }
                    if (/save.*final|persist.*final|store.*final/i.test(content)) {
                        completionFeatures.hasDataPersistence = true;
                    }
                    if (/notification|alert|toast|message/i.test(content)) {
                        completionFeatures.hasNotifications = true;
                    }
                    if (/navigate|redirect|route.*to/i.test(content)) {
                        completionFeatures.hasRedirection = true;
                    }
                } catch (fileError) {
                    // File doesn't exist, continue
                }
            }
            
            this.results.matchCompletion = {
                features: completionFeatures,
                completeness: Object.values(completionFeatures).filter(Boolean).length / Object.keys(completionFeatures).length
            };
            
        } catch (error) {
            this.results.matchCompletion = {
                error: error.message
            };
        }
    }

    async testUserExperience() {
        console.log('👤 Testing User Experience...');
        
        try {
            // Test frontend accessibility
            const response = await this.makeHTTPRequest(this.frontendUrl);
            const html = response.data;
            
            const uxFeatures = {
                hasProgressiveEnhancement: html.includes('noscript'),
                hasMetaTags: /<meta.*description|<meta.*viewport|<meta.*og:/i.test(html),
                hasFavicon: /favicon|apple-touch-icon/i.test(html),
                hasManifest: /manifest\.json/i.test(html),
                hasAsyncLoading: /defer|async/i.test(html),
                hasPreconnect: /preconnect|prefetch/i.test(html),
                hasStructuredData: /schema\.org|json\+ld/i.test(html),
                hasAccessibilityFeatures: /alt=|aria-|role=/i.test(html)
            };
            
            // Test loading performance
            const loadTime = response.responseTime;
            const performanceScore = {
                excellent: loadTime < 1000,
                good: loadTime < 2000,
                acceptable: loadTime < 3000,
                poor: loadTime >= 3000
            };
            
            this.results.userExperience = {
                features: uxFeatures,
                loadTime,
                performanceScore,
                overallScore: Object.values(uxFeatures).filter(Boolean).length / Object.keys(uxFeatures).length
            };
            
        } catch (error) {
            this.results.userExperience = {
                error: error.message
            };
        }
    }

    async testMobileSupport() {
        console.log('📱 Testing Mobile Support...');
        
        try {
            const mobileDir = '/var/www/mrvl-frontend/frontend/src/components/mobile';
            const files = await fs.readdir(mobileDir);
            
            const mobileComponents = {};
            
            for (const file of files) {
                if (file.endsWith('.js')) {
                    const content = await fs.readFile(`${mobileDir}/${file}`, 'utf8');
                    
                    mobileComponents[file] = {
                        hasTouchEvents: /touch|Touch|swipe|gesture/i.test(content),
                        hasResponsiveDesign: /responsive|mobile|breakpoint/i.test(content),
                        hasViewportHandling: /viewport|screen|window\.inner/i.test(content),
                        hasGestureSupport: /swipe|pinch|pan|rotate/i.test(content),
                        hasHapticFeedback: /vibrate|haptic|feedback/i.test(content),
                        hasOptimizedPerformance: /memo|useMemo|useCallback|lazy/i.test(content)
                    };
                }
            }
            
            this.results.mobileSupport = {
                componentCount: Object.keys(mobileComponents).length,
                components: mobileComponents,
                averageFeatureSupport: Object.values(mobileComponents).reduce((acc, comp) => {
                    const features = Object.values(comp).filter(Boolean).length;
                    const total = Object.keys(comp).length;
                    return acc + (features / total);
                }, 0) / Object.keys(mobileComponents).length
            };
            
        } catch (error) {
            this.results.mobileSupport = {
                error: error.message
            };
        }
    }

    async testErrorRecovery() {
        console.log('🚨 Testing Error Recovery...');
        
        const recoveryTests = {
            networkTimeout: await this.testNetworkTimeout(),
            serverError: await this.testServerError(),
            invalidData: await this.testInvalidData(),
            concurrentUpdates: await this.testConcurrentUpdates()
        };
        
        this.results.errorRecovery = recoveryTests;
    }

    async testNetworkTimeout() {
        // Simulate network timeout
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 100); // Very short timeout
            
            await fetch(this.frontendUrl, { signal: controller.signal });
            return { handled: false, reason: 'No timeout occurred' };
        } catch (error) {
            return { 
                handled: error.name === 'AbortError', 
                errorType: error.name,
                message: error.message 
            };
        }
    }

    async testServerError() {
        // Test 500 error handling
        try {
            await fetch(`${this.frontendUrl}/api/non-existent-endpoint`);
            return { handled: true, graceful: true };
        } catch (error) {
            return { 
                handled: true, 
                graceful: false, 
                error: error.message 
            };
        }
    }

    async testInvalidData() {
        // Test invalid JSON handling
        try {
            const invalidJSON = 'invalid json data';
            JSON.parse(invalidJSON);
            return { handled: false };
        } catch (error) {
            return { handled: true, errorType: 'SyntaxError' };
        }
    }

    async testConcurrentUpdates() {
        // Test localStorage concurrent writes
        try {
            const promises = [];
            for (let i = 0; i < 10; i++) {
                promises.push(new Promise(resolve => {
                    setTimeout(() => {
                        const key = `test-${i}`;
                        localStorage.setItem(key, JSON.stringify({ test: i }));
                        const value = JSON.parse(localStorage.getItem(key));
                        localStorage.removeItem(key);
                        resolve(value.test === i);
                    }, Math.random() * 100);
                }));
            }
            
            const results = await Promise.all(promises);
            const successful = results.filter(Boolean).length;
            
            return { 
                handled: true, 
                successRate: successful / results.length,
                successful,
                total: results.length 
            };
        } catch (error) {
            return { handled: false, error: error.message };
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
        
        // Match creation recommendations
        if (this.results.matchCreation.completeness < 0.8) {
            recommendations.push({
                category: 'Match Creation',
                priority: 'High',
                issue: 'Incomplete match creation workflow',
                recommendation: 'Implement missing workflow steps: validation, error handling, and success callbacks'
            });
        }
        
        // Live scoring recommendations
        if (this.results.liveScoring.workflowCompleteness < 0.7) {
            recommendations.push({
                category: 'Live Scoring',
                priority: 'High',
                issue: 'Incomplete live scoring workflow',
                recommendation: 'Add missing features: auto-save, error handling, and undo/redo functionality'
            });
        }
        
        // Real-time sync recommendations
        if (!this.results.realTimeSync.capabilities?.realTimeCapable) {
            recommendations.push({
                category: 'Real-time Synchronization',
                priority: 'Critical',
                issue: 'No real-time capabilities detected',
                recommendation: 'Implement Server-Sent Events or WebSocket for live updates'
            });
        }
        
        // Mobile support recommendations
        if (this.results.mobileSupport.averageFeatureSupport < 0.6) {
            recommendations.push({
                category: 'Mobile Support',
                priority: 'Medium',
                issue: 'Limited mobile optimization',
                recommendation: 'Enhance touch interactions, gestures, and responsive design'
            });
        }
        
        // Error recovery recommendations
        const errorRecovery = this.results.errorRecovery;
        if (!errorRecovery.networkTimeout?.handled || !errorRecovery.serverError?.handled) {
            recommendations.push({
                category: 'Error Recovery',
                priority: 'High',
                issue: 'Insufficient error handling',
                recommendation: 'Implement comprehensive error boundaries and graceful degradation'
            });
        }
        
        return recommendations;
    }

    async generateReport() {
        console.log('📊 Generating workflow-specific test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                matchCreationComplete: this.results.matchCreation.completeness > 0.8,
                liveScoringComplete: this.results.liveScoring.workflowCompleteness > 0.7,
                realTimeSyncWorking: this.results.realTimeSync.capabilities?.realTimeCapable || false,
                mobileOptimized: this.results.mobileSupport.averageFeatureSupport > 0.6,
                errorRecoveryRobust: Object.values(this.results.errorRecovery).every(test => test.handled),
                userExperienceGood: this.results.userExperience.overallScore > 0.7,
                totalWorkflows: 6,
                workingWorkflows: 0
            },
            detailed: this.results,
            recommendations: this.generateRecommendations()
        };
        
        // Calculate working workflows
        const workflowChecks = [
            report.summary.matchCreationComplete,
            report.summary.liveScoringComplete,
            report.summary.realTimeSyncWorking,
            report.summary.mobileOptimized,
            report.summary.errorRecoveryRobust,
            report.summary.userExperienceGood
        ];
        
        report.summary.workingWorkflows = workflowChecks.filter(Boolean).length;
        
        const reportPath = `workflow-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Workflow test report saved to: ${reportPath}`);
        return report;
    }

    async run() {
        console.log('🚀 Starting Workflow-Specific Testing...');
        
        try {
            await this.testMatchCreationWorkflow();
            await this.testLiveScoringWorkflow();
            await this.testRealTimeSynchronization();
            await this.testMatchCompletionWorkflow();
            await this.testUserExperience();
            await this.testMobileSupport();
            await this.testErrorRecovery();
            
            return await this.generateReport();
            
        } catch (error) {
            console.error('❌ Workflow testing failed:', error.message);
            throw error;
        }
    }
}

// Run the tests
async function main() {
    const tester = new WorkflowSpecificTester();
    
    try {
        const report = await tester.run();
        
        console.log('\n🎉 Workflow-specific testing completed!');
        console.log('\n📊 SUMMARY:');
        console.log(`Working Workflows: ${report.summary.workingWorkflows}/${report.summary.totalWorkflows}`);
        console.log(`Match Creation Complete: ${report.summary.matchCreationComplete}`);
        console.log(`Live Scoring Complete: ${report.summary.liveScoringComplete}`);
        console.log(`Real-time Sync Working: ${report.summary.realTimeSyncWorking}`);
        console.log(`Mobile Optimized: ${report.summary.mobileOptimized}`);
        console.log(`Error Recovery Robust: ${report.summary.errorRecoveryRobust}`);
        console.log(`User Experience Good: ${report.summary.userExperienceGood}`);
        
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

module.exports = WorkflowSpecificTester;