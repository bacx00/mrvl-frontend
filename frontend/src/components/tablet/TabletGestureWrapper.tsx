// src/components/tablet/TabletGestureWrapper.tsx
'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';

interface TabletGestureWrapperProps {
  children: React.ReactNode;
  enablePinchZoom?: boolean;
  enablePan?: boolean;
  enableSwipe?: boolean;
  minZoom?: number;
  maxZoom?: number;
  onPinchZoom?: (scale: number) => void;
  onPan?: (offset: { x: number; y: number }) => void;
  onSwipe?: (direction: 'left' | 'right' | 'up' | 'down', velocity: number) => void;
  className?: string;
}

interface TouchState {
  scale: number;
  offset: { x: number; y: number };
  isDragging: boolean;
  isPinching: boolean;
  initialDistance: number;
  initialScale: number;
  lastTouch: { x: number; y: number };
  touchStart: { x: number; y: number };
  touchStartTime: number;
}

const TabletGestureWrapper: React.FC<TabletGestureWrapperProps> = ({
  children,
  enablePinchZoom = false,
  enablePan = false,
  enableSwipe = false,
  minZoom = 0.5,
  maxZoom = 3,
  onPinchZoom,
  onPan,
  onSwipe,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchState, setTouchState] = useState<TouchState>({
    scale: 1,
    offset: { x: 0, y: 0 },
    isDragging: false,
    isPinching: false,
    initialDistance: 0,
    initialScale: 1,
    lastTouch: { x: 0, y: 0 },
    touchStart: { x: 0, y: 0 },
    touchStartTime: 0,
  });

  // Calculate distance between two touch points
  const getDistance = useCallback((touches: TouchList): number => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  // Calculate center point between touches
  const getCenter = useCallback((touches: TouchList): { x: number; y: number } => {
    if (touches.length === 1) {
      return { x: touches[0].clientX, y: touches[0].clientY };
    }
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const touch = touches[0];
    const now = Date.now();

    if (touches.length === 1) {
      // Single touch - potential pan or swipe
      setTouchState(prev => ({
        ...prev,
        isDragging: true,
        lastTouch: { x: touch.clientX, y: touch.clientY },
        touchStart: { x: touch.clientX, y: touch.clientY },
        touchStartTime: now,
      }));
    } else if (touches.length === 2 && enablePinchZoom) {
      // Two touches - pinch zoom
      const distance = getDistance(touches);
      setTouchState(prev => ({
        ...prev,
        isPinching: true,
        initialDistance: distance,
        initialScale: prev.scale,
      }));
    }
  }, [enablePinchZoom, getDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling
    const touches = e.touches;

    if (touches.length === 2 && touchState.isPinching && enablePinchZoom) {
      // Handle pinch zoom
      const distance = getDistance(touches);
      const scale = (distance / touchState.initialDistance) * touchState.initialScale;
      const clampedScale = Math.max(minZoom, Math.min(maxZoom, scale));
      
      setTouchState(prev => ({
        ...prev,
        scale: clampedScale,
      }));
      
      onPinchZoom?.(clampedScale);

    } else if (touches.length === 1 && touchState.isDragging && enablePan) {
      // Handle pan
      const touch = touches[0];
      const deltaX = touch.clientX - touchState.lastTouch.x;
      const deltaY = touch.clientY - touchState.lastTouch.y;
      
      const newOffset = {
        x: touchState.offset.x + deltaX,
        y: touchState.offset.y + deltaY,
      };
      
      setTouchState(prev => ({
        ...prev,
        offset: newOffset,
        lastTouch: { x: touch.clientX, y: touch.clientY },
      }));
      
      onPan?.(newOffset);
    }
  }, [
    touchState.isDragging,
    touchState.isPinching,
    touchState.initialDistance,
    touchState.initialScale,
    touchState.lastTouch,
    touchState.offset,
    enablePinchZoom,
    enablePan,
    minZoom,
    maxZoom,
    getDistance,
    onPinchZoom,
    onPan,
  ]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const touches = e.touches;
    const changedTouches = e.changedTouches;

    // Handle swipe gesture
    if (enableSwipe && touchState.isDragging && touches.length === 0) {
      const touch = changedTouches[0];
      const deltaX = touch.clientX - touchState.touchStart.x;
      const deltaY = touch.clientY - touchState.touchStart.y;
      const deltaTime = Date.now() - touchState.touchStartTime;
      
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime; // pixels per millisecond
      
      // Minimum distance and maximum time for swipe
      if (distance > 30 && deltaTime < 500 && velocity > 0.2) {
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);
        
        if (absX > absY) {
          // Horizontal swipe
          onSwipe?.(deltaX > 0 ? 'right' : 'left', velocity);
        } else {
          // Vertical swipe
          onSwipe?.(deltaY > 0 ? 'down' : 'up', velocity);
        }
      }
    }

    // Reset touch states
    if (touches.length === 0) {
      setTouchState(prev => ({
        ...prev,
        isDragging: false,
        isPinching: false,
      }));
    } else if (touches.length === 1) {
      setTouchState(prev => ({
        ...prev,
        isPinching: false,
      }));
    }
  }, [
    touchState.isDragging,
    touchState.touchStart,
    touchState.touchStartTime,
    enableSwipe,
    onSwipe,
  ]);

  // Reset gestures to initial state
  const resetGestures = useCallback(() => {
    setTouchState({
      scale: 1,
      offset: { x: 0, y: 0 },
      isDragging: false,
      isPinching: false,
      initialDistance: 0,
      initialScale: 1,
      lastTouch: { x: 0, y: 0 },
      touchStart: { x: 0, y: 0 },
      touchStartTime: 0,
    });
  }, []);

  // Double tap to reset
  const handleDoubleClick = useCallback(() => {
    if (enablePinchZoom) {
      resetGestures();
      onPinchZoom?.(1);
      onPan?.({ x: 0, y: 0 });
    }
  }, [enablePinchZoom, resetGestures, onPinchZoom, onPan]);

  // Apply transform styles
  const getTransformStyle = useCallback((): React.CSSProperties => {
    return {
      transform: `translate(${touchState.offset.x}px, ${touchState.offset.y}px) scale(${touchState.scale})`,
      transformOrigin: 'center center',
      transition: touchState.isDragging || touchState.isPinching ? 'none' : 'transform 0.2s ease-out',
    };
  }, [touchState.offset, touchState.scale, touchState.isDragging, touchState.isPinching]);

  return (
    <div
      ref={containerRef}
      className={`tablet-gesture-wrapper ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
      style={{
        touchAction: 'none',
        overflow: 'hidden',
        position: 'relative',
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
    >
      <div
        className="tablet-gesture-content"
        style={getTransformStyle()}
      >
        {children}
      </div>

      {/* Gesture Indicators */}
      {(touchState.isDragging || touchState.isPinching) && (
        <div className="tablet-gesture-indicators">
          {touchState.isPinching && enablePinchZoom && (
            <div className="tablet-gesture-indicator scale-indicator">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
              <span>{Math.round(touchState.scale * 100)}%</span>
            </div>
          )}
          
          {touchState.isDragging && enablePan && (
            <div className="tablet-gesture-indicator pan-indicator">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </div>
          )}
        </div>
      )}

      {/* Reset Button */}
      {(touchState.scale !== 1 || touchState.offset.x !== 0 || touchState.offset.y !== 0) && (
        <button
          className="tablet-gesture-reset"
          onClick={resetGestures}
          aria-label="Reset zoom and position"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      )}

      {/* Gesture Styles */}
      <style jsx>{`
        .tablet-gesture-wrapper {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .tablet-gesture-content {
          width: 100%;
          height: 100%;
          will-change: transform;
        }

        .tablet-gesture-indicators {
          position: absolute;
          top: 20px;
          left: 20px;
          pointer-events: none;
          z-index: 100;
        }

        .tablet-gesture-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 8px;
          animation: tablet-gesture-fade-in 0.2s ease-out;
        }

        .tablet-gesture-reset {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 100;
          transition: all 0.2s ease;
        }

        .tablet-gesture-reset:hover {
          background: rgba(0, 0, 0, 0.9);
          transform: scale(1.1);
        }

        .tablet-gesture-reset:active {
          transform: scale(0.95);
        }

        @keyframes tablet-gesture-fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 767px) {
          .tablet-gesture-indicators {
            top: 10px;
            left: 10px;
          }
          
          .tablet-gesture-indicator {
            padding: 6px 10px;
            font-size: 12px;
          }
          
          .tablet-gesture-reset {
            width: 40px;
            height: 40px;
            bottom: 15px;
            right: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default TabletGestureWrapper;