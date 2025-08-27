import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getEventLogoUrl, getCountryFlag, getCountryName } from '../../utils/imageUtils';
import { useTournamentUpdates } from '../../hooks/useTournamentUpdates';
import MatchCard from '../MatchCard';
import LiquipediaSwissBracket from '../LiquipediaSwissBracket';
import LiquipediaSingleEliminationBracket from '../LiquipediaSingleEliminationBracket';
import '../../styles/liquipedia-tournament.css';

/**
 * Marvel Rivals Ignite Split 2 Tournament Page
 * Specialized component for the 98-team Swiss → Single Elimination tournament
 */
function MarvelRivalsIgnitePage({ params, navigateTo }) {
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [swissBracket, setSwissBracket] = useState(null);
  const [eliminationBracket, setEliminationBracket] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedSwissRound, setSelectedSwissRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api, isAdmin, isModerator } = useAuth();

  // Tournament ID - can be passed via params or hardcoded for Ignite Split 2
  const tournamentId = params?.id || '11';

  // Real-time tournament updates
  const { 
    isConnected: realtimeConnected, 
    connectionStatus, 
    refresh: refreshTournament 
  } = useTournamentUpdates(tournamentId, {
    onTournamentUpdate: (updateData) => {
      console.log('🔄 Marvel Rivals Ignite - Tournament update:', updateData);
      if (updateData.tournament) {
        setTournament(updateData.tournament);
        setTeams(updateData.teams || []);
        setMatches(updateData.matches || []);
        
        // Handle Swiss and Elimination brackets separately
        if (updateData.bracket?.swiss) {
          setSwissBracket(updateData.bracket.swiss);
        }
        if (updateData.bracket?.elimination) {
          setEliminationBracket(updateData.bracket.elimination);
        }
      }
    }
  });

  useEffect(() => {
    fetchTournamentData();
  }, [tournamentId]);

  const fetchTournamentData = async () => {
    try {
      setLoading(true);
      console.log('🏆 Fetching Marvel Rivals Ignite Split 2 data for ID:', tournamentId);
      
      // Try to fetch the tournament data
      const response = await api.get(`/events/${tournamentId}`);
      const tournamentData = response.data?.data || response.data || response;
      
      console.log('✅ Tournament data received:', tournamentData);
      setTournament(tournamentData);
      
      // Extract teams data
      const teamsData = tournamentData.participation?.teams || 
                       tournamentData.teams || 
                       tournamentData.participating_teams || 
                       [];
      setTeams(teamsData);
      
      // Extract matches data
      const matchesData = tournamentData.matches || tournamentData.event_matches || [];
      setMatches(matchesData);
      
      // Extract bracket data - handle Swiss + Elimination format
      if (tournamentData.bracket) {
        if (tournamentData.bracket.swiss) {
          setSwissBracket(tournamentData.bracket.swiss);
        }
        if (tournamentData.bracket.elimination) {
          setEliminationBracket(tournamentData.bracket.elimination);
        }
        // If bracket is in different format, try to detect
        if (tournamentData.bracket.format === 'swiss_elimination') {
          setSwissBracket(tournamentData.bracket.swiss_stage);
          setEliminationBracket(tournamentData.bracket.elimination_stage);
        }
      }
      
    } catch (error) {
      console.error('❌ Error fetching Marvel Rivals Ignite data:', error);
      setError(error.message);
      
      // For demonstration, create mock tournament data if API fails
      if (error.response?.status === 404) {
        console.log('📝 Creating mock Marvel Rivals Ignite Split 2 data for demonstration');
        createMockTournamentData();
      }
    } finally {
      setLoading(false);
    }
  };

  const createMockTournamentData = () => {
    const mockTournament = {
      id: 11,
      name: "Marvel Rivals Ignite Split 2",
      slug: "marvel-rivals-ignite-split-2",
      description: "The second split of Marvel Rivals Ignite featuring 98 teams competing in Swiss System rounds followed by Single Elimination playoffs.",
      logo: {
        url: "/images/events/marvel-rivals-ignite.png",
        fallback: {
          text: "Marvel Rivals Ignite Split 2",
          color: "#dc2626",
          type: "event-logo"
        }
      },
      details: {
        type: "tournament",
        format: "swiss_elimination",
        region: "International",
        game_mode: "Convoy",
        prize_pool: "50000.00",
        currency: "USD"
      },
      schedule: {
        start_date: "2025-09-01 00:00:00",
        end_date: "2025-09-15 00:00:00",
        registration_start: "2025-08-15 00:00:00",
        registration_end: "2025-08-31 00:00:00",
        timezone: "UTC"
      },
      participation: {
        max_teams: 98,
        current_teams: 98,
        registration_open: false,
        teams: []
      },
      status: "ongoing",
      meta: {
        featured: true,
        public: true
      },
      stats: {
        views: 1250,
        matches_count: 245,
        completed_matches: 180
      }
    };

    // Create mock teams data
    const mockTeams = [];
    const regions = ['NA', 'EU', 'APAC', 'CN', 'BR', 'LATAM'];
    const teamNames = [
      'Sentinels', 'Team Liquid', 'G2 Esports', 'Cloud9', 'FNATIC', 'NRG',
      'LOUD', 'DRX', 'Paper Rex', 'EDG', 'Rare Atom', 'BLG',
      // Add more team names for demonstration
    ];

    for (let i = 1; i <= 98; i++) {
      mockTeams.push({
        id: i,
        name: i <= teamNames.length ? teamNames[i-1] : `Team ${i}`,
        short_name: i <= teamNames.length ? teamNames[i-1].substr(0, 3).toUpperCase() : `T${i}`,
        logo: null,
        region: regions[i % regions.length],
        seed: i,
        status: "registered"
      });
    }

    // Create mock Swiss bracket data
    const mockSwissBracket = {
      format: "swiss",
      current_round: 5,
      total_rounds: 7,
      advancement_threshold: { wins: 5, max_losses: 2 },
      standings: mockTeams.slice(0, 32).map((team, index) => ({
        team_id: team.id,
        team_name: team.name,
        team_logo: team.logo,
        team_region: team.region,
        wins: Math.floor(Math.random() * 6),
        losses: Math.floor(Math.random() * 3),
        points: 0,
        round_differential: Math.floor(Math.random() * 10) - 5,
        buchholz: Math.floor(Math.random() * 15),
        status: index < 16 ? 'qualified' : index > 80 ? 'eliminated' : 'active'
      })),
      rounds: {
        1: [],
        2: [],
        3: [],
        4: [],
        5: []
      }
    };

    // Calculate points based on wins
    mockSwissBracket.standings.forEach(standing => {
      standing.points = standing.wins * 3;
    });

    // Sort standings by points, then by differential
    mockSwissBracket.standings.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.round_differential - a.round_differential;
    });

    setTournament(mockTournament);
    setTeams(mockTeams);
    setSwissBracket(mockSwissBracket);
    console.log('✅ Mock Marvel Rivals Ignite Split 2 data created');
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
      'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.upcoming}`}>
        {status === 'live' && <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse inline-block"></span>}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'swiss-standings', name: 'Swiss Standings' },
    { id: 'swiss-rounds', name: 'Swiss Rounds' },
    { id: 'elimination', name: 'Playoffs' },
    { id: 'teams', name: `Teams (${teams.length})` },
    { id: 'matches', name: `Matches (${matches.length})` },
    { id: 'stats', name: 'Statistics' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading Marvel Rivals Ignite Split 2...</div>
        </div>
      </div>
    );
  }

  if (error && !tournament) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">⚡</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Marvel Rivals Ignite Split 2</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tournament data is not available yet. The tournament will be available once created in the backend.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          Error: {error}
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
        <span className="text-gray-900 dark:text-white">Marvel Rivals Ignite Split 2</span>
      </div>

      {/* Tournament Header - Marvel Rivals Themed */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
          <div className="relative z-10 h-full flex items-end p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-lg bg-white/20 overflow-hidden flex-shrink-0">
                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">
                  ⚡
                </div>
              </div>
              
              <div className="text-white">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-bold">Marvel Rivals Ignite Split 2</h1>
                  {realtimeConnected && (
                    <div className="flex items-center gap-2 text-sm bg-green-500 px-2 py-1 rounded">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span>Live Updates</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-orange-100">
                  {tournament && getStatusBadge(tournament.status)}
                  <span>International</span>
                  <span>•</span>
                  <span>Swiss → Single Elimination</span>
                  <span>•</span>
                  <span>98 Teams</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament Stats */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mt-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {tournament ? formatCurrency(tournament.details?.prize_pool, tournament.details?.currency) : '$50,000'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Prize Pool</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {teams.length}/98
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Teams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {swissBracket?.current_round || 1}/{swissBracket?.total_rounds || 7}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Swiss Round</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {swissBracket?.standings?.filter(s => s.status === 'qualified').length || 16}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Qualified</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {tournament?.stats?.views || 1250}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Views</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-0 px-4 py-4 text-sm font-medium transition-colors ${
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
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">About Marvel Rivals Ignite Split 2</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {tournament?.description || 'The second split of Marvel Rivals Ignite featuring 98 teams competing in Swiss System rounds followed by Single Elimination playoffs. Teams battle through 7 rounds of Swiss play, with the top 16 advancing to the playoff bracket.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Swiss Stage</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Rounds:</span>
                      <span className="font-medium">7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Advancement:</span>
                      <span className="font-medium">5+ Wins, ≤2 Losses</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Teams Advance:</span>
                      <span className="font-medium text-green-600">Top 16</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Elimination Stage</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Format:</span>
                      <span className="font-medium">Single Elimination</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Teams:</span>
                      <span className="font-medium">16</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Matches:</span>
                      <span className="font-medium">Best of 3</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Swiss Standings Tab */}
          {activeTab === 'swiss-standings' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Swiss System Standings</h3>
              {swissBracket ? (
                <LiquipediaSwissBracket
                  bracket={swissBracket}
                  tournament={tournament}
                  tournamentId={tournamentId}
                  navigateTo={navigateTo}
                  showStandings={true}
                  compact={false}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📊</div>
                  <div className="text-gray-500 dark:text-gray-500">Swiss standings will appear here once the tournament begins</div>
                </div>
              )}
            </div>
          )}

          {/* Swiss Rounds Tab */}
          {activeTab === 'swiss-rounds' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Swiss System Rounds</h3>
              {swissBracket ? (
                <LiquipediaSwissBracket
                  bracket={swissBracket}
                  tournament={tournament}
                  tournamentId={tournamentId}
                  navigateTo={navigateTo}
                  showStandings={false}
                  compact={true}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎯</div>
                  <div className="text-gray-500 dark:text-gray-500">Swiss rounds will appear here once matches are scheduled</div>
                </div>
              )}
            </div>
          )}

          {/* Elimination Tab */}
          {activeTab === 'elimination' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Single Elimination Playoffs</h3>
              {eliminationBracket ? (
                <LiquipediaSingleEliminationBracket
                  bracket={eliminationBracket}
                  tournament={tournament}
                  tournamentId={tournamentId}
                  navigateTo={navigateTo}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏆</div>
                  <div className="text-gray-500 dark:text-gray-500">
                    Playoff bracket will be generated after Swiss stage completion
                  </div>
                  <div className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                    Top 16 teams from Swiss rounds advance to single elimination
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">
                Participating Teams ({teams.length}/98)
              </h3>
              
              {teams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {teams.map((team) => (
                    <div 
                      key={team.id}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => navigateTo && navigateTo('team-detail', { id: team.id })}
                    >
                      <div className="flex items-center space-x-3">
                        <TeamLogo team={team} size="w-10 h-10" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 dark:text-white truncate">
                            {team.name}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                            <span>{getCountryFlag(team.region)}</span>
                            <span>{team.region}</span>
                            <span>•</span>
                            <span>Seed #{team.seed}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <div className="text-gray-500 dark:text-gray-500">Team registration in progress</div>
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
                  <div className="text-gray-500 dark:text-gray-500">Matches will be scheduled once teams are finalized</div>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-6">Tournament Statistics</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">General</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Teams:</span>
                      <span className="font-medium">{teams.length}/98</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Swiss Rounds:</span>
                      <span className="font-medium">7</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Playoff Teams:</span>
                      <span className="font-medium">16</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Matches:</span>
                      <span className="font-medium">{matches.length || '~245'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Prize Pool</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Prize:</span>
                      <span className="font-medium text-green-600">
                        {tournament ? formatCurrency(tournament.details?.prize_pool) : '$50,000'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">1st Place:</span>
                      <span className="font-medium">$20,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">2nd Place:</span>
                      <span className="font-medium">$12,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">3rd-4th Place:</span>
                      <span className="font-medium">$6,000</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Regional Distribution</h4>
                  <div className="space-y-2 text-sm">
                    {teams.length > 0 && 
                      Object.entries(teams.reduce((acc, team) => {
                        const region = team.region || 'Unknown';
                        acc[region] = (acc[region] || 0) + 1;
                        return acc;
                      }, {})).map(([region, count]) => (
                        <div key={region} className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400 flex items-center">
                            {getCountryFlag(region)} {region}
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
    </div>
  );
}

export default MarvelRivalsIgnitePage;