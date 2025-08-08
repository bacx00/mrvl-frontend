import React, { useState, useEffect, useRef, useCallback } from 'react';
import { RefreshCw, ChevronDown } from 'lucide-react';

// Advanced Pull-to-Refresh Hook
export const usePullToRefresh = (onRefresh, threshold = 80) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const distance = Math.max(0, currentY.current - startY.current);
    
    if (distance > 0 && window.scrollY === 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isPulling, isRefreshing, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh error:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
        }, 500);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    threshold
  };
};

// Pull-to-Refresh Component
export const PullToRefresh = ({ onRefresh, children, disabled = false }) => {
  const { containerRef, isPulling, pullDistance, isRefreshing, threshold } = usePullToRefresh(
    onRefresh
  );

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  if (disabled) {
    return <div>{children}</div>;
  }

  return (
    <div ref={containerRef} className="pull-refresh-container relative">
      {/* Pull Indicator */}
      <div
        className="pull-refresh-indicator"
        style={{
          top: Math.max(-60, pullDistance - 60),
          opacity: pullProgress
        }}
      >
        {isRefreshing ? (
          <RefreshCw className="w-5 h-5 text-red-600 refresh-spinner" />
        ) : (
          <ChevronDown 
            className={`w-5 h-5 text-red-600 transition-transform ${
              shouldTrigger ? 'rotate-180' : ''
            }`}
            style={{ transform: `rotate(${pullProgress * 180}deg)` }}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {children}
      </div>

      {/* Pull hint text */}
      {isPulling && !isRefreshing && (
        <div
          className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm z-50"
          style={{ opacity: pullProgress }}
        >
          {shouldTrigger ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}
    </div>
  );
};

// Swipe Gesture Hook
export const useSwipeGesture = (onSwipeLeft, onSwipeRight, threshold = 50) => {
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setCurrentX(touch.clientX);
    setIsSwiping(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isSwiping) return;
    
    const touch = e.touches[0];
    setCurrentX(touch.clientX);
    
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);
    
    // Only handle horizontal swipes
    if (deltaX > deltaY) {
      e.preventDefault();
    }
  }, [isSwiping, startX, startY]);

  const handleTouchEnd = useCallback(() => {
    if (!isSwiping) return;
    
    const deltaX = currentX - startX;
    const absDeltaX = Math.abs(deltaX);
    
    if (absDeltaX >= threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    setIsSwiping(false);
    setStartX(0);
    setCurrentX(0);
  }, [isSwiping, currentX, startX, threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    isSwiping,
    swipeProgress: isSwiping ? Math.abs(currentX - startX) / threshold : 0,
    swipeDirection: currentX > startX ? 'right' : 'left'
  };
};

// Swipeable Item Component
export const SwipeableItem = ({ 
  children, 
  onSwipeLeft, 
  onSwipeRight, 
  leftAction, 
  rightAction,
  threshold = 80 
}) => {
  const { elementRef, isSwiping, swipeProgress, swipeDirection } = useSwipeGesture(
    onSwipeLeft, 
    onSwipeRight, 
    threshold
  );

  const [isRevealed, setIsRevealed] = useState(false);
  const [revealDirection, setRevealDirection] = useState(null);

  const handleSwipeComplete = useCallback((direction) => {
    setIsRevealed(true);
    setRevealDirection(direction);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      setIsRevealed(false);
      setRevealDirection(null);
    }, 3000);
  }, []);

  const translateX = isSwiping 
    ? (swipeDirection === 'right' ? 1 : -1) * Math.min(swipeProgress * threshold, threshold)
    : isRevealed && revealDirection
      ? (revealDirection === 'right' ? threshold : -threshold)
      : 0;

  return (
    <div ref={elementRef} className="swipeable relative overflow-hidden">
      {/* Left Action */}
      {leftAction && (
        <div 
          className="swipe-actions left-0"
          style={{ 
            opacity: swipeDirection === 'right' ? swipeProgress : 0,
            transform: `translateX(${Math.min(translateX - 100, 0)}px)`
          }}
        >
          {leftAction}
        </div>
      )}

      {/* Right Action */}
      {rightAction && (
        <div 
          className="swipe-actions right-0"
          style={{ 
            opacity: swipeDirection === 'left' ? swipeProgress : 0,
            transform: `translateX(${Math.max(translateX + 100, 0)}px)`
          }}
        >
          {rightAction}
        </div>
      )}

      {/* Main Content */}
      <div
        className="swipe-item"
        style={{ transform: `translateX(${translateX}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

// Pinch Zoom Hook
export const usePinchZoom = (minZoom = 0.5, maxZoom = 3) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const elementRef = useRef(null);
  const lastTouchDistance = useRef(0);
  const lastTouchCenter = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      lastTouchDistance.current = distance;
      lastTouchCenter.current = { x: centerX, y: centerY };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      if (lastTouchDistance.current > 0) {
        const scale = distance / lastTouchDistance.current;
        const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom * scale));
        
        // Calculate pan adjustment based on zoom center
        const panAdjustX = (centerX - lastTouchCenter.current.x) * 0.1;
        const panAdjustY = (centerY - lastTouchCenter.current.y) * 0.1;
        
        setZoom(newZoom);
        setPan(prev => ({
          x: prev.x + panAdjustX,
          y: prev.y + panAdjustY
        }));
      }
      
      lastTouchDistance.current = distance;
      lastTouchCenter.current = { x: centerX, y: centerY };
    }
  }, [zoom, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDistance.current = 0;
  }, []);

  const reset = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    zoom,
    pan,
    setZoom,
    setPan,
    reset
  };
};

// Touch Feedback Component
export const TouchFeedback = ({ children, className = '', ...props }) => {
  const [ripples, setRipples] = useState([]);

  const createRipple = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    const ripple = {
      id: Date.now(),
      x,
      y,
      size: Math.max(rect.width, rect.height) * 2
    };
    
    setRipples(prev => [...prev, ripple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== ripple.id));
    }, 600);
  }, []);

  return (
    <div
      className={`touch-feedback ${className}`}
      onTouchStart={createRipple}
      onMouseDown={createRipple}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute rounded-full bg-current opacity-20 pointer-events-none animate-ping"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};

// Enhanced Haptic Feedback Utility with iOS support and Gaming Patterns
export const hapticFeedback = {
  // Basic feedback levels
  light: () => {
    // iOS Haptic Engine support
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const impact = new TouchEvent('touchstart', { force: 0.5 });
      } catch (e) {}
    }
    // Standard vibration fallback
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  medium: () => {
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const impact = new TouchEvent('touchstart', { force: 0.75 });
      } catch (e) {}
    }
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  heavy: () => {
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const impact = new TouchEvent('touchstart', { force: 1.0 });
      } catch (e) {}
    }
    if (navigator.vibrate) {
      navigator.vibrate([30, 10, 30]);
    }
  },
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 10, 10]);
    }
  },
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 20, 50, 20, 50]);
    }
  },
  // VLR.gg style notification feedback
  notification: () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  },
  // Match start/end feedback
  matchStart: () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 500]);
    }
  },
  // Score update feedback
  scoreUpdate: () => {
    if (navigator.vibrate) {
      navigator.vibrate([50, 25, 50]);
    }
  },
  
  // Gaming-specific haptic patterns
  achievement: () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 200]); // Celebration pattern
    }
  },
  levelUp: () => {
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 100, 50, 100, 50, 300]); // Level up fanfare
    }
  },
  streak: () => {
    if (navigator.vibrate) {
      navigator.vibrate([75, 25, 75, 25, 75]); // Streak combo
    }
  },
  reaction: () => {
    if (navigator.vibrate) {
      navigator.vibrate([25]); // Quick tap for reactions
    }
  },
  unlock: () => {
    if (navigator.vibrate) {
      navigator.vibrate([150, 75, 150]); // Unlock sound pattern
    }
  },
  cardFlip: () => {
    if (navigator.vibrate) {
      navigator.vibrate([40, 20, 60]); // Card flip effect
    }
  },
  swipeAction: () => {
    if (navigator.vibrate) {
      navigator.vibrate([30]); // Swipe confirmation
    }
  },
  powerUser: () => {
    if (navigator.vibrate) {
      navigator.vibrate([25, 10, 25, 10, 25, 10, 100]); // Power user combo
    }
  },
  challenge: () => {
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 50, 25, 50, 25, 200]); // Challenge accepted
    }
  }
};

// Long Press Hook
export const useLongPress = (callback, delay = 500) => {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef(null);

  const start = useCallback((e) => {
    setIsPressed(true);
    timeoutRef.current = setTimeout(() => {
      callback(e);
      hapticFeedback.medium();
    }, delay);
  }, [callback, delay]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPressed(false);
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    isPressed
  };
};

// 3D Touch/Force Touch Hook
export const useForceTouch = (onForce, threshold = 0.5) => {
  const [force, setForce] = useState(0);
  const [isForceActive, setIsForceActive] = useState(false);
  const elementRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (e.touches && e.touches[0] && 'force' in e.touches[0]) {
      setForce(e.touches[0].force);
      
      if (e.touches[0].force >= threshold && !isForceActive) {
        setIsForceActive(true);
        onForce?.(e.touches[0].force);
        hapticFeedback.heavy();
      }
    }
  }, [threshold, isForceActive, onForce]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches && e.touches[0] && 'force' in e.touches[0]) {
      setForce(e.touches[0].force);
      
      if (e.touches[0].force >= threshold && !isForceActive) {
        setIsForceActive(true);
        onForce?.(e.touches[0].force);
        hapticFeedback.heavy();
      } else if (e.touches[0].force < threshold && isForceActive) {
        setIsForceActive(false);
      }
    }
  }, [threshold, isForceActive, onForce]);

  const handleTouchEnd = useCallback(() => {
    setForce(0);
    setIsForceActive(false);
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    force,
    isForceActive,
    supportsForceTouch: 'ontouchstart' in window && TouchEvent.prototype.hasOwnProperty('force')
  };
};

// Device Motion/Shake Detection Hook
export const useShakeGesture = (onShake, sensitivity = 15) => {
  const [isShaking, setIsShaking] = useState(false);
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const shakeTimeout = useRef(null);

  useEffect(() => {
    const handleDeviceMotion = (e) => {
      const acceleration = e.accelerationIncludingGravity;
      if (!acceleration) return;

      const deltaX = Math.abs(acceleration.x - lastAcceleration.current.x);
      const deltaY = Math.abs(acceleration.y - lastAcceleration.current.y);
      const deltaZ = Math.abs(acceleration.z - lastAcceleration.current.z);

      if (deltaX + deltaY + deltaZ > sensitivity) {
        if (!isShaking) {
          setIsShaking(true);
          onShake?.();
          hapticFeedback.medium();
          
          // Clear previous timeout
          if (shakeTimeout.current) {
            clearTimeout(shakeTimeout.current);
          }
          
          // Reset shake state after delay
          shakeTimeout.current = setTimeout(() => {
            setIsShaking(false);
          }, 1000);
        }
      }

      lastAcceleration.current = { x: acceleration.x, y: acceleration.y, z: acceleration.z };
    };

    // Request permission for iOS devices
    const requestPermission = async () => {
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceMotionEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('devicemotion', handleDeviceMotion);
          }
        } catch (error) {
          console.log('Device motion permission denied');
        }
      } else {
        // Non-iOS devices
        window.addEventListener('devicemotion', handleDeviceMotion);
      }
    };

    requestPermission();

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      if (shakeTimeout.current) {
        clearTimeout(shakeTimeout.current);
      }
    };
  }, [onShake, sensitivity, isShaking]);

  return { isShaking };
};

// Device Orientation Hook for Landscape/Portrait Detection
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState({
    alpha: 0, // Z axis
    beta: 0,  // X axis  
    gamma: 0, // Y axis
    absolute: false
  });
  const [screenOrientation, setScreenOrientation] = useState(
    window.screen?.orientation?.angle || window.orientation || 0
  );

  useEffect(() => {
    const handleOrientationChange = (e) => {
      setOrientation({
        alpha: e.alpha || 0,
        beta: e.beta || 0,
        gamma: e.gamma || 0,
        absolute: e.absolute || false
      });
    };

    const handleScreenOrientationChange = () => {
      setScreenOrientation(
        window.screen?.orientation?.angle || window.orientation || 0
      );
    };

    // Request permission for iOS devices
    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientationChange);
          }
        } catch (error) {
          console.log('Device orientation permission denied');
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientationChange);
      }
    };

    requestPermission();
    window.addEventListener('orientationchange', handleScreenOrientationChange);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientationChange);
      window.removeEventListener('orientationchange', handleScreenOrientationChange);
    };
  }, []);

  return {
    ...orientation,
    screenOrientation,
    isPortrait: Math.abs(screenOrientation) !== 90,
    isLandscape: Math.abs(screenOrientation) === 90
  };
};

// Advanced Multi-Touch Gesture Recognition
export const useMultiTouchGestures = (callbacks = {}) => {
  const [touches, setTouches] = useState([]);
  const [gestureState, setGestureState] = useState({
    type: null, // 'pan', 'pinch', 'rotate', 'swipe'
    scale: 1,
    rotation: 0,
    center: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
  });
  const elementRef = useRef(null);
  const initialState = useRef(null);

  const handleTouchStart = useCallback((e) => {
    e.preventDefault();
    const touchList = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));
    
    setTouches(touchList);
    
    if (touchList.length === 1) {
      // Single touch - potential pan or swipe
      setGestureState(prev => ({ ...prev, type: 'pan' }));
      initialState.current = { touches: touchList, timestamp: Date.now() };
    } else if (touchList.length === 2) {
      // Two touches - potential pinch or rotate
      const dx = touchList[1].x - touchList[0].x;
      const dy = touchList[1].y - touchList[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      setGestureState(prev => ({
        ...prev,
        type: 'pinch',
        scale: 1,
        rotation: 0
      }));
      
      initialState.current = {
        touches: touchList,
        distance,
        angle,
        timestamp: Date.now()
      };
    }
    
    callbacks.onGestureStart?.(touchList, gestureState);
  }, [callbacks]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    const touchList = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    }));
    
    setTouches(touchList);
    
    if (touchList.length === 1 && initialState.current) {
      // Pan gesture
      const touch = touchList[0];
      const initialTouch = initialState.current.touches[0];
      const deltaX = touch.x - initialTouch.x;
      const deltaY = touch.y - initialTouch.y;
      const deltaTime = touch.timestamp - initialTouch.timestamp;
      
      const velocity = {
        x: deltaX / Math.max(deltaTime, 1),
        y: deltaY / Math.max(deltaTime, 1)
      };
      
      setGestureState(prev => ({
        ...prev,
        center: { x: touch.x, y: touch.y },
        velocity
      }));
      
      callbacks.onPan?.({ deltaX, deltaY, velocity });
      
    } else if (touchList.length === 2 && initialState.current) {
      // Pinch/rotate gesture
      const dx = touchList[1].x - touchList[0].x;
      const dy = touchList[1].y - touchList[0].y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const scale = distance / initialState.current.distance;
      const rotation = angle - initialState.current.angle;
      const center = {
        x: (touchList[0].x + touchList[1].x) / 2,
        y: (touchList[0].y + touchList[1].y) / 2
      };
      
      setGestureState(prev => ({
        ...prev,
        scale,
        rotation,
        center
      }));
      
      callbacks.onPinch?.({ scale, rotation, center });
    }
    
    callbacks.onGestureMove?.(touchList, gestureState);
  }, [callbacks, gestureState]);

  const handleTouchEnd = useCallback((e) => {
    const remainingTouches = Array.from(e.touches);
    
    // Check for swipe gesture
    if (remainingTouches.length === 0 && initialState.current && gestureState.type === 'pan') {
      const currentTime = Date.now();
      const deltaTime = currentTime - initialState.current.timestamp;
      const touch = touches[0];
      const initialTouch = initialState.current.touches[0];
      
      if (deltaTime < 300) { // Quick gesture
        const deltaX = touch.x - initialTouch.x;
        const deltaY = touch.y - initialTouch.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 50) { // Minimum swipe distance
          const direction = Math.abs(deltaX) > Math.abs(deltaY) 
            ? (deltaX > 0 ? 'right' : 'left')
            : (deltaY > 0 ? 'down' : 'up');
          
          callbacks.onSwipe?.({ direction, distance, velocity: gestureState.velocity });
          hapticFeedback.light();
        }
      }
    }
    
    if (remainingTouches.length === 0) {
      setTouches([]);
      setGestureState({
        type: null,
        scale: 1,
        rotation: 0,
        center: { x: 0, y: 0 },
        velocity: { x: 0, y: 0 }
      });
      initialState.current = null;
    }
    
    callbacks.onGestureEnd?.(remainingTouches, gestureState);
  }, [touches, gestureState, callbacks]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    touches,
    gestureState,
    isGesturing: gestureState.type !== null
  };
};

export default {
  PullToRefresh,
  SwipeableItem,
  TouchFeedback,
  usePullToRefresh,
  useSwipeGesture,
  usePinchZoom,
  useLongPress,
  useForceTouch,
  useShakeGesture,
  useDeviceOrientation,
  useMultiTouchGestures,
  hapticFeedback
};