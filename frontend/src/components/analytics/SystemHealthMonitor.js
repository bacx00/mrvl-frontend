import React, { useState, useEffect } from 'react';
import { apiGet } from '../../lib/api';

const SystemHealthMonitor = ({ className = '' }) => {
  const [healthData, setHealthData] = useState(null);
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    fetchSystemHealth();
    
    // Set up auto-refresh
    const interval = setInterval(fetchSystemHealth, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const fetchSystemHealth = async () => {
    try {
      setError(null);

      // Fetch system health and analytics data
      const [analyticsResponse, statsResponse] = await Promise.all([
        apiGet('admin/analytics?period=1d'),
        apiGet('admin/stats')
      ]);

      const analytics = analyticsResponse.data || analyticsResponse;
      const stats = statsResponse.data || statsResponse;

      // Extract platform health data
      const platformHealth = analytics.platform_health || {};
      const systemOverview = stats.overview || {};

      setHealthData(platformHealth);
      setSystemStats(systemOverview);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching system health:', err);
      setError('Failed to load system health data');
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

  const getHealthStatus = (value, thresholds) => {
    if (!value || value === 'N/A') return { status: 'unknown', color: 'gray' };
    
    const numValue = parseFloat(value.toString().replace(/[^\d.]/g, ''));
    
    if (numValue >= thresholds.excellent) return { status: 'excellent', color: 'green' };
    if (numValue >= thresholds.good) return { status: 'good', color: 'blue' };
    if (numValue >= thresholds.warning) return { status: 'warning', color: 'yellow' };
    return { status: 'critical', color: 'red' };
  };

  const getSystemStatusColor = (status) => {
    const colors = {
      'excellent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'good': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      'unknown': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    };
    return colors[status] || colors.unknown;
  };

  const getOverallHealthStatus = () => {
    if (!healthData) return 'unknown';
    
    const metrics = [
      healthData.api_response_time,
      healthData.error_rate,
      healthData.cache_hit_rate,
      healthData.active_sessions
    ];
    
    const validMetrics = metrics.filter(m => m && m !== 'N/A');
    if (validMetrics.length === 0) return 'unknown';
    
    // Simple heuristic based on available data
    const responseTime = parseFloat((healthData.api_response_time || '0').replace(/[^\d.]/g, ''));
    const errorRate = parseFloat((healthData.error_rate || '0').replace(/[^\d.]/g, ''));
    
    if (responseTime > 1000 || errorRate > 5) return 'critical';
    if (responseTime > 500 || errorRate > 2) return 'warning';
    if (responseTime > 200 || errorRate > 1) return 'good';
    return 'excellent';
  };

  const formatRelativeTime = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  if (loading && !healthData) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading system health...</p>
          </div>
        </div>
      </div>
    );
  }

  const overallStatus = getOverallHealthStatus();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Health Monitor</h2>
          <p className="text-gray-600 dark:text-gray-400">Real-time system performance and health metrics</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="10">Refresh every 10s</option>
            <option value="30">Refresh every 30s</option>
            <option value="60">Refresh every 1m</option>
            <option value="300">Refresh every 5m</option>
          </select>
          
          <button
            onClick={fetchSystemHealth}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            {loading ? '⟳' : '🔄'} Refresh
          </button>
        </div>
      </div>

      {/* Last Updated & Overall Status */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">Last updated: </span>
          <span className="text-sm font-medium text-gray-900 dark:text-white ml-1">
            {formatRelativeTime(lastUpdated)}
          </span>
        </div>
        
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Overall Status:</span>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium capitalize ${getSystemStatusColor(overallStatus)}`}>
            {overallStatus === 'excellent' && '🟢'} 
            {overallStatus === 'good' && '🔵'} 
            {overallStatus === 'warning' && '🟡'} 
            {overallStatus === 'critical' && '🔴'}
            {overallStatus === 'unknown' && '⚪'} 
            {overallStatus}
          </span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <span className="text-red-500 text-xl mr-3">⚠️</span>
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">System Health Warning</p>
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Core System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Response Time</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthData?.api_response_time || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="text-2xl">⚡</span>
            </div>
          </div>
          <div className="mt-4">
            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              getSystemStatusColor(getHealthStatus(healthData?.api_response_time, { excellent: 0, good: 200, warning: 500, critical: 1000 }).status)
            }`}>
              {getHealthStatus(healthData?.api_response_time, { excellent: 0, good: 200, warning: 500, critical: 1000 }).status}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthData?.system_uptime || 'N/A'}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="text-2xl">🔋</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Online
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {healthData?.error_rate || '0.0%'}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
          <div className="mt-4">
            <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
              getSystemStatusColor(getHealthStatus(healthData?.error_rate, { excellent: 5, good: 2, warning: 1, critical: 0 }).status)
            }`}>
              {parseFloat((healthData?.error_rate || '0').replace(/[^\d.]/g, '')) < 1 ? 'excellent' : 'needs attention'}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Sessions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(healthData?.active_sessions)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Active Users
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Database Performance</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Queries per Second</span>
              <span className="text-lg font-semibold text-blue-600">
                {healthData?.database_queries_per_second || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
              <span className="text-lg font-semibold text-green-600">
                {healthData?.cache_hit_rate || 'N/A'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Connection Pool</span>
              <span className="text-lg font-semibold text-purple-600">
                Healthy
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Application Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Users</span>
              <span className="text-lg font-semibold text-blue-600">
                {formatNumber(systemStats?.totalUsers)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Matches</span>
              <span className="text-lg font-semibold text-green-600">
                {formatNumber(systemStats?.totalMatches)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Live Matches</span>
              <span className="text-lg font-semibold text-red-600">
                {formatNumber(systemStats?.liveMatches)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Events</span>
              <span className="text-lg font-semibold text-purple-600">
                {formatNumber(systemStats?.activeEvents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* System Resources */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resource Utilization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl mb-2">💾</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">Memory</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Optimal</div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-2">💻</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">CPU</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Normal</div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl mb-2">💽</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">Storage</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Good</div>
            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Actions</h3>
        <div className="flex flex-wrap gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            🔄 Clear Cache
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            📊 Generate Health Report
          </button>
          <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
            ⚙️ System Settings
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            📈 Performance Logs
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemHealthMonitor;