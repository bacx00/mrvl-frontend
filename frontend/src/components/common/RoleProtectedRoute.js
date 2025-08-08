import React from 'react';
import { hasPermission, hasRole, hasMinimumRole, getPermissionErrorMessage, getRoleConfig } from '../../utils/roleUtils';

/**
 * Protected route component that checks user permissions
 * @param {Object} user - User object with roles
 * @param {string|Array} permission - Required permission(s)
 * @param {string} role - Required exact role
 * @param {string} minRole - Minimum required role
 * @param {React.Node} children - Content to render if authorized
 * @param {React.Node} fallback - Custom fallback component
 * @param {boolean} redirect - Whether to redirect to login/dashboard
 * @param {Function} onUnauthorized - Callback for unauthorized access
 */
function RoleProtectedRoute({ 
  user, 
  permission, 
  role, 
  minRole,
  children, 
  fallback = null,
  redirect = false,
  onUnauthorized = null 
}) {
  let hasAccess = false;

  // Check permission-based access
  if (permission) {
    if (Array.isArray(permission)) {
      hasAccess = permission.some(perm => hasPermission(user, perm));
    } else {
      hasAccess = hasPermission(user, permission);
    }
  }
  
  // Check role-based access (exact match)
  else if (role) {
    hasAccess = hasRole(user, role);
  }
  
  // Check minimum role access
  else if (minRole) {
    hasAccess = hasMinimumRole(user, minRole);
  }

  // Handle unauthorized access
  if (!hasAccess) {
    if (onUnauthorized) {
      onUnauthorized();
    }

    if (fallback) {
      return fallback;
    }

    const errorMessage = getPermissionErrorMessage(user, permission || role || minRole);
    const userRoleConfig = user ? getRoleConfig(user) : null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md w-full mx-auto text-center p-8">
          <div className="text-8xl mb-6">🚫</div>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h1>
          
          <div className="space-y-4 mb-8">
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {errorMessage}
            </p>
            
            {user && userRoleConfig && (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Your current role:</span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${userRoleConfig.theme.badge}`}>
                    {userRoleConfig.icon} {userRoleConfig.displayName}
                  </span>
                </div>
              </div>
            )}
            
            {!user && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                You need to be logged in to access this resource.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-xl transition-colors"
            >
              Go Back
            </button>
            
            {!user && (
              <button
                onClick={() => {/* Handle login redirect */}}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default RoleProtectedRoute;