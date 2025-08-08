import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  ChevronUp, ChevronDown, Heart, MessageCircle, Share2, 
  Bookmark, MoreHorizontal, Clock, User, Eye, Pin, 
  ArrowLeft, Reply, Edit, Flag, Copy
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const MobileForumThread = ({ 
  thread,
  posts,
  onVote,
  onReply,
  onShare,
  onBookmark,
  onReport,
  onEdit,
  isAuthenticated = false,
  currentUser,
  onLoadMore,
  hasMore = false,
  loading = false,
  onBack,
  isPreview = false
}) => {
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  const [swipeStates, setSwipeStates] = useState({});
  const [showQuickActions, setShowQuickActions] = useState({});
  const [selectedText, setSelectedText] = useState('');
  const [showFloatingToolbar, setShowFloatingToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 0, y: 0 });
  
  const touchStart = useRef({});
  const threadRef = useRef(null);
  const intersectionObserver = useRef(null);

  // Swipe gesture handling for posts
  const handleTouchStart = useCallback((e, postId) => {
    if (e.touches.length === 1) {
      touchStart.current[postId] = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  }, []);

  const handleTouchMove = useCallback((e, postId) => {
    if (!touchStart.current[postId] || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - touchStart.current[postId].x;
    const deltaY = e.touches[0].clientY - touchStart.current[postId].y;
    
    // Prevent vertical scrolling if horizontal swipe is detected
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      e.preventDefault();
    }

    // Update swipe state for visual feedback
    setSwipeStates(prev => ({
      ...prev,
      [postId]: {
        x: Math.max(-120, Math.min(120, deltaX)),
        swiping: Math.abs(deltaX) > 10
      }
    }));
  }, []);

  const handleTouchEnd = useCallback((e, postId, post) => {
    if (!touchStart.current[postId]) return;

    const swipeState = swipeStates[postId];
    const deltaTime = Date.now() - touchStart.current[postId].time;
    
    if (swipeState && Math.abs(swipeState.x) > 60 && deltaTime < 500) {
      if (swipeState.x > 0) {
        // Right swipe - upvote
        onVote(postId, 'up');
        if (navigator.vibrate) navigator.vibrate(10);
      } else {
        // Left swipe - reply
        onReply(post);
        if (navigator.vibrate) navigator.vibrate(15);
      }
    }

    // Reset swipe state
    setSwipeStates(prev => {
      const newState = { ...prev };
      delete newState[postId];
      return newState;
    });
    delete touchStart.current[postId];
  }, [swipeStates, onVote, onReply]);

  // Text selection handling for floating toolbar
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelectedText(selectedText);
      setToolbarPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setShowFloatingToolbar(true);
    } else {
      setShowFloatingToolbar(false);
    }
  }, []);

  // Long press handling for context menu
  const useLongPress = (callback, ms = 500) => {
    const [startLongPress, setStartLongPress] = useState(false);
    
    useEffect(() => {
      let timerId;
      if (startLongPress) {
        timerId = setTimeout(callback, ms);
      } else {
        clearTimeout(timerId);
      }
      
      return () => {
        clearTimeout(timerId);
      };
    }, [startLongPress, callback, ms]);
    
    return {
      onMouseDown: () => setStartLongPress(true),
      onMouseUp: () => setStartLongPress(false),
      onMouseLeave: () => setStartLongPress(false),
      onTouchStart: () => setStartLongPress(true),
      onTouchEnd: () => setStartLongPress(false),
    };
  };

  // Infinite scroll intersection observer
  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const loadMoreTrigger = document.getElementById('load-more-trigger');
    if (loadMoreTrigger) {
      observer.observe(loadMoreTrigger);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  const formatTimeAgo = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const handleQuickActions = useCallback((postId) => {
    setShowQuickActions(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }, []);

  const copyTextToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // Show toast notification
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const QuickActionMenu = ({ post, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-t-xl w-full max-h-96 p-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
        
        <div className="space-y-1">
          {isAuthenticated && (
            <button
              onClick={() => {
                onReply(post);
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Reply className="w-5 h-5 text-blue-500" />
              <span className="text-gray-900 dark:text-white">Reply</span>
            </button>
          )}
          
          <button
            onClick={() => {
              copyTextToClipboard(post.content);
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Copy className="w-5 h-5 text-green-500" />
            <span className="text-gray-900 dark:text-white">Copy Text</span>
          </button>

          <button
            onClick={() => {
              onShare(post);
              onClose();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Share2 className="w-5 h-5 text-purple-500" />
            <span className="text-gray-900 dark:text-white">Share Post</span>
          </button>

          {isAuthenticated && post.author?.id !== currentUser?.id && (
            <button
              onClick={() => {
                onReport(post);
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Flag className="w-5 h-5 text-red-500" />
              <span className="text-gray-900 dark:text-white">Report</span>
            </button>
          )}

          {isAuthenticated && post.author?.id === currentUser?.id && (
            <button
              onClick={() => {
                onEdit(post);
                onClose();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Edit className="w-5 h-5 text-orange-500" />
              <span className="text-gray-900 dark:text-white">Edit Post</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const PostCard = ({ post, isMainPost = false }) => {
    const swipeState = swipeStates[post.id] || { x: 0, swiping: false };
    const longPressEvents = useLongPress(() => handleQuickActions(post.id));

    return (
      <div 
        className={`relative bg-white dark:bg-gray-800 ${!isMainPost && 'border-b border-gray-100 dark:border-gray-700'} transition-all duration-200 ${
          swipeState.swiping ? 'touch-none' : ''
        }`}
        style={{
          transform: `translateX(${swipeState.x}px)`,
          transition: swipeState.swiping ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={(e) => handleTouchStart(e, post.id)}
        onTouchMove={(e) => handleTouchMove(e, post.id)}
        onTouchEnd={(e) => handleTouchEnd(e, post.id, post)}
        {...longPressEvents}
      >
        {/* Swipe Action Indicators */}
        <div className="absolute inset-y-0 left-0 w-16 bg-green-500 flex items-center justify-center opacity-0 transition-opacity duration-200"
          style={{ opacity: swipeState.x > 60 ? 1 : 0 }}>
          <ChevronUp className="w-6 h-6 text-white" />
        </div>
        <div className="absolute inset-y-0 right-0 w-16 bg-blue-500 flex items-center justify-center opacity-0 transition-opacity duration-200"
          style={{ opacity: swipeState.x < -60 ? 1 : 0 }}>
          <Reply className="w-6 h-6 text-white" />
        </div>

        <div className="p-4">
          {/* Post Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-medium">
                {post.author?.avatar ? (
                  <img src={post.author.avatar} alt={post.author.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900 dark:text-white truncate">
                    {post.author?.username || 'Anonymous'}
                  </span>
                  {post.author?.isVerified && (
                    <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  {isMainPost && thread?.isPinned && (
                    <Pin className="w-4 h-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(post.created_at)}</span>
                  {post.edited_at && <span>• edited</span>}
                </div>
              </div>
            </div>
            <button 
              onClick={() => handleQuickActions(post.id)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 touch-optimized"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Main Post Title */}
          {isMainPost && thread?.title && (
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-3 leading-tight">
              {thread.title}
            </h1>
          )}

          {/* Post Content */}
          <div 
            className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-relaxed"
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
          >
            {expandedPosts.has(post.id) || isMainPost || post.content.length <= 200 ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <>
                <div dangerouslySetInnerHTML={{ 
                  __html: post.content.substring(0, 200) + '...' 
                }} />
                <button
                  onClick={() => setExpandedPosts(prev => new Set([...prev, post.id]))}
                  className="text-red-500 hover:text-red-600 font-medium mt-2 block"
                >
                  Read more
                </button>
              </>
            )}
          </div>

          {/* Post Actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              {/* Vote Buttons */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onVote(post.id, 'up')}
                  className={`p-2 rounded-lg transition-all duration-200 touch-optimized ${
                    post.userVote === 'up' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[2rem] text-center">
                  {(post.upvotes || 0) - (post.downvotes || 0)}
                </span>
                <button
                  onClick={() => onVote(post.id, 'down')}
                  className={`p-2 rounded-lg transition-all duration-200 touch-optimized ${
                    post.userVote === 'down' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
              </div>

              {/* Reply Button */}
              {isAuthenticated && (
                <button
                  onClick={() => onReply(post)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors touch-optimized"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-sm">{post.replies_count || 0}</span>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {/* Bookmark */}
              {isAuthenticated && (
                <button
                  onClick={() => onBookmark(post.id)}
                  className={`p-2 rounded-lg transition-colors touch-optimized ${
                    post.isBookmarked
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              )}

              {/* Share */}
              <button
                onClick={() => onShare(post)}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors touch-optimized"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Action Menu */}
        {showQuickActions[post.id] && (
          <QuickActionMenu 
            post={post} 
            onClose={() => setShowQuickActions(prev => ({ ...prev, [post.id]: false }))}
          />
        )}
      </div>
    );
  };

  return (
    <div ref={threadRef} className="mobile-forum-thread min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 lg:hidden">
        <div className="flex items-center px-4 py-3">
          <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-optimized"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="ml-3 flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {isPreview ? 'Thread Preview' : (thread?.title || 'Discussion')}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <Eye className="w-3 h-3" />
              <span>{thread?.views || 0} views</span>
              <span>•</span>
              <span>{posts?.length || 0} posts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Thread Content */}
      <div className="px-0">
        {/* Main Post */}
        {posts && posts.length > 0 && (
          <PostCard post={posts[0]} isMainPost={true} />
        )}

        {/* Reply Posts */}
        {posts && posts.slice(1).map((post, index) => (
          <PostCard key={post.id || index} post={post} />
        ))}

        {/* Load More Trigger */}
        {hasMore && (
          <div id="load-more-trigger" className="p-4">
            {loading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                Loading more posts...
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Text Selection Toolbar */}
      {showFloatingToolbar && (
        <div 
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl flex items-center space-x-2"
          style={{
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
            transform: 'translateX(-50%) translateY(-100%)'
          }}
        >
          <button
            onClick={() => copyTextToClipboard(selectedText)}
            className="px-3 py-1 rounded text-sm hover:bg-gray-700"
          >
            Copy
          </button>
          {isAuthenticated && (
            <button
              onClick={() => {
                // Handle quote reply with selected text
                setShowFloatingToolbar(false);
              }}
              className="px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Quote
            </button>
          )}
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        .mobile-forum-thread {
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 60px);
        }

        .touch-optimized {
          min-height: 44px;
          min-width: 44px;
          -webkit-tap-highlight-color: rgba(239, 68, 68, 0.1);
          tap-highlight-color: rgba(239, 68, 68, 0.1);
        }

        .touch-none {
          touch-action: none;
        }

        .prose img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 1rem 0;
        }

        .prose pre {
          overflow-x: auto;
          background: #1f2937;
          border-radius: 8px;
          padding: 1rem;
        }

        .prose code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          font-size: 0.875em;
        }

        .dark .prose code {
          background: #374151;
        }
      `}</style>
    </div>
  );
};

export default MobileForumThread;