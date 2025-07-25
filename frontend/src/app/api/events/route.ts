import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for event queries
const eventQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  type: z.enum(['upcoming', 'ongoing', 'completed', 'all']).optional().default('all'),
  region: z.enum(['americas', 'emea', 'apac', 'global', 'all']).optional().default('all'),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'name', 'prize', 'region']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  minPrize: z.string().optional().transform(val => val ? parseInt(val) : 0),
  maxPrize: z.string().optional().transform(val => val ? parseInt(val) : 999999999)
});

// Comprehensive events database
const events = [
  {
    id: "100",
    name: "Marvel Rivals Invitational 2025: North America",
    shortName: "MRI NA 2025",
    startDate: "2025-03-14T00:00:00.000Z",
    endDate: "2025-03-23T23:59:59.000Z",
    registrationStart: "2025-02-01T00:00:00.000Z",
    registrationEnd: "2025-03-10T23:59:59.000Z",
    location: {
      city: "Online",
      country: "North America",
      venue: "Online Tournament",
      timezone: "EST"
    },
    prize: {
      total: 100000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 40000, percentage: 40 },
        { place: 2, amount: 20000, percentage: 20 },
        { place: 3, amount: 10000, percentage: 10 },
        { place: 4, amount: 10000, percentage: 10 }
      ]
    },
    type: "ongoing",
    status: "playoffs",
    region: "americas",
    format: {
      type: "tournament",
      teams: 8,
      stages: ["swiss", "double_elimination"],
      elimination: "double",
      matchFormat: "Bo3/Bo5",
      finalFormat: "Bo7"
    },
    organizer: {
      name: "NetEase Games",
      logo: "/organizers/netease-logo.png"
    },
    image: "/events/mri-na-2025.jpg",
    banner: "/events/mri-na-2025-banner.jpg",
    description: "The Marvel Rivals Invitational 2025: North America features 8 top teams competing in a Swiss stage followed by double elimination playoffs.",
    featured: true,
    trending: true,
    createdAt: "2025-02-01T10:00:00.000Z",
    updatedAt: "2025-03-22T16:30:00.000Z"
  },
  {
    id: "1",
    name: "Marvel Rivals Championship 2025",
    shortName: "MRC 2025",
    startDate: "2025-06-15T00:00:00.000Z",
    endDate: "2025-06-30T23:59:59.000Z",
    registrationStart: "2025-05-01T00:00:00.000Z",
    registrationEnd: "2025-06-10T23:59:59.000Z",
    location: {
      city: "Los Angeles",
      country: "USA",
      venue: "Convention Center",
      timezone: "PST"
    },
    prize: {
      total: 1000000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 400000, percentage: 40 },
        { place: 2, amount: 200000, percentage: 20 },
        { place: 3, amount: 100000, percentage: 10 },
        { place: 4, amount: 50000, percentage: 5 }
      ]
    },
    type: "upcoming",
    status: "registration_open",
    region: "global",
    format: {
      type: "tournament",
      teams: 16,
      stages: ["group_stage", "playoffs"],
      elimination: "double",
      bo: 3
    },
    organizer: {
      name: "NetEase Games",
      logo: "/organizers/netease-logo.png",
      contact: "events@netease.com"
    },
    sponsors: [
      { name: "Razer", logo: "/sponsors/razer-logo.png", tier: "title" },
      { name: "Intel", logo: "/sponsors/intel-logo.png", tier: "major" },
      { name: "NVIDIA", logo: "/sponsors/nvidia-logo.png", tier: "major" }
    ],
    image: "/events/championship-2025.jpg",
    banner: "/events/championship-2025-banner.jpg",
    description: "The Marvel Rivals Championship 2025 is the premier global tournament for Marvel Rivals, bringing together the best teams from around the world to compete for the title of World Champion.",
    rules: "Standard tournament rules apply. All matches are Best of 3 except finals which are Best of 5.",
    streamLinks: [
      { platform: "YouTube", url: "https://youtube.com/mrvlnet", primary: true },
      { platform: "Twitch", url: "https://twitch.tv/mrvlnet", primary: false }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl",
      reddit: "https://reddit.com/r/MarvelRivals"
    },
    ticketInfo: {
      available: true,
      prices: [
        { type: "General Admission", price: 75, currency: "USD" },
        { type: "VIP", price: 150, currency: "USD" },
        { type: "Premium", price: 300, currency: "USD" }
      ],
      link: "https://tickets.mrvl.net/championship2025"
    },
    teams: [],
    matches: [],
    stats: {
      registeredTeams: 12,
      totalSlots: 16,
      expectedViewers: 500000
    },
    tags: ["championship", "global", "major"],
    featured: true,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-05-22T10:00:00.000Z"
  },
  {
    id: "2",
    name: "Champions Tour 2025: EMEA Stage 1",
    shortName: "CT EMEA S1",
    startDate: "2025-03-21T00:00:00.000Z",
    endDate: "2025-05-18T23:59:59.000Z",
    registrationStart: "2025-02-01T00:00:00.000Z",
    registrationEnd: "2025-03-15T23:59:59.000Z",
    location: {
      city: "Berlin",
      country: "Germany",
      venue: "Tempodrom",
      timezone: "CET"
    },
    prize: {
      total: 250000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 100000, percentage: 40 },
        { place: 2, amount: 50000, percentage: 20 },
        { place: 3, amount: 25000, percentage: 10 },
        { place: 4, amount: 12500, percentage: 5 }
      ]
    },
    type: "ongoing",
    status: "playoffs",
    region: "emea",
    format: {
      type: "league",
      teams: 10,
      stages: ["regular_season", "playoffs"],
      elimination: "single",
      bo: 3
    },
    organizer: {
      name: "NetEase Games & EMEA Partners",
      logo: "/organizers/netease-emea-logo.png",
      contact: "emea@netease.com"
    },
    sponsors: [
      { name: "Red Bull", logo: "/sponsors/redbull-logo.png", tier: "title" },
      { name: "Logitech", logo: "/sponsors/logitech-logo.png", tier: "major" }
    ],
    image: "/events/champions-tour-emea.jpg",
    banner: "/events/champions-tour-emea-banner.jpg",
    description: "The Champions Tour 2025: EMEA Stage 1 is part of the official Marvel Rivals esports circuit for the Europe, Middle East, and Africa region.",
    rules: "League format with playoffs. Top 4 teams qualify for Masters New York.",
    streamLinks: [
      { platform: "YouTube", url: "https://youtube.com/mrvlnet", primary: true },
      { platform: "Twitch", url: "https://twitch.tv/mrvlnet", primary: false }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl-emea",
      reddit: "https://reddit.com/r/MarvelRivalsEMEA"
    },
    ticketInfo: {
      available: true,
      prices: [
        { type: "General Admission", price: 50, currency: "EUR" },
        { type: "VIP", price: 100, currency: "EUR" }
      ],
      link: "https://tickets.mrvl.net/emea2025"
    },
    teams: [
      { id: 5, name: "Fnatic", logo: "/teams/fnatic-logo.png", standing: 1, wins: 8, losses: 1 },
      { id: 6, name: "Team Liquid", logo: "/teams/liquid-logo.png", standing: 2, wins: 7, losses: 2 },
      { id: 21, name: "FUT Esports", logo: "/teams/fut-logo.png", standing: 3, wins: 6, losses: 3 },
      { id: 22, name: "Karmine Corp", logo: "/teams/kc-logo.png", standing: 4, wins: 5, losses: 4 }
    ],
    matches: [
      { id: "201", team1: "Fnatic", team2: "Team Liquid", date: "2025-05-25T14:00:00.000Z", stage: "Playoffs - Semi-Final" },
      { id: "202", team1: "FUT Esports", team2: "Karmine Corp", date: "2025-05-25T17:00:00.000Z", stage: "Playoffs - Semi-Final" }
    ],
    stats: {
      registeredTeams: 10,
      totalSlots: 10,
      expectedViewers: 150000,
      currentViewers: 45000
    },
    tags: ["champions-tour", "emea", "regional"],
    featured: true,
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-05-22T15:30:00.000Z"
  },
  {
    id: "3",
    name: "Champions Tour 2025: Pacific Stage 1",
    shortName: "CT PAC S1",
    startDate: "2025-03-21T00:00:00.000Z",
    endDate: "2025-05-11T23:59:59.000Z",
    registrationStart: "2025-02-01T00:00:00.000Z",
    registrationEnd: "2025-03-15T23:59:59.000Z",
    location: {
      city: "Seoul",
      country: "South Korea",
      venue: "LoL Park",
      timezone: "KST"
    },
    prize: {
      total: 250000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 100000, percentage: 40 },
        { place: 2, amount: 50000, percentage: 20 },
        { place: 3, amount: 25000, percentage: 10 },
        { place: 4, amount: 12500, percentage: 5 }
      ]
    },
    type: "ongoing",
    status: "playoffs",
    region: "apac",
    format: {
      type: "league",
      teams: 10,
      stages: ["regular_season", "playoffs"],
      elimination: "double",
      bo: 3
    },
    organizer: {
      name: "NetEase Games & Pacific Partners",
      logo: "/organizers/netease-pacific-logo.png",
      contact: "pacific@netease.com"
    },
    sponsors: [
      { name: "Samsung", logo: "/sponsors/samsung-logo.png", tier: "title" },
      { name: "ASUS", logo: "/sponsors/asus-logo.png", tier: "major" }
    ],
    image: "/events/champions-tour-pacific.jpg",
    banner: "/events/champions-tour-pacific-banner.jpg",
    description: "The Champions Tour 2025: Pacific Stage 1 is part of the official Marvel Rivals esports circuit for the Asia-Pacific region.",
    rules: "League format with double elimination playoffs. Top 4 teams qualify for Masters New York.",
    streamLinks: [
      { platform: "YouTube", url: "https://youtube.com/mrvlnet", primary: true },
      { platform: "Twitch", url: "https://twitch.tv/mrvlnet", primary: false },
      { platform: "AfreecaTV", url: "https://afreecatv.com/mrvl", primary: false }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl-pacific",
      reddit: "https://reddit.com/r/MarvelRivalsPacific"
    },
    ticketInfo: {
      available: false,
      prices: [],
      link: "https://tickets.mrvl.net/pacific2025"
    },
    teams: [
      { id: 3, name: "Gen.G", logo: "/teams/geng-logo.png", standing: 1, wins: 8, losses: 1 },
      { id: 23, name: "Paper Rex", logo: "/teams/prx-logo.png", standing: 2, wins: 7, losses: 2 },
      { id: 4, name: "DRX", logo: "/teams/drx-logo.png", standing: 3, wins: 6, losses: 3 },
      { id: 24, name: "BOOM Esports", logo: "/teams/boom-logo.png", standing: 4, wins: 5, losses: 4 }
    ],
    matches: [
      { id: "301", team1: "Gen.G", team2: "DRX", date: "2025-05-22T15:00:00.000Z", stage: "Playoffs - Upper Final", live: true }
    ],
    stats: {
      registeredTeams: 10,
      totalSlots: 10,
      expectedViewers: 200000,
      currentViewers: 89340
    },
    tags: ["champions-tour", "apac", "regional"],
    featured: true,
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-05-22T16:30:00.000Z"
  },
  {
    id: "4",
    name: "MRVL Invitational Spring 2025",
    shortName: "MRVL Spring",
    startDate: "2025-04-10T00:00:00.000Z",
    endDate: "2025-04-20T23:59:59.000Z",
    registrationStart: "2025-03-01T00:00:00.000Z",
    registrationEnd: "2025-04-05T23:59:59.000Z",
    location: {
      city: "Tokyo",
      country: "Japan",
      venue: "Tokyo Big Sight",
      timezone: "JST"
    },
    prize: {
      total: 100000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 40000, percentage: 40 },
        { place: 2, amount: 20000, percentage: 20 },
        { place: 3, amount: 10000, percentage: 10 },
        { place: 4, amount: 5000, percentage: 5 }
      ]
    },
    type: "completed",
    status: "finished",
    region: "apac",
    format: {
      type: "tournament",
      teams: 8,
      stages: ["groups", "playoffs"],
      elimination: "single",
      bo: 3
    },
    organizer: {
      name: "MRVL Japan",
      logo: "/organizers/mrvl-japan-logo.png",
      contact: "japan@mrvl.net"
    },
    sponsors: [
      { name: "Sony", logo: "/sponsors/sony-logo.png", tier: "title" },
      { name: "HyperX", logo: "/sponsors/hyperx-logo.png", tier: "major" }
    ],
    image: "/events/mrvl-invitational.jpg",
    banner: "/events/mrvl-invitational-banner.jpg",
    description: "The MRVL Invitational Spring 2025 was an invite-only tournament featuring top teams from the Asia-Pacific region.",
    rules: "Invitational format with group stage followed by single elimination playoffs.",
    streamLinks: [
      { platform: "YouTube", url: "https://youtube.com/mrvlnet", primary: true },
      { platform: "Twitch", url: "https://twitch.tv/mrvlnet", primary: false }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl-japan",
      reddit: "https://reddit.com/r/MarvelRivalsJapan"
    },
    ticketInfo: {
      available: false,
      prices: [],
      link: ""
    },
    teams: [
      { id: 3, name: "Gen.G", logo: "/teams/geng-logo.png", placement: 1, prize: 40000 },
      { id: 4, name: "DRX", logo: "/teams/drx-logo.png", placement: 2, prize: 20000 },
      { id: 23, name: "Paper Rex", logo: "/teams/prx-logo.png", placement: 3, prize: 10000 },
      { id: 24, name: "BOOM Esports", logo: "/teams/boom-logo.png", placement: 4, prize: 5000 }
    ],
    matches: [
      { id: "401", team1: "Gen.G", team2: "DRX", score1: 3, score2: 1, stage: "Grand Final", completed: true }
    ],
    stats: {
      registeredTeams: 8,
      totalSlots: 8,
      peakViewers: 75420,
      totalViewHours: 450000
    },
    tags: ["invitational", "apac", "completed"],
    featured: false,
    createdAt: "2025-02-15T10:00:00.000Z",
    updatedAt: "2025-04-20T23:59:59.000Z"
  },
  {
    id: "5",
    name: "Champions Tour 2025: Americas Stage 1",
    shortName: "CT AME S1",
    startDate: "2025-03-21T00:00:00.000Z",
    endDate: "2025-05-04T23:59:59.000Z",
    registrationStart: "2025-02-01T00:00:00.000Z",
    registrationEnd: "2025-03-15T23:59:59.000Z",
    location: {
      city: "Los Angeles",
      country: "USA",
      venue: "YouTube Theater",
      timezone: "PST"
    },
    prize: {
      total: 250000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 100000, percentage: 40 },
        { place: 2, amount: 50000, percentage: 20 },
        { place: 3, amount: 25000, percentage: 10 },
        { place: 4, amount: 12500, percentage: 5 }
      ]
    },
    type: "completed",
    status: "finished",
    region: "americas",
    format: {
      type: "league",
      teams: 10,
      stages: ["regular_season", "playoffs"],
      elimination: "double",
      bo: 3
    },
    organizer: {
      name: "NetEase Games & Americas Partners",
      logo: "/organizers/netease-americas-logo.png",
      contact: "americas@netease.com"
    },
    sponsors: [
      { name: "Monster Energy", logo: "/sponsors/monster-logo.png", tier: "title" },
      { name: "SteelSeries", logo: "/sponsors/steelseries-logo.png", tier: "major" }
    ],
    image: "/events/champions-tour-americas.jpg",
    banner: "/events/champions-tour-americas-banner.jpg",
    description: "The Champions Tour 2025: Americas Stage 1 was part of the official Marvel Rivals esports circuit for the Americas region.",
    rules: "League format with double elimination playoffs. Top 4 teams qualified for Masters New York.",
    streamLinks: [
      { platform: "YouTube", url: "https://youtube.com/mrvlnet", primary: true },
      { platform: "Twitch", url: "https://twitch.tv/mrvlnet", primary: false }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl-americas",
      reddit: "https://reddit.com/r/MarvelRivalsAmericas"
    },
    ticketInfo: {
      available: false,
      prices: [],
      link: ""
    },
    teams: [
      { id: 1, name: "Sentinels", logo: "/teams/sentinels-logo.png", placement: 1, prize: 100000 },
      { id: 25, name: "G2 Esports", logo: "/teams/g2-logo.png", placement: 2, prize: 50000 },
      { id: 26, name: "MIBR", logo: "/teams/mibr-logo.png", placement: 3, prize: 25000 },
      { id: 7, name: "100 Thieves", logo: "/teams/100t-logo.png", placement: 4, prize: 12500 }
    ],
    matches: [
      { id: "501", team1: "Sentinels", team2: "G2 Esports", score1: 3, score2: 0, stage: "Grand Final", completed: true }
    ],
    stats: {
      registeredTeams: 10,
      totalSlots: 10,
      peakViewers: 185420,
      totalViewHours: 890000
    },
    tags: ["champions-tour", "americas", "completed"],
    featured: false,
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-05-04T23:59:59.000Z"
  },
  {
    id: "6",
    name: "MRVL Open Series: Summer 2025",
    shortName: "MRVL Summer",
    startDate: "2025-07-10T00:00:00.000Z",
    endDate: "2025-08-15T23:59:59.000Z",
    registrationStart: "2025-06-01T00:00:00.000Z",
    registrationEnd: "2025-07-05T23:59:59.000Z",
    location: {
      city: "Online",
      country: "Global",
      venue: "Online Tournament",
      timezone: "UTC"
    },
    prize: {
      total: 75000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 30000, percentage: 40 },
        { place: 2, amount: 15000, percentage: 20 },
        { place: 3, amount: 7500, percentage: 10 },
        { place: 4, amount: 3750, percentage: 5 }
      ]
    },
    type: "upcoming",
    status: "registration_pending",
    region: "global",
    format: {
      type: "open_qualifier",
      teams: 64,
      stages: ["qualifiers", "main_event"],
      elimination: "single",
      bo: 3
    },
    organizer: {
      name: "MRVL Community",
      logo: "/organizers/mrvl-community-logo.png",
      contact: "community@mrvl.net"
    },
    sponsors: [
      { name: "Discord", logo: "/sponsors/discord-logo.png", tier: "title" },
      { name: "Corsair", logo: "/sponsors/corsair-logo.png", tier: "major" }
    ],
    image: "/events/open-series.jpg",
    banner: "/events/open-series-banner.jpg",
    description: "The MRVL Open Series: Summer 2025 is an open tournament where any team can register and compete for their chance at glory.",
    rules: "Open registration tournament with qualifiers leading to main event. All matches streamed.",
    streamLinks: [
      { platform: "YouTube", url: "https://youtube.com/mrvlnet", primary: true },
      { platform: "Twitch", url: "https://twitch.tv/mrvlnet", primary: false }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl-open",
      reddit: "https://reddit.com/r/MarvelRivalsOpen"
    },
    ticketInfo: {
      available: false,
      prices: [],
      link: ""
    },
    teams: [],
    matches: [],
    stats: {
      registeredTeams: 0,
      totalSlots: 64,
      expectedViewers: 50000
    },
    tags: ["open-series", "global", "community"],
    featured: false,
    createdAt: "2025-04-01T10:00:00.000Z",
    updatedAt: "2025-05-22T10:00:00.000Z"
  }
];

// Cache for performance
let cachedEvents: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1 minute

// Rate limiting
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

// Search functionality
function searchEvents(events: any[], searchTerm: string) {
  const term = searchTerm.toLowerCase();
  return events.filter(event => 
    event.name.toLowerCase().includes(term) ||
    event.shortName.toLowerCase().includes(term) ||
    event.location.city.toLowerCase().includes(term) ||
    event.location.country.toLowerCase().includes(term) ||
    event.organizer.name.toLowerCase().includes(term) ||
    event.tags.some((tag: string) => tag.toLowerCase().includes(term))
  );
}

// Filter events
function filterEvents(events: any[], filters: any) {
  let filtered = [...events];

  // Type filter
  if (filters.type !== 'all') {
    filtered = filtered.filter(event => event.type === filters.type);
  }

  // Region filter
  if (filters.region !== 'all') {
    filtered = filtered.filter(event => event.region === filters.region);
  }

  // Prize filter
  if (filters.minPrize > 0) {
    filtered = filtered.filter(event => event.prize.total >= filters.minPrize);
  }

  if (filters.maxPrize < 999999999) {
    filtered = filtered.filter(event => event.prize.total <= filters.maxPrize);
  }

  // Search filter
  if (filters.search) {
    filtered = searchEvents(filtered, filters.search);
  }

  return filtered;
}

// Sort events
function sortEvents(events: any[], sortBy: string, sortOrder: string) {
  return events.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'prize':
        aValue = a.prize.total;
        bValue = b.prize.total;
        break;
      case 'region':
        aValue = a.region;
        bValue = b.region;
        break;
      default:
        aValue = new Date(a.startDate).getTime();
        bValue = new Date(b.startDate).getTime();
    }

    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
}

// Paginate results
function paginateResults(events: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedEvents = events.slice(startIndex, endIndex);

  return {
    events: paginatedEvents,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(events.length / limit),
      totalEvents: events.length,
      hasNextPage: endIndex < events.length,
      hasPreviousPage: page > 1,
      limit
    }
  };
}

// Get event statistics
function getEventStats() {
  const now = new Date();
  const upcomingEvents = events.filter(e => new Date(e.startDate) > now);
  const ongoingEvents = events.filter(e => 
    new Date(e.startDate) <= now && new Date(e.endDate) >= now
  );
  const totalPrizePool = events.reduce((sum, event) => sum + event.prize.total, 0);
  const totalTeams = events.reduce((sum, event) => sum + (event.stats.registeredTeams || 0), 0);

  return {
    upcoming: upcomingEvents.length,
    ongoing: ongoingEvents.length,
    completed: events.filter(e => e.type === 'completed').length,
    totalPrizePool,
    totalTeams,
    featuredEvents: events.filter(e => e.featured).length
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
      validatedQuery = eventQuerySchema.parse(queryObject);
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
    if (cachedEvents.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[CACHE] Serving events from cache');
    } else {
      cachedEvents = [...events];
      cacheTimestamp = now;
      console.log('[CACHE] Refreshed events cache');
    }

    // Filter events
    let filteredEvents = filterEvents(cachedEvents, validatedQuery);

    // Sort events
    filteredEvents = sortEvents(
      filteredEvents, 
      validatedQuery.sortBy, 
      validatedQuery.sortOrder
    );

    // Paginate results
    const result = paginateResults(
      filteredEvents, 
      validatedQuery.page, 
      validatedQuery.limit
    );

    // Get event statistics
    const eventStats = getEventStats();

    // Mobile optimization - reduce data for mobile clients
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      // Reduce data for mobile
      result.events = result.events.map(event => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        startDate: event.startDate,
        endDate: event.endDate,
        location: {
          city: event.location.city,
          country: event.location.country
        },
        prize: {
          total: event.prize.total,
          currency: event.prize.currency
        },
        type: event.type,
        status: event.status,
        region: event.region,
        image: event.image,
        featured: event.featured,
        tags: event.tags
      }));
    }

    // Response
    return NextResponse.json({
      success: true,
      data: result.events,
      pagination: result.pagination,
      filters: {
        applied: validatedQuery,
        available: {
          type: ['upcoming', 'ongoing', 'completed'],
          region: ['americas', 'emea', 'apac', 'global'],
          sortBy: ['date', 'name', 'prize', 'region'],
          sortOrder: ['asc', 'desc']
        }
      },
      stats: eventStats,
      meta: {
        timestamp: new Date().toISOString(),
        cached: (now - cacheTimestamp) < CACHE_DURATION,
        mobile: isMobile
      }
    });

  } catch (error) {
    console.error('Events API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new event (Admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'startDate', 'endDate', 'location', 'prize', 'region', 'organizer'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new event
    const newEvent = {
      id: String(events.length + 1),
      ...body,
      type: 'upcoming',
      status: 'registration_pending',
      teams: [],
      matches: [],
      stats: {
        registeredTeams: 0,
        totalSlots: body.format?.teams || 16,
        expectedViewers: 0
      },
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    events.push(newEvent);

    // Clear cache
    cachedEvents = [];
    cacheTimestamp = 0;

    console.log(`[ADMIN] New event created: ${newEvent.name}`);

    return NextResponse.json({
      success: true,
      message: 'Event created successfully',
      event: newEvent
    }, { status: 201 });

  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
