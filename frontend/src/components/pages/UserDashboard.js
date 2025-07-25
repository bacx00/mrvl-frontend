import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function UserDashboard() {
  const { user, api } = useAuth();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [userStats, setUserStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // 🔍 Fetch REAL user statistics from backend
      try {
        const statsResponse = await api.get('/user/stats');
        const statsData = statsResponse?.data?.data || statsResponse?.data || {};
        
        setUserStats({
          posts: statsData.posts_count || 0,
          threadsCreated: statsData.threads_count || 0,
          reputation: statsData.reputation || 0,
          joinDate: user?.created_at || statsData.join_date || '2024-01-01',
          favoriteHero: user?.favoriteHero || statsData.favorite_hero || 'Not set',
          winRate: statsData.win_rate || 0,
          matchesPlayed: statsData.matches_played || 0,
          rank: statsData.rank || 'Unranked'
        });
        
        console.log('✅ UserDashboard: Real user stats loaded');
      } catch (statsError) {
        console.warn('⚠️ UserDashboard: Stats API not available, using defaults');
        setUserStats({
          posts: 0,
          threadsCreated: 0,
          reputation: 0,
          joinDate: user?.created_at || '2024-01-01',
          favoriteHero: user?.favoriteHero || 'Not set',
          winRate: 0,
          matchesPlayed: 0,
          rank: 'Unranked'
        });
      }

      // 🔍 Fetch REAL user activity from backend
      try {
        const activityResponse = await api.get('/user/activity');
        const activityData = activityResponse?.data?.data || activityResponse?.data || [];
        
        if (Array.isArray(activityData) && activityData.length > 0) {
          const formattedActivity = activityData.map(activity => ({
            type: activity.type || 'activity',
            content: activity.description || activity.content || 'Activity',
            time: formatTimeAgo(activity.created_at || activity.time),
            icon: getActivityIcon(activity.type)
          }));
          
          setRecentActivity(formattedActivity);
          console.log('✅ UserDashboard: Real activity loaded:', formattedActivity.length);
        } else {
          setRecentActivity([]);
        }
      } catch (activityError) {
        console.warn('⚠️ UserDashboard: Activity API not available');
        setRecentActivity([]);
      }
      
    } catch (err) {
      console.error('❌ UserDashboard: Failed to fetch user data:', err);
      // Set empty defaults instead of fake data
      setUserStats({
        posts: 0,
        threadsCreated: 0,
        reputation: 0,
        joinDate: user?.created_at || '2024-01-01',
        favoriteHero: user?.favoriteHero || 'Not set',
        winRate: 0,
        matchesPlayed: 0,
        rank: 'Unranked'
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Recently';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // Helper function to get activity icon
  const getActivityIcon = (type) => {
    const iconMap = {
      'post': '💬',
      'thread': '📝',
      'match': '🏆',
      'achievement': '🏅',
      'friend': '👥',
      'comment': '💭',
      'vote': '👍',
      'login': '🔐'
    };
    return iconMap[type] || '📊';
  };

  // 🔑 Role-based tabs - same design, different permissions
  const getRoleTabs = () => {
    const baseTabs = [
      { id: 'overview', label: 'Overview', icon: '📊' },
      { id: 'profile', label: 'Profile', icon: '👤' },
      { id: 'activity', label: 'Activity', icon: '📈' },
      { id: 'settings', label: 'Settings', icon: '⚙️' }
    ];
    
    // Admin users get additional tabs but same UI design
    if (user?.roles?.includes('admin')) {
      return [
        ...baseTabs,
        { id: 'admin-tools', label: 'Admin Tools', icon: '⚡' },
        { id: 'user-management', label: 'User Management', icon: '👥' }
      ];
    }
    
    // Moderator users get moderation tabs
    if (user?.roles?.includes('moderator')) {
      return [
        ...baseTabs,
        { id: 'moderation', label: 'Moderation', icon: '🛡️' }
      ];
    }
    
    return baseTabs;
  };

  const tabs = getRoleTabs();

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ${
              user?.roles?.includes('admin') 
                ? 'bg-gradient-to-r from-red-500 to-red-600' 
                : user?.roles?.includes('moderator')
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                : 'bg-gradient-to-r from-blue-500 to-blue-600'
            }`}>
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold gradient-text">Welcome back, {user?.name}!</h1>
                {user?.roles?.includes('admin') && (
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-semibold border border-red-500/30">
                    🔴 Admin
                  </span>
                )}
                {user?.roles?.includes('moderator') && !user?.roles?.includes('admin') && (
                  <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs font-semibold border border-yellow-500/30">
                    🟡 Moderator
                  </span>
                )}
                {(!user?.roles?.includes('admin') && !user?.roles?.includes('moderator')) && (
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold border border-green-500/30">
                    🟢 User
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {user?.roles?.includes('admin') 
                  ? 'Full system access - manage users, content, and system settings'
                  : user?.roles?.includes('moderator')
                  ? 'Content moderation and limited admin features available'
                  : 'Ready to dominate the Marvel Rivals battlefield?'
                }
              </p>
            </div>
          </div>
          <div className="text-4xl">
            {user?.roles?.includes('admin') ? '⚡' : user?.roles?.includes('moderator') ? '🛡️' : '🎮'}
          </div>
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
          ) : (
            <>
              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Forum Posts</h3>
                  <span className="text-2xl">💬</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.posts}</div>
                <div className="text-sm text-blue-600 dark:text-blue-400 mt-2">+3 this week</div>
              </div>

              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Reputation</h3>
                  <span className="text-2xl">⭐</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.reputation}</div>
                <div className="text-sm text-green-600 dark:text-green-400 mt-2">+45 this month</div>
              </div>

              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Win Rate</h3>
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.winRate}%</div>
                <div className="text-sm text-purple-600 dark:text-purple-400 mt-2">{userStats.matchesPlayed} matches</div>
              </div>

              <div className="glass rounded-xl p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Rank</h3>
                  <span className="text-2xl">🥇</span>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{userStats.rank}</div>
                <div className="text-sm text-orange-600 dark:text-orange-400 mt-2">Climbing up!</div>
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
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300">
                    <div className="text-xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.content}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">{activity.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Favorite Hero & Progress */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Your Marvel Rivals Profile</h3>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-6xl mb-2">🦾</div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{userStats.favoriteHero}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Main Hero</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Hero Mastery</span>
                      <span className="text-gray-900 dark:text-white">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Duelist Skills</span>
                      <span className="text-gray-900 dark:text-white">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Team Play</span>
                      <span className="text-gray-900 dark:text-white">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'profile' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Display Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Member Since</label>
                  <input
                    type="text"
                    value={new Date(userStats.joinDate).toLocaleDateString()}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    readOnly
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Favorite Hero</label>
                  <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>Iron Man</option>
                    <option>Spider-Man</option>
                    <option>Hulk</option>
                    <option>Thor</option>
                    <option>Black Panther</option>
                    <option>Doctor Strange</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preferred Role</label>
                  <select className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500">
                    <option>Duelist</option>
                    <option>Strategist</option>
                    <option>Vanguard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                  <textarea
                    rows="3"
                    placeholder="Tell us about yourself..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {selectedTab === 'activity' && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Activity Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats.posts}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">{userStats.threadsCreated}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Threads Created</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userStats.reputation}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reputation Points</div>
                </div>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Complete Activity History</h3>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-white/50 dark:bg-gray-800/50 rounded-lg border-l-4 border-red-500">
                    <div className="text-2xl">{activity.icon}</div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">{activity.content}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{activity.time}</div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">{activity.type}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'admin-tools' && user?.roles?.includes('admin') && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="text-2xl mr-3">⚡</span>
                Admin Tools - System Management
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'User Management', icon: '👥', description: 'Manage user accounts and roles', action: 'Manage Users' },
                  { title: 'Content Moderation', icon: '🛡️', description: 'Review and moderate content', action: 'Open Moderation' },
                  { title: 'System Settings', icon: '⚙️', description: 'Configure system parameters', action: 'System Config' },
                  { title: 'Analytics Dashboard', icon: '📊', description: 'View detailed analytics', action: 'View Analytics' },
                  { title: 'Event Management', icon: '🏆', description: 'Create and manage events', action: 'Manage Events' },
                  { title: 'Live Scoring', icon: '📈', description: 'Control live match scoring', action: 'Live Control' }
                ].map((tool, index) => (
                  <div key={index} className="glass rounded-lg p-4 hover:scale-105 transition-transform">
                    <div className="text-3xl mb-3">{tool.icon}</div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{tool.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{tool.description}</p>
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-medium rounded-lg transition-all duration-300">
                      {tool.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'user-management' && user?.roles?.includes('admin') && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="text-2xl mr-3">👥</span>
                User Management - Admin Access
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚠️</span>
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Admin Feature</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Full user management capabilities available</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Quick Actions</h4>
                  {[
                    { action: 'View All Users', icon: '👁️' },
                    { action: 'Create New User', icon: '➕' },
                    { action: 'Bulk Operations', icon: '⚙️' },
                    { action: 'Role Management', icon: '🎭' }
                  ].map((item, index) => (
                    <button key={index} className="w-full flex items-center space-x-3 p-3 glass rounded-lg hover:bg-white/10 transition-all">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-gray-900 dark:text-white">{item.action}</span>
                    </button>
                  ))}
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h4>
                  <div className="space-y-3">
                    {[
                      { action: 'User registered', user: 'new_player_123', time: '2 minutes ago' },
                      { action: 'Role updated', user: 'moderator_user', time: '15 minutes ago' },
                      { action: 'User banned', user: 'spam_user', time: '1 hour ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">{activity.user}</div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">{activity.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'moderation' && user?.roles?.includes('moderator') && (
          <div className="space-y-6">
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <span className="text-2xl mr-3">🛡️</span>
                Content Moderation - Moderator Access
              </h3>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🟡</span>
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Moderator Tools</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">Content moderation and limited admin features</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { title: 'Forum Moderation', icon: '💬', count: '3 pending', action: 'Review Posts' },
                  { title: 'News Comments', icon: '📰', count: '1 reported', action: 'Review Comments' },
                  { title: 'User Reports', icon: '🚨', count: '2 reports', action: 'Handle Reports' },
                  { title: 'Match Comments', icon: '🏆', count: '0 pending', action: 'Review Matches' },
                  { title: 'Content Approval', icon: '✅', count: '5 waiting', action: 'Approve Content' },
                  { title: 'Ban Management', icon: '🔨', count: 'Limited', action: 'View Bans' }
                ].map((tool, index) => (
                  <div key={index} className="glass rounded-lg p-4 hover:scale-105 transition-transform">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{tool.icon}</span>
                      <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full">{tool.count}</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{tool.title}</h4>
                    <button className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-sm font-medium rounded-lg transition-all duration-300">
                      {tool.action}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="glass rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Account Settings</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Notifications</h4>
                <div className="space-y-3">
                  {[
                    { setting: 'Email notifications', enabled: true },
                    { setting: 'Forum mentions', enabled: true },
                    { setting: 'Match updates', enabled: false },
                    { setting: 'Event reminders', enabled: true }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{item.setting}</span>
                      <button className={`w-12 h-6 rounded-full relative transition-colors ${
                        item.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                          item.enabled ? 'right-0.5' : 'left-0.5'
                        }`}></div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Privacy</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Show online status</span>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Allow direct messages</span>
                    <button className="w-12 h-6 bg-green-500 rounded-full relative">
                      <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105">
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;