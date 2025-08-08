import React from 'react';

function Breadcrumbs({ currentPage, pageParams, navigateTo }) {
  // Define page metadata and hierarchies
  const pageConfig = {
    'home': { title: 'Home', icon: '', parent: null },
    'forums': { title: 'Forums', icon: '', parent: 'home' },
    'matches': { title: 'Matches', icon: '', parent: 'home' },
    'events': { title: 'Events', icon: '', parent: 'home' },
    'rankings': { title: 'Rankings', icon: '', parent: 'home' },
    'teams': { title: 'Teams', icon: '', parent: 'home' },
    'players': { title: 'Players', icon: '', parent: 'home' },
    'news': { title: 'News', icon: '', parent: 'home' },
    'stats': { title: 'Statistics', icon: '', parent: 'home' },
    'search': { title: 'Search Results', icon: '', parent: 'home' },
    
    // Detail pages
    'match-detail': { title: 'Match Details', icon: '', parent: 'matches' },
    'event-detail': { title: 'Event Details', icon: '', parent: 'events' },
    'team-detail': { title: 'Team Details', icon: '', parent: 'teams' },
    'player-detail': { title: 'Player Details', icon: '', parent: 'players' },
    'news-detail': { title: 'News Article', icon: '', parent: 'news' },
    'thread-detail': { title: 'Thread', icon: '', parent: 'forums' },
    'create-thread': { title: 'Create Thread', icon: '', parent: 'forums' },
    
    // User pages
    'user-profile': { title: 'User Profile', icon: '', parent: 'home' },
    'user-dashboard': { title: 'Dashboard', icon: '', parent: 'home' },
    
    // Admin pages
    'admin-dashboard': { title: 'Admin Dashboard', icon: '', parent: 'home' },
    'admin-team-create': { title: 'Create Team', icon: '', parent: 'admin-dashboard' },
    'admin-team-edit': { title: 'Edit Team', icon: '', parent: 'admin-dashboard' },
    'admin-player-create': { title: 'Create Player', icon: '', parent: 'admin-dashboard' },
    'admin-player-edit': { title: 'Edit Player', icon: '', parent: 'admin-dashboard' },
    'admin-user-create': { title: 'Create User', icon: '', parent: 'admin-dashboard' },
    'admin-user-edit': { title: 'Edit User', icon: '', parent: 'admin-dashboard' },
    'admin-news': { title: 'News Management', icon: '', parent: 'admin-dashboard' },
    'admin-news-create': { title: 'Create News', icon: '', parent: 'admin-news' },
    'admin-news-edit': { title: 'Edit News', icon: '', parent: 'admin-news' },
    'admin-events': { title: 'Events Management', icon: '', parent: 'admin-dashboard' },
    'admin-event-create': { title: 'Create Event', icon: '', parent: 'admin-events' },
    'admin-event-edit': { title: 'Edit Event', icon: '', parent: 'admin-events' },
    'admin-match-create': { title: 'Create Match', icon: '', parent: 'admin-dashboard' },
    'admin-match-edit': { title: 'Edit Match', icon: '', parent: 'admin-dashboard' },
    'admin-live-scoring': { title: 'Live Scoring', icon: '', parent: 'admin-dashboard' },
    'admin-forums': { title: 'Forums Management', icon: '', parent: 'admin-dashboard' },
    
    // Footer pages
    'contact': { title: 'Contact', icon: '', parent: 'home' },
    'privacy': { title: 'Privacy Policy', icon: '', parent: 'home' },
    'terms': { title: 'Terms of Service', icon: '', parent: 'home' },
    'careers': { title: 'Careers', icon: '', parent: 'home' },
    'test': { title: 'Test Page', icon: '', parent: 'home' }
  };

  // Build breadcrumb trail
  const buildBreadcrumbs = () => {
    const breadcrumbs = [];
    let currentPageKey = currentPage;
    
    // Build trail by walking up the hierarchy
    while (currentPageKey && pageConfig[currentPageKey]) {
      const config = pageConfig[currentPageKey];
      breadcrumbs.unshift({
        key: currentPageKey,
        title: config.title,
        icon: config.icon,
        isActive: currentPageKey === currentPage
      });
      currentPageKey = config.parent;
    }
    
    return breadcrumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  // Don't show breadcrumbs on home page or if only one crumb
  if (currentPage === 'home' || breadcrumbs.length <= 1) {
    return null;
  }

  const handleBreadcrumbClick = (pageKey) => {
    if (pageKey !== currentPage && navigateTo) {
      navigateTo(pageKey);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 py-2">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.key}>
              {/* Breadcrumb item */}
              <div className="flex items-center">
                {crumb.isActive ? (
                  <span className="flex items-center space-x-1 text-gray-900 dark:text-white font-medium">
                    {crumb.icon && <span className="text-xs">{crumb.icon}</span>}
                    <span>{crumb.title}</span>
                  </span>
                ) : (
                  <button
                    onClick={() => handleBreadcrumbClick(crumb.key)}
                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    {crumb.icon && <span className="text-xs">{crumb.icon}</span>}
                    <span>{crumb.title}</span>
                  </button>
                )}
              </div>
              
              {/* Separator */}
              {index < breadcrumbs.length - 1 && (
                <span className="text-gray-400 dark:text-gray-600 select-none">
                  ›
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </div>
  );
}

export default Breadcrumbs;