import React, { useState, useRef, useEffect } from 'react';

/**
 * VLR.gg Inspired Mobile Tournament Bracket Component
 * Optimized for touch interactions and small screens
 */
function MobileTournamentBracket({ tournament, matches, onMatchClick }) {
  const [currentRound, setCurrentRound] = useState(0);
  const scrollRef = useRef(null);

  // Group matches by rounds for mobile display
  const roundMatches = matches.reduce((acc, match) => {
    const round = match.round || 0;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  const rounds = Object.keys(roundMatches).sort((a, b) => a - b);

  // VLR.gg style horizontal scroll with snap
  const scrollToRound = (roundIndex) => {
    setCurrentRound(roundIndex);
    if (scrollRef.current) {
      const roundElement = scrollRef.current.children[roundIndex];
      if (roundElement) {
        roundElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'nearest', 
          inline: 'start' 
        });
      }
    }
  };

  return (
    <div className="mobile-bracket-container">
      {/* Round Navigation Tabs - VLR.gg style */}
      <div className="flex overflow-x-auto mb-4 border-b border-gray-200 dark:border-gray-700">
        {rounds.map((round, index) => (
          <button
            key={round}
            onClick={() => scrollToRound(index)}
            className={`flex-shrink-0 px-4 py-2 text-sm font-medium whitespace-nowrap touch-target ${
              currentRound === index
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            {round === '0' ? 'Round 1' : `Round ${parseInt(round) + 1}`}
          </button>
        ))}
      </div>

      {/* Horizontal Scrolling Bracket - VLR.gg style */}
      <div 
        ref={scrollRef}
        className="mobile-bracket flex overflow-x-auto space-x-4 pb-4"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {rounds.map((round, roundIndex) => (
          <div 
            key={round}
            className="mobile-bracket-round flex-shrink-0"
            style={{ scrollSnapAlign: 'start' }}
          >
            <div className="space-y-3">
              {roundMatches[round].map((match) => (
                <div
                  key={match.id}
                  onClick={() => onMatchClick && onMatchClick(match)}
                  className="mobile-match-card cursor-pointer hover:shadow-md"
                >
                  {/* Team 1 */}
                  <div className="mobile-team-row">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-sm font-bold">
                        {match.team1?.short_name?.substring(0, 2) || 'T1'}
                      </div>
                      <span className="font-medium text-sm truncate">
                        {match.team1?.name || 'Team 1'}
                      </span>
                    </div>
                    <div className="text-lg font-bold min-w-[24px] text-center">
                      {match.team1_score || '0'}
                    </div>
                  </div>

                  {/* VS Divider */}
                  <div className="flex items-center justify-center py-1">
                    <div className="text-xs text-gray-400 font-medium">VS</div>
                  </div>

                  {/* Team 2 */}
                  <div className="mobile-team-row">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center text-sm font-bold">
                        {match.team2?.short_name?.substring(0, 2) || 'T2'}
                      </div>
                      <span className="font-medium text-sm truncate">
                        {match.team2?.name || 'Team 2'}
                      </span>
                    </div>
                    <div className="text-lg font-bold min-w-[24px] text-center">
                      {match.team2_score || '0'}
                    </div>
                  </div>

                  {/* Match Status - VLR.gg style */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-xs text-gray-500">
                      {match.scheduled_at ? 
                        new Date(match.scheduled_at).toLocaleDateString() : 
                        'TBD'
                      }
                    </div>
                    <div className={`status-badge px-2 py-1 text-xs font-bold rounded-full ${
                      match.status === 'live' ? 'status-live' :
                      match.status === 'completed' ? 'status-completed' :
                      'status-upcoming'
                    }`}>
                      {match.status?.toUpperCase() || 'UPCOMING'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Round Indicators - VLR.gg style */}
      <div className="flex justify-center space-x-1 mt-4">
        {rounds.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollToRound(index)}
            className={`w-2 h-2 rounded-full transition-colors touch-target ${
              currentRound === index ? 'bg-red-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
            aria-label={`Go to round ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default MobileTournamentBracket;