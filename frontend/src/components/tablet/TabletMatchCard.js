import React, { useState } from 'react';
import { TeamLogo } from '../../utils/imageUtils';
import { useDeviceType } from '../../hooks/useDeviceType';

const TabletMatchCard = ({ 
  match, 
  showDetails = true, 
  showStats = true, 
  onMatchClick, 
  isAdmin = false,
  onUpdate 
}) => {
  const { isLandscape, width } = useDeviceType();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [scores, setScores] = useState({
    team1: match.team1?.score || 0,
    team2: match.team2?.score || 0
  });

  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const hasTeams = match.team1 && match.team2;

  const handleCardClick = () => {
    if (onMatchClick) {
      onMatchClick(match);
    } else {
      setExpanded(!expanded);
    }
  };

  const handleScoreSubmit = () => {
    if (scores.team1 === scores.team2) {
      alert('Scores cannot be tied');
      return;
    }

    onUpdate(match.id, {
      team1_score: scores.team1,
      team2_score: scores.team2,
      status: 'completed'
    });
    setEditing(false);
  };

  const getMatchStatusColor = () => {
    switch (match.status) {
      case 'live': return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'completed': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'upcoming': return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      default: return 'border-gray-300 dark:border-gray-700';
    }
  };

  const getTeamWinnerStyle = (teamNumber) => {
    if (!isCompleted) return '';
    const isWinner = teamNumber === 1 ? 
      match.team1?.score > match.team2?.score : 
      match.team2?.score > match.team1?.score;
    
    return isWinner ? 
      'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700' : 
      'opacity-75';
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getScoreStyle = (teamNumber) => {
    if (!isCompleted) return 'text-gray-700 dark:text-gray-300';
    const isWinner = teamNumber === 1 ? 
      match.team1?.score > match.team2?.score : 
      match.team2?.score > match.team1?.score;
    return isWinner ? 'text-green-600 font-bold' : 'text-gray-500';
  };

  return (
    <div className={`
      relative overflow-hidden rounded-2xl border-2 transition-all duration-300
      hover:shadow-xl cursor-pointer bg-white dark:bg-gray-800
      ${getMatchStatusColor()}
      ${expanded ? 'shadow-2xl scale-105' : 'shadow-lg'}
      ${isLandscape ? 'min-h-40' : 'min-h-36'}
    `}>
      {/* Live Animation Overlay */}
      {isLive && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 animate-pulse"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-pulse"></div>
        </div>
      )}

      <div className="relative z-10" onClick={handleCardClick}>
        {/* Header Section */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            {/* Match Status Badge */}
            <div className={`
              px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
              ${isLive ? 'bg-red-600 text-white animate-pulse' : ''}
              ${isCompleted ? 'bg-green-600 text-white' : ''}
              ${isUpcoming ? 'bg-blue-600 text-white' : ''}
            `}>
              {match.status}
            </div>
            
            {/* Match Format */}
            {match.format && (
              <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-400">
                {match.format.toUpperCase()}
              </div>
            )}
            
            {/* Round Info */}
            {match.round_text && (
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {match.round_text}
              </div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          <button 
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            <svg 
              className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Teams Section */}
        <div className="p-4 space-y-3">
          {/* Team 1 */}
          <div className={`
            flex items-center justify-between p-4 rounded-xl border
            ${getTeamWinnerStyle(1)}
            ${!getTeamWinnerStyle(1) ? 'border-gray-200 dark:border-gray-700' : ''}
          `}>
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {match.team1 ? (
                <>
                  <TeamLogo team={match.team1} size="w-12 h-12" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate">
                      {match.team1.name}
                    </h3>
                    {showDetails && match.team1.region && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {match.team1.region}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">?</span>
                  </div>
                  <span className="text-xl text-gray-400 font-medium italic">TBD</span>
                </div>
              )}
            </div>
            
            {/* Score Display */}
            <div className="flex items-center space-x-3">
              {isAdmin && editing && hasTeams ? (
                <input
                  type="number"
                  value={scores.team1}
                  onChange={(e) => setScores({ ...scores, team1: parseInt(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 px-2 py-2 border rounded-lg text-center text-lg font-bold"
                  min="0"
                  max="99"
                />
              ) : (
                <span className={`text-3xl font-bold ${getScoreStyle(1)}`}>
                  {match.team1?.score ?? '-'}
                </span>
              )}
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-400">VS</span>
            </div>
          </div>

          {/* Team 2 */}
          <div className={`
            flex items-center justify-between p-4 rounded-xl border
            ${getTeamWinnerStyle(2)}
            ${!getTeamWinnerStyle(2) ? 'border-gray-200 dark:border-gray-700' : ''}
          `}>
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              {match.team2 ? (
                <>
                  <TeamLogo team={match.team2} size="w-12 h-12" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white truncate">
                      {match.team2.name}
                    </h3>
                    {showDetails && match.team2.region && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {match.team2.region}
                      </p>
                    )}
                  </div>
                </>
              ) : match.is_bye ? (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-xs">BYE</span>
                  </div>
                  <span className="text-xl text-yellow-600 font-medium">BYE</span>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400 text-xs">?</span>
                  </div>
                  <span className="text-xl text-gray-400 font-medium italic">TBD</span>
                </div>
              )}
            </div>
            
            {/* Score Display */}
            <div className="flex items-center space-x-3">
              {isAdmin && editing && hasTeams ? (
                <input
                  type="number"
                  value={scores.team2}
                  onChange={(e) => setScores({ ...scores, team2: parseInt(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                  className="w-16 px-2 py-2 border rounded-lg text-center text-lg font-bold"
                  min="0"
                  max="99"
                />
              ) : (
                <span className={`text-3xl font-bold ${getScoreStyle(2)}`}>
                  {match.team2?.score ?? '-'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && showDetails && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className={`grid gap-4 ${isLandscape ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {/* Match Details */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Match Details
                </h4>
                <div className="space-y-1 text-sm">
                  {match.scheduled_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Date:</span>
                      <span className="font-medium">{formatDateTime(match.scheduled_at).date}</span>
                    </div>
                  )}
                  {match.scheduled_at && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Time:</span>
                      <span className="font-medium">{formatDateTime(match.scheduled_at).time}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Format:</span>
                    <span className="font-medium">{match.format || 'TBD'}</span>
                  </div>
                </div>
              </div>

              {/* Tournament Info */}
              {match.tournament && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Tournament
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="font-medium">{match.tournament.name}</div>
                    {match.tournament.stage && (
                      <div className="text-gray-500">{match.tournament.stage}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Stats */}
              {showStats && isLandscape && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Statistics
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Maps:</span>
                      <span className="font-medium">{match.maps?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Duration:</span>
                      <span className="font-medium">{match.duration || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin Controls */}
        {isAdmin && hasTeams && !isCompleted && (
          <div 
            className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50"
            onClick={(e) => e.stopPropagation()}
          >
            {editing ? (
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium touch-target"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreSubmit}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium touch-target"
                >
                  Save Score
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="w-full py-3 text-blue-600 hover:text-blue-700 font-medium text-center border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
              >
                Update Score
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabletMatchCard;