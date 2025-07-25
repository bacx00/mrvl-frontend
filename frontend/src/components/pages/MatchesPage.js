import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import MatchCard from '../MatchCard';
import { TeamLogo } from '../../utils/imageUtils';

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
          
          // Debug: log the structure of the first match to understand the data format
          if (matchesData.length > 0) {
            console.log('MatchesPage: First match team data:', {
              hasTeam1: 'team1' in matchesData[0],
              team1: matchesData[0].team1,
              hasTeam2: 'team2' in matchesData[0],
              team2: matchesData[0].team2,
              team1_id: matchesData[0].team1_id,
              team2_id: matchesData[0].team2_id,
              hasStatus: 'status' in matchesData[0],
              statusValue: matchesData[0].status,
              fullMatch: matchesData[0]
            });
          }
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
      
      // Debug: Log all unique status values for debugging
      if (matchesData.length > 0) {
        const uniqueStatuses = [...new Set(matchesData.map(m => m.status || m.match_info?.status))];
        console.log('MatchesPage: Unique status values in matches:', uniqueStatuses);
      }
      
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
          (match.status === 'paused') ||
          (match.match_info && match.match_info.status === 'live') ||
          (match.match_info && match.match_info.status === 'paused')
        );
        break;
      case 'upcoming':
        filtered = filtered.filter(match => 
          (match.status === 'upcoming') || 
          (match.status === 'scheduled') ||
          (match.match_info && match.match_info.status === 'upcoming') ||
          (match.match_info && match.match_info.status === 'scheduled')
        );
        break;
      case 'completed':
        filtered = filtered.filter(match => 
          (match.status === 'completed') || 
          (match.match_info && match.match_info.status === 'completed')
        );
        break;
      default:
        // Default to upcoming and paused matches
        filtered = filtered.filter(match => 
          (match.status === 'upcoming') || 
          (match.status === 'scheduled') ||
          (match.status === 'paused') ||
          (match.match_info && match.match_info.status === 'upcoming') ||
          (match.match_info && match.match_info.status === 'scheduled') ||
          (match.match_info && match.match_info.status === 'paused')
        );
        break;
    }

    // Filter by event
    if (selectedEvent !== 'all') {
      filtered = filtered.filter(match => match.event_id == selectedEvent);
    }

    // Sort matches
    filtered.sort((a, b) => {
      // Live matches first, then paused
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.status === 'paused' && b.status !== 'paused' && b.status !== 'live') return -1;
      if (b.status === 'paused' && a.status !== 'paused' && a.status !== 'live') return 1;
      
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
      {/* Header - VLR.gg Style (matching events page) */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Matches</h1>
        {(isAdmin() || isModerator()) && (
          <button 
            onClick={() => navigateTo && navigateTo('admin-match-create')}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Create Match
          </button>
        )}
      </div>

      {/* Tabs and Filters - VLR.gg Style (matching events page) */}
      <div className="card">
        {/* Match Status Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Upcoming ({matches.filter(m => m.status === 'upcoming' || m.status === 'scheduled').length})
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'live'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {matches.filter(m => m.status === 'live').length > 0 && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
              <span>Live ({matches.filter(m => m.status === 'live').length})</span>
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
            Completed ({matches.filter(m => m.status === 'completed').length})
          </button>
        </div>

        {/* Secondary Filters */}
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Event Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Event:</span>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Matches List - VLR.gg Style */}
        {filteredMatches.length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedMatches).map(([date, dateMatches]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {date}
                  </h3>
                </div>
                
                {/* Matches for this date */}
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {dateMatches.map(match => (
                    <div 
                      key={match.id}
                      className="px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
                      onClick={() => navigateTo && navigateTo('match-detail', match.id)}
                    >
                      <div className="flex items-center">
                        {/* Match Time & Status */}
                        <div className="w-20 text-sm">
                          {(() => {
                            const rawStatus = match.status || match.match_info?.status || 'upcoming';
                            // Normalize 'scheduled' to 'upcoming' for consistent display
                            const status = rawStatus === 'scheduled' ? 'upcoming' : rawStatus;
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
                              size="w-8 h-8" 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateTo && navigateTo('team-detail', match.team1?.id);
                              }}
                              className="cursor-pointer hover:scale-105 transition-transform"
                            />
                          </div>
                          
                          {/* Match Score / VS */}
                          <div className="flex items-center justify-center min-w-[60px] sm:min-w-[80px]">
                            {(() => {
                              const rawStatus = match.status || match.match_info?.status || 'upcoming';
                              // Normalize 'scheduled' to 'upcoming' for consistent display
                              const status = rawStatus === 'scheduled' ? 'upcoming' : rawStatus;
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
                              size="w-8 h-8" 
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
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="text-4xl mb-4">🎮</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No {activeTab} matches
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedEvent !== 'all' && events.find(e => e.id == selectedEvent)
                  ? `No ${activeTab} matches for ${events.find(e => e.id == selectedEvent).name}`
                  : activeTab === 'live' 
                  ? 'No matches are currently live'
                  : activeTab === 'upcoming' 
                  ? 'No upcoming matches scheduled'
                  : 'No completed matches to show'
                }
              </p>
            </div>
          )}
        </div>
      </div>
  );
}

export default MatchesPage;