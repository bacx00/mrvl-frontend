import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../../hooks';

const MobileTeamScore = memo(({ team, score, isWinner }) => (
  <div className={`flex items-center space-x-2 ${!isWinner ? 'opacity-60' : ''}`}>
    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
        {team?.short_name?.[0] || team?.name?.[0] || '?'}
      </span>
    </div>
    <div>
      <div className="text-sm font-bold text-gray-900 dark:text-white">
        {team?.name || 'Unknown Team'}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {team?.region || 'Unknown'}
      </div>
    </div>
  </div>
));

const MobileMapCard = memo(({ map, isSelected, onClick }) => {
  if (!map) return null;
  
  const getStatusColor = () => {
    switch (map.status) {
      case 'live': return 'border-red-500 bg-red-50 dark:bg-red-900/10';
      case 'completed': return 'border-green-500 bg-green-50 dark:bg-green-900/10';
      default: return 'border-gray-300 dark:border-gray-600';
    }
  };

  return (
    <div 
      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${getStatusColor()} ${
        isSelected ? 'ring-2 ring-red-500' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-900 dark:text-white">
          {map.name || `Map ${map.map_number || 1}`}
        </span>
        {map.status === 'live' && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
            LIVE
          </span>
        )}
      </div>
      <div className="flex items-center justify-center">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {map.team1_score || 0} - {map.team2_score || 0}
        </span>
      </div>
    </div>
  );
});

function MobileFastMatchDetail({ matchId, navigateTo }) {
  const { api, user, isAuthenticated } = useAuth();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMapIndex, setSelectedMapIndex] = useState(0);
  const [error, setError] = useState(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) {
      setError('No match ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/matches/${matchId}`);
      const matchData = response.data;
      
      if (matchData) {
        setMatch(matchData);
        setError(null);
      } else {
        setError('Match not found');
      }
    } catch (err) {
      console.error('Error fetching match:', err);
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  }, [api, matchId]);

  useEffect(() => {
    fetchMatch();
  }, [fetchMatch]);

  const handleMapSelect = useCallback((index) => {
    setSelectedMapIndex(index);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading match...</span>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {error || 'Match Not Found'}
          </h2>
          <button 
            onClick={() => navigateTo('home')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  const currentMap = match.maps?.[selectedMapIndex];
  const team1Score = match.team1_score || 0;
  const team2Score = match.team2_score || 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => navigateTo('home')}
              className="text-red-600 dark:text-red-400 font-medium text-sm"
            >
              ← Back
            </button>
            {match.status === 'live' && (
              <div className="flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                <span className="text-xs text-red-600 dark:text-red-400 font-bold">LIVE</span>
              </div>
            )}
          </div>

          {/* Tournament Info */}
          <div className="text-center mb-4">
            <h1 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {match.event?.name || 'Tournament'}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {match.format} • {match.status}
            </p>
          </div>

          {/* Match Score */}
          <div className="flex items-center justify-between">
            <MobileTeamScore 
              team={match.team1} 
              score={team1Score}
              isWinner={match.status === 'completed' && team1Score > team2Score}
            />
            
            <div className="text-center px-4">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {team1Score} - {team2Score}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {match.format}
              </div>
            </div>
            
            <MobileTeamScore 
              team={match.team2} 
              score={team2Score}
              isWinner={match.status === 'completed' && team2Score > team1Score}
            />
          </div>
        </div>
      </div>

      {/* Maps Section */}
      {match.maps && match.maps.length > 0 && (
        <div className="px-4 py-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Maps ({match.maps.length})
          </h2>
          
          {/* Map Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {match.maps.map((map, index) => (
              <MobileMapCard
                key={map.id || index}
                map={map}
                isSelected={selectedMapIndex === index}
                onClick={() => handleMapSelect(index)}
              />
            ))}
          </div>

          {/* Selected Map Details */}
          {currentMap && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {currentMap.name || `Map ${selectedMapIndex + 1}`}
                </h3>
                {currentMap.status === 'live' && (
                  <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
                    LIVE
                  </span>
                )}
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                  {currentMap.team1_score || 0} - {currentMap.team2_score || 0}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentMap.status === 'completed' ? 'Final Score' : 'Current Score'}
                </p>
              </div>

              {/* Map-specific details can be added here */}
              {currentMap.duration && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Duration: {currentMap.duration}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Admin Controls */}
      {isAuthenticated && user?.role === 'admin' && (
        <div className="px-4 pb-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h3 className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-2">
              Admin Controls
            </h3>
            <button 
              onClick={() => navigateTo('admin')}
              className="px-3 py-2 bg-yellow-600 text-white text-sm rounded font-medium"
            >
              Open Live Scoring
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default MobileFastMatchDetail;