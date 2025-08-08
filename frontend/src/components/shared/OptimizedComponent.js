import React, { memo, useCallback, useMemo } from 'react';

// HOC for optimizing component re-renders
export const withOptimization = (Component, propsAreEqual) => {
  return memo(Component, propsAreEqual);
};

// Default props comparison for common cases
export const defaultPropsAreEqual = (prevProps, nextProps) => {
  const keys = Object.keys(prevProps);
  
  for (let key of keys) {
    // Skip functions as they might be recreated
    if (typeof prevProps[key] === 'function') continue;
    
    // Deep comparison for objects and arrays would be expensive
    // Use shallow comparison
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  return true;
};

// Optimized image component with lazy loading
export const OptimizedImage = memo(({ 
  src, 
  alt, 
  className = '', 
  fallback = '/assets/placeholder.png',
  loading = 'lazy',
  ...props 
}) => {
  const [imgSrc, setImgSrc] = React.useState(src);
  const [isLoading, setIsLoading] = React.useState(true);

  const handleError = useCallback(() => {
    setImgSrc(fallback);
  }, [fallback]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      {isLoading && (
        <div className={`${className} bg-gray-200 dark:bg-gray-700 animate-pulse`} />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'hidden' : ''}`}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </>
  );
});

// Optimized list component with virtualization support
export const OptimizedList = memo(({ 
  items, 
  renderItem, 
  keyExtractor,
  className = '',
  itemHeight,
  overscan = 3
}) => {
  const containerRef = React.useRef(null);
  const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 20 });

  React.useEffect(() => {
    if (!itemHeight || !containerRef.current) return;

    const handleScroll = () => {
      const container = containerRef.current;
      const scrollTop = container.scrollTop;
      const clientHeight = container.clientHeight;
      
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const end = Math.min(
        items.length,
        Math.ceil((scrollTop + clientHeight) / itemHeight) + overscan
      );
      
      setVisibleRange({ start, end });
    };

    const container = containerRef.current;
    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation
    
    return () => container.removeEventListener('scroll', handleScroll);
  }, [items.length, itemHeight, overscan]);

  const visibleItems = useMemo(() => {
    if (!itemHeight) return items;
    return items.slice(visibleRange.start, visibleRange.end);
  }, [items, visibleRange, itemHeight]);

  const totalHeight = itemHeight ? items.length * itemHeight : 'auto';
  const offsetY = itemHeight ? visibleRange.start * itemHeight : 0;

  return (
    <div 
      ref={containerRef} 
      className={`overflow-auto ${className}`}
      style={{ height: '100%' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={keyExtractor(item, visibleRange.start + index)}>
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

// Hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling functions
export const useThrottle = (callback, delay) => {
  const lastRun = React.useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      lastRun.current = now;
      callback(...args);
    }
  }, [callback, delay]);
};