import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import AdminTeams from './AdminTeams';
import AdminPlayers from './AdminPlayers';
import AdminMatches from './AdminMatches';
import AdminEvents from './AdminEvents';
import AdminUsers from './AdminUsers';
import AdminStats from './AdminStats';
import AdminNews from './AdminNews';
import LiveScoringDashboard from './LiveScoringDashboard';
import BulkOperationsPanel from './BulkOperationsPanel';
import AdvancedAnalytics from './AdvancedAnalytics';
import SimpleUserProfile from '../pages/SimpleUserProfile';

function AdminDashboard({ navigateTo }) {
  const [activeSection, setActiveSection] = useState('overview');
  const { user, logout, api } = useAuth();
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalMatches: 0,
    liveMatches: 0,
    totalEvents: 0,
    totalUsers: 0
  });

  // Fetch real admin stats
  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        const response = await api.get('/admin/stats');
        const statsData = response.data || response;
        const apiStats = statsData.overview || statsData;
        
        setStats({
          totalTeams: apiStats.totalTeams || 0,
          totalPlayers: apiStats.totalPlayers || 0,
          totalMatches: apiStats.totalMatches || 0,
          liveMatches: apiStats.liveMatches || 0,
          totalEvents: apiStats.totalEvents || 0,
          totalUsers: apiStats.totalUsers || 0
        });
      } catch (error) {
        console.warn('Failed to fetch admin stats:', error);
        // Keep default fallback stats
      }
    };

    fetchAdminStats();
  }, [api]);

  // CRITICAL FIX: Remove tournaments that breaks the website
  const sections = [
    { id: 'overview', name: 'Overview' },
    { id: 'teams', name: 'Teams' },
    { id: 'players', name: 'Players' },
    { id: 'matches', name: 'Matches' },
    { id: 'events', name: 'Events' },
    { id: 'users', name: 'Users' },
    { id: 'news', name: 'News' },
    // PHASE 7: ADVANCED ADMIN FEATURES (removed tournaments)
    { id: 'bulk-operations', name: 'Bulk Ops' },
    { id: 'analytics', name: 'Analytics' },
    { id: 'profile', name: 'Profile' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <AdminStats stats={stats} />;
      case 'teams':
        return <AdminTeams navigateTo={navigateTo} />;
      case 'players':
        return <AdminPlayers navigateTo={navigateTo} />;
      case 'matches':
        return <AdminMatches navigateTo={navigateTo} />;
      case 'events':
        return <AdminEvents navigateTo={navigateTo} />;
      case 'users':
        return <AdminUsers navigateTo={navigateTo} />;
      case 'news':
        return <AdminNews navigateTo={navigateTo} />;
        
      // PHASE 7: ADVANCED ADMIN FEATURES (removed tournaments)
      case 'bulk-operations':
        return <BulkOperationsPanel api={api} />;
      case 'analytics':
        return <AdvancedAnalytics api={api} />;
      case 'profile':
        return <SimpleUserProfile navigateTo={navigateTo} />;
        
      default:
        return <AdminStats stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-sm font-medium rounded-full">
                Super Admin
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600 dark:text-gray-400">Welcome, {user?.name}</span>
              <button 
                onClick={() => navigateTo('home')}
                className="btn btn-secondary"
              >
                Back to Site
              </button>
              <button 
                onClick={logout}
                className="btn btn-ghost"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm h-[calc(100vh-73px)] overflow-y-auto">
          <div className="p-4">
            <div className="space-y-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-red-600 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="font-medium">{section.name}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;