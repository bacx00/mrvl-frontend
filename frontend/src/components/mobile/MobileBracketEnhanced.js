import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2,
  ChevronLeft, ChevronRight, Play, Users, Trophy, Calendar
} from 'lucide-react';
import { TouchFeedback, hapticFeedback, useLongPress } from './MobileGestures';
import { MobileMatchCard } from './MobileMatchCard';

// VLR.gg-style mobile bracket with advanced touch controls
export const MobileBracketEnhanced = ({ 
  tournament, 
  matches = [], 
  onMatchSelect,
  onMatchUpdate 
}) => {
  // View state
  const [viewMode, setViewMode] = useState('bracket'); // bracket, list, timeline
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [selectedRound, setSelectedRound] = useState(null);
  const [fullscreen, setFullscreen] = useState(false);

  // Touch gesture state
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState(null);
  const [initialPinchDistance, setInitialPinchDistance] = useState(null);
  const [initialZoom, setInitialZoom] = useState(1);

  const bracketRef = useRef(null);
  const containerRef = useRef(null);

  // Organize matches by rounds
  const roundedMatches = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {});

  const rounds = Object.keys(roundedMatches).sort((a, b) => parseInt(a) - parseInt(b));

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      // Single touch - pan
      setLastTouch({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
      setIsDragging(true);
    } else if (e.touches.length === 2) {
      // Two touches - pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      setInitialPinchDistance(distance);
      setInitialZoom(zoomLevel);
      setIsDragging(false);
    }
    e.preventDefault();
  }, [zoomLevel]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 1 && isDragging && lastTouch) {
      // Pan gesture
      const deltaX = e.touches[0].clientX - lastTouch.x;
      const deltaY = e.touches[0].clientY - lastTouch.y;
      
      setPanOffset(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      
      setLastTouch({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    } else if (e.touches.length === 2 && initialPinchDistance) {
      // Pinch zoom gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scale = distance / initialPinchDistance;
      const newZoom = Math.min(Math.max(initialZoom * scale, 0.5), 3);
      setZoomLevel(newZoom);
      hapticFeedback.light();
    }
    e.preventDefault();
  }, [isDragging, lastTouch, initialPinchDistance, initialZoom]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setLastTouch(null);
    setInitialPinchDistance(null);
    setInitialZoom(1);
  }, []);

  // Zoom controls
  const zoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
    hapticFeedback.light();
  };

  const zoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
    hapticFeedback.light();
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
    hapticFeedback.medium();
  };

  // View mode switching
  const switchViewMode = (mode) => {
    setViewMode(mode);
    hapticFeedback.light();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!fullscreen) {
      containerRef.current?.requestFullscreen?.();
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
    hapticFeedback.medium();
  };

  return (
    <div 
      ref={containerRef}
      className={`mobile-bracket-enhanced relative ${
        fullscreen ? 'fixed inset-0 z-50 bg-black' : 'h-96'
      } overflow-hidden bg-gray-50 dark:bg-gray-900 rounded-lg`}
    >
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-red-500" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white">
              {tournament?.name || 'Tournament Bracket'}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            {/* View Mode Toggles */}
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mr-2">
              {['bracket', 'list', 'timeline'].map(mode => (
                <button
                  key={mode}
                  onClick={() => switchViewMode(mode)}
                  className={`px-2 py-1 text-xs font-medium rounded transition-all ${
                    viewMode === mode
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 touch-optimized"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-16 h-full">
        {viewMode === 'bracket' ? (
          <BracketView
            rounds={rounds}
            roundedMatches={roundedMatches}
            zoomLevel={zoomLevel}
            panOffset={panOffset}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMatchSelect={onMatchSelect}
            bracketRef={bracketRef}
          />
        ) : viewMode === 'list' ? (
          <ListView
            matches={matches}
            onMatchSelect={onMatchSelect}
          />
        ) : (
          <TimelineView
            matches={matches}
            onMatchSelect={onMatchSelect}
          />
        )}
      </div>

      {/* Floating Controls */}
      {viewMode === 'bracket' && (
        <div className="absolute bottom-4 right-4 flex flex-col space-y-2 z-20">
          <TouchFeedback
            onClick={zoomIn}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center touch-optimized"
          >
            <ZoomIn className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </TouchFeedback>
          
          <TouchFeedback
            onClick={zoomOut}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center touch-optimized"
          >
            <ZoomOut className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </TouchFeedback>
          
          <TouchFeedback
            onClick={resetView}
            className="w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center touch-optimized"
          >
            <RotateCcw className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </TouchFeedback>
        </div>
      )}
    </div>
  );
};

// Bracket view component
const BracketView = ({ 
  rounds, 
  roundedMatches, 
  zoomLevel, 
  panOffset, 
  onTouchStart, 
  onTouchMove, 
  onTouchEnd, 
  onMatchSelect,
  bracketRef 
}) => (
  <div
    ref={bracketRef}
    className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing mobile-bracket-performance"
    onTouchStart={onTouchStart}
    onTouchMove={onTouchMove}
    onTouchEnd={onTouchEnd}
  >
    <div
      className="flex space-x-8 p-4 transition-transform duration-200 ease-out min-w-max"
      style={{
        transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`
      }}
    >
      {rounds.map((round, roundIndex) => (
        <div key={round} className="min-w-72 space-y-4">
          {/* Round Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 z-10">
            <h3 className="font-semibold text-center text-gray-900 dark:text-white">
              {getRoundName(round, rounds.length)}
            </h3>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
              {roundedMatches[round].length} matches
            </p>
          </div>
          
          {/* Round Matches */}
          <div className="space-y-4">
            {roundedMatches[round].map((match, matchIndex) => (
              <BracketMatchCard
                key={match.id}
                match={match}
                onClick={() => onMatchSelect(match)}
                delay={roundIndex * 100 + matchIndex * 50}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// List view component
const ListView = ({ matches, onMatchSelect }) => (
  <div className="h-full overflow-y-auto p-4 space-y-3">
    {matches.map(match => (
      <MobileMatchCard
        key={match.id}
        match={match}
        onClick={() => onMatchSelect(match)}
        compact={true}
      />
    ))}
  </div>
);

// Timeline view component
const TimelineView = ({ matches, onMatchSelect }) => {
  const groupedByDate = matches.reduce((acc, match) => {
    const date = new Date(match.scheduled_at).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {});

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">
      {Object.entries(groupedByDate).map(([date, dayMatches]) => (
        <div key={date}>
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-red-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {new Date(date).toLocaleDateString([], { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          <div className="space-y-2 ml-6">
            {dayMatches.map(match => (
              <MobileMatchCard
                key={match.id}
                match={match}
                onClick={() => onMatchSelect(match)}
                compact={true}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Bracket match card component
const BracketMatchCard = ({ match, onClick, delay = 0 }) => {
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';

  return (
    <TouchFeedback
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-lg border transition-all duration-300 overflow-hidden ${
        isLive 
          ? 'border-red-500 shadow-lg shadow-red-500/20 animate-pulse' 
          : isCompleted
          ? 'border-green-500 shadow-sm'
          : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-600'
      } mobile-bracket-match`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Match Header */}
      {isLive && (
        <div className="bg-red-500 text-white px-3 py-1 text-xs font-semibold flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
          LIVE
        </div>
      )}
      
      {/* Teams */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 text-gray-500" />
            </div>
            <span className="text-sm font-medium truncate text-gray-900 dark:text-white">
              {match.team1?.name || 'TBD'}
            </span>
          </div>
          {match.team1_score !== undefined && (
            <span className={`text-lg font-bold ${
              match.team1_score > match.team2_score 
                ? 'text-green-600' 
                : 'text-gray-500'
            }`}>
              {match.team1_score}
            </span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
              <Users className="w-3 h-3 text-gray-500" />
            </div>
            <span className="text-sm font-medium truncate text-gray-900 dark:text-white">
              {match.team2?.name || 'TBD'}
            </span>
          </div>
          {match.team2_score !== undefined && (
            <span className={`text-lg font-bold ${
              match.team2_score > match.team1_score 
                ? 'text-green-600' 
                : 'text-gray-500'
            }`}>
              {match.team2_score}
            </span>
          )}
        </div>
      </div>
      
      {/* Match Time */}
      {match.scheduled_at && (
        <div className="px-3 pb-2 text-xs text-gray-500 dark:text-gray-400">
          {new Date(match.scheduled_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      )}
    </TouchFeedback>
  );
};

// Helper function to get round name
const getRoundName = (round, totalRounds) => {
  const roundNum = parseInt(round);
  if (roundNum === totalRounds) return 'Grand Final';
  if (roundNum === totalRounds - 1) return 'Semi Finals';
  if (roundNum === totalRounds - 2) return 'Quarter Finals';
  return `Round ${roundNum}`;
};

export default MobileBracketEnhanced;