import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';

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
  const userRoles = user.roles || [];
  
  // Priority: Admin > Moderator > User
  if (userRoles.includes('admin')) {
    return <AdminDashboard navigateTo={navigateTo} params={params} />;
  } else if (userRoles.includes('moderator')) {
    return <ModeratorDashboard navigateTo={navigateTo} params={params} />;
  } else {
    return <UserDashboard navigateTo={navigateTo} params={params} />;
  }
}

export default RoleBasedDashboard;