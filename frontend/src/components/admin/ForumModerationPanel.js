import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

const ForumModerationPanel = () => {
  const { user, api } = useAuth();
  const [activeTab, setActiveTab] = useState('threads');
  const [threads, setThreads] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchModerationData();
  }, [activeTab]);

  const fetchModerationData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'threads') {
        const response = await api.get('/admin/forums/threads');
        setThreads(response.data.data || []);
      } else if (activeTab === 'posts') {
        const response = await api.get('/admin/forums/posts');
        setPosts(response.data.data || []);
      } else if (activeTab === 'reports') {
        const response = await api.get('/admin/forums/reports');
        setReports(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching moderation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (type, id, action) => {
    try {
      await api.post(`/admin/forums/${type}/${id}/${action}`);
      fetchModerationData();
    } catch (error) {
      console.error('Error performing action:', error);
    }
  };

  const filteredData = () => {
    let data = activeTab === 'threads' ? threads : activeTab === 'posts' ? posts : reports;
    
    if (searchTerm) {
      data = data.filter(item => 
        (item.title || item.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.user?.username || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      data = data.filter(item => item.status === filterStatus);
    }

    return data;
  };

  return (
    <div className="moderation-panel">
      <div className="moderation-header">
        <h2>Forum Moderation</h2>
        <div className="moderation-stats">
          <div className="stat-card">
            <span className="stat-value">{threads.length}</span>
            <span className="stat-label">Total Threads</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{posts.length}</span>
            <span className="stat-label">Total Posts</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{reports.filter(r => r.status === 'pending').length}</span>
            <span className="stat-label">Pending Reports</span>
          </div>
        </div>
      </div>

      <div className="moderation-tabs">
        <button 
          className={`tab-btn ${activeTab === 'threads' ? 'active' : ''}`}
          onClick={() => setActiveTab('threads')}
        >
          Threads
        </button>
        <button 
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      <div className="moderation-filters">
        <input
          type="text"
          placeholder="Search by content or username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="locked">Locked</option>
          <option value="deleted">Deleted</option>
          <option value="pending">Pending</option>
        </select>
      </div>

      <div className="moderation-content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <div className="moderation-list">
            {filteredData().map(item => (
              <div key={item.id} className="moderation-item">
                <div className="item-header">
                  <div className="item-user">
                    <img 
                      src={item.user?.avatar || '/default-avatar.png'} 
                      alt={item.user?.username}
                      className="user-avatar"
                    />
                    <div className="user-info">
                      <span className="username">{item.user?.username}</span>
                      <span className="user-flair">{item.user?.flair}</span>
                    </div>
                  </div>
                  <div className="item-meta">
                    <span className="item-date">{new Date(item.created_at).toLocaleDateString()}</span>
                    <span className={`item-status ${item.status}`}>{item.status}</span>
                  </div>
                </div>
                
                <div className="item-content">
                  {item.title && <h4>{item.title}</h4>}
                  <p>{item.content}</p>
                </div>

                <div className="item-stats">
                  <span>Views: {item.views || 0}</span>
                  <span>Replies: {item.replies_count || 0}</span>
                  <span>Votes: {item.upvotes || 0} / {item.downvotes || 0}</span>
                </div>

                <div className="item-actions">
                  {item.status !== 'deleted' && (
                    <>
                      <button 
                        onClick={() => handleAction(activeTab, item.id, 'delete')}
                        className="action-btn delete"
                      >
                        Delete
                      </button>
                      <button 
                        onClick={() => handleAction(activeTab, item.id, item.status === 'locked' ? 'unlock' : 'lock')}
                        className="action-btn lock"
                      >
                        {item.status === 'locked' ? 'Unlock' : 'Lock'}
                      </button>
                    </>
                  )}
                  {activeTab === 'reports' && item.status === 'pending' && (
                    <>
                      <button 
                        onClick={() => handleAction('reports', item.id, 'resolve')}
                        className="action-btn resolve"
                      >
                        Resolve
                      </button>
                      <button 
                        onClick={() => handleAction('reports', item.id, 'dismiss')}
                        className="action-btn dismiss"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  <button className="action-btn view">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .moderation-panel {
          background: #0a0a0a;
          padding: 20px;
          border-radius: 12px;
        }

        .moderation-header {
          margin-bottom: 30px;
        }

        .moderation-header h2 {
          color: #fff;
          font-size: 24px;
          margin-bottom: 20px;
        }

        .moderation-stats {
          display: flex;
          gap: 20px;
        }

        .stat-card {
          background: #111;
          padding: 20px;
          border-radius: 8px;
          flex: 1;
          text-align: center;
          border: 1px solid #222;
        }

        .stat-value {
          display: block;
          font-size: 32px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 5px;
        }

        .stat-label {
          color: #888;
          font-size: 14px;
        }

        .moderation-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .tab-btn {
          background: #111;
          border: 1px solid #333;
          color: #888;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          background: #1a1a1a;
          color: #fff;
        }

        .tab-btn.active {
          background: #ff4655;
          color: #fff;
          border-color: #ff4655;
        }

        .moderation-filters {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          background: #111;
          border: 1px solid #333;
          color: #fff;
          padding: 10px 15px;
          border-radius: 6px;
        }

        .filter-select {
          background: #111;
          border: 1px solid #333;
          color: #fff;
          padding: 10px 15px;
          border-radius: 6px;
          min-width: 150px;
        }

        .moderation-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .moderation-item {
          background: #111;
          border: 1px solid #222;
          border-radius: 8px;
          padding: 20px;
        }

        .item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .item-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
        }

        .user-info {
          display: flex;
          flex-direction: column;
        }

        .username {
          color: #fff;
          font-weight: 500;
        }

        .user-flair {
          color: #888;
          font-size: 12px;
        }

        .item-meta {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .item-date {
          color: #888;
          font-size: 14px;
        }

        .item-status {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .item-status.active {
          background: #10b981;
          color: #fff;
        }

        .item-status.locked {
          background: #f59e0b;
          color: #fff;
        }

        .item-status.deleted {
          background: #ef4444;
          color: #fff;
        }

        .item-status.pending {
          background: #3b82f6;
          color: #fff;
        }

        .item-content {
          margin-bottom: 15px;
        }

        .item-content h4 {
          color: #fff;
          margin-bottom: 8px;
        }

        .item-content p {
          color: #ccc;
          line-height: 1.5;
        }

        .item-stats {
          display: flex;
          gap: 20px;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 1px solid #222;
        }

        .item-stats span {
          color: #888;
          font-size: 14px;
        }

        .item-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          padding: 6px 16px;
          border-radius: 4px;
          border: none;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.delete {
          background: #ef4444;
          color: #fff;
        }

        .action-btn.lock {
          background: #f59e0b;
          color: #fff;
        }

        .action-btn.resolve {
          background: #10b981;
          color: #fff;
        }

        .action-btn.dismiss {
          background: #6b7280;
          color: #fff;
        }

        .action-btn.view {
          background: #3b82f6;
          color: #fff;
        }

        .action-btn:hover {
          opacity: 0.8;
        }

        .loading {
          text-align: center;
          color: #888;
          padding: 40px;
        }
      `}</style>
    </div>
  );
};

export default ForumModerationPanel;