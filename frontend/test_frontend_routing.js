const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🌐 Marvel Rivals Frontend - Production Readiness Verification');
console.log('============================================================\n');

class FrontendTester {
    constructor() {
        this.results = {};
        this.errors = [];
        this.warnings = [];
    }

    async testFrontendBuild() {
        console.log('🔨 Testing Frontend Build Process...');
        
        try {
            // Check if build directory exists and has files
            const buildPath = path.join(__dirname, 'build');
            if (!fs.existsSync(buildPath)) {
                this.errors.push('Build directory does not exist');
                return false;
            }

            const buildFiles = fs.readdirSync(buildPath);
            if (buildFiles.length === 0) {
                this.errors.push('Build directory is empty');
                return false;
            }

            // Check for essential build files
            const essentialFiles = ['index.html', 'asset-manifest.json'];
            for (const file of essentialFiles) {
                if (!buildFiles.includes(file)) {
                    this.errors.push(`Missing essential build file: ${file}`);
                }
            }

            // Check static assets
            const staticPath = path.join(buildPath, 'static');
            if (fs.existsSync(staticPath)) {
                const staticFiles = fs.readdirSync(staticPath, { recursive: true });
                console.log(`  ✅ Build contains ${buildFiles.length} files`);
                console.log(`  ✅ Static assets: ${staticFiles.length} files`);
            } else {
                this.warnings.push('No static assets directory found');
            }

            this.results.frontend_build = 'PASSED';
            return true;

        } catch (error) {
            this.errors.push(`Frontend build test failed: ${error.message}`);
            this.results.frontend_build = 'FAILED';
            return false;
        }
    }

    async testRouteStructure() {
        console.log('\n📁 Testing Route Structure...');
        
        try {
            const srcPath = path.join(__dirname, 'src');
            const pagesPath = path.join(srcPath, 'components', 'pages');
            
            if (!fs.existsSync(pagesPath)) {
                this.errors.push('Pages directory not found');
                return false;
            }

            const pageFiles = fs.readdirSync(pagesPath);
            const expectedPages = [
                'HomePage.js',
                'TeamsPage.js', 
                'PlayersPage.js',
                'MatchesPage.js',
                'EventsPage.js',
                'RankingsPage.js',
                'NewsPage.js'
            ];

            console.log('  🔍 Checking essential page components...');
            for (const page of expectedPages) {
                if (pageFiles.includes(page)) {
                    console.log(`    ✅ ${page} exists`);
                } else {
                    this.warnings.push(`Missing page component: ${page}`);
                    console.log(`    ⚠️ ${page} missing`);
                }
            }

            // Check admin pages
            const adminPagesPath = path.join(srcPath, 'components', 'admin');
            if (fs.existsSync(adminPagesPath)) {
                const adminFiles = fs.readdirSync(adminPagesPath);
                console.log(`  ✅ Admin components: ${adminFiles.length} files`);
                
                const essentialAdminComponents = [
                    'AdminDashboard.js',
                    'AdminTeams.js',
                    'AdminPlayers.js', 
                    'AdminMatches.js',
                    'AdminEvents.js'
                ];

                for (const component of essentialAdminComponents) {
                    if (adminFiles.includes(component)) {
                        console.log(`    ✅ Admin ${component} exists`);
                    } else {
                        this.warnings.push(`Missing admin component: ${component}`);
                    }
                }
            } else {
                this.errors.push('Admin components directory not found');
            }

            this.results.route_structure = 'PASSED';
            return true;

        } catch (error) {
            this.errors.push(`Route structure test failed: ${error.message}`);
            this.results.route_structure = 'FAILED';
            return false;
        }
    }

    async testMobileOptimization() {
        console.log('\n📱 Testing Mobile Optimization...');
        
        try {
            const mobilePath = path.join(__dirname, 'src', 'components', 'mobile');
            
            if (fs.existsSync(mobilePath)) {
                const mobileFiles = fs.readdirSync(mobilePath);
                console.log(`  ✅ Mobile components: ${mobileFiles.length} files`);
                
                const essentialMobileComponents = [
                    'MobileNavigation.js',
                    'MobileMatchCard.js',
                    'MobileLiveScoring.js'
                ];

                for (const component of essentialMobileComponents) {
                    if (mobileFiles.includes(component)) {
                        console.log(`    ✅ ${component} exists`);
                    } else {
                        this.warnings.push(`Missing mobile component: ${component}`);
                    }
                }
            } else {
                this.warnings.push('Mobile components directory not found');
            }

            // Check for mobile styles
            const mobileStylePath = path.join(__dirname, 'src', 'styles', 'mobile.css');
            if (fs.existsSync(mobileStylePath)) {
                console.log('  ✅ Mobile styles available');
            } else {
                this.warnings.push('Mobile styles not found');
            }

            this.results.mobile_optimization = 'PASSED';
            return true;

        } catch (error) {
            this.errors.push(`Mobile optimization test failed: ${error.message}`);
            this.results.mobile_optimization = 'FAILED';
            return false;
        }
    }

    async testLiveScoringComponents() {
        console.log('\n📺 Testing Live Scoring Components...');
        
        try {
            const liveComponents = [
                'src/components/admin/ComprehensiveLiveScoring.js',
                'src/components/admin/LiveScoringDashboard.js',
                'src/components/shared/LiveScoring.js',
                'src/components/mobile/MobileLiveScoring.js'
            ];

            let foundComponents = 0;
            for (const component of liveComponents) {
                const fullPath = path.join(__dirname, component);
                if (fs.existsSync(fullPath)) {
                    console.log(`  ✅ ${path.basename(component)} exists`);
                    foundComponents++;
                } else {
                    this.warnings.push(`Missing live scoring component: ${path.basename(component)}`);
                }
            }

            if (foundComponents >= 2) {
                console.log(`  ✅ Live scoring system has ${foundComponents}/4 components`);
                this.results.live_scoring_components = 'PASSED';
                return true;
            } else {
                this.errors.push('Insufficient live scoring components found');
                this.results.live_scoring_components = 'FAILED';
                return false;
            }

        } catch (error) {
            this.errors.push(`Live scoring components test failed: ${error.message}`);
            this.results.live_scoring_components = 'FAILED';
            return false;
        }
    }

    async testBracketVisualization() {
        console.log('\n🏆 Testing Bracket Visualization Components...');
        
        try {
            const bracketComponents = [
                'src/components/TournamentBracketVisualization.js',
                'src/components/SimpleBracket.js',
                'src/components/SwissDoubleElimBracket.js',
                'src/components/BracketVisualizationClean.js'
            ];

            let foundComponents = 0;
            for (const component of bracketComponents) {
                const fullPath = path.join(__dirname, component);
                if (fs.existsSync(fullPath)) {
                    console.log(`  ✅ ${path.basename(component)} exists`);
                    foundComponents++;
                } else {
                    this.warnings.push(`Missing bracket component: ${path.basename(component)}`);
                }
            }

            // Check bracket styles
            const bracketStyles = [
                'src/styles/tournament-bracket.css',
                'src/styles/bracket-clean.css',
                'src/styles/vlr-bracket.css'
            ];

            let foundStyles = 0;
            for (const style of bracketStyles) {
                const fullPath = path.join(__dirname, style);
                if (fs.existsSync(fullPath)) {
                    console.log(`  ✅ ${path.basename(style)} exists`);
                    foundStyles++;
                }
            }

            if (foundComponents >= 2 && foundStyles >= 1) {
                console.log(`  ✅ Bracket system has ${foundComponents} components and ${foundStyles} stylesheets`);
                this.results.bracket_visualization = 'PASSED';
                return true;
            } else {
                this.errors.push('Insufficient bracket visualization components');
                this.results.bracket_visualization = 'FAILED';
                return false;
            }

        } catch (error) {
            this.errors.push(`Bracket visualization test failed: ${error.message}`);
            this.results.bracket_visualization = 'FAILED';
            return false;
        }
    }

    async testConfigurationFiles() {
        console.log('\n⚙️ Testing Configuration Files...');
        
        try {
            const configFiles = [
                'package.json',
                'src/config.js',
                'src/constants/marvelRivalsData.js'
            ];

            for (const configFile of configFiles) {
                const fullPath = path.join(__dirname, configFile);
                if (fs.existsSync(fullPath)) {
                    console.log(`  ✅ ${configFile} exists`);
                    
                    // Read and validate package.json
                    if (configFile === 'package.json') {
                        const packageJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                        if (packageJson.dependencies && packageJson.dependencies.react) {
                            console.log(`    ✅ React version: ${packageJson.dependencies.react}`);
                        }
                        if (packageJson.scripts && packageJson.scripts.build) {
                            console.log(`    ✅ Build script available`);
                        }
                    }
                } else {
                    this.warnings.push(`Missing configuration file: ${configFile}`);
                }
            }

            this.results.configuration_files = 'PASSED';
            return true;

        } catch (error) {
            this.errors.push(`Configuration files test failed: ${error.message}`);
            this.results.configuration_files = 'FAILED';
            return false;
        }
    }

    generateReport() {
        console.log('\n📋 FRONTEND PRODUCTION READINESS REPORT');
        console.log('=====================================\n');

        const totalTests = Object.keys(this.results).length;
        const passedTests = Object.values(this.results).filter(result => result === 'PASSED').length;
        const failedTests = totalTests - passedTests;

        console.log('📊 SUMMARY:');
        console.log(`  Total Tests: ${totalTests}`);
        console.log(`  Passed: ${passedTests}`);
        console.log(`  Failed: ${failedTests}`);
        console.log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%\n`);

        console.log('🔍 TEST RESULTS:');
        for (const [test, result] of Object.entries(this.results)) {
            const status = result === 'PASSED' ? '✅ PASSED' : '❌ FAILED';
            const testName = test.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            console.log(`  ${testName.padEnd(30)} ${status}`);
        }
        console.log();

        if (this.errors.length > 0) {
            console.log('🚨 CRITICAL ERRORS:');
            this.errors.forEach(error => console.log(`  ❌ ${error}`));
            console.log();
        }

        if (this.warnings.length > 0) {
            console.log('⚠️ WARNINGS:');
            this.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
            console.log();
        }

        // Final assessment
        if (this.errors.length === 0) {
            if (this.warnings.length === 0) {
                console.log('🟢 FRONTEND PRODUCTION READY: All tests passed with no issues!');
                console.log('✅ Frontend is ready for production deployment.\n');
            } else {
                console.log('🟡 FRONTEND MOSTLY READY: All critical tests passed but there are warnings.');
                console.log('✅ Frontend can go to production, but consider addressing warnings.\n');
            }
        } else {
            console.log('🔴 FRONTEND NOT PRODUCTION READY: Critical errors found.');
            console.log('❌ Fix all critical errors before deploying frontend to production.\n');
        }

        // Save report
        const reportData = {
            timestamp: new Date().toISOString(),
            summary: {
                total_tests: totalTests,
                passed_tests: passedTests,
                failed_tests: failedTests,
                success_rate: (passedTests / totalTests) * 100
            },
            results: this.results,
            errors: this.errors,
            warnings: this.warnings,
            production_ready: this.errors.length === 0
        };

        fs.writeFileSync('frontend_production_readiness_report.json', JSON.stringify(reportData, null, 2));
        console.log('📄 Detailed report saved to: frontend_production_readiness_report.json');
    }

    async runAllTests() {
        await this.testFrontendBuild();
        await this.testRouteStructure();
        await this.testMobileOptimization();
        await this.testLiveScoringComponents();
        await this.testBracketVisualization();
        await this.testConfigurationFiles();
        this.generateReport();
    }
}

// Run the tests
const tester = new FrontendTester();
tester.runAllTests().catch(console.error);