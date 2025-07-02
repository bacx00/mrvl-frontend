import React, { useState } from 'react';
import { useAuth } from '../../hooks';

function CreateThreadPage({ navigateTo }) {
  const { user, api } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    content: '',
    tags: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ✅ MINIMAL CATEGORIES - Only ones that work on backend  
  const categories = [
    { id: 'general', name: 'General Discussion', description: 'General Marvel Rivals discussion' },
    { id: 'strategy', name: 'Strategy & Tactics', description: 'Share strategies and gameplay tactics' },
    { id: 'guides', name: 'Guides & Tutorials', description: 'Player guides and tutorials' },
    { id: 'feedback', name: 'Feedback & Suggestions', description: 'Game feedback and improvement suggestions' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        category: formData.category,
        content: formData.content.trim(),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        author_id: user.id
      };

      console.log('💾 CreateThreadPage: Submit data:', submitData);

      // Try to create thread via API
      const response = await api.post('/forums/threads', submitData);
      
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

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input w-full"
                required
              >
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {categories.find(c => c.id === formData.category)?.description}
              </p>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Content *
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={12}
                className="form-input w-full"
                placeholder="Share your thoughts, strategies, feedback, or questions about Marvel Rivals...

You can discuss:
• Hero balance and gameplay mechanics
• Strategic tips and team compositions
• Tournament results and esports news
• Bug reports and technical issues
• Team recruitment and player connections

Be respectful and constructive in your discussions!"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Minimum 10 characters, be descriptive and helpful
              </p>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tags (Optional)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="form-input w-full"
                placeholder="e.g., iron-man, balance, ranked, strategy"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Separate multiple tags with commas. Use relevant tags to help others find your thread.
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