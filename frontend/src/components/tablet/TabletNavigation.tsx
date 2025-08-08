// src/components/tablet/TabletNavigation.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface TabletNavigationProps {
  className?: string;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

const TabletNavigation: React.FC<TabletNavigationProps> = ({
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('landscape');
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      setOrientation(isLandscape ? 'landscape' : 'portrait');
      
      // Auto-collapse sidebar in portrait mode
      if (!isLandscape) {
        setIsExpanded(false);
      } else {
        setIsExpanded(true);
      }
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);
    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  // Set active section based on current path
  useEffect(() => {
    const pathSegments = pathname.split('/').filter(Boolean);
    setActiveSection(pathSegments[0] || 'home');
  }, [pathname]);

  const navigationItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      id: 'events',
      label: 'Tournaments',
      href: '/events',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      badge: 3,
      children: [
        { id: 'events-live', label: 'Live Events', href: '/events?status=live', icon: null },
        { id: 'events-upcoming', label: 'Upcoming', href: '/events?status=upcoming', icon: null },
        { id: 'events-completed', label: 'Results', href: '/events?status=completed', icon: null },
      ]
    },
    {
      id: 'matches',
      label: 'Matches',
      href: '/matches',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      badge: 12
    },
    {
      id: 'teams',
      label: 'Teams',
      href: '/teams',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    {
      id: 'rankings',
      label: 'Rankings',
      href: '/rankings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      )
    },
    {
      id: 'news',
      label: 'News',
      href: '/news',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      )
    },
    {
      id: 'forum',
      label: 'Forum',
      href: '/forum',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      badge: 7
    },
  ];

  // Portrait mode renders a tab bar at bottom
  if (orientation === 'portrait') {
    return (
      <nav className={`tablet-portrait-tabs ${className}`}>
        {navigationItems.slice(0, 5).map(item => (
          <Link
            key={item.id}
            href={item.href}
            className={`tablet-portrait-tab ${activeSection === item.id ? 'active' : ''}`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
            {item.badge && (
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </div>
            )}
          </Link>
        ))}
      </nav>
    );
  }

  // Landscape mode renders a sidebar
  return (
    <nav className={`tablet-nav-sidebar ${isExpanded ? '' : 'collapsed'} ${className}`}>
      
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${isExpanded ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">MR</span>
            </div>
            {isExpanded && (
              <div className="ml-3">
                <div className="text-sm font-semibold text-gray-900">Marvel Rivals</div>
                <div className="text-xs text-gray-500">Tournament Platform</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="tablet-touch-target-large hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isExpanded ? "M11 19l-7-7 7-7M18 12H6" : "M13 5l7 7-7 7M6 12h12"} />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-2">
          {navigationItems.map(item => (
            <div key={item.id}>
              <Link
                href={item.href}
                className={`tablet-nav-item ${activeSection === item.id ? 'active' : ''}`}
              >
                <div className="tablet-nav-icon">{item.icon}</div>
                {isExpanded && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                    {item.children && (
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </>
                )}
              </Link>
              
              {/* Subnav Items */}
              {isExpanded && item.children && activeSection === item.id && (
                <div className="ml-8 mt-2 space-y-1">
                  {item.children.map(child => (
                    <Link
                      key={child.id}
                      href={child.href}
                      className="block py-2 px-3 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* User Section */}
      {user && isExpanded && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-700 font-medium text-sm">
                {user.username?.charAt(0)?.toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1">
              <div className="text-sm font-medium text-gray-900">{user.username}</div>
              <div className="text-xs text-gray-500">Signed in</div>
            </div>
            <button className="tablet-touch-target hover:bg-gray-100 rounded-md transition-colors">
              <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions (collapsed state) */}
      {!isExpanded && (
        <div className="p-3 border-t border-gray-200">
          <div className="space-y-2">
            <button className="w-full tablet-touch-target hover:bg-gray-100 rounded-md transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button className="w-full tablet-touch-target hover:bg-gray-100 rounded-md transition-colors">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5V3h5v14z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default TabletNavigation;