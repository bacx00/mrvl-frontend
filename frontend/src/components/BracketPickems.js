import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { TeamLogo } from '../utils/imageUtils';

function BracketPickems({ eventId, bracket, navigateTo }) {
  const [predictions, setPredictions] = useState({});
  const [userPredictions, setUserPredictions] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('predict');
  const { api, user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (eventId && isAuthenticated) {
      fetchPickemData();
    }
  }, [eventId, isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPickemData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's predictions
      const predictionsRes = await api.get(`/pickems/${eventId}/my-predictions`);
      setUserPredictions(predictionsRes.data?.predictions || {});
      setPoints(predictionsRes.data?.points || 0);
      
      // Fetch leaderboard
      const leaderboardRes = await api.get(`/pickems/${eventId}/leaderboard`);
      setLeaderboard(leaderboardRes.data?.leaderboard || []);
      setUserRank(leaderboardRes.data?.user_rank || null);
      
    } catch (error) {
      console.error('Error fetching pickem data:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitPredictions = async () => {
    try {
      setSaving(true);
      
      await api.post(`/pickems/${eventId}/predictions`, {
        predictions: predictions
      });
      
      await fetchPickemData();
      alert('Predictions saved successfully!');
      
    } catch (error) {
      console.error('Error saving predictions:', error);
      alert('Failed to save predictions. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const makePrediction = (matchId, teamId) => {
    setPredictions(prev => ({
      ...prev,
      [matchId]: teamId
    }));
  };

  const getMatchPoints = (matchId) => {
    const match = findMatchById(matchId);
    if (!match) return 0;
    
    // Different point values based on round
    const roundPoints = {
      'Round 1': 1,
      'Round of 16': 1,
      'Quarterfinals': 2,
      'Quarter-Finals': 2,
      'Semifinals': 4,
      'Semi-Finals': 4,
      'Finals': 8,
      'Grand Finals': 8,
      '3rd Place': 2
    };
    
    return roundPoints[match.round_name] || 1;
  };

  const findMatchById = (matchId) => {
    if (!bracket?.rounds) return null;
    
    for (const round of bracket.rounds) {
      const match = round.matches?.find(m => m.id === matchId);
      if (match) {
        return { ...match, round_name: round.name };
      }
    }
    return null;
  };

  const isPredictionLocked = (match) => {
    // Lock predictions 30 minutes before match starts or when match is live/completed
    if (match.status === 'live' || match.status === 'completed') return true;
    
    if (match.scheduled_at) {
      const matchTime = new Date(match.scheduled_at);
      const lockTime = new Date(matchTime.getTime() - 30 * 60 * 1000); // 30 minutes before
      return new Date() > lockTime;
    }
    
    return false;
  };

  const getPredictionAccuracy = () => {
    let correct = 0;
    let total = 0;
    
    Object.entries(userPredictions).forEach(([matchId, predictedTeamId]) => {
      const match = findMatchById(matchId);
      if (match && match.status === 'completed') {
        total++;
        const winnerId = match.team1_score > match.team2_score ? match.team1?.id : match.team2?.id;
        if (predictedTeamId === winnerId) {
          correct++;
        }
      }
    });
    
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  const renderPickemMatch = (match, roundName) => {
    const isLocked = isPredictionLocked(match);
    const currentPrediction = predictions[match.id] || userPredictions[match.id];
    const pointValue = getMatchPoints(match.id);
    const isCompleted = match.status === 'completed';
    const winnerId = isCompleted ? 
      (match.team1_score > match.team2_score ? match.team1?.id : match.team2?.id) : null;
    const isCorrect = isCompleted && userPredictions[match.id] === winnerId;

    return (
      <div key={match.id} className={`border rounded-lg p-4 ${
        isCompleted ? (isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                      userPredictions[match.id] ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 
                      'border-gray-300 dark:border-gray-600') :
        isLocked ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
        'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}>
        {/* Match Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Match {match.match_number || match.id}
            </span>
            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded">
              {pointValue} {pointValue === 1 ? 'point' : 'points'}
            </span>
          </div>
          
          {isCompleted && userPredictions[match.id] && (
            <span className={`text-xs px-2 py-1 rounded ${
              isCorrect ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
              'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}>
              {isCorrect ? `+${pointValue}` : '0'}
            </span>
          )}
          
          {isLocked && !isCompleted && (
            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 rounded">
              🔒 Locked
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="space-y-2">
          {[match.team1, match.team2].map((team, index) => {
            const isSelected = currentPrediction === team?.id;
            const isWinner = winnerId === team?.id;
            
            return (
              <button
                key={team?.id || index}
                onClick={() => !isLocked && team && makePrediction(match.id, team.id)}
                disabled={isLocked || !team}
                className={`w-full flex items-center justify-between p-3 rounded border transition-all ${
                  !team ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' :
                  isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                  'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                } ${isWinner ? 'ring-2 ring-green-500' : ''}`}
              >
                <div className="flex items-center space-x-3">
                  {team ? (
                    <>
                      <TeamLogo team={team} size="w-8 h-8" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {team.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-400 italic">TBD</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {isCompleted && (
                    <span className="font-bold text-lg">
                      {index === 0 ? match.team1_score : match.team2_score}
                    </span>
                  )}
                  
                  {isSelected && (
                    <span className="text-red-500">✓</span>
                  )}
                  
                  {isWinner && (
                    <span className="text-green-500">🏆</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Match Status */}
        <div className="mt-3 text-center">
          <span className={`text-xs px-2 py-1 rounded ${
            match.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
            match.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
          }`}>
            {match.status?.toUpperCase() || 'UPCOMING'}
          </span>
          
          {match.scheduled_at && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(match.scheduled_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400 mb-4">
          Sign in to make bracket predictions and compete on the leaderboard!
        </div>
        <button
          onClick={() => navigateTo && navigateTo('login')}
          className="btn btn-primary"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading pick'em...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            🎯 Bracket Pick'em Challenge
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Predict match winners to earn points and climb the leaderboard
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{points}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Points</div>
          </div>
          
          {userRank && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">#{userRank}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Rank</div>
            </div>
          )}
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{getPredictionAccuracy()}%</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('predict')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'predict'
              ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Make Predictions
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'leaderboard'
              ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          Leaderboard ({leaderboard.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === 'predict' ? (
        <div className="space-y-6">
          {/* Save Button */}
          {Object.keys(predictions).length > 0 && (
            <div className="text-center">
              <button
                onClick={submitPredictions}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : `Save ${Object.keys(predictions).length} Prediction${Object.keys(predictions).length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {/* Prediction Rounds */}
          {bracket?.rounds?.map((round) => (
            <div key={round.name} className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                {round.name}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {round.matches?.map((match) => renderPickemMatch(match, round.name))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Leaderboard */
        <div className="space-y-4">
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white">Global Leaderboard</h4>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {leaderboard.map((entry, index) => (
                <div key={entry.user_id} className={`p-4 flex items-center justify-between ${
                  entry.user_id === user?.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <span className={`font-bold text-lg ${
                      index === 0 ? 'text-yellow-500' :
                      index === 1 ? 'text-gray-400' :
                      index === 2 ? 'text-orange-500' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>
                      #{index + 1}
                    </span>
                    
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {entry.username}
                        {entry.user_id === user?.id && (
                          <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.correct_predictions}/{entry.total_predictions} correct ({entry.accuracy}%)
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg text-red-600 dark:text-red-400">
                      {entry.points}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">points</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BracketPickems;