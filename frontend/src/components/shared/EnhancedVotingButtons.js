import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks';
import { showToast, showSuccessToast, showErrorToast, showWarningToast } from '../../utils/toastUtils';

function EnhancedVotingButtons({ 
  itemType, // 'forum_thread', 'forum_post', 'news', 'news_comment', 'match_comment'
  itemId,
  parentId = null,
  initialUpvotes = 0,
  initialDownvotes = 0,
  userVote = null, // 'upvote', 'downvote', or null
  onVoteChange = null,
  size = 'sm',
  direction = 'horizontal', // 'horizontal' or 'vertical'
  showScore = true,
  showCounts = true,
  disabled = false,
  className = '',
  // Performance optimizations
  enableOptimisticUpdates = true,
  enableCaching = true,
  batchVoteUpdates = false
}) {
  const { api, user, isAuthenticated } = useAuth();
  
  // State management with optimistic updates
  const [voteState, setVoteState] = useState({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
    userVote: userVote,
    score: initialUpvotes - initialDownvotes,
    loading: false,
    lastVoteTime: null
  });

  // Update state when props change
  useEffect(() => {
    setVoteState(prev => ({
      ...prev,
      upvotes: initialUpvotes,
      downvotes: initialDownvotes,
      userVote: userVote,
      score: initialUpvotes - initialDownvotes
    }));
  }, [initialUpvotes, initialDownvotes, userVote]);

  // Memoized style configurations
  const sizeClasses = useMemo(() => ({
    xs: 'p-1 text-xs min-h-[36px] min-w-[36px]',
    sm: 'p-1.5 text-sm min-h-[40px] min-w-[40px]',
    md: 'p-2 text-base min-h-[44px] min-w-[44px]',
    lg: 'p-3 text-lg min-h-[48px] min-w-[48px]'
  }), []);

  // Cache key for local storage caching
  const cacheKey = useMemo(() => 
    enableCaching ? `vote_${itemType}_${itemId}_${user?.id}` : null,
  [itemType, itemId, user?.id, enableCaching]);

  // Load cached vote data on mount
  useEffect(() => {
    if (cacheKey && enableCaching) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { userVote: cachedVote, timestamp } = JSON.parse(cached);
          // Use cached data if less than 5 minutes old
          if (Date.now() - timestamp < 300000) {
            setVoteState(prev => ({ ...prev, userVote: cachedVote }));
          }
        }
      } catch (error) {
        console.warn('Failed to load cached vote data:', error);
      }
    }
  }, [cacheKey, enableCaching]);

  // Debounced vote submission for batch updates
  const [pendingVotes, setPendingVotes] = useState(new Map());
  
  useEffect(() => {
    if (batchVoteUpdates && pendingVotes.size > 0) {
      const timer = setTimeout(() => {
        submitBatchedVotes();
      }, 500); // Batch votes for 500ms
      
      return () => clearTimeout(timer);
    }
  }, [pendingVotes, batchVoteUpdates]);

  // Rate limiting
  const isRateLimited = useCallback(() => {
    if (!voteState.lastVoteTime) return false;
    return Date.now() - voteState.lastVoteTime < 1000; // 1 second cooldown
  }, [voteState.lastVoteTime]);

  // Enhanced vote processing with optimistic updates
  const handleVote = useCallback(async (voteType) => {
    // Validation checks
    if (!isAuthenticated) {
      showErrorToast('Please log in to vote');
      return;
    }

    if (disabled || voteState.loading) return;

    if (isRateLimited()) {
      showWarningToast('Please wait before voting again');
      return;
    }

    // Prevent voting on temporary items
    if (itemId && itemId.toString().startsWith('temp-')) {
      showWarningToast('Please wait for the content to be created before voting');
      return;
    }

    // Store original state for rollback
    const originalState = { ...voteState };
    
    try {
      setVoteState(prev => ({ 
        ...prev, 
        loading: true,
        lastVoteTime: Date.now()
      }));

      // Optimistic UI update
      if (enableOptimisticUpdates) {
        const newState = calculateOptimisticUpdate(voteState, voteType);
        setVoteState(prev => ({ ...prev, ...newState }));
      }

      // Batch or immediate submission
      if (batchVoteUpdates) {
        setPendingVotes(prev => new Map(prev.set(itemId, {
          itemType,
          itemId,
          voteType,
          parentId,
          originalState
        })));
        return;
      }

      // Immediate submission
      const result = await submitVote(voteType, originalState);
      handleVoteSuccess(result, voteType);

    } catch (error) {
      console.error('Vote submission failed:', error);
      handleVoteError(error, originalState);
    }
  }, [
    isAuthenticated, disabled, voteState, isRateLimited, itemId, itemType, 
    parentId, enableOptimisticUpdates, batchVoteUpdates
  ]);

  // Calculate optimistic UI update
  const calculateOptimisticUpdate = useCallback((currentState, voteType) => {
    const { upvotes, downvotes, userVote } = currentState;
    
    if (userVote === voteType) {
      // Removing existing vote
      return {
        upvotes: voteType === 'upvote' ? Math.max(0, upvotes - 1) : upvotes,
        downvotes: voteType === 'downvote' ? Math.max(0, downvotes - 1) : downvotes,
        userVote: null,
        score: voteType === 'upvote' ? upvotes - downvotes - 1 : upvotes - downvotes + 1
      };
    } else if (userVote) {
      // Changing vote
      return {
        upvotes: voteType === 'upvote' ? upvotes + 1 : Math.max(0, upvotes - 1),
        downvotes: voteType === 'downvote' ? downvotes + 1 : Math.max(0, downvotes - 1),
        userVote: voteType,
        score: voteType === 'upvote' ? upvotes - downvotes + 2 : upvotes - downvotes - 2
      };
    } else {
      // New vote
      return {
        upvotes: voteType === 'upvote' ? upvotes + 1 : upvotes,
        downvotes: voteType === 'downvote' ? downvotes + 1 : downvotes,
        userVote: voteType,
        score: voteType === 'upvote' ? upvotes - downvotes + 1 : upvotes - downvotes - 1
      };
    }
  }, []);

  // Submit single vote
  const submitVote = useCallback(async (voteType, originalState) => {
    const payload = {
      votable_type: itemType,
      votable_id: itemId,
      vote_type: voteType,
      ...(parentId && { parent_id: parentId })
    };

    const response = await api.post('/user/votes', payload);
    
    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Vote submission failed');
    }

    return response.data;
  }, [api, itemType, itemId, parentId]);

  // Submit batched votes
  const submitBatchedVotes = useCallback(async () => {
    if (pendingVotes.size === 0) return;

    const votes = Array.from(pendingVotes.values());
    setPendingVotes(new Map());

    try {
      // Submit votes in parallel
      const results = await Promise.allSettled(
        votes.map(vote => submitVote(vote.voteType, vote.originalState))
      );

      results.forEach((result, index) => {
        const vote = votes[index];
        if (result.status === 'fulfilled') {
          handleVoteSuccess(result.value, vote.voteType);
        } else {
          handleVoteError(result.reason, vote.originalState);
        }
      });

    } catch (error) {
      console.error('Batch vote submission failed:', error);
      // Rollback all pending votes
      votes.forEach(vote => {
        setVoteState(vote.originalState);
      });
    }
  }, [pendingVotes, submitVote]);

  // Handle successful vote
  const handleVoteSuccess = useCallback((result, voteType) => {
    const { vote_counts, user_vote, action, score } = result;
    
    setVoteState(prev => ({
      ...prev,
      upvotes: vote_counts?.upvotes ?? prev.upvotes,
      downvotes: vote_counts?.downvotes ?? prev.downvotes,
      userVote: user_vote,
      score: score ?? (vote_counts?.upvotes - vote_counts?.downvotes),
      loading: false
    }));

    // Cache the vote
    if (cacheKey && enableCaching) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          userVote: user_vote,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to cache vote data:', error);
      }
    }

    // Notify parent component
    if (onVoteChange) {
      onVoteChange({
        action,
        vote_counts,
        user_vote,
        score
      });
    }

    // Success feedback
    const message = action === 'removed' ? 'Vote removed' : 
                   action === 'changed' ? 'Vote updated' : 'Vote recorded';
    showSuccessToast(message, 1500);

  }, [cacheKey, enableCaching, onVoteChange]);

  // Handle vote error
  const handleVoteError = useCallback((error, originalState) => {
    // Rollback optimistic update
    setVoteState(prev => ({ 
      ...originalState, 
      loading: false,
      lastVoteTime: prev.lastVoteTime
    }));

    // Error feedback
    let errorMessage = 'Failed to record vote';
    
    if (error.response?.status === 409) {
      errorMessage = 'You have already voted. Please refresh the page.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Please log in again to vote';
    } else if (error.response?.status === 403) {
      errorMessage = 'You do not have permission to vote';
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many vote attempts. Please slow down.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message && error.message !== 'Network Error') {
      errorMessage = error.message;
    }
    
    showErrorToast(errorMessage, 4000);
  }, []);

  // Accessibility helpers
  const getVoteButtonProps = useCallback((voteType) => {
    const isActive = voteState.userVote === voteType;
    const isDisabled = disabled || voteState.loading || !isAuthenticated;
    
    return {
      onClick: () => handleVote(voteType),
      disabled: isDisabled,
      'aria-pressed': isActive,
      'aria-label': `${voteType} this ${itemType.replace('_', ' ')}`,
      className: `${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center touch-manipulation ${
        isActive
          ? voteType === 'upvote'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 transform scale-105'
            : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 transform scale-105'
          : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`,
      style: { 
        WebkitTapHighlightColor: voteType === 'upvote' 
          ? 'rgba(34, 197, 94, 0.1)' 
          : 'rgba(239, 68, 68, 0.1)' 
      }
    };
  }, [voteState, disabled, isAuthenticated, sizeClasses, size, handleVote, itemType]);

  // Render loading state
  if (voteState.loading && !enableOptimisticUpdates) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-8 h-8"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-6 h-4"></div>
        <div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded w-8 h-8"></div>
      </div>
    );
  }

  // Vertical layout
  if (direction === 'vertical') {
    return (
      <div className={`flex flex-col items-center space-y-1 ${className}`}>
        <button {...getVoteButtonProps('upvote')}>
          <span role="img" aria-label="upvote">👍</span>
        </button>

        {showScore && (
          <span className={`text-xs font-medium ${
            voteState.score > 0 ? 'text-green-600 dark:text-green-400' :
            voteState.score < 0 ? 'text-red-600 dark:text-red-400' :
            'text-gray-600 dark:text-gray-400'
          }`}>
            {voteState.score > 0 ? '+' : ''}{voteState.score}
          </span>
        )}

        <button {...getVoteButtonProps('downvote')}>
          <span role="img" aria-label="downvote">👎</span>
        </button>
      </div>
    );
  }

  // Horizontal layout (default)
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button {...getVoteButtonProps('upvote')}>
        <span role="img" aria-label="upvote">👍</span>
        {showCounts && (
          <span className="text-xs font-medium ml-1">{voteState.upvotes}</span>
        )}
      </button>

      {showScore && !showCounts && (
        <span className={`text-sm font-medium px-2 ${
          voteState.score > 0 ? 'text-green-600 dark:text-green-400' :
          voteState.score < 0 ? 'text-red-600 dark:text-red-400' :
          'text-gray-600 dark:text-gray-400'
        }`}>
          {voteState.score > 0 ? '+' : ''}{voteState.score}
        </span>
      )}

      <button {...getVoteButtonProps('downvote')}>
        <span role="img" aria-label="downvote">👎</span>
        {showCounts && (
          <span className="text-xs font-medium ml-1">{voteState.downvotes}</span>
        )}
      </button>

      {/* Loading indicator for optimistic updates */}
      {voteState.loading && enableOptimisticUpdates && (
        <div className="flex items-center ml-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

export default EnhancedVotingButtons;