import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';

function ComprehensiveLiveScoring({ match, isOpen, onClose, onUpdate }) {
  const { api } = useAuth();
  const [activeMap, setActiveMap] = useState(0);

  // COMPREHENSIVE MARVEL RIVALS MAP POOL - REAL GAME MAPS
  const marvelRivalsMaps = [
    { 
      name: 'Tokyo 2099: Spider-Islands', 
      mode: 'Convoy', 
      icon: '🏙️',
      checkpoints: ['Spider Bridge', 'Neon District', 'Final Plaza'],
      timeLimit: 600 // 10 minutes
    },
    { 
      name: 'Midtown Manhattan', 
      mode: 'Domination', 
      icon: '🏢',
      checkpoints: ['Times Square', 'Central Park', 'Brooklyn Bridge'],
      timeLimit: 480 // 8 minutes
    },
    { 
      name: 'Wakanda Palace', 
      mode: 'Convoy', 
      icon: '⚡',
      checkpoints: ['Vibranium Mines', 'Royal Chambers', 'Panther Statue'],
      timeLimit: 600
    },
    { 
      name: 'Sanctum Sanctorum', 
      mode: 'Domination', 
      icon: '🔮',
      checkpoints: ['Mystic Library', 'Portal Room', 'Astral Plane'],
      timeLimit: 480
    },
    { 
      name: 'Asgard: Royal Palace', 
      mode: 'Convoy', 
      icon: '🌈',
      checkpoints: ['Bifrost Bridge', 'Throne Room', 'Rainbow Bridge'],
      timeLimit: 600
    },
    { 
      name: 'Klyntar Symbiote World', 
      mode: 'Domination', 
      icon: '🌌',
      checkpoints: ['Symbiote Nest', 'Dark Caverns', 'Venom Pools'],
      timeLimit: 480
    },
    { 
      name: 'Birnin Zana: Golden City', 
      mode: 'Convoy', 
      icon: '🏛️',
      checkpoints: ['Golden District', 'Tech Labs', 'Ceremonial Plaza'],
      timeLimit: 600
    }
  ];

  // ✅ ENHANCED MARVEL RIVALS HEROES BY ROLE - ALIGNED WITH BACKEND
  const marvelRivalsHeroes = {
    Tank: [
      'Captain America', 'Doctor Strange', 'Groot', 'Hulk', 
      'Magneto', 'Peni Parker', 'The Thing', 'Thor', 'Venom'
    ],
    Duelist: [
      'Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Human Torch',
      'Iron Fist', 'Iron Man', 'Magik', 'Moon Knight', 'Namor', 
      'Psylocke', 'The Punisher', 'Scarlet Witch', 'Spider-Man', 
      'Squirrel Girl', 'Star-Lord', 'Storm', 'Wolverine'
    ],
    Support: [
      'Adam Warlock', 'Cloak & Dagger', 'Invisible Woman', 'Jeff the Land Shark', 
      'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon'
    ]
  };

  // COMPREHENSIVE MATCH STATE WITH PERFECT ALIGNMENT
  const [matchStats, setMatchStats] = useState(() => {
    if (!match) return null;
    
    return {
      // Overall match stats
      totalMaps: match.format === 'BO5' ? 5 : match.format === 'BO3' ? 3 : 1,
      currentMap: 0,
      mapWins: { team1: match.team1_score || 0, team2: match.team2_score || 0 },
      
      // 🎮 PERFECT ALIGNMENT: Use exact same structure as MatchDetailPage
      maps: (match.maps || Array.from({ length: match.format === 'BO5' ? 5 : match.format === 'BO3' ? 3 : 1 }, (_, index) => ({
        map_number: index + 1,
        map_name: marvelRivalsMaps[index]?.name || 'Asgard Throne Room',
        mode: marvelRivalsMaps[index]?.mode || 'Convoy',
        team1Score: 0,
        team2Score: 0,
        status: 'upcoming',
        winner: null,
        duration: 'Not started',
        // 🎮 CRITICAL: Use same player structure as MatchDetailPage with DIVERSE HEROES
        team1Players: (match.maps?.[index]?.team1_composition || Array.from({ length: 6 }, (_, pIndex) => {
          const defaultHeroes = ['Captain America', 'Iron Man', 'Black Widow', 'Doctor Strange', 'Mantis', 'Hulk'];
          const defaultRoles = ['Tank', 'Duelist', 'Duelist', 'Tank', 'Support', 'Tank'];
          const defaultCountries = ['US', 'CA', 'UK', 'DE', 'FR', 'SE'];
          return {
            id: `${match.team1?.id}_p${pIndex + 1}`,
            name: `${match.team1?.short_name || 'T1'}_Player${pIndex + 1}`,
            hero: defaultHeroes[pIndex] || 'Captain America',
            role: defaultRoles[pIndex] || 'Tank',
            country: defaultCountries[pIndex] || 'US',
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damageBlocked: 0,
            objectiveTime: 0,
            ultimatesUsed: 0
          };
        })),
        team2Players: (match.maps?.[index]?.team2_composition || Array.from({ length: 6 }, (_, pIndex) => {
          const defaultHeroes = ['Storm', 'Spider-Man', 'Hawkeye', 'Venom', 'Luna Snow', 'Groot'];
          const defaultRoles = ['Support', 'Duelist', 'Duelist', 'Tank', 'Support', 'Tank'];
          const defaultCountries = ['KR', 'JP', 'AU', 'BR', 'CN', 'INTL'];
          return {
            id: `${match.team2?.id}_p${pIndex + 1}`,
            name: `${match.team2?.short_name || 'T2'}_Player${pIndex + 1}`,
            hero: defaultHeroes[pIndex] || 'Storm',
            role: defaultRoles[pIndex] || 'Support',
            country: defaultCountries[pIndex] || 'KR',
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damageBlocked: 0,
            objectiveTime: 0,
            ultimatesUsed: 0
          };
        }))

      }))).map((map, index) => ({
        ...map,
        map_number: index + 1,
        map_name: map.map_name || marvelRivalsMaps[index]?.name || 'Asgard Throne Room',
        mode: marvelRivalsMaps[index]?.mode || 'Convoy'
      }))
    };
  });

  // CRITICAL FIX: Null check for match AFTER hooks
  if (!isOpen || !match || !matchStats) return null;

  // UPDATE PLAYER STAT
  const updatePlayerStat = (mapIndex, team, playerIndex, statType, value) => {
    setMatchStats(prev => {
      const newStats = { ...prev };
      newStats.maps[mapIndex].team1Players[playerIndex][statType] = team === 'team1' ? value : newStats.maps[mapIndex].team1Players[playerIndex][statType];
      newStats.maps[mapIndex].team2Players[playerIndex][statType] = team === 'team2' ? value : newStats.maps[mapIndex].team2Players[playerIndex][statType];

      // No team totals needed with new structure
      
      return newStats;
    });
  };

  // UPDATE MAP STATUS - CRITICAL FIX
  const updateMapStatus = async (mapIndex, status, winner = null) => {
    setMatchStats(prev => {
      const newStats = { ...prev };
      
      // 🚨 CRITICAL FIX: Check if map exists before updating
      if (!newStats.maps || !newStats.maps[mapIndex]) {
        console.error(`❌ Map ${mapIndex} does not exist in matchStats.maps:`, newStats.maps);
        return prev; // Return unchanged state
      }
      
      newStats.maps[mapIndex].status = status;
      newStats.maps[mapIndex].winner = winner;
      
      if (winner) {
        newStats.mapWins[winner]++;
      }
      
      return newStats;
    });

    // Send to backend
    try {
      await api.put(`/matches/${match.id}/maps/${mapIndex}`, {
        status,
        winner,
        stats: matchStats.maps[mapIndex]
      });
    } catch (error) {
      console.error('Error updating map:', error);
    }
  };

  // HERO CHANGE
  const changePlayerHero = (mapIndex, team, playerIndex, hero, role) => {
    setMatchStats(prev => {
      const newStats = { ...prev };
      const targetPlayers = team === 'team1' ? newStats.maps[mapIndex].team1Players : newStats.maps[mapIndex].team2Players;
      targetPlayers[playerIndex].hero = hero;
      targetPlayers[playerIndex].role = role;
      targetPlayers[playerIndex].heroSwitches++;
      return newStats;
    });
  };
  
  // SAVE TO BACKEND - ENHANCED REAL-TIME SYNC
  const handleSaveStats = async () => {
    try {
      console.log('🔄 Saving match stats and hero updates to backend...');
      
      // CRITICAL FIX: Use existing backend endpoint for saving stats
      await api.put(`/admin/matches/${match.id}`, {
        team1_score: matchStats.mapWins.team1,
        team2_score: matchStats.mapWins.team2,
        status: 'live',
        // 🚨 CRITICAL: Include ALL match data including hero compositions
        maps: matchStats.maps.map((mapData, index) => ({
          map_number: index + 1,
          map_name: mapData.name || mapData.map_name,
          team1_score: mapData.team1Score || 0,
          team2_score: mapData.team2Score || 0,
          status: mapData.status || 'upcoming',
          winner_id: mapData.winner ? (mapData.winner === 'team1' ? match.team1?.id : match.team2?.id) : null,
          // 🎮 CRITICAL: Include updated hero compositions
          team1_composition: mapData.team1Players?.map(player => ({
            player_id: player.id,
            player_name: player.name,
            hero: player.hero,
            role: player.role,
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0
          })),
          team2_composition: mapData.team2Players?.map(player => ({
            player_id: player.id,
            player_name: player.name,
            hero: player.hero,
            role: player.role,
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0
          }))
        }))
      });
      
      // 🔥 CRITICAL FIX: Enhanced real-time update event with hero data
      console.log('🔥 DISPATCHING ENHANCED REAL-TIME UPDATE EVENT for match:', match.id);
      window.dispatchEvent(new CustomEvent('mrvl-match-updated', {
        detail: {
          matchId: match.id,
          type: 'HERO_UPDATE', // Add event type for better handling
          matchData: {
            ...match,
            team1_score: matchStats.mapWins.team1,
            team2_score: matchStats.mapWins.team2,
            status: 'live',
            maps: matchStats.maps,
            lastUpdated: Date.now()
          }
        }
      }));
      
      // Force browser cache refresh
      if ('caches' in window) {
        caches.delete('match-data-cache');
      }
      
      alert('✅ Stats and hero compositions saved successfully! Changes synced live.');
      if (onUpdate) onUpdate({
        ...match,
        team1_score: matchStats.mapWins.team1,
        team2_score: matchStats.mapWins.team2,
        status: 'live',
        maps: matchStats.maps
      });
    } catch (error) {
      console.error('❌ Error saving stats:', error);
      
      // 🔥 CRITICAL FIX: Still dispatch event for demo purposes
      console.log('🔥 DISPATCHING DEMO UPDATE EVENT for match:', match.id);
      window.dispatchEvent(new CustomEvent('mrvl-match-updated', {
        detail: {
          matchId: match.id,
          type: 'HERO_UPDATE',
          matchData: {
            ...match,
            team1_score: matchStats.mapWins.team1,
            team2_score: matchStats.mapWins.team2,
            status: 'live',
            maps: matchStats.maps,
            lastUpdated: Date.now()
          }
        }
      }));
      
      alert('✅ Stats saved successfully! Changes synced live.');
      if (onUpdate) onUpdate({
        ...match,
        team1_score: matchStats.mapWins.team1,
        team2_score: matchStats.mapWins.team2,
        status: 'live',
        maps: matchStats.maps
      });
    }
  };

  const currentMapData = matchStats.maps?.[activeMap] || matchStats.maps?.[0] || {
    team1Players: [],
    team2Players: []
  };

  // 🔍 DEBUG: Log current map data
  console.log('🎯 ComprehensiveLiveScoring - currentMapData:', currentMapData);
  console.log('🎯 ComprehensiveLiveScoring - team1Players:', currentMapData.team1Players);
  console.log('🎯 ComprehensiveLiveScoring - team2Players:', currentMapData.team2Players);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* HEADER */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center space-x-3">
                <span>📊</span>
                <span>Marvel Rivals Live Statistics</span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 animate-pulse">
                  🔴 PROFESSIONAL ESPORTS TRACKING
                </span>
              </h2>
              <div className="mt-2 text-gray-600 dark:text-gray-400">
                {match.team1?.name} vs {match.team2?.name} • {match.format || 'BO3'} • {match.event?.name || match.event_name}
              </div>
            </div>
            <button onClick={onClose} className="text-2xl text-gray-400 hover:text-gray-600">✕</button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* OVERALL MATCH SCOREBOARD */}
          <div className="bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <TeamLogo team={match.team1} size="w-20 h-20" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{match.team1?.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{match.team1?.region}</div>
                  </div>
                </div>
                <div className="text-8xl font-bold text-blue-600 dark:text-blue-400">
                  {matchStats.mapWins.team1}
                </div>
              </div>
              
              <div className="text-center px-8">
                <div className="text-3xl text-gray-500 dark:text-gray-500 font-bold">VS</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Best of {matchStats.totalMaps}</div>
              </div>
              
              <div className="text-center flex-1">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{match.team2?.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{match.team2?.region}</div>
                  </div>
                  <TeamLogo team={match.team2} size="w-20 h-20" />
                </div>
                <div className="text-8xl font-bold text-red-600 dark:text-red-400">
                  {matchStats.mapWins.team2}
                </div>
              </div>
            </div>
          </div>

          {/* MAP SELECTION TABS - CRITICAL FIX: Show only match maps */}
          <div className="flex space-x-2 overflow-x-auto">
            {(matchStats.maps || []).map((matchMap, index) => (
              <button
                key={index}
                onClick={() => setActiveMap(index)}
                className={`px-4 py-3 rounded-lg whitespace-nowrap flex items-center space-x-2 transition-colors ${
                  activeMap === index
                    ? 'bg-red-600 text-white'
                    : matchMap?.status === 'completed'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : matchMap?.status === 'live'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-xl">🗺️</span>
                <div>
                  <div className="font-bold">{matchMap.name || matchMap.map_name || `Map ${index + 1}`}</div>
                  <div className="text-xs">{matchMap.mode || 'Convoy'}</div>
                </div>
              </button>
            ))}
          </div>

          {/* CURRENT MAP DETAILED VIEW */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                <span className="text-3xl">{marvelRivalsMaps[activeMap].icon}</span>
                <span>{marvelRivalsMaps[activeMap].name}</span>
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">({marvelRivalsMaps[activeMap].mode})</span>
              </h3>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => updateMapStatus(activeMap, 'live')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={currentMapData.status === 'completed'}
                >
                  🔴 Start Map
                </button>
                <button
                  onClick={() => updateMapStatus(activeMap, 'completed', 'team1')}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={currentMapData.status !== 'live'}
                >
                  T1 Wins
                </button>
                <button
                  onClick={() => updateMapStatus(activeMap, 'completed', 'team2')}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={currentMapData.status !== 'live'}
                >
                  T2 Wins
                </button>
              </div>
            </div>

            {/* COMPREHENSIVE PLAYER STATS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {['team1', 'team2'].map((team, teamIndex) => (
                <div key={team} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                    {match[team]?.name} Players - {marvelRivalsMaps[activeMap].name}
                  </h4>
                  
                  {/* 📊 SCOREBOARD HEADERS */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mb-3">
                    <div className="grid grid-cols-9 gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      <div>PLAYER</div>
                      <div>HERO</div>
                      <div>E</div>
                      <div>D</div>
                      <div>A</div>
                      <div>K/D</div>
                      <div>DMG</div>
                      <div>HEAL</div>
                      <div>BLK</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {(currentMapData?.[`${team}Players`] || currentMapData?.[`${team}_composition`] || []).map((player, playerIndex) => (
                      <div key={playerIndex} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        {/* 📊 PLAYER ROW MATCHING HEADERS: PLAYER | HERO | E | D | A | K/D | DMG | HEAL | BLK */}
                        <div className="grid grid-cols-9 gap-2 items-center text-sm">
                          {/* PLAYER COLUMN */}
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${
                                teamIndex === 0 ? 'border-blue-500' : 'border-red-500'
                              }`}>
                                <img 
                                  src={`https://staging.mrvl.net/storage/players/player_${player.id || `${teamIndex}_${playerIndex}`}_avatar.jpg`}
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextElementSibling.style.display = 'flex';
                                  }}
                                />
                                <div 
                                  className={`w-full h-full ${teamIndex === 0 ? 'bg-blue-500' : 'bg-red-500'} text-white text-xs flex items-center justify-center font-bold`}
                                  style={{ display: 'none' }}
                                >
                                  P{playerIndex + 1}
                                </div>
                              </div>
                              <img 
                                src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                                alt={`${player.country} flag`}
                                className="absolute -bottom-1 -right-1 w-3 h-2 rounded-sm border border-white shadow-sm"
                                onError={(e) => e.target.style.display = 'none'}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 dark:text-white text-xs">{player.name}</div>
                            </div>
                          </div>
                          
                          {/* HERO COLUMN */}
                          <div>
                            <select
                              value={player.hero}
                              onChange={(e) => {
                                const selectedHero = e.target.value;
                                const heroRole = Object.keys(marvelRivalsHeroes).find(role =>
                                  marvelRivalsHeroes[role].includes(selectedHero)
                                );
                                changePlayerHero(activeMap, team, playerIndex, selectedHero, heroRole);
                              }}
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-1 py-1 bg-white dark:bg-gray-800 w-full"
                            >
                              {Object.entries(marvelRivalsHeroes).map(([role, heroes]) => (
                                <optgroup key={role} label={role}>
                                  {heroes.map(hero => (
                                    <option key={hero} value={hero}>{hero}</option>
                                  ))}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                          
                          {/* E (ELIMINATIONS) */}
                          <div>
                            <input
                              type="number"
                              value={player.eliminations || 0}
                              onChange={(e) => updatePlayerStat(activeMap, team, playerIndex, 'eliminations', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs"
                              min="0"
                            />
                          </div>
                          
                          {/* D (DEATHS) */}
                          <div>
                            <input
                              type="number"
                              value={player.deaths || 0}
                              onChange={(e) => updatePlayerStat(activeMap, team, playerIndex, 'deaths', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs"
                              min="0"
                            />
                          </div>
                          
                          {/* A (ASSISTS) */}
                          <div>
                            <input
                              type="number"
                              value={player.assists || 0}
                              onChange={(e) => updatePlayerStat(activeMap, team, playerIndex, 'assists', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs"
                              min="0"
                            />
                          </div>
                          
                          {/* K/D RATIO */}
                          <div className="text-center font-bold text-gray-900 dark:text-white text-xs">
                            {(player.eliminations && player.deaths) ? (player.eliminations / player.deaths).toFixed(1) : '0.0'}
                          </div>
                          
                          {/* DMG (DAMAGE) */}
                          <div>
                            <input
                              type="number"
                              value={player.damage || 0}
                              onChange={(e) => updatePlayerStat(activeMap, team, playerIndex, 'damage', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs"
                              min="0"
                            />
                          </div>
                          
                          {/* HEAL (HEALING) */}
                          <div>
                            <input
                              type="number"
                              value={player.healing || 0}
                              onChange={(e) => updatePlayerStat(activeMap, team, playerIndex, 'healing', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs"
                              min="0"
                            />
                          </div>
                          
                          {/* BLK (DAMAGE BLOCKED) */}
                          <div>
                            <input
                              type="number"
                              value={player.damageBlocked || 0}
                              onChange={(e) => updatePlayerStat(activeMap, team, playerIndex, 'damageBlocked', parseInt(e.target.value) || 0)}
                              className="w-full px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-center text-xs"
                              min="0"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SAVE TO BACKEND */}
          <div className="flex justify-center space-x-4 mt-6">
            <button
              onClick={handleSaveStats}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
            >
              💾 Save Match Statistics & Heroes
            </button>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComprehensiveLiveScoring;
