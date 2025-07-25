import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import ImageUpload from '../shared/ImageUpload';
import MentionDropdown from '../shared/MentionDropdown';
import EnhancedContentEditor from './EnhancedContentEditor';

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

  const isEdit = Boolean(newsId);

  const fetchNews = async () => {
    if (!isEdit) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/admin/news/${newsId}`);
      const news = response.data || response;
      setFormData({
        title: news.title || '',
        excerpt: news.excerpt || '',
        content: news.content || '',
        category: news.category || 'updates',
        status: news.status || 'draft',
        featured: news.featured || false,
        image: news.image || '',
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
  };

  const handleTitleChange = (e) => {
    handleInputChange(e);
    handleTitleInputChange(e, null);
  };

  const handleExcerptChange = (e) => {
    handleInputChange(e);
    handleExcerptInputChange(e, null);
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
      const submitData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        category_id: formData.category === 'esports' ? 1 : 
                     formData.category === 'updates' ? 2 : 
                     formData.category === 'community' ? 3 : 
                     formData.category === 'guides' ? 4 : 
                     formData.category === 'opinion' ? 5 : 1,
        status: formData.status,
        featured: formData.featured,
        featured_image: formData.image || null,
        published_at: formData.publishedAt || null,
        tags: formData.tags
      };

      let response;
      if (isEdit) {
        response = await api.put(`/admin/news/${newsId}`, submitData);
      } else {
        response = await api.post('/admin/news', submitData);
      }

      // If we have a new image file, upload it
      if (imageFile && response?.data?.data?.id) {
        const articleId = isEdit ? newsId : response.data.data.id;
        const formData = new FormData();
        formData.append('image', imageFile);
        
        try {
          await api.post(`/admin/news/${articleId}/featured-image`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Don't fail the whole operation if image upload fails
        }
      }

      alert(`News article ${isEdit ? 'updated' : 'created'} successfully!`);
      
      if (navigateTo) {
        navigateTo('admin-news');
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
    { value: 'balance', label: 'Balance Changes' },
    { value: 'esports', label: 'Esports News' },
    { value: 'content', label: 'New Content' },
    { value: 'community', label: 'Community' },
    { value: 'events', label: 'Events' }
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
          onClick={() => navigateTo && navigateTo('admin-news')}
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
                  placeholder="Enter article title... (Type @ to mention teams/players)"
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Type @ to mention teams, players, or users in the title!
              </p>
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
                  placeholder="Brief summary of the article... (Type @ to mention teams/players)"
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
                Short description that appears in article previews. Type @ to mention teams, players, or users!
              </p>
            </div>

            {/* Content */}
            <div>
              <EnhancedContentEditor
                value={formData.content}
                onChange={(newContent) => {
                  setFormData(prev => ({ ...prev, content: newContent }));
                  // Update word count
                  const words = newContent.trim().split(/\s+/).filter(word => word.length > 0);
                  setWordCount(words.length);
                }}
                placeholder="Write your article content here... Paste YouTube, Twitch, or Twitter/X URLs to embed them!"
              />
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
            onClick={() => navigateTo && navigateTo('admin-news')}
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