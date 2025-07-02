import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getHeroImageSync, getHeroRole } from '../../utils/imageUtils';

function MatchDetailPage({ matchId, navigateTo }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [userVotes, setUserVotes] = useState({});
  const [matchTimer, setMatchTimer] = useState('00:00');
  const [isPreparationPhase, setIsPreparationPhase] = useState(false);
  const [preparationTimer, setPreparationTimer] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // 🔥 LIVE UPDATES STATE - IMMEDIATE LIKE TIMER (no complex data structures)
  const [liveScores, setLiveScores] = useState({ team1: null, team2: null });
  const [liveSeriesScores, setLiveSeriesScores] = useState({ team1: 0, team2: 0 });
  const [lastHeroChange, setLastHeroChange] = useState(null);
  const [lastStatUpdate, setLastStatUpdate] = useState(null);
  const [lastScoreUpdate, setLastScoreUpdate] = useState(null);
  const [lastProcessedEventId, setLastProcessedEventId] = useState(null);
  const [liveUpdateIndicator, setLiveUpdateIndicator] = useState(null);
  
  const { user, isAuthenticated, api } = useAuth();
  
  // 🔥 CRITICAL: FIXED BACKEND URL LOADING
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

  console.log('🔍 MatchDetailPage: Using backend URL:', BACKEND_URL);

  // 🎮 COMPLETE MARVEL RIVALS GAME MODES
  const gameModesData = {
    'Convoy': { 
      duration: 18 * 60, 
      displayName: 'Convoy', 
      color: 'blue', 
      description: 'Escort the payload to victory',
      icon: '🚚'
    },
    'Domination': { 
      duration: 12 * 60, 
      displayName: 'Domination', 
      color: 'red', 
      description: 'Control strategic points',
      icon: '🏁'
    },
    'Convergence': { 
      duration: 15 * 60, 
      displayName: 'Convergence', 
      color: 'purple', 
      description: 'Converge on objectives',
      icon: '⚡'
    },
    'Conquest': { 
      duration: 20 * 60, 
      displayName: 'Conquest', 
      color: 'green', 
      description: 'Capture and hold territory',
      icon: '💎'
    },
    'Doom Match': { 
      duration: 10 * 60, 
      displayName: 'Doom Match', 
      color: 'orange', 
      description: 'Eliminate all opponents',
      icon: '💀'
    },
    'Escort': { 
      duration: 16 * 60, 
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

  // 🚨 CRITICAL: EXTRACT MATCH ID FROM URL OR PROPS
  const getMatchId = () => {
    if (matchId) {
      console.log('🔍 MatchDetailPage: Match ID from props:', matchId);
      return matchId;
    }
    
    const urlParts = window.location.pathname.split('/');
    const matchDetailIndex = urlParts.findIndex(part => part === 'match-detail');
    if (matchDetailIndex !== -1 && urlParts[matchDetailIndex + 1]) {
      const idFromUrl = urlParts[matchDetailIndex + 1];
      console.log('🔍 MatchDetailPage: Match ID from URL:', idFromUrl);
      return idFromUrl;
    }
    
    if (window.location.hash) {
      const hashParts = window.location.hash.split('/');
      const matchDetailIndex = hashParts.findIndex(part => part === 'match-detail');
      if (matchDetailIndex !== -1 && hashParts[matchDetailIndex + 1]) {
        const idFromHash = hashParts[matchDetailIndex + 1];
        console.log('🔍 MatchDetailPage: Match ID from hash:', idFromHash);
        return idFromHash;
      }
    }
    
    console.error('❌ MatchDetailPage: No match ID found in props, URL, or hash');
    return null;
  };

  // 🔥 ENHANCED REAL-TIME SYNC SYSTEM - LISTEN FOR ALL ADMIN UPDATES
  useEffect(() => {
    const fetchMatchData = async (showLoading = true) => {
      const realMatchId = getMatchId();
      
      if (!realMatchId) {
        console.error('❌ No match ID provided');
        if (showLoading) setLoading(false);
        return;
      }

      try {
        console.log('🔍 MatchDetailPage: Fetching match data for ID:', realMatchId);
        
        if (!BACKEND_URL || BACKEND_URL === 'undefined') {
          throw new Error('Backend URL is not configured properly');
        }
        
        // 🚨 CRITICAL FIX: Use correct API endpoint
        const apiResponse = await api.get(`/matches/${realMatchId}/live-scoreboard`);
        console.log('📥 Live scoreboard response:', apiResponse);
        
        if (apiResponse?.success && apiResponse.data) {
          const matchData = apiResponse.data;
          let team1Players = [];
          let team2Players = [];
          
          // Parse maps_data with better handling for JSON strings and arrays
          console.log('🔍 Raw API Response - maps_data:', matchData.maps_data);
          console.log('🔍 Raw API Response - maps_data type:', typeof matchData.maps_data);
          
          let parsedMapsData = null;
          
          // Handle maps_data as JSON string or array
          if (matchData.maps_data) {
            if (typeof matchData.maps_data === 'string') {
              try {
                parsedMapsData = JSON.parse(matchData.maps_data);
                console.log('✅ Parsed maps_data from JSON string:', parsedMapsData);
              } catch (error) {
                console.error('❌ Error parsing maps_data JSON:', error);
                parsedMapsData = null;
              }
            } else if (Array.isArray(matchData.maps_data)) {
              parsedMapsData = matchData.maps_data;
              console.log('✅ Using maps_data array directly:', parsedMapsData);
            }
          }
          
          if (parsedMapsData && Array.isArray(parsedMapsData) && parsedMapsData.length > 0) {
            const currentMapData = parsedMapsData[matchData.current_map_index || 0];
            console.log('🔍 Current map data:', currentMapData);
            
            if (currentMapData) {
              team1Players = currentMapData.team1_composition || [];
              team2Players = currentMapData.team2_composition || [];
              
              console.log('✅ Parsed team compositions from maps_data:', {
                team1Count: team1Players.length,
                team2Count: team2Players.length,
                currentMapIndex: matchData.current_map_index || 0,
                mapName: currentMapData.name || currentMapData.map_name,
                gameMode: currentMapData.mode,
                team1Sample: team1Players[0],
                team2Sample: team2Players[0]
              });
            }
          }
          
          // 🚨 ENHANCED FALLBACK: If maps_data failed, try root level compositions
          if (!team1Players.length || !team2Players.length) {
            console.log('⚠️ Maps_data failed, trying root level compositions...');
            team1Players = matchData.team1_composition || [];
            team2Players = matchData.team2_composition || [];
            
            console.log('📋 Root level fallback result:', {
              team1Count: team1Players.length,
              team2Count: team2Players.length,
              team1Sample: team1Players[0],
              team2Sample: team2Players[0]
            });
          }
          
          // 🚨 ENHANCED FALLBACK: If maps_data failed, try other sources
          if (!team1Players.length || !team2Players.length) {
            console.log('⚠️ Maps_data failed, trying fallback sources...');
            
            // Try root level team compositions
            if (matchData.team1_composition && matchData.team2_composition) {
              team1Players = matchData.team1_composition || [];
              team2Players = matchData.team2_composition || [];
              console.log('✅ Using root level team compositions:', {
                team1Count: team1Players.length,
                team2Count: team2Players.length
              });
            }
            // Try teams structure
            else if (matchData.teams) {
              team1Players = matchData.teams.team1?.players || [];
              team2Players = matchData.teams.team2?.players || [];
              console.log('✅ Using teams structure players:', {
                team1Count: team1Players.length,
                team2Count: team2Players.length
              });
            }
            // Try scoreboard structure
            else if (matchData.scoreboard) {
              team1Players = matchData.scoreboard.team1?.players || [];
              team2Players = matchData.scoreboard.team2?.players || [];
              console.log('✅ Using scoreboard structure players:', {
                team1Count: team1Players.length,
                team2Count: team2Players.length
              });
            }
          }
          
          // Calculate total maps for series
          const totalMaps = matchData.format === 'BO3' ? 3 : matchData.format === 'BO5' ? 5 : 1;
          
          // 🎮 IMPROVED GAME MODE DETECTION
          let currentGameMode = 'Domination'; // Default fallback
          if (matchData.maps_data && matchData.maps_data[matchData.current_map_index || 0]) {
            const currentMapData = matchData.maps_data[matchData.current_map_index || 0];
            currentGameMode = currentMapData.mode || currentGameMode;
          }
          
          console.log('🎮 Game mode detected:', currentGameMode);
          
          // Update live timer state
          if (matchData.live_timer) {
            setMatchTimer(matchData.live_timer);
          }
          
          // Update preparation phase state
          if (matchData.is_preparation_phase !== undefined) {
            setIsPreparationPhase(matchData.is_preparation_phase);
          }
          
          if (matchData.preparation_timer !== undefined) {
            setPreparationTimer(matchData.preparation_timer);
          }
          
          // Update current map index
          if (matchData.current_map_index !== undefined) {
            setCurrentMapIndex(matchData.current_map_index);
          }
          
          const transformedMatch = {
            id: matchData.match_id || realMatchId,
            status: matchData.status || 'unknown',
            team1_score: matchData.team1_score || 0,
            team2_score: matchData.team2_score || 0,
            format: matchData.format || 'BO1',
            currentMap: matchData.current_map || matchData.maps_data?.[0]?.name || 'Unknown Map',
            gameMode: matchData.current_mode || matchData.maps_data?.[0]?.mode || 'Unknown Mode',
            viewers: matchData.viewer_count || 0,
            totalMaps: totalMaps,
            stream_url: matchData.stream_url,
            betting_url: matchData.betting_url,
            timer: matchData.timer || '00:00',
            timer_running: matchData.timer_running || false,
            
            // Teams from live-scoreboard response with better field mapping
            team1: {
              id: matchData.team1_id,
              name: matchData.team1_name || 'Team 1',
              logo: matchData.teams?.team1?.logo || '',
              players: team1Players
            },
            team2: {
              id: matchData.team2_id, 
              name: matchData.team2_name || 'Team 2',
              logo: matchData.teams?.team2?.logo || '',
              players: team2Players
            },
            
            // Enhanced maps structure for BO1/BO3/BO5 - Use parsed data
            maps: Array.from({ length: totalMaps }, (_, index) => {
              // Use the parsed map data if available
              const mapData = parsedMapsData?.[index];
              const isCurrentMap = index === (matchData.current_map_index || 0);
              
              if (mapData) {
                return {
                  mapNumber: index + 1,
                  mapName: mapData.name || mapData.map_name || `Map ${index + 1}`,
                  mode: mapData.mode || 'Domination',
                  status: isCurrentMap ? matchData.status : (mapData.status || 'upcoming'),
                  team1Score: mapData.team1_score || 0,
                  team2Score: mapData.team2_score || 0,
                  timer: getGameModeTimer(mapData.mode || 'Domination'),
                  team1Composition: (mapData.team1_composition || []).map(player => ({
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
                    damageBlocked: player.damage_blocked || player.blocked || 0
                  })),
                  team2Composition: (mapData.team2_composition || []).map(player => ({
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
                    damageBlocked: player.damage_blocked || player.blocked || 0
                  }))
                };
              } else {
                // Fallback for maps without data
                return {
                  mapNumber: index + 1,
                  mapName: `Map ${index + 1}`,
                  mode: 'TBD',
                  status: 'upcoming',
                  team1Score: 0,
                  team2Score: 0,
                  timer: getGameModeTimer('Domination'),
                  team1Composition: [],
                  team2Composition: []
                };
              }
            }),
            
            // Timer and other data
            currentRound: matchData.current_round,
            activeTimers: matchData.active_timers || []
          };
          
          console.log('✅ MatchDetailPage: Transformed match data:', transformedMatch);
          setMatch(transformedMatch);
          
        } else {
          console.error('❌ Failed to load match data:', apiResponse);
          setMatch(null);
        }
        
      } catch (error) {
        console.error('❌ MatchDetailPage: Error fetching match data:', error);
        
        if (error.name === 'SyntaxError' && error.message.includes('Unexpected token')) {
          console.error('🚨 Received HTML instead of JSON - check backend URL and API endpoint');
          console.error('🔗 Current backend URL:', BACKEND_URL);
        }
        
        setMatch(null);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchMatchData();

    // 🔄 POLLING FOR LIVE MATCHES - Update every 2 seconds for live matches
    let pollInterval;
    if (match?.status === 'live') {
      pollInterval = setInterval(() => {
        fetchMatchData(false); // Silent refresh
      }, 2000);
    }

    // 🔥 ENHANCED CROSS-TAB SYNC - LISTEN FOR ALL ADMIN UPDATES
    const handleMatchUpdate = (event) => {
      const { detail } = event;
      const currentMatchId = getMatchId();
      
      console.log('🔥 MatchDetailPage: Sync event received:', {
        eventType: event.type,
        detailType: detail.type,
        eventMatchId: detail.matchId,
        currentMatchId: currentMatchId,
        currentMatchIdType: typeof currentMatchId,
        eventMatchIdType: typeof detail.matchId,
        willProcess: detail.matchId == currentMatchId,
        strictEquality: detail.matchId === currentMatchId,
        fullDetail: detail
      });
      
      // ✅ IMPROVED MATCH ID COMPARISON - HANDLE STRING/NUMBER MISMATCH
      const matchesId = detail.matchId == currentMatchId || 
                       detail.matchId === currentMatchId ||
                       String(detail.matchId) === String(currentMatchId);
      
      if (matchesId) {
        // 🔥 PREVENT DUPLICATE EVENT PROCESSING
        const eventId = `${detail.type}-${detail.timestamp}-${detail.matchId}`;
        if (lastProcessedEventId === eventId) {
          console.log('🚫 Skipping duplicate event:', eventId);
          return;
        }
        setLastProcessedEventId(eventId);
        
        console.log('🔥 MatchDetailPage: Processing real-time update:', {
          type: detail.type,
          hasMatchData: !!detail.matchData,
          timestamp: detail.timestamp,
          eventId,
          matchDataKeys: detail.matchData ? Object.keys(detail.matchData) : []
        });
        
        // Handle different types of updates with IMMEDIATE RESPONSE and ERROR HANDLING
        try {
          console.log('🔥 ENTERING SWITCH STATEMENT for type:', detail.type);
          
          // 🚨 SHOW LIVE UPDATE INDICATOR
          setLiveUpdateIndicator({
            type: detail.type,
            timestamp: Date.now(),
            message: getUpdateMessage(detail.type)
          });
          
          // Clear indicator after 3 seconds
          setTimeout(() => setLiveUpdateIndicator(null), 3000);
          
          switch (detail.type) {
            case 'SCORE_UPDATE':
              console.log('🏆 Score update received - IMMEDIATE UPDATE', detail);
              
              // 🔥 IMMEDIATE LIVE SCORES UPDATE (like timer)
              if (detail.overallScores) {
                const team1Score = detail.overallScores.team1 || detail.overallScores[0] || 0;
                const team2Score = detail.overallScores.team2 || detail.overallScores[1] || 0;
                
                console.log(`🏆 IMMEDIATE: Setting live scores to Team1=${team1Score}, Team2=${team2Score}`);
                console.log(`🏆 BEFORE UPDATE: liveScores was:`, liveScores);
                setLiveScores({ team1: team1Score, team2: team2Score });
                console.log(`🏆 AFTER UPDATE: liveScores should be Team1=${team1Score}, Team2=${team2Score}`);
                
                setLastScoreUpdate({ 
                  team1: team1Score, 
                  team2: team2Score, 
                  timestamp: Date.now(),
                  mapIndex: detail.mapIndex 
                });
              }
              
              // Also update series scores if provided
              if (detail.seriesScores) {
                setLiveSeriesScores({ 
                  team1: detail.seriesScores.team1 || 0, 
                  team2: detail.seriesScores.team2 || 0 
                });
              }
              
              // PRIORITY 1: Update match data immediately if provided
              if (detail.matchData) {
                console.log('🏆 Setting match data from SCORE_UPDATE:', detail.matchData);
                setMatch(detail.matchData);
                setRefreshTrigger(prev => prev + 1); // Force re-render
              }
              
              // PRIORITY 2: Update overall scores immediately
              if (detail.overallScores) {
                console.log('🏆 Updating overall scores:', detail.overallScores);
                // Handle different score data structures
                const team1Score = detail.overallScores.team1 || detail.overallScores[0] || 0;
                const team2Score = detail.overallScores.team2 || detail.overallScores[1] || 0;
                
                setMatch(prev => prev ? {
                  ...prev,
                  team1_score: team1Score,
                  team2_score: team2Score,
                  lastUpdated: Date.now()
                } : prev);
                
                console.log(`🏆 Scores updated to: Team1=${team1Score}, Team2=${team2Score}`);
              }
              
              // PRIORITY 3: Handle map-level score updates for immediate feedback
              if (detail.mapScore !== undefined && detail.teamNumber && detail.mapIndex !== undefined) {
                console.log(`🗺️ Map score update: Team ${detail.teamNumber} = ${detail.mapScore} on map ${detail.mapIndex + 1}`);
                setMatch(prev => {
                  if (!prev || !prev.maps || !prev.maps[detail.mapIndex]) return prev;
                  
                  const updatedMaps = [...prev.maps];
                  const mapToUpdate = { ...updatedMaps[detail.mapIndex] };
                  
                  if (detail.teamNumber === 1) {
                    mapToUpdate.team1Score = detail.mapScore;
                  } else if (detail.teamNumber === 2) {
                    mapToUpdate.team2Score = detail.mapScore;
                  }
                  
                  updatedMaps[detail.mapIndex] = mapToUpdate;
                  
                  return {
                    ...prev,
                    maps: updatedMaps,
                    lastUpdated: Date.now()
                  };
                });
              }
              console.log('🏆 SCORE_UPDATE processing completed');
              break;
              
            case 'HERO_CHANGE':
              console.log('🦸 Hero change received - IMMEDIATE UPDATE:', detail);
              
              // 🔥 IMMEDIATE HERO CHANGE UPDATE (like timer)
              if (detail.hero && detail.playerName) {
                console.log(`🦸 IMMEDIATE: ${detail.playerName} → ${detail.hero} (${detail.role})`);
                setLastHeroChange({
                  playerName: detail.playerName,
                  hero: detail.hero,
                  role: detail.role,
                  team: detail.team,
                  mapIndex: detail.mapIndex,
                  timestamp: Date.now()
                });
              }
              
              // PRIORITY 1: Update match data immediately if provided
              if (detail.matchData) {
                console.log('🦸 Setting match data from HERO_CHANGE:', detail.matchData);
                setMatch(detail.matchData);
                setRefreshTrigger(prev => prev + 1); // Force re-render
              }
              
              // PRIORITY 2: Handle specific hero change for immediate feedback
              if (detail.hero && detail.playerName && detail.mapIndex !== undefined) {
                console.log(`🦸 Player ${detail.playerName} changed to ${detail.hero} (${detail.role}) on ${detail.team}`);
                setMatch(prev => {
                  if (!prev || !prev.maps || !prev.maps[detail.mapIndex]) return prev;
                  
                  const updatedMaps = [...prev.maps];
                  const mapToUpdate = { ...updatedMaps[detail.mapIndex] };
                  const playersKey = detail.team === 'team1' ? 'team1Players' : 'team2Players';
                  
                  if (mapToUpdate[playersKey] && mapToUpdate[playersKey][detail.playerIndex]) {
                    const updatedPlayers = [...mapToUpdate[playersKey]];
                    updatedPlayers[detail.playerIndex] = {
                      ...updatedPlayers[detail.playerIndex],
                      hero: detail.hero,
                      role: detail.role
                    };
                    mapToUpdate[playersKey] = updatedPlayers;
                    updatedMaps[detail.mapIndex] = mapToUpdate;
                    
                    return {
                      ...prev,
                      maps: updatedMaps,
                      lastUpdated: Date.now()
                    };
                  }
                  
                  return prev;
                });
              }
              console.log('🦸 HERO_CHANGE processing completed');
              break;
              
            case 'STAT_UPDATE':
              console.log('📊 Stat update received - IMMEDIATE UPDATE');
              
              // 🔥 IMMEDIATE STAT UPDATE (like timer)
              if (detail.playerName && detail.statName && detail.value !== undefined) {
                console.log(`📊 IMMEDIATE: ${detail.playerName} ${detail.statName} = ${detail.value}`);
                setLastStatUpdate({
                  playerName: detail.playerName,
                  statName: detail.statName,
                  value: detail.value,
                  team: detail.team,
                  mapIndex: detail.mapIndex,
                  timestamp: Date.now()
                });
              }
              
              if (detail.matchData) {
                console.log('📊 Setting match data from STAT_UPDATE:', detail.matchData);
                setMatch(detail.matchData);
                setRefreshTrigger(prev => prev + 1); // Force re-render
              }
              console.log('📊 STAT_UPDATE processing completed');
              break;
              
            case 'TIMER_START':
            case 'TIMER_PAUSE':
            case 'TIMER_RESET':
            case 'TIMER_UPDATE':
              console.log('⏱️ Timer update received - IMMEDIATE UPDATE:', detail);
              if (detail.timer !== undefined) {
                setMatchTimer(detail.timer);
              }
              if (detail.isRunning !== undefined) {
                // Update visual timer state immediately
                console.log('⏱️ Timer running state:', detail.isRunning);
              }
              // NO BACKEND FETCH for timer updates - use event data only
              console.log('⏱️ TIMER update processing completed - returning early');
              return; // Don't fetch backend data for timer updates
              
            case 'MAP_ADVANCE':
              console.log('🗺️ Map advance received - IMMEDIATE UPDATE');
              if (detail.newMapIndex !== undefined) {
                setCurrentMapIndex(detail.newMapIndex);
              }
              console.log('🗺️ MAP_ADVANCE processing completed');
              break;
              
            case 'PREPARATION_PHASE':
              console.log('⏳ Preparation phase update - IMMEDIATE UPDATE');
              setIsPreparationPhase(detail.isPreparation || false);
              setPreparationTimer(detail.preparationTimer || 0);
              console.log('⏳ PREPARATION_PHASE processing completed');
              break;
              
            case 'PRODUCTION_SAVE':
              console.log('💾 Production save completed - FULL REFRESH');
              if (detail.matchData) {
                setMatch(detail.matchData);
                setRefreshTrigger(prev => prev + 1);
              }
              console.log('💾 PRODUCTION_SAVE processing completed');
              break;
              
            case 'TEST_SYNC':
            case 'TEST_FROM_PUBLIC':
              console.log('🧪 Test sync received - DEBUG EVENT:', detail);
              if (detail.matchData) {
                console.log('🧪 Test match data:', detail.matchData);
              }
              console.log('🧪 TEST processing completed');
              break;
              
            default:
              console.log('🔄 General update received - IMMEDIATE UPDATE', detail);
              if (detail.matchData) {
                console.log('🔄 Setting match data from DEFAULT case:', detail.matchData);
                setMatch(detail.matchData);
                setRefreshTrigger(prev => prev + 1);
              }
              console.log('🔄 DEFAULT case processing completed');
          }
          
          console.log('🔥 SWITCH STATEMENT completed, proceeding to background refresh check');
          
          // For non-timer updates, also fetch fresh data for consistency (silently)
          // BUT for SCORE_UPDATE, delay the refresh to let real-time update show first
          if (detail.type !== 'TIMER_START' && detail.type !== 'TIMER_PAUSE' && 
              detail.type !== 'TIMER_RESET' && detail.type !== 'TIMER_UPDATE') {
            
            if (detail.type === 'SCORE_UPDATE') {
              // Delay background refresh for score updates to show immediate changes first
              setTimeout(() => {
                console.log('🔄 Delayed refresh after SCORE_UPDATE for consistency');
                fetchMatchData(false); // Silent refresh after delay
              }, 2000); // 2 second delay
            } else {
              console.log('🔄 Fetching fresh data after non-timer update');
              fetchMatchData(false); // Immediate silent refresh for other updates
            }
          }
        } catch (error) {
          console.error('❌ Error processing sync event:', error, detail);
        }
      } else {
        console.log('🚫 MatchDetailPage: Event ignored - Match ID mismatch:', {
          eventMatchId: detail.matchId,
          currentMatchId: currentMatchId
        });
      }
    };

    // Listen for ALL possible sync events with proper event handling
    const eventTypes = [
      'mrvl-match-updated',
      'mrvl-hero-updated', 
      'mrvl-stats-updated',
      'mrvl-score-updated',
      'mrvl-timer-updated',
      'mrvl-data-refresh'
    ];
    
    // 🔥 FIX: Ensure handleMatchUpdate is properly called for CustomEvents
    const customEventHandler = (event) => {
      console.log(`🎧 MatchDetailPage: CustomEvent ${event.type} received, calling handleMatchUpdate`);
      console.log(`🎧 Event detail:`, event.detail);
      console.log(`🎧 Current match ID:`, getMatchId());
      
      // 🔥 CRITICAL: Verify the event has the proper structure
      if (!event.detail) {
        console.error('❌ CustomEvent missing detail property!', event);
        return;
      }
      
      if (!event.detail.matchId) {
        console.error('❌ CustomEvent detail missing matchId!', event.detail);
        return;
      }
      
      if (!event.detail.type) {
        console.error('❌ CustomEvent detail missing type!', event.detail);
        return;
      }
      
      console.log(`🎧 Event validation passed, calling handleMatchUpdate`);
      handleMatchUpdate(event);
      console.log(`🎧 handleMatchUpdate call completed for ${event.type}`);
    };
    
    eventTypes.forEach(eventType => {
      console.log(`🎧 MatchDetailPage: Registering listener for ${eventType}`);
      window.addEventListener(eventType, customEventHandler);
    });
    
    console.log('🎧 MatchDetailPage: All event listeners registered for match:', getMatchId());
    
    // 🧪 TEST: Dispatch a test event to verify listener setup
    setTimeout(() => {
      console.log('🧪 MatchDetailPage: Dispatching test event to verify listeners...');
      console.log('🧪 Current match ID for testing:', getMatchId());
      
      // Test multiple event types to verify they all work
      const testEvents = [
        { type: 'mrvl-match-updated', eventType: 'TEST_FROM_PUBLIC' },
        { type: 'mrvl-score-updated', eventType: 'SCORE_UPDATE' },
        { type: 'mrvl-stats-updated', eventType: 'STAT_UPDATE' },
        { type: 'mrvl-hero-updated', eventType: 'HERO_CHANGE' }
      ];
      
      testEvents.forEach((test, index) => {
        setTimeout(() => {
          console.log(`🧪 Testing ${test.type} with type ${test.eventType}`);
          window.dispatchEvent(new CustomEvent(test.type, {
            detail: {
              matchId: getMatchId(),
              type: test.eventType,
              timestamp: Date.now(),
              message: `Testing if MatchDetailPage can receive ${test.type} events`,
              testData: true
            }
          }));
        }, index * 500); // Stagger the tests
      });
    }, 2000);
    
    // 🔍 DIAGNOSTIC: Log when ANY event is received (even non-matching match IDs)
    const diagnosticHandler = (event) => {
      console.log('🔍 DIAGNOSTIC: Raw event received:', {
        eventType: event.type,
        detail: event.detail,
        currentMatchId: getMatchId(),
        timestamp: new Date().toISOString()
      });
    };
    
    eventTypes.forEach(eventType => {
      window.addEventListener(eventType, diagnosticHandler);
    });

    // 🚨 ENHANCED LOCALSTORAGE SYNC WITH BETTER MATCH ID HANDLING
    const handleStorageChange = (event) => {
      console.log('🔄 STORAGE EVENT DETECTED:', {
        key: event.key,
        newValue: event.newValue ? event.newValue.substring(0, 100) + '...' : null,
        oldValue: event.oldValue ? event.oldValue.substring(0, 100) + '...' : null,
        currentMatchId: getMatchId(),
        timestamp: new Date().toISOString()
      });
      
      // Listen for both standard keys AND unique event keys AND event-specific keys
      const isRelevantKey = event.key === 'mrvl-match-sync' || 
                           event.key === `mrvl-match-${getMatchId()}` ||
                           event.key === 'mrvl-timer-sync' ||
                           event.key === 'mrvl-hero-sync' ||
                           event.key === 'mrvl-score-sync' ||
                           event.key === 'mrvl-stat-sync' ||
                           event.key === 'mrvl-save-sync' ||
                           (event.key && event.key.startsWith('mrvl-match-sync-'));
      
      if (isRelevantKey && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          console.log('🔄 PARSED STORAGE SYNC DATA:', {
            syncMatchId: syncData.matchId,
            currentMatchId: getMatchId(),
            syncType: syncData.type,
            willProcess: String(syncData.matchId) === String(getMatchId()),
            eventKey: event.key
          });
          
          // 🚨 IMPROVED MATCH ID COMPARISON
          const currentMatchId = getMatchId();
          const matchIdMatches = String(syncData.matchId) === String(currentMatchId) || 
                                parseInt(syncData.matchId) === parseInt(currentMatchId);
          
          if (matchIdMatches && syncData.type) {
            console.log('🔄 Storage sync detected and processing:', syncData);
            handleMatchUpdate({ detail: syncData });
            
            // Clean up unique keys after processing to prevent localStorage bloat
            if (event.key.startsWith('mrvl-match-sync-') && event.key !== 'mrvl-match-sync') {
              setTimeout(() => {
                try {
                  localStorage.removeItem(event.key);
                  console.log('🧹 Cleaned up unique key:', event.key);
                } catch (error) {
                  console.warn('⚠️ Could not clean up key:', event.key, error);
                }
              }, 3000); // Clean up after 3 seconds
            }
          } else {
            console.log('🚫 Storage sync ignored - match ID mismatch or missing type:', {
              syncMatchId: syncData.matchId,
              currentMatchId: currentMatchId,
              hasType: !!syncData.type
            });
          }
        } catch (error) {
          console.error('❌ Error parsing storage sync data:', error, event.newValue);
        }
      } else {
        console.log('🔍 Storage event for different key or no value:', event.key);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // 🧪 TEST: Verify localStorage listener is working
    setTimeout(() => {
      console.log('🧪 TESTING: localStorage listener setup...');
      console.log('🧪 Current localStorage items:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('mrvl-match')) {
          console.log(`🧪   ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
        }
      }
      
      // Test localStorage change detection
      const testKey = `mrvl-match-test-${Date.now()}`;
      console.log('🧪 TESTING: Triggering test localStorage change...');
      localStorage.setItem(testKey, JSON.stringify({
        matchId: getMatchId(),
        type: 'TEST_STORAGE',
        message: 'Testing localStorage cross-tab communication',
        timestamp: Date.now()
      }));
      
      // Clean up test
      setTimeout(() => localStorage.removeItem(testKey), 5000);
    }, 3000);
    
    // 🧪 TEST: Verify localStorage listener is working
    setTimeout(() => {
      console.log('🧪 TESTING: localStorage listener setup...');
      console.log('🧪 Current localStorage items:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('mrvl-match')) {
          console.log(`🧪   ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
        }
      }
      
      // Test localStorage change detection
      const testKey = `mrvl-match-test-${Date.now()}`;
      console.log('🧪 TESTING: Triggering test localStorage change...');
      localStorage.setItem(testKey, JSON.stringify({
        matchId: getMatchId(),
        type: 'TEST_STORAGE',
        message: 'Testing localStorage cross-tab communication',
        timestamp: Date.now()
      }));
      
      // Clean up test
      setTimeout(() => localStorage.removeItem(testKey), 5000);
    }, 3000);
    
    // 🧪 TEST: Verify localStorage listener is working
    setTimeout(() => {
      console.log('🧪 TESTING: localStorage listener setup...');
      console.log('🧪 Current localStorage items:');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('mrvl-match')) {
          console.log(`🧪   ${key}: ${localStorage.getItem(key)?.substring(0, 100)}...`);
        }
      }
      
      // Test localStorage change detection
      const testKey = `mrvl-match-test-${Date.now()}`;
      console.log('🧪 TESTING: Triggering test localStorage change...');
      localStorage.setItem(testKey, JSON.stringify({
        matchId: getMatchId(),
        type: 'TEST_STORAGE',
        message: 'Testing localStorage cross-tab communication',
        timestamp: Date.now()
      }));
      
      // Clean up test
      setTimeout(() => localStorage.removeItem(testKey), 5000);
    }, 3000);

    return () => {
      // Cleanup polling interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      eventTypes.forEach(eventType => {
        window.removeEventListener(eventType, customEventHandler);
        window.removeEventListener(eventType, diagnosticHandler);
      });
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [matchId, api, refreshTrigger, BACKEND_URL]);

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

  // Helper function to get update messages
  const getUpdateMessage = (type) => {
    const messages = {
      'SCORE_UPDATE': '🏆 Score Updated',
      'HERO_CHANGE': '🦸 Hero Changed',
      'STAT_UPDATE': '📊 Stats Updated',
      'TIMER_UPDATE': '⏱️ Timer Updated',
      'PRODUCTION_SAVE': '💾 Data Saved',
      'MAP_ADVANCE': '🗺️ Next Map',
      'PREPARATION_PHASE': '⏳ Prep Phase'
    };
    return messages[type] || '🔄 Live Update';
  };

  // Load comments using API helper
  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    const currentMatchId = getMatchId();
    if (!currentMatchId) return;
    
    setCommentsLoading(true);
    try {
      const response = await api.get(`/matches/${currentMatchId}/comments`);
      const commentsData = response?.data || [];
      setComments(Array.isArray(commentsData) ? commentsData : []);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) return;
    
    setSubmittingComment(true);
    try {
      const currentMatchId = getMatchId();
      const response = await api.post(`/matches/${currentMatchId}/comments`, {
        content: newComment
      });
      
      if (response?.data) {
        setComments(prev => [response.data, ...prev]);
        setNewComment('');
      }
    } catch (error) {
      console.error('❌ Error submitting comment:', error);
      alert('Error submitting comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">⚔️</div>
          <p className="text-gray-600 dark:text-gray-400">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Match Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The match you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigateTo && navigateTo('matches')}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ← Back to Matches
          </button>
        </div>
      </div>
    );
  }

  // Use current map data - fixed to match backend structure
  const currentMap = match?.maps?.[currentMapIndex] || match?.maps?.[0] || null;
  const currentMapData = currentMap ? {
    map_name: currentMap.mapName || match?.currentMap || 'Unknown Map',
    mode: currentMap.mode || match?.gameMode || 'Unknown Mode',
    timer: currentMap.timer || getGameModeTimer(currentMap.mode || match?.gameMode || 'Domination'),
    team1Players: (currentMap.team1Composition || match?.team1?.players || []).map(p => ({
      ...p,
      name: p.name || p.player_name || p.username || `Player ${p.player_id || p.id}`,
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    })),
    team2Players: (currentMap.team2Composition || match?.team2?.players || []).map(p => ({
      ...p,
      name: p.name || p.player_name || p.username || `Player ${p.player_id || p.id}`, 
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    }))
  } : {
    map_name: match?.currentMap || 'Unknown Map',
    mode: match?.gameMode || 'Unknown Mode',
    timer: getGameModeTimer(match?.gameMode || 'Domination'),
    team1Players: (match?.team1?.players || []).map(p => ({
      ...p,
      name: p.name || p.player_name || p.username || `Player ${p.player_id || p.id}`,
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    })),
    team2Players: (match?.team2?.players || []).map(p => ({
      ...p,
      name: p.name || p.player_name || p.username || `Player ${p.player_id || p.id}`,
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    }))
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={() => navigateTo && navigateTo('matches')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            ← Back to Matches
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {match.team1?.name} vs {match.team2?.name}
          </h1>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            match.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
            match.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
          }`}>
            {match.status === 'live' ? '🔴 LIVE' : 
             match.status === 'completed' ? '✅ COMPLETED' : 
             '⏳ ' + (match.status || 'UPCOMING').toUpperCase()}
          </div>
        </div>
        
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {match.format === 'BO1' ? 'Best of 1' : 
           match.format === 'BO3' ? 'Best of 3' :
           match.format === 'BO5' ? 'Best of 5' : 'Best of 1'} • {currentMapData?.map_name}
        </div>
        
        {/* GAME MODE & TIMER INFO */}
        <div className="mt-2 flex justify-center items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentMapData.timer.color}-100 text-${currentMapData.timer.color}-800 dark:bg-${currentMapData.timer.color}-900/20 dark:text-${currentMapData.timer.color}-400`}>
            {currentMapData?.mode || 'Unknown Mode'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Match Duration: {Math.floor(currentMapData.timer.duration / 60)}m
          </div>
        </div>
        
        {/* PREPARATION PHASE DISPLAY */}
        {isPreparationPhase && preparationTimer > 0 && (
          <div className="mt-4 flex justify-center">
            <div className="bg-orange-600 text-white px-6 py-2 rounded-lg font-mono text-xl font-bold animate-pulse">
              ⏳ PREP PHASE • {preparationTimer}s
            </div>
          </div>
        )}
        
        {/* LIVE MATCH TIMER */}
        {match.status === 'live' && !isPreparationPhase && (
          <div className="mt-4 flex justify-center">
            <div className="bg-red-600 text-white px-6 py-2 rounded-lg font-mono text-xl font-bold animate-pulse">
              🔴 LIVE • {matchTimer}
            </div>
          </div>
        )}
        
        {/* LIVE UPDATE INDICATOR */}
        {liveUpdateIndicator && (
          <div className="mt-4 flex justify-center">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold animate-bounce shadow-lg">
              {liveUpdateIndicator.message}
            </div>
          </div>
        )}
        
        {/* ACTION BUTTONS - Stream, Betting, V/D */}
        <div className="mt-6 flex justify-center space-x-4">
          {/* Stream Button */}
          {match.stream_url && (
            <a
              href={match.stream_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>📺</span>
              <span>Watch Stream</span>
            </a>
          )}
          
          {/* V/D Button */}
          <button
            onClick={() => {
              alert('Victory/Defeat tracking enabled');
            }}
            className="flex items-center space-x-2 px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
          >
            <span>📊</span>
            <span>V/D Stats</span>
          </button>
          
          {/* Betting Button */}
          {match.betting_url && (
            <a
              href={match.betting_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              <span>💰</span>
              <span>Place Bets</span>
            </a>
          )}
        </div>
      </div>

      {/* SERIES PROGRESS FOR BO3/BO5 */}
      {match.totalMaps > 1 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
          <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-4">
            🏆 Series Progress (First to {Math.ceil(match.totalMaps / 2)})
          </h3>
          <div className="flex items-center justify-center space-x-8 mb-4">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">{match.team1?.name}</h2>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {liveScores.team1 !== null ? liveScores.team1 : (currentMap?.team1Score || match.team1_score || 0)}
              </div>
              {lastScoreUpdate && (
                <div className="text-xs text-green-500 animate-pulse">
                  Live: {lastScoreUpdate.team1}
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-3xl text-gray-500 dark:text-gray-500">VS</div>
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">{match.team2?.name}</h2>
              <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                {liveScores.team2 !== null ? liveScores.team2 : (currentMap?.team2Score || match.team2_score || 0)}
              </div>
              {lastScoreUpdate && (
                <div className="text-xs text-green-500 animate-pulse">
                  Live: {lastScoreUpdate.team2}
                </div>
              )}
            </div>
          </div>
          
          {/* Map Status Indicators */}
          <div className="flex justify-center space-x-2">
            {match.maps.map((map, index) => (
              <div 
                key={index}
                className={`px-3 py-1 rounded text-sm ${
                  index === currentMapIndex ? 'bg-yellow-600 text-white' :
                  map.status === 'completed' ? 'bg-green-600 text-white' :
                  'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                }`}
              >
                Map {index + 1}
                {map.status === 'completed' && (
                  <span className="ml-1">
                    {map.team1Score > map.team2Score ? '(T1)' : '(T2)'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CURRENT MAP SCORE DISPLAY (for BO1 or single map view) */}
      {match.totalMaps === 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 rounded-lg p-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{match.team1?.name}</h2>
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">{currentMap?.team1Score || 0}</div>
            </div>
            
            <div className="text-center">
              <div className="text-4xl text-gray-500 dark:text-gray-500">VS</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {currentMapData?.mode || 'Domination'}
                </span>
              </div>
            </div>
            
            <div className="text-center">
              <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{match.team2?.name}</h2>
              <div className="text-6xl font-bold text-red-600 dark:text-red-400">{currentMap?.team2Score || 0}</div>
            </div>
          </div>
        </div>
      )}

      {/* MATCH STATISTICS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Match Statistics</h3>
          
          <div className="flex items-center space-x-4">
            {/* Live Update Status */}
            {(lastScoreUpdate || lastHeroChange || lastStatUpdate) && (
              <div className="text-sm text-green-600 dark:text-green-400">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Updates Active</span>
                </div>
                {lastScoreUpdate && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Last score: {new Date(lastScoreUpdate.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            )}
            
            {/* Admin Link */}
            {user && (user.role === 'admin' || user.role === 'moderator') && (
              <a
                href={`#admin-live-scoring/${match.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('🛠️ Navigating to admin scoring interface');
                  navigateTo && navigateTo('admin-live-scoring', { id: match.id });
                }}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="text-lg mr-2">🛠️</span>
                <span className="font-semibold">Admin Edit</span>
              </a>
            )}
          </div>
        </div>

        {/* Stats Table Header */}
        <div className="grid grid-cols-9 gap-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-700 dark:text-gray-300 text-sm">
          <div>Player</div>
          <div className="text-center">Heroes</div>
          <div className="text-center">E</div>
          <div className="text-center">D</div>
          <div className="text-center">A</div>
          <div className="text-center">K/D</div>
          <div className="text-center">DMG</div>
          <div className="text-center">HEAL</div>
          <div className="text-center">BLK</div>
        </div>

        {/* Team Statistics */}
        <div className="space-y-6 mt-6">
          {/* Team 1 Box */}
          <div className="border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800/50">
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">{match.team1?.name || 'Team 1'}</div>
            </div>
            <div className="space-y-1">
              {currentMapData.team1Players.map((player, index) => (
                <div key={player.id || index} className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {/* Player Info */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center" title={`Country: ${player.country}`}>
                      <img 
                        src={`https://flagcdn.com/24x18/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                        alt={`${player.country} flag`}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="w-6 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ display: 'none' }}
                        title={`${player.country || 'Unknown'} - Flag not available`}
                      >
                        {(player.country || 'US').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                      {player.name}
                    </div>
                  </div>
                  
                  {/* Hero with Enhanced Image System */}
                  <div className="flex justify-center">
                    <div className="relative w-10 h-10">
                      {getHeroImageWithFallback(player.hero || player.current_hero || player.main_hero) ? (
                        <img 
                          src={getHeroImageWithFallback(player.hero || player.current_hero || player.main_hero)}
                          alt={player.hero || player.current_hero || player.main_hero}
                          className="w-10 h-10 object-cover rounded border-2 border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* Enhanced Text Fallback */}
                      <div 
                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-center leading-tight text-white bg-gradient-to-br from-gray-600 to-gray-800 rounded border-2 border-gray-300 dark:border-gray-600 shadow-md"
                        style={{ display: getHeroImageWithFallback(player.hero || player.current_hero || player.main_hero) ? 'none' : 'flex' }}
                        title={`${player.hero || player.current_hero || player.main_hero || 'Unknown'} (${player.role}) - Image not available`}
                      >
                        <span className="text-center">
                          {(player.hero || player.current_hero || player.main_hero || 'Hero')
                            .replace(/[^a-zA-Z\s]/g, '')
                            .split(' ')
                            .map(word => word.charAt(0))
                            .join('')
                            .slice(0, 2)
                            .toUpperCase() || 'HE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  {['eliminations', 'deaths', 'assists'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {player[stat] || 0}
                      </span>
                    </div>
                  ))}
                  
                  <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                    {((player.eliminations || 0) / Math.max(player.deaths || 1, 1)).toFixed(2)}
                  </div>
                  
                  {['damage', 'healing', 'damageBlocked'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {stat === 'damage' || stat === 'healing' || stat === 'damageBlocked' ? 
                          ((player[stat] || 0) > 0 ? `${((player[stat] || 0) / 1000).toFixed(1)}k` : '-') :
                          (player[stat] || 0)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Team 2 Box */}
          <div className="border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800/50">
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">{match.team2?.name || 'Team 2'}</div>
            </div>
            <div className="space-y-1">
              {currentMapData.team2Players.map((player, index) => (
                <div key={player.id || index} className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {/* Player Info */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center" title={`Country: ${player.country}`}>
                      <img 
                        src={`https://flagcdn.com/24x18/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                        alt={`${player.country} flag`}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="w-6 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-sm flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ display: 'none' }}
                        title={`${player.country || 'Unknown'} - Flag not available`}
                      >
                        {(player.country || 'US').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                    <div className="font-medium text-blue-600 dark:text-blue-400 text-sm">
                      {player.name}
                    </div>
                  </div>
                  
                  {/* Hero with Enhanced Image System */}
                  <div className="flex justify-center">
                    <div className="relative w-10 h-10">
                      {getHeroImageWithFallback(player.hero || player.current_hero || player.main_hero) ? (
                        <img 
                          src={getHeroImageWithFallback(player.hero || player.current_hero || player.main_hero)}
                          alt={player.hero || player.current_hero || player.main_hero}
                          className="w-10 h-10 object-cover rounded border-2 border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* Enhanced Text Fallback */}
                      <div 
                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-center leading-tight text-white bg-gradient-to-br from-red-500 to-orange-600 rounded border-2 border-gray-300 dark:border-gray-600 shadow-md"
                        style={{ display: getHeroImageWithFallback(player.hero) ? 'none' : 'flex' }}
                        title={`${player.hero} (${player.role}) - Image not available`}
                      >
                        {(player.hero || 'Hero').split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  {['eliminations', 'deaths', 'assists'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {player[stat] || 0}
                      </span>
                    </div>
                  ))}
                  
                  <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                    {((player.eliminations || 0) / Math.max(player.deaths || 1, 1)).toFixed(2)}
                  </div>
                  
                  {['damage', 'healing', 'damageBlocked'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {stat === 'damage' || stat === 'healing' || stat === 'damageBlocked' ? 
                          ((player[stat] || 0) > 0 ? `${((player[stat] || 0) / 1000).toFixed(1)}k` : '-') :
                          (player[stat] || 0)
                        }
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* MATCH COMMENTS SECTION */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <span>💬</span>
          <span>Match Comments ({comments.length})</span>
        </h3>

        {/* Comment Input */}
        {isAuthenticated ? (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{user?.avatar || "🦸"}</div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts about this match..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                  rows="3"
                />
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Posting as {user?.name}
                  </div>
                  <button
                    onClick={submitComment}
                    disabled={!newComment.trim() || submittingComment}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submittingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-3">Sign in to join the discussion</p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('mrvl-show-auth-modal'))}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Sign In to Comment
            </button>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4">
          {commentsLoading ? (
            <div className="text-center py-8">
              <div className="text-gray-600 dark:text-gray-400">Loading comments...</div>
            </div>
          ) : comments.length > 0 ? (
            comments.map(comment => (
              <div key={comment.id} className="flex items-start space-x-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-xl">{comment.user_avatar || "👤"}</div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {comment.user_name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(comment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                  
                  {/* Voting System */}
                  <div className="flex items-center space-x-4 mt-3">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // TODO: Implement upvote functionality
                          console.log('Upvote comment:', comment.id);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-green-600">👍</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{comment.upvotes || 0}</span>
                      </button>
                      <button
                        onClick={() => {
                          // TODO: Implement downvote functionality
                          console.log('Downvote comment:', comment.id);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-red-600">👎</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{comment.downvotes || 0}</span>
                      </button>
                    </div>
                    
                    {/* Reply Button */}
                    <button
                      onClick={() => {
                        // TODO: Implement reply functionality
                        console.log('Reply to comment:', comment.id);
                      }}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No comments yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {isAuthenticated 
                  ? 'Be the first to share your thoughts about this match!'
                  : 'Sign in to be the first to comment on this match!'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchDetailPage;