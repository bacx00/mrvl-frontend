import React from 'react';
import { useAuth } from '../../hooks';

/**
 * Role-based access control component
 * Shows/hides content based on user role permissions
 */
const RoleBasedAccess = ({ 
  requiredRole, 
  requiredRoles, 
  allowedRoles, 
  deniedRoles,
  fallback = null,
  children 
}) => {
  const { user, isAdmin, isModerator, isUser, hasRole, hasAnyRole } = useAuth();

  // If no user is logged in, don't show anything
  if (!user) {
    return fallback;
  }

  // Check specific role requirement
  if (requiredRole) {
    if (!hasRole(requiredRole)) {
      return fallback;
    }
  }

  // Check if user has any of the required roles
  if (requiredRoles && Array.isArray(requiredRoles)) {
    if (!hasAnyRole(requiredRoles)) {
      return fallback;
    }
  }

  // Check allowed roles (alternative to requiredRoles)
  if (allowedRoles && Array.isArray(allowedRoles)) {
    if (!hasAnyRole(allowedRoles)) {
      return fallback;
    }
  }

  // Check denied roles (user should NOT have these roles)
  if (deniedRoles && Array.isArray(deniedRoles)) {
    if (hasAnyRole(deniedRoles)) {
      return fallback;
    }
  }

  return children;
};

/**
 * Admin-only content component
 */
export const AdminOnly = ({ children, fallback = null }) => {
  return (
    <RoleBasedAccess requiredRole="admin" fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
};

/**
 * Moderator and above content component
 */
export const ModeratorOnly = ({ children, fallback = null }) => {
  return (
    <RoleBasedAccess allowedRoles={['moderator', 'admin']} fallback={fallback}>
      {children}
    </RoleBasedAccess>
  );
};

/**
 * Authenticated users only (any role)
 */
export const AuthenticatedOnly = ({ children, fallback = null }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return fallback;
  }
  
  return children;
};

/**
 * Role badge component to display user's role
 */
export const RoleBadge = ({ user: propUser, className = '' }) => {
  const { user: contextUser, getRoleDisplayName } = useAuth();
  const user = propUser || contextUser;

  if (!user || !user.role) {
    return null;
  }

  const roleColors = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    moderator: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    user: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  };

  const roleColor = roleColors[user.role] || roleColors.user;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColor} ${className}`}>
      {getRoleDisplayName()}
    </span>
  );
};

/**
 * Role indicator icon component
 */
export const RoleIcon = ({ user: propUser, size = 'w-4 h-4' }) => {
  const { user: contextUser } = useAuth();
  const user = propUser || contextUser;

  if (!user || !user.role) {
    return null;
  }

  const icons = {
    admin: (
      <svg className={`${size} text-red-500`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M9.504 1.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 3.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1zM5.618 4.504a1 1 0 01-.372 1.364L5.016 6l.23.132a1 1 0 11-.992 1.736L3 7.723V8a1 1 0 01-2 0V6a.996.996 0 01.52-.878l1.734-.99a1 1 0 011.364.372zm8.764 0a1 1 0 011.364-.372l1.734.99A.996.996 0 0118 6v2a1 1 0 11-2 0v-.277l-1.254.145a1 1 0 11-.992-1.736L14.984 6l-.23-.132a1 1 0 01-.372-1.364zm-7 4a1 1 0 011.364-.372L10 8.848l1.254-.716a1 1 0 11.992 1.736L11 10.732V12a1 1 0 11-2 0v-1.268l-1.246-.864a1 1 0 01-.372-1.364zM3 11a1 1 0 011 1v1.267l1.254.716a1 1 0 11-.992 1.736l-1.75-1A1 1 0 012 14v-2a1 1 0 011-1zm14 0a1 1 0 011 1v2a1 1 0 01-.504.868l-1.75 1a1 1 0 11-.992-1.736L16 13.267V12a1 1 0 011-1zM9.504 15.132a1 1 0 01.992 0l1.75 1a1 1 0 11-.992 1.736L10 17.152l-1.254.716a1 1 0 11-.992-1.736l1.75-1z" clipRule="evenodd" />
      </svg>
    ),
    moderator: (
      <svg className={`${size} text-yellow-500`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    user: (
      <svg className={`${size} text-green-500`} fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    )
  };

  return icons[user.role] || icons.user;
};

export default RoleBasedAccess;