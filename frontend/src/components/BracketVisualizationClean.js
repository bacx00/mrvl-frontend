import React, { useState, useRef, useEffect } from 'react';
import { TeamLogo } from '../utils/imageUtils';

function BracketVisualizationClean({ bracket, event, navigateTo, isAdmin, onMatchUpdate }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const containerRef = useRef(null);

  // Handle zoom controls
  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '+' || e.key === '=') handleZoom(0.1);
      if (e.key === '-') handleZoom(-0.1);
      if (e.key === '0') setZoom(1);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!bracket || !bracket.bracket || bracket.bracket.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">No bracket data available</div>
      </div>
    );
  }

  const rounds = bracket.bracket;
  const bracketType = bracket.format || 'single_elimination';

  return (
    <div ref={containerRef} className="bracket-visualization-clean">
      {/* Controls Header */}
      <div className="flex items-center justify-between mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Tournament Bracket
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {(bracketType || '').toString().replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom Out (-)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom In (+)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button
            onClick={() => setZoom(1)}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Reset Zoom (0)"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Bracket Content */}
      <div className="overflow-x-auto overflow-y-hidden">
        <div 
          className="bracket-content transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom})`, 
            transformOrigin: 'top left',
            minWidth: 'max-content'
          }}
        >
          <div className="relative p-8">
            {/* Render bracket based on format */}
            {bracketType === 'double_elimination' ? (
              <DoubleEliminationBracket
                bracket={bracket}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
              />
            ) : bracketType === 'swiss' ? (
              <SwissBracket
                bracket={bracket}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
              />
            ) : (
              <SingleEliminationBracket
                rounds={rounds}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
              />
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Use + / - to zoom • Hover matches for details • Click teams for profiles
        </div>
      </div>
    </div>
  );
}

// Single Elimination Bracket Component
function SingleEliminationBracket({ 
  rounds, 
  hoveredMatch, 
  setHoveredMatch, 
  navigateTo, 
  isAdmin, 
  onMatchUpdate 
}) {
  return (
    <div className="single-elimination-bracket">
      <div className="flex items-start justify-center space-x-12">
        {rounds.map((round, roundIndex) => (
          <BracketRound
            key={roundIndex}
            round={round}
            roundIndex={roundIndex}
            totalRounds={rounds.length}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        ))}
      </div>
      
      {/* SVG Connectors */}
      <BracketConnectors rounds={rounds} />
    </div>
  );
}

// Double Elimination Bracket Component
function DoubleEliminationBracket({ 
  bracket, 
  hoveredMatch, 
  setHoveredMatch, 
  navigateTo, 
  isAdmin, 
  onMatchUpdate 
}) {
  const upperBracket = bracket.upper_bracket || bracket.bracket || [];
  const lowerBracket = bracket.lower_bracket || [];
  const grandFinal = bracket.grand_final;

  return (
    <div className="double-elimination-bracket space-y-16">
      {/* Upper Bracket */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-6 text-center tracking-wider">
          UPPER BRACKET
        </h4>
        <div className="flex items-start justify-center space-x-12">
          {upperBracket.map((round, roundIndex) => (
            <BracketRound
              key={`upper-${roundIndex}`}
              round={round}
              roundIndex={roundIndex}
              totalRounds={upperBracket.length}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              isUpperBracket={true}
            />
          ))}
        </div>
        <BracketConnectors rounds={upperBracket} isUpperBracket={true} />
      </div>

      {/* Lower Bracket */}
      {lowerBracket.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-6 text-center tracking-wider">
            LOWER BRACKET
          </h4>
          <div className="flex items-start justify-center space-x-12">
            {lowerBracket.map((round, roundIndex) => (
              <BracketRound
                key={`lower-${roundIndex}`}
                round={round}
                roundIndex={roundIndex}
                totalRounds={lowerBracket.length}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                isLowerBracket={true}
              />
            ))}
          </div>
          <BracketConnectors rounds={lowerBracket} isLowerBracket={true} />
        </div>
      )}

      {/* Grand Final */}
      {grandFinal && (
        <div>
          <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-6 text-center tracking-wider">
            GRAND FINAL
          </h4>
          <div className="flex justify-center">
            <BracketMatch
              match={grandFinal}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              isGrandFinal={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Swiss System Bracket Component
function SwissBracket({ 
  bracket, 
  hoveredMatch, 
  setHoveredMatch, 
  navigateTo, 
  isAdmin, 
  onMatchUpdate 
}) {
  const rounds = bracket.rounds || {};
  const standings = bracket.standings || [];

  return (
    <div className="swiss-bracket space-y-8">
      {/* Standings Table */}
      {standings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Swiss Standings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Rank</th>
                  <th className="text-left py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Team</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700 dark:text-gray-300">W-L</th>
                  <th className="text-center py-3 px-2 font-medium text-gray-700 dark:text-gray-300">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr key={standing.team_id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-3 px-2 font-medium">{index + 1}</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center space-x-3">
                        <TeamLogo team={{ logo: standing.team_logo }} size="w-6 h-6" />
                        <span className="font-medium text-gray-900 dark:text-white">{standing.team_name}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-2 text-gray-700 dark:text-gray-300">
                      {standing.wins}-{standing.losses}
                    </td>
                    <td className="text-center py-3 px-2 font-medium text-gray-900 dark:text-white">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Swiss Rounds */}
      <div className="flex items-start justify-center space-x-12 overflow-x-auto">
        {Object.entries(rounds).map(([roundNum, matches]) => (
          <div key={roundNum} className="flex-shrink-0" style={{ minWidth: '320px' }}>
            <div className="text-center mb-6">
              <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider">
                ROUND {roundNum}
              </h5>
            </div>
            <div className="space-y-6">
              {matches.map((match, matchIndex) => (
                <BracketMatch
                  key={match.id || matchIndex}
                  match={match}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bracket Round Component
function BracketRound({ 
  round, 
  roundIndex, 
  totalRounds, 
  hoveredMatch, 
  setHoveredMatch, 
  navigateTo, 
  isAdmin, 
  onMatchUpdate,
  isUpperBracket = false,
  isLowerBracket = false
}) {
  // Calculate round name
  const getRoundName = () => {
    if (round.name) return round.name.toUpperCase();
    
    const roundsFromEnd = totalRounds - roundIndex;
    
    if (isLowerBracket) {
      return `LOWER ROUND ${roundIndex + 1}`;
    }
    
    switch (roundsFromEnd) {
      case 1: return 'GRAND FINAL';
      case 2: return 'SEMI-FINALS';
      case 3: return 'QUARTER-FINALS'; 
      case 4: return 'ROUND OF 16';
      case 5: return 'ROUND OF 32';
      default: return `ROUND ${roundIndex + 1}`;
    }
  };

  // Calculate match spacing for visual hierarchy
  const matchSpacing = 80 * Math.pow(2, Math.max(0, roundIndex - 1));

  return (
    <div className="bracket-round" style={{ minWidth: '320px' }}>
      {/* Round Header */}
      <div className="text-center mb-6">
        <h5 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider">
          {getRoundName()}
        </h5>
        {round.start_date && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(round.start_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            })}
          </div>
        )}
      </div>

      {/* Matches */}
      <div className="space-y-6">
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
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual Match Component
function BracketMatch({ 
  match, 
  hoveredMatch, 
  setHoveredMatch, 
  navigateTo, 
  isAdmin, 
  onMatchUpdate,
  isGrandFinal = false
}) {
  const [editingScore, setEditingScore] = useState(false);
  const [tempScores, setTempScores] = useState({
    team1: match.team1?.score || 0,
    team2: match.team2?.score || 0
  });

  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const team1Won = isCompleted && match.team1?.score > match.team2?.score;
  const team2Won = isCompleted && match.team2?.score > match.team1?.score;

  const handleScoreUpdate = () => {
    if (tempScores.team1 === tempScores.team2) {
      alert('Scores cannot be tied');
      return;
    }

    onMatchUpdate(match.id, {
      team1_score: tempScores.team1,
      team2_score: tempScores.team2,
      status: 'completed'
    });
    setEditingScore(false);
  };

  return (
    <div
      className={`
        bracket-match relative transition-all duration-200 group
        ${hoveredMatch?.id === match.id ? 'z-20 scale-105' : 'z-10'}
      `}
      onMouseEnter={() => setHoveredMatch(match)}
      onMouseLeave={() => setHoveredMatch(null)}
    >
      <div
        className={`
          border rounded-lg overflow-hidden cursor-pointer
          transition-all duration-200 shadow-sm hover:shadow-md
          ${isLive ? 'border-red-500 shadow-lg animate-pulse' : 'border-gray-300 dark:border-gray-600'}
          ${hoveredMatch?.id === match.id ? 'border-blue-500 shadow-lg' : ''}
          bg-white dark:bg-gray-900
        `}
        onClick={() => match.id && navigateTo && navigateTo('match-detail', { id: match.id })}
      >
        {/* Match Header */}
        {(isLive || match.match_number || isGrandFinal) && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {isGrandFinal ? 'GRAND FINAL' : `Match ${match.match_number || match.id}`}
              {match.format && ` • ${match.format.toUpperCase()}`}
            </span>
            {isLive && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">LIVE</span>
              </div>
            )}
          </div>
        )}

        {/* Team 1 */}
        <TeamRow 
          team={match.team1}
          score={match.team1?.score}
          isWinner={team1Won}
          isLoser={team2Won}
          editingScore={editingScore}
          tempScore={tempScores.team1}
          onScoreChange={(score) => setTempScores({...tempScores, team1: score})}
        />

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* Team 2 */}
        <TeamRow 
          team={match.team2}
          score={match.team2?.score}
          isWinner={team2Won}
          isLoser={team1Won}
          editingScore={editingScore}
          tempScore={tempScores.team2}
          onScoreChange={(score) => setTempScores({...tempScores, team2: score})}
        />

        {/* Admin Controls */}
        {isAdmin && match.team1 && match.team2 && !isCompleted && (
          <div 
            className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {editingScore ? (
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setEditingScore(false);
                    setTempScores({
                      team1: match.team1?.score || 0,
                      team2: match.team2?.score || 0
                    });
                  }}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreUpdate}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingScore(true)}
                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Update Score
              </button>
            )}
          </div>
        )}

        {/* Match Time */}
        {match.scheduled_at && !isLive && !isCompleted && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(match.scheduled_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Team Row Component
function TeamRow({ 
  team, 
  score, 
  isWinner, 
  isLoser, 
  editingScore, 
  tempScore, 
  onScoreChange 
}) {
  return (
    <div 
      className={`
        flex items-center justify-between p-4 transition-colors
        ${isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''}
        ${isLoser ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {team ? (
          <>
            <TeamLogo team={team} size="w-6 h-6" />
            <span className={`font-medium truncate ${
              isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {team.name}
            </span>
          </>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
        )}
      </div>
      
      {/* Score */}
      <div className="ml-4">
        {editingScore && team ? (
          <input
            type="number"
            min="0"
            max="99"
            value={tempScore}
            onChange={(e) => onScoreChange(parseInt(e.target.value) || 0)}
            onClick={(e) => e.stopPropagation()}
            className="w-12 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
          />
        ) : (
          <span className={`text-lg font-bold ${
            isWinner ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {score !== null && score !== undefined ? score : '-'}
          </span>
        )}
      </div>
    </div>
  );
}

// SVG Bracket Connectors
function BracketConnectors({ rounds, isUpperBracket = false, isLowerBracket = false }) {
  if (!rounds || rounds.length < 2) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width="100%"
      height="100%"
      style={{ zIndex: 1 }}
    >
      {rounds.map((round, roundIndex) => {
        if (roundIndex >= rounds.length - 1) return null; // Skip last round

        return round.matches.map((match, matchIndex) => {
          // Calculate connector positions
          const fromX = 320 * (roundIndex + 1); // Match width + spacing
          const fromY = 120 + (matchIndex * 160); // Base position + match spacing
          const toX = fromX + 96; // Connector length
          const toY = fromY + (matchIndex % 2 === 0 ? 80 : -80); // Connect to appropriate next match

          return (
            <g key={`connector-${roundIndex}-${matchIndex}`}>
              {/* Horizontal line from match */}
              <line
                x1={fromX}
                y1={fromY}
                x2={fromX + 48}
                y2={fromY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300 dark:text-gray-600"
              />
              
              {/* Vertical connector to pair matches */}
              {matchIndex % 2 === 0 && matchIndex < round.matches.length - 1 && (
                <line
                  x1={fromX + 48}
                  y1={fromY}
                  x2={fromX + 48}
                  y2={fromY + 160}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300 dark:text-gray-600"
                />
              )}
              
              {/* Horizontal line to next round */}
              {matchIndex % 2 === 0 && (
                <line
                  x1={fromX + 48}
                  y1={fromY + 80}
                  x2={toX}
                  y2={fromY + 80}
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-gray-300 dark:text-gray-600"
                />
              )}
            </g>
          );
        });
      })}
    </svg>
  );
}

export default BracketVisualizationClean;