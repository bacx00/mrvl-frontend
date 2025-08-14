// Tablet Components Export Index
// Centralized exports for all tablet-optimized components

export { default as TabletBracketVisualization } from './TabletBracketVisualization';
export { default as TabletMatchCard } from './TabletMatchCard';
export { default as TabletNavigation } from './TabletNavigation';
// TabletLiveScoring removed - using UnifiedLiveScoring instead
export { default as IPadOptimizations } from './iPadOptimizations';

// Re-export commonly used tablet utilities
export const TabletComponents = {
  BracketVisualization: require('./TabletBracketVisualization').default,
  MatchCard: require('./TabletMatchCard').default,
  Navigation: require('./TabletNavigation').default,
  // LiveScoring removed - using UnifiedLiveScoring instead
  IPadOptimizations: require('./iPadOptimizations').default,
};

// Tablet detection utilities
export const isTabletDevice = () => {
  const width = window.innerWidth;
  return width >= 768 && width <= 1024;
};

export const isLandscapeTablet = () => {
  return isTabletDevice() && window.innerWidth > window.innerHeight;
};

export const isPortraitTablet = () => {
  return isTabletDevice() && window.innerHeight > window.innerWidth;
};

export const getTabletLayout = () => {
  if (!isTabletDevice()) return 'desktop';
  return isLandscapeTablet() ? 'landscape' : 'portrait';
};

// iPad-specific detection
export const isIPad = () => {
  const userAgent = navigator.userAgent;
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // iOS 13+ iPad detection (shows as Mac in user agent)
  if (/Macintosh/.test(userAgent) && isTouchDevice) {
    return true;
  }
  
  // Traditional iPad detection
  return /iPad/.test(userAgent);
};

export const getIPadModel = () => {
  if (!isIPad()) return null;
  
  const screen = window.screen || {};
  const width = Math.min(screen.width || 0, screen.height || 0);
  const height = Math.max(screen.width || 0, screen.height || 0);
  
  // iPad model detection based on screen resolution
  if (width === 1024 && height === 1366) return 'iPad Pro 12.9"';
  if (width === 834 && height === 1194) return 'iPad Pro 11"';
  if (width === 820 && height === 1180) return 'iPad Air';
  if (width === 768 && height === 1024) return 'iPad (Standard)';
  if (width === 744 && height === 1133) return 'iPad mini';
  
  return 'iPad (Unknown)';
};

// Tablet optimization hooks
export const useTabletOptimizations = () => {
  const { useState, useEffect } = require('react');
  const [isTablet, setIsTablet] = useState(isTabletDevice());
  const [orientation, setOrientation] = useState(getTabletLayout());
  const [iPadModel, setIPadModel] = useState(getIPadModel());
  
  useEffect(() => {
    const handleResize = () => {
      setIsTablet(isTabletDevice());
      setOrientation(getTabletLayout());
    };
    
    const handleOrientationChange = () => {
      setTimeout(() => {
        setOrientation(getTabletLayout());
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);
  
  return {
    isTablet,
    orientation,
    iPadModel,
    isLandscape: orientation === 'landscape',
    isPortrait: orientation === 'portrait',
    isIPad: !!iPadModel
  };
};

// Tablet gesture handling
export const useTabletGestures = (callbacks = {}) => {
  const { useState, useEffect } = require('react');
  const [gestureState, setGestureState] = useState({
    isPinching: false,
    isPanning: false,
    scale: 1,
    panX: 0,
    panY: 0
  });
  
  useEffect(() => {
    let initialDistance = 0;
    let initialScale = 1;
    let lastPanPoint = { x: 0, y: 0 };
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Pinch gesture start
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        setGestureState(prev => ({ ...prev, isPinching: true }));
        
        if (callbacks.onPinchStart) {
          callbacks.onPinchStart({
            center: {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2
            }
          });
        }
      } else if (e.touches.length === 1) {
        // Pan gesture start
        const touch = e.touches[0];
        lastPanPoint = { x: touch.clientX, y: touch.clientY };
        setGestureState(prev => ({ ...prev, isPanning: true }));
        
        if (callbacks.onPanStart) {
          callbacks.onPanStart({ x: touch.clientX, y: touch.clientY });
        }
      }
    };
    
    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && gestureState.isPinching) {
        // Pinch gesture
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        const scale = (currentDistance / initialDistance) * initialScale;
        setGestureState(prev => ({ ...prev, scale }));
        
        if (callbacks.onPinchMove) {
          callbacks.onPinchMove({
            scale,
            center: {
              x: (touch1.clientX + touch2.clientX) / 2,
              y: (touch1.clientY + touch2.clientY) / 2
            }
          });
        }
      } else if (e.touches.length === 1 && gestureState.isPanning) {
        // Pan gesture
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastPanPoint.x;
        const deltaY = touch.clientY - lastPanPoint.y;
        
        setGestureState(prev => ({
          ...prev,
          panX: prev.panX + deltaX,
          panY: prev.panY + deltaY
        }));
        
        lastPanPoint = { x: touch.clientX, y: touch.clientY };
        
        if (callbacks.onPanMove) {
          callbacks.onPanMove({ deltaX, deltaY, x: touch.clientX, y: touch.clientY });
        }
      }
    };
    
    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        setGestureState(prev => ({ ...prev, isPinching: false }));
        initialDistance = 0;
        initialScale = gestureState.scale;
        
        if (callbacks.onPinchEnd) {
          callbacks.onPinchEnd({ scale: gestureState.scale });
        }
      }
      
      if (e.touches.length === 0) {
        setGestureState(prev => ({ ...prev, isPanning: false }));
        
        if (callbacks.onPanEnd) {
          callbacks.onPanEnd({ panX: gestureState.panX, panY: gestureState.panY });
        }
      }
    };
    
    if (isTabletDevice()) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gestureState, callbacks]);
  
  return gestureState;
};

// Export default for easier import
export default {
  TabletBracketVisualization: TabletComponents.BracketVisualization,
  TabletMatchCard: TabletComponents.MatchCard,
  TabletNavigation: TabletComponents.Navigation,
  // TabletLiveScoring removed - using UnifiedLiveScoring instead
  IPadOptimizations: TabletComponents.IPadOptimizations,
  isTabletDevice,
  isLandscapeTablet,
  isPortraitTablet,
  getTabletLayout,
  isIPad,
  getIPadModel,
  useTabletOptimizations,
  useTabletGestures
};