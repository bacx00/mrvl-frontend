import React, { useState } from 'react';
import LiquipediaMatchCard from './LiquipediaMatchCard';
import { TeamLogo } from '../utils/imageUtils';

/**
 * Liquipedia-style Swiss System Bracket
 * Displays standings table and round-by-round matches
 */
function LiquipediaSwissBracket({
  bracket,
  onMatchClick,
  onTeamClick,
  hoveredMatch,
  selectedMatch,
  compact = false,
  showStandings = true
}) {
  const [selectedRound, setSelectedRound] = useState(null);
  
  const rounds = bracket?.rounds || {};
  const standings = bracket?.standings || [];
  const currentRound = bracket?.current_round || Math.max(...Object.keys(rounds).map(Number), 0);
  
  // Sort rounds by round number
  const sortedRounds = Object.entries(rounds)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([roundNum, matches]) => ({ roundNum: Number(roundNum), matches }));

  return (
    <div className="swiss-bracket w-full space-y-8">
      {/* Swiss Standings Table */}
      {showStandings && standings.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Swiss System Standings</h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Current Round: {currentRound}
              </div>
            </div>
          </div>
          <SwissStandingsTable 
            standings={standings} 
            onTeamClick={onTeamClick}
            compact={compact}
          />
        </div>
      )}

      {/* Round Navigation */}
      {sortedRounds.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Swiss Rounds</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedRound(null)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  selectedRound === null 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                All Rounds
              </button>
              {sortedRounds.map(({ roundNum }) => (
                <button
                  key={roundNum}
                  onClick={() => setSelectedRound(roundNum)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    selectedRound === roundNum 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  } ${roundNum === currentRound ? 'ring-2 ring-blue-400' : ''}`}
                >
                  Round {roundNum}
                  {roundNum === currentRound && (
                    <span className="ml-1 text-xs bg-green-500 text-white px-1 rounded">Live</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Rounds Display */}
          <div className="space-y-8">
            {sortedRounds
              .filter(({ roundNum }) => selectedRound === null || selectedRound === roundNum)
              .map(({ roundNum, matches }) => (
                <SwissRound
                  key={roundNum}
                  roundNum={roundNum}
                  matches={matches}
                  onMatchClick={onMatchClick}
                  onTeamClick={onTeamClick}
                  hoveredMatch={hoveredMatch}
                  selectedMatch={selectedMatch}
                  compact={compact}
                  isCurrentRound={roundNum === currentRound}
                  hideTitle={selectedRound === roundNum}
                />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Swiss Standings Table Component
 */
function SwissStandingsTable({ standings, onTeamClick, compact = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Rank
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Team
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Record
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Pts
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Diff
            </th>
            {!compact && (
              <>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Buchholz
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {standings.map((standing, index) => {
            const isQualified = standing.status === 'qualified' || (standing.wins >= 3 && standing.losses < 3);
            const isEliminated = standing.status === 'eliminated' || standing.losses >= 3;
            
            return (
              <tr 
                key={standing.team_id || index} 
                className={`
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer
                  ${isQualified ? 'bg-green-50 dark:bg-green-900/20' : ''}
                  ${isEliminated ? 'bg-red-50 dark:bg-red-900/20 opacity-75' : ''}
                `}
                onClick={() => onTeamClick?.(standing)}
              >
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      #{index + 1}
                    </span>
                    {isQualified && (
                      <span className="ml-2 text-green-500" title="Qualified">✓</span>
                    )}
                    {isEliminated && (
                      <span className="ml-2 text-red-500" title="Eliminated">✗</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <TeamLogo 
                      team={{ logo: standing.team_logo }} 
                      size="w-8 h-8" 
                      className="flex-shrink-0"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {standing.team_name}
                      </span>
                      {standing.team_region && !compact && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {standing.team_region}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <span className="text-sm font-bold">
                    <span className="text-green-600 dark:text-green-400">{standing.wins || 0}</span>
                    <span className="mx-1 text-gray-500">-</span>
                    <span className="text-red-600 dark:text-red-400">{standing.losses || 0}</span>
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white">
                  {standing.points || (standing.wins * 3)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                  {standing.round_differential || standing.map_differential || 0}
                </td>
                {!compact && (
                  <>
                    <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                      {standing.buchholz || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      {isQualified && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Qualified
                        </span>
                      )}
                      {isEliminated && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Eliminated
                        </span>
                      )}
                      {!isQualified && !isEliminated && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Active
                        </span>
                      )}
                    </td>
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Individual Swiss Round Component
 */
function SwissRound({ 
  roundNum, 
  matches, 
  onMatchClick, 
  onTeamClick, 
  hoveredMatch, 
  selectedMatch, 
  compact,
  isCurrentRound,
  hideTitle = false
}) {
  if (!matches?.length) return null;

  return (
    <div className="swiss-round">
      {!hideTitle && (
        <div className="flex items-center justify-center mb-6">
          <div className="flex items-center space-x-3">
            <h4 className={`
              text-sm font-bold tracking-wider uppercase border-b-2 pb-2 
              ${isCurrentRound 
                ? 'text-blue-700 dark:text-blue-300 border-blue-500' 
                : 'text-gray-700 dark:text-gray-300 border-gray-400'
              }
            `}>
              Round {roundNum}
            </h4>
            {isCurrentRound && (
              <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                Live
              </span>
            )}
          </div>
        </div>
      )}

      <div className={`
        grid gap-6
        ${compact 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }
      `}>
        {matches.map((match, index) => (
          <div key={match.id || index} className="transition-all duration-300">
            <LiquipediaMatchCard
              match={match}
              onClick={onMatchClick}
              onTeamClick={onTeamClick}
              isHovered={hoveredMatch?.id === match.id}
              isSelected={selectedMatch?.id === match.id}
              compact={compact}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default LiquipediaSwissBracket;