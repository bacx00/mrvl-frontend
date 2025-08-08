import React, { useState, useEffect } from 'react';
import { useAuth, useAdminStats } from '../../hooks';

function AdminDashboard() {
  const { user, isSuperAdmin, isAdmin, api } = useAuth();
  const { stats, loading, error } = useAdminStats();
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [userFilter, setUserFilter] = useState('all');

  useEffect(() => {
    if (isAdmin()) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const response = await api.get('/admin/users');
      setUsers(response.data || response);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}`, { role: newRole });
      fetchUsers(); // Refresh user list
    } catch (err) {
      console.error('Failed to update user role:', err);
    }
  };

  const filteredUsers = users.filter(u => {
    if (userFilter === 'all') return true;
    return u.roles?.includes(userFilter);
  });

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'content', label: 'Content Moderation', icon: '🛡️' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Platform Settings', icon: '⚙️' }
  ];

  if (!isAdmin()) {
    return (
      <div className="animate-fade-in">
        <div className="glass rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">🚫</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
          <p className="text-gray-600 dark:text-gray-400">You need administrator privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.name}! {isSuperAdmin() ? '(Super Admin)' : '(Admin)'}
            </p>
          </div>
          <div className="text-4xl">🛡️</div>
        </div>
      </div>

      {/* Quick Stats */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="glass rounded-xl p-6 animate-pulse">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            ))
          ) : error ? (
            <div className="glass rounded-xl p-6 col-span-full text-center">
              <div className="text-red-500 text-xl mb-2">⚠️</div>
              <p className="text-red-600 dark:text-red-400">Failed to load statistics</p>
            </div>
          ) : (
            <>
              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</h3>
                  <span className="text-2xl">👥</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.users || 0}</div>
                <div className="text-sm text-green-600 dark:text-green-400 mt-2">+{stats.new_users || 0} this week</div>
              </div>

              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Forum Threads</h3>
                  <span className="text-2xl">💬</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.threads || 0}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">+{stats.new_threads || 0} today</div>
              </div>

              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Matches</h3>
                  <span className="text-2xl">⚔️</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.matches || 0}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400 mt-2">{stats.live_matches || 0} live now</div>
              </div>

              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Events</h3>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stats.events || 0}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400 mt-2">{stats.upcoming_events || 0} upcoming</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="glass rounded-xl p-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${
                selectedTab === tab.id
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 border border-red-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 hover:text-red-500 dark:hover:text-red-400 border border-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {selectedTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {[
                  { action: 'New user registered', user: 'MarvelFan2024', time: '2 minutes ago', icon: '👤' },
                  { action: 'Forum thread created', user: 'ProGamer_X', time: '15 minutes ago', icon: '💬' },
                  { action: 'Match result submitted', user: 'TeamCaptain', time: '1 hour ago', icon: '⚔️' },
                  { action: 'Event created', user: 'EventOrganizer', time: '2 hours ago', icon: '🎯' },
                  { action: 'User role updated', user: 'ModeratorBot', time: '3 hours ago', icon: '🛡️' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="text-xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">by {activity.user} • {activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Health */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">System Health</h3>
              <div className="space-y-4">
                {[
                  { metric: 'Server Status', status: 'Operational', color: 'green', icon: '🟢' },
                  { metric: 'Database', status: 'Healthy', color: 'green', icon: '🟢' },
                  { metric: 'API Response Time', status: '45ms avg', color: 'green', icon: '🟢' },
                  { metric: 'Storage Usage', status: '67% (23GB)', color: 'yellow', icon: '🟡' },
                  { metric: 'Active Sessions', status: '1,247 users', color: 'blue', icon: '🔵' }
                ].map((health, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span>{health.icon}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{health.metric}</span>
                    </div>
                    <span className={`text-sm font-semibold ${
                      health.color === 'green' ? 'text-green-600 dark:text-green-400' :
                      health.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-blue-600 dark:text-blue-400'
                    }`}>
                      {health.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'users' && (
          <div className="space-y-6">
            {/* User Management Header */}
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">User Management</h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="all">All Users</option>
                    <option value="admin">Admins</option>
                    <option value="moderator">Moderators</option>
                    <option value="user">Regular Users</option>
                  </select>
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300">
                    Export Users
                  </button>
                </div>
              </div>

              {loadingUsers ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">Loading users...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">User</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Role</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Joined</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? filteredUsers.map((u, index) => (
                        <tr key={index} className="border-b border-gray-100 dark:border-gray-800 hover:bg-white/50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {u.name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white">{u.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-500">ID: {u.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              u.roles?.includes('admin') ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              u.roles?.includes('moderator') ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {u.roles?.includes('admin') ? '🛡️ Admin' : u.roles?.includes('moderator') ? '⭐ Moderator' : '👤 User'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{u.created_at || 'N/A'}</td>
                          <td className="py-3 px-4">
                            {isSuperAdmin() && u.email !== user?.email && (
                              <div className="flex items-center space-x-2">
                                <select
                                  onChange={(e) => updateUserRole(u.id, e.target.value)}
                                  className="text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                                  defaultValue={u.roles?.[0] || 'user'}
                                >
                                  <option value="user">User</option>
                                  <option value="moderator">Moderator</option>
                                  <option value="admin">Admin</option>
                                </select>
                              </div>
                            )}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-500">
                            No users found for the selected filter
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedTab === 'content' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Content Moderation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Pending Reviews</h4>
                <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">23</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Forum posts awaiting review</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Reports</h4>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">7</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">User reports to investigate</p>
              </div>
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Auto-Flagged</h4>
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">12</div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Content flagged by system</p>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Platform Growth</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Daily Active Users</span>
                  <span className="font-semibold text-gray-900 dark:text-white">1,247</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Monthly Growth</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">+23.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Forum Engagement</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">78.2%</span>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Top Content</h3>
              <div className="space-y-3">
                {[
                  { title: 'Marvel Rivals Meta Discussion', views: '2.3k', type: 'Forum' },
                  { title: 'STARK vs WAKANDA Highlights', views: '1.8k', type: 'Match' },
                  { title: 'Championship Finals Preview', views: '1.5k', type: 'Event' }
                ].map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{content.title}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{content.type}</div>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{content.views}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Platform Settings</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">General Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Maintenance Mode</span>
                    <button className="w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">New User Registration</span>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Forum Posting</span>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 transition-transform"></div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;