import React, { useMemo } from 'react';
import LiquipediaMatchCard from './LiquipediaMatchCard';

/**
 * Liquipedia-style Single Elimination Bracket
 * Clean tournament bracket with progressive elimination visualization
 */
function LiquipediaSingleEliminationBracket({
  bracket,
  onMatchClick,
  onTeamClick,
  hoveredMatch,
  selectedMatch,
  onMatchHover,
  compact = false,
  showRoundNames = true
}) {
  const rounds = bracket?.bracket || bracket?.rounds || [];

  // Calculate bracket layout
  const bracketLayout = useMemo(() => {
    if (!rounds.length) return { rounds: [], totalHeight: 0 };

    return {
      rounds: rounds.map((round, roundIndex) => {
        const matchSpacing = Math.pow(2, roundIndex) * 100; // Exponential spacing
        const baseOffset = matchSpacing / 2;
        
        return {
          ...round,
          roundIndex,
          matchSpacing,
          baseOffset,
          matches: round.matches?.map((match, matchIndex) => ({
            ...match,
            yPosition: baseOffset + (matchIndex * matchSpacing)
          })) || []
        };
      }),
      totalHeight: Math.max(400, rounds[0]?.matches?.length * 100 || 400)
    };
  }, [rounds]);

  const getRoundName = (round, roundIndex, totalRounds) => {
    // Standard tournament round names
    const roundNames = {
      0: totalRounds > 4 ? 'Round of 32' : totalRounds > 3 ? 'Round of 16' : 'First Round',
      1: totalRounds > 4 ? 'Round of 16' : totalRounds > 3 ? 'Quarterfinals' : 'Semifinals', 
      2: totalRounds > 4 ? 'Quarterfinals' : 'Finals',
      3: totalRounds > 4 ? 'Semifinals' : null,
      4: 'Finals'
    };

    // Handle specific bracket sizes
    if (totalRounds === 1) return 'Finals';
    if (totalRounds === 2 && roundIndex === 0) return 'Semifinals';
    if (totalRounds === 2 && roundIndex === 1) return 'Finals';

    return round.name || roundNames[roundIndex] || `Round ${roundIndex + 1}`;
  };

  if (!rounds.length) {
    return (
      <div className="flex items-center justify-center p-16 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <div className="text-4xl mb-4">🏆</div>
          <p className="text-lg font-medium">No bracket data available</p>
          <p className="text-sm mt-2">Tournament bracket will appear here once created</p>
        </div>
      </div>
    );
  }

  return (
    <div className="single-elimination-bracket w-full">
      {/* Bracket Container */}
      <div className="relative overflow-x-auto">
        <div 
          className="flex space-x-16 pb-8"
          style={{ minHeight: `${bracketLayout.totalHeight}px` }}
        >
          {bracketLayout.rounds.map((round, roundIndex) => (
            <div key={roundIndex} className="relative flex-shrink-0" style={{ minWidth: compact ? '240px' : '300px' }}>
              {/* Round Header */}
              {showRoundNames && (
                <div className="text-center mb-8 sticky top-0 z-10 bg-white dark:bg-gray-900 py-2">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-blue-500 pb-2 inline-block">
                    {getRoundName(round, roundIndex, bracketLayout.rounds.length)}
                  </h4>
                  {round.start_date && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(round.start_date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        hour: round.start_time ? 'numeric' : undefined,
                        minute: round.start_time ? '2-digit' : undefined
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Matches */}
              <div className="relative">
                {round.matches.map((match, matchIndex) => (
                  <div
                    key={match.id || matchIndex}
                    className="absolute transition-all duration-300"
                    style={{
                      top: `${match.yPosition}px`,
                      transform: hoveredMatch?.id === match.id ? 'scale(1.02)' : 'scale(1)'
                    }}
                  >
                    <LiquipediaMatchCard
                      match={match}
                      onClick={onMatchClick}
                      onTeamClick={onTeamClick}
                      isHovered={hoveredMatch?.id === match.id}
                      isSelected={selectedMatch?.id === match.id}
                      compact={compact}
                      showConnector={roundIndex < bracketLayout.rounds.length - 1}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* SVG Connectors */}
        <BracketConnectors rounds={bracketLayout.rounds} />
      </div>
    </div>
  );
}

/**
 * SVG Bracket Connectors for visual flow
 */
function BracketConnectors({ rounds }) {
  if (!rounds || rounds.length < 2) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      style={{ zIndex: 1 }}
      preserveAspectRatio="none"
    >
      {rounds.map((round, roundIndex) => {
        if (roundIndex >= rounds.length - 1) return null;

        const nextRound = rounds[roundIndex + 1];
        const roundWidth = 300;
        const connectorLength = 64;

        return round.matches.map((match, matchIndex) => {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const nextMatch = nextRound.matches[nextMatchIndex];
          
          if (!nextMatch) return null;

          const fromX = (roundIndex + 1) * (roundWidth + 64) - connectorLength;
          const fromY = match.yPosition + 50; // Center of match card
          const toX = fromX + connectorLength;
          const toY = nextMatch.yPosition + 50;
          const midX = fromX + connectorLength / 2;

          return (
            <g key={`connector-${roundIndex}-${matchIndex}`}>
              {/* Horizontal line from match */}
              <line
                x1={fromX}
                y1={fromY}
                x2={midX}
                y2={fromY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300 dark:text-gray-600 bracket-connector"
              />
              
              {/* Vertical connecting line */}
              {matchIndex % 2 === 0 && matchIndex < round.matches.length - 1 && (
                <line
                  x1={midX}
                  y1={fromY}
                  x2={midX}
                  y2={round.matches[matchIndex + 1].yPosition + 50}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300 dark:text-gray-600 bracket-connector"
                />
              )}
              
              {/* Horizontal line to next match */}
              {matchIndex % 2 === 0 && (
                <line
                  x1={midX}
                  y1={(fromY + round.matches[Math.min(matchIndex + 1, round.matches.length - 1)].yPosition + 50) / 2}
                  x2={toX}
                  y2={toY}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300 dark:text-gray-600 bracket-connector"
                />
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}

export default LiquipediaSingleEliminationBracket;