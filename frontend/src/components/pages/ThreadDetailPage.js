import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function ThreadDetailPage({ params, navigateTo }) {
  const { user, isAuthenticated, api } = useAuth();
  const [thread, setThread] = useState(null);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [userReactions, setUserReactions] = useState({}); // CRITICAL FIX: Track user reactions

  const fetchThreadData = async () => {
    setLoading(true);
    try {
      console.log('🔍 ThreadDetailPage: Fetching REAL thread data for ID:', params.id);
      
      // ✅ FIXED: ONLY USE REAL BACKEND DATA - NO MOCK FALLBACK
      try {
        const threadResponse = await api.get(`/forums/threads/${params.id}`);
        const realThread = threadResponse?.data?.data || threadResponse?.data;
        
        if (realThread && realThread.id) {
          // Transform backend thread data to frontend format
          const transformedThread = {
            id: realThread.id,
            title: realThread.title,
            author: {
              id: realThread.user_id || realThread.author?.id || 1,
              name: realThread.user_name || realThread.author?.name || 'Anonymous',
              avatar: realThread.author?.avatar || "🎮",
              posts: realThread.author?.posts_count || 1,
              joined: realThread.author?.created_at || "2024-01-01",
              rank: realThread.author?.rank || "User"
            },
            content: realThread.content || "No content available",
            createdAt: realThread.created_at || new Date().toISOString(),
            views: realThread.views || realThread.views_count || 0,
            replies: realThread.replies || realThread.replies_count || 0,
            locked: realThread.locked || false,
            pinned: realThread.pinned || false,
            reactions: [
              { type: '👍', count: realThread.likes || 0, userReacted: false },
              { type: '👎', count: realThread.dislikes || 0, userReacted: false }
            ],
            posts: [] // Comments will be fetched separately if available
          };
          
          console.log('✅ ThreadDetailPage: Using REAL backend thread data');
          setThread(transformedThread);
          
          // Initialize expanded state and user reactions
          setExpandedReplies({});
          setUserReactions({});
          
          setLoading(false);
          return;
        }
      } catch (backendError) {
        console.error('❌ ThreadDetailPage: Backend thread not found:', backendError);
        
        // ✅ CRITICAL FIX: Handle 404 gracefully - don't show error alerts
        if (backendError.message.includes('404') || backendError.message.includes('Thread not found')) {
          setThread(null); // Show "not found" UI instead of error
          setError(`Thread #${params.id} was not found. It may have been deleted or moved.`);
        } else {
          setError('Unable to load thread. Please try again later.');
        }
      }
      
    } catch (error) {
      console.error('❌ ThreadDetailPage: Error fetching thread:', error);
      setThread(null); // ✅ NO MOCK DATA - Show error instead
    }
    setLoading(false);
  };

  useEffect(() => {
    if (params.id) {
      fetchThreadData();
    }
  }, [params.id]);

  // Enhanced reaction handling with 1 reaction per user limit
  const handleReaction = async (postId, type) => {
    if (!isAuthenticated) {
      window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'));
      return;
    }

    console.log(`🔗 ThreadDetailPage: Reacting to post ${postId} with ${type}`);
    
    const reactionKey = `${postId}-${type}`;
    const hasReacted = userReactions[reactionKey];
    
    // Update user reactions tracking
    const newUserReactions = { ...userReactions };
    
    // Clear all reactions for this post
    Object.keys(newUserReactions).forEach(key => {
      if (key.startsWith(`${postId}-`)) {
        delete newUserReactions[key];
      }
    });
    
    // Set new reaction if not removing
    if (!hasReacted) {
      newUserReactions[reactionKey] = true;
    }
    
    setUserReactions(newUserReactions);

    if (postId === 'main') {
      setThread(prev => ({
        ...prev,
        reactions: prev.reactions.map(reaction => {
          if (reaction.type === type) {
            const newCount = hasReacted ? reaction.count - 1 : reaction.count + 1;
            return { ...reaction, count: Math.max(0, newCount), userReacted: !hasReacted };
          } else {
            // Clear other reactions for main post
            const otherReactionKey = `main-${reaction.type}`;
            const hadOtherReaction = userReactions[otherReactionKey];
            if (hadOtherReaction) {
              return { ...reaction, count: Math.max(0, reaction.count - 1), userReacted: false };
            }
            return reaction;
          }
        })
      }));
    }
  };

  // Enhanced post submission with nested reply support
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPost.trim() || posting) return;

    setPosting(true);
    try {
      console.log(`Submitting ${replyingTo ? 'nested reply' : 'post'}:`, newPost);
      
      const newPostObj = {
        id: Date.now(),
        parentId: replyingTo,
        author: {
          id: user?.id || 999,
          name: user?.name || 'Anonymous',
          avatar: user?.avatar || "👤",
          posts: 1,
          joined: "2024-12-01",
          rank: "Rookie"
        },
        content: newPost,
        createdAt: new Date().toISOString(),
        reactions: [
          { type: '👍', count: 0, userReacted: false },
          { type: '👎', count: 0, userReacted: false }
        ],
        replies: []
      };

      if (replyingTo) {
        // Add nested reply
        const addNestedReply = (posts) => {
          return posts.map(post => {
            if (post.id === replyingTo) {
              return {
                ...post,
                replies: [...(post.replies || []), newPostObj]
              };
            }
            if (post.replies) {
              return { ...post, replies: addNestedReply(post.replies) };
            }
            return post;
          });
        };

        setThread(prev => ({
          ...prev,
          posts: addNestedReply(prev.posts),
          replies: prev.replies + 1
        }));

        // Auto-expand the parent comment to show new reply
        setExpandedReplies(prev => ({
          ...prev,
          [replyingTo]: true
        }));
      } else {
        // Add top-level comment
        setThread(prev => ({
          ...prev,
          posts: [...prev.posts, newPostObj],
          replies: prev.replies + 1
        }));
      }

      setNewPost('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Error posting reply:', error);
    }
    setPosting(false);
  };

  // Toggle nested replies visibility
  const toggleReplies = (postId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const ReactionButton = ({ reaction, postId }) => {
    const reactionKey = `${postId}-${reaction.type}`;
    const hasUserReacted = userReactions[reactionKey] || reaction.userReacted;
    
    return (
      <button
        onClick={() => handleReaction(postId, reaction.type)}
        className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
          hasUserReacted
            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
        }`}
        disabled={!isAuthenticated}
      >
        <span>{reaction.type}</span>
        <span className="font-medium">{reaction.count}</span>
      </button>
    );
  };

  // Enhanced PostCard with nested comment support
  const PostCard = ({ post, isMainPost = false, depth = 0 }) => {
    const hasReplies = post.replies && post.replies.length > 0;
    const isExpanded = expandedReplies[post.id];
    const maxDepth = 3;

    return (
      <div className={`${isMainPost ? '' : depth > 0 ? 'ml-8 border-l-2 border-gray-200 dark:border-gray-600 pl-4' : ''}`}>
        <div className={`flex space-x-3 ${isMainPost ? 'pb-4' : 'py-3'}`}>
          {/* Avatar Column */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm">
              {post.author.avatar}
            </div>
          </div>

          {/* Content Column */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium text-gray-900 dark:text-white text-sm">
                {post.author.name}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                {post.author.rank}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatDate(post.createdAt)}
              </span>
            </div>

            {/* Content */}
            <div className="text-sm text-gray-900 dark:text-white mb-3 leading-relaxed">
              {post.content}
            </div>

            {/* Actions Row */}
            <div className="flex items-center space-x-3">
              {/* Reactions */}
              <div className="flex items-center space-x-2">
                {post.reactions.map((reaction, index) => (
                  <ReactionButton
                    key={index}
                    reaction={reaction}
                    postId={isMainPost ? 'main' : post.id}
                  />
                ))}
              </div>

              {/* Reply button for nested comments */}
              {!isMainPost && depth < maxDepth && (
                <button
                  onClick={() => {
                    if (!isAuthenticated) {
                      window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'));
                      return;
                    }
                    setReplyingTo(post.id);
                  }}
                  className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  Reply
                </button>
              )}

              {/* Toggle replies button */}
              {hasReplies && (
                <button
                  onClick={() => toggleReplies(post.id)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {isExpanded ? 'Hide' : 'Show'} {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}
                </button>
              )}
            </div>
          </div>

          {/* Stats Column (for main post only) */}
          {isMainPost && (
            <div className="flex-shrink-0 text-right">
              <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
                <div>{post.author.posts} posts</div>
                <div>Joined {new Date(post.author.joined).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </div>

        {/* Nested Replies */}
        {hasReplies && isExpanded && (
          <div className="mt-2">
            {post.replies.map(reply => (
              <PostCard
                key={reply.id}
                post={reply}
                isMainPost={false}
                depth={depth + 1}
              />
            ))}
          </div>
        )}

        {/* Inline Reply Form */}
        {replyingTo === post.id && isAuthenticated && (
          <div className="mt-3 ml-11 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded p-3">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              Replying to @{post.author.name}
            </div>
            <form onSubmit={handlePostSubmit} className="space-y-2">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`Reply to ${post.author.name}...`}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setNewPost('');
                  }}
                  className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting || !newPost.trim()}
                  className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {posting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </form>
          </div>
        )}
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-4xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Post not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This forum thread could not be found or may have been deleted.
          </p>
          <button
            onClick={() => navigateTo && navigateTo('forums')}
            className="text-red-600 dark:text-red-400 hover:underline"
          >
            Back to Forums
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateTo && navigateTo('forums')}
            className="text-red-600 dark:text-red-400 hover:underline text-sm"
          >
            ← Back to Forums
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {thread.views.toLocaleString()} views • {thread.replies} replies
          </div>
        </div>
      </div>

      {/* Thread Content - VLR.gg Style */}
      <div className="card">
        {/* Thread Title */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            {thread.title}
          </h1>
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 dark:text-gray-500">
            {thread.pinned && (
              <span className="text-red-600 dark:text-red-400">📌 Pinned</span>
            )}
            {thread.locked && (
              <span className="text-yellow-600 dark:text-yellow-400">🔒 Locked</span>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {/* Main Post */}
          <div className="p-4">
            <PostCard post={{ ...thread, author: thread.author }} isMainPost={true} />
          </div>

          {/* Comments with Nested Replies */}
          {thread.posts.map(post => (
            <div key={post.id} className="p-4">
              <PostCard post={post} depth={0} />
            </div>
          ))}
        </div>
      </div>

      {/* Main Reply Form (only for top-level comments) */}
      {isAuthenticated && !thread.locked && !replyingTo ? (
        <div className="mt-4 card p-4">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Reply to Post</h3>
          <form onSubmit={handlePostSubmit} className="space-y-3">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            />
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Posting as {user?.name || 'Anonymous'}
              </div>
              <button
                type="submit"
                disabled={posting || !newPost.trim()}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      ) : !isAuthenticated ? (
        /* Sign-in prompt for non-authenticated users */
        <div className="mt-4 card p-4 text-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Join the Discussion</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
            Sign in to reply to this post and share your thoughts with the community.
          </p>
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'));
            }}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Sign In to Reply
          </button>
        </div>
      ) : thread.locked ? (
        <div className="mt-4 card p-4 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            This post is locked and no longer accepting replies.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default ThreadDetailPage;