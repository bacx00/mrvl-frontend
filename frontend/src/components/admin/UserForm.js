import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getImageUrl } from '../../utils/imageUtils';

function UserForm({ navigateTo, userId = null }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['user'], // Default to user role
    avatar: null,
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { api } = useAuth();

  const isEdit = !!userId;

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${userId}`);
      const user = response.data || response;
      
      setFormData({
        ...user,
        password: '', // Don't populate password field for security
        roles: user.roles || ['user']
      });
      
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('Error loading user data. Please try again.');
      navigateTo('admin-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate roles
      if (formData.roles.length === 0) {
        alert('Please select at least one role');
        return;
      }

      // Don't send empty password on edit
      const dataToSend = {...formData};
      if (isEdit && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      // FIXED: Backend expects 'role' string, not 'roles' array
      // Use the exact backend-supported values: "admin", "moderator", "user"
      if (dataToSend.roles && dataToSend.roles.length > 0) {
        dataToSend.role = dataToSend.roles[0]; // Take first role as primary
        delete dataToSend.roles; // Remove roles array to avoid confusion
      }

      let response;
      if (isEdit) {
        // FIXED: Use POST with method spoofing for Laravel backend updates
        dataToSend._method = 'PUT';
        response = await api.post(`/admin/users/${userId}`, dataToSend);
      } else {
        // Create new user
        response = await api.post('/admin/users', dataToSend);
      }


      alert(`User ${isEdit ? 'updated' : 'created'} successfully!`);
      navigateTo('admin-dashboard');
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Error ${isEdit ? 'updating' : 'creating'} user: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => {
      const newRoles = [...prev.roles];
      
      if (newRoles.includes(role)) {
        // Remove role if already selected
        return { ...prev, roles: newRoles.filter(r => r !== role) };
      } else {
        // Add role if not selected
        return { ...prev, roles: [...newRoles, role] };
      }
    });
  };


  
  // FIXED: Use exact backend-supported role values (lowercase)
  const roleOptions = [
    { id: 'admin', label: 'Administrator', description: 'Full access to all features' },
    { id: 'moderator', label: 'Moderator', description: 'Can moderate content and users' },
    { id: 'user', label: 'Regular User', description: 'Standard user account' }
  ];
  
  const statusOptions = ['active', 'inactive', 'banned'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading user data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit User' : 'Create New User'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isEdit ? 'Update user information and permissions' : 'Add a new user to the platform'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Password {isEdit && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="form-input"
                  required={!isEdit}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="form-input"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Roles and Avatar */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Roles & Appearance</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  User Roles *
                </label>
                <div className="space-y-3">
                  {roleOptions.map(role => (
                    <div key={role.id} className="flex items-start">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={formData.roles.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                        className="mt-1 mr-3"
                      />
                      <label htmlFor={`role-${role.id}`} className="cursor-pointer">
                        <div className="font-medium text-gray-900 dark:text-white">{role.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{role.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
                {formData.roles.length === 0 && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                    Please select at least one role
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Avatar
                </label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Users select their hero avatar from their profile settings page. Admin cannot set user avatars.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigateTo('admin-dashboard')}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || formData.roles.length === 0}
          >
            {submitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;