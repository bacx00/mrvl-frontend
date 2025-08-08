import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TeamLogo } from '../../utils/imageUtils';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useTouchGestures } from '../../hooks/useTouchGestures';

const TabletBracketVisualization = ({ 
  bracket, 
  isAdmin = false, 
  navigateTo, 
  onMatchUpdate 
}) => {
  const { isLandscape, width, height } = useDeviceType();
  const containerRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  // Pinch-to-zoom and pan handling
  const { 
    onTouchStart, 
    onTouchMove, 
    onTouchEnd,
    gestureState 
  } = useTouchGestures({
    onPinchZoom: useCallback((scale, center) => {
      const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scale));
      setZoomLevel(newZoom);
      
      // Adjust pan to zoom toward center point
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = center.x - rect.left;
        const centerY = center.y - rect.top;
        
        setPanOffset(prev => ({
          x: prev.x + (centerX - centerX * scale),
          y: prev.y + (centerY - centerY * scale)
        }));
      }
    }, [zoomLevel]),
    
    onPan: useCallback((delta) => {
      setPanOffset(prev => ({
        x: prev.x + delta.x,
        y: prev.y + delta.y
      }));
    }, [])
  });

  // Handle wheel zoom for desktop/trackpad
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.5, Math.min(3, zoomLevel * scaleFactor));
      setZoomLevel(newZoom);
    }
  }, [zoomLevel]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [handleWheel]);

  // Reset zoom and pan
  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Zoom controls
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(3, prev * 1.2));
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(0.5, prev / 1.2));
  };

  // Fit bracket to screen
  const fitToScreen = () => {
    if (!containerRef.current || !bracket?.bracket?.length) return;
    
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    // Calculate bracket dimensions
    const roundWidth = 320;
    const bracketWidth = bracket.bracket.length * roundWidth;
    const bracketHeight = Math.max(...bracket.bracket.map(round => round.matches.length * 120));
    
    // Calculate optimal zoom
    const scaleX = containerWidth / bracketWidth;
    const scaleY = containerHeight / bracketHeight;
    const optimalZoom = Math.min(scaleX, scaleY, 1) * 0.9;
    
    setZoomLevel(optimalZoom);
    setPanOffset({ x: 0, y: 0 });
  };

  if (!bracket?.bracket?.length) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div className="text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-xl text-gray-500 dark:text-gray-400">No bracket available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden">
      {/* Tablet Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
          <button
            onClick={zoomOut}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <div className="flex items-center px-3 text-sm font-medium min-w-16 justify-center">
            {Math.round(zoomLevel * 100)}%
          </div>
          
          <button
            onClick={zoomIn}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow-lg p-1">
          <button
            onClick={fitToScreen}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target"
            title="Fit to Screen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
          
          <button
            onClick={resetView}
            className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-target"
            title="Reset View"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Landscape Layout Toggle */}
      {isLandscape && (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Landscape Mode
            </span>
          </div>
        </div>
      )}

      {/* Bracket Container */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab select-none"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="transform-gpu transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: '0 0'
          }}
        >
          <div className={`
            flex gap-8 p-8 min-w-max
            ${isLandscape ? 'items-start' : 'items-center justify-center'}
          `}>
            {bracket.bracket.map((round, roundIndex) => (
              <TabletRound
                key={roundIndex}
                round={round}
                roundIndex={roundIndex}
                isAdmin={isAdmin}
                navigateTo={navigateTo}
                onMatchUpdate={onMatchUpdate}
                selectedMatch={selectedMatch}
                onMatchSelect={setSelectedMatch}
                isLandscape={isLandscape}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Match Details Modal for Tablet */}
      {selectedMatch && (
        <TabletMatchModal
          match={selectedMatch}
          isAdmin={isAdmin}
          onClose={() => setSelectedMatch(null)}
          onUpdate={onMatchUpdate}
        />
      )}

      {/* Gesture Hints */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-black bg-opacity-75 text-white text-xs rounded-lg p-3 max-w-xs">
          <div className="space-y-1">
            <div>• Pinch to zoom</div>
            <div>• Drag to pan</div>
            <div>• Tap match for details</div>
            {isLandscape && <div>• Optimized for landscape</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

const TabletRound = ({ 
  round, 
  roundIndex, 
  isAdmin, 
  navigateTo, 
  onMatchUpdate, 
  selectedMatch, 
  onMatchSelect,
  isLandscape 
}) => {
  return (
    <div className="flex-shrink-0 min-w-80">
      {/* Round Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-lg mb-4">
        <h3 className="font-bold text-lg text-center py-4 text-gray-900 dark:text-white">
          {round.name}
        </h3>
      </div>

      {/* Matches */}
      <div className={`
        space-y-4
        ${isLandscape ? 'max-h-screen overflow-y-auto' : ''}
      `}>
        {round.matches.map((match, matchIndex) => (
          <TabletMatch
            key={match.id || matchIndex}
            match={match}
            isAdmin={isAdmin}
            navigateTo={navigateTo}
            onUpdate={onMatchUpdate}
            onSelect={onMatchSelect}
            isSelected={selectedMatch?.id === match.id}
          />
        ))}
      </div>
    </div>
  );
};

const TabletMatch = ({ 
  match, 
  isAdmin, 
  navigateTo, 
  onUpdate, 
  onSelect, 
  isSelected 
}) => {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const hasTeams = match.team1 && match.team2;

  const handleMatchClick = (e) => {
    e.stopPropagation();
    onSelect(match);
  };

  const getTeamClasses = (team, isWinner) => {
    let classes = 'transition-colors duration-200';
    if (isCompleted && isWinner) {
      classes += ' bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    } else if (isCompleted && !isWinner) {
      classes += ' opacity-60';
    }
    return classes;
  };

  const isWinner = (teamNumber) => {
    if (!isCompleted) return false;
    return teamNumber === 1 ? 
      match.team1?.score > match.team2?.score : 
      match.team2?.score > match.team1?.score;
  };

  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 border-2 rounded-xl overflow-hidden 
        hover:shadow-lg transition-all duration-200 cursor-pointer
        min-h-32 touch-target-large
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 dark:border-gray-700'}
        ${isLive ? 'ring-2 ring-red-500 ring-opacity-50' : ''}
      `}
      onClick={handleMatchClick}
    >
      {/* Live Indicator */}
      {isLive && (
        <div className="bg-red-600 text-white text-center py-2 font-bold text-sm relative overflow-hidden">
          <div className="relative z-10">LIVE</div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-white to-transparent opacity-20 animate-pulse"></div>
        </div>
      )}

      {/* Match Format */}
      {match.format && (
        <div className="bg-gray-100 dark:bg-gray-700 text-center py-1">
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
            {match.format}
          </span>
        </div>
      )}

      {/* Team 1 */}
      <div className={`p-4 border-b border-gray-100 dark:border-gray-700 ${getTeamClasses(match.team1, isWinner(1))}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {match.team1 ? (
              <>
                <TeamLogo team={match.team1} size="w-8 h-8" />
                <span className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                  {match.team1.name}
                </span>
              </>
            ) : (
              <span className="text-gray-400 italic text-lg">TBD</span>
            )}
          </div>
          
          <span className={`
            font-bold text-2xl min-w-12 text-center
            ${isWinner(1) ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}
          `}>
            {match.team1?.score ?? '-'}
          </span>
        </div>
      </div>

      {/* Team 2 */}
      <div className={`p-4 ${getTeamClasses(match.team2, isWinner(2))}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {match.team2 ? (
              <>
                <TeamLogo team={match.team2} size="w-8 h-8" />
                <span className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                  {match.team2.name}
                </span>
              </>
            ) : match.is_bye ? (
              <span className="text-gray-500 italic text-lg">BYE</span>
            ) : (
              <span className="text-gray-400 italic text-lg">TBD</span>
            )}
          </div>
          
          <span className={`
            font-bold text-2xl min-w-12 text-center
            ${isWinner(2) ? 'text-green-600' : 'text-gray-700 dark:text-gray-300'}
          `}>
            {match.team2?.score ?? '-'}
          </span>
        </div>
      </div>

      {/* Match Info */}
      {(match.scheduled_at || match.round_text) && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
            {match.round_text && (
              <span className="font-medium">{match.round_text}</span>
            )}
            {match.scheduled_at && (
              <span>{new Date(match.scheduled_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TabletMatchModal = ({ match, isAdmin, onClose, onUpdate }) => {
  const [scores, setScores] = useState({
    team1: match.team1?.score || 0,
    team2: match.team2?.score || 0
  });
  const [editing, setEditing] = useState(false);

  const handleScoreSubmit = () => {
    if (scores.team1 === scores.team2) {
      alert('Scores cannot be tied');
      return;
    }

    onUpdate(match.id, {
      team1_score: scores.team1,
      team2_score: scores.team2,
      status: 'completed'
    });
    setEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-96 overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Match Details
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg touch-target"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Teams and Scores */}
          <div className="space-y-3">
            {/* Team 1 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-3">
                {match.team1 && <TeamLogo team={match.team1} size="w-10 h-10" />}
                <span className="font-semibold text-lg">
                  {match.team1?.name || 'TBD'}
                </span>
              </div>
              
              {isAdmin && editing ? (
                <input
                  type="number"
                  value={scores.team1}
                  onChange={(e) => setScores({ ...scores, team1: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-2 border rounded-lg text-center text-lg font-bold"
                  min="0"
                  max="99"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {match.team1?.score ?? '-'}
                </span>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <div className="flex items-center space-x-3">
                {match.team2 && <TeamLogo team={match.team2} size="w-10 h-10" />}
                <span className="font-semibold text-lg">
                  {match.team2?.name || 'TBD'}
                </span>
              </div>
              
              {isAdmin && editing ? (
                <input
                  type="number"
                  value={scores.team2}
                  onChange={(e) => setScores({ ...scores, team2: parseInt(e.target.value) || 0 })}
                  className="w-20 px-3 py-2 border rounded-lg text-center text-lg font-bold"
                  min="0"
                  max="99"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {match.team2?.score ?? '-'}
                </span>
              )}
            </div>
          </div>

          {/* Match Info */}
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Format: {match.format || 'TBD'}</span>
            <span>Status: {match.status}</span>
          </div>

          {/* Admin Controls */}
          {isAdmin && match.team1 && match.team2 && match.status !== 'completed' && (
            <div className="flex justify-end gap-3 pt-4">
              {editing ? (
                <>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium touch-target"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleScoreSubmit}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium touch-target"
                  >
                    Save Score
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium touch-target"
                >
                  Update Score
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TabletBracketVisualization;