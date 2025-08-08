import React, { useState } from 'react';
import { useAuth } from '../../hooks';

function ForumVotingButtons({ 
  itemType, // 'thread' or 'post'
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

  const sizeClasses = {
    xs: 'p-1 text-xs min-h-[36px] min-w-[36px]',
    sm: 'p-1.5 text-sm min-h-[40px] min-w-[40px]',
    md: 'p-2 text-base min-h-[44px] min-w-[44px]',
    lg: 'p-3 text-lg min-h-[48px] min-w-[48px]'
  };

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      alert('Please log in to vote');
      return;
    }

    if (loading) return;

    setLoading(true);
    
    // Optimistic UI update for instant feedback
    const oldUpvotes = upvotes;
    const oldDownvotes = downvotes;
    const oldVote = currentVote;
    
    // Predict the outcome for immediate visual feedback
    if (currentVote === voteType) {
      // Removing existing vote
      if (voteType === 'upvote') {
        setUpvotes(prev => prev - 1);
      } else {
        setDownvotes(prev => prev - 1);
      }
      setCurrentVote(null);
    } else if (currentVote) {
      // Changing vote
      if (voteType === 'upvote') {
        setUpvotes(prev => prev + 1);
        setDownvotes(prev => prev - 1);
      } else {
        setDownvotes(prev => prev + 1);
        setUpvotes(prev => prev - 1);
      }
      setCurrentVote(voteType);
    } else {
      // New vote
      if (voteType === 'upvote') {
        setUpvotes(prev => prev + 1);
      } else {
        setDownvotes(prev => prev + 1);
      }
      setCurrentVote(voteType);
    }
    try {
      // Use forum-specific voting endpoints
      const endpoint = itemType === 'thread' 
        ? `/forums/threads/${itemId}/vote`
        : `/forums/posts/${itemId}/vote`;

      const payload = {
        vote_type: voteType
      };

      const response = await api.post(endpoint, payload);
      
      if (response?.data?.success) {
        // CRITICAL FIX: Use actual vote counts from server response instead of recalculating
        // This prevents double-counting since we already applied optimistic updates above
        const serverCounts = response.data.vote_counts || response.data.updated_stats;
        const serverUserVote = response.data.user_vote;
        
        if (serverCounts) {
          // Use server-provided counts to ensure accuracy
          setUpvotes(serverCounts.upvotes || 0);
          setDownvotes(serverCounts.downvotes || 0);
        }
        
        // Set the actual vote state from server
        setCurrentVote(serverUserVote);

        // Notify parent component with server data
        if (onVoteChange) {
          onVoteChange({
            action: response.data.action,
            vote_counts: serverCounts || {
              upvotes: upvotes,
              downvotes: downvotes,
              score: upvotes - downvotes
            },
            user_vote: serverUserVote
          });
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      
      // Rollback optimistic updates on error
      setUpvotes(oldUpvotes);
      setDownvotes(oldDownvotes);
      setCurrentVote(oldVote);
      
      let errorMessage = 'Failed to record vote';
      
      // Safe error message extraction
      const safeErrorMsg = error.response?.data?.message || error.message;
      
      if (error.response?.status === 409) {
        errorMessage = 'You have already voted on this item';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to vote';
      } else if (safeErrorMsg && typeof safeErrorMsg === 'string') {
        errorMessage = safeErrorMsg;
      } else if (typeof safeErrorMsg === 'object' && safeErrorMsg.message) {
        errorMessage = String(safeErrorMsg.message);
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
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
          className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center touch-manipulation ${
            currentVote === 'upvote'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 transform scale-110'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 active:scale-95'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center touch-manipulation ${
            currentVote === 'downvote'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 transform scale-110'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 active:scale-95'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center space-x-1 touch-manipulation ${
          currentVote === 'upvote'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 transform scale-105'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400 active:scale-95'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        className={`${sizeClasses[size]} rounded transition-all duration-200 flex items-center justify-center space-x-1 touch-manipulation ${
          currentVote === 'downvote'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 transform scale-105'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400 active:scale-95'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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