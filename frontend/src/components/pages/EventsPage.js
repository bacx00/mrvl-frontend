import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function EventsPage({ navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('upcoming');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      console.log('🔍 EventsPage: Fetching REAL BACKEND EVENTS...');
      
      // First try to get REAL events from backend API
      try {
        const response = await api.get('/events');
        const eventsData = response?.data?.data || response?.data || response || [];
        
        if (Array.isArray(eventsData) && eventsData.length > 0) {
          // Transform backend events data with enhanced fields
          const transformedEvents = eventsData.map(event => ({
            id: event.id,
            name: event.name || 'Marvel Rivals Event',
            tier: event.tier || 'A',
            type: event.type || 'Regional',
            status: event.status || 'upcoming',
            startDate: event.start_date || event.startDate || '2025-02-01',
            endDate: event.end_date || event.endDate || '2025-02-08',
            prizePool: event.prize_pool || event.prizePool || '$100,000',
            teams: event.teams_count || event.teams || 16,
            location: event.location || 'Online',
            region: event.region || 'INTL',
            organizer: event.organizer || 'Marvel Rivals League',
            format: event.format || 'Swiss + Playoffs',
            description: event.description || 'Professional Marvel Rivals tournament featuring top teams.',
            registrationOpen: event.registration_open || false,
            streamViewers: event.viewers || 0, // ✅ FIXED: No fake viewers, use real backend data only
            // Additional HLTV.org style fields
            stage: event.stage || 'Main Event',
            onlineEvent: event.online || false,
            featuredMatches: event.featured_matches || 0
          }));
          
          setEvents(transformedEvents);
          console.log('✅ EventsPage: Using REAL backend events:', transformedEvents.length);
        } else {
          throw new Error('No real events found');
        }
      } catch (backendError) {
        console.log('⚠️ EventsPage: Backend API failed, no events available');
        // Pure backend sync - no fallbacks
        setEvents([]);
      }
    } catch (error) {
      console.error('❌ EventsPage: Error loading events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Country flag helper function
  const getCountryFlag = (countryCode) => {
    const flagMap = {
      'US': '🇺🇸', 'CA': '🇨🇦', 'UK': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'SE': '🇸🇪',
      'KR': '🇰🇷', 'AU': '🇦🇺', 'BR': '🇧🇷', 'JP': '🇯🇵', 'CN': '🇨🇳', 'INTL': '🌍',
      'North America': '🇺🇸', 'Europe': '🇪🇺', 'Asia Pacific': '🌏', 'International': '🌍'
    };
    return flagMap[countryCode] || '🌍';
  };

  // Filter events by status
  const filteredEvents = selectedStatus === 'all' 
    ? events 
    : events.filter(event => event.status === selectedStatus);

  // Group events by tier for HLTV.org style display
  const eventsByTier = {
    'S': filteredEvents.filter(e => e.tier === 'S'),
    'A': filteredEvents.filter(e => e.tier === 'A'),
    'B': filteredEvents.filter(e => e.tier === 'B'),
    'C': filteredEvents.filter(e => e.tier === 'C')
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      case 'completed': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'S': return 'text-yellow-600 dark:text-yellow-400';
      case 'A': return 'text-red-600 dark:text-red-400';
      case 'B': return 'text-blue-600 dark:text-blue-400';
      case 'C': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTierBadge = (tier) => {
    const colors = {
      'S': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
      'A': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
      'B': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
      'C': 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700'
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded border ${colors[tier] || colors.C}`}>
        {tier}-Tier
      </span>
    );
  };

  // CRITICAL FIX: Enhanced event click handler with proper navigation
  const handleEventClick = (eventId) => {
    console.log('🔗 EventsPage: Navigating to event detail:', eventId);
    if (navigateTo && typeof navigateTo === 'function') {
      navigateTo('event-detail', { id: eventId });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const sameMonth = start.getMonth() === end.getMonth();
    
    if (sameMonth) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
    }
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">📅</div>
          <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500 mb-4">
        <button 
          onClick={() => navigateTo('home')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Home
        </button>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">Events</span>
      </div>

      {/* Header with Admin Controls */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marvel Rivals Events</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Upcoming tournaments, championships, and competitive events</p>
        </div>
        {/* Admin/Moderator Controls */}
        {(isAdmin() || isModerator()) && (
          <button 
            onClick={() => navigateTo && navigateTo('admin-event-create')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            📅 Create Event
          </button>
        )}
      </div>

      {/* Status Filter Tabs - HLTV.org Style */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {[
            { id: 'upcoming', label: 'Upcoming', icon: '📅' },
            { id: 'live', label: 'Live', icon: '🔴' },
            { id: 'completed', label: 'Completed', icon: '✅' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center space-x-2 ${
                selectedStatus === tab.id
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                  : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full text-xs">
                {events.filter(e => e.status === tab.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Events Display - Grouped by Tier */}
        <div className="p-6">
          {Object.entries(eventsByTier).map(([tier, tierEvents]) => {
            if (tierEvents.length === 0) return null;
            
            return (
              <div key={tier} className="mb-8 last:mb-0">
                <div className="flex items-center space-x-3 mb-4">
                  <h2 className={`text-xl font-bold ${getTierColor(tier)}`}>
                    {tier}-Tier Tournaments
                  </h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({tierEvents.length} event{tierEvents.length !== 1 ? 's' : ''})
                  </span>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {tierEvents.map(event => (
                    <div 
                      key={event.id} 
                      className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:border-red-300 dark:hover:border-red-600 cursor-pointer transition-all duration-200 transform hover:scale-[1.02]"
                      onClick={() => handleEventClick(event.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-xl">{getCountryFlag(event.region)}</span>
                          {getTierBadge(tier)}
                          <span className={`px-2 py-1 text-xs font-bold rounded ${getStatusColor(event.status)}`}>
                            {event.status.toUpperCase()}
                          </span>
                        </div>
                        {event.status === 'live' && event.streamViewers > 0 && (
                          <div className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                            <span className="text-xs">🔴</span>
                            <span className="text-xs font-medium">
                              {event.streamViewers.toLocaleString()} viewers
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors mb-2 line-clamp-2">
                        {event.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {event.description}
                      </p>

                      {/* Event Details Grid - HLTV.org Style */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                          <span className="text-gray-500 dark:text-gray-500">📅 Dates:</span>
                          <span className="font-medium text-gray-900 dark:text-white text-xs">
                            {formatDateRange(event.startDate, event.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                          <span className="text-gray-500 dark:text-gray-500">💰 Prize:</span>
                          <span className="font-bold text-green-600 dark:text-green-400 text-xs">{event.prizePool}</span>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                          <span className="text-gray-500 dark:text-gray-500">👥 Teams:</span>
                          <span className="font-medium text-gray-900 dark:text-white text-xs">{event.teams}</span>
                        </div>
                        <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                          <span className="text-gray-500 dark:text-gray-500">📍 Location:</span>
                          <span className="font-medium text-gray-900 dark:text-white text-xs truncate" title={event.location}>
                            {event.location}
                          </span>
                        </div>
                      </div>

                      {/* Additional Info Row */}
                      <div className="mt-3 flex items-center justify-between text-xs">
                        <div className="text-gray-500 dark:text-gray-500">
                          <span>🏆 Format: {event.format}</span>
                        </div>
                        <div className="text-gray-500 dark:text-gray-500">
                          <span>📊 Stage: {event.stage || 'Main Event'}</span>
                        </div>
                      </div>

                      {/* Call to Action */}
                      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            Click for full details, matches & results
                          </span>
                          <div className="text-red-600 dark:text-red-400 font-medium text-sm">
                            View Event →
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* No Events Found */}
          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Events Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedStatus === 'live' 
                  ? 'No events are currently live. Check back later!'
                  : selectedStatus === 'upcoming'
                  ? 'No upcoming events scheduled. Stay tuned for announcements!'
                  : 'No completed events to display.'
                }
              </p>
              <button
                onClick={() => setSelectedStatus('upcoming')}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                View Upcoming Events
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {events.filter(e => e.status === 'live').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Live Events</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {events.filter(e => e.status === 'upcoming').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming Events</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {events.reduce((sum, e) => sum + (e.teams || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Teams</div>
        </div>
      </div>
    </div>
  );
}

export default EventsPage;