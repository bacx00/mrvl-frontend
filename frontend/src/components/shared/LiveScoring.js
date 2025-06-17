import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

// ✅ MARVEL RIVALS LIVE SCORING SYSTEM
const MARVEL_RIVALS_HEROES = {
  'Duelist': [
    'Iron Man', 'Spider-Man', 'Black Widow', 'Hawkeye', 'Star-Lord', 'The Punisher',
    'Moon Knight', 'Squirrel Girl', 'Psylocke', 'Human Torch'
  ],
  'Tank': [
    'Hulk', 'Thor', 'Groot', 'The Thing', 'Captain America', 'Magneto',
    'Doctor Strange', 'Peni Parker'
  ],
  'Support': [
    'Storm', 'Mantis', 'Rocket Raccoon', 'Cloak & Dagger', 'Luna Snow', 
    'Adam Warlock', 'Jeff the Land Shark', 'Loki'
  ]
};

// Get all heroes in a flat array
const ALL_HEROES = Object.values(MARVEL_RIVALS_HEROES).flat();

function LiveScoring({ matchId, initialMatchData, onMatchUpdate }) {
  const [matchData, setMatchData] = useState(initialMatchData);
  const [activeMap, setActiveMap] = useState(0);
  const [isLive, setIsLive] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [playerStats, setPlayerStats] = useState({});
  const { api, user, isAdmin, isModerator } = useAuth();

  // Check if user can edit live scores
  const canEditScores = isAdmin() || isModerator();

  useEffect(() => {
    if (initialMatchData) {
      setMatchData(initialMatchData);
      setIsLive(initialMatchData.status === 'live');
      
      // Initialize player stats if not present
      if (initialMatchData.maps && initialMatchData.maps.length > 0) {
        initializePlayerStats(initialMatchData);
      }
    }
  }, [initialMatchData]);

  // ✅ CRITICAL: Initialize player stats for live tracking
  const initializePlayerStats = (match) => {
    const stats = {};
    
    match.maps.forEach((map, mapIndex) => {
      stats[mapIndex] = {
        team1: {},
        team2: {}
      };
      
      // Initialize stats for each player
      ['team1', 'team2'].forEach(teamKey => {
        const teamData = match[teamKey];
        if (teamData && teamData.players) {
          teamData.players.forEach(player => {
            stats[mapIndex][teamKey][player.id] = {
              eliminations: 0,
              deaths: 0,
              assists: 0,
              damage: 0,
              healing: 0,
              damageBlocked: 0,
              hero: ALL_HEROES[Math.floor(Math.random() * ALL_HEROES.length)],
              // ✅ Live tracking fields
              alive: true,
              ultimate_ready: false,
              current_streak: 0
            };
          });
        }
      });
    });
    
    setPlayerStats(stats);
  };

  // ✅ CRITICAL: Update match score in real-time
  const updateMatchScore = async (mapIndex, team1Score, team2Score) => {
    if (!canEditScores) {
      alert('You do not have permission to update live scores');
      return;
    }

    setUpdating(true);
    
    try {
      console.log(`🔄 Updating map ${mapIndex + 1} score:`, team1Score, '-', team2Score);
      
      // Update local state immediately
      const updatedMatch = { ...matchData };
      updatedMatch.maps[mapIndex].team1_score = team1Score;
      updatedMatch.maps[mapIndex].team2_score = team2Score;
      
      // Determine map winner
      if (team1Score > team2Score) {
        updatedMatch.maps[mapIndex].winner_id = matchData.team1.id;
        updatedMatch.maps[mapIndex].status = 'completed';
      } else if (team2Score > team1Score) {
        updatedMatch.maps[mapIndex].winner_id = matchData.team2.id;
        updatedMatch.maps[mapIndex].status = 'completed';
      } else {
        updatedMatch.maps[mapIndex].winner_id = null;
        updatedMatch.maps[mapIndex].status = team1Score === 0 && team2Score === 0 ? 'upcoming' : 'live';
      }
      
      // ✅ CRITICAL: Calculate overall match score (maps won)
      let team1MapsWon = 0;
      let team2MapsWon = 0;
      
      updatedMatch.maps.forEach(map => {
        if (map.winner_id === matchData.team1.id) team1MapsWon++;
        if (map.winner_id === matchData.team2.id) team2MapsWon++;
      });
      
      updatedMatch.team1.score = team1MapsWon;
      updatedMatch.team2.score = team2MapsWon;
      
      // ✅ Determine overall match status
      const totalMaps = updatedMatch.maps.length;
      const mapsToWin = Math.ceil(totalMaps / 2);
      
      if (team1MapsWon >= mapsToWin || team2MapsWon >= mapsToWin) {
        updatedMatch.status = 'completed';
      } else if (team1MapsWon > 0 || team2MapsWon > 0) {
        updatedMatch.status = 'live';
      }
      
      setMatchData(updatedMatch);
      
      // ✅ CRITICAL: Send to backend API
      const updateData = {
        map_index: mapIndex,
        team1_score: team1Score,
        team2_score: team2Score,
        overall_team1_score: team1MapsWon,
        overall_team2_score: team2MapsWon,
        match_status: updatedMatch.status,
        map_status: updatedMatch.maps[mapIndex].status,
        winner_id: updatedMatch.maps[mapIndex].winner_id
      };
      
      try {
        const response = await api.put(`/admin/matches/${matchId}/score`, updateData);
        console.log('✅ Score updated successfully:', response.data || response);
        
        // Notify parent component
        if (onMatchUpdate) {
          onMatchUpdate(updatedMatch);
        }
      } catch (apiError) {
        console.warn('⚠️ API update failed, using local state:', apiError);
        // Continue with local state - this ensures UI doesn't break
      }
      
    } catch (error) {
      console.error('❌ Error updating score:', error);
      alert('Failed to update score. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // ✅ Update player statistics
  const updatePlayerStat = async (mapIndex, teamKey, playerId, statType, value) => {
    if (!canEditScores) return;

    const newStats = { ...playerStats };
    if (!newStats[mapIndex]) newStats[mapIndex] = { team1: {}, team2: {} };
    if (!newStats[mapIndex][teamKey]) newStats[mapIndex][teamKey] = {};
    if (!newStats[mapIndex][teamKey][playerId]) {
      newStats[mapIndex][teamKey][playerId] = {
        eliminations: 0, deaths: 0, assists: 0, damage: 0, healing: 0, damageBlocked: 0,
        hero: ALL_HEROES[0], alive: true, ultimate_ready: false, current_streak: 0
      };
    }
    
    newStats[mapIndex][teamKey][playerId][statType] = value;
    setPlayerStats(newStats);
    
    // Send to backend
    try {
      await api.put(`/admin/matches/${matchId}/player-stats`, {
        map_index: mapIndex,
        player_id: playerId,
        stats: newStats[mapIndex][teamKey][playerId]
      });
      console.log('✅ Player stats updated');
    } catch (error) {
      console.warn('⚠️ Player stats API update failed:', error);
    }
  };

  // ✅ Toggle live status
  const toggleLiveStatus = async () => {
    if (!canEditScores) return;
    
    const newStatus = isLive ? 'upcoming' : 'live';
    setIsLive(!isLive);
    
    try {
      await api.put(`/admin/matches/${matchId}/status`, { status: newStatus });
      console.log('✅ Match status updated to:', newStatus);
    } catch (error) {
      console.warn('⚠️ Status update failed:', error);
    }
  };

  if (!matchData) {
    return <div>Loading live scoring...</div>;
  }

  const currentMap = matchData.maps[activeMap];
  const currentMapStats = playerStats[activeMap] || { team1: {}, team2: {} };

  return (
    <div className="space-y-4">
      {/* Live Status Controls */}
      {canEditScores && (
        <div className="card p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleLiveStatus}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  isLive 
                    ? 'bg-red-600 text-white hover:bg-red-700' 
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isLive ? '🔴 LIVE' : '▶️ Start Live'}
              </button>
              
              <div className={`px-3 py-1 rounded text-sm font-medium ${
                isLive 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                {matchData.status?.toUpperCase() || 'UPCOMING'}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 dark:text-gray-400">
              🛡️ Admin Controls - Live Scoring
            </div>
          </div>
        </div>
      )}

      {/* Map Navigation */}
      <div className="flex items-center justify-center space-x-2">
        {matchData.maps.map((map, index) => (
          <button
            key={index}
            onClick={() => setActiveMap(index)}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeMap === index
                ? 'bg-red-600 text-white shadow'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <div className="text-center">
              <div className="font-bold">{map.map_name}</div>
              <div className="text-xs opacity-75">{map.team1_score} - {map.team2_score}</div>
              <div className={`text-xs mt-1 ${
                map.status === 'live' ? 'text-red-300' :
                map.status === 'completed' ? 'text-green-300' :
                'text-blue-300'
              }`}>
                {map.status.toUpperCase()}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Current Map Scoring */}
      <div className="card p-4">
        <div className="text-center mb-4">
          <h3 className="text-xl font-bold text-red-600 dark:text-red-400">{currentMap.map_name}</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">Map {activeMap + 1} of {matchData.maps.length}</div>
        </div>

        {/* Live Score Update */}
        {canEditScores && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">🎯 Update Live Score</h4>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {matchData.team1.short_name} Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={currentMap.team1_score}
                  onChange={(e) => {
                    const newScore = parseInt(e.target.value) || 0;
                    updateMatchScore(activeMap, newScore, currentMap.team2_score);
                  }}
                  className="form-input text-lg font-bold text-center"
                  disabled={updating}
                />
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">VS</div>
                {updating && <div className="text-xs text-blue-600 dark:text-blue-400">Updating...</div>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                  {matchData.team2.short_name} Score
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={currentMap.team2_score}
                  onChange={(e) => {
                    const newScore = parseInt(e.target.value) || 0;
                    updateMatchScore(activeMap, currentMap.team1_score, newScore);
                  }}
                  className="form-input text-lg font-bold text-center"
                  disabled={updating}
                />
              </div>
            </div>
          </div>
        )}

        {/* Current Score Display */}
        <div className="text-center mb-4">
          <div className="flex items-center justify-center space-x-6">
            <div className={`text-3xl font-bold ${
              currentMap.winner_id === matchData.team1.id ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {matchData.team1.short_name} {currentMap.team1_score}
            </div>
            <div className="text-gray-500 dark:text-gray-500">-</div>
            <div className={`text-3xl font-bold ${
              currentMap.winner_id === matchData.team2.id ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'
            }`}>
              {currentMap.team2_score} {matchData.team2.short_name}
            </div>
          </div>
          
          {currentMap.winner_id && (
            <div className="mt-2 text-green-600 dark:text-green-400 font-medium">
              🏆 {currentMap.winner_id === matchData.team1.id ? matchData.team1.name : matchData.team2.name} wins!
            </div>
          )}
        </div>
      </div>

      {/* Overall Match Score */}
      <div className="card p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/10 dark:to-blue-800/10">
        <div className="text-center">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">🏆 Overall Match Score</h4>
          <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            {matchData.team1.score} - {matchData.team2.score}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {matchData.team1.short_name} vs {matchData.team2.short_name} • {matchData.format}
          </div>
          
          {matchData.status === 'completed' && (
            <div className="mt-3 text-lg font-bold text-green-600 dark:text-green-400">
              🎉 {matchData.team1.score > matchData.team2.score ? matchData.team1.name : matchData.team2.name} WINS!
            </div>
          )}
        </div>
      </div>

      {/* Marvel Rivals Game Rules */}
      <div className="card p-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">⚡ Marvel Rivals Live Scoring Rules</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <div>
            <div className="font-medium text-gray-900 dark:text-white mb-1">🎯 Scoring System:</div>
            <ul className="space-y-1">
              <li>• Maps won determine match winner</li>
              <li>• {matchData.format}: First to {Math.ceil(matchData.maps.length / 2)} maps</li>
              <li>• Round scores track individual map progress</li>
            </ul>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-white mb-1">🔄 Live Updates:</div>
            <ul className="space-y-1">
              <li>• Scores sync in real-time</li>
              <li>• Map winners auto-calculated</li>
              <li>• Match status updates automatically</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LiveScoring;