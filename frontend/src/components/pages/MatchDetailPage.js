import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../hooks';
import { getCountryFlag, getTeamLogoUrl, getImageUrl } from '../../utils/imageUtils';
import UserDisplay, { parseTextWithMentions } from '../shared/UserDisplay';
import VotingButtons from '../shared/VotingButtons';
import HeroImage from '../shared/HeroImage';
import UnifiedLiveScoring from '../admin/UnifiedLiveScoring';
import CommentSystemSimple from '../shared/CommentSystemSimple';
import MatchComments from '../shared/MatchComments';
import liveScoreSync from '../../utils/LiveScoreSync';

// Error Boundary Component
class MatchDetailErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('MatchDetail Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md">
            <h2 className="text-white text-xl mb-4">Error Loading Match</h2>
            <p className="text-gray-300 mb-4">Failed to load match details. Please try refreshing the page.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function MatchDetailPage({ matchId, navigateTo }) {
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentMapIndex, setCurrentMapIndex] = useState(0);
  const [selectedMapId, setSelectedMapId] = useState(null);
  
  // CRITICAL: Force re-render when map changes
  useEffect(() => {
    console.log(`MatchDetailPage: Current map changed to index ${currentMapIndex}`);
    if (match?.maps?.[currentMapIndex]) {
      console.log('MatchDetailPage: Current map data:', match.maps[currentMapIndex]);
    }
  }, [currentMapIndex, match?.maps]);
  const [showLiveScoring, setShowLiveScoring] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const unsubscribeRef = useRef(null);
  
  const { user, isAuthenticated, api } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
  
  // Calculate overall match score from map wins - MOVED TO TOP FOR SCOPE ACCESS
  const calculateOverallScore = useCallback((mapsData) => {
    if (!mapsData || mapsData.length === 0) {
      return { team1Score: 0, team2Score: 0 };
    }
    
    let team1Wins = 0;
    let team2Wins = 0;
    
    mapsData.forEach(map => {
      // Only count completed maps with definitive scores
      if (map && (map.status === 'completed' || (map.team1_score > 0 || map.team2_score > 0))) {
        if (map.team1_score > map.team2_score) {
          team1Wins++;
        } else if (map.team2_score > map.team1_score) {
          team2Wins++;
        }
      }
    });
    
    return { team1Score: team1Wins, team2Score: team2Wins };
  }, []);
  
  // Handle match updates from live scoring
  const handleMatchUpdate = useCallback((updatedData) => {
    console.log('MatchDetailPage: Handling match update:', updatedData);
    setMatch(prevMatch => {
      if (!prevMatch) return prevMatch;
      
      return {
        ...prevMatch,
        ...updatedData,
        maps: updatedData.maps || prevMatch.maps,
        team1_score: updatedData.team1_score !== undefined ? updatedData.team1_score : prevMatch.team1_score,
        team2_score: updatedData.team2_score !== undefined ? updatedData.team2_score : prevMatch.team2_score,
        status: updatedData.status || prevMatch.status,
      };
    });
  }, []);

  // ENHANCED: Comprehensive live update handler for ALL data types
  const handleLiveScoreUpdate = useCallback((updateData, source = 'unknown') => {
    // Handle multiple data formats from different sources
    const scoreData = updateData.data || updateData;
    if (!scoreData) return;

    console.log('🔄 Live update received:', { source, hasData: !!scoreData.data, hasMaps: !!scoreData.maps });

    // Use standard setState for live updates to avoid flushSync errors
    setMatch(prevMatch => {
      if (!prevMatch) return prevMatch;
        
        // COMPREHENSIVE: Handle all update types - scores, player stats, hero selections
        const updatedMatch = {
          ...prevMatch,
          // PRIORITY 1: Direct live scoring updates (series_score fields)
          team1_score: scoreData.series_score_team1 !== undefined ? scoreData.series_score_team1 :
                       scoreData.team1_score !== undefined ? scoreData.team1_score : 
                       scoreData.team1Score !== undefined ? scoreData.team1Score : 
                       prevMatch.team1_score || 0,
          team2_score: scoreData.series_score_team2 !== undefined ? scoreData.series_score_team2 :
                       scoreData.team2_score !== undefined ? scoreData.team2_score :
                       scoreData.team2Score !== undefined ? scoreData.team2Score :
                       prevMatch.team2_score || 0,
          
          // ENHANCED: Update maps data with comprehensive player stats
          maps: (() => {
            // Priority 1: Direct maps data from server
            if (scoreData.maps && Array.isArray(scoreData.maps)) {
              console.log('🗺️ Updating maps from server:', scoreData.maps.length);
              // Deep clone to ensure React detects changes
              return scoreData.maps.map((map, idx) => ({
                ...map,
                // Ensure player compositions are included
                team1_composition: map.team1_composition || map.team1_players || prevMatch.maps?.[idx]?.team1_composition || [],
                team2_composition: map.team2_composition || map.team2_players || prevMatch.maps?.[idx]?.team2_composition || [],
                team1_players: map.team1_players || map.team1_composition || prevMatch.maps?.[idx]?.team1_players || [],
                team2_players: map.team2_players || map.team2_composition || prevMatch.maps?.[idx]?.team2_players || []
              }));
            }
            
            // Priority 2: Update current map with live player data if provided
            if ((scoreData.team1_players || scoreData.team2_players || 
                 scoreData.team1_composition || scoreData.team2_composition) && prevMatch.maps) {
              const updatedMaps = [...prevMatch.maps];
              const currentMapIdx = scoreData.current_map_number ? scoreData.current_map_number - 1 : currentMapIndex;
              
              console.log(`📊 Updating map ${currentMapIdx + 1} player compositions`);
              
              if (updatedMaps[currentMapIdx]) {
                updatedMaps[currentMapIdx] = {
                  ...updatedMaps[currentMapIdx],
                  // Update team compositions with live player data
                  team1_composition: scoreData.team1_composition || scoreData.team1_players || updatedMaps[currentMapIdx].team1_composition,
                  team2_composition: scoreData.team2_composition || scoreData.team2_players || updatedMaps[currentMapIdx].team2_composition,
                  team1_players: scoreData.team1_players || scoreData.team1_composition || updatedMaps[currentMapIdx].team1_players,
                  team2_players: scoreData.team2_players || scoreData.team2_composition || updatedMaps[currentMapIdx].team2_players,
                  // Update scores if provided
                  team1_score: scoreData.map_team1_score !== undefined ? scoreData.map_team1_score : updatedMaps[currentMapIdx].team1_score,
                  team2_score: scoreData.map_team2_score !== undefined ? scoreData.map_team2_score : updatedMaps[currentMapIdx].team2_score
                };
              }
              
              return updatedMaps;
            }
            
            return prevMatch.maps;
          })(),
          
          // Update match status for immediate UI changes
          status: scoreData.status || prevMatch.status,
          
          // Update current map for immediate map switching
          current_map: scoreData.current_map || scoreData.currentMap || scoreData.current_map_number || prevMatch.current_map,
          current_map_number: scoreData.current_map_number || scoreData.current_map || prevMatch.current_map_number,
          
          // Ensure timestamps update to trigger re-renders
          updated_at: new Date().toISOString(),
          live_update_timestamp: Date.now()
        };
        
        console.log('✅ Match updated with live data');
        return updatedMatch;
      });

    // Update current map index if specified in the update
    if (scoreData.current_map_number && scoreData.current_map_number !== currentMapIndex + 1) {
      console.log(`🗺️ Switching to map ${scoreData.current_map_number}`);
      setCurrentMapIndex(scoreData.current_map_number - 1);
    } else if (scoreData.current_map && scoreData.current_map !== currentMapIndex + 1) {
      console.log(`🗺️ Switching to map ${scoreData.current_map}`);
      setCurrentMapIndex(scoreData.current_map - 1);
    }
  }, [currentMapIndex]);

  // REMOVED: Auto-calculation logic that was overriding live scores
  // The match scores should ONLY come from the API or live updates, never calculated

  // Subscribe to live score updates when match loads
  useEffect(() => {
    const matchIdValue = getMatchId();
    
    if (matchIdValue && match) {
      console.log(`🔔 MatchDetailPage subscribing to efficient live updates for match ${matchIdValue}`);
      
      // Subscribe to liveScoreSync for immediate local updates via localStorage
      const unsubscribe = liveScoreSync.subscribe(matchIdValue, handleLiveScoreUpdate);
      unsubscribeRef.current = unsubscribe;
      setConnectionStatus('connected');
      
      return () => {
        console.log(`🔕 MatchDetailPage unsubscribing from live updates for match ${matchIdValue}`);
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
        setConnectionStatus('disconnected');
      };
    }
  }, [match?.id, handleLiveScoreUpdate]);

  // REMOVED: localStorage refresh to prevent reload loops
  // Live updates now happen through real-time mechanisms only

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, []);
  
  // Get match ID from props or URL
  const getMatchId = () => {
    if (matchId) return matchId;
    const pathParts = window.location.pathname.split('/');
    const matchIndex = pathParts.indexOf('match');
    if (matchIndex !== -1 && pathParts[matchIndex + 1]) {
      return pathParts[matchIndex + 1];
    }
    return null;
  };

  // CRITICAL: Load match data with SSE connection for real-time updates
  useEffect(() => {
    const loadMatch = async () => {
      const id = getMatchId();
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        console.log('MatchDetailPage: Loading match data for ID:', id);
        const response = await api.get(`/matches/${id}`);
        const data = response?.data || response;
        
        console.log('MatchDetailPage: Loaded match data:', data);
        
        // CRITICAL: Handle the actual API response structure
        let matchData;
        if (data.data) {
          // API returns { success: true, data: { match details } }
          matchData = data.data;
        } else if (data.match) {
          matchData = data.match;
        } else if (data.id) {
          matchData = data;
        }
        
        if (matchData) {
          // Ensure maps data is properly structured first
          const mapsData = matchData.score?.maps || matchData.maps_data || matchData.maps || [];
          
          // Calculate overall score from map wins if not explicitly provided
          const overallScore = calculateOverallScore(mapsData);
          const hasExplicitScore = (matchData.team1_score !== undefined && matchData.team1_score !== null) || 
                                   (matchData.score?.team1 !== undefined && matchData.score?.team1 !== null);
          
          console.log('🏆 Match loading - Explicit score:', hasExplicitScore, 'Calculated score:', overallScore);
          
          // Transform API response to frontend-expected format
          const transformedMatch = {
            ...matchData,
            // FIXED: Always use direct API fields first, prioritizing live scoring fields
            team1_score: matchData.team1_score ?? matchData.series_score_team1 ??
                        matchData.score?.team1 ?? 
                        (hasExplicitScore ? 0 : overallScore.team1Score),
            team2_score: matchData.team2_score ?? matchData.series_score_team2 ??
                        matchData.score?.team2 ?? 
                        (hasExplicitScore ? 0 : overallScore.team2Score),
            // Store both formats for compatibility
            series_score_team1: matchData.series_score_team1 ?? matchData.team1_score ?? 0,
            series_score_team2: matchData.series_score_team2 ?? matchData.team2_score ?? 0,
            // Ensure maps data is properly structured
            maps: mapsData,
            // Handle URL structure: API returns broadcast object with arrays
            stream_url: matchData.broadcast?.streams?.[0] || matchData.stream_url,
            betting_url: matchData.broadcast?.betting?.[0] || matchData.betting_url, 
            vod_url: matchData.broadcast?.vods?.[0] || matchData.vod_url,
            // Preserve broadcast object for multiple URLs
            broadcast: matchData.broadcast || {
              streams: matchData.stream_url ? [matchData.stream_url] : [],
              betting: matchData.betting_url ? [matchData.betting_url] : [],
              vods: matchData.vod_url ? [matchData.vod_url] : []
            },
            // Ensure status and format are available
            status: matchData.match_info?.status || matchData.status || 'upcoming',
            format: matchData.format || 'BO3',
            // Map current_map from match_info if available
            current_map: matchData.match_info?.current_map || matchData.current_map || 1,
            // Ensure event info is available
            event: matchData.event || null,
            // Schedule info
            scheduled_at: matchData.match_info?.scheduled_at || matchData.scheduled_at,
            // Round info
            round: matchData.round || matchData.match_info?.round || null
          };
          
          console.log('MatchDetailPage: Transformed match data:', transformedMatch);
          setMatch(transformedMatch);
          
          // Real-time updates will be automatically enabled via LiveScoreSync
          console.log('Match loaded. Live updates enabled via LiveScoreSync for status:', transformedMatch.status);
        }
      } catch (error) {
        console.error('MatchDetailPage: Error loading match:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMatch();
  }, [matchId, api, calculateOverallScore]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading match...</div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-400">Match not found</div>
      </div>
    );
  }

  // Get current map data with fallbacks - ENHANCED for API response structure
  const currentMapData = {
    team1Players: match.maps?.[currentMapIndex]?.team1_composition || 
                  match.maps?.[currentMapIndex]?.team1_players || 
                  match.team1?.players || 
                  match.team1?.roster || [],
    team2Players: match.maps?.[currentMapIndex]?.team2_composition || 
                  match.maps?.[currentMapIndex]?.team2_players || 
                  match.team2?.players || 
                  match.team2?.roster || [],
    mapName: match.maps?.[currentMapIndex]?.map_name || 
             match.maps?.[currentMapIndex]?.mapName || 
             'TBD',
    gameMode: match.maps?.[currentMapIndex]?.game_mode || 
              match.maps?.[currentMapIndex]?.mode || 
              'TBD',
    team1Score: match.maps?.[currentMapIndex]?.team1_score || 0,
    team2Score: match.maps?.[currentMapIndex]?.team2_score || 0
  };

  // Determine number of maps for format
  const getMapCount = () => {
    if (match.format === 'BO1') return 1;
    if (match.format === 'BO3') return 3;
    if (match.format === 'BO5') return 5;
    if (match.format === 'BO7') return 7;
    return 3; // Default to BO3
  };

  return (
    <MatchDetailErrorBoundary>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* VLR.gg Style Container */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        
        {/* Match Header - VLR Style */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigateTo && navigateTo('matches')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors"
              >
                ← Back to Matches
              </button>
              <div className="flex items-center space-x-4">
                {/* Enhanced Live Updates Status */}
                {match?.status === 'live' && (
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded text-sm transition-colors ${
                      connectionStatus?.hasLocalConnection && connectionStatus?.serviceStatus?.status === 'connected'
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : connectionStatus?.serviceStatus?.status === 'reconnecting'
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' 
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      <div className={`w-2 h-2 rounded-full ${
                        connectionStatus?.hasLocalConnection && connectionStatus?.serviceStatus?.status === 'connected'
                          ? 'bg-green-500 animate-pulse'
                          : connectionStatus?.serviceStatus?.status === 'reconnecting'
                          ? 'bg-yellow-500 animate-spin'
                          : 'bg-red-500 animate-pulse'
                      }`}></div>
                      {connectionStatus?.hasLocalConnection && connectionStatus?.serviceStatus?.status === 'connected' 
                        ? `Live (${connectionStatus.serviceStatus.transport?.toUpperCase() || 'SSE'})`
                        : connectionStatus?.serviceStatus?.status === 'reconnecting'
                        ? 'Reconnecting...'
                        : 'Live Updates'
                      }
                    </div>
                    {connectionStatus?.serviceStatus?.reconnectAttempts > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Attempt {connectionStatus.serviceStatus.reconnectAttempts}
                      </div>
                    )}
                  </div>
                )}
                {/* Tournament/Event Info */}
                {(match.event?.name || match.tournament?.name) && (
                  <div 
                    className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => match.event?.id && navigateTo && navigateTo('event-detail', match.event.id)}
                  >
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {match.event?.name || match.tournament?.name}
                    </span>
                    {match.round && (
                      <span className="text-xs text-gray-500 dark:text-gray-500 ml-2">
                        • {match.round}
                      </span>
                    )}
                  </div>
                )}
                <span className={`px-3 py-1 rounded text-xs font-semibold uppercase ${
                  match.status === 'live' 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                    : match.status === 'completed' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {match.status || 'upcoming'}
                </span>
              </div>
            </div>
          </div>

          {/* Teams Score Section - Centered VLR Style */}
          <div className="py-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-12">
                
                {/* Team 1 - Clickable */}
                <div 
                  className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigateTo && navigateTo('team-detail', match.team1?.id)}
                >
                  <div className="w-20 h-20 mb-3">
                    <img
                      src={getTeamLogoUrl(match.team1)}
                      alt={match.team1?.name || 'Team 1'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.log('🖼️ Team 1 logo failed to load, using fallback');
                        e.target.src = getImageUrl(null, 'team-logo');
                      }}
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                    {match.team1?.name || 'TBD'}
                  </h2>
                  {match.team1?.country && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getCountryFlag(match.team1.country)} {match.team1.country}
                    </div>
                  )}
                </div>

                {/* Score Display with Map Boxes */}
                <div className="text-center px-8">
                  {/* Main Score */}
                  <div className="flex items-center justify-center space-x-6 mb-4">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {match.team1_score || 0}
                    </span>
                    <span className="text-2xl text-gray-400">:</span>
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {match.team2_score || 0}
                    </span>
                  </div>
                  
                  {/* Format Info */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {match.format || 'Best of 3'}
                  </div>

                  {/* Map Score Boxes */}
                  <div className="flex items-center justify-center space-x-2">
                    {Array.from({ length: getMapCount() }, (_, index) => {
                      const map = match.maps?.[index];
                      const isCurrentMap = index === currentMapIndex;
                      const team1Won = map && map.team1_score > map.team2_score;
                      const team2Won = map && map.team2_score > map.team1_score;
                      const isPlayed = map && (map.team1_score || map.team2_score);
                      
                      return (
                        <div
                          key={index}
                          onClick={() => {
                            if (map) {
                              console.log(`MatchDetailPage: Switching to map ${index + 1}:`, map);
                              setCurrentMapIndex(index);
                            }
                          }}
                          className={`relative cursor-pointer transition-all ${
                            isCurrentMap ? 'scale-110' : 'hover:scale-105'
                          }`}
                        >
                          {/* Enhanced Map Box */}
                          <div className={`w-20 h-24 rounded-lg border-2 flex flex-col items-center justify-center transition-all cursor-pointer hover:shadow-md ${
                            isCurrentMap 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg scale-105' 
                              : isPlayed
                              ? 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-blue-300'
                              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-gray-300'
                          }`}>
                            <div className={`text-xs font-medium ${isCurrentMap ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                              Map {index + 1}
                            </div>
                            
                            {/* Map Name */}
                            {map?.map_name && (
                              <div className="text-xs text-center px-1 text-gray-600 dark:text-gray-300 font-medium truncate w-full">
                                {map.map_name}
                              </div>
                            )}
                            
                            {map ? (
                              <>
                                <div className={`text-sm font-bold ${isCurrentMap ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'}`}>
                                  {map.team1_score || 0}-{map.team2_score || 0}
                                </div>
                                <div className={`text-xs ${
                                  team1Won 
                                    ? 'text-blue-600 dark:text-blue-400' 
                                    : team2Won 
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-gray-400'
                                }`}>
                                  {team1Won ? match.team1?.short_name || 'T1' : 
                                   team2Won ? match.team2?.short_name || 'T2' : 
                                   'Live'}
                                </div>
                              </>
                            ) : (
                              <div className="text-xs text-gray-400">
                                TBD
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Date/Time */}
                  {match.scheduled_at && (
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                      {new Date(match.scheduled_at).toLocaleDateString()} • {new Date(match.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                  )}
                </div>

                {/* Team 2 - Clickable */}
                <div 
                  className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigateTo && navigateTo('team-detail', match.team2?.id)}
                >
                  <div className="w-20 h-20 mb-3">
                    <img
                      src={getTeamLogoUrl(match.team2)}
                      alt={match.team2?.name || 'Team 2'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        console.log('🖼️ Team 2 logo failed to load, using fallback');
                        e.target.src = getImageUrl(null, 'team-logo');
                      }}
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400">
                    {match.team2?.name || 'TBD'}
                  </h2>
                  {match.team2?.country && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {getCountryFlag(match.team2.country)} {match.team2.country}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Current Map Info Bar */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg shadow-sm mb-4 p-4">
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-blue-700 dark:text-blue-300">Currently Viewing:</span>
              <span className="font-bold text-blue-900 dark:text-blue-100 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                Map {currentMapIndex + 1}
              </span>
            </div>
            <div className="text-blue-300 dark:text-blue-600">|</div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 dark:text-gray-400">Map:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentMapData.mapName}
              </span>
            </div>
            <div className="text-gray-300 dark:text-gray-600">|</div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 dark:text-gray-400">Mode:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentMapData.gameMode}
              </span>
            </div>
            <div className="text-gray-300 dark:text-gray-600">|</div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500 dark:text-gray-400">Score:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {currentMapData.team1Score} - {currentMapData.team2Score}
              </span>
            </div>
          </div>
        </div>

        {/* URLs Display Above Blue Box - Categorized Horizontal Layout */}
        {(match.broadcast?.streams?.length > 0 || match.broadcast?.betting?.length > 0 || match.broadcast?.vods?.length > 0 || match.stream_url || match.vod_url || match.betting_url) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4 p-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {/* Extract and categorize URLs */}
              {(() => {
                const formatUrlDisplay = (url) => {
                  if (!url) return null;
                  
                  try {
                    const urlObj = new URL(url);
                    const hostname = urlObj.hostname.toLowerCase();
                    
                    if (hostname.includes('twitch.tv')) {
                      const pathParts = urlObj.pathname.split('/').filter(p => p);
                      const channel = pathParts[0] || 'Channel';
                      return { platform: channel, display: channel, color: 'purple', category: 'streaming' };
                    } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                      // Try to extract channel name from URL patterns
                      const pathParts = urlObj.pathname.split('/').filter(p => p);
                      let channelName = 'YouTube';
                      if (pathParts.includes('c') && pathParts[pathParts.indexOf('c') + 1]) {
                        channelName = pathParts[pathParts.indexOf('c') + 1];
                      } else if (pathParts.includes('channel') && pathParts[pathParts.indexOf('channel') + 1]) {
                        channelName = pathParts[pathParts.indexOf('channel') + 1];
                      } else if (pathParts.includes('@') || pathParts[0]?.startsWith('@')) {
                        channelName = pathParts[0]?.replace('@', '') || 'YouTube';
                      }
                      return { platform: channelName, display: channelName, color: 'red', category: 'streaming' };
                    } else if (hostname.includes('kick.com')) {
                      const pathParts = urlObj.pathname.split('/').filter(p => p);
                      const channel = pathParts[0] || 'Channel';
                      return { platform: channel, display: channel, color: 'green', category: 'streaming' };
                    } else if (hostname.includes('bet') || hostname.includes('odds') || hostname.includes('stake')) {
                      const siteName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
                      return { platform: siteName, display: siteName, color: 'yellow', category: 'betting' };
                    } else {
                      // Extract site name for other URLs
                      const siteName = hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
                      return { platform: siteName, display: siteName, color: 'blue', category: 'vod' };
                    }
                  } catch {
                    return { platform: 'External Link', display: 'External Link', color: 'gray', category: 'other' };
                  }
                };
                
                // Categorize URLs
                const streamUrls = [...(match.broadcast?.streams || []), match.stream_url].filter(Boolean);
                const bettingUrls = [...(match.broadcast?.betting || []), match.betting_url].filter(Boolean);
                const vodUrls = [...(match.broadcast?.vods || []), match.vod_url].filter(Boolean);
                
                const renderUrlButtons = (urls, category) => {
                  return urls.map((url, index) => {
                    const urlInfo = formatUrlDisplay(url);
                    if (!urlInfo) return null;
                    
                    const colorClasses = {
                      purple: 'bg-purple-600 hover:bg-purple-700',
                      red: 'bg-red-600 hover:bg-red-700',
                      green: 'bg-green-600 hover:bg-green-700',
                      blue: 'bg-blue-600 hover:bg-blue-700',
                      yellow: 'bg-yellow-600 hover:bg-yellow-700',
                      gray: 'bg-gray-600 hover:bg-gray-700'
                    };
                    
                    return (
                      <a
                        key={`${category}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-3 py-1 ${colorClasses[urlInfo.color]} text-white rounded transition-colors text-xs font-medium flex items-center hover:shadow-md`}
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
                        </svg>
                        {urlInfo.platform}
                      </a>
                    );
                  });
                };
                
                const components = [];
                
                // Streaming section
                if (streamUrls.length > 0) {
                  components.push(
                    <div key="streaming" className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Streaming:</span>
                      {renderUrlButtons(streamUrls, 'streaming')}
                    </div>
                  );
                }
                
                // Add separator if needed
                if (components.length > 0 && (bettingUrls.length > 0 || vodUrls.length > 0)) {
                  components.push(
                    <div key="sep1" className="text-gray-300 dark:text-gray-600">|</div>
                  );
                }
                
                // Betting section
                if (bettingUrls.length > 0) {
                  components.push(
                    <div key="betting" className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Betting:</span>
                      {renderUrlButtons(bettingUrls, 'betting')}
                    </div>
                  );
                }
                
                // Add separator if needed
                if ((streamUrls.length > 0 || bettingUrls.length > 0) && vodUrls.length > 0) {
                  components.push(
                    <div key="sep2" className="text-gray-300 dark:text-gray-600">|</div>
                  );
                }
                
                // VOD section
                if (vodUrls.length > 0) {
                  components.push(
                    <div key="vod" className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">VOD:</span>
                      {renderUrlButtons(vodUrls, 'vod')}
                    </div>
                  );
                }
                
                return components;
              })()}
            </div>
          </div>
        )}

        {/* Match Statistics - Complete Marvel Rivals Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-4">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Match Statistics - Map {currentMapIndex + 1}: {currentMapData.mapName}
              </h3>
              {user && (user.role === 'admin' || user.role === 'moderator') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowLiveScoring(!showLiveScoring)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                  >
                    Live Scoring
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {/* Team 1 Stats Table */}
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th colSpan="9" className="px-6 py-3 text-left">
                    <span 
                      className="text-sm font-semibold text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                      onClick={() => navigateTo && navigateTo('team-detail', match.team1?.id)}
                    >
                      {match.team1?.name || 'TBD'}
                    </span>
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700 text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  <th className="px-6 py-3 text-left font-medium">Player</th>
                  <th className="px-3 py-3 text-center font-medium">Hero</th>
                  <th className="px-3 py-3 text-center font-medium">K</th>
                  <th className="px-3 py-3 text-center font-medium">D</th>
                  <th className="px-3 py-3 text-center font-medium">A</th>
                  <th className="px-3 py-3 text-center font-medium">KDA</th>
                  <th className="px-3 py-3 text-center font-medium">DMG</th>
                  <th className="px-3 py-3 text-center font-medium">Heal</th>
                  <th className="px-3 py-3 text-center font-medium">BLK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentMapData.team1Players.length > 0 ? (
                  currentMapData.team1Players.map((player, index) => {
                    // Extract username from quoted text or use dedicated username field
                    const extractUsername = (playerObj) => {
                      // First priority: dedicated username field
                      if (playerObj.username) return playerObj.username;
                      
                      // Second priority: extract from quoted text in name - handle both single and double quotes
                      if (playerObj.name) {
                        // Try double quotes first: Mikkel "Sypeh" Klein -> Sypeh
                        const doubleQuoteMatch = playerObj.name.match(/"([^"]+)"/); 
                        if (doubleQuoteMatch) return doubleQuoteMatch[1];
                        
                        // Try single quotes: Mikkel 'Sypeh' Klein -> Sypeh
                        const singleQuoteMatch = playerObj.name.match(/'([^']+)'/); 
                        if (singleQuoteMatch) return singleQuoteMatch[1];
                        
                        // Handle format with quotes at the end: "Sypeh" Klein Mikkel -> Sypeh
                        const endQuoteMatch = playerObj.name.match(/^"([^"]+)"/); 
                        if (endQuoteMatch) return endQuoteMatch[1];
                      }
                      
                      // Fallback to player_name or full name
                      return playerObj.player_name || playerObj.name || 'Unknown';
                    };
                    
                    // ENHANCED: Handle multiple player data formats from API - Show ONLY username
                    const playerData = {
                      id: player.id || player.player_id,
                      name: extractUsername(player),
                      country: player.country || player.nationality || 'US',
                      hero: player.hero || player.current_hero || 'Captain America',
                      eliminations: player.eliminations || player.kills || 0,
                      deaths: player.deaths || 0,
                      assists: player.assists || 0,
                      damage: player.damage || 0,
                      healing: player.healing || 0,
                      damage_blocked: player.damage_blocked || player.damage_mitigated || player.damageBlocked || 0
                    };
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-3">
                          <div 
                            className="flex items-center space-x-2 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={() => navigateTo && navigateTo('player-detail', playerData.id)}
                          >
                            <span className="text-sm">{getCountryFlag(playerData.country)}</span>
                            <span className="font-medium text-sm">{playerData.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center">
                            <HeroImage 
                              heroName={playerData.hero}
                              size="sm"
                              showRole={false}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-medium">{playerData.eliminations}</td>
                        <td className="px-3 py-3 text-center text-sm">{playerData.deaths}</td>
                        <td className="px-3 py-3 text-center text-sm">{playerData.assists}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium">
                          {((playerData.eliminations + playerData.assists) / Math.max(playerData.deaths, 1)).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {playerData.damage ? `${(playerData.damage / 1000).toFixed(1)}k` : '-'}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {playerData.healing ? `${(playerData.healing / 1000).toFixed(1)}k` : '-'}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {playerData.damage_blocked ? `${(playerData.damage_blocked / 1000).toFixed(1)}k` : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No player data available for this map
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Team 2 Stats Table */}
            <table className="w-full mt-6">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th colSpan="9" className="px-6 py-3 text-left">
                    <span 
                      className="text-sm font-semibold text-red-600 dark:text-red-400 cursor-pointer hover:underline"
                      onClick={() => navigateTo && navigateTo('team-detail', match.team2?.id)}
                    >
                      {match.team2?.name || 'TBD'}
                    </span>
                  </th>
                </tr>
                <tr className="bg-gray-50 dark:bg-gray-700 text-xs uppercase tracking-wider text-gray-600 dark:text-gray-300">
                  <th className="px-6 py-3 text-left font-medium">Player</th>
                  <th className="px-3 py-3 text-center font-medium">Hero</th>
                  <th className="px-3 py-3 text-center font-medium">K</th>
                  <th className="px-3 py-3 text-center font-medium">D</th>
                  <th className="px-3 py-3 text-center font-medium">A</th>
                  <th className="px-3 py-3 text-center font-medium">KDA</th>
                  <th className="px-3 py-3 text-center font-medium">DMG</th>
                  <th className="px-3 py-3 text-center font-medium">Heal</th>
                  <th className="px-3 py-3 text-center font-medium">BLK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentMapData.team2Players.length > 0 ? (
                  currentMapData.team2Players.map((player, index) => {
                    // Extract username from quoted text or use dedicated username field
                    const extractUsername = (playerObj) => {
                      // First priority: dedicated username field
                      if (playerObj.username) return playerObj.username;
                      
                      // Second priority: extract from quoted text in name - handle both single and double quotes
                      if (playerObj.name) {
                        // Try double quotes first: Mikkel "Sypeh" Klein -> Sypeh
                        const doubleQuoteMatch = playerObj.name.match(/"([^"]+)"/); 
                        if (doubleQuoteMatch) return doubleQuoteMatch[1];
                        
                        // Try single quotes: Mikkel 'Sypeh' Klein -> Sypeh
                        const singleQuoteMatch = playerObj.name.match(/'([^']+)'/); 
                        if (singleQuoteMatch) return singleQuoteMatch[1];
                        
                        // Handle format with quotes at the end: "Sypeh" Klein Mikkel -> Sypeh
                        const endQuoteMatch = playerObj.name.match(/^"([^"]+)"/); 
                        if (endQuoteMatch) return endQuoteMatch[1];
                      }
                      
                      // Fallback to player_name or full name
                      return playerObj.player_name || playerObj.name || 'Unknown';
                    };
                    
                    // ENHANCED: Handle multiple player data formats from API - Show ONLY username
                    const playerData = {
                      id: player.id || player.player_id,
                      name: extractUsername(player),
                      country: player.country || player.nationality || 'US',
                      hero: player.hero || player.current_hero || 'Captain America',
                      eliminations: player.eliminations || player.kills || 0,
                      deaths: player.deaths || 0,
                      assists: player.assists || 0,
                      damage: player.damage || 0,
                      healing: player.healing || 0,
                      damage_blocked: player.damage_blocked || player.damage_mitigated || player.damageBlocked || 0
                    };
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-3">
                          <div 
                            className="flex items-center space-x-2 cursor-pointer hover:text-red-600 dark:hover:text-red-400"
                            onClick={() => navigateTo && navigateTo('player-detail', playerData.id)}
                          >
                            <span className="text-sm">{getCountryFlag(playerData.country)}</span>
                            <span className="font-medium text-sm">{playerData.name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center">
                            <HeroImage 
                              heroName={playerData.hero}
                              size="sm"
                              showRole={false}
                            />
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-medium">{playerData.eliminations}</td>
                        <td className="px-3 py-3 text-center text-sm">{playerData.deaths}</td>
                        <td className="px-3 py-3 text-center text-sm">{playerData.assists}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium">
                          {((playerData.eliminations + playerData.assists) / Math.max(playerData.deaths, 1)).toFixed(2)}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {playerData.damage ? `${(playerData.damage / 1000).toFixed(1)}k` : '-'}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {playerData.healing ? `${(playerData.healing / 1000).toFixed(1)}k` : '-'}
                        </td>
                        <td className="px-3 py-3 text-center text-sm">
                          {playerData.damage_blocked ? `${(playerData.damage_blocked / 1000).toFixed(1)}k` : '-'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No player data available for this map
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Forum-Style Match Comments */}
        <MatchComments 
          matchId={getMatchId()} 
          navigateTo={navigateTo}
        />

        {/* Enhanced Live Scoring Panel */}
        <UnifiedLiveScoring
          isOpen={showLiveScoring}
          match={match}
          onClose={() => setShowLiveScoring(false)}
          onUpdate={handleMatchUpdate}
        />
      </div>
      </div>
    </MatchDetailErrorBoundary>
  );
}

// Export wrapped component
const WrappedMatchDetailPage = (props) => (
  <MatchDetailErrorBoundary>
    <MatchDetailPage {...props} />
  </MatchDetailErrorBoundary>
);

export default WrappedMatchDetailPage;