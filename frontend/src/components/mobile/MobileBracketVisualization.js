import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ZoomIn, ZoomOut, Maximize, ChevronLeft, ChevronRight, 
  RotateCcw, Settings, Eye, EyeOff, Users, Trophy, Clock
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { TeamLogo, getCountryFlag } from '../../utils/imageUtils';

// Mobile-optimized bracket visualization component
const MobileBracketVisualization = ({ 
  bracket, 
  event, 
  navigateTo, 
  isAdmin = false, 
  onMatchUpdate,
  showPredictions = false 
}) => {
  const { api } = useAuth();
  const containerRef = useRef(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState('bracket'); // bracket, list, grid
  const [compactMode, setCompactMode] = useState(true);
  const [pinnedMatches, setPinnedMatches] = useState([]);

  // Gesture handling
  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    setLastTouch({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - lastTouch.x;
    const deltaY = touch.clientY - lastTouch.y;
    
    setPanOffset(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    setLastTouch({ x: touch.clientX, y: touch.clientY });
  }, [isDragging, lastTouch]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Pinch zoom handling
  const handlePinchZoom = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      // Calculate distance between touches
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      // Store initial distance for comparison
      if (!containerRef.current.initialDistance) {
        containerRef.current.initialDistance = distance;
        containerRef.current.initialZoom = zoom;
      }
      
      const scale = distance / containerRef.current.initialDistance;
      const newZoom = Math.max(0.5, Math.min(3, containerRef.current.initialZoom * scale));
      setZoom(newZoom);
    }
  }, [zoom]);

  // Reset gesture state
  const resetGestures = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.initialDistance = null;
      containerRef.current.initialZoom = null;
    }
  }, []);

  // Auto-fit bracket to screen
  const autoFit = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Round navigation
  const navigateRound = (direction) => {
    const totalRounds = bracket?.rounds?.length || 0;
    if (direction === 'next' && currentRound < totalRounds - 1) {
      setCurrentRound(prev => prev + 1);
    } else if (direction === 'prev' && currentRound > 0) {
      setCurrentRound(prev => prev - 1);
    }
  };

  // Pin/unpin match for quick access
  const togglePinMatch = (matchId) => {
    setPinnedMatches(prev => 
      prev.includes(matchId) 
        ? prev.filter(id => id !== matchId)
        : [...prev, matchId]
    );
  };

  if (!bracket?.rounds) {
    return <MobileBracketError />;
  }

  const rounds = bracket.rounds;
  const currentRoundData = rounds[currentRound];

  return (
    <div className="mobile-bracket-container h-screen flex flex-col bg-gray-50 dark:bg-gray-900 mobile-performance-optimized">
      {/* Header Controls */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 high-dpi-mobile">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
              {event?.name || 'Tournament'}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              {bracket.type?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Round Navigation */}
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => navigateRound('prev')}
            disabled={currentRound === 0}
            className="touch-target touch-optimized p-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {currentRoundData?.name || `Round ${currentRound + 1}`}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentRound + 1} of {rounds.length}
            </div>
          </div>
          
          <button
            onClick={() => navigateRound('next')}
            disabled={currentRound === rounds.length - 1}
            className="touch-target touch-optimized p-2 text-gray-600 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Round Progress Indicator */}
        <div className="flex justify-center mt-2">
          <div className="flex space-x-1">
            {rounds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentRound(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentRound 
                    ? 'bg-red-600' 
                    : index < currentRound 
                      ? 'bg-green-500' 
                      : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="w-full text-xs bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
              >
                <option value="bracket">Bracket</option>
                <option value="list">List</option>
                <option value="grid">Grid</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1">
                Display
              </label>
              <button
                onClick={() => setCompactMode(!compactMode)}
                className={`w-full text-xs px-2 py-1 rounded ${
                  compactMode 
                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {compactMode ? 'Compact' : 'Detailed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Content */}
      <div className="flex-1 relative overflow-hidden mobile-bracket-performance">
        {viewMode === 'bracket' ? (
          <BracketView
            currentRoundData={currentRoundData}
            zoom={zoom}
            panOffset={panOffset}
            compactMode={compactMode}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onPinchZoom={handlePinchZoom}
            onTouchEndCapture={resetGestures}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            pinnedMatches={pinnedMatches}
            onTogglePin={togglePinMatch}
          />
        ) : viewMode === 'list' ? (
          <ListView
            matches={currentRoundData?.matches || []}
            compactMode={compactMode}
            navigateTo={navigateTo}
            pinnedMatches={pinnedMatches}
            onTogglePin={togglePinMatch}
          />
        ) : (
          <GridView
            matches={currentRoundData?.matches || []}
            compactMode={compactMode}
            navigateTo={navigateTo}
            pinnedMatches={pinnedMatches}
            onTogglePin={togglePinMatch}
          />
        )}
      </div>

      {/* Zoom Controls (only for bracket view) */}
      {viewMode === 'bracket' && (
        <div className="zoom-controls-mobile">
          <button
            onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
            className="zoom-btn-mobile"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
            className="zoom-btn-mobile"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <button
            onClick={autoFit}
            className="zoom-btn-mobile"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Pinned Matches Quick Access */}
      {pinnedMatches.length > 0 && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pinned Matches
          </div>
          <div className="flex space-x-2 overflow-x-auto">
            {pinnedMatches.map(matchId => {
              const match = findMatchById(rounds, matchId);
              if (!match) return null;
              
              return (
                <button
                  key={matchId}
                  onClick={() => navigateTo('match-detail', { id: matchId })}
                  className="flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 min-w-24"
                >
                  <div className="text-xs font-medium truncate">
                    {match.team1?.short_name || 'TBD'} vs {match.team2?.short_name || 'TBD'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Bracket View Component with Advanced Gestures
const BracketView = ({ 
  currentRoundData, 
  zoom, 
  panOffset, 
  compactMode,
  navigateTo,
  isAdmin,
  pinnedMatches,
  onTogglePin
}) => {
  // Commented out pinch zoom functionality
  const pinchZoomRef = null;
  const gestureZoom = 1;
  const gesturePan = { x: 0, y: 0 };
  
  const [isZooming, setIsZooming] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  
  // Double tap to zoom
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const timeDiff = now - lastTapTime;
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double tap detected
      const currentZoom = gestureZoom;
      const newZoom = currentZoom > 1.5 ? 1 : 2.5;
      
      // Animate zoom change
      setIsZooming(true);
      // hapticFeedback.medium();
      
      setTimeout(() => setIsZooming(false), 300);
    }
    
    setLastTapTime(now);
  }, [lastTapTime, gestureZoom]);
  
  return (
    <div
      ref={pinchZoomRef}
      className="w-full h-full tournament-mobile transform-gpu"
      onTouchEnd={handleDoubleTap}
    >
      <div
        className={`pinch-zoom-container transition-transform ${
          isZooming ? 'duration-300 ease-out' : 'duration-100'
        }`}
        style={{
          transform: `scale(${gestureZoom}) translate(${gesturePan.x}px, ${gesturePan.y}px)`,
          transformOrigin: 'center center',
          minHeight: '100%',
          width: '100%'
        }}
      >
        <div className="p-4 space-y-4">
          {currentRoundData?.matches?.map((match, index) => (
            <div key={match.id || index} className="p-4 bg-gray-100 dark:bg-gray-800 rounded">
              Match content disabled temporarily
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Enhanced List View Component with Virtual Scrolling
const ListView = ({ matches, compactMode, navigateTo, pinnedMatches, onTogglePin }) => {
  const [visibleItems, setVisibleItems] = useState({ start: 0, end: 20 });
  const scrollRef = useRef(null);
  const itemHeight = compactMode ? 120 : 160;
  
  // Virtual scrolling for performance with large match lists
  const handleScroll = useCallback((e) => {
    const scrollTop = e.target.scrollTop;
    const viewportHeight = e.target.clientHeight;
    
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(matches.length, start + Math.ceil(viewportHeight / itemHeight) + 2);
    
    setVisibleItems({ start: Math.max(0, start - 1), end });
  }, [matches.length, itemHeight]);
  
  const visibleMatches = matches.slice(visibleItems.start, visibleItems.end);
  
  return (
    <div 
      ref={scrollRef}
      className="h-full overflow-y-auto mobile-smooth-scroll smooth-scroll-momentum"
      onScroll={handleScroll}
    >
      <div className="p-4">
        {/* Spacer for items before visible range */}
        <div style={{ height: visibleItems.start * itemHeight }} />
        
        <div className="space-y-3">
          {visibleMatches.map((match, index) => {
            const actualIndex = visibleItems.start + index;
            return (
              {/* <SwipeableItem
                key={match.id || actualIndex}
                onSwipeLeft={() => onTogglePin(match.id)}
                onSwipeRight={() => navigateTo('match-detail', { id: match.id })}
                leftAction={
                  <div className="flex items-center justify-center bg-red-500 text-white font-medium">
                    {pinnedMatches.includes(match.id) ? (
                      <>Unpin</>
                    ) : (
                      <>Pin</>
                    )}
                  </div>
                }
                rightAction={
                  <div className="flex items-center justify-center bg-blue-500 text-white font-medium">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </div>
                }
              >
                <MobileBracketMatch
                  match={match}
                  compactMode={compactMode}
                  navigateTo={navigateTo}
                  isPinned={pinnedMatches.includes(match.id)}
                  onTogglePin={() => onTogglePin(match.id)}
                  listView={true}
                />
              </SwipeableItem> */}
            );
          })}
        </div>
        
        {/* Spacer for items after visible range */}
        <div style={{ height: (matches.length - visibleItems.end) * itemHeight }} />
      </div>
    </div>
  );
};

// Enhanced Grid View Component with Responsive Columns
const GridView = ({ matches, compactMode, navigateTo, pinnedMatches, onTogglePin }) => {
  const [columns, setColumns] = useState(1);
  
  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 768) {
        setColumns(3);
      } else if (width >= 480) {
        setColumns(2);
      } else {
        setColumns(1);
      }
    };
    
    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);
  
  return (
    <div className="h-full overflow-y-auto p-4 mobile-smooth-scroll">
      <div 
        className="grid gap-3 mobile-grid-adaptive"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`
        }}
      >
        {matches.map((match, index) => (
          <div
            key={match.id || index}
            className="progressive-enhance"
            style={{
              animationDelay: `${(index % (columns * 3)) * 0.1}s`
            }}
          >
            {/* <SwipeableItem
              onSwipeLeft={() => onTogglePin(match.id)}
              onSwipeRight={() => navigateTo('match-detail', { id: match.id })}
              leftAction={
                <div className="flex items-center justify-center bg-red-500 text-white font-medium text-xs">
                  {pinnedMatches.includes(match.id) ? 'Unpin' : 'Pin'}
                </div>
              }
              rightAction={
                <div className="flex items-center justify-center bg-blue-500 text-white font-medium text-xs">
                  View
                </div>
              }
            >
              <MobileBracketMatch
                match={match}
                compactMode={compactMode}
                navigateTo={navigateTo}
                isPinned={pinnedMatches.includes(match.id)}
                onTogglePin={() => onTogglePin(match.id)}
                gridView={true}
              />
            </SwipeableItem> */}
          </div>
        ))}
      </div>
    </div>
  );
};

// Enhanced Mobile Bracket Match Component with Loading States
const MobileBracketMatch = ({ 
  match, 
  compactMode, 
  navigateTo, 
  isAdmin = false,
  isPinned = false,
  onTogglePin,
  listView = false,
  gridView = false
}) => {
  const [imageLoaded, setImageLoaded] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const isLive = match.status === 'live';
  const isCompleted = match.status === 'completed';
  const isUpcoming = match.status === 'upcoming';

  const getStatusColor = () => {
    if (isLive) return 'bg-red-600 text-white';
    if (isCompleted) return 'bg-green-600 text-white';
    return 'bg-gray-400 text-white';
  };

  const getStatusText = () => {
    if (isLive) return 'LIVE';
    if (isCompleted) return 'FINAL';
    if (match.scheduled_at) {
      return new Date(match.scheduled_at).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    return 'TBD';
  };

  const handleMatchClick = useCallback(() => {
    if (isLoading) return;
    setIsLoading(true);
    // hapticFeedback.light();
    
    setTimeout(() => {
      navigateTo('match-detail', { id: match.id });
      setIsLoading(false);
    }, 100);
  }, [navigateTo, match.id, isLoading]);
  
  return (
    <div 
      className={`
        mobile-bracket-match bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 
        overflow-hidden touch-optimized transition-all duration-200 transform-gpu haptic-feedback-visual
        ${isLive ? 'animate-pulse-glow' : ''}
        ${listView ? 'mb-2' : ''}
        ${gridView ? 'h-full' : ''}
        ${isLoading ? 'opacity-75 pointer-events-none' : ''}
      `}
    >
      {/* Match Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <span className={`text-xs font-bold px-2 py-1 rounded ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {match.round && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {match.round}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {onTogglePin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // hapticFeedback.medium();
                onTogglePin();
              }}
              className={`p-1 rounded touch-target haptic-feedback-visual transition-all ${
                isPinned ? 'text-red-600 scale-110' : 'text-gray-400 hover:text-red-500'
              }`}
            >
              {/* {isPinned ? <Pin className="w-4 h-4" /> : <PinOff className="w-4 h-4" />} */}
            </button>
          )}
          {isAdmin && (
            <button className="text-xs text-blue-600 dark:text-blue-400">
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Teams */}
      <button
        onClick={handleMatchClick}
        disabled={isLoading}
        className="w-full p-3 space-y-3 touch-feedback touch-optimized haptic-feedback-visual disabled:opacity-50"
      >
        {/* Team 1 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {match.team1?.logo ? (
                <>
                  {!imageLoaded[`team1-${match.id}`] && (
                    <div className="absolute inset-0 skeleton-loading" />
                  )}
                  <TeamLogo 
                    team={match.team1} 
                    size="sm" 
                    onLoad={() => setImageLoaded(prev => ({ ...prev, [`team1-${match.id}`]: true }))}
                    className={`transition-opacity ${imageLoaded[`team1-${match.id}`] ? 'opacity-100' : 'opacity-0'}`}
                  />
                </>
              ) : (
                <Users className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {match.team1?.short_name || match.team1?.name || 'TBD'}
              </div>
              {match.team1?.country && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1 truncate">
                  <img 
                    src={getCountryFlag(match.team1.country)} 
                    alt="" 
                    className="w-3 h-3 flex-shrink-0"
                  />
                  <span className="truncate">{compactMode ? match.team1.country : match.team1.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white min-w-8 text-center">
            {match.team1_score ?? '-'}
          </div>
        </div>

        {/* Team 2 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0 relative overflow-hidden">
              {match.team2?.logo ? (
                <>
                  {!imageLoaded[`team2-${match.id}`] && (
                    <div className="absolute inset-0 skeleton-loading" />
                  )}
                  <TeamLogo 
                    team={match.team2} 
                    size="sm" 
                    onLoad={() => setImageLoaded(prev => ({ ...prev, [`team2-${match.id}`]: true }))}
                    className={`transition-opacity ${imageLoaded[`team2-${match.id}`] ? 'opacity-100' : 'opacity-0'}`}
                  />
                </>
              ) : (
                <Users className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {match.team2?.short_name || match.team2?.name || 'TBD'}
              </div>
              {match.team2?.country && (
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center space-x-1 truncate">
                  <img 
                    src={getCountryFlag(match.team2.country)} 
                    alt="" 
                    className="w-3 h-3 flex-shrink-0"
                  />
                  <span className="truncate">{compactMode ? match.team2.country : match.team2.name}</span>
                </div>
              )}
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white min-w-8 text-center flex-shrink-0">
            {match.team2_score ?? '-'}
          </div>
        </div>

        {/* Additional Info */}
        {!compactMode && (
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
            <span>{match.event?.name || 'Tournament'}</span>
            {isLive && match.match_timer && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{match.match_timer}</span>
              </div>
            )}
          </div>
        )}
      </button>
    </div>
  );
};

// Error Component
const MobileBracketError = () => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <Trophy className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No Bracket Data
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Tournament bracket information is not available.
      </p>
    </div>
  </div>
);

// Helper function to find match by ID
const findMatchById = (rounds, matchId) => {
  for (const round of rounds) {
    const match = round.matches?.find(m => m.id === matchId);
    if (match) return match;
  }
  return null;
};

export default MobileBracketVisualization;