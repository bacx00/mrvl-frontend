import React, { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';

const TeamPerformanceAnalytics = ({ className = '' }) => {
  const [teamData, setTeamData] = useState(null);
  const [competitiveStats, setCompetitiveStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('all');

  useEffect(() => {
    fetchTeamAnalytics();
  }, [selectedRegion]);

  const fetchTeamAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch team analytics and competitive stats
      const [analyticsResponse, teamsResponse, statsResponse] = await Promise.all([
        apiGet('admin/analytics?period=30d'),
        apiGet('teams'),
        apiGet('admin/stats')
      ]);

      const analytics = analyticsResponse.data || analyticsResponse;
      const teams = teamsResponse.data || teamsResponse;
      const stats = statsResponse.data || statsResponse;

      setCompetitiveStats(analytics.competitive_stats || {});
      
      // Process team data
      const processedTeamData = {
        teams: Array.isArray(teams) ? teams : [],
        totalTeams: stats.overview?.totalTeams || teams?.length || 0,
        activeTeams: teams?.filter(team => team.status === 'active').length || 0,
        byRegion: stats.teams?.byRegion || [],
        topRated: stats.teams?.topRated || []
      };

      setTeamData(processedTeamData);
    } catch (err) {
      console.error('Error fetching team analytics:', err);
      setError('Failed to load team performance data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return '0';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getTeamLogo = (team) => {
    if (team.logo) {
      if (team.logo.startsWith('http')) {
        return team.logo;
      }
      return `/api/storage/team-logos/${team.logo}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&background=dc2626&color=fff&size=40`;
  };

  const getWinRate = (team) => {
    if (team.win_rate) return team.win_rate;
    if (team.matches_won && team.matches_played) {
      return Math.round((team.matches_won / team.matches_played) * 100);
    }
    return 0;
  };

  const getWinRateColor = (winRate) => {
    if (winRate >= 70) return 'text-green-600';
    if (winRate >= 50) return 'text-blue-600';
    if (winRate >= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading team analytics...</p>
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
              onClick={fetchTeamAnalytics}
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Team Performance Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Team statistics and competitive performance metrics</p>
        </div>
        
        <select
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Regions</option>
          <option value="americas">Americas</option>
          <option value="emea">EMEA</option>
          <option value="apac">APAC</option>
        </select>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(teamData?.totalTeams || 0)}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Teams</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(teamData?.activeTeams || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tournaments</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(competitiveStats?.total_tournaments || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams by Region */}
      {teamData?.byRegion && teamData.byRegion.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teams by Region</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {teamData.byRegion.map((region, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {region.count}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {region.region || 'Unknown'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performing Teams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {teamData?.topRated && teamData.topRated.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Rated Teams</h3>
            <div className="space-y-3">
              {teamData.topRated.slice(0, 5).map((team, index) => (
                <div key={team.id || index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 text-lg font-bold text-yellow-600 mr-3">
                      #{index + 1}
                    </div>
                    <img 
                      src={getTeamLogo(team)} 
                      alt={team.name}
                      className="w-8 h-8 rounded mr-3"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(team.name)}&background=dc2626&color=fff&size=32`;
                      }}
                    />
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">{team.name}</div>
                      <div className="text-xs text-gray-500">{team.region || 'Unknown Region'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-blue-600">
                      {team.rating || 1000}
                    </div>
                    <div className={`text-sm font-medium ${getWinRateColor(getWinRate(team))}`}>
                      {getWinRate(team)}% WR
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Popular Heroes in Competitive */}
        {competitiveStats?.most_popular_heroes && competitiveStats.most_popular_heroes.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Popular Heroes in Pro Play</h3>
            <div className="space-y-3">
              {competitiveStats.most_popular_heroes.slice(0, 5).map((hero, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                      {hero.hero?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium">{hero.hero}</div>
                      <div className="text-xs text-gray-500 capitalize">{hero.role}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-purple-600">
                      {formatNumber(hero.pick_count)}
                    </div>
                    <div className="text-sm text-gray-500">picks</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Match Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Completed Matches</h4>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(competitiveStats?.completed_matches || 0)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Avg Duration: {competitiveStats?.average_match_duration || 'N/A'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Most Popular Maps</h4>
          {competitiveStats?.most_popular_maps && competitiveStats.most_popular_maps.length > 0 ? (
            <div className="space-y-2">
              {competitiveStats.most_popular_maps.slice(0, 3).map((map, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-gray-900 dark:text-white">{map.map}</span>
                  <span className="text-blue-600 font-medium">{formatNumber(map.play_count)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No map data available</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Team Performance</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Avg Rating</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {teamData?.topRated?.length > 0 
                  ? Math.round(teamData.topRated.reduce((sum, team) => sum + (team.rating || 1000), 0) / teamData.topRated.length)
                  : '1000'
                }
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Active Roster</span>
              <span className="text-green-600 font-medium">
                {Math.round((teamData?.activeTeams / teamData?.totalTeams) * 100) || 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Export Team Analytics</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            📊 Export Rankings
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            📈 Team Performance Report
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            🎯 Competitive Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamPerformanceAnalytics;