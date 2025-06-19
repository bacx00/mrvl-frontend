import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminNews({ navigateTo }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all'
  });
  const { api, isAdmin, isModerator } = useAuth();

  // Check permissions
  const canManageNews = isAdmin() || isModerator();

  useEffect(() => {
    if (canManageNews) {
      fetchNews();
    }
  }, [filters, canManageNews]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/news');
      let newsData = response.data || response;

      // Apply filters
      if (filters.search) {
        newsData = newsData.filter(article => 
          article.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
          article.content?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.status !== 'all') {
        newsData = newsData.filter(article => article.status === filters.status);
      }

      if (filters.category !== 'all') {
        newsData = newsData.filter(article => article.category === filters.category);
      }

      setNews(newsData);
    } catch (error) {
      console.error('Error fetching news:', error);
      // CRITICAL FIX: Use real backend data only, no mock fallback
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (newsId, newsTitle) => {
    if (window.confirm(`Are you sure you want to delete "${newsTitle}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/news/${newsId}`);
        await fetchNews(); // Refresh the list
        alert('News article deleted successfully!');
      } catch (error) {
        console.error('Error deleting news:', error);
        alert('Error deleting news article. Please try again.');
      }
    }
  };

  const updateNewsStatus = async (newsId, newStatus) => {
    try {
      await api.put(`/admin/news/${newsId}`, { status: newStatus });
      await fetchNews(); // Refresh the list
      alert(`News article ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating news status:', error);
      alert('Error updating news status. Please try again.');
    }
  };

  // CRITICAL FIX: Feature/unfeature functionality with complete article data
  const toggleFeatured = async (newsId, article) => {
    try {
      console.log('🔄 Toggling featured status for article:', newsId);
      
      // Send complete article data to avoid validation errors
      const updateData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || article.content?.substring(0, 150) + '...' || 'No excerpt available',
        category: article.category,
        status: article.status,
        featured: !article.featured
      };
      
      await api.put(`/admin/news/${newsId}`, updateData);
      await fetchNews(); // Refresh the list
      alert(`News article ${!article.featured ? 'featured' : 'unfeatured'} successfully!`);
    } catch (error) {
      console.error('Error updating featured status:', error);
      if (error.message.includes('422') || error.message.includes('Validation')) {
        alert('Error: Missing required fields. Please edit the article first to ensure all fields are complete.');
      } else {
        alert('Error updating featured status. Please try again.');
      }
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'updates': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'balance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'esports': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'content': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'community': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'archived': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not published';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const categories = ['all', 'updates', 'balance', 'esports', 'content', 'community'];
  const statuses = ['all', 'published', 'draft', 'scheduled', 'archived'];

  if (!canManageNews) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to manage news articles.
        </p>
      </div>
    );
  }

  // CRITICAL FIX: Remove loading screen as requested
  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage News</h2>
            <p className="text-gray-600 dark:text-gray-400">Loading news articles...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage News</h2>
          <p className="text-gray-600 dark:text-gray-400">Create and manage news articles</p>
        </div>
        <button 
          onClick={() => navigateTo('admin-news-create')}
          className="btn btn-primary whitespace-nowrap"
        >
          📰 Create News Article
        </button>
      </div>

      {/* News Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📰</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {news.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Articles</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {news.filter(n => n.status === 'published').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Published</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-xl font-bold text-gray-600 dark:text-gray-400">
            {news.filter(n => n.status === 'draft').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Drafts</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {news.filter(n => n.featured).length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Featured</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Articles
            </label>
            <input
              type="text"
              placeholder="Search by title or content..."
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
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
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
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
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

      {/* News Articles Grid - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {news.map((article) => (
          <div key={article.id} className="card hover:shadow-lg transition-shadow">
            <div className="p-4">
              {/* Article Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getCategoryColor(article.category)}`}>
                      {article.category.toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getStatusColor(article.status)}`}>
                      {article.status.toUpperCase()}
                    </span>
                    {article.featured && (
                      <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                        ⭐ FEATURED
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                    {article.content}
                  </p>
                </div>
              </div>

              {/* Article Meta */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500 mb-4">
                <div className="flex items-center space-x-3">
                  <span>{article.author?.avatar || '👤'} {article.author?.name || 'Unknown'}</span>
                  <span>👁 {article.views?.toLocaleString() || 0}</span>
                  <span>💬 {article.comments_count || 0}</span>
                </div>
                <span>{formatDate(article.published_at || article.created_at)}</span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigateTo('admin-news-edit', { id: article.id })}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit
                </button>
                
                {article.status === 'draft' && (
                  <button
                    onClick={() => updateNewsStatus(article.id, 'published')}
                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  >
                    📤 Publish
                  </button>
                )}
                
                {article.status === 'published' && (
                  <button
                    onClick={() => updateNewsStatus(article.id, 'draft')}
                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    📥 Unpublish
                  </button>
                )}
                
                <button
                  onClick={() => toggleFeatured(article.id, article)}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    article.featured 
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  {article.featured ? '⭐ Unfeature' : '⭐ Feature'}
                </button>
                
                <button
                  onClick={() => handleDelete(article.id, article.title)}
                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {news.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No News Articles Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.category !== 'all' || filters.status !== 'all'
              ? 'Try adjusting your filters to find more articles.'
              : 'No news articles created yet.'}
          </p>
          <button
            onClick={() => navigateTo('admin-news-create')}
            className="btn btn-primary"
          >
            📰 Create First Article
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminNews;