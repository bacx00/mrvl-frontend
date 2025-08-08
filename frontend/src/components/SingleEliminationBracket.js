import React from 'react';
import { TeamLogo } from '../utils/imageUtils';

function SingleEliminationBracket({ 
  bracket, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate,
  liveScores = {},
  className = ''
}) {
  const rounds = bracket.bracket || bracket.rounds || [];

  const getRoundName = (round, index, totalRounds) => {
    if (round.name) return round.name.toUpperCase();
    
    const roundsFromEnd = totalRounds - index;
    const roundNames = {
      1: 'FINAL',
      2: 'SEMI-FINAL',
      3: 'QUARTER-FINAL',
      4: 'ROUND OF 16',
      5: 'ROUND OF 32',
      6: 'ROUND OF 64'
    };
    
    return roundNames[roundsFromEnd] || `ROUND ${index + 1}`;
  };

  if (!rounds || rounds.length === 0) {
    return (
      <div className={`single-elimination-bracket ${className}`}>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No bracket rounds available
        </div>
      </div>
    );
  }

  return (
    <div className={`single-elimination-bracket ${className}`}>
      <div className="relative">
        <div className="overflow-x-auto">
          <div className="flex space-x-8 justify-start min-w-fit py-8">
            {rounds.map((round, roundIndex) => (
              <BracketRound
                key={roundIndex}
                round={round}
                roundIndex={roundIndex}
                totalRounds={rounds.length}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                selectedMatch={selectedMatch}
                setSelectedMatch={setSelectedMatch}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                getRoundName={getRoundName}
                liveScores={liveScores}
              />
            ))}
          </div>
        </div>
        
        {/* SVG Bracket Connectors */}
        <BracketConnectors rounds={rounds} />
      </div>
    </div>
  );
}

// Individual bracket round component
function BracketRound({ 
  round, 
  roundIndex, 
  totalRounds, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate, 
  getRoundName,
  liveScores = {}
}) {
  const roundName = getRoundName(round, roundIndex, totalRounds);
  
  // Calculate progressive spacing for tournament tree structure
  const baseSpacing = 80;
  const matchSpacing = baseSpacing * Math.pow(2, Math.max(0, roundIndex));
  
  return (
    <div className="bracket-round relative" style={{ minWidth: '280px' }}>
      {/* Round Header */}
      <div className="text-center mb-6 sticky top-0 z-10 bg-white dark:bg-gray-900 py-2">
        <div className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h5 className="text-sm font-bold text-gray-900 dark:text-white tracking-wider">
            {roundName}
          </h5>
          {round.start_date && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {new Date(round.start_date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {round.matches?.length || 0} match{(round.matches?.length || 0) !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>

      {/* Matches with progressive spacing */}
      <div className="space-y-4">
        {round.matches && round.matches.map((match, matchIndex) => (
          <div
            key={match.id || matchIndex}
            className="relative"
            style={{ 
              marginTop: matchIndex > 0 ? `${matchSpacing}px` : '0px'
            }}
          >
            <BracketMatch
              match={match}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              selectedMatch={selectedMatch}
              setSelectedMatch={setSelectedMatch}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              roundIndex={roundIndex}
              matchIndex={matchIndex}
              liveScores={liveScores}
              isFinal={roundIndex === totalRounds - 1}
            />

            {/* Connection line to next round */}
            {roundIndex < totalRounds - 1 && (
              <div className="absolute left-full top-1/2 w-8 h-0.5 bg-gray-300 dark:bg-gray-600 transform -translate-y-0.5 z-0"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced match component for single elimination
function BracketMatch({ 
  match, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate, 
  roundIndex,
  matchIndex,
  liveScores = {},
  isFinal = false
}) {
  // Merge live score data
  const liveData = liveScores[match.id];
  const effectiveMatch = liveData ? {
    ...match,
    team1_score: liveData.team1_score ?? match.team1_score,
    team2_score: liveData.team2_score ?? match.team2_score,
    status: liveData.status ?? match.status
  } : match;

  const isCompleted = effectiveMatch.status === 'completed';
  const isLive = effectiveMatch.status === 'live';
  const team1Won = isCompleted && (effectiveMatch.team1_score > effectiveMatch.team2_score);
  const team2Won = isCompleted && (effectiveMatch.team2_score > effectiveMatch.team1_score);
  const isHovered = hoveredMatch?.id === match.id;

  const handleMatchClick = () => {
    if (match.id) {
      setSelectedMatch(effectiveMatch);
    }
  };

  const handleTeamClick = (team, e) => {
    e.stopPropagation();
    if (team && navigateTo) {
      navigateTo('team-detail', { id: team.id });
    }
  };

  const getMatchBorderClass = () => {
    if (isFinal) return 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-900 shadow-lg';
    if (isLive) return 'border-red-500 shadow-lg animate-pulse';
    if (isHovered) return 'border-blue-500 shadow-lg scale-105 transform';
    return 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500';
  };

  return (
    <div 
      className={`bracket-match border-2 rounded-lg overflow-hidden transition-all duration-200 cursor-pointer ${getMatchBorderClass()}`}
      onClick={handleMatchClick}
      onMouseEnter={() => setHoveredMatch(match)}
      onMouseLeave={() => setHoveredMatch(null)}
    >
      {/* Match Header */}
      {(match.match_number || isLive || match.format || isFinal) && (
        <div className={`px-3 py-2 border-b flex items-center justify-between ${
          isFinal 
            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-medium ${
              isFinal 
                ? 'text-yellow-800 dark:text-yellow-200' 
                : 'text-gray-600 dark:text-gray-400'
            }`}>
              {isFinal ? 'GRAND FINAL' : 
               match.match_number ? `Match ${match.match_number}` : 
               `Match ${match.id}`}
            </span>
            {match.format && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                • {match.format.toUpperCase()}
              </span>
            )}
            {match.best_of && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                • Bo{match.best_of}
              </span>
            )}
          </div>
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* Teams */}
      <div className="bg-white dark:bg-gray-900">
        {/* Team 1 */}
        <TeamRow
          team={effectiveMatch.team1}
          score={effectiveMatch.team1_score}
          isWinner={team1Won}
          isLoser={team2Won}
          onClick={(e) => handleTeamClick(effectiveMatch.team1, e)}
          isCompleted={isCompleted}
          position="top"
        />

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Team 2 */}
        <TeamRow
          team={effectiveMatch.team2}
          score={effectiveMatch.team2_score}
          isWinner={team2Won}
          isLoser={team1Won}
          onClick={(e) => handleTeamClick(effectiveMatch.team2, e)}
          isCompleted={isCompleted}
          position="bottom"
        />
      </div>

      {/* Match Meta */}
      {(match.scheduled_at || match.completed_at || match.stream_url) && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isCompleted && match.completed_at
                ? `${new Date(match.completed_at).toLocaleDateString()}`
                : match.scheduled_at
                ? `${new Date(match.scheduled_at).toLocaleDateString()}`
                : 'TBD'
              }
            </span>
            {match.stream_url && (
              <a
                href={match.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
              >
                Watch Live
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Team row component with enhanced styling
function TeamRow({ team, score, isWinner, isLoser, onClick, isCompleted, position }) {
  return (
    <div 
      className={`flex items-center justify-between p-4 transition-all duration-200 ${
        isWinner ? 'bg-green-50 dark:bg-green-900/20 border-r-4 border-green-500' : ''
      } ${isLoser ? 'opacity-70' : ''} ${
        position === 'top' ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div 
        className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer rounded p-1 -m-1 hover:bg-gray-100 dark:hover:bg-gray-700"
        onClick={onClick}
      >
        {team ? (
          <>
            <div className="flex-shrink-0">
              <TeamLogo team={team} size="w-8 h-8" />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`font-semibold truncate ${
                isWinner ? 'text-gray-900 dark:text-white' : 
                isCompleted && isLoser ? 'text-gray-500 dark:text-gray-500' : 
                'text-gray-800 dark:text-gray-200'
              }`}>
                {team.name}
              </div>
              {team.region && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {team.region}
                </div>
              )}
            </div>
            {team.seed && (
              <div className="flex-shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  #{team.seed}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
              <span className="text-xs text-gray-400">?</span>
            </div>
            <span className="text-gray-400 dark:text-gray-600 italic font-medium">
              To Be Determined
            </span>
          </div>
        )}
      </div>
      
      {/* Score */}
      <div className="ml-4 flex-shrink-0">
        <div className={`text-2xl font-bold min-w-[2rem] text-center ${
          isWinner 
            ? 'text-green-600 dark:text-green-400' 
            : isCompleted && isLoser 
            ? 'text-gray-400 dark:text-gray-600'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          {score !== null && score !== undefined ? score : '-'}
        </div>
      </div>
    </div>
  );
}

// SVG Bracket Connectors for clean lines between rounds
function BracketConnectors({ rounds }) {
  if (!rounds || rounds.length < 2) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none w-full h-full" 
      style={{ zIndex: 0 }}
      preserveAspectRatio="none"
    >
      {rounds.map((round, roundIndex) => {
        if (roundIndex >= rounds.length - 1) return null;

        return round.matches?.map((match, matchIndex) => {
          const nextRoundMatches = rounds[roundIndex + 1]?.matches || [];
          const nextMatchIndex = Math.floor(matchIndex / 2);
          
          if (nextMatchIndex >= nextRoundMatches.length) return null;

          // Calculate positions
          const currentRoundX = 280 * roundIndex + 272; // Account for round width
          const nextRoundX = 280 * (roundIndex + 1) + 8; // Start of next round
          
          const baseSpacing = 80;
          const currentSpacing = baseSpacing * Math.pow(2, Math.max(0, roundIndex));
          const nextSpacing = baseSpacing * Math.pow(2, Math.max(0, roundIndex + 1));
          
          const currentY = 150 + (matchIndex * (currentSpacing + 160)); // Account for header + match height
          const nextY = 150 + (nextMatchIndex * (nextSpacing + 160));
          
          const midX = currentRoundX + 32; // Halfway point

          return (
            <g key={`connector-${roundIndex}-${matchIndex}`}>
              {/* Horizontal line from current match */}
              <line
                x1={currentRoundX}
                y1={currentY}
                x2={midX}
                y2={currentY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300 dark:text-gray-600"
              />
              
              {/* Vertical connector between pair matches */}
              {matchIndex % 2 === 0 && matchIndex + 1 < round.matches.length && (
                <line
                  x1={midX}
                  y1={currentY}
                  x2={midX}
                  y2={currentY + currentSpacing + 160}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300 dark:text-gray-600"
                />
              )}
              
              {/* Horizontal line to next round (only for the upper match of each pair) */}
              {matchIndex % 2 === 0 && (
                <line
                  x1={midX}
                  y1={nextY}
                  x2={nextRoundX}
                  y2={nextY}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300 dark:text-gray-600"
                />
              )}
            </g>
          );
        }) || [];
      })}
    </svg>
  );
}

export default SingleEliminationBracket;