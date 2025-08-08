import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Sidebar, PanelLeftOpen, PanelLeftClose, Grid, List, 
  Maximize, Minimize, RotateCcw, Settings, Eye, EyeOff,
  Monitor, Tablet, Smartphone, Columns, Layout
} from 'lucide-react';
import { useDeviceOrientation } from './MobileGestures';

// Tablet Layout Manager for Dynamic Multi-Column Layouts
export const TabletLayoutManager = ({ children, initialLayout = 'two-panel' }) => {
  const [currentLayout, setCurrentLayout] = useState(initialLayout);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [showLayoutControls, setShowLayoutControls] = useState(false);
  const [adaptiveMode, setAdaptiveMode] = useState(true);
  const containerRef = useRef(null);
  const { isPortrait, isLandscape } = useDeviceOrientation();

  // Layout configurations
  const layouts = {
    'single-column': {
      name: 'Single Column',
      icon: Smartphone,
      gridTemplate: '1fr',
      description: 'Full-width single column'
    },
    'two-panel': {
      name: 'Two Panel',
      icon: Columns,
      gridTemplate: '1fr 1fr',
      description: 'Equal two-column layout'
    },
    'sidebar-main': {
      name: 'Sidebar + Main',
      icon: PanelLeftOpen,
      gridTemplate: '300px 1fr',
      description: 'Sidebar with main content'
    },
    'main-sidebar': {
      name: 'Main + Sidebar',
      icon: PanelLeftClose,
      gridTemplate: '1fr 300px',
      description: 'Main content with right sidebar'
    },
    'three-column': {
      name: 'Three Column',
      icon: Grid,
      gridTemplate: '280px 1fr 320px',
      description: 'Left sidebar, main, right panel'
    }
  };

  // Adaptive layout based on screen size and orientation
  useEffect(() => {
    if (!adaptiveMode) return;

    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setCurrentLayout('single-column');
      } else if (width < 1024) {
        setCurrentLayout(isPortrait ? 'two-panel' : 'sidebar-main');
      } else {
        setCurrentLayout('three-column');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [adaptiveMode, isPortrait]);

  const getGridTemplate = () => {
    const layout = layouts[currentLayout];
    if (!layout) return '1fr';

    let template = layout.gridTemplate;
    
    // Adjust for collapsed panels
    if (currentLayout === 'sidebar-main' && leftPanelCollapsed) {
      template = '60px 1fr';
    } else if (currentLayout === 'main-sidebar' && rightPanelCollapsed) {
      template = '1fr 60px';
    } else if (currentLayout === 'three-column') {
      if (leftPanelCollapsed && rightPanelCollapsed) {
        template = '60px 1fr 60px';
      } else if (leftPanelCollapsed) {
        template = '60px 1fr 320px';
      } else if (rightPanelCollapsed) {
        template = '280px 1fr 60px';
      }
    }
    
    return template;
  };

  return (
    <div className="tablet-layout-manager h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Layout Controls */}
      <div className="tablet-layout-controls fixed top-4 right-4 z-50">
        <button
          onClick={() => setShowLayoutControls(!showLayoutControls)}
          className="p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Layout className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        {showLayoutControls && (
          <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-64 animate-spring-in">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Layout Options
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(layouts).map(([key, layout]) => {
                    const Icon = layout.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setCurrentLayout(key);
                          setAdaptiveMode(false);
                        }}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          currentLayout === key
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        title={layout.description}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-1" />
                        <div className="text-xs font-medium">{layout.name}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={adaptiveMode}
                    onChange={(e) => setAdaptiveMode(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Adaptive Mode
                  </span>
                </label>
                
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {isPortrait ? 'Portrait' : 'Landscape'} • {window.innerWidth}px
                  </span>
                </div>
              </div>

              {/* Panel Controls */}
              {(currentLayout === 'sidebar-main' || currentLayout === 'main-sidebar' || currentLayout === 'three-column') && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Panel Controls
                  </div>
                  <div className="space-y-2">
                    {(currentLayout === 'sidebar-main' || currentLayout === 'three-column') && (
                      <button
                        onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        {leftPanelCollapsed ? 'Expand' : 'Collapse'} Left Panel
                      </button>
                    )}
                    {(currentLayout === 'main-sidebar' || currentLayout === 'three-column') && (
                      <button
                        onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                      >
                        {rightPanelCollapsed ? 'Expand' : 'Collapse'} Right Panel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Layout Container */}
      <div
        ref={containerRef}
        className="tablet-layout-container h-full"
        style={{
          display: 'grid',
          gridTemplateColumns: getGridTemplate(),
          gap: '1rem',
          padding: '1rem'
        }}
      >
        {React.Children.map(children, (child, index) => {
          if (!child) return null;
          
          return (
            <div
              key={index}
              className={`tablet-layout-panel bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300 ${
                (index === 0 && leftPanelCollapsed) || (index === 2 && rightPanelCollapsed)
                  ? 'tablet-panel-collapsed'
                  : ''
              }`}
            >
              {child}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Split View Component for Tournament Details
export const TabletSplitView = ({ 
  leftPanel, 
  rightPanel, 
  leftTitle = 'Panel 1',
  rightTitle = 'Panel 2',
  initialSplit = 50,
  resizable = true
}) => {
  const [splitPosition, setSplitPosition] = useState(initialSplit);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);
  const resizerRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    if (!resizable) return;
    
    setIsResizing(true);
    e.preventDefault();
  }, [resizable]);

  const handleMouseMove = useCallback((e) => {
    if (!isResizing || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const percentage = ((e.clientX - rect.left) / rect.width) * 100;
    setSplitPosition(Math.max(20, Math.min(80, percentage)));
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={containerRef}
      className="tablet-split-view h-full flex bg-gray-100 dark:bg-gray-900"
    >
      {/* Left Panel */}
      <div
        className="tablet-split-left bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col"
        style={{ width: `${splitPosition}%` }}
      >
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {leftTitle}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {leftPanel}
        </div>
      </div>

      {/* Resizer */}
      {resizable && (
        <div
          ref={resizerRef}
          className={`tablet-split-resizer w-1 bg-gray-200 dark:bg-gray-700 hover:bg-red-400 cursor-col-resize transition-colors ${
            isResizing ? 'bg-red-500' : ''
          }`}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Right Panel */}
      <div
        className="tablet-split-right bg-white dark:bg-gray-800 flex flex-col"
        style={{ width: `${100 - splitPosition}%` }}
      >
        <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {rightTitle}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {rightPanel}
        </div>
      </div>
    </div>
  );
};

// Adaptive Grid Component for Tournament Content
export const TabletAdaptiveGrid = ({ 
  items, 
  renderItem,
  minItemWidth = 280,
  gap = 16,
  className = ''
}) => {
  const [columns, setColumns] = useState(1);
  const containerRef = useRef(null);

  const updateColumns = useCallback(() => {
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    const availableWidth = containerWidth - gap;
    const itemWidth = minItemWidth + gap;
    const calculatedColumns = Math.floor(availableWidth / itemWidth);
    
    setColumns(Math.max(1, calculatedColumns));
  }, [minItemWidth, gap]);

  useEffect(() => {
    updateColumns();
    
    const resizeObserver = new ResizeObserver(updateColumns);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [updateColumns]);

  return (
    <div
      ref={containerRef}
      className={`tablet-adaptive-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        width: '100%'
      }}
    >
      {items.map((item, index) => (
        <div key={index} className="tablet-grid-item">
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
};

// Tournament Detail Sidebar Component
export const TabletTournamentSidebar = ({ 
  tournament, 
  matches, 
  teams,
  collapsed = false,
  onToggleCollapse
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'bracket', label: 'Bracket' },
    { id: 'teams', label: 'Teams' },
    { id: 'schedule', label: 'Schedule' }
  ];

  if (collapsed) {
    return (
      <div className="tablet-sidebar-collapsed w-16 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-4"
        >
          <PanelLeftOpen className="w-5 h-5 text-gray-500" />
        </button>
        
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-2 rounded-lg transition-colors mb-2 ${
              activeTab === tab.id
                ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500'
            }`}
            title={tab.label}
          >
            <div className="w-5 h-5">
              {tab.id === 'overview' && <Eye className="w-5 h-5" />}
              {tab.id === 'bracket' && <Grid className="w-5 h-5" />}
              {tab.id === 'teams' && <Sidebar className="w-5 h-5" />}
              {tab.id === 'schedule' && <List className="w-5 h-5" />}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="tablet-sidebar-expanded w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {tournament?.name || 'Tournament'}
        </h2>
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <PanelLeftClose className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-red-500 text-red-600 dark:text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'overview' && (
          <TournamentOverview tournament={tournament} />
        )}
        {activeTab === 'bracket' && (
          <TournamentBracketSummary matches={matches} />
        )}
        {activeTab === 'teams' && (
          <TournamentTeams teams={teams} />
        )}
        {activeTab === 'schedule' && (
          <TournamentSchedule matches={matches} />
        )}
      </div>
    </div>
  );
};

// Helper components for sidebar content
const TournamentOverview = ({ tournament }) => (
  <div className="space-y-4">
    <div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Prize Pool</h3>
      <p className="text-2xl font-bold text-red-600">
        {tournament?.prizePool || 'TBD'}
      </p>
    </div>
    <div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Format</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {tournament?.format || 'Single Elimination'}
      </p>
    </div>
    <div>
      <h3 className="font-medium text-gray-900 dark:text-white mb-2">Location</h3>
      <p className="text-gray-600 dark:text-gray-400">
        {tournament?.location || 'Online'}
      </p>
    </div>
  </div>
);

const TournamentBracketSummary = ({ matches }) => (
  <div className="space-y-3">
    {matches?.slice(0, 5).map((match, index) => (
      <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-sm font-medium">
          {match.team1?.name || 'TBD'} vs {match.team2?.name || 'TBD'}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {match.round} • {match.status}
        </div>
      </div>
    ))}
  </div>
);

const TournamentTeams = ({ teams }) => (
  <div className="space-y-3">
    {teams?.map((team, index) => (
      <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full"></div>
        <div>
          <div className="text-sm font-medium">{team.name}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {team.region}
          </div>
        </div>
      </div>
    ))}
  </div>
);

const TournamentSchedule = ({ matches }) => (
  <div className="space-y-3">
    {matches?.map((match, index) => (
      <div key={index} className="border-l-2 border-gray-200 dark:border-gray-700 pl-3">
        <div className="text-sm font-medium">
          {new Date(match.scheduledAt).toLocaleDateString()}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {match.team1?.name} vs {match.team2?.name}
        </div>
      </div>
    ))}
  </div>
);

export default {
  TabletLayoutManager,
  TabletSplitView,
  TabletAdaptiveGrid,
  TabletTournamentSidebar
};