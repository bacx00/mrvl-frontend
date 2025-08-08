import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import HeroImage from '../shared/HeroImage';

function UserProfile({ navigateTo }) {
  const { user, api, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: '',
    hero_avatar: '',
    bio: '',
    favorite_hero: '',
    preferred_role: '',
    region: '',
    country: '',
    team_flair: '',
    notifications: {
      match_updates: true,
      forum_replies: true,
      news_alerts: false,
      event_reminders: true
    },
    privacy: {
      show_email: false,
      show_online_status: true,
      allow_direct_messages: true
    }
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [userActivity, setUserActivity] = useState({
    total_comments: 0,
    total_forum_posts: 0,
    total_matches_viewed: 0,
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
  const [teamFlairSelector, setTeamFlairSelector] = useState(false);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        hero_avatar: user.hero_avatar || '',
        bio: user.bio || '',
        favorite_hero: user.favorite_hero || '',
        preferred_role: user.preferred_role || '',
        region: user.region || '',
        country: user.country || 'US',
        team_flair: user.team_flair || ''
      }));
    }
  }, [user]);

  const marvelHeroes = {
    Vanguard: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Peni Parker', 'Thor', 'Venom', 'Emma Frost', 'Bruce Banner', 'Mr. Fantastic'],
    Duelist: ['Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Iron Man', 'Magik', 'Moon Knight', 'Namor', 'Psylocke', 'Punisher', 'Scarlet Witch', 'Spider-Man', 'Star-Lord', 'Storm', 'Winter Soldier', 'Wolverine', 'Iron Fist', 'Squirrel Girl'],
    Strategist: ['Adam Warlock', 'Cloak & Dagger', 'Jeff the Land Shark', 'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon']
  };

  const roles = [
    { id: 'Vanguard', name: 'Vanguard' },
    { id: 'Duelist', name: 'Duelist' },
    { id: 'Strategist', name: 'Strategist' }
  ];

  const countries = [
    'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI',
    'AU', 'NZ', 'JP', 'KR', 'CN', 'TW', 'SG', 'TH', 'VN', 'ID', 'MY', 'PH',
    'BR', 'AR', 'CL', 'CO', 'PE', 'MX', 'RU', 'PL', 'CZ', 'HU', 'RO', 'BG',
    'IN', 'PK', 'BD', 'LK', 'NP', 'ZA', 'EG', 'MA', 'NG', 'KE', 'GH', 'TN'
  ];

  const fetchUserActivity = useCallback(async () => {
    try {
      const response = await api.get('/user/profile/activity');
      const data = response.data?.data || response.data;
      setUserActivity({
        total_comments: data.stats?.total_comments || 0,
        total_forum_posts: data.stats?.total_forum_posts || 0,
        total_forum_threads: data.stats?.total_forum_threads || 0,
        total_votes: data.stats?.total_votes || 0,
        upvotes_given: data.stats?.upvotes_given || 0,
        downvotes_given: data.stats?.downvotes_given || 0,
        days_active: data.stats?.days_active || 0,
        recent_activity: data.activities || []
      });
    } catch (error) {
      console.error('Error fetching user activity:', error);
    }
  }, [api]);

  const fetchTeams = useCallback(async () => {
    try {
      const response = await api.get('/teams');
      setTeams(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [api]);

  useEffect(() => {
    fetchUserActivity();
    fetchTeams();
  }, [fetchUserActivity, fetchTeams]);


  const getCountryFlag = (countryCode) => {
    return `https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`;
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        name: profileData.name,
        bio: profileData.bio,
        favorite_hero: profileData.favorite_hero,
        preferred_role: profileData.preferred_role,
        region: profileData.region,
        country: profileData.country,
        team_flair: profileData.team_flair,
        hero_avatar: profileData.hero_avatar
      };

      await api.put('/user/profile', updateData);
      await updateUser();
      alert('Profile updated successfully!');
      
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
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
      
      const response = await api.post('/user/profile/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.confirm_password
      });

      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });

      alert(response.data?.message || 'Password updated successfully!');
      
    } catch (error) {
      console.error('Error updating password:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update password. Please check your current password.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = async (newEmail, password) => {
    if (!newEmail || !password) {
      alert('Please provide both new email and current password!');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/user/profile/change-email', {
        new_email: newEmail,
        password: password
      });

      setProfileData(prev => ({ ...prev, email: response.data?.data?.email || newEmail }));
      alert(response.data?.message || 'Email updated successfully!');
      
    } catch (error) {
      console.error('Error updating email:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update email. Please check your password.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const changeUsername = async (newName, password) => {
    if (!newName || !password) {
      alert('Please provide both new username and current password!');
      return;
    }

    try {
      setLoading(true);
      
      const response = await api.post('/user/profile/change-username', {
        new_name: newName,
        password: password
      });

      setProfileData(prev => ({ ...prev, name: response.data?.data?.name || newName }));
      alert(response.data?.message || 'Username updated successfully!');
      
    } catch (error) {
      console.error('Error updating username:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update username. Please check your password.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setLoading(true);
      await api.put('/user/notifications', profileData.notifications);
      alert('Notification preferences updated!');
    } catch (error) {
      console.error('Error updating notifications:', error);
      alert('Failed to update notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacy = async () => {
    try {
      setLoading(true);
      await api.put('/user/privacy', profileData.privacy);
      alert('Privacy settings updated!');
    } catch (error) {
      console.error('Error updating privacy:', error);
      alert('Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      // Use the dedicated postFile method which handles Bearer token authentication correctly
      const response = await api.postFile('/user/profile/upload-avatar', formData);
      
      const avatarUrl = response.data?.data?.avatar || response.data?.avatar;
      setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
      
      alert('Avatar uploaded successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile' },
    { id: 'security', name: 'Security' },
    { id: 'notifications', name: 'Notifications' },
    { id: 'privacy', name: 'Privacy' },
    { id: 'activity', name: 'Activity' }
  ];

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Profile Picture</h3>
        <div className="flex items-center space-x-6">
          <div className="relative">
            {profileData.hero_avatar ? (
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <HeroImage 
                  heroName={profileData.hero_avatar}
                  size="2xl"
                  className="w-full h-full"
                />
              </div>
            ) : profileData.avatar ? (
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <img 
                  src={profileData.avatar} 
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {profileData.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose Hero Avatar
            </button>
            <label className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-center">
              Upload Custom
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files[0] && uploadAvatar(e.target.files[0])}
                className="hidden"
              />
            </label>
            {uploading && <div className="text-sm text-gray-600 dark:text-gray-400">Uploading...</div>}
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Display Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="form-input"
              placeholder="Enter your display name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
              className="form-input"
              placeholder="Enter your email"
            />
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
            Bio
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
            className="form-input"
            rows="3"
            placeholder="Tell us about yourself..."
          />
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Gaming Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Favorite Hero
            </label>
            <select
              value={profileData.favorite_hero}
              onChange={(e) => setProfileData(prev => ({ ...prev, favorite_hero: e.target.value }))}
              className="form-input"
            >
              <option value="">Select hero...</option>
              {Object.entries(marvelHeroes).map(([role, heroes]) => (
                <optgroup key={role} label={role}>
                  {heroes.map(hero => (
                    <option key={hero} value={hero}>{hero}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Preferred Role
            </label>
            <select
              value={profileData.preferred_role}
              onChange={(e) => setProfileData(prev => ({ ...prev, preferred_role: e.target.value }))}
              className="form-input"
            >
              <option value="">Select role...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Regional & Team Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Country
            </label>
            <select
              value={profileData.country}
              onChange={(e) => setProfileData(prev => ({ ...prev, country: e.target.value }))}
              className="form-input"
            >
              {countries.map(country => (
                <option key={country} value={country}>
                  {country.toUpperCase()}
                </option>
              ))}
            </select>
            {profileData.country && (
              <div className="mt-2 flex items-center space-x-2">
                <img src={getCountryFlag(profileData.country)} alt={profileData.country} className="w-6 h-4" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Selected Country</span>
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Team Flair
            </label>
            <div className="flex space-x-2">
              <select
                value={profileData.team_flair}
                onChange={(e) => setProfileData(prev => ({ ...prev, team_flair: e.target.value }))}
                className="form-input flex-1"
              >
                <option value="">No team flair</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.short_name})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setTeamFlairSelector(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse
              </button>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={saveProfile}
        disabled={loading}
        className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 w-full md:w-auto"
      >
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Current Password
            </label>
            <input
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
              className="form-input"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              New Password
            </label>
            <input
              type="password"
              value={passwordData.new_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
              className="form-input"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwordData.confirm_password}
              onChange={(e) => setPasswordData(prev => ({ ...prev, confirm_password: e.target.value }))}
              className="form-input"
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <button
          onClick={changePassword}
          disabled={loading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
          className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 mt-6"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      {/* Change Email */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Email</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Current Email
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="form-input bg-gray-100 dark:bg-gray-700 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              New Email
            </label>
            <input
              type="email"
              value={emailChangeData.new_email}
              onChange={(e) => setEmailChangeData(prev => ({ ...prev, new_email: e.target.value }))}
              className="form-input"
              placeholder="Enter new email address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Current Password
            </label>
            <input
              type="password"
              value={emailChangeData.password}
              onChange={(e) => setEmailChangeData(prev => ({ ...prev, password: e.target.value }))}
              className="form-input"
              placeholder="Enter current password to confirm"
            />
          </div>
        </div>
        <button
          onClick={() => changeEmail(emailChangeData.new_email, emailChangeData.password)}
          disabled={loading || !emailChangeData.new_email || !emailChangeData.password}
          className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 mt-6"
        >
          {loading ? 'Updating...' : 'Update Email'}
        </button>
      </div>

      {/* Change Username */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Change Username</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Current Username
            </label>
            <input
              type="text"
              value={profileData.name}
              disabled
              className="form-input bg-gray-100 dark:bg-gray-700 text-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              New Username
            </label>
            <input
              type="text"
              value={usernameChangeData.new_name}
              onChange={(e) => setUsernameChangeData(prev => ({ ...prev, new_name: e.target.value }))}
              className="form-input"
              placeholder="Enter new username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Current Password
            </label>
            <input
              type="password"
              value={usernameChangeData.password}
              onChange={(e) => setUsernameChangeData(prev => ({ ...prev, password: e.target.value }))}
              className="form-input"
              placeholder="Enter current password to confirm"
            />
          </div>
        </div>
        <button
          onClick={() => changeUsername(usernameChangeData.new_name, usernameChangeData.password)}
          disabled={loading || !usernameChangeData.new_name || !usernameChangeData.password}
          className="btn bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 mt-6"
        >
          {loading ? 'Updating...' : 'Update Username'}
        </button>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        {Object.entries({
          match_updates: 'Match Updates',
          forum_replies: 'Forum Replies',
          news_alerts: 'News Alerts',
          event_reminders: 'Event Reminders'
        }).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{label}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Get notified about {label.toLowerCase()}
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={profileData.notifications[key]}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  notifications: { ...prev.notifications, [key]: e.target.checked }
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={saveNotifications}
        disabled={loading}
        className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 mt-6"
      >
        {loading ? 'Saving...' : 'Save Notifications'}
      </button>
    </div>
  );

  const renderPrivacy = () => (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
      <div className="space-y-4">
        {Object.entries({
          show_email: 'Show Email Address',
          show_online_status: 'Show Online Status',
          allow_direct_messages: 'Allow Direct Messages'
        }).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">{label}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Control who can see your {label.toLowerCase()}
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={profileData.privacy[key]}
                onChange={(e) => setProfileData(prev => ({
                  ...prev,
                  privacy: { ...prev.privacy, [key]: e.target.checked }
                }))}
              />
              <span className="slider"></span>
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={savePrivacy}
        disabled={loading}
        className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 mt-6"
      >
        {loading ? 'Saving...' : 'Save Privacy'}
      </button>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{userActivity.total_comments}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{userActivity.total_forum_posts}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{userActivity.total_forum_threads}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Threads Created</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">{userActivity.days_active}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{userActivity.total_votes}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Votes</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{userActivity.upvotes_given}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Upvotes Given</div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">{userActivity.downvotes_given}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Downvotes Given</div>
          </div>
        </div>
      </div>

      {userActivity.recent_activity && userActivity.recent_activity.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {userActivity.recent_activity.map((activity, idx) => (
              <div key={idx} className="flex items-start space-x-3 pb-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <div className="flex-shrink-0 w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{activity.action}</span>
                    {activity.content && (
                      <span className="text-gray-600 dark:text-gray-400 ml-2">
                        "{activity.content.length > 50 ? activity.content.substring(0, 50) + '...' : activity.content}"
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{new Date(activity.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'security': return renderSecurity();
      case 'notifications': return renderNotifications();
      case 'privacy': return renderPrivacy();
      case 'activity': return renderActivity();
      default: return renderProfile();
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          User Profile
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your profile, preferences, and account settings
        </p>
      </div>

      <div className="card p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
      
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
                        <div className="w-full h-20 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <HeroImage 
                            heroName={hero}
                            size="xl"
                            className="w-full h-full"
                          />
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

export default UserProfile;