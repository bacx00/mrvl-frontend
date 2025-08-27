import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme } from './hooks';
import { ActivityStatsProvider } from './contexts/ActivityStatsContext';
import Navigation from './components/Navigation';
import MobileNavigation from './components/mobile/MobileNavigation';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Footer from './components/Footer';
import Breadcrumbs from './components/shared/Breadcrumbs';
import './App.css';

// Loading Component with mobile-optimized skeleton
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
      <p className="text-gray-400">Loading...</p>
    </div>
  </div>
);

// Lazy load all page components with proper error boundaries
const HomePage = lazy(() => import('./components/pages/HomePage'));
const NewsPage = lazy(() => import('./components/pages/NewsPage'));
const NewsDetailPage = lazy(() => import('./components/pages/NewsDetailPage'));
const MatchesPage = lazy(() => import('./components/pages/MatchesPage'));
const MatchDetailPage = lazy(() => import('./components/pages/MatchDetailPage'));
const TeamsPage = lazy(() => import('./components/pages/TeamsPage'));
const TeamDetailPage = lazy(() => import('./components/pages/TeamDetailPage'));
const PlayersPage = lazy(() => import('./components/pages/PlayersPage'));
const PlayerDetailPage = lazy(() => import('./components/pages/PlayerDetailPage'));
const FreeAgentsPage = lazy(() => import('./components/pages/FreeAgentsPage'));
const RankingsPage = lazy(() => import('./components/pages/RankingsPage'));
const EventsPage = lazy(() => import('./components/pages/EventsPage'));
const EventDetailPage = lazy(() => import('./components/pages/EventDetailPage'));
const TournamentsPage = lazy(() => import('./components/pages/TournamentsPage'));
const TournamentDetailPage = lazy(() => import('./components/pages/TournamentDetailPage'));
const ForumsPage = lazy(() => import('./components/pages/ForumsPage'));
const ThreadDetailPage = lazy(() => import('./components/pages/ThreadDetailPage'));
const CreateThreadPage = lazy(() => import('./components/pages/CreateThreadPage'));
const UserDashboard = lazy(() => import('./components/pages/UserDashboard'));
const SimpleUserProfile = lazy(() => import('./components/pages/SimpleUserProfile'));
const StatsPage = lazy(() => import('./components/pages/StatsPage'));
const SearchPage = lazy(() => import('./components/pages/SearchPage'));
const TestPage = lazy(() => import('./components/pages/TestPage'));
const PasswordReset = lazy(() => import('./components/pages/PasswordReset'));

// Footer pages - lazy load as they're rarely accessed
const ContactPage = lazy(() => import('./components/pages/footer/ContactPage'));
const PrivacyPage = lazy(() => import('./components/pages/footer/PrivacyPage'));
const TermsPage = lazy(() => import('./components/pages/footer/TermsPage'));
const CareersPage = lazy(() => import('./components/pages/footer/CareersPage'));

// Status Page
const StatusPage = lazy(() => import('./pages/status/StatusPage'));

// Admin Components - lazy load as they're only for admins
const RoleBasedDashboard = lazy(() => import('./components/RoleBasedDashboard'));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard'));
const TeamForm = lazy(() => import('./components/admin/TeamForm'));
const PlayerForm = lazy(() => import('./components/admin/PlayerForm'));
const UserForm = lazy(() => import('./components/admin/UserForm'));
const AdminNews = lazy(() => import('./components/admin/AdminNews'));
const AdminEvents = lazy(() => import('./components/admin/AdminEvents'));
const AdminForums = lazy(() => import('./components/admin/AdminForums'));
const NewsFormSimple = lazy(() => import('./components/admin/NewsFormSimple'));
const ForumThreadForm = lazy(() => import('./components/admin/ForumThreadForm'));
const EventForm = lazy(() => import('./components/admin/EventForm'));
const MatchForm = lazy(() => import('./components/admin/MatchForm'));
const UnifiedLiveScoring = lazy(() => import('./components/admin/UnifiedLiveScoring'));

// Create route components with Suspense wrapper
const createRouteComponent = (Component) => (props) => (
  <Suspense fallback={<PageLoader />}>
    <Component {...props} />
  </Suspense>
);

// Route configuration with lazy-loaded components
const ROUTES = {
  'home': createRouteComponent(HomePage),
  'news': createRouteComponent(NewsPage),
  'news-detail': createRouteComponent(NewsDetailPage),
  'matches': createRouteComponent(MatchesPage),
  'match-detail': (props) => (
    <Suspense fallback={<PageLoader />}>
      <MatchDetailPage {...props} matchId={props.params?.id || props.id} />
    </Suspense>
  ),
  'team-detail': createRouteComponent(TeamDetailPage),
  'players': createRouteComponent(PlayersPage),
  'player-detail': createRouteComponent(PlayerDetailPage),
  'free-agents': createRouteComponent(FreeAgentsPage),
  'rankings': createRouteComponent(RankingsPage),
  'events': createRouteComponent(EventsPage),
  'event-detail': createRouteComponent(EventDetailPage),
  'tournaments': createRouteComponent(TournamentsPage),
  'tournament-detail': createRouteComponent(TournamentDetailPage),
  'forums': createRouteComponent(ForumsPage),
  'thread-detail': createRouteComponent(ThreadDetailPage),
  'create-thread': createRouteComponent(CreateThreadPage),
  'user-dashboard': createRouteComponent(UserDashboard),
  'user-profile': createRouteComponent(SimpleUserProfile),
  'stats': createRouteComponent(StatsPage),
  'search': createRouteComponent(SearchPage),
  'test': createRouteComponent(TestPage),
  'reset-password': createRouteComponent(PasswordReset),
  
  // Admin Routes - Lazy loaded
  'admin-dashboard': createRouteComponent(AdminDashboard),
  'admin-team-create': (props) => (
    <Suspense fallback={<PageLoader />}>
      <TeamForm {...props} />
    </Suspense>
  ),
  'admin-team-edit': (props) => (
    <Suspense fallback={<PageLoader />}>
      <TeamForm {...props} teamId={props.params?.id} />
    </Suspense>
  ),
  'admin-player-create': (props) => (
    <Suspense fallback={<PageLoader />}>
      <PlayerForm {...props} />
    </Suspense>
  ),
  'admin-player-edit': (props) => (
    <Suspense fallback={<PageLoader />}>
      <PlayerForm {...props} playerId={props.params?.id} />
    </Suspense>
  ),
  'admin-user-create': (props) => (
    <Suspense fallback={<PageLoader />}>
      <UserForm {...props} />
    </Suspense>
  ),
  'admin-user-edit': (props) => (
    <Suspense fallback={<PageLoader />}>
      <UserForm {...props} userId={props.params?.id} />
    </Suspense>
  ),
  'admin-news': createRouteComponent(AdminNews),
  'admin-news-create': (props) => (
    <Suspense fallback={<PageLoader />}>
      <NewsFormSimple {...props} />
    </Suspense>
  ),
  'admin-news-edit': (props) => (
    <Suspense fallback={<PageLoader />}>
      <NewsFormSimple {...props} newsId={props.params?.id} />
    </Suspense>
  ),
  'admin-events': createRouteComponent(AdminEvents),
  'admin-event-create': (props) => (
    <Suspense fallback={<PageLoader />}>
      <EventForm {...props} />
    </Suspense>
  ),
  'admin-event-edit': (props) => (
    <Suspense fallback={<PageLoader />}>
      <EventForm {...props} eventId={props.params?.id} />
    </Suspense>
  ),
  'admin-forums': createRouteComponent(AdminForums),
  'admin-forum-create': (props) => (
    <Suspense fallback={<PageLoader />}>
      <ForumThreadForm {...props} />
    </Suspense>
  ),
  'admin-forum-edit': (props) => (
    <Suspense fallback={<PageLoader />}>
      <ForumThreadForm {...props} threadId={props.params?.id} />
    </Suspense>
  ),
  'admin-match-create': (props) => (
    <Suspense fallback={<PageLoader />}>
      <MatchForm {...props} />
    </Suspense>
  ),
  'admin-match-edit': (props) => (
    <Suspense fallback={<PageLoader />}>
      <MatchForm {...props} matchId={props.params?.id} />
    </Suspense>
  ),
  'admin-live-scoring': (props) => (
    <Suspense fallback={<PageLoader />}>
      <UnifiedLiveScoring {...props} matchId={props.params?.id} />
    </Suspense>
  ),
  
  // Footer pages - lazy loaded
  'contact': createRouteComponent(ContactPage),
  'privacy': createRouteComponent(PrivacyPage),
  'terms': createRouteComponent(TermsPage),
  'careers': createRouteComponent(CareersPage),
  'status': createRouteComponent(StatusPage),
};

// Preload critical routes based on user behavior
const preloadRoute = (routeName) => {
  switch(routeName) {
    case 'home':
      import('./components/pages/HomePage');
      break;
    case 'matches':
      import('./components/pages/MatchesPage');
      break;
    case 'news':
      import('./components/pages/NewsPage');
      break;
    case 'teams':
      import('./components/pages/TeamsPage');
      break;
    case 'players':
      import('./components/pages/PlayersPage');
      break;
    default:
      break;
  }
};

// Main App component
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [viewParams, setViewParams] = useState({});
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth >= 768 && window.innerWidth < 1024);

  // Listen for resize events to detect mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload commonly accessed routes
  useEffect(() => {
    // Preload critical routes after initial render
    const timer = setTimeout(() => {
      if (currentView === 'home') {
        preloadRoute('matches');
        preloadRoute('news');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentView]);

  const navigate = useCallback((view, params = {}) => {
    setCurrentView(view);
    setViewParams(params);
    
    // Scroll to top on navigation
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Close mobile sidebar on navigation
    if (isMobile) {
      setSidebarOpen(false);
    }
    
    // Preload next likely routes
    setTimeout(() => {
      if (view === 'matches') {
        preloadRoute('match-detail');
      } else if (view === 'teams') {
        preloadRoute('team-detail');
      }
    }, 1000);
  }, [isMobile]);

  const CurrentComponent = ROUTES[currentView] || ROUTES['home'];
  
  // Mobile optimization: Use intersection observer for lazy loading images
  useEffect(() => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.classList.remove('lazy');
              observer.unobserve(img);
            }
          }
        });
      });

      const images = document.querySelectorAll('img.lazy');
      images.forEach(img => imageObserver.observe(img));

      return () => {
        images.forEach(img => imageObserver.unobserve(img));
      };
    }
  }, [currentView]);

  // Performance monitoring for mobile
  useEffect(() => {
    if ('performance' in window && 'PerformanceObserver' in window) {
      try {
        const perfObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'largest-contentful-paint') {
              console.log('LCP:', entry.startTime);
              // Send to analytics if needed
            }
          }
        });
        perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        return () => perfObserver.disconnect();
      } catch (e) {
        // PerformanceObserver not supported
      }
    }
  }, []);

  return (
    <div className="app">
      <ErrorBoundary>
        {isMobile ? (
          <MobileNavigation 
            navigate={navigate} 
            currentView={currentView}
            setAuthModalOpen={setAuthModalOpen}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        ) : (
          <Navigation 
            navigate={navigate} 
            currentView={currentView}
            setAuthModalOpen={setAuthModalOpen}
          />
        )}
        
        <main className={`main-content ${isMobile ? 'mobile' : ''} ${isTablet ? 'tablet' : ''}`}>
          <Breadcrumbs currentView={currentView} navigate={navigate} />
          
          <ErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
            <CurrentComponent 
              navigate={navigate} 
              {...viewParams} 
              params={viewParams}
              isMobile={isMobile}
              isTablet={isTablet}
            />
          </ErrorBoundary>
        </main>
        
        {!isMobile && <Footer navigate={navigate} />}
        
        {authModalOpen && (
          <AuthModal 
            isOpen={authModalOpen} 
            onClose={() => setAuthModalOpen(false)} 
          />
        )}
      </ErrorBoundary>
    </div>
  );
}

// Export wrapped App with providers
export default function AppWithProviders() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <ActivityStatsProvider>
            <App />
          </ActivityStatsProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}