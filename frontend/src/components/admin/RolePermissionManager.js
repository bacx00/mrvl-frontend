import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

const RolePermissionManager = () => {
  const { api } = useAuth();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('roles');
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    display_name: '',
    description: '',
    color: '#6B7280',
    priority: 1,
    is_active: true,
    is_default: false
  });

  const [permissionForm, setPermissionForm] = useState({
    name: '',
    display_name: '',
    description: '',
    category: 'general',
    risk_level: 'low'
  });

  const permissionCategories = {
    general: {
      name: 'General',
      icon: '🏠',
      permissions: [
        'view_dashboard',
        'edit_profile',
        'view_community'
      ]
    },
    content: {
      name: 'Content Management',
      icon: '📝',
      permissions: [
        'create_post',
        'edit_post',
        'delete_post',
        'moderate_content',
        'publish_news',
        'manage_media'
      ]
    },
    users: {
      name: 'User Management',
      icon: '👥',
      permissions: [
        'view_users',
        'edit_users',
        'ban_users',
        'warn_users',
        'manage_roles',
        'view_user_details'
      ]
    },
    moderation: {
      name: 'Moderation',
      icon: '⚖️',
      permissions: [
        'moderate_comments',
        'handle_reports',
        'delete_content',
        'lock_threads',
        'manage_bans',
        'view_moderation_logs'
      ]
    },
    admin: {
      name: 'Administration',
      icon: '🔧',
      permissions: [
        'manage_settings',
        'view_analytics',
        'manage_permissions',
        'system_maintenance',
        'manage_integrations',
        'access_admin_panel'
      ]
    },
    events: {
      name: 'Events & Tournaments',
      icon: '🏆',
      permissions: [
        'create_events',
        'manage_tournaments',
        'approve_matches',
        'manage_brackets',
        'edit_live_scores'
      ]
    }
  };

  const riskLevels = {
    low: { color: 'text-green-600 bg-green-100 dark:bg-green-900/20', label: 'Low Risk' },
    medium: { color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20', label: 'Medium Risk' },
    high: { color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20', label: 'High Risk' },
    critical: { color: 'text-red-600 bg-red-100 dark:bg-red-900/20', label: 'Critical Risk' }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchRoles(),
        fetchPermissions()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/api/admin/roles');
      if (response.data.success) {
        setRoles(response.data.data);
      } else {
        // Fallback to demo data
        setRoles(generateDemoRoles());
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles(generateDemoRoles());
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await api.get('/api/admin/permissions');
      if (response.data.success) {
        setPermissions(response.data.data);
      } else {
        // Fallback to demo data
        setPermissions(generateDemoPermissions());
      }
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions(generateDemoPermissions());
    }
  };

  const generateDemoRoles = () => [
    {
      id: 1,
      name: 'admin',
      display_name: 'Administrator',
      description: 'Full system access with all permissions',
      color: '#DC2626',
      priority: 100,
      user_count: 3,
      is_active: true,
      is_default: false,
      permissions: Object.values(permissionCategories).flatMap(cat => cat.permissions)
    },
    {
      id: 2,
      name: 'moderator',
      display_name: 'Moderator',
      description: 'Content and user moderation capabilities',
      color: '#F59E0B',
      priority: 50,
      user_count: 12,
      is_active: true,
      is_default: false,
      permissions: ['moderate_content', 'handle_reports', 'warn_users', 'delete_content']
    },
    {
      id: 3,
      name: 'user',
      display_name: 'User',
      description: 'Standard user with basic permissions',
      color: '#6B7280',
      priority: 1,
      user_count: 1247,
      is_active: true,
      is_default: true,
      permissions: ['view_dashboard', 'create_post', 'edit_profile']
    },
    {
      id: 4,
      name: 'vip',
      display_name: 'VIP User',
      description: 'Enhanced user with additional privileges',
      color: '#7C3AED',
      priority: 10,
      user_count: 89,
      is_active: true,
      is_default: false,
      permissions: ['view_dashboard', 'create_post', 'edit_profile', 'view_analytics']
    }
  ];

  const generateDemoPermissions = () => {
    const allPermissions = [];
    Object.entries(permissionCategories).forEach(([category, data]) => {
      data.permissions.forEach(permission => {
        allPermissions.push({
          id: allPermissions.length + 1,
          name: permission,
          display_name: permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `Permission to ${permission.replace(/_/g, ' ')}`,
          category: category,
          risk_level: ['delete_', 'ban_', 'manage_'].some(risk => permission.includes(risk)) ? 'high' : 'medium',
          role_count: Math.floor(Math.random() * 4) + 1
        });
      });
    });
    return allPermissions;
  };

  const handleCreateRole = async () => {
    try {
      const response = await api.post('/api/admin/roles', roleForm);
      if (response.data.success) {
        setShowRoleModal(false);
        setRoleForm({
          name: '',
          display_name: '',
          description: '',
          color: '#6B7280',
          priority: 1,
          is_active: true,
          is_default: false
        });
        fetchRoles();
        alert('Role created successfully!');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      alert(error.response?.data?.message || 'Failed to create role');
    }
  };

  const handleUpdateRolePermissions = async (roleId, permissions) => {
    try {
      const response = await api.put(`/api/admin/roles/${roleId}/permissions`, {
        permissions
      });
      if (response.data.success) {
        fetchRoles();
        alert('Role permissions updated successfully!');
      }
    } catch (error) {
      console.error('Error updating role permissions:', error);
      alert(error.response?.data?.message || 'Failed to update permissions');
    }
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? Users with this role will be assigned the default role.')) {
      return;
    }

    try {
      const response = await api.delete(`/api/admin/roles/${roleId}`);
      if (response.data.success) {
        fetchRoles();
        alert('Role deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const toggleRolePermission = (roleId, permission) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    const hasPermission = role.permissions.includes(permission);
    const newPermissions = hasPermission
      ? role.permissions.filter(p => p !== permission)
      : [...role.permissions, permission];

    // Update local state immediately for better UX
    setRoles(roles.map(r => 
      r.id === roleId 
        ? { ...r, permissions: newPermissions }
        : r
    ));

    // Then sync with backend
    handleUpdateRolePermissions(roleId, newPermissions);
  };

  const renderRolesTab = () => (
    <div className="space-y-6">
      {/* Create Role Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Roles ({roles.length})
        </h3>
        <button
          onClick={() => setShowRoleModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
        >
          Create New Role
        </button>
      </div>

      {/* Roles List */}
      <div className="grid gap-6">
        {roles.map(role => (
          <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: role.color }}
                >
                  {role.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {role.display_name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {role.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span>{role.user_count} users</span>
                    <span>Priority: {role.priority}</span>
                    {role.is_default && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full text-xs">
                        Default Role
                      </span>
                    )}
                    {!role.is_active && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs">
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedRole(role)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  Manage Permissions
                </button>
                {!role.is_default && (
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Permissions Preview */}
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Permissions ({role.permissions.length})
              </h5>
              <div className="flex flex-wrap gap-2">
                {role.permissions.slice(0, 8).map(permission => (
                  <span
                    key={permission}
                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {permission.replace(/_/g, ' ')}
                  </span>
                ))}
                {role.permissions.length > 8 && (
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-400 rounded text-xs">
                    +{role.permissions.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      {Object.entries(permissionCategories).map(([category, data]) => (
        <div key={category} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{data.icon}</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {data.name}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permissions
              .filter(p => p.category === category)
              .map(permission => (
                <div
                  key={permission.id}
                  className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                      {permission.display_name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs ${riskLevels[permission.risk_level].color}`}>
                      {riskLevels[permission.risk_level].label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {permission.description}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Used in {permission.role_count} role(s)
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      ))}
    </div>
  );

  const renderRolePermissionModal = () => {
    if (!selectedRole) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Permissions: {selectedRole.display_name}
              </h3>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <div className="space-y-6">
              {Object.entries(permissionCategories).map(([category, data]) => (
                <div key={category}>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-xl">{data.icon}</span>
                    <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                      {data.name}
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {data.permissions.map(permission => {
                      const permissionData = permissions.find(p => p.name === permission);
                      const hasPermission = selectedRole.permissions.includes(permission);
                      
                      return (
                        <label
                          key={permission}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                            hasPermission
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={hasPermission}
                            onChange={() => toggleRolePermission(selectedRole.id, permission)}
                            className="mr-3 rounded border-gray-300 dark:border-gray-600"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                            {permissionData && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {permissionData.description}
                              </div>
                            )}
                          </div>
                          {permissionData && (
                            <span className={`px-2 py-1 rounded-full text-xs ml-2 ${riskLevels[permissionData.risk_level].color}`}>
                              {riskLevels[permissionData.risk_level].label}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">Loading roles and permissions...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role & Permission Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Configure user roles and their permissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            👥 Roles ({roles.length})
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'permissions'
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            🔐 Permissions ({permissions.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'roles' && renderRolesTab()}
      {activeTab === 'permissions' && renderPermissionsTab()}

      {/* Role Permission Modal */}
      {renderRolePermissionModal()}

      {/* Create Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Role
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role Name *
                </label>
                <input
                  type="text"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g., content_editor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={roleForm.display_name}
                  onChange={(e) => setRoleForm({ ...roleForm, display_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="e.g., Content Editor"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Describe this role's purpose..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={roleForm.color}
                    onChange={(e) => setRoleForm({ ...roleForm, color: e.target.value })}
                    className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-lg"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={roleForm.priority}
                    onChange={(e) => setRoleForm({ ...roleForm, priority: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={roleForm.is_active}
                    onChange={(e) => setRoleForm({ ...roleForm, is_active: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Active role</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={roleForm.is_default}
                    onChange={(e) => setRoleForm({ ...roleForm, is_default: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Default role for new users</span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowRoleModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRole}
                disabled={!roleForm.name || !roleForm.display_name}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium"
              >
                Create Role
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolePermissionManager;