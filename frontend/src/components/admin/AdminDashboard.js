import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import AdminTeams from './AdminTeams';
import AdminPlayers from './AdminPlayers';
import AdminMatches from './AdminMatches';
import AdminEvents from './AdminEvents';
import AdminUsers from './AdminUsers';
import AdminStats from './AdminStats';
import AdminNews from './AdminNews';
import AdminForums from './AdminForums';
import LiveScoringDashboard from './LiveScoringDashboard';
import BulkOperationsPanel from './BulkOperationsPanel';
import AdvancedAnalytics from './AdvancedAnalytics';
import SimpleUserProfile from '../pages/SimpleUserProfile';
import PermissionGate from '../common/PermissionGate';
import { ROLES, hasRole, hasMinimumRole } from '../../utils/roleUtils';
import { RoleThemeProvider, useRoleTheme } from '../common/RoleThemeProvider';

function AdminDashboard({ navigateTo }) {
  const { user } = useAuth();
  
  console.log('🔴 AdminDashboard: MAIN COMPONENT RENDERED');
  console.log('🔴 AdminDashboard: User:', user);
  console.log('🔴 AdminDashboard: User Role:', user?.role);
  
  if (!user) {
    console.log('🔴 AdminDashboard: NO USER - THIS SHOULD NOT HAPPEN!');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error: No User Data</h2>
          <p className="text-gray-600 dark:text-gray-400">Admin dashboard requires authentication</p>
        </div>
      </div>
    );
  }
  
  return (
    <RoleThemeProvider user={user}>
      <AdminDashboardContent navigateTo={navigateTo} />
    </RoleThemeProvider>
  );
}

function AdminDashboardContent({ navigateTo }) {
  const [activeSection, setActiveSection] = useState('overview'); // Start with overview, not profile!
  const { user, logout, api } = useAuth();
  
  console.log('🔵 AdminDashboardContent: CONTENT COMPONENT RENDERED');
  console.log('🔵 AdminDashboardContent: User:', user);
  console.log('🔵 AdminDashboardContent: Active Section:', activeSection);
  const { theme, config } = useRoleTheme();
  
  // Use proper CSS classes for admin theme
  const themeClasses = {
    primary: user?.role === 'admin' ? 'bg-red-600' : user?.role === 'moderator' ? 'bg-yellow-600' : 'bg-green-600',
    primaryHover: user?.role === 'admin' ? 'hover:bg-red-700' : user?.role === 'moderator' ? 'hover:bg-yellow-700' : 'hover:bg-green-700',
    shadow: user?.role === 'admin' ? 'shadow-red-500/30' : user?.role === 'moderator' ? 'shadow-yellow-500/30' : 'shadow-green-500/30'
  };
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

  // ALL admin sections - ADMINS GET EVERYTHING
  const allAdminSections = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'teams', name: 'Teams', icon: '👥' },
    { id: 'players', name: 'Players', icon: '🎮' },
    { id: 'matches', name: 'Matches', icon: '⚔️' },
    { id: 'events', name: 'Events', icon: '🏆' },
    { id: 'users', name: 'Users', icon: '👤' },
    { id: 'news', name: 'News', icon: '📰' },
    { id: 'forums', name: 'Forums', icon: '💬' },
    { id: 'live-scoring', name: 'Live Scoring', icon: '🔴' },
    { id: 'bulk-operations', name: 'Bulk Ops', icon: '⚙️' },
    { id: 'analytics', name: 'Analytics', icon: '📈' },
    { id: 'stats', name: 'Statistics', icon: '📊' }
  ];
  
  // Moderator sections (subset)
  const moderatorSections = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'teams', name: 'Teams', icon: '👥' },
    { id: 'players', name: 'Players', icon: '🎮' },
    { id: 'matches', name: 'Matches', icon: '⚔️' },
    { id: 'events', name: 'Events', icon: '🏆' },
    { id: 'news', name: 'News', icon: '📰' },
    { id: 'forums', name: 'Forums', icon: '💬' }
  ];

  // Debug user role information
  console.log('🔍 AdminDashboard - User Role Debug:', {
    user: user?.name,
    userRole: user?.role,
    userRoles: user?.roles,
    isAdmin: hasRole(user, ROLES.ADMIN),
    isModerator: hasRole(user, ROLES.MODERATOR),
    ROLES: ROLES
  });

  // SIMPLE ROLE CHECK - ADMINS GET ALL TABS
  const sections = user?.role === 'admin' ? allAdminSections : 
                   user?.role === 'moderator' ? moderatorSections : 
                   [];
  
  console.log(`✅ User ${user?.name} (${user?.role}) has access to ${sections.length} sections`);
  console.log('📋 Available sections:', sections.map(s => s.name).join(', '));

  // Verify admin access
  if (user?.role === 'admin' && sections.length !== allAdminSections.length) {
    console.error('❌ ADMIN SHOULD HAVE ALL SECTIONS!');
  }

  const renderContent = () => {
    // Simple access check - if section is in list, user has access
    const hasAccess = sections.some(s => s.id === activeSection);
    const currentSection = sections.find(s => s.id === activeSection);
    
    if (!hasAccess) {
      return (
        <div className="p-8 text-center">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/40 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Access Denied</h3>
            <p className="text-red-700 dark:text-red-300">
              You don't have permission to access this section.
              <span className="block mt-2">
                This section requires {user?.role === 'moderator' ? 'Admin' : 'higher'} privileges.
              </span>
            </p>
            <span className={`mt-3 px-3 py-1 text-sm font-medium rounded-full ${
              user?.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
              user?.role === 'moderator' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
            }`}>
              {user?.role === 'admin' ? 'Administrator' :
               user?.role === 'moderator' ? 'Moderator' : 'User'}
            </span>
          </div>
        </div>
      );
    }

    switch (activeSection) {
      case 'overview':
        return <AdminStats stats={stats} />;
      case 'teams':
        return (
          <PermissionGate user={user} minRole={ROLES.MODERATOR} showError={true}>
            <AdminTeams navigateTo={navigateTo} />
          </PermissionGate>
        );
      case 'players':
        return (
          <PermissionGate user={user} minRole={ROLES.MODERATOR} showError={true}>
            <AdminPlayers navigateTo={navigateTo} />
          </PermissionGate>
        );
      case 'matches':
        return (
          <PermissionGate user={user} minRole={ROLES.MODERATOR} showError={true}>
            <AdminMatches navigateTo={navigateTo} />
          </PermissionGate>
        );
      case 'events':
        return (
          <PermissionGate user={user} minRole={ROLES.MODERATOR} showError={true}>
            <AdminEvents navigateTo={navigateTo} />
          </PermissionGate>
        );
      case 'users':
        return (
          <PermissionGate user={user} role={ROLES.ADMIN} showError={true}>
            <AdminUsers navigateTo={navigateTo} />
          </PermissionGate>
        );
      case 'news':
        return (
          <PermissionGate user={user} minRole={ROLES.MODERATOR} showError={true}>
            <AdminNews navigateTo={navigateTo} />
          </PermissionGate>
        );
        
      // ADMIN-ONLY FEATURES
      case 'bulk-operations':
        return (
          <PermissionGate user={user} role={ROLES.ADMIN} showError={true}>
            <BulkOperationsPanel api={api} />
          </PermissionGate>
        );
      case 'analytics':
        return (
          <PermissionGate user={user} role={ROLES.ADMIN} showError={true}>
            <AdvancedAnalytics api={api} />
          </PermissionGate>
        );
        
      case 'forums':
        return (
          <PermissionGate user={user} minRole={ROLES.MODERATOR} showError={true}>
            <AdminForums navigateTo={navigateTo} />
          </PermissionGate>
        );
        
      case 'live-scoring':
        return (
          <PermissionGate user={user} minRole={ROLES.MODERATOR} showError={true}>
            <LiveScoringDashboard navigateTo={navigateTo} />
          </PermissionGate>
        );
        
      case 'stats':
        return (
          <PermissionGate user={user} role={ROLES.ADMIN} showError={true}>
            <AdminStats stats={stats} detailed={true} />
          </PermissionGate>
        );
        
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
                {user?.role === 'admin' ? 'Admin' : user?.role === 'moderator' ? 'Moderator' : 'User'} Dashboard
              </h1>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                user?.role === 'admin' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                user?.role === 'moderator' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {user?.role === 'admin' ? 'Administrator' :
                 user?.role === 'moderator' ? 'Moderator' : 'User'}
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
              {console.log('🎨 Rendering sidebar with sections:', sections.length)}
              {sections.length === 0 && (
                <div className="text-red-500 font-bold p-4">
                  ❌ NO SECTIONS ACCESSIBLE - CHECK USER ROLE!
                </div>
              )}
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${
                    activeSection === section.id
                      ? `bg-red-600 text-white shadow-lg shadow-red-500/30`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span>{section.icon}</span>
                    <span className="font-medium">{section.name}</span>
                  </div>
                  {(user?.role === 'admin' && ['users', 'bulk-operations', 'analytics', 'stats'].includes(section.id)) && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">Admin</span>
                  )}
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