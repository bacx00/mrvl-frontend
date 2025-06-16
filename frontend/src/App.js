import React, { useState, useEffect } from 'react';
import { AuthProvider, ThemeProvider, useAuth, useTheme } from './hooks';
import Navigation from './components/Navigation';
import AuthModal from './components/AuthModal';

// Import all page components
import HomePage from './components/pages/HomePage';
import NewsPage from './components/pages/NewsPage';
import NewsDetailPage from './components/pages/NewsDetailPage';
import MatchesPage from './components/pages/MatchesPage';
import MatchDetailPage from './components/pages/MatchDetailPage';
import TeamsPage from './components/pages/TeamsPage';
import TeamDetailPage from './components/pages/TeamDetailPage';
import PlayersPage from './components/pages/PlayersPage';
import PlayerDetailPage from './components/pages/PlayerDetailPage';
import RankingsPage from './components/pages/RankingsPage';
import EventsPage from './components/pages/EventsPage';
import EventDetailPage from './components/pages/EventDetailPage';
import ForumsPage from './components/pages/ForumsPage';
import ThreadDetailPage from './components/pages/ThreadDetailPage';
import CreateThreadPage from './components/pages/CreateThreadPage';
import UserDashboard from './components/pages/UserDashboard';
import StatsPage from './components/pages/StatsPage';
import SearchPage from './components/pages/SearchPage';
import Footer from './components/Footer';

// Footer pages
import ContactPage from './components/pages/footer/ContactPage';
import PrivacyPage from './components/pages/footer/PrivacyPage';
import TermsPage from './components/pages/footer/TermsPage';
import CareersPage from './components/pages/footer/CareersPage';

// Import Admin Components
import RoleBasedDashboard from './components/RoleBasedDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import TeamForm from './components/admin/TeamForm';
import PlayerForm from './components/admin/PlayerForm';
import UserForm from './components/admin/UserForm';
import AdminNews from './components/admin/AdminNews';
import AdminEvents from './components/admin/AdminEvents';
import AdminForums from './components/admin/AdminForums';
import NewsForm from './components/admin/NewsForm';
import EventForm from './components/admin/EventForm';
import MatchForm from './components/admin/MatchForm';

import './App.css';

// FIXED: Complete routing with CreateThreadPage implemented
const ROUTES = {
  'home': HomePage,
  'news': NewsPage,
  'news-detail': NewsDetailPage,
  'matches': MatchesPage,
  'match-detail': MatchDetailPage,
  'teams': TeamsPage,
  'team-detail': TeamDetailPage,
  'players': PlayersPage,
  'player-detail': PlayerDetailPage,
  'rankings': RankingsPage,
  'events': EventsPage,
  'event-detail': EventDetailPage,
  'forums': ForumsPage,
  'thread-detail': ThreadDetailPage,
  'create-thread': CreateThreadPage, // FIXED: Now uses real CreateThreadPage component
  'user-dashboard': UserDashboard,
  'stats': StatsPage,
  'search': SearchPage,
  
  // Admin Routes - Complete and working
  'admin-dashboard': AdminDashboard,
  'admin-team-create': (props) => <TeamForm {...props} />,
  'admin-team-edit': (props) => <TeamForm {...props} teamId={props.params?.id} />,
  'admin-player-create': (props) => <PlayerForm {...props} />,
  'admin-player-edit': (props) => <PlayerForm {...props} playerId={props.params?.id} />,
  'admin-user-create': (props) => <UserForm {...props} />,
  'admin-user-edit': (props) => <UserForm {...props} userId={props.params?.id} />,
  'admin-news': AdminNews,
  'admin-news-create': (props) => <NewsForm {...props} />,
  'admin-news-edit': (props) => <NewsForm {...props} newsId={props.params?.id} />,
  'admin-events': AdminEvents,
  'admin-event-create': (props) => <EventForm {...props} />,
  'admin-event-edit': (props) => <EventForm {...props} eventId={props.params?.id} />,
  'admin-match-create': (props) => <MatchForm {...props} />,
  'admin-match-edit': (props) => <MatchForm {...props} matchId={props.params?.id} />,
  'admin-forums': AdminForums,
  
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
  const { user, loading } = useAuth();
  const { theme } = useTheme();

  // FIXED: Hash routing support - single event handler
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove #
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
      } else {
        // Empty hash means home
        setCurrentPage('home');
        setPageParams({});
      }
    };

    // Handle initial page load from hash
    handleHashChange();

    // Listen for hash changes (includes back/forward button)
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
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

  // Navigation handler with history support
  const navigateTo = (page, params = {}) => {
    console.log('🧭 Navigating to:', page, params);
    setCurrentPage(page);
    setPageParams(params);
    
    // Update URL hash
    if (page === 'home') {
      window.location.hash = '';
    } else {
      const hashUrl = params.id ? `${page}/${params.id}` : page;
      window.location.hash = hashUrl;
    }
    
    window.scrollTo(0, 0);
  };

  // Handle authentication modal
  const handleAuthClick = () => {
    console.log('🔑 App.js: Auth button clicked from navigation');
    setShowAuthModal(true);
  };

  const handleAuthClose = () => {
    console.log('🔑 App.js: Auth modal closed');
    setShowAuthModal(false);
  };

  // FIXED: Admin access - REMOVED demo credentials
  const renderPageComponent = () => {
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
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 via-purple-600 to-blue-600">
        <div className="text-center">
          <div className="text-4xl font-bold mb-4 text-white animate-pulse">MRVL</div>
          <div className="text-white/80 font-medium">Loading Marvel Rivals Esports...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-all duration-300">
      {/* Navigation */}
      <Navigation 
        currentPage={currentPage}
        navigateTo={navigateTo}
        onAuthClick={handleAuthClick}
        user={user}
        theme={theme}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {renderPageComponent()}
      </main>

      {/* Footer */}
      <Footer navigateTo={navigateTo} />

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
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;