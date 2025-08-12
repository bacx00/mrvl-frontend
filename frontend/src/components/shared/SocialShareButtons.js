import React, { useState } from 'react';
import { generateSocialSharingUrls, trackSocialShare } from '../../utils/seoUtils';

/**
 * Social Share Buttons Component for News Articles
 * Production-ready social sharing with analytics tracking
 */
function SocialShareButtons({ article, className = '', size = 'md' }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  if (!article) return null;

  const shareUrls = generateSocialSharingUrls(article);
  
  // Size classes
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg'
  };

  const iconSize = sizeClasses[size] || sizeClasses.md;

  const handleShare = (platform, url) => {
    // Track the share event
    trackSocialShare(platform, article);

    // Open share window for most platforms
    if (platform !== 'email' && platform !== 'discord' && platform !== 'whatsapp') {
      window.open(
        url,
        'share',
        'width=600,height=400,scrollbars=no,resizable=no'
      );
    } else {
      // Direct navigation for email, WhatsApp, etc.
      window.location.href = url;
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/news/${article.id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToClipboard(true);
      trackSocialShare('copy_link', article);
      
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback: create temporary input element
      const tempInput = document.createElement('input');
      tempInput.value = url;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand('copy');
      document.body.removeChild(tempInput);
      
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const primaryPlatforms = [
    {
      name: 'Twitter',
      icon: '🐦',
      url: shareUrls.twitter,
      color: 'hover:bg-blue-500 hover:text-white'
    },
    {
      name: 'Facebook',
      icon: '📘',
      url: shareUrls.facebook,
      color: 'hover:bg-blue-600 hover:text-white'
    },
    {
      name: 'Reddit',
      icon: '🔴',
      url: shareUrls.reddit,
      color: 'hover:bg-orange-500 hover:text-white'
    }
  ];

  const secondaryPlatforms = [
    {
      name: 'LinkedIn',
      icon: '💼',
      url: shareUrls.linkedin,
      color: 'hover:bg-blue-700 hover:text-white'
    },
    {
      name: 'WhatsApp',
      icon: '💚',
      url: shareUrls.whatsapp,
      color: 'hover:bg-green-500 hover:text-white'
    },
    {
      name: 'Telegram',
      icon: '✈️',
      url: shareUrls.telegram,
      color: 'hover:bg-blue-400 hover:text-white'
    },
    {
      name: 'Email',
      icon: '📧',
      url: shareUrls.email,
      color: 'hover:bg-gray-500 hover:text-white'
    }
  ];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">Share:</span>
      
      {/* Primary platforms - always visible */}
      {primaryPlatforms.map(platform => (
        <button
          key={platform.name}
          onClick={() => handleShare(platform.name.toLowerCase(), platform.url)}
          className={`${iconSize} rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200 ${platform.color} hover:border-transparent flex items-center justify-center`}
          title={`Share on ${platform.name}`}
          aria-label={`Share on ${platform.name}`}
        >
          <span className="text-sm">{platform.icon}</span>
        </button>
      ))}

      {/* Copy link button */}
      <button
        onClick={handleCopyLink}
        className={`${iconSize} rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 flex items-center justify-center ${copiedToClipboard ? 'bg-green-100 border-green-400 text-green-600' : ''}`}
        title={copiedToClipboard ? 'Link copied!' : 'Copy link'}
        aria-label="Copy article link"
      >
        <span className="text-sm">{copiedToClipboard ? '✅' : '🔗'}</span>
      </button>

      {/* More options button */}
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`${iconSize} rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 flex items-center justify-center`}
          title="More sharing options"
          aria-label="More sharing options"
        >
          <span className="text-sm">⋯</span>
        </button>

        {/* Expanded options dropdown */}
        {isExpanded && (
          <div className="absolute top-full right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50 min-w-48">
            {secondaryPlatforms.map(platform => (
              <button
                key={platform.name}
                onClick={() => {
                  handleShare(platform.name.toLowerCase(), platform.url);
                  setIsExpanded(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
              >
                <span>{platform.icon}</span>
                <span>Share on {platform.name}</span>
              </button>
            ))}
            
            {/* Discord special handling */}
            <button
              onClick={() => {
                handleCopyLink();
                setIsExpanded(false);
                // Show tooltip about pasting in Discord
                setTimeout(() => {
                  alert('Link copied! You can paste it in Discord to share.');
                }, 100);
              }}
              className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3"
            >
              <span>🎮</span>
              <span>Share on Discord</span>
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isExpanded && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
}

export default SocialShareButtons;