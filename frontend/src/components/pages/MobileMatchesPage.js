import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { MobileMatchCard, MobileMatchList } from '../mobile/MobileMatchCard';
import { Calendar, Filter, Globe, Trophy, Clock } from 'lucide-react';
import { format } from 'date-fns';

// VLR.gg-style Mobile Matches Page
const MobileMatchesPage = ({ navigateTo }) => {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [matchesRes, eventsRes] = await Promise.allSettled([
        api.get('/matches'),
        api.get('/events?status=ongoing,upcoming')
      ]);

      if (matchesRes.status === 'fulfilled') {
        setMatches(matchesRes.value?.data?.data || []);
      }

      if (eventsRes.status === 'fulfilled') {
        setEvents(eventsRes.value?.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    // Auto-refresh for live matches
    const interval = setInterval(() => {
      if (activeTab === 'live') {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, activeTab]);

  // Filter matches
  const filteredMatches = matches.filter(match => {
    // Tab filter
    if (activeTab === 'live' && match.status !== 'live') return false;
    if (activeTab === 'upcoming' && match.status !== 'upcoming') return false;
    if (activeTab === 'results' && match.status !== 'completed') return false;

    // Event filter
    if (selectedEvent !== 'all' && match.event_id !== parseInt(selectedEvent)) return false;

    // Region filter
    if (selectedRegion !== 'all' && match.event?.region !== selectedRegion) return false;

    return true;
  });

  // Group matches by date
  const groupMatchesByDate = (matches) => {
    const groups = {};
    matches.forEach(match => {
      const date = match.scheduled_at ? format(new Date(match.scheduled_at), 'yyyy-MM-dd') : 'TBD';
      if (!groups[date]) groups[date] = [];
      groups[date].push(match);
    });
    return groups;
  };

  const groupedMatches = groupMatchesByDate(filteredMatches);

  const tabs = [
    { id: 'upcoming', label: 'Upcoming', icon: Clock },
    { id: 'live', label: 'Live', icon: null, showDot: true },
    { id: 'results', label: 'Results', icon: Trophy }
  ];

  const regions = ['all', 'NA', 'EU', 'APAC', 'CN', 'SA'];

  if (isLoading) {
    return <MobileLoadingSkeleton />;
  }

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 lg:hidden">
      {/* VLR.gg-style Live Banner */}
      {liveMatches.length > 0 && (
        <div className="bg-red-600 dark:bg-red-700 text-white py-2 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="text-sm font-bold">LIVE</span>
              <span className="text-xs opacity-90">{liveMatches.length} match{liveMatches.length > 1 ? 'es' : ''}</span>
            </div>
            <button 
              onClick={() => setActiveTab('live')}
              className="text-xs underline opacity-90 hover:opacity-100"
            >
              View Live
            </button>
          </div>
        </div>
      )}

      {/* Header Tabs */}
      <div className="sticky top-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="flex">
          {tabs.map(tab => {
            const hasLive = tab.id === 'live' && liveMatches.length > 0;
            const count = tab.id === 'live' ? liveMatches.length : 
                         tab.id === 'upcoming' ? upcomingMatches.length : 
                         matches.filter(m => m.status === 'completed').length;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-red-600 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400'
                }`}
              >
                {hasLive && tab.showDot && (
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                )}
                {tab.icon && <tab.icon className="w-4 h-4" />}
                <span className="text-sm font-medium">{tab.label}</span>
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.id 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-x-auto scrollbar-hide">
            {/* Event Filter */}
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>

            {/* Region Pills */}
            <div className="flex space-x-1">
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setSelectedRegion(region)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedRegion === region
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Matches List */}
      <div className="px-4 py-4">
        {Object.keys(groupedMatches).length > 0 ? (
          Object.entries(groupedMatches).map(([date, matches]) => (
            <div key={date} className="mb-6">
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                {date === 'TBD' ? 'Date TBD' : formatMatchDate(date)}
              </h3>
              <div className="space-y-2">
                {matches.map(match => (
                  <MobileMatchCard
                    key={match.id}
                    match={match}
                    onClick={() => navigateTo('match-detail', { id: match.id })}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <EmptyState tab={activeTab} />
        )}
      </div>
    </div>
  );
};

// Helper Functions
const formatMatchDate = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return 'Tomorrow';
  } else {
    return format(date, 'EEEE, MMMM d');
  }
};

const EmptyState = ({ tab }) => {
  const messages = {
    live: 'No live matches right now',
    upcoming: 'No upcoming matches scheduled',
    results: 'No recent match results'
  };

  return (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
      <p className="text-gray-500 dark:text-gray-400">{messages[tab]}</p>
    </div>
  );
};

const MobileLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-32 animate-pulse" />
      ))}
    </div>
  </div>
);

export default MobileMatchesPage;