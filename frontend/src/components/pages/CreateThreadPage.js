import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks';
import { useActivityStatsContext } from '../../contexts/ActivityStatsContext';
import ForumMentionAutocomplete from '../shared/ForumMentionAutocomplete';
import MentionTextarea from '../shared/MentionTextarea';
import { Mic, MicOff, Image, X, Camera, Upload, Smile, Eye, Save, ChevronDown } from 'lucide-react';

function CreateThreadPage({ navigateTo }) {
  const { user, api } = useAuth();
  const { triggerForumThread } = useActivityStatsContext();

  // Safe wrapper function for string operations
  const safeString = (value) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
      if (typeof value.name === 'string') return value.name;
      if (typeof value.title === 'string') return value.title;
      if (typeof value.value === 'string') return value.value;
    }
    return String(value || ''); // Convert anything else to string, empty string if null/undefined
  };
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Mobile-specific state
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDraft, setIsDraft] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  
  // Refs
  const mediaRecorderRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTitleChange = (value) => {
    // Extract string value safely to prevent [object Object] display
    let titleValue = '';
    
    if (typeof value === 'string') {
      titleValue = value;
    } else if (value && typeof value === 'object' && value.target && typeof value.target.value === 'string') {
      titleValue = value.target.value;
    } else if (value && typeof value === 'object') {
      // Log unexpected object types for debugging
      console.warn('CreateThreadPage: Unexpected title value type:', value);
      titleValue = ''; // Don't serialize objects
    } else {
      titleValue = String(value || ''); // Fallback for primitive types
    }
    
    setFormData(prev => ({
      ...prev,
      title: titleValue
    }));
  };

  const handleContentChange = (value) => {
    // Extract string value safely to prevent [object Object] display
    let contentValue = '';
    
    if (typeof value === 'string') {
      contentValue = value;
    } else if (value && typeof value === 'object' && value.target && typeof value.target.value === 'string') {
      contentValue = value.target.value;
    } else if (value && typeof value === 'object') {
      // Log unexpected object types for debugging
      console.warn('CreateThreadPage: Unexpected content value type:', value);
      contentValue = ''; // Don't serialize objects
    } else {
      contentValue = String(value || ''); // Fallback for primitive types
    }
    
    setFormData(prev => ({
      ...prev,
      content: contentValue
    }));
  };

  // Load categories and draft on mount
  useEffect(() => {
    loadCategories();
    loadDraft();
  }, []);

  // Auto-save draft
  useEffect(() => {
    if (formData.title || formData.content) {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 5000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.title, formData.content]);

  const loadCategories = async () => {
    try {
      const response = await api.get('/forums/categories');
      setCategories(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadDraft = () => {
    try {
      const savedDraft = localStorage.getItem('forum-thread-draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        // Ensure draft data contains proper string values
        const safeDraft = {
          ...draft,
          title: safeString(draft.title),
          content: safeString(draft.content)
        };
        setFormData(prev => ({ ...prev, ...safeDraft }));
        setIsDraft(true);
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
  };

  const saveDraft = () => {
    try {
      localStorage.setItem('forum-thread-draft', JSON.stringify({
        title: safeString(formData.title),
        content: safeString(formData.content),
        category: formData.category
      }));
      setIsDraft(true);
    } catch (error) {
      console.error('Failed to save draft:', error);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem('forum-thread-draft');
      setIsDraft(false);
    } catch (error) {
      console.error('Failed to clear draft:', error);
    }
  };

  // Voice-to-Text functionality
  const startVoiceRecording = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        
        setFormData(prev => ({
          ...prev,
          content: prev.content + transcript
        }));
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser');
    }
  };

  const stopVoiceRecording = () => {
    if (speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Image upload functionality
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const image = {
            id: Date.now() + Math.random(),
            file,
            url: e.target.result,
            name: file.name
          };
          setUploadedImages(prev => [...prev, image]);
          
          // Insert image markdown into content
          const imageMarkdown = `\n![${file.name}](${e.target.result})\n`;
          setFormData(prev => ({
            ...prev,
            content: prev.content + imageMarkdown
          }));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const removeImage = (imageId) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Emoji support
  const insertEmoji = (emoji) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + emoji
    }));
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['👍', '👎', '😄', '😢', '😡', '🤔', '👀', '🔥', '💯', '❤️', '⚡', '🎯'];

  // Enhanced mobile submit
  const handleMobileSubmit = async () => {
    // Validate on mobile
    const titleString = safeString(formData.title);
    if (!titleString.trim()) {
      alert('Please enter a thread title');
      return;
    }
    
    const contentString = safeString(formData.content);
    if (!contentString.trim()) {
      alert('Please enter thread content');
      return;
    }

    if (contentString.trim().length < 10) {
      alert('Thread content must be at least 10 characters');
      return;
    }

    await handleSubmit({ preventDefault: () => {} });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a thread');
      return;
    }

    const safeTitle = safeString(formData.title);
    const safeContent = safeString(formData.content);
    
    if (!safeTitle.trim()) {
      setError('Thread title is required');
      return;
    }

    if (!safeContent.trim()) {
      setError('Thread content is required');
      return;
    }

    // FIXED: Match backend validation - minimum 10 characters
    if (safeContent.trim().length < 10) {
      setError('Thread content must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 CreateThreadPage: Submitting thread...');
      
      const submitData = {
        title: safeTitle.trim(),
        content: safeContent.trim()
      };

      console.log('💾 CreateThreadPage: Submit data:', submitData);

      // Try to create thread via API
      const response = await api.post('/user/forums/threads', submitData);
      
      console.log('✅ CreateThreadPage: Thread created successfully:', response);
      
      const threadData = response.data || response;
      const threadId = threadData.id;

      alert('✅ Thread created successfully!');
      
      // Trigger activity stats update for forum thread creation
      triggerForumThread();
      
      // CRITICAL FIX: Emit events to refresh forum list and categories
      window.dispatchEvent(new CustomEvent('forum-thread-created'));
      window.dispatchEvent(new CustomEvent('forum-category-updated'));
      
      // Clear draft and navigate
      clearDraft();
      
      setTimeout(() => {
        if (threadId) {
          navigateTo('thread-detail', { id: threadId });
        } else {
          navigateTo('forums');
        }
      }, 1000);

    } catch (error) {
      console.error('❌ CreateThreadPage: Error creating thread:', error);
      
      // Enhanced error handling with backend issue highlighting
      if (error.message.includes('401')) {
        setError('🚨 AUTHENTICATION ISSUE: Please log in again to create threads.');
      } else if (error.message.includes('403')) {
        setError('🚨 PERMISSION ISSUE: You do not have permission to create threads.');
      } else if (error.message.includes('422')) {
        setError('🚨 VALIDATION ISSUE: Please check your thread title and content.');
      } else if (error.message.includes('404')) {
        setError('🚨 BACKEND ISSUE: Forum threads API endpoint not found. Please implement /api/forums/threads endpoint.');
      } else if (error.message.includes('500')) {
        setError('🚨 BACKEND ISSUE: Server error when creating thread. Check backend forum implementation.');
      } else {
        setError(`Failed to create thread: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Login Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to be logged in to create forum threads and participate in discussions.
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => {
                // Trigger main auth modal
                window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'));
              }}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign In / Sign Up
            </button>
            <button 
              onClick={() => navigateTo('forums')}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Back to Forums
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-16 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg z-40 -mx-4 px-4 py-3 border-b border-gray-200 dark:border-gray-700 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => navigateTo('forums')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 touch-optimized"
            >
              <ChevronDown className="w-5 h-5 transform rotate-90" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">New Thread</h1>
              {isDraft && (
                <p className="text-xs text-blue-500 dark:text-blue-400">Draft saved</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {showPreview ? (
              <button
                onClick={() => setShowPreview(false)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => setShowPreview(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleMobileSubmit}
              disabled={loading || !safeString(formData.title).trim() || !safeString(formData.content).trim()}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed touch-optimized"
            >
              {loading ? '...' : 'Post'}
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Create New Thread</h1>
          <p className="text-gray-600 dark:text-gray-400">Start a new discussion in the Marvel Rivals community</p>
        </div>
        <button 
          onClick={() => navigateTo('forums')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Forums
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleImageUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${
            error.includes('BACKEND ISSUE') || error.includes('AUTHENTICATION ISSUE') || error.includes('PERMISSION ISSUE')
              ? 'bg-red-100 border-red-400 text-red-700' 
              : 'bg-yellow-100 border-yellow-400 text-yellow-700'
          }`}>
            {error}
            {error.includes('BACKEND ISSUE') && (
              <div className="mt-2 text-sm">
                <strong>For Backend Developer:</strong> Please implement the forum threads API endpoint with proper validation.
              </div>
            )}
          </div>
        )}

        <div className="card p-6">
          <div className="space-y-6">
            {/* Thread Title */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Thread Title *
              </label>
              <ForumMentionAutocomplete
                value={safeString(formData.title)}
                onChange={handleTitleChange}
                placeholder="e.g., Iron Man is too overpowered in ranked matches (@player:shroud thoughts?)"
                className="form-input w-full mobile-input-no-zoom"
                rows={1}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {safeString(formData.title).length}/200 characters • Use @ to mention users, teams, or players in title
                </p>
                {isDraft && (
                  <span className="text-xs text-blue-500 dark:text-blue-400">Auto-saved</span>
                )}
              </div>
            </div>

            {/* Category Selection - Mobile */}
            <div className="lg:hidden">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input w-full mobile-input-no-zoom"
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.slug}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mobile Media Controls */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Media & Voice</span>
                <div className="flex items-center space-x-2">
                  {/* Voice Recording */}
                  <button
                    type="button"
                    onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                    className={`p-2 rounded-lg touch-optimized transition-colors ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-500'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Camera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-blue-50 hover:text-blue-500 touch-optimized"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  {/* Gallery */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-50 hover:text-green-500 touch-optimized"
                  >
                    <Image className="w-5 h-5" />
                  </button>

                  {/* Emojis */}
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-50 hover:text-yellow-500 touch-optimized"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                  <div className="grid grid-cols-6 gap-2">
                    {commonEmojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-optimized"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Voice Recording Status */}
              {isRecording && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-3">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">Recording... Speak now</span>
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Uploaded Images
                </label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {uploadedImages.map((image) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(image.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            {/* Content */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Content *
                </label>
                <div className="lg:hidden flex items-center space-x-2">
                  {!showPreview && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(true)}
                      className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Preview
                    </button>
                  )}
                  {showPreview && (
                    <button
                      type="button"
                      onClick={() => setShowPreview(false)}
                      className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {showPreview ? (
                <div className="min-h-[200px] p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {safeString(formData.content) ? (
                      safeString(formData.content).split('\n').map((paragraph, index) => (
                        <p key={index} className="mb-2 last:mb-0">{paragraph}</p>
                      ))
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400 italic">Preview will appear here...</p>
                    )}
                  </div>
                </div>
              ) : (
                <ForumMentionAutocomplete
                  value={safeString(formData.content)}
                  onChange={handleContentChange}
                  rows={window.innerWidth < 768 ? 8 : 12}
                  className="form-input w-full mobile-input-no-zoom"
                  placeholder="Share your thoughts, strategies, feedback, or questions about Marvel Rivals...

You can discuss:
• Hero balance and gameplay mechanics (@player:s1mple, @team:navi)
• Strategic tips and team compositions
• Tournament results and esports news
• Bug reports and technical issues
• Team recruitment and player connections

Type @ to mention teams, players, or users!"
                  maxLength={10000}
                />
              )}
              
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {safeString(formData.content).length}/10000 characters (min 10)
                </p>
                <div className="lg:hidden flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => saveDraft()}
                    className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-500 flex items-center space-x-1"
                  >
                    <Save className="w-3 h-3" />
                    <span>Save Draft</span>
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Community Guidelines */}
        <div className="card p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">Community Guidelines</h3>
          <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Be respectful and constructive in your discussions</li>
            <li>• Keep content relevant to Marvel Rivals</li>
            <li>• Use appropriate language and avoid toxicity</li>
            <li>• Search existing threads before creating duplicates</li>
            <li>• Use descriptive titles and proper categories</li>
          </ul>
        </div>

        {/* Desktop Submit Buttons */}
        <div className="hidden lg:flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateTo('forums')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !safeString(formData.title).trim() || !safeString(formData.content).trim()}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Creating Thread...
              </span>
            ) : (
              'Create Thread'
            )}
          </button>
        </div>

        {/* Mobile Bottom Actions */}
        <div className="lg:hidden sticky bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg -mx-6 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {safeString(formData.content).length < 10 ? 
                  `${10 - safeString(formData.content).length} more characters` : 
                  'Ready to post'
                }
              </span>
              {isDraft && (
                <div className="flex items-center space-x-1 text-xs text-blue-500 dark:text-blue-400">
                  <Save className="w-3 h-3" />
                  <span>Saved</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => clearDraft()}
                disabled={!isDraft}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 disabled:opacity-50"
              >
                Clear Draft
              </button>
              <button
                type="button"
                onClick={handleMobileSubmit}
                disabled={loading || !safeString(formData.title).trim() || !safeString(formData.content).trim() || safeString(formData.content).length < 10}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-optimized font-medium"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Posting...</span>
                  </span>
                ) : (
                  'Post Thread'
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CreateThreadPage;