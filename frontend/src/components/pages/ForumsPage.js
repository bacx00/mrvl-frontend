import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import { processContentWithMentions } from '../../utils/mentionUtils';

function ForumsPage({ navigateTo }) {
  const { isAuthenticated, isAdmin, isModerator, api, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchForumData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (sortBy) params.append('sort', sortBy);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      
      // Fetch threads and categories in parallel
      const [threadsResponse, categoriesResponse] = await Promise.all([
        api.get(`/forums/threads?${params.toString()}`),
        api.get('/forums/categories')
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchForumData();
    }, searchQuery ? 500 : 0); // Debounce search queries

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, sortBy, searchQuery, fetchForumData]);

  const handlePinThread = async (threadId, shouldPin) => {
    try {
      const endpoint = shouldPin ? `/admin/forums/threads/${threadId}/pin` : `/admin/forums/threads/${threadId}/unpin`;
      await api.post(endpoint);
      // Refresh threads
      fetchForumData();
    } catch (error) {
      console.error('Error pinning/unpinning thread:', error);
      alert('Failed to ' + (shouldPin ? 'pin' : 'unpin') + ' thread');
    }
  };

  const handleLockThread = async (threadId, shouldLock) => {
    try {
      const endpoint = shouldLock ? `/admin/forums/threads/${threadId}/lock` : `/admin/forums/threads/${threadId}/unlock`;
      await api.post(endpoint);
      // Refresh threads
      fetchForumData();
    } catch (error) {
      console.error('Error locking/unlocking thread:', error);
      alert('Failed to ' + (shouldLock ? 'lock' : 'unlock') + ' thread');
    }
  };

  const handleDeleteThread = async (threadId) => {
    if (window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
      try {
        await api.post(`/admin/forums/threads/${threadId}/delete`);
        // Refresh threads
        fetchForumData();
      } catch (error) {
        console.error('Error deleting thread:', error);
        alert('Failed to delete thread');
      }
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo`;
    
    const years = Math.floor(diffInMonths / 12);
    return `${years}y`;
  };

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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header - VLR.gg Style */}
      <div className="flex items-center justify-between mb-4">
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
              placeholder="Search threads, mentions (@user, @team:VP, @player:Shao)..."
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
                  {category.name}
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

      {/* Threads List - VLR.gg Clean Style */}
      {threads.length > 0 ? (
        <div className="space-y-1">
          {/* Header Row */}
          <div className="hidden md:grid md:grid-cols-10 gap-4 px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 rounded">
            <div className="col-span-6">THREAD</div>
            <div className="col-span-2 text-center">REPLIES</div>
            <div className="col-span-2 text-center">LAST REPLY</div>
          </div>

          {threads.map(thread => (
            <div 
              key={thread.id}
              className="card p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-l-4 border-transparent hover:border-red-600"
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
                          {thread.category?.name || thread.category_name || 'General'}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1 hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-1">
                        {processContentWithMentions(thread.title, thread.mentions || [])}
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

export default ForumsPage;