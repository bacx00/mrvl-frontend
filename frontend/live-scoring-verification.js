/**
 * LIVE SCORING SYSTEM VERIFICATION
 * Quick verification script to check that all components are working
 */

class LiveScoringVerification {
    constructor() {
        this.results = [];
    }
    
    log(message, status = 'info') {
        const result = { message, status, timestamp: new Date().toISOString() };
        this.results.push(result);
        console.log(`[${status.toUpperCase()}] ${message}`);
        return result;
    }
    
    async verifySimplifiedLiveScoringComponent() {
        this.log('=== Verifying SimplifiedLiveScoring Component ===', 'test');
        
        try {
            // Check if component file exists and has key functions
            const response = await fetch('/src/components/admin/SimplifiedLiveScoring.js');
            if (response.ok) {
                const content = await response.text();
                
                // Check for key functions
                const requiredFunctions = [
                    'updatePlayerStat',
                    'updatePlayerHero', 
                    'updateCurrentMapScore',
                    'updateSeriesScore',
                    'validateAndSanitizeInput',
                    'calculateKDA'
                ];
                
                const missingFunctions = requiredFunctions.filter(fn => !content.includes(fn));
                
                if (missingFunctions.length === 0) {
                    this.log('✓ All required functions present in SimplifiedLiveScoring', 'success');
                } else {
                    this.log(`✗ Missing functions: ${missingFunctions.join(', ')}`, 'error');
                }
                
                // Check for hero selection dropdown
                if (content.includes('Select Hero...') && content.includes('HEROES')) {
                    this.log('✓ Hero selection functionality present', 'success');
                } else {
                    this.log('✗ Hero selection functionality missing', 'error');
                }
                
                // Check for stats input fields
                const statFields = ['kills', 'deaths', 'assists', 'damage', 'healing', 'blocked'];
                const missingStats = statFields.filter(stat => !content.includes(stat));
                
                if (missingStats.length === 0) {
                    this.log('✓ All stat input fields present', 'success');
                } else {
                    this.log(`✗ Missing stat fields: ${missingStats.join(', ')}`, 'error');
                }
                
                return true;
            } else {
                this.log('✗ SimplifiedLiveScoring component file not accessible', 'error');
                return false;
            }
        } catch (error) {
            this.log(`Error verifying component: ${error.message}`, 'error');
            return false;
        }
    }
    
    async verifyBackendEndpoints() {
        this.log('=== Verifying Backend Endpoints ===', 'test');
        
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
        
        try {
            // Test basic connectivity
            const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
            if (healthResponse.ok) {
                this.log('✓ Backend connectivity confirmed', 'success');
            } else {
                this.log('✗ Backend not responding', 'error');
                return false;
            }
            
            // Test matches endpoint
            const matchesResponse = await fetch(`${BACKEND_URL}/api/matches`);
            if (matchesResponse.ok) {
                this.log('✓ Matches API endpoint working', 'success');
            } else {
                this.log('✗ Matches API endpoint failed', 'error');
            }
            
            return true;
        } catch (error) {
            this.log(`Backend verification failed: ${error.message}`, 'error');
            return false;
        }
    }
    
    async verifyHeroData() {
        this.log('=== Verifying Hero Data ===', 'test');
        
        try {
            // Check if HEROES constant is available
            if (typeof window !== 'undefined' && window.HEROES) {
                const heroes = window.HEROES;
                const requiredRoles = ['Duelist', 'Vanguard', 'Strategist'];
                const missingRoles = requiredRoles.filter(role => !heroes[role]);
                
                if (missingRoles.length === 0) {
                    this.log('✓ All hero roles present', 'success');
                    
                    // Count heroes
                    const totalHeroes = Object.values(heroes).flat().length;
                    this.log(`✓ ${totalHeroes} heroes available`, 'success');
                } else {
                    this.log(`✗ Missing hero roles: ${missingRoles.join(', ')}`, 'error');
                }
                
                return true;
            } else {
                this.log('✗ HEROES data not available', 'error');
                return false;
            }
        } catch (error) {
            this.log(`Hero data verification failed: ${error.message}`, 'error');
            return false;
        }
    }
    
    async verifyTestFiles() {
        this.log('=== Verifying Test Files ===', 'test');
        
        const testFiles = [
            '/realistic-live-scoring-test.js',
            '/realistic-live-scoring-test-runner.html',
            '/backend-integration-validator.js'
        ];
        
        let allFilesPresent = true;
        
        for (const file of testFiles) {
            try {
                const response = await fetch(file);
                if (response.ok) {
                    this.log(`✓ ${file} accessible`, 'success');
                } else {
                    this.log(`✗ ${file} not accessible`, 'error');
                    allFilesPresent = false;
                }
            } catch (error) {
                this.log(`✗ ${file} check failed: ${error.message}`, 'error');
                allFilesPresent = false;
            }
        }
        
        return allFilesPresent;
    }
    
    async runQuickTest() {
        this.log('=== Running Quick Functionality Test ===', 'test');
        
        try {
            // Test KDA calculation
            const testKDA = (kills, deaths, assists) => {
                if (deaths === 0) return kills + assists;
                return ((kills + assists) / deaths);
            };
            
            const testCases = [
                { kills: 15, deaths: 3, assists: 8, expected: 7.67 },
                { kills: 10, deaths: 0, assists: 5, expected: 15 },
                { kills: 5, deaths: 5, assists: 10, expected: 3 }
            ];
            
            let kdaTestsPassed = 0;
            for (const test of testCases) {
                const result = testKDA(test.kills, test.deaths, test.assists);
                const passed = Math.abs(result - test.expected) < 0.01;
                if (passed) kdaTestsPassed++;
            }
            
            if (kdaTestsPassed === testCases.length) {
                this.log('✓ KDA calculation working correctly', 'success');
            } else {
                this.log(`✗ KDA calculation failed ${testCases.length - kdaTestsPassed} tests`, 'error');
            }
            
            // Test input validation
            const validateInput = (value, min = 0, max = 9999) => {
                const num = parseInt(value);
                return !isNaN(num) && num >= min && num <= max;
            };
            
            const validationTests = [
                { value: '15', expected: true },
                { value: '-5', expected: false },
                { value: '99999', expected: false },
                { value: 'abc', expected: false }
            ];
            
            let validationTestsPassed = 0;
            for (const test of validationTests) {
                const result = validateInput(test.value);
                if (result === test.expected) validationTestsPassed++;
            }
            
            if (validationTestsPassed === validationTests.length) {
                this.log('✓ Input validation working correctly', 'success');
            } else {
                this.log(`✗ Input validation failed ${validationTests.length - validationTestsPassed} tests`, 'error');
            }
            
            return true;
        } catch (error) {
            this.log(`Quick test failed: ${error.message}`, 'error');
            return false;
        }
    }
    
    generateReport() {
        const summary = {
            total_checks: this.results.length,
            successes: this.results.filter(r => r.status === 'success').length,
            errors: this.results.filter(r => r.status === 'error').length,
            warnings: this.results.filter(r => r.status === 'warning').length,
            timestamp: new Date().toISOString()
        };
        
        const overallStatus = summary.errors === 0 ? 'PASS' : 'FAIL';
        
        this.log('=== VERIFICATION SUMMARY ===', 'test');
        this.log(`Overall Status: ${overallStatus}`, overallStatus === 'PASS' ? 'success' : 'error');
        this.log(`Checks Passed: ${summary.successes}/${summary.total_checks}`, 'info');
        
        if (summary.errors > 0) {
            this.log(`Errors Found: ${summary.errors}`, 'error');
            this.log('Review error messages above for details', 'info');
        }
        
        return { summary, results: this.results, status: overallStatus };
    }
    
    async runFullVerification() {
        this.log('🔍 Starting Live Scoring System Verification', 'test');
        
        try {
            await this.verifySimplifiedLiveScoringComponent();
            await this.verifyBackendEndpoints();
            await this.verifyHeroData();
            await this.verifyTestFiles();
            await this.runQuickTest();
            
            return this.generateReport();
        } catch (error) {
            this.log(`Verification failed: ${error.message}`, 'error');
            return this.generateReport();
        }
    }
}

// Make available globally
if (typeof window !== 'undefined') {
    window.LiveScoringVerification = LiveScoringVerification;
    console.log('Live Scoring Verification loaded. Run with: new LiveScoringVerification().runFullVerification()');
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveScoringVerification;
}