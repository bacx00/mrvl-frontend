import { useState, useEffect } from 'react';

// Hook to detect device type based on viewport width
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isSmallMobile: false,
    isTouchDevice: false,
    isLandscape: false,
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isLandscape = width > height;
      
      setDeviceType({
        isSmallMobile: width < 480,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        isTouchDevice,
        isLandscape,
        width,
        height
      });
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return deviceType;
};