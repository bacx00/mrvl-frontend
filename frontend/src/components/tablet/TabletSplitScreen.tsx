// src/components/tablet/TabletSplitScreen.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Match, Tournament } from '@/lib/types';

interface TabletSplitScreenProps {
  primaryContent: React.ReactNode;
  secondaryContent: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  resizable?: boolean;
  defaultSplit?: number; // 0-100 percentage
  minSize?: number; // Minimum size in pixels
  className?: string;
  onSplitChange?: (split: number) => void;
}

const TabletSplitScreen: React.FC<TabletSplitScreenProps> = ({
  primaryContent,
  secondaryContent,
  orientation = 'horizontal',
  resizable = true,
  defaultSplit = 50,
  minSize = 200,
  className = '',
  onSplitChange
}) => {
  const [splitPercent, setSplitPercent] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.cursor = orientation === 'horizontal' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
  };

  // Handle resize move
  const handleResizeMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;

    const container = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    let newSplit: number;

    if (orientation === 'horizontal') {
      const x = clientX - container.left;
      newSplit = (x / container.width) * 100;
    } else {
      const y = clientY - container.top;
      newSplit = (y / container.height) * 100;
    }

    // Respect minimum sizes
    const containerSize = orientation === 'horizontal' ? container.width : container.height;
    const minPercent = (minSize / containerSize) * 100;
    const maxPercent = 100 - minPercent;

    newSplit = Math.max(minPercent, Math.min(maxPercent, newSplit));

    setSplitPercent(newSplit);
    onSplitChange?.(newSplit);
  };

  // Handle resize end
  const handleResizeEnd = () => {
    setIsDragging(false);
    document.body.style.cursor = 'auto';
    document.body.style.userSelect = 'auto';
  };

  // Setup global event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.addEventListener('touchmove', handleResizeMove, { passive: false });
      document.addEventListener('touchend', handleResizeEnd);

      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.removeEventListener('touchmove', handleResizeMove);
        document.removeEventListener('touchend', handleResizeEnd);
      };
    }
  }, [isDragging]);

  // Collapse/expand functions
  const toggleCollapse = () => {
    if (isCollapsed) {
      setSplitPercent(defaultSplit);
      setIsCollapsed(false);
    } else {
      setSplitPercent(0);
      setIsCollapsed(true);
    }
  };

  const swapPanes = () => {
    setSplitPercent(100 - splitPercent);
  };

  const resetSplit = () => {
    setSplitPercent(defaultSplit);
    setIsCollapsed(false);
  };

  const containerClasses = orientation === 'horizontal' 
    ? 'tablet-split-horizontal'
    : 'tablet-split-vertical';

  const dividerClasses = orientation === 'horizontal'
    ? 'tablet-split-divider-horizontal'
    : 'tablet-split-divider-vertical';

  return (
    <div 
      ref={containerRef}
      className={`tablet-split-container ${containerClasses} ${className}`}
    >
      
      {/* Primary Panel */}
      <div 
        className="tablet-split-primary"
        style={{
          [orientation === 'horizontal' ? 'width' : 'height']: isCollapsed ? '100%' : `${splitPercent}%`
        }}
      >
        <div className="tablet-split-content">
          {primaryContent}
        </div>
      </div>

      {/* Resizable Divider */}
      {!isCollapsed && resizable && (
        <div
          ref={dividerRef}
          className={`tablet-split-divider ${dividerClasses} ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleResizeStart}
          onTouchStart={handleResizeStart}
        >
          {/* Divider Controls */}
          <div className="tablet-split-controls">
            <button
              className="tablet-split-control-button"
              onClick={toggleCollapse}
              title="Collapse Secondary Panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={orientation === 'horizontal' 
                    ? "M13 5l7 7-7 7M6 12h12" 
                    : "M5 13l7-7 7 7M12 18V6"
                  } 
                />
              </svg>
            </button>
            
            <button
              className="tablet-split-control-button"
              onClick={swapPanes}
              title="Swap Panels"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </button>

            <button
              className="tablet-split-control-button"
              onClick={resetSplit}
              title="Reset Split"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Resize Handle */}
          <div className="tablet-split-handle">
            <div className="tablet-split-handle-indicator">
              {orientation === 'horizontal' ? (
                <div className="flex flex-col space-y-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              ) : (
                <div className="flex space-x-1">
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Secondary Panel */}
      {!isCollapsed && (
        <div 
          className="tablet-split-secondary"
          style={{
            [orientation === 'horizontal' ? 'width' : 'height']: `${100 - splitPercent}%`
          }}
        >
          <div className="tablet-split-content">
            {secondaryContent}
          </div>
        </div>
      )}

      {/* Collapsed Panel Toggle */}
      {isCollapsed && (
        <div className="tablet-split-collapsed-toggle">
          <button
            onClick={toggleCollapse}
            className="tablet-split-expand-button"
            title="Show Secondary Panel"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={orientation === 'horizontal' 
                  ? "M9 5l7 7-7 7" 
                  : "M19 9l-7 7-7-7"
                } 
              />
            </svg>
          </button>
        </div>
      )}

      {/* Split Screen Styles */}
      <style jsx>{`
        .tablet-split-container {
          display: flex;
          height: 100%;
          width: 100%;
          background: var(--bg-primary);
          position: relative;
        }

        .tablet-split-horizontal {
          flex-direction: row;
        }

        .tablet-split-vertical {
          flex-direction: column;
        }

        .tablet-split-primary,
        .tablet-split-secondary {
          position: relative;
          overflow: hidden;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
        }

        .tablet-split-primary {
          border-radius: 8px 0 0 8px;
        }

        .tablet-split-secondary {
          border-radius: 0 8px 8px 0;
        }

        .tablet-split-vertical .tablet-split-primary {
          border-radius: 8px 8px 0 0;
        }

        .tablet-split-vertical .tablet-split-secondary {
          border-radius: 0 0 8px 8px;
        }

        .tablet-split-content {
          height: 100%;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tablet-split-divider {
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
          z-index: 10;
        }

        .tablet-split-divider-horizontal {
          width: 12px;
          cursor: col-resize;
          flex-direction: column;
        }

        .tablet-split-divider-vertical {
          height: 12px;
          cursor: row-resize;
          flex-direction: row;
        }

        .tablet-split-divider:hover {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        .tablet-split-divider.dragging {
          background: var(--color-primary);
          border-color: var(--color-primary);
        }

        .tablet-split-controls {
          display: flex;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .tablet-split-divider:hover .tablet-split-controls {
          opacity: 1;
        }

        .tablet-split-control-button {
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 3px;
          padding: 2px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tablet-split-control-button:hover {
          background: white;
          transform: scale(1.1);
        }

        .tablet-split-handle {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .tablet-split-handle-indicator {
          opacity: 0.5;
          transition: opacity 0.2s ease;
        }

        .tablet-split-divider:hover .tablet-split-handle-indicator {
          opacity: 0.8;
        }

        .tablet-split-collapsed-toggle {
          position: absolute;
          top: 50%;
          right: -20px;
          transform: translateY(-50%);
          z-index: 20;
        }

        .tablet-split-vertical .tablet-split-collapsed-toggle {
          top: auto;
          bottom: -20px;
          right: 50%;
          transform: translateX(50%);
        }

        .tablet-split-expand-button {
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }

        .tablet-split-expand-button:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        @media (max-width: 767px) {
          .tablet-split-container {
            flex-direction: column;
          }
          
          .tablet-split-primary,
          .tablet-split-secondary {
            border-radius: 8px;
            margin-bottom: 8px;
          }
          
          .tablet-split-divider {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default TabletSplitScreen;