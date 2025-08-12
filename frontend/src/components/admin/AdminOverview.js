import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminOverview({ navigateTo }) {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response.data || response);
    } catch (err) {
      setError('Failed to load platform statistics');
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-24"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Statistics</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={fetchStats}
            className="btn btn-outline-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const overview = stats?.overview || stats || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Overview</h1>
          <p className="text-gray-600 dark:text-gray-400">Real-time platform statistics and insights</p>
        </div>
        <button
          onClick={fetchStats}
          className="btn btn-outline-primary"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Teams"
          value={overview.totalTeams || 0}
          icon="users"
          color="blue"
          subtitle="Registered teams"
        />
        <MetricCard
          title="Total Players"
          value={overview.totalPlayers || 0}
          icon="user"
          color="green"
          subtitle="Active players"
        />
        <MetricCard
          title="Total Matches"
          value={overview.totalMatches || 0}
          icon="activity"
          color="purple"
          subtitle="All time matches"
        />
        <MetricCard
          title="Live Matches"
          value={overview.liveMatches || 0}
          icon="zap"
          color="red"
          subtitle="Currently live"
        />
        <MetricCard
          title="Total Events"
          value={overview.totalEvents || 0}
          icon="calendar"
          color="yellow"
          subtitle="Tournaments & events"
        />
        <MetricCard
          title="Total Users"
          value={overview.totalUsers || 0}
          icon="users"
          color="indigo"
          subtitle="Registered users"
        />
        <MetricCard
          title="Forum Threads"
          value={overview.totalThreads || 0}
          icon="message-circle"
          color="pink"
          subtitle="Discussion threads"
        />
        <MetricCard
          title="News Articles"
          value={overview.totalNews || 0}
          icon="newspaper"
          color="orange"
          subtitle="Published articles"
        />
      </div>

      {/* Activity Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {overview.recentActivity?.slice(0, 5).map((activity, index) => (
              <ActivityItem key={index} activity={activity} />
            )) || (
              <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity data available</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <HealthIndicator
              label="Database"
              status={overview.dbStatus || 'healthy'}
              uptime={overview.dbUptime}
            />
            <HealthIndicator
              label="Cache"
              status={overview.cacheStatus || 'healthy'}
              uptime={overview.cacheUptime}
            />
            <HealthIndicator
              label="Storage"
              status={overview.storageStatus || 'healthy'}
              usage={overview.storageUsage}
            />
            <HealthIndicator
              label="API Response Time"
              status={overview.apiStatus || 'healthy'}
              responseTime={overview.avgResponseTime}
            />
          </div>
        </div>
      </div>

    </div>
  );
}

function MetricCard({ title, value, icon, color, subtitle }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200',
    pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-200',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200'
  };

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-2xl font-bold">{value.toLocaleString()}</p>
          <p className="text-xs opacity-60 mt-1">{subtitle}</p>
        </div>
        <div className="opacity-60">
          <IconComponent icon={icon} size={24} />
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ activity }) {
  return (
    <div className="flex items-center space-x-3 py-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
      <div className="flex-1">
        <p className="text-sm text-gray-900 dark:text-white">{activity.description}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{activity.timestamp}</p>
      </div>
    </div>
  );
}

function HealthIndicator({ label, status, uptime, usage, responseTime }) {
  const statusColors = {
    healthy: 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400',
    warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400',
    error: 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
  };

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center space-x-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {status}
        </span>
        {uptime && <span className="text-xs text-gray-500 dark:text-gray-400">{uptime}</span>}
        {usage && <span className="text-xs text-gray-500 dark:text-gray-400">{usage}% used</span>}
        {responseTime && <span className="text-xs text-gray-500 dark:text-gray-400">{responseTime}ms</span>}
      </div>
    </div>
  );
}

function BulkOperationSection({ title, icon, color, operations, selectedOps, onToggleOperation, onSelectAll, onClearAll, onExecute }) {
  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-900 dark:text-green-200',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-900 dark:text-orange-200',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200',
    pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-200'
  };

  const buttonColorClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700 text-white',
    green: 'bg-green-600 hover:bg-green-700 text-white',
    purple: 'bg-purple-600 hover:bg-purple-700 text-white',
    orange: 'bg-orange-600 hover:bg-orange-700 text-white',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    pink: 'bg-pink-600 hover:bg-pink-700 text-white'
  };

  const allOperationIds = operations.map(op => op.id);
  const isAllSelected = allOperationIds.length > 0 && allOperationIds.every(id => selectedOps.includes(id));

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <IconComponent icon={icon} size={20} />
          <h4 className="font-semibold text-sm">{title}</h4>
        </div>
        <div className="text-xs opacity-75">
          {selectedOps.length} of {operations.length} selected
        </div>
      </div>

      {/* Bulk Controls */}
      <div className="flex items-center justify-between mb-3 text-xs">
        <button
          onClick={() => onSelectAll(allOperationIds)}
          className="text-blue-600 dark:text-blue-400 hover:underline"
          disabled={isAllSelected}
        >
          Select All
        </button>
        <button
          onClick={onClearAll}
          className="text-gray-600 dark:text-gray-400 hover:underline"
          disabled={selectedOps.length === 0}
        >
          Clear All
        </button>
      </div>

      {/* Operations List */}
      <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
        {operations.map((operation) => (
          <div key={operation.id} className="flex items-start space-x-2">
            <input
              type="checkbox"
              id={`${title.replace(/\s+/g, '_')}_${operation.id}`}
              checked={selectedOps.includes(operation.id)}
              onChange={() => onToggleOperation(operation.id)}
              className="mt-1 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-2"
            />
            <div className="flex-1 min-w-0">
              <label
                htmlFor={`${title.replace(/\s+/g, '_')}_${operation.id}`}
                className="text-xs font-medium cursor-pointer block"
              >
                {operation.label}
              </label>
              <p className="text-xs opacity-75 text-gray-600 dark:text-gray-400 mt-0.5">
                {operation.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Execute Button */}
      <button
        onClick={onExecute}
        disabled={selectedOps.length === 0}
        className={`w-full px-3 py-2 rounded-md text-xs font-medium transition-colors duration-200 ${
          selectedOps.length === 0
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            : `${buttonColorClasses[color]} hover:shadow-md`
        }`}
      >
        Execute {selectedOps.length > 0 ? `(${selectedOps.length})` : ''} Operations
      </button>
    </div>
  );
}

function IconComponent({ icon, size = 24 }) {
  const iconProps = {
    width: size,
    height: size,
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2
  };

  const icons = {
    users: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197V9a3 3 0 00-3-3m3 12a4 4 0 00-8 0v3h8v-3z" />,
    user: <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    activity: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
    zap: <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />,
    calendar: <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
    'message-circle': <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
    newspaper: <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />,
    plus: <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />,
    edit: <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  };

  return <svg {...iconProps}>{icons[icon] || icons.users}</svg>;
}

export default AdminOverview;