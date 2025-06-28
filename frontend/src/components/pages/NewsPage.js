import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';

function NewsPage({ navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Country flag helper function
  const getCountryFlag = (countryCode) => {
    const flagMap = {
      'US': '🇺🇸',
      'CA': '🇨🇦',
      'UK': '🇬🇧',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'SE': '🇸🇪',
      'KR': '🇰🇷',
      'AU': '🇦🇺',
      'BR': '🇧🇷',
      'JP': '🇯🇵',
      'INTL': '🌍'
    };
    return flagMap[countryCode] || '🌍';
  };

  const fetchNews = useCallback(async () => {
    setLoading(true);
    
    try {
      const response = await api.get('/news');
      const newsData = response.data || response || [];
      
      console.log('✅ News data loaded:', newsData.length, 'articles');
      
      // Filter by category
      const filteredNews = selectedCategory === 'all' 
        ? newsData 
        : newsData.filter(article => article.category === selectedCategory);
      
      setNews(filteredNews);
    } catch (error) {
      console.error('❌ NewsPage: Backend API failed, NO MOCK DATA FALLBACK:', error.message);
      setNews([]); // ✅ NO MOCK DATA - Show empty state instead
    } finally {
      setLoading(false);
    }
  }, [api, selectedCategory]);

  useEffect(() => {
    fetchNews();
  }, [selectedCategory, fetchNews]);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'updates': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'balance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'esports': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'content': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'analysis': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'community': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const categories = ['all', 'updates', 'balance', 'esports', 'content', 'analysis', 'community'];
  const featuredNews = news.filter(article => article.featured);
  const regularNews = news.filter(article => !article.featured);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading news...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">News</h1>
        {(isAdmin() || isModerator()) && (
          <button 
            onClick={() => navigateTo && navigateTo('admin-news-create')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Create News
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              {category === 'all' ? 'All News' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Featured News */}
      {featuredNews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Featured</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {featuredNews.map((article) => (
              <div 
                key={article.id} 
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigateTo && navigateTo('news-detail', { id: article.id })}
              >
                {(article.featured_image_url || article.image) && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={article.featured_image_url || article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    {/* Region flag */}
                    <span className="text-lg">{getCountryFlag(article.region)}</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getCategoryColor(article.category)}`}>
                      {(article.category || 'news').toUpperCase()}
                    </span>
                    <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                      FEATURED
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                    {article.title}
                  </h3>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-500">
                    <div className="flex items-center space-x-3">
                      <span>{article.author?.name || 'MRVL Team'}</span>
                      {article.views && <span>👁 {article.views.toLocaleString()}</span>}
                      {article.comments_count && <span>💬 {article.comments_count}</span>}
                    </div>
                    <span>{formatDate(article.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Regular News */}
      {regularNews.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest News</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularNews.map((article) => (
              <div 
                key={article.id} 
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigateTo && navigateTo('news-detail', { id: article.id })}
              >
                {(article.featured_image_url || article.image) && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={article.featured_image_url || article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    {/* Region flag */}
                    <span className="text-lg">{getCountryFlag(article.region)}</span>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getCategoryColor(article.category)}`}>
                      {(article.category || 'news').toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>{article.author?.name || 'MRVL Team'}</span>
                    </div>
                    <span>{formatDate(article.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {news.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No News Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {selectedCategory !== 'all' 
              ? `No news articles found in the "${selectedCategory}" category.`
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
    </div>
  );
}

export default NewsPage;