import React from 'react';
import { getRoleBadge, getRoleConfig } from '../../utils/roleUtils';

/**
 * Role badge component with color-coded themes
 * @param {Object} user - User object with roles
 * @param {string} size - Badge size (sm, md, lg)
 * @param {boolean} showIcon - Whether to show role icon
 * @param {boolean} showText - Whether to show role text
 * @param {string} variant - Badge variant (default, outline, minimal)
 */
function RoleBadge({ 
  user, 
  size = 'md', 
  showIcon = true, 
  showText = true, 
  variant = 'default',
  className = '' 
}) {
  if (!user) return null;

  const badge = getRoleBadge(user);
  const roleConfig = getRoleConfig(user);

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm', 
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: badge.className,
    outline: `border-2 ${roleConfig.theme.border} ${roleConfig.theme.borderDark} ${roleConfig.theme.primaryText} ${roleConfig.theme.primaryTextDark} bg-transparent`,
    minimal: `${roleConfig.theme.primaryText} ${roleConfig.theme.primaryTextDark} bg-transparent`
  };

  return (
    <span className={`
      inline-flex items-center space-x-1 font-medium rounded-full transition-all duration-200
      ${sizeClasses[size]} 
      ${variantClasses[variant]}
      ${className}
    `}>
      {showIcon && (
        <span className="leading-none">
          {badge.icon}
        </span>
      )}
      {showText && (
        <span className="leading-none">
          {badge.text}
        </span>
      )}
    </span>
  );
}

export default RoleBadge;