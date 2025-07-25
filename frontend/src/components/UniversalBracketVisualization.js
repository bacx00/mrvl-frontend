import React, { useState, useEffect, useRef } from 'react';
import { TeamLogo, getCountryFlag } from '../utils/imageUtils';
import { subscribeEventUpdates } from '../lib/pusher.ts';

// Import specific visualizations for each format
import VLRBracketVisualization from './VLRBracketVisualization';
import LiquipediaBracketVisualization from './LiquipediaBracketVisualization';

function UniversalBracketVisualization({ bracket, event, navigateTo, isAdmin, onMatchUpdate, showPredictions = false }) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Determine bracket format
  const format = event?.format || bracket?.type || 'single_elimination';

  // Subscribe to real-time updates
  useEffect(() => {
    if (!event?.id) return;

    const channel = subscribeEventUpdates(event.id.toString(), (data) => {
      if (data.type === 'match-updated' || data.type === 'bracket-updated') {
        console.log('Real-time bracket update:', data);
      }
    });

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
    };
  }, [event?.id]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle zoom
  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Render based on format
  const renderBracket = () => {
    // Check if this is a Marvel Rivals tournament that should use Liquipedia style
    const isMarvelRivalsInvitational = event?.name?.toLowerCase().includes('marvel rivals invitational');
    
    switch (format) {
      case 'single_elimination':
      case 'double_elimination':
        // Use Liquipedia style for Marvel Rivals Invitational, VLR for others
        if (isMarvelRivalsInvitational) {
          return (
            <LiquipediaBracketVisualization
              bracket={bracket}
              event={event}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              showPredictions={showPredictions}
            />
          );
        }
        return (
          <VLRBracketVisualization
            bracket={bracket}
            event={event}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            showPredictions={showPredictions}
          />
        );

      case 'round_robin':
        return (
          <RoundRobinVisualization
            bracket={bracket}
            event={event}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        );

      case 'swiss':
        return (
          <SwissVisualization
            bracket={bracket}
            event={event}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        );

      case 'group_stage':
        return (
          <GroupStageVisualization
            bracket={bracket}
            event={event}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        );

      default:
        return <div className="text-center p-8">Unsupported bracket format: {format}</div>;
    }
  };

  return (
    <div ref={containerRef} className="bracket-container bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Bracket Controls */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {event?.name || 'Tournament Bracket'}
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {format.replace(/_/g, ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            title="Zoom Out (-)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
            </svg>
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            title="Zoom In (+)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ml-2"
            title="Fullscreen (F)">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bracket Content */}
      <div 
        className="overflow-auto"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        {renderBracket()}
      </div>
    </div>
  );
}

// Round Robin Visualization Component
function RoundRobinVisualization({ bracket, event, navigateTo, isAdmin, onMatchUpdate }) {
  const matches = bracket?.rounds?.[0]?.matches || [];
  
  // Group matches by teams
  const teamMatches = {};
  matches.forEach(match => {
    const team1Name = match.team1?.name || 'TBD';
    const team2Name = match.team2?.name || 'TBD';
    
    if (!teamMatches[team1Name]) teamMatches[team1Name] = [];
    if (!teamMatches[team2Name]) teamMatches[team2Name] = [];
    
    teamMatches[team1Name].push(match);
    teamMatches[team2Name].push(match);
  });

  return (
    <div className="p-8">
      <h3 className="text-lg font-semibold mb-4">Round Robin Matches</h3>
      
      {/* Match Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match, index) => (
          <MatchCard
            key={match.id || index}
            match={match}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            navigateTo={navigateTo}
          />
        ))}
      </div>

      {/* Standings Table */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Standings</h3>
        <RoundRobinStandings matches={matches} />
      </div>
    </div>
  );
}

// Swiss Visualization Component
function SwissVisualization({ bracket, event, navigateTo, isAdmin, onMatchUpdate }) {
  const rounds = bracket?.rounds || [];
  const currentRound = event?.current_round || 1;

  return (
    <div className="p-8">
      <h3 className="text-lg font-semibold mb-4">Swiss System - Round {currentRound}</h3>
      
      {/* Current Round Matches */}
      {rounds.map((round, roundIndex) => (
        <div key={roundIndex} className="mb-8">
          <h4 className="text-md font-medium mb-3">Round {round.round || roundIndex + 1}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {round.matches.map((match, index) => (
              <MatchCard
                key={match.id || index}
                match={match}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                navigateTo={navigateTo}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Swiss Standings */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Swiss Standings</h3>
        <SwissStandings event={event} />
      </div>
    </div>
  );
}

// Group Stage Visualization Component
function GroupStageVisualization({ bracket, event, navigateTo, isAdmin, onMatchUpdate }) {
  // Group matches by group
  const groups = {};
  
  if (bracket?.groups) {
    // New structure with groups object
    Object.entries(bracket.groups).forEach(([groupName, groupData]) => {
      groups[groupName] = groupData;
    });
  } else if (bracket?.rounds) {
    // Fallback to rounds structure
    bracket.rounds.forEach(round => {
      round.matches.forEach(match => {
        const groupName = match.bracket_type || 'group_a';
        if (!groups[groupName]) {
          groups[groupName] = { matches: [] };
        }
        groups[groupName].matches.push(match);
      });
    });
  }

  return (
    <div className="p-8">
      <h3 className="text-lg font-semibold mb-6">Group Stage</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Object.entries(groups).map(([groupName, groupData]) => (
          <div key={groupName} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h4 className="text-md font-semibold mb-4 text-blue-600 dark:text-blue-400">
              {groupName.replace('_', ' ').toUpperCase()}
            </h4>
            
            {/* Group Matches */}
            <div className="space-y-3 mb-6">
              {(groupData.matches || []).map((match, index) => (
                <MatchCard
                  key={match.id || index}
                  match={match}
                  isAdmin={isAdmin}
                  onMatchUpdate={onMatchUpdate}
                  navigateTo={navigateTo}
                  compact={true}
                />
              ))}
            </div>
            
            {/* Group Standings */}
            <GroupStandings groupName={groupName} matches={groupData.matches || []} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Match Card Component
function MatchCard({ match, isAdmin, onMatchUpdate, navigateTo, compact = false }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'live': return 'text-red-600';
      case 'upcoming': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const handleClick = () => {
    if (navigateTo && match.id) {
      navigateTo(`/match/${match.id}`);
    }
  };

  return (
    <div 
      className={`bg-gray-50 dark:bg-gray-900 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${
        compact ? 'p-3' : ''
      }`}
      onClick={handleClick}
    >
      {/* Match Status */}
      <div className="flex justify-between items-center mb-2">
        <span className={`text-xs font-medium ${getStatusColor(match.status)}`}>
          {match.status?.toUpperCase()}
        </span>
        {match.scheduled_at && (
          <span className="text-xs text-gray-500">
            {new Date(match.scheduled_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {/* Team 1 */}
        <div className={`flex items-center justify-between ${
          match.status === 'completed' && match.team1?.score < match.team2?.score ? 'opacity-60' : ''
        }`}>
          <div className="flex items-center space-x-2">
            <TeamLogo 
              src={match.team1?.logo} 
              alt={match.team1?.name} 
              className={compact ? "w-6 h-6" : "w-8 h-8"} 
            />
            <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
              {match.team1?.name || 'TBD'}
            </span>
          </div>
          <span className={`font-bold ${compact ? 'text-sm' : 'text-lg'}`}>
            {match.team1?.score || 0}
          </span>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between ${
          match.status === 'completed' && match.team2?.score < match.team1?.score ? 'opacity-60' : ''
        }`}>
          <div className="flex items-center space-x-2">
            <TeamLogo 
              src={match.team2?.logo} 
              alt={match.team2?.name} 
              className={compact ? "w-6 h-6" : "w-8 h-8"} 
            />
            <span className={`font-medium ${compact ? 'text-sm' : ''}`}>
              {match.team2?.name || 'TBD'}
            </span>
          </div>
          <span className={`font-bold ${compact ? 'text-sm' : 'text-lg'}`}>
            {match.team2?.score || 0}
          </span>
        </div>
      </div>

      {/* Admin Controls */}
      {isAdmin && onMatchUpdate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMatchUpdate(match);
          }}
          className="mt-3 w-full bg-blue-600 text-white text-sm py-1 px-2 rounded hover:bg-blue-700"
        >
          Update Match
        </button>
      )}
    </div>
  );
}

// Round Robin Standings Component
function RoundRobinStandings({ matches }) {
  // Calculate standings from matches
  const standings = {};
  
  matches.forEach(match => {
    if (match.status !== 'completed') return;
    
    const team1 = match.team1?.name;
    const team2 = match.team2?.name;
    
    if (!team1 || !team2) return;
    
    // Initialize teams
    if (!standings[team1]) standings[team1] = { wins: 0, losses: 0, mapWins: 0, mapLosses: 0 };
    if (!standings[team2]) standings[team2] = { wins: 0, losses: 0, mapWins: 0, mapLosses: 0 };
    
    // Update standings
    const score1 = match.team1?.score || 0;
    const score2 = match.team2?.score || 0;
    
    if (score1 > score2) {
      standings[team1].wins++;
      standings[team2].losses++;
    } else {
      standings[team2].wins++;
      standings[team1].losses++;
    }
    
    standings[team1].mapWins += score1;
    standings[team1].mapLosses += score2;
    standings[team2].mapWins += score2;
    standings[team2].mapLosses += score1;
  });
  
  // Convert to array and sort
  const sortedStandings = Object.entries(standings)
    .map(([team, stats]) => ({ team, ...stats }))
    .sort((a, b) => {
      // Sort by wins, then by map difference
      if (a.wins !== b.wins) return b.wins - a.wins;
      return (b.mapWins - b.mapLosses) - (a.mapWins - a.mapLosses);
    });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-4">Team</th>
            <th className="text-center py-2 px-4">W-L</th>
            <th className="text-center py-2 px-4">Maps</th>
            <th className="text-center py-2 px-4">Diff</th>
          </tr>
        </thead>
        <tbody>
          {sortedStandings.map(({ team, wins, losses, mapWins, mapLosses }, index) => (
            <tr key={team} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-2 px-4">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{index + 1}.</span>
                  <span>{team}</span>
                </div>
              </td>
              <td className="text-center py-2 px-4">{wins}-{losses}</td>
              <td className="text-center py-2 px-4">{mapWins}-{mapLosses}</td>
              <td className="text-center py-2 px-4">
                <span className={mapWins - mapLosses >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {mapWins - mapLosses >= 0 ? '+' : ''}{mapWins - mapLosses}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Swiss Standings Component
function SwissStandings({ event }) {
  // Placeholder - would need to fetch from event standings
  return (
    <div className="text-center text-gray-500 py-8">
      Swiss standings will be displayed here
    </div>
  );
}

// Group Standings Component
function GroupStandings({ groupName, matches }) {
  // Similar to round robin but for a specific group
  const standings = {};
  
  matches.forEach(match => {
    if (match.status !== 'completed') return;
    
    const team1 = match.team1?.name;
    const team2 = match.team2?.name;
    
    if (!team1 || !team2) return;
    
    if (!standings[team1]) standings[team1] = { played: 0, wins: 0, losses: 0, points: 0 };
    if (!standings[team2]) standings[team2] = { played: 0, wins: 0, losses: 0, points: 0 };
    
    standings[team1].played++;
    standings[team2].played++;
    
    const score1 = match.team1?.score || 0;
    const score2 = match.team2?.score || 0;
    
    if (score1 > score2) {
      standings[team1].wins++;
      standings[team1].points += 3;
      standings[team2].losses++;
    } else {
      standings[team2].wins++;
      standings[team2].points += 3;
      standings[team1].losses++;
    }
  });
  
  const sortedStandings = Object.entries(standings)
    .map(([team, stats]) => ({ team, ...stats }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="text-sm">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700 text-xs">
            <th className="text-left py-1">Team</th>
            <th className="text-center py-1">P</th>
            <th className="text-center py-1">W</th>
            <th className="text-center py-1">L</th>
            <th className="text-center py-1">Pts</th>
          </tr>
        </thead>
        <tbody>
          {sortedStandings.map(({ team, played, wins, losses, points }, index) => (
            <tr key={team} className="border-b border-gray-100 dark:border-gray-800">
              <td className="py-1">
                <span className={index < 2 ? 'font-semibold text-green-600' : ''}>{team}</span>
              </td>
              <td className="text-center py-1">{played}</td>
              <td className="text-center py-1">{wins}</td>
              <td className="text-center py-1">{losses}</td>
              <td className="text-center py-1 font-semibold">{points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UniversalBracketVisualization;