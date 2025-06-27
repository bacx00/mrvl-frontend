import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

// ✅ CRITICAL FIX: CORRECT MARVEL RIVALS MAPS
const MARVEL_RIVALS_CONFIG = {
  maps: [
    'Tokyo 2099: Shibuya Sky',
    'Klyntar: Symbiote Planet', 
    'Asgard: Royal Palace',
    'Tokyo 2099: Shin-Shibuya Station',
    'Wakanda: Golden City',
    'Sanctum Sanctorum: Astral Plane',
    'Yggsgard: Yggdrasil',
    'Midtown Manhattan: Oscorp Tower'
  ],
  // Heroes will be loaded from API
  herosByRole: {},
  formats: [
    { value: 'BO1', label: 'BO1 - Best of 1', maps: 1, description: 'Single elimination match' },
    { value: 'BO3', label: 'BO3 - Best of 3', maps: 3, description: 'First to win 2 maps' },
    { value: 'BO5', label: 'BO5 - Best of 5', maps: 5, description: 'First to win 3 maps' }
  ],
  statuses: [
    { value: 'upcoming', label: '📅 Upcoming', color: 'blue' },
    { value: 'live', label: '🔴 Live', color: 'red' },
    { value: 'completed', label: '✅ Completed', color: 'green' },
    { value: 'cancelled', label: '❌ Cancelled', color: 'gray' },
    { value: 'postponed', label: '⏳ Postponed', color: 'yellow' }
  ]
};

// ✅ PERFECT MATCH INITIALIZATION WITH HERO PRE-SELECTION
const getInitialMatchData = (format = 'BO1') => {
  const formatConfig = MARVEL_RIVALS_CONFIG.formats.find(f => f.value === format);
  const mapCount = formatConfig?.maps || 1; // Default to 1 map for BO1
  
  console.log(`🎮 CRITICAL FIX: Initializing ${format} match with EXACTLY ${mapCount} maps`);
  
  return {
    team1_id: '',
    team2_id: '',
    event_id: '',
    scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    format: format,
    status: 'upcoming',
    stream_url: '',
    description: '',
    team1_score: 0,
    team2_score: 0,
    // 🚨 CRITICAL: EXACTLY the right number of maps
    maps: Array.from({ length: mapCount }, (_, index) => ({
      map_number: index + 1,
      map_name: MARVEL_RIVALS_CONFIG.maps[index] || MARVEL_RIVALS_CONFIG.maps[0],
      team1_score: 0,
      team2_score: 0,
      status: 'upcoming',
      winner_id: null,
      duration: null,
      // 🎮 EMPTY COMPOSITIONS - WILL BE POPULATED WITH REAL PLAYERS
      team1_composition: [],
      team2_composition: []
    })),
    viewers: 0,
    featured: false,
    map_pool: MARVEL_RIVALS_CONFIG.maps.slice(0, mapCount) // EXACTLY mapCount maps
  };
};

function MatchForm({ matchId, navigateTo }) {
  const [formData, setFormData] = useState(getInitialMatchData());
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedTeam1, setSelectedTeam1] = useState(null);
  const [selectedTeam2, setSelectedTeam2] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  // 🔥 FIX: Add heroes state to trigger re-renders
  const [herosByRole, setHerosByRole] = useState({
    Tank: ['Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 'Peni Parker', 'The Thing', 'Thor', 'Venom'],
    Duelist: ['Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Human Torch', 'Iron Fist', 'Iron Man', 'Magik', 'Moon Knight', 'Namor', 'Psylocke', 'The Punisher', 'Scarlet Witch', 'Spider-Man', 'Squirrel Girl', 'Star-Lord', 'Storm', 'Wolverine'],
    Support: ['Adam Warlock', 'Cloak & Dagger', 'Invisible Woman', 'Jeff the Land Shark', 'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon']
  });
  
  const { api } = useAuth();
  const isEdit = Boolean(matchId);

  // 🔥 CRITICAL: REAL BACKEND API BASE URL FROM ENV ONLY
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

  console.log('🔍 MatchForm: Using backend URL:', BACKEND_URL);

  // ✅ CRITICAL: Load heroes from live backend API
  useEffect(() => {
    const loadHeroesFromAPI = async () => {
      try {
        console.log('🎮 Loading heroes from backend API...');
        const response = await api.get('/heroes');
        const heroData = response?.data;
        
        console.log('✅ Heroes loaded from API:', heroData);
        
        if (heroData && typeof heroData === 'object') {
          // 🚨 CRITICAL FIX: Transform API response to extract hero names only
          const transformedHeroes = {};
          
          for (const [role, heroes] of Object.entries(heroData)) {
            // Skip "all" category - we want role-specific grouping
            if (role === 'all') continue;
            
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
          
          // 🔥 FIX: Update React state instead of global object
          setHerosByRole(transformedHeroes);
          console.log('🎮 Heroes state updated (names only):', transformedHeroes);
        }
      } catch (error) {
        console.error('❌ Error loading heroes from API:', error);
        // Fallback heroes are already set in the initial state
        console.log('🎮 Using fallback heroes from initial state');
      }
    };
    
    loadHeroesFromAPI();
  }, [api]);

  // 🚨 CRITICAL: REAL BACKEND DATA LOADING - NO MOCK DATA
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log('🔍 MatchForm: Fetching REAL backend data...');
        
        // 🔥 CRITICAL: Get REAL teams from backend using API helper
        const teamsResponse = await api.get('/teams');
        const realTeams = teamsResponse?.data || [];
        setTeams(Array.isArray(realTeams) ? realTeams : []);
        console.log('✅ REAL Teams loaded:', realTeams.length, realTeams);

        // 🔥 CRITICAL: Get REAL events from backend using API helper
        const eventsResponse = await api.get('/events');
        const realEvents = eventsResponse?.data || [];
        setEvents(Array.isArray(realEvents) ? realEvents : []);
        console.log('✅ REAL Events loaded:', realEvents.length, realEvents);

        // If editing, load REAL match data
        if (isEdit && matchId) {
          try {
            console.log(`🔍 Loading REAL match data for ID: ${matchId}`);
            const matchResponse = await api.get(`/admin/matches/${matchId}`);
            const realMatchData = matchResponse?.data;
            
            if (realMatchData) {
              console.log('✅ REAL Match data loaded:', realMatchData);
              
              // 🚨 CRITICAL FIX: Ensure correct map count for the format
              const baseData = getInitialMatchData(realMatchData.format || 'BO1');
              
              // 🚨 CRITICAL FIX: Preserve existing hero compositions from maps_data
              const preservedMaps = realMatchData.maps_data && realMatchData.maps_data.length > 0 
                ? realMatchData.maps_data.map((mapData, index) => ({
                    map_name: mapData.map_name || baseData.maps[index]?.map_name || 'Tokyo 2099: Shibuya Sky',
                    mode: mapData.mode || baseData.maps[index]?.mode || 'Conquest',
                    team1_composition: mapData.team1_composition || baseData.maps[index]?.team1_composition || [],
                    team2_composition: mapData.team2_composition || baseData.maps[index]?.team2_composition || []
                  }))
                : baseData.maps;
              
              const transformedData = {
                ...baseData, // Start with correct map structure
                ...realMatchData, // Then add real match data
                team1_id: realMatchData.team1_id || realMatchData.team1?.id || '',
                team2_id: realMatchData.team2_id || realMatchData.team2?.id || '',
                event_id: realMatchData.event_id || realMatchData.event?.id || '',
                scheduled_at: realMatchData.scheduled_at ? 
                  new Date(realMatchData.scheduled_at).toISOString().slice(0, 16) : 
                  new Date(Date.now() + 3600000).toISOString().slice(0, 16),
                // 🚨 PRESERVE existing hero compositions
                maps: preservedMaps,
                map_pool: baseData.map_pool
              };
              
              setFormData(transformedData);
              
              // Set selected teams for UI
              const team1 = realTeams.find(t => t.id === transformedData.team1_id);
              const team2 = realTeams.find(t => t.id === transformedData.team2_id);
              setSelectedTeam1(team1);
              setSelectedTeam2(team2);
              
              // 🔥 CRITICAL: IMMEDIATELY LOAD REAL PLAYERS FOR SELECTED TEAMS
              if (team1) {
                await loadRealPlayersForTeam(team1, 'team1', transformedData);
              }
              if (team2) {
                await loadRealPlayersForTeam(team2, 'team2', transformedData);
              }
              
              console.log('✅ Real match data loaded and players populated');
            }
          } catch (error) {
            console.error('❌ Error loading real match data:', error);
          }
        }
      } catch (error) {
        console.error('❌ Error fetching real form data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [matchId, isEdit, api]);

  // 🚨 CRITICAL: LOAD REAL PLAYERS FOR TEAM
  const loadRealPlayersForTeam = async (team, teamKey, currentFormData = formData) => {
    try {
      console.log(`🔍 Loading REAL players for ${team.name} (ID: ${team.id})`);
      
      // 🔥 CRITICAL: Fetch REAL team details with players using API helper
      const teamResponse = await api.get(`/teams/${team.id}`);
      const teamWithPlayers = teamResponse?.data;
      
      if (teamWithPlayers && teamWithPlayers.players) {
        const realPlayers = teamWithPlayers.players;
        console.log(`✅ Found ${realPlayers.length} REAL players for ${team.name}:`, realPlayers);
        
        // 🔥 POPULATE REAL PLAYERS IMMEDIATELY IN FORM DATA
        const compositionKey = teamKey === 'team1' ? 'team1_composition' : 'team2_composition';
        
        setFormData(prev => ({
          ...prev,
          maps: prev.maps.map(map => ({
            ...map,
            [compositionKey]: realPlayers.slice(0, 6).map((player, index) => ({
              player_id: player.id,
              player_name: player.name, // 🔥 REAL PLAYER NAME
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
        
        console.log(`✅ ${team.name} composition updated with REAL players:`, realPlayers.map(p => p.name));
        return realPlayers;
      } else {
        console.log(`❌ No players found for ${team.name}`);
        return [];
      }
    } catch (error) {
      console.error(`❌ Error loading real players for ${team.name}:`, error);
      return [];
    }
  };

  // ✅ PERFECT FORMAT CHANGE HANDLER
  const handleFormatChange = (newFormat) => {
    console.log(`🔄 Changing format from ${formData.format} to ${newFormat}`);
    
    const newMatchData = getInitialMatchData(newFormat);
    setFormData(prev => ({
      ...prev,
      format: newFormat,
      maps: newMatchData.maps,
      map_pool: newMatchData.map_pool,
      // Reset scores when changing format
      team1_score: 0,
      team2_score: 0
    }));
    
    console.log(`✅ Format changed to ${newFormat} with ${newMatchData.maps.length} maps`);
  };

  // ✅ PERFECT INPUT CHANGE HANDLER - FIXED REAL PLAYER POPULATION
  const handleInputChange = async (e) => {
    const { name, value, type, checked } = e.target;
    const actualValue = type === 'checkbox' ? checked : value;
    
    console.log(`🔄 Input change: ${name} = ${actualValue}`);
    
    if (name === 'format') {
      handleFormatChange(actualValue);
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: actualValue
    }));
    
    // 🚨 CRITICAL FIX: POPULATE REAL PLAYERS WHEN TEAM SELECTED
    if (name === 'team1_id' && actualValue) {
      const team = teams.find(t => t.id == actualValue);
      setSelectedTeam1(team);
      console.log('✅ Team 1 selected:', team?.name);
      
      // 🔥 IMMEDIATELY LOAD REAL PLAYERS
      if (team) {
        await loadRealPlayersForTeam(team, 'team1');
      }
    } else if (name === 'team2_id' && actualValue) {
      const team = teams.find(t => t.id == actualValue);
      setSelectedTeam2(team);
      console.log('✅ Team 2 selected:', team?.name);
      
      // 🔥 IMMEDIATELY LOAD REAL PLAYERS
      if (team) {
        await loadRealPlayersForTeam(team, 'team2');
      }
    }
    
    // Clear errors when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // ✅ HERO CHANGE HANDLER FOR PLAYER COMPOSITIONS
  const handlePlayerHeroChange = (mapIndex, team, playerIndex, hero, role) => {
    // 🚨 CRITICAL FIX: Ensure hero is always a string, not an object
    const heroName = typeof hero === 'object' && hero.name ? hero.name : String(hero);
    const roleString = typeof role === 'object' && role.name ? role.name : String(role);
    
    console.log(`🎮 Player ${playerIndex + 1} on ${team} changing to ${heroName} (${roleString}) for Map ${mapIndex + 1}`);
    
    setFormData(prev => ({
      ...prev,
      maps: prev.maps.map((map, index) => 
        index === mapIndex ? {
          ...map,
          [`${team}_composition`]: map[`${team}_composition`].map((player, pIndex) =>
            pIndex === playerIndex ? { ...player, hero: heroName, role: roleString } : player
          )
        } : map
      )
    }));
  };

  // ✅ PERFECT MAP CHANGE HANDLER  
  const handleMapChange = (mapIndex, field, value) => {
    console.log(`🗺️ Map ${mapIndex + 1} ${field} changed to:`, value);
    
    setFormData(prev => ({
      ...prev,
      maps: prev.maps.map((map, index) => 
        index === mapIndex ? { ...map, [field]: value } : map
      )
    }));
  };

  // ✅ PERFECT FORM VALIDATION
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.team1_id) newErrors.team1_id = 'Team 1 is required';
    if (!formData.team2_id) newErrors.team2_id = 'Team 2 is required';
    if (formData.team1_id === formData.team2_id) {
      newErrors.team2_id = 'Teams must be different';
    }
    if (!formData.event_id) newErrors.event_id = 'Event is required';
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

  // ✅ PERFECT SAVE HANDLER - REAL BACKEND INTEGRATION WITH API HELPER
  const handleSave = async () => {
    if (!validateForm()) {
      console.log('❌ Form validation failed:', errors);
      return;
    }
    
    setSaving(true);
    try {
      console.log('💾 Saving match to PRODUCTION backend...', formData);
      
      // 🎯 PRODUCTION: Prepare data for EXACT backend structure
      const productionData = {
        team1_id: parseInt(formData.team1_id),
        team2_id: parseInt(formData.team2_id),
        event_id: formData.event_id ? parseInt(formData.event_id) : null,
        status: formData.status || 'upcoming',
        format: formData.format || 'BO1',
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        description: formData.description || '',
        
        // 🚨 CRITICAL: Save complete map compositions for production
        maps_data: formData.maps.map((map, index) => ({
          map_number: index + 1,
          map_name: map.map_name,           // ✅ PRESERVE selected map
          mode: map.mode,                   // ✅ PRESERVE selected mode
          team1_score: parseInt(map.team1_score) || 0,
          team2_score: parseInt(map.team2_score) || 0,
          status: 'upcoming',
          
          // 🦸 PRESERVE HERO COMPOSITIONS for production
          team1_composition: (map.team1_composition || []).map(player => ({
            player_id: player.player_id || player.id,
            player_name: player.player_name || player.name,
            hero: player.hero,              // ✅ PRESERVE hero selection
            role: player.role,
            country: player.country || 'DE',
            // Initialize stats
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damage_blocked: 0
          })),
          
          team2_composition: (map.team2_composition || []).map(player => ({
            player_id: player.player_id || player.id,
            player_name: player.player_name || player.name,
            hero: player.hero,              // ✅ PRESERVE hero selection
            role: player.role,
            country: player.country || 'KR',
            // Initialize stats
            eliminations: 0,
            deaths: 0,
            assists: 0,
            damage: 0,
            healing: 0,
            damage_blocked: 0
          }))
        }))
      };
      
      console.log('📤 PRODUCTION payload with preserved heroes/maps:', productionData);
      
      let response;
      if (isEdit) {
        console.log('🔄 Updating existing match via PRODUCTION API...');
        // 🎯 PRODUCTION: Use complete update endpoint
        response = await api.put(`/admin/matches/${matchId}/complete-update`, productionData);
      } else {
        console.log('🚀 Creating new match via PRODUCTION API...');
        response = await api.post('/admin/matches', productionData);
      }
      
      console.log('✅ Match saved to PRODUCTION backend successfully:', response);
      alert(`✅ Match ${isEdit ? 'updated' : 'created'} successfully with preserved heroes and maps!`);
      
      // Navigate back to matches list
      if (navigateTo) {
        navigateTo('admin-matches');
      }
    } catch (error) {
      console.error('❌ Error saving match to PRODUCTION backend:', error);
      alert(`❌ Error saving match: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">⚔️</div>
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
            {isEdit ? '✏️ Edit Match' : '⚔️ Create New Match'}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎮 Teams</h3>
          
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📝 Match Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Event *
              </label>
              <select
                name="event_id"
                value={formData.event_id}
                onChange={handleInputChange}
                className={`form-input ${errors.event_id ? 'border-red-500' : ''}`}
                required
              >
                <option value="">Select Event...</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.type || 'Tournament'})
                  </option>
                ))}
              </select>
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
                ✅ Changing format will reset map configuration
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
                required
              />
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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Stream URL
              </label>
              <input
                type="url"
                name="stream_url"
                value={formData.stream_url}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://twitch.tv/marvelrivals"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="form-input"
                placeholder="Match description, stakes, context, etc..."
              />
            </div>
          </div>
        </div>

        {/* Marvel Rivals Maps Configuration + Real Player Display */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            🗺️ Marvel Rivals Maps & Team Compositions ({formData.format})
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
                    {map.status.toUpperCase()}
                  </div>
                </div>
                
                {/* Map Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Select Map
                  </label>
                  <select
                    value={map.map_name}
                    onChange={(e) => handleMapChange(mapIndex, 'map_name', e.target.value)}
                    className="form-input"
                  >
                    {MARVEL_RIVALS_CONFIG.maps.map(mapName => (
                      <option key={mapName} value={mapName}>{mapName}</option>
                    ))}
                  </select>
                </div>

                {/* 🎮 GAME MODE SELECTION */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Game Mode
                  </label>
                  <select
                    value={map.mode || 'Convoy'}
                    onChange={(e) => handleMapChange(mapIndex, 'mode', e.target.value)}
                    className="form-input"
                  >
                    <option value="Convoy">Convoy</option>
                    <option value="Domination">Domination</option>
                    <option value="Convergence">Convergence</option>
                    <option value="Conquest">Conquest</option>
                  </select>
                </div>

                {/* 🔥 REAL PLAYER COMPOSITIONS DISPLAY */}
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
                                ✅ {player.player_name || player.name || `Player ${playerIndex + 1}`}
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
                                ✅ {player.player_name || player.name || `Player ${playerIndex + 1}`}
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

                {/* Map Scores */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-bold mb-2">🎯 Current Match Score:</div>
              <div className="text-2xl">
                {selectedTeam1?.short_name || 'Team 1'}: <span className="font-bold">{formData.team1_score}</span> - 
                {selectedTeam2?.short_name || 'Team 2'}: <span className="font-bold">{formData.team2_score}</span>
              </div>
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
            {saving ? '💾 Saving...' : isEdit ? '💾 Update Match' : '🚀 Create Match'}
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
    </div>
  );
}

export default MatchForm;