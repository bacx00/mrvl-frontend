import React, { useState, useEffect, useCallback } from 'react';

/**
 * LIVE SCORING SYNCHRONIZATION - Simple HTTP-based approach
 * This component handles synchronization between live scoring and match detail page
 * Uses HTTP POST and JSON ingestion like tracker.gg
 */
const LiveScoringSync = ({ matchId }) => {
  const [liveData, setLiveData] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [syncStatus, setSyncStatus] = useState('disconnected'); // disconnected, connected, syncing, error

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';

  // Fetch live data from backend
  const fetchLiveData = useCallback(async () => {
    if (!matchId) return;

    try {
      setSyncStatus('syncing');
      const response = await fetch(`${BACKEND_URL}/matches/${matchId}/live-scoreboard`);
      const result = await response.json();

      if (result.success) {
        setLiveData(result.data);
        setLastUpdate(new Date());
        setSyncStatus('connected');
        
        // Dispatch custom event for other components to listen to
        window.dispatchEvent(new CustomEvent('liveMatchUpdate', {
          detail: {
            matchId: matchId,
            data: result.data,
            timestamp: new Date()
          }
        }));
        
        console.log('✅ Live data synced successfully');
      } else {
        setSyncStatus('error');
        console.error('Failed to fetch live data:', result.message);
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Error fetching live data:', error);
    }
  }, [matchId, BACKEND_URL]);

  // Auto-sync every 3 seconds for live matches
  useEffect(() => {
    if (!matchId) return;

    // Initial fetch
    fetchLiveData();

    // Set up interval for live matches
    const interval = setInterval(() => {
      if (liveData?.match?.status === 'live') {
        fetchLiveData();
      }
    }, 3000); // 3 second intervals for live matches

    return () => clearInterval(interval);
  }, [matchId, fetchLiveData, liveData?.match?.status]);

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchLiveData();
  };

  // Sync status indicator component
  const SyncStatusIndicator = () => {
    const statusConfig = {
      disconnected: { color: 'text-gray-500', icon: '○', text: 'Disconnected' },
      connected: { color: 'text-green-500', icon: '●', text: 'Connected' },
      syncing: { color: 'text-yellow-500', icon: '◐', text: 'Syncing...' },
      error: { color: 'text-red-500', icon: '●', text: 'Error' }
    };

    const config = statusConfig[syncStatus] || statusConfig.disconnected;

    return (
      <div className="flex items-center space-x-2 text-sm">
        <span className={`${config.color} font-mono`}>{config.icon}</span>
        <span className={config.color}>{config.text}</span>
        {lastUpdate && (
          <span className="text-gray-400">
            • Last: {lastUpdate.toLocaleTimeString()}
          </span>
        )}
        <button
          onClick={handleManualRefresh}
          className="text-blue-400 hover:text-blue-300 ml-2"
          title="Manual refresh"
        >
          ↻
        </button>
      </div>
    );
  };

  return {
    liveData,
    syncStatus,
    lastUpdate,
    fetchLiveData,
    SyncStatusIndicator
  };
};

export default LiveScoringSync;