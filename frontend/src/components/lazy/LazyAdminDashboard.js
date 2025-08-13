import React, { lazy, Suspense } from 'react';

/**
 * Lazy-loaded Admin Dashboard - Code Splitting for Performance
 * CRITICAL: Only loads admin components when needed, reduces initial bundle size
 */

const AdminDashboard = lazy(() => import('../admin/AdminDashboard'));
const AdminOverview = lazy(() => import('../admin/AdminOverview'));
const AdminTeams = lazy(() => import('../admin/AdminTeams'));
const AdminPlayers = lazy(() => import('../admin/AdminPlayers'));
const AdminMatches = lazy(() => import('../admin/AdminMatches'));
const AdminEvents = lazy(() => import('../admin/AdminEvents'));
const AdminUsers = lazy(() => import('../admin/AdminUsers'));
const AdminNews = lazy(() => import('../admin/AdminNews'));
const AdminForums = lazy(() => import('../admin/AdminForums'));

// Loading fallback component optimized for mobile
const AdminLoadingFallback = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mb-4"></div>
      <div className="text-gray-600 dark:text-gray-400">Loading Admin Dashboard...</div>
    </div>
  </div>
);

// Lazy Admin Dashboard wrapper
const LazyAdminDashboard = (props) => (
  <Suspense fallback={<AdminLoadingFallback />}>
    <AdminDashboard {...props} />
  </Suspense>
);

// Export individual lazy components for dynamic imports
export {
  LazyAdminDashboard as default,
  AdminLoadingFallback
};

// Export lazy components for granular loading
export const LazyAdminComponents = {
  Overview: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminOverview {...props} />
    </Suspense>
  )),
  Teams: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminTeams {...props} />
    </Suspense>
  )),
  Players: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminPlayers {...props} />
    </Suspense>
  )),
  Matches: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminMatches {...props} />
    </Suspense>
  )),
  Events: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminEvents {...props} />
    </Suspense>
  )),
  Users: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminUsers {...props} />
    </Suspense>
  )),
  News: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminNews {...props} />
    </Suspense>
  )),
  Forums: React.memo((props) => (
    <Suspense fallback={<div className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>}>
      <AdminForums {...props} />
    </Suspense>
  ))
};