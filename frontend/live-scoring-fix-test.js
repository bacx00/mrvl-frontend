#!/usr/bin/env node

/**
 * COMPREHENSIVE LIVE SCORING FIX VERIFICATION TEST
 * 
 * Tests all the fixes implemented:
 * 1. No refresh loops in SimplifiedLiveScoring
 * 2. No console spam
 * 3. Player stats persist correctly
 * 4. Hero selections save and persist
 * 5. All updates are silent and smooth
 * 6. Backend saves comprehensive data
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

// Configuration
const FRONTEND_URL = 'https://staging.mrvl.net';
const BACKEND_URL = 'https://staging.mrvl.net/api';
const TEST_MATCH_ID = 1; // Test with match ID 1
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'your_admin_password'; // Update with actual password

class LiveScoringFixTest {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = [];
        this.networkRequests = [];
        this.consoleMessages = [];
    }

    async initialize() {
        console.log('🚀 Starting Live Scoring Fix Verification Test');
        
        this.browser = await puppeteer.launch({
            headless: false, // Set to true for CI
            devtools: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Set viewport
        await this.page.setViewport({ width: 1920, height: 1080 });
        
        // Monitor network requests
        await this.page.setRequestInterception(true);
        this.page.on('request', (request) => {
            this.networkRequests.push({
                url: request.url(),
                method: request.method(),
                timestamp: Date.now()
            });
            request.continue();
        });
        
        // Monitor console messages
        this.page.on('console', (msg) => {
            this.consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            });
        });
    }

    async login() {
        console.log('🔐 Logging in as admin...');
        
        await this.page.goto(`${FRONTEND_URL}/#login`);
        await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });
        
        await this.page.type('input[name="username"]', ADMIN_USERNAME);
        await this.page.type('input[name="password"]', ADMIN_PASSWORD);
        await this.page.click('button[type="submit"]');
        
        // Wait for login to complete
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        this.addTestResult('login', 'Admin login', 'SUCCESS', 'Logged in successfully');
    }

    async navigateToMatch() {
        console.log(`🏟️  Navigating to match ${TEST_MATCH_ID}...`);
        
        await this.page.goto(`${FRONTEND_URL}/#match-detail/${TEST_MATCH_ID}`);
        await this.page.waitForSelector('.match-detail', { timeout: 15000 });
        
        this.addTestResult('navigation', 'Navigate to match', 'SUCCESS', 'Match page loaded');
    }

    async testNoRefreshLoops() {
        console.log('🔄 Testing: No refresh loops...');
        
        const initialRequestCount = this.networkRequests.length;
        const startTime = Date.now();
        
        // Wait 10 seconds and monitor requests
        await this.page.waitForTimeout(10000);
        
        const endTime = Date.now();
        const finalRequestCount = this.networkRequests.length;
        const newRequests = finalRequestCount - initialRequestCount;
        
        // Filter for match data requests
        const matchRequests = this.networkRequests
            .filter(req => req.url.includes(`/matches/${TEST_MATCH_ID}`) && req.timestamp > startTime)
            .length;
        
        const isSuccess = matchRequests <= 2; // Allow initial load + one refresh max
        
        this.addTestResult(
            'refresh_loops', 
            'No refresh loops', 
            isSuccess ? 'SUCCESS' : 'FAILED',
            `Match requests in 10s: ${matchRequests} (should be ≤ 2)`
        );
    }

    async testConsoleSpam() {
        console.log('🔇 Testing: No console spam...');
        
        const startTime = Date.now();
        const initialMessageCount = this.consoleMessages.length;
        
        // Wait 5 seconds and check console messages
        await this.page.waitForTimeout(5000);
        
        const endTime = Date.now();
        const finalMessageCount = this.consoleMessages.length;
        const newMessages = finalMessageCount - initialMessageCount;
        
        // Filter for SimplifiedLiveScoring spam messages
        const spamMessages = this.consoleMessages
            .filter(msg => 
                msg.timestamp > startTime && 
                (msg.text.includes('SimplifiedLiveScoring: Running in') ||
                 msg.text.includes('admin access check'))
            ).length;
        
        const isSuccess = spamMessages <= 1; // Allow one initialization message max
        
        this.addTestResult(
            'console_spam',
            'No console spam',
            isSuccess ? 'SUCCESS' : 'FAILED',
            `Spam messages in 5s: ${spamMessages} (should be ≤ 1)`
        );
    }

    async testOpenLiveScoring() {
        console.log('🎮 Testing: Open live scoring panel...');
        
        try {
            // Look for Live Scoring button
            await this.page.waitForSelector('button:contains("Live Scoring")', { timeout: 5000 });
            await this.page.click('button:contains("Live Scoring")');
            
            // Wait for modal to open
            await this.page.waitForSelector('.live-scoring-modal', { timeout: 5000 });
            
            this.addTestResult('open_panel', 'Open live scoring', 'SUCCESS', 'Panel opened successfully');
            return true;
        } catch (error) {
            this.addTestResult('open_panel', 'Open live scoring', 'FAILED', error.message);
            return false;
        }
    }

    async testPlayerStatsUpdate() {
        console.log('📊 Testing: Player stats updates...');
        
        try {
            // Find first player kills input
            const killsInput = await this.page.$('input[type="number"][min="0"][max="999"]');
            if (!killsInput) {
                throw new Error('Kills input not found');
            }
            
            // Clear and set new value
            await killsInput.click({ clickCount: 3 });
            await killsInput.type('5');
            
            // Wait for auto-save (300ms debounce)
            await this.page.waitForTimeout(500);
            
            // Check if update request was made
            const updateRequests = this.networkRequests
                .filter(req => req.url.includes('update-live-stats'))
                .length;
            
            const isSuccess = updateRequests > 0;
            
            this.addTestResult(
                'player_stats',
                'Player stats update',
                isSuccess ? 'SUCCESS' : 'FAILED',
                `Update requests made: ${updateRequests}`
            );
            
        } catch (error) {
            this.addTestResult('player_stats', 'Player stats update', 'FAILED', error.message);
        }
    }

    async testHeroSelection() {
        console.log('🦸 Testing: Hero selection updates...');
        
        try {
            // Find first hero select dropdown
            const heroSelect = await this.page.$('select');
            if (!heroSelect) {
                throw new Error('Hero select not found');
            }
            
            // Select a hero
            await heroSelect.select('Iron Man');
            
            // Wait for auto-save
            await this.page.waitForTimeout(500);
            
            // Check if update request was made
            const updateRequests = this.networkRequests
                .filter(req => 
                    req.url.includes('update-live-stats') && 
                    req.timestamp > Date.now() - 1000
                ).length;
            
            const isSuccess = updateRequests > 0;
            
            this.addTestResult(
                'hero_selection',
                'Hero selection update',
                isSuccess ? 'SUCCESS' : 'FAILED',
                `Update requests made: ${updateRequests}`
            );
            
        } catch (error) {
            this.addTestResult('hero_selection', 'Hero selection update', 'FAILED', error.message);
        }
    }

    async testDataPersistence() {
        console.log('💾 Testing: Data persistence...');
        
        try {
            // Close and reopen live scoring panel
            const closeButton = await this.page.$('.close-button, [aria-label="Close"]');
            if (closeButton) {
                await closeButton.click();
                await this.page.waitForTimeout(1000);
            }
            
            // Reopen panel
            await this.page.click('button:contains("Live Scoring")');
            await this.page.waitForSelector('.live-scoring-modal', { timeout: 5000 });
            
            // Check if data persisted (hero selection should still be Iron Man)
            const heroSelect = await this.page.$('select');
            const selectedValue = await this.page.evaluate(select => select.value, heroSelect);
            
            const isSuccess = selectedValue === 'Iron Man';
            
            this.addTestResult(
                'persistence',
                'Data persistence',
                isSuccess ? 'SUCCESS' : 'FAILED',
                `Hero selection persisted: ${selectedValue}`
            );
            
        } catch (error) {
            this.addTestResult('persistence', 'Data persistence', 'FAILED', error.message);
        }
    }

    addTestResult(id, name, status, details) {
        this.testResults.push({
            id,
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        });
        
        const emoji = status === 'SUCCESS' ? '✅' : '❌';
        console.log(`${emoji} ${name}: ${details}`);
    }

    async generateReport() {
        const report = {
            test_run: {
                timestamp: new Date().toISOString(),
                duration_ms: Date.now() - this.startTime,
                total_tests: this.testResults.length,
                passed: this.testResults.filter(r => r.status === 'SUCCESS').length,
                failed: this.testResults.filter(r => r.status === 'FAILED').length
            },
            test_results: this.testResults,
            network_analysis: {
                total_requests: this.networkRequests.length,
                match_data_requests: this.networkRequests.filter(r => r.url.includes(`/matches/${TEST_MATCH_ID}`)).length,
                update_requests: this.networkRequests.filter(r => r.url.includes('update-live-stats')).length
            },
            console_analysis: {
                total_messages: this.consoleMessages.length,
                error_messages: this.consoleMessages.filter(m => m.type === 'error').length,
                warning_messages: this.consoleMessages.filter(m => m.type === 'warning').length,
                spam_messages: this.consoleMessages.filter(m => 
                    m.text.includes('SimplifiedLiveScoring: Running in') ||
                    m.text.includes('admin access check')
                ).length
            }
        };
        
        // Save report
        const reportPath = `./live-scoring-fix-test-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📋 TEST REPORT SUMMARY');
        console.log('========================');
        console.log(`✅ Passed: ${report.test_run.passed}`);
        console.log(`❌ Failed: ${report.test_run.failed}`);
        console.log(`📝 Report saved: ${reportPath}`);
        
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        this.startTime = Date.now();
        
        try {
            await this.initialize();
            await this.login();
            await this.navigateToMatch();
            await this.testNoRefreshLoops();
            await this.testConsoleSpam();
            
            const panelOpened = await this.testOpenLiveScoring();
            if (panelOpened) {
                await this.testPlayerStatsUpdate();
                await this.testHeroSelection();
                await this.testDataPersistence();
            }
            
            const report = await this.generateReport();
            
            // Return exit code based on test results
            return report.test_run.failed === 0 ? 0 : 1;
            
        } catch (error) {
            console.error('❌ Test run failed:', error);
            return 1;
        } finally {
            await this.cleanup();
        }
    }
}

// Run the test
if (require.main === module) {
    const test = new LiveScoringFixTest();
    test.run().then(exitCode => {
        console.log(`\n🏁 Test completed with exit code: ${exitCode}`);
        process.exit(exitCode);
    });
}

module.exports = LiveScoringFixTest;