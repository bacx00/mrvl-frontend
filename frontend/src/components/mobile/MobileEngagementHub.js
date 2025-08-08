import React, { useState, useEffect } from 'react';
import {
  Bell, Trophy, Target, User, Gift, Flame, Star, Users,
  MessageSquare, Calendar, TrendingUp, Award, Crown, Shield,
  Zap, Coins, Heart, Settings, X, ChevronRight, Plus
} from 'lucide-react';
import { useAuth } from '../../hooks';
import MobileUserProfile from './MobileUserProfile';
import MobileNotificationCenter from './MobileNotificationCenter';
import MobileAchievementCenter from './MobileAchievementCenter';
import MobileChallengeCenter from './MobileChallengeCenter';
import MobileOnboarding from './MobileOnboarding';

// Mobile Engagement Hub - Central controller for all engagement features
function MobileEngagementHub({ navigateTo }) {
  const { user, api, isNewUser } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [engagementData, setEngagementData] = useState({
    notifications: { count: 0, unread: 0 },
    challenges: { active: 0, completed_today: 0 },
    achievements: { total: 0, recent: [] },
    social: { followers: 0, following: 0 },
    streak: 0,
    level: 1,
    xp: 0,
    nextLevelXp: 1000
  });

  // Quick action buttons for mobile
  const quickActions = [
    {
      id: 'profile',
      icon: User,
      label: 'Profile',
      color: 'bg-blue-500',
      modal: 'profile'
    },
    {
      id: 'notifications',
      icon: Bell,
      label: 'Notifications',
      color: 'bg-purple-500',
      modal: 'notifications',
      badge: engagementData.notifications.unread
    },
    {
      id: 'achievements',
      icon: Trophy,
      label: 'Achievements',
      color: 'bg-yellow-500',
      modal: 'achievements'
    },
    {
      id: 'challenges',
      icon: Target,
      label: 'Challenges',
      color: 'bg-red-500',
      modal: 'challenges',
      badge: engagementData.challenges.active
    }
  ];

  // Fetch engagement data
  useEffect(() => {
    if (user) {
      fetchEngagementData();
    }
  }, [user]);

  // Check if user needs onboarding
  useEffect(() => {
    if (user && (isNewUser || !user.onboarding_completed)) {
      setShowOnboarding(true);
    }
  }, [user, isNewUser]);

  const fetchEngagementData = async () => {
    try {
      const response = await api.get('/user/engagement/summary');
      const data = response.data?.data || response.data || {};
      
      setEngagementData({
        notifications: data.notifications || { count: 5, unread: 3 },
        challenges: data.challenges || { active: 4, completed_today: 2 },
        achievements: data.achievements || { total: 12, recent: [] },
        social: data.social || { followers: 24, following: 18 },
        streak: data.streak || 5,
        level: data.level || Math.floor((data.xp || 500) / 1000) + 1,
        xp: data.xp || 500,
        nextLevelXp: data.nextLevelXp || 1000
      });
    } catch (error) {
      console.error('Error fetching engagement data:', error);
      // Use mock data for demo
      setEngagementData({
        notifications: { count: 5, unread: 3 },
        challenges: { active: 4, completed_today: 2 },
        achievements: { total: 12, recent: [] },
        social: { followers: 24, following: 18 },
        streak: 5,
        level: 1,
        xp: 500,
        nextLevelXp: 1000
      });
    }
  };

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const completeOnboarding = () => {
    setShowOnboarding(false);
    fetchEngagementData(); // Refresh data after onboarding
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Engagement Button */}
      <EngagementFloatingButton 
        data={engagementData}
        onOpenHub={() => openModal('hub')}
      />

      {/* Mobile Engagement Hub Modal */}
      {activeModal === 'hub' && (
        <MobileEngagementHubModal
          data={engagementData}
          quickActions={quickActions}
          onOpenModal={openModal}
          onClose={closeModal}
          navigateTo={navigateTo}
        />
      )}

      {/* Feature Modals */}
      <MobileUserProfile
        isOpen={activeModal === 'profile'}
        onClose={closeModal}
        navigateTo={navigateTo}
      />

      <MobileNotificationCenter
        isOpen={activeModal === 'notifications'}
        onClose={closeModal}
        navigateTo={navigateTo}
      />

      <MobileAchievementCenter
        isOpen={activeModal === 'achievements'}
        onClose={closeModal}
        navigateTo={navigateTo}
      />

      <MobileChallengeCenter
        isOpen={activeModal === 'challenges'}
        onClose={closeModal}
        navigateTo={navigateTo}
      />

      {/* Onboarding Flow */}
      <MobileOnboarding
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={completeOnboarding}
      />
    </>
  );
}

// Floating Action Button for Engagement
function EngagementFloatingButton({ data, onOpenHub }) {
  const hasNotifications = data.notifications.unread > 0;
  const hasActiveChallenges = data.challenges.active > 0;
  const totalBadges = data.notifications.unread + (hasActiveChallenges ? 1 : 0);

  return (
    <button
      onClick={onOpenHub}
      className="lg:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-gradient-to-r from-red-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
    >
      {/* Badge for notifications/updates */}
      {totalBadges > 0 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 text-yellow-900 rounded-full flex items-center justify-center text-xs font-bold">
          {totalBadges > 9 ? '9+' : totalBadges}
        </div>
      )}
      
      {/* Icon based on current status */}
      {hasNotifications ? (
        <Bell className="w-6 h-6 animate-pulse" />
      ) : data.streak > 0 ? (
        <Flame className="w-6 h-6" />
      ) : (
        <Trophy className="w-6 h-6" />
      )}
    </button>
  );
}

// Main Hub Modal
function MobileEngagementHubModal({ data, quickActions, onOpenModal, onClose, navigateTo }) {
  const xpProgress = ((data.xp % 1000) / 1000) * 100;

  return (
    <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-h-[80vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-purple-600 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Your Progress</h2>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Level and XP */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-white">Level {data.level}</div>
              <div className="text-white/80">
                {data.xp % 1000} / 1000 XP to next level
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{data.streak}</div>
                <div className="text-white/80 text-sm flex items-center">
                  <Flame className="w-4 h-4 mr-1" />
                  Streak
                </div>
              </div>
            </div>
          </div>

          {/* XP Progress Bar */}
          <div className="bg-white/20 rounded-full h-3 mb-4">
            <div
              className="bg-white rounded-full h-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-white">{data.achievements.total}</div>
              <div className="text-white/80 text-xs">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{data.social.followers}</div>
              <div className="text-white/80 text-xs">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-white">{data.challenges.completed_today}</div>
              <div className="text-white/80 text-xs">Today's Goals</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => {
              const Icon = action.icon;
              
              return (
                <button
                  key={action.id}
                  onClick={() => {
                    onClose();
                    onOpenModal(action.modal);
                  }}
                  className="relative p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                >
                  {/* Badge */}
                  {action.badge && action.badge > 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {action.badge > 9 ? '9+' : action.badge}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {action.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {getActionSubtitle(action.id, data)}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Additional Navigation */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              <NavButton
                icon={Users}
                label="Find Friends"
                onClick={() => {
                  onClose();
                  navigateTo('users');
                }}
              />
              <NavButton
                icon={MessageSquare}
                label="Join Discussion"
                onClick={() => {
                  onClose();
                  navigateTo('forums');
                }}
              />
              <NavButton
                icon={Calendar}
                label="Upcoming Matches"
                onClick={() => {
                  onClose();
                  navigateTo('matches');
                }}
              />
              <NavButton
                icon={Settings}
                label="Settings"
                onClick={() => {
                  onClose();
                  navigateTo('settings');
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function NavButton({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span className="font-medium text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

// Helper function to get dynamic subtitles
function getActionSubtitle(actionId, data) {
  switch (actionId) {
    case 'profile':
      return `Level ${data.level}`;
    case 'notifications':
      return data.notifications.unread > 0 
        ? `${data.notifications.unread} unread` 
        : 'All caught up';
    case 'achievements':
      return `${data.achievements.total} unlocked`;
    case 'challenges':
      return data.challenges.active > 0 
        ? `${data.challenges.active} active` 
        : 'All complete';
    default:
      return '';
  }
}

export default MobileEngagementHub;