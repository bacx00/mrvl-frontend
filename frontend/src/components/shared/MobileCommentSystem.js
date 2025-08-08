import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from './UserDisplay';
import ForumVotingButtons from './ForumVotingButtons';
import ForumMentionAutocomplete from './ForumMentionAutocomplete';
import { MessageCircle, Heart, Share2, MoreVertical, Reply, ChevronUp, ChevronDown, Smile } from 'lucide-react';

function MobileCommentSystem({ 
  itemType, // 'news', 'match', 'forum_thread'
  itemId,
  maxDepth = 5,
  className = ''
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showQuickReply, setShowQuickReply] = useState(false);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  const { api, user, isAuthenticated } = useAuth();
  const quickReplyRef = useRef(null);

  const commonEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🔥'];

  useEffect(() => {
    fetchComments();
  }, [itemType, itemId, sortBy]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/comments/${itemType}/${itemId}?sort=${sortBy}`);
      setComments(response.data?.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting || !isAuthenticated) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/comments/${itemType}/${itemId}`, {
        content: newComment.trim(),
        parent_id: replyingTo?.id || null
      });

      if (response.data?.success) {
        setNewComment('');
        setReplyText('');
        setReplyingTo(null);
        setShowQuickReply(false);
        await fetchComments();
      }
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickReply = (comment) => {
    setReplyingTo(comment);
    setReplyText(`@${comment.author?.name || comment.author?.username} `);
    setShowQuickReply(true);
    setTimeout(() => {
      quickReplyRef.current?.focus();
    }, 100);
  };

  const handleEmojiReaction = async (commentId, emoji) => {
    try {
      await api.post(`/comments/${commentId}/react`, {
        emoji: emoji,
        type: 'toggle'
      });
      await fetchComments();
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const toggleCommentExpansion = (commentId) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const renderComment = (comment, depth = 0) => {
    const isExpanded = expandedComments.has(comment.id);
    const hasReplies = comment.replies && comment.replies.length > 0;
    const canNest = depth < maxDepth;

    return (
      <div 
        key={comment.id} 
        className={`mobile-comment bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-3 ${
          depth > 0 ? 'ml-4' : ''
        }`}
      >
        {/* Comment Header */}
        <div className="p-4 pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <UserDisplay
                user={comment.author}
                showAvatar={true}
                showHeroFlair={false}
                showTeamFlair={true}
                size="sm"
                clickable={false}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatTimeAgo(comment.created_at)}
                  {comment.is_edited && (
                    <span className="ml-2 text-xs">(edited)</span>
                  )}
                </div>
              </div>
            </div>
            
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comment Content */}
        <div className="px-4 pb-3">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {comment.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Comment Actions */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Voting */}
              <ForumVotingButtons
                itemType="comment"
                itemId={comment.id}
                initialUpvotes={comment.upvotes || 0}
                initialDownvotes={comment.downvotes || 0}
                userVote={comment.user_vote}
                direction="horizontal"
                size="xs"
              />

              {/* Quick Reply */}
              <button
                onClick={() => handleQuickReply(comment)}
                className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 touch-optimized"
              >
                <Reply className="w-4 h-4" />
                <span className="text-sm">Reply</span>
              </button>

              {/* Share */}
              <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 touch-optimized">
                <Share2 className="w-4 h-4" />
                <span className="text-sm">Share</span>
              </button>
            </div>

            {/* Emoji Reactions */}
            <div className="flex items-center space-x-1">
              {comment.reactions && Object.entries(comment.reactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleEmojiReaction(comment.id, emoji)}
                  className="flex items-center space-x-1 px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-xs"
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              ))}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-8 gap-1">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      handleEmojiReaction(comment.id, emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-600 rounded touch-optimized"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Expand/Collapse Replies */}
        {hasReplies && (
          <div className="px-4 pb-2">
            <button
              onClick={() => toggleCommentExpansion(comment.id)}
              className="flex items-center space-x-2 text-blue-500 dark:text-blue-400 text-sm font-medium"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  <span>Hide {comment.replies.length} replies</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  <span>Show {comment.replies.length} replies</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Nested Replies */}
        {hasReplies && isExpanded && canNest && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="bg-gray-200 dark:bg-gray-700 h-20 rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className={`mobile-comment-system ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Comments ({comments.length})
          </h3>
          
          {/* Sort Options */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="best">Best</option>
          </select>
        </div>

        {isAuthenticated && (
          <button
            onClick={() => setShowQuickReply(!showQuickReply)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg touch-optimized"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Comment</span>
          </button>
        )}
      </div>

      {/* Quick Reply */}
      {showQuickReply && isAuthenticated && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmitComment}>
            <ForumMentionAutocomplete
              ref={quickReplyRef}
              value={replyingTo ? replyText : newComment}
              onChange={replyingTo ? setReplyText : setNewComment}
              placeholder={replyingTo ? `Replying to ${replyingTo.author?.name}...` : "Share your thoughts..."}
              rows={3}
              className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mobile-input-no-zoom"
            />
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-3">
                {replyingTo && (
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                      setShowQuickReply(false);
                    }}
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500"
                  >
                    Cancel Reply
                  </button>
                )}
              </div>
              
              <button
                type="submit"
                disabled={submitting || !(replyingTo ? replyText.trim() : newComment.trim())}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed touch-optimized"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length > 0 ? (
          comments.map(comment => renderComment(comment))
        ) : (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No comments yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Be the first to share your thoughts!</p>
            {isAuthenticated && (
              <button
                onClick={() => setShowQuickReply(true)}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 touch-optimized"
              >
                Add Comment
              </button>
            )}
          </div>
        )}
      </div>

      {/* Login Prompt */}
      {!isAuthenticated && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
          <p className="text-blue-800 dark:text-blue-200 mb-3">Sign in to join the discussion</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'))}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 touch-optimized"
          >
            Sign In
          </button>
        </div>
      )}
    </div>
  );
}

export default MobileCommentSystem;