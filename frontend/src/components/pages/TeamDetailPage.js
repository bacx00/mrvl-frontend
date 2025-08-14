import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, PlayerAvatar, getCountryFlag, getImageUrl } from '../../utils/imageUtils';
import { parseTextWithMentions } from '../shared/UserDisplay';
import MentionsSection from '../shared/MentionsSection';

function TeamDetailPage({ params, navigateTo }) {
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [liveMatches, setLiveMatches] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [matchStats, setMatchStats] = useState({});
  const [activeMatchTab, setActiveMatchTab] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, per_page: 10, total: 0 });
  
  // Edit functionality states
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
  const { api, isAdmin, isModerator } = useAuth();

  const teamId = params?.id;

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    } else {
      console.error('TeamDetailPage: No team ID provided');
      setLoading(false);
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      console.log('Fetching team data for ID:', teamId);
      
      // Fetch comprehensive team data from API
      const response = await api.get(`/teams/${teamId}`);
      const teamData = response.data?.data || response.data || response;
      
      console.log('Real team data received:', teamData);
      
      // Transform backend data to frontend format - ALL FIELDS
      const transformedTeam = {
        id: teamData.id,
        name: teamData.name,
        shortName: teamData.short_name || teamData.shortName,
        logo: teamData.logo_url || teamData.logo,
        flag: teamData.flag_url || teamData.flag,
        country: teamData.country,
        region: teamData.region,
        rating: teamData.rating || 1500,
        rank: teamData.rank,
        winRate: teamData.stats?.win_rate || teamData.win_rate || 0,
        points: teamData.points || 0,
        peak: teamData.peak_rating || teamData.rating,
        founded: teamData.founded,
        foundedDate: teamData.founded_date,
        captain: teamData.captain,
        coach: teamData.coach,
        coachName: teamData.coach_name,
        coachNationality: teamData.coach_nationality,
        manager: teamData.manager,
        owner: teamData.owner,
        coach_data: teamData.coach_data || teamData.coaching_staff || {}, // COACH DATA INTEGRATION
        website: teamData.website,
        earnings: teamData.earnings || teamData.total_earnings || 0,
        social_media: teamData.social_media || teamData.social_links || {},
        achievements: teamData.achievements || [],
        description: teamData.description,
        created_at: teamData.created_at,
        division: teamData.division,
        wins: teamData.wins || 0,
        losses: teamData.losses || 0,
        matchesPlayed: teamData.matches_played || 0,
        mapsWon: teamData.maps_won || 0,
        mapsLost: teamData.maps_lost || 0,
        // Missing ELO and streak fields
        eloRating: teamData.elo_rating,
        peakElo: teamData.peak_elo,
        currentStreakCount: teamData.current_streak_count,
        currentStreakType: teamData.current_streak_type,
        longestWinStreak: teamData.longest_win_streak,
        playerCount: teamData.player_count,
        status: teamData.status || 'Active',
        platform: teamData.platform,
        game: teamData.game,
        recentForm: teamData.recent_form,
        record: teamData.record
      };

      // Extract players from team data
      let teamPlayers = [];
      if (teamData.current_roster && Array.isArray(teamData.current_roster)) {
        teamPlayers = teamData.current_roster;
      } else if (teamData.players && Array.isArray(teamData.players)) {
        teamPlayers = teamData.players;
      } else {
        // Fetch players separately if not included
        try {
          const playersResponse = await api.get(`/players?team_id=${teamId}`);
          teamPlayers = playersResponse.data?.data || playersResponse.data || [];
        } catch (error) {
          console.error('Error fetching team players:', error);
        }
      }
      console.log('Team players found:', teamPlayers.length);

      // Fetch all match categories using new API endpoints
      await fetchTeamMatches();

      // Calculate team stats from backend data
      const teamStats = {
        rating: transformedTeam.rating,
        ranking: transformedTeam.rank || 1,
        winRate: teamData.stats?.win_rate || 0,
        mapsWon: teamData.stats?.maps_won || 0,
        mapsLost: teamData.stats?.maps_lost || 0,
        avgTeamRating: calculateAvgTeamRating(teamPlayers),
        bestMap: teamData.stats?.best_map || 'Unknown',
        totalEarnings: transformedTeam.earnings,
        matchesPlayed: teamData.stats?.matches_played || 0,
        averageMatchDuration: teamData.stats?.avg_match_duration || 25,
        recentForm: teamData.stats?.recent_form || teamData.form || [],
        mapWinRate: teamData.stats?.map_win_rates || {},
        record: `${transformedTeam.wins}-${transformedTeam.losses}`,
        mapDifferential: teamData.stats?.map_differential || 0
      };

      // Set all data
      setTeam(transformedTeam);
      setPlayers(teamPlayers);
      setMatchStats(teamStats);
      
    } catch (error) {
      console.error('Error fetching team data:', error);
      
      // NO MOCK DATA - Set null/empty states
      setTeam(null);
      setPlayers([]);
      setUpcomingMatches([]);
      setLiveMatches([]);
      setRecentMatches([]);
      setMatchStats({});
    } finally {
      setLoading(false);
    }
  };

  // Fetch team matches from new API endpoints
  const fetchTeamMatches = async (page = 1) => {
    if (!teamId) return;
    
    try {
      setMatchesLoading(true);
      
      // Fetch all match categories in parallel
      const [upcomingResponse, liveResponse, recentResponse, statsResponse] = await Promise.all([
        api.get(`/teams/${teamId}/matches/upcoming?per_page=10&page=${page}`).catch(() => ({ data: { data: [], meta: {} } })),
        api.get(`/teams/${teamId}/matches/live`).catch(() => ({ data: { data: [] } })),
        api.get(`/teams/${teamId}/matches/recent?per_page=10&page=${page}`).catch(() => ({ data: { data: [], meta: {} } })),
        api.get(`/teams/${teamId}/matches/stats`).catch(() => ({ data: { data: {} } }))
      ]);
      
      // Set upcoming matches
      const upcomingData = upcomingResponse.data.data || [];
      setUpcomingMatches(upcomingData);
      
      // Set live matches
      const liveData = liveResponse.data.data || [];
      setLiveMatches(liveData);
      
      // Set recent matches
      const recentData = recentResponse.data.data || [];
      setRecentMatches(recentData);
      
      // Set pagination for active tab
      if (recentResponse.data.meta) {
        setPagination(recentResponse.data.meta);
      }
      
      // Set match statistics
      const statsData = statsResponse.data.data || {};
      setMatchStats(prev => ({ ...prev, ...statsData }));
      
      console.log('Team matches loaded:', {
        upcoming: upcomingData.length,
        live: liveData.length,
        recent: recentData.length
      });
      
    } catch (error) {
      console.error('Error fetching team matches:', error);
    } finally {
      setMatchesLoading(false);
    }
  };

  // Handle match tab change
  const handleMatchTabChange = async (tab) => {
    setActiveMatchTab(tab);
    if (tab === 'recent' && recentMatches.length === 0) {
      await fetchTeamMatches();
    }
  };

  // Handle pagination
  const handlePageChange = async (page) => {
    await fetchTeamMatches(page);
  };

  // Helper function to format currency
  const formatCurrency = (amount) => {
    if (typeof amount === 'string' && amount.includes('$')) return amount;
    if (!amount || amount === 0) return '$0';
    return `$${amount.toLocaleString()}`;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Utility function to calculate average team rating
  const calculateAvgTeamRating = (players) => {
    if (players.length === 0) return 1500;
    const totalRating = players.reduce((sum, player) => sum + (player.rating || 1500), 0);
    return Math.floor(totalRating / players.length);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return 'text-red-600 dark:text-red-400';
      case 'Vanguard': return 'text-blue-600 dark:text-blue-400';
      case 'Strategist': return 'text-green-600 dark:text-green-400';
      case 'Coach': return 'text-purple-600 dark:text-purple-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  // Edit functionality functions
  const handleEditTeam = () => {
    if (!team) return;
    
    setEditFormData({
      name: team.name || '',
      shortName: team.shortName || '',
      country: team.country || '',
      region: team.region || '',
      website: team.website || '',
      earnings: team.earnings || 0,
      description: team.description || '',
      coach: team.coach || '',
      manager: team.manager || '',
      owner: team.owner || '',
      founded: team.founded || '',
      foundedDate: team.foundedDate || '',
      division: team.division || '',
      platform: team.platform || '',
      game: team.game || '',
      status: team.status || 'Active',
      // Social media
      twitter: team.social_media?.twitter || '',
      instagram: team.social_media?.instagram || '',
      youtube: team.social_media?.youtube || '',
      facebook: team.social_media?.facebook || '',
      website_url: team.social_media?.website || '',
      discord: team.social_media?.discord || '',
    });
    setIsEditing(true);
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
        name: editFormData.name,
        short_name: editFormData.shortName,
        country: editFormData.country,
        region: editFormData.region,
        website: editFormData.website,
        earnings: parseFloat(editFormData.earnings) || 0,
        description: editFormData.description,
        coach: editFormData.coach,
        manager: editFormData.manager,
        owner: editFormData.owner,
        founded: editFormData.founded,
        founded_date: editFormData.foundedDate,
        division: editFormData.division,
        platform: editFormData.platform,
        game: editFormData.game,
        status: editFormData.status,
        social_media: {
          twitter: editFormData.twitter,
          instagram: editFormData.instagram,
          youtube: editFormData.youtube,
          facebook: editFormData.facebook,
          website: editFormData.website_url,
          discord: editFormData.discord,
        }
      };

      // Update team via API
      const response = await api.put(`/admin/teams/${teamId}`, updateData);
      
      if (response.data || response.success !== false) {
        // Refetch team data to get updated information
        await fetchTeamData();
        setIsEditing(false);
        setEditFormData({});
        alert('Team updated successfully!');
      } else {
        throw new Error(response.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating team:', error);
      alert(error.message || 'Failed to update team. Please try again.');
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
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading team profile...</div>
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">Team Not Found</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          The team you're looking for doesn't exist or may have been removed.
        </h3>
        <button
          onClick={() => navigateTo('teams')}
          className="btn bg-red-600 text-white hover:bg-red-700 mt-4"
        >
          View All Teams
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* VLR.gg Style Team Header */}
      <div className="card mb-8">
        <div className="border border-white dark:border-gray-300 p-8 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <TeamLogo 
                team={team} 
                size="w-24 h-24" 
                className="ring-4 ring-white/20"
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
                <div className="text-xl text-gray-600 dark:text-gray-300 mb-2">{team.shortName}</div>
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCountryFlag(team.country)}</span>
                    <span className="text-gray-600 dark:text-gray-300">{team.region}</span>
                  </div>
                </div>
                {/* Social Links - VLR.gg Style */}
                {team.social_media && Object.keys(team.social_media).length > 0 && (
                  <div className="flex items-center space-x-4">
                    {team.social_media.twitter && (
                      <a 
                        href={`https://twitter.com/${team.social_media.twitter}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        Twitter
                      </a>
                    )}
                    {team.social_media.instagram && (
                      <a 
                        href={`https://instagram.com/${team.social_media.instagram}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        Instagram
                      </a>
                    )}
                    {team.social_media.youtube && (
                      <a 
                        href={`https://youtube.com/@${team.social_media.youtube}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        YouTube
                      </a>
                    )}
                    {team.social_media.website && (
                      <a 
                        href={team.social_media.website.startsWith('http') ? team.social_media.website : `https://${team.social_media.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white transition-colors"
                      >
                        Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(matchStats.totalEarnings || team.earnings || 0)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Earnings</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{Math.floor(matchStats.rating || team.rating || 1500)}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Rating • #{matchStats.ranking || team.rank || 'N/A'}</div>
              
              {/* Edit Button for Admins/Moderators */}
              {(isAdmin() || isModerator()) && !isEditing && (
                <button
                  onClick={handleEditTeam}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Edit Team
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout - VLR.gg Style */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">

          {/* Team Statistics */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Team Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Record</div>
                <div className="font-bold text-gray-900 dark:text-white text-lg mt-1">{matchStats.record || `${team.wins || 0}-${team.losses || 0}`}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Win Rate</div>
                <div className="font-bold text-green-600 dark:text-green-400 text-lg mt-1">{matchStats.winRate || 0}%</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Avg Team Rating</div>
                <div className="font-medium text-gray-900 dark:text-white mt-1">{Math.floor(matchStats.avgTeamRating || 1500)}</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-500 text-sm">Map Diff</div>
                <div className={`font-medium mt-1 ${(matchStats.mapDifferential || 0) > 0 ? 'text-green-600' : (matchStats.mapDifferential || 0) < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {(matchStats.mapDifferential || 0) > 0 ? '+' : ''}{matchStats.mapDifferential || 0}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Form */}
          {matchStats.recentForm && matchStats.recentForm.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Recent Form</h3>
              <div className="flex items-center space-x-2">
                {matchStats.recentForm.map((result, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white text-sm ${
                      result === 'W' ? 'bg-green-600' : 'bg-red-600'
                    }`}
                  >
                    {result}
                  </div>
                ))}
                <span className="ml-4 text-gray-600 dark:text-gray-400 text-sm">Last {matchStats.recentForm.length} matches</span>
              </div>
            </div>
          )}

          {/* Active Roster */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Active Roster</h3>
            <div className="space-y-3">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-4 p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => navigateTo && navigateTo('player-detail', { id: player.id })}
                >
                  <PlayerAvatar player={player} size="w-12 h-12" />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400">
                      {player.username || player.name}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className={getRoleColor(player.role)}>{player.role}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-600 dark:text-gray-400">{player.real_name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{player.rating || 1500}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Rating</div>
                  </div>
                </div>
              ))}
            </div>
            {/* COACH DATA INTEGRATION - Enhanced coach display */}
            {(team.coach || team.coach_data) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                  <span className="text-lg mr-2">🧑‍🏫</span>
                  Coaching Staff
                </h4>
                
                <div className="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {/* Coach Avatar */}
                  {team.coach_data?.avatar && (
                    <img 
                      src={team.coach_data.avatar} 
                      alt="Coach avatar" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {team.coach_data?.name || team.coach}
                      </span>
                      {team.coach_data?.nationality && (
                        <span className="text-sm">
                          {getCountryFlag(team.coach_data.nationality)} {team.coach_data.nationality}
                        </span>
                      )}
                    </div>
                    
                    {team.coach_data?.real_name && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Real Name: {team.coach_data.real_name}
                      </div>
                    )}
                    
                    {team.coach_data?.experience && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Experience: {team.coach_data.experience}
                      </div>
                    )}
                    
                    {team.coach_data?.achievements && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        <span className="font-medium">Achievements:</span> {team.coach_data.achievements}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Match History Section - VLR.gg Style */}
          <div className="card">
            {/* Match Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
              <div className="flex">
                <button
                  onClick={() => handleMatchTabChange('upcoming')}
                  className={`px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeMatchTab === 'upcoming'
                      ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>Upcoming</span>
                  {upcomingMatches.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                      {upcomingMatches.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleMatchTabChange('live')}
                  className={`px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeMatchTab === 'live'
                      ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>Live</span>
                  {liveMatches.length > 0 && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                      {liveMatches.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleMatchTabChange('recent')}
                  className={`px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                    activeMatchTab === 'recent'
                      ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span>Recent Results</span>
                  {recentMatches.length > 0 && (
                    <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                      {recentMatches.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Match Content */}
            <div className="p-6">
              {matchesLoading ? (
                <div className="text-center py-8">
                  <div className="loading-spinner mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
                </div>
              ) : (
                <>
                  {/* Upcoming Matches */}
                  {activeMatchTab === 'upcoming' && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                        Upcoming Matches ({upcomingMatches.length})
                      </h3>
                      {upcomingMatches.length > 0 ? (
                        <div className="space-y-3">
                          {upcomingMatches.map((match, index) => (
                            <div 
                              key={match.id || index}
                              onClick={() => navigateTo('match-detail', { id: match.id })}
                              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 cursor-pointer transition-colors border border-blue-200 dark:border-blue-800"
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
                                
                                {/* Time Badge */}
                                <div className="text-blue-600 dark:text-blue-400 font-bold text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                                  {match.time_until || 'SCHEDULED'}
                                </div>
                                
                                {/* Teams Display - VLR.gg Style with Both Logos */}
                                <div className="flex items-center space-x-3">
                                  {/* Current Team Logo */}
                                  <TeamLogo team={team} size="w-8 h-8" />
                                  
                                  {/* VS Badge */}
                                  <div className="text-gray-400 font-medium text-sm">
                                    VS
                                  </div>
                                  
                                  {/* Opponent Logo */}
                                  <TeamLogo team={match.opponent} size="w-8 h-8" />
                                  
                                  {/* Match Info */}
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {match.opponent?.name || 'TBD'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      {match.event_name} • {match.format || 'BO3'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Date & Time */}
                              <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(match.scheduled_at)}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-500">
                                  {new Date(match.scheduled_at).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-500 dark:text-gray-500">No upcoming matches scheduled</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Live Matches */}
                  {activeMatchTab === 'live' && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4 flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                        Live Matches ({liveMatches.length})
                      </h3>
                      {liveMatches.length > 0 ? (
                        <div className="space-y-3">
                          {liveMatches.map((match, index) => (
                            <div 
                              key={match.id || index}
                              onClick={() => navigateTo('match-detail', { id: match.id })}
                              className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 cursor-pointer transition-colors border border-red-200 dark:border-red-800"
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
                                
                                {/* LIVE Badge */}
                                <div className="bg-red-600 text-white px-3 py-1 text-xs font-bold rounded-full animate-pulse">
                                  LIVE
                                </div>
                                
                                {/* Teams Display - VLR.gg Style with Both Logos */}
                                <div className="flex items-center space-x-3">
                                  {/* Current Team Logo */}
                                  <TeamLogo team={team} size="w-8 h-8" />
                                  
                                  {/* Live Score */}
                                  <div className="text-center min-w-[60px]">
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                                      <span className="text-red-600 dark:text-red-400">{match.team_score || 0}</span>
                                      <span className="mx-1 text-gray-400">-</span>
                                      <span className="text-blue-600 dark:text-blue-400">{match.opponent_score || 0}</span>
                                    </div>
                                  </div>
                                  
                                  {/* Opponent Logo */}
                                  <TeamLogo team={match.opponent} size="w-8 h-8" />
                                  
                                  {/* Match Info */}
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-white">
                                      {match.opponent?.name || 'TBD'}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      {match.event_name} • Map {match.current_map || 1}/{match.maps_total || 3}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Format */}
                              <div className="text-right">
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {match.format || 'BO3'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-500 dark:text-gray-500">No live matches</div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Recent Results */}
                  {activeMatchTab === 'recent' && (
                    <div>
                      <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                        Recent Results ({recentMatches.length})
                      </h3>
                      {recentMatches.length > 0 ? (
                        <div className="space-y-3">
                          {recentMatches.map((match, index) => {
                            const isTeam1 = match.team1_id === team.id;
                            const teamScore = isTeam1 ? match.team1_score : match.team2_score;
                            const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
                            const opponent = isTeam1 ? match.team2 : match.team1;
                            const won = teamScore > opponentScore;
                            
                            return (
                              <div 
                                key={match.id || index}
                                onClick={() => navigateTo('match-detail', { id: match.id })}
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
                                    won ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' 
                                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                  }`}>
                                    {won ? 'W' : 'L'}
                                  </div>
                                  
                                  {/* Teams Display - VLR.gg Style with Both Logos */}
                                  <div className="flex items-center space-x-3">
                                    {/* Current Team Logo */}
                                    <TeamLogo team={team} size="w-8 h-8" />
                                    
                                    {/* Score */}
                                    <div className="text-center min-w-[60px]">
                                      <div className="font-bold text-gray-900 dark:text-white">
                                        <span className={won ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                          {teamScore}
                                        </span>
                                        <span className="mx-1 text-gray-400">-</span>
                                        <span className={!won ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
                                          {opponentScore}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    {/* Opponent Logo */}
                                    <TeamLogo team={opponent} size="w-8 h-8" />
                                    
                                    {/* Match Info */}
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {opponent?.name || 'TBD'}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-500">
                                        {match.event_name || 'Scrim'} • {match.format || 'BO3'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Date */}
                                <div className="text-right">
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatDate(match.scheduled_at)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          
                          {/* Pagination */}
                          {pagination.last_page > 1 && (
                            <div className="flex items-center justify-center space-x-2 pt-4">
                              <button
                                onClick={() => handlePageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page <= 1}
                                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                              >
                                Previous
                              </button>
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                Page {pagination.current_page} of {pagination.last_page}
                              </span>
                              <button
                                onClick={() => handlePageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page >= pagination.last_page}
                                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
                              >
                                Next
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-gray-500 dark:text-gray-500">No recent matches</div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - VLR.gg Style */}
        <div className="space-y-6">
          {/* Recent Mentions - VLR.gg Style */}
          <div className="card p-6">
            <MentionsSection 
              entityType="team" 
              entityId={team.id} 
              title="Recent Mentions"
            />
          </div>


          {/* Achievements */}
          {team.achievements && team.achievements.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Major Achievements</h3>
              <div className="space-y-4">
                {team.achievements.map((achievement, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      {achievement.event_logo && (
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <img 
                            src={achievement.event_logo} 
                            alt={achievement.event_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = getImageUrl(null, 'event-banner'); }}
                          />
                        </div>
                      )}
                      <div className={`text-lg font-bold ${
                        achievement.placement === 1 ? 'text-yellow-500' :
                        achievement.placement === 2 ? 'text-gray-400' :
                        achievement.placement === 3 ? 'text-orange-600' :
                        'text-gray-600 dark:text-gray-400'
                      }`}>
                        #{achievement.placement}
                      </div>
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm">
                      {achievement.event_name}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {formatDate(achievement.date)}
                    </div>
                    {achievement.prize && (
                      <div className="text-green-600 dark:text-green-400 font-semibold text-sm mt-1">
                        {formatCurrency(achievement.prize)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Team Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Team: {team.name}
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
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Short Name
                      </label>
                      <input
                        type="text"
                        value={editFormData.shortName || ''}
                        onChange={(e) => handleInputChange('shortName', e.target.value)}
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Total Earnings ($)
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
                        <option value="Disbanded">Disbanded</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Team Management */}
                <div>
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Team Management</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Coach
                      </label>
                      <input
                        type="text"
                        value={editFormData.coach || ''}
                        onChange={(e) => handleInputChange('coach', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Manager
                      </label>
                      <input
                        type="text"
                        value={editFormData.manager || ''}
                        onChange={(e) => handleInputChange('manager', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Owner
                      </label>
                      <input
                        type="text"
                        value={editFormData.owner || ''}
                        onChange={(e) => handleInputChange('owner', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Founded Year
                      </label>
                      <input
                        type="text"
                        value={editFormData.founded || ''}
                        onChange={(e) => handleInputChange('founded', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Founded Date
                      </label>
                      <input
                        type="date"
                        value={editFormData.foundedDate || ''}
                        onChange={(e) => handleInputChange('foundedDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        value={editFormData.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        disabled={editLoading}
                        placeholder="https://"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Social Media</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                {/* Description */}
                <div className="md:col-span-2">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">Description</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Team Description
                    </label>
                    <textarea
                      value={editFormData.description || ''}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      disabled={editLoading}
                      placeholder="Enter team description..."
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

export default TeamDetailPage;