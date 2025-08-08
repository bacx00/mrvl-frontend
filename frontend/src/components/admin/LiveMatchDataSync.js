import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

//  MARVEL RIVALS LIVE DATA SYNCHRONIZATION ENGINE
function LiveMatchDataSync({ match, onDataUpdate }) {
  const { api } = useAuth();
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(null);

  const SYNC_FREQUENCY = 10000;
  const BATCH_UPDATE_DELAY = 2000;

  const [liveMatchData, setLiveMatchData] = useState(() => ({
    matchId: match?.id,
    status: match?.status || 'upcoming',
    currentMap: 0,
    overallScore: {
      team1: match?.team1_score || 0,
      team2: match?.team2_score || 0
    },
    maps: [],
    lastUpdate: Date.now(),
    syncVersion: 1
  }));

  useEffect(() => {
    if (match && match.id) {
      initializeLiveData();
    }

    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [match]);

  useEffect(() => {
    if (autoSync && liveMatchData.status === 'live') {
      const interval = setInterval(() => {
        syncWithBackend();
      }, SYNC_FREQUENCY);
      
      setSyncInterval(interval);
      
      return () => clearInterval(interval);
    } else if (syncInterval) {
      clearInterval(syncInterval);
      setSyncInterval(null);
    }
  }, [autoSync, liveMatchData.status]);

  const initializeLiveData = async () => {
    try {
      setSyncStatus('syncing');
      
      const response = await api.get(`/matches/${match.id}`);
      const matchData = response.data || response;
      
      const marvelRivalsMaps = [
        {
          name: 'Tokyo 2099: Spider-Islands',
          mode: 'Convoy',
          maxRounds: 3,
          currentRound: 1
        },
        {
          name: 'Midtown Manhattan',
          mode: 'Domination',
          maxRounds: 3,
          currentRound: 1
        },
        {
          name: 'Wakanda Palace',
          mode: 'Convoy',
          maxRounds: 3,
          currentRound: 1
        }
      ];

      const initializedData = {
        matchId: match.id,
        status: matchData.status || 'upcoming',
        currentMap: 0,
        overallScore: {
          team1: matchData.team1_score || 0,
          team2: matchData.team2_score || 0
        },
        maps: marvelRivalsMaps.map((map, index) => ({
          ...map,
          mapIndex: index,
          status: 'not_started',
          score: { team1: 0, team2: 0 },
          duration: '00:00',
          winner: null,
          rounds: [],
          lastUpdate: Date.now()
        })),
        teams: {
          team1: {
            id: match.team1?.id,
            name: match.team1?.name,
            score: matchData.team1_score || 0
          },
          team2: {
            id: match.team2?.id,
            name: match.team2?.name,
            score: matchData.team2_score || 0
          }
        },
        lastUpdate: Date.now(),
        syncVersion: 1
      };

      setLiveMatchData(initializedData);
      setSyncStatus('success');
      setLastSync(new Date());
      
      if (onDataUpdate) {
        onDataUpdate(initializedData);
      }
      
    } catch (error) {
      console.error(' Failed to initialize live data:', error);
      setSyncStatus('error');
    }
  };

  const syncWithBackend = async (forceSync = false) => {
    if (!forceSync && syncStatus === 'syncing') return;
    
    try {
      setSyncStatus('syncing');
      
      if (liveMatchData.lastUpdate > (lastSync?.getTime() || 0)) {
        await pushUpdatesToBackend();
      }
      
      await pullUpdatesFromBackend();
      
      setSyncStatus('success');
      setLastSync(new Date());
      
    } catch (error) {
      console.error(' Sync failed:', error);
      setSyncStatus('error');
    }
  };

  const pushUpdatesToBackend = async () => {
    try {
      const updatePayload = {
        status: liveMatchData.status,
        team1_score: liveMatchData.overallScore.team1,
        team2_score: liveMatchData.overallScore.team2,
        current_map: liveMatchData.currentMap,
        maps_data: liveMatchData.maps,
        last_update: liveMatchData.lastUpdate,
        sync_version: liveMatchData.syncVersion + 1
      };

      await api.put(`/matches/${liveMatchData.matchId}/live-data`, updatePayload);
      
      setLiveMatchData(prev => ({
        ...prev,
        syncVersion: prev.syncVersion + 1
      }));
      
      console.log(' Live data pushed to backend successfully');
      
    } catch (error) {
      console.error(' Failed to push updates:', error);
      throw error;
    }
  };

  const pullUpdatesFromBackend = async () => {
    try {
      const response = await api.get(`/matches/${liveMatchData.matchId}/live-data`);
      const backendData = response.data || response;
      
      if (backendData.sync_version > liveMatchData.syncVersion) {
        console.log(' Backend has newer data, syncing...');
        
        setLiveMatchData(prev => ({
          ...prev,
          status: backendData.status || prev.status,
          overallScore: {
            team1: backendData.team1_score ?? prev.overallScore.team1,
            team2: backendData.team2_score ?? prev.overallScore.team2
          },
          currentMap: backendData.current_map ?? prev.currentMap,
          maps: backendData.maps_data || prev.maps,
          syncVersion: backendData.sync_version,
          lastUpdate: Date.now()
        }));
        
        if (onDataUpdate) {
          onDataUpdate(liveMatchData);
        }
      }
      
    } catch (error) {
      console.warn(' Failed to pull updates, continuing with local data:', error);
    }
  };

  const updateMapScore = async (mapIndex, team, score) => {
    const updatedMaps = [...liveMatchData.maps];
    updatedMaps[mapIndex].score[team] = score;
    updatedMaps[mapIndex].lastUpdate = Date.now();
    
    const team1Score = updatedMaps[mapIndex].score.team1;
    const team2Score = updatedMaps[mapIndex].score.team2;
    
    if (team1Score > team2Score) {
      updatedMaps[mapIndex].winner = 'team1';
    } else if (team2Score > team1Score) {
      updatedMaps[mapIndex].winner = 'team2';
    } else {
      updatedMaps[mapIndex].winner = null;
    }
    
    setLiveMatchData(prev => ({
      ...prev,
      maps: updatedMaps,
      lastUpdate: Date.now()
    }));
    
    setTimeout(() => syncWithBackend(true), BATCH_UPDATE_DELAY);
  };

  const updateMatchStatus = async (newStatus) => {
    setLiveMatchData(prev => ({
      ...prev,
      status: newStatus,
      lastUpdate: Date.now()
    }));
    
    await syncWithBackend(true);
  };

  const startMap = async (mapIndex) => {
    const updatedMaps = [...liveMatchData.maps];
    updatedMaps[mapIndex].status = 'live';
    updatedMaps[mapIndex].lastUpdate = Date.now();
    
    setLiveMatchData(prev => ({
      ...prev,
      maps: updatedMaps,
      currentMap: mapIndex,
      lastUpdate: Date.now()
    }));
    
    await syncWithBackend(true);
  };

  const completeMap = async (mapIndex, winner) => {
    const updatedMaps = [...liveMatchData.maps];
    updatedMaps[mapIndex].status = 'completed';
    updatedMaps[mapIndex].winner = winner;
    updatedMaps[mapIndex].lastUpdate = Date.now();
    
    const newOverallScore = { ...liveMatchData.overallScore };
    if (winner === 'team1') {
      newOverallScore.team1++;
    } else if (winner === 'team2') {
      newOverallScore.team2++;
    }
    
    setLiveMatchData(prev => ({
      ...prev,
      maps: updatedMaps,
      overallScore: newOverallScore,
      lastUpdate: Date.now()
    }));
    
    await syncWithBackend(true);
  };

  const renderSyncStatus = () => (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${
        syncStatus === 'success' ? 'bg-green-500 animate-pulse' :
        syncStatus === 'syncing' ? 'bg-yellow-500 animate-spin' :
        syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
      }`}></div>
      <span className="text-gray-600 dark:text-gray-400">
        {syncStatus === 'success' ? `Synced ${lastSync?.toLocaleTimeString()}` :
         syncStatus === 'syncing' ? 'Syncing...' :
         syncStatus === 'error' ? 'Sync Error' : 'Ready'}
      </span>
      <button
        onClick={() => setAutoSync(!autoSync)}
        className={`px-2 py-1 text-xs rounded ${
          autoSync ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}
      >
        Auto-sync {autoSync ? 'ON' : 'OFF'}
      </button>
      <button
        onClick={() => syncWithBackend(true)}
        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
      >
         Sync Now
      </button>
    </div>
  );

  return {
    liveMatchData,
    syncStatus,
    lastSync,
    syncWithBackend,
    setAutoSync,
    autoSync,
    updateMapScore,
    updateMatchStatus,
    startMap,
    completeMap,
    renderSyncStatus
  };
}

export default LiveMatchDataSync;
