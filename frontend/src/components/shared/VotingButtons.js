import React, { useState } from 'react';
import { useAuth } from '../../hooks';

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
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [currentVote, setCurrentVote] = useState(userVote);
  const [loading, setLoading] = useState(false);

  const sizeClasses = {
    xs: 'p-1 text-xs',
    sm: 'p-1.5 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };

  const getVoteEndpoint = () => {
    switch (itemType) {
      case 'news':
        return `/user/news/${parentId || itemId}/vote`;
      case 'news_comment':
        return `/user/news/comments/${itemId}/vote`;
      case 'forum_thread':
        return `/user/forums/threads/${itemId}/vote`;
      case 'forum_post':
        return `/user/forums/posts/${itemId}/vote`;
      case 'match_comment':
        return `/user/matches/comments/${itemId}/vote`;
      default:
        throw new Error(`Unknown item type: ${itemType}`);
    }
  };

  const handleVote = async (voteType) => {
    if (!isAuthenticated) {
      alert('Please log in to vote');
      return;
    }

    if (loading) return;

    // Prevent voting on temporary items
    if (itemId && itemId.toString().startsWith('temp-')) {
      alert('Please wait for the post to be created before voting');
      return;
    }

    setLoading(true);
    try {
      const endpoint = getVoteEndpoint();
      
      // Check if user is clicking the same vote to toggle it off
      const isTogglingOff = currentVote === voteType;
      
      // If toggling off, we send the same vote type again
      // The backend should handle this as a toggle/removal
      const payload = {
        vote_type: voteType
      };

      // Add specific ID for posts and comments
      if (itemType === 'forum_post') {
        payload.post_id = itemId;
      } else if (itemType.includes('comment')) {
        payload.comment_id = itemId;
      }

      console.log('Voting:', {
        currentVote,
        voteType,
        isTogglingOff,
        payload
      });
      
      const response = await api.post(endpoint, payload);
      
      console.log('Vote response:', response);
      
      if (response?.success) {
        // Update local state based on vote action
        if (response.action === 'removed') {
          // Vote was removed
          if (currentVote === 'upvote') {
            setUpvotes(prev => prev - 1);
          } else if (currentVote === 'downvote') {
            setDownvotes(prev => prev - 1);
          }
          setCurrentVote(null);
        } else if (response.action === 'voted') {
          // New vote was added (no previous vote)
          if (voteType === 'upvote') {
            setUpvotes(prev => prev + 1);
          } else {
            setDownvotes(prev => prev + 1);
          }
          setCurrentVote(voteType);
        } else if (response.action === 'changed') {
          // Vote was changed from one type to another
          if (currentVote === 'upvote' && voteType === 'downvote') {
            setUpvotes(prev => prev - 1);
            setDownvotes(prev => prev + 1);
          } else if (currentVote === 'downvote' && voteType === 'upvote') {
            setDownvotes(prev => prev - 1);
            setUpvotes(prev => prev + 1);
          }
          setCurrentVote(voteType);
        }

        // Notify parent component with the NEW state
        if (onVoteChange) {
          let newVote = currentVote;
          let newUpvotes = upvotes;
          let newDownvotes = downvotes;
          
          if (response.action === 'removed') {
            newVote = null;
            if (currentVote === 'upvote') {
              newUpvotes = upvotes - 1;
            } else if (currentVote === 'downvote') {
              newDownvotes = downvotes - 1;
            }
          } else if (response.action === 'voted') {
            newVote = voteType;
            if (voteType === 'upvote') {
              newUpvotes = upvotes + 1;
            } else {
              newDownvotes = downvotes + 1;
            }
          } else if (response.action === 'changed') {
            newVote = voteType;
            if (currentVote === 'upvote' && voteType === 'downvote') {
              newUpvotes = upvotes - 1;
              newDownvotes = downvotes + 1;
            } else if (currentVote === 'downvote' && voteType === 'upvote') {
              newDownvotes = downvotes - 1;
              newUpvotes = upvotes + 1;
            }
          }
          
          onVoteChange(newVote, {
            upvotes: newUpvotes,
            downvotes: newDownvotes,
            action: response.action
          });
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to record vote');
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
          className={`${sizeClasses[size]} rounded transition-colors ${
            currentVote === 'upvote'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          className={`${sizeClasses[size]} rounded transition-colors ${
            currentVote === 'downvote'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
        className={`${sizeClasses[size]} rounded transition-colors flex items-center space-x-1 ${
          currentVote === 'upvote'
            ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-green-600 dark:hover:text-green-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span>👍</span>
        <span className="text-xs">{upvotes}</span>
      </button>


      {/* Downvote */}
      <button
        onClick={() => handleVote('downvote')}
        disabled={loading}
        className={`${sizeClasses[size]} rounded transition-colors flex items-center space-x-1 ${
          currentVote === 'downvote'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-red-600 dark:hover:text-red-400'
        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <span>👎</span>
        <span className="text-xs">{downvotes}</span>
      </button>
    </div>
  );
}

export default VotingButtons;