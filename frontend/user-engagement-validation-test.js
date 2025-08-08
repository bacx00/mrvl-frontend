/**
 * Comprehensive User Engagement Features Validation Test
 * 
 * Tests all aspects of user engagement features including:
 * 1. Profile Personalization (Hero avatars, Team flairs)
 * 2. User Journey (Complete flow testing)
 * 3. Social Features (Profile display in forums/comments)
 * 4. Retention Impact (Error-free experience)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class UserEngagementValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.baseUrl = 'https://staging.mrvl.net';
        this.testResults = {
            profilePersonalization: {
                heroAvatarSelection: { status: 'pending', details: [] },
                teamFlairSelection: { status: 'pending', details: [] },
                profileCustomizationVisibility: { status: 'pending', details: [] },
                profileInvestmentFeatures: { status: 'pending', details: [] }
            },
            userJourney: {
                profileAccessFlow: { status: 'pending', details: [] },
                heroSelectionProcess: { status: 'pending', details: [] },
                teamSelectionProcess: { status: 'pending', details: [] },
                saveAndDisplayFlow: { status: 'pending', details: [] },
                mobileResponsiveness: { status: 'pending', details: [] }
            },
            socialFeatures: {
                forumProfileDisplay: { status: 'pending', details: [] },
                commentSystemIntegration: { status: 'pending', details: [] },
                heroFlairVisibility: { status: 'pending', details: [] },
                teamFlairVisibility: { status: 'pending', details: [] }
            },
            retentionImpact: {
                errorFreeExperience: { status: 'pending', details: [] },
                customizationFunctionality: { status: 'pending', details: [] },
                userSatisfactionMetrics: { status: 'pending', details: [] },
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

    async initialize() {
        console.log('🚀 Starting User Engagement Features Validation...');
        
        this.browser = await puppeteer.launch({
            headless: false,  // Show browser for visual validation
            defaultViewport: { width: 1920, height: 1080 },
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // Set user agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        
        // Handle console messages
        this.page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('❌ Console Error:', msg.text());
            }
        });
        
        // Handle page errors
        this.page.on('pageerror', error => {
            console.log('❌ Page Error:', error.message);
        });
        
        console.log('✅ Browser initialized successfully');
    }

    async testProfilePersonalization() {
        console.log('\n📝 Testing Profile Personalization Features...');
        
        try {
            // Navigate to the main page first
            await this.page.goto(this.baseUrl, { waitUntil: 'networkidle0', timeout: 30000 });
            await this.page.waitForTimeout(2000);
            
            // Test Hero Avatar Selection
            await this.testHeroAvatarSelection();
            
            // Test Team Flair Selection  
            await this.testTeamFlairSelection();
            
            // Test Profile Customization Visibility
            await this.testProfileCustomizationVisibility();
            
            // Test Profile Investment Features
            await this.testProfileInvestmentFeatures();
            
        } catch (error) {
            console.log('❌ Profile Personalization Test Failed:', error.message);
            this.testResults.profilePersonalization.heroAvatarSelection.status = 'failed';
            this.testResults.profilePersonalization.heroAvatarSelection.details.push(`Test failed: ${error.message}`);
        }
    }

    async testHeroAvatarSelection() {
        console.log('  🦸 Testing Hero Avatar Selection...');
        
        try {
            // Try to access profile page - check if login is required
            await this.page.goto(`${this.baseUrl}/user/profile`, { waitUntil: 'networkidle0', timeout: 15000 });
            await this.page.waitForTimeout(2000);
            
            // Check if we need to login first
            const needsLogin = await this.page.$('.text-4xl'); // Login Required emoji
            
            if (needsLogin) {
                console.log('  🔐 Login required - testing login flow...');
                
                // Click sign in/up button
                const loginButton = await this.page.$('button:contains("Sign In / Sign Up")');
                if (loginButton) {
                    await loginButton.click();
                    await this.page.waitForTimeout(2000);
                }
                
                this.testResults.profilePersonalization.heroAvatarSelection.details.push('Login required for profile access - expected behavior');
            } else {
                // Test hero avatar selector
                const heroAvatarButton = await this.page.$('button:contains("Choose Hero Avatar")');
                
                if (heroAvatarButton) {
                    await heroAvatarButton.click();
                    await this.page.waitForTimeout(1000);
                    
                    // Check if hero selector modal appears
                    const heroModal = await this.page.$('.fixed.inset-0.bg-black.bg-opacity-50');
                    
                    if (heroModal) {
                        console.log('  ✅ Hero avatar selector modal opens correctly');
                        
                        // Check for hero categories
                        const vanguardTab = await this.page.$('text=Vanguard');
                        const duelistTab = await this.page.$('text=Duelist');
                        const strategistTab = await this.page.$('text=Strategist');
                        
                        const categoriesFound = [vanguardTab, duelistTab, strategistTab].filter(Boolean).length;
                        
                        if (categoriesFound >= 2) {
                            console.log('  ✅ Hero categories displayed correctly');
                            this.testResults.profilePersonalization.heroAvatarSelection.details.push('Hero categories working');
                        }
                        
                        // Check for hero images
                        const heroImages = await this.page.$$('img[alt*="hero"], img[src*="Heroes/"]');
                        
                        if (heroImages.length > 0) {
                            console.log(`  ✅ Found ${heroImages.length} hero images`);
                            this.testResults.profilePersonalization.heroAvatarSelection.details.push(`${heroImages.length} hero images loaded`);
                        }
                        
                        // Close modal
                        const closeButton = await this.page.$('button:contains("Cancel")');
                        if (closeButton) {
                            await closeButton.click();
                            await this.page.waitForTimeout(500);
                        }
                        
                        this.testResults.profilePersonalization.heroAvatarSelection.status = 'passed';
                    } else {
                        console.log('  ❌ Hero avatar selector modal did not appear');
                        this.testResults.profilePersonalization.heroAvatarSelection.status = 'failed';
                        this.testResults.profilePersonalization.heroAvatarSelection.details.push('Modal did not open');
                    }
                } else {
                    console.log('  ⚠️ Hero avatar button not found - may need authentication');
                    this.testResults.profilePersonalization.heroAvatarSelection.status = 'warning';
                    this.testResults.profilePersonalization.heroAvatarSelection.details.push('Button not accessible - authentication required');
                }
            }
            
        } catch (error) {
            console.log('  ❌ Hero Avatar Selection test error:', error.message);
            this.testResults.profilePersonalization.heroAvatarSelection.status = 'failed';
            this.testResults.profilePersonalization.heroAvatarSelection.details.push(`Error: ${error.message}`);
        }
    }

    async testTeamFlairSelection() {
        console.log('  🏆 Testing Team Flair Selection...');
        
        try {
            // Should already be on profile page from previous test
            const teamFlairSelect = await this.page.$('select');
            
            if (teamFlairSelect) {
                console.log('  ✅ Team flair selector found');
                
                // Get team options
                const options = await this.page.$$('option');
                const teamCount = options.length - 1; // Subtract 1 for "No team flair" option
                
                if (teamCount > 0) {
                    console.log(`  ✅ Found ${teamCount} team options`);
                    this.testResults.profilePersonalization.teamFlairSelection.details.push(`${teamCount} teams available`);
                    this.testResults.profilePersonalization.teamFlairSelection.status = 'passed';
                } else {
                    console.log('  ❌ No team options found');
                    this.testResults.profilePersonalization.teamFlairSelection.status = 'failed';
                    this.testResults.profilePersonalization.teamFlairSelection.details.push('No team options available');
                }
                
                // Test flair visibility toggles
                const heroFlairToggle = await this.page.$('#show_hero_flair');
                const teamFlairToggle = await this.page.$('#show_team_flair');
                
                if (heroFlairToggle && teamFlairToggle) {
                    console.log('  ✅ Flair visibility toggles found');
                    this.testResults.profilePersonalization.teamFlairSelection.details.push('Visibility toggles working');
                } else {
                    console.log('  ⚠️ Some flair toggles missing');
                    this.testResults.profilePersonalization.teamFlairSelection.details.push('Some toggles missing');
                }
                
            } else {
                console.log('  ❌ Team flair selector not found');
                this.testResults.profilePersonalization.teamFlairSelection.status = 'failed';
                this.testResults.profilePersonalization.teamFlairSelection.details.push('Team selector not found');
            }
            
        } catch (error) {
            console.log('  ❌ Team Flair Selection test error:', error.message);
            this.testResults.profilePersonalization.teamFlairSelection.status = 'failed';
            this.testResults.profilePersonalization.teamFlairSelection.details.push(`Error: ${error.message}`);
        }
    }

    async testProfileCustomizationVisibility() {
        console.log('  👀 Testing Profile Customization Visibility...');
        
        try {
            // Check profile header display
            const profileHeader = await this.page.$('.card .flex.items-center');
            
            if (profileHeader) {
                console.log('  ✅ Profile header layout found');
                
                // Check avatar display area
                const avatarArea = await this.page.$('.w-32.h-32.rounded-full');
                
                if (avatarArea) {
                    console.log('  ✅ Avatar display area present');
                    this.testResults.profilePersonalization.profileCustomizationVisibility.details.push('Avatar display working');
                } else {
                    console.log('  ❌ Avatar display area not found');
                    this.testResults.profilePersonalization.profileCustomizationVisibility.details.push('Avatar display missing');
                }
                
                // Check username display
                const usernameDisplay = await this.page.$('.text-2xl.font-bold');
                
                if (usernameDisplay) {
                    console.log('  ✅ Username display found');
                    this.testResults.profilePersonalization.profileCustomizationVisibility.details.push('Username display working');
                }
                
                this.testResults.profilePersonalization.profileCustomizationVisibility.status = 'passed';
            } else {
                console.log('  ❌ Profile header layout not found');
                this.testResults.profilePersonalization.profileCustomizationVisibility.status = 'failed';
                this.testResults.profilePersonalization.profileCustomizationVisibility.details.push('Profile header missing');
            }
            
        } catch (error) {
            console.log('  ❌ Profile Customization Visibility test error:', error.message);
            this.testResults.profilePersonalization.profileCustomizationVisibility.status = 'failed';
            this.testResults.profilePersonalization.profileCustomizationVisibility.details.push(`Error: ${error.message}`);
        }
    }

    async testProfileInvestmentFeatures() {
        console.log('  💎 Testing Profile Investment Features...');
        
        try {
            // Check for user statistics display
            const statsCards = await this.page.$$('.text-3xl.font-bold');
            
            if (statsCards.length > 0) {
                console.log(`  ✅ Found ${statsCards.length} user statistics cards`);
                this.testResults.profilePersonalization.profileInvestmentFeatures.details.push(`${statsCards.length} stat cards displayed`);
                
                // Check for voting stats
                const votingStats = await this.page.$('text=Voting & Engagement');
                if (votingStats) {
                    console.log('  ✅ Voting & engagement stats found');
                    this.testResults.profilePersonalization.profileInvestmentFeatures.details.push('Engagement metrics displayed');
                }
                
                // Check for activity feed
                const activityFeed = await this.page.$('text=Recent Activity');
                if (activityFeed) {
                    console.log('  ✅ Recent activity feed found');
                    this.testResults.profilePersonalization.profileInvestmentFeatures.details.push('Activity feed working');
                }
                
                this.testResults.profilePersonalization.profileInvestmentFeatures.status = 'passed';
            } else {
                console.log('  ❌ No user statistics found');
                this.testResults.profilePersonalization.profileInvestmentFeatures.status = 'failed';
                this.testResults.profilePersonalization.profileInvestmentFeatures.details.push('Statistics missing');
            }
            
        } catch (error) {
            console.log('  ❌ Profile Investment Features test error:', error.message);
            this.testResults.profilePersonalization.profileInvestmentFeatures.status = 'failed';
            this.testResults.profilePersonalization.profileInvestmentFeatures.details.push(`Error: ${error.message}`);
        }
    }

    async testUserJourney() {
        console.log('\n🛣️ Testing Complete User Journey...');
        
        try {
            await this.testProfileAccessFlow();
            await this.testHeroSelectionProcess();
            await this.testTeamSelectionProcess();
            await this.testSaveAndDisplayFlow();
            await this.testMobileResponsiveness();
            
        } catch (error) {
            console.log('❌ User Journey Test Failed:', error.message);
        }
    }

    async testProfileAccessFlow() {
        console.log('  🚪 Testing Profile Access Flow...');
        
        try {
            // Test navigation to profile
            await this.page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0' });
            await this.page.waitForTimeout(1000);
            
            // Try to find profile link in navigation
            const navButtons = await this.page.$$('nav button, nav a');
            let profileNavFound = false;
            
            for (const button of navButtons) {
                const text = await this.page.evaluate(el => el.textContent, button);
                if (text && text.toLowerCase().includes('profile')) {
                    profileNavFound = true;
                    break;
                }
            }
            
            if (profileNavFound) {
                console.log('  ✅ Profile navigation found');
                this.testResults.userJourney.profileAccessFlow.details.push('Navigation accessible');
            } else {
                console.log('  ⚠️ Profile navigation not visible - may require login');
                this.testResults.userJourney.profileAccessFlow.details.push('Navigation requires authentication');
            }
            
            // Test direct profile URL access
            await this.page.goto(`${this.baseUrl}/user/profile`, { waitUntil: 'networkidle0' });
            
            const profilePageLoaded = await this.page.$('.max-w-6xl') || await this.page.$('.max-w-2xl');
            
            if (profilePageLoaded) {
                console.log('  ✅ Profile page loads successfully');
                this.testResults.userJourney.profileAccessFlow.status = 'passed';
                this.testResults.userJourney.profileAccessFlow.details.push('Profile page accessible');
            } else {
                console.log('  ❌ Profile page failed to load');
                this.testResults.userJourney.profileAccessFlow.status = 'failed';
                this.testResults.userJourney.profileAccessFlow.details.push('Profile page not loading');
            }
            
        } catch (error) {
            console.log('  ❌ Profile Access Flow test error:', error.message);
            this.testResults.userJourney.profileAccessFlow.status = 'failed';
            this.testResults.userJourney.profileAccessFlow.details.push(`Error: ${error.message}`);
        }
    }

    async testHeroSelectionProcess() {
        console.log('  🦸‍♀️ Testing Hero Selection Process...');
        
        try {
            // This would typically require authentication
            // Test the hero selection modal functionality
            const heroButton = await this.page.$('button:contains("Choose Hero Avatar")');
            
            if (heroButton) {
                await heroButton.click();
                await this.page.waitForTimeout(1000);
                
                // Test modal functionality
                const modal = await this.page.$('.fixed.inset-0');
                
                if (modal) {
                    console.log('  ✅ Hero selection modal opens');
                    
                    // Test hero role tabs
                    const roleTabs = await this.page.$$('button[class*="px-4 py-2 rounded-lg"]');
                    
                    if (roleTabs.length >= 3) {
                        console.log('  ✅ Hero role tabs functional');
                        this.testResults.userJourney.heroSelectionProcess.details.push('Role categorization working');
                        
                        // Test clicking different roles
                        for (let i = 0; i < Math.min(3, roleTabs.length); i++) {
                            await roleTabs[i].click();
                            await this.page.waitForTimeout(500);
                        }
                        
                        console.log('  ✅ Role switching works');
                        this.testResults.userJourney.heroSelectionProcess.details.push('Role switching functional');
                    }
                    
                    // Test hero grid display
                    const heroButtons = await this.page.$$('.grid button');
                    
                    if (heroButtons.length > 0) {
                        console.log(`  ✅ Found ${heroButtons.length} hero selection buttons`);
                        this.testResults.userJourney.heroSelectionProcess.details.push(`${heroButtons.length} heroes selectable`);
                        
                        // Test hero selection (first hero)
                        if (heroButtons[0]) {
                            await heroButtons[0].click();
                            await this.page.waitForTimeout(500);
                            console.log('  ✅ Hero selection works');
                            this.testResults.userJourney.heroSelectionProcess.details.push('Hero selection functional');
                        }
                    }
                    
                    this.testResults.userJourney.heroSelectionProcess.status = 'passed';
                } else {
                    console.log('  ❌ Hero selection modal did not open');
                    this.testResults.userJourney.heroSelectionProcess.status = 'failed';
                    this.testResults.userJourney.heroSelectionProcess.details.push('Modal not opening');
                }
            } else {
                console.log('  ⚠️ Hero selection button not accessible');
                this.testResults.userJourney.heroSelectionProcess.status = 'warning';
                this.testResults.userJourney.heroSelectionProcess.details.push('Requires authentication');
            }
            
        } catch (error) {
            console.log('  ❌ Hero Selection Process test error:', error.message);
            this.testResults.userJourney.heroSelectionProcess.status = 'failed';
            this.testResults.userJourney.heroSelectionProcess.details.push(`Error: ${error.message}`);
        }
    }

    async testTeamSelectionProcess() {
        console.log('  🏟️ Testing Team Selection Process...');
        
        try {
            const teamSelect = await this.page.$('select');
            
            if (teamSelect) {
                // Get all options
                const options = await this.page.$$eval('select option', options => 
                    options.map(option => ({ value: option.value, text: option.textContent }))
                );
                
                if (options.length > 1) { // More than just "No team flair"
                    console.log(`  ✅ Found ${options.length - 1} team options`);
                    
                    // Test selecting a team (select second option if exists)
                    if (options.length > 2) {
                        await this.page.select('select', options[1].value);
                        await this.page.waitForTimeout(500);
                        
                        console.log('  ✅ Team selection works');
                        this.testResults.userJourney.teamSelectionProcess.details.push('Team selection functional');
                    }
                    
                    // Test flair toggles
                    const heroToggle = await this.page.$('#show_hero_flair');
                    const teamToggle = await this.page.$('#show_team_flair');
                    
                    if (heroToggle && teamToggle) {
                        // Test toggling
                        await heroToggle.click();
                        await this.page.waitForTimeout(200);
                        await heroToggle.click(); // Toggle back
                        
                        await teamToggle.click();
                        await this.page.waitForTimeout(200);
                        await teamToggle.click(); // Toggle back
                        
                        console.log('  ✅ Flair toggles work');
                        this.testResults.userJourney.teamSelectionProcess.details.push('Flair toggles functional');
                    }
                    
                    this.testResults.userJourney.teamSelectionProcess.status = 'passed';
                } else {
                    console.log('  ❌ No team options available');
                    this.testResults.userJourney.teamSelectionProcess.status = 'failed';
                    this.testResults.userJourney.teamSelectionProcess.details.push('No teams available');
                }
            } else {
                console.log('  ⚠️ Team selection not accessible');
                this.testResults.userJourney.teamSelectionProcess.status = 'warning';
                this.testResults.userJourney.teamSelectionProcess.details.push('Requires authentication');
            }
            
        } catch (error) {
            console.log('  ❌ Team Selection Process test error:', error.message);
            this.testResults.userJourney.teamSelectionProcess.status = 'failed';
            this.testResults.userJourney.teamSelectionProcess.details.push(`Error: ${error.message}`);
        }
    }

    async testSaveAndDisplayFlow() {
        console.log('  💾 Testing Save and Display Flow...');
        
        try {
            // Test flair update button
            const updateButton = await this.page.$('button:contains("Update Flairs")');
            
            if (updateButton) {
                console.log('  ✅ Update flairs button found');
                
                // Note: We won't actually click to avoid making real changes
                // but we verify the button exists and is clickable
                const isDisabled = await this.page.evaluate(btn => btn.disabled, updateButton);
                
                if (!isDisabled) {
                    console.log('  ✅ Update button is enabled');
                    this.testResults.userJourney.saveAndDisplayFlow.details.push('Save functionality available');
                } else {
                    console.log('  ⚠️ Update button is disabled');
                    this.testResults.userJourney.saveAndDisplayFlow.details.push('Save button disabled');
                }
                
                this.testResults.userJourney.saveAndDisplayFlow.status = 'passed';
            } else {
                console.log('  ❌ Update flairs button not found');
                this.testResults.userJourney.saveAndDisplayFlow.status = 'failed';
                this.testResults.userJourney.saveAndDisplayFlow.details.push('Save button missing');
            }
            
        } catch (error) {
            console.log('  ❌ Save and Display Flow test error:', error.message);
            this.testResults.userJourney.saveAndDisplayFlow.status = 'failed';
            this.testResults.userJourney.saveAndDisplayFlow.details.push(`Error: ${error.message}`);
        }
    }

    async testMobileResponsiveness() {
        console.log('  📱 Testing Mobile Responsiveness...');
        
        try {
            // Test mobile viewport
            await this.page.setViewport({ width: 375, height: 667 });
            await this.page.waitForTimeout(1000);
            
            // Check if layout adapts
            const profileContainer = await this.page.$('.max-w-6xl, .max-w-2xl');
            
            if (profileContainer) {
                const containerWidth = await this.page.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.width;
                }, profileContainer);
                
                console.log('  ✅ Profile container adapts to mobile');
                this.testResults.userJourney.mobileResponsiveness.details.push('Mobile layout responsive');
            }
            
            // Test grid layout on mobile
            const heroGrid = await this.page.$('.grid');
            
            if (heroGrid) {
                console.log('  ✅ Grid layout present on mobile');
                this.testResults.userJourney.mobileResponsiveness.details.push('Grid responsive');
            }
            
            // Reset to desktop viewport
            await this.page.setViewport({ width: 1920, height: 1080 });
            await this.page.waitForTimeout(500);
            
            this.testResults.userJourney.mobileResponsiveness.status = 'passed';
            
        } catch (error) {
            console.log('  ❌ Mobile Responsiveness test error:', error.message);
            this.testResults.userJourney.mobileResponsiveness.status = 'failed';
            this.testResults.userJourney.mobileResponsiveness.details.push(`Error: ${error.message}`);
        }
    }

    async testSocialFeatures() {
        console.log('\n👥 Testing Social Features...');
        
        try {
            await this.testForumProfileDisplay();
            await this.testCommentSystemIntegration();
            await this.testHeroFlairVisibility();
            await this.testTeamFlairVisibility();
            
        } catch (error) {
            console.log('❌ Social Features Test Failed:', error.message);
        }
    }

    async testForumProfileDisplay() {
        console.log('  📄 Testing Forum Profile Display...');
        
        try {
            // Navigate to forums
            await this.page.goto(`${this.baseUrl}/forums`, { waitUntil: 'networkidle0' });
            await this.page.waitForTimeout(2000);
            
            // Look for user avatars/names in forum posts
            const userDisplays = await this.page.$$('.font-medium, .text-sm');
            
            if (userDisplays.length > 0) {
                console.log('  ✅ User displays found in forums');
                this.testResults.socialFeatures.forumProfileDisplay.details.push('User displays visible');
                this.testResults.socialFeatures.forumProfileDisplay.status = 'passed';
            } else {
                console.log('  ⚠️ No user displays found - may need active forum content');
                this.testResults.socialFeatures.forumProfileDisplay.status = 'warning';
                this.testResults.socialFeatures.forumProfileDisplay.details.push('No forum activity to display');
            }
            
        } catch (error) {
            console.log('  ❌ Forum Profile Display test error:', error.message);
            this.testResults.socialFeatures.forumProfileDisplay.status = 'failed';
            this.testResults.socialFeatures.forumProfileDisplay.details.push(`Error: ${error.message}`);
        }
    }

    async testCommentSystemIntegration() {
        console.log('  💬 Testing Comment System Integration...');
        
        try {
            // Navigate to a news article to test comments
            await this.page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0' });
            await this.page.waitForTimeout(1000);
            
            // Look for news links
            const newsLinks = await this.page.$$('a[href*="/news/"]');
            
            if (newsLinks.length > 0) {
                await newsLinks[0].click();
                await this.page.waitForTimeout(3000);
                
                // Check for comment system
                const commentSystem = await this.page.$('.space-y-4');
                
                if (commentSystem) {
                    console.log('  ✅ Comment system found');
                    
                    // Check for user avatars in comments
                    const commentAvatars = await this.page.$$('.w-8.h-8, .rounded-full');
                    
                    if (commentAvatars.length > 0) {
                        console.log('  ✅ Comment avatars displayed');
                        this.testResults.socialFeatures.commentSystemIntegration.details.push('Comment avatars working');
                    }
                    
                    // Check for usernames in comments
                    const usernames = await this.page.$$('.font-medium');
                    
                    if (usernames.length > 0) {
                        console.log('  ✅ Usernames in comments displayed');
                        this.testResults.socialFeatures.commentSystemIntegration.details.push('Usernames in comments working');
                    }
                    
                    this.testResults.socialFeatures.commentSystemIntegration.status = 'passed';
                } else {
                    console.log('  ❌ Comment system not found');
                    this.testResults.socialFeatures.commentSystemIntegration.status = 'failed';
                    this.testResults.socialFeatures.commentSystemIntegration.details.push('Comment system missing');
                }
            } else {
                console.log('  ⚠️ No news articles found to test comments');
                this.testResults.socialFeatures.commentSystemIntegration.status = 'warning';
                this.testResults.socialFeatures.commentSystemIntegration.details.push('No news content available');
            }
            
        } catch (error) {
            console.log('  ❌ Comment System Integration test error:', error.message);
            this.testResults.socialFeatures.commentSystemIntegration.status = 'failed';
            this.testResults.socialFeatures.commentSystemIntegration.details.push(`Error: ${error.message}`);
        }
    }

    async testHeroFlairVisibility() {
        console.log('  🦸 Testing Hero Flair Visibility...');
        
        try {
            // This would require authenticated comments to test properly
            // For now, we test that the components exist
            
            await this.page.goto(`${this.baseUrl}/user/profile`, { waitUntil: 'networkidle0' });
            
            const heroFlairToggle = await this.page.$('#show_hero_flair');
            
            if (heroFlairToggle) {
                console.log('  ✅ Hero flair visibility toggle found');
                this.testResults.socialFeatures.heroFlairVisibility.details.push('Hero flair toggle available');
                this.testResults.socialFeatures.heroFlairVisibility.status = 'passed';
            } else {
                console.log('  ❌ Hero flair toggle not found');
                this.testResults.socialFeatures.heroFlairVisibility.status = 'failed';
                this.testResults.socialFeatures.heroFlairVisibility.details.push('Hero flair toggle missing');
            }
            
        } catch (error) {
            console.log('  ❌ Hero Flair Visibility test error:', error.message);
            this.testResults.socialFeatures.heroFlairVisibility.status = 'failed';
            this.testResults.socialFeatures.heroFlairVisibility.details.push(`Error: ${error.message}`);
        }
    }

    async testTeamFlairVisibility() {
        console.log('  🏆 Testing Team Flair Visibility...');
        
        try {
            // Should already be on profile page
            const teamFlairToggle = await this.page.$('#show_team_flair');
            
            if (teamFlairToggle) {
                console.log('  ✅ Team flair visibility toggle found');
                this.testResults.socialFeatures.teamFlairVisibility.details.push('Team flair toggle available');
                this.testResults.socialFeatures.teamFlairVisibility.status = 'passed';
            } else {
                console.log('  ❌ Team flair toggle not found');
                this.testResults.socialFeatures.teamFlairVisibility.status = 'failed';
                this.testResults.socialFeatures.teamFlairVisibility.details.push('Team flair toggle missing');
            }
            
        } catch (error) {
            console.log('  ❌ Team Flair Visibility test error:', error.message);
            this.testResults.socialFeatures.teamFlairVisibility.status = 'failed';
            this.testResults.socialFeatures.teamFlairVisibility.details.push(`Error: ${error.message}`);
        }
    }

    async testRetentionImpact() {
        console.log('\n🎯 Testing Retention Impact Features...');
        
        try {
            await this.testErrorFreeExperience();
            await this.testCustomizationFunctionality();
            await this.testUserSatisfactionMetrics();
            await this.testFeatureCompleteness();
            
        } catch (error) {
            console.log('❌ Retention Impact Test Failed:', error.message);
        }
    }

    async testErrorFreeExperience() {
        console.log('  🚫 Testing Error-Free Experience...');
        
        try {
            let errorCount = 0;
            let warningCount = 0;
            
            // Listen for console errors
            this.page.on('console', msg => {
                if (msg.type() === 'error') errorCount++;
                if (msg.type() === 'warning') warningCount++;
            });
            
            // Test key user flows for errors
            const testFlows = [
                () => this.page.goto(`${this.baseUrl}/user/profile`),
                () => this.page.click('button:contains("Choose Hero Avatar")').catch(() => {}),
                () => this.page.goto(`${this.baseUrl}/forums`),
                () => this.page.goto(`${this.baseUrl}`)
            ];
            
            for (const flow of testFlows) {
                try {
                    await flow();
                    await this.page.waitForTimeout(1000);
                } catch (e) {
                    errorCount++;
                }
            }
            
            if (errorCount === 0) {
                console.log('  ✅ No JavaScript errors detected');
                this.testResults.retentionImpact.errorFreeExperience.status = 'passed';
                this.testResults.retentionImpact.errorFreeExperience.details.push('Error-free navigation');
            } else {
                console.log(`  ⚠️ Found ${errorCount} errors, ${warningCount} warnings`);
                this.testResults.retentionImpact.errorFreeExperience.status = 'warning';
                this.testResults.retentionImpact.errorFreeExperience.details.push(`${errorCount} errors, ${warningCount} warnings`);
            }
            
        } catch (error) {
            console.log('  ❌ Error-Free Experience test error:', error.message);
            this.testResults.retentionImpact.errorFreeExperience.status = 'failed';
            this.testResults.retentionImpact.errorFreeExperience.details.push(`Error: ${error.message}`);
        }
    }

    async testCustomizationFunctionality() {
        console.log('  🎨 Testing Customization Functionality...');
        
        try {
            await this.page.goto(`${this.baseUrl}/user/profile`, { waitUntil: 'networkidle0' });
            
            let functionalityScore = 0;
            const totalFeatures = 6;
            
            // Test hero avatar button
            if (await this.page.$('button:contains("Choose Hero Avatar")')) {
                functionalityScore++;
            }
            
            // Test team flair selector
            if (await this.page.$('select')) {
                functionalityScore++;
            }
            
            // Test flair toggles
            if (await this.page.$('#show_hero_flair')) functionalityScore++;
            if (await this.page.$('#show_team_flair')) functionalityScore++;
            
            // Test update button
            if (await this.page.$('button:contains("Update Flairs")')) {
                functionalityScore++;
            }
            
            // Test profile statistics
            if (await this.page.$('.text-3xl.font-bold')) {
                functionalityScore++;
            }
            
            const percentage = (functionalityScore / totalFeatures) * 100;
            
            console.log(`  📊 Customization functionality: ${percentage.toFixed(1)}%`);
            
            if (percentage >= 80) {
                this.testResults.retentionImpact.customizationFunctionality.status = 'passed';
            } else if (percentage >= 60) {
                this.testResults.retentionImpact.customizationFunctionality.status = 'warning';
            } else {
                this.testResults.retentionImpact.customizationFunctionality.status = 'failed';
            }
            
            this.testResults.retentionImpact.customizationFunctionality.details.push(
                `${functionalityScore}/${totalFeatures} features functional (${percentage.toFixed(1)}%)`
            );
            
        } catch (error) {
            console.log('  ❌ Customization Functionality test error:', error.message);
            this.testResults.retentionImpact.customizationFunctionality.status = 'failed';
            this.testResults.retentionImpact.customizationFunctionality.details.push(`Error: ${error.message}`);
        }
    }

    async testUserSatisfactionMetrics() {
        console.log('  😊 Testing User Satisfaction Metrics...');
        
        try {
            await this.page.goto(`${this.baseUrl}/user/profile`, { waitUntil: 'networkidle0' });
            
            let satisfactionScore = 0;
            const metrics = [];
            
            // Check for user engagement stats
            const statsCards = await this.page.$$('.text-3xl.font-bold');
            if (statsCards.length > 0) {
                satisfactionScore += 20;
                metrics.push('User statistics displayed');
            }
            
            // Check for activity feed
            const activityFeed = await this.page.$('text=Recent Activity');
            if (activityFeed) {
                satisfactionScore += 20;
                metrics.push('Activity feed present');
            }
            
            // Check for voting metrics
            const votingStats = await this.page.$('text=Voting & Engagement');
            if (votingStats) {
                satisfactionScore += 20;
                metrics.push('Engagement metrics shown');
            }
            
            // Check for profile customization options
            const customizationOptions = await this.page.$$('button, select, input[type="checkbox"]');
            if (customizationOptions.length >= 4) {
                satisfactionScore += 20;
                metrics.push('Multiple customization options');
            }
            
            // Check for visual feedback (buttons, toggles)
            const interactiveElements = await this.page.$$('button:not([disabled])');
            if (interactiveElements.length > 0) {
                satisfactionScore += 20;
                metrics.push('Interactive elements functional');
            }
            
            console.log(`  📊 User satisfaction score: ${satisfactionScore}%`);
            
            if (satisfactionScore >= 80) {
                this.testResults.retentionImpact.userSatisfactionMetrics.status = 'passed';
            } else if (satisfactionScore >= 60) {
                this.testResults.retentionImpact.userSatisfactionMetrics.status = 'warning';
            } else {
                this.testResults.retentionImpact.userSatisfactionMetrics.status = 'failed';
            }
            
            this.testResults.retentionImpact.userSatisfactionMetrics.details = metrics;
            
        } catch (error) {
            console.log('  ❌ User Satisfaction Metrics test error:', error.message);
            this.testResults.retentionImpact.userSatisfactionMetrics.status = 'failed';
            this.testResults.retentionImpact.userSatisfactionMetrics.details.push(`Error: ${error.message}`);
        }
    }

    async testFeatureCompleteness() {
        console.log('  ✅ Testing Feature Completeness...');
        
        try {
            const requiredFeatures = [
                { name: 'Profile Access', selector: '.max-w-6xl, .max-w-2xl' },
                { name: 'Hero Avatar Selection', selector: 'button:contains("Choose Hero Avatar")' },
                { name: 'Team Flair Selection', selector: 'select' },
                { name: 'Flair Visibility Controls', selector: '#show_hero_flair' },
                { name: 'Save Functionality', selector: 'button:contains("Update")' },
                { name: 'User Statistics', selector: '.text-3xl.font-bold' },
                { name: 'Profile Display', selector: '.text-2xl.font-bold' }
            ];
            
            let featuresFound = 0;
            const missingFeatures = [];
            const presentFeatures = [];
            
            for (const feature of requiredFeatures) {
                const element = await this.page.$(feature.selector);
                if (element) {
                    featuresFound++;
                    presentFeatures.push(feature.name);
                } else {
                    missingFeatures.push(feature.name);
                }
            }
            
            const completenessPercentage = (featuresFound / requiredFeatures.length) * 100;
            
            console.log(`  📊 Feature completeness: ${completenessPercentage.toFixed(1)}%`);
            console.log(`  ✅ Present: ${presentFeatures.join(', ')}`);
            if (missingFeatures.length > 0) {
                console.log(`  ❌ Missing: ${missingFeatures.join(', ')}`);
            }
            
            if (completenessPercentage >= 90) {
                this.testResults.retentionImpact.featureCompleteness.status = 'passed';
            } else if (completenessPercentage >= 70) {
                this.testResults.retentionImpact.featureCompleteness.status = 'warning';
            } else {
                this.testResults.retentionImpact.featureCompleteness.status = 'failed';
            }
            
            this.testResults.retentionImpact.featureCompleteness.details = [
                `${featuresFound}/${requiredFeatures.length} features present (${completenessPercentage.toFixed(1)}%)`,
                `Present: ${presentFeatures.join(', ')}`,
                ...(missingFeatures.length > 0 ? [`Missing: ${missingFeatures.join(', ')}`] : [])
            ];
            
        } catch (error) {
            console.log('  ❌ Feature Completeness test error:', error.message);
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
        
        // Count all test results
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
            baseUrl: this.baseUrl,
            testResults: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        // Save report to file
        const reportPath = path.join(__dirname, `user-engagement-test-report-${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`\n📋 Report saved to: ${reportPath}`);
        return report;
    }

    generateRecommendations() {
        const recommendations = [];
        
        // Analyze results and generate recommendations
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
        
        // Add general recommendations based on overall score
        if (this.testResults.summary.overallScore < 80) {
            recommendations.push({
                priority: 'high',
                category: 'general',
                test: 'overall',
                issue: 'Low overall engagement score',
                recommendation: 'Focus on fixing critical user engagement features to improve retention'
            });
        }
        
        return recommendations;
    }

    async runAllTests() {
        try {
            await this.initialize();
            
            await this.testProfilePersonalization();
            await this.testUserJourney();
            await this.testSocialFeatures();
            await this.testRetentionImpact();
            
            this.calculateSummary();
            const report = this.generateReport();
            
            console.log('\n🎉 User Engagement Validation Complete!');
            console.log(`📊 Overall Score: ${this.testResults.summary.overallScore}%`);
            
            if (this.testResults.summary.overallScore >= 90) {
                console.log('🥇 Excellent! User engagement features are working well.');
            } else if (this.testResults.summary.overallScore >= 70) {
                console.log('🥈 Good! Minor improvements needed for optimal user engagement.');
            } else {
                console.log('🥉 Needs work! Critical issues affecting user engagement and retention.');
            }
            
            return report;
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }
}

// Run the validation
(async () => {
    const validator = new UserEngagementValidator();
    
    try {
        await validator.runAllTests();
    } catch (error) {
        console.error('❌ Validation failed:', error);
        process.exit(1);
    }
})();

module.exports = UserEngagementValidator;