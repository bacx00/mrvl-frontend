import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schemas
const matchQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  status: z.enum(['live', 'upcoming', 'completed', 'all']).optional().default('all'),
  region: z.enum(['americas', 'emea', 'apac', 'global', 'all']).optional().default('all'),
  team: z.string().optional(),
  event: z.string().optional(),
  date: z.string().optional(), // YYYY-MM-DD format
  search: z.string().optional(),
  sortBy: z.enum(['date', 'event', 'team1', 'team2']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Mock database with comprehensive match data
const matches = [
  {
    id: "1",
    team1: {
      id: 1,
      name: "Sentinels",
      shortName: "SEN",
      logo: "/teams/sentinels-logo.png",
      country: "USA",
      region: "americas",
      players: ["TenZ", "ShahZaM", "SicK", "dapr", "zombs"]
    },
    team2: {
      id: 2,
      name: "Cloud9",
      shortName: "C9",
      logo: "/teams/cloud9-logo.png",
      country: "USA",
      region: "americas",
      players: ["leaf", "xeppaa", "mitch", "vanity", "Xeta"]
    },
    score: { team1: 13, team2: 10 },
    status: "completed",
    event: {
      id: "champ2025",
      name: "Champions Tour 2025: Americas",
      stage: "Playoffs - Semi-Finals",
      logo: "/events/champions-tour.png"
    },
    date: "2025-05-05T18:00:00.000Z",
    timezone: "UTC",
    map: "Asgard",
    format: "Bo3",
    winner: "team1",
    duration: "45m 32s",
    viewersPeak: 125420,
    vod: "https://watch.mrvl.net/123456",
    highlights: "https://highlights.mrvl.net/123456",
    region: "americas",
    tags: ["playoffs", "elimination"],
    isLive: false,
    liveViewers: 0,
    createdAt: "2025-05-01T10:00:00.000Z",
    updatedAt: "2025-05-05T20:45:32.000Z"
  },
  {
    id: "2",
    team1: {
      id: 3,
      name: "Gen.G",
      shortName: "GEN",
      logo: "/teams/geng-logo.png",
      country: "KOR",
      region: "apac",
      players: ["Meteor", "Algo", "Secret", "Munchkin", "eKo"]
    },
    team2: {
      id: 4,
      name: "DRX",
      shortName: "DRX",
      logo: "/teams/drx-logo.png",
      country: "KOR",
      region: "apac",
      players: ["stax", "Rb", "Zest", "BuZz", "Mako"]
    },
    score: { team1: 8, team2: 12 },
    status: "live",
    event: {
      id: "pacific2025",
      name: "Champions Tour 2025: Pacific",
      stage: "Playoffs - Upper Final",
      logo: "/events/champions-tour-pacific.png"
    },
    date: "2025-05-22T15:00:00.000Z",
    timezone: "UTC",
    map: "Wakanda",
    format: "Bo3",
    winner: null,
    duration: "32m 15s",
    viewersPeak: 89340,
    livestream: "https://watch.mrvl.net/live/456789",
    region: "apac",
    tags: ["playoffs", "live"],
    isLive: true,
    liveViewers: 89340,
    createdAt: "2025-05-20T10:00:00.000Z",
    updatedAt: "2025-05-22T16:32:15.000Z"
  },
  {
    id: "3",
    team1: {
      id: 5,
      name: "Fnatic",
      shortName: "FNC",
      logo: "/teams/fnatic-logo.png",
      country: "GBR",
      region: "emea",
      players: ["Boaster", "Derke", "Alfajer", "Chronicle", "Leo"]
    },
    team2: {
      id: 6,
      name: "Team Liquid",
      shortName: "TL",
      logo: "/teams/liquid-logo.png",
      country: "GBR",
      region: "emea",
      players: ["Redgar", "Sayf", "nAts", "Jamppi", "soulcas"]
    },
    score: { team1: 0, team2: 0 },
    status: "upcoming",
    event: {
      id: "emea2025",
      name: "Champions Tour 2025: EMEA",
      stage: "Playoffs - Quarter Finals",
      logo: "/events/champions-tour-emea.png"
    },
    date: "2025-05-25T14:00:00.000Z",
    timezone: "UTC",
    map: "TBD",
    format: "Bo3",
    winner: null,
    duration: null,
    viewersPeak: 0,
    region: "emea",
    tags: ["playoffs", "upcoming"],
    isLive: false,
    liveViewers: 0,
    createdAt: "2025-05-15T10:00:00.000Z",
    updatedAt: "2025-05-15T10:00:00.000Z"
  },
  {
    id: "4",
    team1: {
      id: 7,
      name: "100 Thieves",
      shortName: "100T",
      logo: "/teams/100t-logo.png",
      country: "USA",
      region: "americas",
      players: ["Asuna", "Cryo", "Derrek", "stellar", "bang"]
    },
    team2: {
      id: 8,
      name: "LOUD",
      shortName: "LOUD",
      logo: "/teams/loud-logo.png",
      country: "BRA",
      region: "americas",
      players: ["Less", "aspas", "Saadhak", "pANcada", "tuyz"]
    },
    score: { team1: 2, team2: 13 },
    status: "completed",
    event: {
      id: "champ2025",
      name: "Champions Tour 2025: Americas",
      stage: "Regular Season",
      logo: "/events/champions-tour.png"
    },
    date: "2025-05-18T20:00:00.000Z",
    timezone: "UTC",
    map: "Sanctum Sanctorum",
    format: "Bo3",
    winner: "team2",
    duration: "38m 45s",
    viewersPeak: 67890,
    vod: "https://watch.mrvl.net/789012",
    highlights: "https://highlights.mrvl.net/789012",
    region: "americas",
    tags: ["regular-season"],
    isLive: false,
    liveViewers: 0,
    createdAt: "2025-05-15T10:00:00.000Z",
    updatedAt: "2025-05-18T21:38:45.000Z"
  }
];

// Cache for performance
let cachedMatches: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 30000; // 30 seconds

// Rate limiting
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
function searchMatches(matches: any[], searchTerm: string) {
  const term = searchTerm.toLowerCase();
  return matches.filter(match => 
    match.team1.name.toLowerCase().includes(term) ||
    match.team2.name.toLowerCase().includes(term) ||
    match.event.name.toLowerCase().includes(term) ||
    match.event.stage.toLowerCase().includes(term) ||
    match.map.toLowerCase().includes(term)
  );
}

// Filter matches
function filterMatches(matches: any[], filters: any) {
  let filtered = [...matches];

  // Status filter
  if (filters.status !== 'all') {
    filtered = filtered.filter(match => match.status === filters.status);
  }

  // Region filter
  if (filters.region !== 'all') {
    filtered = filtered.filter(match => match.region === filters.region);
  }

  // Team filter
  if (filters.team) {
    const teamTerm = filters.team.toLowerCase();
    filtered = filtered.filter(match => 
      match.team1.name.toLowerCase().includes(teamTerm) ||
      match.team2.name.toLowerCase().includes(teamTerm)
    );
  }

  // Event filter
  if (filters.event) {
    filtered = filtered.filter(match => match.event.id === filters.event);
  }

  // Date filter
  if (filters.date) {
    const filterDate = new Date(filters.date);
    filtered = filtered.filter(match => {
      const matchDate = new Date(match.date);
      return matchDate.toDateString() === filterDate.toDateString();
    });
  }

  // Search filter
  if (filters.search) {
    filtered = searchMatches(filtered, filters.search);
  }

  return filtered;
}

// Sort matches
function sortMatches(matches: any[], sortBy: string, sortOrder: string) {
  return matches.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'event':
        aValue = a.event.name;
        bValue = b.event.name;
        break;
      case 'team1':
        aValue = a.team1.name;
        bValue = b.team1.name;
        break;
      case 'team2':
        aValue = a.team2.name;
        bValue = b.team2.name;
        break;
      default:
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
}

// Paginate results
function paginateResults(matches: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMatches = matches.slice(startIndex, endIndex);

  return {
    matches: paginatedMatches,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(matches.length / limit),
      totalMatches: matches.length,
      hasNextPage: endIndex < matches.length,
      hasPreviousPage: page > 1,
      limit
    }
  };
}

// Get live match statistics
function getLiveStats() {
  const liveMatches = matches.filter(m => m.status === 'live');
  const totalViewers = liveMatches.reduce((sum, match) => sum + match.liveViewers, 0);
  
  return {
    liveMatches: liveMatches.length,
    totalViewers,
    peakViewers: Math.max(...liveMatches.map(m => m.liveViewers), 0)
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
      validatedQuery = matchQuerySchema.parse(queryObject);
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
    if (cachedMatches.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[CACHE] Serving matches from cache');
    } else {
      cachedMatches = [...matches];
      cacheTimestamp = now;
      console.log('[CACHE] Refreshed matches cache');
    }

    // Filter matches
    let filteredMatches = filterMatches(cachedMatches, validatedQuery);

    // Sort matches
    filteredMatches = sortMatches(
      filteredMatches, 
      validatedQuery.sortBy, 
      validatedQuery.sortOrder
    );

    // Paginate results
    const result = paginateResults(
      filteredMatches, 
      validatedQuery.page, 
      validatedQuery.limit
    );

    // Get live statistics
    const liveStats = getLiveStats();

    // Mobile optimization - reduce data for mobile clients
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      // Reduce data for mobile
      result.matches = result.matches.map(match => ({
        id: match.id,
        team1: {
          name: match.team1.shortName || match.team1.name,
          logo: match.team1.logo,
          country: match.team1.country
        },
        team2: {
          name: match.team2.shortName || match.team2.name,
          logo: match.team2.logo,
          country: match.team2.country
        },
        score: match.score,
        status: match.status,
        event: {
          name: match.event.name,
          stage: match.event.stage
        },
        date: match.date,
        map: match.map,
        isLive: match.isLive,
        liveViewers: match.liveViewers
      }));
    }

    // Response
    return NextResponse.json({
      success: true,
      data: result.matches,
      pagination: result.pagination,
      filters: {
        applied: validatedQuery,
        available: {
          status: ['live', 'upcoming', 'completed'],
          region: ['americas', 'emea', 'apac', 'global'],
          sortBy: ['date', 'event', 'team1', 'team2'],
          sortOrder: ['asc', 'desc']
        }
      },
      liveStats,
      meta: {
        timestamp: new Date().toISOString(),
        cached: (now - cacheTimestamp) < CACHE_DURATION,
        mobile: isMobile
      }
    });

  } catch (error) {
    console.error('Matches API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new match (Admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['team1', 'team2', 'event', 'date', 'map', 'format'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new match
    const newMatch = {
      id: String(matches.length + 1),
      ...body,
      status: 'upcoming',
      score: { team1: 0, team2: 0 },
      winner: null,
      duration: null,
      viewersPeak: 0,
      isLive: false,
      liveViewers: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    matches.push(newMatch);

    // Clear cache
    cachedMatches = [];
    cacheTimestamp = 0;

    console.log(`[ADMIN] New match created: ${newMatch.team1.name} vs ${newMatch.team2.name}`);

    return NextResponse.json({
      success: true,
      message: 'Match created successfully',
      match: newMatch
    }, { status: 201 });

  } catch (error) {
    console.error('Create match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
