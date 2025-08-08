import React, { useState, useEffect } from 'react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useAuth } from '../../hooks';

const TabletNavigation = ({ 
  currentPage, 
  navigateTo, 
  notifications = [], 
  showNotifications = true 
}) => {
  const { isLandscape, width, height } = useDeviceType();
  const { user, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(isLandscape);
  const [activeSubmenu, setActiveSubmenu] = useState(null);

  // Auto-manage sidebar based on orientation
  useEffect(() => {
    setSidebarOpen(isLandscape);
  }, [isLandscape]);

  const navigationItems = [
    {
      id: 'home',
      name: 'Home',
      icon: '🏠',
      path: 'home',
      submenu: null
    },
    {
      id: 'matches',
      name: 'Matches',
      icon: '⚔️',
      path: 'matches',
      submenu: [
        { id: 'live-matches', name: 'Live Matches', path: 'matches?filter=live' },
        { id: 'upcoming-matches', name: 'Upcoming', path: 'matches?filter=upcoming' },
        { id: 'completed-matches', name: 'Results', path: 'matches?filter=completed' }
      ]
    },
    {
      id: 'tournaments',
      name: 'Tournaments',
      icon: '🏆',
      path: 'tournaments',
      submenu: [
        { id: 'events', name: 'Events', path: 'events' },
        { id: 'brackets', name: 'Brackets', path: 'tournaments' },
        { id: 'pickems', name: 'Pick\'ems', path: 'pickems' }
      ]
    },
    {
      id: 'teams',
      name: 'Teams',
      icon: '👥',
      path: 'teams',
      submenu: [
        { id: 'all-teams', name: 'All Teams', path: 'teams' },
        { id: 'rankings', name: 'Rankings', path: 'rankings' }
      ]
    },
    {
      id: 'players',
      name: 'Players',
      icon: '🎮',
      path: 'players',
      submenu: null
    },
    {
      id: 'news',
      name: 'News',
      icon: '📰',
      path: 'news',
      submenu: null
    },
    {
      id: 'forums',
      name: 'Forums',
      icon: '💬',
      path: 'forums',
      submenu: [
        { id: 'discussions', name: 'Discussions', path: 'forums' },
        { id: 'trending', name: 'Trending', path: 'forums/trending' }
      ]
    },
    {
      id: 'stats',
      name: 'Stats',
      icon: '📊',
      path: 'stats',
      submenu: null
    }
  ];

  const adminItems = [
    {
      id: 'admin-dashboard',
      name: 'Admin Dashboard',
      icon: '⚙️',
      path: 'admin',
      submenu: [
        { id: 'admin-matches', name: 'Manage Matches', path: 'admin/matches' },
        { id: 'admin-events', name: 'Manage Events', path: 'admin/events' },
        { id: 'admin-users', name: 'Manage Users', path: 'admin/users' }
      ]
    }
  ];

  const handleNavigation = (path) => {
    navigateTo(path);
    if (!isLandscape) {
      setSidebarOpen(false);
    }
  };

  const toggleSubmenu = (itemId) => {
    setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
  };

  const NavItem = ({ item, isActive, level = 0 }) => {
    const hasSubmenu = item.submenu && item.submenu.length > 0;
    const isSubmenuOpen = activeSubmenu === item.id;
    const itemIsActive = currentPage === item.path || currentPage?.startsWith(item.path);

    return (
      <div className="w-full">
        <button
          onClick={() => {
            if (hasSubmenu) {
              toggleSubmenu(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
          className={`
            w-full flex items-center justify-between px-4 py-3 text-left
            transition-all duration-200 rounded-lg mx-2 mb-1 touch-target
            ${level === 0 ? 'font-medium' : 'font-normal text-sm pl-12'}
            ${itemIsActive 
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }
          `}
        >
          <div className="flex items-center space-x-3">
            {level === 0 && (
              <span className="text-lg">{item.icon}</span>
            )}
            <span className={level === 0 ? 'text-base' : 'text-sm'}>
              {item.name}
            </span>
          </div>
          
          {hasSubmenu && (
            <svg 
              className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Submenu */}
        {hasSubmenu && isSubmenuOpen && (
          <div className="space-y-1 mb-2">
            {item.submenu.map((subItem) => (
              <button
                key={subItem.id}
                onClick={() => handleNavigation(subItem.path)}
                className={`
                  w-full flex items-center px-4 py-2 text-left text-sm
                  transition-colors duration-200 rounded-lg mx-2 pl-12 touch-target
                  ${currentPage === subItem.path
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                `}
              >
                {subItem.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Landscape Sidebar */}
      {isLandscape ? (
        <div className={`
          fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          transition-all duration-300 z-40 flex flex-col
          ${sidebarOpen ? 'w-72' : 'w-16'}
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            {sidebarOpen ? (
              <>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MR</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    Marvel Rivals
                  </span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                onClick={() => setSidebarOpen(true)}
                className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center touch-target"
              >
                <span className="text-white font-bold text-sm">MR</span>
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4 space-y-1">
            {navigationItems.map((item) => (
              <NavItem
                key={item.id}
                item={item}
                isActive={currentPage === item.path}
              />
            ))}

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 dark:border-gray-700 mx-4 my-4"></div>
                {adminItems.map((item) => (
                  <NavItem
                    key={item.id}
                    item={item}
                    isActive={currentPage?.startsWith('admin')}
                  />
                ))}
              </>
            )}
          </div>

          {/* User Section */}
          {user && sidebarOpen && (
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {user.username?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Portrait Tab Navigation */
        <>
          {/* Top Navigation Bar */}
          <div className="fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Logo and Menu Toggle */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">MR</span>
                  </div>
                  <span className="font-bold text-lg text-gray-900 dark:text-white">
                    Marvel Rivals
                  </span>
                </div>
              </div>

              {/* Notifications and User */}
              <div className="flex items-center space-x-2">
                {showNotifications && notifications.length > 0 && (
                  <div className="relative">
                    <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm-7-14v3a6 6 0 0112 0v3" />
                      </svg>
                    </button>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">
                        {notifications.length > 9 ? '9+' : notifications.length}
                      </span>
                    </div>
                  </div>
                )}
                
                {user && (
                  <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target">
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Slide-out Menu Overlay */}
          {sidebarOpen && (
            <>
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-45"
                onClick={() => setSidebarOpen(false)}
              ></div>
              
              <div className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-gray-800 z-50 transform transition-transform duration-300 pt-16">
                <div className="flex flex-col h-full">
                  {/* Navigation Items */}
                  <div className="flex-1 overflow-y-auto py-4 space-y-1">
                    {navigationItems.map((item) => (
                      <NavItem
                        key={item.id}
                        item={item}
                        isActive={currentPage === item.path}
                      />
                    ))}

                    {/* Admin Section */}
                    {isAdmin && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-700 mx-4 my-4"></div>
                        {adminItems.map((item) => (
                          <NavItem
                            key={item.id}
                            item={item}
                            isActive={currentPage?.startsWith('admin')}
                          />
                        ))}
                      </>
                    )}
                  </div>

                  {/* User Section */}
                  {user && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-lg font-medium text-gray-700">
                            {user.username?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                            {user.username}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
};

export default TabletNavigation;