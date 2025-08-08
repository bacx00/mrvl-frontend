import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import './BracketStyles.css';

function ComprehensiveBracketVisualization({ 
  bracket, 
  navigateTo, 
  isAdmin, 
  onMatchUpdate,
  eventId 
}) {
  const [currentRound, setCurrentRound] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePinchZoom = useCallback((e) => {
    if (e.touches && e.touches.length === 2) {
      e.preventDefault();
      // Handle pinch zoom logic here
    }
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - panOffset.x, y: e.touches[0].clientY - panOffset.y });
    }
  }, [panOffset]);

  const handleTouchMove = useCallback((e) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      setPanOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  }, [isDragging, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (!bracket) {
    return (
      <div className="bracket-placeholder mobile-optimized">
        <div className="text-center py-12 px-4">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No bracket generated yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Generate a tournament bracket to view the visualization
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`comprehensive-bracket-visualization ${isMobile ? 'mobile-optimized' : 'desktop-optimized'}`}>
      {/* Mobile/Desktop Header */}
      <div className={`bracket-header ${isMobile ? 'mobile-header' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {bracket.name || 'Tournament Bracket'}
            </h2>
            <p className="text-gray-600 text-sm">
              Type: {bracket.type || 'Single Elimination'}
            </p>
          </div>
          
          {/* Mobile Controls */}
          {isMobile && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.2))}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg touch-target"
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.2))}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg touch-target"
                disabled={zoomLevel >= 2}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg touch-target"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile Round Navigation */}
        {isMobile && bracket.rounds && bracket.rounds.length > 1 && (
          <div className="flex items-center justify-between mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
            <button
              onClick={() => setCurrentRound(Math.max(0, currentRound - 1))}
              disabled={currentRound === 0}
              className="p-2 rounded-lg disabled:opacity-50 touch-target"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">
              Round {currentRound + 1} of {bracket.rounds.length}
            </span>
            <button
              onClick={() => setCurrentRound(Math.min(bracket.rounds.length - 1, currentRound + 1))}
              disabled={currentRound === bracket.rounds.length - 1}
              className="p-2 rounded-lg disabled:opacity-50 touch-target"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Bracket Container */}
      <div 
        ref={containerRef}
        className={`bracket-container ${isMobile ? 'mobile-bracket-container' : ''}`}
        style={{
          transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease'
        }}
      >
        {isMobile ? (
          // Mobile: Single Round View
          <div className="mobile-bracket-round">
            {bracket.rounds && bracket.rounds[currentRound] && (
              <div className="round-matches">
                <h3 className="round-title text-center mb-4 text-lg font-semibold">
                  {bracket.rounds[currentRound].name || `Round ${currentRound + 1}`}
                </h3>
                {bracket.rounds[currentRound].matches && bracket.rounds[currentRound].matches.map((match, matchIndex) => (
                  <div key={matchIndex} className="mobile-match-card mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <div className="match-teams space-y-3">
                      <div className="team-row flex items-center justify-between">
                        <div className="team-info flex items-center space-x-3 flex-1">
                          <div className="team-logo w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <span className="team-name font-medium text-sm">
                            {match.team1?.name || 'TBD'}
                          </span>
                        </div>
                        <span className="score text-lg font-bold min-w-8 text-center">
                          {match.team1_score || 0}
                        </span>
                      </div>
                      
                      <div className="vs-divider text-center">
                        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                          VS
                        </span>
                      </div>
                      
                      <div className="team-row flex items-center justify-between">
                        <div className="team-info flex items-center space-x-3 flex-1">
                          <div className="team-logo w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                          <span className="team-name font-medium text-sm">
                            {match.team2?.name || 'TBD'}
                          </span>
                        </div>
                        <span className="score text-lg font-bold min-w-8 text-center">
                          {match.team2_score || 0}
                        </span>
                      </div>
                    </div>
                    
                    {match.status && (
                      <div className="match-status mt-3 text-center">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          match.status === 'live' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                            : match.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {match.status.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Desktop: Full Bracket View
          <div className="bracket-rounds">
            {bracket.rounds && bracket.rounds.map((round, index) => (
              <div key={index} className="bracket-round">
                <h3 className="round-title">{round.name || `Round ${index + 1}`}</h3>
                <div className="round-matches">
                  {round.matches && round.matches.map((match, matchIndex) => (
                    <div key={matchIndex} className="match-card">
                      <div className="match-teams">
                        <div className="team">
                          <span className="team-name">{match.team1?.name || 'TBD'}</span>
                          <span className="score">{match.team1_score || 0}</span>
                        </div>
                        <div className="team">
                          <span className="team-name">{match.team2?.name || 'TBD'}</span>
                          <span className="score">{match.team2_score || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Mobile Touch Hint */}
      {isMobile && (
        <div className="mobile-hint text-center mt-4 text-xs text-gray-500">
          Pinch to zoom • Drag to pan • Swipe to navigate rounds
        </div>
      )}
    </div>
  );
}

export default ComprehensiveBracketVisualization;