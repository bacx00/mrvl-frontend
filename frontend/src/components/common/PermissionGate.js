import React from 'react';
import { useAuth } from '../../hooks';

export const ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin'
};

export function PermissionGate({ 
  children, 
  requiredRole, 
  requiredRoles, 
  fallback = null 
}) {
  const { user, hasRole, hasAnyRole } = useAuth();

  if (!user) {
    return fallback;
  }

  let hasPermission = false;

  if (requiredRole) {
    hasPermission = hasRole(requiredRole);
  } else if (requiredRoles) {
    hasPermission = hasAnyRole(requiredRoles);
  }

  return hasPermission ? children : fallback;
}

export default PermissionGate;