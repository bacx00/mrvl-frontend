import React, { useState, useEffect } from 'react';
import {
  Settings, User, Bell, Shield, Palette, Globe, Smartphone,
  Moon, Sun, Volume2, VolumeX, Eye, EyeOff, Lock, Key,
  Trash2, Download, Upload, HelpCircle, MessageSquare, X,
  ChevronRight, ToggleLeft, ToggleRight, Check, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks';

// Mobile-First Settings Panel
function MobileSettings({ isOpen, onClose, navigateTo }) {
  const { user, api, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('general');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    theme: 'system', // 'light', 'dark', 'system'
    language: 'en',
    timezone: 'auto',
    
    // Notification Settings
    notifications: {
      push_enabled: true,
      email_enabled: true,
      matches: true,
      news: true,
      achievements: true,
      social: true,
      challenges: true,
      forums: true
    },
    
    // Privacy Settings
    privacy: {
      profile_visibility: 'public', // 'public', 'friends', 'private'
      show_online_status: true,
      allow_friend_requests: true,
      allow_mentions: true,
      show_activity: true
    },
    
    // Sound Settings
    sounds: {
      enabled: true,
      notification_sounds: true,
      ui_sounds: false,
      volume: 0.7
    },
    
    // Display Settings
    display: {
      reduce_motion: false,
      high_contrast: false,
      large_text: false,
      compact_mode: false
    }
  });

  // Settings sections
  const sections = [
    { id: 'general', icon: Settings, label: 'General', color: 'text-gray-600' },
    { id: 'notifications', icon: Bell, label: 'Notifications', color: 'text-blue-600' },
    { id: 'privacy', icon: Shield, label: 'Privacy', color: 'text-green-600' },
    { id: 'display', icon: Palette, label: 'Display', color: 'text-purple-600' },
    { id: 'account', icon: User, label: 'Account', color: 'text-red-600' }
  ];

  // Load user settings
  useEffect(() => {
    if (isOpen && user) {
      fetchUserSettings();
    }
  }, [isOpen, user]);

  const fetchUserSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/settings');
      const userSettings = response.data?.settings || {};
      
      setSettings(prev => ({
        ...prev,
        ...userSettings,
        notifications: { ...prev.notifications, ...userSettings.notifications },
        privacy: { ...prev.privacy, ...userSettings.privacy },
        sounds: { ...prev.sounds, ...userSettings.sounds },
        display: { ...prev.display, ...userSettings.display }
      }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save settings
  const saveSettings = async (section, updatedSettings) => {
    try {
      await api.put('/user/settings', {
        section,
        settings: updatedSettings
      });
      
      showToast('Settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    }
  };

  // Update setting value
  const updateSetting = (section, key, value) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: value
      }
    };
    
    setSettings(newSettings);
    saveSettings(section, newSettings[section]);
  };

  // Toggle boolean setting
  const toggleSetting = (section, key) => {
    const currentValue = settings[section][key];
    updateSetting(section, key, !currentValue);
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setLoading(true);
      await api.delete('/user/account');
      logout();
      onClose();
      showToast('Account deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting account:', error);
      showToast('Failed to delete account', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Export data
  const exportData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/export');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mrvl-data-${user.name}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      showToast('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showToast('Failed to export data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toast helper
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-y-full transition-transform duration-300 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    } text-white font-medium`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white dark:bg-gray-900 w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Settings</h1>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Navigation */}
          <div className="flex overflow-x-auto scrollbar-hide border-t border-gray-200 dark:border-gray-700">
            {sections.map(section => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? `border-blue-500 ${section.color} bg-blue-50 dark:bg-blue-900/20`
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm">{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Settings Content */}
        <div className="flex-1 overflow-y-auto">
          {activeSection === 'general' && (
            <GeneralSettings 
              settings={settings} 
              onUpdate={updateSetting}
              onToggle={toggleSetting}
            />
          )}
          
          {activeSection === 'notifications' && (
            <NotificationSettings 
              settings={settings.notifications} 
              onUpdate={(key, value) => updateSetting('notifications', key, value)}
              onToggle={(key) => toggleSetting('notifications', key)}
            />
          )}
          
          {activeSection === 'privacy' && (
            <PrivacySettings 
              settings={settings.privacy} 
              onUpdate={(key, value) => updateSetting('privacy', key, value)}
              onToggle={(key) => toggleSetting('privacy', key)}
            />
          )}
          
          {activeSection === 'display' && (
            <DisplaySettings 
              settings={settings.display} 
              sounds={settings.sounds}
              onUpdate={updateSetting}
              onToggle={toggleSetting}
            />
          )}
          
          {activeSection === 'account' && (
            <AccountSettings 
              user={user}
              onExportData={exportData}
              onDeleteAccount={() => setShowDeleteConfirm(true)}
              onNavigate={navigateTo}
              loading={loading}
            />
          )}
        </div>

        {/* Delete Account Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Delete Account
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  This action cannot be undone. All your data will be permanently deleted.
                </p>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      deleteAccount();
                    }}
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
                  >
                    {loading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Settings Section Components
function GeneralSettings({ settings, onUpdate, onToggle }) {
  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Smartphone }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Theme Selection */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Theme</h3>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(option => {
            const Icon = option.icon;
            const isSelected = settings.theme === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => onUpdate('theme', option.value)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <Icon className={`w-6 h-6 mx-auto mb-2 ${
                  isSelected ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                }`} />
                <div className={`text-sm font-medium ${
                  isSelected ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {option.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Language */}
      <SettingRow
        icon={Globe}
        title="Language"
        subtitle="English (US)"
        action={<ChevronRight className="w-4 h-4 text-gray-400" />}
        onClick={() => {/* Open language selector */}}
      />

      {/* Timezone */}
      <SettingRow
        icon={Globe}
        title="Timezone"
        subtitle="Auto-detect"
        action={<ChevronRight className="w-4 h-4 text-gray-400" />}
        onClick={() => {/* Open timezone selector */}}
      />
    </div>
  );
}

function NotificationSettings({ settings, onUpdate, onToggle }) {
  const notificationTypes = [
    { key: 'matches', label: 'Match Updates', subtitle: 'Live scores and results' },
    { key: 'news', label: 'News & Updates', subtitle: 'Latest esports news' },
    { key: 'achievements', label: 'Achievements', subtitle: 'Badges and rewards' },
    { key: 'social', label: 'Social Activity', subtitle: 'Follows and mentions' },
    { key: 'challenges', label: 'Daily Challenges', subtitle: 'New challenges' },
    { key: 'forums', label: 'Forum Activity', subtitle: 'Replies and mentions' }
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Master Controls */}
      <div className="space-y-4">
        <SettingRow
          icon={Smartphone}
          title="Push Notifications"
          subtitle="Enable mobile push notifications"
          action={
            <ToggleSwitch 
              checked={settings.push_enabled} 
              onChange={() => onToggle('push_enabled')} 
            />
          }
        />
        
        <SettingRow
          icon={MessageSquare}
          title="Email Notifications"
          subtitle="Receive notifications via email"
          action={
            <ToggleSwitch 
              checked={settings.email_enabled} 
              onChange={() => onToggle('email_enabled')} 
            />
          }
        />
      </div>

      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Categories</h3>
        <div className="space-y-4">
          {notificationTypes.map(type => (
            <SettingRow
              key={type.key}
              icon={Bell}
              title={type.label}
              subtitle={type.subtitle}
              action={
                <ToggleSwitch 
                  checked={settings[type.key]} 
                  onChange={() => onToggle(type.key)} 
                />
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PrivacySettings({ settings, onUpdate, onToggle }) {
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <SettingRow
          icon={Eye}
          title="Profile Visibility"
          subtitle={`Currently: ${settings.profile_visibility}`}
          action={<ChevronRight className="w-4 h-4 text-gray-400" />}
          onClick={() => {/* Open visibility selector */}}
        />
        
        <SettingRow
          icon={User}
          title="Show Online Status"
          subtitle="Let others see when you're online"
          action={
            <ToggleSwitch 
              checked={settings.show_online_status} 
              onChange={() => onToggle('show_online_status')} 
            />
          }
        />
        
        <SettingRow
          icon={Users}
          title="Friend Requests"
          subtitle="Allow others to send friend requests"
          action={
            <ToggleSwitch 
              checked={settings.allow_friend_requests} 
              onChange={() => onToggle('allow_friend_requests')} 
            />
          }
        />
        
        <SettingRow
          icon={MessageSquare}
          title="Allow Mentions"
          subtitle="Let others mention you in posts"
          action={
            <ToggleSwitch 
              checked={settings.allow_mentions} 
              onChange={() => onToggle('allow_mentions')} 
            />
          }
        />
        
        <SettingRow
          icon={TrendingUp}
          title="Show Activity"
          subtitle="Display your recent activity"
          action={
            <ToggleSwitch 
              checked={settings.show_activity} 
              onChange={() => onToggle('show_activity')} 
            />
          }
        />
      </div>
    </div>
  );
}

function DisplaySettings({ settings, sounds, onUpdate, onToggle }) {
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <SettingRow
          icon={Volume2}
          title="Sound Effects"
          subtitle="Enable UI and notification sounds"
          action={
            <ToggleSwitch 
              checked={sounds.enabled} 
              onChange={() => onToggle('sounds', 'enabled')} 
            />
          }
        />
        
        <SettingRow
          icon={Eye}
          title="Reduce Motion"
          subtitle="Minimize animations and transitions"
          action={
            <ToggleSwitch 
              checked={settings.reduce_motion} 
              onChange={() => onToggle('display', 'reduce_motion')} 
            />
          }
        />
        
        <SettingRow
          icon={Palette}
          title="High Contrast"
          subtitle="Increase color contrast for better visibility"
          action={
            <ToggleSwitch 
              checked={settings.high_contrast} 
              onChange={() => onToggle('display', 'high_contrast')} 
            />
          }
        />
        
        <SettingRow
          icon={Settings}
          title="Compact Mode"
          subtitle="Show more content in less space"
          action={
            <ToggleSwitch 
              checked={settings.compact_mode} 
              onChange={() => onToggle('display', 'compact_mode')} 
            />
          }
        />
      </div>
    </div>
  );
}

function AccountSettings({ user, onExportData, onDeleteAccount, onNavigate, loading }) {
  return (
    <div className="p-4 space-y-6">
      {/* Account Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Account Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Username:</span>
            <span className="font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Email:</span>
            <span className="font-medium">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Member since:</span>
            <span className="font-medium">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-4">
        <SettingRow
          icon={Key}
          title="Change Password"
          subtitle="Update your account password"
          action={<ChevronRight className="w-4 h-4 text-gray-400" />}
          onClick={() => onNavigate('change-password')}
        />
        
        <SettingRow
          icon={User}
          title="Edit Profile"
          subtitle="Update your profile information"
          action={<ChevronRight className="w-4 h-4 text-gray-400" />}
          onClick={() => onNavigate('profile-edit')}
        />
        
        <SettingRow
          icon={Download}
          title="Export Data"
          subtitle="Download your account data"
          action={<ChevronRight className="w-4 h-4 text-gray-400" />}
          onClick={onExportData}
          loading={loading}
        />
        
        <SettingRow
          icon={HelpCircle}
          title="Help & Support"
          subtitle="Get help or contact support"
          action={<ChevronRight className="w-4 h-4 text-gray-400" />}
          onClick={() => onNavigate('support')}
        />
      </div>

      {/* Danger Zone */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
        <SettingRow
          icon={Trash2}
          title="Delete Account"
          subtitle="Permanently delete your account"
          action={<ChevronRight className="w-4 h-4 text-red-400" />}
          onClick={onDeleteAccount}
          className="text-red-600"
        />
      </div>
    </div>
  );
}

// Helper Components
function SettingRow({ icon: Icon, title, subtitle, action, onClick, loading, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 ${className}`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <div className="text-left">
          <div className="font-medium text-gray-900 dark:text-white">{title}</div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</div>
        </div>
      </div>
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
      ) : (
        action
      )}
    </button>
  );
}

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full transition-all ${
        checked ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full transition-all ${
        checked ? 'translate-x-6' : 'translate-x-0.5'
      }`} />
    </button>
  );
}

export default MobileSettings;