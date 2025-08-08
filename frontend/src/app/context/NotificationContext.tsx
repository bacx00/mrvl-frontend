// src/context/NotificationContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { NotificationContextType, Notification, NotificationSettings } from '@/lib/types';
import { storage, generateId } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

// Default notification settings
const DEFAULT_SETTINGS: NotificationSettings = {
  in_app: true,
  email: true,
  push: false,
  types: {
    mentions: true,
    replies: true,
    likes: true,
    follows: true,
    match_updates: true,
    news: true,
    system: true,
  },
  frequency: 'immediate',
  quiet_hours: {
    enabled: false,
    start_time: '22:00',
    end_time: '08:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  },
};

// Create context with proper default values
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  settings: DEFAULT_SETTINGS,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  removeNotification: () => {},
  updateSettings: () => {},
  clearAll: () => {},
  getNotificationsByType: () => [],
  requestPermission: async () => 'default',
  isInQuietHours: () => false,
});

// Custom hook to use notification context
export function useNotifications(): NotificationContextType {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Provider component with comprehensive notification functionality
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');

  // Initialize notifications and settings on mount
  useEffect(() => {
    initializeNotifications();
    checkNotificationPermission();
  }, []);

  // Initialize from storage
  const initializeNotifications = useCallback(() => {
    try {
      const storedSettings = storage.get<NotificationSettings>(STORAGE_KEYS.NOTIFICATION_SETTINGS);
      if (storedSettings) {
        setSettings({ ...DEFAULT_SETTINGS, ...storedSettings });
      }

      // Don't persist notifications across sessions for privacy
      // Only keep system notifications that are important
      setNotifications([]);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, []);

  // Check browser notification permission
  const checkNotificationPermission = useCallback(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Request browser notification permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, []);

  // Check if currently in quiet hours
  const isInQuietHours = useCallback((): boolean => {
    if (!settings.quiet_hours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = settings.quiet_hours.start_time.split(':').map(Number);
    const [endHour, endMinute] = settings.quiet_hours.end_time.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle quiet hours that span midnight
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  }, [settings.quiet_hours]);

  // Add notification to the queue
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'created_at' | 'updated_at'>) => {
    // Check if this type of notification is enabled
    if (!settings.in_app || !settings.types[notificationData.type]) {
      return;
    }

    // Check quiet hours for non-urgent notifications
    if (notificationData.priority !== 'urgent' && isInQuietHours()) {
      return;
    }

    const newNotification: Notification = {
      ...notificationData,
      id: generateId('notification'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep max 50 notifications

    // Show browser notification if enabled and permitted
    if (settings.push && permissionStatus === 'granted') {
      showBrowserNotification(newNotification);
    }

    // Auto-dismiss based on priority
    const dismissTime = getDismissTime(newNotification.priority);
    if (dismissTime > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, dismissTime);
    }

    // Play sound/vibration if enabled
    playNotificationFeedback(newNotification);

    // Track notification event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'notification_received', {
        notification_type: newNotification.type,
        priority: newNotification.priority,
      });
    }
  }, [settings, permissionStatus, isInQuietHours]);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: Notification) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: isInQuietHours(),
      });

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }

      // Handle click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.action_url) {
          window.location.href = notification.action_url;
        }
        browserNotification.close();
      };
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, [isInQuietHours]);

  // Play notification feedback (sound/vibration)
  const playNotificationFeedback = useCallback((notification: Notification) => {
    // Vibration for mobile devices
    if ('navigator' in window && 'vibrate' in navigator && !isInQuietHours()) {
      const vibrationPattern = getVibrationPattern(notification.priority);
      navigator.vibrate(vibrationPattern);
    }

    // Audio feedback (could be implemented with actual sound files)
    if (!isInQuietHours() && notification.priority === 'urgent') {
      // Play urgent notification sound
      playNotificationSound('urgent');
    } else if (!isInQuietHours()) {
      // Play normal notification sound
      playNotificationSound('normal');
    }
  }, [isInQuietHours]);

  // Get vibration pattern based on priority
  const getVibrationPattern = useCallback((priority: Notification['priority']): number[] => {
    switch (priority) {
      case 'urgent':
        return [200, 100, 200, 100, 200]; // Strong pattern
      case 'high':
        return [100, 50, 100]; // Medium pattern
      case 'normal':
        return [100]; // Single vibration
      case 'low':
        return []; // No vibration
      default:
        return [100];
    }
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback((type: 'normal' | 'urgent') => {
    try {
      // Web Audio API implementation
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different notification types
      oscillator.frequency.setValueAtTime(type === 'urgent' ? 800 : 400, audioContext.currentTime);
      oscillator.type = 'sine';

      // Short beep
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }, []);

  // Get auto-dismiss time based on priority
  const getDismissTime = useCallback((priority: Notification['priority']): number => {
    switch (priority) {
      case 'urgent':
        return 0; // Don't auto-dismiss urgent notifications
      case 'high':
        return 10000; // 10 seconds
      case 'normal':
        return 5000; // 5 seconds
      case 'low':
        return 3000; // 3 seconds
      default:
        return 5000;
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id
          ? { ...notification, read: true, read_at: new Date().toISOString() }
          : notification
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const now = new Date().toISOString();
    setNotifications(prev =>
      prev.map(notification => ({
        ...notification,
        read: true,
        read_at: notification.read_at || now,
      }))
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update notification settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    storage.set(STORAGE_KEYS.NOTIFICATION_SETTINGS, updatedSettings);
  }, [settings]);

  // Get notifications by type
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  // Get unread count
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Get recent notifications (last 24 hours)
  const getRecentNotifications = useCallback(() => {
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    
    return notifications.filter(notification => 
      new Date(notification.created_at) > oneDayAgo
    );
  }, [notifications]);

  // Utility functions for common notification types
  const showSuccess = useCallback((title: string, message: string) => {
    addNotification({
      type: 'system',
      title,
      message,
      recipient: { id: 'current' } as any, // Type assertion for system notifications
      priority: 'normal',
      delivery_methods: ['in_app'],
    });
  }, [addNotification]);

  const showError = useCallback((title: string, message: string) => {
    addNotification({
      type: 'system',
      title,
      message,
      recipient: { id: 'current' } as any,
      priority: 'high',
      delivery_methods: ['in_app'],
    });
  }, [addNotification]);

  const showWarning = useCallback((title: string, message: string) => {
    addNotification({
      type: 'system',
      title,
      message,
      recipient: { id: 'current' } as any,
      priority: 'normal',
      delivery_methods: ['in_app'],
    });
  }, [addNotification]);

  const showInfo = useCallback((title: string, message: string) => {
    addNotification({
      type: 'system',
      title,
      message,
      recipient: { id: 'current' } as any,
      priority: 'low',
      delivery_methods: ['in_app'],
    });
  }, [addNotification]);

  // Context value with all functionality
  const value: NotificationContextType = {
    // Core state
    notifications,
    unreadCount,
    settings,

    // Core methods
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    updateSettings,
    clearAll,

    // Helper methods
    getNotificationsByType,
    getRecentNotifications,
    requestPermission,
    isInQuietHours,

    // Utility methods
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Advanced features
    permissionStatus,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationRenderer notifications={notifications} onRemove={removeNotification} onMarkAsRead={markAsRead} />
    </NotificationContext.Provider>
  );
}

// Component to render notifications as toasts - DISABLED
function NotificationRenderer({ 
  notifications, 
  onRemove, 
  onMarkAsRead 
}: { 
  notifications: Notification[];
  onRemove: (id: string) => void;
  onMarkAsRead: (id: string) => void;
}) {
  // Don't render any toast notifications to prevent error banners
  return null;
}

// Individual toast component
function Toast({ 
  notification, 
  onClose, 
  onRead 
}: { 
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
}) {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  }, [onClose]);

  const handleClick = useCallback(() => {
    onRead();
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
  }, [notification.action_url, onRead]);

  const getToastClass = useCallback(() => {
    const baseClass = 'toast';
    const priorityClass = {
      urgent: 'error',
      high: 'warning',
      normal: 'success',
      low: 'info',
    }[notification.priority] || 'info';

    return `${baseClass} ${priorityClass} ${isVisible ? 'visible' : 'hidden'}`;
  }, [notification.priority, isVisible]);

  return (
    <div className={getToastClass()} onClick={handleClick}>
      <div className="toast-content">
        <div className="toast-title">{notification.title}</div>
        <div className="toast-message">{notification.message}</div>
      </div>
      <button className="toast-close" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
        ×
      </button>
    </div>
  );
}

export default NotificationContext;
