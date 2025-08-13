import React, { useState, useEffect } from 'react';
import { TeamLogo, getCountryFlag, getCountryName } from '../../utils/imageUtils';
import { useAuth } from '../../hooks';

function RankingsPage({ navigateTo }) {
  const [selectedRegion, setSelectedRegion] = useState('World');
  const [rankings, setRankings] = useState([]);
  const [rankingsType, setRankingsType] = useState('teams'); // 'teams' or 'players'
  const [loading, setLoading] = useState(false);
  const { api } = useAuth();

  useEffect(() => {
    fetchRankings();
  }, [selectedRegion, api]);

  const fetchRankings = async () => {
    if (loading) return; // Prevent duplicate requests
    
    try {
      setLoading(true);
      console.log('RankingsPage: Fetching REAL LIVE BACKEND RANKINGS...');
      
      // Fetch teams with proper ELO ratings
      const response = await api.get('/teams');
      const teamsData = response?.data?.data || response?.data || [];
      
      if (Array.isArray(teamsData) && teamsData.length > 0) {
        // Sort by ELO rating (highest first)
        let sortedTeams = [...teamsData].sort((a, b) => (b.rating || 1000) - (a.rating || 1000));
        
        // Add rank numbers after sorting
        sortedTeams = sortedTeams.map((team, index) => ({
          ...team,
          rank: index + 1
        }));
        
        // Apply regional filtering - Marvel Rivals Official Tournament Structure
        if (selectedRegion !== 'World') {
          const regionMap = {
            'Americas': ['NA', 'US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'Americas'],
            'EMEA': ['EU', 'UK', 'DE', 'FR', 'SE', 'ES', 'IT', 'PL', 'TR', 'RU', 'SA', 'AE', 'ZA', 'EMEA'],
            'China': ['CN', 'China'],
            'Asia': ['KR', 'JP', 'TH', 'VN', 'SG', 'MY', 'ID', 'PH', 'TW', 'HK', 'IN', 'Asia'],
            'Oceania': ['AU', 'NZ', 'FJ', 'PG', 'NC', 'Oceania']
          };
          const regionCodes = regionMap[selectedRegion] || [];
          sortedTeams = sortedTeams.filter(team => 
            regionCodes.includes(team.region) || regionCodes.includes(team.country)
          );
          
          // Re-rank for regional display
          sortedTeams = sortedTeams.map((team, index) => ({
            ...team,
            rank: index + 1
          }));
        }
        
        
        setRankings(sortedTeams);
        console.log('RankingsPage: Using REAL backend ELO rankings:', sortedTeams.length);
      } else {
        console.error('RankingsPage: No backend data available');
        setRankings([]);
      }
    } catch (error) {
      console.error('RankingsPage: Backend API failed:', error);
      setRankings([]); // NO MOCK DATA - Show empty state instead
    } finally {
      setLoading(false);
    }
  };

  // Marvel Rivals Division System based on ELO rating
  const getDivisionName = (rating) => {
    if (!rating) return 'Unranked';
    if (rating >= 2500) return 'One Above All';
    if (rating >= 2300) return 'Eternity';
    if (rating >= 2100) return 'Celestial';
    if (rating >= 1900) return 'Grandmaster';
    if (rating >= 1700) return 'Diamond';
    if (rating >= 1500) return 'Platinum';
    if (rating >= 1300) return 'Gold';
    if (rating >= 1100) return 'Silver';
    return 'Bronze';
  };
  
  const getDivisionColor = (rating) => {
    if (!rating) return 'text-gray-500';
    if (rating >= 2500) return 'text-purple-600 dark:text-purple-400';
    if (rating >= 2300) return 'text-pink-600 dark:text-pink-400';
    if (rating >= 2100) return 'text-blue-600 dark:text-blue-400';
    if (rating >= 1900) return 'text-red-600 dark:text-red-400';
    if (rating >= 1700) return 'text-cyan-600 dark:text-cyan-400';
    if (rating >= 1500) return 'text-emerald-600 dark:text-emerald-400';
    if (rating >= 1300) return 'text-yellow-600 dark:text-yellow-400';
    if (rating >= 1100) return 'text-gray-400 dark:text-gray-500';
    return 'text-orange-600 dark:text-orange-400';
  };


  // Marvel Rivals Official Tournament Regions (2025)
  const regions = ['World', 'Americas', 'EMEA', 'China', 'Asia', 'Oceania'];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header - VLR.gg Style */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Marvel Rivals Rankings</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Official Tournament Regions • ELO Ratings
        </div>
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
          {rankings.length === 0 ? (
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
                  console.log('Navigating to team detail:', team.id);
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
                    {/* Team Logo */}
                    <TeamLogo team={team} size="w-8 h-8" />
                    
                    {/* Team Name - Mobile Optimized */}
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors">
                        {team.name}
                      </div>
                      {/* Mobile: Country below team name */}
                      <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-500">
                        <span className="text-base">{getCountryFlag(team.country || team.region)}</span>
                        <span>{getCountryName(team.country || team.region)}</span>
                      </div>
                    </div>
                    
                  </div>

                  {/* Right: ELO Rating & Division */}
                  <div className="text-right">
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {team.rating || 1000}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

export default RankingsPage;