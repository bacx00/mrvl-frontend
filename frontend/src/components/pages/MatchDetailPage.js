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
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { user, isAuthenticated, api } = useAuth();
  
  // 🔥 CRITICAL: FIXED BACKEND URL LOADING
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

  console.log('🔍 MatchDetailPage: Using backend URL:', BACKEND_URL);

  // 🦸 HERO IMAGE SYSTEM WITH FALLBACKS
  const getHeroImageWithFallback = (heroName) => {
    if (!heroName) return null;
    
    // Try to get hero image
    const imageUrl = getHeroImageSync(heroName);
    if (imageUrl) return imageUrl;
    
    // Try alternative hero names
    const alternativeNames = {
      'Iron Man': 'iron_man',
      'Spider-Man': 'spider_man',
      'Black Widow': 'black_widow',
      'Doctor Strange': 'doctor_strange',
      'Captain America': 'captain_america',
      'Winter Soldier': 'winter_soldier',
      'Star-Lord': 'star_lord',
      'Rocket Raccoon': 'rocket_raccoon',
      'Jeff the Land Shark': 'jeff',
      'Luna Snow': 'luna_snow',
      'Adam Warlock': 'adam_warlock',
      'Cloak & Dagger': 'cloak_dagger',
      'Squirrel Girl': 'squirrel_girl'
    };
    
    const altName = alternativeNames[heroName];
    if (altName) {
      const altImage = getHeroImageSync(altName);
      if (altImage) return altImage;
    }
    
    // No image found, use fallback
    return null;
  };

  // 🎮 MARVEL RIVALS GAME MODE TIMERS
  const getGameModeTimer = (mode) => {
    const modeTimers = {
      'Convoy': { duration: 18 * 60, displayName: 'Convoy', color: 'blue' }, // 18 minutes
      'Domination': { duration: 12 * 60, displayName: 'Domination', color: 'red' }, // 12 minutes
      'Convergence': { duration: 15 * 60, displayName: 'Convergence', color: 'purple' }, // 15 minutes
      'Conquest': { duration: 20 * 60, displayName: 'Conquest', color: 'green' }, // 20 minutes
      'Doom Match': { duration: 10 * 60, displayName: 'Doom Match', color: 'orange' }, // 10 minutes
      'Escort': { duration: 16 * 60, displayName: 'Escort', color: 'yellow' } // 16 minutes
    };
    
    return modeTimers[mode] || { duration: 15 * 60, displayName: mode || 'Unknown', color: 'gray' };
  };

  // 🚨 CRITICAL: EXTRACT MATCH ID FROM URL OR PROPS
  const getMatchId = () => {
    // Try from props first
    if (matchId) {
      console.log('🔍 MatchDetailPage: Match ID from props:', matchId);
      return matchId;
    }
    
    // Try from URL
    const urlParts = window.location.pathname.split('/');
    const matchDetailIndex = urlParts.findIndex(part => part === 'match-detail');
    if (matchDetailIndex !== -1 && urlParts[matchDetailIndex + 1]) {
      const idFromUrl = urlParts[matchDetailIndex + 1];
      console.log('🔍 MatchDetailPage: Match ID from URL:', idFromUrl);
      return idFromUrl;
    }
    
    // Try from hash route
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

  // 🔥 PERFECT REAL-TIME SYNC SYSTEM
  useEffect(() => {
    const fetchMatchData = async (showLoading = true) => {
      const realMatchId = getMatchId();
      
      if (!realMatchId) {
        console.error('❌ No match ID provided');
        if (showLoading) setLoading(false);
        return;
      }

      try {
        console.log('🔍 MatchDetailPage: Fetching REAL match', realMatchId, 'from backend...');
        
        // ✅ CORRECT ENDPOINT: Use live-scoreboard from backend documentation
        console.log(`🎯 MatchDetailPage: Using live-scoreboard endpoint for match ${realMatchId}`);
        console.log(`🔗 Full URL: ${BACKEND_URL}/matches/${realMatchId}/live-scoreboard`);
        
        if (!BACKEND_URL || BACKEND_URL === 'undefined') {
          throw new Error('Backend URL is not configured properly');
        }
        
        const response = await fetch(`${BACKEND_URL}/matches/${realMatchId}/live-scoreboard`, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            ...(api.token && { 'Authorization': `Bearer ${api.token}` })
          }
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const apiResponse = await response.json();
        console.log('📥 Live scoreboard response:', apiResponse);
        
        if (apiResponse.success && apiResponse.data) {
          const data = apiResponse.data;
          
          // ✅ CORRECT STRUCTURE: Backend actually returns data.match (not data.match_info)
          const matchData = data.match || {};
          let team1Players = [];
          let team2Players = [];
          
          // ✅ PARSE MAPS_DATA JSON STRING to get player compositions
          if (matchData.maps_data) {
            try {
              const mapsData = JSON.parse(matchData.maps_data);
              if (mapsData && mapsData[0]) {
                const mapData = mapsData[0];
                team1Players = mapData.team1_composition || [];
                team2Players = mapData.team2_composition || [];
                
                console.log('✅ Parsed team compositions:', {
                  team1Count: team1Players.length,
                  team2Count: team2Players.length,
                  team1Sample: team1Players[0],
                  team2Sample: team2Players[0]
                });
              }
            } catch (error) {
              console.error('❌ Error parsing maps_data JSON:', error);
            }
          }
          
          const transformedMatch = {
            id: matchData.id || realMatchId,
            status: matchData.status || 'unknown',
            team1_score: matchData.team1_score || 0,
            team2_score: matchData.team2_score || 0,
            format: matchData.format || matchData.match_format || 'BO1',
            currentMap: matchData.current_map || 'Tokyo 2099: Shibuya Sky',
            gameMode: data.live_data?.current_mode || 'Domination',
            viewers: matchData.viewers || 0,
            
            // Teams from live-scoreboard response
            team1: {
              id: matchData.team1_id,
              name: matchData.team1_name || 'Team 1',
              logo: matchData.team1_logo || '',
              players: team1Players
            },
            team2: {
              id: matchData.team2_id, 
              name: matchData.team2_name || 'Team 2',
              logo: matchData.team2_logo || '',
              players: team2Players
            },
            
            // Maps and player stats from parsed compositions
            maps: [{
              mapName: matchData.current_map || 'Tokyo 2099: Shibuya Sky',
              mode: data.live_data?.current_mode || 'Domination',
              status: matchData.status,
              team1Score: matchData.team1_score || 0,
              team2Score: matchData.team2_score || 0,
              timer: getGameModeTimer(data.live_data?.current_mode),
              team1Composition: team1Players.map(player => ({
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
                damageBlocked: player.damage_blocked || 0
              })),
              team2Composition: team2Players.map(player => ({
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
                damageBlocked: player.damage_blocked || 0
              }))
            }],
            
            // Timer and other data
            currentRound: data.current_round,
            activeTimers: data.active_timers || []
          };
          
          console.log('✅ MatchDetailPage: Transformed match data:', transformedMatch);
          setMatch(transformedMatch);
          
        } else {
          console.error('❌ Failed to load match data:', apiResponse);
          setMatch(null);
        }
        
      } catch (error) {
        console.error('❌ MatchDetailPage: Error fetching REAL match data:', error);
        
        // Show detailed error information
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

    // 🔥 PERFECT REAL-TIME SYNC: Listen for cross-tab events
    const handleMatchUpdate = (event) => {
      const { detail } = event;
      const currentMatchId = getMatchId();
      console.log('🔥 MatchDetailPage: Event received:', {
        eventType: detail.type,
        eventMatchId: detail.matchId,
        currentMatchId: currentMatchId,
        willProcess: detail.matchId == currentMatchId
      });
      
      if (detail.matchId == currentMatchId) {
        console.log('🔥 MatchDetailPage: Processing real-time update:', detail.type, detail);
        
        // If we have new data in the event, use it immediately
        if (detail.matchData) {
          console.log('🚀 MatchDetailPage: Using immediate data from event:', detail.matchData);
          setMatch(detail.matchData);
        }
        
        // If scores are in the event, update immediately  
        if (detail.scores) {
          console.log('🏆 MatchDetailPage: Updating scores immediately:', detail.scores);
          setMatch(prev => prev ? {
            ...prev,
            team1_score: detail.scores.team1,
            team2_score: detail.scores.team2,
            lastUpdated: Date.now()
          } : prev);
        }
        
        // Always fetch fresh data from backend for complete sync (but silently)
        fetchMatchData(false); // Don't show loading spinner
      }
    };

    // Listen for ALL sync events
    window.addEventListener('mrvl-match-updated', handleMatchUpdate);
    window.addEventListener('mrvl-hero-updated', handleMatchUpdate);
    window.addEventListener('mrvl-stats-updated', handleMatchUpdate);
    window.addEventListener('mrvl-data-refresh', handleMatchUpdate);

    return () => {
      window.removeEventListener('mrvl-match-updated', handleMatchUpdate);
      window.removeEventListener('mrvl-hero-updated', handleMatchUpdate);
      window.removeEventListener('mrvl-stats-updated', handleMatchUpdate);
      window.removeEventListener('mrvl-data-refresh', handleMatchUpdate);
    };
  }, [matchId, api, refreshTrigger, BACKEND_URL]);

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
          <p className="text-gray-600 dark:text-gray-400">Loading real match details...</p>
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
            The match you're looking for doesn't exist in the backend database or has been removed.
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

  // Use ACTUAL match data from backend
  const currentMap = match?.maps?.[currentMapIndex] || match?.maps?.[0] || null;
  const currentMapData = currentMap ? {
    map_name: currentMap.mapName || 'Tokyo 2099: Shibuya Sky',
    mode: currentMap.mode || 'Domination',
    timer: currentMap.timer || getGameModeTimer(currentMap.mode),
    team1Players: (currentMap.team1Composition || []).map(p => ({
      ...p,
      name: p.name,
      id: p.playerId || p.id
    })),
    team2Players: (currentMap.team2Composition || []).map(p => ({
      ...p,
      name: p.name, 
      id: p.playerId || p.id
    }))
  } : {
    map_name: 'Tokyo 2099: Shibuya Sky',
    mode: 'Domination',
    timer: getGameModeTimer('Domination'),
    team1Players: [],
    team2Players: []
  };

  console.log('🎯 MatchDetailPage: Using currentMapData:', {
    mapName: currentMapData.map_name,
    mode: currentMapData.mode,
    timer: currentMapData.timer,
    team1PlayersCount: currentMapData.team1Players.length,
    team2PlayersCount: currentMapData.team2Players.length
  });

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
             '⏳ ' + match.status.toUpperCase()}
          </div>
        </div>
        
        <div className="text-lg text-gray-600 dark:text-gray-400">
          {match.format === 'BO1' ? 'Best of 1' : 
           match.format === 'BO3' ? 'Best of 3' :
           match.format === 'BO5' ? 'Best of 5' : 'Best of 1'} • {currentMapData?.map_name || 'Tokyo 2099: Shibuya Sky'}
        </div>
        
        {/* GAME MODE & TIMER INFO */}
        <div className="mt-2 flex justify-center items-center space-x-4">
          <div className={`px-3 py-1 rounded-full text-sm font-medium bg-${currentMapData.timer.color}-100 text-${currentMapData.timer.color}-800 dark:bg-${currentMapData.timer.color}-900/20 dark:text-${currentMapData.timer.color}-400`}>
            🎮 {currentMapData.timer.displayName}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            ⏱️ Match Duration: {Math.floor(currentMapData.timer.duration / 60)}m
          </div>
        </div>
        
        {/* LIVE MATCH TIMER */}
        {match.status === 'live' && (
          <div className="mt-4 flex justify-center">
            <div className="bg-red-600 text-white px-6 py-2 rounded-lg font-mono text-xl font-bold animate-pulse">
              🔴 LIVE • {matchTimer}
            </div>
          </div>
        )}
      </div>

      {/* SCORE DISPLAY */}
      <div className="bg-gradient-to-r from-blue-50 to-red-50 dark:from-blue-900/20 dark:to-red-900/20 rounded-lg p-8">
        <div className="flex items-center justify-center space-x-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{match.team1?.name}</h2>
            <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">{match.team1_score || 0}</div>
          </div>
          
          <div className="text-center">
            <div className="text-4xl text-gray-500 dark:text-gray-500">VS</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {match.format === 'BO1' ? 'Best of 1' : 
               match.format === 'BO3' ? 'Best of 3' :
               match.format === 'BO5' ? 'Best of 5' : 'Best of 1'}
              <br />
              <span className="text-blue-600 dark:text-blue-400 font-semibold">
                {currentMapData?.mode || 'Domination'}
              </span>
            </div>
          </div>
          
          <div className="text-center">
            <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">{match.team2?.name}</h2>
            <div className="text-6xl font-bold text-red-600 dark:text-red-400">{match.team2_score || 0}</div>
          </div>
        </div>
        
        {/* Stream & Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8">
          {(match.streamUrl || match.status === 'live') && (
            <a
              href={match.streamUrl || 'https://twitch.tv/marvelrivals'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span className="text-lg mr-2">📺</span>
              <span className="font-semibold">Watch Stream</span>
            </a>
          )}
        </div>
      </div>

      {/* MATCH STATISTICS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Match Statistics</h3>
          
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
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">{match.team1.name}</div>
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
                      {getHeroImageWithFallback(player.hero) ? (
                        <img 
                          src={getHeroImageWithFallback(player.hero)}
                          alt={player.hero}
                          className="w-10 h-10 object-cover rounded border-2 border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* Enhanced Text Fallback */}
                      <div 
                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-center leading-tight text-white bg-gradient-to-br from-blue-500 to-purple-600 rounded border-2 border-gray-300 dark:border-gray-600 shadow-md"
                        style={{ display: getHeroImageWithFallback(player.hero) ? 'none' : 'flex' }}
                        title={`${player.hero} (${getHeroRole(player.hero)}) - Image not available`}
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

          {/* Team 2 Box */}
          <div className="border border-gray-200 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800/50">
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">{match.team2.name}</div>
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
                      {getHeroImageWithFallback(player.hero) ? (
                        <img 
                          src={getHeroImageWithFallback(player.hero)}
                          alt={player.hero}
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
                        title={`${player.hero} (${getHeroRole(player.hero)}) - Image not available`}
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