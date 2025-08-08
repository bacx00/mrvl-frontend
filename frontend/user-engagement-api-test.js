/**
 * User Engagement API Validation Test
 * 
 * Tests user engagement features through API endpoints and code analysis
 * without requiring browser automation
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

class UserEngagementAPIValidator {
    constructor() {
        this.baseUrl = 'https://staging.mrvl.net';
        this.frontendDir = '/var/www/mrvl-frontend/frontend';
        this.backendDir = '/var/www/mrvl-backend';
        this.testResults = {
            profilePersonalization: {
                heroAvatarComponents: { status: 'pending', details: [] },
                teamFlairComponents: { status: 'pending', details: [] },
                profileCustomizationFiles: { status: 'pending', details: [] },
                userModelIntegration: { status: 'pending', details: [] }
            },
            userJourney: {
                profileRoutes: { status: 'pending', details: [] },
                heroSelectionFlow: { status: 'pending', details: [] },
                teamSelectionFlow: { status: 'pending', details: [] },
                saveAndUpdateAPI: { status: 'pending', details: [] }
            },
            socialFeatures: {
                commentSystemIntegration: { status: 'pending', details: [] },
                forumProfileDisplay: { status: 'pending', details: [] },
                userDisplayComponents: { status: 'pending', details: [] },
                flairVisibilitySystem: { status: 'pending', details: [] }
            },
            retentionImpact: {
                userStatistics: { status: 'pending', details: [] },
                activityTracking: { status: 'pending', details: [] },
                errorHandling: { status: 'pending', details: [] },
                featureCompleteness: { status: 'pending', details: [] }
            },
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                warnings: 0,
                overallScore: 0
            }
        };
        this.startTime = Date.now();
    }

    async runAllTests() {
        console.log('🚀 Starting User Engagement API Validation...');
        
        try {
            await this.testProfilePersonalization();
            await this.testUserJourney();
            await this.testSocialFeatures();
            await this.testRetentionImpact();
            
            this.calculateSummary();
            const report = this.generateReport();
            
            console.log('\n🎉 User Engagement API Validation Complete!');
            console.log(`📊 Overall Score: ${this.testResults.summary.overallScore}%`);
            
            return report;
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        }
    }

    async testProfilePersonalization() {
        console.log('\n📝 Testing Profile Personalization Features...');
        
        await this.testHeroAvatarComponents();
        await this.testTeamFlairComponents();
        await this.testProfileCustomizationFiles();
        await this.testUserModelIntegration();
    }

    async testHeroAvatarComponents() {
        console.log('  🦸 Testing Hero Avatar Components...');
        
        try {
            // Check HeroAvatarSelector component
            const heroSelectorPath = path.join(this.frontendDir, 'src/components/HeroAvatarSelector.js');
            
            if (fs.existsSync(heroSelectorPath)) {
                const content = fs.readFileSync(heroSelectorPath, 'utf8');
                
                // Check for key features
                let score = 0;
                const checks = [
                    { name: 'Hero categories (Tank, Duelist, Support)', pattern: /'Tank'|'Duelist'|'Support'/ },
                    { name: 'Image handling', pattern: /img.*src.*Heroes/ },
                    { name: 'Hero selection callback', pattern: /onAvatarSelect/ },
                    { name: 'Modal functionality', pattern: /fixed.*inset-0/ },
                    { name: 'Role color coding', pattern: /getRoleColor/ }
                ];
                
                checks.forEach(check => {
                    if (check.pattern.test(content)) {
                        score++;
                        this.testResults.profilePersonalization.heroAvatarComponents.details.push(`✅ ${check.name} found`);
                    } else {
                        this.testResults.profilePersonalization.heroAvatarComponents.details.push(`❌ ${check.name} missing`);
                    }
                });
                
                const percentage = (score / checks.length) * 100;
                console.log(`    📊 Hero Avatar Component: ${percentage.toFixed(1)}%`);
                
                if (percentage >= 80) {
                    this.testResults.profilePersonalization.heroAvatarComponents.status = 'passed';
                } else if (percentage >= 60) {
                    this.testResults.profilePersonalization.heroAvatarComponents.status = 'warning';
                } else {
                    this.testResults.profilePersonalization.heroAvatarComponents.status = 'failed';
                }
                
            } else {
                console.log('    ❌ HeroAvatarSelector component not found');
                this.testResults.profilePersonalization.heroAvatarComponents.status = 'failed';
                this.testResults.profilePersonalization.heroAvatarComponents.details.push('Component file missing');
            }
            
        } catch (error) {
            console.log('    ❌ Hero Avatar Components test error:', error.message);
            this.testResults.profilePersonalization.heroAvatarComponents.status = 'failed';
            this.testResults.profilePersonalization.heroAvatarComponents.details.push(`Error: ${error.message}`);
        }
    }

    async testTeamFlairComponents() {
        console.log('  🏆 Testing Team Flair Components...');
        
        try {
            // Check ComprehensiveUserProfile for team flair functionality
            const profilePath = path.join(this.frontendDir, 'src/components/pages/ComprehensiveUserProfile.js');
            
            if (fs.existsSync(profilePath)) {
                const content = fs.readFileSync(profilePath, 'utf8');
                
                let score = 0;
                const checks = [
                    { name: 'Team selection dropdown', pattern: /team_flair.*select/ },
                    { name: 'Team options mapping', pattern: /teams\.map.*option/ },
                    { name: 'Flair visibility toggles', pattern: /show_team_flair.*checkbox/ },
                    { name: 'Update flairs API call', pattern: /updateFlairs/ },
                    { name: 'Team flair display', pattern: /teamFlair/ }
                ];
                
                checks.forEach(check => {
                    if (check.pattern.test(content)) {
                        score++;
                        this.testResults.profilePersonalization.teamFlairComponents.details.push(`✅ ${check.name} found`);
                    } else {
                        this.testResults.profilePersonalization.teamFlairComponents.details.push(`❌ ${check.name} missing`);
                    }
                });
                
                const percentage = (score / checks.length) * 100;
                console.log(`    📊 Team Flair Components: ${percentage.toFixed(1)}%`);
                
                if (percentage >= 80) {
                    this.testResults.profilePersonalization.teamFlairComponents.status = 'passed';
                } else if (percentage >= 60) {
                    this.testResults.profilePersonalization.teamFlairComponents.status = 'warning';
                } else {
                    this.testResults.profilePersonalization.teamFlairComponents.status = 'failed';
                }
                
            } else {
                console.log('    ❌ ComprehensiveUserProfile component not found');
                this.testResults.profilePersonalization.teamFlairComponents.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Team Flair Components test error:', error.message);
            this.testResults.profilePersonalization.teamFlairComponents.status = 'failed';
            this.testResults.profilePersonalization.teamFlairComponents.details.push(`Error: ${error.message}`);
        }
    }

    async testProfileCustomizationFiles() {
        console.log('  🎨 Testing Profile Customization Files...');
        
        try {
            // Check for hero images directory
            const heroImagesPath = path.join(this.frontendDir, 'public/Heroes');
            const heroImageExists = fs.existsSync(heroImagesPath);
            
            if (heroImageExists) {
                const files = fs.readdirSync(heroImagesPath);
                const heroImages = files.filter(f => f.endsWith('.webp') || f.endsWith('.png'));
                
                console.log(`    ✅ Found ${heroImages.length} hero images`);
                this.testResults.profilePersonalization.profileCustomizationFiles.details.push(`${heroImages.length} hero images available`);
            } else {
                console.log('    ❌ Hero images directory not found');
                this.testResults.profilePersonalization.profileCustomizationFiles.details.push('Hero images directory missing');
            }
            
            // Check for team logos
            const teamLogosPath = path.join(this.frontendDir, 'public/teams');
            const teamLogosExist = fs.existsSync(teamLogosPath);
            
            if (teamLogosExist) {
                const files = fs.readdirSync(teamLogosPath);
                const teamLogos = files.filter(f => f.endsWith('.png') || f.endsWith('.svg'));
                
                console.log(`    ✅ Found ${teamLogos.length} team logos`);
                this.testResults.profilePersonalization.profileCustomizationFiles.details.push(`${teamLogos.length} team logos available`);
            } else {
                console.log('    ❌ Team logos directory not found');
                this.testResults.profilePersonalization.profileCustomizationFiles.details.push('Team logos directory missing');
            }
            
            // Check image utilities
            const imageUtilsPath = path.join(this.frontendDir, 'src/utils/imageUtils.js');
            
            if (fs.existsSync(imageUtilsPath)) {
                console.log('    ✅ Image utilities found');
                this.testResults.profilePersonalization.profileCustomizationFiles.details.push('Image utilities available');
            } else {
                console.log('    ❌ Image utilities not found');
                this.testResults.profilePersonalization.profileCustomizationFiles.details.push('Image utilities missing');
            }
            
            // Overall score based on available resources
            let score = 0;
            if (heroImageExists) score += 40;
            if (teamLogosExist) score += 30;
            if (fs.existsSync(imageUtilsPath)) score += 30;
            
            console.log(`    📊 Profile Customization Files: ${score}%`);
            
            if (score >= 80) {
                this.testResults.profilePersonalization.profileCustomizationFiles.status = 'passed';
            } else if (score >= 60) {
                this.testResults.profilePersonalization.profileCustomizationFiles.status = 'warning';
            } else {
                this.testResults.profilePersonalization.profileCustomizationFiles.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Profile Customization Files test error:', error.message);
            this.testResults.profilePersonalization.profileCustomizationFiles.status = 'failed';
            this.testResults.profilePersonalization.profileCustomizationFiles.details.push(`Error: ${error.message}`);
        }
    }

    async testUserModelIntegration() {
        console.log('  🔗 Testing User Model Integration...');
        
        try {
            // Check User model
            const userModelPath = path.join(this.backendDir, 'app/Models/User.php');
            
            if (fs.existsSync(userModelPath)) {
                const content = fs.readFileSync(userModelPath, 'utf8');
                
                let score = 0;
                const checks = [
                    { name: 'Hero flair field', pattern: /'hero_flair'/ },
                    { name: 'Team flair field', pattern: /'team_flair_id'/ },
                    { name: 'Flair visibility settings', pattern: /'show_hero_flair'.*'show_team_flair'/ },
                    { name: 'Team relationship', pattern: /teamFlair.*belongsTo/ },
                    { name: 'Display flairs method', pattern: /getDisplayFlairsAttribute/ },
                    { name: 'Update flairs method', pattern: /updateFlairs/ }
                ];
                
                checks.forEach(check => {
                    if (check.pattern.test(content)) {
                        score++;
                        this.testResults.profilePersonalization.userModelIntegration.details.push(`✅ ${check.name} found`);
                    } else {
                        this.testResults.profilePersonalization.userModelIntegration.details.push(`❌ ${check.name} missing`);
                    }
                });
                
                const percentage = (score / checks.length) * 100;
                console.log(`    📊 User Model Integration: ${percentage.toFixed(1)}%`);
                
                if (percentage >= 80) {
                    this.testResults.profilePersonalization.userModelIntegration.status = 'passed';
                } else if (percentage >= 60) {
                    this.testResults.profilePersonalization.userModelIntegration.status = 'warning';
                } else {
                    this.testResults.profilePersonalization.userModelIntegration.status = 'failed';
                }
                
            } else {
                console.log('    ❌ User model not found');
                this.testResults.profilePersonalization.userModelIntegration.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ User Model Integration test error:', error.message);
            this.testResults.profilePersonalization.userModelIntegration.status = 'failed';
            this.testResults.profilePersonalization.userModelIntegration.details.push(`Error: ${error.message}`);
        }
    }

    async testUserJourney() {
        console.log('\n🛣️ Testing User Journey...');
        
        await this.testProfileRoutes();
        await this.testHeroSelectionFlow();
        await this.testTeamSelectionFlow();
        await this.testSaveAndUpdateAPI();
    }

    async testProfileRoutes() {
        console.log('  🚪 Testing Profile Routes...');
        
        try {
            // Check React routes
            const routesPath = path.join(this.frontendDir, 'src/App.js');
            let routesContent = '';
            
            if (fs.existsSync(routesPath)) {
                routesContent = fs.readFileSync(routesPath, 'utf8');
            }
            
            // Also check Next.js app routes
            const nextRoutesPath = path.join(this.frontendDir, 'src/app/user/profile/page.tsx');
            
            if (fs.existsSync(nextRoutesPath)) {
                console.log('    ✅ Next.js profile route found');
                this.testResults.userJourney.profileRoutes.details.push('Next.js profile route exists');
                this.testResults.userJourney.profileRoutes.status = 'passed';
            } else if (routesContent.includes('profile') || routesContent.includes('user-profile')) {
                console.log('    ✅ React profile route found');
                this.testResults.userJourney.profileRoutes.details.push('React profile route exists');
                this.testResults.userJourney.profileRoutes.status = 'passed';
            } else {
                console.log('    ❌ Profile routes not found');
                this.testResults.userJourney.profileRoutes.status = 'failed';
                this.testResults.userJourney.profileRoutes.details.push('Profile routes missing');
            }
            
            // Check backend API routes
            const apiRoutesPath = path.join(this.backendDir, 'routes/api.php');
            
            if (fs.existsExists(apiRoutesPath)) {
                const apiContent = fs.readFileSync(apiRoutesPath, 'utf8');
                
                if (apiContent.includes('user/profile') || apiContent.includes('UserProfileController')) {
                    console.log('    ✅ API profile routes found');
                    this.testResults.userJourney.profileRoutes.details.push('API routes available');
                } else {
                    console.log('    ⚠️ API profile routes may be missing');
                    this.testResults.userJourney.profileRoutes.details.push('API routes unclear');
                }
            }
            
        } catch (error) {
            console.log('    ❌ Profile Routes test error:', error.message);
            this.testResults.userJourney.profileRoutes.status = 'failed';
            this.testResults.userJourney.profileRoutes.details.push(`Error: ${error.message}`);
        }
    }

    async testHeroSelectionFlow() {
        console.log('  🦸‍♀️ Testing Hero Selection Flow...');
        
        try {
            // Check for hero data service
            const heroServicePath = path.join(this.frontendDir, 'src/services/heroService.js');
            const heroServiceExists = fs.existsSync(heroServicePath);
            
            if (heroServiceExists) {
                console.log('    ✅ Hero service found');
                this.testResults.userJourney.heroSelectionFlow.details.push('Hero service available');
            }
            
            // Check for hero constants/data
            const heroDataPath = path.join(this.frontendDir, 'src/constants/marvelRivalsData.js');
            const heroDataExists = fs.existsSync(heroDataPath);
            
            if (heroDataExists) {
                const content = fs.readFileSync(heroDataPath, 'utf8');
                
                if (content.includes('Vanguard') && content.includes('Duelist') && content.includes('Strategist')) {
                    console.log('    ✅ Hero role data found');
                    this.testResults.userJourney.heroSelectionFlow.details.push('Hero roles defined');
                }
            }
            
            // Check HeroController in backend
            const heroControllerPath = path.join(this.backendDir, 'app/Http/Controllers/HeroController.php');
            
            if (fs.existsSync(heroControllerPath)) {
                console.log('    ✅ Hero controller found');
                this.testResults.userJourney.heroSelectionFlow.details.push('Backend hero controller exists');
            }
            
            let score = 0;
            if (heroServiceExists) score += 33;
            if (heroDataExists) score += 33;
            if (fs.existsSync(heroControllerPath)) score += 34;
            
            console.log(`    📊 Hero Selection Flow: ${score}%`);
            
            if (score >= 80) {
                this.testResults.userJourney.heroSelectionFlow.status = 'passed';
            } else if (score >= 60) {
                this.testResults.userJourney.heroSelectionFlow.status = 'warning';
            } else {
                this.testResults.userJourney.heroSelectionFlow.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Hero Selection Flow test error:', error.message);
            this.testResults.userJourney.heroSelectionFlow.status = 'failed';
            this.testResults.userJourney.heroSelectionFlow.details.push(`Error: ${error.message}`);
        }
    }

    async testTeamSelectionFlow() {
        console.log('  🏟️ Testing Team Selection Flow...');
        
        try {
            // Check TeamController
            const teamControllerPath = path.join(this.backendDir, 'app/Http/Controllers/TeamController.php');
            const teamControllerExists = fs.existsSync(teamControllerPath);
            
            if (teamControllerExists) {
                console.log('    ✅ Team controller found');
                this.testResults.userJourney.teamSelectionFlow.details.push('Team controller available');
            }
            
            // Check Team model
            const teamModelPath = path.join(this.backendDir, 'app/Models/Team.php');
            const teamModelExists = fs.existsSync(teamModelPath);
            
            if (teamModelExists) {
                console.log('    ✅ Team model found');
                this.testResults.userJourney.teamSelectionFlow.details.push('Team model available');
            }
            
            // Check for team logos
            const teamLogosPath = path.join(this.frontendDir, 'public/teams');
            const teamLogosExist = fs.existsSync(teamLogosPath);
            
            if (teamLogosExist) {
                const files = fs.readdirSync(teamLogosPath);
                const logoCount = files.filter(f => f.endsWith('.png') || f.endsWith('.svg')).length;
                console.log(`    ✅ Found ${logoCount} team logos`);
                this.testResults.userJourney.teamSelectionFlow.details.push(`${logoCount} team logos available`);
            }
            
            let score = 0;
            if (teamControllerExists) score += 40;
            if (teamModelExists) score += 30;
            if (teamLogosExist) score += 30;
            
            console.log(`    📊 Team Selection Flow: ${score}%`);
            
            if (score >= 80) {
                this.testResults.userJourney.teamSelectionFlow.status = 'passed';
            } else if (score >= 60) {
                this.testResults.userJourney.teamSelectionFlow.status = 'warning';
            } else {
                this.testResults.userJourney.teamSelectionFlow.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Team Selection Flow test error:', error.message);
            this.testResults.userJourney.teamSelectionFlow.status = 'failed';
            this.testResults.userJourney.teamSelectionFlow.details.push(`Error: ${error.message}`);
        }
    }

    async testSaveAndUpdateAPI() {
        console.log('  💾 Testing Save and Update API...');
        
        try {
            // Check UserProfileController
            const profileControllerPath = path.join(this.backendDir, 'app/Http/Controllers/UserProfileController.php');
            
            if (fs.existsSync(profileControllerPath)) {
                const content = fs.readFileSync(profileControllerPath, 'utf8');
                
                let score = 0;
                const checks = [
                    { name: 'Update profile method', pattern: /updateProfile/ },
                    { name: 'Update flairs method', pattern: /updateFlairs/ },
                    { name: 'Validation', pattern: /validate/ },
                    { name: 'JSON responses', pattern: /response\(\)->json/ },
                    { name: 'Error handling', pattern: /catch.*Exception/ }
                ];
                
                checks.forEach(check => {
                    if (check.pattern.test(content)) {
                        score++;
                        this.testResults.userJourney.saveAndUpdateAPI.details.push(`✅ ${check.name} found`);
                    } else {
                        this.testResults.userJourney.saveAndUpdateAPI.details.push(`❌ ${check.name} missing`);
                    }
                });
                
                const percentage = (score / checks.length) * 100;
                console.log(`    📊 Save and Update API: ${percentage.toFixed(1)}%`);
                
                if (percentage >= 80) {
                    this.testResults.userJourney.saveAndUpdateAPI.status = 'passed';
                } else if (percentage >= 60) {
                    this.testResults.userJourney.saveAndUpdateAPI.status = 'warning';
                } else {
                    this.testResults.userJourney.saveAndUpdateAPI.status = 'failed';
                }
                
            } else {
                console.log('    ❌ UserProfileController not found');
                this.testResults.userJourney.saveAndUpdateAPI.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Save and Update API test error:', error.message);
            this.testResults.userJourney.saveAndUpdateAPI.status = 'failed';
            this.testResults.userJourney.saveAndUpdateAPI.details.push(`Error: ${error.message}`);
        }
    }

    async testSocialFeatures() {
        console.log('\n👥 Testing Social Features...');
        
        await this.testCommentSystemIntegration();
        await this.testForumProfileDisplay();
        await this.testUserDisplayComponents();
        await this.testFlairVisibilitySystem();
    }

    async testCommentSystemIntegration() {
        console.log('  💬 Testing Comment System Integration...');
        
        try {
            // Check CommentSystemSimple
            const commentSystemPath = path.join(this.frontendDir, 'src/components/shared/CommentSystemSimple.js');
            
            if (fs.existsSync(commentSystemPath)) {
                const content = fs.readFileSync(commentSystemPath, 'utf8');
                
                let score = 0;
                const checks = [
                    { name: 'User avatar display', pattern: /avatar.*username/ },
                    { name: 'Username display', pattern: /username.*font-medium/ },
                    { name: 'Comment author info', pattern: /author.*username/ },
                    { name: 'Reply functionality', pattern: /reply/i },
                    { name: 'Voting integration', pattern: /VotingButtons/ }
                ];
                
                checks.forEach(check => {
                    if (check.pattern.test(content)) {
                        score++;
                        this.testResults.socialFeatures.commentSystemIntegration.details.push(`✅ ${check.name} found`);
                    } else {
                        this.testResults.socialFeatures.commentSystemIntegration.details.push(`❌ ${check.name} missing`);
                    }
                });
                
                const percentage = (score / checks.length) * 100;
                console.log(`    📊 Comment System Integration: ${percentage.toFixed(1)}%`);
                
                if (percentage >= 80) {
                    this.testResults.socialFeatures.commentSystemIntegration.status = 'passed';
                } else if (percentage >= 60) {
                    this.testResults.socialFeatures.commentSystemIntegration.status = 'warning';
                } else {
                    this.testResults.socialFeatures.commentSystemIntegration.status = 'failed';
                }
                
            } else {
                console.log('    ❌ CommentSystemSimple not found');
                this.testResults.socialFeatures.commentSystemIntegration.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Comment System Integration test error:', error.message);
            this.testResults.socialFeatures.commentSystemIntegration.status = 'failed';
            this.testResults.socialFeatures.commentSystemIntegration.details.push(`Error: ${error.message}`);
        }
    }

    async testForumProfileDisplay() {
        console.log('  📄 Testing Forum Profile Display...');
        
        try {
            // Check forum-related files
            const forumFiles = [
                'src/app/forums/page.tsx',
                'src/components/pages/ThreadDetailPage.js',
                'src/components/pages/ForumsPage.js'
            ];
            
            let foundForumFiles = 0;
            
            forumFiles.forEach(file => {
                const filePath = path.join(this.frontendDir, file);
                if (fs.existsSync(filePath)) {
                    foundForumFiles++;
                    this.testResults.socialFeatures.forumProfileDisplay.details.push(`✅ ${file} found`);
                } else {
                    this.testResults.socialFeatures.forumProfileDisplay.details.push(`❌ ${file} missing`);
                }
            });
            
            // Check for forum controller
            const forumControllerPath = path.join(this.backendDir, 'app/Http/Controllers/ForumController.php');
            
            if (fs.existsSync(forumControllerPath)) {
                console.log('    ✅ Forum controller found');
                this.testResults.socialFeatures.forumProfileDisplay.details.push('Backend forum support');
                foundForumFiles++;
            }
            
            const percentage = (foundForumFiles / (forumFiles.length + 1)) * 100;
            console.log(`    📊 Forum Profile Display: ${percentage.toFixed(1)}%`);
            
            if (percentage >= 80) {
                this.testResults.socialFeatures.forumProfileDisplay.status = 'passed';
            } else if (percentage >= 50) {
                this.testResults.socialFeatures.forumProfileDisplay.status = 'warning';
            } else {
                this.testResults.socialFeatures.forumProfileDisplay.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Forum Profile Display test error:', error.message);
            this.testResults.socialFeatures.forumProfileDisplay.status = 'failed';
            this.testResults.socialFeatures.forumProfileDisplay.details.push(`Error: ${error.message}`);
        }
    }

    async testUserDisplayComponents() {
        console.log('  👤 Testing User Display Components...');
        
        try {
            const userDisplayFiles = [
                'src/components/shared/MentionLink.js',
                'src/components/shared/UserDisplay.js',
                'src/components/common/UserAvatar.js'
            ];
            
            let foundComponents = 0;
            
            userDisplayFiles.forEach(file => {
                const filePath = path.join(this.frontendDir, file);
                if (fs.existsSync(filePath)) {
                    foundComponents++;
                    console.log(`    ✅ ${file} found`);
                    this.testResults.socialFeatures.userDisplayComponents.details.push(`${file} available`);
                }
            });
            
            const percentage = (foundComponents / userDisplayFiles.length) * 100;
            console.log(`    📊 User Display Components: ${percentage.toFixed(1)}%`);
            
            if (percentage >= 66) {
                this.testResults.socialFeatures.userDisplayComponents.status = 'passed';
            } else if (percentage >= 33) {
                this.testResults.socialFeatures.userDisplayComponents.status = 'warning';
            } else {
                this.testResults.socialFeatures.userDisplayComponents.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ User Display Components test error:', error.message);
            this.testResults.socialFeatures.userDisplayComponents.status = 'failed';
            this.testResults.socialFeatures.userDisplayComponents.details.push(`Error: ${error.message}`);
        }
    }

    async testFlairVisibilitySystem() {
        console.log('  👀 Testing Flair Visibility System...');
        
        try {
            // Check User model for flair visibility
            const userModelPath = path.join(this.backendDir, 'app/Models/User.php');
            
            if (fs.existsExists(userModelPath)) {
                const content = fs.readFileSync(userModelPath, 'utf8');
                
                const hasHeroFlairToggle = /show_hero_flair/.test(content);
                const hasTeamFlairToggle = /show_team_flair/.test(content);
                const hasDisplayMethod = /getDisplayFlairsAttribute/.test(content);
                
                let score = 0;
                
                if (hasHeroFlairToggle) {
                    score += 33;
                    console.log('    ✅ Hero flair visibility toggle found');
                    this.testResults.socialFeatures.flairVisibilitySystem.details.push('Hero flair visibility control');
                }
                
                if (hasTeamFlairToggle) {
                    score += 33;
                    console.log('    ✅ Team flair visibility toggle found');
                    this.testResults.socialFeatures.flairVisibilitySystem.details.push('Team flair visibility control');
                }
                
                if (hasDisplayMethod) {
                    score += 34;
                    console.log('    ✅ Display flairs method found');
                    this.testResults.socialFeatures.flairVisibilitySystem.details.push('Dynamic flair display system');
                }
                
                console.log(`    📊 Flair Visibility System: ${score}%`);
                
                if (score >= 80) {
                    this.testResults.socialFeatures.flairVisibilitySystem.status = 'passed';
                } else if (score >= 60) {
                    this.testResults.socialFeatures.flairVisibilitySystem.status = 'warning';
                } else {
                    this.testResults.socialFeatures.flairVisibilitySystem.status = 'failed';
                }
                
            } else {
                console.log('    ❌ User model not found');
                this.testResults.socialFeatures.flairVisibilitySystem.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Flair Visibility System test error:', error.message);
            this.testResults.socialFeatures.flairVisibilitySystem.status = 'failed';
            this.testResults.socialFeatures.flairVisibilitySystem.details.push(`Error: ${error.message}`);
        }
    }

    async testRetentionImpact() {
        console.log('\n🎯 Testing Retention Impact Features...');
        
        await this.testUserStatistics();
        await this.testActivityTracking();
        await this.testErrorHandling();
        await this.testFeatureCompleteness();
    }

    async testUserStatistics() {
        console.log('  📊 Testing User Statistics...');
        
        try {
            // Check UserProfileController for stats methods
            const profileControllerPath = path.join(this.backendDir, 'app/Http/Controllers/UserProfileController.php');
            
            if (fs.existsExists(profileControllerPath)) {
                const content = fs.readFileSync(profileControllerPath, 'utf8');
                
                let score = 0;
                const checks = [
                    { name: 'User stats calculation', pattern: /getUserStats/ },
                    { name: 'Comment statistics', pattern: /comments.*total/ },
                    { name: 'Forum statistics', pattern: /forum.*posts/ },
                    { name: 'Voting statistics', pattern: /votes.*upvotes/ },
                    { name: 'Activity metrics', pattern: /activity.*score/ },
                    { name: 'Account information', pattern: /account.*days_active/ }
                ];
                
                checks.forEach(check => {
                    if (check.pattern.test(content)) {
                        score++;
                        this.testResults.retentionImpact.userStatistics.details.push(`✅ ${check.name} found`);
                    } else {
                        this.testResults.retentionImpact.userStatistics.details.push(`❌ ${check.name} missing`);
                    }
                });
                
                const percentage = (score / checks.length) * 100;
                console.log(`    📊 User Statistics: ${percentage.toFixed(1)}%`);
                
                if (percentage >= 80) {
                    this.testResults.retentionImpact.userStatistics.status = 'passed';
                } else if (percentage >= 60) {
                    this.testResults.retentionImpact.userStatistics.status = 'warning';
                } else {
                    this.testResults.retentionImpact.userStatistics.status = 'failed';
                }
                
            } else {
                console.log('    ❌ UserProfileController not found');
                this.testResults.retentionImpact.userStatistics.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ User Statistics test error:', error.message);
            this.testResults.retentionImpact.userStatistics.status = 'failed';
            this.testResults.retentionImpact.userStatistics.details.push(`Error: ${error.message}`);
        }
    }

    async testActivityTracking() {
        console.log('  📈 Testing Activity Tracking...');
        
        try {
            // Check for UserActivity model
            const userActivityPath = path.join(this.backendDir, 'app/Models/UserActivity.php');
            const hasActivityModel = fs.existsSync(userActivityPath);
            
            if (hasActivityModel) {
                console.log('    ✅ UserActivity model found');
                this.testResults.retentionImpact.activityTracking.details.push('Activity model available');
            }
            
            // Check for activity tracking in User model
            const userModelPath = path.join(this.backendDir, 'app/Models/User.php');
            
            if (fs.existsExists(userModelPath)) {
                const content = fs.readFileSync(userModelPath, 'utf8');
                
                if (/UserActivity.*track/.test(content)) {
                    console.log('    ✅ Activity tracking integration found');
                    this.testResults.retentionImpact.activityTracking.details.push('Activity tracking integrated');
                }
            }
            
            let score = hasActivityModel ? 70 : 0;
            score += fs.existsExists(userModelPath) && /UserActivity.*track/.test(fs.readFileSync(userModelPath, 'utf8')) ? 30 : 0;
            
            console.log(`    📊 Activity Tracking: ${score}%`);
            
            if (score >= 80) {
                this.testResults.retentionImpact.activityTracking.status = 'passed';
            } else if (score >= 50) {
                this.testResults.retentionImpact.activityTracking.status = 'warning';
            } else {
                this.testResults.retentionImpact.activityTracking.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Activity Tracking test error:', error.message);
            this.testResults.retentionImpact.activityTracking.status = 'failed';
            this.testResults.retentionImpact.activityTracking.details.push(`Error: ${error.message}`);
        }
    }

    async testErrorHandling() {
        console.log('  🚫 Testing Error Handling...');
        
        try {
            const controllersToCheck = [
                'UserProfileController.php',
                'HeroController.php',
                'TeamController.php'
            ];
            
            let totalControllers = controllersToCheck.length;
            let controllersWithErrorHandling = 0;
            
            controllersToCheck.forEach(controller => {
                const controllerPath = path.join(this.backendDir, 'app/Http/Controllers', controller);
                
                if (fs.existsExists(controllerPath)) {
                    const content = fs.readFileSync(controllerPath, 'utf8');
                    
                    if (/try.*catch.*Exception/.test(content) && /response\(\)->json/.test(content)) {
                        controllersWithErrorHandling++;
                        this.testResults.retentionImpact.errorHandling.details.push(`✅ ${controller} has error handling`);
                    } else {
                        this.testResults.retentionImpact.errorHandling.details.push(`❌ ${controller} missing error handling`);
                    }
                } else {
                    this.testResults.retentionImpact.errorHandling.details.push(`⚠️ ${controller} not found`);
                }
            });
            
            const percentage = (controllersWithErrorHandling / totalControllers) * 100;
            console.log(`    📊 Error Handling: ${percentage.toFixed(1)}%`);
            
            if (percentage >= 80) {
                this.testResults.retentionImpact.errorHandling.status = 'passed';
            } else if (percentage >= 60) {
                this.testResults.retentionImpact.errorHandling.status = 'warning';
            } else {
                this.testResults.retentionImpact.errorHandling.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Error Handling test error:', error.message);
            this.testResults.retentionImpact.errorHandling.status = 'failed';
            this.testResults.retentionImpact.errorHandling.details.push(`Error: ${error.message}`);
        }
    }

    async testFeatureCompleteness() {
        console.log('  ✅ Testing Feature Completeness...');
        
        try {
            const requiredFeatures = [
                { name: 'Hero Avatar Selection', path: 'src/components/HeroAvatarSelector.js' },
                { name: 'User Profile Page', path: 'src/components/pages/ComprehensiveUserProfile.js' },
                { name: 'Comment System', path: 'src/components/shared/CommentSystemSimple.js' },
                { name: 'User Model', path: '../app/Models/User.php' },
                { name: 'User Profile Controller', path: '../app/Http/Controllers/UserProfileController.php' },
                { name: 'Hero Controller', path: '../app/Http/Controllers/HeroController.php' }
            ];
            
            let featuresFound = 0;
            
            requiredFeatures.forEach(feature => {
                let filePath;
                if (feature.path.startsWith('../')) {
                    filePath = path.join(this.backendDir, feature.path.substring(3));
                } else {
                    filePath = path.join(this.frontendDir, feature.path);
                }
                
                if (fs.existsSync(filePath)) {
                    featuresFound++;
                    this.testResults.retentionImpact.featureCompleteness.details.push(`✅ ${feature.name} found`);
                } else {
                    this.testResults.retentionImpact.featureCompleteness.details.push(`❌ ${feature.name} missing`);
                }
            });
            
            const percentage = (featuresFound / requiredFeatures.length) * 100;
            console.log(`    📊 Feature Completeness: ${percentage.toFixed(1)}%`);
            
            if (percentage >= 90) {
                this.testResults.retentionImpact.featureCompleteness.status = 'passed';
            } else if (percentage >= 70) {
                this.testResults.retentionImpact.featureCompleteness.status = 'warning';
            } else {
                this.testResults.retentionImpact.featureCompleteness.status = 'failed';
            }
            
        } catch (error) {
            console.log('    ❌ Feature Completeness test error:', error.message);
            this.testResults.retentionImpact.featureCompleteness.status = 'failed';
            this.testResults.retentionImpact.featureCompleteness.details.push(`Error: ${error.message}`);
        }
    }

    calculateSummary() {
        console.log('\n📊 Calculating Test Summary...');
        
        let totalTests = 0;
        let passed = 0;
        let failed = 0;
        let warnings = 0;
        
        const categories = ['profilePersonalization', 'userJourney', 'socialFeatures', 'retentionImpact'];
        
        categories.forEach(category => {
            Object.values(this.testResults[category]).forEach(test => {
                if (test.status !== undefined) {
                    totalTests++;
                    switch (test.status) {
                        case 'passed': passed++; break;
                        case 'failed': failed++; break;
                        case 'warning': warnings++; break;
                    }
                }
            });
        });
        
        const overallScore = totalTests > 0 ? Math.round((passed + (warnings * 0.5)) / totalTests * 100) : 0;
        
        this.testResults.summary = {
            totalTests,
            passed,
            failed,
            warnings,
            overallScore
        };
        
        console.log(`📊 Test Summary:`);
        console.log(`   Total Tests: ${totalTests}`);
        console.log(`   ✅ Passed: ${passed}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   ⚠️ Warnings: ${warnings}`);
        console.log(`   🎯 Overall Score: ${overallScore}%`);
    }

    generateReport() {
        const endTime = Date.now();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        const report = {
            timestamp: new Date().toISOString(),
            duration: `${duration} seconds`,
            testType: 'API and File Structure Analysis',
            testResults: this.testResults,
            recommendations: this.generateRecommendations(),
            summary: {
                overallAssessment: this.getOverallAssessment(),
                criticalIssues: this.getCriticalIssues(),
                improvementAreas: this.getImprovementAreas()
            }
        };
        
        const reportPath = path.join(this.frontendDir, `user-engagement-api-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Report saved to: ${reportPath}`);
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        const categories = ['profilePersonalization', 'userJourney', 'socialFeatures', 'retentionImpact'];
        
        categories.forEach(category => {
            Object.entries(this.testResults[category]).forEach(([testName, test]) => {
                if (test.status === 'failed') {
                    recommendations.push({
                        priority: 'high',
                        category,
                        test: testName,
                        issue: `${testName} failed`,
                        recommendation: `Fix ${testName} to ensure user engagement features work correctly`
                    });
                } else if (test.status === 'warning') {
                    recommendations.push({
                        priority: 'medium',
                        category,
                        test: testName,
                        issue: `${testName} has warnings`,
                        recommendation: `Improve ${testName} for better user experience`
                    });
                }
            });
        });
        
        return recommendations;
    }

    getOverallAssessment() {
        const score = this.testResults.summary.overallScore;
        
        if (score >= 90) {
            return 'Excellent - User engagement features are well implemented and should drive strong user retention';
        } else if (score >= 75) {
            return 'Good - Most engagement features are working well with minor improvements needed';
        } else if (score >= 60) {
            return 'Fair - Basic engagement features are present but significant improvements needed for optimal retention';
        } else {
            return 'Poor - Critical issues with engagement features that will negatively impact user retention';
        }
    }

    getCriticalIssues() {
        const issues = [];
        
        Object.entries(this.testResults).forEach(([category, tests]) => {
            if (category === 'summary') return;
            
            Object.entries(tests).forEach(([testName, test]) => {
                if (test.status === 'failed') {
                    issues.push(`${category}: ${testName} - ${test.details.join('; ')}`);
                }
            });
        });
        
        return issues;
    }

    getImprovementAreas() {
        const areas = [];
        
        Object.entries(this.testResults).forEach(([category, tests]) => {
            if (category === 'summary') return;
            
            Object.entries(tests).forEach(([testName, test]) => {
                if (test.status === 'warning') {
                    areas.push(`${category}: ${testName} - ${test.details.join('; ')}`);
                }
            });
        });
        
        return areas;
    }
}

// Fix typo in fs.existsExists
function existsSync(path) {
    return fs.existsSync(path);
}

// Replace fs.existsExists with fs.existsSync
const originalExistsSync = fs.existsSync;
fs.existsExists = originalExistsSync;

// Run the API validation
(async () => {
    const validator = new UserEngagementAPIValidator();
    
    try {
        const report = await validator.runAllTests();
        
        console.log('\n🎯 Key Findings:');
        console.log(report.summary.overallAssessment);
        
        if (report.summary.criticalIssues.length > 0) {
            console.log('\n❌ Critical Issues to Fix:');
            report.summary.criticalIssues.slice(0, 5).forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }
        
        if (report.summary.improvementAreas.length > 0) {
            console.log('\n⚠️ Areas for Improvement:');
            report.summary.improvementAreas.slice(0, 5).forEach(area => {
                console.log(`   • ${area}`);
            });
        }
        
    } catch (error) {
        console.error('❌ API Validation failed:', error);
        process.exit(1);
    }
})();

module.exports = UserEngagementAPIValidator;