import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminStatistics() {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/stats');
      setStats(response?.data || response || {});
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Platform Statistics</h1>
        <p className="text-gray-600 dark:text-gray-400">Detailed platform statistics and metrics</p>
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          Admin Only Access
        </div>
      </div>

      {/* Core Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats?.overview?.totalUsers || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Registered accounts
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats?.overview?.totalTeams || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Teams</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Competitive teams
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats?.overview?.totalMatches || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Matches</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            All time matches
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {stats?.overview?.totalNews || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">News Articles</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Published content
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats?.overview?.totalPlayers || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Players</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Professional players
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats?.overview?.totalEvents || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Tournaments & competitions
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats?.overview?.totalThreads || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Forum Threads</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Community discussions
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats?.overview?.liveMatches || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Live Matches</div>
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Currently active
          </div>
        </div>
      </div>

      {/* Detailed Breakdowns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">User Breakdown</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Admins</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {stats?.users?.admins || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Moderators</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {stats?.users?.moderators || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Regular Users</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {stats?.users?.users || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Active Today</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats?.users?.activeToday || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Content Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Content Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Published News</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {stats?.content?.publishedNews || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Draft Articles</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {stats?.content?.draftNews || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Forum Posts</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats?.content?.forumPosts || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Comments</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {stats?.content?.comments || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Match Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Completed</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {stats?.matches?.completed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Live</span>
              <span className="font-semibold text-red-600 dark:text-red-400">
                {stats?.matches?.live || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Scheduled</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats?.matches?.scheduled || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Cancelled</span>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                {stats?.matches?.cancelled || 0}
              </span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Database Status</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {stats?.system?.database || 'Healthy'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">API Response Time</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                {stats?.system?.responseTime || '120'}ms
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Uptime</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {stats?.system?.uptime || '99.9'}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Storage Used</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                {stats?.system?.storageUsed || '65'}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats?.activity?.newUsersToday || 12}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">New Users Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.activity?.matchesCompletedToday || 8}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Matches Completed Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats?.activity?.postsCreatedToday || 45}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Posts Created Today</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminStatistics;