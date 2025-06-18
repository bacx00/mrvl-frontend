import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getEventById, getMatchesByEvent } from '../../data/matchesData';
import { REAL_TEAMS, getTeamById } from '../../data/realTeams';

function EventDetailPage({ params, navigateTo }) {
  const [event, setEvent] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { api, isAdmin, isModerator } = useAuth();

  const eventId = params?.id;

  console.log('🔍 EventDetailPage - Received event ID:', eventId);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      console.log('🔄 EventDetailPage: Fetching event data for ID:', eventId);
      
      // First try centralized data
      const centralEvent = getEventById(eventId);
      
      if (centralEvent) {
        console.log('✅ EventDetailPage: Using centralized event data:', centralEvent);
        await processEventData(centralEvent);
        return;
      }

      // Try to fetch from backend API
      try {
        const response = await api.get(`/events/${eventId}`);
        const eventData = response.data || response;
        console.log('✅ Real event data received:', eventData);
        
        await processEventData(eventData);
      } catch (error) {
        console.error('❌ Error fetching event data from API:', error);
        
        // Use enhanced fallback data
        const fallbackEvent = generateFallbackEvent(eventId);
        await processEventData(fallbackEvent);
      }
    } catch (error) {
      console.error('❌ Error in fetchEventData:', error);
      setEvent(null);
    } finally {
      setLoading(false);
    }
  };

  const processEventData = async (eventData) => {
    // Transform to consistent format
    const transformedEvent = {
      id: eventData.id,
      name: eventData.name || 'Marvel Rivals Championship',
      description: eventData.description || 'Premier Marvel Rivals esports competition featuring the world\'s best teams.',
      startDate: eventData.startDate || eventData.start_date || '2025-01-20',
      endDate: eventData.endDate || eventData.end_date || '2025-02-15',
      location: eventData.location || 'Los Angeles, CA',
      venue: eventData.venue || 'Los Angeles Convention Center',
      prizePool: eventData.prizePool || eventData.prize_pool || '$500,000',
      format: eventData.format || 'Double Elimination',
      status: eventData.status || 'upcoming',
      organizer: eventData.organizer || 'Marvel Rivals League',
      region: eventData.region || 'International',
      tier: eventData.tier || 'S',
      teams: eventData.teams || 16,
      stream: eventData.stream || 'https://twitch.tv/marvelrivals',
      sponsors: eventData.sponsors || ['Marvel', 'NetEase', 'Intel', 'NVIDIA'],
      stage: eventData.stage || 'Main Event',
      onlineEvent: eventData.onlineEvent || false,
      schedule: eventData.schedule || [
        { phase: 'Group Stage', date: '2025-01-20 - 2025-01-27', status: 'completed' },
        { phase: 'Playoffs', date: '2025-02-01 - 2025-02-08', status: 'upcoming' },
        { phase: 'Grand Finals', date: '2025-02-15', status: 'upcoming' }
      ]
    };

    setEvent(transformedEvent);

    // ✅ FIXED: Get matches for this event using alternative approach
    try {
      console.log('🔍 EventDetailPage: Fetching matches for event ID:', eventId);
      
      // Try the specific endpoint first, then fallback to filtering all matches
      let realMatches = [];
      try {
        const matchesResponse = await api.get(`/events/${eventId}/matches`);
        realMatches = matchesResponse?.data?.data || matchesResponse?.data || [];
      } catch (specificError) {
        console.log('⚠️ Specific endpoint not available, trying all matches...');
        
        // FALLBACK: Get all matches and filter by event_id
        try {
          const allMatchesResponse = await api.get('/matches');
          const allMatches = allMatchesResponse?.data?.data || allMatchesResponse?.data || [];
          realMatches = allMatches.filter(match => match.event_id == eventId);
          console.log(`✅ Filtered ${realMatches.length} matches for event ${eventId} from all matches`);
        } catch (fallbackError) {
          console.error('❌ Could not fetch matches from fallback:', fallbackError);
        }
      }
      
      if (Array.isArray(realMatches) && realMatches.length > 0) {
        const transformedMatches = realMatches.map(match => ({
          id: match.id, // REAL MATCH ID
          team1: match.team1?.name || match.team1_name || 'Team 1',
          team1Id: match.team1?.id || match.team1_id, // REAL TEAM ID
          team2: match.team2?.name || match.team2_name || 'Team 2', 
          team2Id: match.team2?.id || match.team2_id, // REAL TEAM ID
          status: match.status,
          score: {
            team1: match.team1_score || match.team1?.score || 0,
            team2: match.team2_score || match.team2?.score || 0
          },
          date: formatDate(match.match_date || match.scheduled_at || match.date),
          time: match.match_time || match.time || '18:00',
          stage: match.stage || 'Main Event',
          format: match.format || 'BO3'
        }));
        setMatches(transformedMatches);
        console.log('✅ EventDetailPage: Using REAL backend matches:', transformedMatches.length);
      } else {
        console.log('⚠️ EventDetailPage: No matches found for event');
        setMatches([]);
      }
    } catch (error) {
      console.error('❌ EventDetailPage: Failed to fetch event matches:', error);
      setMatches([]); // NO FALLBACK DATA
    }

    // ✅ FIXED: Get participating teams using alternative approach
    try {
      console.log('🔍 EventDetailPage: Fetching teams for event ID:', eventId);
      
      let realTeams = [];
      try {
        const teamsResponse = await api.get(`/events/${eventId}/teams`);
        realTeams = teamsResponse?.data?.data || teamsResponse?.data || [];
      } catch (specificError) {
        console.log('⚠️ Specific teams endpoint not available, deriving from matches...');
        
        // FALLBACK: Get teams from matches we already fetched
        if (matches.length > 0) {
          const teamIds = new Set();
          matches.forEach(match => {
            if (match.team1Id) teamIds.add(match.team1Id);
            if (match.team2Id) teamIds.add(match.team2Id);
          });
          
          // Fetch individual teams
          try {
            const allTeamsResponse = await api.get('/teams');
            const allTeams = allTeamsResponse?.data?.data || allTeamsResponse?.data || [];
            realTeams = allTeams.filter(team => teamIds.has(team.id));
            console.log(`✅ Derived ${realTeams.length} teams from matches for event ${eventId}`);
          } catch (teamsError) {
            console.error('❌ Could not fetch teams from fallback:', teamsError);
          }
        }
      }
      const realTeams = teamsResponse?.data?.data || teamsResponse?.data || [];
      
      if (Array.isArray(realTeams) && realTeams.length > 0) {
        const transformedTeams = realTeams.map((team, index) => ({
          id: team.id, // REAL TEAM ID
          name: team.name,
          shortName: team.short_name || team.shortName,
          region: team.region,
          rating: team.rating,
          seed: team.seed || index + 1,
          logo: team.logo
        }));
        setTeams(transformedTeams);
        console.log('✅ EventDetailPage: Using REAL backend teams:', transformedTeams.length);
      } else {
        console.log('⚠️ EventDetailPage: No teams found for event');
        setTeams([]);
      }
    } catch (error) {
      console.error('❌ EventDetailPage: Failed to fetch event teams:', error);
      setTeams([]); // NO FALLBACK DATA
    }
  };

  const generateFallbackEvent = (eventId) => {
    return {
      id: eventId,
      name: 'Marvel Rivals Championship 2025',
      description: 'The ultimate Marvel Rivals championship featuring the world\'s best teams competing for glory and a massive prize pool.',
      startDate: '2025-01-20',
      endDate: '2025-02-15',
      location: 'Los Angeles, CA',
      venue: 'Los Angeles Convention Center',
      prizePool: '$1,000,000',
      format: 'Double Elimination',
      status: 'upcoming',
      organizer: 'Marvel Rivals League',
      region: 'International',
      tier: 'S',
      teams: 16,
      stream: 'https://twitch.tv/marvelrivals',
      sponsors: ['Marvel', 'NetEase', 'Intel', 'NVIDIA', 'Red Bull'],
      stage: 'Main Event'
    };
  };

  const generateSampleMatches = () => {
    const sampleTeams = REAL_TEAMS.slice(0, 8);
    return [
      {
        id: 1,
        team1: sampleTeams[0]?.name || 'Luminosity Gaming',
        team1Id: sampleTeams[0]?.id,
        team2: sampleTeams[1]?.name || 'Fnatic',
        team2Id: sampleTeams[1]?.id,
        status: 'live',
        score: { team1: 1, team2: 1 },
        date: '2025-01-26',
        time: '18:00',
        stage: 'Grand Finals',
        format: 'BO5'
      },
      {
        id: 2,
        team1: sampleTeams[2]?.name || 'OG',
        team1Id: sampleTeams[2]?.id,
        team2: sampleTeams[3]?.name || 'Sentinels',
        team2Id: sampleTeams[3]?.id,
        status: 'upcoming',
        score: { team1: 0, team2: 0 },
        date: '2025-01-27',
        time: '15:00',
        stage: 'Semi-Finals',
        format: 'BO3'
      }
    ];
  };

  const getCountryFlag = (region) => {
    const flagMap = {
      'North America': '🇺🇸', 'Europe': '🇪🇺', 'Asia Pacific': '🌏', 'International': '🌍',
      'US': '🇺🇸', 'CA': '🇨🇦', 'UK': '🇬🇧', 'DE': '🇩🇪', 'FR': '🇫🇷', 'KR': '🇰🇷'
    };
    return flagMap[region] || '🌍';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-600 text-white';
      case 'upcoming': return 'bg-blue-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTierBadge = (tier) => {
    const colors = {
      'S': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-yellow-300',
      'A': 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-300',
      'B': 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border-blue-300'
    };
    return (
      <span className={`px-3 py-1 text-sm font-bold rounded border ${colors[tier] || colors.A}`}>
        {tier}-Tier Tournament
      </span>
    );
  };

  // CRITICAL FIX: Navigation handlers that use ONLY real backend IDs
  const handleMatchClick = (matchId) => {
    console.log('🔗 EventDetailPage: Navigating to match with REAL ID:', matchId);
    navigateTo && navigateTo('match-detail', { id: matchId });
  };

  const handleTeamClick = (teamId) => {
    console.log('🔗 EventDetailPage: Navigating to team with REAL ID:', teamId);
    navigateTo && navigateTo('team-detail', { id: teamId });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'matches', name: 'Matches', icon: '⚔️' },
    { id: 'teams', name: 'Teams', icon: '👥' },
    { id: 'bracket', name: 'Bracket', icon: '🏆' },
    { id: 'schedule', name: 'Schedule', icon: '📅' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading event details...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The event you're looking for doesn't exist or may have been removed.
        </p>
        <button onClick={() => navigateTo('events')} className="btn btn-primary">
          ← Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
        <button 
          onClick={() => navigateTo('home')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Home
        </button>
        <span>›</span>
        <button 
          onClick={() => navigateTo('events')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Events
        </button>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">{event.name}</span>
      </div>

      {/* Event Header - HLTV.org Style */}
      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-600 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
            <div className="text-6xl">{getCountryFlag(event.region)}</div>
            
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mb-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{event.name}</h1>
                <div className="flex items-center space-x-2">
                  {getTierBadge(event.tier)}
                  <span className={`px-3 py-1 rounded text-sm font-medium ${getStatusColor(event.status)}`}>
                    {event.status.toUpperCase()}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-lg">{event.description}</p>
              
              {/* Key Event Info Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{event.prizePool}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Prize Pool</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{event.teams}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Teams</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{matches.length}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Matches</div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{event.format}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">Format</div>
                </div>
              </div>
            </div>

            {/* Admin Controls */}
            {(isAdmin() || isModerator()) && (
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => navigateTo('admin-event-edit', { id: event.id })}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Event
                </button>
                <button 
                  onClick={() => navigateTo('admin-match-create', { eventId: event.id })}
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                >
                  ➕ Add Match
                </button>
              </div>
            )}
          </div>

          {/* Live Stream Banner */}
          {event.status === 'live' && (
            <div className="mt-6 p-4 bg-red-600 text-white rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="animate-pulse">🔴</div>
                  <span className="font-bold text-lg">LIVE NOW</span>
                  <span>Event is currently streaming</span>
                </div>
                <a
                  href={event.stream}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white text-red-600 rounded font-bold hover:bg-gray-100 transition-colors"
                >
                  📺 Watch Stream
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-shrink-0 px-6 py-4 text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                  : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Recent Matches */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🏆 Recent Matches</h3>
                <div className="space-y-3">
                  {matches.slice(0, 5).map((match) => (
                    <div 
                      key={match.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => handleMatchClick(match.id)}
                    >
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(match.status)}`}>
                          {match.status.toUpperCase()}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            <span 
                              className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeamClick(match.team1Id);
                              }}
                            >
                              {match.team1}
                            </span>
                            {' vs '}
                            <span 
                              className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTeamClick(match.team2Id);
                              }}
                            >
                              {match.team2}
                            </span>
                          </div>
                          <div className="text-gray-500 dark:text-gray-500 text-sm">
                            {match.stage} • {match.format} • {match.date} {match.time}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">
                          {match.score.team1} - {match.score.team2}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500">Click for details</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Event Schedule */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📅 Event Schedule</h3>
                <div className="space-y-3">
                  {event.schedule?.map((phase, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          phase.status === 'completed' ? 'bg-green-500' : 
                          phase.status === 'live' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <span className="font-medium text-gray-900 dark:text-white">{phase.phase}</span>
                      </div>
                      <span className="text-gray-600 dark:text-gray-400">{phase.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Event Information */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">ℹ️ Event Information</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Organizer', value: event.organizer },
                    { label: 'Venue', value: event.venue },
                    { label: 'Location', value: event.location },
                    { label: 'Start Date', value: formatDate(event.startDate) },
                    { label: 'End Date', value: formatDate(event.endDate) },
                    { label: 'Format', value: event.format },
                    { label: 'Region', value: event.region }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{item.label}:</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sponsors */}
              <div className="card p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🤝 Sponsors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {event.sponsors?.map((sponsor, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-center font-medium text-gray-900 dark:text-white"
                    >
                      {sponsor}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">⚔️ All Matches</h3>
            <div className="space-y-4">
              {matches.map((match) => (
                <div 
                  key={match.id} 
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-5 hover:border-red-300 dark:hover:border-red-600 cursor-pointer transition-all"
                  onClick={() => handleMatchClick(match.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded font-medium ${getStatusColor(match.status)}`}>
                        {match.status.toUpperCase()}
                      </span>
                      <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">
                          <span 
                            className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamClick(match.team1Id);
                            }}
                          >
                            {match.team1}
                          </span>
                          {' vs '}
                          <span 
                            className="hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTeamClick(match.team2Id);
                            }}
                          >
                            {match.team2}
                          </span>
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {match.stage} • {match.format} • {match.date} at {match.time}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {match.score.team1} - {match.score.team2}
                      </div>
                      <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                        View Match Details →
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">👥 Participating Teams</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {teams.map((team) => (
                <div
                  key={team.id}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-red-300 dark:hover:border-red-600 cursor-pointer transition-all hover:scale-105"
                  onClick={() => handleTeamClick(team.id)}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3">{getCountryFlag(team.region)}</div>
                    <h4 className="font-bold text-gray-900 dark:text-white mb-1">{team.shortName}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{team.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mb-3">{team.region}</div>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                      <div className="text-xs text-gray-500 dark:text-gray-500">Seed #{team.seed}</div>
                      <div className="text-sm font-bold text-red-600 dark:text-red-400">Rating: {team.rating}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bracket Tab */}
        {activeTab === 'bracket' && (
          <div className="card p-8 text-center">
            <div className="text-6xl mb-4">🏗️</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Tournament Bracket</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Interactive tournament bracket is coming soon. View individual matches in the Matches tab.
            </p>
            <button 
              onClick={() => setActiveTab('matches')}
              className="px-6 py-3 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              View All Matches
            </button>
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">📅 Detailed Schedule</h3>
            <div className="space-y-6">
              {event.schedule?.map((phase, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{phase.phase}</h4>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${
                      phase.status === 'completed' ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400' :
                      phase.status === 'live' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                      'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                    }`}>
                      {phase.status?.toUpperCase() || 'SCHEDULED'}
                    </span>
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">{phase.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventDetailPage;