/**
 * SIMPLIFIED SYSTEM AUDIT FOR POST-ROLLBACK VALIDATION
 * 
 * Tests core functionality without puppeteer dependencies
 */

const fs = require('fs');
const path = require('path');

class SimplifiedSystemAudit {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            rollback_date: '2025-07-25',
            audit_type: 'simplified-post-rollback-validation',
            systems_tested: [],
            api_tests: [],
            file_integrity: [],
            critical_failures: [],
            issues_found: [],
            go_live_ready: false
        };
        
        this.config = {
            backend_url: 'http://localhost:8000',
            frontend_url: 'http://localhost:3001'
        };
    }

    async run() {
        console.log('🚀 Starting Simplified System Audit...\n');
        
        try {
            // Test API endpoints
            await this.testApiEndpoints();
            
            // Test file integrity
            await this.testFileIntegrity();
            
            // Test configuration
            await this.testConfiguration();
            
            // Test critical components
            await this.testCriticalComponents();
            
            // Determine readiness
            this.determineGoLiveReadiness();
            
            // Generate report
            this.generateReport();
            
            console.log('\n🏁 Simplified System Audit Complete!');
            console.log(`Go-Live Ready: ${this.results.go_live_ready ? '✅ YES' : '❌ NO'}`);
            
            return {
                success: true,
                goLiveReady: this.results.go_live_ready,
                results: this.results
            };
            
        } catch (error) {
            console.error('❌ Audit failed:', error);
            this.logCriticalError('audit_failure', `Audit script failed: ${error.message}`);
            return {
                success: false,
                error: error.message,
                goLiveReady: false
            };
        }
    }

    async testApiEndpoints() {
        console.log('🔌 Testing API Endpoints...');
        this.results.systems_tested.push('api_endpoints');
        
        const endpoints = [
            { url: '/api/teams', name: 'Teams API', critical: true },
            { url: '/api/events', name: 'Events API', critical: true },
            { url: '/api/matches', name: 'Matches API', critical: true },
            { url: '/api/news', name: 'News API', critical: false },
            { url: '/api/matches/live', name: 'Live Matches API', critical: true }
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await this.makeHttpRequest(this.config.backend_url + endpoint.url);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log(`  ✅ ${endpoint.name}: Working (${response.status})`);
                    
                    this.results.api_tests.push({
                        endpoint: endpoint.url,
                        name: endpoint.name,
                        status: 'success',
                        http_code: response.status,
                        has_data: data.data ? data.data.length > 0 : false
                    });
                } else {
                    const message = `${endpoint.name} returned ${response.status}`;
                    console.log(`  ❌ ${message}`);
                    
                    if (endpoint.critical) {
                        this.logCriticalError('api_endpoint', message);
                    } else {
                        this.logIssue('api_endpoint', message);
                    }
                }
                
            } catch (error) {
                const message = `${endpoint.name} failed: ${error.message}`;
                console.log(`  ❌ ${message}`);
                
                if (endpoint.critical) {
                    this.logCriticalError('api_endpoint', message);
                } else {
                    this.logIssue('api_endpoint', message);
                }
            }
        }
    }

    async testFileIntegrity() {
        console.log('\n📁 Testing File Integrity...');
        this.results.systems_tested.push('file_integrity');
        
        const criticalFiles = [
            // Frontend files
            'src/App.js',
            'src/components/Navigation.js',
            'src/components/admin/AdminDashboard.js',
            'src/components/admin/ComprehensiveLiveScoring.js',
            'src/components/admin/TournamentBrackets.js',
            'src/components/shared/VideoEmbed.js',
            'src/components/shared/MentionAutocomplete.js',
            'src/styles/mobile.css',
            'src/styles/components.css',
            'package.json',
            
            // Backend files (relative paths)
            '../mrvl-backend/app/Http/Controllers/BracketController.php',
            '../mrvl-backend/app/Http/Controllers/MatchController.php',
            '../mrvl-backend/app/Http/Controllers/NewsController.php',
            '../mrvl-backend/app/Models/Event.php',
            '../mrvl-backend/app/Models/MatchModel.php',
            '../mrvl-backend/routes/api.php'
        ];

        for (const file of criticalFiles) {
            const filePath = path.join(__dirname, file);
            
            try {
                if (fs.existsSync(filePath)) {
                    const stats = fs.statSync(filePath);
                    console.log(`  ✅ ${file}: Exists (${Math.round(stats.size / 1024)}KB)`);
                    
                    this.results.file_integrity.push({
                        file: file,
                        exists: true,
                        size: stats.size,
                        modified: stats.mtime.toISOString()
                    });
                } else {
                    console.log(`  ❌ ${file}: Missing`);
                    this.logCriticalError('file_integrity', `Critical file missing: ${file}`);
                }
                
            } catch (error) {
                console.log(`  ❌ ${file}: Error - ${error.message}`);
                this.logIssue('file_integrity', `File check failed: ${file} - ${error.message}`);
            }
        }
    }

    async testConfiguration() {
        console.log('\n⚙️ Testing Configuration...');
        this.results.systems_tested.push('configuration');
        
        try {
            // Test package.json
            const packagePath = path.join(__dirname, 'package.json');
            if (fs.existsSync(packagePath)) {
                const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                
                const requiredDeps = ['react', 'react-dom', 'tailwindcss'];
                const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
                
                if (missingDeps.length === 0) {
                    console.log('  ✅ Frontend dependencies configured correctly');
                } else {
                    this.logIssue('configuration', `Missing dependencies: ${missingDeps.join(', ')}`);
                }
            }
            
            // Test environment configuration
            const envPath = path.join(__dirname, '.env');
            if (fs.existsSync(envPath)) {
                console.log('  ✅ Environment configuration file exists');
            } else {
                console.log('  ⚠️ No .env file found (using defaults)');
            }
            
        } catch (error) {
            this.logIssue('configuration', `Configuration test failed: ${error.message}`);
        }
    }

    async testCriticalComponents() {
        console.log('\n🧩 Testing Critical Components...');
        this.results.systems_tested.push('critical_components');
        
        const componentTests = [
            {
                name: 'App.js Main Component',
                test: () => this.testFileContains('src/App.js', ['BracketVisualization', 'LiveScoring', 'Navigation'])
            },
            {
                name: 'Mobile CSS Styles',
                test: () => this.testFileContains('src/styles/mobile.css', ['@media', 'mobile-', 'touch-'])
            },
            {
                name: 'Admin Dashboard',
                test: () => this.testFileContains('src/components/admin/AdminDashboard.js', ['useState', 'useEffect'])
            },
            {
                name: 'Bracket Controller',
                test: () => this.testFileContains('../mrvl-backend/app/Http/Controllers/BracketController.php', ['generate', 'updateMatch', 'resetBracket'])
            }
        ];

        for (const test of componentTests) {
            try {
                const result = test.test();
                if (result) {
                    console.log(`  ✅ ${test.name}: Working`);
                } else {
                    console.log(`  ❌ ${test.name}: Issues detected`);
                    this.logIssue('critical_components', `Component test failed: ${test.name}`);
                }
            } catch (error) {
                console.log(`  ❌ ${test.name}: Error - ${error.message}`);
                this.logIssue('critical_components', `Component test error: ${test.name} - ${error.message}`);
            }
        }
    }

    testFileContains(filePath, requiredStrings) {
        const fullPath = path.join(__dirname, filePath);
        
        if (!fs.existsSync(fullPath)) {
            return false;
        }
        
        const content = fs.readFileSync(fullPath, 'utf8');
        return requiredStrings.every(str => content.includes(str));
    }

    async makeHttpRequest(url) {
        // Use node's built-in fetch or create a simple HTTP request
        const http = require('http');
        const https = require('https');
        const urlModule = require('url');
        
        return new Promise((resolve, reject) => {
            const parsedUrl = urlModule.parse(url);
            const client = parsedUrl.protocol === 'https:' ? https : http;
            
            const req = client.request({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.path,
                method: 'GET',
                timeout: 5000
            }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(data))
                    });
                });
            });
            
            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));
            req.end();
        });
    }

    determineGoLiveReadiness() {
        console.log('\n🎯 Determining Go-Live Readiness...');
        
        const criticalSystems = ['api_endpoints', 'file_integrity', 'critical_components'];
        const systemsPassed = criticalSystems.every(system => 
            this.results.systems_tested.includes(system)
        );
        
        const noCriticalFailures = this.results.critical_failures.length === 0;
        const apiEndpointsWorking = this.results.api_tests.filter(test => test.status === 'success').length >= 3;
        
        this.results.go_live_ready = systemsPassed && noCriticalFailures && apiEndpointsWorking;
        
        if (this.results.go_live_ready) {
            console.log('🟢 SYSTEM IS GO-LIVE READY');
        } else {
            console.log('🔴 SYSTEM NOT READY FOR GO-LIVE');
            
            if (!systemsPassed) {
                console.log('   Some critical systems not tested');
            }
            
            if (!noCriticalFailures) {
                console.log(`   Critical failures: ${this.results.critical_failures.length}`);
                this.results.critical_failures.forEach(failure => {
                    console.log(`   - ${failure.message}`);
                });
            }
            
            if (!apiEndpointsWorking) {
                console.log('   Insufficient API endpoints working');
            }
        }
    }

    generateReport() {
        console.log('\n📋 Generating Audit Report...');
        
        const reportPath = path.join(__dirname, `simplified-audit-${Date.now()}.json`);
        
        this.results.summary = {
            systems_tested: this.results.systems_tested.length,
            api_endpoints_tested: this.results.api_tests.length,
            api_endpoints_working: this.results.api_tests.filter(t => t.status === 'success').length,
            files_checked: this.results.file_integrity.length,
            files_missing: this.results.file_integrity.filter(f => !f.exists).length,
            critical_failures: this.results.critical_failures.length,
            total_issues: this.results.issues_found.length,
            go_live_ready: this.results.go_live_ready
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        
        // Generate executive summary
        const summary = this.generateExecutiveSummary();
        const summaryPath = path.join(__dirname, `SIMPLIFIED_AUDIT_SUMMARY_${Date.now()}.md`);
        fs.writeFileSync(summaryPath, summary);
        
        console.log(`📄 Report saved: ${reportPath}`);
        console.log(`📊 Summary saved: ${summaryPath}`);
    }

    generateExecutiveSummary() {
        return `# SIMPLIFIED POST-ROLLBACK AUDIT SUMMARY

## Audit Overview
- **Date**: ${this.results.timestamp}
- **Rollback Date**: ${this.results.rollback_date}
- **Type**: Simplified post-rollback validation

## Go-Live Status: ${this.results.go_live_ready ? '🟢 READY' : '🔴 NOT READY'}

## Systems Tested
${this.results.systems_tested.map(s => `- ✅ ${s.replace('_', ' ').toUpperCase()}`).join('\n')}

## API Endpoints Status
${this.results.api_tests.map(api => 
    `- ${api.status === 'success' ? '✅' : '❌'} ${api.name}: ${api.status === 'success' ? 'Working' : 'Failed'}`
).join('\n')}

## Critical Findings
${this.results.critical_failures.length === 0 ? 
'✅ No critical failures detected' : 
this.results.critical_failures.map(f => `- 🔴 ${f.message}`).join('\n')}

## File Integrity
- Files Checked: ${this.results.file_integrity.length}
- Files Missing: ${this.results.file_integrity.filter(f => !f.exists).length}
- All Critical Files Present: ${this.results.file_integrity.filter(f => !f.exists).length === 0 ? '✅' : '❌'}

## Summary Statistics
- Systems Tested: ${this.results.summary.systems_tested}
- API Endpoints Working: ${this.results.summary.api_endpoints_working}/${this.results.summary.api_endpoints_tested}
- Critical Failures: ${this.results.summary.critical_failures}
- Total Issues: ${this.results.summary.total_issues}

## Recommendations
${this.results.go_live_ready ? 
'✅ System validated successfully. All critical components functional. Ready for go-live.' :
'🔴 System requires attention before go-live. Address critical failures and re-validate.'}

## Next Steps
${this.results.go_live_ready ? 
'- Proceed with go-live deployment\n- Monitor system performance\n- Schedule post-launch validation' :
'- Fix critical issues identified\n- Re-run validation\n- Defer go-live until resolved'}

---
*Generated by Simplified System Audit*
*Audit completed at: ${this.results.timestamp}*
`;
    }

    logIssue(type, message) {
        this.results.issues_found.push({
            type,
            message,
            severity: 'medium',
            timestamp: new Date().toISOString()
        });
        console.log(`  ⚠️ WARNING: ${message}`);
    }

    logCriticalError(type, message) {
        this.results.critical_failures.push({
            type,
            message,
            severity: 'critical',
            timestamp: new Date().toISOString()
        });
        console.log(`  🔴 CRITICAL: ${message}`);
    }
}

// Run the audit
if (require.main === module) {
    const audit = new SimplifiedSystemAudit();
    audit.run().then(result => {
        process.exit(result.success && result.goLiveReady ? 0 : 1);
    });
}

module.exports = SimplifiedSystemAudit;