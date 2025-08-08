// src/components/NotificationBell.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

export interface Notification {
  id: string;
  type: 'mention' | 'reply' | 'like' | 'follow' | 'match' | 'event' | 'system';
  title: string;
  message: string;
  url?: string;
  isRead: boolean;
  createdAt: Date;
  
  // User who triggered the notification
  triggeredBy?: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
  };
  
  // Context data
  context?: {
    threadTitle?: string;
    matchTitle?: string;
    eventTitle?: string;
    postContent?: string;
  };
  
  // Visual styling
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
}

interface NotificationBellProps {
  maxDisplayCount?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showCategories?: boolean;
  enableSound?: boolean;
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({
  maxDisplayCount = 10,
  autoRefresh = true,
  refreshInterval = 30000,
  showCategories = true,
  enableSound = true,
  className = '',
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  const { user } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, [enableSound]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      const newNotifications = data.notifications.map((n: any) => ({
        ...n,
        createdAt: new Date(n.createdAt)
      }));

      // Check for new notifications and play sound
      if (enableSound && notifications.length > 0 && audioRef.current) {
        const newUnreadCount = newNotifications.filter((n: Notification) => !n.isRead).length;
        const oldUnreadCount = notifications.filter(n => !n.isRead).length;
        
        if (newUnreadCount > oldUnreadCount) {
          audioRef.current.play().catch(() => {
            // Sound play failed, ignore silently
          });
        }
      }

      setNotifications(newNotifications);
      setLastChecked(new Date());
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [user, notifications.length, enableSound]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    if (user) {
      fetchNotifications();

      if (autoRefresh) {
        refreshIntervalRef.current = setInterval(fetchNotifications, refreshInterval);
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user, fetchNotifications, autoRefresh, refreshInterval]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        !bellRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Custom click handler
    onNotificationClick?.(notification);

    // Navigate if URL provided
    if (notification.url) {
      window.location.href = notification.url;
    }

    setIsOpen(false);
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );

      onMarkAsRead?.(notificationId);
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );

      onMarkAllAsRead?.();
      
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: Notification['type']) => {
    const iconClasses = "w-4 h-4";
    
    switch (type) {
      case 'mention':
        return (
          <svg className={`${iconClasses} text-[#fa4454]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'reply':
        return (
          <svg className={`${iconClasses} text-[#4ade80]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        );
      case 'like':
        return (
          <svg className={`${iconClasses} text-[#f59e0b]`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
        );
      case 'follow':
        return (
          <svg className={`${iconClasses} text-[#3b82f6]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'match':
        return (
          <svg className={`${iconClasses} text-[#8b5cf6]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'event':
        return (
          <svg className={`${iconClasses} text-[#10b981]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'system':
        return (
          <svg className={`${iconClasses} text-[#768894]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClasses} text-[#768894]`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a6 6 0 016-6V4H4v15z" />
          </svg>
        );
    }
  };

  // Get priority styling
  const getPriorityStyle = (priority: Notification['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-4 border-[#ef4444] bg-[#ef4444]/10';
      case 'high':
        return 'border-l-4 border-[#f59e0b] bg-[#f59e0b]/10';
      case 'low':
        return 'border-l-4 border-[#768894] bg-[#768894]/10';
      default:
        return 'border-l-4 border-transparent';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.isRead;
    return notification.type === filter;
  }).slice(0, maxDisplayCount);

  // Count unread notifications
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      
      {/* Bell Button */}
      <button
        ref={bellRef}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded-lg transition-colors"
        title="Notifications"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a6 6 0 016-6V4H4v15z" />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#fa4454] rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </div>
        )}
        
        {/* Pulse animation for new notifications */}
        {unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#fa4454] rounded-full animate-ping opacity-75"></div>
        )}
      </button>
      
      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 top-full mt-2 w-96 bg-[#1a2332] border border-[#2b3d4d] rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
        >
          
          {/* Header */}
          <div className="p-4 border-b border-[#2b3d4d]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Notifications</h3>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-[#fa4454] hover:text-[#e03e4e] transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                
                <Link
                  href={ROUTES.NOTIFICATIONS}
                  className="text-xs text-[#768894] hover:text-white transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  View all
                </Link>
              </div>
            </div>
            
            {/* Filter Tabs */}
            {showCategories && (
              <div className="flex space-x-1">
                {['all', 'unread', 'mention', 'reply', 'match'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-3 py-1 text-xs rounded transition-colors ${
                      filter === filterType
                        ? 'bg-[#fa4454] text-white'
                        : 'bg-[#2b3d4d] text-[#768894] hover:text-white'
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fa4454] mx-auto mb-2"></div>
                <p className="text-sm text-[#768894]">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-[#ef4444] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-[#ef4444] mb-2">{error}</p>
                <button
                  onClick={fetchNotifications}
                  className="text-xs text-[#fa4454] hover:text-[#e03e4e] transition-colors"
                >
                  Try again
                </button>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-12 h-12 text-[#768894] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-sm text-[#768894]">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#2b3d4d]">
                {filteredNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full p-4 text-left hover:bg-[#20303d] transition-colors ${
                      !notification.isRead ? 'bg-[#fa4454]/5' : ''
                    } ${getPriorityStyle(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${
                              notification.isRead ? 'text-[#768894]' : 'text-white'
                            }`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm mt-1 line-clamp-2 ${
                              notification.isRead ? 'text-[#768894]' : 'text-[#768894]'
                            }`}>
                              {notification.message}
                            </p>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-[#fa4454] rounded-full flex-shrink-0 ml-2 mt-2"></div>
                          )}
                        </div>
                        
                        {/* Footer */}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-[#768894]">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                          
                          {notification.triggeredBy && (
                            <div className="flex items-center space-x-1">
                              {notification.triggeredBy.avatar ? (
                                <div className="w-4 h-4 relative rounded overflow-hidden">
                                  <img 
                                    src={notification.triggeredBy.avatar} 
                                    alt={notification.triggeredBy.username}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-4 h-4 bg-[#fa4454] rounded flex items-center justify-center">
                                  <span className="text-white font-bold text-xs">
                                    {notification.triggeredBy.username.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <span className="text-xs text-[#768894]">
                                {notification.triggeredBy.username}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          {notifications.length > maxDisplayCount && (
            <div className="p-3 border-t border-[#2b3d4d] text-center">
              <Link
                href={ROUTES.NOTIFICATIONS}
                className="text-sm text-[#fa4454] hover:text-[#e03e4e] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all {notifications.length} notifications →
              </Link>
            </div>
          )}
          
          {/* Last checked indicator */}
          {lastChecked && (
            <div className="px-4 py-2 bg-[#0f1419] text-xs text-[#768894] text-center">
              Last updated: {formatTimeAgo(lastChecked)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
