import React, { useState, useRef, useCallback, useEffect } from 'react';
import { hapticFeedback } from '../mobile/MobileGestures';

// Momentum Scrolling with Physics
export const useMomentumScrolling = (containerRef, options = {}) => {
  const {
    friction = 0.95,
    maxVelocity = 50,
    threshold = 5,
    onScroll = null
  } = options;

  const [isScrolling, setIsScrolling] = useState(false);
  const velocity = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const animationId = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (animationId.current) {
      cancelAnimationFrame(animationId.current);
    }
    
    const touch = e.touches[0];
    lastPosition.current = { x: touch.clientX, y: touch.clientY };
    velocity.current = { x: 0, y: 0 };
    setIsScrolling(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isScrolling) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastPosition.current.x;
    const deltaY = touch.clientY - lastPosition.current.y;
    
    velocity.current = {
      x: Math.max(-maxVelocity, Math.min(maxVelocity, deltaX)),
      y: Math.max(-maxVelocity, Math.min(maxVelocity, deltaY))
    };
    
    lastPosition.current = { x: touch.clientX, y: touch.clientY };
    
    if (onScroll) {
      onScroll({ deltaX, deltaY, velocity: velocity.current });
    }
  }, [isScrolling, maxVelocity, onScroll]);

  const handleTouchEnd = useCallback(() => {
    setIsScrolling(false);
    
    // Continue momentum scrolling
    const animate = () => {
      const { x, y } = velocity.current;
      
      if (Math.abs(x) < threshold && Math.abs(y) < threshold) {
        return;
      }
      
      velocity.current = {
        x: x * friction,
        y: y * friction
      };
      
      if (onScroll) {
        onScroll({
          deltaX: velocity.current.x,
          deltaY: velocity.current.y,
          velocity: velocity.current,
          isMomentum: true
        });
      }
      
      animationId.current = requestAnimationFrame(animate);
    };
    
    if (Math.abs(velocity.current.x) > threshold || Math.abs(velocity.current.y) > threshold) {
      animate();
    }
  }, [friction, threshold, onScroll]);

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
      
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { isScrolling, velocity: velocity.current };
};

// Esports-Specific Gesture Recognizer
export const useEsportsGestures = (callbacks = {}) => {
  const elementRef = useRef(null);
  const [gestureState, setGestureState] = useState({
    type: null,
    data: null
  });

  // Quick Reactions Gesture (Tap patterns)
  const useQuickReactions = () => {
    const tapPattern = useRef([]);
    const tapTimeout = useRef(null);

    const handleTap = useCallback((e) => {
      const touch = e.touches ? e.touches[0] : e;
      const now = Date.now();
      
      tapPattern.current.push(now);
      
      // Clear old taps (older than 1 second)
      tapPattern.current = tapPattern.current.filter(time => now - time < 1000);
      
      // Clear existing timeout
      if (tapTimeout.current) {
        clearTimeout(tapTimeout.current);
      }
      
      // Set timeout to process pattern
      tapTimeout.current = setTimeout(() => {
        const patternLength = tapPattern.current.length;
        
        if (patternLength === 2) {
          // Double tap - Quick like
          callbacks.onQuickLike?.();
          hapticFeedback.reaction();
          setGestureState({ type: 'quick_like', data: { taps: 2 } });
        } else if (patternLength === 3) {
          // Triple tap - Love reaction
          callbacks.onLove?.();
          hapticFeedback.streak();
          setGestureState({ type: 'love', data: { taps: 3 } });
        } else if (patternLength === 4) {
          // Quad tap - Fire reaction
          callbacks.onFire?.();
          hapticFeedback.powerUser();
          setGestureState({ type: 'fire', data: { taps: 4 } });
        } else if (patternLength >= 5) {
          // 5+ taps - Poggers/Epic reaction
          callbacks.onPoggers?.();
          hapticFeedback.achievement();
          setGestureState({ type: 'poggers', data: { taps: patternLength } });
        }
        
        // Reset pattern
        tapPattern.current = [];
      }, 300);
      
    }, [callbacks]);

    return { handleTap };
  };

  // Team Selection Gesture (Circle draw)
  const useTeamSelection = () => {
    const path = useRef([]);
    const startPoint = useRef(null);
    
    const handleSelectionStart = useCallback((e) => {
      const touch = e.touches ? e.touches[0] : e;
      const rect = e.currentTarget.getBoundingClientRect();
      startPoint.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now()
      };
      path.current = [startPoint.current];
    }, []);

    const handleSelectionMove = useCallback((e) => {
      if (!startPoint.current) return;
      
      const touch = e.touches ? e.touches[0] : e;
      const rect = e.currentTarget.getBoundingClientRect();
      const point = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now()
      };
      
      path.current.push(point);
      
      // Check if drawing a circle (for team selection)
      if (path.current.length > 10) {
        const isCircle = detectCircleGesture(path.current);
        if (isCircle) {
          callbacks.onTeamSelect?.(getElementAtCenter(path.current, e.currentTarget));
          hapticFeedback.unlock();
          setGestureState({ type: 'team_select', data: { path: path.current } });
          path.current = [];
          startPoint.current = null;
        }
      }
    }, [callbacks]);

    const handleSelectionEnd = useCallback(() => {
      // Check for other patterns
      if (path.current.length > 3) {
        const pattern = analyzeDrawPattern(path.current);
        if (pattern.type === 'checkmark') {
          callbacks.onConfirm?.();
          hapticFeedback.success();
          setGestureState({ type: 'confirm', data: pattern });
        } else if (pattern.type === 'x') {
          callbacks.onCancel?.();
          hapticFeedback.error();
          setGestureState({ type: 'cancel', data: pattern });
        }
      }
      
      path.current = [];
      startPoint.current = null;
    }, [callbacks]);

    return { 
      handleSelectionStart, 
      handleSelectionMove, 
      handleSelectionEnd,
      currentPath: path.current 
    };
  };

  // Match Prediction Gesture (Swipe with hold)
  const useMatchPrediction = () => {
    const prediction = useRef(null);
    const holdTimer = useRef(null);
    
    const handlePredictionStart = useCallback((e) => {
      const touch = e.touches ? e.touches[0] : e;
      prediction.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        startTime: Date.now()
      };
      
      // Hold timer for confidence level
      holdTimer.current = setTimeout(() => {
        hapticFeedback.medium();
      }, 500);
    }, []);

    const handlePredictionMove = useCallback((e) => {
      if (!prediction.current) return;
      
      const touch = e.touches ? e.touches[0] : e;
      const deltaX = touch.clientX - prediction.current.startX;
      const deltaY = touch.clientY - prediction.current.startY;
      
      // Determine prediction direction
      if (Math.abs(deltaX) > 50) {
        const team = deltaX > 0 ? 'team2' : 'team1';
        const confidence = Math.min(Math.abs(deltaX) / 200, 1);
        
        callbacks.onPredict?.({ team, confidence });
        setGestureState({ 
          type: 'predict', 
          data: { team, confidence, deltaX, deltaY } 
        });
      }
    }, [callbacks]);

    const handlePredictionEnd = useCallback(() => {
      if (holdTimer.current) {
        clearTimeout(holdTimer.current);
      }
      
      if (prediction.current) {
        const holdTime = Date.now() - prediction.current.startTime;
        if (holdTime > 1000) {
          // Long hold = high confidence prediction
          hapticFeedback.challenge();
        }
      }
      
      prediction.current = null;
    }, []);

    return {
      handlePredictionStart,
      handlePredictionMove, 
      handlePredictionEnd
    };
  };

  const { handleTap } = useQuickReactions();
  const { 
    handleSelectionStart, 
    handleSelectionMove, 
    handleSelectionEnd,
    currentPath
  } = useTeamSelection();
  const {
    handlePredictionStart,
    handlePredictionMove,
    handlePredictionEnd
  } = useMatchPrediction();

  return {
    elementRef,
    gestureState,
    handlers: {
      onTouchStart: (e) => {
        handleTap(e);
        handleSelectionStart(e);
        handlePredictionStart(e);
      },
      onTouchMove: (e) => {
        handleSelectionMove(e);
        handlePredictionMove(e);
      },
      onTouchEnd: (e) => {
        handleSelectionEnd(e);
        handlePredictionEnd(e);
      }
    },
    currentPath
  };
};

// Gesture-based Shortcuts for Power Users
export const usePowerUserGestures = (shortcuts = {}) => {
  const elementRef = useRef(null);
  const [activeShortcut, setActiveShortcut] = useState(null);
  
  // Define gesture patterns for shortcuts
  const gesturePatterns = {
    'L_shape': { // Quick navigation to live matches
      pattern: ['down', 'right'],
      action: shortcuts.goToLive || (() => {})
    },
    'circle': { // Refresh/reload
      pattern: 'circle',
      action: shortcuts.refresh || (() => {})
    },
    'zigzag': { // Toggle favorite
      pattern: ['up', 'down', 'up', 'down'],
      action: shortcuts.toggleFavorite || (() => {})
    },
    'triangle': { // Quick share
      pattern: ['up', 'right', 'left'],
      action: shortcuts.share || (() => {})
    },
    'double_tap_hold': { // Context menu
      pattern: 'double_tap_hold',
      action: shortcuts.contextMenu || (() => {})
    }
  };

  const [currentGesture, setCurrentGesture] = useState([]);
  const gestureTimeout = useRef(null);

  const processGesture = useCallback((gesture) => {
    for (const [shortcutName, config] of Object.entries(gesturePatterns)) {
      if (JSON.stringify(config.pattern) === JSON.stringify(gesture) || 
          config.pattern === gesture) {
        setActiveShortcut(shortcutName);
        config.action();
        hapticFeedback.powerUser();
        
        // Clear active state after animation
        setTimeout(() => setActiveShortcut(null), 1000);
        break;
      }
    }
    
    setCurrentGesture([]);
  }, [shortcuts]);

  const addGestureDirection = useCallback((direction) => {
    setCurrentGesture(prev => {
      const newGesture = [...prev, direction];
      
      // Clear timeout
      if (gestureTimeout.current) {
        clearTimeout(gestureTimeout.current);
      }
      
      // Set timeout to process gesture
      gestureTimeout.current = setTimeout(() => {
        processGesture(newGesture);
      }, 500);
      
      return newGesture;
    });
  }, [processGesture]);

  return {
    elementRef,
    activeShortcut,
    currentGesture,
    addGestureDirection,
    gesturePatterns: Object.keys(gesturePatterns)
  };
};

// Helper Functions
const detectCircleGesture = (path) => {
  if (path.length < 10) return false;
  
  const center = {
    x: path.reduce((sum, p) => sum + p.x, 0) / path.length,
    y: path.reduce((sum, p) => sum + p.y, 0) / path.length
  };
  
  const distances = path.map(p => 
    Math.sqrt(Math.pow(p.x - center.x, 2) + Math.pow(p.y - center.y, 2))
  );
  
  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  const variance = distances.reduce((sum, d) => sum + Math.pow(d - avgDistance, 2), 0) / distances.length;
  
  // Low variance indicates a circle
  return variance < avgDistance * 0.3;
};

const getElementAtCenter = (path, container) => {
  const center = {
    x: path.reduce((sum, p) => sum + p.x, 0) / path.length,
    y: path.reduce((sum, p) => sum + p.y, 0) / path.length
  };
  
  return document.elementFromPoint(center.x, center.y);
};

const analyzeDrawPattern = (path) => {
  // Simple pattern recognition
  const start = path[0];
  const end = path[path.length - 1];
  const middle = path[Math.floor(path.length / 2)];
  
  // Check for checkmark (down-right then up-right)
  if (middle.y > start.y && end.y < middle.y && end.x > start.x) {
    return { type: 'checkmark', confidence: 0.8 };
  }
  
  // Check for X pattern (crossing lines)
  if (Math.abs(end.x - start.x) > 50 && Math.abs(end.y - start.y) > 50) {
    return { type: 'x', confidence: 0.7 };
  }
  
  return { type: 'unknown', confidence: 0 };
};

// Touch Event Optimization Hook
export const useOptimizedTouch = (handler, deps = []) => {
  const handlerRef = useRef(handler);
  const rafId = useRef(null);
  const lastCallTime = useRef(0);
  
  // Update handler ref when deps change
  useEffect(() => {
    handlerRef.current = handler;
  }, deps);
  
  const optimizedHandler = useCallback((e) => {
    const now = Date.now();
    
    // Throttle to 60fps
    if (now - lastCallTime.current < 16) return;
    
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      handlerRef.current(e);
      lastCallTime.current = now;
    });
  }, []);
  
  useEffect(() => {
    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);
  
  return optimizedHandler;
};

export default {
  useMomentumScrolling,
  useEsportsGestures,
  usePowerUserGestures,
  useOptimizedTouch
};