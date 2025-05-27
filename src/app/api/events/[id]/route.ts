import { NextRequest, NextResponse } from 'next/server';

// Comprehensive event details database
const eventDetails = {
  "1": {
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
      venue: "Los Angeles Convention Center",
      address: "1201 S Figueroa St, Los Angeles, CA 90015",
      capacity: 15000,
      timezone: "PST",
      coordinates: { lat: 34.0401, lng: -118.2673 }
    },
    prize: {
      total: 1000000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 400000, percentage: 40, team: null },
        { place: 2, amount: 200000, percentage: 20, team: null },
        { place: "3-4", amount: 100000, percentage: 10, team: null },
        { place: "5-8", amount: 50000, percentage: 5, team: null },
        { place: "9-12", amount: 25000, percentage: 2.5, team: null },
        { place: "13-16", amount: 12500, percentage: 1.25, team: null }
      ]
    },
    type: "upcoming",
    status: "registration_open",
    region: "global",
    format: {
      type: "tournament",
      teams: 16,
      stages: [
        {
          name: "Group Stage",
          format: "4 groups of 4 teams",
          elimination: "double",
          advancement: "Top 2 from each group"
        },
        {
          name: "Playoffs",
          format: "Single elimination bracket",
          elimination: "single",
          advancement: "Winner takes all"
        }
      ],
      matchFormat: "Bo3",
      finalFormat: "Bo5"
    },
    organizer: {
      name: "NetEase Games",
      logo: "/organizers/netease-logo.png",
      contact: "events@netease.com",
      website: "https://netease.com",
      description: "Leading game developer and esports organizer"
    },
    sponsors: [
      { 
        name: "Razer", 
        logo: "/sponsors/razer-logo.png", 
        tier: "title",
        description: "Official hardware partner"
      },
      { 
        name: "Intel", 
        logo: "/sponsors/intel-logo.png", 
        tier: "major",
        description: "Processor technology partner"
      },
      { 
        name: "NVIDIA", 
        logo: "/sponsors/nvidia-logo.png", 
        tier: "major",
        description: "Graphics technology partner"
      },
      { 
        name: "Monster Energy", 
        logo: "/sponsors/monster-logo.png", 
        tier: "official",
        description: "Official energy drink"
      }
    ],
    media: {
      image: "/events/championship-2025.jpg",
      banner: "/events/championship-2025-banner.jpg",
      gallery: [
        "/events/championship-2025-1.jpg",
        "/events/championship-2025-2.jpg",
        "/events/championship-2025-3.jpg"
      ],
      video: "https://youtube.com/watch?v=championship2025"
    },
    description: "The Marvel Rivals Championship 2025 is the premier global tournament for Marvel Rivals, bringing together the best teams from around the world to compete for the title of World Champion. This prestigious event will feature 16 teams from various regions battling in a high-stakes competition with a prize pool of $1,000,000.",
    rules: {
      general: "Standard tournament rules apply. All matches are Best of 3 except finals which are Best of 5.",
      eligibility: [
        "Teams must be registered and verified",
        "All players must be 16 years or older",
        "No substitutions during matches except for technical issues",
        "Teams must use approved peripherals only"
      ],
      conduct: [
        "Professional conduct expected at all times",
        "No toxic behavior or harassment",
        "Respect for opponents and officials",
        "Compliance with anti-doping policies"
      ]
    },
    streamLinks: [
      { 
        platform: "YouTube", 
        url: "https://youtube.com/mrvlnet", 
        primary: true,
        languages: ["English", "Spanish", "Korean", "Japanese"]
      },
      { 
        platform: "Twitch", 
        url: "https://twitch.tv/mrvlnet", 
        primary: false,
        languages: ["English"]
      },
      { 
        platform: "Discord", 
        url: "https://discord.gg/mrvl-championship", 
        primary: false,
        languages: ["English"]
      }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl",
      reddit: "https://reddit.com/r/MarvelRivals",
      youtube: "https://youtube.com/mrvlnet",
      instagram: "https://instagram.com/mrvlnet"
    },
    ticketInfo: {
      available: true,
      onSale: true,
      saleStart: "2025-05-01T10:00:00.000Z",
      saleEnd: "2025-06-14T23:59:59.000Z",
      prices: [
        { 
          type: "General Admission", 
          price: 75, 
          currency: "USD",
          benefits: ["Event access", "Official program"],
          availability: "available"
        },
        { 
          type: "VIP", 
          price: 150, 
          currency: "USD",
          benefits: ["Priority seating", "Meet & greet", "Exclusive merchandise"],
          availability: "limited"
        },
        { 
          type: "Premium", 
          price: 300, 
          currency: "USD",
          benefits: ["Front row seats", "Backstage access", "Premium swag bag", "Player signing session"],
          availability: "sold_out"
        }
      ],
      link: "https://tickets.mrvl.net/championship2025",
      venue: "Tickets available at venue box office and online"
    },
    teams: [
      {
        id: 1,
        name: "Sentinels",
        logo: "/teams/sentinels-logo.png",
        region: "Americas",
        seed: 1,
        group: "A",
        qualified: true,
        roster: [
          { name: "TenZ", role: "DPS", hero: "Iron Man" },
          { name: "ShahZaM", role: "Flex", hero: "Doctor Strange" },
          { name: "SicK", role: "Tank", hero: "Captain America" },
          { name: "dapr", role: "Support", hero: "Spider-Man" },
          { name: "zombs", role: "Support", hero: "Magneto" }
        ]
      },
      {
        id: 2,
        name: "Gen.G",
        logo: "/teams/geng-logo.png",
        region: "APAC",
        seed: 2,
        group: "A",
        qualified: true,
        roster: [
          { name: "Meteor", role: "DPS", hero: "Iron Man" },
          { name: "Algo", role: "Flex", hero: "Black Panther" },
          { name: "Secret", role: "Tank", hero: "Doctor Strange" },
          { name: "Munchkin", role: "Support", hero: "Storm" },
          { name: "eKo", role: "Support", hero: "Luna Snow" }
        ]
      },
      {
        id: 3,
        name: "Fnatic",
        logo: "/teams/fnatic-logo.png",
        region: "EMEA",
        seed: 1,
        group: "B",
        qualified: true,
        roster: [
          { name: "Boaster", role: "IGL", hero: "Captain America" },
          { name: "Derke", role: "DPS", hero: "Iron Man" },
          { name: "Alfajer", role: "Flex", hero: "Spider-Man" },
          { name: "Chronicle", role: "Support", hero: "Rocket Raccoon" },
          { name: "Leo", role: "Support", hero: "Luna Snow" }
        ]
      }
    ],
    schedule: [
      {
        date: "2025-06-15",
        matches: [
          {
            id: "101",
            time: "12:00",
            team1: "Sentinels",
            team2: "Team TBD",
            stage: "Group A - Opening Match",
            stream: "Main Stream"
          },
          {
            id: "102",
            time: "15:00",
            team1: "Gen.G",
            team2: "Team TBD",
            stage: "Group A - Opening Match",
            stream: "Main Stream"
          }
        ]
      },
      {
        date: "2025-06-16",
        matches: [
          {
            id: "103",
            time: "12:00",
            team1: "Fnatic",
            team2: "Team TBD",
            stage: "Group B - Opening Match",
            stream: "Main Stream"
          }
        ]
      }
    ],
    brackets: {
      groupStage: {
        groupA: {
          teams: ["Sentinels", "Gen.G", "TBD", "TBD"],
          matches: [],
          standings: []
        },
        groupB: {
          teams: ["Fnatic", "TBD", "TBD", "TBD"],
          matches: [],
          standings: []
        },
        groupC: {
          teams: ["TBD", "TBD", "TBD", "TBD"],
          matches: [],
          standings: []
        },
        groupD: {
          teams: ["TBD", "TBD", "TBD", "TBD"],
          matches: [],
          standings: []
        }
      },
      playoffs: {
        quarterFinals: [],
        semiFinals: [],
        grandFinal: null
      }
    },
    stats: {
      registeredTeams: 12,
      totalSlots: 16,
      expectedViewers: 500000,
      ticketsSold: 8750,
      totalCapacity: 15000,
      prizeDistributed: 0,
      matchesPlayed: 0,
      totalMatches: 45
    },
    news: [
      {
        id: 1,
        title: "Championship 2025 Registration Opens",
        summary: "Registration is now open for the biggest Marvel Rivals tournament of the year",
        date: "2025-05-01T10:00:00.000Z",
        author: "MRVL Team",
        link: "/news/championship-2025-registration-opens"
      },
      {
        id: 2,
        title: "Venue Announced: Los Angeles Convention Center",
        summary: "The prestigious venue will host 16 of the world's best teams",
        date: "2025-04-15T14:00:00.000Z",
        author: "MRVL Team",
        link: "/news/championship-2025-venue-announced"
      }
    ],
    tags: ["championship", "global", "major", "$1M"],
    featured: true,
    trending: true,
    createdAt: "2025-03-01T10:00:00.000Z",
    updatedAt: "2025-05-22T10:00:00.000Z"
  },

  "3": {
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
      address: "33 Jongno, Jongno-gu, Seoul, South Korea",
      capacity: 500,
      timezone: "KST",
      coordinates: { lat: 37.5665, lng: 126.9780 }
    },
    prize: {
      total: 250000,
      currency: "USD",
      distribution: [
        { place: 1, amount: 100000, percentage: 40, team: "Gen.G" },
        { place: 2, amount: 50000, percentage: 20, team: "DRX" },
        { place: 3, amount: 25000, percentage: 10, team: "Paper Rex" },
        { place: 4, amount: 12500, percentage: 5, team: "BOOM Esports" }
      ]
    },
    type: "ongoing",
    status: "playoffs",
    region: "apac",
    format: {
      type: "league",
      teams: 10,
      stages: [
        {
          name: "Regular Season",
          format: "Round robin",
          elimination: "league",
          advancement: "Top 6 to playoffs"
        },
        {
          name: "Playoffs",
          format: "Double elimination",
          elimination: "double",
          advancement: "Top 4 to Masters"
        }
      ],
      matchFormat: "Bo3",
      finalFormat: "Bo5"
    },
    organizer: {
      name: "NetEase Games & Pacific Partners",
      logo: "/organizers/netease-pacific-logo.png",
      contact: "pacific@netease.com",
      website: "https://pacific.mrvl.net",
      description: "Official Pacific region organizer"
    },
    sponsors: [
      { 
        name: "Samsung", 
        logo: "/sponsors/samsung-logo.png", 
        tier: "title",
        description: "Official technology partner"
      },
      { 
        name: "ASUS", 
        logo: "/sponsors/asus-logo.png", 
        tier: "major",
        description: "Official hardware partner"
      }
    ],
    media: {
      image: "/events/champions-tour-pacific.jpg",
      banner: "/events/champions-tour-pacific-banner.jpg",
      gallery: [
        "/events/pacific-stage1-1.jpg",
        "/events/pacific-stage1-2.jpg"
      ],
      video: "https://youtube.com/watch?v=pacific2025"
    },
    description: "The Champions Tour 2025: Pacific Stage 1 is part of the official Marvel Rivals esports circuit for the Asia-Pacific region. This tournament features the top 10 teams from the region competing for a prize pool of $250,000 and qualification spots for the Masters New York event.",
    rules: {
      general: "League format with double elimination playoffs. Top 4 teams qualify for Masters New York.",
      eligibility: [
        "Teams must be from Pacific region",
        "Minimum 3 players from region per team",
        "No roster changes during playoffs"
      ],
      conduct: [
        "Professional conduct required",
        "All communication in English during matches",
        "Respect for opponents and officials"
      ]
    },
    streamLinks: [
      { 
        platform: "YouTube", 
        url: "https://youtube.com/mrvlnet", 
        primary: true,
        languages: ["English", "Korean", "Japanese"]
      },
      { 
        platform: "Twitch", 
        url: "https://twitch.tv/mrvlnet", 
        primary: false,
        languages: ["English"]
      },
      { 
        platform: "AfreecaTV", 
        url: "https://afreecatv.com/mrvl", 
        primary: false,
        languages: ["Korean"]
      }
    ],
    socialMedia: {
      twitter: "https://twitter.com/mrvlnet",
      discord: "https://discord.gg/mrvl-pacific",
      reddit: "https://reddit.com/r/MarvelRivalsPacific"
    },
    ticketInfo: {
      available: false,
      onSale: false,
      prices: [],
      link: "",
      venue: "Matches played remotely due to ongoing format"
    },
    teams: [
      {
        id: 3,
        name: "Gen.G",
        logo: "/teams/geng-logo.png",
        region: "Korea",
        standing: 1,
        wins: 8,
        losses: 1,
        qualified: true,
        roster: [
          { name: "Meteor", role: "DPS", hero: "Iron Man" },
          { name: "Algo", role: "Flex", hero: "Black Panther" },
          { name: "Secret", role: "Tank", hero: "Doctor Strange" },
          { name: "Munchkin", role: "Support", hero: "Storm" },
          { name: "eKo", role: "Support", hero: "Luna Snow" }
        ]
      },
      {
        id: 4,
        name: "DRX",
        logo: "/teams/drx-logo.png",
        region: "Korea",
        standing: 2,
        wins: 6,
        losses: 3,
        qualified: true,
        roster: [
          { name: "stax", role: "IGL", hero: "Captain America" },
          { name: "Rb", role: "DPS", hero: "Spider-Man" },
          { name: "Zest", role: "Flex", hero: "Magneto" },
          { name: "BuZz", role: "Tank", hero: "Hulk" },
          { name: "Mako", role: "Support", hero: "Rocket Raccoon" }
        ]
      },
      {
        id: 23,
        name: "Paper Rex",
        logo: "/teams/prx-logo.png",
        region: "Singapore",
        standing: 3,
        wins: 7,
        losses: 2,
        qualified: true,
        roster: [
          { name: "f0rsakeN", role: "DPS", hero: "Iron Man" },
          { name: "Jinggg", role: "Flex", hero: "Black Panther" },
          { name: "d4v41", role: "Tank", hero: "Hulk" },
          { name: "mindfreak", role: "Support", hero: "Luna Snow" },
          { name: "Benkai", role: "IGL", hero: "Captain America" }
        ]
      }
    ],
    schedule: [
      {
        date: "2025-05-22",
        matches: [
          {
            id: "301",
            time: "15:00",
            team1: "Gen.G",
            team2: "DRX",
            stage: "Playoffs - Upper Final",
            stream: "Main Stream",
            live: true
          }
        ]
      },
      {
        date: "2025-05-25",
        matches: [
          {
            id: "302",
            time: "15:00",
            team1: "Paper Rex",
            team2: "Winner of Lower Bracket",
            stage: "Playoffs - Lower Final",
            stream: "Main Stream"
          }
        ]
      }
    ],
    brackets: {
      regularSeason: {
        completed: true,
        standings: [
          { team: "Gen.G", wins: 8, losses: 1, mapDiff: "+12" },
          { team: "Paper Rex", wins: 7, losses: 2, mapDiff: "+8" },
          { team: "DRX", wins: 6, losses: 3, mapDiff: "+4" },
          { team: "BOOM Esports", wins: 5, losses: 4, mapDiff: "+2" }
        ]
      },
      playoffs: {
        upperBracket: [
          { match: "Gen.G vs DRX", status: "live", date: "2025-05-22" }
        ],
        lowerBracket: [
          { match: "Paper Rex vs BOOM", status: "upcoming", date: "2025-05-24" }
        ],
        grandFinal: { status: "pending", date: "2025-05-26" }
      }
    },
    stats: {
      registeredTeams: 10,
      totalSlots: 10,
      currentViewers: 89340,
      peakViewers: 125000,
      totalMatches: 45,
      matchesCompleted: 42,
      prizeDistributed: 0
    },
    news: [
      {
        id: 1,
        title: "Gen.G and DRX Face Off in Upper Final",
        summary: "The Korean powerhouses clash for a direct path to the Grand Final",
        date: "2025-05-22T10:00:00.000Z",
        author: "MRVL Pacific",
        link: "/news/geng-drx-upper-final"
      }
    ],
    tags: ["champions-tour", "apac", "regional", "ongoing"],
    featured: true,
    trending: true,
    createdAt: "2025-01-15T10:00:00.000Z",
    updatedAt: "2025-05-22T16:30:00.000Z"
  }
};

// Cache and rate limiting
let cachedEventDetails = new Map<string, any>();
const CACHE_DURATION = 30000; // 30 seconds
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

// Update live event data
function updateLiveEventData(eventId: string) {
  const event = eventDetails[eventId as keyof typeof eventDetails];
  if (!event || event.status !== 'playoffs') return event;

  const now = Date.now();
  const cacheKey = `${eventId}_${Math.floor(now / CACHE_DURATION)}`;
  
  if (cachedEventDetails.has(cacheKey)) {
    return cachedEventDetails.get(cacheKey);
  }

  const updatedEvent = { ...event };
  
  // Simulate viewer count changes for ongoing events
  if (event.stats.currentViewers) {
    const baseViewers = event.stats.currentViewers;
    const fluctuation = Math.floor(Math.random() * 5000) - 2500;
    updatedEvent.stats.currentViewers = Math.max(0, baseViewers + fluctuation);
  }
  
  updatedEvent.updatedAt = new Date().toISOString();
  
  cachedEventDetails.set(cacheKey, updatedEvent);
  return updatedEvent;
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

    // Extract event ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    // Find event
    let event = eventDetails[id as keyof typeof eventDetails];
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update live event data if ongoing
    if (event.status === 'playoffs' || event.type === 'ongoing') {
      event = updateLiveEventData(id);
    }

    // Mobile optimization
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      // Reduce data for mobile clients
      const mobileEvent = {
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        startDate: event.startDate,
        endDate: event.endDate,
        location: {
          city: event.location.city,
          country: event.location.country,
          venue: event.location.venue
        },
        prize: event.prize,
        type: event.type,
        status: event.status,
        region: event.region,
        format: event.format,
        media: {
          image: event.media.image,
          banner: event.media.banner
        },
        description: event.description,
        streamLinks: event.streamLinks,
        teams: event.teams?.slice(0, 8), // Top 8 teams for mobile
        schedule: event.schedule,
        stats: event.stats,
        ticketInfo: event.ticketInfo,
        featured: event.featured
      };
      
      return NextResponse.json({
        success: true,
        data: mobileEvent,
        meta: {
          mobile: true,
          timestamp: new Date().toISOString(),
          isLive: event.type === 'ongoing'
        }
      });
    }

    // Full desktop response
    return NextResponse.json({
      success: true,
      data: event,
      meta: {
        timestamp: new Date().toISOString(),
        isLive: event.type === 'ongoing',
        mobile: false
      }
    });

  } catch (error) {
    console.error('Event detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update event (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    const body = await request.json();
    
    // Find event
    if (!eventDetails[id as keyof typeof eventDetails]) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Update event data
    const updatedEvent = {
      ...eventDetails[id as keyof typeof eventDetails],
      ...body,
      updatedAt: new Date().toISOString()
    };

    // Update in database (mock)
    (eventDetails as any)[id] = updatedEvent;

    // Clear cache
    cachedEventDetails.clear();

    console.log(`[ADMIN] Event ${id} updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Register team for event (User/Team action)
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    const body = await request.json();
    const { teamId, teamName, roster } = body;
    
    // Find event
    const event = eventDetails[id as keyof typeof eventDetails];
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Check if registration is open
    const now = new Date();
    const registrationStart = new Date(event.registrationStart);
    const registrationEnd = new Date(event.registrationEnd);
    
    if (now < registrationStart || now > registrationEnd) {
      return NextResponse.json(
        { error: 'Registration is not currently open for this event' },
        { status: 400 }
      );
    }

    // Check if event is full
    if (event.stats.registeredTeams >= event.stats.totalSlots) {
      return NextResponse.json(
        { error: 'Event is full' },
        { status: 400 }
      );
    }

    // Check if team is already registered
    const alreadyRegistered = event.teams?.some((team: any) => team.id === teamId);
    if (alreadyRegistered) {
      return NextResponse.json(
        { error: 'Team is already registered for this event' },
        { status: 409 }
      );
    }

    // Register team (mock registration)
    const newTeam = {
      id: teamId,
      name: teamName,
      roster: roster || [],
      registeredAt: new Date().toISOString()
    };

    // Update event (mock)
    event.teams = event.teams || [];
    event.teams.push(newTeam);
    event.stats.registeredTeams += 1;
    event.updatedAt = new Date().toISOString();

    console.log(`[REGISTRATION] Team ${teamName} registered for ${event.name}`);

    return NextResponse.json({
      success: true,
      message: 'Team registered successfully',
      team: newTeam,
      event: {
        id: event.id,
        name: event.name,
        registeredTeams: event.stats.registeredTeams,
        totalSlots: event.stats.totalSlots
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Team registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
