import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { getUserPrimaryRole, ROLES, hasRole, getRoleConfig } from '../utils/roleUtils';
import RoleProtectedRoute from './common/RoleProtectedRoute';

// Import dashboards for each role
import UserDashboard from './pages/UserDashboard';
import ModeratorDashboard from './admin/ModeratorDashboard';
import AdminDashboard from './admin/AdminDashboard';

function RoleBasedDashboard({ navigateTo, params }) {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate brief loading to check user roles
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [user]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to access your dashboard
          </p>
          <button 
            onClick={() => navigateTo('home')}
            className="btn btn-primary"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  // Determine which dashboard to show based on user roles
  const primaryRole = getUserPrimaryRole(user);
  const roleConfig = getRoleConfig(user);
  
  console.log('🔍 RoleBasedDashboard: User role check', {
    user: user?.name,
    primaryRole,
    userRole: user?.role,
    userRoles: user?.roles
  });
  
  // Priority: Admin > Moderator > User with role-based protection
  if (primaryRole === ROLES.ADMIN) {
    console.log('📋 Rendering Admin Dashboard for user:', user?.name);
    return (
      <RoleProtectedRoute 
        user={user} 
        role={ROLES.ADMIN}
        onUnauthorized={() => {
          console.warn('Admin dashboard access denied');
          navigateTo('user-dashboard');
        }}
      >
        <AdminDashboard navigateTo={navigateTo} params={params} />
      </RoleProtectedRoute>
    );
  } else if (primaryRole === ROLES.MODERATOR) {
    console.log('📋 Rendering Moderator Dashboard for user:', user?.name);
    return (
      <RoleProtectedRoute 
        user={user} 
        minRole={ROLES.MODERATOR}
        onUnauthorized={() => {
          console.warn('Moderator dashboard access denied');
          navigateTo('user-dashboard');
        }}
      >
        <ModeratorDashboard navigateTo={navigateTo} params={params} />
      </RoleProtectedRoute>
    );
  } else {
    console.log('📋 Rendering User Dashboard for user:', user?.name);
    return <UserDashboard navigateTo={navigateTo} params={params} />;
  }
}

export default RoleBasedDashboard;