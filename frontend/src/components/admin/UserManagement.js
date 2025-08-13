import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import ReportButton from '../shared/ReportButton';

const UserManagement = () => {
  const { api, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [bans, setBans] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    lastActive: 'all'
  });
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [showUserModal, setShowUserModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showBanModal, setShowBanModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Warning form state
  const [warningForm, setWarningForm] = useState({
    reason: '',
    severity: 'medium',
    duration_days: 7,
    send_notification: true
  });

  // Ban form state
  const [banForm, setBanForm] = useState({
    reason: '',
    duration: 'temporary',
    duration_days: 7,
    ip_ban: false,
    notify_user: true
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'users':
          await fetchUsers();
          break;
        case 'warnings':
          await fetchWarnings();
          break;
        case 'bans':
          await fetchBans();
          break;
        case 'reports':
          await fetchReports();
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users', {
        params: {
          search: filters.search,
          role: filters.role !== 'all' ? filters.role : undefined,
          status: filters.status !== 'all' ? filters.status : undefined
        }
      });
      setUsers(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchWarnings = async () => {
    try {
      const response = await api.get('/api/admin/user-warnings');
      setWarnings(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching warnings:', error);
    }
  };

  const fetchBans = async () => {
    try {
      const response = await api.get('/api/admin/user-bans');
      setBans(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching bans:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/admin/reports', {
        params: { type: 'user' }
      });
      setReports(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const handleWarnUser = async () => {
    if (!selectedUser || !warningForm.reason.trim()) return;

    try {
      const response = await api.post(`/api/admin/users/${selectedUser.id}/warn`, warningForm);
      if (response.data.success) {
        setShowWarningModal(false);
        setSelectedUser(null);
        setWarningForm({
          reason: '',
          severity: 'medium',
          duration_days: 7,
          send_notification: true
        });
        fetchData();
        alert('User warned successfully!');
      }
    } catch (error) {
      console.error('Error warning user:', error);
      alert(error.response?.data?.message || 'Failed to warn user');
    }
  };

  const handleBanUser = async () => {
    if (!selectedUser || !banForm.reason.trim()) return;

    try {
      const response = await api.post(`/api/admin/users/${selectedUser.id}/ban`, banForm);
      if (response.data.success) {
        setShowBanModal(false);
        setSelectedUser(null);
        setBanForm({
          reason: '',
          duration: 'temporary',
          duration_days: 7,
          ip_ban: false,
          notify_user: true
        });
        fetchData();
        alert('User banned successfully!');
      }
    } catch (error) {
      console.error('Error banning user:', error);
      alert(error.response?.data?.message || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to unban this user?')) return;

    try {
      const response = await api.post(`/api/admin/users/${userId}/unban`);
      if (response.data.success) {
        fetchData();
        alert('User unbanned successfully!');
      }
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert(error.response?.data?.message || 'Failed to unban user');
    }
  };

  const handleDeleteWarning = async (warningId) => {
    if (!window.confirm('Are you sure you want to delete this warning?')) return;

    try {
      const response = await api.delete(`/api/admin/warnings/${warningId}`);
      if (response.data.success) {
        fetchData();
        alert('Warning deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting warning:', error);
      alert(error.response?.data?.message || 'Failed to delete warning');
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedUsers.size === 0) {
      alert('Please select users first');
      return;
    }

    if (!window.confirm(`Are you sure you want to ${action} ${selectedUsers.size} selected users?`)) {
      return;
    }

    try {
      const response = await api.post('/api/admin/users/bulk-action', {
        action,
        user_ids: Array.from(selectedUsers)
      });

      if (response.data.success) {
        setSelectedUsers(new Set());
        fetchData();
        alert(`Bulk ${action} completed successfully!`);
      }
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
      alert(error.response?.data?.message || `Failed to perform bulk ${action}`);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'high': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400';
      case 'banned': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      case 'suspended': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'pending': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredData = () => {
    let data;
    switch (activeTab) {
      case 'users': data = users; break;
      case 'warnings': data = warnings; break;
      case 'bans': data = bans; break;
      case 'reports': data = reports; break;
      default: data = [];
    }

    return data.filter(item => {
      if (filters.search && activeTab === 'users') {
        const searchTerm = filters.search.toLowerCase();
        return (
          item.name?.toLowerCase().includes(searchTerm) ||
          item.email?.toLowerCase().includes(searchTerm) ||
          item.username?.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });
  };

  const renderUsers = () => (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
              {selectedUsers.size} users selected
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleBulkAction('warn')}
                className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
              >
                Warn Selected
              </button>
              <button
                onClick={() => handleBulkAction('ban')}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Ban Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users List */}
      {filteredData().map(user => (
        <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <input
                type="checkbox"
                checked={selectedUsers.has(user.id)}
                onChange={() => {
                  const newSelected = new Set(selectedUsers);
                  if (newSelected.has(user.id)) {
                    newSelected.delete(user.id);
                  } else {
                    newSelected.add(user.id);
                  }
                  setSelectedUsers(newSelected);
                }}
                className="mt-1 rounded border-gray-300 dark:border-gray-600"
              />
              
              <img
                src={user.avatar || '/default-avatar.png'}
                alt={user.name}
                className="w-12 h-12 rounded-full"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {user.name}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status || 'active')}`}>
                    {user.status || 'active'}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-xs">
                    {user.role || 'user'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <div>Email: {user.email}</div>
                  <div>Joined: {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}</div>
                  <div>Last active: {user.last_activity ? new Date(user.last_activity).toLocaleDateString() : 'Never'}</div>
                  {user.banned_at && (
                    <div className="text-red-600 dark:text-red-400">
                      Banned: {new Date(user.banned_at).toLocaleDateString()}
                      {user.ban_reason && ` - ${user.ban_reason}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setSelectedUser(user);
                  setShowUserModal(true);
                }}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                View Details
              </button>
              
              {user.status !== 'banned' && (
                <>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowWarningModal(true);
                    }}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm"
                  >
                    Warn
                  </button>
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowBanModal(true);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    Ban
                  </button>
                </>
              )}
              
              {user.status === 'banned' && (
                <button
                  onClick={() => handleUnbanUser(user.id)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Unban
                </button>
              )}
              
              <ReportButton
                targetType="user"
                targetId={user.id}
                targetUserId={user.id}
                size="sm"
                variant="outline"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderWarnings = () => (
    <div className="space-y-4">
      {filteredData().map(warning => (
        <div key={warning.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(warning.severity)}`}>
                  {warning.severity.toUpperCase()}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Warning for {warning.user?.name || warning.user_name || 'Unknown User'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {warning.created_at ? new Date(warning.created_at).toLocaleDateString() : 'Unknown date'}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="text-gray-900 dark:text-white font-medium mb-1">Reason:</div>
                <div className="text-gray-600 dark:text-gray-400">{warning.reason}</div>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Issued by: {warning.moderator?.name || warning.moderator_name || 'System'} | 
                Duration: {warning.duration_days} days |
                Status: {warning.acknowledged ? 'Acknowledged' : 'Pending'}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => handleDeleteWarning(warning.id)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
              >
                Remove Warning
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderBans = () => (
    <div className="space-y-4">
      {filteredData().map(ban => (
        <div key={ban.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-full text-xs font-medium">
                  BANNED
                </span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {ban.user?.name || ban.user_name || 'Unknown User'}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="text-gray-900 dark:text-white">
                  <strong>Reason:</strong> {ban.reason || ban.ban_reason}
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <strong>Banned:</strong> {ban.banned_at ? new Date(ban.banned_at).toLocaleDateString() : 'Unknown'}
                </div>
                {ban.ban_expires_at && (
                  <div className="text-gray-600 dark:text-gray-400">
                    <strong>Expires:</strong> {new Date(ban.ban_expires_at).toLocaleDateString()}
                  </div>
                )}
                <div className="text-gray-600 dark:text-gray-400">
                  <strong>Banned by:</strong> {ban.banned_by?.name || ban.moderator?.name || 'System'}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleUnbanUser(ban.user_id || ban.id)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
            >
              Unban User
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      {filteredData().map(report => (
        <div key={report.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  report.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                  report.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {report.status.toUpperCase()}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Report against {report.reportable?.name || 'Unknown User'}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {report.created_at ? new Date(report.created_at).toLocaleDateString() : 'Unknown date'}
                </span>
              </div>
              
              <div className="mb-3">
                <div className="text-gray-900 dark:text-white font-medium mb-1">Reason:</div>
                <div className="text-gray-600 dark:text-gray-400">{report.reason}</div>
                {report.description && (
                  <div className="text-gray-600 dark:text-gray-400 mt-1">{report.description}</div>
                )}
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Reported by: {report.reporter?.name || 'Anonymous'} | 
                Type: {report.reportable_type}
              </div>
            </div>
            
            {report.status === 'pending' && (
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm">
                  Resolve
                </button>
                <button className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm">
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const tabs = [
    { id: 'users', label: 'Users', icon: '👥', count: users.length },
    { id: 'warnings', label: 'Warnings', icon: '⚠️', count: warnings.length },
    { id: 'bans', label: 'Bans', icon: '🚫', count: bans.length },
    { id: 'reports', label: 'Reports', icon: '🚩', count: reports.filter(r => r.status === 'pending').length }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users, warnings, bans, and reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-red-500 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-1 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Search</label>
              <input
                type="text"
                placeholder="Name, email, username..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Role</label>
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-900 dark:text-gray-100">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="banned">Banned</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchData}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        ) : (
          <>
            {activeTab === 'users' && renderUsers()}
            {activeTab === 'warnings' && renderWarnings()}
            {activeTab === 'bans' && renderBans()}
            {activeTab === 'reports' && renderReports()}
          </>
        )}
      </div>

      {/* Warning Modal */}
      {showWarningModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Warn User: {selectedUser.name}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason *
                </label>
                <textarea
                  value={warningForm.reason}
                  onChange={(e) => setWarningForm({ ...warningForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Explain why you're warning this user..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Severity
                  </label>
                  <select
                    value={warningForm.severity}
                    onChange={(e) => setWarningForm({ ...warningForm, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={warningForm.duration_days}
                    onChange={(e) => setWarningForm({ ...warningForm, duration_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={warningForm.send_notification}
                    onChange={(e) => setWarningForm({ ...warningForm, send_notification: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Send notification to user
                  </span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowWarningModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleWarnUser}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Issue Warning
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ban User: {selectedUser.name}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reason *
                </label>
                <textarea
                  value={banForm.reason}
                  onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  placeholder="Explain why you're banning this user..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Duration
                </label>
                <select
                  value={banForm.duration}
                  onChange={(e) => setBanForm({ ...banForm, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="temporary">Temporary</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              
              {banForm.duration === 'temporary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={banForm.duration_days}
                    onChange={(e) => setBanForm({ ...banForm, duration_days: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                  />
                </div>
              )}
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={banForm.ip_ban}
                    onChange={(e) => setBanForm({ ...banForm, ip_ban: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    IP Ban (prevent creating new accounts)
                  </span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={banForm.notify_user}
                    onChange={(e) => setBanForm({ ...banForm, notify_user: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    Notify user of ban
                  </span>
                </label>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowBanModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleBanUser}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Ban User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;