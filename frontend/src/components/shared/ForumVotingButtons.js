import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks';

function ForumVotingButtons({ 
  itemType, // 'thread', 'post', or 'match-comment'
  itemId,
  initialUpvotes = 0,
  initialDownvotes = 0,
  userVote = null, // 'upvote', 'downvote', or null
  onVoteChange = null,
  size = 'sm',
  direction = 'horizontal' // 'horizontal' or 'vertical'
}) {
  const { api, user, isAuthenticated } = useAuth();
  // Use internal state that won't be overridden by props after voting
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState(userVote);
  const [loading, setLoading] = useState(false);
  const [initialStateLoaded, setInitialStateLoaded] = useState(false);
  // Track if we've voted to prevent prop updates from overriding server state
  const hasVoted = useRef(false);
  
  // Debug logging with current state values - removed excessive logging

  const sizeClasses = {
    xs: 'p-1 text-xs min-h-[36px] min-w-[36px]',
    sm: 'p-1.5 text-sm min-h-[40px] min-w-[40px]',
    md: 'p-2 text-base min-h-[44px] min-w-[44px]',
    lg: 'p-3 text-lg min-h-[48px] min-w-[48px]'
  };

  // Fetch current vote state when component mounts or when itemId changes
  const fetchVoteState = useCallback(async () => {
    // For posts and match comments, we don't fetch - just use parent-provided state
    // The parent (ThreadDetailPage) already gets user_vote from the server
    if (itemType === 'post' || itemType === 'match-comment') {
      setInitialStateLoaded(true);
      return;
    }
    
    if (!isAuthenticated) return;
    
    // Only fetch for threads
    if (itemType === 'thread') {
      try {
        const endpoint = `/public/forums/threads/${itemId}`;
        const response = await api.get(endpoint);
        const data = response.data?.data || response.data;
        
        if (data) {
          // Update vote counts and user vote from server only if we haven't voted
          if (!hasVoted.current) {
            setUpvotes(data.stats?.upvotes || data.upvotes || initialUpvotes);
            setDownvotes(data.stats?.downvotes || data.downvotes || initialDownvotes);
            setCurrentVote(data.user_vote || null);
          }
          setInitialStateLoaded(true);
        }
      } catch (error) {
        console.warn('Could not fetch thread vote state:', error);
        // Fallback to initial values provided by parent
        setInitialStateLoaded(true);
      }
    }
  }, [api, itemType, itemId, isAuthenticated, initialUpvotes, initialDownvotes]);

  useEffect(() => {
    fetchVoteState();
  }, [fetchVoteState]);

  // Handle online/offline events to refresh vote state
  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored - refreshing vote state');
      // Reset the loaded flag to force a refresh
      setInitialStateLoaded(false);
      hasVoted.current = false;
      fetchVoteState();
    };

    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchVoteState]);

  // Track previous itemId to detect real changes
  const prevItemId = useRef(itemId);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Initialize state when component mounts or itemId changes
  useEffect(() => {
    if (prevItemId.current !== itemId) {
      // We're switching to a different item - reset everything
      setUpvotes(initialUpvotes);
      setDownvotes(initialDownvotes);
      setCurrentVote(userVote);
      setInitialStateLoaded(false);
      hasVoted.current = false; // Reset voted flag when switching items
      prevItemId.current = itemId;
      setHasInitialized(true);
    } else if (!hasInitialized) {
      // First initialization with same itemId
      setUpvotes(initialUpvotes);
      setDownvotes(initialDownvotes);
      setCurrentVote(userVote);
      setHasInitialized(true);
    } else if (!hasVoted.current && (upvotes !== initialUpvotes || downvotes !== initialDownvotes)) {
      // Only update from props if we haven't voted and the counts actually changed
      // This prevents duplicate updates while allowing parent updates when needed
      return; // Don't update if we haven't voted but counts are different (prevents duplication)
    }
    // Don't update if it's the same item and we've already initialized
    // This prevents resetting hasVoted flag on re-renders
  }, [itemId, initialUpvotes, initialDownvotes, userVote, hasInitialized]);

  // Debug: Log when state changes
  useEffect(() => {
    console.log(`ForumVotingButtons state: itemId=${itemId}, upvotes=${upvotes}, downvotes=${downvotes}, currentVote=${currentVote}, hasVoted=${hasVoted.current}`);
  }, [upvotes, downvotes, currentVote, itemId]);

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      alert('Please log in to vote');
      return;
    }

    if (loading) return;

    setLoading(true);
    
    // Store current state for potential rollback
    const originalUpvotes = upvotes;
    const originalDownvotes = downvotes;
    const originalVote = currentVote;
    
    // Add visual feedback classes for button animations
    const buttonElement = document.querySelector(`[data-vote-type="${voteType}"]`);
    if (buttonElement) {
      buttonElement.classList.add('animate-pulse');
    }

    try {
      // Use appropriate voting endpoints based on item type
      let endpoint;
      if (itemType === 'thread') {
        endpoint = `/user/forums/threads/${itemId}/vote`;
      } else if (itemType === 'post') {
        endpoint = `/user/forums/posts/${itemId}/vote`;
      } else if (itemType === 'match-comment') {
        endpoint = `/match-comments/${itemId}/vote`;
      } else {
        throw new Error(`Unknown item type: ${itemType}`);
      }

      // Determine if we're toggling (removing) or changing vote
      const isToggling = currentVote === voteType;
      
      const payload = {
        vote_type: voteType
      };

      const response = await api.post(endpoint, payload);
      
      console.log('Forum vote raw response:', response);
      
      // Handle successful response - response IS the data, not response.data
      if (response?.success !== false) {
        const serverCounts = response?.vote_counts || response?.updated_stats || response?.stats;
        const serverUserVote = response?.user_vote;
        const action = response?.action || 'voted';
        
        console.log('Extracted from response:', { serverCounts, serverUserVote, action });
        
        // Mark that we've voted to prevent prop updates from overriding
        hasVoted.current = true;
        
        // ALWAYS trust server counts - never calculate locally
        if (serverCounts && typeof serverCounts === 'object') {
          // Use server counts directly, don't add to existing
          const newUpvotes = parseInt(serverCounts.upvotes) || 0;
          const newDownvotes = parseInt(serverCounts.downvotes) || 0;
          console.log(`Vote response - Setting counts: upvotes=${newUpvotes}, downvotes=${newDownvotes}`);
          setUpvotes(newUpvotes);
          setDownvotes(newDownvotes);
        } else {
          console.warn('No valid server counts in response, response was:', response);
          // Fallback: Use optimistic update based on action
          if (action === 'removed') {
            // Vote was removed
            if (originalVote === 'upvote') {
              setUpvotes(Math.max(0, originalUpvotes - 1));
            } else if (originalVote === 'downvote') {
              setDownvotes(Math.max(0, originalDownvotes - 1));
            }
            setCurrentVote(null);
          } else if (action === 'updated' || action === 'voted') {
            // Vote was added or changed
            if (isToggling) {
              // Removing vote
              if (voteType === 'upvote') {
                setUpvotes(Math.max(0, originalUpvotes - 1));
              } else {
                setDownvotes(Math.max(0, originalDownvotes - 1));
              }
              setCurrentVote(null);
            } else if (originalVote) {
              // Changing vote
              if (voteType === 'upvote') {
                setUpvotes(originalUpvotes + 1);
                setDownvotes(Math.max(0, originalDownvotes - 1));
              } else {
                setDownvotes(originalDownvotes + 1);
                setUpvotes(Math.max(0, originalUpvotes - 1));
              }
              setCurrentVote(voteType);
            } else {
              // New vote
              if (voteType === 'upvote') {
                setUpvotes(originalUpvotes + 1);
              } else {
                setDownvotes(originalDownvotes + 1);
              }
              setCurrentVote(voteType);
            }
          }
        }
        
        // Set the actual vote state from server
        if (serverUserVote !== undefined) {
          setCurrentVote(serverUserVote);
        } else if (action === 'removed') {
          setCurrentVote(null);
        } else {
          setCurrentVote(voteType);
        }

        // Notify parent component with server data
        if (onVoteChange) {
          const finalCounts = serverCounts || {
            upvotes: serverCounts?.upvotes || upvotes,
            downvotes: serverCounts?.downvotes || downvotes,
            score: (serverCounts?.upvotes || upvotes) - (serverCounts?.downvotes || downvotes)
          };
          onVoteChange({
            action: action,
            vote_counts: finalCounts,
            user_vote: serverUserVote !== undefined ? serverUserVote : currentVote
          });
        }
      } else {
        // Handle API error response
        const errorMsg = response.data?.message || 'Vote request failed';
        console.warn('Vote request unsuccessful:', errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('Vote request error:', error);
      
      // Handle 409 Conflict - vote already exists
      if (error.response?.status === 409) {
        // Vote conflict is expected behavior - don't show error
        // The vote is already recorded on the server
        return;
      } else {
        // Handle other error types
        let errorMessage = 'Failed to record vote';
        
        if (error.response?.status === 401) {
          errorMessage = 'Please log in to vote';
        } else if (error.response?.status === 403) {
          errorMessage = 'You do not have permission to vote on this item';
        } else if (error.response?.status === 404) {
          errorMessage = 'This item no longer exists or has been deleted';
        } else {
          const safeErrorMsg = error.response?.data?.message || error.message;
          if (safeErrorMsg && typeof safeErrorMsg === 'string') {
            errorMessage = safeErrorMsg;
          }
        }
        
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
      
      // Remove animation classes after completion
      const buttonElement = document.querySelector(`[data-vote-type="${voteType}"]`);
      if (buttonElement) {
        buttonElement.classList.remove('animate-pulse');
      }
    }
  };

  const getScore = () => {
    return upvotes - downvotes;
  };

  const getScoreColor = () => {
    const score = getScore();
    if (score > 0) return 'text-green-600 dark:text-green-400';
    if (score < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  if (direction === 'vertical') {
    return (
      <div className="flex flex-col items-center space-y-1">
        {/* Upvote */}
        <button
          onClick={() => handleVote('upvote')}
          disabled={loading}
          data-vote-type="upvote"
          className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center touch-manipulation ${
            currentVote === 'upvote'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 transform scale-110 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 active:scale-95'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
          style={{ WebkitTapHighlightColor: 'rgba(34, 197, 94, 0.1)' }}
          title="Upvote"
        >
          <span>👍</span>
        </button>

        {/* Score */}
        <span className={`text-xs font-medium ${getScoreColor()}`}>
          {getScore()}
        </span>

        {/* Downvote */}
        <button
          onClick={() => handleVote('downvote')}
          disabled={loading}
          data-vote-type="downvote"
          className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center touch-manipulation ${
            currentVote === 'downvote'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 transform scale-110 shadow-lg'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 active:scale-95'
          } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
          style={{ WebkitTapHighlightColor: 'rgba(239, 68, 68, 0.1)' }}
          title="Downvote"
        >
          <span>👎</span>
        </button>
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className="flex items-center space-x-2">
      {/* Upvote */}
      <button
        onClick={() => handleVote('upvote')}
        disabled={loading}
        data-vote-type="upvote"
        className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center space-x-1 touch-manipulation ${
          currentVote === 'upvote'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 transform scale-105 shadow-lg'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 active:scale-95'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        style={{ WebkitTapHighlightColor: 'rgba(34, 197, 94, 0.1)' }}
        title="Upvote"
      >
        <span>👍</span>
        <span className="text-xs font-medium">{upvotes}</span>
      </button>

      {/* Score display (optional, can be hidden in horizontal mode) */}
      {size !== 'xs' && (
        <span className={`text-xs font-medium px-2 ${getScoreColor()}`}>
          {getScore() > 0 ? `+${getScore()}` : getScore()}
        </span>
      )}

      {/* Downvote */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={loading}
        data-vote-type="downvote"
        className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center space-x-1 touch-manipulation ${
          currentVote === 'downvote'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 transform scale-105 shadow-lg'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 active:scale-95'
        } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
        style={{ WebkitTapHighlightColor: 'rgba(239, 68, 68, 0.1)' }}
        title="Downvote"
      >
        <span>👎</span>
        <span className="text-xs font-medium">{downvotes}</span>
      </button>
    </div>
  );
}

export default ForumVotingButtons;