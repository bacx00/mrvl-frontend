import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import AdminOverview from './AdminOverview';
import AdminTeams from './AdminTeams';
import AdminPlayers from './AdminPlayers';
import AdminMatches from './AdminMatches';
import AdminEvents from './AdminEvents';
import AdminUsers from './AdminUsers';
import AdminNews from './AdminNews';
import AdminForums from './AdminForums';
import AdminBulkOperations from './AdminBulkOperations';
import AdminStatistics from './AdminStatistics';
import { ROLES, hasRole, hasMinimumRole } from '../../utils/roleUtils';

function AdminDashboard({ navigateTo }) {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Error: No User Data</h2>
          <p className="text-gray-600 dark:text-gray-400">Admin dashboard requires authentication</p>
        </div>
      </div>
    );
  }
  
  return <AdminDashboardContent navigateTo={navigateTo} />;
}

function AdminDashboardContent({ navigateTo }) {
  const [activeSection, setActiveSection] = useState('overview');
  const { user, logout, api } = useAuth();
  
  // Use proper CSS classes for admin theme
  const themeClasses = {
    primary: user?.role === 'admin' ? 'bg-red-600' : user?.role === 'moderator' ? 'bg-yellow-600' : 'bg-green-600',
    primaryHover: user?.role === 'admin' ? 'hover:bg-red-700' : user?.role === 'moderator' ? 'hover:bg-yellow-700' : 'hover:bg-green-700',
    shadow: user?.role === 'admin' ? 'shadow-red-500/30' : user?.role === 'moderator' ? 'shadow-yellow-500/30' : 'shadow-green-500/30'
  };


  // ALL admin sections - ADMINS GET EVERYTHING
  const allAdminSections = [
    { id: 'overview', name: 'Overview' },
    { id: 'teams', name: 'Teams' },
    { id: 'players', name: 'Players' },
    { id: 'matches', name: 'Matches' },
    { id: 'events', name: 'Events' },
    { id: 'users', name: 'Users' },
    { id: 'news', name: 'News' },
    { id: 'forums', name: 'Forums' },
    { id: 'bulk-operations', name: 'Bulk Ops' },
    { id: 'stats', name: 'Statistics' }
  ];
  
  // Moderator sections (subset)
  const moderatorSections = [
    { id: 'overview', name: 'Overview' },
    { id: 'teams', name: 'Teams' },
    { id: 'players', name: 'Players' },
    { id: 'matches', name: 'Matches' },
    { id: 'events', name: 'Events' },
    { id: 'news', name: 'News' },
    { id: 'forums', name: 'Forums' }
  ];

  // Determine available sections based on user role
  const sections = user?.role === 'admin' ? allAdminSections : 
                   user?.role === 'moderator' ? moderatorSections : 
                   [];

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
        return <AdminOverview />;
      case 'teams':
        return hasMinimumRole(user, ROLES.MODERATOR) ? <AdminTeams /> : <AccessDenied />;
      case 'players':
        return hasMinimumRole(user, ROLES.MODERATOR) ? <AdminPlayers /> : <AccessDenied />;
      case 'matches':
        return hasMinimumRole(user, ROLES.MODERATOR) ? <AdminMatches /> : <AccessDenied />;
      case 'events':
        return hasMinimumRole(user, ROLES.MODERATOR) ? <AdminEvents /> : <AccessDenied />;
      case 'users':
        return hasRole(user, ROLES.ADMIN) ? <AdminUsers /> : <AccessDenied />;
      case 'news':
        return hasMinimumRole(user, ROLES.MODERATOR) ? <AdminNews /> : <AccessDenied />;
      case 'forums':
        return hasMinimumRole(user, ROLES.MODERATOR) ? <AdminForums /> : <AccessDenied />;
      case 'bulk-operations':
        return hasRole(user, ROLES.ADMIN) ? <AdminBulkOperations /> : <AccessDenied />;
      case 'statistics':
        return hasRole(user, ROLES.ADMIN) ? <AdminStatistics /> : <AccessDenied />;
      default:
        return <AdminOverview />;
    }
  };

  const AccessDenied = () => (
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
      </div>
    </div>
  );

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
        <nav className="w-64 bg-white dark:bg-gray-800 shadow-sm h-[calc(100vh-73px)] overflow-y-auto border-r border-gray-200 dark:border-gray-700">
          <div className="p-4">
            {sections.length === 0 ? (
              <div className="text-red-500 font-bold p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                NO SECTIONS ACCESSIBLE - CHECK USER ROLE!
              </div>
            ) : (
              <div className="space-y-1">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between border ${
                      activeSection === section.id
                        ? `${themeClasses.primary} text-white shadow-lg border-transparent`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                    }`}
                  >
                    <span>{section.name}</span>
                    {(user?.role === 'admin' && ['users', 'bulk-operations', 'stats'].includes(section.id)) && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        activeSection === section.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                      }`}>
                        Admin
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
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