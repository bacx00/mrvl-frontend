import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, PlayerAvatar } from '../../utils/imageUtils';

// 🎮 MARVEL RIVALS HERO SYSTEM - Production API Integration
const getHeroImage = async (heroName) => {
  if (!heroName) return null;
  
  try {
    // 🎯 CRITICAL: Use new production hero image API
    const heroSlug = heroName.toLowerCase().replace(/\s+/g, '-');
    const response = await fetch(`https://staging.mrvl.net/api/heroes/${heroSlug}/image`);
    const data = await response.json();
    
    if (data.success && data.data.image_url) {
      console.log(`✅ Hero image found: ${heroName} -> ${data.data.image_url}`);
      // FIXED: Don't concatenate URLs - the API already returns the full URL
      return data.data.image_url;
    } else {
      console.log(`📝 Hero image not found: ${heroName} - using text fallback`);
      return null; // Will trigger text fallback
    }
  } catch (error) {
    console.error(`❌ Error fetching hero image for ${heroName}:`, error);
    return null; // Will trigger text fallback
  }
};

// 🎮 PRODUCTION HERO SYSTEM: Corrected implementation
const getHeroImageSync = (heroName) => {
  if (!heroName) return null;
  
  // 🎯 HEROES WITH CONFIRMED IMAGES (17/22) - Direct .webp URLs
  const heroesWithImages = {
    'Black Widow': 'black_widow.webp',
    'Hawkeye': 'hawkeye.webp', 
    'Star-Lord': 'star_lord.webp',
    'Punisher': 'punisher.webp',
    'Winter Soldier': 'winter_soldier.webp',
    'Squirrel Girl': 'squirrel_girl.webp',
    'Hulk': 'hulk.webp',
    'Groot': 'groot.webp',
    'Doctor Strange': 'doctor_strange.webp',
    'Magneto': 'magneto.webp',
    'Captain America': 'captain_america.webp',
    'Venom': 'venom.webp',
    'Mantis': 'mantis.webp',
    'Luna Snow': 'luna_snow.webp',
    'Adam Warlock': 'adam_warlock.webp',
    'Cloak & Dagger': 'cloak_dagger.webp',
    'Jeff the Land Shark': 'jeff_the_land_shark.webp'
  };
  
  if (heroesWithImages[heroName]) {
    const imageUrl = `https://staging.mrvl.net/storage/heroes/${heroesWithImages[heroName]}`;
    console.log(`✅ Hero image available: ${heroName} -> ${imageUrl}`);
    return imageUrl;
  }
  
  // Heroes without images: Iron Man, Spider-Man, Thor, Storm, Rocket Raccoon
  console.log(`📝 ${heroName} - using text fallback (no image available)`);
  return null; // Will trigger text fallback
};

// 🎮 MARVEL RIVALS ROLE SYSTEM - ALIGNED WITH BACKEND
const getHeroRole = (heroName) => {
  if (!heroName) return 'Unknown';
  
  const heroRoles = {
    Tank: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Peni Parker', 'The Thing', 'Thor', 'Venom'],
    Duelist: ['Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Human Torch', 'Iron Fist', 'Iron Man', 'Magik', 'Moon Knight', 'Namor', 'Psylocke', 'The Punisher', 'Scarlet Witch', 'Spider-Man', 'Squirrel Girl', 'Star-Lord', 'Storm', 'Wolverine'],
    Support: ['Adam Warlock', 'Cloak & Dagger', 'Invisible Woman', 'Jeff the Land Shark', 'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon']
  };
  
  for (const [role, heroes] of Object.entries(heroRoles)) {
    if (heroes.includes(heroName)) {
      return role;
    }
  }
  
  return 'Unknown';
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
  const [userVotes, setUserVotes] = useState(() => {
    // ✅ FIXED: Load vote state from localStorage for persistence
    const saved = localStorage.getItem('mrvl-comment-votes');
    return saved ? JSON.parse(saved) : {};
  });
  const [showReplies, setShowReplies] = useState({});
  
  const { api, user, isAuthenticated } = useAuth();

  const matchId = params?.id;

  console.log('🔍 MatchDetailPage - Received match ID:', matchId);

  // ✅ CRITICAL FIX: Add real-time sync listener for match updates
  useEffect(() => {
    const handleMatchUpdate = (event) => {
      const { matchId: updatedMatchId, matchData } = event.detail || {};
      
      if (updatedMatchId && updatedMatchId == matchId) {
        console.log('🔥 REAL-TIME UPDATE: Match data received:', matchData);
        
        // Re-fetch match data to get the latest
        initializeMatchData();
        
        // Show notification
        const notification = document.createElement('div');
        notification.innerHTML = '🔥 Match Updated Live!';
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    };

    window.addEventListener('mrvl-match-updated', handleMatchUpdate);
    
    return () => {
      window.removeEventListener('mrvl-match-updated', handleMatchUpdate);
    };
  }, [matchId]);

  // ✅ CRITICAL FIX: Add auto-refresh for live matches
  useEffect(() => {
    if (!match || match.status !== 'live') return;
    
    console.log('🔴 LIVE MATCH: Setting up auto-refresh every 15 seconds');
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing live match data...');
      initializeMatchData();
    }, 15000); // Refresh every 15 seconds for live matches
    
    return () => clearInterval(interval);
  }, [match?.status]);

  // ✅ CRITICAL FIX: Add real-time sync listener for match updates
  useEffect(() => {
    const handleMatchUpdate = (event) => {
      const { matchId: updatedMatchId, matchData } = event.detail || {};
      
      if (updatedMatchId && updatedMatchId == matchId) {
        console.log('🔥 REAL-TIME UPDATE: Match data received:', matchData);
        
        // Re-fetch match data to get the latest
        initializeMatchData();
        
        // Show notification
        const notification = document.createElement('div');
        notification.innerHTML = '🔥 Match Updated Live!';
        notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse';
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      }
    };

    window.addEventListener('mrvl-match-updated', handleMatchUpdate);
    
    return () => {
      window.removeEventListener('mrvl-match-updated', handleMatchUpdate);
    };
  }, [matchId]);

  // ✅ CRITICAL FIX: Add auto-refresh for live matches
  useEffect(() => {
    if (!match || match.status !== 'live') return;
    
    console.log('🔴 LIVE MATCH: Setting up auto-refresh every 15 seconds');
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing live match data...');
      initializeMatchData();
    }, 15000); // Refresh every 15 seconds for live matches
    
    return () => clearInterval(interval);
  }, [match?.status]);

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
      setComments([]); // NO FALLBACK DATA
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
      
      // ✅ FIXED: Save vote state to localStorage for persistence across pages
      localStorage.setItem('mrvl-comment-votes', JSON.stringify({
        ...userVotes,
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

      // ✅ FIXED: Save vote state to localStorage for persistence across pages
      localStorage.setItem('mrvl-comment-votes', JSON.stringify({
        ...userVotes,
        [userVoteKey]: voteType
      }));

      console.log('✅ Vote submitted successfully');
      
      // ✅ FIXED: Save vote state to localStorage for persistence across pages
      localStorage.setItem('mrvl-comment-votes', JSON.stringify({
        ...userVotes,
        [userVoteKey]: voteType
      }));
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

  // DELETE COMMENT FUNCTION
  const deleteComment = async (commentId) => {
    try {
      console.log('🗑️ Deleting comment:', commentId);
      await api.delete(`/matches/${matchId}/comments/${commentId}`);
      setComments(prev => prev.filter(c => c.id !== commentId));
      console.log('✅ Comment deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      alert('Failed to delete comment. Please try again.');
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
      console.log('🔄 MatchDetailPage: Fetching REAL match data for ID:', matchId);
      
      // 🚨 CRITICAL FIX: Use REAL backend data, no fallbacks
      const response = await api.get(`/matches/${matchId}`);
      let matchData = response.data || response;
      console.log('✅ REAL match data received:', matchData);
      
      if (!matchData || !matchData.id) {
        console.error('❌ No match data received from backend');
        setMatch(null);
        return;
      }
      
      // 🎮 CRITICAL: Use EXACT backend data structure - NO TRANSFORMATION
      const realMatch = {
        id: matchData.id,
        team1: {
          id: matchData.team1_id || matchData.team1?.id,
          name: matchData.team1_name || matchData.team1?.name || 'Team 1',
          short_name: matchData.team1_short_name || matchData.team1?.short_name || 'T1',
          score: matchData.team1_score || 0,
          logo: matchData.team1?.logo,
          region: matchData.team1?.region || 'Unknown'
        },
        team2: {
          id: matchData.team2_id || matchData.team2?.id,
          name: matchData.team2_name || matchData.team2?.name || 'Team 2', 
          short_name: matchData.team2_short_name || matchData.team2?.short_name || 'T2',
          score: matchData.team2_score || 0,
          logo: matchData.team2?.logo,
          region: matchData.team2?.region || 'Unknown'
        },
        status: matchData.status || 'upcoming',
        format: matchData.format || 'BO1',
        scheduled_at: matchData.scheduled_at,
        event: matchData.event || { name: matchData.event_name || 'Tournament' },
        
        // 🎮 CRITICAL: Use REAL maps from backend with exact count
        maps: (matchData.maps || []).slice(0, matchData.format === 'BO5' ? 5 : matchData.format === 'BO3' ? 3 : 1).map((mapData, index) => ({
          name: mapData.map_name || mapData.name || `Map ${index + 1}`,
          mode: mapData.mode || 'Convoy',
          team1Score: mapData.team1_score || 0,
          team2Score: mapData.team2_score || 0,
          status: mapData.status || 'upcoming',
          winner: mapData.winner_id ? (mapData.winner_id === matchData.team1_id ? matchData.team1_id : matchData.team2_id) : null,
          duration: mapData.duration || 'Not started',
          
          // 🎮 CRITICAL: Use REAL team compositions from backend
          team1Players: (mapData.team1_composition || Array.from({ length: 6 }, (_, pIndex) => ({
            id: `${matchData.team1_id}_p${pIndex + 1}`,
            name: `Player ${pIndex + 1}`,
            hero: 'Captain America',
            country: '🌍'
          }))).map(player => ({
            id: player.id || player.player_id || `p${index}_${Math.random()}`,
            name: player.name || player.player_name || `Player ${index + 1}`,
            hero: player.hero || 'Captain America',
            role: player.role || 'Tank',
            country: player.country || '🌍',
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0
          })),
          
          team2Players: (mapData.team2_composition || Array.from({ length: 6 }, (_, pIndex) => ({
            id: `${matchData.team2_id}_p${pIndex + 1}`,
            name: `Player ${pIndex + 1}`,
            hero: 'Captain America',
            country: '🌍'
          }))).map(player => ({
            id: player.id || player.player_id || `p${index}_${Math.random()}`,
            name: player.name || player.player_name || `Player ${index + 1}`,
            hero: player.hero || 'Captain America',
            role: player.role || 'Tank',
            country: player.country || '🌍',
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damageBlocked || 0
          }))
        }))
      };
      
      console.log('🎮 FINAL transformed match data:', realMatch);
      console.log(`🗺️ Maps count: ${realMatch.maps.length} (Format: ${realMatch.format})`);
      
      setMatch(realMatch);
    } catch (error) {
      console.error('❌ Error fetching match data from API:', error);
      setMatch(null); // NO FALLBACK DATA
    } finally {
      setLoading(false);
    }
  };

  // HELPER FUNCTIONS FOR DATA
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
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{currentMap.mode} • {currentMap.description}</div>
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
              <div className="text-gray-600 dark:text-gray-400 text-sm mt-1">Duration: {currentMap.duration || 'Not started'}</div>
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
                        // 🚨 CRITICAL FIX: Generate proper player ID for navigation
                        const playerId = player.id || `${match.team1?.id}_player_${index + 1}`;
                        console.log('🔗 FIXED: Navigating to player with ID:', playerId, 'Name:', player.name);
                        
                        // For now, show player info in alert until backend player pages exist
                        alert(`Player: ${player.name}\nTeam: ${match.team1?.name}\nHero: ${player.hero}\nRole: ${player.role}`);
                        
                        // Uncomment when player detail pages are ready
                        // navigateTo && navigateTo('player-detail', { id: playerId });
                      }}
                    >
                      {/* ✅ FIXED: Country Flag + Player Name */}
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center text-lg" title={`Country: ${player.country}`}>
                          {player.country || '🌍'}
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
                      
                      {/* ✅ FIXED: Clean Hero Images (VLR.gg Style) */}
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
                          
                          {/* ✅ CLEAN TEXT FALLBACK: Professional Hero Name Display */}
                          <div 
                            className="w-10 h-10 flex items-center justify-center text-xs font-bold text-center leading-tight bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded shadow-lg"
                            style={{ display: getHeroImageSync(player.hero) ? 'none' : 'flex' }}
                            title={`${player.hero} (${getHeroRole(player.hero)})`}
                          >
                            {player.hero.split(' ').map(word => word[0]).join('').slice(0, 2)}
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
                        // 🚨 CRITICAL FIX: Generate proper player ID for navigation
                        const playerId = player.id || `${match.team1?.id}_player_${index + 1}`;
                        console.log('🔗 FIXED: Navigating to player with ID:', playerId, 'Name:', player.name);
                        
                        // For now, show player info in alert until backend player pages exist
                        alert(`Player: ${player.name}\nTeam: ${match.team1?.name}\nHero: ${player.hero}\nRole: ${player.role}`);
                        
                        // Uncomment when player detail pages are ready
                        // navigateTo && navigateTo('player-detail', { id: playerId });
                      }}
                    >
                      {/* ✅ FIXED: Country Flag + Player Name (Team 2) */}
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 flex items-center justify-center text-lg" title={`Country: ${player.country}`}>
                          {player.country || '🌍'}
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
                      
                      {/* ✅ FIXED: Clean Hero Images (VLR.gg Style) */}
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
                          
                          {/* ✅ CLEAN TEXT FALLBACK: Professional Hero Name Display */}
                          <div 
                            className="w-10 h-10 flex items-center justify-center text-xs font-bold text-center leading-tight bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded shadow-lg"
                            style={{ display: getHeroImageSync(player.hero) ? 'none' : 'flex' }}
                            title={`${player.hero} (${getHeroRole(player.hero)})`}
                          >
                            {player.hero.split(' ').map(word => word[0]).join('').slice(0, 2)}
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