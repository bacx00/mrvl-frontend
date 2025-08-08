import React from 'react';
import { useRoleTheme } from '../../common/RoleThemeProvider';
import PermissionGate from '../../common/PermissionGate';

/**
 * Role-themed action card for admin dashboards
 * @param {string} title - Card title
 * @param {string} description - Card description
 * @param {string} icon - Icon/emoji for the action
 * @param {Function} onClick - Click handler
 * @param {string} permission - Required permission to view/use
 * @param {string} buttonText - Action button text
 * @param {boolean} disabled - Whether the action is disabled
 * @param {string} badge - Badge text (optional)
 * @param {string} badgeColor - Badge color theme
 */
function AdminActionCard({ 
  title, 
  description, 
  icon = '⚡', 
  onClick,
  permission = null,
  buttonText = 'Open',
  disabled = false,
  badge = null,
  badgeColor = 'blue' 
}) {
  const { theme, config } = useRoleTheme();

  const getBadgeColors = () => {
    const badgeThemes = {
      blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      red: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      green: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    };
    return badgeThemes[badgeColor] || badgeThemes.blue;
  };

  const cardContent = (
    <div className={`glass rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
      disabled ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-lg'
    } ${theme.bg} ${theme.bgDark} border ${theme.border} ${theme.borderDark}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="text-3xl mb-2">{icon}</div>
        {badge && (
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getBadgeColors()}`}>
            {badge}
          </span>
        )}
      </div>
      
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          disabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : `${theme.primary} ${theme.primaryHover} text-white shadow-md ${theme.shadow}`
        }`}
      >
        {buttonText}
      </button>
    </div>
  );

  if (permission) {
    return (
      <PermissionGate permission={permission} showError={false}>
        {cardContent}
      </PermissionGate>
    );
  }

  return cardContent;
}

export default AdminActionCard;