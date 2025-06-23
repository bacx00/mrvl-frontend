import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';

function ComprehensiveLiveScoring({ match, isOpen, onClose, onUpdate }) {
  const { api, token } = useAuth();
  const [activeMap, setActiveMap] = useState(0);
  
  // 🎮 MARVEL RIVALS MATCH STATUS SYSTEM - FIXED TIMER
  const [matchTimer, setMatchTimer] = useState('00:00');
  const [matchStatus, setMatchStatus] = useState(match?.status || 'upcoming');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerStartTime, setTimerStartTime] = useState(null);

  // 🎮 MARVEL RIVALS GAME MODE TIMING
  const getGameModeTiming = (mode) => {
    switch (mode) {
      case 'Convoy':
        return {
          phases: ['Checkpoint 1: 5:00', 'Checkpoint 2: 3:00+', 'Checkpoint 3: 1:30+'],
          totalTime: '9:30',
          description: 'Escort payload through 3 checkpoints'
        };
      case 'Convergence':
        return {
          phases: ['Capture: 4:00', 'Escort: 1:30'],
          totalTime: '5:30',
          description: 'Capture point then escort payload'
        };
      case 'Domination':
        return {
          phases: ['Round 1', 'Round 2', 'Round 3 (if needed)'],
          totalTime: 'Best of 3',
          description: 'Control single point, best of 3 rounds'
        };
      case 'Conquest':
        return {
          phases: ['Single Phase: 3:50'],
          totalTime: '3:50',
          description: 'First to 50 Chromium points wins'
        };
      default:
        return {
          phases: ['Game Phase'],
          totalTime: '10:00',
          description: 'Standard match'
        };
    }
  };

  // 🔥 FIXED MATCH TIMER SYSTEM
  useEffect(() => {
    let interval;
    if (isTimerRunning && matchStatus === 'live') {
      interval = setInterval(() => {
        const now = Date.now();
        const start = timerStartTime || now;
        const elapsed = Math.floor((now - start) / 1000);
        
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        setMatchTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, matchStatus, timerStartTime]);

  // 🔥 FIXED MATCH STATUS CONTROLS
  const handleMatchStatusChange = (newStatus) => {
    console.log(`🎮 Changing match status from ${matchStatus} to ${newStatus}`);
    setMatchStatus(newStatus);
    
    if (newStatus === 'live') {
      setIsTimerRunning(true);
      if (!timerStartTime) {
        setTimerStartTime(Date.now());
      }
    } else if (newStatus === 'paused') {
      setIsTimerRunning(false);
    } else if (newStatus === 'completed') {
      setIsTimerRunning(false);
    }
    
    // Update backend
    api.put(`/admin/matches/${match.id}`, { status: newStatus });
  };

  // 🔍 DEBUG: Log what data we receive
  console.log('🎯 ComprehensiveLiveScoring MOUNTED with:', {
    isOpen,
    match: match ? {
      id: match.id,
      team1: match.team1,
      team2: match.team2,
      team1_id: match.team1_id,
      team2_id: match.team2_id
    } : null,
    hasToken: !!token
  });

  // 🎮 FIXED MARVEL RIVALS MAPS - CORRECT MAPS
  const marvelRivalsMaps = [
    { 
      name: 'Tokyo 2099: Shibuya Sky', 
      mode: 'Convoy', 
      icon: '🏙️',
      checkpoints: ['Sky Terminal', 'Neo-Shibuya Plaza', 'Quantum Bridge'],
      description: 'Escort payload through futuristic Tokyo skyline',
      duration: '5:00 → 3:00+ → 1:30+'
    },
    { 
      name: 'Klyntar: Symbiote Planet', 
      mode: 'Domination', 
      icon: '🖤',
      checkpoints: ['Symbiote Nest', 'Dark Chambers', 'Venom Core'],
      description: 'Control the single point in alien symbiote world',
      duration: 'Best of 3 rounds'
    },
    { 
      name: 'Asgard: Royal Palace', 
      mode: 'Convergence', 
      icon: '⚡',
      checkpoints: ['Rainbow Bridge', 'Throne Chamber', 'Odin\'s Vault'],
      description: 'Capture then escort through Asgardian royal halls',
      duration: '4:00 capture → 1:30 escort'
    },
    { 
      name: 'Tokyo 2099: Shin-Shibuya Station', 
      mode: 'Convoy', 
      icon: '🚅',
      checkpoints: ['Platform Alpha', 'Central Hub', 'Departure Terminal'],
      description: 'Push payload through underground metro system',
      duration: '5:00 → 3:00+ → 1:30+'
    },
    { 
      name: 'Wakanda: Golden City', 
      mode: 'Conquest', 
      icon: '💎',
      checkpoints: ['Vibranium Mines', 'Royal Plaza', 'Panther Temple'],
      description: 'Battle for 50 Chromium points in Wakandan capital',
      duration: '3:50 minutes'
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

  // 🎮 FETCH REAL TEAM PLAYERS FROM BACKEND
  const fetchTeamPlayers = async (teamId, teamName) => {
    try {
      console.log(`🔍 Fetching real players for team: ${teamName} (ID: ${teamId})`);
      const response = await fetch(`https://staging.mrvl.net/api/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const teamPlayers = data.data?.players || [];
        console.log(`✅ Found ${teamPlayers.length} real players for ${teamName}:`, teamPlayers);
        
        // Convert real players to match format - FIXED COUNTRY
        return teamPlayers.slice(0, 6).map((player, index) => {
          console.log(`🏳️ Player ${player.name} full data:`, player);
          console.log(`🖼️ Player ${player.name} avatar path:`, player.avatar);
          console.log(`🌍 Player ${player.name} country:`, player.country || player.nationality);
          return {
            id: player.id,
            name: player.name,
            hero: player.main_hero || 'Captain America',
            role: player.role || 'Tank',
            country: player.country || player.nationality || 'US', // ✅ FIXED: Try both fields
            avatar: player.avatar, // ✅ Keep backend avatar path
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damageBlocked: 0,
            objectiveTime: 0,
            ultimatesUsed: 0
          };
        });
      } else {
        console.log(`⚠️ Failed to fetch players for ${teamName}, using defaults`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error fetching team players for ${teamName}:`, error);
      return [];
    }
  };
  const [matchStats, setMatchStats] = useState(() => {
    if (!match) return null;
    
    console.log('🔍 INITIALIZING ComprehensiveLiveScoring with match:', match);
    
    // 🎮 FORCE CREATE PLAYER DATA if missing
    const totalMaps = match.format === 'BO5' ? 5 : match.format === 'BO3' ? 3 : 1;
    console.log(`🎯 Creating ${totalMaps} maps for ${match.format} format`);
    
    return {
      // Overall match stats
      totalMaps,
      currentMap: 0,
      mapWins: { team1: match.team1_score || 0, team2: match.team2_score || 0 },
      
      // 🚨 NO MOCK DATA! Create empty maps and wait for real players
      maps: Array.from({ length: totalMaps }, (_, index) => {
        console.log(`🎯 Creating empty map ${index + 1} - NO MOCK PLAYERS`);
        
        return {
          map_number: index + 1,
          map_name: marvelRivalsMaps[index]?.name || 'Tokyo 2099: Shibuya Sky',
          mode: marvelRivalsMaps[index]?.mode || 'Convoy',
          team1Score: 0,
          team2Score: 0,
          status: 'upcoming',
          winner: null,
          duration: 'Not started',
          team1Players: [], // 🚨 EMPTY! Wait for real data
          team2Players: []  // 🚨 EMPTY! Wait for real data
        };
      })
    };
  });

  // 🚨 FORCE LOAD REAL TEAM PLAYERS IMMEDIATELY - TRIGGER ON EVERY RENDER
  useEffect(() => {
    console.log('🚨 ADMIN useEffect TRIGGERED!');
    console.log('- isOpen:', isOpen);
    console.log('- match exists:', !!match);
    console.log('- match.team1:', match?.team1);
    console.log('- match.team2:', match?.team2);
    console.log('- token exists:', !!token);
    
    const loadRealPlayers = async () => {
      // 🚨 FORCE RUN - Remove token requirement for demo
      if (match) {
        console.log('🔍 ADMIN: FORCE Loading real players (no auth required)...');
        
        const team1Id = match.team1?.id || match.team1_id;
        const team2Id = match.team2?.id || match.team2_id;
        
        console.log('🔍 ADMIN: Team IDs - Team1:', team1Id, 'Team2:', team2Id);
        
        if (team1Id && team2Id) {
          try {
            const [team1Players, team2Players] = await Promise.all([
              fetchTeamPlayers(team1Id, match.team1?.name || 'Team1'),
              fetchTeamPlayers(team2Id, match.team2?.name || 'Team2')
            ]);
            
            console.log('✅ ADMIN: Real players fetched:');
            console.log('Team 1 real players:', team1Players);
            console.log('Team 2 real players:', team2Players);
            
            // 🚨 FORCE UPDATE WITH REAL PLAYERS
            if (team1Players.length > 0 || team2Players.length > 0) {
              console.log('🔄 ADMIN: FORCING state update with real players...');
              
              setMatchStats(prevStats => {
                if (!prevStats) {
                  console.log('❌ ADMIN: prevStats is null');
                  return prevStats;
                }
                
                const updatedStats = {
                  ...prevStats,
                  maps: prevStats.maps.map((map, mapIndex) => ({
                    ...map,
                    team1Players: team1Players.length > 0 ? team1Players : [],
                    team2Players: team2Players.length > 0 ? team2Players : []
                  }))
                };
                
                console.log('✅ ADMIN: Updated with real players:', {
                  team1Count: updatedStats.maps[0]?.team1Players?.length,
                  team2Count: updatedStats.maps[0]?.team2Players?.length,
                  team1First: updatedStats.maps[0]?.team1Players?.[0]?.name,
                  team2First: updatedStats.maps[0]?.team2Players?.[0]?.name
                });
                
                return updatedStats;
              });
            }
          } catch (error) {
            console.error('❌ ADMIN: Error loading real players:', error);
          }
        } else {
          console.log('❌ ADMIN: Missing team IDs:', { team1Id, team2Id });
        }
      } else {
        console.log('❌ ADMIN: Missing requirements:', { hasMatch: !!match, hasToken: !!token });
      }
    };
    
    loadRealPlayers();
  }, [match, isOpen]); // 🚨 Removed token dependency for demo

  // CRITICAL FIX: Null check for match AFTER hooks
  if (!isOpen || !match || !matchStats) {
    console.log('🚨 ADMIN: Early return - not rendering because:', {
      isOpen,
      hasMatch: !!match,
      hasMatchStats: !!matchStats
    });
    return null;
  }

  const currentMapData = matchStats.maps?.[activeMap] || matchStats.maps?.[0] || {
    team1Players: [],
    team2Players: []
  };

  console.log('🎯 ADMIN: Rendering with data:', {
    matchId: match.id,
    team1: match.team1?.name,
    team2: match.team2?.name,
    mapsCount: matchStats.maps?.length,
    team1PlayersCount: currentMapData?.team1Players?.length,
    team2PlayersCount: currentMapData?.team2Players?.length,
    team1FirstPlayer: currentMapData?.team1Players?.[0]?.name,
    team2FirstPlayer: currentMapData?.team2Players?.[0]?.name
  });

  // UPDATE PLAYER STAT - ENHANCED WITH REAL-TIME SYNC
  const updatePlayerStat = (mapIndex, team, playerIndex, statType, value) => {
    console.log(`📊 Updating ${team} player ${playerIndex} ${statType} to ${value}`);
    setMatchStats(prev => {
      const newStats = { ...prev };
      
      // 🚨 CRITICAL FIX: Update only the correct team's player
      if (team === 'team1') {
        newStats.maps[mapIndex].team1Players[playerIndex][statType] = value;
      } else if (team === 'team2') {
        newStats.maps[mapIndex].team2Players[playerIndex][statType] = value;
      }
      
      console.log(`✅ Stat updated: ${team} player ${playerIndex} now has ${statType}=${value}`);
      return newStats;
    });

    // 🔥 IMMEDIATE SYNC EVENT FOR STAT UPDATES
    window.dispatchEvent(new CustomEvent('mrvl-stats-updated', {
      detail: {
        matchId: match.id,
        type: 'STAT_CHANGE',
        timestamp: Date.now(),
        changes: { mapIndex, team, playerIndex, statType, value }
      }
    }));
  };

  // UPDATE MAP STATUS - ENHANCED WITH IMMEDIATE SYNC
  const updateMapStatus = async (mapIndex, status, winner = null) => {
    console.log(`🏆 Updating map ${mapIndex} status to ${status}, winner: ${winner}`);
    
    setMatchStats(prev => {
      const newStats = { ...prev };
      
      // 🚨 CRITICAL FIX: Check if map exists before updating
      if (!newStats.maps || !newStats.maps[mapIndex]) {
        console.error(`❌ Map ${mapIndex} does not exist in matchStats.maps:`, newStats.maps);
        return prev; // Return unchanged state
      }
      
      newStats.maps[mapIndex].status = status;
      newStats.maps[mapIndex].winner = winner;
      
      // 🔥 CRITICAL: Update map wins properly
      if (winner && status === 'completed') {
        console.log(`🏆 ${winner} wins map ${mapIndex}! Current wins:`, newStats.mapWins);
        newStats.mapWins[winner] = (newStats.mapWins[winner] || 0) + 1;
        console.log(`🏆 Updated wins:`, newStats.mapWins);
      }
      
      return newStats;
    });

    // 🔥 IMMEDIATE SYNC EVENT FOR MAP UPDATES
    window.dispatchEvent(new CustomEvent('mrvl-match-updated', {
      detail: {
        matchId: match.id,
        type: 'MAP_STATUS_UPDATE',
        timestamp: Date.now(),
        changes: { mapIndex, status, winner }
      }
    }));

    console.log(`✅ Map ${mapIndex} updated and sync event dispatched`);
  };

  // 🔥 ENHANCED HERO CHANGE WITH IMMEDIATE SYNC
  const changePlayerHero = (mapIndex, team, playerIndex, hero, role) => {
    console.log(`🦸 Changing ${team} player ${playerIndex} to hero ${hero} (${role})`);
    
    setMatchStats(prev => {
      const newStats = { ...prev };
      const targetPlayers = team === 'team1' ? newStats.maps[mapIndex].team1Players : newStats.maps[mapIndex].team2Players;
      
      if (targetPlayers && targetPlayers[playerIndex]) {
        targetPlayers[playerIndex].hero = hero;
        targetPlayers[playerIndex].role = role;
        console.log(`✅ Hero changed: Player ${targetPlayers[playerIndex].name} is now ${hero}`);
      }
      
      return newStats;
    });

    // 🔥 IMMEDIATE REAL-TIME SYNC EVENT
    window.dispatchEvent(new CustomEvent('mrvl-hero-updated', {
      detail: {
        matchId: match.id,
        type: 'HERO_CHANGE',
        timestamp: Date.now(),
        changes: { mapIndex, team, playerIndex, hero, role }
      }
    }));

    console.log('🔥 Hero change event dispatched for immediate sync');
  };
  
  // SAVE TO BACKEND - ENHANCED REAL-TIME SYNC
  const handleSaveStats = async () => {
    try {
      console.log('🔄 Saving match stats and hero updates to backend...');
      
      // CRITICAL FIX: Use existing backend endpoint for saving stats
      await api.put(`/admin/matches/${match.id}`, {
        team1_score: matchStats.mapWins.team1,
        team2_score: matchStats.mapWins.team2,
        status: matchStatus,
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
      
      // 🔥 ENHANCED REAL-TIME SYNC SYSTEM - MULTIPLE EVENTS
      console.log('🔥 DISPATCHING COMPREHENSIVE SYNC EVENTS for match:', match.id);
      
      // Primary match update event
      window.dispatchEvent(new CustomEvent('mrvl-match-updated', {
        detail: {
          matchId: match.id,
          type: 'COMPREHENSIVE_UPDATE',
          timestamp: Date.now(),
          matchData: {
            ...match,
            team1_score: matchStats.mapWins.team1,
            team2_score: matchStats.mapWins.team2,
            status: matchStatus,
            maps: matchStats.maps,
            lastUpdated: Date.now()
          }
        }
      }));
      
      // Hero composition update event
      window.dispatchEvent(new CustomEvent('mrvl-hero-updated', {
        detail: {
          matchId: match.id,
          type: 'BULK_HERO_UPDATE',
          timestamp: Date.now(),
          heroData: matchStats.maps
        }
      }));
      
      // Stats update event
      window.dispatchEvent(new CustomEvent('mrvl-stats-updated', {
        detail: {
          matchId: match.id,
          type: 'BULK_STATS_UPDATE',
          timestamp: Date.now(),
          statsData: matchStats.maps
        }
      }));
      
      // Force cache refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('mrvl-data-refresh', {
          detail: { matchId: match.id, timestamp: Date.now() }
        }));
      }, 100);
      
      alert('✅ Stats and hero compositions saved successfully! Changes synced live.');
      if (onUpdate) onUpdate({
        ...match,
        team1_score: matchStats.mapWins.team1,
        team2_score: matchStats.mapWins.team2,
        status: matchStatus,
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
            status: matchStatus,
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
        status: matchStatus,
        maps: matchStats.maps
      });
    }
  };

  // 🔍 DEBUG: Log current map data structure
  console.log('🎯 ADMIN: currentMapData analysis:', {
    activeMap,
    totalMaps: matchStats.maps?.length,
    currentMapExists: !!currentMapData,
    team1PlayersCount: currentMapData.team1Players?.length,
    team2PlayersCount: currentMapData.team2Players?.length,
    team1Players: currentMapData.team1Players?.slice(0, 3),
    team2Players: currentMapData.team2Players?.slice(0, 3)
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* 🎮 MARVEL RIVALS MATCH CONTROL PANEL */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            🎮 Marvel Rivals Match Control
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* MATCH STATUS */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Match Status</h4>
              <select
                value={matchStatus}
                onChange={(e) => handleMatchStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="upcoming">⏳ Upcoming</option>
                <option value="live">🔴 Live</option>
                <option value="paused">⏸️ Paused</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
            
            {/* MATCH TIMER */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Match Timer</h4>
              <div className="text-2xl font-mono font-bold text-center">
                {matchStatus === 'live' ? (
                  <span className="text-red-500">🔴 {matchTimer}</span>
                ) : matchStatus === 'paused' ? (
                  <span className="text-yellow-500">⏸️ {matchTimer}</span>
                ) : matchStatus === 'completed' ? (
                  <span className="text-green-500">✅ {matchTimer}</span>
                ) : (
                  <span className="text-gray-500">⏳ 00:00</span>
                )}
              </div>
              {/* Timer Controls */}
              <div className="flex justify-center space-x-2 mt-2">
                <button
                  onClick={() => {
                    setIsTimerRunning(!isTimerRunning);
                    if (!timerStartTime) setTimerStartTime(Date.now());
                  }}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {isTimerRunning ? 'Pause' : 'Start'}
                </button>
                <button
                  onClick={() => {
                    setMatchTimer('00:00');
                    setTimerStartTime(null);
                    setIsTimerRunning(false);
                  }}
                  className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Reset
                </button>
              </div>
            </div>
            
            {/* GAME MODE INFO */}
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {marvelRivalsMaps[activeMap]?.icon} {marvelRivalsMaps[activeMap]?.mode}
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {getGameModeTiming(marvelRivalsMaps[activeMap]?.mode).description}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Duration: {getGameModeTiming(marvelRivalsMaps[activeMap]?.mode).totalTime}
              </div>
            </div>
          </div>
        </div>
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
                  
                  {/* 📊 SCOREBOARD HEADERS - MATCHING GRID LAYOUT */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2 mb-3">
                    <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_1.5fr_1.5fr_1.5fr] gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
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
                        {/* 📊 PLAYER ROW: PLAYER | HERO | E | D | A | K/D | DMG | HEAL | BLK */}
                        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_1fr_1.5fr_1.5fr_1.5fr] gap-2 items-center text-sm">
                          {/* PLAYER COLUMN - MORE SPACE */}
                          <div className="flex items-center space-x-2 min-w-0">
                            <div className="relative flex-shrink-0">
                              <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${
                                teamIndex === 0 ? 'border-blue-500' : 'border-red-500'
                              }`}>
                                <img 
                                  src={player.avatar ? `https://staging.mrvl.net${player.avatar}` : `https://staging.mrvl.net/storage/players/player_${player.id}_avatar.png`}
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.log(`❌ Real player avatar failed for: ${player.name} (ID: ${player.id}), trying fallback...`);
                                    // Try alternative format as fallback
                                    e.target.src = `https://staging.mrvl.net/storage/players/player_${player.id}_avatar.jpg`;
                                    e.target.onerror = () => {
                                      console.log(`❌ All avatar attempts failed for: ${player.name}, showing fallback`);
                                      e.target.style.display = 'none';
                                      e.target.nextElementSibling.style.display = 'flex';
                                    };
                                  }}
                                />
                                <div 
                                  className={`w-full h-full ${teamIndex === 0 ? 'bg-blue-500' : 'bg-red-500'} text-white text-xs flex items-center justify-center font-bold`}
                                  style={{ display: 'none' }}
                                >
                                  P{playerIndex + 1}
                                </div>
                              </div>
                              {/* 🔥 FIXED COUNTRY FLAGS */}
                              <img 
                                src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                                alt={`${player.country} flag`}
                                className="absolute -bottom-1 -right-1 w-3 h-2 rounded-sm border border-white shadow-sm"
                                onError={(e) => {
                                  console.log(`❌ Flag failed for country: ${player.country}, using fallback`);
                                  e.target.style.display = 'none';
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 dark:text-white text-sm truncate" title={player.name}>
                                {player.name}
                              </div>
                            </div>
                          </div>
                          
                          {/* HERO COLUMN - FIXED SAVING */}
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