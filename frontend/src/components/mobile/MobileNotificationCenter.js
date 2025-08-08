import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, X, Check, Trash2, Filter, Settings, User, Trophy, MessageSquare,
  Calendar, Star, Heart, UserPlus, Users, Zap, Target, Gift, Award,
  TrendingUp, Flame, Shield, Crown, AlertCircle, CheckCircle, Info,
  Gamepad2, Medal, Coins, ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { useAuth } from '../../hooks';
import HeroImage from '../shared/HeroImage';

// Mobile Notification Center with Rich Interactions
function MobileNotificationCenter({ isOpen, onClose, navigateTo }) {
  const { user, api } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const notificationRef = useRef(null);

  // Notification categories
  const categories = {
    all: { icon: Bell, label: 'All', color: 'gray' },
    social: { icon: Users, label: 'Social', color: 'blue' },
    achievements: { icon: Trophy, label: 'Achievements', color: 'yellow' },
    matches: { icon: Calendar, label: 'Matches', color: 'green' },
    system: { icon: Settings, label: 'System', color: 'purple' },
    challenges: { icon: Target, label: 'Challenges', color: 'red' }
  };

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/user/notifications', {
        params: {
          filter: filter !== 'all' ? filter : undefined,
          search: searchQuery || undefined,
          limit: 50
        }
      });
      
      setNotifications(response.data?.data || response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Mock data for demo
      setNotifications([
        {
          id: 1,
          type: 'achievement',
          category: 'achievements',
          title: 'New Achievement Unlocked!',
          message: 'You earned the "First Comment" badge for posting your first comment.',
          data: {
            badge: 'First Comment',
            xp: 50,
            icon: 'trophy'
          },
          read: false,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          type: 'social',
          category: 'social',
          title: 'New Follower',
          message: 'ProGamer2024 started following you',
          data: {
            user: { id: 123, name: 'ProGamer2024', avatar: null },
            action: 'follow'
          },
          read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 3,
          type: 'match',
          category: 'matches',
          title: 'Match Starting Soon',
          message: 'Team Liquid vs Sentinels starts in 15 minutes',
          data: {
            match_id: 456,
            team1: 'Team Liquid',
            team2: 'Sentinels',
            time: '15 minutes'
          },
          read: true,
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: 4,
          type: 'challenge',
          category: 'challenges',
          title: 'Daily Challenge',
          message: 'Complete today\'s challenge: Comment on 3 matches',
          data: {
            challenge: 'daily_comments',
            progress: 1,
            target: 3,
            reward: '100 XP'
          },
          read: false,
          created_at: new Date(Date.now() - 10800000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [api, filter, searchQuery]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/user/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/user/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/user/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      showToast('All notifications marked as read', 'success');
    } catch (error) {
      console.error('Error marking all as read:', error);
      showToast('Failed to mark all as read', 'error');
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    try {
      await api.delete('/user/notifications/clear-all');
      setNotifications([]);
      showToast('All notifications cleared', 'success');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showToast('Failed to clear notifications', 'error');
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'social':
        if (notification.data?.user?.id) {
          navigateTo('user-profile', { id: notification.data.user.id });
        }
        break;
      case 'match':
        if (notification.data?.match_id) {
          navigateTo('match-detail', { id: notification.data.match_id });
        }
        break;
      case 'achievement':
        navigateTo('achievements');
        break;
      case 'challenge':
        navigateTo('challenges');
        break;
      default:
        break;
    }

    onClose();
  };

  // Selection mode handlers
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications(new Set());
  };

  const toggleNotificationSelection = (notificationId) => {
    const newSelection = new Set(selectedNotifications);
    if (newSelection.has(notificationId)) {
      newSelection.delete(notificationId);
    } else {
      newSelection.add(notificationId);
    }
    setSelectedNotifications(newSelection);
  };

  const handleBulkAction = async (action) => {
    const selectedIds = Array.from(selectedNotifications);
    
    switch (action) {
      case 'read':
        for (const id of selectedIds) {
          await markAsRead(id);
        }
        showToast(`${selectedIds.length} notifications marked as read`, 'success');
        break;
      case 'delete':
        for (const id of selectedIds) {
          await deleteNotification(id);
        }
        showToast(`${selectedIds.length} notifications deleted`, 'success');
        break;
    }
    
    setSelectedNotifications(new Set());
    setIsSelectionMode(false);
  };

  // Get notification icon
  const getNotificationIcon = (notification) => {
    const iconMap = {
      achievement: Trophy,
      social: Users,
      match: Calendar,
      challenge: Target,
      system: Settings,
      follow: UserPlus,
      like: Heart,
      comment: MessageSquare,
      friend_request: User
    };
    
    return iconMap[notification.type] || Bell;
  };

  // Get notification color
  const getNotificationColor = (notification) => {
    const colorMap = {
      achievement: 'text-yellow-500',
      social: 'text-blue-500',
      match: 'text-green-500',
      challenge: 'text-red-500',
      system: 'text-purple-500'
    };
    
    return colorMap[notification.category] || 'text-gray-500';
  };

  // Time formatting
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
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

  const filteredNotifications = notifications.filter(notification => {
    if (filter !== 'all' && notification.category !== filter) return false;
    if (searchQuery && !notification.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !notification.message.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white dark:bg-gray-900 w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {isSelectionMode ? (
                <>
                  <span className="text-sm text-gray-500">
                    {selectedNotifications.size} selected
                  </span>
                  <button
                    onClick={toggleSelectionMode}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`p-2 rounded-lg transition-colors ${
                      showFilters ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Filter className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          {showFilters && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* Category Filters */}
              <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
                {Object.entries(categories).map(([key, category]) => {
                  const Icon = category.icon;
                  const isActive = filter === key;
                  const count = key === 'all' ? notifications.length : notifications.filter(n => n.category === key).length;
                  
                  return (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{category.label}</span>
                      {count > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20' : 'bg-gray-300 dark:bg-gray-600'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Bar */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              {isSelectionMode ? (
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)))}
                    className="text-blue-500 font-medium text-sm"
                  >
                    Select All
                  </button>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction('read')}
                      disabled={selectedNotifications.size === 0}
                      className="px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      Mark Read
                    </button>
                    <button
                      onClick={() => handleBulkAction('delete')}
                      disabled={selectedNotifications.size === 0}
                      className="px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <button
                    onClick={toggleSelectionMode}
                    className="text-gray-500 font-medium text-sm"
                  >
                    Select
                  </button>
                  
                  <div className="flex space-x-4">
                    <button
                      onClick={markAllAsRead}
                      className="text-blue-500 font-medium text-sm"
                    >
                      Mark All Read
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-red-500 font-medium text-sm"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : filteredNotifications.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification) => {
                const Icon = getNotificationIcon(notification);
                const isSelected = selectedNotifications.has(notification.id);
                
                return (
                  <div
                    key={notification.id}
                    className={`relative p-4 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    } ${
                      isSelectionMode ? 'pl-12' : ''
                    } hover:bg-gray-50 dark:hover:bg-gray-800/50`}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleNotificationSelection(notification.id);
                      } else {
                        handleNotificationClick(notification);
                      }
                    }}
                  >
                    {/* Selection Checkbox */}
                    {isSelectionMode && (
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className={`p-2 rounded-full ${getNotificationColor(notification)} bg-current bg-opacity-10 flex-shrink-0`}>
                        <Icon className={`w-5 h-5 ${getNotificationColor(notification)}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            
                            {/* Additional Data */}
                            {notification.data && (
                              <div className="mt-2">
                                {notification.type === 'achievement' && (
                                  <div className="flex items-center space-x-2 text-xs text-yellow-600 dark:text-yellow-400">
                                    <Trophy className="w-3 h-3" />
                                    <span>+{notification.data.xp} XP</span>
                                  </div>
                                )}
                                
                                {notification.type === 'challenge' && (
                                  <div className="flex items-center space-x-2 text-xs text-red-600 dark:text-red-400">
                                    <Target className="w-3 h-3" />
                                    <span>{notification.data.progress}/{notification.data.target} progress</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Timestamp and Actions */}
                          <div className="flex flex-col items-end space-y-2 ml-2">
                            <span className="text-xs text-gray-500">
                              {formatTime(notification.created_at)}
                            </span>
                            
                            {!isSelectionMode && (
                              <div className="flex space-x-1">
                                {!notification.read && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      markAsRead(notification.id);
                                    }}
                                    className="p-1 text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.read && (
                          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-sm text-center">
                {filter === 'all' ? 
                  "You're all caught up!" : 
                  `No ${categories[filter]?.label.toLowerCase()} notifications`
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MobileNotificationCenter;