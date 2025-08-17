import React, { useState, useEffect, useCallback } from 'react';
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
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState(userVote);
  const [loading, setLoading] = useState(false);
  const [initialStateLoaded, setInitialStateLoaded] = useState(false);
  
  // Debug logging with current state values
  if (itemType === 'post' && (upvotes > 1 || downvotes > 1 || initialUpvotes > 1 || initialDownvotes > 1)) {
    console.log('ForumVotingButtons Debug:', {
      itemType,
      itemId,
      initialUpvotes,
      initialDownvotes,
      currentUpvotes: upvotes,
      currentDownvotes: downvotes,
      userVote,
      currentVote
    });
  }

  const sizeClasses = {
    xs: 'p-1 text-xs min-h-[36px] min-w-[36px]',
    sm: 'p-1.5 text-sm min-h-[40px] min-w-[40px]',
    md: 'p-2 text-base min-h-[44px] min-w-[44px]',
    lg: 'p-3 text-lg min-h-[48px] min-w-[48px]'
  };

  // Fetch current vote state when component mounts or when itemId changes
  const fetchVoteState = useCallback(async () => {
    // For posts and match comments, we don't fetch - just use parent-provided state
    if (itemType === 'post' || itemType === 'match-comment') {
      setInitialStateLoaded(true);
      return;
    }
    
    if (!isAuthenticated || initialStateLoaded) return;
    
    // Only fetch for threads
    if (itemType === 'thread') {
      try {
        const endpoint = `/forums/threads/${itemId}`;
        const response = await api.get(endpoint);
        const data = response.data?.data || response.data;
        
        if (data) {
          // Update vote counts and user vote from server
          setUpvotes(data.stats?.upvotes || data.upvotes || initialUpvotes);
          setDownvotes(data.stats?.downvotes || data.downvotes || initialDownvotes);
          setCurrentVote(data.user_vote || null);
          setInitialStateLoaded(true);
        }
      } catch (error) {
        console.warn('Could not fetch thread vote state:', error);
        // Fallback to initial values provided by parent
        setInitialStateLoaded(true);
      }
    }
  }, [api, itemType, itemId, isAuthenticated, initialStateLoaded, initialUpvotes, initialDownvotes]);

  useEffect(() => {
    fetchVoteState();
  }, [fetchVoteState]);

  // Reset state when item changes
  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
    setCurrentVote(userVote);
    setInitialStateLoaded(false);
  }, [itemId, initialUpvotes, initialDownvotes, userVote]);

  // Debug effect to track state changes
  useEffect(() => {
    if (itemType === 'post' && itemId) {
      console.log('ForumVotingButtons state changed:', {
        itemId,
        upvotes,
        downvotes,
        currentVote,
        timestamp: new Date().toISOString()
      });
    }
  }, [upvotes, downvotes, currentVote, itemType, itemId]);

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
        endpoint = `/forums/threads/${itemId}/vote`;
      } else if (itemType === 'post') {
        endpoint = `/forums/posts/${itemId}/vote`;
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
      
      // Handle successful response
      if (response?.data?.success !== false) {
        const serverCounts = response.data?.vote_counts || response.data?.updated_stats || response.data?.stats;
        const serverUserVote = response.data?.user_vote;
        const action = response.data?.action || 'voted';
        
        // Update state with server data immediately
        if (serverCounts) {
          console.log('Updating UI state with server counts:', serverCounts);
          console.log('Previous state:', { upvotes, downvotes, currentVote });
          setUpvotes(serverCounts.upvotes || 0);
          setDownvotes(serverCounts.downvotes || 0);
          console.log('New state set to:', { upvotes: serverCounts.upvotes || 0, downvotes: serverCounts.downvotes || 0 });
        } else {
          // Fallback: calculate based on action if server doesn't provide counts
          if (action === 'removed') {
            setCurrentVote(null);
            if (originalVote === 'upvote') {
              setUpvotes(Math.max(0, originalUpvotes - 1));
            } else if (originalVote === 'downvote') {
              setDownvotes(Math.max(0, originalDownvotes - 1));
            }
          } else if (action === 'changed') {
            setCurrentVote(voteType);
            if (voteType === 'upvote' && originalVote === 'downvote') {
              setUpvotes(originalUpvotes + 1);
              setDownvotes(Math.max(0, originalDownvotes - 1));
            } else if (voteType === 'downvote' && originalVote === 'upvote') {
              setDownvotes(originalDownvotes + 1);
              setUpvotes(Math.max(0, originalUpvotes - 1));
            }
          } else { // new vote
            setCurrentVote(voteType);
            if (voteType === 'upvote') {
              setUpvotes(originalUpvotes + 1);
            } else {
              setDownvotes(originalDownvotes + 1);
            }
          }
        }
        
        // Set the actual vote state from server
        if (serverUserVote !== undefined) {
          setCurrentVote(serverUserVote);
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
        console.log('Vote conflict (409) - user already voted, no action needed');
        // Don't show error to user as this is expected behavior
        // The vote is already recorded on the server
        return;
        
        // For different vote types, this means the backend doesn't allow vote changes
        // Let's try one more time with a different approach
        try {
          console.log('Attempting vote change with full refresh...');
          
          // Refresh vote state from server first
          if (itemType === 'thread') {
            const refreshResponse = await api.get(`/forums/threads/${itemId}`);
            const data = refreshResponse.data?.data || refreshResponse.data;
            if (data) {
              setUpvotes(data.stats?.upvotes || 0);
              setDownvotes(data.stats?.downvotes || 0);
              setCurrentVote(data.user_vote || null);
              console.log('Vote state refreshed - user current vote:', data.user_vote);
            }
          }
          
          // If still getting 409, inform user they can only have one vote
          console.log('Vote change not supported by backend - showing user message');
          alert('You can only have one vote per item. Your previous vote is still active.');
          
        } catch (refreshError) {
          console.error('Could not refresh vote state:', refreshError);
          alert('Unable to process vote. Please refresh the page and try again.');
        }
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