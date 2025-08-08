import React, { useEffect, useState } from 'react';

/**
 * iPad-specific optimization component that detects iPad models and applies
 * device-specific optimizations for Marvel Rivals tournament platform
 */

const IPadOptimizations = () => {
  const [iPadModel, setIPadModel] = useState(null);
  const [hasNotch, setHasNotch] = useState(false);
  const [supportsPencil, setSupportsPencil] = useState(false);
  const [iPadOSVersion, setIPadOSVersion] = useState(null);

  useEffect(() => {
    detectIPadModel();
    setupIPadOptimizations();
    handleiPadOSFeatures();
  }, []);

  const detectIPadModel = () => {
    const userAgent = navigator.userAgent;
    const screen = window.screen;
    const devicePixelRatio = window.devicePixelRatio;
    
    // iPad detection based on screen dimensions and pixel ratios
    const iPadModels = {
      'iPad Pro 12.9" (6th gen)': {
        width: 1024,
        height: 1366,
        pixelRatio: 2,
        hasNotch: false,
        pencilSupport: true,
        features: ['M2', 'Center Stage', 'ProMotion', 'Thunderbolt']
      },
      'iPad Pro 11" (4th gen)': {
        width: 834,
        height: 1194,
        pixelRatio: 2,
        hasNotch: false,
        pencilSupport: true,
        features: ['M2', 'Center Stage', 'ProMotion', 'Thunderbolt']
      },
      'iPad Air (5th gen)': {
        width: 820,
        height: 1180,
        pixelRatio: 2,
        hasNotch: false,
        pencilSupport: true,
        features: ['M1', 'Center Stage', 'USB-C']
      },
      'iPad (10th gen)': {
        width: 820,
        height: 1180,
        pixelRatio: 2,
        hasNotch: false,
        pencilSupport: true,
        features: ['A14', 'Center Stage', 'USB-C']
      },
      'iPad mini (6th gen)': {
        width: 744,
        height: 1133,
        pixelRatio: 2,
        hasNotch: false,
        pencilSupport: true,
        features: ['A15', 'Center Stage', 'USB-C']
      }
    };

    // Check if it's actually an iPad
    if (!/iPad/.test(userAgent) && !/Macintosh/.test(userAgent)) {
      return;
    }

    // For iPad running iOS 13+ (shows as Mac in user agent)
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (!isTouchDevice && /Macintosh/.test(userAgent)) {
      return; // Actual Mac
    }

    // Match screen dimensions to iPad model
    Object.entries(iPadModels).forEach(([model, specs]) => {
      const currentWidth = Math.min(screen.width, screen.height);
      const currentHeight = Math.max(screen.width, screen.height);
      
      if (
        (currentWidth === specs.width && currentHeight === specs.height) ||
        (Math.abs(currentWidth - specs.width) <= 10 && Math.abs(currentHeight - specs.height) <= 10)
      ) {
        setIPadModel({
          name: model,
          ...specs
        });
        setHasNotch(specs.hasNotch);
        setSupportsPencil(specs.pencilSupport);
      }
    });

    // Fallback detection
    if (!iPadModel) {
      setIPadModel({
        name: 'iPad (Generic)',
        width: screen.width,
        height: screen.height,
        pixelRatio: devicePixelRatio,
        hasNotch: false,
        pencilSupport: true,
        features: ['Generic iPad']
      });
    }

    // Detect iPadOS version
    const match = userAgent.match(/OS ([\d_]+)/);
    if (match) {
      setIPadOSVersion(match[1].replace(/_/g, '.'));
    }
  };

  const setupIPadOptimizations = () => {
    if (!iPadModel) return;

    // Apply iPad-specific CSS custom properties
    document.documentElement.style.setProperty('--ipad-safe-top', hasNotch ? '44px' : '20px');
    document.documentElement.style.setProperty('--ipad-safe-bottom', hasNotch ? '34px' : '0px');
    document.documentElement.style.setProperty('--ipad-pixel-ratio', iPadModel.pixelRatio);
    
    // Optimize for different iPad sizes
    if (iPadModel.name.includes('12.9')) {
      document.documentElement.style.setProperty('--ipad-layout', 'large');
      document.documentElement.style.setProperty('--tournament-columns', '4');
      document.documentElement.style.setProperty('--bracket-scale', '1.2');
    } else if (iPadModel.name.includes('11') || iPadModel.name.includes('Air')) {
      document.documentElement.style.setProperty('--ipad-layout', 'medium');
      document.documentElement.style.setProperty('--tournament-columns', '3');
      document.documentElement.style.setProperty('--bracket-scale', '1.0');
    } else if (iPadModel.name.includes('mini')) {
      document.documentElement.style.setProperty('--ipad-layout', 'compact');
      document.documentElement.style.setProperty('--tournament-columns', '2');
      document.documentElement.style.setProperty('--bracket-scale', '0.9');
    } else {
      document.documentElement.style.setProperty('--ipad-layout', 'standard');
      document.documentElement.style.setProperty('--tournament-columns', '3');
      document.documentElement.style.setProperty('--bracket-scale', '1.0');
    }

    // Add iPad-specific body class
    document.body.classList.add('ipad-optimized');
    document.body.classList.add(`ipad-${iPadModel.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`);
    
    if (supportsPencil) {
      document.body.classList.add('apple-pencil-support');
    }
  };

  const handleiPadOSFeatures = () => {
    // Handle iPad-specific features
    
    // Multitasking support detection
    if (window.screen && window.screen.width < window.screen.availWidth) {
      document.body.classList.add('ipad-multitasking');
    }

    // Stage Manager detection (iPadOS 16+)
    if (iPadOSVersion && parseFloat(iPadOSVersion) >= 16) {
      document.body.classList.add('stage-manager-capable');
    }

    // Hover support (iPad with trackpad/mouse)
    const hasHover = window.matchMedia('(hover: hover)').matches;
    if (hasHover) {
      document.body.classList.add('ipad-hover-support');
    }

    // Handle orientation changes
    const handleOrientationChange = () => {
      setTimeout(() => {
        const isLandscape = window.innerWidth > window.innerHeight;
        document.body.classList.toggle('ipad-landscape', isLandscape);
        document.body.classList.toggle('ipad-portrait', !isLandscape);
        
        // Trigger custom event for components to react
        window.dispatchEvent(new CustomEvent('iPadOrientationChange', {
          detail: { isLandscape, model: iPadModel }
        }));
      }, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);
    
    // Initial orientation setup
    handleOrientationChange();

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  };

  // iPad-specific gesture handlers
  const setupiPadGestures = () => {
    if (!iPadModel) return;

    // Enhanced pinch-to-zoom for tournament brackets
    let initialDistance = 0;
    let initialScale = 1;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        
        const scale = (currentDistance / initialDistance) * initialScale;
        
        // Dispatch custom pinch event
        window.dispatchEvent(new CustomEvent('iPadPinchZoom', {
          detail: { scale, centerX: (touch1.clientX + touch2.clientX) / 2, centerY: (touch1.clientY + touch2.clientY) / 2 }
        }));
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        initialDistance = 0;
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  };

  useEffect(() => {
    const cleanup = setupiPadGestures();
    return cleanup;
  }, [iPadModel]);

  return (
    <>
      {/* iPad-specific CSS */}
      <style jsx global>{`
        /* iPad Pro 12.9" Optimizations */
        .ipad-ipad-pro-12-9--6th-gen- {
          --tablet-content-max-width: 1200px;
          --bracket-node-width: 320px;
          --match-card-height: 140px;
          --nav-sidebar-width: 320px;
        }

        .ipad-ipad-pro-12-9--6th-gen- .tournament-grid {
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        .ipad-ipad-pro-12-9--6th-gen- .bracket-visualization {
          zoom: 1.2;
        }

        /* iPad Pro 11" / iPad Air Optimizations */
        .ipad-ipad-pro-11--4th-gen-,
        .ipad-ipad-air--5th-gen- {
          --tablet-content-max-width: 1000px;
          --bracket-node-width: 280px;
          --match-card-height: 120px;
          --nav-sidebar-width: 280px;
        }

        .ipad-ipad-pro-11--4th-gen- .tournament-grid,
        .ipad-ipad-air--5th-gen- .tournament-grid {
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        /* iPad mini Optimizations */
        .ipad-ipad-mini--6th-gen- {
          --tablet-content-max-width: 800px;
          --bracket-node-width: 240px;
          --match-card-height: 100px;
          --nav-sidebar-width: 240px;
        }

        .ipad-ipad-mini--6th-gen- .tournament-grid {
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .ipad-ipad-mini--6th-gen- .bracket-visualization {
          zoom: 0.9;
        }

        /* Apple Pencil Support */
        .apple-pencil-support .bracket-match-card {
          cursor: crosshair;
        }

        .apple-pencil-support .annotation-mode {
          display: block;
        }

        /* Multitasking Layout Adjustments */
        .ipad-multitasking {
          --nav-sidebar-width: 60px;
        }

        .ipad-multitasking .tablet-nav-sidebar {
          width: 60px;
        }

        .ipad-multitasking .tablet-nav-sidebar .nav-text {
          display: none;
        }

        /* Stage Manager Support */
        .stage-manager-capable .tournament-window {
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        /* Hover Support Enhancements */
        .ipad-hover-support .match-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
        }

        .ipad-hover-support .nav-item:hover {
          background: rgba(59, 130, 246, 0.1);
        }

        /* Landscape Optimizations */
        .ipad-landscape .tablet-layout {
          grid-template-columns: 300px 1fr 250px;
        }

        .ipad-landscape .bracket-container {
          height: calc(100vh - 120px);
        }

        .ipad-landscape .live-scoring {
          min-height: 400px;
        }

        /* Portrait Optimizations */
        .ipad-portrait .tablet-layout {
          grid-template-columns: 1fr;
          grid-template-rows: auto 1fr;
        }

        .ipad-portrait .nav-sidebar {
          position: fixed;
          top: 0;
          left: -280px;
          height: 100vh;
          transition: left 0.3s ease;
          z-index: 1000;
        }

        .ipad-portrait .nav-sidebar.open {
          left: 0;
        }

        /* Safe Area Handling */
        .ipad-optimized {
          padding-top: env(safe-area-inset-top, var(--ipad-safe-top));
          padding-bottom: env(safe-area-inset-bottom, var(--ipad-safe-bottom));
        }

        /* High Refresh Rate Support (ProMotion) */
        @media (min-resolution: 120dpi) {
          .ipad-optimized * {
            transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }

          .bracket-animation,
          .score-update-animation {
            animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          }
        }

        /* Dark Mode iPad Optimizations */
        @media (prefers-color-scheme: dark) {
          .ipad-optimized {
            background: #000000;
          }

          .ipad-optimized .tournament-card {
            background: #1c1c1e;
            border-color: #38383a;
          }

          .ipad-optimized .bracket-node {
            background: #2c2c2e;
            border-color: #48484a;
          }
        }

        /* Accessibility Enhancements for iPad */
        @media (prefers-reduced-motion: reduce) {
          .ipad-optimized * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        @media (prefers-contrast: high) {
          .ipad-optimized .match-card {
            border-width: 2px;
          }

          .ipad-optimized .live-indicator {
            border: 2px solid currentColor;
          }
        }

        /* iPad-specific Focus Indicators */
        .ipad-optimized *:focus-visible {
          outline: 3px solid #007AFF;
          outline-offset: 2px;
          border-radius: 6px;
        }

        /* Split View / Slide Over Adaptations */
        @media (max-width: 678px) {
          .ipad-optimized.ipad-multitasking .tournament-grid {
            grid-template-columns: 1fr;
          }

          .ipad-optimized.ipad-multitasking .bracket-visualization {
            zoom: 0.8;
          }
        }

        @media (max-width: 320px) {
          .ipad-optimized.ipad-multitasking .match-card {
            min-height: 80px;
          }

          .ipad-optimized.ipad-multitasking .team-name {
            font-size: 14px;
          }
        }
      `}</style>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && iPadModel && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono z-50">
          <div>iPad Model: {iPadModel.name}</div>
          <div>Screen: {iPadModel.width}x{iPadModel.height}</div>
          <div>Pixel Ratio: {iPadModel.pixelRatio}</div>
          <div>iPadOS: {iPadOSVersion}</div>
          <div>Pencil: {supportsPencil ? 'Yes' : 'No'}</div>
          <div>Features: {iPadModel.features?.join(', ')}</div>
        </div>
      )}
    </>
  );
};

export default IPadOptimizations;