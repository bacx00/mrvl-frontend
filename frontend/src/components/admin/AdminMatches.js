import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getCountryFlag } from '../../utils/imageUtils';
import ComprehensiveLiveScoring from './ComprehensiveLiveScoring';

function AdminMatches({ navigateTo }) {
  const [matches, setMatches] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    event: 'all'
  });

  const { api, isAdmin, isModerator } = useAuth();

  // COMPREHENSIVE LIVE SCORING STATE
  const [comprehensiveScoring, setComprehensiveScoring] = useState({
    isOpen: false,
    match: null
  });

  // Check permissions
  const canManageMatches = isAdmin() || isModerator();

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      
      // CRITICAL FIX: Use correct endpoint for matches
      const matchResponse = await api.get('/matches');
      let matchesData = matchResponse.data?.data || matchResponse.data || matchResponse || [];

      // Apply filters
      if (filters.search) {
        matchesData = matchesData.filter(match => 
          match.team1?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          match.team2?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          match.event?.name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.status !== 'all') {
        matchesData = matchesData.filter(match => match.status === filters.status);
      }

      if (filters.event !== 'all') {
        matchesData = matchesData.filter(match => match.event_id === parseInt(filters.event));
      }

      setMatches(matchesData);
    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  const fetchEvents = useCallback(async () => {
    try {
      const eventsResponse = await api.get('/events');
      setEvents(eventsResponse.data?.data || eventsResponse.data || eventsResponse || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [api]);

  useEffect(() => {
    if (canManageMatches) {
      fetchMatches();
      fetchEvents();
    }
  }, [canManageMatches, fetchMatches, fetchEvents]);

  // COMPREHENSIVE LIVE SCORING HANDLERS
  const openComprehensiveScoring = (match) => {
    console.log('🎯 Opening comprehensive live scoring for match:', match.id);
    setComprehensiveScoring({
      isOpen: true,
      match: match
    });
  };

  const closeComprehensiveScoring = () => {
    setComprehensiveScoring({
      isOpen: false,
      match: null
    });
  };

  const handleStatsUpdate = async (updatedMatch) => {
    try {
      // ✅ FIXED: Use admin endpoint for match updates
      await api.put(`/admin/matches/${updatedMatch.id}`, updatedMatch);
      await fetchMatches(); // Refresh matches
      console.log('✅ Match stats updated successfully!');
    } catch (error) {
      console.error('❌ Error updating match stats:', error);
      
      // ✅ Better error handling for live match updates
      if (error.message.includes('405')) {
        console.log('⚠️ PUT method not supported - trying PATCH instead...');
        try {
          await api.patch(`/admin/matches/${updatedMatch.id}`, updatedMatch);
          await fetchMatches();
          console.log('✅ Match stats updated via PATCH!');
        } catch (patchError) {
          console.error('❌ PATCH also failed:', patchError);
          alert('Unable to update match stats. Please check admin permissions.');
        }
      } else {
        alert('Error updating match stats. Please try again.');
      }
    }
  };

  const handleDelete = async (matchId, matchName) => {
    if (window.confirm(`Are you sure you want to delete "${matchName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/matches/${matchId}`);
        await fetchMatches(); // Refresh the list
        alert('Match deleted successfully!');
      } catch (error) {
        console.error('Error deleting match:', error);
        alert('Error deleting match. Please try again.');
      }
    }
  };

  const updateMatchStatus = async (matchId, newStatus) => {
    try {
      await api.put(`/matches/${matchId}/status`, { status: newStatus });
      await fetchMatches(); // Refresh the list
      alert(`Match status updated to ${newStatus}!`);
    } catch (error) {
      console.error('Error updating match status:', error);
      alert('Error updating match status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'postponed': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not scheduled';
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!canManageMatches) {
    return (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-600 dark:text-gray-400">
          You don't have permission to manage matches.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Manage Matches</h2>
            <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            📊 Marvel Rivals Match Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Professional esports match tracking and live scoring</p>
        </div>
        <button 
          onClick={() => navigateTo('admin-match-create')}
          className="btn btn-primary whitespace-nowrap"
        >
          ⚔️ Create Match
        </button>
      </div>

      {/* Match Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">⚔️</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {matches.length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Matches</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">🔴</div>
          <div className="text-xl font-bold text-red-600 dark:text-red-400">
            {matches.filter(m => m.status === 'live').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Live Now</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">📅</div>
          <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {matches.filter(m => m.status === 'upcoming').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Upcoming</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-xl font-bold text-green-600 dark:text-green-400">
            {matches.filter(m => m.status === 'completed').length}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl mb-2">👁️</div>
          <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
            {matches.reduce((sum, m) => sum + (m.viewers || 0), 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">Total Viewers</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Matches
            </label>
            <input
              type="text"
              placeholder="Search by teams or event..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="form-input"
            >
              <option value="all">All Statuses</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
              <option value="postponed">Postponed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Event
            </label>
            <select
              value={filters.event}
              onChange={(e) => setFilters({...filters, event: e.target.value})}
              className="form-input"
            >
              <option value="all">All Events</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', status: 'all', event: 'all' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {matches.map((match) => (
          <div key={match.id} className="card hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Match Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 text-sm font-bold rounded-full ${getStatusColor(match.status)}`}>
                    {match.status.toUpperCase()}
                  </span>
                  {match.status === 'live' && (
                    <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      <span className="text-sm font-medium">LIVE</span>
                    </span>
                  )}
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    ID: {match.id} • {match.format || 'BO3'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDateTime(match.scheduled_at)}
                </div>
              </div>

              {/* Teams Display */}
              <div className="flex items-center justify-between mb-6">
                {/* Team 1 */}
                <div className="flex items-center space-x-4 flex-1">
                  <TeamLogo team={match.team1} size="w-16 h-16" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {match.team1?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getCountryFlag(match.team1?.country)} {match.team1?.region}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-center px-8">
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {match.team1_score || 0} - {match.team2_score || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Best of {match.format?.replace('BO', '') || '3'}
                  </div>
                </div>

                {/* Team 2 */}
                <div className="flex items-center space-x-4 flex-1 justify-end">
                  <div className="text-right">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {match.team2?.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getCountryFlag(match.team2?.country)} {match.team2?.region}
                    </p>
                  </div>
                  <TeamLogo team={match.team2} size="w-16 h-16" />
                </div>
              </div>

              {/* Event Info */}
              <div className="flex items-center justify-between mb-6 text-sm text-gray-600 dark:text-gray-400">
                <span>🏆 {match.event?.name || match.event_name || 'No event assigned'}</span>
                {match.viewers > 0 && (
                  <span>👁️ {match.viewers.toLocaleString()} viewers</span>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigateTo('admin-match-edit', { id: match.id })}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  ✏️ Edit Match
                </button>

                {/* COMPREHENSIVE LIVE SCORING BUTTON */}
                <button
                  onClick={() => openComprehensiveScoring(match)}
                  className="px-4 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors font-semibold"
                >
                  📊 Professional Stats Tracking
                </button>

                {match.status === 'upcoming' && (
                  <button
                    onClick={() => updateMatchStatus(match.id, 'live')}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    🔴 Start Live
                  </button>
                )}

                {match.status === 'live' && (
                  <>
                    <button
                      onClick={() => updateMatchStatus(match.id, 'paused')}
                      className="px-4 py-2 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                    >
                      ⏸️ Pause
                    </button>
                    <button
                      onClick={() => updateMatchStatus(match.id, 'completed')}
                      className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      ✅ Complete
                    </button>
                  </>
                )}

                {match.status === 'completed' && (
                  <button
                    onClick={() => updateMatchStatus(match.id, 'live')}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    🔄 Restart
                  </button>
                )}

                <button
                  onClick={() => handleDelete(match.id, `${match.team1?.name} vs ${match.team2?.name}`)}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {matches.length === 0 && (
        <div className="card p-8 text-center">
          <div className="text-4xl mb-4">⚔️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Matches Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.status !== 'all' || filters.event !== 'all'
              ? 'Try adjusting your filters to find more matches.'
              : 'No matches created yet.'}
          </p>
          <button
            onClick={() => navigateTo('admin-match-create')}
            className="btn btn-primary"
          >
            ⚔️ Create First Match
          </button>
        </div>
      )}

      {/* COMPREHENSIVE LIVE SCORING MODAL */}
      {comprehensiveScoring.match && (
        <ComprehensiveLiveScoring
          match={comprehensiveScoring.match}
          isOpen={comprehensiveScoring.isOpen}
          onClose={closeComprehensiveScoring}
          onUpdate={handleStatsUpdate}
        />
      )}
    </div>
  );
}

export default AdminMatches;