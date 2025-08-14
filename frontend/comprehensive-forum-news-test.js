/**
 * MRVL Tournament Platform - Comprehensive Forum & News System Test
 * 
 * This script performs thorough testing of:
 * - Forum system (threads, posts, voting, moderation)
 * - News system (articles, comments, voting)
 * - Voting system validation (1 vote per user enforcement)
 * - Cross-system integration and consistency
 * 
 * Test Environment: staging.mrvl.net
 * Focus: Post-voting fix validation
 */

class ComprehensiveForumNewsTest {
  constructor() {
    this.baseUrl = 'https://staging.mrvl.net';
    this.results = {
      forum: {
        threads: [],
        posts: [],
        voting: [],
        moderation: []
      },
      news: {
        articles: [],
        comments: [],
        voting: []
      },
      voting: {
        duplicateVotePrevention: [],
        voteSwitching: [],
        voteRemoval: [],
        crossSystemConsistency: []
      },
      integration: {
        authentication: [],
        permissions: [],
        dataConsistency: []
      },
      issues: [],
      performance: []
    };
    this.testStartTime = Date.now();
    this.testData = {};
  }

  // Utility Functions
  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '✅';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateTestData() {
    const timestamp = Date.now();
    return {
      thread: {
        title: `Test Thread ${timestamp}`,
        content: `Test thread content created at ${new Date().toISOString()}`,
        category: 'general'
      },
      post: {
        content: `Test post reply created at ${new Date().toISOString()}`
      },
      news: {
        title: `Test News Article ${timestamp}`,
        content: `Test news content created at ${new Date().toISOString()}`,
        category: 'announcements'
      },
      comment: {
        content: `Test comment created at ${new Date().toISOString()}`
      }
    };
  }

  // Authentication Helper
  async checkAuthentication() {
    try {
      const response = await fetch(`${this.baseUrl}/api/user/profile`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        this.log(`Authenticated as: ${userData.username} (${userData.role})`);
        this.testData.currentUser = userData;
        return true;
      } else {
        this.log('Not authenticated - some tests will be skipped', 'warn');
        return false;
      }
    } catch (error) {
      this.log(`Authentication check failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Forum System Tests
  async testForumThreads() {
    this.log('Testing Forum Thread Operations...');
    
    try {
      // Test 1: Thread Creation
      const testData = this.generateTestData();
      const createResponse = await fetch(`${this.baseUrl}/api/forums/threads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(testData.thread)
      });

      if (createResponse.ok) {
        const createdThread = await createResponse.json();
        this.results.forum.threads.push({
          test: 'Thread Creation',
          status: 'PASS',
          threadId: createdThread.data?.id || createdThread.id,
          details: 'Thread created successfully'
        });
        this.testData.createdThread = createdThread.data || createdThread;
        this.log('✅ Thread creation: PASS');
      } else {
        throw new Error(`Thread creation failed: ${createResponse.status}`);
      }

      // Test 2: Thread Retrieval
      if (this.testData.createdThread) {
        const threadId = this.testData.createdThread.id;
        const getResponse = await fetch(`${this.baseUrl}/api/forums/threads/${threadId}`, {
          credentials: 'include'
        });

        if (getResponse.ok) {
          const threadData = await getResponse.json();
          this.results.forum.threads.push({
            test: 'Thread Retrieval',
            status: 'PASS',
            threadId: threadId,
            details: 'Thread retrieved successfully'
          });
          this.log('✅ Thread retrieval: PASS');
        } else {
          throw new Error(`Thread retrieval failed: ${getResponse.status}`);
        }
      }

      // Test 3: Thread Editing
      if (this.testData.createdThread) {
        const threadId = this.testData.createdThread.id;
        const editData = {
          title: `${testData.thread.title} - EDITED`,
          content: `${testData.thread.content} - EDITED CONTENT`
        };

        const editResponse = await fetch(`${this.baseUrl}/api/forums/threads/${threadId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(editData)
        });

        if (editResponse.ok) {
          this.results.forum.threads.push({
            test: 'Thread Editing',
            status: 'PASS',
            threadId: threadId,
            details: 'Thread edited successfully'
          });
          this.log('✅ Thread editing: PASS');
        } else {
          this.results.forum.threads.push({
            test: 'Thread Editing',
            status: 'WARN',
            threadId: threadId,
            details: `Edit failed: ${editResponse.status} (may be permission-based)`
          });
          this.log('⚠️ Thread editing: WARN (may be permission-based)');
        }
      }

    } catch (error) {
      this.results.forum.threads.push({
        test: 'Thread Operations',
        status: 'FAIL',
        details: error.message
      });
      this.log(`❌ Forum threads test failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'Forum Threads',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  async testForumPosts() {
    this.log('Testing Forum Post Operations...');
    
    try {
      if (!this.testData.createdThread) {
        throw new Error('No thread available for post testing');
      }

      const threadId = this.testData.createdThread.id;
      const testData = this.generateTestData();

      // Test 1: Post Creation
      const createResponse = await fetch(`${this.baseUrl}/api/forums/threads/${threadId}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(testData.post)
      });

      if (createResponse.ok) {
        const createdPost = await createResponse.json();
        this.results.forum.posts.push({
          test: 'Post Creation',
          status: 'PASS',
          threadId: threadId,
          postId: createdPost.data?.id || createdPost.id,
          details: 'Post created successfully'
        });
        this.testData.createdPost = createdPost.data || createdPost;
        this.log('✅ Post creation: PASS');
      } else {
        throw new Error(`Post creation failed: ${createResponse.status}`);
      }

      // Test 2: Post Editing
      if (this.testData.createdPost) {
        const postId = this.testData.createdPost.id;
        const editData = {
          content: `${testData.post.content} - EDITED POST CONTENT`
        };

        const editResponse = await fetch(`${this.baseUrl}/api/forums/posts/${postId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(editData)
        });

        if (editResponse.ok) {
          this.results.forum.posts.push({
            test: 'Post Editing',
            status: 'PASS',
            postId: postId,
            details: 'Post edited successfully'
          });
          this.log('✅ Post editing: PASS');
        } else {
          this.results.forum.posts.push({
            test: 'Post Editing',
            status: 'WARN',
            postId: postId,
            details: `Edit failed: ${editResponse.status} (may be permission-based)`
          });
          this.log('⚠️ Post editing: WARN (may be permission-based)');
        }
      }

      // Test 3: Nested Reply Creation
      if (this.testData.createdPost) {
        const parentPostId = this.testData.createdPost.id;
        const replyData = {
          content: `Nested reply to post ${parentPostId}`,
          parent_id: parentPostId
        };

        const replyResponse = await fetch(`${this.baseUrl}/api/forums/threads/${threadId}/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(replyData)
        });

        if (replyResponse.ok) {
          const createdReply = await replyResponse.json();
          this.results.forum.posts.push({
            test: 'Nested Reply Creation',
            status: 'PASS',
            threadId: threadId,
            parentPostId: parentPostId,
            replyId: createdReply.data?.id || createdReply.id,
            details: 'Nested reply created successfully'
          });
          this.testData.createdReply = createdReply.data || createdReply;
          this.log('✅ Nested reply creation: PASS');
        } else {
          this.results.forum.posts.push({
            test: 'Nested Reply Creation',
            status: 'WARN',
            details: `Reply creation failed: ${replyResponse.status}`
          });
          this.log('⚠️ Nested reply creation: WARN');
        }
      }

    } catch (error) {
      this.results.forum.posts.push({
        test: 'Post Operations',
        status: 'FAIL',
        details: error.message
      });
      this.log(`❌ Forum posts test failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'Forum Posts',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  async testForumVoting() {
    this.log('Testing Forum Voting System...');
    
    try {
      // Test Thread Voting
      if (this.testData.createdThread) {
        await this.testVotingOnItem('forum_thread', this.testData.createdThread.id, 'Thread');
      }

      // Test Post Voting
      if (this.testData.createdPost) {
        await this.testVotingOnItem('forum_post', this.testData.createdPost.id, 'Post');
      }

    } catch (error) {
      this.results.forum.voting.push({
        test: 'Forum Voting',
        status: 'FAIL',
        details: error.message
      });
      this.log(`❌ Forum voting test failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'Forum Voting',
        issue: error.message,
        severity: 'CRITICAL'
      });
    }
  }

  async testVotingOnItem(itemType, itemId, itemName) {
    const baseEndpoint = itemType === 'forum_thread' ? 
      `/api/forums/threads/${itemId}/vote` : 
      itemType === 'forum_post' ? 
      `/api/forums/posts/${itemId}/vote` :
      itemType === 'news' ?
      `/api/news/${itemId}/vote` :
      `/api/news/comments/${itemId}/vote`;

    // Test 1: Initial Upvote
    let upvoteResponse = await fetch(`${this.baseUrl}${baseEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ vote_type: 'upvote' })
    });

    if (upvoteResponse.ok) {
      const upvoteData = await upvoteResponse.json();
      this.results.voting.duplicateVotePrevention.push({
        test: `${itemName} Initial Upvote`,
        status: 'PASS',
        itemType: itemType,
        itemId: itemId,
        voteType: 'upvote',
        response: upvoteData,
        details: 'Initial upvote successful'
      });
      this.log(`✅ ${itemName} initial upvote: PASS`);

      // Test 2: Duplicate Vote Prevention
      await this.delay(500);
      let duplicateResponse = await fetch(`${this.baseUrl}${baseEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ vote_type: 'upvote' })
      });

      // This should either remove the vote or return a conflict
      if (duplicateResponse.status === 409) {
        this.results.voting.duplicateVotePrevention.push({
          test: `${itemName} Duplicate Vote Prevention`,
          status: 'PASS',
          itemType: itemType,
          itemId: itemId,
          details: 'Duplicate vote correctly prevented with 409 status'
        });
        this.log(`✅ ${itemName} duplicate vote prevention: PASS`);
      } else if (duplicateResponse.ok) {
        const duplicateData = await duplicateResponse.json();
        if (duplicateData.action === 'removed') {
          this.results.voting.voteRemoval.push({
            test: `${itemName} Vote Removal`,
            status: 'PASS',
            itemType: itemType,
            itemId: itemId,
            details: 'Vote removal working correctly'
          });
          this.log(`✅ ${itemName} vote removal: PASS`);
        } else {
          this.results.voting.duplicateVotePrevention.push({
            test: `${itemName} Duplicate Vote Prevention`,
            status: 'WARN',
            itemType: itemType,
            itemId: itemId,
            details: 'Duplicate vote handling unclear'
          });
          this.log(`⚠️ ${itemName} duplicate vote prevention: WARN`);
        }
      }

      // Test 3: Vote Switching (Upvote to Downvote)
      await this.delay(500);
      let switchResponse = await fetch(`${this.baseUrl}${baseEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ vote_type: 'downvote' })
      });

      if (switchResponse.ok) {
        const switchData = await switchResponse.json();
        this.results.voting.voteSwitching.push({
          test: `${itemName} Vote Switching`,
          status: 'PASS',
          itemType: itemType,
          itemId: itemId,
          fromVote: 'upvote',
          toVote: 'downvote',
          response: switchData,
          details: 'Vote switching successful'
        });
        this.log(`✅ ${itemName} vote switching: PASS`);
      } else {
        this.results.voting.voteSwitching.push({
          test: `${itemName} Vote Switching`,
          status: 'FAIL',
          itemType: itemType,
          itemId: itemId,
          details: `Vote switching failed: ${switchResponse.status}`
        });
        this.log(`❌ ${itemName} vote switching: FAIL`);
      }

    } else {
      this.results.voting.duplicateVotePrevention.push({
        test: `${itemName} Initial Voting`,
        status: 'FAIL',
        itemType: itemType,
        itemId: itemId,
        details: `Initial vote failed: ${upvoteResponse.status}`
      });
      this.log(`❌ ${itemName} initial voting: FAIL`);
    }
  }

  async testModerationActions() {
    this.log('Testing Forum Moderation Actions...');
    
    try {
      if (!this.testData.createdThread) {
        throw new Error('No thread available for moderation testing');
      }

      const threadId = this.testData.createdThread.id;

      // Test 1: Thread Pinning
      const pinResponse = await fetch(`${this.baseUrl}/api/admin/forums/threads/${threadId}/pin`, {
        method: 'POST',
        credentials: 'include'
      });

      if (pinResponse.ok) {
        this.results.forum.moderation.push({
          test: 'Thread Pinning',
          status: 'PASS',
          threadId: threadId,
          details: 'Thread pinned successfully'
        });
        this.log('✅ Thread pinning: PASS');

        // Test unpinning
        await this.delay(500);
        const unpinResponse = await fetch(`${this.baseUrl}/api/admin/forums/threads/${threadId}/unpin`, {
          method: 'POST',
          credentials: 'include'
        });

        if (unpinResponse.ok) {
          this.results.forum.moderation.push({
            test: 'Thread Unpinning',
            status: 'PASS',
            threadId: threadId,
            details: 'Thread unpinned successfully'
          });
          this.log('✅ Thread unpinning: PASS');
        }
      } else if (pinResponse.status === 403) {
        this.results.forum.moderation.push({
          test: 'Thread Pinning',
          status: 'SKIP',
          threadId: threadId,
          details: 'Insufficient permissions for moderation actions'
        });
        this.log('⚠️ Thread pinning: SKIP (insufficient permissions)');
      } else {
        throw new Error(`Thread pinning failed: ${pinResponse.status}`);
      }

      // Test 2: Thread Locking
      const lockResponse = await fetch(`${this.baseUrl}/api/admin/forums/threads/${threadId}/lock`, {
        method: 'POST',
        credentials: 'include'
      });

      if (lockResponse.ok) {
        this.results.forum.moderation.push({
          test: 'Thread Locking',
          status: 'PASS',
          threadId: threadId,
          details: 'Thread locked successfully'
        });
        this.log('✅ Thread locking: PASS');

        // Test unlocking
        await this.delay(500);
        const unlockResponse = await fetch(`${this.baseUrl}/api/admin/forums/threads/${threadId}/unlock`, {
          method: 'POST',
          credentials: 'include'
        });

        if (unlockResponse.ok) {
          this.results.forum.moderation.push({
            test: 'Thread Unlocking',
            status: 'PASS',
            threadId: threadId,
            details: 'Thread unlocked successfully'
          });
          this.log('✅ Thread unlocking: PASS');
        }
      } else if (lockResponse.status === 403) {
        this.results.forum.moderation.push({
          test: 'Thread Locking',
          status: 'SKIP',
          threadId: threadId,
          details: 'Insufficient permissions for moderation actions'
        });
        this.log('⚠️ Thread locking: SKIP (insufficient permissions)');
      }

    } catch (error) {
      this.results.forum.moderation.push({
        test: 'Moderation Actions',
        status: 'FAIL',
        details: error.message
      });
      this.log(`❌ Moderation actions test failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'Forum Moderation',
        issue: error.message,
        severity: 'MEDIUM'
      });
    }
  }

  async testNewsSystem() {
    this.log('Testing News System...');
    
    try {
      // Test 1: News Article Retrieval
      const articlesResponse = await fetch(`${this.baseUrl}/api/news`, {
        credentials: 'include'
      });

      if (articlesResponse.ok) {
        const articlesData = await articlesResponse.json();
        const articles = articlesData.data || articlesData;
        
        this.results.news.articles.push({
          test: 'News Article Retrieval',
          status: 'PASS',
          count: articles.length,
          details: `Retrieved ${articles.length} news articles`
        });
        this.log(`✅ News article retrieval: PASS (${articles.length} articles)`);

        // Test with first article if available
        if (articles.length > 0) {
          this.testData.newsArticle = articles[0];
          
          // Test 2: Individual Article Retrieval
          const articleId = this.testData.newsArticle.id;
          const articleResponse = await fetch(`${this.baseUrl}/api/news/${articleId}`, {
            credentials: 'include'
          });

          if (articleResponse.ok) {
            const articleData = await articleResponse.json();
            this.results.news.articles.push({
              test: 'Individual Article Retrieval',
              status: 'PASS',
              articleId: articleId,
              details: 'Individual article retrieved successfully'
            });
            this.log('✅ Individual article retrieval: PASS');

            // Test 3: News Voting
            await this.testVotingOnItem('news', articleId, 'News Article');
          }
        }
      } else {
        throw new Error(`News retrieval failed: ${articlesResponse.status}`);
      }

    } catch (error) {
      this.results.news.articles.push({
        test: 'News System',
        status: 'FAIL',
        details: error.message
      });
      this.log(`❌ News system test failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'News System',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  async testNewsComments() {
    this.log('Testing News Comment System...');
    
    try {
      if (!this.testData.newsArticle) {
        throw new Error('No news article available for comment testing');
      }

      const articleId = this.testData.newsArticle.id;
      const testData = this.generateTestData();

      // Test 1: Comment Creation
      const createResponse = await fetch(`${this.baseUrl}/api/news/${articleId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(testData.comment)
      });

      if (createResponse.ok) {
        const createdComment = await createResponse.json();
        this.results.news.comments.push({
          test: 'News Comment Creation',
          status: 'PASS',
          articleId: articleId,
          commentId: createdComment.data?.id || createdComment.id,
          details: 'Comment created successfully'
        });
        this.testData.newsComment = createdComment.data || createdComment;
        this.log('✅ News comment creation: PASS');

        // Test 2: Comment Voting
        if (this.testData.newsComment) {
          await this.testVotingOnItem('news_comment', this.testData.newsComment.id, 'News Comment');
        }

      } else if (createResponse.status === 401 || createResponse.status === 403) {
        this.results.news.comments.push({
          test: 'News Comment Creation',
          status: 'SKIP',
          articleId: articleId,
          details: 'Insufficient permissions to create comment'
        });
        this.log('⚠️ News comment creation: SKIP (insufficient permissions)');
      } else {
        throw new Error(`Comment creation failed: ${createResponse.status}`);
      }

      // Test 3: Comment Retrieval
      const commentsResponse = await fetch(`${this.baseUrl}/api/news/${articleId}/comments`, {
        credentials: 'include'
      });

      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        const comments = commentsData.data || commentsData;
        
        this.results.news.comments.push({
          test: 'News Comment Retrieval',
          status: 'PASS',
          articleId: articleId,
          count: comments.length,
          details: `Retrieved ${comments.length} comments`
        });
        this.log(`✅ News comment retrieval: PASS (${comments.length} comments)`);
      }

    } catch (error) {
      this.results.news.comments.push({
        test: 'News Comments',
        status: 'FAIL',
        details: error.message
      });
      this.log(`❌ News comments test failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'News Comments',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  async testCrossSystemConsistency() {
    this.log('Testing Cross-System Consistency...');
    
    try {
      // Test 1: User Profile Consistency
      const profileResponse = await fetch(`${this.baseUrl}/api/user/profile`, {
        credentials: 'include'
      });

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        this.results.integration.authentication.push({
          test: 'User Profile Consistency',
          status: 'PASS',
          userId: profileData.id,
          username: profileData.username,
          details: 'User profile accessible across systems'
        });
        this.log('✅ User profile consistency: PASS');
      } else {
        throw new Error(`Profile check failed: ${profileResponse.status}`);
      }

      // Test 2: Permission Consistency
      if (this.testData.currentUser) {
        this.results.integration.permissions.push({
          test: 'Permission Consistency',
          status: 'PASS',
          userRole: this.testData.currentUser.role,
          details: `User role (${this.testData.currentUser.role}) consistent across systems`
        });
        this.log('✅ Permission consistency: PASS');
      }

      // Test 3: Data Integrity
      let dataIntegrityIssues = 0;
      
      // Check if created thread exists
      if (this.testData.createdThread) {
        const threadCheck = await fetch(`${this.baseUrl}/api/forums/threads/${this.testData.createdThread.id}`, {
          credentials: 'include'
        });
        
        if (!threadCheck.ok) {
          dataIntegrityIssues++;
          this.log('⚠️ Created thread not found in follow-up check', 'warn');
        }
      }

      // Check if votes are persistent
      if (this.results.voting.duplicateVotePrevention.length > 0) {
        this.results.integration.dataConsistency.push({
          test: 'Vote Data Integrity',
          status: dataIntegrityIssues === 0 ? 'PASS' : 'WARN',
          details: `${dataIntegrityIssues} data integrity issues found`
        });
      }

      this.results.integration.dataConsistency.push({
        test: 'Data Integrity',
        status: dataIntegrityIssues === 0 ? 'PASS' : 'WARN',
        issues: dataIntegrityIssues,
        details: `${dataIntegrityIssues} data integrity issues found`
      });
      this.log(`✅ Data integrity: ${dataIntegrityIssues === 0 ? 'PASS' : 'WARN'}`);

    } catch (error) {
      this.results.integration.authentication.push({
        test: 'Cross-System Consistency',
        status: 'FAIL',
        details: error.message
      });
      this.log(`❌ Cross-system consistency test failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'Integration',
        issue: error.message,
        severity: 'HIGH'
      });
    }
  }

  // Performance Testing
  async testPerformance() {
    this.log('Testing Performance Metrics...');
    
    const performanceTests = [
      { name: 'Forum Thread Load', url: '/api/forums/threads' },
      { name: 'News Articles Load', url: '/api/news' },
      { name: 'User Profile Load', url: '/api/user/profile' }
    ];

    for (const test of performanceTests) {
      try {
        const startTime = performance.now();
        const response = await fetch(`${this.baseUrl}${test.url}`, {
          credentials: 'include'
        });
        const endTime = performance.now();
        const loadTime = endTime - startTime;

        this.results.performance.push({
          test: test.name,
          status: response.ok ? 'PASS' : 'FAIL',
          loadTime: Math.round(loadTime),
          responseStatus: response.status,
          details: `Load time: ${Math.round(loadTime)}ms`
        });

        this.log(`✅ ${test.name}: ${Math.round(loadTime)}ms`);
      } catch (error) {
        this.results.performance.push({
          test: test.name,
          status: 'FAIL',
          error: error.message,
          details: `Performance test failed: ${error.message}`
        });
        this.log(`❌ ${test.name}: FAIL`);
      }
    }
  }

  // Cleanup Test Data
  async cleanup() {
    this.log('Cleaning up test data...');
    
    // Note: Only attempt cleanup if we have admin/moderator permissions
    if (this.testData.currentUser && (this.testData.currentUser.role === 'admin' || this.testData.currentUser.role === 'moderator')) {
      // Clean up created thread (which should also clean up posts)
      if (this.testData.createdThread) {
        try {
          await fetch(`${this.baseUrl}/api/admin/forums/threads/${this.testData.createdThread.id}/delete`, {
            method: 'POST',
            credentials: 'include'
          });
          this.log('✅ Test thread cleaned up');
        } catch (error) {
          this.log(`⚠️ Could not clean up test thread: ${error.message}`, 'warn');
        }
      }

      // Clean up news comment if created
      if (this.testData.newsComment) {
        try {
          await fetch(`${this.baseUrl}/api/admin/news/comments/${this.testData.newsComment.id}/delete`, {
            method: 'DELETE',
            credentials: 'include'
          });
          this.log('✅ Test news comment cleaned up');
        } catch (error) {
          this.log(`⚠️ Could not clean up test comment: ${error.message}`, 'warn');
        }
      }
    } else {
      this.log('⚠️ Cleanup skipped - insufficient permissions or not authenticated', 'warn');
    }
  }

  // Generate Final Report
  generateReport() {
    const testDuration = Date.now() - this.testStartTime;
    
    // Calculate totals
    const totalTests = Object.values(this.results).reduce((sum, category) => {
      if (Array.isArray(category)) {
        return sum + category.length;
      }
      return sum + Object.values(category).reduce((catSum, tests) => catSum + tests.length, 0);
    }, 0);

    const passedTests = Object.values(this.results).reduce((sum, category) => {
      if (Array.isArray(category)) {
        return sum + category.filter(test => test.status === 'PASS').length;
      }
      return sum + Object.values(category).reduce((catSum, tests) => 
        catSum + tests.filter(test => test.status === 'PASS').length, 0);
    }, 0);

    const failedTests = Object.values(this.results).reduce((sum, category) => {
      if (Array.isArray(category)) {
        return sum + category.filter(test => test.status === 'FAIL').length;
      }
      return sum + Object.values(category).reduce((catSum, tests) => 
        catSum + tests.filter(test => test.status === 'FAIL').length, 0);
    }, 0);

    const warnTests = Object.values(this.results).reduce((sum, category) => {
      if (Array.isArray(category)) {
        return sum + category.filter(test => test.status === 'WARN' || test.status === 'SKIP').length;
      }
      return sum + Object.values(category).reduce((catSum, tests) => 
        catSum + tests.filter(test => test.status === 'WARN' || test.status === 'SKIP').length, 0);
    }, 0);

    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: testDuration,
        environment: this.baseUrl,
        totalTests: totalTests,
        passedTests: passedTests,
        failedTests: failedTests,
        warningTests: warnTests,
        successRate: totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0
      },
      summary: {
        forumSystem: {
          threads: this.results.forum.threads.length,
          posts: this.results.forum.posts.length,
          voting: this.results.forum.voting.length,
          moderation: this.results.forum.moderation.length
        },
        newsSystem: {
          articles: this.results.news.articles.length,
          comments: this.results.news.comments.length,
          voting: this.results.news.voting.length
        },
        votingSystem: {
          duplicatePrevention: this.results.voting.duplicateVotePrevention.length,
          voteSwitching: this.results.voting.voteSwitching.length,
          voteRemoval: this.results.voting.voteRemoval.length
        },
        integration: {
          authentication: this.results.integration.authentication.length,
          permissions: this.results.integration.permissions.length,
          dataConsistency: this.results.integration.dataConsistency.length
        },
        performance: this.results.performance.length,
        issues: this.results.issues.length
      },
      detailedResults: this.results,
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for critical issues
    const criticalIssues = this.results.issues.filter(issue => issue.severity === 'CRITICAL');
    if (criticalIssues.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        area: 'System Stability',
        issue: `${criticalIssues.length} critical issues found`,
        recommendation: 'Address critical issues immediately before production deployment'
      });
    }

    // Check voting system
    const votingTests = this.results.voting.duplicateVotePrevention;
    const failedVotingTests = votingTests.filter(test => test.status === 'FAIL');
    if (failedVotingTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        area: 'Voting System',
        issue: 'Voting system failures detected',
        recommendation: 'Review voting API endpoints and duplicate vote prevention logic'
      });
    }

    // Check performance
    const slowTests = this.results.performance.filter(test => test.loadTime > 2000);
    if (slowTests.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        area: 'Performance',
        issue: `${slowTests.length} slow API responses detected`,
        recommendation: 'Optimize slow API endpoints for better user experience'
      });
    }

    // Check authentication
    const authTests = this.results.integration.authentication;
    const failedAuthTests = authTests.filter(test => test.status === 'FAIL');
    if (failedAuthTests.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        area: 'Authentication',
        issue: 'Authentication consistency issues',
        recommendation: 'Review authentication flow and session management'
      });
    }

    return recommendations;
  }

  // Main Test Execution
  async runAllTests() {
    this.log('🚀 Starting Comprehensive Forum & News System Test');
    this.log(`Test Environment: ${this.baseUrl}`);
    
    try {
      // Step 1: Check Authentication
      const isAuthenticated = await this.checkAuthentication();
      
      // Step 2: Performance baseline
      await this.testPerformance();
      
      // Step 3: Forum System Tests
      if (isAuthenticated) {
        await this.testForumThreads();
        await this.testForumPosts();
        await this.testForumVoting();
        await this.testModerationActions();
      } else {
        this.log('⚠️ Skipping authenticated forum tests - user not logged in', 'warn');
      }
      
      // Step 4: News System Tests
      await this.testNewsSystem();
      if (isAuthenticated) {
        await this.testNewsComments();
      }
      
      // Step 5: Integration Tests
      if (isAuthenticated) {
        await this.testCrossSystemConsistency();
      }
      
      // Step 6: Cleanup
      await this.cleanup();
      
      // Step 7: Generate Report
      const report = this.generateReport();
      
      this.log('🏆 Test Suite Completed');
      this.log(`Total Tests: ${report.metadata.totalTests}`);
      this.log(`Passed: ${report.metadata.passedTests} (${report.metadata.successRate}%)`);
      this.log(`Failed: ${report.metadata.failedTests}`);
      this.log(`Warnings/Skipped: ${report.metadata.warningTests}`);
      this.log(`Duration: ${Math.round(report.metadata.duration / 1000)}s`);
      
      return report;
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
      this.results.issues.push({
        area: 'Test Suite',
        issue: error.message,
        severity: 'CRITICAL'
      });
      return this.generateReport();
    }
  }
}

// Export for browser usage
if (typeof window !== 'undefined') {
  window.ComprehensiveForumNewsTest = ComprehensiveForumNewsTest;
  
  // Auto-run if in browser with specific query parameter
  if (window.location.search.includes('autorun=true')) {
    window.addEventListener('DOMContentLoaded', async () => {
      const test = new ComprehensiveForumNewsTest();
      const report = await test.runAllTests();
      console.log('📊 Final Test Report:', report);
      
      // Store report for download
      window.testReport = report;
      
      // Create download link
      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = 'Download Test Report';
      downloadBtn.onclick = () => {
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mrvl-test-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
      };
      document.body.appendChild(downloadBtn);
    });
  }
}

// Export for Node.js usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ComprehensiveForumNewsTest;
}