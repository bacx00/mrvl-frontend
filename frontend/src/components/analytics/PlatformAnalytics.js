import React, { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';

const PlatformAnalytics = ({ className = '' }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics data from the backend
      const response = await apiGet(`admin/analytics?period=${timeRange}`);
      setAnalyticsData(response.data || response);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('Failed to load analytics data');
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (value) => {
    return typeof value === 'number' ? `${value.toFixed(1)}%` : '0%';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-red-600 dark:text-red-400 mb-2">Analytics Error</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{error}</p>
            <button 
              onClick={fetchAnalyticsData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const userActivity = analyticsData?.user_activity || {};
  const contentActivity = analyticsData?.content_activity || {};
  const engagement = analyticsData?.engagement || {};
  const platformHealth = analyticsData?.platform_health || {};

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive platform performance metrics</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* User Activity Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(userActivity.total_users)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-green-500 text-sm font-medium">
                +{formatNumber(userActivity.new_users)}
              </span>
              <span className="text-gray-500 text-sm ml-1">new users</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">🟢</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(userActivity.active_users)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-blue-500 text-sm font-medium">
                {formatPercentage(userActivity.user_retention_rate)}
              </span>
              <span className="text-gray-500 text-sm ml-1">retention</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Page Views</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(engagement.page_views)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-gray-500 text-sm">
                {formatPercentage(engagement.bounce_rate)} bounce rate
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Session</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {engagement.avg_session_duration || 'N/A'}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center">
              <span className="text-green-500 text-sm">
                Daily: {formatNumber(userActivity.daily_active_users)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Activity</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">New Forum Threads</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(contentActivity.new_threads)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">New Matches</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(contentActivity.new_matches)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">New Events</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(contentActivity.new_events)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(contentActivity.total_posts)}
              </span>
            </div>
            <div className="border-t pt-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Engagement Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPercentage(contentActivity.content_engagement_rate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">System Uptime</span>
              <span className="text-lg font-semibold text-green-600">
                {platformHealth.system_uptime || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">API Response Time</span>
              <span className="text-lg font-semibold text-blue-600">
                {platformHealth.api_response_time || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Sessions</span>
              <span className="text-lg font-semibold text-purple-600">
                {formatNumber(platformHealth.active_sessions)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
              <span className="text-lg font-semibold text-green-600">
                {platformHealth.cache_hit_rate || 'N/A'}
              </span>
            </div>
            <div className="border-t pt-2 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Error Rate</span>
                <span className={`text-lg font-semibold ${
                  (platformHealth.error_rate && platformHealth.error_rate !== 'N/A') 
                    ? 'text-yellow-600' 
                    : 'text-green-600'
                }`}>
                  {platformHealth.error_rate || '0.0%'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Content Creators */}
      {contentActivity.top_content_creators && contentActivity.top_content_creators.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Content Creators</h3>
          <div className="space-y-3">
            {contentActivity.top_content_creators.slice(0, 5).map((creator, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                    {creator.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">{creator.name}</span>
                </div>
                <span className="text-blue-600 font-semibold">{creator.thread_count} threads</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Growth Trend (if available) */}
      {userActivity.user_growth_trend && userActivity.user_growth_trend.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth Trend</h3>
          <div className="h-48 flex items-end justify-between space-x-1">
            {userActivity.user_growth_trend.slice(-14).map((day, index) => {
              const maxUsers = Math.max(...userActivity.user_growth_trend.map(d => d.new_users));
              const height = maxUsers > 0 ? (day.new_users / maxUsers) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t min-h-1"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${day.date}: ${day.new_users} new users`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformAnalytics;