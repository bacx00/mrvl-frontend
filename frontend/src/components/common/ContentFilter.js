import React from 'react';
import { hasPermission, hasRole, hasMinimumRole, getRoleConfig } from '../../utils/roleUtils';
import RoleBadge from './RoleBadge';

/**
 * Content filter component that hides/shows content based on user roles
 * @param {Object} user - User object with roles
 * @param {string|Array} showFor - Roles/permissions that can see content
 * @param {string|Array} hideFrom - Roles/permissions that cannot see content
 * @param {string} minRole - Minimum role required to see content
 * @param {React.Node} children - Content to conditionally show
 * @param {React.Node} fallback - Content to show when hidden
 * @param {boolean} showPlaceholder - Whether to show a placeholder when content is hidden
 * @param {string} reason - Reason why content is hidden
 */
function ContentFilter({ 
  user, 
  showFor, 
  hideFrom, 
  minRole,
  children, 
  fallback = null,
  showPlaceholder = true,
  reason = 'insufficient permissions' 
}) {
  let shouldShow = true;

  // Check if content should be hidden from certain roles
  if (hideFrom) {
    const hideRoles = Array.isArray(hideFrom) ? hideFrom : [hideFrom];
    shouldShow = !hideRoles.some(roleOrPerm => 
      hasRole(user, roleOrPerm) || hasPermission(user, roleOrPerm)
    );
  }

  // Check if content should only be shown to certain roles
  if (showFor && shouldShow) {
    const showRoles = Array.isArray(showFor) ? showFor : [showFor];
    shouldShow = showRoles.some(roleOrPerm => 
      hasRole(user, roleOrPerm) || hasPermission(user, roleOrPerm)
    );
  }

  // Check minimum role requirement
  if (minRole && shouldShow) {
    shouldShow = hasMinimumRole(user, minRole);
  }

  if (shouldShow) {
    return <>{children}</>;
  }

  if (fallback) {
    return fallback;
  }

  if (!showPlaceholder) {
    return null;
  }

  const userRoleConfig = user ? getRoleConfig(user) : null;

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
      <div className="text-2xl mb-2">🔒</div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Content restricted due to {reason}
      </div>
      {user && userRoleConfig && (
        <div className="flex items-center justify-center">
          <RoleBadge user={user} size="sm" showIcon={true} showText={true} variant="minimal" />
        </div>
      )}
    </div>
  );
}

/**
 * Sensitive data masker - masks sensitive information based on user role
 * @param {Object} user - User object with roles
 * @param {string} data - Data to potentially mask
 * @param {string|Array} allowedRoles - Roles that can see unmasked data
 * @param {string} maskChar - Character to use for masking
 * @param {number} visibleChars - Number of characters to show unmasked
 */
export function SensitiveData({ 
  user, 
  data, 
  allowedRoles = ['admin'], 
  maskChar = '*', 
  visibleChars = 4 
}) {
  const canView = Array.isArray(allowedRoles) 
    ? allowedRoles.some(role => hasRole(user, role) || hasPermission(user, role))
    : hasRole(user, allowedRoles) || hasPermission(user, allowedRoles);

  if (canView || !data) {
    return <span>{data}</span>;
  }

  // Mask sensitive data
  const maskedData = data.length > visibleChars 
    ? data.substring(0, visibleChars) + maskChar.repeat(data.length - visibleChars)
    : maskChar.repeat(data.length);

  return (
    <span className="font-mono text-gray-500 dark:text-gray-400" title="Sensitive data masked">
      {maskedData}
    </span>
  );
}

/**
 * Admin-only information display
 * @param {Object} user - User object with roles
 * @param {React.Node} children - Content to show to admins only
 */
export function AdminOnly({ user, children }) {
  return (
    <ContentFilter 
      user={user} 
      showFor="admin" 
      showPlaceholder={false}
    >
      {children}
    </ContentFilter>
  );
}

/**
 * Moderator and Admin information display
 * @param {Object} user - User object with roles
 * @param {React.Node} children - Content to show to moderators and admins
 */
export function ModeratorPlus({ user, children }) {
  return (
    <ContentFilter 
      user={user} 
      minRole="moderator" 
      showPlaceholder={false}
    >
      {children}
    </ContentFilter>
  );
}

export default ContentFilter;