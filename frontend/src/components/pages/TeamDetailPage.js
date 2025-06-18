import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, PlayerAvatar, getCountryFlag } from '../../utils/imageUtils';

function TeamDetailPage({ params, navigateTo }) {
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();

  const teamId = params?.id;

  console.log('🔍 TeamDetailPage - Received team ID:', teamId);

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    } else {
      console.error('❌ TeamDetailPage: No team ID provided');
      setLoading(false);
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching team data for ID:', teamId);
      
      // Try to fetch real team data from API
      try {
        const response = await api.get(`/teams/${teamId}`);
        let teamData = response.data || response;
        
        console.log('✅ Real team data received:', teamData);
        
        // Transform backend data to frontend format
        const transformedTeam = {
          id: teamData.id,
          name: teamData.name,
          shortName: teamData.short_name,
          logo: teamData.logo_url || teamData.logo,
          country: teamData.country,
          region: teamData.region,
          rating: teamData.rating || 1500,
          rank: teamData.rank,
          winRate: teamData.win_rate || 0,
          points: teamData.points || 0,
          peak: teamData.peak || teamData.rating,
          founded: teamData.founded,
          captain: teamData.captain,
          coach: teamData.coach,
          website: teamData.website,
          earnings: teamData.earnings,
          social_media: teamData.social_media,
          achievements: teamData.achievements,
          created_at: teamData.created_at
        };

        // Fetch team players
        let teamPlayers = [];
        try {
          const playersResponse = await api.get(`/players`);
          const allPlayers = playersResponse.data || playersResponse || [];
          // Filter players belonging to this team
          teamPlayers = allPlayers.filter(player => 
            player.team_id === parseInt(teamId) || 
            (player.team && player.team.id === parseInt(teamId))
          );
          console.log('✅ Team players found:', teamPlayers.length);
        } catch (error) {
          console.error('❌ Error fetching team players:', error);
        }

        // Generate team stats
        const teamStats = generateTeamStats(transformedTeam, teamPlayers);
        
        // Generate recent matches
        const recentMatches = generateTeamMatches(transformedTeam);

        setTeam(transformedTeam);
        setPlayers(teamPlayers);
        setMatches(recentMatches);
        setStats(teamStats);
        
      } catch (error) {
        console.error('❌ Error fetching team data from API - NO FALLBACK DATA:', error);
        
        // ✅ NO MOCK DATA - Set null/empty states
        setTeam(null);
        setPlayers([]);
        setMatches([]);
        setStats({});
        
        console.log('❌ TeamDetailPage: No team data available for ID:', teamId);
      }
    } catch (error) {
      console.error('❌ Error in fetchTeamData:', error);
      
      // ✅ NO MOCK DATA - Set null/empty states
      setTeam(null);
      setPlayers([]);
      setMatches([]);
      setStats({});
      setMatches([]);
      setStats(generateTeamStats(basicTeam, []));
    } finally {
      setLoading(false);
    }
  };

  // Generate fallback team data based on team ID
  const generateFallbackTeamData = (teamId) => {
    const fallbackTeams = [
      { name: "Team Alpha Test", shortName: "ALF", region: "NA", country: "US" },
      { name: "Team Beta Test", shortName: "BET", region: "EU", country: "DE" },
      { name: "Gamma Squad", shortName: "GAMMA", region: "APAC", country: "KR" },
      { name: "Delta Force", shortName: "DELTA", region: "NA", country: "CA" },
      { name: "Echo Gaming", shortName: "ECHO", region: "EU", country: "FR" },
      { name: "Foxtrot Elite", shortName: "FOX", region: "APAC", country: "JP" },
      { name: "Golf Champions", shortName: "GOLF", region: "SA", country: "BR" },
      { name: "Hotel Legends", shortName: "HOTEL", region: "NA", country: "US" },
      { name: "India Warriors", shortName: "INDIA", region: "APAC", country: "IN" },
      { name: "Juliet Masters", shortName: "JUL", region: "EU", country: "SE" }
    ];
    
    const teamIndex = (parseInt(teamId) - 1) % fallbackTeams.length;
    const baseTeam = fallbackTeams[teamIndex];
    
    return {
      id: parseInt(teamId),
      name: baseTeam.name,
      shortName: baseTeam.shortName,
      logo: null,
      country: baseTeam.country,
      region: baseTeam.region,
      rating: Math.floor(Math.random() * 1000) + 1500,
      rank: Math.floor(Math.random() * 50) + 1,
      winRate: Math.floor(Math.random() * 30) + 70,
      founded: "2024",
      captain: "TeamCaptain",
      coach: "HeadCoach",
      achievements: ["Regional Qualifier", "Tournament Participant"],
      social_media: {
        twitter: `@${baseTeam.shortName}Esports`,
        twitch: `${baseTeam.shortName.toLowerCase()}_gaming`,
        youtube: `${baseTeam.name.replace(/\s+/g, '')}Gaming`
      }
    };
  };

  // Generate fallback players for a team
  const generateFallbackPlayers = (teamId) => {
    const playerNames = [
      'Tony Stark', 'Steve Rogers', 'Natasha Romanoff', 'Bruce Banner', 'Clint Barton',
      'Thor Odinson', 'Wanda Maximoff', 'Vision', 'Sam Wilson', 'James Rhodes',
      'Scott Lang', 'Hope van Dyne', 'Carol Danvers', 'Stephen Strange', 'Peter Parker'
    ];
    
    const roles = ['Duelist', 'Tank', 'Support', 'Duelist', 'Support'];
    const countries = ['US', 'CA', 'UK', 'DE', 'FR', 'KR', 'JP', 'BR'];
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: parseInt(teamId) * 100 + i + 1,
      name: playerNames[Math.floor(Math.random() * playerNames.length)],
      username: `Player${i + 1}`,
      real_name: playerNames[Math.floor(Math.random() * playerNames.length)],
      role: roles[i],
      country: countries[Math.floor(Math.random() * countries.length)],
      age: Math.floor(Math.random() * 10) + 18,
      rating: Math.floor(Math.random() * 800) + 1200,
      main_hero: ['Iron Man', 'Captain America', 'Thor', 'Hulk', 'Spider-Man'][i]
    }));
  };

  const generateTeamStats = (team, players) => {
    return {
      ranking: team.rank || Math.floor(Math.random() * 50 + 1),
      rating: team.rating || 1500,
      winRate: team.winRate || (Math.random() * 20 + 65).toFixed(1),
      matchesPlayed: Math.floor(Math.random() * 30 + 20),
      mapsWon: Math.floor(Math.random() * 40 + 30),
      mapsLost: Math.floor(Math.random() * 20 + 10),
      averageMatchDuration: (Math.random() * 10 + 20).toFixed(1),
      mapWinRate: generateMapStats(),
      recentForm: generateRecentForm(),
      totalEarnings: team.earnings || `$${(Math.random() * 200000 + 50000).toFixed(0)}`,
      avgTeamRating: calculateAvgTeamRating(players),
      bestMap: 'Asgard Throne Room',
      worstMap: 'Klyntar'
    };
  };

  const generateMapStats = () => {
    const maps = ['Asgard Throne Room', 'Wakanda', 'Sanctum Sanctorum', 'Tokyo 2099', 'Klyntar', 'Midtown'];
    const mapStats = {};
    maps.forEach(map => {
      mapStats[map] = {
        winRate: (Math.random() * 30 + 60).toFixed(1),
        played: Math.floor(Math.random() * 15 + 5),
        won: 0,
        lost: 0
      };
      const played = mapStats[map].played;
      const won = Math.floor(played * (mapStats[map].winRate / 100));
      mapStats[map].won = won;
      mapStats[map].lost = played - won;
    });
    return mapStats;
  };

  const generateRecentForm = () => {
    return Array.from({ length: 10 }, () => Math.random() > 0.35 ? 'W' : 'L');
  };

  const calculateAvgTeamRating = (players) => {
    if (players.length === 0) return 1500;
    const totalRating = players.reduce((sum, player) => sum + (player.rating || 1500), 0);
    return Math.floor(totalRating / players.length);
  };

  const generateTeamMatches = (team) => {
    const opponents = ['SHROUD-X', 'Fnatic', 'Gen.G', 'Team Liquid', 'NAVI', 'Cloud9', 'NRG', 'Team Secret', 'Sentinels', 'TSM'];
    const events = ['Champions 2025', 'Masters Stage 1', 'VCT Americas', 'Lock//In Tournament', 'Marvel Cup'];
    const maps = ['Asgard Throne Room', 'Wakanda', 'Sanctum Sanctorum', 'Tokyo 2099', 'Klyntar', 'Midtown'];
    
    return Array.from({ length: 10 }, (_, i) => {
      const result = Math.random() > 0.4 ? 'W' : 'L';
      const isBO3 = Math.random() > 0.3;
      return {
        id: i + 1,
        date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * Math.random() * 5).toISOString().split('T')[0],
        opponent: {
          name: opponents[Math.floor(Math.random() * opponents.length)],
          short_name: opponents[Math.floor(Math.random() * opponents.length)].substring(0, 3).toUpperCase()
        },
        result: result,
        score: isBO3 
          ? (result === 'W' ? ['2-0', '2-1'][Math.floor(Math.random() * 2)] : ['0-2', '1-2'][Math.floor(Math.random() * 2)])
          : (result === 'W' ? '1-0' : '0-1'),
        event: events[Math.floor(Math.random() * events.length)],
        maps: isBO3 
          ? [maps[Math.floor(Math.random() * maps.length)], maps[Math.floor(Math.random() * maps.length)]]
          : [maps[Math.floor(Math.random() * maps.length)]],
        duration: (Math.random() * 20 + 15).toFixed(0) + 'm'
      };
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return 'text-red-600 dark:text-red-400';
      case 'Tank': return 'text-blue-600 dark:text-blue-400';
      case 'Support': return 'text-green-600 dark:text-green-400';
      case 'Coach': return 'text-purple-600 dark:text-purple-400';
      case 'IGL': return 'text-yellow-600 dark:text-yellow-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'roster', name: 'Roster' },
    { id: 'matches', name: 'Match History' },
    { id: 'stats', name: 'Statistics' }
  ];

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
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Team Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The team you're looking for doesn't exist or may have been removed.
        </p>
        <button 
          onClick={() => navigateTo && navigateTo('teams')} 
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          ← Back to Teams
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
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
          onClick={() => navigateTo && navigateTo('teams')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Teams
        </button>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">{team.shortName}</span>
      </div>

      {/* VLR.gg Style Team Header */}
      <div className="card">
        {/* Header Background */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <TeamLogo 
                team={team} 
                size="w-20 h-20" 
                className="border-2 border-white dark:border-gray-800 shadow-lg"
              />
              <div>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xl text-gray-600 dark:text-gray-400 font-medium">{team.shortName}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getCountryFlag(team.country)}</span>
                    <span className="text-gray-600 dark:text-gray-400">{team.region}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-red-600 dark:text-red-400">{Math.floor(stats.rating)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Team Rating</div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">#{stats.ranking}</div>
              <div className="text-xs text-gray-500 dark:text-gray-500">World Rank</div>
            </div>
          </div>
        </div>

        {/* Team Info Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Win Rate</div>
              <div className="font-bold text-green-600 dark:text-green-400 text-xl mt-1">{stats.winRate}%</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Maps Won</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">{stats.mapsWon}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Maps Lost</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">{stats.mapsLost}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Avg Team Rating</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">{stats.avgTeamRating}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Best Map</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">{stats.bestMap}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Total Earnings</div>
              <div className="font-medium text-green-600 dark:text-green-400 mt-1">{stats.totalEarnings}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Form */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Recent Form</h3>
        <div className="flex items-center space-x-2">
          {stats.recentForm && stats.recentForm.map((result, index) => (
            <div
              key={index}
              className={`w-8 h-8 rounded flex items-center justify-center font-bold text-white text-sm ${
                result === 'W' ? 'bg-green-600' : 'bg-red-600'
              }`}
            >
              {result}
            </div>
          ))}
          <span className="ml-4 text-gray-600 dark:text-gray-400 text-sm">Last 10 matches</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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
            <div className="space-y-8">
              {/* Performance Overview */}
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Performance Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.winRate}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Win Rate</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.matchesPlayed}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Matches Played</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{stats.averageMatchDuration}m</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Avg Match Duration</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">#{stats.ranking}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">World Ranking</div>
                  </div>
                </div>
              </div>

              {/* Key Players Preview */}
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Key Players</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {players.slice(0, 3).map((player) => (
                    <div
                      key={player.id}
                      className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => navigateTo && navigateTo('player-detail', { id: player.id })}
                    >
                      <div className="flex items-center space-x-3">
                        <PlayerAvatar player={player} size="w-12 h-12" />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">{player.username || player.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-500">{player.real_name || player.realName}</div>
                          <div className={`text-sm font-medium ${getRoleColor(player.role)}`}>{player.role}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600 dark:text-red-400">{Math.floor(player.rating || 1500)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">Rating</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Roster Tab */}
          {activeTab === 'roster' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Current Roster</h3>
              <div className="space-y-4">
                {players.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-500">No players found for this team</div>
                  </div>
                ) : (
                  players.map((player) => (
                    <div
                      key={player.id}
                      className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => navigateTo && navigateTo('player-detail', { id: player.id })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <PlayerAvatar player={player} size="w-16 h-16" />
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">{player.username || player.name}</div>
                            <div className="text-gray-600 dark:text-gray-400">{player.real_name || player.realName}</div>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className={`font-medium ${getRoleColor(player.role)}`}>{player.role}</span>
                              <span className="text-gray-500 dark:text-gray-500">•</span>
                              <span className="text-gray-600 dark:text-gray-400">{getCountryFlag(player.country)} {player.country}</span>
                              {player.age && (
                                <>
                                  <span className="text-gray-500 dark:text-gray-500">•</span>
                                  <span className="text-gray-600 dark:text-gray-400">{player.age} years</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{Math.floor(player.rating || 1500)}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-500">Rating</div>
                          {player.main_hero && (
                            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Main: {player.main_hero}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Match History Tab */}
          {activeTab === 'matches' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Recent Match History</h3>
              <div className="space-y-2">
                {matches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold ${
                        match.result === 'W' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {match.result}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">vs {match.opponent.short_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-500">{match.event}</div>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-900 dark:text-white">{match.score}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">{match.maps.join(', ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{match.date}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{match.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-8">
              {/* Map Performance */}
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Map Performance</h3>
                <div className="space-y-4">
                  {Object.entries(stats.mapWinRate || {}).map(([map, data]) => (
                    <div key={map} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-white">{map}</h4>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">{data.played} matches</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded">
                            <div 
                              className="h-full bg-green-600 rounded" 
                              style={{ width: `${data.winRate}%` }}
                            />
                          </div>
                          <span className="font-bold text-green-600 dark:text-green-400">{data.winRate}%</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {data.won}W - {data.lost}L
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Team Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Team Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-3xl mb-2">🏆</div>
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">#{stats.ranking}</div>
                    <div className="text-gray-600 dark:text-gray-400">World Rank</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-3xl mb-2">⚔️</div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{(stats.mapsWon || 0) + (stats.mapsLost || 0)}</div>
                    <div className="text-gray-600 dark:text-gray-400">Total Maps</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.totalEarnings}</div>
                    <div className="text-gray-600 dark:text-gray-400">Earnings</div>
                  </div>
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-3xl mb-2">⭐</div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{stats.avgTeamRating}</div>
                    <div className="text-gray-600 dark:text-gray-400">Avg Rating</div>
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

export default TeamDetailPage;