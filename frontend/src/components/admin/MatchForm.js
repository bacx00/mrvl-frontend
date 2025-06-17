import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

// ✅ MARVEL RIVALS GAME LOGIC - Maps, formats, and initialization
const MARVEL_RIVALS_CONFIG = {
  maps: [
    'Asgard Throne Room',
    'Wakanda Palace', 
    'Sanctum Sanctorum',
    'Tokyo 2099',
    'Klyntar Symbiote World',
    'Midtown Manhattan',
    'Helicarrier Command',
    'Bifrost Arena'
  ],
  formats: [
    { value: 'BO1', label: 'BO1 - Best of 1', maps: 1 },
    { value: 'BO3', label: 'BO3 - Best of 3', maps: 3 },
    { value: 'BO5', label: 'BO5 - Best of 5', maps: 5 }
  ],
  statuses: [
    { value: 'upcoming', label: 'Upcoming', color: 'blue' },
    { value: 'live', label: 'Live', color: 'red' },
    { value: 'completed', label: 'Completed', color: 'green' },
    { value: 'cancelled', label: 'Cancelled', color: 'gray' },
    { value: 'postponed', label: 'Postponed', color: 'yellow' }
  ]
};

// Helper function to get a default future date (1 hour from now)
const getDefaultFutureDate = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1);
  return now.toISOString().slice(0, 16);
};

// ✅ FIXED: Initialize match with proper Marvel Rivals scoring structure
const getInitialMatchData = (format = 'BO3') => {
  const formatConfig = MARVEL_RIVALS_CONFIG.formats.find(f => f.value === format);
  const mapCount = formatConfig ? formatConfig.maps : 3;
  
  return {
    team1Id: '',
    team2Id: '',
    eventId: '',
    scheduledAt: getDefaultFutureDate(),
    format: format,
    status: 'upcoming',
    streamUrl: '',
    description: '',
    mapPool: MARVEL_RIVALS_CONFIG.maps.slice(0, mapCount),
    // ✅ CRITICAL: Initialize all scores to 0
    team1_score: 0,
    team2_score: 0,
    // ✅ CRITICAL: Initialize map data structure
    maps: Array.from({ length: mapCount }, (_, index) => ({
      map_number: index + 1,
      map_name: MARVEL_RIVALS_CONFIG.maps[index % MARVEL_RIVALS_CONFIG.maps.length],
      team1_score: 0,
      team2_score: 0,
      status: 'upcoming',
      winner_id: null,
      duration: null,
      // ✅ Initialize player stats structure for live scoring
      team1_stats: {},
      team2_stats: {}
    }))
  };
};

function MatchForm({ matchId, navigateTo }) {
  const [formData, setFormData] = useState(getInitialMatchData());
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedTeam1, setSelectedTeam1] = useState(null);
  const [selectedTeam2, setSelectedTeam2] = useState(null);
  const { api } = useAuth();

  const isEdit = Boolean(matchId);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch teams and events
      const [teamsResponse, eventsResponse] = await Promise.all([
        api.get('/teams'),
        api.get('/events')
      ]);
      
      const teamsData = teamsResponse.data || teamsResponse || [];
      const eventsData = eventsResponse.data || eventsResponse || [];
      
      setTeams(teamsData);
      setEvents(eventsData);

      // If editing, fetch match data
      if (isEdit) {
        try {
          const response = await api.get(`/matches/${matchId}`);
          const match = response.data || response;
          
          // ✅ FIXED: Transform backend match data to frontend format
          const transformedData = {
            team1Id: match.team1_id || '',
            team2Id: match.team2_id || '',
            eventId: match.event_id || '',
            scheduledAt: match.scheduled_at ? match.scheduled_at.slice(0, 16) : getDefaultFutureDate(),
            format: match.format || 'BO3',
            status: match.status || 'upcoming',
            streamUrl: match.stream_url || '',
            description: match.description || '',
            mapPool: match.map_pool || MARVEL_RIVALS_CONFIG.maps.slice(0, 3),
            team1_score: match.team1_score || 0,
            team2_score: match.team2_score || 0,
            maps: match.maps || getInitialMatchData(match.format || 'BO3').maps
          };
          
          setFormData(transformedData);
          
          // Set selected teams for UI
          const team1 = teamsData.find(t => t.id == match.team1_id);
          const team2 = teamsData.find(t => t.id == match.team2_id);
          setSelectedTeam1(team1);
          setSelectedTeam2(team2);
          
        } catch (matchError) {
          console.warn('Could not fetch match details:', matchError);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Please refresh and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [matchId, isEdit]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // ✅ SPECIAL HANDLING: When format changes, regenerate map structure
    if (name === 'format') {
      const newMatchData = getInitialMatchData(value);
      setFormData(prev => ({
        ...prev,
        format: value,
        mapPool: newMatchData.mapPool,
        maps: newMatchData.maps
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Update selected teams for UI
    if (name === 'team1Id') {
      const team = teams.find(t => t.id == value);
      setSelectedTeam1(team);
    } else if (name === 'team2Id') {
      const team = teams.find(t => t.id == value);
      setSelectedTeam2(team);
    }
  };

  const handleMapChange = (mapIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      maps: prev.maps.map((map, index) => 
        index === mapIndex ? { ...map, [field]: value } : map
      )
    }));
  };

  const validateForm = () => {
    if (!formData.team1Id) {
      alert('Please select Team 1');
      return false;
    }
    
    if (!formData.team2Id) {
      alert('Please select Team 2');
      return false;
    }
    
    if (formData.team1Id === formData.team2Id) {
      alert('Team 1 and Team 2 cannot be the same');
      return false;
    }
    
    if (!formData.scheduledAt) {
      alert('Please set a match time');
      return false;
    }

    // Validate future time for upcoming matches
    if (formData.status === 'upcoming') {
      const scheduledTime = new Date(formData.scheduledAt);
      const now = new Date();
      if (scheduledTime <= now) {
        alert('Upcoming matches must be scheduled in the future');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSaving(true);

    try {
      // ✅ FIXED: Prepare data for backend with proper Marvel Rivals structure
      const submitData = {
        team1_id: parseInt(formData.team1Id),
        team2_id: parseInt(formData.team2Id),
        event_id: formData.eventId ? parseInt(formData.eventId) : null,
        scheduled_at: formData.scheduledAt,
        format: formData.format,
        status: formData.status,
        stream_url: formData.streamUrl || null,
        description: formData.description || null,
        map_pool: formData.mapPool,
        // ✅ CRITICAL: Initialize scores properly
        team1_score: formData.team1_score || 0,
        team2_score: formData.team2_score || 0,
        // ✅ CRITICAL: Send map structure for live scoring setup
        maps_data: formData.maps
      };

      console.log('📡 Submitting match data:', submitData);

      let response;
      if (isEdit) {
        response = await api.put(`/admin/matches/${matchId}`, submitData);
      } else {
        response = await api.post('/admin/matches', submitData);
      }

      const result = response.data || response;
      console.log('✅ Match operation successful:', result);

      alert(`Match ${isEdit ? 'updated' : 'created'} successfully! ${!isEdit ? 'All scores initialized to 0.' : ''}`);
      
      if (navigateTo) {
        navigateTo('admin-dashboard');
      }
    } catch (error) {
      console.error('❌ Error saving match:', error);
      
      let errorMessage = `Error ${isEdit ? 'updating' : 'creating'} match: `;
      if (error.message.includes('event_id')) {
        errorMessage += 'Please select a valid event.';
      } else if (error.message.includes('scheduled_at')) {
        errorMessage += 'Please check the match schedule time.';
      } else if (error.message.includes('team')) {
        errorMessage += 'Please ensure both teams are selected and different.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading match data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Match' : 'Schedule New Match'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update match information and live scores' : 'Create a new Marvel Rivals competitive match'}
          </p>
        </div>
        <button 
          onClick={() => navigateTo && navigateTo('admin-dashboard')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Teams Selection */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎮 Teams</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team 1 *
              </label>
              <select
                name="team1Id"
                value={formData.team1Id}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select Team 1</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.short_name}) - Rating: {team.rating || 'Unranked'}
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
                name="team2Id"
                value={formData.team2Id}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select Team 2</option>
                {teams.map(team => (
                  <option 
                    key={team.id} 
                    value={team.id}
                    disabled={team.id == formData.team1Id}
                  >
                    {team.name} ({team.short_name}) - Rating: {team.rating || 'Unranked'}
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
                Event (Optional)
              </label>
              <select
                name="eventId"
                value={formData.eventId}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="">Standalone Match</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name} ({event.type})
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
                name="scheduledAt"
                value={formData.scheduledAt}
                onChange={handleInputChange}
                className="form-input"
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
                name="streamUrl"
                value={formData.streamUrl}
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

        {/* Marvel Rivals Maps Configuration */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🗺️ Marvel Rivals Maps ({formData.format})</h3>
          
          <div className="space-y-4">
            {formData.maps.map((map, index) => (
              <div key={index} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">Map {index + 1}</h4>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    map.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                    map.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                  }`}>
                    {map.status.toUpperCase()}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      Map Name
                    </label>
                    <select
                      value={map.map_name}
                      onChange={(e) => handleMapChange(index, 'map_name', e.target.value)}
                      className="form-input text-sm"
                    >
                      {MARVEL_RIVALS_CONFIG.maps.map(mapName => (
                        <option key={mapName} value={mapName}>{mapName}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {selectedTeam1?.short_name || 'Team 1'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={map.team1_score}
                      onChange={(e) => handleMapChange(index, 'team1_score', parseInt(e.target.value) || 0)}
                      className="form-input text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {selectedTeam2?.short_name || 'Team 2'} Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={map.team2_score}
                      onChange={(e) => handleMapChange(index, 'team2_score', parseInt(e.target.value) || 0)}
                      className="form-input text-sm"
                    />
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                  ✅ Scores automatically sync to overall match score • Winner determined by higher score
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <div className="font-medium mb-1">🎯 Current Match Score:</div>
              <div className="text-lg">
                {selectedTeam1?.short_name || 'Team 1'}: <span className="font-bold">{formData.team1_score}</span> - 
                {selectedTeam2?.short_name || 'Team 2'}: <span className="font-bold">{formData.team2_score}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateTo && navigateTo('admin-dashboard')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEdit ? 'Update Match' : 'Schedule Match'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MatchForm;