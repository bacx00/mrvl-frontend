import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

// CRITICAL FIX: Helper function to get a default future date (1 hour from now)
const getDefaultFutureDate = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1); // Add 1 hour to current time
  return now.toISOString().slice(0, 16); // Format for datetime-local input
};

function MatchForm({ matchId, navigateTo }) {
  const [formData, setFormData] = useState({
    team1Id: '',
    team2Id: '',
    eventId: '',
    scheduledAt: getDefaultFutureDate(), // FIXED: Default to future date
    format: 'BO3',
    status: 'upcoming',
    streamUrl: '',
    description: '',
    mapPool: []
  });
  const [teams, setTeams] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
      
      setTeams(teamsResponse.data || teamsResponse || []);
      setEvents(eventsResponse.data || eventsResponse || []);

      // FIXED: If editing, use public matches endpoint instead of admin GET (which doesn't exist)
      if (isEdit) {
        try {
          const response = await api.get(`/matches/${matchId}`);
          const match = response.data || response;
          setFormData({
            team1Id: match.team1_id || match.team1?.id || '',
            team2Id: match.team2_id || match.team2?.id || '',
            eventId: match.event_id || match.event?.id || '',
            scheduledAt: match.scheduled_at ? match.scheduled_at.slice(0, 16) : '',
            format: match.format || 'BO3',
            status: match.status || 'upcoming',
            streamUrl: match.stream_url || match.streamUrl || '',
            description: match.description || '',
            mapPool: match.map_pool || match.mapPool || []
          });
        } catch (matchError) {
          console.warn('Could not fetch match details, using default values:', matchError);
          // Continue with default form data if match can't be fetched
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [matchId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.team1Id) {
      alert('Please select Team 1');
      return;
    }
    
    if (!formData.team2Id) {
      alert('Please select Team 2');
      return;
    }
    
    if (formData.team1Id === formData.team2Id) {
      alert('Team 1 and Team 2 cannot be the same');
      return;
    }
    
    if (!formData.scheduledAt) {
      alert('Please set a match time');
      return;
    }

    // CRITICAL FIX: Validate that scheduled time is in the future
    const scheduledTime = new Date(formData.scheduledAt);
    const now = new Date();
    if (scheduledTime <= now) {
      alert('Match time must be in the future. Please select a time after now.');
      return;
    }

    // CRITICAL FIX: Backend REQUIRES event_id, cannot be null
    if (!formData.eventId) {
      alert('Please select an event. Standalone matches are not supported by the backend.');
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        team1_id: formData.team1Id,
        team2_id: formData.team2Id,
        event_id: formData.eventId || null, // FIXED: Ensure null instead of empty string
        scheduled_at: formData.scheduledAt,
        format: formData.format,
        status: formData.status,
        stream_url: formData.streamUrl,
        description: formData.description,
        map_pool: formData.mapPool
      };

      console.log('🔄 Submitting match data:', submitData);

      let response;
      if (isEdit) {
        // FIXED: Use POST with method spoofing for Laravel backend updates
        submitData._method = 'PUT';
        response = await api.post(`/admin/matches/${matchId}`, submitData);
      } else {
        response = await api.post('/admin/matches', submitData);
      }

      alert(`Match ${isEdit ? 'updated' : 'created'} successfully!`);
      
      if (navigateTo) {
        navigateTo('admin-dashboard');
      }
    } catch (error) {
      console.error('Error saving match:', error);
      
      // Enhanced error handling
      let errorMessage = `Error ${isEdit ? 'updating' : 'creating'} match: `;
      if (error.message.includes('event id field is required')) {
        errorMessage += 'Please select an event or confirm standalone match creation.';
      } else if (error.message.includes('scheduled at field must be a date after now')) {
        errorMessage += 'Match time must be in the future.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formats = ['BO1', 'BO3', 'BO5', 'BO7'];
  const statuses = ['upcoming', 'live', 'completed', 'cancelled', 'postponed'];
  const maps = [
    'Asgard Throne Room',
    'Helicarrier Command',
    'Sanctum Sanctorum',
    'Bifrost Arena',
    'Wakanda Plains',
    'Stark Tower',
    'X-Mansion',
    'Baxter Building'
  ];

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
            {isEdit ? 'Update match information' : 'Create a new competitive match'}
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Teams</h3>
          
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
                    {team.name} ({team.short_name || team.shortName})
                  </option>
                ))}
              </select>
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
                    disabled={team.id === formData.team1Id}
                  >
                    {team.name} ({team.short_name || team.shortName})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Match Details */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Match Details</h3>
          
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
                <option value="">No Event / Standalone Match</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
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
                Format
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="form-input"
              >
                {formats.map(format => (
                  <option key={format} value={format}>
                    {format} - Best of {format.slice(2)}
                  </option>
                ))}
              </select>
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
                {statuses.map(status => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
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