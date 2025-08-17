import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar, TeamLogo, getCountryFlag, getHeroImageSync } from '../../utils/imageUtils';
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
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 });
  const [filters, setFilters] = useState({ date_from: '', date_to: '', event_id: '', hero: '', map: '' });
  
  // Edit functionality states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
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
      fetchPlayerData();
      // Also load match history immediately
      fetchPlayerStats();
    }
  }, [playerId]);

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
      
      // Fetch player data with /public/ prefix
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
        currentTeam: playerData.current_team,
        teamHistory: playerData.team_history || playerData.past_teams || [],
        
        // ALL missing fields from database
        eloRating: playerData.elo_rating,
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
      
      // Load comprehensive player statistics
      await fetchPlayerStats();
      
    } catch (error) {
      console.error('Error fetching player data:', error);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
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
            event: match.event || { name: 'Tournament', logo: null },
            date: match.date || match.created_at,
            format: match.format || 'BO3',
            status: match.status,
            player_team: match.player_team || match.team1,
            opponent_team: match.opponent_team || match.team2,
            result: match.result || 'W',
            score: match.score || '2-1',
            map_stats: match.map_stats, // This contains hero stats for each map
            // Calculate totals from map stats
            total_eliminations: match.map_stats.reduce((sum, m) => sum + (m.stats?.kills || 0), 0),
            total_deaths: match.map_stats.reduce((sum, m) => sum + (m.stats?.deaths || 0), 0),
            total_assists: match.map_stats.reduce((sum, m) => sum + (m.stats?.assists || 0), 0),
            total_damage: match.map_stats.reduce((sum, m) => sum + (parseInt(m.stats?.damage) || 0), 0),
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
                  {player.region && (
                    <span className="text-gray-600 dark:text-gray-300">• {player.region}</span>
                  )}
                </div>
                {/* Social Links - VLR.gg Style */}
                {player.socialMedia && Object.values(player.socialMedia).some(link => link) && (
                  <div className="flex items-center space-x-4">
                    {player.socialMedia.twitter && (
                      <a 
                        href={`https://twitter.com/${player.socialMedia.twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        Twitter
                      </a>
                    )}
                    {player.socialMedia.twitch && (
                      <a 
                        href={`https://twitch.tv/${player.socialMedia.twitch}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        Twitch
                      </a>
                    )}
                    {player.socialMedia.instagram && (
                      <a 
                        href={`https://instagram.com/${player.socialMedia.instagram}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Right Side - Stats Section */}
            <div className="text-right">
              {/* Rating and Rank */}
              <div className="mb-4">
                <div className="flex items-center justify-end space-x-2 mb-2">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">{player.rating || 1500}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Rating</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  #{player.rank || 'Unranked'} • {player.division || getDivisionByRating(player.rating || 1500)}
                </div>
              </div>
              
              {/* Role Badge */}
              {player.role && (
                <div className="mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    player.role === 'Duelist' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    player.role === 'Vanguard' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                    player.role === 'Strategist' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {player.role}
                  </span>
                </div>
              )}
              
              {/* Current Team */}
              {player.currentTeam && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Team</div>
                  <div 
                    className="flex items-center justify-end space-x-2 cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors"
                    onClick={() => navigateTo('team-detail', { id: player.currentTeam.id })}
                  >
                    <TeamLogo team={player.currentTeam} size="w-6 h-6" />
                    <span className="font-medium text-gray-900 dark:text-white">{player.currentTeam.short_name || player.currentTeam.name}</span>
                  </div>
                </div>
              )}
              
              {/* Additional Stats */}
              <div className="space-y-2 text-sm">
                {player.totalEarnings > 0 && (
                  <div>
                    <div className="font-bold text-green-600 dark:text-green-400">{formatCurrency(player.totalEarnings)}</div>
                    <div className="text-gray-500 dark:text-gray-400">Earnings</div>
                  </div>
                )}
                {player.winRate !== undefined && (
                  <div>
                    <div className="font-bold text-blue-600 dark:text-blue-400">{player.winRate}%</div>
                    <div className="text-gray-500 dark:text-gray-400">Win Rate</div>
                  </div>
                )}
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
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Username</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.username}</div>
              </div>
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
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Region</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.region || 'N/A'}</div>
              </div>
              {player.nationality && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Nationality</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{player.nationality}</div>
                </div>
              )}
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
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Rating</div>
                <div className="font-medium text-yellow-600 dark:text-yellow-400 mt-1">{player.rating || 1500}</div>
              </div>
              {player.peakRating && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Peak Rating</div>
                  <div className="font-medium text-green-600 dark:text-green-400 mt-1">{player.peakRating}</div>
                </div>
              )}
              {player.eloRating && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">ELO Rating</div>
                  <div className="font-medium text-blue-600 dark:text-blue-400 mt-1">{player.eloRating}</div>
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
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Total Matches</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{player.totalMatches}</div>
              </div>
              {player.wins !== undefined && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Wins</div>
                  <div className="font-medium text-green-600 dark:text-green-400 mt-1">{player.wins}</div>
                </div>
              )}
              {player.losses !== undefined && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Losses</div>
                  <div className="font-medium text-red-600 dark:text-red-400 mt-1">{player.losses}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Win Rate</div>
                <div className="font-medium text-blue-600 dark:text-blue-400 mt-1">{player.winRate}%</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Overall K/D/A</div>
                <div className="font-medium text-purple-600 dark:text-purple-400 mt-1">{player.overallKDA}</div>
              </div>
              {player.kda && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">KDA Ratio</div>
                  <div className="font-medium text-purple-600 dark:text-purple-400 mt-1">{player.kda}</div>
                </div>
              )}
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Earnings</div>
                <div className="font-medium text-green-600 dark:text-green-400 mt-1">
                  {formatCurrency(player.totalEarnings)}
                </div>
              </div>
              {player.earnings && player.earnings !== player.totalEarnings && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Prize Earnings</div>
                  <div className="font-medium text-green-600 dark:text-green-400 mt-1">
                    {formatCurrency(player.earnings)}
                  </div>
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
              {player.mainHero && (
                <div>
                  <div className="text-gray-500 dark:text-gray-500 text-sm">Main Hero</div>
                  <div className="font-medium text-gray-900 dark:text-white mt-1">{player.mainHero}</div>
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
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Status</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1 capitalize">{player.status || 'Active'}</div>
              </div>
            </div>
            
            {/* Biography Section */}
            {player.biography && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-3">Biography</h4>
                <div className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {parseTextWithMentions(player.biography)}
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
            
            {/* Player Performance Table */}
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
                    {matchHistory.map((match) => {
                      // Show each map's hero performance
                      if (match.map_stats && match.map_stats.length > 0) {
                        return match.map_stats.map((mapData, idx) => (
                          <tr key={`${match.id}-${idx}`} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={match.event?.logo || '/images/tournament-placeholder.png'}
                                  alt={match.event?.name || 'Match'}
                                  className="w-6 h-6 rounded"
                                  onError={(e) => { e.target.src = '/images/tournament-placeholder.png'; }}
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {match.event?.name || 'Tournament Match'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {mapData.map_name || `Map ${idx + 1}`}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={getHeroImageSync(mapData.hero)} 
                                  alt={mapData.hero}
                                  className="w-8 h-8 rounded object-cover"
                                  onError={(e) => { e.target.src = '/images/heroes/default.png'; }}
                                />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {mapData.hero}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                              {mapData.stats?.kills || 0}
                            </td>
                            <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                              {mapData.stats?.deaths || 0}
                            </td>
                            <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                              {mapData.stats?.assists || 0}
                            </td>
                            <td className="text-center py-3 px-3 font-bold">
                              <span className={`${
                                formatKDA(mapData.stats?.kills || 0, mapData.stats?.deaths || 0, mapData.stats?.assists || 0) >= 3 ? 'text-green-600 dark:text-green-400' :
                                formatKDA(mapData.stats?.kills || 0, mapData.stats?.deaths || 0, mapData.stats?.assists || 0) >= 2 ? 'text-gray-900 dark:text-white' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {formatKDA(mapData.stats?.kills || 0, mapData.stats?.deaths || 0, mapData.stats?.assists || 0)}
                              </span>
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {formatDamage(mapData.stats?.damage || 0)}
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {mapData.stats?.healing > 0 ? formatDamage(mapData.stats?.healing) : '-'}
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {mapData.stats?.blocked > 0 ? formatDamage(mapData.stats?.blocked) : '-'}
                            </td>
                          </tr>
                        ));
                      } else {
                        // Fallback for matches without map data
                        return (
                          <tr key={match.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={match.event?.logo || '/images/tournament-placeholder.png'}
                                  alt={match.event?.name || 'Match'}
                                  className="w-6 h-6 rounded"
                                  onError={(e) => { e.target.src = '/images/tournament-placeholder.png'; }}
                                />
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {match.event?.name || 'Tournament Match'}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(match.date).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center space-x-2">
                                <img 
                                  src={getHeroImageSync(match.hero_played || 'Storm')} 
                                  alt={match.hero_played || 'Storm'}
                                  className="w-8 h-8 rounded object-cover"
                                  onError={(e) => { e.target.src = '/images/heroes/default.png'; }}
                                />
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {match.hero_played || 'Various'}
                                </span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                              {match.total_eliminations}
                            </td>
                            <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                              {match.total_deaths}
                            </td>
                            <td className="text-center py-3 px-3 font-medium text-gray-900 dark:text-white">
                              {match.total_assists}
                            </td>
                            <td className="text-center py-3 px-3 font-bold">
                              <span className={`${
                                formatKDA(match.total_eliminations, match.total_deaths, match.total_assists) >= 3 ? 'text-green-600 dark:text-green-400' :
                                formatKDA(match.total_eliminations, match.total_deaths, match.total_assists) >= 2 ? 'text-gray-900 dark:text-white' :
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {formatKDA(match.total_eliminations, match.total_deaths, match.total_assists)}
                              </span>
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {formatDamage(match.total_damage || 0)}
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {match.total_healing > 0 ? formatDamage(match.total_healing) : '-'}
                            </td>
                            <td className="text-center py-3 px-3 text-gray-900 dark:text-white">
                              {match.total_blocked > 0 ? formatDamage(match.total_blocked) : '-'}
                            </td>
                          </tr>
                        );
                      }
                    }).flat().slice(0, 10)}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-500">No player history available</p>
              </div>
            )}
          </div>

          {/* Match History Section */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Match History</h3>
              {dataLoading && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              )}
            </div>
            
            {/* Match Cards */}
            {matchHistory.length > 0 ? (
              <div className="space-y-4">
                {matchHistory.map((match) => (
                  <div key={match.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    {/* Match Header */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center justify-between">
                        {/* Event Info */}
                        <div className="flex items-center space-x-4">
                          <img 
                            src={match.event?.logo || '/images/tournament-placeholder.png'}
                            alt={match.event?.name || 'Match'}
                            className="w-10 h-10 rounded object-cover"
                            onError={(e) => { e.target.src = '/images/tournament-placeholder.png'; }}
                          />
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {match.event?.name || 'Scrim'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(match.date).toLocaleDateString()} • {match.format || 'BO3'}
                            </div>
                          </div>
                        </div>

                        {/* Teams and Score */}
                        <div className="flex items-center space-x-8">
                          <div className="flex items-center space-x-3">
                            <TeamLogo team={match.player_team} size="w-8 h-8" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {match.player_team?.name || 'Team'}
                            </span>
                          </div>
                          
                          <div className="text-xl font-bold">
                            <span className={match.result === 'W' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {match.score || '0-0'}
                            </span>
                            <span className={`ml-2 text-sm px-2 py-1 rounded ${
                              match.result === 'W' 
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}>
                              {match.result}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-600 dark:text-gray-400">
                              {match.opponent_team?.name || 'Opponent'}
                            </span>
                            <TeamLogo team={match.opponent_team} size="w-8 h-8" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Map Stats */}
                    {match.map_stats && match.map_stats.length > 0 && (
                      <div className="bg-white dark:bg-gray-900">
                        <table className="w-full">
                          <thead className="bg-gray-100 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Map</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Hero</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">K</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">D</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">A</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">KDA</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">DMG</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Heal</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">BLK</th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Score</th>
                            </tr>
                          </thead>
                          <tbody>
                            {match.map_stats.map((mapData, idx) => (
                              <tr key={idx} className="border-t border-gray-100 dark:border-gray-800">
                                <td className="px-4 py-3">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      Map {mapData.map_number}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {mapData.map_name}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center space-x-2">
                                    <img 
                                      src={getHeroImageSync(mapData.hero)}
                                      alt={mapData.hero}
                                      className="w-8 h-8 rounded"
                                      onError={(e) => { e.target.src = '/images/hero-placeholder.svg'; }}
                                    />
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                      {mapData.hero}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                  {mapData.stats?.kills || 0}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                  {mapData.stats?.deaths || 0}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                  {mapData.stats?.assists || 0}
                                </td>
                                <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                                  {mapData.stats?.kda || '0.00'}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                  {mapData.stats?.damage || '-'}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                  {mapData.stats?.healing || '-'}
                                </td>
                                <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                                  {mapData.stats?.blocked || '-'}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`text-sm font-medium ${
                                    mapData.won ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                  }`}>
                                    {mapData.team_score}-{mapData.opponent_score}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {pagination.last_page > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <button
                      onClick={() => handlePageChange(Math.max(1, pagination.current_page - 1))}
                      disabled={pagination.current_page === 1}
                      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Previous
                    </button>
                    
                    <div className="flex space-x-1">
                      {[...Array(Math.min(5, pagination.last_page))].map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-1 rounded ${
                              pagination.current_page === page
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
                      onClick={() => handlePageChange(Math.min(pagination.last_page, pagination.current_page + 1))}
                      disabled={pagination.current_page === pagination.last_page}
                      className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 hover:bg-gray-300 dark:hover:bg-gray-600"
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

          {/* Team History - Combined Current and Past Teams */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Team History</h3>
            <div className="space-y-4">
              {/* Current Team */}
              {player.currentTeam && (
                <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center space-x-4">
                    <TeamLogo team={player.currentTeam} size="w-12 h-12" />
                    <div>
                      <button
                        onClick={() => navigateTo('team-detail', { id: player.currentTeam.id })}
                        className="text-lg font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400"
                      >
                        {player.currentTeam.name}
                      </button>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {player.currentTeam.region}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                      Current Team
                    </span>
                  </div>
                </div>
              )}
              
              {/* Past Teams */}
              {player.teamHistory && player.teamHistory.length > 0 ? (
                player.teamHistory.map((team, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex items-center space-x-4">
                      <TeamLogo team={team} size="w-12 h-12" />
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
                        <span>{new Date(team.join_date).getFullYear()} - {new Date(team.leave_date).getFullYear()}</span>
                      ) : team.join_date ? (
                        <span>Since {new Date(team.join_date).getFullYear()}</span>
                      ) : (
                        <span>Previous Team</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                !player.currentTeam && (
                  <p className="text-gray-500 dark:text-gray-500 text-center py-4">Free Agent - No team history available</p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Mentions Section */}
          <MentionsSection 
            entityType="player"
            entityId={playerId}
            entityName={player.username}
          />

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