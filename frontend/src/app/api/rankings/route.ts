import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const rankingsQuerySchema = z.object({
  type: z.enum(['teams', 'players', 'combined']).optional().default('teams'),
  region: z.enum(['americas', 'emea', 'apac', 'global', 'all']).optional().default('global'),
  period: z.enum(['current', '30d', '90d', 'season', 'all-time']).optional().default('current'),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  includeHistory: z.string().optional().transform(val => val === 'true'),
  includeStats: z.string().optional().transform(val => val === 'true')
});

// Comprehensive team rankings data
const teamRankings = [
  {
    id: 1,
    teamId: "1",
    name: "Sentinels",
    shortName: "SEN",
    logo: "/teams/sentinels-logo.png",
    rank: 1,
    previousRank: 1,
    peakRank: 1,
    points: 1250,
    previousPoints: 1245,
    pointsChange: 5,
    region: "americas",
    country: "United States",
    recentResults: ['W', 'W', 'W', 'W', 'W'],
    recentForm: {
      wins: 5,
      losses: 0,
      streak: { type: "win", count: 5 }
    },
    change: 0,
    changeDirection: "stable",
    lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    stats: {
      matchesPlayed: 32,
      winRate: 81.25,
      mapWinRate: 78.4,
      averageRating: 1.23,
      recentPerformance: 85.7
    },
    achievements: [
      { event: "Champions Tour 2025: Americas", placement: 1, points: 500 },
      { event: "Marvel Rivals Championship", placement: 2, points: 300 }
    ],
    nextMatch: {
      opponent: "FNATIC",
      date: "2025-05-25T18:00:00.000Z",
      importance: "high"
    },
    rankingHistory: [
      { date: "2025-05-01", rank: 1, points: 1200 },
      { date: "2025-05-08", rank: 1, points: 1225 },
      { date: "2025-05-15", rank: 1, points: 1240 },
      { date: "2025-05-22", rank: 1, points: 1250 }
    ]
  },
  {
    id: 2,
    teamId: "2",
    name: "FNATIC",
    shortName: "FNC",
    logo: "/teams/fnatic-logo.png",
    rank: 2,
    previousRank: 3,
    peakRank: 1,
    points: 1205,
    previousPoints: 1180,
    pointsChange: 25,
    region: "emea",
    country: "United Kingdom",
    recentResults: ['W', 'W', 'L', 'W', 'W'],
    recentForm: {
      wins: 4,
      losses: 1,
      streak: { type: "win", count: 2 }
    },
    change: 1,
    changeDirection: "up",
    lastUpdate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    stats: {
      matchesPlayed: 34,
      winRate: 79.41,
      mapWinRate: 76.5,
      averageRating: 1.18,
      recentPerformance: 82.3
    },
    achievements: [
      { event: "Champions Tour 2025: EMEA", placement: 1, points: 450 },
      { event: "MRVL EMEA Masters", placement: 1, points: 200 }
    ],
    nextMatch: {
      opponent: "Sentinels",
      date: "2025-05-25T18:00:00.000Z",
      importance: "high"
    },
    rankingHistory: [
      { date: "2025-05-01", rank: 4, points: 1120 },
      { date: "2025-05-08", rank: 3, points: 1150 },
      { date: "2025-05-15", rank: 3, points: 1180 },
      { date: "2025-05-22", rank: 2, points: 1205 }
    ]
  },
  {
    id: 3,
    teamId: "3",
    name: "Gen.G",
    shortName: "GEN",
    logo: "/teams/geng-logo.png",
    rank: 3,
    previousRank: 4,
    peakRank: 2,
    points: 1180,
    previousPoints: 1160,
    pointsChange: 20,
    region: "apac",
    country: "South Korea",
    recentResults: ['W', 'W', 'W', 'L', 'W'],
    recentForm: {
      wins: 4,
      losses: 1,
      streak: { type: "win", count: 1 }
    },
    change: 1,
    changeDirection: "up",
    lastUpdate: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    stats: {
      matchesPlayed: 29,
      winRate: 79.31,
      mapWinRate: 75.8,
      averageRating: 1.15,
      recentPerformance: 80.1
    },
    achievements: [
      { event: "Champions Tour 2025: APAC", placement: 1, points: 400 },
      { event: "MRVL APAC Open", placement: 1, points: 150 }
    ],
    nextMatch: {
      opponent: "DRX",
      date: "2025-05-30T16:00:00.000Z",
      importance: "medium"
    },
    rankingHistory: [
      { date: "2025-05-01", rank: 5, points: 1100 },
      { date: "2025-05-08", rank: 4, points: 1130 },
      { date: "2025-05-15", rank: 4, points: 1160 },
      { date: "2025-05-22", rank: 3, points: 1180 }
    ]
  },
  {
    id: 4,
    teamId: "4",
    name: "Cloud9",
    shortName: "C9",
    logo: "/teams/cloud9-logo.png",
    rank: 4,
    previousRank: 2,
    peakRank: 2,
    points: 1150,
    previousPoints: 1190,
    pointsChange: -40,
    region: "americas",
    country: "United States",
    recentResults: ['W', 'L', 'W', 'W', 'L'],
    recentForm: {
      wins: 3,
      losses: 2,
      streak: { type: "loss", count: 1 }
    },
    change: -2,
    changeDirection: "down",
    lastUpdate: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    stats: {
      matchesPlayed: 31,
      winRate: 70.97,
      mapWinRate: 68.2,
      averageRating: 1.08,
      recentPerformance: 65.4
    },
    achievements: [
      { event: "MRVL Spring Invitational", placement: 2, points: 250 },
      { event: "Americas Qualifier", placement: 3, points: 150 }
    ],
    nextMatch: {
      opponent: "100 Thieves",
      date: "2025-05-28T20:00:00.000Z",
      importance: "medium"
    },
    rankingHistory: [
      { date: "2025-05-01", rank: 3, points: 1170 },
      { date: "2025-05-08", rank: 2, points: 1190 },
      { date: "2025-05-15", rank: 2, points: 1185 },
      { date: "2025-05-22", rank: 4, points: 1150 }
    ]
  },
  {
    id: 5,
    teamId: "5",
    name: "Team Liquid",
    shortName: "TL",
    logo: "/teams/liquid-logo.png",
    rank: 5,
    previousRank: 6,
    peakRank: 3,
    points: 1120,
    previousPoints: 1100,
    pointsChange: 20,
    region: "emea",
    country: "Netherlands",
    recentResults: ['L', 'W', 'W', 'W', 'W'],
    recentForm: {
      wins: 4,
      losses: 1,
      streak: { type: "win", count: 4 }
    },
    change: 1,
    changeDirection: "up",
    lastUpdate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    stats: {
      matchesPlayed: 28,
      winRate: 75.0,
      mapWinRate: 72.1,
      averageRating: 1.12,
      recentPerformance: 78.9
    },
    achievements: [
      { event: "EMEA Qualifier", placement: 2, points: 200 },
      { event: "Spring Series", placement: 1, points: 180 }
    ],
    nextMatch: {
      opponent: "G2 Esports",
      date: "2025-05-27T16:00:00.000Z",
      importance: "medium"
    },
    rankingHistory: [
      { date: "2025-05-01", rank: 8, points: 1020 },
      { date: "2025-05-08", rank: 7, points: 1050 },
      { date: "2025-05-15", rank: 6, points: 1100 },
      { date: "2025-05-22", rank: 5, points: 1120 }
    ]
  }
];

// Player rankings data
const playerRankings = [
  {
    id: 1,
    playerId: "101",
    name: "TenZ",
    team: "Sentinels",
    teamLogo: "/teams/sentinels-logo.png",
    rank: 1,
    previousRank: 1,
    peakRank: 1,
    rating: 1.42,
    previousRating: 1.40,
    ratingChange: 0.02,
    region: "americas",
    country: "Canada",
    role: "dps",
    stats: {
      acs: 285,
      kd: 1.8,
      winRate: 81.25,
      matchesPlayed: 32,
      clutchSuccess: 67.5
    },
    recentForm: 9.2,
    change: 0,
    changeDirection: "stable",
    rankingHistory: [
      { date: "2025-05-01", rank: 1, rating: 1.38 },
      { date: "2025-05-08", rank: 1, rating: 1.39 },
      { date: "2025-05-15", rank: 1, rating: 1.41 },
      { date: "2025-05-22", rank: 1, rating: 1.42 }
    ]
  },
  {
    id: 2,
    playerId: "301",
    name: "Meteor",
    team: "Gen.G",
    teamLogo: "/teams/geng-logo.png",
    rank: 2,
    previousRank: 3,
    peakRank: 2,
    rating: 1.38,
    previousRating: 1.35,
    ratingChange: 0.03,
    region: "apac",
    country: "South Korea",
    role: "dps",
    stats: {
      acs: 278,
      kd: 1.7,
      winRate: 79.31,
      matchesPlayed: 29,
      clutchSuccess: 71.2
    },
    recentForm: 8.9,
    change: 1,
    changeDirection: "up",
    rankingHistory: [
      { date: "2025-05-01", rank: 4, rating: 1.31 },
      { date: "2025-05-08", rank: 3, rating: 1.33 },
      { date: "2025-05-15", rank: 3, rating: 1.35 },
      { date: "2025-05-22", rank: 2, rating: 1.38 }
    ]
  },
  {
    id: 3,
    playerId: "201",
    name: "Boaster",
    team: "FNATIC",
    teamLogo: "/teams/fnatic-logo.png",
    rank: 3,
    previousRank: 2,
    peakRank: 1,
    rating: 1.35,
    previousRating: 1.37,
    ratingChange: -0.02,
    region: "emea",
    country: "United Kingdom",
    role: "igl",
    stats: {
      acs: 245,
      kd: 1.3,
      winRate: 79.41,
      matchesPlayed: 34,
      clutchSuccess: 48.9
    },
    recentForm: 8.4,
    change: -1,
    changeDirection: "down",
    rankingHistory: [
      { date: "2025-05-01", rank: 3, rating: 1.32 },
      { date: "2025-05-08", rank: 2, rating: 1.35 },
      { date: "2025-05-15", rank: 2, rating: 1.37 },
      { date: "2025-05-22", rank: 3, rating: 1.35 }
    ]
  },
  {
    id: 4,
    playerId: "401",
    name: "leaf",
    team: "Cloud9",
    teamLogo: "/teams/cloud9-logo.png",
    rank: 4,
    previousRank: 5,
    peakRank: 3,
    rating: 1.32,
    previousRating: 1.29,
    ratingChange: 0.03,
    region: "americas",
    country: "United States",
    role: "dps",
    stats: {
      acs: 268,
      kd: 1.5,
      winRate: 70.97,
      matchesPlayed: 31,
      clutchSuccess: 58.3
    },
    recentForm: 7.8,
    change: 1,
    changeDirection: "up",
    rankingHistory: [
      { date: "2025-05-01", rank: 6, rating: 1.25 },
      { date: "2025-05-08", rank: 5, rating: 1.27 },
      { date: "2025-05-15", rank: 5, rating: 1.29 },
      { date: "2025-05-22", rank: 4, rating: 1.32 }
    ]
  },
  {
    id: 5,
    playerId: "202",
    name: "Derke",
    team: "FNATIC",
    teamLogo: "/teams/fnatic-logo.png",
    rank: 5,
    previousRank: 4,
    peakRank: 2,
    rating: 1.31,
    previousRating: 1.33,
    ratingChange: -0.02,
    region: "emea",
    country: "Finland",
    role: "dps",
    stats: {
      acs: 274,
      kd: 1.6,
      winRate: 79.41,
      matchesPlayed: 34,
      clutchSuccess: 62.1
    },
    recentForm: 8.1,
    change: -1,
    changeDirection: "down",
    rankingHistory: [
      { date: "2025-05-01", rank: 5, rating: 1.28 },
      { date: "2025-05-08", rank: 4, rating: 1.31 },
      { date: "2025-05-15", rank: 4, rating: 1.33 },
      { date: "2025-05-22", rank: 5, rating: 1.31 }
    ]
  }
];

// Cache and rate limiting
let cachedRankings = new Map<string, any>();
let cacheTimestamp = new Map<string, number>();
const CACHE_DURATION = 300000; // 5 minutes

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 60;
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

// Filter rankings by region
function filterByRegion(rankings: any[], region: string) {
  if (region === 'all' || region === 'global') return rankings;
  return rankings.filter(item => item.region === region);
}

// Filter rankings by time period
function filterByPeriod(rankings: any[], period: string) {
  // In a real implementation, this would filter based on actual time periods
  return rankings;
}

// Calculate ranking statistics
function calculateRankingStats(teams: any[], players: any[]) {
  return {
    totalTeams: teams.length,
    totalPlayers: players.length,
    regionBreakdown: {
      teams: teams.reduce((acc: any, team) => {
        acc[team.region] = (acc[team.region] || 0) + 1;
        return acc;
      }, {}),
      players: players.reduce((acc: any, player) => {
        acc[player.region] = (acc[player.region] || 0) + 1;
        return acc;
      }, {})
    },
    movements: {
      teamMovements: {
        up: teams.filter(t => t.changeDirection === 'up').length,
        down: teams.filter(t => t.changeDirection === 'down').length,
        stable: teams.filter(t => t.changeDirection === 'stable').length
      },
      playerMovements: {
        up: players.filter(p => p.changeDirection === 'up').length,
        down: players.filter(p => p.changeDirection === 'down').length,
        stable: players.filter(p => p.changeDirection === 'stable').length
      }
    },
    averageStats: {
      teamWinRate: teams.reduce((sum, team) => sum + (team.stats?.winRate || 0), 0) / teams.length,
      playerRating: players.reduce((sum, player) => sum + player.rating, 0) / players.length
    }
  };
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
      validatedQuery = rankingsQuerySchema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }
    }

    // Create cache key
    const cacheKey = `${validatedQuery.type}_${validatedQuery.region}_${validatedQuery.period}`;
    
    // Check cache
    const now = Date.now();
    const cached = cachedRankings.get(cacheKey);
    const cacheTime = cacheTimestamp.get(cacheKey) || 0;
    
    if (cached && (now - cacheTime) < CACHE_DURATION) {
      console.log(`[CACHE] Serving ${cacheKey} rankings from cache`);
    } else {
      // Refresh cache
      let teams = filterByRegion(filterByPeriod([...teamRankings], validatedQuery.period), validatedQuery.region);
      let players = filterByRegion(filterByPeriod([...playerRankings], validatedQuery.period), validatedQuery.region);
      
      cachedRankings.set(cacheKey, { teams, players });
      cacheTimestamp.set(cacheKey, now);
      console.log(`[CACHE] Refreshed ${cacheKey} rankings cache`);
    }

    const { teams, players } = cachedRankings.get(cacheKey);

    // Apply limit
    let limitedTeams = teams.slice(0, validatedQuery.limit);
    let limitedPlayers = players.slice(0, validatedQuery.limit);

    // Mobile optimization
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile && !validatedQuery.includeStats) {
      // Reduce data for mobile
      limitedTeams = limitedTeams.map((team: any) => ({
        id: team.id,
        name: team.shortName || team.name,
        logo: team.logo,
        rank: team.rank,
        change: team.change,
        changeDirection: team.changeDirection,
        points: team.points,
        region: team.region,
        recentResults: team.recentResults.slice(0, 3)
      }));

      limitedPlayers = limitedPlayers.map((player: any) => ({
        id: player.id,
        name: player.name,
        team: player.team,
        teamLogo: player.teamLogo,
        rank: player.rank,
        change: player.change,
        rating: player.rating,
        role: player.role
      }));
    }

    // Remove history data if not requested
    if (!validatedQuery.includeHistory) {
      limitedTeams = limitedTeams.map((team: any) => {
        const { rankingHistory, ...teamWithoutHistory } = team;
        return teamWithoutHistory;
      });
      limitedPlayers = limitedPlayers.map((player: any) => {
        const { rankingHistory, ...playerWithoutHistory } = player;
        return playerWithoutHistory;
      });
    }

    // Calculate statistics
    const stats = calculateRankingStats(teams, players);

    // Prepare response based on type
    let responseData: any = {};
    
    if (validatedQuery.type === 'teams') {
      responseData.rankings = limitedTeams;
    } else if (validatedQuery.type === 'players') {
      responseData.rankings = limitedPlayers;
    } else {
      responseData.teamRankings = limitedTeams;
      responseData.playerRankings = limitedPlayers;
    }

    // Response
    return NextResponse.json({
      success: true,
      ...responseData,
      filters: {
        applied: validatedQuery,
        available: {
          type: ['teams', 'players', 'combined'],
          region: ['americas', 'emea', 'apac', 'global'],
          period: ['current', '30d', '90d', 'season', 'all-time']
        }
      },
      stats,
      meta: {
        timestamp: new Date().toISOString(),
        cached: (now - cacheTime) < CACHE_DURATION,
        mobile: isMobile,
        totalResults: validatedQuery.type === 'teams' ? teams.length : 
                     validatedQuery.type === 'players' ? players.length : 
                     teams.length + players.length
      }
    });

  } catch (error) {
    console.error('Rankings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update rankings (Admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const body = await request.json();
    const { type, updates } = body;
    
    if (!type || !updates) {
      return NextResponse.json(
        { error: 'Missing required fields: type and updates' },
        { status: 400 }
      );
    }

    if (type === 'teams') {
      // Update team rankings
      updates.forEach((update: any) => {
        const teamIndex = teamRankings.findIndex(t => t.id === update.id);
        if (teamIndex !== -1) {
          teamRankings[teamIndex] = { ...teamRankings[teamIndex], ...update };
          teamRankings[teamIndex].lastUpdate = new Date().toISOString();
        }
      });
    } else if (type === 'players') {
      // Update player rankings
      updates.forEach((update: any) => {
        const playerIndex = playerRankings.findIndex(p => p.id === update.id);
        if (playerIndex !== -1) {
          playerRankings[playerIndex] = { ...playerRankings[playerIndex], ...update };
        }
      });
    }

    // Clear cache
    cachedRankings.clear();
    cacheTimestamp.clear();

    console.log(`[ADMIN] Rankings updated for ${type}: ${updates.length} entries`);

    return NextResponse.json({
      success: true,
      message: `${type} rankings updated successfully`,
      updatedCount: updates.length
    });

  } catch (error) {
    console.error('Update rankings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
