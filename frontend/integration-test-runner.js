/**
 * INTEGRATION TEST RUNNER
 * Comprehensive testing of all recently implemented systems
 * Focus: Component analysis, code validation, and integration checks
 */

const fs = require('fs');
const path = require('path');

class IntegrationTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      componentTests: [],
      integrationTests: [],
      codeValidationTests: [],
      warnings: [],
      errors: [],
      summary: {}
    };
    this.srcPath = './src';
  }

  async runAllTests() {
    console.log('🔍 INTEGRATION TEST RUNNER');
    console.log('===========================');
    
    try {
      // Test 1: Component Structure Analysis
      await this.testComponentStructure();
      
      // Test 2: Live Scoring System Integration
      await this.testLiveScoringIntegration();
      
      // Test 3: Match Detail Page Integration
      await this.testMatchDetailIntegration();
      
      // Test 4: Data Flow Validation
      await this.testDataFlowValidation();
      
      // Test 5: Import/Export Consistency
      await this.testImportExportConsistency();
      
      // Test 6: Props Interface Validation
      await this.testPropsInterfaceValidation();
      
      this.generateIntegrationReport();
      
    } catch (error) {
      this.results.errors.push({
        type: 'Critical Test Runner Error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
      console.error('❌ Critical test runner error:', error.message);
    }
  }

  async testComponentStructure() {
    console.log('\n🏗️ Testing Component Structure...');
    
    try {
      const criticalComponents = [
        'src/components/admin/ComprehensiveLiveScoring.js',
        'src/components/pages/MatchDetailPage.js',
        'src/components/admin/MatchForm.js',
        'src/components/MatchCard.js'
      ];
      
      let foundComponents = 0;
      let missingComponents = [];
      
      for (const componentPath of criticalComponents) {
        if (fs.existsSync(componentPath)) {
          foundComponents++;
          
          // Analyze component structure
          const content = fs.readFileSync(componentPath, 'utf8');
          const analysis = this.analyzeComponent(content, componentPath);
          
          this.results.componentTests.push({
            component: componentPath,
            status: 'FOUND',
            analysis: analysis
          });
          
        } else {
          missingComponents.push(componentPath);
        }
      }
      
      console.log(`   ✅ Found ${foundComponents}/${criticalComponents.length} critical components`);
      
      if (missingComponents.length > 0) {
        this.results.warnings.push({
          type: 'Missing Components',
          message: `${missingComponents.length} critical components not found`,
          details: missingComponents,
          severity: 'high'
        });
        console.log(`   ⚠️  Missing components: ${missingComponents.join(', ')}`);
      }
      
    } catch (error) {
      this.results.componentTests.push({
        test: 'Component Structure',
        status: 'FAILED',
        error: error.message
      });
    }
  }

  analyzeComponent(content, filePath) {
    const analysis = {
      linesOfCode: content.split('\n').length,
      hasUseState: content.includes('useState'),
      hasUseEffect: content.includes('useEffect'),
      hasUseCallback: content.includes('useCallback'),
      hasAPI: content.includes('api.') || content.includes('fetch') || content.includes('axios'),
      hasErrorHandling: content.includes('try') || content.includes('catch'),
      hasConsoleLog: content.includes('console.log'),
      hasAuth: content.includes('useAuth'),
      exports: [],
      imports: [],
      keyFeatures: []
    };
    
    // Extract imports
    const importMatches = content.match(/import.*from.*['"`].*['"`]/g) || [];
    analysis.imports = importMatches.length;
    
    // Extract exports
    const exportMatches = content.match(/export.*{.*}|export default/g) || [];
    analysis.exports = exportMatches.length;
    
    // Detect key features based on component type
    if (filePath.includes('LiveScoring')) {
      analysis.keyFeatures.push({
        feature: 'Live Scoring Component',
        hasHeroRoster: content.includes('hero') && (content.includes('roster') || content.includes('slot')),
        hasPlayerStats: content.includes('kills') || content.includes('deaths') || content.includes('assists'),
        hasTeamVictory: content.includes('victory') || content.includes('win'),
        hasAutoSave: content.includes('auto') && content.includes('save'),
        hasRealTimeSync: content.includes('sync') || content.includes('live') || content.includes('update')
      });
    }
    
    if (filePath.includes('MatchDetail')) {
      analysis.keyFeatures.push({
        feature: 'Match Detail Component',
        hasMatchDisplay: content.includes('match') && content.includes('detail'),
        hasScoreSync: content.includes('score') && content.includes('update'),
        hasLiveScoringIntegration: content.includes('LiveScoring') || content.includes('live-scoring'),
        hasSSE: content.includes('EventSource') || content.includes('SSE'),
        hasComments: content.includes('comment')
      });
    }
    
    return analysis;
  }

  async testLiveScoringIntegration() {
    console.log('\n📊 Testing Live Scoring System Integration...');
    
    try {
      const liveScoringPath = 'src/components/admin/ComprehensiveLiveScoring.js';
      
      if (!fs.existsSync(liveScoringPath)) {
        throw new Error('ComprehensiveLiveScoring.js not found');
      }
      
      const content = fs.readFileSync(liveScoringPath, 'utf8');
      
      // Check for critical live scoring features
      const features = {
        heroRosterDisplay: content.includes('hero') && (content.includes('roster') || content.includes('slot')),
        playerStatsEditing: (content.includes('kills') || content.includes('K')) && 
                           (content.includes('deaths') || content.includes('D')) && 
                           (content.includes('assists') || content.includes('A')),
        kdaCalculation: content.includes('KDA') || content.includes('kda'),
        teamVictoryButtons: content.includes('victory') || content.includes('win'),
        autoSave: content.includes('auto') && content.includes('save'),
        realTimeSync: content.includes('sync') || content.includes('live') || 
                     content.includes('update') || content.includes('real-time'),
        keyboardShortcuts: content.includes('key') && content.includes('shortcut') || 
                          content.includes('keypress') || content.includes('keydown')
      };
      
      const implementedFeatures = Object.values(features).filter(f => f).length;
      const totalFeatures = Object.keys(features).length;
      
      this.results.integrationTests.push({
        test: 'Live Scoring System Features',
        status: 'COMPLETED',
        details: {
          implementedFeatures: implementedFeatures,
          totalFeatures: totalFeatures,
          featureCompleteness: `${((implementedFeatures / totalFeatures) * 100).toFixed(1)}%`,
          features: features
        }
      });
      
      console.log(`   ✅ Live Scoring Features: ${implementedFeatures}/${totalFeatures} (${((implementedFeatures / totalFeatures) * 100).toFixed(1)}%)`);
      
      // Check for specific integrations
      if (!content.includes('MatchDetailPage') && !content.includes('match-detail')) {
        this.results.warnings.push({
          type: 'Integration Missing',
          message: 'Live Scoring may not be integrated with MatchDetailPage',
          severity: 'medium'
        });
      }
      
    } catch (error) {
      this.results.integrationTests.push({
        test: 'Live Scoring Integration',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Live scoring integration test failed: ${error.message}`);
    }
  }

  async testMatchDetailIntegration() {
    console.log('\n🎮 Testing Match Detail Page Integration...');
    
    try {
      const matchDetailPath = 'src/components/pages/MatchDetailPage.js';
      
      if (!fs.existsSync(matchDetailPath)) {
        throw new Error('MatchDetailPage.js not found');
      }
      
      const content = fs.readFileSync(matchDetailPath, 'utf8');
      
      // Check for critical match detail features
      const features = {
        scoreSynchronization: content.includes('score') && content.includes('sync') || 
                             content.includes('handleMatchUpdate'),
        liveScoringIntegration: content.includes('LiveScoring') || content.includes('live-scoring'),
        realTimeUpdates: content.includes('EventSource') || content.includes('SSE') || 
                        content.includes('live-update'),
        urlDisplay: content.includes('url') && (content.includes('button') || content.includes('link')),
        playerNameDisplay: content.includes('player') && content.includes('name'),
        teamLogoDisplay: content.includes('team') && content.includes('logo'),
        heroImageDisplay: content.includes('hero') && content.includes('image'),
        commentSystem: content.includes('comment')
      };
      
      const implementedFeatures = Object.values(features).filter(f => f).length;
      const totalFeatures = Object.keys(features).length;
      
      this.results.integrationTests.push({
        test: 'Match Detail Page Features',
        status: 'COMPLETED',
        details: {
          implementedFeatures: implementedFeatures,
          totalFeatures: totalFeatures,
          featureCompleteness: `${((implementedFeatures / totalFeatures) * 100).toFixed(1)}%`,
          features: features
        }
      });
      
      console.log(`   ✅ Match Detail Features: ${implementedFeatures}/${totalFeatures} (${((implementedFeatures / totalFeatures) * 100).toFixed(1)}%)`);
      
    } catch (error) {
      this.results.integrationTests.push({
        test: 'Match Detail Integration',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Match detail integration test failed: ${error.message}`);
    }
  }

  async testDataFlowValidation() {
    console.log('\n🔄 Testing Data Flow Validation...');
    
    try {
      // Check for proper data flow patterns
      const componentsToCheck = [
        'src/components/admin/ComprehensiveLiveScoring.js',
        'src/components/pages/MatchDetailPage.js',
        'src/components/MatchCard.js',
        'src/components/admin/MatchForm.js'
      ];
      
      let dataFlowIssues = [];
      let propsPassing = 0;
      let stateManagement = 0;
      
      for (const componentPath of componentsToCheck) {
        if (fs.existsSync(componentPath)) {
          const content = fs.readFileSync(componentPath, 'utf8');
          
          // Check for props passing
          if (content.includes('props.') || content.includes('{ ') && content.includes(' }')) {
            propsPassing++;
          }
          
          // Check for state management
          if (content.includes('useState') || content.includes('setState')) {
            stateManagement++;
          }
          
          // Check for potential data flow issues
          if (content.includes('props.') && !content.includes('PropTypes')) {
            dataFlowIssues.push({
              component: componentPath,
              issue: 'Missing PropTypes validation'
            });
          }
          
          if (content.includes('useState') && !content.includes('useCallback')) {
            const functionCount = (content.match(/const \w+ = \(/g) || []).length;
            if (functionCount > 3) {
              dataFlowIssues.push({
                component: componentPath,
                issue: 'Many functions without useCallback optimization'
              });
            }
          }
        }
      }
      
      this.results.integrationTests.push({
        test: 'Data Flow Validation',
        status: 'COMPLETED',
        details: {
          componentsChecked: componentsToCheck.length,
          propsPassing: propsPassing,
          stateManagement: stateManagement,
          dataFlowIssues: dataFlowIssues.length
        }
      });
      
      console.log(`   ✅ Data Flow: ${propsPassing} components with props, ${stateManagement} with state management`);
      
      if (dataFlowIssues.length > 0) {
        this.results.warnings.push({
          type: 'Data Flow Issues',
          message: `${dataFlowIssues.length} potential data flow optimization opportunities`,
          details: dataFlowIssues,
          severity: 'low'
        });
      }
      
    } catch (error) {
      this.results.integrationTests.push({
        test: 'Data Flow Validation',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Data flow validation failed: ${error.message}`);
    }
  }

  async testImportExportConsistency() {
    console.log('\n📦 Testing Import/Export Consistency...');
    
    try {
      const componentsDir = 'src/components';
      const components = this.getAllJSFiles(componentsDir);
      
      let importIssues = [];
      let exportIssues = [];
      
      for (const component of components) {
        const content = fs.readFileSync(component, 'utf8');
        
        // Check for common import issues
        if (content.includes("import React from 'react'") && !content.includes('React.')) {
          // Using React import but not accessing React directly
          const hasJSX = content.includes('<') && content.includes('>');
          if (!hasJSX) {
            importIssues.push({
              file: component,
              issue: 'Unused React import'
            });
          }
        }
        
        // Check for missing exports
        if (!content.includes('export default') && !content.includes('export {')) {
          exportIssues.push({
            file: component,
            issue: 'No exports found'
          });
        }
        
        // Check for relative import paths
        const relativeImports = content.match(/import.*from\s+['"]\.\.?\//g);
        if (relativeImports && relativeImports.length > 5) {
          importIssues.push({
            file: component,
            issue: `Many relative imports (${relativeImports.length})`
          });
        }
      }
      
      this.results.codeValidationTests.push({
        test: 'Import/Export Consistency',
        status: 'COMPLETED',
        details: {
          componentsChecked: components.length,
          importIssues: importIssues.length,
          exportIssues: exportIssues.length
        }
      });
      
      console.log(`   ✅ Import/Export: ${components.length} components checked, ${importIssues.length} import issues, ${exportIssues.length} export issues`);
      
    } catch (error) {
      this.results.codeValidationTests.push({
        test: 'Import/Export Consistency',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Import/export validation failed: ${error.message}`);
    }
  }

  async testPropsInterfaceValidation() {
    console.log('\n🔌 Testing Props Interface Validation...');
    
    try {
      const criticalComponents = [
        'src/components/admin/ComprehensiveLiveScoring.js',
        'src/components/pages/MatchDetailPage.js',
        'src/components/MatchCard.js'
      ];
      
      let propsValidation = [];
      
      for (const componentPath of criticalComponents) {
        if (fs.existsSync(componentPath)) {
          const content = fs.readFileSync(componentPath, 'utf8');
          
          // Extract component function declaration
          const functionMatch = content.match(/function\s+(\w+)\s*\(\s*{([^}]*)}/);
          const arrowMatch = content.match(/const\s+(\w+)\s*=\s*\(\s*{([^}]*)}/);
          
          let props = [];
          if (functionMatch) {
            props = functionMatch[2].split(',').map(p => p.trim());
          } else if (arrowMatch) {
            props = arrowMatch[2].split(',').map(p => p.trim());
          }
          
          propsValidation.push({
            component: componentPath,
            props: props,
            propsCount: props.length,
            hasPropsValidation: content.includes('PropTypes'),
            hasDefaultProps: content.includes('defaultProps')
          });
        }
      }
      
      this.results.codeValidationTests.push({
        test: 'Props Interface Validation',
        status: 'COMPLETED',
        details: propsValidation
      });
      
      const avgProps = propsValidation.reduce((sum, comp) => sum + comp.propsCount, 0) / propsValidation.length;
      console.log(`   ✅ Props Interface: ${propsValidation.length} components, avg ${avgProps.toFixed(1)} props per component`);
      
    } catch (error) {
      this.results.codeValidationTests.push({
        test: 'Props Interface Validation',
        status: 'FAILED',
        error: error.message
      });
      console.log(`   ❌ Props interface validation failed: ${error.message}`);
    }
  }

  getAllJSFiles(dir) {
    let files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getAllJSFiles(fullPath));
      } else if (item.endsWith('.js') || item.endsWith('.jsx')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  generateIntegrationReport() {
    const allTests = [
      ...this.results.componentTests,
      ...this.results.integrationTests,
      ...this.results.codeValidationTests
    ];
    
    const completed = allTests.filter(t => t.status === 'COMPLETED' || t.status === 'FOUND').length;
    const failed = allTests.filter(t => t.status === 'FAILED').length;
    
    this.results.summary = {
      totalTests: allTests.length,
      completed: completed,
      failed: failed,
      warnings: this.results.warnings.length,
      errors: this.results.errors.length,
      completionRate: allTests.length > 0 ? ((completed / allTests.length) * 100).toFixed(1) : '0'
    };
    
    // Save comprehensive report
    const reportPath = '/var/www/mrvl-frontend/frontend/INTEGRATION_TEST_REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    console.log('\n📊 INTEGRATION TEST SUMMARY');
    console.log('============================');
    console.log(`Tests Completed: ${completed}/${allTests.length} (${this.results.summary.completionRate}%)`);
    console.log(`Failed Tests: ${failed}`);
    console.log(`Warnings: ${this.results.warnings.length}`);
    console.log(`Errors: ${this.results.errors.length}`);
    console.log(`\nDetailed report saved to: ${reportPath}`);
    
    // Show priority issues
    const highPriorityWarnings = this.results.warnings.filter(w => w.severity === 'high');
    if (highPriorityWarnings.length > 0) {
      console.log('\n🚨 HIGH PRIORITY ISSUES:');
      highPriorityWarnings.forEach(warning => {
        console.log(`   ${warning.type}: ${warning.message}`);
      });
    }
    
    const mediumPriorityWarnings = this.results.warnings.filter(w => w.severity === 'medium');
    if (mediumPriorityWarnings.length > 0) {
      console.log('\n⚠️  MEDIUM PRIORITY ISSUES:');
      mediumPriorityWarnings.forEach(warning => {
        console.log(`   ${warning.type}: ${warning.message}`);
      });
    }
    
    return this.results;
  }
}

// Execute integration tests
const runner = new IntegrationTestRunner();
runner.runAllTests().catch(console.error);

module.exports = IntegrationTestRunner;