import React, { useState, useMemo } from 'react';
import { TeamLogo } from '../utils/imageUtils';
import '../styles/liquipedia-tournament.css';

/**
 * Liquipedia-style GSL (Global StarCraft II League) Format Bracket
 * Groups of 4 teams with winners/elimination matches
 */
function LiquipediaGSLBracket({
  bracket,
  tournament,
  tournamentId,
  navigateTo,
  isAdmin = false,
  onMatchUpdate
}) {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeView, setActiveView] = useState('groups'); // 'groups', 'overview'

  console.log('GSLBracket props:', { bracket, tournament, tournamentId });

  // Parse GSL bracket data
  const groups = bracket?.groups || {};
  const groupNames = Object.keys(groups).sort();

  const handleMatchClick = (match) => {
    if (match.id && navigateTo) {
      navigateTo('match-detail', { id: match.id });
    }
  };

  // GSL Group Structure Component
  const GSLGroup = ({ groupName, groupData }) => {
    const teams = groupData.teams || [];
    const matches = groupData.matches || [];
    const standings = groupData.standings || [];

    // Parse GSL matches into phases
    const winnerMatches = matches.filter(m => m.phase === 'winners' || m.round === 1);
    const eliminationMatches = matches.filter(m => m.phase === 'elimination' || m.round === 2);
    const deciderMatches = matches.filter(m => m.phase === 'decider' || m.round === 3);

    const getTeamStatus = (team) => {
      const teamMatches = matches.filter(m => 
        m.team1?.id === team.id || m.team2?.id === team.id
      );

      let wins = 0, losses = 0;
      teamMatches.forEach(match => {
        if (match.status === 'completed') {
          const isTeam1 = match.team1?.id === team.id;
          const teamScore = isTeam1 ? match.team1_score : match.team2_score;
          const opponentScore = isTeam1 ? match.team2_score : match.team1_score;
          
          if (teamScore > opponentScore) wins++;
          else losses++;
        }
      });

      if (wins >= 2) return { status: 'advanced', label: 'Advanced', color: 'text-green-600 dark:text-green-400' };
      if (losses >= 2) return { status: 'eliminated', label: 'Eliminated', color: 'text-red-600 dark:text-red-400' };
      return { status: 'active', label: 'Active', color: 'text-blue-600 dark:text-blue-400' };
    };

    return (
      <div className="gsl-group bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        {/* Group Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Group {groupName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            GSL Format - First to 2 wins advances, first to 2 losses eliminated
          </p>
        </div>

        <div className="p-4">
          {/* Teams Overview */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Teams</h4>
            <div className="grid grid-cols-2 gap-3">
              {teams.map(team => {
                const teamStatus = getTeamStatus(team);
                return (
                  <div 
                    key={team.id}
                    className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => navigateTo && navigateTo('team-detail', { id: team.id })}
                  >
                    <TeamLogo team={team} size="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 dark:text-white truncate">
                        {team.name}
                      </div>
                      <div className={`text-xs ${teamStatus.color}`}>
                        {teamStatus.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* GSL Bracket Visualization */}
          <div className="gsl-bracket-flow">
            {/* Initial Winners Matches */}
            {winnerMatches.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Initial Matches
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {winnerMatches.map((match, index) => (
                    <GSLMatchCard
                      key={match.id || index}
                      match={match}
                      onMatchClick={handleMatchClick}
                      matchLabel={`Match ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Winners/Elimination Phase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Winners Match */}
              {winnerMatches.length > 1 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-3">
                    Winners Match
                  </h4>
                  <div className="text-center">
                    <div className="inline-block text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Winners advance
                    </div>
                    <GSLMatchCard
                      match={{
                        id: 'winners-final',
                        team1: { name: 'Winner of Match 1' },
                        team2: { name: 'Winner of Match 2' },
                        status: 'scheduled'
                      }}
                      onMatchClick={handleMatchClick}
                      matchLabel="Winners Final"
                      isPlaceholder={true}
                    />
                  </div>
                </div>
              )}

              {/* Elimination Match */}
              {eliminationMatches.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-3">
                    Elimination Match
                  </h4>
                  <div className="text-center">
                    <div className="inline-block text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Loser eliminated
                    </div>
                    <GSLMatchCard
                      match={eliminationMatches[0]}
                      onMatchClick={handleMatchClick}
                      matchLabel="Elimination"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Decider Match */}
            {deciderMatches.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-3 text-center">
                  Decider Match
                </h4>
                <div className="flex justify-center">
                  <div className="w-full max-w-md">
                    <div className="text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Winner advances, loser eliminated
                    </div>
                    <GSLMatchCard
                      match={deciderMatches[0]}
                      onMatchClick={handleMatchClick}
                      matchLabel="Decider"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Summary */}
          {standings.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Final Standings
              </h4>
              <div className="space-y-2">
                {standings.sort((a, b) => (a.position || 99) - (b.position || 99)).map(standing => (
                  <div 
                    key={standing.team?.id || standing.team_id}
                    className={`flex items-center justify-between p-2 rounded ${
                      standing.position <= 2 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        #{standing.position}
                      </span>
                      <TeamLogo team={standing.team} size="w-6 h-6" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {standing.team?.name}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      standing.position <= 2 
                        ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' 
                        : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                    }`}>
                      {standing.position <= 2 ? 'Advanced' : 'Eliminated'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Overall Tournament Overview
  const TournamentOverview = () => {
    const allGroups = Object.entries(groups);
    const totalTeams = allGroups.reduce((total, [, group]) => total + (group.teams?.length || 0), 0);
    const advancedTeams = allGroups.reduce((total, [, group]) => {
      const standings = group.standings || [];
      return total + standings.filter(s => s.position <= 2).length;
    }, 0);

    return (
      <div className="space-y-6">
        {/* Tournament Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {allGroups.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Groups</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalTeams}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Teams</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {advancedTeams}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Advanced</div>
          </div>
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {totalTeams - advancedTeams}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Eliminated</div>
          </div>
        </div>

        {/* Group Progress */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Group Progress</h3>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allGroups.map(([groupName, groupData]) => {
                const matches = groupData.matches || [];
                const completedMatches = matches.filter(m => m.status === 'completed');
                const progress = matches.length > 0 ? (completedMatches.length / matches.length) * 100 : 0;
                
                return (
                  <div 
                    key={groupName}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      setSelectedGroup(groupName);
                      setActiveView('groups');
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white">
                        Group {groupName}
                      </h4>
                      <span className="text-sm text-gray-500 dark:text-gray-500">
                        {completedMatches.length}/{matches.length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {Math.round(progress)}% complete
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (groupNames.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No GSL Groups Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          GSL format groups have not been set up yet.
        </p>
      </div>
    );
  }

  return (
    <div className="liquipedia-gsl-bracket">
      <style>{`
        .liquipedia-gsl-bracket {
          --gsl-bg: transparent;
          --gsl-card-bg: #ffffff;
          --gsl-border: #d3d3d3;
          --gsl-text: #000000;
          --gsl-text-muted: #666666;
          --gsl-winner: #228b22;
          --gsl-loser: #999999;
          --gsl-live: #ff6b35;
          --gsl-pending: #e6e6e6;
        }

        .dark .liquipedia-gsl-bracket {
          --gsl-card-bg: #3a3a3a;
          --gsl-border: #555555;
          --gsl-text: #ffffff;
          --gsl-text-muted: #cccccc;
          --gsl-winner: #4ade80;
          --gsl-loser: #9ca3af;
        }

        .gsl-match-card {
          background: var(--gsl-card-bg);
          border: 1px solid var(--gsl-border);
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .gsl-match-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .dark .gsl-match-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .gsl-team-row.winner {
          background: rgba(34, 139, 34, 0.08);
          border-left: 3px solid var(--gsl-winner);
        }

        .gsl-team-row.loser {
          opacity: 0.6;
          background: rgba(153, 153, 153, 0.03);
        }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">GSL Format</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Groups of 4 teams compete in a dual-tournament bracket. First to 2 wins advances, first to 2 losses is eliminated.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        {/* View Toggle */}
        <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('groups')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeView === 'groups'
                ? 'bg-red-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            Groups
          </button>
        </div>

        {/* Group Selector (when in groups view) */}
        {activeView === 'groups' && (
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button
              onClick={() => setSelectedGroup(null)}
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                selectedGroup === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              All Groups
            </button>
            {groupNames.map(groupName => (
              <button
                key={groupName}
                onClick={() => setSelectedGroup(groupName)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  selectedGroup === groupName
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                Group {groupName}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      {activeView === 'overview' && <TournamentOverview />}
      
      {activeView === 'groups' && (
        <div className="space-y-6">
          {groupNames
            .filter(groupName => selectedGroup === null || selectedGroup === groupName)
            .map(groupName => (
              <GSLGroup
                key={groupName}
                groupName={groupName}
                groupData={groups[groupName]}
              />
            ))}
        </div>
      )}
    </div>
  );
}

// GSL Match Card Component
function GSLMatchCard({ 
  match, 
  onMatchClick, 
  matchLabel, 
  isPlaceholder = false 
}) {
  const isCompleted = match.status === 'completed' || match.finished;
  const isLive = match.status === 'live';
  
  const team1 = match.team1 || match.opponent1;
  const team2 = match.team2 || match.opponent2;
  
  const team1Score = match.team1_score || match.score1 || 0;
  const team2Score = match.team2_score || match.score2 || 0;
  
  const team1Won = isCompleted && team1Score > team2Score;
  const team2Won = isCompleted && team2Score > team1Score;

  return (
    <div 
      className={`gsl-match-card p-3 ${isPlaceholder ? 'opacity-60' : 'cursor-pointer'}`}
      onClick={() => !isPlaceholder && onMatchClick && onMatchClick(match)}
    >
      {/* Match Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {matchLabel}
        </div>
        <div className={`text-xs font-medium ${
          isLive ? 'text-red-600 dark:text-red-400' : 
          isCompleted ? 'text-green-600 dark:text-green-400' : 
          'text-gray-500 dark:text-gray-500'
        }`}>
          {isLive ? 'LIVE' : isCompleted ? 'Completed' : 'Scheduled'}
        </div>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* Team 1 */}
        <div className={`gsl-team-row flex items-center justify-between p-2 rounded ${
          team1Won ? 'winner' : team2Won ? 'loser' : ''
        }`}>
          <div className="flex items-center space-x-2">
            <TeamLogo team={team1} size="w-6 h-6" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {team1?.name || 'TBD'}
            </span>
          </div>
          <div className={`text-sm font-bold ${
            team1Won ? 'text-green-600 dark:text-green-400' : 
            isCompleted ? 'text-gray-500 dark:text-gray-500' : 
            'text-gray-400 dark:text-gray-400'
          }`}>
            {isCompleted || isLive ? team1Score : '-'}
          </div>
        </div>

        {/* Team 2 */}
        <div className={`gsl-team-row flex items-center justify-between p-2 rounded ${
          team2Won ? 'winner' : team1Won ? 'loser' : ''
        }`}>
          <div className="flex items-center space-x-2">
            <TeamLogo team={team2} size="w-6 h-6" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {team2?.name || 'TBD'}
            </span>
          </div>
          <div className={`text-sm font-bold ${
            team2Won ? 'text-green-600 dark:text-green-400' : 
            isCompleted ? 'text-gray-500 dark:text-gray-500' : 
            'text-gray-400 dark:text-gray-400'
          }`}>
            {isCompleted || isLive ? team2Score : '-'}
          </div>
        </div>
      </div>

      {/* Match Info */}
      {(match.best_of || isLive) && (
        <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
          {match.best_of && (
            <span className="text-gray-500 dark:text-gray-500">
              Bo{match.best_of}
            </span>
          )}
          {isLive && (
            <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LiquipediaGSLBracket;