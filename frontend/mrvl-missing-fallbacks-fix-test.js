/**
 * MRVL MISSING FALLBACKS TARGETED FIX TEST
 * 
 * This test identifies specific components missing image fallbacks
 * and provides exact fixes to implement question mark placeholders
 */

const fs = require('fs');
const path = require('path');

class MRVLMissingFallbacksFixer {
  constructor() {
    this.srcPath = '/var/www/mrvl-frontend/frontend/src';
    this.fixes = [];
    this.testResults = {
      componentsAnalyzed: 0,
      fallbacksNeeded: 0,
      fallbacksImplemented: 0,
      criticalIssues: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  /**
   * Analyze a component for missing image fallbacks
   */
  analyzeComponentFallbacks(filePath, content) {
    const analysis = {
      path: filePath,
      name: path.basename(filePath),
      images: [],
      missingFallbacks: [],
      hasOnErrorHandlers: false,
      hasGetImageUrlCalls: false,
      needsFixes: false
    };

    // Find all image elements
    const imagePatterns = [
      { pattern: /<img[^>]*src=/gi, tag: 'img' },
      { pattern: /<Image[^>]*src=/gi, tag: 'Image' }
    ];

    for (const { pattern, tag } of imagePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const imageMatch = match[0];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        // Check if this image has onError handler
        const hasOnError = imageMatch.includes('onError') || 
          content.slice(match.index, match.index + 500).includes('onError');
        
        analysis.images.push({
          tag,
          match: imageMatch,
          line: lineNumber,
          hasOnError,
          context: content.slice(Math.max(0, match.index - 100), match.index + 200)
        });

        if (!hasOnError) {
          analysis.missingFallbacks.push({
            tag,
            line: lineNumber,
            match: imageMatch
          });
          analysis.needsFixes = true;
        }
      }
    }

    // Check for existing patterns
    analysis.hasOnErrorHandlers = content.includes('onError');
    analysis.hasGetImageUrlCalls = content.includes('getImageUrl');

    this.testResults.componentsAnalyzed++;
    if (analysis.needsFixes) {
      this.testResults.fallbacksNeeded += analysis.missingFallbacks.length;
    }

    return analysis;
  }

  /**
   * Generate fix for a specific missing fallback
   */
  generateImageFallbackFix(analysis, missingFallback) {
    const { tag, line, match } = missingFallback;
    
    // Determine appropriate fallback type based on context
    let fallbackType = 'general';
    const context = match.toLowerCase();
    
    if (context.includes('avatar') || context.includes('player') || context.includes('user')) {
      fallbackType = 'player-avatar';
    } else if (context.includes('team') || context.includes('logo')) {
      fallbackType = 'team-logo';
    } else if (context.includes('event') || context.includes('tournament') || context.includes('banner')) {
      fallbackType = 'event-banner';
    } else if (context.includes('news') || context.includes('featured')) {
      fallbackType = 'news-featured';
    }

    // Generate the onError handler
    const onErrorHandler = tag === 'Image' ? 
      `onError={(e) => {\n                  (e.target as HTMLImageElement).src = getImageUrl(null, '${fallbackType}');\n                }}` :
      `onError={(e) => {\n                  e.target.src = getImageUrl(null, '${fallbackType}');\n                }}`;

    return {
      component: analysis.name,
      path: analysis.path,
      line: line,
      fallbackType: fallbackType,
      originalTag: match,
      fix: onErrorHandler,
      needsImport: !analysis.hasGetImageUrlCalls
    };
  }

  /**
   * Test specific high-priority components
   */
  async testHighPriorityComponents() {
    const highPriorityComponents = [
      '/app/components/EventCard.tsx',
      '/app/components/MatchCard.tsx', 
      '/app/components/NewsCard.tsx',
      '/app/components/ForumCategoryCard.tsx',
      '/app/components/Header.tsx',
      '/app/components/PostCard.tsx',
      '/components/common/UserAvatar.js',
      '/components/MatchCard.js',
      '/components/EventCard.js',
      '/components/pages/HomePage.js',
      '/components/pages/EventsPage.js',
      '/components/pages/NewsPage.js',
      '/components/mobile/MobileMatchCard.js',
      '/components/mobile/MobileTeamCard.js',
      '/components/admin/AdminDashboard.js'
    ];

    this.log('Testing high-priority components for missing fallbacks...');

    for (const componentPath of highPriorityComponents) {
      const fullPath = path.join(this.srcPath, componentPath.substring(1));
      
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf8');
          const analysis = this.analyzeComponentFallbacks(fullPath, content);
          
          if (analysis.needsFixes) {
            this.log(`⚠️ ${analysis.name} needs ${analysis.missingFallbacks.length} fallback fixes`, 'warning');
            
            for (const missingFallback of analysis.missingFallbacks) {
              const fix = this.generateImageFallbackFix(analysis, missingFallback);
              this.fixes.push(fix);
            }
          } else if (analysis.images.length > 0) {
            this.log(`✅ ${analysis.name} has proper fallbacks`, 'success');
            this.testResults.fallbacksImplemented += analysis.images.length;
          }
        } catch (error) {
          this.log(`Error testing ${componentPath}: ${error.message}`, 'error');
        }
      } else {
        this.log(`Component not found: ${componentPath}`, 'warning');
      }
    }
  }

  /**
   * Test all components in mobile directory
   */
  async testMobileComponents() {
    this.log('Testing mobile components...');
    
    const mobileDir = path.join(this.srcPath, 'components/mobile');
    if (!fs.existsSync(mobileDir)) {
      this.log('Mobile directory not found', 'warning');
      return;
    }

    const mobileFiles = fs.readdirSync(mobileDir);
    
    for (const file of mobileFiles) {
      if (file.match(/\.(js|jsx|ts|tsx)$/)) {
        const filePath = path.join(mobileDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const analysis = this.analyzeComponentFallbacks(filePath, content);
          
          if (analysis.needsFixes) {
            this.testResults.criticalIssues.push({
              type: 'mobile',
              component: analysis.name,
              issues: analysis.missingFallbacks.length
            });
            
            for (const missingFallback of analysis.missingFallbacks) {
              const fix = this.generateImageFallbackFix(analysis, missingFallback);
              fix.priority = 'MOBILE';
              this.fixes.push(fix);
            }
          }
        } catch (error) {
          this.log(`Error testing mobile component ${file}: ${error.message}`, 'error');
        }
      }
    }
  }

  /**
   * Test all components in admin directory
   */
  async testAdminComponents() {
    this.log('Testing admin components...');
    
    const adminDir = path.join(this.srcPath, 'components/admin');
    if (!fs.existsSync(adminDir)) {
      this.log('Admin directory not found', 'warning');
      return;
    }

    const findAdminFiles = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          findAdminFiles(filePath);
        } else if (file.name.match(/\.(js|jsx|ts|tsx)$/)) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            const analysis = this.analyzeComponentFallbacks(filePath, content);
            
            if (analysis.needsFixes) {
              this.testResults.criticalIssues.push({
                type: 'admin',
                component: analysis.name,
                issues: analysis.missingFallbacks.length
              });
              
              for (const missingFallback of analysis.missingFallbacks) {
                const fix = this.generateImageFallbackFix(analysis, missingFallback);
                fix.priority = 'ADMIN';
                this.fixes.push(fix);
              }
            }
          } catch (error) {
            this.log(`Error testing admin component ${file.name}: ${error.message}`, 'error');
          }
        }
      }
    };
    
    findAdminFiles(adminDir);
  }

  /**
   * Generate implementation report
   */
  generateImplementationReport() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.testResults,
      totalFixesNeeded: this.fixes.length,
      fixesByType: {},
      fixesByComponent: {},
      implementationPlan: []
    };

    // Group fixes by type and component
    for (const fix of this.fixes) {
      report.fixesByType[fix.fallbackType] = (report.fixesByType[fix.fallbackType] || 0) + 1;
      report.fixesByComponent[fix.component] = (report.fixesByComponent[fix.component] || 0) + 1;
    }

    // Generate implementation plan
    const componentGroups = {};
    for (const fix of this.fixes) {
      if (!componentGroups[fix.component]) {
        componentGroups[fix.component] = [];
      }
      componentGroups[fix.component].push(fix);
    }

    for (const [component, fixes] of Object.entries(componentGroups)) {
      const needsImport = fixes.some(f => f.needsImport);
      
      report.implementationPlan.push({
        component: component,
        path: fixes[0].path,
        priority: fixes[0].priority || 'STANDARD',
        fixesCount: fixes.length,
        needsImport: needsImport,
        fixes: fixes.map(f => ({
          line: f.line,
          type: f.fallbackType,
          handler: f.fix
        }))
      });
    }

    // Sort by priority
    report.implementationPlan.sort((a, b) => {
      const priorityOrder = { 'MOBILE': 1, 'ADMIN': 2, 'STANDARD': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Save report
    const reportPath = `/var/www/mrvl-frontend/frontend/MRVL_MISSING_FALLBACKS_FIX_PLAN_${timestamp}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Generate implementation instructions
    const instructionsPath = `/var/www/mrvl-frontend/frontend/FALLBACK_IMPLEMENTATION_INSTRUCTIONS.md`;
    const instructions = this.generateImplementationInstructions(report);
    fs.writeFileSync(instructionsPath, instructions);

    return {
      reportPath,
      instructionsPath,
      summary: report.summary,
      totalFixes: report.totalFixesNeeded
    };
  }

  /**
   * Generate implementation instructions
   */
  generateImplementationInstructions(report) {
    const instructions = `# MRVL Image Fallback Implementation Plan

## Summary
- **Components Analyzed**: ${report.summary.componentsAnalyzed}
- **Fallbacks Needed**: ${report.summary.fallbacksNeeded}
- **Total Fixes Required**: ${report.totalFixesNeeded}

## Critical Issues
${report.summary.criticalIssues.map(issue => 
  `- **${issue.type.toUpperCase()}**: ${issue.component} needs ${issue.issues} fallback fixes`
).join('\\n')}

## Implementation Priority

### HIGH PRIORITY - Mobile Components
${report.implementationPlan
  .filter(plan => plan.priority === 'MOBILE')
  .map(plan => `
#### ${plan.component}
- **Path**: \`${plan.path}\`
- **Fixes Needed**: ${plan.fixesCount}
- **Import Required**: ${plan.needsImport ? 'Yes - Add: import { getImageUrl } from "../../utils/imageUtils";' : 'No'}

**Fixes:**
${plan.fixes.map(fix => `- Line ${fix.line}: Add \`${fix.type}\` fallback handler`).join('\\n')}
`).join('')}

### HIGH PRIORITY - Admin Components  
${report.implementationPlan
  .filter(plan => plan.priority === 'ADMIN')
  .map(plan => `
#### ${plan.component}
- **Path**: \`${plan.path}\`
- **Fixes Needed**: ${plan.fixesCount}
- **Import Required**: ${plan.needsImport ? 'Yes - Add: import { getImageUrl } from "../../utils/imageUtils";' : 'No'}

**Fixes:**
${plan.fixes.map(fix => `- Line ${fix.line}: Add \`${fix.type}\` fallback handler`).join('\\n')}
`).join('')}

### STANDARD PRIORITY - General Components
${report.implementationPlan
  .filter(plan => plan.priority === 'STANDARD')
  .map(plan => `
#### ${plan.component}
- **Path**: \`${plan.path}\`  
- **Fixes Needed**: ${plan.fixesCount}
- **Import Required**: ${plan.needsImport ? 'Yes - Add: import { getImageUrl } from "../../utils/imageUtils";' : 'No'}

**Fixes:**
${plan.fixes.map(fix => `- Line ${fix.line}: Add \`${fix.type}\` fallback handler`).join('\\n')}
`).join('')}

## Fallback Type Distribution
${Object.entries(report.fixesByType).map(([type, count]) => 
  `- **${type}**: ${count} components`
).join('\\n')}

## Standard Fallback Handlers

### For Regular img elements:
\`\`\`javascript
onError={(e) => {
  e.target.src = getImageUrl(null, 'FALLBACK_TYPE');
}}
\`\`\`

### For Next.js Image components:
\`\`\`typescript
onError={(e) => {
  (e.target as HTMLImageElement).src = getImageUrl(null, 'FALLBACK_TYPE');
}}
\`\`\`

### Fallback Types:
- \`'player-avatar'\` - For player/user avatars
- \`'team-logo'\` - For team logos and flags
- \`'event-banner'\` - For event/tournament images  
- \`'news-featured'\` - For news article images
- \`'general'\` - For other images

## Testing After Implementation

Run this command to verify all fallbacks work:
\`\`\`bash
node mrvl-image-fallback-comprehensive-test.js
\`\`\`

Target: **100% fallback coverage** across all components.

---
*Generated by MRVL Missing Fallbacks Fix Test on ${report.timestamp}*
`;

    return instructions;
  }

  /**
   * Run complete missing fallbacks analysis
   */
  async runAnalysis() {
    this.log('🚀 Starting MRVL Missing Fallbacks Analysis', 'info');
    this.log('='.repeat(60));

    try {
      // Test high priority components first
      await this.testHighPriorityComponents();
      
      // Test mobile components
      await this.testMobileComponents();
      
      // Test admin components
      await this.testAdminComponents();
      
      // Generate implementation report
      const result = this.generateImplementationReport();
      
      this.log('✅ Analysis completed successfully!', 'success');
      this.log(`📄 Fix plan: ${result.reportPath}`, 'success');
      this.log(`📋 Instructions: ${result.instructionsPath}`, 'success');
      
      return result;
      
    } catch (error) {
      this.log(`❌ Analysis failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MRVLMissingFallbacksFixer;
}

// Run the analysis if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  const fixer = new MRVLMissingFallbacksFixer();
  
  fixer.runAnalysis()
    .then((result) => {
      console.log('\\n🎉 Analysis completed!');
      console.log('\\n📋 Summary:');
      console.log(`- Components analyzed: ${result.summary.componentsAnalyzed}`);
      console.log(`- Fallbacks needed: ${result.summary.fallbacksNeeded}`);
      console.log(`- Total fixes required: ${result.totalFixes}`);
      console.log(`\\n📄 Implementation plan: ${result.reportPath}`);
      console.log(`📋 Step-by-step instructions: ${result.instructionsPath}`);
    })
    .catch((error) => {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    });
}