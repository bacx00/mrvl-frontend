import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from './UserDisplay';

function PlayerMentions({ playerId, playerName }) {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();

  useEffect(() => {
    fetchMentions();
    
    // Set up live updates every 30 seconds
    const interval = setInterval(fetchMentions, 30000);
    
    return () => clearInterval(interval);
  }, [playerId]);

  const fetchMentions = async () => {
    try {
      const response = await api.get(`/players/${playerId}/mentions`);
      const data = response.data?.data || response.data || [];
      setMentions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching mentions:', error);
      setMentions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo`;
    
    return `${Math.floor(diffInMonths / 12)}y`;
  };

  const getContextIcon = (type) => {
    switch (type) {
      case 'forum_post': return '💬';
      case 'forum_thread': return '📝';
      case 'news_comment': return '📰';
      case 'match_comment': return '🎮';
      default: return '💬';
    }
  };

  const getContextText = (mention) => {
    switch (mention.context_type) {
      case 'forum_post':
        return `in thread "${mention.context_title}"`;
      case 'forum_thread':
        return `created thread "${mention.context_title}"`;
      case 'news_comment':
        return `in news article "${mention.context_title}"`;
      case 'match_comment':
        return `in match discussion "${mention.context_title}"`;
      default:
        return 'in discussion';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mentions.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="text-gray-400 dark:text-gray-600 text-sm">
          No recent mentions of {playerName}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {mentions.slice(0, 10).map((mention, index) => (
        <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
          <div className="flex items-start space-x-3">
            <div className="text-lg flex-shrink-0">
              {getContextIcon(mention.context_type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <UserDisplay 
                  user={mention.mentioned_by} 
                  size="xs" 
                  showAvatar={false}
                  showHeroFlair={true}
                  showTeamFlair={true}
                />
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {formatTimeAgo(mention.created_at)}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                mentioned {playerName} {getContextText(mention)}
              </div>
              {mention.content && (
                <div className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                  "{mention.content.length > 100 ? mention.content.substring(0, 100) + '...' : mention.content}"
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {mentions.length > 10 && (
        <div className="text-center pt-2">
          <button className="text-xs text-red-600 dark:text-red-400 hover:underline">
            View all {mentions.length} mentions
          </button>
        </div>
      )}
    </div>
  );
}

export default PlayerMentions;