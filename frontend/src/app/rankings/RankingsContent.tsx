// src/app/rankings/RankingsContent.tsx - Complete VLR.gg Quality Rankings
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCountryFlag } from '@/utils/imageUtils';

interface TeamRanking {
  id: number;
  name: string;
  logo: string;
  rank: number;
  points: number;
  region: string;
  country?: string;
  recentResults: Array<'W' | 'L' | '-'>;
  change?: number;
  playerNames?: string[];
  lastMatchDate?: string;
  winRate?: number;
  earnings?: number;
  wins?: number;
  losses?: number;
}

export default function RankingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [teams, setTeams] = useState<TeamRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTeams, setTotalTeams] = useState(0);
  
  const activeRegion = searchParams.get('region') || 'global';
  const activeSort = searchParams.get('sort') || 'rating';
  const activePage = parseInt(searchParams.get('page') || '1');
  
  // Regions matching VLR.gg exactly
  const regions = [
    { id: 'global', name: 'Global', flag: '🌍' },
    { id: 'americas', name: 'Americas', flag: '🌎' },
    { id: 'emea', name: 'EMEA', flag: '🌍' },
    { id: 'apac', name: 'Asia-Pacific', flag: '🌏' }
  ];

  const sortOptions = [
    { id: 'rating', name: 'Rating' },
    { id: 'earnings', name: 'Earnings' },
    { id: 'wins', name: 'Wins' },
    { id: 'winrate', name: 'Win Rate' }
  ];

  // Enhanced mock data
  const mockTeams: TeamRanking[] = useMemo(() => [
    {
      id: 1,
      name: 'Alpha Esports',
      logo: '/placeholder.png',
      rank: 1,
      points: 2650,
      region: 'Americas',
      country: 'United States',
      recentResults: ['W', 'W', 'W', 'L', 'W'],
      change: 2,
      playerNames: ['IronPlayer', 'CapMain', 'SpiderWeb', 'ThorHammer', 'HulkSmash'],
      lastMatchDate: '2 days ago',
      winRate: 84,
      earnings: 125000,
      wins: 42,
      losses: 8
    },
    {
      id: 2,
      name: 'Nexus Gaming',
      logo: '/placeholder.png',
      rank: 2,
      points: 2580,
      region: 'EMEA',
      country: 'United Kingdom',
      recentResults: ['W', 'W', 'L', 'W', 'W'],
      change: -1,
      playerNames: ['StormBreaker', 'WebSlinger', 'ShieldBearer', 'FrostGiant', 'QuantumHero'],
      lastMatchDate: '1 day ago',
      winRate: 78,
      earnings: 98000,
      wins: 39,
      losses: 11
    },
    {
      id: 3,
      name: 'Phoenix Squadron',
      logo: '/placeholder.png',
      rank: 3,
      points: 2490,
      region: 'Asia-Pacific',
      country: 'South Korea',
      recentResults: ['W', 'L', 'W', 'W', 'L'],
      change: 1,
      playerNames: ['DragonFist', 'MysticArts', 'TechWizard', 'CosmicPower', 'StarLord'],
      lastMatchDate: '3 days ago',
      winRate: 72,
      earnings: 87500,
      wins: 36,
      losses: 14
    },
    {
      id: 4,
      name: 'Titan Force',
      logo: '/placeholder.png',
      rank: 4,
      points: 2420,
      region: 'Americas',
      country: 'Canada',
      recentResults: ['L', 'W', 'W', 'W', 'W'],
      change: 3,
      playerNames: ['TitanSlayer', 'PowerCosmic', 'InfiniteGem', 'TimeStone', 'RealityBender'],
      lastMatchDate: '1 day ago',
      winRate: 69,
      earnings: 75000,
      wins: 34,
      losses: 15
    },
    {
      id: 5,
      name: 'Vanguard Elite',
      logo: '/placeholder.png',
      rank: 5,
      points: 2350,
      region: 'EMEA',
      country: 'Germany',
      recentResults: ['W', 'L', 'L', 'W', 'W'],
      change: -2,
      playerNames: ['VanguardLeader', 'TacticalMind', 'StrategyKing', 'TeamPlayer', 'SupportGod'],
      lastMatchDate: '4 days ago',
      winRate: 65,
      earnings: 62000,
      wins: 32,
      losses: 17
    },
    {
      id: 6,
      name: 'Cosmic Guardians',
      logo: '/placeholder.png',
      rank: 6,
      points: 2280,
      region: 'Asia-Pacific',
      country: 'Japan',
      recentResults: ['W', 'W', 'L', 'L', 'W'],
      change: 0,
      playerNames: ['GalaxyDefender', 'StarProtector', 'SpaceWarrior', 'NebulaStrike', 'RocketFuel'],
      lastMatchDate: '2 days ago',
      winRate: 63,
      earnings: 58000,
      wins: 30,
      losses: 18
    },
    {
      id: 7,
      name: 'Storm Riders',
      logo: '/placeholder.png',
      rank: 7,
      points: 2210,
      region: 'Americas',
      country: 'Brazil',
      recentResults: ['L', 'W', 'W', 'L', 'W'],
      change: 1,
      playerNames: ['StormCaller', 'LightningBolt', 'ThunderStrike', 'WeatherMaster', 'TempestFury'],
      lastMatchDate: '5 days ago',
      winRate: 58,
      earnings: 45000,
      wins: 29,
      losses: 21
    },
    {
      id: 8,
      name: 'Shadow Legion',
      logo: '/placeholder.png',
      rank: 8,
      points: 2140,
      region: 'EMEA',
      country: 'France',
      recentResults: ['W', 'L', 'L', 'W', 'L'],
      change: -1,
      playerNames: ['ShadowStrike', 'DarkForce', 'NightCrawler', 'StealthMaster', 'InvisibleMan'],
      lastMatchDate: '3 days ago',
      winRate: 55,
      earnings: 38000,
      wins: 27,
      losses: 22
    },
    {
      id: 9,
      name: 'Quantum Shift',
      logo: '/placeholder.png',
      rank: 9,
      points: 2070,
      region: 'Asia-Pacific',
      country: 'Australia',
      recentResults: ['L', 'L', 'W', 'W', 'L'],
      change: -3,
      playerNames: ['QuantumLeap', 'DimensionWarp', 'PhaseShift', 'TimeBender', 'SpaceRift'],
      lastMatchDate: '6 days ago',
      winRate: 52,
      earnings: 32000,
      wins: 25,
      losses: 23
    },
    {
      id: 10,
      name: 'Iron Hawks',
      logo: '/placeholder.png',
      rank: 10,
      points: 2010,
      region: 'Americas',
      country: 'Mexico',
      recentResults: ['W', 'L', 'L', 'L', 'W'],
      change: 2,
      playerNames: ['IronWing', 'SkyHunter', 'FlightPath', 'AerialStrike', 'WindRider'],
      lastMatchDate: '4 days ago',
      winRate: 48,
      earnings: 28000,
      wins: 24,
      losses: 26
    }
  ], []);
  
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        
        const params = new URLSearchParams({
          region: activeRegion,
          sort: activeSort,
          search: searchQuery,
          page: activePage.toString()
        });
        
        const res = await fetch(`/api/team-rankings?${params.toString()}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const response = await res.json();
          const teamsData = response.data || response.rankings || response.teamRankings || [];
          setTeams(teamsData);
          
          // Update pagination info
          if (response.pagination) {
            setCurrentPage(response.pagination.current_page);
            setTotalPages(response.pagination.last_page);
            setTotalTeams(response.pagination.total);
          }
        } else {
          throw new Error(`HTTP ${res.status}: Failed to fetch rankings`);
        }
      } catch (err) {
        console.warn('API failed, using mock data:', err);
        
        // Filter and sort mock data
        let filteredTeams = mockTeams;
        
        // Filter by region
        if (activeRegion !== 'global') {
          const regionMap: Record<string, string> = {
            'americas': 'Americas',
            'emea': 'EMEA',
            'apac': 'Asia-Pacific'
          };
          filteredTeams = filteredTeams.filter(team => 
            team.region === regionMap[activeRegion]
          );
        }
        
        // Apply search filter
        if (searchQuery) {
          filteredTeams = filteredTeams.filter(team =>
            team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (team.playerNames && team.playerNames.some(name => 
              name.toLowerCase().includes(searchQuery.toLowerCase())
            ))
          );
        }
        
        // Apply sorting
        switch (activeSort) {
          case 'earnings':
            filteredTeams.sort((a, b) => (b.earnings || 0) - (a.earnings || 0));
            break;
          case 'wins':
            filteredTeams.sort((a, b) => (b.wins || 0) - (a.wins || 0));
            break;
          case 'winrate':
            filteredTeams.sort((a, b) => (b.winRate || 0) - (a.winRate || 0));
            break;
          default:
            filteredTeams.sort((a, b) => b.points - a.points);
        }
        
        // Re-rank based on filtered/sorted results
        filteredTeams = filteredTeams.map((team, index) => ({
          ...team,
          rank: index + 1
        }));
        
        setTeams(filteredTeams);
        
        if (filteredTeams.length === 0) {
          setError('No teams found with current filters');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankings();
  }, [activeRegion, activeSort, searchQuery, activePage, mockTeams]);
  
  const handleRegionChange = (region: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('region', region);
    router.push(`/rankings?${params.toString()}`);
  };

  const handleSortChange = (sort: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', sort);
    params.set('page', '1'); // Reset to first page when sorting
    router.push(`/rankings?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/rankings?${params.toString()}`);
  };
  
  const getRegionCode = (region: string): string => {
    const regionMap: Record<string, string> = {
      'Americas': 'NA',
      'EMEA': 'EU',
      'Asia-Pacific': 'APAC',
      'Global': 'GL'
    };
    return regionMap[region] || region.substring(0, 3).toUpperCase();
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-pulse">
            <div className="w-12 h-12 border-4 border-[#fa4454] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error && teams.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-[#1a242d] border border-[#fa4454] p-8 text-center rounded">
          <div className="text-[#fa4454] text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Unable to Load Rankings</h3>
          <p className="text-[#768894] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  if (teams.length === 0) {
    return (
      <div className="container mx-auto py-6">
        {/* Region Filter Tabs */}
        <div className="mb-6 bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
          <div className="flex overflow-x-auto">
            {regions.map(region => (
              <button
                key={region.id}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
                  activeRegion === region.id
                    ? 'text-white'
                    : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
                }`}
                onClick={() => handleRegionChange(region.id)}
              >
                <span className="mr-2">{region.flag}</span>
                {region.name}
                {activeRegion === region.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fa4454]"></div>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-12 text-center">
          <div className="text-[#768894] text-5xl mb-4">🏆</div>
          <h3 className="text-xl font-bold mb-2">No Rankings Available</h3>
          <p className="text-[#768894] mb-4">
            No team rankings found for this region.
          </p>
          <button
            onClick={() => handleRegionChange('global')}
            className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded font-medium transition-colors"
          >
            View Global Rankings
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      {/* Region Filter Tabs */}
      <div className="mb-6 bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
        <div className="flex overflow-x-auto">
          {regions.map(region => (
            <button
              key={region.id}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
                activeRegion === region.id
                  ? 'text-white'
                  : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
              }`}
              onClick={() => handleRegionChange(region.id)}
            >
              <span className="mr-2">{region.flag}</span>
              {region.name}
              {activeRegion === region.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fa4454]"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Sort Controls */}
      <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search teams or players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a242d] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none"
          />
        </div>
        
        {/* Sort Dropdown */}
        <select
          value={activeSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="px-4 py-2 bg-[#1a242d] border border-[#2b3d4d] rounded text-white focus:border-[#fa4454] focus:outline-none"
        >
          {sortOptions.map(option => (
            <option key={option.id} value={option.id}>
              Sort by {option.name}
            </option>
          ))}
        </select>
        
        {/* Clear Filters Button */}
        {(searchQuery || activeSort !== 'rating' || activeRegion !== 'global') && (
          <button
            onClick={() => {
              setSearchQuery('');
              handleRegionChange('global');
              handleSortChange('rating');
            }}
            className="px-4 py-2 bg-[#2b3d4d] hover:bg-[#394755] text-white rounded transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
      
      {/* Rankings Table */}
      <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-xs text-[#768894] font-medium uppercase tracking-wider bg-[#11161d] py-3 px-4">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-5 md:col-span-6">Team</div>
          <div className="col-span-2 text-center hidden md:block">Region</div>
          <div className="col-span-3 md:col-span-2 text-center">Points</div>
          <div className="col-span-3 md:col-span-1 text-center">Form</div>
        </div>
        
        {/* Table Rows */}
        <div className="divide-y divide-[#2b3d4d]">
          {teams.map(team => (
            <Link
              key={team.id}
              href={`/teams/${team.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="grid grid-cols-12 items-center py-3 px-4 hover:bg-[#0f1923] transition-colors group"
            >
              {/* Rank Column */}
              <div className="col-span-1 text-center">
                <div className="font-bold text-lg text-white">{team.rank}</div>
                {team.change !== undefined && (
                  <div className="text-xs">
                    {team.change > 0 ? (
                      <span className="text-green-400">↑{team.change}</span>
                    ) : team.change < 0 ? (
                      <span className="text-red-400">↓{Math.abs(team.change)}</span>
                    ) : (
                      <span className="text-[#768894]">-</span>
                    )}
                  </div>
                )}
              </div>
              
              {/* Team Column */}
              <div className="col-span-5 md:col-span-6">
                <div className="flex items-center">
                  <div className="w-10 h-10 relative mr-3 flex-shrink-0">
                    <Image
                      src={team.logo}
                      alt={team.name}
                      width={40}
                      height={40}
                      className="rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.png';
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white group-hover:text-[#fa4454] transition-colors">
                      {team.name}
                    </div>
                    {team.playerNames && (
                      <div className="text-xs text-[#768894] mt-0.5 hidden md:block truncate">
                        {team.playerNames.slice(0, 3).join(', ')}{team.playerNames.length > 3 ? '...' : ''}
                      </div>
                    )}
                    {/* Mobile region display */}
                    <div className="text-xs text-[#768894] mt-0.5 md:hidden">
                      {team.country ? getCountryFlag(team.country) : getRegionCode(team.region)} {team.country || team.region} • {team.winRate}% WR
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Region Column - Desktop only */}
              <div className="col-span-2 text-center hidden md:block">
                <div className="text-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg">{team.country ? getCountryFlag(team.country) : getRegionCode(team.region)}</span>
                    <span className="text-[#768894]">{team.country || team.region}</span>
                  </div>
                  {team.winRate && (
                    <div className="text-xs text-[#768894] mt-0.5">
                      {team.winRate}% WR
                    </div>
                  )}
                </div>
              </div>
              
              {/* Points Column */}
              <div className="col-span-3 md:col-span-2 text-center">
                <div className="font-bold text-white text-lg">
                  {team.points.toLocaleString()}
                </div>
                {team.lastMatchDate && (
                  <div className="text-xs text-[#768894]">
                    {team.lastMatchDate}
                  </div>
                )}
              </div>
              
              {/* Form Column */}
              <div className="col-span-3 md:col-span-1 flex justify-center space-x-1">
                {team.recentResults.map((result, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                      result === 'W' 
                        ? 'bg-green-600 text-white' 
                        : result === 'L' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-[#2b3d4d] text-[#768894]'
                    }`}
                  >
                    {result}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Legend and Footer */}
      <div className="mt-6 flex flex-col lg:flex-row justify-between">
        <div className="mb-4 lg:mb-0">
          <h3 className="text-white font-medium mb-3">Legend</h3>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white text-xs font-bold mr-2">W</div>
              <span className="text-[#768894] text-sm">Win</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-white text-xs font-bold mr-2">L</div>
              <span className="text-[#768894] text-sm">Loss</span>
            </div>
            <div className="flex items-center">
              <div className="w-6 h-6 bg-[#2b3d4d] rounded flex items-center justify-center text-[#768894] text-xs mr-2">-</div>
              <span className="text-[#768894] text-sm">No recent match</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-400 text-sm mr-2">↑</span>
              <span className="text-[#768894] text-sm">Rank up</span>
            </div>
            <div className="flex items-center">
              <span className="text-red-400 text-sm mr-2">↓</span>
              <span className="text-[#768894] text-sm">Rank down</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-[#768894] text-sm">
            Rankings updated: <span className="text-white font-medium">Live</span>
          </p>
          <p className="text-[#768894] text-xs mt-1">
            Points based on tournament performance, match results, and consistency over time.
          </p>
          <p className="text-[#768894] text-xs">
            Showing {teams.length} teams{totalTeams > 0 && ` of ${totalTeams} total`} • Form shows last 5 matches
          </p>
        </div>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                currentPage <= 1
                  ? 'bg-[#2b3d4d] text-[#768894] cursor-not-allowed'
                  : 'bg-[#1a242d] border border-[#2b3d4d] text-white hover:bg-[#2b3d4d]'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-10 h-10 rounded font-medium transition-colors ${
                      currentPage === pageNum
                        ? 'bg-[#fa4454] text-white'
                        : 'bg-[#1a242d] border border-[#2b3d4d] text-white hover:bg-[#2b3d4d]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
              className={`px-4 py-2 rounded font-medium transition-colors ${
                currentPage >= totalPages
                  ? 'bg-[#2b3d4d] text-[#768894] cursor-not-allowed'
                  : 'bg-[#1a242d] border border-[#2b3d4d] text-white hover:bg-[#2b3d4d]'
              }`}
            >
              Next
            </button>
          </div>
          
          <div className="text-[#768894] text-sm">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
