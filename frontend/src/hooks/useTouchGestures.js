import { useRef, useCallback, useEffect } from 'react';

export const useTouchGestures = (options = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onTap,
    onLongPress,
    threshold = 50,
    longPressDelay = 500,
    preventScroll = false
  } = options;

  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const longPressTimerRef = useRef(null);
  const isTouchingRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    isTouchingRef.current = true;

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        if (isTouchingRef.current) {
          onLongPress(e);
          isTouchingRef.current = false; // Prevent tap after long press
        }
      }, longPressDelay);
    }

    if (preventScroll) {
      e.preventDefault();
    }
  }, [onLongPress, longPressDelay, preventScroll]);

  const handleTouchMove = useCallback((e) => {
    // Clear long press timer on move
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (preventScroll) {
      e.preventDefault();
    }
  }, [preventScroll]);

  const handleTouchEnd = useCallback((e) => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (!isTouchingRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Detect tap (minimal movement and quick)
    if (absX < 10 && absY < 10 && deltaTime < 300 && onTap) {
      onTap(e);
    }
    // Detect swipes
    else if (absX > threshold || absY > threshold) {
      if (absX > absY) {
        // Horizontal swipe
        if (deltaX > threshold && onSwipeRight) {
          onSwipeRight(e);
        } else if (deltaX < -threshold && onSwipeLeft) {
          onSwipeLeft(e);
        }
      } else {
        // Vertical swipe
        if (deltaY > threshold && onSwipeDown) {
          onSwipeDown(e);
        } else if (deltaY < -threshold && onSwipeUp) {
          onSwipeUp(e);
        }
      }
    }

    isTouchingRef.current = false;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, onTap]);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    isTouchingRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
};

// Hook for pinch zoom gestures
export const usePinchZoom = (options = {}) => {
  const {
    onZoomStart,
    onZoomChange,
    onZoomEnd,
    minScale = 0.5,
    maxScale = 3
  } = options;

  const initialDistanceRef = useRef(0);
  const currentScaleRef = useRef(1);

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches);
      if (onZoomStart) {
        onZoomStart(currentScaleRef.current);
      }
    }
  }, [onZoomStart]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistanceRef.current;
      const newScale = Math.min(Math.max(currentScaleRef.current * scale, minScale), maxScale);
      
      if (onZoomChange) {
        onZoomChange(newScale);
      }
    }
  }, [minScale, maxScale, onZoomChange]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2) {
      if (onZoomEnd) {
        onZoomEnd(currentScaleRef.current);
      }
    }
  }, [onZoomEnd]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

// Enhanced tablet gestures hook with pinch-to-zoom and pan support
export const useTabletGestures = (options = {}) => {
  const {
    onPinchZoom,
    onPan,
    onPinchStart,
    onPinchEnd,
    onPanStart,
    onPanEnd,
    minScale = 0.5,
    maxScale = 3,
    panThreshold = 5
  } = options;

  const initialDistanceRef = useRef(0);
  const initialScaleRef = useRef(1);
  const lastPanPointRef = useRef({ x: 0, y: 0 });
  const gestureStateRef = useRef({
    isPinching: false,
    isPanning: false,
    scale: 1,
    panX: 0,
    panY: 0
  });

  const getDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches) => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Pinch gesture start
      initialDistanceRef.current = getDistance(e.touches);
      initialScaleRef.current = gestureStateRef.current.scale;
      gestureStateRef.current.isPinching = true;
      
      const center = getCenter(e.touches);
      if (onPinchStart) {
        onPinchStart({ scale: gestureStateRef.current.scale, center });
      }
    } else if (e.touches.length === 1) {
      // Pan gesture start
      const touch = e.touches[0];
      lastPanPointRef.current = { x: touch.clientX, y: touch.clientY };
      gestureStateRef.current.isPanning = true;
      
      if (onPanStart) {
        onPanStart({ x: touch.clientX, y: touch.clientY });
      }
    }
  }, [onPinchStart, onPanStart]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && gestureStateRef.current.isPinching) {
      // Pinch zoom
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const scaleFactor = currentDistance / initialDistanceRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * scaleFactor, minScale), maxScale);
      
      gestureStateRef.current.scale = newScale;
      const center = getCenter(e.touches);
      
      if (onPinchZoom) {
        onPinchZoom(scaleFactor, center);
      }
    } else if (e.touches.length === 1 && gestureStateRef.current.isPanning && !gestureStateRef.current.isPinching) {
      // Pan gesture
      const touch = e.touches[0];
      const deltaX = touch.clientX - lastPanPointRef.current.x;
      const deltaY = touch.clientY - lastPanPointRef.current.y;
      
      // Only trigger pan if movement exceeds threshold
      if (Math.abs(deltaX) > panThreshold || Math.abs(deltaY) > panThreshold) {
        gestureStateRef.current.panX += deltaX;
        gestureStateRef.current.panY += deltaY;
        
        if (onPan) {
          onPan({ x: deltaX, y: deltaY });
        }
        
        lastPanPointRef.current = { x: touch.clientX, y: touch.clientY };
      }
    }
  }, [onPinchZoom, onPan, minScale, maxScale, panThreshold]);

  const handleTouchEnd = useCallback((e) => {
    if (e.touches.length < 2 && gestureStateRef.current.isPinching) {
      // Pinch end
      gestureStateRef.current.isPinching = false;
      if (onPinchEnd) {
        onPinchEnd({ scale: gestureStateRef.current.scale });
      }
    }
    
    if (e.touches.length === 0 && gestureStateRef.current.isPanning) {
      // Pan end
      gestureStateRef.current.isPanning = false;
      if (onPanEnd) {
        onPanEnd({ 
          panX: gestureStateRef.current.panX, 
          panY: gestureStateRef.current.panY 
        });
      }
    }
  }, [onPinchEnd, onPanEnd]);

  const resetGestures = useCallback(() => {
    gestureStateRef.current = {
      isPinching: false,
      isPanning: false,
      scale: 1,
      panX: 0,
      panY: 0
    };
    initialDistanceRef.current = 0;
    initialScaleRef.current = 1;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    gestureState: gestureStateRef.current,
    resetGestures
  };
};