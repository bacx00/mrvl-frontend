import React from 'react';

const MatchStatus = ({ status, scheduledTime, className = '' }) => {
  // Normalize 'scheduled' to 'upcoming' for consistent display
  const normalizedStatus = status === 'scheduled' ? 'upcoming' : status;

  switch (normalizedStatus) {
    case 'live':
      return (
        <div className={`flex items-center space-x-2 ${className}`}>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          <span className="text-red-600 dark:text-red-400 font-medium text-xs">LIVE</span>
        </div>
      );
    
    case 'completed':
      return <span className={`text-gray-500 dark:text-gray-400 text-xs ${className}`}>Final</span>;
    
    case 'cancelled':
      return <span className={`text-gray-500 dark:text-gray-400 text-xs line-through ${className}`}>Cancelled</span>;
    
    case 'postponed':
      return <span className={`text-orange-600 dark:text-orange-400 text-xs ${className}`}>Postponed</span>;
    
    case 'upcoming':
    default:
      return (
        <span className={`text-gray-600 dark:text-gray-300 text-xs ${className}`}>
          {scheduledTime ? new Date(scheduledTime).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }) : 'TBA'}
        </span>
      );
  }
};

export default MatchStatus;