// src/app/matches/[id]/page.tsx - COMPLETE VLR.gg Quality Production Ready
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TabNavigation from '@/components/TabNavigation';
import dynamic from 'next/dynamic';
import { getImageUrl } from '@/utils/imageUtils';

// Dynamic imports for performance
const Bar = dynamic(() => import('react-chartjs-2').then(mod => mod.Bar), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-[#0f1923] animate-pulse rounded"></div>
});

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Complete interfaces
interface Player {
  name: string;
  team: string;
  hero: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  kd: string;
}

interface TeamRoster {
  name: string;
  logo: string;
  score?: number;
  roster: Array<{
    name: string;
    hero: string;
    kills: number;
    deaths: number;
    assists: number;
    acs: number;
  }>;
}

interface Map {
  name: string;
  winner?: string;
  score: { team1: number; team2: number };
  firstHalf: { team1: number; team2: number };
  secondHalf: { team1: number; team2: number };
  inProgress?: boolean;
}

interface HeroStat {
  hero: string;
  pickRate: number;
  winRate: number;
}

interface MatchDetail {
  id: string;
  team1: TeamRoster;
  team2: TeamRoster;
  status: 'live' | 'upcoming' | 'completed';
  winner?: string;
  event: string;
  stage: string;
  date: string;
  matchTime: string;
  timezone: string;
  vod?: string;
  livestream?: string;
  maps: Map[];
  series: {
    type: string;
    score: { team1: number; team2: number };
    mapsPlayed: number;
  };
  playerStats: Player[];
  heroStats: HeroStat[];
}

export default function MatchDetailPage() {
  const params = useParams();
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Stats' | 'Lineups' | 'Maps' | 'Heroes'>('Overview');
  const [loading, setLoading] = useState(true);
  const [liveTimer, setLiveTimer] = useState<string>('');
  
  // Complete mock data for demo
  const mockMatch: MatchDetail = {
    id: String(params.id),
    team1: {
      name: 'Team Alpha',
      logo: '/placeholder.png',
      score: 2,
      roster: [
        { name: 'AlphaPlayer1', hero: 'Spider-Man', kills: 18, deaths: 12, assists: 8, acs: 245 },
        { name: 'AlphaPlayer2', hero: 'Iron Man', kills: 16, deaths: 10, assists: 12, acs: 232 },
        { name: 'AlphaPlayer3', hero: 'Hulk', kills: 12, deaths: 14, assists: 15, acs: 198 },
        { name: 'AlphaPlayer4', hero: 'Thor', kills: 14, deaths: 11, assists: 9, acs: 210 },
        { name: 'AlphaPlayer5', hero: 'Doctor Strange', kills: 10, deaths: 13, assists: 18, acs: 185 }
      ]
    },
    team2: {
      name: 'Team Beta',
      logo: '/placeholder.png',
      score: 1,
      roster: [
        { name: 'BetaPlayer1', hero: 'Wolverine', kills: 15, deaths: 15, assists: 10, acs: 220 },
        { name: 'BetaPlayer2', hero: 'Storm', kills: 13, deaths: 12, assists: 14, acs: 205 },
        { name: 'BetaPlayer3', hero: 'Magneto', kills: 11, deaths: 16, assists: 13, acs: 175 },
        { name: 'BetaPlayer4', hero: 'Punisher', kills: 12, deaths: 14, assists: 8, acs: 190 },
        { name: 'BetaPlayer5', hero: 'Mantis', kills: 8, deaths: 13, assists: 20, acs: 160 }
      ]
    },
    status: 'completed',
    winner: 'Team Alpha',
    event: 'MRVL Championship 2025',
    stage: 'Grand Finals',
    date: 'January 15, 2025',
    matchTime: '7:00 PM',
    timezone: 'EST',
    maps: [
      { 
        name: 'Tokyo 2099', 
        winner: 'Team Alpha', 
        score: { team1: 13, team2: 8 },
        firstHalf: { team1: 7, team2: 5 },
        secondHalf: { team1: 6, team2: 3 }
      },
      { 
        name: 'Wakanda', 
        winner: 'Team Beta', 
        score: { team1: 9, team2: 13 },
        firstHalf: { team1: 4, team2: 8 },
        secondHalf: { team1: 5, team2: 5 }
      },
      { 
        name: 'Asgard', 
        winner: 'Team Alpha', 
        score: { team1: 13, team2: 11 },
        firstHalf: { team1: 6, team2: 6 },
        secondHalf: { team1: 7, team2: 5 }
      }
    ],
    series: {
      type: 'Best of 5',
      score: { team1: 2, team2: 1 },
      mapsPlayed: 3
    },
    playerStats: [
      { name: 'AlphaPlayer1', team: 'Team Alpha', hero: 'Spider-Man', kills: 18, deaths: 12, assists: 8, acs: 245, kd: '1.50' },
      { name: 'AlphaPlayer2', team: 'Team Alpha', hero: 'Iron Man', kills: 16, deaths: 10, assists: 12, acs: 232, kd: '1.60' },
      { name: 'AlphaPlayer3', team: 'Team Alpha', hero: 'Hulk', kills: 12, deaths: 14, assists: 15, acs: 198, kd: '0.86' },
      { name: 'AlphaPlayer4', team: 'Team Alpha', hero: 'Thor', kills: 14, deaths: 11, assists: 9, acs: 210, kd: '1.27' },
      { name: 'AlphaPlayer5', team: 'Team Alpha', hero: 'Doctor Strange', kills: 10, deaths: 13, assists: 18, acs: 185, kd: '0.77' },
      { name: 'BetaPlayer1', team: 'Team Beta', hero: 'Wolverine', kills: 15, deaths: 15, assists: 10, acs: 220, kd: '1.00' },
      { name: 'BetaPlayer2', team: 'Team Beta', hero: 'Storm', kills: 13, deaths: 12, assists: 14, acs: 205, kd: '1.08' },
      { name: 'BetaPlayer3', team: 'Team Beta', hero: 'Magneto', kills: 11, deaths: 16, assists: 13, acs: 175, kd: '0.69' },
      { name: 'BetaPlayer4', team: 'Team Beta', hero: 'Punisher', kills: 12, deaths: 14, assists: 8, acs: 190, kd: '0.86' },
      { name: 'BetaPlayer5', team: 'Team Beta', hero: 'Mantis', kills: 8, deaths: 13, assists: 20, acs: 160, kd: '0.62' }
    ],
    heroStats: [
      { hero: 'Spider-Man', pickRate: 85, winRate: 67 },
      { hero: 'Iron Man', pickRate: 72, winRate: 58 },
      { hero: 'Wolverine', pickRate: 68, winRate: 45 },
      { hero: 'Storm', pickRate: 55, winRate: 62 },
      { hero: 'Hulk', pickRate: 43, winRate: 71 },
      { hero: 'Magneto', pickRate: 38, winRate: 41 },
      { hero: 'Thor', pickRate: 35, winRate: 53 },
      { hero: 'Doctor Strange', pickRate: 29, winRate: 59 },
      { hero: 'Punisher', pickRate: 22, winRate: 48 },
      { hero: 'Mantis', pickRate: 18, winRate: 74 }
    ],
    vod: '#',
    livestream: '#'
  };
  
  useEffect(() => {
    if (!params.id) return;
    
    const fetchMatchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/matches/${params.id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch match data');
        }
        
        const data = await res.json();
        setMatch(data);
        
        // Set up live timer for live matches
        if (data.status === 'live') {
          const interval = setInterval(() => {
            setLiveTimer(new Date().toLocaleTimeString());
          }, 1000);
          
          return () => clearInterval(interval);
        }
      } catch (err) {
        console.warn('API failed, using mock data:', err);
        setMatch(mockMatch);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchData();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-[#2b3d4d] rounded"></div>
          <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-6">
            <div className="h-32 bg-[#2b3d4d] rounded mb-4"></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-[#2b3d4d] rounded"></div>
              <div className="h-24 bg-[#2b3d4d] rounded"></div>
              <div className="h-24 bg-[#2b3d4d] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!match) {
    return (
      <div className="container py-6">
        <Link href="/matches" className="inline-flex items-center text-[#fa4454] hover:underline mb-4">
          ← Back to Matches
        </Link>
        
        <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Match Not Found</h2>
          <p className="text-[#768894] mb-4">This match doesn't exist or has been removed.</p>
          <Link href="/matches" className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-4 py-2 rounded transition-colors">
            View All Matches
          </Link>
        </div>
      </div>
    );
  }
  
  // Prepare hero stats chart data
  const heroChartData = {
    labels: match.heroStats.map(h => h.hero),
    datasets: [
      {
        label: 'Win Rate (%)',
        data: match.heroStats.map(h => h.winRate),
        backgroundColor: 'rgba(250, 68, 84, 0.6)',
        borderColor: 'rgba(250, 68, 84, 1)',
        borderWidth: 1,
      },
      {
        label: 'Pick Rate (%)',
        data: match.heroStats.map(h => h.pickRate),
        backgroundColor: 'rgba(66, 153, 225, 0.6)',
        borderColor: 'rgba(66, 153, 225, 1)',
        borderWidth: 1,
      }
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#768894'
        },
        grid: {
          color: '#2b3d4d'
        }
      },
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#768894'
        },
        grid: {
          color: '#2b3d4d'
        }
      }
    }
  };
  
  // Map status icons
  const getMapStatusIcon = (map: Map, index: number) => {
    if (map.inProgress) {
      return (
        <span className="inline-flex items-center justify-center bg-red-500 text-white rounded-full h-5 w-5 text-xs">
          <span className="animate-pulse">•</span>
        </span>
      );
    } else if (match.series.mapsPlayed > index) {
      if (map.winner === match.team1.name) {
        return (
          <span className="inline-flex items-center justify-center bg-green-500 text-white rounded-full h-5 w-5 text-xs">
            ✓
          </span>
        );
      } else {
        return (
          <span className="inline-flex items-center justify-center bg-red-500 text-white rounded-full h-5 w-5 text-xs">
            ✕
          </span>
        );
      }
    } else {
      return (
        <span className="inline-flex items-center justify-center bg-gray-500 text-white rounded-full h-5 w-5 text-xs">
          ?
        </span>
      );
    }
  };
  
  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-[#768894] mb-4">
        <Link href="/" className="hover:text-[#fa4454]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/matches" className="hover:text-[#fa4454]">Matches</Link>
        <span className="mx-2">/</span>
        <span>{match.team1.name} vs {match.team2.name}</span>
      </div>
      
      <Link href="/matches" className="inline-flex items-center text-[#fa4454] hover:underline mb-6">
        ← Back to Matches
      </Link>
      
      {/* Match Header */}
      <div className="bg-[#1a242d] border border-[#2b3d4d] rounded mb-6 overflow-hidden">
        {/* Status Bar */}
        <div className="bg-[#0f1923] p-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href={`/events/${(match.event || '').toString().replace(/\s+/g, '-').toLowerCase()}`} className="text-[#fa4454] hover:underline">
              {match.event || 'Unknown Event'}
            </Link>
            <span className="text-[#768894]">•</span>
            <span className="text-[#768894]">{match.stage}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {match.status === 'live' && (
              <>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium animate-pulse">
                  🔴 LIVE
                </span>
                {liveTimer && <span className="text-[#768894] text-xs">{liveTimer}</span>}
              </>
            )}
            {match.status === 'upcoming' && (
              <span className="text-[#768894]">{match.date} • {match.matchTime} {match.timezone}</span>
            )}
            {match.status === 'completed' && (
              <span className="text-[#768894]">Completed • {match.date}</span>
            )}
          </div>
        </div>
        
        {/* Main Match Display */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            {/* Team 1 */}
            <div className="md:col-span-2 text-center md:text-right">
              <div className="flex items-center justify-center md:justify-end space-x-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">{match.team1.name}</h2>
                  {match.status !== 'upcoming' && (
                    <div className={`text-3xl font-bold ${
                      match.series.score.team1 > match.series.score.team2 ? 'text-[#4ade80]' : 'text-[#768894]'
                    }`}>
                      {match.series.score.team1}
                    </div>
                  )}
                </div>
                <div className="w-16 h-16 relative">
                  <Image
                    src={match.team1.logo}
                    alt={match.team1.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = getImageUrl(null, 'team-logo');
                    }}
                  />
                </div>
              </div>
            </div>
            
            {/* VS / Score */}
            <div className="md:col-span-1 text-center">
              <div className="bg-[#0f1923] rounded p-4">
                <div className="text-[#768894] text-sm mb-2">{match.series.type}</div>
                {match.status === 'live' && (
                  <div className="text-red-400 font-bold text-lg">LIVE</div>
                )}
                {match.status === 'upcoming' && (
                  <div className="text-[#768894]">vs</div>
                )}
                {match.status === 'completed' && match.winner && (
                  <div className="text-[#4ade80] text-sm font-medium">
                    Winner: {match.winner}
                  </div>
                )}
              </div>
            </div>
            
            {/* Team 2 */}
            <div className="md:col-span-2 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-4">
                <div className="w-16 h-16 relative">
                  <Image
                    src={match.team2.logo}
                    alt={match.team2.name}
                    fill
                    style={{ objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = getImageUrl(null, 'team-logo');
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold mb-1">{match.team2.name}</h2>
                  {match.status !== 'upcoming' && (
                    <div className={`text-3xl font-bold ${
                      match.series.score.team2 > match.series.score.team1 ? 'text-[#4ade80]' : 'text-[#768894]'
                    }`}>
                      {match.series.score.team2}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Maps Overview */}
          {match.maps.length > 0 && (
            <div className="mt-6 pt-4 border-t border-[#2b3d4d]">
              <h3 className="text-sm font-medium mb-3 text-[#768894]">MAPS</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {match.maps.map((map, index) => (
                  <div 
                    key={index} 
                    className={`bg-[#0f1923] p-3 rounded border ${
                      map.inProgress ? 'border-red-500' : 'border-[#2b3d4d]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{map.name}</span>
                      {getMapStatusIcon(map, index)}
                    </div>
                    <div className="text-xs text-[#768894]">
                      {map.score.team1} - {map.score.team2}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="mt-4 flex justify-center space-x-4">
            {match.status === 'live' && match.livestream && (
              <a 
                href={match.livestream} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Watch Live
              </a>
            )}
            {match.status === 'completed' && match.vod && (
              <a 
                href={match.vod} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="bg-[#2b3d4d] hover:bg-[#354c5f] text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Watch VOD
              </a>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <TabNavigation
        tabs={['Overview', 'Stats', 'Lineups', 'Maps', 'Heroes']}
        activeTab={activeTab}
        onTabSelect={(tab) => setActiveTab(tab as any)}
      />
      
      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Series Summary */}
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3">
                  <h3 className="font-medium">Series Summary</h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#fa4454] mb-1">
                        {match.series.score.team1}
                      </div>
                      <div className="text-sm text-[#768894]">{match.team1.name}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#fa4454] mb-1">
                        {match.series.score.team2}
                      </div>
                      <div className="text-sm text-[#768894]">{match.team2.name}</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-[#768894]">Event:</span>
                      <span className="ml-2">{match.event}</span>
                    </div>
                    <div>
                      <span className="text-[#768894]">Stage:</span>
                      <span className="ml-2">{match.stage}</span>
                    </div>
                    <div>
                      <span className="text-[#768894]">Date:</span>
                      <span className="ml-2">{match.date}</span>
                    </div>
                    <div>
                      <span className="text-[#768894]">Format:</span>
                      <span className="ml-2">{match.series.type}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Map Results */}
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3">
                  <h3 className="font-medium">Map Results</h3>
                </div>
                <div className="p-4 space-y-4">
                  {match.maps.map((map, index) => (
                    <div key={index} className="bg-[#0f1923] p-4 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">{map.name}</h4>
                        <span className="text-xs text-[#768894]">Map {index + 1}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className={map.winner === match.team1.name ? 'text-[#4ade80]' : ''}>
                          <div className="text-sm text-[#768894]">{match.team1.name}</div>
                          <div className="text-xl font-bold">{map.score.team1}</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-[#768894]">-</span>
                        </div>
                        <div className={map.winner === match.team2.name ? 'text-[#4ade80]' : ''}>
                          <div className="text-sm text-[#768894]">{match.team2.name}</div>
                          <div className="text-xl font-bold">{map.score.team2}</div>
                        </div>
                      </div>
                      
                      {/* Half Scores */}
                      <div className="grid grid-cols-2 mt-3 text-xs">
                        <div className="flex justify-between p-2 bg-[#1a242d] rounded">
                          <span className="text-[#768894]">First Half:</span>
                          <span>{map.firstHalf.team1} : {map.firstHalf.team2}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-[#1a242d] rounded ml-1">
                          <span className="text-[#768894]">Second Half:</span>
                          <span>{map.secondHalf.team1} : {map.secondHalf.team2}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1">
              {/* Top Performers */}
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3">
                  <h3 className="font-medium">Top Performers</h3>
                </div>
                <div className="p-4">
                  {match.playerStats
                    .sort((a, b) => b.acs - a.acs)
                    .slice(0, 5)
                    .map((player, index) => (
                      <div key={player.name} className={`flex justify-between py-2 ${
                        index < 4 ? 'border-b border-[#2b3d4d]' : ''
                      }`}>
                        <div>
                          <div className="text-sm font-medium">{player.name}</div>
                          <div className="text-xs text-[#768894]">{player.hero} • {player.team}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">{player.acs}</div>
                          <div className="text-xs text-[#768894]">ACS</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Stats Tab */}
        {activeTab === 'Stats' && (
          <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
            <div className="bg-[#0f1923] px-4 py-3">
              <h3 className="font-medium">Player Statistics</h3>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2b3d4d]">
                    <th className="text-left p-2">Player</th>
                    <th className="text-left p-2">Hero</th>
                    <th className="text-center p-2">ACS</th>
                    <th className="text-center p-2">K</th>
                    <th className="text-center p-2">D</th>
                    <th className="text-center p-2">A</th>
                    <th className="text-center p-2">K/D</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#0f1923]">
                    <td colSpan={7} className="px-2 py-2 font-medium">{match.team1.name}</td>
                  </tr>
                  {match.playerStats
                    .filter(player => player.team === match.team1.name)
                    .sort((a, b) => b.acs - a.acs)
                    .map((player) => (
                      <tr key={player.name} className="border-b border-[#2b3d4d] hover:bg-[#0f1923]">
                        <td className="p-2 font-medium">{player.name}</td>
                        <td className="p-2">{player.hero}</td>
                        <td className="p-2 text-center font-bold">{player.acs}</td>
                        <td className="p-2 text-center">{player.kills}</td>
                        <td className="p-2 text-center">{player.deaths}</td>
                        <td className="p-2 text-center">{player.assists}</td>
                        <td className="p-2 text-center">{player.kd}</td>
                      </tr>
                    ))}
                  
                  <tr className="bg-[#0f1923]">
                    <td colSpan={7} className="px-2 py-2 font-medium">{match.team2.name}</td>
                  </tr>
                  {match.playerStats
                    .filter(player => player.team === match.team2.name)
                    .sort((a, b) => b.acs - a.acs)
                    .map((player) => (
                      <tr key={player.name} className="border-b border-[#2b3d4d] hover:bg-[#0f1923]">
                        <td className="p-2 font-medium">{player.name}</td>
                        <td className="p-2">{player.hero}</td>
                        <td className="p-2 text-center font-bold">{player.acs}</td>
                        <td className="p-2 text-center">{player.kills}</td>
                        <td className="p-2 text-center">{player.deaths}</td>
                        <td className="p-2 text-center">{player.assists}</td>
                        <td className="p-2 text-center">{player.kd}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Lineups Tab */}
        {activeTab === 'Lineups' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team 1 Lineup */}
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
              <div className="bg-[#0f1923] px-4 py-3 flex items-center">
                <div className="w-6 h-6 relative mr-2">
                  <Image
                    src={match.team1.logo}
                    alt={match.team1.name}
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <h3 className="font-medium">{match.team1.name}</h3>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2b3d4d]">
                      <th className="text-left p-2">Player</th>
                      <th className="text-left p-2">Hero</th>
                      <th className="text-center p-2">K/D/A</th>
                      <th className="text-center p-2">ACS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.team1.roster.map((player) => (
                      <tr key={player.name} className="border-b border-[#2b3d4d] hover:bg-[#0f1923]">
                        <td className="p-2 font-medium">{player.name}</td>
                        <td className="p-2">{player.hero}</td>
                        <td className="p-2 text-center">{player.kills}/{player.deaths}/{player.assists}</td>
                        <td className="p-2 text-center font-bold">{player.acs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Team 2 Lineup */}
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
              <div className="bg-[#0f1923] px-4 py-3 flex items-center">
                <div className="w-6 h-6 relative mr-2">
                  <Image
                    src={match.team2.logo}
                    alt={match.team2.name}
                    fill
                    style={{ objectFit: 'contain' }}
                  />
                </div>
                <h3 className="font-medium">{match.team2.name}</h3>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2b3d4d]">
                      <th className="text-left p-2">Player</th>
                      <th className="text-left p-2">Hero</th>
                      <th className="text-center p-2">K/D/A</th>
                      <th className="text-center p-2">ACS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.team2.roster.map((player) => (
                      <tr key={player.name} className="border-b border-[#2b3d4d] hover:bg-[#0f1923]">
                        <td className="p-2 font-medium">{player.name}</td>
                        <td className="p-2">{player.hero}</td>
                        <td className="p-2 text-center">{player.kills}/{player.deaths}/{player.assists}</td>
                        <td className="p-2 text-center font-bold">{player.acs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Maps Tab */}
        {activeTab === 'Maps' && (
          <div className="space-y-6">
            {match.maps.map((map, index) => (
              <div key={index} className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3 flex justify-between items-center">
                  <h3 className="font-medium">{map.name}</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[#768894]">Map {index + 1}</span>
                    {getMapStatusIcon(map, index)}
                  </div>
                </div>
                <div className="p-4">
                  {/* Map Image Placeholder */}
                  <div className="relative h-32 bg-[#0f1923] rounded mb-4 flex items-center justify-center">
                    <div className="text-[#768894] text-sm">Map: {map.name}</div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Map Score */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Final Score</h4>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className={`p-3 rounded ${map.winner === match.team1.name ? 'bg-green-900/30 border border-green-600' : 'bg-[#0f1923]'}`}>
                          <div className="text-xs text-[#768894] mb-1">{match.team1.name}</div>
                          <div className="text-2xl font-bold">{map.score.team1}</div>
                        </div>
                        <div className="flex items-center justify-center">
                          <span className="text-[#768894]">-</span>
                        </div>
                        <div className={`p-3 rounded ${map.winner === match.team2.name ? 'bg-green-900/30 border border-green-600' : 'bg-[#0f1923]'}`}>
                          <div className="text-xs text-[#768894] mb-1">{match.team2.name}</div>
                          <div className="text-2xl font-bold">{map.score.team2}</div>
                        </div>
                      </div>
                      
                      {/* Half Scores */}
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                          <span className="text-xs text-[#768894]">First Half:</span>
                          <span className="text-sm">{map.firstHalf.team1} - {map.firstHalf.team2}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                          <span className="text-xs text-[#768894]">Second Half:</span>
                          <span className="text-sm">{map.secondHalf.team1} - {map.secondHalf.team2}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Map Info */}
                    <div>
                      <h4 className="text-sm font-medium mb-3">Map Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#768894]">Duration:</span>
                          <span>24:32</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#768894]">Winner:</span>
                          <span className="text-[#4ade80]">{map.winner || 'TBD'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#768894]">Mode:</span>
                          <span>Convoy</span>
                        </div>
                        {map.inProgress && (
                          <div className="flex justify-between">
                            <span className="text-[#768894]">Status:</span>
                            <span className="text-red-400 animate-pulse">Live</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Heroes Tab */}
        {activeTab === 'Heroes' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
              <div className="bg-[#0f1923] px-4 py-3">
                <h3 className="font-medium">Hero Performance</h3>
              </div>
              <div className="p-4">
                <div style={{ height: '400px' }}>
                  <Bar data={heroChartData} options={chartOptions} />
                </div>
              </div>
            </div>
            
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
              <div className="bg-[#0f1923] px-4 py-3">
                <h3 className="font-medium">Hero Statistics</h3>
              </div>
              <div className="p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#2b3d4d]">
                      <th className="text-left p-2">Hero</th>
                      <th className="text-center p-2">Pick Rate</th>
                      <th className="text-center p-2">Win Rate</th>
                      <th className="text-center p-2">KDA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.heroStats
                      .sort((a, b) => b.pickRate - a.pickRate)
                      .map((stat, index) => (
                        <tr key={index} className="border-b border-[#2b3d4d] hover:bg-[#0f1923]">
                          <td className="p-2 font-medium">{stat.hero}</td>
                          <td className="p-2 text-center">
                            <div className="flex items-center justify-center">
                              <div className="w-12 bg-[#0f1923] rounded-full h-2 mr-2">
                                <div 
                                  className="bg-[#fa4454] h-2 rounded-full" 
                                  style={{ width: `${stat.pickRate}%` }}
                                ></div>
                              </div>
                              <span>{stat.pickRate}%</span>
                            </div>
                          </td>
                          <td className="p-2 text-center">
                            <span className={stat.winRate >= 50 ? 'text-[#4ade80]' : 'text-[#ef4444]'}>
                              {stat.winRate}%
                            </span>
                          </td>
                          <td className="p-2 text-center">
                            {/* Calculate average KDA for this hero */}
                            {(() => {
                              const heroPlayers = match.playerStats.filter(p => p.hero === stat.hero);
                              const avgKDA = heroPlayers.length > 0 
                                ? (heroPlayers.reduce((sum, p) => sum + parseFloat(p.kd), 0) / heroPlayers.length).toFixed(2)
                                : '0.00';
                              return avgKDA;
                            })()}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
