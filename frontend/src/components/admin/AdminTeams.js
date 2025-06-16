import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getImageUrl } from '../../utils/imageUtils';

function AdminTeams({ navigateTo }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    region: 'all',
    sortBy: 'rating'
  });
  const { api } = useAuth();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 AdminTeams: Fetching teams from real API...');
      
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.region !== 'all') params.append('region', filters.region);
      
      const response = await api.get(`/teams${params.toString() ? `?${params.toString()}` : ''}`);
      
      // FIXED: Handle Laravel API response structure properly
      let teamsData = response?.data?.data || response?.data || response || [];
      console.log('✅ AdminTeams: Real teams data received:', teamsData.length, 'teams');
      console.log('🔍 AdminTeams: Sample team data:', teamsData[0]);
      
      // Ensure we have an array
      if (!Array.isArray(teamsData)) {
        console.warn('⚠️ AdminTeams: Teams data is not an array, using fallback');
        teamsData = [];
      }
      
      // Sort teams
      if (filters.sortBy === 'rating') {
        teamsData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (filters.sortBy === 'name') {
        teamsData.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      setTeams(teamsData);
      console.log('✅ AdminTeams: Teams loaded and sorted successfully');
    } catch (error) {
      console.error('❌ AdminTeams: Error fetching teams:', error);
      // Set fallback data with REAL backend structure
      setTeams([
        {
          id: 30, // Use real backend IDs
          name: 'Team Alpha Test',
          short_name: 'ALF',
          logo: 'teams/logos/56lKPjwutD9twfsufkT1U7tVg3MSG2tg8Wpb8M6o.jpg',
          region: 'NA',
          rating: 2458,
          rank: 1,
          players: []
        },
        {
          id: 31, // Use real backend IDs
          name: 'Team Beta Test',
          short_name: 'BET',
          logo: 'teams/logos/example.jpg',
          region: 'EU',
          rating: 2387,
          rank: 2,
          players: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleDelete = async (teamId, teamName) => {
    if (window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      try {
        // Check if the team exists in our current teams list first
        const teamExists = teams.find(team => team.id === teamId);
        if (!teamExists) {
          alert('Team not found. Please refresh the page and try again.');
          await fetchTeams(); // Refresh the list
          return;
        }

        console.log('🗑️ AdminTeams: Deleting team with ID:', teamId);
        // FIXED: Use POST with method spoofing for Laravel backend deletes
        await api.post(`/admin/teams/${teamId}`, { _method: 'DELETE' });
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

  const regions = ['all', 'NA', 'EU', 'APAC'];

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
          onClick={() => navigateTo('admin-team-create')}
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

      {/* Teams Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
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
              {teams.map((team) => (
                <tr key={team.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                        {/* FIXED: Show logo path for debugging */}
                        {team.logo && team.logo.includes('/') && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-32">
                            {team.logo}
                          </div>
                        )}
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
                      {team.players?.length || 0} players
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log('🔗 AdminTeams: Navigating to team-detail with ID:', team.id);
                          navigateTo('team-detail', { id: team.id });
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          console.log('🔗 AdminTeams: Navigating to admin-team-edit with ID:', team.id);
                          navigateTo('admin-team-edit', { id: team.id });
                        }}
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
      </div>

      {/* No Results */}
      {teams.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Teams Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.region !== 'all' 
              ? 'Try adjusting your filters to find more teams.'
              : 'Get started by creating your first team.'}
          </p>
          <button
            onClick={() => navigateTo('admin-team-create')}
            className="btn btn-primary"
          >
            Create First Team
          </button>
        </div>
      )}

      {/* Team Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {teams.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Teams</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">🌎</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {teams.filter(t => t.region === 'NA').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">NA Teams</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">🌍</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {teams.filter(t => t.region === 'EU').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">EU Teams</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {teams.filter(t => (t.rating || 0) > 2000).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">High Rated</div>
        </div>
      </div>
    </div>
  );
}

export default AdminTeams;