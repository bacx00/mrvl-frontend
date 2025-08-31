import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import MobileForumNavigation from '../mobile/MobileForumNavigation';
import VirtualizedForumList from '../mobile/VirtualizedForumList';
import TabletForumLayout from '../tablet/TabletForumLayout';
import TabletSplitView from '../tablet/TabletSplitView';
import { formatTimeAgo } from '../../lib/utils.js';
import { Search, Filter, TrendingUp, MessageCircle, Eye, ChevronDown, RefreshCw, Bookmark, Share2, MoreVertical } from 'lucide-react';

function ForumsPage({ navigateTo }) {
  const { isAuthenticated, isAdmin, isModerator, api, user } = useAuth();

  // Safe wrapper function for string operations
  const safeString = (value) => {
    return typeof value === 'string' ? value : '';
  };
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Mobile-specific state
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'compact'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
  // Tablet-specific state
  const [selectedThread, setSelectedThread] = useState(null);
  const [tabletLayout, setTabletLayout] = useState('split-view');
  const [useVirtualization, setUseVirtualization] = useState(window.innerWidth < 768);
  const [hasMoreThreads, setHasMoreThreads] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Refs for mobile interactions
  const containerRef = useRef(null);
  const startY = useRef(0);
  const searchInputRef = useRef(null);

  const fetchForumData = useCallback(async (currentSearchQuery) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (sortBy) params.append('sort', sortBy);
      const safeSearchQuery = safeString(currentSearchQuery || '');
      if (safeSearchQuery.trim()) params.append('search', safeSearchQuery.trim());
      
      // Fetch threads and categories in parallel
      const [threadsResponse, categoriesResponse] = await Promise.all([
        api.get(`/public/forums/threads?${params.toString()}`),
        api.get('/public/forums/categories')
      ]);
      
      const threadsData = threadsResponse.data?.data || threadsResponse.data || [];
      const categoriesData = categoriesResponse.data?.data || categoriesResponse.data || [];
      
      console.log('Forum threads loaded:', threadsData.length);
      console.log('Forum categories loaded:', categoriesData.length);
      
      setThreads(threadsData);
      setCategories(categoriesData);
      
    } catch (error) {
      console.error('ForumsPage: Backend API failed:', error);
      setThreads([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [api, selectedCategory, sortBy]);

  // CRITICAL FIX: Separate effects for different types of updates
  // Immediate updates for category/sort changes
  useEffect(() => {
    fetchForumData(searchQuery);
  }, [selectedCategory, sortBy, fetchForumData]);
  
  // Debounced effect for search queries only
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If no search query, fetch immediately
      fetchForumData('');
      return;
    }
    
    // Debounce search queries to avoid excessive API calls
    const timeoutId = setTimeout(() => {
      fetchForumData(searchQuery);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, fetchForumData]);

  // Mobile Pull-to-Refresh Logic
  const handleTouchStart = useCallback((e) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current && containerRef.current && containerRef.current.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(120, currentY - startY.current));
      setPullDistance(distance);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80) {
      setIsRefreshing(true);
      try {
        await fetchForumData(searchQuery);
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance, fetchForumData, searchQuery]);

  // Search Suggestions
  const fetchSearchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchSuggestions([]);
      return;
    }
    
    try {
      const response = await api.get(`/forums/search/suggestions?q=${encodeURIComponent(query)}`);
      setSearchSuggestions(response.data?.suggestions || []);
    } catch (error) {
      console.error('Failed to fetch search suggestions:', error);
      setSearchSuggestions([]);
    }
  }, [api]);

  // Mobile Search Handler
  const handleMobileSearch = (query) => {
    setSearchQuery(query);
    setShowSearchResults(false);
    setSearchSuggestions([]);
  };

  // Thread interaction handlers
  const handleThreadBookmark = async (threadId) => {
    try {
      await api.post(`/user/forums/threads/${threadId}/bookmark`);
      // Show success feedback
      const toast = document.createElement('div');
      toast.className = 'fixed bottom-20 left-4 right-4 bg-green-500 text-white p-3 rounded-lg text-center z-50';
      toast.textContent = 'Thread bookmarked!';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 2000);
    } catch (error) {
      console.error('Failed to bookmark thread:', error);
    }
  };

  const handleThreadShare = async (thread) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: thread.title,
          text: `Check out this discussion: ${thread.title}`,
          url: `${window.location.origin}/forums/threads/${thread.id}`
        });
      } catch (error) {
        console.error('Failed to share:', error);
      }
    } else {
      // Fallback: Copy to clipboard
      const url = `${window.location.origin}/forums/threads/${thread.id}`;
      navigator.clipboard.writeText(url).then(() => {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-20 left-4 right-4 bg-blue-500 text-white p-3 rounded-lg text-center z-50';
        toast.textContent = 'Link copied to clipboard!';
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 2000);
      });
    }
  };

  // New handlers for mobile/tablet functionality
  const handleThreadSelect = useCallback((thread) => {
    setSelectedThread(thread);
    if (navigateTo) {
      navigateTo('thread-detail', { id: thread.id });
    }
  }, [navigateTo]);

  const handleThreadVote = useCallback(async (threadId, voteType) => {
    if (!isAuthenticated) return;
    
    try {
      await api.post(`/user/forums/threads/${threadId}/vote`, {
        vote_type: voteType
      });
      // Update thread in state
      setThreads(prev => prev.map(thread => {
        if (thread.id === threadId) {
          const updatedThread = { ...thread };
          if (voteType === 'up') {
            updatedThread.upvotes = (updatedThread.upvotes || 0) + 1;
            updatedThread.userVote = 'up';
          } else if (voteType === 'down') {
            updatedThread.downvotes = (updatedThread.downvotes || 0) + 1;
            updatedThread.userVote = 'down';
          }
          return updatedThread;
        }
        return thread;
      }));
    } catch (error) {
      console.error('Failed to vote on thread:', error);
    }
  }, [api, isAuthenticated]);

  const handleLoadMoreThreads = useCallback(async () => {
    if (loadingMore || !hasMoreThreads) return;
    
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage + 1);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (sortBy) params.append('sort', sortBy);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      
      const response = await api.get(`/forums/threads?${params.toString()}`);
      const newThreads = response.data?.data || response.data || [];
      
      if (newThreads.length > 0) {
        setThreads(prev => [...prev, ...newThreads]);
        setCurrentPage(prev => prev + 1);
        setHasMoreThreads(newThreads.length >= 20); // Assuming 20 per page
      } else {
        setHasMoreThreads(false);
      }
    } catch (error) {
      console.error('Failed to load more threads:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMoreThreads, currentPage, selectedCategory, sortBy, searchQuery, api]);

  const handleCreateThread = useCallback(() => {
    if (navigateTo) {
      navigateTo('create-thread');
    }
  }, [navigateTo]);

  const handleSearchSuggestionSelect = useCallback((suggestion) => {
    setSearchQuery(suggestion.query || suggestion.title);
    setShowSearchResults(false);
    setSearchSuggestions([]);
  }, []);

  const handlePinThread = async (threadId, shouldPin) => {
    // Optimistic UI update
    const prevThreads = [...threads];
    setThreads(prevThreads.map(thread => 
      thread.id === threadId 
        ? { ...thread, pinned: shouldPin }
        : thread
    ));

    try {
      const endpoint = shouldPin ? `/admin/forums/threads/${threadId}/pin` : `/admin/forums/threads/${threadId}/unpin`;
      await api.post(endpoint);
      console.log(`✅ Thread ${shouldPin ? 'pinned' : 'unpinned'} successfully`);
    } catch (error) {
      console.error('Error pinning/unpinning thread:', error);
      // Rollback on error
      setThreads(prevThreads);
      alert('Failed to ' + (shouldPin ? 'pin' : 'unpin') + ' thread');
    }
  };

  const handleLockThread = async (threadId, shouldLock) => {
    // Optimistic UI update  
    const prevThreads = [...threads];
    setThreads(prevThreads.map(thread => 
      thread.id === threadId 
        ? { ...thread, locked: shouldLock }
        : thread
    ));

    try {
      const endpoint = shouldLock ? `/admin/forums/threads/${threadId}/lock` : `/admin/forums/threads/${threadId}/unlock`;
      await api.post(endpoint);
      console.log(`✅ Thread ${shouldLock ? 'locked' : 'unlocked'} successfully`);
    } catch (error) {
      console.error('Error locking/unlocking thread:', error);
      // Rollback on error
      setThreads(prevThreads);
      alert('Failed to ' + (shouldLock ? 'lock' : 'unlock') + ' thread');
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      // Optimistic UI update - immediately remove from list
      const prevThreads = [...threads];
      setThreads(prevThreads.filter(thread => thread.id !== threadId));

      try {
        await api.post(`/admin/forums/threads/${threadId}/delete`);
        console.log('✅ Thread deleted successfully');
      } catch (error) {
        console.error('Error deleting thread:', error);
        // Rollback on error
        setThreads(prevThreads);
        alert('Failed to delete thread');
      }
    }
  };

  // Removed local formatTimeAgo function - now using the imported one from utils.js for consistency

  const getSortIcon = (type) => {
    if (sortBy === type) {
      return <span className="text-red-600 dark:text-red-400">▼</span>;
    }
    return null;
  };

  const getCategoryColor = (categorySlug) => {
    const category = categories.find(c => c.slug === categorySlug);
    return category?.color || '#6b7280';
  };

  const getCategoryIcon = (categorySlug) => {
    const category = categories.find(c => c.slug === categorySlug);
    return category?.icon || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading forums...</div>
        </div>
      </div>
    );
  }

  // Responsive layout detection
  const isMobile = window.innerWidth < 768;
  const isTablet = window.innerWidth >= 768 && window.innerWidth < 1200;
  const isDesktop = window.innerWidth >= 1200;

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="mobile-forum-wrapper min-h-screen bg-gray-50 dark:bg-gray-900">
        <MobileForumNavigation
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          sortBy={sortBy}
          onSortChange={setSortBy}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onCreateThread={handleCreateThread}
          showSearchSuggestions={showSearchResults && searchSuggestions.length > 0}
          searchSuggestions={searchSuggestions}
          onSearchSuggestionSelect={handleSearchSuggestionSelect}
          isAuthenticated={isAuthenticated}
        />
        
        <div className="pt-20 pb-20 px-0">
          {useVirtualization ? (
            <VirtualizedForumList
              threads={threads}
              onThreadClick={handleThreadSelect}
              onVote={handleThreadVote}
              onBookmark={handleThreadBookmark}
              onShare={handleThreadShare}
              onLoadMore={handleLoadMoreThreads}
              hasMore={hasMoreThreads}
              loading={loadingMore}
              viewMode={viewMode}
              selectedThreadId={selectedThread?.id}
              isAuthenticated={isAuthenticated}
              height={window.innerHeight - 160}
              className="mobile-thread-list"
            />
          ) : (
            <div className="space-y-1">
              {threads.map(thread => (
                <div 
                  key={thread.id}
                  className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-optimized"
                  onClick={() => handleThreadSelect(thread)}
                >
                  {/* Mobile thread card content */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {thread.title}
                      </h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{thread.author?.username || 'Anonymous'}</span>
                        <span>•</span>
                        <span>{formatTimeAgo(thread.created_at)}</span>
                        <span>•</span>
                        <span>{thread.replies_count || 0} replies</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {(thread.upvotes || 0) - (thread.downvotes || 0)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">votes</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Tablet Layout
  if (isTablet) {
    return (
      <TabletForumLayout
        defaultLayout={tabletLayout}
        onLayoutChange={setTabletLayout}
        leftPanel={
          <div className="tablet-forum-sidebar">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  All Categories
                </button>
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.slug
                        ? 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {category.icon} {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        }
        rightPanel={
          <div className="tablet-forum-activity">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Activity</h3>
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Recent activity will be shown here
                </div>
              </div>
            </div>
          </div>
        }
        mainContent={
          <TabletSplitView
            threads={threads}
            selectedThread={selectedThread}
            onThreadSelect={handleThreadSelect}
            showThreadPreview={true}
            onThreadAction={(action, thread) => {
              switch (action) {
                case 'bookmark':
                  handleThreadBookmark(thread.id);
                  break;
                case 'share':
                  handleThreadShare(thread);
                  break;
                case 'vote':
                  handleThreadVote(thread.id, 'up');
                  break;
                default:
                  break;
              }
            }}
            className="h-full"
          />
        }
        className="tablet-forum-layout-wrapper"
      />
    );
  }

  // Desktop Layout (Original)
  return (
    <div 
      ref={containerRef}
      className="max-w-6xl mx-auto mobile-forum-container relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-Refresh Indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200"
          style={{ transform: `translateX(-50%) translateY(${Math.max(0, pullDistance - 80)}px)` }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700">
            <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg z-40 -mx-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Forums</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 touch-optimized"
            >
              <Filter className="w-5 h-5" />
            </button>
            {isAuthenticated && (
              <button 
                onClick={() => navigateTo && navigateTo('create-thread')}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors touch-optimized"
              >
                New
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="relative mb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
                fetchSearchSuggestions(e.target.value);
              }}
              placeholder="Search discussions..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-800 border-none rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 mobile-input-no-zoom"
            />
          </div>
          
          {/* Search Suggestions */}
          {showSearchResults && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 max-h-60 overflow-y-auto">
              {searchSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleMobileSearch(suggestion.query)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{suggestion.title}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{suggestion.category}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-red-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.slug)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                selectedCategory === category.slug
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forums</h1>
        <div className="flex space-x-2">
          {(isAdmin() || isModerator()) && (
            <button 
              onClick={() => navigateTo && navigateTo('admin-forum-categories')}
              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Manage Categories
            </button>
          )}
          {isAuthenticated && (
            <button 
              onClick={() => navigateTo && navigateTo('create-thread')}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              New Thread
            </button>
          )}
        </div>
      </div>

      {/* Filters and Sorting - VLR.gg Style */}
      <div className="card p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* Search */}
          <div className="flex items-center space-x-2 flex-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">Search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search threads..."
              className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-3 py-1 text-gray-900 dark:text-white flex-1 md:max-w-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.slug}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
            <button
              onClick={() => setSortBy('latest')}
              className={`text-sm font-medium transition-colors ${
                sortBy === 'latest' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              Latest {getSortIcon('latest')}
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`text-sm font-medium transition-colors ${
                sortBy === 'popular' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              Popular {getSortIcon('popular')}
            </button>
            <button
              onClick={() => setSortBy('hot')}
              className={`text-sm font-medium transition-colors ${
                sortBy === 'hot' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              Hot {getSortIcon('hot')}
            </button>
          </div>
        </div>
      </div>

      {/* Threads List - Mobile-Optimized */}
      {threads.length > 0 ? (
        <div className="space-y-1">
          {/* Desktop Header Row */}
          <div className="hidden md:grid md:grid-cols-10 gap-4 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="col-span-6">THREAD</div>
            <div className="col-span-2 text-center">REPLIES</div>
            <div className="col-span-2 text-center">LAST REPLY</div>
          </div>

          {threads.map(thread => (
            <div 
              key={thread.id}
              className="card mobile-card relative overflow-hidden touch-optimized"
            >
              {/* Mobile Thread Card */}
              <div className="lg:hidden">
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => navigateTo && navigateTo('thread-detail', { id: thread.id })}
                >
                  {/* Thread Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="flex items-center space-x-2 mb-2">
                        {thread.pinned && (
                          <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                            📌 PINNED
                          </span>
                        )}
                        {thread.locked && (
                          <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                            🔒 LOCKED
                          </span>
                        )}
                        <span 
                          className="px-2 py-1 text-xs font-bold rounded text-white"
                          style={{ backgroundColor: thread.category?.color || getCategoryColor(thread.category_slug) }}
                        >
                          {getCategoryIcon(thread.category?.slug || thread.category_slug)} {thread.category?.name || thread.category_name || 'General'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        {thread.title}
                      </h3>

                      {/* Author and Time */}
                      <div className="flex items-center space-x-2 mb-3">
                        <UserDisplay
                          user={thread.author}
                          showAvatar={true}
                          showHeroFlair={false}
                          showTeamFlair={false}
                          size="xs"
                          clickable={false}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {formatTimeAgo(thread.meta?.created_at || thread.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Actions */}
                    <div className="flex-shrink-0 ml-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show action menu
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Thread Stats */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <MessageCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {thread.stats?.replies || thread.posts_count || thread.replies_count || thread.replies || 0}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">
                          {thread.stats?.views || thread.views || 0}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleThreadBookmark(thread.id);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleThreadShare(thread);
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-green-500 transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Last Activity */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {(thread.stats?.replies > 0 || thread.meta?.last_reply_at) ? (
                          <>Last reply {formatTimeAgo(thread.meta?.last_reply_at || thread.last_reply_at || thread.last_post_at || thread.updated_at)}</>
                        ) : (
                          'No replies yet'
                        )}
                      </span>
                      <ChevronDown className="w-4 h-4 text-gray-400 transform -rotate-90" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Desktop Thread Row */}
              <div 
                className="hidden lg:block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-l-4 border-transparent hover:border-red-600"
                onClick={() => navigateTo && navigateTo('thread-detail', { id: thread.id })}
              >
                <div className="grid grid-cols-1 md:grid-cols-10 gap-4 items-center">
                  {/* Thread Info */}
                  <div className="md:col-span-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1 min-w-0">
                        {/* Thread badges */}
                        <div className="flex items-center space-x-2 mb-1">
                          {thread.pinned && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                              📌 PINNED
                            </span>
                          )}
                          {thread.locked && (
                            <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                              🔒 LOCKED
                            </span>
                          )}
                          
                          {/* Category badge */}
                          <span 
                            className="px-2 py-0.5 text-xs font-bold rounded-full text-white"
                            style={{ backgroundColor: thread.category?.color || getCategoryColor(thread.category_slug) }}
                          >
                            {getCategoryIcon(thread.category?.slug || thread.category_slug)} {thread.category?.name || thread.category_name || 'General'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-1">
                          {thread.title}
                        </h3>

                        {/* Author */}
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500 dark:text-gray-500">by</span>
                          <UserDisplay
                            user={thread.author}
                            showAvatar={true}
                            showHeroFlair={true}
                            showTeamFlair={true}
                            size="xs"
                            clickable={false}
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatTimeAgo(thread.meta?.created_at || thread.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  <div className="md:col-span-2 md:text-center">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {thread.stats?.replies || thread.posts_count || thread.replies_count || thread.replies || 0}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 md:hidden">replies</div>
                  </div>

                  {/* Last Reply */}
                  <div className="md:col-span-2 md:text-center">
                    {(thread.stats?.replies > 0 || thread.meta?.last_reply_at) ? (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {formatTimeAgo(thread.meta?.last_reply_at || thread.last_reply_at || thread.last_post_at || thread.updated_at)}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        No replies
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Moderation Actions */}
                {(isAdmin() || isModerator()) && (
                  <div className="md:col-span-10 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePinThread(thread.id, !thread.pinned);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        thread.pinned 
                          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {thread.pinned ? '📌 Unpin' : '📌 Pin'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockThread(thread.id, !thread.locked);
                      }}
                      className={`px-2 py-1 text-xs rounded transition-colors ${
                        thread.locked 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/30' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {thread.locked ? '🔓 Unlock' : '🔒 Lock'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteThread(thread.id);
                      }}
                      className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">
            {searchQuery ? 'No Results' : 'No Threads'}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {searchQuery ? 'No Search Results' : 'No Threads Found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {searchQuery 
              ? `No threads found matching "${searchQuery}". Try different keywords or browse categories.`
              : selectedCategory !== 'all' 
                ? `No threads found in the selected category.`
                : 'No forum threads available. Be the first to start a discussion!'}
          </p>
          <div className="flex justify-center space-x-4">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Clear Search
              </button>
            )}
            {selectedCategory !== 'all' && !searchQuery && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
              >
                View All Categories
              </button>
            )}
            {isAuthenticated && (
              <button
                onClick={() => navigateTo && navigateTo('create-thread')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Start New Thread
              </button>
            )}
          </div>
        </div>
      )}

      {/* Login Prompt for Unauthenticated Users */}
      {!isAuthenticated && (
        <div className="card p-6 mt-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Join the Community</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to create threads, reply to posts, and participate in discussions.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'))}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign In to Participate
          </button>
        </div>
      )}

    </div>
  );
}

// Add mobile-specific CSS
const mobileStyles = `
  .mobile-forum-wrapper {
    contain: layout style;
    will-change: transform;
    -webkit-overflow-scrolling: touch;
  }
  
  .touch-optimized {
    min-height: 44px;
    min-width: 44px;
    -webkit-tap-highlight-color: rgba(239, 68, 68, 0.1);
    tap-highlight-color: rgba(239, 68, 68, 0.1);
  }
  
  .mobile-thread-list {
    contain: strict;
    will-change: transform;
  }
  
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .tablet-forum-layout-wrapper {
    height: 100vh;
    overflow: hidden;
  }
  
  .tablet-forum-sidebar,
  .tablet-forum-activity {
    height: 100%;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .mobile-forum-wrapper *,
    .tablet-forum-layout-wrapper * {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  
  @media (max-width: 767px) {
    .mobile-input-no-zoom {
      font-size: 16px !important;
      transform: translateZ(0);
    }
    
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  }
`;

// Inject mobile styles
if (typeof document !== 'undefined' && !document.getElementById('mobile-forum-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'mobile-forum-styles';
  styleSheet.textContent = mobileStyles;
  document.head.appendChild(styleSheet);
}

export default ForumsPage;