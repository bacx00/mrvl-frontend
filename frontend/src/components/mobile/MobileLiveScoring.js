import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Plus, Minus, Save, X,
  Shield, Zap, Heart, Users, Trophy, Clock, Target
} from 'lucide-react';
import { useAuth } from '../../hooks';
import { 
  TouchFeedback, 
  hapticFeedback, 
  useLongPress, 
  useForceTouch, 
  useShakeGesture,
  useDeviceOrientation,
  useMultiTouchGestures 
} from './MobileGestures';
import { TeamLogo } from '../../utils/imageUtils';

// Mobile-optimized live scoring interface
const MobileLiveScoring = ({ 
  match, 
  onUpdate, 
  onClose,
  isAdmin = false 
}) => {
  const { api } = useAuth();
  const [matchState, setMatchState] = useState({
    team1Score: match?.team1_score || 0,
    team2Score: match?.team2_score || 0,
    currentMap: match?.current_map || 1,
    mapScores: match?.maps || [],
    status: match?.status || 'upcoming',
    timer: match?.match_timer || '00:00'
  });

  const [selectedTeam, setSelectedTeam] = useState(null);
  const [quickActions, setQuickActions] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showAdvancedControls, setShowAdvancedControls] = useState(false);
  const [gestureHints, setGestureHints] = useState(true);

  // Auto-save timer
  const autoSaveRef = useRef(null);

  // Trigger auto-save when state changes
  useEffect(() => {
    if (autoSaveRef.current) {
      clearTimeout(autoSaveRef.current);
    }
    
    autoSaveRef.current = setTimeout(() => {
      if (isAdmin && onUpdate) {
        saveChanges(false); // Silent save
      }
    }, 2000);

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [matchState, isAdmin, onUpdate]);

  const saveChanges = async (showFeedback = true) => {
    try {
      setIsUpdating(true);
      
      const updateData = {
        team1_score: matchState.team1Score,
        team2_score: matchState.team2Score,
        current_map: matchState.currentMap,
        status: matchState.status,
        match_timer: matchState.timer,
        maps: matchState.mapScores
      };

      await onUpdate(updateData);
      
      if (showFeedback) {
        hapticFeedback.success();
      }
    } catch (error) {
      console.error('Error saving match updates:', error);
      if (showFeedback) {
        hapticFeedback.error();
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const updateScore = (team, delta) => {
    hapticFeedback.light();
    
    setMatchState(prev => ({
      ...prev,
      [`team${team}Score`]: Math.max(0, prev[`team${team}Score`] + delta)
    }));
  };

  const toggleMatchStatus = () => {
    hapticFeedback.medium();
    
    setMatchState(prev => ({
      ...prev,
      status: prev.status === 'live' ? 'completed' : 'live'
    }));
  };

  const resetMatch = () => {
    hapticFeedback.heavy();
    
    setMatchState(prev => ({
      ...prev,
      team1Score: 0,
      team2Score: 0,
      status: 'upcoming'
    }));
  };

  // Long press handlers
  const team1LongPress = useLongPress(() => {
    setSelectedTeam(1);
    setQuickActions(true);
  }, 800);

  const team2LongPress = useLongPress(() => {
    setSelectedTeam(2);
    setQuickActions(true);
  }, 800);

  // Advanced gesture handlers
  const shakeGesture = useShakeGesture(() => {
    if (isAdmin) {
      // Shake to reset/undo last action
      resetMatch();
    }
  }, 12);

  const deviceOrientation = useDeviceOrientation();

  // 3D Touch for quick score updates
  const team1ForceTouch = useForceTouch((force) => {
    if (isAdmin && force > 0.75) {
      // Hard press for quick +3 points
      updateScore(1, 3);
      hapticFeedback.success();
    }
  }, 0.6);

  const team2ForceTouch = useForceTouch((force) => {
    if (isAdmin && force > 0.75) {
      updateScore(2, 3);
      hapticFeedback.success();
    }
  }, 0.6);

  // Multi-touch gestures for advanced controls
  const multiTouchGestures = useMultiTouchGestures({
    onPinch: ({ scale }) => {
      if (isAdmin && scale > 1.5) {
        setShowAdvancedControls(true);
        hapticFeedback.medium();
      }
    },
    onSwipe: ({ direction }) => {
      if (isAdmin) {
        switch (direction) {
          case 'up':
            toggleMatchStatus();
            break;
          case 'down':
            setQuickActions(true);
            break;
          case 'left':
            setSelectedTeam(1);
            setQuickActions(true);
            break;
          case 'right':
            setSelectedTeam(2);
            setQuickActions(true);
            break;
        }
        hapticFeedback.light();
      }
    }
  });

  // Hide gesture hints after 5 seconds
  useEffect(() => {
    if (gestureHints) {
      const timer = setTimeout(() => {
        setGestureHints(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [gestureHints]);

  if (!match) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-500">
          <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No match selected</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={multiTouchGestures.elementRef}
      className="mobile-live-scoring h-full flex flex-col bg-gradient-to-b from-gray-900 to-black text-white safe-area-padding"
      style={{
        transform: deviceOrientation.isLandscape ? 'scale(1.1)' : 'scale(1)',
        transition: 'transform 0.3s ease-out'
      }}
    >
      {/* Header */}
      <div className="live-score-header-mobile mobile-safe-area">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              matchState.status === 'live' ? 'bg-red-500 animate-pulse' : 'bg-gray-500'
            }`} />
            <span className="text-sm font-semibold">
              {matchState.status === 'live' ? 'LIVE' : matchState.status.toUpperCase()}
            </span>
          </div>
          
          {isAdmin && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors touch-optimized"
              style={{ WebkitTapHighlightColor: 'rgba(255, 255, 255, 0.1)' }}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="text-center mt-2">
          <div className="text-lg font-bold">{match.event?.name}</div>
          <div className="text-sm opacity-75">
            Map {matchState.currentMap} • {matchState.timer}
          </div>
        </div>
      </div>

      {/* Main Score Display */}
      <div className="flex-1 p-4 space-y-4 mobile-performance-optimized">
        {/* Team 1 */}
        <div 
          ref={team1ForceTouch.elementRef}
          {...(isAdmin ? team1LongPress : {})}
        >
          <TouchFeedback 
            className="team-score-mobile mobile-layout-stable"
            style={{
              transform: team1ForceTouch.isForceActive ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.1s ease-out'
            }}
          >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
              {match.team1?.logo ? (
                <TeamLogo team={match.team1} size="sm" />
              ) : (
                <Users className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="team-name-mobile text-sm truncate">{match.team1?.short_name || match.team1?.name || 'Team 1'}</div>
              <div className="text-xs text-gray-400 truncate">{match.team1?.country || 'Region'}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => updateScore(1, 1)}
                  className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center touch-optimized transition-all duration-200 active:scale-95"
                  style={{ WebkitTapHighlightColor: 'rgba(34, 197, 94, 0.1)' }}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => updateScore(1, -1)}
                  className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center touch-optimized transition-all duration-200 active:scale-95"
                  style={{ WebkitTapHighlightColor: 'rgba(239, 68, 68, 0.1)' }}
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="score-display-mobile text-2xl">{matchState.team1Score}</div>
          </div>
          </TouchFeedback>
        </div>

        {/* VS Divider */}
        <div className="text-center py-3">
          <div className="text-xl font-bold text-gray-400">VS</div>
          {isAdmin && (
            <div className="flex justify-center space-x-3 mt-3">
              <button
                onClick={toggleMatchStatus}
                className={`p-2 px-4 rounded-lg flex items-center space-x-2 touch-optimized transition-all duration-200 active:scale-95 ${
                  matchState.status === 'live' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                style={{ WebkitTapHighlightColor: matchState.status === 'live' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)' }}
              >
                {matchState.status === 'live' ? (
                  <>
                    <Pause className="w-4 h-4" />
                    <span className="text-sm">Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Start</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => saveChanges(true)}
                disabled={isUpdating}
                className="p-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50 touch-optimized transition-all duration-200 active:scale-95"
                style={{ WebkitTapHighlightColor: 'rgba(59, 130, 246, 0.1)' }}
              >
                <Save className="w-4 h-4" />
                <span className="text-sm">{isUpdating ? 'Saving...' : 'Save'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div 
          ref={team2ForceTouch.elementRef}
          {...(isAdmin ? team2LongPress : {})}
        >
          <TouchFeedback 
            className="team-score-mobile"
            style={{
              transform: team2ForceTouch.isForceActive ? 'scale(1.02)' : 'scale(1)',
              transition: 'transform 0.1s ease-out'
            }}
          >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center">
              {match.team2?.logo ? (
                <TeamLogo team={match.team2} size="md" />
              ) : (
                <Users className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <div className="team-name-mobile">{match.team2?.name || 'Team 2'}</div>
              <div className="text-sm text-gray-400">{match.team2?.country || 'Region'}</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAdmin && (
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => updateScore(2, 1)}
                  className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center"
                >
                  <Plus className="w-6 h-6" />
                </button>
                <button
                  onClick={() => updateScore(2, -1)}
                  className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center"
                >
                  <Minus className="w-6 h-6" />
                </button>
              </div>
            )}
            <div className="score-display-mobile">{matchState.team2Score}</div>
          </div>
          </TouchFeedback>
        </div>
      </div>

      {/* Map Information */}
      {matchState.mapScores.length > 0 && (
        <div className="bg-black/30 p-4">
          <div className="text-sm font-medium mb-3 text-center">Map Progress</div>
          <div className="grid grid-cols-3 gap-2">
            {matchState.mapScores.map((map, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg text-center ${
                  index === matchState.currentMap - 1 
                    ? 'bg-red-600' 
                    : 'bg-gray-700'
                }`}
              >
                <div className="text-xs font-medium">{map.name || `Map ${index + 1}`}</div>
                <div className="text-sm mt-1">
                  {map.team1_score || 0} - {map.team2_score || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions Modal */}
      {quickActions && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-2xl p-6 space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Quick Actions - Team {selectedTeam}
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => {
                  updateScore(selectedTeam, 5);
                  setQuickActions(false);
                }}
                className="p-4 bg-green-100 dark:bg-green-900 rounded-lg text-green-800 dark:text-green-200"
              >
                <Target className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">+5 Points</div>
              </button>
              
              <button
                onClick={() => {
                  setMatchState(prev => ({
                    ...prev,
                    [`team${selectedTeam}Score`]: 0
                  }));
                  setQuickActions(false);
                }}
                className="p-4 bg-red-100 dark:bg-red-900 rounded-lg text-red-800 dark:text-red-200"
              >
                <RotateCcw className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium">Reset Score</div>
              </button>
            </div>
            
            <button
              onClick={() => setQuickActions(false)}
              className="w-full p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Gesture Hints Overlay */}
      {gestureHints && isAdmin && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-60 pointer-events-none">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 mx-4 max-w-sm shadow-2xl">
            <div className="text-center mb-4">
              <Trophy className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Advanced Controls
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Use gestures for quick scoring
              </p>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-600">3D</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Force press teams for +3 points</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-green-600">📱</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Shake to reset match</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-purple-600">👆</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Swipe for quick actions</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-600">🤏</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300">Pinch for advanced controls</span>
              </div>
            </div>
            
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setGestureHints(false)}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 pointer-events-auto"
              >
                Got it, hide hints
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Controls Modal */}
      {showAdvancedControls && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full rounded-t-2xl p-6 space-y-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Advanced Match Controls
              </h3>
              <button
                onClick={() => setShowAdvancedControls(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setMatchState(prev => ({ ...prev, currentMap: prev.currentMap + 1 }));
                  setShowAdvancedControls(false);
                }}
                className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-800 dark:text-blue-200 flex flex-col items-center"
              >
                <Trophy className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Next Map</span>
              </button>
              
              <button
                onClick={() => {
                  setMatchState(prev => ({ 
                    ...prev, 
                    status: prev.status === 'completed' ? 'live' : 'completed' 
                  }));
                  setShowAdvancedControls(false);
                }}
                className="p-4 bg-green-100 dark:bg-green-900 rounded-lg text-green-800 dark:text-green-200 flex flex-col items-center"
              >
                <Target className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Toggle Complete</span>
              </button>
              
              <button
                onClick={() => {
                  resetMatch();
                  setShowAdvancedControls(false);
                }}
                className="p-4 bg-red-100 dark:bg-red-900 rounded-lg text-red-800 dark:text-red-200 flex flex-col items-center"
              >
                <RotateCcw className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Reset All</span>
              </button>
              
              <button
                onClick={() => {
                  saveChanges(true);
                  setShowAdvancedControls(false);
                }}
                className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-800 dark:text-purple-200 flex flex-col items-center"
              >
                <Save className="w-6 h-6 mb-2" />
                <span className="text-sm font-medium">Force Save</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-save indicator */}
      {isUpdating && (
        <div className="fixed bottom-4 right-4 bg-black/75 text-white px-3 py-2 rounded-lg flex items-center space-x-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Saving...</span>
        </div>
      )}

      {/* Force Touch Feedback */}
      {(team1ForceTouch.supportsForceTouch || team2ForceTouch.supportsForceTouch) && (team1ForceTouch.isForceActive || team2ForceTouch.isForceActive) && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-full p-4 shadow-2xl z-50">
          <div className="text-2xl">⚡</div>
          <div className="text-xs text-center mt-1 text-gray-600 dark:text-gray-400">Force Touch</div>
        </div>
      )}

      {/* Shake Feedback */}
      {shakeGesture.isShaking && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white rounded-full p-4 shadow-2xl z-50 animate-bounce">
          <RotateCcw className="w-8 h-8" />
          <div className="text-xs text-center mt-1">Shake to Reset</div>
        </div>
      )}

      {/* Multi-touch Gesture Indicator */}
      {multiTouchGestures.isGesturing && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm z-50">
          {multiTouchGestures.gestureState.type === 'pinch' ? '🤏 Pinch Gesture' : 
           multiTouchGestures.gestureState.type === 'pan' ? '👆 Pan Gesture' : 
           '✋ Multi-touch'}
        </div>
      )}
    </div>
  );
};

export default MobileLiveScoring;