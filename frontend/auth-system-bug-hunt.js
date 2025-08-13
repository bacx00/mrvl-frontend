/**
 * 🔍 COMPREHENSIVE AUTHENTICATION & USER MANAGEMENT BUG HUNT
 * 
 * This test suite systematically checks for bugs in the user authentication and management system.
 * Focus areas: hero images, avatars, auth edge cases, sessions, roles, profiles, caching, tokens, UI/UX
 * 
 * Test Method: Automated API testing with edge cases and security validation
 */

const API_BASE_URL = 'https://staging.mrvl.net/api';

// Test Configuration
const TEST_CONFIG = {
    testUsers: [
        {
            name: 'test_admin_bug_hunt',
            email: 'admin_test@mrvl.test', 
            password: 'TestPassword123!',
            role: 'admin',
            hero_flair: 'Black Widow',
            show_hero_flair: true
        },
        {
            name: 'test_user_bug_hunt',
            email: 'user_test@mrvl.test',
            password: 'UserPassword123!',
            role: 'user', 
            hero_flair: 'Spider-Man',
            show_hero_flair: true
        },
        {
            name: 'test_moderator_bug_hunt',
            email: 'mod_test@mrvl.test',
            password: 'ModPassword123!',
            role: 'moderator',
            hero_flair: 'Iron Man',
            show_hero_flair: false
        }
    ],
    heroes: [
        'Black Widow', 'Hawkeye', 'Star-Lord', 'Punisher', 'Winter Soldier', 
        'Spider-Man', 'Iron Man', 'Storm', 'Scarlet Witch', 'Moon Knight',
        'Hulk', 'Groot', 'Doctor Strange', 'Magneto', 'Captain America',
        'Mantis', 'Luna Snow', 'Adam Warlock', 'Jeff the Land Shark', 'Loki'
    ]
};

// Bug Report Storage
const BUG_REPORT = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    security: []
};

// Utility Functions
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const makeRequest = async (endpoint, method = 'GET', data = null, token = null) => {
    try {
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            method,
            headers
        };
        
        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        return {
            status: response.status,
            success: response.ok,
            data: result
        };
    } catch (error) {
        return {
            status: 0,
            success: false,
            error: error.message
        };
    }
};

const reportBug = (severity, category, title, description, reproduction, impact) => {
    const bug = {
        id: `BUG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        category,
        title,
        description,
        reproduction_steps: reproduction,
        impact,
        severity,
        discovered_at: new Date().toISOString(),
        test_environment: 'staging.mrvl.net'
    };
    
    BUG_REPORT[severity].push(bug);
    console.log(`🐛 [${severity.toUpperCase()}] ${category}: ${title}`);
    return bug;
};

// Test Suite Implementation
class AuthBugHunter {
    constructor() {
        this.tokens = {};
        this.testUsers = [];
        this.testResults = {};
    }
    
    async runFullBugHunt() {
        console.log('🔍 Starting Comprehensive Authentication Bug Hunt...');
        console.log('=' .repeat(60));
        
        try {
            // 1. Hero Image Display Tests (Recently Fixed - Verify)
            await this.testHeroImageDisplay();
            
            // 2. User Avatar Selection and Display
            await this.testAvatarSystem();
            
            // 3. Authentication Edge Cases
            await this.testAuthenticationEdgeCases();
            
            // 4. Session Management
            await this.testSessionManagement();
            
            // 5. Role Permission System
            await this.testRolePermissions();
            
            // 6. User Profile Race Conditions
            await this.testProfileRaceConditions();
            
            // 7. Cache Invalidation
            await this.testCacheInvalidation();
            
            // 8. Token Handling
            await this.testTokenHandling();
            
            // 9. User Activity Tracking
            await this.testActivityTracking();
            
            // 10. UI/UX Issues
            await this.testUIUXIssues();
            
            // 11. Security Vulnerabilities
            await this.testSecurityVulnerabilities();
            
        } catch (error) {
            console.error('❌ Bug hunt failed:', error);
        } finally {
            await this.cleanup();
            this.generateReport();
        }
    }
    
    async testHeroImageDisplay() {
        console.log('\n🎭 Testing Hero Image Display (Recently Fixed)...');
        
        try {
            // Create admin user with hero flair
            const adminResult = await this.createTestUser(TEST_CONFIG.testUsers[0]);
            if (!adminResult.success) {
                reportBug('critical', 'Hero Images', 'Cannot create test admin user', 
                    'Failed to create admin user for hero image testing', 
                    ['Try to create admin user via API', 'Request fails'], 
                    'Cannot test hero image functionality');
                return;
            }
            
            // Test admin users endpoint
            const usersResponse = await makeRequest('/admin/users', 'GET', null, adminResult.token);
            
            if (!usersResponse.success) {
                reportBug('high', 'Hero Images', 'Admin users endpoint not accessible', 
                    'Cannot access /admin/users endpoint to verify hero images', 
                    ['Login as admin', 'Try to access /admin/users', 'Request fails'], 
                    'Admin cannot manage users or see hero avatars');
                return;
            }
            
            // Check if users have hero_flair data
            const users = usersResponse.data.data || usersResponse.data || [];
            const usersWithHeroFlair = users.filter(user => user.hero_flair);
            
            if (usersWithHeroFlair.length === 0) {
                reportBug('medium', 'Hero Images', 'No hero flair data in admin users response', 
                    'Admin users endpoint does not return hero_flair field data', 
                    ['Access admin users tab', 'Check user data response', 'hero_flair field missing'], 
                    'Hero avatars not displayed in admin interface');
            }
            
            // Test hero image URL generation
            for (const hero of TEST_CONFIG.heroes.slice(0, 5)) {
                const heroImageUrl = `https://staging.mrvl.net/images/heroes/${hero.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-headbig.webp`;
                
                try {
                    const imageResponse = await fetch(heroImageUrl, { method: 'HEAD' });
                    if (!imageResponse.ok) {
                        reportBug('medium', 'Hero Images', `Hero image not accessible: ${hero}`, 
                            `Hero image URL ${heroImageUrl} returns ${imageResponse.status}`, 
                            [`Select ${hero} as hero flair`, 'Save user', 'Hero image should display', 'Image fails to load'], 
                            'Users cannot see selected hero avatars');
                    }
                } catch (error) {
                    reportBug('medium', 'Hero Images', `Hero image request failed: ${hero}`, 
                        `Network error when accessing hero image: ${error.message}`, 
                        [`Select ${hero} as hero flair`, 'Check browser network tab', 'Image request fails'], 
                        'Hero avatars fail to load due to network issues');
                }
            }
            
        } catch (error) {
            reportBug('high', 'Hero Images', 'Hero image test suite failed', 
                `Exception during hero image testing: ${error.message}`, 
                ['Run hero image tests', 'Test framework crashes'], 
                'Cannot verify hero image functionality');
        }
    }
    
    async testAvatarSystem() {
        console.log('\n👤 Testing User Avatar System...');
        
        try {
            // Test avatar selection options
            const avatarTests = [
                { type: 'hero', value: 'Black Widow', show_hero_flair: true },
                { type: 'hero', value: 'Spider-Man', show_hero_flair: false },
                { type: 'none', value: null, show_hero_flair: false },
                { type: 'invalid_hero', value: 'NonExistentHero', show_hero_flair: true }
            ];
            
            for (const test of avatarTests) {
                const userResult = await this.createTestUser({
                    name: `avatar_test_${test.type}`,
                    email: `avatar_${test.type}@test.com`,
                    password: 'AvatarTest123!',
                    role: 'user',
                    hero_flair: test.value,
                    show_hero_flair: test.show_hero_flair
                });
                
                if (userResult.success) {
                    // Test profile retrieval
                    const profileResponse = await makeRequest(`/users/${userResult.userId}`, 'GET', null, userResult.token);
                    
                    if (profileResponse.success) {
                        const user = profileResponse.data;
                        
                        // Check avatar consistency
                        if (test.type === 'invalid_hero' && user.hero_flair === test.value) {
                            reportBug('medium', 'Avatar System', 'Invalid hero flair accepted', 
                                'System accepts non-existent hero names as valid hero flair', 
                                ['Set hero_flair to "NonExistentHero"', 'Save user', 'Invalid hero is saved'], 
                                'Users may have broken avatar references');
                        }
                        
                        // Test avatar URL generation logic
                        if (test.show_hero_flair && test.value && TEST_CONFIG.heroes.includes(test.value)) {
                            const expectedHeroImage = `https://staging.mrvl.net/images/heroes/${test.value.toLowerCase().replace(/\s+/g, '-')}-headbig.webp`;
                            // This would require frontend testing to verify URL generation
                        }
                        
                    } else {
                        reportBug('medium', 'Avatar System', 'Cannot retrieve user profile for avatar testing', 
                            'Profile endpoint fails after user creation with avatar data', 
                            ['Create user with hero flair', 'Try to fetch profile', 'Request fails'], 
                            'Avatar settings cannot be verified');
                    }
                }
            }
            
        } catch (error) {
            reportBug('high', 'Avatar System', 'Avatar system test failed', 
                `Avatar testing threw exception: ${error.message}`, 
                ['Run avatar system tests', 'Test suite crashes'], 
                'Cannot verify avatar functionality');
        }
    }
    
    async testAuthenticationEdgeCases() {
        console.log('\n🔐 Testing Authentication Edge Cases...');
        
        // Test 1: Login with empty credentials
        const emptyLoginResult = await makeRequest('/login', 'POST', {
            email: '',
            password: ''
        });
        
        if (emptyLoginResult.success) {
            reportBug('critical', 'Authentication', 'Empty credentials accepted', 
                'Login endpoint accepts empty email and password', 
                ['Send POST to /login with empty email/password', 'Login succeeds'], 
                'Security vulnerability - authentication bypass possible');
        }
        
        // Test 2: SQL injection attempts
        const sqlInjectionTests = [
            "admin'; DROP TABLE users; --",
            "' OR '1'='1",
            "admin' UNION SELECT * FROM users --"
        ];
        
        for (const injectionAttempt of sqlInjectionTests) {
            const injectionResult = await makeRequest('/login', 'POST', {
                email: injectionAttempt,
                password: 'password'
            });
            
            if (injectionResult.success || (injectionResult.data && injectionResult.data.toString().includes('SQL'))) {
                reportBug('critical', 'Authentication', 'SQL injection vulnerability detected', 
                    `SQL injection attempt "${injectionAttempt}" may have succeeded or revealed SQL errors`, 
                    [`Try login with email: "${injectionAttempt}"`, 'Check response for SQL errors or success'], 
                    'Critical security vulnerability - database may be compromised');
            }
        }
        
        // Test 3: Password strength validation bypass
        const weakPasswords = ['123', 'password', '11111111', 'aaaaaaaa'];
        
        for (const weakPassword of weakPasswords) {
            const weakPassResult = await this.createTestUser({
                name: 'weak_pass_test',
                email: 'weak@test.com',
                password: weakPassword,
                role: 'user'
            });
            
            if (weakPassResult.success) {
                reportBug('medium', 'Authentication', 'Weak password accepted', 
                    `Password "${weakPassword}" was accepted despite being weak`, 
                    [`Try to register with password: "${weakPassword}"`, 'Registration succeeds'], 
                    'Users can create accounts with easily compromised passwords');
            }
        }
        
        // Test 4: Account enumeration
        const enumerationTest = await makeRequest('/login', 'POST', {
            email: 'nonexistent@user.com',
            password: 'password'
        });
        
        if (enumerationTest.data && 
            (enumerationTest.data.message.includes('user not found') || 
             enumerationTest.data.message.includes('email does not exist'))) {
            reportBug('low', 'Authentication', 'User enumeration possible', 
                'Login error messages reveal whether email exists in system', 
                ['Try to login with non-existent email', 'Error message reveals email does not exist'], 
                'Attackers can enumerate valid email addresses');
        }
        
        // Test 5: Rate limiting
        console.log('Testing rate limiting...');
        const rapidRequests = [];
        for (let i = 0; i < 10; i++) {
            rapidRequests.push(makeRequest('/login', 'POST', {
                email: 'test@test.com',
                password: 'wrong_password'
            }));
        }
        
        const rapidResults = await Promise.all(rapidRequests);
        const successfulRequests = rapidResults.filter(r => r.status !== 429).length;
        
        if (successfulRequests === 10) {
            reportBug('medium', 'Authentication', 'No rate limiting on login attempts', 
                'System allows unlimited login attempts without rate limiting', 
                ['Make 10+ rapid login attempts', 'All requests are processed'], 
                'Brute force attacks are not prevented');
        }
    }
    
    async testSessionManagement() {
        console.log('\n🎫 Testing Session Management...');
        
        try {
            // Create test user and login
            const userResult = await this.createTestUser(TEST_CONFIG.testUsers[1]);
            if (!userResult.success) return;
            
            const loginResult = await makeRequest('/login', 'POST', {
                email: TEST_CONFIG.testUsers[1].email,
                password: TEST_CONFIG.testUsers[1].password
            });
            
            if (!loginResult.success) {
                reportBug('high', 'Session Management', 'Cannot login after user creation', 
                    'User created successfully but login immediately fails', 
                    ['Create user', 'Try to login immediately', 'Login fails'], 
                    'User registration does not create valid login credentials');
                return;
            }
            
            const token = loginResult.data.access_token || loginResult.data.token;
            if (!token) {
                reportBug('critical', 'Session Management', 'No token returned on successful login', 
                    'Login succeeds but no access token is provided', 
                    ['Login with valid credentials', 'Check response', 'No token field present'], 
                    'Users cannot authenticate for subsequent requests');
                return;
            }
            
            // Test token validation
            const protectedRequest = await makeRequest('/user', 'GET', null, token);
            if (!protectedRequest.success) {
                reportBug('high', 'Session Management', 'Valid token rejected', 
                    'Token from successful login is not accepted for authenticated requests', 
                    ['Login successfully', 'Use returned token for /user request', 'Token rejected'], 
                    'Users cannot access authenticated features');
            }
            
            // Test token expiration handling
            // Note: This would require waiting or manipulating token timestamps
            
            // Test concurrent sessions
            const secondLogin = await makeRequest('/login', 'POST', {
                email: TEST_CONFIG.testUsers[1].email,
                password: TEST_CONFIG.testUsers[1].password
            });
            
            if (secondLogin.success) {
                const secondToken = secondLogin.data.access_token || secondLogin.data.token;
                
                // Check if first token still works
                const firstTokenCheck = await makeRequest('/user', 'GET', null, token);
                const secondTokenCheck = await makeRequest('/user', 'GET', null, secondToken);
                
                if (!firstTokenCheck.success && secondTokenCheck.success) {
                    // This might be intended behavior, but worth noting
                    console.log('ℹ️ Second login invalidates first session (may be intended)');
                }
            }
            
            // Test logout functionality
            const logoutResult = await makeRequest('/logout', 'POST', {}, token);
            if (logoutResult.success) {
                // Test that token is actually invalidated
                const postLogoutRequest = await makeRequest('/user', 'GET', null, token);
                if (postLogoutRequest.success) {
                    reportBug('medium', 'Session Management', 'Token not invalidated after logout', 
                        'Logout appears successful but token remains valid', 
                        ['Login', 'Logout', 'Try to use old token', 'Token still works'], 
                        'Logout does not properly terminate user sessions');
                }
            }
            
        } catch (error) {
            reportBug('high', 'Session Management', 'Session management test failed', 
                `Session testing threw exception: ${error.message}`, 
                ['Run session management tests', 'Test suite crashes'], 
                'Cannot verify session handling');
        }
    }
    
    async testRolePermissions() {
        console.log('\n👑 Testing Role Permission System...');
        
        try {
            // Create users with different roles
            const adminResult = await this.createTestUser(TEST_CONFIG.testUsers[0]); // admin
            const userResult = await this.createTestUser(TEST_CONFIG.testUsers[1]);   // user  
            const modResult = await this.createTestUser(TEST_CONFIG.testUsers[2]);    // moderator
            
            if (!adminResult.success || !userResult.success || !modResult.success) {
                reportBug('high', 'Role Permissions', 'Cannot create test users for role testing', 
                    'Failed to create users with different roles for permission testing', 
                    ['Create admin, user, and moderator accounts', 'Some creations fail'], 
                    'Cannot verify role-based access controls');
                return;
            }
            
            // Test admin-only endpoints with different roles
            const adminEndpoints = [
                '/admin/users',
                '/admin/dashboard',
                '/admin/analytics'
            ];
            
            for (const endpoint of adminEndpoints) {
                // Test with user token (should fail)
                const userAccess = await makeRequest(endpoint, 'GET', null, userResult.token);
                if (userAccess.success) {
                    reportBug('critical', 'Role Permissions', `Regular user can access admin endpoint: ${endpoint}`, 
                        `Non-admin user successfully accessed ${endpoint}`, 
                        [`Login as regular user`, `Access ${endpoint}`, 'Access granted'], 
                        'Critical security vulnerability - privilege escalation possible');
                }
                
                // Test with moderator token (may or may not be allowed depending on endpoint)
                const modAccess = await makeRequest(endpoint, 'GET', null, modResult.token);
                
                // Test with admin token (should succeed)
                const adminAccess = await makeRequest(endpoint, 'GET', null, adminResult.token);
                if (!adminAccess.success && adminAccess.status !== 404) {
                    reportBug('medium', 'Role Permissions', `Admin cannot access admin endpoint: ${endpoint}`, 
                        `Admin user denied access to ${endpoint}`, 
                        [`Login as admin`, `Try to access ${endpoint}`, 'Access denied'], 
                        'Admin users cannot perform administrative functions');
                }
            }
            
            // Test role escalation attempts
            const escalationTests = [
                { targetRole: 'admin', currentRole: 'user', token: userResult.token },
                { targetRole: 'admin', currentRole: 'moderator', token: modResult.token },
                { targetRole: 'moderator', currentRole: 'user', token: userResult.token }
            ];
            
            for (const test of escalationTests) {
                // Attempt to update own role
                const escalationAttempt = await makeRequest(`/admin/users/${userResult.userId}`, 'PUT', {
                    role: test.targetRole
                }, test.token);
                
                if (escalationAttempt.success) {
                    reportBug('critical', 'Role Permissions', `Role escalation vulnerability: ${test.currentRole} to ${test.targetRole}`, 
                        `User with ${test.currentRole} role successfully escalated to ${test.targetRole}`, 
                        [`Login as ${test.currentRole}`, `Update own role to ${test.targetRole}`, 'Update succeeds'], 
                        'Critical security vulnerability - users can grant themselves higher privileges');
                }
            }
            
        } catch (error) {
            reportBug('high', 'Role Permissions', 'Role permission test failed', 
                `Role testing threw exception: ${error.message}`, 
                ['Run role permission tests', 'Test suite crashes'], 
                'Cannot verify role-based security');
        }
    }
    
    async testProfileRaceConditions() {
        console.log('\n🏃 Testing Profile Update Race Conditions...');
        
        try {
            // Create test user
            const userResult = await this.createTestUser({
                name: 'race_condition_test',
                email: 'race@test.com',
                password: 'RaceTest123!',
                role: 'user',
                hero_flair: 'Spider-Man'
            });
            
            if (!userResult.success) return;
            
            // Simulate concurrent profile updates
            const updates = [
                { hero_flair: 'Iron Man' },
                { hero_flair: 'Black Widow' },
                { hero_flair: 'Hulk' },
                { name: 'updated_name_1' },
                { name: 'updated_name_2' }
            ];
            
            // Send all updates simultaneously
            const concurrentUpdates = updates.map(update => 
                makeRequest(`/admin/users/${userResult.userId}`, 'PUT', update, userResult.token)
            );
            
            const results = await Promise.all(concurrentUpdates);
            const successfulUpdates = results.filter(r => r.success);
            
            if (successfulUpdates.length > 1) {
                // Check final state
                const finalProfile = await makeRequest(`/users/${userResult.userId}`, 'GET', null, userResult.token);
                
                if (finalProfile.success) {
                    // Check for data corruption
                    const profile = finalProfile.data;
                    
                    if (!profile.hero_flair || !TEST_CONFIG.heroes.includes(profile.hero_flair)) {
                        reportBug('medium', 'Race Conditions', 'Profile data corrupted by concurrent updates', 
                            'Simultaneous profile updates resulted in invalid hero_flair', 
                            ['Make multiple simultaneous profile updates', 'Check final profile state', 'Data is corrupted'], 
                            'Concurrent user actions can corrupt profile data');
                    }
                    
                    if (!profile.name || profile.name.trim() === '') {
                        reportBug('medium', 'Race Conditions', 'Name field corrupted by race condition', 
                            'Concurrent updates resulted in empty or invalid name', 
                            ['Update name and hero_flair simultaneously', 'Name becomes empty'], 
                            'User names can be corrupted by concurrent updates');
                    }
                }
            }
            
        } catch (error) {
            reportBug('medium', 'Race Conditions', 'Race condition test failed', 
                `Race condition testing threw exception: ${error.message}`, 
                ['Run concurrent update tests', 'Test suite crashes'], 
                'Cannot verify data integrity under concurrent access');
        }
    }
    
    async testCacheInvalidation() {
        console.log('\n🗄️ Testing Cache Invalidation...');
        
        try {
            // Create test user
            const userResult = await this.createTestUser({
                name: 'cache_test_user',
                email: 'cache@test.com',
                password: 'CacheTest123!',
                role: 'user',
                hero_flair: 'Spider-Man'
            });
            
            if (!userResult.success) return;
            
            // Get initial profile
            const initialProfile = await makeRequest(`/users/${userResult.userId}`, 'GET', null, userResult.token);
            if (!initialProfile.success) return;
            
            // Update profile
            const updateResult = await makeRequest(`/admin/users/${userResult.userId}`, 'PUT', {
                hero_flair: 'Iron Man',
                name: 'cache_updated_name'
            }, userResult.token);
            
            if (!updateResult.success) return;
            
            // Immediately get profile again
            const updatedProfile = await makeRequest(`/users/${userResult.userId}`, 'GET', null, userResult.token);
            
            if (updatedProfile.success) {
                const profile = updatedProfile.data;
                
                // Check if update is reflected immediately
                if (profile.hero_flair === initialProfile.data.hero_flair) {
                    reportBug('medium', 'Cache Invalidation', 'Profile changes not immediately visible', 
                        'Profile updates are not reflected immediately, suggesting stale cache', 
                        ['Update user profile', 'Immediately fetch profile', 'Old data returned'], 
                        'Users see outdated profile information');
                }
                
                if (profile.name === initialProfile.data.name && profile.name !== 'cache_updated_name') {
                    reportBug('medium', 'Cache Invalidation', 'Name changes not immediately visible', 
                        'Name updates are cached and not immediately visible', 
                        ['Update user name', 'Fetch profile immediately', 'Old name shown'], 
                        'Name changes appear delayed to users');
                }
            }
            
            // Test cache invalidation across different endpoints
            const adminUsersResponse = await makeRequest('/admin/users', 'GET', null, userResult.token);
            if (adminUsersResponse.success) {
                const users = adminUsersResponse.data.data || adminUsersResponse.data || [];
                const testUser = users.find(u => u.id === userResult.userId);
                
                if (testUser && testUser.hero_flair === initialProfile.data.hero_flair) {
                    reportBug('medium', 'Cache Invalidation', 'Admin users list shows stale data', 
                        'Profile updates not reflected in admin users list', 
                        ['Update user profile', 'Check admin users list', 'Old data shown'], 
                        'Admin interface shows outdated user information');
                }
            }
            
        } catch (error) {
            reportBug('medium', 'Cache Invalidation', 'Cache invalidation test failed', 
                `Cache testing threw exception: ${error.message}`, 
                ['Run cache invalidation tests', 'Test suite crashes'], 
                'Cannot verify cache consistency');
        }
    }
    
    async testTokenHandling() {
        console.log('\n🎟️ Testing API Token Handling...');
        
        try {
            // Create test user
            const userResult = await this.createTestUser(TEST_CONFIG.testUsers[1]);
            if (!userResult.success) return;
            
            const token = userResult.token;
            
            // Test malformed tokens
            const malformedTokens = [
                'invalid_token',
                'Bearer invalid',
                '',
                null,
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
                token + 'tampered'
            ];
            
            for (const malformedToken of malformedTokens) {
                const response = await makeRequest('/user', 'GET', null, malformedToken);
                
                if (response.success) {
                    reportBug('critical', 'Token Handling', `Malformed token accepted: ${malformedToken}`, 
                        `Invalid token "${malformedToken}" was accepted as valid`, 
                        [`Use malformed token: "${malformedToken}"`, 'Make authenticated request', 'Request succeeds'], 
                        'Authentication can be bypassed with invalid tokens');
                }
                
                // Check for information disclosure in error messages
                if (response.data && typeof response.data === 'string' && 
                    (response.data.includes('jwt') || response.data.includes('token') || 
                     response.data.includes('decode') || response.data.includes('signature'))) {
                    reportBug('low', 'Token Handling', 'Token error messages reveal implementation details', 
                        `Error response contains technical details: "${response.data}"`, 
                        [`Use invalid token`, 'Check error message', 'Technical details revealed'], 
                        'Error messages may help attackers understand token implementation');
                }
            }
            
            // Test token reuse after logout
            const logoutResult = await makeRequest('/logout', 'POST', {}, token);
            if (logoutResult.success) {
                const postLogoutRequest = await makeRequest('/user', 'GET', null, token);
                if (postLogoutRequest.success) {
                    reportBug('medium', 'Token Handling', 'Token still valid after logout', 
                        'Token continues to work after successful logout', 
                        ['Login', 'Logout', 'Reuse token', 'Token still valid'], 
                        'Logout does not properly invalidate authentication tokens');
                }
            }
            
        } catch (error) {
            reportBug('medium', 'Token Handling', 'Token handling test failed', 
                `Token testing threw exception: ${error.message}`, 
                ['Run token handling tests', 'Test suite crashes'], 
                'Cannot verify token security');
        }
    }
    
    async testActivityTracking() {
        console.log('\n📊 Testing User Activity Tracking...');
        
        try {
            // Create test user  
            const userResult = await this.createTestUser({
                name: 'activity_test_user',
                email: 'activity@test.com',
                password: 'ActivityTest123!',
                role: 'user'
            });
            
            if (!userResult.success) return;
            
            // Perform various activities
            const activities = [
                { endpoint: '/user', method: 'GET' },
                { endpoint: '/teams', method: 'GET' },
                { endpoint: '/matches', method: 'GET' },
                { endpoint: '/events', method: 'GET' }
            ];
            
            for (const activity of activities) {
                await makeRequest(activity.endpoint, activity.method, null, userResult.token);
                await delay(100); // Small delay between activities
            }
            
            // Check if activities are tracked
            const adminResult = await this.createTestUser(TEST_CONFIG.testUsers[0]); // admin
            if (adminResult.success) {
                const activityResponse = await makeRequest(`/admin/users/${userResult.userId}/activity`, 'GET', null, adminResult.token);
                
                if (activityResponse.success) {
                    const activityData = activityResponse.data;
                    
                    if (!activityData || !Array.isArray(activityData) || activityData.length === 0) {
                        reportBug('low', 'Activity Tracking', 'User activities not being tracked', 
                            'No activity data found despite user performing multiple actions', 
                            ['Perform user activities', 'Check admin activity log', 'No activities recorded'], 
                            'User behavior analytics unavailable');
                    }
                } else if (activityResponse.status === 404) {
                    reportBug('low', 'Activity Tracking', 'Activity tracking endpoint not implemented', 
                        'No endpoint available to view user activity logs', 
                        ['Try to access user activity data', 'Endpoint does not exist'], 
                        'Cannot monitor user behavior or security events');
                }
            }
            
            // Test last_login tracking
            const profileResponse = await makeRequest(`/users/${userResult.userId}`, 'GET', null, userResult.token);
            if (profileResponse.success) {
                const profile = profileResponse.data;
                
                if (!profile.last_login) {
                    reportBug('low', 'Activity Tracking', 'Last login time not tracked', 
                        'User profile does not show last_login timestamp', 
                        ['Login as user', 'Check profile', 'last_login is null'], 
                        'Cannot track user login patterns for security monitoring');
                }
            }
            
        } catch (error) {
            reportBug('low', 'Activity Tracking', 'Activity tracking test failed', 
                `Activity tracking test threw exception: ${error.message}`, 
                ['Run activity tracking tests', 'Test suite crashes'], 
                'Cannot verify user activity monitoring');
        }
    }
    
    async testUIUXIssues() {
        console.log('\n🎨 Testing UI/UX Issues...');
        
        try {
            // Test user data validation and error handling
            const invalidUserData = [
                { name: '', email: 'test@test.com', password: 'Test123!', expectedError: 'name required' },
                { name: 'test', email: '', password: 'Test123!', expectedError: 'email required' },
                { name: 'test', email: 'invalid-email', password: 'Test123!', expectedError: 'invalid email' },
                { name: 'a'.repeat(300), email: 'test@test.com', password: 'Test123!', expectedError: 'name too long' },
                { name: 'test user', email: 'test@test.com', password: 'Test123!', expectedError: 'invalid characters' }
            ];
            
            for (const invalidData of invalidUserData) {
                const result = await makeRequest('/register', 'POST', invalidData);
                
                if (result.success) {
                    reportBug('medium', 'UI/UX', `Invalid user data accepted: ${invalidData.expectedError}`, 
                        `Registration succeeded with invalid data: ${JSON.stringify(invalidData)}`, 
                        [`Try to register with: ${JSON.stringify(invalidData)}`, 'Registration succeeds'], 
                        'Users can create accounts with invalid data, potentially causing issues');
                }
                
                // Check error message quality
                if (!result.success && result.data && result.data.message) {
                    const errorMessage = result.data.message.toLowerCase();
                    
                    if (errorMessage.includes('sql') || errorMessage.includes('database') || 
                        errorMessage.includes('exception') || errorMessage.includes('error:')) {
                        reportBug('low', 'UI/UX', 'Technical error messages exposed to users', 
                            `User-facing error contains technical details: "${result.data.message}"`, 
                            [`Submit invalid form data`, 'Check error message', 'Technical details shown'], 
                            'Poor user experience and potential information disclosure');
                    }
                }
            }
            
            // Test pagination handling
            const paginationResponse = await makeRequest('/admin/users?page=999999&per_page=100', 'GET', null, 
                (await this.createTestUser(TEST_CONFIG.testUsers[0])).token);
            
            if (paginationResponse.success) {
                const data = paginationResponse.data;
                if (data.data && data.data.length > 0) {
                    reportBug('low', 'UI/UX', 'Invalid pagination returns data', 
                        'Requesting page 999999 returns data instead of empty results', 
                        ['Go to admin users', 'Set page=999999', 'Data is returned'], 
                        'Confusing user experience with pagination');
                }
            }
            
        } catch (error) {
            reportBug('low', 'UI/UX', 'UI/UX test failed', 
                `UI/UX testing threw exception: ${error.message}`, 
                ['Run UI/UX tests', 'Test suite crashes'], 
                'Cannot verify user interface quality');
        }
    }
    
    async testSecurityVulnerabilities() {
        console.log('\n🔒 Testing Security Vulnerabilities...');
        
        try {
            // Test CORS headers
            const corsResponse = await fetch(`${API_BASE_URL}/user`, {
                method: 'OPTIONS',
                headers: {
                    'Origin': 'https://evil.example.com',
                    'Access-Control-Request-Method': 'GET'
                }
            });
            
            const corsHeaders = corsResponse.headers.get('Access-Control-Allow-Origin');
            if (corsHeaders === '*') {
                reportBug('medium', 'Security', 'Overly permissive CORS policy', 
                    'API allows requests from any origin (*)', 
                    ['Check CORS headers', 'Access-Control-Allow-Origin is *'], 
                    'Potential for cross-site request attacks');
            }
            
            // Test for sensitive information in responses
            const userResult = await this.createTestUser(TEST_CONFIG.testUsers[1]);
            if (userResult.success) {
                const profileResponse = await makeRequest(`/users/${userResult.userId}`, 'GET', null, userResult.token);
                
                if (profileResponse.success && profileResponse.data) {
                    const userData = JSON.stringify(profileResponse.data);
                    
                    if (userData.includes('password') || userData.includes('hash')) {
                        reportBug('high', 'Security', 'Password data exposed in API response', 
                            'User profile response contains password-related fields', 
                            ['Fetch user profile', 'Check response', 'Password data present'], 
                            'User passwords may be compromised');
                    }
                    
                    if (userData.includes('secret') || userData.includes('token')) {
                        reportBug('medium', 'Security', 'Sensitive data exposed in API response', 
                            'User profile contains sensitive fields that should not be exposed', 
                            ['Fetch user profile', 'Check response', 'Sensitive data present'], 
                            'Sensitive user information may be leaked');
                    }
                }
            }
            
            // Test parameter pollution
            const pollutionResponse = await makeRequest('/admin/users?role=admin&role=user', 'GET', null, userResult.token);
            if (pollutionResponse.success && pollutionResponse.data) {
                // This test would require analyzing the response to see if parameter pollution causes issues
                console.log('ℹ️ Parameter pollution test completed (manual analysis needed)');
            }
            
        } catch (error) {
            reportBug('medium', 'Security', 'Security vulnerability test failed', 
                `Security testing threw exception: ${error.message}`, 
                ['Run security vulnerability tests', 'Test suite crashes'], 
                'Cannot verify application security');
        }
    }
    
    // Helper Methods
    async createTestUser(userData) {
        try {
            const response = await makeRequest('/register', 'POST', userData);
            
            if (response.success) {
                // Try to login to get token
                const loginResponse = await makeRequest('/login', 'POST', {
                    email: userData.email,
                    password: userData.password
                });
                
                if (loginResponse.success) {
                    const userId = response.data.user?.id || response.data.id;
                    const token = loginResponse.data.access_token || loginResponse.data.token;
                    
                    this.testUsers.push({ ...userData, id: userId, token });
                    
                    return {
                        success: true,
                        userId,
                        token,
                        userData: response.data
                    };
                }
            }
            
            return { success: false, error: response.data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    async cleanup() {
        console.log('\n🧹 Cleaning up test data...');
        
        try {
            // Get admin token for cleanup
            const adminResult = await this.createTestUser(TEST_CONFIG.testUsers[0]);
            if (!adminResult.success) return;
            
            // Delete test users
            for (const user of this.testUsers) {
                try {
                    await makeRequest(`/admin/users/${user.id}`, 'DELETE', null, adminResult.token);
                } catch (error) {
                    console.log(`⚠️ Failed to cleanup user ${user.name}: ${error.message}`);
                }
            }
            
        } catch (error) {
            console.log(`⚠️ Cleanup failed: ${error.message}`);
        }
    }
    
    generateReport() {
        console.log('\n📋 COMPREHENSIVE BUG HUNT REPORT');
        console.log('=' .repeat(60));
        
        const totalBugs = Object.values(BUG_REPORT).reduce((sum, bugs) => sum + bugs.length, 0);
        
        console.log(`Total Bugs Found: ${totalBugs}`);
        console.log(`Critical: ${BUG_REPORT.critical.length}`);
        console.log(`High: ${BUG_REPORT.high.length}`);
        console.log(`Medium: ${BUG_REPORT.medium.length}`);
        console.log(`Low: ${BUG_REPORT.low.length}`);
        console.log(`Security: ${BUG_REPORT.security.length}`);
        
        // Detailed bug reports
        Object.entries(BUG_REPORT).forEach(([severity, bugs]) => {
            if (bugs.length > 0) {
                console.log(`\n🐛 ${severity.toUpperCase()} SEVERITY BUGS:`);
                console.log('-' .repeat(30));
                
                bugs.forEach((bug, index) => {
                    console.log(`\n${index + 1}. ${bug.title}`);
                    console.log(`   Category: ${bug.category}`);
                    console.log(`   Description: ${bug.description}`);
                    console.log(`   Impact: ${bug.impact}`);
                    console.log(`   Reproduction Steps:`);
                    bug.reproduction_steps.forEach((step, i) => {
                        console.log(`     ${i + 1}. ${step}`);
                    });
                    console.log(`   Bug ID: ${bug.id}`);
                });
            }
        });
        
        // Summary recommendations
        console.log('\n🎯 RECOMMENDATIONS:');
        console.log('-' .repeat(20));
        
        if (BUG_REPORT.critical.length > 0) {
            console.log('🔥 CRITICAL: Address immediately - security vulnerabilities detected');
        }
        
        if (BUG_REPORT.high.length > 0) {
            console.log('⚠️ HIGH: Fix before next release - core functionality issues');
        }
        
        if (BUG_REPORT.medium.length > 0) {
            console.log('📋 MEDIUM: Plan fixes for upcoming releases');
        }
        
        if (BUG_REPORT.low.length > 0) {
            console.log('📝 LOW: Consider for future improvements');
        }
        
        // Export results
        const reportData = {
            summary: {
                total_bugs: totalBugs,
                by_severity: {
                    critical: BUG_REPORT.critical.length,
                    high: BUG_REPORT.high.length,
                    medium: BUG_REPORT.medium.length,
                    low: BUG_REPORT.low.length,
                    security: BUG_REPORT.security.length
                },
                test_date: new Date().toISOString(),
                environment: 'staging.mrvl.net'
            },
            bugs: BUG_REPORT
        };
        
        console.log('\n💾 Detailed report data available in browser console as window.bugHuntReport');
        window.bugHuntReport = reportData;
        
        return reportData;
    }
}

// Execute the bug hunt
const bugHunter = new AuthBugHunter();

// Auto-run or manual trigger
if (typeof window !== 'undefined') {
    window.startBugHunt = () => bugHunter.runFullBugHunt();
    console.log('🔍 Authentication Bug Hunt loaded. Run window.startBugHunt() to begin.');
    
    // Uncomment to auto-run:
    // bugHunter.runFullBugHunt();
} else {
    // Node.js environment
    bugHunter.runFullBugHunt();
}