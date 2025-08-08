import React, { useState, useEffect, useCallback } from 'react';
import { 
  Menu, X, ChevronLeft, ChevronRight, Maximize2, Minimize2,
  Grid3X3, LayoutGrid, Columns, Sidebar, Split
} from 'lucide-react';
import { useDeviceOrientation } from '../mobile/MobileGestures';
import { hapticFeedback } from '../mobile/MobileGestures';

// VLR.gg Style Tablet Layout Manager
export const TabletLayoutManager = ({ 
  children, 
  sidebar, 
  auxiliary,
  onLayoutChange,
  initialLayout = 'default' 
}) => {
  const [currentLayout, setCurrentLayout] = useState(initialLayout);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [auxiliaryCollapsed, setAuxiliaryCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const deviceOrientation = useDeviceOrientation();

  // Available layout configurations
  const layouts = {
    // Single column - mobile-like for portrait
    single: {
      name: 'Single Column',
      icon: Columns,
      grid: 'tablet-single-column',
      description: 'Full width content'
    },
    // Two column layout
    split: {
      name: 'Split View',
      icon: Split, 
      grid: 'tablet-two-panel',
      description: 'Main content with sidebar'
    },
    // Three column layout for landscape
    triple: {
      name: 'Triple Panel',
      icon: Grid3X3,
      grid: 'tablet-three-panel',
      description: 'Sidebar, main, auxiliary'
    },
    // Grid layout for content browsing
    grid: {
      name: 'Grid Layout',
      icon: LayoutGrid,
      grid: 'tablet-grid-layout',
      description: 'Card-based grid'
    },
    // Sidebar layout
    sidebar: {
      name: 'Sidebar Focus',
      icon: Sidebar,
      grid: 'tablet-sidebar-layout',
      description: 'Sidebar with content'
    }
  };

  // Auto-adjust layout based on orientation
  useEffect(() => {
    if (deviceOrientation.isLandscape && currentLayout === 'single') {
      setCurrentLayout('split');
      onLayoutChange?.('split');
    } else if (deviceOrientation.isPortrait && currentLayout === 'triple') {
      setCurrentLayout('split');
      onLayoutChange?.('split');
    }
  }, [deviceOrientation.isLandscape, deviceOrientation.isPortrait, currentLayout, onLayoutChange]);

  const switchLayout = useCallback((layoutKey) => {
    setCurrentLayout(layoutKey);
    onLayoutChange?.(layoutKey);
    hapticFeedback.light();
  }, [onLayoutChange]);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
    hapticFeedback.light();
  }, []);

  const toggleAuxiliary = useCallback(() => {
    setAuxiliaryCollapsed(prev => !prev);
    hapticFeedback.light();
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    hapticFeedback.medium();
  }, []);

  const layout = layouts[currentLayout];

  return (
    <div className={`tablet-layout-manager h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}`}>
      {/* Layout Controls */}
      <TabletLayoutControls 
        currentLayout={currentLayout}
        layouts={layouts}
        onLayoutChange={switchLayout}
        sidebarCollapsed={sidebarCollapsed}
        auxiliaryCollapsed={auxiliaryCollapsed}
        isFullscreen={isFullscreen}
        onToggleSidebar={toggleSidebar}
        onToggleAuxiliary={toggleAuxiliary}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Layout Container */}
      <div className={`h-full transition-all duration-300 ${getLayoutClasses(currentLayout, sidebarCollapsed, auxiliaryCollapsed)}`}>
        {/* Sidebar */}
        {sidebar && (currentLayout === 'split' || currentLayout === 'triple' || currentLayout === 'sidebar') && (
          <div className={`tablet-sidebar tablet-scroll-container transition-all duration-300 ${
            sidebarCollapsed ? 'tablet-sidebar-collapsed' : ''
          }`}>
            {sidebarCollapsed ? (
              <div className="p-4">
                <button 
                  onClick={toggleSidebar}
                  className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-optimized"
                >
                  <ChevronRight className="w-5 h-5 mx-auto" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Sidebar</h3>
                  <button 
                    onClick={toggleSidebar}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-optimized"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {sidebar}
                </div>
              </>
            )}
          </div>
        )}

        {/* Main Content */}
        <div className="tablet-main-content tablet-scroll-container overflow-y-auto">
          {currentLayout === 'grid' ? (
            <div className="tablet-grid-container p-6">
              {children}
            </div>
          ) : (
            <div className="p-6">
              {children}
            </div>
          )}
        </div>

        {/* Auxiliary Panel */}
        {auxiliary && currentLayout === 'triple' && (
          <div className={`tablet-auxiliary tablet-scroll-container transition-all duration-300 ${
            auxiliaryCollapsed ? 'tablet-auxiliary-collapsed' : ''
          }`}>
            {auxiliaryCollapsed ? (
              <div className="p-4">
                <button 
                  onClick={toggleAuxiliary}
                  className="w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-optimized"
                >
                  <ChevronLeft className="w-5 h-5 mx-auto" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Updates</h3>
                  <button 
                    onClick={toggleAuxiliary}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-optimized"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {auxiliary}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Layout control component
const TabletLayoutControls = ({ 
  currentLayout, 
  layouts, 
  onLayoutChange,
  sidebarCollapsed,
  auxiliaryCollapsed,
  isFullscreen,
  onToggleSidebar,
  onToggleAuxiliary,
  onToggleFullscreen
}) => {
  const [showControls, setShowControls] = useState(false);

  return (
    <>
      {/* Layout Controls Toggle */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="fixed top-4 right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 touch-optimized tablet-focus-visible"
      >
        <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {/* Layout Controls Panel */}
      {showControls && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-30"
            onClick={() => setShowControls(false)}
          />
          
          <div className="fixed top-16 right-4 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 w-80 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Layout Controls</h3>
              <button 
                onClick={() => setShowControls(false)}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-optimized"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Layout Options */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Layout Style</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(layouts).map(([key, layout]) => (
                  <button
                    key={key}
                    onClick={() => onLayoutChange(key)}
                    className={`flex flex-col items-center p-3 rounded-lg border transition-all touch-optimized ${
                      currentLayout === key
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600'
                    }`}
                  >
                    <layout.icon className="w-5 h-5 mb-1" />
                    <span className="text-xs text-center">{layout.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Panel Controls */}
            <div className="space-y-3 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Panel Controls</h4>
              
              <div className="space-y-2">
                <button
                  onClick={onToggleSidebar}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-optimized"
                >
                  <span className="text-sm">Sidebar</span>
                  <span className="text-xs text-gray-500">
                    {sidebarCollapsed ? 'Collapsed' : 'Expanded'}
                  </span>
                </button>
                
                <button
                  onClick={onToggleAuxiliary}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-optimized"
                >
                  <span className="text-sm">Auxiliary Panel</span>
                  <span className="text-xs text-gray-500">
                    {auxiliaryCollapsed ? 'Collapsed' : 'Expanded'}
                  </span>
                </button>
                
                <button
                  onClick={onToggleFullscreen}
                  className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-optimized"
                >
                  <div className="flex items-center space-x-2">
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    <span className="text-sm">Fullscreen</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {isFullscreen ? 'Exit' : 'Enter'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

// Helper function to get layout classes
const getLayoutClasses = (layout, sidebarCollapsed, auxiliaryCollapsed) => {
  const baseClasses = 'tablet-layout-container flex';
  
  switch (layout) {
    case 'single':
      return `${baseClasses} tablet-single-column`;
    case 'split':
      return `${baseClasses} tablet-two-panel`;
    case 'triple':
      return `${baseClasses} tablet-three-panel`;
    case 'grid':
      return `${baseClasses} tablet-grid-layout`;
    case 'sidebar':
      return `${baseClasses} tablet-sidebar-layout`;
    default:
      return `${baseClasses} tablet-two-panel`;
  }
};

// Tablet-optimized card component
export const TabletCard = ({ 
  children, 
  className = '', 
  hover = true, 
  onClick,
  ...props 
}) => {
  return (
    <div
      onClick={onClick}
      className={`tablet-card bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 ${
        hover ? 'tablet-touchable hover:shadow-tablet-hover hover:border-red-300 dark:hover:border-red-600' : ''
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Tablet-optimized grid component
export const TabletGrid = ({ children, columns = 'auto-fit', minWidth = '320px', gap = '1.5rem', className = '' }) => {
  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: columns === 'auto-fit' 
      ? `repeat(auto-fit, minmax(${minWidth}, 1fr))`
      : `repeat(${columns}, 1fr)`,
    gap: gap
  };

  return (
    <div 
      className={`tablet-grid ${className}`}
      style={gridStyle}
    >
      {children}
    </div>
  );
};

// Tablet navigation tabs
export const TabletTabs = ({ tabs, activeTab, onTabChange, className = '' }) => {
  return (
    <div className={`tablet-tabs ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`tablet-tab ${activeTab === tab.id ? 'active' : ''}`}
        >
          {tab.icon && <tab.icon className="w-4 h-4" />}
          <span>{tab.label}</span>
          {tab.badge && (
            <span className="tablet-tab-badge">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

// Tablet sidebar component
export const TabletSidebar = ({ children, title, collapsible = true, collapsed = false, onToggle }) => {
  return (
    <div className={`tablet-sidebar-component ${collapsed ? 'collapsed' : ''}`}>
      {title && (
        <div className="tablet-sidebar-header">
          <h3 className="tablet-sidebar-title">{title}</h3>
          {collapsible && (
            <button 
              onClick={onToggle}
              className="tablet-sidebar-toggle touch-optimized"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
      <div className="tablet-sidebar-content">
        {children}
      </div>
    </div>
  );
};

// Tablet data table component
export const TabletDataTable = ({ 
  data = [], 
  columns = [], 
  onRowClick,
  sortable = true,
  className = '' 
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (columnKey) => {
    if (!sortable) return;

    setSortConfig(prev => ({
      key: columnKey,
      direction: prev.key === columnKey && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    
    hapticFeedback.light();
  };

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      
      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortConfig]);

  return (
    <div className={`tablet-data-table-container ${className}`}>
      <table className="tablet-data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key}
                onClick={() => handleSort(column.key)}
                className={`${sortable ? 'tablet-sortable-header' : ''} ${
                  sortConfig.key === column.key ? 'sorted' : ''
                }`}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {sortable && sortConfig.key === column.key && (
                    <span className="tablet-sort-indicator">
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, index) => (
            <tr 
              key={row.id || index}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'tablet-clickable-row' : ''}
            >
              {columns.map((column) => (
                <td key={`${row.id || index}-${column.key}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default {
  TabletLayoutManager,
  TabletCard,
  TabletGrid,
  TabletTabs,
  TabletSidebar,
  TabletDataTable
};