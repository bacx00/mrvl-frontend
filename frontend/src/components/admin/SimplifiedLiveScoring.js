import React, { useState, useEffect, useCallback, useRef } from 'react';
import DOMPurify from 'dompurify';
import { X, Trophy, Play, Pause, RotateCcw, ChevronDown, Users, Award } from 'lucide-react';
import { useAuth } from '../../hooks';
import { HEROES } from '../../constants/marvelRivalsData';
import { getHeroImageSync, getHeroRole, getTeamLogoUrl } from '../../utils/imageUtils';
import liveScoreManager from '../../utils/LiveScoreManager';

// Error Boundary Component
class LiveScoringErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('LiveScoring Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-8 max-w-md">
            <h2 className="text-white text-xl mb-4">System Error</h2>
            <p className="text-gray-300 mb-4">The live scoring system encountered an error. Please refresh and try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const SimplifiedLiveScoring = ({ 
  isOpen, 
  onClose, 
  match,
  onUpdate 
}) => {
  const { token } = useAuth();
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
  
  // Version tracking for optimistic locking
  const matchVersionRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);
  const debounceTimerRef = useRef(null);
  const isUnmountedRef = useRef(false);

  // Comprehensive state for match data
  const [matchData, setMatchData] = useState({
    team1Score: 0,
    team2Score: 0,
    team1MapScore: 0,
    team2MapScore: 0,
    status: 'live',
    currentMap: 1,
    totalMaps: 5,
    matchTimer: '00:00',
    team1Players: [],
    team2Players: []
  });

  const [expandedStats, setExpandedStats] = useState(true);
  // REMOVED: autoSave and liveSync states - no longer needed without timers
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date().toLocaleTimeString());
  const [isSyncing, setIsSyncing] = useState(false);
  const [errors, setErrors] = useState([]);
  const [conflictResolution, setConflictResolution] = useState(null);

  // Cleanup on unmount
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Unsubscribe from LiveScoreManager
      if (match?.id) {
        liveScoreManager.unsubscribe(`simplified-live-scoring-${match.id}`);
      }
    };
  }, [match?.id]);

  // Load match data on open
  useEffect(() => {
    if (match && isOpen && !isUnmountedRef.current) {
      loadMatchData();
    }
  }, [match, isOpen]);

  // Security: Input validation and sanitization
  const validateAndSanitizeInput = (value, type = 'number') => {
    if (type === 'number') {
      const num = parseInt(value);
      if (isNaN(num) || num < 0 || num > 9999) {
        throw new Error(`Invalid ${type} value: ${value}`);
      }
      return num;
    }
    if (type === 'string') {
      const sanitized = DOMPurify.sanitize(String(value).trim());
      if (sanitized.length > 50) {
        throw new Error('String value too long');
      }
      return sanitized;
    }
    return value;
  };

  // Add error to error list
  const addError = useCallback((error) => {
    const errorMsg = error instanceof Error ? error.message : String(error);
    setErrors(prev => [...prev.slice(-2), { message: errorMsg, timestamp: Date.now() }]);
  }, []);

  // Clear errors after timeout
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors(prev => prev.filter(e => Date.now() - e.timestamp < 5000));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  // 1. LOAD MATCH DATA - GET /api/matches/{id}
  const loadMatchData = async (silent = false) => {
    if (isUnmountedRef.current) return;
    
    try {
      if (!silent) setIsLoading(true);
      
      const response = await fetch(`${BACKEND_URL}/api/matches/${match.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (isUnmountedRef.current) return;
      
      // Update version for optimistic locking
      matchVersionRef.current = data.version || matchVersionRef.current + 1;
      
      // Initialize 6 players per team
      const team1Players = [];
      const team2Players = [];
      
      // Use roster data or create placeholder players with comprehensive stats
      for (let i = 0; i < 6; i++) {
        const team1Player = data.team1?.roster?.[i] || { id: i, username: `Player ${i + 1}` };
        const team2Player = data.team2?.roster?.[i] || { id: i, username: `Player ${i + 1}` };
        
        team1Players.push({
          ...team1Player,
          hero: validateAndSanitizeInput(team1Player.hero || '', 'string'),
          kills: validateAndSanitizeInput(team1Player.kills || 0),
          deaths: validateAndSanitizeInput(team1Player.deaths || 0),
          assists: validateAndSanitizeInput(team1Player.assists || 0),
          damage: validateAndSanitizeInput(team1Player.damage || 0),
          healing: validateAndSanitizeInput(team1Player.healing || 0),
          blocked: validateAndSanitizeInput(team1Player.blocked || 0),
          kda: '0.00',
          isAlive: true
        });
        
        team2Players.push({
          ...team2Player,
          hero: validateAndSanitizeInput(team2Player.hero || '', 'string'),
          kills: validateAndSanitizeInput(team2Player.kills || 0),
          deaths: validateAndSanitizeInput(team2Player.deaths || 0),
          assists: validateAndSanitizeInput(team2Player.assists || 0),
          damage: validateAndSanitizeInput(team2Player.damage || 0),
          healing: validateAndSanitizeInput(team2Player.healing || 0),
          blocked: validateAndSanitizeInput(team2Player.blocked || 0),
          kda: '0.00',
          isAlive: true
        });
      }

      setMatchData({
        team1Score: validateAndSanitizeInput(data.team1_score || 0),
        team2Score: validateAndSanitizeInput(data.team2_score || 0),
        team1MapScore: validateAndSanitizeInput(data.series_score_team1 || data.team1_series_score || 0),
        team2MapScore: validateAndSanitizeInput(data.series_score_team2 || data.team2_series_score || 0),
        status: validateAndSanitizeInput(data.status || 'live', 'string'),
        team1Players,
        team2Players
      });
      
    } catch (error) {
      console.error('Error loading match data:', error);
      addError(error);
    } finally {
      if (!silent && !isUnmountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  // Calculate KDA 
  const calculateKDA = (kills, deaths, assists) => {
    if (deaths === 0) return kills + assists;
    return ((kills + assists) / deaths);
  };

  // DEBOUNCED save function with optimistic locking and conflict resolution
  const debouncedApiSave = useCallback(async (dataToSave) => {
    if (!dataToSave || !match?.id || isUnmountedRef.current) return;
    
    // Clear existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Debounce API calls by 300ms
    debounceTimerRef.current = setTimeout(async () => {
      if (isUnmountedRef.current) return;
      
      const now = Date.now();
      if (now - lastUpdateTimeRef.current < 100) {
        // Prevent rapid-fire saves
        return;
      }
      
      setIsSyncing(true);
      try {
        // Validate all data before sending
        const validatedData = {
          team1_players: dataToSave.team1Players.map(player => ({
            ...player,
            kills: validateAndSanitizeInput(player.kills),
            deaths: validateAndSanitizeInput(player.deaths),
            assists: validateAndSanitizeInput(player.assists),
            damage: validateAndSanitizeInput(player.damage),
            healing: validateAndSanitizeInput(player.healing),
            blocked: validateAndSanitizeInput(player.blocked),
            hero: validateAndSanitizeInput(player.hero || '', 'string')
          })),
          team2_players: dataToSave.team2Players.map(player => ({
            ...player,
            kills: validateAndSanitizeInput(player.kills),
            deaths: validateAndSanitizeInput(player.deaths),
            assists: validateAndSanitizeInput(player.assists),
            damage: validateAndSanitizeInput(player.damage),
            healing: validateAndSanitizeInput(player.healing),
            blocked: validateAndSanitizeInput(player.blocked),
            hero: validateAndSanitizeInput(player.hero || '', 'string')
          })),
          series_score_team1: validateAndSanitizeInput(dataToSave.team1MapScore),
          series_score_team2: validateAndSanitizeInput(dataToSave.team2MapScore),
          team1_score: validateAndSanitizeInput(dataToSave.team1Score),
          team2_score: validateAndSanitizeInput(dataToSave.team2Score),
          status: validateAndSanitizeInput(dataToSave.status || 'live', 'string'),
          version: matchVersionRef.current,
          timestamp: now
        };
        
        const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/update-live-stats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
          },
          body: JSON.stringify(validatedData)
        });

        if (!response.ok) {
          if (response.status === 409) {
            // Handle conflict - another user updated the match
            const conflict = await response.json();
            setConflictResolution({
              serverData: conflict.current_data,
              localData: dataToSave,
              timestamp: now
            });
            throw new Error('Conflict detected: Match was updated by another user');
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (isUnmountedRef.current) return;
        
        // Update version from server response
        if (result.version) {
          matchVersionRef.current = result.version;
        }
        
        lastUpdateTimeRef.current = now;
        
        if (onUpdate) {
          onUpdate(result.data);
        }
        
        setLastUpdate(new Date().toLocaleTimeString());
        
        // ENHANCED: Broadcast real-time update through LiveScoreManager
        liveScoreManager.broadcastScoreUpdate(match.id, result.data || dataToSave, {
          source: 'SimplifiedLiveScoring',
          version: matchVersionRef.current,
          type: 'live_score_update',
          timestamp: now
        });
        
        // Legacy localStorage support for backward compatibility
        if (window.localStorage) {
          localStorage.setItem(`match_${match.id}_updated`, now.toString());
        }
        
      } catch (error) {
        console.error('Debounced save error:', error);
        addError(error);
      } finally {
        if (!isUnmountedRef.current) {
          setIsSyncing(false);
        }
      }
    }, 300);
  }, [match?.id, token, onUpdate, BACKEND_URL, addError]);

  // Update player stats with validation and debounced save
  const updatePlayerStat = useCallback(async (team, playerIndex, stat, value) => {
    if (isUnmountedRef.current) return;
    
    try {
      // Validate input first
      const validatedValue = validateAndSanitizeInput(value);
      
      // Update UI immediately (optimistic update)
      setMatchData(prev => {
        const playersKey = team === 1 ? 'team1Players' : 'team2Players';
        const updatedPlayers = [...prev[playersKey]];
        const player = { ...updatedPlayers[playerIndex] };
        
        if (!player) {
          throw new Error(`Player not found at index ${playerIndex}`);
        }
        
        // Update the specific stat
        player[stat] = validatedValue;
        
        // Auto-calculate KDA when K, D, or A changes
        if (stat === 'kills' || stat === 'deaths' || stat === 'assists') {
          player.kda = calculateKDA(player.kills, player.deaths, player.assists).toFixed(2);
        }
        
        updatedPlayers[playerIndex] = player;
        
        const newState = {
          ...prev,
          [playersKey]: updatedPlayers
        };

        // DEBOUNCED API CALL: Save with conflict detection
        debouncedApiSave(newState);

        return newState;
      });
    } catch (error) {
      console.error('Error updating player stat:', error);
      addError(error);
    }
  }, [debouncedApiSave, addError]);

  // Update hero selection with validation and debounced save
  const updatePlayerHero = useCallback(async (team, playerIndex, hero) => {
    if (isUnmountedRef.current) return;
    
    try {
      const validatedHero = validateAndSanitizeInput(hero || '', 'string');
      
      // Update UI immediately
      setMatchData(prev => {
        const playersKey = team === 1 ? 'team1Players' : 'team2Players';
        const updatedPlayers = [...prev[playersKey]];
        
        if (!updatedPlayers[playerIndex]) {
          throw new Error(`Player not found at index ${playerIndex}`);
        }
        
        updatedPlayers[playerIndex] = {
          ...updatedPlayers[playerIndex],
          hero: validatedHero
        };
        
        const newState = {
          ...prev,
          [playersKey]: updatedPlayers
        };

        // DEBOUNCED API CALL: Save hero selection
        debouncedApiSave(newState);
        
        return newState;
      });
    } catch (error) {
      console.error('Error updating player hero:', error);
      addError(error);
    }
  }, [debouncedApiSave, addError]);

  // Update map scores with validation and debounced save
  const updateMapScore = useCallback(async (team, increment) => {
    if (isUnmountedRef.current) return;
    
    try {
      // Update UI immediately
      setMatchData(prev => {
        const scoreKey = team === 1 ? 'team1MapScore' : 'team2MapScore';
        const newScore = Math.max(0, prev[scoreKey] + (increment ? 1 : -1));
        
        // Validate score
        const validatedScore = validateAndSanitizeInput(newScore);
        
        const newState = {
          ...prev,
          [scoreKey]: validatedScore
        };

        // DEBOUNCED API CALL: Save map score changes
        debouncedApiSave(newState);

        return newState;
      });
    } catch (error) {
      console.error('Error updating map score:', error);
      addError(error);
    }
  }, [debouncedApiSave, addError]);

  // Conflict Resolution Modal
  const ConflictResolutionModal = () => {
    if (!conflictResolution) return null;
    
    const resolveConflict = (useServerData) => {
      if (useServerData) {
        setMatchData(conflictResolution.serverData);
        matchVersionRef.current = conflictResolution.serverData.version || matchVersionRef.current + 1;
      } else {
        // Keep local data and try to save again
        debouncedApiSave(conflictResolution.localData);
      }
      setConflictResolution(null);
    };
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md">
          <h3 className="text-white text-lg font-bold mb-4">Conflict Detected</h3>
          <p className="text-gray-300 mb-4">
            Another user has updated this match. Choose which version to keep:
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => resolveConflict(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Use Server Data
            </button>
            <button
              onClick={() => resolveConflict(false)}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Keep My Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Error Display Component
  const ErrorDisplay = () => {
    if (errors.length === 0) return null;
    
    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {errors.map((error, index) => (
          <div
            key={index}
            className="bg-red-600 text-white px-4 py-2 rounded shadow-lg max-w-sm"
          >
            <div className="text-sm font-medium">{error.message}</div>
            <button
              onClick={() => setErrors(prev => prev.filter((_, i) => i !== index))}
              className="float-right text-red-200 hover:text-white"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    );
  };

  // 3. QUICK ACTIONS
  const teamWinsMap = async (teamNumber) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/team-wins-map`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          winning_team: teamNumber
        })
      });

      if (response.ok) {
        // Update series score
        if (teamNumber === 1) {
          setMatchData(prev => ({ ...prev, team1Score: prev.team1Score + 1 }));
        } else {
          setMatchData(prev => ({ ...prev, team2Score: prev.team2Score + 1 }));
        }
        if (onUpdate) onUpdate();
      }
    } catch (error) {
      console.error('Error updating map win:', error);
    }
  };

  // Complete match
  const completeMatch = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/matches/${match.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: 'completed'
        })
      });

      if (response.ok) {
        setMatchData(prev => ({ ...prev, status: 'completed' }));
        if (onUpdate) onUpdate();
        alert('Match completed!');
      }
    } catch (error) {
      console.error('Error completing match:', error);
    }
  };

  // Reset all stats
  const resetStats = async () => {
    if (!confirm('Reset all player stats to zero?')) return;

    const resetPlayers = (players) => players.map(player => ({
      ...player,
      kills: 0,
      deaths: 0,
      assists: 0,
      damage: 0,
      healing: 0,
      blocked: 0,
      kda: '0.00',
      hero: '',
      isAlive: true
    }));

    setMatchData(prev => ({
      ...prev,
      team1MapScore: 0,
      team2MapScore: 0,
      currentMap: 1,
      matchTimer: '00:00',
      team1Players: resetPlayers(prev.team1Players),
      team2Players: resetPlayers(prev.team2Players)
    }));
    
    alert('Stats reset!');
  };

  // Get role-based styling - Dark theme
  const getRoleColor = (heroName) => {
    const role = getHeroRole(heroName);
    switch (role) {
      case 'Duelist': return 'border-red-600 bg-gray-800';
      case 'Vanguard': return 'border-blue-600 bg-gray-800';
      case 'Strategist': return 'border-yellow-600 bg-gray-800';
      default: return 'border-gray-600 bg-gray-800';
    }
  };

  // Professional broadcast-style component for individual player
  const PlayerRow = ({ player, team, playerIndex }) => {
    const heroImage = getHeroImageSync(player.hero);
    const roleColor = getRoleColor(player.hero);
    
    return (
      <div className={`${roleColor} rounded p-2 mb-2 border transition-all duration-200 hover:border-red-500`}>
        <div className="flex items-center gap-2 mb-2">
          {/* Hero Image */}
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
            {heroImage ? (
              <img 
                src={heroImage} 
                alt={player.hero}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-full h-full bg-gray-600 flex items-center justify-center text-white text-xs font-bold ${heroImage ? 'hidden' : ''}`}>
              {player.hero ? player.hero.substring(0, 2).toUpperCase() : 'P'}
            </div>
          </div>

          {/* Player Name & Hero */}
          <div className="flex-1">
            <div className="font-bold text-white text-sm">{player.username || `Player ${playerIndex + 1}`}</div>
            <div className="text-xs text-gray-400">
              {player.hero || 'No Hero Selected'}
              {player.hero && ` (${getHeroRole(player.hero)})`}
            </div>
          </div>

          {/* Status */}
          <div className={`w-2 h-2 rounded-full ${player.isAlive ? 'bg-green-400' : 'bg-red-400'}`} 
               title={player.isAlive ? 'Alive' : 'Dead'} />
        </div>

        {/* Hero Selection Dropdown */}
        <div className="mb-2">
          <select
            value={player.hero}
            onChange={(e) => updatePlayerHero(team, playerIndex, e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-red-500 focus:border-red-500"
          >
            <option value="">Select Hero...</option>
            {Object.entries(HEROES).map(([role, heroes]) => (
              <optgroup key={role} label={role}>
                {Array.isArray(heroes) && heroes.map(hero => (
                  <option key={hero} value={hero}>{hero}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Stats Grid - Compact Layout */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Kills */}
          <div>
            <label className="text-xs font-bold text-gray-300 block">K</label>
            <input
              type="number"
              min="0"
              max="999"
              value={player.kills}
              onChange={(e) => {
                try {
                  updatePlayerStat(team, playerIndex, 'kills', e.target.value);
                } catch (err) {
                  console.error('Invalid kills value:', err);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-center font-mono text-white focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Deaths */}
          <div>
            <label className="text-xs font-bold text-gray-300 block">D</label>
            <input
              type="number"
              min="0"
              max="999"
              value={player.deaths}
              onChange={(e) => {
                try {
                  updatePlayerStat(team, playerIndex, 'deaths', e.target.value);
                } catch (err) {
                  console.error('Invalid deaths value:', err);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-center font-mono text-white focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Assists */}
          <div>
            <label className="text-xs font-bold text-gray-300 block">A</label>
            <input
              type="number"
              min="0"
              max="999"
              value={player.assists}
              onChange={(e) => {
                try {
                  updatePlayerStat(team, playerIndex, 'assists', e.target.value);
                } catch (err) {
                  console.error('Invalid assists value:', err);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-center font-mono text-white focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* KDA (Auto-calculated) */}
          <div>
            <label className="text-xs font-bold text-gray-300 block">KDA</label>
            <div className="bg-gray-600 border border-gray-500 rounded px-1 py-1 text-xs text-center font-mono text-white font-bold">
              {player.kda}
            </div>
          </div>

          {/* Damage */}
          <div>
            <label className="text-xs font-bold text-gray-300 block">DMG</label>
            <input
              type="number"
              min="0"
              max="999999"
              value={player.damage}
              onChange={(e) => {
                try {
                  updatePlayerStat(team, playerIndex, 'damage', e.target.value);
                } catch (err) {
                  console.error('Invalid damage value:', err);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-center font-mono text-white focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Healing */}
          <div>
            <label className="text-xs font-bold text-gray-300 block">HEAL</label>
            <input
              type="number"
              min="0"
              max="999999"
              value={player.healing}
              onChange={(e) => {
                try {
                  updatePlayerStat(team, playerIndex, 'healing', e.target.value);
                } catch (err) {
                  console.error('Invalid healing value:', err);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-center font-mono text-white focus:ring-1 focus:ring-red-500"
            />
          </div>

          {/* Blocked */}
          <div>
            <label className="text-xs font-bold text-gray-300 block">BLK</label>
            <input
              type="number"
              min="0"
              max="999999"
              value={player.blocked}
              onChange={(e) => {
                try {
                  updatePlayerStat(team, playerIndex, 'blocked', e.target.value);
                } catch (err) {
                  console.error('Invalid blocked value:', err);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-1 py-1 text-xs text-center font-mono text-white focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen || !match) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-8">
          <div className="text-white text-center">Loading match data...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ErrorDisplay />
      <ConflictResolutionModal />
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2">
        <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Compact Header */}
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 text-white p-3 z-10 rounded-t-xl border-b border-red-500">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <Play className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">
                  Live Control
                </h2>
                <div className="text-xs opacity-90">
                  {match.team1?.name || 'Team 1'} vs {match.team2?.name || 'Team 2'}
                </div>
              </div>
            </div>
            
            {/* Header Controls - Sync Status */}
            <div className="flex items-center gap-3">
              {isSyncing && (
                <div className="flex items-center gap-1 text-green-300 text-xs">
                  <div className="w-1 h-1 bg-green-300 rounded-full animate-pulse" />
                  Saving...
                </div>
              )}
              
              <button onClick={onClose} className="text-white hover:text-gray-200 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 bg-gray-900">
          {/* Match Status Bar */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3">
            <div className="grid grid-cols-3 gap-3 items-center text-center">
              {/* Team 1 */}
              <div>
                <div className="text-xs text-gray-400 mb-1">TEAM 1</div>
                <div className="font-bold text-sm text-white truncate">{match.team1?.name || 'Team 1'}</div>
                <div className="text-2xl font-bold text-red-400 mt-1">{matchData.team1Score}</div>
              </div>

              {/* VS & Status */}
              <div className="text-gray-400">
                <div className="text-lg font-bold">VS</div>
                <div className={`text-xs mt-1 px-2 py-1 rounded inline-flex items-center gap-1 ${
                  matchData.status === 'live' ? 'bg-red-900 text-red-300' : 'bg-gray-700 text-gray-400'
                }`}>
                  {matchData.status === 'live' && <div className="w-1 h-1 bg-red-400 rounded-full animate-pulse" />}
                  {matchData.status.toUpperCase()}
                </div>
                <div className="text-xs text-gray-500 mt-1">Map {matchData.currentMap}/{matchData.totalMaps}</div>
              </div>

              {/* Team 2 */}
              <div>
                <div className="text-xs text-gray-400 mb-1">TEAM 2</div>
                <div className="font-bold text-sm text-white truncate">{match.team2?.name || 'Team 2'}</div>
                <div className="text-2xl font-bold text-red-400 mt-1">{matchData.team2Score}</div>
              </div>
            </div>
          </div>

          {/* Map Control Panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-1">
                <Award className="w-4 h-4 text-yellow-400" />
                Map Control
              </h3>
              <div className="text-xs text-gray-400">
                BO{matchData.totalMaps}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Team 1 Map Control */}
              <div className="bg-gray-700 border border-red-600 rounded-lg p-2">
                <div className="text-center mb-2">
                  <h4 className="font-bold text-white text-sm mb-1">{match.team1?.name || 'Team 1'}</h4>
                  <div className="text-2xl font-bold text-red-400 mb-2">{matchData.team1MapScore}</div>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <button
                      onClick={() => updateMapScore(1, false)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateMapScore(1, true)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors"
                    >
                      +1
                    </button>
                  </div>
                  
                  <button
                    onClick={() => teamWinsMap(1)}
                    className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Trophy className="w-3 h-3" />
                    Win Map
                  </button>
                </div>
              </div>

              {/* Team 2 Map Control */}
              <div className="bg-gray-700 border border-red-600 rounded-lg p-2">
                <div className="text-center mb-2">
                  <h4 className="font-bold text-white text-sm mb-1">{match.team2?.name || 'Team 2'}</h4>
                  <div className="text-2xl font-bold text-red-400 mb-2">{matchData.team2MapScore}</div>
                  
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <button
                      onClick={() => updateMapScore(2, false)}
                      className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateMapScore(2, true)}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-bold transition-colors"
                    >
                      +1
                    </button>
                  </div>
                  
                  <button
                    onClick={() => teamWinsMap(2)}
                    className="w-full px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Trophy className="w-3 h-3" />
                    Win Map
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Player Stats */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mb-3">
            {/* Team 1 Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-1">
                  <Users className="w-4 h-4 text-red-400" />
                  {match.team1?.name || 'Team 1'}
                </h4>
                <div className="text-xs text-gray-400">6 Players</div>
              </div>
              
              <div className="space-y-2">
                {matchData.team1Players.map((player, i) => (
                  <PlayerRow key={player.id || i} player={player} team={1} playerIndex={i} />
                ))}
              </div>
            </div>

            {/* Team 2 Stats */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-1">
                  <Users className="w-4 h-4 text-red-400" />
                  {match.team2?.name || 'Team 2'}
                </h4>
                <div className="text-xs text-gray-400">6 Players</div>
              </div>
              
              <div className="space-y-2">
                {matchData.team2Players.map((player, i) => (
                  <PlayerRow key={player.id || i} player={player} team={2} playerIndex={i} />
                ))}
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Match Controls</h3>
              <div className="flex items-center gap-2">
                {isSyncing && (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse" />
                    Saving...
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Complete Match */}
              <button
                onClick={completeMatch}
                className="px-2 py-1 bg-green-700 hover:bg-green-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <Trophy className="w-3 h-3" />
                Complete
              </button>

              {/* Reset Stats */}
              <button
                onClick={resetStats}
                className="px-2 py-1 bg-yellow-700 hover:bg-yellow-800 text-white rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-2 p-2 bg-gray-700 rounded">
              <div className="text-center text-xs text-gray-400">
                <span className="text-green-400 font-medium">⚡ INSTANT SAVE - Last: {lastUpdate}</span>
                <div className="text-xs text-gray-500 mt-1">
                  Every change saves IMMEDIATELY to database
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

// Export wrapped component with error boundary
const WrappedSimplifiedLiveScoring = (props) => (
  <LiveScoringErrorBoundary>
    <SimplifiedLiveScoring {...props} />
  </LiveScoringErrorBoundary>
);

export default WrappedSimplifiedLiveScoring;