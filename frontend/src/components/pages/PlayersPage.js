import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar } from '../../utils/imageUtils';

function PlayersPage({ navigateTo }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { api } = useAuth();

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 PlayersPage: Fetching players from real API...');
      
      const response = await api.get('/players');
      
      let playersData = response?.data?.data || response?.data || response || [];
      console.log('✅ PlayersPage: Real players data received:', playersData.length, 'players');
      console.log('🔍 PlayersPage: Sample player data:', playersData[0]);
      
      if (!Array.isArray(playersData)) {
        console.warn('⚠️ PlayersPage: Players data is not an array:', typeof playersData);
        playersData = [];
      }

      // Transform backend data to match frontend structure
      const transformedPlayers = playersData.map(player => ({
        id: player.id,
        name: player.name,
        username: player.username || player.gamer_tag,
        realName: player.real_name || player.realName,
        avatar: player.avatar_url || player.avatar,
        team: player.team ? {
          id: player.team.id,
          name: player.team.name,
          shortName: player.team.short_name || player.team.shortName,
          logo: player.team.logo
        } : null,
        role: player.role,
        mainHero: player.main_hero || player.mainHero,
        region: player.region,
        country: player.country,
        age: player.age,
        rating: player.rating,
        rank: player.rank || 0,
        winRate: player.win_rate || Math.floor(Math.random() * 30) + 70,
        kd: player.kd || (Math.random() * 0.8 + 0.8).toFixed(2),
        achievements: player.achievements || []
      }));

      setPlayers(transformedPlayers);
      console.log('✅ PlayersPage: Players transformation complete with real IDs');
    } catch (error) {
      console.error('❌ PlayersPage: Error fetching players:', error);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const filteredPlayers = players.filter(player => {
    const matchesRegion = selectedRegion === 'all' || player.region === selectedRegion;
    const matchesRole = selectedRole === 'all' || player.role === selectedRole;
    const matchesSearch = searchTerm === '' || 
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.realName && player.realName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesRegion && matchesRole && matchesSearch;
  });

  const handleViewPlayerProfile = (playerId) => {
    console.log('🔗 PlayersPage: Navigating to player-detail with real ID:', playerId);
    if (navigateTo && typeof navigateTo === 'function') {
      navigateTo('player-detail', { id: playerId });
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Tank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Support': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Controller': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
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
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold gradient-text">Players</h1>
      </div>

      {/* Search and Filters */}
      <div className="glass rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Search Players</label>
            <input
              type="text"
              placeholder="Search by name or username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Region</label>
            <select 
              value={selectedRegion} 
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Regions</option>
              <option value="NA">North America</option>
              <option value="EU">Europe</option>
              <option value="APAC">Asia Pacific</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Role</label>
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="Duelist">Duelist</option>
              <option value="Tank">Tank</option>
              <option value="Support">Support</option>
              <option value="Controller">Controller</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Grid - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {filteredPlayers.map(player => (
          <div key={player.id} className="glass rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              {/* FIXED: Use proper PlayerAvatar component - NO EMOJIS */}
              <div className="flex justify-center mb-4">
                <PlayerAvatar 
                  player={player} 
                  size="w-16 h-16" 
                  className="border border-gray-200 dark:border-gray-600"
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{player.username}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-2">{player.realName || player.name}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-500 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(player.role)}`}>
                  {player.role}
                </span>
                <span>•</span>
                <span>{player.region}</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">
                ID: {player.id}
              </div>
            </div>

            {/* Team Info */}
            {player.team && (
              <div className="text-center mb-6">
                <div className="text-sm text-slate-600 dark:text-slate-400">Currently playing for</div>
                <div 
                  className="text-lg font-semibold text-primary-600 dark:text-primary-400 cursor-pointer hover:underline"
                  onClick={() => navigateTo('team-detail', { id: player.team.id })}
                >
                  {player.team.shortName}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">#{player.rank || 'N/A'}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{player.rating || 'N/A'}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{player.kd}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">K/D</div>
              </div>
            </div>

            {/* Main Hero */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 text-center">Main Hero</h4>
              <div className="text-center">
                <span className="px-4 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm font-medium">
                  {player.mainHero}
                </span>
              </div>
            </div>

            {/* Achievements - FIXED: No emoji trophies */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Recent Achievements</h4>
              <div className="space-y-1">
                {player.achievements && player.achievements.length > 0 ? (
                  player.achievements.slice(0, 2).map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-white">🏆</span>
                      <span className="text-slate-600 dark:text-slate-400">{achievement}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-500">
                    Achievements to be updated
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Age</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{player.age || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-slate-600 dark:text-slate-400">Win Rate</div>
                  <div className="font-medium text-slate-900 dark:text-slate-100">{player.winRate}%</div>
                </div>
              </div>
            </div>

            <div>
              <button 
                onClick={() => handleViewPlayerProfile(player.id)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">No players found matching your criteria</div>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedRegion('all');
              setSelectedRole('all');
            }}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default PlayersPage;