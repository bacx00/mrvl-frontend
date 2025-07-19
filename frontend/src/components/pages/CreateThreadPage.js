import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import MentionDropdown from '../shared/MentionDropdown';

function CreateThreadPage({ navigateTo }) {
  const { user, api } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContentChange = (e) => {
    handleInputChange(e);
    handleContentInputChange(e, null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to create a thread');
      return;
    }

    if (!formData.title.trim()) {
      setError('Thread title is required');
      return;
    }

    if (!formData.content.trim()) {
      setError('Thread content is required');
      return;
    }

    // FIXED: Match backend validation - minimum 10 characters
    if (formData.content.trim().length < 10) {
      setError('Thread content must be at least 10 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 CreateThreadPage: Submitting thread...');
      
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim()
      };

      console.log('💾 CreateThreadPage: Submit data:', submitData);

      // Try to create thread via API
      const response = await api.post('/user/forums/threads', submitData);
      
      console.log('✅ CreateThreadPage: Thread created successfully:', response);
      
      const threadData = response.data || response;
      const threadId = threadData.id;

      alert('✅ Thread created successfully!');
      
      // CRITICAL FIX: Emit events to refresh forum list and categories
      window.dispatchEvent(new CustomEvent('forum-thread-created'));
      window.dispatchEvent(new CustomEvent('forum-category-updated'));
      
      // Navigate to the created thread or back to forums
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input w-full"
                placeholder="e.g., Iron Man is too overpowered in ranked matches"
                maxLength="200"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.title.length}/200 characters
              </p>
            </div>


            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Content *
              </label>
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
                  className="form-input w-full"
                  placeholder="Share your thoughts, strategies, feedback, or questions about Marvel Rivals...

You can discuss:
• Hero balance and gameplay mechanics (@player:s1mple, @team:navi)
• Strategic tips and team compositions
• Tournament results and esports news
• Bug reports and technical issues
• Team recruitment and player connections

Type @ to mention teams, players, or users!"
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
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum 10 characters, be descriptive and helpful. Type @ to mention teams, players, or users!
              </p>
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

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateTo('forums')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title.trim() || !formData.content.trim()}
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
      </form>
    </div>
  );
}

export default CreateThreadPage;