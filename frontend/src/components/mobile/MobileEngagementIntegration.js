import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import MobileEngagementHub from './MobileEngagementHub';
import MobileSettings from './MobileSettings';

// Mobile Engagement Integration - Main controller for all mobile engagement features
function MobileEngagementIntegration({ navigateTo, currentPage }) {
  const { user, api } = useAuth();
  const [activeModal, setActiveModal] = useState(null);
  const [engagementData, setEngagementData] = useState({
    notifications: { count: 0, unread: 0 },
    challenges: { active: 0, completed_today: 0, daily_streak: 0 },
    achievements: { total: 0, recent: [], unread_count: 0 },
    social: { followers: 0, following: 0, friends: 0 },
    user_stats: {
      level: 1,
      xp: 0,
      nextLevelXp: 1000,
      reputation: 0,
      activity_score: 0
    }
  });

  // Real-time engagement tracking
  useEffect(() => {
    if (user) {
      fetchEngagementData();
      
      // Set up real-time updates
      const interval = setInterval(fetchEngagementData, 30000); // Update every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user]);

  // Track user activity for engagement
  useEffect(() => {
    if (user && currentPage) {
      trackPageView(currentPage);
    }
  }, [user, currentPage]);

  const fetchEngagementData = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/user/engagement/dashboard');
      const data = response.data?.data || response.data || {};
      
      setEngagementData(prev => ({
        notifications: data.notifications || prev.notifications,
        challenges: data.challenges || prev.challenges,
        achievements: data.achievements || prev.achievements,
        social: data.social || prev.social,
        user_stats: data.user_stats || prev.user_stats
      }));
    } catch (error) {
      console.error('Error fetching engagement data:', error);
    }
  }, [user, api]);

  // Track page views for engagement analytics
  const trackPageView = async (page) => {
    try {
      await api.post('/user/analytics/page-view', {
        page,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        mobile: true
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  };

  // Track engagement events
  const trackEngagementEvent = useCallback(async (event, data = {}) => {
    try {
      await api.post('/user/analytics/engagement', {
        event,
        data,
        timestamp: new Date().toISOString(),
        page: currentPage
      });
    } catch (error) {
      console.error('Error tracking engagement event:', error);
    }
  }, [api, currentPage]);

  // Handle engagement actions
  const handleEngagementAction = useCallback((action, data = {}) => {
    switch (action) {
      case 'open_profile':
        setActiveModal('profile');
        trackEngagementEvent('profile_opened');
        break;
      case 'open_notifications':
        setActiveModal('notifications');
        trackEngagementEvent('notifications_opened');
        break;
      case 'open_achievements':
        setActiveModal('achievements');
        trackEngagementEvent('achievements_opened');
        break;
      case 'open_challenges':
        setActiveModal('challenges');
        trackEngagementEvent('challenges_opened');
        break;
      case 'open_settings':
        setActiveModal('settings');
        trackEngagementEvent('settings_opened');
        break;
      case 'complete_challenge':
        fetchEngagementData(); // Refresh data
        trackEngagementEvent('challenge_completed', data);
        break;
      case 'earn_achievement':
        fetchEngagementData(); // Refresh data
        trackEngagementEvent('achievement_earned', data);
        showAchievementNotification(data);
        break;
      case 'social_action':
        fetchEngagementData(); // Refresh data
        trackEngagementEvent('social_action', data);
        break;
      default:
        trackEngagementEvent(action, data);
    }
  }, [trackEngagementEvent, fetchEngagementData]);

  // Show achievement notification
  const showAchievementNotification = (achievementData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Achievement Unlocked: ${achievementData.name}`, {
        body: `You earned +${achievementData.xp} XP!`,
        icon: '/icons/achievement.png',
        badge: '/icons/badge.png'
      });
    }

    // Show in-app notification as well
    showToast(`🏆 Achievement Unlocked: ${achievementData.name}`, 'achievement');
  };

  // Toast notification system
  const showToast = (message, type = 'info', duration = 3000) => {
    const toast = document.createElement('div');
    const bgColor = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500',
      achievement: 'bg-gradient-to-r from-yellow-500 to-orange-500'
    }[type] || 'bg-blue-500';

    toast.className = `fixed bottom-24 left-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-y-full transition-transform duration-300 ${bgColor} text-white font-medium`;
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        ${type === 'achievement' ? '<span class="text-2xl">🏆</span>' : ''}
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 300);
    }, duration);
  };

  // Enhanced navigation with engagement tracking
  const enhancedNavigateTo = (page, params = {}) => {
    trackEngagementEvent('navigation', { from: currentPage, to: page, params });
    navigateTo(page, params);
  };

  // Close modal
  const closeModal = () => {
    setActiveModal(null);
  };

  if (!user) return null;

  return (
    <>
      {/* Main Engagement Hub */}
      <MobileEngagementHub
        navigateTo={enhancedNavigateTo}
        engagementData={engagementData}
        onAction={handleEngagementAction}
        onRefresh={fetchEngagementData}
      />

      {/* Settings Modal */}
      <MobileSettings
        isOpen={activeModal === 'settings'}
        onClose={closeModal}
        navigateTo={enhancedNavigateTo}
        onAction={handleEngagementAction}
      />

      {/* Engagement Event Listeners */}
      <EngagementEventListeners
        onAction={handleEngagementAction}
        engagementData={engagementData}
      />
    </>
  );
}

// Component to handle global engagement events
function EngagementEventListeners({ onAction, engagementData }) {
  useEffect(() => {
    // Listen for custom engagement events
    const handleEngagementEvent = (event) => {
      onAction(event.type, event.detail);
    };

    // Achievement unlocked events
    window.addEventListener('achievement-unlocked', handleEngagementEvent);
    
    // Challenge completed events
    window.addEventListener('challenge-completed', handleEngagementEvent);
    
    // Social interaction events
    window.addEventListener('social-action', handleEngagementEvent);
    
    // Notification events
    window.addEventListener('notification-received', handleEngagementEvent);

    return () => {
      window.removeEventListener('achievement-unlocked', handleEngagementEvent);
      window.removeEventListener('challenge-completed', handleEngagementEvent);
      window.removeEventListener('social-action', handleEngagementEvent);
      window.removeEventListener('notification-received', handleEngagementEvent);
    };
  }, [onAction]);

  // Progressive Web App engagement features
  useEffect(() => {
    // Request notification permission on first interaction
    const requestNotificationPermission = () => {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    };

    // Register service worker for push notifications
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
    };

    // Setup background sync for offline actions
    const setupBackgroundSync = () => {
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        // Background sync will be handled by the service worker
        console.log('Background sync is supported');
      }
    };

    document.addEventListener('click', requestNotificationPermission, { once: true });
    registerServiceWorker();
    setupBackgroundSync();

    return () => {
      document.removeEventListener('click', requestNotificationPermission);
    };
  }, []);

  // Engagement metrics tracking
  useEffect(() => {
    let engagementStartTime = Date.now();
    let isActive = true;

    const trackEngagementTime = () => {
      if (isActive) {
        const timeSpent = Date.now() - engagementStartTime;
        onAction('engagement_time', { timeSpent, page: window.location.pathname });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        isActive = true;
        engagementStartTime = Date.now();
      } else {
        isActive = false;
        trackEngagementTime();
      }
    };

    // Track engagement time every 30 seconds
    const engagementTimer = setInterval(trackEngagementTime, 30000);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(engagementTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackEngagementTime(); // Final tracking on unmount
    };
  }, [onAction]);

  return null; // This component doesn't render anything
}

// Hook for other components to trigger engagement events
export const useEngagement = () => {
  const triggerEvent = (eventType, data = {}) => {
    window.dispatchEvent(new CustomEvent(eventType, { detail: data }));
  };

  return {
    trackAchievement: (achievement) => triggerEvent('achievement-unlocked', achievement),
    trackChallenge: (challenge) => triggerEvent('challenge-completed', challenge),
    trackSocialAction: (action) => triggerEvent('social-action', action),
    trackNotification: (notification) => triggerEvent('notification-received', notification)
  };
};

export default MobileEngagementIntegration;