import React, { Suspense, lazy, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { usePreloader, useConnectionAwareLoading } from './PerformanceOptimizations';
import { hapticFeedback } from './MobileGestures';

// Loading skeleton components for different page types
const PageSkeleton = ({ type = 'default' }) => {
  const skeletons = {
    default: (
      <div className="animate-pulse p-4 space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
        </div>
      </div>
    ),
    
    list: (
      <div className="animate-pulse p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    ),
    
    detail: (
      <div className="animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
        <div className="p-4 space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    ),
    
    bracket: (
      <div className="animate-pulse p-4">
        <div className="grid grid-cols-2 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg h-20"></div>
          ))}
        </div>
      </div>
    )
  };
  
  return skeletons[type] || skeletons.default;
};

// Error boundary for route loading
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Route loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Page Failed to Load
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {this.state.error?.message || 'Something went wrong loading this page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors touch-optimized"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Dynamic route imports with code splitting
const routeMap = {
  // Home and main pages
  home: () => import('../pages/HomePage'),
  events: () => import('../pages/EventsPage'), 
  event: () => import('../pages/EventDetailPage'),
  matches: () => import('../pages/MatchesPage'),
  match: () => import('../pages/MatchDetailPage'),
  teams: () => import('../pages/TeamsPage'),
  team: () => import('../pages/TeamDetailPage'),
  players: () => import('../pages/PlayersPage'),
  player: () => import('../pages/PlayerDetailPage'),
  rankings: () => import('../pages/RankingsPage'),
  news: () => import('../pages/NewsPage'),
  article: () => import('../pages/NewsDetailPage'),
  forums: () => import('../pages/ForumsPage'),
  thread: () => import('../pages/ThreadDetailPage'),
  profile: () => import('../pages/UserProfile'),
  
  // Admin pages (heavier components)
  admin: () => import('../pages/AdminDashboard'),
  'admin/events': () => import('../components/admin/AdminEvents'),
  'admin/matches': () => import('../components/admin/AdminMatches'),
  'admin/teams': () => import('../components/admin/AdminTeams'),
  'admin/players': () => import('../components/admin/AdminPlayers'),
  'admin/scoring': () => import('../components/admin/ComprehensiveLiveScoring')
};

// Preload routes based on user behavior
export const RoutePreloader = () => {
  const location = useLocation();
  const { preloadRoute } = usePreloader();
  const { shouldPreload } = useConnectionAwareLoading();

  useEffect(() => {
    if (!shouldPreload) return;

    // Preload likely next routes based on current route
    const preloadMap = {
      '/': ['/events', '/matches', '/rankings'],
      '/events': ['/matches', '/teams'],
      '/matches': ['/events', '/teams'],
      '/teams': ['/players', '/matches'],
      '/players': ['/teams', '/rankings'],
      '/rankings': ['/teams', '/players'],
      '/news': ['/events', '/forums'],
      '/forums': ['/news', '/profile']
    };

    const routesToPreload = preloadMap[location.pathname] || [];
    routesToPreload.forEach(route => {
      setTimeout(() => preloadRoute(route), 2000); // Delay preload
    });
  }, [location.pathname, preloadRoute, shouldPreload]);

  return null;
};

// Mobile-optimized route component
export const MobileRoute = ({ 
  path, 
  component: ComponentName, 
  skeleton = 'default',
  critical = false 
}) => {
  const [loadError, setLoadError] = useState(false);
  const { shouldPreload } = useConnectionAwareLoading();
  
  // Create lazy component
  const LazyComponent = lazy(async () => {
    try {
      const module = await routeMap[ComponentName]?.();
      if (!module) throw new Error(`Route "${ComponentName}" not found`);
      return module;
    } catch (error) {
      setLoadError(true);
      throw error;
    }
  });

  const LoadingFallback = () => (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PageSkeleton type={skeleton} />
    </div>
  );

  if (loadError) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load Page
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This page couldn't be loaded. Please check your connection and try again.
          </p>
          <button
            onClick={() => {
              setLoadError(false);
              hapticFeedback.light();
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors touch-optimized"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <RouteErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <LazyComponent />
      </Suspense>
    </RouteErrorBoundary>
  );
};

// Route transition manager
export const useRouteTransition = () => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsTransitioning(true);
    hapticFeedback.light();
    
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return { isTransitioning };
};

// Critical resource loader
export const CriticalResourceLoader = ({ children }) => {
  const [criticalLoaded, setCriticalLoaded] = useState(false);
  const { preloadImages } = usePreloader();

  useEffect(() => {
    const loadCriticalResources = async () => {
      try {
        // Load critical images
        const criticalImages = [
          '/favicon.svg',
          '/images/mrvl-logo.png',
          '/images/hero-bg.webp'
        ];

        await preloadImages(criticalImages);
        
        // Load critical fonts (already preconnected in HTML)
        if ('fonts' in document) {
          await document.fonts.ready;
        }

        setCriticalLoaded(true);
      } catch (error) {
        console.warn('Some critical resources failed to load:', error);
        setCriticalLoaded(true); // Continue anyway
      }
    };

    loadCriticalResources();
  }, [preloadImages]);

  if (!criticalLoaded) {
    return (
      <div className="fixed inset-0 bg-[#0f0f23] flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <div className="text-white text-lg font-medium">Loading MRVL...</div>
          <div className="text-gray-400 text-sm mt-2">Optimizing for your device</div>
        </div>
      </div>
    );
  }

  return children;
};

// Intelligent prefetch based on user interaction
export const useIntelligentPrefetch = () => {
  const { preloadRoute } = usePreloader();
  const { shouldPreload } = useConnectionAwareLoading();
  
  useEffect(() => {
    if (!shouldPreload) return;

    let hoverTimer;
    let touchTimer;

    const handleMouseEnter = (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      hoverTimer = setTimeout(() => {
        const href = link.getAttribute('href');
        if (href.startsWith('/')) {
          preloadRoute(href);
        }
      }, 100); // Short delay for intentional hovers
    };

    const handleMouseLeave = () => {
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    };

    const handleTouchStart = (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      touchTimer = setTimeout(() => {
        const href = link.getAttribute('href');
        if (href.startsWith('/')) {
          preloadRoute(href);
        }
      }, 50); // Very short delay for touch
    };

    const handleTouchEnd = () => {
      if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
      }
    };

    document.addEventListener('mouseenter', handleMouseEnter, true);
    document.addEventListener('mouseleave', handleMouseLeave, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('mouseenter', handleMouseEnter, true);
      document.removeEventListener('mouseleave', handleMouseLeave, true);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      
      if (hoverTimer) clearTimeout(hoverTimer);
      if (touchTimer) clearTimeout(touchTimer);
    };
  }, [preloadRoute, shouldPreload]);
};

export default {
  RoutePreloader,
  MobileRoute,
  useRouteTransition,
  CriticalResourceLoader,
  useIntelligentPrefetch,
  PageSkeleton
};