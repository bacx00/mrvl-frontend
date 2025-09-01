import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { useActivityStatsContext } from '../../contexts/ActivityStatsContext';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import ForumMentionAutocomplete from '../shared/ForumMentionAutocomplete';
import MentionLink from '../shared/MentionLink';
import VideoEmbed from '../shared/VideoEmbed';
// import SocialShareButtons from '../shared/SocialShareButtons'; // Removed per request
import LazyImageOptimized from '../shared/LazyImageOptimized';
import { processContentWithMentions } from '../../utils/mentionUtils';
import { detectAllVideoUrls } from '../../utils/videoUtils';
import { safeString, safeErrorMessage, safeContent } from '../../utils/safeStringUtils';
import { getNewsFeaturedImageUrl } from '../../utils/imageUtils';
import { 
  generateNewsMetaTags, 
  generateNewsStructuredData, 
  updateMetaTags, 
  addStructuredData,
  calculateReadingTime 
} from '../../utils/seoUtils';
import { trackNewsView, trackNewsEngagement, initializeNewsAnalytics } from '../../utils/analyticsUtils';
import { showToast, showSuccessToast, showErrorToast } from '../../utils/toastUtils';

function NewsDetailPage({ params, navigateTo }) {
  const { triggerComment } = useActivityStatsContext();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');

  // Enhanced setCommentText to ensure it's always a string
  const safeSetCommentText = (value) => {
    const safeValue = safeString(value);
    setCommentText(safeValue);
  };
  const [replyToId, setReplyToId] = useState(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');

  // Enhanced setEditCommentText to ensure it's always a string
  const safeSetEditCommentText = (value) => {
    const safeValue = safeString(value);
    setEditCommentText(safeValue);
  };
  
  // Mentions data for processing content
  const [mentionsData, setMentionsData] = useState([]);
  
  const { api, user, isAuthenticated } = useAuth();

  const articleId = params?.id;

  useEffect(() => {
    let mounted = true;
    
    const loadArticle = async () => {
      if (articleId && mounted) {
        await fetchArticle();
      }
    };
    
    loadArticle();
    
    return () => {
      mounted = false;
    };
  }, [articleId]);

  // Initialize analytics and SEO when article loads
  useEffect(() => {
    if (article) {
      // Set up SEO meta tags
      const metaTags = generateNewsMetaTags(article);
      updateMetaTags(metaTags);
      
      // Add structured data
      const structuredData = generateNewsStructuredData(article);
      addStructuredData(structuredData);
      
      // Track article view
      trackNewsView(article, 'direct');
      
      // Set global article for analytics
      window.__CURRENT_ARTICLE__ = article;
      
      // Initialize analytics tracking
      const cleanup = initializeNewsAnalytics();
      
      return cleanup;
    }
  }, [article]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      console.log('🔍 NewsDetailPage: Fetching article ID:', articleId);
      
      const response = await api.get(`/public/news/${articleId}`);
      const articleData = response.data?.data || response.data || response;
      
      console.log('✅ Article loaded:', articleData);
      setArticle(articleData);
      setComments(articleData.comments || []);
      
      // Load mentions data for content processing
      await fetchMentionsData();
      
      // Increment view count
      try {
        await api.post(`/public/news/${articleId}/view`);
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

  const fetchMentionsData = async () => {
    try {
      // Fetch mentions autocomplete data for parsing content
      const response = await api.get('/mentions/search?limit=50');
      if (response.data?.success && response.data?.data) {
        setMentionsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching mentions data:', error);
      // Don't break the page if mentions fail
      setMentionsData([]);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to comment');
      return;
    }
    
    // Ensure commentText is safely converted to prevent [object Object] issues
    const content = safeString(commentText);
    if (!content.trim()) {
      return;
    }

    // Store original comments for rollback
    const originalComments = [...comments];

    setSubmittingComment(true);
    try {
      // ENHANCED: Add optimistic UI update for comments with safe object handling
      const tempComment = {
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
        stats: { upvotes: 0, downvotes: 0 },
        user_vote: null,
        mentions: [], // Empty array for temp comments
        replies: []
      };

      // Add optimistic comment to UI
      if (replyToId) {
        // Add as nested reply
        setComments(prevComments => prevComments.map(comment => {
          if (comment.id === replyToId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), tempComment]
            };
          }
          return comment;
        }));
      } else {
        // Add as top-level comment
        setComments(prevComments => [...prevComments, tempComment]);
      }

      const response = await api.post(`/news/${articleId}/comments`, {
        content: safeString(content.trim()), // Ensure payload content is safely converted
        parent_id: replyToId
      });

      // CRITICAL FIX: Better response validation for successful comment posting
      // The response is already the data from the API (not axios response object)
      const isSuccess = response?.success === true || response?.data || response?.comment;
      
      console.log('Comment submission response:', {
        response: response,
        success: response?.success,
        hasData: !!response?.data,
        isSuccess
      });

      if (isSuccess) {
        safeSetCommentText('');
        setReplyToId(null);
        
        // Track comment engagement
        trackNewsEngagement(article, 'comment', {
          comment_type: replyToId ? 'reply' : 'top_level',
          parent_comment_id: replyToId
        });
        
        // Replace temp comment with real comment data
        const realComment = response.data.data || response.data.comment;
        if (realComment && safeString(realComment.content)) {
          // Ensure all properties are safely converted - this prevents [object Object] issues
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
              // Ensure each mention property is safely converted to prevent [object Object]
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
            meta: realComment.meta || {},
            stats: realComment.stats || {},
            user_vote: realComment.user_vote || null,
            replies: Array.isArray(realComment.replies) ? realComment.replies : []
          };
          
          if (replyToId) {
            // Replace in nested replies
            setComments(prevComments => prevComments.map(comment => {
              if (comment.id === replyToId) {
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
            // Replace in top-level comments
            setComments(prevComments => prevComments.map(comment => 
              comment.id === tempComment.id ? safeRealComment : comment
            ));
          }
        } else {
          // Fallback: refresh all data if real comment data is invalid
          await fetchArticle();
        }
        
        // Show success message using our toast utility
        showSuccessToast('Comment posted successfully!');
        
      } else {
        // Remove temp comment and show error
        setComments(originalComments);
        
        // Try to get error message from response
        const errorMsg = response.data?.message || 'Failed to post comment. Please try again.';
        showErrorToast(errorMsg);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      
      // CRITICAL FIX: Check if this is actually a successful response that was caught as an error
      const isActuallySuccess = (error.response?.status === 200 || error.response?.status === 201) && 
                                (error.response?.data?.success === true || error.response?.data?.success === 'true');
      
      if (isActuallySuccess) {
        // This is actually a success, handle it properly
        safeSetCommentText('');
        setReplyToId(null);
        
        const realComment = error.response.data.comment || error.response.data.data;
        if (realComment && safeString(realComment.content)) {
          // Handle successful comment creation the same way as above
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
            user_vote: realComment.user_vote || null,
            replies: Array.isArray(realComment.replies) ? realComment.replies : []
          };
          
          if (replyToId) {
            setComments(prevComments => prevComments.map(comment => {
              if (comment.id === replyToId) {
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
        } else {
          await fetchArticle();
        }
        
        // Show success message using our toast utility
        showSuccessToast('Comment posted successfully!');
        
        // Trigger activity stats update for comment creation
        triggerComment();
        
        return; // Exit early since this was actually successful
      }
      
      // Remove temp comment on actual error
      setComments(originalComments);
      
      // Enhanced error handling with safe string conversion
      let errorMessage = 'Failed to post comment. Please try again.';
      
      // Extract error message safely
      const safeErrorMsg = safeErrorMessage(error);
      
      if (safeErrorMsg.includes('401') || error.response?.status === 401) {
        errorMessage = 'Please log in again to post comments.';
      } else if (safeErrorMsg.includes('403') || error.response?.status === 403) {
        errorMessage = 'You do not have permission to comment on this article.';
      } else if (safeErrorMsg !== 'An unknown error occurred') {
        // Use the actual error message if available
        errorMessage = safeErrorMsg;
      }
      
      showErrorToast(errorMessage);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    // Store original comments state for potential rollback
    const originalComments = [...comments];

    try {
      // ENHANCED: Optimistic UI update with better nested reply handling
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          // Mark the comment as deleted rather than removing (in case it has replies)
          return null; // Will be filtered out
        }
        
        // Handle nested replies more carefully
        if (comment.replies && comment.replies.length > 0) {
          const filteredReplies = comment.replies.filter(reply => reply.id !== commentId);
          return { ...comment, replies: filteredReplies };
        }
        
        return comment;
      }).filter(comment => comment !== null); // Remove deleted comments
      
      setComments(updatedComments);

      const response = await api.delete(`/public/news/comments/${commentId}`);
      
      // Enhanced response validation to handle different response structures
      const isSuccess = response.status === 200 || 
                       response.status === 204 || 
                       response?.success === true ||
                       response?.data?.success === true || 
                       (response?.message && response.message.toLowerCase().includes('success'));
      
      if (isSuccess) {
        // Comment successfully deleted - keep the optimistic update
        console.log('✅ Comment deleted successfully');
        
        // Show success toast notification
        showSuccessToast('Comment deleted successfully!');
        
      } else {
        // Rollback on API failure
        console.warn('⚠️ Delete request did not return success, rolling back');
        setComments(originalComments);
        alert('Failed to delete comment. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      
      // Enhanced error handling with rollback
      setComments(originalComments);
      
      let errorMessage = 'Failed to delete comment. Please try again.';
      
      // Extract error message safely
      const safeErrorMsg = safeErrorMessage(error);
      
      if (safeErrorMsg.includes('403') || error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this comment.';
      } else if (safeErrorMsg.includes('404') || error.response?.status === 404) {
        errorMessage = 'Comment not found or already deleted.';
        // In this case, keep the optimistic update since comment is gone
      } else if (safeErrorMsg.includes('401') || error.response?.status === 401) {
        errorMessage = 'Please log in again to delete comments.';
      } else if (safeErrorMsg !== 'An unknown error occurred') {
        // Use the actual error message if available
        errorMessage = safeErrorMsg;
      }
      
      showErrorToast(errorMessage);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    safeSetEditCommentText(comment.content);
  };

  const handleSaveEditComment = async (commentId) => {
    // Ensure editCommentText is a string and has content
    const content = safeString(editCommentText);
    if (!content.trim()) {
      return;
    }

    try {
      const response = await api.put(`/news/comments/${commentId}`, {
        content: content.trim()
      });
      
      if (response.data.success) {
        setEditingCommentId(null);
        safeSetEditCommentText('');
        
        // Immediately fetch fresh data instead of full refresh for better UX
        await fetchArticle();
      } else {
        showErrorToast('Failed to update comment. Please try again.');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
      
      // Enhanced error handling with safe string conversion
      let errorMessage = 'Failed to update comment. Please try again.';
      
      const safeErrorMsg = safeErrorMessage(error);
      
      if (safeErrorMsg.includes('403') || error.response?.status === 403) {
        errorMessage = 'You do not have permission to edit this comment.';
      } else if (safeErrorMsg.includes('401') || error.response?.status === 401) {
        errorMessage = 'Please log in again to edit comments.';
      } else if (safeErrorMsg !== 'An unknown error occurred') {
        errorMessage = safeErrorMsg;
      }
      
      showErrorToast(errorMessage);
    }
  };

  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    safeSetEditCommentText('');
  };

  // ENHANCED: Process article content to detect and extract video URLs
  const processArticleContent = (content, existingVideos = []) => {
    if (!content) return { processedContent: content, detectedVideos: [] };
    
    console.log('🎥 Processing article content for videos...', { contentLength: content.length, existingVideos: existingVideos.length });
    
    // Detect videos in the content
    const detectedVideos = detectAllVideoUrls(content);
    console.log('🎥 Detected videos:', detectedVideos);
    
    // Combine existing videos with detected ones (avoid duplicates)
    const allVideos = [...existingVideos];
    
    detectedVideos.forEach(detectedVideo => {
      const isDuplicate = allVideos.some(existing => 
        existing.originalUrl === detectedVideo.originalUrl ||
        existing.url === detectedVideo.originalUrl ||
        (existing.video_id || existing.id) === detectedVideo.id
      );
      
      if (!isDuplicate) {
        const videoData = {
          ...detectedVideo,
          url: detectedVideo.originalUrl,
          video_id: detectedVideo.id,
          platform: detectedVideo.platform,
          type: detectedVideo.type,
          // Enhanced metadata for better video handling
          platformName: detectedVideo.platformName,
          thumbnail: detectedVideo.thumbnail,
          embedUrl: detectedVideo.embedUrl,
          isValid: detectedVideo.isValid !== false
        };
        allVideos.push(videoData);
        console.log('🎥 Added video to embed list:', videoData);
      } else {
        console.log('🎥 Skipping duplicate video:', detectedVideo.originalUrl);
      }
    });
    
    // Process content to replace [VIDEO_EMBED_x] placeholders with video embeds
    let processedContent = content;
    
    // Replace [VIDEO_EMBED_x] placeholders with special markers
    const videoPlaceholderRegex = /\[VIDEO_EMBED_(\d+)\]/g;
    processedContent = processedContent.replace(videoPlaceholderRegex, '<!-- VIDEO_EMBEDDED_$1 -->');
    
    // Also clean content by removing standalone video URLs but keeping them in context
    detectedVideos.forEach((video, index) => {
      // Only remove URLs that are on their own line to avoid breaking inline links
      const standalonePattern = new RegExp(`^\\s*${video.originalUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'gm');
      processedContent = processedContent.replace(standalonePattern, `<!-- VIDEO_EMBEDDED_${index} -->`);
    });
    
    console.log('🎥 Final processed content:', { 
      originalLength: content.length, 
      processedLength: processedContent.length, 
      totalVideos: allVideos.length 
    });
    
    return { processedContent, detectedVideos: allVideos };
  };

  const renderContentWithMentions = (content, mentions = []) => {
    // First, ensure content is safely converted - this prevents [object Object] display
    const safeContentValue = safeString(content);
    if (!safeContentValue || typeof safeContentValue !== 'string') return null;
    
    // Process content to replace mentions with clickable components
    if (!mentions || mentions.length === 0) return safeContentValue;
    
    // Sort mentions by position to process them in order
    const sortedMentions = [...mentions].sort((a, b) => 
      (a.position_start || 0) - (b.position_start || 0)
    );
    
    const elements = [];
    let lastIndex = 0;
    
    sortedMentions.forEach((mention) => {
      const mentionText = mention.mention_text;
      const startPos = safeContentValue.indexOf(mentionText, lastIndex);
      
      if (startPos !== -1) {
        // Add text before mention
        if (startPos > lastIndex) {
          elements.push(safeContentValue.slice(lastIndex, startPos));
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
    if (lastIndex < safeContentValue.length) {
      elements.push(safeContentValue.slice(lastIndex));
    }
    
    return elements.length > 0 ? elements : safeContentValue;
  };

  // ENHANCED: Render content with video embeds and improved layout
  const renderContentWithEmbeds = (content, videos = []) => {
    if (!content) return null;
    
    // Process content to detect additional videos and clean it up
    const { processedContent, detectedVideos } = processArticleContent(content, videos);
    const allVideos = detectedVideos.filter(video => video.isValid !== false);
    
    console.log('🎥 Rendering content with embeds:', { 
      totalVideos: allVideos.length, 
      contentHasVideos: allVideos.length > 0 
    });
    
    // Process content with mentions for clickable links
    const contentWithMentions = processContentWithMentions(processedContent, mentionsData, navigateTo);
    
    // If no videos, just return content with mentions
    if (!allVideos || allVideos.length === 0) {
      return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap leading-relaxed">
            {renderContentWithMentions(safeString(processedContent), mentionsData)}
          </div>
        </div>
      );
    }
    
    // Enhanced content processing for better video integration
    const paragraphs = processedContent.split(/\n\s*\n/).filter(p => p.trim());
    let videoIndex = 0;
    
    // Calculate optimal video placement points
    const totalParagraphs = paragraphs.length;
    const videoPlacementPoints = [];
    
    if (allVideos.length === 1) {
      // Single video: place after first paragraph or middle
      videoPlacementPoints.push(Math.min(1, Math.floor(totalParagraphs / 2)));
    } else if (allVideos.length === 2) {
      // Two videos: distribute evenly
      videoPlacementPoints.push(1, Math.floor(totalParagraphs * 0.7));
    } else {
      // Multiple videos: distribute throughout content
      for (let i = 0; i < allVideos.length; i++) {
        const position = Math.floor((totalParagraphs / (allVideos.length + 1)) * (i + 1));
        videoPlacementPoints.push(Math.max(1, position));
      }
    }
    
    console.log('🎥 Video placement strategy:', { 
      totalParagraphs, 
      videoPlacementPoints, 
      videosToPlace: allVideos.length 
    });
    
    return (
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {paragraphs.map((paragraph, index) => {
          const elements = [];
          
          // Check if this paragraph contains a video placeholder
          const videoPlaceholderMatch = paragraph.match(/<!-- VIDEO_EMBEDDED_(\d+) -->/);
          if (videoPlaceholderMatch) {
            const videoId = parseInt(videoPlaceholderMatch[1]);
            const video = allVideos[videoId];
            if (video) {
              console.log('🎥 Found video placeholder for video', videoId, ':', video);
              elements.push(
                <div key={`video-${videoId}`} className="not-prose my-8">
                  <VideoEmbed
                    type={video.platform || video.type}
                    id={video.video_id || video.id}
                    url={video.embedUrl || video.embed_url || video.original_url || video.url || video.originalUrl}
                    mobileOptimized={true}
                    lazyLoad={true}
                    inline={true}
                    showTitle={false}
                    className="rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              );
            }
          }
          // Add paragraph content with improved styling (skip empty paragraphs and video placeholders)
          else if (paragraph.trim() && !paragraph.includes('<!-- VIDEO_EMBEDDED')) {
            elements.push(
              <div key={`p-${index}`} className="whitespace-pre-wrap leading-relaxed mb-6 text-gray-900 dark:text-gray-100">
                {renderContentWithMentions(safeString(paragraph), mentionsData)}
              </div>
            );
          }
          
          // Check if we should place a video after this paragraph
          if (videoIndex < allVideos.length && videoPlacementPoints.includes(index)) {
            const video = allVideos[videoIndex];
            console.log('🎥 Placing video at position', index, ':', video);
            
            elements.push(
              <div key={`video-${videoIndex}`} className="not-prose my-8">
                <VideoEmbed
                  type={video.platform || video.type}
                  id={video.video_id || video.id}
                  url={video.embedUrl || video.embed_url || video.original_url || video.url || video.originalUrl}
                  mobileOptimized={true}
                  lazyLoad={true}
                  inline={true}
                  showTitle={false}
                  className="rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            );
            videoIndex++;
          }
          
          return elements;
        })}
        
        {/* Add any remaining videos at the end */}
        {videoIndex < allVideos.length && (
          <div className="not-prose mt-8 space-y-6">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4 border-t border-gray-200 dark:border-gray-700 pt-6">
              📺 Related Videos ({allVideos.length - videoIndex} more)
            </div>
            {allVideos.slice(videoIndex).map((video, index) => {
              console.log('🎥 Placing remaining video:', video);
              return (
                <VideoEmbed
                  key={`video-remaining-${index}`}
                  type={video.platform || video.type}
                  id={video.video_id || video.id}
                  url={video.embedUrl || video.embed_url || video.original_url || video.url || video.originalUrl}
                  mobileOptimized={true}
                  lazyLoad={true}
                  inline={true}
                  showTitle={true}
                  className="rounded-lg overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700"
                />
              );
            })}
          </div>
        )}
        
        {/* Video summary for accessibility and SEO */}
        {allVideos.length > 0 && (
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              📺 Video Content Summary
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {allVideos.map((video, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span>•</span>
                  <span>{video.platformName || video.platform || video.type}</span>
                  {video.originalUrl && (
                    <a 
                      href={video.originalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 text-xs"
                    >
                      (Open in new tab)
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
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
              
              {/* Voting buttons - positioned right after username like forums */}
              {!comment.is_temp && (
                <VotingButtons
                  itemType="news_comment"
                  itemId={comment.id}
                  parentId={articleId}
                  initialUpvotes={comment.stats?.upvotes || 0}
                  initialDownvotes={comment.stats?.downvotes || 0}
                  userVote={comment.user_vote}
                  direction="horizontal"
                  size="xs"
                />
              )}
            </div>


            {/* Comment text with mentions */}
            {editingCommentId === comment.id ? (
              <div className="mb-2">
                <ForumMentionAutocomplete
                  value={editCommentText}
                  onChange={safeSetEditCommentText}
                  placeholder="Edit your comment..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={handleCancelEditComment}
                    className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-600 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEditComment(comment.id)}
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-gray-900 dark:text-white mb-2">
                {renderContentWithMentions(safeContent(comment.content), comment.mentions || [])}
              </div>
            )}

            {/* Comment actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
                {isAuthenticated && (
                  <button
                    onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                    className="hover:text-red-600 dark:hover:text-red-400 transition-colors font-medium"
                  >
                    {replyToId === comment.id ? 'Cancel Reply' : 'Reply'}
                  </button>
                )}
                
                
                {comment.author?.id === user?.id && editingCommentId !== comment.id && (
                  <>
                    <button 
                      onClick={() => handleEditComment(comment)}
                      className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteComment(comment.id)}
                      className="hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    >
                      Delete
                    </button>
                  </>
                )}
                {(user?.role === 'admin' || user?.role === 'moderator') && comment.author?.id !== user?.id && (
                  <button 
                    onClick={() => handleDeleteComment(comment.id)}
                    className="hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    Moderate
                  </button>
                )}
              </div>
              
              {/* Comment stats */}
              <div className="flex items-center space-x-2 text-xs text-gray-400 dark:text-gray-500">
                {comment.mentions && comment.mentions.length > 0 && (
                  <span className="flex items-center space-x-1">
                    <span>@</span>
                    <span>{comment.mentions.length}</span>
                  </span>
                )}
                {comment.replies && comment.replies.length > 0 && (
                  <span>{comment.replies.length} replies</span>
                )}
              </div>
            </div>

            {/* Reply form */}
            {replyToId === comment.id && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-start space-x-3">
                  <UserDisplay
                    user={user}
                    showAvatar={true}
                    showTeamFlair={false}
                    size="xs"
                  />
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-2">
                      Replying to <span className="font-medium text-red-600 dark:text-red-400">{comment.author?.name}</span>
                    </div>
                    <form onSubmit={handleSubmitComment}>
                      <ForumMentionAutocomplete
                        value={commentText}
                        onChange={safeSetCommentText}
                        placeholder={`Reply to ${comment.author?.name}... (Type @ to mention teams and players)`}
                        rows={3}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        autoFocus
                      />
                      <div className="flex justify-end space-x-2 mt-3">
                        <button
                          type="button"
                          onClick={() => {
                            setReplyToId(null);
                            safeSetCommentText('');
                          }}
                          className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors border border-gray-300 dark:border-gray-600 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingComment || !safeString(commentText).trim()}
                          className="px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingComment ? (
                            <span className="flex items-center">
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              Posting...
                            </span>
                          ) : (
                            'Post Reply'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
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
            {renderContentWithMentions(safeString(article.title), mentionsData)}
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
              {/* Reading time estimate */}
              {(() => {
                const readingTime = calculateReadingTime(article.content) || article.meta?.read_time;
                return readingTime ? (
                  <span>📖 {readingTime} min read</span>
                ) : null;
              })()}
              {(() => {
                const { detectedVideos } = processArticleContent(article.content, article.videos || []);
                const totalVideos = detectedVideos.length;
                return totalVideos > 0 ? (
                  <span className="text-blue-600 dark:text-blue-400">
                    📺 {totalVideos} video{totalVideos !== 1 ? 's' : ''}
                  </span>
                ) : null;
              })()}
            </div>
          </div>
        </div>

        {/* Featured image - always show */}
        <div className="aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
          <img
            src={getNewsFeaturedImageUrl(article)}
            alt={article.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://staging.mrvl.net/images/news-placeholder.svg';
            }}
          />
        </div>

        {/* Article content */}
        <div className="p-6">
          {article.excerpt && (
            <div className="text-lg text-gray-700 dark:text-gray-300 mb-6 font-medium">
              {renderContentWithMentions(safeString(article.excerpt), mentionsData)}
            </div>
          )}
          
          {/* Debug info for development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 space-y-2">
              {article.videos && article.videos.length > 0 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
                  <strong>Debug - Article Videos:</strong> {article.videos.length}
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {JSON.stringify(article.videos, null, 2)}
                  </pre>
                </div>
              )}
              {(() => {
                const { detectedVideos } = processArticleContent(article.content, article.videos || []);
                return detectedVideos.length > 0 ? (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <strong>Debug - Detected Videos:</strong> {detectedVideos.length}
                    <pre className="mt-2 text-xs overflow-auto max-h-32">
                      {JSON.stringify(detectedVideos.map(v => ({
                        type: v.type,
                        platform: v.platform,
                        id: v.id,
                        originalUrl: v.originalUrl
                      })), null, 2)}
                    </pre>
                  </div>
                ) : null;
              })()}
            </div>
          )}
          
          {/* Render content with video embeds and mentions */}
          {renderContentWithEmbeds(article.content, article.videos)}
        </div>

        {/* Article voting and sharing */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <VotingButtons
              itemType="news"
              itemId={article.id}
              initialUpvotes={article.stats?.upvotes || 0}
              initialDownvotes={article.stats?.downvotes || 0}
              userVote={article.user_vote}
              direction="horizontal"
              onVote={(voteType) => {
                trackNewsEngagement(article, voteType === 'up' ? 'upvote' : 'downvote');
              }}
            />
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
                  <ForumMentionAutocomplete
                    value={commentText}
                    onChange={safeSetCommentText}
                    placeholder="Add a comment... Type @ to mention teams and players"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      type="submit"
                      disabled={submittingComment || !safeString(commentText).trim()}
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