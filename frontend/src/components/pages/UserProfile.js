import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import HeroAvatarSelector from '../HeroAvatarSelector';

function UserProfile({ navigateTo }) {
  const { user, api, updateUser } = useAuth();
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: '',
    bio: '',
    favoriteHero: '',
    preferredRole: '',
    region: '',
    notifications: {
      matchUpdates: true,
      forumReplies: true,
      newsAlerts: false,
      eventReminders: true
    },
    privacy: {
      showEmail: false,
      showOnlineStatus: true,
      allowDirectMessages: true
    },
    theme: 'auto'
  });
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        bio: user.bio || '',
        favoriteHero: user.favoriteHero || '',
        preferredRole: user.preferredRole || '',
        region: user.region || '',
        theme: localStorage.getItem('mrvl_theme') || 'auto'
      }));
    }
  }, [user]);

  const marvelHeroes = [
    'Iron Man', 'Spider-Man', 'Captain America', 'Thor', 'Hulk', 'Black Widow',
    'Hawkeye', 'Doctor Strange', 'Scarlet Witch', 'Vision', 'Falcon', 'War Machine',
    'Ant-Man', 'Wasp', 'Captain Marvel', 'Black Panther', 'Star-Lord', 'Rocket Raccoon',
    'Groot', 'Gamora', 'Drax', 'Mantis', 'Storm', 'Magneto', 'Wolverine', 'Cyclops'
  ];

  const roles = [
    { id: 'tank', name: 'Tank', icon: '🛡️' },
    { id: 'duelist', name: 'Duelist', icon: '⚔️' },
    { id: 'support', name: 'Support', icon: '💚' }
  ];

  const regions = [
    'North America', 'Europe', 'Asia Pacific', 'South America', 'Middle East', 'Africa'
  ];

  const themes = [
    { id: 'light', name: 'Light', icon: '☀️' },
    { id: 'dark', name: 'Dark', icon: '🌙' },
    { id: 'auto', name: 'Auto', icon: '🌓' }
  ];

  const saveProfile = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        name: profileData.name,
        bio: profileData.bio,
        favoriteHero: profileData.favoriteHero,
        preferredRole: profileData.preferredRole,
        region: profileData.region
      };

      await api.put('/user/profile', updateData);
      
      localStorage.setItem('mrvl_theme', profileData.theme);
      document.documentElement.className = profileData.theme === 'dark' ? 'dark' : 
        profileData.theme === 'light' ? '' : 
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : '';
      
      await updateUser();
      alert('✅ Profile updated successfully!');
      
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      alert('❌ Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveNotifications = async () => {
    try {
      setLoading(true);
      await api.put('/user/notifications', profileData.notifications);
      alert('✅ Notification preferences updated!');
    } catch (error) {
      console.error('❌ Error updating notifications:', error);
      alert('❌ Failed to update notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacy = async () => {
    try {
      setLoading(true);
      await api.put('/user/privacy', profileData.privacy);
      alert('✅ Privacy settings updated!');
    } catch (error) {
      console.error('❌ Error updating privacy:', error);
      alert('❌ Failed to update privacy settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file) => {
    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post('/user/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const avatarUrl = response.data?.avatarUrl || response.avatarUrl;
      setProfileData(prev => ({ ...prev, avatar: avatarUrl }));
      
      alert('✅ Avatar uploaded successfully!');
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      alert('❌ Failed to upload avatar. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'settings', name: 'Settings', icon: '⚙️' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'activity', name: 'Activity', icon: '📊' }
  ];

  const renderProfile = () => (
    <div className="space-y-6">
      <div className="card p-6 text-center">
        <div className="relative inline-block mb-4">
          <div className="w-32 h-32 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center text-4xl mx-auto overflow-hidden">
            {profileData.avatar ? (
              <img src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>👤</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full cursor-pointer hover:bg-red-700 transition-colors">
            <span className="text-sm">📷</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files[0] && uploadAvatar(e.target.files[0])}
              className="hidden"
            />
          </label>
        </div>
        
        {/* ✅ NEW: Hero Avatar Button */}
        <div className="mb-4">
          <button
            onClick={() => setShowAvatarSelector(true)}
            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105 flex items-center space-x-2 mx-auto"
          >
            <span>🦸</span>
            <span>Choose Hero Avatar</span>
          </button>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Select a Marvel Rivals hero as your profile picture
          </p>
        </div>
        
        {uploading && <div className="text-sm text-gray-600 dark:text-gray-400">Uploading...</div>}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Favorite Hero
            </label>
            <select
              value={profileData.favoriteHero}
              onChange={(e) => setProfileData(prev => ({ ...prev, favoriteHero: e.target.value }))}
              className="form-input"
            >
              <option value="">Select hero...</option>
              {marvelHeroes.map(hero => (
                <option key={hero} value={hero}>{hero}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Preferred Role
            </label>
            <select
              value={profileData.preferredRole}
              onChange={(e) => setProfileData(prev => ({ ...prev, preferredRole: e.target.value }))}
              className="form-input"
            >
              <option value="">Select role...</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>
                  {role.icon} {role.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Region
            </label>
            <select
              value={profileData.region}
              onChange={(e) => setProfileData(prev => ({ ...prev, region: e.target.value }))}
              className="form-input"
            >
              <option value="">Select region...</option>
              {regions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={saveProfile}
        disabled={loading}
        className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 w-full md:w-auto"
      >
        {loading ? 'Saving...' : '💾 Save Profile'}
      </button>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Appearance</h3>
        <div className="grid grid-cols-3 gap-4">
          {themes.map(theme => (
            <button
              key={theme.id}
              onClick={() => setProfileData(prev => ({ ...prev, theme: theme.id }))}
              className={`p-4 rounded-lg border-2 transition-colors ${
                profileData.theme === theme.id
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="text-2xl mb-2">{theme.icon}</div>
              <div className="font-medium">{theme.name}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={saveProfile}
        disabled={loading}
        className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 w-full md:w-auto"
      >
        {loading ? 'Saving...' : '💾 Save Settings'}
      </button>
    </div>
  );

  const renderNotifications = () => (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notification Preferences</h3>
      <div className="space-y-4">
        {Object.entries({
          matchUpdates: 'Match Updates',
          forumReplies: 'Forum Replies',
          newsAlerts: 'News Alerts',
          eventReminders: 'Event Reminders'
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
        {loading ? 'Saving...' : '💾 Save Notifications'}
      </button>
    </div>
  );

  const renderPrivacy = () => (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Privacy Settings</h3>
      <div className="space-y-4">
        {Object.entries({
          showEmail: 'Show Email Address',
          showOnlineStatus: 'Show Online Status',
          allowDirectMessages: 'Allow Direct Messages'
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
        {loading ? 'Saving...' : '💾 Save Privacy'}
      </button>
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-6">
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Account Activity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">127</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">89</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">245</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Matches Viewed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">34</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfile();
      case 'settings': return renderSettings();
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
          👤 User Profile
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
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {renderContent()}
      
      {/* ✅ NEW: Hero Avatar Selector Modal */}
      {showAvatarSelector && (
        <HeroAvatarSelector
          currentAvatar={profileData.heroAvatar}
          onAvatarSelect={(hero) => {
            console.log('🦸 Hero avatar selected:', hero);
            setProfileData(prev => ({ 
              ...prev, 
              heroAvatar: hero,
              avatar: hero ? `/Heroes/${hero.image}` : prev.avatar
            }));
            setShowAvatarSelector(false);
          }}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
}

export default UserProfile;