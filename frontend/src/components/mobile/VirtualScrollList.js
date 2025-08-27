import React, { useState, useEffect, useRef, useMemo } from 'react';

const VirtualScrollList = ({ 
  items = [], 
  itemHeight = 80, 
  renderItem,
  containerHeight = 400,
  overscan = 5,
  className = '',
  onScrollEnd = null
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef();
  const [isScrolling, setIsScrolling] = useState(false);
  
  const totalHeight = items.length * itemHeight;
  const containerRef = useRef();
  
  // Calculate visible range with overscan
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const viewportHeight = containerHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + viewportHeight) / itemHeight) + overscan
    );
    
    const visibleItems = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (items[i]) {
        visibleItems.push({
          index: i,
          item: items[i],
          offsetY: i * itemHeight
        });
      }
    }
    
    return { startIndex, endIndex, visibleItems };
  }, [scrollTop, items, itemHeight, containerHeight, overscan]);

  // Handle scroll events
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    let scrollTimeout;
    
    const handleScroll = () => {
      const newScrollTop = scrollElement.scrollTop;
      setScrollTop(newScrollTop);
      
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
      
      // Check if we're near the bottom for infinite scroll
      if (onScrollEnd && 
          newScrollTop + containerHeight >= totalHeight - itemHeight * 3) {
        onScrollEnd();
      }
    };

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [totalHeight, containerHeight, itemHeight, onScrollEnd]);

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        position: 'relative'
      }}
    >
      <div
        className="virtual-scroll-spacer"
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {visibleItems.map(({ index, item, offsetY }) => (
          <div
            key={index}
            className={`virtual-scroll-item ${isScrolling ? 'scrolling' : ''}`}
            style={{
              position: 'absolute',
              top: offsetY,
              left: 0,
              right: 0,
              height: itemHeight,
              contain: 'layout size style'
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
        
        {/* Loading indicator at bottom */}
        {onScrollEnd && scrollTop + containerHeight >= totalHeight - itemHeight * 5 && (
          <div
            style={{
              position: 'absolute',
              top: totalHeight,
              left: 0,
              right: 0,
              height: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9ca3af'
            }}
          >
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              <span className="text-sm">Loading more...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for virtual scrolling with dynamic data
export const useVirtualScroll = (items, itemHeight = 80) => {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const [scrollTop, setScrollTop] = useState(0);
  
  const updateVisibleRange = (containerHeight, scrollTop) => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight)
    );
    
    setVisibleRange({ start, end });
    setScrollTop(scrollTop);
  };
  
  return {
    visibleRange,
    scrollTop,
    updateVisibleRange,
    totalHeight: items.length * itemHeight
  };
};

export default VirtualScrollList;