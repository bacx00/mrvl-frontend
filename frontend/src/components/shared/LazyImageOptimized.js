import React, { useState, useRef, useEffect } from 'react';

/**
 * Optimized Lazy Loading Image Component
 * Production-ready image loading with performance optimizations
 */
function LazyImageOptimized({ 
  src, 
  alt, 
  className = '', 
  placeholderClassName = '',
  loadingClassName = 'animate-pulse bg-gray-200 dark:bg-gray-700',
  errorClassName = 'bg-gray-100 dark:bg-gray-800',
  critical = false,
  onLoad = null,
  onError = null,
  ...props 
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isInView, setIsInView] = useState(critical); // Critical images load immediately
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const currentImgRef = imgRef.current;
    
    // Don't use intersection observer for critical images
    if (critical || isInView) return;

    // Create intersection observer for lazy loading
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    if (currentImgRef && observerRef.current) {
      observerRef.current.observe(currentImgRef);
    }

    // Cleanup observer on unmount
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [critical, isInView]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    setIsError(false);
    
    // Add fade-in animation
    if (e.target) {
      e.target.style.opacity = '1';
    }
    
    if (onLoad) {
      onLoad(e);
    }
  };

  const handleError = (e) => {
    setIsError(true);
    setIsLoaded(false);
    
    if (onError) {
      onError(e);
    }
  };

  // Generate responsive srcSet for different screen sizes
  const generateSrcSet = (originalSrc) => {
    if (!originalSrc || originalSrc.startsWith('data:')) return '';
    
    // For now, return the original src
    // In a production environment, you'd generate different sizes
    return originalSrc;
  };

  // Show placeholder while not in view or loading
  if (!isInView || (!isLoaded && !isError)) {
    return (
      <div 
        ref={imgRef}
        className={`${className} ${loadingClassName} ${placeholderClassName} flex items-center justify-center`}
        {...props}
      >
        {!isInView && !critical && (
          <div className="text-gray-400 text-xs">📷</div>
        )}
        {isInView && !isLoaded && !isError && (
          <div className="text-gray-400 text-xs animate-spin">⟳</div>
        )}
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div 
        className={`${className} ${errorClassName} ${placeholderClassName} flex items-center justify-center text-gray-500`}
        {...props}
      >
        <div className="text-center">
          <div className="text-2xl mb-1">⚠️</div>
          <div className="text-xs">Failed to load</div>
        </div>
      </div>
    );
  }

  // Render actual image
  return (
    <img
      ref={imgRef}
      src={src}
      srcSet={generateSrcSet(src)}
      alt={alt}
      className={`${className} transition-opacity duration-300`}
      style={{ opacity: isLoaded ? 1 : 0 }}
      onLoad={handleLoad}
      onError={handleError}
      loading={critical ? 'eager' : 'lazy'}
      decoding="async"
      {...props}
    />
  );
}

export default LazyImageOptimized;