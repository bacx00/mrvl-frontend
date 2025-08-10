import React, { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';

const PlayerEngagementAnalytics = ({ className = '' }) => {
  const [playerData, setPlayerData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchPlayerAnalytics();
  }, [timeRange]);

  const fetchPlayerAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch player analytics from multiple endpoints
      const [analyticsResponse, playersResponse, statsResponse] = await Promise.all([
        apiGet(`admin/analytics?period=${timeRange}`),
        apiGet('players'),
        apiGet('admin/stats')
      ]);

      const analytics = analyticsResponse.data || analyticsResponse;
      const players = playersResponse.data || playersResponse;
      const stats = statsResponse.data || statsResponse;

      // Process player data
      const processedPlayerData = {
        players: Array.isArray(players) ? players : [],
        totalPlayers: stats.overview?.totalPlayers || players?.length || 0,
        activePlayers: players?.filter(player => player.status === 'active').length || 0,
        byRole: stats.players?.byRole || [],
        topRated: stats.players?.topRated || []
      };

      // Process engagement data
      const processedEngagementData = {
        userActivity: analytics.user_activity || {},
        contentActivity: analytics.content_activity || {},
        engagement: analytics.engagement || {},
        communityInsights: analytics.community_insights || {}
      };

      setPlayerData(processedPlayerData);
      setEngagementData(processedEngagementData);
    } catch (err) {
      console.error('Error fetching player analytics:', err);
      setError('Failed to load player engagement data');
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

  const getPlayerAvatar = (player) => {
    if (player.avatar) {
      if (player.avatar.startsWith('http')) {
        return player.avatar;
      }
      return `/api/storage/player-avatars/${player.avatar}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3b82f6&color=fff&size=40`;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      'duelist': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'tank': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'support': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'strategist': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'vanguard': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return roleColors[role?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getEngagementLevel = (participationRate) => {
    if (participationRate >= 80) return { text: 'Excellent', color: 'text-green-600' };
    if (participationRate >= 60) return { text: 'Good', color: 'text-blue-600' };
    if (participationRate >= 40) return { text: 'Average', color: 'text-yellow-600' };
    return { text: 'Low', color: 'text-red-600' };
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading player analytics...</p>
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
              onClick={fetchPlayerAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const participationRate = engagementData?.communityInsights?.user_participation_rate || 0;
  const engagementLevel = getEngagementLevel(participationRate);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Player Engagement Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Player statistics and community engagement metrics</p>
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

      {/* Player Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">🎮</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Players</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(playerData?.totalPlayers || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Players</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(playerData?.activePlayers || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(participationRate)}
              </p>
              <p className={`text-sm font-medium ${engagementLevel.color}`}>
                {engagementLevel.text}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="text-2xl">🔄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatPercentage(engagementData?.userActivity?.user_retention_rate)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Activity Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Daily Active Users</span>
              <span className="text-lg font-semibold text-blue-600">
                {formatNumber(engagementData?.userActivity?.daily_active_users)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Weekly Active Users</span>
              <span className="text-lg font-semibold text-green-600">
                {formatNumber(engagementData?.userActivity?.weekly_active_users)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Monthly Active Users</span>
              <span className="text-lg font-semibold text-purple-600">
                {formatNumber(engagementData?.userActivity?.monthly_active_users)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">New Users</span>
              <span className="text-lg font-semibold text-yellow-600">
                +{formatNumber(engagementData?.userActivity?.new_users)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Growth Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPercentage(engagementData?.communityInsights?.community_growth_rate)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Engagement</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Forum Threads</span>
              <span className="text-lg font-semibold text-blue-600">
                {formatNumber(engagementData?.contentActivity?.new_threads)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Posts</span>
              <span className="text-lg font-semibold text-green-600">
                {formatNumber(engagementData?.contentActivity?.total_posts)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Comments</span>
              <span className="text-lg font-semibold text-purple-600">
                {formatNumber(engagementData?.contentActivity?.total_comments)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Interactions</span>
              <span className="text-lg font-semibold text-yellow-600">
                {formatNumber(engagementData?.engagement?.total_interactions)}
              </span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Engagement Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPercentage(engagementData?.contentActivity?.content_engagement_rate)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Players by Role Distribution */}
      {playerData?.byRole && playerData.byRole.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Player Role Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {playerData.byRole.map((roleData, index) => {
              const percentage = playerData.totalPlayers > 0 
                ? Math.round((roleData.count / playerData.totalPlayers) * 100) 
                : 0;
              
              return (
                <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium capitalize mb-2 ${getRoleColor(roleData.role)}`}>
                    {roleData.role || 'Unknown'}
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {roleData.count}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {percentage}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Players and Content Creators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {playerData?.topRated && playerData.topRated.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Rated Players</h3>
            <div className="space-y-3">
              {playerData.topRated.slice(0, 5).map((player, index) => (
                <div key={player.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 text-lg font-bold text-yellow-600 mr-3">
                      #{index + 1}
                    </div>
                    <img 
                      src={getPlayerAvatar(player)} 
                      alt={player.name}
                      className="w-8 h-8 rounded-full mr-3"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name)}&background=3b82f6&color=fff&size=32`;
                      }}
                    />
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">{player.name}</div>
                      <div className="text-xs text-gray-500">{player.team?.name || player.team_name || 'Free Agent'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {player.rating || 1000}
                    </div>
                    <div className={`text-xs px-1 py-0.5 rounded ${getRoleColor(player.role)}`}>
                      {player.role || 'Unknown'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {engagementData?.contentActivity?.top_content_creators && engagementData.contentActivity.top_content_creators.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Active Community Members</h3>
            <div className="space-y-3">
              {engagementData.contentActivity.top_content_creators.slice(0, 5).map((creator, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {creator.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">{creator.name}</div>
                      <div className="text-xs text-gray-500">Community Member</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-purple-600">
                      {creator.thread_count}
                    </div>
                    <div className="text-xs text-gray-500">threads</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session and Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Average Session Duration</h4>
          <div className="text-3xl font-bold text-blue-600">
            {engagementData?.engagement?.avg_session_duration || 'N/A'}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Per user session
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Page Views</h4>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(engagementData?.engagement?.page_views)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatPercentage(engagementData?.engagement?.bounce_rate)} bounce rate
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Community Health</h4>
          <div className={`text-3xl font-bold ${engagementLevel.color}`}>
            {engagementLevel.text}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatPercentage(participationRate)} participation
          </p>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Player Analytics</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📊 Player Engagement Report
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            📈 Community Growth Analysis
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            🎯 User Retention Study
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerEngagementAnalytics;