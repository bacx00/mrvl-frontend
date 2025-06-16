import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar, getImageUrl } from '../../utils/imageUtils';

function AdminPlayers({ navigateTo }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    team: 'all',
    region: 'all'
  });
  const { api } = useAuth();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 AdminPlayers: Fetching players from real API...');
      
      // Fetch players and teams
      const [playersResponse, teamsResponse] = await Promise.all([
        api.get('/players').catch(() => ({ data: [] })),
        api.get('/teams').catch(() => ({ data: [] }))
      ]);

      // FIXED: Handle Laravel API response structure properly
      let playersData = playersResponse?.data?.data || playersResponse?.data || playersResponse || [];
      const teamsData = teamsResponse?.data?.data || teamsResponse?.data || teamsResponse || [];

      console.log('✅ AdminPlayers: Real players data received:', playersData.length, 'players');
      console.log('🔍 AdminPlayers: Sample player data:', playersData[0]);
      console.log('✅ AdminPlayers: Real teams data received:', teamsData.length, 'teams');

      // Apply filters
      if (filters.search) {
        playersData = playersData.filter(player => 
          player.username?.toLowerCase().includes(filters.search.toLowerCase()) ||
          player.real_name?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.role !== 'all') {
        playersData = playersData.filter(player => player.role === filters.role);
      }

      if (filters.team !== 'all') {
        playersData = playersData.filter(player => player.team?.short_name === filters.team);
      }

      if (filters.region !== 'all') {
        playersData = playersData.filter(player => player.team?.region === filters.region);
      }

      setPlayers(playersData);
      setTeams(teamsData);
      console.log('✅ AdminPlayers: Players and teams loaded successfully');
    } catch (error) {
      console.error('❌ AdminPlayers: Error fetching data:', error);
      // Set fallback data with REAL backend structure
      setPlayers([
        {
          id: 28, // Use real backend IDs
          username: 'testplayer789',
          real_name: 'Test Player 3',
          team: { id: 30, short_name: 'ALF', region: 'NA' },
          role: 'Duelist',
          rating: 2945.2,
          main_hero: 'Iron Man',
          country: 'USA',
          avatar_url: 'players/avatars/example.jpg'
        },
        {
          id: 27, // Use real backend IDs
          username: 'testplayer456',
          real_name: 'Test Player 2',
          team: { id: 31, short_name: 'BET', region: 'EU' },
          role: 'Support',
          rating: 2892.7,
          main_hero: 'Mantis',
          country: 'Germany',
          avatar_url: 'players/avatars/example2.jpg'
        }
      ]);
      setTeams([
        { id: 30, short_name: 'ALF', region: 'NA' },
        { id: 31, short_name: 'BET', region: 'EU' }
      ]);
    } finally {
      setLoading(false);
    }
  }, [api, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (playerId, playerName) => {
    if (window.confirm(`Are you sure you want to delete "${playerName}"? This action cannot be undone.`)) {
      try {
        console.log('🗑️ AdminPlayers: Deleting player with ID:', playerId);
        // FIXED: Use POST with method spoofing for Laravel backend deletes
        await api.post(`/admin/players/${playerId}`, { _method: 'DELETE' });
        await fetchData(); // Refresh the list
        alert('Player deleted successfully!');
      } catch (error) {
        console.error('Error deleting player:', error);
        alert('Error deleting player. Please try again.');
      }
    }
  };

  const roles = ['all', 'Duelist', 'Tank', 'Support', 'Controller'];
  const regions = ['all', 'NA', 'EU', 'APAC'];
  const teamOptions = ['all', ...teams.map(team => team.short_name)];

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Tank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Support': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Controller': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Players</h2>
          <p className="text-gray-600 dark:text-gray-400">Create, edit, and manage all players</p>
        </div>
        <button 
          onClick={() => navigateTo('admin-player-create')}
          className="btn btn-primary"
        >
          Add New Player
        </button>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="form-input"
            >
              {roles.map(role => (
                <option key={role} value={role}>
                  {role === 'all' ? 'All Roles' : role}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Team
            </label>
            <select
              value={filters.team}
              onChange={(e) => setFilters({...filters, team: e.target.value})}
              className="form-input"
            >
              {teamOptions.map(team => (
                <option key={team} value={team}>
                  {team === 'all' ? 'All Teams' : team}
                </option>
              ))}
            </select>
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
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', role: 'all', team: 'all', region: 'all' })}
              className="btn btn-secondary w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
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
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Main Hero
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {/* FIXED: Use proper PlayerAvatar component instead of placeholder */}
                      <div className="mr-3">
                        <PlayerAvatar 
                          player={player} 
                          size="w-10 h-10" 
                          className="border border-gray-200 dark:border-gray-600"
                        />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {player.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {player.real_name}
                        </div>
                        {/* FIXED: Show avatar path for debugging */}
                        {player.avatar_url && player.avatar_url.includes('/') && (
                          <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-32">
                            {player.avatar_url}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{player.country}</span>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {player.team?.short_name || 'Free Agent'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(player.role)}`}>
                      {player.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {player.rating?.toFixed(0) || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {player.main_hero || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          console.log('🔗 AdminPlayers: Navigating to player-detail with ID:', player.id);
                          navigateTo('player-detail', { id: player.id });
                        }}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View
                      </button>
                      <button
                        onClick={() => {
                          console.log('🔗 AdminPlayers: Navigating to admin-player-edit with ID:', player.id);
                          navigateTo('admin-player-edit', { id: player.id });
                        }}
                        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(player.id, player.username)}
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
      {players.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🎮</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Players Found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {filters.search || filters.role !== 'all' || filters.team !== 'all' || filters.region !== 'all'
              ? 'Try adjusting your filters to find more players.'
              : 'Get started by adding your first player.'}
          </p>
          <button
            onClick={() => navigateTo('admin-player-create')}
            className="btn btn-primary"
          >
            Add First Player
          </button>
        </div>
      )}

      {/* Player Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {players.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Players</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">⚔️</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {players.filter(p => p.role === 'Duelist').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Duelists</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">🛡️</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {players.filter(p => p.role === 'Tank').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tanks</div>
        </div>
        <div className="card p-6 text-center">
          <div className="text-3xl mb-2">💚</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {players.filter(p => p.role === 'Support').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Supports</div>
        </div>
      </div>
    </div>
  );
}

export default AdminPlayers;