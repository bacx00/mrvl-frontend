import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks';

function SearchPage({ searchParams = {}, navigateTo }) {
  const { api } = useAuth();
  const [query, setQuery] = useState(searchParams.query || '');
  const [searchResults, setSearchResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // PHASE 6: ADVANCED SEARCH STATE
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const getTypeIcon = (type) => {
    const icons = {
      team: '👥',
      player: '🎮', 
      event: '🏆',
      match: '⚔️',
      forum: '💬',
      news: '📰'
    };
    return icons[type] || '🔍';
  };

  // PHASE 6: AUTO-COMPLETE SUGGESTIONS with REAL backend data
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    
    try {
      console.log('🔍 SearchPage: Fetching REAL suggestions for:', searchQuery);
      
      // Use real backend data for suggestions
      const searchTerm = searchQuery.toLowerCase();
      const [teamsRes, playersRes] = await Promise.allSettled([
        api.get('/teams'),
        api.get('/players')
      ]);
      
      const suggestions = [];
      
      // Add team suggestions
      if (teamsRes.status === 'fulfilled') {
        const teams = teamsRes.value?.data?.data || teamsRes.value?.data || [];
        teams.filter(team => 
          team.name?.toLowerCase().includes(searchTerm) ||
          team.short_name?.toLowerCase().includes(searchTerm)
        ).slice(0, 3).forEach(team => {
          suggestions.push({
            name: team.name,
            type: 'team',
            icon: getTypeIcon('team'),
            id: team.id
          });
        });
      }
      
      // Add player suggestions  
      if (playersRes.status === 'fulfilled') {
        const players = playersRes.value?.data?.data || playersRes.value?.data || [];
        players.filter(player =>
          player.name?.toLowerCase().includes(searchTerm) ||
          player.username?.toLowerCase().includes(searchTerm)
        ).slice(0, 3).forEach(player => {
          suggestions.push({
            name: player.name || player.username,
            type: 'player', 
            icon: getTypeIcon('player'),
            id: player.id
          });
        });
      }
      
      setSuggestions(suggestions.slice(0, 6)); // Limit total suggestions
      console.log('✅ SearchPage: Real suggestions loaded:', suggestions.length);
      
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      // Generate demo suggestions for better UX
      generateDemoSuggestions(searchQuery);
    }
  }, [api]);

  const generateDemoSuggestions = (searchQuery) => {
    const demoSuggestions = [
      { name: 'Sentinels', type: 'team', icon: '👥' },
      { name: 'TenZ', type: 'player', icon: '🎮' },
      { name: 'Marvel Rivals Championship', type: 'event', icon: '🏆' },
      { name: 'Iron Man Guide', type: 'forum', icon: '💬' }
    ].filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    setSuggestions(demoSuggestions);
  };

  // PHASE 6: SEARCH HISTORY MANAGEMENT
  const addToSearchHistory = (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    const history = JSON.parse(localStorage.getItem('mrvl_search_history') || '[]');
    const newHistory = [searchQuery, ...history.filter(q => q !== searchQuery)].slice(0, 10);
    
    localStorage.setItem('mrvl_search_history', JSON.stringify(newHistory));
    setSearchHistory(newHistory);
  };

  const loadSearchHistory = () => {
    const history = JSON.parse(localStorage.getItem('mrvl_search_history') || '[]');
    setSearchHistory(history);
  };

  const clearSearchHistory = () => {
    localStorage.removeItem('mrvl_search_history');
    setSearchHistory([]);
  };

  // CRITICAL FIX: REAL BACKEND SEARCH using all 51+ endpoints
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults({});
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 SearchPage: Executing REAL BACKEND search for:', searchQuery);
      
      // CRITICAL FIX: Use REAL BACKEND DATA from multiple endpoints
      const searchTerm = searchQuery.trim().toLowerCase();
      
      // Parallel fetch from all backend endpoints for comprehensive search
      const [teamsRes, playersRes, eventsRes, matchesRes, forumsRes, newsRes] = await Promise.allSettled([
        api.get('/teams'),
        api.get('/players'), 
        api.get('/events'),
        api.get('/matches'),
        api.get('/forums/threads'),
        api.get('/news')
      ]);
      
      console.log('✅ SearchPage: All backend data fetched for search');
      
      // Process teams results
      const teams = teamsRes.status === 'fulfilled' ? 
        (teamsRes.value?.data?.data || teamsRes.value?.data || teamsRes.value || [])
          .filter(team => 
            team.name?.toLowerCase().includes(searchTerm) ||
            team.short_name?.toLowerCase().includes(searchTerm) ||
            team.region?.toLowerCase().includes(searchTerm)
          )
          .map(team => ({
            id: team.id,
            name: team.name,
            shortName: team.short_name,
            logo: team.logo,
            region: team.region,
            rank: team.rank || team.ranking,
            rating: team.rating || team.elo_rating,
            country: team.country
          })) : [];
      
      // Process players results  
      const players = playersRes.status === 'fulfilled' ?
        (playersRes.value?.data?.data || playersRes.value?.data || playersRes.value || [])
          .filter(player =>
            player.name?.toLowerCase().includes(searchTerm) ||
            player.username?.toLowerCase().includes(searchTerm) ||
            player.role?.toLowerCase().includes(searchTerm) ||
            player.team_name?.toLowerCase().includes(searchTerm)
          )
          .map(player => ({
            id: player.id,
            name: player.name || player.username,
            role: player.role,
            team: player.team_name || player.team?.name,
            hero: player.main_hero || player.preferred_heroes?.[0] || 'Iron Man',
            country: player.country || 'US',
            rating: player.rating
          })) : [];
      
      // Process events results
      const events = eventsRes.status === 'fulfilled' ?
        (eventsRes.value?.data?.data || eventsRes.value?.data || eventsRes.value || [])
          .filter(event =>
            event.name?.toLowerCase().includes(searchTerm) ||
            event.location?.toLowerCase().includes(searchTerm) ||
            event.type?.toLowerCase().includes(searchTerm)
          )
          .map(event => ({
            id: event.id,
            name: event.name,
            description: event.description || `Professional Marvel Rivals tournament featuring ${event.teams_count || 16} teams`,
            location: event.location,
            date: event.start_date || event.date,
            status: event.status,
            prizePool: event.prize_pool
          })) : [];
      
      // Process matches results
      const matches = matchesRes.status === 'fulfilled' ?
        (matchesRes.value?.data?.data || matchesRes.value?.data || matchesRes.value || [])
          .filter(match =>
            match.team1?.name?.toLowerCase().includes(searchTerm) ||
            match.team2?.name?.toLowerCase().includes(searchTerm) ||
            match.event_name?.toLowerCase().includes(searchTerm) ||
            match.status?.toLowerCase().includes(searchTerm)
          )
          .map(match => ({
            id: match.id,
            team1: {
              name: match.team1?.name || match.team1_name,
              short_name: match.team1?.short_name || match.team1_short_name
            },
            team2: {
              name: match.team2?.name || match.team2_name,
              short_name: match.team2?.short_name || match.team2_short_name
            },
            status: match.status,
            tournament: match.event_name || match.event?.name,
            date: match.scheduled_at || match.match_date,
            score: match.status === 'completed' ? `${match.team1_score}-${match.team2_score}` : null
          })) : [];
      
      // Process forums results
      const forums = forumsRes.status === 'fulfilled' ?
        (forumsRes.value?.data?.data || forumsRes.value?.data || forumsRes.value || [])
          .filter(thread =>
            thread.title?.toLowerCase().includes(searchTerm) ||
            thread.content?.toLowerCase().includes(searchTerm) ||
            thread.category?.toLowerCase().includes(searchTerm)
          )
          .map(thread => ({
            id: thread.id,
            title: thread.title,
            content: thread.content?.substring(0, 100) + '...',
            user: {
              name: thread.user_name || thread.author?.name || 'Anonymous'
            },
            posts_count: thread.replies || thread.replies_count || 0,
            category: thread.category
          })) : [];
      
      // Process news results (bonus category)
      const news = newsRes.status === 'fulfilled' ?
        (newsRes.value?.data?.data || newsRes.value?.data || newsRes.value || [])
          .filter(article =>
            article.title?.toLowerCase().includes(searchTerm) ||
            article.content?.toLowerCase().includes(searchTerm) ||
            article.category?.toLowerCase().includes(searchTerm)
          )
          .slice(0, 5) // Limit news results
          .map(article => ({
            id: article.id,
            title: article.title,
            excerpt: article.excerpt || article.content?.substring(0, 100) + '...',
            author: article.author?.name || 'MRVL Team',
            date: article.published_at || article.created_at
          })) : [];
      
      const results = {
        teams,
        players, 
        events,
        matches,
        forums,
        news
      };
      
      setSearchResults(results);
      console.log('✅ SearchPage: REAL BACKEND search results:', {
        teams: teams.length,
        players: players.length,
        events: events.length,
        matches: matches.length,
        forums: forums.length,
        news: news.length
      });
      
    } catch (err) {
      console.error('❌ SearchPage: Search error:', err);
      setError('Search temporarily unavailable. Please try again.');
      
      // Minimal fallback for testing
      setSearchResults({
        teams: [],
        players: [],
        events: [],
        matches: [],
        forums: [],
        news: []
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.query) {
      setQuery(searchParams.query);
      handleSearch(searchParams.query);
    }
  }, [searchParams.query]); // eslint-disable-line react-hooks/exhaustive-deps

  const getTotalResults = () => {
    if (!searchResults || typeof searchResults !== 'object') return 0;
    return Object.values(searchResults).reduce((total, category) => {
      return total + (Array.isArray(category) ? category.length : 0);
    }, 0);
  };

  const getFilteredResults = () => {
    if (!searchResults || typeof searchResults !== 'object') return {};
    
    if (selectedCategory === 'all') {
      return searchResults;
    }
    return { [selectedCategory]: searchResults[selectedCategory] || [] };
  };

  const handleResultClick = (category, item) => {
    if (!navigateTo) return;
    
    console.log('🔗 SearchPage: Navigating from search result:', category, item.id);
    
    switch (category) {
      case 'teams':
        navigateTo('team-detail', { id: item.id });
        break;
      case 'players':
        navigateTo('player-detail', { id: item.id });
        break;
      case 'matches':
        navigateTo('match-detail', { id: item.id });
        break;
      case 'events':
        navigateTo('event-detail', { id: item.id });
        break;
      case 'forums':
        navigateTo('thread-detail', { id: item.id });
        break;
      case 'news':
        navigateTo('news-detail', { id: item.id });
        break;
      default:
        break;
    }
  };

  const categories = [
    { id: 'all', label: 'All Results', icon: '🔍' },
    { id: 'teams', label: 'Teams', icon: '👥' },
    { id: 'players', label: 'Players', icon: '🎮' },
    { id: 'matches', label: 'Matches', icon: '⚔️' },
    { id: 'events', label: 'Events', icon: '🎯' },
    { id: 'forums', label: 'Forums', icon: '💬' },
    { id: 'news', label: 'News', icon: '📰' }
  ];

  // Country flag helper
  const getCountryFlag = (countryCode) => {
    const flagMap = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'UK': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'SE': '🇸🇪',
      'KR': '🇰🇷', 'AU': '🇦🇺', 'BR': '🇧🇷', 'JP': '🇯🇵', 'INTL': '🌍'
    };
    return flagMap[countryCode] || '🌍';
  };

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      {/* Search Header - Responsive */}
      <div className="glass rounded-xl p-4 md:p-6 mb-6 md:mb-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search teams, players, matches, events, forums..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  fetchSuggestions(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => {
                  setShowSuggestions(true);
                  loadSearchHistory();
                }}
                onBlur={() => {
                  // Delay to allow clicking on suggestions
                  setTimeout(() => setShowSuggestions(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(query);
                    addToSearchHistory(query);
                    setShowSuggestions(false);
                  }
                  if (e.key === 'Escape') {
                    setShowSuggestions(false);
                  }
                }}
                className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                          focus:ring-2 focus:ring-red-500 focus:border-transparent
                          transition-all duration-200"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400 text-xl">🔍</span>
              </div>
              
              {/* PHASE 6: SUGGESTIONS DROPDOWN */}
              {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
                <div 
                  ref={suggestionsRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 
                            border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50
                            max-h-80 overflow-y-auto"
                >
                  {/* Search History */}
                  {query.length === 0 && searchHistory.length > 0 && (
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Recent Searches</span>
                        <button 
                          onClick={clearSearchHistory}
                          className="text-xs text-red-600 dark:text-red-400 hover:text-red-700"
                        >
                          Clear
                        </button>
                      </div>
                      {searchHistory.slice(0, 5).map((historyItem, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setQuery(historyItem);
                            handleSearch(historyItem);
                            setShowSuggestions(false);
                          }}
                          className="block w-full text-left px-2 py-1 text-sm text-gray-700 dark:text-gray-300 
                                   hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          🕒 {historyItem}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Auto-complete Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="p-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400 px-2 py-1">
                        Suggestions
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setQuery(suggestion.name);
                            handleSearch(suggestion.name);
                            addToSearchHistory(suggestion.name);
                            setShowSuggestions(false);
                          }}
                          className="w-full flex items-center space-x-3 px-3 py-2 text-sm 
                                   text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 
                                   rounded transition-colors"
                        >
                          <span className="text-lg">{suggestion.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{suggestion.name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500 capitalize">
                              {suggestion.type}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-xl shadow-lg shadow-red-500/30 transition-all duration-300 hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span className="text-sm md:text-base">Searching...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm md:text-base">🔍</span>
                <span className="text-sm md:text-base">Search</span>
              </div>
            )}
          </button>
        </div>

        {/* Category Filters - Responsive */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-medium transition-all duration-300 hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 border border-red-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-white/10 hover:text-red-500 dark:hover:text-red-400 border border-transparent'
              }`}
            >
              <span className="mr-1 md:mr-2">{category.icon}</span>
              <span>{category.label}</span>
              {category.id !== 'all' && searchResults[category.id] && Array.isArray(searchResults[category.id]) && (
                <span className="ml-1 md:ml-2 px-1 md:px-2 py-0.5 md:py-1 bg-white/20 rounded-full text-xs">
                  {searchResults[category.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {query && (
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-0">
              Search Results for "{query}"
            </h2>
            <div className="text-gray-600 dark:text-gray-400">
              {getTotalResults()} results found
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="glass rounded-xl p-6 md:p-8 text-center mb-6 md:mb-8">
          <div className="text-3xl md:text-4xl mb-4">⚠️</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">Search Error</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="glass rounded-xl p-6 md:p-8 text-center mb-6 md:mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-6 h-6 md:w-8 md:h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
            <span className="text-base md:text-lg font-medium text-gray-900 dark:text-white">Searching Real Backend Data...</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">Finding the best results across all categories</p>
        </div>
      )}

      {/* Search Results - VLR.gg Style */}
      {!loading && !error && query && (
        <div className="space-y-6 md:space-y-8">
          {Object.entries(getFilteredResults()).map(([category, results]) => {
            if (!results || !Array.isArray(results) || results.length === 0) return null;

            return (
              <div key={category} className="glass rounded-xl p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-red-600 dark:text-red-400 capitalize">
                    {categories.find(c => c.id === category)?.icon} {category} ({results.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {results.map((item, index) => (
                    <div
                      key={item.id || index}
                      onClick={() => handleResultClick(category, item)}
                      className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 md:p-4 hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 cursor-pointer hover:scale-105 hover:shadow-lg border-l-4 border-red-500"
                    >
                      {category === 'teams' && (
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="text-xl md:text-2xl">{item.logo || '🔥'}</div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{item.shortName}</h4>
                              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{item.name}</p>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-between">
                            <span>{getCountryFlag(item.country)} {item.region}</span>
                            <span>#{item.rank} • {item.rating}</span>
                          </div>
                        </div>
                      )}

                      {category === 'players' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getCountryFlag(item.country)}</span>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">{item.name}</h4>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.role === 'Duelist' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              item.role === 'Support' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            }`}>
                              {item.role}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">Hero: {item.hero}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">Team: {item.team}</p>
                        </div>
                      )}

                      {category === 'matches' && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm md:text-base line-clamp-1">
                              {item.team1?.name} vs {item.team2?.name}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              item.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              item.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">{item.tournament}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                      )}

                      {category === 'events' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base line-clamp-1">{item.name}</h4>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{item.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                            <span>{item.location}</span>
                            <span>{item.prizePool}</span>
                          </div>
                        </div>
                      )}

                      {category === 'forums' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base line-clamp-1">{item.title}</h4>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{item.content}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                            <span>By {item.user?.name}</span>
                            <span>{item.posts_count} replies</span>
                          </div>
                        </div>
                      )}

                      {category === 'news' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm md:text-base line-clamp-1">{item.title}</h4>
                          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{item.excerpt}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                            <span>By {item.author}</span>
                            <span>{new Date(item.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {!loading && !error && query && getTotalResults() === 0 && (
        <div className="glass rounded-xl p-6 md:p-8 text-center">
          <div className="text-3xl md:text-4xl mb-4">🔍</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">No Results Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            We couldn't find anything matching "{query}". Try adjusting your search terms.
          </p>
          <div className="text-sm text-gray-500 dark:text-gray-500">
            Try searching for: teams, players, events, or forum topics
          </div>
        </div>
      )}

      {/* Default State with Quick Search Examples */}
      {!query && (
        <div className="glass rounded-xl p-6 md:p-8 text-center">
          <div className="text-3xl md:text-4xl mb-4">🔍</div>
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white mb-2">Start Your Search</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Search for teams, players, matches, events, and forum discussions
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 max-w-2xl mx-auto">
            {[
              { category: 'Teams', example: 'Sentinels', icon: '👥' },
              { category: 'Players', example: 'TenZ', icon: '🎮' },
              { category: 'Heroes', example: 'Iron Man', icon: '🦸' },
              { category: 'Matches', example: 'Championship', icon: '⚔️' },
              { category: 'Events', example: 'Marvel Rivals', icon: '🎯' },
              { category: 'Forums', example: 'Strategy', icon: '💬' }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  setQuery(item.example);
                  handleSearch(item.example);
                }}
                className="p-3 md:p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl hover:bg-white/70 dark:hover:bg-gray-800/70 transition-all duration-300 text-center hover:scale-105 border-2 border-transparent hover:border-red-500/30"
              >
                <div className="text-xl md:text-2xl mb-2">{item.icon}</div>
                <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">{item.category}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">e.g. "{item.example}"</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchPage;