import React from 'react';
import { PlayerAvatar, TeamLogo } from '../../utils/imageUtils';

const MentionLink = ({ 
  mention, 
  className = '', 
  onClick,
  showIcon = true 
}) => {
  const { type, id, name, display_name } = mention;

  // Determine the page navigation based on mention type
  const getNavigation = () => {
    switch (type) {
      case 'player':
        return { page: 'player-detail', params: { id } };
      case 'team':
        return { page: 'team-detail', params: { id } };
      case 'user':
        return { page: 'user-profile', params: { id } };
      default:
        return null;
    }
  };

  // Get icon based on mention type with proper avatars/logos
  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (type) {
      case 'player':
        return (
          <PlayerAvatar 
            player={{ 
              id: id,
              name: display_name || name,
              username: name,
              real_name: display_name,
              avatar: mention.avatar || mention.avatar_url 
            }} 
            size="w-4 h-4" 
            className="mr-1" 
          />
        );
      case 'team':
        return (
          <TeamLogo 
            team={{ 
              id: id,
              name: display_name || name,
              logo: mention.logo || mention.logo_url 
            }} 
            size="w-4 h-4" 
            className="mr-1" 
          />
        );
      case 'user':
        return (
          <div className="inline-flex items-center justify-center w-4 h-4 mr-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full">
            <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">U</span>
          </div>
        );
      default:
        return null;
    }
  };

  // Get colors based on mention type
  const getColors = () => {
    switch (type) {
      case 'player':
        return 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300';
      case 'team':
        return 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300';
      case 'user':
        return 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300';
      default:
        return 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300';
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    const navigation = getNavigation();
    
    if (navigation && window.navigateTo) {
      window.navigateTo(navigation.page, navigation.params);
    }
    
    if (onClick) {
      onClick(mention, e);
    }
  };

  const navigation = getNavigation();
  const displayText = display_name || name;

  if (!navigation) {
    return (
      <span 
        className={`inline-flex items-center font-medium ${getColors()} ${className}`}
        onClick={handleClick}
      >
        {getIcon()}
        @{displayText}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center font-medium hover:underline transition-colors cursor-pointer ${getColors()} ${className}`}
      title={`View ${type}: ${displayText}`}
    >
      {getIcon()}
      @{displayText}
    </button>
  );
};

export default MentionLink;