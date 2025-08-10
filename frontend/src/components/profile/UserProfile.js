import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { hasRole, ROLES } from '../../utils/roleUtils';
import UserAvatar from '../common/UserAvatar';

function UserProfile({ userId = null }) {
  const { user: currentUser, api } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use current user if no userId provided
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchUserProfile();
      fetchUserStats();
      fetchRecentActivity();
    }
  }, [targetUserId]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/api/user/${targetUserId}/profile`);
      setProfileData(response.data || response);
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use current user data as fallback for own profile
      if (isOwnProfile && currentUser) {
        setProfileData(currentUser);
      }
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await api.get(`/api/user/${targetUserId}/stats`);
      setUserStats(response.data || response);
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats
      setUserStats({
        matches_viewed: 0,
        comments_posted: 0,
        forum_threads: 0,
        forum_posts: 0,
        news_read: 0,
        teams_followed: 0,
        predictions_made: 0
      });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await api.get(`/api/user/${targetUserId}/activity`);
      setRecentActivity(response.data || response || []);
    } catch (error) {
      console.error('Error fetching activity:', error);
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  };

  // Get role-specific colors and badges
  const getRoleStyles = (role) => {
    switch(role) {
      case 'admin':
        return {
          bgColor: 'bg-red-100 dark:bg-red-900/30',
          textColor: 'text-red-800 dark:text-red-300',
          borderColor: 'border-red-500',
          badge: 'Admin',
          icon: '👑'
        };
      case 'moderator':
        return {
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
          textColor: 'text-yellow-800 dark:text-yellow-300',
          borderColor: 'border-yellow-500',
          badge: 'Moderator',
          icon: '🛡️'
        };
      default:
        return {
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          textColor: 'text-blue-800 dark:text-blue-300',
          borderColor: 'border-blue-500',
          badge: 'User',
          icon: '👤'
        };
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const profile = profileData || currentUser;
  const roleStyles = getRoleStyles(profile?.role);

  return (
    <div className="p-6 space-y-6">
      {/* Profile Header - Similar to Admin Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Avatar */}
            <div className="relative">
              <UserAvatar 
                user={profile} 
                size="lg"
                className="w-20 h-20 rounded-full border-4 border-gray-200 dark:border-gray-700"
              />
              <div className={`absolute -bottom-1 -right-1 px-2 py-1 text-xs font-bold rounded-full ${roleStyles.bgColor} ${roleStyles.textColor} border-2 border-white dark:border-gray-800`}>
                {roleStyles.badge}
              </div>
            </div>
            
            {/* User Info */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {profile?.name || 'Unknown User'}
                {profile?.team_flair && (
                  <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                    • {profile.team_flair.name}
                  </span>
                )}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">{profile?.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                <span>Joined: {new Date(profile?.created_at).toLocaleDateString()}</span>
                <span>•</span>
                <span>Last active: {new Date(profile?.updated_at || profile?.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Button (only for own profile) */}
          {isOwnProfile && (
            <button className="btn btn-primary">
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs - Similar to Admin Dashboard */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['overview', 'activity', 'statistics', 'achievements'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Statistics Grid - Matching Admin Stats Design */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Matches Viewed */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">🎮</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {userStats?.matches_viewed || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Matches Viewed</div>
                </div>

                {/* Comments Posted */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userStats?.comments_posted || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
                </div>

                {/* Forum Activity */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {(userStats?.forum_threads || 0) + (userStats?.forum_posts || 0)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
                </div>

                {/* Teams Followed */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">🏆</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {userStats?.teams_followed || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Teams Followed</div>
                </div>
              </div>

              {/* Role-Specific Stats */}
              {profile?.role === 'admin' && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">Admin Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {userStats?.admin_actions || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Admin Actions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {userStats?.users_managed || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Users Managed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {userStats?.content_moderated || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Content Moderated</div>
                    </div>
                  </div>
                </div>
              )}

              {profile?.role === 'moderator' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-300 mb-4">Moderator Statistics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {userStats?.posts_moderated || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Posts Moderated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {userStats?.warnings_issued || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Warnings Issued</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {userStats?.reports_handled || 0}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Reports Handled</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              {recentActivity.length > 0 ? (
                <div className="space-y-3">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
              )}
            </div>
          )}

          {activeTab === 'statistics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Statistics</h3>
              
              {/* Engagement Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Engagement Metrics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Views</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats?.total_views || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Likes Received</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats?.likes_received || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Replies</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats?.replies_count || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Mentions</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats?.mentions_count || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prediction Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Prediction Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Predictions</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {userStats?.predictions_made || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {userStats?.predictions_correct || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Accuracy</div>
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {userStats?.predictions_made > 0 
                        ? Math.round((userStats?.predictions_correct || 0) / userStats.predictions_made * 100) 
                        : 0}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Achievements</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Sample achievements */}
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">🏅</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">First Comment</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">10 Predictions</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-50">
                  <div className="text-3xl mb-2">🔥</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">100 Posts</div>
                </div>
                <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg opacity-50">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">Top Contributor</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;