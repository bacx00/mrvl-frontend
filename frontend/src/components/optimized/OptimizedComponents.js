import React, { memo } from 'react';
import { TeamLogo, getNewsFeaturedImageUrl, getImageUrl } from '../../utils/imageUtils';
import { formatDateSafe } from '../../lib/utils';

// Memoized match card component
export const MatchCard = memo(({ match, onClick }) => {
  if (!match || !match.team1 || !match.team2) return null;
  
  return (
    <div 
      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors touch-target"
      onClick={() => onClick(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(match)}
    >
      {/* Event Logo and Info Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {match.event?.logo && (
            <img 
              src={getImageUrl(match.event.logo)}
              alt={match.event.name}
              className="w-5 h-5 rounded object-cover"
              loading="lazy"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <span className="text-xs font-medium text-red-600 dark:text-red-400">
            {match.status === 'live' ? 'LIVE' : match.time}
          </span>
          {match.status === 'live' && match.viewers > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {match.viewers.toLocaleString()} viewers
            </span>
          )}
        </div>
      </div>
      
      <div className="text-center">
        {/* Team displays */}
        <div className="flex items-center justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
          <div className={`flex items-center space-x-2 ${match.status === 'completed' && match.team1_score <= match.team2_score ? 'opacity-50' : ''}`}>
            <TeamLogo team={match.team1} size="w-6 h-6" />
            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">
              {match.team1.short_name || match.team1.name}
            </span>
          </div>
          
          <div className="text-center px-2">
            <div className="text-red-600 dark:text-red-400 font-bold text-lg">
              <span className={match.status === 'completed' && match.team1_score > match.team2_score ? 'text-green-600 dark:text-green-400' : ''}>
                {match.team1_score || 0}
              </span>
              -
              <span className={match.status === 'completed' && match.team2_score > match.team1_score ? 'text-green-600 dark:text-green-400' : ''}>
                {match.team2_score || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {match.format}
            </div>
          </div>
          
          <div className={`flex items-center space-x-2 ${match.status === 'completed' && match.team2_score <= match.team1_score ? 'opacity-50' : ''}`}>
            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">
              {match.team2.short_name || match.team2.name}
            </span>
            <TeamLogo team={match.team2} size="w-6 h-6" />
          </div>
        </div>
        
        {/* Tournament name */}
        <div className="text-xs text-gray-500 dark:text-gray-500 truncate font-medium">
          {match.event?.name}
        </div>
      </div>
    </div>
  );
});

// Memoized news card component
export const NewsCard = memo(({ article, onClick }) => {
  if (!article) return null;
  
  return (
    <div 
      className="flex space-x-3 cursor-pointer group touch-target"
      onClick={() => onClick(article)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(article)}
    >
      <img 
        src={getNewsFeaturedImageUrl(article)} 
        alt={article.title}
        className="w-20 h-16 object-cover rounded group-hover:opacity-80 transition-opacity"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://staging.mrvl.net/images/news-placeholder.svg';
        }}
      />
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
          {article.title}
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">
          {article.excerpt || article.content?.substring(0, 100)}
        </p>
        <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
          <span className="text-gray-600 dark:text-gray-400">
            {article.author?.name || 'MRVL Team'}
          </span>
          <span>•</span>
          <span>{formatDateSafe(article.created_at)}</span>
        </div>
      </div>
    </div>
  );
});

// Memoized discussion card component  
export const DiscussionCard = memo(({ discussion, onClick }) => {
  if (!discussion) return null;
  
  return (
    <div 
      className="recent-discussion-item cursor-pointer touch-target"
      onClick={() => onClick(discussion)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(discussion)}
    >
      <h3 className="recent-discussion-title text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors">
        {discussion.title}
      </h3>
      <div className="flex items-center justify-between recent-discussion-meta">
        <span className="truncate text-xs text-gray-600 dark:text-gray-400">
          {discussion.author}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {discussion.replies}
        </span>
      </div>
      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {discussion.lastActivity}
      </div>
    </div>
  );
});

// Memoized loading component
export const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center py-8">
    <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
      <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm">Loading...</span>
    </div>
  </div>
));

// Memoized empty state component
export const EmptyState = memo(({ icon, title, description }) => (
  <div className="p-4 text-center text-gray-500 dark:text-gray-500">
    <div className="text-2xl mb-2">{icon}</div>
    <div className="text-sm">{title || description}</div>
  </div>
));

// Memoized section header component
export const SectionHeader = memo(({ title, icon, onClick, actionText = "View all →" }) => (
  <div 
    className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors touch-target"
    onClick={onClick}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === 'Enter' && onClick()}
  >
    <div className="flex items-center justify-between">
      <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center">
        {icon}
        {title}
      </h2>
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors touch-target"
      >
        {actionText}
      </button>
    </div>
  </div>
));

MatchCard.displayName = 'MatchCard';
NewsCard.displayName = 'NewsCard';
DiscussionCard.displayName = 'DiscussionCard';
LoadingSpinner.displayName = 'LoadingSpinner';
EmptyState.displayName = 'EmptyState';
SectionHeader.displayName = 'SectionHeader';