import React, { createContext, useContext, useState, useEffect } from 'react';
import MentionNotificationToast from '../components/shared/MentionNotificationToast';
import mentionService from '../services/mentionService';

const MentionNotificationContext = createContext();

export const useMentionNotifications = () => {
  const context = useContext(MentionNotificationContext);
  if (!context) {
    throw new Error('useMentionNotifications must be used within a MentionNotificationProvider');
  }
  return context;
};

export const MentionNotificationProvider = ({ children, currentUser }) => {
  const [notifications, setNotifications] = useState([]);
  const [settings, setSettings] = useState({
    enabled: true,
    position: 'top-right',
    duration: 5000,
    maxVisible: 3
  });

  // Subscribe to mention updates for the current user
  useEffect(() => {
    if (!currentUser?.id) return;

    const handleUserMentions = (update) => {
      if (update.type === 'mention.created' && settings.enabled) {
        addNotification({
          id: Date.now(),
          type: 'mention_created',
          message: `${update.data.mentioned_by?.name} mentioned you in ${update.data.content?.title}`,
          data: update.data,
          duration: settings.duration
        });
      }
    };

    // Subscribe to user mention updates
    const unsubscribe = mentionService.subscribe('user', currentUser.id, handleUserMentions);

    return unsubscribe;
  }, [currentUser?.id, settings.enabled, settings.duration]);

  const addNotification = (notification) => {
    setNotifications(prev => {
      const newNotifications = [notification, ...prev];
      // Keep only max visible notifications
      return newNotifications.slice(0, settings.maxVisible);
    });
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const updateSettings = (newSettings) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <MentionNotificationContext.Provider
      value={{
        notifications,
        settings,
        addNotification,
        removeNotification,
        updateSettings,
        clearAllNotifications
      }}
    >
      {children}
      
      {/* Render notifications */}
      {notifications.map((notification, index) => (
        <MentionNotificationToast
          key={notification.id}
          notification={notification}
          position={settings.position}
          onDismiss={() => removeNotification(notification.id)}
          style={{
            // Stack notifications with offset
            transform: `translateY(${index * 10}px)`,
            zIndex: 1000 - index
          }}
        />
      ))}
    </MentionNotificationContext.Provider>
  );
};

export default MentionNotificationContext;