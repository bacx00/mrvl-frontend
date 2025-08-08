#!/usr/bin/env node

/**
 * Manual Frontend Testing Suite
 * Tests frontend components using direct API calls and file analysis
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');

class ManualFrontendTester {
    constructor() {
        this.testResults = {
            structure: {},
            components: {},
            pages: {},
            api: {},
            configuration: {},
            issues: [],
            recommendations: []
        };
        this.frontendUrl = 'http://localhost:3000';
        this.apiUrl = 'http://localhost:8000/api';
        this.srcPath = '/var/www/mrvl-frontend/frontend/src';
    }

    async testFrontendStructure() {
        console.log('📁 Testing Frontend Structure...');
        
        try {
            // Check main directories
            const mainDirs = ['components', 'pages', 'hooks', 'utils', 'services', 'styles'];
            const structureResults = {};
            
            for (const dir of mainDirs) {
                const dirPath = path.join(this.srcPath, dir);
                try {
                    const stats = await fs.stat(dirPath);
                    if (stats.isDirectory()) {
                        const files = await fs.readdir(dirPath);
                        structureResults[dir] = {
                            exists: true,
                            fileCount: files.length,
                            files: files.filter(f => f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.ts'))
                        };
                    }
                } catch (error) {
                    structureResults[dir] = { exists: false, error: error.message };
                }
            }
            
            this.testResults.structure = structureResults;
            
        } catch (error) {
            this.testResults.issues.push({
                type: 'Structure Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async testLiveScoringComponents() {
        console.log('⚡ Testing Live Scoring Components...');
        
        try {
            const liveScoringFiles = [
                'components/admin/SinglePageLiveScoring.js',
                'components/admin/ComprehensiveLiveScoring.js',
                'components/admin/SimplifiedLiveScoring.js',
                'components/pages/MatchDetailPage.js'
            ];
            
            const componentResults = {};
            
            for (const file of liveScoringFiles) {
                const filePath = path.join(this.srcPath, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const analysis = this.analyzeLiveScoringComponent(content, file);
                    componentResults[file] = analysis;
                } catch (error) {
                    componentResults[file] = { exists: false, error: error.message };
                }
            }
            
            this.testResults.components.liveScoring = componentResults;
            
        } catch (error) {
            this.testResults.issues.push({
                type: 'Live Scoring Component Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    analyzeLiveScoringComponent(content, filename) {
        const analysis = {
            exists: true,
            filename,
            size: content.length,
            features: {},
            issues: []
        };
        
        // Check for real-time features
        analysis.features.hasWebSocket = /WebSocket|socket\.io|pusher/i.test(content);
        analysis.features.hasSSE = /EventSource|Server.*Sent.*Events/i.test(content);
        analysis.features.hasRealTimeUpdates = /real.*time|live.*update|socket|pusher/i.test(content);
        
        // Check for live scoring features
        analysis.features.hasScoreUpdates = /score.*update|updateScore|setScore/i.test(content);
        analysis.features.hasPlayerStats = /player.*stats|kills|deaths|assists/i.test(content);
        analysis.features.hasHeroSelection = /hero.*select|selectHero|heroId/i.test(content);
        analysis.features.hasMapTransitions = /map.*transition|nextMap|changeMap/i.test(content);
        analysis.features.hasMatchStatus = /match.*status|matchState|gameState/i.test(content);
        
        // Check for UI elements
        analysis.features.hasButtons = /button|Button|onClick/i.test(content);
        analysis.features.hasInputs = /input|Input|onChange|value=/i.test(content);
        analysis.features.hasSelects = /select|Select|option|dropdown/i.test(content);
        
        // Check for error handling
        analysis.features.hasErrorHandling = /try.*catch|error|Error|catch\(|\.catch/i.test(content);
        analysis.features.hasLoading = /loading|Loading|isLoading|spinner/i.test(content);
        
        // Check for React hooks
        analysis.features.usesUseState = /useState/g.test(content);
        analysis.features.usesUseEffect = /useEffect/g.test(content);
        analysis.features.usesCustomHooks = /use[A-Z]\w*/g.test(content);
        
        // Look for potential issues
        if (!analysis.features.hasErrorHandling) {
            analysis.issues.push('No error handling detected');
        }
        
        if (!analysis.features.hasLoading) {
            analysis.issues.push('No loading states detected');
        }
        
        if (filename.includes('Live') && !analysis.features.hasRealTimeUpdates) {
            analysis.issues.push('Live component without real-time features');
        }
        
        return analysis;
    }

    async testPageComponents() {
        console.log('📄 Testing Page Components...');
        
        try {
            const pageFiles = [
                'components/pages/HomePage.js',
                'components/pages/MatchesPage.js',
                'components/pages/MatchDetailPage.js',
                'components/pages/EventsPage.js',
                'components/pages/TeamsPage.js',
                'components/pages/PlayersPage.js',
                'components/pages/RankingsPage.js',
                'components/pages/AdminDashboard.js'
            ];
            
            const pageResults = {};
            
            for (const file of pageFiles) {
                const filePath = path.join(this.srcPath, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    const analysis = this.analyzePageComponent(content, file);
                    pageResults[file] = analysis;
                } catch (error) {
                    pageResults[file] = { exists: false, error: error.message };
                }
            }
            
            this.testResults.components.pages = pageResults;
            
        } catch (error) {
            this.testResults.issues.push({
                type: 'Page Component Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    analyzePageComponent(content, filename) {
        const analysis = {
            exists: true,
            filename,
            size: content.length,
            features: {},
            routing: {},
            dataFetching: {},
            issues: []
        };
        
        // Check for React features
        analysis.features.isReactComponent = /import.*React|from ['"]react['"]|React\./i.test(content);
        analysis.features.usesJSX = /<\w+|<\/\w+|<>|<\/>/g.test(content);
        analysis.features.hasProps = /props\.|{.*props|function.*\(.*props/i.test(content);
        
        // Check for routing
        analysis.routing.hasNavigation = /navigate|history|router|Link/i.test(content);
        analysis.routing.hasParams = /params|useParams|match\.params/i.test(content);
        analysis.routing.hasQueryParams = /query|search|location\.search/i.test(content);
        
        // Check for data fetching
        analysis.dataFetching.usesFetch = /fetch\(|\.fetch/g.test(content);
        analysis.dataFetching.usesAxios = /axios|\.get\(|\.post\(/g.test(content);
        analysis.dataFetching.usesAPI = /api\.|API\.|\/api\//g.test(content);
        analysis.dataFetching.hasAsyncData = /async|await|\.then\(|Promise/g.test(content);
        
        // Check for state management
        analysis.features.hasLocalState = /useState/g.test(content);
        analysis.features.hasEffects = /useEffect/g.test(content);
        analysis.features.hasContext = /useContext|Context\./g.test(content);
        
        // Check for UI components
        analysis.features.hasButtons = /button|Button/gi.test(content);
        analysis.features.hasForms = /form|Form|input|Input/gi.test(content);
        analysis.features.hasTables = /table|Table|tbody|thead/gi.test(content);
        analysis.features.hasCards = /card|Card/gi.test(content);
        
        // Check for responsive design
        analysis.features.hasResponsive = /mobile|tablet|desktop|responsive|breakpoint/gi.test(content);
        analysis.features.hasCSS = /className|style=|css|CSS/gi.test(content);
        
        return analysis;
    }

    async testAPIConfiguration() {
        console.log('🔧 Testing API Configuration...');
        
        try {
            // Check config files
            const configFiles = [
                'config.js',
                'lib/api.ts',
                'api/MatchAPI.js'
            ];
            
            const apiResults = {};
            
            for (const file of configFiles) {
                const filePath = path.join(this.srcPath, file);
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    apiResults[file] = this.analyzeAPIConfig(content, file);
                } catch (error) {
                    apiResults[file] = { exists: false, error: error.message };
                }
            }
            
            this.testResults.api = apiResults;
            
        } catch (error) {
            this.testResults.issues.push({
                type: 'API Configuration Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    analyzeAPIConfig(content, filename) {
        const analysis = {
            exists: true,
            filename,
            endpoints: [],
            configuration: {},
            issues: []
        };
        
        // Extract API endpoints
        const endpointPatterns = [
            /['"`]\/api\/[^'"`]+['"`]/g,
            /baseURL.*['"`][^'"`]+['"`]/g,
            /endpoint.*['"`][^'"`]+['"`]/g
        ];
        
        endpointPatterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
                analysis.endpoints.push(...matches);
            }
        });
        
        // Check configuration
        analysis.configuration.hasBaseURL = /baseURL|BASE_URL|apiUrl/i.test(content);
        analysis.configuration.hasTimeout = /timeout/i.test(content);
        analysis.configuration.hasErrorHandling = /error|Error|catch/i.test(content);
        analysis.configuration.hasInterceptors = /interceptor|request\.|response\./i.test(content);
        
        // Check authentication
        analysis.configuration.hasAuth = /auth|Auth|token|Token|bearer|Bearer/i.test(content);
        analysis.configuration.hasHeaders = /headers|Headers/i.test(content);
        
        return analysis;
    }

    async testFrontendConnectivity() {
        console.log('🌐 Testing Frontend Connectivity...');
        
        return new Promise((resolve) => {
            const options = {
                hostname: 'localhost',
                port: 3000,
                path: '/',
                method: 'GET',
                timeout: 5000
            };
            
            const req = http.request(options, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    this.testResults.configuration.frontend = {
                        accessible: true,
                        statusCode: res.statusCode,
                        hasReactApp: data.includes('root') || data.includes('React'),
                        hasTitle: /<title>([^<]*)<\/title>/.test(data),
                        responseSize: data.length
                    };
                    resolve();
                });
            });
            
            req.on('error', (error) => {
                this.testResults.configuration.frontend = {
                    accessible: false,
                    error: error.message
                };
                resolve();
            });
            
            req.on('timeout', () => {
                this.testResults.configuration.frontend = {
                    accessible: false,
                    error: 'Connection timeout'
                };
                req.destroy();
                resolve();
            });
            
            req.end();
        });
    }

    async testMobileComponents() {
        console.log('📱 Testing Mobile Components...');
        
        try {
            const mobileDir = path.join(this.srcPath, 'components', 'mobile');
            const mobileFiles = await fs.readdir(mobileDir);
            
            const mobileResults = {};
            
            for (const file of mobileFiles) {
                if (file.endsWith('.js') || file.endsWith('.tsx')) {
                    const filePath = path.join(mobileDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    mobileResults[file] = this.analyzeMobileComponent(content, file);
                }
            }
            
            this.testResults.components.mobile = mobileResults;
            
        } catch (error) {
            this.testResults.components.mobile = { error: error.message };
        }
    }

    analyzeMobileComponent(content, filename) {
        const analysis = {
            exists: true,
            filename,
            features: {}
        };
        
        // Check for mobile-specific features
        analysis.features.hasTouchEvents = /touch|Touch|swipe|Swipe|gesture/i.test(content);
        analysis.features.hasResponsiveDesign = /mobile|tablet|responsive|breakpoint/i.test(content);
        analysis.features.hasViewportHandling = /viewport|screen|window\.inner/i.test(content);
        analysis.features.hasSwipeGestures = /swipe|gesture|pan|pinch/i.test(content);
        
        return analysis;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Check structure issues
        if (!this.testResults.structure.components?.exists) {
            recommendations.push({
                category: 'Structure',
                priority: 'Critical',
                issue: 'Components directory missing',
                recommendation: 'Ensure all core directories exist and are properly structured'
            });
        }
        
        // Check live scoring components
        const liveComponents = this.testResults.components.liveScoring || {};
        const missingLiveComponents = Object.values(liveComponents).filter(c => !c.exists);
        
        if (missingLiveComponents.length > 0) {
            recommendations.push({
                category: 'Live Scoring',
                priority: 'High',
                issue: `${missingLiveComponents.length} live scoring components missing`,
                recommendation: 'Implement missing live scoring components for real-time match updates'
            });
        }
        
        // Check for real-time features
        const hasRealTime = Object.values(liveComponents).some(c => 
            c.features?.hasWebSocket || c.features?.hasSSE || c.features?.hasRealTimeUpdates
        );
        
        if (!hasRealTime) {
            recommendations.push({
                category: 'Real-time Features',
                priority: 'High',
                issue: 'No real-time capabilities detected',
                recommendation: 'Implement WebSocket or SSE for live match updates'
            });
        }
        
        // Check frontend connectivity
        if (!this.testResults.configuration.frontend?.accessible) {
            recommendations.push({
                category: 'Connectivity',
                priority: 'Critical',
                issue: 'Frontend server not accessible',
                recommendation: 'Ensure React development server is running on port 3000'
            });
        }
        
        // Check mobile support
        if (!this.testResults.components.mobile || Object.keys(this.testResults.components.mobile).length === 0) {
            recommendations.push({
                category: 'Mobile Support',
                priority: 'Medium',
                issue: 'Limited mobile components detected',
                recommendation: 'Enhance mobile responsiveness and touch interactions'
            });
        }
        
        return recommendations;
    }

    async generateReport() {
        console.log('📊 Generating comprehensive test report...');
        
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                structureStatus: this.testResults.structure.components?.exists ? 'Good' : 'Issues',
                liveScoringComponents: Object.keys(this.testResults.components.liveScoring || {}).length,
                pageComponents: Object.keys(this.testResults.components.pages || {}).length,
                mobileComponents: Object.keys(this.testResults.components.mobile || {}).length,
                totalIssues: this.testResults.issues.length,
                frontendAccessible: this.testResults.configuration.frontend?.accessible || false
            },
            detailedResults: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        // Save report
        const reportPath = `manual-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Test report saved to: ${reportPath}`);
        return report;
    }

    async run() {
        console.log('🧪 Starting Manual Frontend Testing...');
        
        try {
            await this.testFrontendStructure();
            await this.testLiveScoringComponents();
            await this.testPageComponents();
            await this.testAPIConfiguration();
            await this.testFrontendConnectivity();
            await this.testMobileComponents();
            
            const report = await this.generateReport();
            return report;
            
        } catch (error) {
            console.error('❌ Testing failed:', error.message);
            throw error;
        }
    }
}

// Run the tests
async function main() {
    const tester = new ManualFrontendTester();
    
    try {
        const report = await tester.run();
        
        console.log('\n🎉 Manual frontend testing completed!');
        console.log('\n📊 SUMMARY:');
        console.log(`Structure Status: ${report.summary.structureStatus}`);
        console.log(`Live Scoring Components: ${report.summary.liveScoringComponents}`);
        console.log(`Page Components: ${report.summary.pageComponents}`);
        console.log(`Mobile Components: ${report.summary.mobileComponents}`);
        console.log(`Frontend Accessible: ${report.summary.frontendAccessible}`);
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

module.exports = ManualFrontendTester;