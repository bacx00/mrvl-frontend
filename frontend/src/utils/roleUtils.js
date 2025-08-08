// Role-based utility functions and constants
export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator', 
  USER: 'user'
};

// Role hierarchy - higher values have more permissions
export const ROLE_HIERARCHY = {
  [ROLES.USER]: 1,
  [ROLES.MODERATOR]: 2,
  [ROLES.ADMIN]: 3
};

// Role configuration with themes and permissions
export const ROLE_CONFIG = {
  [ROLES.ADMIN]: {
    name: 'Admin',
    displayName: 'Super Admin',
    color: 'red',
    theme: {
      primary: 'bg-red-600',
      primaryHover: 'hover:bg-red-700',
      primaryText: 'text-red-600',
      primaryTextDark: 'dark:text-red-400',
      bg: 'bg-red-50',
      bgDark: 'dark:bg-red-900/20',
      border: 'border-red-200',
      borderDark: 'dark:border-red-700',
      badge: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      gradient: 'from-red-500 to-red-600',
      shadow: 'shadow-red-500/30'
    },
    icon: '🔴',
    emoji: '👑',
    permissions: [
      'admin_dashboard',
      'user_management', 
      'system_settings',
      'all_crud_operations',
      'analytics_full',
      'reporting_full',
      'role_assignment',
      'content_moderation',
      'forum_management'
    ]
  },
  [ROLES.MODERATOR]: {
    name: 'Moderator',
    displayName: 'Moderator',
    color: 'yellow',
    theme: {
      primary: 'bg-yellow-600',
      primaryHover: 'hover:bg-yellow-700',
      primaryText: 'text-yellow-600',
      primaryTextDark: 'dark:text-yellow-400',
      bg: 'bg-yellow-50',
      bgDark: 'dark:bg-yellow-900/20',
      border: 'border-yellow-200',
      borderDark: 'dark:border-yellow-700',
      badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      gradient: 'from-yellow-500 to-yellow-600',
      shadow: 'shadow-yellow-500/30'
    },
    icon: '🟡',
    emoji: '⚡',
    permissions: [
      'moderator_dashboard',
      'content_moderation',
      'forum_management',
      'user_warnings',
      'user_suspension',
      'comment_moderation',
      'post_moderation',
      'analytics_content',
      'match_verification'
    ]
  },
  [ROLES.USER]: {
    name: 'User',
    displayName: 'User',
    color: 'green',
    theme: {
      primary: 'bg-green-600',
      primaryHover: 'hover:bg-green-700',
      primaryText: 'text-green-600',
      primaryTextDark: 'dark:text-green-400',
      bg: 'bg-green-50',
      bgDark: 'dark:bg-green-900/20',
      border: 'border-green-200',
      borderDark: 'dark:border-green-700',
      badge: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      gradient: 'from-green-500 to-green-600',
      shadow: 'shadow-green-500/30'
    },
    icon: '🟢',
    emoji: '🎮',
    permissions: [
      'user_dashboard',
      'profile_customization',
      'forum_participation',
      'voting_system',
      'comment_system',
      'public_data_view',
      'personal_statistics'
    ]
  }
};

/**
 * Get user's primary role (highest in hierarchy)
 * @param {Object} user - User object with roles array or single role
 * @returns {string} - Primary role
 */
export const getUserPrimaryRole = (user) => {
  if (!user) {
    return ROLES.USER;
  }

  // Handle both single role and roles array for backward compatibility
  let userRoles;
  if (user.roles && Array.isArray(user.roles)) {
    userRoles = user.roles.filter(role => Object.values(ROLES).includes(role));
  } else if (user.role && Object.values(ROLES).includes(user.role)) {
    userRoles = [user.role];
  } else {
    return ROLES.USER;
  }
  
  if (userRoles.length === 0) {
    return ROLES.USER;
  }

  return userRoles.reduce((highest, current) => {
    return ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest;
  }, ROLES.USER);
};

/**
 * Check if user has specific role
 * @param {Object} user - User object
 * @param {string} role - Role to check
 * @returns {boolean}
 */
export const hasRole = (user, role) => {
  if (!user) return false;
  
  // Handle both single role and roles array for backward compatibility
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.includes(role);
  } else if (user.role) {
    return user.role === role;
  }
  
  return false;
};

/**
 * Check if user has permission for specific action
 * @param {Object} user - User object
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export const hasPermission = (user, permission) => {
  const primaryRole = getUserPrimaryRole(user);
  const roleConfig = ROLE_CONFIG[primaryRole];
  return roleConfig ? roleConfig.permissions.includes(permission) : false;
};

/**
 * Check if user has minimum role level
 * @param {Object} user - User object
 * @param {string} minRole - Minimum required role
 * @returns {boolean}
 */
export const hasMinimumRole = (user, minRole) => {
  const userRole = getUserPrimaryRole(user);
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[minRole];
};

/**
 * Get role theme configuration
 * @param {Object} user - User object
 * @returns {Object} - Theme configuration
 */
export const getRoleTheme = (user) => {
  const primaryRole = getUserPrimaryRole(user);
  return ROLE_CONFIG[primaryRole].theme;
};

/**
 * Get role configuration
 * @param {Object} user - User object  
 * @returns {Object} - Role configuration
 */
export const getRoleConfig = (user) => {
  const primaryRole = getUserPrimaryRole(user);
  return ROLE_CONFIG[primaryRole];
};

/**
 * Get role badge configuration
 * @param {Object} user - User object
 * @returns {Object} - Badge configuration
 */
export const getRoleBadge = (user) => {
  const roleConfig = getRoleConfig(user);
  return {
    text: roleConfig.displayName,
    className: roleConfig.theme.badge,
    icon: roleConfig.icon,
    emoji: roleConfig.emoji
  };
};

/**
 * Check if current user can manage target user
 * @param {Object} currentUser - Current user object
 * @param {Object} targetUser - Target user object
 * @returns {boolean}
 */
export const canManageUser = (currentUser, targetUser) => {
  const currentRole = getUserPrimaryRole(currentUser);
  const targetRole = getUserPrimaryRole(targetUser);
  
  // Admins can manage everyone except other admins (unless same user)
  if (currentRole === ROLES.ADMIN) {
    return currentUser.id === targetUser.id || targetRole !== ROLES.ADMIN;
  }
  
  // Moderators can manage users but not other moderators or admins
  if (currentRole === ROLES.MODERATOR) {
    return targetRole === ROLES.USER;
  }
  
  // Users can only manage themselves
  return currentUser.id === targetUser.id;
};

/**
 * Get navigation items based on user role
 * @param {Object} user - User object
 * @returns {Array} - Navigation items
 */
export const getRoleNavigation = (user) => {
  const role = getUserPrimaryRole(user);
  
  const baseNavigation = [
    { id: 'forums', label: 'Forums', permission: 'forum_participation' },
    { id: 'matches', label: 'Matches', permission: 'public_data_view' },
    { id: 'events', label: 'Events', permission: 'public_data_view' },
    { id: 'rankings', label: 'Rankings', permission: 'public_data_view' }
  ];

  const adminNavigation = [
    { id: 'admin-dashboard', label: 'Admin Dashboard', permission: 'admin_dashboard' },
    { id: 'user-management', label: 'Users', permission: 'user_management' },
    { id: 'system-settings', label: 'Settings', permission: 'system_settings' }
  ];

  const moderatorNavigation = [
    { id: 'moderator-dashboard', label: 'Mod Dashboard', permission: 'moderator_dashboard' },
    { id: 'moderation-center', label: 'Moderation', permission: 'content_moderation' }
  ];

  let navigation = [...baseNavigation];

  if (hasMinimumRole(user, ROLES.ADMIN)) {
    navigation = [...navigation, ...adminNavigation];
  } else if (hasMinimumRole(user, ROLES.MODERATOR)) {
    navigation = [...navigation, ...moderatorNavigation];
  }

  // Filter by permissions
  return navigation.filter(item => hasPermission(user, item.permission));
};

/**
 * Get dashboard route based on user role
 * @param {Object} user - User object
 * @returns {string} - Dashboard route
 */
export const getDashboardRoute = (user) => {
  const primaryRole = getUserPrimaryRole(user);
  
  if (primaryRole === ROLES.ADMIN) {
    return 'admin-dashboard';
  } else if (primaryRole === ROLES.MODERATOR) {
    return 'moderator-dashboard'; 
  } else {
    return 'user-dashboard';
  }
};

/**
 * Format error message based on user role and permissions
 * @param {Object} user - User object
 * @param {string} action - Action being attempted
 * @returns {string} - Formatted error message
 */
export const getPermissionErrorMessage = (user, action) => {
  const roleConfig = getRoleConfig(user);
  
  const messages = {
    insufficient_permissions: `Sorry, ${roleConfig.displayName} role doesn't have permission to ${action}.`,
    login_required: 'Please log in to access this feature.',
    role_required: `This action requires ${action} role or higher.`
  };

  if (!user) {
    return messages.login_required;
  }

  return messages.insufficient_permissions;
};

export default {
  ROLES,
  ROLE_HIERARCHY,
  ROLE_CONFIG,
  getUserPrimaryRole,
  hasRole,
  hasPermission,
  hasMinimumRole,
  getRoleTheme,
  getRoleConfig,
  getRoleBadge,
  canManageUser,
  getRoleNavigation,
  getDashboardRoute,
  getPermissionErrorMessage
};