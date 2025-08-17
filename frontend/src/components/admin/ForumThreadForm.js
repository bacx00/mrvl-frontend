import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function ForumThreadForm({ threadId, navigateTo, params }) {
  const { api, user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    pinned: false,
    locked: false,
    sticky: false
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const isEdit = Boolean(threadId || params?.editId);
  const actualThreadId = threadId || params?.editId;

  useEffect(() => {
    fetchCategories();
    if (isEdit && actualThreadId) {
      fetchThread();
    }
  }, [actualThreadId]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/forums/categories');
      const categoriesData = response?.data?.data || response?.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      
      // Set default category if creating new thread
      if (!isEdit && categoriesData.length > 0) {
        setFormData(prev => ({
          ...prev,
          category_id: categoriesData[0].id
        }));
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const fetchThread = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/forums/threads/${actualThreadId}`);
      const thread = response?.data?.data || response?.data || {};
      
      setFormData({
        title: thread.title || '',
        content: thread.content || '',
        category_id: thread.category?.id || thread.category_id || '',
        pinned: thread.pinned || false,
        locked: thread.locked || false,
        sticky: thread.sticky || false
      });
    } catch (err) {
      console.error('Error fetching thread:', err);
      alert('Failed to load thread data');
    } finally {
      setLoading(false);
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
    
    if (!formData.category_id) {
      alert('Please select a category');
      return;
    }
    
    setSaving(true);
    
    try {
      const submitData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category_id: formData.category_id,
        pinned: formData.pinned,
        locked: formData.locked,
        sticky: formData.sticky
      };
      
      if (isEdit) {
        // Update existing thread
        await api.put(`/admin/forums/${actualThreadId}`, submitData);
        alert('Thread updated successfully!');
      } else {
        // Create new thread
        const response = await api.post('/forums/threads', {
          ...submitData,
          user_id: user?.id
        });
        alert('Thread created successfully!');
        
        // Navigate to the new thread
        const newThreadId = response?.data?.data?.id || response?.data?.id;
        if (newThreadId) {
          navigateTo('thread-detail', { id: newThreadId });
          return;
        }
      }
      
      // Go back to admin forums
      navigateTo('admin-forums');
      
    } catch (err) {
      console.error('Error saving thread:', err);
      const errorMsg = err.response?.data?.message || 'Failed to save thread';
      alert(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigateTo('admin-forums');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">Loading thread data...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {isEdit ? 'Edit Thread' : 'Create New Thread'}
        </h2>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              placeholder="Enter thread title..."
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({...formData, category_id: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({...formData, content: e.target.value})}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              rows="12"
              placeholder="Enter thread content..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              You can use @username to mention users, @team:teamname for teams, and @player:playername for players
            </p>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Thread Options</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) => setFormData({...formData, pinned: e.target.checked})}
                  className="mr-2"
                />
                <span>Pin this thread (appears at the top of the category)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.sticky}
                  onChange={(e) => setFormData({...formData, sticky: e.target.checked})}
                  className="mr-2"
                />
                <span>Make sticky (stays at the top even when not recent)</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.locked}
                  onChange={(e) => setFormData({...formData, locked: e.target.checked})}
                  className="mr-2"
                />
                <span>Lock this thread (no new replies allowed)</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : (isEdit ? 'Update Thread' : 'Create Thread')}
            </button>
            
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ForumThreadForm;