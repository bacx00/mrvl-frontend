import React from 'react';
import { TeamLogo } from '../utils/imageUtils';

function BracketVisualization({ bracket, navigateTo, isAdmin, onMatchUpdate }) {
  if (!bracket || !bracket.rounds) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-500">No bracket data available</div>
      </div>
    );
  }

  // VLR.gg style bracket visualization
  const getRoundName = (round, index, totalRounds) => {
    // Common round names based on position
    const names = {
      'round_of_32': 'Round of 32',
      'round_of_16': 'Round of 16',
      'quarterfinals': 'Quarterfinals',
      'semifinals': 'Semifinals',
      'finals': 'Finals',
      'grand_finals': 'Grand Finals'
    };
    
    return names[round.slug] || round.name || `Round ${index + 1}`;
  };

  const getMatchHeight = (roundIndex, totalRounds) => {
    // Calculate match spacing based on round
    const baseHeight = 80;
    return baseHeight * Math.pow(2, roundIndex);
  };

  return (
    <div className="bracket-container overflow-x-auto pb-4">
      <div className="min-w-[1200px]">
        {/* Bracket Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tournament Bracket</h3>
          {bracket.type && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {bracket.type === 'single_elimination' ? 'Single Elimination' : 
               bracket.type === 'double_elimination' ? 'Double Elimination' : 
               bracket.type}
            </span>
          )}
        </div>

        {/* Upper Bracket */}
        <div className="mb-8">
          {bracket.upper_bracket && (
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">UPPER BRACKET</h4>
            </div>
          )}
          
          <div className="flex space-x-8">
            {bracket.rounds.map((round, roundIndex) => (
              <BracketRound
                key={roundIndex}
                round={round}
                roundIndex={roundIndex}
                totalRounds={bracket.rounds.length}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                getRoundName={getRoundName}
              />
            ))}
          </div>
        </div>

        {/* Lower Bracket - if double elimination */}
        {bracket.lower_bracket && bracket.lower_bracket.length > 0 && (
          <div>
            <div className="mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">LOWER BRACKET</h4>
            </div>
            
            <div className="flex space-x-8">
              {bracket.lower_bracket.map((round, roundIndex) => (
                <BracketRound
                  key={`lower-${roundIndex}`}
                  round={round}
                  roundIndex={roundIndex}
                  totalRounds={bracket.lower_bracket.length}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                  getRoundName={getRoundName}
                  isLowerBracket={true}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Individual bracket round component
function BracketRound({ round, roundIndex, totalRounds, navigateTo, isAdmin, onMatchUpdate, getRoundName, isLowerBracket = false }) {
  const roundName = getRoundName(round, roundIndex, totalRounds);
  
  return (
    <div className="bracket-round" style={{ minWidth: '280px' }}>
      {/* Round Header */}
      <div className="text-center mb-4">
        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">{roundName}</h5>
        {round.start_date && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(round.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        )}
      </div>

      {/* Matches */}
      <div className="space-y-4">
        {round.matches.map((match, matchIndex) => (
          <BracketMatch
            key={matchIndex}
            match={match}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            roundIndex={roundIndex}
            isLowerBracket={isLowerBracket}
          />
        ))}
      </div>
    </div>
  );
}

// Individual match component
function BracketMatch({ match, navigateTo, isAdmin, onMatchUpdate, roundIndex, isLowerBracket }) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const team1Won = isCompleted && match.team1_score > match.team2_score;
  const team2Won = isCompleted && match.team2_score > match.team1_score;

  const handleScoreUpdate = (teamNumber, score) => {
    if (!isAdmin || !onMatchUpdate) return;
    
    const updates = {
      [`team${teamNumber}_score`]: parseInt(score) || 0
    };
    
    // Determine winner if both scores are set
    if (teamNumber === 1) {
      const team2Score = match.team2_score || 0;
      if (score > team2Score) {
        updates.winner = 1;
        updates.status = 'completed';
      }
    } else {
      const team1Score = match.team1_score || 0;
      if (score > team1Score) {
        updates.winner = 2;
        updates.status = 'completed';
      }
    }
    
    onMatchUpdate(match.id, updates);
  };

  return (
    <div 
      className={`bracket-match border rounded-lg overflow-hidden transition-all ${
        isLive ? 'border-red-500 shadow-lg' : 'border-gray-300 dark:border-gray-600'
      } ${match.id ? 'cursor-pointer hover:shadow-md' : ''}`}
    >
      {/* Match Header */}
      {(match.match_number || isLive) && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Match {match.match_number || match.id}
          </span>
          {isLive && (
            <span className="text-xs font-bold text-red-600 dark:text-red-400 animate-pulse">LIVE</span>
          )}
        </div>
      )}

      {/* Teams */}
      <div 
        className="bg-white dark:bg-gray-900"
        onClick={() => match.id && navigateTo && navigateTo('match-detail', { id: match.id })}
      >
        {/* Team 1 */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 ${
          team1Won ? 'bg-green-50 dark:bg-green-900/20' : ''
        }`}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {match.team1 ? (
              <>
                <TeamLogo team={match.team1} size="w-6 h-6" />
                <span className={`font-medium truncate ${
                  team1Won ? 'text-gray-900 dark:text-white' : 
                  isCompleted && !team1Won ? 'text-gray-500 dark:text-gray-500' : 
                  'text-gray-900 dark:text-white'
                }`}>
                  {match.team1.name}
                </span>
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
            )}
          </div>
          
          {/* Score */}
          {isAdmin && !isCompleted && match.team1 && match.team2 ? (
            <input
              type="number"
              min="0"
              max="999"
              value={match.team1_score || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleScoreUpdate(1, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-12 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder="0"
            />
          ) : (
            <span className={`font-bold text-lg ml-2 ${
              team1Won ? 'text-green-600 dark:text-green-400' : ''
            }`}>
              {match.team1_score !== undefined ? match.team1_score : '-'}
            </span>
          )}
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between p-3 ${
          team2Won ? 'bg-green-50 dark:bg-green-900/20' : ''
        }`}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {match.team2 ? (
              <>
                <TeamLogo team={match.team2} size="w-6 h-6" />
                <span className={`font-medium truncate ${
                  team2Won ? 'text-gray-900 dark:text-white' : 
                  isCompleted && !team2Won ? 'text-gray-500 dark:text-gray-500' : 
                  'text-gray-900 dark:text-white'
                }`}>
                  {match.team2.name}
                </span>
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
            )}
          </div>
          
          {/* Score */}
          {isAdmin && !isCompleted && match.team1 && match.team2 ? (
            <input
              type="number"
              min="0"
              max="999"
              value={match.team2_score || ''}
              onChange={(e) => {
                e.stopPropagation();
                handleScoreUpdate(2, e.target.value);
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-12 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded text-sm"
              placeholder="0"
            />
          ) : (
            <span className={`font-bold text-lg ml-2 ${
              team2Won ? 'text-green-600 dark:text-green-400' : ''
            }`}>
              {match.team2_score !== undefined ? match.team2_score : '-'}
            </span>
          )}
        </div>
      </div>

      {/* Match Format - VLR.gg style */}
      {match.format && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">{match.format}</span>
        </div>
      )}
    </div>
  );
}

export default BracketVisualization;