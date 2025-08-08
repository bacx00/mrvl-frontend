import React, { useState, useEffect, useRef } from 'react';
import { generateEmbedUrl, getVideoPlatformName, getVideoAspectRatio, validateVideoUrl } from '../../utils/videoUtils';

function VideoEmbed({ 
  type, 
  id, 
  url, 
  mobileOptimized = true, 
  lazyLoad = true, 
  className = '',
  inline = true,
  showTitle = false,
  autoplay = false,
  muted = false,
  startTime = null,
  width = '100%',
  height = 'auto'
}) {
  const [embedError, setEmbedError] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [isVisible, setIsVisible] = useState(!lazyLoad);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth <= 1024) : false);
  const videoRef = useRef(null);

  // Mobile/tablet/desktop detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth <= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazyLoad || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => observer.disconnect();
  }, [lazyLoad, isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    
    // Use the new video utilities for better URL handling
    if (url && !id) {
      const validation = validateVideoUrl(url);
      if (validation.isValid) {
        const embedUrl = generateEmbedUrl(validation.video.type, validation.video.id, {
          isMobile,
          isTablet,
          autoplay,
          muted: muted || isMobile,
          startTime,
          domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost'
        });
        setEmbedUrl(embedUrl);
      } else {
        setEmbedError(true);
      }
    } else if (id) {
      const embedUrl = generateEmbedUrl(type, id, {
        isMobile,
        isTablet,
        autoplay,
        muted: muted || isMobile,
        startTime,
        domain: typeof window !== 'undefined' ? window.location.hostname : 'localhost'
      });
      setEmbedUrl(embedUrl);
    }
  }, [type, id, url, isVisible, isMobile, isTablet, autoplay, muted, startTime]);

  // Legacy function kept for backward compatibility but now uses utilities
  const parseVideoUrl = (videoUrl, videoType) => {
    const validation = validateVideoUrl(videoUrl);
    return validation.isValid ? validation.video.id : null;
  };

  const handleIframeError = () => {
    setEmbedError(true);
  };

  // Load Twitter widgets for tweet embeds
  useEffect(() => {
    if ((type === 'twitter' || type === 'tweet') && (id || url) && typeof window !== 'undefined' && window.twttr) {
      window.twttr.widgets.load();
    }
  }, [type, id, url]);

  // Twitter/X embed component (supports both tweets and video content)
  if (type === 'twitter' || type === 'tweet' || type === 'x') {
    const tweetId = id || parseVideoUrl(url, type);

    if (!tweetId || embedError) {
      return (
        <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center ${inline ? 'my-4' : 'my-6'} ${className}`}>
          <div className="text-gray-500 dark:text-gray-400">
            <div className="text-3xl mb-3">🐦</div>
            <p className="mb-2">Content unavailable</p>
            {url && (
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
              >
                View on X (Twitter) →
              </a>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className={`tweet-embed ${inline ? 'my-4' : 'my-6'} ${isMobile ? 'px-2' : 'px-4'} ${className}`}>
        <div className={`${inline ? '' : 'flex justify-center'} ${isMobile ? 'max-w-full' : 'max-w-2xl mx-auto'}`}>
          {showTitle && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
              Post from X (Twitter)
            </div>
          )}
          <blockquote 
            className="twitter-tweet" 
            data-theme={typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light'}
            data-dnt="true"
            data-width={isMobile ? "100%" : undefined}
          >
            <a href={`https://twitter.com/x/status/${tweetId}`}>Loading content from X...</a>
          </blockquote>
        </div>
      </div>
    );
  }

  // Video embed error state
  if (embedError || !embedUrl) {
    const videoTypeName = getVideoPlatformName(type);
    
    return (
      <div className={`bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center ${inline ? 'my-4' : 'my-6'} ${className}`} style={{ width, height: height !== 'auto' ? height : undefined }}>
        <div className="text-gray-500 dark:text-gray-400">
          <div className="text-3xl mb-3">
            {type === 'youtube' ? '▶️' : 
             type.includes('twitch') ? '🟣' : 
             type === 'twitter' || type === 'x' ? '🐦' : '🎮'}
          </div>
          <p className="mb-2 text-sm font-medium">{videoTypeName} content unavailable</p>
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600 text-sm transition-colors"
            >
              Watch on {videoTypeName} →
            </a>
          )}
        </div>
      </div>
    );
  }

  // Lazy loading placeholder
  if (!isVisible) {
    const aspectRatio = getVideoAspectRatio(type, isMobile);
    
    return (
      <div 
        ref={videoRef}
        className={`video-embed ${type}-embed ${inline ? 'my-4' : 'my-6'} ${isMobile ? 'mobile-video-embed' : ''} ${isTablet ? 'tablet-video-embed' : ''} ${className}`}
        style={{ width, height: height !== 'auto' ? height : undefined }}
      >
        <div className={`relative ${aspectRatio === 'auto' ? 'h-auto min-h-[200px]' : aspectRatio} ${aspectRatio !== 'auto' ? 'h-0' : ''} bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg flex items-center justify-center`}>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-3xl mb-3">
              {type === 'youtube' ? '▶️' : 
               type.includes('twitch') ? '🟣' : 
               type === 'twitter' || type === 'x' ? '🐦' : '🎮'}
            </div>
            <div className="text-sm font-medium">Loading {getVideoPlatformName(type)} content...</div>
            {isMobile && (
              <div className="text-xs mt-2 opacity-75">Tap to load</div>
            )}
            {showTitle && (
              <div className="text-xs mt-2 text-center px-4">{getVideoPlatformName(type)} Video</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Video iframe embed
  const aspectRatio = getVideoAspectRatio(type, isMobile);
  
  return (
    <div 
      ref={videoRef}
      className={`video-embed ${type}-embed ${inline ? 'my-4' : 'my-6'} ${isMobile ? 'mobile-video-embed' : ''} ${isTablet ? 'tablet-video-embed' : ''} ${className}`}
      style={{ width, height: height !== 'auto' ? height : undefined }}
    >
      {showTitle && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium flex items-center">
          <span className="mr-2">
            {type === 'youtube' ? '▶️' : 
             type.includes('twitch') ? '🟣' : 
             type === 'twitter' || type === 'x' ? '🐦' : '🎮'}
          </span>
          {getVideoPlatformName(type)} Video
        </div>
      )}
      
      <div className={`relative ${aspectRatio === 'auto' ? 'h-auto' : aspectRatio} ${aspectRatio !== 'auto' ? 'h-0' : ''} bg-black rounded-lg overflow-hidden ${inline ? 'shadow-lg' : 'shadow-xl'} ${inline && isMobile ? 'rounded-md' : ''}`}>
        {isMobile && mobileOptimized && !inline && (
          <div className="absolute top-2 right-2 z-10 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            📱 Mobile Optimized
          </div>
        )}
        <iframe
          src={embedUrl}
          title={`${getVideoPlatformName(type)} video player`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={`${aspectRatio === 'auto' ? 'w-full h-full' : 'absolute top-0 left-0 w-full h-full'} ${inline ? 'rounded-lg' : ''}`}
          onError={handleIframeError}
          loading="lazy"
          style={{
            maxWidth: '100%',
            height: aspectRatio === 'auto' ? (isMobile ? '250px' : '400px') : (isMobile ? 'auto' : '100%'),
            minHeight: aspectRatio === 'auto' ? '200px' : undefined
          }}
        />
      </div>
      
      {/* Mobile/tablet controls hint */}
      {(isMobile || isTablet) && !inline && (
        <div className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
          {isMobile ? 'Tap to play • Pinch to zoom • Double tap for fullscreen' : 'Click to play • Scroll to zoom'}
        </div>
      )}
      
      {/* Inline mode minimal feedback */}
      {inline && (isMobile || isTablet) && (
        <div className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500 opacity-75">
          Tap to play
        </div>
      )}
    </div>
  );
}

export default VideoEmbed;