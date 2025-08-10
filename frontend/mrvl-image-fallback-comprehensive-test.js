/**
 * MRVL COMPREHENSIVE IMAGE FALLBACK TEST SUITE
 * 
 * This test suite verifies that ALL missing images across the MRVL platform
 * display proper question mark fallbacks instead of broken image placeholders.
 * 
 * Testing Strategy:
 * 1. Test all image utilities functions
 * 2. Test React components that display images
 * 3. Test TypeScript components that display images
 * 4. Test mobile-specific components
 * 5. Test admin panel components
 * 6. Test edge cases and error conditions
 * 
 * Coverage Areas:
 * - Player avatars in all contexts
 * - Team logos in all contexts
 * - Event/Tournament images
 * - News featured images
 * - Navigation elements
 * - Mobile components
 * - Admin components
 * - Live scoring displays
 */

const fs = require('fs');
const path = require('path');

class MRVLImageFallbackTester {
  constructor() {
    this.results = {
      totalComponentsFound: 0,
      totalComponentsTested: 0,
      componentsWithFallbacks: 0,
      componentsMissingFallbacks: 0,
      fallbackTypes: {
        'player-avatar': 0,
        'team-logo': 0,
        'event-banner': 0,
        'news-featured': 0,
        'general': 0
      },
      testedComponents: [],
      missingFallbacks: [],
      recommendations: [],
      errors: []
    };
    
    this.srcPath = '/var/www/mrvl-frontend/frontend/src';
    this.questionMarkPatterns = [
      /getImageUrl\(null,\s*['"](.*?)['"]?\)/g,
      /getImageUrl\(.*?,\s*['"](.*?)['"]?\)/g,
      /onError.*?\.src\s*=\s*getImageUrl\(null/g,
      /data:image\/svg\+xml;base64.*?\?/g
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Find all React/TypeScript components that could display images
   */
  async findImageComponents() {
    const components = [];
    
    const findInDirectory = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          if (!file.name.startsWith('.') && file.name !== 'node_modules') {
            findInDirectory(fullPath);
          }
        } else if (file.name.match(/\.(js|jsx|ts|tsx)$/)) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            
            // Check if component likely displays images
            const hasImageContent = (
              content.includes('<img') ||
              content.includes('<Image') ||
              content.includes('getImageUrl') ||
              content.includes('avatar') ||
              content.includes('logo') ||
              content.includes('banner') ||
              content.includes('featured') ||
              content.includes('onError') ||
              content.includes('placeholder') ||
              content.includes('fallback')
            );
            
            if (hasImageContent) {
              components.push({
                path: fullPath,
                relativePath: fullPath.replace(this.srcPath, ''),
                name: file.name,
                type: file.name.includes('.tsx') ? 'TypeScript' : 
                      file.name.includes('.ts') ? 'TypeScript' :
                      file.name.includes('.jsx') ? 'JavaScript' : 'JavaScript',
                content: content
              });
            }
          } catch (error) {
            this.log(`Error reading ${fullPath}: ${error.message}`, 'error');
            this.results.errors.push(`Failed to read ${fullPath}: ${error.message}`);
          }
        }
      }
    };
    
    findInDirectory(this.srcPath);
    this.results.totalComponentsFound = components.length;
    this.log(`Found ${components.length} components that potentially display images`);
    
    return components;
  }

  /**
   * Test individual component for image fallback implementation
   */
  testComponentFallbacks(component) {
    const testResult = {
      name: component.name,
      path: component.relativePath,
      type: component.type,
      hasImages: false,
      hasFallbacks: false,
      fallbackMethods: [],
      missingFallbacks: [],
      imageTypes: new Set(),
      score: 0,
      maxScore: 0,
      issues: [],
      recommendations: []
    };

    // Find all image elements and image-related functions
    const imagePatterns = [
      { pattern: /<img[^>]*src=/g, type: 'img-element' },
      { pattern: /<Image[^>]*src=/g, type: 'nextjs-image' },
      { pattern: /getImageUrl\(/g, type: 'imageutil-function' },
      { pattern: /getTeamLogoUrl\(/g, type: 'team-logo-function' },
      { pattern: /getPlayerAvatarUrl\(/g, type: 'player-avatar-function' },
      { pattern: /getUserAvatarUrl\(/g, type: 'user-avatar-function' },
      { pattern: /getEventLogoUrl\(/g, type: 'event-logo-function' },
      { pattern: /getEventBannerUrl\(/g, type: 'event-banner-function' },
      { pattern: /getNewsFeaturedImageUrl\(/g, type: 'news-image-function' }
    ];

    // Find fallback patterns
    const fallbackPatterns = [
      { pattern: /onError.*?=.*?{.*?}/g, type: 'onError-handler' },
      { pattern: /getImageUrl\(null/g, type: 'null-fallback' },
      { pattern: /data:image\/svg\+xml.*?\?/g, type: 'svg-placeholder' },
      { pattern: /\|\|\s*['"][^'"]*placeholder[^'"]*['"]/g, type: 'string-fallback' },
      { pattern: /fallback.*?=.*?['"][^'"]*['"]/g, type: 'fallback-prop' }
    ];

    // Count images found
    let imageCount = 0;
    for (const { pattern, type } of imagePatterns) {
      const matches = component.content.match(pattern) || [];
      if (matches.length > 0) {
        testResult.hasImages = true;
        imageCount += matches.length;
        testResult.imageTypes.add(type);
      }
    }

    if (!testResult.hasImages) {
      return testResult; // Skip components without images
    }

    // Count fallbacks found
    let fallbackCount = 0;
    for (const { pattern, type } of fallbackPatterns) {
      const matches = component.content.match(pattern) || [];
      if (matches.length > 0) {
        testResult.hasFallbacks = true;
        fallbackCount += matches.length;
        testResult.fallbackMethods.push(type);
      }
    }

    // Calculate score
    testResult.maxScore = imageCount * 2; // 2 points per image (existence + fallback)
    testResult.score = imageCount + fallbackCount; // 1 point per image, 1 per fallback

    // Detailed analysis
    this.analyzeSpecificFallbackTypes(component, testResult);
    
    // Generate recommendations
    if (testResult.score < testResult.maxScore) {
      const missingFallbacks = imageCount - fallbackCount;
      if (missingFallbacks > 0) {
        testResult.recommendations.push(`Add ${missingFallbacks} missing image fallback handlers`);
        testResult.issues.push(`Missing fallbacks: ${missingFallbacks}/${imageCount} images lack error handling`);
      }
    }

    return testResult;
  }

  /**
   * Analyze specific fallback types (avatar, logo, etc.)
   */
  analyzeSpecificFallbackTypes(component, testResult) {
    // Check for specific image type usage patterns
    const typeChecks = [
      { pattern: /avatar|player|user/gi, fallbackType: 'player-avatar' },
      { pattern: /team.*logo|logo.*team/gi, fallbackType: 'team-logo' },
      { pattern: /event.*banner|banner.*event|tournament/gi, fallbackType: 'event-banner' },
      { pattern: /news.*image|featured.*image/gi, fallbackType: 'news-featured' }
    ];

    for (const { pattern, fallbackType } of typeChecks) {
      if (component.content.match(pattern)) {
        // Check if this type has proper fallback
        const hasFallbackForType = (
          component.content.includes(`getImageUrl(null, '${fallbackType}')`) ||
          component.content.includes(`getImageUrl(null, "${fallbackType}")`) ||
          component.content.includes(`'${fallbackType}'`) ||
          component.content.includes(`"${fallbackType}"`)
        );
        
        if (hasFallbackForType) {
          this.results.fallbackTypes[fallbackType]++;
        } else {
          testResult.missingFallbacks.push(fallbackType);
          testResult.issues.push(`Missing ${fallbackType} fallback implementation`);
        }
      }
    }
  }

  /**
   * Test mobile-specific components
   */
  async testMobileComponents() {
    this.log('Testing mobile-specific components...');
    
    const mobileComponents = [
      '/components/mobile/',
      '/components/tablet/',
      '/hooks/useMobileOptimization.js',
      '/styles/mobile.css',
      '/styles/tablet.css'
    ];

    const mobileResults = [];
    
    for (const mobilePath of mobileComponents) {
      const fullPath = path.join(this.srcPath, mobilePath.substring(1));
      
      try {
        if (fs.existsSync(fullPath)) {
          if (fs.statSync(fullPath).isDirectory()) {
            const files = fs.readdirSync(fullPath);
            for (const file of files) {
              if (file.match(/\.(js|jsx|ts|tsx)$/)) {
                const filePath = path.join(fullPath, file);
                const content = fs.readFileSync(filePath, 'utf8');
                
                const mobileResult = this.testComponentFallbacks({
                  path: filePath,
                  relativePath: mobilePath + file,
                  name: file,
                  content: content
                });
                
                if (mobileResult.hasImages) {
                  mobileResult.category = 'mobile';
                  mobileResults.push(mobileResult);
                }
              }
            }
          } else if (mobilePath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const mobileResult = this.testComponentFallbacks({
              path: fullPath,
              relativePath: mobilePath,
              name: path.basename(mobilePath),
              content: content
            });
            
            if (mobileResult.hasImages) {
              mobileResult.category = 'mobile';
              mobileResults.push(mobileResult);
            }
          }
        }
      } catch (error) {
        this.log(`Error testing mobile component ${mobilePath}: ${error.message}`, 'error');
      }
    }
    
    this.log(`Tested ${mobileResults.length} mobile components`);
    return mobileResults;
  }

  /**
   * Test admin panel components
   */
  async testAdminComponents() {
    this.log('Testing admin panel components...');
    
    const adminPath = path.join(this.srcPath, 'components/admin');
    const adminResults = [];
    
    if (fs.existsSync(adminPath)) {
      const findAdminFiles = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
          const filePath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            findAdminFiles(filePath);
          } else if (file.name.match(/\.(js|jsx|ts|tsx)$/)) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              
              const adminResult = this.testComponentFallbacks({
                path: filePath,
                relativePath: filePath.replace(this.srcPath, ''),
                name: file.name,
                content: content
              });
              
              if (adminResult.hasImages) {
                adminResult.category = 'admin';
                adminResults.push(adminResult);
              }
            } catch (error) {
              this.log(`Error testing admin component ${filePath}: ${error.message}`, 'error');
            }
          }
        }
      };
      
      findAdminFiles(adminPath);
    }
    
    this.log(`Tested ${adminResults.length} admin components`);
    return adminResults;
  }

  /**
   * Test image utility functions
   */
  testImageUtilities() {
    this.log('Testing image utility functions...');
    
    const utilResults = [];
    
    const utilityFiles = [
      '/utils/imageUtils.js',
      '/utils/imageUtils.ts'
    ];
    
    for (const utilFile of utilityFiles) {
      const fullPath = path.join(this.srcPath, utilFile.substring(1));
      
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          
          const utilResult = {
            name: path.basename(utilFile),
            path: utilFile,
            type: 'utility',
            category: 'utility',
            hasFallbackTypes: {
              'player-avatar': content.includes("'player-avatar'") || content.includes('"player-avatar"'),
              'team-logo': content.includes("'team-logo'") || content.includes('"team-logo"'),
              'event-banner': content.includes("'event-banner'") || content.includes('"event-banner"'),
              'news-featured': content.includes("'news-featured'") || content.includes('"news-featured"'),
              'general': content.includes("'general'") || content.includes('"general"')
            },
            hasQuestionMarkFallbacks: false,
            fallbackMethods: []
          };
          
          // Check for question mark SVG fallbacks
          if (content.includes('data:image/svg+xml') && content.includes('?')) {
            utilResult.hasQuestionMarkFallbacks = true;
            utilResult.fallbackMethods.push('svg-question-mark');
          }
          
          // Check for null handling
          if (content.includes('if (!imagePath') || content.includes('imagePath === null')) {
            utilResult.fallbackMethods.push('null-check');
          }
          
          // Check for error handling
          if (content.includes('onError')) {
            utilResult.fallbackMethods.push('onError-handler');
          }
          
          utilResults.push(utilResult);
          
        } catch (error) {
          this.log(`Error testing utility ${utilFile}: ${error.message}`, 'error');
        }
      }
    }
    
    this.log(`Tested ${utilResults.length} utility files`);
    return utilResults;
  }

  /**
   * Run comprehensive test suite
   */
  async runComprehensiveTest() {
    this.log('🚀 Starting MRVL Comprehensive Image Fallback Test Suite', 'info');
    this.log('='.repeat(80));
    
    try {
      // 1. Test image utilities first
      const utilResults = this.testImageUtilities();
      
      // 2. Find all image components
      const components = await this.findImageComponents();
      
      // 3. Test each component
      this.log('Testing individual components for fallback implementation...');
      for (const component of components) {
        const result = this.testComponentFallbacks(component);
        if (result.hasImages) {
          this.results.totalComponentsTested++;
          this.results.testedComponents.push(result);
          
          if (result.hasFallbacks) {
            this.results.componentsWithFallbacks++;
          } else {
            this.results.componentsMissingFallbacks++;
            this.results.missingFallbacks.push(result);
          }
        }
      }
      
      // 4. Test mobile components
      const mobileResults = await this.testMobileComponents();
      this.results.testedComponents.push(...mobileResults);
      
      // 5. Test admin components  
      const adminResults = await this.testAdminComponents();
      this.results.testedComponents.push(...adminResults);
      
      // 6. Add utility results
      this.results.testedComponents.push(...utilResults);
      
      // 7. Generate analysis and recommendations
      this.generateAnalysis();
      
      // 8. Create detailed report
      const report = this.generateDetailedReport();
      
      this.log('✅ Test suite completed successfully!', 'success');
      return report;
      
    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'error');
      this.results.errors.push(`Test suite error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate analysis and recommendations
   */
  generateAnalysis() {
    const totalTested = this.results.totalComponentsTested;
    const withFallbacks = this.results.componentsWithFallbacks;
    const coverage = totalTested > 0 ? ((withFallbacks / totalTested) * 100).toFixed(1) : 0;
    
    this.log(`📊 Analysis: ${withFallbacks}/${totalTested} components (${coverage}%) have fallback implementations`);
    
    // Generate recommendations
    if (this.results.componentsMissingFallbacks > 0) {
      this.results.recommendations.push(
        `HIGH PRIORITY: Add fallback implementations to ${this.results.componentsMissingFallbacks} components missing image error handling`
      );
    }
    
    // Check fallback type coverage
    const fallbackTypeTotal = Object.values(this.results.fallbackTypes).reduce((a, b) => a + b, 0);
    if (fallbackTypeTotal < totalTested) {
      this.results.recommendations.push(
        `MEDIUM PRIORITY: Ensure all image types have appropriate fallback types (player-avatar, team-logo, event-banner, news-featured)`
      );
    }
    
    // Mobile-specific recommendations
    const mobileComponents = this.results.testedComponents.filter(c => c.category === 'mobile');
    const mobileWithoutFallbacks = mobileComponents.filter(c => !c.hasFallbacks);
    if (mobileWithoutFallbacks.length > 0) {
      this.results.recommendations.push(
        `MOBILE PRIORITY: ${mobileWithoutFallbacks.length} mobile components lack proper image fallbacks`
      );
    }
    
    // Admin panel recommendations
    const adminComponents = this.results.testedComponents.filter(c => c.category === 'admin');
    const adminWithoutFallbacks = adminComponents.filter(c => !c.hasFallbacks);
    if (adminWithoutFallbacks.length > 0) {
      this.results.recommendations.push(
        `ADMIN PRIORITY: ${adminWithoutFallbacks.length} admin components lack proper image fallbacks`
      );
    }
  }

  /**
   * Generate detailed HTML report
   */
  generateDetailedReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalComponentsFound: this.results.totalComponentsFound,
        totalComponentsTested: this.results.totalComponentsTested,
        componentsWithFallbacks: this.results.componentsWithFallbacks,
        componentsMissingFallbacks: this.results.componentsMissingFallbacks,
        coverage: this.results.totalComponentsTested > 0 ? 
          ((this.results.componentsWithFallbacks / this.results.totalComponentsTested) * 100).toFixed(1) : 0
      },
      fallbackTypes: this.results.fallbackTypes,
      recommendations: this.results.recommendations,
      componentDetails: this.results.testedComponents,
      missingFallbacks: this.results.missingFallbacks,
      errors: this.results.errors
    };

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(reportData);
    
    // Save report to file
    const reportPath = `/var/www/mrvl-frontend/frontend/MRVL_IMAGE_FALLBACK_TEST_REPORT_${timestamp}.html`;
    fs.writeFileSync(reportPath, htmlReport);
    
    // Also save JSON for programmatic access
    const jsonPath = `/var/www/mrvl-frontend/frontend/mrvl-image-fallback-test-${timestamp}.json`;
    fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));
    
    this.log(`📄 Detailed report saved to: ${reportPath}`, 'success');
    this.log(`📊 JSON data saved to: ${jsonPath}`, 'success');
    
    return {
      htmlReportPath: reportPath,
      jsonReportPath: jsonPath,
      summary: reportData.summary,
      recommendations: reportData.recommendations
    };
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport(data) {
    const severityColor = (score, maxScore) => {
      if (maxScore === 0) return '#6b7280';
      const percentage = (score / maxScore) * 100;
      if (percentage >= 80) return '#10b981';
      if (percentage >= 60) return '#f59e0b';
      return '#ef4444';
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MRVL Image Fallback Test Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1f2937; background: #f9fafb; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .header p { font-size: 1.1rem; opacity: 0.9; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); border-left: 4px solid #667eea; }
        .summary-card h3 { color: #374151; margin-bottom: 10px; }
        .summary-card .number { font-size: 2.5rem; font-weight: bold; color: #667eea; }
        .summary-card .label { color: #6b7280; text-transform: uppercase; font-size: 0.875rem; letter-spacing: 0.05em; }
        .coverage-bar { width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden; margin: 10px 0; }
        .coverage-fill { height: 100%; background: linear-gradient(to right, #10b981, #34d399); transition: width 0.5s ease; }
        .section { background: white; margin-bottom: 30px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .section-header { background: #f8fafc; padding: 20px; border-bottom: 1px solid #e5e7eb; }
        .section-header h2 { color: #1f2937; display: flex; align-items: center; gap: 10px; }
        .section-content { padding: 20px; }
        .recommendations { list-style: none; }
        .recommendations li { padding: 15px; margin-bottom: 10px; border-left: 4px solid; border-radius: 0 8px 8px 0; }
        .rec-high { background: #fef2f2; border-color: #ef4444; }
        .rec-medium { background: #fffbeb; border-color: #f59e0b; }
        .rec-mobile { background: #f0f9ff; border-color: #3b82f6; }
        .rec-admin { background: #f5f3ff; border-color: #8b5cf6; }
        .component-grid { display: grid; gap: 15px; }
        .component-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; }
        .component-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .component-name { font-weight: 600; color: #1f2937; }
        .component-type { font-size: 0.875rem; color: #6b7280; }
        .score-badge { padding: 4px 12px; border-radius: 20px; font-size: 0.875rem; font-weight: 600; color: white; }
        .issues-list { margin-top: 10px; }
        .issue { background: #fef2f2; border-left: 3px solid #ef4444; padding: 8px 12px; margin: 5px 0; border-radius: 0 4px 4px 0; font-size: 0.875rem; }
        .fallback-types { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px; }
        .fallback-type { padding: 4px 8px; background: #f3f4f6; border-radius: 4px; font-size: 0.75rem; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
        th { background: #f8fafc; font-weight: 600; color: #374151; }
        .status-icon { width: 20px; height: 20px; border-radius: 50%; display: inline-block; }
        .status-pass { background: #10b981; }
        .status-fail { background: #ef4444; }
        .status-warn { background: #f59e0b; }
        .category-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
        .category-general { background: #f3f4f6; color: #4b5563; }
        .category-mobile { background: #dbeafe; color: #1d4ed8; }
        .category-admin { background: #ede9fe; color: #7c3aed; }
        .category-utility { background: #d1fae5; color: #065f46; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🖼️ MRVL Image Fallback Test Report</h1>
            <p>Comprehensive analysis of question mark fallback implementations</p>
            <p style="font-size: 0.9rem; margin-top: 10px;">Generated: ${data.timestamp}</p>
        </div>

        <div class="summary-grid">
            <div class="summary-card">
                <div class="number">${data.summary.totalComponentsFound}</div>
                <div class="label">Total Components Found</div>
            </div>
            <div class="summary-card">
                <div class="number">${data.summary.totalComponentsTested}</div>
                <div class="label">Components Tested</div>
            </div>
            <div class="summary-card">
                <div class="number">${data.summary.componentsWithFallbacks}</div>
                <div class="label">With Fallbacks</div>
            </div>
            <div class="summary-card">
                <div class="number" style="color: ${data.summary.coverage >= 80 ? '#10b981' : data.summary.coverage >= 60 ? '#f59e0b' : '#ef4444'}">${data.summary.coverage}%</div>
                <div class="label">Coverage</div>
                <div class="coverage-bar">
                    <div class="coverage-fill" style="width: ${data.summary.coverage}%"></div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>🎯 Recommendations</h2>
            </div>
            <div class="section-content">
                <ul class="recommendations">
                    ${data.recommendations.map(rec => {
                        const className = rec.includes('HIGH') ? 'rec-high' : 
                                        rec.includes('MEDIUM') ? 'rec-medium' :
                                        rec.includes('MOBILE') ? 'rec-mobile' :
                                        rec.includes('ADMIN') ? 'rec-admin' : 'rec-medium';
                        return `<li class="${className}">${rec}</li>`;
                    }).join('')}
                </ul>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>📊 Fallback Type Distribution</h2>
            </div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Fallback Type</th>
                            <th>Components Using</th>
                            <th>Usage</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(data.fallbackTypes).map(([type, count]) => `
                            <tr>
                                <td><code>${type}</code></td>
                                <td>${count}</td>
                                <td>
                                    <div class="coverage-bar" style="width: 100px; height: 6px;">
                                        <div class="coverage-fill" style="width: ${Math.max(5, (count / Math.max(...Object.values(data.fallbackTypes)) * 100))}%"></div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="section">
            <div class="section-header">
                <h2>🔍 Component Analysis</h2>
            </div>
            <div class="section-content">
                <div class="component-grid">
                    ${data.componentDetails.map(component => `
                        <div class="component-card">
                            <div class="component-header">
                                <div>
                                    <div class="component-name">${component.name}</div>
                                    <div class="component-type">${component.path}</div>
                                </div>
                                <div style="display: flex; gap: 10px; align-items: center;">
                                    ${component.category ? `<span class="category-badge category-${component.category}">${component.category}</span>` : ''}
                                    ${component.maxScore > 0 ? `<div class="score-badge" style="background-color: ${severityColor(component.score || 0, component.maxScore)}">${component.score || 0}/${component.maxScore}</div>` : ''}
                                    <div class="status-icon ${component.hasFallbacks ? 'status-pass' : component.hasImages ? 'status-fail' : 'status-warn'}"></div>
                                </div>
                            </div>
                            ${component.imageTypes && component.imageTypes.size > 0 ? `
                                <div class="fallback-types">
                                    ${Array.from(component.imageTypes).map(type => `<span class="fallback-type">${type}</span>`).join('')}
                                </div>
                            ` : ''}
                            ${component.issues && component.issues.length > 0 ? `
                                <div class="issues-list">
                                    ${component.issues.map(issue => `<div class="issue">${issue}</div>`).join('')}
                                </div>
                            ` : ''}
                            ${component.recommendations && component.recommendations.length > 0 ? `
                                <div style="margin-top: 10px;">
                                    ${component.recommendations.map(rec => `<div style="font-size: 0.875rem; color: #059669;">💡 ${rec}</div>`).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        ${data.missingFallbacks.length > 0 ? `
        <div class="section">
            <div class="section-header">
                <h2>❌ Components Missing Fallbacks</h2>
            </div>
            <div class="section-content">
                <table>
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Path</th>
                            <th>Missing Fallbacks</th>
                            <th>Priority</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.missingFallbacks.map(component => `
                            <tr>
                                <td><strong>${component.name}</strong></td>
                                <td><code>${component.path}</code></td>
                                <td>${component.missingFallbacks.join(', ') || 'General'}</td>
                                <td><span class="category-badge ${component.category === 'mobile' ? 'category-mobile' : component.category === 'admin' ? 'category-admin' : 'category-general'}">
                                    ${component.category === 'mobile' ? 'Mobile' : component.category === 'admin' ? 'Admin' : 'Standard'}
                                </span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 40px; padding: 20px; color: #6b7280;">
            <p>Report generated by MRVL Image Fallback Test Suite</p>
            <p style="font-size: 0.875rem;">Ensuring no broken image placeholders across the platform</p>
        </div>
    </div>
</body>
</html>`;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MRVLImageFallbackTester;
}

// Run the test if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const tester = new MRVLImageFallbackTester();
  
  tester.runComprehensiveTest()
    .then((report) => {
      console.log('\n🎉 Test completed successfully!');
      console.log('\n📋 Summary:');
      console.log(`- Total components found: ${report.summary.totalComponentsFound}`);
      console.log(`- Components tested: ${report.summary.totalComponentsTested}`);
      console.log(`- Components with fallbacks: ${report.summary.componentsWithFallbacks}`);
      console.log(`- Coverage: ${report.summary.coverage}%`);
      console.log(`\n📄 Detailed report: ${report.htmlReportPath}`);
      console.log(`📊 JSON data: ${report.jsonReportPath}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n🎯 Key Recommendations:');
        report.recommendations.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec}`);
        });
      }
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    });
}