import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminForums({ navigateTo }) {
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('threads');
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all'
  });
  const { api, isAdmin, isModerator } = useAuth();

  // Check permissions
  const canModerateForums = isAdmin() || isModerator();

  useEffect(() => {
    if (canModerateForums) {
      fetchForumData();
    }
  }, [filters, activeTab, canModerateForums]);

  const fetchForumData = async () => {
    try {
      setLoading(true);
      
      // CRITICAL FIX: Use REAL backend data only
      try {
        console.log('🔍 AdminForums: Fetching REAL moderation data...');
        
        // Try to fetch real threads for moderation
        const threadsResponse = await api.get('/admin/forums/threads');
        const realThreads = threadsResponse?.data?.data || threadsResponse?.data || [];
        
        if (Array.isArray(realThreads) && realThreads.length > 0) {
          const moderationThreads = realThreads.map(thread => ({
            id: thread.id,
            title: thread.title,
            author: { 
              name: thread.user_name || thread.author?.name || 'Unknown User',
              avatar: thread.author?.avatar || '👤'
            },
            category: thread.category || 'general',
            replies: thread.replies || thread.replies_count || 0,
            views: thread.views || thread.views_count || 0,
            created_at: thread.created_at,
            status: thread.status || 'active',
            pinned: thread.pinned || false,
            locked: thread.locked || false,
            reported: thread.reported || false,
            reports_count: thread.reports_count || 0
          }));
          
          setThreads(moderationThreads);
          console.log('✅ AdminForums: Using REAL backend threads:', moderationThreads.length);
        } else {
          setThreads([]);
          console.log('⚠️ AdminForums: No threads found for moderation');
        }
        
        // Try to fetch real categories
        try {
          const categoriesResponse = await api.get('/admin/forums/categories');
          const realCategories = categoriesResponse?.data?.data || categoriesResponse?.data || [];
          setCategories(realCategories);
        } catch (categoriesError) {
          console.log('⚠️ AdminForums: Categories endpoint not available');
          setCategories([
            { id: 'all', name: 'All Categories' },
            { id: 'general', name: 'General Discussion' },
            { id: 'tournaments', name: 'Tournaments' },
            { id: 'hero-discussion', name: 'Hero Discussion' },
            { id: 'strategy', name: 'Strategy & Tactics' },
            { id: 'esports', name: 'Esports & Competitive' }
          ]);
        }
        
        // Set empty reports for now
        setReports([]);
        
      } catch (error) {
        console.error('❌ AdminForums: Failed to fetch moderation data:', error);
        setThreads([]);
        setCategories([]);
        setReports([]);
      }
    } catch (error) {
      console.error('❌ AdminForums: Error in fetchForumData:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle different moderation actions
  const handleAction = async (type, itemId, action) => {
        }
      ]);
    } catch (error) {
      console.error('Error fetching forum data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThreadAction = async (threadId, action) => {
    try {
      let endpoint = '';
      let message = '';
      
      switch (action) {
        case 'pin':
          endpoint = `/admin/forums/threads/${threadId}/pin`;
          message = 'Thread pinned successfully!';
          break;
        case 'unpin':
          endpoint = `/admin/forums/threads/${threadId}/unpin`;
          message = 'Thread unpinned successfully!';
          break;
        case 'lock':
          endpoint = `/admin/forums/threads/${threadId}/lock`;
          message = 'Thread locked successfully!';
          break;
        case 'unlock':
          endpoint = `/admin/forums/threads/${threadId}/unlock`;
          message = 'Thread unlocked successfully!';
          break;
        case 'delete':
          if (!window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
            return;
          }
          endpoint = `/admin/forums/threads/${threadId}`;
          message = 'Thread deleted successfully!';
          break;
      }
      
      if (action === 'delete') {
        await api.delete(endpoint);
      } else {
        await api.post(endpoint);
      }
      
      await fetchForumData(); // Refresh data
      alert(message);
    } catch (error) {
      console.error(`Error performing ${action} on thread:`, error);
      alert(`Error performing ${action}. Please try again.`);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      await api.post(`/admin/forums/reports/${reportId}/${action}`);
      await fetchForumData(); // Refresh data
      alert(`Report ${action} successfully!`);
    } catch (error) {
      console.error(`Error ${action} report:`, error);
      alert(`Error ${action} report. Please try again.`);
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'hero-discussion': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'strategy': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'esports': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'guides': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'team-recruitment': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredThreads = threads.filter(thread => {
    if (filters.search && !thread.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.category !== 'all' && thread.category !== filters.category) {
      return false;
    }
    if (filters.status !== 'all') {
      if (filters.status === 'pinned' && !thread.pinned) return false;
      if (filters.status === 'locked' && !thread.locked) return false;
      if (filters.status === 'reported' && !thread.reported) return false;
    }
    return true;
  });

  if (!canModerateForums) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to moderate forums.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading forum data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Forum Moderation</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage threads, categories, and reports</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'threads', label: 'Threads', count: threads.length },
            { id: 'categories', label: 'Categories', count: categories.length },
            { id: 'reports', label: 'Reports', count: reports.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* Forum Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">💬</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {threads.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Threads</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📌</div>
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {threads.filter(t => t.pinned).length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Pinned</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🔒</div>
          <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
            {threads.filter(t => t.locked).length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Locked</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🚨</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {reports.filter(r => r.status === 'pending').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Pending Reports</div>
        </div>
      </div>

      {/* Threads Tab */}
      {activeTab === 'threads' && (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Search Threads
                </label>
                <input
                  type="text"
                  placeholder="Search by title..."
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="form-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => setFilters({...filters, category: e.target.value})}
                  className="form-input"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="form-input"
                >
                  <option value="all">All</option>
                  <option value="pinned">Pinned</option>
                  <option value="locked">Locked</option>
                  <option value="reported">Reported</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ search: '', category: 'all', status: 'all' })}
                  className="btn btn-secondary w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Threads List */}
          <div className="space-y-4">
            {filteredThreads.map((thread) => (
              <div key={thread.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Thread badges */}
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${getCategoryColor(thread.category)}`}>
                        {thread.category.replace('-', ' ').toUpperCase()}
                      </span>
                      {thread.pinned && (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                          📌 PINNED
                        </span>
                      )}
                      {thread.locked && (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                          🔒 LOCKED
                        </span>
                      )}
                      {thread.reported && (
                        <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                          🚨 REPORTED
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {thread.title}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500 mb-3">
                      <span>{thread.author.avatar} {thread.author.name}</span>
                      <span>💬 {thread.replies} replies</span>
                      <span>👁 {thread.views.toLocaleString()} views</span>
                      <span>👍 {thread.upvotes - thread.downvotes}</span>
                      <span>{formatDate(thread.created_at)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => navigateTo('thread-detail', { id: thread.id })}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        👁 View
                      </button>
                      
                      {thread.pinned ? (
                        <button
                          onClick={() => handleThreadAction(thread.id, 'unpin')}
                          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                        >
                          📌 Unpin
                        </button>
                      ) : (
                        <button
                          onClick={() => handleThreadAction(thread.id, 'pin')}
                          className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                        >
                          📌 Pin
                        </button>
                      )}
                      
                      {thread.locked ? (
                        <button
                          onClick={() => handleThreadAction(thread.id, 'unlock')}
                          className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          🔓 Unlock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleThreadAction(thread.id, 'lock')}
                          className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          🔒 Lock
                        </button>
                      )}
                      
                      <button
                        onClick={() => handleThreadAction(thread.id, 'delete')}
                        className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.filter(cat => cat.id !== 'all').map((category) => (
            <div key={category.id} className="card p-6 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {category.name}
              </h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {category.threads_count}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                threads
              </p>
              <div className="flex space-x-2">
                <button className="btn btn-secondary text-xs">
                  ✏️ Edit
                </button>
                <button className="btn text-xs bg-red-600 text-white hover:bg-red-700">
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
          
          {/* Add Category Card */}
          <div className="card p-6 text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="text-4xl mb-4">➕</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Add Category
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Create a new forum category
            </p>
            <button className="btn btn-primary text-xs">
              ➕ Add Category
            </button>
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                      🚨 {report.reason.toUpperCase()}
                    </span>
                    <span className="px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                      {report.status.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Reported Thread: {report.thread_title}
                  </h3>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    {report.description}
                  </p>

                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500 mb-3">
                    <span>Reported by: {report.reporter.avatar} {report.reporter.name}</span>
                    <span>{formatDate(report.created_at)}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigateTo('thread-detail', { id: report.thread_id })}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      👁 View Thread
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, 'approve')}
                      className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => handleReportAction(report.id, 'dismiss')}
                      className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                    >
                      ❌ Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {reports.length === 0 && (
            <div className="card p-8 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Reports</h3>
              <p className="text-gray-600 dark:text-gray-400">
                All clear! No pending reports to review.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminForums;