// src/components/OptimizedImage.tsx
'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import Image, { ImageProps } from 'next/image';

export interface OptimizedImageProps extends Omit<ImageProps, 'onError' | 'onLoad'> {
  fallbackSrc?: string;
  teamName?: string;
  playerName?: string;
  showPlaceholder?: boolean;
  blurDataURL?: string;
  enableLazyLoading?: boolean;
  enableWebP?: boolean;
  enableAVIF?: boolean;
  performanceMonitoring?: boolean;
  retryAttempts?: number;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onLoadStart?: () => void;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  teamName,
  playerName,
  showPlaceholder = true,
  blurDataURL,
  enableLazyLoading = true,
  enableWebP = true,
  enableAVIF = true,
  performanceMonitoring = false,
  retryAttempts = 3,
  loadingComponent,
  errorComponent,
  onLoadStart,
  onLoadComplete,
  onError,
  className = '',
  priority = false,
  ...props
}, ref) => {
  const [imgSrc, setImgSrc] = useState<string | null>(src as string);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loadTime, setLoadTime] = useState<number | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(!enableLazyLoading || priority);
  
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadStartTime = useRef<number | null>(null);

  // Format source URLs for different formats
  const getOptimizedSrc = (originalSrc: string): string => {
    if (!originalSrc || originalSrc.startsWith('data:')) return originalSrc;
    
    // If it's already an optimized format, return as-is
    if (originalSrc.includes('.webp') || originalSrc.includes('.avif')) {
      return originalSrc;
    }
    
    // For Next.js Image optimization
    const url = new URL(originalSrc, window.location.origin);
    
    // Add format parameter for modern browsers
    if (enableAVIF && supportsAVIF()) {
      url.searchParams.set('format', 'avif');
    } else if (enableWebP && supportsWebP()) {
      url.searchParams.set('format', 'webp');
    }
    
    return url.toString();
  };

  // Check browser support for modern formats
  const supportsWebP = (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  const supportsAVIF = (): boolean => {
    if (typeof window === 'undefined') return false;
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!enableLazyLoading || priority || isIntersecting) return;

    const currentRef = imgRef.current;
    if (!currentRef) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observerRef.current.observe(currentRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [enableLazyLoading, priority, isIntersecting]);

  // Handle image loading
  const handleLoadStart = () => {
    if (performanceMonitoring) {
      loadStartTime.current = performance.now();
    }
    setLoading(true);
    onLoadStart?.();
  };

  const handleLoadComplete = () => {
    setLoading(false);
    setError(false);
    
    if (performanceMonitoring && loadStartTime.current) {
      const duration = performance.now() - loadStartTime.current;
      setLoadTime(duration);
      
      // Optional: Report to analytics
      if (window.gtag) {
        window.gtag('event', 'image_load_time', {
          custom_parameter_1: duration,
          custom_parameter_2: imgSrc
        });
      }
    }
    
    onLoadComplete?.();
  };

  const handleError = () => {
    const errorObj = new Error(`Failed to load image: ${imgSrc}`);
    
    if (attempts < retryAttempts && imgSrc !== fallbackSrc) {
      // Try fallback or retry
      setAttempts(prev => prev + 1);
      if (attempts === 0 && fallbackSrc) {
        setImgSrc(fallbackSrc);
      } else {
        // Retry with original source after a delay
        setTimeout(() => {
          setImgSrc(src as string);
        }, 1000 * Math.pow(2, attempts));
      }
      return;
    }
    
    setError(true);
    setLoading(false);
    onError?.(errorObj);
  };

  // Generate placeholder initials
  const getPlaceholderInitials = (): string => {
    if (teamName) {
      return teamName.split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase();
    }
    if (playerName) {
      return playerName.split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase();
    }
    return '?';
  };

  // Generate placeholder colors based on name
  const getPlaceholderColor = (): string => {
    const name = teamName || playerName || 'default';
    const colors = [
      '#fa4454', // Marvel Red
      '#4ade80', // Success Green
      '#f59e0b', // Warning Orange
      '#3b82f6', // Info Blue
      '#8b5cf6', // Purple
      '#ef4444', // Red
      '#10b981', // Emerald
      '#f97316'  // Orange
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Error state with custom component or fallback
  if (error) {
    if (errorComponent) {
      return <>{errorComponent}</>;
    }
    
    if (showPlaceholder && (teamName || playerName)) {
      return (
        <div
          className={`flex items-center justify-center text-white font-bold text-sm ${className}`}
          style={{
            width: props.width,
            height: props.height,
            backgroundColor: getPlaceholderColor(),
            borderRadius: className.includes('rounded') ? undefined : '4px'
          }}
          title={alt}
        >
          {getPlaceholderInitials()}
        </div>
      );
    }
    
    return (
      <div
        className={`flex items-center justify-center bg-[#2b3d4d] text-[#768894] ${className}`}
        style={{
          width: props.width,
          height: props.height
        }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    );
  }

  // Loading state with custom component or fallback
  if (loading && !isIntersecting) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div
        className={`animate-pulse bg-[#2b3d4d] ${className}`}
        style={{
          width: props.width,
          height: props.height
        }}
      />
    );
  }

  // Don't render image until it should be visible (lazy loading)
  if (!isIntersecting) {
    return (
      <div
        ref={imgRef}
        className={`bg-[#2b3d4d] ${className}`}
        style={{
          width: props.width,
          height: props.height
        }}
      />
    );
  }

  // Generate blur placeholder if not provided
  const generateBlurDataURL = (): string => {
    if (blurDataURL) return blurDataURL;
    
    // Generate a simple blur data URL
    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="${getPlaceholderColor()}" opacity="0.3"/>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        ref={ref}
        {...props}
        src={getOptimizedSrc(imgSrc || '')}
        alt={alt}
        className={`transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
        placeholder={blurDataURL || generateBlurDataURL() ? 'blur' : 'empty'}
        blurDataURL={generateBlurDataURL()}
        priority={priority}
        onLoadingComplete={handleLoadComplete}
        onLoad={handleLoadStart}
        onError={handleError}
        sizes={props.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      />
      
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#2b3d4d]/80">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#fa4454]"></div>
        </div>
      )}
      
      {/* Performance monitoring badge (development only) */}
      {performanceMonitoring && loadTime && process.env.NODE_ENV === 'development' && (
        <div className="absolute top-0 right-0 bg-black/70 text-white text-xs px-2 py-1 rounded-bl">
          {Math.round(loadTime)}ms
        </div>
      )}
      
      {/* Retry indicator */}
      {attempts > 0 && (
        <div className="absolute bottom-0 left-0 bg-[#f59e0b]/80 text-white text-xs px-2 py-1 rounded-tr">
          Retry {attempts}/{retryAttempts}
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

export default OptimizedImage;
