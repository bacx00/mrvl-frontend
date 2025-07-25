import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import EventCard from '../EventCard';

function EventsPage({ navigateTo }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const { api, isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('EventsPage: Fetching events from API...');
      
      // Fetch all events without date filtering
      const url = '/events?sort=all';
      
      const response = await api.get(url);
      const eventsData = response.data?.data || response.data || [];
      
      console.log('Events fetched:', eventsData);
      
      // Transform nested data structure to flat structure for easier use
      const transformedEvents = eventsData.map(event => ({
        ...event,
        // Flatten details
        type: event.details?.type || event.type,
        format: event.details?.format || event.format,
        region: event.details?.region || event.region,
        game_mode: event.details?.game_mode || event.game_mode,
        prize_pool: event.details?.prize_pool || event.prize_pool,
        currency: event.details?.currency || event.currency || 'USD',
        // Flatten schedule
        start_date: event.schedule?.start_date || event.start_date,
        end_date: event.schedule?.end_date || event.end_date,
        registration_start: event.schedule?.registration_start || event.registration_start,
        registration_end: event.schedule?.registration_end || event.registration_end,
        timezone: event.schedule?.timezone || event.timezone || 'UTC',
        // Flatten participation
        max_teams: event.participation?.max_teams || event.max_teams,
        current_teams: event.participation?.current_teams || event.current_teams || 0,
        registration_open: event.participation?.registration_open || event.registration_open,
        teams: event.participation?.teams || event.teams || []
      }));
      
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered events based on active tab and region
  const getFilteredEvents = () => {
    let filtered = events;
    
    // Filter by status (tab) with date-based fallback
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(event => {
          const status = event.status === 'upcoming';
          const dateBasedUpcoming = event.start_date && new Date(event.start_date) > new Date();
          return status || (!event.status && dateBasedUpcoming);
        });
        break;
      case 'ongoing':
        filtered = filtered.filter(event => {
          const status = event.status === 'ongoing' || event.status === 'live';
          const dateBasedOngoing = event.start_date && event.end_date && 
            new Date() >= new Date(event.start_date) && new Date() <= new Date(event.end_date);
          return status || (!event.status && dateBasedOngoing);
        });
        break;
      case 'completed':
        filtered = filtered.filter(event => {
          const status = event.status === 'completed';
          const dateBasedCompleted = event.end_date && new Date(event.end_date) < new Date();
          return status || (!event.status && dateBasedCompleted);
        });
        break;
      default:
        break;
    }
    
    // Filter by region
    if (regionFilter !== 'all') {
      filtered = filtered.filter(event => event.region === regionFilter);
    }
    
    // Filter by search term (improved search using debounced term)
    if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      filtered = filtered.filter(event => 
        (event.name && event.name.toLowerCase().includes(searchLower)) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        (event.type && event.type.toLowerCase().includes(searchLower)) ||
        (event.region && event.region.toLowerCase().includes(searchLower))
      );
    }
    
    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  // Helper function to get count for each status with date-based fallback
  const getStatusCount = (status) => {
    return events.filter(event => {
      switch (status) {
        case 'upcoming':
          const statusUpcoming = event.status === 'upcoming';
          const dateBasedUpcoming = event.start_date && new Date(event.start_date) > new Date();
          return statusUpcoming || (!event.status && dateBasedUpcoming);
        case 'ongoing':
          const statusOngoing = event.status === 'ongoing' || event.status === 'live';
          const dateBasedOngoing = event.start_date && event.end_date && 
            new Date() >= new Date(event.start_date) && new Date() <= new Date(event.end_date);
          return statusOngoing || (!event.status && dateBasedOngoing);
        case 'completed':
          const statusCompleted = event.status === 'completed';
          const dateBasedCompleted = event.end_date && new Date(event.end_date) < new Date();
          return statusCompleted || (!event.status && dateBasedCompleted);
        default:
          return false;
      }
    }).length;
  };

  // Get available regions from actual event data
  const availableRegions = React.useMemo(() => {
    const regions = [...new Set(events.map(event => event.region).filter(Boolean))];
    const regionMap = {
      'NA': 'North America',
      'EU': 'Europe',
      'APAC': 'Asia-Pacific',
      'CN': 'China',
      'SA': 'South America',
      'MENA': 'Middle East & North Africa',
      'OCE': 'Oceania',
      'INTL': 'International'
    };
    return regions.map(code => ({ code, name: regionMap[code] || code }));
  }, [events]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header - VLR.gg Style */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Events</h1>
        {(isAdmin() || isModerator()) && (
          <button 
            onClick={() => navigateTo && navigateTo('admin-event-create')}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Create Event
          </button>
        )}
      </div>

      {/* Tabs and Filters - VLR.gg Style */}
      <div className="card">
        {/* Event Type Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Upcoming ({getStatusCount('upcoming')})
          </button>
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'ongoing'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {getStatusCount('ongoing') > 0 && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
              <span>Ongoing ({getStatusCount('ongoing')})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Completed ({getStatusCount('completed')})
          </button>
        </div>

        {/* Secondary Filters */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Region Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Region:</span>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Regions</option>
                {availableRegions.map(region => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative flex-1 md:max-w-xs">
              <input
                type="text"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1 pl-9 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <svg className="absolute left-3 top-1.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Events List - VLR.gg Style */}
        {filteredEvents.length > 0 ? (
          <div className="space-y-4">
            {filteredEvents.map(event => (
              <EventCard 
                key={event.id}
                event={event}
                navigateTo={navigateTo}
              />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="text-4xl mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab} events
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {debouncedSearchTerm 
                ? `No events matching "${debouncedSearchTerm}"`
                : regionFilter !== 'all'
                ? `No ${activeTab} events in this region`
                : activeTab === 'upcoming' 
                  ? 'No upcoming events scheduled'
                  : activeTab === 'ongoing'
                  ? 'No events currently ongoing'
                  : 'No completed events to show'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventsPage;