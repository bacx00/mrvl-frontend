// src/lib/utils.ts
// Utility functions used across the MRVL application

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ═══════════════════════════════════════════════════════════════
//                        CSS UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ═══════════════════════════════════════════════════════════════
//                        DATE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Validate if a date string/object is valid
 */
export const isValidDate = (date: any): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

/**
 * Safe date parsing with fallback
 */
export const safeParseDate = (date: any, fallback: string = 'Unknown'): Date | string => {
  if (!isValidDate(date)) return fallback;
  return new Date(date);
};

/**
 * Format time ago with proper validation and enhanced precision
 */
export const formatTimeAgo = (dateString: any): string => {
  if (!dateString || !isValidDate(dateString)) {
    return 'Unknown';
  }
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  // Handle future dates
  if (diffMs < 0) {
    const futureSecs = Math.abs(Math.floor(diffMs / 1000));
    const futureMins = Math.abs(diffMins);
    const futureHours = Math.abs(diffHours);
    const futureDays = Math.abs(diffDays);
    
    if (futureSecs < 60) return 'in a moment';
    if (futureMins < 60) return `in ${futureMins}m`;
    if (futureHours < 24) return `in ${futureHours}h`;
    if (futureDays < 7) return `in ${futureDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Enhanced relative time for past dates
  if (diffMs < 30000) return 'just now'; // Less than 30 seconds
  if (diffMins < 1) return 'moments ago';
  if (diffMins === 1) return '1 minute ago';
  if (diffMins < 60) return `${diffMins} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  if (diffMonths < 12) return `${diffMonths} months ago`;

  // Format for older dates
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

/**
 * Safe date formatting for display
 */
export const formatDateSafe = (date: any, options?: Intl.DateTimeFormatOptions, fallback: string = 'Unknown'): string => {
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
export const formatDate = (date: string | Date, locale: string = 'en'): string => {
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
 * Format date for mobile devices (more compact)
 */
export const formatDateMobile = (date: string | Date): string => {
  if (!isValidDate(date)) return 'Unknown';
  
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Ultra-compact relative time for mobile
  if (diffMins < 1) return 'now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffDays < 30) return `${Math.floor(diffDays/7)}w`;

  // Very compact format for older dates
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format time for match schedules
 */
export const formatMatchTime = (date: string | Date): string => {
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
export const formatDuration = (startTime: string | Date, endTime: string | Date): string => {
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
export const getCountdown = (targetDate: string | Date): string => {
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
export const formatNumber = (num: number): string => {
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
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
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
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// ═══════════════════════════════════════════════════════════════
//                        STRING UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate URL-friendly slugs
 */
export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/[\s_-]+/g, '-') // Replace spaces/underscores with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length).replace(/\s+\S*$/, '') + '...';
};

/**
 * Capitalize first letter of each word
 */
export const titleCase = (text: string): string => {
  return text.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};

/**
 * Extract initials from name
 */
export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ═══════════════════════════════════════════════════════════════
//                        DEVICE DETECTION
// ═══════════════════════════════════════════════════════════════

/**
 * Detect mobile devices
 */
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Detect iOS devices
 */
export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Detect Android devices
 */
export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
};

/**
 * Get device type
 */
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// ═══════════════════════════════════════════════════════════════
//                        TOUCH UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Handle touch events with proper preventDefault
 */
export const handleTouchEvent = (
  callback: (event: TouchEvent) => void,
  preventDefault: boolean = true
) => {
  return (event: TouchEvent) => {
    if (preventDefault) {
      event.preventDefault();
    }
    callback(event);
  };
};

/**
 * Detect swipe direction
 */
export const getSwipeDirection = (
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold: number = 50
): 'left' | 'right' | 'up' | 'down' | null => {
  const deltaX = endX - startX;
  const deltaY = endY - startY;
  
  if (Math.abs(deltaX) < threshold && Math.abs(deltaY) < threshold) {
    return null; // Not enough movement
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX > 0 ? 'right' : 'left';
  } else {
    return deltaY > 0 ? 'down' : 'up';
  }
};

// ═══════════════════════════════════════════════════════════════
//                        IMAGE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Get optimized image URL with Next.js Image component parameters
 */
export const getOptimizedImageUrl = (
  src: string,
  width: number,
  quality: number = 75
): string => {
  if (!src) return '';
  
  // If it's already an optimized URL, return as is
  if (src.includes('/_next/image')) return src;
  
  // For external URLs, use Next.js image optimization
  const params = new URLSearchParams({
    url: src,
    w: width.toString(),
    q: quality.toString(),
  });
  
  return `/_next/image?${params.toString()}`;
};

/**
 * Generate placeholder image URL
 */
export const getPlaceholderImage = (width: number, height: number, text?: string): string => {
  const baseUrl = 'https://via.placeholder.com';
  const size = `${width}x${height}`;
  const bg = '1a2332'; // Card background color
  const color = '768894'; // Text secondary color
  
  let url = `${baseUrl}/${size}/${bg}/${color}`;
  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }
  
  return url;
};

// ═══════════════════════════════════════════════════════════════
//                        PERFORMANCE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Debounce function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Performance timer utility
 */
export const perfTimer = (label: string) => {
  const start = performance.now();
  
  return {
    end: () => {
      const end = performance.now();
      console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    }
  };
};

// ═══════════════════════════════════════════════════════════════
//                        ACCESSIBILITY UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate accessible IDs
 */
export const generateId = (prefix: string = 'id'): string => {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message: string): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.setAttribute('class', 'sr-only');
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Focus management for modal/dialog
 */
export const trapFocus = (element: HTMLElement): (() => void) => {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstFocusableElement = focusableElements[0] as HTMLElement;
  const lastFocusableElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElement) {
          lastFocusableElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastFocusableElement) {
          firstFocusableElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);
  firstFocusableElement?.focus();

  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
};

// ═══════════════════════════════════════════════════════════════
//                        LOCAL STORAGE UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Safe localStorage operations
 */
export const storage = {
  get: <T>(key: string, defaultValue?: T): T | null => {
    if (typeof window === 'undefined') return defaultValue || null;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch {
      return defaultValue || null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.clear();
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  },
};

// ═══════════════════════════════════════════════════════════════
//                        VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Email validation
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * URL validation
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Strong password validation
 */
export const isStrongPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return strongRegex.test(password);
};

// ═══════════════════════════════════════════════════════════════
//                        COLOR UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Convert hex to RGB
 */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

/**
 * Get contrasting text color
 */
export const getContrastColor = (hexColor: string): 'black' | 'white' => {
  const rgb = hexToRgb(hexColor);
  if (!rgb) return 'white';
  
  // Calculate relative luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.5 ? 'black' : 'white';
};
