import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getCountryFlag, getCountryName, getEventLogoUrl } from '../../utils/imageUtils';
import MatchCard from '../MatchCard';
import LiquipediaBracket from '../LiquipediaBracket';
// Pusher removed - not using real-time updates

function EventDetailPage({ params, navigateTo }) {
  const [event, setEvent] = useState(null);
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [bracket, setBracket] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const { api, isAdmin, isModerator } = useAuth();

  const eventId = params?.id;

  console.log('🔍 EventDetailPage - Received event ID:', eventId);

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchAvailableTeams();
    }
  }, [eventId]);

  // Subscribe to real-time updates - DISABLED (pusher removed)
  // useEffect(() => {
  //   if (!event?.id) return;
  // }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEventData = async () => {
    try {
      setLoading(true);
      console.log('🔄 EventDetailPage: Fetching event data for ID:', eventId);
      
      // Fetch comprehensive event data from API
      const response = await api.get(`/events/${eventId}`);
      const eventData = response.data?.data || response.data || response;
      
      console.log('✅ Real event data received:', eventData);
      
      // Set event data
      setEvent(eventData);
      
      // Set teams if included - handle multiple possible response structures
      let teamsData = [];
      if (eventData.teams && Array.isArray(eventData.teams)) {
        teamsData = eventData.teams;
      } else if (eventData.participating_teams && Array.isArray(eventData.participating_teams)) {
        teamsData = eventData.participating_teams;
      } else if (eventData.event_teams && Array.isArray(eventData.event_teams)) {
        teamsData = eventData.event_teams;
      }
      
      console.log('✅ Teams data found:', teamsData.length, 'teams');
      setTeams(teamsData);
      
      // Set matches if included - handle multiple possible response structures
      let matchesData = [];
      if (eventData.matches && Array.isArray(eventData.matches)) {
        matchesData = eventData.matches;
      } else if (eventData.event_matches && Array.isArray(eventData.event_matches)) {
        matchesData = eventData.event_matches;
      }
      
      console.log('✅ Matches data found:', matchesData.length, 'matches');
      setMatches(matchesData);
      
      // Set bracket if included
      if (eventData.bracket) {
        setBracket(eventData.bracket);
      }
      
      // Note: Teams and matches are included in main event data
      // No need for separate API calls - routes don't exist yet
      console.log('✅ Event data loaded with embedded teams and matches');
      
    } catch (error) {
      console.error('❌ Error fetching event data:', error);
      setEvent(null);
      setMatches([]);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableTeams = async () => {
    try {
      const response = await api.get('/teams');
      const allTeams = response.data?.data || response.data || [];
      setAvailableTeams(allTeams);
    } catch (error) {
      console.error('❌ Error fetching teams:', error);
    }
  };

  const handleAddTeam = async () => {
    if (!selectedTeamId) return;
    
    try {
      // Use proper admin API route with team ID
      await api.post(`/admin/events/${eventId}/teams`, { team_id: selectedTeamId });
      console.log('✅ Team added successfully');
      
      // Refresh event data
      await fetchEventData();
      setShowAddTeamModal(false);
      setSelectedTeamId('');
    } catch (error) {
      console.error('❌ Error adding team:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add team';
      alert(errorMessage);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to remove this team from the event?')) return;
    
    try {
      await api.delete(`/admin/events/${eventId}/teams/${teamId}`);
      console.log('✅ Team removed successfully');
      
      // Refresh event data
      await fetchEventData();
    } catch (error) {
      console.error('❌ Error removing team:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to remove team';
      alert(errorMessage);
    }
  };

  const generateBracket = async () => {
    try {
      console.log('🏆 Generating bracket for event:', eventId);
      
      // Get the format from the event details
      const format = event?.details?.format || event?.format || 'single_elimination';
      
      const response = await api.post(`/admin/events/${eventId}/generate-bracket`, {
        format: format,
        seeding_method: 'rating',
        shuffle_seeds: false
      });
      
      console.log('✅ Bracket generated successfully:', response.data);
      
      // Fetch the bracket data
      const bracketResponse = await api.get(`/admin/events/${eventId}/bracket`);
      if (bracketResponse.data?.data?.matches) {
        setBracket(bracketResponse.data.data.matches);
      }
      
      // Refresh event data to get the new bracket
      await fetchEventData();
    } catch (error) {
      console.error('❌ Error generating bracket:', error);
      alert('Failed to generate bracket: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleBracketMatchUpdate = async (matchId, updates) => {
    try {
      await api.put(`/admin/events/${eventId}/matches/${matchId}/score`, updates);
      console.log('✅ Match updated successfully');
      
      // Refresh event data
      await fetchEventData();
    } catch (error) {
      console.error('❌ Error updating match:', error);
      alert('Failed to update match: ' + (error.response?.data?.message || error.message));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    if (!amount || amount === 0) return 'TBD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const colors = {
      'upcoming': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200',
      'ongoing': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200',
      'completed': 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-200',
      'cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    };
    
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || colors.upcoming}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'teams', name: `Teams (${teams.length})` },
    { id: 'matches', name: `Matches (${matches.length})` },
    { id: 'bracket', name: 'Bracket' }
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
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The event you're looking for doesn't exist or may have been removed.
        </p>
        <button 
          onClick={() => navigateTo && navigateTo('events')} 
          className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          ← Back to Events
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
        <button 
          onClick={() => navigateTo && navigateTo('home')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Home
        </button>
        <span>›</span>
        <button 
          onClick={() => navigateTo && navigateTo('events')}
          className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          Events
        </button>
        <span>›</span>
        <span className="text-gray-900 dark:text-white">{event.name}</span>
      </div>

      {/* Event Header - Clean Design */}
      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* Event Logo */}
            <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden flex-shrink-0">
              <img 
                src={getEventLogoUrl(event)} 
                alt={event.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500 dark:text-gray-400">?</div>';
                }}
              />
            </div>
              
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{event.name}</h1>
                  {isRealTimeConnected && (
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-green-600 dark:text-green-400">Live Updates</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  {getStatusBadge(event.status)}
                  <span className="text-gray-600 dark:text-gray-400">
                    {event.details?.region || event.region} • {event.details?.type || event.type}
                  </span>
                </div>
              </div>
            </div>
            
            {(isAdmin() || isModerator()) && (
              <button 
                onClick={() => navigateTo && navigateTo('admin-event-edit', { id: event.id })}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Edit Event
              </button>
            )}
          </div>
          
          {/* Event Info Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Prize Pool</div>
              <div className="font-bold text-xl text-green-600 dark:text-green-400">
                {formatCurrency(event.details?.prize_pool || event.prize_pool, event.details?.currency)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Start Date</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(event.schedule?.start_date || event.start_date)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">End Date</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {formatDate(event.schedule?.end_date || event.end_date)}
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-500 text-sm">Format</div>
              <div className="font-medium text-gray-900 dark:text-white">
                {event.details?.format || event.format}
              </div>
            </div>
          </div>
        </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                  : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">About</h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {event.description}
                </p>
              </div>

              {event.rules && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">Rules</h3>
                  <div className="prose dark:prose-invert max-w-none">
                    {event.rules}
                  </div>
                </div>
              )}

              {event.details?.prize_distribution && (
                <div>
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">Prize Distribution</h3>
                  <div className="space-y-2">
                    {Object.entries(event.details.prize_distribution).map(([place, amount]) => (
                      <div key={place} className="flex justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                        <span className="font-medium text-gray-900 dark:text-white">{place}</span>
                        <span className="text-green-600 dark:text-green-400">
                          {formatCurrency(amount, event.details?.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Teams Tab */}
          {activeTab === 'teams' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                  Participating Teams ({teams.length}/{event.participation?.max_teams || event.max_teams})
                </h3>
                {(isAdmin() || isModerator()) && (
                  <button 
                    onClick={() => setShowAddTeamModal(true)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Add Team
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div 
                    key={team.id}
                    className="border border-gray-200 dark:border-gray-700 rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 cursor-pointer"
                        onClick={() => navigateTo && navigateTo('team-detail', { id: team.id })}
                      >
                        <TeamLogo team={team} size="w-12 h-12" />
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{team.name}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-500">
                            <span>{getCountryFlag(team.country || team.region)}</span>
                            <span>{getCountryName(team.country || team.region)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {(isAdmin() || isModerator()) && (
                        <button
                          onClick={() => handleRemoveTeam(team.id)}
                          className="text-red-600 hover:text-red-700 transition-colors"
                          title="Remove team"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {teams.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-500">No teams registered yet</div>
                </div>
              )}
            </div>
          )}

          {/* Matches Tab */}
          {activeTab === 'matches' && (
            <div>
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">Event Matches</h3>
              {matches.length > 0 ? (
                <div className="space-y-4">
                  {matches.map(match => (
                    <MatchCard 
                      key={match.id}
                      match={match}
                      navigateTo={navigateTo}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-500">No matches scheduled yet</div>
                </div>
              )}
            </div>
          )}

          {/* Bracket Tab */}
          {activeTab === 'bracket' && (
            <div>
              {bracket && bracket.length > 0 ? (
                <LiquipediaBracket 
                  bracket={bracket} 
                  event={event}
                  eventId={eventId}
                  navigateTo={navigateTo}
                  isAdmin={isAdmin || isModerator}
                  onMatchUpdate={handleBracketMatchUpdate}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🏆</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Bracket not generated yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {teams.length < 2 
                      ? `Need at least 2 teams to generate bracket (currently ${teams.length})`
                      : 'Click below to generate the tournament bracket'
                    }
                  </p>
                  {(isAdmin || isModerator) && teams.length >= 2 && (
                    <button 
                      onClick={generateBracket}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    >
                      Generate Bracket
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Team to Event</h3>
            
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
            >
              <option value="">Select a team</option>
              {availableTeams
                .filter(team => !teams.some(t => t.id === team.id))
                .map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.region})
                  </option>
                ))
              }
            </select>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddTeamModal(false);
                  setSelectedTeamId('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeam}
                disabled={!selectedTeamId}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default EventDetailPage;