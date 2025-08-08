import React from 'react';
import { useRoleTheme } from '../../common/RoleThemeProvider';
import PermissionGate from '../../common/PermissionGate';

/**
 * Role-themed stats widget for admin dashboards
 * @param {string} title - Widget title
 * @param {string|number} value - Main stat value
 * @param {string} subtitle - Additional info text
 * @param {string} icon - Icon/emoji for the stat
 * @param {string} trend - Trend indicator (up/down/neutral)
 * @param {string} trendValue - Trend value text
 * @param {string} permission - Required permission to view
 * @param {Function} onClick - Click handler
 */
function AdminStatsWidget({ 
  title, 
  value, 
  subtitle, 
  icon = '📊', 
  trend = 'neutral',
  trendValue = '',
  permission = null,
  onClick = null 
}) {
  const { theme, config } = useRoleTheme();

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400';
      case 'down': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  const widgetContent = (
    <div 
      className={`glass rounded-xl p-6 transition-all duration-300 hover:scale-105 ${
        onClick ? 'cursor-pointer hover:shadow-lg' : ''
      } ${theme.bg} ${theme.bgDark} border ${theme.border} ${theme.borderDark}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
        {value}
      </div>
      
      {(subtitle || trendValue) && (
        <div className="flex items-center justify-between">
          {subtitle && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </div>
          )}
          {trendValue && (
            <div className={`text-sm font-medium ${getTrendColor()}`}>
              <span className="mr-1">{getTrendIcon()}</span>
              {trendValue}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (permission) {
    return (
      <PermissionGate permission={permission} showError={false}>
        {widgetContent}
      </PermissionGate>
    );
  }

  return widgetContent;
}

export default AdminStatsWidget;