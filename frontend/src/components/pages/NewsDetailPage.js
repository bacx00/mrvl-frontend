import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import MentionAutocomplete from '../shared/MentionAutocomplete';
import MentionLink from '../shared/MentionLink';
import { processContentWithMentions } from '../../utils/mentionUtils';

function NewsDetailPage({ params, navigateTo }) {
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const { api, user, isAuthenticated } = useAuth();

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
      setArticle(articleData);
      setComments(articleData.comments || []);
      
      // Increment view count
      try {
        await api.post(`/news/${articleId}/view`);
      } catch (error) {
        console.log('View count failed (likely not logged in)');
      }
      
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
      const response = await api.post(`/news/${articleId}/comments`, {
        content: commentText,
        parent_id: replyToId
      });

      if (response.data.success) {
        setCommentText('');
        setReplyToId(null);
        // Refresh comments
        await fetchArticle();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      alert('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
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
        className={`${isReply ? 'pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''} py-4`}
        style={marginStyle}
      >
        <div className="flex items-start space-x-3">
          {/* Voting (left side) */}
          <VotingButtons
            itemType="news_comment"
            itemId={comment.id}
            parentId={articleId}
            initialUpvotes={comment.stats?.upvotes || 0}
            initialDownvotes={comment.stats?.downvotes || 0}
            userVote={comment.user_vote}
            direction="vertical"
            size="sm"
          />

          {/* Comment content */}
          <div className="flex-1">
            {/* Author info */}
            <div className="flex items-center space-x-2 mb-2">
              <UserDisplay
                user={comment.author}
                showAvatar={true}
                showHeroFlair={true}
                showTeamFlair={true}
                size="sm"
                clickable={false}
              />
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {formatDate(comment.meta?.created_at)}
              </span>
              {comment.meta?.edited && (
                <span className="text-xs text-gray-400 dark:text-gray-600">(edited)</span>
              )}
            </div>

            {/* Comment text with mentions */}
            <div className="text-gray-900 dark:text-white mb-2">
              {renderContentWithMentions(comment.content, comment.mentions || [])}
            </div>

            {/* Comment actions */}
            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
              <button
                onClick={() => setReplyToId(comment.id)}
                className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Reply
              </button>
              
              {comment.mentions && comment.mentions.length > 0 && (
                <span className="flex items-center space-x-1">
                  <span>@</span>
                  <span>{comment.mentions.length} mentions</span>
                </span>
              )}
            </div>

            {/* Reply form */}
            {replyToId === comment.id && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <form onSubmit={handleSubmitComment}>
                  <MentionAutocomplete
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={`Reply to ${comment.author?.name}...`}
                    rows={3}
                    className="px-3 py-2 text-sm"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setReplyToId(null)}
                      className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingComment || !commentText.trim()}
                      className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submittingComment ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Nested replies */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-4 space-y-2">
                {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
              </div>
            )}
          </div>
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
        <span className="text-gray-900 dark:text-white">{article.title}</span>
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
                style={{ backgroundColor: article.category.color || '#6b7280' }}
              >
                {article.category.icon || '📰'} {article.category.name}
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
            {article.title}
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
              {article.stats?.views > 0 && (
                <span>👁 {article.stats.views.toLocaleString()}</span>
              )}
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
              src={article.featured_image}
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
              {article.excerpt}
            </div>
          )}
          
          <div className="prose dark:prose-invert max-w-none">
            {article.mentions && article.mentions.length > 0 
              ? processContentWithMentions(article.content, article.mentions)
              : <div dangerouslySetInnerHTML={{ __html: article.content }} />
            }
          </div>
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