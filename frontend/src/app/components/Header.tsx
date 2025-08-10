// src/components/Header.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useSearch } from '@/context/SearchContext';
import { useNotifications } from '@/context/NotificationContext';
import { ROUTES, COLORS } from '@/lib/constants';
import { debounce } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUtils';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSpoilers, setShowSpoilers] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme, getThemeLabel } = useTheme();
  const { 
    query, 
    suggestions, 
    setQuery, 
    search, 
    clearSearch,
    isSearching 
  } = useSearch();
  const { unreadCount } = useNotifications();
  
  const pathname = usePathname();
  const router = useRouter();

  // Handle scroll for sticky header effect
  useEffect(() => {
    const handleScroll = debounce(() => {
      setIsScrolled(window.scrollY > 10);
    }, 16);

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      
      if (!searchInputRef.current?.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search submission
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      await search(query);
      router.push(`/search?q=${encodeURIComponent(query)}`);
      setIsSearchFocused(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    search(suggestion);
    router.push(`/search?q=${encodeURIComponent(suggestion)}`);
    setIsSearchFocused(false);
  };

  // Check if route is active
  const isActiveRoute = (route: string): boolean => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header 
      className={`sticky top-0 z-50 bg-[#1a2332] border-b border-[#2b3d4d] transition-all duration-200 ${
        isScrolled ? 'shadow-lg backdrop-blur-sm' : ''
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link 
              href={ROUTES.HOME} 
              className="flex items-center space-x-2 text-[#fa4454] font-bold text-xl hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-[#fa4454] rounded flex items-center justify-center">
                <span className="text-white font-black text-sm">M</span>
              </div>
              <span>MRVL</span>
            </Link>

            {/* Main Navigation - Desktop */}
            <nav className="hidden lg:flex items-center space-x-8">
              <NavLink href={ROUTES.FORUMS} active={isActiveRoute('/forums')}>
                Forums
              </NavLink>
              <NavLink href={ROUTES.MATCHES} active={isActiveRoute('/matches')}>
                Matches
              </NavLink>
              <NavLink href={ROUTES.EVENTS} active={isActiveRoute('/events')}>
                Events
              </NavLink>
              <NavLink href={ROUTES.RANKINGS} active={isActiveRoute('/rankings')}>
                Rankings
              </NavLink>
              <NavLink href={ROUTES.STATS} active={isActiveRoute('/stats')}>
                Stats
              </NavLink>
            </nav>
          </div>

          {/* Center - Search Bar */}
          <div className="hidden md:block flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search teams, players, matches..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  className="w-full bg-[#0f1419] border border-[#2b3d4d] rounded-md px-4 py-2 pl-10 text-white text-sm placeholder-[#768894] focus:outline-none focus:border-[#fa4454] focus:ring-1 focus:ring-[#fa4454] transition-colors"
                  data-search-input
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-[#fa4454] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Search Suggestions Dropdown */}
              {isSearchFocused && (suggestions.length > 0 || query.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a2332] border border-[#2b3d4d] rounded-md shadow-lg overflow-hidden z-50">
                  {suggestions.length > 0 ? (
                    <div className="py-2">
                      <div className="px-3 py-1 text-xs text-[#768894] uppercase tracking-wide">
                        Suggestions
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-[#20303d] transition-colors"
                        >
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {suggestion}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : query.length > 0 && (
                    <div className="px-3 py-4 text-center text-sm text-[#768894]">
                      Press Enter to search for "{query}"
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>

          {/* Right Side - Controls & User */}
          <div className="flex items-center space-x-4">
            
            {/* Theme Toggle - VLR.gg Style */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex items-center space-x-1 text-xs font-semibold"
            >
              <span className="text-[#768894]">Night:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                theme === 'dark' 
                  ? 'bg-[#fa4454] text-white' 
                  : 'bg-[#2b3d4d] text-[#768894]'
              }`}>
                {theme === 'dark' ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Spoilers Toggle */}
            <button
              onClick={() => setShowSpoilers(!showSpoilers)}
              className="hidden md:flex items-center space-x-1 text-xs font-semibold"
            >
              <span className="text-[#768894]">Spoilers:</span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                showSpoilers 
                  ? 'bg-[#fa4454] text-white' 
                  : 'bg-[#2b3d4d] text-[#768894]'
              }`}>
                {showSpoilers ? 'ON' : 'HIDDEN'}
              </span>
            </button>

            {/* Notifications Bell */}
            {user && (
              <Link 
                href="/notifications"
                className="relative p-2 text-[#768894] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-3.5-3.5a50.002 50.002 0 00-2.72-2.72m0 0A50.002 50.002 0 01.22 15l3.5 3.5h5m-5-5l5-5m0 0l5 5" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#fa4454] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu / Login */}
            {isLoading ? (
              <div className="w-8 h-8 bg-[#2b3d4d] rounded animate-pulse"></div>
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded hover:bg-[#20303d] transition-colors"
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.username}
                      width={32}
                      height={32}
                      className="rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getImageUrl(null, 'player-avatar');
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="hidden lg:block text-sm text-white font-medium">
                    {user.username}
                  </span>
                  <svg 
                    className={`w-4 h-4 text-[#768894] transition-transform ${
                      isUserMenuOpen ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1a2332] border border-[#2b3d4d] rounded-md shadow-lg overflow-hidden z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 border-b border-[#2b3d4d]">
                        <div className="text-sm font-medium text-white">{user.username}</div>
                        <div className="text-xs text-[#768894] capitalize">{user.role}</div>
                      </div>
                      
                      <Link
                        href={ROUTES.PROFILE}
                        className="block px-4 py-2 text-sm text-white hover:bg-[#20303d] transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Profile
                        </span>
                      </Link>
                      
                      <Link
                        href={ROUTES.SETTINGS}
                        className="block px-4 py-2 text-sm text-white hover:bg-[#20303d] transition-colors"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Settings
                        </span>
                      </Link>

                      {(user.role === 'admin' || user.role === 'editor') && (
                        <Link
                          href={ROUTES.ADMIN}
                          className="block px-4 py-2 text-sm text-white hover:bg-[#20303d] transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Admin Panel
                          </span>
                        </Link>
                      )}

                      <div className="border-t border-[#2b3d4d] mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-[#fa4454] hover:bg-[#20303d] transition-colors"
                        >
                          <span className="flex items-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Log Out
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-3">
                <Link
                  href={ROUTES.LOGIN}
                  className="text-sm text-[#768894] hover:text-white transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href={ROUTES.REGISTER}
                  className="px-3 py-1.5 bg-[#fa4454] hover:bg-[#e03e4e] text-white text-sm font-medium rounded transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-[#768894] hover:text-white transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg 
                className={`w-6 h-6 transition-transform ${isMobileMenuOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-[#2b3d4d] py-4">
            <div className="space-y-4">
              
              {/* Mobile Search */}
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-[#0f1419] border border-[#2b3d4d] rounded-md px-4 py-2 pl-10 text-white text-sm placeholder-[#768894] focus:outline-none focus:border-[#fa4454]"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <svg className="w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </form>

              {/* Mobile Navigation */}
              <nav className="space-y-1">
                <MobileNavLink href={ROUTES.FORUMS} active={isActiveRoute('/forums')} onClick={() => setIsMobileMenuOpen(false)}>
                  Forums
                </MobileNavLink>
                <MobileNavLink href={ROUTES.MATCHES} active={isActiveRoute('/matches')} onClick={() => setIsMobileMenuOpen(false)}>
                  Matches
                </MobileNavLink>
                <MobileNavLink href={ROUTES.EVENTS} active={isActiveRoute('/events')} onClick={() => setIsMobileMenuOpen(false)}>
                  Events
                </MobileNavLink>
                <MobileNavLink href={ROUTES.RANKINGS} active={isActiveRoute('/rankings')} onClick={() => setIsMobileMenuOpen(false)}>
                  Rankings
                </MobileNavLink>
                <MobileNavLink href={ROUTES.STATS} active={isActiveRoute('/stats')} onClick={() => setIsMobileMenuOpen(false)}>
                  Stats
                </MobileNavLink>
              </nav>

              {/* Mobile Controls */}
              <div className="flex items-center justify-between py-2 border-t border-[#2b3d4d]">
                <span className="text-sm text-[#768894]">Night Mode</span>
                <button
                  onClick={toggleTheme}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    theme === 'dark' 
                      ? 'bg-[#fa4454] text-white' 
                      : 'bg-[#2b3d4d] text-[#768894]'
                  }`}
                >
                  {theme === 'dark' ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-[#768894]">Spoilers</span>
                <button
                  onClick={() => setShowSpoilers(!showSpoilers)}
                  className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                    showSpoilers 
                      ? 'bg-[#fa4454] text-white' 
                      : 'bg-[#2b3d4d] text-[#768894]'
                  }`}
                >
                  {showSpoilers ? 'ON' : 'HIDDEN'}
                </button>
              </div>

              {/* Mobile User Section */}
              {user ? (
                <div className="border-t border-[#2b3d4d] pt-4 space-y-2">
                  <div className="flex items-center space-x-3 pb-2">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.username}
                        width={32}
                        height={32}
                        className="rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl(null, 'player-avatar');
                        }}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-white">
                          {user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-white">{user.username}</div>
                      <div className="text-xs text-[#768894] capitalize">{user.role}</div>
                    </div>
                  </div>
                  
                  <MobileNavLink href={ROUTES.PROFILE} onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </MobileNavLink>
                  
                  <MobileNavLink href={ROUTES.SETTINGS} onClick={() => setIsMobileMenuOpen(false)}>
                    Settings
                  </MobileNavLink>

                  {(user.role === 'admin' || user.role === 'editor') && (
                    <MobileNavLink href={ROUTES.ADMIN} onClick={() => setIsMobileMenuOpen(false)}>
                      Admin Panel
                    </MobileNavLink>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full text-left py-2 text-sm text-[#fa4454] hover:bg-[#20303d] px-3 rounded transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="border-t border-[#2b3d4d] pt-4 space-y-2">
                  <Link
                    href={ROUTES.LOGIN}
                    className="block py-2 text-sm text-white hover:bg-[#20303d] px-3 rounded transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log In
                  </Link>
                  <Link
                    href={ROUTES.REGISTER}
                    className="block py-2 px-3 bg-[#fa4454] hover:bg-[#e03e4e] text-white text-sm font-medium rounded transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// Navigation Link Component
function NavLink({ 
  href, 
  active, 
  children 
}: { 
  href: string; 
  active: boolean; 
  children: React.ReactNode; 
}) {
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors relative ${
        active 
          ? 'text-[#fa4454]' 
          : 'text-white hover:text-[#fa4454]'
      }`}
    >
      {children}
      {active && (
        <div className="absolute -bottom-4 left-0 right-0 h-0.5 bg-[#fa4454]"></div>
      )}
    </Link>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({ 
  href, 
  active, 
  children, 
  onClick 
}: { 
  href: string; 
  active?: boolean; 
  children: React.ReactNode; 
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`block py-2 px-3 text-sm font-medium rounded transition-colors ${
        active 
          ? 'text-[#fa4454] bg-[#20303d]' 
          : 'text-white hover:bg-[#20303d] hover:text-[#fa4454]'
      }`}
    >
      {children}
    </Link>
  );
}
