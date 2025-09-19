import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from '../shared/UserDisplay';
import ForumVotingButtons from '../shared/ForumVotingButtons';
import ForumMentionAutocomplete from '../shared/ForumMentionAutocomplete';
import MentionLink from '../shared/MentionLink';
import MobileForumThread from '../mobile/MobileForumThread';
import MobileTextEditor from '../mobile/MobileTextEditor';
import { safeString, safeErrorMessage, safeContent } from '../../utils/safeStringUtils';

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
  
  // Mobile-specific state
  const [showMobileReplyEditor, setShowMobileReplyEditor] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  // Safe wrapper function for string operations
  const safeString = (value) => {
    if (typeof value === 'string') return value;
    if (value === null || value === undefined) return '';
    // Handle objects that might be displayed as [object Object]
    if (typeof value === 'object') {
      // If it's an error object, extract the message
      if (value.message) return value.message;
      if (value.error && typeof value.error === 'string') return value.error;
      // If it has a content property, use that
      if (value.content) return String(value.content);
      // Fallback to empty string to prevent [object Object]
      return '';
    }
    return String(value);
  };

  const fetchThreadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const threadResponse = await api.get(`/public/forums/threads/${threadId}?t=${timestamp}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      const threadData = threadResponse.data?.data || threadResponse.data;
      const postsData = threadData.posts || [];
      
      // Validate that we got valid thread data
      if (!threadData || !threadData.id) {
        console.error(`❌ Invalid thread data received for thread ${threadId}`);
        setThread(null);
        setPosts([]);
        return;
      }
      
      // Thread data loaded successfully
      setThread(threadData);
      setPosts(postsData);
      
      // Check if there are more posts to load
      setHasMorePosts(postsData.length >= 20); // Assuming 20 posts per page
      
    } catch (error) {
      console.error('❌ ThreadDetailPage: Backend API failed:', error);
      
      if (error.response?.status === 404) {
        console.error(`❌ Thread ${threadId} not found (404)`);
      } else if (error.response?.status === 403) {
        console.error(`❌ Access denied to thread ${threadId} (403)`);
      }
      
      setThread(null);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [api, threadId]);

  useEffect(() => {
    fetchThreadData();
  }, [fetchThreadData]);

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
    // First, ensure content is safely converted - this prevents [object Object] display
    const safeContent = safeString(content);
    if (!safeContent || typeof safeContent !== 'string') return null;
    
    // Create a map of mention texts to their data with comprehensive safe string extraction
    const mentionMap = {};
    if (Array.isArray(mentions)) {
      mentions.forEach(mention => {
        // Handle case where mention might be an object or primitive
        if (typeof mention === 'object' && mention !== null) {
          const mentionText = safeString(mention.mention_text);
          if (mentionText) {
            mentionMap[mentionText] = {
              ...mention,
              // Ensure all mention properties are safely extracted to prevent [object Object]
              type: safeString(mention.type) || 'user',
              id: mention.id || '',
              name: safeString(mention.name) || '',
              display_name: safeString(mention.display_name) || safeString(mention.name) || '',
              username: safeString(mention.username) || '',
              team_name: safeString(mention.team_name) || '',
              player_name: safeString(mention.player_name) || ''
            };
          }
        } else {
          // Handle primitive mentions safely
          const mentionText = safeString(mention);
          if (mentionText) {
            mentionMap[mentionText] = {
              mention_text: mentionText,
              type: 'user',
              id: '',
              name: mentionText,
              display_name: mentionText
            };
          }
        }
      });
    }
    
    // Process content to replace mentions with clickable components
    if (!mentions || mentions.length === 0) return safeContent;
    
    // Sort mentions by position to process them in order
    const sortedMentions = [...mentions].sort((a, b) => 
      (a.position_start || 0) - (b.position_start || 0)
    );
    
    const elements = [];
    let lastIndex = 0;
    
    sortedMentions.forEach((mention) => {
      const mentionText = mention.mention_text;
      const startPos = safeContent.indexOf(mentionText, lastIndex);
      
      if (startPos !== -1) {
        // Add text before mention
        if (startPos > lastIndex) {
          elements.push(safeContent.slice(lastIndex, startPos));
        }
        
        // Add the mention as a clickable component
        elements.push(
          <MentionLink
            key={`mention-${startPos}-${mention.id}`}
            mention={mention}
            navigateTo={navigateTo}
          />
        );
        
        lastIndex = startPos + mentionText.length;
      }
    });
    
    // Add remaining text
    if (lastIndex < safeContent.length) {
      elements.push(safeContent.slice(lastIndex));
    }
    
    return elements.length > 0 ? elements : safeContent;
  };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    // Ensure replyContent is a string and has content
    const content = safeString(replyContent);
    if (!content.trim() || submitting) return;

    // Check if replying to a temporary post
    if (replyToPost?.id && replyToPost.id.toString().startsWith('temp-')) {
      alert('Please wait for the post to be created before replying to it.');
      return;
    }

    // Store original posts for rollback
    const originalPosts = [...posts];

    try {
      setSubmitting(true);
      
      // ENHANCED: Add optimistic UI update for replies with safe object handling
      const tempReply = {
        id: `temp-${Date.now()}`,
        content: safeString(content.trim()), // Ensure content is safely converted
        author: {
          // Safely extract user properties to prevent [object Object] display
          ...user,
          name: safeString(user?.name),
          username: safeString(user?.username),
          email: safeString(user?.email),
          id: user?.id || null,
          avatar_url: safeString(user?.avatar_url)
        },
        meta: { created_at: new Date().toISOString() },
        is_temp: true, // Mark as temporary
        upvotes: 0,
        downvotes: 0,
        user_vote: null,
        mentions: [], // Empty array for temp posts
        stats: { upvotes: 0, downvotes: 0 },
        replies: []
      };

      // Add optimistic reply to UI
      if (replyToPost) {
        // Add as nested reply
        setPosts(prevPosts => prevPosts.map(post => {
          if (post.id === replyToPost.id) {
            return {
              ...post,
              replies: [...(post.replies || []), tempReply]
            };
          }
          return post;
        }));
      } else {
        // Add as top-level post
        setPosts(prevPosts => [...prevPosts, tempReply]);
      }
      
      const payload = {
        content: safeString(content.trim()), // Ensure payload content is safely converted
        parent_id: replyToPost?.id || null
      };
      
      const response = await api.post(`/user/forums/threads/${threadId}/posts`, payload);
      
      // Check for success with multiple conditions - API might return 201 without success flag
      const isSuccess = response.status === 201 || response.data?.success === true || 
                       (response.data && !response.data.error && response.data.post);
      
      if (isSuccess) {
        setReplyContent('');
        setReplyToPost(null);
        
        // Replace temp post with real post data - handle different response structures
        const realPost = response.data.post || response.data.data || response.data;
        // Ensure realPost has valid content property and safe string conversion
        if (realPost && (safeString(realPost.content) || realPost.id)) {
          // Ensure all properties are safely converted - this prevents [object Object] issues
          const safeRealPost = {
            ...realPost,
            content: safeString(realPost.content),
            author: {
              ...realPost.author,
              name: safeString(realPost.author?.name),
              username: safeString(realPost.author?.username),
              // Ensure any other author properties are safely converted
              id: realPost.author?.id || null,
              email: safeString(realPost.author?.email),
              avatar_url: safeString(realPost.author?.avatar_url)
            },
            mentions: Array.isArray(realPost.mentions) ? realPost.mentions.map(mention => {
              // Ensure each mention property is safely converted to prevent [object Object]
              if (typeof mention === 'object' && mention !== null) {
                return {
                  ...mention,
                  mention_text: safeString(mention.mention_text),
                  name: safeString(mention.name),
                  display_name: safeString(mention.display_name),
                  type: safeString(mention.type),
                  id: mention.id || null,
                  // Convert any other mention properties safely
                  username: safeString(mention.username),
                  team_name: safeString(mention.team_name),
                  player_name: safeString(mention.player_name)
                };
              } else {
                // If mention is not an object, convert it safely
                return {
                  mention_text: safeString(mention),
                  name: safeString(mention),
                  display_name: safeString(mention),
                  type: 'user',
                  id: null
                };
              }
            }) : [],
            // Ensure other post properties are safely converted
            meta: realPost.meta || {},
            stats: realPost.stats || {},
            upvotes: realPost.upvotes || 0,
            downvotes: realPost.downvotes || 0,
            user_vote: realPost.user_vote || null,
            replies: Array.isArray(realPost.replies) ? realPost.replies : []
          };
          if (replyToPost) {
            // Replace in nested replies
            setPosts(prevPosts => prevPosts.map(post => {
              if (post.id === replyToPost.id) {
                return {
                  ...post,
                  replies: post.replies.map(reply => 
                    reply.id === tempReply.id ? safeRealPost : reply
                  )
                };
              }
              return post;
            }));
          } else {
            // Replace in top-level posts
            setPosts(prevPosts => prevPosts.map(post => 
              post.id === tempReply.id ? safeRealPost : post
            ));
          }
        } else {
          // Fallback: refresh all data
          await fetchThreadData();
        }
        
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.textContent = '✅ Reply posted successfully';
        successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(successMsg);
        setTimeout(() => document.body.removeChild(successMsg), 3000);
        
      } else {
        // Remove temp post and show error - enhanced error detection
        setPosts(originalPosts);
        console.error('❌ Reply submission failed:', response.data);
        const errorMsg = response.data?.message || response.data?.error || 'Failed to submit reply. Please try again.';
        alert(errorMsg);
      }
      
    } catch (error) {
      console.error('❌ Failed to submit reply:', error);
      
      // Remove temp post on error
      setPosts(originalPosts);
      
      // Enhanced error handling with safe string conversion
      let errorMessage = 'Failed to submit reply. Please try again.';
      
      // Extract error message safely
      const safeErrorMsg = safeErrorMessage(error);
      
      if (safeErrorMsg.includes('Thread is locked')) {
        errorMessage = 'This thread is locked and no longer accepts replies.';
        // Refresh thread data to update UI
        await fetchThreadData();
      } else if (safeErrorMsg.includes('parent id is invalid')) {
        errorMessage = 'The post you are replying to no longer exists. The page will refresh.';
        await fetchThreadData();
      } else if (safeErrorMsg.includes('401') || error.response?.status === 401) {
        errorMessage = 'Please log in again to post replies.';
      } else if (safeErrorMsg.includes('403') || error.response?.status === 403) {
        errorMessage = 'You do not have permission to reply to this thread.';
      } else if (safeErrorMsg !== 'An unknown error occurred') {
        // Use the actual error message if available
        errorMessage = safeErrorMsg;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditPost = (post) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const handleSaveEdit = async (postId) => {
    // Ensure editContent is a string and has content
    const content = safeString(editContent);
    if (!content.trim()) return;

    try {
      setSubmitting(true);

      const response = await api.put(`/user/forums/posts/${postId}`, {
        content: content.trim()
      });

      // Enhanced response validation to handle different response structures
      const isSuccess = response.status === 200 ||
                       response.status === 201 ||
                       response?.data?.success === true ||
                       response?.success === true ||
                       (response?.data && !response?.data?.error) ||
                       (response?.message && response.message.toLowerCase().includes('success'));

      if (isSuccess) {
        setEditingPost(null);
        setEditContent('');

        // Immediately fetch fresh data
        await fetchThreadData();

        // Show success feedback
        const successMessage = document.createElement('div');
        successMessage.textContent = '✅ Post updated successfully';
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(successMessage);
        setTimeout(() => document.body.removeChild(successMessage), 3000);
      } else {
        alert('Failed to edit post. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to edit post:', error);

      // CRITICAL FIX: Check if this is actually a successful response that was caught as an error
      const isActuallySuccess = (error.response?.status === 200 || error.response?.status === 201) &&
                                (error.response?.data?.success === true || !error.response?.data?.error);

      if (isActuallySuccess) {
        // This is actually a success, handle it properly
        setEditingPost(null);
        setEditContent('');

        // Immediately fetch fresh data
        await fetchThreadData();

        // Show success message
        const successMessage = document.createElement('div');
        successMessage.textContent = '✅ Post updated successfully';
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(successMessage);
        setTimeout(() => document.body.removeChild(successMessage), 3000);

        return; // Exit early since this was actually successful
      }

      alert('Failed to edit post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    // Store original posts state for potential rollback
    const originalPosts = [...posts];

    try {
      setSubmitting(true);
      
      // ENHANCED: Optimistic UI update with better nested reply handling
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          // Mark the post as deleted rather than removing (in case it has replies)
          return null; // Will be filtered out
        }
        
        // Handle nested replies more carefully
        if (post.replies && post.replies.length > 0) {
          const filteredReplies = post.replies.filter(reply => reply.id !== postId);
          return { ...post, replies: filteredReplies };
        }
        
        return post;
      }).filter(post => post !== null); // Remove deleted posts
      
      setPosts(updatedPosts);

      const response = await api.delete(`/user/forums/posts/${postId}`);

      if (response.data?.success || response.success) {
        // Post successfully deleted - keep the optimistic update
        console.log('✅ Post deleted successfully');
        
        // Show success feedback
        const successMessage = document.createElement('div');
        successMessage.textContent = '✅ Post deleted successfully';
        successMessage.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg z-50';
        document.body.appendChild(successMessage);
        setTimeout(() => document.body.removeChild(successMessage), 3000);
        
      } else {
        // Rollback on API failure
        console.warn('⚠️ Delete request did not return success, rolling back');
        setPosts(originalPosts);
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to delete post:', error);
      
      // Enhanced error handling with rollback
      setPosts(originalPosts);
      
      let errorMessage = 'Failed to delete post. Please try again.';
      
      // Extract error message safely
      const safeErrorMsg = safeErrorMessage(error);
      
      if (safeErrorMsg.includes('403') || error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this post.';
      } else if (safeErrorMsg.includes('404') || error.response?.status === 404) {
        errorMessage = 'Post not found or already deleted.';
        // In this case, keep the optimistic update since post is gone
        // Post was already deleted, so keep the filtered state
      } else if (safeErrorMsg.includes('401') || error.response?.status === 401) {
        errorMessage = 'Please log in again to delete posts.';
      } else if (safeErrorMsg !== 'An unknown error occurred') {
        // Use the actual error message if available
        errorMessage = safeErrorMsg;
      }
      
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePinThread = async () => {
    try {
      const isCurrentlyPinned = thread.meta?.pinned || thread.pinned;
      
      // Optimistically update the UI
      setThread(prev => ({
        ...prev,
        pinned: !isCurrentlyPinned,
        meta: {
          ...prev.meta,
          pinned: !isCurrentlyPinned
        }
      }));
      
      const endpoint = isCurrentlyPinned 
        ? `/admin/forums/threads/${threadId}/unpin`
        : `/admin/forums/threads/${threadId}/pin`;
      
      const response = await api.post(endpoint);
      
      // Check for success in response or successful message
      if (response.data?.success || response.data?.message?.includes('successfully')) {
        console.log(`✅ Thread ${isCurrentlyPinned ? 'unpinned' : 'pinned'} successfully`);
        // Optionally fetch fresh data to ensure consistency
        // await fetchThreadData();
      } else {
        // Revert optimistic update on failure
        setThread(prev => ({
          ...prev,
          pinned: isCurrentlyPinned,
          meta: {
            ...prev.meta,
            pinned: isCurrentlyPinned
          }
        }));
        alert('Failed to update thread pin status');
      }
    } catch (error) {
      console.error('❌ Failed to pin/unpin thread:', error);
      // Revert optimistic update on error
      const isCurrentlyPinned = thread.meta?.pinned || thread.pinned;
      setThread(prev => ({
        ...prev,
        pinned: isCurrentlyPinned,
        meta: {
          ...prev.meta,
          pinned: isCurrentlyPinned
        }
      }));
      alert('Failed to update thread pin status');
    }
  };

  const handleLockThread = async () => {
    try {
      const isCurrentlyLocked = thread.meta?.locked || thread.locked;
      
      // Optimistically update the UI
      setThread(prev => ({
        ...prev,
        locked: !isCurrentlyLocked,
        meta: {
          ...prev.meta,
          locked: !isCurrentlyLocked
        }
      }));
      
      const endpoint = isCurrentlyLocked 
        ? `/admin/forums/threads/${threadId}/unlock`
        : `/admin/forums/threads/${threadId}/lock`;
      
      const response = await api.post(endpoint);
      
      // Check for success in response or successful message
      if (response.data?.success || response.data?.message?.includes('successfully')) {
        console.log(`✅ Thread ${isCurrentlyLocked ? 'unlocked' : 'locked'} successfully`);
        // Optionally fetch fresh data to ensure consistency
        // await fetchThreadData();
      } else {
        // Revert optimistic update on failure
        setThread(prev => ({
          ...prev,
          locked: isCurrentlyLocked,
          meta: {
            ...prev.meta,
            locked: isCurrentlyLocked
          }
        }));
        alert('Failed to update thread lock status');
      }
    } catch (error) {
      console.error('❌ Failed to lock/unlock thread:', error);
      // Revert optimistic update on error
      const isCurrentlyLocked = thread.meta?.locked || thread.locked;
      setThread(prev => ({
        ...prev,
        locked: isCurrentlyLocked,
        meta: {
          ...prev.meta,
          locked: isCurrentlyLocked
        }
      }));
      alert('Failed to update thread lock status');
    }
  };

  const handleDeleteThread = async () => {
    if (!window.confirm('Are you sure you want to delete this entire thread? This action cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.delete(`/user/forums/threads/${threadId}`);

      // Check for success in multiple ways - API might return 200 with success:true or just 200 status
      const isSuccess = response.status === 200 || response.data?.success === true || response.data?.success === 'true';
      
      if (isSuccess) {
        // Redirect to forums immediately after successful deletion
        if (navigateTo) {
          navigateTo('forums');
        }
      } else {
        alert('Failed to delete thread. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to delete thread:', error);
      
      if (error.response?.status === 404) {
        alert('Thread not found or has already been deleted.');
        if (navigateTo) {
          navigateTo('forums');
        }
      } else if (error.response?.status === 403) {
        alert('You do not have permission to delete this thread.');
      } else {
        alert('Failed to delete thread. Please try again.');
      }
    } finally {
      setSubmitting(false);
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
            {post.is_temp && (
              <span className="text-xs text-blue-500 dark:text-blue-400 flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-1"></div>
                Posting...
              </span>
            )}
            {post.is_edited && !post.is_temp && (
              <span className="text-xs text-gray-400 dark:text-gray-600">
                (edited {formatTimeAgo(post.meta?.updated_at || post.edited_at)})
              </span>
            )}
            {/* Voting buttons - disabled for temp posts */}
            {!post.is_temp && (
              <ForumVotingButtons
                itemType="post"
                itemId={post.id}
                initialUpvotes={post.stats?.upvotes !== undefined ? post.stats.upvotes : (post.upvotes || 0)}
                initialDownvotes={post.stats?.downvotes !== undefined ? post.stats.downvotes : (post.downvotes || 0)}
                userVote={post.user_vote}
                direction="horizontal"
                size="xs"
                onVoteChange={(voteData) => {
                  // Update post vote counts in the posts array
                  setPosts(prevPosts => prevPosts.map(p => {
                    if (p.id === post.id) {
                      return {
                        ...p,
                        stats: {
                          ...p.stats,
                          upvotes: voteData.vote_counts?.upvotes || p.stats?.upvotes || 0,
                          downvotes: voteData.vote_counts?.downvotes || p.stats?.downvotes || 0
                        },
                        upvotes: voteData.vote_counts?.upvotes || p.upvotes || 0,
                        downvotes: voteData.vote_counts?.downvotes || p.downvotes || 0,
                        user_vote: voteData.user_vote
                      };
                    }
                    return p;
                  }));
                }}
              />
            )}
          </div>

          {/* Post Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            {safeContent(post.content).split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {renderContentWithMentions(safeString(paragraph), post.mentions || [])}
              </p>
            ))}
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-4 mb-3">
            {/* Reply Button */}
            {isAuthenticated && !post.is_temp && !thread.meta?.locked && (
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
                disabled={submitting}
                className={`text-xs transition-colors ${
                  submitting 
                    ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                {submitting ? 'Deleting...' : 'Delete'}
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
                <ForumMentionAutocomplete
                  value={replyContent}
                  onChange={(value) => {
                    // ForumMentionAutocomplete already handles the string conversion internally
                    setReplyContent(value);
                  }}
                  placeholder="Write your reply... (Type @ to mention teams and players)"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400 focus:border-transparent"
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
                  onChange={(e) => {
                    // Ensure we always get the string value
                    const value = typeof e === 'string' ? e : e.target?.value || '';
                    setEditContent(value);
                  }}
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
          {renderContentWithMentions(thread.title, thread.mentions || [])}
        </span>
      </div>

      {/* Thread Header */}
      <div className="card p-6 mb-6">
        <div className="flex space-x-4">
          <div className="flex-1 min-w-0">
            {/* Thread badges */}
            <div className="flex items-center space-x-2 mb-3">
              {thread.meta?.pinned && (
                <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                  📌 PINNED
                </span>
              )}
              {thread.meta?.locked && (
                <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                  🔒 LOCKED
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {renderContentWithMentions(thread.title, thread.mentions || [])}
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
                <ForumVotingButtons
                  itemType="thread"
                  itemId={thread.id}
                  initialUpvotes={thread.stats?.upvotes || 0}
                  initialDownvotes={thread.stats?.downvotes || 0}
                  userVote={thread.user_vote}
                  direction="horizontal"
                  size="xs"
                  onVoteChange={(voteData) => {
                    // Update thread vote counts
                    setThread(prevThread => ({
                      ...prevThread,
                      stats: {
                        ...prevThread.stats,
                        upvotes: voteData.vote_counts?.upvotes || prevThread.stats?.upvotes || 0,
                        downvotes: voteData.vote_counts?.downvotes || prevThread.stats?.downvotes || 0
                      },
                      upvotes: voteData.vote_counts?.upvotes || prevThread.upvotes || 0,
                      downvotes: voteData.vote_counts?.downvotes || prevThread.downvotes || 0,
                      user_vote: voteData.user_vote
                    }));
                  }}
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
                  {safeString(thread.content).split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-2 last:mb-0">
                      {renderContentWithMentions(safeString(paragraph), thread.mentions || [])}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Controls */}
            {(isAdmin() || isModerator()) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3 flex-wrap">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Admin:</span>
                  <button
                    onClick={() => handlePinThread()}
                    className={`px-3 py-1 text-xs rounded ${
                      thread.meta?.pinned 
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    } hover:opacity-80 transition-opacity`}
                  >
                    {thread.meta?.pinned ? '📌 Unpin' : '📌 Pin'}
                  </button>
                  <button
                    onClick={() => handleLockThread()}
                    className={`px-3 py-1 text-xs rounded ${
                      thread.meta?.locked 
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' 
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    } hover:opacity-80 transition-opacity`}
                  >
                    {thread.meta?.locked ? '🔒 Unlock' : '🔒 Lock'}
                  </button>
                  <button
                    onClick={() => handleDeleteThread()}
                    disabled={submitting}
                    className="px-3 py-1 text-xs rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '🗑️ Deleting...' : '🗑️ Delete Thread'}
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
      {isAuthenticated && !thread.meta?.locked && !replyToPost && (
        <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Post Reply</h3>
          <form onSubmit={handleSubmitReply}>
            <ForumMentionAutocomplete
              value={replyContent}
              onChange={setReplyContent}
              placeholder="Write your reply... (Type @ to mention teams and players)"
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
                {submitting ? 'Posting...' : 'Post Reply'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Login Prompt for Unauthenticated Users */}
      {!isAuthenticated && !thread.meta?.locked && (
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
      {thread.meta?.locked && (
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