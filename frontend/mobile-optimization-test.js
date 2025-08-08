#!/usr/bin/env node

/**
 * Marvel Rivals Mobile Optimization Test Suite
 * Comprehensive testing for mobile responsiveness, performance, and UX
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const MOBILE_BREAKPOINTS = {
  smallMobile: 320,
  mobile: 480,
  largeMobile: 640,
  tablet: 768,
  largeTablet: 1024
};

const TOUCH_TARGET_MIN_SIZE = 44; // iOS/Android guideline
const PERFORMANCE_BUDGETS = {
  imageSize: 500, // KB
  bundleSize: 2000, // KB
  loadTime: 3000, // ms
  memoryUsage: 50 // MB
};

class MobileOptimizationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    this.sourceDir = path.join(__dirname, 'src');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  addTestResult(name, passed, message, type = 'test') {
    this.results.tests.push({
      name,
      passed,
      message,
      type,
      timestamp: new Date().toISOString()
    });

    if (passed) {
      this.results.passed++;
      this.log(`✅ ${name}: ${message}`, 'success');
    } else {
      this.results.failed++;
      this.log(`❌ ${name}: ${message}`, 'error');
    }
  }

  addWarning(name, message) {
    this.results.warnings++;
    this.results.tests.push({
      name,
      passed: null,
      message,
      type: 'warning',
      timestamp: new Date().toISOString()
    });
    this.log(`⚠️  ${name}: ${message}`, 'warning');
  }

  // Test 1: Mobile CSS Classes and Touch Targets
  testMobileCSSClasses() {
    this.log('Testing mobile CSS classes and touch targets...', 'info');
    
    const mobileCSSPath = path.join(this.sourceDir, 'styles', 'mobile.css');
    
    if (!fs.existsSync(mobileCSSPath)) {
      this.addTestResult(
        'Mobile CSS File',
        false,
        'mobile.css file not found'
      );
      return;
    }

    const cssContent = fs.readFileSync(mobileCSSPath, 'utf8');
    
    // Check for essential mobile classes
    const requiredClasses = [
      'touch-optimized',
      'touch-target',
      'mobile-performance-optimized',
      'mobile-grid',
      'scrollbar-hide'
    ];

    let foundClasses = 0;
    requiredClasses.forEach(className => {
      if (cssContent.includes(`.${className}`)) {
        foundClasses++;
      } else {
        this.addWarning(
          'Missing CSS Class',
          `Required mobile class .${className} not found`
        );
      }
    });

    this.addTestResult(
      'Mobile CSS Classes',
      foundClasses >= requiredClasses.length * 0.8,
      `Found ${foundClasses}/${requiredClasses.length} required mobile classes`
    );

    // Check for touch target minimum size
    const touchTargetRegex = /min-height:\s*(\d+)px/g;
    const touchTargetMatches = [...cssContent.matchAll(touchTargetRegex)];
    const validTouchTargets = touchTargetMatches.filter(match => 
      parseInt(match[1]) >= TOUCH_TARGET_MIN_SIZE
    );

    this.addTestResult(
      'Touch Target Sizes',
      validTouchTargets.length > 0,
      `Found ${validTouchTargets.length} properly sized touch targets (≥${TOUCH_TARGET_MIN_SIZE}px)`
    );
  }

  // Test 2: Mobile Components Structure
  testMobileComponents() {
    this.log('Testing mobile components structure...', 'info');
    
    const mobileComponentsDir = path.join(this.sourceDir, 'components', 'mobile');
    
    if (!fs.existsSync(mobileComponentsDir)) {
      this.addTestResult(
        'Mobile Components Directory',
        false,
        'Mobile components directory not found'
      );
      return;
    }

    const requiredComponents = [
      'MobileNavigation.js',
      'MobileMatchCard.js',
      'MobileBracketVisualization.js',
      'MobileGestures.js',
      'MobileEnhancements.js'
    ];

    let foundComponents = 0;
    requiredComponents.forEach(component => {
      const componentPath = path.join(mobileComponentsDir, component);
      if (fs.existsSync(componentPath)) {
        foundComponents++;
        
        // Check if component has proper imports and exports
        const content = fs.readFileSync(componentPath, 'utf8');
        
        if (!content.includes('export')) {
          this.addWarning(
            'Component Export',
            `${component} may be missing proper exports`
          );
        }

        if (content.includes('touch-optimized') || content.includes('touch-target')) {
          // Component uses touch optimization classes
        } else {
          this.addWarning(
            'Touch Optimization',
            `${component} may be missing touch optimization classes`
          );
        }
      }
    });

    this.addTestResult(
      'Mobile Components',
      foundComponents >= requiredComponents.length * 0.8,
      `Found ${foundComponents}/${requiredComponents.length} required mobile components`
    );
  }

  // Test 3: Responsive Breakpoints
  testResponsiveBreakpoints() {
    this.log('Testing responsive breakpoints...', 'info');
    
    const cssFiles = [
      path.join(this.sourceDir, 'styles', 'mobile.css'),
      path.join(this.sourceDir, 'app', 'globals.css'),
      path.join(this.sourceDir, 'index.css')
    ];

    let breakpointTests = 0;
    let validBreakpoints = 0;

    cssFiles.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check for mobile-first breakpoints
        const breakpointRegex = /@media\s*\([^)]*max-width:\s*(\d+)px\)/g;
        const matches = [...content.matchAll(breakpointRegex)];
        
        matches.forEach(match => {
          breakpointTests++;
          const width = parseInt(match[1]);
          
          // Check if breakpoint aligns with common mobile breakpoints
          const isValidBreakpoint = Object.values(MOBILE_BREAKPOINTS).some(bp => 
            Math.abs(width - bp) <= 50 // Allow 50px tolerance
          );
          
          if (isValidBreakpoint) {
            validBreakpoints++;
          }
        });
      }
    });

    this.addTestResult(
      'Responsive Breakpoints',
      breakpointTests > 0 && validBreakpoints / breakpointTests >= 0.5,
      `Found ${validBreakpoints}/${breakpointTests} valid mobile breakpoints`
    );
  }

  // Test 4: Image Optimization
  testImageOptimization() {
    this.log('Testing image optimization...', 'info');
    
    // Check for mobile-optimized image component
    const optimizedImagePath = path.join(this.sourceDir, 'components', 'mobile', 'MobileOptimizedImage.js');
    
    if (fs.existsSync(optimizedImagePath)) {
      const content = fs.readFileSync(optimizedImagePath, 'utf8');
      
      const features = [
        'lazy loading',
        'srcSet',
        'responsive sizing',
        'placeholder',
        'IntersectionObserver'
      ];

      const foundFeatures = features.filter(feature => {
        const searchTerms = {
          'lazy loading': ['loading="lazy"', 'lazy'],
          'srcSet': ['srcSet', 'generateSrcSet'],
          'responsive sizing': ['sizes=', 'responsive'],
          'placeholder': ['placeholder', 'default-placeholder'],
          'IntersectionObserver': ['IntersectionObserver', 'intersection']
        };
        
        return searchTerms[feature].some(term => 
          content.toLowerCase().includes(term.toLowerCase())
        );
      });

      this.addTestResult(
        'Image Optimization Features',
        foundFeatures.length >= features.length * 0.8,
        `Found ${foundFeatures.length}/${features.length} optimization features: ${foundFeatures.join(', ')}`
      );
    } else {
      this.addTestResult(
        'Mobile Optimized Image Component',
        false,
        'MobileOptimizedImage.js component not found'
      );
    }

    // Check image files in public directory
    const publicImagesDir = path.join(__dirname, 'public', 'images');
    if (fs.existsSync(publicImagesDir)) {
      const imageFiles = fs.readdirSync(publicImagesDir, { recursive: true })
        .filter(file => /\.(jpg|jpeg|png|webp|svg)$/i.test(file));
      
      this.addTestResult(
        'Image Assets',
        imageFiles.length > 0,
        `Found ${imageFiles.length} image assets`
      );
    }
  }

  // Test 5: Performance Utilities
  testPerformanceUtilities() {
    this.log('Testing performance utilities...', 'info');
    
    const performanceUtilPath = path.join(this.sourceDir, 'utils', 'mobilePerformance.js');
    
    if (fs.existsSync(performanceUtilPath)) {
      const content = fs.readFileSync(performanceUtilPath, 'utf8');
      
      const requiredFunctions = [
        'getConnectionQuality',
        'getDevicePerformance',
        'getLoadingStrategy',
        'ResourcePrefetcher',
        'PerformanceBudget'
      ];

      const foundFunctions = requiredFunctions.filter(func => 
        content.includes(func)
      );

      this.addTestResult(
        'Performance Utilities',
        foundFunctions.length >= requiredFunctions.length * 0.8,
        `Found ${foundFunctions.length}/${requiredFunctions.length} performance functions`
      );
    } else {
      this.addTestResult(
        'Mobile Performance Utilities',
        false,
        'mobilePerformance.js utility file not found'
      );
    }
  }

  // Test 6: Device Detection
  testDeviceDetection() {
    this.log('Testing device detection...', 'info');
    
    const deviceHookPath = path.join(this.sourceDir, 'hooks', 'useDeviceType.js');
    
    if (fs.existsSync(deviceHookPath)) {
      const content = fs.readFileSync(deviceHookPath, 'utf8');
      
      const detectionFeatures = [
        'isMobile',
        'isTablet',
        'isDesktop',
        'isTouchDevice',
        'isLandscape',
        'width',
        'height'
      ];

      const foundFeatures = detectionFeatures.filter(feature => 
        content.includes(feature)
      );

      this.addTestResult(
        'Device Detection Features',
        foundFeatures.length >= detectionFeatures.length * 0.8,
        `Found ${foundFeatures.length}/${detectionFeatures.length} detection features`
      );
    } else {
      this.addTestResult(
        'Device Detection Hook',
        false,
        'useDeviceType.js hook not found'
      );
    }
  }

  // Test 7: Accessibility Features
  testAccessibilityFeatures() {
    this.log('Testing mobile accessibility features...', 'info');
    
    const componentsDir = path.join(this.sourceDir, 'components');
    let accessibilityScore = 0;
    let totalComponents = 0;

    const checkAccessibility = (filePath) => {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      totalComponents++;
      
      const a11yFeatures = [
        'aria-label',
        'aria-labelledby',
        'role=',
        'tabIndex',
        'focus-visible',
        'screen reader'
      ];

      const foundFeatures = a11yFeatures.filter(feature => 
        content.includes(feature)
      );

      if (foundFeatures.length > 0) {
        accessibilityScore++;
      }
    };

    // Check mobile components
    const mobileDir = path.join(componentsDir, 'mobile');
    if (fs.existsSync(mobileDir)) {
      fs.readdirSync(mobileDir)
        .filter(file => file.endsWith('.js'))
        .forEach(file => {
          checkAccessibility(path.join(mobileDir, file));
        });
    }

    this.addTestResult(
      'Mobile Accessibility',
      totalComponents > 0 && accessibilityScore / totalComponents >= 0.5,
      `${accessibilityScore}/${totalComponents} components have accessibility features`
    );
  }

  // Test 8: Bundle Size Analysis
  testBundleSize() {
    this.log('Testing bundle size...', 'info');
    
    const buildDir = path.join(__dirname, 'build', 'static');
    
    if (fs.existsSync(buildDir)) {
      const jsDir = path.join(buildDir, 'js');
      const cssDir = path.join(buildDir, 'css');
      
      let totalJSSize = 0;
      let totalCSSSize = 0;

      if (fs.existsSync(jsDir)) {
        fs.readdirSync(jsDir)
          .filter(file => file.endsWith('.js'))
          .forEach(file => {
            const stats = fs.statSync(path.join(jsDir, file));
            totalJSSize += stats.size;
          });
      }

      if (fs.existsSync(cssDir)) {
        fs.readdirSync(cssDir)
          .filter(file => file.endsWith('.css'))
          .forEach(file => {
            const stats = fs.statSync(path.join(cssDir, file));
            totalCSSSize += stats.size;
          });
      }

      const totalSize = (totalJSSize + totalCSSSize) / 1024; // KB
      
      this.addTestResult(
        'Bundle Size',
        totalSize <= PERFORMANCE_BUDGETS.bundleSize,
        `Total bundle size: ${totalSize.toFixed(2)} KB (budget: ${PERFORMANCE_BUDGETS.bundleSize} KB)`
      );
    } else {
      this.addWarning(
        'Bundle Analysis',
        'Build directory not found. Run npm run build first.'
      );
    }
  }

  // Test 9: Viewport Configuration
  testViewportConfiguration() {
    this.log('Testing viewport configuration...', 'info');
    
    const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
    
    if (fs.existsSync(indexHtmlPath)) {
      const content = fs.readFileSync(indexHtmlPath, 'utf8');
      
      const viewportRegex = /<meta\s+name="viewport"\s+content="([^"]+)"/i;
      const match = content.match(viewportRegex);
      
      if (match) {
        const viewportContent = match[1];
        const hasWidthDevice = viewportContent.includes('width=device-width');
        const hasInitialScale = viewportContent.includes('initial-scale=1');
        
        this.addTestResult(
          'Viewport Meta Tag',
          hasWidthDevice && hasInitialScale,
          `Viewport configuration: ${viewportContent}`
        );
      } else {
        this.addTestResult(
          'Viewport Meta Tag',
          false,
          'Viewport meta tag not found in index.html'
        );
      }
    }
  }

  // Test 10: Mobile-First Implementation
  testMobileFirstImplementation() {
    this.log('Testing mobile-first implementation...', 'info');
    
    const appJsPath = path.join(this.sourceDir, 'App.js');
    
    if (fs.existsSync(appJsPath)) {
      const content = fs.readFileSync(appJsPath, 'utf8');
      
      const mobileFeatures = [
        'MobileNavigation',
        'MobileHomePage',
        'isMobile',
        'mobile-content',
        'lg:hidden'
      ];

      const foundFeatures = mobileFeatures.filter(feature => 
        content.includes(feature)
      );

      this.addTestResult(
        'Mobile-First App Structure',
        foundFeatures.length >= mobileFeatures.length * 0.6,
        `Found ${foundFeatures.length}/${mobileFeatures.length} mobile-first features`
      );
    }
  }

  // Generate comprehensive report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.tests.length,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        passRate: this.results.tests.length > 0 ? 
          (this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(2) + '%' : 
          '0%'
      },
      results: this.results.tests,
      recommendations: []
    };

    // Add recommendations based on test results
    if (this.results.failed > 0) {
      report.recommendations.push({
        priority: 'high',
        category: 'critical',
        message: `${this.results.failed} critical mobile optimization tests failed. Address these issues for better mobile performance.`
      });
    }

    if (this.results.warnings > 3) {
      report.recommendations.push({
        priority: 'medium',
        category: 'optimization',
        message: `${this.results.warnings} warnings detected. Consider addressing these for optimal mobile experience.`
      });
    }

    if (report.summary.passRate === '100%') {
      report.recommendations.push({
        priority: 'low',
        category: 'maintenance',
        message: 'Excellent mobile optimization! Continue monitoring performance and user experience.'
      });
    }

    return report;
  }

  // Main test runner
  async runAllTests() {
    this.log('Starting Marvel Rivals Mobile Optimization Test Suite...', 'info');
    this.log('==========================================', 'info');

    // Run all tests
    this.testMobileCSSClasses();
    this.testMobileComponents();
    this.testResponsiveBreakpoints();
    this.testImageOptimization();
    this.testPerformanceUtilities();
    this.testDeviceDetection();
    this.testAccessibilityFeatures();
    this.testBundleSize();
    this.testViewportConfiguration();
    this.testMobileFirstImplementation();

    // Generate and save report
    const report = this.generateReport();
    const reportPath = path.join(__dirname, 'mobile-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Print summary
    this.log('==========================================', 'info');
    this.log('TEST SUMMARY', 'info');
    this.log(`Total Tests: ${report.summary.total}`, 'info');
    this.log(`Passed: ${report.summary.passed}`, 'success');
    this.log(`Failed: ${report.summary.failed}`, 'error');
    this.log(`Warnings: ${report.summary.warnings}`, 'warning');
    this.log(`Pass Rate: ${report.summary.passRate}`, 'info');
    this.log(`Report saved to: ${reportPath}`, 'info');

    // Exit with appropriate code
    process.exit(this.results.failed > 0 ? 1 : 0);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new MobileOptimizationTester();
  tester.runAllTests().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = MobileOptimizationTester;