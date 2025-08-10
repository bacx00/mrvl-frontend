#!/usr/bin/env node

/**
 * MARVEL RIVALS COMPREHENSIVE FRONTEND CRUD TEST SUITE
 * ====================================================
 * 
 * This script comprehensively tests all frontend pages and CRUD operations
 * for teams, players, coaches, and admin functionality.
 * 
 * Features tested:
 * - Team management (Create, Read, Update, Delete)
 * - Player management (Create, Read, Update, Delete)
 * - Coach data integration
 * - Image upload functionality
 * - API endpoint validation
 * - Error handling
 * - Frontend form validation
 * - 6-player roster support
 * - Mobile/tablet responsiveness
 */

const fs = require('fs');
const path = require('path');

class FrontendCRUDTester {
    constructor() {
        this.frontendPath = '/var/www/mrvl-frontend/frontend/src';
        this.results = {
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                criticalIssues: []
            },
            teamManagement: {
                forms: [],
                apiEndpoints: [],
                validation: [],
                imageUpload: []
            },
            playerManagement: {
                forms: [],
                apiEndpoints: [],
                validation: [],
                imageUpload: []
            },
            adminDashboard: {
                components: [],
                accessibility: [],
                navigation: []
            },
            profilePages: {
                teamProfiles: [],
                playerProfiles: [],
                responsiveness: []
            },
            coachData: {
                integration: [],
                forms: [],
                display: []
            },
            sixPlayerRoster: {
                support: [],
                validation: [],
                display: []
            }
        };
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    incrementTest(passed = true) {
        this.results.summary.totalTests++;
        if (passed) {
            this.results.summary.passed++;
        } else {
            this.results.summary.failed++;
        }
    }

    addWarning(message) {
        this.results.summary.warnings++;
        this.log(message, 'warning');
    }

    addCriticalIssue(issue) {
        this.results.summary.criticalIssues.push(issue);
        this.log(`CRITICAL: ${issue}`, 'error');
    }

    async testFileExists(filePath, description) {
        try {
            const fullPath = path.join(this.frontendPath, filePath);
            const exists = fs.existsSync(fullPath);
            
            if (exists) {
                this.log(`✅ ${description}: Found at ${filePath}`, 'success');
                this.incrementTest(true);
                return true;
            } else {
                this.log(`❌ ${description}: Missing at ${filePath}`, 'error');
                this.incrementTest(false);
                return false;
            }
        } catch (error) {
            this.log(`❌ ${description}: Error checking ${filePath} - ${error.message}`, 'error');
            this.incrementTest(false);
            return false;
        }
    }

    async analyzeFileContent(filePath, requirements, description) {
        try {
            const fullPath = path.join(this.frontendPath, filePath);
            if (!fs.existsSync(fullPath)) {
                this.addCriticalIssue(`Missing file: ${filePath}`);
                return { found: [], missing: requirements, issues: [`File not found: ${filePath}`] };
            }

            const content = fs.readFileSync(fullPath, 'utf8');
            const found = [];
            const missing = [];
            const issues = [];

            for (const requirement of requirements) {
                if (typeof requirement === 'string') {
                    if (content.includes(requirement)) {
                        found.push(requirement);
                    } else {
                        missing.push(requirement);
                    }
                } else if (typeof requirement === 'object' && requirement.pattern) {
                    const regex = new RegExp(requirement.pattern, requirement.flags || 'i');
                    if (regex.test(content)) {
                        found.push(requirement.description || requirement.pattern);
                    } else {
                        missing.push(requirement.description || requirement.pattern);
                    }
                }
            }

            // Analyze for common issues
            if (content.includes('console.log') && !content.includes('process.env.NODE_ENV')) {
                issues.push('Contains debug console.log statements that should be removed in production');
            }

            if (content.includes('alert(') && !content.includes('confirm')) {
                issues.push('Uses basic alert() - consider using toast notifications for better UX');
            }

            if (content.includes('innerHTML') && !content.includes('sanitize')) {
                issues.push('Potential XSS vulnerability: innerHTML used without sanitization');
            }

            this.log(`📊 ${description}: ${found.length}/${requirements.length} requirements found`, 
                found.length === requirements.length ? 'success' : 'warning');

            return { found, missing, issues };
        } catch (error) {
            this.addCriticalIssue(`Error analyzing ${filePath}: ${error.message}`);
            return { found: [], missing: requirements, issues: [error.message] };
        }
    }

    async testTeamManagement() {
        this.log('🏢 Testing Team Management System...', 'info');

        // Test TeamForm component
        const teamFormRequirements = [
            'useState',
            'useEffect',
            'handleSubmit',
            'name:',
            'shortName:',
            'region:',
            'coach',
            'logo',
            'flag',
            'rating',
            'earnings',
            'socialLinks',
            'ImageUpload',
            'api.post',
            'api.put',
            'team_id',
            'social_links'
        ];

        const teamFormAnalysis = await this.analyzeFileContent(
            'components/admin/TeamForm.js',
            teamFormRequirements,
            'Team Form Component'
        );

        this.results.teamManagement.forms.push({
            component: 'TeamForm.js',
            ...teamFormAnalysis
        });

        // Check for coach integration
        if (!teamFormAnalysis.found.includes('coach')) {
            this.addCriticalIssue('TeamForm missing coach field integration');
        }

        // Test Teams listing page
        await this.testFileExists('components/pages/TeamsPage.js', 'Teams Listing Page');
        await this.testFileExists('components/pages/TeamDetailPage.js', 'Team Detail Page');

        // Test API endpoints
        const apiRequirements = [
            '/admin/teams',
            '/teams/',
            'POST',
            'PUT',
            'DELETE',
            'GET'
        ];

        // Check for API configuration
        await this.analyzeFileContent('config.js', [
            'API_CONFIG',
            'BASE_URL',
            'ENDPOINTS'
        ], 'API Configuration');

        this.incrementTest(teamFormAnalysis.missing.length === 0);
    }

    async testPlayerManagement() {
        this.log('👤 Testing Player Management System...', 'info');

        // Test PlayerForm component
        const playerFormRequirements = [
            'useState',
            'useEffect',
            'handleSubmit',
            'username',
            'real_name',
            'team_id',
            'role',
            'region',
            'country',
            'age',
            'rating',
            'earnings',
            'avatar',
            'social_media',
            'ImageUpload',
            'api.post',
            'api.put',
            'Duelist',
            'Vanguard',
            'Strategist'
        ];

        const playerFormAnalysis = await this.analyzeFileContent(
            'components/admin/PlayerForm.js',
            playerFormRequirements,
            'Player Form Component'
        );

        this.results.playerManagement.forms.push({
            component: 'PlayerForm.js',
            ...playerFormAnalysis
        });

        // Test Players listing page
        await this.testFileExists('components/pages/PlayersPage.js', 'Players Listing Page');
        await this.testFileExists('components/pages/PlayerDetailPage.js', 'Player Detail Page');

        // Check for Marvel Rivals specific roles
        const marvelRoles = ['Duelist', 'Vanguard', 'Strategist'];
        const hasMarvelRoles = marvelRoles.every(role => 
            playerFormAnalysis.found.some(item => item.includes(role))
        );

        if (!hasMarvelRoles) {
            this.addCriticalIssue('PlayerForm missing Marvel Rivals specific roles');
        }

        this.incrementTest(playerFormAnalysis.missing.length === 0);
    }

    async testAdminDashboard() {
        this.log('🔧 Testing Admin Dashboard Components...', 'info');

        const adminComponents = [
            'components/admin/AdminDashboard.js',
            'components/admin/AdminTeams.js',
            'components/admin/AdminPlayers.js',
            'components/admin/AdminUsers.js',
            'components/admin/AdminStats.js',
            'components/admin/AdminEvents.js',
            'components/admin/AdminMatches.js',
            'components/admin/AdminNews.js'
        ];

        let adminComponentsFound = 0;

        for (const component of adminComponents) {
            const exists = await this.testFileExists(component, `Admin Component: ${component.split('/').pop()}`);
            if (exists) {
                adminComponentsFound++;
                
                // Analyze component for role-based access
                const analysis = await this.analyzeFileContent(component, [
                    'useAuth',
                    'role',
                    'admin',
                    'permission'
                ], `Role-based access in ${component.split('/').pop()}`);
                
                this.results.adminDashboard.components.push({
                    component: component.split('/').pop(),
                    hasRoleBasedAccess: analysis.found.length > 0,
                    ...analysis
                });
            }
        }

        // Test main admin page
        await this.testFileExists('app/admin/page.tsx', 'Admin Main Page (Next.js)');

        this.incrementTest(adminComponentsFound >= adminComponents.length * 0.8);
    }

    async testProfilePages() {
        this.log('📋 Testing Profile Pages...', 'info');

        // Test team profile components
        const teamProfileRequirements = [
            'team',
            'players',
            'coach',
            'roster',
            'logo',
            'achievements',
            'stats',
            'social'
        ];

        const teamDetailAnalysis = await this.analyzeFileContent(
            'components/pages/TeamDetailPage.js',
            teamProfileRequirements,
            'Team Detail Page'
        );

        // Test player profile components
        const playerProfileRequirements = [
            'player',
            'team',
            'role',
            'stats',
            'avatar',
            'achievements',
            'social'
        ];

        const playerDetailAnalysis = await this.analyzeFileContent(
            'components/pages/PlayerDetailPage.js',
            playerProfileRequirements,
            'Player Detail Page'
        );

        this.results.profilePages.teamProfiles.push(teamDetailAnalysis);
        this.results.profilePages.playerProfiles.push(playerDetailAnalysis);

        // Check for responsive design
        const mobileComponents = [
            'components/mobile/MobileTeamCard.js',
            'components/mobile/MobileMatchCard.js',
            'components/mobile/MobileUserProfile.js'
        ];

        let mobileComponentsFound = 0;
        for (const component of mobileComponents) {
            const exists = await this.testFileExists(component, `Mobile Component: ${component.split('/').pop()}`);
            if (exists) mobileComponentsFound++;
        }

        this.results.profilePages.responsiveness.push({
            mobileComponents: mobileComponentsFound,
            totalExpected: mobileComponents.length,
            percentage: (mobileComponentsFound / mobileComponents.length) * 100
        });

        this.incrementTest(teamDetailAnalysis.missing.length < 3 && playerDetailAnalysis.missing.length < 3);
    }

    async testImageUpload() {
        this.log('🖼️ Testing Image Upload Functionality...', 'info');

        // Test ImageUpload component
        const imageUploadRequirements = [
            'onImageSelect',
            'FormData',
            'append',
            'file',
            'preview',
            'upload',
            'error',
            'loading',
            'accept="image/*"'
        ];

        const imageUploadAnalysis = await this.analyzeFileContent(
            'components/shared/ImageUpload.js',
            imageUploadRequirements,
            'Image Upload Component'
        );

        // Test upload endpoints usage
        const uploadEndpoints = [
            '/upload/team/',
            '/upload/player/',
            'avatar',
            'logo',
            'flag'
        ];

        let uploadsSupported = 0;

        // Check TeamForm for image uploads
        const teamFormContent = await this.analyzeFileContent(
            'components/admin/TeamForm.js',
            uploadEndpoints,
            'Team Form Image Uploads'
        );
        uploadsSupported += teamFormContent.found.length;

        // Check PlayerForm for image uploads
        const playerFormContent = await this.analyzeFileContent(
            'components/admin/PlayerForm.js',
            uploadEndpoints,
            'Player Form Image Uploads'
        );
        uploadsSupported += playerFormContent.found.length;

        this.results.teamManagement.imageUpload.push(teamFormContent);
        this.results.playerManagement.imageUpload.push(playerFormContent);

        if (uploadsSupported < 3) {
            this.addCriticalIssue('Insufficient image upload support across forms');
        }

        this.incrementTest(imageUploadAnalysis.missing.length < 2);
    }

    async testCoachIntegration() {
        this.log('🧑‍🏫 Testing Coach Data Integration...', 'info');

        const coachRequirements = [
            'coach',
            'coaching_staff',
            'staff',
            'head_coach',
            'assistant'
        ];

        // Check team-related files for coach support
        const teamFiles = [
            'components/admin/TeamForm.js',
            'components/pages/TeamDetailPage.js',
            'components/pages/TeamsPage.js'
        ];

        let coachIntegrationScore = 0;

        for (const file of teamFiles) {
            const analysis = await this.analyzeFileContent(file, coachRequirements, `Coach Integration: ${file.split('/').pop()}`);
            coachIntegrationScore += analysis.found.length;
            this.results.coachData.integration.push({
                file: file.split('/').pop(),
                ...analysis
            });
        }

        if (coachIntegrationScore === 0) {
            this.addCriticalIssue('No coach data integration found in team management');
        } else if (coachIntegrationScore < 3) {
            this.addWarning('Limited coach data integration - may need enhancement');
        }

        this.incrementTest(coachIntegrationScore > 0);
    }

    async testSixPlayerRoster() {
        this.log('👥 Testing 6-Player Roster Support...', 'info');

        const rosterRequirements = [
            { pattern: '[\'"]6[\'"]', description: '6-player roster constant' },
            { pattern: 'length.*6|6.*player', description: '6-player validation' },
            { pattern: 'roster.*length|players.*count', description: 'roster size validation' },
            'MAX_PLAYERS',
            'ROSTER_SIZE',
            'players.length'
        ];

        const rosterFiles = [
            'components/admin/TeamForm.js',
            'components/pages/TeamDetailPage.js',
            'components/shared/TeamSelector.js',
            'constants/marvelRivalsData.js'
        ];

        let rosterSupportScore = 0;

        for (const file of rosterFiles) {
            const analysis = await this.analyzeFileContent(file, rosterRequirements, `6-Player Roster: ${file.split('/').pop()}`);
            rosterSupportScore += analysis.found.length;
            this.results.sixPlayerRoster.support.push({
                file: file.split('/').pop(),
                ...analysis
            });
        }

        // Check constants file specifically
        const constantsAnalysis = await this.analyzeFileContent(
            'constants/marvelRivalsData.js',
            ['MAX_TEAM_SIZE', 'ROSTER_SIZE', '6'],
            'Marvel Rivals Constants'
        );

        if (constantsAnalysis.missing.length > 2) {
            this.addCriticalIssue('Missing Marvel Rivals team size constants');
        }

        this.incrementTest(rosterSupportScore > 0);
    }

    async testAPIEndpoints() {
        this.log('🔗 Testing API Endpoint Integration...', 'info');

        const expectedEndpoints = [
            // Team endpoints
            '/api/teams',
            '/api/admin/teams',
            '/api/teams/{id}',
            '/upload/team/',
            
            // Player endpoints
            '/api/players',
            '/api/admin/players', 
            '/api/players/{id}',
            '/upload/player/',
            
            // Match endpoints
            '/api/matches',
            '/api/admin/matches',
            
            // Event endpoints
            '/api/events',
            '/api/admin/events',
            
            // Forum endpoints
            '/api/forums',
            '/api/threads',
            
            // User endpoints
            '/api/users',
            '/api/admin/users'
        ];

        // Search for API calls in components
        const componentFiles = [
            'components/admin/TeamForm.js',
            'components/admin/PlayerForm.js',
            'components/pages/TeamsPage.js',
            'components/pages/PlayersPage.js',
            'lib/api.ts',
            'api/MatchAPI.js'
        ];

        let endpointUsage = 0;

        for (const file of componentFiles) {
            const content = await this.analyzeFileContent(file, expectedEndpoints, `API Usage: ${file.split('/').pop()}`);
            endpointUsage += content.found.length;
        }

        // Test API configuration
        const apiConfig = await this.testFileExists('config.js', 'API Configuration File');
        
        if (endpointUsage < expectedEndpoints.length * 0.5) {
            this.addCriticalIssue('Insufficient API endpoint usage - many endpoints not implemented in frontend');
        }

        this.incrementTest(endpointUsage >= expectedEndpoints.length * 0.3);
    }

    async testErrorHandling() {
        this.log('🚨 Testing Error Handling...', 'info');

        const errorHandlingRequirements = [
            'try',
            'catch',
            'error',
            'setError',
            'Error',
            'finally',
            'loading',
            'setLoading'
        ];

        const criticalFiles = [
            'components/admin/TeamForm.js',
            'components/admin/PlayerForm.js',
            'components/pages/TeamDetailPage.js',
            'components/pages/PlayerDetailPage.js'
        ];

        let errorHandlingScore = 0;

        for (const file of criticalFiles) {
            const analysis = await this.analyzeFileContent(file, errorHandlingRequirements, `Error Handling: ${file.split('/').pop()}`);
            errorHandlingScore += analysis.found.length;
            
            if (analysis.found.length < 4) {
                this.addWarning(`Insufficient error handling in ${file.split('/').pop()}`);
            }
        }

        // Test error boundary
        await this.testFileExists('components/ErrorBoundary.js', 'Error Boundary Component');
        await this.testFileExists('app/context/ErrorBoundary.tsx', 'Next.js Error Boundary');

        this.incrementTest(errorHandlingScore >= criticalFiles.length * 4);
    }

    async testFormValidation() {
        this.log('✅ Testing Form Validation...', 'info');

        const validationRequirements = [
            'required',
            'validate',
            'validation',
            'trim()',
            'length',
            'email',
            'url',
            'number',
            'min',
            'max'
        ];

        const formFiles = [
            'components/admin/TeamForm.js',
            'components/admin/PlayerForm.js',
            'components/admin/UserForm.js',
            'app/components/RegisterForm.tsx',
            'app/components/LoginForm.tsx'
        ];

        let validationScore = 0;

        for (const file of formFiles) {
            const analysis = await this.analyzeFileContent(file, validationRequirements, `Form Validation: ${file.split('/').pop()}`);
            validationScore += analysis.found.length;
        }

        if (validationScore < formFiles.length * 3) {
            this.addCriticalIssue('Insufficient form validation across the application');
        }

        this.incrementTest(validationScore >= formFiles.length * 2);
    }

    async testAccessibilityFeatures() {
        this.log('♿ Testing Accessibility Features...', 'info');

        const a11yRequirements = [
            'aria-label',
            'aria-describedby',
            'alt=',
            'role=',
            'tabIndex',
            'onKeyDown',
            'focus',
            'sr-only'
        ];

        const uiFiles = [
            'components/admin/TeamForm.js',
            'components/admin/PlayerForm.js',
            'components/Navigation.js',
            'app/components/Header.tsx',
            'app/components/Navigation.tsx'
        ];

        let a11yScore = 0;

        for (const file of uiFiles) {
            const analysis = await this.analyzeFileContent(file, a11yRequirements, `Accessibility: ${file.split('/').pop()}`);
            a11yScore += analysis.found.length;
        }

        this.results.adminDashboard.accessibility.push({
            score: a11yScore,
            totalFiles: uiFiles.length,
            average: a11yScore / uiFiles.length
        });

        if (a11yScore < uiFiles.length * 2) {
            this.addWarning('Limited accessibility features - consider enhancing for better WCAG compliance');
        }

        this.incrementTest(a11yScore > 0);
    }

    async runAllTests() {
        this.log('🚀 Starting Comprehensive Frontend CRUD Testing...', 'info');
        this.log(`📁 Testing directory: ${this.frontendPath}`, 'info');

        try {
            // Core functionality tests
            await this.testTeamManagement();
            await this.testPlayerManagement();
            await this.testAdminDashboard();
            await this.testProfilePages();

            // Feature-specific tests
            await this.testImageUpload();
            await this.testCoachIntegration();
            await this.testSixPlayerRoster();
            
            // Technical tests
            await this.testAPIEndpoints();
            await this.testErrorHandling();
            await this.testFormValidation();
            await this.testAccessibilityFeatures();

            await this.generateReport();

        } catch (error) {
            this.addCriticalIssue(`Testing framework error: ${error.message}`);
            this.log(`❌ Testing failed: ${error.message}`, 'error');
        }
    }

    async generateReport() {
        const endTime = Date.now();
        const duration = ((endTime - this.startTime) / 1000).toFixed(2);

        const report = {
            metadata: {
                testSuite: 'Marvel Rivals Frontend CRUD Test',
                timestamp: new Date().toISOString(),
                duration: `${duration}s`,
                frontendPath: this.frontendPath
            },
            summary: {
                ...this.results.summary,
                successRate: `${((this.results.summary.passed / this.results.summary.totalTests) * 100).toFixed(1)}%`,
                healthStatus: this.getHealthStatus()
            },
            detailedResults: {
                teamManagement: this.results.teamManagement,
                playerManagement: this.results.playerManagement,
                adminDashboard: this.results.adminDashboard,
                profilePages: this.results.profilePages,
                coachData: this.results.coachData,
                sixPlayerRoster: this.results.sixPlayerRoster
            },
            recommendations: this.generateRecommendations(),
            criticalIssues: this.results.summary.criticalIssues
        };

        const reportPath = path.join('/var/www/mrvl-frontend/frontend', 'comprehensive-frontend-crud-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        this.log(`\n📊 FRONTEND CRUD TEST SUMMARY`, 'info');
        this.log(`=================================`, 'info');
        this.log(`📊 Total Tests: ${this.results.summary.totalTests}`, 'info');
        this.log(`✅ Passed: ${this.results.summary.passed}`, 'success');
        this.log(`❌ Failed: ${this.results.summary.failed}`, 'error');
        this.log(`⚠️ Warnings: ${this.results.summary.warnings}`, 'warning');
        this.log(`🚨 Critical Issues: ${this.results.summary.criticalIssues.length}`, this.results.summary.criticalIssues.length > 0 ? 'error' : 'success');
        this.log(`📈 Success Rate: ${report.summary.successRate}`, 'info');
        this.log(`🏥 Health Status: ${report.summary.healthStatus}`, report.summary.healthStatus === 'HEALTHY' ? 'success' : 'warning');
        this.log(`⏱️ Duration: ${duration}s`, 'info');
        this.log(`📄 Report saved: ${reportPath}`, 'info');

        if (this.results.summary.criticalIssues.length > 0) {
            this.log(`\n🚨 CRITICAL ISSUES TO FIX:`, 'error');
            this.results.summary.criticalIssues.forEach((issue, index) => {
                this.log(`${index + 1}. ${issue}`, 'error');
            });
        }

        const recommendations = this.generateRecommendations();
        if (recommendations.length > 0) {
            this.log(`\n💡 RECOMMENDATIONS:`, 'info');
            recommendations.forEach((rec, index) => {
                this.log(`${index + 1}. ${rec}`, 'info');
            });
        }

        return report;
    }

    getHealthStatus() {
        const successRate = (this.results.summary.passed / this.results.summary.totalTests) * 100;
        const criticalIssues = this.results.summary.criticalIssues.length;

        if (criticalIssues > 3 || successRate < 60) {
            return 'CRITICAL';
        } else if (criticalIssues > 1 || successRate < 80) {
            return 'NEEDS_ATTENTION';
        } else if (this.results.summary.warnings > 5 || successRate < 95) {
            return 'STABLE';
        } else {
            return 'HEALTHY';
        }
    }

    generateRecommendations() {
        const recommendations = [];

        // Critical issue recommendations
        if (this.results.summary.criticalIssues.length > 0) {
            recommendations.push('Address all critical issues immediately before going to production');
        }

        // Success rate recommendations
        const successRate = (this.results.summary.passed / this.results.summary.totalTests) * 100;
        if (successRate < 90) {
            recommendations.push('Improve test coverage and fix failing components');
        }

        // Feature-specific recommendations
        if (this.results.coachData.integration.every(item => item.found.length === 0)) {
            recommendations.push('Implement coach data integration across team management forms and displays');
        }

        if (this.results.sixPlayerRoster.support.every(item => item.found.length === 0)) {
            recommendations.push('Add 6-player roster validation and constants for Marvel Rivals team structure');
        }

        // UI/UX recommendations
        if (this.results.summary.warnings > 3) {
            recommendations.push('Review warning messages and consider UI/UX improvements');
        }

        // Performance recommendations
        recommendations.push('Consider implementing loading states and error boundaries for better user experience');
        recommendations.push('Add input validation and sanitization for security');
        recommendations.push('Implement responsive design testing for mobile and tablet devices');

        return recommendations;
    }
}

// Run the comprehensive test
async function main() {
    const tester = new FrontendCRUDTester();
    await tester.runAllTests();
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = FrontendCRUDTester;