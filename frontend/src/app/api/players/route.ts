import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const playersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  role: z.enum(['dps', 'tank', 'support', 'flex', 'igl', 'all']).optional().default('all'),
  team: z.string().optional(),
  region: z.enum(['americas', 'emea', 'apac', 'global', 'all']).optional().default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['ranking', 'winrate', 'kd', 'damage', 'name']).optional().default('ranking'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  minRank: z.string().optional().transform(val => val ? parseInt(val) : 1),
  maxRank: z.string().optional().transform(val => val ? parseInt(val) : 100)
});

// Elite players database - minimal but comprehensive
const playersData = [
  {
    id: "101",
    name: "TenZ",
    fullName: "Tyson Ngo",
    team: {
      id: "1",
      name: "Sentinels",
      shortName: "SEN",
      logo: "/teams/sentinels-logo.png",
      region: "americas"
    },
    role: "dps",
    country: "Canada",
    region: "americas",
    age: 23,
    avatar: "/players/tenz.png",
    heroPool: ["Iron Man", "Spider-Man", "Black Panther"],
    primaryHero: "Iron Man",
    stats: {
      matches: 32,
      winRate: 81.2,
      averageDamage: 184,
      eliminations: 22.7,
      deaths: 12.6,
      kd: 1.8,
      assists: 6.8,
      firstElimRate: 28.4,
      clutchSuccess: 67.5,
      ultimateSuccess: 89.3
    },
    ranking: 1,
    previousRank: 1,
    rankChange: 0,
    peakRank: 1,
    achievements: [
      "Champions 2025 MVP",
      "Most eliminations record (42)",
      "Highest damage average"
    ],
    social: {
      twitter: "https://twitter.com/TenZOfficial",
      twitch: "https://twitch.tv/TenZ",
      instagram: "https://instagram.com/TenZOfficial"
    },
    contract: {
      salary: "undisclosed",
      expires: "2026-12-31",
      buyout: "undisclosed"
    },
    marketValue: "high",
    status: "active",
    lastPlayed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
  },
  {
    id: "102",
    name: "ShahZaM",
    fullName: "Shahzeb Khan",
    team: {
      id: "1",
      name: "Sentinels",
      shortName: "SEN",
      logo: "/teams/sentinels-logo.png",
      region: "americas"
    },
    role: "igl",
    country: "United States",
    region: "americas",
    age: 28,
    avatar: "/players/shahzam.png",
    heroPool: ["Doctor Strange", "Storm", "Luna Snow"],
    primaryHero: "Doctor Strange",
    stats: {
      matches: 32,
      winRate: 81.2,
      averageDamage: 142,
      eliminations: 16.3,
      deaths: 11.2,
      kd: 1.45,
      assists: 12.1,
      firstElimRate: 18.6,
      clutchSuccess: 54.2,
      ultimateSuccess: 76.8
    },
    ranking: 12,
    previousRank: 15,
    rankChange: 3,
    peakRank: 8,
    achievements: [
      "Best IGL Americas 2025",
      "Tactical Innovation Award",
      "Leadership Excellence"
    ],
    social: {
      twitter: "https://twitter.com/ShahZaMk",
      twitch: "https://twitch.tv/ShahZaM",
      instagram: "https://instagram.com/ShahZaMk"
    },
    contract: {
      salary: "undisclosed",
      expires: "2025-11-30",
      buyout: "undisclosed"
    },
    marketValue: "medium",
    status: "active",
    lastPlayed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "201",
    name: "Boaster",
    fullName: "Jake Howlett",
    team: {
      id: "2",
      name: "FNATIC",
      shortName: "FNC",
      logo: "/teams/fnatic-logo.png",
      region: "emea"
    },
    role: "igl",
    country: "United Kingdom",
    region: "emea",
    age: 25,
    avatar: "/players/boaster.png",
    heroPool: ["Doctor Strange", "Luna Snow", "Storm"],
    primaryHero: "Doctor Strange",
    stats: {
      matches: 34,
      winRate: 79.4,
      averageDamage: 126,
      eliminations: 14.2,
      deaths: 10.9,
      kd: 1.3,
      assists: 12.6,
      firstElimRate: 12.8,
      clutchSuccess: 48.9,
      ultimateSuccess: 82.1
    },
    ranking: 8,
    previousRank: 9,
    rankChange: 1,
    peakRank: 5,
    achievements: [
      "EMEA Champions 2025",
      "Most assists tournament record",
      "Tactical Mastermind Award"
    ],
    social: {
      twitter: "https://twitter.com/boaster",
      twitch: "https://twitch.tv/boaster",
      instagram: "https://instagram.com/boastergg"
    },
    contract: {
      salary: "undisclosed",
      expires: "2026-06-30",
      buyout: "undisclosed"
    },
    marketValue: "high",
    status: "active",
    lastPlayed: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  },
  {
    id: "301",
    name: "Meteor",
    fullName: "Park Min-Seok",
    team: {
      id: "3",
      name: "Gen.G",
      shortName: "GEN",
      logo: "/teams/geng-logo.png",
      region: "apac"
    },
    role: "dps",
    country: "South Korea",
    region: "apac",
    age: 22,
    avatar: "/players/meteor.png",
    heroPool: ["Iron Man", "Luna Snow", "Captain America"],
    primaryHero: "Iron Man",
    stats: {
      matches: 29,
      winRate: 79.3,
      averageDamage: 176,
      eliminations: 21.3,
      deaths: 12.5,
      kd: 1.7,
      assists: 5.9,
      firstElimRate: 26.1,
      clutchSuccess: 71.2,
      ultimateSuccess: 85.7
    },
    ranking: 3,
    previousRank: 4,
    rankChange: 1,
    peakRank: 2,
    achievements: [
      "APAC MVP 2025",
      "Rising Star Award",
      "Mechanical Excellence"
    ],
    social: {
      twitter: "https://twitter.com/Meteor_GG",
      twitch: "https://twitch.tv/MeteorGG",
      instagram: "https://instagram.com/meteor_official"
    },
    contract: {
      salary: "undisclosed",
      expires: "2027-01-31",
      buyout: "undisclosed"
    },
    marketValue: "very-high",
    status: "active",
    lastPlayed: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() // 12 hours ago
  },
  {
    id: "401",
    name: "leaf",
    fullName: "Nathan Orf",
    team: {
      id: "4",
      name: "Cloud9",
      shortName: "C9",
      logo: "/teams/cloud9-logo.png",
      region: "americas"
    },
    role: "dps",
    country: "United States",
    region: "americas",
    age: 20,
    avatar: "/players/leaf.png",
    heroPool: ["Black Panther", "Spider-Man", "Captain America"],
    primaryHero: "Black Panther",
    stats: {
      matches: 31,
      winRate: 70.9,
      averageDamage: 168,
      eliminations: 19.8,
      deaths: 13.2,
      kd: 1.5,
      assists: 5.2,
      firstElimRate: 24.8,
      clutchSuccess: 58.3,
      ultimateSuccess: 79.6
    },
    ranking: 5,
    previousRank: 6,
    rankChange: 1,
    peakRank: 3,
    achievements: [
      "Rookie of the Year 2024",
      "Breakout Player Award",
      "Consistency Excellence"
    ],
    social: {
      twitter: "https://twitter.com/leaf_fps",
      twitch: "https://twitch.tv/leaf",
      instagram: "https://instagram.com/leaf_fps"
    },
    contract: {
      salary: "undisclosed",
      expires: "2026-03-31",
      buyout: "undisclosed"
    },
    marketValue: "high",
    status: "active",
    lastPlayed: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() // 18 hours ago
  }
];

// Cache and rate limiting
let cachedPlayers: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 300000; // 5 minutes

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 100;
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

// Search functionality
function searchPlayers(players: any[], searchTerm: string) {
  const term = searchTerm.toLowerCase();
  return players.filter(player => 
    player.name.toLowerCase().includes(term) ||
    player.fullName.toLowerCase().includes(term) ||
    player.team.name.toLowerCase().includes(term) ||
    player.country.toLowerCase().includes(term) ||
    player.heroPool.some((hero: string) => hero.toLowerCase().includes(term))
  );
}

// Filter players
function filterPlayers(players: any[], filters: any) {
  let filtered = [...players];

  // Role filter
  if (filters.role !== 'all') {
    filtered = filtered.filter(player => player.role === filters.role);
  }

  // Region filter
  if (filters.region !== 'all') {
    filtered = filtered.filter(player => player.region === filters.region);
  }

  // Team filter
  if (filters.team) {
    const teamTerm = filters.team.toLowerCase();
    filtered = filtered.filter(player => 
      player.team.id === filters.team ||
      player.team.name.toLowerCase().includes(teamTerm) ||
      player.team.shortName.toLowerCase().includes(teamTerm)
    );
  }

  // Rank range filter
  filtered = filtered.filter(player => 
    player.ranking >= filters.minRank && player.ranking <= filters.maxRank
  );

  // Search filter
  if (filters.search) {
    filtered = searchPlayers(filtered, filters.search);
  }

  return filtered;
}

// Sort players
function sortPlayers(players: any[], sortBy: string, sortOrder: string) {
  return players.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'ranking':
        aValue = a.ranking;
        bValue = b.ranking;
        break;
      case 'winrate':
        aValue = a.stats.winRate;
        bValue = b.stats.winRate;
        break;
      case 'kd':
        aValue = a.stats.kd;
        bValue = b.stats.kd;
        break;
      case 'damage':
        aValue = a.stats.averageDamage;
        bValue = b.stats.averageDamage;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        aValue = a.ranking;
        bValue = b.ranking;
    }

    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
}

// Paginate results
function paginateResults(players: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedPlayers = players.slice(startIndex, endIndex);

  return {
    players: paginatedPlayers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(players.length / limit),
      totalPlayers: players.length,
      hasNextPage: endIndex < players.length,
      hasPreviousPage: page > 1,
      limit
    }
  };
}

// Calculate player stats
function getPlayerStats() {
  const avgStats = playersData.reduce((acc, player) => ({
    winRate: acc.winRate + player.stats.winRate,
    kd: acc.kd + player.stats.kd,
    damage: acc.damage + player.stats.averageDamage
  }), { winRate: 0, kd: 0, damage: 0 });

  const playerCount = playersData.length;
  
  return {
    totalPlayers: playerCount,
    averageStats: {
      winRate: Math.round((avgStats.winRate / playerCount) * 100) / 100,
      kd: Math.round((avgStats.kd / playerCount) * 100) / 100,
      damage: Math.round(avgStats.damage / playerCount)
    },
    regionDistribution: playersData.reduce((acc: any, player) => {
      acc[player.region] = (acc[player.region] || 0) + 1;
      return acc;
    }, {}),
    roleDistribution: playersData.reduce((acc: any, player) => {
      acc[player.role] = (acc[player.role] || 0) + 1;
      return acc;
    }, {}),
    topPerformers: {
      highestKD: playersData.sort((a, b) => b.stats.kd - a.stats.kd)[0],
      highestWinRate: playersData.sort((a, b) => b.stats.winRate - a.stats.winRate)[0],
      highestDamage: playersData.sort((a, b) => b.stats.averageDamage - a.stats.averageDamage)[0]
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
      validatedQuery = playersQuerySchema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }
    }

    // Check cache for performance
    const now = Date.now();
    if (cachedPlayers.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[CACHE] Serving players from cache');
    } else {
      cachedPlayers = [...playersData];
      cacheTimestamp = now;
      console.log('[CACHE] Refreshed players cache');
    }

    // Filter players
    let filteredPlayers = filterPlayers(cachedPlayers, validatedQuery);

    // Sort players
    filteredPlayers = sortPlayers(
      filteredPlayers, 
      validatedQuery.sortBy, 
      validatedQuery.sortOrder
    );

    // Paginate results
    const result = paginateResults(
      filteredPlayers, 
      validatedQuery.page, 
      validatedQuery.limit
    );

    // Get player statistics
    const playerStats = getPlayerStats();

    // Mobile optimization - reduce data for mobile clients
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      // Reduce data for mobile
      result.players = result.players.map(player => ({
        id: player.id,
        name: player.name,
        team: {
          name: player.team.shortName || player.team.name,
          logo: player.team.logo
        },
        role: player.role,
        country: player.country,
        avatar: player.avatar,
        primaryHero: player.primaryHero,
        stats: {
          winRate: player.stats.winRate,
          kd: player.stats.kd,
          averageDamage: player.stats.averageDamage
        },
        ranking: player.ranking,
        rankChange: player.rankChange
      }));
    }

    // Response
    return NextResponse.json({
      success: true,
      data: result.players,
      pagination: result.pagination,
      filters: {
        applied: validatedQuery,
        available: {
          role: ['dps', 'tank', 'support', 'flex', 'igl'],
          region: ['americas', 'emea', 'apac', 'global'],
          sortBy: ['ranking', 'winrate', 'kd', 'damage', 'name'],
          sortOrder: ['asc', 'desc']
        }
      },
      stats: playerStats,
      meta: {
        timestamp: new Date().toISOString(),
        cached: (now - cacheTimestamp) < CACHE_DURATION,
        mobile: isMobile
      }
    });

  } catch (error) {
    console.error('Players API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Player comparison endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerIds } = body;
    
    if (!playerIds || !Array.isArray(playerIds) || playerIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 player IDs required for comparison' },
        { status: 400 }
      );
    }

    if (playerIds.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 players can be compared at once' },
        { status: 400 }
      );
    }

    // Find players
    const players = playerIds.map((id: string) => 
      playersData.find(player => player.id === id)
    ).filter(Boolean);

    if (players.length !== playerIds.length) {
      return NextResponse.json(
        { error: 'One or more players not found' },
        { status: 404 }
      );
    }

    // Calculate comparison metrics
    const comparison = {
      players,
      headToHead: {
        winRate: {
          highest: players.sort((a, b) => b.stats.winRate - a.stats.winRate)[0],
          lowest: players.sort((a, b) => a.stats.winRate - b.stats.winRate)[0]
        },
        kd: {
          highest: players.sort((a, b) => b.stats.kd - a.stats.kd)[0],
          lowest: players.sort((a, b) => a.stats.kd - b.stats.kd)[0]
        },
        damage: {
          highest: players.sort((a, b) => b.stats.averageDamage - a.stats.averageDamage)[0],
          lowest: players.sort((a, b) => a.stats.averageDamage - b.stats.averageDamage)[0]
        }
      },
      commonStats: ['winRate', 'kd', 'averageDamage', 'eliminations', 'assists'],
      analysis: `Comparing ${players.length} players across key performance metrics`
    };

    console.log(`[COMPARISON] Generated comparison for players: ${playerIds.join(', ')}`);

    return NextResponse.json({
      success: true,
      comparison,
      meta: {
        timestamp: new Date().toISOString(),
        playersCompared: players.length
      }
    });

  } catch (error) {
    console.error('Player comparison error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
