import React from 'react';
import { TeamLogo } from '../utils/imageUtils';

/**
 * Liquipedia-style Match Card Component
 * Clean, functional design matching VLR.gg/Liquipedia aesthetics
 */
function LiquipediaMatchCard({ 
  match, 
  onClick, 
  onTeamClick, 
  isHovered = false, 
  isSelected = false,
  showConnector = false,
  compact = false 
}) {
  if (!match) return null;

  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const team1Won = isCompleted && match.team1_score > match.team2_score;
  const team2Won = isCompleted && match.team2_score > match.team1_score;

  const handleMatchClick = (e) => {
    e.preventDefault();
    if (onClick) onClick(match);
  };

  const handleTeamClick = (team, e) => {
    e.stopPropagation();
    if (onTeamClick && team) {
      onTeamClick(team);
    }
  };

  return (
    <div 
      className={`
        bracket-match relative bg-white dark:bg-gray-900 border rounded-md overflow-hidden 
        transition-all duration-150 cursor-pointer select-none
        ${isLive ? 'border-red-400 ring-2 ring-red-200 dark:ring-red-800' : 'border-gray-300 dark:border-gray-600'}
        ${isHovered ? 'border-blue-400 shadow-md transform scale-[1.02]' : ''}
        ${isSelected ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''}
        ${compact ? 'min-w-[220px]' : 'min-w-[280px]'}
        hover:shadow-sm hover:border-gray-400 dark:hover:border-gray-500
      `}
      onClick={handleMatchClick}
    >
      {/* Match Header - Live indicator and match info */}
      {(isLive || match.match_number || match.bo) && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {match.match_number && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                Match {match.match_number}
              </span>
            )}
            {match.bo && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                BO{match.bo}
              </span>
            )}
          </div>
          
          {isLive && (
            <div className="match-live-indicator">
              <div className="match-live-dot">
                <span className="match-live-dot-ping"></span>
                <span className="match-live-dot-core"></span>
              </div>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* Teams Container */}
      <div className="relative">
        {/* Team 1 */}
        <div 
          className={`
            flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 
            transition-colors duration-150
            ${team1Won ? 'team-row-winner' : team2Won ? 'team-row-loser' : ''}
            hover:bg-gray-50 dark:hover:bg-gray-800/50
          `}
          onClick={(e) => handleTeamClick(match.team1, e)}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {match.team1 ? (
              <>
                <TeamLogo 
                  team={match.team1} 
                  size={compact ? "w-6 h-6" : "w-8 h-8"} 
                  className="flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className={`
                    font-medium truncate block leading-tight
                    ${team1Won ? 'text-gray-900 dark:text-white font-semibold' : 
                      team2Won ? 'text-gray-500 dark:text-gray-400' : 
                      'text-gray-900 dark:text-white'}
                  `}>
                    {match.team1.name}
                  </span>
                  {match.team1.region && !compact && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 block">
                      {match.team1.region}
                    </span>
                  )}
                </div>
                {match.team1.seed && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">
                    #{match.team1.seed}
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0`}></div>
                <span className="text-gray-400 dark:text-gray-600 italic font-medium">TBD</span>
              </div>
            )}
          </div>
          
          {/* Score */}
          <div className="ml-3 flex-shrink-0">
            <span className={`
              team-score text-lg font-bold min-w-[28px]
              ${team1Won ? 'team-score-winner text-green-600 dark:text-green-400' : 'team-score-default'}
            `}>
              {match.team1_score !== undefined ? match.team1_score : '—'}
            </span>
          </div>
        </div>

        {/* Team 2 */}
        <div 
          className={`
            flex items-center justify-between p-3 transition-colors duration-150
            ${team2Won ? 'team-row-winner' : team1Won ? 'team-row-loser' : ''}
            hover:bg-gray-50 dark:hover:bg-gray-800/50
          `}
          onClick={(e) => handleTeamClick(match.team2, e)}
        >
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {match.team2 ? (
              <>
                <TeamLogo 
                  team={match.team2} 
                  size={compact ? "w-6 h-6" : "w-8 h-8"} 
                  className="flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <span className={`
                    font-medium truncate block leading-tight
                    ${team2Won ? 'text-gray-900 dark:text-white font-semibold' : 
                      team1Won ? 'text-gray-500 dark:text-gray-400' : 
                      'text-gray-900 dark:text-white'}
                  `}>
                    {match.team2.name}
                  </span>
                  {match.team2.region && !compact && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 block">
                      {match.team2.region}
                    </span>
                  )}
                </div>
                {match.team2.seed && (
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded flex-shrink-0">
                    #{match.team2.seed}
                  </span>
                )}
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0`}></div>
                <span className="text-gray-400 dark:text-gray-600 italic font-medium">TBD</span>
              </div>
            )}
          </div>
          
          {/* Score */}
          <div className="ml-3 flex-shrink-0">
            <span className={`
              team-score text-lg font-bold min-w-[28px]
              ${team2Won ? 'team-score-winner text-green-600 dark:text-green-400' : 'team-score-default'}
            `}>
              {match.team2_score !== undefined ? match.team2_score : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Match Footer - Time/Status */}
      {(match.scheduled_at || match.completed_at || match.stream_url) && (
        <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isCompleted && match.completed_at 
                ? formatTime(match.completed_at)
                : match.scheduled_at 
                ? formatTime(match.scheduled_at, true)
                : ''
              }
            </span>
            {match.stream_url && (
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-600 dark:text-red-400 font-medium">Stream</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Connector Line (for bracket visualization) */}
      {showConnector && (
        <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 w-8 h-0.5 bg-gray-300 dark:bg-gray-600"></div>
      )}
    </div>
  );
}

// Helper function for time formatting
function formatTime(dateString, isScheduled = false) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (isScheduled) {
    if (diffMs < 0) {
      const absDiffMins = Math.abs(diffMins);
      if (absDiffMins < 60) return `in ${absDiffMins}m`;
      if (absDiffMins < 1440) return `in ${Math.floor(absDiffMins / 60)}h`;
      return date.toLocaleDateString();
    }
  }

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

export default LiquipediaMatchCard;