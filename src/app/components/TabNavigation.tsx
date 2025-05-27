// src/components/TabNavigation.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  hidden?: boolean;
  tooltip?: string;
  href?: string;
  onClick?: () => void;
  closable?: boolean;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'buttons';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
  scrollable?: boolean;
  centered?: boolean;
  fullWidth?: boolean;
  animated?: boolean;
  urlSync?: boolean;
  urlParam?: string;
  lazyLoad?: boolean;
  showScrollButtons?: boolean;
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  contentClassName?: string;
  children?: React.ReactNode;
  renderTabContent?: (tabId: string) => React.ReactNode;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  variant = 'default',
  size = 'md',
  orientation = 'horizontal',
  scrollable = true,
  centered = false,
  fullWidth = false,
  animated = true,
  urlSync = false,
  urlParam = 'tab',
  lazyLoad = false,
  showScrollButtons = true,
  className = '',
  tabClassName = '',
  activeTabClassName = '',
  contentClassName = '',
  children,
  renderTabContent
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [loadedTabs, setLoadedTabs] = useState<Set<string>>(new Set([activeTab]));
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const tabsRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  // Filter visible tabs
  const visibleTabs = tabs.filter(tab => !tab.hidden);

  // URL synchronization
  useEffect(() => {
    if (urlSync) {
      const urlTab = searchParams.get(urlParam);
      if (urlTab && urlTab !== activeTab && visibleTabs.some(tab => tab.id === urlTab)) {
        onTabChange(urlTab);
      }
    }
  }, [searchParams, urlParam, urlSync, activeTab, onTabChange, visibleTabs]);

  // Update URL when tab changes
  const updateURL = useCallback((tabId: string) => {
    if (!urlSync) return;
    
    const params = new URLSearchParams(searchParams.toString());
    if (tabId === visibleTabs[0]?.id) {
      params.delete(urlParam);
    } else {
      params.set(urlParam, tabId);
    }
    
    const newURL = `${pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.replace(newURL, { scroll: false });
  }, [urlSync, searchParams, pathname, router, urlParam, visibleTabs]);

  // Handle tab change with lazy loading
  const handleTabChange = useCallback((tabId: string) => {
    const tab = visibleTabs.find(t => t.id === tabId);
    if (!tab || tab.disabled) return;

    if (animated) {
      setIsTransitioning(true);
      setTimeout(() => setIsTransitioning(false), 150);
    }

    // Add to loaded tabs if lazy loading
    if (lazyLoad) {
      setLoadedTabs(prev => new Set([...prev, tabId]));
    }

    // Handle custom click handler
    if (tab.onClick) {
      tab.onClick();
    }

    // Handle URL navigation
    if (tab.href) {
      router.push(tab.href);
      return;
    }

    // Update active tab
    onTabChange(tabId);
    updateURL(tabId);
  }, [visibleTabs, animated, lazyLoad, onTabChange, updateURL, router]);

  // Handle tab close
  const handleTabClose = useCallback((e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    
    if (onTabClose) {
      onTabClose(tabId);
    }

    // If closing active tab, switch to next available tab
    if (tabId === activeTab) {
      const currentIndex = visibleTabs.findIndex(tab => tab.id === tabId);
      const nextTab = visibleTabs[currentIndex + 1] || visibleTabs[currentIndex - 1];
      if (nextTab) {
        handleTabChange(nextTab.id);
      }
    }
  }, [onTabClose, activeTab, visibleTabs, handleTabChange]);

  // Check scroll capability
  const checkScrollability = useCallback(() => {
    if (!scrollable || !tabsRef.current) return;

    const container = tabsRef.current;
    const isHorizontal = orientation === 'horizontal';
    
    if (isHorizontal) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 1
      );
    } else {
      setCanScrollLeft(container.scrollTop > 0);
      setCanScrollRight(
        container.scrollTop < container.scrollHeight - container.clientHeight - 1
      );
    }
  }, [scrollable, orientation]);

  // Handle scroll
  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!tabsRef.current) return;

    const container = tabsRef.current;
    const isHorizontal = orientation === 'horizontal';
    const scrollAmount = 200;

    if (isHorizontal) {
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    } else {
      container.scrollBy({
        top: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  }, [orientation]);

  // Update scroll buttons and indicator position
  useEffect(() => {
    checkScrollability();
    
    if (!tabsRef.current) return;
    
    const container = tabsRef.current;
    container.addEventListener('scroll', checkScrollability);
    
    return () => {
      container.removeEventListener('scroll', checkScrollability);
    };
  }, [checkScrollability]);

  // Update indicator position
  useEffect(() => {
    if (!animated || !indicatorRef.current || !activeTabRef.current || variant === 'pills' || variant === 'buttons') {
      return;
    }

    const indicator = indicatorRef.current;
    const activeButton = activeTabRef.current;
    const container = tabsRef.current;

    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    if (orientation === 'horizontal') {
      const left = buttonRect.left - containerRect.left + container.scrollLeft;
      const width = buttonRect.width;
      
      indicator.style.transform = `translateX(${left}px)`;
      indicator.style.width = `${width}px`;
    } else {
      const top = buttonRect.top - containerRect.top + container.scrollTop;
      const height = buttonRect.height;
      
      indicator.style.transform = `translateY(${top}px)`;
      indicator.style.height = `${height}px`;
    }
  }, [activeTab, animated, orientation, variant, visibleTabs]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = visibleTabs.findIndex(tab => tab.id === activeTab);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : visibleTabs.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex < visibleTabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = visibleTabs.length - 1;
        break;
      default:
        return;
    }

    const nextTab = visibleTabs[nextIndex];
    if (nextTab && !nextTab.disabled) {
      handleTabChange(nextTab.id);
    }
  }, [visibleTabs, activeTab, handleTabChange]);

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Variant classes
  const getVariantClasses = (tab: TabItem, isActive: boolean) => {
    const baseClasses = `${sizeClasses[size]} font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#fa4454] focus:ring-offset-2 focus:ring-offset-[#1a2332]`;
    
    switch (variant) {
      case 'pills':
        return `${baseClasses} rounded-full ${
          isActive
            ? 'bg-[#fa4454] text-white shadow-lg'
            : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
        } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
        
      case 'buttons':
        return `${baseClasses} rounded-lg ${
          isActive
            ? 'bg-[#fa4454] text-white shadow-lg'
            : 'bg-[#2b3d4d] text-[#768894] hover:text-white hover:bg-[#374555]'
        } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
        
      case 'underline':
        return `${baseClasses} ${
          isActive
            ? 'text-white border-b-2 border-[#fa4454]'
            : 'text-[#768894] hover:text-white border-b-2 border-transparent hover:border-[#2b3d4d]'
        } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
        
      default: // 'default'
        return `${baseClasses} ${
          isActive
            ? 'text-white bg-[#2b3d4d] border-[#fa4454]'
            : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d] border-transparent'
        } ${tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`;
    }
  };

  const containerClasses = [
    'relative',
    orientation === 'horizontal' ? 'flex' : 'flex flex-col',
    centered && orientation === 'horizontal' ? 'justify-center' : '',
    fullWidth && orientation === 'horizontal' ? 'w-full' : '',
    className
  ].filter(Boolean).join(' ');

  const tabListClasses = [
    'relative flex',
    orientation === 'horizontal' ? 'flex-row' : 'flex-col',
    scrollable && orientation === 'horizontal' ? 'overflow-x-auto scrollbar-hide' : '',
    scrollable && orientation === 'vertical' ? 'overflow-y-auto scrollbar-hide' : '',
    fullWidth && orientation === 'horizontal' ? 'w-full' : '',
    variant === 'default' ? 'border-b border-[#2b3d4d]' : '',
    variant === 'pills' || variant === 'buttons' ? 'gap-2' : 'gap-0'
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      
      {/* Scroll Button - Left/Up */}
      {scrollable && showScrollButtons && canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className={`absolute z-10 ${
            orientation === 'horizontal' 
              ? 'left-0 top-1/2 -translate-y-1/2' 
              : 'top-0 left-1/2 -translate-x-1/2'
          } w-8 h-8 bg-[#1a2332] border border-[#2b3d4d] rounded-full flex items-center justify-center text-[#768894] hover:text-white hover:border-[#fa4454] transition-colors shadow-lg`}
          aria-label={orientation === 'horizontal' ? 'Scroll left' : 'Scroll up'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={orientation === 'horizontal' ? "M15 19l-7-7 7-7" : "M5 15l7-7 7 7"} 
            />
          </svg>
        </button>
      )}
      
      {/* Tab List */}
      <div
        ref={tabsRef}
        className={tabListClasses}
        role="tablist"
        aria-orientation={orientation}
        onKeyDown={handleKeyDown}
      >
        {/* Active Indicator */}
        {animated && (variant === 'default' || variant === 'underline') && (
          <div
            ref={indicatorRef}
            className={`absolute ${
              variant === 'underline' 
                ? 'bottom-0 h-0.5 bg-[#fa4454]' 
                : orientation === 'horizontal' 
                  ? 'bottom-0 h-0.5 bg-[#fa4454]' 
                  : 'left-0 w-0.5 bg-[#fa4454]'
            } transition-all duration-300 ease-out z-10`}
            style={{
              width: orientation === 'horizontal' ? '0px' : '2px',
              height: orientation === 'vertical' ? '0px' : '2px'
            }}
          />
        )}
        
        {/* Tabs */}
        {visibleTabs.map((tab) => {
          const isActive = tab.id === activeTab;
          
          return (
            <button
              key={tab.id}
              ref={isActive ? activeTabRef : null}
              className={`${getVariantClasses(tab, isActive)} ${tabClassName} ${
                isActive ? activeTabClassName : ''
              } ${fullWidth && orientation === 'horizontal' ? 'flex-1' : ''} 
              relative group flex items-center space-x-2 whitespace-nowrap`}
              onClick={() => handleTabChange(tab.id)}
              disabled={tab.disabled}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              title={tab.tooltip}
            >
              
              {/* Icon */}
              {tab.icon && (
                <span className="flex-shrink-0">
                  {tab.icon}
                </span>
              )}
              
              {/* Label */}
              <span className="truncate">{tab.label}</span>
              
              {/* Badge */}
              {tab.badge && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-[#fa4454] text-white text-xs rounded-full min-w-[1.25rem] text-center">
                  {typeof tab.badge === 'number' && tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
              
              {/* Close Button */}
              {tab.closable && (
                <button
                  onClick={(e) => handleTabClose(e, tab.id)}
                  className="flex-shrink-0 ml-2 p-0.5 rounded hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label={`Close ${tab.label}`}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Scroll Button - Right/Down */}
      {scrollable && showScrollButtons && canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className={`absolute z-10 ${
            orientation === 'horizontal' 
              ? 'right-0 top-1/2 -translate-y-1/2' 
              : 'bottom-0 left-1/2 -translate-x-1/2'
          } w-8 h-8 bg-[#1a2332] border border-[#2b3d4d] rounded-full flex items-center justify-center text-[#768894] hover:text-white hover:border-[#fa4454] transition-colors shadow-lg`}
          aria-label={orientation === 'horizontal' ? 'Scroll right' : 'Scroll down'}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={orientation === 'horizontal' ? "M9 5l7 7-7 7" : "M19 9l-7 7-7-7"} 
            />
          </svg>
        </button>
      )}
      
      {/* Tab Content */}
      {(children || renderTabContent) && (
        <div className={`mt-4 ${contentClassName}`}>
          {visibleTabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const shouldRender = !lazyLoad || loadedTabs.has(tab.id);
            
            if (!shouldRender && !isActive) return null;
            
            return (
              <div
                key={tab.id}
                id={`tabpanel-${tab.id}`}
                role="tabpanel"
                aria-labelledby={`tab-${tab.id}`}
                className={`${
                  isActive ? 'block' : 'hidden'
                } ${animated && isTransitioning ? 'opacity-50' : 'opacity-100'} 
                transition-opacity duration-150`}
              >
                {renderTabContent ? renderTabContent(tab.id) : children}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TabNavigation;
