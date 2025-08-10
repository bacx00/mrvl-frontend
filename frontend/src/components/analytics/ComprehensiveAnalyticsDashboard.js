import React, { useState, useEffect } from 'react';
import { useAuth } from '../../app/context/AuthContext';
import PlatformAnalytics from './PlatformAnalytics';
import TeamPerformanceAnalytics from './TeamPerformanceAnalytics';
import PlayerEngagementAnalytics from './PlayerEngagementAnalytics';
import MatchTournamentAnalytics from './MatchTournamentAnalytics';
import SystemHealthMonitor from './SystemHealthMonitor';
import UserGrowthAnalytics from './UserGrowthAnalytics';

const ComprehensiveAnalyticsDashboard = ({ className = '' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('platform');
  const [userRole, setUserRole] = useState('user');
  const [hasAnalyticsAccess, setHasAnalyticsAccess] = useState(false);

  useEffect(() => {
    if (user) {
      const role = user.role || (user.roles && user.roles[0]) || 'user';
      setUserRole(role);
      
      // Check analytics access level
      const isAdmin = role === 'admin' || (user.roles && user.roles.includes('admin'));
      const isModerator = role === 'moderator' || (user.roles && user.roles.includes('moderator'));
      
      setHasAnalyticsAccess(isAdmin || isModerator);
    }
  }, [user]);

  const getAnalyticsTabs = () => {
    const tabs = [
      {
        id: 'platform',
        name: 'Platform Overview',
        icon: '📊',
        description: 'Platform usage and performance metrics'
      },
      {
        id: 'users',
        name: 'User Growth',
        icon: '👥',
        description: 'User growth and retention analytics'
      },
      {
        id: 'engagement',
        name: 'Player Engagement',
        icon: '🎮',
        description: 'Player activity and community engagement'
      }
    ];

    if (userRole === 'admin') {
      tabs.push(
        {
          id: 'teams',
          name: 'Team Performance',
          icon: '🏆',
          description: 'Team rankings and competitive metrics'
        },
        {
          id: 'matches',
          name: 'Match Analytics',
          icon: '⚔️',
          description: 'Match and tournament statistics'
        },
        {
          id: 'system',
          name: 'System Health',
          icon: '🔧',
          description: 'Real-time system monitoring'
        }
      );
    }

    return tabs;
  };

  const renderActiveComponent = () => {
    const commonProps = { className: "w-full" };
    
    switch (activeTab) {
      case 'platform':
        return <PlatformAnalytics {...commonProps} />;
      case 'users':
        return <UserGrowthAnalytics {...commonProps} />;
      case 'engagement':
        return <PlayerEngagementAnalytics {...commonProps} />;
      case 'teams':
        return <TeamPerformanceAnalytics {...commonProps} />;
      case 'matches':
        return <MatchTournamentAnalytics {...commonProps} />;
      case 'system':
        return <SystemHealthMonitor {...commonProps} />;
      default:
        return <PlatformAnalytics {...commonProps} />;
    }
  };

  if (!hasAnalyticsAccess) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-6">
            <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 13.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Analytics Access Restricted</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to view analytics data. Only administrators and moderators can access detailed platform analytics.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Current Role:</strong> {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
            </p>
            <p className="text-blue-600 dark:text-blue-400 text-sm mt-1">
              Contact an administrator to request analytics access.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = getAnalyticsTabs();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Marvel Rivals Analytics Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Comprehensive platform analytics and performance insights
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Access Level:</span>
              <span className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                userRole === 'admin' 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
              }`}>
                {userRole === 'admin' ? '🔴 Admin' : '🟡 Moderator'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-t pt-4">
          <nav className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={tab.description}
              >
                <span className="text-lg mr-2">{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Active Tab Description */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      </div>

      {/* Active Analytics Component */}
      <div className="min-h-96">
        {renderActiveComponent()}
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Marvel Rivals Esports Analytics</span>
            <span className="mx-2">•</span>
            <span>Real-time data from platform APIs</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span>Live Data</span>
            </div>
            <div className="text-xs">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAnalyticsDashboard;