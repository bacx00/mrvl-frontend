import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getNewsFeaturedImageUrl } from '../../utils/imageUtils';

function NewsDetailPage({ params, navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]);

  const fetchArticle = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('🔍 NewsDetailPage: Fetching article with ID:', params.id);
      
      // ✅ FIXED: ONLY USE REAL BACKEND DATA - PROPER ERROR HANDLING
      const response = await api.get(`/news/${params.id}`);
      
      // Handle Laravel API response structure properly
      const articleData = response?.data?.data || response?.data || response;
      
      if (articleData && articleData.id) {
        console.log('✅ NewsDetailPage: Real article loaded:', articleData);
        setArticle(articleData);
        
        // Fetch related articles
        try {
          const relatedResponse = await api.get('/news');
          const allNews = relatedResponse?.data?.data || relatedResponse?.data || relatedResponse || [];
          
          // Filter out current article and take 3 related ones
          const related = allNews
            .filter(news => news.id !== articleData.id)
            .slice(0, 3);
          setRelatedNews(related);
          console.log('✅ NewsDetailPage: Related articles loaded:', related.length);
        } catch (relatedError) {
          console.warn('Could not fetch related articles:', relatedError);
          setRelatedNews([]);
        }
      } else {
        console.warn('⚠️ NewsDetailPage: Article data structure invalid:', articleData);
        setArticle(null);
      }
      
    } catch (error) {
      console.error('❌ NewsDetailPage: Backend API failed:', error.message);
      
      // ✅ IMPROVED: Check if it's a 404 or server issue
      if (error.message.includes('404') || error.message.includes('No query results')) {
        console.log('📰 NewsDetailPage: Article not found (404) - this is normal for non-existent articles');
      } else {
        console.error('🚨 NewsDetailPage: Server error:', error);
      }
      
      setArticle(null); // ✅ NO MOCK DATA - Show proper not found message
    } finally {
      setLoading(false);
    }
  }, [api, params.id]);

  useEffect(() => {
    if (params.id) {
      fetchArticle();
    }
  }, [fetchArticle]);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tournaments': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'updates': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'balance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'esports': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'content': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'community': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">Loading article...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Article not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The news article you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigateTo && navigateTo('news')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            ← Back to News
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateTo && navigateTo('news')}
          className="text-red-600 dark:text-red-400 hover:underline text-sm"
        >
          ← Back to News
        </button>
        
        {/* Admin/Moderator Actions */}
        {(isAdmin() || isModerator()) && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigateTo && navigateTo('admin-news-edit', { id: article.id })}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              ✏️ Edit
            </button>
            <button 
              onClick={() => navigateTo && navigateTo('admin-news-create')}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              ➕ New Article
            </button>
          </div>
        )}
      </div>

      {/* Article Header */}
      <article className="mb-8">
        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="aspect-video overflow-hidden rounded-lg mb-6">
            <img 
              src={getNewsFeaturedImageUrl(article)} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Meta */}
        <div className="flex items-center space-x-3 mb-4">
          <span className={`px-3 py-1 text-sm font-bold rounded ${getCategoryColor(article.category)}`}>
            {(article.category || 'news').toUpperCase()}
          </span>
          
          {article.featured && (
            <span className="px-3 py-1 text-sm font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              ⭐ FEATURED
            </span>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {formatDate(article.published_at || article.created_at)}
          </div>
        </div>

        {/* Article Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {article.title}
        </h1>

        {/* Article Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-500 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span>{article.author?.avatar || '👤'}</span>
            <span>By {article.author?.name || 'MRVL Team'}</span>
          </div>
          
          {article.views && (
            <div className="flex items-center space-x-1">
              <span>👁</span>
              <span>{article.views.toLocaleString()} views</span>
            </div>
          )}
          
          {article.comments_count && (
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{article.comments_count} comments</span>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedNews.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Related Articles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedNews.map((relatedArticle) => (
              <div 
                key={relatedArticle.id} 
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  console.log('🔗 NewsDetailPage: Clicking related article with ID:', relatedArticle.id);
                  navigateTo && navigateTo('news-detail', { id: relatedArticle.id });
                }}
              >
                {relatedArticle.featured_image_url && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={relatedArticle.featured_image_url} 
                      alt={relatedArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getCategoryColor(relatedArticle.category)}`}>
                      {(relatedArticle.category || 'news').toUpperCase()}
                    </span>
                  </div>
                  
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                    {relatedArticle.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {relatedArticle.excerpt}
                  </p>

                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(relatedArticle.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back to News Button */}
      <div className="mt-12 text-center">
        <button
          onClick={() => navigateTo && navigateTo('news')}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          ← Back to All News
        </button>
      </div>
    </div>
  );
}

export default NewsDetailPage;