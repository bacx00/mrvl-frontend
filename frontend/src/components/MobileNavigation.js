import React, { useState, useEffect } from 'react';
import { useAuth, useTheme } from '../hooks';
import UserAvatar from './common/UserAvatar';
import { getRoleNavigation, getDashboardRoute, hasRole, ROLES } from '../utils/roleUtils';
import RoleBadge from './common/RoleBadge';

function MobileNavigation({ currentPage, navigateTo, onAuthClick }) {
  const { user, logout, api } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // VLR.gg style bottom navigation items
  const bottomNavItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'matches', icon: '⚔️', label: 'Matches' },
    { id: 'events', icon: '🏆', label: 'Events' },
    { id: 'rankings', icon: '📊', label: 'Rankings' },
    { id: 'menu', icon: '☰', label: 'More' }
  ];

  // Main navigation sections for drawer
  const drawerSections = [
    {
      title: 'Competition',
      items: [
        { id: 'matches', label: 'Matches', icon: '⚔️' },
        { id: 'events', label: 'Events', icon: '🏆' },
        { id: 'tournaments', label: 'Tournaments', icon: '🎮' },
        { id: 'rankings', label: 'Rankings', icon: '📊' }
      ]
    },
    {
      title: 'Teams & Players',
      items: [
        { id: 'teams', label: 'Teams', icon: '👥', path: 'teams' },
        { id: 'players', label: 'Players', icon: '🎮' },
        { id: 'free-agents', label: 'Free Agents', icon: '🔓' },
        { id: 'stats', label: 'Statistics', icon: '📈' }
      ]
    },
    {
      title: 'Community',
      items: [
        { id: 'news', label: 'News', icon: '📰' },
        { id: 'forums', label: 'Forums', icon: '💬' }
      ]
    }
  ];

  // Handle bottom navigation clicks
  const handleBottomNav = (itemId) => {
    if (itemId === 'menu') {
      setIsDrawerOpen(true);
    } else {
      navigateTo(itemId);
      setActiveTab(itemId);
    }
  };

  // Handle drawer navigation
  const handleDrawerNav = (itemId) => {
    navigateTo(itemId);
    setIsDrawerOpen(false);
    setActiveTab(itemId);
  };

  // Close drawer on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isDrawerOpen && !e.target.closest('.mobile-drawer') && !e.target.closest('.bottom-nav-item')) {
        setIsDrawerOpen(false);
      }
    };

    if (isDrawerOpen) {
      document.addEventListener('click', handleOutsideClick);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  // Perform search
  const performSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      // Search implementation similar to main Navigation
      const results = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(results.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      {/* VLR.gg style mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 h-14">
          {/* Logo */}
          <div 
            onClick={() => handleDrawerNav('home')}
            className="flex items-center space-x-2"
          >
            <span className="text-2xl font-bold text-red-500">MRVL</span>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {/* User menu or login */}
            {user ? (
              <div className="relative">
                <UserAvatar
                  user={user}
                  size="sm"
                  onClick={() => setIsDrawerOpen(true)}
                  className="cursor-pointer"
                />
              </div>
            ) : (
              <button
                onClick={onAuthClick}
                className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium"
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Search bar - expandable */}
        <div className="px-4 pb-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              placeholder="Search teams, players, matches..."
              className="w-full px-10 py-2 bg-gray-100 dark:bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <span className="absolute left-3 top-2.5 text-gray-500">🔍</span>
            {isSearching && (
              <span className="absolute right-3 top-2.5 text-gray-500">⏳</span>
            )}
          </div>
        </div>
      </header>

      {/* Side drawer - VLR.gg style */}
      <div className={`mobile-drawer fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-in-out ${
        isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:hidden shadow-2xl`}>
        
        {/* Drawer header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Navigation</h2>
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              ✕
            </button>
          </div>

          {/* User info if logged in */}
          {user && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center space-x-3">
                <UserAvatar user={user} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <RoleBadge user={user} />
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={() => {
                    handleDrawerNav('user-dashboard');
                  }}
                  className="flex-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    setIsDrawerOpen(false);
                  }}
                  className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer content */}
        <div className="overflow-y-auto h-full pb-20">
          {drawerSections.map((section) => (
            <div key={section.title} className="border-b border-gray-200 dark:border-gray-800">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {section.title}
              </h3>
              <div className="py-1">
                {section.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleDrawerNav(item.id)}
                    className={`w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      currentPage === item.id ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : ''
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                    {currentPage === item.id && (
                      <span className="ml-auto text-red-500">●</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Admin section if applicable */}
          {user && hasRole(user, ROLES.ADMIN) && (
            <div className="border-b border-gray-200 dark:border-gray-800">
              <h3 className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administration
              </h3>
              <div className="py-1">
                <button
                  onClick={() => handleDrawerNav('admin-dashboard')}
                  className="w-full px-4 py-3 flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="text-xl">⚙️</span>
                  <span className="font-medium">Admin Dashboard</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isDrawerOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* VLR.gg style bottom navigation bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-bottom">
        <div className="flex justify-around items-center h-16">
          {bottomNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleBottomNav(item.id)}
              className={`bottom-nav-item flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                activeTab === item.id ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Spacer for fixed bottom nav */}
      <div className="lg:hidden h-16" />
    </>
  );
}

export default MobileNavigation;