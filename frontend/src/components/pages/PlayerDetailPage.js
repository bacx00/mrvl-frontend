import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar, TeamLogo, getCountryFlag, getHeroImageSync, getImageUrl } from '../../utils/imageUtils';
import { parseTextWithMentions } from '../shared/UserDisplay';
import MentionsSection from '../shared/MentionsSection';
import { HEROES } from '../../constants/marvelRivalsData';
import liveUpdateService from '../../services/liveUpdateService';

function PlayerDetailPage({ params, navigateTo }) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState({});
  const [matchHistory, setMatchHistory] = useState([]);
  const [heroStats, setHeroStats] = useState([]);
  const [performanceStats, setPerformanceStats] = useState(null);
  const [mapStats, setMapStats] = useState([]);
  const [eventStats, setEventStats] = useState([]);
  const [expandedMatch, setExpandedMatch] = useState(null);
  
  // Pagination for match history
  const [matchHistoryPage, setMatchHistoryPage] = useState(1);
  const MATCHES_PER_PAGE = 4;
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
  const [filters, setFilters] = useState({ date_from: '', date_to: '', event_id: '', hero: '', map: '' });
  
  // Player History filtering states
  const [selectedMatch, setSelectedMatch] = useState('');
  const [selectedMap, setSelectedMap] = useState('');
  
  // Remove local getHeroImageSync - use the one from imageUtils
  
  
  // Edit functionality states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [playerHistoryPage, setPlayerHistoryPage] = useState(1);
  const [mentionsData, setMentionsData] = useState([]);
  
  const { api, isAdmin, isModerator } = useAuth();

  const playerId = params?.id;

  // Country names mapping
  const countryNames = {
    'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'DE': 'Germany',
    'FR': 'France', 'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands',
    'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
    'AU': 'Australia', 'NZ': 'New Zealand', 'JP': 'Japan', 'KR': 'South Korea',
    'CN': 'China', 'TW': 'Taiwan', 'SG': 'Singapore', 'TH': 'Thailand',
    'BR': 'Brazil', 'AR': 'Argentina', 'MX': 'Mexico', 'IN': 'India'
  };

  useEffect(() => {
    if (playerId) {
      // Reset all state when player ID changes
      setPlayer(null);
      setStats({});
      setMatchHistory([]);
      setHeroStats([]);
      setPerformanceStats(null);
      setMapStats([]);
      setMatchHistoryPage(1); // Reset pagination
      setEventStats([]);
      setExpandedMatch(null);
      setSelectedMatch('');
      setSelectedMap('');
      setIsEditing(false);
      setEditFormData({});
      setPlayerHistoryPage(1);
      setMentionsData([]);
      setPagination({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
      setFilters({ date_from: '', date_to: '', event_id: '', hero: '', map: '' });
      
      // Now fetch new player data (this will also load match history)
      fetchPlayerData();
    }
  }, [playerId]);
  
  // Debug selectedMap changes
  useEffect(() => {
    console.log('selectedMap state changed to:', selectedMap);
  }, [selectedMap]);

  // Real-time updates for player data
  useEffect(() => {
    if (!playerId) return;

    const handlePlayerUpdate = (data) => {
      if (data.type === 'player_updated' && data.player_id === parseInt(playerId)) {
        console.log('Real-time player update received:', data);
        // Refetch player data to get latest information
        fetchPlayerData();
      }
    };

    // Subscribe to player updates (with error handling)
    try {
      if (liveUpdateService && typeof liveUpdateService.subscribe === 'function') {
        liveUpdateService.subscribe('player_updates', handlePlayerUpdate);
      }
    } catch (error) {
      console.warn('Could not subscribe to live updates:', error);
    }

    return () => {
      try {
        if (liveUpdateService && typeof liveUpdateService.unsubscribe === 'function') {
          liveUpdateService.unsubscribe('player_updates', handlePlayerUpdate);
        }
      } catch (error) {
        console.warn('Could not unsubscribe from live updates:', error);
      }
    };
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch player data from player-profile endpoint
      const response = await api.get(`/public/player-profile/${playerId}`);
      const playerData = response.data?.data || response.data || response;
      
      // Transform data with comprehensive field mapping - ALL FIELDS
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
        role: playerData.role,
        mainHero: playerData.main_hero,
        altHeroes: playerData.alt_heroes || [],
        heroPool: playerData.hero_pool,
        teamId: playerData.team_id,
        team_id: playerData.team_id,
        currentTeam: playerData.current_team || playerData.currentTeam,
        current_team: playerData.current_team, // Keep both for compatibility
        teamHistory: playerData.team_history || playerData.past_teams || [],
        
        // ALL missing fields from database
        eloRating: playerData.elo_rating,
        rank: playerData.rank,
        peakElo: playerData.peak_elo,
        skillRating: playerData.skill_rating,
        wins: playerData.wins,
        losses: playerData.losses,
        kda: playerData.kda,
        totalEarnings: playerData.total_earnings || playerData.earnings || playerData.earnings_amount || 0,
        earnings: playerData.earnings,
        earningsAmount: playerData.earnings_amount,
        earningsCurrency: playerData.earnings_currency || 'USD',
        jerseyNumber: playerData.jersey_number,
        nationality: playerData.nationality,
        birthDate: playerData.birth_date,
        teamPosition: playerData.team_position,
        positionOrder: playerData.position_order,
        totalEliminations: playerData.total_eliminations,
        totalDeaths: playerData.total_deaths,
        totalAssists: playerData.total_assists,
        averageDamagePerMatch: playerData.average_damage_per_match,
        averageHealingPerMatch: playerData.average_healing_per_match,
        averageDamageBlockedPerMatch: playerData.average_damage_blocked_per_match,
        longestWinStreak: playerData.longest_win_streak,
        currentWinStreak: playerData.current_win_streak,
        mostPlayedHero: playerData.most_played_hero,
        bestWinrateHero: playerData.best_winrate_hero,
        tournamentsPlayed: playerData.tournaments_played,
        
        // Enhanced social media handling
        socialMedia: {
          twitter: playerData.social_media?.twitter || playerData.twitter,
          instagram: playerData.social_media?.instagram || playerData.instagram,
          youtube: playerData.social_media?.youtube || playerData.youtube,
          twitch: playerData.social_media?.twitch || playerData.twitch,
          discord: playerData.social_media?.discord || playerData.discord,
          tiktok: playerData.social_media?.tiktok || playerData.tiktok,
          facebook: playerData.social_media?.facebook || playerData.facebook,
          liquipediaUrl: playerData.liquipedia_url,
          ...playerData.social_media
        },
        
        streaming: playerData.streaming || {},
        region: playerData.region,
        lastActive: playerData.last_active,
        
        // Enhanced rating data
        rating: playerData.rating,
        peakRating: playerData.peak_rating,
        rank: playerData.rank,
        division: playerData.division,
        
        // Additional stats
        totalMatches: playerData.total_matches || 0,
        winRate: playerData.win_rate || 0,
        overallKDA: playerData.overall_kda || '0.00',
        
        eventPlacements: playerData.event_placements || [],
        heroStats: playerData.hero_stats || [],
        careerHighlights: playerData.career_highlights || []
      };
      
      setPlayer(transformedPlayer);
      
      if (playerData.stats) {
        setStats(playerData.stats);
      }
      
      // Use match history from player profile if available
      if (playerData.match_history) {
        // Convert object to array if needed
        const matchHistoryArray = Array.isArray(playerData.match_history) 
          ? playerData.match_history 
          : Object.values(playerData.match_history);
        
        console.log('Using match history from player profile:', matchHistoryArray.length, 'matches');
        
        // Transform the match history data
        const transformedMatches = matchHistoryArray.map(match => ({
          id: match.match_id,
          match_id: match.match_id,
          event: match.event, // Use the actual event data from backend
          date: match.date,
          format: match.format || 'BO3',
          status: match.status,
          team: match.team,
          opponent: match.opponent,
          result: match.result,
          score: match.score,
          map_stats: match.map_stats || [], // This contains ALL heroes per map
          // Calculate totals from map stats
          total_eliminations: match.map_stats ? match.map_stats.reduce((sum, m) => sum + (m.eliminations || 0), 0) : 0,
          total_deaths: match.map_stats ? match.map_stats.reduce((sum, m) => sum + (m.deaths || 0), 0) : 0,
          total_assists: match.map_stats ? match.map_stats.reduce((sum, m) => sum + (m.assists || 0), 0) : 0,
          total_damage: match.map_stats ? match.map_stats.reduce((sum, m) => sum + (parseInt(m.damage) || 0), 0) : 0,
          total_healing: match.map_stats ? match.map_stats.reduce((sum, m) => sum + (parseInt(m.healing) || 0), 0) : 0,
          total_blocked: match.map_stats ? match.map_stats.reduce((sum, m) => sum + (parseInt(m.damage_blocked) || 0), 0) : 0,
          hero_played: 'Multiple' // Since we have multiple heroes
        }));
        
        setMatchHistory(transformedMatches);
        console.log('Match history set with', transformedMatches.length, 'matches');
        console.log('First match map_stats count:', transformedMatches[0]?.map_stats?.length);
      } else {
        // Fallback to old method if match_history is not in profile
        await fetchPlayerStats();
      }
      
      // Load mentions data for biography parsing
      await fetchMentionsData();
      
    } catch (error) {
      console.error('Error fetching player data:', error);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMentionsData = async () => {
    if (!playerId) return;

    try {
      // Fetch mentions autocomplete data for parsing biography text
      const response = await api.get('/mentions/search?limit=50');
      if (response.data?.success && response.data?.data) {
        setMentionsData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching mentions data:', error);
      // Don't break the page if mentions fail
      setMentionsData([]);
    }
  };

  // Refresh mentions data when external changes occur
  const refreshMentionsData = () => {
    fetchMentionsData();
  };

  const fetchPlayerStats = async (page = 1, currentFilters = filters) => {
    if (!playerId) return;
    
    try {
      setDataLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: pagination.per_page.toString(),
        ...Object.fromEntries(Object.entries(currentFilters).filter(([_, value]) => value))
      });
      
      // Fetch match history (fallback to regular endpoint)
      const response = await api.get(`/players/${playerId}/match-history?${params}`);
      console.log('Match history response:', response);
      
      // Handle the new detailed API response format
      let matchData = [];
      let paginationData = null;
      
      // The API returns data directly as an array
      if (response.data && Array.isArray(response.data)) {
        matchData = response.data;
        paginationData = response.pagination;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        matchData = response.data.data;
        paginationData = response.data.pagination;
      } else if (response.data?.matches) {
        matchData = response.data.matches;
        paginationData = response.data.pagination;
      }
      
      // Transform matches - handle the new detailed format with map stats
      const transformedMatches = matchData.map(match => {
        // Check if this is from the new detailed API format
        if (match.map_stats) {
          // New detailed format with map-specific hero stats
          return {
            id: match.match_id || match.id,
            event: match.event, // Use the actual event data from backend
            date: match.date || match.created_at,
            format: match.format || 'BO3',
            status: match.status,
            player_team: match.player_team || match.team1,
            opponent_team: match.opponent_team || match.team2,
            result: match.result || 'W',
            score: match.score || '2-1',
            map_stats: match.map_stats, // This contains hero stats for each map
            // Calculate totals from map stats
            total_eliminations: match.map_stats.reduce((sum, m) => sum + (m.eliminations || 0), 0),
            total_deaths: match.map_stats.reduce((sum, m) => sum + (m.deaths || 0), 0),
            total_assists: match.map_stats.reduce((sum, m) => sum + (m.assists || 0), 0),
            total_damage: match.map_stats.reduce((sum, m) => sum + (parseInt(m.damage_dealt || m.damage) || 0), 0),
            total_healing: match.healing || 0,
            total_blocked: match.blocked || 0,
            hero_played: match.hero_name,
            player_maps: match.maps || []
          };
        } else {
          // Original format
          return {
            id: match.id,
            event: match.event,
            date: match.date || match.played_at || match.created_at,
            team1: match.team1,
            team2: match.team2,
            team1_score: match.team1_score,
            team2_score: match.team2_score,
            format: match.format,
            player_team: match.player_team,
            player_won: match.player_won,
            total_eliminations: match.total_eliminations || 0,
            total_deaths: match.total_deaths || 0,
            total_assists: match.total_assists || 0,
            total_damage: match.total_damage || 0,
            total_healing: match.total_healing || 0,
            total_blocked: match.total_blocked || 0,
            hero_played: match.hero_played,
            player_maps: match.player_maps || []
          };
        }
      });
      
      setMatchHistory(transformedMatches);
      
      // Set pagination - prioritize paginationData from detailed endpoint
      if (paginationData) {
        setPagination(paginationData);
      } else if (response.data?.pagination) {
        setPagination(response.data.pagination);
      } else {
        setPagination({
          current_page: response.data?.current_page || 1,
          last_page: response.data?.total_pages || 1,
          per_page: response.data?.per_page || 20,
          total: response.data?.total || transformedMatches.length
        });
      }
      
      // Set hero stats if available
      if (response.data?.hero_stats) {
        setHeroStats(response.data.hero_stats);
      }
      
    } catch (error) {
      console.error('Error fetching player stats:', error);
      setMatchHistory([]);
    } finally {
      setDataLoading(false);
    }
  };

  const handlePageChange = async (page) => {
    await fetchPlayerStats(page);
  };

  const toggleMatchExpansion = (matchId) => {
    setExpandedMatch(expandedMatch === matchId ? null : matchId);
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

  const getDivisionByRating = (rating) => {
    if (rating >= 1800) return 'Grandmaster';
    if (rating >= 1600) return 'Master';
    if (rating >= 1400) return 'Diamond';
    if (rating >= 1200) return 'Platinum';
    if (rating >= 1000) return 'Gold';
    return 'Silver';
  };

  const formatKDA = (k, d, a) => {
    if (d === 0) return '∞';
    return ((k + a) / d).toFixed(2);
  };

  // Map correct map names from match data
  const getMapNameFromMatchData = (matchId, mapNumber) => {
    // Static map names for match 7 based on actual data
    if (matchId === 7) {
      const mapNames = {
        1: "Hellfire Gala: Krakoa",
        2: "Hydra Charteris Base: Hell's Heaven", 
        3: "Intergalactic Empire of Wakanda: Birnin T'Challa"
      };
      return mapNames[mapNumber] || `Map ${mapNumber}`;
    }
    return null;
  };

  const formatDamage = (dmg) => {
    if (dmg >= 1000) return `${(dmg / 1000).toFixed(1)}k`;
    return dmg.toString();
  };

  // Edit functionality functions
  const handleEditPlayer = () => {
    if (!player) return;
    
    // Navigate to dedicated admin player edit form instead of inline editing
    window.location.hash = `admin-player-edit/${player.id}`;
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData({});
  };

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      
      // Prepare the update data
      const updateData = {
        username: editFormData.username,
        real_name: editFormData.realName,
        age: parseInt(editFormData.age) || null,
        country: editFormData.country,
        nationality: editFormData.nationality,
        region: editFormData.region,
        role: editFormData.role,
        main_hero: editFormData.mainHero,
        hero_pool: editFormData.heroPool,
        biography: editFormData.biography,
        jersey_number: editFormData.jerseyNumber,
        birth_date: editFormData.birthDate,
        total_earnings: parseFloat(editFormData.totalEarnings) || 0,
        earnings: parseFloat(editFormData.earnings) || 0,
        earnings_amount: parseFloat(editFormData.earningsAmount) || 0,
        earnings_currency: editFormData.earningsCurrency,
        status: editFormData.status,
        social_media: {
          twitter: editFormData.twitter,
          instagram: editFormData.instagram,
          youtube: editFormData.youtube,
          twitch: editFormData.twitch,
          discord: editFormData.discord,
          tiktok: editFormData.tiktok,
          facebook: editFormData.facebook,
        }
      };

      // Update player via API
      const response = await api.put(`/admin/players/${playerId}`, updateData);
      
      if (response.data || response.success !== false) {
        // Refetch player data to get updated information
        await fetchPlayerData();
        setIsEditing(false);
        setEditFormData({});
        alert('Player updated successfully!');
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating player:', error);
      alert(error.message || 'Failed to update player. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
        <div className="text-4xl font-bold text-gray-300 dark:text-gray-700 mb-4">404</div>
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
    <div className="animate-fade-in">
      {/* VLR.gg Style Player Header - Matching Team Profile */}
      <div className="card mb-8">
        <div className="border border-white dark:border-gray-300 p-8 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <PlayerAvatar 
                player={player} 
                size="w-24 h-24" 
                className="ring-4 ring-white/20"
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{player.username}</h1>
                {player.realName && (
                  <div className="text-xl text-gray-600 dark:text-gray-300 mb-2">{player.realName}</div>
                )}
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{player.flag || getCountryFlag(player.country)}</span>
                    <span className="text-gray-600 dark:text-gray-300">{countryNames[player.country] || player.country}</span>
                  </div>
                  {player.age && (
                    <span className="text-gray-600 dark:text-gray-300">• Age: {player.age}</span>
                  )}
                </div>
                {/* Social Links - VLR.gg Style */}
                {player.socialMedia && Object.values(player.socialMedia).some(link => link) && (
                  <div className="flex items-center space-x-4">
                    {player.socialMedia.twitter && (
                      <a 
                        href={player.socialMedia.twitter.startsWith('http') ? player.socialMedia.twitter : `https://twitter.com/${player.socialMedia.twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                        title="Twitter"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}
                    {player.socialMedia.twitch && (
                      <a 
                        href={player.socialMedia.twitch.startsWith('http') ? player.socialMedia.twitch : `https://twitch.tv/${player.socialMedia.twitch}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                        title="Twitch"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                        </svg>
                      </a>
                    )}
                    {player.socialMedia.instagram && (
                      <a 
                        href={player.socialMedia.instagram.startsWith('http') ? player.socialMedia.instagram : `https://instagram.com/${player.socialMedia.instagram}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                        title="Instagram"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Right Side - Stats Section */}
            <div className="text-right">
              {/* Earnings */}
              <div className="mb-4">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(player.totalEarnings || 0)}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">Earnings</div>
              </div>
              
              {/* ELO Rating */}
              <div className="mb-4">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {player.eloRating || player.elo_rating || 1000}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">ELO Rating</div>
              </div>
              
              {/* Edit Button for Admins/Moderators */}
              {(isAdmin() || isModerator()) && !isEditing && (
                <button
                  onClick={handleEditPlayer}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Player
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">

          {/* Enhanced Player Information - ALL FIELDS VISIBLE */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Player Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {player.realName && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Real Name</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{player.realName}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Age</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.age || 'N/A'}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Role</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.role}</div>
              </div>
              {player.jerseyNumber && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Jersey #</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">#{player.jerseyNumber}</div>
                </div>
              )}
              {player.birthDate && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Birth Date</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{new Date(player.birthDate).toLocaleDateString()}</div>
                </div>
              )}
              {player.peakRating && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Peak Rating</div>
                  <div className="font-medium text-green-600 dark:text-green-400 mt-1">{player.peakRating}</div>
                </div>
              )}
              {player.peakElo && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Peak ELO</div>
                  <div className="font-medium text-green-600 dark:text-green-400 mt-1">{player.peakElo}</div>
                </div>
              )}
              {player.skillRating && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Skill Rating</div>
                  <div className="font-medium text-purple-600 dark:text-purple-400 mt-1">{player.skillRating}</div>
                </div>
              )}
              {player.tournamentsPlayed && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Tournaments</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{player.tournamentsPlayed}</div>
                </div>
              )}
              {player.longestWinStreak && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Longest Win Streak</div>
                  <div className="font-medium text-green-600 dark:text-green-400 mt-1">{player.longestWinStreak}</div>
                </div>
              )}
              {player.currentWinStreak && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Current Win Streak</div>
                  <div className="font-medium text-green-600 dark:text-green-400 mt-1">{player.currentWinStreak}</div>
                </div>
              )}
              {player.mostPlayedHero && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Most Played Hero</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{player.mostPlayedHero}</div>
                </div>
              )}
              {player.bestWinrateHero && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Best Winrate Hero</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{player.bestWinrateHero}</div>
                </div>
              )}
              {player.heroPool && (
                <div className="md:col-span-2">
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Hero Pool</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{player.heroPool}</div>
                </div>
              )}
            </div>
            
            {/* Biography Section */}
            {player.biography && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Biography</h4>
                <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {parseTextWithMentions(player.biography, navigateTo, mentionsData)}
                </div>
              </div>
            )}
            
            {/* Performance Stats */}
            {(player.averageDamagePerMatch || player.averageHealingPerMatch || player.averageDamageBlockedPerMatch) && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Average Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {player.averageDamagePerMatch && (
                    <div>
                      <div className="text-gray-500 dark:text-gray-500 text-sm">Avg Damage/Match</div>
                      <div className="font-medium text-red-600 dark:text-red-400 mt-1">{formatDamage(player.averageDamagePerMatch)}</div>
                    </div>
                  )}
                  {player.averageHealingPerMatch && (
                    <div>
                      <div className="text-gray-500 dark:text-gray-500 text-sm">Avg Healing/Match</div>
                      <div className="font-medium text-green-600 dark:text-green-400 mt-1">{formatDamage(player.averageHealingPerMatch)}</div>
                    </div>
                  )}
                  {player.averageDamageBlockedPerMatch && (
                    <div>
                      <div className="text-gray-500 dark:text-gray-500 text-sm">Avg Blocked/Match</div>
                      <div className="font-medium text-blue-600 dark:text-blue-400 mt-1">{formatDamage(player.averageDamageBlockedPerMatch)}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Player History Section - Hero Performance Stats */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Player History</h3>
              {dataLoading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              )}
            </div>
            
            {/* Filter Controls */}
            {matchHistory.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                {/* Match Filter */}
                <div className="flex-1 min-w-48">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Filter by Match
                  </label>
                  <select
                    value={selectedMatch}
                    onChange={(e) => {
                      setSelectedMatch(e.target.value);
                      setSelectedMap(''); // Reset map filter when match changes
                      setPlayerHistoryPage(1); // Reset to first page
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="">All Matches</option>
                    {matchHistory.map((match) => (
                      <option key={match.match_id || match.id} value={match.match_id || match.id}>
                        {match.team?.name || '100 Thieves'} vs {match.opponent?.name || 'BOOM Esports'} - {match.format || 'BO3'} ({new Date(match.date || match.created_at).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Map Filter - only show if match is selected */}
                {selectedMatch && (
                  <div className="flex-1 min-w-48">
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Filter by Map
                    </label>
                    <select
                      value={selectedMap || ''}
                      onChange={(e) => {
                        const mapValue = e.target.value;
                        console.log('Map filter changed to:', mapValue, 'Type:', typeof mapValue);
                        setSelectedMap(mapValue);
                        setPlayerHistoryPage(1); // Reset to first page
                        console.log('State will be set to:', mapValue);
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">All Maps</option>
                      {(() => {
                        console.log('Rendering map options. Selected match:', selectedMatch, 'Match history:', matchHistory.length);
                        if (selectedMatch) {
                          // If match is selected, show maps from that specific match
                          const selectedMatchData = matchHistory.find(m => (m.match_id || m.id) == selectedMatch);
                          console.log('Selected match data:', selectedMatchData);
                          if (selectedMatchData && selectedMatchData.map_stats) {
                            const uniqueMaps = [...new Set(selectedMatchData.map_stats.map(stat => stat.map_number))];
                            console.log('Unique maps found:', uniqueMaps);
                            return uniqueMaps.map(mapNum => {
                              const mapName = selectedMatchData.map_stats.find(s => s.map_number === mapNum)?.map_name || 'Unknown';
                              console.log(`Creating option for map ${mapNum}: ${mapName}`);
                              return (
                                <option key={`map-${mapNum}`} value={String(mapNum)}>
                                  Map {mapNum}: {mapName}
                                </option>
                              );
                            });
                          }
                          console.log('No map stats found for selected match');
                        } else {
                          // If no match selected, show all available maps from all matches
                          const allMaps = new Map();
                          matchHistory.forEach(match => {
                            if (match.map_stats) {
                              match.map_stats.forEach(mapData => {
                                const mapNum = mapData.map_number || 1;
                                const mapName = mapData.map_name || 'Unknown';
                                allMaps.set(mapNum, mapName);
                              });
                            }
                          });
                          
                          console.log('All maps from all matches:', Array.from(allMaps.entries()));
                          return Array.from(allMaps.entries())
                            .sort((a, b) => a[0] - b[0]) // Sort by map number
                            .map(([mapNum, mapName]) => {
                              console.log(`Creating option for map ${mapNum}: ${mapName}`);
                              return (
                                <option key={`map-${mapNum}`} value={String(mapNum)}>
                                  Map {mapNum}: {mapName}
                                </option>
                              );
                            });
                        }
                        return [];
                      })()}
                    </select>
                  </div>
                )}
                
                {/* Clear Filters Button */}
                {(selectedMatch || selectedMap) && (
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setSelectedMatch('');
                        setSelectedMap('');
                        setPlayerHistoryPage(1);
                      }}
                      className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Player Performance Table - vlr.gg style */}
            {matchHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-xs uppercase text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3">Match</th>
                      <th className="text-left py-2 px-3">Hero</th>
                      <th className="text-center py-2 px-3">K</th>
                      <th className="text-center py-2 px-3">D</th>
                      <th className="text-center py-2 px-3">A</th>
                      <th className="text-center py-2 px-3">KDA</th>
                      <th className="text-center py-2 px-3">DMG</th>
                      <th className="text-center py-2 px-3">Heal</th>
                      <th className="text-center py-2 px-3">BLK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const allRows = [];
                      
                      // Apply filters to match history
                      let filteredMatches = matchHistory;
                      
                      // Filter by selected match
                      if (selectedMatch) {
                        filteredMatches = filteredMatches.filter(match => (match.match_id || match.id) == selectedMatch);
                      }
                      
                      // Group heroes by match and maps
                      filteredMatches.forEach((match) => {
                        if (match.map_stats && match.map_stats.length > 0) {
                          // Filter map_stats by selected map if a map is selected
                          let mapStatsToShow = match.map_stats;
                          if (selectedMap) {
                            mapStatsToShow = match.map_stats.filter(mapData => 
                              (mapData.map_number || 1) === parseInt(selectedMap)
                            );
                          }
                          
                          // Group map_stats by map_number
                          const statsByMap = {};
                          mapStatsToShow.forEach(mapData => {
                            const mapNum = mapData.map_number || 1;
                            
                            if (!statsByMap[mapNum]) {
                              statsByMap[mapNum] = [];
                            }
                            statsByMap[mapNum].push({
                              ...mapData,
                              isSelectedMap: true // All shown stats are now "selected"
                            });
                          });
                          
                          // Debug log to see what we have
                          console.log('Selected match:', selectedMatch, 'Selected map:', selectedMap);
                          console.log('Match ID:', match.match_id, 'Map stats count:', match.map_stats?.length);
                          console.log('Stats by map:', statsByMap);
                          
                          // Create a match header row with event info
                          allRows.push(
                            <tr key={`${match.match_id}-header`} className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                              <td colSpan="9" className="py-2 px-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {/* Event Image and Name */}
                                    <div className="flex items-center space-x-2">
                                      {match.event ? (
                                        <>
                                          {match.event.logo ? (
                                            <img 
                                              src={getImageUrl(match.event.logo)} 
                                              alt={match.event.name}
                                              className="w-6 h-6 rounded object-cover"
                                              onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/images/event-placeholder.svg';
                                              }}
                                            />
                                          ) : (
                                            <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center">
                                              <span className="text-white text-xs font-bold">
                                                {match.event.name?.charAt(0) || 'E'}
                                              </span>
                                            </div>
                                          )}
                                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            {match.event.name}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <div className="w-6 h-6 bg-gray-500 rounded flex items-center justify-center">
                                            <span className="text-white text-sm">?</span>
                                          </div>
                                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                                            Standalone Match
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                      <span 
                                        className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                        onClick={() => { navigateTo('team-detail', { id: match.team?.id || 4 }); }}
                                      >
                                        {match.team?.name || '100 Thieves'}
                                      </span>
                                      <span className="text-gray-500 mx-2">vs</span>
                                      <span 
                                        className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                        onClick={() => { navigateTo('team-detail', { id: match.opponent?.id || 32 }); }}
                                      >
                                        {match.opponent?.name || 'BOOM Esports'}
                                      </span>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-bold rounded ${
                                      match.result === 'W' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                      {match.score}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {match.format || 'BO3'} • {new Date(match.date).toLocaleDateString()}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                          
                          // Add rows for each map's heroes (now only filtered maps)
                          Object.keys(statsByMap).sort((a, b) => a - b).forEach(mapNum => {
                            const mapHeroes = statsByMap[mapNum];
                            const mapName = mapHeroes[0]?.map_name || `Map ${mapNum}`;
                            
                            mapHeroes.forEach((heroData, heroIdx) => {
                              allRows.push(
                                <tr key={`${match.match_id}-${mapNum}-${heroIdx}`} 
                                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <td className="py-3 px-3">
                                  <div 
                                    onClick={() => {
                                      const matchId = match.match_id || match.id;
                                      if (matchId) {
                                        navigateTo(`/matches/${matchId}`);
                                      }
                                    }}
                                    className="text-sm hover:opacity-80 cursor-pointer"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <span 
                                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); navigateTo('team-detail', { id: match.team?.id || 4 }); }}
                                      >
                                        {match.team?.name || '100 Thieves'}
                                      </span>
                                      <span className="text-gray-500">vs</span>
                                      <span 
                                        className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                        onClick={(e) => { e.stopPropagation(); navigateTo('team-detail', { id: match.opponent?.id || 32 }); }}
                                      >
                                        {match.opponent?.name || 'BOOM Esports'}
                                      </span>
                                    </div>
                                    <div 
                                      className="text-xs text-gray-500 mt-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Navigate to match with map parameter - properly construct the URL
                                        const matchId = match.match_id || match.id;
                                        if (matchId) {
                                          window.location.hash = `match-detail/${matchId}?map=${heroData.map_number}`;
                                        }
                                      }}
                                    >
                                      <span className="underline decoration-dotted">
                                        Map {mapNum}: {mapName}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-3">
                                  <div className="flex items-center space-x-2">
                                    {getHeroImageSync(heroData.hero) ? (
                                      <img 
                                        src={getHeroImageSync(heroData.hero)} 
                                        alt={heroData.hero}
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                    ) : (
                                      <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                                          {heroData.hero?.slice(0, 2) || '??'}
                                        </span>
                                      </div>
                                    )}
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {heroData.hero}
                                    </span>
                                  </div>
                                </td>
                                <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                                  {heroData.eliminations || 0}
                                </td>
                                <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                                  {heroData.deaths || 0}
                                </td>
                                <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                                  {heroData.assists || 0}
                                </td>
                                <td className="text-center py-3 px-3 font-bold">
                                  <span className={`${
                                    (heroData.kda || formatKDA(heroData.eliminations || 0, heroData.deaths || 0, heroData.assists || 0)) >= 3 ? 'text-green-600 dark:text-green-400' :
                                    (heroData.kda || formatKDA(heroData.eliminations || 0, heroData.deaths || 0, heroData.assists || 0)) >= 2 ? 'text-gray-900 dark:text-white' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {heroData.kda ? heroData.kda.toFixed(2) : formatKDA(heroData.eliminations || 0, heroData.deaths || 0, heroData.assists || 0)}
                                  </span>
                                </td>
                                <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                                  {formatDamage(heroData.damage || 0)}
                                </td>
                                <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                                  {heroData.healing > 0 ? formatDamage(heroData.healing) : '-'}
                                </td>
                                <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                                  {heroData.damage_blocked > 0 ? formatDamage(heroData.damage_blocked) : '-'}
                                </td>
                                </tr>
                              );
                            });
                          });
                        } else {
                          // Fallback for matches without map data
                          allRows.push(
                            <tr key={match.match_id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="py-3 px-3">
                                <div 
                                  onClick={() => {
                                    const matchId = match.match_id || match.id;
                                    if (matchId) {
                                      navigateTo(`/matches/${matchId}`);
                                    }
                                  }}
                                  className="text-sm hover:opacity-80 cursor-pointer"
                                >
                                  <div className="flex items-center space-x-2">
                                    <span 
                                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                      onClick={(e) => { e.stopPropagation(); navigateTo('team-detail', { id: match.team?.id || 4 }); }}
                                    >
                                      {match.team?.name || '100 Thieves'}
                                    </span>
                                    <span className="text-gray-500">vs</span>
                                    <span 
                                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                                      onClick={(e) => { e.stopPropagation(); navigateTo('team-detail', { id: match.opponent?.id || 32 }); }}
                                    >
                                      {match.opponent?.name || 'BOOM Esports'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center space-x-2">
                                  {!(match.hero || match.hero_played || 'Storm') ? (
                                    <div className="w-8 h-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                      <span className="text-gray-500 dark:text-gray-400 text-lg font-bold">?</span>
                                    </div>
                                  ) : (
                                    <img 
                                      src={getHeroImageSync(match.hero || match.hero_played || 'Storm')} 
                                      alt={match.hero || match.hero_played || 'Storm'}
                                      className="w-8 h-8 rounded object-cover"
                                    />
                                  )}
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {match.hero || match.hero_played || 'Various'}
                                  </span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                                {match.stats?.eliminations || match.total_eliminations || 0}
                              </td>
                              <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                                {match.stats?.deaths || match.total_deaths || 0}
                              </td>
                              <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                                {match.stats?.assists || match.total_assists || 0}
                              </td>
                              <td className="text-center py-3 px-3 font-bold">
                                <span className={`${
                                  (match.stats?.kda || formatKDA(match.stats?.eliminations || 0, match.stats?.deaths || 0, match.stats?.assists || 0)) >= 3 ? 'text-green-600 dark:text-green-400' :
                                  (match.stats?.kda || formatKDA(match.stats?.eliminations || 0, match.stats?.deaths || 0, match.stats?.assists || 0)) >= 2 ? 'text-gray-900 dark:text-white' :
                                  'text-red-600 dark:text-red-400'
                                }`}>
                                  {match.stats?.kda || formatKDA(match.stats?.eliminations || 0, match.stats?.deaths || 0, match.stats?.assists || 0)}
                                </span>
                              </td>
                              <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                                {formatDamage(match.stats?.damage_dealt || match.total_damage || 0)}
                              </td>
                              <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                                {(match.stats?.healing_done || match.total_healing || 0) > 0 ? formatDamage(match.stats?.healing_done || match.total_healing) : '-'}
                              </td>
                              <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                                {(match.stats?.damage_blocked || match.total_blocked || 0) > 0 ? formatDamage(match.stats?.damage_blocked || match.total_blocked) : '-'}
                              </td>
                            </tr>
                          );
                        }
                      });
                      
                      // Pagination for Player History - 4 items per page
                      const itemsPerPage = 4;
                      const totalPages = Math.ceil(allRows.length / itemsPerPage);
                      const startIndex = (playerHistoryPage - 1) * itemsPerPage;
                      const endIndex = startIndex + itemsPerPage;
                      const paginatedRows = allRows.slice(startIndex, endIndex);
                      
                      return paginatedRows;
                    })()}
                  </tbody>
                </table>
                
                {/* Pagination Controls for Player History */}
                {(() => {
                  const allRows = [];
                  
                  // Apply same filters as in table rendering
                  let filteredMatches = matchHistory;
                  
                  // Filter by selected match
                  if (selectedMatch) {
                    filteredMatches = filteredMatches.filter(match => match.match_id == selectedMatch);
                  }
                  
                  filteredMatches.forEach((match) => {
                    if (match.map_stats && match.map_stats.length > 0) {
                      // Apply map filter if selected
                      const filteredMapStats = selectedMap ? 
                        match.map_stats.filter(mapData => (mapData.map_number || 1) === parseInt(selectedMap)) :
                        match.map_stats;
                      
                      allRows.push(...filteredMapStats);
                    } else {
                      allRows.push(match);
                    }
                  });
                  
                  const itemsPerPage = 4;
                  const totalPages = Math.ceil(allRows.length / itemsPerPage);
                  
                  if (totalPages > 1) {
                    return (
                      <div className="flex justify-center items-center space-x-2 mt-4">
                        <button
                          onClick={() => setPlayerHistoryPage(Math.max(1, playerHistoryPage - 1))}
                          disabled={playerHistoryPage === 1}
                          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                        >
                          Previous
                        </button>
                        
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Page {playerHistoryPage} of {totalPages}
                        </span>
                        
                        <button
                          onClick={() => setPlayerHistoryPage(Math.min(totalPages, playerHistoryPage + 1))}
                          disabled={playerHistoryPage === totalPages}
                          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                        >
                          Next
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-500">No player history available</p>
              </div>
            )}
          </div>

          {/* Match History Section - vlr.gg style with larger cards */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Match History</h3>
                {matchHistory.length > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Showing {((matchHistoryPage - 1) * MATCHES_PER_PAGE) + 1}-{Math.min(matchHistoryPage * MATCHES_PER_PAGE, matchHistory.length)} of {matchHistory.length} matches
                  </p>
                )}
              </div>
              {dataLoading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              )}
            </div>
            
            {/* Match Cards - vlr.gg style */}
            {matchHistory.length > 0 ? (
              <div className="space-y-4">
                {matchHistory
                  .slice((matchHistoryPage - 1) * MATCHES_PER_PAGE, matchHistoryPage * MATCHES_PER_PAGE)
                  .map((match) => {
                  const playerTeam = match.team || match.player_team || { name: '100 Thieves', logo: '/storage/teams/logos/100t-logo.png' };
                  const opponentTeam = match.opponent || match.opponent_team || { name: 'BOOM Esports', logo: null };
                  const isWin = match.result === 'L' ? false : (match.result === 'W' || match.result === 'WIN');
                  
                  // Parse scores from the match data
                  let team1Score = 0;
                  let team2Score = 0;
                  
                  if (match.score && match.score !== '0-0') {
                    const scores = match.score.split('-');
                    team1Score = parseInt(scores[0]) || 0;
                    team2Score = parseInt(scores[1]) || 0;
                  }
                  
                  return (
                    <div 
                      key={match.match_id || match.id} 
                      className="border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
                      onClick={() => navigateTo('match-detail', { id: match.match_id || match.id })}
                    >
                      {/* Event Header - VLR.gg style */}
                      <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {/* Event Logo */}
                            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              {match.event?.logo ? (
                                <img 
                                  src={match.event.logo} 
                                  alt={match.event.name}
                                  className="w-10 h-10 object-contain"
                                  onError={(e) => { 
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-xs font-bold text-gray-500">MR</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-bold text-gray-500">MR</span>
                              )}
                            </div>
                            <div>
                              <div 
                                className="text-sm font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Use the actual event ID from the match data
                                  const eventId = match.event?.id || match.event_id || 2; // Default to event 2 which exists
                                  navigateTo('event-detail', { id: eventId });
                                }}
                              >
                                {match.event?.name || 'Marvel Rivals Championship'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </div>
                            </div>
                          </div>
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            isWin ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 
                            'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                          }`}>
                            {isWin ? 'WIN' : 'LOSS'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Match Content */}
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          {/* Team 1 with Logo */}
                          <div 
                            onClick={(e) => { e.stopPropagation(); navigateTo(`/teams/${playerTeam.id || 4}`); }}
                            className="flex-1 flex items-center space-x-3 hover:opacity-80"
                          >
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              {playerTeam.logo && playerTeam.logo !== '/storage/teams/logos/100t-logo.png' ? (
                                <img 
                                  src={playerTeam.logo} 
                                  alt={playerTeam.name}
                                  className="w-12 h-12 object-contain"
                                  onError={(e) => { 
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-2xl text-gray-500">?</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-2xl text-gray-500">?</span>
                              )}
                            </div>
                            <div>
                              <div 
                                className="text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateTo('team-detail', { id: playerTeam.id || 4 });
                                }}
                              >
                                {playerTeam.name || '100 Thieves'}
                              </div>
                              <div className="text-xs text-gray-500">Americas</div>
                            </div>
                          </div>
                          
                          {/* Score */}
                          <div className="px-6">
                            <div className="flex items-center space-x-3">
                              <span className={`text-2xl font-bold ${
                                team1Score > team2Score ? 'text-green-600 dark:text-green-400' : 
                                team1Score < team2Score ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {team1Score}
                              </span>
                              <span className="text-gray-400 text-lg">:</span>
                              <span className={`text-2xl font-bold ${
                                team2Score > team1Score ? 'text-green-600 dark:text-green-400' : 
                                team2Score < team1Score ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'
                              }`}>
                                {team2Score}
                              </span>
                            </div>
                            <div className="text-center text-xs text-gray-500 mt-1">{match.format || 'BO3'}</div>
                          </div>
                          
                          {/* Team 2 with Logo */}
                          <div className="flex-1 flex items-center justify-end space-x-3">
                            <div className="text-right">
                              <div 
                                className="text-base font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateTo('team-detail', { id: opponentTeam.id || 32 });
                                }}
                              >
                                {opponentTeam.name || 'BOOM Esports'}
                              </div>
                              <div className="text-xs text-gray-500">Asia</div>
                            </div>
                            <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                              {opponentTeam.logo ? (
                                <img 
                                  src={opponentTeam.logo} 
                                  alt={opponentTeam.name}
                                  className="w-12 h-12 object-contain"
                                  onError={(e) => { 
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span class="text-2xl text-gray-500">?</span>';
                                  }}
                                />
                              ) : (
                                <span className="text-2xl text-gray-500">?</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Removed MVP section - no longer needed */}
                        {false && (
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center space-x-3">
                                <span className="text-gray-500 text-xs">MVP:</span>
                                <div className="flex items-center space-x-2">
                                  {!(match.hero || match.map_stats?.[0]?.hero || 'Hela') ? (
                                    <div className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                      <span className="text-gray-500 dark:text-gray-400 text-xs font-bold">?</span>
                                    </div>
                                  ) : (
                                    <img 
                                      src={getHeroImageSync(match.hero || match.map_stats?.[0]?.hero || 'Hela')} 
                                      alt={match.hero || match.map_stats?.[0]?.hero || 'Hela'}
                                      className="w-5 h-5 rounded"
                                    />
                                  )}
                                  <span className="font-medium text-gray-900 dark:text-white text-xs">
                                    {match.hero || match.map_stats?.[0]?.hero || 'Hela'}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-4 text-xs">
                                <div>
                                  <span className="text-gray-500">K/D/A: </span>
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {match.stats?.eliminations || match.map_stats?.[0]?.eliminations || 16}/
                                    {match.stats?.deaths || match.map_stats?.[0]?.deaths || 0}/
                                    {match.stats?.assists || match.map_stats?.[0]?.assists || 5}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">KDA: </span>
                                  <span className={`font-bold ${
                                    parseFloat(match.stats?.kda || match.map_stats?.[0]?.kda || 21) >= 3 ? 'text-green-600 dark:text-green-400' :
                                    parseFloat(match.stats?.kda || match.map_stats?.[0]?.kda || 21) >= 2 ? 'text-gray-900 dark:text-white' :
                                    'text-red-600 dark:text-red-400'
                                  }`}>
                                    {match.stats?.kda || match.map_stats?.[0]?.kda?.toFixed(2) || '21.00'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-500">DMG: </span>
                                  <span className="font-bold text-gray-900 dark:text-white">
                                    {formatDamage(match.stats?.damage_dealt || match.map_stats?.[2]?.damage || 35000)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {/* Pagination for Match History */}
                {Math.ceil(matchHistory.length / MATCHES_PER_PAGE) > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                      onClick={() => setMatchHistoryPage(Math.max(1, matchHistoryPage - 1))}
                      disabled={matchHistoryPage === 1}
                      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {[...Array(Math.ceil(matchHistory.length / MATCHES_PER_PAGE))].map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setMatchHistoryPage(page)}
                            className={`px-3 py-1 rounded transition-colors ${
                              matchHistoryPage === page
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setMatchHistoryPage(Math.min(Math.ceil(matchHistory.length / MATCHES_PER_PAGE), matchHistoryPage + 1))}
                      disabled={matchHistoryPage === Math.ceil(matchHistory.length / MATCHES_PER_PAGE)}
                      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-500">No match history available</p>
              </div>
            )}
          </div>

          {/* Team History */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Team History</h3>
            
            {/* Current Team Section */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Current Team</h4>
              {/* Check all possible team field variations */}
              {(player.currentTeam || player.current_team || player.teamId || player.team_id) ? (
                <div className="flex items-center justify-between py-3 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    {/* Team Logo */}
                    <TeamLogo team={player.currentTeam || player.current_team} size="w-12 h-12" />
                    <div>
                      <button
                        onClick={() => navigateTo('team-detail', { id: player.currentTeam?.id || player.current_team?.id || player.teamId || player.team_id })}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                      >
                        {player.currentTeam?.name || player.current_team?.name}
                      </button>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {player.currentTeam?.region || player.current_team?.region || player.region}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-3 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center text-gray-500 dark:text-gray-400">
                  Free Agent
                </div>
              )}
            </div>
            
            {/* Past Teams Section */}
            <div>
              <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-3">Past Teams</h4>
              {(() => {
                // Only use actual team history data from the player
                const teamHistory = player.teamHistory || player.past_teams || [];
                
                if (teamHistory.length === 0) {
                  return (
                    <div className="py-3 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center text-gray-500 dark:text-gray-400">
                      No previous teams
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-2">
                    {teamHistory.map((team, index) => (
                      <div key={index} className="flex items-center justify-between py-3 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          {/* Team Logo or Question Mark */}
                          <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center shadow-sm">
                            <span className="text-xl text-gray-500">?</span>
                          </div>
                          <div>
                            <button
                              onClick={() => navigateTo('team-detail', { id: team.id })}
                              className="text-lg font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                            >
                              {team.name}
                            </button>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {team.region}
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {team.join_date && team.leave_date ? (
                            <span className="font-medium">{new Date(team.join_date).getFullYear()} - {new Date(team.leave_date).getFullYear()}</span>
                          ) : team.join_date ? (
                            <span className="font-medium">Since {new Date(team.join_date).getFullYear()}</span>
                          ) : (
                            <span className="font-medium">Former</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent Mentions - VLR.gg Style */}
          <div className="card p-6">
            <MentionsSection 
              entityType="player"
              entityId={playerId}
              title="Recent Mentions"
            />
          </div>

          {/* Recent Achievements */}
          {player.eventPlacements && player.eventPlacements.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Recent Achievements</h3>
              <div className="space-y-3">
                {player.eventPlacements.slice(0, 5).map((placement, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="text-2xl">
                      {placement.position === 1 ? '🥇' : placement.position === 2 ? '🥈' : placement.position === 3 ? '🥉' : '🏆'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {placement.position === 1 ? '1st' : placement.position === 2 ? '2nd' : placement.position === 3 ? '3rd' : `${placement.position}th`} Place
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {placement.event_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(placement.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Player Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Player: {player.username}
              </h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={editLoading}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username
                      </label>
                      <input
                        type="text"
                        value={editFormData.username || ''}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Real Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.realName || ''}
                        onChange={(e) => handleInputChange('realName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Age
                      </label>
                      <input
                        type="number"
                        value={editFormData.age || ''}
                        onChange={(e) => handleInputChange('age', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        min="16"
                        max="50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Birth Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.birthDate || ''}
                        onChange={(e) => handleInputChange('birthDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={editFormData.country || ''}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={editFormData.nationality || ''}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Region
                      </label>
                      <input
                        type="text"
                        value={editFormData.region || ''}
                        onChange={(e) => handleInputChange('region', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                  </div>
                </div>

                {/* Gaming Information */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Gaming Information</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Role
                      </label>
                      <select
                        value={editFormData.role || ''}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      >
                        <option value="">Select Role</option>
                        <option value="Duelist">Duelist</option>
                        <option value="Vanguard">Vanguard</option>
                        <option value="Strategist">Strategist</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Main Hero
                      </label>
                      <input
                        type="text"
                        value={editFormData.mainHero || ''}
                        onChange={(e) => handleInputChange('mainHero', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Hero Pool
                      </label>
                      <input
                        type="text"
                        value={editFormData.heroPool || ''}
                        onChange={(e) => handleInputChange('heroPool', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        placeholder="e.g., Spider-Man, Iron Man, Captain America"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Jersey Number
                      </label>
                      <input
                        type="number"
                        value={editFormData.jerseyNumber || ''}
                        onChange={(e) => handleInputChange('jerseyNumber', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        min="0"
                        max="99"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={editFormData.status || 'Active'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Retired">Retired</option>
                        <option value="Benched">Benched</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Earnings Information */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Earnings Information</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total Earnings ($)
                      </label>
                      <input
                        type="number"
                        value={editFormData.totalEarnings || ''}
                        onChange={(e) => handleInputChange('totalEarnings', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prize Earnings ($)
                      </label>
                      <input
                        type="number"
                        value={editFormData.earnings || ''}
                        onChange={(e) => handleInputChange('earnings', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Currency
                      </label>
                      <select
                        value={editFormData.earningsCurrency || 'USD'}
                        onChange={(e) => handleInputChange('earningsCurrency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="JPY">JPY</option>
                        <option value="KRW">KRW</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Social Media</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={editFormData.twitter || ''}
                        onChange={(e) => handleInputChange('twitter', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        placeholder="@username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Twitch
                      </label>
                      <input
                        type="text"
                        value={editFormData.twitch || ''}
                        onChange={(e) => handleInputChange('twitch', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        placeholder="username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={editFormData.instagram || ''}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        placeholder="@username"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        YouTube
                      </label>
                      <input
                        type="text"
                        value={editFormData.youtube || ''}
                        onChange={(e) => handleInputChange('youtube', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        placeholder="@channel"
                      />
                    </div>
                  </div>
                </div>

                {/* Biography */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Biography</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Player Biography
                    </label>
                    <textarea
                      value={editFormData.biography || ''}
                      onChange={(e) => handleInputChange('biography', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      disabled={editLoading}
                      placeholder="Enter player biography..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Form Actions */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCancelEdit}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerDetailPage;