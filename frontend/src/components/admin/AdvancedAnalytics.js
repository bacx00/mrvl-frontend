import React, { useState, useEffect } from 'react';

function AdvancedAnalytics({ api }) {
  const [analytics, setAnalytics] = useState({
    overview: {},
    teams: {},
    players: {},
    matches: {},
    events: {},
    users: {}
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [activeChart, setActiveChart] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await api.get(`/admin/analytics?period=${timeRange}`);
      const analyticsData = response.data || response;
      
      setAnalytics(analyticsData);
      console.log('✅ Analytics loaded:', analyticsData);
      
    } catch (error) {
      console.error('❌ Analytics error:', error);
      setAnalytics(generateDemoAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const generateDemoAnalytics = () => {
    return {
      overview: {
        totalUsers: 15420,
        activeUsers: 8750,
        newUsers: 1250,
        retention: 78.5,
        avgSessionTime: '24m 35s',
        pageViews: 125600,
        bounceRate: 32.8,
        conversionRate: 12.4
      },
      teams: {
        totalTeams: 17,
        activeTeams: 15,
        topRegions: [
          { region: 'North America', count: 8, percentage: 47 },
          { region: 'Europe', count: 5, percentage: 29 },
          { region: 'Asia Pacific', count: 3, percentage: 18 },
          { region: 'Other', count: 1, percentage: 6 }
        ],
        averageRating: 1542,
        totalMatches: 89
      },
      players: {
        totalPlayers: 119,
        activePlayers: 95,
        topHeroes: [
          { hero: 'Iron Man', picks: 156, winRate: 67.3 },
          { hero: 'Spider-Man', picks: 142, winRate: 64.8 },
          { hero: 'Storm', picks: 138, winRate: 71.2 },
          { hero: 'Hulk', picks: 134, winRate: 58.9 },
          { hero: 'Thor', picks: 128, winRate: 62.5 }
        ],
        roleDistribution: [
          { role: 'Duelist', count: 48, percentage: 40.3 },
          { role: 'Tank', count: 36, percentage: 30.3 },
          { role: 'Support', count: 35, percentage: 29.4 }
        ]
      },
      matches: {
        totalMatches: 89,
        liveMatches: 1,
        completedMatches: 67,
        upcomingMatches: 21,
        averageViewers: 28450,
        peakViewers: 125600
      },
      events: {
        totalEvents: 2,
        liveEvents: 1,
        completedEvents: 1,
        totalPrizePool: '$2,100,000',
        totalTeamsParticipated: 32
      },
      users: {
        totalUsers: 15420,
        newUsersToday: 127,
        activeUsersToday: 2840,
        topCountries: [
          { country: 'United States', users: 4650, flag: '🇺🇸' },
          { country: 'Canada', users: 2180, flag: '🇨🇦' },
          { country: 'United Kingdom', users: 1890, flag: '🇬🇧' },
          { country: 'Germany', users: 1520, flag: '🇩🇪' },
          { country: 'Australia', users: 1340, flag: '🇦🇺' }
        ]
      }
    };
  };

  const timeRanges = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' }
  ];

  const chartSections = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'players', label: 'Players', icon: '🎮' },
    { id: 'matches', label: 'Matches', icon: '⚔️' },
    { id: 'events', label: 'Events', icon: '🏆' },
    { id: 'users', label: 'Users', icon: '👤' }
  ];

  const renderOverviewCharts = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="card p-6 text-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30">
        <div className="text-3xl mb-2">👥</div>
        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {analytics.overview.totalUsers?.toLocaleString()}
        </div>
        <div className="text-sm text-blue-700 dark:text-blue-300">Total Users</div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
          +{analytics.overview.newUsers} new
        </div>
      </div>
      
      <div className="card p-6 text-center bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/30">
        <div className="text-3xl mb-2">🔥</div>
        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
          {analytics.overview.activeUsers?.toLocaleString()}
        </div>
        <div className="text-sm text-green-700 dark:text-green-300">Active Users</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {analytics.overview.retention}% retention
        </div>
      </div>
      
      <div className="card p-6 text-center bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30">
        <div className="text-3xl mb-2">👁️</div>
        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
          {analytics.overview.pageViews?.toLocaleString()}
        </div>
        <div className="text-sm text-purple-700 dark:text-purple-300">Page Views</div>
        <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {analytics.overview.bounceRate}% bounce rate
        </div>
      </div>
      
      <div className="card p-6 text-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/30 dark:to-red-900/30">
        <div className="text-3xl mb-2">⏱️</div>
        <div className="text-3xl font-bold text-red-600 dark:text-red-400">
          {analytics.overview.avgSessionTime}
        </div>
        <div className="text-sm text-red-700 dark:text-red-300">Avg Session</div>
        <div className="text-xs text-green-600 dark:text-green-400 mt-1">
          {analytics.overview.conversionRate}% conversion
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeChart) {
      case 'overview':
        return renderOverviewCharts();
      case 'teams':
        return (
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">Team Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.teams.totalTeams}</div>
                <div className="text-sm text-gray-600">Total Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.teams.activeTeams}</div>
                <div className="text-sm text-gray-600">Active Teams</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analytics.teams.averageRating}</div>
                <div className="text-sm text-gray-600">Avg Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{analytics.teams.totalMatches}</div>
                <div className="text-sm text-gray-600">Total Matches</div>
              </div>
            </div>
          </div>
        );
      case 'players':
        return (
          <div className="card p-6">
            <h3 className="text-lg font-bold mb-4">Player Analytics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analytics.players.totalPlayers}</div>
                <div className="text-sm text-gray-600">Total Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analytics.players.activePlayers}</div>
                <div className="text-sm text-gray-600">Active Players</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">156</div>
                <div className="text-sm text-gray-600">Avg Picks</div>
              </div>
            </div>
          </div>
        );
      default:
        return renderOverviewCharts();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">📈 Advanced Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive platform insights and metrics</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="form-input"
        >
          {timeRanges.map(range => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {chartSections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveChart(section.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === section.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {section.icon} {section.label}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Export Analytics</h3>
        <div className="flex flex-wrap gap-4">
          <button className="btn bg-blue-600 text-white hover:bg-blue-700">
            📊 Export to Excel
          </button>
          <button className="btn bg-green-600 text-white hover:bg-green-700">
            📄 Generate Report
          </button>
          <button className="btn bg-purple-600 text-white hover:bg-purple-700">
            📈 Custom Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancedAnalytics;