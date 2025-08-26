import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getCountryFlag, getCountryName, getEventLogoUrl } from '../../utils/imageUtils';
import { useTournamentUpdates } from '../../hooks/useTournamentUpdates';
import MatchCard from '../MatchCard';
import LiquipediaBracket from '../LiquipediaBracket';
import LiquipediaDoubleEliminationBracket from '../LiquipediaDoubleEliminationBracket';
import LiquipediaSwissBracket from '../LiquipediaSwissBracket';
import LiquipediaRoundRobinBracket from '../LiquipediaRoundRobinBracket';
import LiquipediaGSLBracket from '../LiquipediaGSLBracket';
import SimpleBracket from '../SimpleBracket';
import '../../styles/liquipedia-tournament.css';

function TournamentDetailPage({ params, navigateTo }) {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [bracket, setBracket] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [error, setError] = useState(null);
  const { api, isAdmin, isModerator } = useAuth();

  const tournamentId = params?.id;

  // Real-time tournament updates
  const { 
    isConnected: realtimeConnected, 
    connectionStatus, 
    refresh: refreshTournament 
  } = useTournamentUpdates(tournamentId, {
    onTournamentUpdate: (updateData) => {
      console.log('🔄 Tournament update received:', updateData);
      if (updateData.tournament) {
        setTournament(updateData.tournament);
        setTeams(updateData.teams || []);
        setMatches(updateData.matches || []);
        setBracket(updateData.bracket);
        setLastUpdateTime(updateData.timestamp);
      }
    },
    onMatchUpdate: (matchUpdate) => {
      console.log('⚡ Match update received:', matchUpdate);
      // Update specific match in matches array
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === matchUpdate.match.id ? matchUpdate.match : match
        )
      );
    },
    onBracketUpdate: (bracketUpdate) => {
      console.log('🔄 Bracket update received:', bracketUpdate);
      setBracket(bracketUpdate.bracket);
    },
    onError: (error) => {
      console.error('❌ Real-time update error:', error);
      setError(error.message);
    }
  });

  console.log('🔍 TournamentDetailPage - Received tournament ID:', tournamentId);

  useEffect(() => {
    if (tournamentId) {
      fetchTournamentData();
      fetchAvailableTeams();
    }
  }, [tournamentId]);

  useEffect(() => {
    setIsRealTimeConnected(realtimeConnected);
  }, [realtimeConnected]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      console.log('🔄 TournamentDetailPage: Fetching tournament data for ID:', tournamentId);
      
      // Fetch comprehensive tournament data from API (using events endpoint)
      const response = await api.get(`/events/${tournamentId}`);
      const tournamentData = response.data?.data || response.data || response;
      
      console.log('✅ Tournament data received:', tournamentData);
      
      // Set tournament data
      setTournament(tournamentData);
      
      // Set teams if included - handle multiple possible response structures
      let teamsData = [];
      if (tournamentData.teams && Array.isArray(tournamentData.teams)) {
        teamsData = tournamentData.teams;
      } else if (tournamentData.participating_teams && Array.isArray(tournamentData.participating_teams)) {
        teamsData = tournamentData.participating_teams;
      } else if (tournamentData.event_teams && Array.isArray(tournamentData.event_teams)) {
        teamsData = tournamentData.event_teams;
      }
      
      console.log('✅ Teams data found:', teamsData.length, 'teams');
      setTeams(teamsData);
      
      // Set matches if included
      let matchesData = [];
      if (tournamentData.matches && Array.isArray(tournamentData.matches)) {
        matchesData = tournamentData.matches;
      } else if (tournamentData.event_matches && Array.isArray(tournamentData.event_matches)) {
        matchesData = tournamentData.event_matches;
      }
      
      console.log('✅ Matches data found:', matchesData.length, 'matches');
      setMatches(matchesData);
      
      // Set bracket if included - check multiple possible locations
      if (tournamentData.bracket) {
        console.log('✅ Bracket found in response:', tournamentData.bracket);
        setBracket(tournamentData.bracket);
      } else if (tournamentData.bracket_data) {
        console.log('✅ Bracket found in bracket_data:', tournamentData.bracket_data);
        setBracket(tournamentData.bracket_data);
      } else {
        console.log('⚠️ No bracket data found in response');
      }
      
      console.log('✅ Tournament data loaded with embedded teams and matches');
      
    } catch (error) {
      console.error('❌ Error fetching tournament data:', error);
      setTournament(null);
      setMatches([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeams = async () => {
    try {
      const response = await api.get('/teams');
      const allTeams = response.data?.data || response.data || [];
      setAvailableTeams(allTeams);
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
    }
  };

  const handleAddTeam = async () => {
    if (!selectedTeamId) return;
    
    try {
      await api.post(`/admin/events/${tournamentId}/teams`, { team_id: selectedTeamId });
      console.log('✅ Team added successfully');
      
      await fetchTournamentData();
      setShowAddTeamModal(false);
      setSelectedTeamId('');
    } catch (error) {
      console.error('❌ Error adding team:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add team';
      alert(errorMessage);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to remove this team from the tournament?')) return;
    
    try {
      await api.delete(`/admin/events/${tournamentId}/teams/${teamId}`);
      console.log('✅ Team removed successfully');
      
      await fetchTournamentData();
    } catch (error) {
      console.error('❌ Error removing team:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove team';
      alert(errorMessage);
    }
  };

  const generateBracket = async () => {
    try {
      console.log('🏆 Generating bracket for tournament:', tournamentId);
      const response = await api.post(`/admin/events/${tournamentId}/generate-bracket`);
      console.log('✅ Bracket generated successfully');
      
      await fetchTournamentData();
    } catch (error) {
      console.error('❌ Error generating bracket:', error);
      alert('Failed to generate bracket: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBracketMatchUpdate = async (matchId, updates) => {
    try {
      await api.put(`/admin/events/${tournamentId}/matches/${matchId}/score`, updates);
      console.log('✅ Match updated successfully');
      
      await fetchTournamentData();
    } catch (error) {
      console.error('❌ Error updating match:', error);
      alert('Failed to update match: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount || amount === 0) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'upcoming': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      'ongoing': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      'live': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 animate-pulse',
      'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.upcoming}`}>
        {status === 'live' && <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse inline-block"></span>}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getFormatDisplay = (format) => {
    const formatMap = {
      'single_elimination': 'Single Elimination',
      'double_elimination': 'Double Elimination',
      'swiss': 'Swiss System',
      'round_robin': 'Round Robin',
      'group_stage': 'Group Stage',
      'gsl': 'GSL Format',
      'battle_royale': 'Battle Royale'
    };
    return formatMap[format] || format;
  };

  const renderBracket = () => {
    const format = tournament?.details?.format || tournament?.format;
    
    if (!bracket) {
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Bracket not generated yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {teams.length < 2 
              ? `Need at least 2 teams to generate bracket (currently ${teams.length})`
              : 'Click below to generate the tournament bracket'
            }
          </p>
          {(isAdmin() || isModerator()) && teams.length >= 2 && (
            <button 
              onClick={generateBracket}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Generate Bracket
            </button>
          )}
        </div>
      );
    }

    // Render different bracket types based on format
    switch (format) {
      case 'double_elimination':
        return (
          <LiquipediaDoubleEliminationBracket
            bracket={bracket}
            tournament={tournament}
            tournamentId={tournamentId}
            navigateTo={navigateTo}
            isAdmin={isAdmin() || isModerator()}
            onMatchUpdate={handleBracketMatchUpdate}
          />
        );
      
      case 'swiss':
        return (
          <LiquipediaSwissBracket
            bracket={bracket}
            tournament={tournament}
            tournamentId={tournamentId}
            navigateTo={navigateTo}
            isAdmin={isAdmin() || isModerator()}
            onMatchUpdate={handleBracketMatchUpdate}
          />
        );
      
      case 'round_robin':
        return (
          <LiquipediaRoundRobinBracket
            bracket={bracket}
            tournament={tournament}
            tournamentId={tournamentId}
            navigateTo={navigateTo}
            isAdmin={isAdmin() || isModerator()}
            onMatchUpdate={handleBracketMatchUpdate}
          />
        );
      
      case 'single_elimination':
      default:
        return (
          <LiquipediaBracket
            bracket={bracket}
            event={tournament}
            eventId={tournamentId}
            navigateTo={navigateTo}
            isAdmin={isAdmin() || isModerator()}
            onMatchUpdate={handleBracketMatchUpdate}
          />
        );
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'teams', name: `Teams (${teams.length})` },
    { id: 'matches', name: `Matches (${matches.length})` },
    { id: 'bracket', name: 'Bracket' },
    { id: 'stats', name: 'Statistics' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading tournament details...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tournament Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The tournament you're looking for doesn't exist or may have been removed.
        </p>
        <button 
          onClick={() => navigateTo && navigateTo('tournaments')} 
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          ← Back to Tournaments
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
        <button 
          onClick={() => navigateTo && navigateTo('home')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Home
        </button>
        <span>›</span>
        <button 
          onClick={() => navigateTo && navigateTo('tournaments')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Tournaments
        </button>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">{tournament.name}</span>
      </div>

      {/* Tournament Header - Liquipedia Style */}
      <div className="relative">
        {/* Tournament Banner */}
        <div className="h-48 bg-gradient-to-r from-red-600 to-red-800 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative z-10 h-full flex items-end p-8">
            <div className="flex items-center space-x-6">
              {/* Tournament Logo */}
              <div className="w-24 h-24 rounded-lg bg-white/20 overflow-hidden flex-shrink-0">
                <img 
                  src={getEventLogoUrl(tournament)} 
                  alt={tournament.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-3xl font-bold text-white">🏆</div>';
                  }}
                />
              </div>
              
              {/* Tournament Info */}
              <div className="text-white">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold">{tournament.name}</h1>
                  {isRealTimeConnected && (
                    <div className="flex items-center gap-2 text-sm bg-green-500 px-2 py-1 rounded">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span>Live Updates</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-red-100">
                  {getStatusBadge(tournament.status)}
                  <span>{tournament.details?.region || tournament.region}</span>
                  <span>•</span>
                  <span>{getFormatDisplay(tournament.details?.format || tournament.format)}</span>
                </div>
              </div>
            </div>
            
            {/* Admin Controls */}
            {(isAdmin() || isModerator()) && (
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => navigateTo && navigateTo('admin-event-edit', { id: tournament.id })}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded hover:bg-white/30 transition-colors"
                >
                  Edit Tournament
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(tournament.details?.prize_pool || tournament.prize_pool, tournament.details?.currency)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Prize Pool</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {teams.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {matches.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {formatDate(tournament.schedule?.start_date || tournament.start_date)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Start Date</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                  : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">About the Tournament</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {tournament.description || 'No description available.'}
                </p>
              </div>

              {tournament.rules && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">Rules & Format</h3>
                  <div className="prose dark:prose-invert max-w-none">
                    {tournament.rules}
                  </div>
                </div>
              )}

              {tournament.details?.prize_distribution && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">Prize Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(tournament.details.prize_distribution).map(([place, amount]) => (
                      <div key={place} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="font-medium text-gray-900 dark:text-white">{place}</span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(amount, tournament.details?.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule */}
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">Start Date</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatDate(tournament.schedule?.start_date || tournament.start_date)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">End Date</div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatDate(tournament.schedule?.end_date || tournament.end_date)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Participating Teams ({teams.length}/{tournament.participation?.max_teams || tournament.max_teams || '∞'})
                </h3>
                {(isAdmin() || isModerator()) && (
                  <button 
                    onClick={() => setShowAddTeamModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Add Team
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div 
                    key={team.id}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="flex items-center space-x-3 cursor-pointer flex-1"
                        onClick={() => navigateTo && navigateTo('team-detail', { id: team.id })}
                      >
                        <TeamLogo team={team} size="w-12 h-12" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{team.name}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                            <span>{getCountryFlag(team.country || team.region)}</span>
                            <span>{getCountryName(team.country || team.region)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {(isAdmin() || isModerator()) && (
                        <button
                          onClick={() => handleRemoveTeam(team.id)}
                          className="text-red-600 hover:text-red-700 transition-colors p-1"
                          title="Remove team"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {teams.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <div className="text-gray-500 dark:text-gray-500">No teams registered yet</div>
                </div>
              )}
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Tournament Matches</h3>
              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map(match => (
                    <MatchCard 
                      key={match.id}
                      match={match}
                      navigateTo={navigateTo}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">⚔️</div>
                  <div className="text-gray-500 dark:text-gray-500">No matches scheduled yet</div>
                </div>
              )}
            </div>
          )}

          {/* Bracket Tab */}
          {activeTab === 'bracket' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-2">Tournament Bracket</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {getFormatDisplay(tournament.details?.format || tournament.format)} format
                </p>
              </div>
              {renderBracket()}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Tournament Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* General Stats */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">General</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Teams:</span>
                      <span className="font-medium">{teams.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Matches:</span>
                      <span className="font-medium">{matches.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                      <span className="font-medium">{matches.filter(m => m.status === 'completed').length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Ongoing:</span>
                      <span className="font-medium">{matches.filter(m => m.status === 'live' || m.status === 'ongoing').length}</span>
                    </div>
                  </div>
                </div>

                {/* Prize Pool Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Prize Pool</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Prize:</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(tournament.details?.prize_pool || tournament.prize_pool)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                      <span className="font-medium">{tournament.details?.currency || 'USD'}</span>
                    </div>
                  </div>
                </div>

                {/* Regional Distribution */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Regions</h4>
                  <div className="space-y-2 text-sm">
                    {teams.reduce((acc, team) => {
                      const region = team.country || team.region || 'Unknown';
                      acc[region] = (acc[region] || 0) + 1;
                      return acc;
                    }, {}) && 
                      Object.entries(teams.reduce((acc, team) => {
                        const region = team.country || team.region || 'Unknown';
                        acc[region] = (acc[region] || 0) + 1;
                        return acc;
                      }, {})).map(([region, count]) => (
                        <div key={region} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400 flex items-center">
                            {getCountryFlag(region)} {getCountryName(region)}
                          </span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Team to Tournament</h3>
            
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            >
              <option value="">Select a team</option>
              {availableTeams
                .filter(team => !teams.some(t => t.id === team.id))
                .map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.region})
                  </option>
                ))
              }
            </select>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setSelectedTeamId('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeam}
                disabled={!selectedTeamId}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TournamentDetailPage;