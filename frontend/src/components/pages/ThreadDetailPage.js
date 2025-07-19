import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import MentionAutocomplete from '../shared/MentionAutocomplete';
import MentionLink from '../shared/MentionLink';

function ThreadDetailPage({ params, navigateTo }) {
  const threadId = params?.id;
  const { isAuthenticated, isAdmin, isModerator, api, user } = useAuth();
  const [thread, setThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [replyToPost, setReplyToPost] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');

  const fetchThreadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch thread details (includes posts)
      const threadResponse = await api.get(`/forums/threads/${threadId}`);
      
      const threadData = threadResponse.data?.data || threadResponse.data;
      const postsData = threadData.posts || [];
      
      console.log('✅ Thread loaded:', threadData);
      console.log('✅ Thread posts loaded:', postsData.length);
      
      setThread(threadData);
      setPosts(postsData);
      
    } catch (error) {
      console.error('❌ ThreadDetailPage: Backend API failed:', error);
      setThread(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [api, threadId]);

  useEffect(() => {
    fetchThreadData();
  }, [threadId, fetchThreadData]);

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
    if (!content) return null;
    
    // Create a map of mention texts to their data
    const mentionMap = {};
    mentions.forEach(mention => {
      mentionMap[mention.mention_text] = mention;
    });
    
    // Split content by mentions pattern
    const mentionPattern = /(@\w+|@team:\w+|@player:\w+)/g;
    const parts = content.split(mentionPattern);
    
    return parts.map((part, index) => {
      const mentionData = mentionMap[part];
      
      if (mentionData) {
        return (
          <MentionLink
            key={index}
            mention={mentionData}
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
      
      // For unlinked mentions, still style them
      if (part.match(mentionPattern)) {
        return (
          <span key={index} className="text-red-600 dark:text-red-400 font-medium">
            {part}
          </span>
        );
      }
      
      return part;
    });
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      
      const payload = {
        content: replyContent.trim(),
        parent_id: replyToPost?.id || null
      };
      
      // Optimistic update - add the reply immediately
      const tempReply = {
        id: `temp-${Date.now()}`, // Temporary ID
        content: replyContent.trim(),
        author: user,
        stats: { score: 0, upvotes: 0, downvotes: 0 },
        meta: { created_at: new Date().toISOString(), edited: false },
        mentions: [],
        user_vote: null,
        replies: [],
        is_temp: true // Mark as temporary
      };

      // Add to appropriate location
      if (replyToPost?.id) {
        // Add as nested reply
        setPosts(prevPosts => 
          prevPosts.map(post => {
            if (post.id === replyToPost.id) {
              return {
                ...post,
                replies: [...(post.replies || []), tempReply]
              };
            }
            return post;
          })
        );
      } else {
        // Add as top-level post
        setPosts(prevPosts => [...prevPosts, tempReply]);
      }

      const response = await api.post(`/user/forums/threads/${threadId}/posts`, payload);
      
      if (response.data?.success) {
        setReplyContent('');
        setReplyToPost(null);
        
        // Always refresh to get the complete post data and updated counts
        await fetchThreadData();
      } else {
        // Remove optimistic update on failure
        if (replyToPost?.id) {
          setPosts(prevPosts => 
            prevPosts.map(post => {
              if (post.id === replyToPost.id) {
                return {
                  ...post,
                  replies: (post.replies || []).filter(r => r.id !== tempReply.id)
                };
              }
              return post;
            })
          );
        } else {
          setPosts(prevPosts => prevPosts.filter(p => p.id !== tempReply.id));
        }
      }
      
    } catch (error) {
      console.error('❌ Failed to submit reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = async (postId) => {
    if (!editContent.trim()) return;

    try {
      setSubmitting(true);
      
      // Optimistic update
      setPosts(prevPosts => 
        prevPosts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              content: editContent.trim(),
              meta: { ...post.meta, edited: true, updated_at: new Date().toISOString() }
            };
          }
          return post;
        })
      );

      const response = await api.put(`/user/forums/posts/${postId}`, {
        content: editContent.trim()
      });

      if (response.data?.success) {
        setEditingPost(null);
        setEditContent('');
        // Refresh to get server data
        await fetchThreadData();
      } else {
        // Revert optimistic update on failure
        await fetchThreadData();
      }
    } catch (error) {
      console.error('❌ Failed to edit post:', error);
      alert('Failed to edit post. Please try again.');
      // Revert optimistic update on error
      await fetchThreadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      setSubmitting(true);
      
      // Optimistic update - hide the post immediately
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

      const response = await api.delete(`/user/forums/posts/${postId}`);

      if (response.data?.success) {
        // Post successfully deleted - keep it hidden
        await fetchThreadData(); // Refresh to update counts
      } else {
        // Revert optimistic update on failure
        await fetchThreadData();
      }
    } catch (error) {
      console.error('❌ Failed to delete post:', error);
      alert('Failed to delete post. Please try again.');
      // Revert optimistic update on error
      await fetchThreadData();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinThread = async () => {
    try {
      const endpoint = thread.pinned 
        ? `/admin/forums/threads/${threadId}/unpin`
        : `/admin/forums/threads/${threadId}/pin`;
      
      const response = await api.post(endpoint);
      
      if (response.data?.success) {
        setThread(prev => ({ ...prev, pinned: !prev.pinned }));
      } else {
        alert('Failed to update thread pin status');
      }
    } catch (error) {
      console.error('❌ Failed to pin/unpin thread:', error);
      alert('Failed to update thread pin status');
    }
  };

  const handleLockThread = async () => {
    try {
      const endpoint = thread.locked 
        ? `/admin/forums/threads/${threadId}/unlock`
        : `/admin/forums/threads/${threadId}/lock`;
      
      const response = await api.post(endpoint);
      
      if (response.data?.success) {
        setThread(prev => ({ ...prev, locked: !prev.locked }));
      } else {
        alert('Failed to update thread lock status');
      }
    } catch (error) {
      console.error('❌ Failed to lock/unlock thread:', error);
      alert('Failed to update thread lock status');
    }
  };

  const renderPost = (post, isReply = false, depth = 0) => {
    const maxDepth = 3; // Limit nesting depth for readability
    const shouldShowReplies = post.replies && post.replies.length > 0 && depth < maxDepth;
    
    // Use inline style for dynamic margin instead of class
    const marginStyle = isReply ? { marginLeft: `${Math.min(depth * 2, 6)}rem` } : {};
    
    return (
      <div 
        key={post.id}
        className={`${
          isReply ? 'pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''
        } py-4 ${depth > 0 ? 'bg-gray-50/50 dark:bg-gray-800/50 rounded-lg' : ''}`}
        style={marginStyle}
      >
        <div className="w-full">
          {/* User Info Header */}
          <div className="flex items-center space-x-3 mb-3">
            <UserDisplay
              user={post.author}
              showAvatar={true}
              showHeroFlair={true}
              showTeamFlair={true}
              size="sm"
              clickable={false}
            />
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {formatTimeAgo(post.meta?.created_at || post.created_at)}
            </span>
            {post.is_edited && (
              <span className="text-xs text-gray-400 dark:text-gray-600">
                (edited {formatTimeAgo(post.meta?.updated_at || post.edited_at)})
              </span>
            )}
            {/* Voting buttons right after username info */}
            <VotingButtons
              itemType="forum_post"
              itemId={post.id}
              parentId={threadId}
              initialUpvotes={post.stats?.upvotes || post.upvotes || 0}
              initialDownvotes={post.stats?.downvotes || post.downvotes || 0}
              userVote={post.user_vote}
              direction="horizontal"
              size="xs"
            />
          </div>

          {/* Post Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {renderContentWithMentions(paragraph, post.mentions || [])}
              </p>
            ))}
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-4 mb-3">
            {/* Reply Button */}
            {isAuthenticated && (
              <button
                onClick={() => setReplyToPost(post)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Reply
              </button>
            )}
            
            {/* Edit Button */}
            {(post.author?.id === user?.id || isAdmin() || isModerator()) && (
              <button
                onClick={() => handleEditPost(post)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Edit
              </button>
            )}

            {/* Delete Button */}
            {(post.author?.id === user?.id || isAdmin() || isModerator()) && (
              <button
                onClick={() => handleDeletePost(post.id)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyToPost?.id === post.id && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <form onSubmit={handleSubmitReply}>
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Replying to @{post.author?.username || post.author?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyToPost(null)}
                    className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <MentionAutocomplete
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  rows={3}
                  className="p-2"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setReplyToPost(null)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || submitting}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Posting...' : 'Reply'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Edit Form */}
          {editingPost?.id === post.id && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
              <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(post.id); }}>
                <div className="mb-2">
                  <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                    Editing post
                  </span>
                  <button
                    type="button"
                    onClick={() => { setEditingPost(null); setEditContent(''); }}
                    className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your post..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => { setEditingPost(null); setEditContent(''); }}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editContent.trim() || submitting}
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
              {post.replies.map(reply => renderPost(reply, true, depth + 1))}
            </div>
          )}
          
          {/* Show collapsed replies indicator if max depth reached */}
          {post.replies && post.replies.length > 0 && depth >= maxDepth && (
            <div className="mt-3 ml-4">
              <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                View {post.replies.length} more {post.replies.length === 1 ? 'reply' : 'replies'}...
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };


  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">💬</div>
          <p className="text-gray-600 dark:text-gray-400">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">❌</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Thread Not Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The requested thread could not be found or has been deleted.
        </p>
        <button
          onClick={() => navigateTo && navigateTo('forums')}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Back to Forums
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
        <button
          onClick={() => navigateTo && navigateTo('forums')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Forums
        </button>
        <span>/</span>
        <span 
          className="px-2 py-0.5 text-xs font-bold rounded-full text-white"
          style={{ backgroundColor: thread.category?.color || '#6b7280' }}
        >
          {thread.category?.icon} {thread.category?.name}
        </span>
        <span>/</span>
        <span className="text-gray-900 dark:text-white font-medium truncate">
          {thread.title}
        </span>
      </div>

      {/* Thread Header */}
      <div className="card p-6 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 min-w-0">
            {/* Thread badges */}
            <div className="flex items-center space-x-2 mb-3">
              {thread.pinned && (
                <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                  📌 PINNED
                </span>
              )}
              {thread.locked && (
                <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                  🔒 LOCKED
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {thread.title}
            </h1>

            {/* Author & Stats */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500 dark:text-gray-500">Started by</span>
                <UserDisplay
                  user={thread.author}
                  showAvatar={true}
                  showHeroFlair={true}
                  showTeamFlair={true}
                  size="sm"
                  clickable={false}
                />
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  {formatTimeAgo(thread.meta?.created_at || thread.created_at)}
                </span>
                {/* Thread voting buttons below username */}
                <VotingButtons
                  itemType="forum_thread"
                  itemId={thread.id}
                  initialUpvotes={thread.stats?.upvotes || 0}
                  initialDownvotes={thread.stats?.downvotes || 0}
                  userVote={thread.user_vote}
                  direction="horizontal"
                  size="xs"
                />
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <span className="font-medium">{posts.length}</span>
                  <span>replies</span>
                </div>
              </div>
            </div>

            {/* Original Content */}
            {thread.content && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {thread.content.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2 last:mb-0">
                      {renderContentWithMentions(paragraph, thread.mentions || [])}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Controls */}
            {(isAdmin() || isModerator()) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin:</span>
                  <button
                    onClick={() => handlePinThread()}
                    className={`px-3 py-1 text-xs rounded ${
                      thread.pinned 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    } hover:opacity-80 transition-opacity`}
                  >
                    {thread.pinned ? '📌 Unpin' : '📌 Pin'}
                  </button>
                  <button
                    onClick={() => handleLockThread()}
                    className={`px-3 py-1 text-xs rounded ${
                      thread.locked 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    } hover:opacity-80 transition-opacity`}
                  >
                    {thread.locked ? '🔒 Unlock' : '🔒 Lock'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length > 0 && (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="card p-6">
              {renderPost(post, false, 0)}
            </div>
          ))}
        </div>
      )}

      {/* Reply Form */}
      {isAuthenticated && !thread.locked && !replyToPost && (
        <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Post Reply</h3>
          <form onSubmit={handleSubmitReply}>
            <MentionAutocomplete
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
              className="p-3"
            />
            <div className="flex justify-between items-center mt-3">
              <div className="text-sm text-gray-500 dark:text-gray-500">
                Use @username to mention someone
              </div>
              <button
                type="submit"
                disabled={!replyContent.trim() || submitting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Login Prompt for Unauthenticated Users */}
      {!isAuthenticated && !thread.locked && (
        <div className="card p-6 mt-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Join the Discussion</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Sign in to reply to this thread and join the conversation.
          </p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'))}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sign In to Reply
          </button>
        </div>
      )}

      {/* Locked Notice */}
      {thread.locked && (
        <div className="card p-6 mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-2 text-red-800 dark:text-red-300">
            <span className="text-lg">🔒</span>
            <span className="font-medium">This thread is locked</span>
          </div>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            No new replies can be posted to this thread.
          </p>
        </div>
      )}

    </div>
  );
}

export default ThreadDetailPage;