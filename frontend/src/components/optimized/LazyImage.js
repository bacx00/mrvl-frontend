import React, { useState, useRef, useEffect, memo } from 'react';

/**
 * Optimized lazy loading image component
 * Uses Intersection Observer for efficient viewport detection
 */
const LazyImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = '/images/placeholder.svg',
  fallback = null,
  onLoad = null,
  onError = null,
  rootMargin = '50px'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const imageElement = imgRef.current;
    if (!imageElement) return;

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          // Stop observing once in view
          observerRef.current?.unobserve(imageElement);
        }
      },
      {
        rootMargin,
        threshold: 0.1
      }
    );

    // Start observing
    observerRef.current.observe(imageElement);

    // Cleanup
    return () => {
      observerRef.current?.unobserve(imageElement);
    };
  }, [rootMargin]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setHasError(true);
    if (onError) onError();
  };

  // Show fallback if error and fallback provided
  if (hasError && fallback) {
    return fallback;
  }

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {/* Show placeholder while not in view or not loaded */}
      {(!isInView || !isLoaded) && !hasError && (
        <img
          src={placeholder}
          alt={alt}
          className={`placeholder-image ${className}`}
          style={{ 
            filter: 'blur(2px)',
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      
      {/* Show actual image when in view */}
      {isInView && (
        <img
          src={src}
          alt={alt}
          className={`actual-image ${className} ${isLoaded ? 'loaded' : 'loading'}`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded && !hasError ? 1 : 0,
            transition: 'opacity 0.3s ease',
            position: isLoaded ? 'static' : 'absolute',
            top: 0,
            left: 0
          }}
        />
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;