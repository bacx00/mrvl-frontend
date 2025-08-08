import { useEffect, useRef, useCallback } from 'react';

/**
 * Real-time Match WebSocket Hook
 * Connects to match-specific channels for live scoring updates
 * Compatible with Pusher and native WebSocket connections
 */
export const useMatchWebSocket = (matchId, onMatchUpdate) => {
  const wsRef = useRef(null);
  const pusherRef = useRef(null);
  const connectionAttemptsRef = useRef(0);
  const maxConnectionAttempts = 5;
  const reconnectIntervalRef = useRef(null);

  // WebSocket connection handler
  const connectWebSocket = useCallback(() => {
    if (!matchId || connectionAttemptsRef.current >= maxConnectionAttempts) {
      return;
    }

    try {
      // Try Pusher connection first (if available)
      if (window.Pusher && process.env.REACT_APP_PUSHER_KEY) {
        console.log(`Connecting to Pusher for match ${matchId}...`);
        
        const pusher = new window.Pusher(process.env.REACT_APP_PUSHER_KEY, {
          cluster: process.env.REACT_APP_PUSHER_CLUSTER || 'us2',
          encrypted: true,
          authEndpoint: `${process.env.REACT_APP_BACKEND_URL}/api/broadcasting/auth`,
          auth: {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        });

        const matchChannel = pusher.subscribe(`match.${matchId}`);
        
        // Listen for all match update events (exact event names from backend)
        matchChannel.bind('match.map.updated', (data) => {
          console.log('Received match map update:', data);
          onMatchUpdate && onMatchUpdate('match.map.updated', data);
        });

        matchChannel.bind('match.started', (data) => {
          console.log('Received match started:', data);
          onMatchUpdate && onMatchUpdate('match.started', data);
        });

        matchChannel.bind('match.paused', (data) => {
          console.log('Received match paused:', data);
          onMatchUpdate && onMatchUpdate('match.paused', data);
        });

        matchChannel.bind('match.resumed', (data) => {
          console.log('Received match resumed:', data);
          onMatchUpdate && onMatchUpdate('match.resumed', data);
        });

        pusher.connection.bind('connected', () => {
          console.log('Pusher connected successfully');
          connectionAttemptsRef.current = 0; // Reset on successful connection
        });

        pusher.connection.bind('error', (err) => {
          console.error('Pusher connection error:', err);
          connectionAttemptsRef.current++;
          // Fall back to native WebSocket
          connectNativeWebSocket();
        });

        pusherRef.current = pusher;
        return;
      }

      // Fallback to native WebSocket
      connectNativeWebSocket();

    } catch (error) {
      console.error('Error setting up WebSocket connection:', error);
      connectionAttemptsRef.current++;
      
      // Retry connection after delay
      if (connectionAttemptsRef.current < maxConnectionAttempts) {
        reconnectIntervalRef.current = setTimeout(() => {
          connectWebSocket();
        }, Math.pow(2, connectionAttemptsRef.current) * 1000); // Exponential backoff
      }
    }
  }, [matchId, onMatchUpdate]);

  // Native WebSocket fallback
  const connectNativeWebSocket = useCallback(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${process.env.REACT_APP_BACKEND_URL?.replace(/^https?:\/\//, '')}/ws/matches/${matchId}`;
    
    console.log(`Connecting to native WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log(`WebSocket connected to match ${matchId}`);
      connectionAttemptsRef.current = 0; // Reset on successful connection
      
      // Send authentication if token is available
      const token = localStorage.getItem('token');
      if (token) {
        ws.send(JSON.stringify({
          type: 'auth',
          token: token
        }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('WebSocket message received:', data);
        
        if (data.event_type && onMatchUpdate) {
          onMatchUpdate(data.event_type, data.data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      connectionAttemptsRef.current++;
    };

    ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      
      // Reconnect if not intentionally closed
      if (event.code !== 1000 && connectionAttemptsRef.current < maxConnectionAttempts) {
        reconnectIntervalRef.current = setTimeout(() => {
          connectWebSocket();
        }, Math.pow(2, connectionAttemptsRef.current) * 1000); // Exponential backoff
      }
    };

    wsRef.current = ws;
  }, [matchId, onMatchUpdate]);

  // Initialize connection
  useEffect(() => {
    if (matchId) {
      connectWebSocket();
    }

    // Cleanup function
    return () => {
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
      }
      
      if (pusherRef.current) {
        pusherRef.current.disconnect();
        pusherRef.current = null;
      }
      
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [matchId, connectWebSocket]);

  // Send message function (for two-way communication)
  const sendMessage = useCallback((eventType, data) => {
    const message = {
      event_type: eventType,
      match_id: matchId,
      data: data,
      timestamp: new Date().toISOString()
    };

    if (pusherRef.current && pusherRef.current.connection.state === 'connected') {
      // Pusher doesn't support client-to-server messages directly
      // Use HTTP API instead
      console.log('Pusher connected, sending via HTTP API');
      return;
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      console.log('Message sent via WebSocket:', message);
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, [matchId]);

  return {
    sendMessage,
    isConnected: pusherRef.current?.connection?.state === 'connected' || 
                 wsRef.current?.readyState === WebSocket.OPEN,
    connectionType: pusherRef.current ? 'pusher' : 'websocket'
  };
};

export default useMatchWebSocket;