import React, { useState, useEffect } from 'react';
import { formatNumber, formatTimeAgo } from '../../lib/utils';

const EngagementMetrics = ({
  item, // Can be thread, post, or news article
  type = 'thread', // 'thread', 'post', 'news'
  compact = false,
  showLabels = true,
  showLastActivity = true,
  className = ''
}) => {
  const [viewCount, setViewCount] = useState(item?.viewCount || item?.views_count || 0);
  const [replyCount, setReplyCount] = useState(item?.replyCount || item?.comments_count || 0);

  // Update view count when component mounts (for tracking purposes)
  useEffect(() => {
    // This could trigger a view count API call
    const incrementViewCount = () => {
      if (typeof window !== 'undefined' && item?.id && type === 'news') {
        // Only increment for news articles, threads handle this server-side
        setViewCount(prev => prev + 1);
      }
    };

    const timer = setTimeout(incrementViewCount, 2000); // 2 second delay to count as real view
    return () => clearTimeout(timer);
  }, [item?.id, type]);

  const getMetrics = () => {
    const metrics = [];

    // Views/Reads
    if (viewCount > 0) {
      metrics.push({
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        value: formatNumber(viewCount),
        label: compact ? '' : (viewCount === 1 ? 'view' : 'views'),
        title: `${viewCount.toLocaleString()} ${viewCount === 1 ? 'view' : 'views'}`
      });
    }

    // Replies/Comments
    if (replyCount >= 0) {
      metrics.push({
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        ),
        value: formatNumber(replyCount),
        label: compact ? '' : (type === 'news' ? (replyCount === 1 ? 'comment' : 'comments') : (replyCount === 1 ? 'reply' : 'replies')),
        title: `${replyCount.toLocaleString()} ${type === 'news' ? (replyCount === 1 ? 'comment' : 'comments') : (replyCount === 1 ? 'reply' : 'replies')}`
      });
    }

    // Upvotes/Likes (if available)
    if (item?.upvotes > 0) {
      metrics.push({
        icon: (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        ),
        value: formatNumber(item.upvotes),
        label: compact ? '' : (item.upvotes === 1 ? 'like' : 'likes'),
        title: `${item.upvotes.toLocaleString()} ${item.upvotes === 1 ? 'like' : 'likes'}`,
        color: 'text-green-500'
      });
    }

    // Score (upvotes - downvotes)
    if (item?.score !== undefined && item.score !== 0) {
      const isPositive = item.score > 0;
      metrics.push({
        icon: (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d={isPositive 
              ? "M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z"
              : "M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z"
            } clipRule="evenodd"/>
          </svg>
        ),
        value: isPositive ? `+${item.score}` : item.score.toString(),
        label: compact ? '' : 'score',
        title: `Score: ${item.score}`,
        color: isPositive ? 'text-green-500' : 'text-red-500'
      });
    }

    return metrics;
  };

  const metrics = getMetrics();

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 text-xs text-[#768894] ${className}`}>
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className={`flex items-center space-x-1 ${metric.color || ''}`} 
            title={metric.title}
          >
            {metric.icon}
            <span className="font-medium text-white">{metric.value}</span>
            {showLabels && metric.label && (
              <span className="hidden sm:inline">{metric.label}</span>
            )}
          </div>
        ))}
        
        {showLastActivity && item?.lastActivity?.timestamp && (
          <>
            <span>•</span>
            <span title={new Date(item.lastActivity.timestamp).toLocaleString()}>
              {formatTimeAgo(item.lastActivity.timestamp)}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="text-center">
            <div className={`flex items-center justify-center mb-1 ${metric.color || 'text-[#768894]'}`}>
              {metric.icon}
            </div>
            <div className="text-lg font-bold text-white">{metric.value}</div>
            {showLabels && metric.label && (
              <div className="text-xs text-[#768894] capitalize">{metric.label}</div>
            )}
          </div>
        ))}
      </div>

      {/* Last Activity */}
      {showLastActivity && item?.lastActivity && (
        <div className="border-t border-[#2b3d4d] pt-3">
          <div className="text-sm text-[#768894]">
            Last activity by{' '}
            <span className="text-white font-medium">
              {item.lastActivity.author?.username || 'Unknown'}
            </span>
            {' '}
            <span title={new Date(item.lastActivity.timestamp).toLocaleString()}>
              {formatTimeAgo(item.lastActivity.timestamp)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Activity Indicator Component
export const ActivityIndicator = ({ 
  activity, 
  size = 'sm',
  showDot = true,
  showText = true,
  className = ''
}) => {
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm', 
    md: 'text-base',
    lg: 'text-lg'
  };

  const getActivityColor = (timestamp) => {
    if (!timestamp) return 'text-[#768894]';
    
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMinutes = Math.floor((now - activityTime) / (1000 * 60));
    
    if (diffMinutes < 5) return 'text-[#4ade80]'; // Very recent - green
    if (diffMinutes < 30) return 'text-[#f59e0b]'; // Recent - yellow  
    if (diffMinutes < 120) return 'text-[#fa4454]'; // Moderately recent - red
    return 'text-[#768894]'; // Old - gray
  };

  if (!activity?.timestamp) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${sizeClasses[size]} ${className}`}>
      {showDot && (
        <div 
          className={`w-2 h-2 rounded-full animate-pulse ${
            getActivityColor(activity.timestamp).replace('text-', 'bg-')
          }`}
        />
      )}
      {showText && (
        <span className={getActivityColor(activity.timestamp)}>
          {formatTimeAgo(activity.timestamp)}
        </span>
      )}
    </div>
  );
};

// Engagement Summary Component (for dashboards)
export const EngagementSummary = ({ 
  items = [], 
  type = 'threads',
  timeRange = '24h',
  className = '' 
}) => {
  const getTotalEngagement = () => {
    return items.reduce((total, item) => {
      return {
        views: total.views + (item.viewCount || item.views_count || 0),
        replies: total.replies + (item.replyCount || item.comments_count || 0),
        upvotes: total.upvotes + (item.upvotes || 0)
      };
    }, { views: 0, replies: 0, upvotes: 0 });
  };

  const totals = getTotalEngagement();
  const itemCount = items.length;

  return (
    <div className={`bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {type.charAt(0).toUpperCase() + type.slice(1)} Engagement
        </h3>
        <span className="text-sm text-[#768894]">Last {timeRange}</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{itemCount}</div>
          <div className="text-sm text-[#768894] capitalize">{type}</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{formatNumber(totals.views)}</div>
          <div className="text-sm text-[#768894]">Total Views</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-white">{formatNumber(totals.replies)}</div>
          <div className="text-sm text-[#768894]">
            {type === 'news' ? 'Comments' : 'Replies'}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">{formatNumber(totals.upvotes)}</div>
          <div className="text-sm text-[#768894]">Upvotes</div>
        </div>
      </div>
    </div>
  );
};

export default EngagementMetrics;