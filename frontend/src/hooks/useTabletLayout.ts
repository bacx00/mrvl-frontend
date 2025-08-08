// src/hooks/useTabletLayout.ts
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TabletLayoutState {
  isTablet: boolean;
  isTabletPortrait: boolean;
  isTabletLandscape: boolean;
  screenWidth: number;
  screenHeight: number;
  orientation: 'portrait' | 'landscape';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  touchSupport: boolean;
  pixelRatio: number;
}

interface UseTabletLayoutOptions {
  tabletBreakpoint?: number;
  desktopBreakpoint?: number;
  debounceMs?: number;
  enableGestures?: boolean;
}

interface GestureState {
  isPinching: boolean;
  pinchScale: number;
  panOffset: { x: number; y: number };
  lastPanDelta: { x: number; y: number };
}

export const useTabletLayout = (options: UseTabletLayoutOptions = {}) => {
  const {
    tabletBreakpoint = 768,
    desktopBreakpoint = 1024,
    debounceMs = 150,
    enableGestures = false
  } = options;

  const [layoutState, setLayoutState] = useState<TabletLayoutState>({
    isTablet: false,
    isTabletPortrait: false,
    isTabletLandscape: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'landscape',
    deviceType: 'mobile',
    touchSupport: false,
    pixelRatio: 1,
  });

  const [gestureState, setGestureState] = useState<GestureState>({
    isPinching: false,
    pinchScale: 1,
    panOffset: { x: 0, y: 0 },
    lastPanDelta: { x: 0, y: 0 },
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const initialPinchDistance = useRef<number>(0);
  const lastTouchCount = useRef<number>(0);

  // Calculate distance between two touch points
  const getTouchDistance = useCallback((touches: TouchList) => {
    if (touches.length < 2) return 0;
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  }, []);

  // Update layout state based on window dimensions
  const updateLayoutState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation = width > height ? 'landscape' : 'portrait';
    const pixelRatio = window.devicePixelRatio || 1;
    const touchSupport = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Determine device type
    let deviceType: 'mobile' | 'tablet' | 'desktop' = 'mobile';
    if (width >= desktopBreakpoint) {
      deviceType = 'desktop';
    } else if (width >= tabletBreakpoint) {
      deviceType = 'tablet';
    }

    const isTablet = deviceType === 'tablet';
    const isTabletPortrait = isTablet && orientation === 'portrait';
    const isTabletLandscape = isTablet && orientation === 'landscape';

    setLayoutState({
      isTablet,
      isTabletPortrait,
      isTabletLandscape,
      screenWidth: width,
      screenHeight: height,
      orientation,
      deviceType,
      touchSupport,
      pixelRatio,
    });
  }, [tabletBreakpoint, desktopBreakpoint]);

  // Debounced resize handler
  const handleResize = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(updateLayoutState, debounceMs);
  }, [updateLayoutState, debounceMs]);

  // Touch gesture handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enableGestures) return;

    const touchCount = e.touches.length;
    lastTouchCount.current = touchCount;

    if (touchCount === 2) {
      // Start pinch gesture
      const distance = getTouchDistance(e.touches);
      initialPinchDistance.current = distance;
      setGestureState(prev => ({
        ...prev,
        isPinching: true,
        pinchScale: 1,
      }));
    } else if (touchCount === 1) {
      // Start pan gesture
      const touch = e.touches[0];
      setGestureState(prev => ({
        ...prev,
        lastPanDelta: { x: touch.clientX, y: touch.clientY },
      }));
    }
  }, [enableGestures, getTouchDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enableGestures) return;

    const touchCount = e.touches.length;

    if (touchCount === 2 && gestureState.isPinching) {
      // Handle pinch gesture
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const scale = distance / initialPinchDistance.current;
      
      setGestureState(prev => ({
        ...prev,
        pinchScale: Math.max(0.5, Math.min(3, scale)),
      }));
    } else if (touchCount === 1 && !gestureState.isPinching) {
      // Handle pan gesture
      const touch = e.touches[0];
      const deltaX = touch.clientX - gestureState.lastPanDelta.x;
      const deltaY = touch.clientY - gestureState.lastPanDelta.y;
      
      setGestureState(prev => ({
        ...prev,
        panOffset: {
          x: prev.panOffset.x + deltaX,
          y: prev.panOffset.y + deltaY,
        },
        lastPanDelta: { x: touch.clientX, y: touch.clientY },
      }));
    }
  }, [enableGestures, getTouchDistance, gestureState.isPinching, gestureState.lastPanDelta]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enableGestures) return;

    const touchCount = e.touches.length;

    if (touchCount < 2) {
      setGestureState(prev => ({
        ...prev,
        isPinching: false,
      }));
    }
  }, [enableGestures]);

  // Reset gestures
  const resetGestures = useCallback(() => {
    setGestureState({
      isPinching: false,
      pinchScale: 1,
      panOffset: { x: 0, y: 0 },
      lastPanDelta: { x: 0, y: 0 },
    });
  }, []);

  // Utility functions
  const getTabletLayoutClasses = useCallback(() => {
    const classes = [];
    
    if (layoutState.isTablet) classes.push('tablet-layout');
    if (layoutState.isTabletPortrait) classes.push('tablet-portrait');
    if (layoutState.isTabletLandscape) classes.push('tablet-landscape');
    if (layoutState.touchSupport) classes.push('touch-enabled');
    if (layoutState.pixelRatio > 1) classes.push('high-dpi');
    
    return classes.join(' ');
  }, [layoutState]);

  const getOptimalColumns = useCallback((minColumnWidth: number = 320) => {
    const availableWidth = layoutState.screenWidth - 40; // Account for padding
    return Math.max(1, Math.floor(availableWidth / minColumnWidth));
  }, [layoutState.screenWidth]);

  const shouldUseSplitLayout = useCallback(() => {
    return layoutState.isTabletLandscape && layoutState.screenWidth >= 900;
  }, [layoutState.isTabletLandscape, layoutState.screenWidth]);

  const getPreferredViewMode = useCallback(() => {
    if (layoutState.isTabletLandscape) return 'horizontal-split';
    if (layoutState.isTabletPortrait) return 'vertical-stack';
    return 'single-column';
  }, [layoutState.isTabletLandscape, layoutState.isTabletPortrait]);

  // Setup event listeners
  useEffect(() => {
    updateLayoutState();
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    if (enableGestures) {
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
      if (enableGestures) {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      }
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [
    updateLayoutState,
    handleResize,
    enableGestures,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  ]);

  return {
    // Layout state
    ...layoutState,
    
    // Gesture state
    gestures: gestureState,
    
    // Utility functions
    getTabletLayoutClasses,
    getOptimalColumns,
    shouldUseSplitLayout,
    getPreferredViewMode,
    resetGestures,
    
    // Computed values
    isOptimalForMultiColumn: layoutState.isTablet && layoutState.screenWidth >= 800,
    shouldShowSidebar: layoutState.isTabletLandscape,
    recommendedTouchTargetSize: layoutState.isTablet ? 48 : 44,
  };
};

export default useTabletLayout;