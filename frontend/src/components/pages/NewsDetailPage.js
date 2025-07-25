import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import MentionAutocomplete from '../shared/MentionAutocomplete';
import MentionLink from '../shared/MentionLink';
import NewsContent from '../shared/NewsContent';
import { processContentWithMentions, extractMentionsFromContent } from '../../utils/mentionUtils';
import { getImageUrl } from '../../utils/imageUtils';

function NewsDetailPage({ params, navigateTo }) {
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [selectedMentions, setSelectedMentions] = useState([]);
  const { api, user, isAuthenticated, isAdmin, isModerator } = useAuth();

  const articleId = params?.id;

  useEffect(() => {
    if (articleId) {
      fetchArticle();
    }
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      console.log('🔍 NewsDetailPage: Fetching article ID:', articleId);
      
      const response = await api.get(`/news/${articleId}`);
      const articleData = response.data?.data || response.data || response;
      
      console.log('✅ Article loaded:', articleData);
      console.log('📝 Comments in article:', articleData.comments?.length || 0);
      setArticle(articleData);
      setComments(articleData.comments || []);
      
    } catch (error) {
      console.error('❌ Error fetching article:', error);
      setArticle(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to comment');
      return;
    }
    
    if (!commentText.trim()) {
      return;
    }

    setSubmittingComment(true);
    try {
      const response = await api.post(`/user/news/${articleId}/comments`, {
        content: commentText,
        parent_id: replyToId,
        mentions: selectedMentions // Use the tracked selected mentions
      });

      console.log('🔍 Checking response for success...', response.data);
      console.log('🔍 Full response object:', response);
      console.log('🔍 Response success check:', response.data?.success === true || response.success === true);
      if (response.data?.success === true || response.success === true) {
        console.log('✅ Comment posted successfully, refreshing article data...');
        console.log('📝 Response data:', response.data);
        
        // Clear form
        setCommentText('');
        setReplyToId(null);
        setSelectedMentions([]);
        
        // Fetch fresh data from server to get properly processed mentions
        console.log('🔄 Calling fetchArticle to refresh comments...');
        try {
          await fetchArticle();
          console.log('✅ fetchArticle completed');
        } catch (fetchError) {
          console.error('❌ Error in fetchArticle:', fetchError);
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleMentionSelect = (mention) => {
    // Add the selected mention to our tracking array
    setSelectedMentions(prev => {
      // Avoid duplicates
      const exists = prev.find(m => m.id === mention.id && m.type === mention.type);
      if (exists) return prev;
      return [...prev, mention];
    });
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      setSubmittingComment(true);

      // Extract mentions from the edited content
      const mentions = extractMentionsFromContent(editContent.trim());
      
      const response = await api.put(`/user/news/comments/${commentId}`, {
        content: editContent.trim(),
        mentions: mentions // Include mentions in the payload
      });

      if (response.data?.success === true || response.success === true) {
        setEditingComment(null);
        setEditContent('');
        
        // Immediately fetch fresh data
        try {
          await fetchArticle();
          console.log('✅ fetchArticle completed after edit');
        } catch (fetchError) {
          console.error('❌ Error in fetchArticle after edit:', fetchError);
        }
      } else {
        alert('Failed to edit comment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to edit comment:', error);
      alert('Failed to edit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      setSubmittingComment(true);
      console.log('🗑️ Deleting comment...', commentId);

      const response = await api.delete(`/user/news/comments/${commentId}`);

      if (response.data?.success || response.success) {
        console.log('✅ Comment deleted successfully, refreshing article data...');
        // Immediately fetch fresh data
        try {
          await fetchArticle();
          console.log('✅ fetchArticle completed after delete');
        } catch (fetchError) {
          console.error('❌ Error in fetchArticle after delete:', fetchError);
        }
      } else {
        alert('Failed to delete comment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Use the utility function to process content with mentions

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderComment = (comment, isReply = false, depth = 0) => {
    // Use inline style for consistent indentation
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
              {formatDate(comment.meta?.created_at)}
            </span>
            {comment.meta?.edited && (
              <span className="text-xs text-gray-400 dark:text-gray-600">
                (edited)
              </span>
            )}
            {/* Voting buttons right after username info */}
            <VotingButtons
              itemType="news_comment"
              itemId={comment.id}
              parentId={articleId}
              initialUpvotes={comment.stats?.upvotes || 0}
              initialDownvotes={comment.stats?.downvotes || 0}
              userVote={comment.user_vote}
              direction="horizontal"
              size="xs"
              onVoteChange={(newVote, stats) => {
                // Update comment vote in state
                const updateCommentVote = (comments) => {
                  return comments.map(c => {
                    if (c.id === comment.id) {
                      return {
                        ...c,
                        user_vote: newVote,
                        stats: {
                          ...c.stats,
                          upvotes: stats.upvotes,
                          downvotes: stats.downvotes,
                          score: stats.upvotes - stats.downvotes
                        }
                      };
                    } else if (c.replies && c.replies.length > 0) {
                      return {
                        ...c,
                        replies: updateCommentVote(c.replies)
                      };
                    }
                    return c;
                  });
                };
                setComments(updateCommentVote(comments));
              }}
            />
          </div>

          {/* Comment Content */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            {comment.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {processContentWithMentions(paragraph, comment.mentions || [], navigateTo)}
              </p>
            ))}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mb-3">
            {/* Reply Button */}
            {isAuthenticated && (
              <button
                onClick={() => setReplyToId(comment.id)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Reply
              </button>
            )}
            
            {/* Edit Button */}
            {(comment.author?.id === user?.id || isAdmin || isModerator) && (
              <button
                onClick={() => handleEditComment(comment)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Edit
              </button>
            )}

            {/* Delete Button */}
            {(comment.author?.id === user?.id || isAdmin || isModerator) && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                disabled={submittingComment}
                className={`text-xs transition-colors ${
                  submittingComment 
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                    : 'text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                {submittingComment ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyToId === comment.id && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <form onSubmit={handleSubmitComment}>
                <div className="mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Replying to @{comment.author?.username || comment.author?.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <MentionAutocomplete
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onMentionSelect={handleMentionSelect}
                  placeholder="Write your reply..."
                  rows={3}
                  className="p-2"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setReplyToId(null)}
                    className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submittingComment}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? 'Posting...' : 'Reply'}
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
                  onChange={(e) => setEditContent(e.target.value)}
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
                    disabled={!editContent.trim() || submittingComment}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Nested Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-2">
              {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading article...</div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">📰</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The article you're looking for doesn't exist or may have been removed.
        </p>
        <button 
          onClick={() => navigateTo && navigateTo('news')} 
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          ← Back to News
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
        <button 
          onClick={() => navigateTo && navigateTo('home')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Home
        </button>
        <span>›</span>
        <button 
          onClick={() => navigateTo && navigateTo('news')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          News
        </button>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">{processContentWithMentions(article.title, article.mentions || [], navigateTo)}</span>
      </div>

      {/* Article */}
      <article className="card overflow-hidden">
        {/* Article header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          {/* Category and meta */}
          <div className="flex items-center space-x-3 mb-4">
            {article.category && (
              <span 
                className="px-3 py-1 text-xs font-bold rounded-full text-white"
                style={{ backgroundColor: '#6b7280' }}
              >
                {typeof article.category === 'string' ? article.category : article.category.name}
              </span>
            )}
            {article.meta?.featured && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-500 text-white">
                FEATURED
              </span>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {article.region || 'INTL'}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {processContentWithMentions(article.title, article.mentions || [], navigateTo)}
          </h1>

          {/* Author and meta */}
          <div className="flex items-center justify-between">
            <UserDisplay
              user={article.author}
              showAvatar={true}
              showTeamFlair={true}
              size="md"
              clickable={false}
            />
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
              <span>{formatDate(article.meta?.published_at || article.meta?.created_at)}</span>
              {article.meta?.read_time && (
                <span>📖 {article.meta.read_time} min read</span>
              )}
            </div>
          </div>
        </div>

        {/* Featured image */}
        {article.featured_image && (
          <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
            <img 
              src={getImageUrl(article.featured_image)}
              alt={article.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/news-placeholder.png';
              }}
            />
          </div>
        )}

        {/* Article content */}
        <div className="p-6">
          {article.excerpt && (
            <div className="text-lg text-gray-700 dark:text-gray-300 mb-6 font-medium">
              {processContentWithMentions(article.excerpt, article.mentions || [], navigateTo)}
            </div>
          )}
          
          <NewsContent content={article.content} mentions={article.mentions || []} />
        </div>

        {/* Article voting and sharing */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <VotingButtons
              itemType="news"
              itemId={article.id}
              initialUpvotes={article.stats?.upvotes || 0}
              initialDownvotes={article.stats?.downvotes || 0}
              userVote={article.user_vote}
              direction="horizontal"
              onVoteChange={(newVote, stats) => {
                setArticle(prev => ({
                  ...prev,
                  user_vote: newVote,
                  stats: {
                    ...prev.stats,
                    upvotes: stats.upvotes,
                    downvotes: stats.downvotes,
                    score: stats.upvotes - stats.downvotes
                  }
                }));
              }}
            />
            
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-500">
              <span>💬 {comments.length} comments</span>
              <button className="hover:text-red-600 dark:hover:text-red-400 transition-colors">
                🔗 Share
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Comments Section */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Comments ({comments.length})
          </h2>
        </div>

        {/* Comment form */}
        {isAuthenticated ? (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmitComment}>
              <div className="flex items-start space-x-3">
                <UserDisplay
                  user={user}
                  showAvatar={true}
                  showTeamFlair={false}
                  size="sm"
                />
                <div className="flex-1">
                  <MentionAutocomplete
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onMentionSelect={handleMentionSelect}
                    placeholder="Add a comment... Use @username to mention someone"
                    rows={4}
                    className="px-3 py-2"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please log in to leave a comment
            </p>
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'))}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Log In
            </button>
          </div>
        )}

        {/* Comments list */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {comments.length > 0 ? (
            comments.map(comment => renderComment(comment))
          ) : (
            <div className="p-6 text-center">
              <div className="text-gray-500 dark:text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewsDetailPage;