'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [activeSection, setActiveSection] = useState<'account' | 'privacy' | 'notifications' | 'security' | 'data'>('account');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState({
    username: user?.username || '',
    email: user?.email || '',
    displayName: user?.username || '',
    language: 'en',
    timezone: 'UTC'
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailDigest: true,
    matchUpdates: true,
    forumReplies: true,
    directMessages: true,
    pushNotifications: true,
    marketingEmails: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showOnlineStatus: true,
    allowDirectMessages: true,
    showMatchHistory: true,
    dataCollection: true
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false
  });

  if (!user) {
    router.push('/user/login');
    return null;
  }

  const handleSave = async (section: string) => {
    setIsSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Saved ${section} settings`);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      try {
        // Mock delete account
        await new Promise(resolve => setTimeout(resolve, 1000));
        logout();
        router.push('/');
      } catch (error) {
        console.error('Delete account failed:', error);
      }
    }
  };

  const sections = [
    { key: 'account', label: 'Account', icon: '👤' },
    { key: 'privacy', label: 'Privacy', icon: '🔒' },
    { key: 'notifications', label: 'Notifications', icon: '🔔' },
    { key: 'security', label: 'Security', icon: '🛡️' },
    { key: 'data', label: 'Data & Privacy', icon: '📊' }
  ];

  return (
    <div className="bg-[#0f1419] min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-[#768894]">Manage your account preferences and privacy settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.key}
                    onClick={() => setActiveSection(section.key as any)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded text-left transition-colors ${
                      activeSection === section.key
                        ? 'bg-[#fa4454] text-white'
                        : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="font-medium">{section.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* Account Settings */}
            {activeSection === 'account' && (
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Account Information</h2>
                
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Username</label>
                      <input
                        type="text"
                        value={accountForm.username}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Display Name</label>
                      <input
                        type="text"
                        value={accountForm.displayName}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">Email Address</label>
                    <input
                      type="email"
                      value={accountForm.email}
                      onChange={(e) => setAccountForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Language</label>
                      <select
                        value={accountForm.language}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Timezone</label>
                      <select
                        value={accountForm.timezone}
                        onChange={(e) => setAccountForm(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave('account')}
                      disabled={isSaving}
                      className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Settings */}
            {activeSection === 'privacy' && (
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Privacy Settings</h2>
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">Profile Visibility</label>
                    <div className="space-y-2">
                      {[
                        { value: 'public', label: 'Public - Everyone can see your profile' },
                        { value: 'members', label: 'Members Only - Only registered users can see your profile' },
                        { value: 'private', label: 'Private - Only you can see your profile' }
                      ].map((option) => (
                        <label key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            name="profileVisibility"
                            value={option.value}
                            checked={privacySettings.profileVisibility === option.value}
                            onChange={(e) => setPrivacySettings(prev => ({ ...prev, profileVisibility: e.target.value }))}
                            className="w-4 h-4 text-[#fa4454] bg-[#0f1419] border-[#2b3d4d] focus:ring-[#fa4454]"
                          />
                          <span className="ml-2 text-[#768894]">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { key: 'showOnlineStatus', label: 'Show online status to other users' },
                      { key: 'allowDirectMessages', label: 'Allow direct messages from other users' },
                      { key: 'showMatchHistory', label: 'Show match history on profile' },
                      { key: 'dataCollection', label: 'Allow anonymous data collection for analytics' }
                    ].map((setting) => (
                      <label key={setting.key} className="flex items-center justify-between">
                        <span className="text-white">{setting.label}</span>
                        <input
                          type="checkbox"
                          checked={privacySettings[setting.key as keyof typeof privacySettings] as boolean}
                          onChange={(e) => setPrivacySettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                          className="w-4 h-4 text-[#fa4454] bg-[#0f1419] border-[#2b3d4d] rounded focus:ring-[#fa4454]"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave('privacy')}
                      disabled={isSaving}
                      className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeSection === 'notifications' && (
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'emailDigest', label: 'Weekly digest of community activity' },
                        { key: 'matchUpdates', label: 'Match results and live updates' },
                        { key: 'forumReplies', label: 'Replies to your forum posts' },
                        { key: 'directMessages', label: 'Direct messages from other users' },
                        { key: 'marketingEmails', label: 'Marketing and promotional emails' }
                      ].map((setting) => (
                        <label key={setting.key} className="flex items-center justify-between">
                          <span className="text-[#768894]">{setting.label}</span>
                          <input
                            type="checkbox"
                            checked={notificationSettings[setting.key as keyof typeof notificationSettings]}
                            onChange={(e) => setNotificationSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                            className="w-4 h-4 text-[#fa4454] bg-[#0f1419] border-[#2b3d4d] rounded focus:ring-[#fa4454]"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Push Notifications</h3>
                    <label className="flex items-center justify-between">
                      <span className="text-[#768894]">Enable push notifications</span>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                        className="w-4 h-4 text-[#fa4454] bg-[#0f1419] border-[#2b3d4d] rounded focus:ring-[#fa4454]"
                      />
                    </label>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave('notifications')}
                      disabled={isSaving}
                      className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Security Settings</h2>
                
                <div className="space-y-6">
                  {/* Change Password */}
                  <div>
                    <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                        <input
                          type="password"
                          value={securityForm.currentPassword}
                          onChange={(e) => setSecurityForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">New Password</label>
                          <input
                            type="password"
                            value={securityForm.newPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Confirm Password</label>
                          <input
                            type="password"
                            value={securityForm.confirmPassword}
                            onChange={(e) => setSecurityForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border-t border-[#2b3d4d] pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                        <p className="text-[#768894] text-sm">Add an extra layer of security to your account</p>
                      </div>
                      <button
                        className={`px-4 py-2 rounded font-medium transition-colors ${
                          securityForm.twoFactorEnabled
                            ? 'bg-[#10b981] hover:bg-[#059669] text-white'
                            : 'bg-[#2b3d4d] hover:bg-[#3a4a5c] text-[#768894]'
                        }`}
                      >
                        {securityForm.twoFactorEnabled ? 'Enabled' : 'Enable 2FA'}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={() => handleSave('security')}
                      disabled={isSaving}
                      className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Update Security'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data & Privacy */}
            {activeSection === 'data' && (
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Data & Privacy</h2>
                
                <div className="space-y-6">
                  {/* Export Data */}
                  <div className="flex items-center justify-between p-4 bg-[#0f1419] rounded">
                    <div>
                      <h3 className="text-white font-medium">Export Your Data</h3>
                      <p className="text-[#768894] text-sm">Download a copy of your account data</p>
                    </div>
                    <button className="px-4 py-2 bg-[#2b3d4d] hover:bg-[#3a4a5c] text-white rounded font-medium transition-colors">
                      Export Data
                    </button>
                  </div>

                  {/* Delete Account */}
                  <div className="border-t border-[#2b3d4d] pt-6">
                    <div className="bg-[#331419] border border-[#fa4454] rounded p-4">
                      <h3 className="text-white font-medium mb-2">Delete Account</h3>
                      <p className="text-[#768894] text-sm mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors"
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">Delete Account</h3>
              <p className="text-[#768894] mb-6">
                Are you absolutely sure you want to delete your account? This will permanently remove all your data and cannot be undone.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-[#2b3d4d] text-[#768894] rounded hover:text-white hover:border-[#768894] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
