import React from 'react';

const MentionLink = ({ 
  mention, 
  className = '', 
  onClick,
  showIcon = true,
  navigateTo
}) => {
  // Safe property extraction to prevent [object Object] issues
  const safeString = (value) => {
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
      if (value.name && typeof value.name === 'string') return value.name;
      if (value.display_name && typeof value.display_name === 'string') return value.display_name;
      return '';
    }
    return value ? String(value) : '';
  };

  const type = mention?.type || '';
  const id = mention?.id || '';
  const name = safeString(mention?.name);
  const display_name = safeString(mention?.display_name);

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

  // Get icon based on mention type
  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (type) {
      case 'player':
        return (
          <span className="inline-flex items-center justify-center w-3 h-3 mr-1 text-xs bg-blue-100 text-blue-600 rounded-full">
            P
          </span>
        );
      case 'team':
        return (
          <span className="inline-flex items-center justify-center w-3 h-3 mr-1 text-xs bg-red-100 text-red-600 rounded-full">
            T
          </span>
        );
      case 'user':
        return (
          <span className="inline-flex items-center justify-center w-3 h-3 mr-1 text-xs bg-green-100 text-green-600 rounded-full">
            U
          </span>
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
    
    if (navigation && navigateTo) {
      // Use React Router style navigation
      switch (navigation.page) {
        case 'player-detail':
          navigateTo('player-detail', navigation.params);
          break;
        case 'team-detail':
          navigateTo('team-detail', navigation.params);
          break;
        case 'user-profile':
          navigateTo('user-profile', navigation.params);
          break;
        default:
          console.warn('Unknown navigation page:', navigation.page);
      }
    } else if (navigation) {
      // Fallback to window location if navigateTo not provided
      const url = getUrlFromNavigation(navigation);
      if (url && url !== '#') {
        window.location.href = url;
      }
    }
    
    if (onClick) {
      onClick(mention, e);
    }
  };

  // Helper function to get URL from navigation
  const getUrlFromNavigation = (navigation) => {
    switch (navigation.page) {
      case 'player-detail':
        return `/players/${navigation.params.id}`;
      case 'team-detail':
        return `/teams/${navigation.params.id}`;
      case 'user-profile':
        return `/users/${navigation.params.id}`;
      default:
        return '#';
    }
  };

  const navigation = getNavigation();
  const displayText = display_name || name || `Unknown ${type || 'mention'}`;

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