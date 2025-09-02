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
          domain: typeof window !== 'undefined' ? window.location.hostname : 'staging.mrvl.net'
        });
        console.log('🎥 VideoEmbed - Generated embed URL from URL:', embedUrl, 'for type:', validation.video.type, 'id:', validation.video.id);
        setEmbedUrl(embedUrl);
        setEmbedError(false); // Clear any previous errors
      } else {
        console.warn('🎥 VideoEmbed - Invalid URL:', url);
        setEmbedError(true);
      }
    } else if (id && type) {
      const embedUrl = generateEmbedUrl(type, id, {
        isMobile,
        isTablet,
        autoplay,
        muted: muted || isMobile,
        startTime,
        domain: typeof window !== 'undefined' ? window.location.hostname : 'staging.mrvl.net'
      });
      console.log('🎥 VideoEmbed - Generated embed URL from ID:', embedUrl, 'for type:', type, 'id:', id);
      setEmbedUrl(embedUrl);
      setEmbedError(false); // Clear any previous errors
    } else {
      console.warn('🎥 VideoEmbed - No valid ID or URL provided');
      setEmbedError(true);
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

  // VLR.gg-style professional error state
  if (embedError) {
    const videoTypeName = getVideoPlatformName(type);
    
    return (
      <div className={`group bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-xl p-8 text-center border border-gray-300 dark:border-gray-600 shadow-lg hover:shadow-xl transition-all duration-300 ${inline ? 'my-6' : 'my-8'} ${className}`} style={{ width, height: height !== 'auto' ? height : undefined }}>
        <div className="text-gray-600 dark:text-gray-300">
          {/* Professional platform icon with status */}
          <div className="relative inline-block mb-4">
            <div className="text-4xl opacity-75 group-hover:opacity-100 transition-opacity">
              {type === 'youtube' ? '🔴' : 
               type.includes('twitch') ? '🟣' : 
               type === 'twitter' || type === 'x' ? '🐦' : '🎮'}
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>
          
          {/* Professional error message */}
          <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">{videoTypeName} Content Unavailable</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 max-w-md mx-auto">
            This {videoTypeName.toLowerCase()} video couldn't be loaded. The content may be private, removed, or temporarily unavailable.
          </p>
          
          {/* Professional action button */}
          {url && (
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>Watch on {videoTypeName}</span>
              <span>→</span>
            </a>
          )}
          
          {/* Professional status indicator */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-500 flex items-center justify-center space-x-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span>Content Error</span>
          </div>
        </div>
      </div>
    );
  }

  // VLR.gg-style professional loading placeholder
  if (!isVisible || !embedUrl) {
    const aspectRatio = getVideoAspectRatio(type, isMobile);
    
    return (
      <div 
        ref={videoRef}
        className={`video-embed ${type}-embed group cursor-pointer hover:scale-[1.02] transition-all duration-300 ${inline ? 'my-6' : 'my-8'} ${isMobile ? 'mobile-video-embed' : ''} ${isTablet ? 'tablet-video-embed' : ''} ${className}`}
        style={{ width, height: height !== 'auto' ? height : undefined }}
        onClick={() => setIsVisible(true)}
      >
        <div className={`relative ${aspectRatio === 'auto' ? 'h-auto min-h-[240px]' : aspectRatio} ${aspectRatio !== 'auto' ? 'h-0' : ''} bg-gradient-to-br from-gray-200 via-gray-100 to-gray-300 dark:from-gray-800 dark:via-gray-900 dark:to-gray-700 rounded-xl overflow-hidden shadow-xl border border-gray-300 dark:border-gray-600 group-hover:border-red-400/30 flex items-center justify-center`}>
          
          {/* Professional loading animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          
          {/* Platform badge */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-lg">
            <span className={`w-2 h-2 rounded-full ${type === 'youtube' ? 'bg-red-500' : type.includes('twitch') ? 'bg-purple-500' : type === 'twitter' || type === 'x' ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`}></span>
            <span>{getVideoPlatformName(type).toUpperCase()}</span>
          </div>

          {/* Professional loading content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600 dark:text-gray-300 group-hover:text-gray-800 dark:group-hover:text-gray-100 transition-colors">
            
            {/* Large platform icon */}
            <div className="relative mb-4">
              <div className="text-5xl opacity-80 group-hover:opacity-100 transition-opacity">
                {type === 'youtube' ? '🔴' : 
                 type.includes('twitch') ? '🟣' : 
                 type === 'twitter' || type === 'x' ? '🐦' : '🎮'}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/20 to-transparent rounded-full blur-lg"></div>
            </div>
            
            {/* Professional loading text */}
            <div className="text-center space-y-2">
              <div className="text-lg font-bold">Loading {getVideoPlatformName(type)} Content</div>
              <div className="text-sm opacity-75 max-w-xs">
                {isMobile ? 'Tap to load video content' : 'Click to load high-quality video'}
              </div>
              
              {/* Loading indicators */}
              <div className="flex items-center justify-center space-x-1 mt-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
            
            {showTitle && (
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <div className="bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium">
                  {getVideoPlatformName(type)} Video Ready to Play
                </div>
              </div>
            )}
          </div>
          
          {/* VLR.gg-style corner accent */}
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-red-600/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity"></div>
        </div>
      </div>
    );
  }

  // Video iframe embed with VLR.gg-style professional styling
  const aspectRatio = getVideoAspectRatio(type, isMobile);
  
  return (
    <div 
      ref={videoRef}
      className={`video-embed ${type}-embed group transition-all duration-300 ${inline ? 'my-6' : 'my-8'} ${isMobile ? 'mobile-video-embed' : ''} ${isTablet ? 'tablet-video-embed' : ''} ${className}`}
      style={{ width, height: height !== 'auto' ? height : undefined }}
    >
      {showTitle && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3 font-semibold flex items-center group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
          <span className="mr-2 text-base">
            {type === 'youtube' ? '🔴' : 
             type.includes('twitch') ? '🟣' : 
             type === 'twitter' || type === 'x' ? '🐦' : '🎮'}
          </span>
          {getVideoPlatformName(type)} Video
          <div className="ml-auto text-xs opacity-70 group-hover:opacity-100 transition-opacity">
            {type === 'youtube' ? 'HD Quality' : 
             type.includes('twitch') ? 'Live Stream' : 
             type === 'twitter' || type === 'x' ? 'Social Media' : 'Gaming'}
          </div>
        </div>
      )}
      
      {/* VLR.gg-style video container with professional borders and shadows */}
      <div className={`relative ${aspectRatio === 'auto' ? 'h-auto' : aspectRatio} ${aspectRatio !== 'auto' ? 'h-0' : ''} bg-gradient-to-br from-gray-900 via-black to-gray-800 rounded-xl overflow-hidden shadow-2xl border border-gray-300 dark:border-gray-600 group-hover:shadow-red-500/20 group-hover:border-red-400/30 transition-all duration-300 transform group-hover:scale-[1.02]`}>
        
        {/* Professional platform badge */}
        <div className="absolute top-3 left-3 z-20 bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-lg">
          <span className={`w-2 h-2 rounded-full ${type === 'youtube' ? 'bg-red-500' : type.includes('twitch') ? 'bg-purple-500' : type === 'twitter' || type === 'x' ? 'bg-blue-500' : 'bg-green-500'} animate-pulse`}></span>
          <span>{getVideoPlatformName(type).toUpperCase()}</span>
        </div>

        {/* Mobile optimization badge */}
        {isMobile && mobileOptimized && (
          <div className="absolute top-3 right-3 z-20 bg-green-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-lg">
            📱 Mobile
          </div>
        )}

        {/* Professional loading overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10"></div>
        
        <iframe
          src={embedUrl}
          title={`${getVideoPlatformName(type)} video player`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className={`${aspectRatio === 'auto' ? 'w-full h-full' : 'absolute top-0 left-0 w-full h-full'} rounded-xl transition-transform duration-300`}
          onError={handleIframeError}
          loading="lazy"
          style={{
            maxWidth: '100%',
            height: aspectRatio === 'auto' ? (isMobile ? '280px' : '450px') : (isMobile ? 'auto' : '100%'),
            minHeight: aspectRatio === 'auto' ? '240px' : undefined
          }}
        />

        {/* VLR.gg-style corner accent */}
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-red-600/30 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
      </div>
      
      {/* Professional controls hint with VLR.gg styling */}
      {(isMobile || isTablet) && !inline && (
        <div className="mt-3 text-center">
          <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-full text-xs text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 group-hover:border-red-400/30 transition-colors">
            <span>🎮</span>
            <span className="font-medium">
              {isMobile ? 'Tap to play • Pinch to zoom • Fullscreen available' : 'Click to play • Enhanced controls'}
            </span>
          </div>
        </div>
      )}
      
      {/* Inline mode professional feedback */}
      {inline && (isMobile || isTablet) && (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400 opacity-75 group-hover:opacity-100 transition-opacity">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            <span className="font-medium">Tap to play</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default VideoEmbed;