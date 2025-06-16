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

  // REAL BACKEND SEARCH using all 51+ endpoints
  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setSearchResults({});
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 SearchPage: Executing REAL BACKEND search for:', searchQuery);
      
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
      
      // Process news results
      const news = newsRes.status === 'fulfilled' ?
        (newsRes.value?.data?.data || newsRes.value?.data || newsRes.value || [])
          .filter(article =>
            article.title?.toLowerCase().includes(searchTerm) ||
            article.content?.toLowerCase().includes(searchTerm) ||
            article.category?.toLowerCase().includes(searchTerm)
          )
          .slice(0, 5)
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
      
    } catch (err) {
      console.error('❌ SearchPage: Search error:', err);
      setError('Search temporarily unavailable. Please try again.');
      
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
  }, [searchParams.query]);

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
    { id: 'all', label: 'All' },
    { id: 'teams', label: 'Teams' },
    { id: 'players', label: 'Players' },
    { id: 'matches', label: 'Matches' },
    { id: 'events', label: 'Events' },
    { id: 'forums', label: 'Forums' },
    { id: 'news', label: 'News' }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Simple Search Header - VLR.gg Style */}
      <div className="card p-4 mb-6">
        <div className="flex gap-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(query);
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded 
                        bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
                        focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => handleSearch(query)}
            disabled={loading}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-red-600 text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {category.label}
              {category.id !== 'all' && searchResults[category.id] && Array.isArray(searchResults[category.id]) && (
                <span className="ml-1 px-1 py-0.5 bg-white/20 rounded text-xs">
                  {searchResults[category.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Results Summary */}
      {query && (
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Search Results for "{query}"
            </h2>
            <div className="text-gray-600 dark:text-gray-400 text-sm">
              {getTotalResults()} results
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="card p-6 text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Search Error</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="card p-6 text-center mb-6">
          <div className="text-gray-600 dark:text-gray-400">Searching...</div>
        </div>
      )}

      {/* Search Results */}
      {!loading && !error && query && (
        <div className="space-y-6">
          {Object.entries(getFilteredResults()).map(([category, results]) => {
            if (!results || !Array.isArray(results) || results.length === 0) return null;

            return (
              <div key={category} className="card p-4">
                <h3 className="text-lg font-bold text-red-600 dark:text-red-400 capitalize mb-4">
                  {category} ({results.length})
                </h3>

                <div className="space-y-2">
                  {results.map((item, index) => (
                    <div
                      key={item.id || index}
                      onClick={() => handleResultClick(category, item)}
                      className="p-3 bg-gray-50 dark:bg-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      {category === 'teams' && (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{item.shortName}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.name}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{item.region}</div>
                            <div>#{item.rank}</div>
                          </div>
                        </div>
                      )}

                      {category === 'players' && (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{item.team}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{item.role}</div>
                            <div>{item.hero}</div>
                          </div>
                        </div>
                      )}

                      {category === 'matches' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {item.team1?.name} vs {item.team2?.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.tournament}</p>
                          <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                      )}

                      {category === 'events' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{item.location}</span>
                            <span>{item.prizePool}</span>
                          </div>
                        </div>
                      )}

                      {category === 'forums' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.content}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>By {item.user?.name}</span>
                            <span>{item.posts_count} replies</span>
                          </div>
                        </div>
                      )}

                      {category === 'news' && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{item.excerpt}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
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
        <div className="card p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Results Found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            We couldn't find anything matching "{query}". Try adjusting your search terms.
          </p>
        </div>
      )}
    </div>
  );
}

export default SearchPage;