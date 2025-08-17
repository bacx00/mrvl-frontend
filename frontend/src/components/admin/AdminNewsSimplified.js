import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getNewsFeaturedImageUrl } from '../../utils/imageUtils';
import NewsForm from './NewsForm';

function AdminNewsSimplified({ navigateTo }) {
  const { api } = useAuth();
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'edit', 'create'
  const [editingNews, setEditingNews] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchNews();
    fetchCategories();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/news-moderation');
      const newsData = response?.data?.data || response?.data || [];
      console.log('📰 News data received:', newsData.slice(0, 1)); // Log first article for debugging
      setNews(Array.isArray(newsData) ? newsData : []);
    } catch (err) {
      console.error('Error fetching news:', err);
      setNews([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/news/categories');
      const categoriesData = response?.data?.data || response?.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const handleEdit = (article) => {
    setEditingNews(article);
    setCurrentView('edit');
  };

  const handleCreate = () => {
    setEditingNews(null);
    setCurrentView('create');
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    
    try {
      await api.delete(`/admin/news/${id}`);
      await fetchNews();
      alert('Article deleted successfully');
    } catch (err) {
      alert('Failed to delete article');
    }
  };

  const handleToggleFeatured = async (article) => {
    try {
      const endpoint = article.featured 
        ? `/moderator/news/${article.id}/unfeature` 
        : `/moderator/news/${article.id}/feature`;
      await api.put(endpoint);
      await fetchNews();
    } catch (err) {
      alert('Failed to update featured status');
    }
  };

  const handleTogglePublish = async (article) => {
    try {
      const newStatus = article.status === 'published' ? 'draft' : 'published';
      await api.put(`/admin/news/${article.id}`, { status: newStatus });
      await fetchNews();
    } catch (err) {
      alert('Failed to update publish status');
    }
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setEditingNews(null);
    fetchNews(); // Refresh the list
  };

  // Filter news based on search and category
  const filteredNews = news.filter(article => {
    const matchesSearch = article.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          article.excerpt?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                            article.category === selectedCategory ||
                            article.category?.slug === selectedCategory ||
                            article.category?.id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Show form view - Navigate to the news form page with the article ID
  if (currentView === 'edit') {
    // Navigate to edit form with the news ID
    navigateTo('admin-news-edit', { id: editingNews?.id });
    return null;
  }
  
  if (currentView === 'create') {
    // Navigate to create form
    navigateTo('admin-news-create');
    return null;
  }

  // Show list view
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">News Management</h2>
        
        {/* Simple Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Create Article
          </button>
          
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded flex-1 max-w-xs"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.slug || cat.id} value={cat.slug || cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filteredNews.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No articles found
            </div>
          ) : (
            filteredNews.map(article => {
              console.log('🖼️ Article image data:', {
                id: article.id, 
                featured_image: article.featured_image,
                featured_image_url: article.featured_image_url,
                image: article.image
              });
              return (
              <div key={article.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex gap-4">
                  {/* Article Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={getNewsFeaturedImageUrl(article)}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded"
                      onError={(e) => {
                        console.log('🖼️ Image failed to load:', e.target.src);
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjQ4IiB5PSI1OCIgZm9udC1mYW1pbHk9InN5c3RlbS11aSIgZm9udC1zaXplPSIzMiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiM2QjcyODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPj88L3RleHQ+Cjwvc3ZnPg==';
                      }}
                      onLoad={() => {
                        console.log('🖼️ Image loaded successfully:', getNewsFeaturedImageUrl(article));
                      }}
                    />
                  </div>
                  
                  {/* Article Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-lg font-semibold">
                          {article.title}
                          {article.featured && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Featured
                            </span>
                          )}
                          <span className={`ml-2 text-xs px-2 py-1 rounded ${
                            article.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {article.status}
                          </span>
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {article.excerpt || 'No excerpt'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Article Meta */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <span>Category: {
                        typeof article.category === 'string' 
                          ? article.category 
                          : article.category?.name || 'Uncategorized'
                      }</span>
                      <span>Views: {article.views || 0}</span>
                      <span>Comments: {article.comments_count || 0}</span>
                      <span>
                        Published: {article.published_at 
                          ? new Date(article.published_at).toLocaleDateString() 
                          : 'Not published'}
                      </span>
                    </div>
                    
                    {/* Simple Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(article)}
                        className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      
                      <button
                        onClick={() => handleTogglePublish(article)}
                        className={`px-3 py-1 text-white text-sm rounded ${
                          article.status === 'published'
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                      >
                        {article.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      
                      <button
                        onClick={() => handleToggleFeatured(article)}
                        className={`px-3 py-1 text-white text-sm rounded ${
                          article.featured
                            ? 'bg-gray-600 hover:bg-gray-700'
                            : 'bg-yellow-600 hover:bg-yellow-700'
                        }`}
                      >
                        {article.featured ? 'Unfeature' : 'Feature'}
                      </button>
                      
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default AdminNewsSimplified;