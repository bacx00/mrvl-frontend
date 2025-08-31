import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getNewsFeaturedImageUrl } from '../../utils/imageUtils';
import LazyImageOptimized from '../shared/LazyImageOptimized';
import { trackNewsSearch, trackNewsView } from '../../utils/analyticsUtils';

function NewsPage({ navigateTo }) {
  const { isAdmin, isModerator, api, user } = useAuth();
  const [news, setNews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('latest');

  const fetchNews = useCallback(async () => {
    try {
      // Fetch news and categories in parallel
      const [newsResponse, categoriesResponse] = await Promise.all([
        api.get(`/public/news?category=${selectedCategory}&sort=${sortBy}`),
        api.get('/public/news/categories')
      ]);
      
      const newsData = newsResponse.data?.data || newsResponse.data || [];
      const categoriesData = categoriesResponse.data?.data || categoriesResponse.data || [];
      
      console.log('✅ News data loaded:', newsData.length, 'articles');
      console.log('✅ Categories loaded:', categoriesData.length, 'categories');
      
      setNews(newsData);
      setCategories(categoriesData);
      
      // Track news search/filter if filters are applied
      if (selectedCategory !== 'all' || sortBy !== 'latest') {
        trackNewsSearch('', { category: selectedCategory, sort: sortBy }, newsData.length);
      }
    } catch (error) {
      console.error('❌ NewsPage: Backend API failed:', error.message);
      setNews([]);
      setCategories([]);
    }
  }, [api, selectedCategory, sortBy]);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, sortBy, fetchNews]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleFeatureNews = async (newsId, shouldFeature) => {
    try {
      const endpoint = shouldFeature ? `/moderator/news/${newsId}/feature` : `/moderator/news/${newsId}/unfeature`;
      await api.put(endpoint);
      // Refresh news
      fetchNews();
    } catch (error) {
      console.error('Error featuring/unfeaturing news:', error);
      alert('Failed to ' + (shouldFeature ? 'feature' : 'unfeature') + ' news article');
    }
  };

  const handleDeleteNews = async (newsId) => {
    if (window.confirm('Are you sure you want to delete this news article? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/news/${newsId}`);
        // Refresh news
        fetchNews();
      } catch (error) {
        console.error('Error deleting news:', error);
        alert('Failed to delete news article');
      }
    }
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return formatDate(dateString);
  };

  const getSortIcon = (type) => {
    if (sortBy === type) {
      return <span className="text-red-600 dark:text-red-400">▼</span>;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header - VLR.gg Style */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">News</h1>
        {(isAdmin() || isModerator()) && (
          <div className="flex space-x-2">
            <button 
              onClick={() => navigateTo && navigateTo('admin-news-categories')}
              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
            >
              Manage Categories
            </button>
            <button 
              onClick={() => navigateTo && navigateTo('admin-news-create')}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
            >
              Create News
            </button>
          </div>
        )}
      </div>

      {/* Filters and Sorting - VLR.gg Style */}
      <div className="card p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
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
                  {typeof category.icon === 'string' ? category.icon : '📰'} {typeof category.name === 'string' ? category.name : 'Unknown Category'}
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
              onClick={() => setSortBy('trending')}
              className={`text-sm font-medium transition-colors ${
                sortBy === 'trending' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              Trending {getSortIcon('trending')}
            </button>
          </div>
        </div>
      </div>

      {/* News List - VLR.gg Clean Style */}
      {news.length > 0 ? (
        <div className="space-y-2">
          {news.map((article, index) => (
            <div 
              key={article.id}
              className="card p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer border-l-4 border-transparent hover:border-red-600"
              onClick={() => {
                if (navigateTo) {
                  // Track news view from listing page
                  trackNewsView(article, 'listing');
                  navigateTo('news-detail', { id: String(article.id || '') });
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Article Header */}
                  <div className="flex items-center space-x-3 mb-2">
                    {/* Category Badge */}
                    {article.category && (
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded-full text-white"
                        style={{ 
                          backgroundColor: categories.find(c => c.slug === article.category_slug)?.color || '#6b7280' 
                        }}
                      >
                        {typeof categories.find(c => c.slug === article.category_slug)?.icon === 'string' 
                          ? categories.find(c => c.slug === article.category_slug).icon 
                          : '📰'} {article.category?.name || categories.find(c => c.slug === article.category_slug)?.name || 'News'}
                      </span>
                    )}
                    
                    {/* Featured Badge */}
                    {article.featured && (
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-yellow-500 text-white">
                        FEATURED
                      </span>
                    )}
                    
                    {/* Region */}
                    <span className="text-xs text-gray-500 dark:text-gray-500">
                      {article.region || 'INTL'}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                    {article.title}
                  </h2>

                  {/* Excerpt */}
                  {article.excerpt && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {article.excerpt}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                    <span>by {article.author?.name || 'MRVL Team'}</span>
                    <span>{getTimeAgo(article.published_at || article.created_at)}</span>
                    
                    {/* Engagement Stats */}
                    <div className="flex items-center space-x-3">
                      {/* View count hidden per user request */}
                      
                      {article.comments_count > 0 && (
                        <span className="flex items-center space-x-1">
                          <span>💬</span>
                          <span>{article.comments_count}</span>
                        </span>
                      )}
                      
                      {(article.upvotes > 0 || article.downvotes > 0) && (
                        <span className="flex items-center space-x-1">
                          <span className="text-green-600">↑{article.upvotes}</span>
                          <span className="text-red-600">↓{article.downvotes}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Moderation Actions */}
                  {(isAdmin() || isModerator()) && (
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeatureNews(article.id, !article.featured);
                        }}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          article.featured 
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/30' 
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {article.featured ? '⭐ Unfeature' : '⭐ Feature'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo && navigateTo('admin-news-edit', { id: String(article.id || '') });
                        }}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNews(article.id);
                        }}
                        className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>

                {/* Thumbnail - always show, using placeholder if needed */}
                <div className="ml-4 flex-shrink-0">
                  <img
                    src={getNewsFeaturedImageUrl(article)} 
                    alt={article.title}
                    className="w-20 h-20 object-cover rounded bg-gray-100 dark:bg-gray-700"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://staging.mrvl.net/images/news-placeholder.svg';
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No News Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {selectedCategory !== 'all' 
              ? `No news articles found in the selected category.`
              : 'No news articles available at the moment.'}
          </p>
          <button
            onClick={() => setSelectedCategory('all')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            View All News
          </button>
        </div>
      )}

      {/* Pagination (if needed) */}
      {news.length > 0 && (
        <div className="mt-8 flex justify-center">
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Showing {news.length} articles
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsPage;