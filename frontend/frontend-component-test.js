#!/usr/bin/env node

/**
 * Frontend Component Analysis Test
 * Analyzes JavaScript/React components for potential issues without running in browser
 */

const fs = require('fs');
const path = require('path');

class FrontendTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            issues: [],
            summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
        };
    }

    log(message, type = 'info') {
        const icons = { error: '❌', warning: '⚠️', success: '✅', info: 'ℹ️' };
        console.log(`${icons[type]} ${message}`);
    }

    addTest(name, passed, details) {
        this.results.tests.push({ name, passed, details });
        this.results.summary.total++;
        if (passed) {
            this.results.summary.passed++;
            this.log(`${name}: ${details}`, 'success');
        } else {
            this.results.summary.failed++;
            this.log(`${name}: ${details}`, 'error');
        }
    }

    addWarning(message) {
        this.results.issues.push({ type: 'warning', message });
        this.results.summary.warnings++;
        this.log(message, 'warning');
    }

    analyzeFile(filepath, filename) {
        try {
            const content = fs.readFileSync(filepath, 'utf8');
            this.log(`Analyzing ${filename}...`, 'info');
            
            // Test 1: Check for "a.map is not a function" potential issues
            const mapUsagePattern = /(?:\.map\(|\.filter\(|\.reduce\()/g;
            const mapUsages = content.match(mapUsagePattern);
            if (mapUsages) {
                // Check if there are proper Array.isArray checks before map operations
                const hasArrayCheck = content.includes('Array.isArray(') || 
                                    content.includes('isArray(') ||
                                    content.includes('&& typeof') ||
                                    content.includes('|| []');
                
                this.addTest(`${filename} - Array Safety Checks`, hasArrayCheck, 
                    hasArrayCheck ? `Found ${mapUsages.length} array operations with safety checks` : 
                    `Found ${mapUsages.length} array operations but no safety checks - potential "a.map is not a function" errors`);
            }
            
            // Test 2: Check for proper error handling in async functions
            const asyncFunctionPattern = /async\s+(?:function\s+\w+|\w+\s*=|\(\s*\)|[^=]*=>)/g;
            const asyncFunctions = content.match(asyncFunctionPattern) || [];
            const tryBlocks = (content.match(/try\s*{/g) || []).length;
            const catchBlocks = (content.match(/catch\s*\(/g) || []).length;
            
            if (asyncFunctions.length > 0) {
                const hasProperErrorHandling = tryBlocks >= asyncFunctions.length * 0.5; // At least 50% coverage
                this.addTest(`${filename} - Async Error Handling`, hasProperErrorHandling,
                    `${asyncFunctions.length} async functions, ${tryBlocks} try blocks, ${catchBlocks} catch blocks`);
            }
            
            // Test 3: Check for potential null/undefined access issues
            const nullCheckPattern = /(?:\?\.|&&|\|\||if\s*\(.*(?:null|undefined))/g;
            const propertyAccess = content.match(/\w+\.\w+/g) || [];
            const nullChecks = content.match(nullCheckPattern) || [];
            
            if (propertyAccess.length > 10) { // Only check files with significant property access
                const hasNullSafety = nullChecks.length >= propertyAccess.length * 0.1; // 10% ratio
                this.addTest(`${filename} - Null Safety`, hasNullSafety,
                    `${propertyAccess.length} property accesses, ${nullChecks.length} safety checks`);
            }
            
            // Test 4: Check for console.error in catch blocks (good error reporting)
            const consoleErrors = (content.match(/console\.error/g) || []).length;
            const consoleLogs = (content.match(/console\.log/g) || []).length;
            
            if (catchBlocks > 0) {
                const hasErrorLogging = consoleErrors >= catchBlocks * 0.5; // 50% of catch blocks log errors
                this.addTest(`${filename} - Error Logging`, hasErrorLogging,
                    `${consoleErrors} console.error calls, ${catchBlocks} catch blocks`);
            }
            
            // Test 5: Check for potential memory leaks in useEffect
            const useEffectPattern = /useEffect\s*\(/g;
            const useEffects = content.match(useEffectPattern) || [];
            const cleanupPattern = /return\s*\(\s*\)\s*=>/g;
            const cleanups = content.match(cleanupPattern) || [];
            
            if (useEffects.length > 2) {
                // This is a loose check - not all useEffects need cleanup
                this.addWarning(`${filename} has ${useEffects.length} useEffect calls - ensure cleanup where needed`);
            }
            
            // Test 6: Check for hardcoded URLs vs using config
            const hardcodedUrlPattern = /https?:\/\/(?!localhost|127\.0\.0\.1)[^\s"'`]+/g;
            const hardcodedUrls = content.match(hardcodedUrlPattern) || [];
            const usesConfig = content.includes('API_CONFIG') || content.includes('BASE_URL') || content.includes('config');
            
            if (hardcodedUrls.length > 0 && !usesConfig) {
                this.addWarning(`${filename} contains hardcoded URLs: ${hardcodedUrls.slice(0, 2).join(', ')}${hardcodedUrls.length > 2 ? '...' : ''}`);
            }
            
            // Test 7: Check for team logo fallback handling
            if (filename.includes('Profile')) {
                const hasTeamLogoHandling = content.includes('getImageUrl') && 
                                         content.includes('team-logo') &&
                                         (content.includes('onError') || content.includes('fallback'));
                
                this.addTest(`${filename} - Team Logo Fallback`, hasTeamLogoHandling,
                    hasTeamLogoHandling ? 'Has proper team logo fallback handling' : 'Missing team logo fallback handling');
            }
            
            // Test 8: Check for hero image fallback handling
            if (filename.includes('Profile') || filename.includes('Hero')) {
                const hasHeroImageHandling = content.includes('HeroImage') || 
                                          (content.includes('getHeroImage') && content.includes('fallback'));
                
                this.addTest(`${filename} - Hero Image Fallback`, hasHeroImageHandling,
                    hasHeroImageHandling ? 'Has hero image handling' : 'Missing hero image handling');
            }
            
            return true;
            
        } catch (error) {
            this.addTest(`${filename} - File Analysis`, false, `Failed to read file: ${error.message}`);
            return false;
        }
    }

    async runTests() {
        this.log('🚀 Starting Frontend Component Analysis', 'info');
        
        const componentsToTest = [
            'src/components/pages/SimpleUserProfile.js',
            'src/components/pages/ComprehensiveUserProfile.js',
            'src/utils/imageUtils.js'
        ];
        
        for (const componentPath of componentsToTest) {
            const fullPath = path.join(__dirname, componentPath);
            const filename = path.basename(componentPath);
            
            if (fs.existsSync(fullPath)) {
                this.analyzeFile(fullPath, filename);
            } else {
                this.addTest(`${filename} - File Exists`, false, `File not found: ${componentPath}`);
            }
        }
        
        // Summary
        const successRate = ((this.results.summary.passed / this.results.summary.total) * 100).toFixed(1);
        
        this.log('\n📊 Frontend Analysis Results:', 'info');
        this.log(`Total Tests: ${this.results.summary.total}`, 'info');
        this.log(`Passed: ${this.results.summary.passed}`, 'success');
        this.log(`Failed: ${this.results.summary.failed}`, this.results.summary.failed > 0 ? 'error' : 'info');
        this.log(`Warnings: ${this.results.summary.warnings}`, this.results.summary.warnings > 0 ? 'warning' : 'info');
        this.log(`Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning');
        
        return this.results;
    }

    saveResults() {
        const filename = `frontend-analysis-${Date.now()}.json`;
        fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
        this.log(`Results saved to ${filename}`, 'info');
    }
}

async function main() {
    const tester = new FrontendTester();
    try {
        const results = await tester.runTests();
        tester.saveResults();
        process.exit(results.summary.failed === 0 ? 0 : 1);
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = FrontendTester;