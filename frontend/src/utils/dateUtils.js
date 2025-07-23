/**
 * Date formatting utilities for consistent time display across the application
 */

/**
 * Formats a date string into a relative time format (e.g., "2h ago", "3 days ago")
 * Falls back to readable date format for very old items
 * @param {string} dateString - ISO date string
 * @param {boolean} showFullDateForOld - Whether to show full date for old items (default: true)
 * @returns {string} Formatted time string
 */
export const formatTimeAgo = (dateString, showFullDateForOld = true) => {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  
  // Handle invalid dates
  if (isNaN(date.getTime())) return 'Invalid date';
  
  // Handle future dates
  if (diffMs < 0) return 'Just now';
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffSeconds < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older items, either show weeks/months or full date
  if (showFullDateForOld && diffDays > 30) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
};

/**
 * Formats a date for display in article headers and detailed views
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid date';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formats time for match schedules
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time string
 */
export const formatMatchTime = (dateString) => {
  if (!dateString) return 'TBD';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'TBD';
  
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

/**
 * Checks if a date is today
 * @param {string} dateString - ISO date string
 * @returns {boolean}
 */
export const isToday = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  
  return date.toDateString() === today.toDateString();
};

/**
 * Checks if a date is within the last week
 * @param {string} dateString - ISO date string
 * @returns {boolean}
 */
export const isWithinLastWeek = (dateString) => {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now - date) / 86400000);
  
  return diffDays <= 7;
};