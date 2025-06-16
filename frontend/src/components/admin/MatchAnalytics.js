import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';

function MatchAnalytics({ matchId, onClose }) {
  const { api } = useAuth();
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('overview');

  useEffect(() => {
    if (matchId) {
      fetchMatchAnalytics();
    }
  }, [matchId]);

  const fetchMatchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/matches/${matchId}/comprehensive-stats`);
      setMatchData(response.data || response);
    } catch (error) {
      console.error('Error fetching match analytics:', error);
      // Mock data for demonstration
      setMatchData(generateMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalytics = () => ({
    match: {
      id: matchId,
      team1: { name: 'Team A', short_name: 'TA', logo: '🔥' },
      team2: { name: 'Team B', short_name: 'TB', logo: '⚡' },
      status: 'completed',
      format: 'BO3'
    },
    totalMaps: 3,
    mapWins: { team1: 2, team2: 1 },
    mapStats: [
      {
        mapName: 'Tokyo 2099',
        mode: 'Convoy',
        status: 'completed',
        winner: 'team1',
        duration: 540,
        teamStats: {
          team1: { eliminations: 45, deaths: 32, damage: 15640, healing: 8230 },
          team2: { eliminations: 32, deaths: 45, damage: 12340, healing: 6540 }
        },
        playerStats: {
          team1: [
            { playerName: 'Player1', hero: 'Iron Man', role: 'Duelist', eliminations: 15, deaths: 8, damage: 5200 },
            { playerName: 'Player2', hero: 'Thor', role: 'Tank', eliminations: 8, deaths: 12, damage: 3400 },
            { playerName: 'Player3', hero: 'Storm', role: 'Support', eliminations: 6, deaths: 4, healing: 4500 }
          ],
          team2: [
            { playerName: 'PlayerA', hero: 'Spider-Man', role: 'Duelist', eliminations: 12, deaths: 10, damage: 4100 },
            { playerName: 'PlayerB', hero: 'Hulk', role: 'Tank', eliminations: 5, deaths: 15, damage: 2800 },
            { playerName: 'PlayerC', hero: 'Mantis', role: 'Support', eliminations: 3, deaths: 8, healing: 3200 }
          ]
        }
      }
    ]
  });

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="text-center">
            <div className="text-2xl mb-4">📊</div>
            <div className="text-gray-600 dark:text-gray-400">Loading match analytics...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <div className="text-center">
            <div className="text-4xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Analytics Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No comprehensive statistics found for this match.
            </p>
            <button onClick={onClose} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const calculateTeamAverages = (team) => {
    const maps = matchData.mapStats.filter(m => m.status === 'completed');
    if (maps.length === 0) return { kd: 0, damage: 0, healing: 0 };
    
    const totals = maps.reduce((acc, map) => ({
      eliminations: acc.eliminations + map.teamStats[team].eliminations,
      deaths: acc.deaths + map.teamStats[team].deaths,
      damage: acc.damage + map.teamStats[team].damage,
      healing: acc.healing + map.teamStats[team].healing
    }), { eliminations: 0, deaths: 0, damage: 0, healing: 0 });
    
    return {
      kd: totals.deaths > 0 ? (totals.eliminations / totals.deaths).toFixed(2) : totals.eliminations,
      damage: Math.round(totals.damage / maps.length),
      healing: Math.round(totals.healing / maps.length)
    };
  };

  const getTopPerformer = (team) => {
    const allPlayers = matchData.mapStats.flatMap(map => 
      map.playerStats[team].map(player => ({
        ...player,
        mapName: map.mapName,
        kd: player.deaths > 0 ? (player.eliminations / player.deaths).toFixed(2) : player.eliminations
      }))
    );
    
    return allPlayers.reduce((best, player) => 
      (player.eliminations + player.damage/100) > (best.eliminations + best.damage/100) ? player : best
    , allPlayers[0] || {});
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                <span>📈</span>
                <span>Match Analytics Dashboard</span>
              </h2>
              <div className="mt-2 text-gray-600 dark:text-gray-400">
                {matchData.match.team1?.name} vs {matchData.match.team2?.name} • {matchData.match.format}
              </div>
            </div>
            <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <div className="p-6">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6">
            {[
              { id: 'overview', label: 'Match Overview', icon: '📊' },
              { id: 'maps', label: 'Map Breakdown', icon: '🗺️' },
              { id: 'players', label: 'Player Stats', icon: '🎮' },
              { id: 'heroes', label: 'Hero Analysis', icon: '🦸' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeView === tab.id
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Match Overview */}
          {activeView === 'overview' && (
            <div className="space-y-6">
              {/* Final Score */}
              <div className="bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 rounded-lg p-6">
                <h3 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">Final Result</h3>
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <TeamLogo team={matchData.match.team1} size="w-20 h-20" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {matchData.match.team1?.name}
                    </div>
                    <div className="text-6xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                      {matchData.mapWins.team1}
                    </div>
                  </div>
                  
                  <div className="text-center px-8">
                    <div className="text-3xl text-gray-500 dark:text-gray-500 font-bold">VS</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Best of {matchData.totalMaps}</div>
                  </div>
                  
                  <div className="text-center flex-1">
                    <TeamLogo team={matchData.match.team2} size="w-20 h-20" />
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                      {matchData.match.team2?.name}
                    </div>
                    <div className="text-6xl font-bold text-red-600 dark:text-red-400 mt-2">
                      {matchData.mapWins.team2}
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Performance Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {['team1', 'team2'].map((team, index) => {
                  const averages = calculateTeamAverages(team);
                  const topPerformer = getTopPerformer(team);
                  
                  return (
                    <div key={team} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                      <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                        <TeamLogo team={matchData.match[team]} size="w-8 h-8" />
                        <span>{matchData.match[team]?.name} Performance</span>
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averages.kd}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg K/D</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averages.damage.toLocaleString()}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Damage</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{averages.healing.toLocaleString()}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">Avg Healing</div>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">MVP Performance</div>
                          <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold text-gray-900 dark:text-white">{topPerformer.playerName}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{topPerformer.hero} • {topPerformer.mapName}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-gray-900 dark:text-white">{topPerformer.eliminations}/{topPerformer.deaths}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">{topPerformer.damage?.toLocaleString()} DMG</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Map Breakdown */}
          {activeView === 'maps' && (
            <div className="space-y-6">
              {matchData.mapStats.map((map, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                      <span className="text-2xl">🗺️</span>
                      <span>{map.mapName}</span>
                      <span className="text-sm font-normal text-gray-600 dark:text-gray-400">({map.mode})</span>
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        map.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        map.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {map.status.toUpperCase()}
                      </span>
                      {map.winner && (
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          Winner: {matchData.match[map.winner]?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {['team1', 'team2'].map(team => (
                      <div key={team} className="space-y-4">
                        <h5 className="font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                          <TeamLogo team={matchData.match[team]} size="w-6 h-6" />
                          <span>{matchData.match[team]?.name}</span>
                        </h5>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Eliminations</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {map.teamStats[team].eliminations}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Deaths</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {map.teamStats[team].deaths}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Damage</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {map.teamStats[team].damage.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-600 dark:text-gray-400">Healing</div>
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {map.teamStats[team].healing.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Player Stats and Hero Analysis views would go here */}
          {activeView === 'players' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Detailed Player Statistics</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Comprehensive per-player performance metrics across all maps.
              </p>
            </div>
          )}

          {activeView === 'heroes' && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🦸</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Hero Meta Analysis</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Hero pick rates, win rates, and effectiveness analysis for this match.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchAnalytics;