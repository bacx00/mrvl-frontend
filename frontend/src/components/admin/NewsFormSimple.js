import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import SimpleTextEditor from '../../app/components/SimpleTextEditor.tsx';
import { getImageUrl } from '../../utils/imageUrlUtils';

function NewsFormSimple({ newsId, navigateTo }) {
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    category: 'news',
    status: 'draft',
    featured: false,
    featured_image: '',
    published_at: new Date().toISOString().split('T')[0],
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const { api } = useAuth();

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
        category: news.category || 'news',
        status: news.status || 'draft',
        featured: news.featured || false,
        featured_image: news.featured_image || '',
        published_at: news.published_at ? news.published_at.split('T')[0] : new Date().toISOString().split('T')[0],
        tags: news.tags || []
      });
      setImagePreview(news.featured_image ? getImageUrl(news.featured_image) : '');
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('Content is required');
      return;
    }
    
    // Validate content length (backend requires at least 50 characters)
    if (formData.content.trim().length < 50) {
      alert('Article content must be at least 50 characters long. Please add more details to your article.');
      return;
    }

    setSaving(true);

    try {
      // Prepare JSON data for article creation/update
      const submitData = {
        title: formData.title.trim(),
        excerpt: formData.excerpt.trim(),
        content: formData.content.trim(),
        category_id: getCategoryId(formData.category),
        status: formData.status,
        featured: formData.featured,
        published_at: formData.published_at,
        featured_image: formData.featured_image || null
      };

      let response;
      if (isEdit) {
        response = await api.put(`/admin/news/${newsId}`, submitData);
      } else {
        response = await api.post('/admin/news', submitData);
      }

      // If we have a new image file, upload it separately
      if (imageFile && response?.data) {
        const articleId = isEdit ? newsId : (response.data.data?.id || response.data.id);
        const imageFormData = new FormData();
        imageFormData.append('featured_image', imageFile);
        
        try {
          await api.post(`/admin/news/${articleId}/featured-image`, imageFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          // Don't fail the whole operation if image upload fails
          alert('Article saved but image upload failed. You can try uploading the image again.');
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

  const getCategoryId = (category) => {
    const categoryMap = {
      'news': 1,
      'esports': 1,
      'updates': 2,
      'community': 3,
      'guides': 4,
      'opinion': 5,
      'balance': 2,
      'content': 2,
      'events': 1
    };
    return categoryMap[category] || 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-[#fa4454] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button 
          onClick={() => navigateTo && navigateTo('admin-news')}
          className="text-[#768894] hover:text-white mb-4 inline-flex items-center"
        >
          ← Back to News
        </button>
        <h1 className="text-3xl font-bold text-white">
          {isEdit ? 'Edit Article' : 'Create Article'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-[#0f1419] border border-[#2b3d4d] rounded-lg text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none text-xl"
            placeholder="e.g., Team Liquid signs new roster for VCT 2025"
            required
          />
        </div>

        {/* Featured Image */}
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4">
          <label className="block text-sm font-medium text-[#768894] mb-3">
            Featured Image
          </label>
          
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                  setFormData(prev => ({ ...prev, featured_image: '' }));
                }}
                className="absolute top-2 right-2 bg-[#ef4444] text-white px-3 py-1 rounded text-sm hover:bg-[#dc2626]"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="block">
              <div className="border-2 border-dashed border-[#2b3d4d] rounded-lg p-8 text-center cursor-pointer hover:border-[#fa4454] transition-colors">
                <svg className="w-12 h-12 text-[#768894] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-[#768894]">Click to upload image</p>
                <p className="text-xs text-[#768894] mt-1">PNG, JPG up to 5MB</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-sm font-medium text-[#768894] mb-2">
            Summary (optional)
          </label>
          <textarea
            name="excerpt"
            value={formData.excerpt}
            onChange={handleInputChange}
            rows={2}
            className="w-full p-3 bg-[#0f1419] border border-[#2b3d4d] rounded-lg text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none resize-none"
            placeholder="e.g., The European powerhouse completes their roster with two new signings ahead of the upcoming season."
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-[#768894]">
              Content
            </label>
            <span className={`text-xs ${formData.content.trim().length < 50 ? 'text-red-400' : 'text-[#768894]'}`}>
              {formData.content.trim().length} / 50 minimum characters
            </span>
          </div>
          <SimpleTextEditor
            value={formData.content}
            onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
            placeholder="Write your article content here (minimum 50 characters). Include details about teams, players, tournament results, or game updates. Follow the style of professional esports journalism."
            rows={15}
          />
        </div>

        {/* Settings Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-[#768894] mb-1">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:border-[#fa4454] focus:outline-none text-sm"
            >
              <option value="esports">Esports</option>
              <option value="news">General News</option>
              <option value="updates">Game Updates</option>
              <option value="events">Events</option>
              <option value="community">Community</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-[#768894] mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:border-[#fa4454] focus:outline-none text-sm"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Publish Date */}
          <div>
            <label className="block text-xs font-medium text-[#768894] mb-1">
              Publish Date
            </label>
            <input
              type="date"
              name="published_at"
              value={formData.published_at}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:border-[#fa4454] focus:outline-none text-sm"
            />
          </div>

          {/* Featured */}
          <div className="flex items-end">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="w-4 h-4 text-[#fa4454] bg-[#0f1419] border-[#2b3d4d] rounded focus:ring-[#fa4454] focus:ring-2"
              />
              <span className="text-sm text-[#768894]">Featured</span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-between pt-6">
          <button
            type="button"
            onClick={() => navigateTo && navigateTo('admin-news')}
            className="px-6 py-2 text-[#768894] hover:text-white transition-colors"
          >
            Cancel
          </button>
          
          <div className="flex items-center space-x-3">
            <button
              type="submit"
              name="status"
              value="draft"
              onClick={(e) => {
                setFormData(prev => ({ ...prev, status: 'draft' }));
              }}
              className="px-6 py-2 bg-[#2b3d4d] text-white rounded-lg hover:bg-[#374555] transition-colors"
              disabled={saving}
            >
              Save as Draft
            </button>
            
            <button
              type="submit"
              name="status"
              value="published"
              onClick={(e) => {
                setFormData(prev => ({ ...prev, status: 'published' }));
              }}
              className="px-6 py-2 bg-[#fa4454] text-white rounded-lg hover:bg-[#e03e4e] transition-colors"
              disabled={saving}
            >
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Publish')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default NewsFormSimple;