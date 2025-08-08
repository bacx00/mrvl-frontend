import React from 'react';

// Inline loading spinner for buttons
export const InlineSpinner = ({ size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <div className={`inline-block ${sizeClasses[size]} ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-current border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
};

// Page-level loading component
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <div className="text-gray-600 dark:text-gray-400">{message}</div>
    </div>
  </div>
);

// Card-level loading skeleton
export const CardSkeleton = () => (
  <div className="card p-6 animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    </div>
  </div>
);

// News article loading skeleton
export const NewsCardSkeleton = () => (
  <div className="card p-4 animate-pulse">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-2"></div>
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
      <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded ml-4"></div>
    </div>
  </div>
);

// Thread list loading skeleton
export const ThreadCardSkeleton = () => (
  <div className="card p-4 animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
          <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="flex items-center space-x-4">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  </div>
);

// Button loading state
export const LoadingButton = ({ 
  children, 
  loading = false, 
  disabled = false, 
  className = '', 
  ...props 
}) => (
  <button
    disabled={loading || disabled}
    className={`relative ${className} ${loading || disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    {...props}
  >
    {loading && (
      <span className="absolute inset-0 flex items-center justify-center">
        <InlineSpinner size="sm" className="text-current" />
      </span>
    )}
    <span className={loading ? 'opacity-0' : ''}>{children}</span>
  </button>
);

// Empty state component
export const EmptyState = ({ 
  icon = '📝', 
  title = 'Nothing here yet', 
  description = 'No items to display at the moment.',
  action = null 
}) => (
  <div className="text-center py-12">
    <div className="text-6xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
    {action}
  </div>
);

// Toast notification (you could expand this with a toast context)
export const Toast = ({ 
  type = 'info', 
  message, 
  onClose, 
  autoClose = true, 
  duration = 3000 
}) => {
  // Immediately call onClose to dismiss without showing any toast
  React.useEffect(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Don't render any toast notifications to prevent error banners
  return null;
};

export default {
  InlineSpinner,
  PageLoader,
  CardSkeleton,
  NewsCardSkeleton,
  ThreadCardSkeleton,
  LoadingButton,
  EmptyState,
  Toast
};