import React, { useState, useEffect, useRef } from 'react';

// Optimized image component with lazy loading and placeholder
const OptimizedImage = ({ 
  src, 
  alt = '', 
  className = '', 
  width,
  height,
  placeholder = 'blur',
  priority = false,
  onLoad = null,
  onError = null 
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder === 'blur' ? null : src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    // Load immediately if priority
    if (priority) {
      setImageSrc(src);
      return;
    }

    // Use Intersection Observer for lazy loading
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
        threshold: 0.01
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, priority]);

  const handleLoad = () => {
    setIsLoading(false);
    if (onLoad) onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    if (onError) onError();
    // Fallback to placeholder
    setImageSrc('/default-avatar.png');
  };

  // Generate blur placeholder
  const blurStyle = isLoading && placeholder === 'blur' ? {
    filter: 'blur(20px)',
    transform: 'scale(1.1)',
  } : {};

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {/* Loading placeholder */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
      
      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          onLoad={handleLoad}
          onError={handleError}
          className={`${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          style={{
            ...blurStyle,
            objectFit: 'cover',
            width: '100%',
            height: '100%'
          }}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}
      
      {/* Error state */}
      {hasError && !imageSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <span className="text-gray-400">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;