// src/components/Carousel.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import { useSwipeable } from 'react-swipeable';

export interface CarouselItem {
  id: string;
  content: ReactNode;
  data?: any;
}

interface CarouselProps {
  items: CarouselItem[];
  itemsPerView?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: number;
  showNavigation?: boolean;
  showIndicators?: boolean;
  enableInfiniteLoop?: boolean;
  enableAutoPlay?: boolean;
  autoPlayInterval?: number;
  enableSwipe?: boolean;
  enableKeyboard?: boolean;
  pauseOnHover?: boolean;
  centerMode?: boolean;
  variableWidth?: boolean;
  className?: string;
  itemClassName?: string;
  onItemClick?: (item: CarouselItem, index: number) => void;
  onSlideChange?: (currentIndex: number) => void;
  renderCustomNavigation?: (props: {
    canGoPrev: boolean;
    canGoNext: boolean;
    goToPrev: () => void;
    goToNext: () => void;
  }) => ReactNode;
  renderCustomIndicators?: (props: {
    currentIndex: number;
    totalItems: number;
    goToIndex: (index: number) => void;
  }) => ReactNode;
}

const Carousel: React.FC<CarouselProps> = ({
  items,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 16,
  showNavigation = true,
  showIndicators = false,
  enableInfiniteLoop = false,
  enableAutoPlay = false,
  autoPlayInterval = 3000,
  enableSwipe = true,
  enableKeyboard = true,
  pauseOnHover = true,
  centerMode = false,
  variableWidth = false,
  className = '',
  itemClassName = '',
  onItemClick,
  onSlideChange,
  renderCustomNavigation,
  renderCustomIndicators
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(enableAutoPlay);
  const [isPaused, setIsPaused] = useState(false);
  const [itemsPerViewCurrent, setItemsPerViewCurrent] = useState(itemsPerView.desktop);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Handle responsive itemsPerView
  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setItemsPerViewCurrent(itemsPerView.mobile);
      } else if (width < 1024) {
        setItemsPerViewCurrent(itemsPerView.tablet);
      } else {
        setItemsPerViewCurrent(itemsPerView.desktop);
      }
    };

    updateItemsPerView();
    window.addEventListener('resize', updateItemsPerView);
    return () => window.removeEventListener('resize', updateItemsPerView);
  }, [itemsPerView]);

  // Handle container width changes
  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserverRef.current.observe(containerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || isPaused || items.length <= itemsPerViewCurrent) return;

    intervalRef.current = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isPaused, items.length, itemsPerViewCurrent, autoPlayInterval]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target !== document.body) return; // Only handle when no input is focused
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPrev();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
        case ' ':
          event.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'Home':
          event.preventDefault();
          goToIndex(0);
          break;
        case 'End':
          event.preventDefault();
          goToIndex(getMaxIndex());
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard, itemsPerViewCurrent, items.length]);

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => enableSwipe && goToNext(),
    onSwipedRight: () => enableSwipe && goToPrev(),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  // Calculate maximum index
  const getMaxIndex = useCallback(() => {
    if (enableInfiniteLoop) return items.length - 1;
    return Math.max(0, items.length - itemsPerViewCurrent);
  }, [items.length, itemsPerViewCurrent, enableInfiniteLoop]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    if (enableInfiniteLoop) {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, getMaxIndex()));
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, enableInfiniteLoop, items.length, getMaxIndex]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    if (enableInfiniteLoop) {
      setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    } else {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
    
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning, enableInfiniteLoop, items.length]);

  const goToIndex = useCallback((index: number) => {
    if (index === currentIndex || isTransitioning) return;
    
    setIsTransitioning(true);
    setCurrentIndex(Math.max(0, Math.min(index, getMaxIndex())));
    setTimeout(() => setIsTransitioning(false), 300);
  }, [currentIndex, isTransitioning, getMaxIndex]);

  // Calculate item width
  const getItemWidth = useCallback(() => {
    if (variableWidth) return 'auto';
    const availableWidth = containerWidth - (gap * (itemsPerViewCurrent - 1));
    return `${availableWidth / itemsPerViewCurrent}px`;
  }, [containerWidth, gap, itemsPerViewCurrent, variableWidth]);

  // Calculate transform value
  const getTransformValue = useCallback(() => {
    if (variableWidth) {
      // For variable width, calculate based on actual item positions
      return `translateX(-${currentIndex * (containerWidth / itemsPerViewCurrent + gap)}px)`;
    }
    
    const itemWidth = (containerWidth - (gap * (itemsPerViewCurrent - 1))) / itemsPerViewCurrent;
    const offset = currentIndex * (itemWidth + gap);
    
    if (centerMode && itemsPerViewCurrent < items.length) {
      const centerOffset = (containerWidth - itemWidth) / 2;
      return `translateX(${centerOffset - offset}px)`;
    }
    
    return `translateX(-${offset}px)`;
  }, [currentIndex, containerWidth, gap, itemsPerViewCurrent, centerMode, variableWidth, items.length]);

  // Handle slide change callback
  useEffect(() => {
    onSlideChange?.(currentIndex);
  }, [currentIndex, onSlideChange]);

  // Navigation state
  const canGoPrev = enableInfiniteLoop || currentIndex > 0;
  const canGoNext = enableInfiniteLoop || currentIndex < getMaxIndex();

  // Mouse handlers for pause on hover
  const handleMouseEnter = () => {
    if (pauseOnHover) setIsPaused(true);
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) setIsPaused(false);
  };

  if (!items || items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-48 bg-[#1a2332] border border-[#2b3d4d] rounded-lg ${className}`}>
        <div className="text-center text-[#768894]">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p>No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...(enableSwipe ? swipeHandlers : {})}
    >
      
      {/* Main Container */}
      <div 
        ref={containerRef}
        className="overflow-hidden"
        role="region"
        aria-label="Content carousel"
      >
        
        {/* Track */}
        <div 
          ref={trackRef}
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: getTransformValue(),
            gap: `${gap}px`
          }}
        >
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`flex-shrink-0 ${itemClassName}`}
              style={{
                width: getItemWidth()
              }}
              onClick={() => onItemClick?.(item, index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onItemClick?.(item, index);
                }
              }}
            >
              {item.content}
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation */}
      {showNavigation && items.length > itemsPerViewCurrent && (
        <>
          {renderCustomNavigation ? (
            renderCustomNavigation({
              canGoPrev,
              canGoNext,
              goToPrev,
              goToNext: goToNext
            })
          ) : (
            <>
              <button
                onClick={goToPrev}
                disabled={!canGoPrev || isTransitioning}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                aria-label="Previous items"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={goToNext}
                disabled={!canGoNext || isTransitioning}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed z-10"
                aria-label="Next items"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </>
      )}
      
      {/* Indicators */}
      {showIndicators && items.length > itemsPerViewCurrent && (
        <div className="flex justify-center mt-4 space-x-2">
          {renderCustomIndicators ? (
            renderCustomIndicators({
              currentIndex,
              totalItems: items.length,
              goToIndex
            })
          ) : (
            Array.from({ length: getMaxIndex() + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-[#fa4454] w-6' 
                    : 'bg-[#768894] hover:bg-[#ffffff]/70'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))
          )}
        </div>
      )}
      
      {/* Auto-play Controls */}
      {enableAutoPlay && items.length > itemsPerViewCurrent && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
          aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          )}
        </button>
      )}
      
      {/* Progress Indicator */}
      {enableAutoPlay && isPlaying && !isPaused && items.length > itemsPerViewCurrent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-[#fa4454] transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % autoPlayInterval) / autoPlayInterval) * 100}%`
            }}
          />
        </div>
      )}
      
      {/* Item Counter */}
      <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
        {currentIndex + 1}-{Math.min(currentIndex + itemsPerViewCurrent, items.length)} of {items.length}
      </div>
    </div>
  );
};

export default Carousel;
