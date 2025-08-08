import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TrendingUp, MessageCircle, Users, Calendar, Eye, Star, ChevronRight } from 'lucide-react';

function MobileForumWidgets({ navigateTo }) {
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [activeDiscussions, setActiveDiscussions] = useState([]);
  const [popularUsers, setPopularUsers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();

  useEffect(() => {
    loadWidgetData();
  }, []);

  const loadWidgetData = async () => {
    try {
      setLoading(true);
      const [trending, active, users, activity] = await Promise.all([
        api.get('/forums/trending').catch(() => ({ data: [] })),
        api.get('/forums/active').catch(() => ({ data: [] })),
        api.get('/forums/popular-users').catch(() => ({ data: [] })),
        api.get('/forums/recent-activity').catch(() => ({ data: [] }))
      ]);

      setTrendingTopics(trending.data?.topics || []);
      setActiveDiscussions(active.data?.discussions || []);
      setPopularUsers(users.data?.users || []);
      setRecentActivity(activity.data?.activity || []);
    } catch (error) {
      console.error('Failed to load forum widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d`;
  };

  if (loading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Trending Topics */}
      <div className="mobile-forum-widget">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Trending Topics</h3>
          </div>
          <button
            onClick={() => navigateTo && navigateTo('forums', { filter: 'trending' })}
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-2">
          {trendingTopics.slice(0, 5).map((topic, index) => (
            <div
              key={topic.id || index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => navigateTo && navigateTo('thread-detail', { id: topic.id })}
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  #{index + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate text-sm">
                    {topic.title}
                  </h4>
                  <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="flex items-center space-x-1">
                      <MessageCircle className="w-3 h-3" />
                      <span>{topic.replies || 0}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3 h-3" />
                      <span>{topic.views || 0}</span>
                    </span>
                    <span>{formatTimeAgo(topic.last_activity)}</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Active Discussions */}
      <div className="mobile-forum-widget">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-blue-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Active Discussions</h3>
          </div>
          <button
            onClick={() => navigateTo && navigateTo('forums', { filter: 'active' })}
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-2">
          {activeDiscussions.slice(0, 4).map((discussion) => (
            <div
              key={discussion.id}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => navigateTo && navigateTo('thread-detail', { id: discussion.id })}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 animate-pulse"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1 text-sm">
                    {discussion.title}
                  </h4>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <img
                        src={discussion.last_user?.avatar || '/default-avatar.png'}
                        alt=""
                        className="w-4 h-4 rounded-full"
                      />
                      <span>{discussion.last_user?.name}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(discussion.last_reply_at)}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{discussion.replies} replies</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Popular Contributors */}
      <div className="mobile-forum-widget">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Contributors</h3>
          </div>
          <button
            onClick={() => navigateTo && navigateTo('forums', { filter: 'contributors' })}
            className="text-sm text-blue-500 dark:text-blue-400 hover:underline"
          >
            View All
          </button>
        </div>
        
        <div className="space-y-2">
          {popularUsers.slice(0, 3).map((user, index) => (
            <div
              key={user.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => navigateTo && navigateTo('user-profile', { id: user.id })}
            >
              <div className="flex-shrink-0 w-8 h-8 relative">
                <img
                  src={user.avatar || '/default-avatar.png'}
                  alt=""
                  className="w-full h-full rounded-full object-cover"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 dark:text-white text-sm">{user.name}</h4>
                  {user.role && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                      {user.role}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user.posts_count || 0} posts • {user.reputation || 0} reputation
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mobile-forum-widget">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
          </div>
        </div>
        
        <div className="space-y-2">
          {recentActivity.slice(0, 4).map((activity, index) => (
            <div
              key={activity.id || index}
              className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                {activity.type === 'new_thread' ? (
                  <MessageCircle className="w-3 h-3 text-white" />
                ) : activity.type === 'reply' ? (
                  <ChevronRight className="w-3 h-3 text-white" />
                ) : (
                  <Users className="w-3 h-3 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 dark:text-white">
                  <span className="font-medium">{activity.user?.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {activity.type === 'new_thread' ? ' created a new thread: ' : ' replied to: '}
                  </span>
                  <span 
                    className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    onClick={() => navigateTo && navigateTo('thread-detail', { id: activity.thread_id })}
                  >
                    {activity.thread_title}
                  </span>
                </p>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formatTimeAgo(activity.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mobile-forum-widget">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-red-500 to-pink-500 p-4 rounded-lg text-white">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Total Threads</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {trendingTopics.length + activeDiscussions.length}
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-lg text-white">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <div className="text-2xl font-bold mt-1">
              {popularUsers.length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MobileForumWidgets;