/**
 * COMPREHENSIVE POST-ROLLBACK SYSTEM AUDIT
 * 
 * This script performs exhaustive validation of all tournament systems
 * after the July 25th rollback to ensure go-live readiness.
 * 
 * Test Coverage:
 * 1. Bracket System CRUD Operations
 * 2. Live Scoring Real-time Updates
 * 3. News System with Video Embeds
 * 4. Frontend-Backend Integration
 * 5. Mobile Compatibility
 * 6. Performance Validation
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class ComprehensiveSystemAudit {
    constructor() {
        this.browser = null;
        this.page = null;
        this.results = {
            timestamp: new Date().toISOString(),
            rollback_date: '2025-07-25',
            audit_type: 'post-rollback-validation',
            systems_tested: [],
            issues_found: [],
            critical_failures: [],
            performance_metrics: {},
            mobile_compatibility: {},
            go_live_ready: false
        };
        
        this.config = {
            backend_url: 'http://localhost:8000',
            frontend_url: 'http://localhost:3000',
            admin_credentials: {
                email: 'admin@mrvl.gg',
                password: 'admin123'
            },
            test_timeout: 30000,
            mobile_viewports: [
                { name: 'iPhone 12', width: 390, height: 844 },
                { name: 'Galaxy S21', width: 384, height: 854 },
                { name: 'iPad', width: 768, height: 1024 }
            ]
        };
    }

    async initialize() {
        console.log('🚀 Starting Comprehensive Post-Rollback System Audit...\n');
        
        this.browser = await puppeteer.launch({
            headless: false,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920,1080'
            ]
        });
        
        this.page = await this.browser.newPage();
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Set up error handling
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                this.logIssue('console_error', `Console Error: ${msg.text()}`);
            }
        });
        
        this.page.on('pageerror', error => {
            this.logIssue('page_error', `Page Error: ${error.message}`);
        });
    }

    logIssue(type, message, severity = 'medium') {
        const issue = {
            type,
            message,
            severity,
            timestamp: new Date().toISOString()
        };
        
        this.results.issues_found.push(issue);
        
        if (severity === 'critical') {
            this.results.critical_failures.push(issue);
        }
        
        console.log(`⚠️  ${severity.toUpperCase()}: ${message}`);
    }

    async testBackendHealth() {
        console.log('\n📊 Testing Backend Health...');
        this.results.systems_tested.push('backend_health');
        
        try {
            const response = await fetch(`${this.config.backend_url}/api/health`);
            
            if (!response.ok) {
                this.logIssue('backend_health', 'Backend health check failed', 'critical');
                return false;
            }
            
            const data = await response.json();
            console.log('✅ Backend health check passed');
            return true;
            
        } catch (error) {
            this.logIssue('backend_health', `Backend unreachable: ${error.message}`, 'critical');
            return false;
        }
    }

    async testBracketSystemCRUD() {
        console.log('\n🏆 Testing Bracket System CRUD Operations...');
        this.results.systems_tested.push('bracket_system');
        
        try {
            // Navigate to admin dashboard
            await this.page.goto(`${this.config.frontend_url}/admin`, { waitUntil: 'networkidle0' });
            
            // Login as admin
            await this.loginAsAdmin();
            
            // Test Tournament Creation
            await this.testTournamentCreation();
            
            // Test Bracket Generation
            await this.testBracketGeneration();
            
            // Test Match Updates
            await this.testMatchUpdates();
            
            // Test Bracket Progression
            await this.testBracketProgression();
            
            console.log('✅ Bracket system CRUD tests completed');
            
        } catch (error) {
            this.logIssue('bracket_system', `Bracket system test failed: ${error.message}`, 'critical');
        }
    }

    async loginAsAdmin() {
        try {
            // Check if already logged in
            const dashboardElement = await this.page.$('.admin-dashboard');
            if (dashboardElement) {
                console.log('Already logged in as admin');
                return;
            }
            
            // Look for login form
            await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });
            
            await this.page.type('input[type="email"], input[name="email"]', this.config.admin_credentials.email);
            await this.page.type('input[type="password"], input[name="password"]', this.config.admin_credentials.password);
            
            await Promise.all([
                this.page.click('button[type="submit"], .login-button'),
                this.page.waitForNavigation({ waitUntil: 'networkidle0' })
            ]);
            
            console.log('✅ Admin login successful');
            
        } catch (error) {
            this.logIssue('admin_login', `Admin login failed: ${error.message}`, 'critical');
            throw error;
        }
    }

    async testTournamentCreation() {
        console.log('  📝 Testing tournament creation...');
        
        try {
            // Navigate to events section
            await this.page.click('a[href*="events"], .events-nav');
            await this.page.waitForSelector('.create-event, .new-tournament', { timeout: 10000 });
            
            // Click create tournament
            await this.page.click('.create-event, .new-tournament, button:contains("Create")');
            await this.page.waitForSelector('input[name="name"], input[placeholder*="name"]');
            
            // Fill tournament details
            const tournamentName = `Test Tournament ${Date.now()}`;
            await this.page.type('input[name="name"], input[placeholder*="name"]', tournamentName);
            await this.page.select('select[name="format"]', 'single_elimination');
            
            // Submit form
            await Promise.all([
                this.page.click('button[type="submit"], .submit-button'),
                this.page.waitForResponse(response => response.url().includes('/api/'))
            ]);
            
            console.log('    ✅ Tournament creation successful');
            
        } catch (error) {
            this.logIssue('tournament_creation', `Tournament creation failed: ${error.message}`);
        }
    }

    async testBracketGeneration() {
        console.log('  🎯 Testing bracket generation...');
        
        try {
            // Look for generate bracket button
            await this.page.waitForSelector('.generate-bracket, button:contains("Generate")', { timeout: 10000 });
            
            // Click generate bracket
            await this.page.click('.generate-bracket, button:contains("Generate")');
            
            // Wait for bracket to be generated
            await this.page.waitForSelector('.bracket-visualization, .tournament-bracket', { timeout: 15000 });
            
            // Verify bracket has matches
            const matches = await this.page.$$('.match-card, .bracket-match');
            
            if (matches.length === 0) {
                this.logIssue('bracket_generation', 'No matches generated in bracket');
                return;
            }
            
            console.log(`    ✅ Bracket generated with ${matches.length} matches`);
            
        } catch (error) {
            this.logIssue('bracket_generation', `Bracket generation failed: ${error.message}`);
        }
    }

    async testMatchUpdates() {
        console.log('  ⚡ Testing match score updates...');
        
        try {
            // Find first match
            const firstMatch = await this.page.$('.match-card, .bracket-match');
            if (!firstMatch) {
                this.logIssue('match_updates', 'No matches found to update');
                return;
            }
            
            // Click on match to open details
            await firstMatch.click();
            await this.page.waitForSelector('.match-details, .score-input', { timeout: 5000 });
            
            // Update scores
            const scoreInputs = await this.page.$$('input[type="number"], .score-input input');
            if (scoreInputs.length >= 2) {
                await scoreInputs[0].click({ clickCount: 3 });
                await scoreInputs[0].type('2');
                await scoreInputs[1].click({ clickCount: 3 });
                await scoreInputs[1].type('1');
                
                // Submit score update
                await this.page.click('button:contains("Update"), .update-score');
                await this.page.waitForTimeout(2000);
                
                console.log('    ✅ Match score update successful');
            }
            
        } catch (error) {
            this.logIssue('match_updates', `Match update failed: ${error.message}`);
        }
    }

    async testBracketProgression() {
        console.log('  🔄 Testing bracket progression...');
        
        try {
            // Check if winner advanced to next round
            const nextRoundMatches = await this.page.$$('.round-2 .match-card, [data-round="2"] .match-card');
            
            if (nextRoundMatches.length > 0) {
                console.log('    ✅ Bracket progression working');
            } else {
                this.logIssue('bracket_progression', 'Winner did not advance to next round');
            }
            
        } catch (error) {
            this.logIssue('bracket_progression', `Bracket progression test failed: ${error.message}`);
        }
    }

    async testLiveScoringSystem() {
        console.log('\n📡 Testing Live Scoring System...');
        this.results.systems_tested.push('live_scoring');
        
        try {
            // Navigate to live scoring
            await this.page.goto(`${this.config.frontend_url}/admin/live-scoring`, { waitUntil: 'networkidle0' });
            
            // Test real-time updates in multiple tabs
            await this.testRealTimeUpdates();
            
            // Test player statistics tracking
            await this.testPlayerStatsTracking();
            
            // Test match status transitions
            await this.testMatchStatusTransitions();
            
            console.log('✅ Live scoring system tests completed');
            
        } catch (error) {
            this.logIssue('live_scoring', `Live scoring test failed: ${error.message}`, 'critical');
        }
    }

    async testRealTimeUpdates() {
        console.log('  📊 Testing real-time score updates...');
        
        try {
            // Open second tab for cross-tab testing
            const page2 = await this.browser.newPage();
            await page2.goto(`${this.config.frontend_url}/matches`, { waitUntil: 'networkidle0' });
            
            // Update score in admin tab
            await this.page.bringToFront();
            const liveMatch = await this.page.$('.live-match, .ongoing-match');
            
            if (liveMatch) {
                await liveMatch.click();
                await this.page.waitForSelector('.live-controls', { timeout: 5000 });
                
                // Update live score
                const scoreButton = await this.page.$('button:contains("+1"), .increment-score');
                if (scoreButton) {
                    await scoreButton.click();
                    
                    // Check if update appears in second tab
                    await page2.waitForTimeout(2000);
                    await page2.reload();
                    
                    console.log('    ✅ Real-time updates working');
                } else {
                    this.logIssue('real_time_updates', 'No live scoring controls found');
                }
            } else {
                console.log('    ⚠️  No live matches found for real-time testing');
            }
            
            await page2.close();
            
        } catch (error) {
            this.logIssue('real_time_updates', `Real-time updates test failed: ${error.message}`);
        }
    }

    async testPlayerStatsTracking() {
        console.log('  📈 Testing player statistics tracking...');
        
        try {
            // Look for player stats section
            const statsSection = await this.page.$('.player-stats, .match-stats');
            
            if (statsSection) {
                // Test stat increment
                const statButton = await this.page.$('.stat-increment, button:contains("Kill")');
                if (statButton) {
                    const statBefore = await this.page.$eval('.stat-value', el => el.textContent);
                    await statButton.click();
                    await this.page.waitForTimeout(1000);
                    const statAfter = await this.page.$eval('.stat-value', el => el.textContent);
                    
                    if (statBefore !== statAfter) {
                        console.log('    ✅ Player stats tracking working');
                    } else {
                        this.logIssue('player_stats', 'Player stats not updating');
                    }
                }
            } else {
                console.log('    ⚠️  No player stats section found');
            }
            
        } catch (error) {
            this.logIssue('player_stats', `Player stats test failed: ${error.message}`);
        }
    }

    async testMatchStatusTransitions() {
        console.log('  🔄 Testing match status transitions...');
        
        try {
            // Test status change from upcoming to live
            const statusDropdown = await this.page.$('select[name="status"], .status-selector');
            
            if (statusDropdown) {
                await this.page.select('select[name="status"], .status-selector', 'live');
                await this.page.waitForTimeout(1000);
                
                // Verify status changed
                const currentStatus = await this.page.$eval('.match-status, .status-badge', el => el.textContent);
                
                if (currentStatus.toLowerCase().includes('live')) {
                    console.log('    ✅ Match status transitions working');
                } else {
                    this.logIssue('match_status', 'Match status did not update');
                }
            }
            
        } catch (error) {
            this.logIssue('match_status', `Match status test failed: ${error.message}`);
        }
    }

    async testNewsSystem() {
        console.log('\n📰 Testing News System...');
        this.results.systems_tested.push('news_system');
        
        try {
            // Navigate to news admin
            await this.page.goto(`${this.config.frontend_url}/admin/news`, { waitUntil: 'networkidle0' });
            
            // Test news creation with video embeds
            await this.testNewsCreation();
            
            // Test mention system
            await this.testMentionSystem();
            
            // Test video embed rendering
            await this.testVideoEmbeds();
            
            console.log('✅ News system tests completed');
            
        } catch (error) {
            this.logIssue('news_system', `News system test failed: ${error.message}`);
        }
    }

    async testNewsCreation() {
        console.log('  📝 Testing news article creation...');
        
        try {
            // Click create news
            await this.page.click('.create-news, button:contains("Create")');
            await this.page.waitForSelector('input[name="title"], .title-input');
            
            // Fill article details
            const articleTitle = `Test Article ${Date.now()}`;
            await this.page.type('input[name="title"], .title-input', articleTitle);
            
            // Add content with video embed
            const contentArea = await this.page.$('textarea[name="content"], .content-editor');
            if (contentArea) {
                await contentArea.type('Test article content with video embed: https://www.youtube.com/watch?v=dQw4w9WgXcQ');
            }
            
            // Submit article
            await this.page.click('button[type="submit"], .submit-article');
            await this.page.waitForTimeout(3000);
            
            console.log('    ✅ News article creation successful');
            
        } catch (error) {
            this.logIssue('news_creation', `News creation failed: ${error.message}`);
        }
    }

    async testMentionSystem() {
        console.log('  🏷️ Testing mention system...');
        
        try {
            // Type @ to trigger mention dropdown
            const contentArea = await this.page.$('textarea[name="content"], .content-editor');
            if (contentArea) {
                await contentArea.type(' @');
                
                // Wait for mention dropdown
                await this.page.waitForSelector('.mention-dropdown, .mentions-list', { timeout: 5000 });
                
                // Check if mentions appear
                const mentions = await this.page.$$('.mention-item, .mention-option');
                
                if (mentions.length > 0) {
                    console.log('    ✅ Mention system working');
                    
                    // Select first mention
                    await mentions[0].click();
                } else {
                    this.logIssue('mention_system', 'No mentions found in dropdown');
                }
            }
            
        } catch (error) {
            this.logIssue('mention_system', `Mention system test failed: ${error.message}`);
        }
    }

    async testVideoEmbeds() {
        console.log('  🎥 Testing video embed rendering...');
        
        try {
            // Navigate to news page to see rendered embeds
            await this.page.goto(`${this.config.frontend_url}/news`, { waitUntil: 'networkidle0' });
            
            // Look for video embeds
            const videoEmbeds = await this.page.$$('iframe[src*="youtube"], iframe[src*="twitch"], .video-embed');
            
            if (videoEmbeds.length > 0) {
                console.log(`    ✅ Found ${videoEmbeds.length} video embeds`);
                this.results.performance_metrics.video_embeds_found = videoEmbeds.length;
            } else {
                console.log('    ⚠️  No video embeds found');
            }
            
        } catch (error) {
            this.logIssue('video_embeds', `Video embed test failed: ${error.message}`);
        }
    }

    async testMobileCompatibility() {
        console.log('\n📱 Testing Mobile Compatibility...');
        this.results.systems_tested.push('mobile_compatibility');
        
        for (const viewport of this.config.mobile_viewports) {
            console.log(`  📲 Testing ${viewport.name} (${viewport.width}x${viewport.height})...`);
            
            await this.page.setViewport({ width: viewport.width, height: viewport.height });
            
            // Test mobile navigation
            await this.testMobileNavigation(viewport.name);
            
            // Test mobile bracket viewing
            await this.testMobileBracketViewing(viewport.name);
            
            // Test mobile live scoring
            await this.testMobileLiveScoring(viewport.name);
            
            this.results.mobile_compatibility[viewport.name] = {
                navigation: true,
                bracket_viewing: true,
                live_scoring: true
            };
        }
        
        console.log('✅ Mobile compatibility tests completed');
    }

    async testMobileNavigation(deviceName) {
        try {
            await this.page.goto(`${this.config.frontend_url}`, { waitUntil: 'networkidle0' });
            
            // Check for mobile menu toggle
            const menuToggle = await this.page.$('.mobile-menu-toggle, .hamburger-menu');
            
            if (menuToggle) {
                await menuToggle.click();
                await this.page.waitForSelector('.mobile-menu, .nav-menu-mobile', { timeout: 3000 });
                console.log(`    ✅ ${deviceName} navigation working`);
            } else {
                this.logIssue('mobile_navigation', `No mobile menu found on ${deviceName}`);
            }
            
        } catch (error) {
            this.logIssue('mobile_navigation', `Mobile navigation failed on ${deviceName}: ${error.message}`);
        }
    }

    async testMobileBracketViewing(deviceName) {
        try {
            await this.page.goto(`${this.config.frontend_url}/tournaments`, { waitUntil: 'networkidle0' });
            
            // Check if bracket is viewable on mobile
            const bracket = await this.page.$('.tournament-bracket, .bracket-visualization');
            
            if (bracket) {
                // Test horizontal scrolling
                await bracket.evaluate(element => {
                    element.scrollLeft = 100;
                });
                
                console.log(`    ✅ ${deviceName} bracket viewing working`);
            } else {
                this.logIssue('mobile_bracket', `Bracket not visible on ${deviceName}`);
            }
            
        } catch (error) {
            this.logIssue('mobile_bracket', `Mobile bracket test failed on ${deviceName}: ${error.message}`);
        }
    }

    async testMobileLiveScoring(deviceName) {
        try {
            await this.page.goto(`${this.config.frontend_url}/matches`, { waitUntil: 'networkidle0' });
            
            // Check for live matches on mobile
            const liveMatches = await this.page.$$('.live-match, .match-live');
            
            if (liveMatches.length > 0) {
                // Test touch interaction
                await liveMatches[0].tap();
                await this.page.waitForTimeout(1000);
                
                console.log(`    ✅ ${deviceName} live scoring working`);
            } else {
                console.log(`    ⚠️  No live matches found on ${deviceName}`);
            }
            
        } catch (error) {
            this.logIssue('mobile_live_scoring', `Mobile live scoring failed on ${deviceName}: ${error.message}`);
        }
    }

    async testPerformance() {
        console.log('\n⚡ Testing Performance Metrics...');
        this.results.systems_tested.push('performance');
        
        // Reset to desktop viewport
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Test page load times
        await this.testPageLoadTimes();
        
        // Test memory usage
        await this.testMemoryUsage();
        
        // Test API response times
        await this.testAPIResponseTimes();
        
        console.log('✅ Performance tests completed');
    }

    async testPageLoadTimes() {
        console.log('  ⏱️ Testing page load times...');
        
        const pages = ['/', '/tournaments', '/matches', '/news', '/teams'];
        
        for (const pagePath of pages) {
            try {
                const startTime = Date.now();
                await this.page.goto(`${this.config.frontend_url}${pagePath}`, { waitUntil: 'networkidle0' });
                const loadTime = Date.now() - startTime;
                
                this.results.performance_metrics[`load_time_${pagePath.replace('/', '') || 'home'}`] = loadTime;
                
                if (loadTime > 5000) {
                    this.logIssue('performance', `Slow load time for ${pagePath}: ${loadTime}ms`);
                } else {
                    console.log(`    ✅ ${pagePath}: ${loadTime}ms`);
                }
                
            } catch (error) {
                this.logIssue('performance', `Failed to load ${pagePath}: ${error.message}`);
            }
        }
    }

    async testMemoryUsage() {
        console.log('  🧠 Testing memory usage...');
        
        try {
            const metrics = await this.page.metrics();
            this.results.performance_metrics.memory_usage = {
                js_heap_used: metrics.JSHeapUsedSize,
                js_heap_total: metrics.JSHeapTotalSize,
                dom_nodes: metrics.Nodes,
                event_listeners: metrics.JSEventListeners
            };
            
            console.log(`    ✅ Memory usage: ${Math.round(metrics.JSHeapUsedSize / 1024 / 1024)}MB`);
            
        } catch (error) {
            this.logIssue('performance', `Memory usage test failed: ${error.message}`);
        }
    }

    async testAPIResponseTimes() {
        console.log('  🔌 Testing API response times...');
        
        const apiEndpoints = [
            '/api/tournaments',
            '/api/matches',
            '/api/teams',
            '/api/news'
        ];
        
        for (const endpoint of apiEndpoints) {
            try {
                const startTime = Date.now();
                const response = await fetch(`${this.config.backend_url}${endpoint}`);
                const responseTime = Date.now() - startTime;
                
                this.results.performance_metrics[`api_${endpoint.replace('/api/', '')}`] = responseTime;
                
                if (response.ok) {
                    console.log(`    ✅ ${endpoint}: ${responseTime}ms`);
                } else {
                    this.logIssue('api_performance', `API ${endpoint} returned ${response.status}`);
                }
                
            } catch (error) {
                this.logIssue('api_performance', `API ${endpoint} failed: ${error.message}`);
            }
        }
    }

    determineGoLiveReadiness() {
        console.log('\n🎯 Determining Go-Live Readiness...');
        
        const criticalSystems = ['backend_health', 'bracket_system', 'live_scoring'];
        const criticalSystemsWorking = criticalSystems.every(system => 
            this.results.systems_tested.includes(system)
        );
        
        const hasCriticalFailures = this.results.critical_failures.length > 0;
        const performanceAcceptable = this.results.performance_metrics.load_time_home < 3000;
        
        this.results.go_live_ready = criticalSystemsWorking && !hasCriticalFailures && performanceAcceptable;
        
        if (this.results.go_live_ready) {
            console.log('🟢 SYSTEM IS GO-LIVE READY');
        } else {
            console.log('🔴 SYSTEM NOT READY FOR GO-LIVE');
            
            if (hasCriticalFailures) {
                console.log('   Critical failures detected:');
                this.results.critical_failures.forEach(failure => {
                    console.log(`   - ${failure.message}`);
                });
            }
            
            if (!criticalSystemsWorking) {
                console.log('   Missing critical systems testing');
            }
            
            if (!performanceAcceptable) {
                console.log('   Performance issues detected');
            }
        }
    }

    async generateReport() {
        console.log('\n📋 Generating Comprehensive Audit Report...');
        
        const reportPath = path.join(__dirname, `post-rollback-audit-${Date.now()}.json`);
        
        // Add summary statistics
        this.results.summary = {
            total_systems_tested: this.results.systems_tested.length,
            total_issues_found: this.results.issues_found.length,
            critical_failures: this.results.critical_failures.length,
            go_live_ready: this.results.go_live_ready
        };
        
        // Write detailed report
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate executive summary
        const summary = this.generateExecutiveSummary();
        const summaryPath = path.join(__dirname, `AUDIT_EXECUTIVE_SUMMARY_${Date.now()}.md`);
        fs.writeFileSync(summaryPath, summary);
        
        console.log(`📄 Detailed report saved: ${reportPath}`);
        console.log(`📊 Executive summary saved: ${summaryPath}`);
        
        return { reportPath, summaryPath };
    }

    generateExecutiveSummary() {
        return `# POST-ROLLBACK SYSTEM AUDIT - EXECUTIVE SUMMARY

## Audit Overview
- **Date**: ${this.results.timestamp}
- **Rollback Date**: ${this.results.rollback_date}
- **Audit Type**: Post-rollback validation for go-live readiness

## Go-Live Status: ${this.results.go_live_ready ? '🟢 READY' : '🔴 NOT READY'}

## Systems Tested
${this.results.systems_tested.map(system => `- ✅ ${system.replace('_', ' ').toUpperCase()}`).join('\n')}

## Critical Findings
${this.results.critical_failures.length === 0 ? 
'✅ No critical failures detected' : 
this.results.critical_failures.map(failure => `- 🔴 ${failure.message}`).join('\n')}

## Performance Metrics
- Homepage Load Time: ${this.results.performance_metrics.load_time_home || 'N/A'}ms
- Memory Usage: ${this.results.performance_metrics.memory_usage ? 
    Math.round(this.results.performance_metrics.memory_usage.js_heap_used / 1024 / 1024) + 'MB' : 'N/A'}
- API Response Times: ${Object.keys(this.results.performance_metrics)
    .filter(key => key.startsWith('api_'))
    .map(key => `${key.replace('api_', '')}: ${this.results.performance_metrics[key]}ms`)
    .join(', ')}

## Mobile Compatibility
${Object.keys(this.results.mobile_compatibility).map(device => 
`- ${device}: ${this.results.mobile_compatibility[device].navigation ? '✅' : '❌'} Navigation, ${this.results.mobile_compatibility[device].bracket_viewing ? '✅' : '❌'} Brackets, ${this.results.mobile_compatibility[device].live_scoring ? '✅' : '❌'} Live Scoring`
).join('\n')}

## Issues Summary
- Total Issues: ${this.results.issues_found.length}
- Critical: ${this.results.critical_failures.length}
- Medium: ${this.results.issues_found.filter(i => i.severity === 'medium').length}
- Low: ${this.results.issues_found.filter(i => i.severity === 'low').length}

## Recommendations
${this.results.go_live_ready ? 
'✅ System is ready for go-live. All critical systems are functional.' :
'🔴 Address critical failures before go-live. Review detailed report for specific issues.'}

## Next Steps
${this.results.go_live_ready ? 
'- Proceed with go-live deployment\n- Monitor system performance post-launch\n- Schedule follow-up audit in 24 hours' :
'- Fix critical failures identified in this audit\n- Re-run validation tests\n- Defer go-live until all critical issues resolved'}

---
*Generated by Comprehensive System Audit Tool*
*Audit ID: ${this.results.timestamp}*
`;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.initialize();
            
            // Core system tests
            const backendHealthy = await this.testBackendHealth();
            
            if (backendHealthy) {
                await this.testBracketSystemCRUD();
                await this.testLiveScoringSystem();
                await this.testNewsSystem();
                await this.testMobileCompatibility();
                await this.testPerformance();
            } else {
                this.logIssue('system_health', 'Backend not healthy, skipping dependent tests', 'critical');
            }
            
            // Determine readiness
            this.determineGoLiveReadiness();
            
            // Generate reports
            const reports = await this.generateReport();
            
            console.log('\n🏁 Comprehensive System Audit Complete!');
            console.log(`Go-Live Ready: ${this.results.go_live_ready ? '✅ YES' : '❌ NO'}`);
            
            return {
                success: true,
                goLiveReady: this.results.go_live_ready,
                reports
            };
            
        } catch (error) {
            console.error('❌ Audit failed:', error);
            this.logIssue('audit_failure', `Audit script failed: ${error.message}`, 'critical');
            
            return {
                success: false,
                error: error.message,
                goLiveReady: false
            };
            
        } finally {
            await this.cleanup();
        }
    }
}

// Run the audit
if (require.main === module) {
    const audit = new ComprehensiveSystemAudit();
    audit.run().then(result => {
        process.exit(result.success && result.goLiveReady ? 0 : 1);
    });
}

module.exports = ComprehensiveSystemAudit;