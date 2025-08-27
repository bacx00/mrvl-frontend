import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks';
import NewsForm from './NewsForm';

function AdminNews() {
  const { api } = useAuth();
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal and form states
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignData, setReassignData] = useState({ targetCategoryId: '', action: 'reassign' });
  
  // News form data
  const [newsFormData, setNewsFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    category_id: null,
    status: 'draft',
    featured_image: '',
    tags: '',
    author: '',
    published_at: '',
    scheduled_at: '',
    is_featured: false,
    allow_comments: true,
    seo_title: '',
    seo_description: '',
    reading_time: 0
  });

  // Advanced features
  const [showSchedulingModal, setShowSchedulingModal] = useState(false);
  const [showCommentModerationModal, setShowCommentModerationModal] = useState(false);
  const [selectedArticleForComments, setSelectedArticleForComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [articleAnalytics, setArticleAnalytics] = useState({});
  
  // Featured articles management
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [showFeaturedModal, setShowFeaturedModal] = useState(false);

  // Export functionality
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: 'csv',
    dateRange: 'all',
    includeComments: true,
    includeAnalytics: true
  });
  
  // Category form data
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all'
  });

  // Bulk operations
  const [selectedNews, setSelectedNews] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, []);

  // Fetch featured articles and analytics after news is loaded
  useEffect(() => {
    if (news.length > 0) {
      fetchFeaturedArticles();
      fetchArticleAnalytics();
    }
  }, [news]);

  const fetchFeaturedArticles = async () => {
    try {
      // Use the main news endpoint and filter for featured articles
      const response = await api.get('/admin/news-moderation');
      const allNews = response?.data?.data || response?.data || [];
      const featuredData = Array.isArray(allNews) ? allNews.filter(article => article.featured) : [];
      setFeaturedArticles(featuredData);
    } catch (err) {
      console.warn('Could not load featured articles:', err);
      setFeaturedArticles([]);
    }
  };

  const fetchArticleAnalytics = async () => {
    try {
      // For now, use mock analytics since the endpoint doesn't exist yet
      const analyticsData = {};
      news.forEach(article => {
        analyticsData[article.id] = {
          views: Math.floor(Math.random() * 1000) + 50, // Mock view count
          comments: Math.floor(Math.random() * 20), // Mock comment count
          engagement: Math.floor(Math.random() * 100) + 10 // Mock engagement
        };
      });
      setArticleAnalytics(analyticsData);
    } catch (err) {
      console.warn('Could not load article analytics:', err);
      setArticleAnalytics({});
    }
  };

  const fetchComments = async (articleId) => {
    try {
      // Try the admin comments endpoint, fallback to regular comments
      let response;
      try {
        response = await api.get(`/admin/news-moderation/${articleId}/comments`);
      } catch (adminError) {
        // Fallback to regular comments endpoint
        response = await api.get(`/news/${articleId}/comments`);
      }
      const commentsData = response?.data?.data || response?.data || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (err) {
      console.warn('Could not load comments:', err);
      setComments([]);
    }
  };

  const fetchNews = async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/news-moderation?page=${page}&limit=${limit}`);
      const newsData = response?.data?.data || response?.data || response || [];
      setNews(Array.isArray(newsData) ? newsData : []);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load news';
      setError(errorMessage);
      console.error('Error fetching news:', err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/admin/news-moderation/categories');
      const categoryData = response?.data?.data || response?.data || response || [];
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load categories';
      console.warn('Categories fetch error:', errorMessage);
      setCategories([]);
    }
  };

  // Filtered news
  const filteredNews = useMemo(() => {
    let filtered = [...news];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(article => 
        article.title?.toLowerCase().includes(searchTerm) ||
        article.content?.toLowerCase().includes(searchTerm) ||
        article.excerpt?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(article => article.category_id?.toString() === filters.category);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(article => article.status === filters.status);
    }

    return filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }, [news, filters]);

  // News CRUD Operations
  const handleCreateNews = () => {
    setNewsFormData({
      title: '',
      content: '',
      excerpt: '',
      category_id: null,
      status: 'draft',
      featured_image: '',
      tags: '',
      author: '',
      published_at: ''
    });
    setEditingNews(null);
    setShowNewsModal(true);
  };

  const handleEditNews = (article) => {
    setEditingNews(article);
    setNewsFormData({
      title: article.title || '',
      content: article.content || '',
      excerpt: article.excerpt || '',
      category_id: article.category_id || null,
      status: article.status || 'draft',
      featured_image: article.featured_image || '',
      tags: Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || ''),
      author: article.author || '',
      published_at: article.published_at || '',
      scheduled_at: article.scheduled_at || '',
      is_featured: article.featured || false,
      allow_comments: article.allow_comments !== false,
      seo_title: article.seo_title || '',
      seo_description: article.seo_description || '',
      reading_time: article.reading_time || 0
    });
    setShowNewsModal(true);
  };

  // Featured article management
  const handleToggleFeatured = async (articleId, isFeatured) => {
    try {
      const response = await api.put(`/admin/news-moderation/${articleId}`, {
        featured: !isFeatured
      });
      
      if (response.data?.success !== false) {
        await fetchNews();
        await fetchFeaturedArticles();
        alert(`Article ${!isFeatured ? 'featured' : 'unfeatured'} successfully!`);
      } else {
        throw new Error(response.data?.message || 'Feature toggle failed');
      }
    } catch (error) {
      console.error('Error toggling featured status:', error);
      alert('Failed to update featured status');
    }
  };

  // Comment moderation
  const handleCommentModeration = (article) => {
    setSelectedArticleForComments(article);
    fetchComments(article.id);
    setShowCommentModerationModal(true);
  };

  const handleCommentAction = async (commentId, action) => {
    try {
      const response = await api.post(`/admin/comments/${commentId}/${action}`);
      
      if (response.data?.success !== false) {
        await fetchComments(selectedArticleForComments.id);
        alert(`Comment ${action}ed successfully!`);
      } else {
        throw new Error(response.data?.message || 'Comment action failed');
      }
    } catch (error) {
      console.error('Error performing comment action:', error);
      alert('Failed to perform comment action');
    }
  };

  // Scheduling functionality
  const handleScheduleArticle = async (articleId, scheduledDate) => {
    try {
      const response = await api.put(`/admin/news-moderation/${articleId}`, {
        status: 'scheduled',
        scheduled_at: scheduledDate
      });
      
      if (response.data?.success !== false) {
        await fetchNews();
        alert('Article scheduled successfully!');
        setShowSchedulingModal(false);
      } else {
        throw new Error(response.data?.message || 'Scheduling failed');
      }
    } catch (error) {
      console.error('Error scheduling article:', error);
      alert('Failed to schedule article');
    }
  };

  // Export functionality
  const handleExportData = async () => {
    try {
      const params = new URLSearchParams({
        format: exportOptions.format,
        dateRange: exportOptions.dateRange,
        includeComments: exportOptions.includeComments,
        includeAnalytics: exportOptions.includeAnalytics
      });
      
      const response = await api.get(`/admin/news-moderation/export?${params}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `news-export-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setShowExportModal(false);
      alert('Export completed successfully!');
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data');
    }
  };

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    
    // Enhanced client-side validation
    const errors = [];
    if (!newsFormData.title?.trim()) errors.push('Title is required');
    if (!newsFormData.content?.trim()) errors.push('Content is required');
    if (newsFormData.content?.trim().length < 50) errors.push('Content must be at least 50 characters');
    if (!newsFormData.category_id) errors.push('Category is required - please select a category');

    if (errors.length > 0) {
      alert('Please fix the following errors:\n• ' + errors.join('\n• '));
      return;
    }

    try {
      const submitData = {
        ...newsFormData,
        category_id: parseInt(newsFormData.category_id) || null,
        tags: newsFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (editingNews) {
        const response = await api.put(`/admin/news-moderation/${editingNews.id}`, submitData);
        if (response.data?.success !== false) {
          alert('News updated successfully!');
        } else {
          throw new Error(response.data?.message || 'Update failed');
        }
      } else {
        const response = await api.post('/admin/news-moderation', submitData);
        if (response.data?.success !== false) {
          alert('News created successfully!');
        } else {
          throw new Error(response.data?.message || 'Creation failed');
        }
      }
      
      await fetchNews();
      setShowNewsModal(false);
    } catch (error) {
      console.error('Error submitting news:', error);
      
      // Better error handling for validation errors
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        let errorMessage = 'Validation Errors:\n';
        Object.keys(validationErrors).forEach(field => {
          errorMessage += `• ${field}: ${validationErrors[field].join(', ')}\n`;
        });
        alert(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || error.message || `Error ${editingNews ? 'updating' : 'creating'} news`;
        alert(errorMessage);
      }
    }
  };

  const handleDeleteNews = async (newsId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const response = await api.delete(`/admin/news-moderation/${newsId}`);
        if (response.data?.success !== false) {
          await fetchNews();
          alert('News deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting news:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting news';
        alert(errorMessage);
      }
    }
  };

  // Category CRUD Operations
  const handleCreateCategory = () => {
    setCategoryFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
    setEditingCategory(null);
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name || '',
      description: category.description || '',
      color: category.color || '#3B82F6'
    });
    setShowCategoryModal(true);
  };

  const handleSubmitCategory = async (e) => {
    e.preventDefault();
    
    if (!categoryFormData.name.trim()) {
      alert('Please enter a category name');
      return;
    }

    try {
      if (editingCategory) {
        const response = await api.put(`/admin/news-moderation/categories/${editingCategory.id}`, categoryFormData);
        if (response.data?.success !== false) {
          alert('Category updated successfully!');
        } else {
          throw new Error(response.data?.message || 'Update failed');
        }
      } else {
        const response = await api.post('/admin/news-moderation/categories', categoryFormData);
        if (response.data?.success !== false) {
          alert('Category created successfully!');
        } else {
          throw new Error(response.data?.message || 'Creation failed');
        }
      }
      
      await fetchCategories();
      setShowCategoryModal(false);
    } catch (error) {
      console.error('Error submitting category:', error);
      const errorMessage = error.response?.data?.message || error.message || `Error ${editingCategory ? 'updating' : 'creating'} category`;
      alert(errorMessage);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    try {
      // First, check how many articles are in this category
      const articlesInCategory = news.filter(article => article.category_id?.toString() === categoryId.toString());
      
      if (articlesInCategory.length > 0) {
        // Show reassignment modal instead of direct deletion
        setDeletingCategory({ id: categoryId, name: categoryName, articleCount: articlesInCategory.length });
        setReassignData({ targetCategoryId: '', action: 'reassign' });
        setShowReassignModal(true);
        return;
      }

      // If no articles, proceed with direct deletion
      if (window.confirm(`Are you sure you want to delete category "${categoryName}"?`)) {
        await performCategoryDeletion(categoryId);
      }
    } catch (error) {
      console.error('Error preparing category deletion:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting category';
      alert(errorMessage);
    }
  };

  const performCategoryDeletion = async (categoryId, reassignToId = null, deleteArticles = false) => {
    try {
      const payload = {
        reassign_to_category_id: reassignToId,
        delete_articles: deleteArticles
      };

      const response = await api.delete(`/admin/news-moderation/categories/${categoryId}`, { data: payload });
      if (response.data?.success !== false) {
        await fetchCategories();
        await fetchNews(); // Refresh news to update category references
        alert('Category deleted successfully!');
      } else {
        throw new Error(response.data?.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting category';
      alert(errorMessage);
    }
  };

  const handleReassignSubmit = async () => {
    if (!deletingCategory) return;

    try {
      const { action, targetCategoryId } = reassignData;
      
      if (action === 'reassign' && !targetCategoryId) {
        alert('Please select a category to reassign articles to.');
        return;
      }

      const confirmMessage = action === 'reassign'
        ? `This will reassign ${deletingCategory.articleCount} articles to the selected category and then delete "${deletingCategory.name}". Continue?`
        : `This will delete "${deletingCategory.name}" and all ${deletingCategory.articleCount} articles in it. This action cannot be undone. Continue?`;

      if (window.confirm(confirmMessage)) {
        await performCategoryDeletion(
          deletingCategory.id,
          action === 'reassign' ? targetCategoryId : null,
          action === 'delete'
        );
        
        setShowReassignModal(false);
        setDeletingCategory(null);
        setReassignData({ targetCategoryId: '', action: 'reassign' });
      }
    } catch (error) {
      console.error('Error in reassign operation:', error);
      alert('Failed to process category deletion. Please try again.');
    }
  };

  const handleCloseModals = () => {
    setShowNewsModal(false);
    setShowCategoryModal(false);
    setShowReassignModal(false);
    setEditingNews(null);
    setEditingCategory(null);
    setDeletingCategory(null);
    setReassignData({ targetCategoryId: '', action: 'reassign' });
  };

  // Bulk operations handlers
  const handleSelectNews = (newsId) => {
    const newSelected = new Set(selectedNews);
    if (newSelected.has(newsId)) {
      newSelected.delete(newsId);
    } else {
      newSelected.add(newsId);
    }
    setSelectedNews(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAllNews = () => {
    if (selectedNews.size === filteredNews.length) {
      setSelectedNews(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedNews(new Set(filteredNews.map(n => n.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedNews.size === 0) return;
    
    const confirmMessage = `Are you sure you want to change status to "${newStatus}" for ${selectedNews.size} news articles?`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/admin/news-moderation/bulk-update', {
          news_ids: Array.from(selectedNews),
          status: newStatus
        });
        
        if (response.data?.success !== false) {
          await fetchNews();
          setSelectedNews(new Set());
          setShowBulkActions(false);
          alert(`${selectedNews.size} articles updated successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk update failed');
        }
      } catch (error) {
        console.error('Error in bulk status update:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk update failed';
        alert(errorMessage);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedNews.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedNews.size} news articles? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/admin/news-moderation/bulk-delete', {
          news_ids: Array.from(selectedNews)
        });
        
        if (response.data?.success !== false) {
          await fetchNews();
          setSelectedNews(new Set());
          setShowBulkActions(false);
          alert(`${selectedNews.size} articles deleted successfully!`);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">News Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage news articles and content</p>
        </div>
        <div className="flex space-x-3">
          <button onClick={handleCreateCategory} className="btn btn-secondary">
            Manage Categories
          </button>
          <button onClick={() => setShowFeaturedModal(true)} className="btn btn-info">
            Manage Featured
          </button>
          <button onClick={() => setShowExportModal(true)} className="btn btn-outline-secondary">
            Export Data
          </button>
          <button onClick={handleCreateNews} className="btn btn-primary">
            Create News Article
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
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
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id.toString()}>
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
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
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

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedNews.size} articles selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkStatusChange('published')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Publish
                </button>
                <button
                  onClick={() => handleBulkStatusChange('draft')}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                >
                  Set as Draft
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedNews(new Set());
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
        {/* Select All Checkbox */}
        {filteredNews.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={selectedNews.size === filteredNews.length && filteredNews.length > 0}
                onChange={handleSelectAllNews}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Select all {filteredNews.length} articles
              </span>
            </label>
          </div>
        )}

        {filteredNews.map((article) => (
          <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedNews.has(article.id)}
                  onChange={() => handleSelectNews(article.id)}
                  className="mt-1 rounded border-gray-300 dark:border-gray-600"
                />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {article.excerpt || article.content?.substring(0, 200) + '...'}
                  </p>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        {article.author?.avatar ? (
                          <img 
                            src={article.author.avatar}
                            alt={article.author.name}
                            className="w-6 h-6 rounded-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<div class="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">?</div>';
                            }}
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">?</div>
                        )}
                        <span>By {article.author?.name || 'Admin'}</span>
                      </div>
                      <span>💬 {article.comments_count || article.comments?.length || 0} comments</span>
                      <span>📅 {article.published_at || article.meta?.published_at ? new Date(article.published_at || article.meta?.published_at).toLocaleDateString() : article.created_at ? new Date(article.created_at).toLocaleDateString() : 'Not published'}</span>
                      {article.reading_time && (
                        <span>🕒 {article.reading_time} min read</span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {article.featured && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 text-xs rounded-full font-medium">
                          ⭐ Featured
                        </span>
                      )}
                      {article.scheduled_at && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded-full font-medium">
                          🕒 Scheduled
                        </span>
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        article.status === 'published' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : article.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      }`}>
                        {article.status || 'draft'}
                      </span>
                    </div>
                  </div>
                  
                  {article.category && (
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Category:</span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-sm rounded">
                        {article.category.name || article.category}
                      </span>
                    </div>
                  )}
                  
                  {article.tags && Array.isArray(article.tags) && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {article.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded">
                          #{tag}
                        </span>
                      ))}
                      {article.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded">
                          +{article.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-2 ml-4">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditNews(article)}
                    className="btn btn-outline-primary text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleFeatured(article.id, article.featured)}
                    className="btn btn-outline-info text-sm"
                  >
                    {article.featured ? 'Unfeature' : 'Feature'}
                  </button>
                  <button className="btn btn-outline-secondary text-sm">
                    View Analytics
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleCommentModeration(article)}
                    className="btn btn-outline-warning text-sm"
                  >
                    Comments ({article.comments_count || article.comments?.length || 0})
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedArticleForComments(article);
                      setShowSchedulingModal(true);
                    }}
                    className="btn btn-outline-info text-sm"
                  >
                    Schedule
                  </button>
                  <button 
                    onClick={() => handleDeleteNews(article.id, article.title)}
                    className="btn btn-outline-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNews.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {news.length === 0 ? 'No News Articles' : 'No Articles Found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {news.length === 0 
              ? 'Get started by creating your first news article.' 
              : 'Try adjusting your filters to find more articles.'}
          </p>
          {news.length === 0 && (
            <button onClick={handleCreateNews} className="btn btn-primary">Create First Article</button>
          )}
        </div>
      )}

      {/* News Modal - Using NewsForm Component */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingNews ? 'Edit Article' : 'Create New Article'}
              </h3>
              <button
                onClick={handleCloseModals}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <NewsForm 
                newsId={editingNews?.id} 
                navigateTo={(path) => {
                  setShowNewsModal(false);
                  fetchNews();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Categories
              </h3>
              <button
                onClick={handleCloseModals}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4 mb-6 max-h-60 overflow-y-auto">
                {categories.map((category) => {
                  const articlesCount = news.filter(article => article.category_id?.toString() === category.id.toString()).length;
                  return (
                    <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {category.name}
                            {articlesCount > 0 && (
                              <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                {articlesCount} articles
                              </span>
                            )}
                          </div>
                          {category.description && (
                            <div className="text-sm text-gray-500">
                              {category.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <form onSubmit={handleSubmitCategory} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData({...categoryFormData, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter category name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData({...categoryFormData, description: e.target.value})}
                    className="form-input"
                    placeholder="Category description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={categoryFormData.color}
                    onChange={(e) => setCategoryFormData({...categoryFormData, color: e.target.value})}
                    className="form-input h-12"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingCategory ? 'Update Category' : 'Add Category'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Article Reassignment Modal */}
      {showReassignModal && deletingCategory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Category: {deletingCategory.name}
              </h3>
              <button
                onClick={handleCloseModals}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</div>
                  <div>
                    <div className="font-medium text-yellow-800 dark:text-yellow-200">
                      This category contains {deletingCategory.articleCount} articles
                    </div>
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      Choose what to do with these articles before deleting the category.
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="reassignAction"
                      value="reassign"
                      checked={reassignData.action === 'reassign'}
                      onChange={(e) => setReassignData({...reassignData, action: e.target.value})}
                      className="text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">Reassign articles</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Move all articles to another category</div>
                    </div>
                  </label>
                </div>
                
                {reassignData.action === 'reassign' && (
                  <div className="ml-6 mt-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Select target category:
                    </label>
                    <select
                      value={reassignData.targetCategoryId}
                      onChange={(e) => setReassignData({...reassignData, targetCategoryId: e.target.value})}
                      className="form-input w-full"
                      required
                    >
                      <option value="">Choose a category...</option>
                      {categories
                        .filter(cat => cat.id !== deletingCategory.id)
                        .map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                      <option value="null">No Category</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="reassignAction"
                      value="delete"
                      checked={reassignData.action === 'delete'}
                      onChange={(e) => setReassignData({...reassignData, action: e.target.value})}
                      className="text-red-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-red-600 dark:text-red-400">Delete all articles</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Permanently delete all {deletingCategory.articleCount} articles (cannot be undone)</div>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReassignSubmit}
                  className={`btn ${reassignData.action === 'delete' ? 'btn-danger' : 'btn-primary'}`}
                >
                  {reassignData.action === 'delete' ? 'Delete Category & Articles' : 'Reassign & Delete Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Data Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Export News Data
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <select
                  value={exportOptions.format}
                  onChange={(e) => setExportOptions({...exportOptions, format: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="csv">CSV (Comma Separated)</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <select
                  value={exportOptions.dateRange}
                  onChange={(e) => setExportOptions({...exportOptions, dateRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="year">Last Year</option>
                </select>
              </div>
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Include Additional Data
                </label>
                
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeComments}
                      onChange={(e) => setExportOptions({...exportOptions, includeComments: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      Include Comments Data
                    </span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={exportOptions.includeAnalytics}
                      onChange={(e) => setExportOptions({...exportOptions, includeAnalytics: e.target.checked})}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-100">
                      Include Analytics (views, engagement)
                    </span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleExportData}
                className="btn btn-primary flex-1"
              >
                Export Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Featured Articles Management Modal */}
      {showFeaturedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Featured Articles Management
              </h3>
              <button
                onClick={() => setShowFeaturedModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Currently Featured ({featuredArticles.length})
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {featuredArticles.map((article) => (
                      <div key={article.id} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          {article.title}
                        </h5>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            {article.created_at ? new Date(article.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                          <button
                            onClick={() => handleToggleFeatured(article.id, true)}
                            className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                    {featuredArticles.length === 0 && (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">⭐</div>
                        <p className="text-gray-500 dark:text-gray-400">No featured articles</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Available to Feature
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {news.filter(article => !article.featured && article.status === 'published').map((article) => (
                      <div key={article.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                          {article.title}
                        </h5>
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600 dark:text-gray-400">
                            <div>{article.created_at ? new Date(article.created_at).toLocaleDateString() : 'Unknown date'}</div>
                            <div>👁️ {articleAnalytics[article.id]?.views || 0} views</div>
                          </div>
                          <button
                            onClick={() => handleToggleFeatured(article.id, false)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            Feature
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comment Moderation Modal */}
      {showCommentModerationModal && selectedArticleForComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Comment Moderation: {selectedArticleForComments.title}
              </h3>
              <button
                onClick={() => setShowCommentModerationModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              {comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {comment.user?.avatar ? (
                              <img 
                                src={comment.user.avatar}
                                alt={comment.user.name}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.innerHTML = '<div class="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 font-bold">?</div>';
                                }}
                            />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white border border-gray-300 flex items-center justify-center text-gray-600 font-bold">?</div>
                            )}
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {comment.user?.name || comment.author || 'Anonymous'}
                              </span>
                              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                {comment.created_at ? new Date(comment.created_at).toLocaleString() : 'Unknown time'}
                              </span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              comment.status === 'approved' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                : comment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            }`}>
                              {comment.status || 'pending'}
                            </span>
                          </div>
                          
                          <div className="text-gray-900 dark:text-white mb-3">
                            {comment.content}
                          </div>
                          
                          {comment.reports && comment.reports.length > 0 && (
                            <div className="text-sm text-orange-600 dark:text-orange-400 mb-2">
                              ⚠️ {comment.reports.length} report(s)
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {comment.status !== 'approved' && (
                            <button
                              onClick={() => handleCommentAction(comment.id, 'approve')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                            >
                              Approve
                            </button>
                          )}
                          {comment.status !== 'rejected' && (
                            <button
                              onClick={() => handleCommentAction(comment.id, 'reject')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                            >
                              Reject
                            </button>
                          )}
                          <button
                            onClick={() => handleCommentAction(comment.id, 'delete')}
                            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Comments
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This article has no comments to moderate.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Article Scheduling Modal */}
      {showSchedulingModal && selectedArticleForComments && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Schedule Article: {selectedArticleForComments.title}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleScheduleArticle(selectedArticleForComments.id, e.target.value);
                    }
                  }}
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="text-blue-600 dark:text-blue-400">ℹ️</div>
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    Scheduled articles will be automatically published at the specified time.
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => {
                  setShowSchedulingModal(false);
                  setSelectedArticleForComments(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminNews;