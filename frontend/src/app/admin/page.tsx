'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

interface StatCard {
  title: string;
  value: number | string;
  change?: number;
  positive?: boolean;
  icon?: string;
}

interface RecentActivity {
  id: string;
  action: string;
  user: string;
  target: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatCard[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    // Check if user is authorized to access admin page
    if (!user) {
      setLoading(true);
      return;
    }
    
    if (user.role !== 'admin') {
      router.replace('/user/login');
      return;
    }

    // Mock data - in a real implementation this would come from an API
    const mockStats: StatCard[] = [
      { title: 'Total Users', value: 1247, change: 12, positive: true, icon: 'users' },
      { title: 'Active Users', value: 583, change: 7, positive: true, icon: 'user-check' },
      { title: 'Posts Today', value: 142, change: -5, positive: false, icon: 'message-square' },
      { title: 'New Threads', value: 24, change: 3, positive: true, icon: 'folder-plus' },
    ];

    const mockActivity: RecentActivity[] = [
      { id: '1', action: 'Created thread', user: 'Admin', target: 'Patch 1.03 Discussion', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: '2', action: 'Deleted post', user: 'Moderator1', target: 'Inappropriate content in General Discussion', timestamp: new Date(Date.now() - 7200000).toISOString() },
      { id: '3', action: 'Banned user', user: 'Admin', target: 'ToxicUser123', timestamp: new Date(Date.now() - 14400000).toISOString() },
      { id: '4', action: 'Created event', user: 'EventManager', target: 'Summer Tournament 2025', timestamp: new Date(Date.now() - 28800000).toISOString() },
      { id: '5', action: 'Updated match', user: 'Admin', target: 'Sentinels vs Cloud9', timestamp: new Date(Date.now() - 86400000).toISOString() },
    ];

    setStats(mockStats);
    setRecentActivity(mockActivity);
    setLoading(false);
  }, [user, router]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'users':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
          </svg>
        );
      case 'user-check':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
          </svg>
        );
      case 'message-square':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
          </svg>
        );
      case 'folder-plus':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path>
          </svg>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa4454]"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1923] min-h-[calc(100vh-80px)]">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="md:w-1/5">
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg shadow-lg p-4">
              <h2 className="text-xl font-bold mb-4 border-b border-[#2b3d4d] pb-2">Admin Panel</h2>
              <nav className="space-y-1">
                <button 
                  onClick={() => setActiveSection('dashboard')}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    activeSection === 'dashboard' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'text-[#768894] hover:bg-[#20303d] hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  <span>Dashboard</span>
                </button>
                <button 
                  onClick={() => setActiveSection('users')}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    activeSection === 'users' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'text-[#768894] hover:bg-[#20303d] hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  <span>Users</span>
                </button>
                <button 
                  onClick={() => setActiveSection('content')}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    activeSection === 'content' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'text-[#768894] hover:bg-[#20303d] hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                  </svg>
                  <span>Content</span>
                </button>
                <button 
                  onClick={() => setActiveSection('matches')}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    activeSection === 'matches' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'text-[#768894] hover:bg-[#20303d] hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>Matches</span>
                </button>
                <button 
                  onClick={() => setActiveSection('events')}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    activeSection === 'events' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'text-[#768894] hover:bg-[#20303d] hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"></path>
                  </svg>
                  <span>Events</span>
                </button>
                <button 
                  onClick={() => setActiveSection('forums')}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    activeSection === 'forums' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'text-[#768894] hover:bg-[#20303d] hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                  </svg>
                  <span>Forums</span>
                </button>
                <button 
                  onClick={() => setActiveSection('settings')}
                  className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-2 ${
                    activeSection === 'settings' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'text-[#768894] hover:bg-[#20303d] hover:text-white'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>Settings</span>
                </button>
              </nav>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="md:w-4/5">
            {activeSection === 'dashboard' && (
              <div>
                {/* Welcome Banner */}
                <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-xl font-bold">Welcome, Admin</h1>
                      <p className="text-[#768894] mt-1">Here's what's happening on your platform today</p>
                    </div>
                    <Link 
                      href="/"
                      className="bg-[#2b3d4d] hover:bg-[#354c5f] text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      View Site
                    </Link>
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-[#768894]">{stat.title}</h3>
                        {stat.icon && (
                          <span className="bg-[#0f1923] p-2 rounded-md">
                            {renderIcon(stat.icon)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-end">
                        <span className="text-2xl font-bold">{stat.value}</span>
                        {stat.change !== undefined && (
                          <span className={`ml-2 text-sm ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                            {stat.positive ? '+' : ''}{stat.change}%
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Recent Activity */}
                <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-4">
                  <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="border-b border-[#2b3d4d] last:border-0 pb-4 last:pb-0">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">
                              <span className="text-[#fa4454]">{activity.user}</span> {activity.action}:
                            </p>
                            <p className="text-sm text-[#768894]">{activity.target}</p>
                          </div>
                          <div className="text-xs text-[#768894]">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-center">
                    <button className="text-[#fa4454] hover:text-[#ff6b79] text-sm">
                      View All Activity
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'users' && (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">User Management</h2>
                  <button className="bg-[#fa4454] hover:bg-[#e03a49] text-white px-4 py-2 rounded text-sm transition-colors">
                    Add New User
                  </button>
                </div>
                
                {/* User search and filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                  <div className="md:w-1/2">
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Search users..." 
                        className="w-full bg-[#0f1923] border border-[#2b3d4d] rounded px-4 py-2 pl-10 text-white focus:outline-none focus:border-[#fa4454]"
                      />
                      <svg className="w-5 h-5 text-[#768894] absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <div className="md:w-1/4">
                    <select className="w-full bg-[#0f1923] border border-[#2b3d4d] rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa4454]">
                      <option value="">All Roles</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="user">User</option>
                    </select>
                  </div>
                  <div className="md:w-1/4">
                    <select className="w-full bg-[#0f1923] border border-[#2b3d4d] rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa4454]">
                      <option value="">All Status</option>
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="banned">Banned</option>
                    </select>
                  </div>
                </div>
                
                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-[#0f1923] text-[#768894] text-left">
                      <tr>
                        <th className="px-4 py-2 rounded-tl-md">Username</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-4 py-2">Role</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Joined</th>
                        <th className="px-4 py-2 rounded-tr-md">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2b3d4d]">
                      <tr className="hover:bg-[#20303d]">
                        <td className="px-4 py-3">admin</td>
                        <td className="px-4 py-3">admin@mrvl.gg</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-[#fa4454] text-white text-xs rounded">Admin</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Active</span></td>
                        <td className="px-4 py-3">Jan 1, 2025</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="p-1 text-[#768894] hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </button>
                            <button className="p-1 text-[#768894] hover:text-[#fa4454]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#20303d]">
                        <td className="px-4 py-3">moderator1</td>
                        <td className="px-4 py-3">mod1@mrvl.gg</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-blue-500 text-white text-xs rounded">Moderator</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Active</span></td>
                        <td className="px-4 py-3">Feb 15, 2025</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="p-1 text-[#768894] hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </button>
                            <button className="p-1 text-[#768894] hover:text-[#fa4454]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#20303d]">
                        <td className="px-4 py-3">toxicuser123</td>
                        <td className="px-4 py-3">toxic@example.com</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">User</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-red-500 text-white text-xs rounded">Banned</span></td>
                        <td className="px-4 py-3">Apr 3, 2025</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="p-1 text-[#768894] hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </button>
                            <button className="p-1 text-[#768894] hover:text-[#fa4454]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#20303d]">
                        <td className="px-4 py-3">newuser</td>
                        <td className="px-4 py-3">new@example.com</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-500 text-white text-xs rounded">User</span></td>
                        <td className="px-4 py-3"><span className="px-2 py-1 bg-green-500 text-white text-xs rounded">Active</span></td>
                        <td className="px-4 py-3">May 12, 2025</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="p-1 text-[#768894] hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </button>
                            <button className="p-1 text-[#768894] hover:text-[#fa4454]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-[#768894]">
                    Showing 1-4 of 1,247 users
                  </div>
                  <div className="flex">
                    <button className="bg-[#0f1923] border border-[#2b3d4d] text-[#768894] px-3 py-1 rounded-l text-sm">
                      Previous
                    </button>
                    <button className="bg-[#fa4454] text-white px-3 py-1 text-sm">
                      1
                    </button>
                    <button className="bg-[#0f1923] border-t border-b border-[#2b3d4d] text-white px-3 py-1 text-sm">
                      2
                    </button>
                    <button className="bg-[#0f1923] border-t border-b border-[#2b3d4d] text-white px-3 py-1 text-sm">
                      3
                    </button>
                    <button className="bg-[#0f1923] border border-[#2b3d4d] text-white px-3 py-1 rounded-r text-sm">
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'content' && (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold">Content Management</h2>
                  <div className="flex space-x-2">
                    <button className="bg-[#fa4454] hover:bg-[#e03a49] text-white px-4 py-2 rounded text-sm transition-colors">
                      New Post
                    </button>
                    <button className="bg-[#2b3d4d] hover:bg-[#354c5f] text-white px-4 py-2 rounded text-sm transition-colors">
                      Manage Categories
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-md font-semibold mb-2">Quick Draft</h3>
                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Title" 
                      className="w-full bg-[#0f1923] border border-[#2b3d4d] rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa4454]"
                    />
                    <textarea 
                      placeholder="Content..." 
                      className="w-full bg-[#0f1923] border border-[#2b3d4d] rounded px-4 py-2 text-white focus:outline-none focus:border-[#fa4454] min-h-[120px]"
                    ></textarea>
                    <div className="flex justify-end">
                      <button className="bg-[#fa4454] hover:bg-[#e03a49] text-white px-4 py-2 rounded text-sm transition-colors">
                        Save Draft
                      </button>
                    </div>
                  </div>
                </div>
                
                <h3 className="text-md font-semibold mb-2">Recent Content</h3>
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead className="bg-[#0f1923] text-[#768894] text-left">
                      <tr>
                        <th className="px-4 py-2 rounded-tl-md">Title</th>
                        <th className="px-4 py-2">Author</th>
                        <th className="px-4 py-2">Category</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2 rounded-tr-md">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2b3d4d]">
                      <tr className="hover:bg-[#20303d]">
                        <td className="px-4 py-3">Patch 1.03 Notes - Iron Man Buffs</td>
                        <td className="px-4 py-3">Admin</td>
                        <td className="px-4 py-3">Patch Notes</td>
                        <td className="px-4 py-3">May 10, 2025</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="p-1 text-[#768894] hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </button>
                            <button className="p-1 text-[#768894] hover:text-[#fa4454]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#20303d]">
                        <td className="px-4 py-3">Summer Tournament Announcement</td>
                        <td className="px-4 py-3">EventManager</td>
                        <td className="px-4 py-3">Events</td>
                        <td className="px-4 py-3">May 8, 2025</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="p-1 text-[#768894] hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </button>
                            <button className="p-1 text-[#768894] hover:text-[#fa4454]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#20303d]">
                        <td className="px-4 py-3">Top 10 Plays of Last Weekend</td>
                        <td className="px-4 py-3">ContentCreator</td>
                        <td className="px-4 py-3">News</td>
                        <td className="px-4 py-3">May 5, 2025</td>
                        <td className="px-4 py-3">
                          <div className="flex space-x-2">
                            <button className="p-1 text-[#768894] hover:text-white">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                              </svg>
                            </button>
                            <button className="p-1 text-[#768894] hover:text-[#fa4454]">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeSection === 'matches' || activeSection === 'events' || activeSection === 'forums' || activeSection === 'settings') && (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded-lg p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-[#2b3d4d]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 className="text-lg font-medium mt-4 mb-2">This section is under development</h3>
                <p className="text-[#768894] mb-4">The {activeSection} management functionality will be available soon.</p>
                <button className="bg-[#2b3d4d] hover:bg-[#354c5f] text-white px-4 py-2 rounded text-sm transition-colors">
                  Back to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
