import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from './UserDisplay';
import ForumVotingButtons from './ForumVotingButtons';
import ForumMentionAutocomplete from './ForumMentionAutocomplete';
import MentionLink from './MentionLink';
import { safeString, safeErrorMessage, safeContent } from '../../utils/safeStringUtils';
import { MessageCircle, Reply, Edit3, Trash2, Flag, Clock, Award } from 'lucide-react';

const MatchComments = ({ matchId, navigateTo }) => {
  const { isAuthenticated, isAdmin, isModerator, api, user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyToComment, setReplyToComment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreComments, setHasMoreComments] = useState(false);
  const [totalComments, setTotalComments] = useState(0);
  const [matchInfo, setMatchInfo] = useState(null);

  // Safe wrapper function for string operations
  const safeString = (value) => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      if (value.message) return value.message;
      if (value.error && typeof value.error === 'string') return value.error;
      if (value.content) return String(value.content);
      return '';
    }
    return String(value);
  };

  const fetchComments = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      
      const timestamp = new Date().getTime();
      const response = await api.get(`/matches/${matchId}/comments?page=${page}&per_page=20&t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const responseData = response.data || response;
      const commentsData = responseData.data || [];
      const metaData = responseData.meta || {};
      
      if (page === 1) {
        setComments(commentsData);
      } else {
        setComments(prev => [...prev, ...commentsData]);
      }
      
      setHasMoreComments(metaData.has_more_pages || false);
      setTotalComments(metaData.total || commentsData.length);
      setCurrentPage(page);
      setMatchInfo(metaData.match || null);
      
    } catch (error) {
      console.error('❌ MatchComments: Failed to load comments:', error);
      if (page === 1) {
        setComments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [api, matchId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown';
    
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo`;
    
    const years = Math.floor(diffInMonths / 12);
    return `${years}y`;
  };

  const renderContentWithMentions = (content, mentions = []) => {
    const safeContent = safeString(content);
    if (!safeContent || typeof safeContent !== 'string') return null;
    
    const mentionMap = {};
    if (Array.isArray(mentions)) {
      mentions.forEach(mention => {
        if (typeof mention === 'object' && mention !== null) {
          const mentionText = safeString(mention.mention_text);
          if (mentionText) {
            mentionMap[mentionText] = {
              ...mention,
              type: safeString(mention.type) || 'user',
              id: mention.id || '',
              name: safeString(mention.name) || '',
              display_name: safeString(mention.display_name) || safeString(mention.name) || '',
              username: safeString(mention.username) || '',
              team_name: safeString(mention.team_name) || '',
              player_name: safeString(mention.player_name) || ''
            };
          }
        }
      });
    }
    
    const mentionPattern = /(@[a-zA-Z0-9_]+|@team:[a-zA-Z0-9_]+|@player:[a-zA-Z0-9_]+)/g;
    const parts = safeContent.split(mentionPattern);
    
    return parts.map((part, index) => {
      const mentionData = mentionMap[part];
      
      if (mentionData && mentionData.id) {
        return (
          <MentionLink
            key={index}
            mention={mentionData}
            navigateTo={navigateTo}
            onClick={(mention) => {
              const nav = {
                player: () => navigateTo('player-detail', { id: mention.id }),
                team: () => navigateTo('team-detail', { id: mention.id }),
                user: () => navigateTo('user-profile', { id: mention.id })
              };
              
              if (nav[mention.type]) {
                nav[mention.type]();
              }
            }}
          />
        );
      }
      
      if (part.match(mentionPattern)) {
        return (
          <span key={index} className="inline-flex items-center font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer" title="Mention">
            {part}
          </span>
        );
      }
      
      return part;
    });
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    const content = safeString(replyContent);
    if (!content.trim() || submitting) return;

    if (replyToComment?.id && replyToComment.id.toString().startsWith('temp-')) {
      alert('Please wait for the comment to be created before replying to it.');
      return;
    }

    const originalComments = [...comments];

    try {
      setSubmitting(true);
      
      // Create temporary comment for optimistic UI
      const tempComment = {
        id: `temp-${Date.now()}`,
        content: safeString(content.trim()),
        author: {
          ...user,
          name: safeString(user?.name),
          username: safeString(user?.username),
          email: safeString(user?.email),
          id: user?.id || null,
          avatar_url: safeString(user?.avatar_url)
        },
        meta: { created_at: new Date().toISOString() },
        is_temp: true,
        upvotes: 0,
        downvotes: 0,
        user_vote: null,
        mentions: [],
        stats: { upvotes: 0, downvotes: 0 },
        replies: []
      };

      // Add optimistic comment to UI
      if (replyToComment) {
        setComments(prevComments => prevComments.map(comment => {
          if (comment.id === replyToComment.id) {
            return {
              ...comment,
              replies: [...(comment.replies || []), tempComment]
            };
          }
          return comment;
        }));
      } else {
        setComments(prevComments => [...prevComments, tempComment]);
      }
      
      const payload = {
        content: safeString(content.trim()),
        parent_id: replyToComment?.id || null
      };
      
      const response = await api.post(`/matches/${matchId}/comments`, payload);
      
      const isSuccess = response.status === 201 || response.data?.success === true || 
                       (response.data && !response.data.error && response.data.comment);
      
      if (isSuccess) {
        setReplyContent('');
        setReplyToComment(null);
        
        const realComment = response.data.comment || response.data.data || response.data;
        if (realComment && (safeString(realComment.content) || realComment.id)) {
          const safeRealComment = {
            ...realComment,
            content: safeString(realComment.content),
            author: {
              ...realComment.author,
              name: safeString(realComment.author?.name),
              username: safeString(realComment.author?.username),
              id: realComment.author?.id || null,
              email: safeString(realComment.author?.email),
              avatar_url: safeString(realComment.author?.avatar_url)
            },
            mentions: Array.isArray(realComment.mentions) ? realComment.mentions.map(mention => {
              if (typeof mention === 'object' && mention !== null) {
                return {
                  ...mention,
                  mention_text: safeString(mention.mention_text),
                  name: safeString(mention.name),
                  display_name: safeString(mention.display_name),
                  type: safeString(mention.type),
                  id: mention.id || null,
                  username: safeString(mention.username),
                  team_name: safeString(mention.team_name),
                  player_name: safeString(mention.player_name)
                };
              } else {
                return {
                  mention_text: safeString(mention),
                  name: safeString(mention),
                  display_name: safeString(mention),
                  type: 'user',
                  id: null
                };
              }
            }) : [],
            meta: realComment.meta || {},
            stats: realComment.stats || {},
            upvotes: realComment.upvotes || 0,
            downvotes: realComment.downvotes || 0,
            user_vote: realComment.user_vote || null,
            replies: Array.isArray(realComment.replies) ? realComment.replies : []
          };

          if (replyToComment) {
            setComments(prevComments => prevComments.map(comment => {
              if (comment.id === replyToComment.id) {
                return {
                  ...comment,
                  replies: comment.replies.map(reply => 
                    reply.id === tempComment.id ? safeRealComment : reply
                  )
                };
              }
              return comment;
            }));
          } else {
            setComments(prevComments => prevComments.map(comment => 
              comment.id === tempComment.id ? safeRealComment : comment
            ));
          }
          
          // Update total count
          setTotalComments(prev => prev + 1);
        } else {
          await fetchComments(1);
        }
        
        const successMsg = document.createElement('div');
        successMsg.textContent = '✅ Comment posted successfully';
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
        
      } else {
        setComments(originalComments);
        console.error('❌ Comment submission failed:', response.data);
        const errorMsg = response.data?.message || response.data?.error || 'Failed to submit comment. Please try again.';
        alert(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Failed to submit comment:', error);
      setComments(originalComments);
      
      let errorMessage = 'Failed to submit comment. Please try again.';
      const safeErrorMsg = safeErrorMessage(error);
      
      if (safeErrorMsg.includes('401') || error.response?.status === 401) {
        errorMessage = 'Please log in again to post comments.';
      } else if (safeErrorMsg.includes('403') || error.response?.status === 403) {
        errorMessage = 'You do not have permission to comment on this match.';
      } else if (safeErrorMsg !== 'An unknown error occurred') {
        errorMessage = safeErrorMsg;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    const content = safeString(editContent);
    if (!content.trim()) return;

    try {
      setSubmitting(true);

      const response = await api.put(`/match-comments/${commentId}`, {
        content: content.trim()
      });

      if (response.data?.success) {
        setEditingComment(null);
        setEditContent('');
        await fetchComments(1);
      } else {
        alert('Failed to edit comment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to edit comment:', error);
      alert('Failed to edit comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    const originalComments = [...comments];

    try {
      setSubmitting(true);
      
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          return null;
        }
        
        if (comment.replies && comment.replies.length > 0) {
          const filteredReplies = comment.replies.filter(reply => reply.id !== commentId);
          return { ...comment, replies: filteredReplies };
        }
        
        return comment;
      }).filter(comment => comment !== null);
      
      setComments(updatedComments);

      const response = await api.delete(`/match-comments/${commentId}`);

      if (response.data?.success || response.success) {
        console.log('✅ Comment deleted successfully');
        setTotalComments(prev => Math.max(0, prev - 1));
        
        const successMessage = document.createElement('div');
        successMessage.textContent = '✅ Comment deleted successfully';
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(successMessage);
        setTimeout(() => document.body.removeChild(successMessage), 3000);
        
      } else {
        console.warn('⚠️ Delete request did not return success, rolling back');
        setComments(originalComments);
        alert('Failed to delete comment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to delete comment:', error);
      setComments(originalComments);
      
      let errorMessage = 'Failed to delete comment. Please try again.';
      const safeErrorMsg = safeErrorMessage(error);
      
      if (safeErrorMsg.includes('403') || error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this comment.';
      } else if (safeErrorMsg.includes('404') || error.response?.status === 404) {
        errorMessage = 'Comment not found or already deleted.';
      } else if (safeErrorMsg.includes('401') || error.response?.status === 401) {
        errorMessage = 'Please log in again to delete comments.';
      } else if (safeErrorMsg !== 'An unknown error occurred') {
        errorMessage = safeErrorMsg;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderComment = (comment, isReply = false, depth = 0) => {
    const maxDepth = 3;
    const shouldShowReplies = comment.replies && comment.replies.length > 0 && depth < maxDepth;
    const marginStyle = isReply ? { marginLeft: `${Math.min(depth * 2, 6)}rem` } : {};
    
    return (
      <div 
        key={comment.id}
        className={`${
          isReply ? 'pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''
        } py-4 ${depth > 0 ? 'bg-gray-50/50 dark:bg-gray-800/50 rounded-lg' : ''}`}
        style={marginStyle}
      >
        <div className="w-full">
          {/* User Info Header */}
          <div className="flex items-center space-x-3 mb-3">
            <UserDisplay
              user={comment.author}
              showAvatar={true}
              showHeroFlair={true}
              showTeamFlair={true}
              size="sm"
              clickable={false}
            />
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {formatTimeAgo(comment.meta?.created_at || comment.created_at)}
            </span>
            {comment.is_temp && (
              <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                Posting...
              </span>
            )}
            {comment.is_edited && !comment.is_temp && (
              <span className="text-xs text-gray-400 dark:text-gray-600">
                (edited {formatTimeAgo(comment.meta?.updated_at || comment.edited_at)})
              </span>
            )}
            {!comment.is_temp && (
              <ForumVotingButtons
                itemType="match-comment"
                itemId={comment.id}
                initialUpvotes={comment.stats?.upvotes || comment.upvotes || 0}
                initialDownvotes={comment.stats?.downvotes || comment.downvotes || 0}
                userVote={comment.user_vote}
                direction="horizontal"
                size="xs"
                onVoteChange={(voteData) => {
                  setComments(prevComments => prevComments.map(c => {
                    if (c.id === comment.id) {
                      return {
                        ...c,
                        stats: {
                          ...c.stats,
                          upvotes: voteData.vote_counts?.upvotes || c.stats?.upvotes || 0,
                          downvotes: voteData.vote_counts?.downvotes || c.stats?.downvotes || 0
                        },
                        upvotes: voteData.vote_counts?.upvotes || c.upvotes || 0,
                        downvotes: voteData.vote_counts?.downvotes || c.downvotes || 0,
                        user_vote: voteData.user_vote
                      };
                    }
                    return c;
                  }));
                }}
              />
            )}
          </div>

          {/* Comment Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            {safeContent(comment.content).split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {renderContentWithMentions(safeString(paragraph), comment.mentions || [])}
              </p>
            ))}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mb-3">
            {isAuthenticated && !comment.is_temp && (
              <button
                onClick={() => setReplyToComment(comment)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Reply className="w-3 h-3" />
                Reply
              </button>
            )}
            
            {(comment.author?.id === user?.id || isAdmin() || isModerator()) && (
              <>
                <button
                  onClick={() => handleEditComment(comment)}
                  className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  disabled={submitting}
                  className={`text-xs transition-colors flex items-center gap-1 ${
                    submitting 
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>

          {/* Reply Form */}
          {replyToComment?.id === comment.id && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <form onSubmit={handleSubmitComment}>
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Replying to @{comment.author?.username || comment.author?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyToComment(null)}
                    className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <ForumMentionAutocomplete
                  value={replyContent}
                  onChange={(value) => {
                    setReplyContent(value);
                  }}
                  placeholder="Write your reply... (Use @ to mention users, @team: for teams, @player: for players)"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setReplyToComment(null)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!safeString(replyContent).trim() || submitting}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Form */}
          {editingComment?.id === comment.id && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(comment.id); }}>
                <div className="mb-2">
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Editing comment
                  </span>
                  <button
                    type="button"
                    onClick={() => { setEditingComment(null); setEditContent(''); }}
                    className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => {
                    const value = typeof e === 'string' ? e : e.target?.value || '';
                    setEditContent(value);
                  }}
                  placeholder="Edit your comment..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => { setEditingComment(null); setEditContent(''); }}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!safeString(editContent).trim() || submitting}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Nested Replies */}
          {shouldShowReplies && (
            <div className="mt-4 space-y-2">
              {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
            </div>
          )}
          
          {/* Show collapsed replies indicator if max depth reached */}
          {comment.replies && comment.replies.length > 0 && depth >= maxDepth && (
            <div className="mt-3 ml-4">
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                View {comment.replies.length} more {comment.replies.length === 1 ? 'reply' : 'replies'}...
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && comments.length === 0) {
    return (
      <div className="card p-6">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">💬</div>
          <p className="text-gray-600 dark:text-gray-400">Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comments Header */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MessageCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Match Discussion
            </h2>
            <span className="px-2 py-1 text-xs font-bold rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
              {totalComments} {totalComments === 1 ? 'comment' : 'comments'}
            </span>
          </div>
          
          {matchInfo && (
            <div className="text-sm text-gray-500 dark:text-gray-500">
              {matchInfo.team1} vs {matchInfo.team2}
            </div>
          )}
        </div>

        {/* New Comment Form */}
        {isAuthenticated && !replyToComment && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Share Your Thoughts</h3>
            <form onSubmit={handleSubmitComment}>
              <ForumMentionAutocomplete
                value={replyContent}
                onChange={setReplyContent}
                placeholder="What did you think of this match? (Use @ to mention users, @team: for teams, @player: for players)"
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
              />
              <div className="flex justify-between items-center mt-3">
                <div className="text-sm text-gray-500 dark:text-gray-500">
                  Use @ for users, @team: for teams, @player: for players
                </div>
                <button
                  type="submit"
                  disabled={!safeString(replyContent).trim() || submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Posting...' : 'Post Comment'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Login Prompt for Unauthenticated Users */}
        {!isAuthenticated && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Join the Discussion</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Sign in to share your thoughts on this match.
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'))}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign In to Comment
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="card p-6">
              {renderComment(comment, false, 0)}
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMoreComments && (
        <div className="text-center">
          <button
            onClick={() => fetchComments(currentPage + 1)}
            disabled={loading}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Loading...' : 'Load More Comments'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && comments.length === 0 && (
        <div className="card p-6 text-center">
          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Comments Yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Be the first to share your thoughts on this match!
          </p>
          {isAuthenticated && (
            <button
              onClick={() => {
                const commentForm = document.querySelector('textarea[placeholder*="What did you think"]');
                if (commentForm) {
                  commentForm.focus();
                  commentForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Write First Comment
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MatchComments;