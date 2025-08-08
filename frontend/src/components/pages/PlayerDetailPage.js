import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar, TeamLogo, getCountryFlag, getHeroImageSync } from '../../utils/imageUtils';
import { parseTextWithMentions } from '../shared/UserDisplay';
import MentionsSection from '../shared/MentionsSection';
import { HEROES } from '../../constants/marvelRivalsData';

function PlayerDetailPage({ params, navigateTo }) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState({});
  const [matchHistory, setMatchHistory] = useState([]);
  const [heroStats, setHeroStats] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [mapStats, setMapStats] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
  const [filters, setFilters] = useState({ date_from: '', date_to: '', event_id: '', hero: '', map: '' });
  const { api } = useAuth();

  const playerId = params?.id;

  // Country names mapping
  const countryNames = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'ES': 'Spain',
    'IT': 'Italy',
    'NL': 'Netherlands',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'AU': 'Australia',
    'NZ': 'New Zealand',
    'JP': 'Japan',
    'KR': 'South Korea',
    'CN': 'China',
    'TW': 'Taiwan',
    'SG': 'Singapore',
    'TH': 'Thailand',
    'VN': 'Vietnam',
    'ID': 'Indonesia',
    'MY': 'Malaysia',
    'PH': 'Philippines',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru',
    'MX': 'Mexico',
    'RU': 'Russia',
    'PL': 'Poland',
    'CZ': 'Czech Republic',
    'HU': 'Hungary',
    'RO': 'Romania',
    'BG': 'Bulgaria',
    'IN': 'India',
    'PK': 'Pakistan',
    'BD': 'Bangladesh',
    'LK': 'Sri Lanka',
    'NP': 'Nepal',
    'ZA': 'South Africa',
    'EG': 'Egypt',
    'MA': 'Morocco',
    'NG': 'Nigeria',
    'KE': 'Kenya',
    'GH': 'Ghana',
    'TN': 'Tunisia'
  };

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive player data from API
      const response = await api.get(`/players/${playerId}`);
      const playerData = response.data?.data || response.data || response;
      
      // Transform backend data to frontend format
      const transformedPlayer = {
        id: playerData.id,
        username: playerData.username,
        realName: playerData.real_name,
        avatar: playerData.avatar,
        country: playerData.country,
        flag: playerData.flag || getCountryFlag(playerData.country),
        age: playerData.age,
        status: playerData.status,
        biography: playerData.biography,
        
        // Role and heroes
        role: playerData.role,
        mainHero: playerData.main_hero,
        altHeroes: playerData.alt_heroes || [],
        
        // Team information
        currentTeam: playerData.current_team,
        teamHistory: playerData.team_history || playerData.past_teams || [],
        
        // Social media
        socialMedia: playerData.social_media || {},
        streaming: playerData.streaming || {},
        
        // Marvel Rivals specific
        region: playerData.region,
        lastActive: playerData.last_active,
        totalEarnings: playerData.total_earnings || 0,
        
        // Event data
        eventPlacements: playerData.event_placements || [],
        heroStats: playerData.hero_stats || []
      };
      
      // Set player data
      setPlayer(transformedPlayer);
      
      // Set comprehensive stats from backend
      if (playerData.stats) {
        setStats(playerData.stats);
      }
      
      // Load comprehensive player statistics using new API endpoints
      await fetchPlayerStats();
      
    } catch (error) {
      console.error('Error fetching player data:', error);
      setPlayer(null);
      setStats({});
      setMatchHistory([]);
      setHeroStats([]);
      setPerformanceStats(null);
      setMapStats([]);
      setEventStats([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch comprehensive player statistics from new API endpoints
  const fetchPlayerStats = async (page = 1, currentFilters = filters) => {
    if (!playerId) return;
    
    try {
      setDataLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString(),
        ...Object.fromEntries(Object.entries(currentFilters).filter(([_, value]) => value))
      });
      
      // Fetch all player statistics in parallel
      const [matchHistoryResponse, heroStatsResponse, performanceResponse, mapStatsResponse, eventStatsResponse] = await Promise.all([
        api.get(`/public/players/${playerId}/matches?${params}`).catch(() => ({ data: { data: [], meta: {} } })),
        api.get(`/public/players/${playerId}/hero-stats?${params}`).catch(() => ({ data: { data: [] } })),
        api.get(`/public/players/${playerId}/performance-stats?${params}`).catch(() => ({ data: { data: {} } })),
        api.get(`/public/players/${playerId}/map-stats?${params}`).catch(() => ({ data: { data: [] } })),
        api.get(`/public/players/${playerId}/event-stats?${params}`).catch(() => ({ data: { data: [] } }))
      ]);
      
      // Set match history with pagination
      const matchData = matchHistoryResponse.data.data || [];
      setMatchHistory(matchData);
      if (matchHistoryResponse.data.meta) {
        setPagination(matchHistoryResponse.data.meta);
      }
      
      // Set hero statistics
      const heroData = heroStatsResponse.data.data || [];
      setHeroStats(heroData);
      
      // Set performance statistics (overall career stats)
      const perfData = performanceResponse.data.data || {};
      setPerformanceStats(perfData);
      
      // Set map statistics
      const mapData = mapStatsResponse.data.data || [];
      setMapStats(mapData);
      
      // Set event statistics
      const eventData = eventStatsResponse.data.data || [];
      setEventStats(eventData);
      
      console.log('Player stats loaded:', {
        matches: matchData.length,
        heroes: heroData.length,
        maps: mapData.length,
        events: eventData.length
      });
      
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Handle tab change and load data if needed
  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab !== 'overview' && matchHistory.length === 0) {
      await fetchPlayerStats();
    }
  };

  // Handle filter changes
  const handleFilterChange = async (newFilters) => {
    setFilters(newFilters);
    await fetchPlayerStats(1, newFilters);
  };

  // Handle pagination
  const handlePageChange = async (page) => {
    await fetchPlayerStats(page);
  };

  const formatCurrency = (amount) => {
    if (typeof amount === 'string' && amount.includes('$')) return amount;
    return `$${(amount || 0).toLocaleString()}`;
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'Duelist': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 border-red-300 dark:border-red-700';
      case 'Vanguard': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 border-blue-300 dark:border-blue-700';
      case 'Strategist': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 border-green-300 dark:border-green-700';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl font-bold text-gray-300 dark:text-gray-700 mb-4">Not Found</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Player Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The player you're looking for doesn't exist or may have been removed.
        </p>
        <button
          onClick={() => navigateTo('players')}
          className="btn bg-red-600 text-white hover:bg-red-700"
        >
          View All Players
        </button>
      </div>
    );
  }

  return (
    <>
    <div className="animate-fade-in">
      {/* VLR.gg Style Player Header */}
      <div className="card mb-8">
        <div className="border border-white dark:border-gray-300 p-8 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <PlayerAvatar player={player} size="w-24 h-24" className="ring-4 ring-white/20" />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{player.username || player.realName}</h1>
                <div className="text-xl text-gray-600 dark:text-gray-300 mb-2">{player.realName || player.username}</div>
                <div className="flex items-center space-x-4 mb-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(player.role)}`}>
                    {player.role}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{player.flag || getCountryFlag(player.country)}</span>
                    <span className="text-gray-600 dark:text-gray-300">{countryNames[player.country] || player.country}</span>
                  </div>
                </div>
                {/* Social Links - VLR.gg Style */}
                {player.socialMedia && Object.keys(player.socialMedia).length > 0 && (
                  <div className="flex items-center space-x-4">
                    {player.socialMedia.twitter && (
                      <a 
                        href={`https://twitter.com/${player.socialMedia.twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-white hover:text-red-200 transition-colors"
                      >
                        Twitter
                      </a>
                    )}
                    {player.socialMedia.twitch && (
                      <a 
                        href={`https://twitch.tv/${player.socialMedia.twitch}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-white hover:text-red-200 transition-colors"
                      >
                        Twitch
                      </a>
                    )}
                    {player.socialMedia.youtube && (
                      <a 
                        href={`https://youtube.com/@${player.socialMedia.youtube}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-white hover:text-red-200 transition-colors"
                      >
                        YouTube
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">{formatCurrency(player.totalEarnings)}</div>
              <div className="text-sm text-red-100">Total Earnings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout - VLR.gg Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">

          {/* Player Basic Info */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Player Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Age</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.age || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Role</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.role}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Region</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.region || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Rating</div>
                <div className="font-medium text-yellow-600 dark:text-yellow-400 mt-1">{player.rating || 1500}</div>
              </div>
            </div>
          </div>

          {/* Current Team */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Current Team</h3>
            {(player.currentTeam || player.current_team) ? (
              <div className="flex items-center space-x-4">
                <TeamLogo team={player.currentTeam || player.current_team} size="w-12 h-12" />
                <div>
                  <button
                    onClick={() => navigateTo('team-detail', { id: (player.currentTeam || player.current_team).id })}
                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                  >
                    {(player.currentTeam || player.current_team).name}
                  </button>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(player.currentTeam || player.current_team).region || (player.currentTeam || player.current_team).country}
                  </div>
                </div>
              </div>
            ) : player.team_name ? (
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">{player.team_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{player.team_region || player.team_country || ''}</p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-500">Free Agent</p>
            )}
          </div>


          {/* Tabs for Different Views */}
          <div className="card mb-6">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => handleTabChange('heroes')}
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'heroes'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>Heroes</span>
                {heroStats.length > 0 && (
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                    {heroStats.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('matches')}
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'matches'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>Match History</span>
                {matchHistory.length > 0 && (
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                    {matchHistory.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('maps')}
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'maps'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>Maps</span>
                {mapStats.length > 0 && (
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                    {mapStats.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('events')}
                className={`px-6 py-3 text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === 'events'
                    ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <span>Events</span>
                {eventStats.length > 0 && (
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                    {eventStats.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Hero Performance Stats */}
          {activeTab === 'heroes' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Hero Performance</h3>
                {dataLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                  </div>
                )}
              </div>
              {heroStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Hero</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Usage</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Rounds</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Rating</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">ACS</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">K:D</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">ADR</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">KAST</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">HS%</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">FK</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">FD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {heroStats.map((hero, index) => {
                        const totalRounds = heroStats.reduce((sum, h) => sum + (h.rounds_played || h.maps_played * 15 || 0), 0);
                        const usagePercent = totalRounds > 0 ? ((hero.rounds_played || hero.maps_played * 15 || 0) / totalRounds * 100) : 0;
                        const kd = hero.avg_deaths > 0 ? (hero.avg_eliminations / hero.avg_deaths) : hero.avg_eliminations;
                        
                        return (
                          <tr 
                            key={index}
                            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden flex items-center justify-center">
                                  {getHeroImageSync(hero.hero_name) ? (
                                    <img 
                                      src={getHeroImageSync(hero.hero_name)} 
                                      alt={hero.hero_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                      {hero.hero_name?.substring(0, 2).toUpperCase() || 'H'}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 dark:text-white">{hero.hero_name}</div>
                                  <div className="text-xs text-gray-500">{hero.role || 'Flex'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-red-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(usagePercent, 100)}%` }}
                                  />
                                </div>
                                <span className="text-sm text-gray-900 dark:text-white">
                                  {usagePercent.toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {hero.rounds_played || hero.maps_played * 15 || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-medium ${
                                hero.avg_performance_rating >= 1.2 ? 'text-green-600 dark:text-green-400' :
                                hero.avg_performance_rating >= 0.9 ? 'text-gray-900 dark:text-white' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {(hero.avg_performance_rating || 0).toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {Math.round(hero.avg_combat_score || hero.avg_damage * 0.5 || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-sm font-medium ${
                                kd >= 1.2 ? 'text-green-600 dark:text-green-400' :
                                kd >= 0.9 ? 'text-gray-900 dark:text-white' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {kd.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {Math.round(hero.avg_damage || 0)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {hero.kast_percentage ? `${hero.kast_percentage.toFixed(0)}%` : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {hero.headshot_percentage ? `${hero.headshot_percentage.toFixed(0)}%` : '-'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {hero.first_kills || '0'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-sm text-gray-900 dark:text-white">
                                {hero.first_deaths || '0'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-500">
                    {dataLoading ? 'Loading hero statistics...' : 'No hero statistics available'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Match History Tab - VLR.gg Style */}
          {activeTab === 'matches' && (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Event</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Opponent</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Result</th>
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Hero</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Rating</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">ACS</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">K/D/A</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">K:D</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">ADR</th>
                      <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">KAST</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchHistory.map((match, index) => (
                      <tr 
                        key={index}
                        onClick={() => navigateTo('match-detail', { id: match.match_id || match.id })}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {match.event_logo && (
                              <img 
                                src={match.event_logo} 
                                alt={match.event_name}
                                className="w-6 h-6 rounded"
                                onError={(e) => { e.target.src = getImageUrl(null, 'event-banner'); }}
                              />
                            )}
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {match.event_name || 'Scrim'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {match.opponent_logo && (
                              <img 
                                src={match.opponent_logo} 
                                alt={match.opponent_name}
                                className="w-6 h-6 rounded"
                                onError={(e) => { e.target.src = getImageUrl(null, 'team-logo'); }}
                              />
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {match.opponent_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className={`inline-flex items-center space-x-1 text-sm font-bold ${
                            match.won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            <span>{match.won ? 'W' : 'L'}</span>
                            <span className="text-xs">
                              {match.team_score || match.score || '0'}-{match.opponent_score || '0'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            {getHeroImageSync(match.hero || match.hero_played) && (
                              <img 
                                src={getHeroImageSync(match.hero || match.hero_played)} 
                                alt={match.hero || match.hero_played}
                                className="w-6 h-6 rounded"
                              />
                            )}
                            <span className="text-sm text-gray-900 dark:text-white">
                              {match.hero || match.hero_played}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${
                            match.performance_rating >= 1.2 ? 'text-green-600 dark:text-green-400' :
                            match.performance_rating >= 0.9 ? 'text-gray-900 dark:text-white' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {match.performance_rating ? match.performance_rating.toFixed(2) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {match.combat_score ? Math.round(match.combat_score) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {match.eliminations || '0'}/{match.deaths || '0'}/{match.assists || '0'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-sm font-medium ${
                            match.kda >= 2.0 ? 'text-green-600 dark:text-green-400' :
                            match.kda >= 1.0 ? 'text-gray-900 dark:text-white' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {match.kda ? match.kda.toFixed(2) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {match.damage_per_round ? Math.round(match.damage_per_round) : '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm text-gray-900 dark:text-white">
                            {match.kast_percentage ? `${match.kast_percentage}%` : '-'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {matchHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-500">
                    {dataLoading ? 'Loading match history...' : 'No match history available'}
                  </div>
                )}
                
                {/* Pagination */}
                {pagination.last_page > 1 && (
                  <div className="flex items-center justify-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page <= 1 || dataLoading}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {pagination.current_page} of {pagination.last_page}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page >= pagination.last_page || dataLoading}
                      className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


          {/* Overview Tab - Recent Matches */}
          {activeTab === 'overview' && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Recent Matches</h3>
              {matchHistory.length > 0 ? (
                <div className="space-y-2">
                  {matchHistory.slice(0, 10).map((match, index) => (
                    <div 
                      key={index}
                      onClick={() => navigateTo('match-detail', { id: match.match_id || match.id })}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Event Logo - VLR.gg Style */}
                        {match.event_logo && (
                          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            <img 
                              src={match.event_logo} 
                              alt={match.event_name}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = getImageUrl(null, 'event-banner'); }}
                            />
                          </div>
                        )}
                        
                        {/* Result Badge */}
                        <div className={`px-2 py-1 rounded text-xs font-bold ${
                          match.won ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                        }`}>
                          {match.won ? 'W' : 'L'}
                        </div>
                        
                        {/* Teams Display - VLR.gg Style with Both Logos */}
                        <div className="flex items-center space-x-3">
                          {/* Player's Team Logo */}
                          {match.team_logo && (
                            <TeamLogo team={{ logo_url: match.team_logo }} size="w-8 h-8" />
                          )}
                          
                          {/* Score */}
                          <div className="text-center min-w-[60px]">
                            <div className="font-bold text-gray-900 dark:text-white">
                              <span className={match.won ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                {match.team_score || '0'}
                              </span>
                              <span className="mx-1 text-gray-400">-</span>
                              <span className={!match.won ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                {match.opponent_score || '0'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Opponent Logo */}
                          {match.opponent_logo && (
                            <TeamLogo team={{ logo_url: match.opponent_logo }} size="w-8 h-8" />
                          )}
                          
                          {/* Match Info */}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {match.opponent_name || 'TBD'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {match.event_name || 'Scrim'} • {match.format || 'BO3'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right side - Date & Hero */}
                      <div className="text-right">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {match.match_date ? new Date(match.match_date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'Recent'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {match.hero || match.most_played_hero || 'Various'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-500">
                  {dataLoading ? 'Loading recent matches...' : 'No recent matches available'}
                </div>
              )}
            </div>
          )}
          
          {/* Maps Tab */}
          {activeTab === 'maps' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Map Performance</h3>
                {dataLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                  </div>
                )}
              </div>
              {mapStats.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mapStats.map((map, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{map.map_name}</h4>
                        <div className={`text-lg font-bold ${
                          (map.win_rate || 0) >= 60 ? 'text-green-600 dark:text-green-400' :
                          (map.win_rate || 0) >= 40 ? 'text-gray-900 dark:text-white' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {(map.win_rate || 0).toFixed(0)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3 text-center text-sm">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{map.matches_played || 0}</div>
                          <div className="text-xs text-gray-500">Matches</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{(map.avg_kda || 0).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">K/D/A</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{Math.round(map.avg_damage || 0)}</div>
                          <div className="text-xs text-gray-500">Avg DMG</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-500">
                    {dataLoading ? 'Loading map statistics...' : 'No map statistics available'}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Events Tab */}
          {activeTab === 'events' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Event Performance</h3>
                {dataLoading && (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                  </div>
                )}
              </div>
              {eventStats.length > 0 ? (
                <div className="space-y-4">
                  {eventStats.map((event, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          {event.event_logo && (
                            <img 
                              src={event.event_logo} 
                              alt={event.event_name} 
                              className="w-10 h-10 rounded"
                              onError={(e) => { e.target.src = getImageUrl(null, 'event-banner'); }}
                            />
                          )}
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">{event.event_name}</h4>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {event.matches_played || 0} matches • {event.maps_played || 0} maps
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            event.placement <= 3 ? 'text-yellow-500' :
                            event.placement <= 8 ? 'text-gray-400' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            #{event.placement || 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500">Placement</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-center text-sm">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{(event.win_rate || 0).toFixed(0)}%</div>
                          <div className="text-xs text-gray-500">Win Rate</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{(event.avg_kda || 0).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">K/D/A</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{Math.round(event.avg_damage || 0)}</div>
                          <div className="text-xs text-gray-500">Avg DMG</div>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{(event.avg_rating || 0).toFixed(2)}</div>
                          <div className="text-xs text-gray-500">Rating</div>
                        </div>
                      </div>
                      {event.prize_money && (
                        <div className="mt-2 text-center">
                          <span className="text-green-600 dark:text-green-400 font-semibold">
                            {formatCurrency(event.prize_money)}
                          </span>
                          <span className="text-xs text-gray-500 ml-1">earned</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-500">
                    {dataLoading ? 'Loading event statistics...' : 'No event statistics available'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - VLR.gg Style */}
        <div className="space-y-6">
          {/* Recent Mentions - VLR.gg Style */}
          <div className="card p-6">
            <MentionsSection 
              entityType="player" 
              entityId={player.id} 
              title="Recent Mentions"
            />
          </div>


          {/* Event Placements/Achievements */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Event Placements</h3>
            {player.eventPlacements && player.eventPlacements.length > 0 ? (
              <div className="space-y-4">
                {player.eventPlacements.map((placement, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      {placement.event_logo && (
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={placement.event_logo} 
                            alt={placement.event_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = getImageUrl(null, 'event-banner'); }}
                          />
                        </div>
                      )}
                      <div className={`text-lg font-bold ${
                        placement.placement === 1 ? 'text-yellow-500' :
                        placement.placement === 2 ? 'text-gray-400' :
                        placement.placement === 3 ? 'text-orange-600' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        #{placement.placement}
                      </div>
                    </div>
                    <button
                      onClick={() => navigateTo('event-detail', { id: placement.event_id })}
                      className="font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 text-sm"
                    >
                      {placement.event_name}
                    </button>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {placement.team_name} • {new Date(placement.date).toLocaleDateString()}
                    </div>
                    {placement.prize && (
                      <div className="text-green-600 dark:text-green-400 font-semibold text-sm mt-1">
                        {formatCurrency(placement.prize)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-500">No event placements yet</p>
            )}
          </div>
        </div>

        {/* Content Container */}
        <div>
        {/* Team History Section - REMOVED per requirements */}
        {/* <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Team History</h3>
          
          {/* Current Team First */}
          {/* {player.currentTeam ? (
              <div 
                className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors mb-4"
                onClick={() => navigateTo && navigateTo('team-detail', player.team.id)}
              >
                {player.team.logo ? (
                  <img 
                    src={player.team.logo.startsWith('http') ? player.team.logo : `${BACKEND_URL}/storage/${player.team.logo}`}
                    alt={player.team.name}
                    className="w-14 h-14 object-contain"
                    onError={(e) => { e.target.src = getImageUrl(null, 'team-logo'); }}
                  />
                ) : (
                  <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                    <span className="text-gray-400 text-xl">?</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-white hover:text-green-600 dark:hover:text-green-400 text-base">
                    {player.team.name}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {player.team.country && `${getCountryFlag(player.team.country)} ${player.team.country}`}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-3 py-1 text-xs text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/50 rounded-full font-semibold uppercase">
                    Current
                  </span>
                  {player.joinedDate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Since {player.joinedDate}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No current team</p>
              </div>
            )}
          </div>
          
          {/* Past Teams Section - Always shown */}
          <div>
            {player?.teamHistory && player.teamHistory.length > 0 ? (
              <div className="space-y-2">
                {player.teamHistory.map((teamEntry, index) => (
                  <div 
                    key={index}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => teamEntry.team_id && navigateTo && navigateTo('team-detail', teamEntry.team_id)}
                  >
                    {teamEntry.team_logo ? (
                      <img 
                        src={teamEntry.team_logo.startsWith('http') ? teamEntry.team_logo : `${BACKEND_URL}/storage/${teamEntry.team_logo}`}
                        alt={teamEntry.team_name}
                        className="w-12 h-12 object-contain opacity-80"
                        onError={(e) => { e.target.src = getImageUrl(null, 'team-logo'); }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                        <span className="text-gray-400">?</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400">
                        {teamEntry.team_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {teamEntry.team_country && `${getCountryFlag(teamEntry.team_country)} ${teamEntry.team_country}`}
                      </div>
                    </div>
                    {(teamEntry.joined_at || teamEntry.left_at) && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                        {teamEntry.joined_at && <div>{new Date(teamEntry.joined_at).toLocaleDateString()}</div>}
                        {teamEntry.left_at && (
                          <div className="text-gray-400 dark:text-gray-500">to {new Date(teamEntry.left_at).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No previous teams</p>
              </div>
            )}
          </div>
        </div> */}

        {/* Player History Section - Displays match history with hero stats */}
        <div className="card p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Player History</h3>
          {matchHistory && matchHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Match</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hero</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">K</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">D</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">A</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">KDA</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">DMG</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Heal</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">BLK</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {matchHistory.slice(0, 20).map((match) => (
                    <tr key={match.id || match.match_id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div 
                          onClick={() => navigateTo && navigateTo('match-detail', { id: match.match_id || match.id })}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            {match.event_logo && (
                              <img 
                                src={formatImageUrl(match.event_logo)} 
                                alt={match.event_name}
                                className="w-6 h-6 object-contain"
                                onError={(e) => { e.target.src = getImageUrl(null, 'event-banner'); }}
                              />
                            )}
                            <div>
                              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                                vs {match.opponent_team_name || match.opponent || 'Unknown'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {match.event_name} • {new Date(match.played_at || match.date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {match.hero_image && (
                            <img 
                              src={formatImageUrl(match.hero_image)} 
                              alt={match.hero_name || match.hero}
                              className="w-8 h-8 rounded object-cover"
                            />
                          )}
                          <span className="text-sm text-gray-900 dark:text-white">
                            {match.hero_name || match.hero || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                        {match.kills || match.eliminations || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                        {match.deaths || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                        {match.assists || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                        {match.deaths > 0 ? 
                          (((match.kills || match.eliminations || 0) + (match.assists || 0)) / match.deaths).toFixed(2) : 
                          ((match.kills || match.eliminations || 0) + (match.assists || 0)).toFixed(2)
                        }
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                        {match.damage || match.damage_dealt || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                        {match.healing || match.healing_done || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-900 dark:text-white">
                        {match.blocked || match.damage_blocked || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No match history available</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}

export default PlayerDetailPage;