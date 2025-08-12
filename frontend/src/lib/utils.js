// src/lib/utils.js
// JavaScript version of utility functions for compatibility with JS components

// ═══════════════════════════════════════════════════════════════
//                        DATE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Validate if a date string/object is valid
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Safe date parsing with fallback
 */
export const safeParseDate = (date, fallback = 'Unknown') => {
  if (!isValidDate(date)) return fallback;
  return new Date(date);
};

/**
 * Format time ago with proper validation (VLR.gg style)
 */
export const formatTimeAgo = (dateString) => {
  // Handle various edge cases and invalid data
  if (!dateString || 
      dateString === 'unknown' || 
      dateString === 'null' || 
      dateString === null || 
      dateString === undefined) {
    return 'Recently';
  }
  
  // Additional validation for common API response formats
  if (typeof dateString === 'string' && dateString.trim() === '') {
    return 'Recently';
  }
  
  if (!isValidDate(dateString)) {
    console.warn('formatTimeAgo: Invalid date format:', dateString);
    return 'Recently';
  }
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Handle future dates
    if (diffMs < 0) {
      const futureMins = Math.abs(diffMins);
      const futureHours = Math.abs(diffHours);
      const futureDays = Math.abs(diffDays);
      
      if (futureMins < 60) return `in ${futureMins}m`;
      if (futureHours < 24) return `in ${futureHours}h`;
      if (futureDays < 7) return `in ${futureDays}d`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    // VLR.gg style relative time for past dates
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    // Format for older dates
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  } catch (error) {
    console.warn('formatTimeAgo: Date parsing error:', error, 'for date:', dateString);
    return 'Recently';
  }
};

/**
 * Safe date formatting for display
 */
export const formatDateSafe = (date, options, fallback = 'Unknown') => {
  if (!isValidDate(date)) return fallback;
  
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', options || {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Date formatting error:', error);
    return fallback;
  }
};

/**
 * Format date for different locales with VLR.gg style
 */
export const formatDate = (date, locale = 'en') => {
  if (!isValidDate(date)) return 'Unknown';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // VLR.gg style relative time
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  // Format for older dates
  return d.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Format time for match schedules
 */
export const formatMatchTime = (date) => {
  if (!isValidDate(date)) return 'TBD';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Future times
  if (diffMins > 0) {
    if (diffMins < 60) return `in ${diffMins}m`;
    if (diffHours < 24) return `in ${diffHours}h`;
    if (diffDays < 7) return `in ${diffDays}d`;
  }

  // Past times
  return formatDate(date);
};

/**
 * Format duration (e.g., match length)
 */
export const formatDuration = (startTime, endTime) => {
  if (!isValidDate(startTime) || !isValidDate(endTime)) return 'Unknown';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end.getTime() - start.getTime();
  
  if (diffMs < 0) return 'Invalid';
  
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

/**
 * Get countdown timer string
 */
export const getCountdown = (targetDate) => {
  if (!isValidDate(targetDate)) return 'TBD';
  
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) return 'Started';

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

// ═══════════════════════════════════════════════════════════════
//                        NUMBER UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Format numbers with K/M suffixes (VLR.gg style)
 */
export const formatNumber = (num) => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

/**
 * Format currency with proper symbols
 */
export const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format percentage with proper decimals
 */
export const formatPercentage = (value, decimals = 1) => {
  return `${value.toFixed(decimals)}%`;
};

// ═══════════════════════════════════════════════════════════════
//                        STRING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate URL-friendly slugs
 */
export const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, length) => {
  if (text.length <= length) return text;
  return text.substring(0, length).replace(/\s+\S*$/, '') + '...';
};

/**
 * Capitalize first letter of each word
 */
export const titleCase = (text) => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Extract initials from name
 */
export const getInitials = (name) => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};