import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar, getCountryFlag, getCountryName } from '../../utils/imageUtils';
import Pagination from '../shared/Pagination';

function AdminPlayers({ navigateTo }) {
  const { api } = useAuth();
  const [allPlayers, setAllPlayers] = useState([]); // Store all players
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage, setPlayersPerPage] = useState(20);
  const [selectedPlayers, setSelectedPlayers] = useState(new Set());
  const [filters, setFilters] = useState({
    search: '',
    region: 'all',
    role: 'all',
    sortBy: 'rating'
  });

  // Modal states for create/edit
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    ign: '',
    country: '',
    role: 'DPS',
    rating: 1500,
    description: ''
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🏃 AdminPlayers: Fetching players from real API...');
      
      const response = await api.get('/admin/players?per_page=500');
      
      // Handle Laravel API response structure properly
      let playersData = response?.data?.data || response?.data || response || [];
      console.log('🏃 AdminPlayers: Real players data received:', playersData.length, 'players');
      console.log('🏃 AdminPlayers: Sample player data:', playersData[0]);
      
      // Ensure we have an array
      if (!Array.isArray(playersData)) {
        console.warn('🏃 AdminPlayers: Players data is not an array, using fallback');
        playersData = [];
      }
      
      // Store ALL players without filtering
      setAllPlayers(playersData);
      console.log('🏃 AdminPlayers: Players loaded successfully');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load players';
      setError(errorMessage);
      console.error('Error fetching players:', err);
      setAllPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Memoized filtered players - client-side filtering with full text search
  const filteredPlayers = useMemo(() => {
    let filtered = [...allPlayers];

    // Apply search filter - supports full text search
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.name?.toLowerCase().includes(searchTerm) ||
        player.ign?.toLowerCase().includes(searchTerm) ||
        player.team_name?.toLowerCase().includes(searchTerm) ||
        player.country?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply country filter (changed from region to country)
    if (filters.region !== 'all') {
      filtered = filtered.filter(player => player.country === filters.region);
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(player => {
        // Handle both Marvel Rivals roles and traditional roles
        const playerRole = player.role;
        if (filters.role === 'DPS') {
          return playerRole === 'DPS' || playerRole === 'Duelist';
        } else if (filters.role === 'Tank') {
          return playerRole === 'Tank' || playerRole === 'Vanguard';
        } else if (filters.role === 'Support') {
          return playerRole === 'Support' || playerRole === 'Strategist';
        }
        return playerRole === filters.role;
      });
    }

    if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'name') {
      filtered.sort((a, b) => (a.ign || a.name || '').localeCompare(b.ign || b.name || ''));
    } else if (filters.sortBy === 'team') {
      filtered.sort((a, b) => (a.team_name || '').localeCompare(b.team_name || ''));
    }

    return filtered;
  }, [allPlayers, filters]);

  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * playersPerPage;
    return filteredPlayers.slice(startIndex, startIndex + playersPerPage);
  }, [filteredPlayers, currentPage, playersPerPage]);

  // Total pages calculation
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handlePageSizeChange = (newPageSize) => {
    setPlayersPerPage(newPageSize);
    setCurrentPage(1);
  };

  // CRUD Operations
  const handleCreatePlayer = () => {
    setFormData({
      name: '',
      ign: '',
      country: '',
      role: 'DPS',
      rating: 1500,
      description: ''
    });
    setShowCreateModal(true);
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer(player);
    setFormData({
      name: player.name || '',
      ign: player.ign || '',
      country: player.country || '',
      role: player.role || 'DPS',
      rating: player.rating || 1500,
      description: player.description || ''
    });
    setShowEditModal(true);
  };

  const handleCloseModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setEditingPlayer(null);
    setFormData({
      name: '',
      ign: '',
      country: '',
      role: 'DPS',
      rating: 1500,
      description: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.ign.trim()) {
      alert('Please fill in required fields (Name and IGN)');
      return;
    }

    try {
      if (editingPlayer) {
        // Update existing player
        await api.put(`/admin/players/${editingPlayer.id}`, formData);
        alert('Player updated successfully!');
      } else {
        // Create new player
        await api.post('/admin/players', formData);
        alert('Player created successfully!');
      }
      
      await fetchPlayers();
      handleCloseModals();
    } catch (error) {
      console.error('Error submitting player:', error);
      alert(`Error ${editingPlayer ? 'updating' : 'creating'} player. Please try again.`);
    }
  };

  const handleDeletePlayer = async (playerId, playerName) => {
    if (window.confirm(`Are you sure you want to delete player "${playerName}"? This action cannot be undone.`)) {
      try {
        // Check if the player exists in our current players list first
        const playerExists = allPlayers.find(player => player.id === playerId);
        if (!playerExists) {
          alert('Player not found. Please refresh the page and try again.');
          await fetchPlayers(); // Refresh the list
          return;
        }

        console.log('🏃 AdminPlayers: Deleting player with ID:', playerId);
        await api.delete(`/admin/players/${playerId}`);
        await fetchPlayers(); // Refresh the list
        alert('Player deleted successfully!');
      } catch (error) {
        console.error('Error deleting player:', error);
        if (error.response && error.response.status === 404) {
          alert('Player not found. It may have already been deleted. Refreshing the list...');
          await fetchPlayers(); // Refresh the list
        } else {
          alert('Error deleting player. Please try again.');
        }
      }
    }
  };

  // Bulk operations handlers
  const handleSelectPlayer = (playerId) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAllPlayers = () => {
    if (selectedPlayers.size === paginatedPlayers.length && paginatedPlayers.length > 0) {
      setSelectedPlayers(new Set());
    } else {
      setSelectedPlayers(new Set(paginatedPlayers.map(p => p.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPlayers.size === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedPlayers.size} players? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      try {
        const response = await api.post('/admin/players/bulk-delete', {
          player_ids: Array.from(selectedPlayers)
        });
        
        if (response.data?.success !== false) {
          await fetchPlayers();
          setSelectedPlayers(new Set());
          alert(`${selectedPlayers.size} players deleted successfully!`);
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

  const countries = ['all', 'US', 'CA', 'UK', 'DE', 'FR', 'ES', 'IT', 'KR', 'JP', 'CN', 'BR'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading players...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-2">Error Loading Players</h3>
          <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
          <button onClick={fetchPlayers} className="btn btn-outline-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Players</h2>
          <p className="text-gray-600 dark:text-gray-400">Create, edit, and manage all players</p>
        </div>
        <button 
          onClick={handleCreatePlayer}
          className="btn btn-primary"
        >
          Create New Player
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Players
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
              Country
            </label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({...filters, region: e.target.value})}
              className="form-input"
            >
              {countries.map(country => (
                <option key={country} value={country}>
                  {country === 'all' ? 'All Countries' : getCountryName(country)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="form-input"
            >
              <option value="all">All Roles</option>
              <option value="DPS">DPS</option>
              <option value="Tank">Tank</option>
              <option value="Support">Support</option>
              <option value="Flex">Flex</option>
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
              <option value="team">Team</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button
            onClick={() => setFilters({ search: '', region: 'all', role: 'all', sortBy: 'rating' })}
            className="btn btn-secondary"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedPlayers.size > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {selectedPlayers.size} players selected
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
              onClick={() => setSelectedPlayers(new Set())}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Players Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedPlayers.size === paginatedPlayers.length && paginatedPlayers.length > 0}
                    onChange={handleSelectAllPlayers}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Team
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedPlayers.has(player.id)}
                      onChange={() => handleSelectPlayer(player.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* Use PlayerAvatar component with fallback */}
                      <div className="mr-3">
                        <PlayerAvatar 
                          player={player} 
                          size="w-10 h-10" 
                          className="border border-gray-200 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {player.ign || player.name}
                        </div>
                        {player.ign && player.name && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {player.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.team_name ? (
                      <div className="text-sm text-gray-900 dark:text-white">
                        {player.team_name}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                        No team
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {player.role ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (player.role === 'DPS' || player.role === 'Duelist') ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        (player.role === 'Tank' || player.role === 'Vanguard') ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        (player.role === 'Support' || player.role === 'Strategist') ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {player.role}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCountryFlag(player.country)}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {getCountryName(player.country) || 'Unknown'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.rating || 'Unrated'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log('🏃 AdminPlayers: Navigating to player-detail with ID:', player.id);
                          if (navigateTo) {
                            navigateTo('player-detail', { id: player.id });
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleEditPlayer(player)}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id, player.ign || player.name)}
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
          totalItems={filteredPlayers.length}
          itemsPerPage={playersPerPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          itemName="players"
          pageSizeOptions={[10, 25, 50, 100]}
        />
      </div>

      {/* No Results */}
      {filteredPlayers.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🏃‍♂️</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Players Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.region !== 'all' || filters.role !== 'all'
              ? 'Try adjusting your filters to find more players.'
              : 'Get started by creating your first player.'}
          </p>
          <button
            onClick={handleCreatePlayer}
            className="btn btn-primary"
          >
            Create First Player
          </button>
        </div>
      )}

      {/* Player Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">🏃‍♂️</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {allPlayers.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
          {filteredPlayers.length !== allPlayers.length && (
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {filteredPlayers.length} filtered
            </div>
          )}
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">⚔️</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {allPlayers.filter(p => p.role === 'DPS' || p.role === 'Duelist').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">DPS Players</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">🛡️</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {allPlayers.filter(p => p.role === 'Tank' || p.role === 'Vanguard').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tank Players</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">💚</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {allPlayers.filter(p => p.role === 'Support' || p.role === 'Strategist').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Support Players</div>
        </div>
      </div>

      {/* Create/Edit Player Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingPlayer ? 'Edit Player' : 'Create New Player'}
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
                    Player Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="form-input"
                    placeholder="Enter player name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    In-Game Name (IGN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ign}
                    onChange={(e) => setFormData({...formData, ign: e.target.value})}
                    className="form-input"
                    placeholder="e.g., TenZ, Shroud"
                    maxLength="20"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    className="form-input"
                  >
                    <option value="">Select Country</option>
                    {countries.filter(c => c !== 'all').map(country => (
                      <option key={country} value={country}>
                        {getCountryFlag(country)} {getCountryName(country)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="form-input"
                  >
                    <option value="DPS">DPS</option>
                    <option value="Tank">Tank</option>
                    <option value="Support">Support</option>
                    <option value="Flex">Flex</option>
                  </select>
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
                  placeholder="Player description..."
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
                  {editingPlayer ? 'Update Player' : 'Create Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPlayers;