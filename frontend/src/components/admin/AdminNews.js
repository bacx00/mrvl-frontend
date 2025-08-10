import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks';

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
    published_at: ''
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

  const fetchNews = async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/news-moderation?page=${page}&limit=${limit}`);
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
      const response = await api.get('/api/admin/news-moderation/categories');
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
      published_at: article.published_at || ''
    });
    setShowNewsModal(true);
  };

  const handleSubmitNews = async (e) => {
    e.preventDefault();
    
    if (!newsFormData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    try {
      const submitData = {
        ...newsFormData,
        tags: newsFormData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      if (editingNews) {
        const response = await api.put(`/api/admin/news-moderation/${editingNews.id}`, submitData);
        if (response.data?.success !== false) {
          alert('News updated successfully!');
        } else {
          throw new Error(response.data?.message || 'Update failed');
        }
      } else {
        const response = await api.post('/api/admin/news-moderation', submitData);
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
      const errorMessage = error.response?.data?.message || error.message || `Error ${editingNews ? 'updating' : 'creating'} news`;
      alert(errorMessage);
    }
  };

  const handleDeleteNews = async (newsId, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        const response = await api.delete(`/api/admin/news-moderation/${newsId}`);
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
        const response = await api.put(`/api/admin/news-moderation/categories/${editingCategory.id}`, categoryFormData);
        if (response.data?.success !== false) {
          alert('Category updated successfully!');
        } else {
          throw new Error(response.data?.message || 'Update failed');
        }
      } else {
        const response = await api.post('/api/admin/news-moderation/categories', categoryFormData);
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
    if (window.confirm(`Are you sure you want to delete category "${categoryName}"? This will affect all news in this category.`)) {
      try {
        const response = await api.delete(`/api/admin/news-moderation/categories/${categoryId}`);
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
    }
  };

  const handleCloseModals = () => {
    setShowNewsModal(false);
    setShowCategoryModal(false);
    setEditingNews(null);
    setEditingCategory(null);
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
        const response = await api.post('/api/admin/news-moderation/bulk-update', {
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
        const response = await api.post('/api/admin/news-moderation/bulk-delete', {
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
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>By {article.author?.name || 'Admin'}</span>
                    <span>{article.created_at ? new Date(article.created_at).toLocaleDateString() : 'Unknown date'}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      article.status === 'published' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {article.status || 'draft'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button 
                  onClick={() => handleEditNews(article)}
                  className="btn btn-outline-primary text-sm"
                >
                  Edit
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

      {/* News Modal */}
      {showNewsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingNews ? 'Edit Article' : 'Create New Article'}
              </h3>
              <button
                onClick={handleCloseModals}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmitNews} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newsFormData.title}
                    onChange={(e) => setNewsFormData({...newsFormData, title: e.target.value})}
                    className="form-input"
                    placeholder="Enter article title"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newsFormData.category_id || ''}
                    onChange={(e) => setNewsFormData({...newsFormData, category_id: e.target.value || null})}
                    className="form-input"
                  >
                    <option value="">No Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={newsFormData.status}
                    onChange={(e) => setNewsFormData({...newsFormData, status: e.target.value})}
                    className="form-input"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Excerpt
                  </label>
                  <textarea
                    value={newsFormData.excerpt}
                    onChange={(e) => setNewsFormData({...newsFormData, excerpt: e.target.value})}
                    className="form-input"
                    rows="3"
                    placeholder="Brief summary of the article..."
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content *
                  </label>
                  <textarea
                    required
                    value={newsFormData.content}
                    onChange={(e) => setNewsFormData({...newsFormData, content: e.target.value})}
                    className="form-input"
                    rows="10"
                    placeholder="Article content..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={newsFormData.tags}
                    onChange={(e) => setNewsFormData({...newsFormData, tags: e.target.value})}
                    className="form-input"
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Author
                  </label>
                  <input
                    type="text"
                    value={newsFormData.author}
                    onChange={(e) => setNewsFormData({...newsFormData, author: e.target.value})}
                    className="form-input"
                    placeholder="Author name"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingNews ? 'Update Article' : 'Create Article'}
                </button>
              </div>
            </form>
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
                {categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {category.name}
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
                ))}
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
    </div>
  );
}

export default AdminNews;