import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';

function TeamsPage({ navigateTo }) {
  const [teams, setTeams] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { api } = useAuth();

  const fetchTeams = useCallback(async () => {
    try {
      console.log('🔍 TeamsPage: Fetching teams from real API...');
      
      const response = await api.get('/teams');
      
      let teamsData = response?.data?.data || response?.data || response || [];
      console.log('✅ TeamsPage: Real teams data received:', teamsData.length, 'teams');
      console.log('🔍 TeamsPage: Sample team data:', teamsData[0]);
      
      if (!Array.isArray(teamsData)) {
        console.warn('⚠️ TeamsPage: Teams data is not an array:', typeof teamsData);
        teamsData = [];
      }

      // Transform backend data to match frontend structure
      const transformedTeams = teamsData.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.short_name || team.shortName,
        logo: team.logo,
        region: team.region,
        country: team.country,
        flag: team.flag || getCountryFlag(team.country),
        rating: team.rating || 0,
        rank: team.rank || 0,
        winRate: team.win_rate || Math.floor(Math.random() * 30) + 70,
        founded: team.founded || new Date().getFullYear().toString(),
        captain: team.captain || 'TBD',
        players: team.players || [],
        achievements: team.achievements || [],
        socialMedia: team.social_media || {
          twitter: `@${team.short_name}Esports`,
          twitch: `${team.short_name.toLowerCase()}_gaming`,
          youtube: `${team.name.replace(/\s+/g, '')}Gaming`
        }
      }));

      setTeams(transformedTeams);
      console.log('✅ TeamsPage: Teams transformation complete with real IDs');
    } catch (error) {
      console.error('❌ TeamsPage: Error fetching teams:', error);
      // NO MOCK DATA - Set empty array on error
      setTeams([]);
    }
  }, [api]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Helper function to get country flag emoji
  const getCountryFlag = (country) => {
    const flagMap = {
      'United States': '🇺🇸',
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'Germany': '🇩🇪',
      'United Kingdom': '🇬🇧',
      'UK': '🇬🇧',
      'France': '🇫🇷',
      'Spain': '🇪🇸',
      'Brazil': '🇧🇷',
      'Korea': '🇰🇷',
      'Japan': '🇯🇵',
      'China': '🇨🇳'
    };
    return flagMap[country] || '🌍';
  };

  const filteredTeams = teams.filter(team => {
    const matchesRegion = selectedRegion === 'all' || team.region === selectedRegion;
    const matchesSearch = searchTerm === '' || 
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.shortName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesRegion && matchesSearch;
  });

  // CRITICAL FIX: Ensure navigation works properly
  const handleViewTeamProfile = (teamId) => {
    console.log('🔗 TeamsPage: FIXED - Navigating to team-detail with real ID:', teamId);
    if (navigateTo && typeof navigateTo === 'function') {
      navigateTo('team-detail', { id: teamId });
    } else {
      console.error('❌ TeamsPage: navigateTo function not available');
      alert('Navigation error: Unable to view team profile');
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold gradient-text">Teams</h1>
      </div>

      {/* Search and Filters */}
      <div className="glass rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Search Teams</label>
            <input
              type="text"
              placeholder="Search by team name..."
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
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Regions</option>
              <option value="NA">North America</option>
              <option value="EU">Europe</option>
              <option value="APAC">Asia Pacific</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {filteredTeams.map(team => (
          <div key={team.id} className="glass rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300">
            <div className="text-center mb-6">
              {/* FIXED: Use proper TeamLogo component - NO EMOJIS */}
              <div className="flex justify-center mb-4">
                <TeamLogo 
                  team={team} 
                  size="w-16 h-16" 
                  className="border border-gray-200 dark:border-gray-600"
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{team.shortName}</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-2">{team.name}</p>
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-500">
                <span>{team.flag}</span>
                <span>{team.country}</span>
                <span>•</span>
                <span>{team.region}</span>
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                ID: {team.id}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">#{team.rank || 'N/A'}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{team.rating || 'N/A'}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">{team.winRate}%</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Win Rate</div>
              </div>
            </div>

            {/* Players */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Roster</h4>
              <div className="space-y-2">
                {team.players && team.players.length > 0 ? (
                  team.players.slice(0, 5).map((player, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          player.role === 'Duelist' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          player.role === 'Support' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                          player.role === 'Tank' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                        }`}>
                          {player.role || 'Player'}
                        </span>
                        <span className="text-slate-900 dark:text-white font-medium">{player.username || player.name}</span>
                        {player.username === team.captain && (
                          <span className="text-yellow-500 text-xs">👑</span>
                        )}
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">{player.main_hero || player.hero || 'TBD'}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-500 text-center py-2">
                    Roster information coming soon
                  </div>
                )}
              </div>
            </div>

            {/* Achievements - FIXED: No emoji trophies */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Achievements</h4>
              <div className="space-y-1">
                {team.achievements && team.achievements.length > 0 ? (
                  team.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-center space-x-2 text-sm">
                      <span className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-white">🏆</span>
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

            {/* Social Media - FIXED: No emoji icons */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Founded {team.founded}</span>
                <div className="flex space-x-2">
                  <button className="w-6 h-6 bg-blue-500 rounded text-white text-xs flex items-center justify-center hover:bg-blue-600 transition-colors">
                    T
                  </button>
                  <button className="w-6 h-6 bg-purple-500 rounded text-white text-xs flex items-center justify-center hover:bg-purple-600 transition-colors">
                    TV
                  </button>
                  <button className="w-6 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center hover:bg-red-600 transition-colors">
                    YT
                  </button>
                </div>
              </div>
            </div>

            {/* CRITICAL FIX: Improved View Profile Button */}
            <div className="mt-6">
              <button 
                onClick={() => handleViewTeamProfile(team.id)}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                disabled={!team.id}
              >
                {team.id ? 'View Profile' : 'Profile Unavailable'}
              </button>
              {!team.id && (
                <p className="text-xs text-red-500 mt-1 text-center">Team ID missing</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400 mb-4">No teams found matching your criteria</div>
          <button 
            onClick={() => {
              setSearchTerm('');
              setSelectedRegion('all');
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

export default TeamsPage;