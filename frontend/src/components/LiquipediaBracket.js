import React, { useState } from 'react';
import { TeamLogo } from '../utils/imageUtils';
import { useAuth } from '../hooks';

function LiquipediaBracket({ 
  bracket, 
  event, 
  eventId,
  navigateTo, 
  isAdmin = false, 
  onMatchUpdate 
}) {
  console.log('LiquipediaBracket props:', { bracket, event, eventId }); // For debugging
  
  const [editingMatch, setEditingMatch] = useState(null);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [localBracket, setLocalBracket] = useState(bracket);
  const { api } = useAuth();

  // If no bracket provided, show empty state
  if (!bracket) {
    return (
      <div className="liquipedia-bracket-empty">
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Bracket Generated
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The tournament bracket hasn't been generated yet
          </p>
          {isAdmin && (
            <p className="text-sm text-gray-500">
              Use the admin controls to generate the bracket
            </p>
          )}
        </div>
      </div>
    );
  }

  // Parse bracket data for single elimination
  const parseMatches = (bracket) => {
    // Handle different bracket formats
    
    // If rounds is an object with round names as keys
    if (bracket.rounds && typeof bracket.rounds === 'object' && !Array.isArray(bracket.rounds)) {
      const roundsArray = [];
      const roundNames = Object.keys(bracket.rounds);
      
      // Sort rounds by round_number
      roundNames.sort((a, b) => {
        const roundA = bracket.rounds[a];
        const roundB = bracket.rounds[b];
        return (roundA.round_number || 0) - (roundB.round_number || 0);
      });
      
      roundNames.forEach(roundName => {
        const round = bracket.rounds[roundName];
        roundsArray.push({
          name: roundName,
          matches: round.matches || []
        });
      });
      
      return roundsArray;
    }
    
    // If rounds is already an array
    if (bracket.rounds && Array.isArray(bracket.rounds)) {
      return bracket.rounds.map((round, roundIndex) => ({
        name: getRoundName(roundIndex, bracket.rounds.length),
        matches: round.matches || []
      }));
    }
    
    // If bracket has matches array directly
    if (bracket.matches && Array.isArray(bracket.matches)) {
      // Group matches by round
      const roundsMap = {};
      bracket.matches.forEach(match => {
        const roundName = match.round_name || `Round ${match.round_number || 1}`;
        if (!roundsMap[roundName]) {
          roundsMap[roundName] = {
            name: roundName,
            round_number: match.round_number || 1,
            matches: []
          };
        }
        roundsMap[roundName].matches.push(match);
      });
      
      // Convert to array and sort by round number
      const roundsArray = Object.values(roundsMap);
      roundsArray.sort((a, b) => (a.round_number || 0) - (b.round_number || 0));
      
      return roundsArray;
    }
    
    return [];
  };

  const getRoundName = (roundIndex, totalRounds) => {
    const roundsFromEnd = totalRounds - roundIndex - 1;
    
    const roundNames = {
      0: 'Final',
      1: 'Semifinals', 
      2: 'Quarterfinals',
      3: 'Round of 16',
      4: 'Round of 32',
      5: 'Round of 64'
    };
    
    return roundNames[roundsFromEnd] || `Round ${roundIndex + 1}`;
  };

  const rounds = parseMatches(bracket);

  // Score Edit Modal - needs to be inside the component return
  const renderScoreEditModal = () => {
    if (!editingMatch) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Update Match Score
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editingMatch.team1?.name || 'Team 1'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="px-4 text-gray-500 dark:text-gray-400">vs</div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {editingMatch.team2?.name || 'Team 2'}
                </label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveScore}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Save Score
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveScore = async () => {
    if (!editingMatch) return;
    
    try {
      const response = await api.put(`/admin/bracket-matches/${editingMatch.id}/score`, {
        team1_score: parseInt(team1Score),
        team2_score: parseInt(team2Score)
      });
      
      if (response.data?.success) {
        console.log('✅ Score updated successfully');
        
        const updatedMatch = response.data.data;
        
        // Update local bracket state immediately for instant UI feedback
        setLocalBracket(prevBracket => {
          if (!prevBracket) return prevBracket;
          
          const newBracket = JSON.parse(JSON.stringify(prevBracket));
          
          // Update match in rounds
          if (newBracket.rounds) {
            Object.keys(newBracket.rounds).forEach(roundName => {
              const round = newBracket.rounds[roundName];
              if (round.matches) {
                const matchIndex = round.matches.findIndex(m => m.id === editingMatch.id);
                if (matchIndex !== -1) {
                  round.matches[matchIndex] = {
                    ...round.matches[matchIndex],
                    team1_score: parseInt(team1Score),
                    team2_score: parseInt(team2Score),
                    status: updatedMatch?.status || round.matches[matchIndex].status,
                    winner_id: updatedMatch?.winner_id || null,
                    loser_id: updatedMatch?.loser_id || null
                  };
                }
              }
            });
          }
          
          // Update match in flat matches array
          if (newBracket.matches) {
            const matchIndex = newBracket.matches.findIndex(m => m.id === editingMatch.id);
            if (matchIndex !== -1) {
              newBracket.matches[matchIndex] = {
                ...newBracket.matches[matchIndex],
                team1_score: parseInt(team1Score),
                team2_score: parseInt(team2Score),
                status: updatedMatch?.status || newBracket.matches[matchIndex].status,
                winner_id: updatedMatch?.winner_id || null,
                loser_id: updatedMatch?.loser_id || null
              };
            }
          }
          
          return newBracket;
        });
        
        // Clear editing state
        setEditingMatch(null);
        setTeam1Score(0);
        setTeam2Score(0);
        
        // Call parent update handler to fetch fresh data from server
        if (onMatchUpdate) {
          onMatchUpdate(editingMatch.id, {
            team1_score: parseInt(team1Score),
            team2_score: parseInt(team2Score),
            status: updatedMatch?.status,
            winner_id: updatedMatch?.winner_id
          });
        }
      }
    } catch (error) {
      console.error('Error updating match score:', error);
      alert('Failed to update match score');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingMatch(null);
    setTeam1Score(0);
    setTeam2Score(0);
  };

  return (
    <div className="liquipedia-bracket">
      <style>{`
        .liquipedia-bracket {
          --bracket-bg: transparent;
          --bracket-match-bg: #ffffff;
          --bracket-border: #d3d3d3;
          --bracket-text: #000000;
          --bracket-text-muted: #666666;
          --bracket-winner: #228b22;
          --bracket-loser: #999999;
          --bracket-live: #ff6b35;
          --bracket-pending: #e6e6e6;
          --bracket-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
          --bracket-hover-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .dark .liquipedia-bracket {
          --bracket-bg: transparent;
          --bracket-match-bg: #3a3a3a;
          --bracket-border: #555555;
          --bracket-text: #ffffff;
          --bracket-text-muted: #cccccc;
          --bracket-winner: #4ade80;
          --bracket-loser: #9ca3af;
          --bracket-live: #ff6b35;
          --bracket-pending: #555555;
          --bracket-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
          --bracket-hover-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }

        .bracket-container {
          overflow-x: auto;
          overflow-y: visible;
          padding: 1rem 0;
          min-height: 400px;
        }

        .bracket-rounds {
          display: flex;
          gap: 40px;
          align-items: flex-start;
          min-width: fit-content;
          justify-content: flex-start;
          padding: 8px;
        }

        .bracket-round {
          display: flex;
          flex-direction: column;
          min-width: 200px;
          position: relative;
        }

        .round-header {
          text-align: center;
          margin-bottom: 12px;
          padding: 4px 8px;
          background: var(--bracket-pending);
          border: 1px solid var(--bracket-border);
          border-radius: 3px;
        }

        .round-title {
          font-size: 11px;
          font-weight: 700;
          color: var(--bracket-text);
          margin-bottom: 2px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .round-date {
          font-size: 9px;
          color: var(--bracket-text-muted);
          font-weight: 400;
        }

        .round-matches {
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .liquipedia-match {
          background: var(--bracket-match-bg);
          border: 1px solid var(--bracket-border);
          border-radius: 3px;
          overflow: hidden;
          box-shadow: var(--bracket-shadow);
          transition: all 0.15s ease;
          cursor: pointer;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 12px;
          min-width: 200px;
        }

        .liquipedia-match.admin-editable {
          border-color: #dc2626;
          border-width: 2px;
        }

        .liquipedia-match.admin-editable:hover {
          box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
        }

        .liquipedia-match:hover {
          box-shadow: var(--bracket-hover-shadow);
          transform: translateY(-1px);
        }

        .liquipedia-match.live {
          border-color: var(--bracket-live);
          animation: pulse-glow 2s infinite;
        }

        .liquipedia-match.completed {
          border-color: var(--bracket-winner);
        }

        .match-header {
          background: var(--bracket-pending);
          padding: 4px 8px;
          border-bottom: 1px solid var(--bracket-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          text-transform: uppercase;
          font-weight: 600;
        }

        .dark .match-header {
          background: var(--bracket-pending);
        }

        .match-format {
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--bracket-text-muted);
        }

        .live-indicator {
          color: var(--bracket-live);
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--bracket-live);
          animation: pulse-dot 1.5s infinite;
        }

        .teams-container {
          display: flex;
          flex-direction: column;
        }

        .team-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 8px;
          transition: background-color 0.15s ease;
          min-height: 26px;
          border-right: 3px solid transparent;
        }

        .team-row:first-child {
          border-bottom: 1px solid var(--bracket-border);
        }

        .team-row.winner {
          background: rgba(34, 139, 34, 0.08);
          border-right-color: var(--bracket-winner);
          font-weight: 600;
        }

        .team-row.loser {
          opacity: 0.6;
          color: var(--bracket-loser);
          background: rgba(153, 153, 153, 0.03);
        }

        .team-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex: 1;
          min-width: 0;
        }

        .team-logo {
          flex-shrink: 0;
          border-radius: 2px;
          overflow: hidden;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
        }

        .team-logo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .team-logo-fallback {
          font-size: 8px;
          font-weight: 700;
          color: var(--bracket-text-muted);
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bracket-pending);
          border-radius: 2px;
        }

        .team-name {
          font-weight: 500;
          font-size: 11px;
          color: var(--bracket-text);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.15s ease;
          max-width: 120px;
        }

        .team-name.team-clickable {
          cursor: pointer;
          color: var(--bracket-text);
          transition: color 0.15s ease;
        }

        .team-name.team-clickable:hover {
          color: #dc2626;
          text-decoration: underline;
        }

        .team-placeholder {
          font-style: italic;
          color: var(--bracket-text-muted);
          font-size: 0.8rem;
        }

        .team-seed {
          font-size: 0.7rem;
          color: var(--bracket-text-muted);
          background: var(--bracket-pending);
          padding: 0.125rem 0.375rem;
          border-radius: 10px;
          font-weight: 500;
          margin-right: 0.25rem;
        }

        .team-score {
          font-weight: 700;
          font-size: 14px;
          color: var(--bracket-text);
          min-width: 20px;
          text-align: center;
          transition: all 0.15s ease;
          padding: 2px 6px;
          border-radius: 2px;
          background: rgba(0, 0, 0, 0.05);
          border: 1px solid var(--bracket-border);
        }

        .dark .team-score {
          background: rgba(255, 255, 255, 0.1);
        }

        .team-score.winner {
          color: var(--bracket-winner);
          background: rgba(34, 139, 34, 0.15);
          border-color: var(--bracket-winner);
          font-weight: 800;
        }

        .team-score.pending {
          color: var(--bracket-text-muted);
          font-size: 12px;
          font-weight: 400;
          background: transparent;
          border: none;
        }

        .match-connector {
          position: absolute;
          right: -20px;
          top: 50%;
          width: 20px;
          height: 1px;
          background: var(--bracket-border);
          transform: translateY(-50%);
          pointer-events: none;
        }

        .bracket-round:last-child .match-connector {
          display: none;
        }

        /* Simplified bracket connectors matching Liquipedia */
        .bracket-connectors {
          position: absolute;
          right: -40px;
          top: 0;
          width: 40px;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .connector-line {
          position: absolute;
          background: var(--bracket-border);
        }

        .connector-horizontal {
          height: 1px;
          width: 20px;
        }

        .connector-vertical {
          width: 1px;
          right: 20px;
        }

        .connector-to-next {
          height: 1px;
          width: 20px;
          right: 0;
        }

        /* Liquipedia-style bracket spacing - progressive doubling */
        .bracket-round:nth-child(1) .round-matches {
          gap: 8px;
        }

        .bracket-round:nth-child(2) .round-matches {
          gap: 24px;
        }

        .bracket-round:nth-child(3) .round-matches {
          gap: 56px;
        }

        .bracket-round:nth-child(4) .round-matches {
          gap: 120px;
        }

        .bracket-round:nth-child(5) .round-matches {
          gap: 248px;
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.4);
          }
        }

        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Responsive design */
        @media (max-width: 1024px) {
          .bracket-rounds {
            gap: 2.5rem;
          }
          
          .bracket-round {
            min-width: 220px;
          }
          
          .round-title {
            font-size: 0.9rem;
          }
        }

        @media (max-width: 768px) {
          .bracket-container {
            padding: 0.5rem 0;
          }
          
          .bracket-rounds {
            gap: 2rem;
          }
          
          .bracket-round {
            min-width: 200px;
          }
          
          .round-title {
            font-size: 0.85rem;
          }
          
          .team-name {
            font-size: 0.75rem;
          }
          
          .team-score {
            font-size: 1.1rem;
          }
          
          .team-row {
            padding: 0.625rem;
          }
          
          /* Simplify connectors on tablet */
          .bracket-connectors {
            right: -2rem;
            width: 2rem;
          }
          
          .match-connector {
            right: -1rem;
            width: 1rem;
          }
        }

        @media (max-width: 640px) {
          .bracket-rounds {
            gap: 1.5rem;
          }
          
          .bracket-round {
            min-width: 180px;
          }
          
          .round-header {
            margin-bottom: 1rem;
          }
          
          .round-title {
            font-size: 0.8rem;
          }
          
          .round-date {
            font-size: 0.7rem;
          }
          
          .liquipedia-match {
            min-height: auto;
          }
          
          .team-row {
            padding: 0.5rem;
          }
          
          .team-name {
            font-size: 0.7rem;
            max-width: 100px;
          }
          
          .team-score {
            font-size: 1rem;
          }
          
          .match-format {
            font-size: 0.7rem;
          }
          
          .live-indicator {
            font-size: 0.7rem;
          }
          
          /* Hide connectors on mobile for cleaner look */
          .bracket-connectors,
          .match-connector {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .bracket-rounds {
            gap: 1rem;
          }
          
          .bracket-round {
            min-width: 160px;
          }
          
          .team-row {
            padding: 0.375rem 0.5rem;
          }
          
          .team-name {
            font-size: 0.65rem;
            max-width: 80px;
          }
          
          .team-score {
            font-size: 0.9rem;
          }
          
          .round-title {
            font-size: 0.75rem;
          }
        }

        /* Landscape mobile optimization */
        @media (max-height: 500px) and (orientation: landscape) {
          .bracket-container {
            min-height: auto;
            padding: 0.25rem 0;
          }
          
          .round-header {
            margin-bottom: 0.5rem;
            position: static;
          }
          
          .round-matches {
            gap: 0.5rem;
          }
          
          .team-row {
            padding: 0.25rem 0.5rem;
          }
        }
      `}</style>
      
      <div className="bracket-container">
        <div className="bracket-rounds">
          {rounds.map((round, roundIndex) => (
            <BracketRound
              key={roundIndex}
              round={round}
              roundIndex={roundIndex}
              totalRounds={rounds.length}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              setEditingMatch={setEditingMatch}
              setTeam1Score={setTeam1Score}
              setTeam2Score={setTeam2Score}
            />
          ))}
        </div>
      </div>
      
      {/* Render Score Edit Modal */}
      {renderScoreEditModal()}
    </div>
  );
}

function BracketRound({ round, roundIndex, totalRounds, navigateTo, isAdmin, onMatchUpdate, setEditingMatch, setTeam1Score, setTeam2Score }) {
  return (
    <div className="bracket-round">
      <div className="round-header">
        <h3 className="round-title">{round.name}</h3>
        {round.date && (
          <div className="round-date">
            {new Date(round.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
        )}
      </div>
      
      <div className="round-matches">
        {round.matches.map((match, matchIndex) => (
          <div key={matchIndex} className="match-container" style={{ position: 'relative' }}>
            <LiquipediaMatch
              match={match}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              onEditMatch={(match) => {
                setEditingMatch(match);
                setTeam1Score(match.team1?.score || match.team1_score || 0);
                setTeam2Score(match.team2?.score || match.team2_score || 0);
              }}
              showConnector={roundIndex < totalRounds - 1}
            />
            
            {/* Enhanced bracket connectors */}
            {roundIndex < totalRounds - 1 && (
              <BracketConnector
                matchIndex={matchIndex}
                totalMatches={round.matches.length}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BracketConnector({ matchIndex, totalMatches }) {
  const isEven = matchIndex % 2 === 0;
  
  if (isEven && matchIndex < totalMatches - 1) {
    // This match connects to the next match and then to the next round
    const connectorHeight = `calc(100% + 2rem)`; // Account for gap between matches
    
    return (
      <div className="bracket-connectors">
        {/* Horizontal line from this match */}
        <div 
          className="connector-line connector-horizontal"
          style={{
            top: '50%',
            left: '100%',
            transform: 'translateY(-50%)'
          }}
        />
        
        {/* Vertical line to next match */}
        <div 
          className="connector-line connector-vertical"
          style={{
            top: '50%',
            right: '1.5rem',
            height: connectorHeight
          }}
        />
        
        {/* Horizontal line to next round */}
        <div 
          className="connector-line connector-to-next"
          style={{
            top: `calc(50% + 1rem)`, // Midpoint between this match and next
            right: '0'
          }}
        />
      </div>
    );
  }
  
  if (!isEven) {
    // Odd matches only have horizontal connector to vertical line
    return (
      <div className="bracket-connectors">
        <div 
          className="connector-line connector-horizontal"
          style={{
            top: '50%',
            left: '100%',
            transform: 'translateY(-50%)'
          }}
        />
      </div>
    );
  }
  
  return null;
}

function LiquipediaMatch({ match, navigateTo, isAdmin, onMatchUpdate, showConnector, onEditMatch }) {
  const isCompleted = match.status === 'completed' || match.finished;
  const isLive = match.status === 'live';
  const team1Won = isCompleted && (match.winner === 1 || (match.team1_score > match.team2_score));
  const team2Won = isCompleted && (match.winner === 2 || (match.team2_score > match.team1_score));

  const getMatchFormat = () => {
    if (match.format) {
      // Marvel Rivals specific formats
      const marvelFormats = {
        'best_of_3': 'Bo3',
        'best_of_5': 'Bo5',
        'best_of_7': 'Bo7',
        'single_game': '1 Game',
        'double_elimination': 'DE',
        'single_elimination': 'SE',
        'swiss': 'Swiss',
        'round_robin': 'RR'
      };
      return marvelFormats[match.format] || match.format;
    }
    if (match.bestof) return `Bo${match.bestof}`;
    return 'Bo5'; // Default Marvel Rivals format
  };

  const handleMatchClick = () => {
    if (isAdmin && onEditMatch) {
      // Admin/Moderator: Show edit modal
      onEditMatch(match);
    } else if (navigateTo) {
      // Regular user: Navigate to match details page
      navigateTo('match-detail', { id: match.id });
    }
  };

  const handleTeamClick = (team, e) => {
    // Prevent match click when clicking team
    e.stopPropagation();
    if (team && team.id && navigateTo) {
      navigateTo('team-detail', { id: team.id });
    }
  };

  const getTeamName = (team) => {
    if (!team) return null;
    return team.short_name || team.name || team.title;
  };

  const getTeamScore = (team, teamNumber) => {
    if (match[`team${teamNumber}_score`] !== undefined) {
      return match[`team${teamNumber}_score`];
    }
    
    if (team && team.score !== undefined) {
      return team.score;
    }
    
    if (!isCompleted && !isLive) return '-';
    
    return '-';
  };

  const renderTeamLogo = (team) => {
    if (!team) return null;
    
    return (
      <div className="team-logo">
        <TeamLogo 
          team={team} 
          size="w-4 h-4" 
          fallback={
            <div className="team-logo-fallback">
              {(team.name || team.short_name || 'T').charAt(0).toUpperCase()}
            </div>
          }
        />
      </div>
    );
  };

  const getTeamSeed = (team) => {
    if (!team) return null;
    if (team.seed) return `#${team.seed}`;
    if (team.seeding) return `#${team.seeding}`;
    return null;
  };

  // Debug logging for admin controls
  console.log('🔧 LiquipediaMatch render - isAdmin:', isAdmin, 'match.id:', match.id);

  return (
    <div 
      className={`liquipedia-match ${isLive ? 'live' : ''} ${isCompleted ? 'completed' : ''} ${isAdmin ? 'admin-editable' : ''}`}
      onClick={handleMatchClick}
      title={isAdmin ? 'Click to edit match score' : 'Click for match details'}
    >
      {/* Match Header */}
      <div className="match-header">
        <span className="match-format">{getMatchFormat()}</span>
        {isAdmin && (
          <span className="admin-indicator" style={{ 
            fontSize: '9px', 
            color: '#dc2626', 
            fontWeight: 'bold' 
          }}>
            ✎ EDIT
          </span>
        )}
        {isLive && (
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span>LIVE</span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="teams-container">
        <div className={`team-row ${team1Won ? 'winner' : team2Won ? 'loser' : ''}`}>
          <div className="team-info">
            {match.team1 || match.opponent1 ? (
              <>
                {getTeamSeed(match.team1 || match.opponent1) && (
                  <span className="team-seed">
                    {getTeamSeed(match.team1 || match.opponent1)}
                  </span>
                )}
                {renderTeamLogo(match.team1 || match.opponent1)}
                <span 
                  className="team-name team-clickable"
                  onClick={(e) => handleTeamClick(match.team1 || match.opponent1, e)}
                >
                  {getTeamName(match.team1 || match.opponent1)}
                </span>
              </>
            ) : (
              <span className="team-name team-placeholder">TBD</span>
            )}
          </div>
          <div className={`team-score ${team1Won ? 'winner' : !isCompleted && !isLive ? 'pending' : ''}`}>
            {getTeamScore(match.team1 || match.opponent1, 1)}
          </div>
        </div>

        <div className={`team-row ${team2Won ? 'winner' : team1Won ? 'loser' : ''}`}>
          <div className="team-info">
            {match.team2 || match.opponent2 ? (
              <>
                {getTeamSeed(match.team2 || match.opponent2) && (
                  <span className="team-seed">
                    {getTeamSeed(match.team2 || match.opponent2)}
                  </span>
                )}
                {renderTeamLogo(match.team2 || match.opponent2)}
                <span 
                  className="team-name team-clickable"
                  onClick={(e) => handleTeamClick(match.team2 || match.opponent2, e)}
                >
                  {getTeamName(match.team2 || match.opponent2)}
                </span>
              </>
            ) : (
              <span className="team-name team-placeholder">TBD</span>
            )}
          </div>
          <div className={`team-score ${team2Won ? 'winner' : !isCompleted && !isLive ? 'pending' : ''}`}>
            {getTeamScore(match.team2 || match.opponent2, 2)}
          </div>
        </div>
      </div>

      {/* Match Connector */}
      {showConnector && (
        <div className="match-connector"></div>
      )}
    </div>
  );
}

export default LiquipediaBracket;