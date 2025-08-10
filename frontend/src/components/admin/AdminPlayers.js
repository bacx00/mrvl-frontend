import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../hooks';

function AdminPlayers() {
  const { api } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [playersPerPage] = useState(20);
  const [filters, setFilters] = useState({
    search: '',
    region: 'all',
    role: 'all',
    sortBy: 'rating'
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/players');
      const playersData = response?.data?.data || response?.data || response || [];
      setPlayers(Array.isArray(playersData) ? playersData : []);
    } catch (err) {
      setError('Failed to load players');
      console.error('Error fetching players:', err);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = useMemo(() => {
    let filtered = [...players];

    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim();
      filtered = filtered.filter(player => 
        player.name?.toLowerCase().includes(searchTerm) ||
        player.ign?.toLowerCase().includes(searchTerm) ||
        player.team_name?.toLowerCase().includes(searchTerm) ||
        player.region?.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.region !== 'all') {
      filtered = filtered.filter(player => player.region === filters.region);
    }

    if (filters.role !== 'all') {
      filtered = filtered.filter(player => player.role === filters.role);
    }

    if (filters.sortBy === 'rating') {
      filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (filters.sortBy === 'name') {
      filtered.sort((a, b) => (a.ign || a.name || '').localeCompare(b.ign || b.name || ''));
    } else if (filters.sortBy === 'team') {
      filtered.sort((a, b) => (a.team_name || '').localeCompare(b.team_name || ''));
    }

    return filtered;
  }, [players, filters]);

  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * playersPerPage;
    return filteredPlayers.slice(startIndex, startIndex + playersPerPage);
  }, [filteredPlayers, currentPage, playersPerPage]);

  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const handleDeletePlayer = async (playerId, playerName) => {
    if (window.confirm(`Are you sure you want to delete player "${playerName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/admin/players/${playerId}`);
        await fetchPlayers();
        alert('Player deleted successfully!');
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
      }
    }
  };

  const handleCreatePlayer = async () => {
    // Simple create player modal - you can expand this
    const name = prompt('Enter player name:');
    const ign = prompt('Enter in-game name:');
    const region = prompt('Enter region (NA, EU, APAC):');
    
    if (name && ign && region) {
      try {
        await api.post('/admin/players', { 
          name, 
          ign, 
          region: region.toUpperCase() 
        });
        await fetchPlayers();
        alert('Player created successfully!');
      } catch (error) {
        console.error('Error creating player:', error);
        alert('Error creating player. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Player Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage player profiles and information</p>
        </div>
        <button onClick={handleCreatePlayer} className="btn btn-primary">
          Add New Player
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Search Players
            </label>
            <input
              type="text"
              placeholder="Search by name or IGN..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Region
            </label>
            <select
              value={filters.region}
              onChange={(e) => setFilters({...filters, region: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="all">All Regions</option>
              <option value="NA">North America</option>
              <option value="EU">Europe</option>
              <option value="APAC">APAC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="rating">Rating</option>
              <option value="name">Name</option>
              <option value="team">Team</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', region: 'all', role: 'all', sortBy: 'rating' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
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
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {(player.ign || player.name || '?')[0].toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-4">
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
                        player.role === 'DPS' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                        player.role === 'Tank' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                        player.role === 'Support' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {player.role}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 rounded-full">
                      {player.region || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.rating || 'Unrated'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button
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
                  Showing <span className="font-medium">{(currentPage - 1) * playersPerPage + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * playersPerPage, filteredPlayers.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredPlayers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === index + 1
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      } ${
                        index === 0 ? 'rounded-l-md' : ''
                      } ${
                        index === totalPages - 1 ? 'rounded-r-md' : ''
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* No Results */}
      {filteredPlayers.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Players Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.region !== 'all' || filters.role !== 'all'
              ? 'Try adjusting your filters to find more players.'
              : 'Get started by adding your first player.'}
          </p>
          <button onClick={handleCreatePlayer} className="btn btn-primary">
            Add First Player
          </button>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {players.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {players.filter(p => p.role === 'DPS').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">DPS Players</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {players.filter(p => p.role === 'Tank').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tank Players</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
          <div className="text-3xl mb-2"></div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {players.filter(p => p.role === 'Support').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Support Players</div>
        </div>
      </div>
    </div>
  );
}

export default AdminPlayers;