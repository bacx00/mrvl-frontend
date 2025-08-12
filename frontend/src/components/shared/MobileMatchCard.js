import React from 'react';

/**
 * VLR.gg Inspired Mobile Match Card Component
 * Optimized for touch interactions with compact display
 */
function MobileMatchCard({ match, onClick, showTournament = true }) {
  const handleClick = () => {
    if (onClick) {
      onClick(match);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    
    if (diffHours < 1 && diffHours > -1) {
      return 'LIVE';
    } else if (diffHours < 24 && diffHours > 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusBadge = () => {
    const status = match.status?.toLowerCase();
    if (status === 'live') {
      return <span className="status-live">LIVE</span>;
    } else if (status === 'completed') {
      return <span className="status-completed">FINAL</span>;
    } else {
      return <span className="status-upcoming">UPCOMING</span>;
    }
  };

  return (
    <div
      onClick={handleClick}
      className="mobile-match-card cursor-pointer active:scale-95 transition-transform"
    >
      {/* Tournament Info - VLR.gg style */}
      {showTournament && match.tournament && (
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate flex-1">
            {match.tournament.name}
          </div>
          {getStatusBadge()}
        </div>
      )}

      {/* Teams Section */}
      <div className="space-y-2">
        {/* Team 1 */}
        <div className="mobile-team-row">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="team-logo flex-shrink-0">
              {match.team1?.logo ? (
                <img 
                  src={match.team1.logo} 
                  alt={match.team1.name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded flex items-center justify-center text-white text-sm font-bold">
                  {match.team1?.short_name?.substring(0, 2) || 'T1'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="team-name text-sm font-medium truncate">
                {match.team1?.name || 'Team 1'}
              </div>
              {match.team1?.short_name && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {match.team1.short_name}
                </div>
              )}
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white min-w-[32px] text-center">
            {match.team1_score !== null ? match.team1_score : '-'}
          </div>
        </div>

        {/* VS Separator */}
        <div className="flex items-center justify-center">
          <div className="w-full h-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="px-3 text-xs text-gray-400 font-medium bg-white dark:bg-gray-800">
            VS
          </div>
          <div className="w-full h-px bg-gray-200 dark:bg-gray-700"></div>
        </div>

        {/* Team 2 */}
        <div className="mobile-team-row">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="team-logo flex-shrink-0">
              {match.team2?.logo ? (
                <img 
                  src={match.team2.logo} 
                  alt={match.team2.name}
                  className="w-8 h-8 rounded object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded flex items-center justify-center text-white text-sm font-bold">
                  {match.team2?.short_name?.substring(0, 2) || 'T2'}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="team-name text-sm font-medium truncate">
                {match.team2?.name || 'Team 2'}
              </div>
              {match.team2?.short_name && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {match.team2.short_name}
                </div>
              )}
            </div>
          </div>
          <div className="text-lg font-bold text-gray-900 dark:text-white min-w-[32px] text-center">
            {match.team2_score !== null ? match.team2_score : '-'}
          </div>
        </div>
      </div>

      {/* Match Details Footer - VLR.gg style */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {formatTime(match.scheduled_at)}
        </div>
        <div className="flex items-center space-x-2">
          {match.format && (
            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
              {match.format}
            </span>
          )}
          {!showTournament && getStatusBadge()}
        </div>
      </div>

      {/* Live Score Updates Indicator */}
      {match.status === 'live' && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        </div>
      )}
    </div>
  );
}

export default MobileMatchCard;