import React, { useState } from 'react';
import LiquipediaMatchCard from './LiquipediaMatchCard';
import { TeamLogo } from '../utils/imageUtils';
import '../styles/liquipedia-tournament.css';

/**
 * Liquipedia-style Round Robin Tournament
 * Displays group tables and head-to-head matches
 */
function LiquipediaRoundRobinBracket({
  bracket,
  tournament,
  tournamentId,
  navigateTo,
  isAdmin = false,
  onMatchUpdate,
  onMatchClick,
  onTeamClick,
  hoveredMatch,
  selectedMatch,
  compact = false
}) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [viewMode, setViewMode] = useState('standings'); // 'standings', 'matches', 'matrix'
  
  const groups = bracket?.groups || {};
  const overallStandings = bracket?.standings || [];
  
  // Sort groups alphabetically
  const sortedGroups = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([groupName, groupData]) => ({ groupName, ...groupData }));

  // If no groups but have standings/matches, treat as single group
  const singleGroup = !Object.keys(groups).length && (overallStandings.length || bracket?.matches?.length);

  return (
    <div className="round-robin-bracket w-full space-y-8">
      {/* Overall Standings (if multiple groups) */}
      {overallStandings.length > 0 && sortedGroups.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Overall Standings</h3>
          </div>
          <RoundRobinTable 
            standings={overallStandings}
            onTeamClick={onTeamClick}
            compact={compact}
            showAdvancement={true}
          />
        </div>
      )}

      {/* Single Group View */}
      {singleGroup && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Round Robin</h3>
              <ViewModeSelector viewMode={viewMode} onViewModeChange={setViewMode} />
            </div>
          </div>
          
          {viewMode === 'standings' && (
            <RoundRobinTable 
              standings={overallStandings}
              onTeamClick={onTeamClick}
              compact={compact}
            />
          )}
          
          {viewMode === 'matches' && bracket?.matches && (
            <div className="p-6">
              <RoundRobinMatches
                matches={bracket.matches}
                onMatchClick={onMatchClick}
                onTeamClick={onTeamClick}
                hoveredMatch={hoveredMatch}
                selectedMatch={selectedMatch}
                compact={compact}
              />
            </div>
          )}
          
          {viewMode === 'matrix' && (
            <div className="p-6">
              <HeadToHeadMatrix
                standings={overallStandings}
                matches={bracket?.matches || []}
                onMatchClick={onMatchClick}
                onTeamClick={onTeamClick}
                compact={compact}
              />
            </div>
          )}
        </div>
      )}

      {/* Multiple Groups View */}
      {sortedGroups.length > 0 && (
        <div className="space-y-8">
          {/* Group Navigation */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Group Stage</h3>
              <div className="flex items-center space-x-4">
                <ViewModeSelector viewMode={viewMode} onViewModeChange={setViewMode} />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedGroup(null)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      selectedGroup === null 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    All Groups
                  </button>
                  {sortedGroups.map(({ groupName }) => (
                    <button
                      key={groupName}
                      onClick={() => setSelectedGroup(groupName)}
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        selectedGroup === groupName 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      Group {groupName}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Groups Display */}
            <div className={`${selectedGroup ? 'space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'}`}>
              {sortedGroups
                .filter(({ groupName }) => selectedGroup === null || selectedGroup === groupName)
                .map(({ groupName, standings = [], matches = [] }) => (
                  <GroupSection
                    key={groupName}
                    groupName={groupName}
                    standings={standings}
                    matches={matches}
                    viewMode={viewMode}
                    onMatchClick={onMatchClick}
                    onTeamClick={onTeamClick}
                    hoveredMatch={hoveredMatch}
                    selectedMatch={selectedMatch}
                    compact={compact}
                    hideTitle={selectedGroup === groupName}
                  />
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * View Mode Selector
 */
function ViewModeSelector({ viewMode, onViewModeChange }) {
  const modes = [
    { key: 'standings', label: 'Standings' },
    { key: 'matches', label: 'Matches' },
    { key: 'matrix', label: 'H2H Matrix' }
  ];

  return (
    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
      {modes.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onViewModeChange(key)}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            viewMode === key
              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Individual Group Section
 */
function GroupSection({ 
  groupName, 
  standings, 
  matches, 
  viewMode, 
  onMatchClick, 
  onTeamClick, 
  hoveredMatch, 
  selectedMatch, 
  compact,
  hideTitle = false
}) {
  return (
    <div className="group-section">
      {!hideTitle && (
        <div className="mb-4">
          <h4 className="text-md font-bold text-gray-900 dark:text-white border-b-2 border-blue-500 pb-2 inline-block">
            Group {groupName}
          </h4>
        </div>
      )}
      
      {viewMode === 'standings' && (
        <RoundRobinTable 
          standings={standings}
          onTeamClick={onTeamClick}
          compact={compact}
          isGroupStage={true}
        />
      )}
      
      {viewMode === 'matches' && (
        <RoundRobinMatches
          matches={matches}
          onMatchClick={onMatchClick}
          onTeamClick={onTeamClick}
          hoveredMatch={hoveredMatch}
          selectedMatch={selectedMatch}
          compact={compact}
        />
      )}
      
      {viewMode === 'matrix' && (
        <HeadToHeadMatrix
          standings={standings}
          matches={matches}
          onMatchClick={onMatchClick}
          onTeamClick={onTeamClick}
          compact={compact}
        />
      )}
    </div>
  );
}

/**
 * Round Robin Standings Table
 */
function RoundRobinTable({ standings, onTeamClick, compact = false, isGroupStage = false, showAdvancement = false }) {
  if (!standings?.length) return <div className="p-6 text-gray-500">No standings available</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Pos
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Team
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              P
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              W
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              L
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              +/-
            </th>
            <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Pts
            </th>
            {!compact && (
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Form
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {standings.map((standing, index) => {
            const isAdvancing = isGroupStage && index < 2;
            const isQualified = showAdvancement && standing.status === 'qualified';
            
            return (
              <tr 
                key={standing.team_id || index} 
                className={`
                  hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer
                  ${(isAdvancing || isQualified) ? 'bg-green-50 dark:bg-green-900/20' : ''}
                `}
                onClick={() => onTeamClick?.(standing)}
              >
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {index + 1}
                    </span>
                    {(isAdvancing || isQualified) && (
                      <span className="ml-2 text-green-500 text-xs" title="Advances">✓</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-3">
                    <TeamLogo 
                      team={{ logo: standing.team_logo }} 
                      size="w-6 h-6" 
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
                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                  {standing.played || (standing.wins + standing.losses)}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-bold text-green-600 dark:text-green-400">
                  {standing.wins || 0}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-bold text-red-600 dark:text-red-400">
                  {standing.losses || 0}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                  {standing.round_differential || standing.map_differential || 0}
                </td>
                <td className="px-3 py-3 whitespace-nowrap text-center text-sm font-bold text-gray-900 dark:text-white">
                  {standing.points || (standing.wins * 3)}
                </td>
                {!compact && (
                  <td className="px-3 py-3 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-1">
                      {(standing.recent_form || 'WWLWL').split('').slice(-5).map((result, i) => (
                        <span
                          key={i}
                          className={`w-4 h-4 text-xs font-bold rounded-full flex items-center justify-center ${
                            result === 'W' 
                              ? 'bg-green-500 text-white' 
                              : 'bg-red-500 text-white'
                          }`}
                        >
                          {result}
                        </span>
                      ))}
                    </div>
                  </td>
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
 * Round Robin Matches Grid
 */
function RoundRobinMatches({ 
  matches, 
  onMatchClick, 
  onTeamClick, 
  hoveredMatch, 
  selectedMatch, 
  compact 
}) {
  if (!matches?.length) return <div className="text-gray-500">No matches available</div>;

  return (
    <div className={`
      grid gap-4
      ${compact 
        ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
        : 'grid-cols-1 md:grid-cols-2'
      }
    `}>
      {matches.map((match, index) => (
        <LiquipediaMatchCard
          key={match.id || index}
          match={match}
          onClick={onMatchClick}
          onTeamClick={onTeamClick}
          isHovered={hoveredMatch?.id === match.id}
          isSelected={selectedMatch?.id === match.id}
          compact={compact}
        />
      ))}
    </div>
  );
}

/**
 * Head-to-Head Matrix Component
 */
function HeadToHeadMatrix({ standings, matches, onMatchClick, onTeamClick, compact }) {
  if (!standings?.length) return <div className="text-gray-500">No data available</div>;

  // Build head-to-head record matrix
  const matrix = {};
  standings.forEach(team => {
    matrix[team.team_id] = {};
    standings.forEach(opponent => {
      if (team.team_id !== opponent.team_id) {
        matrix[team.team_id][opponent.team_id] = { wins: 0, losses: 0, matches: [] };
      }
    });
  });

  // Populate matrix with match results
  matches?.forEach(match => {
    if (match.team1_id && match.team2_id && match.status === 'completed') {
      const winner = match.team1_score > match.team2_score ? match.team1_id : match.team2_id;
      const loser = winner === match.team1_id ? match.team2_id : match.team1_id;
      
      if (matrix[winner] && matrix[winner][loser]) {
        matrix[winner][loser].wins++;
        matrix[winner][loser].matches.push(match);
      }
      if (matrix[loser] && matrix[loser][winner]) {
        matrix[loser][winner].losses++;
        matrix[loser][winner].matches.push(match);
      }
    }
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800"></th>
            {standings.map((team, index) => (
              <th 
                key={team.team_id || index}
                className="p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-center min-w-[60px]"
              >
                <div className="flex flex-col items-center space-y-1">
                  <TeamLogo team={{ logo: team.team_logo }} size="w-6 h-6" />
                  {!compact && (
                    <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[50px]">
                      {team.team_name}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {standings.map((team, rowIndex) => (
            <tr key={team.team_id || rowIndex}>
              <td className="p-2 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 font-medium">
                <div className="flex items-center space-x-2">
                  <TeamLogo team={{ logo: team.team_logo }} size="w-6 h-6" />
                  <span className="text-sm truncate">{team.team_name}</span>
                </div>
              </td>
              {standings.map((opponent, colIndex) => {
                if (rowIndex === colIndex) {
                  return (
                    <td 
                      key={opponent.team_id || colIndex}
                      className="p-2 border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-center"
                    >
                      <span className="text-gray-400">—</span>
                    </td>
                  );
                }

                const record = matrix[team.team_id]?.[opponent.team_id];
                const hasPlayed = record && (record.wins > 0 || record.losses > 0);

                return (
                  <td 
                    key={opponent.team_id || colIndex}
                    className={`
                      p-2 border border-gray-300 dark:border-gray-600 text-center text-sm cursor-pointer
                      hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                      ${hasPlayed ? '' : 'bg-gray-50 dark:bg-gray-800'}
                    `}
                    onClick={() => {
                      if (record?.matches.length > 0) {
                        onMatchClick?.(record.matches[0]);
                      }
                    }}
                  >
                    {hasPlayed ? (
                      <span className={`font-bold ${
                        record.wins > record.losses 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {record.wins}-{record.losses}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default LiquipediaRoundRobinBracket;