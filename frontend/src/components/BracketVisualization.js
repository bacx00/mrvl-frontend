import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { TeamLogo } from '../utils/imageUtils';
import useDeviceType from '../hooks/useDeviceType';
import useTouchGestures from '../hooks/useTouchGestures';
import '../styles/simplified-liquipedia-bracket.css';

function BracketVisualization({ 
  bracket, 
  event, 
  navigateTo, 
  isAdmin, 
  onMatchUpdate, 
  eventId,
  liveScores = {}, 
  webSocketConnected = false 
}) {
  const [zoom, setZoom] = useState(1);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    upperBracket: true,
    lowerBracket: true,
    grandFinal: true
  });
  const containerRef = useRef(null);
  const device = useDeviceType();

  // Touch gesture support
  useTouchGestures(containerRef, {
    onZoom: (delta) => handleZoom(delta * 0.1),
    onPan: () => {}, // Handled by overflow scroll
    disabled: device.isDesktop
  });

  // Handle zoom controls
  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key) {
        case '+':
        case '=':
          e.preventDefault();
          handleZoom(0.1);
          break;
        case '-':
          e.preventDefault();
          handleZoom(-0.1);
          break;
        case '0':
          e.preventDefault();
          setZoom(1);
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'Escape':
          e.preventDefault();
          setSelectedMatch(null);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const toggleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen?.();
      }
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Process bracket data with live score updates
  const processedBracket = useMemo(() => {
    if (!bracket) return null;

    const mergeMatchWithLiveData = (match) => {
      const liveData = liveScores[match.id];
      if (!liveData) return match;

      return {
        ...match,
        team1_score: liveData.team1_score ?? match.team1_score,
        team2_score: liveData.team2_score ?? match.team2_score,
        status: liveData.status ?? match.status,
        live_data: liveData
      };
    };

    const processRounds = (rounds) => {
      if (!rounds) return [];
      return rounds.map(round => ({
        ...round,
        matches: round.matches?.map(mergeMatchWithLiveData) || []
      }));
    };

    return {
      ...bracket,
      bracket: processRounds(bracket.bracket),
      upper_bracket: processRounds(bracket.upper_bracket),
      lower_bracket: processRounds(bracket.lower_bracket),
      grand_final: bracket.grand_final ? mergeMatchWithLiveData(bracket.grand_final) : null
    };
  }, [bracket, liveScores]);

  if (!processedBracket) {
    return (
      <div className="comprehensive-bracket">
        <EmptyBracketState isAdmin={isAdmin} />
      </div>
    );
  }

  const bracketFormat = processedBracket.format || 'single_elimination';

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
    <div ref={containerRef} className="liquipedia-bracket-container comprehensive-bracket">
      {/* Header with controls */}
      <BracketHeader 
        bracket={processedBracket}
        event={event}
        zoom={zoom}
        onZoom={handleZoom}
        onResetZoom={() => setZoom(1)}
        onFullscreen={toggleFullscreen}
        webSocketConnected={webSocketConnected}
        isAdmin={isAdmin}
        expandedSections={expandedSections}
        onToggleSection={toggleSection}
        bracketFormat={bracketFormat}
      />

      {/* Bracket content */}
      <div className="bracket-section overflow-x-auto pb-4">
        <div 
          className="bracket-content transition-transform duration-200 min-w-[1200px]"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: device.isMobile ? 'top left' : 'top center'
          }}
        >
          {bracketFormat === 'double_elimination' ? (
            <DoubleEliminationBracket
              bracket={processedBracket}
              expandedSections={expandedSections}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              selectedMatch={selectedMatch}
              setSelectedMatch={setSelectedMatch}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              getRoundName={getRoundName}
            />
          ) : bracketFormat === 'swiss' ? (
            <SwissBracket
              bracket={processedBracket}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              selectedMatch={selectedMatch}
              setSelectedMatch={setSelectedMatch}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
            />
          ) : bracketFormat === 'round_robin' ? (
            <RoundRobinBracket
              bracket={processedBracket}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              selectedMatch={selectedMatch}
              setSelectedMatch={setSelectedMatch}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
            />
          ) : (
            <SingleEliminationBracket
              bracket={processedBracket}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              selectedMatch={selectedMatch}
              setSelectedMatch={setSelectedMatch}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              getRoundName={getRoundName}
            />
          )}
        </div>
      </div>

      {/* Match details modal */}
      {selectedMatch && (
        <MatchDetailModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          isAdmin={isAdmin}
          onMatchUpdate={onMatchUpdate}
        />
      )}

      {/* Instructions */}
      <div className="text-center mt-4 text-xs text-gray-500 dark:text-gray-400">
        {device.isMobile 
          ? 'Pinch to zoom • Tap matches for details • Swipe to navigate'
          : 'Use +/- to zoom • Click matches for details • Press F for fullscreen'
        }
      </div>
    </div>
  );
}

// Empty bracket state component
function EmptyBracketState({ isAdmin }) {
  return (
    <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div className="text-6xl mb-4">🏆</div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        No Bracket Generated
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        The tournament bracket hasn't been created yet
      </p>
      {isAdmin && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Use the admin panel to:</p>
          <ul className="mt-2 space-y-1 text-left max-w-md mx-auto">
            <li>• Set up team seeding</li>
            <li>• Choose bracket format</li>
            <li>• Generate bracket structure</li>
            <li>• Schedule matches</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Bracket header with controls
function BracketHeader({ 
  bracket, 
  event, 
  zoom, 
  onZoom, 
  onResetZoom, 
  onFullscreen, 
  webSocketConnected, 
  isAdmin, 
  expandedSections, 
  onToggleSection, 
  bracketFormat 
}) {
  return (
    <div className="bracket-header mb-6">
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {event?.name || bracket?.event_name || 'Tournament Bracket'}
            </h3>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {bracketFormat.replace('_', ' ')}
              </span>
              {webSocketConnected && (
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 dark:text-green-400">Live</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Section toggles for double elimination */}
          {bracketFormat === 'double_elimination' && (
            <div className="flex items-center space-x-1 mr-4">
              <button
                onClick={() => onToggleSection('upperBracket')}
                className={`px-2 py-1 text-xs rounded ${
                  expandedSections.upperBracket 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                Upper
              </button>
              <button
                onClick={() => onToggleSection('lowerBracket')}
                className={`px-2 py-1 text-xs rounded ${
                  expandedSections.lowerBracket 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}
              >
                Lower
              </button>
            </div>
          )}

          {/* Zoom Controls */}
          <button
            onClick={() => onZoom(-0.1)}
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
            onClick={() => onZoom(0.1)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Zoom In (+)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
          </button>
          <button
            onClick={onResetZoom}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Reset Zoom (0)"
          >
            Reset
          </button>
          <button
            onClick={onFullscreen}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Fullscreen (F)"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// Single Elimination Bracket Component
function SingleEliminationBracket({ 
  bracket, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate, 
  getRoundName 
}) {
  const rounds = bracket.bracket || bracket.rounds || [];

  return (
    <div className="single-elimination-bracket">
      <div className="flex space-x-8">
        {rounds.map((round, roundIndex) => (
          <BracketRound
            key={roundIndex}
            round={round}
            roundIndex={roundIndex}
            totalRounds={rounds.length}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            getRoundName={getRoundName}
          />
        ))}
      </div>
      
      {/* SVG Connectors */}
      <BracketConnectors rounds={rounds} />
    </div>
  );
}

// Individual bracket round component
function BracketRound({ 
  round, 
  roundIndex, 
  totalRounds, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate, 
  getRoundName, 
  isLowerBracket = false 
}) {
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
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
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
function BracketMatch({ 
  match, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate, 
  roundIndex, 
  isLowerBracket 
}) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const team1Won = isCompleted && (match.team1_score > match.team2_score);
  const team2Won = isCompleted && (match.team2_score > match.team1_score);
  const isHovered = hoveredMatch?.id === match.id;

  const handleMatchClick = () => {
    if (match.id) {
      setSelectedMatch(match);
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
      className={`bracket-match border rounded-lg overflow-hidden transition-all cursor-pointer ${
        isLive ? 'border-red-500 shadow-lg animate-pulse' : 'border-gray-300 dark:border-gray-600'
      } ${isHovered ? 'border-blue-500 shadow-lg scale-105' : 'hover:shadow-md hover:border-gray-400 dark:hover:border-gray-500'}`}
      onClick={handleMatchClick}
      onMouseEnter={() => setHoveredMatch(match)}
      onMouseLeave={() => setHoveredMatch(null)}
    >
      {/* Match Header */}
      {(match.match_number || isLive || match.format) && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {match.match_number ? `Match ${match.match_number}` : `Match ${match.id}`}
            {match.format && ` • ${match.format.toUpperCase()}`}
          </span>
          {isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-red-600 dark:text-red-400">LIVE</span>
            </div>
          )}
        </div>
      )}

      {/* Teams */}
      <div className="bg-white dark:bg-gray-900">
        {/* Team 1 */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 transition-colors ${
          team1Won ? 'bg-green-50 dark:bg-green-900/20' : ''
        } ${team2Won ? 'opacity-70' : ''}`}>
          <div 
            className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1"
            onClick={(e) => handleTeamClick(match.team1, e)}
          >
            {match.team1 ? (
              <>
                <TeamLogo team={match.team1} size="w-6 h-6" />
                <span className={`font-medium truncate ${
                  team1Won ? 'text-gray-900 dark:text-white font-bold' : 
                  isCompleted && !team1Won ? 'text-gray-500 dark:text-gray-500' : 
                  'text-gray-900 dark:text-white'
                }`}>
                  {match.team1.name}
                </span>
                {match.team1.seed && (
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    #{match.team1.seed}
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
            )}
          </div>
          
          {/* Score */}
          <div className="ml-2">
            <span className={`font-bold text-lg ${
              team1Won ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {match.team1_score !== undefined ? match.team1_score : '-'}
            </span>
          </div>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between p-3 transition-colors ${
          team2Won ? 'bg-green-50 dark:bg-green-900/20' : ''
        } ${team1Won ? 'opacity-70' : ''}`}>
          <div 
            className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded p-1 -m-1"
            onClick={(e) => handleTeamClick(match.team2, e)}
          >
            {match.team2 ? (
              <>
                <TeamLogo team={match.team2} size="w-6 h-6" />
                <span className={`font-medium truncate ${
                  team2Won ? 'text-gray-900 dark:text-white font-bold' : 
                  isCompleted && !team2Won ? 'text-gray-500 dark:text-gray-500' : 
                  'text-gray-900 dark:text-white'
                }`}>
                  {match.team2.name}
                </span>
                {match.team2.seed && (
                  <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1 rounded">
                    #{match.team2.seed}
                  </span>
                )}
              </>
            ) : (
              <span className="text-gray-400 dark:text-gray-600 italic">TBD</span>
            )}
          </div>
          
          {/* Score */}
          <div className="ml-2">
            <span className={`font-bold text-lg ${
              team2Won ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {match.team2_score !== undefined ? match.team2_score : '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Match Footer */}
      {(match.scheduled_at || match.completed_at) && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {isCompleted && match.completed_at
              ? `Completed ${new Date(match.completed_at).toLocaleString()}`
              : match.scheduled_at
              ? `Scheduled ${new Date(match.scheduled_at).toLocaleString()}`
              : ''
            }
          </span>
        </div>
      )}
    </div>
  );
}

// Double Elimination Bracket Component
function DoubleEliminationBracket({ 
  bracket, 
  expandedSections, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate, 
  getRoundName 
}) {
  const upperBracket = bracket.upper_bracket || [];
  const lowerBracket = bracket.lower_bracket || [];
  const grandFinal = bracket.grand_final;

  return (
    <div className="double-elimination-bracket space-y-16">
      {/* Upper Bracket */}
      {expandedSections.upperBracket && upperBracket.length > 0 && (
        <div>
          <div className="flex items-center justify-center mb-6">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase border-b-2 border-blue-500 pb-2">
              Upper Bracket
            </h4>
          </div>
          <div className="flex space-x-8 justify-center">
            {upperBracket.map((round, roundIndex) => (
              <BracketRound
                key={`upper-${roundIndex}`}
                round={round}
                roundIndex={roundIndex}
                totalRounds={upperBracket.length}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                selectedMatch={selectedMatch}
                setSelectedMatch={setSelectedMatch}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                getRoundName={getRoundName}
                isUpperBracket={true}
              />
            ))}
          </div>
          <BracketConnectors rounds={upperBracket} />
        </div>
      )}

      {/* Lower Bracket */}
      {expandedSections.lowerBracket && lowerBracket.length > 0 && (
        <div>
          <div className="flex items-center justify-center mb-6">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase border-b-2 border-red-500 pb-2">
              Lower Bracket
            </h4>
          </div>
          <div className="flex space-x-8 justify-center">
            {lowerBracket.map((round, roundIndex) => (
              <BracketRound
                key={`lower-${roundIndex}`}
                round={round}
                roundIndex={roundIndex}
                totalRounds={lowerBracket.length}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                selectedMatch={selectedMatch}
                setSelectedMatch={setSelectedMatch}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                getRoundName={getRoundName}
                isLowerBracket={true}
              />
            ))}
          </div>
          <BracketConnectors rounds={lowerBracket} />
        </div>
      )}

      {/* Grand Final */}
      {expandedSections.grandFinal && grandFinal && (
        <div>
          <div className="flex items-center justify-center mb-6">
            <h4 className="text-sm font-bold text-yellow-700 dark:text-yellow-300 tracking-wider uppercase border-b-2 border-yellow-500 pb-2">
              Grand Final
            </h4>
          </div>
          <div className="flex justify-center">
            <BracketMatch
              match={grandFinal}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              selectedMatch={selectedMatch}
              setSelectedMatch={setSelectedMatch}
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
  selectedMatch, 
  setSelectedMatch,
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Swiss System Standings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Record</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Points</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Buchholz</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {standings.map((standing, index) => (
                  <tr key={standing.team_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">#{index + 1}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <TeamLogo team={{ logo: standing.team_logo }} size="w-6 h-6" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{standing.team_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-medium text-green-600 dark:text-green-400">{standing.wins}</span>
                      <span className="mx-1">-</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{standing.losses}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium text-gray-900 dark:text-white">
                      {standing.points}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 dark:text-gray-300">
                      {standing.buchholz || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Swiss Rounds */}
      <div className="space-y-8">
        {Object.entries(rounds).map(([roundNum, matches]) => (
          <div key={roundNum}>
            <div className="text-center mb-6">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wider uppercase border-b-2 border-blue-500 pb-2 inline-block">
                Round {roundNum}
              </h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match, matchIndex) => (
                <BracketMatch
                  key={match.id || matchIndex}
                  match={match}
                  hoveredMatch={hoveredMatch}
                  setHoveredMatch={setHoveredMatch}
                  selectedMatch={selectedMatch}
                  setSelectedMatch={setSelectedMatch}
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

// Round Robin Bracket Component
function RoundRobinBracket({ 
  bracket, 
  hoveredMatch, 
  setHoveredMatch, 
  selectedMatch, 
  setSelectedMatch,
  navigateTo, 
  isAdmin, 
  onMatchUpdate 
}) {
  const groups = bracket.groups || {};
  const standings = bracket.standings || [];

  return (
    <div className="round-robin-bracket space-y-8">
      {/* Overall Standings */}
      {standings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Overall Standings</h3>
          </div>
          <RoundRobinTable standings={standings} />
        </div>
      )}

      {/* Group Stages */}
      {Object.keys(groups).length > 0 && (
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Group Stage</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.entries(groups).map(([groupName, groupData]) => (
              <div key={groupName} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">Group {groupName}</h4>
                </div>
                
                {/* Group Standings */}
                {groupData.standings && (
                  <div className="p-6">
                    <RoundRobinTable standings={groupData.standings} isGroupStage={true} />
                  </div>
                )}
                
                {/* Group Matches */}
                {groupData.matches && (
                  <div className="p-6 space-y-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Matches</h5>
                    <div className="space-y-3">
                      {groupData.matches.map((match, matchIndex) => (
                        <BracketMatch
                          key={match.id || matchIndex}
                          match={match}
                          hoveredMatch={hoveredMatch}
                          setHoveredMatch={setHoveredMatch}
                          selectedMatch={selectedMatch}
                          setSelectedMatch={setSelectedMatch}
                          navigateTo={navigateTo}
                          isAdmin={isAdmin}
                          onMatchUpdate={onMatchUpdate}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Round Robin Table Component
function RoundRobinTable({ standings, isGroupStage = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pos</th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Team</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">P</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">W</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">L</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">+/-</th>
            <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {standings.map((standing, index) => (
            <tr key={standing.team_id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
              isGroupStage && index < 2 ? 'bg-green-50 dark:bg-green-900/20' : ''
            }`}>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                {index + 1}
                {isGroupStage && index < 2 && (
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">✓</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <TeamLogo team={{ logo: standing.team_logo }} size="w-5 h-5" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{standing.team_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                {standing.played || (standing.wins + standing.losses)}
              </td>
              <td className="px-4 py-3 text-center text-sm font-medium text-green-600 dark:text-green-400">
                {standing.wins}
              </td>
              <td className="px-4 py-3 text-center text-sm font-medium text-red-600 dark:text-red-400">
                {standing.losses}
              </td>
              <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
                {standing.round_differential || standing.map_differential || 0}
              </td>
              <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 dark:text-white">
                {standing.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// SVG Bracket Connectors
function BracketConnectors({ rounds }) {
  if (!rounds || rounds.length < 2) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ zIndex: 1 }}>
      {rounds.map((round, roundIndex) => {
        if (roundIndex >= rounds.length - 1) return null;

        return round.matches.map((match, matchIndex) => {
          const fromX = 320 * (roundIndex + 1);
          const fromY = 120 + (matchIndex * 160);
          const toX = fromX + 96;
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const toY = 120 + (nextMatchIndex * 160);

          return (
            <g key={`connector-${roundIndex}-${matchIndex}`}>
              <line
                x1={fromX}
                y1={fromY}
                x2={fromX + 48}
                y2={fromY}
                stroke="currentColor"
                strokeWidth="2"
                className="text-gray-300 dark:text-gray-600"
              />
              
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

// Match Detail Modal
function MatchDetailModal({ match, onClose, isAdmin, onMatchUpdate }) {
  const [editingScore, setEditingScore] = useState(false);
  const [tempScores, setTempScores] = useState({
    team1: match.team1_score || 0,
    team2: match.team2_score || 0
  });

  const handleScoreUpdate = () => {
    if (tempScores.team1 === tempScores.team2) {
      alert('Scores cannot be tied in elimination matches');
      return;
    }

    const winner = tempScores.team1 > tempScores.team2 ? 1 : 2;
    
    onMatchUpdate(match.id, {
      team1_score: tempScores.team1,
      team2_score: tempScores.team2,
      winner: winner,
      status: 'completed'
    });
    
    setEditingScore(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Match Details
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Teams */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {match.team1 && <TeamLogo team={match.team1} size="w-8 h-8" />}
              <span className="font-medium text-gray-900 dark:text-white">
                {match.team1?.name || 'TBD'}
              </span>
            </div>
            
            <div className="text-2xl font-bold text-gray-500">VS</div>
            
            <div className="flex items-center space-x-3">
              <span className="font-medium text-gray-900 dark:text-white">
                {match.team2?.name || 'TBD'}
              </span>
              {match.team2 && <TeamLogo team={match.team2} size="w-8 h-8" />}
            </div>
          </div>

          {/* Scores */}
          <div className="flex items-center justify-center space-x-8">
            {editingScore ? (
              <>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={tempScores.team1}
                  onChange={(e) => setTempScores({...tempScores, team1: parseInt(e.target.value) || 0})}
                  className="w-16 p-2 text-center border border-gray-300 dark:border-gray-600 rounded text-lg font-bold bg-white dark:bg-gray-700"
                />
                <span className="text-lg">-</span>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={tempScores.team2}
                  onChange={(e) => setTempScores({...tempScores, team2: parseInt(e.target.value) || 0})}
                  className="w-16 p-2 text-center border border-gray-300 dark:border-gray-600 rounded text-lg font-bold bg-white dark:bg-gray-700"
                />
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {match.team1_score ?? '-'}
                </span>
                <span className="text-xl text-gray-500">-</span>
                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                  {match.team2_score ?? '-'}
                </span>
              </>
            )}
          </div>

          {/* Match Info */}
          <div className="space-y-3 text-sm">
            {match.format && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Format:</span>
                <span className="text-gray-900 dark:text-white">{match.format}</span>
              </div>
            )}
            {match.status && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Status:</span>
                <span className={`capitalize ${
                  match.status === 'live' ? 'text-red-600 dark:text-red-400' :
                  match.status === 'completed' ? 'text-green-600 dark:text-green-400' :
                  'text-gray-600 dark:text-gray-400'
                }`}>
                  {match.status}
                </span>
              </div>
            )}
            {(match.scheduled_at || match.completed_at) && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">
                  {match.completed_at ? 'Completed:' : 'Scheduled:'}
                </span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(match.completed_at || match.scheduled_at).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {isAdmin && match.team1 && match.team2 && match.status !== 'completed' && (
          <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
            {editingScore ? (
              <>
                <button
                  onClick={() => {
                    setEditingScore(false);
                    setTempScores({
                      team1: match.team1_score || 0,
                      team2: match.team2_score || 0
                    });
                  }}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScoreUpdate}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
                >
                  Save Score
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditingScore(true)}
                className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 hover:border-blue-700 rounded"
              >
                Update Score
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default BracketVisualization;