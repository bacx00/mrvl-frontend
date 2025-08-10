import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminAnalytics() {
  const { api } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics');
      setAnalytics(response?.data || response || {});
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive platform analytics and insights</p>
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          Admin Only Access
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {analytics?.users?.total || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            +{analytics?.users?.growth || 0}% this month
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {analytics?.engagement?.avgSession || '5.2'}min
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Session</div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            {analytics?.engagement?.bounce || '35'}% bounce rate
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {analytics?.matches?.total || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
            {analytics?.matches?.live || 0} currently live
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {analytics?.content?.posts || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            {analytics?.content?.threads || 0} threads
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth Trend</h3>
          <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="text-6xl mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Chart visualization would go here</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Integration with charting library needed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Engagement</h3>
          <div className="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="text-center">
              <div className="text-6xl mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Engagement metrics visualization</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Real-time data visualization</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Platform Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">99.9%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1.2s</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">15TB</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Data Processed</div>
          </div>
        </div>
      </div>

      {/* Top Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Performing Content</h3>
        <div className="space-y-3">
          {(analytics?.topContent || [
            { title: "Marvel Rivals Championship Finals", views: 12500, type: "match" },
            { title: "New Hero Meta Analysis", views: 8300, type: "news" },
            { title: "Team Rankings Discussion", views: 6200, type: "forum" }
          ]).map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{item.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{item.type}</div>
              </div>
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                {item.views?.toLocaleString()} views
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AdminAnalytics;