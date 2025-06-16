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
      
      // Simulate user-specific data
      setUserStats({
        posts: 23,
        threadsCreated: 5,
        reputation: 1247,
        joinDate: user?.created_at || '2024-01-15',
        favoriteHero: 'Iron Man',
        winRate: 76.3,
        matchesPlayed: 45,
        rank: 'Gold II'
      });

      setRecentActivity([
        { type: 'post', content: 'Replied to "Best Iron Man builds"', time: '2 hours ago', icon: '💬' },
        { type: 'match', content: 'Won ranked match vs Team Beta', time: '1 day ago', icon: '🏆' },
        { type: 'thread', content: 'Created thread "Meta changes discussion"', time: '2 days ago', icon: '📝' },
        { type: 'achievement', content: 'Earned "Community Helper" badge', time: '3 days ago', icon: '🏅' },
        { type: 'friend', content: 'Connected with ProGamer_X', time: '5 days ago', icon: '👥' }
      ]);
    } catch (err) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'activity', label: 'Activity', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' }
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome Header */}
      <div className="glass rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-blue-500 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text">Welcome back, {user?.name}!</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Ready to dominate the Marvel Rivals battlefield?
              </p>
            </div>
          </div>
          <div className="text-4xl">🎮</div>
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