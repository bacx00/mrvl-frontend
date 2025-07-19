import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import VotingButtons from './VotingButtons';
import { formatTimeAgo } from '../../lib/utils';

function CommentSystemSimple({ 
  itemType, // 'news', 'match', 'forum_thread'
  itemId,
  className = ''
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { api, user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [itemType, itemId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const endpoint = getCommentsEndpoint();
      const response = await api.get(endpoint);
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

  const handleSubmitComment = async (parentId = null) => {
    const content = parentId ? replyText : newComment;
    if (!content.trim() || submitting) return;

    if (!user) {
      alert('Please log in to comment');
      return;
    }

    try {
      setSubmitting(true);
      const endpoint = itemType === 'news' 
        ? `/news/${itemId}/comments`
        : itemType === 'match'
        ? `/matches/${itemId}/comments`
        : `/forums/threads/${itemId}/posts`;
        
      const response = await api.post(endpoint, {
        content,
        parent_id: parentId
      });

      if (response.data) {
        // Add new comment to list
        if (parentId) {
          // Find parent and add reply
          const updateReplies = (comments) => {
            return comments.map(comment => {
              if (comment.id === parentId) {
                return {
                  ...comment,
                  replies: [...(comment.replies || []), response.data],
                  replies_count: (comment.replies_count || 0) + 1
                };
              }
              if (comment.replies) {
                return {
                  ...comment,
                  replies: updateReplies(comment.replies)
                };
              }
              return comment;
            });
          };
          setComments(updateReplies(comments));
          setReplyText('');
          setReplyingTo(null);
        } else {
          setComments([response.data, ...comments]);
          setNewComment('');
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-[#2b3d4d] rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-[#2b3d4d] rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Comment Form */}
      {user && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-3 bg-[#0f1419] border border-[#2b3d4d] rounded-lg text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none resize-none"
            rows="3"
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={() => handleSubmitComment()}
              disabled={submitting || !newComment.trim()}
              className="px-4 py-2 bg-[#fa4454] text-white rounded-lg hover:bg-[#e03e4e] disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-[#768894]">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          comments.map((comment, index) => (
            <CommentSimple
              key={comment.id}
              comment={comment}
              commentNumber={index + 1}
              onReply={() => setReplyingTo(comment.id)}
              replyingTo={replyingTo}
              replyText={replyText}
              setReplyText={setReplyText}
              onSubmitReply={handleSubmitComment}
              submitting={submitting}
              itemType={itemType}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CommentSimple({ 
  comment, 
  commentNumber,
  onReply, 
  replyingTo, 
  replyText, 
  setReplyText, 
  onSubmitReply,
  submitting,
  itemType,
  isReply = false
}) {
  const { user } = useAuth();
  const isReplying = replyingTo === comment.id;

  return (
    <>
      <div className={`flex space-x-3 ${isReply ? 'ml-12' : ''}`}>
        {/* Comment Number */}
        <div className="text-[#768894] text-sm font-medium pt-1">
          #{commentNumber}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Author Header */}
          <div className="flex items-center space-x-3 mb-2">
            {/* Avatar */}
            <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {comment.author?.username?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>

            {/* Username */}
            <span className="font-medium text-[#fa4454]">
              {comment.author?.username || 'Anonymous'}
            </span>

            {/* Reply indicator */}
            {comment.parent_username && (
              <span className="text-[#768894] text-sm">
                replying to <span className="text-[#fa4454]">@{comment.parent_username}</span>
              </span>
            )}

            {/* Timestamp */}
            <time className="text-[#768894] text-sm ml-auto">
              {formatTimeAgo(new Date(comment.created_at))}
            </time>
          </div>

          {/* Comment Content */}
          <div className="text-white mb-3">
            {comment.content}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4">
            {/* Voting */}
            <VotingButtons
              itemType={itemType === 'forum_thread' ? 'forum_post' : `${itemType}_comment`}
              itemId={comment.id}
              initialUpvotes={comment.upvotes || 0}
              initialDownvotes={comment.downvotes || 0}
              userVote={comment.user_vote}
              size="xs"
              direction="horizontal"
            />

            {/* Reply Button */}
            {user && !isReply && (
              <button
                onClick={onReply}
                className="text-[#768894] hover:text-[#fa4454] text-sm transition-colors"
              >
                reply
              </button>
            )}
          </div>

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply..."
                className="w-full p-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none resize-none text-sm"
                rows="2"
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => {
                    setReplyText('');
                    onReply();
                  }}
                  className="px-3 py-1 text-sm text-[#768894] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={submitting || !replyText.trim()}
                  className="px-3 py-1 text-sm bg-[#fa4454] text-white rounded hover:bg-[#e03e4e] disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3 mt-3">
          {comment.replies.map((reply, index) => (
            <CommentSimple
              key={reply.id}
              comment={reply}
              commentNumber={`${commentNumber}.${index + 1}`}
              isReply={true}
              itemType={itemType}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default CommentSystemSimple;