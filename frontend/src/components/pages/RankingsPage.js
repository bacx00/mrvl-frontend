import React, { useState, useEffect } from 'react';
import { TeamLogo } from '../../utils/imageUtils';
import { useAuth } from '../../hooks';

function RankingsPage({ navigateTo }) {
  const [selectedRegion, setSelectedRegion] = useState('World');
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const { api } = useAuth();

  useEffect(() => {
    fetchRankings();
  }, [selectedRegion]);

  const fetchRankings = async () => {
    setLoading(true);
    try {
      console.log('🔍 RankingsPage: Fetching REAL LIVE BACKEND RANKINGS...');
      
      // ✅ FIXED: ONLY USE REAL BACKEND DATA - NO MOCK FALLBACK
      const response = await api.get('/teams');
      const teamsData = response?.data || response || [];
      
      if (Array.isArray(teamsData) && teamsData.length > 0) {
        // Transform real backend data for rankings display
        let filteredTeams = teamsData
          .filter(team => team.rating && team.rank) // Only teams with rating data
          .sort((a, b) => a.rank - b.rank); // Sort by rank
        
        // Apply regional filtering
        if (selectedRegion !== 'World') {
          const regionMap = {
            'North America': ['NA', 'US', 'CA'],
            'Europe': ['EU', 'UK', 'DE', 'FR', 'SE'],
            'Asia-Pacific': ['APAC', 'KR', 'JP', 'AU']
          };
          const regionCodes = regionMap[selectedRegion] || [];
          filteredTeams = filteredTeams.filter(team => 
            regionCodes.includes(team.region) || regionCodes.includes(team.country)
          );
          
          // Re-rank for regional display
          filteredTeams = filteredTeams.map((team, index) => ({
            ...team,
            rank: index + 1
          }));
        }
        
        setRankings(filteredTeams);
        console.log('✅ RankingsPage: Using REAL backend rankings:', filteredTeams.length);
      } else {
        console.error('❌ RankingsPage: No backend data available');
        setRankings([]);
      }
    } catch (error) {
      console.error('❌ RankingsPage: Backend API failed:', error);
      setRankings([]); // ✅ NO MOCK DATA - Show empty state instead
    } finally {
      setLoading(false);
    }
  };

  // Marvel Rivals Division System based on rating
  const getDivisionName = (rating) => {
    if (rating >= 2300) return 'Eternity';
    if (rating >= 2000) return 'Celestial';
    if (rating >= 1700) return 'Vibranium';
    if (rating >= 1400) return 'Diamond';
    if (rating >= 1200) return 'Platinum';
    return 'Gold';
  };

  // Country flag helper function
  const getCountryFlag = (countryCode) => {
    return `${countryCode}`;
  };

  const regions = ['World', 'North America', 'Europe', 'Asia-Pacific'];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header - VLR.gg Style */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rankings</h1>
      </div>

      {/* Region Tabs - VLR.gg Style */}
      <div className="card mb-4">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                selectedRegion === region
                  ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                  : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Rankings Table - VLR.gg style - Team name + logo, ELO only */}
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-600 dark:text-gray-400">Loading rankings...</div>
            </div>
          ) : rankings.length === 0 ? (
            <div className="p-8 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No rankings available</h3>
              <p className="text-gray-600 dark:text-gray-400">No team rankings data available at this time.</p>
            </div>
          ) : (
            rankings.map((team, index) => (
              <div 
                key={team.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => {
                  console.log('🔗 Navigating to team detail:', team.id);
                  navigateTo && navigateTo('team-detail', { id: team.id });
                }}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Rank */}
                  <div className="w-12 text-center">
                    <span className={`font-bold text-lg ${
                      team.rank <= 3 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
                    }`}>
                      {team.rank}
                    </span>
                    {team.rank <= 3 && (
                      <div className="text-sm">
                        {team.rank === 1 ? '#1' : team.rank === 2 ? '#2' : '#3'}
                      </div>
                    )}
                  </div>

                  {/* Center: Team info */}
                  <div className="flex-1 flex items-center space-x-3">
                    {/* Country Code */}
                    <span className="text-lg">{getCountryFlag(team.country)}</span>
                    
                    {/* Team Logo */}
                    <TeamLogo team={team} size="w-8 h-8" />
                    
                    {/* Team Name */}
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        {team.short_name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-500">
                        {team.name}
                      </div>
                    </div>
                  </div>

                  {/* Right: Real Rating + Marvel Rivals Division */}
                  <div className="text-right">
                    <div className="font-bold text-lg text-red-600 dark:text-red-400">
                      {team.rating || team.points}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {getDivisionName(team.rating || team.points)}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
            {rankings.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Ranked Teams</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
            {rankings.length > 0 ? Math.round(rankings.reduce((acc, team) => acc + (team.win_rate || team.winRate || 0), 0) / rankings.length) : 0}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Average Win Rate</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
            {rankings.reduce((acc, team) => {
              const record = team.record || '0-0';
              const parts = record.split('-');
              return acc + parseInt(parts[0] || 0) + parseInt(parts[1] || 0);
            }, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Matches</div>
        </div>
      </div>
    </div>
  );
}

export default RankingsPage;