import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';
import MatchAPI from '../../api/MatchAPI';

/**
 * 🎮 COMPREHENSIVE LIVE SCORING - ALIGNED WITH BACKEND DOCUMENTATION
 * Backend URL: https://staging.mrvl.net/api
 * Uses data.match_info structure and team1_roster/team2_roster
 */
const ComprehensiveLiveScoring = ({ isOpen, match, onClose, token }) => {
  const { api } = useAuth();
  const [matchStats, setMatchStats] = useState(null);
  const [matchStatus, setMatchStatus] = useState('upcoming');
  const [matchTimer, setMatchTimer] = useState(() => {
    const saved = localStorage.getItem(`match-timer-${match?.id}`);
    return saved || '00:00';
  });
  const [isTimerRunning, setIsTimerRunning] = useState(() => {
    const saved = localStorage.getItem(`match-timer-running-${match?.id}`);
    return saved === 'true';
  });
  const [timerStartTime, setTimerStartTime] = useState(() => {
    const saved = localStorage.getItem(`match-timer-start-${match?.id}`);
    return saved ? parseInt(saved) : null;
  });
  const [saveLoading, setSaveLoading] = useState(false);

  // 🔍 DEBUG: Log what data we receive
  useEffect(() => {
    console.log('🎯 ComprehensiveLiveScoring MOUNTED with:', {
      isOpen,
      match: match ? {
        id: match.id,
        team1: match.team1?.name,
        team2: match.team2?.name,
        team1_id: match.team1_id,
        team2_id: match.team2_id
      } : null,
      hasToken: !!token
    });
  }, [match?.id]);

  // 🎮 MARVEL RIVALS MAPS
  const [marvelRivalsMaps, setMarvelRivalsMaps] = useState([
    { name: 'Tokyo 2099: Shibuya Sky', mode: 'Convoy', icon: '🏙️' },
    { name: 'Klyntar: Symbiote Planet', mode: 'Domination', icon: '🖤' },
    { name: 'Asgard: Royal Palace', mode: 'Convergence', icon: '⚡' },
    { name: 'Tokyo 2099: Shin-Shibuya Station', mode: 'Convoy', icon: '🚅' },
    { name: 'Wakanda: Golden City', mode: 'Conquest', icon: '💎' },
    { name: 'Sanctum Sanctorum: Astral Plane', mode: 'Convoy', icon: '🔮' },
    { name: 'Yggsgard: Yggdrasil', mode: 'Convergence', icon: '🌳' },
    { name: 'Midtown Manhattan: Oscorp Tower', mode: 'Convoy', icon: '🏢' }
  ]);

  // ✅ COMPLETE MARVEL RIVALS HEROES BY ROLE
  const [marvelRivalsHeroes, setMarvelRivalsHeroes] = useState({
    Tank: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Thor', 'Venom'],
    Duelist: ['Black Widow', 'Hawkeye', 'Iron Man', 'Punisher', 'Spider-Man', 'Squirrel Girl', 'Star-Lord', 'Winter Soldier'],
    Support: ['Adam Warlock', 'Cloak & Dagger', 'Jeff the Land Shark', 'Luna Snow', 'Mantis', 'Rocket Raccoon', 'Storm']
  });

  // 🚀 Load maps and heroes from API when component mounts
  useEffect(() => {
    const loadGameData = async () => {
      try {
        // Load maps
        const mapsResponse = await MatchAPI.getAllMaps(api);
        if (mapsResponse?.data) {
          setMarvelRivalsMaps(mapsResponse.data);
          console.log('✅ Maps loaded from API:', mapsResponse.data);
        }

        // Load heroes
        const heroesResponse = await MatchAPI.getAllHeroes(api);
        if (heroesResponse?.data) {
          // Transform heroes from API format to role-based format
          if (Array.isArray(heroesResponse.data)) {
            const herosByRole = {
              Tank: [],
              Duelist: [],
              Support: []
            };
            
            heroesResponse.data.forEach(hero => {
              const role = hero.role || 'Tank';
              const heroName = hero.name || hero.hero_name || hero;
              
              // Map backend roles to frontend roles
              const frontendRole = role === 'Vanguard' ? 'Tank' : 
                                 role === 'Duelist' ? 'Duelist' : 
                                 role === 'Strategist' ? 'Support' : 
                                 role;
              
              if (herosByRole[frontendRole]) {
                herosByRole[frontendRole].push(heroName);
              } else {
                herosByRole.Tank.push(heroName);
              }
            });
            
            setMarvelRivalsHeroes(herosByRole);
            console.log('✅ Heroes loaded and organized by role:', herosByRole);
          } else {
            setMarvelRivalsHeroes(heroesResponse.data);
            console.log('✅ Heroes loaded from API:', heroesResponse.data);
          }
        }
      } catch (error) {
        console.error('❌ Error loading game data from API:', error);
        console.log('📝 Using fallback hardcoded data');
      }
    };

    if (api) {
      loadGameData();
    }
  }, [api]);

  // Get all heroes in a flat array
  const allHeroes = Object.values(marvelRivalsHeroes).flat();

  // 🔧 HELPER: Validate hero name and provide fallback
  const getValidHero = (heroName, playerRole = 'Tank') => {
    if (allHeroes.includes(heroName)) {
      return heroName;
    }
    
    const roleDefaults = {
      Tank: 'Captain America',
      Duelist: 'Iron Man', 
      Support: 'Mantis'
    };
    
    const fallbackHero = roleDefaults[playerRole] || 'Captain America';
    console.log(`⚠️ Unknown hero "${heroName}" for ${playerRole}, using fallback: ${fallbackHero}`);
    return fallbackHero;
  };

  // 🚨 INITIALIZATION WITH PROPER MAP COUNT
  const initializeMatchStats = useCallback((format = 'BO1') => {
    const mapCount = format === 'BO1' ? 1 : format === 'BO3' ? 3 : format === 'BO5' ? 5 : format === 'BO7' ? 7 : 1;
    
    console.log('🔍 INITIALIZING ComprehensiveLiveScoring with match:', {
      id: match?.id,
      format: format,
      mapCount: mapCount,
      team1: match?.team1?.name || 'Team1',
      team2: match?.team2?.name || 'Team2'
    });

    return {
      totalMaps: mapCount,
      currentMap: 0,
      mapWins: { team1: 0, team2: 0 },
      maps: Array.from({ length: mapCount }, (_, index) => ({
        map_number: index + 1,
        map_name: marvelRivalsMaps[index % marvelRivalsMaps.length].name,
        mode: marvelRivalsMaps[index % marvelRivalsMaps.length].mode,
        team1Score: 0,
        team2Score: 0,
        status: 'upcoming',
        winner: null,
        duration: 'Not started',
        team1Players: [],
        team2Players: []
      }))
    };
  }, [match]);

  // 🔥 CRITICAL: LOAD PRODUCTION SCOREBOARD DATA FROM BACKEND DOCUMENTATION
  useEffect(() => {
    const loadProductionScoreboard = async () => {
      if (!match || !isOpen) {
        console.log('❌ ADMIN: Not loading - no match or not open');
        return;
      }

      console.log('🔍 ADMIN: Loading PRODUCTION scoreboard using live-scoreboard endpoint...');
      
      try {
        // ✅ CORRECT: Use live-scoreboard endpoint from backend documentation
        const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
        const response = await fetch(`${BACKEND_URL}/matches/${match.id}/live-scoreboard`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            ...(api.token && { 'Authorization': `Bearer ${api.token}` })
          }
        });
        
        const apiResponse = await response.json();
        console.log('📥 ADMIN: Live scoreboard response:', apiResponse);
        
        if (apiResponse.success && apiResponse.data) {
          const data = apiResponse.data;
          
          // ✅ CORRECT STRUCTURE: Backend returns data.match_info (from documentation)
          const matchInfo = data.match_info || {};
          const team1Roster = data.team1_roster || [];
          const team2Roster = data.team2_roster || [];
          
          console.log('✅ ADMIN: Using PRODUCTION data structure:', {
            matchInfo: !!matchInfo,
            team1RosterCount: team1Roster.length,
            team2RosterCount: team2Roster.length
          });
          
          setMatchStats({
            totalMaps: 1, // Start with BO1, can be expanded
            currentMap: 0,
            mapWins: { 
              team1: matchInfo.team1_score || 0, 
              team2: matchInfo.team2_score || 0 
            },
            maps: [{
              map_number: 1,
              map_name: matchInfo.current_map || 'Tokyo 2099: Shibuya Sky',
              mode: matchInfo.game_mode || 'Domination',
              team1Score: matchInfo.team1_score || 0,
              team2Score: matchInfo.team2_score || 0,
              status: matchInfo.status,
              winner: null,
              duration: 'Live',
              // 🎮 PRODUCTION: 6v6 team compositions from rosters
              team1Players: team1Roster.map(player => ({
                id: player.player_id,
                playerId: player.player_id,
                name: player.name,
                hero: player.hero || player.stats?.hero_played || 'Captain America',
                role: convertRoleToFrontend(player.role),
                country: player.country || 'US',
                avatar: player.avatar,
                eliminations: player.stats?.eliminations || 0,
                deaths: player.stats?.deaths || 0,
                assists: player.stats?.assists || 0,
                damage: player.stats?.damage || 0,
                healing: player.stats?.healing || 0,
                damageBlocked: player.stats?.damage_blocked || 0,
                ultimateUsage: player.stats?.ultimate_usage || 0,
                objectiveTime: player.stats?.objective_time || 0
              })),
              team2Players: team2Roster.map(player => ({
                id: player.player_id,
                playerId: player.player_id,
                name: player.name,
                hero: player.hero || player.stats?.hero_played || 'Hulk',
                role: convertRoleToFrontend(player.role),
                country: player.country || 'US',
                avatar: player.avatar,
                eliminations: player.stats?.eliminations || 0,
                deaths: player.stats?.deaths || 0,
                assists: player.stats?.assists || 0,
                damage: player.stats?.damage || 0,
                healing: player.stats?.healing || 0,
                damageBlocked: player.stats?.damage_blocked || 0,
                ultimateUsage: player.stats?.ultimate_usage || 0,
                objectiveTime: player.stats?.objective_time || 0
              }))
            }]
          });
          
          setMatchStatus(matchInfo.status);
          console.log('✅ ADMIN: PRODUCTION data loaded successfully!');
          console.log('👥 Team 1 players:', team1Roster.length);
          console.log('👥 Team 2 players:', team2Roster.length);
          return;
        }
      } catch (error) {
        console.log('⚠️ ADMIN: PRODUCTION API failed, falling back:', error.message);
      }

      // 🔄 FALLBACK: Initialize empty if PRODUCTION fails
      console.log('🔧 ADMIN: Initializing fallback data structure...');
      const fallbackStats = initializeMatchStats(match.format);
      setMatchStats(fallbackStats);
    };

    loadProductionScoreboard();
  }, [match?.id, isOpen, api]);

  // Helper function to convert roles
  const convertRoleToFrontend = (backendRole) => {
    const roleMapping = {
      'Vanguard': 'Tank',
      'Duelist': 'DPS', 
      'Strategist': 'Support',
      'Tank': 'Tank',
      'Support': 'Support',
      'DPS': 'DPS'
    };
    return roleMapping[backendRole] || 'Tank';
  };

  // 🏆 LIVE SCORE UPDATE - PRODUCTION READY
  const updateMapScore = async (teamNumber, increment = true) => {
    try {
      const currentMap = matchStats.currentMap;
      const scoreKey = teamNumber === 1 ? 'team1Score' : 'team2Score';
      
      setMatchStats(prev => {
        const newStats = { ...prev };
        const currentMapData = { ...newStats.maps[currentMap] };
        
        // Update map score (rounds won on this map)
        const currentScore = currentMapData[scoreKey] || 0;
        const newMapScore = Math.max(0, currentScore + (increment ? 1 : -1));
        currentMapData[scoreKey] = newMapScore;
        
        // ✅ CHECK MAP COMPLETION: First to 3 rounds wins the map
        const team1Rounds = currentMapData.team1Score || 0;
        const team2Rounds = currentMapData.team2Score || 0;
        
        newStats.maps[currentMap] = currentMapData;
        
        // ✅ USE LIVE CONTROL ENDPOINT: Calculate overall scores
        const team1OverallScore = team1Rounds >= 3 ? 1 : 0;
        const team2OverallScore = team2Rounds >= 3 ? 1 : 0;
        
        const liveControlData = {
          team1_score: team1OverallScore,
          team2_score: team2OverallScore,
          current_map: newStats.maps[currentMap].map_name || "Unknown Map"
        };
        
        console.log(`🎯 LIVE CONTROL UPDATE: Team ${teamNumber} ${increment ? '+1' : '-1'} (${newMapScore} rounds)`);
        console.log(`🏆 Sending live control data:`, liveControlData);
        
        // ✅ Call backend live control API (async)
        MatchAPI.updateScores(match.id, liveControlData, api)
          .then((response) => {
            console.log(`✅ Live control response:`, {
              team1_overall: response.data?.team1_score,
              team2_overall: response.data?.team2_score,
              status: response.data?.status
            });
            
            // ✅ Trigger cross-tab sync with live control data
            MatchAPI.triggerCrossTabSync('score-update', match.id, { 
              mapIndex: currentMap, 
              teamNumber, 
              increment,
              liveControlResponse: response.data
            });
          })
          .catch(error => console.error('❌ Error updating live score:', error));
        
        return newStats;
      });
      
    } catch (error) {
      console.error('❌ Error updating score:', error);
    }
  };

  // 🦸 Change player hero
  const changePlayerHero = (mapIndex, team, playerIndex, hero, role) => {
    console.log(`🦸 Changing ${team} player ${playerIndex} to hero ${hero} (${role})`);
    
    setMatchStats(prev => {
      if (!prev || !prev.maps || !prev.maps[mapIndex]) return prev;
      
      const playersKey = team === 'team1' ? 'team1Players' : 'team2Players';
      const updatedMaps = [...prev.maps];
      const currentMap = { ...updatedMaps[mapIndex] };
      const players = [...(currentMap[playersKey] || [])];
      
      if (players[playerIndex]) {
        players[playerIndex] = {
          ...players[playerIndex],
          hero: hero,
          role: role
        };
        
        currentMap[playersKey] = players;
        updatedMaps[mapIndex] = currentMap;
        
        console.log(`✅ Hero changed: Player ${players[playerIndex].name} is now ${hero}`);
        
        // 🔥 Dispatch real-time sync event
        window.dispatchEvent(new CustomEvent('mrvl-hero-updated', {
          detail: {
            matchId: match.id,
            type: 'HERO_CHANGE',
            timestamp: Date.now(),
            changes: { mapIndex, team, playerIndex, hero, role }
          }
        }));
        console.log('🔥 Hero change event dispatched for immediate sync');
        
        return {
          ...prev,
          maps: updatedMaps
        };
      }
      
      return prev;
    });
  };

  // 📊 Update player stat
  const updatePlayerStat = (mapIndex, team, playerIndex, statName, value) => {
    console.log(`📊 Updating ${team} player ${playerIndex} ${statName} to ${value}`);
    
    setMatchStats(prev => {
      if (!prev || !prev.maps || !prev.maps[mapIndex]) return prev;
      
      const playersKey = team === 'team1' ? 'team1Players' : 'team2Players';
      const updatedMaps = [...prev.maps];
      const currentMap = { ...updatedMaps[mapIndex] };
      const players = [...(currentMap[playersKey] || [])];
      
      if (players[playerIndex]) {
        players[playerIndex] = {
          ...players[playerIndex],
          [statName]: parseInt(value) || 0
        };
        
        currentMap[playersKey] = players;
        updatedMaps[mapIndex] = currentMap;
        
        console.log(`✅ Stat updated: ${team} player ${playerIndex} now has ${statName}=${value}`);
        
        return {
          ...prev,
          maps: updatedMaps
        };
      }
      
      return prev;
    });
  };

  // 🔄 PRODUCTION SAVE FUNCTION - USES INDIVIDUAL PLAYER STATS API
  const handleSaveStats = async () => {
    if (!matchStats || !match) {
      console.log('❌ Cannot save: Missing matchStats or match');
      return;
    }

    setSaveLoading(true);
    
    try {
      console.log('🔄 SAVING TO PRODUCTION API - 6v6 Format:', {
        matchId: match.id,
        currentMap: matchStats.currentMap,
        totalPlayers: {
          team1: matchStats.maps[matchStats.currentMap]?.team1Players?.length || 0,
          team2: matchStats.maps[matchStats.currentMap]?.team2Players?.length || 0
        }
      });
      
      const currentMapData = matchStats.maps[matchStats.currentMap] || matchStats.maps[0];
      
      if (!currentMapData) {
        throw new Error('No map data available for save');
      }

      // 🎯 PRODUCTION: Save each player's stats individually
      const savePromises = [];
      
      // Save Team 1 players
      if (currentMapData.team1Players) {
        currentMapData.team1Players.forEach(player => {
          console.log(`💾 Saving Team 1 player ${player.name} stats:`, {
            eliminations: player.eliminations,
            deaths: player.deaths,
            hero: player.hero
          });
          
          const savePromise = MatchAPI.updatePlayerStats(match.id, player.playerId || player.id, {
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0,
            hero: player.hero,
            ultimateUsage: player.ultimateUsage || 0,
            objectiveTime: player.objectiveTime || 0
          }, api);
          
          savePromises.push(savePromise);
        });
      }
      
      // Save Team 2 players
      if (currentMapData.team2Players) {
        currentMapData.team2Players.forEach(player => {
          console.log(`💾 Saving Team 2 player ${player.name} stats:`, {
            eliminations: player.eliminations,
            deaths: player.deaths,
            hero: player.hero
          });
          
          const savePromise = MatchAPI.updatePlayerStats(match.id, player.playerId || player.id, {
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0,
            hero: player.hero,
            ultimateUsage: player.ultimateUsage || 0,
            objectiveTime: player.objectiveTime || 0
          }, api);
          
          savePromises.push(savePromise);
        });
      }

      // 🚀 Execute all saves in parallel
      console.log(`🚀 Executing ${savePromises.length} player stat saves...`);
      await Promise.all(savePromises);
      
      console.log('✅ ALL PLAYER STATS SAVED TO PRODUCTION API');
      
      // 🔥 DISPATCH PRODUCTION SYNC EVENTS
      console.log('🔥 DISPATCHING PRODUCTION SYNC EVENTS for match:', match.id);
      
      window.dispatchEvent(new CustomEvent('mrvl-match-updated', {
        detail: { 
          matchId: match.id, 
          type: 'PRODUCTION_SCOREBOARD_UPDATE',
          playersUpdated: savePromises.length,
          format: '6v6',
          timestamp: Date.now()
        }
      }));
      
      window.dispatchEvent(new CustomEvent('mrvl-stats-updated', {
        detail: { 
          matchId: match.id, 
          type: 'PRODUCTION_STATS_UPDATE',
          scores: {
            team1: matchStats.mapWins.team1,
            team2: matchStats.mapWins.team2
          },
          format: '6v6',
          timestamp: Date.now()
        }
      }));

      // 🚀 CROSS-TAB SYNC: Add localStorage sync for all events
      const syncData = {
        matchId: match.id,
        type: 'PRODUCTION_UPDATE',
        scores: {
          team1: matchStats.mapWins.team1,
          team2: matchStats.mapWins.team2
        },
        playersUpdated: savePromises.length,
        timestamp: Date.now(),
        action: 'update'
      };
      
      localStorage.setItem('mrvl-match-sync', JSON.stringify(syncData));
      console.log('🚀 ADMIN: Cross-tab sync data written to localStorage:', syncData);
      console.log('✅ All PRODUCTION sync events dispatched successfully');
      
    } catch (error) {
      console.error('❌ Error saving to PRODUCTION API:', error);
      alert(`❌ Error saving to production: ${error.message || 'Unknown error'}`);
    } finally {
      setSaveLoading(false);
    }
  };

  // Timer controls - WITH PERSISTENCE
  const startTimer = () => {
    const startTime = Date.now();
    setIsTimerRunning(true);
    setTimerStartTime(startTime);
    localStorage.setItem(`match-timer-running-${match.id}`, 'true');
    localStorage.setItem(`match-timer-start-${match.id}`, startTime.toString());
    
    // 🔥 IMMEDIATELY DISPATCH TIMER START EVENT
    window.dispatchEvent(new CustomEvent('mrvl-timer-updated', {
      detail: {
        matchId: match.id,
        timer: '00:00',
        isRunning: true,
        timestamp: Date.now()
      }
    }));
    
    console.log('🎮 Timer started - immediate sync dispatched');
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    localStorage.setItem(`match-timer-running-${match.id}`, 'false');
    
    // 🔥 IMMEDIATELY DISPATCH TIMER PAUSE EVENT
    window.dispatchEvent(new CustomEvent('mrvl-timer-updated', {
      detail: {
        matchId: match.id,
        timer: matchTimer,
        isRunning: false,
        timestamp: Date.now()
      }
    }));
    console.log('⏸️ Timer paused - immediate sync dispatched');
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setMatchTimer('00:00');
    setTimerStartTime(null);
    localStorage.removeItem(`match-timer-running-${match.id}`);
    localStorage.removeItem(`match-timer-start-${match.id}`);
    localStorage.removeItem(`match-timer-${match.id}`);
    
    // 🔥 IMMEDIATELY DISPATCH TIMER RESET EVENT
    window.dispatchEvent(new CustomEvent('mrvl-timer-updated', {
      detail: {
        matchId: match.id,
        timer: '00:00',
        isRunning: false,
        timestamp: Date.now()
      }
    }));
    console.log('🔄 Timer reset - immediate sync dispatched');
  };

  // Timer effect - WITH PERSISTENCE
  useEffect(() => {
    let interval;
    if (isTimerRunning && matchStatus === 'live') {
      interval = setInterval(() => {
        const now = Date.now();
        const start = timerStartTime || now;
        const elapsed = Math.floor((now - start) / 1000);
        
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setMatchTimer(timeString);
        localStorage.setItem(`match-timer-${match.id}`, timeString);
        
        // 🔥 DISPATCH TIMER SYNC EVENT FOR MATCH DETAIL PAGE
        window.dispatchEvent(new CustomEvent('mrvl-timer-updated', {
          detail: {
            matchId: match.id,
            timer: timeString,
            timestamp: Date.now()
          }
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, matchStatus, timerStartTime, match.id]);

  if (!isOpen || !match || !matchStats) {
    return null;
  }

  console.log('🎯 ADMIN: Rendering with data:', {
    matchId: match.id,
    team1: match.team1?.name || 'Team1',
    team2: match.team2?.name || 'Team2',
    mapsCount: matchStats.maps?.length,
    team1PlayersCount: matchStats.maps?.[0]?.team1Players?.length,
    team2PlayersCount: matchStats.maps?.[0]?.team2Players?.length
  });

  const currentMapData = matchStats.maps[matchStats.currentMap] || matchStats.maps[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-white">
                🎮 Live Match Control
              </h2>
              <div className="flex items-center space-x-2">
                <TeamLogo team={match.team1} size="sm" />
                <span className="text-blue-400 font-semibold">{match.team1?.name || 'Team1'}</span>
                <span className="text-gray-400">vs</span>
                <span className="text-red-400 font-semibold">{match.team2?.name || 'Team2'}</span>
                <TeamLogo team={match.team2} size="sm" />
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl font-bold"
            >
              ✕
            </button>
          </div>

          {/* Match Status & Timer */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <select
                  value={matchStatus}
                  onChange={(e) => setMatchStatus(e.target.value)}
                  className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
                >
                  <option value="upcoming">📅 Upcoming</option>
                  <option value="live">🔴 Live</option>
                  <option value="paused">⏸️ Paused</option>
                  <option value="completed">✅ Completed</option>
                  <option value="cancelled">❌ Cancelled</option>
                </select>
                
                <div className="text-2xl font-mono text-green-400">
                  {matchTimer}
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={startTimer}
                    disabled={isTimerRunning}
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm"
                  >
                    ▶️ Start
                  </button>
                  <button
                    onClick={pauseTimer}
                    disabled={!isTimerRunning}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded text-sm"
                  >
                    ⏸️ Pause
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                    🔄 Reset
                  </button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {currentMapData?.map_name || 'Map not selected'}
                </div>
                <div className="text-sm text-gray-400">
                  {currentMapData?.mode || 'Mode not selected'}
                </div>
              </div>
            </div>
          </div>

          {/* Current Map */}
          {currentMapData && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="text-center mb-6">
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg inline-block">
                  🗺️ {currentMapData.map_name}
                  <div className="text-sm opacity-90">{currentMapData.mode}</div>
                </div>
              </div>

              {/* SCOREBOARD CONTROLS */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-white text-center mb-4">🏆 LIVE SCOREBOARD</h3>
                
                {/* Overall Match Score */}
                <div className="flex items-center justify-center space-x-8 mb-6">
                  <div className="text-center">
                    <div className="text-blue-400 font-bold text-lg">{match.team1?.name || 'Team1'}</div>
                    <div className="text-3xl font-bold text-white">{matchStats.mapWins.team1}</div>
                  </div>
                  <div className="text-gray-400 text-xl">vs</div>
                  <div className="text-center">
                    <div className="text-red-400 font-bold text-lg">{match.team2?.name || 'Team2'}</div>
                    <div className="text-3xl font-bold text-white">{matchStats.mapWins.team2}</div>
                  </div>
                </div>
                
                {/* Current Map Score with Controls */}
                <div className="border-t border-gray-600 pt-4">
                  <div className="text-center text-gray-300 text-sm mb-2">Map {matchStats.currentMap + 1} Score</div>
                  <div className="flex items-center justify-center space-x-6">
                    {/* Team 1 Score Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateMapScore(1, false)}
                        className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full text-lg font-bold"
                      >
                        -
                      </button>
                      <div className="text-2xl font-bold text-blue-400 w-12 text-center">
                        {currentMapData.team1Score || 0}
                      </div>
                      <button
                        onClick={() => updateMapScore(1, true)}
                        className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-full text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-gray-400">-</div>
                    
                    {/* Team 2 Score Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateMapScore(2, false)}
                        className="w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-full text-lg font-bold"
                      >
                        -
                      </button>
                      <div className="text-2xl font-bold text-red-400 w-12 text-center">
                        {currentMapData.team2Score || 0}
                      </div>
                      <button
                        onClick={() => updateMapScore(2, true)}
                        className="w-8 h-8 bg-green-600 hover:bg-green-700 text-white rounded-full text-lg font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team 1 Players */}
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-4">
                    {match.team1?.name || 'Team1'} Players - {currentMapData.map_name}
                  </h3>
                  {currentMapData.team1Players?.map((player, playerIndex) => (
                    <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {player.name?.charAt(0) || 'P'}
                          </div>
                          {/* Country Flag */}
                          <img 
                            src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                            alt={`${player.country || 'US'} flag`}
                            className="absolute -bottom-1 -right-1 w-3 h-2 rounded-sm border border-white shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{player.name}</div>
                          <select
                            value={player.hero || 'Captain America'}
                            onChange={(e) => {
                              const selectedHero = e.target.value;
                              const heroRole = Object.keys(marvelRivalsHeroes).find(role => 
                                marvelRivalsHeroes[role].includes(selectedHero)
                              ) || 'Tank';
                              changePlayerHero(matchStats.currentMap, 'team1', playerIndex, selectedHero, heroRole);
                            }}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-sm border border-gray-500"
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
                      </div>
                      
                      {/* Player Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damageBlocked'].map(stat => (
                          <div key={stat} className="text-center">
                            <div className="text-xs text-gray-400 uppercase">{stat}</div>
                            <input
                              type="number"
                              value={player[stat] || 0}
                              onChange={(e) => updatePlayerStat(matchStats.currentMap, 'team1', playerIndex, stat, e.target.value)}
                              className="w-full bg-gray-600 text-white text-center px-1 py-1 rounded text-sm"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Team 2 Players */}
                <div>
                  <h3 className="text-xl font-bold text-red-400 mb-4">
                    {match.team2?.name || 'Team2'} Players - {currentMapData.map_name}
                  </h3>
                  {currentMapData.team2Players?.map((player, playerIndex) => (
                    <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center text-white font-bold">
                            {player.name?.charAt(0) || 'P'}
                          </div>
                          {/* Country Flag */}
                          <img 
                            src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                            alt={`${player.country || 'US'} flag`}
                            className="absolute -bottom-1 -right-1 w-3 h-2 rounded-sm border border-white shadow-sm"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white">{player.name}</div>
                          <select
                            value={player.hero || 'Captain America'}
                            onChange={(e) => {
                              const selectedHero = e.target.value;
                              const heroRole = Object.keys(marvelRivalsHeroes).find(role => 
                                marvelRivalsHeroes[role].includes(selectedHero)
                              ) || 'Tank';
                              changePlayerHero(matchStats.currentMap, 'team2', playerIndex, selectedHero, heroRole);
                            }}
                            className="bg-gray-600 text-white px-2 py-1 rounded text-sm border border-gray-500"
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
                      </div>
                      
                      {/* Player Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        {['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damageBlocked'].map(stat => (
                          <div key={stat} className="text-center">
                            <div className="text-xs text-gray-400 uppercase">{stat}</div>
                            <input
                              type="number"
                              value={player[stat] || 0}
                              onChange={(e) => updatePlayerStat(matchStats.currentMap, 'team2', playerIndex, stat, e.target.value)}
                              className="w-full bg-gray-600 text-white text-center px-1 py-1 rounded text-sm"
                              min="0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-center">
            <button
              onClick={handleSaveStats}
              disabled={saveLoading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold text-lg flex items-center space-x-2"
            >
              {saveLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>Save Match Statistics & Heroes</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveLiveScoring;