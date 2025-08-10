import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getImageUrl } from '../../utils/imageUtils';

// Enhanced image cache with timestamps and size tracking
const imageCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of images to cache

// Intersection Observer for lazy loading (shared across all instances)
let intersectionObserver = null;
const observedElements = new Set();

// Performance monitoring
const performanceMetrics = {
  cacheHits: 0,
  cacheMisses: 0,
  lazyLoads: 0,
  errors: 0
};

// Initialize Intersection Observer with optimal settings
const initIntersectionObserver = () => {
  if (intersectionObserver) return intersectionObserver;
  
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const loadImage = img.dataset.loadImage;
          if (loadImage && typeof window[loadImage] === 'function') {
            window[loadImage]();
            intersectionObserver.unobserve(img);
            observedElements.delete(img);
          }
        }
      });
    },
    {
      rootMargin: '50px', // Load images 50px before they enter viewport
      threshold: 0.1
    }
  );
  
  return intersectionObserver;
};

// Cache management utilities
const cleanupCache = () => {
  const now = Date.now();
  const entries = Array.from(imageCache.entries());
  
  // Remove expired entries
  for (const [url, data] of entries) {
    if (now - data.timestamp > CACHE_DURATION) {
      if (data.objectUrl) {
        URL.revokeObjectURL(data.objectUrl);
      }
      imageCache.delete(url);
    }
  }
  
  // Remove oldest entries if cache is too large
  if (imageCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = entries
      .filter(([url]) => imageCache.has(url)) // Still exists after cleanup
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = sortedEntries.slice(0, imageCache.size - MAX_CACHE_SIZE);
    for (const [url, data] of toRemove) {
      if (data.objectUrl) {
        URL.revokeObjectURL(data.objectUrl);
      }
      imageCache.delete(url);
    }
  }
};

// Preload image with caching
const preloadImage = async (src) => {
  if (!src) return null;
  
  // Check cache first
  const cached = imageCache.get(src);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    performanceMetrics.cacheHits++;
    return cached.objectUrl || src;
  }
  
  performanceMetrics.cacheMisses++;
  
  try {
    // For data URLs, just cache the URL itself
    if (src.startsWith('data:')) {
      const cacheEntry = {
        objectUrl: src,
        timestamp: Date.now(),
        size: src.length
      };
      imageCache.set(src, cacheEntry);
      return src;
    }
    
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    
    const cacheEntry = {
      objectUrl,
      timestamp: Date.now(),
      size: blob.size
    };
    
    imageCache.set(src, cacheEntry);
    
    // Cleanup cache periodically
    if (imageCache.size % 10 === 0) {
      cleanupCache();
    }
    
    return objectUrl;
  } catch (error) {
    console.warn('Failed to preload image:', src, error);
    performanceMetrics.errors++;
    return src; // Fallback to original URL
  }
};

/**
 * Enhanced LazyImage component with caching, error handling, and performance optimization
 */
const LazyImage = ({
  src,
  alt = '',
  className = '',
  style = {},
  onLoad,
  onError,
  fallbackType = 'general',
  eager = false, // Skip lazy loading
  priority = false, // High priority loading
  placeholder = true,
  ...props
}) => {
  const [loadState, setLoadState] = useState('idle'); // 'idle', 'loading', 'loaded', 'error'
  const [imageSrc, setImageSrc] = useState(null);
  const [displaySrc, setDisplaySrc] = useState(placeholder ? getImageUrl(null, fallbackType) : null);
  
  const imgRef = useRef(null);
  const loadAttempts = useRef(0);
  const maxLoadAttempts = 3;
  
  // Process the source URL
  const processedSrc = getImageUrl(src, fallbackType);
  
  // Load image function
  const loadImage = useCallback(async () => {
    if (!processedSrc || loadState === 'loading' || loadState === 'loaded') {
      return;
    }
    
    setLoadState('loading');
    performanceMetrics.lazyLoads++;
    
    try {
      const cachedSrc = await preloadImage(processedSrc);
      
      // Create new Image object to test loading
      const testImg = new Image();
      
      testImg.onload = () => {
        setImageSrc(cachedSrc);
        setDisplaySrc(cachedSrc);
        setLoadState('loaded');
        
        if (onLoad) {
          onLoad({ target: testImg, cached: cachedSrc !== processedSrc });
        }
      };
      
      testImg.onerror = () => {
        handleImageError();
      };
      
      testImg.src = cachedSrc;
    } catch (error) {
      handleImageError();
    }
  }, [processedSrc, loadState, onLoad]);
  
  // Handle image loading errors with retry logic
  const handleImageError = useCallback(() => {
    loadAttempts.current++;
    
    if (loadAttempts.current < maxLoadAttempts) {
      // Retry after a delay
      setTimeout(() => {
        setLoadState('idle');
        loadImage();
      }, 1000 * loadAttempts.current);
      return;
    }
    
    // Final fallback
    const fallbackSrc = getImageUrl(null, fallbackType);
    setDisplaySrc(fallbackSrc);
    setImageSrc(fallbackSrc);
    setLoadState('error');
    performanceMetrics.errors++;
    
    if (onError) {
      onError({
        target: { src: processedSrc },
        attempts: loadAttempts.current,
        finalFallback: fallbackSrc
      });
    }
  }, [processedSrc, fallbackType, onError, loadImage]);
  
  // Set up lazy loading or immediate loading
  useEffect(() => {
    if (!processedSrc) return;
    
    if (eager || priority) {
      // Load immediately
      loadImage();
    } else {
      // Set up lazy loading
      const observer = initIntersectionObserver();
      const img = imgRef.current;
      
      if (img && observer) {
        // Store the load function globally so the observer can call it
        const loadFunctionName = `loadImage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        window[loadFunctionName] = loadImage;
        img.dataset.loadImage = loadFunctionName;
        
        observer.observe(img);
        observedElements.add(img);
        
        return () => {
          observer.unobserve(img);
          observedElements.delete(img);
          delete window[loadFunctionName];
        };
      }
    }
  }, [processedSrc, eager, priority, loadImage]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);
  
  // Determine what to display
  const shouldShowPlaceholder = loadState === 'idle' || loadState === 'loading';
  const finalSrc = displaySrc || getImageUrl(null, fallbackType);
  const finalClassName = `${className} ${shouldShowPlaceholder && placeholder ? 'opacity-70' : 'opacity-100'} transition-opacity duration-300`;
  
  return (
    <img
      ref={imgRef}
      src={finalSrc}
      alt={alt}
      className={finalClassName}
      style={style}
      loading={eager || priority ? 'eager' : 'lazy'}
      decoding="async"
      {...props}
    />
  );
};

// Performance debugging utility
export const getImagePerformanceMetrics = () => ({
  ...performanceMetrics,
  cacheSize: imageCache.size,
  cacheHitRate: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) || 0,
  observedElements: observedElements.size
});

// Clear cache utility
export const clearImageCache = () => {
  for (const [, data] of imageCache) {
    if (data.objectUrl && data.objectUrl.startsWith('blob:')) {
      URL.revokeObjectURL(data.objectUrl);
    }
  }
  imageCache.clear();
};

// Enhanced image components using LazyImage
export const LazyTeamLogo = ({ team, size = 'w-8 h-8', className = '', eager = false, ...props }) => {
  return (
    <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
      <LazyImage
        src={team?.logo}
        alt={team?.name || 'Team logo'}
        fallbackType="team-logo"
        className="w-full h-full object-cover"
        eager={eager}
        {...props}
      />
    </div>
  );
};

export const LazyPlayerAvatar = ({ player, size = 'w-8 h-8', className = '', eager = false, ...props }) => {
  return (
    <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
      <LazyImage
        src={player?.avatar || player?.avatar_url}
        alt={player?.name || player?.username || 'Player avatar'}
        fallbackType="player-avatar"
        className="w-full h-full object-cover"
        eager={eager}
        {...props}
      />
    </div>
  );
};

export const LazyNewsImage = ({ article, className = '', eager = false, ...props }) => {
  return (
    <LazyImage
      src={article?.featured_image || article?.featured_image_url || article?.image}
      alt={article?.title || 'News article'}
      fallbackType="news-featured"
      className={className}
      eager={eager}
      {...props}
    />
  );
};

export default LazyImage;