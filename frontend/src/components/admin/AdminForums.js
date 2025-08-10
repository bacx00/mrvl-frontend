import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminForums() {
  const { api } = useAuth();
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('threads');
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'date'
  });
  
  // Bulk operations
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    if (currentTab === 'threads') {
      fetchThreads();
    } else if (currentTab === 'posts') {
      fetchPosts();
    }
  }, [currentTab]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/forums-moderation/threads');
      const threadsData = response?.data?.data || response?.data || response || [];
      setThreads(Array.isArray(threadsData) ? threadsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching threads:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load threads';
      setError(errorMessage);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/forums-moderation/posts');
      const postsData = response?.data?.data || response?.data || response || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load posts';
      setError(errorMessage);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = async (threadId, title) => {
    if (window.confirm(`Delete thread "${title}"?`)) {
      try {
        const response = await api.delete(`/api/admin/forums-moderation/threads/${threadId}`);
        if (response.data?.success !== false) {
          await fetchThreads();
          alert('Thread deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting thread:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting thread';
        alert(errorMessage);
      }
    }
  };

  const handleDeletePost = async (postId, preview) => {
    if (window.confirm(`Delete post "${preview}"?`)) {
      try {
        const response = await api.delete(`/api/admin/forums-moderation/posts/${postId}`);
        if (response.data?.success !== false) {
          await fetchPosts();
          alert('Post deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting post';
        alert(errorMessage);
      }
    }
  };

  const handleToggleThreadStatus = async (threadId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      const response = await api.put(`/api/admin/forums-moderation/threads/${threadId}`, {
        status: newStatus
      });
      if (response.data?.success !== false) {
        await fetchThreads();
        alert(`Thread ${newStatus === 'active' ? 'unlocked' : 'locked'} successfully!`);
      } else {
        throw new Error(response.data?.message || 'Status update failed');
      }
    } catch (error) {
      console.error('Error updating thread status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating thread status';
      alert(errorMessage);
    }
  };

  // Bulk operations
  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    const currentData = currentTab === 'threads' ? threads : posts;
    if (selectedItems.size === currentData.length) {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedItems(new Set(currentData.map(item => item.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    const itemType = currentTab === 'threads' ? 'threads' : 'posts';
    const confirmMessage = `Are you sure you want to delete ${selectedItems.size} ${itemType}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const endpoint = currentTab === 'threads' ? 
          '/api/admin/forums-moderation/threads/bulk-delete' : 
          '/api/admin/forums-moderation/posts/bulk-delete';
        
        const response = await api.post(endpoint, {
          ids: Array.from(selectedItems)
        });
        
        if (response.data?.success !== false) {
          if (currentTab === 'threads') {
            await fetchThreads();
          } else {
            await fetchPosts();
          }
          setSelectedItems(new Set());
          setShowBulkActions(false);
          alert(`${selectedItems.size} ${itemType} deleted successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk delete failed');
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk delete failed';
        alert(errorMessage);
      }
    }
  };

  const filteredData = () => {
    const data = currentTab === 'threads' ? threads : posts;
    let filtered = [...data];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(searchTerm) ||
        item.content?.toLowerCase().includes(searchTerm) ||
        item.user?.name?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (filters.sortBy === 'replies' && currentTab === 'threads') {
      filtered.sort((a, b) => (b.posts_count || 0) - (a.posts_count || 0));
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Data</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button 
            onClick={() => currentTab === 'threads' ? fetchThreads() : fetchPosts()} 
            className="btn btn-outline-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400">Moderate forum threads and posts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentTab('threads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'threads'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setCurrentTab('posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'posts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Posts ({posts.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search {currentTab}
            </label>
            <input
              type="text"
              placeholder={`Search ${currentTab}...`}
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="date">Date</option>
              {currentTab === 'threads' && <option value="replies">Replies</option>}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', status: 'all', sortBy: 'date' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedItems.size} {currentTab} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete Selected
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedItems(new Set());
                setShowBulkActions(false);
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Select All */}
        {filteredData().length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredData().length && filteredData().length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Select all {filteredData().length} {currentTab}
              </span>
            </label>
          </div>
        )}

        {currentTab === 'threads' ? (
          filteredData().map((thread) => (
            <div key={thread.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(thread.id)}
                    onChange={() => handleSelectItem(thread.id)}
                    className="mt-1 rounded border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {thread.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>By {thread.user?.name || thread.author || 'Unknown'}</span>
                      <span>{thread.posts_count || 0} posts</span>
                      <span>{thread.created_at ? new Date(thread.created_at).toLocaleDateString() : 'Unknown date'}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        thread.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {thread.status || 'active'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn btn-outline-primary text-sm">View</button>
                  <button 
                    onClick={() => handleToggleThreadStatus(thread.id, thread.status || 'active')}
                    className="btn btn-outline-secondary text-sm"
                  >
                    {thread.status === 'active' ? 'Lock' : 'Unlock'}
                  </button>
                  <button 
                    onClick={() => handleDeleteThread(thread.id, thread.title)}
                    className="btn btn-outline-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          filteredData().map((post) => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(post.id)}
                    onChange={() => handleSelectItem(post.id)}
                    className="mt-1 rounded border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <div className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
                      {post.content?.substring(0, 200) || 'No content'}...
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>By {post.user?.name || post.author || 'Unknown'}</span>
                      <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date'}</span>
                      <span>Thread: {post.thread?.title || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn btn-outline-primary text-sm">View</button>
                  <button 
                    onClick={() => handleDeletePost(post.id, post.content?.substring(0, 50) || 'Post')}
                    className="btn btn-outline-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredData().length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No {currentTab === 'threads' ? 'Forum Threads' : 'Forum Posts'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.search || filters.status !== 'all' 
              ? `No ${currentTab} match your current filters.`
              : `No ${currentTab} to moderate at this time.`}
          </p>
        </div>
      )}
    </div>
  );
}

export default AdminForums;