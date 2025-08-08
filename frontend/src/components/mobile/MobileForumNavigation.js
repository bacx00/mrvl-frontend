import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, ChevronDown, Menu, X, TrendingUp, MessageCircle, Bookmark, Share2 } from 'lucide-react';

const MobileForumNavigation = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onCreateThread,
  showSearchSuggestions = false,
  searchSuggestions = [],
  onSearchSuggestionSelect,
  isAuthenticated = false
}) => {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [headerVisible, setHeaderVisible] = useState(true);

  const searchInputRef = useRef(null);
  const navigationRef = useRef(null);
  const startY = useRef(0);

  // Smart header hide/show on scroll
  useEffect(() => {
    let ticking = false;

    const updateHeaderVisibility = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);

      if (scrollDifference > 10) { // Threshold to prevent jittery hiding
        if (isScrollingDown && currentScrollY > 100) {
          setHeaderVisible(false);
        } else if (!isScrollingDown) {
          setHeaderVisible(true);
        }
      }

      setLastScrollY(currentScrollY);
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateHeaderVisibility);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Pull-to-refresh functionality
  const handleTouchStart = useCallback((e) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (startY.current && window.scrollY === 0) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, Math.min(120, currentY - startY.current));
      setPullDistance(distance);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 80) {
      setIsRefreshing(true);
      // Trigger refresh callback
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate refresh
        // Call parent refresh function here
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    startY.current = 0;
  }, [pullDistance]);

  // Search handling with debouncing
  const handleSearchInput = useCallback((value) => {
    onSearchChange(value);
    setShowSearchDropdown(value.length > 0 && searchSuggestions.length > 0);
  }, [onSearchChange, searchSuggestions.length]);

  // Category filter with haptic feedback
  const handleCategorySelect = useCallback((categorySlug) => {
    // Haptic feedback for supported devices
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
    onCategoryChange(categorySlug);
  }, [onCategoryChange]);

  // Sort options
  const sortOptions = [
    { value: 'latest', label: 'Latest', icon: TrendingUp },
    { value: 'popular', label: 'Popular', icon: MessageCircle },
    { value: 'hot', label: 'Hot', icon: '🔥' }
  ];

  return (
    <>
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200"
          style={{ 
            transform: `translateX(-50%) translateY(${Math.max(0, pullDistance - 80)}px)` 
          }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`}>
              🔄
            </div>
          </div>
        </div>
      )}

      {/* Mobile Forum Navigation Header */}
      <div 
        ref={navigationRef}
        className={`lg:hidden fixed top-16 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 transition-transform duration-300 ${
          headerVisible ? 'transform translate-y-0' : 'transform -translate-y-full'
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="px-4 py-3">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Forums</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 touch-optimized transition-all duration-200 active:scale-95"
              >
                <Filter className="w-5 h-5" />
              </button>
              {isAuthenticated && (
                <button 
                  onClick={onCreateThread}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors touch-optimized"
                >
                  <Plus className="w-4 h-4 inline-block mr-1" />
                  New
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="relative mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchInput(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 200);
                  setTimeout(() => setShowSearchDropdown(false), 200);
                }}
                placeholder="Search discussions..."
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-red-500 mobile-input-no-zoom transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchInput('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Enhanced Search Suggestions */}
            {showSearchDropdown && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-80 overflow-y-auto">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSearchSuggestionSelect(suggestion);
                      setShowSearchDropdown(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors touch-optimized"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                          {suggestion.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {suggestion.category} • {suggestion.replies} replies
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
            <button
              onClick={() => handleCategorySelect('all')}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 touch-optimized ${
                selectedCategory === 'all'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              All
            </button>
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => handleCategorySelect(category.slug)}
                className={`flex-shrink-0 px-4 py-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap touch-optimized ${
                  selectedCategory === category.slug
                    ? 'bg-red-500 text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category.icon} {category.name}
              </button>
            ))}
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl animate-slide-down">
              {/* Sort Options */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort by</h3>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => {
                    const IconComponent = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition-all duration-200 touch-optimized ${
                          sortBy === option.value
                            ? 'bg-red-500 text-white'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {typeof option.icon === 'string' ? (
                          <span>{option.icon}</span>
                        ) : (
                          <IconComponent className="w-4 h-4" />
                        )}
                        <span className="text-sm">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* View Mode Toggle */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">View</h3>
                <div className="flex bg-white dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => onViewModeChange('list')}
                    className={`flex-1 px-3 py-2 rounded-md font-medium transition-all duration-200 touch-optimized ${
                      viewMode === 'list'
                        ? 'bg-red-500 text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => onViewModeChange('compact')}
                    className={`flex-1 px-3 py-2 rounded-md font-medium transition-all duration-200 touch-optimized ${
                      viewMode === 'compact'
                        ? 'bg-red-500 text-white'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Quick Actions */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <div className="flex flex-col space-y-2">
          {/* Quick Reply FAB */}
          {isAuthenticated && (
            <button
              onClick={onCreateThread}
              className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg flex items-center justify-center touch-optimized transition-all duration-200 active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          )}
          
          {/* Scroll to Top FAB */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="w-12 h-12 bg-gray-600 hover:bg-gray-700 text-white rounded-full shadow-lg flex items-center justify-center touch-optimized transition-all duration-200 active:scale-95"
          >
            ↑
          </button>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .mobile-input-no-zoom {
          font-size: 16px !important;
          transform: translateZ(0);
        }

        .touch-optimized {
          min-height: 44px;
          min-width: 44px;
          -webkit-tap-highlight-color: rgba(239, 68, 68, 0.1);
          tap-highlight-color: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </>
  );
};

export default MobileForumNavigation;