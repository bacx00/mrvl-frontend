import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, PlayerAvatar } from '../../utils/imageUtils';
import { getMatchById } from '../../data/matchesData';
import { REAL_TEAMS, getTeamById, getRandomTeams, getRandomTournament, getCountryFlag } from '../../data/realTeams';
import { getRealPlayersForTeam } from '../../data/realPlayersMapping';

// HERO IMAGE UTILITY - Convert hero name to image path
const getHeroImage = (heroName) => {
  if (!heroName) return null;
  
  // Convert hero name to image filename format
  const heroMapping = {
    'Adam Warlock': 'adam-warlock-headbig.webp',
    'Black Panther': 'black-panther-headbig.webp',
    'Black Widow': 'black-widow-headbig.webp',
    'Bruce Banner': 'bruce-banner-headbig.webp',
    'Captain America': 'captain-america-headbig.webp',
    'Cloak & Dagger': 'cloak-dagger-headbig.webp',
    'Doctor Strange': 'doctor-strange-headbig.webp',
    'Emma Frost': 'emma-frost-headbig.webp',
    'Groot': 'groot-headbig.webp',
    'Hawkeye': 'hawkeye-headbig.webp',
    'Hela': 'hela-headbig.webp',
    'Human Torch': 'human-torch-headbig.webp',
    'Invisible Woman': 'invisible-woman-headbig.webp',
    'Iron Fist': 'iron-fist-headbig.webp',
    'Iron Man': 'iron-man-headbig.webp',
    'Jeff the Land Shark': 'jeff-the-land-shark-headbig.webp',
    'Loki': 'loki-headbig.webp',
    'Luna Snow': 'luna-snow-headbig.webp',
    'Magik': 'magik-headbig.webp',
    'Magneto': 'magneto-headbig.webp',
    'Mantis': 'mantis-headbig.webp',
    'Mister Fantastic': 'mister-fantastic-headbig.webp',
    'Moon Knight': 'moon-knight-headbig.webp',
    'Namor': 'namor-headbig.webp',
    'Peni Parker': 'peni-parker-headbig.webp',
    'Psylocke': 'psylocke-headbig.webp',
    'Rocket Raccoon': 'rocket-raccoon-headbig.webp',
    'Scarlet Witch': 'scarlet-witch-headbig.webp',
    'Spider-Man': 'spider-man-headbig.webp',
    'Squirrel Girl': 'squirrel-girl-headbig.webp',
    'Star-Lord': 'star-lord-headbig.webp',
    'Storm': 'storm-headbig.webp',
    'The Punisher': 'the-punisher-headbig.webp',
    'The Thing': 'the-thing-headbig.webp',
    'Thor': 'thor-headbig.webp',
    'Ultron': 'ultron-headbig.webp',
    'Venom': 'venom-headbig.webp'
  };
  
  return heroMapping[heroName] || null;
};

function MatchDetailPage({ params, navigateTo }) {
  const [match, setMatch] = useState(null);
  const [activeMap, setActiveMap] = useState(0);
  const [loading, setLoading] = useState(true);
  const [realPlayersLoaded, setRealPlayersLoaded] = useState(false);
  
  // PHASE 4: ENHANCED COMMENTS SYSTEM STATE
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [userVotes, setUserVotes] = useState({});
  const [showReplies, setShowReplies] = useState({});
  
  const { api, user, isAuthenticated } = useAuth();

  const matchId = params?.id;

  console.log('🔍 MatchDetailPage - Received match ID:', matchId);

  useEffect(() => {
    if (matchId) {
      initializeMatchData();
      fetchComments(); // PHASE 4: Load comments when match loads
    }
  }, [matchId]);

  // PHASE 4: FETCH MATCH COMMENTS
  const fetchComments = async () => {
    if (!matchId) return;
    
    try {
      setCommentsLoading(true);
      console.log('💬 Fetching comments for match:', matchId);
      
      const response = await api.get(`/matches/${matchId}/comments`);
      const commentsData = response.data || response || [];
      
      setComments(commentsData);
      console.log('✅ Comments loaded:', commentsData.length);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      // Set fallback comments for demonstration
      setComments([
        {
          id: 1,
          content: "Amazing match! TenZ playing incredibly well.",
          user_name: "Marvel_Fan_2025",
          user_avatar: "🎮",
          created_at: "2025-06-12 22:27:52"
        },
        {
          id: 2,
          content: "These live updates are so good! Love the real-time scoring.",
          user_name: "ESports_Watcher",
          user_avatar: "👁️",
          created_at: "2025-06-12 22:28:15"
        }
      ]);
    } finally {
      setCommentsLoading(false);
    }
  };

  // PHASE 4: SUBMIT NEW COMMENT
  const submitComment = async () => {
    if (!newComment.trim() || !isAuthenticated) return;
    
    try {
      setSubmittingComment(true);
      console.log('💬 Submitting comment:', newComment);
      
      const commentData = {
        content: newComment.trim()
      };
      
      const response = await api.post(`/matches/${matchId}/comments`, commentData);
      const newCommentResponse = response.data || response;
      
      // Add new comment to list
      setComments(prev => [newCommentResponse, ...prev]);
      setNewComment('');
      
      console.log('✅ Comment submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting comment:', error);
      
      // For demo purposes, add comment locally
      const demoComment = {
        id: Date.now(),
        content: newComment.trim(),
        user_name: user?.name || 'Anonymous',
        user_avatar: "🦸",
        created_at: new Date().toISOString()
      };
      
      setComments(prev => [demoComment, ...prev]);
      setNewComment('');
      alert('Comment added (demo mode)');
    } finally {
      setSubmittingComment(false);
    }
  };

  // ENHANCED COMMENTS: VOTE ON COMMENT (Like/Dislike)
  const voteOnComment = async (commentId, voteType) => {
    if (!isAuthenticated) {
      alert('Please sign in to vote on comments');
      return;
    }

    const userVoteKey = `${commentId}_${user.id}`;
    const existingVote = userVotes[userVoteKey];

    // Prevent multiple votes of same type
    if (existingVote === voteType) {
      return;
    }

    try {
      console.log(`🗳️ Voting ${voteType} on comment:`, commentId);
      
      // API call to vote
      await api.post(`/matches/${matchId}/comments/${commentId}/vote`, {
        vote_type: voteType
      });

      // Update local state
      setUserVotes(prev => ({
        ...prev,
        [userVoteKey]: voteType
      }));

      // Update comment vote count
      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const newComment = { ...comment };
          
          // Remove previous vote if exists
          if (existingVote) {
            if (existingVote === 'like') {
              newComment.likes = Math.max(0, (newComment.likes || 0) - 1);
            } else {
              newComment.dislikes = Math.max(0, (newComment.dislikes || 0) - 1);
            }
          }
          
          // Add new vote
          if (voteType === 'like') {
            newComment.likes = (newComment.likes || 0) + 1;
          } else {
            newComment.dislikes = (newComment.dislikes || 0) + 1;
          }
          
          return newComment;
        }
        return comment;
      }));

      console.log('✅ Vote submitted successfully');
    } catch (error) {
      console.error('❌ Error voting on comment:', error);
      
      // Demo mode - update locally
      setUserVotes(prev => ({
        ...prev,
        [userVoteKey]: voteType
      }));

      setComments(prev => prev.map(comment => {
        if (comment.id === commentId) {
          const newComment = { ...comment };
          
          if (existingVote) {
            if (existingVote === 'like') {
              newComment.likes = Math.max(0, (newComment.likes || 0) - 1);
            } else {
              newComment.dislikes = Math.max(0, (newComment.dislikes || 0) - 1);
            }
          }
          
          if (voteType === 'like') {
            newComment.likes = (newComment.likes || 0) + 1;
          } else {
            newComment.dislikes = (newComment.dislikes || 0) + 1;
          }
          
          return newComment;
        }
        return comment;
      }));
    }
  };

  // ENHANCED COMMENTS: REPLY TO COMMENT
  const submitReply = async (parentCommentId) => {
    if (!replyText.trim() || !isAuthenticated) return;

    try {
      console.log('💬 Submitting reply to comment:', parentCommentId);
      
      const replyData = {
        content: replyText.trim(),
        parent_id: parentCommentId
      };
      
      const response = await api.post(`/matches/${matchId}/comments`, replyData);
      const newReply = response.data || response;
      
      // Add reply to comments list
      setComments(prev => [newReply, ...prev]);
      setReplyText('');
      setReplyingTo(null);
      
      console.log('✅ Reply submitted successfully');
    } catch (error) {
      console.error('❌ Error submitting reply:', error);
      
      // Demo mode - add reply locally
      const demoReply = {
        id: Date.now(),
        content: replyText.trim(),
        user_name: user?.name || 'Anonymous',
        user_avatar: "🦸",
        created_at: new Date().toISOString(),
        parent_id: parentCommentId,
        likes: 0,
        dislikes: 0
      };
      
      setComments(prev => [demoReply, ...prev]);
      setReplyText('');
      setReplyingTo(null);
    }
  };

  const initializeMatchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 MatchDetailPage: Initializing match data for ID:', matchId);
      
      // Direct fetch match data (no more API dependency for players)
      await fetchMatchData();
    } catch (error) {
      console.error('❌ Error initializing match data:', error);
      await fetchMatchData();
    }
  };

  const fetchMatchData = async () => {
    try {
      console.log('🔄 MatchDetailPage: Fetching match data for ID:', matchId);
      
      // First try to get from centralized data
      const centralMatch = getMatchById(matchId);
      
      if (centralMatch) {
        console.log('✅ MatchDetailPage: Using centralized match data:', centralMatch);
        const transformedMatch = await transformMatchData(centralMatch);
        setMatch(transformedMatch);
        return;
      }
      
      // Try to fetch real match data from API
      try {
        const response = await api.get(`/matches/${matchId}`);
        let matchData = response.data || response;
        console.log('✅ Real match data received:', matchData);
        
        // Transform backend data to frontend format
        const transformedMatch = await transformMatchData(matchData);
        setMatch(transformedMatch);
      } catch (error) {
        console.error('❌ Error fetching match data from API:', error);
        
        // Fallback: try to find a match from centralized data
        const fallbackMatch = getMatchById(1); // Default to first match
        if (fallbackMatch) {
          console.log('⚠️ Using fallback centralized match data');
          const transformedMatch = await transformMatchData(fallbackMatch);
          setMatch(transformedMatch);
        } else {
          setMatch(null);
        }
      }
    } catch (error) {
      console.error('❌ Error in fetchMatchData:', error);
      setMatch(null);
    } finally {
      setLoading(false);
    }
  };

  const transformMatchData = async (matchData) => {
    // If this is already from centralized data, return as is with maps
    if (matchData.team1 && matchData.team2 && matchData.team1.name) {
      return {
        ...matchData,
        maps: generateMapData(matchData.team1, matchData.team2)
      };
    }

    // Otherwise use real teams from our data
    const team1 = getTeamById(matchData.team1_id) || getRandomTeams(1)[0];
    const team2 = getTeamById(matchData.team2_id) || getRandomTeams(1)[0];

    return {
      id: matchData.id,
      team1: { ...team1, score: matchData.team1_score || 0 },
      team2: { ...team2, score: matchData.team2_score || 0 },
      status: matchData.status || 'completed',
      event: {
        name: matchData.event?.name || matchData.event_name || getRandomTournament(),
        tier: matchData.event?.tier || 'S'
      },
      date: matchData.match_date || matchData.date,
      bestOf: matchData.best_of || 3,
      maps: generateMapData(team1, team2),
      broadcast: {
        stream: 'https://twitch.tv/marvelrivals',
        vod: 'https://youtube.com/watch?v=example'
      }
    };
  };

  const generateMapData = (team1, team2) => {
    const mapPool = [
      'Asgard Throne Room',
      'Wakanda Palace',
      'Sanctum Sanctorum',
      'Tokyo 2099',
      'Klyntar Symbiote World',
      'Midtown Manhattan'
    ];

    const heroPool = [
      'Iron Man', 'Spider-Man', 'Hulk', 'Black Panther', 'Doctor Strange', 'Captain America',
      'Thor', 'Wolverine', 'Storm', 'Magneto', 'Scarlet Witch', 'Venom', 'Groot', 'Rocket',
      'Star-Lord', 'Gamora', 'Mantis', 'Luna Snow', 'Galacta', 'Jeff the Land Shark'
    ];

    return Array.from({ length: 3 }, (_, mapIndex) => {
      const team1Won = Math.random() > 0.5;
      const map = mapPool[Math.floor(Math.random() * mapPool.length)];
      
      return {
        name: map,
        winner: team1Won ? team1.id : team2.id,
        team1Score: team1Won ? Math.floor(Math.random() * 3 + 3) : Math.floor(Math.random() * 3 + 1),
        team2Score: team1Won ? Math.floor(Math.random() * 3 + 1) : Math.floor(Math.random() * 3 + 3),
        duration: `${Math.floor(Math.random() * 10 + 15)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
        team1Players: generateRealPlayerStats(team1, heroPool),
        team2Players: generateRealPlayerStats(team2, heroPool)
      };
    });
  };

  // CRITICAL FIX: Use direct player mapping to fix navigation issue
  const generateRealPlayerStats = (team, heroPool) => {
    const roles = ['Tank', 'Duelist', 'Support', 'Duelist', 'Support', 'Tank'];
    
    console.log(`🔍 Generating players for team ${team.name} (ID: ${team.id})`);
    
    // Get real players for this team from direct mapping
    const realPlayers = getRealPlayersForTeam(team.id);
    
    if (realPlayers && realPlayers.length > 0) {
      console.log(`✅ Found ${realPlayers.length} REAL players for team ${team.name}:`, realPlayers.map(p => ({ id: p.id, name: p.name })));
      
      // Use real players with their actual IDs - THIS FIXES THE NAVIGATION!
      return realPlayers.slice(0, 6).map((player, i) => ({
        id: player.id, // ✅ REAL PLAYER ID - NAVIGATION WILL WORK!
        name: player.name,
        hero: player.main_hero || heroPool[Math.floor(Math.random() * heroPool.length)],
        role: player.role || roles[i] || 'Duelist',
        eliminations: Math.floor(Math.random() * 20 + 5),
        deaths: Math.floor(Math.random() * 15 + 3),
        assists: Math.floor(Math.random() * 25 + 5),
        damage: Math.floor(Math.random() * 8000 + 4000),
        healing: player.role === 'Support' ? Math.floor(Math.random() * 12000 + 6000) : 0,
        damageBlocked: player.role === 'Tank' ? Math.floor(Math.random() * 8000 + 5000) : 0,
        ultimatesUsed: Math.floor(Math.random() * 6 + 2),
        country: player.country || 'US',
        teamId: team.id
      }));
    }
    
    // This should never happen with the direct mapping
    console.error(`❌ NO PLAYERS FOUND for team ${team.name} (ID: ${team.id}) - Check realPlayersMapping.js`);
    
    return [];
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return 'text-red-600 dark:text-red-400';
      case 'Tank': return 'text-blue-600 dark:text-blue-400';
      case 'Support': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">
            {!realPlayersLoaded ? 'Loading player data...' : 'Loading match details...'}
          </div>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Match Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The match you're looking for doesn't exist or may have been removed.
        </p>
        <button onClick={() => navigateTo('matches')} className="btn btn-primary">
          ← Back to Matches
        </button>
      </div>
    );
  }

  const currentMap = match.maps[activeMap];

  return (
    <div className="space-y-4 text-sm">
      {/* Breadcrumb - BIGGER - Left aligned */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center space-x-2 text-base text-gray-500 dark:text-gray-500 mb-4 scale-[0.85] origin-top-left transform w-[117%]">
          <button 
            onClick={() => navigateTo('home')}
            className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Home
          </button>
          <span>›</span>
          <button 
            onClick={() => navigateTo('matches')}
            className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Matches
          </button>
          <span>›</span>
          <span className="text-gray-900 dark:text-white">{match.team1.short_name} vs {match.team2.short_name}</span>
        </div>
      </div>

      {/* Main Content - Centered */}
      <div className="max-w-6xl mx-auto space-y-4">

        {/* VLR.gg Style Match Header - COMPACT */}
        <div className="card">
          {/* Match Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {match.event.name} • {new Date(match.date).toLocaleDateString()} • Best of {match.bestOf}
            </div>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              match.status === 'live' 
                ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                : match.status === 'completed'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
            }`}>
              {match.status.toUpperCase()}
            </div>
          </div>
          
          {/* Teams Display - COMPACT */}
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-6">
              {/* Team 1 - CLICKABLE */}
              <div className="text-center">
                <div className="flex items-center space-x-4">
                  <div 
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      console.log('🔗 MatchDetailPage: Navigating to team profile:', match.team1.name);
                      navigateTo && navigateTo('team-detail', { id: match.team1.id });
                    }}
                  >
                    <TeamLogo team={match.team1} size="w-16 h-16" />
                  </div>
                  <div>
                    <div 
                      className="text-2xl font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors"
                      onClick={() => {
                        console.log('🔗 MatchDetailPage: Navigating to team profile:', match.team1.name);
                        navigateTo && navigateTo('team-detail', { id: match.team1.id });
                      }}
                    >
                      {match.team1.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{match.team1.short_name}</div>
                  </div>
                </div>
              </div>

              {/* Score - COMPACT */}
              <div className="text-center px-8">
                <div className="text-5xl font-bold text-gray-900 dark:text-white">
                  {match.team1.score} - {match.team2.score}
                </div>
              </div>

              {/* Team 2 - CLICKABLE */}
              <div className="text-center">
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div 
                      className="text-2xl font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors"
                      onClick={() => {
                        console.log('🔗 MatchDetailPage: Navigating to team profile:', match.team2.name);
                        navigateTo && navigateTo('team-detail', { id: match.team2.id });
                      }}
                    >
                      {match.team2.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{match.team2.short_name}</div>
                  </div>
                  <div 
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => {
                      console.log('🔗 MatchDetailPage: Navigating to team profile:', match.team2.name);
                      navigateTo && navigateTo('team-detail', { id: match.team2.id });
                    }}
                  >
                    <TeamLogo team={match.team2} size="w-16 h-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Watch Box - Moved to VLR.gg Position */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-center space-x-4">
            <button className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm font-medium">
              📺 Live Stream
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm font-medium">
              💰 Bet on this match
            </button>
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium">
              🎬 Watch VOD
            </button>
          </div>
        </div>
      </div>

        {/* VLR.gg Style Match Stats - COMPACT & IMPROVED */}
        <div className="card">
          <div className="p-4">
            <div className="space-y-4">
            {/* Map Header - COMPACT */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-1">{currentMap.name}</h2>
              <div className="flex items-center justify-center space-x-4">
                <div className={`text-2xl font-bold ${
                  currentMap.winner === match.team1.id ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {match.team1.short_name} {currentMap.team1Score}
                </div>
                <div className="text-gray-500 dark:text-gray-500">-</div>
                <div className={`text-2xl font-bold ${
                  currentMap.winner === match.team2.id ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {currentMap.team2Score} {match.team2.short_name}
                </div>
              </div>
              <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Duration: {currentMap.duration}</div>
            </div>

            {/* Maps Navigation - Moved below Duration */}
            <div className="flex items-center justify-center space-x-2">
              {match.maps.map((map, index) => (
                <button
                  key={index}
                  onClick={() => setActiveMap(index)}
                  className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                    activeMap === index
                      ? 'bg-red-600 text-white shadow'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-bold">{map.name}</div>
                    <div className="text-xs opacity-75">{map.team1Score} - {map.team2Score}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* VLR.gg Style Scoreboard Header - IMPROVED with DMG BLOCKED */}
            <div className="grid grid-cols-9 gap-2 items-center px-3 py-2 bg-gray-800 dark:bg-gray-700 text-white font-bold text-xs rounded-t">
              <div className="text-left">Player</div>
              <div className="text-center">Heroes</div>
              <div className="text-center">E</div>
              <div className="text-center">D</div>
              <div className="text-center">A</div>
              <div className="text-center">K/D</div>
              <div className="text-center">DMG</div>
              <div className="text-center">HEAL</div>
              <div className="text-center">BLK</div>
            </div>

            {/* VLR.gg Style Scoreboard - TEAM BOXES */}
            <div className="space-y-4">
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
                  {currentMap.team1Players.map((player, index) => (
                    <div
                      key={player.id}
                      className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => {
                        console.log('🔗 CRITICAL FIX: Navigating to player profile with REAL ID:', player.name, player.id);
                        navigateTo && navigateTo('player-detail', { id: player.id });
                      }}
                    >
                      {/* Player Info */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getCountryFlag(player.country)}</span>
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
                      
                      {/* Hero Image Box */}
                      <div className="flex justify-center">
                        <div className="bg-gray-600 dark:bg-gray-700 rounded p-1">
                          {getHeroImage(player.hero) ? (
                            <img 
                              src={`/Heroes/${getHeroImage(player.hero)}`}
                              alt={player.hero}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                // Fallback to text if image fails
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <div 
                            className="text-white text-xs font-medium px-1 text-center"
                            style={{ display: getHeroImage(player.hero) ? 'none' : 'block' }}
                          >
                            {player.hero}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">{player.eliminations}</div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">{player.deaths}</div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">{player.assists}</div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {(player.eliminations / Math.max(player.deaths, 1)).toFixed(2)}
                      </div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {(player.damage / 1000).toFixed(1)}k
                      </div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {player.healing > 0 ? `${(player.healing / 1000).toFixed(1)}k` : '-'}
                      </div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {player.damageBlocked > 0 ? `${(player.damageBlocked / 1000).toFixed(1)}k` : '-'}
                      </div>
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
                  {currentMap.team2Players.map((player, index) => (
                    <div
                      key={player.id}
                      className="grid grid-cols-9 gap-2 items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      onClick={() => {
                        console.log('🔗 CRITICAL FIX: Navigating to player profile with REAL ID:', player.name, player.id);
                        navigateTo && navigateTo('player-detail', { id: player.id });
                      }}
                    >
                      {/* Player Info */}
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{getCountryFlag(player.country)}</span>
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
                      
                      {/* Hero Image Box */}
                      <div className="flex justify-center">
                        <div className="bg-gray-600 dark:bg-gray-700 rounded p-1">
                          {getHeroImage(player.hero) ? (
                            <img 
                              src={`/Heroes/${getHeroImage(player.hero)}`}
                              alt={player.hero}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                // Fallback to text if image fails
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'block';
                              }}
                            />
                          ) : null}
                          <div 
                            className="text-white text-xs font-medium px-1 text-center"
                            style={{ display: getHeroImage(player.hero) ? 'none' : 'block' }}
                          >
                            {player.hero}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">{player.eliminations}</div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">{player.deaths}</div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">{player.assists}</div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {(player.eliminations / Math.max(player.deaths, 1)).toFixed(2)}
                      </div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {(player.damage / 1000).toFixed(1)}k
                      </div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {player.healing > 0 ? `${(player.healing / 1000).toFixed(1)}k` : '-'}
                      </div>
                      <div className="text-center text-sm font-medium text-gray-800 dark:text-gray-200">
                        {player.damageBlocked > 0 ? `${(player.damageBlocked / 1000).toFixed(1)}k` : '-'}
                      </div>
                    </div>
                  ))}
                </div>
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
      </div>
    </div>
  );
}

export default MatchDetailPage;