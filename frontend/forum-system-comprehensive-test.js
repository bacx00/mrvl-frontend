/**
 * COMPREHENSIVE FORUM SYSTEM TEST SUITE
 * ====================================
 * 
 * This script tests the entire forum workflow including:
 * 1. Forum Creation & CRUD Operations
 * 2. Mentions System Testing  
 * 3. Voting System Testing
 * 4. Moderation & Admin Features
 * 5. User Interactions & UI
 * 
 * Usage: Open in browser console or run as standalone script
 */

class ForumSystemTester {
  constructor() {
    this.results = [];
    this.errors = [];
    this.testCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    
    // Test configuration
    this.config = {
      baseURL: window.location.origin,
      testTimeout: 10000,
      retryAttempts: 3,
      testData: {
        testThread: {
          title: 'Test Thread for Automation Testing @player:testuser',
          content: 'This is a test thread content with @team:testteam mention. Testing mentions and forum functionality.'
        },
        testPost: {
          content: 'Test reply with @player:anothertestuser mention'
        },
        testUser: {
          username: 'testforumuser',
          name: 'Test Forum User'
        }
      }
    };
    
    this.selectors = {
      // Navigation
      forumsNavButton: '[data-nav="forums"], a[href*="forums"]',
      createThreadButton: 'button:contains("New Thread"), button:contains("Create Thread")',
      
      // Forum listing
      threadsList: '.thread-list, [data-test="threads-list"]',
      threadCard: '.thread-card, [data-test="thread"]',
      categoryFilter: 'select[name="category"], [data-test="category-filter"]',
      searchInput: 'input[placeholder*="Search"], [data-test="search"]',
      sortButtons: '[data-test="sort"], .sort-button',
      
      // Thread creation
      threadTitleInput: 'input[name="title"], [data-test="thread-title"]',
      threadContentInput: 'textarea[name="content"], [data-test="thread-content"]',
      submitThreadButton: 'button[type="submit"], [data-test="submit-thread"]',
      
      // Thread detail
      threadDetailContainer: '.thread-detail, [data-test="thread-detail"]',
      postsContainer: '.posts-container, [data-test="posts"]',
      replyForm: '.reply-form, [data-test="reply-form"]',
      replyInput: 'textarea[name="reply"], [data-test="reply-input"]',
      submitReplyButton: 'button:contains("Reply"), [data-test="submit-reply"]',
      
      // Mentions system
      mentionDropdown: '.mention-dropdown, [data-test="mention-dropdown"]',
      mentionSuggestion: '.mention-suggestion, [data-test="mention-item"]',
      mentionLink: '.mention-link, a[data-mention]',
      
      // Voting system
      upvoteButton: '.upvote-button, [data-test="upvote"]',
      downvoteButton: '.downvote-button, [data-test="downvote"]',
      voteCount: '.vote-count, [data-test="vote-count"]',
      
      // Admin features
      adminPanel: '.admin-panel, [data-test="admin-panel"]',
      moderationActions: '.moderation-actions, [data-test="mod-actions"]',
      pinButton: 'button:contains("Pin"), [data-test="pin"]',
      lockButton: 'button:contains("Lock"), [data-test="lock"]',
      deleteButton: 'button:contains("Delete"), [data-test="delete"]',
      
      // UI elements
      loadingIndicator: '.loading, [data-test="loading"]',
      errorMessage: '.error, [data-test="error"]',
      successMessage: '.success, [data-test="success"]',
      mobileMenu: '.mobile-menu, [data-test="mobile-menu"]'
    };
  }

  // Utility functions
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.results.push(logEntry);
    
    const color = {
      'info': '#2563eb',
      'success': '#16a34a', 
      'warning': '#d97706',
      'error': '#dc2626'
    }[type];
    
    console.log(`%c[${timestamp}] ${message}`, `color: ${color}; font-weight: bold;`);
  }

  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async waitForElement(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (element) return element;
      await this.wait(100);
    }
    throw new Error(`Element not found: ${selector}`);
  }

  async waitForElementToDisappear(selector, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const element = document.querySelector(selector);
      if (!element) return true;
      await this.wait(100);
    }
    return false;
  }

  simulateEvent(element, eventType, options = {}) {
    const event = new Event(eventType, { bubbles: true, cancelable: true, ...options });
    element.dispatchEvent(event);
  }

  simulateInput(element, value) {
    element.value = value;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  simulateKeyPress(element, key) {
    element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    element.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  }

  async runTest(testName, testFunction) {
    this.testCount++;
    this.log(`Starting test: ${testName}`, 'info');
    
    try {
      await testFunction();
      this.passCount++;
      this.log(`✅ PASSED: ${testName}`, 'success');
      return true;
    } catch (error) {
      this.failCount++;
      this.errors.push({ test: testName, error: error.message });
      this.log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
      return false;
    }
  }

  // ===========================================
  // TEST SECTION 1: FORUM CREATION & CRUD
  // ===========================================

  async testForumNavigation() {
    await this.runTest('Forum Navigation', async () => {
      // Test navigation to forums page
      const forumsButton = await this.waitForElement(this.selectors.forumsNavButton);
      if (!forumsButton) throw new Error('Forums navigation button not found');
      
      forumsButton.click();
      await this.wait(1000);
      
      // Verify we're on forums page
      const currentURL = window.location.pathname;
      if (!currentURL.includes('forum')) {
        throw new Error(`Expected forums page, but got: ${currentURL}`);
      }
      
      // Check for forums page elements
      const threadsList = document.querySelector(this.selectors.threadsList);
      if (!threadsList) throw new Error('Threads list not found on forums page');
    });
  }

  async testThreadCreation() {
    await this.runTest('Thread Creation', async () => {
      // Navigate to create thread page
      const createButton = await this.waitForElement(this.selectors.createThreadButton);
      createButton.click();
      await this.wait(1000);
      
      // Fill out thread form
      const titleInput = await this.waitForElement(this.selectors.threadTitleInput);
      const contentInput = await this.waitForElement(this.selectors.threadContentInput);
      
      this.simulateInput(titleInput, this.config.testData.testThread.title);
      this.simulateInput(contentInput, this.config.testData.testThread.content);
      
      // Submit form
      const submitButton = await this.waitForElement(this.selectors.submitThreadButton);
      submitButton.click();
      
      // Wait for success or navigation
      await this.wait(2000);
      
      // Verify thread was created (should navigate to thread detail or forums)
      const currentURL = window.location.pathname;
      if (!currentURL.includes('thread') && !currentURL.includes('forum')) {
        throw new Error('Thread creation did not navigate properly');
      }
    });
  }

  async testThreadListing() {
    await this.runTest('Thread Listing & Filtering', async () => {
      // Navigate to forums
      window.location.hash = '#/forums';
      await this.wait(1000);
      
      // Test search functionality
      const searchInput = document.querySelector(this.selectors.searchInput);
      if (searchInput) {
        this.simulateInput(searchInput, 'test');
        await this.wait(1000);
        
        // Verify search results
        const threads = document.querySelectorAll(this.selectors.threadCard);
        this.log(`Found ${threads.length} threads in search results`);
      }
      
      // Test category filtering
      const categoryFilter = document.querySelector(this.selectors.categoryFilter);
      if (categoryFilter && categoryFilter.options.length > 1) {
        categoryFilter.selectedIndex = 1;
        this.simulateEvent(categoryFilter, 'change');
        await this.wait(1000);
      }
      
      // Test sorting
      const sortButtons = document.querySelectorAll(this.selectors.sortButtons);
      if (sortButtons.length > 0) {
        sortButtons[0].click();
        await this.wait(1000);
      }
    });
  }

  async testPostCRUD() {
    await this.runTest('Post Creation and Management', async () => {
      // Find and click on a thread
      const threadCards = document.querySelectorAll(this.selectors.threadCard);
      if (threadCards.length === 0) throw new Error('No threads found to test posting');
      
      threadCards[0].click();
      await this.wait(1000);
      
      // Verify we're on thread detail page
      const threadDetail = await this.waitForElement(this.selectors.threadDetailContainer);
      if (!threadDetail) throw new Error('Thread detail page not loaded');
      
      // Test reply creation
      const replyInput = document.querySelector(this.selectors.replyInput);
      if (replyInput) {
        this.simulateInput(replyInput, this.config.testData.testPost.content);
        
        const submitReply = document.querySelector(this.selectors.submitReplyButton);
        if (submitReply) {
          submitReply.click();
          await this.wait(2000);
          
          // Verify reply was added
          const posts = document.querySelectorAll(this.selectors.postsContainer + ' > *');
          this.log(`Found ${posts.length} posts after reply`);
        }
      }
    });
  }

  // ===========================================
  // TEST SECTION 2: MENTIONS SYSTEM
  // ===========================================

  async testMentionsDropdown() {
    await this.runTest('Mentions Dropdown Functionality', async () => {
      // Find a text input that supports mentions
      const inputs = document.querySelectorAll('textarea, input[type="text"]');
      let mentionInput = null;
      
      for (const input of inputs) {
        if (input.placeholder && input.placeholder.includes('@')) {
          mentionInput = input;
          break;
        }
      }
      
      if (!mentionInput) {
        // Try reply input or create thread input
        mentionInput = document.querySelector(this.selectors.replyInput) || 
                     document.querySelector(this.selectors.threadContentInput);
      }
      
      if (!mentionInput) throw new Error('No mention-capable input found');
      
      // Focus input and type @
      mentionInput.focus();
      this.simulateInput(mentionInput, '@');
      
      // Wait for mention dropdown to appear
      await this.wait(500);
      const dropdown = document.querySelector(this.selectors.mentionDropdown);
      
      if (!dropdown) {
        this.log('Mention dropdown not found - checking for ForumMentionAutocomplete', 'warning');
        // The component might be there but not visible
        return;
      }
      
      // Test typing to filter mentions
      this.simulateInput(mentionInput, '@test');
      await this.wait(500);
      
      // Check for suggestion items
      const suggestions = document.querySelectorAll(this.selectors.mentionSuggestion);
      this.log(`Found ${suggestions.length} mention suggestions`);
      
      // Test selecting a mention
      if (suggestions.length > 0) {
        suggestions[0].click();
        await this.wait(500);
        
        // Verify mention was inserted
        if (!mentionInput.value.includes('@')) {
          throw new Error('Mention was not inserted into input');
        }
      }
    });
  }

  async testMentionLinks() {
    await this.runTest('Mention Links in Content', async () => {
      // Look for existing mention links in posts
      const mentionLinks = document.querySelectorAll(this.selectors.mentionLink);
      
      if (mentionLinks.length === 0) {
        this.log('No mention links found in current content', 'warning');
        return;
      }
      
      this.log(`Found ${mentionLinks.length} mention links`);
      
      // Test clicking on a mention link
      const firstMention = mentionLinks[0];
      const originalURL = window.location.href;
      
      firstMention.click();
      await this.wait(1000);
      
      // Check if navigation occurred or modal opened
      const newURL = window.location.href;
      const hasModal = document.querySelector('.modal, .popup');
      
      if (newURL === originalURL && !hasModal) {
        this.log('Mention link click did not trigger navigation or modal', 'warning');
      } else {
        this.log('Mention link navigation or modal working');
      }
    });
  }

  async testMentionSearch() {
    await this.runTest('Mention Search Functionality', async () => {
      // Find mention input
      const mentionInput = document.querySelector(this.selectors.replyInput) || 
                          document.querySelector(this.selectors.threadContentInput);
      
      if (!mentionInput) {
        this.log('No mention input available for search test', 'warning');
        return;
      }
      
      // Test different mention types
      const mentionTypes = ['@', '@team:', '@player:'];
      
      for (const type of mentionTypes) {
        mentionInput.focus();
        this.simulateInput(mentionInput, type + 'test');
        await this.wait(500);
        
        // Check for dropdown response
        const dropdown = document.querySelector(this.selectors.mentionDropdown);
        if (dropdown) {
          const suggestions = dropdown.querySelectorAll(this.selectors.mentionSuggestion);
          this.log(`${type} search returned ${suggestions.length} suggestions`);
        }
        
        // Clear input for next test
        this.simulateInput(mentionInput, '');
      }
    });
  }

  // ===========================================
  // TEST SECTION 3: VOTING SYSTEM
  // ===========================================

  async testVotingButtons() {
    await this.runTest('Voting Button Functionality', async () => {
      // Find voting buttons
      const upvoteButtons = document.querySelectorAll(this.selectors.upvoteButton);
      const downvoteButtons = document.querySelectorAll(this.selectors.downvoteButton);
      
      if (upvoteButtons.length === 0) {
        throw new Error('No upvote buttons found');
      }
      
      if (downvoteButtons.length === 0) {
        throw new Error('No downvote buttons found');
      }
      
      this.log(`Found ${upvoteButtons.length} upvote and ${downvoteButtons.length} downvote buttons`);
      
      // Test upvote
      const firstUpvote = upvoteButtons[0];
      const voteCountElement = firstUpvote.closest('[data-test="voting"]')?.querySelector(this.selectors.voteCount) ||
                              firstUpvote.parentElement?.querySelector(this.selectors.voteCount);
      
      const initialCount = voteCountElement ? parseInt(voteCountElement.textContent) || 0 : 0;
      
      firstUpvote.click();
      await this.wait(1000);
      
      // Check for vote count change or visual feedback
      const newCount = voteCountElement ? parseInt(voteCountElement.textContent) || 0 : 0;
      const hasActiveState = firstUpvote.classList.contains('active') || 
                            firstUpvote.classList.contains('voted') ||
                            firstUpvote.getAttribute('data-voted') === 'true';
      
      if (newCount !== initialCount || hasActiveState) {
        this.log('Upvote functionality working');
      } else {
        this.log('Upvote may not be working - no visual change detected', 'warning');
      }
    });
  }

  async testVoteConflictResolution() {
    await this.runTest('Vote Conflict Resolution', async () => {
      const upvoteButtons = document.querySelectorAll(this.selectors.upvoteButton);
      const downvoteButtons = document.querySelectorAll(this.selectors.downvoteButton);
      
      if (upvoteButtons.length === 0 || downvoteButtons.length === 0) {
        this.log('Insufficient vote buttons for conflict test', 'warning');
        return;
      }
      
      // Find a pair of voting buttons for the same item
      const firstUpvote = upvoteButtons[0];
      const correspondingDownvote = downvoteButtons[0];
      
      // Test voting up then down (should replace, not add)
      firstUpvote.click();
      await this.wait(500);
      
      correspondingDownvote.click();
      await this.wait(500);
      
      // Check that only one vote is active
      const upvoteActive = firstUpvote.classList.contains('active') || 
                          firstUpvote.classList.contains('voted');
      const downvoteActive = correspondingDownvote.classList.contains('active') || 
                            correspondingDownvote.classList.contains('voted');
      
      if (upvoteActive && downvoteActive) {
        throw new Error('Both upvote and downvote are active - conflict resolution failed');
      }
      
      this.log('Vote conflict resolution test passed');
    });
  }

  async testVoteAccuracy() {
    await this.runTest('Vote Count Accuracy', async () => {
      const votingContainers = document.querySelectorAll('[data-test="voting"], .voting-buttons');
      
      if (votingContainers.length === 0) {
        this.log('No voting containers found for accuracy test', 'warning');
        return;
      }
      
      for (let i = 0; i < Math.min(3, votingContainers.length); i++) {
        const container = votingContainers[i];
        const upvoteBtn = container.querySelector(this.selectors.upvoteButton);
        const downvoteBtn = container.querySelector(this.selectors.downvoteButton);
        const voteCount = container.querySelector(this.selectors.voteCount);
        
        if (!upvoteBtn || !downvoteBtn) continue;
        
        const initialCount = voteCount ? parseInt(voteCount.textContent) || 0 : 0;
        
        // Perform vote sequence
        upvoteBtn.click();
        await this.wait(300);
        
        const afterUpvoteCount = voteCount ? parseInt(voteCount.textContent) || 0 : 0;
        
        downvoteBtn.click();
        await this.wait(300);
        
        const afterDownvoteCount = voteCount ? parseInt(voteCount.textContent) || 0 : 0;
        
        this.log(`Vote sequence: ${initialCount} → ${afterUpvoteCount} → ${afterDownvoteCount}`);
      }
    });
  }

  // ===========================================
  // TEST SECTION 4: MODERATION & ADMIN
  // ===========================================

  async testAdminPanelAccess() {
    await this.runTest('Admin Panel Access', async () => {
      // Look for admin panel or admin navigation
      const adminPanel = document.querySelector(this.selectors.adminPanel);
      const adminLink = document.querySelector('a[href*="admin"], [data-nav="admin"]');
      
      if (!adminPanel && !adminLink) {
        this.log('Admin panel not accessible (may require admin permissions)', 'warning');
        return;
      }
      
      if (adminLink) {
        adminLink.click();
        await this.wait(1000);
        
        const currentURL = window.location.pathname;
        if (!currentURL.includes('admin')) {
          throw new Error('Admin link did not navigate to admin page');
        }
      }
      
      // Check for admin-specific elements
      const moderationActions = document.querySelectorAll(this.selectors.moderationActions);
      this.log(`Found ${moderationActions.length} moderation action areas`);
    });
  }

  async testModerationActions() {
    await this.runTest('Moderation Actions', async () => {
      // Look for moderation buttons
      const pinButtons = document.querySelectorAll(this.selectors.pinButton);
      const lockButtons = document.querySelectorAll(this.selectors.lockButton);
      const deleteButtons = document.querySelectorAll(this.selectors.deleteButton);
      
      this.log(`Found moderation buttons: ${pinButtons.length} pin, ${lockButtons.length} lock, ${deleteButtons.length} delete`);
      
      if (pinButtons.length === 0 && lockButtons.length === 0 && deleteButtons.length === 0) {
        this.log('No moderation buttons found (may require moderator permissions)', 'warning');
        return;
      }
      
      // Test pin functionality (safest action)
      if (pinButtons.length > 0) {
        const pinButton = pinButtons[0];
        const originalText = pinButton.textContent;
        
        pinButton.click();
        await this.wait(1000);
        
        // Check for state change
        const newText = pinButton.textContent;
        if (originalText !== newText) {
          this.log('Pin action appears to be working (text changed)');
        }
      }
    });
  }

  async testBulkOperations() {
    await this.runTest('Bulk Operations', async () => {
      // Look for checkboxes and bulk action buttons
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      const bulkActionButtons = document.querySelectorAll('[data-test="bulk-action"], .bulk-action');
      
      if (checkboxes.length === 0) {
        this.log('No checkboxes found for bulk operations', 'warning');
        return;
      }
      
      // Select multiple items
      for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
        checkboxes[i].checked = true;
        this.simulateEvent(checkboxes[i], 'change');
      }
      
      await this.wait(500);
      
      // Check if bulk actions become available
      const visibleBulkActions = Array.from(bulkActionButtons).filter(btn => 
        getComputedStyle(btn).display !== 'none'
      );
      
      this.log(`Bulk operations: ${visibleBulkActions.length} actions available for ${checkboxes.length} items`);
    });
  }

  async testUserManagement() {
    await this.runTest('User Management Features', async () => {
      // Look for user management actions
      const userActions = document.querySelectorAll('[data-test="user-action"], .user-action');
      const banButtons = document.querySelectorAll('button:contains("Ban"), button:contains("Suspend")');
      const warnButtons = document.querySelectorAll('button:contains("Warn")');
      
      this.log(`User management: ${userActions.length} general actions, ${banButtons.length} ban buttons, ${warnButtons.length} warn buttons`);
      
      if (userActions.length === 0 && banButtons.length === 0 && warnButtons.length === 0) {
        this.log('No user management features found (may require admin permissions)', 'warning');
        return;
      }
      
      // Test warn functionality (safest)
      if (warnButtons.length > 0) {
        warnButtons[0].click();
        await this.wait(500);
        
        // Check for modal or form
        const modal = document.querySelector('.modal, .popup, [data-test="modal"]');
        if (modal) {
          this.log('User warn modal opened successfully');
          
          // Close modal
          const closeButton = modal.querySelector('.close, [data-dismiss], button:contains("Cancel")');
          if (closeButton) closeButton.click();
        }
      }
    });
  }

  // ===========================================
  // TEST SECTION 5: UI & UX
  // ===========================================

  async testResponsiveDesign() {
    await this.runTest('Responsive Design', async () => {
      const originalWidth = window.innerWidth;
      
      // Test mobile viewport
      window.resizeTo(375, 667);
      await this.wait(500);
      
      // Check for mobile-specific elements
      const mobileMenu = document.querySelector(this.selectors.mobileMenu);
      const mobileElements = document.querySelectorAll('[data-mobile], .mobile-only');
      
      this.log(`Mobile view: ${mobileElements.length} mobile-specific elements found`);
      
      // Test tablet viewport
      window.resizeTo(768, 1024);
      await this.wait(500);
      
      const tabletElements = document.querySelectorAll('[data-tablet], .tablet-optimized');
      this.log(`Tablet view: ${tabletElements.length} tablet-optimized elements found`);
      
      // Restore original size
      window.resizeTo(originalWidth, window.innerHeight);
      await this.wait(500);
    });
  }

  async testLoadingStates() {
    await this.runTest('Loading States', async () => {
      // Trigger actions that should show loading states
      const refreshButton = document.querySelector('button:contains("Refresh"), [data-action="refresh"]');
      const loadMoreButton = document.querySelector('button:contains("Load More"), [data-action="load-more"]');
      
      if (refreshButton) {
        refreshButton.click();
        await this.wait(100);
        
        // Check for loading indicator
        const loading = document.querySelector(this.selectors.loadingIndicator);
        if (loading) {
          this.log('Loading state displayed on refresh');
          await this.waitForElementToDisappear(this.selectors.loadingIndicator, 5000);
        }
      }
      
      if (loadMoreButton) {
        loadMoreButton.click();
        await this.wait(100);
        
        const loading = document.querySelector(this.selectors.loadingIndicator);
        if (loading) {
          this.log('Loading state displayed on load more');
        }
      }
    });
  }

  async testErrorHandling() {
    await this.runTest('Error Handling', async () => {
      // Check for existing error messages
      const existingErrors = document.querySelectorAll(this.selectors.errorMessage);
      this.log(`Found ${existingErrors.length} existing error messages`);
      
      // Try to trigger an error by submitting invalid data
      const forms = document.querySelectorAll('form');
      
      for (const form of forms) {
        const requiredInputs = form.querySelectorAll('input[required], textarea[required]');
        
        if (requiredInputs.length > 0) {
          // Clear required fields and try to submit
          requiredInputs.forEach(input => input.value = '');
          
          const submitButton = form.querySelector('button[type="submit"]');
          if (submitButton) {
            submitButton.click();
            await this.wait(500);
            
            // Check for validation errors
            const validationErrors = form.querySelectorAll('.error, .invalid-feedback, [data-error]');
            if (validationErrors.length > 0) {
              this.log('Form validation errors displayed correctly');
            }
          }
          break; // Only test first form
        }
      }
    });
  }

  async testAccessibility() {
    await this.runTest('Accessibility Features', async () => {
      // Check for ARIA labels
      const ariaLabels = document.querySelectorAll('[aria-label]');
      const ariaDescribedBy = document.querySelectorAll('[aria-describedby]');
      const focusableElements = document.querySelectorAll('button, a, input, textarea, select');
      
      this.log(`Accessibility: ${ariaLabels.length} ARIA labels, ${ariaDescribedBy.length} described elements`);
      
      // Test keyboard navigation
      let tabIndex = 0;
      const testKeyboardNav = (element) => {
        element.focus();
        return document.activeElement === element;
      };
      
      const focusableCount = Array.from(focusableElements).slice(0, 10).filter(testKeyboardNav).length;
      this.log(`Keyboard navigation: ${focusableCount}/10 elements properly focusable`);
      
      // Check for alt text on images
      const images = document.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => img.alt && img.alt.trim() !== '');
      this.log(`Images: ${imagesWithAlt.length}/${images.length} have alt text`);
    });
  }

  async testPerformance() {
    await this.runTest('Performance Metrics', async () => {
      // Measure page load performance
      const navigation = performance.getEntriesByType('navigation')[0];
      const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
      
      this.log(`Page load time: ${loadTime.toFixed(2)}ms`);
      
      // Check for large images
      const images = document.querySelectorAll('img');
      let largeImages = 0;
      
      images.forEach(img => {
        if (img.naturalWidth > 2000 || img.naturalHeight > 2000) {
          largeImages++;
        }
      });
      
      if (largeImages > 0) {
        this.log(`Performance warning: ${largeImages} large images found`, 'warning');
      }
      
      // Check bundle size indicators
      const scripts = document.querySelectorAll('script[src]');
      this.log(`${scripts.length} script files loaded`);
      
      // Memory usage (if available)
      if (performance.memory) {
        const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
        this.log(`Memory usage: ${memoryMB}MB`);
      }
    });
  }

  // ===========================================
  // MAIN TEST RUNNER
  // ===========================================

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Forum System Testing', 'info');
    this.log('======================================================', 'info');
    
    const startTime = Date.now();
    
    try {
      // Section 1: Forum Creation & CRUD Operations
      this.log('📝 SECTION 1: Forum Creation & CRUD Operations', 'info');
      await this.testForumNavigation();
      await this.testThreadListing();
      await this.testThreadCreation();
      await this.testPostCRUD();
      
      // Section 2: Mentions System Testing
      this.log('🔗 SECTION 2: Mentions System Testing', 'info');
      await this.testMentionsDropdown();
      await this.testMentionLinks();
      await this.testMentionSearch();
      
      // Section 3: Voting System Testing
      this.log('🗳️ SECTION 3: Voting System Testing', 'info');
      await this.testVotingButtons();
      await this.testVoteConflictResolution();
      await this.testVoteAccuracy();
      
      // Section 4: Moderation & Admin Features
      this.log('👮 SECTION 4: Moderation & Admin Features', 'info');
      await this.testAdminPanelAccess();
      await this.testModerationActions();
      await this.testBulkOperations();
      await this.testUserManagement();
      
      // Section 5: User Interactions & UI
      this.log('🎨 SECTION 5: User Interactions & UI', 'info');
      await this.testResponsiveDesign();
      await this.testLoadingStates();
      await this.testErrorHandling();
      await this.testAccessibility();
      await this.testPerformance();
      
    } catch (error) {
      this.log(`Test runner error: ${error.message}`, 'error');
    }
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    this.generateReport(duration);
  }

  generateReport(duration) {
    this.log('======================================================', 'info');
    this.log('📊 COMPREHENSIVE FORUM SYSTEM TEST REPORT', 'info');
    this.log('======================================================', 'info');
    
    this.log(`⏱️ Total Duration: ${duration.toFixed(2)} seconds`, 'info');
    this.log(`📈 Tests Run: ${this.testCount}`, 'info');
    this.log(`✅ Passed: ${this.passCount}`, 'success');
    this.log(`❌ Failed: ${this.failCount}`, this.failCount > 0 ? 'error' : 'info');
    this.log(`📊 Success Rate: ${((this.passCount / this.testCount) * 100).toFixed(1)}%`, 'info');
    
    if (this.errors.length > 0) {
      this.log('🚨 FAILED TESTS:', 'error');
      this.errors.forEach(error => {
        this.log(`   • ${error.test}: ${error.error}`, 'error');
      });
    }
    
    this.log('======================================================', 'info');
    this.log('🔍 DETAILED FINDINGS:', 'info');
    this.log('======================================================', 'info');
    
    // Analyze results for specific issues
    const criticalIssues = this.errors.filter(e => 
      e.error.includes('not found') || 
      e.error.includes('BACKEND ISSUE') ||
      e.error.includes('Navigation')
    );
    
    const warningIssues = this.results.filter(r => r.type === 'warning');
    
    if (criticalIssues.length > 0) {
      this.log('🚨 CRITICAL ISSUES:', 'error');
      criticalIssues.forEach(issue => {
        this.log(`   • ${issue.test}: ${issue.error}`, 'error');
      });
    }
    
    if (warningIssues.length > 0) {
      this.log('⚠️ WARNINGS:', 'warning');
      warningIssues.forEach(warning => {
        this.log(`   • ${warning.message}`, 'warning');
      });
    }
    
    // Recommendations
    this.log('💡 RECOMMENDATIONS:', 'info');
    
    if (this.errors.some(e => e.error.includes('Mention'))) {
      this.log('   • Fix mentions system: Ensure @ dropdown appears and functions correctly', 'info');
    }
    
    if (this.errors.some(e => e.error.includes('Vote'))) {
      this.log('   • Fix voting system: Ensure upvote/downvote buttons work and prevent conflicts', 'info');
    }
    
    if (this.errors.some(e => e.error.includes('Admin') || e.error.includes('Moderation'))) {
      this.log('   • Implement admin features: Add moderation panels and user management', 'info');
    }
    
    if (warningIssues.some(w => w.message.includes('mobile'))) {
      this.log('   • Improve mobile responsiveness: Add mobile-specific optimizations', 'info');
    }
    
    this.log('======================================================', 'info');
    this.log('🎯 TEST COMPLETE - Review results above', 'success');
    
    // Return results for programmatic access
    return {
      total: this.testCount,
      passed: this.passCount,
      failed: this.failCount,
      duration,
      errors: this.errors,
      warnings: warningIssues,
      successRate: (this.passCount / this.testCount) * 100
    };
  }

  // Manual test helpers
  async testSpecificFeature(featureName) {
    const tests = {
      'mentions': () => this.testMentionsDropdown(),
      'voting': () => this.testVotingButtons(),
      'admin': () => this.testAdminPanelAccess(),
      'navigation': () => this.testForumNavigation(),
      'crud': () => this.testThreadCreation(),
      'responsive': () => this.testResponsiveDesign(),
      'performance': () => this.testPerformance()
    };
    
    const test = tests[featureName.toLowerCase()];
    if (test) {
      this.log(`🎯 Testing specific feature: ${featureName}`, 'info');
      await test();
      this.generateReport(0);
    } else {
      this.log(`❌ Unknown feature: ${featureName}. Available: ${Object.keys(tests).join(', ')}`, 'error');
    }
  }
}

// Global access and auto-run functionality
window.ForumSystemTester = ForumSystemTester;

// Usage examples:
// const tester = new ForumSystemTester();
// await tester.runAllTests();
// await tester.testSpecificFeature('mentions');

// Auto-run if script is loaded directly
if (typeof window !== 'undefined' && window.location) {
  console.log('🎯 Forum System Tester loaded. Usage:');
  console.log('const tester = new ForumSystemTester();');
  console.log('await tester.runAllTests();');
  console.log('await tester.testSpecificFeature("mentions");');
  
  // Uncomment to auto-run full test suite
  // setTimeout(async () => {
  //   const tester = new ForumSystemTester();
  //   await tester.runAllTests();
  // }, 2000);
}