import React, { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';

const MatchTournamentAnalytics = ({ className = '' }) => {
  const [matchData, setMatchData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [competitiveStats, setCompetitiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchMatchAnalytics();
  }, [timeRange]);

  const fetchMatchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch match and event analytics from multiple endpoints
      const [analyticsResponse, matchesResponse, eventsResponse, statsResponse] = await Promise.all([
        apiGet(`admin/analytics?period=${timeRange}`),
        apiGet('matches'),
        apiGet('events'),
        apiGet('admin/stats')
      ]);

      const analytics = analyticsResponse.data || analyticsResponse;
      const matches = matchesResponse.data || matchesResponse;
      const events = eventsResponse.data || eventsResponse;
      const stats = statsResponse.data || statsResponse;

      // Process match data
      const processedMatchData = {
        matches: Array.isArray(matches) ? matches : [],
        totalMatches: stats.overview?.totalMatches || matches?.length || 0,
        liveMatches: stats.overview?.liveMatches || 0,
        byStatus: stats.matches?.byStatus || [],
        recent: stats.matches?.recent || []
      };

      // Process event data  
      const processedEventData = {
        events: Array.isArray(events) ? events : [],
        totalEvents: stats.overview?.totalEvents || events?.length || 0,
        activeEvents: stats.overview?.activeEvents || 0,
        byType: stats.events?.byType || [],
        upcoming: stats.events?.upcoming || []
      };

      // Process competitive stats
      setCompetitiveStats(analytics.competitive_stats || {});
      setMatchData(processedMatchData);
      setEventData(processedEventData);
    } catch (err) {
      console.error('Error fetching match analytics:', err);
      setError('Failed to load match and tournament data');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'live': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'upcoming': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'scheduled': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'cancelled': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      'ongoing': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'postponed': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const getEventTypeIcon = (type) => {
    const typeIcons = {
      'tournament': '🏆',
      'match': '⚔️',
      'championship': '👑',
      'qualifier': '🎯',
      'exhibition': '🎮',
      'league': '📊',
      'cup': '🏅'
    };
    return typeIcons[type?.toLowerCase()] || '🎮';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading match analytics...</p>
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
              onClick={fetchMatchAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Match & Tournament Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Competitive match data and tournament performance metrics</p>
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

      {/* Match & Event Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">⚔️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Matches</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(matchData?.totalMatches || 0)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor('live')}`}>
              {matchData?.liveMatches || 0} Live
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tournaments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(competitiveStats?.total_tournaments || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(competitiveStats?.completed_matches || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Duration</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {competitiveStats?.average_match_duration || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match Status Distribution */}
      {matchData?.byStatus && matchData.byStatus.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Status Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {matchData.byStatus.map((statusData, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize mb-2 ${getStatusColor(statusData.status)}`}>
                  {statusData.status || 'Unknown'}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {statusData.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events by Type */}
      {eventData?.byType && eventData.byType.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Events by Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {eventData.byType.map((typeData, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-3xl mb-2">
                  {getEventTypeIcon(typeData.type)}
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {typeData.count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {typeData.type || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Popular Heroes and Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {competitiveStats?.most_popular_heroes && competitiveStats.most_popular_heroes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Picked Heroes</h3>
            <div className="space-y-3">
              {competitiveStats.most_popular_heroes.slice(0, 5).map((hero, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3">
                      {hero.hero?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">{hero.hero}</div>
                      <div className="text-xs text-gray-500 capitalize">{hero.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {formatNumber(hero.pick_count)}
                    </div>
                    <div className="text-xs text-gray-500">picks</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {competitiveStats?.most_popular_maps && competitiveStats.most_popular_maps.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Most Played Maps</h3>
            <div className="space-y-3">
              {competitiveStats.most_popular_maps.slice(0, 5).map((map, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-sm font-bold mr-3">
                      🗺️
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">{map.map}</div>
                      <div className="text-xs text-gray-500 capitalize">{map.game_mode}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {formatNumber(map.play_count)}
                    </div>
                    <div className="text-xs text-gray-500">plays</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Matches */}
      {matchData?.recent && matchData.recent.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Matches</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Teams
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {matchData.recent.map((match, index) => (
                  <tr key={match.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {match.team1?.name || match.team1_name || 'TBD'} vs {match.team2?.name || match.team2_name || 'TBD'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {match.team1_score || 0} - {match.team2_score || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {match.event?.name || match.event_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(match.scheduled_at || match.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {eventData?.upcoming && eventData.upcoming.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {eventData.upcoming.slice(0, 5).map((event, index) => (
              <div key={event.id || index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center">
                  <div className="text-2xl mr-4">
                    {getEventTypeIcon(event.type)}
                  </div>
                  <div>
                    <div className="text-gray-900 dark:text-white font-medium">{event.name}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(event.start_date)} - {event.prize_pool ? `$${formatNumber(event.prize_pool)}` : 'No prize pool'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                  <div className="text-sm text-gray-500 mt-1">
                    {event.teams_count || 0} teams
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Match Completion Rate</h4>
          <div className="text-3xl font-bold text-green-600">
            {matchData?.totalMatches > 0 
              ? Math.round((competitiveStats?.completed_matches / matchData.totalMatches) * 100)
              : 0
            }%
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formatNumber(competitiveStats?.completed_matches || 0)} completed
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Active Events</h4>
          <div className="text-3xl font-bold text-blue-600">
            {formatNumber(eventData?.activeEvents || 0)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Currently running
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Tournament Success</h4>
          <div className="text-3xl font-bold text-purple-600">
            {eventData?.totalEvents > 0 
              ? Math.round(((eventData.totalEvents - (eventData.upcoming?.length || 0)) / eventData.totalEvents) * 100)
              : 0
            }%
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Events completed
          </p>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Match Analytics</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📊 Match Statistics
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            🏆 Tournament Report
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            🎯 Competitive Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default MatchTournamentAnalytics;