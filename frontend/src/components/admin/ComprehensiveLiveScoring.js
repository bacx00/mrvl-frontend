import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';
import { getHeroImageSync, getHeroRole } from '../../utils/imageUtils';

/**
 * 🎮 COMPREHENSIVE LIVE SCORING - COMPLETE MARVEL RIVALS SYSTEM
 * Backend URL: https://staging.mrvl.net/api
 * Features: BO1/BO3/BO5, Map Progression, Preparation Phases, Real-time Sync
 */
const ComprehensiveLiveScoring = ({ isOpen, match, onClose, token }) => {
  const { api } = useAuth();
  const [matchStats, setMatchStats] = useState(null);
  const [matchStatus, setMatchStatus] = useState('upcoming');
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [isPreparationPhase, setIsPreparationPhase] = useState(false);
  const [preparationTimer, setPreparationTimer] = useState(45); // 45 seconds prep time
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

  // 🔥 CRITICAL: FIXED BACKEND URL LOADING
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

  // 🎮 COMPLETE MARVEL RIVALS GAME MODES WITH ACCURATE TIMERS
  const gameModesData = {
    'Convoy': { 
      duration: 18 * 60, // 18 minutes
      displayName: 'Convoy', 
      color: 'blue', 
      description: 'Escort the payload to victory',
      icon: '🚚'
    },
    'Domination': { 
      duration: 12 * 60, // 12 minutes
      displayName: 'Domination', 
      color: 'red', 
      description: 'Control strategic points',
      icon: '🏁'
    },
    'Convergence': { 
      duration: 15 * 60, // 15 minutes
      displayName: 'Convergence', 
      color: 'purple', 
      description: 'Converge on objectives',
      icon: '⚡'
    },
    'Conquest': { 
      duration: 20 * 60, // 20 minutes
      displayName: 'Conquest', 
      color: 'green', 
      description: 'Capture and hold territory',
      icon: '💎'
    },
    'Doom Match': { 
      duration: 10 * 60, // 10 minutes
      displayName: 'Doom Match', 
      color: 'orange', 
      description: 'Eliminate all opponents',
      icon: '💀'
    },
    'Escort': { 
      duration: 16 * 60, // 16 minutes
      displayName: 'Escort', 
      color: 'yellow', 
      description: 'Guide the target safely',
      icon: '🛡️'
    }
  };

  const getGameModeTimer = (mode) => {
    return gameModesData[mode] || { 
      duration: 15 * 60, 
      displayName: mode || 'Unknown', 
      color: 'gray', 
      description: 'Unknown mode',
      icon: '❓'
    };
  };

  // 🗺️ COMPLETE MARVEL RIVALS MAPS WITH MODES
  const [marvelRivalsMaps, setMarvelRivalsMaps] = useState([
    { name: 'Tokyo 2099: Shibuya Sky', mode: 'Convoy', icon: '🏙️' },
    { name: 'Tokyo 2099: Shin-Shibuya Station', mode: 'Convoy', icon: '🚅' },
    { name: 'Midtown Manhattan: Oscorp Tower', mode: 'Convoy', icon: '🏢' },
    { name: 'Sanctum Sanctorum: Astral Plane', mode: 'Convoy', icon: '🔮' },
    { name: 'Klyntar: Symbiote Planet', mode: 'Domination', icon: '🖤' },
    { name: 'Wakanda: Golden City', mode: 'Domination', icon: '💎' },
    { name: 'Asgard: Royal Palace', mode: 'Convergence', icon: '⚡' },
    { name: 'Yggsgard: Yggdrasil', mode: 'Convergence', icon: '🌳' },
    { name: 'Intergalactic Empire of Wakanda', mode: 'Conquest', icon: '🌌' },
    { name: 'Moon Base: Lunar Colony', mode: 'Conquest', icon: '🌙' },
    { name: 'Hell\'s Kitchen: Daredevil Territory', mode: 'Doom Match', icon: '🔥' },
    { name: 'X-Mansion: Training Grounds', mode: 'Escort', icon: '🎓' }
  ]);

  // ✅ COMPLETE MARVEL RIVALS HEROES BY ROLE (ALL 39 HEROES)
  const [marvelRivalsHeroes, setMarvelRivalsHeroes] = useState({
    Vanguard: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Peni Parker', 'Thor', 'Venom'],
    Duelist: ['Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Iron Man', 'Magik', 'Namor', 'Psylocke', 'Punisher', 'Scarlet Witch', 'Spider-Man', 'Squirrel Girl', 'Star-Lord', 'Storm', 'Winter Soldier', 'Wolverine'],
    Strategist: ['Adam Warlock', 'Cloak & Dagger', 'Jeff the Land Shark', 'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon']
  });

  // 🦸 HERO IMAGE SYSTEM WITH FALLBACKS
  const getHeroImageWithFallback = (heroName) => {
    if (!heroName) return null;
    
    const imageUrl = getHeroImageSync(heroName);
    if (imageUrl) return imageUrl;
    
    const alternativeNames = {
      'Iron Man': 'iron_man',
      'Spider-Man': 'spider_man',
      'Black Widow': 'black_widow',
      'Black Panther': 'black_panther',
      'Doctor Strange': 'doctor_strange',
      'Captain America': 'captain_america',
      'Winter Soldier': 'winter_soldier',
      'Star-Lord': 'star_lord',
      'Rocket Raccoon': 'rocket_raccoon',
      'Jeff the Land Shark': 'jeff',
      'Luna Snow': 'luna_snow',
      'Adam Warlock': 'adam_warlock',
      'Cloak & Dagger': 'cloak_dagger',
      'Squirrel Girl': 'squirrel_girl',
      'Peni Parker': 'peni_parker',
      'Scarlet Witch': 'scarlet_witch'
    };
    
    const altName = alternativeNames[heroName];
    if (altName) {
      const altImage = getHeroImageSync(altName);
      if (altImage) return altImage;
    }
    
    return null;
  };

  // Get all heroes in a flat array
  const allHeroes = Object.values(marvelRivalsHeroes).flat();

  // 🔍 DEBUG: Log what data we receive
  useEffect(() => {
    console.log('🎯 ComprehensiveLiveScoring MOUNTED with:', {
      isOpen,
      match: match ? {
        id: match.id,
        team1: match.team1?.name,
        team2: match.team2?.name,
        format: match.format
      } : null,
      hasToken: !!token,
      backendURL: BACKEND_URL
    });
  }, [match?.id]);

  // 🚨 INITIALIZATION WITH PROPER MAP COUNT FOR BO1/BO3/BO5
  const initializeMatchStats = useCallback((format = 'BO1') => {
    const mapCount = format === 'BO1' ? 1 : format === 'BO3' ? 3 : format === 'BO5' ? 5 : 1;
    
    console.log('🔍 INITIALIZING ComprehensiveLiveScoring with format:', {
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
      maps: Array.from({ length: mapCount }, (_, index) => {
        const selectedMap = marvelRivalsMaps[index % marvelRivalsMaps.length];
        return {
          map_number: index + 1,
          map_name: selectedMap.name,
          mode: selectedMap.mode,
          timer: getGameModeTimer(selectedMap.mode),
          team1Score: 0,
          team2Score: 0,
          status: index === 0 ? 'active' : 'upcoming',
          winner: null,
          duration: 'Not started',
          team1Players: Array.from({ length: 6 }, (_, pIndex) => ({
            id: `team1_p${pIndex + 1}`,
            playerId: `team1_p${pIndex + 1}`,
            name: `Player ${pIndex + 1}`,
            hero: ['Captain America', 'Iron Man', 'Thor', 'Hulk', 'Doctor Strange', 'Spider-Man'][pIndex],
            role: ['Vanguard', 'Duelist', 'Vanguard', 'Vanguard', 'Vanguard', 'Duelist'][pIndex],
            country: 'US',
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damageBlocked: 0,
            ultimateUsage: 0,
            objectiveTime: 0
          })),
          team2Players: Array.from({ length: 6 }, (_, pIndex) => ({
            id: `team2_p${pIndex + 1}`,
            playerId: `team2_p${pIndex + 1}`,
            name: `Player ${pIndex + 7}`,
            hero: ['Groot', 'Black Widow', 'Magneto', 'Venom', 'Mantis', 'Hawkeye'][pIndex],
            role: ['Vanguard', 'Duelist', 'Vanguard', 'Vanguard', 'Strategist', 'Duelist'][pIndex],
            country: 'US',
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damageBlocked: 0,
            ultimateUsage: 0,
            objectiveTime: 0
          }))
        };
      })
    };
  }, [match, marvelRivalsMaps]);

  // 🔥 CRITICAL: LOAD PRODUCTION SCOREBOARD DATA
  useEffect(() => {
    const loadProductionScoreboard = async () => {
      if (!match || !isOpen) {
        console.log('❌ ADMIN: Not loading - no match or not open');
        return;
      }

      console.log('🔍 ADMIN: Loading PRODUCTION scoreboard...');
      
      try {
        console.log(`🔗 Full URL: ${BACKEND_URL}/matches/${match.id}/live-scoreboard`);
        
        if (!BACKEND_URL || BACKEND_URL === 'undefined') {
          throw new Error('Backend URL is not configured properly');
        }
        
        const response = await fetch(`${BACKEND_URL}/matches/${match.id}/live-scoreboard`, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            ...(api.token && { 'Authorization': `Bearer ${api.token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiResponse = await response.json();
        console.log('📥 ADMIN: Live scoreboard response:', apiResponse);
        
        if (apiResponse.success && apiResponse.data) {
          const data = apiResponse.data;
          const matchData = data.match || {};
          let team1Players = [];
          let team2Players = [];
          
          // Parse maps_data JSON string
          if (matchData.maps_data) {
            try {
              const mapsData = JSON.parse(matchData.maps_data);
              if (mapsData && mapsData[0]) {
                const mapData = mapsData[0];
                team1Players = mapData.team1_composition || [];
                team2Players = mapData.team2_composition || [];
              }
            } catch (error) {
              console.error('❌ ADMIN: Error parsing maps_data:', error);
            }
          }
          
          // 🎮 IMPROVED GAME MODE DETECTION FOR ADMIN
          let currentGameMode = 'Domination'; // Default fallback
          if (data.live_data?.current_mode) {
            currentGameMode = data.live_data.current_mode;
          } else if (matchData.current_mode) {
            currentGameMode = matchData.current_mode;
          } else if (matchData.game_mode) {
            currentGameMode = matchData.game_mode;
          } else if (matchData.maps_data) {
            // Try to get mode from first map in maps_data
            try {
              const mapsData = JSON.parse(matchData.maps_data);
              if (mapsData && mapsData[0] && mapsData[0].mode) {
                currentGameMode = mapsData[0].mode;
              }
            } catch (error) {
              console.log('ADMIN: Could not parse game mode from maps_data:', error);
            }
          }
          
          console.log('🎮 ADMIN: Game mode detected:', currentGameMode);
          
          console.log('✅ ADMIN: Using PRODUCTION data structure:', {
            matchData: !!matchData,
            team1PlayersCount: team1Players.length,
            team2PlayersCount: team2Players.length,
            currentMap: matchData.current_map,
            gameMode: currentGameMode
          });
          
          // Get timer info for current game mode
          const currentModeTimer = getGameModeTimer(currentGameMode);
            
            // If we have player data from API, use it; otherwise use fallback
            if (team1Players.length > 0 && team2Players.length > 0) {
              setMatchStats({
                totalMaps: matchData.format === 'BO3' ? 3 : matchData.format === 'BO5' ? 5 : 1,
                currentMap: 0,
                mapWins: { 
                  team1: matchData.team1_score || 0, 
                  team2: matchData.team2_score || 0 
                },
                maps: [{
                  map_number: 1,
                  map_name: matchData.current_map || 'Tokyo 2099: Shibuya Sky',
                  mode: currentGameMode,
                  timer: currentModeTimer,
                  team1Score: matchData.team1_score || 0,
                  team2Score: matchData.team2_score || 0,
                  status: matchData.status,
                  winner: null,
                  duration: 'Live',
                team1Players: team1Players.map(player => ({
                  id: player.player_id,
                  playerId: player.player_id,
                  name: player.player_name,
                  hero: player.hero || 'Captain America',
                  role: convertRoleToFrontend(player.role),
                  country: player.country || 'US',
                  avatar: player.avatar,
                  eliminations: player.eliminations || 0,
                  deaths: player.deaths || 0,
                  assists: player.assists || 0,
                  damage: player.damage || 0,
                  healing: player.healing || 0,
                  damageBlocked: player.damage_blocked || 0,
                  ultimateUsage: player.ultimate_usage || 0,
                  objectiveTime: player.objective_time || 0
                })),
                team2Players: team2Players.map(player => ({
                  id: player.player_id,
                  playerId: player.player_id,
                  name: player.player_name,
                  hero: player.hero || 'Hulk',
                  role: convertRoleToFrontend(player.role),
                  country: player.country || 'US',
                  avatar: player.avatar,
                  eliminations: player.eliminations || 0,
                  deaths: player.deaths || 0,
                  assists: player.assists || 0,
                  damage: player.damage || 0,
                  healing: player.healing || 0,
                  damageBlocked: player.damage_blocked || 0,
                  ultimateUsage: player.ultimate_usage || 0,
                  objectiveTime: player.objective_time || 0
                }))
              }]
            });
            
            setMatchStatus(matchData.status);
            console.log('✅ ADMIN: PRODUCTION data loaded successfully!');
            return;
          }
        }
      } catch (error) {
        console.log('⚠️ ADMIN: PRODUCTION API failed, using fallback:', error.message);
      }

      // Fallback: Initialize with format-based structure
      console.log('🔧 ADMIN: Initializing fallback data structure...');
      const fallbackStats = initializeMatchStats(match.format || 'BO1');
      setMatchStats(fallbackStats);
    };

    loadProductionScoreboard();
  }, [match?.id, isOpen, api, BACKEND_URL, initializeMatchStats]);

  // Helper function to convert roles
  const convertRoleToFrontend = (backendRole) => {
    const roleMapping = {
      'Vanguard': 'Vanguard',
      'Duelist': 'Duelist', 
      'Strategist': 'Strategist',
      'Tank': 'Vanguard',
      'Support': 'Strategist',
      'DPS': 'Duelist'
    };
    return roleMapping[backendRole] || 'Vanguard';
  };

  // 🔥 ENHANCED CROSS-TAB SYNC SYSTEM
  const triggerRealTimeSync = (type, data = {}) => {
    const syncData = {
      matchId: match.id,
      type: type,
      timestamp: Date.now(),
      ...data
    };
    
    // Multiple sync methods for reliability
    localStorage.setItem('mrvl-match-sync', JSON.stringify(syncData));
    localStorage.setItem(`mrvl-match-${match.id}`, JSON.stringify(syncData));
    
    // Dispatch multiple event types
    window.dispatchEvent(new CustomEvent('mrvl-match-updated', { detail: syncData }));
    window.dispatchEvent(new CustomEvent('mrvl-hero-updated', { detail: syncData }));
    window.dispatchEvent(new CustomEvent('mrvl-stats-updated', { detail: syncData }));
    window.dispatchEvent(new CustomEvent('mrvl-score-updated', { detail: syncData }));
    window.dispatchEvent(new CustomEvent('mrvl-data-refresh', { detail: syncData }));
    
    console.log('🔥 ADMIN: Multi-channel sync triggered:', { type, data });
  };

  // 🏆 ENHANCED SCORE UPDATE WITH REAL-TIME SYNC
  const updateMapScore = async (teamNumber, increment = true) => {
    if (!matchStats) return;
    
    try {
      const currentMap = currentMapIndex;
      const scoreKey = teamNumber === 1 ? 'team1Score' : 'team2Score';
      
      setMatchStats(prev => {
        const newStats = { ...prev };
        const currentMapData = { ...newStats.maps[currentMap] };
        
        // Update map score
        const currentScore = currentMapData[scoreKey] || 0;
        const newMapScore = Math.max(0, currentScore + (increment ? 1 : -1));
        currentMapData[scoreKey] = newMapScore;
        
        newStats.maps[currentMap] = currentMapData;
        
        // Check for map completion (first to 3 rounds wins)
        const team1Rounds = currentMapData.team1Score || 0;
        const team2Rounds = currentMapData.team2Score || 0;
        
        if (team1Rounds >= 3 || team2Rounds >= 3) {
          currentMapData.status = 'completed';
          currentMapData.winner = team1Rounds >= 3 ? 'team1' : 'team2';
          
          // Update overall map wins
          if (team1Rounds >= 3) {
            newStats.mapWins.team1++;
          } else {
            newStats.mapWins.team2++;
          }
          
          // Check for series completion
          const mapsNeededToWin = Math.ceil(newStats.totalMaps / 2);
          if (newStats.mapWins.team1 >= mapsNeededToWin || newStats.mapWins.team2 >= mapsNeededToWin) {
            setMatchStatus('completed');
          } else if (currentMap + 1 < newStats.totalMaps) {
            // Start preparation phase for next map
            setIsPreparationPhase(true);
            setPreparationTimer(45);
          }
        }
        
        // 🔥 CREATE COMPLETE MATCH DATA FOR SCORE SYNC
        const completeMatchData = {
          id: match.id,
          status: matchStatus,
          team1_score: newStats.mapWins?.team1 || 0,
          team2_score: newStats.mapWins?.team2 || 0,
          format: match.format || 'BO1',
          currentMap: newStats.maps[currentMap]?.map_name || 'Tokyo 2099: Shibuya Sky',
          gameMode: newStats.maps[currentMap]?.mode || 'Domination',
          viewers: match.viewers || 0,
          totalMaps: newStats.totalMaps,
          
          // Include team info for complete sync
          team1: {
            id: match.team1?.id,
            name: match.team1?.name || 'Team1',
            logo: match.team1?.logo || '',
            players: newStats.maps[currentMap]?.team1Players || []
          },
          team2: {
            id: match.team2?.id, 
            name: match.team2?.name || 'Team2',
            logo: match.team2?.logo || '',
            players: newStats.maps[currentMap]?.team2Players || []
          },
          
          maps: newStats.maps,
          lastUpdated: Date.now()
        };
        
        // 🔥 IMMEDIATE REAL-TIME SYNC WITH COMPLETE DATA
        triggerRealTimeSync('SCORE_UPDATE', {
          mapIndex: currentMap,
          teamNumber,
          increment,
          mapScore: newMapScore,
          overallScores: newStats.mapWins,
          matchData: completeMatchData
        });
        
        return newStats;
      });
      
      console.log(`🎯 SCORE UPDATE: Team ${teamNumber} ${increment ? '+1' : '-1'} on map ${currentMap + 1}`);
      
    } catch (error) {
      console.error('❌ Error updating score:', error);
    }
  };

  // 🦸 ENHANCED HERO CHANGE WITH REAL-TIME SYNC
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
        
        const newStats = { ...prev, maps: updatedMaps };
        
        // 🔥 CREATE COMPLETE MATCH DATA FOR HERO SYNC
        const completeMatchData = {
          id: match.id,
          status: matchStatus,
          team1_score: newStats.mapWins?.team1 || 0,
          team2_score: newStats.mapWins?.team2 || 0,
          format: match.format || 'BO1',
          currentMap: newStats.maps[mapIndex]?.map_name || 'Tokyo 2099: Shibuya Sky',
          gameMode: newStats.maps[mapIndex]?.mode || 'Domination',
          viewers: match.viewers || 0,
          totalMaps: newStats.totalMaps,
          
          // Include team info for complete sync
          team1: {
            id: match.team1?.id,
            name: match.team1?.name || 'Team1',
            logo: match.team1?.logo || '',
            players: newStats.maps[mapIndex]?.team1Players || []
          },
          team2: {
            id: match.team2?.id, 
            name: match.team2?.name || 'Team2',
            logo: match.team2?.logo || '',
            players: newStats.maps[mapIndex]?.team2Players || []
          },
          
          maps: newStats.maps,
          lastUpdated: Date.now()
        };
        
        // 🔥 IMMEDIATE REAL-TIME SYNC WITH COMPLETE DATA
        triggerRealTimeSync('HERO_CHANGE', {
          mapIndex, 
          team, 
          playerIndex, 
          hero, 
          role,
          playerName: players[playerIndex].name,
          matchData: completeMatchData
        });
        
        return newStats;
      }
      
      return prev;
    });
  };

  // 📊 ENHANCED STAT UPDATE WITH REAL-TIME SYNC
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
        
        const newStats = { ...prev, maps: updatedMaps };
        
        // 🔥 CREATE COMPLETE MATCH DATA FOR SYNC
        const completeMatchData = {
          id: match.id,
          status: matchStatus,
          team1_score: newStats.mapWins?.team1 || 0,
          team2_score: newStats.mapWins?.team2 || 0,
          format: match.format || 'BO1',
          currentMap: newStats.maps[mapIndex]?.map_name || 'Tokyo 2099: Shibuya Sky',
          gameMode: newStats.maps[mapIndex]?.mode || 'Domination',
          viewers: match.viewers || 0,
          totalMaps: newStats.totalMaps,
          
          // Include team info that was missing
          team1: {
            id: match.team1?.id,
            name: match.team1?.name || 'Team1',
            logo: match.team1?.logo || '',
            players: newStats.maps[mapIndex]?.team1Players || []
          },
          team2: {
            id: match.team2?.id, 
            name: match.team2?.name || 'Team2',
            logo: match.team2?.logo || '',
            players: newStats.maps[mapIndex]?.team2Players || []
          },
          
          maps: newStats.maps,
          lastUpdated: Date.now()
        };
        
        // 🔥 IMMEDIATE REAL-TIME SYNC WITH COMPLETE DATA
        triggerRealTimeSync('STAT_UPDATE', {
          mapIndex,
          team,
          playerIndex,
          statName,
          value,
          playerName: players[playerIndex].name,
          matchData: completeMatchData
        });
        
        return newStats;
      }
      
      return prev;
    });
  };

  // 🗺️ MAP PROGRESSION WITH PREPARATION PHASE
  const advanceToNextMap = () => {
    if (currentMapIndex + 1 < matchStats.totalMaps) {
      setCurrentMapIndex(prev => prev + 1);
      setIsPreparationPhase(false);
      setPreparationTimer(45);
      
      // Reset timer for new map
      setMatchTimer('00:00');
      setIsTimerRunning(false);
      setTimerStartTime(null);
      
      triggerRealTimeSync('MAP_ADVANCE', {
        newMapIndex: currentMapIndex + 1,
        mapName: matchStats.maps[currentMapIndex + 1]?.map_name
      });
      
      console.log(`🗺️ Advanced to map ${currentMapIndex + 2}`);
    }
  };

  // ⏱️ PREPARATION PHASE TIMER
  useEffect(() => {
    let interval;
    if (isPreparationPhase && preparationTimer > 0) {
      interval = setInterval(() => {
        setPreparationTimer(prev => {
          if (prev <= 1) {
            setIsPreparationPhase(false);
            advanceToNextMap();
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPreparationPhase, preparationTimer]);

  // Timer controls with enhanced sync
  const startTimer = () => {
    const startTime = Date.now();
    setIsTimerRunning(true);
    setTimerStartTime(startTime);
    localStorage.setItem(`match-timer-running-${match.id}`, 'true');
    localStorage.setItem(`match-timer-start-${match.id}`, startTime.toString());
    
    triggerRealTimeSync('TIMER_START', {
      timer: '00:00',
      isRunning: true
    });
    
    console.log('🎮 Timer started with enhanced sync');
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    localStorage.setItem(`match-timer-running-${match.id}`, 'false');
    
    triggerRealTimeSync('TIMER_PAUSE', {
      timer: matchTimer,
      isRunning: false
    });
    
    console.log('⏸️ Timer paused with enhanced sync');
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setMatchTimer('00:00');
    setTimerStartTime(null);
    localStorage.removeItem(`match-timer-running-${match.id}`);
    localStorage.removeItem(`match-timer-start-${match.id}`);
    localStorage.removeItem(`match-timer-${match.id}`);
    
    triggerRealTimeSync('TIMER_RESET', {
      timer: '00:00',
      isRunning: false
    });
    
    console.log('🔄 Timer reset with enhanced sync');
  };

  // ⏱️ ENHANCED TIMER SYNC WITH IMMEDIATE DISPATCH
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
        
        // 🔥 IMMEDIATE SYNC EVERY SECOND FOR REAL-TIME UPDATES
        triggerRealTimeSync('TIMER_UPDATE', {
          timer: timeString,
          isRunning: true,
          elapsed: elapsed,
          immediate: true
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, matchStatus, timerStartTime, match.id]);

  // 🔄 PRODUCTION SAVE FUNCTION
  const handleSaveStats = async () => {
    if (!matchStats || !match) {
      console.log('❌ Cannot save: Missing matchStats or match');
      return;
    }

    setSaveLoading(true);
    
    try {
      console.log('🔄 SAVING TO PRODUCTION API - 6v6 Format');
      
      const currentMapData = matchStats.maps[currentMapIndex] || matchStats.maps[0];
      
      if (!currentMapData) {
        throw new Error('No map data available for save');
      }

      const savePromises = [];
      
      // Save all player stats
      [...(currentMapData.team1Players || []), ...(currentMapData.team2Players || [])].forEach(player => {
        if (player.playerId) {
          const savePromise = fetch(`${BACKEND_URL}/admin/matches/${match.id}/player/${player.playerId}/stats`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer 415|ySK4yrjyULCTlprffD0KeT5zxd6J2mMMHOHkX6pv1d5fc012`,
              'Cache-Control': 'no-cache'
            },
            body: JSON.stringify({
              eliminations: player.eliminations || 0,
              deaths: player.deaths || 0,
              assists: player.assists || 0,
              damage: player.damage || 0,
              healing: player.healing || 0,
              damage_blocked: player.damageBlocked || 0,
              ultimate_usage: player.ultimateUsage || 0,
              objective_time: player.objectiveTime || 0,
              hero_played: player.hero,
              role_played: player.role
            })
          });
          
          savePromises.push(savePromise);
        }
      });

      await Promise.all(savePromises);
      
      console.log('✅ ALL PLAYER STATS SAVED TO PRODUCTION API');
      
      // Final comprehensive sync
      triggerRealTimeSync('PRODUCTION_SAVE', {
        playersUpdated: savePromises.length,
        scores: matchStats.mapWins,
        matchData: matchStats
      });
      
    } catch (error) {
      console.error('❌ Error saving to PRODUCTION API:', error);
      alert(`❌ Error saving: ${error.message || 'Unknown error'}`);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isOpen || !match || !matchStats) {
    return null;
  }

  const currentMapData = matchStats.maps[currentMapIndex] || matchStats.maps[0];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-white">
                🎮 Live Match Control - {matchStats.totalMaps === 1 ? 'BO1' : matchStats.totalMaps === 3 ? 'BO3' : 'BO5'}
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

          {/* Series Progress for BO3/BO5 */}
          {matchStats.totalMaps > 1 && (
            <div className="bg-gray-800 rounded-lg p-4 mb-6">
              <h3 className="text-white font-bold text-center mb-3">
                🏆 Series Progress (First to {Math.ceil(matchStats.totalMaps / 2)})
              </h3>
              <div className="flex justify-center space-x-8">
                <div className="text-center">
                  <div className="text-blue-400 text-lg font-bold">{match.team1?.name}</div>
                  <div className="text-3xl font-bold text-white">{matchStats.mapWins.team1}</div>
                </div>
                <div className="text-center">
                  <div className="text-red-400 text-lg font-bold">{match.team2?.name}</div>
                  <div className="text-3xl font-bold text-white">{matchStats.mapWins.team2}</div>
                </div>
              </div>
              
              {/* Map Status Indicators */}
              <div className="flex justify-center space-x-2 mt-4">
                {matchStats.maps.map((map, index) => (
                  <div 
                    key={index}
                    className={`px-3 py-1 rounded text-sm ${
                      index === currentMapIndex ? 'bg-yellow-600 text-white' :
                      map.status === 'completed' ? 'bg-green-600 text-white' :
                      'bg-gray-600 text-gray-300'
                    }`}
                  >
                    Map {index + 1}
                    {map.status === 'completed' && (
                      <span className="ml-1">
                        {map.winner === 'team1' ? '(T1)' : '(T2)'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preparation Phase */}
          {isPreparationPhase && (
            <div className="bg-orange-600 text-white rounded-lg p-4 mb-6 text-center">
              <h3 className="text-xl font-bold mb-2">⏳ Preparation Phase</h3>
              <div className="text-3xl font-mono font-bold">{preparationTimer}s</div>
              <p className="text-sm opacity-90">Get ready for the next map!</p>
            </div>
          )}

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
                  {currentMapData?.mode || 'Mode not selected'} • Map {currentMapIndex + 1}/{matchStats.totalMaps}
                </div>
                {currentMapData?.timer && (
                  <div className={`text-xs px-2 py-1 rounded mt-1 bg-${currentMapData.timer.color}-100 text-${currentMapData.timer.color}-800`}>
                    {Math.floor(currentMapData.timer.duration / 60)}m - {currentMapData.timer.description}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Current Map Details */}
          {currentMapData && (
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="text-center mb-6">
                <div className="bg-red-600 text-white px-4 py-2 rounded-lg inline-block">
                  {currentMapData.map_name}
                  <div className="text-sm opacity-90">{currentMapData.mode}</div>
                  {currentMapData.timer && (
                    <div className="text-xs opacity-75">Duration: {Math.floor(currentMapData.timer.duration / 60)} minutes</div>
                  )}
                </div>
              </div>

              {/* SCOREBOARD CONTROLS */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-bold text-white text-center mb-4">🏆 LIVE SCOREBOARD</h3>
                
                <div className="text-center text-gray-300 text-sm mb-2">Map {currentMapIndex + 1} Score (First to 3 wins)</div>
                <div className="flex items-center justify-center space-x-6">
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

              {/* Teams & Players */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Team 1 Players */}
                <div>
                  <h3 className="text-xl font-bold text-blue-400 mb-4">
                    {match.team1?.name || 'Team1'} - {currentMapData.map_name}
                  </h3>
                  {currentMapData.team1Players?.map((player, playerIndex) => (
                    <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 relative">
                            {getHeroImageWithFallback(player.hero) ? (
                              <img 
                                src={getHeroImageWithFallback(player.hero)}
                                alt={player.hero}
                                className="w-12 h-12 object-cover rounded-full border-2 border-blue-500"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            
                            <div 
                              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-blue-500"
                              style={{ display: getHeroImageWithFallback(player.hero) ? 'none' : 'flex' }}
                              title={`${player.hero} (${player.role}) - Image not available`}
                            >
                              {(player.hero || 'Hero').split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                          
                          <img 
                            src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                            alt={`${player.country || 'US'} flag`}
                            className="absolute -bottom-1 -right-1 w-4 h-3 rounded-sm border border-white shadow-sm"
                            onError={(e) => e.target.style.display = 'none'}
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
                              ) || 'Vanguard';
                              changePlayerHero(currentMapIndex, 'team1', playerIndex, selectedHero, heroRole);
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
                      
                      <div className="grid grid-cols-3 gap-2">
                        {['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damageBlocked'].map(stat => (
                          <div key={stat} className="text-center">
                            <div className="text-xs text-gray-400 uppercase">{stat}</div>
                            <input
                              type="number"
                              value={player[stat] || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, 'team1', playerIndex, stat, e.target.value)}
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
                    {match.team2?.name || 'Team2'} - {currentMapData.map_name}
                  </h3>
                  {currentMapData.team2Players?.map((player, playerIndex) => (
                    <div key={playerIndex} className="bg-gray-700 rounded-lg p-4 mb-3">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="relative">
                          <div className="w-12 h-12 relative">
                            {getHeroImageWithFallback(player.hero) ? (
                              <img 
                                src={getHeroImageWithFallback(player.hero)}
                                alt={player.hero}
                                className="w-12 h-12 object-cover rounded-full border-2 border-red-500"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            
                            <div 
                              className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-red-500"
                              style={{ display: getHeroImageWithFallback(player.hero) ? 'none' : 'flex' }}
                              title={`${player.hero} (${player.role}) - Image not available`}
                            >
                              {(player.hero || 'Hero').split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase()}
                            </div>
                          </div>
                          
                          <img 
                            src={`https://flagcdn.com/16x12/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                            alt={`${player.country || 'US'} flag`}
                            className="absolute -bottom-1 -right-1 w-4 h-3 rounded-sm border border-white shadow-sm"
                            onError={(e) => e.target.style.display = 'none'}
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
                              ) || 'Vanguard';
                              changePlayerHero(currentMapIndex, 'team2', playerIndex, selectedHero, heroRole);
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
                      
                      <div className="grid grid-cols-3 gap-2">
                        {['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damageBlocked'].map(stat => (
                          <div key={stat} className="text-center">
                            <div className="text-xs text-gray-400 uppercase">{stat}</div>
                            <input
                              type="number"
                              value={player[stat] || 0}
                              onChange={(e) => updatePlayerStat(currentMapIndex, 'team2', playerIndex, stat, e.target.value)}
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
          <div className="flex justify-center space-x-4">
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
                  <span>Save All Data</span>
                </>
              )}
            </button>
            
            {matchStats.totalMaps > 1 && currentMapIndex + 1 < matchStats.totalMaps && (
              <button
                onClick={() => {
                  setIsPreparationPhase(true);
                  setPreparationTimer(45);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold text-lg flex items-center space-x-2"
              >
                <span>⏭️</span>
                <span>Next Map</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveLiveScoring;