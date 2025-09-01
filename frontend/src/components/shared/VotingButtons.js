import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import { useActivityStatsContext } from '../../contexts/ActivityStatsContext';
import { showToast, showSuccessToast, showErrorToast, showWarningToast } from '../../utils/toastUtils';

function VotingButtons({ 
  itemType, // 'news', 'news_comment', 'forum_thread', 'forum_post', 'match_comment'
  itemId,
  parentId = null, // For comments
  initialUpvotes = 0,
  initialDownvotes = 0,
  userVote = null, // 'upvote', 'downvote', or null
  onVoteChange = null,
  size = 'sm',
  direction = 'horizontal' // 'horizontal' or 'vertical'
}) {
  const { api, user, isAuthenticated } = useAuth();
  const { triggerVote } = useActivityStatsContext();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState(userVote);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    xs: 'p-1 text-xs min-h-[36px] min-w-[36px]', // Minimum touch target size
    sm: 'p-1.5 text-sm min-h-[40px] min-w-[40px]',
    md: 'p-2 text-base min-h-[44px] min-w-[44px]', // WCAG recommended touch target
    lg: 'p-3 text-lg min-h-[48px] min-w-[48px]'
  };

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      showErrorToast('Please log in to vote');
      return;
    }

    if (loading) return;

    // Prevent voting on temporary items
    if (itemId && itemId.toString().startsWith('temp-')) {
      showWarningToast('Please wait for the post to be created before voting');
      return;
    }

    // CRITICAL FIX: Prevent duplicate votes by checking if user already voted this way
    if (currentVote === voteType) {
      // User is trying to vote the same way again - this should remove their vote
      console.log('User removing existing vote:', voteType);
    }

    setLoading(true);
    
    // Store old values for potential rollback
    const oldUpvotes = upvotes;
    const oldDownvotes = downvotes;
    const oldVote = currentVote;
    
    // Optimistic UI update for instant feedback
    if (currentVote === voteType) {
      // Removing existing vote
      if (voteType === 'upvote') {
        setUpvotes(prev => Math.max(0, prev - 1)); // Prevent negative votes
      } else {
        setDownvotes(prev => Math.max(0, prev - 1)); // Prevent negative votes
      }
      setCurrentVote(null);
    } else if (currentVote) {
      // Changing vote
      if (voteType === 'upvote') {
        setUpvotes(prev => prev + 1);
        setDownvotes(prev => Math.max(0, prev - 1)); // Prevent negative votes
      } else {
        setDownvotes(prev => prev + 1);
        setUpvotes(prev => Math.max(0, prev - 1)); // Prevent negative votes
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
      // Use unified voting endpoint with enhanced payload
      const payload = {
        votable_type: itemType,
        votable_id: itemId,
        vote_type: voteType,
        parent_id: parentId || null, // Include parent for comment votes
        // Remove user_id from payload as it might trigger cache issues
      };

      console.log('Sending vote request:', payload);
      
      // Try different voting endpoints based on item type
      let response;
      if (itemType === 'news') {
        response = await api.post(`/public/news/${itemId}/vote`, { vote_type: voteType });
      } else if (itemType === 'news_comment') {
        try {
          response = await api.post(`/public/news/comments/${itemId}/vote`, { vote_type: voteType });
        } catch (err) {
          // Only use fallback if the specific endpoint fails
          console.log('News comment vote failed, using fallback:', err.message);
          response = await api.post('/user/votes/', payload);
        }
      } else {
        // Use generic votes endpoint for other types
        response = await api.post('/user/votes/', payload);
      }
      
      // FIXED: Proper response validation that works with actual API response structure
      // The API returns success directly in response, not nested in response.data
      console.log('📄 Raw Response:', response);
      console.log('✅ API Success:', response.data || response);
      
      const isSuccess = response && (
        // Check if response has explicit success field (direct API response)
        response.success === true ||
        // Check if response.data has success field (axios wrapped response)
        response.data?.success === true ||
        // Fallback: if no explicit success field, check HTTP status (but not if explicit failure)
        (response.status >= 200 && response.status < 300 && 
         response.data?.success !== false && response.success !== false)
      );
      
      console.log('Vote response validation:', {
        responseSuccess: response?.success,
        dataSuccess: response?.data?.success,
        status: response?.status,
        isSuccess
      });
      
      if (isSuccess) {
        // Update state based on new vote counts from API
        // Handle both direct response and axios-wrapped response structures
        const responseData = response.data || response;
        const voteCounts = responseData?.vote_counts || responseData?.data?.vote_counts || responseData?.updated_stats;
        const newUserVote = responseData?.user_vote !== undefined ? responseData?.user_vote : 
                           (responseData?.data?.user_vote !== undefined ? responseData?.data?.user_vote : 
                           responseData?.vote_type);
        const action = responseData?.action || responseData?.data?.action;
        
        console.log('Vote response:', { voteCounts, newUserVote, action });
        
        if (voteCounts) {
          setUpvotes(Math.max(0, voteCounts.upvotes || 0)); // Ensure non-negative
          setDownvotes(Math.max(0, voteCounts.downvotes || 0)); // Ensure non-negative
        } else if (action) {
          // Calculate based on action if no counts provided
          if (action === 'removed') {
            setCurrentVote(null);
            if (oldVote === 'upvote') setUpvotes(Math.max(0, oldUpvotes - 1));
            if (oldVote === 'downvote') setDownvotes(Math.max(0, oldDownvotes - 1));
          } else if (action === 'created') {
            setCurrentVote(voteType);
            if (voteType === 'upvote') setUpvotes(oldUpvotes + 1);
            if (voteType === 'downvote') setDownvotes(oldDownvotes + 1);
          } else if (action === 'updated') {
            setCurrentVote(voteType);
            if (oldVote === 'upvote' && voteType === 'downvote') {
              setUpvotes(Math.max(0, oldUpvotes - 1));
              setDownvotes(oldDownvotes + 1);
            } else if (oldVote === 'downvote' && voteType === 'upvote') {
              setDownvotes(Math.max(0, oldDownvotes - 1));
              setUpvotes(oldUpvotes + 1);
            }
          }
        }
        
        if (newUserVote !== undefined) {
          setCurrentVote(newUserVote);
        }

        // Show success feedback
        const message = action === 'removed' ? 'Vote removed' : 
                       action === 'updated' ? 'Vote updated' : 'Vote recorded';
        showSuccessToast(message, 2000);

        // Trigger activity stats update for voting
        triggerVote();

        // Notify parent component
        if (onVoteChange) {
          onVoteChange({
            action: action || 'created',
            vote_counts: voteCounts || { upvotes, downvotes },
            user_vote: currentVote,
            score: upvotes - downvotes
          });
        }
      } else {
        // Handle API returning success=false
        console.warn('Vote request returned success=false:', response?.data);
        throw new Error(response?.data?.message || 'Vote request failed');
      }
    } catch (error) {
      console.error('Error voting:', error);
      
      // ENHANCED: Better error handling with specific messages
      let errorMessage = 'Failed to record vote';
      
      if (error.response?.status === 409) {
        errorMessage = 'You have already voted. Please refresh the page.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in again to vote';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to vote on this item';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message && error.message !== 'Network Error') {
        errorMessage = error.message;
      }
      
      // Rollback optimistic updates on error
      setUpvotes(oldUpvotes);
      setDownvotes(oldDownvotes);
      setCurrentVote(oldVote);
      
      // Show error feedback
      showErrorToast(errorMessage, 4000);
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
        >
          👍
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
        >
          👎
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
      >
        <span>👍</span>
        <span className="text-xs font-medium">{upvotes}</span>
      </button>


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
      >
        <span>👎</span>
        <span className="text-xs font-medium">{downvotes}</span>
      </button>
    </div>
  );
}

export default VotingButtons;