// Lazy loading utility for code splitting
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '../components/optimized/OptimizedComponents';

// Lazy load heavy components to reduce initial bundle size
export const LazyHomePage = lazy(() => import('../components/pages/HomePage'));
export const LazyMatchDetailPage = lazy(() => import('../components/pages/MatchDetailPage'));
export const LazyNewsPage = lazy(() => import('../components/pages/NewsPage'));
export const LazyPlayersPage = lazy(() => import('../components/pages/PlayersPage'));
export const LazyTeamsPage = lazy(() => import('../components/pages/TeamsPage'));
export const LazyPlayerDetailPage = lazy(() => import('../components/pages/PlayerDetailPage'));
export const LazyPlayerProfilePage = lazy(() => import('../components/pages/PlayerProfilePage'));
export const LazyThreadDetailPage = lazy(() => import('../components/pages/ThreadDetailPage'));
export const LazyAdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));

// Mobile optimized lazy components
export const LazyMobileFastHomePage = lazy(() => import('../components/mobile/MobileFastHomePage'));
export const LazyMobileFastMatchDetail = lazy(() => import('../components/mobile/MobileFastMatchDetail'));

// Lazy load admin components (heavy and only used by admins)
export const LazyAdminTeams = lazy(() => import('../components/admin/AdminTeams'));
export const LazyAdminUsers = lazy(() => import('../components/admin/AdminUsers'));
export const LazyEventForm = lazy(() => import('../components/admin/EventForm'));
export const LazyNewsFormSimple = lazy(() => import('../components/admin/NewsFormSimple'));
export const LazyUnifiedLiveScoring = lazy(() => import('../components/admin/UnifiedLiveScoring'));

// Create wrapper component with loading fallback
export const withLazyLoading = (Component, fallback = <LoadingSpinner />) => {
  return (props) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
};

// Preload components based on user role and navigation patterns
export const preloadComponents = {
  // Preload common components for all users
  home: () => import('../components/pages/HomePage'),
  matches: () => import('../components/pages/MatchDetailPage'),
  news: () => import('../components/pages/NewsPage'),
  
  // Preload mobile components if mobile detected
  mobileFast: () => import('../components/mobile/MobileFastHomePage'),
  
  // Preload admin components if user is admin
  admin: () => {
    return Promise.all([
      import('../components/admin/AdminDashboard'),
      import('../components/admin/AdminTeams'),
      import('../components/admin/AdminUsers')
    ]);
  }
};

// Dynamic import with error handling
export const dynamicImport = async (componentPath) => {
  try {
    const module = await import(componentPath);
    return module.default || module;
  } catch (error) {
    console.error(`Failed to load component: ${componentPath}`, error);
    // Return a fallback component
    return () => (
      <div className="p-4 text-center text-red-500">
        Failed to load component. Please refresh the page.
      </div>
    );
  }
};

// Route-based code splitting
export const routeComponents = {
  '/': withLazyLoading(LazyHomePage),
  '/home': withLazyLoading(LazyHomePage),
  '/matches/:id': withLazyLoading(LazyMatchDetailPage),
  '/news': withLazyLoading(LazyNewsPage),
  '/news/:id': withLazyLoading(LazyNewsPage),
  '/players': withLazyLoading(LazyPlayersPage),
  '/players/:id': withLazyLoading(LazyPlayerDetailPage),
  '/teams': withLazyLoading(LazyTeamsPage),
  '/profile': withLazyLoading(LazyPlayerProfilePage),
  '/forums/:id': withLazyLoading(LazyThreadDetailPage),
  '/admin': withLazyLoading(LazyAdminDashboard),
};

// Mobile-specific route components
export const mobileRouteComponents = {
  '/': withLazyLoading(LazyMobileFastHomePage),
  '/home': withLazyLoading(LazyMobileFastHomePage),
  '/matches/:id': withLazyLoading(LazyMobileFastMatchDetail),
  // Other routes fall back to regular lazy components
  '/news': withLazyLoading(LazyNewsPage),
  '/players': withLazyLoading(LazyPlayersPage),
  '/teams': withLazyLoading(LazyTeamsPage),
};

// Preload strategy based on user behavior
export class ComponentPreloader {
  constructor() {
    this.preloadedComponents = new Set();
    this.preloadTimeout = null;
  }

  // Preload component after user hovers or focuses on navigation
  schedulePreload(componentKey, delay = 300) {
    if (this.preloadedComponents.has(componentKey)) return;
    
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
    }
    
    this.preloadTimeout = setTimeout(() => {
      this.preload(componentKey);
    }, delay);
  }

  // Cancel scheduled preload if user moves away
  cancelPreload() {
    if (this.preloadTimeout) {
      clearTimeout(this.preloadTimeout);
      this.preloadTimeout = null;
    }
  }

  // Actually preload the component
  async preload(componentKey) {
    if (this.preloadedComponents.has(componentKey)) return;
    
    try {
      if (preloadComponents[componentKey]) {
        await preloadComponents[componentKey]();
        this.preloadedComponents.add(componentKey);
        console.debug(`Preloaded component: ${componentKey}`);
      }
    } catch (error) {
      console.error(`Failed to preload component: ${componentKey}`, error);
    }
  }

  // Preload based on current route and user role
  preloadForRoute(currentRoute, userRole) {
    // Always preload home if not current
    if (currentRoute !== '/' && currentRoute !== '/home') {
      this.schedulePreload('home', 1000);
    }

    // Preload admin components if user is admin
    if (userRole === 'admin') {
      this.schedulePreload('admin', 500);
    }

    // Preload commonly accessed components
    if (currentRoute === '/') {
      this.schedulePreload('matches', 2000);
      this.schedulePreload('news', 2500);
    }
  }
}

export const componentPreloader = new ComponentPreloader();