import React, { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';

const UserGrowthAnalytics = ({ className = '' }) => {
  const [userGrowthData, setUserGrowthData] = useState(null);
  const [retentionData, setRetentionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchUserGrowthAnalytics();
  }, [timeRange]);

  const fetchUserGrowthAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user growth and retention analytics
      const [analyticsResponse, statsResponse] = await Promise.all([
        apiGet(`admin/analytics?period=${timeRange}`),
        apiGet('admin/stats')
      ]);

      const analytics = analyticsResponse.data || analyticsResponse;
      const stats = statsResponse.data || statsResponse;

      // Process user growth data
      const userActivity = analytics.user_activity || {};
      const communityInsights = analytics.community_insights || {};
      const overview = stats.overview || {};

      setUserGrowthData({
        userActivity,
        communityInsights,
        overview
      });

      // Process retention data
      setRetentionData({
        retentionRate: userActivity.user_retention_rate || 0,
        dailyActive: userActivity.daily_active_users || 0,
        weeklyActive: userActivity.weekly_active_users || 0,
        monthlyActive: userActivity.monthly_active_users || 0,
        newUsers: userActivity.new_users || 0,
        totalUsers: userActivity.total_users || overview.totalUsers || 0,
        growthTrend: userActivity.user_growth_trend || [],
        participationRate: communityInsights.user_participation_rate || 0,
        communityGrowthRate: communityInsights.community_growth_rate || 0
      });
    } catch (err) {
      console.error('Error fetching user growth analytics:', err);
      setError('Failed to load user growth data');
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

  const getGrowthTrend = (current, previous) => {
    if (!previous || previous === 0) return { trend: 'neutral', percentage: 0 };
    const change = ((current - previous) / previous) * 100;
    
    if (change > 5) return { trend: 'up', percentage: change };
    if (change < -5) return { trend: 'down', percentage: Math.abs(change) };
    return { trend: 'neutral', percentage: Math.abs(change) };
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRetentionLevel = (rate) => {
    if (rate >= 80) return { level: 'Excellent', color: 'text-green-600' };
    if (rate >= 60) return { level: 'Good', color: 'text-blue-600' };
    if (rate >= 40) return { level: 'Average', color: 'text-yellow-600' };
    return { level: 'Needs Improvement', color: 'text-red-600' };
  };

  const getEngagementRating = (rate) => {
    if (rate >= 70) return 'High';
    if (rate >= 50) return 'Medium';
    return 'Low';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading user analytics...</p>
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
              onClick={fetchUserGrowthAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const retentionLevel = getRetentionLevel(retentionData?.retentionRate || 0);
  const growthTrend = getGrowthTrend(retentionData?.newUsers || 0, (retentionData?.totalUsers || 0) * 0.1);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Growth & Retention Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">User acquisition, retention, and engagement metrics</p>
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

      {/* Key Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(retentionData?.totalUsers)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <div className={`flex items-center text-sm ${getTrendColor(growthTrend.trend)}`}>
              <span className="mr-1">{getTrendIcon(growthTrend.trend)}</span>
              <span>{formatPercentage(growthTrend.percentage)} from last period</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                +{formatNumber(retentionData?.newUsers)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">✨</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-green-600 text-sm font-medium">
              {timeRange} period
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(retentionData?.retentionRate)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">🔄</span>
            </div>
          </div>
          <div className="mt-4">
            <span className={`text-sm font-medium ${retentionLevel.color}`}>
              {retentionLevel.level}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(retentionData?.communityGrowthRate)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="text-2xl">📊</span>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-yellow-600 text-sm font-medium">
              Monthly growth
            </span>
          </div>
        </div>
      </div>

      {/* Active Users Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Users Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded mr-3"></div>
                <span className="text-gray-600 dark:text-gray-400">Daily Active Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(retentionData?.dailyActive)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-3"></div>
                <span className="text-gray-600 dark:text-gray-400">Weekly Active Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(retentionData?.weeklyActive)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded mr-3"></div>
                <span className="text-gray-600 dark:text-gray-400">Monthly Active Users</span>
              </div>
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatNumber(retentionData?.monthlyActive)}
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400 font-medium">DAU/MAU Ratio</span>
                <span className="text-lg font-semibold text-blue-600">
                  {retentionData?.monthlyActive > 0 
                    ? formatPercentage((retentionData?.dailyActive / retentionData?.monthlyActive) * 100)
                    : '0%'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Engagement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Participation Rate</span>
              <span className="text-lg font-semibold text-green-600">
                {formatPercentage(retentionData?.participationRate)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Engagement Level</span>
              <span className="text-lg font-semibold text-blue-600">
                {getEngagementRating(retentionData?.participationRate || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">User Stickiness</span>
              <span className="text-lg font-semibold text-purple-600">
                {retentionData?.weeklyActive > 0 
                  ? formatPercentage((retentionData?.dailyActive / retentionData?.weeklyActive) * 100)
                  : '0%'
                }
              </span>
            </div>

            <div className="border-t pt-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${retentionLevel.color} mb-1`}>
                  {retentionLevel.level}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Overall Retention Health
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* User Growth Trend Chart */}
      {retentionData?.growthTrend && retentionData.growthTrend.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Growth Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-1">
            {retentionData.growthTrend.slice(-14).map((day, index) => {
              const maxUsers = Math.max(...retentionData.growthTrend.map(d => d.new_users));
              const height = maxUsers > 0 ? (day.new_users / maxUsers) * 100 : 0;
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-gradient-to-t from-blue-500 to-purple-600 rounded-t min-h-1 transition-all duration-300 hover:opacity-80"
                    style={{ height: `${Math.max(height, 5)}%` }}
                    title={`${day.date}: ${day.new_users} new users`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-center">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              New users over the last {retentionData.growthTrend.length} days
            </p>
          </div>
        </div>
      )}

      {/* User Lifecycle Analysis */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Lifecycle Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <div className="text-3xl mb-2">🆕</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">New Users</div>
            <div className="text-2xl font-bold text-blue-600">{formatNumber(retentionData?.newUsers)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Recent signups</div>
          </div>

          <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">Active Users</div>
            <div className="text-2xl font-bold text-green-600">{formatNumber(retentionData?.dailyActive)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Daily engagement</div>
          </div>

          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">Retained Users</div>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((retentionData?.totalUsers * (retentionData?.retentionRate / 100)) || 0)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Long-term users</div>
          </div>

          <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
            <div className="text-3xl mb-2">📈</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">Growth Rate</div>
            <div className="text-2xl font-bold text-yellow-600">{formatPercentage(retentionData?.communityGrowthRate)}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Monthly growth</div>
          </div>
        </div>
      </div>

      {/* User Segment Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Activity Segments</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Highly Active</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Daily users</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">{formatNumber(retentionData?.dailyActive)}</div>
                <div className="text-sm text-gray-500">
                  {retentionData?.totalUsers > 0 
                    ? formatPercentage((retentionData?.dailyActive / retentionData?.totalUsers) * 100)
                    : '0%'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Regular Users</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Weekly users</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">
                  {formatNumber((retentionData?.weeklyActive || 0) - (retentionData?.dailyActive || 0))}
                </div>
                <div className="text-sm text-gray-500">
                  {retentionData?.totalUsers > 0 
                    ? formatPercentage(((retentionData?.weeklyActive - retentionData?.dailyActive) / retentionData?.totalUsers) * 100)
                    : '0%'
                  }
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Occasional Users</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Monthly users</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-yellow-600">
                  {formatNumber((retentionData?.monthlyActive || 0) - (retentionData?.weeklyActive || 0))}
                </div>
                <div className="text-sm text-gray-500">
                  {retentionData?.totalUsers > 0 
                    ? formatPercentage(((retentionData?.monthlyActive - retentionData?.weeklyActive) / retentionData?.totalUsers) * 100)
                    : '0%'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Retention Insights</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🎯</span>
                <span className="font-medium text-gray-900 dark:text-white">Target Retention</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Industry benchmark: 75% retention rate
              </div>
              <div className={`text-sm font-medium mt-1 ${
                (retentionData?.retentionRate || 0) >= 75 ? 'text-green-600' : 'text-yellow-600'
              }`}>
                {(retentionData?.retentionRate || 0) >= 75 ? 'Target achieved!' : 'Room for improvement'}
              </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📊</span>
                <span className="font-medium text-gray-900 dark:text-white">User Engagement</span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatPercentage(retentionData?.participationRate)} participation rate
              </div>
              <div className="text-sm font-medium mt-1 text-blue-600">
                {getEngagementRating(retentionData?.participationRate || 0)} engagement level
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export User Analytics</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📊 User Growth Report
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            📈 Retention Analysis
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            🎯 Engagement Study
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserGrowthAnalytics;