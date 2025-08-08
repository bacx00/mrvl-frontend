import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Home, Calendar, Trophy, Users, Menu, X, Search, 
  ChevronRight, Bell, Settings, LogOut, User, Shield,
  TrendingUp, MessageSquare, Newspaper, BarChart3, ChevronLeft,
  Filter, Grid, List, Zap, Star, BookOpen
} from 'lucide-react';
import { useAuth } from '../../hooks';
import UserAvatar from '../common/UserAvatar';
import { useSwipeGesture, hapticFeedback } from './MobileGestures';

// VLR.gg-style Mobile Navigation with Enhanced UX and Performance
export const MobileNavigation = ({ currentPage, navigateTo, user }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [quickFilters, setQuickFilters] = useState([]);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const { logout, isAdmin } = useAuth();

  // Close menu when page changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [currentPage]);

  // Focus search when opened
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Enhanced search with debouncing and suggestions
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      hapticFeedback.light();
      navigateTo('search', { query: searchQuery.trim() });
      setSearchQuery('');
      setShowSearch(false);
      setSearchSuggestions([]);
    }
  }, [searchQuery, navigateTo]);

  // Debounced search suggestions
  const handleSearchInput = useCallback((value) => {
    setSearchQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length > 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        // Mock search suggestions - replace with actual API call
        const suggestions = [
          { type: 'team', name: 'Sentinels', icon: Users },
          { type: 'event', name: 'VCT Masters', icon: Trophy },
          { type: 'match', name: 'SEN vs FNC', icon: Calendar }
        ].filter(item => 
          item.name.toLowerCase().includes(value.toLowerCase())
        );
        setSearchSuggestions(suggestions);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchSuggestions([]);
      setIsSearching(false);
    }
  }, []);

  const handleLogout = useCallback(() => {
    hapticFeedback.medium();
    logout();
    setIsMenuOpen(false);
    navigateTo('home');
  }, [logout, navigateTo]);

  // Swipe gesture for page navigation
  const handleSwipeLeft = useCallback(() => {
    const currentIndex = mainNavItems.findIndex(item => item.id === currentPage);
    if (currentIndex < mainNavItems.length - 1) {
      hapticFeedback.light();
      navigateTo(mainNavItems[currentIndex + 1].id);
    }
  }, [currentPage, navigateTo]);

  const handleSwipeRight = useCallback(() => {
    const currentIndex = mainNavItems.findIndex(item => item.id === currentPage);
    if (currentIndex > 0) {
      hapticFeedback.light();
      navigateTo(mainNavItems[currentIndex - 1].id);
    }
  }, [currentPage, navigateTo]);

  // Page swipe gesture hook
  const { elementRef: pageSwipeRef } = useSwipeGesture(
    handleSwipeLeft, 
    handleSwipeRight, 
    100
  );

  // Main navigation items
  const mainNavItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'matches', icon: Calendar, label: 'Matches' },
    { id: 'events', icon: Trophy, label: 'Events' },
    { id: 'teams', icon: Users, label: 'Teams' },
    { id: 'rankings', icon: BarChart3, label: 'Rankings' }
  ];

  // Secondary navigation items
  const secondaryNavItems = [
    { id: 'news', icon: Newspaper, label: 'News' },
    { id: 'forums', icon: MessageSquare, label: 'Forums' },
    { id: 'stats', icon: TrendingUp, label: 'Stats' }
  ];

  return (
    <>
      {/* Mobile Header - Enhanced VLR.gg style with better backdrop */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 z-50 transition-all duration-200">
        <div className="flex items-center justify-between h-16 px-4 mobile-safe-area">
          {/* Logo - Enhanced VLR.gg style */}
          <button 
            onClick={() => navigateTo('home')}
            className="flex items-center space-x-2 touch-target touch-optimized rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors px-2 py-1 -ml-2"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <div className="flex flex-col items-start">
              <span className="font-bold text-lg leading-none text-gray-900 dark:text-white">MRVL</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 leading-none">Esports</span>
            </div>
          </button>

          {/* Right Actions - Enhanced VLR.gg style with better mobile UX */}
          <div className="flex items-center space-x-1">
            {/* Search Toggle - Improved visibility and feedback */}
            <button
              onClick={() => setShowSearch(!showSearch)}
              className={`touch-target touch-optimized p-3 rounded-xl transition-all duration-300 transform ${
                showSearch 
                  ? 'bg-red-500 text-white shadow-lg scale-105' 
                  : 'hover:bg-gray-100/70 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-400 hover:scale-105'
              }`}
              aria-label="Search"
            >
              <Search className={`w-5 h-5 transition-transform duration-200 ${showSearch ? 'rotate-90' : ''}`} />
            </button>

            {/* Notifications */}
            {user && (
              <button
                onClick={() => navigateTo('notifications')}
                className="touch-target touch-optimized p-3 rounded-xl hover:bg-gray-100/70 dark:hover:bg-gray-800/70 transition-all duration-200 relative text-gray-600 dark:text-gray-400"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              </button>
            )}

            {/* Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`touch-target touch-optimized p-3 rounded-xl transition-all duration-200 ${
                isMenuOpen
                  ? 'bg-red-500 text-white shadow-lg rotate-90'
                  : 'hover:bg-gray-100/70 dark:hover:bg-gray-800/70 text-gray-600 dark:text-gray-400'
              }`}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search Bar - Enhanced VLR.gg style with advanced functionality */}
        <div className={`overflow-hidden transition-all duration-300 border-t border-gray-200 dark:border-gray-700 ${
          showSearch ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-4 py-3">
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
              <div className="relative bg-gradient-to-r from-gray-100/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-700/80 rounded-xl backdrop-blur-sm border border-gray-200/50 dark:border-gray-600/50 focus-within:border-red-300 focus-within:ring-1 focus-within:ring-red-500/20 transition-all duration-200">
                <input
                  ref={searchInputRef}
                  type="search"
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  placeholder="Search teams, players, events, matches..."
                  className="w-full px-12 py-3.5 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none mobile-input-no-zoom"
                  autoComplete="off"
                  spellCheck="false"
                />
                <Search className="absolute left-4 top-4 w-4 h-4 text-gray-400" />
                <div className="absolute right-2 top-2 flex space-x-1">
                  {searchQuery && (
                    <button
                      type="submit"
                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-xs"
                    >
                      Go
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setShowSearch(false); setSearchQuery(''); }}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {isSearching && (
                  <div className="absolute right-12 top-4">
                    <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              
              {/* Search Suggestions */}
              {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-b-xl shadow-xl z-10 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSearchQuery(suggestion.name);
                          handleSearch();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <Icon className="w-4 h-4 text-gray-400" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {suggestion.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                            {suggestion.type}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </form>
          </div>
        </div>
      </header>

      {/* Bottom Navigation - Enhanced VLR.gg style with safe area and swipe detection */}
      <nav 
        ref={pageSwipeRef}
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 z-50 touch-optimized"
      >
        <div className="mobile-safe-area">
          <div className="grid grid-cols-5 min-h-16">
            {mainNavItems.map(item => {
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    hapticFeedback.light();
                    navigateTo(item.id);
                  }}
                  className={`touch-target touch-optimized flex flex-col items-center justify-center space-y-1 py-3 px-1 transition-all duration-200 relative transform-gpu ${
                    isActive 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-red-500 rounded-b-full"></div>
                  )}
                  
                  <div className={`p-2 rounded-xl transition-all duration-200 transform-gpu ${
                    isActive 
                      ? 'bg-red-50 dark:bg-red-900/20 scale-110' 
                      : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  
                  <span className={`text-xs font-medium transition-all duration-200 ${
                    isActive ? 'font-semibold' : ''
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu Panel with Spring Animation */}
          <div className="lg:hidden fixed inset-y-0 right-0 w-full max-w-sm bg-white dark:bg-gray-900 shadow-xl z-50 overflow-y-auto transform animate-slide-in-right">
            {/* Menu Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* User Section */}
            {user ? (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    navigateTo('user-profile', { id: user.id });
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center space-x-3 w-full"
                >
                  <UserAvatar user={user} size="md" />
                  <div className="flex-1 text-left">
                    <div className="font-semibold">{user.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">View Profile</div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            ) : (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    navigateTo('login');
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Navigation Sections */}
            <div className="p-4">
              {/* Main Navigation */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Main
                </h3>
                <div className="space-y-1">
                  {mainNavItems.map(item => (
                    <MenuButton
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={currentPage === item.id}
                      onClick={() => {
                        navigateTo(item.id);
                        setIsMenuOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Navigation */}
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Community
                </h3>
                <div className="space-y-1">
                  {secondaryNavItems.map(item => (
                    <MenuButton
                      key={item.id}
                      icon={item.icon}
                      label={item.label}
                      active={currentPage === item.id}
                      onClick={() => {
                        navigateTo(item.id);
                        setIsMenuOpen(false);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* User Actions */}
              {user && (
                <div className="mb-6">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    Account
                  </h3>
                  <div className="space-y-1">
                    {isAdmin() && (
                      <MenuButton
                        icon={Shield}
                        label="Admin Dashboard"
                        onClick={() => {
                          navigateTo('admin-dashboard');
                          setIsMenuOpen(false);
                        }}
                      />
                    )}
                    <MenuButton
                      icon={Settings}
                      label="Settings"
                      onClick={() => {
                        navigateTo('settings');
                        setIsMenuOpen(false);
                      }}
                    />
                    <MenuButton
                      icon={LogOut}
                      label="Sign Out"
                      onClick={handleLogout}
                      className="text-red-500 dark:text-red-400"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>© 2025 MRVL. All rights reserved.</p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Menu Button Component
const MenuButton = ({ icon: Icon, label, active, onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-3 w-full px-3 py-2.5 rounded-lg transition-colors ${
        active 
          ? 'bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400' 
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${className}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default MobileNavigation;