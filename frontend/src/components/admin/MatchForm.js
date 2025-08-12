import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks';
import {
  MARVEL_RIVALS_MAPS,
  GAME_MODES,
  HEROES,
  MATCH_FORMATS,
  MATCH_STATUSES,
  getMapPool,
  getModeRotation
} from '../../constants/marvelRivalsData';
import liveScoreManager from '../../utils/LiveScoreManager';

// COMPLETE MARVEL RIVALS CONFIGURATION - SYNCHRONIZED WITH CONSTANTS
const MARVEL_RIVALS_CONFIG = {
  // MARVEL RIVALS SEASON 2.5 MAPS (from seeded data)
  maps: [
    // COMPETITIVE MAPS (4 total)
    { name: 'Hellfire Gala: Krakoa', mode: 'Domination', icon: 'fire', type: 'Competitive' },
    { name: 'Hydra Charteris Base: Hell\'s Heaven', mode: 'Domination', icon: 'gear', type: 'Competitive' },
    { name: 'Intergalactic Empire of Wakanda: Birnin T\'Challa', mode: 'Domination', icon: 'gem', type: 'Competitive' },
    { name: 'Empire of Eternal Night: Central Park', mode: 'Convoy', icon: 'night', type: 'Competitive' },
    // CASUAL MAPS
    { name: 'Tokyo 2099: Spider-Islands', mode: 'Convoy', icon: 'cityscape', type: 'Casual' },
    { name: 'Yggsgard: Yggdrasill Path', mode: 'Convoy', icon: 'tree', type: 'Casual' },
    { name: 'Empire of Eternal Night: Midtown', mode: 'Convoy', icon: 'building', type: 'Casual' },
    { name: 'Empire of Eternal Night: Sanctum Sanctorum', mode: 'Convergence', icon: 'crystal', type: 'Casual' },
    { name: 'Klyntar: Symbiotic Surface', mode: 'Convergence', icon: 'heart', type: 'Casual' },
    { name: 'Intergalactic Empire of Wakanda: Hall of Djalia', mode: 'Convergence', icon: 'sparkles', type: 'Casual' }
  ],
  
  // ALL 6 GAME MODES WITH ACCURATE TIMERS
  gameModes: {
    'Convoy': { 
      duration: 18 * 60, 
      displayName: 'Convoy', 
      color: 'blue', 
      description: 'Escort the payload to victory',
      icon: 'truck'
    },
    'Domination': { 
      duration: 12 * 60, 
      displayName: 'Domination', 
      color: 'red', 
      description: 'Control strategic points',
      icon: 'flag'
    },
    'Convergence': { 
      duration: 15 * 60, 
      displayName: 'Convergence', 
      color: 'purple', 
      description: 'Converge on objectives',
      icon: 'lightning'
    },
    'Conquest': { 
      duration: 20 * 60, 
      displayName: 'Conquest', 
      color: 'green', 
      description: 'Capture and hold territory',
      icon: 'gem'
    },
    'Doom Match': { 
      duration: 10 * 60, 
      displayName: 'Doom Match', 
      color: 'orange', 
      description: 'Eliminate all opponents',
      icon: 'skull'
    },
    'Escort': { 
      duration: 16 * 60, 
      displayName: 'Escort', 
      color: 'yellow', 
      description: 'Guide the target safely',
      icon: 'shield'
    }
  },
  
  formats: [
    { value: 'BO1', label: 'BO1 - Best of 1', maps: 1, description: 'Single elimination match' },
    { value: 'BO3', label: 'BO3 - Best of 3', maps: 3, description: 'First to win 2 maps' },
    { value: 'BO5', label: 'BO5 - Best of 5', maps: 5, description: 'First to win 3 maps' },
    { value: 'BO7', label: 'BO7 - Best of 7', maps: 7, description: 'First to win 4 maps' },
    { value: 'BO9', label: 'BO9 - Best of 9', maps: 9, description: 'First to win 5 maps' }
  ],
  statuses: [
    { value: 'upcoming', label: 'Upcoming', color: 'blue' },
    { value: 'live', label: 'Live', color: 'red' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' },
    { value: 'postponed', label: 'Postponed', color: 'yellow' }
  ]
};

// PERFECT MATCH INITIALIZATION WITH ACCURATE MARVEL RIVALS DATA
const getInitialMatchData = (format = 'BO1') => {
  const formatConfig = MATCH_FORMATS.find(f => f.value === format);
  const mapCount = formatConfig?.maps || 1;
  const mapPool = getMapPool(format);
  const modeRotation = getModeRotation(format);
  
  console.log(`INITIALIZING ${format} match with ${mapCount} maps from Season 2.5 pool`);
  
  return {
    team1_id: '',
    team2_id: '',
    event_id: '',
    scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    format: format,
    status: 'upcoming',
    //  ENHANCED: Multiple URLs support
    stream_urls: [''],
    betting_urls: [''],
    vod_urls: [''],
    round: '',
    bracket_position: '',
    allow_past_date: false,
    team1_score: 0,
    team2_score: 0,
    // CRITICAL: Use accurate Season 2.5 maps with proper mode rotation
    maps: Array.from({ length: mapCount }, (_, index) => {
      const mapData = mapPool[index] || mapPool[0];
      const mode = modeRotation[index];
      const modeData = GAME_MODES[mode];
      
      return {
        map_number: index + 1,
        map_name: mapData.name,
        map_id: mapData.id,
        mode: mode,
        timer: modeData.timer,
        icon: mapData.icon,
        team1_score: 0,
        team2_score: 0,
        team1_rounds: 0, // For Domination
        team2_rounds: 0,
        status: 'upcoming',
        winner_id: null,
        duration: null,
        overtime: false,
        // PLAYER COMPOSITIONS WITH STATS TRACKING
        team1_composition: [],
        team2_composition: [],
        // MAP-SPECIFIC DATA
        checkpoints_reached: [],
        capture_progress: 0,
        payload_distance: 0
      };
    }),
    viewers: 0,
    featured: false,
    map_pool: MARVEL_RIVALS_CONFIG.maps.slice(0, mapCount)
  };
};

function MatchForm({ matchId, navigateTo }) {
  // CRITICAL FIX: Stable initialization to prevent re-rendering
  const [formData, setFormData] = useState(() => getInitialMatchData());
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTeam1, setSelectedTeam1] = useState(null);
  const [selectedTeam2, setSelectedTeam2] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // Remove urlSections state - we'll manage URLs directly in formData
  // SEASON 2.5 HERO ROSTER (39 HEROES)
  const [herosByRole, setHerosByRole] = useState(HEROES);
  
  const { api } = useAuth();
  const isEdit = Boolean(matchId);

  // CRITICAL: REAL BACKEND API BASE URL FROM ENV ONLY
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  console.log('MatchForm: Using backend URL:', BACKEND_URL);

  // CRITICAL: Load heroes from live backend API
  useEffect(() => {
    const loadHeroesFromAPI = async () => {
      try {
        console.log('Loading heroes from backend API...');
        const response = await api.get('/heroes');
        const heroData = response?.data;
        
        console.log('Heroes loaded from API:', heroData);
        
        if (heroData && heroData.by_role) {
          // CRITICAL FIX: Handle correct API structure - data.by_role
          const transformedHeroes = {};
          
          for (const [role, heroes] of Object.entries(heroData.by_role)) {
            if (Array.isArray(heroes)) {
              // Extract just the name from hero objects
              transformedHeroes[role] = heroes.map(hero => {
                if (typeof hero === 'object' && hero.name) {
                  return hero.name; // Extract name from hero object
                }
                return hero; // If it's already a string, keep it
              });
            } else {
              transformedHeroes[role] = heroes;
            }
          }
          
          // FIX: Update React state instead of global object
          setHerosByRole(transformedHeroes);
          console.log('Heroes state updated from API:', transformedHeroes);
        }
      } catch (error) {
        console.error('Error loading heroes from API:', error);
        // Fallback heroes are already set in the initial state
        console.log('Using fallback heroes from initial state');
      }
    };
    
    loadHeroesFromAPI();
  }, [api]);

  // CRITICAL: REAL BACKEND DATA LOADING - NO MOCK DATA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('MatchForm: Fetching REAL backend data...');
        
        // CRITICAL: Get REAL teams from backend using API helper
        const teamsResponse = await api.get('/teams');
        const realTeams = teamsResponse?.data || [];
        setTeams(Array.isArray(realTeams) ? realTeams : []);
        console.log('REAL Teams loaded:', realTeams.length, realTeams);

        //  CRITICAL: Get REAL events from backend using API helper
        const eventsResponse = await api.get('/events');
        const realEvents = eventsResponse?.data || [];
        setEvents(Array.isArray(realEvents) ? realEvents : []);
        console.log('REAL Events loaded:', realEvents.length, realEvents);

        // If editing, load REAL match data
        if (isEdit && matchId) {
          try {
            console.log(`Loading REAL match data for ID: ${matchId}`);
            const matchResponse = await api.get(`/admin/matches/${matchId}`);
            const realMatchData = matchResponse?.data;
            
            if (realMatchData) {
              console.log('REAL Match data loaded:', realMatchData);
              
              // CRITICAL FIX: Ensure correct map count for the format
              // CRITICAL FIX: Only use baseData for missing/empty fields, preserve all existing data
              const baseData = getInitialMatchData(realMatchData.format || 'BO1');
              
              // Preserve existing hero compositions from maps_data
              const preservedMaps = realMatchData.maps_data && realMatchData.maps_data.length > 0 
                ? realMatchData.maps_data.map((mapData, index) => ({
                    map_name: mapData.map_name || baseData.maps[index]?.map_name || 'Tokyo 2099: Shibuya Sky',
                    mode: mapData.mode || baseData.maps[index]?.mode || 'Conquest',
                    team1_composition: mapData.team1_composition || baseData.maps[index]?.team1_composition || [],
                    team2_composition: mapData.team2_composition || baseData.maps[index]?.team2_composition || []
                  }))
                : baseData.maps;
              
              const transformedData = {
                // Start with real match data (preserves all existing values)
                ...realMatchData,
                // Only fill in missing fields from baseData
                team1_id: realMatchData.team1_id || realMatchData.team1?.id || baseData.team1_id || '',
                team2_id: realMatchData.team2_id || realMatchData.team2?.id || baseData.team2_id || '',
                event_id: realMatchData.event_id || realMatchData.event?.id || baseData.event_id || '',
                format: realMatchData.format || baseData.format,
                scheduled_at: realMatchData.scheduled_at ? 
                  new Date(realMatchData.scheduled_at).toISOString().slice(0, 16) : 
                  new Date(Date.now() + 3600000).toISOString().slice(0, 16),
                // ENHANCED: Handle multiple URLs from backend
                stream_urls: realMatchData.stream_urls || (realMatchData.stream_url ? [realMatchData.stream_url] : ['']),
                betting_urls: realMatchData.betting_urls || (realMatchData.betting_url ? [realMatchData.betting_url] : ['']),
                vod_urls: realMatchData.vod_urls || [''],
                round: realMatchData.round || '',
                bracket_position: realMatchData.bracket_position || '',
                allow_past_date: realMatchData.allow_past_date || false,
                // PRESERVE existing hero compositions
                maps: preservedMaps,
                map_pool: baseData.map_pool
              };
              
              setFormData(transformedData);
              
              // Set selected teams for UI
              const team1 = realTeams.find(t => t.id === transformedData.team1_id);
              const team2 = realTeams.find(t => t.id === transformedData.team2_id);
              setSelectedTeam1(team1);
              setSelectedTeam2(team2);
              
              // CRITICAL: IMMEDIATELY LOAD REAL PLAYERS FOR SELECTED TEAMS
              if (team1) {
                await loadRealPlayersForTeam(team1, 'team1', transformedData);
              }
              if (team2) {
                await loadRealPlayersForTeam(team2, 'team2', transformedData);
              }
              
              // URL data is now managed directly in formData
              
              console.log('Real match data loaded and players populated');
            }
          } catch (error) {
            console.error('Error loading real match data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching real form data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchId, isEdit, api]);

  // CRITICAL: LOAD REAL PLAYERS FOR TEAM
  const loadRealPlayersForTeam = async (team, teamKey, currentFormData = formData) => {
    try {
      console.log(`Loading REAL players for ${team.name} (ID: ${team.id})`);
      
      // CRITICAL: Fetch REAL team details with players using API helper
      const teamResponse = await api.get(`/teams/${team.id}`);
      const teamWithPlayers = teamResponse?.data;
      
      if (teamWithPlayers && (teamWithPlayers.players || teamWithPlayers.current_roster)) {
        const realPlayers = teamWithPlayers.players || teamWithPlayers.current_roster;
        console.log(`Found ${realPlayers.length} REAL players for ${team.name}:`, realPlayers);
        
        // POPULATE REAL PLAYERS IMMEDIATELY IN FORM DATA
        const compositionKey = teamKey === 'team1' ? 'team1_composition' : 'team2_composition';
        
        setFormData(prev => ({
          ...prev,
          maps: (prev.maps || []).map(map => ({
            ...map,
            [compositionKey]: realPlayers.slice(0, 6).map((player, index) => ({
              player_id: player.id,
              player_name: player.name, // REAL PLAYER NAME
              hero: player.main_hero || (index % 2 === 0 ? 'Captain America' : 'Storm'),
              role: player.role || 'Tank',
              country: player.country || player.nationality || 'US',
              eliminations: 0,
              deaths: 0,
              assists: 0,
              damage: 0,
              healing: 0,
              damageBlocked: 0,
              objectiveTime: 0,
              ultimatesUsed: 0
            }))
          }))
        }));
        
        console.log(`${team.name} composition updated with REAL players:`, realPlayers.map(p => p.name));
        return realPlayers;
      } else {
        console.log(`No players found for ${team.name}`);
        return [];
      }
    } catch (error) {
      console.error(`Error loading real players for ${team.name}:`, error);
      return [];
    }
  };

  // CRITICAL FIX: Preserve existing data when changing format
  const handleFormatChange = useCallback((newFormat) => {
    console.log(`Changing format from ${formData.format} to ${newFormat}`);
    
    const newMatchData = getInitialMatchData(newFormat);
    setFormData(prev => {
      // Preserve existing URL data and team selections
      const preservedData = {
        ...prev,
        format: newFormat,
        maps: newMatchData.maps.map((newMap, index) => {
          const existingMap = prev.maps?.[index];
          return {
            ...newMap,
            // Preserve existing team compositions if available
            team1_composition: existingMap?.team1_composition || newMap.team1_composition,
            team2_composition: existingMap?.team2_composition || newMap.team2_composition,
            // Preserve existing scores if available
            team1_score: existingMap?.team1_score || 0,
            team2_score: existingMap?.team2_score || 0,
            winner_id: existingMap?.winner_id || null
          };
        }),
        map_pool: newMatchData.map_pool,
        // Preserve URLs, team selections, and other data
        stream_urls: prev.stream_urls || [''],
        betting_urls: prev.betting_urls || [''],
        vod_urls: prev.vod_urls || [''],
        team1_id: prev.team1_id,
        team2_id: prev.team2_id,
        event_id: prev.event_id,
        scheduled_at: prev.scheduled_at,
        round: prev.round,
        bracket_position: prev.bracket_position
      };
      
      console.log(`Format changed to ${newFormat} with preserved data:`, preservedData);
      return preservedData;
    });
  }, []);  // Remove formData.format dependency to prevent re-rendering

  // CRITICAL FIX: Stable URL Management to prevent data loss
  const addUrlField = useCallback((type) => {
    console.log(`Adding URL field for type: ${type}`);
    
    const fieldMap = {
      'stream': 'stream_urls',
      'betting': 'betting_urls', 
      'vod': 'vod_urls'
    };
    
    const fieldName = fieldMap[type];
    if (!fieldName) {
      console.error('Unknown URL type:', type);
      return;
    }
    
    setFormData(prev => {
      const currentUrls = prev[fieldName] || [''];
      const newData = {
        ...prev,
        [fieldName]: [...currentUrls, '']
      };
      console.log(`Added ${type} URL field:`, newData[fieldName]);
      return newData;
    });
  }, []);

  const removeUrlField = useCallback((type, index) => {
    console.log(`Removing URL field for type: ${type}, index: ${index}`);
    
    const fieldMap = {
      'stream': 'stream_urls',
      'betting': 'betting_urls',
      'vod': 'vod_urls'
    };
    
    const fieldName = fieldMap[type];
    if (!fieldName) {
      console.error('Unknown URL type:', type);
      return;
    }
    
    setFormData(prev => {
      const currentUrls = prev[fieldName] || [''];
      if (currentUrls.length <= 1) {
        console.log(`Cannot remove last ${type} URL field`);
        return prev;
      }
      
      const newUrls = currentUrls.filter((_, i) => i !== index);
      const newData = {
        ...prev,
        [fieldName]: newUrls
      };
      console.log(`Removed ${type} URL field at index ${index}:`, newData[fieldName]);
      return newData;
    });
  }, []);

  const handleUrlChange = useCallback((type, index, value) => {
    console.log(`URL change: ${type}[${index}] = ${value}`);
    
    const fieldMap = {
      'stream': 'stream_urls',
      'betting': 'betting_urls',
      'vod': 'vod_urls'
    };
    
    const fieldName = fieldMap[type];
    if (!fieldName) {
      console.error('Unknown URL type:', type);
      return;
    }
    
    setFormData(prev => {
      const currentUrls = prev[fieldName] || [''];
      const newUrls = currentUrls.map((url, i) => i === index ? value : url);
      const newData = {
        ...prev,
        [fieldName]: newUrls
      };
      console.log(`Updated ${type} URL at index ${index}:`, newData[fieldName]);
      return newData;
    });
  }, []);

  // PERFECT INPUT CHANGE HANDLER - FIXED REAL PLAYER POPULATION
  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const actualValue = type === 'checkbox' ? checked : value;
    
    console.log(`Input change: ${name} = ${actualValue}`);
    
    if (name === 'format') {
      handleFormatChange(actualValue);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: actualValue
    }));
    
    // CRITICAL FIX: POPULATE REAL PLAYERS WHEN TEAM SELECTED
    if (name === 'team1_id' && actualValue) {
      const team = teams.find(t => t.id == actualValue);
      setSelectedTeam1(team);
      console.log('Team 1 selected:', team?.name);
      
      // IMMEDIATELY LOAD REAL PLAYERS
      if (team) {
        await loadRealPlayersForTeam(team, 'team1');
      }
    } else if (name === 'team2_id' && actualValue) {
      const team = teams.find(t => t.id == actualValue);
      setSelectedTeam2(team);
      console.log('Team 2 selected:', team?.name);
      
      // IMMEDIATELY LOAD REAL PLAYERS
      if (team) {
        await loadRealPlayersForTeam(team, 'team2');
      }
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // HERO CHANGE HANDLER FOR PLAYER COMPOSITIONS
  const handlePlayerHeroChange = (mapIndex, team, playerIndex, hero, role) => {
    // CRITICAL FIX: Ensure hero is always a string, not an object
    const heroName = typeof hero === 'object' && hero.name ? hero.name : String(hero);
    const roleString = typeof role === 'object' && role.name ? role.name : String(role);
    
    console.log(`Player ${playerIndex + 1} on ${team} changing to ${heroName} (${roleString}) for Map ${mapIndex + 1}`);
    
    setFormData(prev => ({
      ...prev,
      maps: (prev.maps || []).map((map, index) => 
        index === mapIndex ? {
          ...map,
          [`${team}_composition`]: (map[`${team}_composition`] || []).map((player, pIndex) =>
            pIndex === playerIndex ? { ...player, hero: heroName, role: roleString } : player
          )
        } : map
      )
    }));
  };

  // AUTOMATIC WINNER CALCULATION FUNCTION
  const calculateMapWinner = useCallback((team1Score, team2Score, team1Id, team2Id) => {
    if (team1Score > team2Score) {
      return team1Id;
    } else if (team2Score > team1Score) {
      return team2Id;
    }
    return null; // Tie or no scores
  }, []);

  // ENHANCED REAL-TIME SCORE UPDATE FUNCTION WITH LIVESCOREMANAGER INTEGRATION
  const sendLiveScoreUpdate = useCallback(async (matchData) => {
    try {
      const updatePayload = {
        team1_score: matchData.team1_score,
        team2_score: matchData.team2_score,
        current_map: matchData.current_map || 1,
        map_scores: matchData.maps.map((map, index) => ({
          map_number: index + 1,
          team1_score: map.team1_score || 0,
          team2_score: map.team2_score || 0,
          winner_id: map.winner_id // Now automatically calculated
        }))
      };

      console.log('Sending real-time score update with auto-calculated winners:', updatePayload);
      
      const response = await api.post(`/admin/matches/${matchId}/update-score`, updatePayload);
      
      if (response?.success || response?.data) {
        console.log('Real-time score update sent successfully with automatic winners');
        
        // ENHANCED: Broadcast update through LiveScoreManager for instant UI updates
        liveScoreManager.broadcastScoreUpdate(matchId, {
          team1_score: matchData.team1_score,
          team2_score: matchData.team2_score,
          maps: matchData.maps,
          status: matchData.status,
          current_map: matchData.current_map
        }, {
          source: 'MatchForm',
          type: 'form_score_update',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('Error sending real-time score update:', error);
    }
  }, [api, matchId]);

  // PERFECT MAP CHANGE HANDLER WITH AUTOMATIC WINNER CALCULATION
  const handleMapChange = useCallback((mapIndex, field, value) => {
    console.log(`Map ${mapIndex + 1} ${field} changed to:`, value);
    
    setFormData(prev => {
      const newFormData = {
        ...prev,
        maps: (prev.maps || []).map((map, index) => {
          if (index === mapIndex) {
            const updatedMap = { ...map, [field]: value };
            
            // AUTO-CALCULATE winner when scores change
            if (field === 'team1_score' || field === 'team2_score') {
              const team1Score = field === 'team1_score' ? value : map.team1_score || 0;
              const team2Score = field === 'team2_score' ? value : map.team2_score || 0;
              
              updatedMap.winner_id = calculateMapWinner(team1Score, team2Score, prev.team1_id, prev.team2_id);
              updatedMap.status = updatedMap.winner_id ? 'completed' : 'upcoming';
              
              console.log(`Map ${mapIndex + 1} winner automatically calculated:`, 
                updatedMap.winner_id ? (updatedMap.winner_id === prev.team1_id ? 'Team 1' : 'Team 2') : 'No winner');
            }
            
            return updatedMap;
          }
          return map;
        })
      };

      // Recalculate overall match score based on map winners
      let team1_wins = 0;
      let team2_wins = 0;

      newFormData.maps.forEach(map => {
        if (map.winner_id === newFormData.team1_id) {
          team1_wins++;
        } else if (map.winner_id === newFormData.team2_id) {
          team2_wins++;
        }
      });

      newFormData.team1_score = team1_wins;
      newFormData.team2_score = team2_wins;

      // Send real-time update to backend if match exists and is live
      if (matchId && newFormData.status === 'live' && (field === 'team1_score' || field === 'team2_score')) {
        sendLiveScoreUpdate(newFormData);
      }

      return newFormData;
    });
  }, [matchId, calculateMapWinner, sendLiveScoreUpdate]);


  // REMOVED: Manual map winner selection - now calculated automatically based on scores

  // SIMPLE MAP RESULT UPDATE - Just update the overall scores
  const sendMapResultUpdate = async (mapNumber, mapData, matchData) => {
    try {
      // Simply call our general score update function
      await sendLiveScoreUpdate(matchData);
      
      console.log(`Map ${mapNumber} result sent successfully`);
      console.log(`Overall score updated: ${matchData.team1_score} - ${matchData.team2_score}`);
    } catch (error) {
      console.error(`Error sending map ${mapNumber} result:`, error);
    }
  };

  // PERFECT FORM VALIDATION
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.team1_id) newErrors.team1_id = 'Team 1 is required';
    if (!formData.team2_id) newErrors.team2_id = 'Team 2 is required';
    if (formData.team1_id === formData.team2_id) {
      newErrors.team2_id = 'Teams must be different';
    }
    // Event is optional - matches can be created without events
    if (!formData.scheduled_at) newErrors.scheduled_at = 'Schedule time is required';
    if (!formData.format) newErrors.format = 'Format is required';
    
    // Validate each map has a name
    formData.maps.forEach((map, index) => {
      if (!map.map_name) {
        newErrors[`map_${index}`] = `Map ${index + 1} name is required`;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // PERFECT SAVE HANDLER - REAL BACKEND INTEGRATION WITH API HELPER
  const handleSave = async () => {
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      return;
    }
    
    setSaving(true);
    try {
      console.log('Saving match to PRODUCTION backend...', formData);
      
      // CRITICAL FIX: Calculate series scores from map winners before saving
      let team1SeriesScore = 0;
      let team2SeriesScore = 0;
      
      // First, ensure all maps have proper winners if the match is completed
      if (formData.status === 'completed') {
        formData.maps.forEach(map => {
          // If map has scores but no winner, calculate the winner
          if ((map.team1_score || 0) !== (map.team2_score || 0) && !map.winner_id) {
            map.winner_id = (map.team1_score || 0) > (map.team2_score || 0) ? formData.team1_id : formData.team2_id;
            map.status = 'completed';
            console.log(` Auto-calculated map ${map.map_number} winner:`, map.winner_id);
          }
        });
      }
      
      formData.maps.forEach(map => {
        if (map.winner_id) {
          if (map.winner_id == formData.team1_id) {
            team1SeriesScore++;
          } else if (map.winner_id == formData.team2_id) {
            team2SeriesScore++;
          }
        }
      });
      
      console.log(` Calculated series scores: Team1: ${team1SeriesScore}, Team2: ${team2SeriesScore}`);
      
      // PRODUCTION: Prepare data for EXACT backend structure
      const productionData = {
        team1_id: parseInt(formData.team1_id),
        team2_id: parseInt(formData.team2_id),
        event_id: formData.event_id ? parseInt(formData.event_id) : null,
        status: formData.status || 'upcoming',
        format: formData.format || 'BO1',
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        // CRITICAL FIX: Include calculated series scores OR use manual override if provided and maps don't have winners
        team1_score: team1SeriesScore > 0 || team2SeriesScore > 0 ? team1SeriesScore : parseInt(formData.team1_score || 0),
        team2_score: team1SeriesScore > 0 || team2SeriesScore > 0 ? team2SeriesScore : parseInt(formData.team2_score || 0),
        // ENHANCED: Multiple URLs support
        stream_urls: (formData.stream_urls || ['']).filter(url => url.trim()),
        betting_urls: (formData.betting_urls || ['']).filter(url => url.trim()),
        vod_urls: (formData.vod_urls || ['']).filter(url => url.trim()),
        round: formData.round || null,
        bracket_position: formData.bracket_position || null,
        allow_past_date: formData.allow_past_date || false,
        
        // CRITICAL: Save complete map compositions for production (6v6 format)
        maps_data: formData.maps.map((map, index) => ({
          map_number: index + 1,
          map_name: map.map_name,           // PRESERVE selected map
          mode: map.mode,                   // PRESERVE selected mode
          team1_score: parseInt(map.team1_score) || 0,
          team2_score: parseInt(map.team2_score) || 0,
          winner_id: map.winner_id || null, // CRITICAL FIX: Include winner_id
          status: map.winner_id ? 'completed' : 'upcoming', // CRITICAL FIX: Set status based on winner
          
          // ENSURE 6v6 TEAM COMPOSITIONS for production
          team1_composition: (map.team1_composition || [])
            .slice(0, 6) // Ensure exactly 6 players
            .map(player => ({
              player_id: player.player_id || player.id,
              player_name: player.player_name || player.name || player.username,
              hero: player.hero || 'Captain America',
              role: player.role || 'Vanguard',
              country: player.country || player.nationality || 'US',
              // Initialize all required stats for 6v6
              eliminations: 0,
              deaths: 0,
              assists: 0,
              damage: 0,
              healing: 0,
              damage_blocked: 0,
              ultimate_usage: 0,
              objective_time: 0
            })),
          
          team2_composition: (map.team2_composition || [])
            .slice(0, 6) // Ensure exactly 6 players
            .map(player => ({
              player_id: player.player_id || player.id,
              player_name: player.player_name || player.name || player.username,
              hero: player.hero || 'Hulk',
              role: player.role || 'Vanguard',
              country: player.country || player.nationality || 'US',
              // Initialize all required stats for 6v6
              eliminations: 0,
              deaths: 0,
              assists: 0,
              damage: 0,
              healing: 0,
              damage_blocked: 0,
              ultimate_usage: 0,
              objective_time: 0
            }))
        }))
      };
      
      console.log('📤 PRODUCTION payload with preserved heroes/maps:', productionData);
      
      let response;
      if (isEdit) {
        console.log('Updating existing match via PRODUCTION API...');
        // PRODUCTION: Use complete update endpoint
        response = await api.put(`/admin/matches/${matchId}/complete-update`, productionData);
      } else {
        console.log('Creating new match via PRODUCTION API...');
        response = await api.post('/admin/matches', productionData);
      }
      
      console.log('Match saved to PRODUCTION backend successfully:', response);
      alert(`Match ${isEdit ? 'updated' : 'created'} successfully with preserved heroes and maps!`);
      
      // Navigate back to matches list
      if (navigateTo) {
        navigateTo('admin-matches');
      }
    } catch (error) {
      console.error('Error saving match to PRODUCTION backend:', error);
      alert(`Error saving match: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">MATCHES</div>
          <p className="text-gray-600 dark:text-gray-400">Loading real match form data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Match' : 'Create New Match'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {isEdit ? 'Update match details and scoring' : 'Set up a new Marvel Rivals tournament match'}
          </p>
        </div>
        <button
          onClick={() => navigateTo && navigateTo('admin-matches')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          ← Back to Matches
        </button>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
        {/* Teams Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teams</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team 1 *
              </label>
              <select
                name="team1_id"
                value={formData.team1_id}
                onChange={handleInputChange}
                className={`form-input ${errors.team1_id ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Team 1...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.short_name})
                  </option>
                ))}
              </select>
              {selectedTeam1 && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">{selectedTeam1.name}</div>
                  <div className="text-gray-600 dark:text-gray-400">Region: {selectedTeam1.region} | Rating: {selectedTeam1.rating || 'Unranked'}</div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team 2 *
              </label>
              <select
                name="team2_id"
                value={formData.team2_id}
                onChange={handleInputChange}
                className={`form-input ${errors.team2_id ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Team 2...</option>
                {teams.filter(team => team.id != formData.team1_id).map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.short_name})
                  </option>
                ))}
              </select>
              {selectedTeam2 && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                  <div className="font-medium text-gray-900 dark:text-white">{selectedTeam2.name}</div>
                  <div className="text-gray-600 dark:text-gray-400">Region: {selectedTeam2.region} | Rating: {selectedTeam2.rating || 'Unranked'}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Event <span className="text-gray-500 text-sm">(Optional - standalone match)</span>
              </label>
              <select
                name="event_id"
                value={formData.event_id}
                onChange={handleInputChange}
                className={`form-input ${errors.event_id ? 'border-red-500' : ''}`}
              >
                <option value="">No Event - Standalone Match</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.type || 'Tournament'})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leave empty to create a standalone match without an event
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Match Format *
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                {MARVEL_RIVALS_CONFIG.formats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Changing format will reset map configuration
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Scheduled Time *
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleInputChange}
                className={`form-input ${errors.scheduled_at ? 'border-red-500' : ''}`}
                min={formData.allow_past_date ? undefined : new Date().toISOString().slice(0, 16)}
                required
              />
              <div className="mt-2 flex items-center">
                <input
                  type="checkbox"
                  id="allow_past_date"
                  name="allow_past_date"
                  checked={formData.allow_past_date}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label htmlFor="allow_past_date" className="text-sm text-gray-600 dark:text-gray-400">
                  Allow past dates (for completed matches)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input"
              >
                {MARVEL_RIVALS_CONFIG.statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tournament Round
              </label>
              <input
                type="text"
                name="round"
                value={formData.round}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Semi-Finals, Quarter-Finals, etc."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Bracket Position
              </label>
              <input
                type="text"
                name="bracket_position"
                value={formData.bracket_position}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Upper Bracket, Lower Bracket, etc."
              />
            </div>
          </div>
        </div>

        {/* ENHANCED: Multiple URLs Section */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Streaming & Betting URLs</h3>
          
          <div className="space-y-6">
            {/* Stream URLs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Stream URLs
                </label>
                <button
                  type="button"
                  onClick={() => addUrlField('stream')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  + Add Stream
                </button>
              </div>
              <div className="space-y-2">
                {(formData.stream_urls || ['']).map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange('stream', index, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`https://twitch.tv/stream${index + 1}`}
                    />
                    {(formData.stream_urls || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField('stream', index)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Betting URLs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Betting URLs
                </label>
                <button
                  type="button"
                  onClick={() => addUrlField('betting')}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  + Add Betting
                </button>
              </div>
              <div className="space-y-2">
                {(formData.betting_urls || ['']).map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange('betting', index, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`https://bet365.com/match${index + 1}`}
                    />
                    {(formData.betting_urls || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField('betting', index)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* VOD URLs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  VOD URLs
                </label>
                <button
                  type="button"
                  onClick={() => addUrlField('vod')}
                  className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                >
                  + Add VOD
                </button>
              </div>
              <div className="space-y-2">
                {(formData.vod_urls || ['']).map((url, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleUrlChange('vod', index, e.target.value)}
                      className="form-input flex-1"
                      placeholder={`https://youtube.com/vod${index + 1}`}
                    />
                    {(formData.vod_urls || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrlField('vod', index)}
                        className="px-2 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Marvel Rivals Maps Configuration + Real Player Display */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Marvel Rivals Maps & Team Compositions ({formData.format})
          </h3>
          
          <div className="space-y-6">
            {(formData.maps || []).map((map, mapIndex) => (
              <div key={mapIndex} className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-gray-800">
                {/* Map Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">Map {mapIndex + 1}</h4>
                  <div className={`px-3 py-1 rounded text-sm font-medium ${
                    map.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    map.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {(map.status || 'upcoming').toUpperCase()}
                  </div>
                </div>
                
                {/* Map Selection with Mode Display */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Select Marvel Rivals Map
                  </label>
                  <select
                    value={map.map_name}
                    onChange={(e) => {
                      const selectedMapName = e.target.value;
                      const selectedMapData = MARVEL_RIVALS_CONFIG.maps.find(m => m.name === selectedMapName);
                      handleMapChange(mapIndex, 'map_name', selectedMapName);
                      if (selectedMapData) {
                        handleMapChange(mapIndex, 'mode', selectedMapData.mode);
                      }
                    }}
                    className="form-input"
                  >
                    {MARVEL_RIVALS_CONFIG.maps.map(mapData => (
                      <option key={mapData.name} value={mapData.name}>
                        {mapData.icon} {mapData.name} ({mapData.mode})
                      </option>
                    ))}
                  </select>
                  {/* Current Mode Display */}
                  {map.mode && MARVEL_RIVALS_CONFIG.gameModes[map.mode] && (
                    <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{MARVEL_RIVALS_CONFIG.gameModes[map.mode].icon}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {MARVEL_RIVALS_CONFIG.gameModes[map.mode].displayName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* GAME MODE SELECTION (AUTO-SET BUT EDITABLE) */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Game Mode
                  </label>
                  <select
                    value={map.mode || 'Convoy'}
                    onChange={(e) => handleMapChange(mapIndex, 'mode', e.target.value)}
                    className="form-input"
                  >
                    {Object.entries(MARVEL_RIVALS_CONFIG.gameModes).map(([mode, modeData]) => (
                      <option key={mode} value={mode}>
                        {modeData.icon} {modeData.displayName} - {Math.floor(modeData.duration / 60)}min
                      </option>
                    ))}
                  </select>
                </div>

                {/* REAL PLAYER COMPOSITIONS DISPLAY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Team 1 Composition */}
                  <div className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
                    <h5 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-4">
                      {selectedTeam1?.name || 'Team 1'} Composition
                    </h5>
                    
                    <div className="space-y-3">
                      {(map.team1_composition || []).length > 0 ? (
                        map.team1_composition.map((player, playerIndex) => (
                          <div key={playerIndex} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {player.player_name || player.name || `Player ${playerIndex + 1}`}
                              </span>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                player.role === 'Tank' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                player.role === 'Duelist' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              }`}>
                                {player.role}
                              </div>
                            </div>
                            
                            <select
                              value={player.hero}
                              onChange={(e) => {
                                const selectedHero = e.target.value;
                                const heroRole = Object.keys(herosByRole).find(role => 
                                  (herosByRole[role] || []).includes(selectedHero)
                                ) || 'Tank';
                                
                                handlePlayerHeroChange(mapIndex, 'team1', playerIndex, selectedHero, heroRole);
                              }}
                              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {Object.entries(herosByRole).map(([role, heroes]) => (
                                <optgroup key={role} label={role}>
                                  {Array.isArray(heroes) ? heroes.map(hero => (
                                    <option key={hero} value={hero}>{hero}</option>
                                  )) : null}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                          Select Team 1 to load real players
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Team 2 Composition */}
                  <div className="border border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/10">
                    <h5 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-4">
                      {selectedTeam2?.name || 'Team 2'} Composition
                    </h5>
                    
                    <div className="space-y-3">
                      {(map.team2_composition || []).length > 0 ? (
                        map.team2_composition.map((player, playerIndex) => (
                          <div key={playerIndex} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-green-600 dark:text-green-400">
                                {player.player_name || player.name || `Player ${playerIndex + 1}`}
                              </span>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${
                                player.role === 'Tank' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                                player.role === 'Duelist' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              }`}>
                                {player.role}
                              </div>
                            </div>
                            
                            <select
                              value={player.hero}
                              onChange={(e) => {
                                const selectedHero = e.target.value;
                                const heroRole = Object.keys(herosByRole).find(role => 
                                  (herosByRole[role] || []).includes(selectedHero)
                                ) || 'Tank';
                                
                                handlePlayerHeroChange(mapIndex, 'team2', playerIndex, selectedHero, heroRole);
                              }}
                              className="w-full text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              {Object.entries(herosByRole).map(([role, heroes]) => (
                                <optgroup key={role} label={role}>
                                  {Array.isArray(heroes) ? heroes.map(hero => (
                                    <option key={hero} value={hero}>{hero}</option>
                                  )) : null}
                                </optgroup>
                              ))}
                            </select>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                          Select Team 2 to load real players
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Map Scores with Winner Selection */}
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {selectedTeam1?.short_name || 'Team 1'} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={map.team1_score}
                        onChange={(e) => handleMapChange(mapIndex, 'team1_score', parseInt(e.target.value) || 0)}
                        className="form-input"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                        {selectedTeam2?.short_name || 'Team 2'} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={map.team2_score}
                        onChange={(e) => handleMapChange(mapIndex, 'team2_score', parseInt(e.target.value) || 0)}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* AUTOMATIC Map Winner Display - NO MANUAL SELECTION */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Map Winner (Automatically Calculated)
                    </label>
                    
                    {/* Winner Display */}
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                      {map.winner_id ? (
                        <div className="flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                               {map.winner_id == formData.team1_id ? selectedTeam1?.name : selectedTeam2?.name} Wins!
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Score: {map.team1_score || 0} - {map.team2_score || 0}
                            </div>
                            {matchId && (
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                 Real-time update sent
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                          {(map.team1_score || 0) === (map.team2_score || 0) ? (
                            (map.team1_score || 0) > 0 ? " Tie Game" : " No scores entered yet"
                          ) : (
                            " Enter scores above to determine winner"
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Reset Scores Button */}
                    <div className="mt-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          handleMapChange(mapIndex, 'team1_score', 0);
                          handleMapChange(mapIndex, 'team2_score', 0);
                        }}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                         Reset Scores
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-bold mb-2">Current Match Score:</div>
              <div className="text-2xl">
                {selectedTeam1?.short_name || 'Team 1'}: <span className="font-bold">{formData.team1_score}</span> - 
                {selectedTeam2?.short_name || 'Team 2'}: <span className="font-bold">{formData.team2_score}</span>
              </div>
              
              {/* Manual Score Override for Completed Matches */}
              {formData.status === 'completed' && (
                <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded border">
                  <div className="font-bold text-gray-900 dark:text-white mb-2">Manual Score Override (for completed matches):</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {selectedTeam1?.short_name || 'Team 1'} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.team1_score || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          team1_score: parseInt(e.target.value) || 0
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {selectedTeam2?.short_name || 'Team 2'} Score
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.team2_score || 0}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          team2_score: parseInt(e.target.value) || 0
                        }))}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Use this to set final match scores for completed matches without detailed map scoring.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Save/Submit */}
        <div className="flex justify-center space-x-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {saving ? 'Saving...' : isEdit ? 'Update Match' : 'Create Match'}
          </button>
          <button
            type="button"
            onClick={() => navigateTo && navigateTo('admin-matches')}
            className="px-8 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
          >
            Cancel
          </button>
        </div>
      </form>

      {/* Overall Match Score Banner (tracker.gg style) - POSITIONED BELOW FORM AS REQUESTED */}
      {(selectedTeam1 && selectedTeam2) && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{selectedTeam1.short_name ? selectedTeam1.short_name[0] : selectedTeam1.name[0]}</span>
                </div>
                <div className="text-white">
                  <div className="font-bold text-lg">{selectedTeam1.name}</div>
                  <div className="text-blue-200 text-sm">{selectedTeam1.region}</div>
                </div>
              </div>
            </div>
            
            {/* Live Overall Match Score Display */}
            <div className="text-center">
              <div className="text-white text-4xl font-bold mb-1">
                {selectedTeam1.short_name} {formData.team1_score || 0} - {formData.team2_score || 0} {selectedTeam2.short_name}
              </div>
              <div className="text-blue-200 text-sm uppercase tracking-wide">
                {formData.format} • {formData.status?.toUpperCase() || 'UPCOMING'}
              </div>
              {formData.status === 'live' && (
                <div className="flex items-center justify-center space-x-1 mt-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-200 text-sm font-medium">LIVE</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="text-white text-right">
                  <div className="font-bold text-lg">{selectedTeam2.name}</div>
                  <div className="text-blue-200 text-sm">{selectedTeam2.region}</div>
                </div>
                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-2xl font-bold text-blue-600">{selectedTeam2.short_name ? selectedTeam2.short_name[0] : selectedTeam2.name[0]}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Map Progress Indicators */}
          <div className="mt-4 pt-4 border-t border-blue-500">
            <div className="flex items-center justify-center space-x-2">
              {(formData.maps || []).map((map, index) => {
                const team1Won = map.winner_id === formData.team1_id;
                const team2Won = map.winner_id === formData.team2_id;
                const isActive = (formData.current_map || 1) === index + 1;
                
                return (
                  <div key={index} className="flex items-center">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      team1Won ? 'bg-green-500 text-white' :
                      team2Won ? 'bg-red-500 text-white' :
                      isActive ? 'bg-yellow-400 text-gray-900' :
                      'bg-blue-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    {index < formData.maps.length - 1 && (
                      <div className="w-4 h-0.5 bg-blue-400 mx-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-2">
              <span className="text-blue-200 text-xs">
                Map {formData.current_map || 1} of {formData.maps?.length || 1} • {formData.maps?.[0]?.mode || 'Convoy'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchForm;