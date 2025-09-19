import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import ImageUpload from '../shared/ImageUpload';
import MentionDropdown from '../shared/MentionDropdown';
import VideoPreview from '../shared/VideoPreview';
import { detectAllVideoUrls, processContentForVideos, restoreVideoUrls } from '../../utils/videoUtils';

function NewsForm({ newsId, navigateTo }) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'updates',
    status: 'draft',
    featured: false,
    image: '',
    publishedAt: '',
    tags: [],
    metaTitle: '',
    metaDescription: '',
    slug: '',
    authorNotes: '',
    relatedMatches: [],
    relatedTeams: [],
    relatedPlayers: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [tagInput, setTagInput] = useState('');
  const [contentPreview, setContentPreview] = useState(false);
  const [matchSuggestions, setMatchSuggestions] = useState([]);
  const [teamSuggestions, setTeamSuggestions] = useState([]);
  const [playerSuggestions, setPlayerSuggestions] = useState([]);
  const [wordCount, setWordCount] = useState(0);
  const [detectedVideos, setDetectedVideos] = useState([]);
  const [showVideoPreview, setShowVideoPreview] = useState(true);
  const [contentStats, setContentStats] = useState({ words: 0, characters: 0, videos: 0, mentions: 0 });
  const { api } = useAuth();

  // Mention autocomplete for content
  const {
    textareaRef: contentTextareaRef,
    dropdownRef: contentDropdownRef,
    showDropdown: showContentDropdown,
    mentionResults: contentMentionResults,
    selectedIndex: contentSelectedIndex,
    loading: contentMentionLoading,
    dropdownPosition: contentDropdownPosition,
    handleInputChange: handleContentInputChange,
    handleKeyDown: handleContentKeyDown,
    selectMention: selectContentMention
  } = useMentionAutocomplete();

  // Mention autocomplete for excerpt
  const {
    textareaRef: excerptTextareaRef,
    dropdownRef: excerptDropdownRef,
    showDropdown: showExcerptDropdown,
    mentionResults: excerptMentionResults,
    selectedIndex: excerptSelectedIndex,
    loading: excerptMentionLoading,
    dropdownPosition: excerptDropdownPosition,
    handleInputChange: handleExcerptInputChange,
    handleKeyDown: handleExcerptKeyDown,
    selectMention: selectExcerptMention
  } = useMentionAutocomplete();

  // Mention autocomplete for title
  const {
    textareaRef: titleTextareaRef,
    dropdownRef: titleDropdownRef,
    showDropdown: showTitleDropdown,
    mentionResults: titleMentionResults,
    selectedIndex: titleSelectedIndex,
    loading: titleMentionLoading,
    dropdownPosition: titleDropdownPosition,
    handleInputChange: handleTitleInputChange,
    handleKeyDown: handleTitleKeyDown,
    selectMention: selectTitleMention
  } = useMentionAutocomplete();

  const isEdit = Boolean(newsId);

  const fetchNews = async () => {
    if (!isEdit) return;

    try {
      setLoading(true);
      const response = await api.get(`/admin/news/${newsId}`);
      const news = response.data || response;

      // Restore video URLs from placeholders for editing
      let restoredContent = news.content || '';
      if (news.videos && news.videos.length > 0) {
        restoredContent = restoreVideoUrls(news.content, news.videos);
        console.log('🎥 Restored video URLs for editing:', {
          original: news.content,
          restored: restoredContent,
          videos: news.videos
        });
      }

      setFormData({
        title: news.title || '',
        excerpt: news.excerpt || '',
        content: restoredContent,
        category: news.category || 'updates',
        status: news.status || 'draft',
        featured: news.featured || false,
        // Use featured_image field, not image field
        image: news.featured_image || news.image || '',
        publishedAt: news.published_at ? news.published_at.split('T')[0] : '',
        tags: news.tags || []
      });
    } catch (error) {
      console.error('Error fetching news:', error);
      alert('Error loading news data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, [newsId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    analyzeContent();
  }, [formData.title, formData.excerpt, formData.content]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleContentChange = (e) => {
    handleInputChange(e);
    handleContentInputChange(e, null);
    // Debounce content analysis
    setTimeout(() => analyzeContent(), 300);
  };

  const handleExcerptChange = (e) => {
    handleInputChange(e);
    handleExcerptInputChange(e, null);
    analyzeContent();
  };

  const handleTitleChange = (e) => {
    handleInputChange(e);
    handleTitleInputChange(e, null);
    analyzeContent();
  };

  // Analyze content for stats
  const analyzeContent = () => {
    const content = formData.content || '';
    const title = formData.title || '';
    const excerpt = formData.excerpt || '';
    
    const allText = `${title} ${excerpt} ${content}`;
    const words = allText.trim().split(/\s+/).filter(word => word.length > 0).length;
    const characters = content.length;
    
    const videos = detectAllVideoUrls(content);
    const mentionPattern = /\w+|team:\w+|player:\w+/g;
    const mentions = (allText.match(mentionPattern) || []).length;
    
    setContentStats({ words, characters, videos: videos.length, mentions });
    setDetectedVideos(videos);
  };

  const handleVideoDetected = (videos) => {
    setDetectedVideos(videos);
  };

  const handleImageSelect = (file, previewUrl) => {
    setImageFile(file);
    setFormData(prev => ({
      ...prev,
      image: previewUrl || ''
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (!formData.excerpt.trim()) {
      alert('Excerpt is required');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('Content is required');
      return;
    }
    
    if (formData.content.trim().length < 50) {
      alert('Content must be at least 50 characters long');
      return;
    }

    setSaving(true);

    try {
      // Process content to extract video information
      const { processedContent, videos } = processContentForVideos(formData.content.trim());
      
      const submitData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: processedContent, // Use processed content
        category_id: formData.category === 'updates' ? 1 : 
                     formData.category === 'esports' ? 2 : 
                     formData.category === 'balance' ? 3 : 
                     formData.category === 'community' ? 4 : 
                     formData.category === 'content' ? 5 : 
                     formData.category === 'events' ? 6 : 1,
        status: formData.status,
        featured: formData.featured,
        // Don't send featured_image in the initial submission if we have a new file to upload
        featured_image: (imageFile ? null : formData.image) || null,
        published_at: formData.publishedAt || null,
        tags: formData.tags,
        videos: videos.map(video => ({
          platform: video.type,
          video_id: video.id,
          embed_url: video.embedUrl || null,
          original_url: video.originalUrl
        }))
      };

      let response;
      if (isEdit) {
        response = await api.put(`/admin/news/${newsId}`, submitData);
      } else {
        response = await api.post('/admin/news', submitData);
      }

      // If we have a new image file, upload it
      if (imageFile && (isEdit || response?.data?.data?.id)) {
        const articleId = isEdit ? newsId : response.data.data.id;
        const imageFormData = new FormData();
        imageFormData.append('image', imageFile);  // Changed from 'featured_image' to 'image'
        imageFormData.append('news_id', articleId); // Add news_id to the form data
        
        try {
          // Use the dedicated postFile method which handles Bearer token authentication correctly
          const imageResponse = await api.postFile('user/news/media/featured-image', imageFormData);
          console.log('Featured image upload response:', imageResponse);
          
          // Update the form data with the returned image path
          if (imageResponse?.data?.data?.path || imageResponse?.data?.path) {
            // Use the path from the response
            const imagePath = imageResponse.data.data?.path || imageResponse.data.path;
            console.log('Image upload successful, path:', imagePath);
            setFormData(prev => ({
              ...prev,
              image: imagePath
            }));
          }
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          alert('Image uploaded but there was an error updating the article. Please try uploading the image again.');
          // Don't fail the whole operation if image upload fails
        }
      }

      alert(`News article ${isEdit ? 'updated' : 'created'} successfully!`);
      
      if (navigateTo) {
        // Support both callback function and route-based navigation
        if (typeof navigateTo === 'function') {
          navigateTo();
        } else {
          navigateTo('admin-news');
        }
      }
    } catch (error) {
      console.error('Error saving news:', error);
      alert(`Error ${isEdit ? 'updating' : 'creating'} news article: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const categories = [
    { value: 'updates', label: 'Game Updates' },
    { value: 'esports', label: 'Esports' },
    { value: 'balance', label: 'Hero Balance' },
    { value: 'community', label: 'Community' },
    { value: 'content', label: 'Dev Insights' },
    { value: 'events', label: 'Analysis' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading news data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit News Article' : 'Create News Article'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update news article' : 'Create a new news article'}
          </p>
        </div>
        <button 
          onClick={() => navigateTo && (typeof navigateTo === 'function' ? navigateTo() : navigateTo('admin-news'))}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to News
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Article Content</h3>
          
          <div className="space-y-6">
            {/* Featured Image */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Featured Image
              </label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={formData.image}
                placeholder="Upload Article Image"
                className="w-full max-w-md"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Title *
              </label>
              <div className="relative">
                <input
                  ref={titleTextareaRef}
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  onKeyDown={(e) => {
                    const result = handleTitleKeyDown(e, null);
                    if (result?.selectMention) {
                      selectTitleMention(result.selectMention, (newValue) => {
                        setFormData(prev => ({ ...prev, title: newValue }));
                      }, formData.title);
                    }
                  }}
                  className="form-input"
                  placeholder="Enter article title... (Type  to mention teams/players)"
                  required
                />
                <MentionDropdown
                  show={showTitleDropdown}
                  results={titleMentionResults}
                  selectedIndex={titleSelectedIndex}
                  loading={titleMentionLoading}
                  position={titleDropdownPosition}
                  onSelect={(mention) => selectTitleMention(mention, (newValue) => {
                    setFormData(prev => ({ ...prev, title: newValue }));
                  }, formData.title)}
                  dropdownRef={titleDropdownRef}
                />
              </div>
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Excerpt *
              </label>
              <div className="relative">
                <textarea
                  ref={excerptTextareaRef}
                  name="excerpt"
                  value={formData.excerpt}
                  onChange={handleExcerptChange}
                  onKeyDown={(e) => {
                    const result = handleExcerptKeyDown(e, null);
                    if (result?.selectMention) {
                      selectExcerptMention(result.selectMention, (newValue) => {
                        setFormData(prev => ({ ...prev, excerpt: newValue }));
                      }, formData.excerpt);
                    }
                  }}
                  rows={2}
                  className="form-input"
                  placeholder="Brief summary of the article... (Type  to mention teams/players)"
                  required
                />
                <MentionDropdown
                  show={showExcerptDropdown}
                  results={excerptMentionResults}
                  selectedIndex={excerptSelectedIndex}
                  loading={excerptMentionLoading}
                  position={excerptDropdownPosition}
                  onSelect={(mention) => selectExcerptMention(mention, (newValue) => {
                    setFormData(prev => ({ ...prev, excerpt: newValue }));
                  }, formData.excerpt)}
                  dropdownRef={excerptDropdownRef}
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Short description that appears in article previews. Type  to mention teams, players, or users!
              </p>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Content *
                </label>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                  <span className={contentStats.characters < 50 ? 'text-red-500' : ''}>
                    {contentStats.characters} chars
                  </span>
                  <span>{contentStats.words} words</span>
                  {contentStats.videos > 0 && (
                    <span className="text-blue-600 dark:text-blue-400">
                       {contentStats.videos} video{contentStats.videos !== 1 ? 's' : ''}
                    </span>
                  )}
                  {contentStats.mentions > 0 && (
                    <span className="text-purple-600 dark:text-purple-400">
                       {contentStats.mentions} mention{contentStats.mentions !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <textarea
                  ref={contentTextareaRef}
                  name="content"
                  value={formData.content}
                  onChange={handleContentChange}
                  onKeyDown={(e) => {
                    const result = handleContentKeyDown(e, null);
                    if (result?.selectMention) {
                      selectContentMention(result.selectMention, (newValue) => {
                        setFormData(prev => ({ ...prev, content: newValue }));
                      }, formData.content);
                    }
                  }}
                  rows={12}
                  className="form-input"
                  placeholder="Write your article content here... 

 Type  to mention teams, players, or users
 Add video links (YouTube, Twitch, Twitter):
   • YouTube: https://youtube.com/watch?v=VIDEO_ID
   • Twitch Clips: https://clips.twitch.tv/CLIP_ID  
   • Twitch Videos: https://twitch.tv/videos/VIDEO_ID
   • Twitter: https://twitter.com/user/status/TWEET_ID

 Add VLR.gg esports content:
   • Matches: https://vlr.gg/12345/match-name
   • Teams: https://vlr.gg/team/123/team-name
   • Events: https://vlr.gg/event/456/tournament-name
   • Players: https://vlr.gg/player/789/player-name

All content will auto-embed with rich previews and metadata!"
                  required
                />
                <MentionDropdown
                  show={showContentDropdown}
                  results={contentMentionResults}
                  selectedIndex={contentSelectedIndex}
                  loading={contentMentionLoading}
                  position={contentDropdownPosition}
                  onSelect={(mention) => selectContentMention(mention, (newValue) => {
                    setFormData(prev => ({ ...prev, content: newValue }));
                  }, formData.content)}
                  dropdownRef={contentDropdownRef}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                <strong>Content Guidelines:</strong>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Minimum 50 characters required for publication</li>
                  <li>Use <code>username</code> to mention users, <code>team:name</code> for teams, <code>player:name</code> for players</li>
                  <li>Paste video/content URLs directly - they'll auto-embed! (YouTube, Twitch clips/videos, Twitter, VLR.gg matches/teams/events)</li>
                  <li>Write in engaging, professional esports journalism style</li>
                  <li>Include relevant context and background information</li>
                </ul>
              </div>
              
              {/* Video Preview */}
              {formData.content && showVideoPreview && (
                <VideoPreview
                  content={formData.content}
                  onVideoDetected={handleVideoDetected}
                  className="mt-3"
                />
              )}
            </div>
          </div>
        </div>

        {/* Article Settings */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Article Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Publish Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Publish Date
              </label>
              <input
                type="date"
                name="publishedAt"
                value={formData.publishedAt}
                onChange={handleInputChange}
                className="form-input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave blank to publish immediately
              </p>
            </div>

            {/* Featured */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="mr-2"
                id="featured"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Feature this article
              </label>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tags</h3>
          
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="form-input flex-1"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateTo && (typeof navigateTo === 'function' ? navigateTo() : navigateTo('admin-news'))}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEdit ? 'Update Article' : 'Create Article'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default NewsForm;