import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * WebSocket Hook for Live Bracket Updates
 * Handles real-time score updates and match status changes
 */
function useBracketWebSocket(eventId, options = {}) {
  const [liveScores, setLiveScores] = useState({});
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const heartbeatTimeoutRef = useRef(null);
  const lastPingRef = useRef(null);

  const {
    maxReconnectAttempts = 5,
    reconnectInterval = 3000,
    heartbeatInterval = 30000,
    url = process.env.REACT_APP_WS_URL || 'ws://localhost:8080',
    onMatchUpdate = null,
    onConnectionChange = null,
    enableHeartbeat = true
  } = options;

  // Clean up function
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Send heartbeat ping
  const sendHeartbeat = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      lastPingRef.current = Date.now();
      wsRef.current.send(JSON.stringify({
        type: 'ping',
        timestamp: lastPingRef.current
      }));
      
      // Schedule next heartbeat
      if (enableHeartbeat) {
        heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, heartbeatInterval);
      }
    }
  }, [enableHeartbeat, heartbeatInterval]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!eventId || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      cleanup();
      
      const wsUrl = `${url}/bracket/${eventId}`;
      console.log('[BracketWS] Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[BracketWS] Connected successfully');
        setConnected(true);
        setError(null);
        setReconnectAttempts(0);
        
        // Send subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          event_id: eventId,
          channels: ['match_updates', 'score_updates', 'bracket_changes']
        }));

        // Start heartbeat
        if (enableHeartbeat) {
          sendHeartbeat();
        }

        if (onConnectionChange) {
          onConnectionChange(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (err) {
          console.error('[BracketWS] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('[BracketWS] Connection closed:', event.code, event.reason);
        setConnected(false);
        
        if (onConnectionChange) {
          onConnectionChange(false);
        }

        // Auto-reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = reconnectInterval * Math.pow(1.5, reconnectAttempts);
          console.log(`[BracketWS] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1})`);
          
          setReconnectAttempts(prev => prev + 1);
          reconnectTimeoutRef.current = setTimeout(connect, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError(new Error('Max reconnection attempts reached'));
        }
      };

      ws.onerror = (error) => {
        console.error('[BracketWS] WebSocket error:', error);
        setError(new Error('WebSocket connection failed'));
      };

    } catch (err) {
      console.error('[BracketWS] Connection error:', err);
      setError(err);
    }
  }, [eventId, url, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onConnectionChange, enableHeartbeat, sendHeartbeat, cleanup]);

  // Handle incoming messages
  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'match_update':
        handleMatchUpdate(data);
        break;
      case 'score_update':
        handleScoreUpdate(data);
        break;
      case 'bracket_change':
        handleBracketChange(data);
        break;
      case 'pong':
        handlePong(data);
        break;
      case 'error':
        console.error('[BracketWS] Server error:', data.message);
        setError(new Error(data.message));
        break;
      default:
        console.log('[BracketWS] Unknown message type:', data.type);
    }
  }, []);

  // Handle match updates
  const handleMatchUpdate = useCallback((data) => {
    const { match_id, team1_score, team2_score, status, completed_at } = data;
    
    setLiveScores(prev => ({
      ...prev,
      [match_id]: {
        ...prev[match_id],
        team1_score,
        team2_score,
        status,
        completed_at,
        last_updated: Date.now()
      }
    }));

    // Notify callback
    if (onMatchUpdate) {
      onMatchUpdate(data);
    }

    console.log('[BracketWS] Match update:', data);
  }, [onMatchUpdate]);

  // Handle score updates
  const handleScoreUpdate = useCallback((data) => {
    const { match_id, team1_score, team2_score, round_scores } = data;
    
    setLiveScores(prev => ({
      ...prev,
      [match_id]: {
        ...prev[match_id],
        team1_score,
        team2_score,
        round_scores,
        last_updated: Date.now()
      }
    }));

    console.log('[BracketWS] Score update:', data);
  }, []);

  // Handle bracket structure changes
  const handleBracketChange = useCallback((data) => {
    console.log('[BracketWS] Bracket change:', data);
    // This would trigger a bracket refetch in the parent component
    if (onMatchUpdate) {
      onMatchUpdate({ type: 'bracket_change', ...data });
    }
  }, [onMatchUpdate]);

  // Handle pong response
  const handlePong = useCallback((data) => {
    if (lastPingRef.current && data.timestamp) {
      const latency = Date.now() - data.timestamp;
      console.log(`[BracketWS] Latency: ${latency}ms`);
    }
  }, []);

  // Manual score update (for admin use)
  const updateMatchScore = useCallback((matchId, scoreData) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'update_match',
        match_id: matchId,
        ...scoreData,
        timestamp: Date.now()
      }));
    }
  }, []);

  // Subscribe to additional channels
  const subscribe = useCallback((channels) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        event_id: eventId,
        channels: Array.isArray(channels) ? channels : [channels]
      }));
    }
  }, [eventId]);

  // Unsubscribe from channels
  const unsubscribe = useCallback((channels) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        event_id: eventId,
        channels: Array.isArray(channels) ? channels : [channels]
      }));
    }
  }, [eventId]);

  // Force reconnection
  const reconnect = useCallback(() => {
    setReconnectAttempts(0);
    connect();
  }, [connect]);

  // Initialize connection
  useEffect(() => {
    if (eventId) {
      connect();
    }

    return cleanup;
  }, [eventId, connect, cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    liveScores,
    connected,
    error,
    reconnectAttempts,
    maxReconnectAttempts,
    updateMatchScore,
    subscribe,
    unsubscribe,
    reconnect,
    
    // Connection stats
    stats: {
      reconnectAttempts,
      maxReconnectAttempts,
      connected,
      error: error?.message,
      lastUpdate: Math.max(...Object.values(liveScores).map(s => s.last_updated || 0), 0)
    }
  };
}

export default useBracketWebSocket;