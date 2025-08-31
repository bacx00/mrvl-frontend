import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getUserAvatarUrl, getHeroImageSync } from '../../utils/imageUtils';

function AdminUsers() {
  const { api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(20);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    sortBy: 'created'
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    status: 'active',
    hero_flair: '',
    team_flair_id: '',
    show_hero_flair: true,
    show_team_flair: false
  });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);

  // Bulk operations
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Heroes data
  const [heroes, setHeroes] = useState([]);
  const [heroesLoading, setHeroesLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchHeroes();
  }, []);

  const fetchHeroes = async () => {
    try {
      setHeroesLoading(true);
      const response = await api.get('/public/heroes');
      const heroesData = response?.data?.data || response?.data || response || [];
      setHeroes(Array.isArray(heroesData) ? heroesData : []);
    } catch (err) {
      console.error('Error fetching heroes:', err);
      setHeroes([]);
    } finally {
      setHeroesLoading(false);
    }
  };

  const fetchUsers = useCallback(async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/admin/users?page=${page}&limit=${limit}`);
      const usersData = response?.data?.data || response?.data || response || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(user => user.role === filters.role);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(user => user.status === filters.status);
    }

    if (filters.sortBy === 'created') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else if (filters.sortBy === 'name') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (filters.sortBy === 'email') {
      filtered.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
    }

    return filtered;
  }, [users, filters]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * usersPerPage;
    return filteredUsers.slice(startIndex, startIndex + usersPerPage);
  }, [filteredUsers, currentPage, usersPerPage]);

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, { role: newRole });
      if (response.data?.success !== false) {
        await fetchUsers();
        alert(`User role updated to ${newRole}!`);
      } else {
        throw new Error(response.data?.message || 'Role update failed');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating user role';
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        setLoading(true);
        const response = await api.delete(`/admin/users/${userId}`);
        if (response.data?.success !== false) {
          await fetchUsers();
          alert('User deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        const errorMessage = error.response?.data?.message || 'Error deleting user. Please try again.';
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setLoading(true);
      const response = await api.put(`/admin/users/${userId}`, { status: newStatus });
      if (response.data?.success !== false) {
        await fetchUsers();
        alert(`User status updated to ${newStatus}!`);
      } else {
        throw new Error(response.data?.message || 'Status update failed');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      const errorMessage = error.response?.data?.message || 'Error updating user status. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const openCreateModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active',
      hero_flair: '',
      team_flair_id: '',
      show_hero_flair: true,
      show_team_flair: false
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '', // Don't prefill password
      role: user.role || 'user',
      status: user.status || 'active',
      hero_flair: user.hero_flair || '',
      team_flair_id: user.team_flair_id || '',
      show_hero_flair: user.show_hero_flair ?? true,
      show_team_flair: user.show_team_flair ?? false
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const closeAllModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'user',
      status: 'active',
      hero_flair: '',
      team_flair_id: '',
      show_hero_flair: true,
      show_team_flair: false
    });
    setFormErrors({});
  };

  // Form validation
  const validateForm = (data, isEdit = false) => {
    const errors = {};
    
    if (!data.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!data.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(data.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!isEdit && !data.password.trim()) {
      errors.password = 'Password is required';
    } else if (data.password.trim() && data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (!['admin', 'moderator', 'user'].includes(data.role)) {
      errors.role = 'Invalid role selected';
    }
    
    if (!['active', 'inactive', 'banned', 'suspended'].includes(data.status)) {
      errors.status = 'Invalid status selected';
    }
    
    return errors;
  };

  // Create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    const errors = validateForm(formData, false);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormLoading(true);
    setFormErrors({});
    
    try {
      const response = await api.post('/admin/users', formData);
      if (response.data?.success !== false) {
        await fetchUsers();
        closeAllModals();
        alert('User created successfully!');
      } else {
        throw new Error(response.data?.message || 'User creation failed');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error.response?.data?.message || 'Error creating user. Please try again.';
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        alert(errorMessage);
      }
    } finally {
      setFormLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    const errors = validateForm(formData, true);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setFormLoading(true);
    setFormErrors({});
    
    try {
      // Only include password if it's provided
      const updateData = { ...formData };
      if (!updateData.password.trim()) {
        delete updateData.password;
      }
      
      const response = await api.put(`/admin/users/${selectedUser.id}`, updateData);
      if (response.data?.success !== false) {
        await fetchUsers();
        closeAllModals();
        alert('User updated successfully!');
      } else {
        throw new Error(response.data?.message || 'User update failed');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.message || 'Error updating user. Please try again.';
      if (error.response?.data?.errors) {
        setFormErrors(error.response.data.errors);
      } else {
        alert(errorMessage);
      }
    } finally {
      setFormLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'moderator':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'user':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'banned':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'suspended':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Bulk operations handlers
  const handleSelectUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedUsers.size === 0) return;
    
    const confirmMessage = `Are you sure you want to change status to "${newStatus}" for ${selectedUsers.size} users?`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/api/admin/users/bulk-update', {
          user_ids: Array.from(selectedUsers),
          status: newStatus
        });
        
        if (response.data?.success !== false) {
          await fetchUsers();
          setSelectedUsers(new Set());
          setShowBulkActions(false);
          alert(`${selectedUsers.size} users updated successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk update failed');
        }
      } catch (error) {
        console.error('Error in bulk status update:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk update failed';
        alert(errorMessage);
      }
    }
  };

  const handleBulkRoleChange = async (newRole) => {
    if (selectedUsers.size === 0) return;
    
    const confirmMessage = `Are you sure you want to change role to "${newRole}" for ${selectedUsers.size} users?`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/api/admin/users/bulk-update', {
          user_ids: Array.from(selectedUsers),
          role: newRole
        });
        
        if (response.data?.success !== false) {
          await fetchUsers();
          setSelectedUsers(new Set());
          setShowBulkActions(false);
          alert(`${selectedUsers.size} users updated successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk update failed');
        }
      } catch (error) {
        console.error('Error in bulk role update:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk update failed';
        alert(errorMessage);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedUsers.size} users? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/admin/users/bulk-delete', {
          user_ids: Array.from(selectedUsers)
        });
        
        if (response.data?.success !== false) {
          await fetchUsers();
          setSelectedUsers(new Set());
          setShowBulkActions(false);
          alert(`${selectedUsers.size} users deleted successfully!`);
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Users</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button onClick={fetchUsers} className="btn btn-outline-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage user accounts and permissions</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <span>+</span>
          <span>Create User</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="moderator">Moderator</option>
              <option value="user">User</option>
            </select>
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
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
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
              <option value="created">Created Date</option>
              <option value="name">Name</option>
              <option value="email">Email</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', role: 'all', status: 'all', sortBy: 'created' })}
              className="btn btn-secondary w-full"
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
                {selectedUsers.size} users selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleBulkStatusChange('active')}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Activate
                </button>
                <button
                  onClick={() => handleBulkStatusChange('inactive')}
                  className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                >
                  Deactivate
                </button>
                <button
                  onClick={() => handleBulkStatusChange('banned')}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Ban
                </button>
                <button
                  onClick={() => handleBulkStatusChange('suspended')}
                  className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm"
                >
                  Suspend
                </button>
                <button
                  onClick={() => handleBulkRoleChange('moderator')}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm"
                >
                  Make Moderator
                </button>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedUsers(new Set());
                setShowBulkActions(false);
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                    onChange={handleSelectAllUsers}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <UserAvatar user={user} navigateToProfile={() => {
                          console.log('🔍 AdminUsers: Navigating to user profile:', user.id);
                          // Admin functionality - navigate to user profile
                          if (window.confirm(`Navigate to user profile for ${user.name}?`)) {
                            // This would navigate to user profile page - implement as needed
                            window.open(`/profile/${user.id}`, '_blank');
                          }
                        }} />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.name}
                          {user.hero_flair && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                              {user.hero_flair}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role || 'user'}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getRoleColor(user.role)}`}
                    >
                      <option value="user">User</option>
                      <option value="moderator">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.status || 'active'}
                      onChange={(e) => handleStatusChange(user.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(user.status)}`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="banned">Banned</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => openViewModal(user)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => openEditModal(user)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing <span className="font-medium">{(currentPage - 1) * usersPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * usersPerPage, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredUsers.length}</span> results
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {users.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">🔴</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">🟡</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {users.filter(u => u.role === 'moderator').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Moderators</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active</div>
        </div>
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New User</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                  <option value="suspended">Suspended</option>
                </select>
                {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hero Avatar
                </label>
                <select
                  value={formData.hero_flair}
                  onChange={(e) => setFormData({...formData, hero_flair: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">No Hero Selected</option>
                  {heroes.map(hero => (
                    <option key={hero.name} value={hero.name}>
                      {hero.name}
                    </option>
                  ))}
                </select>
                {formErrors.hero_flair && <p className="text-red-500 text-xs mt-1">{formErrors.hero_flair}</p>}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="create_show_hero_flair"
                  checked={formData.show_hero_flair}
                  onChange={(e) => setFormData({...formData, show_hero_flair: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="create_show_hero_flair" className="text-sm text-gray-700 dark:text-gray-300">
                  Show hero avatar publicly
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {formLoading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit User</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  required
                />
                {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                {formErrors.password && <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                {formErrors.role && <p className="text-red-500 text-xs mt-1">{formErrors.role}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                  <option value="suspended">Suspended</option>
                </select>
                {formErrors.status && <p className="text-red-500 text-xs mt-1">{formErrors.status}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Hero Avatar
                </label>
                <select
                  value={formData.hero_flair}
                  onChange={(e) => setFormData({...formData, hero_flair: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">No Hero Selected</option>
                  {heroes.map(hero => (
                    <option key={hero.name} value={hero.name}>
                      {hero.name}
                    </option>
                  ))}
                </select>
                {formErrors.hero_flair && <p className="text-red-500 text-xs mt-1">{formErrors.hero_flair}</p>}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="edit_show_hero_flair"
                  checked={formData.show_hero_flair}
                  onChange={(e) => setFormData({...formData, show_hero_flair: e.target.checked})}
                  className="mr-2"
                />
                <label htmlFor="edit_show_hero_flair" className="text-sm text-gray-700 dark:text-gray-300">
                  Show hero avatar publicly
                </label>
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                >
                  {formLoading ? 'Updating...' : 'Update User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">User Details</h3>
              <button
                onClick={closeAllModals}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="h-16 w-16 mx-auto mb-3">
                  <UserAvatar user={selectedUser} navigateToProfile={() => {}} />
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedUser.name}</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                {selectedUser.hero_flair && (
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Hero: {selectedUser.hero_flair}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(selectedUser.role)}`}>
                    {selectedUser.role || 'user'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status || 'active'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Joined</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Login</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
              {selectedUser.stats && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Activity Stats</label>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Forum Posts: {selectedUser.stats.total_forum_posts || 0}</div>
                    <div>Comments: {selectedUser.stats.total_comments || 0}</div>
                    <div>Forum Threads: {selectedUser.stats.total_forum_threads || 0}</div>
                  </div>
                </div>
              )}
              <div className="flex justify-end pt-4">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// UserAvatar component that shows hero avatar or fallback
function UserAvatar({ user, navigateToProfile }) {
  const [imageError, setImageError] = React.useState(false);
  
  if (!user) {
    return (
      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-lg">
        ?
      </div>
    );
  }

  // Get avatar URL - prioritize hero_image field
  let avatarUrl = null;
  
  // First check for hero_image field (this is the main hero avatar)
  if (user.hero_image) {
    avatarUrl = user.hero_image;
  }
  // Then check if user has selected a hero (hero_flair field from backend)
  else if (user.hero_flair && user.show_hero_flair !== false) {
    const heroImageFilename = getHeroImageSync(user.hero_flair);
    if (heroImageFilename) {
      // getHeroImageSync returns filename, need to construct full URL
      avatarUrl = `/images/heroes/${heroImageFilename}`;
    }
  }
  // Finally check for regular avatar
  else if (user.avatar) {
    avatarUrl = getUserAvatarUrl(user);
  }
  
  // If still no avatar, there was an error, or it's a placeholder, show question mark
  if (imageError || !avatarUrl || avatarUrl === '?' || avatarUrl.includes('placeholder') || avatarUrl.includes('data:image')) {
    return (
      <div 
        className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-lg cursor-pointer hover:border-blue-500 hover:border-2 transition-all"
        onClick={navigateToProfile}
        title={`Click to view ${user.name}'s profile`}
      >
        ?
      </div>
    );
  }
  
  return (
    <div 
      className="h-10 w-10 rounded-full overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors bg-gray-200 dark:bg-gray-700"
      onClick={navigateToProfile}
      title={`Click to view ${user.name}'s profile`}
    >
      <img
        src={avatarUrl}
        alt={user.name || 'User'}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = '<span class="text-gray-600 dark:text-gray-400 font-bold text-lg">?</span>';
          e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
        }}
      />
    </div>
  );
}

export default AdminUsers;