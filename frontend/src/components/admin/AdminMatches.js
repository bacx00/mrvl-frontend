import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getImageUrl } from '../../utils/imageUtils';
import MatchForm from './MatchForm';

function AdminMatches() {
  const { api } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [matchesPerPage] = useState(15);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    event: 'all',
    sortBy: 'date'
  });
  
  // CRUD Modal States
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async (page = 1, limit = 50) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/api/admin/matches-moderation?page=${page}&limit=${limit}`);
      const matchesData = response?.data?.data || response?.data || response || [];
      setMatches(Array.isArray(matchesData) ? matchesData : []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load matches';
      setError(errorMessage);
      console.error('Error fetching matches:', err);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches = useMemo(() => {
    let filtered = [...matches];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(match => 
        match.team1_name?.toLowerCase().includes(searchTerm) ||
        match.team2_name?.toLowerCase().includes(searchTerm) ||
        match.event_name?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(match => match.status === filters.status);
    }

    if (filters.event !== 'all') {
      filtered = filtered.filter(match => match.event_id?.toString() === filters.event);
    }

    if (filters.sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at));
    } else if (filters.sortBy === 'status') {
      filtered.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    } else if (filters.sortBy === 'event') {
      filtered.sort((a, b) => (a.event_name || '').localeCompare(b.event_name || ''));
    }

    return filtered;
  }, [matches, filters]);

  const paginatedMatches = useMemo(() => {
    const startIndex = (currentPage - 1) * matchesPerPage;
    return filteredMatches.slice(startIndex, startIndex + matchesPerPage);
  }, [filteredMatches, currentPage, matchesPerPage]);

  const totalPages = Math.ceil(filteredMatches.length / matchesPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // AdminMatches shows static match list - no live updates needed
  // Live updates are only between MatchDetailPage ↔ UnifiedLiveScoring

  const handleDeleteMatch = async (matchId, matchName) => {
    if (window.confirm(`Are you sure you want to delete match "${matchName}"? This action cannot be undone.`)) {
      try {
        const response = await api.delete(`/api/admin/matches-moderation/${matchId}`);
        if (response.data?.success !== false) {
          await fetchMatches();
          alert('Match deleted successfully!');
        } else {
          throw new Error(response.data?.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Error deleting match:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Error deleting match';
        alert(errorMessage);
      }
    }
  };

  const handleStatusChange = async (matchId, newStatus) => {
    try {
      const response = await api.put(`/api/admin/matches-moderation/${matchId}`, { status: newStatus });
      if (response.data?.success !== false) {
        await fetchMatches();
        alert(`Match status updated to ${newStatus}!`);
      } else {
        throw new Error(response.data?.message || 'Status update failed');
      }
    } catch (error) {
      console.error('Error updating match status:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating match status';
      alert(errorMessage);
    }
  };

  // CRUD Modal Handlers
  const handleEditMatch = (match) => {
    setSelectedMatch(match);
    setShowEditForm(true);
  };

  const handleCloseEditForm = () => {
    setSelectedMatch(null);
    setShowEditForm(false);
  };

  const handleShowCreateForm = () => {
    setShowCreateForm(true);
  };

  const handleCloseCreateForm = () => {
    setShowCreateForm(false);
  };

  const handleMatchUpdate = () => {
    // Refresh the matches list after updates
    fetchMatches();
  };



  const handleCreateMatch = async () => {
    handleShowCreateForm();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  const uniqueEvents = [...new Set(matches.map(match => match.event_name).filter(Boolean))];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Matches</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button onClick={fetchMatches} className="btn btn-outline-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Match Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage matches and live scoring</p>
        </div>
        <button onClick={handleCreateMatch} className="btn btn-primary">
          Create New Match
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Matches
            </label>
            <input
              type="text"
              placeholder="Search teams or event..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Event
            </label>
            <select
              value={filters.event}
              onChange={(e) => setFilters({...filters, event: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Events</option>
              {uniqueEvents.map((event, index) => (
                <option key={index} value={index.toString()}>{event}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Sort By
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="date">Date</option>
              <option value="status">Status</option>
              <option value="event">Event</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', status: 'all', event: 'all', sortBy: 'date' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Match Cards with Inline Live Scoring */}
      <div className="space-y-4">
        {paginatedMatches.map((match) => (
          <div key={match.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            {/* Match Card Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  {/* Event Logo */}
                  {match.event?.logo && (
                    <img 
                      src={getImageUrl(match.event.logo)}
                      alt={match.event_name}
                      className="w-6 h-6 rounded object-cover"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {match.event_name || 'No Event'}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(match.status)}`}>
                    {match.status || 'Unknown'}
                  </span>
                  {match.status === 'live' && (
                    <span className="flex items-center text-xs text-red-600 dark:text-red-400">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-1 animate-pulse"></span>
                      LIVE
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(match.scheduled_at)}
                </div>
              </div>

              {/* Teams and Score */}
              <div className="flex items-center justify-between">
                {/* Team 1 */}
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    {match.team1 && <TeamLogo team={match.team1} size="w-8 h-8" />}
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {match.team1_name || 'TBD'}
                    </div>
                  </div>
                </div>

                {/* Score Display */}
                <div className="flex items-center space-x-4 px-6">
                  {match.status === 'live' || match.status === 'completed' ? (
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {match.team1_score || 0} - {match.team2_score || 0}
                    </div>
                  ) : (
                    <div className="text-lg text-gray-500 dark:text-gray-400">
                      vs
                    </div>
                  )}
                </div>

                {/* Team 2 */}
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end space-x-3">
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {match.team2_name || 'TBD'}
                    </div>
                    {match.team2 && <TeamLogo team={match.team2} size="w-8 h-8" />}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex justify-center space-x-2">
                <button
                  onClick={() => handleEditMatch(match)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium"
                >
                  Edit Match
                </button>
                {match.status === 'upcoming' && (
                  <button
                    onClick={() => handleStatusChange(match.id, 'live')}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium"
                  >
                    Start Match
                  </button>
                )}
                {(match.status === 'live' || match.status === 'upcoming') && (
                  <button
                    onClick={() => window.open(`/#admin-live-scoring?match_id=${match.id}`, '_blank')}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium"
                  >
                    Live Scoring
                  </button>
                )}
                {match.status === 'live' && (
                  <button
                    onClick={() => handleStatusChange(match.id, 'completed')}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium"
                  >
                    Complete Match
                  </button>
                )}
                <button
                  onClick={() => handleDeleteMatch(match.id, `${match.team1_name} vs ${match.team2_name}`)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="btn btn-secondary"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">{(currentPage - 1) * matchesPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * matchesPerPage, filteredMatches.length)}
                </span>{' '}
                of <span className="font-medium">{filteredMatches.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {[...Array(Math.min(totalPages, 7))].map((_, index) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = index + 1;
                  } else {
                    if (currentPage <= 4) {
                      pageNum = index + 1;
                    } else if (currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + index;
                    } else {
                      pageNum = currentPage - 3 + index;
                    }
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === pageNum
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${
                        index === 0 ? 'rounded-l-md' : ''
                      } ${
                        index === Math.min(totalPages, 7) - 1 ? 'rounded-r-md' : ''
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* No Results */}
      {filteredMatches.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Matches Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.status !== 'all' || filters.event !== 'all'
              ? 'Try adjusting your filters to find more matches.'
              : 'Get started by creating your first match.'}
          </p>
          <button onClick={handleCreateMatch} className="btn btn-primary">
            Create First Match
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {matches.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">🔴</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {matches.filter(m => m.status === 'live').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Live Matches</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {matches.filter(m => m.status === 'scheduled').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Scheduled</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {matches.filter(m => m.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
      </div>

      {/* Create Match Form Modal - Using MatchForm Component */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Match
              </h3>
              <button
                onClick={handleCloseCreateForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <MatchForm
                navigateTo={(path, params) => {
                  handleCloseCreateForm();
                  handleMatchUpdate();
                  // Handle navigation for new matches
                  if (path === 'match-detail' && params?.id) {
                    window.location.href = `/matches/${params.id}`;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Match Form Modal - Using MatchForm Component */}
      {showEditForm && selectedMatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Match
              </h3>
              <button
                onClick={handleCloseEditForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <MatchForm
                matchId={selectedMatch?.id}
                navigateTo={(path, params) => {
                  handleCloseEditForm();
                  handleMatchUpdate();
                  // Handle navigation for edited matches
                  if (path === 'match-detail' && params?.id) {
                    window.location.href = `/matches/${params.id}`;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default AdminMatches;