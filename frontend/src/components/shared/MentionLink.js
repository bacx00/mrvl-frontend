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

  // Determine the page navigation based on mention type (no user mentions)
  const getNavigation = () => {
    switch (type) {
      case 'player':
        return { page: 'player-detail', params: { id } };
      case 'team':
        return { page: 'team-detail', params: { id } };
      // Removed user case - no user mentions allowed
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

  // Get colors based on mention type with enhanced highlighting - styled as boxes
  const getColors = () => {
    switch (type) {
      case 'player':
        return 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800';
      case 'team':
        return 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800';
      case 'user':
        return 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800/30 dark:text-gray-400 dark:hover:bg-gray-800/50 border border-gray-200 dark:border-gray-700';
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    const navigation = getNavigation();
    
    // Add visual feedback for the click
    const element = e.currentTarget;
    element.classList.add('transform', 'scale-95');
    setTimeout(() => {
      element.classList.remove('transform', 'scale-95');
    }, 150);
    
    if (navigation && navigateTo) {
      // Use the navigateTo function provided by the parent component
      navigateTo(navigation.page, navigation.params);
    } else if (navigation) {
      // Fallback to hash-based navigation if navigateTo not provided
      const hashUrl = getHashUrl(navigation);
      if (hashUrl && typeof window !== 'undefined') {
        window.location.hash = hashUrl;
      }
    }
    
    if (onClick) {
      onClick(mention, e);
    }
  };

  // Helper function to get hash URL from navigation
  const getHashUrl = (navigation) => {
    switch (navigation.page) {
      case 'player-detail':
        return `player-detail/${navigation.params.id}`;
      case 'team-detail':
        return `team-detail/${navigation.params.id}`;
      case 'user-profile':
        return `user-profile/${navigation.params.id}`;
      default:
        return '';
    }
  };

  const navigation = getNavigation();
  // Show clean display name without any @ symbols or prefixes
  const displayText = display_name || name || `Unknown ${type || 'mention'}`;

  if (!navigation) {
    return (
      <span 
        className={`inline-flex items-center font-medium px-2 py-0.5 rounded transition-all duration-200 ${getColors()} ${className}`}
        onClick={handleClick}
      >
        {displayText}
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center font-medium px-2 py-0.5 rounded transition-all duration-200 cursor-pointer transform hover:scale-105 active:scale-95 ${getColors()} ${className}`}
      title={`View ${type}: ${displayText}`}
    >
      {displayText}
    </button>
  );
};

export default MentionLink;