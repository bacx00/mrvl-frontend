import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getHeroImageSync } from '../../utils/imageUtils';
import { createErrorHandler, retryOperation, ERROR_CODES } from '../../utils/errorHandler';
import ErrorBoundary from '../shared/ErrorBoundary';
import TeamSelector from '../shared/TeamSelector';

function ComprehensiveUserProfile({ navigateTo }) {
  const { user, api } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: '',
    hero_avatar: '',
    team_flair: '',
    show_hero_flair: true,
    show_team_flair: true
  });
  const [loading, setLoading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [userStats, setUserStats] = useState({
    comments: { total: 0, news: 0, matches: 0 },
    forum: { total: 0, threads: 0, posts: 0 },
    votes: { upvotes_given: 0, downvotes_given: 0, upvotes_received: 0, downvotes_received: 0, reputation_score: 0 },
    mentions: { given: 0, received: 0, player_mentions: 0, team_mentions: 0, user_mentions: 0 },
    activity: { total_actions: 0, last_activity: null, activity_score: 0 },
    account: { days_active: 0, last_seen: null, join_date: null },
    recent_activity: []
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [emailChangeData, setEmailChangeData] = useState({
    new_email: '',
    password: ''
  });
  const [usernameChangeData, setUsernameChangeData] = useState({
    new_name: '',
    password: ''
  });
  const [teams, setTeams] = useState([]);
  const [errors, setErrors] = useState({});
  const [retryAttempts, setRetryAttempts] = useState({});
  
  // Error handler for API calls
  const handleError = createErrorHandler({
    context: { component: 'ComprehensiveUserProfile', userId: user?.id },
    onError: (errorInfo) => {
      setErrors(prev => ({
        ...prev,
        [errorInfo.context?.operation || 'general']: {
          message: errorInfo.message,
          code: errorInfo.code,
          retryable: errorInfo.retryable,
          timestamp: Date.now()
        }
      }));
    }
  });

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        hero_avatar: user.hero_avatar || '',
        team_flair: user.team_flair_id || user.team_flair || '',
        show_hero_flair: user.show_hero_flair !== false,
        show_team_flair: user.show_team_flair !== false
      }));
    }
  }, [user]);

  const [availableHeroes, setAvailableHeroes] = useState({
    Vanguard: [],
    Duelist: [],
    Strategist: []
  });

  const fetchRealUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive user stats, activity, teams, and heroes from separate endpoints
      const [statsResponse, activityResponse, teamsResponse, heroesResponse] = await Promise.all([
        api.get('/user/stats').catch(() => ({ data: { stats: {} } })),
        api.get('/user/activity').catch(() => ({ data: { activities: [] } })),
        api.get('/teams').catch(() => ({ data: [] })),
        api.get('/public/heroes/images/all').catch(() => api.get('/heroes/images/all')).catch(() => ({ data: {} }))
      ]);

      const statsData = statsResponse.data?.data || statsResponse.data || {};
      const activityData = activityResponse.data?.data || activityResponse.data || {};
      const stats = statsData.stats || {};
      
      setUserStats({
        comments: stats.comments || { total: 0, news: 0, matches: 0 },
        forum: stats.forum || { total: 0, threads: 0, posts: 0 },
        votes: stats.votes || { upvotes_given: 0, downvotes_given: 0, upvotes_received: 0, downvotes_received: 0, reputation_score: 0 },
        mentions: stats.mentions || { given: 0, received: 0, player_mentions: 0, team_mentions: 0, user_mentions: 0 },
        activity: stats.activity || { total_actions: 0, last_activity: null, activity_score: 0 },
        account: stats.account || { days_active: 0, last_seen: null, join_date: null },
        recent_activity: activityData.activities || []
      });

      setTeams(teamsResponse.data?.data || teamsResponse.data || []);
      
      // Process heroes data
      const heroesData = heroesResponse.data?.data || heroesResponse.data || {};
      if (typeof heroesData === 'object' && !Array.isArray(heroesData)) {
        setAvailableHeroes(heroesData);
      } else {
        // Fallback to static data if API fails
        setAvailableHeroes({
          'Vanguard': [
            { name: 'Captain America' }, { name: 'Doctor Strange' }, { name: 'Groot' }, 
            { name: 'Hulk' }, { name: 'Magneto' }, { name: 'Peni Parker' }, 
            { name: 'Thor' }, { name: 'Venom' }, { name: 'Emma Frost' }, { name: 'Mr. Fantastic' }
          ],
          'Duelist': [
            { name: 'Black Panther' }, { name: 'Black Widow' }, { name: 'Hawkeye' }, 
            { name: 'Hela' }, { name: 'Iron Man' }, { name: 'Magik' }, { name: 'Moon Knight' }, 
            { name: 'Namor' }, { name: 'Psylocke' }, { name: 'Punisher' }, { name: 'Scarlet Witch' }, 
            { name: 'Spider-Man' }, { name: 'Star-Lord' }, { name: 'Storm' }, { name: 'Winter Soldier' }, 
            { name: 'Wolverine' }, { name: 'Iron Fist' }, { name: 'Squirrel Girl' }
          ],
          'Strategist': [
            { name: 'Adam Warlock' }, { name: 'Cloak & Dagger' }, { name: 'Jeff the Land Shark' }, 
            { name: 'Loki' }, { name: 'Luna Snow' }, { name: 'Mantis' }, { name: 'Rocket Raccoon' }
          ]
        });
      }

    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRealUserData();
  }, [fetchRealUserData]);

  const getHeroImage = (heroName) => {
    if (!heroName) return null;
    return getHeroImageSync(heroName);
  };

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match!');
      return;
    }

    if (passwordData.new_password.length < 8) {
      alert('Password must be at least 8 characters long!');
      return;
    }

    try {
      setLoading(true);
      
      await api.post('/user/profile/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.confirm_password
      });

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      alert('Password updated successfully!');
      
    } catch (error) {
      const errorInfo = handleError(error);
      setErrors(prev => ({ ...prev, password: errorInfo }));
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async () => {
    if (!emailChangeData.new_email || !emailChangeData.password) {
      alert('Please provide both new email and current password!');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/user/profile/change-email', {
        new_email: emailChangeData.new_email,
        password: emailChangeData.password
      });

      setProfileData(prev => ({ ...prev, email: response.data?.data?.email || emailChangeData.new_email }));
      setEmailChangeData({ new_email: '', password: '' });
      // Email is updated in the profile data above
      alert('Email updated successfully!');
      
    } catch (error) {
      console.error('Error updating email:', error);
      alert(error.response?.data?.message || 'Failed to update email. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  const changeUsername = async () => {
    if (!usernameChangeData.new_name || !usernameChangeData.password) {
      alert('Please provide both new username and current password!');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/user/profile/change-username', {
        new_name: usernameChangeData.new_name,
        password: usernameChangeData.password
      });

      setProfileData(prev => ({ ...prev, name: response.data?.data?.name || usernameChangeData.new_name }));
      setUsernameChangeData({ new_name: '', password: '' });
      // Username is updated in the profile data above
      alert('Username updated successfully!');
      
    } catch (error) {
      console.error('Error updating username:', error);
      alert(error.response?.data?.message || 'Failed to update username. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  // Custom avatar upload is disabled - only hero avatars are allowed

  const updateFlairs = async () => {
    try {
      setLoading(true);
      
      const response = await api.put('/user/profile/flairs', {
        hero_flair: profileData.hero_avatar,
        team_flair_id: profileData.team_flair,
        show_hero_flair: profileData.show_hero_flair,
        show_team_flair: profileData.show_team_flair
      });

      // Update local profile data with the response
      if (response.data) {
        setProfileData(prev => ({
          ...prev,
          hero_avatar: response.data.hero_flair || '',
          team_flair: response.data.team_flair_id || '',
          show_hero_flair: response.data.show_hero_flair,
          show_team_flair: response.data.show_team_flair
        }));
      }
      
      alert('Flairs updated successfully!');
      
    } catch (error) {
      console.error('Error updating flairs:', error);
      alert('Failed to update flairs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Login Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to view your profile.
          </p>
          <button 
            onClick={() => {
              window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'));
            }}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign In / Sign Up
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          User Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile image, flairs, email, password, and username
        </p>
      </div>

      {/* Profile Header Card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              {profileData.hero_avatar && getHeroImage(profileData.hero_avatar) ? (
                <img 
                  src={getHeroImage(profileData.hero_avatar)} 
                  alt={profileData.hero_avatar}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Hide the hero image and show fallback when it fails to load
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              {profileData.avatar ? (
                <img 
                  src={profileData.avatar} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                  style={{ display: (profileData.hero_avatar && getHeroImage(profileData.hero_avatar)) ? 'none' : 'block' }}
                  onError={(e) => {
                    // Hide the avatar and show fallback when it fails to load
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.avatar-fallback');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="avatar-fallback w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-3xl"
                style={{ 
                  display: (profileData.hero_avatar && getHeroImage(profileData.hero_avatar)) || profileData.avatar ? 'none' : 'flex' 
                }}
              >
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{profileData.name}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{profileData.email}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowAvatarSelector(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Hero Avatar
              </button>
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center">
                Only hero avatars allowed
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Flairs & Display */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Flairs & Display</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Team Flair
                </label>
                <TeamSelector
                  teams={teams}
                  selectedTeamId={profileData.team_flair}
                  onTeamSelect={(team) => {
                    setProfileData(prev => ({ 
                      ...prev, 
                      team_flair: team ? team.id : '' 
                    }));
                  }}
                  disabled={loading}
                  placeholder="Choose your favorite team..."
                  showSearch={true}
                  showRegions={true}
                  showPopular={true}
                  showRecent={true}
                  loading={loading}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="show_hero_flair"
                    checked={profileData.show_hero_flair}
                    onChange={(e) => setProfileData(prev => ({ ...prev, show_hero_flair: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="show_hero_flair" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Show Hero Flair
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="show_team_flair"
                    checked={profileData.show_team_flair}
                    onChange={(e) => setProfileData(prev => ({ ...prev, show_team_flair: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="show_team_flair" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Show Team Flair
                  </label>
                </div>
              </div>
              <button
                onClick={updateFlairs}
                disabled={loading}
                className="btn bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 w-full"
              >
                {loading ? 'Updating...' : 'Update Flairs'}
              </button>
            </div>
          </div>

          {/* Account Security */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Security</h3>
            
            {/* Change Password */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Change Password</h4>
              <div className="space-y-3">
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  className="form-input"
                  placeholder="Current password"
                />
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="form-input"
                  placeholder="New password (min 8 characters)"
                />
                <input
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
                  className="form-input"
                  placeholder="Confirm new password"
                />
              </div>
              <button
                onClick={changePassword}
                disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 w-full mt-3"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>

            {/* Change Email */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Change Email</h4>
              <div className="space-y-3">
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="form-input bg-gray-100 dark:bg-gray-700 text-gray-500"
                  placeholder="Current email"
                />
                <input
                  type="email"
                  value={emailChangeData.new_email}
                  onChange={(e) => setEmailChangeData(prev => ({ ...prev, new_email: e.target.value }))}
                  className="form-input"
                  placeholder="New email address"
                />
                <input
                  type="password"
                  value={emailChangeData.password}
                  onChange={(e) => setEmailChangeData(prev => ({ ...prev, password: e.target.value }))}
                  className="form-input"
                  placeholder="Current password to confirm"
                />
              </div>
              <button
                onClick={changeEmail}
                disabled={loading || !emailChangeData.new_email || !emailChangeData.password}
                className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 w-full mt-3"
              >
                {loading ? 'Updating...' : 'Update Email'}
              </button>
            </div>

            {/* Change Username */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Change Username</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  value={profileData.name}
                  disabled
                  className="form-input bg-gray-100 dark:bg-gray-700 text-gray-500"
                  placeholder="Current username"
                />
                <input
                  type="text"
                  value={usernameChangeData.new_name}
                  onChange={(e) => setUsernameChangeData(prev => ({ ...prev, new_name: e.target.value }))}
                  className="form-input"
                  placeholder="New username"
                />
                <input
                  type="password"
                  value={usernameChangeData.password}
                  onChange={(e) => setUsernameChangeData(prev => ({ ...prev, password: e.target.value }))}
                  className="form-input"
                  placeholder="Current password to confirm"
                />
              </div>
              <button
                onClick={changeUsername}
                disabled={loading || !usernameChangeData.new_name || !usernameChangeData.password}
                className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 w-full mt-3"
              >
                {loading ? 'Updating...' : 'Update Username'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Real Stats */}
        <div className="space-y-6">
          {/* User Statistics */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats.comments.total}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
                <div className="text-xs text-gray-500 mt-1">
                  News: {userStats.comments.news} • Matches: {userStats.comments.matches}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{userStats.forum.posts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
                <div className="text-xs text-gray-500 mt-1">
                  Threads: {userStats.forum.threads}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userStats.mentions.given}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Mentions Given</div>
                <div className="text-xs text-gray-500 mt-1">
                  Received: {userStats.mentions.received}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userStats.account.days_active}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
                <div className="text-xs text-gray-500 mt-1">
                  Score: {userStats.activity.activity_score}
                </div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Voting & Engagement</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-600">{userStats.votes.upvotes_given}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Upvotes Given</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-rose-600">{userStats.votes.downvotes_given}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Downvotes Given</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-indigo-600">{userStats.votes.reputation_score}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Reputation</div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-lg font-bold text-emerald-600">{userStats.votes.upvotes_received}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Upvotes Received</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-rose-600">{userStats.votes.downvotes_received}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Downvotes Received</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {userStats.recent_activity && userStats.recent_activity.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {userStats.recent_activity.slice(0, 10).map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{activity.action}</span>
                        {activity.content && (
                          <span className="text-gray-600 dark:text-gray-400 ml-2">
                            "{activity.content.length > 40 ? activity.content.substring(0, 40) + '...' : activity.content}"
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {new Date(activity.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Hero Avatar Selector Modal */}
      {showAvatarSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Choose Hero Avatar</h3>
            {loading && (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Saving hero selection...</p>
              </div>
            )}
            <div className="space-y-6">
              {Object.entries(availableHeroes).map(([role, heroes]) => (
                <div key={role}>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                      role === 'Vanguard' ? 'bg-blue-500' : 
                      role === 'Duelist' ? 'bg-red-500' : 
                      'bg-green-500'
                    }`}></span>
                    {role} ({heroes.length} heroes)
                  </h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {heroes.map(hero => (
                      <button
                        key={hero.name}
                        onClick={() => {
                          setProfileData(prev => ({ 
                            ...prev, 
                            hero_avatar: hero.name
                          }));
                          setShowAvatarSelector(false);
                        }}
                        disabled={loading}
                        className={`relative group ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className="w-full h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                          {getHeroImage(hero.name) ? (
                            <img 
                              src={getHeroImage(hero.name)} 
                              alt={hero.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                console.log('❌ Hero image failed to load:', hero.name);
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.hero-text-fallback').style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log('✅ Hero image loaded:', hero.name);
                              }}
                            />
                          ) : null}
                          <div 
                            className="hero-text-fallback w-full h-full flex items-center justify-center text-xs text-gray-600 dark:text-gray-400"
                            style={{ display: getHeroImage(hero.name) ? 'none' : 'flex' }}
                          >
                            {hero.name}
                          </div>
                        </div>
                        <div className="text-xs mt-1 text-center text-gray-700 dark:text-gray-300">{hero.name}</div>
                        {profileData.hero_avatar === hero.name && (
                          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            ✓
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Object.values(availableHeroes).flat().length} heroes available
              </div>
              <button
                onClick={() => setShowAvatarSelector(false)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {loading ? 'Please Wait...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComprehensiveUserProfile;