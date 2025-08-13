import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, Search, Home, Trophy, Users, Calendar, BarChart3, MessageSquare, User, ChevronRight, Bell, Settings, LogOut, ChevronDown, Filter, TrendingUp, Zap } from 'lucide-react';
import { useAuth } from '../../hooks';
import { hasRole, ROLES } from '../../utils/roleUtils';

const MobileNavigationVLR = ({ currentPage, navigateTo, onAuthClick }) => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubmenu, setActiveSubmenu] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef(null);
  const menuRef = useRef(null);
  const touchStartX = useRef(null);

  // VLR.gg style navigation items with sub-menus
  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      page: 'home',
      highlighted: false
    },
    {
      id: 'matches',
      label: 'Matches',
      icon: Trophy,
      highlighted: true, // Red dot for live matches
      submenu: [
        { label: 'Live', page: 'matches', params: { filter: 'live' }, badge: 'LIVE' },
        { label: 'Upcoming', page: 'matches', params: { filter: 'upcoming' } },
        { label: 'Results', page: 'matches', params: { filter: 'completed' } },
        { label: 'My Teams', page: 'matches', params: { filter: 'following' } }
      ]
    },
    {
      id: 'events',
      label: 'Events',
      icon: Calendar,
      submenu: [
        { label: 'Ongoing', page: 'events', params: { filter: 'ongoing' } },
        { label: 'Upcoming', page: 'events', params: { filter: 'upcoming' } },
        { label: 'Completed', page: 'events', params: { filter: 'completed' } },
        { label: 'Major Events', page: 'events', params: { filter: 'major' } }
      ]
    },
    {
      id: 'rankings',
      label: 'Rankings',
      icon: BarChart3,
      submenu: [
        { label: 'Global', page: 'rankings', params: { region: 'global' } },
        { label: 'NA', page: 'rankings', params: { region: 'na' } },
        { label: 'EU', page: 'rankings', params: { region: 'eu' } },
        { label: 'APAC', page: 'rankings', params: { region: 'apac' } },
        { label: 'CN', page: 'rankings', params: { region: 'cn' } }
      ]
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Users,
      page: 'teams'
    },
    {
      id: 'forums',
      label: 'Forums',
      icon: MessageSquare,
      submenu: [
        { label: 'General', page: 'forums', params: { category: 'general' } },
        { label: 'Marvel Rivals', page: 'forums', params: { category: 'marvel-rivals' } },
        { label: 'Strategy', page: 'forums', params: { category: 'strategy' } },
        { label: 'LFT/LFP', page: 'forums', params: { category: 'recruitment' } }
      ]
    }
  ];

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
        setActiveSubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle swipe gestures
  useEffect(() => {
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
      if (!touchStartX.current) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX.current - touchEndX;
      
      // Swipe left to open menu
      if (diff < -50 && !isMenuOpen) {
        setIsMenuOpen(true);
      }
      // Swipe right to close menu
      if (diff > 50 && isMenuOpen) {
        setIsMenuOpen(false);
      }
      
      touchStartX.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMenuOpen]);

  // Live search functionality
  const performSearch = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate search results (replace with actual API call)
    setTimeout(() => {
      const mockResults = [
        { type: 'team', name: 'Team Liquid', id: 1, icon: '🏆' },
        { type: 'player', name: 'TenZ', id: 2, icon: '👤' },
        { type: 'match', name: 'TSM vs NRG', id: 3, icon: '⚔️' },
        { type: 'event', name: 'Marvel Rivals Championship', id: 4, icon: '📅' }
      ].filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 300);
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    performSearch(query);
  };

  const handleNavigation = (page, params = {}) => {
    console.log('📱 Mobile Navigation:', page, params);
    navigateTo(page, params);
    setIsMenuOpen(false);
    setActiveSubmenu(null);
    setIsSearchOpen(false);
  };

  const handleSearchResultClick = (result) => {
    switch (result.type) {
      case 'team':
        handleNavigation('team-detail', { id: result.id });
        break;
      case 'player':
        handleNavigation('player-detail', { id: result.id });
        break;
      case 'match':
        handleNavigation('match-detail', { id: result.id });
        break;
      case 'event':
        handleNavigation('event-detail', { id: result.id });
        break;
      default:
        break;
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const toggleSubmenu = (itemId) => {
    setActiveSubmenu(activeSubmenu === itemId ? null : itemId);
  };

  return (
    <>
      {/* Mobile Header - VLR.gg Style */}
      <header className={`mobile-header-vlr ${scrolled ? 'scrolled' : ''}`}>
        <div className="mobile-header-content">
          {/* Left Section */}
          <div className="mobile-header-left">
            <button 
              className="mobile-menu-toggle touch-optimized"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="mobile-logo" onClick={() => handleNavigation('home')}>
              <span className="logo-text">MRVL</span>
              <span className="logo-badge">RIVALS</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="mobile-header-right">
            <button 
              className="mobile-search-toggle touch-optimized"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Search"
            >
              <Search size={20} />
            </button>
            
            {user && (
              <button className="mobile-notification-toggle touch-optimized">
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </button>
            )}
            
            {user ? (
              <div className="mobile-user-avatar" onClick={() => handleNavigation('profile')}>
                <img 
                  src={user.avatar || '/default-avatar.png'} 
                  alt={user.name}
                />
              </div>
            ) : (
              <button 
                className="mobile-login-btn"
                onClick={() => onAuthClick('login')}
              >
                Login
              </button>
            )}
          </div>
        </div>

        {/* Search Bar - Expandable */}
        <div className={`mobile-search-bar ${isSearchOpen ? 'active' : ''}`}>
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search teams, players, matches..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="mobile-search-input"
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="mobile-search-results">
              {searchResults.map((result, index) => (
                <div 
                  key={index}
                  className="search-result-item touch-optimized"
                  onClick={() => handleSearchResultClick(result)}
                >
                  <span className="result-icon">{result.icon}</span>
                  <div className="result-content">
                    <span className="result-name">{result.name}</span>
                    <span className="result-type">{result.type}</span>
                  </div>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Mobile Menu - Slide from left */}
      <div className={`mobile-menu-overlay ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)} />
      
      <nav ref={menuRef} className={`mobile-menu-vlr ${isMenuOpen ? 'active' : ''}`}>
        {/* User Section */}
        {user && (
          <div className="mobile-menu-user">
            <div className="user-info">
              <img 
                src={user.avatar || '/default-avatar.png'} 
                alt={user.name}
                className="user-avatar"
              />
              <div className="user-details">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role || 'Player'}</div>
              </div>
            </div>
            <div className="user-actions">
              <button className="user-action-btn touch-optimized" onClick={() => handleNavigation('profile')}>
                <User size={18} />
              </button>
              <button className="user-action-btn touch-optimized" onClick={() => handleNavigation('settings')}>
                <Settings size={18} />
              </button>
              <button className="user-action-btn touch-optimized" onClick={logout}>
                <LogOut size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <div className="mobile-menu-items">
          {navigationItems.map((item) => (
            <div key={item.id} className="mobile-menu-item-wrapper">
              <div 
                className={`mobile-menu-item touch-optimized ${currentPage === item.page ? 'active' : ''}`}
                onClick={() => {
                  if (item.submenu) {
                    toggleSubmenu(item.id);
                  } else {
                    handleNavigation(item.page);
                  }
                }}
              >
                <div className="menu-item-left">
                  <item.icon size={20} />
                  <span className="menu-item-label">{item.label}</span>
                  {item.highlighted && <span className="live-dot" />}
                </div>
                {item.submenu && (
                  <ChevronDown 
                    size={18} 
                    className={`submenu-arrow ${activeSubmenu === item.id ? 'rotated' : ''}`}
                  />
                )}
              </div>
              
              {/* Submenu */}
              {item.submenu && (
                <div className={`mobile-submenu ${activeSubmenu === item.id ? 'active' : ''}`}>
                  {item.submenu.map((subItem, index) => (
                    <div 
                      key={index}
                      className="mobile-submenu-item touch-optimized"
                      onClick={() => handleNavigation(subItem.page, subItem.params)}
                    >
                      <span>{subItem.label}</span>
                      {subItem.badge && (
                        <span className="submenu-badge">{subItem.badge}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <div className="mobile-menu-quick-links">
          <div className="quick-links-title">Quick Access</div>
          <div className="quick-links-grid">
            <button className="quick-link touch-optimized" onClick={() => handleNavigation('matches', { filter: 'live' })}>
              <Zap size={16} />
              <span>Live</span>
            </button>
            <button className="quick-link touch-optimized" onClick={() => handleNavigation('rankings')}>
              <TrendingUp size={16} />
              <span>Top Teams</span>
            </button>
            <button className="quick-link touch-optimized" onClick={() => handleNavigation('news')}>
              <MessageSquare size={16} />
              <span>News</span>
            </button>
            <button className="quick-link touch-optimized" onClick={() => handleNavigation('stats')}>
              <BarChart3 size={16} />
              <span>Stats</span>
            </button>
          </div>
        </div>

        {/* Admin Section */}
        {user && hasRole(user, ROLES.ADMIN) && (
          <div className="mobile-menu-admin">
            <div className="admin-section-title">Admin Panel</div>
            <button 
              className="admin-link touch-optimized"
              onClick={() => handleNavigation('admin')}
            >
              <Settings size={18} />
              <span>Dashboard</span>
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mobile-menu-footer">
          <div className="footer-links">
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('about'); }}>About</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('terms'); }}>Terms</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('privacy'); }}>Privacy</a>
            <a href="#" onClick={(e) => { e.preventDefault(); handleNavigation('contact'); }}>Contact</a>
          </div>
          <div className="footer-copyright">
            © 2025 MRVL Rivals. All rights reserved.
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Bar - VLR.gg Style */}
      <nav className="mobile-bottom-nav-vlr">
        <button 
          className={`bottom-nav-item touch-optimized ${currentPage === 'home' ? 'active' : ''}`}
          onClick={() => handleNavigation('home')}
        >
          <Home size={22} />
          <span>Home</span>
        </button>
        <button 
          className={`bottom-nav-item touch-optimized ${currentPage === 'matches' ? 'active' : ''}`}
          onClick={() => handleNavigation('matches')}
        >
          <Trophy size={22} />
          <span>Matches</span>
          {/* Live indicator */}
          <span className="live-indicator-dot" />
        </button>
        <button 
          className={`bottom-nav-item touch-optimized ${currentPage === 'events' ? 'active' : ''}`}
          onClick={() => handleNavigation('events')}
        >
          <Calendar size={22} />
          <span>Events</span>
        </button>
        <button 
          className={`bottom-nav-item touch-optimized ${currentPage === 'rankings' ? 'active' : ''}`}
          onClick={() => handleNavigation('rankings')}
        >
          <BarChart3 size={22} />
          <span>Rankings</span>
        </button>
        <button 
          className={`bottom-nav-item touch-optimized ${currentPage === 'forums' ? 'active' : ''}`}
          onClick={() => handleNavigation('forums')}
        >
          <MessageSquare size={22} />
          <span>Forums</span>
        </button>
      </nav>
    </>
  );
};

export default MobileNavigationVLR;