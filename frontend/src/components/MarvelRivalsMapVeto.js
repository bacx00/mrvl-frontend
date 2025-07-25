import React, { useState, useEffect } from 'react';
import { MARVEL_RIVALS_MAPS } from '../constants/marvelRivalsData';

function MarvelRivalsMapVeto({ 
  match, 
  onVetoComplete, 
  format = 'BO3',
  api,
  isAdmin 
}) {
  const [vetoState, setVetoState] = useState({
    phase: 'not_started', // not_started, team1_ban, team2_ban, team1_pick, team2_pick, complete
    bannedMaps: [],
    pickedMaps: [],
    currentTurn: null,
    history: []
  });
  
  const [availableMaps, setAvailableMaps] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [vetoStarted, setVetoStarted] = useState(false);

  // Get competitive maps only
  useEffect(() => {
    const competitiveMaps = MARVEL_RIVALS_MAPS.competitive || [];
    setAvailableMaps(competitiveMaps);
  }, []);

  // Determine number of maps needed based on format
  const getMapsNeeded = () => {
    switch (format) {
      case 'BO1': return 1;
      case 'BO3': return 3;
      case 'BO5': return 5;
      case 'BO7': return 7;
      default: return 3;
    }
  };

  // Start veto process
  const startVeto = () => {
    setVetoStarted(true);
    setVetoState({
      ...vetoState,
      phase: 'team1_ban',
      currentTurn: match.team1
    });
  };

  // Handle map selection (ban or pick)
  const handleMapAction = async (map, action) => {
    const newHistory = [...vetoState.history, {
      team: vetoState.currentTurn,
      action: action,
      map: map,
      timestamp: new Date()
    }];

    let newPhase = vetoState.phase;
    let newCurrentTurn = vetoState.currentTurn;
    let newBannedMaps = [...vetoState.bannedMaps];
    let newPickedMaps = [...vetoState.pickedMaps];

    if (action === 'ban') {
      newBannedMaps.push(map);
    } else if (action === 'pick') {
      newPickedMaps.push(map);
    }

    // Determine next phase
    const totalMaps = availableMaps.length;
    const mapsNeeded = getMapsNeeded();
    
    // Veto flow for BO3:
    // Team 1 bans -> Team 2 bans -> Team 1 picks -> Team 2 picks -> Team 1 picks (if needed)
    if (vetoState.phase === 'team1_ban') {
      newPhase = 'team2_ban';
      newCurrentTurn = match.team2;
    } else if (vetoState.phase === 'team2_ban') {
      if (newBannedMaps.length >= totalMaps - mapsNeeded) {
        newPhase = 'team1_pick';
        newCurrentTurn = match.team1;
      } else {
        newPhase = 'team1_ban';
        newCurrentTurn = match.team1;
      }
    } else if (vetoState.phase === 'team1_pick') {
      if (newPickedMaps.length >= mapsNeeded) {
        newPhase = 'complete';
      } else {
        newPhase = 'team2_pick';
        newCurrentTurn = match.team2;
      }
    } else if (vetoState.phase === 'team2_pick') {
      if (newPickedMaps.length >= mapsNeeded) {
        newPhase = 'complete';
      } else {
        newPhase = 'team1_pick';
        newCurrentTurn = match.team1;
      }
    }

    setVetoState({
      phase: newPhase,
      currentTurn: newCurrentTurn,
      bannedMaps: newBannedMaps,
      pickedMaps: newPickedMaps,
      history: newHistory
    });

    // If veto is complete, save the map pool
    if (newPhase === 'complete') {
      await saveMapPool(newPickedMaps);
    }
  };

  // Save map pool to backend
  const saveMapPool = async (maps) => {
    try {
      const mapData = maps.map((map, index) => ({
        map_name: map.name,
        mode: map.mode,
        map_number: index + 1,
        status: 'upcoming'
      }));

      await api.put(`/admin/matches/${match.id}`, {
        maps: mapData
      });

      if (onVetoComplete) {
        onVetoComplete(mapData);
      }
    } catch (error) {
      console.error('Error saving map pool:', error);
      alert('Failed to save map pool');
    }
  };

  // Check if map is available for action
  const isMapAvailable = (map) => {
    return !vetoState.bannedMaps.includes(map) && !vetoState.pickedMaps.includes(map);
  };

  // Get action text
  const getActionText = () => {
    if (vetoState.phase.includes('ban')) return 'Ban';
    if (vetoState.phase.includes('pick')) return 'Pick';
    return '';
  };

  if (!match.team1 || !match.team2) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Teams must be set before map veto</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Map Veto System
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {format} Format - {getMapsNeeded()} maps needed
        </p>
      </div>

      {/* Veto Status */}
      {vetoStarted && vetoState.phase !== 'complete' && (
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 text-center">
          <p className="text-lg font-medium text-purple-800 dark:text-purple-200">
            {vetoState.currentTurn?.name}'s turn to {getActionText()}
          </p>
        </div>
      )}

      {/* Map Grid */}
      {!vetoStarted ? (
        <div className="text-center">
          <button
            onClick={startVeto}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Start Map Veto
          </button>
        </div>
      ) : vetoState.phase === 'complete' ? (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <p className="text-lg font-medium text-green-800 dark:text-green-200 mb-2">
              Map Veto Complete!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Selected maps: {vetoState.pickedMaps.map(m => m.name).join(', ')}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {availableMaps.map((map) => {
            const isAvailable = isMapAvailable(map);
            const isBanned = vetoState.bannedMaps.includes(map);
            const isPicked = vetoState.pickedMaps.includes(map);
            
            return (
              <button
                key={map.id}
                onClick={() => {
                  if (isAvailable) {
                    const action = vetoState.phase.includes('ban') ? 'ban' : 'pick';
                    handleMapAction(map, action);
                  }
                }}
                disabled={!isAvailable || vetoState.phase === 'complete'}
                className={`
                  p-4 rounded-lg border-2 transition-all
                  ${isBanned ? 'border-red-500 bg-red-50 dark:bg-red-900/20 opacity-50' : ''}
                  ${isPicked ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : ''}
                  ${isAvailable && vetoState.phase !== 'complete' ? 
                    'border-gray-300 dark:border-gray-600 hover:border-purple-500 cursor-pointer' : 
                    'cursor-not-allowed'
                  }
                `}
              >
                <div className="text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{map.icon}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      map.mode === 'Domination' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                      map.mode === 'Convoy' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                      'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {map.mode}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{map.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{map.description}</p>
                  
                  {isBanned && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 font-medium">
                      Banned by {vetoState.history.find(h => h.map === map && h.action === 'ban')?.team.name}
                    </div>
                  )}
                  {isPicked && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                      Picked by {vetoState.history.find(h => h.map === map && h.action === 'pick')?.team.name}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Veto History */}
      {vetoState.history.length > 0 && (
        <div className="border-t pt-6">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Veto History</h4>
          <div className="space-y-2">
            {vetoState.history.map((entry, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{entry.team.name}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    entry.action === 'ban' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  }`}>
                    {entry.action.toUpperCase()}
                  </span>
                </div>
                <span className="text-gray-600 dark:text-gray-400">{entry.map.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MarvelRivalsMapVeto;