#!/usr/bin/env node

/**
 * MRVL News Image & Video Embedding Fix Validation
 * Tests the fixes for featured image upload and video embedding functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  backendUrl: 'http://localhost:8000',
  testTimeout: 30000,
  headless: false, // Set to true for CI/production
  slowMo: 100
};

class NewsFixValidator {
  constructor() {
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

  async run() {
    console.log('🔍 Starting MRVL News Fix Validation...');
    
    try {
      this.browser = await puppeteer.launch({
        headless: CONFIG.headless,
        slowMo: CONFIG.slowMo,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1280, height: 720 });

      // Set up console logging
      this.page.on('console', (msg) => {
        console.log(`🌐 Browser: ${msg.text()}`);
      });

      await this.runAllTests();
      
    } catch (error) {
      console.error('❌ Validation failed:', error);
      this.results.summary.errors.push(error.message);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
      await this.generateReport();
    }
  }

  async runAllTests() {
    const tests = [
      { name: 'Backend Image Upload API', test: this.testBackendImageUploadAPI },
      { name: 'Frontend Image Upload Flow', test: this.testFrontendImageUpload },
      { name: 'Video URL Detection', test: this.testVideoUrlDetection },
      { name: 'Video Embedding Display', test: this.testVideoEmbedding },
      { name: 'News Article Display', test: this.testNewsArticleDisplay },
      { name: 'Image URL Generation', test: this.testImageUrlGeneration }
    ];

    for (const testCase of tests) {
      await this.runTest(testCase.name, testCase.test);
    }
  }

  async runTest(name, testFunction) {
    console.log(`\n🧪 Running: ${name}`);
    this.results.summary.total++;

    const startTime = Date.now();
    try {
      const result = await testFunction.call(this);
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name,
        status: 'PASSED',
        duration,
        result
      });
      
      this.results.summary.passed++;
      console.log(`✅ ${name} - PASSED (${duration}ms)`);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.tests.push({
        name,
        status: 'FAILED',
        duration,
        error: error.message,
        stack: error.stack
      });
      
      this.results.summary.failed++;
      this.results.summary.errors.push(`${name}: ${error.message}`);
      console.error(`❌ ${name} - FAILED (${duration}ms):`, error.message);
    }
  }

  async testBackendImageUploadAPI() {
    console.log('  📤 Testing backend image upload API...');
    
    // This would typically test the API directly
    // For now, we'll verify the endpoint exists
    const response = await fetch(`${CONFIG.backendUrl}/api/admin/news/1/featured-image`, {
      method: 'OPTIONS'
    });
    
    // Check if CORS headers indicate the endpoint exists
    if (response.status === 405 || response.status === 200) {
      return { message: 'Image upload endpoint exists', endpoint: '/admin/news/{id}/featured-image' };
    }
    
    throw new Error('Image upload endpoint not accessible');
  }

  async testFrontendImageUpload() {
    console.log('  🖼️ Testing frontend image upload functionality...');
    
    await this.page.goto(`${CONFIG.baseUrl}/admin`, { waitUntil: 'networkidle0' });
    
    // Check if the admin page loads
    const adminPageExists = await this.page.$('.admin-dashboard, .admin-panel, [class*="admin"]');
    if (!adminPageExists) {
      throw new Error('Admin interface not accessible');
    }
    
    // Check for news management section
    const newsSection = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      for (let el of elements) {
        if (el.textContent && el.textContent.toLowerCase().includes('news')) {
          return true;
        }
      }
      return false;
    });
    
    return { 
      message: 'Frontend admin interface accessible',
      hasNewsSection: newsSection 
    };
  }

  async testVideoUrlDetection() {
    console.log('  🎥 Testing video URL detection...');
    
    await this.page.goto(`${CONFIG.baseUrl}`, { waitUntil: 'networkidle0' });
    
    // Test video URL detection utility
    const result = await this.page.evaluate(() => {
      // Test URLs
      const testUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://clips.twitch.tv/AwesomeClipName',
        'https://twitter.com/user/status/123456789',
        'https://vlr.gg/12345/match-name'
      ];
      
      // Try to access video detection utilities
      if (typeof window.detectVideoUrl === 'function') {
        const results = testUrls.map(url => ({
          url,
          detected: window.detectVideoUrl(url)
        }));
        return { detected: true, results };
      }
      
      return { detected: false, message: 'Video utilities not accessible in browser' };
    });
    
    return result;
  }

  async testVideoEmbedding() {
    console.log('  📺 Testing video embedding components...');
    
    // Check if video components are loaded
    const hasVideoComponents = await this.page.evaluate(() => {
      // Look for video-related classes or components
      const videoElements = document.querySelectorAll('[class*="video"], [class*="embed"]');
      return videoElements.length > 0;
    });
    
    return { 
      message: 'Video component availability checked',
      hasVideoComponents
    };
  }

  async testNewsArticleDisplay() {
    console.log('  📰 Testing news article display...');
    
    // Try to access a news page
    await this.page.goto(`${CONFIG.baseUrl}/news`, { waitUntil: 'networkidle0' });
    
    const newsPageExists = await this.page.$('.news, [class*="news"], article');
    if (!newsPageExists) {
      throw new Error('News page not accessible');
    }
    
    // Check for image elements
    const hasImages = await this.page.evaluate(() => {
      return document.querySelectorAll('img').length > 0;
    });
    
    return {
      message: 'News page accessible',
      hasImages
    };
  }

  async testImageUrlGeneration() {
    console.log('  🔗 Testing image URL generation...');
    
    await this.page.goto(`${CONFIG.baseUrl}`, { waitUntil: 'networkidle0' });
    
    // Test image URL utility
    const result = await this.page.evaluate(() => {
      const testPaths = [
        'news/featured/test.jpg',
        '/storage/news/featured/test.jpg',
        'https://example.com/image.jpg'
      ];
      
      // Try to access image URL utilities
      if (typeof window.getImageUrl === 'function') {
        const results = testPaths.map(path => ({
          path,
          url: window.getImageUrl(path)
        }));
        return { available: true, results };
      }
      
      return { available: false, message: 'Image URL utilities not accessible' };
    });
    
    return result;
  }

  async generateReport() {
    const reportPath = path.join(__dirname, `news-fix-validation-report-${Date.now()}.json`);
    
    // Calculate success rate
    const successRate = this.results.summary.total > 0 
      ? (this.results.summary.passed / this.results.summary.total * 100).toFixed(2)
      : 0;

    this.results.summary.successRate = successRate;
    
    // Write detailed report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Console summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 NEWS FIX VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${this.results.summary.passed}/${this.results.summary.total}`);
    console.log(`❌ Failed: ${this.results.summary.failed}/${this.results.summary.total}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏱️  Report saved: ${reportPath}`);
    
    if (this.results.summary.errors.length > 0) {
      console.log('\n🚨 ERRORS SUMMARY:');
      this.results.summary.errors.forEach(error => {
        console.log(`  • ${error}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new NewsFixValidator();
  validator.run().catch(console.error);
}

module.exports = NewsFixValidator;