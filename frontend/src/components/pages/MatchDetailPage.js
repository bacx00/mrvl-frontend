import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getCountryFlag } from '../../utils/imageUtils';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import SinglePageLiveScoring from '../admin/SinglePageLiveScoring';
import HeroImage from '../shared/HeroImage';
import {
  GAME_MODES,
  PLAYER_STATS,
  MATCH_STATUSES,
  HEROES
} from '../../constants/marvelRivalsData';
import { subscribeMatchUpdates, subscribeLiveScoring } from '../../lib/pusher.ts';

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
  const [timerInterval, setTimerInterval] = useState(null);
  
  // 🔥 COMPREHENSIVE MATCH STATE - REAL-TIME SYNCHRONIZED
  const [liveScores, setLiveScores] = useState({ team1: null, team2: null });
  const [liveSeriesScores, setLiveSeriesScores] = useState({ team1: 0, team2: 0 });
  const [lastHeroChange, setLastHeroChange] = useState(null);
  const [lastStatUpdate, setLastStatUpdate] = useState(null);
  const [lastScoreUpdate, setLastScoreUpdate] = useState(null);
  const [lastProcessedEventId, setLastProcessedEventId] = useState(null);
  const [liveUpdateIndicator, setLiveUpdateIndicator] = useState(null);
  const [showLiveScoring, setShowLiveScoring] = useState(false);
  
  // Enhanced match data state
  const [matchData, setMatchData] = useState({
    teams: { team1: null, team2: null },
    event: null,
    schedule: null,
    format: 'BO3',
    status: 'upcoming',
    scores: { series: { team1: 0, team2: 0 }, maps: [] },
    urls: { streams: [], betting: [], vods: [] },
    live_data: { current_map: 1, timer: null, overtime: false, viewers: 0, hero_picks: [], live_updates: [] },
    player_stats: {},
    tournament: { round: null, bracket_position: null }
  });
  
  // ENHANCED: Timeline and event tracking
  const [matchTimeline, setMatchTimeline] = useState([]);
  const [killFeed, setKillFeed] = useState([]);
  const [objectiveUpdates, setObjectiveUpdates] = useState([]);
  const [headToHeadData, setHeadToHeadData] = useState(null);
  
  // Live update tracking
  const [heroSelections, setHeroSelections] = useState({});
  const [mapScores, setMapScores] = useState([]);
  const [currentMapTimer, setCurrentMapTimer] = useState({ minutes: 0, seconds: 0, phase: 'preparation' });
  const [liveEventStream, setLiveEventStream] = useState([]);
  const [playerPerformance, setPlayerPerformance] = useState({});
  
  const { user, isAuthenticated, api } = useAuth();
  
  // Auto-increment timer for live matches
  useEffect(() => {
    if (match?.status === 'live' && !isPreparationPhase) {
      const interval = setInterval(() => {
        setMatchTimer(prevTimer => {
          const [mins, secs] = prevTimer.split(':').map(Number);
          const totalSecs = mins * 60 + secs + 1;
          const newMins = Math.floor(totalSecs / 60);
          const newSecs = totalSecs % 60;
          return `${String(newMins).padStart(2, '0')}:${String(newSecs).padStart(2, '0')}`;
        });
      }, 1000);
      
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [match?.status, isPreparationPhase]);
  
  // 🔥 CRITICAL: FIXED BACKEND URL LOADING
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

  console.log('🔍 MatchDetailPage: Using backend URL:', BACKEND_URL);
  
  // Load match timeline
  const loadMatchTimeline = async () => {
    try {
      const response = await api.get(`/matches/${matchId}/timeline`);
      if (response?.data?.success) {
        setMatchTimeline(response.data.data || []);
        
        // Separate events by type
        const kills = response.data.data.filter(e => e.type === 'kill');
        const objectives = response.data.data.filter(e => e.type === 'objective');
        
        setKillFeed(kills.slice(0, 10)); // Last 10 kills
        setObjectiveUpdates(objectives);
      }
    } catch (error) {
      console.error('Error loading match timeline:', error);
    }
  };
  
  // Load head-to-head data
  const loadHeadToHead = async (team1Id, team2Id) => {
    if (!team1Id || !team2Id) return;
    
    try {
      const response = await api.get(`/matches/head-to-head/${team1Id}/${team2Id}`);
      if (response?.data?.success) {
        setHeadToHeadData(response.data.data);
      }
    } catch (error) {
      console.error('Error loading head-to-head data:', error);
    }
  };

  // Format time ago utility (VLR.gg style)
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInHours < 48) return 'Yesterday';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}mo`;
    
    return `${Math.floor(diffInMonths / 12)}y`;
  };

  // 🎮 SEASON 2.5 GAME MODES
  const gameModesData = GAME_MODES;

  const getGameModeTimer = (mode) => {
    const modeData = gameModesData[mode];
    if (!modeData) return { 
      timer: { preparation: 30 },
      name: mode || 'Unknown', 
      color: 'gray', 
      description: 'Unknown mode',
      icon: '❓'
    };
    
    // Calculate total duration based on mode type
    let duration = 900; // Default 15 minutes
    if (mode === 'Convoy') {
      duration = modeData.timer.baseTime + modeData.timer.checkpoint1 + modeData.timer.checkpoint2;
    } else if (mode === 'Convergence') {
      duration = modeData.timer.capturePhase + modeData.timer.escortPhase;
    } else if (mode === 'Domination') {
      duration = 12 * 60; // Average for best of 3
    }
    
    return {
      ...modeData,
      duration,
      color: mode === 'Convoy' ? 'blue' : mode === 'Domination' ? 'red' : 'purple'
    };
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
        
        // 🚨 ENHANCED: Use comprehensive match endpoint
        const apiResponse = await api.get(`/matches/${realMatchId}`);
        console.log('📥 Enhanced match response:', apiResponse);
        
        if (apiResponse?.success && apiResponse.data) {
          const responseData = apiResponse.data;
          
          // Update comprehensive match state
          setMatchData({
            teams: responseData.teams || { team1: null, team2: null },
            event: responseData.event || null,
            schedule: responseData.schedule || null,
            format: responseData.format || 'BO3',
            status: responseData.status || 'upcoming',
            scores: responseData.scores || { series: { team1: 0, team2: 0 }, maps: [] },
            // 🔥 ENHANCED: Handle URLs from comprehensive endpoint
            urls: {
              streams: responseData.stream_urls || (responseData.stream_url ? [responseData.stream_url] : []),
              betting: responseData.betting_urls || (responseData.betting_url ? [responseData.betting_url] : []),
              vods: responseData.vod_urls || []
            },
            live_data: responseData.live_data || { current_map: 1, timer: null, overtime: false, viewers: 0, hero_picks: [], live_updates: [] },
            player_stats: responseData.player_stats || {},
            tournament: { 
              round: responseData.round || null, 
              bracket_position: responseData.bracket_position || null 
            },
            meta: responseData.meta || {}
          });
          
          // Update legacy state for compatibility
          setMatch(responseData);
          
          // Update live state variables
          if (responseData.scores?.series) {
            setLiveSeriesScores({
              team1: responseData.scores.series.team1 || 0,
              team2: responseData.scores.series.team2 || 0
            });
          }
          
          // Update map scores
          if (responseData.scores?.maps) {
            setMapScores(responseData.scores.maps);
          }
          
          // Update hero selections
          if (responseData.live_data?.hero_picks) {
            setHeroSelections(responseData.live_data.hero_picks);
          }
          
          // Update timer - handle both new and legacy formats
          if (responseData.live_data?.timer) {
            setCurrentMapTimer(responseData.live_data.timer);
            const minutes = responseData.live_data.timer.minutes || 0;
            const seconds = responseData.live_data.timer.seconds || 0;
            setMatchTimer(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
          } else if (responseData.timer) {
            // Legacy format support
            setMatchTimer(responseData.timer);
          } else if (responseData.match_timer) {
            // Alternative format
            setMatchTimer(responseData.match_timer);
          }
          
          // Update player stats
          if (responseData.player_stats) {
            setPlayerPerformance(responseData.player_stats);
          }
          
          // ENHANCED: Load timeline for live/completed matches
          if (responseData.status === 'live' || responseData.status === 'completed') {
            loadMatchTimeline();
          }
          
          // ENHANCED: Load head-to-head data
          if (responseData.team1?.id && responseData.team2?.id) {
            loadHeadToHead(responseData.team1.id, responseData.team2.id);
          }
          
          console.log('✅ Enhanced match data loaded:', {
            matchId: realMatchId,
            format: responseData.format,
            status: responseData.status,
            seriesScore: responseData.scores?.series,
            mapCount: responseData.scores?.maps?.length || 0,
            currentMap: responseData.live_data?.current_map,
            hasTimer: !!responseData.live_data?.timer,
            heroPicksCount: Object.keys(responseData.live_data?.hero_picks || {}).length,
            playerStatsCount: Object.keys(responseData.player_stats || {}).length
          });
          
          // For backward compatibility, extract team compositions
          const matchData = responseData;
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
            console.log('Maps_data failed, trying root level compositions...');
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
            console.log('Maps_data failed, trying fallback sources...');
            
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
              team1Players = matchData.teams.team1?.roster || matchData.teams.team1?.players || [];
              team2Players = matchData.teams.team2?.roster || matchData.teams.team2?.players || [];
              console.log('✅ Using teams structure players:', {
                team1Count: team1Players.length,
                team2Count: team2Players.length
              });
            }
            // Try scoreboard structure
            else if (matchData.scoreboard) {
              team1Players = matchData.scoreboard.team1?.roster || matchData.scoreboard.team1?.players || [];
              team2Players = matchData.scoreboard.team2?.roster || matchData.scoreboard.team2?.players || [];
              console.log('✅ Using scoreboard structure players:', {
                team1Count: team1Players.length,
                team2Count: team2Players.length
              });
            }
          }
          
          // Calculate total maps for series
          const totalMaps = matchData.format === 'BO3' ? 3 : matchData.format === 'BO5' ? 5 : 1;
          
          // 🎮 IMPROVED GAME MODE DETECTION - Use parsed data
          let currentGameMode = 'Domination'; // Default fallback
          if (parsedMapsData && parsedMapsData[matchData.current_map_index || 0]) {
            const currentMapData = parsedMapsData[matchData.current_map_index || 0];
            currentGameMode = currentMapData.mode || currentMapData.game_mode || currentGameMode;
            console.log('Game mode from parsed maps_data:', currentGameMode);
          } else if (matchData.current_mode) {
            currentGameMode = matchData.current_mode;
            console.log('Game mode from current_mode field:', currentGameMode);
          }
          
          console.log('Final game mode detected:', currentGameMode);
          
          // Update live timer state - handle multiple formats
          if (matchData.live_timer) {
            setMatchTimer(matchData.live_timer);
          } else if (matchData.timer) {
            setMatchTimer(matchData.timer);
          } else if (matchData.match_timer) {
            setMatchTimer(matchData.match_timer);
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
            currentMap: parsedMapsData?.[matchData.current_map_index || 0]?.name || 
                       parsedMapsData?.[matchData.current_map_index || 0]?.map_name || 
                       matchData.current_map || 
                       'Unknown Map',
            gameMode: currentGameMode,
            viewers: matchData.viewer_count || 0,
            totalMaps: totalMaps,
            // 🔥 ENHANCED: Multiple URLs support - use comprehensive data if available
            stream_urls: matchData.stream_urls || (matchData.stream_url ? [matchData.stream_url] : []),
            betting_urls: matchData.betting_urls || (matchData.betting_url ? [matchData.betting_url] : []),
            vod_urls: matchData.vod_urls || [],
            round: matchData.round || null,
            bracket_position: matchData.bracket_position || null,
            timer: matchData.timer || '00:00',
            timer_running: matchData.timer_running || false,
            
            // Teams from live-scoreboard response with better field mapping
            team1: {
              id: matchData.team1?.id || matchData.team1_id,
              name: matchData.team1?.name || matchData.team1_name || 'Team 1',
              logo: matchData.team1?.logo || matchData.teams?.team1?.logo || '',
              players: matchData.team1?.roster || team1Players
            },
            team2: {
              id: matchData.team2?.id || matchData.team2_id, 
              name: matchData.team2?.name || matchData.team2_name || 'Team 2',
              logo: matchData.team2?.logo || matchData.teams?.team2?.logo || '',
              players: matchData.team2?.roster || team2Players
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
                    country_flag: player.country_flag || player.flag,
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
                    country_flag: player.country_flag || player.flag,
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
      }, 1000); // Poll every second for live matches to show timer updates
    }

    // 🔥 ENHANCED CROSS-TAB SYNC - LISTEN FOR ALL ADMIN UPDATES
    const handleMatchUpdate = (event) => {
      const { detail } = event;
      const currentMatchId = getMatchId();
      
      console.log('MatchDetailPage: Sync event received:', {
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
        
        console.log('MatchDetailPage: Processing real-time update:', {
          type: detail.type,
          hasMatchData: !!detail.matchData,
          timestamp: detail.timestamp,
          eventId,
          matchDataKeys: detail.matchData ? Object.keys(detail.matchData) : []
        });
        
        // Handle different types of updates with IMMEDIATE RESPONSE and ERROR HANDLING
        try {
          console.log('ENTERING SWITCH STATEMENT for type:', detail.type);
          
          
          switch (detail.type) {
            case 'SCORE_UPDATE':
              console.log('Score update received - IMMEDIATE UPDATE', detail);
              
              // 🔥 IMMEDIATE LIVE SCORES UPDATE (like timer)
              if (detail.overallScores) {
                const team1Score = detail.overallScores.team1 || detail.overallScores[0] || 0;
                const team2Score = detail.overallScores.team2 || detail.overallScores[1] || 0;
                
                console.log(`IMMEDIATE: Setting live scores to Team1=${team1Score}, Team2=${team2Score}`);
                console.log(`BEFORE UPDATE: liveScores was:`, liveScores);
                
                // 🔥 FORCE STATE UPDATE AND RE-RENDER
                setLiveScores({ team1: team1Score, team2: team2Score });
                setRefreshTrigger(prev => prev + 1); // Force re-render
                
                console.log(`AFTER UPDATE: liveScores should be Team1=${team1Score}, Team2=${team2Score}`);
                
                setLastScoreUpdate({ 
                  team1: team1Score, 
                  team2: team2Score, 
                  timestamp: Date.now(),
                  mapIndex: detail.mapIndex 
                });
              }
              
              // 🔥 FALLBACK: Try to extract scores from matchData if overallScores missing
              else if (detail.matchData) {
                const team1Score = detail.matchData.team1_score || detail.matchData.team1Score || 0;
                const team2Score = detail.matchData.team2_score || detail.matchData.team2Score || 0;
                
                console.log(`FALLBACK: Setting live scores from matchData Team1=${team1Score}, Team2=${team2Score}`);
                setLiveScores({ team1: team1Score, team2: team2Score });
                setRefreshTrigger(prev => prev + 1); // Force re-render
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
                console.log('Setting match data from SCORE_UPDATE:', detail.matchData);
                setMatch(detail.matchData);
                setRefreshTrigger(prev => prev + 1); // Force re-render
              }
              
              // PRIORITY 2: Update overall scores immediately
              if (detail.overallScores) {
                console.log('Updating overall scores:', detail.overallScores);
                // Handle different score data structures
                const team1Score = detail.overallScores.team1 || detail.overallScores[0] || 0;
                const team2Score = detail.overallScores.team2 || detail.overallScores[1] || 0;
                
                setMatch(prev => prev ? {
                  ...prev,
                  team1_score: team1Score,
                  team2_score: team2Score,
                  lastUpdated: Date.now()
                } : prev);
                
                console.log(`Scores updated to: Team1=${team1Score}, Team2=${team2Score}`);
              }
              
              // PRIORITY 3: Handle map-level score updates for immediate feedback
              if (detail.mapScore !== undefined && detail.teamNumber && detail.mapIndex !== undefined) {
                console.log(`Map score update: Team ${detail.teamNumber} = ${detail.mapScore} on map ${detail.mapIndex + 1}`);
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
              console.log('SCORE_UPDATE processing completed');
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
              console.log('Timer update received - IMMEDIATE UPDATE:', detail);
              if (detail.timer !== undefined) {
                setMatchTimer(detail.timer);
              }
              if (detail.isRunning !== undefined) {
                // Update visual timer state immediately
                console.log('Timer running state:', detail.isRunning);
              }
              // NO BACKEND FETCH for timer updates - use event data only
              console.log('TIMER update processing completed - returning early');
              return; // Don't fetch backend data for timer updates
              
            case 'MAP_ADVANCE':
              console.log('Map advance received - IMMEDIATE UPDATE');
              if (detail.newMapIndex !== undefined) {
                setCurrentMapIndex(detail.newMapIndex);
              }
              console.log('MAP_ADVANCE processing completed');
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
          
          console.log('SWITCH STATEMENT completed, proceeding to background refresh check');
          
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
      console.log(`MatchDetailPage: CustomEvent ${event.type} received, calling handleMatchUpdate`);
      console.log(`Event detail:`, event.detail);
      console.log(`Current match ID:`, getMatchId());
      
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
      
      console.log(`Event validation passed, calling handleMatchUpdate`);
      handleMatchUpdate(event);
      console.log(`handleMatchUpdate call completed for ${event.type}`);
    };
    
    eventTypes.forEach(eventType => {
      console.log(`MatchDetailPage: Registering listener for ${eventType}`);
      window.addEventListener(eventType, customEventHandler);
    });
    
    console.log('MatchDetailPage: All event listeners registered for match:', getMatchId());
    
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

    // 🔥 PUSHER REAL-TIME SUBSCRIPTIONS
    let matchChannel = null;
    let scoringChannel = null;
    
    if (matchId) {
      console.log('📡 Setting up Pusher subscriptions for match:', matchId);
      
      // Subscribe to match-specific updates
      matchChannel = subscribeMatchUpdates(String(matchId), (data) => {
        console.log('📡 Pusher match update:', data);
        
        // Handle different event types
        if (data.type === 'score-updated') {
          setLiveScores({ team1: data.team1_score, team2: data.team2_score });
          setRefreshTrigger(prev => prev + 1);
        } else if (data.type === 'map-started' || data.type === 'map-ended') {
          fetchMatchData(false); // Refresh match data
        } else if (data.type === 'player-stats-updated') {
          setLastStatUpdate(data);
        } else if (data.type === 'hero-swap') {
          setLastHeroChange(data);
        } else if (data.type === 'match.map.transition') {
          // Handle map transition
          console.log('🗺️ Map transition:', data);
          setCurrentMapIndex(data.map_number - 1);
          fetchMatchData(false); // Refresh match data to get new map info
        } else if (data.type === 'match.started') {
          // Handle match start
          console.log('🏁 Match started:', data);
          fetchMatchData(false);
        }
        
      });
      
      // Subscribe to live scoring updates
      scoringChannel = subscribeLiveScoring(String(matchId), {
        onScoreUpdate: (data) => {
          console.log('📡 Live score update:', data);
          setLiveScores({ team1: data.team1_score, team2: data.team2_score });
          if (data.series_scores) {
            setLiveSeriesScores(data.series_scores);
          }
        },
        onPlayerStatUpdate: (data) => {
          console.log('📡 Player stat update:', data);
          setLastStatUpdate(data);
        },
        onMapUpdate: (data) => {
          console.log('📡 Map update:', data);
          if (data.current_map_index !== undefined) {
            setCurrentMapIndex(data.current_map_index);
          }
        },
        onEventLog: (data) => {
          console.log('📡 Event log:', data);
          setLiveEventStream(prev => [...prev.slice(-50), data]); // Keep last 50 events
          
          // ENHANCED: Update timeline in real-time
          if (data.type === 'kill') {
            setKillFeed(prev => [data, ...prev].slice(0, 10));
          } else if (data.type === 'objective') {
            setObjectiveUpdates(prev => [data, ...prev].slice(0, 5));
          }
          
          // Add to overall timeline
          setMatchTimeline(prev => [data, ...prev].slice(0, 100));
        }
      });
    }
    
    return () => {
      // Cleanup polling interval
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      
      // Cleanup Pusher subscriptions
      if (matchChannel) {
        matchChannel.unbind_all();
        matchChannel.unsubscribe();
      }
      if (scoringChannel) {
        scoringChannel.unbind_all();
        scoringChannel.unsubscribe();
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

  // Render comment function (VLR.gg style)
  const renderComment = (comment, isReply = false, depth = 0) => {
    const maxDepth = 3; // Limit nesting depth for readability
    const shouldShowReplies = comment.replies && comment.replies.length > 0 && depth < maxDepth;
    
    return (
      <div 
        key={comment.id}
        className={`${
          isReply ? `ml-${Math.min(depth * 4 + 4, 16)} pl-4 border-l-2 border-gray-200 dark:border-gray-700` : ''
        } py-4 ${depth > 0 ? 'bg-gray-50/50 dark:bg-gray-800/50 rounded-r-lg' : ''}`}
      >
        <div className="flex space-x-4">
          {/* Voting */}
          <div className="flex-shrink-0">
            <VotingButtons
              itemType="match_comment"
              itemId={comment.id}
              parentId={getMatchId()}
              initialUpvotes={comment.votes?.upvotes || comment.upvotes || 0}
              initialDownvotes={comment.votes?.downvotes || comment.downvotes || 0}
              userVote={comment.user_vote}
              direction="vertical"
              size="sm"
            />
          </div>

          {/* Comment Content */}
          <div className="flex-1 min-w-0">
            {/* User Info Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <UserDisplay
                  user={comment.user}
                  showAvatar={true}
                  showHeroFlair={true}
                  showTeamFlair={true}
                  size="sm"
                  clickable={true}
                  navigateTo={navigateTo}
                />
                <span className="text-sm text-gray-500 dark:text-gray-500">
                  {formatTimeAgo(comment.created_at)}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-gray-400 dark:text-gray-600">
                    (edited {formatTimeAgo(comment.updated_at)})
                  </span>
                )}
              </div>

              {/* Comment Actions */}
              <div className="flex items-center space-x-2">
                {isAuthenticated && (
                  <button
                    onClick={() => setReplyingTo(comment)}
                    className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Reply
                  </button>
                )}
                {(comment.user?.id === user?.id) && (
                  <button
                    className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            {/* Comment Content */}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {comment.content.split('\n').map((paragraph, index) => (
                <p key={index} className="mb-2 last:mb-0">
                  {paragraph.split(/(@\w+)/).map((part, partIndex) => 
                    part.startsWith('@') ? (
                      <span key={partIndex} className="text-red-600 dark:text-red-400 font-medium cursor-pointer hover:underline">
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </p>
              ))}
            </div>

            {/* Reply Form */}
            {replyingTo?.id === comment.id && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // TODO: Implement reply submission
                  console.log('Reply to comment:', comment.id, replyText);
                  setReplyingTo(null);
                  setReplyText('');
                }}>
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Replying to @{comment.user?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-none"
                    rows="3"
                    required
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Reply
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Nested Replies */}
            {shouldShowReplies && (
              <div className="mt-4">
                <div className="text-xs text-gray-500 dark:text-gray-500 mb-2 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                  {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                </div>
                {comment.replies.map(reply => renderComment(reply, true, depth + 1))}
              </div>
            )}
            
            {/* Show collapsed replies indicator if max depth reached */}
            {comment.replies && comment.replies.length > 0 && depth >= maxDepth && (
              <div className="mt-3 ml-4">
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  View {comment.replies.length} more {comment.replies.length === 1 ? 'reply' : 'replies'}...
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
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
    team1Players: (currentMap.team1Composition || match?.team1?.roster || match?.team1?.players || []).map(p => ({
      ...p,
      name: p.name || p.real_name || p.player_name || p.username || `Player ${p.player_id || p.id}`,
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    })),
    team2Players: (currentMap.team2Composition || match?.team2?.roster || match?.team2?.players || []).map(p => ({
      ...p,
      name: p.name || p.real_name || p.player_name || p.username || `Player ${p.player_id || p.id}`, 
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    }))
  } : {
    map_name: match?.currentMap || 'Unknown Map',
    mode: match?.gameMode || 'Unknown Mode',
    timer: getGameModeTimer(match?.gameMode || 'Domination'),
    team1Players: (match?.team1?.roster || match?.team1?.players || []).map(p => ({
      ...p,
      name: p.name || p.real_name || p.player_name || p.username || `Player ${p.player_id || p.id}`,
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    })),
    team2Players: (match?.team2?.roster || match?.team2?.players || []).map(p => ({
      ...p,
      name: p.name || p.real_name || p.player_name || p.username || `Player ${p.player_id || p.id}`,
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
           match.format === 'BO5' ? 'Best of 5' :
           match.format === 'BO7' ? 'Best of 7' :
           match.format === 'BO9' ? 'Best of 9' : 'Best of 1'} • {match.currentMap || match.maps?.[currentMapIndex]?.mapName || 'Current Map'}
        </div>
        
        {/* 🔥 ENHANCED: Tournament Context */}
        {(match.round || match.bracket_position) && (
          <div className="mt-2 text-center">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
              <span>🏆</span>
              <span>
                {match.round && match.bracket_position 
                  ? `${match.round} - ${match.bracket_position}`
                  : match.round || match.bracket_position}
              </span>
            </div>
          </div>
        )}
        
        {/* GAME MODE & TIMER INFO */}
        <div className="mt-2 flex justify-center items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}>
            {match.gameMode || match.maps?.[currentMapIndex]?.mode || 'Domination'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Match Duration: {Math.floor((match.maps?.[currentMapIndex]?.timer?.duration || 720) / 60)}m
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
        
        
        {/* 🔥 ENHANCED: Multiple URLs Action Buttons */}
        <div className="mt-6 space-y-4">
          {/* Stream URLs - Show even if only single URL field exists */}
          {((match.stream_urls && match.stream_urls.length > 0 && match.stream_urls.some(url => url)) || match.stream_url) && (
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📺 Live Streams</div>
              <div className="flex justify-center flex-wrap gap-2">
                {(match.stream_urls || (match.stream_url ? [match.stream_url] : [])).filter(url => url).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <span>📺</span>
                    <span>Stream {index + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Betting URLs - Show even if only single URL field exists */}
          {((match.betting_urls && match.betting_urls.length > 0 && match.betting_urls.some(url => url)) || match.betting_url) && (
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💰 Betting Sites</div>
              <div className="flex justify-center flex-wrap gap-2">
                {(match.betting_urls || (match.betting_url ? [match.betting_url] : [])).filter(url => url).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <span>💰</span>
                    <span>Betting {index + 1}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* VOD URLs - Show even if only single URL field exists */}
          {((match.vod_urls && match.vod_urls.length > 0 && match.vod_urls.some(url => url)) || match.vod_url) && (
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">🎬 Video on Demand</div>
              <div className="flex justify-center flex-wrap gap-2">
                {(match.vod_urls || (match.vod_url ? [match.vod_url] : [])).filter(url => url).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <span>🎬</span>
                    <span>VOD {index + 1}</span>
                  </a>
                ))}
              </div>
            </div>
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
              <h2 
                className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2 cursor-pointer hover:underline"
                onClick={() => navigateTo && navigateTo('team-detail', match.team1?.id)}
              >
                {match.team1?.name}
              </h2>
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                {liveScores.team1 !== null ? liveScores.team1 : (match.team1_score || 0)}
              </div>
              {liveScores.team1 !== null && (
                <div className="text-xs text-green-500 animate-pulse">
                  🔴 LIVE: {liveScores.team1}
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-3xl text-gray-500 dark:text-gray-500">VS</div>
            </div>
            
            <div className="text-center">
              <h2 
                className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2 cursor-pointer hover:underline"
                onClick={() => navigateTo && navigateTo('team-detail', match.team2?.id)}
              >
                {match.team2?.name}
              </h2>
              <div className="text-4xl font-bold text-red-600 dark:text-red-400">
                {liveScores.team2 !== null ? liveScores.team2 : (match.team2_score || 0)}
              </div>
              {liveScores.team2 !== null && (
                <div className="text-xs text-green-500 animate-pulse">
                  🔴 LIVE: {liveScores.team2}
                </div>
              )}
            </div>
          </div>
          
          {/* Map Status Indicators - Clickable */}
          <div className="flex justify-center space-x-2">
            {match.maps.map((map, index) => (
              <button
                key={index}
                onClick={() => setCurrentMapIndex(index)}
                className={`px-3 py-1 rounded text-sm cursor-pointer transition-all ${
                  index === currentMapIndex ? 'bg-yellow-600 text-white ring-2 ring-yellow-400' :
                  map.status === 'completed' ? 'bg-green-600 text-white hover:bg-green-700' :
                  'bg-gray-300 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              >
                Map {index + 1}
                {map.status === 'completed' && (
                  <span className="ml-1">
                    {map.team1Score > map.team2Score ? '(T1)' : '(T2)'}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CURRENT MAP SCORE DISPLAY (for BO1 or single map view) */}
      {match.totalMaps === 1 && (
        <div className="bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 rounded-lg p-8">
          <div className="flex items-center justify-center space-x-8">
            <div className="text-center">
              <h2 
                className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2 cursor-pointer hover:underline"
                onClick={() => navigateTo && navigateTo('team-detail', match.team1?.id)}
              >
                {match.team1?.name}
              </h2>
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
                {liveScores.team1 !== null ? liveScores.team1 : (match.maps?.[0]?.team1Score || match.team1_score || 0)}
              </div>
              {liveScores.team1 !== null && (
                <div className="text-xs text-green-500 animate-pulse mt-2">
                  🔴 LIVE ROUND: {liveScores.team1}
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-4xl text-gray-500 dark:text-gray-500">VS</div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {match.gameMode || match.maps?.[0]?.mode || 'Domination'}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {match.currentMap || match.maps?.[0]?.mapName || 'Current Map'}
              </div>
            </div>
            
            <div className="text-center">
              <h2 
                className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2 cursor-pointer hover:underline"
                onClick={() => navigateTo && navigateTo('team-detail', match.team2?.id)}
              >
                {match.team2?.name}
              </h2>
              <div className="text-6xl font-bold text-red-600 dark:text-red-400">
                {liveScores.team2 !== null ? liveScores.team2 : (match.maps?.[0]?.team2Score || match.team2_score || 0)}
              </div>
              {liveScores.team2 !== null && (
                <div className="text-xs text-green-500 animate-pulse mt-2">
                  🔴 LIVE ROUND: {liveScores.team2}
                </div>
              )}
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
            
            {/* Live Scoring Button for Admins */}
            {user && (user.role === 'admin' || user.role === 'moderator') && (
              <button
                onClick={() => setShowLiveScoring(!showLiveScoring)}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <span className="text-lg mr-2">{showLiveScoring ? '❌' : '🎮'}</span>
                <span className="font-semibold">{showLiveScoring ? 'Close Live Scoring' : 'Live Scoring'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Scoring Interface - Render as modal outside of page content */}

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
              <div 
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                onClick={() => navigateTo && navigateTo('team-detail', match.team1?.id)}
              >
                {match.team1?.name || 'Team 1'}
              </div>
            </div>
            <div className="space-y-1">
              {currentMapData.team1Players.map((player, index) => (
                <div key={player.id || index} className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {/* Player Info */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center" title={`Country: ${player.country || player.nationality || 'Unknown'}`}>
                      <span className="text-lg">{player.country_flag || getCountryFlag(player.country || player.nationality || 'Unknown')}</span>
                    </div>
                    <div 
                      className="font-medium text-blue-600 dark:text-blue-400 text-sm cursor-pointer hover:underline"
                      onClick={() => navigateTo && navigateTo('player-detail', player.id || player.player_id)}
                    >
                      {player.name}
                    </div>
                  </div>
                  
                  {/* Hero Image */}
                  <div className="flex justify-center">
                    <HeroImage 
                      heroName={player.hero || player.current_hero || player.main_hero || player.heroName || player.hero_name}
                      size="md"
                      showRole={false}
                    />
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
              <div 
                className="text-sm font-semibold text-red-600 dark:text-red-400 cursor-pointer hover:underline"
                onClick={() => navigateTo && navigateTo('team-detail', match.team2?.id)}
              >
                {match.team2?.name || 'Team 2'}
              </div>
            </div>
            <div className="space-y-1">
              {currentMapData.team2Players.map((player, index) => (
                <div key={player.id || index} className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  {/* Player Info */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center" title={`Country: ${player.country || player.nationality || 'Unknown'}`}>
                      <span className="text-lg">{player.country_flag || getCountryFlag(player.country || player.nationality || 'Unknown')}</span>
                    </div>
                    <div 
                      className="font-medium text-blue-600 dark:text-blue-400 text-sm cursor-pointer hover:underline"
                      onClick={() => navigateTo && navigateTo('player-detail', player.id || player.player_id)}
                    >
                      {player.name}
                    </div>
                  </div>
                  
                  {/* Hero Image */}
                  <div className="flex justify-center">
                    <HeroImage 
                      heroName={player.hero || player.current_hero || player.main_hero || player.heroName || player.hero_name}
                      size="md"
                      showRole={false}
                    />
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

      {/* ENHANCED: Match Timeline Section */}
      {(match.status === 'live' || match.status === 'completed') && matchTimeline.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>📊</span>
            <span>Match Timeline</span>
          </h3>
          
          <div className="space-y-4">
            {/* Kill Feed */}
            {killFeed.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Eliminations</h4>
                <div className="space-y-2">
                  {killFeed.map((kill, index) => {
                    const killData = kill.data || {};
                    return (
                      <div key={kill.id || index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-green-600 dark:text-green-400">
                            {killData.killer?.hero || 'Unknown'} 
                          </span>
                          <span className="text-gray-500">eliminated</span>
                          <span className="text-sm font-medium text-red-600 dark:text-red-400">
                            {killData.victim?.hero || 'Unknown'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {kill.game_time ? `${Math.floor(kill.game_time / 60)}:${(kill.game_time % 60).toString().padStart(2, '0')}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Objective Updates */}
            {objectiveUpdates.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Objective Progress</h4>
                <div className="space-y-2">
                  {objectiveUpdates.map((objective, index) => (
                    <div key={objective.id || index} className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <div className="text-sm">
                        <span className="font-medium">{objective.data?.type || 'Objective'}</span>
                        {objective.data?.progress && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400">
                            {objective.data.progress}% captured
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* ENHANCED: Head-to-Head History */}
      {headToHeadData && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
            <span>📈</span>
            <span>Head-to-Head History</span>
          </h3>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {headToHeadData.team1_wins || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {match.team1?.name} Wins
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-500">
                {headToHeadData.total_matches || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Matches
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {headToHeadData.team2_wins || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {match.team2?.name} Wins
              </div>
            </div>
          </div>
          
          {headToHeadData.recent_matches && headToHeadData.recent_matches.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Matches</h4>
              <div className="space-y-2">
                {headToHeadData.recent_matches.slice(0, 3).map((match, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <span className={match.winner_id === match.team1_id ? 'font-bold text-green-600' : 'text-gray-600'}>
                        {match.score.team1}
                      </span>
                      <span className="text-gray-500">-</span>
                      <span className={match.winner_id === match.team2_id ? 'font-bold text-green-600' : 'text-gray-600'}>
                        {match.score.team2}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {formatTimeAgo(match.date)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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

        {/* Comments List - VLR.gg Style */}
        {commentsLoading ? (
          <div className="text-center py-8">
            <div className="text-gray-600 dark:text-gray-400">Loading comments...</div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-0">
            {comments.map(comment => (
              <div key={comment.id} className="card border-t-0 first:border-t">
                {renderComment(comment, false, 0)}
              </div>
            ))}
          </div>
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
      
      {/* Single Page Live Scoring - Render outside of page content */}
      {showLiveScoring && (
        <SinglePageLiveScoring
          isOpen={showLiveScoring}
          match={match}
          onClose={() => setShowLiveScoring(false)}
          onUpdate={() => {
            setRefreshTrigger(prev => prev + 1);
          }}
        />
      )}
    </div>
  );
}

export default MatchDetailPage;