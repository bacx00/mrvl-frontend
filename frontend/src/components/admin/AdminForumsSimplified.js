import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminForumsSimplified({ navigateTo }) {
  const { api, user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchThreads();
    fetchCategories();
  }, []);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await api.get('/forums/threads?sort=latest&limit=50');
      const threadsData = response?.data?.data || response?.data || [];
      setThreads(Array.isArray(threadsData) ? threadsData : []);
    } catch (err) {
      console.error('Error fetching threads:', err);
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/forums/categories');
      const categoriesData = response?.data?.data || response?.data || [];
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  };

  const handleEdit = (thread) => {
    // Navigate to the admin thread edit page
    navigateTo('admin-forum-edit', { id: thread.id });
  };

  const handleCreate = () => {
    // Navigate to admin create thread page
    navigateTo('admin-forum-create');
  };


  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this thread?')) return;
    
    try {
      await api.delete(`/admin/forums/${id}`);
      await fetchThreads();
      alert('Thread deleted successfully');
    } catch (err) {
      alert('Failed to delete thread');
    }
  };

  const handleTogglePinned = async (thread) => {
    try {
      await api.put(`/admin/forums/${thread.id}`, { 
        pinned: !thread.pinned 
      });
      await fetchThreads();
    } catch (err) {
      alert('Failed to update pinned status');
    }
  };

  const handleToggleLocked = async (thread) => {
    try {
      await api.put(`/admin/forums/${thread.id}`, { 
        locked: !thread.locked 
      });
      await fetchThreads();
    } catch (err) {
      alert('Failed to update locked status');
    }
  };

  // Filter threads based on search and category
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = thread.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          thread.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                            thread.category?.id === selectedCategory ||
                            thread.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Show threads list view
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Forum Management</h2>
        
        {/* Simple Controls */}
        <div className="flex flex-wrap gap-4 mb-4">
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            + Create Thread
          </button>
          
          <input
            type="text"
            placeholder="Search threads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded flex-1 max-w-xs"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border rounded"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {filteredThreads.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No threads found
            </div>
          ) : (
            filteredThreads.map(thread => (
              <div key={thread.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {thread.title}
                      {thread.pinned && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          Pinned
                        </span>
                      )}
                      {thread.locked && (
                        <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Locked
                        </span>
                      )}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {thread.content?.substring(0, 150)}...
                    </p>
                    
                    {/* Thread Meta */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mt-2">
                      <span>Category: {thread.category?.name || 'Uncategorized'}</span>
                      <span>Replies: {thread.replies || 0}</span>
                      <span>Views: {thread.views || 0}</span>
                      <span>Author: {thread.user?.name || thread.author?.name || 'Unknown'}</span>
                      <span>
                        Created: {thread.created_at 
                          ? new Date(thread.created_at).toLocaleDateString() 
                          : 'Unknown'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Simple Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleEdit(thread)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  
                  <button
                    onClick={() => handleTogglePinned(thread)}
                    className={`px-3 py-1 text-white text-sm rounded ${
                      thread.pinned
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {thread.pinned ? 'Unpin' : 'Pin'}
                  </button>
                  
                  <button
                    onClick={() => handleToggleLocked(thread)}
                    className={`px-3 py-1 text-white text-sm rounded ${
                      thread.locked
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-orange-600 hover:bg-orange-700'
                    }`}
                  >
                    {thread.locked ? 'Unlock' : 'Lock'}
                  </button>
                  
                  <button
                    onClick={() => navigateTo('thread-detail', { id: thread.id })}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                  >
                    View
                  </button>
                  
                  <button
                    onClick={() => handleDelete(thread.id)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default AdminForumsSimplified;