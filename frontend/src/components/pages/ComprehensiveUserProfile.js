import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getHeroImageSync } from '../../utils/imageUtils';

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
    total_comments: 0,
    total_forum_posts: 0,
    total_forum_threads: 0,
    total_votes: 0,
    upvotes_given: 0,
    downvotes_given: 0,
    upvotes_received: 0,
    downvotes_received: 0,
    days_active: 0,
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

  const marvelHeroes = {
    Vanguard: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Peni Parker', 'Thor', 'Venom', 'Emma Frost', 'Bruce Banner', 'Mr. Fantastic'],
    Duelist: ['Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Iron Man', 'Magik', 'Moon Knight', 'Namor', 'Psylocke', 'Punisher', 'Scarlet Witch', 'Spider-Man', 'Star-Lord', 'Storm', 'Winter Soldier', 'Wolverine', 'Iron Fist', 'Squirrel Girl'],
    Strategist: ['Adam Warlock', 'Cloak & Dagger', 'Jeff the Land Shark', 'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon']
  };

  const fetchRealUserData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive user stats and activity from separate endpoints
      const [statsResponse, activityResponse, teamsResponse] = await Promise.all([
        api.get('/user/stats').catch(() => ({ data: { stats: {} } })),
        api.get('/user/activity').catch(() => ({ data: { activities: [] } })),
        api.get('/teams').catch(() => ({ data: [] }))
      ]);

      const statsData = statsResponse.data?.data || statsResponse.data || {};
      const activityData = activityResponse.data?.data || activityResponse.data || {};
      const stats = statsData.stats || {};
      
      setUserStats({
        total_comments: stats.total_comments || 0,
        total_forum_posts: stats.total_forum_posts || 0,
        total_forum_threads: stats.total_forum_threads || 0,
        total_votes: stats.total_votes || 0,
        upvotes_given: stats.upvotes_given || 0,
        downvotes_given: stats.downvotes_given || 0,
        upvotes_received: stats.upvotes_received || 0,
        downvotes_received: stats.downvotes_received || 0,
        days_active: stats.days_active || 0,
        recent_activity: activityData.activities || []
      });

      setTeams(teamsResponse.data?.data || teamsResponse.data || []);

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
      console.error('Error updating password:', error);
      alert(error.response?.data?.message || 'Failed to update password. Please check your current password.');
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
                <select
                  value={profileData.team_flair}
                  onChange={(e) => setProfileData(prev => ({ ...prev, team_flair: e.target.value }))}
                  className="form-input"
                >
                  <option value="">No team flair</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.short_name})
                    </option>
                  ))}
                </select>
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
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userStats.total_comments}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{userStats.total_forum_posts}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userStats.total_forum_threads}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Threads</div>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">{userStats.days_active}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Voting Statistics</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{userStats.upvotes_given}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Upvotes Given</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-600">{userStats.downvotes_given}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Downvotes Given</div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Received Votes</h4>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-2xl font-bold text-emerald-600">{userStats.upvotes_received}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Upvotes Received</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-600">{userStats.downvotes_received}</div>
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
            <div className="space-y-6">
              {Object.entries(marvelHeroes).map(([role, heroes]) => (
                <div key={role}>
                  <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{role}</h4>
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                    {heroes.map(hero => (
                      <button
                        key={hero}
                        onClick={() => {
                          setProfileData(prev => ({ 
                            ...prev, 
                            hero_avatar: hero
                          }));
                          setShowAvatarSelector(false);
                        }}
                        className="relative group"
                      >
                        <div className="w-full h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
                          {getHeroImage(hero) ? (
                            <img 
                              src={getHeroImage(hero)} 
                              alt={hero}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                              onError={(e) => {
                                // Hide the image and show text fallback when image fails to load
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.hero-text-fallback').style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="hero-text-fallback w-full h-full flex items-center justify-center text-xs text-gray-600 dark:text-gray-400"
                            style={{ display: getHeroImage(hero) ? 'none' : 'flex' }}
                          >
                            {hero}
                          </div>
                        </div>
                        <div className="text-xs mt-1 text-center text-gray-700 dark:text-gray-300">{hero}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAvatarSelector(false)}
              className="mt-6 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComprehensiveUserProfile;