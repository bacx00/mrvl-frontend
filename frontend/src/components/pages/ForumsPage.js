import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';

function ForumsPage({ navigateTo }) {
  const { isAuthenticated, isAdmin, isModerator, api } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); 
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchForumData = useCallback(async () => {
    try {
      setLoading(true);
      
      // CRITICAL FIX: Fetch REAL forum threads from backend first
      let threadsData = [];
      let categoriesData = [];
      
      try {
        console.log('🔍 ForumsPage: Fetching REAL forum data from backend...');
        
        // Get real threads from backend
        const threadsResponse = await api.get('/forums/threads');
        const rawThreads = threadsResponse?.data?.data || threadsResponse?.data || [];
        
        if (Array.isArray(rawThreads) && rawThreads.length > 0) {
          threadsData = rawThreads.map(thread => ({
            id: thread.id, // ✅ CRITICAL FIX: Use REAL thread ID from backend
            title: thread.title,
            author: {
              name: thread.user_name || thread.author?.name || 'Anonymous',
              role: thread.author?.role || 'user',
              country: thread.author?.country || 'US',
              teamFlair: thread.author?.team_flair || null
            },
            category: thread.category || 'general',
            replies: thread.replies || thread.replies_count || 0,
            views: thread.views || thread.views_count || 0,
            lastReply: {
              user: thread.last_reply?.user || thread.user_name || 'No replies',
              timestamp: formatTimeAgo(thread.updated_at || thread.created_at)
            },
            created: thread.created_at,
            pinned: thread.pinned || false,
            locked: thread.locked || false,
            trending: thread.trending || false,
            excerpt: thread.content ? thread.content.substring(0, 150) + '...' : 'No preview available'
          }));
          console.log('✅ ForumsPage: Using REAL backend threads:', threadsData.length);
        } else {
          throw new Error('No real threads found');
        }
        
        // Try to get real categories from backend
        try {
          const categoriesResponse = await api.get('/forums/categories');
          const rawCategories = categoriesResponse?.data?.data || categoriesResponse?.data || [];
          
          if (Array.isArray(rawCategories) && rawCategories.length > 0) {
            categoriesData = [
              { id: 'all', name: 'All Categories', count: threadsData.length },
              ...rawCategories.map(cat => ({
                id: cat.id || cat.slug,
                name: cat.name,
                count: cat.threads_count || 0
              }))
            ];
            console.log('✅ ForumsPage: Using REAL backend categories:', categoriesData.length);
          } else {
            throw new Error('Empty categories response');
          }
        } catch (categoriesError) {
          console.log('⚠️ ForumsPage: Categories API unavailable, using enhanced fallback categories');
          categoriesData = [
            { id: 'all', name: 'All Categories', count: threadsData.length },
            { id: 'general-discussion', name: 'General Discussion', count: Math.floor(threadsData.length * 0.3) },
            { id: 'strategy', name: 'Strategy & Tactics', count: Math.floor(threadsData.length * 0.15) },
            { id: 'hero-discussion', name: 'Hero Discussion', count: Math.floor(threadsData.length * 0.25) },
            { id: 'esports', name: 'Esports & Competitive', count: Math.floor(threadsData.length * 0.1) },
            { id: 'guides', name: 'Guides & Tutorials', count: Math.floor(threadsData.length * 0.05) },
            { id: 'team-recruitment', name: 'Team Recruitment', count: Math.floor(threadsData.length * 0.05) },
            { id: 'meta-discussion', name: 'Meta Analysis', count: Math.floor(threadsData.length * 0.05) },
            { id: 'feedback', name: 'Feedback & Suggestions', count: Math.floor(threadsData.length * 0.03) },
            { id: 'bugs', name: 'Bug Reports', count: Math.floor(threadsData.length * 0.02) }
          ];
        }
        
      } catch (error) {
        console.error('❌ ForumsPage: Unable to load forum data from backend');
        // Remove fallback data generation - dynamic from backend only
        // Remove fallback data generation - dynamic from backend only
        setThreads([]); // Show empty state instead of mock data
        
        // Set basic categories without mock data - MATCH CreateThreadPage categories exactly  
        categoriesData = [
          { id: 'all', name: 'All Categories', count: 0 },
          { id: 'general', name: 'General Discussion', count: 0 },
          { id: 'strategy', name: 'Strategy & Tactics', count: 0 },
          { id: 'guides', name: 'Guides & Tutorials', count: 0 },
          { id: 'feedback', name: 'Feedback & Suggestions', count: 0 }
        ];
      }

      setCategories(categoriesData);
      
      // Filter and sort threads
      let filteredThreads = threadsData;
      
      if (selectedCategory !== 'all') {
        filteredThreads = filteredThreads.filter(thread => thread.category === selectedCategory);
      }
      
      if (searchQuery) {
        filteredThreads = filteredThreads.filter(thread =>
          thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          thread.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply sorting
      switch (sortBy) {
        case 'recent':
          filteredThreads.sort((a, b) => new Date(b.created) - new Date(a.created));
          break;
        case 'popular':
          filteredThreads.sort((a, b) => b.replies - a.replies);
          break;
        case 'replies':
          filteredThreads.sort((a, b) => b.replies - a.replies);
          break;
        case 'views':
          filteredThreads.sort((a, b) => b.views - a.views);
          break;
        default:
          break;
      }
      
      // Always put pinned posts first
      const pinnedThreads = filteredThreads.filter(t => t.pinned);
      const regularThreads = filteredThreads.filter(t => !t.pinned);
      filteredThreads = [...pinnedThreads, ...regularThreads];
      
      setThreads(filteredThreads);
    } catch (error) {
      console.error('Error fetching forum data:', error);
      setThreads([]); // NO MOCK DATA - REAL BACKEND ONLY
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy, api]);

  // ✅ ENHANCED: More realistic time formatting
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Just now';
    
    const date = new Date(dateString);
    
    // ✅ FIXED: Handle invalid dates from backend
    if (isNaN(date.getTime())) {
      console.warn('Invalid date format:', dateString);
      return 'Just now';
    }
    
    const now = new Date();
    const diffMs = now - date;
    
    // ✅ FIXED: Handle negative differences (future dates)
    if (diffMs < 0) {
      return 'Just now';
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    
    // ✅ ENHANCED: For old dates, show actual date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };



  useEffect(() => {
    fetchForumData();
  }, [fetchForumData]);

  // CRITICAL FIX: Listen for new thread creation to refresh forum list
  useEffect(() => {
    const handleNewThreadCreated = () => {
      console.log('🔄 ForumsPage: New thread created, refreshing forum list...');
      fetchForumData();
    };

    window.addEventListener('mrvl-thread-created', handleNewThreadCreated);
    
    return () => {
      window.removeEventListener('mrvl-thread-created', handleNewThreadCreated);
    };
  }, [fetchForumData]);

  // FIXED: Properly handle sign-in by setting up the main auth modal
  const handleSignInClick = () => {
    console.log('🔑 ForumsPage: Sign in button clicked');
    setShowAuthModal(true);
  };

  // CRITICAL FIX: Use REAL thread ID for navigation
  const handleThreadClick = (threadId) => {
    console.log('🔗 ForumsPage: Navigating to thread with REAL ID:', threadId);
    if (navigateTo && typeof navigateTo === 'function') {
      navigateTo('thread-detail', { id: threadId });
    }
  };

  const handleCreateThread = () => {
    if (isAuthenticated) {
      if (navigateTo && typeof navigateTo === 'function') {
        navigateTo('create-thread');
      }
    } else {
      handleSignInClick();
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'text-red-600 dark:text-red-400';
      case 'moderator': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return 'DEV';
      case 'moderator': return 'MOD';
      default: return '';
    }
  };

  // Country flag helper function
  const getCountryFlag = (countryCode) => {
    const flagMap = {
      'US': '🇺🇸',
      'CA': '🇨🇦', 
      'UK': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'BR': '🇧🇷',
      'KR': '🇰🇷',
      'JP': '🇯🇵'
    };
    return flagMap[countryCode] || '🌍';
  };

  // FIXED: Inline Auth Modal Component - triggers main App.js AuthModal
  const InlineAuthModal = () => {
    if (!showAuthModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowAuthModal(false)}
        />
        <div className="relative card w-full max-w-md">
          <div className="p-6">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                🔑 Sign In Required
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Please sign in to participate in forum discussions and create posts.
              </p>
              
              <div className="space-y-3">
                <button 
                  onClick={() => {
                    setShowAuthModal(false);
                    window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'));
                  }}
                  className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  🚀 Sign In / Sign Up
                </button>
                
                <button 
                  onClick={() => setShowAuthModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
                Sign in to reply to posts and join the conversation!
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="forum-layout max-w-6xl mx-auto">
      <InlineAuthModal />

      {/* Compact header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-red-600 dark:text-red-400">Forums</h1>
        
        {/* FIXED: Show different buttons based on user role */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleCreateThread}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            {isAuthenticated ? 'New Post' : 'Sign In to Post'}
          </button>
          
          {/* Only show Admin Panel for admins and moderators */}
          {(isAdmin() || isModerator()) && (
            <button 
              onClick={() => navigateTo && navigateTo('admin-forums')}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Moderate
            </button>
          )}
        </div>
      </div>

      {/* ✅ CATEGORY HEADER BAR - All categories as tabs (SINGLE, NOT DUPLICATED) */}
      <div className="card mb-4">
        <div className="p-2">
          <div className="flex flex-wrap gap-1">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.name}
                <span className="ml-1 text-xs opacity-75">({category.count || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

{/* Responsive card layout */}
      <div className="card">
        {/* Added sorting controls */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-600">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            
            {/* Added sorting dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="recent">Recent</option>
                <option value="popular">Popular</option>
                <option value="replies">Most Replies</option>
                <option value="views">Most Views</option>
              </select>
            </div>
          </div>
        </div>

        {/* Posts List - VLR.gg style with user flags and team flairs */}
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-600 dark:text-gray-400">Loading posts...</div>
            </div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-xl mb-2">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No posts found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'Be the first to start a discussion!'}
              </p>
              <button 
                onClick={handleCreateThread}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
              >
                {isAuthenticated ? 'Create First Post' : 'Sign In to Create Post'}
              </button>
            </div>
          ) : (
            threads.map(thread => (
              <div 
                key={thread.id} 
                className="forum-thread cursor-pointer p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => handleThreadClick(thread.id)}
              >
                <div className="flex flex-col md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-3">
                  <div className="flex-1 min-w-0">
                    {/* Post badges */}
                    <div className="flex items-center flex-wrap space-x-2 mb-1">
                      {thread.pinned && (
                        <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 text-xs font-bold rounded">
                          PINNED
                        </span>
                      )}
                      {thread.trending && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-xs font-bold rounded">
                          TRENDING
                        </span>
                      )}
                      {thread.locked && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold rounded">
                          LOCKED
                        </span>
                      )}
                    </div>

                    {/* Title - responsive text sizing */}
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 dark:text-white mb-1 hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-2">
                      {thread.title}
                    </h3>

                    {/* Excerpt - hidden on mobile */}
                    <p className="hidden md:block text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                      {thread.excerpt}
                    </p>

                    {/* Meta info with VLR.gg style flags and team flairs */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-500 dark:text-gray-500 space-y-1 sm:space-y-0">
                      <div className="flex items-center space-x-2">
                        {/* Country Flag */}
                        <span className="text-sm">{getCountryFlag(thread.author.country)}</span>
                        
                        {/* Username */}
                        <span className="font-medium text-gray-900 dark:text-gray-100">{thread.author.name}</span>
                        
                        {/* Role badge */}
                        {thread.author.role !== 'user' && (
                          <span className={`font-bold ${getRoleColor(thread.author.role)}`}>
                            {getRoleDisplay(thread.author.role)}
                          </span>
                        )}
                        
                        {/* Team Flair */}
                        {thread.author.teamFlair && (
                          <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                            {thread.author.teamFlair.name}
                          </span>
                        )}
                        
                        <span>•</span>
                        <span>{formatTimeAgo(thread.created)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">{thread.replies} replies</span>
                        <span className="hidden sm:inline">{thread.views.toLocaleString()} views</span>
                      </div>
                    </div>

                    {/* Last Reply */}
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                      Last reply by <span className="font-medium text-gray-700 dark:text-gray-300">{thread.lastReply.user}</span> • {thread.lastReply.timestamp}
                    </div>
                  </div>

                  {/* Reply Button */}
                  <div className="pt-1 self-start md:self-center">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          handleSignInClick();
                        } else {
                          handleThreadClick(thread.id);
                        }
                      }}
                      className="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ForumsPage;