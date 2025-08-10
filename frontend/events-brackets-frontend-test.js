#!/usr/bin/env node
/**
 * MRVL Platform - Events & Brackets Frontend Testing Suite
 * 
 * This script validates the frontend components and interactions for the Events 
 * and Brackets moderation tabs by analyzing component structure, props validation,
 * and potential runtime issues.
 */

const fs = require('fs').promises;
const path = require('path');

class FrontendTestSuite {
  constructor() {
    this.testResults = {
      components: [],
      structure: [],
      validation: [],
      accessibility: [],
      performance: []
    };
    this.componentPaths = {
      adminEvents: '/var/www/mrvl-frontend/frontend/src/components/admin/AdminEvents.js',
      bracketManagement: '/var/www/mrvl-frontend/frontend/src/components/admin/BracketManagement.js',
      bracketManagementDashboard: '/var/www/mrvl-frontend/frontend/src/components/admin/BracketManagementDashboard.js'
    };
  }

  async init() {
    console.log('🎨 Starting MRVL Events & Brackets Frontend Testing Suite...\n');
    
    await this.analyzeComponentStructure();
    await this.validateComponentLogic();
    await this.checkAccessibility();
    await this.analyzePerformance();
    await this.generateReport();
  }

  async analyzeComponentStructure() {
    console.log('🏗️  Analyzing Component Structure...\n');

    for (const [componentName, componentPath] of Object.entries(this.componentPaths)) {
      try {
        const exists = await this.fileExists(componentPath);
        if (!exists) {
          this.testResults.structure.push({
            component: componentName,
            test: 'File Exists',
            status: 'FAIL',
            details: `Component file not found at ${componentPath}`
          });
          continue;
        }

        const content = await fs.readFile(componentPath, 'utf8');
        const analysis = await this.analyzeComponent(componentName, content);
        
        this.testResults.structure.push({
          component: componentName,
          test: 'Component Structure',
          status: 'PASS',
          details: analysis
        });

      } catch (error) {
        this.testResults.structure.push({
          component: componentName,
          test: 'Component Analysis',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    console.log('✅ Component structure analysis completed\n');
  }

  async analyzeComponent(componentName, content) {
    const analysis = {
      name: componentName,
      type: this.getComponentType(content),
      hooks: this.extractReactHooks(content),
      props: this.extractProps(content),
      methods: this.extractMethods(content),
      dependencies: this.extractDependencies(content),
      stateManagement: this.analyzeStateManagement(content),
      apiCalls: this.extractApiCalls(content),
      eventHandlers: this.extractEventHandlers(content),
      errors: this.findPotentialIssues(content)
    };

    return analysis;
  }

  getComponentType(content) {
    if (content.includes('class ') && content.includes('extends')) {
      return 'Class Component';
    } else if (content.includes('function ') || content.includes('const ') && content.includes('=>')) {
      return 'Functional Component';
    }
    return 'Unknown';
  }

  extractReactHooks(content) {
    const hookPattern = /use[A-Z][a-zA-Z]*\s*\(/g;
    const hooks = content.match(hookPattern) || [];
    return hooks.map(hook => hook.replace('(', '').trim());
  }

  extractProps(content) {
    const props = [];
    
    // Extract from function parameters
    const funcParamMatch = content.match(/function\s+\w*\s*\(\s*\{([^}]+)\}/);
    if (funcParamMatch) {
      const propString = funcParamMatch[1];
      props.push(...propString.split(',').map(p => p.trim()));
    }

    // Extract from destructuring
    const destructurePattern = /const\s*\{\s*([^}]+)\s*\}\s*=\s*props/g;
    let match;
    while ((match = destructurePattern.exec(content)) !== null) {
      props.push(...match[1].split(',').map(p => p.trim()));
    }

    return props;
  }

  extractMethods(content) {
    const methods = [];
    
    // Extract function declarations
    const funcPattern = /const\s+(\w+)\s*=\s*(?:async\s+)?(?:\([^)]*\)\s*=>\s*\{|function)/g;
    let match;
    while ((match = funcPattern.exec(content)) !== null) {
      methods.push(match[1]);
    }

    // Extract arrow functions
    const arrowFuncPattern = /const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
    while ((match = arrowFuncPattern.exec(content)) !== null) {
      methods.push(match[1]);
    }

    return methods;
  }

  extractDependencies(content) {
    const deps = [];
    const importPattern = /import\s+(?:\{[^}]+\}|\w+)(?:\s*,\s*(?:\{[^}]+\}|\w+))?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importPattern.exec(content)) !== null) {
      deps.push(match[1]);
    }
    return deps;
  }

  analyzeStateManagement(content) {
    const stateAnalysis = {
      useState: (content.match(/useState\s*\(/g) || []).length,
      useEffect: (content.match(/useEffect\s*\(/g) || []).length,
      useContext: (content.match(/useContext\s*\(/g) || []).length,
      customHooks: [],
      stateVariables: []
    };

    // Extract useState variables
    const useStatePattern = /const\s*\[([^,]+),\s*([^]]+)\]\s*=\s*useState/g;
    let match;
    while ((match = useStatePattern.exec(content)) !== null) {
      stateAnalysis.stateVariables.push({
        variable: match[1].trim(),
        setter: match[2].trim()
      });
    }

    return stateAnalysis;
  }

  extractApiCalls(content) {
    const apiCalls = [];
    
    // Look for api.get, api.post, etc.
    const apiPattern = /(?:api|axios)\.(\w+)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;
    while ((match = apiPattern.exec(content)) !== null) {
      apiCalls.push({
        method: match[1],
        endpoint: match[2]
      });
    }

    // Look for fetch calls
    const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((match = fetchPattern.exec(content)) !== null) {
      apiCalls.push({
        method: 'fetch',
        endpoint: match[1]
      });
    }

    return apiCalls;
  }

  extractEventHandlers(content) {
    const handlers = [];
    
    // Look for onClick, onChange, etc.
    const eventPattern = /on[A-Z]\w*\s*=\s*\{([^}]+)\}/g;
    let match;
    while ((match = eventPattern.exec(content)) !== null) {
      handlers.push(match[1].trim());
    }

    return handlers;
  }

  findPotentialIssues(content) {
    const issues = [];

    // Check for potential memory leaks
    if (content.includes('useEffect') && !content.includes('return () =>')) {
      issues.push({
        type: 'POTENTIAL_MEMORY_LEAK',
        description: 'useEffect without cleanup function'
      });
    }

    // Check for missing error handling
    if (content.includes('async') && !content.includes('catch')) {
      issues.push({
        type: 'MISSING_ERROR_HANDLING',
        description: 'Async operations without error handling'
      });
    }

    // Check for console.log in production code
    if (content.includes('console.log') || content.includes('console.error')) {
      issues.push({
        type: 'DEBUG_CODE',
        description: 'Console statements found in component'
      });
    }

    // Check for inline styles (performance concern)
    if (content.includes('style={{')) {
      issues.push({
        type: 'INLINE_STYLES',
        description: 'Inline styles found - consider CSS classes'
      });
    }

    // Check for large component (maintainability)
    const lineCount = content.split('\n').length;
    if (lineCount > 500) {
      issues.push({
        type: 'LARGE_COMPONENT',
        description: `Component has ${lineCount} lines - consider splitting`
      });
    }

    return issues;
  }

  async validateComponentLogic() {
    console.log('🔍 Validating Component Logic...\n');

    for (const [componentName, componentPath] of Object.entries(this.componentPaths)) {
      try {
        const exists = await this.fileExists(componentPath);
        if (!exists) continue;

        const content = await fs.readFile(componentPath, 'utf8');
        const validation = await this.validateLogic(componentName, content);
        
        this.testResults.validation.push({
          component: componentName,
          test: 'Logic Validation',
          status: validation.issues.length === 0 ? 'PASS' : 'WARNING',
          details: validation
        });

      } catch (error) {
        this.testResults.validation.push({
          component: componentName,
          test: 'Logic Validation',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    console.log('✅ Component logic validation completed\n');
  }

  async validateLogic(componentName, content) {
    const validation = {
      issues: [],
      suggestions: [],
      bestPractices: []
    };

    // Check for proper state management
    if (content.includes('useState') && content.includes('setEvents') && !content.includes('useCallback')) {
      validation.suggestions.push({
        type: 'PERFORMANCE',
        suggestion: 'Consider using useCallback for event handlers to prevent unnecessary re-renders'
      });
    }

    // Check for proper API error handling
    const apiCalls = this.extractApiCalls(content);
    for (const apiCall of apiCalls) {
      const hasErrorHandling = content.includes(`catch`) || content.includes(`error`);
      if (!hasErrorHandling) {
        validation.issues.push({
          type: 'ERROR_HANDLING',
          issue: `API call to ${apiCall.endpoint} may not have proper error handling`
        });
      }
    }

    // Check for accessibility
    if (!content.includes('aria-') && !content.includes('role=')) {
      validation.suggestions.push({
        type: 'ACCESSIBILITY',
        suggestion: 'Consider adding ARIA attributes for better accessibility'
      });
    }

    // Check for loading states
    if (content.includes('loading') && content.includes('setLoading')) {
      validation.bestPractices.push({
        type: 'UX',
        practice: 'Good: Component implements loading states'
      });
    }

    return validation;
  }

  async checkAccessibility() {
    console.log('♿ Checking Accessibility...\n');

    for (const [componentName, componentPath] of Object.entries(this.componentPaths)) {
      try {
        const exists = await this.fileExists(componentPath);
        if (!exists) continue;

        const content = await fs.readFile(componentPath, 'utf8');
        const accessibility = await this.analyzeAccessibility(componentName, content);
        
        this.testResults.accessibility.push({
          component: componentName,
          test: 'Accessibility Analysis',
          status: accessibility.score >= 80 ? 'PASS' : 'NEEDS_IMPROVEMENT',
          details: accessibility
        });

      } catch (error) {
        this.testResults.accessibility.push({
          component: componentName,
          test: 'Accessibility Analysis',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    console.log('✅ Accessibility analysis completed\n');
  }

  async analyzeAccessibility(componentName, content) {
    const accessibility = {
      score: 100,
      issues: [],
      recommendations: []
    };

    // Check for proper semantic HTML
    if (!content.includes('<button') && content.includes('onClick')) {
      accessibility.issues.push('Using non-semantic elements for interactive content');
      accessibility.score -= 10;
    }

    // Check for alt text on images
    if (content.includes('<img') && !content.includes('alt=')) {
      accessibility.issues.push('Images without alt text');
      accessibility.score -= 15;
    }

    // Check for ARIA labels
    if (content.includes('input') && !content.includes('aria-label') && !content.includes('<label')) {
      accessibility.issues.push('Form inputs without labels');
      accessibility.score -= 10;
    }

    // Check for keyboard navigation
    if (content.includes('onKeyDown') || content.includes('onKeyPress')) {
      accessibility.recommendations.push('Good: Component supports keyboard navigation');
    } else if (content.includes('onClick')) {
      accessibility.issues.push('Interactive elements may not be keyboard accessible');
      accessibility.score -= 10;
    }

    // Check for color-only information
    if (content.includes('color:') && !content.includes('text') && !content.includes('icon')) {
      accessibility.issues.push('Possible reliance on color-only information');
      accessibility.score -= 5;
    }

    return accessibility;
  }

  async analyzePerformance() {
    console.log('⚡ Analyzing Performance...\n');

    for (const [componentName, componentPath] of Object.entries(this.componentPaths)) {
      try {
        const exists = await this.fileExists(componentPath);
        if (!exists) continue;

        const content = await fs.readFile(componentPath, 'utf8');
        const performance = await this.analyzeComponentPerformance(componentName, content);
        
        this.testResults.performance.push({
          component: componentName,
          test: 'Performance Analysis',
          status: performance.score >= 80 ? 'GOOD' : 'NEEDS_OPTIMIZATION',
          details: performance
        });

      } catch (error) {
        this.testResults.performance.push({
          component: componentName,
          test: 'Performance Analysis',
          status: 'FAIL',
          error: error.message
        });
      }
    }

    console.log('✅ Performance analysis completed\n');
  }

  async analyzeComponentPerformance(componentName, content) {
    const performance = {
      score: 100,
      optimizations: [],
      warnings: [],
      bundleSize: content.length,
      complexity: this.calculateComplexity(content)
    };

    // Check for unnecessary re-renders
    if (content.includes('useState') && !content.includes('useMemo') && !content.includes('useCallback')) {
      performance.warnings.push('Component may have unnecessary re-renders');
      performance.score -= 15;
    }

    // Check for large inline objects/arrays
    const inlineObjects = (content.match(/\{[^}]{50,}\}/g) || []).length;
    if (inlineObjects > 3) {
      performance.warnings.push('Large inline objects detected - consider extracting');
      performance.score -= 10;
    }

    // Check for heavy computations in render
    if (content.includes('.map(') && content.includes('.filter(') && !content.includes('useMemo')) {
      performance.warnings.push('Heavy list operations without memoization');
      performance.score -= 10;
    }

    // Check for optimizations
    if (content.includes('useMemo')) {
      performance.optimizations.push('Uses useMemo for expensive calculations');
    }

    if (content.includes('useCallback')) {
      performance.optimizations.push('Uses useCallback for stable function references');
    }

    if (content.includes('React.lazy') || content.includes('Suspense')) {
      performance.optimizations.push('Implements code splitting');
    }

    return performance;
  }

  calculateComplexity(content) {
    let complexity = 1;
    
    // Count decision points
    complexity += (content.match(/if\s*\(/g) || []).length;
    complexity += (content.match(/else\s+if/g) || []).length;
    complexity += (content.match(/\?\s*:/g) || []).length; // ternary
    complexity += (content.match(/&&/g) || []).length;
    complexity += (content.match(/\|\|/g) || []).length;
    complexity += (content.match(/for\s*\(/g) || []).length;
    complexity += (content.match(/while\s*\(/g) || []).length;
    complexity += (content.match(/case\s+/g) || []).length;
    complexity += (content.match(/catch\s*\(/g) || []).length;

    return complexity;
  }

  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async generateReport() {
    console.log('📊 Generating Frontend Test Report...\n');

    const report = {
      testSuite: 'MRVL Events & Brackets Frontend Testing',
      timestamp: new Date().toISOString(),
      summary: this.generateSummary(),
      results: this.testResults,
      recommendations: this.generateRecommendations()
    };

    // Save JSON report
    const filename = `events-brackets-frontend-test-${Date.now()}.json`;
    await fs.writeFile(filename, JSON.stringify(report, null, 2));

    // Generate HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlFilename = `events-brackets-frontend-test-${Date.now()}.html`;
    await fs.writeFile(htmlFilename, htmlReport);

    // Console summary
    console.log('📋 FRONTEND TEST SUMMARY:');
    console.log('========================');
    console.log(`Components Analyzed: ${report.summary.componentsAnalyzed}`);
    console.log(`Structure Issues: ${report.summary.structureIssues}`);
    console.log(`Logic Issues: ${report.summary.logicIssues}`);
    console.log(`Accessibility Score: ${report.summary.avgAccessibilityScore}%`);
    console.log(`Performance Score: ${report.summary.avgPerformanceScore}%`);
    console.log(`\nReports saved: ${filename}, ${htmlFilename}\n`);

    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('🔧 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.recommendation}`);
      });
    }

    console.log('\n✅ Frontend analysis complete!\n');
    return report;
  }

  generateSummary() {
    const summary = {
      componentsAnalyzed: Object.keys(this.componentPaths).length,
      structureIssues: this.testResults.structure.filter(r => r.status === 'FAIL').length,
      logicIssues: this.testResults.validation.reduce((acc, r) => 
        acc + (r.details?.issues?.length || 0), 0),
      avgAccessibilityScore: 0,
      avgPerformanceScore: 0
    };

    // Calculate average accessibility score
    const accessibilityScores = this.testResults.accessibility
      .map(r => r.details?.score || 0)
      .filter(score => score > 0);
    
    if (accessibilityScores.length > 0) {
      summary.avgAccessibilityScore = Math.round(
        accessibilityScores.reduce((a, b) => a + b, 0) / accessibilityScores.length
      );
    }

    // Calculate average performance score
    const performanceScores = this.testResults.performance
      .map(r => r.details?.score || 0)
      .filter(score => score > 0);
    
    if (performanceScores.length > 0) {
      summary.avgPerformanceScore = Math.round(
        performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length
      );
    }

    return summary;
  }

  generateRecommendations() {
    const recommendations = [];

    // Structure recommendations
    const structureFailures = this.testResults.structure.filter(r => r.status === 'FAIL');
    if (structureFailures.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Structure',
        recommendation: `${structureFailures.length} component(s) have structural issues that need attention`
      });
    }

    // Performance recommendations
    const lowPerformanceComponents = this.testResults.performance
      .filter(r => r.details?.score < 80);
    
    if (lowPerformanceComponents.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        recommendation: `${lowPerformanceComponents.length} component(s) need performance optimization`
      });
    }

    // Accessibility recommendations
    const lowAccessibilityComponents = this.testResults.accessibility
      .filter(r => r.details?.score < 80);
    
    if (lowAccessibilityComponents.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Accessibility',
        recommendation: `${lowAccessibilityComponents.length} component(s) need accessibility improvements`
      });
    }

    // Logic recommendations
    const logicIssues = this.testResults.validation
      .reduce((acc, r) => acc + (r.details?.issues?.length || 0), 0);
    
    if (logicIssues > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Logic',
        recommendation: `${logicIssues} logic issue(s) found across components`
      });
    }

    return recommendations;
  }

  generateHTMLReport(report) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MRVL Events & Brackets Frontend Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { margin: 0 0 10px 0; font-size: 2.5em; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 5px solid #667eea; }
        .stat-card h3 { margin: 0 0 15px 0; color: #333; font-size: 1.1em; }
        .stat-card .value { font-size: 2.5em; font-weight: bold; color: #667eea; margin-bottom: 5px; }
        .section { background: white; margin-bottom: 30px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .section-header { background: #f8f9fb; padding: 20px; border-bottom: 1px solid #e1e8ed; }
        .section-content { padding: 20px; }
        .component-card { background: #f8f9fb; margin: 15px 0; padding: 20px; border-radius: 8px; border-left: 4px solid #ddd; }
        .pass { border-left-color: #28a745; }
        .warning { border-left-color: #ffc107; }
        .fail { border-left-color: #dc3545; }
        .good { border-left-color: #28a745; }
        .needs-improvement { border-left-color: #ffc107; }
        .needs-optimization { border-left-color: #fd7e14; }
        .recommendations { background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 25px; border-radius: 12px; margin-bottom: 30px; }
        .rec-item { background: rgba(255,255,255,0.9); margin: 10px 0; padding: 15px; border-radius: 8px; }
        pre { background: #f8f9fa; padding: 20px; border-radius: 8px; overflow-x: auto; border: 1px solid #e9ecef; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; margin-right: 5px; }
        .badge-high { background: #dc3545; color: white; }
        .badge-medium { background: #ffc107; color: #212529; }
        .badge-low { background: #28a745; color: white; }
        .progress-bar { width: 100%; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; transition: width 0.3s ease; }
        .progress-high { background: #28a745; }
        .progress-medium { background: #ffc107; }
        .progress-low { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Frontend Test Report</h1>
            <p>MRVL Events & Brackets Components Analysis</p>
            <p>Generated: ${report.timestamp}</p>
        </div>

        <div class="summary">
            <div class="stat-card">
                <h3>Components Analyzed</h3>
                <div class="value">${report.summary.componentsAnalyzed}</div>
            </div>
            <div class="stat-card">
                <h3>Structure Issues</h3>
                <div class="value">${report.summary.structureIssues}</div>
            </div>
            <div class="stat-card">
                <h3>Accessibility Score</h3>
                <div class="value">${report.summary.avgAccessibilityScore}%</div>
                <div class="progress-bar">
                    <div class="progress-fill ${report.summary.avgAccessibilityScore >= 80 ? 'progress-high' : report.summary.avgAccessibilityScore >= 60 ? 'progress-medium' : 'progress-low'}" 
                         style="width: ${report.summary.avgAccessibilityScore}%"></div>
                </div>
            </div>
            <div class="stat-card">
                <h3>Performance Score</h3>
                <div class="value">${report.summary.avgPerformanceScore}%</div>
                <div class="progress-bar">
                    <div class="progress-fill ${report.summary.avgPerformanceScore >= 80 ? 'progress-high' : report.summary.avgPerformanceScore >= 60 ? 'progress-medium' : 'progress-low'}" 
                         style="width: ${report.summary.avgPerformanceScore}%"></div>
                </div>
            </div>
        </div>

        ${report.recommendations.length > 0 ? `
        <div class="recommendations">
            <h2>🔧 Recommendations</h2>
            ${report.recommendations.map(rec => `
                <div class="rec-item">
                    <span class="badge badge-${rec.priority.toLowerCase()}">${rec.priority}</span>
                    <strong>${rec.category}:</strong> ${rec.recommendation}
                </div>
            `).join('')}
        </div>
        ` : ''}

        ${Object.entries(report.results).map(([category, results]) => `
            <div class="section">
                <div class="section-header">
                    <h2>${category.charAt(0).toUpperCase() + category.slice(1)} Analysis</h2>
                </div>
                <div class="section-content">
                    ${results.map(result => `
                        <div class="component-card ${result.status.toLowerCase().replace('_', '-')}">
                            <h3>${result.component} - ${result.test}</h3>
                            <p><strong>Status:</strong> <span class="badge badge-${this.getStatusColor(result.status)}">${result.status}</span></p>
                            ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                            ${result.details ? `
                                <details>
                                    <summary>View Details</summary>
                                    <pre>${JSON.stringify(result.details, null, 2)}</pre>
                                </details>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('')}

        <div class="section">
            <div class="section-header">
                <h2>Raw Test Data</h2>
            </div>
            <div class="section-content">
                <pre>${JSON.stringify(report.results, null, 2)}</pre>
            </div>
        </div>
    </div>

    <script>
        // Add interactive features
        document.querySelectorAll('details').forEach(detail => {
            detail.addEventListener('toggle', function() {
                if (this.open) {
                    this.style.background = '#f8f9fa';
                } else {
                    this.style.background = 'transparent';
                }
            });
        });
    </script>
</body>
</html>`;
  }

  getStatusColor(status) {
    switch (status.toLowerCase()) {
      case 'pass':
      case 'good':
        return 'high';
      case 'warning':
      case 'needs-improvement':
      case 'needs-optimization':
        return 'medium';
      case 'fail':
        return 'high';
      default:
        return 'medium';
    }
  }
}

// Run the frontend test suite
const frontendTest = new FrontendTestSuite();
frontendTest.init().catch(console.error);