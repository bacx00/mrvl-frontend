const puppeteer = require('puppeteer');

/**
 * Manual Real-Time Profile Testing Script
 * Provides step-by-step manual testing guidance for real-time profile updates
 */

class ManualProfileTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  }

  async init() {
    console.log('🚀 Initializing Manual Profile Test Helper...');
    
    this.browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      slowMo: 100,
      devtools: true // Open DevTools for manual inspection
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    
    // Enable console monitoring
    this.page.on('console', msg => {
      if (msg.text().includes('Activity stats') || 
          msg.text().includes('🎯') || 
          msg.text().includes('📊') ||
          msg.text().includes('Live updates')) {
        console.log('🔍 Live Update Log:', msg.text());
      }
    });

    console.log('✅ Browser opened. You can now manually test the application.');
  }

  async startManualTest() {
    await this.init();
    
    console.log(`
🔧 MANUAL REAL-TIME PROFILE UPDATE TEST GUIDE
==============================================

1. SETUP PHASE:
   - Browser opened at: ${this.baseUrl}
   - DevTools are open for inspection
   - Console logs are being monitored

2. LOGIN TEST:
   - Navigate to login page manually
   - Login with test credentials
   - Navigate to your profile page

3. POLLING MECHANISM TEST:
   - Go to profile page (/profile)
   - Look for green pulsing indicator
   - Check "Updated: [timestamp]" indicator
   - Wait 30+ seconds and watch for timestamp change
   - Expected: Timestamp should update every 30 seconds

4. ACTIVITY CONTEXT TRIGGER TEST:
   - While on profile page, open new tab
   - In new tab, create a forum post or comment
   - Switch back to profile tab
   - Expected: Stats should update within 2-5 seconds

5. LIVE INDICATOR TEST:
   - Check for green pulsing dot near "Live updates every 30 seconds"
   - Verify timestamp format: "Updated: HH:MM:SS"
   - Watch for automatic timestamp updates

6. MULTI-TAB CONSISTENCY TEST:
   - Open profile in two tabs
   - Perform an action in one tab (comment, vote, etc.)
   - Check if both tabs show updated stats

Press Ctrl+C to exit when done testing.
    `);

    // Keep the browser open for manual testing
    await this.waitForExit();
  }

  async waitForExit() {
    return new Promise((resolve) => {
      process.on('SIGINT', async () => {
        console.log('\n👋 Closing manual test session...');
        if (this.browser) {
          await this.browser.close();
        }
        resolve();
        process.exit(0);
      });
    });
  }
}

// Interactive test scenarios
async function runInteractiveTests() {
  console.log('🎮 Interactive Real-Time Profile Testing');
  console.log('========================================');

  const tester = new ManualProfileTester();
  await tester.startManualTest();
}

if (require.main === module) {
  runInteractiveTests().catch(console.error);
}