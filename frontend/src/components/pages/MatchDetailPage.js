import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getCountryFlag } from '../../utils/imageUtils';
import UserDisplay from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import SinglePageLiveScoring from '../admin/SinglePageLiveScoring';
import HeroImage from '../shared/HeroImage';
import MentionAutocomplete from '../shared/MentionAutocomplete';
import MentionLink from '../shared/MentionLink';
import { processContentWithMentions } from '../../utils/mentionUtils';
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
  const [selectedMentions, setSelectedMentions] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingComment, setEditingComment] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [userVotes, setUserVotes] = useState({});
  const [isPreparationPhase, setIsPreparationPhase] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
    live_data: { current_map: 1, overtime: false, viewers: 0, hero_picks: [], live_updates: [] },
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
  const [liveEventStream, setLiveEventStream] = useState([]);
  const [playerPerformance, setPlayerPerformance] = useState({});
  
  const { user, isAuthenticated, api, isAdmin, isModerator } = useAuth();

  // Helper function to extract domain name from URL
  const getDomainFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      let domain = urlObj.hostname;
      
      // Remove 'www.' prefix if present
      if (domain.startsWith('www.')) {
        domain = domain.substring(4);
      }
      
      // Special handling for common platforms
      if (domain.includes('twitch.tv')) return 'Twitch';
      if (domain.includes('youtube.com') || domain.includes('youtu.be')) return 'YouTube';
      if (domain.includes('kick.com')) return 'Kick';
      if (domain.includes('bet365.com')) return 'Bet365';
      if (domain.includes('draftkings.com')) return 'DraftKings';
      if (domain.includes('fanduel.com')) return 'FanDuel';
      if (domain.includes('betway.com')) return 'Betway';
      
      // For other domains, return the main domain name
      const parts = domain.split('.');
      if (parts.length >= 2) {
        return parts[parts.length - 2].charAt(0).toUpperCase() + parts[parts.length - 2].slice(1);
      }
      
      return domain;
    } catch (error) {
      return 'Link';
    }
  };

  // Extract channel/username from streaming URLs
  const getStreamChannelName = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // Twitch: https://twitch.tv/channelname
      if (urlObj.hostname.includes('twitch.tv')) {
        const channel = pathname.split('/').filter(p => p)[0];
        return channel ? channel.charAt(0).toUpperCase() + channel.slice(1) : 'Twitch';
      }
      
      // YouTube: various formats
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        // Handle different YouTube URL formats
        if (pathname.includes('/channel/')) {
          return 'YouTube Channel';
        } else if (pathname.includes('/c/')) {
          const channel = pathname.split('/c/')[1]?.split('/')[0];
          return channel || 'YouTube';
        } else if (pathname.includes('/@')) {
          const channel = pathname.split('/@')[1]?.split('/')[0];
          return channel || 'YouTube';
        } else if (pathname.includes('/watch')) {
          return 'YouTube Stream';
        }
        return 'YouTube';
      }
      
      // Kick: https://kick.com/channelname
      if (urlObj.hostname.includes('kick.com')) {
        const channel = pathname.split('/').filter(p => p)[0];
        return channel ? channel.charAt(0).toUpperCase() + channel.slice(1) : 'Kick';
      }
      
      // Default: use domain name
      return getDomainFromUrl(url);
    } catch (error) {
      console.error('Error parsing stream URL:', error);
      return 'Stream';
    }
  };

  // Get appropriate display name for any URL type
  const getUrlDisplayName = (url, type = 'stream') => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      const pathname = urlObj.pathname;
      
      // For streaming URLs, use the channel name
      if (type === 'stream') {
        return getStreamChannelName(url);
      }
      
      // For betting URLs, show the betting site name
      if (type === 'betting') {
        if (hostname.includes('bet365')) return 'Bet365';
        if (hostname.includes('draftkings')) return 'DraftKings';
        if (hostname.includes('fanduel')) return 'FanDuel';
        if (hostname.includes('betway')) return 'Betway';
        if (hostname.includes('pinnacle')) return 'Pinnacle';
        if (hostname.includes('bovada')) return 'Bovada';
        return getDomainFromUrl(url);
      }
      
      // For VOD URLs, show appropriate names
      if (type === 'vod') {
        // YouTube VODs
        if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
          if (pathname.includes('/watch')) {
            return 'YouTube VOD';
          } else if (pathname.includes('/@')) {
            const channel = pathname.split('/@')[1]?.split('/')[0];
            return channel ? `${channel} VOD` : 'YouTube VOD';
          }
          return 'YouTube VOD';
        }
        
        // Twitch VODs
        if (hostname.includes('twitch.tv')) {
          if (pathname.includes('/videos/')) {
            return 'Twitch VOD';
          }
          const channel = pathname.split('/').filter(p => p)[0];
          return channel ? `${channel} VOD` : 'Twitch VOD';
        }
        
        return getDomainFromUrl(url) + ' VOD';
      }
      
      // Default fallback
      return getDomainFromUrl(url);
    } catch (error) {
      console.error('Error parsing URL:', error);
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };
  
  // Helper function to calculate series score from maps data
  const calculateSeriesScore = (mapsData, teamNumber) => {
    if (!mapsData || !Array.isArray(mapsData)) return 0;
    
    console.log('🎯 calculateSeriesScore - Maps data:', mapsData.map((map, idx) => ({
      mapIndex: idx,
      team1Score: map.team1_score,
      team2Score: map.team2_score,
      status: map.status,
      winner: map.team1_score > map.team2_score ? 'team1' : map.team2_score > map.team1_score ? 'team2' : 'tie'
    })));
    
    return mapsData.reduce((wins, map) => {
      const team1Score = map.team1_score || 0;
      const team2Score = map.team2_score || 0;
      
      if (teamNumber === 1 && team1Score > team2Score) {
        return wins + 1;
      } else if (teamNumber === 2 && team2Score > team1Score) {
        return wins + 1;
      }
      return wins;
    }, 0);
  };
  
  
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
          
          // Debug logging for URL fields
          console.log('🔍 URL fields in response:', {
            stream_url: responseData.stream_url,
            stream_urls: responseData.stream_urls,
            vod_url: responseData.vod_url,
            vod_urls: responseData.vod_urls,
            betting_url: responseData.betting_url,
            betting_urls: responseData.betting_urls,
            urls: responseData.urls
          });
          
          // Update comprehensive match state
          setMatchData({
            teams: responseData.teams || { team1: null, team2: null },
            event: responseData.event || null,
            schedule: responseData.schedule || null,
            format: responseData.format || 'BO3',
            status: responseData.status || 'upcoming',
            scores: responseData.scores || responseData.score || { series: { team1: 0, team2: 0 }, maps: [] },
            // 🔥 ENHANCED: Handle URLs from comprehensive endpoint
            urls: {
              streams: responseData.stream_urls || (responseData.stream_url ? [responseData.stream_url] : []),
              betting: responseData.betting_urls || (responseData.betting_url ? [responseData.betting_url] : []),
              vods: responseData.vod_urls || (responseData.vod_url ? [responseData.vod_url] : [])
            },
            live_data: responseData.live_data || { current_map: 1, overtime: false, viewers: 0, hero_picks: [], live_updates: [] },
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
          const scoresData = responseData.scores || responseData.score;
          if (scoresData?.series) {
            setLiveSeriesScores({
              team1: scoresData.series.team1 || 0,
              team2: scoresData.series.team2 || 0
            });
          } else {
            // Fallback to series_score fields or calculate from maps
            const team1SeriesScore = responseData.series_score_team1 || 
              (responseData.maps_data ? calculateSeriesScore(responseData.maps_data, 1) : 0) || 0;
            const team2SeriesScore = responseData.series_score_team2 || 
              (responseData.maps_data ? calculateSeriesScore(responseData.maps_data, 2) : 0) || 0;
            
            setLiveSeriesScores({
              team1: team1SeriesScore,
              team2: team2SeriesScore
            });
          }
          
          // Update map scores
          if (scoresData?.maps) {
            setMapScores(scoresData.maps);
          } else if (responseData.maps_data) {
            // Fallback to maps_data if available
            setMapScores(responseData.maps_data);
          }
          
          // Update hero selections
          if (responseData.live_data?.hero_picks) {
            setHeroSelections(responseData.live_data.hero_picks);
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
          
          
          // Update preparation phase state
          if (matchData.is_preparation_phase !== undefined) {
            setIsPreparationPhase(matchData.is_preparation_phase);
          }
          
          
          // Update current map index
          if (matchData.current_map_index !== undefined) {
            setCurrentMapIndex(matchData.current_map_index);
          }
          
          // Debug logging for URL fields in matchData
          console.log('🔍 URL fields in matchData (from response):', {
            stream_url: matchData.stream_url,
            stream_urls: matchData.stream_urls,
            vod_url: matchData.vod_url,
            vod_urls: matchData.vod_urls,
            betting_url: matchData.betting_url,
            betting_urls: matchData.betting_urls,
            urls: matchData.urls
          });
          
          // Calculate series scores from maps if not provided
          console.log('🔍 Calculating series scores:', {
            team1_score: matchData.team1_score,
            series_score_team1: matchData.series_score_team1,
            parsedMapsData,
            calculatedFromMaps: parsedMapsData ? {
              team1: calculateSeriesScore(parsedMapsData, 1),
              team2: calculateSeriesScore(parsedMapsData, 2)
            } : null
          });
          
          // Calculate series scores with proper priority
          const calculatedTeam1Score = matchData.team1_score || 
            matchData.series_score_team1 || 
            (parsedMapsData ? calculateSeriesScore(parsedMapsData, 1) : 0) || 0;
          const calculatedTeam2Score = matchData.team2_score || 
            matchData.series_score_team2 || 
            (parsedMapsData ? calculateSeriesScore(parsedMapsData, 2) : 0) || 0;
          
          const transformedMatch = {
            id: matchData.match_id || realMatchId,
            status: matchData.status || 'unknown',
            team1_score: calculatedTeam1Score,
            team2_score: calculatedTeam2Score,
            format: matchData.format || 'BO1',
            currentMap: parsedMapsData?.[matchData.current_map_index || 0]?.name || 
                       parsedMapsData?.[matchData.current_map_index || 0]?.map_name || 
                       matchData.current_map || 
                       'Unknown Map',
            gameMode: currentGameMode,
            viewers: matchData.viewer_count || 0,
            totalMaps: totalMaps,
            // 🔥 ENHANCED: Multiple URLs support - use comprehensive data if available
            // Check both direct fields and urls object
            stream_urls: matchData.stream_urls || matchData.urls?.streams || (matchData.stream_url ? [matchData.stream_url] : []),
            betting_urls: matchData.betting_urls || matchData.urls?.betting || (matchData.betting_url ? [matchData.betting_url] : []),
            vod_urls: matchData.vod_urls || matchData.urls?.vods || (matchData.vod_url ? [matchData.vod_url] : []),
            round: matchData.round || null,
            bracket_position: matchData.bracket_position || null,
            
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
                  team1Composition: (mapData.team1_composition || []).map(player => {
                    // Find the corresponding real player data from team roster
                    const playerId = player.player_id || player.id;
                    const realPlayer = matchData.team1?.players?.find(rp => 
                      rp.id === playerId || rp.player_id === playerId
                    );
                    
                    return {
                      playerId: playerId,
                      name: realPlayer?.username || realPlayer?.player_name || realPlayer?.name || 
                            player.username || player.player_name || player.name || 
                            `Player ${playerId}`,
                      hero: player.hero || player.current_hero || player.main_hero || 'Captain America',
                      role: convertRoleToFrontend(player.role),
                      country: realPlayer?.country || realPlayer?.nationality || 
                               player.country || player.nationality || 'US',
                      country_flag: realPlayer?.country_flag || realPlayer?.flag || 
                                   player.country_flag || player.flag,
                      avatar: realPlayer?.avatar || player.avatar,
                      eliminations: player.eliminations || 0,
                      deaths: player.deaths || 0,
                      assists: player.assists || 0,
                      damage: player.damage || 0,
                      healing: player.healing || 0,
                      damageBlocked: player.damage_blocked || player.blocked || 0
                    };
                  }),
                  team2Composition: (mapData.team2_composition || []).map(player => {
                    // Find the corresponding real player data from team roster
                    const playerId = player.player_id || player.id;
                    const realPlayer = matchData.team2?.players?.find(rp => 
                      rp.id === playerId || rp.player_id === playerId
                    );
                    
                    return {
                      playerId: playerId,
                      name: realPlayer?.username || realPlayer?.player_name || realPlayer?.name || 
                            player.username || player.player_name || player.name || 
                            `Player ${playerId}`,
                      hero: player.hero || player.current_hero || player.main_hero || 'Hulk',
                      role: convertRoleToFrontend(player.role),
                      country: realPlayer?.country || realPlayer?.nationality || 
                               player.country || player.nationality || 'US',
                      country_flag: realPlayer?.country_flag || realPlayer?.flag || 
                                   player.country_flag || player.flag,
                      avatar: realPlayer?.avatar || player.avatar,
                      eliminations: player.eliminations || 0,
                      deaths: player.deaths || 0,
                      assists: player.assists || 0,
                      damage: player.damage || 0,
                      healing: player.healing || 0,
                      damageBlocked: player.damage_blocked || player.blocked || 0
                    };
                  })
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
                  team1Composition: [],
                  team2Composition: []
                };
              }
            }),
            
            currentRound: matchData.current_round
          };
          
          console.log('✅ MatchDetailPage: Transformed match data:', transformedMatch);
          console.log('🔗 URLs in transformedMatch:', {
            stream_urls: transformedMatch.stream_urls,
            betting_urls: transformedMatch.betting_urls,
            vod_urls: transformedMatch.vod_urls
          });
          setMatch(transformedMatch);
          
          // Initialize live series scores from match data
          setLiveSeriesScores({
            team1: transformedMatch.team1_score || 0,
            team2: transformedMatch.team2_score || 0
          });
          
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
      }, 5000); // Poll every 5 seconds for live matches (reduced from 1s to prevent conflicts)
    }

    // 🔥 ENHANCED CROSS-TAB SYNC - LISTEN FOR ALL ADMIN UPDATES
    const handleMatchUpdate = (event) => {
      const { detail } = event;
      const currentMatchId = getMatchId();
      
      console.log('MatchDetailPage: Sync event received:', {
        eventType: event.type,
        detailType: detail.updateType,
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
        const eventId = `${detail.updateType}-${detail.timestamp}-${detail.matchId}`;
        if (lastProcessedEventId === eventId) {
          console.log('🚫 Skipping duplicate event:', eventId);
          return;
        }
        setLastProcessedEventId(eventId);
        
        console.log('MatchDetailPage: Processing real-time update:', {
          type: detail.updateType,
          hasMatchData: !!detail.matchData,
          timestamp: detail.timestamp,
          eventId,
          matchDataKeys: detail.matchData ? Object.keys(detail.matchData) : []
        });
        
        // Handle different types of updates with IMMEDIATE RESPONSE and ERROR HANDLING
        try {
          console.log('ENTERING SWITCH STATEMENT for type:', detail.updateType);
          
          
          switch (detail.updateType) {
            case 'SCORE_UPDATE':
              console.log('Score update received - IMMEDIATE UPDATE', detail);
              
              // PRIORITY 1: Update match data immediately if provided
              if (detail.matchData) {
                console.log('Setting match data from SCORE_UPDATE:', detail.matchData);
                setMatch(detail.matchData);
                setRefreshTrigger(prev => prev + 1); // Force re-render
              }
              
              // PRIORITY 2: Handle map-level score updates for immediate feedback
              if (detail.mapScore !== undefined && detail.teamNumber && detail.mapIndex !== undefined) {
                console.log(`🎯 IMMEDIATE Map score update: Team ${detail.teamNumber} = ${detail.mapScore} on map ${detail.mapIndex + 1}`);
                
                // Update match state immediately
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
                
                // Force immediate re-render
                setRefreshTrigger(prev => prev + 1);
              }
              
              // Don't refresh immediately - let the immediate update show first
              // Backend refresh will happen after a delay to avoid overwriting immediate changes
              setTimeout(() => {
                console.log('🔄 Background refresh after score update...');
                fetchMatchData(false);
              }, 3000); // 3 second delay to let immediate update be visible
              
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
              
              // 🔥 IMMEDIATE STAT UPDATE (like timer) - ENHANCED COMPATIBILITY
              const statType = detail.statType || detail.statName;
              const statValue = detail.statValue || detail.value;
              
              if (detail.playerName && statType && statValue !== undefined) {
                console.log(`📊 IMMEDIATE: ${detail.playerName} ${statType} = ${statValue}`);
                setLastStatUpdate({
                  playerName: detail.playerName,
                  statName: statType,
                  statType: statType,
                  value: statValue,
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
              
            case 'MAP_COMPLETED':
              console.log('🏁 Map completed - updating series scores', detail);
              
              // Update series scores immediately
              if (detail.seriesScoreTeam1 !== undefined && detail.seriesScoreTeam2 !== undefined) {
                setMatch(prev => prev ? {
                  ...prev,
                  team1_score: detail.seriesScoreTeam1,
                  team2_score: detail.seriesScoreTeam2,
                  lastUpdated: Date.now()
                } : prev);
                
                console.log(`🏁 Series scores updated: Team1=${detail.seriesScoreTeam1}, Team2=${detail.seriesScoreTeam2}`);
                setRefreshTrigger(prev => prev + 1);
              }
              
              // Refresh to get updated map statuses
              setTimeout(() => {
                fetchMatchData(false);
              }, 1000);
              break;
              
            case 'COMPLETE_UPDATE':
              console.log('💾 Complete update from LiveScoring - transforming and applying', detail);
              
              // Transform the maps data from LiveScoring format to MatchDetail format
              if (detail.maps && Array.isArray(detail.maps)) {
                setMatch(prev => {
                  if (!prev) return prev;
                  
                  // Transform maps from LiveScoring format (camelCase) to display format
                  const transformedMaps = detail.maps.map((map, index) => ({
                    ...prev.maps[index], // Keep existing map data
                    team1Score: map.team1Score,
                    team2Score: map.team2Score,
                    team1_score: map.team1Score, // Also include snake_case for compatibility
                    team2_score: map.team2Score,
                    status: map.status || prev.maps[index]?.status || 'upcoming',
                    mapName: map.name || prev.maps[index]?.mapName,
                    mode: map.mode || prev.maps[index]?.mode
                  }));
                  
                  console.log('💾 Transformed maps:', transformedMaps);
                  
                  return {
                    ...prev,
                    maps: transformedMaps,
                    team1_score: detail.series_score_team1 || detail.team1_score || prev.team1_score,
                    team2_score: detail.series_score_team2 || detail.team2_score || prev.team2_score,
                    status: detail.status || prev.status,
                    current_map: detail.current_map || prev.current_map,
                    lastUpdated: Date.now()
                  };
                });
                
                // Update series scores
                setLiveSeriesScores({
                  team1: detail.series_score_team1 || detail.team1_score || 0,
                  team2: detail.series_score_team2 || detail.team2_score || 0
                });
                
                setRefreshTrigger(prev => prev + 1);
              }
              
              // Don't immediately refresh - let the update show first
              setTimeout(() => {
                console.log('🔄 Background refresh after complete update');
                fetchMatchData(false);
              }, 3000);
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
          if (true) {
            
            if (detail.updateType === 'SCORE_UPDATE') {
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

    // 🔥 SIMPLIFIED: Listen only for unified match update event
    const customEventHandler = (event) => {
      console.log(`MatchDetailPage: Unified event received:`, event.detail);
      
      // Validate event structure
      if (!event.detail?.matchId || !event.detail?.updateType) {
        console.error('❌ Invalid event structure:', event.detail);
        return;
      }
      
      // Only process events for this match
      if (String(event.detail.matchId) !== String(getMatchId())) {
        console.log('🚫 Event for different match, ignoring');
        return;
      }
      
      console.log(`✅ Processing unified event type: ${event.detail.updateType}`);
      handleMatchUpdate(event);
    };
    
    // Register single unified event listener
    window.addEventListener('mrvl-match-updated', customEventHandler);
    
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
              updateType: test.eventType,
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
    
    // Register diagnostic handler for unified event
    window.addEventListener('mrvl-match-updated', diagnosticHandler);

    // 🚨 ENHANCED LOCALSTORAGE SYNC WITH BETTER MATCH ID HANDLING
    const handleStorageChange = (event) => {
      console.log('🔄 STORAGE EVENT DETECTED:', {
        key: event.key,
        newValue: event.newValue ? event.newValue.substring(0, 100) + '...' : null,
        oldValue: event.oldValue ? event.oldValue.substring(0, 100) + '...' : null,
        currentMatchId: getMatchId(),
        timestamp: new Date().toISOString()
      });
      
      // 🔥 SIMPLIFIED: Listen only for this match's specific storage key
      const expectedKey = `mrvl-match-sync-${getMatchId()}`;
      if (event.key === expectedKey && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          console.log('🔄 Storage sync for this match:', syncData);
          
          if (syncData.updateType) {
            handleMatchUpdate({ detail: syncData });
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
        
        // Handle comprehensive live updates from LiveMatchUpdate event
        if (data.update_type || data.all_maps) {
          console.log('🔥 Live update received:', data.update_type);
          
          // Update series scores immediately
          if (data.series_score) {
            setLiveSeriesScores({
              team1: data.series_score.team1 || 0,
              team2: data.series_score.team2 || 0
            });
          }
          
          // Update current map scores immediately
          if (data.current_map_scores) {
            setLiveScores({
              team1: data.current_map_scores.team1_score || 0,
              team2: data.current_map_scores.team2_score || 0
            });
          }
          
          // Update all map data
          if (data.all_maps) {
            setMapScores(data.all_maps);
          }
          
          // Update hero selections
          if (data.hero_selections && data.hero_selections.length > 0) {
            const heroMap = {};
            data.hero_selections.forEach(selection => {
              heroMap[selection.player_id] = selection.hero;
            });
            setHeroSelections(heroMap);
            setLastHeroChange({
              timestamp: data.timestamp,
              selections: data.hero_selections
            });
          }
          
          // Update player stats
          if (data.player_stats) {
            setPlayerPerformance(data.player_stats);
            setLastStatUpdate({
              timestamp: data.timestamp,
              stats: data.player_stats
            });
          }
          
          // Update timer
          
          // Update match status
          if (data.match_status) {
            setMatch(prev => prev ? { ...prev, status: data.match_status } : prev);
          }
          
          // Force UI refresh
          setRefreshTrigger(prev => prev + 1);
          
          // Show live update indicator
          setLiveUpdateIndicator({
            type: data.update_type,
            timestamp: Date.now()
          });
          setTimeout(() => setLiveUpdateIndicator(null), 3000);
          
        }
        // Handle legacy event types
        else if (data.type === 'score-updated') {
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
      
      // Remove unified event listeners
      window.removeEventListener('mrvl-match-updated', customEventHandler);
      window.removeEventListener('mrvl-match-updated', diagnosticHandler);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [matchId, api, refreshTrigger, BACKEND_URL]);

  // 🔄 SEPARATE POLLING EFFECT - Polls every second when match is live
  useEffect(() => {
    if (!match || !matchId) return;
    
    // Start polling if match is live
    console.log('🔍 Checking polling condition:', { matchStatus: match.status, isLive: match.status === 'live', matchId });
    if (match.status === 'live') {
      console.log('🔄 Starting 1-second polling for live match:', matchId);
      
      const pollInterval = setInterval(async () => {
        try {
          // Use public live endpoint for faster updates (no auth required)
          const apiResponse = await api.get(`/live/${matchId}`);
          if (apiResponse?.data) {
            const liveData = apiResponse.data;
            
            console.log('🔄 Live polling update received:', liveData);
            
            
            // Update series scores immediately
            setLiveSeriesScores({
              team1: liveData.series_score_team1 || 0,
              team2: liveData.series_score_team2 || 0
            });
            
            // Update match status
            if (liveData.status) {
              setMatch(prev => prev ? { ...prev, status: liveData.status } : prev);
            }
            
            // Update maps data if available
            if (liveData.maps && Array.isArray(liveData.maps)) {
              // Process maps with updated player stats
              const processedMaps = liveData.maps.map(map => {
                // Update team compositions with latest hero selections from player_stats
                const updatedMap = { ...map };
                
                if (liveData.player_stats) {
                  // Update team1 composition
                  if (map.team1Composition) {
                    updatedMap.team1Composition = map.team1Composition.map(player => {
                      const playerStats = liveData.player_stats[player.playerId];
                      if (playerStats) {
                        return {
                          ...player,
                          hero: playerStats.hero || player.hero,
                          eliminations: playerStats.eliminations || player.eliminations || 0,
                          deaths: playerStats.deaths || player.deaths || 0,
                          assists: playerStats.assists || player.assists || 0,
                          damage: playerStats.damage || player.damage || 0,
                          healing: playerStats.healing || player.healing || 0,
                          damageBlocked: playerStats.damage_blocked || player.damageBlocked || 0
                        };
                      }
                      return player;
                    });
                  }
                  
                  // Update team2 composition
                  if (map.team2Composition) {
                    updatedMap.team2Composition = map.team2Composition.map(player => {
                      const playerStats = liveData.player_stats[player.playerId];
                      if (playerStats) {
                        return {
                          ...player,
                          hero: playerStats.hero || player.hero,
                          eliminations: playerStats.eliminations || player.eliminations || 0,
                          deaths: playerStats.deaths || player.deaths || 0,
                          assists: playerStats.assists || player.assists || 0,
                          damage: playerStats.damage || player.damage || 0,
                          healing: playerStats.healing || player.healing || 0,
                          damageBlocked: playerStats.damage_blocked || player.damageBlocked || 0
                        };
                      }
                      return player;
                    });
                  }
                }
                
                return updatedMap;
              });
              
              setMapScores(processedMaps);
            }
            
            // Update player stats if available
            if (liveData.player_stats) {
              setPlayerPerformance(liveData.player_stats);
            }
            
            // Show live update indicator
            setLiveUpdateIndicator('Updated');
            setTimeout(() => setLiveUpdateIndicator(null), 500);
          }
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 1000); // Poll every 1 second
      
      return () => {
        console.log('🛑 Stopping polling for match:', matchId);
        clearInterval(pollInterval);
      };
    }
  }, [match?.status, matchId, api]);

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
      
      // Process comments to build proper user objects from flat data
      const processedComments = (Array.isArray(commentsData) ? commentsData : []).map(comment => ({
        ...comment,
        user: {
          id: comment.user_id,
          name: comment.user_name,
          avatar: comment.avatar,
          hero_flair: comment.hero_flair,
          team_flair_id: comment.team_flair_id,
          flairs: {
            hero: comment.hero_flair ? {
              type: 'hero',
              name: comment.hero_flair,
              image: `/images/heroes/${comment.hero_flair.toLowerCase().replace(/\s+/g, '-')}.png`,
              fallback_text: comment.hero_flair
            } : null
          }
        },
        // Process replies the same way
        replies: (comment.replies || []).map(reply => ({
          ...reply,
          user: {
            id: reply.user_id,
            name: reply.user_name,
            avatar: reply.avatar,
            hero_flair: reply.hero_flair,
            team_flair_id: reply.team_flair_id,
            flairs: {
              hero: reply.hero_flair ? {
                type: 'hero',
                name: reply.hero_flair,
                image: `/images/heroes/${reply.hero_flair.toLowerCase().replace(/\s+/g, '-')}.png`,
                fallback_text: reply.hero_flair
              } : null
            }
          }
        }))
      }));
      
      setComments(processedComments);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleMentionSelect = (mention) => {
    // Add the selected mention to our tracking array
    setSelectedMentions(prev => {
      // Avoid duplicates
      const exists = prev.find(m => m.id === mention.id && m.type === mention.type);
      if (exists) return prev;
      return [...prev, mention];
    });
  };

  const submitComment = async () => {
    const content = replyingTo ? replyText.trim() : newComment.trim();
    if (!content) return;
    
    setSubmittingComment(true);
    try {
      const currentMatchId = getMatchId();
      const response = await api.post(`/user/matches/${currentMatchId}/comments`, {
        content: content,
        parent_id: replyingTo?.id || null,
        mentions: selectedMentions
      });
      
      if (response?.success || response?.data) {
        console.log('✅ Comment posted successfully, refreshing comments...');
        
        // Clear form
        setNewComment('');
        setReplyText('');
        setReplyingTo(null);
        setSelectedMentions([]);
        
        // Fetch fresh data from server to get properly processed mentions
        await fetchComments();
      }
    } catch (error) {
      console.error('❌ Error submitting comment:', error);
      alert('Error submitting comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
  };

  const handleSaveEdit = async (commentId) => {
    if (!editContent.trim()) return;

    try {
      setSubmittingComment(true);

      const response = await api.put(`/user/matches/comments/${commentId}`, {
        content: editContent.trim(),
        mentions: selectedMentions
      });

      if (response.success) {
        setEditingComment(null);
        setEditContent('');
        setSelectedMentions([]);
        
        // Immediately fetch fresh data
        await fetchComments();
      } else {
        alert('Failed to edit comment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to edit comment:', error);
      alert('Failed to edit comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    // Prevent double-clicks
    if (submittingComment) return;

    try {
      setSubmittingComment(true);
      console.log('🗑️ Deleting comment...', commentId);

      const response = await api.delete(`/user/matches/comments/${commentId}`);

      if (response.success) {
        console.log('✅ Comment deleted successfully');
        // Immediately fetch fresh data
        await fetchComments();
      } else {
        alert('Failed to delete comment. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to delete comment:', error);
      alert('Failed to delete comment. Please try again.');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Render comment function (Forums style)
  const renderComment = (comment, isReply = false, depth = 0) => {
    const maxDepth = 3; // Limit nesting depth for readability
    const shouldShowReplies = comment.replies && comment.replies.length > 0 && depth < maxDepth;
    
    // Use inline style for dynamic margin instead of class
    const marginStyle = isReply ? { marginLeft: `${Math.min(depth * 2, 6)}rem` } : {};
    
    return (
      <div 
        key={comment.id}
        className={`${
          isReply ? 'pl-4 border-l-2 border-gray-200 dark:border-gray-700' : ''
        } py-4 ${depth > 0 ? 'bg-gray-50/50 dark:bg-gray-800/50 rounded-lg' : ''}`}
        style={marginStyle}
      >
        <div className="w-full">
          {/* User Info Header */}
          <div className="flex items-center space-x-3 mb-3">
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
            {/* Voting buttons right after username info */}
            <VotingButtons
              itemType="match_comment"
              itemId={comment.id}
              parentId={getMatchId()}
              initialUpvotes={comment.votes?.upvotes || comment.upvotes || 0}
              initialDownvotes={comment.votes?.downvotes || comment.downvotes || 0}
              userVote={comment.user_vote}
              direction="horizontal"
              size="xs"
              onVoteChange={(newVote, stats) => {
                console.log('📊 Comment vote changed:', newVote, 'Stats:', stats);
                // VotingButtons handles UI updates internally, no need to refresh
              }}
            />
          </div>

          {/* Comment Content with mentions */}
          <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
            {comment.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-2 last:mb-0">
                {processContentWithMentions(paragraph, comment.mentions || [], navigateTo)}
              </p>
            ))}
          </div>

          {/* Comment Actions */}
          <div className="flex items-center space-x-4 mb-3">
            {/* Reply Button */}
            {isAuthenticated && !comment.is_temp && (
              <button
                onClick={() => setReplyingTo(comment)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Reply
              </button>
            )}
            
            {/* Edit Button */}
            {(comment.user?.id === user?.id || isAdmin() || isModerator()) && (
              <button
                onClick={() => handleEditComment(comment)}
                className="text-xs text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                Edit
              </button>
            )}

            {/* Delete Button */}
            {(comment.user?.id === user?.id || isAdmin() || isModerator()) && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                disabled={submittingComment}
                className={`text-xs transition-colors ${
                  submittingComment 
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                    : 'text-gray-500 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400'
                }`}
              >
                {submittingComment ? 'Deleting...' : 'Delete'}
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo?.id === comment.id && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  submitComment();
                }}>
                  <div className="mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Replying to @{comment.user?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                        setSelectedMentions([]);
                      }}
                      className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <MentionAutocomplete
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onMentionSelect={handleMentionSelect}
                    placeholder="Write your reply... Use @username to mention someone"
                    rows={3}
                    className="px-3 py-2"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyText('');
                        setSelectedMentions([]);
                      }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!replyText.trim() || submittingComment}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? 'Posting...' : 'Reply'}
                    </button>
                  </div>
                </form>
              </div>
          )}

          {/* Edit Form */}
          {editingComment?.id === comment.id && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-700">
                <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(comment.id); }}>
                  <div className="mb-2">
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      Editing comment
                    </span>
                    <button
                      type="button"
                      onClick={() => { setEditingComment(null); setEditContent(''); setSelectedMentions([]); }}
                      className="ml-2 text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <MentionAutocomplete
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    onMentionSelect={handleMentionSelect}
                    placeholder="Edit your comment..."
                    rows={4}
                    className="px-3 py-2"
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      type="button"
                      onClick={() => { setEditingComment(null); setEditContent(''); setSelectedMentions([]); }}
                      className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!editContent.trim() || submittingComment}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
          )}

          {/* Nested Replies */}
          {shouldShowReplies && (
            <div className="mt-4 space-y-2">
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
  
  // Debug logging for flag issue - check both naming conventions
  if (currentMap) {
    const composition = currentMap.team2_composition || currentMap.team2Composition;
    if (composition && composition.length > 0) {
      console.log('🚩 Debug - Team 2 Player 1 data:', composition[0]);
      console.log('🚩 Debug - Player country:', composition[0].country);
      console.log('🚩 Debug - Player flag:', composition[0].flag);
      console.log('🚩 Debug - Player country_flag:', composition[0].country_flag);
    }
  }
  
  const currentMapData = currentMap ? {
    map_name: currentMap.mapName || match?.currentMap || 'Unknown Map',
    mode: currentMap.mode || match?.gameMode || 'Unknown Mode',
    team1Players: (currentMap.team1_composition || currentMap.team1Composition || match?.team1?.roster || match?.team1?.players || []).slice(0, 6).map(p => {
      // Find the corresponding real player data from team roster
      const playerId = p.playerId || p.player_id || p.id;
      const realPlayer = match?.team1?.players?.find(rp => rp.id === playerId || rp.player_id === playerId);
      
      return {
        id: playerId,
        name: realPlayer?.username || realPlayer?.player_name || realPlayer?.name || p.username || p.player_name || p.name || 'Unknown Player',
        username: realPlayer?.username || p.username,
        real_name: realPlayer?.real_name || p.real_name,
        country: realPlayer?.country || realPlayer?.nationality || p.country || p.nationality || 'US',
        country_flag: realPlayer?.country_flag || realPlayer?.flag || p.country_flag || p.flag || p.countryFlag,
        hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero',
        role: realPlayer?.role || p.role,
        stats: p.stats
      };
    }),
    team2Players: (currentMap.team2_composition || currentMap.team2Composition || match?.team2?.roster || match?.team2?.players || []).slice(0, 6).map(p => {
      // Find the corresponding real player data from team roster
      const playerId = p.playerId || p.player_id || p.id;
      const realPlayer = match?.team2?.players?.find(rp => rp.id === playerId || rp.player_id === playerId);
      
      return {
        id: playerId,
        name: realPlayer?.username || realPlayer?.player_name || realPlayer?.name || p.username || p.player_name || p.name || 'Unknown Player',
        username: realPlayer?.username || p.username,
        real_name: realPlayer?.real_name || p.real_name,
        country: realPlayer?.country || realPlayer?.nationality || p.country || p.nationality || 'US',
        country_flag: realPlayer?.country_flag || realPlayer?.flag || p.country_flag || p.flag || p.countryFlag,
        hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero',
        role: realPlayer?.role || p.role,
        stats: p.stats
      };
    })
  } : {
    map_name: match?.currentMap || 'Unknown Map',
    mode: match?.gameMode || 'Unknown Mode',
    team1Players: (match?.team1?.roster || match?.team1?.players || []).map(p => ({
      ...p,
      name: p.username || p.player_name || p.name || 'Unknown Player',
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      country_flag: p.country_flag || p.flag || p.countryFlag,
      hero: p.hero || p.current_hero || p.main_hero || 'Unknown Hero'
    })),
    team2Players: (match?.team2?.roster || match?.team2?.players || []).map(p => ({
      ...p,
      name: p.username || p.player_name || p.name || 'Unknown Player',
      id: p.playerId || p.player_id || p.id,
      country: p.country || p.nationality || 'US',
      country_flag: p.country_flag || p.flag || p.countryFlag,
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
        
        {/* GAME MODE INFO */}
        <div className="mt-2 flex justify-center items-center">
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400`}>
            {match.gameMode || match.maps?.[currentMapIndex]?.mode || 'Domination'}
          </div>
        </div>
        
        {/* LIVE UPDATE INDICATOR */}
        {liveUpdateIndicator && (
          <div className="mt-4 flex justify-center">
            <div className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium animate-fade-in-out">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>
                  {liveUpdateIndicator.type === 'hero_update' && '🦸 Heroes Updated'}
                  {liveUpdateIndicator.type === 'score_update' && '🎯 Scores Updated'}
                  {liveUpdateIndicator.type === 'stats_update' && '📊 Stats Updated'}
                  {liveUpdateIndicator.type === 'general' && '🔄 Match Updated'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* LIVE STATUS DISPLAY */}
        {match.status === 'live' && !isPreparationPhase && (
          <div className="mt-4 flex justify-center">
            <div className="bg-red-600 text-white px-6 py-2 rounded-lg font-mono text-xl font-bold animate-pulse">
              🔴 LIVE
            </div>
          </div>
        )}
        
        
        {/* 🔥 ENHANCED: Multiple URLs Action Buttons */}
        <div className="mt-6 space-y-4">
          {/* Debug logging for match object */}
          {console.log('🎯 Match object in render:', {
            stream_url: match.stream_url,
            stream_urls: match.stream_urls,
            vod_url: match.vod_url,
            vod_urls: match.vod_urls,
            betting_url: match.betting_url,
            betting_urls: match.betting_urls
          })}
          {/* URLs Section - Horizontal Layout */}
          <div className="flex flex-wrap justify-center gap-4">
            {/* Stream URLs */}
            {((match.stream_urls && match.stream_urls.length > 0 && match.stream_urls.some(url => url)) || match.stream_url) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Stream:</span>
                {(match.stream_urls || (match.stream_url ? [match.stream_url] : [])).filter(url => url).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded font-medium transition-colors text-sm"
                  >
                    {getStreamChannelName(url)}
                  </a>
                ))}
              </div>
            )}

            {/* Betting URLs */}
            {((match.betting_urls && match.betting_urls.length > 0 && match.betting_urls.some(url => url)) || match.betting_url) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Betting:</span>
                {(match.betting_urls || (match.betting_url ? [match.betting_url] : [])).filter(url => url).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors text-sm"
                  >
                    {getUrlDisplayName(url, 'betting')}
                  </a>
                ))}
              </div>
            )}

            {/* VOD URLs */}
            {((match.vod_urls && match.vod_urls.length > 0 && match.vod_urls.some(url => url)) || match.vod_url) && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">VOD:</span>
                {(match.vod_urls || (match.vod_url ? [match.vod_url] : [])).filter(url => url).map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors text-sm"
                  >
                    {getUrlDisplayName(url, 'vod')}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SERIES PROGRESS FOR BO3/BO5 */}
      {match.totalMaps > 1 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6">
          <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Series Progress (First to {Math.ceil(match.totalMaps / 2)})
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
                {liveSeriesScores.team1 || 0}
              </div>
              {match.status === 'live' && (
                <div className="text-xs text-green-500 animate-pulse">
                  LIVE
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
                {liveSeriesScores.team2 || 0}
              </div>
              {match.status === 'live' && (
                <div className="text-xs text-green-500 animate-pulse">
                  LIVE
                </div>
              )}
            </div>
          </div>
          
          {/* Map Scores Display - Shows individual map scores */}
          <div className="flex justify-center gap-4 mt-4">
            {match.maps.map((map, index) => (
              <div 
                key={index}
                className={`text-center cursor-pointer p-3 rounded-lg transition-all ${
                  index === currentMapIndex 
                    ? 'bg-white dark:bg-gray-700 shadow-lg ring-2 ring-purple-500' 
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setCurrentMapIndex(index)}
              >
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Map {index + 1}
                </div>
                <div className="text-xl font-bold">
                  <span className={(map.team1_score || map.team1Score || 0) > (map.team2_score || map.team2Score || 0) ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}>
                    {map.team1_score || map.team1Score || 0}
                  </span>
                  <span className="mx-2 text-gray-500">-</span>
                  <span className={(map.team2_score || map.team2Score || 0) > (map.team1_score || map.team1Score || 0) ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}>
                    {map.team2_score || map.team2Score || 0}
                  </span>
                </div>
                {map.status === 'completed' && (
                  <div className="text-xs mt-1 font-medium">
                    {(map.team1_score || map.team1Score || 0) > (map.team2_score || map.team2Score || 0) ? (
                      <span className="text-blue-600 dark:text-blue-400">{match.team1?.name || 'Team 1'} Wins</span>
                    ) : (map.team2_score || map.team2Score || 0) > (map.team1_score || map.team1Score || 0) ? (
                      <span className="text-red-600 dark:text-red-400">{match.team2?.name || 'Team 2'} Wins</span>
                    ) : (
                      <span className="text-gray-600 dark:text-gray-400">Draw</span>
                    )}
                  </div>
                )}
                {map.status === 'live' && (
                  <div className="text-xs mt-1 text-green-500 animate-pulse">LIVE</div>
                )}
                {map.status === 'upcoming' && (
                  <div className="text-xs mt-1 text-gray-500">Upcoming</div>
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
              <h2 
                className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2 cursor-pointer hover:underline"
                onClick={() => navigateTo && navigateTo('team-detail', match.team1?.id)}
              >
                {match.team1?.name}
              </h2>
              <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
                {match.maps?.[currentMapIndex]?.team1Score || 0}
              </div>
              {match.status === 'live' && (
                <div className="text-xs text-green-500 animate-pulse mt-2">
                  LIVE
                </div>
              )}
            </div>
            
            <div className="text-center mx-8">
              <div className="text-5xl text-gray-400 dark:text-gray-600">VS</div>
              <div className="mt-4">
                <div className="text-lg font-medium text-gray-600 dark:text-gray-400">
                  {match.totalMaps > 1 ? `Map ${currentMapIndex + 1}` : ''}
                </div>
                {match.status === 'live' && (
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    <span className="flex items-center space-x-2 justify-center">
                      <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-xl">LIVE</span>
                    </span>
                  </div>
                )}
              </div>
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
                {match.maps?.[currentMapIndex]?.team2Score || 0}
              </div>
              {match.status === 'live' && (
                <div className="text-xs text-green-500 animate-pulse mt-2">
                  LIVE
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* MATCH STATISTICS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            {match.totalMaps > 1 ? `Map ${currentMapIndex + 1} Statistics` : 'Match Statistics'}
          </h3>
          
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
            <form onSubmit={(e) => {
              e.preventDefault();
              submitComment();
            }}>
              <div className="flex items-start space-x-3">
                <UserDisplay
                  user={user}
                  showAvatar={true}
                  showTeamFlair={false}
                  size="sm"
                />
                <div className="flex-1">
                  <MentionAutocomplete
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onMentionSelect={handleMentionSelect}
                    placeholder="Share your thoughts about this match... Use @username to mention someone"
                    rows={3}
                    className="px-3 py-2"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Posting as {user?.name}
                    </div>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
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