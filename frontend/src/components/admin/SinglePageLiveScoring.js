import React, { useState, useEffect } from 'react';
import { X, Save, Play, Pause, Trophy, Users, ChevronLeft, ChevronRight, RefreshCw, CheckCircle, Square, RotateCcw } from 'lucide-react';
import { useAuth } from '../../hooks';
import { getCountryFlag } from '../../utils/imageUtils';
import HeroImage from '../shared/HeroImage';
import { 
  HEROES,
  MARVEL_RIVALS_MAPS
} from '../../constants/marvelRivalsData';
import { heroService } from '../../services/heroService';

// Flatten heroes array for dropdown
const ALL_HEROES = Object.values(HEROES).flat().filter(hero => hero !== 'TBD');

// 💾 LOCAL STORAGE PERSISTENCE HELPERS
const STORAGE_KEY_PREFIX = 'mrvl-live-scoring-';

const saveMatchDataToStorage = (matchId, data) => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;
    const dataToSave = {
      ...data,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    console.log('💾 Live scoring data saved to localStorage:', storageKey);
  } catch (error) {
    console.error('❌ Error saving to localStorage:', error);
  }
};

const restoreMatchDataFromStorage = (matchId) => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (!savedData) return null;
    
    const parsed = JSON.parse(savedData);
    
    // Check if data is less than 24 hours old
    const isStale = Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000;
    if (isStale) {
      localStorage.removeItem(storageKey);
      console.log('🗑️ Removed stale localStorage data for match:', matchId);
      return null;
    }
    
    console.log('✅ Restored live scoring data from localStorage:', storageKey);
    return parsed;
  } catch (error) {
    console.error('❌ Error restoring from localStorage:', error);
    return null;
  }
};

const clearMatchDataFromStorage = (matchId) => {
  try {
    const storageKey = `${STORAGE_KEY_PREFIX}${matchId}`;
    localStorage.removeItem(storageKey);
    console.log('🗑️ Cleared localStorage data for match:', matchId);
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
  }
};

const SinglePageLiveScoring = ({ 
  isOpen, 
  onClose, 
  match,
  onUpdate 
}) => {
  const { api } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';
  
  // Get token from localStorage for direct fetch calls
  const token = localStorage.getItem('authToken');

  // 🔥 SIMPLIFIED UNIFIED SYNC SYSTEM - Single event, single storage key
  const triggerCrossTabSync = (type, additionalData = {}) => {
    const syncData = {
      matchId: match?.id,
      timestamp: Date.now(),
      updateType: type,
      ...additionalData
    };
    
    // Use match-specific storage key to prevent conflicts
    localStorage.setItem(`liveMatchUpdate_${match?.id}`, JSON.stringify(syncData));
    console.log('🔄 LIVE SCORING: Unified sync triggered:', { updateType: type, matchId: match?.id });
    
    // Dispatch single unified event only
    window.dispatchEvent(new CustomEvent('liveMatchUpdate', {
      detail: syncData
    }));
  };

  // Core match state
  const [matchStats, setMatchStats] = useState({
    matchId: match?.id,
    team1Score: 0,
    team2Score: 0,
    currentMapIndex: 0,
    totalMaps: 3,
    status: 'live',
    maps: []
  });

  const [currentMapData, setCurrentMapData] = useState({
    name: '',
    mode: '',
    team1Score: 0,
    team2Score: 0,
    status: 'ongoing'
  });

  const [isSaving, setIsSaving] = useState(false);

  // Player stats for both teams (6v6)
  const [playerStats, setPlayerStats] = useState({
    team1: Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    })),
    team2: Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    }))
  });

  // Initialize match data
  useEffect(() => {
    if (match && isOpen) {
      initializeMatchData();
    }
  }, [match, isOpen]);

  const initializeMatchData = () => {
    const format = match.format || 'BO3';
    const totalMaps = parseInt(format.replace('BO', ''));
    
    // 💾 Try to restore from localStorage first
    const persistedData = restoreMatchDataFromStorage(match.id);
    
    if (persistedData) {
      console.log('🔄 Restoring live scoring data from localStorage:', persistedData);
      setMatchStats(persistedData.matchStats);
      setCurrentMapData(persistedData.currentMapData);
      // ⚠️ Don't restore playerStats yet - let real data load first
      
      // Show restoration notification
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          const notification = document.createElement('div');
          notification.textContent = '🔄 Data restored from previous session';
          notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10000;
            background: #10b981; color: white; padding: 12px 16px;
            border-radius: 6px; font-size: 14px; font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          `;
          document.body.appendChild(notification);
          setTimeout(() => notification.remove(), 3000);
        }
      }, 500);
      
      return;
    }
    
    // Initialize from backend data if no local storage
    const initializedMaps = initializeMaps(match.maps_data || [], totalMaps);
    
    // Calculate series scores from map wins
    let team1Wins = 0;
    let team2Wins = 0;
    initializedMaps.forEach(map => {
      if (map.status === 'completed') {
        if (map.team1Score > map.team2Score) {
          team1Wins++;
        } else if (map.team2Score > map.team1Score) {
          team2Wins++;
        }
      }
    });
    
    setMatchStats({
      matchId: match.id,
      team1Score: match.series_score_team1 || team1Wins,
      team2Score: match.series_score_team2 || team2Wins,
      currentMapIndex: (match.current_map_number || match.current_map || 1) - 1,
      totalMaps: totalMaps,
      status: match.status || 'live',
      maps: initializedMaps
    });

    // Set current map data
    const currentMap = match.maps_data?.[match.current_map - 1] || {};
    setCurrentMapData({
      name: currentMap.name || 'Map ' + (match.current_map || 1),
      mode: currentMap.mode || 'Domination',
      team1Score: currentMap.team1_score || 0,
      team2Score: currentMap.team2_score || 0,
      status: currentMap.status || 'ongoing'
    });

    // Initialize player stats from match data
    // Always use team rosters as the source of truth
    initializePlayerStats(match.player_stats || {});
    
    // 🔄 OPTIONAL: Restore cached player stats only if no real players were found
    if (persistedData && persistedData.playerStats) {
      // Only restore cached stats if we didn't find real players
      const hasRealPlayers = (match.team1?.players?.length > 0) || (match.team2?.players?.length > 0);
      if (!hasRealPlayers) {
        console.log('🔄 No real players found, using cached player stats');
        setPlayerStats(persistedData.playerStats);
      } else {
        console.log('✅ Real players found, ignoring cached player stats');
      }
    }

  };

  const initializeMaps = (existingMaps, totalMaps) => {
    const maps = [];
    const defaultMaps = Object.values(MARVEL_RIVALS_MAPS);
    
    for (let i = 0; i < totalMaps; i++) {
      if (existingMaps[i]) {
        maps.push({
          ...existingMaps[i],
          mapNumber: i + 1,
          // Ensure we have the scores from both possible field names
          team1Score: existingMaps[i].team1Score || existingMaps[i].team1_score || 0,
          team2Score: existingMaps[i].team2Score || existingMaps[i].team2_score || 0,
          name: existingMaps[i].map_name || existingMaps[i].name,
          mode: existingMaps[i].mode,
          status: existingMaps[i].status || (i === 0 ? 'ongoing' : 'upcoming')
        });
      } else {
        const randomMap = defaultMaps[Math.floor(Math.random() * defaultMaps.length)];
        maps.push({
          mapNumber: i + 1,
          name: randomMap.name,
          mode: randomMap.mode,
          team1Score: 0,
          team2Score: 0,
          status: i === 0 ? 'ongoing' : 'upcoming'
        });
      }
    }
    return maps;
  };

  const initializePlayerStats = (statsData) => {
    const team1Players = [];
    const team2Players = [];
    
    // 🔍 DEBUG: Check what match data we have
    console.log('🔍 Match data check:', {
      hasMatch: !!match,
      hasTeam1: !!match?.team1,
      hasTeam2: !!match?.team2,
      team1Players: match?.team1?.players?.length || 0,
      team2Players: match?.team2?.players?.length || 0,
      team1Name: match?.team1?.name,
      team2Name: match?.team2?.name
    });
    
    // Get current map index to load hero assignments
    const currentMapIndex = (match.current_map_number || match.current_map || 1) - 1;
    const currentMapData = match.maps_data?.[currentMapIndex];

    // Extract players from match teams - Sort by ID to maintain consistent order
    if (match.team1?.players) {
      const sortedTeam1 = [...match.team1.players].sort((a, b) => (a.id || 0) - (b.id || 0));
      console.log('🔍 Team1 raw players from API:', sortedTeam1);
      
      sortedTeam1.forEach((player, index) => {
        if (index < 6) {
          // Find hero from current map composition
          let hero = '';
          if (currentMapData?.team1_composition) {
            const mapPlayer = currentMapData.team1_composition.find(
              p => p.player_id === player.id || p.player_id === player.player_id
            );
            hero = mapPlayer?.hero || '';
          }
          
          const playerName = player.username || player.player_name || player.name || '';
          console.log(`🔍 Team1 Player ${index + 1} name extraction:`, {
            username: player.username,
            player_name: player.player_name,
            name: player.name,
            finalName: playerName,
            rawPlayer: player
          });
          
          team1Players.push({
            playerId: player.id || player.player_id,
            name: playerName,
            hero: hero || player.hero || player.main_hero || '',
            country: player.country || player.nationality || '',
            eliminations: statsData[player.id]?.eliminations || 0,
            deaths: statsData[player.id]?.deaths || 0,
            assists: statsData[player.id]?.assists || 0,
            damage: statsData[player.id]?.damage || 0,
            healing: statsData[player.id]?.healing || 0,
            damageBlocked: statsData[player.id]?.damage_blocked || 0
          });
        }
      });
    }

    if (match.team2?.players) {
      const sortedTeam2 = [...match.team2.players].sort((a, b) => (a.id || 0) - (b.id || 0));
      console.log('🔍 Team2 raw players from API:', sortedTeam2);
      
      sortedTeam2.forEach((player, index) => {
        if (index < 6) {
          // Find hero from current map composition
          let hero = '';
          if (currentMapData?.team2_composition) {
            const mapPlayer = currentMapData.team2_composition.find(
              p => p.player_id === player.id || p.player_id === player.player_id
            );
            hero = mapPlayer?.hero || '';
          }
          
          const playerName = player.username || player.player_name || player.name || '';
          console.log(`🔍 Team2 Player ${index + 1} name extraction:`, {
            username: player.username,
            player_name: player.player_name,
            name: player.name,
            finalName: playerName,
            rawPlayer: player
          });
          
          team2Players.push({
            playerId: player.id || player.player_id,
            name: playerName,
            hero: hero || player.hero || player.main_hero || '',
            country: player.country || player.nationality || '',
            eliminations: statsData[player.id]?.eliminations || 0,
            deaths: statsData[player.id]?.deaths || 0,
            assists: statsData[player.id]?.assists || 0,
            damage: statsData[player.id]?.damage || 0,
            healing: statsData[player.id]?.healing || 0,
            damageBlocked: statsData[player.id]?.damage_blocked || 0
          });
        }
      });
    }
    
    // 🔒 ENFORCE: Strictly limit to 6 players per team (Marvel Rivals 6v6)
    const limitedTeam1 = team1Players.slice(0, 6);
    const limitedTeam2 = team2Players.slice(0, 6);
    
    // 🔄 ONLY create placeholder players to fill up to 6 if we have less than 6 real players
    const finalTeam1 = [...limitedTeam1];
    const finalTeam2 = [...limitedTeam2];
    
    // Add placeholders only if needed to reach 6 players
    while (finalTeam1.length < 6) {
      finalTeam1.push({
        playerId: null,
        name: '',  // Empty name for placeholder
        hero: '',
        country: '',
        eliminations: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        healing: 0,
        damageBlocked: 0
      });
    }
    
    while (finalTeam2.length < 6) {
      finalTeam2.push({
        playerId: null,
        name: '',  // Empty name for placeholder
        hero: '',
        country: '',
        eliminations: 0,
        deaths: 0,
        assists: 0,
        damage: 0,
        healing: 0,
        damageBlocked: 0
      });
    }
    
    console.log('✅ Player initialization result:', {
      team1: `${finalTeam1.length}/6 players`,
      team2: `${finalTeam2.length}/6 players`,
      team1Names: finalTeam1.map(p => p.name),
      team2Names: finalTeam2.map(p => p.name),
      usingRealPlayers: limitedTeam1.length > 0 && limitedTeam2.length > 0,
      realPlayersTeam1: limitedTeam1.length,
      realPlayersTeam2: limitedTeam2.length
    });
    
    // Debug: Log the actual player objects
    console.log('🔍 Team1 players:', finalTeam1);
    console.log('🔍 Team2 players:', finalTeam2);

    // Set player stats with guaranteed 6-player limit
    setPlayerStats({
      team1: finalTeam1,
      team2: finalTeam2
    });
  };

  const initializeDefaultPlayerStats = () => {
    // Use default player structure if no match data available
    const team1Players = Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `${match?.team1?.name || 'Team 1'} Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    }));

    const team2Players = Array(6).fill(null).map((_, i) => ({
      playerId: null,
      name: `${match?.team2?.name || 'Team 2'} Player ${i + 1}`,
      hero: '',
      country: '',
      eliminations: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      damageBlocked: 0
    }));

    setPlayerStats({
      team1: team1Players,
      team2: team2Players
    });
  };


  // 💾 AUTO-SAVE TO LOCALSTORAGE: Save all state changes for persistence
  useEffect(() => {
    if (matchStats.matchId && isOpen) {
      const dataToSave = {
        matchStats,
        currentMapData,
        playerStats,
      };
      
      // Debounced save to localStorage
      clearTimeout(window.localStorageSaveTimeout);
      window.localStorageSaveTimeout = setTimeout(() => {
        saveMatchDataToStorage(matchStats.matchId, dataToSave);
      }, 1000); // Save 1 second after state changes
    }
  }, [matchStats, currentMapData, playerStats, isOpen]);

  // 🧹 CLEANUP: Clear all auto-save timeouts when component unmounts
  useEffect(() => {
    return () => {
      clearTimeout(window.statSaveTimeout);
      clearTimeout(window.heroSaveTimeout);
      clearTimeout(window.scoreSaveTimeout);
      clearTimeout(window.localStorageSaveTimeout);
    };
  }, []);

  // Removed keyboard shortcuts for timer control
  

  // Update player stat
  const updatePlayerStat = (team, playerIndex, statType, value) => {
    const newValue = Math.max(0, parseInt(value) || 0);
    setPlayerStats(prev => ({
      ...prev,
      [team]: prev[team].map((player, index) => 
        index === playerIndex 
          ? { ...player, [statType]: newValue }
          : player
      )
    }));

    // 🔥 TRIGGER REAL-TIME SYNC FOR STAT UPDATES
    triggerCrossTabSync('STAT_UPDATE', {
      playerName: playerStats[team][playerIndex]?.name,
      statName: statType,
      value: newValue,
      team: `team${team}`,
      mapIndex: matchStats.currentMapIndex
    });

    // 💾 AUTO-SAVE AFTER STAT CHANGES (reduced delay for better sync)
    clearTimeout(window.statSaveTimeout);
    window.statSaveTimeout = setTimeout(() => {
      saveMatchData();
    }, 500); // Save 0.5 seconds after last stat change
  };

  // Update player hero
  const updatePlayerHero = (team, playerIndex, hero) => {
    setPlayerStats(prev => ({
      ...prev,
      [team]: prev[team].map((player, index) => 
        index === playerIndex 
          ? { ...player, hero: hero }
          : player
      )
    }));

    // 🔥 TRIGGER REAL-TIME SYNC FOR HERO CHANGES
    triggerCrossTabSync('HERO_CHANGE', {
      team: `team${team}`,
      playerIndex,
      mapIndex: matchStats.currentMapIndex,
      hero,
      role: heroService.getHeroRole(hero),
      playerName: playerStats[team][playerIndex]?.name
    });

    // 💾 AUTO-SAVE AFTER HERO CHANGES (reduced delay for better sync)
    clearTimeout(window.heroSaveTimeout);
    window.heroSaveTimeout = setTimeout(() => {
      saveMatchData();
    }, 500); // Save 0.5 seconds after last hero change
  };

  // Update map score
  const updateMapScore = (team, increment) => {
    const teamKey = team === 1 ? 'team1Score' : 'team2Score';
    const newScore = Math.max(0, currentMapData[teamKey] + increment);
    
    setCurrentMapData(prev => ({
      ...prev,
      [teamKey]: newScore
    }));

    // 🔥 TRIGGER REAL-TIME SYNC FOR SCORE UPDATES
    triggerCrossTabSync('SCORE_UPDATE', {
      mapScore: newScore,
      teamNumber: team,
      mapIndex: matchStats.currentMapIndex,
      mapName: currentMapData.name
    });

    // 💾 AUTO-SAVE AFTER MAP SCORE CHANGES (debounced)
    clearTimeout(window.scoreSaveTimeout);
    window.scoreSaveTimeout = setTimeout(() => {
      saveMatchData();
    }, 2000); // Save 2 seconds after last score change
  };

  // Navigate between maps
  const navigateToMap = (mapIndex) => {
    if (mapIndex < 0 || mapIndex >= matchStats.totalMaps) return;
    
    // Save current map data before switching
    const updatedMaps = [...matchStats.maps];
    updatedMaps[matchStats.currentMapIndex] = {
      ...updatedMaps[matchStats.currentMapIndex],
      ...currentMapData
    };
    
    setMatchStats(prev => ({
      ...prev,
      currentMapIndex: mapIndex,
      maps: updatedMaps
    }));
    
    // Load new map data
    const newMap = updatedMaps[mapIndex];
    setCurrentMapData({
      name: newMap.name || `Map ${mapIndex + 1}`,
      mode: newMap.mode || 'Domination',
      team1Score: newMap.team1Score || 0,
      team2Score: newMap.team2Score || 0,
      status: newMap.status || 'upcoming'
    });
    
    // Update player heroes based on the selected map's compositions
    const mapData = match.maps_data?.[mapIndex];
    if (mapData) {
      setPlayerStats(prev => {
        const updatedStats = { ...prev };
        
        // Update team1 heroes
        if (mapData.team1_composition && prev.team1) {
          updatedStats.team1 = prev.team1.map(player => {
            const mapPlayer = mapData.team1_composition.find(
              p => p.player_id === player.playerId
            );
            return mapPlayer ? { ...player, hero: mapPlayer.hero || '' } : player;
          });
        }
        
        // Update team2 heroes
        if (mapData.team2_composition && prev.team2) {
          updatedStats.team2 = prev.team2.map(player => {
            const mapPlayer = mapData.team2_composition.find(
              p => p.player_id === player.playerId
            );
            return mapPlayer ? { ...player, hero: mapPlayer.hero || '' } : player;
          });
        }
        
        return updatedStats;
      });
    }
  };

  // Complete current map
  const completeCurrentMap = () => {
    const updatedMaps = [...matchStats.maps];
    updatedMaps[matchStats.currentMapIndex] = {
      ...currentMapData,
      status: 'completed'
    };
    
    // Calculate series scores
    let seriesTeam1 = 0;
    let seriesTeam2 = 0;
    updatedMaps.forEach(map => {
      if (map.status === 'completed') {
        if (map.team1Score > map.team2Score) {
          seriesTeam1++;
        } else if (map.team2Score > map.team1Score) {
          seriesTeam2++;
        }
      }
    });
    
    setMatchStats(prev => ({
      ...prev,
      maps: updatedMaps,
      team1Score: seriesTeam1,
      team2Score: seriesTeam2
    }));
    
    // Auto-advance to next map if not the last one
    if (matchStats.currentMapIndex < matchStats.totalMaps - 1) {
      setTimeout(() => navigateToMap(matchStats.currentMapIndex + 1), 500);
    }
    
    // Trigger save
    setTimeout(() => saveMatchData(), 100);
    
    // Trigger cross-tab sync
    triggerCrossTabSync('MAP_COMPLETED', {
      mapIndex: matchStats.currentMapIndex,
      team1Score: currentMapData.team1Score,
      team2Score: currentMapData.team2Score,
      seriesScoreTeam1: seriesTeam1,
      seriesScoreTeam2: seriesTeam2
    });
  };

  // Control match actions
  const controlMatch = async (action) => {
    try {
      const response = await api.post(`/admin/matches/${match.id}/control`, { action });

      if (response.data) {
        console.log(`✅ Match ${action} successfully`);
        
        if (action === 'start' || action === 'resume') {
          setMatchStats(prev => ({ ...prev, status: 'live' }));
          
          // 🔥 TRIGGER REAL-TIME SYNC IMMEDIATELY
          triggerCrossTabSync('STATUS_CHANGE', {
                status: 'live',
            action: action
          });
          
          // Immediately save the match state when starting
          setTimeout(() => saveMatchData(), 100);
        } else if (action === 'pause') {
          setMatchStats(prev => ({ ...prev, status: 'paused' }));
          
          // 🔥 TRIGGER REAL-TIME SYNC FOR PAUSE
          triggerCrossTabSync('STATUS_CHANGE', {
                status: 'paused',
            action: action
          });
          
          // Save current state when pausing
          setTimeout(() => saveMatchData(), 100);
        } else if (action === 'complete') {
          
          // First update the maps array with current map data before completing
          const finalMaps = [...matchStats.maps];
          finalMaps[matchStats.currentMapIndex] = {
            ...finalMaps[matchStats.currentMapIndex],
            name: currentMapData.name,
            mode: currentMapData.mode,
            team1Score: currentMapData.team1Score,
            team2Score: currentMapData.team2Score,
            status: 'completed'
          };
          
          // Calculate final series scores based on map wins
          let finalTeam1Score = 0;
          let finalTeam2Score = 0;
          finalMaps.forEach(map => {
            if (map.status === 'completed') {
              if (map.team1Score > map.team2Score) {
                finalTeam1Score++;
              } else if (map.team2Score > map.team1Score) {
                finalTeam2Score++;
              }
            }
          });
          
          // Update match state with final maps data and series scores
          setMatchStats(prev => ({ 
            ...prev, 
            status: 'completed',
            maps: finalMaps,
            team1Score: finalTeam1Score,
            team2Score: finalTeam2Score
          }));
          
          // Save final state with updated maps
          setTimeout(() => saveMatchData(), 100);
          // Clear localStorage data since match is completed
          setTimeout(() => clearMatchDataFromStorage(match.id), 2000);
        } else if (action === 'restart') {
          // Clear localStorage data for fresh start
          clearMatchDataFromStorage(match.id);
          initializeMatchData();
        }
      }
    } catch (error) {
      console.error(`❌ Error ${action} match:`, error);
    }
  };

  // Save all data to backend
  const saveMatchData = async () => {
    setIsSaving(true);
    try {
      // First, update current map data in the maps array
      const updatedMaps = [...matchStats.maps];
      updatedMaps[matchStats.currentMapIndex] = {
        ...updatedMaps[matchStats.currentMapIndex],
        name: currentMapData.name,
        mode: currentMapData.mode,
        team1Score: currentMapData.team1Score,
        team2Score: currentMapData.team2Score,
        status: currentMapData.status
      };

      // Prepare hero selections from player stats
      const heroSelections = [];
      
      // Process team1 players
      playerStats.team1.forEach((player, index) => {
        if (player.hero && player.playerId) {
          heroSelections.push({
            player_id: player.playerId,
            hero: player.hero,
            team: 1
          });
        }
      });
      
      // Process team2 players
      playerStats.team2.forEach((player, index) => {
        if (player.hero && player.playerId) {
          heroSelections.push({
            player_id: player.playerId,
            hero: player.hero,
            team: 2
          });
        }
      });
      
      // Prepare map scores for backend
      const mapScores = updatedMaps.map((map, index) => ({
        map_number: index + 1,
        team1_score: map.team1Score || 0,
        team2_score: map.team2Score || 0,
        winner_id: map.status === 'completed' && map.team1Score !== map.team2Score 
          ? (map.team1Score > map.team2Score ? match?.team1?.id : match?.team2?.id) 
          : null
      }));
      
      // Convert player stats to backend format
      const formattedPlayerStats = {};
      
      // Add team1 players
      playerStats.team1.forEach((player) => {
        if (player.playerId) {
          formattedPlayerStats[player.playerId] = {
            name: player.name,
            hero: player.hero,
            team: 1,
            country: player.country,
            eliminations: player.eliminations,
            deaths: player.deaths,
            assists: player.assists,
            damage: player.damage,
            healing: player.healing,
            damage_blocked: player.damageBlocked
          };
        }
      });
      
      // Add team2 players
      playerStats.team2.forEach((player) => {
        if (player.playerId) {
          formattedPlayerStats[player.playerId] = {
            name: player.name,
            hero: player.hero,
            team: 2,
            country: player.country,
            eliminations: player.eliminations,
            deaths: player.deaths,
            assists: player.assists,
            damage: player.damage,
            healing: player.healing,
            damage_blocked: player.damageBlocked
          };
        }
      });

      // Calculate series scores from completed maps
      let seriesScoreTeam1 = 0;
      let seriesScoreTeam2 = 0;
      updatedMaps.forEach(map => {
        if (map.status === 'completed') {
          if (map.team1Score > map.team2Score) {
            seriesScoreTeam1++;
          } else if (map.team2Score > map.team1Score) {
            seriesScoreTeam2++;
          }
        }
      });

      // SIMPLIFIED PAYLOAD for SimpleLiveController
      const payload = {
        status: matchStats.status,
        team1_score: matchStats.team1Score,
        team2_score: matchStats.team2Score,
        series_score_team1: seriesScoreTeam1,
        series_score_team2: seriesScoreTeam2,
        current_map: matchStats.currentMapIndex + 1,
        maps: updatedMaps,
        player_stats: formattedPlayerStats
      };

      console.log('📤 Sending SIMPLE match data to backend:', {
        matchId: matchStats.matchId,
        status: payload.status,
        team1_score: payload.team1_score,
        team2_score: payload.team2_score,
        series_score_team1: payload.series_score_team1,
        series_score_team2: payload.series_score_team2,
        current_map: payload.current_map,
        mapsLength: payload.maps?.length
      });

      const response = await api.post(`/admin/matches/${matchStats.matchId}/simple-scoring`, payload);

      if (response.data) {
        console.log('✅ Match data saved successfully:', response.data);
        
        // 🔥 TRIGGER REAL-TIME SYNC FOR ALL CHANGES - SIMPLIFIED
        triggerCrossTabSync('COMPLETE_UPDATE', {
          status: payload.status,
          team1_score: payload.team1_score,
          team2_score: payload.team2_score,
          series_score_team1: payload.series_score_team1,
          series_score_team2: payload.series_score_team2,
          current_map: payload.current_map,
          maps: payload.maps,
          player_stats: payload.player_stats,
          success: true
        });
        
        // 💾 SHOW SUCCESS FEEDBACK TO USER
        if (typeof window !== 'undefined') {
          const saveButton = document.querySelector('button[disabled]');
          if (saveButton) {
            const originalText = saveButton.textContent;
            saveButton.textContent = '✅ Saved!';
            saveButton.style.backgroundColor = '#10b981';
            setTimeout(() => {
              saveButton.textContent = originalText;
              saveButton.style.backgroundColor = '';
            }, 2000);
          }
        }
        
        if (onUpdate) {
          onUpdate({
            ...payload,
            id: matchStats.matchId
          });
        }
      }
    } catch (error) {
      console.error('❌ Error saving match data:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate K/D ratio
  const getKDRatio = (eliminations, deaths) => {
    if (deaths === 0) return eliminations > 0 ? '∞' : '0.00';
    return (eliminations / deaths).toFixed(2);
  };

  // Sort players by role (DPS/Duelist -> Tank/Vanguard -> Support/Strategist)
  const sortPlayersByRole = (players) => {
    const roleOrder = {
      'Duelist': 1,
      'Vanguard': 2,
      'Strategist': 3
    };

    return [...players].sort((a, b) => {
      const roleA = heroService.getHeroRole(a.hero) || 'Duelist';
      const roleB = heroService.getHeroRole(b.hero) || 'Duelist';
      
      const orderA = roleOrder[roleA] || 4;
      const orderB = roleOrder[roleB] || 4;
      
      return orderA - orderB;
    });
  };


  // Render player row
  const renderPlayerRow = (player, team, index) => {
    const flag = getCountryFlag(player.country);
    const kdRatio = getKDRatio(player.eliminations, player.deaths);
    const role = heroService.getHeroRole(player.hero);

    return (
      <tr key={`${team}-${index}`} className="border-b border-gray-200 dark:border-gray-700">
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{flag}</span>
            <span className="font-medium text-sm">{player.name}</span>
          </div>
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center gap-2">
            <HeroImage 
              heroName={player.hero}
              size="sm"
              showRole={true}
            />
            <div className="flex flex-col gap-1">
              <select
                value={player.hero}
                onChange={(e) => updatePlayerHero(team, index, e.target.value)}
                className="text-xs border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="">Select Hero</option>
                {ALL_HEROES.map(hero => (
                  <option key={hero} value={hero}>{hero}</option>
                ))}
              </select>
              <span className={`text-xs font-medium ${
                role === 'Duelist' ? 'text-red-600 dark:text-red-400' :
                role === 'Vanguard' ? 'text-blue-600 dark:text-blue-400' :
                role === 'Strategist' ? 'text-green-600 dark:text-green-400' :
                'text-gray-600 dark:text-gray-400'
              }`}>
                {role}
              </span>
            </div>
          </div>
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.eliminations}
            onChange={(e) => updatePlayerStat(team, index, 'eliminations', e.target.value)}
            className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.deaths}
            onChange={(e) => updatePlayerStat(team, index, 'deaths', e.target.value)}
            className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.assists}
            onChange={(e) => updatePlayerStat(team, index, 'assists', e.target.value)}
            className="w-12 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2 text-xs font-medium text-center">
          {kdRatio}
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.damage}
            onChange={(e) => updatePlayerStat(team, index, 'damage', e.target.value)}
            className="w-16 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.healing}
            onChange={(e) => updatePlayerStat(team, index, 'healing', e.target.value)}
            className="w-16 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
        <td className="px-3 py-2">
          <input
            type="number"
            value={player.damageBlocked}
            onChange={(e) => updatePlayerStat(team, index, 'damageBlocked', e.target.value)}
            className="w-16 text-xs text-center border rounded px-1 py-0.5 bg-white dark:bg-gray-700 dark:border-gray-600"
            min="0"
          />
        </td>
      </tr>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[98vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Live Scoring
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={saveMatchData}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map Navigation */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateToMap(matchStats.currentMapIndex - 1)}
                disabled={matchStats.currentMapIndex === 0}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: matchStats.totalMaps }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => navigateToMap(i)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      i === matchStats.currentMapIndex
                        ? 'bg-blue-600 text-white'
                        : matchStats.maps[i]?.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Map {i + 1}
                    {matchStats.maps[i]?.status === 'completed' && (
                      <CheckCircle className="w-3 h-3 inline ml-1" />
                    )}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => navigateToMap(matchStats.currentMapIndex + 1)}
                disabled={matchStats.currentMapIndex === matchStats.totalMaps - 1}
                className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => controlMatch('start')}
                disabled={matchStats.status === 'live'}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
              <button
                onClick={() => controlMatch('pause')}
                disabled={matchStats.status !== 'live'}
                className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-1"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={() => controlMatch('complete')}
                disabled={matchStats.status === 'completed'}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
              >
                <CheckCircle className="w-4 h-4" />
                Complete
              </button>
              <button
                onClick={() => controlMatch('restart')}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Restart
              </button>
            </div>
          </div>
        </div>

        {/* Match Info */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {match?.team1?.name || 'Team 1'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateMapScore(1, -1)}
                    className="w-6 h-6 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 min-w-[2rem] text-center">
                    {currentMapData.team1Score}
                  </span>
                  <button
                    onClick={() => updateMapScore(1, 1)}
                    className="w-6 h-6 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-center text-gray-600 dark:text-gray-400">
                <div className="text-sm font-medium">{currentMapData.name}</div>
                <div className="text-xs">{currentMapData.mode}</div>
                <div className="text-xs mt-1">
                  Map {matchStats.currentMapIndex + 1} of {matchStats.totalMaps}
                </div>
              </div>

              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {match?.team2?.name || 'Team 2'}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    onClick={() => updateMapScore(2, -1)}
                    className="w-6 h-6 bg-red-500 text-white rounded text-xs font-bold hover:bg-red-600"
                  >
                    -
                  </button>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400 min-w-[2rem] text-center">
                    {currentMapData.team2Score}
                  </span>
                  <button
                    onClick={() => updateMapScore(2, 1)}
                    className="w-6 h-6 bg-green-500 text-white rounded text-xs font-bold hover:bg-green-600"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400">Series Score</div>
              <div className="text-lg font-bold mb-2">
                <span className="text-blue-600 dark:text-blue-400">{matchStats.team1Score}</span>
                {' - '}
                <span className="text-red-600 dark:text-red-400">{matchStats.team2Score}</span>
              </div>
              
              {/* Map Score Indicators */}
              <div className="flex items-center justify-center gap-1 mb-2">
                {Array.from({ length: matchStats.totalMaps }, (_, i) => {
                  const map = matchStats.maps[i];
                  const isCompleted = map?.status === 'completed';
                  const isTeam1Win = isCompleted && map.team1Score > map.team2Score;
                  const isTeam2Win = isCompleted && map.team2Score > map.team1Score;
                  const isDraw = isCompleted && map.team1Score === map.team2Score;
                  
                  return (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isTeam1Win
                          ? 'bg-blue-600 text-white'
                          : isTeam2Win
                          ? 'bg-red-600 text-white'
                          : isDraw
                          ? 'bg-gray-500 text-white'
                          : i === matchStats.currentMapIndex
                          ? 'bg-yellow-400 text-gray-800 ring-2 ring-yellow-600'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}
                      title={`Map ${i + 1}${isCompleted ? ` - ${map.team1Score}:${map.team2Score}` : ''}`}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>
              
              {currentMapData.status !== 'completed' && (
                <button
                  onClick={completeCurrentMap}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 flex items-center gap-1 mx-auto"
                >
                  <CheckCircle className="w-4 h-4" />
                  Complete Map
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Player Stats Table */}
        <div className="flex-1 overflow-auto p-4 min-h-0">
          <div className="space-y-6">
            {/* Team 1 */}
            <div>
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {match?.team1?.name || 'Team 1'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Player</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Hero</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">E</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">A</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">K/D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">DMG</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">HEAL</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">BLK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortPlayersByRole(playerStats.team1)
                      .filter(player => player.name && player.name.trim() !== '')  // Filter out empty placeholders
                      .map((player, index) => {
                        const originalIndex = playerStats.team1.findIndex(p => p.playerId === player.playerId);
                        return renderPlayerRow(player, 'team1', originalIndex);
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Team 2 */}
            <div>
              <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {match?.team2?.name || 'Team 2'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Player</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Hero</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">E</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">A</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">K/D</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">DMG</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">HEAL</th>
                      <th className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">BLK</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortPlayersByRole(playerStats.team2)
                      .filter(player => player.name && player.name.trim() !== '')  // Filter out empty placeholders
                      .map((player, index) => {
                        const originalIndex = playerStats.team2.findIndex(p => p.playerId === player.playerId);
                        return renderPlayerRow(player, 'team2', originalIndex);
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SinglePageLiveScoring;