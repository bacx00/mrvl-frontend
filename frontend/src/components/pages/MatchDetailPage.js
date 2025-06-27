import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getHeroImageSync, getHeroRole } from '../../utils/imageUtils';
import MatchAPI from '../../api/MatchAPI'; // 🎯 CRITICAL: Data transformation layer

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
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add refresh trigger
  
  const { user, isAuthenticated, api } = useAuth();
  
  // 🔥 CRITICAL: REAL BACKEND API BASE URL FROM ENV ONLY
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  console.log('🔍 MatchDetailPage: Using backend URL:', BACKEND_URL);

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
        if (showLoading) {
          console.log(`🔍 MatchDetailPage: Fetching REAL match ${realMatchId} from backend...`);
        }
        
        // 🚨 CRITICAL FIX: Use SCOREBOARD endpoint via MatchAPI for complete data
        console.log(`🎯 MatchDetailPage: Loading COMPLETE match data using MatchAPI.loadCompleteMatch(${realMatchId})`);
        const matchData = await MatchAPI.loadCompleteMatch(realMatchId, api);
        console.log('✅ MatchDetailPage: COMPLETE match data with heroes/logos loaded:', matchData);
        
        if (showLoading) {
          console.log('✅ MatchDetailPage: REAL match data received:', matchData);
        }
        
        // 🚨 CRITICAL FIX: Use the complete match data from MatchAPI with all player compositions
        if (matchData) {
          console.log('🔥 MatchDetailPage: Setting complete match with player compositions:', {
            team1_score: matchData.team1?.score || 0,
            team2_score: matchData.team2?.score || 0,
            status: matchData.status,
            mapCount: matchData.maps?.length,
            team1PlayersCount: matchData.maps?.[0]?.team1Composition?.length,
            team2PlayersCount: matchData.maps?.[0]?.team2Composition?.length
          });
          
          setMatch(matchData);
        } else {
          console.error('❌ No match data received from MatchAPI');
          setMatch(null);
        }
        
      } catch (error) {
        console.error('❌ MatchDetailPage: Error fetching REAL match data:', error);
        
        // 🚨 CRITICAL: NO MOCK DATA FALLBACK - SHOW ERROR
        setMatch(null);
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchMatchData();

    // 🔥 PERFECT REAL-TIME SYNC: Listen for multiple event types
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
        
        // 🚨 CRITICAL: If we have new data in the event, use it immediately
        if (detail.matchData) {
          console.log('🚀 MatchDetailPage: Using immediate data from event:', detail.matchData);
          setMatch(detail.matchData);
        }
        
        // 🚨 CRITICAL: If scores are in the event, update immediately  
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

    const handleHeroUpdate = (event) => {
      const { detail } = event;
      const currentMatchId = getMatchId();
      console.log('🦸 MatchDetailPage: Hero event received:', {
        eventMatchId: detail.matchId,
        currentMatchId: currentMatchId,
        willProcess: detail.matchId == currentMatchId
      });
      
      if (detail.matchId == currentMatchId) {
        console.log('🦸 MatchDetailPage: Hero update received:', detail);
        fetchMatchData(false); // Refresh without loading
      }
    };

    const handleStatsUpdate = (event) => {
      const { detail } = event;
      const currentMatchId = getMatchId();
      console.log('📊 MatchDetailPage: Stats event received:', {
        eventMatchId: detail.matchId,
        currentMatchId: currentMatchId,
        willProcess: detail.matchId == currentMatchId
      });
      
      if (detail.matchId == currentMatchId) {
        console.log('📊 MatchDetailPage: Stats update received:', detail);
        
        // 🚨 CRITICAL: If scores are included, update immediately
        if (detail.scores) {
          console.log('🏆 MatchDetailPage: Updating scores immediately from stats event:', detail.scores);
          setMatch(prev => prev ? {
            ...prev,
            team1_score: detail.scores.team1,
            team2_score: detail.scores.team2,
            lastUpdated: Date.now()
          } : prev);
        }
        
        fetchMatchData(false); // Refresh without loading
      }
    };

    // Listen for ALL sync events
    window.addEventListener('mrvl-match-updated', handleMatchUpdate);
    window.addEventListener('mrvl-hero-updated', handleHeroUpdate);
    window.addEventListener('mrvl-stats-updated', handleStatsUpdate);
    window.addEventListener('mrvl-data-refresh', handleMatchUpdate);

    return () => {
      window.removeEventListener('mrvl-match-updated', handleMatchUpdate);
      window.removeEventListener('mrvl-hero-updated', handleHeroUpdate);
      window.removeEventListener('mrvl-stats-updated', handleStatsUpdate);
      window.removeEventListener('mrvl-data-refresh', handleMatchUpdate);
    };
  }, [matchId, api]);

  // 🔴 CRITICAL: Listen for timer updates from ComprehensiveLiveScoring
  useEffect(() => {
    const handleTimerUpdate = (event) => {
      const { detail } = event;
      const currentMatchId = getMatchId();
      console.log('🔍 Timer event received:', {
        eventMatchId: detail.matchId,
        currentMatchId: currentMatchId,
        timer: detail.timer,
        matches: detail.matchId == currentMatchId
      });
      
      if (detail.matchId == currentMatchId && detail.timer) {
        console.log('⏰ MatchDetailPage: Timer sync received:', detail.timer);
        setMatchTimer(detail.timer);
      }
    };

    // 🚀 CROSS-TAB SYNC: Listen for localStorage changes 
    const handleStorageChange = (event) => {
      if (event.key === 'mrvl-timer-sync' && event.newValue) {
        try {
          const timerData = JSON.parse(event.newValue);
          const currentMatchId = getMatchId();
          console.log('🔄 Cross-tab timer sync received:', {
            eventMatchId: timerData.matchId,
            currentMatchId: currentMatchId,
            timer: timerData.timer,
            action: timerData.action,
            matches: timerData.matchId == currentMatchId
          });
          
          if (timerData.matchId == currentMatchId && timerData.timer) {
            console.log('⏰ MatchDetailPage: Cross-tab timer sync received:', timerData.timer);
            setMatchTimer(timerData.timer);
          }
        } catch (error) {
          console.error('❌ Error parsing timer sync data:', error);
        }
      }
      
      // 🚀 CROSS-TAB SYNC: Listen for match/score/hero updates
      if (event.key === 'mrvl-match-sync' && event.newValue) {
        try {
          const matchData = JSON.parse(event.newValue);
          const currentMatchId = getMatchId();
          console.log('🔄 Cross-tab match sync received:', {
            eventMatchId: matchData.matchId,
            currentMatchId: currentMatchId,
            type: matchData.type,
            action: matchData.action,
            matches: matchData.matchId == currentMatchId
          });
          
          if (matchData.matchId == currentMatchId) {
            console.log('⚽ MatchDetailPage: Cross-tab match sync - refreshing data');
            // Refresh match data to get latest scores/heroes
            fetchMatchData(false); // false = don't show loading spinner
          }
        } catch (error) {
          console.error('❌ Error parsing match sync data:', error);
        }
      }
      
      // 🚀 CROSS-TAB SYNC: Listen for match/score/hero updates
      if (event.key === 'mrvl-match-sync' && event.newValue) {
        try {
          const matchData = JSON.parse(event.newValue);
          const currentMatchId = getMatchId();
          console.log('🔄 Cross-tab match sync received:', {
            eventMatchId: matchData.matchId,
            currentMatchId: currentMatchId,
            type: matchData.type,
            action: matchData.action,
            matches: matchData.matchId == currentMatchId
          });
          
          if (matchData.matchId == currentMatchId) {
            console.log('⚽ MatchDetailPage: Cross-tab match sync - refreshing data');
            // Refresh match data to get latest scores/heroes
            fetchMatchData(false); // false = don't show loading spinner
          }
        } catch (error) {
          console.error('❌ Error parsing match sync data:', error);
        }
      }
    };
    
    window.addEventListener('mrvl-timer-updated', handleTimerUpdate);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('mrvl-timer-updated', handleTimerUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Remove getMatchId dependency to prevent re-setup

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

  const submitReply = async (parentId) => {
    if (!replyText.trim()) return;
    
    try {
      const currentMatchId = getMatchId();
      const response = await api.post(`/matches/${currentMatchId}/comments`, {
        content: replyText,
        parent_id: parentId
      });
      
      if (response?.data) {
        setComments(prev => [response.data, ...prev]);
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('❌ Error submitting reply:', error);
      alert('Error submitting reply. Please try again.');
    }
  };

  const voteOnComment = async (commentId, voteType) => {
    try {
      await api.post(`/comments/${commentId}/vote`, { vote_type: voteType });
      
      // Update local state
      const voteKey = `${commentId}_${user?.id}`;
      setUserVotes(prev => ({ ...prev, [voteKey]: voteType }));
      
      // Update comment counts
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const newComment = { ...comment };
          if (voteType === 'like') {
            newComment.likes = (newComment.likes || 0) + 1;
          } else {
            newComment.dislikes = (newComment.dislikes || 0) + 1;
          }
          return newComment;
        }
        return comment;
      }));
    } catch (error) {
      console.error('❌ Error voting on comment:', error);
    }
  };

  const deleteComment = async (commentId) => {
    try {
      await api.delete(`/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
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

  // 🎯 CRITICAL FIX: Use ACTUAL match data from MatchAPI.loadCompleteMatch() 
  // This includes complete player compositions with heroes, stats, and countries
  const currentMap = match?.maps?.[currentMapIndex] || match?.maps?.[0] || null;
  const currentMapData = currentMap ? {
    map_name: currentMap.mapName || 'Tokyo 2099: Shibuya Sky',
    mode: currentMap.mode || 'Domination',
    team1Players: (currentMap.team1Composition || []).map(p => ({
      ...p,
      name: p.playerName || p.name,
      id: p.playerId || p.id
    })),
    team2Players: (currentMap.team2Composition || []).map(p => ({
      ...p,
      name: p.playerName || p.name, 
      id: p.playerId || p.id
    }))
  } : {
    map_name: 'Tokyo 2099: Shibuya Sky',
    mode: 'Domination',
    team1Players: [],
    team2Players: []
  };

  console.log('🎯 MatchDetailPage: Using currentMapData:', {
    mapName: currentMapData.map_name,
    mode: currentMapData.mode,
    team1PlayersCount: currentMapData.team1Players.length,
    team2PlayersCount: currentMapData.team2Players.length,
    team1Players: currentMapData.team1Players.map(p => ({ name: p.playerName, hero: p.hero })),
    team2Players: currentMapData.team2Players.map(p => ({ name: p.playerName, hero: p.hero }))
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
          {/* 🔥 FIXED: CORRECT BO FORMAT DISPLAY */}
          {match.format === 'BO1' ? 'Best of 1' : 
           match.format === 'BO3' ? 'Best of 3' :
           match.format === 'BO5' ? 'Best of 5' : 'Best of 1'} • {currentMapData?.map_name || 'Tokyo 2099: Shibuya Sky'}
        </div>
        
        {/* 🔴 LIVE MATCH TIMER - SYNCED WITH LIVE SCORING */}
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
              {/* 🔥 FIXED: CORRECT BO FORMAT DISPLAY */}
              {match.format === 'BO1' ? 'Best of 1' : 
               match.format === 'BO3' ? 'Best of 3' :
               match.format === 'BO5' ? 'Best of 5' : 'Best of 1'}
              {/* 🎮 GAME MODE DISPLAY */}
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
        
        {/* 🔗 STREAM, VOD & BETTING BUTTONS - MOVED BELOW SCORES */}
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
          <button className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
            <span className="text-lg mr-2">🎬</span>
            <span className="font-semibold">Watch VOD</span>
          </button>
          <button className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg hover:shadow-xl transform hover:scale-105">
            <span className="text-lg mr-2">💰</span>
            <span className="font-semibold">Place Bet</span>
          </button>
        </div>
      </div>

      {/* Map Tabs */}
      {match.maps && match.maps.length > 1 && (
        <div className="flex justify-center space-x-2">
          {match.maps.map((map, index) => (
            <button
              key={index}
              onClick={() => setCurrentMapIndex(index)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                currentMapIndex === index
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              Map {index + 1}: {map.map_name}
            </button>
          ))}
        </div>
      )}

      {/* MATCH STATISTICS */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Match Statistics</h3>
          
          {/* 🛠️ ADMIN LINK - Professional VLR.gg Style */}
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
            <div 
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={() => {
                console.log('🔗 MatchDetailPage: Navigating to team profile:', match.team1.name);
                navigateTo && navigateTo('team-detail', { id: match.team1.id });
              }}
            >
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">{match.team1.name}</div>
            </div>
            <div className="space-y-1">
              {currentMapData.team1Players.map((player, index) => (
                <div
                  key={player.id}
                  className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => {
                    const playerId = player.playerId || player.id || `${match.team1?.id}_player_${index + 1}`;
                    console.log('🔗 CRITICAL FIX: Navigating to player profile:', playerId, 'Name:', player.playerName || player.name);
                    if (navigateTo && playerId) {
                      navigateTo('player-detail', { id: playerId });
                    } else {
                      console.log('⚠️ Navigation not available or player ID missing');
                    }
                  }}
                >
                  {/* ✅ ENHANCED COUNTRY FLAG SYSTEM - MULTIPLE FALLBACKS */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center" title={`Country: ${player.country}`}>
                      {/* 🚨 CRITICAL FIX: Enhanced flag system with multiple attempts */}
                      <img 
                        src={`https://flagcdn.com/24x18/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                        alt={`${player.country} flag`}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        onError={(e) => {
                          console.log(`❌ Primary flag failed for country: ${player.country}, trying alternative...`);
                          // Try alternative CDN
                          e.target.src = `https://flagcdn.com/w20/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`;
                          e.target.onerror = (e2) => {
                            console.log(`❌ Alternative flag failed for country: ${player.country}, trying third option...`);
                            // Try third CDN option
                            e2.target.src = `https://flagcdn.com/${(player.country || 'us').toLowerCase().slice(0, 2)}.svg`;
                            e2.target.onerror = () => {
                              console.log(`❌ All flag attempts failed for country: ${player.country}, showing text fallback`);
                              e2.target.style.display = 'none';
                              e2.target.nextElementSibling.style.display = 'flex';
                            };
                          };
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
                    <div 
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer text-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🔗 CRITICAL FIX: Player name clicked - using REAL ID:', player.name, player.id);
                        navigateTo && navigateTo('player-detail', { id: player.id });
                      }}
                    >
                      {player.name}
                    </div>
                  </div>
                  
                  {/* ✅ FIXED: Clean Hero Images */}
                  <div className="flex justify-center">
                    <div className="relative w-10 h-10">
                      {/* 🎮 PRODUCTION HERO SYSTEM: Image or Clean Text Fallback */}
                      {getHeroImageSync(player.hero) ? (
                        <img 
                          src={getHeroImageSync(player.hero)}
                          alt={player.hero}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            console.log(`❌ Failed to load hero image: ${player.hero}`);
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* ✅ CLEAN TEXT FALLBACK: Plain Hero Name Display */}
                      <div 
                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-center leading-tight text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded"
                        style={{ display: getHeroImageSync(player.hero) ? 'none' : 'flex' }}
                        title={`${player.hero} (${getHeroRole(player.hero)})`}
                      >
                        {player.hero}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats - READ-ONLY DISPLAY */}
                  {['eliminations', 'deaths', 'assists'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {player[stat]}
                      </span>
                    </div>
                  ))}
                  
                  <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                    {(player.eliminations / Math.max(player.deaths, 1)).toFixed(2)}
                  </div>
                  
                  {['damage', 'healing', 'damageBlocked'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {stat === 'damage' || stat === 'healing' || stat === 'damageBlocked' ? 
                          (player[stat] > 0 ? `${(player[stat] / 1000).toFixed(1)}k` : '-') :
                          player[stat]
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
            <div 
              className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              onClick={() => {
                console.log('🔗 MatchDetailPage: Navigating to team profile:', match.team2.name);
                navigateTo && navigateTo('team-detail', { id: match.team2.id });
              }}
            >
              <div className="text-sm font-semibold text-red-600 dark:text-red-400">{match.team2.name}</div>
            </div>
            <div className="space-y-1">
              {currentMapData.team2Players.map((player, index) => (
                <div
                  key={player.id}
                  className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => {
                    const playerId = player.playerId || player.id || `${match.team2?.id}_player_${index + 1}`;
                    console.log('🔗 CRITICAL FIX: Navigating to player profile:', playerId, 'Name:', player.playerName || player.name);
                    if (navigateTo && playerId) {
                      navigateTo('player-detail', { id: playerId });
                    } else {
                      console.log('⚠️ Navigation not available or player ID missing');
                    }
                  }}
                >
                  {/* ✅ ENHANCED COUNTRY FLAG SYSTEM - MULTIPLE FALLBACKS */}
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 flex items-center justify-center" title={`Country: ${player.country}`}>
                      {/* 🚨 CRITICAL FIX: Enhanced flag system with multiple attempts */}
                      <img 
                        src={`https://flagcdn.com/24x18/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`}
                        alt={`${player.country} flag`}
                        className="w-6 h-4 object-cover rounded-sm shadow-sm"
                        onError={(e) => {
                          console.log(`❌ Primary flag failed for country: ${player.country}, trying alternative...`);
                          // Try alternative CDN
                          e.target.src = `https://flagcdn.com/w20/${(player.country || 'us').toLowerCase().slice(0, 2)}.png`;
                          e.target.onerror = (e2) => {
                            console.log(`❌ Alternative flag failed for country: ${player.country}, trying third option...`);
                            // Try third CDN option
                            e2.target.src = `https://flagcdn.com/${(player.country || 'us').toLowerCase().slice(0, 2)}.svg`;
                            e2.target.onerror = () => {
                              console.log(`❌ All flag attempts failed for country: ${player.country}, showing text fallback`);
                              e2.target.style.display = 'none';
                              e2.target.nextElementSibling.style.display = 'flex';
                            };
                          };
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
                    <div 
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer text-sm transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log('🔗 CRITICAL FIX: Player name clicked - using REAL ID:', player.name, player.id);
                        navigateTo && navigateTo('player-detail', { id: player.id });
                      }}
                    >
                      {player.name}
                    </div>
                  </div>
                  
                  {/* ✅ FIXED: Clean Hero Images */}
                  <div className="flex justify-center">
                    <div className="relative w-10 h-10">
                      {/* 🎮 PRODUCTION HERO SYSTEM: Image or Clean Text Fallback */}
                      {getHeroImageSync(player.hero) ? (
                        <img 
                          src={getHeroImageSync(player.hero)}
                          alt={player.hero}
                          className="w-10 h-10 object-cover rounded"
                          onError={(e) => {
                            console.log(`❌ Failed to load hero image: ${player.hero}`);
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* ✅ CLEAN TEXT FALLBACK: Plain Hero Name Display */}
                      <div 
                        className="w-10 h-10 flex items-center justify-center text-xs font-bold text-center leading-tight text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded"
                        style={{ display: getHeroImageSync(player.hero) ? 'none' : 'flex' }}
                        title={`${player.hero} (${getHeroRole(player.hero)})`}
                      >
                        {player.hero}
                      </div>
                    </div>
                  </div>
                  
                  {/* Stats - READ-ONLY DISPLAY */}
                  {['eliminations', 'deaths', 'assists'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {player[stat]}
                      </span>
                    </div>
                  ))}
                  
                  <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                    {(player.eliminations / Math.max(player.deaths, 1)).toFixed(2)}
                  </div>
                  
                  {['damage', 'healing', 'damageBlocked'].map((stat) => (
                    <div key={stat} className="text-center text-sm">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {stat === 'damage' || stat === 'healing' || stat === 'damageBlocked' ? 
                          (player[stat] > 0 ? `${(player[stat] / 1000).toFixed(1)}k` : '-') :
                          player[stat]
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

      {/* MATCH COMMENTS SECTION - VLR.gg Style */}
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
                  
                  {/* VLR.gg Style Comment Actions - FIXED VOTING */}
                  <div className="flex items-center space-x-4 mt-2">
                    <button 
                      onClick={() => voteOnComment(comment.id, 'like')}
                      disabled={!isAuthenticated}
                      className={`flex items-center space-x-1 transition-colors ${
                        userVotes[`${comment.id}_${user?.id}`] === 'like'
                          ? 'text-green-600 font-semibold' 
                          : 'text-gray-500 hover:text-green-600'
                      } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span>👍</span>
                      <span className="text-sm">{comment.likes || 0}</span>
                    </button>
                    <button 
                      onClick={() => voteOnComment(comment.id, 'dislike')}
                      disabled={!isAuthenticated}
                      className={`flex items-center space-x-1 transition-colors ${
                        userVotes[`${comment.id}_${user?.id}`] === 'dislike'
                          ? 'text-red-600 font-semibold' 
                          : 'text-gray-500 hover:text-red-600'
                      } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span>👎</span>
                      <span className="text-sm">{comment.dislikes || 0}</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (!isAuthenticated) {
                          alert('Please sign in to reply');
                          return;
                        }
                        setReplyingTo(replyingTo === comment.id ? null : comment.id);
                        setReplyText('');
                      }}
                      className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
                    >
                      {replyingTo === comment.id ? 'Cancel' : 'Reply'}
                    </button>
                  </div>

                  {/* Reply Input */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${comment.user_name}...`}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none text-sm"
                        rows="2"
                      />
                      <div className="flex justify-end space-x-2 mt-2">
                        <button
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText('');
                          }}
                          className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitReply(comment.id)}
                          disabled={!replyText.trim()}
                          className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Delete button for admins/moderators */}
                {(user?.roles?.includes('admin') || user?.roles?.includes('moderator')) && (
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this comment?')) {
                        deleteComment(comment.id);
                      }
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 text-sm"
                  >
                    🗑️
                  </button>
                )}
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

        {/* Load More Comments (if needed) */}
        {comments.length > 0 && comments.length % 20 === 0 && (
          <div className="text-center mt-6">
            <button
              onClick={fetchComments}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Load More Comments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchDetailPage;