import React, { useState } from 'react';
import { TeamLogo } from '../utils/imageUtils';

function SwissBracket({ 
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
  const [activeTab, setActiveTab] = useState('standings');
  const rounds = bracket.rounds || {};
  const standings = bracket.standings || [];
  const maxRounds = bracket.max_rounds || 5;
  const currentRound = bracket.current_round || 1;

  // Calculate advancement cutoff (typically top 8 or top 16)
  const advancementCutoff = bracket.advancement_cutoff || Math.min(8, Math.floor(standings.length / 2));

  return (
    <div className={`swiss-bracket space-y-6 ${className}`}>
      {/* Header with format info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Swiss System Tournament
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {maxRounds} rounds • Top {advancementCutoff} advance to playoffs
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Current Round
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {currentRound} / {maxRounds}
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentRound / maxRounds) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('standings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'standings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Standings ({standings.length})
          </button>
          <button
            onClick={() => setActiveTab('rounds')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rounds'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Rounds ({Object.keys(rounds).length})
          </button>
          <button
            onClick={() => setActiveTab('pairings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pairings'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Pairings
          </button>
        </nav>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'standings' && (
        <SwissStandings 
          standings={standings} 
          advancementCutoff={advancementCutoff}
          navigateTo={navigateTo}
        />
      )}

      {activeTab === 'rounds' && (
        <SwissRounds 
          rounds={rounds}
          hoveredMatch={hoveredMatch}
          setHoveredMatch={setHoveredMatch}
          selectedMatch={selectedMatch}
          setSelectedMatch={setSelectedMatch}
          navigateTo={navigateTo}
          isAdmin={isAdmin}
          onMatchUpdate={onMatchUpdate}
          liveScores={liveScores}
        />
      )}

      {activeTab === 'pairings' && (
        <SwissPairings 
          standings={standings}
          currentRound={currentRound}
          maxRounds={maxRounds}
        />
      )}
    </div>
  );
}

// Swiss standings table component
function SwissStandings({ standings, advancementCutoff, navigateTo }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white">
          Current Standings
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Sorted by points, then by Buchholz score
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Record
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Points
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Buchholz
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                RD
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {standings.map((standing, index) => {
              const isAdvancing = index < advancementCutoff;
              const isEliminated = standing.losses >= 3; // Common elimination threshold
              const canAdvance = !isEliminated && (isAdvancing || index === advancementCutoff);
              
              return (
                <tr 
                  key={standing.team_id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    isAdvancing ? 'bg-green-50 dark:bg-green-900/20' : 
                    isEliminated ? 'bg-red-50 dark:bg-red-900/20 opacity-75' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        #{index + 1}
                      </span>
                      {isAdvancing && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Advancing
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 -m-1"
                      onClick={() => navigateTo && navigateTo('team-detail', { id: standing.team_id })}
                    >
                      <TeamLogo team={{ logo: standing.team_logo }} size="w-8 h-8" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {standing.team_name}
                        </div>
                        {standing.team_region && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {standing.team_region}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm">
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {standing.wins}
                      </span>
                      <span className="mx-1 text-gray-400">-</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        {standing.losses}
                      </span>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {standing.points}
                    </span>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                    {standing.buchholz ? standing.buchholz.toFixed(1) : '-'}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                    {standing.round_differential || 0 > 0 ? '+' : ''}{standing.round_differential || 0}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {isEliminated ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Eliminated
                      </span>
                    ) : isAdvancing ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Safe
                      </span>
                    ) : canAdvance ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Bubble
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        Active
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Swiss rounds component
function SwissRounds({ 
  rounds, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate,
  liveScores 
}) {
  const sortedRounds = Object.entries(rounds).sort(([a], [b]) => parseInt(a) - parseInt(b));

  return (
    <div className="space-y-8">
      {sortedRounds.map(([roundNum, matches]) => (
        <div key={roundNum} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                Round {roundNum}
              </h4>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {matches.length} matches
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matches.map((match, matchIndex) => (
                <SwissMatch
                  key={match.id || matchIndex}
                  match={match}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                  selectedMatch={selectedMatch}
                  setSelectedMatch={setSelectedMatch}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                  liveScores={liveScores}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Swiss match component
function SwissMatch({ 
  match, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate,
  liveScores 
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

  return (
    <div 
      className={`swiss-match border rounded-lg overflow-hidden transition-all cursor-pointer ${
        isLive ? 'border-red-500 shadow-lg animate-pulse' : 
        isHovered ? 'border-blue-500 shadow-md scale-105' :
        'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
      onClick={handleMatchClick}
      onMouseEnter={() => setHoveredMatch(match)}
      onMouseLeave={() => setHoveredMatch(null)}
    >
      {/* Match header */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Match {match.match_number || match.id}
          </span>
          {match.pairing_method && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              • {match.pairing_method}
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

      {/* Teams */}
      <div className="bg-white dark:bg-gray-900">
        {/* Team 1 */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 ${
          team1Won ? 'bg-green-50 dark:bg-green-900/20' : team2Won ? 'opacity-70' : ''
        }`}>
          <div 
            className="flex items-center space-x-2 flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1"
            onClick={(e) => handleTeamClick(effectiveMatch.team1, e)}
          >
            {effectiveMatch.team1 ? (
              <>
                <TeamLogo team={effectiveMatch.team1} size="w-6 h-6" />
                <div>
                  <div className={`text-sm font-medium ${
                    team1Won ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {effectiveMatch.team1.name}
                  </div>
                  {effectiveMatch.team1.record && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {effectiveMatch.team1.record}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
            )}
          </div>
          <span className={`text-lg font-bold ${
            team1Won ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {effectiveMatch.team1_score !== undefined ? effectiveMatch.team1_score : '-'}
          </span>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between p-3 ${
          team2Won ? 'bg-green-50 dark:bg-green-900/20' : team1Won ? 'opacity-70' : ''
        }`}>
          <div 
            className="flex items-center space-x-2 flex-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1"
            onClick={(e) => handleTeamClick(effectiveMatch.team2, e)}
          >
            {effectiveMatch.team2 ? (
              <>
                <TeamLogo team={effectiveMatch.team2} size="w-6 h-6" />
                <div>
                  <div className={`text-sm font-medium ${
                    team2Won ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-800 dark:text-gray-200'
                  }`}>
                    {effectiveMatch.team2.name}
                  </div>
                  {effectiveMatch.team2.record && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {effectiveMatch.team2.record}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
            )}
          </div>
          <span className={`text-lg font-bold ${
            team2Won ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {effectiveMatch.team2_score !== undefined ? effectiveMatch.team2_score : '-'}
          </span>
        </div>
      </div>

      {/* Match footer */}
      {match.scheduled_at && (
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(match.scheduled_at).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}

// Swiss pairings component (shows predicted/expected pairings)
function SwissPairings({ standings, currentRound, maxRounds }) {
  const generatePairings = () => {
    // Group teams by points for Swiss pairing
    const pointGroups = {};
    standings.forEach(team => {
      const points = team.points || 0;
      if (!pointGroups[points]) {
        pointGroups[points] = [];
      }
      pointGroups[points].push(team);
    });

    // Sort point groups by points (descending)
    const sortedGroups = Object.entries(pointGroups).sort(([a], [b]) => parseInt(b) - parseInt(a));
    
    const pairings = [];
    sortedGroups.forEach(([points, teams]) => {
      // Within each point group, pair teams
      const shuffled = [...teams].sort((a, b) => (a.buchholz || 0) - (b.buchholz || 0));
      for (let i = 0; i < shuffled.length - 1; i += 2) {
        pairings.push({
          team1: shuffled[i],
          team2: shuffled[i + 1],
          expected_points: parseInt(points)
        });
      }
      
      // Handle odd team in group (bye or pair with next group)
      if (shuffled.length % 2 === 1) {
        pairings.push({
          team1: shuffled[shuffled.length - 1],
          team2: null, // Bye
          expected_points: parseInt(points)
        });
      }
    });

    return pairings;
  };

  const pairings = generatePairings();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white">
          Expected Pairings for Round {currentRound + 1}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Based on current standings and Swiss pairing rules
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        {pairings.map((pairing, index) => (
          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-4 flex-1">
              {pairing.team1 && (
                <div className="flex items-center space-x-2">
                  <TeamLogo team={{ logo: pairing.team1.team_logo }} size="w-6 h-6" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {pairing.team1.team_name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({pairing.team1.wins}-{pairing.team1.losses})
                  </span>
                </div>
              )}
            </div>
            
            <div className="px-4">
              <span className="text-lg font-bold text-gray-500">VS</span>
            </div>
            
            <div className="flex items-center space-x-4 flex-1 justify-end">
              {pairing.team2 ? (
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({pairing.team2.wins}-{pairing.team2.losses})
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {pairing.team2.team_name}
                  </span>
                  <TeamLogo team={{ logo: pairing.team2.team_logo }} size="w-6 h-6" />
                </div>
              ) : (
                <span className="text-gray-400 italic">BYE</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SwissBracket;