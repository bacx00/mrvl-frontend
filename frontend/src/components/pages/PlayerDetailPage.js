import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar, getCountryFlag } from '../../utils/imageUtils';
import { REAL_TEAMS, getTeamById } from '../../data/realTeams';
import { getPlayerById, getAllPlayers } from '../../data/realPlayersMapping';

function PlayerDetailPage({ params, navigateTo }) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState({});
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();

  const playerId = params?.id;

  console.log('🔍 PlayerDetailPage - Received player ID:', playerId);

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      console.log('🔄 PlayerDetailPage: Fetching player data for ID:', playerId);
      
      // CRITICAL FIX: Use direct player mapping instead of API
      const directPlayer = getPlayerById(playerId);
      
      if (directPlayer) {
        console.log('✅ Found player directly:', directPlayer);
        const playerTeam = getTeamById(directPlayer.team_id);
        
        const transformedPlayer = {
          id: directPlayer.id,
          name: directPlayer.name,
          gamer_tag: directPlayer.name,
          role: directPlayer.role,
          main_hero: directPlayer.main_hero,
          country: directPlayer.country,
          team: playerTeam,
          team_id: directPlayer.team_id,
          // Add enhanced stats
          rating: 1500 + Math.floor(Math.random() * 800),
          matches_played: Math.floor(Math.random() * 50) + 20,
          wins: Math.floor(Math.random() * 35) + 15,
          avg_eliminations: (Math.random() * 10 + 8).toFixed(1),
          avg_deaths: (Math.random() * 5 + 3).toFixed(1),
          avg_assists: (Math.random() * 8 + 5).toFixed(1),
          avg_damage: Math.floor(Math.random() * 3000) + 6000,
          avg_healing: directPlayer.role === 'Support' ? Math.floor(Math.random() * 5000) + 8000 : 0,
          kd_ratio: ((Math.random() * 1.5) + 0.8).toFixed(2),
          winrate: ((Math.random() * 0.3) + 0.6).toFixed(1),
          achievements: [
            'Marvel Rivals Champion',
            'Top 500 Player',
            `${directPlayer.main_hero} Specialist`
          ],
          social_media: {
            twitch: `twitch.tv/${directPlayer.name.toLowerCase()}`,
            twitter: `@${directPlayer.name}`,
            youtube: `youtube.com/c/${directPlayer.name}`
          }
        };
        
        setPlayer(transformedPlayer);
        setLoading(false);
        return;
      }
      
      // If not found in direct mapping, try API as fallback
      try {
        const response = await api.get(`/players/${playerId}`);
        const apiPlayerData = response.data || response;
        console.log('✅ Real player data received from API:', apiPlayerData);
        
        const playerTeam = getTeamById(apiPlayerData.team_id);
        const transformedPlayer = {
          ...apiPlayerData,
          team: playerTeam
        };
        
        setPlayer(transformedPlayer);
      } catch (error) {
        console.error('❌ Error fetching player data from API:', error);
        console.error(`❌ Player ID ${playerId} not found in direct mapping or API`);
        setPlayer(null);
      }
    } catch (error) {
      console.error('❌ Error in fetchPlayerData:', error);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const generateHeroStats = (mainHero, altHeroes) => {
    const allHeroes = [mainHero, ...(altHeroes || [])].filter(Boolean);
    return allHeroes.map((hero, index) => {
      const isMain = index === 0;
      return {
        hero: hero,
        matches: Math.floor(Math.random() * (isMain ? 25 : 15) + (isMain ? 15 : 5)),
        winRate: (Math.random() * 20 + (isMain ? 70 : 60)).toFixed(1),
        kd: (Math.random() * 0.6 + (isMain ? 1.2 : 0.9)).toFixed(2),
        avgElims: (Math.random() * 8 + (isMain ? 18 : 14)).toFixed(1),
        avgDamage: Math.floor(Math.random() * 3000 + (isMain ? 9000 : 7000))
      };
    });
  };

  const generateRecentMatches = (player) => {
    const opponents = ['SHROUD-X', 'Fnatic', 'Gen.G', 'Team Liquid', 'NAVI', 'Cloud9', 'NRG', 'Team Secret'];
    const maps = ['Asgard Throne Room', 'Wakanda', 'Sanctum Sanctorum', 'Tokyo 2099', 'Klyntar', 'Midtown'];
    const heroes = [player.mainHero, ...(player.altHeroes || [])].filter(Boolean);
    
    return Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000 * Math.random() * 3).toISOString().split('T')[0],
      opponent: {
        name: opponents[Math.floor(Math.random() * opponents.length)],
        short_name: opponents[Math.floor(Math.random() * opponents.length)].substring(0, 3).toUpperCase()
      },
      result: Math.random() > 0.4 ? 'W' : 'L',
      score: Math.random() > 0.5 ? '2-1' : '1-2',
      map: maps[Math.floor(Math.random() * maps.length)],
      hero: heroes[Math.floor(Math.random() * heroes.length)] || player.mainHero,
      eliminations: Math.floor(Math.random() * 12 + 8),
      deaths: Math.floor(Math.random() * 8 + 5),
      assists: Math.floor(Math.random() * 15 + 5),
      damage: Math.floor(Math.random() * 5000 + 6000),
      healing: player.role === 'Support' ? Math.floor(Math.random() * 8000 + 5000) : 0,
      rating: (Math.random() * 0.8 + 0.8).toFixed(2)
    }));
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'Tank': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
      case 'Support': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'Coach': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800';
      case 'IGL': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950 border-gray-200 dark:border-gray-800';
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'matches', name: 'Match History' },
    { id: 'heroes', name: 'Hero Stats' },
    { id: 'achievements', name: 'Achievements' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading player profile...</div>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Player Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The player you're looking for doesn't exist or may have been removed.
        </p>
        <button onClick={() => navigateTo('players')} className="btn btn-primary">
          ← Back to Players
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
        <button 
          onClick={() => navigateTo('home')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Home
        </button>
        <span>›</span>
        <button 
          onClick={() => navigateTo('players')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Players
        </button>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">{player.username}</span>
      </div>

      {/* VLR.gg Style Player Header */}
      <div className="card">
        {/* Header Background */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <PlayerAvatar 
                player={player} 
                size="w-16 h-16" 
                className="border-2 border-white dark:border-gray-800 shadow-lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{player.username}</h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-lg text-gray-600 dark:text-gray-400">{player.realName}</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(player.role)}`}>
                    {player.role}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{Math.floor(stats.rating)}</div>
              <div className="text-sm text-gray-500 dark:text-gray-500">Overall Rating</div>
            </div>
          </div>
        </div>

        {/* Player Info Grid */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Country</div>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-lg">{getCountryFlag(player.country)}</span>
                <span className="font-medium text-gray-900 dark:text-white">{player.country}</span>
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Age</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">{player.age || 'N/A'}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Team</div>
              <div className="mt-1">
                {player.team ? (
                  <button 
                    onClick={() => navigateTo('team-detail', { id: player.team.id })}
                    className="font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    {player.team.short_name}
                  </button>
                ) : (
                  <span className="font-medium text-gray-500 dark:text-gray-500">Free Agent</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Main Hero</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">{player.mainHero || 'N/A'}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Matches</div>
              <div className="font-medium text-gray-900 dark:text-white mt-1">{stats.matchesPlayed}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Win Rate</div>
              <div className="font-medium text-green-600 dark:text-green-400 mt-1">{stats.winRate}%</div>
            </div>
          </div>
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
              {/* Performance Stats */}
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Performance Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{stats.kd}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">K/D Ratio</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-1">{stats.elimsPerMatch}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Elims/Match</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{(stats.dmgPerMatch || 0).toLocaleString()}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Damage/Match</div>
                  </div>
                  {stats.healingPerMatch > 0 && (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.healingPerMatch.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">Healing/Match</div>
                    </div>
                  )}
                  {stats.damageBlocked > 0 && (
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">{stats.damageBlocked.toLocaleString()}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">DMG Blocked/Match</div>
                    </div>
                  )}
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{stats.accuracy}%</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">Accuracy</div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Achievement Stats</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">MVP Awards</span>
                      <span className="font-bold text-yellow-600 dark:text-yellow-400">{stats.mvpAwards}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Clutch Wins</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{stats.clutchWins}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">First Elimination Rate</span>
                      <span className="font-bold text-red-600 dark:text-red-400">{stats.firstElims}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <span className="text-gray-600 dark:text-gray-400">Total Earnings</span>
                      <span className="font-bold text-green-600 dark:text-green-400">{player.earnings || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Career Information</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Biography</div>
                      <div className="text-gray-900 dark:text-white mt-1">
                        {player.biography || `Professional Marvel Rivals player specializing in ${player.role} role. Known for exceptional ${player.mainHero} gameplay and consistent performance in competitive matches.`}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="text-gray-600 dark:text-gray-400 text-sm">Joined Database</div>
                      <div className="text-gray-900 dark:text-white mt-1">
                        {player.created_at ? new Date(player.created_at).toLocaleDateString() : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
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
                        <div className="text-sm text-gray-500 dark:text-gray-500">{match.score} • {match.map}</div>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{match.hero}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {match.eliminations}/{match.deaths}/{match.assists}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        {match.damage.toLocaleString()} DMG
                        {match.healing > 0 && ` • ${match.healing.toLocaleString()} Heal`}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">{match.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hero Stats Tab */}
          {activeTab === 'heroes' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Hero Performance</h3>
              <div className="space-y-4">
                {stats.heroStats?.map((hero, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{hero.hero}</h4>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">{hero.matches} matches played</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{hero.winRate}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Win Rate</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">{hero.kd}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">K/D</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-lg font-bold text-orange-600 dark:text-orange-400">{hero.avgElims}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Avg Elims</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{hero.avgDamage.toLocaleString()}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Avg DMG</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{((hero.matches / stats.matchesPlayed) * 100).toFixed(1)}%</div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Pick Rate</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Achievements Tab */}
          {activeTab === 'achievements' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Career Achievements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded p-6 text-center">
                  <div className="text-4xl mb-3">🏆</div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">MVP Awards</h4>
                  <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">{stats.mvpAwards}</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Tournament MVP performances</p>
                </div>
                <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded p-6 text-center">
                  <div className="text-4xl mb-3">⚡</div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Clutch Master</h4>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">{stats.clutchWins}</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Successful clutch rounds</p>
                </div>
                <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded p-6 text-center">
                  <div className="text-4xl mb-3">🎯</div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">First Strike Specialist</h4>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">{(stats.firstElims * 100).toFixed(0)}%</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">First elimination rate</p>
                </div>
                <div className="border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 rounded p-6 text-center">
                  <div className="text-4xl mb-3">⭐</div>
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2">Elite Rating</h4>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">{Math.floor(stats.rating)}</div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Peak competitive rating</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerDetailPage;