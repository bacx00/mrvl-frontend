import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { showSuccessToast, showErrorToast } from '../../utils/toastUtils';

function NewsOptimizationDashboard({ navigateTo }) {
  const { api, user, isAdmin } = useAuth();
  const [optimizationStatus, setOptimizationStatus] = useState({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [scheduledNews, setScheduledNews] = useState([]);

  useEffect(() => {
    if (!isAdmin()) {
      navigateTo && navigateTo('home');
      return;
    }
    
    fetchAnalytics();
    fetchScheduledNews();
  }, [isAdmin, navigateTo]);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/news/analytics');
      setAnalytics(response.data?.data || response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchScheduledNews = async () => {
    try {
      const response = await api.get('/admin/news?status=scheduled');
      const newsData = response.data?.data || response.data || [];
      setScheduledNews(Array.isArray(newsData) ? newsData : []);
    } catch (error) {
      console.error('Error fetching scheduled news:', error);
      setScheduledNews([]);
    }
  };

  const runOptimization = async (type) => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    
    try {
      let endpoint;
      let message;
      
      switch (type) {
        case 'images':
          endpoint = '/admin/news/optimize-images';
          message = 'Image optimization';
          break;
        case 'seo':
          endpoint = '/admin/news/optimize-seo';
          message = 'SEO optimization';
          break;
        case 'excerpts':
          endpoint = '/admin/news/enhance-excerpts';
          message = 'Excerpt enhancement';
          break;
        case 'comprehensive':
          endpoint = '/admin/news/optimize-comprehensive';
          message = 'Comprehensive optimization';
          break;
        default:
          throw new Error('Unknown optimization type');
      }
      
      const response = await api.post(endpoint);
      const result = response.data?.data || response.data;
      
      setOptimizationStatus(prev => ({
        ...prev,
        [type]: {
          status: 'success',
          result,
          timestamp: new Date().toISOString()
        }
      }));
      
      showSuccessToast(`${message} completed successfully!`);
      
      // Refresh analytics after optimization
      await fetchAnalytics();
      
    } catch (error) {
      console.error(`Error running ${type} optimization:`, error);
      
      setOptimizationStatus(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          error: error.response?.data?.message || error.message,
          timestamp: new Date().toISOString()
        }
      }));
      
      showErrorToast(`${message} failed: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const processScheduledNews = async () => {
    if (isOptimizing) return;
    
    setIsOptimizing(true);
    
    try {
      const response = await api.post('/admin/news/process-scheduled');
      const result = response.data?.data || response.data;
      
      showSuccessToast(`Processed ${result.published_count || 0} scheduled articles`);
      
      // Refresh scheduled news list
      await fetchScheduledNews();
      await fetchAnalytics();
      
    } catch (error) {
      console.error('Error processing scheduled news:', error);
      showErrorToast(`Failed to process scheduled news: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 dark:text-green-400';
      case 'error': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  if (!isAdmin()) {
    return (
      <div className="card p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400">
          You need administrator privileges to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          News Optimization Dashboard
        </h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Admin: {user?.name}
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📊 News Analytics Overview
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{analytics.total_articles || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Articles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.total_views || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{analytics.total_comments || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Comments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.recent_activity?.articles_today || 0}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Today's Articles</div>
            </div>
          </div>
        </div>
      )}

      {/* Scheduled News */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            ⏰ Scheduled News ({scheduledNews.length})
          </h2>
          <button
            onClick={processScheduledNews}
            disabled={isOptimizing}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isOptimizing ? 'Processing...' : 'Process Now'}
          </button>
        </div>
        
        {scheduledNews.length > 0 ? (
          <div className="space-y-2">
            {scheduledNews.slice(0, 5).map(article => (
              <div key={article.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{article.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Scheduled: {new Date(article.scheduled_at || article.published_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => navigateTo && navigateTo('admin-news-edit', { id: String(article.id) })}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            ))}
            {scheduledNews.length > 5 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-2">
                And {scheduledNews.length - 5} more...
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-4">
            No scheduled articles
          </div>
        )}
      </div>

      {/* Optimization Tools */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🔧 Optimization Tools
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Optimization */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">🖼️ Image Optimization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Fix broken image URLs and optimize image loading for homepage cards.
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => runOptimization('images')}
                disabled={isOptimizing}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isOptimizing ? 'Running...' : 'Optimize Images'}
              </button>
              {optimizationStatus.images && (
                <div className={`text-sm ${getStatusColor(optimizationStatus.images.status)}`}>
                  {getStatusIcon(optimizationStatus.images.status)} 
                  {formatTimestamp(optimizationStatus.images.timestamp)}
                </div>
              )}
            </div>
          </div>

          {/* SEO Optimization */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">🔍 SEO Optimization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Generate optimized meta tags, descriptions, and keywords for all articles.
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => runOptimization('seo')}
                disabled={isOptimizing}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isOptimizing ? 'Running...' : 'Optimize SEO'}
              </button>
              {optimizationStatus.seo && (
                <div className={`text-sm ${getStatusColor(optimizationStatus.seo.status)}`}>
                  {getStatusIcon(optimizationStatus.seo.status)} 
                  {formatTimestamp(optimizationStatus.seo.timestamp)}
                </div>
              )}
            </div>
          </div>

          {/* Excerpt Enhancement */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">📝 Excerpt Enhancement</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Generate optimized excerpts for articles that are missing them.
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => runOptimization('excerpts')}
                disabled={isOptimizing}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isOptimizing ? 'Running...' : 'Enhance Excerpts'}
              </button>
              {optimizationStatus.excerpts && (
                <div className={`text-sm ${getStatusColor(optimizationStatus.excerpts.status)}`}>
                  {getStatusIcon(optimizationStatus.excerpts.status)} 
                  {formatTimestamp(optimizationStatus.excerpts.timestamp)}
                </div>
              )}
            </div>
          </div>

          {/* Comprehensive Optimization */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">🚀 Comprehensive Optimization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Run all optimizations including search indexing and performance improvements.
            </p>
            <div className="flex items-center justify-between">
              <button
                onClick={() => runOptimization('comprehensive')}
                disabled={isOptimizing}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isOptimizing ? 'Running...' : 'Run All Optimizations'}
              </button>
              {optimizationStatus.comprehensive && (
                <div className={`text-sm ${getStatusColor(optimizationStatus.comprehensive.status)}`}>
                  {getStatusIcon(optimizationStatus.comprehensive.status)} 
                  {formatTimestamp(optimizationStatus.comprehensive.timestamp)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Optimization Results */}
      {Object.keys(optimizationStatus).length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            📈 Recent Optimization Results
          </h2>
          <div className="space-y-3">
            {Object.entries(optimizationStatus).map(([type, status]) => (
              <div key={type} className="border border-gray-200 dark:border-gray-700 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900 dark:text-white capitalize">{type}</span>
                  <span className={`text-sm ${getStatusColor(status.status)}`}>
                    {getStatusIcon(status.status)} {status.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatTimestamp(status.timestamp)}
                </div>
                {status.result && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {JSON.stringify(status.result, null, 2)}
                  </div>
                )}
                {status.error && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    Error: {status.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default NewsOptimizationDashboard;