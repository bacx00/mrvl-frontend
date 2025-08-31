import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme } from './hooks';
import { ActivityStatsProvider } from './contexts/ActivityStatsContext';
import Navigation from './components/Navigation';
import MobileNavigation from './components/mobile/MobileNavigation';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Footer from './components/Footer';
import Breadcrumbs from './components/shared/Breadcrumbs';

// Direct imports - no lazy loading
import HomePage from './components/pages/HomePage';
import NewsPage from './components/pages/NewsPage';
import NewsDetailPage from './components/pages/NewsDetailPage';
import MatchesPage from './components/pages/MatchesPage';
import MatchDetailPage from './components/pages/MatchDetailPage';
import TeamsPage from './components/pages/TeamsPage';
import TeamDetailPage from './components/pages/TeamDetailPage';
import PlayersPage from './components/pages/PlayersPage';
import PlayerDetailPage from './components/pages/PlayerDetailPage';
import FreeAgentsPage from './components/pages/FreeAgentsPage';
import RankingsPage from './components/pages/RankingsPage';
import EventsPage from './components/pages/EventsPage';
import EventDetailPage from './components/pages/EventDetailPage';
import TournamentsPage from './components/pages/TournamentsPage';
import TournamentDetailPage from './components/pages/TournamentDetailPage';
import ForumsPage from './components/pages/ForumsPage';
import ThreadDetailPage from './components/pages/ThreadDetailPage';
import CreateThreadPage from './components/pages/CreateThreadPage';
import UserDashboard from './components/pages/UserDashboard';
import SimpleUserProfile from './components/pages/SimpleUserProfile';
import StatsPage from './components/pages/StatsPage';
import SearchPage from './components/pages/SearchPage';
import TestPage from './components/pages/TestPage';
import PasswordReset from './components/pages/PasswordReset';

// Footer pages
import ContactPage from './components/pages/footer/ContactPage';
import PrivacyPage from './components/pages/footer/PrivacyPage';
import TermsPage from './components/pages/footer/TermsPage';
import CareersPage from './components/pages/footer/CareersPage';

// Status Page
import StatusPage from './pages/status/StatusPage';

// Admin Components
import RoleBasedDashboard from './components/RoleBasedDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import TeamForm from './components/admin/TeamForm';
import PlayerForm from './components/admin/PlayerForm';
import UserForm from './components/admin/UserForm';
import AdminNews from './components/admin/AdminNews';
import AdminEvents from './components/admin/AdminEvents';
import AdminForums from './components/admin/AdminForums';
import NewsFormSimple from './components/admin/NewsFormSimple';
import ForumThreadForm from './components/admin/ForumThreadForm';
import EventForm from './components/admin/EventForm';
import MatchForm from './components/admin/MatchForm';
import UnifiedLiveScoring from './components/admin/UnifiedLiveScoring';

import './App.css';

// Import mobile optimizations and service worker
import { register as registerSW, swManager } from './utils/serviceWorker';
import VLRMobileFeatures from './utils/vlrMobileFeatures';

// FIXED: Complete routing with CreateThreadPage implemented
const ROUTES = {
  'home': HomePage,
  'news': NewsPage,
  'news-detail': NewsDetailPage,
  'matches': MatchesPage,
  'match-detail': (props) => <MatchDetailPage {...props} matchId={props.params?.id || props.id} />,
  'team-detail': TeamDetailPage,
  'players': PlayersPage,
  'player-detail': PlayerDetailPage,
  'free-agents': FreeAgentsPage,
  'rankings': RankingsPage,
  'events': EventsPage,
  'event-detail': EventDetailPage,
  'tournaments': TournamentsPage,
  'tournament-detail': TournamentDetailPage,
  'forums': ForumsPage,
  'thread-detail': ThreadDetailPage,
  'create-thread': CreateThreadPage,
  'user-dashboard': UserDashboard,
  'user-profile': SimpleUserProfile,
  'stats': StatsPage,
  'search': SearchPage,
  'test': TestPage,
  'reset-password': PasswordReset,
  
  // Admin Routes - Complete and working
  'admin-dashboard': AdminDashboard,
  'admin-team-create': (props) => <TeamForm {...props} />,
  'admin-team-edit': (props) => <TeamForm {...props} teamId={props.params?.id} />,
  'admin-player-create': (props) => <PlayerForm {...props} />,
  'admin-player-edit': (props) => <PlayerForm {...props} playerId={props.params?.id} />,
  'admin-user-create': (props) => <UserForm {...props} />,
  'admin-user-edit': (props) => <UserForm {...props} userId={props.params?.id} />,
  'admin-news': AdminNews,
  'admin-news-create': (props) => <NewsFormSimple {...props} />,
  'admin-news-edit': (props) => <NewsFormSimple {...props} newsId={props.params?.id} />,
  'admin-events': AdminEvents,
  'admin-event-create': (props) => <EventForm {...props} />,
  'admin-event-edit': (props) => <EventForm {...props} eventId={props.params?.id} />,
  'admin-match-create': (props) => <MatchForm {...props} />,
  'admin-match-edit': (props) => <MatchForm {...props} matchId={props.params?.id} />,
  'admin-live-scoring': (props) => <UnifiedLiveScoring {...props} />,
  'admin-forums': AdminForums,
  'admin-forum-create': (props) => <ForumThreadForm {...props} />,
  'admin-forum-edit': (props) => <ForumThreadForm {...props} params={props.params} />,
  'admin-forum-categories': AdminForums,
  'admin-news-categories': AdminNews,
  
  // Footer pages
  'contact': ContactPage,
  'privacy': PrivacyPage,
  'terms': TermsPage,
  'careers': CareersPage,
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageParams, setPageParams] = useState({});
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();
  const { theme } = useTheme();

  // Detect mobile/tablet viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // FIXED: Hash routing support + URL pathname routing for reset password
  useEffect(() => {
    const handleRouting = () => {
      const hash = window.location.hash.slice(1); // Remove #
      const pathname = window.location.pathname;
      const hostname = window.location.hostname;
      
      // Check if we're on status subdomain - don't override with home page
      if (hostname === 'status.mrvl.net' || hostname === 'status.localhost') {
        // Don't change the page if already set to status
        if (currentPage !== 'status') {
          setCurrentPage('status');
          setPageParams({});
        }
        return;
      }
      
      // Handle direct URL routes like /reset-password
      if (pathname === '/reset-password' && window.location.search) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const email = urlParams.get('email');
        
        if (token && email) {
          console.log('🔗 Direct reset password URL detected');
          setCurrentPage('reset-password');
          setPageParams({ token, email });
          return;
        }
      }
      
      // Handle hash-based routing
      if (hash) {
        const [routeName, ...paramParts] = hash.split('/');
        if (ROUTES[routeName]) {
          const params = {};
          if (paramParts.length > 0) {
            params.id = paramParts[0]; // Simple ID parameter support
          }
          console.log('🔗 Hash route detected:', routeName, params);
          setCurrentPage(routeName);
          setPageParams(params);
        }
      } else if (pathname === '/') {
        // Root path means home
        setCurrentPage('home');
        setPageParams({});
      }
    };

    // Handle initial page load
    handleRouting();

    // Listen for hash changes (includes back/forward button)
    window.addEventListener('hashchange', handleRouting);
    
    return () => {
      window.removeEventListener('hashchange', handleRouting);
    };
  }, []);

  // FIXED: Listen for custom auth modal events from ForumsPage
  useEffect(() => {
    const handleShowAuthModal = () => {
      console.log('🔑 App.js: Received custom auth modal event');
      setShowAuthModal(true);
    };

    window.addEventListener('mrvl-show-auth-modal', handleShowAuthModal);
    
    return () => {
      window.removeEventListener('mrvl-show-auth-modal', handleShowAuthModal);
    };
  }, []);

  // Navigation handler with history support - memoized to prevent recreation
  const navigateTo = useCallback((page, params = {}) => {
    console.log('🧭 Navigating to:', page, params);
    setCurrentPage(page);
    
    // Handle different parameter formats
    let normalizedParams = params;
    if (typeof params === 'string' || typeof params === 'number') {
      // If params is just an ID, convert to object
      normalizedParams = { id: params };
    }
    
    setPageParams(normalizedParams);
    
    // Update URL hash
    if (page === 'home') {
      window.location.hash = '';
    } else {
      const hashUrl = normalizedParams.id ? `${page}/${normalizedParams.id}` : page;
      window.location.hash = hashUrl;
    }
    
    window.scrollTo(0, 0);
  }, []);

  // Handle authentication modal - memoized callbacks
  const handleAuthClick = useCallback(() => {
    console.log('🔑 App.js: Auth button clicked from navigation');
    setShowAuthModal(true);
  }, []);

  const handleAuthClose = useCallback(() => {
    console.log('🔑 App.js: Auth modal closed');
    setShowAuthModal(false);
  }, []);

  // Memoize the current page component to prevent re-creation
  const pageComponent = useMemo(() => {
    // Check if we're on status subdomain first
    const hostname = window.location.hostname;
    if (hostname === 'status.mrvl.net' || hostname === 'status.localhost') {
      return <StatusPage />;
    }
    
    const CurrentPageComponent = ROUTES[currentPage] || HomePage;
    
    // Check if this is an admin page
    const isAdminPage = currentPage.startsWith('admin-');
    
    if (isAdminPage && !user) {
      // For admin pages, show auth modal if not logged in
      return (
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Admin Access Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You need to be logged in as an administrator to access this page.
          </p>
          <div className="space-x-4">
            <button 
              onClick={() => setShowAuthModal(true)}
              className="btn bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
            >
              Login as Admin
            </button>
            <button 
              onClick={() => navigateTo('home')}
              className="btn border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }
    
    // FIXED: Pass navigateTo and params properly to all components
    return <CurrentPageComponent navigateTo={navigateTo} params={pageParams} onAuthClick={handleAuthClick} />;
  }, [currentPage, pageParams, user]); // Remove navigateTo and handleAuthClick from dependencies

  // Check if we're on status subdomain to hide navigation
  const isStatusSubdomain = window.location.hostname === 'status.mrvl.net' || window.location.hostname === 'status.localhost';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300">
      {/* Navigation - Use mobile version for smaller screens (hide on status subdomain) */}
      {!isStatusSubdomain && isMobile ? (
        <MobileNavigation 
          currentPage={currentPage}
          navigateTo={navigateTo}
          onAuthClick={handleAuthClick}
          user={user}
          theme={theme}
        />
      ) : !isStatusSubdomain ? (
        <Navigation 
          currentPage={currentPage}
          navigateTo={navigateTo}
          onAuthClick={handleAuthClick}
          user={user}
          theme={theme}
        />
      ) : null}

      {/* Breadcrumbs - Hide on mobile and status subdomain */}
      {!isMobile && !isStatusSubdomain && (
        <Breadcrumbs 
          currentPage={currentPage}
          pageParams={pageParams}
          navigateTo={navigateTo}
        />
      )}

      {/* Main Content - Mobile optimized */}
      <main className={`${isMobile ? 'mobile-content pt-16 pb-20' : 'container mx-auto px-4 py-6'}`}>
        {pageComponent}
      </main>

      {/* Footer - Hide on status subdomain */}
      {!isStatusSubdomain && <Footer navigateTo={navigateTo} />}

      {/* FIXED: Authentication Modal with proper state management */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={handleAuthClose}
        />
      )}
    </div>
  );
}

function App() {
  // Initialize mobile features and service worker
  useEffect(() => {
    // Register service worker for offline support
    registerSW({
      onSuccess: registration => {
        console.log('🚀 Service Worker registered successfully');
      },
      onUpdate: registration => {
        console.log('🔄 New version available, please reload');
      }
    });

    // Initialize service worker manager
    swManager.init();

    // Initialize VLR mobile features on mobile devices
    if (window.innerWidth < 768) {
      new VLRMobileFeatures();
    }
  }, []);

  return (
    <ErrorBoundary component="App">
      <ThemeProvider>
        <AuthProvider>
          <ActivityStatsProvider>
            <ErrorBoundary component="AppContent">
              <AppContent />
            </ErrorBoundary>
          </ActivityStatsProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;