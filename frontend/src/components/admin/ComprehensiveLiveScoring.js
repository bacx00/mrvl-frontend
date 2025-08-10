import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';
import { getHeroImageSync, getHeroRole, getCountryFlag } from '../../utils/imageUtils';
import {
  HEROES,
  GAME_MODES,
  PLAYER_STATS,
  MATCH_STATUSES
} from '../../constants/marvelRivalsData';
// Pusher removed - not using real-time updates

/**
 *  COMPREHENSIVE LIVE SCORING - SEASON 2.5 MARVEL RIVALS
 * Synchronized with MatchForm and MatchDetailPage
 * Features: All formats (BO1-BO9), Player Stats, Real-time Sync
 */
const ComprehensiveLiveScoring = ({ isOpen, match, onClose, token, onUpdate }) => {
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
  
  // Enhanced UI states for tracker.gg style fast updates
  const [fastUpdateMode, setFastUpdateMode] = useState(false);
  const [quickStatInput, setQuickStatInput] = useState({ visible: false, player: null, stat: null });
  
  // ENHANCED: Kill feed and objective tracking
  const [killFeed, setKillFeed] = useState([]);
  const [objectiveProgress, setObjectiveProgress] = useState({
    team1: 0,
    team2: 0,
    capturingTeam: null
  });

  // 🚀 KEYBOARD SHORTCUTS FOR SPEED (tracker.gg style)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!isOpen) return;
      
      // Prevent shortcuts when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
      
      switch(e.key.toLowerCase()) {
        case '1': // +1 Team 1
          e.preventDefault();
          updateMapScore(1, true);
          break;
        case '2': // +1 Team 2  
          e.preventDefault();
          updateMapScore(2, true);
          break;
        case 'q': // -1 Team 1
          e.preventDefault(); 
          updateMapScore(1, false);
          break;
        case 'w': // -1 Team 2
          e.preventDefault();
          updateMapScore(2, false);
          break;
        case ' ': // Toggle timer
          e.preventDefault();
          isTimerRunning ? pauseTimer() : startTimer();
          break;
        case 'r': // Reset timer
          e.preventDefault();
          resetTimer();
          break;
        case 's': // Save all data
          e.preventDefault();
          handleSaveStats();
          break;
        case 'f': // Toggle fast update mode
          e.preventDefault();
          setFastUpdateMode(prev => !prev);
          break;
        case 'escape': // Close
          e.preventDefault();
          onClose();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, isTimerRunning, matchStats]);

  //  MATCH COMPLETION HANDLER - Update profiles and history
  const handleMatchCompletion = async (finalStats) => {
    try {
      console.log(' Processing match completion...');
      
      // Determine match winner
      const team1Wins = finalStats.mapWins.team1;
      const team2Wins = finalStats.mapWins.team2;
      const winnerId = team1Wins > team2Wins ? match.team1?.id : match.team2?.id;
      const winnerName = team1Wins > team2Wins ? match.team1?.name : match.team2?.name;
      
      // Send completion data to backend
      await api.post(`/admin/matches/${match.id}/complete`, {
        winner_id: winnerId,
        final_scores: { team1: team1Wins, team2: team2Wins },
        match_duration: matchTimer,
        maps_data: finalStats.maps.map(map => ({
          map_number: map.map_number,
          map_name: map.map_name,
          mode: map.mode,
          team1_score: map.team1Score,
          team2_score: map.team2Score,
          winner_id: map.winner === 'team1' ? match.team1?.id : 
                    map.winner === 'team2' ? match.team2?.id : null,
          duration: map.duration,
          team1_composition: map.team1Players,
          team2_composition: map.team2Players
        }))
      });
      
      console.log(`🎉 Match completed! Winner: ${winnerName}`);
      
      // Trigger updates to all listening components
      if (onUpdate) onUpdate();
      
    } catch (error) {
      console.error('❌ Error completing match:', error);
    }
  };

  //  CRITICAL: FIXED BACKEND URL LOADING
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

  //  PERSISTENT STATE MANAGEMENT - Preserve live match state across page refresh/navigation
  const STORAGE_KEYS = {
    matchStats: `match-stats-${match?.id}`,
    currentMapIndex: `match-map-index-${match?.id}`,
    matchStatus: `match-status-${match?.id}`,
    matchTimer: `match-timer-${match?.id}`,
    timerRunning: `match-timer-running-${match?.id}`,
    timerStart: `match-timer-start-${match?.id}`,
    preparationPhase: `match-prep-phase-${match?.id}`,
    preparationTimer: `match-prep-timer-${match?.id}`
  };

  // Load persistent state on component mount
  useEffect(() => {
    if (!match?.id) return;
    
    try {
      // Restore match stats
      const savedMatchStats = sessionStorage.getItem(STORAGE_KEYS.matchStats);
      if (savedMatchStats) {
        const parsed = JSON.parse(savedMatchStats);
        setMatchStats(parsed);
        console.log(' Restored match stats from session storage');
      }
      
      // Restore current map index
      const savedMapIndex = sessionStorage.getItem(STORAGE_KEYS.currentMapIndex);
      if (savedMapIndex !== null) {
        setCurrentMapIndex(parseInt(savedMapIndex));
        console.log(' Restored map index:', savedMapIndex);
      }
      
      // Restore match status
      const savedStatus = sessionStorage.getItem(STORAGE_KEYS.matchStatus);
      if (savedStatus) {
        setMatchStatus(savedStatus);
        console.log(' Restored match status:', savedStatus);
      }
      
      // Restore timer state
      const savedTimer = sessionStorage.getItem(STORAGE_KEYS.matchTimer);
      const savedTimerRunning = sessionStorage.getItem(STORAGE_KEYS.timerRunning);
      const savedTimerStart = sessionStorage.getItem(STORAGE_KEYS.timerStart);
      
      if (savedTimer) setMatchTimer(savedTimer);
      if (savedTimerRunning) setIsTimerRunning(savedTimerRunning === 'true');
      if (savedTimerStart) setTimerStartTime(parseInt(savedTimerStart));
      
      // Restore preparation phase
      const savedPrepPhase = sessionStorage.getItem(STORAGE_KEYS.preparationPhase);
      const savedPrepTimer = sessionStorage.getItem(STORAGE_KEYS.preparationTimer);
      
      if (savedPrepPhase) setIsPreparationPhase(savedPrepPhase === 'true');
      if (savedPrepTimer) setPreparationTimer(parseInt(savedPrepTimer));
      
      console.log('Live match state restored from session storage');
    } catch (error) {
      console.error(' Error restoring match state:', error);
    }
  }, [match?.id]);

  // Save state whenever it changes
  useEffect(() => {
    if (!match?.id || !matchStats) return;
    sessionStorage.setItem(STORAGE_KEYS.matchStats, JSON.stringify(matchStats));
  }, [matchStats, match?.id]);

  useEffect(() => {
    if (!match?.id) return;
    sessionStorage.setItem(STORAGE_KEYS.currentMapIndex, currentMapIndex.toString());
  }, [currentMapIndex, match?.id]);

  useEffect(() => {
    if (!match?.id) return;
    sessionStorage.setItem(STORAGE_KEYS.matchStatus, matchStatus);
  }, [matchStatus, match?.id]);

  useEffect(() => {
    if (!match?.id) return;
    sessionStorage.setItem(STORAGE_KEYS.matchTimer, matchTimer);
    sessionStorage.setItem(STORAGE_KEYS.timerRunning, isTimerRunning.toString());
    if (timerStartTime) {
      sessionStorage.setItem(STORAGE_KEYS.timerStart, timerStartTime.toString());
    }
  }, [matchTimer, isTimerRunning, timerStartTime, match?.id]);

  useEffect(() => {
    if (!match?.id) return;
    sessionStorage.setItem(STORAGE_KEYS.preparationPhase, isPreparationPhase.toString());
    sessionStorage.setItem(STORAGE_KEYS.preparationTimer, preparationTimer.toString());
  }, [isPreparationPhase, preparationTimer, match?.id]);

  //  COMPLETE MARVEL RIVALS GAME MODES WITH ACCURATE TIMERS
  const gameModesData = {
    'Convoy': { 
      duration: 18 * 60, // 18 minutes
      displayName: 'Convoy', 
      color: 'blue', 
      description: 'Escort the payload to victory',
      icon: ''
    },
    'Domination': { 
      duration: 12 * 60, // 12 minutes
      displayName: 'Domination', 
      color: 'red', 
      description: 'Control strategic points',
      icon: ''
    },
    'Convergence': { 
      duration: 15 * 60, // 15 minutes
      displayName: 'Convergence', 
      color: 'purple', 
      description: 'Converge on objectives',
      icon: ''
    },
    'Conquest': { 
      duration: 20 * 60, // 20 minutes
      displayName: 'Conquest', 
      color: 'green', 
      description: 'Capture and hold territory',
      icon: ''
    },
    'Doom Match': { 
      duration: 10 * 60, // 10 minutes
      displayName: 'Doom Match', 
      color: 'orange', 
      description: 'Eliminate all opponents',
      icon: ''
    },
    'Escort': { 
      duration: 16 * 60, // 16 minutes
      displayName: 'Escort', 
      color: 'yellow', 
      description: 'Guide the target safely',
      icon: ''
    }
  };

  const getGameModeTimer = (mode) => {
    return gameModesData[mode] || { 
      duration: 15 * 60, 
      displayName: mode || 'Unknown', 
      color: 'gray', 
      description: 'Unknown mode',
      icon: ''
    };
  };

  //  COMPLETE MARVEL RIVALS MAPS WITH MODES
  const [marvelRivalsMaps, setMarvelRivalsMaps] = useState([
    { name: 'Tokyo 2099: Shibuya Sky', mode: 'Convoy', icon: '' },
    { name: 'Tokyo 2099: Shin-Shibuya Station', mode: 'Convoy', icon: '' },
    { name: 'Midtown Manhattan: Oscorp Tower', mode: 'Convoy', icon: '' },
    { name: 'Sanctum Sanctorum: Astral Plane', mode: 'Convoy', icon: '' },
    { name: 'Klyntar: Symbiote Planet', mode: 'Domination', icon: '' },
    { name: 'Wakanda: Golden City', mode: 'Domination', icon: '' },
    { name: 'Asgard: Royal Palace', mode: 'Convergence', icon: '' },
    { name: 'Yggsgard: Yggdrasil', mode: 'Convergence', icon: '' },
    { name: 'Intergalactic Empire of Wakanda', mode: 'Conquest', icon: '' },
    { name: 'Moon Base: Lunar Colony', mode: 'Conquest', icon: '' },
    { name: 'Hell\'s Kitchen: Daredevil Territory', mode: 'Doom Match', icon: '' },
    { name: 'X-Mansion: Training Grounds', mode: 'Escort', icon: '' }
  ]);

  //  COMPLETE MARVEL RIVALS HEROES BY ROLE (ALL 39 HEROES)
  const [marvelRivalsHeroes, setMarvelRivalsHeroes] = useState({
    Vanguard: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Peni Parker', 'Thor', 'Venom'],
    Duelist: ['Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Iron Man', 'Magik', 'Namor', 'Psylocke', 'Punisher', 'Scarlet Witch', 'Spider-Man', 'Squirrel Girl', 'Star-Lord', 'Storm', 'Winter Soldier', 'Wolverine'],
    Strategist: ['Adam Warlock', 'Cloak & Dagger', 'Jeff the Land Shark', 'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon']
  });

  //  HERO IMAGE SYSTEM WITH FALLBACKS
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

  //  DEBUG: Log what data we receive
  useEffect(() => {
    console.log('ComprehensiveLiveScoring MOUNTED with:', {
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

  //  PUSHER REAL-TIME SUBSCRIPTIONS
  useEffect(() => {
    if (!match?.id || !isOpen) return;
    
    let matchChannel = null;
    let scoringChannel = null;
    
    console.log(' Setting up Pusher subscriptions for live scoring:', match.id);
    
    // Subscribe to match updates
    // matchChannel = subscribeMatchUpdates(String(match.id), (data) => {
      console.log(' Live scoring match update:', data);
      
      // Handle score updates from other sources
      if (data.type === 'score-updated' && data.source !== 'live-scoring') {
        // Update our local state to match
        if (data.map_index !== undefined && matchStats?.maps?.[data.map_index]) {
          setMatchStats(prev => {
            const updatedMaps = [...prev.maps];
            updatedMaps[data.map_index] = {
              ...updatedMaps[data.map_index],
              team1Score: data.team1_score || updatedMaps[data.map_index].team1Score,
              team2Score: data.team2_score || updatedMaps[data.map_index].team2Score
            };
            return { ...prev, maps: updatedMaps };
          });
        }
      }
    });
    
    // Subscribe to live scoring specific channel
    // scoringChannel = subscribeLiveScoring(String(match.id), {
      onScoreUpdate: (data) => {
        console.log(' Received score update:', data);
        // Only update if it's from another source
        if (data.source !== 'live-scoring-component') {
          if (data.map_index !== undefined) {
            updateMapScore(1, data.team1_score, data.map_index);
            updateMapScore(2, data.team2_score, data.map_index);
          }
        }
      },
      onPlayerStatUpdate: (data) => {
        console.log(' Received player stat update:', data);
        if (data.source !== 'live-scoring-component') {
          updatePlayerStat(data.mapIndex, data.team, data.playerIndex, data.statName, data.value);
        }
      },
      onMapUpdate: (data) => {
        console.log(' Received map update:', data);
        if (data.current_map_index !== undefined) {
          setCurrentMapIndex(data.current_map_index);
        }
      }
    });
    
    return () => {
      // Cleanup subscriptions
      if (matchChannel) {
        matchChannel.unbind_all();
        matchChannel.unsubscribe();
      }
      if (scoringChannel) {
        scoringChannel.unbind_all();
        scoringChannel.unsubscribe();
      }
    };
  }, [match?.id, isOpen]);

  //  INITIALIZATION WITH PROPER MAP COUNT FOR BO1/BO3/BO5
  const initializeMatchStats = useCallback((format = 'BO1') => {
    const mapCount = format === 'BO1' ? 1 : format === 'BO3' ? 3 : format === 'BO5' ? 5 : 1;
    
    console.log(' INITIALIZING ComprehensiveLiveScoring with format:', {
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

  //   SYNC WITH MATCHFORM DATA - Load existing match configuration  
  useEffect(() => {
    const syncWithMatchForm = async () => {
      if (!match || !isOpen) {
        console.log('ADMIN: Not loading - no match or not open');
        return;
      }

      console.log(' ADMIN: SYNCING with MatchForm data for match:', match.id);
      
      try {
        // 1. SYNC WITH MATCHFORM: Load map scores and overall scores from MatchForm
        console.log(`📥 Syncing with existing match data from MatchForm`);
        
        if (!BACKEND_URL || BACKEND_URL === 'undefined') {
          throw new Error('Backend URL is not configured properly');
        }
        
        // First, get the complete match data including MatchForm configurations
        const matchResponse = await api.get(`/admin/matches/${match.id}`);
        const matchData = matchResponse?.data;
        
        console.log('📤 MatchForm sync data loaded:', matchData);
        
        if (matchData && matchData.maps_data && matchData.maps_data.length > 0) {
          // Use MatchForm data as the primary source
          const mapsFromForm = matchData.maps_data;
          const formatConfig = matchData.format || 'BO3';
          const totalMaps = parseInt(formatConfig.replace('BO', '')) || 3;
          
          console.log('✅ MATCHFORM SYNC: Using existing maps and compositions from form:', {
            totalMaps,
            mapsConfigured: mapsFromForm.length,
            team1Score: matchData.team1_score,
            team2Score: matchData.team2_score,
            status: matchData.status
          });
          
          // Create match stats from MatchForm data
          const syncedMatchStats = {
            totalMaps: totalMaps,
            currentMap: (matchData.current_map || 1) - 1,
            mapWins: { 
              team1: matchData.team1_score || 0, 
              team2: matchData.team2_score || 0 
            },
            maps: mapsFromForm.map((mapData, index) => ({
              map_number: index + 1,
              map_name: mapData.map_name || `Map ${index + 1}`,
              mode: mapData.mode || 'Domination',
              timer: getGameModeTimer(mapData.mode || 'Domination'),
              team1Score: mapData.team1_score || 0,
              team2Score: mapData.team2_score || 0,
              status: mapData.winner_id ? 'completed' : (mapData.status || (index === 0 ? 'active' : 'upcoming')),
              winner: mapData.winner_id ? 
                (mapData.winner_id == match.team1?.id ? 'team1' : 'team2') : null,
              duration: mapData.duration || 'Not started',
              
              // CRITICAL: Load real player compositions from MatchForm
              team1Players: (mapData.team1_composition || []).map((player, pIndex) => ({
                id: player.player_id || player.id || `team1_p${pIndex + 1}`,
                playerId: player.player_id || player.id || `team1_p${pIndex + 1}`,
                name: player.player_name || player.name || `Player ${pIndex + 1}`,
                hero: player.hero || 'Captain America',
                role: player.role || 'Vanguard',
                country: player.country || player.nationality || 'US',
                eliminations: player.eliminations || 0,
                deaths: player.deaths || 0,
                assists: player.assists || 0,
                damage: player.damage || 0,
                healing: player.healing || 0,
                damageBlocked: player.damage_blocked || player.damageBlocked || 0,
                ultimateUsage: player.ultimate_usage || player.ultimateUsage || 0,
                objectiveTime: player.objective_time || player.objectiveTime || 0
              })),
              
              team2Players: (mapData.team2_composition || []).map((player, pIndex) => ({
                id: player.player_id || player.id || `team2_p${pIndex + 1}`,
                playerId: player.player_id || player.id || `team2_p${pIndex + 1}`,
                name: player.player_name || player.name || `Player ${pIndex + 7}`,
                hero: player.hero || 'Hulk',
                role: player.role || 'Vanguard',
                country: player.country || player.nationality || 'US',
                eliminations: player.eliminations || 0,
                deaths: player.deaths || 0,
                assists: player.assists || 0,
                damage: player.damage || 0,
                healing: player.healing || 0,
                damageBlocked: player.damage_blocked || player.damageBlocked || 0,
                ultimateUsage: player.ultimate_usage || player.ultimateUsage || 0,
                objectiveTime: player.objective_time || player.objectiveTime || 0
              }))
            }))
          };
          
          setMatchStats(syncedMatchStats);
          
          // CRITICAL FIX: Determine actual match status based on map completions for completed matches
          let actualMatchStatus = matchData.status || 'upcoming';
          if (actualMatchStatus === 'completed') {
            // For completed matches, ensure we show them as completed
            const mapsNeededToWin = Math.ceil(totalMaps / 2);
            if (syncedMatchStats.mapWins.team1 >= mapsNeededToWin || syncedMatchStats.mapWins.team2 >= mapsNeededToWin) {
              actualMatchStatus = 'completed';
              console.log(`✅ Match confirmed as completed: Team1 ${syncedMatchStats.mapWins.team1} - Team2 ${syncedMatchStats.mapWins.team2} (${mapsNeededToWin} needed to win)`);
            }
          }
          
          setMatchStatus(actualMatchStatus);
          setCurrentMapIndex((matchData.current_map || 1) - 1);
          
          console.log('✅ MATCHFORM SYNC COMPLETE: Live scoring now synchronized with MatchForm');
          return;
        }
        
        // Fallback to live scoreboard if no MatchForm data
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
        console.log(' ADMIN: Fallback live scoreboard response:', apiResponse);
        
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
              console.error(' ADMIN: Error parsing maps_data:', error);
            }
          }
          
          //  IMPROVED GAME MODE DETECTION FOR ADMIN
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
          
          console.log('ADMIN: Game mode detected:', currentGameMode);
          
          console.log('ADMIN: Using PRODUCTION data structure:', {
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
                  id: player.player_id || player.id,
                  playerId: player.player_id || player.id,
                  name: player.name || player.player_name || player.username || `Player ${player.player_id}`,
                  hero: player.hero || player.current_hero || player.main_hero || 'Captain America',
                  role: convertRoleToFrontend(player.role),
                  country: player.country || player.nationality || 'US',
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
                  id: player.player_id || player.id,
                  playerId: player.player_id || player.id,
                  name: player.name || player.player_name || player.username || `Player ${player.player_id}`,
                  hero: player.hero || player.current_hero || player.main_hero || 'Hulk',
                  role: convertRoleToFrontend(player.role),
                  country: player.country || player.nationality || 'US',
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
            console.log('ADMIN: PRODUCTION data loaded successfully!');
            return;
          }
        }
      } catch (error) {
        console.log('ADMIN: PRODUCTION API failed, using fallback:', error.message);
      }

      // Fallback: Initialize with format-based structure
      console.log(' ADMIN: Initializing fallback data structure...');
      const fallbackStats = initializeMatchStats(match.format || 'BO1');
      setMatchStats(fallbackStats);
    };

    syncWithMatchForm();
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

  //  ENHANCED CROSS-TAB SYNC SYSTEM
  const triggerRealTimeSync = (type, data = {}) => {
    const syncData = {
      matchId: match.id,
      type: type,
      timestamp: Date.now(),
      ...data
    };
    
    console.log('ADMIN: Preparing sync data:', {
      matchId: match.id,
      type: type,
      dataKeys: Object.keys(data),
      hasMatchData: !!data.matchData
    });
    
    //  USE EVENT-SPECIFIC KEYS TO PREVENT TIMER OVERWRITES
    const keyMap = {
      'TIMER_UPDATE': 'mrvl-timer-sync',
      'HERO_CHANGE': 'mrvl-hero-sync', 
      'SCORE_UPDATE': 'mrvl-score-sync',
      'STAT_UPDATE': 'mrvl-stat-sync',
      'PRODUCTION_SAVE': 'mrvl-save-sync'
    };
    
    const specificKey = keyMap[type] || 'mrvl-match-sync';
    
    // Multiple sync methods for reliability - USE UNIQUE KEYS TO PREVENT OVERWRITES
    const uniqueKey = `mrvl-match-sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set different keys for different event types
    localStorage.setItem('mrvl-match-sync', JSON.stringify(syncData)); // Keep main key
    localStorage.setItem(specificKey, JSON.stringify(syncData)); // Event-specific key
    localStorage.setItem(`mrvl-match-${match.id}`, JSON.stringify(syncData));
    localStorage.setItem(uniqueKey, JSON.stringify(syncData)); // Unique key for each event
    
    console.log('ADMIN: Setting localStorage with keys:', {
      'mrvl-match-sync': 'main key',
      [specificKey]: `event-specific (${type})`,
      [`mrvl-match-${match.id}`]: 'match-specific', 
      [uniqueKey]: 'unique for this event'
    });
    
    // Force a storage event for same-page sync
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'mrvl-match-sync',
      newValue: JSON.stringify(syncData),
      oldValue: null,
      storageArea: localStorage
    }));
    
    // REMOVED: setTimeout delays - dispatch events immediately
    window.dispatchEvent(new StorageEvent('storage', {
      key: specificKey,
      newValue: JSON.stringify(syncData),
      oldValue: null,
      storageArea: localStorage
    }));
    
    // Also dispatch with unique key to ensure cross-tab detection
    window.dispatchEvent(new StorageEvent('storage', {
      key: uniqueKey,
      newValue: JSON.stringify(syncData),
      oldValue: null,
      storageArea: localStorage
    }));
    
    // Dispatch multiple event types with debug logging
    const eventTypes = ['mrvl-match-updated', 'mrvl-hero-updated', 'mrvl-stats-updated', 'mrvl-score-updated', 'mrvl-data-refresh'];
    eventTypes.forEach(eventType => {
      console.log(`ADMIN: Dispatching ${eventType} for match ${match.id}`);
      window.dispatchEvent(new CustomEvent(eventType, { detail: syncData }));
    });
    
    console.log('ADMIN: Multi-channel sync completed:', { type, matchId: match.id, timestamp: syncData.timestamp, specificKey });
  };

  //  🚀 ENHANCED SCORE UPDATE WITH TRACKER.GG STYLE INSTANT UPDATES
  const updateMapScore = async (teamNumber, increment = true) => {
    if (!matchStats) return;
    
    try {
      const currentMap = currentMapIndex;
      const scoreKey = teamNumber === 1 ? 'team1Score' : 'team2Score';
      
      setMatchStats(prev => {
        const newStats = { ...prev };
        const currentMapData = { ...newStats.maps[currentMap] };
        
        // Update map score with instant visual feedback
        const currentScore = currentMapData[scoreKey] || 0;
        const newMapScore = Math.max(0, increment ? currentScore + 1 : currentScore - 1);
        currentMapData[scoreKey] = newMapScore;
        
        newStats.maps[currentMap] = currentMapData;
        
        // ENHANCED: More flexible win conditions based on game mode
        const gameMode = currentMapData.mode || 'Domination';
        let winCondition = 3; // Default for most modes
        
        if (gameMode === 'Convoy' || gameMode === 'Escort') {
          winCondition = 2; // Best of 3 rounds for escort modes
        } else if (gameMode === 'Domination') {
          winCondition = 2; // Best of 3 for domination
        }
        
        const team1Rounds = currentMapData.team1Score || 0;
        const team2Rounds = currentMapData.team2Score || 0;
        
        // Check for map completion
        if (team1Rounds >= winCondition || team2Rounds >= winCondition) {
          currentMapData.status = 'completed';
          currentMapData.winner = team1Rounds >= winCondition ? 'team1' : 'team2';
          
          // Update overall map wins (series score)
          if (team1Rounds >= winCondition) {
            newStats.mapWins.team1++;
          } else {
            newStats.mapWins.team2++;
          }
          
          // Check for series completion
          const mapsNeededToWin = Math.ceil(newStats.totalMaps / 2);
          if (newStats.mapWins.team1 >= mapsNeededToWin || newStats.mapWins.team2 >= mapsNeededToWin) {
            setMatchStatus('completed');
            // Trigger match completion updates
            handleMatchCompletion(newStats);
          } else if (currentMap + 1 < newStats.totalMaps) {
            // REMOVED: Auto-advance timer - require manual advancement
            console.log('Map completed. Use Next Map button to advance.');
          }
        }
        
        // 🚀 INSTANT BACKEND SYNC - tracker.gg style immediate updates
        const sendScoreToBackend = async () => {
          try {
            // Send to live-control endpoint for instant updates
            await api.post(`/admin/matches/${match.id}/live-scoring`, {
              action: "update_score",
              team1_score: currentMapData.team1Score || 0,
              team2_score: currentMapData.team2Score || 0,
              current_map_index: currentMap,
              current_map: currentMapData.map_name || 'Map 1',
              map_status: currentMapData.status,
              series_scores: {
                team1: newStats.mapWins.team1,
                team2: newStats.mapWins.team2
              },
              match_timer: matchTimer,
              source: 'comprehensive_live_scoring'
            });
            
            // Also update the match endpoint for persistent storage
            await api.put(`/admin/matches/${match.id}`, {
              team1_score: newStats.mapWins.team1,
              team2_score: newStats.mapWins.team2,
              status: matchStatus,
              current_map: currentMap + 1,
              maps_data: newStats.maps.map(map => ({
                map_number: map.map_number,
                map_name: map.map_name,
                mode: map.mode,
                team1_score: map.team1Score,
                team2_score: map.team2Score,
                status: map.status,
                winner_id: map.winner === 'team1' ? match.team1?.id : 
                          map.winner === 'team2' ? match.team2?.id : null,
                team1_composition: map.team1Players,
                team2_composition: map.team2Players
              }))
            });
            
            console.log('✅ Score instantly synced to backend (tracker.gg style)');
            
            // Trigger parent component update
            if (onUpdate) {
              onUpdate();
            }
          } catch (error) {
            console.error('❌ Error sending score to backend:', error);
          }
        };
        
        // Send to backend immediately for instant sync
        sendScoreToBackend();
        
        //  CREATE COMPLETE MATCH DATA FOR SCORE SYNC
        const completeMatchData = {
          id: match.id,
          status: matchStatus,
          // Use CURRENT ROUND SCORES for immediate display
          team1_score: currentMapData.team1Score || 0,
          team2_score: currentMapData.team2Score || 0,
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
        
        //  IMMEDIATE REAL-TIME SYNC WITH COMPLETE DATA
        triggerRealTimeSync('SCORE_UPDATE', {
          mapIndex: currentMap,
          teamNumber,
          increment,
          mapScore: newMapScore,
          // Send CURRENT ROUND SCORES immediately (not just mapWins)
          overallScores: {
            team1: currentMapData.team1Score || 0,
            team2: currentMapData.team2Score || 0
          },
          // Also send map wins for series tracking
          seriesScores: {
            team1: newStats.mapWins?.team1 || 0,
            team2: newStats.mapWins?.team2 || 0
          },
          matchData: completeMatchData
        });
        
        return newStats;
      });
      
      console.log(`SCORE UPDATE: Team ${teamNumber} ${increment ? '+1' : '-1'} on map ${currentMap + 1}`);
      
    } catch (error) {
      console.error(' Error updating score:', error);
    }
  };

  //  ENHANCED HERO CHANGE WITH REAL-TIME SYNC
  const changePlayerHero = (mapIndex, team, playerIndex, hero, role) => {
    console.log(` Changing ${team} player ${playerIndex} to hero ${hero} (${role})`);
    
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
        
        console.log(`Hero changed: Player ${players[playerIndex].name} is now ${hero}`);
        
        const newStats = { ...prev, maps: updatedMaps };
        
        //  CREATE COMPLETE MATCH DATA FOR HERO SYNC
        const completeMatchData = {
          id: match.id,
          status: matchStatus,
          // Use CURRENT ROUND SCORES for immediate display
          team1_score: currentMap.team1Score || 0,
          team2_score: currentMap.team2Score || 0,
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
        
        //  IMMEDIATE REAL-TIME SYNC WITH COMPLETE DATA
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

  //   ENHANCED STAT UPDATE WITH QUICK INPUT MODE (tracker.gg style)
  const updatePlayerStat = (mapIndex, team, playerIndex, statName, value) => {
    console.log(` Quick updating ${team} player ${playerIndex} ${statName} to ${value}`);
    
    setMatchStats(prev => {
      if (!prev || !prev.maps || !prev.maps[mapIndex]) return prev;
      
      const playersKey = team === 'team1' ? 'team1Players' : 'team2Players';
      const updatedMaps = [...prev.maps];
      const currentMap = { ...updatedMaps[mapIndex] };
      const players = [...(currentMap[playersKey] || [])];
      
      if (players[playerIndex]) {
        const oldValue = players[playerIndex][statName] || 0;
        const newValue = parseInt(value) || 0;
        
        players[playerIndex] = {
          ...players[playerIndex],
          [statName]: newValue
        };
        
        // Visual feedback for stat changes
        if (newValue !== oldValue) {
          console.log(`📈 ${players[playerIndex].name}: ${statName} ${oldValue} → ${newValue}`);
        }
        
        currentMap[playersKey] = players;
        updatedMaps[mapIndex] = currentMap;
        
        const newStats = { ...prev, maps: updatedMaps };
        
        //  CREATE COMPLETE MATCH DATA FOR SYNC
        const completeMatchData = {
          id: match.id,
          status: matchStatus,
          // Use CURRENT ROUND SCORES for immediate display
          team1_score: currentMap.team1Score || 0,
          team2_score: currentMap.team2Score || 0,
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
        
        //  IMMEDIATE REAL-TIME SYNC WITH COMPLETE DATA
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

  //  MAP PROGRESSION WITH PREPARATION PHASE
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
      
      console.log(`Advanced to map ${currentMapIndex + 2}`);
    }
  };

  // REMOVED: Preparation phase timer - use manual controls instead

  // 🚀 QUICK STAT INCREMENT (tracker.gg style one-click updates)
  const quickIncrementStat = (mapIndex, team, playerIndex, statName, increment = 1) => {
    const player = matchStats?.maps?.[mapIndex]?.[team === 'team1' ? 'team1Players' : 'team2Players']?.[playerIndex];
    if (!player) return;
    
    const currentValue = player[statName] || 0;
    const newValue = Math.max(0, currentValue + increment);
    
    updatePlayerStat(mapIndex, team, playerIndex, statName, newValue);
    
    // REMOVED: Visual feedback timeout - use CSS animations instead
    const playerElement = document.getElementById(`player-${team}-${playerIndex}-${statName}`);
    if (playerElement) {
      playerElement.classList.add('bg-green-400', 'transition-colors');
      // CSS animation will handle the removal automatically
    }
  };

  // ENHANCED: Add kill event
  const addKillEvent = async (killerId, victimId, killerHero, victimHero) => {
    const killEvent = {
      id: Date.now(),
      killer_id: killerId,
      victim_id: victimId,
      hero_killer: killerHero,
      hero_victim: victimHero,
      timestamp: new Date().toISOString(),
      game_time: matchTimer,
      map_number: currentMapIndex + 1
    };
    
    // Update local state
    setKillFeed(prev => [killEvent, ...prev].slice(0, 10));
    
    // Send to backend
    try {
      await api.post(`/admin/matches/${match.id}/kill-event`, {
        ...killEvent,
        weapon: 'Primary',
        headshot: false
      });
    } catch (error) {
      console.error('Error adding kill event:', error);
    }
    
    // Trigger real-time sync
    triggerRealTimeSync('KILL_EVENT', killEvent);
  };
  
  // ENHANCED: Update objective progress
  const updateObjectiveProgress = async (progress, capturingTeam = null) => {
    setObjectiveProgress({
      team1: capturingTeam === 'team1' ? progress : objectiveProgress.team1,
      team2: capturingTeam === 'team2' ? progress : objectiveProgress.team2,
      capturingTeam
    });
    
    // Send to backend
    try {
      await api.put(`/admin/matches/${match.id}/maps/${currentMapIndex + 1}/objective`, {
        objective_type: currentMapData?.mode === 'Domination' ? 'capture' : 'payload',
        progress,
        capturing_team: capturingTeam === 'team1' ? match.team1?.id : match.team2?.id,
        time_remaining: null
      });
    } catch (error) {
      console.error('Error updating objective:', error);
    }
    
    // Trigger real-time sync
    triggerRealTimeSync('OBJECTIVE_UPDATE', {
      progress,
      capturingTeam,
      mapIndex: currentMapIndex
    });
  };
  

  // Timer controls with enhanced sync
  const startTimer = async () => {
    const startTime = Date.now();
    setIsTimerRunning(true);
    setTimerStartTime(startTime);
    localStorage.setItem(`match-timer-running-${match.id}`, 'true');
    localStorage.setItem(`match-timer-start-${match.id}`, startTime.toString());
    
    // Update backend timer
    try {
      await api.post(`/admin/matches/${match.id}/live-scoring`, {
        action: 'update_timer',
        timer: '00:00',
        current_map_index: currentMapIndex
      });
    } catch (error) {
      console.error(' Error updating timer on backend:', error);
    }
    
    triggerRealTimeSync('TIMER_START', {
      timer: '00:00',
      isRunning: true
    });
    
    console.log('Timer started with enhanced sync');
  };

  const pauseTimer = () => {
    setIsTimerRunning(false);
    localStorage.setItem(`match-timer-running-${match.id}`, 'false');
    
    triggerRealTimeSync('TIMER_PAUSE', {
      timer: matchTimer,
      isRunning: false
    });
    
    console.log('Timer paused with enhanced sync');
  };

  // Manual timer increment function (replaces automatic interval)
  const incrementTimer = (minutes = 0, seconds = 1) => {
    const [currentMin, currentSec] = matchTimer.split(':').map(Number);
    const totalSeconds = currentMin * 60 + currentSec + minutes * 60 + seconds;
    const newMinutes = Math.floor(totalSeconds / 60);
    const newSeconds = totalSeconds % 60;
    const newTimeString = `${newMinutes.toString().padStart(2, '0')}:${newSeconds.toString().padStart(2, '0')}`;
    
    setMatchTimer(newTimeString);
    localStorage.setItem(`match-timer-${match.id}`, newTimeString);
    
    triggerRealTimeSync('TIMER_INCREMENT', {
      timer: newTimeString,
      isRunning: isTimerRunning
    });
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
    
    console.log(' Timer reset with enhanced sync');
  };

  // REMOVED: Timer interval - use manual time tracking instead
  // Timer functionality moved to manual start/stop/reset buttons

  //  PRODUCTION SAVE FUNCTION - FIXED FOR BACKEND API
  const handleSaveStats = async () => {
    if (!matchStats || !match) {
      console.log('Cannot save: Missing matchStats or match');
      return;
    }

    setSaveLoading(true);
    
    try {
      console.log(' SAVING TO PRODUCTION API - FIXED FORMAT');
      
      const currentMapData = matchStats.maps[currentMapIndex] || matchStats.maps[0];
      
      if (!currentMapData) {
        throw new Error('No map data available for save');
      }

      //  Update live scoring data using correct format for AdminMatchController
      const liveScoringResponse = await api.post(`/admin/matches/${match.id}/live-scoring`, {
        timer: matchTimer,
        status: matchStatus,
        current_map: currentMapIndex + 1,
        current_map_data: {
          name: currentMapData.map_name || currentMapData.name || `Map ${currentMapIndex + 1}`,
          mode: currentMapData.mode || 'Convoy',
          team1Score: currentMapData.team1Score || 0,
          team2Score: currentMapData.team2Score || 0,
          status: currentMapData.status || 'ongoing'
        },
        series_score: {
          team1: matchStats.mapWins.team1,
          team2: matchStats.mapWins.team2
        }
      });
      
      console.log('Live scoring updated:', liveScoringResponse);

      //  CRITICAL FIX 2: Update player stats with bulk endpoint
      const allPlayers = [
        ...(currentMapData.team1Players || []).map(player => ({
          ...player,
          team: 'team1'
        })),
        ...(currentMapData.team2Players || []).map(player => ({
          ...player,
          team: 'team2'
        }))
      ];

      // Send player stats as a separate update
      if (allPlayers.length > 0) {
        const playerStatsFormatted = {};
        allPlayers.forEach(player => {
          const playerId = player.playerId || player.id || `${player.team}_${player.name}`;
          playerStatsFormatted[playerId] = {
            name: player.name,
            hero: player.hero,
            team: player.team,
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            blocked: player.damageBlocked || 0
          };
        });

        await api.post(`/admin/matches/${match.id}/live-scoring`, {
          player_stats: playerStatsFormatted,
          current_map: currentMapIndex + 1
        });
        
        console.log('Player stats updated via live-scoring:', Object.keys(playerStatsFormatted).length, 'players');
      }
      
      console.log('ALL DATA SAVED TO PRODUCTION API VIA CORRECT ENDPOINTS');
      
      // Final comprehensive sync with correct data structure
      triggerRealTimeSync('PRODUCTION_SAVE', {
        playersUpdated: allPlayers.length,
        scores: {
          team1: currentMapData?.team1Score || 0,
          team2: currentMapData?.team2Score || 0
        },
        seriesScores: matchStats.mapWins,
        matchData: {
          ...matchStats,
          team1_score: currentMapData?.team1Score || 0,
          team2_score: currentMapData?.team2Score || 0,
          current_map: currentMapData.map_name || 'Tokyo 2099: Shibuya Sky'
        }
      });
      
    } catch (error) {
      console.error(' Error saving to PRODUCTION API:', error);
      alert(` Error saving: ${error.response?.data?.message || error.message || 'Unknown error'}`);
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
                 Live Match Control - {matchStats.totalMaps === 1 ? 'BO1' : 
                                          matchStats.totalMaps === 3 ? 'BO3' : 
                                          matchStats.totalMaps === 5 ? 'BO5' : 
                                          matchStats.totalMaps === 7 ? 'BO7' : 
                                          matchStats.totalMaps === 9 ? 'BO9' : 'Custom'}
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
                 Series Progress (First to {Math.ceil(matchStats.totalMaps / 2)})
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
              <h3 className="text-xl font-bold mb-2"> Preparation Phase</h3>
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
                  <option value="upcoming"> Upcoming</option>
                  <option value="live"> Live</option>
                  <option value="completed"> Completed</option>
                  <option value="cancelled"> Cancelled</option>
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
                     Start
                  </button>
                  <button
                    onClick={pauseTimer}
                    disabled={!isTimerRunning}
                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded text-sm"
                  >
                     Pause
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                  >
                     Reset
                  </button>
                  <button
                    onClick={() => incrementTimer(0, -1)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    title="Subtract 1 second"
                  >
                    -1s
                  </button>
                  <button
                    onClick={() => incrementTimer(0, 1)}
                    className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                    title="Add 1 second"
                  >
                    +1s
                  </button>
                  <button
                    onClick={() => incrementTimer(1, 0)}
                    className="px-2 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded text-sm"
                    title="Add 1 minute"
                  >
                    +1m
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
                <h3 className="text-lg font-bold text-white text-center mb-4"> LIVE SCOREBOARD</h3>
                
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

              {/* Kill Feed & Objective Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Kill Feed */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <span className="mr-2">💀</span> Kill Feed
                  </h3>
                  
                  {/* Add Kill Event Form */}
                  <div className="mb-4 p-3 bg-gray-800 rounded">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <select
                        id="killTeam"
                        className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        defaultValue=""
                        onChange={(e) => {
                          const killerSelect = document.getElementById('killerPlayer');
                          killerSelect.innerHTML = '<option value="" disabled selected>Select Killer</option>';
                          if (e.target.value) {
                            const players = e.target.value === 'team1' 
                              ? currentMapData.team1Players 
                              : currentMapData.team2Players;
                            players?.forEach((player, idx) => {
                              const option = document.createElement('option');
                              option.value = JSON.stringify({
                                playerId: player.playerId || player.id || idx,
                                hero: player.hero,
                                name: player.name
                              });
                              option.textContent = `${player.name} (${player.hero})`;
                              killerSelect.appendChild(option);
                            });
                          }
                        }}
                      >
                        <option value="" disabled>Select Killer Team</option>
                        <option value="team1">{match.team1?.name || 'Team 1'}</option>
                        <option value="team2">{match.team2?.name || 'Team 2'}</option>
                      </select>
                      <select
                        id="victimTeam"
                        className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        defaultValue=""
                        onChange={(e) => {
                          const victimSelect = document.getElementById('victimPlayer');
                          victimSelect.innerHTML = '<option value="" disabled selected>Select Victim</option>';
                          if (e.target.value) {
                            const players = e.target.value === 'team1' 
                              ? currentMapData.team1Players 
                              : currentMapData.team2Players;
                            players?.forEach((player, idx) => {
                              const option = document.createElement('option');
                              option.value = JSON.stringify({
                                playerId: player.playerId || player.id || idx,
                                hero: player.hero,
                                name: player.name
                              });
                              option.textContent = `${player.name} (${player.hero})`;
                              victimSelect.appendChild(option);
                            });
                          }
                        }}
                      >
                        <option value="" disabled>Select Victim Team</option>
                        <option value="team1">{match.team1?.name || 'Team 1'}</option>
                        <option value="team2">{match.team2?.name || 'Team 2'}</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <select
                        id="killerPlayer"
                        className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>Select Killer</option>
                      </select>
                      <select
                        id="victimPlayer"
                        className="bg-gray-600 text-white px-2 py-1 rounded text-sm"
                        defaultValue=""
                      >
                        <option value="" disabled>Select Victim</option>
                      </select>
                    </div>
                    <button
                      onClick={() => {
                        const killerSelect = document.getElementById('killerPlayer');
                        const victimSelect = document.getElementById('victimPlayer');
                        const killTeamSelect = document.getElementById('killTeam');
                        const victimTeamSelect = document.getElementById('victimTeam');
                        
                        if (killerSelect.value && victimSelect.value) {
                          const killerData = JSON.parse(killerSelect.value);
                          const victimData = JSON.parse(victimSelect.value);
                          
                          addKillEvent(
                            killerData.playerId,
                            victimData.playerId,
                            killerData.hero,
                            victimData.hero
                          );
                          
                          // Reset selections
                          killerSelect.value = '';
                          victimSelect.value = '';
                          killTeamSelect.value = '';
                          victimTeamSelect.value = '';
                        }
                      }}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium"
                    >
                      Add Kill Event
                    </button>
                  </div>
                  
                  {/* Kill Feed Display */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {killFeed.length === 0 ? (
                      <div className="text-gray-400 text-sm text-center py-4">
                        No kills yet
                      </div>
                    ) : (
                      killFeed.map((kill, index) => (
                        <div key={kill.id} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-400">{kill.game_time}</span>
                          <span className="text-green-400">{kill.hero_killer}</span>
                          <span className="text-red-400">eliminated</span>
                          <span className="text-gray-300">{kill.hero_victim}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Objective Progress */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                    <span className="mr-2"></span> Objective Progress
                  </h3>
                  
                  
                  {/* Objective Controls based on Game Mode */}
                  {currentMapData?.mode && (
                    <div className="space-y-3">
                      {currentMapData.mode === 'Domination' && (
                        <div>
                          <h4 className="text-sm text-gray-300 mb-2">Control Point Progress</h4>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-blue-400 w-20">{match.team1?.name}</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={objectiveProgress.team1}
                                onChange={(e) => updateObjectiveProgress(parseInt(e.target.value), 'team1')}
                                className="flex-1"
                              />
                              <span className="text-white w-12 text-right">{objectiveProgress.team1}%</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-red-400 w-20">{match.team2?.name}</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={objectiveProgress.team2}
                                onChange={(e) => updateObjectiveProgress(parseInt(e.target.value), 'team2')}
                                className="flex-1"
                              />
                              <span className="text-white w-12 text-right">{objectiveProgress.team2}%</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {(currentMapData.mode === 'Convoy' || currentMapData.mode === 'Escort') && (
                        <div>
                          <h4 className="text-sm text-gray-300 mb-2">Payload Progress</h4>
                          <div className="space-y-2">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={objectiveProgress.team1}
                              onChange={(e) => updateObjectiveProgress(parseInt(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Start</span>
                              <span className="text-white font-bold">{objectiveProgress.team1}%</span>
                              <span className="text-gray-400">End</span>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {currentMapData.mode === 'Convergence' && (
                        <div>
                          <h4 className="text-sm text-gray-300 mb-2">Convergence Status</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => updateObjectiveProgress(33, 'team1')}
                              className={`px-2 py-1 rounded text-xs ${
                                objectiveProgress.capturingTeam === 'team1' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-600 text-gray-300'
                              }`}
                            >
                              Point A
                            </button>
                            <button
                              onClick={() => updateObjectiveProgress(66, null)}
                              className={`px-2 py-1 rounded text-xs ${
                                !objectiveProgress.capturingTeam && objectiveProgress.team1 === 66
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-gray-600 text-gray-300'
                              }`}
                            >
                              Contested
                            </button>
                            <button
                              onClick={() => updateObjectiveProgress(100, 'team2')}
                              className={`px-2 py-1 rounded text-xs ${
                                objectiveProgress.capturingTeam === 'team2' 
                                  ? 'bg-red-600 text-white' 
                                  : 'bg-gray-600 text-gray-300'
                              }`}
                            >
                              Point B
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
                          
                          <div className="absolute -bottom-1 -right-1 text-xs leading-none">
                            <span>{player.country_flag || getCountryFlag(player.country)}</span>
                          </div>
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
                      
                      {/* 🚀 ENHANCED QUICK UPDATE SYSTEM */}
                      {fastUpdateMode ? (
                        // Fast Update Mode - One-click increment buttons (tracker.gg style)
                        <div className="grid grid-cols-3 gap-2">
                          {['eliminations', 'deaths', 'assists', 'damage', 'healing', 'damageBlocked'].map(stat => (
                            <div key={stat} className="text-center bg-gray-600 rounded p-2">
                              <div className="text-xs text-gray-300 uppercase mb-1">{stat}</div>
                              <div className="flex items-center justify-between">
                                <button
                                  onClick={() => quickIncrementStat(currentMapIndex, 'team1', playerIndex, stat, -1)}
                                  className="w-6 h-6 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span 
                                  id={`player-team1-${playerIndex}-${stat}`}
                                  className="text-lg font-bold text-white min-w-[2rem] text-center"
                                >
                                  {player[stat] || 0}
                                </span>
                                <button
                                  onClick={() => quickIncrementStat(currentMapIndex, 'team1', playerIndex, stat, 1)}
                                  className="w-6 h-6 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Standard input mode
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
                                onFocus={(e) => e.target.select()}
                              />
                            </div>
                          ))}
                        </div>
                      )}
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
                          
                          <div className="absolute -bottom-1 -right-1 text-xs leading-none">
                            <span>{player.country_flag || getCountryFlag(player.country)}</span>
                          </div>
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

          {/* Save Button & Debug */}
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
                  <span></span>
                  <span>Save All Data</span>
                </>
              )}
            </button>
            
            
            {/* COMPREHENSIVE LIVE TESTING PANEL */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {/* Score Update Tests */}
              <button
                onClick={() => {
                  const currentMapData = matchStats.maps[currentMapIndex];
                  updateMapScore(1, (currentMapData.team1Score || 0) + 1);
                  triggerRealTimeSync('SCORE_UPDATE', {
                    teamNumber: 1,
                    mapScore: (currentMapData.team1Score || 0) + 1,
                    mapIndex: currentMapIndex,
                    scores: { 
                      team1: (currentMapData.team1Score || 0) + 1, 
                      team2: currentMapData.team2Score || 0 
                    }
                  });
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm"
              >
                 +1 Team 1
              </button>
              
              <button
                onClick={() => {
                  const currentMapData = matchStats.maps[currentMapIndex];
                  updateMapScore(2, (currentMapData.team2Score || 0) + 1);
                  triggerRealTimeSync('SCORE_UPDATE', {
                    teamNumber: 2,
                    mapScore: (currentMapData.team2Score || 0) + 1,
                    mapIndex: currentMapIndex,
                    scores: { 
                      team1: currentMapData.team1Score || 0, 
                      team2: (currentMapData.team2Score || 0) + 1 
                    }
                  });
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm"
              >
                 +1 Team 2
              </button>
              
              {/* Hero Change Test */}
              <button
                onClick={() => {
                  const testHeroes = ['Spider-Man', 'Iron Man', 'Hulk', 'Thor', 'Captain America', 'Wolverine'];
                  const randomHero = testHeroes[Math.floor(Math.random() * testHeroes.length)];
                  triggerRealTimeSync('HERO_CHANGE', {
                    playerName: `Test Player ${Math.floor(Math.random() * 6) + 1}`,
                    hero: randomHero,
                    role: 'Duelist',
                    team: Math.random() > 0.5 ? 'team1' : 'team2',
                    mapIndex: currentMapIndex
                  });
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded text-sm"
              >
                 Random Hero
              </button>
              
              {/* Timer Test */}
              <button
                onClick={() => {
                  const testTime = `${Math.floor(Math.random() * 20).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`;
                  setMatchTimer(testTime);
                  triggerRealTimeSync('TIMER_UPDATE', {
                    timer: testTime,
                    isRunning: true,
                    mapIndex: currentMapIndex,
                    immediate: true
                  });
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded text-sm"
              >
                 Random Timer
              </button>
              
              {/* All Game Modes Test */}
              <button
                onClick={() => {
                  const gameModes = ['Convoy', 'Domination', 'Convergence', 'Conquest', 'Doom Match', 'Escort'];
                  const randomMode = gameModes[Math.floor(Math.random() * gameModes.length)];
                  const currentMapData = matchStats.maps[currentMapIndex];
                  if (currentMapData) {
                    currentMapData.mode = randomMode;
                    setMatchStats({...matchStats});
                    triggerRealTimeSync('MODE_CHANGE', {
                      newMode: randomMode,
                      mapIndex: currentMapIndex
                    });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm"
              >
                 Random Mode
              </button>
              
              {/* Full Match Sync Test */}
              <button
                onClick={() => {
                  triggerRealTimeSync('PRODUCTION_SAVE', {
                    scores: { team1: 2, team2: 1 },
                    timer: matchTimer,
                    currentMap: matchStats.maps[currentMapIndex]?.map_name,
                    allMapsUpdated: true,
                    matchData: {
                      ...matchStats,
                      team1_score: 2,
                      team2_score: 1,
                      status: 'live',
                      lastUpdated: Date.now()
                    }
                  });
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded text-sm"
              >
                 Full Sync Test
              </button>
            </div>
            
            {matchStats.totalMaps > 1 && currentMapIndex + 1 < matchStats.totalMaps && (
              <button
                onClick={() => {
                  setIsPreparationPhase(true);
                  setPreparationTimer(45);
                }}
                className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold text-lg flex items-center space-x-2"
              >
                <span></span>
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