import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import UserDisplay from '../shared/UserDisplay';

function AdminUsers({ navigateTo }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all'
  });
  const { api } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      console.log('📊 Raw API response:', response);
      
      // Handle Laravel backend response format
      let usersData = [];
      if (response.data && response.data.data) {
        // Laravel format: { success: true, data: [...], total: X }
        usersData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array response
        usersData = response.data;
      } else if (Array.isArray(response)) {
        // Raw array response
        usersData = response;
      }

      // Apply filters
      if (filters.search) {
        usersData = usersData.filter(user => 
          user.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          user.email?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.role !== 'all') {
        usersData = usersData.filter(user => {
          // Handle both array roles and single role string
          const userRoles = Array.isArray(user.roles) ? user.roles : 
                           (user.role ? [user.role] : []);
          return userRoles.includes(filters.role);
        });
      }

      if (filters.status !== 'all') {
        usersData = usersData.filter(user => user.status === filters.status);
      }

      console.log('📊 Loaded users:', usersData);
      console.log('📊 First user sample:', usersData[0]);
      setUsers(usersData);
    } catch (error) {
      console.error('AdminUsers: Backend users API failed:', error);
      // CRITICAL FIX: NO MOCK DATA - Show empty state instead
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      try {
        console.log(`🗑️ Attempting to delete user ${userId} (${userName})`);
        // Use proper DELETE method for Laravel backend
        const response = await api.delete(`/admin/users/${userId}`);
        console.log('✅ Delete response:', response);
        await fetchUsers(); // Refresh the list
        alert('User deleted successfully!');
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        let errorMessage = 'Error deleting user. Please try again.';
        if (error.message) {
          errorMessage = error.message;
        }
        if (error.data && error.data.message) {
          errorMessage = error.data.message;
        }
        alert(`Error: ${errorMessage}`);
      }
    }
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      // FIXED: Optimistic UI update for immediate feedback - handle both role formats
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                roles: [newRole] // Backend returns array of role strings
              }
            : user
        )
      );
      
      // Get current user data to preserve status
      const currentUser = users.find(u => u.id === userId);
      const response = await api.put(`/admin/users/${userId}`, { 
        role: newRole,
        status: currentUser.status || 'active'
      });
      
      if (response.success) {
        // Force refresh after successful update
        await fetchUsers();
        alert(`User role updated to ${newRole}!`);
      } else {
        throw new Error(response.message || 'Failed to update role');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      // Revert optimistic update on error
      await fetchUsers();
      let errorMessage = 'Error updating user role. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Error: ${errorMessage}`);
    }
  };

  const updateUserStatus = async (userId, newStatus) => {
    try {
      // Optimistic UI update
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, status: newStatus }
            : user
        )
      );

      // FIXED: Get current user data to preserve role
      const currentUser = users.find(u => u.id === userId);
      const currentRole = getUserRole(currentUser);
      const response = await api.put(`/admin/users/${userId}`, { 
        role: currentRole, 
        status: newStatus 
      });
      
      if (response.success) {
        await fetchUsers(); // Refresh the list
        alert(`User status updated to ${newStatus}!`);
      } else {
        throw new Error(response.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      // Revert optimistic update on error
      await fetchUsers();
      let errorMessage = 'Error updating user status. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      alert(`Error: ${errorMessage}`);
    }
  };

  const getRoleColor = (user) => {
    const roleList = Array.isArray(user.roles) ? user.roles : 
                    (user.role ? [user.role] : []);
    if (roleList.includes('admin')) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    if (roleList.includes('moderator')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const getRoleDisplay = (user) => {
    const roleList = Array.isArray(user.roles) ? user.roles : 
                    (user.role ? [user.role] : []);
    if (roleList.includes('admin')) return 'Admin';
    if (roleList.includes('moderator')) return 'Moderator';
    return 'User';
  };
  
  const getUserRole = (user) => {
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0];
    }
    return user.role || 'user';
  };
  
  const hasRole = (user, role) => {
    if (!user) return false;
    const roleList = Array.isArray(user.roles) ? user.roles : 
                    (user.role ? [user.role] : []);
    return roleList.includes(role);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'banned': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatLastLogin = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const roles = ['all', 'admin', 'moderator', 'user'];
  const statuses = ['all', 'active', 'inactive', 'banned'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Users</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage user accounts, roles, and permissions</p>
        </div>
        <button 
          onClick={() => navigateTo('admin-user-create')}
          className="btn btn-primary"
        >
          Create New User
        </button>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {users.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Users</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {users.filter(u => hasRole(u, 'admin')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Admins</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {users.filter(u => hasRole(u, 'moderator')).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Moderators</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Users</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Users
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="form-input"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="form-input"
            >
              {statuses.map(status => (
                <option key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', role: 'all', status: 'all' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
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
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <UserDisplay 
                        user={user} 
                        size="sm"
                        showAvatar={true}
                        showHeroFlair={true}
                        showTeamFlair={true}
                        clickable={true}
                        navigateTo={navigateTo}
                      />
                      <div className="text-sm text-gray-500 dark:text-gray-400 ml-8">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user)}`}>
                      {getRoleDisplay(user)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.status)}`}>
                      {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.last_login ? formatLastLogin(user.last_login) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <select
                        value={getUserRole(user)}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                      <select
                        value={user.status}
                        onChange={(e) => updateUserStatus(user.id, e.target.value)}
                        className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="banned">Banned</option>
                      </select>
                      <button
                        onClick={() => {
                          console.log('🔍 Delete button clicked for user:', user.id, user.name);
                          console.log('🔍 User roles:', user.roles);
                          handleDelete(user.id, user.name);
                        }}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 cursor-pointer"
                        title="Delete user"
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
      </div>

      {/* No Results */}
      {users.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Users Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.role !== 'all' || filters.status !== 'all'
              ? 'Try adjusting your filters to find more users.'
              : 'No users in the system yet.'}
          </p>
          <button
            onClick={() => navigateTo('admin-user-create')}
            className="btn btn-primary"
          >
            Create First User
          </button>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;