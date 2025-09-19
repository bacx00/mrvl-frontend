import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

const ForumModerationPanel = () => {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState('threads');
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchModerationData();
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [activeTab]);

  const fetchModerationData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'threads') {
        const response = await api.get('/admin/forums-moderation/threads');
        setThreads(response?.data?.data || response?.data || []);
      } else if (activeTab === 'posts') {
        const response = await api.get('/admin/forums-moderation/posts');
        setPosts(response?.data?.data || response?.data || []);
      } else if (activeTab === 'reports') {
        const response = await api.get('/admin/forums-moderation/reports');
        setReports(response?.data?.data || response?.data || []);
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/public/forums/categories');
      setCategories(response?.data?.data || response?.data || []);
    } catch (error) {
      console.warn('Could not load categories:', error);
    }
  };

  const handleAction = async (type, id, action, itemName = '') => {
    try {
      if (action === 'delete' && itemName) {
        if (!window.confirm(`Are you sure you want to delete this ${type.slice(0, -1)} "${itemName}"?`)) {
          return;
        }
      }
      
      let endpoint;
      if (type === 'threads') {
        endpoint = `/admin/forums-moderation/threads/${id}`;
      } else if (type === 'posts') {
        endpoint = `/admin/forums-moderation/posts/${id}`;
      } else {
        endpoint = `/admin/forums-moderation/reports/${id}/${action}`;
      }
      
      let response;
      if (action === 'delete') {
        response = await api.delete(endpoint);
      } else if (action === 'lock' || action === 'unlock') {
        response = await api.put(endpoint, { status: action === 'lock' ? 'locked' : 'active' });
      } else {
        response = await api.post(endpoint, { action });
      }
      
      if (response?.data?.success !== false) {
        fetchModerationData();
        alert(`${type.slice(0, -1)} ${action}ed successfully!`);
      } else {
        throw new Error(response?.data?.message || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert(error.response?.data?.message || error.message || `Failed to ${action} ${type.slice(0, -1)}`);
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
    const currentData = activeTab === 'threads' ? threads : activeTab === 'posts' ? posts : reports;
    const filteredItems = filteredData();
    
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.size === 0) return;
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedItems.size} selected items? This action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;
    
    try {
      const endpoint = activeTab === 'threads' ? 
        '/admin/forums-moderation/threads/bulk-action' : 
        activeTab === 'posts' ? '/admin/forums-moderation/posts/bulk-action' :
        '/admin/forums-moderation/reports/bulk-action';
      
      const response = await api.post(endpoint, {
        ids: Array.from(selectedItems),
        action: action
      });
      
      if (response?.data?.success !== false) {
        fetchModerationData();
        setSelectedItems(new Set());
        setShowBulkActions(false);
        alert(`${selectedItems.size} items ${action}ed successfully!`);
      } else {
        throw new Error(response?.data?.message || 'Bulk action failed');
      }
    } catch (error) {
      console.error('Error in bulk action:', error);
      alert(error.response?.data?.message || error.message || `Bulk ${action} failed`);
    }
  };

  const filteredData = () => {
    let data = activeTab === 'threads' ? threads : activeTab === 'posts' ? posts : reports;
    
    // Enhanced search with multiple fields
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      data = data.filter(item => 
        (item.title || '').toLowerCase().includes(term) ||
        (item.content || '').toLowerCase().includes(term) ||
        (item.user?.username || item.user?.name || '').toLowerCase().includes(term) ||
        (item.author || '').toLowerCase().includes(term) ||
        (item.category?.name || '').toLowerCase().includes(term)
      );
    }

    // Status filtering
    if (filterStatus !== 'all') {
      data = data.filter(item => {
        if (activeTab === 'reports') {
          return item.status === filterStatus;
        }
        return item.status === filterStatus;
      });
    }

    // Category filtering for threads
    if (filterCategory !== 'all' && activeTab === 'threads') {
      data = data.filter(item => 
        item.category?.id === parseInt(filterCategory) ||
        item.category_id === parseInt(filterCategory)
      );
    }

    // Sorting
    data = [...data].sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'replies':
          if (activeTab === 'threads') {
            return (b.posts_count || 0) - (a.posts_count || 0);
          }
          return 0;
        case 'votes':
          return (b.upvotes || 0) - (a.upvotes || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        default:
          return 0;
      }
    });

    return data;
  };

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Moderation Data</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button 
            onClick={fetchModerationData}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage forum content</p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={() => setShowModerationRulesModal(true)}
            className="btn btn-secondary"
          >
            Auto-Moderation Rules
          </button>
          <button 
            onClick={() => setShowAuditLogModal(true)}
            className="btn btn-info"
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{threads.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Threads</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {moderationStats.threads_today || 0} created today
              </div>
            </div>
            <div className="text-3xl text-blue-500">📝</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Posts</div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {moderationStats.posts_today || 0} posted today
              </div>
            </div>
            <div className="text-3xl text-green-500">💬</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{reports.filter(r => r.status === 'pending').length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pending Reports</div>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {moderationStats.reports_today || 0} received today
              </div>
            </div>
            <div className="text-3xl text-red-500">⚠️</div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{moderationStats.actions_today || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Mod Actions Today</div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Auto: {moderationStats.auto_actions_today || 0} | Manual: {(moderationStats.actions_today || 0) - (moderationStats.auto_actions_today || 0)}
              </div>
            </div>
            <div className="text-3xl text-purple-500">🔨</div>
          </div>
        </div>
      </div>
      
      {/* Moderation Rules Status */}
      {moderationRules.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-blue-600 dark:text-blue-400 text-lg">🤖</div>
              <div>
                <div className="font-medium text-blue-900 dark:text-blue-200">
                  Auto-Moderation Active
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  {moderationRules.filter(r => r.is_active).length} of {moderationRules.length} rules enabled
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowModerationRulesModal(true)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
            >
              Manage Rules
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('threads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'threads'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'posts'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reports'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Reports ({reports.length})
          </button>
        </nav>
      </div>

      {/* Enhanced Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Search</label>
            <input
              type="text"
              placeholder="Search content, users, categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              {activeTab === 'reports' && <option value="pending">Pending</option>}
              {activeTab === 'reports' && <option value="resolved">Resolved</option>}
              <option value="deleted">Deleted</option>
            </select>
          </div>
          {activeTab === 'threads' && categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="date">Date Created</option>
              {activeTab === 'threads' && <option value="replies">Reply Count</option>}
              <option value="votes">Vote Score</option>
              <option value="status">Status</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterCategory('all');
                setSortBy('date');
              }}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedItems.size} items selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkAction('delete')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => handleBulkAction('lock')}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
                >
                  Lock Selected
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

      {/* Content */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        ) : filteredData().length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Items Found</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {searchTerm || filterStatus !== 'all' || filterCategory !== 'all' 
                ? 'No items match your current filters'
                : `No ${activeTab} to moderate at this time`}
            </p>
          </div>
        ) : (
          <>
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
                    Select all {filteredData().length} {activeTab}
                  </span>
                </label>
              </div>
            )}

            {/* Item List */}
            {filteredData().map(item => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleSelectItem(item.id)}
                      className="mt-1 rounded border-gray-300 dark:border-gray-600"
                    />
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={item.user?.avatar || '/default-avatar.png'} 
                            alt={item.user?.username || item.user?.name}
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '/default-avatar.png';
                            }}
                          />
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.user?.username || item.user?.name || item.author || 'Unknown User'}
                            </span>
                            {item.user?.flair && (
                              <span className="ml-2 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                                {item.user.flair}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : item.status === 'locked'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : item.status === 'pending'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {item.status || 'active'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="mb-3">
                        {item.title && (
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {item.title}
                          </h4>
                        )}
                        <div className="text-gray-600 dark:text-gray-400 line-clamp-3">
                          {item.content?.substring(0, 200) || 'No content'}
                          {item.content?.length > 200 && '...'}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400 mb-4 pb-4 border-b border-gray-200 dark:border-gray-600">
                        <span>Views: {item.views || 0}</span>
                        {activeTab === 'threads' && <span>Replies: {item.posts_count || item.replies_count || 0}</span>}
                        <span>Votes: {item.upvotes || 0} / {item.downvotes || 0}</span>
                        {item.category && <span>Category: {item.category.name || item.category}</span>}
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2">
                        <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm">
                          View Details
                        </button>
                        {item.status !== 'deleted' && (
                          <>
                            <button 
                              onClick={() => handleAction(activeTab, item.id, item.status === 'locked' ? 'unlock' : 'lock', item.title || 'item')}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                            >
                              {item.status === 'locked' ? 'Unlock' : 'Lock'}
                            </button>
                            <button 
                              onClick={() => handleAction(activeTab, item.id, 'delete', item.title || 'item')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                        {activeTab === 'reports' && item.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleReportDetails(item)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                            >
                              View Details
                            </button>
                            <button 
                              onClick={() => handleAction('reports', item.id, 'resolve', item.title || 'report')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                            >
                              Resolve
                            </button>
                            <button 
                              onClick={() => handleAction('reports', item.id, 'dismiss', item.title || 'report')}
                              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                            >
                              Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Report Details Modal */}
      {showReportDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Report Details
              </h3>
              <button
                onClick={() => setShowReportDetailsModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Report Type
                  </label>
                  <span className="text-gray-900 dark:text-white">
                    {selectedReport.report_type || 'General'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <span className={`px-2 py-1 rounded text-xs ${
                    selectedReport.status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  }`}>
                    {selectedReport.status}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reported Content
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                  {selectedReport.content || selectedReport.title || 'No content available'}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reporter Reason
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded border">
                  {selectedReport.reason || 'No reason provided'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reported By
                  </label>
                  <span className="text-gray-900 dark:text-white">
                    {selectedReport.reporter?.name || selectedReport.reporter?.username || 'Anonymous'}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reported Date
                  </label>
                  <span className="text-gray-900 dark:text-white">
                    {selectedReport.created_at ? new Date(selectedReport.created_at).toLocaleString() : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowReportDetailsModal(false)}
                className="btn btn-secondary flex-1"
              >
                Close
              </button>
              <button
                onClick={() => handleReportAction(selectedReport.id, 'resolve')}
                className="btn btn-success flex-1"
              >
                Resolve Report
              </button>
              <button
                onClick={() => handleReportAction(selectedReport.id, 'dismiss')}
                className="btn btn-warning flex-1"
              >
                Dismiss Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Moderation Rules Modal */}
      {showModerationRulesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Auto-Moderation Rules
              </h3>
              <button
                onClick={() => setShowModerationRulesModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <button
                  onClick={() => setShowAutoModerationModal(true)}
                  className="btn btn-primary"
                >
                  Create New Rule
                </button>
              </div>
              
              <div className="space-y-4">
                {moderationRules.map((rule) => (
                  <div key={rule.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {rule.name}
                          </h4>
                          <span className={`px-2 py-1 rounded text-xs ${
                            rule.is_active 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          <strong>Trigger:</strong> {rule.trigger} | 
                          <strong> Condition:</strong> {rule.condition} | 
                          <strong> Action:</strong> {rule.action}
                          {rule.threshold && ` | Threshold: ${rule.threshold}`}
                        </div>
                        
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {rule.created_at ? new Date(rule.created_at).toLocaleDateString() : 'Unknown'} | 
                          Triggered: {rule.trigger_count || 0} times
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleToggleRule(rule.id, rule.is_active)}
                          className={`px-3 py-1 rounded text-sm ${
                            rule.is_active 
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {rule.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id, rule.name)}
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {moderationRules.length === 0 && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🤖</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Auto-Moderation Rules
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create rules to automatically moderate content based on keywords, user reports, or other triggers.
                    </p>
                    <button
                      onClick={() => setShowAutoModerationModal(true)}
                      className="btn btn-primary"
                    >
                      Create First Rule
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Auto-Moderation Rule Modal */}
      {showAutoModerationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Auto-Moderation Rule
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={autoModerationRule.name}
                  onChange={(e) => setAutoModerationRule({...autoModerationRule, name: e.target.value})}
                  placeholder="e.g., Block Spam Keywords"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Trigger Type
                </label>
                <select
                  value={autoModerationRule.trigger}
                  onChange={(e) => setAutoModerationRule({...autoModerationRule, trigger: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="keyword">Keyword Match</option>
                  <option value="user_reports">User Reports Threshold</option>
                  <option value="spam_score">Spam Score</option>
                  <option value="length">Content Length</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Condition *
                </label>
                <input
                  type="text"
                  value={autoModerationRule.condition}
                  onChange={(e) => setAutoModerationRule({...autoModerationRule, condition: e.target.value})}
                  placeholder={`${
                    autoModerationRule.trigger === 'keyword' ? 'spam,advertisement,scam'
                    : autoModerationRule.trigger === 'user_reports' ? '3'
                    : autoModerationRule.trigger === 'spam_score' ? '0.8'
                    : '10'
                  }`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Action
                  </label>
                  <select
                    value={autoModerationRule.action}
                    onChange={(e) => setAutoModerationRule({...autoModerationRule, action: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="flag">Flag for Review</option>
                    <option value="hide">Hide Content</option>
                    <option value="lock">Lock Thread</option>
                    <option value="delete">Delete Content</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={autoModerationRule.threshold}
                    onChange={(e) => setAutoModerationRule({...autoModerationRule, threshold: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={autoModerationRule.is_active}
                    onChange={(e) => setAutoModerationRule({...autoModerationRule, is_active: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Activate this rule immediately
                  </span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => {
                  setShowAutoModerationModal(false);
                  setAutoModerationRule({
                    name: '',
                    trigger: 'keyword',
                    condition: '',
                    action: 'flag',
                    threshold: 1,
                    is_active: true
                  });
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAutoRule}
                className="btn btn-primary flex-1"
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditLogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Moderation Audit Log
              </h3>
              <button
                onClick={() => setShowAuditLogModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {auditLog.length > 0 ? (
                <div className="space-y-4">
                  {auditLog.map((log, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              log.action_type === 'delete' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : log.action_type === 'lock' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {log.action_type || 'Action'}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              by {log.moderator?.name || log.moderator || 'System'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown time'}
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-900 dark:text-white mb-1">
                            <strong>Target:</strong> {log.target_type} #{log.target_id} - {log.target_title || 'Untitled'}
                          </div>
                          
                          {log.reason && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Reason:</strong> {log.reason}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Audit Log Entries
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Moderation actions will be logged here for transparency and tracking.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumModerationPanel;