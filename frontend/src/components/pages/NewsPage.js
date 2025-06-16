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
      console.warn('❌ News API failed, using mock data:', error.message);
      
      // FIXED: Enhanced fallback mock data with country flags
      const mockNewsData = [
        {
          id: 1,
          title: 'Marvel Rivals Season 1 Battle Pass Now Live',
          excerpt: 'The highly anticipated Season 1 Battle Pass is now available featuring new heroes, skins, and exclusive rewards.',
          content: 'Marvel Rivals has officially launched its Season 1 Battle Pass, bringing a wealth of new content to players worldwide...',
          category: 'updates',
          region: 'INTL',
          author: { name: 'Marvel Dev Team', avatar: null },
          featured_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=400&fit=crop',
          views: 15420,
          comments_count: 89,
          created_at: '2025-01-26T10:00:00Z',
          featured: true
        },
        {
          id: 2,
          title: 'Balance Changes Coming to Iron Man and Spider-Man',
          excerpt: 'Developer insights on upcoming hero adjustments and the reasoning behind the changes.',
          content: 'Following extensive community feedback and data analysis, we are implementing targeted balance changes...',
          category: 'balance',
          region: 'US',
          author: { name: 'Game Design Team', avatar: null },
          featured_image_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=800&h=400&fit=crop',
          views: 8934,
          comments_count: 156,
          created_at: '2025-01-25T15:30:00Z',
          featured: false
        },
        {
          id: 3,
          title: 'Team Stark Industries Wins Championship Finals',
          excerpt: 'In a thrilling 5-map series, Team Stark Industries claims the Marvel Rivals Championship title.',
          content: 'The grand finals of the Marvel Rivals World Championship concluded with an epic showdown...',
          category: 'esports',
          region: 'US',
          author: { name: 'Esports Team', avatar: null },
          featured_image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=400&fit=crop',
          views: 12456,
          comments_count: 234,
          created_at: '2025-01-24T20:00:00Z',
          featured: true
        },
        {
          id: 4,
          title: 'New Map: Asgard Throne Room - Developer Walkthrough',
          excerpt: 'Take a behind-the-scenes look at the creation of our newest competitive map.',
          content: 'The design team takes us through the development process of Asgard Throne Room...',
          category: 'content',
          region: 'SE',
          author: { name: 'Level Design Team', avatar: null },
          featured_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=400&fit=crop',
          views: 6789,
          comments_count: 67,
          created_at: '2025-01-23T14:20:00Z',
          featured: false
        },
        {
          id: 5,
          title: 'EU Regional Championship Schedule Announced',
          excerpt: 'European teams prepare for the biggest tournament of the season.',
          content: 'The European Regional Championship will feature 16 top teams competing for glory...',
          category: 'esports',
          region: 'DE',
          author: { name: 'Tournament Operations', avatar: null },
          featured_image_url: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800&h=400&fit=crop',
          views: 5432,
          comments_count: 78,
          created_at: '2025-01-22T12:00:00Z',
          featured: false
        },
        {
          id: 6,
          title: 'Korean Domination: APAC Meta Analysis',
          excerpt: 'Breaking down the strategies that made Korean teams so successful this season.',
          content: 'Korean teams have been dominating the APAC region with innovative strategies...',
          category: 'analysis',
          region: 'KR',
          author: { name: 'Strategy Analyst', avatar: null },
          featured_image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=400&fit=crop',
          views: 7890,
          comments_count: 123,
          created_at: '2025-01-21T16:45:00Z',
          featured: false
        }
      ];

      // Filter mock data by category
      const filteredMockNews = selectedCategory === 'all' 
        ? mockNewsData 
        : mockNewsData.filter(article => article.category === selectedCategory);
      
      setNews(filteredMockNews);
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
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    {/* FIXED: Added region flag */}
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
                  {/* FIXED: Added region flag */}
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