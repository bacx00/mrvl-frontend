import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getEventLogoUrl, getEventBannerUrl } from '../../utils/imageUtils';

function EventsPage({ navigateTo }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const { api, isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      console.log('EventsPage: Fetching events from API...');
      
      // Fetch all events with recent sort to avoid filtering
      const url = '/events?sort=recent';
      
      const response = await api.get(url);
      const eventsData = response.data?.data || response.data || [];
      
      console.log('Events fetched:', eventsData);
      setEvents(eventsData);
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
    
    // Filter by status (tab)
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(event => event.status === 'upcoming');
        break;
      case 'ongoing':
        filtered = filtered.filter(event => event.status === 'ongoing' || event.status === 'live');
        break;
      case 'completed':
        filtered = filtered.filter(event => event.status === 'completed');
        break;
      default:
        break;
    }
    
    // Filter by region
    if (regionFilter !== 'all') {
      filtered = filtered.filter(event => event.region === regionFilter);
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredEvents = getFilteredEvents();

  // VLR.gg Style Event Card Component
  const EventCard = ({ event }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'live': 
        case 'ongoing': 
          return 'bg-red-600 text-white';
        case 'upcoming': 
          return 'bg-blue-600 text-white';
        case 'completed': 
          return 'bg-gray-600 text-white';
        default: 
          return 'bg-gray-400 text-white';
      }
    };

    const formatPrizePool = (amount) => {
      if (!amount || amount === 0) return null;
      if (typeof amount === 'string') {
        return amount;
      }
      return `$${amount.toLocaleString()}`;
    };

    const formatDateRange = () => {
      const startDate = new Date(event.schedule?.start_date || event.start_date);
      const endDate = new Date(event.schedule?.end_date || event.end_date);
      
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      return `${startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} - ${endDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}`;
    };

    return (
      <div 
        className="border-b border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
        onClick={() => navigateTo && navigateTo('event-detail', { id: event.id })}
      >
        <div className="flex items-center space-x-4">
          {/* Event Logo */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
            <img 
              src={getEventLogoUrl(event)} 
              alt={event.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-gray-400">?</div>';
              }}
            />
          </div>
          
          {/* Event Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-2">
                {event.name}
              </h3>
              <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${getStatusColor(event.status)} ${event.status === 'live' ? 'animate-pulse' : ''}`}>
                {event.status === 'live' && <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>}
                {event.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-500">Date:</span>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formatDateRange()}
                </div>
              </div>
              
              {formatPrizePool(event.details?.prize_pool || event.prize_pool) && (
                <div>
                  <span className="text-gray-500 dark:text-gray-500">Prize Pool:</span>
                  <div className="font-medium text-green-600 dark:text-green-400">
                    {formatPrizePool(event.details?.prize_pool || event.prize_pool)}
                  </div>
                </div>
              )}
              
              {(event.details?.region || event.region) && (
                <div>
                  <span className="text-gray-500 dark:text-gray-500">Region:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {event.details?.region || event.region}
                  </div>
                </div>
              )}
              
              {(event.details?.format || event.format) && (
                <div>
                  <span className="text-gray-500 dark:text-gray-500">Format:</span>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {event.details?.format || event.format}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

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
            Upcoming ({events.filter(e => e.status === 'upcoming').length})
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
              {events.filter(e => e.status === 'ongoing' || e.status === 'live').length > 0 && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
              <span>Ongoing ({events.filter(e => e.status === 'ongoing' || e.status === 'live').length})</span>
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
            Completed ({events.filter(e => e.status === 'completed').length})
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
                <option value="NA">North America</option>
                <option value="EU">Europe</option>
                <option value="APAC">Asia-Pacific</option>
                <option value="BR">Brazil</option>
                <option value="LATAM">LATAM</option>
                <option value="INTL">International</option>
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
          <div>
            {filteredEvents.map(event => (
              <EventCard 
                key={event.id}
                event={event}
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
              {searchTerm 
                ? `No events matching "${searchTerm}"`
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