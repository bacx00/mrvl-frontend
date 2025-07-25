import React, { useState, useEffect, useRef } from 'react';
import { TeamLogo, getCountryFlag } from '../utils/imageUtils';
import { subscribeEventUpdates } from '../lib/pusher.ts';
import '../styles/liquipedia-bracket.css';

function LiquipediaBracketVisualization({ bracket, event, navigateTo, isAdmin, onMatchUpdate, showPredictions = false }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [hoveredTeamPath, setHoveredTeamPath] = useState(null);
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bracketData, setBracketData] = useState(null);

  // Fetch bracket data if not provided
  useEffect(() => {
    if (bracket) {
      setBracketData(bracket);
      return;
    }

    if (!event?.id) return;

    const fetchBracket = async () => {
      try {
        const response = await fetch(`/api/events/${event.id}/bracket`);
        const data = await response.json();
        if (data.success && data.data.bracket) {
          setBracketData(data.data.bracket);
        }
      } catch (error) {
        console.error('Failed to fetch bracket:', error);
      }
    };

    fetchBracket();
  }, [bracket, event?.id]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!event?.id) return;

    const channel = subscribeEventUpdates(event.id.toString(), (data) => {
      if (data.type === 'match-updated' || data.type === 'bracket-updated') {
        console.log('Real-time bracket update:', data);
        // Refetch bracket data on updates
        if (data.bracket) {
          setBracketData(data.bracket);
        }
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

  if (!bracketData || !bracketData.matches) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-500">No bracket data available</div>
      </div>
    );
  }

  const bracketType = bracketData.type || 'double';
  const isDoubleElim = bracketType === 'double';

  // Check if event has Swiss stage
  const hasSwissStage = event?.format?.stages?.some(stage => stage.format?.includes('Swiss')) || false;
  const swissStage = bracketData.swiss_stage || null;

  return (
    <div ref={containerRef} className={`bracket-container ${isFullscreen ? 'fullscreen' : ''} bg-white dark:bg-gray-900`}>
      {/* Minimal Controls */}
      <div className="bracket-controls flex items-center justify-between mb-4 p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {event?.name}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Double Elimination • {event?.prize?.total ? `$${event.prize.total.toLocaleString()}` : ''}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            title="Zoom Out">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-gray-600 dark:text-gray-400">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            title="Zoom In">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white ml-2"
            title="Fullscreen">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Swiss Stage Results (if applicable) */}
      {hasSwissStage && swissStage && (
        <SwissStageResults swissStage={swissStage} />
      )}

      {/* Bracket Visualization */}
      <div 
        className="bracket-visualization overflow-x-auto overflow-y-hidden p-4"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        <div className="min-w-max">
          {/* Render bracket using Liquipedia format */}
          <LiquipediaBracketRenderer
            bracketData={bracketData}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        </div>
      </div>

      {/* Match Preview Tooltip */}
      {hoveredMatch && (
        <LiquipediaMatchPreview match={hoveredMatch} />
      )}
    </div>
  );
}

// Liquipedia Bracket Renderer - handles the new Liquipedia format
function LiquipediaBracketRenderer({
  bracketData,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  navigateTo,
  isAdmin,
  onMatchUpdate
}) {
  const { matches, rounds } = bracketData;
  
  // Separate upper and lower bracket rounds
  const upperRounds = rounds.filter(round => 
    round.matches.some(matchId => !matchId.startsWith('L') && matchId !== 'GF')
  );
  
  const lowerRounds = rounds.filter(round => 
    round.matches.some(matchId => matchId.startsWith('L'))
  );
  
  const grandFinalRound = rounds.find(round => 
    round.matches.includes('GF')
  );

  return (
    <div className="liquipedia-bracket-renderer">
      {/* Upper Bracket */}
      {upperRounds.length > 0 && (
        <LiquipediaBracketSection
          title="Upper Bracket"
          rounds={upperRounds}
          matches={matches}
          hoveredMatch={hoveredMatch}
          setHoveredMatch={setHoveredMatch}
          hoveredTeamPath={hoveredTeamPath}
          setHoveredTeamPath={setHoveredTeamPath}
          navigateTo={navigateTo}
          isAdmin={isAdmin}
          onMatchUpdate={onMatchUpdate}
        />
      )}

      {/* Lower Bracket */}
      {lowerRounds.length > 0 && (
        <div className="mt-8">
          <LiquipediaBracketSection
            title="Lower Bracket"
            rounds={lowerRounds}
            matches={matches}
            isLowerBracket={true}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        </div>
      )}

      {/* Grand Final */}
      {grandFinalRound && (
        <div className="mt-8">
          <LiquipediaBracketSection
            title="Grand Final"
            rounds={[grandFinalRound]}
            matches={matches}
            isGrandFinal={true}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        </div>
      )}
    </div>
  );
}

// Swiss Stage Results Component
function SwissStageResults({ swissStage }) {
  const standings = swissStage.standings || [];
  const topTeams = standings.slice(0, 4);
  const bottomTeams = standings.slice(4, 8);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Swiss Stage Results</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-2">Upper Bracket Qualification</h5>
          <div className="space-y-1">
            {topTeams.map((team, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium text-green-600 dark:text-green-400">
                  {idx + 1}. {team.name}
                </span>
                <span className="text-gray-500">{team.wins}-{team.losses}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h5 className="text-xs text-gray-500 dark:text-gray-400 mb-2">Lower Bracket</h5>
          <div className="space-y-1">
            {bottomTeams.map((team, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="font-medium text-gray-600 dark:text-gray-300">
                  {idx + 5}. {team.name}
                </span>
                <span className="text-gray-500">{team.wins}-{team.losses}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Liquipedia Bracket Section Component
function LiquipediaBracketSection({ 
  title, 
  rounds, 
  matches,
  isLowerBracket = false,
  isGrandFinal = false,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  navigateTo,
  isAdmin,
  onMatchUpdate
}) {
  return (
    <div className="bracket-section">
      <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wider">
        {title}
      </h4>
      
      <div className="flex items-start">
        {rounds.map((round, roundIndex) => (
          <LiquipediaBracketRound
            key={`${isLowerBracket ? 'lower' : 'upper'}-${roundIndex}`}
            round={round}
            roundIndex={roundIndex}
            totalRounds={rounds.length}
            matches={matches}
            isLowerBracket={isLowerBracket}
            isGrandFinal={isGrandFinal}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
          />
        ))}
      </div>
    </div>
  );
}

// Liquipedia-style Bracket Round
function LiquipediaBracketRound({
  round,
  roundIndex,
  totalRounds,
  matches,
  isLowerBracket,
  isGrandFinal,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  navigateTo,
  isAdmin,
  onMatchUpdate
}) {
  // Calculate round name
  const getRoundName = () => {
    if (isGrandFinal) return 'Grand Final';
    if (round.name) return round.name;
    
    if (isLowerBracket) {
      const lowerRoundNames = ['Lower Round 1', 'Lower Quarterfinals', 'Lower Semifinals', 'Lower Final'];
      return lowerRoundNames[roundIndex] || `Lower Round ${roundIndex + 1}`;
    }
    
    const upperRoundNames = ['Upper Semifinals', 'Upper Final'];
    return upperRoundNames[roundIndex] || `Round ${roundIndex + 1}`;
  };

  // Calculate match spacing - more compact than VLR style
  const getMatchSpacing = () => {
    if (isLowerBracket) {
      // Lower bracket has variable spacing
      if (roundIndex === 0) return 60; // LR1 has 4 matches
      if (roundIndex === 1) return 120; // LR Quarters has 2 matches
      if (roundIndex === 2) return 120; // LR Semis has 2 matches
      return 120; // LR Final has 1 match
    }
    // Upper bracket spacing
    if (roundIndex === 0) return 120; // Semifinals
    return 0; // Final
  };

  const matchSpacing = getMatchSpacing();

  return (
    <div className="bracket-round mr-12" style={{ minWidth: '180px' }}>
      {/* Round Header */}
      <div className="mb-3">
        <h5 className="text-xs font-medium text-gray-500 dark:text-gray-400">
          {getRoundName()}
        </h5>
        {round.start_date && (
          <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {new Date(round.start_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            })}
          </div>
        )}
      </div>

      {/* Matches */}
      <div className="relative">
        {round.matches.map((matchId, matchIndex) => {
          const match = matches[matchId];
          if (!match) return null;
          
          return (
            <div
              key={matchId}
              style={{ 
                marginBottom: matchIndex < round.matches.length - 1 ? `${matchSpacing}px` : 0,
                position: 'relative'
              }}
            >
              <LiquipediaBracketMatch
                match={match}
                roundIndex={roundIndex}
                matchIndex={matchIndex}
                totalRounds={totalRounds}
                isLowerBracket={isLowerBracket}
                isGrandFinal={isGrandFinal}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                hoveredTeamPath={hoveredTeamPath}
                setHoveredTeamPath={setHoveredTeamPath}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
              />
              
              {/* Match Connectors */}
              {roundIndex < totalRounds - 1 && !isGrandFinal && (
                <LiquipediaMatchConnector
                  roundIndex={roundIndex}
                  matchIndex={matchIndex}
                  totalMatches={round.matches.length}
                  isLowerBracket={isLowerBracket}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Liquipedia-style Bracket Match
function LiquipediaBracketMatch({
  match,
  roundIndex,
  matchIndex,
  totalRounds,
  isLowerBracket,
  isGrandFinal,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  navigateTo,
  isAdmin,
  onMatchUpdate
}) {
  const isCompleted = match.finished;
  const isLive = match.status === 'live' || match.status === 'ongoing';
  const isUpcoming = !match.finished && !isLive;
  
  const team1Won = isCompleted && match.winner === 1;
  const team2Won = isCompleted && match.winner === 2;

  // Get match format
  const getMatchFormat = () => {
    if (isGrandFinal) return 'Bo7';
    if (match.bestof) return `Bo${match.bestof}`;
    if (isLowerBracket) {
      if (roundIndex === 0) return 'Bo3'; // LR1
      return 'Bo5'; // Later rounds
    }
    return 'Bo5'; // Upper bracket
  };

  return (
    <div
      className={`bracket-match relative ${
        hoveredMatch?.id === match.id ? 'z-20' : 'z-10'
      }`}
      onMouseEnter={() => {
        setHoveredMatch(match);
        if (match.team1) setHoveredTeamPath(match.team1.id);
        if (match.team2) setHoveredTeamPath(match.team2.id);
      }}
      onMouseLeave={() => {
        setHoveredMatch(null);
        setHoveredTeamPath(null);
      }}
    >
      <div
        className={`
          bg-white dark:bg-gray-800 border rounded
          transition-all duration-200
          ${isLive ? 'border-green-500 shadow-sm' : 'border-gray-300 dark:border-gray-600'}
          ${hoveredMatch?.id === match.id ? 'shadow-md border-gray-400 dark:border-gray-500' : ''}
          ${match.id ? 'cursor-pointer' : 'cursor-default'}
        `}
        onClick={() => match.id && navigateTo && navigateTo('match-detail', { id: match.id })}
        style={{ width: '180px' }}
      >
        {/* Match Header */}
        {(isLive || match.match_number || getMatchFormat() !== 'Bo3') && (
          <div className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getMatchFormat()}
            </span>
            {isLive && (
              <div className="flex items-center">
                <span className="relative flex h-1.5 w-1.5 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
              </div>
            )}
          </div>
        )}

        {/* Teams */}
        <div>
          {/* Team 1 */}
          <LiquipediaTeamRow
            team={match.opponent1}
            score={match.opponent1?.score}
            isWinner={team1Won}
            isLoser={team2Won}
            isFirst={true}
          />

          {/* Team 2 */}
          <LiquipediaTeamRow
            team={match.opponent2}
            score={match.opponent2?.score}
            isWinner={team2Won}
            isLoser={team1Won}
            isFirst={false}
          />
        </div>

        {/* Match Time for upcoming matches */}
        {match.date && isUpcoming && (
          <div className="px-2 py-1 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(match.date).toLocaleTimeString('en-US', {
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

// Liquipedia Team Row Component
function LiquipediaTeamRow({ team, score, isWinner, isLoser, isFirst }) {
  return (
    <div className={`
      flex items-center justify-between px-2 py-1.5
      ${isFirst ? 'border-b border-gray-200 dark:border-gray-600' : ''}
      ${isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''}
      ${isLoser ? 'opacity-60' : ''}
    `}>
      <div className="flex items-center space-x-1.5 flex-1 min-w-0">
        {team ? (
          <>
            <TeamLogo team={team} size="w-4 h-4" />
            <span className={`text-sm truncate ${
              isWinner ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {team.short_name || team.name}
            </span>
          </>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic text-sm">TBD</span>
        )}
      </div>
      
      {/* Score */}
      <div className={`
        text-sm font-bold min-w-[20px] text-center
        ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
      `}>
        {score !== null && score !== undefined ? score : '-'}
      </div>
    </div>
  );
}

// Liquipedia Match Connector
function LiquipediaMatchConnector({ roundIndex, matchIndex, totalMatches, isLowerBracket }) {
  const isLastMatch = matchIndex === totalMatches - 1;
  const connectToNext = matchIndex % 2 === 0;
  
  // Special handling for lower bracket connections
  if (isLowerBracket) {
    // Lower bracket has different connection patterns
    if (roundIndex === 0) {
      // LR1: 4 matches connecting to 2 in next round
      return (
        <svg
          className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none"
          width="48"
          height="120"
          style={{ zIndex: 5 }}
        >
          <line className="bracket-connector" x1="0" y1="50%" x2="24" y2="50%" />
          {connectToNext && !isLastMatch && (
            <>
              <line className="bracket-connector" x1="24" y1="50%" x2="24" y2="110%" />
              <line className="bracket-connector" x1="24" y1="80%" x2="48" y2="80%" />
            </>
          )}
        </svg>
      );
    }
  }
  
  // Standard connector
  return (
    <svg
      className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none"
      width="48"
      height="200"
      style={{ zIndex: 5 }}
    >
      {/* Horizontal line from match */}
      <line
        x1="0"
        y1="50%"
        x2="24"
        y2="50%"
        stroke="#d1d5db"
        strokeWidth="1"
      />
      
      {/* Vertical connector */}
      {!isLastMatch && connectToNext && (
        <line
          className="bracket-connector"
          x1="24"
          y1="50%"
          x2="24"
          y2="170%"
        />
      )}
      
      {/* Horizontal line to next round */}
      {connectToNext && (
        <line
          className="bracket-connector"
          x1="24"
          y1={isLastMatch ? "50%" : "110%"}
          x2="48"
          y2={isLastMatch ? "50%" : "110%"}
        />
      )}
    </svg>
  );
}

// Liquipedia Match Preview
function LiquipediaMatchPreview({ match }) {
  if (!match) return null;
  
  return (
    <div className="fixed z-50 pointer-events-none" style={{ bottom: '20px', right: '20px' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 min-w-[280px]">
        <div className="text-xs font-semibold text-gray-900 dark:text-white mb-2">
          Match Details ({match.id})
        </div>
        
        {/* Teams */}
        <div className="space-y-1 mb-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {match.opponent1?.name || 'TBD'}
            </span>
            <span className="text-sm font-bold">
              {match.opponent1?.score ?? '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {match.opponent2?.name || 'TBD'}
            </span>
            <span className="text-sm font-bold">
              {match.opponent2?.score ?? '-'}
            </span>
          </div>
        </div>
        
        {/* Match Info */}
        <div className="space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
          {match.date && (
            <div>{new Date(match.date).toLocaleString()}</div>
          )}
          {match.bestof && (
            <div>Format: Bo{match.bestof}</div>
          )}
          <div>Status: {match.finished ? 'Completed' : 'Upcoming'}</div>
        </div>
      </div>
    </div>
  );
}

export default LiquipediaBracketVisualization;