import React from 'react';
import AdminStatsWidget from './AdminStatsWidget';
import AdminActionCard from './AdminActionCard';
import { hasRole, ROLES } from '../../../utils/roleUtils';

/**
 * Admin-specific widgets that only admins can see
 */
export function AdminWidgets({ user, stats = {}, onNavigate }) {
  if (!hasRole(user, ROLES.ADMIN)) {
    return null;
  }

  return (
    <>
      <AdminStatsWidget
        title="System Health"
        value="99.9%"
        subtitle="Uptime"
        icon="🟢"
        trend="up"
        trendValue="+0.1%"
        permission="system_settings"
      />
      
      <AdminStatsWidget
        title="Total Users"
        value={stats.totalUsers || 0}
        subtitle="Registered"
        icon="👥"
        trend="up"
        trendValue="+12 today"
        permission="user_management"
      />
      
      <AdminStatsWidget
        title="Server Load"
        value="2.1GB"
        subtitle="Memory usage"
        icon="⚡"
        trend="neutral"
        trendValue="Normal"
        permission="system_settings"
      />
      
      <AdminActionCard
        title="User Management"
        description="Manage user accounts, roles, and permissions"
        icon="👤"
        onClick={() => onNavigate('users')}
        permission="user_management"
        buttonText="Manage Users"
        badge="Admin"
        badgeColor="red"
      />
      
      <AdminActionCard
        title="System Settings"
        description="Configure application settings and preferences"
        icon="⚙️"
        onClick={() => onNavigate('settings')}
        permission="system_settings"
        buttonText="Open Settings"
        badge="Admin"
        badgeColor="red"
      />
      
      <AdminActionCard
        title="Analytics Dashboard"
        description="View comprehensive system analytics and reports"
        icon="📊"
        onClick={() => onNavigate('analytics')}
        permission="analytics_full"
        buttonText="View Analytics"
        badge="Admin"
        badgeColor="red"
      />
    </>
  );
}

/**
 * Moderator-specific widgets that moderators and admins can see
 */
export function ModeratorWidgets({ user, stats = {}, onNavigate }) {
  if (!hasRole(user, ROLES.MODERATOR) && !hasRole(user, ROLES.ADMIN)) {
    return null;
  }

  return (
    <>
      <AdminStatsWidget
        title="Pending Reports"
        value={stats.pendingReports || 0}
        subtitle="Requires attention"
        icon="🚨"
        trend={stats.pendingReports > 10 ? "up" : "neutral"}
        trendValue={stats.pendingReports > 10 ? "High" : "Normal"}
        permission="content_moderation"
        onClick={() => onNavigate('reports')}
      />
      
      <AdminStatsWidget
        title="Active Warnings"
        value={stats.activeWarnings || 0}
        subtitle="User warnings"
        icon="⚠️"
        trend="neutral"
        permission="user_warnings"
      />
      
      <AdminStatsWidget
        title="Content Moderated"
        value={stats.resolvedToday || 0}
        subtitle="Resolved today"
        icon="✅"
        trend="up"
        trendValue="Good work!"
        permission="content_moderation"
      />
      
      <AdminActionCard
        title="Content Moderation"
        description="Review and moderate user-generated content"
        icon="🔍"
        onClick={() => onNavigate('content')}
        permission="content_moderation"
        buttonText="Moderate Content"
        badge="Moderator"
        badgeColor="yellow"
      />
      
      <AdminActionCard
        title="Forum Management"
        description="Manage forum threads and discussions"
        icon="💬"
        onClick={() => onNavigate('forums')}
        permission="forum_management"
        buttonText="Manage Forums"
        badge="Moderator"
        badgeColor="yellow"
      />
      
      <AdminActionCard
        title="User Reports"
        description="Handle user reports and violations"
        icon="📋"
        onClick={() => onNavigate('reports')}
        permission="content_moderation"
        buttonText="Review Reports"
        badge={stats.pendingReports > 0 ? `${stats.pendingReports} pending` : "All Clear"}
        badgeColor={stats.pendingReports > 0 ? "red" : "green"}
      />
    </>
  );
}

/**
 * User-specific widgets that all users can see
 */
export function UserWidgets({ user, stats = {}, onNavigate }) {
  return (
    <>
      <AdminStatsWidget
        title="Your Posts"
        value={stats.posts || 0}
        subtitle="Forum contributions"
        icon="💬"
        trend="up"
        trendValue="+3 this week"
        onClick={() => onNavigate('activity')}
      />
      
      <AdminStatsWidget
        title="Reputation"
        value={stats.reputation || 0}
        subtitle="Community points"
        icon="⭐"
        trend="up"
        trendValue="+45 this month"
      />
      
      <AdminStatsWidget
        title="Match Win Rate"
        value={`${stats.winRate || 0}%`}
        subtitle={`${stats.matchesPlayed || 0} matches played`}
        icon="🏆"
        trend={stats.winRate > 50 ? "up" : "neutral"}
      />
      
      <AdminActionCard
        title="Profile Settings"
        description="Customize your profile and preferences"
        icon="👤"
        onClick={() => onNavigate('profile')}
        buttonText="Edit Profile"
        badge="Profile"
        badgeColor="green"
      />
      
      <AdminActionCard
        title="Match History"
        description="View your competitive match history and stats"
        icon="📊"
        onClick={() => onNavigate('matches')}
        buttonText="View Matches"
        badge="Stats"
        badgeColor="blue"
      />
      
      <AdminActionCard
        title="Forum Activity"
        description="Participate in community discussions"
        icon="💭"
        onClick={() => onNavigate('forums')}
        buttonText="Join Discussion"
        badge="Community"
        badgeColor="purple"
      />
    </>
  );
}

export default { AdminWidgets, ModeratorWidgets, UserWidgets };