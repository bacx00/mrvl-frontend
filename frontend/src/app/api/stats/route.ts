import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const statsQuerySchema = z.object({
  type: z.enum(['overview', 'players', 'teams', 'heroes', 'maps', 'tournaments']).optional().default('overview'),
  period: z.enum(['24h', '7d', '30d', '90d', 'season', 'all-time']).optional().default('30d'),
  region: z.enum(['americas', 'emea', 'apac', 'global', 'all']).optional().default('global'),
  format: z.enum(['json', 'csv']).optional().default('json'),
  includeCharts: z.string().optional().transform(val => val === 'true'),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional().default('daily')
});

// Comprehensive statistics database
const statsData = {
  overview: {
    totalMatches: 1547,
    totalPlayers: 423,
    totalTeams: 89,
    totalTournaments: 24,
    totalPrizePool: 2750000,
    averageMatchDuration: 16.8,
    peakViewership: 1234567,
    totalViewHours: 8900000,
    lastUpdated: new Date().toISOString()
  },

  // Time series data for charts
  timeline: {
    matches: [
      { date: '2025-04-01', count: 42, viewers: 89000 },
      { date: '2025-04-02', count: 38, viewers: 76000 },
      { date: '2025-04-03', count: 55, viewers: 112000 },
      { date: '2025-04-04', count: 47, viewers: 94000 },
      { date: '2025-04-05', count: 62, viewers: 134000 },
      { date: '2025-04-06', count: 58, viewers: 128000 },
      { date: '2025-04-07', count: 71, viewers: 156000 },
      { date: '2025-04-08', count: 64, viewers: 142000 },
      { date: '2025-04-09', count: 49, viewers: 98000 },
      { date: '2025-04-10', count: 73, viewers: 167000 },
      { date: '2025-04-11', count: 68, viewers: 145000 },
      { date: '2025-04-12', count: 52, viewers: 108000 },
      { date: '2025-04-13', count: 77, viewers: 178000 },
      { date: '2025-04-14', count: 85, viewers: 198000 },
      { date: '2025-04-15', count: 95, viewers: 234000 },
      { date: '2025-04-16', count: 88, viewers: 201000 },
      { date: '2025-04-17', count: 92, viewers: 219000 },
      { date: '2025-04-18', count: 79, viewers: 186000 },
      { date: '2025-04-19', count: 84, viewers: 195000 },
      { date: '2025-04-20', count: 91, viewers: 213000 },
      { date: '2025-04-21', count: 87, viewers: 204000 },
      { date: '2025-04-22', count: 96, viewers: 228000 }
    ],
    growth: {
      playerGrowth: 15.7, // % month over month
      viewerGrowth: 23.4,
      tournamentGrowth: 8.9,
      prizePoolGrowth: 45.2
    }
  },

  // Player statistics
  playerStats: {
    topPerformers: [
      { 
        id: '101', 
        name: 'TenZ', 
        team: 'Sentinels', 
        rating: 1.42, 
        acs: 285, 
        kd: 1.8, 
        winRate: 81.25,
        matchesPlayed: 32,
        heroesPlayed: ['Iron Man', 'Spider-Man', 'Black Panther'],
        achievements: 3,
        earnings: 125000
      },
      { 
        id: '301', 
        name: 'Meteor', 
        team: 'Gen.G', 
        rating: 1.38, 
        acs: 278, 
        kd: 1.7, 
        winRate: 79.31,
        matchesPlayed: 29,
        heroesPlayed: ['Iron Man', 'Luna Snow', 'Captain America'],
        achievements: 2,
        earnings: 98000
      },
      { 
        id: '201', 
        name: 'Boaster', 
        team: 'FNATIC', 
        rating: 1.35, 
        acs: 245, 
        kd: 1.3, 
        winRate: 79.41,
        matchesPlayed: 34,
        heroesPlayed: ['Doctor Strange', 'Luna Snow', 'Storm'],
        achievements: 4,
        earnings: 87000
      },
      { 
        id: '401', 
        name: 'leaf', 
        team: 'Cloud9', 
        rating: 1.32, 
        acs: 268, 
        kd: 1.5, 
        winRate: 70.97,
        matchesPlayed: 31,
        heroesPlayed: ['Black Panther', 'Spider-Man', 'Storm'],
        achievements: 1,
        earnings: 76000
      },
      { 
        id: '202', 
        name: 'Derke', 
        team: 'FNATIC', 
        rating: 1.31, 
        acs: 274, 
        kd: 1.6, 
        winRate: 79.41,
        matchesPlayed: 34,
        heroesPlayed: ['Iron Man', 'Black Panther', 'Storm'],
        achievements: 4,
        earnings: 82000
      }
    ],
    roleDistribution: {
      dps: { count: 156, percentage: 36.9 },
      tank: { count: 98, percentage: 23.2 },
      support: { count: 124, percentage: 29.3 },
      flex: { count: 45, percentage: 10.6 }
    },
    averageStats: {
      acs: 198.7,
      kd: 1.12,
      winRate: 52.3,
      matchesPerPlayer: 18.4,
      careerLength: 8.6 // months
    },
    trends: {
      risingStars: ['leaf', 'Meteor', 'Alfajer'],
      veteranPerformers: ['TenZ', 'ShahZaM', 'Boaster'],
      breakoutPlayers: ['Secret', 'Chronicle', 'Leo']
    }
  },

  // Team statistics
  teamStats: {
    topTeams: [
      {
        id: '1',
        name: 'Sentinels',
        region: 'americas',
        ranking: 1,
        rating: 1.23,
        winRate: 81.25,
        mapWinRate: 78.4,
        matches: 32,
        achievements: 3,
        earnings: 450000,
        averageMatchDuration: 18.2,
        fanFollowing: 1234567
      },
      {
        id: '2',
        name: 'FNATIC',
        region: 'emea',
        ranking: 2,
        rating: 1.18,
        winRate: 79.41,
        mapWinRate: 76.5,
        matches: 34,
        achievements: 4,
        earnings: 380000,
        averageMatchDuration: 17.8,
        fanFollowing: 987654
      },
      {
        id: '3',
        name: 'Gen.G',
        region: 'apac',
        ranking: 3,
        rating: 1.15,
        winRate: 79.31,
        mapWinRate: 75.8,
        matches: 29,
        achievements: 2,
        earnings: 320000,
        averageMatchDuration: 16.9,
        fanFollowing: 756432
      },
      {
        id: '4',
        name: 'Cloud9',
        region: 'americas',
        ranking: 4,
        rating: 1.08,
        winRate: 70.97,
        mapWinRate: 68.2,
        matches: 31,
        achievements: 1,
        earnings: 280000,
        averageMatchDuration: 17.1,
        fanFollowing: 654321
      },
      {
        id: '5',
        name: 'Team Liquid',
        region: 'emea',
        ranking: 5,
        rating: 1.12,
        winRate: 75.0,
        mapWinRate: 72.1,
        matches: 28,
        achievements: 2,
        earnings: 250000,
        averageMatchDuration: 16.5,
        fanFollowing: 543210
      }
    ],
    regionalBreakdown: {
      americas: { teams: 28, winRateAvg: 54.7, topTeam: 'Sentinels' },
      emea: { teams: 31, winRateAvg: 51.2, topTeam: 'FNATIC' },
      apac: { teams: 30, winRateAvg: 49.8, topTeam: 'Gen.G' }
    },
    teamSizeDistribution: {
      5: { count: 67, percentage: 75.3 },
      6: { count: 18, percentage: 20.2 },
      7: { count: 4, percentage: 4.5 }
    }
  },

  // Hero statistics
  heroStats: [
    { 
      name: 'Iron Man', 
      role: 'dps',
      pickRate: 78.2, 
      winRate: 52.4, 
      banRate: 12.3,
      averageDamage: 18420,
      averageElims: 14.7,
      playTime: 2840, // hours
      difficulty: 'medium',
      meta: 'S-tier'
    },
    { 
      name: 'Spider-Man', 
      role: 'dps',
      pickRate: 62.8, 
      winRate: 49.2, 
      banRate: 8.9,
      averageDamage: 16230,
      averageElims: 13.2,
      playTime: 2156,
      difficulty: 'hard',
      meta: 'A-tier'
    },
    { 
      name: 'Doctor Strange', 
      role: 'support',
      pickRate: 58.1, 
      winRate: 53.7, 
      banRate: 15.6,
      averageDamage: 12580,
      averageElims: 8.9,
      playTime: 1987,
      difficulty: 'hard',
      meta: 'S-tier'
    },
    { 
      name: 'Captain America', 
      role: 'tank',
      pickRate: 45.2, 
      winRate: 50.8, 
      banRate: 6.7,
      averageDamage: 8940,
      averageElims: 6.3,
      playTime: 1654,
      difficulty: 'easy',
      meta: 'B-tier'
    },
    { 
      name: 'Storm', 
      role: 'dps',
      pickRate: 41.5, 
      winRate: 47.6, 
      banRate: 4.2,
      averageDamage: 15670,
      averageElims: 12.1,
      playTime: 1423,
      difficulty: 'medium',
      meta: 'B-tier'
    },
    { 
      name: 'Black Panther', 
      role: 'dps',
      pickRate: 48.6, 
      winRate: 51.2, 
      banRate: 7.8,
      averageDamage: 17890,
      averageElims: 13.8,
      playTime: 1789,
      difficulty: 'hard',
      meta: 'A-tier'
    },
    { 
      name: 'Hulk', 
      role: 'tank',
      pickRate: 52.4, 
      winRate: 48.9, 
      banRate: 9.2,
      averageDamage: 10560,
      averageElims: 7.1,
      playTime: 1934,
      difficulty: 'easy',
      meta: 'B-tier'
    },
    { 
      name: 'Luna Snow', 
      role: 'support',
      pickRate: 32.1, 
      winRate: 49.3, 
      banRate: 3.4,
      averageDamage: 8940,
      averageElims: 5.2,
      playTime: 1156,
      difficulty: 'medium',
      meta: 'C-tier'
    }
  ],

  // Map statistics
  mapStats: [
    { 
      name: 'Asgard', 
      type: 'Escort',
      playedCount: 387, 
      attackWinRate: 48.2, 
      defenseWinRate: 51.8,
      averageDuration: 18.4,
      mostPlayedHero: 'Iron Man',
      competitiveScore: 8.7
    },
    { 
      name: 'Wakanda', 
      type: 'Hybrid',
      playedCount: 342, 
      attackWinRate: 52.1, 
      defenseWinRate: 47.9,
      averageDuration: 16.8,
      mostPlayedHero: 'Black Panther',
      competitiveScore: 9.2
    },
    { 
      name: 'New York', 
      type: 'Assault',
      playedCount: 298, 
      attackWinRate: 49.5, 
      defenseWinRate: 50.5,
      averageDuration: 17.2,
      mostPlayedHero: 'Spider-Man',
      competitiveScore: 8.1
    },
    { 
      name: 'Tokyo', 
      type: 'Control',
      playedCount: 267, 
      attackWinRate: 51.4, 
      defenseWinRate: 48.6,
      averageDuration: 16.3,
      mostPlayedHero: 'Storm',
      competitiveScore: 7.9
    },
    { 
      name: 'Sakaar', 
      type: 'Escort',
      playedCount: 234, 
      attackWinRate: 47.8, 
      defenseWinRate: 52.2,
      averageDuration: 15.5,
      mostPlayedHero: 'Hulk',
      competitiveScore: 7.2
    },
    { 
      name: 'London', 
      type: 'Hybrid',
      playedCount: 189, 
      attackWinRate: 50.1, 
      defenseWinRate: 49.9,
      averageDuration: 14.7,
      mostPlayedHero: 'Doctor Strange',
      competitiveScore: 6.8
    }
  ],

  // Tournament statistics
  tournamentStats: {
    totalTournaments: 24,
    totalPrizePool: 2750000,
    averagePrizePool: 114583,
    largestTournament: {
      name: 'Marvel Rivals Championship 2025',
      prizePool: 1000000,
      teams: 16,
      viewers: 1234567
    },
    regionalDistribution: {
      global: { count: 6, prizePool: 1500000 },
      americas: { count: 7, prizePool: 450000 },
      emea: { count: 6, prizePool: 400000 },
      apac: { count: 5, prizePool: 400000 }
    },
    upcomingTournaments: [
      {
        name: 'Champions 2025',
        date: '2025-06-15',
        prizePool: 1000000,
        teams: 16,
        status: 'registration'
      },
      {
        name: 'Summer Showdown',
        date: '2025-07-10',
        prizePool: 150000,
        teams: 8,
        status: 'announced'
      }
    ],
    viewershipTrends: {
      peakConcurrent: 1234567,
      averageConcurrent: 234567,
      totalViewHours: 8900000,
      uniqueViewers: 3456789,
      chatMessages: 12345678
    }
  },

  // Advanced analytics
  analytics: {
    engagement: {
      matchCompletionRate: 94.7,
      averageViewDuration: 23.4, // minutes
      peakViewingHours: [18, 19, 20, 21], // UTC hours
      mobileViewership: 42.3,
      socialMediaMentions: 567890
    },
    performance: {
      serverUptime: 99.8,
      averageLatency: 23, // ms
      matchmakingTime: 2.1, // minutes
      bugReports: 234,
      playerSatisfaction: 8.7
    },
    economy: {
      totalEarnings: 2750000,
      averagePlayerEarnings: 6502,
      topEarner: { name: 'TenZ', earnings: 125000 },
      sponsorshipValue: 8900000,
      merchandiseSales: 1234567
    }
  }
};

// Cache and rate limiting
let cachedStats = new Map<string, any>();
let cacheTimestamp = new Map<string, number>();
const CACHE_DURATION = 180000; // 3 minutes for stats

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Filter data by time period
function filterByPeriod(data: any, period: string) {
  const filtered = JSON.parse(JSON.stringify(data)); // Deep clone
  
  const multipliers = {
    '24h': 0.03,
    '7d': 0.2,
    '30d': 0.8,
    '90d': 1.0,
    'season': 1.2,
    'all-time': 1.5
  };
  
  const multiplier = multipliers[period as keyof typeof multipliers] || 1.0;
  
  // Adjust counts based on period
  if (filtered.overview) {
    filtered.overview.totalMatches = Math.round(filtered.overview.totalMatches * multiplier);
    filtered.overview.totalViewHours = Math.round(filtered.overview.totalViewHours * multiplier);
  }
  
  return filtered;
}

// Filter data by region
function filterByRegion(data: any, region: string) {
  if (region === 'all' || region === 'global') return data;
  
  const filtered = JSON.parse(JSON.stringify(data));
  
  // Filter player stats by region (simplified)
  if (filtered.playerStats?.topPerformers) {
    filtered.playerStats.topPerformers = filtered.playerStats.topPerformers.slice(0, 5);
  }
  
  return filtered;
}

// Generate chart data
function generateChartData(data: any, type: string, granularity: string) {
  const charts = {
    overview: {
      matchesOverTime: data.timeline.matches.map((m: any) => ({
        date: m.date,
        matches: m.count,
        viewers: m.viewers
      })),
      growthMetrics: data.timeline.growth
    },
    players: {
      topPerformers: data.playerStats.topPerformers.slice(0, 10).map((p: any) => ({
        name: p.name,
        rating: p.rating,
        winRate: p.winRate
      })),
      roleDistribution: Object.entries(data.playerStats.roleDistribution).map(([role, stats]: [string, any]) => ({
        role,
        count: stats.count,
        percentage: stats.percentage
      }))
    },
    heroes: {
      pickRates: data.heroStats.slice(0, 10).map((h: any) => ({
        name: h.name,
        pickRate: h.pickRate,
        winRate: h.winRate
      })),
      metaTiers: data.heroStats.reduce((acc: any, hero: any) => {
        acc[hero.meta] = (acc[hero.meta] || 0) + 1;
        return acc;
      }, {})
    },
    maps: {
      playRates: data.mapStats.map((m: any) => ({
        name: m.name,
        played: m.playedCount,
        winRate: (m.attackWinRate + m.defenseWinRate) / 2
      })),
      durations: data.mapStats.map((m: any) => ({
        name: m.name,
        duration: m.averageDuration
      }))
    }
  };
  
  return charts[type as keyof typeof charts] || {};
}

// Export data as CSV
function exportAsCSV(data: any, type: string) {
  let csv = '';
  
  switch (type) {
    case 'players':
      csv = 'Name,Team,Rating,ACS,K/D,Win Rate,Matches\n';
      data.playerStats.topPerformers.forEach((player: any) => {
        csv += `${player.name},${player.team},${player.rating},${player.acs},${player.kd},${player.winRate},${player.matchesPlayed}\n`;
      });
      break;
    case 'heroes':
      csv = 'Hero,Role,Pick Rate,Win Rate,Ban Rate,Meta Tier\n';
      data.heroStats.forEach((hero: any) => {
        csv += `${hero.name},${hero.role},${hero.pickRate},${hero.winRate},${hero.banRate},${hero.meta}\n`;
      });
      break;
    case 'maps':
      csv = 'Map,Type,Played,Attack Win Rate,Defense Win Rate,Avg Duration\n';
      data.mapStats.forEach((map: any) => {
        csv += `${map.name},${map.type},${map.playedCount},${map.attackWinRate},${map.defenseWinRate},${map.averageDuration}\n`;
      });
      break;
    default:
      csv = 'Data export not available for this type';
  }
  
  return csv;
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    let validatedQuery;
    try {
      validatedQuery = statsQuerySchema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }
    }

    // Create cache key
    const cacheKey = `${validatedQuery.type}_${validatedQuery.period}_${validatedQuery.region}`;
    
    // Check cache
    const now = Date.now();
    const cached = cachedStats.get(cacheKey);
    const cacheTime = cacheTimestamp.get(cacheKey) || 0;
    
    let data;
    if (cached && (now - cacheTime) < CACHE_DURATION) {
      console.log(`[CACHE] Serving ${cacheKey} stats from cache`);
      data = cached;
    } else {
      // Generate fresh data
      data = filterByRegion(
        filterByPeriod(statsData, validatedQuery.period), 
        validatedQuery.region
      );
      
      cachedStats.set(cacheKey, data);
      cacheTimestamp.set(cacheKey, now);
      console.log(`[CACHE] Refreshed ${cacheKey} stats cache`);
    }

    // Handle CSV export
    if (validatedQuery.format === 'csv') {
      const csvData = exportAsCSV(data, validatedQuery.type);
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${validatedQuery.type}_stats.csv"`
        }
      });
    }

    // Generate chart data if requested
    let chartData = {};
    if (validatedQuery.includeCharts) {
      chartData = generateChartData(data, validatedQuery.type, validatedQuery.granularity);
    }

    // Mobile optimization
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    // Prepare response based on type
    let responseData: any = {};
    
    switch (validatedQuery.type) {
      case 'overview':
        responseData = {
          overview: data.overview,
          timeline: data.timeline,
          analytics: data.analytics
        };
        break;
      case 'players':
        responseData = {
          players: data.playerStats,
          overview: { totalPlayers: data.overview.totalPlayers }
        };
        break;
      case 'teams':
        responseData = {
          teams: data.teamStats,
          overview: { totalTeams: data.overview.totalTeams }
        };
        break;
      case 'heroes':
        responseData = {
          heroes: data.heroStats,
          meta: {
            totalHeroes: data.heroStats.length,
            averagePickRate: data.heroStats.reduce((sum: number, h: any) => sum + h.pickRate, 0) / data.heroStats.length
          }
        };
        break;
      case 'maps':
        responseData = {
          maps: data.mapStats,
          meta: {
            totalMaps: data.mapStats.length,
            averageDuration: data.mapStats.reduce((sum: number, m: any) => sum + m.averageDuration, 0) / data.mapStats.length
          }
        };
        break;
      case 'tournaments':
        responseData = {
          tournaments: data.tournamentStats,
          overview: { totalTournaments: data.overview.totalTournaments }
        };
        break;
      default:
        responseData = data;
    }

    // Mobile data reduction
    if (isMobile) {
      // Reduce data complexity for mobile
      if (responseData.players?.topPerformers) {
        responseData.players.topPerformers = responseData.players.topPerformers.slice(0, 10);
      }
      if (responseData.heroes) {
        responseData.heroes = responseData.heroes.slice(0, 12);
      }
      if (responseData.timeline?.matches) {
        responseData.timeline.matches = responseData.timeline.matches.slice(-14); // Last 2 weeks
      }
    }

    // Response
    return NextResponse.json({
      success: true,
      data: responseData,
      charts: validatedQuery.includeCharts ? chartData : undefined,
      filters: {
        applied: validatedQuery,
        available: {
          type: ['overview', 'players', 'teams', 'heroes', 'maps', 'tournaments'],
          period: ['24h', '7d', '30d', '90d', 'season', 'all-time'],
          region: ['americas', 'emea', 'apac', 'global'],
          granularity: ['daily', 'weekly', 'monthly']
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        cached: (now - cacheTime) < CACHE_DURATION,
        mobile: isMobile,
        period: validatedQuery.period,
        region: validatedQuery.region,
        dataPoints: responseData.timeline?.matches?.length || 0
      }
    });

  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Custom analytics query (Advanced users)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication for advanced analytics
    const body = await request.json();
    const { 
      metrics, 
      filters, 
      groupBy, 
      timeRange, 
      aggregation = 'sum' 
    } = body;
    
    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: 'Metrics array is required' },
        { status: 400 }
      );
    }

    // Custom analytics processing (simplified)
    const customStats = {
      query: body,
      results: {
        totalRecords: 1547,
        aggregatedData: metrics.map((metric: string) => ({
          metric,
          value: Math.round(Math.random() * 1000),
          trend: Math.random() > 0.5 ? 'up' : 'down',
          changePercent: Math.round((Math.random() * 20 - 10) * 100) / 100
        }))
      },
      executionTime: Math.round(Math.random() * 500 + 100), // ms
      cacheHit: false
    };

    console.log(`[ANALYTICS] Custom query executed: ${metrics.join(', ')}`);

    return NextResponse.json({
      success: true,
      analytics: customStats,
      meta: {
        timestamp: new Date().toISOString(),
        queryComplexity: 'medium',
        estimatedCost: 0.05 // Future billing
      }
    });

  } catch (error) {
    console.error('Custom analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Real-time stats update (WebSocket simulation)
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication for real-time updates
    const body = await request.json();
    const { type, data } = body;
    
    // Simulate real-time stat updates
    const updates = {
      matches: {
        newMatch: data.matchId,
        viewers: data.viewers || Math.round(Math.random() * 50000 + 10000),
        timestamp: new Date().toISOString()
      },
      players: {
        playerId: data.playerId,
        newRating: data.rating,
        matchResult: data.result,
        timestamp: new Date().toISOString()
      },
      tournaments: {
        tournamentId: data.tournamentId,
        status: data.status,
        viewers: data.viewers,
        timestamp: new Date().toISOString()
      }
    };

    // Clear relevant caches
    for (const [key] of cachedStats.entries()) {
      if (key.includes(type)) {
        cachedStats.delete(key);
        cacheTimestamp.delete(key);
      }
    }

    console.log(`[REAL-TIME] Stats updated for ${type}`);

    return NextResponse.json({
      success: true,
      update: updates[type as keyof typeof updates],
      meta: {
        timestamp: new Date().toISOString(),
        type,
        cacheCleared: true
      }
    });

  } catch (error) {
    console.error('Real-time update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
