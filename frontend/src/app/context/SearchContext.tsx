// src/context/SearchContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { SearchContextType, SearchResult, SearchFilters, SearchQuery } from '@/lib/types';
import { storage, debounce } from '@/lib/utils';
import { STORAGE_KEYS, PERFORMANCE } from '@/lib/constants';

// Create context with proper default values
const SearchContext = createContext<SearchContextType>({
  query: '',
  results: [],
  isSearching: false,
  filters: {},
  recentSearches: [],
  suggestions: [],
  search: async () => {},
  clearSearch: () => {},
  addToHistory: () => {},
  clearHistory: () => {},
  setQuery: () => {},
  setFilters: () => {},
  popularSearches: [],
  searchStats: { totalResults: 0, searchTime: 0 },
});

// Custom hook to use search context
export function useSearch(): SearchContextType {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

// Provider component with comprehensive search functionality
export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQueryState] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFiltersState] = useState<SearchFilters>({});
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [searchStats, setSearchStats] = useState({ totalResults: 0, searchTime: 0 });
  const [searchCache, setSearchCache] = useState<Map<string, { results: SearchResult[]; timestamp: number }>>(new Map());

  // Initialize search data on mount
  useEffect(() => {
    initializeSearchData();
  }, []);

  // Initialize search data from storage
  const initializeSearchData = useCallback(() => {
    try {
      const storedSearches = storage.get<string[]>(STORAGE_KEYS.SEARCH_HISTORY) || [];
      setRecentSearches(storedSearches);

      // Load popular searches (could be from API)
      setPopularSearches([
        'Marvel Rivals',
        'tournament',
        'rankings',
        'patch notes',
        'meta heroes',
        'team compositions',
        'Thor guide',
        'Iron Man builds',
        'competitive tips',
        'latest matches',
      ]);
    } catch (error) {
      console.error('Error initializing search data:', error);
    }
  }, []);

  // Debounced search function for performance
  const debouncedSearch = useMemo(
    () => debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
      await performSearch(searchQuery, searchFilters);
    }, PERFORMANCE.DEBOUNCE_DELAYS.SEARCH),
    []
  );

  // Set query and trigger search
  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    
    if (newQuery.trim()) {
      // Generate suggestions based on query
      generateSuggestions(newQuery);
      
      // Perform search with debounce
      debouncedSearch(newQuery, filters);
    } else {
      // Clear results and suggestions when query is empty
      setResults([]);
      setSuggestions([]);
      setSearchStats({ totalResults: 0, searchTime: 0 });
    }
  }, [filters, debouncedSearch]);

  // Set filters and trigger search
  const setFilters = useCallback((newFilters: SearchFilters) => {
    setFiltersState(newFilters);
    
    if (query.trim()) {
      debouncedSearch(query, newFilters);
    }
  }, [query, debouncedSearch]);

  // Main search function
  const search = useCallback(async (searchQuery: string, searchFilters?: SearchFilters) => {
    const finalFilters = searchFilters || filters;
    
    setQueryState(searchQuery);
    setFiltersState(finalFilters);
    
    if (searchQuery.trim()) {
      await performSearch(searchQuery, finalFilters);
      addToHistory(searchQuery);
    }
  }, [filters]);

  // Perform the actual search
  const performSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    try {
      setIsSearching(true);
      const startTime = performance.now();

      // Create cache key
      const cacheKey = `${searchQuery}-${JSON.stringify(searchFilters)}`;
      
      // Check cache first (5 minute cache)
      const cached = searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
        setResults(cached.results);
        setSearchStats({
          totalResults: cached.results.length,
          searchTime: performance.now() - startTime,
        });
        return;
      }

      // Build search request
      const searchRequest: SearchQuery = {
        query: searchQuery,
        filters: searchFilters,
        page: 1,
        per_page: 50,
        sort_by: 'relevance',
        sort_order: 'desc',
      };

      // Perform API search
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchRequest),
      });

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const searchResponse = await response.json();
      const searchResults = searchResponse.results || [];

      // Update cache
      const newCache = new Map(searchCache);
      newCache.set(cacheKey, { results: searchResults, timestamp: Date.now() });
      
      // Keep cache size manageable (max 50 entries)
      if (newCache.size > 50) {
        const oldestKey = newCache.keys().next().value;
        newCache.delete(oldestKey);
      }
      
      setSearchCache(newCache);
      setResults(searchResults);
      
      // Update suggestions based on results
      if (searchResponse.suggestions) {
        setSuggestions(searchResponse.suggestions);
      }

      // Update search stats
      const endTime = performance.now();
      setSearchStats({
        totalResults: searchResponse.total || searchResults.length,
        searchTime: endTime - startTime,
      });

      // Track search event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'search', {
          search_term: searchQuery,
          search_results: searchResults.length,
        });
      }

    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
      setSuggestions([]);
      setSearchStats({ totalResults: 0, searchTime: 0 });
    } finally {
      setIsSearching(false);
    }
  }, [searchCache]);

  // Generate search suggestions
  const generateSuggestions = useCallback((searchQuery: string) => {
    const query = searchQuery.toLowerCase().trim();
    
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    // Combine recent searches and popular searches for suggestions
    const allSuggestions = [...recentSearches, ...popularSearches];
    
    // Filter suggestions that match the query
    const matchingSuggestions = allSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query) && 
        suggestion.toLowerCase() !== query
      )
      .slice(0, 8); // Limit to 8 suggestions

    // Add query-based suggestions
    const queryBasedSuggestions = generateQueryBasedSuggestions(query);
    
    // Combine and deduplicate
    const combinedSuggestions = [
      ...new Set([...matchingSuggestions, ...queryBasedSuggestions])
    ].slice(0, 6);

    setSuggestions(combinedSuggestions);
  }, [recentSearches, popularSearches]);

  // Generate intelligent query-based suggestions
  const generateQueryBasedSuggestions = useCallback((query: string): string[] => {
    const suggestions: string[] = [];
    
    // Hero-based suggestions
    const heroes = ['Thor', 'Iron Man', 'Spider-Man', 'Hulk', 'Doctor Strange', 'Scarlet Witch'];
    heroes.forEach(hero => {
      if (hero.toLowerCase().includes(query)) {
        suggestions.push(`${hero} guide`);
        suggestions.push(`${hero} builds`);
        suggestions.push(`${hero} counters`);
      }
    });

    // Game mode suggestions
    const modes = ['competitive', 'ranked', 'tournament'];
    modes.forEach(mode => {
      if (mode.includes(query)) {
        suggestions.push(`${mode} tips`);
        suggestions.push(`${mode} meta`);
      }
    });

    // General gaming suggestions
    if (query.includes('team')) {
      suggestions.push('team compositions', 'team rankings', 'team strategies');
    }
    
    if (query.includes('patch')) {
      suggestions.push('patch notes', 'patch analysis', 'patch tier list');
    }

    if (query.includes('meta')) {
      suggestions.push('meta heroes', 'meta builds', 'meta analysis');
    }

    return suggestions.slice(0, 3);
  }, []);

  // Add search to history
  const addToHistory = useCallback((searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery || trimmedQuery.length < 2) return;

    setRecentSearches(prev => {
      // Remove duplicate if exists
      const filtered = prev.filter(item => item.toLowerCase() !== trimmedQuery.toLowerCase());
      
      // Add to beginning and limit to 20 items
      const updated = [trimmedQuery, ...filtered].slice(0, 20);
      
      // Persist to storage
      storage.set(STORAGE_KEYS.SEARCH_HISTORY, updated);
      
      return updated;
    });
  }, []);

  // Clear search results and query
  const clearSearch = useCallback(() => {
    setQueryState('');
    setResults([]);
    setSuggestions([]);
    setSearchStats({ totalResults: 0, searchTime: 0 });
  }, []);

  // Clear search history
  const clearHistory = useCallback(() => {
    setRecentSearches([]);
    storage.remove(STORAGE_KEYS.SEARCH_HISTORY);
  }, []);

  // Get search results by type
  const getResultsByType = useCallback((type: SearchResult['type']) => {
    return results.filter(result => result.type === type);
  }, [results]);

  // Get search result count by type
  const getResultCountByType = useCallback((type: SearchResult['type']) => {
    return results.filter(result => result.type === type).length;
  }, [results]);

  // Check if search has results
  const hasResults = useCallback(() => {
    return results.length > 0;
  }, [results]);

  // Check if query is valid for searching
  const isValidQuery = useCallback((searchQuery: string) => {
    return searchQuery.trim().length >= 2;
  }, []);

  // Get formatted search time
  const getFormattedSearchTime = useCallback(() => {
    if (searchStats.searchTime === 0) return '';
    
    const time = searchStats.searchTime;
    if (time < 1000) {
      return `${Math.round(time)}ms`;
    } else {
      return `${(time / 1000).toFixed(2)}s`;
    }
  }, [searchStats.searchTime]);

  // Voice search functionality (if supported)
  const startVoiceSearch = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      return false;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      return new Promise((resolve) => {
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          resolve(true);
        };

        recognition.onerror = () => {
          resolve(false);
        };

        recognition.onend = () => {
          resolve(true);
        };

        recognition.start();
      });
    } catch (error) {
      console.error('Voice search failed:', error);
      return false;
    }
  }, [setQuery]);

  // Search analytics
  const trackSearchInteraction = useCallback((action: string, data?: any) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', `search_${action}`, {
        search_term: query,
        ...data,
      });
    }
  }, [query]);

  // Mobile-specific search optimizations
  const optimizeForMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      // Reduce search debounce delay on mobile for better responsiveness
      return true;
    }

    return false;
  }, []);

  // Context value with all functionality
  const value: SearchContextType = {
    // Core state
    query,
    results,
    isSearching,
    filters,
    recentSearches,
    suggestions,
    popularSearches,
    searchStats,

    // Core methods
    search,
    clearSearch,
    addToHistory,
    clearHistory,
    setQuery,
    setFilters,

    // Helper methods
    getResultsByType,
    getResultCountByType,
    hasResults,
    isValidQuery,
    getFormattedSearchTime,

    // Advanced features
    startVoiceSearch,
    trackSearchInteraction,
    optimizeForMobile,
  };

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

// Higher-order component for search-enabled components
export function withSearch<P extends object>(Component: React.ComponentType<P>) {
  return function SearchEnabledComponent(props: P) {
    const search = useSearch();
    return <Component {...props} search={search} />;
  };
}

// Hook for search keyboard shortcuts
export function useSearchShortcuts() {
  const { setQuery } = useSearch();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }

      // Escape to clear search
      if (event.key === 'Escape') {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput && document.activeElement === searchInput) {
          searchInput.blur();
          setQuery('');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setQuery]);
}

export default SearchContext;
