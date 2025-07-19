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
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
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
export const parseTextWithMentions = (text, navigateTo) => {
  if (!text) return null;
  
  // Regex to match @mentions
  const mentionRegex = /@([a-zA-Z0-9_]+)/g;
  
  // Split text by mentions while keeping the delimiters
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      const username = part.substring(1);
      return (
        <span
          key={index}
          className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            if (navigateTo) {
              navigateTo('user-profile', { username });
            }
          }}
        >
          {part}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default UserDisplay;