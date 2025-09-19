import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { FixedSizeList as List, VariableSizeList, areEqual } from 'react-window';
import { 
  MessageCircle, Clock, User, TrendingUp, Pin, 
  ChevronRight, Eye, Heart, Bookmark, Share2 
} from 'lucide-react';
import { formatTimeAgo } from '../../lib/utils.js';

// Optimized thread item component with React.memo
const ThreadItem = React.memo(({ index, style, data }) => {
  const { 
    threads, 
    onThreadClick, 
    onVote, 
    onBookmark, 
    onShare,
    viewMode,
    selectedThreadId,
    isAuthenticated 
  } = data;
  
  const thread = threads[index];

  // Using imported formatTimeAgo from utils.js for consistency

  const handleThreadClick = useCallback((e) => {
    e.preventDefault();
    onThreadClick(thread);
  }, [thread, onThreadClick]);

  const handleVote = useCallback((e, voteType) => {
    e.stopPropagation();
    onVote(thread.id, voteType);
  }, [thread.id, onVote]);

  const handleBookmark = useCallback((e) => {
    e.stopPropagation();
    onBookmark(thread.id);
  }, [thread.id, onBookmark]);

  const handleShare = useCallback((e) => {
    e.stopPropagation();
    onShare(thread);
  }, [thread, onShare]);

  if (!thread) return null;

  if (viewMode === 'compact') {
    return (
      <div style={style}>
        <div 
          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 touch-optimized ${
            selectedThreadId === thread.id ? 'bg-red-50 dark:bg-red-900/20' : ''
          }`}
          onClick={handleThreadClick}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                {thread.isPinned && <Pin className="w-3 h-3 text-red-500 flex-shrink-0" />}
                <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                  {thread.title}
                </h3>
              </div>
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
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={style}>
      <div 
        className={`p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 touch-optimized ${
          selectedThreadId === thread.id ? 'bg-red-50 dark:bg-red-900/20' : ''
        }`}
        onClick={handleThreadClick}
      >
        <div className="flex space-x-3">
          {/* Author Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-medium">
              {thread.author?.avatar ? (
                <img 
                  src={thread.author.avatar} 
                  alt={thread.author.username} 
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-sm">
                  {thread.author?.username ? thread.author.username[0].toUpperCase() : 'A'}
                </span>
              )}
            </div>
          </div>

          {/* Thread Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                {/* Title and Status */}
                <div className="flex items-center space-x-2 mb-2">
                  {thread.isPinned && <Pin className="w-4 h-4 text-red-500 flex-shrink-0" />}
                  {thread.isHot && <TrendingUp className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
                    {thread.title}
                  </h3>
                </div>

                {/* Excerpt */}
                {thread.excerpt && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                    {thread.excerpt}
                  </p>
                )}

                {/* Meta Information */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{thread.author?.username || 'Anonymous'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{thread.replies_count || 0} replies</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{thread.views_count || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimeAgo(thread.updated_at || thread.created_at)}</span>
                  </div>
                </div>

                {/* Tags */}
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {thread.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {thread.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                        +{thread.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Vote Score */}
              <div className="flex flex-col items-center ml-3">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {(thread.upvotes || 0) - (thread.downvotes || 0)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">votes</div>
              </div>
            </div>

            {/* Action Buttons */}
            {isAuthenticated && (
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => handleVote(e, 'up')}
                    className={`p-1 rounded transition-colors touch-optimized ${
                      thread.userVote === 'up' 
                        ? 'text-green-600 bg-green-100 dark:bg-green-900/30' 
                        : 'text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleBookmark}
                    className={`p-1 rounded transition-colors touch-optimized ${
                      thread.isBookmarked 
                        ? 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' 
                        : 'text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-1 rounded transition-colors text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-optimized"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {thread.category}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}, areEqual);

const VirtualizedForumList = ({
  threads = [],
  onThreadClick,
  onVote,
  onBookmark,
  onShare,
  onLoadMore,
  hasMore = false,
  loading = false,
  viewMode = 'list', // 'list' or 'compact'
  selectedThreadId,
  isAuthenticated = false,
  height = 600,
  itemHeight = null, // null for dynamic height
  className = ''
}) => {
  const [listRef, setListRef] = useState(null);
  const [itemHeights, setItemHeights] = useState({});
  const loadMoreTriggerRef = useRef(null);
  const intersectionObserverRef = useRef(null);

  // Calculate item height based on view mode
  const getItemSize = useCallback((index) => {
    if (itemHeight) return itemHeight;
    
    const thread = threads[index];
    if (!thread) return viewMode === 'compact' ? 60 : 160;
    
    // Use cached height if available
    if (itemHeights[thread.id]) {
      return itemHeights[thread.id];
    }
    
    // Estimate height based on content and view mode
    const baseHeight = viewMode === 'compact' ? 60 : 160;
    const excerptHeight = thread.excerpt ? Math.ceil(thread.excerpt.length / 80) * 20 : 0;
    const tagsHeight = thread.tags && thread.tags.length > 0 ? 30 : 0;
    const actionHeight = isAuthenticated ? 40 : 0;
    
    return baseHeight + excerptHeight + tagsHeight + actionHeight;
  }, [threads, itemHeight, viewMode, itemHeights, isAuthenticated]);

  // Set item height after render
  const setItemHeight = useCallback((index, height) => {
    const thread = threads[index];
    if (thread && itemHeights[thread.id] !== height) {
      setItemHeights(prev => ({
        ...prev,
        [thread.id]: height
      }));
      
      // Reset list cache if using variable size list
      if (listRef && !itemHeight) {
        listRef.resetAfterIndex(index);
      }
    }
  }, [threads, itemHeights, listRef, itemHeight]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '100px' // Load more when 100px away from bottom
      }
    );

    if (loadMoreTriggerRef.current) {
      observer.observe(loadMoreTriggerRef.current);
    }

    intersectionObserverRef.current = observer;

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  // Memoized item data to prevent re-renders
  const itemData = useMemo(() => ({
    threads,
    onThreadClick,
    onVote,
    onBookmark,
    onShare,
    viewMode,
    selectedThreadId,
    isAuthenticated
  }), [threads, onThreadClick, onVote, onBookmark, onShare, viewMode, selectedThreadId, isAuthenticated]);

  // Calculate estimated total count including loading indicator
  const totalCount = threads.length + (hasMore ? 1 : 0);

  // Loading item component
  const LoadingItem = React.memo(({ style }) => (
    <div style={style} className="flex items-center justify-center p-8">
      <div className="flex items-center space-x-3">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-500"></div>
        <span className="text-gray-500 dark:text-gray-400">Loading more threads...</span>
      </div>
    </div>
  ));

  // Item renderer with loading state
  const itemRenderer = useCallback(({ index, style, ...props }) => {
    if (index >= threads.length) {
      // Loading item
      return <LoadingItem style={style} />;
    }
    
    return <ThreadItem index={index} style={style} data={itemData} {...props} />;
  }, [threads.length, itemData]);

  const ListComponent = itemHeight ? List : VariableSizeList;

  return (
    <div className={`virtualized-forum-list ${className}`}>
      <ListComponent
        ref={setListRef}
        height={height}
        itemCount={totalCount}
        itemSize={itemHeight || getItemSize}
        itemData={itemData}
        overscanCount={5} // Pre-render 5 items above and below visible area
        className="scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
      >
        {itemRenderer}
      </ListComponent>

      {/* Hidden trigger for intersection observer */}
      {hasMore && (
        <div 
          ref={loadMoreTriggerRef}
          className="h-1 w-full"
          style={{ 
            position: 'absolute',
            bottom: '200px', // Trigger 200px before actual bottom
            pointerEvents: 'none'
          }}
        />
      )}

      <style jsx>{`
        .virtualized-forum-list {
          contain: layout style paint;
          will-change: transform;
        }

        .touch-optimized {
          min-height: 44px;
          min-width: 44px;
          -webkit-tap-highlight-color: rgba(239, 68, 68, 0.1);
          tap-highlight-color: rgba(239, 68, 68, 0.1);
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Custom scrollbar */
        .scrollbar-thin {
          scrollbar-width: thin;
        }

        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 0.375rem;
        }

        .dark .scrollbar-thumb-gray-600::-webkit-scrollbar-thumb {
          background-color: #4b5563;
        }

        .scrollbar-track-transparent::-webkit-scrollbar-track {
          background-color: transparent;
        }

        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }

        /* Performance optimizations */
        .virtualized-forum-list * {
          content-visibility: auto;
          contain-intrinsic-size: auto 200px;
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          .virtualized-forum-list * {
            transition: none !important;
            animation: none !important;
          }
        }

        /* High DPI optimizations */
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 2dppx) {
          .virtualized-forum-list {
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
        }
      `}</style>
    </div>
  );
};

export default VirtualizedForumList;