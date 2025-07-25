import React, { useState, useEffect, useRef, useMemo } from 'react';
import { TeamLogo, getCountryFlag } from '../utils/imageUtils';
import { subscribeEventUpdates } from '../lib/pusher.ts';

function VLRBracketVisualization({ bracket, event, navigateTo, isAdmin, onMatchUpdate, showPredictions = false }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [hoveredTeamPath, setHoveredTeamPath] = useState(null);
  const [predictions, setPredictions] = useState({});
  const [communityPredictions, setCommunityPredictions] = useState({});
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!event?.id) return;

    const channel = subscribeEventUpdates(event.id.toString(), (data) => {
      if (data.type === 'match-updated' || data.type === 'bracket-updated') {
        // Bracket updates will be handled by parent component
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '+' || e.key === '=') handleZoom(0.1);
      if (e.key === '-') handleZoom(-0.1);
      if (e.key === 'f') toggleFullscreen();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (!bracket || !bracket.rounds) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-500">No bracket data available</div>
      </div>
    );
  }

  const bracketType = bracket.type || 'single_elimination';
  const isDoubleElim = bracketType === 'double_elimination';

  return (
    <div ref={containerRef} className={`bracket-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Controls */}
      <div className="bracket-controls flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10 p-4 border-b dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {event?.name} Bracket
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {bracketType.replace('_', ' ').toUpperCase()}
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

      {/* Bracket Visualization */}
      <div 
        className="bracket-visualization overflow-x-auto overflow-y-hidden"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        <div className="min-w-max p-8">
          {/* Upper Bracket */}
          <BracketSection
            title="UPPER BRACKET"
            rounds={bracket.rounds}
            bracket={bracket}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            predictions={predictions}
            setPredictions={setPredictions}
            communityPredictions={communityPredictions}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            showPredictions={showPredictions}
          />

          {/* Lower Bracket */}
          {isDoubleElim && bracket.lower_bracket && (
            <div className="mt-16">
              <BracketSection
                title="LOWER BRACKET"
                rounds={bracket.lower_bracket}
                bracket={bracket}
                isLowerBracket={true}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                hoveredTeamPath={hoveredTeamPath}
                setHoveredTeamPath={setHoveredTeamPath}
                predictions={predictions}
                setPredictions={setPredictions}
                communityPredictions={communityPredictions}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                showPredictions={showPredictions}
              />
            </div>
          )}

          {/* Grand Finals */}
          {isDoubleElim && bracket.grand_final && (
            <div className="mt-16">
              <BracketSection
                title="GRAND FINAL"
                rounds={[{ matches: [bracket.grand_final] }]}
                bracket={bracket}
                isGrandFinal={true}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                hoveredTeamPath={hoveredTeamPath}
                setHoveredTeamPath={setHoveredTeamPath}
                predictions={predictions}
                setPredictions={setPredictions}
                communityPredictions={communityPredictions}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                showPredictions={showPredictions}
              />
            </div>
          )}
        </div>
      </div>

      {/* Match Preview Tooltip */}
      {hoveredMatch && (
        <MatchPreview match={hoveredMatch} communityPredictions={communityPredictions} />
      )}
    </div>
  );
}

// Bracket Section Component
function BracketSection({ 
  title, 
  rounds, 
  bracket,
  isLowerBracket = false,
  isGrandFinal = false,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  predictions,
  setPredictions,
  communityPredictions,
  navigateTo,
  isAdmin,
  onMatchUpdate,
  showPredictions
}) {
  return (
    <div className="bracket-section">
      {title && (
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-6 tracking-wider">
          {title}
        </h4>
      )}
      
      <div className="flex items-start space-x-8">
        {rounds.map((round, roundIndex) => (
          <VLRBracketRound
            key={`${isLowerBracket ? 'lower' : 'upper'}-${roundIndex}`}
            round={round}
            roundIndex={roundIndex}
            totalRounds={rounds.length}
            bracket={bracket}
            isLowerBracket={isLowerBracket}
            isGrandFinal={isGrandFinal}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            predictions={predictions}
            setPredictions={setPredictions}
            communityPredictions={communityPredictions}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            showPredictions={showPredictions}
          />
        ))}
      </div>
    </div>
  );
}

// VLR-style Bracket Round
function VLRBracketRound({
  round,
  roundIndex,
  totalRounds,
  bracket,
  isLowerBracket,
  isGrandFinal,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  predictions,
  setPredictions,
  communityPredictions,
  navigateTo,
  isAdmin,
  onMatchUpdate,
  showPredictions
}) {
  // Calculate round name
  const getRoundName = () => {
    if (isGrandFinal) return 'GRAND FINAL';
    if (round.name) return round.name.toUpperCase();
    
    const upperRoundNames = ['ROUND OF 32', 'ROUND OF 16', 'QUARTERFINALS', 'SEMIFINALS', 'UPPER FINAL'];
    const lowerRoundNames = ['LOWER ROUND 1', 'LOWER ROUND 2', 'LOWER ROUND 3', 'LOWER ROUND 4', 'LOWER FINAL'];
    
    if (isLowerBracket) {
      return lowerRoundNames[roundIndex] || `LOWER ROUND ${roundIndex + 1}`;
    }
    
    const roundsFromEnd = totalRounds - roundIndex - 1;
    return upperRoundNames[upperRoundNames.length - roundsFromEnd - 1] || `ROUND ${roundIndex + 1}`;
  };

  // Calculate match spacing
  const matchSpacing = isLowerBracket ? 120 : 140 * Math.pow(2, roundIndex);

  return (
    <div className="bracket-round" style={{ minWidth: '320px' }}>
      {/* Round Header */}
      <div className="text-center mb-6">
        <h5 className="text-xs font-bold text-gray-600 dark:text-gray-400 tracking-wider">
          {getRoundName()}
        </h5>
        {round.start_date && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
      <div className="relative">
        {round.matches.map((match, matchIndex) => (
          <div
            key={match.id || `match-${matchIndex}`}
            style={{ 
              marginBottom: matchIndex < round.matches.length - 1 ? `${matchSpacing}px` : 0,
              position: 'relative'
            }}
          >
            <VLRBracketMatch
              match={match}
              bracket={bracket}
              roundIndex={roundIndex}
              matchIndex={matchIndex}
              totalRounds={totalRounds}
              isLowerBracket={isLowerBracket}
              isGrandFinal={isGrandFinal}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              hoveredTeamPath={hoveredTeamPath}
              setHoveredTeamPath={setHoveredTeamPath}
              predictions={predictions}
              setPredictions={setPredictions}
              communityPredictions={communityPredictions}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              showPredictions={showPredictions}
            />
            
            {/* Match Connectors */}
            {roundIndex < totalRounds - 1 && !isGrandFinal && (
              <MatchConnector
                roundIndex={roundIndex}
                matchIndex={matchIndex}
                totalMatches={round.matches.length}
                isLowerBracket={isLowerBracket}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// VLR-style Bracket Match
function VLRBracketMatch({
  match,
  bracket,
  roundIndex,
  matchIndex,
  totalRounds,
  isLowerBracket,
  isGrandFinal,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  predictions,
  setPredictions,
  communityPredictions,
  navigateTo,
  isAdmin,
  onMatchUpdate,
  showPredictions
}) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live' || match.status === 'ongoing';
  const isUpcoming = match.status === 'upcoming' || match.status === 'scheduled';
  
  const team1Won = isCompleted && match.team1_score > match.team2_score;
  const team2Won = isCompleted && match.team2_score > match.team1_score;

  // Handle predictions
  const handlePrediction = (teamNumber) => {
    if (!showPredictions || isLive || isCompleted) return;
    
    setPredictions(prev => ({
      ...prev,
      [match.id]: teamNumber
    }));
  };

  // Handle score update for admins
  const handleScoreClick = (e, teamNumber) => {
    e.stopPropagation();
    if (!isAdmin || !onMatchUpdate || !isUpcoming) return;
    
    const newScore = prompt(`Enter score for ${teamNumber === 1 ? match.team1?.name : match.team2?.name}:`, 
      teamNumber === 1 ? match.team1_score : match.team2_score);
    
    if (newScore !== null) {
      onMatchUpdate(match.id, {
        [`team${teamNumber}_score`]: parseInt(newScore) || 0
      });
    }
  };

  return (
    <div
      className={`bracket-match relative transition-all duration-200 ${
        hoveredMatch?.id === match.id ? 'z-20' : 'z-10'
      }`}
      onMouseEnter={() => {
        setHoveredMatch(match);
        // Set team path for highlighting
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
          border rounded-lg overflow-hidden cursor-pointer
          transition-all duration-200 transform
          ${isLive ? 'border-red-500 shadow-lg scale-105' : 'border-gray-300 dark:border-gray-600'}
          ${hoveredMatch?.id === match.id ? 'shadow-xl scale-105' : 'hover:shadow-md'}
          ${match.id ? 'cursor-pointer' : 'cursor-default'}
        `}
        onClick={() => match.id && navigateTo && navigateTo('match-detail', { id: match.id })}
      >
        {/* Match Status Header */}
        {(isLive || match.match_number || isGrandFinal) && (
          <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {isGrandFinal ? 'GRAND FINAL' : `Match ${match.match_number || match.id}`}
              {match.best_of && ` • BO${match.best_of}`}
            </span>
            {isLive && (
              <div className="flex items-center space-x-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-600 dark:text-red-400">LIVE</span>
              </div>
            )}
          </div>
        )}

        {/* Teams */}
        <div className="bg-white dark:bg-gray-900">
          {/* Team 1 */}
          <TeamRow
            team={match.team1}
            score={match.team1_score}
            isWinner={team1Won}
            isLoser={team2Won}
            predictions={predictions}
            matchId={match.id}
            teamNumber={1}
            onPrediction={() => handlePrediction(1)}
            onScoreClick={(e) => handleScoreClick(e, 1)}
            showPredictions={showPredictions}
            isAdmin={isAdmin}
            isLive={isLive}
            isCompleted={isCompleted}
            communityPrediction={communityPredictions[match.id]?.team1_percentage}
          />

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700"></div>

          {/* Team 2 */}
          <TeamRow
            team={match.team2}
            score={match.team2_score}
            isWinner={team2Won}
            isLoser={team1Won}
            predictions={predictions}
            matchId={match.id}
            teamNumber={2}
            onPrediction={() => handlePrediction(2)}
            onScoreClick={(e) => handleScoreClick(e, 2)}
            showPredictions={showPredictions}
            isAdmin={isAdmin}
            isLive={isLive}
            isCompleted={isCompleted}
            communityPrediction={communityPredictions[match.id]?.team2_percentage}
          />
        </div>

        {/* Match Time */}
        {match.scheduled_at && !isLive && !isCompleted && (
          <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(match.scheduled_at).toLocaleTimeString('en-US', {
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
  predictions,
  matchId,
  teamNumber,
  onPrediction,
  onScoreClick,
  showPredictions,
  isAdmin,
  isLive,
  isCompleted,
  communityPrediction
}) {
  const isPredicted = predictions[matchId] === teamNumber;
  
  return (
    <div 
      className={`
        flex items-center justify-between p-3 transition-colors
        ${isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''}
        ${isLoser ? 'opacity-60' : ''}
        ${showPredictions && !isLive && !isCompleted ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
        ${isPredicted ? 'border-l-4 border-blue-500' : ''}
      `}
      onClick={showPredictions && !isLive && !isCompleted ? onPrediction : undefined}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        {team ? (
          <>
            <TeamLogo team={team} size="w-6 h-6" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className={`font-medium truncate ${
                  isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {team.name}
                </span>
                {team.country && (
                  <span className="text-base" title={team.country}>
                    {getCountryFlag(team.country)}
                  </span>
                )}
              </div>
              {showPredictions && communityPrediction && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {communityPrediction}% picked
                </div>
              )}
            </div>
          </>
        ) : (
          <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
        )}
      </div>
      
      {/* Score */}
      <div 
        className={`
          ml-4 text-lg font-bold min-w-[32px] text-center
          ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
          ${isAdmin && !isCompleted ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 px-2 py-1 -my-1 rounded' : ''}
        `}
        onClick={onScoreClick}
      >
        {score !== null && score !== undefined ? score : '-'}
      </div>
    </div>
  );
}

// Match Connector SVG
function MatchConnector({ roundIndex, matchIndex, totalMatches, isLowerBracket }) {
  const isLastMatch = matchIndex === totalMatches - 1;
  const connectToNext = matchIndex % 2 === 0;
  
  return (
    <svg
      className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none"
      width="40"
      height="200"
      style={{ zIndex: 5 }}
    >
      {/* Horizontal line from match */}
      <line
        x1="0"
        y1="50%"
        x2="20"
        y2="50%"
        stroke="currentColor"
        strokeWidth="2"
        className="text-gray-300 dark:text-gray-600"
      />
      
      {/* Vertical connector */}
      {!isLastMatch && connectToNext && (
        <line
          x1="20"
          y1="50%"
          x2="20"
          y2="150%"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300 dark:text-gray-600"
        />
      )}
      
      {/* Horizontal line to next round */}
      {connectToNext && (
        <line
          x1="20"
          y1={isLastMatch ? "50%" : "100%"}
          x2="40"
          y2={isLastMatch ? "50%" : "100%"}
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300 dark:text-gray-600"
        />
      )}
    </svg>
  );
}

// Match Preview Tooltip
function MatchPreview({ match, communityPredictions }) {
  if (!match) return null;
  
  return (
    <div className="fixed z-50 pointer-events-none" style={{ bottom: '20px', right: '20px' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[300px]">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Match Preview
        </div>
        
        {/* Teams */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {match.team1?.name || 'TBD'}
            </span>
            <span className="text-sm font-bold">
              {match.team1_score ?? '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {match.team2?.name || 'TBD'}
            </span>
            <span className="text-sm font-bold">
              {match.team2_score ?? '-'}
            </span>
          </div>
        </div>
        
        {/* Match Info */}
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          {match.scheduled_at && (
            <div>Time: {new Date(match.scheduled_at).toLocaleString()}</div>
          )}
          {match.best_of && (
            <div>Format: Best of {match.best_of}</div>
          )}
          {match.stream_url && (
            <div>Stream: Available</div>
          )}
        </div>
        
        {/* Community Predictions */}
        {communityPredictions[match.id] && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Community Predictions
            </div>
            <div className="flex justify-between text-sm">
              <span>{communityPredictions[match.id].team1_percentage}%</span>
              <span>{communityPredictions[match.id].team2_percentage}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VLRBracketVisualization;