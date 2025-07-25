import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';

function NewsCategoriesPage({ navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    color: '#6b7280',
    sort_order: 0,
    is_default: false
  });

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/news/categories');
      const categoriesData = response.data?.data || response.data || [];
      setCategories(categoriesData);
      console.log('✅ News categories loaded:', categoriesData.length);
    } catch (error) {
      console.error('❌ Failed to fetch news categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      color: '#6b7280',
      sort_order: categories.length,
      is_default: false
    });
    setEditingCategory(null);
    setShowCreateForm(false);
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isAdmin() ? '/admin/news/categories' : '/moderator/news/categories';
      await api.post(endpoint, formData);
      fetchCategories();
      resetForm();
      alert('Category created successfully!');
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Failed to create category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleUpdateCategory = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isAdmin() ? 
        `/admin/news/categories/${editingCategory.id}` : 
        `/moderator/news/categories/${editingCategory.id}`;
      await api.put(endpoint, formData);
      fetchCategories();
      resetForm();
      alert('Category updated successfully!');
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Failed to update category: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!isAdmin()) {
      alert('Only administrators can delete categories.');
      return;
    }

    const category = categories.find(c => c.id === categoryId);
    if (category?.is_default) {
      alert('Cannot delete default categories.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/news/categories/${categoryId}`);
        fetchCategories();
        alert('Category deleted successfully!');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      color: category.color || '#6b7280',
      sort_order: category.sort_order || 0,
      is_default: category.is_default || false
    });
    setShowCreateForm(true);
  };

  const handleReorderCategories = async (newOrder) => {
    try {
      const endpoint = isAdmin() ? '/admin/news/categories/reorder' : '/moderator/news/categories/reorder';
      await api.post(endpoint, { order: newOrder });
      fetchCategories();
    } catch (error) {
      console.error('Error reordering categories:', error);
      alert('Failed to reorder categories: ' + (error.response?.data?.message || error.message));
    }
  };

  const moveCategory = (index, direction) => {
    const newCategories = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newCategories.length) {
      [newCategories[index], newCategories[targetIndex]] = [newCategories[targetIndex], newCategories[index]];
      
      // Create reorder mapping
      const reorderMapping = newCategories.map((cat, idx) => ({
        id: cat.id,
        sort_order: idx
      }));
      
      handleReorderCategories(reorderMapping);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">News Categories Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage news categories, their appearance, and organization
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateTo && navigateTo('news')}
            className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            Back to News
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowCreateForm(true);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Create Category
          </button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingCategory ? 'Edit Category' : 'Create New Category'}
          </h2>
          <form onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="e.g., Tournaments"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="e.g., tournaments"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Color
                </label>
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Brief description of this category..."
              />
            </div>

            {/* Checkboxes */}
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Default Category</span>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Existing Categories ({categories.length})
          </h2>
        </div>
        
        {categories.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.map((category, index) => (
              <div key={category.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    {/* Preview */}
                    <div className="flex items-center space-x-2">
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded-full text-white"
                        style={{ backgroundColor: category.color }}
                      >
                        {category.name}
                      </span>
                      {category.is_default && (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded">
                          DEFAULT
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                      <div className="text-sm text-gray-900 dark:text-white font-medium">
                        {category.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        Slug: {category.slug} • Order: {category.sort_order}
                        {category.description && ` • ${category.description}`}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {/* Reorder buttons */}
                    <button
                      onClick={() => moveCategory(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveCategory(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      ▼
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      Edit
                    </button>

                    {/* Delete button (admin only) */}
                    {isAdmin() && !category.is_default && (
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">📂</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Categories Found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create your first news category to get started.
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowCreateForm(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Create First Category
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsCategoriesPage;