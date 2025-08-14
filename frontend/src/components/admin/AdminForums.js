import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import CreateThreadPage from '../pages/CreateThreadPage';

function AdminForums() {
  const { api } = useAuth();
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('threads');
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    sortBy: 'date'
  });
  
  // Pagination and view mode
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'table'
  
  // Bulk operations
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Thread management
  const [showThreadModal, setShowThreadModal] = useState(false);
  const [editingThread, setEditingThread] = useState(null);
  const [threadForm, setThreadForm] = useState({
    title: '',
    content: '',
    category_id: '',
    is_pinned: false,
    is_locked: false,
    status: 'active'
  });

  // User management
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userAction, setUserAction] = useState('');
  const [banForm, setBanForm] = useState({
    reason: '',
    duration: '24', // hours
    permanent: false,
    ban_type: 'suspend' // suspend, ban, timeout
  });

  // Category management
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    slug: '',
    color: '#3b82f6',
    icon: '💬',
    sort_order: 0,
    is_active: true
  });

  // Analytics and stats
  const [threadStats, setThreadStats] = useState({});
  const [moderationHistory, setModerationHistory] = useState([]);

  useEffect(() => {
    if (currentTab === 'threads') {
      fetchThreads();
    } else if (currentTab === 'posts') {
      fetchPosts();
    } else if (currentTab === 'categories') {
      fetchCategories();
    }
  }, [currentTab]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/forums-moderation/threads');
      const threadsData = response?.data?.data || response?.data || response || [];
      setThreads(Array.isArray(threadsData) ? threadsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching threads:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load threads';
      setError(errorMessage);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/forums-moderation/posts');
      const postsData = response?.data?.data || response?.data || response || [];
      setPosts(Array.isArray(postsData) ? postsData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching posts:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load posts';
      setError(errorMessage);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forums/categories');
      const categoriesData = response?.data?.data || response?.data || response || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load categories';
      setError(errorMessage);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteThread = async (threadId, title) => {
    if (window.confirm(`Delete thread "${title}"?`)) {
      try {
        const response = await api.delete(`/api/admin/forums-moderation/threads/${threadId}`);
        if (response.data?.success !== false) {
          await fetchThreads();
          alert('Thread deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting thread:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting thread';
        alert(errorMessage);
      }
    }
  };

  const handleDeletePost = async (postId, preview) => {
    if (window.confirm(`Delete post "${preview}"?`)) {
      try {
        const response = await api.delete(`/api/admin/forums-moderation/posts/${postId}`);
        if (response.data?.success !== false) {
          await fetchPosts();
          alert('Post deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting post';
        alert(errorMessage);
      }
    }
  };

  const handleToggleThreadStatus = async (threadId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'locked' : 'active';
    try {
      const response = await api.put(`/api/admin/forums-moderation/threads/${threadId}`, {
        status: newStatus
      });
      if (response.data?.success !== false) {
        await fetchThreads();
        alert(`Thread ${newStatus === 'active' ? 'unlocked' : 'locked'} successfully!`);
      } else {
        throw new Error(response.data?.message || 'Status update failed');
      }
    } catch (error) {
      console.error('Error updating thread status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating thread status';
      alert(errorMessage);
    }
  };

  const handleTogglePinThread = async (threadId, isPinned) => {
    try {
      const response = await api.put(`/api/admin/forums-moderation/threads/${threadId}`, {
        is_pinned: !isPinned
      });
      if (response.data?.success !== false) {
        await fetchThreads();
        alert(`Thread ${!isPinned ? 'pinned' : 'unpinned'} successfully!`);
      } else {
        throw new Error(response.data?.message || 'Pin status update failed');
      }
    } catch (error) {
      console.error('Error updating thread pin status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating thread pin status';
      alert(errorMessage);
    }
  };

  // Thread CRUD Operations
  const handleCreateThread = () => {
    setEditingThread(null);
    setThreadForm({
      title: '',
      content: '',
      category_id: '',
      is_pinned: false,
      is_locked: false,
      status: 'active'
    });
    setShowThreadModal(true);
  };

  const handleEditThread = (thread) => {
    setEditingThread(thread);
    setThreadForm({
      title: thread.title || '',
      content: thread.content || '',
      category_id: thread.category_id || '',
      is_pinned: thread.is_pinned || false,
      is_locked: thread.status === 'locked',
      status: thread.status || 'active'
    });
    setShowThreadModal(true);
  };

  const handleSaveThread = async () => {
    try {
      if (!threadForm.title.trim()) {
        alert('Thread title is required');
        return;
      }
      if (!threadForm.content.trim()) {
        alert('Thread content is required');
        return;
      }
      if (!threadForm.category_id) {
        alert('Please select a category');
        return;
      }

      const threadData = {
        ...threadForm,
        status: threadForm.is_locked ? 'locked' : 'active',
        category_id: parseInt(threadForm.category_id)
      };

      let response;
      if (editingThread) {
        response = await api.put(`/api/admin/forums-moderation/threads/${editingThread.id}`, threadData);
      } else {
        response = await api.post('/api/admin/forums-moderation/threads', threadData);
      }

      if (response?.data?.success !== false) {
        await fetchThreads();
        setShowThreadModal(false);
        setEditingThread(null);
        alert(`Thread ${editingThread ? 'updated' : 'created'} successfully!`);
      } else {
        throw new Error(response?.data?.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving thread:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save thread';
      alert(errorMessage);
    }
  };

  // User Management Functions
  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    setUserAction(action);
    if (action === 'ban' || action === 'suspend' || action === 'timeout') {
      setBanForm({
        reason: '',
        duration: action === 'timeout' ? '1' : '24',
        permanent: false,
        ban_type: action
      });
      setShowUserModal(true);
    } else {
      // Handle other actions immediately
      performUserAction(user.id, action);
    }
  };

  const performUserAction = async (userId, action, banData = null) => {
    try {
      let response;
      switch (action) {
        case 'ban':
        case 'suspend':
        case 'timeout':
          response = await api.post(`/api/admin/users/${userId}/moderation`, {
            action,
            ...banData
          });
          break;
        case 'unban':
          response = await api.delete(`/api/admin/users/${userId}/moderation`);
          break;
        case 'warn':
          response = await api.post(`/api/admin/users/${userId}/warn`, {
            reason: banData?.reason || 'General warning'
          });
          break;
        default:
          throw new Error('Unknown action');
      }

      if (response?.data?.success !== false) {
        alert(`User ${action} action completed successfully!`);
        setShowUserModal(false);
        setSelectedUser(null);
        // Refresh data if needed
        await fetchThreads();
      } else {
        throw new Error(response?.data?.message || `${action} failed`);
      }
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} user`;
      alert(errorMessage);
    }
  };

  const handleSubmitUserAction = async () => {
    if (!banForm.reason.trim()) {
      alert('Please provide a reason for this action');
      return;
    }

    const actionData = {
      reason: banForm.reason,
      duration_hours: banForm.permanent ? null : parseInt(banForm.duration),
      permanent: banForm.permanent
    };

    await performUserAction(selectedUser.id, userAction, actionData);
  };

  // Category CRUD Operations
  const handleCreateCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      description: '',
      slug: '',
      color: '#3b82f6',
      icon: '💬',
      sort_order: categories.length,
      is_active: true
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name || '',
      description: category.description || '',
      slug: category.slug || '',
      color: category.color || '#3b82f6',
      icon: category.icon || '💬',
      sort_order: category.sort_order || 0,
      is_active: category.is_active !== false
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    try {
      if (!categoryForm.name.trim()) {
        alert('Category name is required');
        return;
      }

      // Auto-generate slug if not provided
      const slug = categoryForm.slug.trim() || 
        categoryForm.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

      const categoryData = {
        ...categoryForm,
        slug,
        name: categoryForm.name.trim(),
        description: categoryForm.description.trim()
      };

      let response;
      if (editingCategory) {
        response = await api.put(`/forums/categories/${editingCategory.id}`, categoryData);
      } else {
        response = await api.post('/forums/categories', categoryData);
      }

      if (response?.data?.success !== false) {
        await fetchCategories();
        setShowCategoryModal(false);
        setEditingCategory(null);
        alert(`Category ${editingCategory ? 'updated' : 'created'} successfully!`);
      } else {
        throw new Error(response?.data?.message || 'Save failed');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save category';
      alert(errorMessage);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Delete category "${categoryName}"? This will move all threads in this category to "General".`)) {
      try {
        const response = await api.delete(`/forums/categories/${categoryId}`);
        if (response?.data?.success !== false) {
          await fetchCategories();
          alert('Category deleted successfully!');
        } else {
          throw new Error(response?.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to delete category';
        alert(errorMessage);
      }
    }
  };

  const handleToggleCategoryStatus = async (categoryId, currentStatus) => {
    const newStatus = !currentStatus;
    try {
      const response = await api.put(`/forums/categories/${categoryId}`, {
        is_active: newStatus
      });
      if (response?.data?.success !== false) {
        await fetchCategories();
        alert(`Category ${newStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        throw new Error(response?.data?.message || 'Status update failed');
      }
    } catch (error) {
      console.error('Error updating category status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update category status';
      alert(errorMessage);
    }
  };

  // Bulk operations
  const handleSelectItem = (itemId) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    const currentData = currentTab === 'threads' ? threads : posts;
    if (selectedItems.size === currentData.length) {
      setSelectedItems(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedItems(new Set(currentData.map(item => item.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) return;
    
    const itemType = currentTab === 'threads' ? 'threads' : 'posts';
    const confirmMessage = `Are you sure you want to delete ${selectedItems.size} ${itemType}? This action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        const endpoint = currentTab === 'threads' ? 
          '/api/admin/forums-moderation/threads/bulk-delete' : 
          '/api/admin/forums-moderation/posts/bulk-delete';
        
        const response = await api.post(endpoint, {
          ids: Array.from(selectedItems)
        });
        
        if (response.data?.success !== false) {
          if (currentTab === 'threads') {
            await fetchThreads();
          } else {
            await fetchPosts();
          }
          setSelectedItems(new Set());
          setShowBulkActions(false);
          alert(`${selectedItems.size} ${itemType} deleted successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk delete failed');
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk delete failed';
        alert(errorMessage);
      }
    }
  };

  const filteredData = () => {
    const data = currentTab === 'threads' ? threads : currentTab === 'posts' ? posts : categories;
    let filtered = [...data];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      if (currentTab === 'categories') {
        filtered = filtered.filter(item => 
          item.name?.toLowerCase().includes(searchTerm) ||
          item.description?.toLowerCase().includes(searchTerm) ||
          item.slug?.toLowerCase().includes(searchTerm)
        );
      } else {
        filtered = filtered.filter(item => 
          item.title?.toLowerCase().includes(searchTerm) ||
          item.content?.toLowerCase().includes(searchTerm) ||
          item.user?.name?.toLowerCase().includes(searchTerm)
        );
      }
    }

    if (filters.status !== 'all') {
      if (currentTab === 'categories') {
        filtered = filtered.filter(item => 
          filters.status === 'active' ? item.is_active : !item.is_active
        );
      } else {
        filtered = filtered.filter(item => item.status === filters.status);
      }
    }

    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (filters.sortBy === 'replies' && currentTab === 'threads') {
      filtered.sort((a, b) => (b.posts_count || 0) - (a.posts_count || 0));
    } else if (filters.sortBy === 'order' && currentTab === 'categories') {
      filtered.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }

    return filtered;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Data</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button 
            onClick={() => currentTab === 'threads' ? fetchThreads() : fetchPosts()} 
            className="btn btn-outline-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Forum Moderation</h1>
          <p className="text-gray-600 dark:text-gray-400">Moderate forum threads and posts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setCurrentTab('threads')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'threads'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Threads ({threads.length})
          </button>
          <button
            onClick={() => setCurrentTab('posts')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'posts'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Posts ({posts.length})
          </button>
          <button
            onClick={() => setCurrentTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              currentTab === 'categories'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Categories ({categories.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search {currentTab}
            </label>
            <input
              type="text"
              placeholder={`Search ${currentTab}...`}
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              {currentTab !== 'categories' && <option value="locked">Locked</option>}
              {currentTab !== 'categories' && <option value="hidden">Hidden</option>}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="date">Date</option>
              {currentTab === 'threads' && <option value="replies">Replies</option>}
              {currentTab === 'categories' && <option value="order">Sort Order</option>}
            </select>
          </div>
          <div className="flex items-end gap-2">
            {currentTab === 'threads' && (
              <button
                onClick={handleCreateThread}
                className="btn btn-primary flex-1"
              >
                Create Thread
              </button>
            )}
            {currentTab === 'categories' && (
              <button
                onClick={handleCreateCategory}
                className="btn btn-primary flex-1"
              >
                Create Category
              </button>
            )}
            <button
              onClick={() => setFilters({ search: '', status: 'all', sortBy: currentTab === 'categories' ? 'order' : 'date' })}
              className={`btn btn-secondary ${currentTab === 'categories' ? 'flex-1' : 'w-full'}`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedItems.size} {currentTab} selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete Selected
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedItems(new Set());
                setShowBulkActions(false);
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Select All */}
        {filteredData().length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
            <label className="flex items-center space-x-2 text-sm">
              <input
                type="checkbox"
                checked={selectedItems.size === filteredData().length && filteredData().length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Select all {filteredData().length} {currentTab}
              </span>
            </label>
          </div>
        )}

        {currentTab === 'categories' ? (
          filteredData().map((category) => (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(category.id)}
                    onChange={() => handleSelectItem(category.id)}
                    className="mt-1 rounded border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-2xl">{category.icon}</span>
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {category.name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        category.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      }`}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {category.description || 'No description provided'}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>Slug: /{category.slug}</span>
                      <span>Order: {category.sort_order}</span>
                      <span>Threads: {category.threads_count || 0}</span>
                      <span>{category.created_at ? new Date(category.created_at).toLocaleDateString() : 'Unknown date'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditCategory(category)}
                    className="btn btn-outline-primary text-sm"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleToggleCategoryStatus(category.id, category.is_active)}
                    className="btn btn-outline-secondary text-sm"
                  >
                    {category.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button 
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="btn btn-outline-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : currentTab === 'threads' ? (
          filteredData().map((thread) => (
            <div key={thread.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(thread.id)}
                    onChange={() => handleSelectItem(thread.id)}
                    className="mt-1 rounded border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {thread.is_pinned && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 text-xs rounded-full font-medium">
                          📌 Pinned
                        </span>
                      )}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {thread.title}
                      </h3>
                    </div>
                    
                    {thread.content && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {thread.content.substring(0, 150)}...
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={thread.user?.hero_image || thread.user?.avatar || '?'}
                            alt={thread.user?.name || thread.author}
                            className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '?';
                            }}
                          />
                          <span>By {thread.user?.name || thread.author || 'Unknown'}</span>
                        </div>
                        <span>💬 {thread.posts_count || 0} posts</span>
                        <span>👁️ {thread.views_count || 0} views</span>
                        <span>📅 {thread.created_at ? new Date(thread.created_at).toLocaleDateString() : 'Unknown date'}</span>
                        {thread.category && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs rounded">
                            {thread.category.name || thread.category}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          thread.status === 'active' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {thread.status || 'active'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditThread(thread)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title="Edit thread"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteThread(thread.id, thread.title)}
                    className="px-3 py-1 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete thread"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => handleToggleThreadStatus(thread.id, thread.status || 'active')}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title={thread.status === 'active' ? 'Lock thread' : 'Unlock thread'}
                  >
                    {thread.status === 'active' ? 'Lock' : 'Unlock'}
                  </button>
                  <button 
                    onClick={() => handleTogglePinThread(thread.id, thread.is_pinned)}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    title={thread.is_pinned ? 'Unpin thread' : 'Pin thread'}
                  >
                    {thread.is_pinned ? 'Unpin' : 'Pin'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          filteredData().map((post) => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(post.id)}
                    onChange={() => handleSelectItem(post.id)}
                    className="mt-1 rounded border-gray-300 dark:border-gray-600"
                  />
                  <div className="flex-1">
                    <div className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-3">
                      {post.content?.substring(0, 200) || 'No content'}...
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>By {post.user?.name || post.author || 'Unknown'}</span>
                      <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Unknown date'}</span>
                      <span>Thread: {post.thread?.title || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="btn btn-outline-primary text-sm">View</button>
                  <button 
                    onClick={() => handleDeletePost(post.id, post.content?.substring(0, 50) || 'Post')}
                    className="btn btn-outline-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredData().length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">
            {currentTab === 'categories' ? '📁' : '💬'}
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No {currentTab === 'threads' ? 'Forum Threads' : currentTab === 'posts' ? 'Forum Posts' : 'Forum Categories'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filters.search || filters.status !== 'all' 
              ? `No ${currentTab} match your current filters.`
              : `No ${currentTab} to moderate at this time.`}
          </p>
          {currentTab === 'categories' && !filters.search && (
            <button
              onClick={handleCreateCategory}
              className="btn btn-primary mt-4"
            >
              Create First Category
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {(currentTab === 'threads' || currentTab === 'posts') && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Show
            </span>
            <select
              value={pagination.limit}
              onChange={(e) => {
                const newLimit = parseInt(e.target.value);
                setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                if (currentTab === 'threads') {
                  fetchThreads(1);
                } else {
                  fetchPosts(1);
                }
              }}
              className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-700 dark:text-gray-300">
              per page
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                const newPage = Math.max(1, pagination.page - 1);
                setPagination(prev => ({ ...prev, page: newPage }));
                if (currentTab === 'threads') {
                  fetchThreads(newPage);
                } else {
                  fetchPosts(newPage);
                }
              }}
              disabled={pagination.page <= 1}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {[...Array(Math.min(5, pagination.totalPages))].map((_, idx) => {
                const page = Math.max(1, Math.min(
                  pagination.totalPages - 4,
                  Math.max(1, pagination.page - 2)
                )) + idx;
                
                if (page > pagination.totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => {
                      setPagination(prev => ({ ...prev, page }));
                      if (currentTab === 'threads') {
                        fetchThreads(page);
                      } else {
                        fetchPosts(page);
                      }
                    }}
                    className={`px-3 py-1 border rounded text-sm ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => {
                const newPage = Math.min(pagination.totalPages, pagination.page + 1);
                setPagination(prev => ({ ...prev, page: newPage }));
                if (currentTab === 'threads') {
                  fetchThreads(newPage);
                } else {
                  fetchPosts(newPage);
                }
              }}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  placeholder="e.g., General Discussion"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                  placeholder="Brief description of what this category is for..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm({...categoryForm, slug: e.target.value})}
                    placeholder="auto-generated"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({...categoryForm, sort_order: parseInt(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({...categoryForm, icon: e.target.value})}
                    placeholder="💬"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Color
                  </label>
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={categoryForm.is_active}
                    onChange={(e) => setCategoryForm({...categoryForm, is_active: e.target.checked})}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Active (users can create threads in this category)
                  </span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCategory}
                className="btn btn-primary flex-1"
              >
                {editingCategory ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Thread Modal - Using CreateThreadPage Component */}
      {showThreadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingThread ? 'Edit Thread' : 'Create New Thread'}
              </h3>
              <button
                onClick={() => {
                  setShowThreadModal(false);
                  setEditingThread(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <CreateThreadPage 
                navigateTo={(path) => {
                  setShowThreadModal(false);
                  setEditingThread(null);
                  fetchThreads();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* User Action Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {userAction.charAt(0).toUpperCase() + userAction.slice(1)} User: {selectedUser.name || selectedUser.username}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="text-yellow-600 dark:text-yellow-400 text-lg">⚠️</div>
                <div>
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    Moderation Action
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    You are about to {userAction} this user. This action will be logged.
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Reason for {userAction} *
                </label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm({...banForm, reason: e.target.value})}
                  placeholder={`Explain why you are ${userAction}ing this user...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
              </div>
              
              {(userAction === 'ban' || userAction === 'suspend' || userAction === 'timeout') && (
                <>
                  <div>
                    <label className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        checked={banForm.permanent}
                        onChange={(e) => setBanForm({...banForm, permanent: e.target.checked})}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        Permanent {userAction}
                      </span>
                    </label>
                  </div>
                  
                  {!banForm.permanent && (
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                        Duration ({userAction === 'timeout' ? 'minutes' : 'hours'})
                      </label>
                      <select
                        value={banForm.duration}
                        onChange={(e) => setBanForm({...banForm, duration: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      >
                        {userAction === 'timeout' ? (
                          <>
                            <option value="5">5 minutes</option>
                            <option value="10">10 minutes</option>
                            <option value="30">30 minutes</option>
                            <option value="60">1 hour</option>
                          </>
                        ) : (
                          <>
                            <option value="1">1 hour</option>
                            <option value="6">6 hours</option>
                            <option value="24">24 hours</option>
                            <option value="72">3 days</option>
                            <option value="168">1 week</option>
                            <option value="720">30 days</option>
                          </>
                        )}
                      </select>
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                  setUserAction('');
                }}
                className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitUserAction}
                className={`btn flex-1 ${
                  userAction === 'ban' || userAction === 'suspend' 
                    ? 'btn-danger' 
                    : userAction === 'timeout' 
                    ? 'btn-warning' 
                    : 'btn-primary'
                }`}
              >
                Confirm {userAction.charAt(0).toUpperCase() + userAction.slice(1)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminForums;