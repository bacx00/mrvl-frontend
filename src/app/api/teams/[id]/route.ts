import { NextRequest, NextResponse } from 'next/server';

// Type for route params
interface RouteParams {
  params: Promise<{ id: string }>;
}

// This would typically be imported from a shared data module or database in a real app
// For now we'll duplicate the data to keep the example self-contained
const teamsData = [
  {
    id: "1",
    name: "Sentinels",
    tag: "SEN",
    logo: "/teams/sentinels-logo.png",
    country: "United States",
    region: "Americas",
    ranking: 1,
    rankingPoints: 1250,
    socials: {
      twitter: "https://twitter.com/Sentinels",
      website: "https://sentinels.gg",
      discord: "https://discord.gg/sentinels"
    },
    roster: [
      { id: "101", name: "TenZ", role: "DPS", country: "Canada", joinDate: "2023-12-15" },
      { id: "102", name: "ShahZaM", role: "Support", country: "United States", joinDate: "2023-12-15" },
      { id: "103", name: "SicK", role: "Flex", country: "United States", joinDate: "2023-12-15" },
      { id: "104", name: "dapr", role: "Tank", country: "United States", joinDate: "2023-12-15" },
      { id: "105", name: "zombs", role: "Support", country: "United States", joinDate: "2023-12-15" }
    ],
    recentResults: [
      { id: "1001", opponent: "Cloud9", result: "win", score: "2-0", date: "2025-05-10", event: "Champions Tour 2025" },
      { id: "1002", opponent: "100 Thieves", result: "win", score: "2-1", date: "2025-05-03", event: "Champions Tour 2025" },
      { id: "1003", opponent: "FNATIC", result: "win", score: "2-1", date: "2025-04-26", event: "Marvel Rivals Championship" },
      { id: "1004", opponent: "Gen.G", result: "win", score: "2-0", date: "2025-04-19", event: "Marvel Rivals Championship" },
      { id: "1005", opponent: "Team Liquid", result: "loss", score: "1-2", date: "2025-04-12", event: "Champions Tour 2025" }
    ],
    upcomingMatches: [
      { id: "2001", opponent: "FNATIC", date: "2025-05-25", time: "18:00", event: "Marvel Rivals Championship" }
    ],
    achievements: [
      { title: "Champions Tour 2025: Americas - 1st Place", date: "2025-05-10" },
      { title: "Marvel Rivals Championship Spring - 2nd Place", date: "2025-04-15" },
      { title: "MRVL Invitational 2025 - 1st Place", date: "2025-03-01" }
    ],
    stats: {
      matchesPlayed: 32,
      matchesWon: 26,
      matchesLost: 6,
      mapWinRate: 78.4,
      averageMapScore: { won: 13, lost: 9 }
    },
    // Additional team details for individual team page
    description: "Sentinels is an American esports organization founded in 2018. The organization's Marvel Rivals team was formed in December 2023, bringing together a roster of experienced esports professionals. The team has quickly established itself as one of the dominant forces in the Americas region.",
    heroStats: [
      { hero: "Iron Man", playTime: 428, winRate: 82.5 },
      { hero: "Captain America", playTime: 352, winRate: 76.2 },
      { hero: "Spider-Man", playTime: 284, winRate: 72.1 },
      { hero: "Doctor Strange", playTime: 246, winRate: 68.9 },
      { hero: "Magneto", playTime: 187, winRate: 64.3 }
    ],
    mapStats: [
      { map: "Asgard", played: 18, won: 15, winRate: 83.3 },
      { map: "Wakanda", played: 14, won: 11, winRate: 78.6 },
      { map: "New York", played: 12, won: 10, winRate: 83.3 },
      { map: "Sakaar", played: 10, won: 7, winRate: 70.0 },
      { map: "Tokyo", played: 8, won: 6, winRate: 75.0 }
    ],
    history: [
      { event: "MRVL Launch Tournament", placement: "1st", date: "January 2024", prize: "$25,000" },
      { event: "Champions Tour 2025 Americas: Stage 1", placement: "1st", date: "March 2024", prize: "$40,000" },
      { event: "Marvel Rivals Championship Spring", placement: "2nd", date: "April 2024", prize: "$75,000" },
      { event: "Champions Tour 2025 Americas: Finals", placement: "1st", date: "May 2024", prize: "$100,000" }
    ]
  },
  {
    id: "2",
    name: "FNATIC",
    tag: "FNC",
    logo: "/teams/fnatic-logo.png",
    country: "United Kingdom",
    region: "EMEA",
    ranking: 2,
    rankingPoints: 1205,
    socials: {
      twitter: "https://twitter.com/FNATIC",
      website: "https://fnatic.com",
      discord: "https://discord.gg/fnatic"
    },
    roster: [
      { id: "201", name: "Boaster", role: "Support", country: "United Kingdom", joinDate: "2023-11-20" },
      { id: "202", name: "Derke", role: "DPS", country: "Finland", joinDate: "2023-11-20" },
      { id: "203", name: "Alfajer", role: "DPS", country: "Turkey", joinDate: "2023-11-20" },
      { id: "204", name: "Chronicle", role: "Flex", country: "Russia", joinDate: "2023-11-20" },
      { id: "205", name: "Leo", role: "Tank", country: "Sweden", joinDate: "2023-11-20" }
    ],
    recentResults: [
      { id: "2001", opponent: "Team Liquid", result: "win", score: "2-0", date: "2025-05-15", event: "Champions Tour 2025: EMEA" },
      { id: "2002", opponent: "G2 Esports", result: "win", score: "2-1", date: "2025-05-08", event: "Champions Tour 2025: EMEA" },
      { id: "2003", opponent: "Karmine Corp", result: "win", score: "2-0", date: "2025-04-30", event: "Champions Tour 2025: EMEA" },
      { id: "2004", opponent: "FUT Esports", result: "loss", score: "1-2", date: "2025-04-22", event: "Champions Tour 2025: EMEA" },
      { id: "2005", opponent: "Sentinels", result: "loss", score: "1-2", date: "2025-04-26", event: "Marvel Rivals Championship" }
    ],
    upcomingMatches: [
      { id: "3001", opponent: "Sentinels", date: "2025-05-25", time: "18:00", event: "Marvel Rivals Championship" }
    ],
    achievements: [
      { title: "Champions Tour 2025: EMEA - 1st Place", date: "2025-05-18" },
      { title: "Marvel Rivals Championship Spring - 4th Place", date: "2025-04-15" },
      { title: "MRVL EMEA Masters - 1st Place", date: "2025-03-20" }
    ],
    stats: {
      matchesPlayed: 34,
      matchesWon: 27,
      matchesLost: 7,
      mapWinRate: 76.5,
      averageMapScore: { won: 13, lost: 8 }
    },
    description: "FNATIC is a leading global esports brand headquartered in London. The organization's Marvel Rivals team was formed in November 2023, bringing together some of Europe's top talent. The team has established itself as the strongest team in the EMEA region and one of the top contenders globally.",
    heroStats: [
      { hero: "Storm", playTime: 412, winRate: 79.8 },
      { hero: "Black Panther", playTime: 365, winRate: 74.3 },
      { hero: "Doctor Strange", playTime: 298, winRate: 71.2 },
      { hero: "Iron Man", playTime: 253, winRate: 69.7 },
      { hero: "Luna Snow", playTime: 179, winRate: 62.1 }
    ],
    mapStats: [
      { map: "Wakanda", played: 16, won: 14, winRate: 87.5 },
      { map: "Tokyo", played: 15, won: 12, winRate: 80.0 },
      { map: "Asgard", played: 13, won: 9, winRate: 69.2 },
      { map: "New York", played: 10, won: 8, winRate: 80.0 },
      { map: "Sakaar", played: 8, won: 5, winRate: 62.5 }
    ],
    history: [
      { event: "MRVL EMEA Invitational", placement: "2nd", date: "January 2024", prize: "$15,000" },
      { event: "Champions Tour 2025 EMEA: Stage 1", placement: "2nd", date: "March 2024", prize: "$30,000" },
      { event: "Marvel Rivals Championship Spring", placement: "4th", date: "April 2024", prize: "$40,000" },
      { event: "Champions Tour 2025 EMEA: Finals", placement: "1st", date: "May 2024", prize: "$80,000" }
    ]
  },
  {
    id: "3",
    name: "Gen.G",
    tag: "GEN",
    logo: "/teams/geng-logo.png",
    country: "South Korea",
    region: "APAC",
    ranking: 3,
    rankingPoints: 1180,
    socials: {
      twitter: "https://twitter.com/GenG",
      website: "https://geng.gg",
      discord: "https://discord.gg/geng"
    },
    roster: [
      { id: "301", name: "Meteor", role: "DPS", country: "South Korea", joinDate: "2024-01-10" },
      { id: "302", name: "Algo", role: "Flex", country: "South Korea", joinDate: "2024-01-10" },
      { id: "303", name: "Secret", role: "Support", country: "South Korea", joinDate: "2024-01-10" },
      { id: "304", name: "Munchkin", role: "DPS", country: "South Korea", joinDate: "2024-01-10" },
      { id: "305", name: "eKo", role: "Tank", country: "South Korea", joinDate: "2024-01-10" }
    ],
    recentResults: [
      { id: "3001", opponent: "DRX", result: "win", score: "2-1", date: "2025-05-15", event: "Champions Tour 2025: APAC" },
      { id: "3002", opponent: "Paper Rex", result: "win", score: "2-0", date: "2025-05-08", event: "Champions Tour 2025: APAC" },
      { id: "3003", opponent: "BOOM Esports", result: "win", score: "2-0", date: "2025-04-30", event: "Champions Tour 2025: APAC" },
      { id: "3004", opponent: "Team Secret", result: "win", score: "2-1", date: "2025-04-22", event: "Champions Tour 2025: APAC" },
      { id: "3005", opponent: "Sentinels", result: "loss", score: "0-2", date: "2025-04-19", event: "Marvel Rivals Championship" }
    ],
    upcomingMatches: [
      { id: "4001", opponent: "DRX", date: "2025-05-30", time: "16:00", event: "Champions Tour 2025: APAC Finals" }
    ],
    achievements: [
      { title: "Champions Tour 2025: APAC - 1st Place", date: "2025-05-20" },
      { title: "Marvel Rivals Championship Spring - 3rd Place", date: "2025-04-15" },
      { title: "MRVL APAC Open - 1st Place", date: "2025-02-28" }
    ],
    stats: {
      matchesPlayed: 29,
      matchesWon: 23,
      matchesLost: 6,
      mapWinRate: 75.8,
      averageMapScore: { won: 13, lost: 10 }
    },
    description: "Gen.G is a global esports organization founded in 2017 with headquarters in Seoul, South Korea and Los Angeles, USA. The team's Marvel Rivals roster consists entirely of South Korean players who have brought methodical gameplay and innovative strategies to the game.",
    heroStats: [
      { hero: "Iron Man", playTime: 398, winRate: 77.6 },
      { hero: "Black Panther", playTime: 374, winRate: 73.8 },
      { hero: "Storm", playTime: 311, winRate: 70.2 },
      { hero: "Luna Snow", playTime: 267, winRate: 68.9 },
      { hero: "Doctor Strange", playTime: 165, winRate: 63.5 }
    ],
    mapStats: [
      { map: "Tokyo", played: 15, won: 13, winRate: 86.7 },
      { map: "Wakanda", played: 14, won: 11, winRate: 78.6 },
      { map: "Asgard", played: 12, won: 9, winRate: 75.0 },
      { map: "Sakaar", played: 9, won: 6, winRate: 66.7 },
      { map: "New York", played: 8, won: 5, winRate: 62.5 }
    ],
    history: [
      { event: "MRVL APAC Kickoff", placement: "1st", date: "January 2024", prize: "$20,000" },
      { event: "Champions Tour 2025 APAC: Stage 1", placement: "1st", date: "March 2024", prize: "$35,000" },
      { event: "Marvel Rivals Championship Spring", placement: "3rd", date: "April 2024", prize: "$50,000" },
      { event: "Champions Tour 2025 APAC: Finals", placement: "1st", date: "May 2024", prize: "$75,000" }
    ]
  }
  // Additional team data would be here in a real implementation
];

// Extended player profiles for roster pages
const playerProfiles = {
  "101": {
    id: "101",
    name: "TenZ",
    fullName: "Tyson Ngo",
    role: "DPS",
    country: "Canada",
    age: 23,
    bio: "TenZ is widely regarded as one of the most mechanically gifted players in the game. Known for his exceptional aim and aggressive playstyle, he primarily plays heroes that require precise targeting and quick reflexes.",
    mainHeroes: ["Iron Man", "Spider-Man", "Black Panther"],
    stats: {
      averageDamage: 184,
      eliminations: 22.7,
      kd: 1.8,
      assists: 6.8,
      firstElimRate: 28.4,
      heroPlaytime: [
        { hero: "Iron Man", playTime: 186, winRate: 85.2 },
        { hero: "Spider-Man", playTime: 124, winRate: 79.3 },
        { hero: "Black Panther", playTime: 98, winRate: 76.5 }
      ]
    },
    achievements: [
      "Marvel Rivals Championship 2025 Spring - MVP",
      "Most eliminations in a single map (42)",
      "Highest damage per round average (198.5)"
    ],
    socialMedia: {
      twitter: "https://twitter.com/TenZOfficial",
      twitch: "https://twitch.tv/TenZ",
      instagram: "https://instagram.com/TenZOfficial"
    }
  },
  "201": {
    id: "201",
    name: "Boaster",
    fullName: "Jake Howlett",
    role: "Support",
    country: "United Kingdom",
    age: 25,
    bio: "Boaster is known for his innovative strategies and in-game leadership. As the team captain, he coordinates FNATIC's gameplay and often makes unexpected tactical decisions that catch opponents off-guard.",
    mainHeroes: ["Doctor Strange", "Luna Snow", "Storm"],
    stats: {
      averageDamage: 126,
      eliminations: 14.2,
      kd: 1.3,
      assists: 12.6,
      firstElimRate: 12.8,
      heroPlaytime: [
        { hero: "Doctor Strange", playTime: 156, winRate: 77.4 },
        { hero: "Luna Snow", playTime: 138, winRate: 73.2 },
        { hero: "Storm", playTime: 112, winRate: 71.6 }
      ]
    },
    achievements: [
      "Champions Tour 2025 EMEA - Best Support",
      "Highest assist average in a tournament (14.8)",
      "Most diverse hero pool (10 heroes with significant playtime)"
    ],
    socialMedia: {
      twitter: "https://twitter.com/boaster",
      twitch: "https://twitch.tv/boaster",
      instagram: "https://instagram.com/boastergg"
    }
  },
  "301": {
    id: "301",
    name: "Meteor",
    fullName: "Park Min-Seok",
    role: "DPS",
    country: "South Korea",
    age: 22,
    bio: "Meteor is Gen.G's star DPS player, known for his exceptional aim and quick decision making. He specializes in heroes that require precise tracking and has developed unique playstyles for several characters.",
    mainHeroes: ["Iron Man", "Luna Snow", "Captain America"],
    stats: {
      averageDamage: 176,
      eliminations: 21.3,
      kd: 1.7,
      assists: 5.9,
      firstElimRate: 26.1,
      heroPlaytime: [
        { hero: "Iron Man", playTime: 168, winRate: 81.3 },
        { hero: "Luna Snow", playTime: 146, winRate: 76.8 },
        { hero: "Captain America", playTime: 84, winRate: 73.4 }
      ]
    },
    achievements: [
      "Champions Tour 2025 APAC - MVP",
      "Highest elimination record in APAC (38 in a single map)",
      "Most improved player award - MRVL APAC"
    ],
    socialMedia: {
      twitter: "https://twitter.com/Meteor_GG",
      twitch: "https://twitch.tv/MeteorGG",
      instagram: "https://instagram.com/meteor_official"
    }
  }
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  // Get team id from URL parameters
  const { id: teamId } = await params;
  
  // Find the matching team
  const team = teamsData.find(team => team.id === teamId);
  
  // If no team is found, return 404 error
  if (!team) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }
  
  // Check if detailed player info is requested
  const playerId = request.nextUrl.searchParams.get('player');
  
  if (playerId) {
    // Find player in the team's roster
    const player = team.roster.find(p => p.id === playerId);
    
    if (!player) {
      return NextResponse.json({ error: 'Player not found in this team' }, { status: 404 });
    }
    
    // Get extended player profile if available
    const playerProfile = playerProfiles[playerId as keyof typeof playerProfiles];
    
    if (!playerProfile) {
      // If no extended profile, return the basic roster info
      return NextResponse.json(player);
    }
    
    // Return the detailed player profile
    return NextResponse.json(playerProfile);
  }
  
  // Return the team data
  return NextResponse.json(team);
}
