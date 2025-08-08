import React, { useState, useRef, useEffect } from 'react';
import { useDeviceType } from '../../hooks/useDeviceType';

// Mobile-optimized image component with lazy loading, responsive sizing, and performance optimizations
const MobileOptimizedImage = ({
  src,
  alt,
  className = '',
  placeholder = '/images/default-placeholder.svg',
  sizes = '100vw',
  priority = false,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const imgRef = useRef(null);
  const { isMobile, isSmallMobile, width } = useDeviceType();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  // Generate responsive image URLs based on device type
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return placeholder;
    
    // For mobile devices, prefer smaller images
    const targetWidth = isSmallMobile ? 320 : isMobile ? 640 : 1024;
    
    // If the image already has query parameters, append width
    const separator = originalSrc.includes('?') ? '&' : '?';
    
    // Add responsive sizing for better mobile performance
    return `${originalSrc}${separator}w=${targetWidth}&q=80&f=webp`;
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Generate srcSet for different device pixel ratios
  const generateSrcSet = (originalSrc) => {
    if (!originalSrc || hasError) return '';
    
    const baseUrl = originalSrc.split('?')[0];
    const params = new URLSearchParams(originalSrc.split('?')[1] || '');
    
    const sizes = [
      { w: isSmallMobile ? 320 : isMobile ? 640 : 1024, dpr: 1 },
      { w: isSmallMobile ? 480 : isMobile ? 960 : 1536, dpr: 1.5 },
      { w: isSmallMobile ? 640 : isMobile ? 1280 : 2048, dpr: 2 },
    ];

    return sizes
      .map(({ w, dpr }) => {
        params.set('w', w);
        params.set('q', '80');
        params.set('f', 'webp');
        return `${baseUrl}?${params.toString()} ${dpr}x`;
      })
      .join(', ');
  };

  return (
    <div 
      ref={imgRef}
      className={`mobile-optimized-image-container relative overflow-hidden ${className}`}
      {...props}
    >
      {/* Loading/Error State */}
      {(!isLoaded || hasError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
          {hasError ? (
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Failed to load</span>
            </div>
          ) : (
            <div className="mobile-loading-shimmer w-full h-full" />
          )}
        </div>
      )}

      {/* Actual Image */}
      {(isInView || priority) && (
        <img
          src={hasError ? placeholder : getOptimizedSrc(src)}
          srcSet={hasError ? '' : generateSrcSet(src)}
          sizes={sizes}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } high-dpi-mobile`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
    </div>
  );
};

// Specific optimized components for different use cases
export const MobileTeamLogo = ({ team, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <MobileOptimizedImage
      src={team?.logo}
      alt={`${team?.name || 'Team'} logo`}
      className={`${sizeClasses[size]} rounded-lg ${className}`}
      placeholder="/images/team-placeholder.svg"
      sizes="(max-width: 480px) 64px, (max-width: 768px) 96px, 128px"
    />
  );
};

export const MobilePlayerAvatar = ({ player, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <MobileOptimizedImage
      src={player?.avatar || player?.profile_picture}
      alt={`${player?.name || player?.username || 'Player'} avatar`}
      className={`${sizeClasses[size]} rounded-full ${className}`}
      placeholder="/images/player-placeholder.svg"
      sizes="(max-width: 480px) 64px, (max-width: 768px) 96px, 128px"
    />
  );
};

export const MobileNewsImage = ({ article, className = '' }) => {
  return (
    <MobileOptimizedImage
      src={article?.featured_image}
      alt={article?.title || 'News article'}
      className={`aspect-video rounded-lg ${className}`}
      placeholder="/images/news-placeholder.svg"
      sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, 1024px"
    />
  );
};

export const MobileEventBanner = ({ event, className = '' }) => {
  return (
    <MobileOptimizedImage
      src={event?.banner_image || event?.featured_image}
      alt={event?.name || 'Event banner'}
      className={`w-full h-48 sm:h-64 rounded-lg ${className}`}
      placeholder="/images/default-placeholder.svg"
      sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, 1024px"
      priority={true} // Event banners are usually above the fold
    />
  );
};

// CSS for mobile image optimizations
const imageOptimizationCSS = `
.mobile-optimized-image-container {
  position: relative;
  background-color: #f3f4f6;
}

.dark .mobile-optimized-image-container {
  background-color: #374151;
}

@media (max-width: 480px) {
  .mobile-optimized-image-container {
    /* Reduce memory usage on small devices */
    image-rendering: optimizeSpeed;
  }
}

/* Prevent layout shift during image loading */
.mobile-optimized-image-container::before {
  content: '';
  display: block;
  padding-bottom: var(--aspect-ratio, 56.25%); /* Default 16:9 */
}

.mobile-optimized-image-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
`;

// Inject CSS if not already present
if (typeof document !== 'undefined' && !document.getElementById('mobile-image-optimization-css')) {
  const style = document.createElement('style');
  style.id = 'mobile-image-optimization-css';
  style.textContent = imageOptimizationCSS;
  document.head.appendChild(style);
}

export default MobileOptimizedImage;
export { 
  MobileOptimizedImage,
  MobileTeamLogo,
  MobilePlayerAvatar,
  MobileNewsImage,
  MobileEventBanner
};