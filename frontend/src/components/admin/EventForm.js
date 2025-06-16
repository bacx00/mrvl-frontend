import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import ImageUpload from '../shared/ImageUpload';

function EventForm({ eventId, navigateTo }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'tournament', // FIXED: Use backend-supported values
    tier: 'B',
    status: 'upcoming',
    startDate: '',
    endDate: '',
    location: '',
    region: 'International',
    prizePool: '',
    teams: '',
    format: 'Single Elimination',
    organizer: '',
    image: '',
    registrationOpen: true,
    streamUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const { api } = useAuth();

  const isEdit = Boolean(eventId);

  const fetchEvent = async () => {
    if (!isEdit) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/admin/events/${eventId}`);
      const event = response.data || response;
      setFormData({
        name: event.name || '',
        description: event.description || '',
        type: event.type || 'tournament',
        tier: event.tier || 'B',
        status: event.status || 'upcoming',
        startDate: event.start_date ? event.start_date.split('T')[0] : event.startDate?.split('T')[0] || '',
        endDate: event.end_date ? event.end_date.split('T')[0] : event.endDate?.split('T')[0] || '',
        location: event.location || '',
        region: event.region || 'International',
        prizePool: event.prize_pool || event.prizePool || '',
        teams: event.teams || '',
        format: event.format || 'Single Elimination',
        organizer: event.organizer || '',
        image: event.image || '',
        registrationOpen: event.registration_open !== undefined ? event.registration_open : event.registrationOpen || true,
        streamUrl: event.stream_url || event.streamUrl || ''
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
  }, [eventId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageSelect = (file, previewUrl) => {
    setImageFile(file);
    setFormData(prev => ({
      ...prev,
      image: previewUrl || ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Event name is required');
      return;
    }
    
    if (!formData.startDate) {
      alert('Start date is required');
      return;
    }
    
    if (!formData.endDate) {
      alert('End date is required');
      return;
    }

    setSaving(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type, // Use exact backend-supported values
        tier: formData.tier,
        status: formData.status,
        start_date: formData.startDate,
        end_date: formData.endDate,
        location: formData.location,
        region: formData.region,
        prize_pool: formData.prizePool,
        teams: parseInt(formData.teams) || 0,
        format: formData.format,
        organizer: formData.organizer,
        image: formData.image,
        registration_open: formData.registrationOpen,
        stream_url: formData.streamUrl
      };

      let response;
      if (isEdit) {
        // FIXED: Use POST with method spoofing for Laravel backend updates
        submitData._method = 'PUT';
        response = await api.post(`/admin/events/${eventId}`, submitData);
      } else {
        response = await api.post('/admin/events', submitData);
      }

      alert(`Event ${isEdit ? 'updated' : 'created'} successfully!`);
      
      if (navigateTo) {
        navigateTo('admin-events');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert(`Error ${isEdit ? 'updating' : 'creating'} event: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // FIXED: Use backend-supported event types exactly as documented
  const eventTypes = [
    { value: 'tournament', label: 'Tournament' },
    { value: 'match', label: 'Match' },
    { value: 'scrim', label: 'Scrim' },
    { value: 'championship', label: 'Championship' },
    { value: 'regional', label: 'Regional' },
    { value: 'international', label: 'International' },
    { value: 'qualifier', label: 'Qualifier' },
    { value: 'community', label: 'Community' }
  ];

  const tiers = [
    { value: 'S', label: 'S-Tier (Major)' },
    { value: 'A', label: 'A-Tier (Premier)' },
    { value: 'B', label: 'B-Tier (Regional)' },
    { value: 'C', label: 'C-Tier (Community)' }
  ];

  const formats = [
    'Single Elimination',
    'Double Elimination',
    'Round Robin',
    'Swiss System',
    'Group Stage + Playoffs'
  ];

  const regions = [
    'International',
    'North America',
    'Europe',
    'Asia-Pacific',
    'South America',
    'Middle East & North Africa',
    'Oceania'
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Event' : 'Create New Event'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update event information' : 'Create a new esports event'}
          </p>
        </div>
        <button 
          onClick={() => navigateTo && navigateTo('admin-events')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Events
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Image */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Event Image
              </label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={formData.image}
                placeholder="Upload Event Image"
                className="w-full max-w-md"
              />
            </div>

            {/* Event Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Event Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Marvel Rivals Championship 2025"
                required
              />
            </div>

            {/* Description */}
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
                placeholder="Event description and details..."
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Event Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-input"
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
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Region
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="form-input"
              >
                {regions.map(region => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date & Location */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Date & Location</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
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
                name="endDate"
                value={formData.endDate}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Los Angeles, CA or Online"
              />
            </div>
          </div>
        </div>

        {/* Competition Details */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Competition Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Prize Pool
              </label>
              <input
                type="text"
                name="prizePool"
                value={formData.prizePool}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., $100,000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Number of Teams
              </label>
              <input
                type="number"
                name="teams"
                value={formData.teams}
                onChange={handleInputChange}
                className="form-input"
                min="2"
                max="128"
                placeholder="e.g., 32"
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
                    {format}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Organizer
              </label>
              <input
                type="text"
                name="organizer"
                value={formData.organizer}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Marvel Entertainment"
              />
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
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="registrationOpen"
                  checked={formData.registrationOpen}
                  onChange={handleInputChange}
                  className="mr-2"
                  id="registrationOpen"
                />
                <label htmlFor="registrationOpen" className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Registration is open
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateTo && navigateTo('admin-events')}
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
              isEdit ? 'Update Event' : 'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default EventForm;