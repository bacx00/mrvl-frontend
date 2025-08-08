import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, Minimize2, 
  RotateCcw, Split, Layout, Grid, Eye, EyeOff, 
  MessageCircle, Clock, User, Pin, TrendingUp, ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const TabletSplitView = ({
  threads = [],
  selectedThread = null,
  selectedThreadContent = null,
  onThreadSelect,
  onBack,
  splitRatio = 0.4, // Left panel takes 40% of width by default
  minPanelWidth = 300,
  maxPanelWidth = 600,
  orientation = 'horizontal', // 'horizontal' or 'vertical'
  showThreadPreview = true,
  onThreadAction,
  className = ''
}) => {
  const [currentSplitRatio, setCurrentSplitRatio] = useState(splitRatio);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [showDetailView, setShowDetailView] = useState(!!selectedThread);
  
  const containerRef = useRef(null);
  const resizerRef = useRef(null);

  // Handle thread selection with smooth transition
  const handleThreadSelect = useCallback((thread) => {
    if (onThreadSelect) {
      onThreadSelect(thread);
    }
    setShowDetailView(true);
  }, [onThreadSelect]);

  // Handle back navigation (for portrait mode)
  const handleBack = useCallback(() => {
    setShowDetailView(false);
    if (onBack) {
      onBack();
    }
  }, [onBack]);

  // Resize handling
  const startResize = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX || (e.touches && e.touches[0].clientX);
    const startY = e.clientY || (e.touches && e.touches[0].clientY);
    
    setDragStart({
      x: startX,
      y: startY,
      ratio: currentSplitRatio
    });

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchmove', handleResize, { passive: false });
    document.addEventListener('touchend', stopResize);
  }, [currentSplitRatio]);

  const handleResize = useCallback((e) => {
    if (!isDragging || !dragStart || !containerRef.current) return;

    e.preventDefault();
    
    const currentX = e.clientX || (e.touches && e.touches[0].clientX);
    const currentY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    let newRatio;
    if (orientation === 'horizontal') {
      const deltaX = currentX - dragStart.x;
      const containerWidth = containerRect.width;
      const deltaRatio = deltaX / containerWidth;
      newRatio = dragStart.ratio + deltaRatio;
    } else {
      const deltaY = currentY - dragStart.y;
      const containerHeight = containerRect.height;
      const deltaRatio = deltaY / containerHeight;
      newRatio = dragStart.ratio + deltaRatio;
    }

    // Constrain the ratio based on min/max panel widths
    const containerSize = orientation === 'horizontal' ? containerRect.width : containerRect.height;
    const minRatio = minPanelWidth / containerSize;
    const maxRatio = maxPanelWidth / containerSize;
    
    newRatio = Math.max(minRatio, Math.min(maxRatio, newRatio));
    setCurrentSplitRatio(newRatio);
  }, [isDragging, dragStart, orientation, minPanelWidth, maxPanelWidth]);

  const stopResize = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
    
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', handleResize);
    document.removeEventListener('touchend', stopResize);
  }, [handleResize]);

  // Format time helper
  const formatTimeAgo = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  // Thread List Component
  const ThreadList = ({ threads, selectedThread, onThreadSelect }) => (
    <div className="tablet-thread-list">
      <div className="tablet-thread-list-header">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Discussions</h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {threads.length} threads
          </span>
        </div>
      </div>
      
      <div className="tablet-thread-list-content">
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={`tablet-thread-item ${
              selectedThread?.id === thread.id ? 'tablet-thread-item-selected' : ''
            }`}
            onClick={() => onThreadSelect(thread)}
          >
            <div className="tablet-thread-item-main">
              <div className="flex items-start space-x-3">
                {/* Thread Status Indicators */}
                <div className="flex flex-col items-center space-y-1 flex-shrink-0 pt-1">
                  {thread.isPinned && <Pin className="w-4 h-4 text-red-500" />}
                  {thread.isHot && <TrendingUp className="w-4 h-4 text-orange-500" />}
                </div>

                {/* Thread Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="tablet-thread-title">
                    {thread.title}
                  </h3>
                  
                  {showThreadPreview && thread.excerpt && (
                    <p className="tablet-thread-excerpt">
                      {thread.excerpt}
                    </p>
                  )}

                  {/* Thread Meta */}
                  <div className="tablet-thread-meta">
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>{thread.author?.username || 'Anonymous'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{thread.replies_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="w-3 h-3" />
                        <span>{thread.views_count || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTimeAgo(thread.updated_at || thread.created_at)}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {thread.tags && thread.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {thread.tags.slice(0, 2).map((tag, index) => (
                          <span 
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {thread.tags.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                            +{thread.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Vote Score */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900 dark:text-white">
                    {(thread.upvotes || 0) - (thread.downvotes || 0)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">votes</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Thread Detail Component
  const ThreadDetail = ({ thread, content, onBack, showBackButton = false }) => (
    <div className="tablet-thread-detail">
      <div className="tablet-thread-detail-header">
        <div className="flex items-center space-x-3">
          {showBackButton && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 tablet-touch-target"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
              {thread?.title || 'Select a thread'}
            </h1>
            {thread && (
              <div className="flex items-center space-x-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{thread.author?.username || 'Anonymous'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeAgo(thread.created_at)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="tablet-thread-detail-content">
        {content ? (
          content
        ) : thread ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Thread content will be loaded here</p>
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select a thread from the list to view its content</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div 
      ref={containerRef}
      className={`tablet-split-view ${className} ${
        orientation === 'vertical' ? 'tablet-split-vertical' : 'tablet-split-horizontal'
      }`}
    >
      {/* Mobile/Portrait Layout */}
      <div className="tablet-split-mobile lg:hidden">
        {!showDetailView ? (
          <ThreadList
            threads={threads}
            selectedThread={selectedThread}
            onThreadSelect={handleThreadSelect}
          />
        ) : (
          <ThreadDetail
            thread={selectedThread}
            content={selectedThreadContent}
            onBack={handleBack}
            showBackButton={true}
          />
        )}
      </div>

      {/* Desktop/Landscape Split Layout */}
      <div className="tablet-split-desktop hidden lg:flex">
        {/* Left Panel */}
        <div 
          className="tablet-split-panel tablet-split-left"
          style={{
            [orientation === 'horizontal' ? 'width' : 'height']: 
              leftPanelCollapsed ? '60px' : `${currentSplitRatio * 100}%`
          }}
        >
          {leftPanelCollapsed ? (
            <div className="flex flex-col items-center justify-center h-full p-4">
              <button
                onClick={() => setLeftPanelCollapsed(false)}
                className="p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 tablet-touch-target"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <>
              <ThreadList
                threads={threads}
                selectedThread={selectedThread}
                onThreadSelect={handleThreadSelect}
              />
              <button
                onClick={() => setLeftPanelCollapsed(true)}
                className="absolute top-4 right-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 tablet-touch-target z-10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Resizer */}
        {!leftPanelCollapsed && (
          <div
            ref={resizerRef}
            className={`tablet-split-resizer ${
              orientation === 'horizontal' ? 'tablet-split-resizer-vertical' : 'tablet-split-resizer-horizontal'
            } ${isDragging ? 'tablet-split-resizer-dragging' : ''}`}
            onMouseDown={startResize}
            onTouchStart={startResize}
          >
            <div className="tablet-split-resizer-handle" />
          </div>
        )}

        {/* Right Panel */}
        <div 
          className="tablet-split-panel tablet-split-right"
          style={{
            [orientation === 'horizontal' ? 'width' : 'height']: 
              leftPanelCollapsed ? 'calc(100% - 60px)' : `${(1 - currentSplitRatio) * 100}%`
          }}
        >
          <ThreadDetail
            thread={selectedThread}
            content={selectedThreadContent}
            onBack={handleBack}
            showBackButton={false}
          />
        </div>
      </div>

      <style jsx>{`
        .tablet-split-view {
          width: 100%;
          height: 100vh;
          overflow: hidden;
          background: #f8f9fa;
          contain: layout style;
        }

        .dark .tablet-split-view {
          background: #111827;
        }

        .tablet-split-desktop {
          height: 100%;
          position: relative;
        }

        .tablet-split-horizontal .tablet-split-desktop {
          flex-direction: row;
        }

        .tablet-split-vertical .tablet-split-desktop {
          flex-direction: column;
        }

        .tablet-split-panel {
          background: white;
          overflow: hidden;
          position: relative;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          contain: layout style paint;
        }

        .dark .tablet-split-panel {
          background: #1f2937;
        }

        .tablet-split-left {
          border-right: 1px solid #e5e7eb;
        }

        .dark .tablet-split-left {
          border-color: #374151;
        }

        .tablet-split-vertical .tablet-split-left {
          border-right: none;
          border-bottom: 1px solid #e5e7eb;
        }

        .dark .tablet-split-vertical .tablet-split-left {
          border-color: #374151;
        }

        .tablet-split-resizer {
          background: transparent;
          cursor: col-resize;
          user-select: none;
          touch-action: none;
          z-index: 10;
          position: relative;
          transition: background-color 0.2s ease;
        }

        .tablet-split-resizer-vertical {
          width: 6px;
          cursor: col-resize;
        }

        .tablet-split-resizer-horizontal {
          height: 6px;
          cursor: row-resize;
        }

        .tablet-split-resizer:hover,
        .tablet-split-resizer-dragging {
          background: #ef4444;
        }

        .tablet-split-resizer-handle {
          position: absolute;
          background: transparent;
          border-radius: 4px;
        }

        .tablet-split-resizer-vertical .tablet-split-resizer-handle {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 60px;
        }

        .tablet-split-resizer-horizontal .tablet-split-resizer-handle {
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 60px;
          height: 20px;
        }

        .tablet-split-resizer:hover .tablet-split-resizer-handle,
        .tablet-split-resizer-dragging .tablet-split-resizer-handle {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Thread List Styles */
        .tablet-thread-list {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tablet-thread-list-header {
          padding: 1.5rem 1.5rem 1rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f8f9fa;
          flex-shrink: 0;
        }

        .dark .tablet-thread-list-header {
          border-color: #374151;
          background: #111827;
        }

        .tablet-thread-list-content {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tablet-thread-item {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .tablet-thread-item:hover {
          background: #f9fafb;
        }

        .tablet-thread-item-selected {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
        }

        .dark .tablet-thread-item {
          border-color: #374151;
        }

        .dark .tablet-thread-item:hover {
          background: #374151;
        }

        .dark .tablet-thread-item-selected {
          background: #1f1815;
          border-color: #f87171;
        }

        .tablet-thread-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 0.95rem;
          line-height: 1.4;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dark .tablet-thread-title {
          color: #f9fafb;
        }

        .tablet-thread-excerpt {
          font-size: 0.85rem;
          color: #6b7280;
          line-height: 1.4;
          margin-bottom: 0.75rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .dark .tablet-thread-excerpt {
          color: #9ca3af;
        }

        .tablet-thread-meta {
          margin-top: 0.75rem;
        }

        /* Thread Detail Styles */
        .tablet-thread-detail {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .tablet-thread-detail-header {
          padding: 1.5rem;
          border-bottom: 1px solid #e5e7eb;
          background: #f8f9fa;
          flex-shrink: 0;
        }

        .dark .tablet-thread-detail-header {
          border-color: #374151;
          background: #111827;
        }

        .tablet-thread-detail-content {
          flex: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        /* Touch targets */
        .tablet-touch-target {
          min-height: 44px;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
        }

        /* Mobile optimizations */
        .tablet-split-mobile {
          height: 100vh;
          overflow: hidden;
        }

        /* Performance optimizations */
        @media (prefers-reduced-motion: reduce) {
          .tablet-split-panel,
          .tablet-split-resizer,
          .tablet-thread-item {
            transition: none !important;
          }
        }

        /* High DPI optimizations */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
          .tablet-split-view {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }

        /* Custom scrollbar for thread list */
        .tablet-thread-list-content::-webkit-scrollbar {
          width: 6px;
        }

        .tablet-thread-list-content::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .tablet-thread-list-content::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .tablet-thread-list-content::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .dark .tablet-thread-list-content::-webkit-scrollbar-track {
          background: #374151;
        }

        .dark .tablet-thread-list-content::-webkit-scrollbar-thumb {
          background: #6b7280;
        }

        .dark .tablet-thread-list-content::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default TabletSplitView;