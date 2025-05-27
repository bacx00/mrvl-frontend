import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const teamsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  region: z.enum(['americas', 'emea', 'apac', 'global', 'all']).optional().default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['ranking', 'name', 'winrate', 'points']).optional().default('ranking'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  minRank: z.string().optional().transform(val => val ? parseInt(val) : 1),
  maxRank: z.string().optional().transform(val => val ? parseInt(val) : 100),
  includeStats: z.string().optional().transform(val => val === 'true')
});

// Elite teams database - comprehensive but minimal
const teamsData = [
  {
    id: "1",
    name: "Sentinels",
    shortName: "SEN",
    tag: "SEN",
    logo: "/teams/sentinels-logo.png",
    bannerImage: "/teams/sentinels-banner.jpg",
    country: "United States",
    region: "americas",
    city: "Los Angeles",
    founded: "2018-04-01",
    ranking: 1,
    previousRank: 1,
    rankChange: 0,
    peakRank: 1,
    rankingPoints: 1250,
    verified: true,
    status: "active",
    organization: {
      name: "Sentinels",
      website: "https://sentinels.gg",
      ceo: "Rob Moore",
      headquarters: "Los Angeles, CA"
    },
    socials: {
      twitter: "https://twitter.com/Sentinels",
      website: "https://sentinels.gg",
      discord: "https://discord.gg/sentinels",
      youtube: "https://youtube.com/sentinels",
      instagram: "https://instagram.com/sentinels"
    },
    roster: [
      { 
        id: "101", 
        name: "TenZ", 
        role: "dps", 
        country: "Canada", 
        joinDate: "2023-12-15",
        captain: false,
        substitute: false
      },
      { 
        id: "102", 
        name: "ShahZaM", 
        role: "igl", 
        country: "United States", 
        joinDate: "2023-12-15",
        captain: true,
        substitute: false
      },
      { 
        id: "103", 
        name: "SicK", 
        role: "flex", 
        country: "United States", 
        joinDate: "2023-12-15",
        captain: false,
        substitute: false
      },
      { 
        id: "104", 
        name: "dapr", 
        role: "support", 
        country: "United States", 
        joinDate: "2023-12-15",
        captain: false,
        substitute: false
      },
      { 
        id: "105", 
        name: "zombs", 
        role: "support", 
        country: "United States", 
        joinDate: "2023-12-15",
        captain: false,
        substitute: false
      }
    ],
    coaching: {
      headCoach: "rawkus",
      assistantCoach: "kaplan",
      analyst: "tenz_coach"
    },
    stats: {
      matchesPlayed: 32,
      matchesWon: 26,
      matchesLost: 6,
      winRate: 81.25,
      mapWinRate: 78.4,
      averageRating: 1.23,
      averageMapScore: { won: 13, lost: 9 },
      currentStreak: { type: "win", count: 5 },
      bestMap: "Asgard",
      worstMap: "Sakaar"
    },
    achievements: [
      { title: "Champions Tour 2025: Americas", placement: "1st", date: "2025-05-10", prize: 100000 },
      { title: "Marvel Rivals Championship Spring", placement: "2nd", date: "2025-04-15", prize: 75000 },
      { title: "MRVL Invitational 2025", placement: "1st", date: "2025-03-01", prize: 50000 }
    ],
    sponsors: [
      { name: "Red Bull", logo: "/sponsors/redbull-logo.png", tier: "title" },
      { name: "Logitech", logo: "/sponsors/logitech-logo.png", tier: "official" }
    ],
    fanStats: {
      followers: 1234567,
      engagement: 8.5,
      merchandise: "available"
    },
    marketValue: "very-high",
    lastActivity: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    nextMatch: {
      opponent: "FNATIC",
      date: "2025-05-25T18:00:00.000Z",
      event: "Marvel Rivals Championship"
    }
  },
  {
    id: "2",
    name: "FNATIC",
    shortName: "FNC",
    tag: "FNC",
    logo: "/teams/fnatic-logo.png",
    bannerImage: "/teams/fnatic-banner.jpg",
    country: "United Kingdom",
    region: "emea",
    city: "London",
    founded: "2004-07-23",
    ranking: 2,
    previousRank: 3,
    rankChange: 1,
    peakRank: 1,
    rankingPoints: 1205,
    verified: true,
    status: "active",
    organization: {
      name: "Fnatic",
      website: "https://fnatic.com",
      ceo: "Sam Mathews",
      headquarters: "London, UK"
    },
    socials: {
      twitter: "https://twitter.com/FNATIC",
      website: "https://fnatic.com",
      discord: "https://discord.gg/fnatic",
      youtube: "https://youtube.com/fnatic",
      instagram: "https://instagram.com/fnatic"
    },
    roster: [
      { 
        id: "201", 
        name: "Boaster", 
        role: "igl", 
        country: "United Kingdom", 
        joinDate: "2023-11-20",
        captain: true,
        substitute: false
      },
      { 
        id: "202", 
        name: "Derke", 
        role: "dps", 
        country: "Finland", 
        joinDate: "2023-11-20",
        captain: false,
        substitute: false
      },
      { 
        id: "203", 
        name: "Alfajer", 
        role: "dps", 
        country: "Turkey", 
        joinDate: "2023-11-20",
        captain: false,
        substitute: false
      },
      { 
        id: "204", 
        name: "Chronicle", 
        role: "flex", 
        country: "Russia", 
        joinDate: "2023-11-20",
        captain: false,
        substitute: false
      },
      { 
        id: "205", 
        name: "Leo", 
        role: "support", 
        country: "Sweden", 
        joinDate: "2023-11-20",
        captain: false,
        substitute: false
      }
    ],
    coaching: {
      headCoach: "mini",
      assistantCoach: "elmapuddy",
      analyst: "fnatic_analyst"
    },
    stats: {
      matchesPlayed: 34,
      matchesWon: 27,
      matchesLost: 7,
      winRate: 79.41,
      mapWinRate: 76.5,
      averageRating: 1.18,
      averageMapScore: { won: 13, lost: 8 },
      currentStreak: { type: "win", count: 3 },
      bestMap: "Wakanda",
      worstMap: "New York"
    },
    achievements: [
      { title: "Champions Tour 2025: EMEA", placement: "1st", date: "2025-05-18", prize: 80000 },
      { title: "Marvel Rivals Championship Spring", placement: "4th", date: "2025-04-15", prize: 40000 },
      { title: "MRVL EMEA Masters", placement: "1st", date: "2025-03-20", prize: 60000 }
    ],
    sponsors: [
      { name: "BMW", logo: "/sponsors/bmw-logo.png", tier: "title" },
      { name: "Monster Energy", logo: "/sponsors/monster-logo.png", tier: "official" }
    ],
    fanStats: {
      followers: 987654,
      engagement: 7.8,
      merchandise: "available"
    },
    marketValue: "high",
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    nextMatch: {
      opponent: "Sentinels",
      date: "2025-05-25T18:00:00.000Z",
      event: "Marvel Rivals Championship"
    }
  },
  {
    id: "3",
    name: "Gen.G",
    shortName: "GEN",
    tag: "GEN",
    logo: "/teams/geng-logo.png",
    bannerImage: "/teams/geng-banner.jpg",
    country: "South Korea",
    region: "apac",
    city: "Seoul",
    founded: "2017-05-01",
    ranking: 3,
    previousRank: 4,
    rankChange: 1,
    peakRank: 2,
    rankingPoints: 1180,
    verified: true,
    status: "active",
    organization: {
      name: "Gen.G Esports",
      website: "https://geng.gg",
      ceo: "Chris Park",
      headquarters: "Seoul, South Korea"
    },
    socials: {
      twitter: "https://twitter.com/GenG",
      website: "https://geng.gg",
      discord: "https://discord.gg/geng",
      youtube: "https://youtube.com/geng",
      instagram: "https://instagram.com/geng"
    },
    roster: [
      { 
        id: "301", 
        name: "Meteor", 
        role: "dps", 
        country: "South Korea", 
        joinDate: "2024-01-10",
        captain: false,
        substitute: false
      },
      { 
        id: "302", 
        name: "Algo", 
        role: "flex", 
        country: "South Korea", 
        joinDate: "2024-01-10",
        captain: true,
        substitute: false
      },
      { 
        id: "303", 
        name: "Secret", 
        role: "support", 
        country: "South Korea", 
        joinDate: "2024-01-10",
        captain: false,
        substitute: false
      },
      { 
        id: "304", 
        name: "Munchkin", 
        role: "dps", 
        country: "South Korea", 
        joinDate: "2024-01-10",
        captain: false,
        substitute: false
      },
      { 
        id: "305", 
        name: "eKo", 
        role: "support", 
        country: "South Korea", 
        joinDate: "2024-01-10",
        captain: false,
        substitute: false
      }
    ],
    coaching: {
      headCoach: "geng_coach",
      assistantCoach: "geng_assistant",
      analyst: "geng_analyst"
    },
    stats: {
      matchesPlayed: 29,
      matchesWon: 23,
      matchesLost: 6,
      winRate: 79.31,
      mapWinRate: 75.8,
      averageRating: 1.15,
      averageMapScore: { won: 13, lost: 10 },
      currentStreak: { type: "win", count: 4 },
      bestMap: "Tokyo",
      worstMap: "Asgard"
    },
    achievements: [
      { title: "Champions Tour 2025: APAC", placement: "1st", date: "2025-05-20", prize: 75000 },
      { title: "Marvel Rivals Championship Spring", placement: "3rd", date: "2025-04-15", prize: 50000 },
      { title: "MRVL APAC Open", placement: "1st", date: "2025-02-28", prize: 35000 }
    ],
    sponsors: [
      { name: "Samsung", logo: "/sponsors/samsung-logo.png", tier: "title" },
      { name: "ASUS", logo: "/sponsors/asus-logo.png", tier: "official" }
    ],
    fanStats: {
      followers: 756432,
      engagement: 9.2,
      merchandise: "available"
    },
    marketValue: "high",
    lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    nextMatch: {
      opponent: "DRX",
      date: "2025-05-30T16:00:00.000Z",
      event: "Champions Tour 2025: APAC Finals"
    }
  }
];

// Cache and rate limiting
let cachedTeams: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 300000; // 5 minutes

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 80;
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
function searchTeams(teams: any[], searchTerm: string) {
  const term = searchTerm.toLowerCase();
  return teams.filter(team => 
    team.name.toLowerCase().includes(term) ||
    team.shortName.toLowerCase().includes(term) ||
    team.tag.toLowerCase().includes(term) ||
    team.country.toLowerCase().includes(term) ||
    team.city.toLowerCase().includes(term) ||
    team.roster.some((player: any) => player.name.toLowerCase().includes(term))
  );
}

// Filter teams
function filterTeams(teams: any[], filters: any) {
  let filtered = [...teams];

  // Region filter
  if (filters.region !== 'all') {
    filtered = filtered.filter(team => team.region === filters.region);
  }

  // Rank range filter
  filtered = filtered.filter(team => 
    team.ranking >= filters.minRank && team.ranking <= filters.maxRank
  );

  // Search filter
  if (filters.search) {
    filtered = searchTeams(filtered, filters.search);
  }

  return filtered;
}

// Sort teams
function sortTeams(teams: any[], sortBy: string, sortOrder: string) {
  return teams.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'ranking':
        aValue = a.ranking;
        bValue = b.ranking;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'winrate':
        aValue = a.stats.winRate;
        bValue = b.stats.winRate;
        break;
      case 'points':
        aValue = a.rankingPoints;
        bValue = b.rankingPoints;
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
function paginateResults(teams: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTeams = teams.slice(startIndex, endIndex);

  return {
    teams: paginatedTeams,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(teams.length / limit),
      totalTeams: teams.length,
      hasNextPage: endIndex < teams.length,
      hasPreviousPage: page > 1,
      limit
    }
  };
}

// Calculate team statistics
function getTeamStats() {
  const totalTeams = teamsData.length;
  const avgStats = teamsData.reduce((acc, team) => ({
    winRate: acc.winRate + team.stats.winRate,
    ranking: acc.ranking + team.ranking,
    points: acc.points + team.rankingPoints
  }), { winRate: 0, ranking: 0, points: 0 });

  return {
    totalTeams,
    averageStats: {
      winRate: Math.round((avgStats.winRate / totalTeams) * 100) / 100,
      ranking: Math.round(avgStats.ranking / totalTeams),
      points: Math.round(avgStats.points / totalTeams)
    },
    regionDistribution: teamsData.reduce((acc: any, team) => {
      acc[team.region] = (acc[team.region] || 0) + 1;
      return acc;
    }, {}),
    topPerformers: {
      highestWinRate: teamsData.sort((a, b) => b.stats.winRate - a.stats.winRate)[0],
      mostMatches: teamsData.sort((a, b) => b.stats.matchesPlayed - a.stats.matchesPlayed)[0],
      highestRated: teamsData.sort((a, b) => b.stats.averageRating - a.stats.averageRating)[0]
    },
    recentActivity: teamsData.sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    ).slice(0, 5)
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
      validatedQuery = teamsQuerySchema.parse(queryObject);
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
    if (cachedTeams.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[CACHE] Serving teams from cache');
    } else {
      cachedTeams = [...teamsData];
      cacheTimestamp = now;
      console.log('[CACHE] Refreshed teams cache');
    }

    // Filter teams
    let filteredTeams = filterTeams(cachedTeams, validatedQuery);

    // Sort teams
    filteredTeams = sortTeams(
      filteredTeams, 
      validatedQuery.sortBy, 
      validatedQuery.sortOrder
    );

    // Paginate results
    const result = paginateResults(
      filteredTeams, 
      validatedQuery.page, 
      validatedQuery.limit
    );

    // Get team statistics
    const teamStats = getTeamStats();

    // Mobile optimization - reduce data for mobile clients
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile && !validatedQuery.includeStats) {
      // Reduce data for mobile
      result.teams = result.teams.map(team => ({
        id: team.id,
        name: team.name,
        shortName: team.shortName,
        tag: team.tag,
        logo: team.logo,
        country: team.country,
        region: team.region,
        ranking: team.ranking,
        rankChange: team.rankChange,
        rankingPoints: team.rankingPoints,
        stats: {
          winRate: team.stats.winRate,
          matchesPlayed: team.stats.matchesPlayed
        },
        nextMatch: team.nextMatch
      }));
    }

    // Response
    return NextResponse.json({
      success: true,
      data: result.teams,
      pagination: result.pagination,
      filters: {
        applied: validatedQuery,
        available: {
          region: ['americas', 'emea', 'apac', 'global'],
          sortBy: ['ranking', 'name', 'winrate', 'points'],
          sortOrder: ['asc', 'desc']
        }
      },
      stats: teamStats,
      meta: {
        timestamp: new Date().toISOString(),
        cached: (now - cacheTimestamp) < CACHE_DURATION,
        mobile: isMobile
      }
    });

  } catch (error) {
    console.error('Teams API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new team (Admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'tag', 'region', 'country'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new team
    const newTeam = {
      id: String(teamsData.length + 1),
      name: body.name,
      shortName: body.shortName || body.name,
      tag: body.tag.toUpperCase(),
      logo: body.logo || '/teams/default-logo.png',
      bannerImage: body.bannerImage || '/teams/default-banner.jpg',
      country: body.country,
      region: body.region,
      city: body.city || '',
      founded: body.founded || new Date().toISOString().split('T')[0],
      ranking: teamsData.length + 1, // Start at bottom
      previousRank: teamsData.length + 1,
      rankChange: 0,
      peakRank: teamsData.length + 1,
      rankingPoints: 0,
      verified: false,
      status: 'active',
      organization: body.organization || {},
      socials: body.socials || {},
      roster: body.roster || [],
      coaching: body.coaching || {},
      stats: {
        matchesPlayed: 0,
        matchesWon: 0,
        matchesLost: 0,
        winRate: 0,
        mapWinRate: 0,
        averageRating: 0,
        averageMapScore: { won: 0, lost: 0 },
        currentStreak: { type: "none", count: 0 }
      },
      achievements: [],
      sponsors: body.sponsors || [],
      fanStats: {
        followers: 0,
        engagement: 0,
        merchandise: "unavailable"
      },
      marketValue: "low",
      lastActivity: new Date().toISOString(),
      nextMatch: null
    };

    teamsData.push(newTeam);

    // Clear cache
    cachedTeams = [];
    cacheTimestamp = 0;

    console.log(`[ADMIN] New team created: ${newTeam.name}`);

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team: newTeam
    }, { status: 201 });

  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
