import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import UserDisplay from './UserDisplay';
import VotingButtons from './VotingButtons';
import MentionDropdown from './MentionDropdown';
import { processContentWithMentions } from '../../utils/mentionUtils';
import { formatTimeAgo } from '../../utils/dateUtils';

function CommentSystem({ 
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
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'best'
  const { api, user } = useAuth();

  // Mention autocomplete for main comment
  const {
    textareaRef: mainTextareaRef,
    dropdownRef: mainDropdownRef,
    showDropdown: showMainDropdown,
    mentionResults: mainMentionResults,
    selectedIndex: mainSelectedIndex,
    loading: mainMentionLoading,
    dropdownPosition: mainDropdownPosition,
    handleInputChange: handleMainInputChange,
    handleKeyDown: handleMainKeyDown,
    selectMention: selectMainMention
  } = useMentionAutocomplete();

  // Mention autocomplete for reply
  const {
    textareaRef: replyTextareaRef,
    dropdownRef: replyDropdownRef,
    showDropdown: showReplyDropdown,
    mentionResults: replyMentionResults,
    selectedIndex: replySelectedIndex,
    loading: replyMentionLoading,
    dropdownPosition: replyDropdownPosition,
    handleInputChange: handleReplyInputChange,
    handleKeyDown: handleReplyKeyDown,
    selectMention: selectReplyMention
  } = useMentionAutocomplete();

  useEffect(() => {
    fetchComments();
  }, [itemType, itemId, sortBy]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const endpoint = getCommentsEndpoint();
      const response = await api.get(`${endpoint}?sort=${sortBy}`);
      setComments(response.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const getCommentsEndpoint = () => {
    switch (itemType) {
      case 'news': return `/news/${itemId}/comments`;
      case 'match': return `/matches/${itemId}/comments`;
      case 'forum_thread': return `/forum/threads/${itemId}/posts`;
      default: return `/comments/${itemType}/${itemId}`;
    }
  };

  const getSubmitEndpoint = () => {
    switch (itemType) {
      case 'news': return `/user/news/${itemId}/comments`;
      case 'match': return `/matches/${itemId}/comments`;
      case 'forum_thread': return `/user/forum/threads/${itemId}/posts`;
      default: return `/comments/${itemType}/${itemId}`;
    }
  };

  const handleSubmitComment = async (parentId = null) => {
    const content = parentId ? replyText : newComment;
    if (!content.trim() || submitting) return;

    if (!user) {
      alert('Please log in to comment');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = getSubmitEndpoint();
      const response = await api.post(endpoint, {
        content: content.trim(),
        parent_id: parentId
      });

      if (response.data.success) {
        // Add the new comment to the list
        const newCommentData = response.data.data || response.data.comment;
        
        if (parentId) {
          // Add as reply
          setComments(prevComments => addReplyToComments(prevComments, parentId, newCommentData));
          setReplyText('');
          setReplyingTo(null);
        } else {
          // Add as top-level comment
          setComments(prevComments => [newCommentData, ...prevComments]);
          setNewComment('');
        }
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Failed to submit comment');
    } finally {
      setSubmitting(false);
    }
  };

  const addReplyToComments = (comments, parentId, newReply) => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [newReply, ...(comment.replies || [])],
          replies_count: (comment.replies_count || 0) + 1
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToComments(comment.replies, parentId, newReply)
        };
      }
      return comment;
    });
  };

  const handleVoteChange = (commentId, voteData) => {
    setComments(prevComments => updateCommentVotes(prevComments, commentId, voteData));
  };

  const updateCommentVotes = (comments, commentId, voteData) => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          upvotes: voteData.upvotes,
          downvotes: voteData.downvotes,
          user_vote: voteData.userVote
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentVotes(comment.replies, commentId, voteData)
        };
      }
      return comment;
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex space-x-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-300 rounded w-1/4"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Comment Form */}
      {user && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            <UserDisplay user={user} size="sm" />
            <div className="flex-1">
              <div className="relative">
                <textarea
                  ref={mainTextareaRef}
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    handleMainInputChange(e, null);
                  }}
                  onKeyDown={(e) => {
                    const result = handleMainKeyDown(e, null);
                    if (result?.selectMention) {
                      selectMainMention(result.selectMention, setNewComment, newComment);
                    }
                  }}
                  placeholder="Write a comment... (Type @ to mention someone)"
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="3"
                />
                <MentionDropdown
                  show={showMainDropdown}
                  results={mainMentionResults}
                  selectedIndex={mainSelectedIndex}
                  loading={mainMentionLoading}
                  position={mainDropdownPosition}
                  onSelect={(mention) => selectMainMention(mention, setNewComment, newComment)}
                  dropdownRef={mainDropdownRef}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-500">
                  {newComment.length}/1000 characters
                </span>
                <button
                  onClick={() => handleSubmitComment()}
                  disabled={submitting || !newComment.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</span>
        {['newest', 'oldest', 'best'].map(sort => (
          <button
            key={sort}
            onClick={() => setSortBy(sort)}
            className={`text-sm px-3 py-1 rounded-full transition-colors ${
              sortBy === sort
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            {sort.charAt(0).toUpperCase() + sort.slice(1)}
          </button>
        ))}
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map(comment => (
            <Comment
              key={comment.id}
              comment={comment}
              depth={0}
              maxDepth={maxDepth}
              itemType={itemType}
              itemId={itemId}
              onReply={(commentId) => setReplyingTo(commentId)}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={handleSubmitComment}
              onVoteChange={handleVoteChange}
              submitting={submitting}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Comment({ 
  comment, 
  depth, 
  maxDepth, 
  itemType, 
  itemId, 
  onReply, 
  replyingTo, 
  replyText, 
  setReplyText, 
  onSubmitReply, 
  onVoteChange,
  submitting 
}) {
  const { user } = useAuth();
  const [showReplies, setShowReplies] = useState(true);
  
  const marginLeft = Math.min(depth * 2, 8); // Max indent of 8rem
  const canReply = depth < maxDepth && user;
  const isReplying = replyingTo === comment.id;

  const handleVoteUpdate = (voteData) => {
    onVoteChange(comment.id, voteData);
  };

  return (
    <div 
      className={`border-l-2 border-gray-200 dark:border-gray-700 ${depth > 0 ? 'ml-4 pl-4' : ''}`}
      style={{ marginLeft: depth > 0 ? `${marginLeft}rem` : '0' }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <UserDisplay 
              user={comment.author || comment.user} 
              size="sm" 
              clickable={true}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.is_edited && (
              <span className="text-xs text-gray-400 italic">(edited)</span>
            )}
          </div>
          
          {/* Voting */}
          <VotingButtons
            itemType={itemType === 'forum_thread' ? 'forum_post' : `${itemType}_comment`}
            itemId={comment.id}
            parentId={itemId}
            initialUpvotes={comment.upvotes || 0}
            initialDownvotes={comment.downvotes || 0}
            userVote={comment.user_vote}
            onVoteChange={handleVoteUpdate}
            size="xs"
            direction="horizontal"
          />
        </div>

        {/* Comment Content */}
        <div className="prose dark:prose-invert max-w-none mb-3">
          <p className="text-gray-800 dark:text-gray-200">
            {comment.mentions && comment.mentions.length > 0 
              ? processContentWithMentions(comment.content, comment.mentions)
              : comment.content
            }
          </p>
        </div>

        {/* Comment Actions */}
        <div className="flex items-center space-x-4 text-sm">
          {canReply && (
            <button
              onClick={() => onReply(comment.id)}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              Reply
            </button>
          )}
          
          {comment.replies_count > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {showReplies ? 'Hide' : 'Show'} {comment.replies_count} {comment.replies_count === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex space-x-2">
              <UserDisplay user={user} size="xs" />
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    ref={replyTextareaRef}
                    value={replyText}
                    onChange={(e) => {
                      setReplyText(e.target.value);
                      handleReplyInputChange(e, null);
                    }}
                    onKeyDown={(e) => {
                      const result = handleReplyKeyDown(e, null);
                      if (result?.selectMention) {
                        selectReplyMention(result.selectMention, setReplyText, replyText);
                      }
                    }}
                    placeholder="Write a reply... (Type @ to mention someone)"
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
                    rows="2"
                  />
                  <MentionDropdown
                    show={showReplyDropdown}
                    results={replyMentionResults}
                    selectedIndex={replySelectedIndex}
                    loading={replyMentionLoading}
                    position={replyDropdownPosition}
                    onSelect={(mention) => selectReplyMention(mention, setReplyText, replyText)}
                    dropdownRef={replyDropdownRef}
                  />
                </div>
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => onReply(null)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onSubmitReply(comment.id)}
                    disabled={submitting || !replyText.trim()}
                    className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Nested Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map(reply => (
            <Comment
              key={reply.id}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              itemType={itemType}
              itemId={itemId}
              onReply={onReply}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={onSubmitReply}
              onVoteChange={onVoteChange}
              submitting={submitting}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentSystem;