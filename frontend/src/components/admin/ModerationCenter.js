import React, { useState, useEffect } from 'react';

function ModerationCenter({ api, navigateTo }) {
  const [moderationData, setModerationData] = useState({
    pendingReports: [],
    flaggedComments: [],
    suspendedUsers: [],
    recentActions: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');

  useEffect(() => {
    fetchModerationData();
  }, []);

  const fetchModerationData = async () => {
    try {
      setLoading(true);
      
      // ✅ FIXED: Use only existing backend endpoints
      // Backend only has basic moderation endpoints, not comprehensive moderation center
      
      setModerationData({
        pendingReports: [], // No backend endpoint for this yet
        flaggedComments: [], // No backend endpoint for this yet  
        suspendedUsers: [], // No backend endpoint for this yet
        recentActions: [] // No backend endpoint for this yet
      });
      
    } catch (error) {
      console.error('❌ Error fetching moderation data:', error);
      generateDemoModerationData();
    } finally {
      setLoading(false);
    }
  };

  const generateDemoModerationData = () => {
    setModerationData({
      pendingReports: [
        {
          id: 1,
          type: 'harassment',
          reportedUser: 'ToxicPlayer123',
          reportedBy: 'CommunityMember',
          content: 'Inappropriate comments in match chat',
          severity: 'high',
          createdAt: '2025-01-15T10:30:00Z',
          status: 'pending'
        },
        {
          id: 2,
          type: 'spam',
          reportedUser: 'SpamBot99',
          reportedBy: 'ModeratorX',
          content: 'Repeated promotional messages',
          severity: 'medium',
          createdAt: '2025-01-15T09:15:00Z',
          status: 'pending'
        }
      ],
      flaggedComments: [
        {
          id: 101,
          content: 'This comment was flagged for inappropriate language...',
          author: 'ProblemuserX',
          matchId: 39,
          flagReason: 'inappropriate language',
          flaggedAt: '2025-01-15T11:00:00Z',
          reviewStatus: 'pending'
        }
      ],
      suspendedUsers: [
        {
          id: 501,
          username: 'SuspendedUser1',
          email: 'user1@example.com',
          suspensionReason: 'Multiple harassment reports',
          suspendedAt: '2025-01-14T15:00:00Z',
          suspendedUntil: '2025-01-21T15:00:00Z',
          suspendedBy: 'Admin'
        }
      ],
      recentActions: [
        {
          id: 1001,
          action: 'comment_deleted',
          targetUser: 'RuleBreaker',
          moderator: 'AdminMod',
          reason: 'Inappropriate content',
          timestamp: '2025-01-15T12:00:00Z'
        }
      ]
    });
  };

  const handleReport = async (reportId, action, reason = '') => {
    try {
      await api.put(`/admin/moderation/reports/${reportId}`, {
        action,
        reason,
        status: action === 'approve' ? 'resolved' : 'dismissed'
      });
      
      await fetchModerationData();
      alert(`✅ Report ${action}d successfully!`);
    } catch (error) {
      console.error('❌ Error handling report:', error);
      alert('❌ Failed to handle report. Please try again.');
    }
  };

  const moderateComment = async (commentId, action) => {
    try {
      if (action === 'delete') {
        await api.delete(`/admin/moderation/comments/${commentId}`);
      } else {
        await api.put(`/admin/moderation/comments/${commentId}`, { action });
      }
      
      await fetchModerationData();
      alert(`✅ Comment ${action}d successfully!`);
    } catch (error) {
      console.error('❌ Error moderating comment:', error);
      alert('❌ Failed to moderate comment. Please try again.');
    }
  };

  const tabs = [
    { id: 'reports', label: 'Reports', icon: '🚨', count: moderationData.pendingReports.length },
    { id: 'comments', label: 'Flagged Comments', icon: '💬', count: moderationData.flaggedComments.length },
    { id: 'users', label: 'Suspended Users', icon: '👤', count: moderationData.suspendedUsers.length },
    { id: 'actions', label: 'Recent Actions', icon: '📋', count: moderationData.recentActions.length }
  ];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-300';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-300';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const renderReports = () => (
    <div className="space-y-4">
      {moderationData.pendingReports.map(report => (
        <div key={report.id} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(report.severity)}`}>
                  {report.severity.toUpperCase()}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Report against {report.reportedUser}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-2">{report.content}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Reported by: {report.reportedBy}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => handleReport(report.id, 'dismiss', 'No violation found')}
              className="btn bg-gray-600 text-white hover:bg-gray-700"
            >
              ❌ Dismiss
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter action reason:');
                if (reason) handleReport(report.id, 'approve', reason);
              }}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              ✅ Take Action
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderComments = () => (
    <div className="space-y-4">
      {moderationData.flaggedComments.map(comment => (
        <div key={comment.id} className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {comment.author}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Match #{comment.matchId}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(comment.flaggedAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-2 p-3 bg-gray-50 dark:bg-gray-700 rounded">
                {comment.content}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Flagged for: {comment.flagReason}
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => moderateComment(comment.id, 'approve')}
              className="btn bg-green-600 text-white hover:bg-green-700"
            >
              ✅ Approve
            </button>
            <button
              onClick={() => moderateComment(comment.id, 'delete')}
              className="btn bg-red-600 text-white hover:bg-red-700"
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      {moderationData.suspendedUsers.map(user => (
        <div key={user.id} className="card p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {user.username}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                <span className="font-medium">Reason:</span> {user.suspensionReason}
              </p>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                <span className="font-medium">Suspended by:</span> {user.suspendedBy}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                Until: {new Date(user.suspendedUntil).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <button className="btn bg-green-600 text-white hover:bg-green-700">
                🔓 Unsuspend
              </button>
              <button className="btn bg-yellow-600 text-white hover:bg-yellow-700">
                ⏰ Extend
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActions = () => (
    <div className="space-y-4">
      {moderationData.recentActions.map(action => (
        <div key={action.id} className="card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-lg">
                {action.action === 'comment_deleted' ? '🗑️' :
                 action.action === 'user_warned' ? '⚠️' :
                 action.action === 'user_suspended' ? '🔒' : '📝'}
              </span>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {action.action.replace('_', ' ').toUpperCase()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Target: {action.targetUser} • By: {action.moderator}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Reason: {action.reason}
                </p>
              </div>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-500">
              {new Date(action.timestamp).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'reports': return renderReports();
      case 'comments': return renderComments();
      case 'users': return renderUsers();
      case 'actions': return renderActions();
      default: return renderReports();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading moderation data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">🛡️ Moderation Center</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage reports, comments, and user moderation</p>
        </div>
        <button
          onClick={fetchModerationData}
          className="btn bg-blue-600 text-white hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white text-red-600' : 'bg-red-600 text-white'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn bg-red-600 text-white hover:bg-red-700">
            🚨 Mass Report Review
          </button>
          <button className="btn bg-yellow-600 text-white hover:bg-yellow-700">
            📊 Generate Report
          </button>
          <button className="btn bg-blue-600 text-white hover:bg-blue-700">
            📋 Export Actions
          </button>
          <button className="btn bg-purple-600 text-white hover:bg-purple-700">
            ⚙️ Moderation Settings
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModerationCenter;