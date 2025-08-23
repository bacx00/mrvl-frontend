import React from 'react';
import UserAvatar from '../common/UserAvatar';
import { getImageUrl } from '../../utils/imageUtils';

function UserDisplay({ 
  user, 
  showAvatar = true, 
  showTeamFlair = true, 
  showHeroFlair = true,
  size = 'sm', // 'xs', 'sm', 'md', 'lg'
  className = '',
  clickable = false,
  navigateTo = null
}) {
  if (!user) {
    return <span className="text-gray-500">Unknown User</span>;
  }

  const sizeClasses = {
    xs: 'w-4 h-4 text-xs',
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-base',
    lg: 'w-10 h-10 text-lg'
  };

  const handleClick = () => {
    if (clickable && navigateTo && user.id) {
      navigateTo('user-profile', { id: user.id });
    }
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Avatar with hero flair */}
      {showAvatar && (
        <UserAvatar user={user} size={size} showFlairs={false} showName={false} />
      )}

      {/* Username */}
      <span 
        className={`font-medium ${
          clickable 
            ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 cursor-pointer' 
            : 'text-gray-900 dark:text-white'
        }`}
        onClick={handleClick}
      >
        {user.name || user.username}
      </span>

      {/* Team Flair Logo (right side of username) */}
      {showTeamFlair && user.team_flair && user.show_team_flair && (
        <div className={`${sizeClasses[size]} flex-shrink-0`}>
          {user.team_flair.logo ? (
            <>
              <img 
                src={getImageUrl(user.team_flair.logo, 'team-logo')}
                alt={user.team_flair.short_name || user.team_flair.name}
                className={`${sizeClasses[size]} object-contain rounded`}
                title={user.team_flair.name}
                onError={(e) => { e.target.src = getImageUrl(null, 'team-logo'); }}
              />
              <div 
                className={`${sizeClasses[size]} rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs hidden`}
                title={user.team_flair.name}
              >
                {user.team_flair.short_name || user.team_flair.name.substring(0, 3).toUpperCase()}
              </div>
            </>
          ) : (
            <div 
              className={`${sizeClasses[size]} rounded bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs`}
              title={user.team_flair.name}
            >
              {user.team_flair.short_name || user.team_flair.name.substring(0, 3).toUpperCase()}
            </div>
          )}
        </div>
      )}


      {/* Role badges */}
      {user.roles && user.roles.length > 0 && (
        <div className="flex space-x-1">
          {user.roles.map(role => (
            <span 
              key={role}
              className={`px-1.5 py-0.5 text-xs font-bold rounded ${
                role === 'admin' 
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                  : role === 'moderator'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              {role.toUpperCase()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Utility function to parse text with clickable @mentions
export const parseTextWithMentions = (text, navigateTo, mentions = []) => {
  if (!text) return null;
  
  // Create a map of mention texts to mention objects for quick lookup
  const mentionMap = {};
  mentions.forEach(mention => {
    const mentionText = mention.mention_text || `@${mention.name}`;
    mentionMap[mentionText] = mention;
  });
  
  // Enhanced regex to match different mention patterns
  const mentionPatterns = [
    { regex: /@player:([a-zA-Z0-9_]+)/g, type: 'player', prefix: '@player:' },
    { regex: /@team:([a-zA-Z0-9_]+)/g, type: 'team', prefix: '@team:' },
    { regex: /@([a-zA-Z0-9_]+)(?!:)/g, type: 'user', prefix: '@' }
  ];
  
  let processedText = text;
  let offset = 0;
  const replacements = [];
  
  // Find all mentions and prepare replacements
  mentionPatterns.forEach(({ regex, type, prefix }) => {
    let match;
    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const identifier = match[1];
      const startPos = match.index;
      const endPos = match.index + fullMatch.length;
      
      // Check if we have data for this mention
      const mentionData = mentionMap[fullMatch];
      
      replacements.push({
        start: startPos,
        end: endPos,
        original: fullMatch,
        type,
        identifier,
        data: mentionData
      });
    }
  });
  
  // Sort replacements by position (descending to avoid position shifts)
  replacements.sort((a, b) => b.start - a.start);
  
  // If no replacements, just return text
  if (replacements.length === 0) {
    return text;
  }
  
  // Split text and create elements
  const parts = [];
  let lastIndex = text.length;
  
  replacements.forEach(replacement => {
    // Add text after this mention
    if (lastIndex > replacement.end) {
      parts.unshift(text.slice(replacement.end, lastIndex));
    }
    
    // Add the mention
    if (replacement.data) {
      parts.unshift(
        <span
          key={`mention-${replacement.start}`}
          className={`mention-link font-medium px-1 rounded cursor-pointer transition-colors ${
            replacement.type === 'player' 
              ? 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              : replacement.type === 'team'
              ? 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20'
              : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (navigateTo && replacement.data) {
              switch (replacement.type) {
                case 'player':
                  navigateTo('player-detail', { id: replacement.data.id });
                  break;
                case 'team':
                  navigateTo('team-detail', { id: replacement.data.id });
                  break;
                case 'user':
                  navigateTo('user-profile', { id: replacement.data.id });
                  break;
                default:
                  console.warn('Unknown mention type:', replacement.type);
              }
            }
          }}
          title={`View ${replacement.type}: ${replacement.data.display_name || replacement.data.name}`}
        >
          {replacement.original}
        </span>
      );
    } else {
      // No data found, render as plain text
      parts.unshift(replacement.original);
    }
    
    // Add text before this mention
    if (replacement.start > 0) {
      parts.unshift(text.slice(0, replacement.start));
    }
    
    lastIndex = replacement.start;
  });
  
  return parts.length > 0 ? parts : text;
};

export default UserDisplay;