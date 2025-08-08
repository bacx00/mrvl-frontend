import React, { useState } from 'react';
import { TeamLogo } from '../utils/imageUtils';

function DoubleEliminationBracket({ 
  bracket, 
  expandedSections, 
  onToggleSection,
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
  const upperBracket = bracket.upper_bracket || [];
  const lowerBracket = bracket.lower_bracket || [];
  const grandFinal = bracket.grand_final;
  const bracketReset = bracket.bracket_reset;

  const getRoundName = (round, index, totalRounds, isLowerBracket = false) => {
    if (round.name) return round.name.toUpperCase();
    
    if (isLowerBracket) {
      return `LOWER ROUND ${index + 1}`;
    }
    
    const roundsFromEnd = totalRounds - index;
    switch (roundsFromEnd) {
      case 1: return 'UPPER FINAL';
      case 2: return 'UPPER SEMI';
      case 3: return 'UPPER QUARTERS';
      case 4: return 'UPPER R16';
      default: return `UPPER R${index + 1}`;
    }
  };

  const getLowerRoundName = (round, index, totalRounds) => {
    if (round.name) return round.name.toUpperCase();
    return `LOWER ${index + 1}`;
  };

  return (
    <div className={`double-elimination-bracket space-y-12 ${className}`}>
      {/* Upper Bracket */}
      {expandedSections.upperBracket && upperBracket.length > 0 && (
        <div className="upper-bracket-section">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase border-b-2 border-blue-500 pb-2">
                Upper Bracket
              </h4>
              {onToggleSection && (
                <button
                  onClick={() => onToggleSection('upperBracket')}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  [{expandedSections.upperBracket ? 'Collapse' : 'Expand'}]
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Winners advance • Losers drop to Lower Bracket
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex space-x-8 justify-start min-w-fit">
              {upperBracket.map((round, roundIndex) => (
                <BracketRound
                  key={`upper-${roundIndex}`}
                  round={round}
                  roundIndex={roundIndex}
                  totalRounds={upperBracket.length}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                  selectedMatch={selectedMatch}
                  setSelectedMatch={setSelectedMatch}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                  getRoundName={(r, i, t) => getRoundName(r, i, t, false)}
                  isUpperBracket={true}
                  liveScores={liveScores}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lower Bracket */}
      {expandedSections.lowerBracket && lowerBracket.length > 0 && (
        <div className="lower-bracket-section">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase border-b-2 border-red-500 pb-2">
                Lower Bracket
              </h4>
              {onToggleSection && (
                <button
                  onClick={() => onToggleSection('lowerBracket')}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  [{expandedSections.lowerBracket ? 'Collapse' : 'Expand'}]
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Elimination matches • One loss eliminates
            </div>
          </div>
          <div className="overflow-x-auto">
            <div className="flex space-x-8 justify-start min-w-fit">
              {lowerBracket.map((round, roundIndex) => (
                <BracketRound
                  key={`lower-${roundIndex}`}
                  round={round}
                  roundIndex={roundIndex}
                  totalRounds={lowerBracket.length}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                  selectedMatch={selectedMatch}
                  setSelectedMatch={setSelectedMatch}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                  getRoundName={getLowerRoundName}
                  isLowerBracket={true}
                  liveScores={liveScores}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grand Finals Section */}
      {expandedSections.grandFinal && (grandFinal || bracketReset) && (
        <div className="grand-finals-section">
          <div className="flex items-center justify-center mb-8">
            <h4 className="text-lg font-bold text-yellow-700 dark:text-yellow-300 tracking-wider uppercase border-b-2 border-yellow-500 pb-2">
              Grand Finals
            </h4>
          </div>
          
          <div className="flex flex-col items-center space-y-8">
            {/* Grand Final Match */}
            {grandFinal && (
              <div className="grand-final-match">
                <div className="text-center mb-4">
                  <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300 uppercase tracking-wide">
                    Grand Final
                  </span>
                </div>
                <BracketMatch
                  match={grandFinal}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                  selectedMatch={selectedMatch}
                  setSelectedMatch={setSelectedMatch}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                  isGrandFinal={true}
                  liveScores={liveScores}
                />
              </div>
            )}

            {/* Bracket Reset Match (if applicable) */}
            {bracketReset && (
              <div className="bracket-reset-match">
                <div className="text-center mb-4">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                    Bracket Reset
                  </span>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    If Lower Bracket champion wins
                  </div>
                </div>
                <BracketMatch
                  match={bracketReset}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                  selectedMatch={selectedMatch}
                  setSelectedMatch={setSelectedMatch}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                  isBracketReset={true}
                  liveScores={liveScores}
                />
              </div>
            )}
          </div>
        </div>
      )}
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
  isLowerBracket = false,
  isUpperBracket = false,
  liveScores = {}
}) {
  const roundName = getRoundName(round, roundIndex, totalRounds);
  const matchSpacing = isLowerBracket ? 64 : 80 * Math.pow(2, Math.max(0, roundIndex - 1));
  
  return (
    <div className="bracket-round" style={{ minWidth: '280px' }}>
      {/* Round Header */}
      <div className="text-center mb-6">
        <div className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${
          isUpperBracket 
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
            : isLowerBracket 
            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
        }`}>
          {roundName}
        </div>
        {round.start_date && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {new Date(round.start_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}
      </div>

      {/* Matches */}
      <div className="space-y-4">
        {round.matches.map((match, matchIndex) => (
          <div
            key={match.id || matchIndex}
            style={{ 
              marginBottom: matchIndex < round.matches.length - 1 ? `${matchSpacing}px` : 0 
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
              isLowerBracket={isLowerBracket}
              isUpperBracket={isUpperBracket}
              liveScores={liveScores}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Enhanced match component for double elimination
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
  isLowerBracket = false,
  isUpperBracket = false,
  isGrandFinal = false,
  isBracketReset = false,
  liveScores = {}
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
    if (isGrandFinal) return 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-900';
    if (isBracketReset) return 'border-purple-500 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900';
    if (isLive) return 'border-red-500 shadow-lg animate-pulse';
    if (isHovered) return 'border-blue-500 shadow-lg scale-105';
    if (isLowerBracket) return 'border-red-300 dark:border-red-700 hover:border-red-400 dark:hover:border-red-600';
    if (isUpperBracket) return 'border-blue-300 dark:border-blue-700 hover:border-blue-400 dark:hover:border-blue-600';
    return 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500';
  };

  return (
    <div 
      className={`bracket-match border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${getMatchBorderClass()}`}
      onClick={handleMatchClick}
      onMouseEnter={() => setHoveredMatch(match)}
      onMouseLeave={() => setHoveredMatch(null)}
    >
      {/* Match Header */}
      {(match.match_number || isLive || match.format || isGrandFinal || isBracketReset) && (
        <div className={`px-3 py-2 border-b flex items-center justify-between ${
          isGrandFinal 
            ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
            : isBracketReset 
            ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800'
            : isLowerBracket
            ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
            : isUpperBracket
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800'
            : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {isGrandFinal ? 'GRAND FINAL' : 
               isBracketReset ? 'BRACKET RESET' :
               match.match_number ? `Match ${match.match_number}` : 
               `Match ${match.id}`}
            </span>
            {match.format && (
              <span className="text-xs text-gray-500 dark:text-gray-500">
                • {match.format.toUpperCase()}
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
        />
      </div>

      {/* Match Footer */}
      {(match.scheduled_at || match.completed_at) && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isCompleted && match.completed_at
              ? `Completed ${new Date(match.completed_at).toLocaleDateString()} ${new Date(match.completed_at).toLocaleTimeString()}`
              : match.scheduled_at
              ? `Scheduled ${new Date(match.scheduled_at).toLocaleDateString()} ${new Date(match.scheduled_at).toLocaleTimeString()}`
              : ''
            }
          </span>
        </div>
      )}
    </div>
  );
}

// Team row component
function TeamRow({ team, score, isWinner, isLoser, onClick, isCompleted }) {
  return (
    <div 
      className={`flex items-center justify-between p-3 transition-colors ${
        isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''
      } ${isLoser ? 'opacity-70' : ''}`}
    >
      <div 
        className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1"
        onClick={onClick}
      >
        {team ? (
          <>
            <TeamLogo team={team} size="w-6 h-6" />
            <span className={`font-medium truncate ${
              isWinner ? 'text-gray-900 dark:text-white font-bold' : 
              isCompleted && isLoser ? 'text-gray-500 dark:text-gray-500' : 
              'text-gray-900 dark:text-white'
            }`}>
              {team.name}
            </span>
            {team.seed && (
              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                #{team.seed}
              </span>
            )}
          </>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
        )}
      </div>
      
      {/* Score */}
      <div className="ml-3">
        <span className={`text-xl font-bold ${
          isWinner ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
        }`}>
          {score !== null && score !== undefined ? score : '-'}
        </span>
      </div>
    </div>
  );
}

export default DoubleEliminationBracket;