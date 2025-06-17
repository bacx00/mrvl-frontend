import React, { useState, useRef, useEffect } from 'react';
import { useAuth, useTheme } from '../hooks';

function Navigation({ currentPage, navigateTo, onAuthClick, user: propUser }) {
  const { user: contextUser, logout, isAdmin, api } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // LIVE SEARCH DROPDOWN STATE
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Use user from context or prop (for flexibility)
  const user = contextUser || propUser;

  // CRITICAL FIX: Ensure all navigation functions work properly
  const handleNavigationClick = (page, params = {}) => {
    console.log(`🧭 Navigation: Navigating to ${page}`, params);
    
    if (!navigateTo || typeof navigateTo !== 'function') {
      console.error('❌ Navigation: navigateTo function not available');
      alert('Navigation error: Page navigation is not available. Please refresh and try again.');
      return;
    }
    
    try {
      navigateTo(page, params);
      setIsMobileMenuOpen(false); // Close mobile menu after navigation
    } catch (error) {
      console.error('❌ Navigation: Navigation failed:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = () => {
    console.log('🚪 Navigation: User logging out');
    try {
      if (logout && typeof logout === 'function') {
        logout();
        setIsMobileMenuOpen(false);
        // Navigate to home after logout
        handleNavigationClick('home');
      } else {
        console.error('❌ Navigation: Logout function not available');
        alert('Logout failed. Please refresh the page.');
      }
    } catch (error) {
      console.error('❌ Navigation: Logout error:', error);
      alert('Logout failed. Please try again.');
    }
  };

  // LIVE SEARCH FUNCTIONALITY
  const performLiveSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setIsSearching(true);
    
    try {
      console.log('🔍 Live search for:', query);
      
      // Parallel fetch from all backend endpoints for comprehensive search
      const [teamsRes, playersRes, eventsRes, matchesRes, forumsRes, newsRes] = await Promise.allSettled([
        api.get('/teams'),
        api.get('/players'), 
        api.get('/events'),
        api.get('/matches'),
        api.get('/forums/threads'),
        api.get('/news')
      ]);
      
      const searchTerm = query.toLowerCase();
      const results = [];
      
      // Process teams
      if (teamsRes.status === 'fulfilled') {
        const teams = teamsRes.value?.data?.data || teamsRes.value?.data || [];
        teams.filter(team => 
          team.name?.toLowerCase().includes(searchTerm) ||
          team.short_name?.toLowerCase().includes(searchTerm)
        ).slice(0, 3).forEach(team => {
          results.push({
            id: team.id,
            type: 'team',
            title: team.name,
            subtitle: team.short_name,
            icon: '👥',
            data: team
          });
        });
      }
      
      // Process players
      if (playersRes.status === 'fulfilled') {
        const players = playersRes.value?.data?.data || playersRes.value?.data || [];
        players.filter(player =>
          player.name?.toLowerCase().includes(searchTerm) ||
          player.username?.toLowerCase().includes(searchTerm)
        ).slice(0, 3).forEach(player => {
          results.push({
            id: player.id,
            type: 'player',
            title: player.name || player.username,
            subtitle: player.team_name || 'Free Agent',
            icon: '🎮',
            data: player
          });
        });
      }
      
      // Process matches
      if (matchesRes.status === 'fulfilled') {
        const matches = matchesRes.value?.data?.data || matchesRes.value?.data || [];
        matches.filter(match =>
          match.team1?.name?.toLowerCase().includes(searchTerm) ||
          match.team2?.name?.toLowerCase().includes(searchTerm)
        ).slice(0, 2).forEach(match => {
          results.push({
            id: match.id,
            type: 'match',
            title: `${match.team1?.name} vs ${match.team2?.name}`,
            subtitle: match.event?.name || 'Match',
            icon: '⚔️',
            data: match
          });
        });
      }
      
      // Process events
      if (eventsRes.status === 'fulfilled') {
        const events = eventsRes.value?.data?.data || eventsRes.value?.data || [];
        events.filter(event =>
          event.name?.toLowerCase().includes(searchTerm)
        ).slice(0, 2).forEach(event => {
          results.push({
            id: event.id,
            type: 'event',
            title: event.name,
            subtitle: event.location || 'Tournament',
            icon: '🏆',
            data: event
          });
        });
      }
      
      // Process forum threads
      if (forumsRes.status === 'fulfilled') {
        const threads = forumsRes.value?.data?.data || forumsRes.value?.data || [];
        threads.filter(thread =>
          thread.title?.toLowerCase().includes(searchTerm)
        ).slice(0, 2).forEach(thread => {
          results.push({
            id: thread.id,
            type: 'forum',
            title: thread.title,
            subtitle: `by ${thread.user_name || 'Anonymous'}`,
            icon: '💬',
            data: thread
          });
        });
      }
      
      setSearchResults(results.slice(0, 10)); // Limit to 10 total results
      setShowDropdown(results.length > 0);
      
    } catch (error) {
      console.error('❌ Live search error:', error);
      setSearchResults([]);
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performLiveSearch(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search result click
  const handleResultClick = (result) => {
    console.log('🔗 Search result clicked:', result);
    
    switch (result.type) {
      case 'team':
        handleNavigationClick('team-detail', { id: result.id });
        break;
      case 'player':
        handleNavigationClick('player-detail', { id: result.id });
        break;
      case 'match':
        handleNavigationClick('match-detail', { id: result.id });
        break;
      case 'event':
        handleNavigationClick('event-detail', { id: result.id });
        break;
      case 'forum':
        handleNavigationClick('thread-detail', { id: result.id });
        break;
      case 'news':
        handleNavigationClick('news-detail', { id: result.id });
        break;
      default:
        break;
    }
    
    setShowDropdown(false);
    setSearchQuery('');
  };

  const handleAuthClick = () => {
    console.log('🔑 Navigation: Auth button clicked');
    if (onAuthClick && typeof onAuthClick === 'function') {
      onAuthClick();
    } else {
      console.error('❌ Navigation: onAuthClick function not available');
      alert('Authentication modal is not available. Please refresh the page.');
    }
  };

  const handleThemeToggle = () => {
    console.log('🎨 Navigation: Theme toggle clicked');
    try {
      if (toggleTheme && typeof toggleTheme === 'function') {
        toggleTheme();
      } else {
        console.error('❌ Navigation: toggleTheme function not available');
      }
    } catch (error) {
      console.error('❌ Navigation: Theme toggle error:', error);
    }
  };

  const handleDashboardClick = () => {
    console.log('📊 Navigation: Dashboard button clicked, user role check:', { 
      isAdmin: isAdmin() || false, 
      user: user?.role || 'none' 
    });
    
    try {
      const dashboardPage = isAdmin() ? 'admin-dashboard' : 'user-dashboard';
      handleNavigationClick(dashboardPage);
    } catch (error) {
      console.error('❌ Navigation: Dashboard navigation error:', error);
      alert('Dashboard access failed. Please try again.');
    }
  };

  // FIXED: Remove news from navigation per requirements
  const navigationItems = [
    { id: 'forums', label: 'Forums' },
    { id: 'matches', label: 'Matches' },
    { id: 'events', label: 'Events' },
    { id: 'rankings', label: 'Rankings' }
  ];

  return (
    <nav className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo Section - Far Left */}
          <div className="flex-shrink-0">
            <div 
              className="cursor-pointer group"
              onClick={() => handleNavigationClick('home')}
            >
              <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                MRVL
              </div>
            </div>
          </div>

          {/* Centered Navigation - VLR.gg style */}
          <div className="hidden lg:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              {navigationItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavigationClick(item.id)}
                  className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    currentPage === item.id
                      ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Bar - VLR.gg style */}
            <div className="hidden md:flex items-center">
              <div className="relative w-48">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={handleSearch}
                  className="w-full px-3 py-1.5 pl-8 pr-3 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
                <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-1.5 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors h-8 w-8 flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* User Section */}
            {user ? (
              <div className="flex items-center space-x-2">
                {/* Dashboard Link */}
                <button
                  onClick={handleDashboardClick}
                  className={`px-2 py-1.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    ['user-dashboard', 'admin-dashboard'].includes(currentPage)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
                  }`}
                >
                  Dashboard
                </button>

                {/* User Profile - Compact */}
                <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                  <div className="w-5 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <div className="hidden sm:block">
                    <div className="text-xs font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  aria-label="Logout"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthClick}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded text-sm transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="lg:hidden p-1.5 rounded text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors h-8 w-8 flex items-center justify-center"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              className="w-full px-3 py-2 pl-8 pr-3 text-sm bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500"
            />
            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu - FIXED: All buttons work properly */}
      {isMobileMenuOpen && (
        <div className="lg:hidden">
          <div className="px-4 pt-2 pb-4 space-y-1 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">
            {navigationItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleNavigationClick(item.id)}
                className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                  currentPage === item.id
                    ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                    : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {item.label}
              </button>
            ))}
            
            {user && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                  <button
                    onClick={handleDashboardClick}
                    className={`w-full text-left px-3 py-2 text-sm font-medium transition-colors ${
                      ['user-dashboard', 'admin-dashboard'].includes(currentPage)
                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
            
            {!user && (
              <div className="border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
                <button
                  onClick={handleAuthClick}
                  className="w-full text-left px-3 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navigation;