import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import MatchCard from '../MatchCard';
import { TeamLogo } from '../../utils/imageUtils';
import VirtualScrollList from '../mobile/VirtualScrollList';

function MatchesPage({ navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState('all');

  useEffect(() => {
    fetchMatches();
    fetchEvents();
  }, []);

  const fetchMatches = async () => {
    try {
      console.log('MatchesPage: Fetching REAL LIVE BACKEND DATA...');
      
      let matchesData = [];

      try {
        // Get REAL matches from backend API
        const matchesResponse = await api.get('/matches');
        const rawMatches = matchesResponse?.data?.data || matchesResponse?.data || matchesResponse || [];
        
        if (Array.isArray(rawMatches) && rawMatches.length > 0) {
          // Use backend data directly - MatchCard will handle formatting
          matchesData = rawMatches;
          console.log('MatchesPage: Using REAL backend matches:', matchesData.length);
        } else {
          console.log('MatchesPage: No matches found in backend - showing empty state');
          matchesData = []; // Empty array for proper empty state
        }
      } catch (error) {
        console.error('MatchesPage: Backend API failed:', error);
        matchesData = []; // Empty array if no backend data
      }
      
      setMatches(matchesData);
      console.log('MatchesPage: Matches loaded with REAL backend data:', matchesData.length);
      
    } catch (error) {
      console.error('Error in fetchMatches:', error);
      setMatches([]);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventsResponse = await api.get('/events');
      const eventsData = eventsResponse?.data?.data || [];
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  // Filter matches by status and event
  const getFilteredMatches = () => {
    let filtered = matches;

    // Filter by tab (handle different API response structures)
    switch (activeTab) {
      case 'live':
        filtered = filtered.filter(match => 
          (match.status === 'live') || 
          (match.match_info && match.match_info.status === 'live')
        );
        break;
      case 'upcoming':
        filtered = filtered.filter(match => 
          (match.status === 'upcoming') || 
          (match.match_info && match.match_info.status === 'upcoming')
        );
        break;
      case 'completed':
        filtered = filtered.filter(match => 
          (match.status === 'completed') || 
          (match.match_info && match.match_info.status === 'completed')
        );
        break;
      default:
        // Default to upcoming matches
        filtered = filtered.filter(match => 
          (match.status === 'upcoming') || 
          (match.match_info && match.match_info.status === 'upcoming')
        );
        break;
    }

    // Filter by event
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(match => match.event_id == selectedEvent);
    }

    // Sort matches
    filtered.sort((a, b) => {
      // Live matches first
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      
      // Then by scheduled time
      return new Date(a.scheduled_at) - new Date(b.scheduled_at);
    });

    return filtered;
  };

  // Format date for display
  const formatMatchDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Group matches by date
  const groupMatchesByDate = (matchesList) => {
    const grouped = {};
    matchesList.forEach(match => {
      // Handle different API response structures for scheduled time
      const scheduledTime = match.scheduled_at || match.match_info?.scheduled_at || new Date();
      const dateKey = formatMatchDate(scheduledTime);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(match);
    });
    return grouped;
  };

  const filteredMatches = getFilteredMatches();
  const groupedMatches = groupMatchesByDate(filteredMatches);

  return (
    <div className="max-w-6xl mx-auto">
      {/* VLR-Style Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Matches</h1>
          <div className="flex items-center space-x-4">
            {/* Event Filter Dropdown */}
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
            
            {(isAdmin() || isModerator()) && (
              <button 
                onClick={() => navigateTo && navigateTo('admin-match-create')}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
              >
                <span>+</span>
                <span>Create Match</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VLR-Style Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-6 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'live'
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center space-x-2">
              {matches.filter(m => (m.status === 'live') || (m.match_info && m.match_info.status === 'live')).length > 0 && (
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              )}
              <span>Live</span>
              <span className="text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">
                {matches.filter(m => (m.status === 'live') || (m.match_info && m.match_info.status === 'live')).length}
              </span>
            </div>
            {activeTab === 'live' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'upcoming'
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Upcoming
            {activeTab === 'upcoming' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 text-sm font-medium transition-all relative ${
              activeTab === 'completed'
                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Results
            {activeTab === 'completed' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 dark:bg-red-400"></div>
            )}
          </button>
        </div>

        {/* VLR-Style Matches List */}
        <div className="">
          {filteredMatches.length > 0 ? (
            <div>
              {/* Use virtual scrolling on mobile for better performance */}
              {window.innerWidth < 768 && filteredMatches.length > 20 ? (
                <VirtualScrollList
                  items={filteredMatches}
                  itemHeight={80}
                  containerHeight={Math.min(500, window.innerHeight - 200)}
                  renderItem={(match, index) => (
                    <div 
                      className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer border-b border-gray-200 dark:border-gray-700"
                      onClick={() => navigateTo && navigateTo('match-detail', match.id)}
                    >
                      <MatchCard match={match} navigateTo={navigateTo} compact={true} />
                    </div>
                  )}
                  onScrollEnd={() => {
                    // Load more matches if needed
                    console.log('Loading more matches...');
                  }}
                />
              ) : (
                // Regular rendering for desktop and small lists
                Object.entries(groupedMatches).map(([date, dateMatches]) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                        {date}
                      </h3>
                    </div>
                    
                    {/* Matches for this date */}
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {dateMatches.map(match => (
                      <div 
                        key={match.id}
                        className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                        onClick={() => navigateTo && navigateTo('match-detail', match.id)}
                      >
                        <div className="flex items-center">
                          {/* Match Time & Status */}
                          <div className="w-20 text-sm">
                            {(() => {
                              const status = match.status || match.match_info?.status || 'upcoming';
                              const scheduledTime = match.scheduled_at || match.match_info?.scheduled_at;
                              
                              if (status === 'live') {
                                return (
                                  <div className="flex items-center space-x-2">
                                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                    <span className="text-red-600 dark:text-red-400 font-medium text-xs">LIVE</span>
                                  </div>
                                );
                              } else if (status === 'completed') {
                                return <span className="text-gray-500 dark:text-gray-400 text-xs">Final</span>;
                              } else {
                                return (
                                  <span className="text-gray-600 dark:text-gray-300 text-xs">
                                    {scheduledTime ? new Date(scheduledTime).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    }) : 'TBA'}
                                  </span>
                                );
                              }
                            })()}
                          </div>
                          
                          {/* Team 1 */}
                          <div className="flex-1 flex items-center justify-end space-x-3 pr-4">
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo && navigateTo('team-detail', match.team1?.id);
                              }}
                              className={`font-medium cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors ${
                                match.status === 'completed' && match.team1_score > match.team2_score
                                  ? 'text-gray-900 dark:text-white'
                                  : match.status === 'completed'
                                  ? 'text-gray-400 dark:text-gray-500'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {match.team1?.name || 'TBD'}
                            </span>
                            <TeamLogo 
                              team={match.team1} 
                              size="w-5 h-5" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo && navigateTo('team-detail', match.team1?.id);
                              }}
                              className="cursor-pointer hover:scale-105 transition-transform"
                            />
                          </div>
                          
                          {/* Match Score / VS */}
                          <div className="flex items-center justify-center min-w-[80px]">
                            {(() => {
                              const status = match.status || match.match_info?.status || 'upcoming';
                              const team1Score = match.team1_score || match.match_info?.team1_score || 0;
                              const team2Score = match.team2_score || match.match_info?.team2_score || 0;
                              
                              if (status !== 'upcoming') {
                                return (
                                  <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                                    <span className={`text-lg font-bold ${
                                      status === 'completed' && team1Score > team2Score
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {team1Score}
                                    </span>
                                    <span className="text-gray-400 dark:text-gray-500">:</span>
                                    <span className={`text-lg font-bold ${
                                      status === 'completed' && team2Score > team1Score
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                                      {team2Score}
                                    </span>
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1">
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">VS</span>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                          
                          {/* Team 2 */}
                          <div className="flex-1 flex items-center space-x-3 pl-4">
                            <TeamLogo 
                              team={match.team2} 
                              size="w-5 h-5" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo && navigateTo('team-detail', match.team2?.id);
                              }}
                              className="cursor-pointer hover:scale-105 transition-transform"
                            />
                            <span 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo && navigateTo('team-detail', match.team2?.id);
                              }}
                              className={`font-medium cursor-pointer hover:text-red-600 dark:hover:text-red-400 transition-colors ${
                                match.status === 'completed' && match.team2_score > match.team1_score
                                  ? 'text-gray-900 dark:text-white'
                                  : match.status === 'completed'
                                  ? 'text-gray-400 dark:text-gray-500'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {match.team2?.name || 'TBD'}
                            </span>
                          </div>
                          
                          {/* Match Format & Event */}
                          <div className="text-right w-24">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                              {match.format || match.match_info?.format || 'BO3'}
                            </div>
                            {match.event && (
                              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                                {match.event.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
              )}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="text-6xl mb-4 opacity-20">🎮</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No {activeTab} matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'live' 
                  ? 'No matches are currently live'
                  : activeTab === 'upcoming' 
                  ? 'No upcoming matches scheduled'
                  : activeTab === 'completed'
                  ? 'No completed matches to show'
                  : selectedEvent !== 'all'
                  ? 'No matches found for the selected event'
                  : 'No matches available'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchesPage;