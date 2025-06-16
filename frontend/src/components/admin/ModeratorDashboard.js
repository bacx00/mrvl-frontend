import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function ModeratorDashboard({ navigateTo }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const { user, api } = useAuth();

  useEffect(() => {
    fetchModeratorStats();
  }, []);

  const fetchModeratorStats = async () => {
    try {
      setLoading(true);
      // Mock moderator stats - in production, this would come from API
      setStats({
        pendingReports: 8,
        resolvedToday: 15,
        activeWarnings: 12,
        forumThreads: 1247,
        flaggedPosts: 23,
        totalUsers: 2456,
        activeUsers: 845,
        banAppeals: 3
      });
    } catch (error) {
      console.error('Error fetching moderator stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'reports', name: 'Reports', icon: '🚨' },
    { id: 'users', name: 'User Moderation', icon: '👥' },
    { id: 'content', name: 'Content Moderation', icon: '📝' },
    { id: 'forums', name: 'Forum Management', icon: '💬' },
    { id: 'matches', name: 'Match Verification', icon: '⚔️' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading moderator dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Moderator Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                ⭐ Moderator Dashboard
              </h1>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 text-sm font-medium rounded-full">
                Moderator
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">Welcome, {user?.name}</span>
              <button 
                onClick={() => navigateTo('home')}
                className="btn btn-secondary"
              >
                🏠 Back to Site
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-4">
            <div className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-yellow-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                  {section.id === 'reports' && stats.pendingReports > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {stats.pendingReports}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Moderator Overview */}
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Moderation Overview</h2>
                <p className="text-gray-600 dark:text-gray-400">Keep the community safe and engaging</p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Reports</p>
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.pendingReports}</p>
                    </div>
                    <div className="text-4xl">🚨</div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-red-600 dark:text-red-400">Requires attention</span>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Resolved Today</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.resolvedToday}</p>
                    </div>
                    <div className="text-4xl">✅</div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-green-600 dark:text-green-400">Great work!</span>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.activeUsers}</p>
                    </div>
                    <div className="text-4xl">👥</div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-blue-600 dark:text-blue-400">Online now</span>
                  </div>
                </div>

                <div className="card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Flagged Posts</p>
                      <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{stats.flaggedPosts}</p>
                    </div>
                    <div className="text-4xl">⚠️</div>
                  </div>
                  <div className="mt-2">
                    <span className="text-sm text-yellow-600 dark:text-yellow-400">Needs review</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => setActiveSection('reports')}
                  className="card p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">🚨</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Review Reports</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Handle user reports and violations</p>
                </button>

                <button 
                  onClick={() => setActiveSection('content')}
                  className="card p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Moderate Content</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Review and moderate posts</p>
                </button>

                <button 
                  onClick={() => setActiveSection('forums')}
                  className="card p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  <div className="text-2xl mb-2">💬</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Manage Forums</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Forum threads and discussions</p>
                </button>
              </div>

              {/* Recent Activity */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Moderation Activity</h3>
                <div className="space-y-3">
                  {[
                    { action: 'Resolved spam report', time: '5 minutes ago', type: 'resolved' },
                    { action: 'Warned user for inappropriate language', time: '12 minutes ago', type: 'warning' },
                    { action: 'Approved match result submission', time: '25 minutes ago', type: 'approved' },
                    { action: 'Closed duplicate thread', time: '1 hour ago', type: 'closed' },
                    { action: 'Banned user for repeated violations', time: '2 hours ago', type: 'banned' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'resolved' ? 'bg-green-500' :
                          activity.type === 'warning' ? 'bg-yellow-500' :
                          activity.type === 'approved' ? 'bg-blue-500' :
                          activity.type === 'closed' ? 'bg-gray-500' :
                          'bg-red-500'
                        }`}></div>
                        <span className="text-gray-900 dark:text-white">{activity.action}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{activity.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Reports</h2>
                <p className="text-gray-600 dark:text-gray-400">Review and resolve community reports</p>
              </div>

              <div className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pending Reports ({stats.pendingReports})</h3>
                <div className="space-y-4">
                  {[
                    { id: 1, type: 'Inappropriate Language', reporter: 'User123', reported: 'ToxicPlayer99', content: 'Used offensive language in forum post', priority: 'high' },
                    { id: 2, type: 'Spam', reporter: 'ModerateGamer', reported: 'SpamBot_X', content: 'Multiple duplicate posts advertising external site', priority: 'medium' },
                    { id: 3, type: 'Harassment', reporter: 'ProPlayer2024', reported: 'AngryUser_01', content: 'Repeatedly targeting and insulting in match chat', priority: 'high' }
                  ].map((report) => (
                    <div key={report.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            report.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          }`}>
                            {report.priority.toUpperCase()}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">{report.type}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          Report #{report.id}
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-gray-900 dark:text-white">{report.content}</p>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Reported by: <span className="font-medium">{report.reporter}</span> | 
                          User: <span className="font-medium">{report.reported}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="btn btn-sm bg-green-600 hover:bg-green-700 text-white">
                          ✅ Resolve
                        </button>
                        <button className="btn btn-sm bg-yellow-600 hover:bg-yellow-700 text-white">
                          ⚠️ Warn User
                        </button>
                        <button className="btn btn-sm bg-red-600 hover:bg-red-700 text-white">
                          🚫 Ban User
                        </button>
                        <button className="btn btn-sm btn-secondary">
                          👁️ View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other sections would be implemented similarly */}
          {activeSection !== 'overview' && activeSection !== 'reports' && (
            <div className="card p-12 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {sections.find(s => s.id === activeSection)?.name} Section
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This moderation feature is being developed. Full functionality coming soon!
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default ModeratorDashboard;