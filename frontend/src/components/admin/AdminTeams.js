import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getImageUrl } from '../../utils/imageUtils';
import Pagination from '../shared/Pagination';

function AdminTeams({ navigateTo }) {
  const [allTeams, setAllTeams] = useState([]); // Store all teams
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [teamsPerPage, setTeamsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    search: '',
    region: 'all',
    sortBy: 'rating'
  });
  const [selectedTeams, setSelectedTeams] = useState(new Set());
  const { api } = useAuth();
  
  // Removed modal states - using dedicated forms instead

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      console.log(' AdminTeams: Fetching teams from real API...');
      
      const response = await api.get('/admin/teams');
      
      // FIXED: Handle Laravel API response structure properly
      let teamsData = response?.data?.data || response?.data || response || [];
      console.log(' AdminTeams: Real teams data received:', teamsData.length, 'teams');
      console.log(' AdminTeams: Sample team data:', teamsData[0]);
      
      // Ensure we have an array
      if (!Array.isArray(teamsData)) {
        console.warn(' AdminTeams: Teams data is not an array, using fallback');
        teamsData = [];
      }
      
      // Store ALL teams without filtering
      setAllTeams(teamsData);
      console.log(' AdminTeams: Teams loaded successfully');
    } catch (error) {
      console.error('Error fetching teams:', error);
      setAllTeams([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Memoized filtered teams - client-side filtering with full text search
  const filteredTeams = useMemo(() => {
    let filtered = [...allTeams];

    // Apply search filter - supports full text search
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(team => 
        team.name?.toLowerCase().includes(searchTerm) ||
        team.short_name?.toLowerCase().includes(searchTerm) ||
        team.region?.toLowerCase().includes(searchTerm) ||
        team.country?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply region filter
    if (filters.region !== 'all') {
      filtered = filtered.filter(team => team.region === filters.region);
    }

    // Apply sorting
    if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [allTeams, filters]);

  // Memoized paginated teams
  const paginatedTeams = useMemo(() => {
    const startIndex = (currentPage - 1) * teamsPerPage;
    return filteredTeams.slice(startIndex, startIndex + teamsPerPage);
  }, [filteredTeams, currentPage, teamsPerPage]);

  // Total pages calculation
  const totalPages = Math.ceil(filteredTeams.length / teamsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageSizeChange = (newPageSize) => {
    setTeamsPerPage(newPageSize);
    setCurrentPage(1);
  };

  // CRUD Operations - Navigate to dedicated forms
  const handleCreateTeam = () => {
    console.log('🎯 AdminTeams: Navigating to team create form');
    if (navigateTo) {
      navigateTo('admin-team-create');
    }
  };

  const handleEditTeam = (team) => {
    console.log('🎯 AdminTeams: Navigating to team edit form with ID:', team.id);
    if (navigateTo) {
      navigateTo('admin-team-edit', { id: team.id });
    }
  };

  // Removed modal handlers - using dedicated forms instead

  // Selection handlers
  const handleSelectTeam = (teamId) => {
    const newSelected = new Set(selectedTeams);
    if (newSelected.has(teamId)) {
      newSelected.delete(teamId);
    } else {
      newSelected.add(teamId);
    }
    setSelectedTeams(newSelected);
  };

  const handleSelectAllTeams = () => {
    if (selectedTeams.size === paginatedTeams.length && paginatedTeams.length > 0) {
      setSelectedTeams(new Set());
    } else {
      setSelectedTeams(new Set(paginatedTeams.map(t => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTeams.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedTeams.size} teams? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/admin/teams/bulk-delete', {
          team_ids: Array.from(selectedTeams)
        });
        
        if (response.data?.success !== false) {
          await fetchTeams();
          setSelectedTeams(new Set());
          alert(`${selectedTeams.size} teams deleted successfully!`);
        } else {
          throw new Error(response.data?.message || 'Bulk delete failed');
        }
      } catch (error) {
        console.error('Error in bulk delete:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Bulk delete failed';
        alert(errorMessage);
      }
    }
  };

  const handleDelete = async (teamId, teamName) => {
    if (window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      try {
        // Check if the team exists in our current teams list first
        const teamExists = allTeams.find(team => team.id === teamId);
        if (!teamExists) {
          alert('Team not found. Please refresh the page and try again.');
          await fetchTeams(); // Refresh the list
          return;
        }

        console.log(' AdminTeams: Deleting team with ID:', teamId);
        await api.delete(`/admin/teams/${teamId}`);
        await fetchTeams(); // Refresh the list
        alert('Team deleted successfully!');
      } catch (error) {
        console.error('Error deleting team:', error);
        if (error.response && error.response.status === 404) {
          alert('Team not found. It may have already been deleted. Refreshing the list...');
          await fetchTeams(); // Refresh the list
        } else {
          alert('Error deleting team. Please try again.');
        }
      }
    }
  };

  const regions = ['all', 'NA', 'EU', 'APAC', 'ASIA', 'LATAM', 'BR', 'CN', 'KR', 'JP', 'Americas', 'EMEA', 'Oceania', 'China'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading teams...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Teams</h2>
          <p className="text-gray-600 dark:text-gray-400">Create, edit, and manage all teams</p>
        </div>
        <button 
          onClick={handleCreateTeam}
          className="btn btn-primary"
        >
          Create New Team
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Teams
            </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({...filters, region: e.target.value})}
              className="form-input"
            >
              {regions.map(region => (
                <option key={region} value={region}>
                  {region === 'all' ? 'All Regions' : region}
                </option>
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
              className="form-input"
            >
              <option value="rating">Rating</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', region: 'all', sortBy: 'rating' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTeams.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedTeams.size} teams selected
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm"
                >
                  Delete Selected
                </button>
              </div>
            </div>
            <button
              onClick={() => setSelectedTeams(new Set())}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Teams Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedTeams.size === paginatedTeams.length && paginatedTeams.length > 0}
                    onChange={handleSelectAllTeams}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Players
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedTeams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedTeams.has(team.id)}
                      onChange={() => handleSelectTeam(team.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* FIXED: Use proper TeamLogo component instead of raw emoji/text */}
                      <div className="mr-3">
                        <TeamLogo 
                          team={team} 
                          size="w-10 h-10" 
                          className="border border-gray-200 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {team.short_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {team.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                      {team.region}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-medium">
                      {team.rating || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Rank #{team.rank || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {team.player_count || 0} players
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log(' AdminTeams: Navigating to team-detail with ID:', team.id);
                          navigateTo('team-detail', { id: team.id });
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(team.id, team.name)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTeams.length}
          itemsPerPage={teamsPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          itemName="teams"
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* No Results */}
      {filteredTeams.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Teams Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.region !== 'all' 
              ? 'Try adjusting your filters to find more teams.'
              : 'Get started by creating your first team.'}
          </p>
          <button
            onClick={handleCreateTeam}
            className="btn btn-primary"
          >
            Create First Team
          </button>
        </div>
      )}

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {allTeams.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Teams</div>
          {filteredTeams.length !== allTeams.length && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {filteredTeams.length} filtered
            </div>
          )}
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">🌎</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {allTeams.filter(t => t.region === 'NA').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">NA Teams</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">🇪🇺</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {allTeams.filter(t => t.region === 'EU').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">EU Teams</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {allTeams.filter(t => (t.rating || 0) > 2000).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">High Rated</div>
        </div>
      </div>

      {/* Removed modal - using dedicated TeamForm component instead */}
    </div>
  );
}

export default AdminTeams;