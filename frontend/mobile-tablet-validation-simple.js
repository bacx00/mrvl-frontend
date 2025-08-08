/**
 * Simple Mobile/Tablet Optimization Validation (No Browser Required)
 * Validates code structure, CSS classes, and component implementation
 */

const fs = require('fs').promises;
const path = require('path');

class SimpleMobileTabletValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: [],
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  async validateFileExists(filePath, testName) {
    try {
      await fs.access(filePath);
      this.addResult(testName, true, `File exists: ${filePath}`);
      return true;
    } catch (error) {
      this.addResult(testName, false, `File missing: ${filePath}`);
      return false;
    }
  }

  async validateFileContent(filePath, patterns, testName) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const results = [];
      
      for (const [patternName, pattern] of Object.entries(patterns)) {
        const regex = new RegExp(pattern, 'gi');
        const matches = content.match(regex);
        results.push({
          pattern: patternName,
          found: !!matches,
          count: matches ? matches.length : 0
        });
      }
      
      const allPassed = results.every(r => r.found);
      this.addResult(testName, allPassed, JSON.stringify(results, null, 2));
      return results;
      
    } catch (error) {
      this.addResult(testName, false, `Error reading file: ${error.message}`);
      return [];
    }
  }

  addResult(testName, passed, details) {
    this.results.tests.push({
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.results.summary.passed++;
    } else {
      this.results.summary.failed++;
    }
    this.results.summary.total++;
    
    console.log(`${passed ? '✅' : '❌'} ${testName}`);
    if (!passed) console.log(`   ${details}`);
  }

  async validateMobileNavigation() {
    console.log('\n📱 Validating Mobile Navigation...');
    
    const filePath = './src/components/mobile/MobileNavigation.js';
    if (await this.validateFileExists(filePath, 'Mobile Navigation File Exists')) {
      await this.validateFileContent(filePath, {
        'Swipe Gesture Support': 'swipe|gesture|touch',
        'Haptic Feedback': 'haptic|vibrat',
        'Search Functionality': 'search|deboun',
        'Navigation State': 'useState|state',
        'Touch Targets': '44px|touch-target|touch-optimized'
      }, 'Mobile Navigation Features');
    }
  }

  async validateMobileBracketVisualization() {
    console.log('\n🏆 Validating Mobile Bracket Visualization...');
    
    const filePath = './src/components/mobile/MobileBracketVisualization.js';
    if (await this.validateFileExists(filePath, 'Mobile Bracket Visualization File Exists')) {
      await this.validateFileContent(filePath, {
        'Pinch Zoom Support': 'pinch|zoom|scale',
        'Touch Events': 'touchstart|touchmove|touchend',
        'Virtual Scrolling': 'virtual|scroll|offset',
        'Performance Optimizations': 'will-change|transform3d|gpu',
        'Swipe Actions': 'swipe|gesture'
      }, 'Mobile Bracket Features');
    }
  }

  async validateMobilePerformanceOptimizations() {
    console.log('\n⚡ Validating Mobile Performance Optimizations...');
    
    const filePath = './src/components/mobile/MobilePerformanceOptimizations.js';
    if (await this.validateFileExists(filePath, 'Mobile Performance Optimizations File Exists')) {
      await this.validateFileContent(filePath, {
        'Skeleton Screens': 'skeleton|loading',
        'Progressive Image Loading': 'progressive|lazy|loading',
        'Virtual Scrolling': 'virtual.*scroll|useVirtualScrolling',
        'Network Awareness': 'network|connection|online',
        'Battery Optimization': 'battery|power|optimization',
        'Intersection Observer': 'intersection.*observer|useIntersectionObserver'
      }, 'Performance Optimization Features');
    }
  }

  async validateTabletLayoutManager() {
    console.log('\n📋 Validating Tablet Layout Manager...');
    
    const filePath = './src/components/mobile/TabletLayoutManager.js';
    if (await this.validateFileExists(filePath, 'Tablet Layout Manager File Exists')) {
      await this.validateFileContent(filePath, {
        'Multi-Column Layouts': 'column|grid.*template',
        'Split View': 'split.*view|resizable',
        'Adaptive Grid': 'adaptive.*grid|responsive',
        'Layout Controls': 'layout.*control|toggle',
        'Orientation Support': 'portrait|landscape|orientation'
      }, 'Tablet Layout Features');
    }
  }

  async validateMobileCSS() {
    console.log('\n🎨 Validating Mobile CSS...');
    
    const filePath = './src/styles/mobile.css';
    if (await this.validateFileExists(filePath, 'Mobile CSS File Exists')) {
      await this.validateFileContent(filePath, {
        'Touch Targets': 'touch.*target|44px',
        'Animations': '@keyframes|animation',
        'GPU Acceleration': 'transform3d|will-change|backface-visibility',
        'Smooth Scrolling': 'smooth.*scroll|scroll.*behavior',
        'Haptic Feedback': 'haptic|bounce|pulse',
        'Mobile Optimizations': 'mobile.*optimized|performance'
      }, 'Mobile CSS Features');
    }
  }

  async validateTabletCSS() {
    console.log('\n📱 Validating Tablet CSS...');
    
    const filePath = './src/styles/tablet.css';
    if (await this.validateFileExists(filePath, 'Tablet CSS File Exists')) {
      await this.validateFileContent(filePath, {
        'Layout Manager Styles': 'tablet.*layout.*manager',
        'Split View Styles': 'tablet.*split.*view',
        'Adaptive Grid': 'tablet.*adaptive.*grid',
        'Orientation Media Queries': '@media.*orientation',
        'Touch Hover States': '@media.*hover|hover.*none',
        'Performance Classes': 'gpu.*accelerated|will-change'
      }, 'Tablet CSS Features');
    }
  }

  async validateProjectStructure() {
    console.log('\n📁 Validating Project Structure...');
    
    const expectedFiles = [
      './src/components/mobile/MobileNavigation.js',
      './src/components/mobile/MobileBracketVisualization.js',
      './src/components/mobile/MobilePerformanceOptimizations.js',
      './src/components/mobile/TabletLayoutManager.js',
      './src/components/mobile/MobileMatchCard.js',
      './src/styles/mobile.css',
      './src/styles/tablet.css'
    ];

    for (const filePath of expectedFiles) {
      await this.validateFileExists(filePath, `Project Structure: ${path.basename(filePath)}`);
    }
  }

  async validatePackageJSON() {
    console.log('\n📦 Validating Package Configuration...');
    
    try {
      const packageJson = JSON.parse(await fs.readFile('./package.json', 'utf8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const requiredDeps = [
        'react',
        'lucide-react'
      ];
      
      const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);
      
      this.addResult(
        'Required Dependencies',
        missingDeps.length === 0,
        missingDeps.length === 0 ? 'All required dependencies present' : `Missing: ${missingDeps.join(', ')}`
      );
      
    } catch (error) {
      this.addResult('Package JSON Validation', false, error.message);
    }
  }

  async generateReport() {
    const reportPath = `./mobile-tablet-validation-report-${Date.now()}.json`;
    
    try {
      await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n📋 Report saved: ${reportPath}`);
      
      // Generate summary
      const successRate = (this.results.summary.passed / this.results.summary.total * 100).toFixed(1);
      console.log(`\n📊 Validation Summary:`);
      console.log(`   Total Tests: ${this.results.summary.total}`);
      console.log(`   Passed: ${this.results.summary.passed}`);
      console.log(`   Failed: ${this.results.summary.failed}`);
      console.log(`   Success Rate: ${successRate}%`);
      
      if (this.results.summary.failed > 0) {
        console.log(`\n❌ Failed Tests:`);
        this.results.tests.filter(t => !t.passed).forEach(test => {
          console.log(`   - ${test.name}: ${test.details}`);
        });
      }
      
      return successRate >= 80;
      
    } catch (error) {
      console.error('Failed to save report:', error);
      return false;
    }
  }

  async runAllValidations() {
    console.log('🚀 Starting Mobile/Tablet Optimization Validation...\n');
    
    try {
      await this.validateProjectStructure();
      await this.validateMobileNavigation();
      await this.validateMobileBracketVisualization();
      await this.validateMobilePerformanceOptimizations();
      await this.validateTabletLayoutManager();
      await this.validateMobileCSS();
      await this.validateTabletCSS();
      await this.validatePackageJSON();
      
      const success = await this.generateReport();
      
      console.log('\n✨ Validation complete!');
      process.exit(success ? 0 : 1);
      
    } catch (error) {
      console.error('Validation failed:', error);
      process.exit(1);
    }
  }
}

// Run validation
const validator = new SimpleMobileTabletValidator();
validator.runAllValidations();

module.exports = SimpleMobileTabletValidator;