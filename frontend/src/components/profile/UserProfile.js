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
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Use current user if no userId provided
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchAllData();
      
      // Set up real-time updates every 30 seconds
      const interval = setInterval(() => {
        fetchAllData();
        setLastUpdated(new Date());
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [targetUserId]);

  const fetchAllData = async () => {
    await Promise.all([
      fetchUserProfile(),
      fetchUserStats(),
      fetchRecentActivity()
    ]);
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/api/users/${targetUserId}`);
      const data = response.data?.data || response.data || response;
      setProfileData(data);
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
      const response = await api.get(`/api/users/${targetUserId}/stats`);
      const data = response.data?.data || response.data || response;
      
      // Ensure we have all required stats fields
      setUserStats({
        news_comments: data.news_comments || data.comments?.news || 0,
        match_comments: data.match_comments || data.comments?.matches || 0,
        forum_threads: data.forum_threads || data.forum?.threads || 0,
        forum_posts: data.forum_posts || data.forum?.posts || 0,
        total_comments: data.total_comments || data.comments?.total || 0,
        total_forum: data.total_forum || data.forum?.total || 0,
        upvotes_given: data.upvotes_given || data.votes?.upvotes_given || 0,
        downvotes_given: data.downvotes_given || data.votes?.downvotes_given || 0,
        upvotes_received: data.upvotes_received || data.votes?.upvotes_received || 0,
        downvotes_received: data.downvotes_received || data.votes?.downvotes_received || 0,
        reputation_score: data.reputation_score || data.votes?.reputation_score || 0,
        mentions_given: data.mentions_given || data.mentions?.given || 0,
        mentions_received: data.mentions_received || data.mentions?.received || 0,
        activity_score: data.activity_score || data.activity?.activity_score || 0,
        total_actions: data.total_actions || data.activity?.total_actions || 0,
        days_active: data.days_active || data.account?.days_active || 0,
        last_activity: data.last_activity || data.activity?.last_activity || null,
        join_date: data.join_date || data.account?.join_date || profileData?.created_at || null
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats
      setUserStats({
        news_comments: 0,
        match_comments: 0,
        forum_threads: 0,
        forum_posts: 0,
        total_comments: 0,
        total_forum: 0,
        upvotes_given: 0,
        downvotes_given: 0,
        upvotes_received: 0,
        downvotes_received: 0,
        reputation_score: 0,
        mentions_given: 0,
        mentions_received: 0,
        activity_score: 0,
        total_actions: 0,
        days_active: 0,
        last_activity: null,
        join_date: null
      });
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await api.get(`/api/users/${targetUserId}/activities`);
      const data = response.data?.data || response.data || [];
      setRecentActivity(Array.isArray(data) ? data : []);
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
      {/* Live Update Indicator */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Live updates every 30 seconds</span>
        </div>
        <span>Updated: {lastUpdated.toLocaleTimeString()}</span>
      </div>

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
                <span>Joined: {userStats?.join_date ? new Date(userStats.join_date).toLocaleDateString() : 'N/A'}</span>
                <span>•</span>
                <span>Active for {userStats?.days_active || 0} days</span>
                <span>•</span>
                <span>Last active: {userStats?.last_activity ? new Date(userStats.last_activity).toLocaleDateString() : 'Never'}</span>
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
                {/* Forum Threads */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">📚</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {userStats?.forum_threads || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Forum Threads</div>
                </div>

                {/* Forum Posts */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">📝</div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {userStats?.forum_posts || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
                </div>

                {/* Comments */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">💬</div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {userStats?.total_comments || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
                </div>

                {/* Days Active */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">📅</div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {userStats?.days_active || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
                </div>
              </div>

              {/* Additional Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                {/* Activity Score */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">⚡</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {userStats?.activity_score || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Activity Score</div>
                </div>

                {/* Reputation */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">⭐</div>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {userStats?.reputation_score || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
                </div>

                {/* Mentions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">@</div>
                  <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {userStats?.mentions_received || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Mentions</div>
                </div>

                {/* Total Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
                  <div className="text-3xl mb-2">🎯</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {userStats?.total_actions || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Actions</div>
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