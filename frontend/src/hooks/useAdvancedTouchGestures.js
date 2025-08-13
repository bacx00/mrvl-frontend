import { useCallback, useRef, useEffect } from 'react';

/**
 * Advanced Touch Gesture Hook for Tournament Interface
 * Optimized for VLR.gg-style interactions with tournament data
 */
export const useAdvancedTouchGestures = (element, options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPinchZoom,
    onLongPress,
    onDoubleTab,
    threshold = 50,
    pinchThreshold = 1.2,
    longPressDelay = 500,
    doubleTapDelay = 300,
    preventDefault = true
  } = options;

  const touchDataRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastTap: 0,
    tapCount: 0,
    initialPinchDistance: 0,
    isPinching: false,
    longPressTimeout: null
  });

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touch1, touch2) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    const touchData = touchDataRef.current;

    if (preventDefault) {
      e.preventDefault();
    }

    touchData.startX = touch.clientX;
    touchData.startY = touch.clientY;
    touchData.startTime = Date.now();

    // Handle multi-touch for pinch gestures
    if (e.touches.length === 2) {
      touchData.initialPinchDistance = getTouchDistance(e.touches[0], e.touches[1]);
      touchData.isPinching = true;
    } else {
      touchData.isPinching = false;
      
      // Long press detection
      if (onLongPress) {
        touchData.longPressTimeout = setTimeout(() => {
          onLongPress(e);
        }, longPressDelay);
      }
    }
  }, [preventDefault, onLongPress, longPressDelay, getTouchDistance]);

  // Handle touch move
  const handleTouchMove = useCallback((e) => {
    const touchData = touchDataRef.current;

    if (preventDefault) {
      e.preventDefault();
    }

    // Clear long press if user moves
    if (touchData.longPressTimeout) {
      clearTimeout(touchData.longPressTimeout);
      touchData.longPressTimeout = null;
    }

    // Handle pinch zoom
    if (touchData.isPinching && e.touches.length === 2 && onPinchZoom) {
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / touchData.initialPinchDistance;
      
      if (Math.abs(scale - 1) > pinchThreshold - 1) {
        onPinchZoom(scale, e);
      }
    }
  }, [preventDefault, onPinchZoom, pinchThreshold, getTouchDistance]);

  // Handle touch end
  const handleTouchEnd = useCallback((e) => {
    const touch = e.changedTouches[0];
    const touchData = touchDataRef.current;
    const currentTime = Date.now();

    if (preventDefault) {
      e.preventDefault();
    }

    // Clear long press timeout
    if (touchData.longPressTimeout) {
      clearTimeout(touchData.longPressTimeout);
      touchData.longPressTimeout = null;
    }

    // Skip gesture detection for pinch
    if (touchData.isPinching) {
      touchData.isPinching = false;
      return;
    }

    const deltaX = touch.clientX - touchData.startX;
    const deltaY = touch.clientY - touchData.startY;
    const deltaTime = currentTime - touchData.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Double tap detection
    if (onDoubleTab && deltaTime < doubleTapDelay && distance < threshold / 2) {
      if (currentTime - touchData.lastTap < doubleTapDelay && touchData.tapCount === 1) {
        onDoubleTab(e);
        touchData.tapCount = 0;
        return;
      } else {
        touchData.tapCount = 1;
        touchData.lastTap = currentTime;
      }
    }

    // Swipe detection
    if (distance > threshold && deltaTime < 500) {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(e, { distance: absX, velocity: absX / deltaTime });
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(e, { distance: absX, velocity: absX / deltaTime });
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(e, { distance: absY, velocity: absY / deltaTime });
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(e, { distance: absY, velocity: absY / deltaTime });
        }
      }
    }

    // Reset tap count after delay
    setTimeout(() => {
      if (touchData.tapCount === 1) {
        touchData.tapCount = 0;
      }
    }, doubleTapDelay);
  }, [preventDefault, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, 
      onDoubleTab, threshold, doubleTapDelay]);

  // Attach event listeners
  useEffect(() => {
    const currentElement = element?.current;
    if (!currentElement) return;

    // Passive listeners for better performance
    currentElement.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    currentElement.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    currentElement.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      currentElement.removeEventListener('touchstart', handleTouchStart);
      currentElement.removeEventListener('touchmove', handleTouchMove);
      currentElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [element, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);

  // Return gesture state and utilities
  return {
    isGestureActive: touchDataRef.current.isPinching || touchDataRef.current.longPressTimeout !== null,
    resetGestureState: useCallback(() => {
      const touchData = touchDataRef.current;
      if (touchData.longPressTimeout) {
        clearTimeout(touchData.longPressTimeout);
      }
      touchDataRef.current = {
        startX: 0,
        startY: 0,
        startTime: 0,
        lastTap: 0,
        tapCount: 0,
        initialPinchDistance: 0,
        isPinching: false,
        longPressTimeout: null
      };
    }, [])
  };
};