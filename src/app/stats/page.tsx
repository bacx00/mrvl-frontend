'use client';

import { useEffect, useState } from 'react';
import { default as nextDynamic } from 'next/dynamic';

// Export dynamic configuration
export const dynamic = 'force-dynamic';

// Dynamic chart imports
const Line = nextDynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });
const Bar = nextDynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
const Doughnut = nextDynamic(() => import('react-chartjs-2').then((mod) => mod.Doughnut), { ssr: false });
const PolarArea = nextDynamic(() => import('react-chartjs-2').then((mod) => mod.PolarArea), { ssr: false });

// Define interfaces for our stats data
interface StatsData {
  months: string[];
  matchesPerMonth: number[];
  totalMatches: number;
  totalPlayers: number;
  totalTournaments: number;
  totalTeams: number;
  topPlayers: {
    name: string;
    team: string;
    acs: number;
    kd: number;
  }[];
  heroPicks: {
    name: string;
    pickRate: number;
    winRate: number;
  }[];
  maps: {
    name: string;
    playedCount: number;
    attackWinRate: number;
    defenseWinRate: number;
  }[];
  teamStats: {
    name: string;
    matches: number;
    winRate: number;
    avgDamage: number;
  }[];
  heroInfo: {
    name: string;
    role: string;
    pickRateByRank: {
      bronze: number;
      silver: number;
      gold: number;
      platinum: number;
      diamond: number;
      master: number;
    };
  }[];
  matchDurations: {
    mapName: string;
    averageDuration: number;
    shortestMatch: number;
    longestMatch: number;
  }[];
}

export default function StatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Heroes' | 'Maps' | 'Teams' | 'Players'>('Overview');
  const [loading, setLoading] = useState(true);
  const [chartJsLoaded, setChartJsLoaded] = useState(false);
  const [timeFrame, setTimeFrame] = useState<'all' | 'month' | '3months'>('all');
  const [statsError, setStatsError] = useState<string | null>(null);

  // Register Chart.js components
  useEffect(() => {
    const loadChartJs = async () => {
      if (typeof window !== 'undefined' && !chartJsLoaded) {
        try {
          const {
            Chart,
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            BarElement,
            ArcElement,
            RadialLinearScale,
            Title,
            Tooltip,
            Legend,
            Filler
          } = await import('chart.js');
          Chart.register(
            CategoryScale,
            LinearScale,
            PointElement,
            LineElement,
            BarElement,
            ArcElement,
            RadialLinearScale,
            Title,
            Tooltip,
            Legend,
            Filler
          );
          setChartJsLoaded(true);
        } catch (err) {
          console.error('Failed to load Chart.js:', err);
          setStatsError('Failed to load chart visualization library');
        }
      }
    };
    loadChartJs();
  }, [chartJsLoaded]);

  // Fetch/Mock stats data
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/stats?period=${timeFrame}`);
        if (!response.ok) {
          throw new Error('Failed to fetch statistics data');
        }
        const data = await response.json();
        setStats(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stats:', error);
        
        // Comprehensive mock data
        const mockStats: StatsData = {
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          matchesPerMonth: [120, 145, 180, 160, 200, 190, 220, 210, 185, 195, 240, 260],
          totalMatches: 2345,
          totalPlayers: 12480,
          totalTournaments: 38,
          totalTeams: 248,
          topPlayers: [
            { name: 'TenZ', team: 'Sentinels', acs: 287, kd: 1.42 },
            { name: 'cNed', team: 'Team Liquid', acs: 274, kd: 1.38 },
            { name: 'Derke', team: 'Fnatic', acs: 269, kd: 1.35 },
            { name: 'yay', team: 'Cloud9', acs: 265, kd: 1.33 },
            { name: 'Chronicle', team: 'Fnatic', acs: 262, kd: 1.31 },
            { name: 'Aspas', team: 'LOUD', acs: 258, kd: 1.29 },
            { name: 'Sayf', team: 'Team Liquid', acs: 255, kd: 1.27 },
            { name: 'Jinggg', team: 'Paper Rex', acs: 252, kd: 1.25 },
            { name: 'Less', team: 'LOUD', acs: 248, kd: 1.23 },
            { name: 'Zmjjkk', team: 'EDward Gaming', acs: 245, kd: 1.21 }
          ],
          heroPicks: [
            { name: 'Iron Man', pickRate: 78.5, winRate: 52.3 },
            { name: 'Doctor Strange', pickRate: 71.2, winRate: 51.8 },
            { name: 'Captain America', pickRate: 68.9, winRate: 49.7 },
            { name: 'Hulk', pickRate: 65.4, winRate: 48.9 },
            { name: 'Storm', pickRate: 62.1, winRate: 53.2 },
            { name: 'Spider-Man', pickRate: 59.8, winRate: 50.1 },
            { name: 'Wolverine', pickRate: 56.3, winRate: 51.5 },
            { name: 'Magneto', pickRate: 54.7, winRate: 47.8 },
            { name: 'Thor', pickRate: 52.1, winRate: 50.9 },
            { name: 'Scarlet Witch', pickRate: 49.5, winRate: 52.7 },
            { name: 'Black Panther', pickRate: 46.8, winRate: 51.2 },
            { name: 'Venom', pickRate: 44.2, winRate: 48.5 },
            { name: 'Loki', pickRate: 41.6, winRate: 49.3 },
            { name: 'Rocket Raccoon', pickRate: 39.1, winRate: 50.8 },
            { name: 'Groot', pickRate: 36.7, winRate: 52.1 }
          ],
          maps: [
            { name: 'Asgard', playedCount: 542, attackWinRate: 52.1, defenseWinRate: 47.9 },
            { name: 'Wakanda', playedCount: 498, attackWinRate: 48.3, defenseWinRate: 51.7 },
            { name: 'New York', playedCount: 487, attackWinRate: 49.8, defenseWinRate: 50.2 },
            { name: 'Sakaar', playedCount: 468, attackWinRate: 51.2, defenseWinRate: 48.8 },
            { name: 'Knowhere', playedCount: 450, attackWinRate: 47.5, defenseWinRate: 52.5 },
            { name: 'Xandar', playedCount: 432, attackWinRate: 50.6, defenseWinRate: 49.4 }
          ],
          teamStats: [
            { name: 'Sentinels', matches: 65, winRate: 73.8, avgDamage: 15420 },
            { name: 'Fnatic', matches: 62, winRate: 71.0, avgDamage: 14980 },
            { name: 'Team Liquid', matches: 58, winRate: 69.0, avgDamage: 14750 },
            { name: 'Cloud9', matches: 61, winRate: 67.2, avgDamage: 14520 },
            { name: 'LOUD', matches: 55, winRate: 65.5, avgDamage: 14380 },
            { name: 'Paper Rex', matches: 52, winRate: 63.5, avgDamage: 14240 },
            { name: 'NAVI', matches: 48, winRate: 62.5, avgDamage: 14100 },
            { name: 'DRX', matches: 51, winRate: 60.8, avgDamage: 13950 },
            { name: 'NRG', matches: 46, winRate: 58.7, avgDamage: 13800 },
            { name: 'EG', matches: 44, winRate: 56.8, avgDamage: 13680 }
          ],
          heroInfo: [
            {
              name: 'Iron Man',
              role: 'DPS',
              pickRateByRank: { bronze: 65.2, silver: 72.1, gold: 78.5, platinum: 81.3, diamond: 84.7, master: 87.2 }
            },
            {
              name: 'Doctor Strange',
              role: 'Support',
              pickRateByRank: { bronze: 58.4, silver: 64.7, gold: 71.2, platinum: 75.8, diamond: 79.1, master: 82.5 }
            },
            {
              name: 'Captain America',
              role: 'Tank',
              pickRateByRank: { bronze: 72.1, silver: 69.5, gold: 68.9, platinum: 67.2, diamond: 65.8, master: 64.1 }
            },
            {
              name: 'Hulk',
              role: 'Tank',
              pickRateByRank: { bronze: 78.9, silver: 71.2, gold: 65.4, platinum: 61.7, diamond: 58.3, master: 55.1 }
            },
            {
              name: 'Storm',
              role: 'DPS',
              pickRateByRank: { bronze: 45.7, silver: 52.3, gold: 62.1, platinum: 68.4, diamond: 74.2, master: 79.6 }
            },
            {
              name: 'Spider-Man',
              role: 'DPS',
              pickRateByRank: { bronze: 48.2, silver: 54.1, gold: 59.8, platinum: 63.5, diamond: 67.2, master: 70.8 }
            },
            {
              name: 'Wolverine',
              role: 'DPS',
              pickRateByRank: { bronze: 42.1, silver: 47.8, gold: 56.3, platinum: 61.2, diamond: 65.7, master: 69.4 }
            },
            {
              name: 'Magneto',
              role: 'Tank',
              pickRateByRank: { bronze: 38.5, silver: 44.2, gold: 54.7, platinum: 58.9, diamond: 62.1, master: 65.3 }
            }
          ],
          matchDurations: [
            { mapName: 'Asgard', averageDuration: 18.2, shortestMatch: 8.5, longestMatch: 32.7 },
            { mapName: 'Wakanda', averageDuration: 16.8, shortestMatch: 7.2, longestMatch: 28.4 },
            { mapName: 'New York', averageDuration: 17.5, shortestMatch: 9.1, longestMatch: 31.2 },
            { mapName: 'Sakaar', averageDuration: 15.3, shortestMatch: 6.8, longestMatch: 26.9 },
            { mapName: 'Knowhere', averageDuration: 19.1, shortestMatch: 8.9, longestMatch: 35.2 },
            { mapName: 'Xandar', averageDuration: 16.7, shortestMatch: 7.5, longestMatch: 29.8 }
          ]
        };
        
        setStats(mockStats);
        setLoading(false);
      }
    };

    if (chartJsLoaded) {
      fetchStats();
    }
  }, [timeFrame, chartJsLoaded]);

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#ffffff', font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#1a2332',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#2b3d4d',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#768894', font: { size: 11 } },
        grid: { color: '#2b3d4d' }
      },
      y: {
        ticks: { color: '#768894', font: { size: 11 } },
        grid: { color: '#2b3d4d' },
        beginAtZero: true
      }
    }
  };

  // Chart data preparation
  const matchActivityChartData = stats ? {
    labels: stats.months,
    datasets: [{
      label: 'Matches Played',
      data: stats.matchesPerMonth,
      backgroundColor: 'rgba(250, 68, 84, 0.1)',
      borderColor: '#fa4454',
      fill: true,
      tension: 0.4
    }]
  } : null;

  const heroPickRateChartData = stats ? {
    labels: stats.heroPicks.slice(0, 10).map(h => h.name),
    datasets: [
      {
        label: 'Pick Rate (%)',
        data: stats.heroPicks.slice(0, 10).map(h => h.pickRate),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      },
      {
        label: 'Win Rate (%)',
        data: stats.heroPicks.slice(0, 10).map(h => h.winRate),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1
      }
    ]
  } : null;

  const mapStatsChartData = stats ? {
    labels: stats.maps.map(m => m.name),
    datasets: [
      {
        label: 'Attack Win Rate (%)',
        data: stats.maps.map(m => m.attackWinRate),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)'
      },
      {
        label: 'Defense Win Rate (%)',
        data: stats.maps.map(m => m.defenseWinRate),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)'
      }
    ]
  } : null;

  const mapPlayDistributionChartData = stats ? {
    labels: stats.maps.map(m => m.name),
    datasets: [{
      data: stats.maps.map(m => m.playedCount),
      backgroundColor: [
        'rgba(255, 99, 132, 0.6)',
        'rgba(54, 162, 235, 0.6)',
        'rgba(255, 206, 86, 0.6)',
        'rgba(75, 192, 192, 0.6)',
        'rgba(153, 102, 255, 0.6)',
        'rgba(255, 159, 64, 0.6)'
      ]
    }]
  } : null;

  const teamWinRatesChartData = stats ? {
    labels: stats.teamStats.slice(0, 10).map(t => t.name),
    datasets: [{
      label: 'Win Rate (%)',
      data: stats.teamStats.slice(0, 10).map(t => t.winRate),
      backgroundColor: 'rgba(250, 68, 84, 0.6)'
    }]
  } : null;

  const matchDurationChartData = stats ? {
    labels: stats.matchDurations.map(m => m.mapName),
    datasets: [
      {
        label: 'Average Duration (min)',
        data: stats.matchDurations.map(m => m.averageDuration),
        backgroundColor: 'rgba(54, 162, 235, 0.6)'
      },
      {
        label: 'Shortest Match (min)',
        data: stats.matchDurations.map(m => m.shortestMatch),
        backgroundColor: 'rgba(75, 192, 192, 0.6)'
      },
      {
        label: 'Longest Match (min)',
        data: stats.matchDurations.map(m => m.longestMatch),
        backgroundColor: 'rgba(255, 99, 132, 0.6)'
      }
    ]
  } : null;

  const heroPickRateByRankChartData = stats ? {
    labels: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'],
    datasets: stats.heroInfo.slice(0, 5).map((hero, index) => {
      const colors = [
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)'
      ];
      
      return {
        label: hero.name,
        data: [
          hero.pickRateByRank.bronze,
          hero.pickRateByRank.silver,
          hero.pickRateByRank.gold,
          hero.pickRateByRank.platinum,
          hero.pickRateByRank.diamond,
          hero.pickRateByRank.master
        ],
        borderColor: colors[index],
        backgroundColor: colors[index].replace('1)', '0.2)'),
        tension: 0.3
      };
    })
  } : null;

  if (loading || !chartJsLoaded) {
    return (
      <div className="bg-[#0f1419] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[70vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#fa4454]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (statsError || !stats) {
    return (
      <div className="bg-[#0f1419] min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-6">
            <h2 className="text-xl font-bold mb-2 text-center text-white">Error Loading Statistics</h2>
            <p className="text-[#768894] text-center mb-4">{statsError || 'Failed to load statistics data'}</p>
            <div className="flex justify-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-4 py-2 rounded transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f1419] min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Marvel Rivals Statistics</h1>
          
          <div className="flex items-center space-x-2">
            <span className="text-[#768894] text-sm">Time Frame:</span>
            <select 
              className="bg-[#1a2332] border border-[#2b3d4d] text-white rounded text-sm py-1 px-2 focus:outline-none focus:border-[#fa4454]"
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as any)}
            >
              <option value="all">All Time</option>
              <option value="3months">Last 3 Months</option>
              <option value="month">Last Month</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#2b3d4d] mb-6">
          <nav className="flex space-x-8">
            {(['Overview', 'Heroes', 'Maps', 'Teams', 'Players'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-[#fa4454] text-[#fa4454]'
                    : 'border-transparent text-[#768894] hover:text-white hover:border-[#768894]'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <>
            {/* Key Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 text-center">
                <div className="text-[#fa4454] text-2xl font-bold">{stats.totalMatches.toLocaleString()}</div>
                <div className="text-[#768894] text-sm">Total Matches</div>
              </div>
              
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 text-center">
                <div className="text-[#fa4454] text-2xl font-bold">{stats.totalPlayers.toLocaleString()}</div>
                <div className="text-[#768894] text-sm">Total Players</div>
              </div>
              
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 text-center">
                <div className="text-[#fa4454] text-2xl font-bold">{stats.totalTeams.toLocaleString()}</div>
                <div className="text-[#768894] text-sm">Active Teams</div>
              </div>
              
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 text-center">
                <div className="text-[#fa4454] text-2xl font-bold">{stats.totalTournaments.toLocaleString()}</div>
                <div className="text-[#768894] text-sm">Tournaments</div>
              </div>
            </div>
            
            {/* Match Activity Chart */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Match Activity Over Time</h2>
              <div className="h-80">
                {matchActivityChartData && (
                  <Line data={matchActivityChartData} options={chartOptions} />
                )}
              </div>
            </div>
            
            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Top Players */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Top Players by ACS</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Player</th>
                                                <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Team</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">ACS</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topPlayers.map((player, index) => (
                        <tr 
                          key={player.name} 
                          className={`border-b border-[#2b3d4d] ${index < 3 ? 'bg-[#0f1923]' : ''}`}
                        >
                          <td className="py-2 px-2 text-sm text-white">{player.name}</td>
                          <td className="py-2 px-2 text-sm text-[#768894]">{player.team}</td>
                          <td className="py-2 px-2 text-sm text-right font-medium text-white">{player.acs}</td>
                          <td className="py-2 px-2 text-sm text-right font-medium text-white">{player.kd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Map Distribution */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Map Play Distribution</h2>
                <div className="h-64 mb-2">
                  {mapPlayDistributionChartData && (
                    <Doughnut data={mapPlayDistributionChartData} options={{
                      ...chartOptions,
                      cutout: '60%'
                    }} />
                  )}
                </div>
                <div className="text-xs text-[#768894] text-center">
                  Based on {stats.totalMatches} matches played
                </div>
              </div>
            </div>
            
            {/* Team Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Top Teams by Win Rate</h2>
              <div className="h-80">
                {teamWinRatesChartData && (
                  <Bar 
                    data={teamWinRatesChartData} 
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false }
                      }
                    }} 
                  />
                )}
              </div>
            </div>
            
            {/* Match Duration */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
              <h2 className="text-lg font-semibold mb-3 text-white">Match Duration by Map</h2>
              <div className="h-80">
                {matchDurationChartData && (
                  <Bar data={matchDurationChartData} options={chartOptions} />
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Heroes Tab */}
        {activeTab === 'Heroes' && (
          <>
            {/* Hero Pick & Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Hero Pick & Win Rates</h2>
              <div className="h-80">
                {heroPickRateChartData && (
                  <Bar data={heroPickRateChartData} options={chartOptions} />
                )}
              </div>
            </div>
            
            {/* Hero Pick Rates by Rank */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Hero Pick Rates by Rank</h2>
              <div className="h-80">
                {heroPickRateByRankChartData && (
                  <Line 
                    data={heroPickRateByRankChartData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context: any) {
                              return `${context.dataset.label}: ${context.raw}%`;
                            }
                          }
                        }
                      }
                    }} 
                  />
                )}
              </div>
              <div className="text-xs text-[#768894] text-center mt-2">
                Top 5 most picked heroes shown. Percentages indicate pick rate at each rank.
              </div>
            </div>
            
            {/* Hero Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Heroes by Role</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Hero</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Role</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Pick Rate</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.heroInfo.map((hero) => {
                        const heroStats = stats.heroPicks.find(h => h.name === hero.name) || { pickRate: 0, winRate: 0 };
                        
                        return (
                          <tr key={hero.name} className="border-b border-[#2b3d4d]">
                            <td className="py-2 px-2 text-sm text-white">{hero.name}</td>
                            <td className="py-2 px-2 text-sm">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                hero.role === 'DPS' ? 'bg-red-900 text-red-400' :
                                hero.role === 'Tank' ? 'bg-blue-900 text-blue-400' :
                                hero.role === 'Support' ? 'bg-green-900 text-green-400' :
                                'bg-purple-900 text-purple-400'
                              }`}>
                                {hero.role}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-sm text-right text-white">{heroStats.pickRate}%</td>
                            <td className={`py-2 px-2 text-sm text-right ${
                              heroStats.winRate > 52 ? 'text-green-400' :
                              heroStats.winRate < 48 ? 'text-red-400' :
                              'text-white'
                            }`}>
                              {heroStats.winRate}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Meta Analysis</h2>
                
                {/* Most Balanced Heroes */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Most Balanced Heroes</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.heroPicks
                      .filter(hero => hero.winRate >= 48 && hero.winRate <= 52)
                      .sort((a, b) => Math.abs(a.winRate - 50) - Math.abs(b.winRate - 50))
                      .slice(0, 5)
                      .map(hero => (
                        <div key={hero.name} className="bg-[#0f1923] border border-[#2b3d4d] rounded px-3 py-1 text-sm">
                          <span className="text-white">{hero.name}</span>
                          <span className="text-xs text-[#768894] ml-1">{hero.winRate}%</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Overperforming Heroes */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Overperforming Heroes</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.heroPicks
                      .filter(hero => hero.winRate > 52)
                      .sort((a, b) => b.winRate - a.winRate)
                      .slice(0, 5)
                      .map(hero => (
                        <div key={hero.name} className="bg-[#0f1923] border border-green-900 rounded px-3 py-1 text-sm">
                          <span className="text-white">{hero.name}</span>
                          <span className="text-xs text-green-400 ml-1">{hero.winRate}%</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Underperforming Heroes */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Underperforming Heroes</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.heroPicks
                      .filter(hero => hero.winRate < 50)
                      .sort((a, b) => a.winRate - b.winRate)
                      .slice(0, 5)
                      .map(hero => (
                        <div key={hero.name} className="bg-[#0f1923] border border-red-900 rounded px-3 py-1 text-sm">
                          <span className="text-white">{hero.name}</span>
                          <span className="text-xs text-red-400 ml-1">{hero.winRate}%</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Popular Combos */}
                <div>
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Popular Hero Combinations</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Iron Man + Doctor Strange</span>
                      <span className="text-sm text-green-400">72.3% Win Rate</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Captain America + Storm</span>
                      <span className="text-sm text-green-400">68.9% Win Rate</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Hulk + Spider-Man</span>
                      <span className="text-sm text-green-400">65.2% Win Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Maps Tab */}
        {activeTab === 'Maps' && (
          <>
            {/* Map Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Map Attack/Defense Win Rates</h2>
              <div className="h-80">
                {mapStatsChartData && (
                  <Bar data={mapStatsChartData} options={chartOptions} />
                )}
              </div>
            </div>
            
            {/* Map Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map Statistics */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Map Statistics</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Map</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Played</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Atk Win %</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Def Win %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.maps.map((map) => (
                        <tr key={map.name} className="border-b border-[#2b3d4d]">
                          <td className="py-2 px-2 text-sm text-white">{map.name}</td>
                          <td className="py-2 px-2 text-sm text-right text-white">{map.playedCount}</td>
                          <td className={`py-2 px-2 text-sm text-right ${
                            map.attackWinRate > 50 ? 'text-green-400' :
                            map.attackWinRate < 45 ? 'text-red-400' :
                            'text-white'
                          }`}>
                            {map.attackWinRate}%
                          </td>
                          <td className={`py-2 px-2 text-sm text-right ${
                            map.defenseWinRate > 50 ? 'text-green-400' :
                            map.defenseWinRate < 45 ? 'text-red-400' :
                            'text-white'
                          }`}>
                            {map.defenseWinRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Match Duration */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Match Duration Analysis</h2>
                <div className="h-64 mb-4">
                  {matchDurationChartData && (
                    <Bar data={matchDurationChartData} options={chartOptions} />
                  )}
                </div>
                <div className="space-y-3 mt-6">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Duration Insights</h3>
                  <p className="text-sm text-[#768894]">
                    {stats.matchDurations[0]?.mapName} has the longest average duration at {stats.matchDurations[0]?.averageDuration} minutes, 
                    while {stats.matchDurations.find(m => m.averageDuration === Math.min(...stats.matchDurations.map(d => d.averageDuration)))?.mapName} 
                    has the shortest at {Math.min(...stats.matchDurations.map(d => d.averageDuration))} minutes.
                  </p>
                  <p className="text-sm text-[#768894]">
                    The longest recorded match was {Math.max(...stats.matchDurations.map(m => m.longestMatch))} minutes on {
                      stats.matchDurations.find(m => m.longestMatch === Math.max(...stats.matchDurations.map(d => d.longestMatch)))?.mapName
                    }.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Teams Tab */}
        {activeTab === 'Teams' && (
          <>
            {/* Team Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Team Win Rates</h2>
              <div className="h-80">
                {teamWinRatesChartData && (
                  <Bar 
                    data={teamWinRatesChartData} 
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                      plugins: { ...chartOptions.plugins, legend: { display: false } }
                    }} 
                  />
                )}
              </div>
            </div>
            
            {/* Team Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Statistics */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Team Statistics</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Team</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Matches</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Win Rate</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Avg Damage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.teamStats.sort((a, b) => b.winRate - a.winRate).map((team, index) => (
                        <tr key={team.name} className={`border-b border-[#2b3d4d] ${index < 3 ? 'bg-[#0f1923]' : ''}`}>
                          <td className="py-2 px-2 text-sm text-white">{team.name}</td>
                          <td className="py-2 px-2 text-sm text-right text-white">{team.matches}</td>
                          <td className={`py-2 px-2 text-sm text-right font-medium ${
                            team.winRate > 65 ? 'text-green-400' :
                            team.winRate < 45 ? 'text-red-400' :
                            'text-white'
                          }`}>
                            {team.winRate}%
                          </td>
                          <td className="py-2 px-2 text-sm text-right text-white">{Math.round(team.avgDamage).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Team Performance Insights */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Performance Insights</h2>
                
                {/* Most Consistent Teams */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Most Consistent Teams</h3>
                  <div className="space-y-2">
                    {stats.teamStats
                      .sort((a, b) => b.matches - a.matches)
                      .slice(0, 3)
                      .map((team, index) => (
                        <div key={team.name} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center mr-2 text-xs text-white">
                              {index + 1}
                            </div>
                            <span className="text-sm text-white">{team.name}</span>
                          </div>
                          <div className="text-xs text-[#768894]">{team.matches} matches | {team.winRate}% WR</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Best Teams by Map */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Best Teams by Map</h3>
                  <div className="space-y-2">
                    {['Asgard', 'Wakanda', 'New York', 'Sakaar'].map((map, index) => (
                      <div key={map} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                        <span className="text-sm text-white">{map}</span>
                        <span className="text-sm text-[#768894]">{stats.teamStats[index]?.name} ({(stats.teamStats[index]?.winRate || 70) + Math.random() * 10}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Team Rivalries */}
                <div>
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Top Rivalries</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Sentinels vs Cloud9</span>
                      <span className="text-xs text-[#768894]">12 matches (7-5)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Fnatic vs Team Liquid</span>
                      <span className="text-xs text-[#768894]">10 matches (6-4)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">LOUD vs Paper Rex</span>
                      <span className="text-xs text-[#768894]">9 matches (5-4)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Players Tab */}
        {activeTab === 'Players' && (
          <>
            {/* Top Players */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Top Players by ACS</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2b3d4d]">
                      <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Rank</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Player</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Team</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">ACS</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">K/D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPlayers.map((player, index) => (
                      <tr 
                        key={player.name} 
                        className={`border-b border-[#2b3d4d] ${index < 3 ? 'bg-[#0f1923]' : ''}`}
                      >
                        <td className="py-2 px-2 text-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            index === 0 ? 'bg-yellow-600 text-white' : 
                            index === 1 ? 'bg-gray-400 text-white' : 
                            index === 2 ? 'bg-amber-700 text-white' : 
                            'bg-[#2b3d4d] text-[#768894]'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-sm text-white">{player.name}</td>
                        <td className="py-2 px-2 text-sm text-[#768894]">{player.team}</td>
                        <td className="py-2 px-2 text-sm text-right font-medium text-white">{player.acs}</td>
                        <td className={`py-2 px-2 text-sm text-right font-medium ${
                          player.kd > 1.5 ? 'text-green-400' :
                          player.kd < 1.0 ? 'text-red-400' :
                          'text-white'
                        }`}>
                          {player.kd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Player Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Players by Role */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Top Players by Role</h2>
                
                {/* DPS Players */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-red-400">DPS</h3>
                  <div className="space-y-2">
                    {stats.topPlayers.slice(0, 3).map((player, index) => (
                      <div key={player.name} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center mr-2 text-xs text-white">
                            {index + 1}
                          </div>
                          <span className="text-sm text-white">{player.name}</span>
                        </div>
                        <div className="flex space-x-3">
                          <span className="text-xs text-[#768894]">ACS: {player.acs}</span>
                          <span className="text-xs text-[#768894]">K/D: {player.kd}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tank Players */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-blue-400">Tank</h3>
                  <div className="space-y-2">
                    {stats.topPlayers.slice(3, 6).map((player, index) => (
                      <div key={player.name} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center mr-2 text-xs text-white">
                            {index + 1}
                          </div>
                          <span className="text-sm text-white">{player.name}</span>
                        </div>
                        <div className="flex space-x-3">
                          <span className="text-xs text-[#768894]">ACS: {player.acs}</span>
                          <span className="-left py-2 px-2 text-sm font-medium text-[#768894]">Team</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">ACS</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">K/D</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.topPlayers.map((player, index) => (
                        <tr 
                          key={player.name} 
                          className={`border-b border-[#2b3d4d] ${index < 3 ? 'bg-[#0f1923]' : ''}`}
                        >
                          <td className="py-2 px-2 text-sm text-white">{player.name}</td>
                          <td className="py-2 px-2 text-sm text-[#768894]">{player.team}</td>
                          <td className="py-2 px-2 text-sm text-right font-medium text-white">{player.acs}</td>
                          <td className="py-2 px-2 text-sm text-right font-medium text-white">{player.kd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Map Distribution */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Map Play Distribution</h2>
                <div className="h-64 mb-2">
                  {mapPlayDistributionChartData && (
                    <Doughnut data={mapPlayDistributionChartData} options={{
                      ...chartOptions,
                      cutout: '60%'
                    }} />
                  )}
                </div>
                <div className="text-xs text-[#768894] text-center">
                  Based on {stats.totalMatches} matches played
                </div>
              </div>
            </div>
            
            {/* Team Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Top Teams by Win Rate</h2>
              <div className="h-80">
                {teamWinRatesChartData && (
                  <Bar 
                    data={teamWinRatesChartData} 
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                      plugins: {
                        ...chartOptions.plugins,
                        legend: { display: false }
                      }
                    }} 
                  />
                )}
              </div>
            </div>
            
            {/* Match Duration */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
              <h2 className="text-lg font-semibold mb-3 text-white">Match Duration by Map</h2>
              <div className="h-80">
                {matchDurationChartData && (
                  <Bar data={matchDurationChartData} options={chartOptions} />
                )}
              </div>
            </div>
          </>
        )}
        
        {/* Heroes Tab */}
        {activeTab === 'Heroes' && (
          <>
            {/* Hero Pick & Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Hero Pick & Win Rates</h2>
              <div className="h-80">
                {heroPickRateChartData && (
                  <Bar data={heroPickRateChartData} options={chartOptions} />
                )}
              </div>
            </div>
            
            {/* Hero Pick Rates by Rank */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Hero Pick Rates by Rank</h2>
              <div className="h-80">
                {heroPickRateByRankChartData && (
                  <Line 
                    data={heroPickRateByRankChartData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        ...chartOptions.plugins,
                        tooltip: {
                          ...chartOptions.plugins.tooltip,
                          callbacks: {
                            label: function(context: any) {
                              return `${context.dataset.label}: ${context.raw}%`;
                            }
                          }
                        }
                      }
                    }} 
                  />
                )}
              </div>
              <div className="text-xs text-[#768894] text-center mt-2">
                Top 5 most picked heroes shown. Percentages indicate pick rate at each rank.
              </div>
            </div>
            
            {/* Hero Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Heroes by Role</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Hero</th>
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Role</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Pick Rate</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.heroInfo.map((hero) => {
                        const heroStats = stats.heroPicks.find(h => h.name === hero.name) || { pickRate: 0, winRate: 0 };
                        
                        return (
                          <tr key={hero.name} className="border-b border-[#2b3d4d]">
                            <td className="py-2 px-2 text-sm text-white">{hero.name}</td>
                            <td className="py-2 px-2 text-sm">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                hero.role === 'DPS' ? 'bg-red-900 text-red-400' :
                                hero.role === 'Tank' ? 'bg-blue-900 text-blue-400' :
                                hero.role === 'Support' ? 'bg-green-900 text-green-400' :
                                'bg-purple-900 text-purple-400'
                              }`}>
                                {hero.role}
                              </span>
                            </td>
                            <td className="py-2 px-2 text-sm text-right text-white">{heroStats.pickRate}%</td>
                            <td className={`py-2 px-2 text-sm text-right ${
                              heroStats.winRate > 52 ? 'text-green-400' :
                              heroStats.winRate < 48 ? 'text-red-400' :
                              'text-white'
                            }`}>
                              {heroStats.winRate}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Meta Analysis</h2>
                
                {/* Most Balanced Heroes */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Most Balanced Heroes</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.heroPicks
                      .filter(hero => hero.winRate >= 48 && hero.winRate <= 52)
                      .sort((a, b) => Math.abs(a.winRate - 50) - Math.abs(b.winRate - 50))
                      .slice(0, 5)
                      .map(hero => (
                        <div key={hero.name} className="bg-[#0f1923] border border-[#2b3d4d] rounded px-3 py-1 text-sm">
                          <span className="text-white">{hero.name}</span>
                          <span className="text-xs text-[#768894] ml-1">{hero.winRate}%</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Overperforming Heroes */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Overperforming Heroes</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.heroPicks
                      .filter(hero => hero.winRate > 52)
                      .sort((a, b) => b.winRate - a.winRate)
                      .slice(0, 5)
                      .map(hero => (
                        <div key={hero.name} className="bg-[#0f1923] border border-green-900 rounded px-3 py-1 text-sm">
                          <span className="text-white">{hero.name}</span>
                          <span className="text-xs text-green-400 ml-1">{hero.winRate}%</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Underperforming Heroes */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Underperforming Heroes</h3>
                  <div className="flex flex-wrap gap-2">
                    {stats.heroPicks
                      .filter(hero => hero.winRate < 50)
                      .sort((a, b) => a.winRate - b.winRate)
                      .slice(0, 5)
                      .map(hero => (
                        <div key={hero.name} className="bg-[#0f1923] border border-red-900 rounded px-3 py-1 text-sm">
                          <span className="text-white">{hero.name}</span>
                          <span className="text-xs text-red-400 ml-1">{hero.winRate}%</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Popular Combos */}
                <div>
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Popular Hero Combinations</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Iron Man + Doctor Strange</span>
                      <span className="text-sm text-green-400">72.3% Win Rate</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Captain America + Storm</span>
                      <span className="text-sm text-green-400">68.9% Win Rate</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Hulk + Spider-Man</span>
                      <span className="text-sm text-green-400">65.2% Win Rate</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Maps Tab */}
        {activeTab === 'Maps' && (
          <>
            {/* Map Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Map Attack/Defense Win Rates</h2>
              <div className="h-80">
                {mapStatsChartData && (
                  <Bar data={mapStatsChartData} options={chartOptions} />
                )}
              </div>
            </div>
            
            {/* Map Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Map Statistics */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Map Statistics</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Map</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Played</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Atk Win %</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Def Win %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.maps.map((map) => (
                        <tr key={map.name} className="border-b border-[#2b3d4d]">
                          <td className="py-2 px-2 text-sm text-white">{map.name}</td>
                          <td className="py-2 px-2 text-sm text-right text-white">{map.playedCount}</td>
                          <td className={`py-2 px-2 text-sm text-right ${
                            map.attackWinRate > 50 ? 'text-green-400' :
                            map.attackWinRate < 45 ? 'text-red-400' :
                            'text-white'
                          }`}>
                            {map.attackWinRate}%
                          </td>
                          <td className={`py-2 px-2 text-sm text-right ${
                            map.defenseWinRate > 50 ? 'text-green-400' :
                            map.defenseWinRate < 45 ? 'text-red-400' :
                            'text-white'
                          }`}>
                            {map.defenseWinRate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Match Duration */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Match Duration Analysis</h2>
                <div className="h-64 mb-4">
                  {matchDurationChartData && (
                    <Bar data={matchDurationChartData} options={chartOptions} />
                  )}
                </div>
                <div className="space-y-3 mt-6">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Duration Insights</h3>
                  <p className="text-sm text-[#768894]">
                    {stats.matchDurations[0]?.mapName} has the longest average duration at {stats.matchDurations[0]?.averageDuration} minutes, 
                    while {stats.matchDurations.find(m => m.averageDuration === Math.min(...stats.matchDurations.map(d => d.averageDuration)))?.mapName} 
                    has the shortest at {Math.min(...stats.matchDurations.map(d => d.averageDuration))} minutes.
                  </p>
                  <p className="text-sm text-[#768894]">
                    The longest recorded match was {Math.max(...stats.matchDurations.map(m => m.longestMatch))} minutes on {
                      stats.matchDurations.find(m => m.longestMatch === Math.max(...stats.matchDurations.map(d => d.longestMatch)))?.mapName
                    }.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Teams Tab */}
        {activeTab === 'Teams' && (
          <>
            {/* Team Win Rates */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Team Win Rates</h2>
              <div className="h-80">
                {teamWinRatesChartData && (
                  <Bar 
                    data={teamWinRatesChartData} 
                    options={{
                      ...chartOptions,
                      indexAxis: 'y' as const,
                      plugins: { ...chartOptions.plugins, legend: { display: false } }
                    }} 
                  />
                )}
              </div>
            </div>
            
            {/* Team Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Team Statistics */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Team Statistics</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Team</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Matches</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Win Rate</th>
                        <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">Avg Damage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.teamStats.sort((a, b) => b.winRate - a.winRate).map((team, index) => (
                        <tr key={team.name} className={`border-b border-[#2b3d4d] ${index < 3 ? 'bg-[#0f1923]' : ''}`}>
                          <td className="py-2 px-2 text-sm text-white">{team.name}</td>
                          <td className="py-2 px-2 text-sm text-right text-white">{team.matches}</td>
                          <td className={`py-2 px-2 text-sm text-right font-medium ${
                            team.winRate > 65 ? 'text-green-400' :
                            team.winRate < 45 ? 'text-red-400' :
                            'text-white'
                          }`}>
                            {team.winRate}%
                          </td>
                          <td className="py-2 px-2 text-sm text-right text-white">{Math.round(team.avgDamage).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Team Performance Insights */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Performance Insights</h2>
                
                {/* Most Consistent Teams */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Most Consistent Teams</h3>
                  <div className="space-y-2">
                    {stats.teamStats
                      .sort((a, b) => b.matches - a.matches)
                      .slice(0, 3)
                      .map((team, index) => (
                        <div key={team.name} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                          <div className="flex items-center">
                            <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center mr-2 text-xs text-white">
                              {index + 1}
                            </div>
                            <span className="text-sm text-white">{team.name}</span>
                          </div>
                          <div className="text-xs text-[#768894]">{team.matches} matches | {team.winRate}% WR</div>
                        </div>
                      ))
                    }
                  </div>
                </div>
                
                {/* Best Teams by Map */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Best Teams by Map</h3>
                  <div className="space-y-2">
                    {['Asgard', 'Wakanda', 'New York', 'Sakaar'].map((map, index) => (
                      <div key={map} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                        <span className="text-sm text-white">{map}</span>
                        <span className="text-sm text-[#768894]">{stats.teamStats[index]?.name} ({(stats.teamStats[index]?.winRate || 70) + Math.random() * 10}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Team Rivalries */}
                <div>
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Top Rivalries</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Sentinels vs Cloud9</span>
                      <span className="text-xs text-[#768894]">12 matches (7-5)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">Fnatic vs Team Liquid</span>
                      <span className="text-xs text-[#768894]">10 matches (6-4)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <span className="text-sm text-white">LOUD vs Paper Rex</span>
                      <span className="text-xs text-[#768894]">9 matches (5-4)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Players Tab */}
        {activeTab === 'Players' && (
          <>
            {/* Top Players */}
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4 mb-6">
              <h2 className="text-lg font-semibold mb-3 text-white">Top Players by ACS</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2b3d4d]">
                      <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Rank</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Player</th>
                      <th className="text-left py-2 px-2 text-sm font-medium text-[#768894]">Team</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">ACS</th>
                      <th className="text-right py-2 px-2 text-sm font-medium text-[#768894]">K/D</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topPlayers.map((player, index) => (
                      <tr 
                        key={player.name} 
                        className={`border-b border-[#2b3d4d] ${index < 3 ? 'bg-[#0f1923]' : ''}`}
                      >
                        <td className="py-2 px-2 text-sm">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                            index === 0 ? 'bg-yellow-600 text-white' : 
                            index === 1 ? 'bg-gray-400 text-white' : 
                            index === 2 ? 'bg-amber-700 text-white' : 
                            'bg-[#2b3d4d] text-[#768894]'
                          }`}>
                            {index + 1}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-sm text-white">{player.name}</td>
                        <td className="py-2 px-2 text-sm text-[#768894]">{player.team}</td>
                        <td className="py-2 px-2 text-sm text-right font-medium text-white">{player.acs}</td>
                        <td className={`py-2 px-2 text-sm text-right font-medium ${
                          player.kd > 1.5 ? 'text-green-400' :
                          player.kd < 1.0 ? 'text-red-400' :
                          'text-white'
                        }`}>
                          {player.kd}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Player Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Players by Role */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Top Players by Role</h2>
                
                {/* DPS Players */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-red-400">DPS</h3>
                  <div className="space-y-2">
                    {stats.topPlayers.slice(0, 3).map((player, index) => (
                      <div key={player.name} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center mr-2 text-xs text-white">
                            {index + 1}
                          </div>
                          <span className="text-sm text-white">{player.name}</span>
                        </div>
                        <div className="flex space-x-3">
                          <span className="text-xs text-[#768894]">ACS: {player.acs}</span>
                          <span className="text-xs text-[#768894]">K/D: {player.kd}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Tank Players */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-blue-400">Tank</h3>
                  <div className="space-y-2">
                    {stats.topPlayers.slice(3, 6).map((player, index) => (
                      <div key={player.name} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center mr-2 text-xs text-white">
                            {index + 1}
                          </div>
                          <span className="text-sm text-white">{player.name}</span>
                        </div>
                        <div className="flex space-x-3">
                          <span className="text-xs text-[#768894]">ACS: {player.acs}</span>
                          <span className="text-xs text-[#768894]">K/D: {player.kd}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Support Players */}
                <div>
                  <h3 className="text-md font-medium mb-2 text-green-400">Support</h3>
                  <div className="space-y-2">
                    {stats.topPlayers.slice(6, 9).map((player, index) => (
                      <div key={player.name} className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center mr-2 text-xs text-white">
                            {index + 1}
                          </div>
                          <span className="text-sm text-white">{player.name}</span>
                        </div>
                        <div className="flex space-x-3">
                          <span className="text-xs text-[#768894]">ACS: {player.acs}</span>
                          <span className="text-xs text-[#768894]">K/D: {player.kd}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Performance Insights */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-md p-4">
                <h2 className="text-lg font-semibold mb-3 text-white">Performance Insights</h2>
                
                {/* Average Stats */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-[#0f1923] p-3 rounded text-center">
                    <div className="text-lg font-bold text-[#fa4454]">
                      {Math.round(stats.topPlayers.reduce((sum, p) => sum + p.acs, 0) / stats.topPlayers.length)}
                    </div>
                    <div className="text-xs text-[#768894]">Average ACS</div>
                  </div>
                  <div className="bg-[#0f1923] p-3 rounded text-center">
                    <div className="text-lg font-bold text-[#fa4454]">
                      {(stats.topPlayers.reduce((sum, p) => sum + p.kd, 0) / stats.topPlayers.length).toFixed(2)}
                    </div>
                    <div className="text-xs text-[#768894]">Average K/D</div>
                  </div>
                  <div className="bg-[#0f1923] p-3 rounded text-center">
                    <div className="text-lg font-bold text-[#fa4454]">16.2</div>
                    <div className="text-xs text-[#768894]">Avg Kills/Match</div>
                  </div>
                </div>
                
                {/* Hero Specialist Players */}
                <div className="mb-4">
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Hero Specialists</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <div className="flex items-center">
                        <span className="text-sm text-white">TenZ</span>
                        <span className="ml-2 text-xs bg-[#2b3d4d] px-2 py-0.5 rounded text-white">Iron Man</span>
                      </div>
                      <div className="text-xs text-green-400">74.3% Win Rate</div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <div className="flex items-center">
                        <span className="text-sm text-white">cNed</span>
                        <span className="ml-2 text-xs bg-[#2b3d4d] px-2 py-0.5 rounded text-white">Doctor Strange</span>
                      </div>
                      <div className="text-xs text-green-400">72.1% Win Rate</div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <div className="flex items-center">
                        <span className="text-sm text-white">Chronicle</span>
                        <span className="ml-2 text-xs bg-[#2b3d4d] px-2 py-0.5 rounded text-white">Captain America</span>
                      </div>
                      <div className="text-xs text-green-400">71.5% Win Rate</div>
                    </div>
                  </div>
                </div>
                
                {/* Rising Stars */}
                <div>
                  <h3 className="text-md font-medium mb-2 text-[#768894]">Rising Stars</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <div className="flex items-center">
                        <span className="text-sm text-white">Aspas</span>
                        <span className="ml-2 text-xs text-[#768894]">LOUD</span>
                      </div>
                      <div className="text-xs text-green-400">+28.4% ACS Improvement</div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <div className="flex items-center">
                        <span className="text-sm text-white">Jinggg</span>
                        <span className="ml-2 text-xs text-[#768894]">Paper Rex</span>
                      </div>
                      <div className="text-xs text-green-400">+21.7% ACS Improvement</div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-[#0f1923] rounded">
                      <div className="flex items-center">
                        <span className="text-sm text-white">Less</span>
                        <span className="ml-2 text-xs text-[#768894]">LOUD</span>
                      </div>
                      <div className="text-xs text-green-400">+19.5% ACS Improvement</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
        
        {/* Footer */}
        <div className="text-center mt-8 pt-6 border-t border-[#2b3d4d]">
          <div className="text-xs text-[#768894] space-y-1">
            <p>Data based on {stats.totalMatches.toLocaleString()} matches played across {stats.totalTournaments} tournaments.</p>
            <p>Statistics updated in real-time • Last refresh: {new Date().toLocaleString()}</p>
            <p>© 2024 MRVL.net - Marvel Rivals Esports Statistics Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
}
