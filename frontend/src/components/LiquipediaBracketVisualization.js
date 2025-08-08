import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import useDeviceType from '../hooks/useDeviceType';
import useTouchGestures from '../hooks/useTouchGestures';
import LiquipediaSingleEliminationBracket from './LiquipediaSingleEliminationBracket';
import LiquipediaDoubleEliminationBracket from './LiquipediaDoubleEliminationBracket';
import LiquipediaSwissBracket from './LiquipediaSwissBracket';
import LiquipediaRoundRobinBracket from './LiquipediaRoundRobinBracket';
import '../styles/simplified-liquipedia-bracket.css';

/**
 * Master Liquipedia-style Bracket Visualization Component
 * Clean, functional design matching VLR.gg and Liquipedia aesthetics
 * Supports all tournament formats with responsive design
 */
function LiquipediaBracketVisualization({
  bracket,
  event,
  onMatchClick,
  onTeamClick,
  onMatchUpdate,
  liveScores = {},
  webSocketConnected = false,
  isAdmin = false,
  compact = false
}) {
  const [zoom, setZoom] = useState(1);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const containerRef = useRef(null);
  const device = useDeviceType();

  // Touch gesture support for mobile
  useTouchGestures(containerRef, {
    onZoom: (delta) => handleZoom(delta * 0.1),
    onPan: () => {}, // Let browser handle scrolling
    disabled: device.isDesktop
  });

  // Process bracket with live score updates
  const processedBracket = useMemo(() => {
    if (!bracket) return null;

    const mergeLiveData = (match) => {
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

    const processMatches = (matches) => {
      if (!Array.isArray(matches)) return matches;
      return matches.map(mergeLiveData);
    };

    const processRounds = (rounds) => {
      if (!Array.isArray(rounds)) return rounds;
      return rounds.map(round => ({
        ...round,
        matches: processMatches(round.matches || [])
      }));
    };

    return {
      ...bracket,
      matches: processMatches(bracket.matches || []),
      bracket: processRounds(bracket.bracket || []),
      upper_bracket: processRounds(bracket.upper_bracket || []),
      lower_bracket: processRounds(bracket.lower_bracket || []),
      grand_final: bracket.grand_final ? mergeLiveData(bracket.grand_final) : null,
      grand_finals: bracket.grand_finals ? mergeLiveData(bracket.grand_finals) : null
    };
  }, [bracket, liveScores]);

  // Determine bracket format
  const bracketFormat = processedBracket?.format || 
    (processedBracket?.upper_bracket?.length ? 'double_elimination' :
     processedBracket?.rounds && typeof processedBracket.rounds === 'object' ? 'swiss' :
     processedBracket?.groups ? 'round_robin' :
     'single_elimination');

  // Zoom controls
  const handleZoom = useCallback((delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
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
          if (fullscreen) setFullscreen(false);
          if (selectedMatch) setSelectedMatch(null);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [fullscreen, selectedMatch, handleZoom]);

  // Fullscreen handling
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
      setFullscreen(false);
    } else {
      containerRef.current.requestFullscreen?.();
      setFullscreen(true);
    }
  }, []);

  // Match interaction handlers
  const handleMatchClick = useCallback((match) => {
    setSelectedMatch(match);
    if (onMatchClick) onMatchClick(match);
  }, [onMatchClick]);

  const handleTeamClick = useCallback((team) => {
    if (onTeamClick) onTeamClick(team);
  }, [onTeamClick]);

  const handleMatchHover = useCallback((match) => {
    setHoveredMatch(match);
  }, []);

  // Error boundary
  if (error) {
    return (
      <div className="liquipedia-bracket-container">
        <ErrorState error={error} onRetry={() => setError(null)} />
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="liquipedia-bracket-container">
        <LoadingState />
      </div>
    );
  }

  // Empty state
  if (!processedBracket) {
    return (
      <div className="liquipedia-bracket-container">
        <EmptyBracketState isAdmin={isAdmin} />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className={`
        liquipedia-bracket-container relative
        ${fullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : ''}
      `}
    >
      {/* Header */}
      <BracketHeader 
        bracket={processedBracket}
        event={event}
        format={bracketFormat}
        zoom={zoom}
        onZoom={handleZoom}
        onResetZoom={() => setZoom(1)}
        onFullscreen={toggleFullscreen}
        webSocketConnected={webSocketConnected}
        isAdmin={isAdmin}
        fullscreen={fullscreen}
        compact={compact}
      />

      {/* Main Bracket Content */}
      <div className="bracket-section relative">
        <div 
          className="bracket-content transition-transform duration-200"
          style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: device.isMobile ? 'top left' : 'top center'
          }}
        >
          <BracketRenderer
            bracket={processedBracket}
            format={bracketFormat}
            onMatchClick={handleMatchClick}
            onTeamClick={handleTeamClick}
            hoveredMatch={hoveredMatch}
            selectedMatch={selectedMatch}
            onMatchHover={handleMatchHover}
            compact={compact || device.isMobile}
          />
        </div>
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <MatchDetailsModal
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onUpdate={onMatchUpdate}
          isAdmin={isAdmin}
        />
      )}

      {/* Instructions */}
      <div className="text-center mt-6 text-xs text-gray-500 dark:text-gray-400">
        {device.isMobile 
          ? 'Pinch to zoom • Tap matches for details • Swipe to navigate'
          : 'Use +/- to zoom • Click matches for details • Press F for fullscreen • ESC to exit'
        }
      </div>
    </div>
  );
}

/**
 * Bracket Header Component
 */
function BracketHeader({ 
  bracket, 
  event, 
  format, 
  zoom, 
  onZoom, 
  onResetZoom, 
  onFullscreen, 
  webSocketConnected, 
  isAdmin, 
  fullscreen,
  compact 
}) {
  const formatNames = {
    single_elimination: 'Single Elimination',
    double_elimination: 'Double Elimination', 
    swiss: 'Swiss System',
    round_robin: 'Round Robin',
    group_stage: 'Group Stage'
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {event?.name || bracket?.event_name || 'Tournament Bracket'}
            </h2>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatNames[format] || format.replace('_', ' ')}
              </span>
              {bracket?.teams_count && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {bracket.teams_count} teams
                </span>
              )}
              {webSocketConnected && (
                <div className="flex items-center space-x-1">
                  <div className="match-live-dot">
                    <span className="match-live-dot-ping"></span>
                    <span className="match-live-dot-core"></span>
                  </div>
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">Live Updates</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {!compact && (
          <div className="flex items-center space-x-3">
            {/* Zoom Controls */}
            <div className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 rounded-md">
              <button
                onClick={() => onZoom(-0.1)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-md transition-colors"
                title="Zoom Out (-)"
                disabled={zoom <= 0.5}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 min-w-[60px] text-center border-x border-gray-300 dark:border-gray-600">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => onZoom(0.1)}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Zoom In (+)"
                disabled={zoom >= 2}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                </svg>
              </button>
              <button
                onClick={onResetZoom}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-md transition-colors"
                title="Reset Zoom (0)"
              >
                Reset
              </button>
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={onFullscreen}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md transition-colors"
              title={fullscreen ? 'Exit Fullscreen (ESC)' : 'Fullscreen (F)'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={fullscreen 
                    ? "M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 15v4.5M15 15h4.5M15 15l5.25 5.25M9 15H4.5M9 15v4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25"
                    : "M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  } 
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Bracket Renderer - Routes to appropriate bracket component
 */
function BracketRenderer({ 
  bracket, 
  format, 
  onMatchClick, 
  onTeamClick, 
  hoveredMatch, 
  selectedMatch, 
  onMatchHover, 
  compact 
}) {
  const commonProps = {
    bracket,
    onMatchClick,
    onTeamClick,
    hoveredMatch,
    selectedMatch,
    onMatchHover,
    compact
  };

  switch (format) {
    case 'double_elimination':
      return <LiquipediaDoubleEliminationBracket {...commonProps} />;
    case 'swiss':
      return <LiquipediaSwissBracket {...commonProps} />;
    case 'round_robin':
    case 'group_stage':
      return <LiquipediaRoundRobinBracket {...commonProps} />;
    case 'single_elimination':
    default:
      return <LiquipediaSingleEliminationBracket {...commonProps} />;
  }
}

/**
 * Empty Bracket State
 */
function EmptyBracketState({ isAdmin }) {
  return (
    <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
      <div className="text-6xl mb-4">🏆</div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
        No Bracket Available
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        The tournament bracket hasn't been created yet
      </p>
      {isAdmin && (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 max-w-md mx-auto">
          <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            Admin Actions
          </h4>
          <ul className="text-left text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>• Configure tournament format</li>
            <li>• Add participating teams</li>
            <li>• Set up seeding</li>
            <li>• Generate bracket structure</li>
            <li>• Schedule matches</li>
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Loading State
 */
function LoadingState() {
  return (
    <div className="text-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Loading Bracket
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        Fetching tournament data...
      </p>
    </div>
  );
}

/**
 * Error State
 */
function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-20 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
      <div className="text-4xl mb-4">⚠️</div>
      <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
        Error Loading Bracket
      </h3>
      <p className="text-red-700 dark:text-red-200 mb-6">
        {error?.message || 'Failed to load tournament bracket'}
      </p>
      <button
        onClick={onRetry}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

/**
 * Match Details Modal
 */
function MatchDetailsModal({ match, onClose, onUpdate, isAdmin }) {
  const [editing, setEditing] = useState(false);
  const [scores, setScores] = useState({
    team1: match.team1_score || 0,
    team2: match.team2_score || 0
  });

  const handleSave = () => {
    if (onUpdate) {
      onUpdate(match.id, {
        team1_score: scores.team1,
        team2_score: scores.team2,
        status: 'completed',
        winner: scores.team1 > scores.team2 ? 1 : 2
      });
    }
    setEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-screen overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
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
        
        <div className="p-6">
          {/* Match content - simplified for brevity */}
          <p className="text-gray-600 dark:text-gray-400">
            Match details and admin controls would go here
          </p>
        </div>
      </div>
    </div>
  );
}

export default LiquipediaBracketVisualization;