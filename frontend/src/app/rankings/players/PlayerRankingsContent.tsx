// src/app/rankings/players/PlayerRankingsContent.tsx - Complete Player Rankings
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getCountryFlag } from '@/utils/imageUtils';

interface PlayerRanking {
  id: number;
  username: string;
  real_name: string;
  avatar: string;
  role: string;
  main_hero: string;
  country: string;
  region: string;
  team: {
    name: string;
    short_name: string;
    logo: string;
  } | null;
  ranking: {
    global_rank: number;
    rating: number;
    peak_rating: number;
    rank: string;
    division: string | null;
    full_rank: string;
    rank_image: string;
    points_in_division: number;
    points_to_next: number;
  };
  competitive_stats: {
    matches_played: number;
    wins: number;
    losses: number;
    win_rate: number;
    current_win_streak: number;
    best_win_streak: number;
  };
}

const ROLES = [
  { id: 'all', name: 'All Roles', icon: '🎮' },
  { id: 'vanguard', name: 'Vanguard', icon: '🛡️' },
  { id: 'duelist', name: 'Duelist', icon: '⚔️' },
  { id: 'strategist', name: 'Strategist', icon: '🎯' }
];

const REGIONS = [
  { id: 'all', name: 'All Regions', flag: '🌍' },
  { id: 'na', name: 'North America', flag: '🇺🇸' },
  { id: 'eu', name: 'Europe', flag: '🇪🇺' },
  { id: 'asia', name: 'Asia', flag: '🌏' },
  { id: 'china', name: 'China', flag: '🇨🇳' },
  { id: 'oce', name: 'Oceania', flag: '🇦🇺' }
];

const SORT_OPTIONS = [
  { id: 'rating', name: 'Rating' },
  { id: 'wins', name: 'Wins' },
  { id: 'winrate', name: 'Win Rate' },
  { id: 'matches', name: 'Matches Played' }
];

export default function PlayerRankingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [players, setPlayers] = useState<PlayerRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  
  const activeRole = searchParams.get('role') || 'all';
  const activeRegion = searchParams.get('region') || 'all';
  const activeSort = searchParams.get('sort') || 'rating';
  const activePage = parseInt(searchParams.get('page') || '1');
  
  // Enhanced mock data with Marvel Rivals specifics
  const mockPlayers: PlayerRanking[] = useMemo(() => [
    {
      id: 1,
      username: 'IronDominator',
      real_name: 'Alex Chen',
      avatar: '/placeholder.png',
      role: 'duelist',
      main_hero: 'Iron Man',
      country: 'United States',
      region: 'NA',
      team: {
        name: 'Alpha Esports',
        short_name: 'ALP',
        logo: '/teams/alpha-logo.png'
      },
      ranking: {
        global_rank: 1,
        rating: 5200,
        peak_rating: 5350,
        rank: 'one_above_all',
        division: null,
        full_rank: 'One Above All',
        rank_image: '/images/ranks/one_above_all.png',
        points_in_division: 5200,
        points_to_next: 0
      },
      competitive_stats: {
        matches_played: 450,
        wins: 387,
        losses: 63,
        win_rate: 86.0,
        current_win_streak: 12,
        best_win_streak: 28
      }
    },
    {
      id: 2,
      username: 'StormMaster',
      real_name: 'Sarah Johnson',
      avatar: '/placeholder.png',
      role: 'strategist',
      main_hero: 'Storm',
      country: 'Canada',
      region: 'NA',
      team: {
        name: 'Nexus Gaming',
        short_name: 'NXS',
        logo: '/teams/nexus-logo.png'
      },
      ranking: {
        global_rank: 2,
        rating: 4850,
        peak_rating: 4920,
        rank: 'eternity',
        division: null,
        full_rank: 'Eternity',
        rank_image: '/images/ranks/eternity.png',
        points_in_division: 4850,
        points_to_next: 150
      },
      competitive_stats: {
        matches_played: 320,
        wins: 261,
        losses: 59,
        win_rate: 81.6,
        current_win_streak: 7,
        best_win_streak: 19
      }
    },
    {
      id: 3,
      username: 'WebCrawler',
      real_name: 'Marcus Kim',
      avatar: '/placeholder.png',
      role: 'duelist',
      main_hero: 'Spider-Man',
      country: 'South Korea',
      region: 'Asia',
      team: {
        name: 'Phoenix Squadron',
        short_name: 'PHX',
        logo: '/teams/phoenix-logo.png'
      },
      ranking: {
        global_rank: 3,
        rating: 4650,
        peak_rating: 4720,
        rank: 'eternity',
        division: null,
        full_rank: 'Eternity',
        rank_image: '/images/ranks/eternity.png',
        points_in_division: 4650,
        points_to_next: 350
      },
      competitive_stats: {
        matches_played: 280,
        wins: 215,
        losses: 65,
        win_rate: 76.8,
        current_win_streak: 3,
        best_win_streak: 15
      }
    },
    {
      id: 4,
      username: 'ShieldBearer',
      real_name: 'Emily Davis',
      avatar: '/placeholder.png',
      role: 'vanguard',
      main_hero: 'Captain America',
      country: 'United Kingdom',
      region: 'EU',
      team: {
        name: 'Titan Force',
        short_name: 'TFR',
        logo: '/teams/titan-logo.png'
      },
      ranking: {
        global_rank: 4,
        rating: 4100,
        peak_rating: 4200,
        rank: 'celestial',
        division: 'I',
        full_rank: 'Celestial I',
        rank_image: '/images/ranks/celestial_I.png',
        points_in_division: 400,
        points_to_next: 500
      },
      competitive_stats: {
        matches_played: 380,
        wins: 285,
        losses: 95,
        win_rate: 75.0,
        current_win_streak: 5,
        best_win_streak: 22
      }
    },
    {
      id: 5,
      username: 'ThunderGod',
      real_name: 'Lars Andersson',
      avatar: '/placeholder.png',
      role: 'vanguard',
      main_hero: 'Thor',
      country: 'Sweden',
      region: 'EU',
      team: {
        name: 'Vanguard Elite',
        short_name: 'VGE',
        logo: '/teams/vanguard-logo.png'
      },
      ranking: {
        global_rank: 5,
        rating: 3950,
        peak_rating: 4050,
        rank: 'celestial',
        division: 'II',
        full_rank: 'Celestial II',
        rank_image: '/images/ranks/celestial_II.png',
        points_in_division: 250,
        points_to_next: 150
      },
      competitive_stats: {
        matches_played: 290,
        wins: 210,
        losses: 80,
        win_rate: 72.4,
        current_win_streak: 1,
        best_win_streak: 11
      }
    },
    {
      id: 6,
      username: 'MysticArts',
      real_name: 'David Zhang',
      avatar: '/placeholder.png',
      role: 'strategist',
      main_hero: 'Doctor Strange',
      country: 'China',
      region: 'Asia',
      team: null,
      ranking: {
        global_rank: 6,
        rating: 3800,
        peak_rating: 3850,
        rank: 'celestial',
        division: 'III',
        full_rank: 'Celestial III',
        rank_image: '/images/ranks/celestial_III.png',
        points_in_division: 100,
        points_to_next: 200
      },
      competitive_stats: {
        matches_played: 195,
        wins: 138,
        losses: 57,
        win_rate: 70.8,
        current_win_streak: 8,
        best_win_streak: 13
      }
    },
    {
      id: 7,
      username: 'HulkSmash',
      real_name: 'Bruno Silva',
      avatar: '/placeholder.png',
      role: 'vanguard',
      main_hero: 'Hulk',
      country: 'Brazil',
      region: 'NA',
      team: {
        name: 'Storm Riders',
        short_name: 'STM',
        logo: '/teams/storm-logo.png'
      },
      ranking: {
        global_rank: 7,
        rating: 3200,
        peak_rating: 3400,
        rank: 'grandmaster',
        division: 'I',
        full_rank: 'Grandmaster I',
        rank_image: '/images/ranks/grandmaster_I.png',
        points_in_division: 400,
        points_to_next: 500
      },
      competitive_stats: {
        matches_played: 310,
        wins: 205,
        losses: 105,
        win_rate: 66.1,
        current_win_streak: 2,
        best_win_streak: 9
      }
    },
    {
      id: 8,
      username: 'QuantumLeap',
      real_name: 'Jake Thompson',
      avatar: '/placeholder.png',
      role: 'duelist',
      main_hero: 'Star-Lord',
      country: 'Australia',
      region: 'OCE',
      team: {
        name: 'Quantum Shift',
        short_name: 'QTM',
        logo: '/teams/quantum-logo.png'
      },
      ranking: {
        global_rank: 8,
        rating: 2900,
        peak_rating: 3100,
        rank: 'grandmaster',
        division: 'II',
        full_rank: 'Grandmaster II',
        rank_image: '/images/ranks/grandmaster_II.png',
        points_in_division: 100,
        points_to_next: 200
      },
      competitive_stats: {
        matches_played: 250,
        wins: 158,
        losses: 92,
        win_rate: 63.2,
        current_win_streak: 0,
        best_win_streak: 7
      }
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
          role: activeRole,
          region: activeRegion,
          sort: activeSort,
          search: searchQuery,
          page: activePage.toString()
        });
        
        const res = await fetch(`/api/rankings?${params.toString()}`, {
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const response = await res.json();
          const playersData = response.data || [];
          setPlayers(playersData);
          
          // Update pagination info
          if (response.pagination) {
            setCurrentPage(response.pagination.current_page);
            setTotalPages(response.pagination.last_page);
            setTotalPlayers(response.pagination.total);
          }
        } else {
          throw new Error(`HTTP ${res.status}: Failed to fetch player rankings`);
        }
      } catch (err) {
        console.warn('API failed, using mock data:', err);
        
        // Filter and sort mock data
        let filteredPlayers = mockPlayers;
        
        // Filter by role
        if (activeRole !== 'all') {
          filteredPlayers = filteredPlayers.filter(player => 
            player.role === activeRole
          );
        }
        
        // Filter by region
        if (activeRegion !== 'all') {
          const regionMap: Record<string, string[]> = {
            'na': ['NA', 'US', 'CA', 'MX', 'BR'],
            'eu': ['EU', 'UK', 'DE', 'FR', 'SE', 'ES'],
            'asia': ['Asia', 'KR', 'JP', 'TH', 'VN'],
            'china': ['China', 'CN'],
            'oce': ['OCE', 'AU', 'NZ']
          };
          
          const regionCodes = regionMap[activeRegion] || [];
          filteredPlayers = filteredPlayers.filter(player => 
            regionCodes.includes(player.region) || regionCodes.includes(player.country)
          );
        }
        
        // Apply search filter
        if (searchQuery) {
          filteredPlayers = filteredPlayers.filter(player => 
            player.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            player.real_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (player.team?.name.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }
        
        // Sort players
        switch (activeSort) {
          case 'wins':
            filteredPlayers.sort((a, b) => b.competitive_stats.wins - a.competitive_stats.wins);
            break;
          case 'winrate':
            filteredPlayers.sort((a, b) => b.competitive_stats.win_rate - a.competitive_stats.win_rate);
            break;
          case 'matches':
            filteredPlayers.sort((a, b) => b.competitive_stats.matches_played - a.competitive_stats.matches_played);
            break;
          default:
            filteredPlayers.sort((a, b) => b.ranking.rating - a.ranking.rating);
        }
        
        // Re-rank based on filtered results
        filteredPlayers = filteredPlayers.map((player, index) => ({
          ...player,
          ranking: {
            ...player.ranking,
            global_rank: index + 1
          }
        }));
        
        setPlayers(filteredPlayers);
        
        if (filteredPlayers.length === 0) {
          setError('No players found with current filters');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchRankings();
  }, [activeRole, activeRegion, activeSort, searchQuery, activePage, mockPlayers]);
  
  const handleFilterChange = (type: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(type, value);
    params.set('page', '1'); // Reset to first page when filtering
    router.push(`/rankings/players?${params.toString()}`);
  };
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/rankings/players?${params.toString()}`);
  };
  
  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      'one_above_all': 'text-purple-400',
      'eternity': 'text-pink-400',
      'celestial': 'text-blue-400',
      'grandmaster': 'text-red-400',
      'diamond': 'text-cyan-400',
      'platinum': 'text-emerald-400',
      'gold': 'text-yellow-400',
      'silver': 'text-gray-400',
      'bronze': 'text-orange-400'
    };
    return colors[rank] || 'text-gray-400';
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
  
  if (error && players.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-[#1a242d] border border-[#fa4454] p-8 text-center rounded">
          <div className="text-[#fa4454] text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-bold mb-2">Unable to Load Player Rankings</h3>
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
  
  return (
    <div className="container mx-auto py-6">
      {/* Tab Navigation */}
      <div className="mb-6 bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
        <div className="flex overflow-x-auto">
          {ROLES.map(role => (
            <button
              key={role.id}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
                activeRole === role.id
                  ? 'text-white'
                  : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
              }`}
              onClick={() => handleFilterChange('role', role.id)}
            >
              <span className="mr-2">{role.icon}</span>
              {role.name}
              {activeRole === role.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fa4454]"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
        {/* Search */}
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-[#1a242d] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none"
          />
        </div>
        
        {/* Region Filter */}
        <select
          value={activeRegion}
          onChange={(e) => handleFilterChange('region', e.target.value)}
          className="px-4 py-2 bg-[#1a242d] border border-[#2b3d4d] rounded text-white focus:border-[#fa4454] focus:outline-none"
        >
          {REGIONS.map(region => (
            <option key={region.id} value={region.id}>
              {region.flag} {region.name}
            </option>
          ))}
        </select>
        
        {/* Sort Filter */}
        <select
          value={activeSort}
          onChange={(e) => handleFilterChange('sort', e.target.value)}
          className="px-4 py-2 bg-[#1a242d] border border-[#2b3d4d] rounded text-white focus:border-[#fa4454] focus:outline-none"
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.id} value={option.id}>
              Sort by {option.name}
            </option>
          ))}
        </select>
      </div>
      
      {/* Player Rankings Table */}
      <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 text-xs text-[#768894] font-medium uppercase tracking-wider bg-[#11161d] py-3 px-4">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4 md:col-span-3">Player</div>
          <div className="col-span-2 text-center hidden md:block">Team</div>
          <div className="col-span-2 text-center hidden md:block">Role</div>
          <div className="col-span-2 text-center">Rating</div>
          <div className="col-span-3 md:col-span-2 text-center">Rank</div>
        </div>
        
        {/* Table Rows */}
        {players.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-[#768894] text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">No Players Found</h3>
            <p className="text-[#768894] mb-4">
              No players match your current filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                handleFilterChange('role', 'all');
                handleFilterChange('region', 'all');
                handleFilterChange('sort', 'rating');
              }}
              className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#2b3d4d]">
            {players.map(player => (
              <Link
                key={player.id}
                href={`/players/${player.username.toLowerCase().replace(/\s+/g, '-')}`}
                className="grid grid-cols-12 items-center py-3 px-4 hover:bg-[#0f1923] transition-colors group"
              >
                {/* Rank Column */}
                <div className="col-span-1 text-center">
                  <div className="font-bold text-lg text-white">{player.ranking.global_rank}</div>
                </div>
                
                {/* Player Column */}
                <div className="col-span-4 md:col-span-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 relative mr-3 flex-shrink-0">
                      <Image
                        src={player.avatar}
                        alt={player.username}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.png';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-white group-hover:text-[#fa4454] transition-colors">
                        {player.username}
                      </div>
                      <div className="text-xs text-[#768894] mt-0.5">
                        {player.real_name}
                      </div>
                      {/* Mobile: Show team and role */}
                      <div className="text-xs text-[#768894] mt-0.5 md:hidden">
                        {player.team ? player.team.short_name : 'Free Agent'} • {player.role}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Team Column - Desktop only */}
                <div className="col-span-2 text-center hidden md:block">
                  <div className="text-sm">
                    {player.team ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Image
                          src={player.team.logo}
                          alt={player.team.name}
                          width={20}
                          height={20}
                          className="rounded object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.png';
                          }}
                        />
                        <span className="text-white">{player.team.short_name}</span>
                      </div>
                    ) : (
                      <span className="text-[#768894]">Free Agent</span>
                    )}
                  </div>
                </div>
                
                {/* Role Column - Desktop only */}
                <div className="col-span-2 text-center hidden md:block">
                  <div className="text-sm">
                    <span className="capitalize text-[#768894]">{player.role}</span>
                    <div className="text-xs text-[#768894] mt-0.5">
                      {player.main_hero}
                    </div>
                  </div>
                </div>
                
                {/* Rating Column */}
                <div className="col-span-2 text-center">
                  <div className="font-bold text-white text-lg">
                    {player.ranking.rating}
                  </div>
                  <div className="text-xs text-[#768894]">
                    Peak: {player.ranking.peak_rating}
                  </div>
                </div>
                
                {/* Rank Column */}
                <div className="col-span-3 md:col-span-2 text-center">
                  <div className={`font-bold ${getRankColor(player.ranking.rank)}`}>
                    {player.ranking.full_rank}
                  </div>
                  <div className="text-xs text-[#768894] mt-0.5">
                    {player.competitive_stats.win_rate}% WR ({player.competitive_stats.wins}W/{player.competitive_stats.losses}L)
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer Stats */}
      {players.length > 0 && (
        <div className="mt-6 flex flex-col lg:flex-row justify-between">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-white font-medium mb-3">Statistics</h3>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center">
                <span className="text-purple-400 text-sm mr-2">👑</span>
                <span className="text-[#768894] text-sm">One Above All: {players.filter(p => p.ranking.rank === 'one_above_all').length}</span>
              </div>
              <div className="flex items-center">
                <span className="text-pink-400 text-sm mr-2">🌟</span>
                <span className="text-[#768894] text-sm">Eternity: {players.filter(p => p.ranking.rank === 'eternity').length}</span>
              </div>
              <div className="flex items-center">
                <span className="text-blue-400 text-sm mr-2">🔹</span>
                <span className="text-[#768894] text-sm">Celestial+: {players.filter(p => ['celestial', 'eternity', 'one_above_all'].includes(p.ranking.rank)).length}</span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-[#768894] text-sm">
              Showing {players.length} players • Rankings updated: <span className="text-white font-medium">Live</span>
            </p>
            <p className="text-[#768894] text-xs mt-1">
              ELO ratings based on competitive match performance and consistency
            </p>
          </div>
        </div>
      )}
    </div>
  );
}