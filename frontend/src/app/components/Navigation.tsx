// src/components/Navigation.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ROUTES } from '@/lib/constants';

interface NavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Navigation({ isOpen, onClose }: NavigationProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  // Handle swipe to close
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStart) return;
    
    const currentTouch = e.targetTouches[0].clientX;
    const diff = touchStart - currentTouch;
    
    // Swipe left to close (threshold: 100px)
    if (diff > 100) {
      onClose();
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overlayRef.current && event.target === overlayRef.current) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen && drawerRef.current) {
      const firstFocusableElement = drawerRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusableElement) {
        firstFocusableElement.focus();
      }
    }
  }, [isOpen]);

  const handleLinkClick = () => {
    onClose();
    setActiveSubmenu(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleSubmenu = (menu: string) => {
    setActiveSubmenu(activeSubmenu === menu ? null : menu);
  };

  const isActiveRoute = (route: string): boolean => {
    if (route === '/') return pathname === '/';
    return pathname.startsWith(route);
  };

  if (!isOpen) return null;

  return (
    <div 
      ref={overlayRef}
      className="fixed inset-0 z-50 lg:hidden"
      aria-hidden={!isOpen}
      role="dialog"
      aria-label="Navigation menu"
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-75 transition-opacity" />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed top-0 left-0 h-full w-80 max-w-[90vw] bg-[#1a2332] border-r border-[#2b3d4d] transform transition-transform duration-300 ease-in-out shadow-xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="flex flex-col h-full">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#2b3d4d]">
            <Link 
              href={ROUTES.HOME} 
              className="flex items-center space-x-2 text-[#fa4454] font-bold text-xl"
              onClick={handleLinkClick}
            >
              <div className="w-8 h-8 bg-[#fa4454] rounded flex items-center justify-center">
                <span className="text-white font-black text-sm">M</span>
              </div>
              <span>MRVL</span>
            </Link>
            
            <button
              onClick={onClose}
              className="p-2 text-[#768894] hover:text-white transition-colors rounded"
              aria-label="Close navigation"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Section */}
          {user && (
            <div className="p-4 border-b border-[#2b3d4d]">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-white">{user.username}</div>
                  <div className="text-xs text-[#768894] capitalize">{user.role}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Content */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-2">
              
              {/* Main Navigation */}
              <div className="space-y-1">
                <NavItem 
                  href={ROUTES.FORUMS} 
                  active={isActiveRoute('/forums')}
                  onClick={handleLinkClick}
                  hasSubmenu
                  onToggleSubmenu={() => toggleSubmenu('forums')}
                  isSubmenuOpen={activeSubmenu === 'forums'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Forums
                </NavItem>
                
                {/* Forums Submenu */}
                {activeSubmenu === 'forums' && (
                  <div className="ml-6 space-y-1">
                    <SubNavItem href="/forums/general" onClick={handleLinkClick}>
                      General Discussion
                    </SubNavItem>
                    <SubNavItem href="/forums/competitive" onClick={handleLinkClick}>
                      Competitive
                    </SubNavItem>
                    <SubNavItem href="/forums/patch-notes" onClick={handleLinkClick}>
                      Patch Notes
                    </SubNavItem>
                    <SubNavItem href="/forums/team-recruitment" onClick={handleLinkClick}>
                      Team Recruitment
                    </SubNavItem>
                  </div>
                )}

                <NavItem 
                  href={ROUTES.MATCHES} 
                  active={isActiveRoute('/matches')}
                  onClick={handleLinkClick}
                  hasSubmenu
                  onToggleSubmenu={() => toggleSubmenu('matches')}
                  isSubmenuOpen={activeSubmenu === 'matches'}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Matches
                </NavItem>

                {/* Matches Submenu */}
                {activeSubmenu === 'matches' && (
                  <div className="ml-6 space-y-1">
                    <SubNavItem href="/matches?status=live" onClick={handleLinkClick}>
                      Live Matches
                    </SubNavItem>
                    <SubNavItem href="/matches?status=upcoming" onClick={handleLinkClick}>
                      Upcoming
                    </SubNavItem>
                    <SubNavItem href="/matches?status=completed" onClick={handleLinkClick}>
                      Results
                    </SubNavItem>
                  </div>
                )}

                <NavItem 
                  href={ROUTES.EVENTS} 
                  active={isActiveRoute('/events')}
                  onClick={handleLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Events
                </NavItem>

                <NavItem 
                  href={ROUTES.RANKINGS} 
                  active={isActiveRoute('/rankings')}
                  onClick={handleLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Rankings
                </NavItem>

                <NavItem 
                  href={ROUTES.STATS} 
                  active={isActiveRoute('/stats')}
                  onClick={handleLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Statistics
                </NavItem>

                <NavItem 
                  href={ROUTES.NEWS} 
                  active={isActiveRoute('/news')}
                  onClick={handleLinkClick}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  News
                </NavItem>
              </div>

              {/* Divider */}
              <div className="border-t border-[#2b3d4d] my-4"></div>

              {/* User-specific items */}
              {user ? (
                <div className="space-y-1">
                  <NavItem 
                    href={ROUTES.PROFILE} 
                    active={isActiveRoute('/user/profile')}
                    onClick={handleLinkClick}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                  </NavItem>

                  <NavItem 
                    href={ROUTES.SETTINGS} 
                    active={isActiveRoute('/user/settings')}
                    onClick={handleLinkClick}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </NavItem>

                  {(user.role === 'admin' || user.role === 'editor') && (
                    <NavItem 
                      href={ROUTES.ADMIN} 
                      active={isActiveRoute('/admin')}
                      onClick={handleLinkClick}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Admin Panel
                    </NavItem>
                  )}
                </div>
              ) : (
                <div className="space-y-1">
                  <NavItem href={ROUTES.LOGIN} onClick={handleLinkClick}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Log In
                  </NavItem>

                  <NavItem href={ROUTES.REGISTER} onClick={handleLinkClick}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Sign Up
                  </NavItem>
                </div>
              )}
            </nav>
          </div>

          {/* Footer Controls */}
          <div className="border-t border-[#2b3d4d] p-4 space-y-3">
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#768894]">Night Mode</span>
              <button
                onClick={toggleTheme}
                className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:ring-offset-2 focus:ring-offset-[#1a2332] ${
                  theme === 'dark' ? 'bg-[#fa4454]' : 'bg-[#2b3d4d]'
                }`}
              >
                <span
                  className={`inline-block w-5 h-5 rounded-full bg-white transform transition-transform ${
                    theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Spoilers Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#768894]">Show Spoilers</span>
              <button
                className="relative w-12 h-6 rounded-full bg-[#fa4454] transition-colors focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:ring-offset-2 focus:ring-offset-[#1a2332]"
              >
                <span className="inline-block w-5 h-5 rounded-full bg-white transform transition-transform translate-x-6" />
              </button>
            </div>

            {/* Logout Button */}
            {user && (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 bg-[#2b3d4d] hover:bg-[#354c5f] text-[#fa4454] rounded transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation Item Component
function NavItem({ 
  href, 
  active = false, 
  children, 
  onClick,
  hasSubmenu = false,
  onToggleSubmenu,
  isSubmenuOpen = false
}: {
  href?: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  hasSubmenu?: boolean;
  onToggleSubmenu?: () => void;
  isSubmenuOpen?: boolean;
}) {
  const baseClasses = "flex items-center justify-between w-full p-3 rounded-lg text-left transition-colors min-h-[44px]";
  const activeClasses = active 
    ? "bg-[#20303d] text-[#fa4454] border border-[#fa4454]/20"
    : "text-white hover:bg-[#20303d] hover:text-[#fa4454]";

  const content = (
    <>
      <div className="flex items-center space-x-3">
        {children}
      </div>
      {hasSubmenu && (
        <svg 
          className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </>
  );

  if (hasSubmenu) {
    return (
      <div>
        <button
          onClick={onToggleSubmenu}
          className={`${baseClasses} ${activeClasses}`}
        >
          {content}
        </button>
        {href && (
          <Link
            href={href}
            onClick={onClick}
            className="block ml-8 mt-1 p-2 text-sm text-[#768894] hover:text-white"
          >
            View All
          </Link>
        )}
      </div>
    );
  }

  if (!href) {
    return (
      <button onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} onClick={onClick} className={`${baseClasses} ${activeClasses}`}>
      {content}
    </Link>
  );
}

// Sub Navigation Item Component
function SubNavItem({ 
  href, 
  children, 
  onClick 
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block p-2 text-sm text-[#768894] hover:text-white hover:bg-[#20303d] rounded transition-colors min-h-[44px] flex items-center"
    >
      {children}
    </Link>
  );
}
