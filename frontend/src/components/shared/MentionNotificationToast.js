import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../../utils/imageUtils';

const MentionNotificationToast = ({ notification, onDismiss, position = 'top-right' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      setIsExiting(false);
    }
  }, [notification]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300);
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (!notification || !isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  return (
    <div 
      className={`fixed z-50 ${positionClasses[position]} transition-all duration-300 ${
        isExiting ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
      }`}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm w-full">
        <div className="flex items-start space-x-3">
          {/* Notification Icon */}
          <div className="flex-shrink-0">
            {notification.type === 'mention_created' ? (
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Notification Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* User Avatar and Name */}
                {notification.data?.mentioned_by && (
                  <div className="flex items-center space-x-2 mb-1">
                    {notification.data.mentioned_by.avatar && (
                      <img 
                        src={getImageUrl(notification.data.mentioned_by.avatar)}
                        alt={notification.data.mentioned_by.name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    )}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.data.mentioned_by.name}
                    </span>
                  </div>
                )}

                {/* Notification Message */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {notification.message}
                </p>

                {/* Context Preview */}
                {notification.data?.mention?.context && (
                  <div className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border-l-2 border-orange-500 mb-2">
                    "{notification.data.mention.context}"
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {notification.data?.content?.url && (
                    <a 
                      href={notification.data.content.url}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      onClick={handleDismiss}
                    >
                      View
                    </a>
                  )}
                  <button 
                    onClick={handleDismiss}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={handleDismiss}
                className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
          <div 
            className="bg-orange-500 h-1 rounded-full transition-all duration-100 ease-linear"
            style={{
              animation: `shrink ${notification.duration || 5000}ms linear forwards`
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default MentionNotificationToast;