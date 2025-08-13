import React, { useState, useEffect } from 'react';
import { Menu, X, Search, Bell, Settings, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import MobileNavigationVLR from '../mobile/MobileNavigationVLR';
import { MobileMatchListVLR } from '../mobile/MobileMatchCardVLR';

const TabletLayoutVLR = ({ 
  children, 
  currentPage, 
  navigateTo, 
  onAuthClick,
  sidebarContent = null,
  rightPanelContent = null,
  layout = 'two-panel' // 'single', 'two-panel', 'three-panel'
}) => {
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activePanel, setActivePanel] = useState('main'); // 'sidebar', 'main', 'right'
  
  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      
      // Adjust layout based on orientation
      if (window.innerWidth > window.innerHeight) {
        // Landscape - show sidebar by default
        setIsSidebarOpen(true);
        if (window.innerWidth > 1024) {
          setIsRightPanelOpen(true);
        }
      } else {
        // Portrait - hide sidebar to maximize content space
        setIsSidebarOpen(false);
        setIsRightPanelOpen(false);
      }
    };

    window.addEventListener('resize', handleOrientationChange);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    // Initial check
    handleOrientationChange();
    
    return () => {
      window.removeEventListener('resize', handleOrientationChange);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle panel focus for better tablet UX
  const focusPanel = (panel) => {
    setActivePanel(panel);
    
    // Auto-adjust panels based on focus
    if (panel === 'sidebar') {
      setIsSidebarOpen(true);
      setIsRightPanelOpen(false);
    } else if (panel === 'right') {
      setIsRightPanelOpen(true);
      if (!isLandscape) {
        setIsSidebarOpen(false);
      }
    } else {
      // Main panel - show based on screen size
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
        setIsRightPanelOpen(false);
      }
    }
  };

  // Swipe gesture handling for tablets
  useEffect(() => {
    let touchStartX = null;
    let touchEndX = null;
    
    const handleTouchStart = (e) => {
      touchStartX = e.touches[0].clientX;
    };
    
    const handleTouchEnd = (e) => {
      touchEndX = e.changedTouches[0].clientX;
      handleSwipe();
    };
    
    const handleSwipe = () => {
      if (!touchStartX || !touchEndX) return;
      
      const swipeDistance = touchStartX - touchEndX;
      const threshold = 50;
      
      if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
          // Swipe left
          if (!isRightPanelOpen && rightPanelContent) {
            setIsRightPanelOpen(true);
          }
        } else {
          // Swipe right
          if (!isSidebarOpen) {
            setIsSidebarOpen(true);
          }
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isSidebarOpen, isRightPanelOpen, rightPanelContent]);

  // Determine layout class
  const getLayoutClass = () => {
    if (layout === 'three-panel' && isLandscape && window.innerWidth > 1024) {
      return 'tablet-three-panel';
    } else if (layout === 'two-panel' && isLandscape) {
      return 'tablet-two-panel';
    } else {
      return 'tablet-single-panel';
    }
  };

  return (
    <div className={`tablet-layout-vlr ${getLayoutClass()} ${isLandscape ? 'landscape' : 'portrait'}`}>
      {/* Tablet Header */}
      <header className="tablet-header-vlr">
        <div className="tablet-header-left">
          <button 
            className="tablet-menu-btn touch-optimized"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
          
          <div className="tablet-logo" onClick={() => navigateTo('home')}>
            <span className="logo-text">MRVL</span>
            <span className="logo-badge">RIVALS</span>
          </div>
        </div>

        <div className="tablet-header-center">
          <div className="tablet-search-bar">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search teams, players, matches..."
              className="tablet-search-input"
            />
          </div>
        </div>

        <div className="tablet-header-right">
          <button className="tablet-icon-btn touch-optimized">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>
          
          <button className="tablet-icon-btn touch-optimized">
            <Settings size={20} />
          </button>
          
          <button 
            className="tablet-icon-btn touch-optimized"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          
          {rightPanelContent && (
            <button 
              className="tablet-menu-btn touch-optimized"
              onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            >
              {isRightPanelOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="tablet-content-wrapper">
        {/* Left Sidebar */}
        <aside className={`tablet-sidebar ${isSidebarOpen ? 'open' : 'closed'} ${activePanel === 'sidebar' ? 'active' : ''}`}>
          {sidebarContent || (
            <TabletSidebarDefault 
              currentPage={currentPage}
              navigateTo={navigateTo}
            />
          )}
        </aside>

        {/* Main Content */}
        <main 
          className={`tablet-main-content ${activePanel === 'main' ? 'active' : ''}`}
          onClick={() => focusPanel('main')}
        >
          <div className="tablet-content-scroll">
            {children}
          </div>
        </main>

        {/* Right Panel (Optional) */}
        {rightPanelContent && (
          <aside className={`tablet-right-panel ${isRightPanelOpen ? 'open' : 'closed'} ${activePanel === 'right' ? 'active' : ''}`}>
            {rightPanelContent}
          </aside>
        )}
      </div>

      {/* Tablet Bottom Bar - Simplified for landscape */}
      {!isLandscape && (
        <MobileNavigationVLR 
          currentPage={currentPage}
          navigateTo={navigateTo}
          onAuthClick={onAuthClick}
        />
      )}
    </div>
  );
};

// Default Sidebar Content
const TabletSidebarDefault = ({ currentPage, navigateTo }) => {
  const [activeSection, setActiveSection] = useState('matches');

  const sidebarSections = [
    {
      id: 'matches',
      title: 'Live Matches',
      content: (
        <MobileMatchListVLR
          matches={[
            {
              id: 1,
              status: 'live',
              team1: { name: 'Team Liquid', logo: '/teams/liquid.png' },
              team2: { name: 'NRG', logo: '/teams/nrg.png' },
              team1_score: 1,
              team2_score: 0,
              current_map: 2,
              viewers: 15234
            },
            {
              id: 2,
              status: 'upcoming',
              team1: { name: 'TSM', logo: '/teams/tsm.png' },
              team2: { name: 'C9', logo: '/teams/c9.png' },
              scheduled_at: new Date(Date.now() + 3600000).toISOString()
            }
          ]}
          onMatchClick={(match) => navigateTo('match-detail', { id: match.id })}
          compact={true}
        />
      )
    },
    {
      id: 'rankings',
      title: 'Top Teams',
      content: (
        <div className="tablet-rankings-list">
          {[
            { rank: 1, team: 'Team Liquid', points: 2450, change: 'up' },
            { rank: 2, team: 'NRG Esports', points: 2380, change: 'up' },
            { rank: 3, team: 'TSM', points: 2320, change: 'down' },
            { rank: 4, team: 'Cloud9', points: 2280, change: 'same' },
            { rank: 5, team: '100 Thieves', points: 2210, change: 'up' }
          ].map(item => (
            <div key={item.rank} className="ranking-item-tablet">
              <span className="rank">#{item.rank}</span>
              <span className="team-name">{item.team}</span>
              <span className="points">{item.points}</span>
              <span className={`change ${item.change}`}>
                {item.change === 'up' ? '↑' : item.change === 'down' ? '↓' : '-'}
              </span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'events',
      title: 'Ongoing Events',
      content: (
        <div className="tablet-events-list">
          {[
            { 
              name: 'Marvel Rivals Championship', 
              status: 'ongoing',
              stage: 'Playoffs',
              teams: 16
            },
            { 
              name: 'NA Qualifiers', 
              status: 'upcoming',
              stage: 'Groups',
              teams: 32
            }
          ].map((event, index) => (
            <div key={index} className="event-card-tablet">
              <div className="event-header">
                <span className="event-name">{event.name}</span>
                <span className={`event-status ${event.status}`}>
                  {event.status}
                </span>
              </div>
              <div className="event-details">
                <span>{event.stage}</span>
                <span>{event.teams} teams</span>
              </div>
            </div>
          ))}
        </div>
      )
    }
  ];

  return (
    <div className="tablet-sidebar-content">
      {/* Section Tabs */}
      <div className="sidebar-tabs">
        {sidebarSections.map(section => (
          <button
            key={section.id}
            className={`sidebar-tab ${activeSection === section.id ? 'active' : ''}`}
            onClick={() => setActiveSection(section.id)}
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <div className="sidebar-section-content">
        {sidebarSections.find(s => s.id === activeSection)?.content}
      </div>
    </div>
  );
};

// Split View Component for Tablets
export const TabletSplitView = ({ 
  leftContent, 
  rightContent,
  leftWidth = '40%',
  collapsible = true,
  defaultCollapsed = false 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [dragPosition, setDragPosition] = useState(parseInt(leftWidth));
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e) => {
    setIsDragging(true);
    e.preventDefault();
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.touches ? e.touches[0] : e;
    const newPosition = (touch.clientX / window.innerWidth) * 100;
    
    if (newPosition > 20 && newPosition < 80) {
      setDragPosition(newPosition);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleDragMove);
      document.addEventListener('mouseup', handleDragEnd);
      document.addEventListener('touchmove', handleDragMove);
      document.addEventListener('touchend', handleDragEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
        document.removeEventListener('touchmove', handleDragMove);
        document.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging]);

  return (
    <div className="tablet-split-view">
      <div 
        className={`split-panel left ${isCollapsed ? 'collapsed' : ''}`}
        style={{ width: isCollapsed ? '0' : `${dragPosition}%` }}
      >
        {!isCollapsed && leftContent}
      </div>
      
      {!isCollapsed && (
        <div 
          className="split-divider"
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          <div className="divider-handle" />
        </div>
      )}
      
      <div 
        className={`split-panel right ${isCollapsed ? 'expanded' : ''}`}
        style={{ width: isCollapsed ? '100%' : `${100 - dragPosition}%` }}
      >
        {collapsible && (
          <button 
            className="collapse-toggle"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        {rightContent}
      </div>
    </div>
  );
};

export default TabletLayoutVLR;