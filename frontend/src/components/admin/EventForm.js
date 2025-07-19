import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import ImageUpload from '../shared/ImageUpload';

function EventForm({ eventId, navigateTo }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'tournament',
    tier: 'B',
    format: 'single_elimination',
    region: 'International',
    game_mode: 'Convoy',
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: '',
    max_teams: 16,
    prize_pool: '',
    currency: 'USD',
    prize_distribution: {},
    logo: '',
    banner: '',
    rules: '',
    registration_requirements: {},
    streams: {},
    social_links: {},
    timezone: 'UTC',
    featured: false,
    public: true,
    status: 'upcoming'
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [teams, setTeams] = useState([]);
  const [eventTeams, setEventTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const { api } = useAuth();

  const isEdit = Boolean(eventId);

  const fetchTeams = async () => {
    try {
      const response = await api.get('/teams');
      const teamsData = response?.data?.data || response?.data || [];
      setTeams(teamsData);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchEventTeams = async () => {
    if (!eventId) return;
    try {
      const response = await api.get(`/admin/events/${eventId}/teams`);
      const teamsData = response?.data?.data || response?.data || [];
      setEventTeams(teamsData);
    } catch (error) {
      console.error('Error fetching event teams:', error);
    }
  };

  const fetchEvent = async () => {
    if (!isEdit) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/admin/events/${eventId}`);
      const event = response.data?.data || response.data || response;
      
      setFormData({
        name: event.name || '',
        description: event.description || '',
        type: event.type || 'tournament',
        tier: event.tier || 'B',
        format: event.format || 'single_elimination',
        region: event.region || 'International',
        game_mode: event.game_mode || 'Convoy',
        start_date: event.start_date ? event.start_date.split(' ')[0] : '',
        end_date: event.end_date ? event.end_date.split(' ')[0] : '',
        registration_start: event.registration_start ? event.registration_start.split(' ')[0] : '',
        registration_end: event.registration_end ? event.registration_end.split(' ')[0] : '',
        max_teams: event.max_teams || 16,
        prize_pool: event.prize_pool || '',
        currency: event.currency || 'USD',
        prize_distribution: event.prize_distribution || {},
        logo: event.logo || '',
        banner: event.banner || '',
        rules: event.rules || '',
        registration_requirements: event.registration_requirements || {},
        streams: event.streams || {},
        social_links: event.social_links || {},
        timezone: event.timezone || 'UTC',
        featured: event.featured || false,
        public: event.public !== undefined ? event.public : true,
        status: event.status || 'upcoming'
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Error loading event data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchTeams();
    if (eventId) {
      fetchEventTeams();
    }
  }, [eventId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLogoSelect = (file, previewUrl) => {
    setLogoFile(file);
    setFormData(prev => ({
      ...prev,
      logo: previewUrl || ''
    }));
  };

  const handleBannerSelect = (file, previewUrl) => {
    setBannerFile(file);
    setFormData(prev => ({
      ...prev,
      banner: previewUrl || ''
    }));
  };

  const handleAddTeam = async () => {
    if (!selectedTeamId || !eventId) return;
    
    try {
      await api.post(`/admin/events/${eventId}/teams/${selectedTeamId}`);
      await fetchEventTeams();
      setSelectedTeamId('');
      alert('Team added successfully!');
    } catch (error) {
      console.error('Error adding team:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error adding team';
      alert(errorMessage);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to remove this team?')) return;
    
    try {
      await api.delete(`/admin/events/${eventId}/teams/${teamId}`);
      await fetchEventTeams();
      alert('Team removed successfully!');
    } catch (error) {
      console.error('Error removing team:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error removing team';
      alert(errorMessage);
    }
  };

  const uploadImage = async (file, type, eventId) => {
    if (!file || !eventId) return null;
    
    const imageFormData = new FormData();
    imageFormData.append(type, file);
    
    try {
      const response = await api.post(`/admin/events/${eventId}/${type}`, imageFormData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data?.logo_url || response.data?.banner_url || response.data?.url;
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Event name is required');
      return;
    }
    
    if (!formData.description.trim() || formData.description.length < 20) {
      alert('Description must be at least 20 characters');
      return;
    }
    
    if (!formData.start_date) {
      alert('Start date is required');
      return;
    }
    
    if (!formData.end_date) {
      alert('End date is required');
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        tier: formData.tier,
        format: formData.format,
        region: formData.region,
        game_mode: formData.game_mode,
        start_date: formData.start_date,
        end_date: formData.end_date,
        registration_start: formData.registration_start || null,
        registration_end: formData.registration_end || null,
        max_teams: parseInt(formData.max_teams) || 16,
        prize_pool: parseFloat(formData.prize_pool) || null,
        currency: formData.currency,
        prize_distribution: Object.keys(formData.prize_distribution).length > 0 ? formData.prize_distribution : null,
        rules: formData.rules || null,
        registration_requirements: Object.keys(formData.registration_requirements).length > 0 ? formData.registration_requirements : null,
        streams: Object.keys(formData.streams).length > 0 ? formData.streams : null,
        social_links: Object.keys(formData.social_links).length > 0 ? formData.social_links : null,
        timezone: formData.timezone,
        featured: formData.featured,
        public: formData.public,
        status: formData.status
      };

      let response;
      if (isEdit) {
        response = await api.put(`/admin/events/${eventId}`, submitData);
      } else {
        response = await api.post('/admin/events', submitData);
      }

      const createdEventId = response.data?.data?.id || eventId;

      // Upload images after event creation/update
      if (logoFile && createdEventId) {
        const logoUrl = await uploadImage(logoFile, 'logo', createdEventId);
        if (logoUrl) {
          console.log('Logo uploaded successfully:', logoUrl);
        }
      }

      if (bannerFile && createdEventId) {
        const bannerUrl = await uploadImage(bannerFile, 'banner', createdEventId);
        if (bannerUrl) {
          console.log('Banner uploaded successfully:', bannerUrl);
        }
      }

      alert(`Event ${isEdit ? 'updated' : 'created'} successfully!`);
      
      if (navigateTo) {
        navigateTo('admin-events');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      alert(`Error ${isEdit ? 'updating' : 'creating'} event: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const eventTypes = [
    { value: 'championship', label: 'Championship' },
    { value: 'tournament', label: 'Tournament' },
    { value: 'scrim', label: 'Scrim' },
    { value: 'qualifier', label: 'Qualifier' },
    { value: 'regional', label: 'Regional' },
    { value: 'international', label: 'International' },
    { value: 'invitational', label: 'Invitational' },
    { value: 'community', label: 'Community' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'practice', label: 'Practice' },
    { value: 'exhibition', label: 'Exhibition' }
  ];

  const tiers = [
    { value: 'S', label: 'S-Tier (Premier)' },
    { value: 'A', label: 'A-Tier (Major)' },
    { value: 'B', label: 'B-Tier (Regional)' },
    { value: 'C', label: 'C-Tier (Community)' }
  ];

  const formats = [
    { value: 'single_elimination', label: 'Single Elimination' },
    { value: 'double_elimination', label: 'Double Elimination' },
    { value: 'round_robin', label: 'Round Robin' },
    { value: 'swiss', label: 'Swiss System' },
    { value: 'group_stage', label: 'Group Stage' },
    { value: 'bo1', label: 'Best of 1' },
    { value: 'bo3', label: 'Best of 3' },
    { value: 'bo5', label: 'Best of 5' }
  ];

  const gameModes = [
    'Convoy',
    'Domination', 
    'Convergence'
  ];

  const regions = [
    'International',
    'North America',
    'Europe', 
    'Asia-Pacific',
    'China',
    'South America',
    'Middle East & North Africa',
    'Oceania'
  ];

  const currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'CNY', label: 'CNY (¥)' },
    { value: 'KRW', label: 'KRW (₩)' }
  ];

  const statuses = [
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading event data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update event information and settings' : 'Create a comprehensive Marvel Rivals tournament'}
          </p>
        </div>
        <button 
          onClick={() => navigateTo && navigateTo('admin-events')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Events
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Images */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Event Images</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Event Logo
              </label>
              <ImageUpload
                onImageSelect={handleLogoSelect}
                currentImage={formData.logo}
                placeholder="Upload Event Logo (512x512)"
                className="w-full max-w-sm"
                aspectRatio="square"
              />
              <p className="text-xs text-gray-500 mt-2">Recommended: 512x512px, PNG format</p>
            </div>

            {/* Banner */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Event Banner
              </label>
              <ImageUpload
                onImageSelect={handleBannerSelect}
                currentImage={formData.banner}
                placeholder="Upload Event Banner (1920x1080)"
                className="w-full"
                aspectRatio="16/9"
              />
              <p className="text-xs text-gray-500 mt-2">Recommended: 1920x1080px, JPG format</p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Event Name */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Marvel Rivals World Championship 2025"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="form-input"
                placeholder="Detailed event description (minimum 20 characters)..."
                required
                minLength={20}
              />
              <p className="text-xs text-gray-500 mt-1">{formData.description.length}/20 characters minimum</p>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Event Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                {eventTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Tier */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Tier
              </label>
              <select
                name="tier"
                value={formData.tier}
                onChange={handleInputChange}
                className="form-input"
              >
                {tiers.map(tier => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
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
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Region *
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Game Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Game Mode *
              </label>
              <select
                name="game_mode"
                value={formData.game_mode}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                {gameModes.map(mode => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Timezone
              </label>
              <input
                type="text"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., UTC, EST, PST"
              />
            </div>
          </div>
        </div>

        {/* Tournament Format */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Tournament Format</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Format */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Format *
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                {formats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Max Teams */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Max Teams *
              </label>
              <input
                type="number"
                name="max_teams"
                value={formData.max_teams}
                onChange={handleInputChange}
                className="form-input"
                min="2"
                max="256"
                required
              />
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Schedule</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                End Date *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            {/* Registration Dates */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Registration Start
              </label>
              <input
                type="date"
                name="registration_start"
                value={formData.registration_start}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Registration End
              </label>
              <input
                type="date"
                name="registration_end"
                value={formData.registration_end}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Prize Information */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Prize Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Prize Pool
              </label>
              <input
                type="number"
                name="prize_pool"
                value={formData.prize_pool}
                onChange={handleInputChange}
                className="form-input"
                step="0.01"
                min="0"
                placeholder="100000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className="form-input"
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Additional Information</h3>
          
          <div className="space-y-6">
            {/* Rules */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Rules & Regulations
              </label>
              <textarea
                name="rules"
                value={formData.rules}
                onChange={handleInputChange}
                rows={4}
                className="form-input"
                placeholder="Tournament rules, code of conduct, technical requirements..."
              />
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Event Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="featured"
                checked={formData.featured}
                onChange={handleInputChange}
                className="mr-3"
                id="featured"
              />
              <label htmlFor="featured" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Featured Event (appears prominently on homepage)
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="public"
                checked={formData.public}
                onChange={handleInputChange}
                className="mr-3"
                id="public"
              />
              <label htmlFor="public" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Public Event (visible to all users)
              </label>
            </div>
          </div>
        </div>

        {/* Team Management - Only show for existing events */}
        {isEdit && eventId && (
          <div className="card p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Team Management</h3>
            
            {/* Add Team */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Add Team to Event
              </label>
              <div className="flex gap-4">
                <select
                  value={selectedTeamId}
                  onChange={(e) => setSelectedTeamId(e.target.value)}
                  className="form-input flex-1"
                >
                  <option value="">Select a team...</option>
                  {teams.filter(team => !eventTeams.some(et => et.id === team.id)).map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name} ({team.short_name}) - {team.region}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddTeam}
                  disabled={!selectedTeamId}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  Add Team
                </button>
              </div>
            </div>

            {/* Current Teams */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                Current Teams ({eventTeams.length}/{formData.max_teams})
              </h4>
              {eventTeams.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">No teams registered yet</p>
              ) : (
                <div className="space-y-2">
                  {eventTeams.map((team, index) => (
                    <div key={team.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-500">#{team.seed || index + 1}</span>
                        {team.logo && (
                          <img src={team.logo} alt={team.name} className="w-8 h-8 rounded" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{team.name}</div>
                          <div className="text-sm text-gray-500">{team.region} • Rating: {team.rating || 1000}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveTeam(team.id)}
                        className="text-red-600 hover:text-red-700 font-medium text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigateTo && navigateTo('admin-events')}
            className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {saving ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEdit ? 'Update Event' : 'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventForm;