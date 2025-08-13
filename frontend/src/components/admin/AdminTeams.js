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
  const { api } = useAuth();
  
  // Modal states for create/edit
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    short_name: '',
    region: 'NA',
    country: '',
    rating: 1500,
    description: '',
    website: '',
    social_media: {
      twitter: '',
      discord: ''
    }
  });

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

  // CRUD Operations
  const handleCreateTeam = () => {
    setFormData({
      name: '',
      short_name: '',
      region: 'NA',
      country: '',
      rating: 1500,
      description: '',
      website: '',
      social_media: {
        twitter: '',
        discord: ''
      }
    });
    setShowCreateModal(true);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name || '',
      short_name: team.short_name || '',
      region: team.region || 'NA',
      country: team.country || '',
      rating: team.rating || 1500,
      description: team.description || '',
      website: team.website || '',
      social_media: {
        twitter: team.social_media?.twitter || '',
        discord: team.social_media?.discord || ''
      }
    });
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingTeam(null);
    setFormData({
      name: '',
      short_name: '',
      region: 'NA',
      country: '',
      rating: 1500,
      description: '',
      website: '',
      social_media: {
        twitter: '',
        discord: ''
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.short_name.trim()) {
      alert('Please fill in required fields (Name and Short Name)');
      return;
    }

    try {
      const submitData = {
        ...formData,
        social_media: JSON.stringify(formData.social_media)
      };

      if (editingTeam) {
        // Update existing team
        await api.put(`/admin/teams/${editingTeam.id}`, submitData);
        alert('Team updated successfully!');
      } else {
        // Create new team
        await api.post('/admin/teams', submitData);
        alert('Team created successfully!');
      }
      
      await fetchTeams();
      handleCloseModals();
    } catch (error) {
      console.error('Error submitting team:', error);
      alert(`Error ${editingTeam ? 'updating' : 'creating'} team. Please try again.`);
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
              {paginatedTeams.map((team) => (
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

      {/* Create/Edit Team Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingTeam ? 'Edit Team' : 'Create New Team'}
              </h3>
              <button
                onClick={handleCloseModals}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter team name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.short_name}
                    onChange={(e) => setFormData({...formData, short_name: e.target.value})}
                    className="form-input"
                    placeholder="e.g., SEN, FNC"
                    maxLength="10"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Region
                  </label>
                  <select
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    className="form-input"
                  >
                    <option value="NA">North America</option>
                    <option value="EU">Europe</option>
                    <option value="APAC">Asia-Pacific</option>
                    <option value="ASIA">Asia</option>
                    <option value="LATAM">Latin America</option>
                    <option value="BR">Brazil</option>
                    <option value="CN">China</option>
                    <option value="KR">Korea</option>
                    <option value="JP">Japan</option>
                    <option value="Americas">Americas</option>
                    <option value="EMEA">EMEA</option>
                    <option value="Oceania">Oceania</option>
                    <option value="China">China (Alt)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="form-input"
                    placeholder="e.g., United States, France"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rating
                  </label>
                  <input
                    type="number"
                    value={formData.rating}
                    onChange={(e) => setFormData({...formData, rating: parseInt(e.target.value) || 0})}
                    className="form-input"
                    min="0"
                    max="5000"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="form-input"
                    placeholder="https://team-website.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Twitter
                  </label>
                  <input
                    type="text"
                    value={formData.social_media.twitter}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_media: {...formData.social_media, twitter: e.target.value}
                    })}
                    className="form-input"
                    placeholder="@teamhandle"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Discord
                  </label>
                  <input
                    type="text"
                    value={formData.social_media.discord}
                    onChange={(e) => setFormData({
                      ...formData,
                      social_media: {...formData.social_media, discord: e.target.value}
                    })}
                    className="form-input"
                    placeholder="Discord server invite"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="form-input"
                  rows="4"
                  placeholder="Team description..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingTeam ? 'Update Team' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminTeams;