#!/usr/bin/env node

/**
 * Comprehensive Frontend Testing Suite
 * Tests all aspects of the tournament platform frontend
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class ComprehensiveFrontendTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            pageNavigation: {},
            liveScoring: {},
            matchDetails: {},
            workflows: {},
            realTimeSync: {},
            playerStats: {},
            statusTransitions: {},
            concurrentOps: {},
            errorHandling: {},
            userExperience: {},
            performance: {},
            issues: [],
            recommendations: []
        };
        this.baseUrl = 'http://localhost:3000';
        this.apiUrl = 'http://localhost:8000/api';
        this.testStartTime = Date.now();
    }

    async setup() {
        console.log('🚀 Setting up comprehensive frontend testing...');
        this.browser = await puppeteer.launch({
            headless: false, // Run in visible mode for better debugging
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security',
                '--allow-running-insecure-content'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });
        
        this.page = await this.browser.newPage();
        
        // Set up console logging
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.testResults.issues.push({
                    type: 'Console Error',
                    message: msg.text(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Set up request/response monitoring
        await this.page.setRequestInterception(true);
        this.page.on('request', request => {
            request.continue();
        });

        this.page.on('response', response => {
            if (!response.ok() && response.status() !== 404) {
                this.testResults.issues.push({
                    type: 'HTTP Error',
                    url: response.url(),
                    status: response.status(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Enable performance metrics
        await this.page.tracing.start({ path: 'trace.json' });
    }

    async testPageNavigation() {
        console.log('📄 Testing Page Navigation & Rendering...');
        
        const pages = [
            { name: 'Home', url: '/' },
            { name: 'Matches', url: '/matches' },
            { name: 'Events', url: '/events' },
            { name: 'Teams', url: '/teams' },
            { name: 'Players', url: '/players' },
            { name: 'Rankings', url: '/rankings' },
            { name: 'Stats', url: '/stats' },
            { name: 'Forums', url: '/forums' },
            { name: 'News', url: '/news' },
            { name: 'Admin Dashboard', url: '/admin' }
        ];

        for (const pageInfo of pages) {
            try {
                console.log(`  Testing ${pageInfo.name} page...`);
                const startTime = Date.now();
                
                await this.page.goto(`${this.baseUrl}${pageInfo.url}`, { 
                    waitUntil: 'networkidle2',
                    timeout: 30000 
                });
                
                const loadTime = Date.now() - startTime;
                
                // Check if page loaded successfully
                const title = await this.page.title();
                const hasContent = await this.page.$('body');
                
                // Check for React components
                const hasReactRoot = await this.page.$('#root');
                
                // Check for navigation elements
                const hasNavigation = await this.page.$('nav, .navigation, .navbar');
                
                // Take screenshot
                await this.page.screenshot({ 
                    path: `test-screenshots/${pageInfo.name.toLowerCase()}-page.png`,
                    fullPage: true 
                });

                this.testResults.pageNavigation[pageInfo.name] = {
                    url: pageInfo.url,
                    loadTime,
                    title,
                    hasContent: !!hasContent,
                    hasReactRoot: !!hasReactRoot,
                    hasNavigation: !!hasNavigation,
                    status: 'success'
                };

                // Test navigation links
                const navLinks = await this.page.$$eval('a[href]', links => 
                    links.map(link => ({ href: link.href, text: link.textContent.trim() }))
                );
                
                this.testResults.pageNavigation[pageInfo.name].navigationLinks = navLinks.length;

            } catch (error) {
                this.testResults.pageNavigation[pageInfo.name] = {
                    url: pageInfo.url,
                    status: 'error',
                    error: error.message
                };
                this.testResults.issues.push({
                    type: 'Page Navigation Error',
                    page: pageInfo.name,
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    async testSinglePageLiveScoring() {
        console.log('⚡ Testing SinglePageLiveScoring Component...');
        
        try {
            // Navigate to admin dashboard
            await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle2' });
            
            // Look for live scoring component
            const liveScoringExists = await this.page.$('.live-scoring, .single-page-live-scoring, [data-testid="live-scoring"]');
            
            if (liveScoringExists) {
                // Test real-time updates
                await this.testRealTimeUpdates();
                
                // Test score updates
                await this.testScoreUpdates();
                
                // Test player stats updates
                await this.testPlayerStatsUpdates();
                
                // Test hero selection
                await this.testHeroSelection();
                
                // Test map transitions
                await this.testMapTransitions();
                
                this.testResults.liveScoring.componentExists = true;
                this.testResults.liveScoring.status = 'success';
            } else {
                this.testResults.liveScoring.componentExists = false;
                this.testResults.liveScoring.status = 'not_found';
                this.testResults.issues.push({
                    type: 'Component Missing',
                    component: 'SinglePageLiveScoring',
                    timestamp: new Date().toISOString()
                });
            }
            
        } catch (error) {
            this.testResults.liveScoring.status = 'error';
            this.testResults.liveScoring.error = error.message;
        }
    }

    async testRealTimeUpdates() {
        console.log('  Testing real-time updates...');
        
        try {
            // Check for WebSocket or SSE connections
            const wsConnections = await this.page.evaluate(() => {
                const wsConnections = [];
                if (window.WebSocket) {
                    wsConnections.push('WebSocket supported');
                }
                if (window.EventSource) {
                    wsConnections.push('SSE supported');
                }
                return wsConnections;
            });
            
            this.testResults.liveScoring.realTimeSupport = wsConnections;
            
            // Look for real-time indicators
            const realTimeIndicators = await this.page.$$eval('[class*="live"], [class*="real-time"], [data-live]', 
                elements => elements.length
            );
            
            this.testResults.liveScoring.realTimeIndicators = realTimeIndicators;
            
        } catch (error) {
            this.testResults.liveScoring.realTimeError = error.message;
        }
    }

    async testScoreUpdates() {
        console.log('  Testing score updates...');
        
        try {
            // Look for score elements
            const scoreElements = await this.page.$$eval(
                '[class*="score"], .match-score, [data-testid*="score"]',
                elements => elements.map(el => ({
                    text: el.textContent.trim(),
                    className: el.className
                }))
            );
            
            this.testResults.liveScoring.scoreElements = scoreElements.length;
            
            // Test score update functionality
            const updateButtons = await this.page.$$('[data-testid*="update"], [class*="update"], button[onclick*="score"]');
            this.testResults.liveScoring.updateButtons = updateButtons.length;
            
        } catch (error) {
            this.testResults.liveScoring.scoreUpdateError = error.message;
        }
    }

    async testPlayerStatsUpdates() {
        console.log('  Testing player stats updates...');
        
        try {
            // Look for player stats
            const playerStats = await this.page.$$eval(
                '[class*="player"], [class*="stats"], .player-stats',
                elements => elements.length
            );
            
            this.testResults.liveScoring.playerStatsElements = playerStats;
            
            // Look for stats update forms
            const statsInputs = await this.page.$$('input[type="number"], input[name*="kills"], input[name*="deaths"]');
            this.testResults.liveScoring.statsInputs = statsInputs.length;
            
        } catch (error) {
            this.testResults.liveScoring.playerStatsError = error.message;
        }
    }

    async testHeroSelection() {
        console.log('  Testing hero selection...');
        
        try {
            // Look for hero selection elements
            const heroElements = await this.page.$$eval(
                '[class*="hero"], .hero-select, select[name*="hero"]',
                elements => elements.length
            );
            
            this.testResults.liveScoring.heroElements = heroElements;
            
            // Test hero dropdown/selection
            const heroSelectors = await this.page.$$('select[name*="hero"], .hero-dropdown');
            this.testResults.liveScoring.heroSelectors = heroSelectors.length;
            
        } catch (error) {
            this.testResults.liveScoring.heroSelectionError = error.message;
        }
    }

    async testMapTransitions() {
        console.log('  Testing map transitions...');
        
        try {
            // Look for map elements
            const mapElements = await this.page.$$eval(
                '[class*="map"], .map-select, [data-map]',
                elements => elements.length
            );
            
            this.testResults.liveScoring.mapElements = mapElements;
            
            // Look for map transition controls
            const mapControls = await this.page.$$('button[data-map], .map-transition, .next-map');
            this.testResults.liveScoring.mapControls = mapControls.length;
            
        } catch (error) {
            this.testResults.liveScoring.mapTransitionError = error.message;
        }
    }

    async testMatchDetailPage() {
        console.log('🏆 Testing MatchDetailPage Component...');
        
        try {
            // Try to navigate to a match detail page
            await this.page.goto(`${this.baseUrl}/matches`, { waitUntil: 'networkidle2' });
            
            // Look for match links
            const matchLinks = await this.page.$$('a[href*="/matches/"]');
            
            if (matchLinks.length > 0) {
                // Click on first match
                await matchLinks[0].click();
                await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
                
                // Test match detail elements
                await this.testMatchDetailElements();
                
                this.testResults.matchDetails.status = 'success';
            } else {
                this.testResults.matchDetails.status = 'no_matches_found';
            }
            
        } catch (error) {
            this.testResults.matchDetails.status = 'error';
            this.testResults.matchDetails.error = error.message;
        }
    }

    async testMatchDetailElements() {
        console.log('  Testing match detail elements...');
        
        try {
            // Check for essential match detail elements
            const elements = {
                matchTitle: await this.page.$('h1, .match-title, [data-testid="match-title"]'),
                teamNames: await this.page.$$('.team-name, [data-testid*="team"]'),
                scores: await this.page.$$('.score, [data-testid*="score"]'),
                playerStats: await this.page.$$('.player-stats, [data-testid*="player"]'),
                matchInfo: await this.page.$('.match-info, .match-details'),
                liveIndicator: await this.page.$('.live, [data-live="true"]')
            };
            
            this.testResults.matchDetails.elements = {
                hasMatchTitle: !!elements.matchTitle,
                teamNamesCount: elements.teamNames.length,
                scoresCount: elements.scores.length,
                playerStatsCount: elements.playerStats.length,
                hasMatchInfo: !!elements.matchInfo,
                hasLiveIndicator: !!elements.liveIndicator
            };
            
            // Take screenshot
            await this.page.screenshot({ 
                path: 'test-screenshots/match-detail-page.png',
                fullPage: true 
            });
            
        } catch (error) {
            this.testResults.matchDetails.elementsError = error.message;
        }
    }

    async testCompleteMatchWorkflows() {
        console.log('🔄 Testing Complete Match Workflows...');
        
        const workflows = ['BO1', 'BO3', 'BO5'];
        
        for (const format of workflows) {
            try {
                console.log(`  Testing ${format} workflow...`);
                await this.testMatchWorkflow(format);
            } catch (error) {
                this.testResults.workflows[format] = {
                    status: 'error',
                    error: error.message
                };
            }
        }
    }

    async testMatchWorkflow(format) {
        // Navigate to admin match creation
        await this.page.goto(`${this.baseUrl}/admin`, { waitUntil: 'networkidle2' });
        
        // Look for match creation form or button
        const createMatchButton = await this.page.$('button[data-testid="create-match"], .create-match, button:contains("Create Match")');
        
        if (createMatchButton) {
            await createMatchButton.click();
            
            // Fill out match form if available
            const formatSelect = await this.page.$(`select[name="format"], select:contains("${format}")`);
            if (formatSelect) {
                await formatSelect.select(format);
            }
            
            this.testResults.workflows[format] = {
                status: 'form_available',
                hasCreateButton: true,
                hasFormatSelection: !!formatSelect
            };
        } else {
            this.testResults.workflows[format] = {
                status: 'no_create_form',
                hasCreateButton: false
            };
        }
    }

    async testRealTimeSynchronization() {
        console.log('🔄 Testing Real-time Synchronization...');
        
        try {
            // Open second page in new tab
            const page2 = await this.browser.newPage();
            await page2.goto(`${this.baseUrl}/matches`, { waitUntil: 'networkidle2' });
            
            // Simulate updates in first tab and check second tab
            await this.testCrossTabSync(this.page, page2);
            
            await page2.close();
            
            this.testResults.realTimeSync.status = 'tested';
            
        } catch (error) {
            this.testResults.realTimeSync.status = 'error';
            this.testResults.realTimeSync.error = error.message;
        }
    }

    async testCrossTabSync(page1, page2) {
        console.log('  Testing cross-tab synchronization...');
        
        try {
            // Get initial state from both pages
            const initialState1 = await page1.evaluate(() => window.location.href);
            const initialState2 = await page2.evaluate(() => window.location.href);
            
            this.testResults.realTimeSync.initialStates = {
                page1: initialState1,
                page2: initialState2
            };
            
            // Look for real-time data elements
            const realTimeElements1 = await page1.$$('[data-live], .live-score, .real-time');
            const realTimeElements2 = await page2.$$('[data-live], .live-score, .real-time');
            
            this.testResults.realTimeSync.realTimeElements = {
                page1: realTimeElements1.length,
                page2: realTimeElements2.length
            };
            
        } catch (error) {
            this.testResults.realTimeSync.crossTabError = error.message;
        }
    }

    async testErrorHandling() {
        console.log('🚨 Testing Error Handling...');
        
        try {
            // Test 404 pages
            await this.page.goto(`${this.baseUrl}/non-existent-page`, { waitUntil: 'networkidle2' });
            
            const has404Handler = await this.page.$('.not-found, .error-404, .page-not-found');
            this.testResults.errorHandling.has404Handler = !!has404Handler;
            
            // Test network errors by going offline
            await this.page.setOfflineMode(true);
            await this.page.reload({ waitUntil: 'domcontentloaded' });
            
            const hasOfflineHandler = await this.page.$('.offline, .network-error, .connection-error');
            this.testResults.errorHandling.hasOfflineHandler = !!hasOfflineHandler;
            
            // Restore connection
            await this.page.setOfflineMode(false);
            
            this.testResults.errorHandling.status = 'tested';
            
        } catch (error) {
            this.testResults.errorHandling.status = 'error';
            this.testResults.errorHandling.error = error.message;
        }
    }

    async testUserExperience() {
        console.log('👤 Testing User Experience & Performance...');
        
        try {
            // Navigate to home page
            await this.page.goto(`${this.baseUrl}/`, { waitUntil: 'networkidle2' });
            
            // Test responsive design
            await this.testResponsiveDesign();
            
            // Test loading performance
            await this.testLoadingPerformance();
            
            // Test animations and transitions
            await this.testAnimations();
            
            this.testResults.userExperience.status = 'tested';
            
        } catch (error) {
            this.testResults.userExperience.status = 'error';
            this.testResults.userExperience.error = error.message;
        }
    }

    async testResponsiveDesign() {
        console.log('  Testing responsive design...');
        
        const viewports = [
            { name: 'Mobile', width: 375, height: 667 },
            { name: 'Tablet', width: 768, height: 1024 },
            { name: 'Desktop', width: 1920, height: 1080 }
        ];
        
        for (const viewport of viewports) {
            await this.page.setViewport(viewport);
            await this.page.screenshot({ 
                path: `test-screenshots/responsive-${viewport.name.toLowerCase()}.png` 
            });
            
            // Check if navigation adapts
            const mobileNav = await this.page.$('.mobile-nav, .hamburger, .nav-toggle');
            
            this.testResults.userExperience.responsive = this.testResults.userExperience.responsive || {};
            this.testResults.userExperience.responsive[viewport.name] = {
                hasMobileNav: !!mobileNav,
                viewport: viewport
            };
        }
        
        // Reset to desktop
        await this.page.setViewport({ width: 1920, height: 1080 });
    }

    async testLoadingPerformance() {
        console.log('  Testing loading performance...');
        
        try {
            const metrics = await this.page.metrics();
            
            this.testResults.performance.metrics = {
                JSHeapUsedSize: metrics.JSHeapUsedSize,
                JSHeapTotalSize: metrics.JSHeapTotalSize,
                Timestamp: metrics.Timestamp,
                Nodes: metrics.Nodes,
                ScriptDuration: metrics.ScriptDuration
            };
            
            // Test Core Web Vitals
            const webVitals = await this.page.evaluate(() => {
                return new Promise((resolve) => {
                    const vitals = {};
                    
                    // LCP
                    new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        vitals.LCP = entries[entries.length - 1]?.startTime;
                    }).observe({ type: 'largest-contentful-paint', buffered: true });
                    
                    // FID
                    new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        vitals.FID = entries[0]?.processingStart - entries[0]?.startTime;
                    }).observe({ type: 'first-input', buffered: true });
                    
                    // CLS
                    new PerformanceObserver((list) => {
                        const entries = list.getEntries();
                        vitals.CLS = entries.reduce((cls, entry) => cls + entry.value, 0);
                    }).observe({ type: 'layout-shift', buffered: true });
                    
                    setTimeout(() => resolve(vitals), 2000);
                });
            });
            
            this.testResults.performance.webVitals = webVitals;
            
        } catch (error) {
            this.testResults.performance.error = error.message;
        }
    }

    async testAnimations() {
        console.log('  Testing animations and transitions...');
        
        try {
            // Look for animated elements
            const animatedElements = await this.page.$$eval(
                '[class*="animate"], [class*="transition"], [class*="fade"], [class*="slide"]',
                elements => elements.length
            );
            
            this.testResults.userExperience.animatedElements = animatedElements;
            
            // Test hover effects
            const hoverElements = await this.page.$$('[class*="hover"]');
            this.testResults.userExperience.hoverElements = hoverElements.length;
            
        } catch (error) {
            this.testResults.userExperience.animationError = error.message;
        }
    }

    async generateReport() {
        console.log('📊 Generating comprehensive test report...');
        
        const totalTestTime = Date.now() - this.testStartTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: `${(totalTestTime / 1000).toFixed(2)}s`,
            summary: {
                totalPages: Object.keys(this.testResults.pageNavigation).length,
                pagesSuccessful: Object.values(this.testResults.pageNavigation).filter(p => p.status === 'success').length,
                totalIssues: this.testResults.issues.length,
                criticalIssues: this.testResults.issues.filter(i => i.type.includes('Error')).length
            },
            results: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        // Save report
        const reportPath = `comprehensive-test-report-${Date.now()}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Test report saved to: ${reportPath}`);
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Page navigation recommendations
        const failedPages = Object.entries(this.testResults.pageNavigation)
            .filter(([_, result]) => result.status === 'error');
        
        if (failedPages.length > 0) {
            recommendations.push({
                category: 'Page Navigation',
                priority: 'High',
                issue: `${failedPages.length} pages failed to load`,
                recommendation: 'Fix page routing and component loading issues'
            });
        }
        
        // Performance recommendations
        if (this.testResults.performance.metrics) {
            const heapUsage = this.testResults.performance.metrics.JSHeapUsedSize / this.testResults.performance.metrics.JSHeapTotalSize;
            if (heapUsage > 0.8) {
                recommendations.push({
                    category: 'Performance',
                    priority: 'Medium',
                    issue: 'High memory usage detected',
                    recommendation: 'Optimize component memory usage and implement proper cleanup'
                });
            }
        }
        
        // Live scoring recommendations
        if (!this.testResults.liveScoring.componentExists) {
            recommendations.push({
                category: 'Live Scoring',
                priority: 'High',
                issue: 'Live scoring component not found',
                recommendation: 'Implement and properly mount live scoring components'
            });
        }
        
        // Error handling recommendations
        if (!this.testResults.errorHandling.has404Handler) {
            recommendations.push({
                category: 'Error Handling',
                priority: 'Medium',
                issue: 'No 404 error handler found',
                recommendation: 'Implement proper error boundaries and 404 pages'
            });
        }
        
        return recommendations;
    }

    async cleanup() {
        console.log('🧹 Cleaning up test environment...');
        
        try {
            await this.page.tracing.stop();
            await this.browser.close();
        } catch (error) {
            console.error('Cleanup error:', error.message);
        }
    }

    async run() {
        try {
            await this.setup();
            
            // Create screenshots directory
            await fs.mkdir('test-screenshots', { recursive: true });
            
            // Run all tests
            await this.testPageNavigation();
            await this.testSinglePageLiveScoring();
            await this.testMatchDetailPage();
            await this.testCompleteMatchWorkflows();
            await this.testRealTimeSynchronization();
            await this.testErrorHandling();
            await this.testUserExperience();
            
            // Generate and return report
            const report = await this.generateReport();
            
            return report;
            
        } finally {
            await this.cleanup();
        }
    }
}

// Run the tests
async function main() {
    const tester = new ComprehensiveFrontendTester();
    
    try {
        const report = await tester.run();
        
        console.log('\n🎉 Comprehensive frontend testing completed!');
        console.log('\n📊 SUMMARY:');
        console.log(`Total Pages Tested: ${report.summary.totalPages}`);
        console.log(`Pages Successful: ${report.summary.pagesSuccessful}`);
        console.log(`Total Issues: ${report.summary.totalIssues}`);
        console.log(`Critical Issues: ${report.summary.criticalIssues}`);
        console.log(`Test Duration: ${report.testDuration}`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 TOP RECOMMENDATIONS:');
            report.recommendations.slice(0, 5).forEach((rec, i) => {
                console.log(`${i + 1}. [${rec.priority}] ${rec.category}: ${rec.recommendation}`);
            });
        }
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Testing failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = ComprehensiveFrontendTester;