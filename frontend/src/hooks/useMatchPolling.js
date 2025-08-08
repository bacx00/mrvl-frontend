import { useEffect, useRef, useCallback } from 'react';

/**
 * Simple Match Polling Hook
 * Polls the match API every 2-3 seconds for live matches
 * Replaces WebSocket/Pusher functionality with simple HTTP polling
 */
export const useMatchPolling = (matchId, onMatchUpdate) => {
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const lastUpdateRef = useRef(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net';
  const POLLING_INTERVAL = 2500; // 2.5 seconds

  // Fetch match data from API
  const fetchMatchData = useCallback(async () => {
    if (!matchId) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/matches/${matchId}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('📡 Polling: Received match data:', data);

      // Check if data has changed since last update
      const currentDataString = JSON.stringify({
        status: data.status,
        team1_score: data.team1_score,
        team2_score: data.team2_score,
        current_map_number: data.current_map_number,
        maps_data: data.maps_data,
        player_stats: data.player_stats,
        match_timer: data.match_timer,
        hero_picks: data.hero_picks
      });

      if (lastUpdateRef.current !== currentDataString) {
        lastUpdateRef.current = currentDataString;
        
        // Trigger update callback with the data
        if (onMatchUpdate) {
          onMatchUpdate('match.updated', data);
        }
      }

    } catch (error) {
      console.error('❌ Polling: Error fetching match data:', error);
    }
  }, [matchId, BACKEND_URL, onMatchUpdate]);

  // Start polling for live matches
  const startPolling = useCallback((matchStatus) => {
    if (isPollingRef.current) return; // Already polling

    // Only poll for live matches
    if (matchStatus === 'live') {
      console.log('🔄 Starting polling for live match:', matchId);
      isPollingRef.current = true;
      
      // Initial fetch
      fetchMatchData();
      
      // Set up interval
      pollingIntervalRef.current = setInterval(fetchMatchData, POLLING_INTERVAL);
    }
  }, [matchId, fetchMatchData]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      console.log('⏹️ Stopping polling for match:', matchId);
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      isPollingRef.current = false;
    }
  }, [matchId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: isPollingRef.current,
    fetchMatchData
  };
};

export default useMatchPolling;