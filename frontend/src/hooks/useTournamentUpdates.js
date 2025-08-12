import { useState, useEffect, useRef } from 'react';
import { useAuth } from './index';

/**
 * Custom hook for tournament real-time updates
 * Manages WebSocket connections, polling fallbacks, and state synchronization
 */
export function useTournamentUpdates(tournamentId, options = {}) {
  const {
    enableWebSocket = true,
    enablePolling = true,
    pollingInterval = 30000, // 30 seconds
    reconnectAttempts = 5,
    reconnectDelay = 3000,
    onMatchUpdate = null,
    onBracketUpdate = null,
    onTournamentUpdate = null,
    onError = null
  } = options;

  const { api } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const wsRef = useRef(null);
  const pollingIntervalRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  // Initialize connections when tournamentId changes
  useEffect(() => {
    if (!tournamentId) return;

    console.log('🔌 TournamentUpdates: Initializing for tournament', tournamentId);
    initializeConnections();

    return () => {
      cleanup();
    };
  }, [tournamentId]);

  const cleanup = () => {
    console.log('🧹 TournamentUpdates: Cleaning up connections');
    
    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Clear polling
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

  const initializeConnections = async () => {
    try {
      // Try WebSocket first if enabled
      if (enableWebSocket) {
        await initializeWebSocket();
      }
      
      // Initialize polling as backup or primary method
      if (enablePolling) {
        initializePolling();
      }
    } catch (error) {
      console.error('❌ TournamentUpdates: Failed to initialize connections:', error);
      handleError(error);
    }
  };

  const initializeWebSocket = async () => {
    try {
      // In a real implementation, this would connect to your WebSocket endpoint
      console.log('🔌 TournamentUpdates: Attempting WebSocket connection');
      
      // For now, we'll simulate WebSocket with a mock connection
      // In production, replace with actual WebSocket URL
      const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8080'}/tournaments/${tournamentId}`;
      
      // Since we don't have a real WebSocket server, we'll skip this for now
      // and use polling as the primary method
      console.log('⚠️ TournamentUpdates: WebSocket not implemented, using polling');
      setConnectionStatus('polling-only');
      
    } catch (error) {
      console.error('❌ TournamentUpdates: WebSocket connection failed:', error);
      setConnectionStatus('polling-fallback');
    }
  };

  const initializePolling = () => {
    console.log('📡 TournamentUpdates: Starting polling with interval', pollingInterval);
    
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Initial fetch
    fetchTournamentUpdates();
    
    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        fetchTournamentUpdates();
      }
    }, pollingInterval);
    
    setIsConnected(true);
    setConnectionStatus('polling');
  };

  const fetchTournamentUpdates = async () => {
    try {
      console.log('🔄 TournamentUpdates: Fetching latest data');
      
      // Get tournament with latest data
      const response = await api.get(`/events/${tournamentId}?include=teams,matches,bracket&timestamp=${Date.now()}`);
      const tournamentData = response.data?.data || response.data;
      
      if (!mountedRef.current) return;
      
      // Check if data has changed by comparing timestamps or content
      const currentTime = new Date().toISOString();
      const hasUpdates = !lastUpdateTime || 
        (tournamentData.updated_at && new Date(tournamentData.updated_at) > new Date(lastUpdateTime));
      
      if (hasUpdates) {
        console.log('✨ TournamentUpdates: New updates detected');
        setLastUpdateTime(currentTime);
        
        // Create update object
        const updateData = {
          type: 'tournament-sync',
          timestamp: currentTime,
          tournament: tournamentData,
          matches: tournamentData.matches || [],
          bracket: tournamentData.bracket,
          teams: tournamentData.teams || []
        };
        
        // Add to updates history (keep last 10)
        setUpdates(prev => [...prev.slice(-9), updateData]);
        
        // Trigger callbacks
        if (onTournamentUpdate) {
          onTournamentUpdate(updateData);
        }
        
        // Check for specific match updates
        if (tournamentData.matches) {
          const liveMatches = tournamentData.matches.filter(m => m.status === 'live');
          const recentlyCompletedMatches = tournamentData.matches.filter(m => 
            m.status === 'completed' && 
            m.updated_at && 
            new Date(m.updated_at) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          );
          
          [...liveMatches, ...recentlyCompletedMatches].forEach(match => {
            if (onMatchUpdate) {
              onMatchUpdate({
                type: 'match-update',
                match,
                timestamp: currentTime
              });
            }
          });
        }
        
        // Check for bracket updates
        if (tournamentData.bracket && onBracketUpdate) {
          onBracketUpdate({
            type: 'bracket-update',
            bracket: tournamentData.bracket,
            timestamp: currentTime
          });
        }
      }
      
    } catch (error) {
      console.error('❌ TournamentUpdates: Error fetching updates:', error);
      handleError(error);
    }
  };

  const handleError = (error) => {
    console.error('❌ TournamentUpdates: Error occurred:', error);
    
    if (onError) {
      onError(error);
    }
    
    // Attempt to reconnect if not too many attempts
    if (reconnectAttemptsRef.current < reconnectAttempts) {
      reconnectAttemptsRef.current++;
      console.log(`🔄 TournamentUpdates: Attempting reconnection ${reconnectAttemptsRef.current}/${reconnectAttempts}`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          initializeConnections();
        }
      }, reconnectDelay);
      
      setConnectionStatus('reconnecting');
    } else {
      console.error('❌ TournamentUpdates: Max reconnection attempts reached');
      setConnectionStatus('failed');
      setIsConnected(false);
    }
  };

  // Manual refresh function
  const refresh = () => {
    console.log('🔄 TournamentUpdates: Manual refresh triggered');
    fetchTournamentUpdates();
  };

  // Reconnect function
  const reconnect = () => {
    console.log('🔄 TournamentUpdates: Manual reconnection triggered');
    reconnectAttemptsRef.current = 0;
    cleanup();
    initializeConnections();
  };

  return {
    isConnected,
    connectionStatus,
    lastUpdateTime,
    updates,
    refresh,
    reconnect
  };
}

/**
 * Custom hook specifically for live match updates
 */
export function useMatchUpdates(matchId, onUpdate) {
  const { api } = useAuth();
  const [match, setMatch] = useState(null);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        const response = await api.get(`/matches/${matchId}`);
        const matchData = response.data?.data || response.data;
        
        if (!mountedRef.current) return;
        
        setMatch(matchData);
        const matchIsLive = matchData.status === 'live';
        setIsLive(matchIsLive);
        
        if (onUpdate) {
          onUpdate(matchData);
        }
        
        // Set up live polling if match is live
        if (matchIsLive && !intervalRef.current) {
          intervalRef.current = setInterval(fetchMatch, 10000); // 10 second updates for live matches
        } else if (!matchIsLive && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
      } catch (error) {
        console.error('❌ MatchUpdates: Error fetching match:', error);
      }
    };

    fetchMatch();
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [matchId, onUpdate, api]);

  return {
    match,
    isLive,
    refresh: () => {
      // Trigger immediate update
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Will be restarted by the effect
    }
  };
}

/**
 * Custom hook for bracket updates
 */
export function useBracketUpdates(tournamentId, format) {
  const { api } = useAuth();
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const fetchBracket = async () => {
    if (!tournamentId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/events/${tournamentId}/bracket`);
      const bracketData = response.data?.data || response.data;
      
      setBracket(bracketData);
      setLastUpdate(new Date().toISOString());
    } catch (error) {
      console.error('❌ BracketUpdates: Error fetching bracket:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBracket();
  }, [tournamentId]);

  return {
    bracket,
    loading,
    lastUpdate,
    refresh: fetchBracket
  };
}

/**
 * Tournament statistics updates hook
 */
export function useTournamentStats(tournamentId) {
  const { api } = useAuth();
  const [stats, setStats] = useState({
    totalMatches: 0,
    completedMatches: 0,
    liveMatches: 0,
    totalTeams: 0,
    completionPercentage: 0,
    averageMatchDuration: 0,
    topPerformers: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tournamentId) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch tournament with matches and teams
        const response = await api.get(`/events/${tournamentId}?include=matches,teams`);
        const tournament = response.data?.data || response.data;
        
        const matches = tournament.matches || [];
        const teams = tournament.teams || [];
        
        const completedMatches = matches.filter(m => m.status === 'completed');
        const liveMatches = matches.filter(m => m.status === 'live');
        
        const calculatedStats = {
          totalMatches: matches.length,
          completedMatches: completedMatches.length,
          liveMatches: liveMatches.length,
          totalTeams: teams.length,
          completionPercentage: matches.length > 0 ? (completedMatches.length / matches.length) * 100 : 0,
          averageMatchDuration: calculateAverageMatchDuration(completedMatches),
          topPerformers: calculateTopPerformers(matches, teams)
        };
        
        setStats(calculatedStats);
      } catch (error) {
        console.error('❌ TournamentStats: Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tournamentId, api]);

  return { stats, loading };
}

// Helper functions
const calculateAverageMatchDuration = (matches) => {
  const completedWithDuration = matches.filter(m => m.start_time && m.end_time);
  if (completedWithDuration.length === 0) return 0;
  
  const totalDuration = completedWithDuration.reduce((total, match) => {
    const duration = new Date(match.end_time) - new Date(match.start_time);
    return total + duration;
  }, 0);
  
  return Math.round(totalDuration / completedWithDuration.length / (1000 * 60)); // minutes
};

const calculateTopPerformers = (matches, teams) => {
  const teamStats = {};
  
  // Initialize team stats
  teams.forEach(team => {
    teamStats[team.id] = {
      team,
      wins: 0,
      losses: 0,
      mapsWon: 0,
      mapsLost: 0
    };
  });
  
  // Calculate stats from matches
  matches.filter(m => m.status === 'completed').forEach(match => {
    const team1Score = match.team1_score || 0;
    const team2Score = match.team2_score || 0;
    
    if (match.team1?.id && teamStats[match.team1.id]) {
      teamStats[match.team1.id].mapsWon += team1Score;
      teamStats[match.team1.id].mapsLost += team2Score;
      if (team1Score > team2Score) {
        teamStats[match.team1.id].wins++;
      } else {
        teamStats[match.team1.id].losses++;
      }
    }
    
    if (match.team2?.id && teamStats[match.team2.id]) {
      teamStats[match.team2.id].mapsWon += team2Score;
      teamStats[match.team2.id].mapsLost += team1Score;
      if (team2Score > team1Score) {
        teamStats[match.team2.id].wins++;
      } else {
        teamStats[match.team2.id].losses++;
      }
    }
  });
  
  // Sort by win rate and return top 3
  return Object.values(teamStats)
    .filter(stats => stats.wins + stats.losses > 0)
    .sort((a, b) => {
      const winRateA = a.wins / (a.wins + a.losses);
      const winRateB = b.wins / (b.wins + b.losses);
      return winRateB - winRateA;
    })
    .slice(0, 3);
};

export default useTournamentUpdates;