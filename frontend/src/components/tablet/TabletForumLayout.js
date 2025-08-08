import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Menu, X, ChevronLeft, ChevronRight, RotateCcw, Maximize2, 
  Minimize2, Settings, Grid, Sidebar, Layout, Split,
  PanelLeft, PanelRight, Eye, EyeOff, Filter, Search
} from 'lucide-react';

const TabletForumLayout = ({
  children,
  leftPanel,
  rightPanel,
  mainContent,
  orientation = 'landscape', // 'landscape' or 'portrait'
  defaultLayout = 'three-column', // 'single', 'two-column', 'three-column', 'split-view'
  onLayoutChange,
  showLayoutControls = true,
  className = ''
}) => {
  const [currentLayout, setCurrentLayout] = useState(defaultLayout);
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(280);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(null);
  const [dragStart, setDragStart] = useState(null);
  
  const containerRef = useRef(null);
  const leftResizerRef = useRef(null);
  const rightResizerRef = useRef(null);

  // Layout configurations
  const layouts = {
    'single': {
      name: 'Single Column',
      icon: Layout,
      columns: 'grid-cols-1',
      areas: '"main"',
      showLeft: false,
      showRight: false
    },
    'two-column': {
      name: 'Two Column',
      icon: Split,
      columns: 'grid-cols-[1fr_1fr]',
      areas: '"main sidebar"',
      showLeft: false,
      showRight: true
    },
    'three-column': {
      name: 'Three Column',
      icon: Grid,
      columns: `grid-cols-[${leftPanelWidth}px_1fr_${rightPanelWidth}px]`,
      areas: '"sidebar main auxiliary"',
      showLeft: true,
      showRight: true
    },
    'split-view': {
      name: 'Split View',
      icon: PanelLeft,
      columns: `grid-cols-[${leftPanelWidth}px_1fr]`,
      areas: '"sidebar main"',
      showLeft: true,
      showRight: false
    }
  };

  // Handle orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      // Auto-adjust layout based on orientation and screen size
      if (window.innerWidth < 900) {
        setCurrentLayout('single');
      } else if (window.innerWidth < 1200) {
        setCurrentLayout('two-column');
      } else {
        setCurrentLayout('three-column');
      }
    };

    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout) => {
    setCurrentLayout(newLayout);
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  }, [onLayoutChange]);

  // Resize handlers
  const handleMouseDown = useCallback((e, panel) => {
    e.preventDefault();
    setIsResizing(panel);
    setDragStart({
      x: e.clientX,
      leftWidth: leftPanelWidth,
      rightWidth: rightPanelWidth
    });
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [leftPanelWidth, rightPanelWidth]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !dragStart) return;

    const deltaX = e.clientX - dragStart.x;
    
    if (isResizing === 'left') {
      const newWidth = Math.max(200, Math.min(500, dragStart.leftWidth + deltaX));
      setLeftPanelWidth(newWidth);
    } else if (isResizing === 'right') {
      const newWidth = Math.max(200, Math.min(400, dragStart.rightWidth - deltaX));
      setRightPanelWidth(newWidth);
    }
  }, [isResizing, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
    setDragStart(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Touch handlers for mobile resizing
  const handleTouchStart = useCallback((e, panel) => {
    e.preventDefault();
    const touch = e.touches[0];
    setIsResizing(panel);
    setDragStart({
      x: touch.clientX,
      leftWidth: leftPanelWidth,
      rightWidth: rightPanelWidth
    });
  }, [leftPanelWidth, rightPanelWidth]);

  const handleTouchMove = useCallback((e) => {
    if (!isResizing || !dragStart) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    
    if (isResizing === 'left') {
      const newWidth = Math.max(200, Math.min(500, dragStart.leftWidth + deltaX));
      setLeftPanelWidth(newWidth);
    } else if (isResizing === 'right') {
      const newWidth = Math.max(200, Math.min(400, dragStart.rightWidth - deltaX));
      setRightPanelWidth(newWidth);
    }
  }, [isResizing, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsResizing(null);
    setDragStart(null);
  }, []);

  const currentLayoutConfig = layouts[currentLayout];

  // Panel toggle handlers
  const toggleLeftPanel = useCallback(() => {
    setLeftPanelCollapsed(!leftPanelCollapsed);
  }, [leftPanelCollapsed]);

  const toggleRightPanel = useCallback(() => {
    setRightPanelCollapsed(!rightPanelCollapsed);
  }, [rightPanelCollapsed]);

  // Layout Controls Component
  const LayoutControls = () => (
    <div className="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 tablet-controls-shadow">
      <div className="flex items-center space-x-1">
        {Object.entries(layouts).map(([key, layout]) => {
          const IconComponent = layout.icon;
          return (
            <button
              key={key}
              onClick={() => handleLayoutChange(key)}
              className={`p-2 rounded-lg transition-all duration-200 tablet-touch-target ${
                currentLayout === key
                  ? 'bg-red-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              title={layout.name}
            >
              <IconComponent className="w-4 h-4" />
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

      {/* Panel toggles */}
      {currentLayoutConfig.showLeft && (
        <button
          onClick={toggleLeftPanel}
          className={`p-2 rounded-lg transition-all duration-200 tablet-touch-target ${
            !leftPanelCollapsed
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={leftPanelCollapsed ? 'Show left panel' : 'Hide left panel'}
        >
          <PanelLeft className="w-4 h-4" />
        </button>
      )}

      {currentLayoutConfig.showRight && (
        <button
          onClick={toggleRightPanel}
          className={`p-2 rounded-lg transition-all duration-200 tablet-touch-target ${
            !rightPanelCollapsed
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          title={rightPanelCollapsed ? 'Show right panel' : 'Hide right panel'}
        >
          <PanelRight className="w-4 h-4" />
        </button>
      )}

      <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
        {currentLayoutConfig.name}
      </div>
    </div>
  );

  // Resizer Component
  const Resizer = ({ direction, onMouseDown, onTouchStart }) => (
    <div
      className={`tablet-resizer tablet-resizer-${direction} ${
        isResizing === direction ? 'tablet-resizer-active' : ''
      }`}
      onMouseDown={(e) => onMouseDown(e, direction)}
      onTouchStart={(e) => onTouchStart(e, direction)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="tablet-resizer-handle" />
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`tablet-forum-layout ${className} ${
        orientation === 'landscape' ? 'tablet-layout-landscape' : 'tablet-layout-portrait'
      }`}
    >
      {/* Layout Controls */}
      {showLayoutControls && <LayoutControls />}

      {/* Main Layout Container */}
      <div 
        className="tablet-layout-container"
        style={{
          display: 'grid',
          gridTemplateColumns: currentLayout === 'three-column' 
            ? `${leftPanelCollapsed ? '60px' : leftPanelWidth + 'px'} 1fr ${rightPanelCollapsed ? '60px' : rightPanelWidth + 'px'}`
            : currentLayout === 'split-view'
            ? `${leftPanelCollapsed ? '60px' : leftPanelWidth + 'px'} 1fr`
            : currentLayout === 'two-column'
            ? '1fr 1fr'
            : '1fr',
          height: showLayoutControls ? 'calc(100vh - 64px)' : '100vh',
          overflow: 'hidden'
        }}
      >
        {/* Left Panel */}
        {currentLayoutConfig.showLeft && (
          <>
            <div 
              className={`tablet-panel tablet-panel-left ${
                leftPanelCollapsed ? 'tablet-panel-collapsed' : ''
              }`}
            >
              <div className="tablet-panel-header">
                <h2 className="tablet-panel-title">
                  {leftPanelCollapsed ? null : 'Categories'}
                </h2>
                <button
                  onClick={toggleLeftPanel}
                  className="tablet-panel-toggle tablet-touch-target"
                >
                  {leftPanelCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
              </div>
              <div className="tablet-panel-content">
                {leftPanelCollapsed ? (
                  <div className="flex flex-col items-center space-y-3 py-4">
                    <Filter className="w-6 h-6 text-gray-400" />
                    <Search className="w-6 h-6 text-gray-400" />
                  </div>
                ) : (
                  leftPanel
                )}
              </div>
            </div>
            
            {/* Left Resizer */}
            {!leftPanelCollapsed && (
              <Resizer 
                direction="left" 
                onMouseDown={handleMouseDown} 
                onTouchStart={handleTouchStart}
              />
            )}
          </>
        )}

        {/* Main Content */}
        <div className="tablet-panel tablet-main-content tablet-gpu-accelerated">
          {mainContent || children}
        </div>

        {/* Right Panel */}
        {currentLayoutConfig.showRight && (
          <>
            {/* Right Resizer */}
            {!rightPanelCollapsed && (
              <Resizer 
                direction="right" 
                onMouseDown={handleMouseDown} 
                onTouchStart={handleTouchStart}
              />
            )}
            
            <div 
              className={`tablet-panel tablet-panel-right ${
                rightPanelCollapsed ? 'tablet-panel-collapsed' : ''
              }`}
            >
              <div className="tablet-panel-header">
                <button
                  onClick={toggleRightPanel}
                  className="tablet-panel-toggle tablet-touch-target"
                >
                  {rightPanelCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
                <h2 className="tablet-panel-title">
                  {rightPanelCollapsed ? null : 'Activity'}
                </h2>
              </div>
              <div className="tablet-panel-content">
                {rightPanelCollapsed ? (
                  <div className="flex flex-col items-center space-y-3 py-4">
                    <Eye className="w-6 h-6 text-gray-400" />
                    <Settings className="w-6 h-6 text-gray-400" />
                  </div>
                ) : (
                  rightPanel
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .tablet-forum-layout {
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #f8f9fa;
          contain: layout style;
        }

        .dark .tablet-forum-layout {
          background: #111827;
        }

        .tablet-layout-container {
          transition: grid-template-columns 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: grid-template-columns;
          contain: layout style;
        }

        .tablet-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border-right: 1px solid #e5e7eb;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          will-change: width, transform;
          contain: layout style paint;
        }

        .dark .tablet-panel {
          background: #1f2937;
          border-color: #374151;
        }

        .tablet-panel-collapsed {
          min-width: 60px !important;
          max-width: 60px !important;
        }

        .tablet-panel-left {
          border-right: 1px solid #e5e7eb;
        }

        .tablet-panel-right {
          border-left: 1px solid #e5e7eb;
          border-right: none;
        }

        .dark .tablet-panel-left,
        .dark .tablet-panel-right {
          border-color: #374151;
        }

        .tablet-main-content {
          border: none;
          overflow: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tablet-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f8f9fa;
          flex-shrink: 0;
        }

        .dark .tablet-panel-header {
          border-color: #374151;
          background: #111827;
        }

        .tablet-panel-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.875rem;
          white-space: nowrap;
        }

        .dark .tablet-panel-title {
          color: #f9fafb;
        }

        .tablet-panel-toggle {
          padding: 0.5rem;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
          color: #6b7280;
        }

        .tablet-panel-toggle:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        .dark .tablet-panel-toggle {
          color: #9ca3af;
        }

        .dark .tablet-panel-toggle:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #d1d5db;
        }

        .tablet-panel-content {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 1rem;
        }

        .tablet-controls-shadow {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .tablet-touch-target {
          min-height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tablet-resizer {
          position: relative;
          width: 4px;
          background: transparent;
          cursor: col-resize;
          user-select: none;
          touch-action: none;
          z-index: 10;
          transition: background-color 0.2s ease;
        }

        .tablet-resizer:hover,
        .tablet-resizer-active {
          background: #ef4444;
        }

        .tablet-resizer-handle {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 60px;
          background: transparent;
          border-radius: 4px;
        }

        .tablet-resizer:hover .tablet-resizer-handle,
        .tablet-resizer-active .tablet-resizer-handle {
          background: rgba(239, 68, 68, 0.1);
        }

        .tablet-gpu-accelerated {
          transform: translateZ(0);
          -webkit-transform: translateZ(0);
          backface-visibility: hidden;
          perspective: 1000px;
        }

        /* Landscape specific optimizations */
        .tablet-layout-landscape {
          /* Optimized for landscape orientation */
        }

        .tablet-layout-landscape .tablet-panel-left {
          min-width: 280px;
        }

        .tablet-layout-landscape .tablet-panel-right {
          min-width: 240px;
        }

        /* Portrait specific optimizations */
        .tablet-layout-portrait {
          /* Optimized for portrait orientation */
        }

        .tablet-layout-portrait .tablet-panel-left,
        .tablet-layout-portrait .tablet-panel-right {
          min-width: 200px;
        }

        /* Performance optimizations */
        @media (prefers-reduced-motion: reduce) {
          .tablet-layout-container,
          .tablet-panel {
            transition: none !important;
          }
        }

        /* High DPI optimizations */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
          .tablet-forum-layout {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }

        /* Responsive adjustments */
        @media (max-width: 900px) {
          .tablet-panel-left,
          .tablet-panel-right {
            min-width: 250px;
          }
        }

        @media (max-width: 700px) {
          .tablet-layout-container {
            grid-template-columns: 1fr !important;
          }
          
          .tablet-panel-left,
          .tablet-panel-right {
            display: none;
          }
        }

        /* Accessibility improvements */
        .tablet-resizer:focus-visible {
          outline: 2px solid #ef4444;
          outline-offset: 2px;
        }

        /* Dark mode scrollbar */
        .dark .tablet-panel-content::-webkit-scrollbar {
          width: 6px;
        }

        .dark .tablet-panel-content::-webkit-scrollbar-track {
          background: #374151;
        }

        .dark .tablet-panel-content::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 3px;
        }

        .dark .tablet-panel-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default TabletForumLayout;