/**
 * COMPREHENSIVE FORUM SYSTEM TEST
 * 
 * This script tests all forum functionality end-to-end to ensure everything works perfectly.
 * Test covers: Thread Display, Posting System, Mention System, Admin Features, Categories, Mobile Experience
 */

// Test Configuration
const FORUM_TEST_CONFIG = {
    backend: 'http://localhost:8000',
    frontend: 'http://localhost:3000',
    testUser: {
        username: 'test_user_forum',
        email: 'forum.test@example.com',
        password: 'ForumTest123!'
    },
    testAdmin: {
        username: 'admin_forum',
        email: 'admin.forum@example.com', 
        password: 'AdminForum123!'
    },
    timeout: 10000
};

class ComprehensiveForumTester {
    constructor() {
        this.results = {
            threadDisplay: { passed: 0, failed: 0, tests: [] },
            postingSystem: { passed: 0, failed: 0, tests: [] },
            mentionSystem: { passed: 0, failed: 0, tests: [] },
            adminFeatures: { passed: 0, failed: 0, tests: [] },
            categories: { passed: 0, failed: 0, tests: [] },
            mobileExperience: { passed: 0, failed: 0, tests: [] },
            overall: { passed: 0, failed: 0, errors: [] }
        };
        this.testData = {
            threads: [],
            posts: [],
            categories: [],
            mentions: []
        };
    }

    // Utility Methods
    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green  
            error: '\x1b[31m',   // Red
            warning: '\x1b[33m', // Yellow
            reset: '\x1b[0m'     // Reset
        };
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    recordTest(category, testName, passed, details = {}) {
        const result = {
            name: testName,
            passed,
            timestamp: new Date().toISOString(),
            details,
            error: details.error || null
        };

        this.results[category].tests.push(result);
        if (passed) {
            this.results[category].passed++;
            this.results.overall.passed++;
            this.log(`✅ ${testName}`, 'success');
        } else {
            this.results[category].failed++;
            this.results.overall.failed++;
            this.results.overall.errors.push(result.error);
            this.log(`❌ ${testName}: ${details.error}`, 'error');
        }
    }

    // Authentication Helper
    async authenticateUser(userData) {
        try {
            const response = await fetch(`${FORUM_TEST_CONFIG.backend}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password
                })
            });

            if (response.ok) {
                const data = await response.json();
                return {
                    token: data.token || data.access_token,
                    user: data.user || data.data
                };
            }
            return null;
        } catch (error) {
            this.log(`Authentication failed: ${error.message}`, 'error');
            return null;
        }
    }

    // API Helper
    async apiRequest(endpoint, options = {}, token = null) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${FORUM_TEST_CONFIG.backend}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();
        return { response, data };
    }

    // Test 1: Forum Thread Display Functionality
    async testThreadDisplay() {
        this.log('🔍 Testing Forum Thread Display Functionality', 'info');

        try {
            // Test 1.1: Load forum categories
            const { response: catResponse, data: catData } = await this.apiRequest('/api/forums/categories');
            this.recordTest('threadDisplay', 'Load forum categories', 
                catResponse.ok && Array.isArray(catData?.data || catData),
                { 
                    statusCode: catResponse.status,
                    categoriesFound: (catData?.data || catData)?.length || 0,
                    error: !catResponse.ok ? `Categories API failed with ${catResponse.status}` : null
                }
            );

            if (catResponse.ok) {
                this.testData.categories = catData?.data || catData || [];
            }

            // Test 1.2: Load forum threads (all categories)
            const { response: threadsResponse, data: threadsData } = await this.apiRequest('/api/forums/threads');
            this.recordTest('threadDisplay', 'Load forum threads (all categories)',
                threadsResponse.ok && Array.isArray(threadsData?.data || threadsData),
                {
                    statusCode: threadsResponse.status,
                    threadsFound: (threadsData?.data || threadsData)?.length || 0,
                    error: !threadsResponse.ok ? `Threads API failed with ${threadsResponse.status}` : null
                }
            );

            if (threadsResponse.ok) {
                this.testData.threads = threadsData?.data || threadsData || [];
            }

            // Test 1.3: Load threads with category filter
            if (this.testData.categories.length > 0) {
                const firstCategory = this.testData.categories[0];
                const { response: filteredResponse, data: filteredData } = await this.apiRequest(
                    `/api/forums/threads?category=${firstCategory.slug}`
                );
                this.recordTest('threadDisplay', 'Load threads with category filter',
                    filteredResponse.ok,
                    {
                        statusCode: filteredResponse.status,
                        category: firstCategory.name,
                        threadsFound: (filteredData?.data || filteredData)?.length || 0,
                        error: !filteredResponse.ok ? `Category filter failed with ${filteredResponse.status}` : null
                    }
                );
            }

            // Test 1.4: Load threads with sorting
            const { response: sortedResponse, data: sortedData } = await this.apiRequest('/api/forums/threads?sort=popular');
            this.recordTest('threadDisplay', 'Load threads with sorting (popular)',
                sortedResponse.ok,
                {
                    statusCode: sortedResponse.status,
                    threadsFound: (sortedData?.data || sortedData)?.length || 0,
                    error: !sortedResponse.ok ? `Sorting failed with ${sortedResponse.status}` : null
                }
            );

            // Test 1.5: Search threads
            const { response: searchResponse, data: searchData } = await this.apiRequest('/api/forums/threads?search=test');
            this.recordTest('threadDisplay', 'Search threads functionality',
                searchResponse.ok,
                {
                    statusCode: searchResponse.status,
                    resultsFound: (searchData?.data || searchData)?.length || 0,
                    error: !searchResponse.ok ? `Search failed with ${searchResponse.status}` : null
                }
            );

            // Test 1.6: Load specific thread detail
            if (this.testData.threads.length > 0) {
                const firstThread = this.testData.threads[0];
                const { response: detailResponse, data: detailData } = await this.apiRequest(
                    `/api/forums/threads/${firstThread.id}`
                );
                this.recordTest('threadDisplay', 'Load thread detail page',
                    detailResponse.ok && detailData?.id,
                    {
                        statusCode: detailResponse.status,
                        threadId: firstThread.id,
                        threadTitle: firstThread.title,
                        postsFound: detailData?.posts?.length || 0,
                        error: !detailResponse.ok ? `Thread detail failed with ${detailResponse.status}` : null
                    }
                );
            }

            // Test 1.7: Pagination functionality
            const { response: pageResponse, data: pageData } = await this.apiRequest('/api/forums/threads?page=1&limit=5');
            this.recordTest('threadDisplay', 'Pagination functionality',
                pageResponse.ok,
                {
                    statusCode: pageResponse.status,
                    page: 1,
                    limit: 5,
                    threadsReturned: (pageData?.data || pageData)?.length || 0,
                    error: !pageResponse.ok ? `Pagination failed with ${pageResponse.status}` : null
                }
            );

        } catch (error) {
            this.recordTest('threadDisplay', 'Thread display system connectivity',
                false,
                { error: error.message }
            );
        }
    }

    // Test 2: Forum Posting System  
    async testPostingSystem() {
        this.log('✍️ Testing Forum Posting System', 'info');

        // Authenticate user first
        const auth = await this.authenticateUser(FORUM_TEST_CONFIG.testUser);
        if (!auth) {
            this.recordTest('postingSystem', 'User authentication for posting', false, 
                { error: 'Could not authenticate test user' });
            return;
        }

        try {
            // Test 2.1: Create new thread
            const newThreadData = {
                title: `Test Thread ${Date.now()}`,
                content: `This is a test thread created at ${new Date().toISOString()}. Testing forum functionality with mentions like @testuser and @team:testteam.`,
                category: this.testData.categories.length > 0 ? this.testData.categories[0].slug : null
            };

            const { response: createResponse, data: createData } = await this.apiRequest(
                '/api/user/forums/threads',
                {
                    method: 'POST',
                    body: JSON.stringify(newThreadData)
                },
                auth.token
            );

            const threadCreated = createResponse.ok && (createData?.id || createData?.data?.id);
            this.recordTest('postingSystem', 'Create new forum thread',
                threadCreated,
                {
                    statusCode: createResponse.status,
                    threadTitle: newThreadData.title,
                    threadId: createData?.id || createData?.data?.id,
                    error: !threadCreated ? `Thread creation failed: ${createResponse.status} - ${JSON.stringify(createData)}` : null
                }
            );

            let createdThreadId = null;
            if (threadCreated) {
                createdThreadId = createData?.id || createData?.data?.id;
                this.testData.threads.push({ id: createdThreadId, ...newThreadData });
            }

            // Test 2.2: Reply to thread
            if (createdThreadId) {
                const replyData = {
                    content: `Test reply to thread ${createdThreadId} at ${new Date().toISOString()}`
                };

                const { response: replyResponse, data: replyResultData } = await this.apiRequest(
                    `/api/user/forums/threads/${createdThreadId}/posts`,
                    {
                        method: 'POST',
                        body: JSON.stringify(replyData)
                    },
                    auth.token
                );

                const replyCreated = replyResponse.ok && (replyResultData?.id || replyResultData?.data?.id);
                this.recordTest('postingSystem', 'Reply to forum thread',
                    replyCreated,
                    {
                        statusCode: replyResponse.status,
                        threadId: createdThreadId,
                        replyId: replyResultData?.id || replyResultData?.data?.id,
                        error: !replyCreated ? `Reply failed: ${replyResponse.status} - ${JSON.stringify(replyResultData)}` : null
                    }
                );

                // Test 2.3: Edit post (if reply was created)
                if (replyCreated) {
                    const postId = replyResultData?.id || replyResultData?.data?.id;
                    const editData = {
                        content: `Edited test reply at ${new Date().toISOString()}`
                    };

                    const { response: editResponse, data: editResultData } = await this.apiRequest(
                        `/api/user/forums/posts/${postId}`,
                        {
                            method: 'PUT',
                            body: JSON.stringify(editData)
                        },
                        auth.token
                    );

                    this.recordTest('postingSystem', 'Edit forum post',
                        editResponse.ok,
                        {
                            statusCode: editResponse.status,
                            postId: postId,
                            error: !editResponse.ok ? `Edit failed: ${editResponse.status}` : null
                        }
                    );
                }
            }

            // Test 2.4: Vote on thread (if we have threads)
            if (this.testData.threads.length > 0) {
                const targetThread = this.testData.threads[0];
                const voteData = { vote_type: 'up' };

                const { response: voteResponse, data: voteResultData } = await this.apiRequest(
                    `/api/user/forums/threads/${targetThread.id}/vote`,
                    {
                        method: 'POST', 
                        body: JSON.stringify(voteData)
                    },
                    auth.token
                );

                this.recordTest('postingSystem', 'Vote on forum thread',
                    voteResponse.ok,
                    {
                        statusCode: voteResponse.status,
                        threadId: targetThread.id,
                        voteType: 'up',
                        error: !voteResponse.ok ? `Voting failed: ${voteResponse.status}` : null
                    }
                );
            }

            // Test 2.5: Delete post (cleanup)
            if (createdThreadId) {
                const { response: deleteResponse } = await this.apiRequest(
                    `/api/user/forums/threads/${createdThreadId}`,
                    { method: 'DELETE' },
                    auth.token
                );

                this.recordTest('postingSystem', 'Delete forum thread',
                    deleteResponse.ok,
                    {
                        statusCode: deleteResponse.status,
                        threadId: createdThreadId,
                        error: !deleteResponse.ok ? `Delete failed: ${deleteResponse.status}` : null
                    }
                );
            }

        } catch (error) {
            this.recordTest('postingSystem', 'Forum posting system connectivity',
                false,
                { error: error.message }
            );
        }
    }

    // Test 3: Mention System
    async testMentionSystem() {
        this.log('🔗 Testing Forum Mention System', 'info');

        const auth = await this.authenticateUser(FORUM_TEST_CONFIG.testUser);
        if (!auth) {
            this.recordTest('mentionSystem', 'User authentication for mentions', false, 
                { error: 'Could not authenticate test user' });
            return;
        }

        try {
            // Test 3.1: User mention search/autocomplete
            const { response: userSearchResponse, data: userSearchData } = await this.apiRequest(
                '/api/search/users?q=test',
                {},
                auth.token
            );

            this.recordTest('mentionSystem', 'User mention autocomplete',
                userSearchResponse.ok,
                {
                    statusCode: userSearchResponse.status,
                    usersFound: (userSearchData?.data || userSearchData)?.length || 0,
                    error: !userSearchResponse.ok ? `User search failed: ${userSearchResponse.status}` : null
                }
            );

            // Test 3.2: Team mention search
            const { response: teamSearchResponse, data: teamSearchData } = await this.apiRequest(
                '/api/search/teams?q=test',
                {},
                auth.token
            );

            this.recordTest('mentionSystem', 'Team mention autocomplete',
                teamSearchResponse.ok,
                {
                    statusCode: teamSearchResponse.status,
                    teamsFound: (teamSearchData?.data || teamSearchData)?.length || 0,
                    error: !teamSearchResponse.ok ? `Team search failed: ${teamSearchResponse.status}` : null
                }
            );

            // Test 3.3: Player mention search  
            const { response: playerSearchResponse, data: playerSearchData } = await this.apiRequest(
                '/api/search/players?q=test',
                {},
                auth.token
            );

            this.recordTest('mentionSystem', 'Player mention autocomplete',
                playerSearchResponse.ok,
                {
                    statusCode: playerSearchResponse.status,
                    playersFound: (playerSearchData?.data || playerSearchData)?.length || 0,
                    error: !playerSearchResponse.ok ? `Player search failed: ${playerSearchResponse.status}` : null
                }
            );

            // Test 3.4: Create thread with mentions
            const mentionThreadData = {
                title: 'Test Thread with Mentions @testuser @team:testteam @player:testplayer',
                content: 'Testing mentions: @testuser what do you think? @team:testteam and @player:testplayer should see this!',
            };

            const { response: mentionResponse, data: mentionData } = await this.apiRequest(
                '/api/user/forums/threads',
                {
                    method: 'POST',
                    body: JSON.stringify(mentionThreadData)
                },
                auth.token
            );

            this.recordTest('mentionSystem', 'Create thread with mentions',
                mentionResponse.ok,
                {
                    statusCode: mentionResponse.status,
                    threadId: mentionData?.id || mentionData?.data?.id,
                    mentionsInTitle: (mentionThreadData.title.match(/@\w+/g) || []).length,
                    mentionsInContent: (mentionThreadData.content.match(/@\w+:\w+|@\w+/g) || []).length,
                    error: !mentionResponse.ok ? `Mention thread creation failed: ${mentionResponse.status}` : null
                }
            );

            // Test 3.5: Verify mention parsing and display
            if (mentionResponse.ok && mentionData?.id) {
                const threadId = mentionData.id || mentionData.data?.id;
                const { response: detailResponse, data: detailData } = await this.apiRequest(
                    `/api/forums/threads/${threadId}`
                );

                const hasMentions = detailData?.mentions && Array.isArray(detailData.mentions) && detailData.mentions.length > 0;
                this.recordTest('mentionSystem', 'Mention parsing and storage',
                    detailResponse.ok && hasMentions,
                    {
                        statusCode: detailResponse.status,
                        threadId: threadId,
                        mentionsStored: detailData?.mentions?.length || 0,
                        mentionTypes: hasMentions ? detailData.mentions.map(m => m.type) : [],
                        error: !detailResponse.ok ? `Mention detail fetch failed: ${detailResponse.status}` : 
                               !hasMentions ? 'No mentions found in stored thread data' : null
                    }
                );

                // Cleanup
                await this.apiRequest(`/api/user/forums/threads/${threadId}`, { method: 'DELETE' }, auth.token);
            }

        } catch (error) {
            this.recordTest('mentionSystem', 'Mention system connectivity',
                false,
                { error: error.message }
            );
        }
    }

    // Test 4: Admin Features
    async testAdminFeatures() {
        this.log('👑 Testing Forum Admin Features', 'info');

        const adminAuth = await this.authenticateUser(FORUM_TEST_CONFIG.testAdmin);
        if (!adminAuth) {
            this.recordTest('adminFeatures', 'Admin authentication', false, 
                { error: 'Could not authenticate admin user' });
            return;
        }

        try {
            // Create a test thread first
            const testThreadData = {
                title: `Admin Test Thread ${Date.now()}`,
                content: 'Test thread for admin moderation features'
            };

            const { response: createResponse, data: createData } = await this.apiRequest(
                '/api/user/forums/threads',
                {
                    method: 'POST',
                    body: JSON.stringify(testThreadData)
                },
                adminAuth.token
            );

            let testThreadId = null;
            if (createResponse.ok) {
                testThreadId = createData?.id || createData?.data?.id;
            }

            if (!testThreadId) {
                this.recordTest('adminFeatures', 'Create test thread for admin testing', false,
                    { error: 'Could not create test thread for admin features' });
                return;
            }

            // Test 4.1: Pin thread
            const { response: pinResponse, data: pinData } = await this.apiRequest(
                `/api/admin/forums/threads/${testThreadId}/pin`,
                { method: 'POST' },
                adminAuth.token
            );

            this.recordTest('adminFeatures', 'Pin forum thread',
                pinResponse.ok,
                {
                    statusCode: pinResponse.status,
                    threadId: testThreadId,
                    error: !pinResponse.ok ? `Pin failed: ${pinResponse.status}` : null
                }
            );

            // Test 4.2: Unpin thread
            const { response: unpinResponse } = await this.apiRequest(
                `/api/admin/forums/threads/${testThreadId}/unpin`,
                { method: 'POST' },
                adminAuth.token
            );

            this.recordTest('adminFeatures', 'Unpin forum thread',
                unpinResponse.ok,
                {
                    statusCode: unpinResponse.status,
                    threadId: testThreadId,
                    error: !unpinResponse.ok ? `Unpin failed: ${unpinResponse.status}` : null
                }
            );

            // Test 4.3: Lock thread
            const { response: lockResponse } = await this.apiRequest(
                `/api/admin/forums/threads/${testThreadId}/lock`,
                { method: 'POST' },
                adminAuth.token
            );

            this.recordTest('adminFeatures', 'Lock forum thread',
                lockResponse.ok,
                {
                    statusCode: lockResponse.status,
                    threadId: testThreadId,
                    error: !lockResponse.ok ? `Lock failed: ${lockResponse.status}` : null
                }
            );

            // Test 4.4: Unlock thread
            const { response: unlockResponse } = await this.apiRequest(
                `/api/admin/forums/threads/${testThreadId}/unlock`,
                { method: 'POST' },
                adminAuth.token
            );

            this.recordTest('adminFeatures', 'Unlock forum thread',
                unlockResponse.ok,
                {
                    statusCode: unlockResponse.status,
                    threadId: testThreadId,
                    error: !unlockResponse.ok ? `Unlock failed: ${unlockResponse.status}` : null
                }
            );

            // Test 4.5: Delete thread (admin)
            const { response: adminDeleteResponse } = await this.apiRequest(
                `/api/admin/forums/threads/${testThreadId}/delete`,
                { method: 'POST' },
                adminAuth.token
            );

            this.recordTest('adminFeatures', 'Admin delete forum thread',
                adminDeleteResponse.ok,
                {
                    statusCode: adminDeleteResponse.status,
                    threadId: testThreadId,
                    error: !adminDeleteResponse.ok ? `Admin delete failed: ${adminDeleteResponse.status}` : null
                }
            );

            // Test 4.6: Category management
            const newCategoryData = {
                name: `Test Category ${Date.now()}`,
                slug: `test-category-${Date.now()}`,
                description: 'Test category for admin testing',
                color: '#FF6B6B',
                icon: '🧪'
            };

            const { response: catCreateResponse, data: catCreateData } = await this.apiRequest(
                '/api/admin/forums/categories',
                {
                    method: 'POST',
                    body: JSON.stringify(newCategoryData)
                },
                adminAuth.token
            );

            this.recordTest('adminFeatures', 'Create forum category',
                catCreateResponse.ok,
                {
                    statusCode: catCreateResponse.status,
                    categoryName: newCategoryData.name,
                    categoryId: catCreateData?.id || catCreateData?.data?.id,
                    error: !catCreateResponse.ok ? `Category creation failed: ${catCreateResponse.status}` : null
                }
            );

            // Cleanup created category
            if (catCreateResponse.ok && (catCreateData?.id || catCreateData?.data?.id)) {
                const categoryId = catCreateData.id || catCreateData.data.id;
                await this.apiRequest(`/api/admin/forums/categories/${categoryId}`, 
                    { method: 'DELETE' }, adminAuth.token);
            }

        } catch (error) {
            this.recordTest('adminFeatures', 'Admin features connectivity',
                false,
                { error: error.message }
            );
        }
    }

    // Test 5: Forum Categories
    async testCategories() {
        this.log('📁 Testing Forum Categories', 'info');

        try {
            // Test 5.1: Load all categories
            const { response: allCatResponse, data: allCatData } = await this.apiRequest('/api/forums/categories');
            this.recordTest('categories', 'Load all forum categories',
                allCatResponse.ok && Array.isArray(allCatData?.data || allCatData),
                {
                    statusCode: allCatResponse.status,
                    categoriesCount: (allCatData?.data || allCatData)?.length || 0,
                    error: !allCatResponse.ok ? `Categories load failed: ${allCatResponse.status}` : null
                }
            );

            // Test 5.2: Category data structure validation
            if (allCatResponse.ok) {
                const categories = allCatData?.data || allCatData || [];
                const validCategories = categories.filter(cat => 
                    cat.id && cat.name && cat.slug && 
                    typeof cat.id !== 'undefined' &&
                    typeof cat.name === 'string' &&
                    typeof cat.slug === 'string'
                );

                this.recordTest('categories', 'Category data structure validation',
                    validCategories.length === categories.length,
                    {
                        totalCategories: categories.length,
                        validCategories: validCategories.length,
                        invalidCategories: categories.length - validCategories.length,
                        error: validCategories.length !== categories.length ? 'Some categories have invalid data structure' : null
                    }
                );
            }

            // Test 5.3: Category filtering
            if (this.testData.categories.length > 0) {
                const testCategory = this.testData.categories[0];
                const { response: filterResponse, data: filterData } = await this.apiRequest(
                    `/api/forums/threads?category=${testCategory.slug}`
                );

                this.recordTest('categories', 'Filter threads by category',
                    filterResponse.ok,
                    {
                        statusCode: filterResponse.status,
                        categorySlug: testCategory.slug,
                        categoryName: testCategory.name,
                        filteredThreads: (filterData?.data || filterData)?.length || 0,
                        error: !filterResponse.ok ? `Category filtering failed: ${filterResponse.status}` : null
                    }
                );
            }

            // Test 5.4: Category-specific thread counts
            for (const category of this.testData.categories.slice(0, 3)) { // Test first 3 categories
                const { response: countResponse, data: countData } = await this.apiRequest(
                    `/api/forums/threads?category=${category.slug}`
                );

                this.recordTest('categories', `Thread count for category: ${category.name}`,
                    countResponse.ok,
                    {
                        statusCode: countResponse.status,
                        categorySlug: category.slug,
                        threadCount: (countData?.data || countData)?.length || 0,
                        error: !countResponse.ok ? `Count failed for category ${category.name}: ${countResponse.status}` : null
                    }
                );
            }

        } catch (error) {
            this.recordTest('categories', 'Category system connectivity',
                false,
                { error: error.message }
            );
        }
    }

    // Test 6: Mobile Experience
    async testMobileExperience() {
        this.log('📱 Testing Mobile Forum Experience', 'info');

        try {
            // Test 6.1: Mobile-specific API endpoints (if any)
            const { response: mobileResponse, data: mobileData } = await this.apiRequest('/api/forums/threads?mobile=1');
            this.recordTest('mobileExperience', 'Mobile-optimized thread loading',
                mobileResponse.ok,
                {
                    statusCode: mobileResponse.status,
                    mobileThreads: (mobileData?.data || mobileData)?.length || 0,
                    error: !mobileResponse.ok ? `Mobile API failed: ${mobileResponse.status}` : null
                }
            );

            // Test 6.2: Pagination for mobile (smaller page size)
            const { response: mobilePagResponse, data: mobilePagData } = await this.apiRequest('/api/forums/threads?page=1&limit=10');
            this.recordTest('mobileExperience', 'Mobile pagination (smaller page size)',
                mobilePagResponse.ok,
                {
                    statusCode: mobilePagResponse.status,
                    threadsPerPage: (mobilePagData?.data || mobilePagData)?.length || 0,
                    requestedLimit: 10,
                    error: !mobilePagResponse.ok ? `Mobile pagination failed: ${mobilePagResponse.status}` : null
                }
            );

            // Test 6.3: Mobile thread detail (lighter payload)
            if (this.testData.threads.length > 0) {
                const testThread = this.testData.threads[0];
                const { response: mobileDetailResponse, data: mobileDetailData } = await this.apiRequest(
                    `/api/forums/threads/${testThread.id}?mobile=1`
                );

                this.recordTest('mobileExperience', 'Mobile thread detail loading',
                    mobileDetailResponse.ok,
                    {
                        statusCode: mobileDetailResponse.status,
                        threadId: testThread.id,
                        postsLoaded: mobileDetailData?.posts?.length || 0,
                        error: !mobileDetailResponse.ok ? `Mobile thread detail failed: ${mobileDetailResponse.status}` : null
                    }
                );
            }

            // Test 6.4: Search suggestions for mobile
            const { response: suggestResponse, data: suggestData } = await this.apiRequest('/api/forums/search/suggestions?q=test&mobile=1');
            this.recordTest('mobileExperience', 'Mobile search suggestions',
                suggestResponse.ok,
                {
                    statusCode: suggestResponse.status,
                    suggestions: (suggestData?.suggestions || suggestData)?.length || 0,
                    error: !suggestResponse.ok ? `Mobile search suggestions failed: ${suggestResponse.status}` : null
                }
            );

            // Test 6.5: Mobile-specific error handling
            const { response: errorResponse } = await this.apiRequest('/api/forums/threads/nonexistent?mobile=1');
            this.recordTest('mobileExperience', 'Mobile error handling (404)',
                errorResponse.status === 404,
                {
                    statusCode: errorResponse.status,
                    expectedStatus: 404,
                    error: errorResponse.status !== 404 ? `Expected 404, got ${errorResponse.status}` : null
                }
            );

            // Test 6.6: Authentication check for mobile posting
            const auth = await this.authenticateUser(FORUM_TEST_CONFIG.testUser);
            if (auth) {
                const mobileThreadData = {
                    title: `Mobile Test Thread ${Date.now()}`,
                    content: 'Testing mobile thread creation',
                    mobile: true
                };

                const { response: mobileCreateResponse, data: mobileCreateData } = await this.apiRequest(
                    '/api/user/forums/threads',
                    {
                        method: 'POST',
                        body: JSON.stringify(mobileThreadData)
                    },
                    auth.token
                );

                this.recordTest('mobileExperience', 'Mobile thread creation',
                    mobileCreateResponse.ok,
                    {
                        statusCode: mobileCreateResponse.status,
                        threadId: mobileCreateData?.id || mobileCreateData?.data?.id,
                        error: !mobileCreateResponse.ok ? `Mobile thread creation failed: ${mobileCreateResponse.status}` : null
                    }
                );

                // Cleanup mobile test thread
                if (mobileCreateResponse.ok && (mobileCreateData?.id || mobileCreateData?.data?.id)) {
                    const threadId = mobileCreateData.id || mobileCreateData.data.id;
                    await this.apiRequest(`/api/user/forums/threads/${threadId}`, { method: 'DELETE' }, auth.token);
                }
            }

        } catch (error) {
            this.recordTest('mobileExperience', 'Mobile experience connectivity',
                false,
                { error: error.message }
            );
        }
    }

    // Additional Tests for [object Object] Prevention
    async testObjectObjectPrevention() {
        this.log('🔧 Testing [object Object] Prevention', 'info');

        const auth = await this.authenticateUser(FORUM_TEST_CONFIG.testUser);
        if (!auth) return;

        try {
            // Test with various data types that could cause [object Object]
            const problematicData = {
                title: { toString: () => 'Valid Title' }, // Object with toString
                content: 'Normal content',
            };

            const { response: objectTestResponse } = await this.apiRequest(
                '/api/user/forums/threads',
                {
                    method: 'POST',
                    body: JSON.stringify(problematicData)
                },
                auth.token
            );

            this.recordTest('postingSystem', 'Handle object title gracefully',
                objectTestResponse.status === 422 || objectTestResponse.status === 400,
                {
                    statusCode: objectTestResponse.status,
                    expectedValidation: true,
                    error: objectTestResponse.ok ? 'Should have rejected object title' : null
                }
            );

        } catch (error) {
            this.recordTest('postingSystem', 'Object object prevention system',
                false,
                { error: error.message }
            );
        }
    }

    // Generate comprehensive report
    generateReport() {
        const report = {
            testSuite: 'Comprehensive Forum System Test',
            timestamp: new Date().toISOString(),
            environment: {
                backend: FORUM_TEST_CONFIG.backend,
                frontend: FORUM_TEST_CONFIG.frontend
            },
            summary: {
                totalTests: this.results.overall.passed + this.results.overall.failed,
                passed: this.results.overall.passed,
                failed: this.results.overall.failed,
                successRate: this.results.overall.passed + this.results.overall.failed > 0 
                    ? ((this.results.overall.passed / (this.results.overall.passed + this.results.overall.failed)) * 100).toFixed(2) + '%'
                    : '0%'
            },
            categories: {
                threadDisplay: {
                    passed: this.results.threadDisplay.passed,
                    failed: this.results.threadDisplay.failed,
                    tests: this.results.threadDisplay.tests
                },
                postingSystem: {
                    passed: this.results.postingSystem.passed,
                    failed: this.results.postingSystem.failed,
                    tests: this.results.postingSystem.tests
                },
                mentionSystem: {
                    passed: this.results.mentionSystem.passed,
                    failed: this.results.mentionSystem.failed,
                    tests: this.results.mentionSystem.tests
                },
                adminFeatures: {
                    passed: this.results.adminFeatures.passed,
                    failed: this.results.adminFeatures.failed,
                    tests: this.results.adminFeatures.tests
                },
                categories: {
                    passed: this.results.categories.passed,
                    failed: this.results.categories.failed,
                    tests: this.results.categories.tests
                },
                mobileExperience: {
                    passed: this.results.mobileExperience.passed,
                    failed: this.results.mobileExperience.failed,
                    tests: this.results.mobileExperience.tests
                }
            },
            criticalErrors: this.results.overall.errors,
            recommendations: this.generateRecommendations()
        };

        return report;
    }

    generateRecommendations() {
        const recommendations = [];

        // Analyze results and provide recommendations
        if (this.results.threadDisplay.failed > 0) {
            recommendations.push("🔍 Thread Display Issues: Check forum API endpoints and database connectivity");
        }

        if (this.results.postingSystem.failed > 0) {
            recommendations.push("✍️ Posting System Issues: Verify authentication and posting endpoints");
        }

        if (this.results.mentionSystem.failed > 0) {
            recommendations.push("🔗 Mention System Issues: Check mention parsing and search functionality");
        }

        if (this.results.adminFeatures.failed > 0) {
            recommendations.push("👑 Admin Features Issues: Verify admin permissions and moderation endpoints");
        }

        if (this.results.categories.failed > 0) {
            recommendations.push("📁 Category Issues: Check category management and filtering");
        }

        if (this.results.mobileExperience.failed > 0) {
            recommendations.push("📱 Mobile Experience Issues: Optimize mobile API responses and error handling");
        }

        if (recommendations.length === 0) {
            recommendations.push("✅ All systems functioning well! Consider performance optimization and user experience enhancements.");
        }

        return recommendations;
    }

    // Main test runner
    async runAllTests() {
        this.log('🚀 Starting Comprehensive Forum System Test Suite', 'info');
        console.log('=' .repeat(80));

        const startTime = Date.now();

        try {
            // Run all test categories
            await this.testThreadDisplay();
            await this.testPostingSystem();
            await this.testMentionSystem();
            await this.testAdminFeatures();
            await this.testCategories();
            await this.testMobileExperience();
            await this.testObjectObjectPrevention();

        } catch (error) {
            this.log(`💥 Fatal error during testing: ${error.message}`, 'error');
        }

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);

        this.log(`⏱️ Test suite completed in ${duration} seconds`, 'info');
        console.log('=' .repeat(80));

        // Generate and return report
        const report = this.generateReport();
        
        // Log summary
        this.log('📊 TEST RESULTS SUMMARY:', 'info');
        this.log(`✅ Passed: ${report.summary.passed}`, 'success');
        this.log(`❌ Failed: ${report.summary.failed}`, 'error');
        this.log(`📈 Success Rate: ${report.summary.successRate}`, 'info');

        if (report.criticalErrors.length > 0) {
            this.log('🚨 CRITICAL ERRORS:', 'error');
            report.criticalErrors.forEach(error => {
                this.log(`   • ${error}`, 'error');
            });
        }

        this.log('💡 RECOMMENDATIONS:', 'warning');
        report.recommendations.forEach(rec => {
            this.log(`   • ${rec}`, 'warning');
        });

        return report;
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComprehensiveForumTester;
}

// Auto-run if called directly
if (require.main === module) {
    const tester = new ComprehensiveForumTester();
    tester.runAllTests().then(report => {
        console.log('\n' + '='.repeat(80));
        console.log('📄 FULL REPORT:');
        console.log(JSON.stringify(report, null, 2));
        console.log('='.repeat(80));
    }).catch(error => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}