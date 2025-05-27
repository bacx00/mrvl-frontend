import { NextRequest, NextResponse } from 'next/server';

// Comprehensive match details database
const matchDetails = {
  "1": {
    id: "1",
    team1: {
      id: 1,
      name: "Sentinels",
      shortName: "SEN",
      logo: "/teams/sentinels-logo.png",
      country: "USA",
      region: "americas",
      score: 13,
      roster: [
        { 
          id: 1, 
          name: "TenZ", 
          realName: "Tyson Ngo",
          hero: "Iron Man", 
          kills: 24, 
          deaths: 16, 
          assists: 8, 
          acs: 285,
          kd: 1.50,
          adr: 168,
          firstKills: 5,
          firstDeaths: 2,
          clutches: 2,
          multikills: 3,
          headshotPercentage: 32,
          ultUsage: 4,
          ultSuccess: 3
        },
        { 
          id: 2, 
          name: "ShahZaM", 
          realName: "Shahzeb Khan",
          hero: "Doctor Strange", 
          kills: 18, 
          deaths: 14, 
          assists: 12, 
          acs: 245,
          kd: 1.29,
          adr: 145,
          firstKills: 3,
          firstDeaths: 3,
          clutches: 1,
          multikills: 1,
          headshotPercentage: 28,
          ultUsage: 3,
          ultSuccess: 2
        },
        { 
          id: 3, 
          name: "SicK", 
          realName: "Hunter Mims",
          hero: "Captain America", 
          kills: 16, 
          deaths: 15, 
          assists: 10, 
          acs: 218,
          kd: 1.07,
          adr: 132,
          firstKills: 2,
          firstDeaths: 4,
          clutches: 0,
          multikills: 2,
          headshotPercentage: 25,
          ultUsage: 5,
          ultSuccess: 3
        },
        { 
          id: 4, 
          name: "dapr", 
          realName: "Michael Gulino",
          hero: "Spider-Man", 
          kills: 15, 
          deaths: 12, 
          assists: 9, 
          acs: 202,
          kd: 1.25,
          adr: 124,
          firstKills: 1,
          firstDeaths: 2,
          clutches: 1,
          multikills: 1,
          headshotPercentage: 30,
          ultUsage: 4,
          ultSuccess: 4
        },
        { 
          id: 5, 
          name: "zombs", 
          realName: "Jared Gitlin",
          hero: "Magneto", 
          kills: 14, 
          deaths: 15, 
          assists: 11, 
          acs: 195,
          kd: 0.93,
          adr: 118,
          firstKills: 0,
          firstDeaths: 1,
          clutches: 0,
          multikills: 0,
          headshotPercentage: 22,
          ultUsage: 3,
          ultSuccess: 2
        }
      ]
    },
    team2: {
      id: 2,
      name: "Cloud9",
      shortName: "C9",
      logo: "/teams/cloud9-logo.png",
      country: "USA",
      region: "americas",
      score: 10,
      roster: [
        { 
          id: 6, 
          name: "leaf", 
          realName: "Nathan Orf",
          hero: "Black Panther", 
          kills: 19, 
          deaths: 18, 
          assists: 7, 
          acs: 241,
          kd: 1.06,
          adr: 152,
          firstKills: 4,
          firstDeaths: 3,
          clutches: 1,
          multikills: 2,
          headshotPercentage: 35,
          ultUsage: 4,
          ultSuccess: 2
        },
        { 
          id: 7, 
          name: "xeppaa", 
          realName: "Erick Bach",
          hero: "Hulk", 
          kills: 17, 
          deaths: 17, 
          assists: 9, 
          acs: 225,
          kd: 1.00,
          adr: 138,
          firstKills: 2,
          firstDeaths: 4,
          clutches: 0,
          multikills: 1,
          headshotPercentage: 27,
          ultUsage: 5,
          ultSuccess: 3
        },
        { 
          id: 8, 
          name: "mitch", 
          realName: "Mitchell Semago",
          hero: "Storm", 
          kills: 15, 
          deaths: 17, 
          assists: 11, 
          acs: 205,
          kd: 0.88,
          adr: 125,
          firstKills: 1,
          firstDeaths: 3,
          clutches: 1,
          multikills: 0,
          headshotPercentage: 24,
          ultUsage: 4,
          ultSuccess: 1
        },
        { 
          id: 9, 
          name: "vanity", 
          realName: "Anthony Malaspina",
          hero: "Luna Snow", 
          kills: 14, 
          deaths: 19, 
          assists: 12, 
          acs: 198,
          kd: 0.74,
          adr: 112,
          firstKills: 0,
          firstDeaths: 5,
          clutches: 0,
          multikills: 0,
          headshotPercentage: 20,
          ultUsage: 6,
          ultSuccess: 4
        },
        { 
          id: 10, 
          name: "Xeta", 
          realName: "Kim Jin-woo",
          hero: "Rocket Raccoon", 
          kills: 11, 
          deaths: 16, 
          assists: 15, 
          acs: 185,
          kd: 0.69,
          adr: 98,
          firstKills: 1,
          firstDeaths: 2,
          clutches: 0,
          multikills: 0,
          headshotPercentage: 18,
          ultUsage: 3,
          ultSuccess: 2
        }
      ]
    },
    status: "completed",
    winner: "team1",
    event: {
      id: "champ2025",
      name: "Champions Tour 2025: Americas",
      stage: "Playoffs - Semi-Finals",
      logo: "/events/champions-tour.png",
      prizePool: "$250,000",
      organizer: "NetEase Games"
    },
    date: "2025-05-05T18:00:00.000Z",
    startTime: "2025-05-05T18:00:00.000Z",
    endTime: "2025-05-05T19:45:32.000Z",
    duration: "1h 45m 32s",
    timezone: "UTC",
    vod: "https://watch.mrvl.net/123456",
    highlights: "https://highlights.mrvl.net/123456",
    livestream: null,
    region: "americas",
    format: "Bo3",
    viewersPeak: 125420,
    averageViewers: 98340,
    chatMessages: 45670,
    
    // Map details
    maps: [
      {
        id: 1,
        name: "Asgard",
        type: "Control",
        winner: "team1",
        score: { team1: 13, team2: 10 },
        firstHalf: { team1: 9, team2: 3 },
        secondHalf: { team1: 4, team2: 7 },
        overtime: null,
        duration: "45m 32s",
        mvp: {
          playerId: 1,
          playerName: "TenZ",
          team: "Sentinels",
          kills: 24,
          deaths: 16,
          acs: 285
        }
      }
    ],
    
    // Series information
    series: {
      type: "Bo3",
      score: { team1: 1, team2: 0 },
      mapsPlayed: 1,
      mapsRemaining: 0
    },
    
    // Match timeline
    timeline: [
      {
        id: 1,
        timestamp: "2025-05-05T18:00:00.000Z",
        type: "match_start",
        description: "Match begins on Asgard",
        score: { team1: 0, team2: 0 }
      },
      {
        id: 2,
        timestamp: "2025-05-05T18:15:30.000Z",
        type: "first_blood",
        description: "TenZ (Iron Man) gets first blood on leaf (Black Panther)",
        player: "TenZ",
        team: "team1",
        score: { team1: 1, team2: 0 }
      },
      {
        id: 3,
        timestamp: "2025-05-05T18:32:45.000Z",
        type: "half_time",
        description: "Half-time reached",
        score: { team1: 9, team2: 3 }
      },
      {
        id: 4,
        timestamp: "2025-05-05T19:20:15.000Z",
        type: "clutch",
        description: "TenZ wins 1v2 clutch to secure round",
        player: "TenZ",
        team: "team1",
        score: { team1: 12, team2: 8 }
      },
      {
        id: 5,
        timestamp: "2025-05-05T19:45:32.000Z",
        type: "match_end",
        description: "Sentinels win 13-10 on Asgard",
        score: { team1: 13, team2: 10 }
      }
    ],
    
    // Combined player statistics
    playerStats: [
      { 
        playerId: 1, 
        name: "TenZ", 
        team: "Sentinels", 
        hero: "Iron Man", 
        kills: 24, 
        deaths: 16, 
        assists: 8, 
        acs: 285, 
        kd: 1.50,
        rating: 1.32
      },
      { 
        playerId: 6, 
        name: "leaf", 
        team: "Cloud9", 
        hero: "Black Panther", 
        kills: 19, 
        deaths: 18, 
        assists: 7, 
        acs: 241, 
        kd: 1.06,
        rating: 1.08
      },
      { 
        playerId: 2, 
        name: "ShahZaM", 
        team: "Sentinels", 
        hero: "Doctor Strange", 
        kills: 18, 
        deaths: 14, 
        assists: 12, 
        acs: 245, 
        kd: 1.29,
        rating: 1.25
      },
      { 
        playerId: 7, 
        name: "xeppaa", 
        team: "Cloud9", 
        hero: "Hulk", 
        kills: 17, 
        deaths: 17, 
        assists: 9, 
        acs: 225, 
        kd: 1.00,
        rating: 1.02
      },
      { 
        playerId: 3, 
        name: "SicK", 
        team: "Sentinels", 
        hero: "Captain America", 
        kills: 16, 
        deaths: 15, 
        assists: 10, 
        acs: 218, 
        kd: 1.07,
        rating: 1.05
      },
      { 
        playerId: 8, 
        name: "mitch", 
        team: "Cloud9", 
        hero: "Storm", 
        kills: 15, 
        deaths: 17, 
        assists: 11, 
        acs: 205, 
        kd: 0.88,
        rating: 0.95
      },
      { 
        playerId: 4, 
        name: "dapr", 
        team: "Sentinels", 
        hero: "Spider-Man", 
        kills: 15, 
        deaths: 12, 
        assists: 9, 
        acs: 202, 
        kd: 1.25,
        rating: 1.15
      },
      { 
        playerId: 9, 
        name: "vanity", 
        team: "Cloud9", 
        hero: "Luna Snow", 
        kills: 14, 
        deaths: 19, 
        assists: 12, 
        acs: 198, 
        kd: 0.74,
        rating: 0.88
      },
      { 
        playerId: 5, 
        name: "zombs", 
        team: "Sentinels", 
        hero: "Magneto", 
        kills: 14, 
        deaths: 15, 
        assists: 11, 
        acs: 195, 
        kd: 0.93,
        rating: 0.98
      },
      { 
        playerId: 10, 
        name: "Xeta", 
        team: "Cloud9", 
        hero: "Rocket Raccoon", 
        kills: 11, 
        deaths: 16, 
        assists: 15, 
        acs: 185, 
        kd: 0.69,
        rating: 0.85
      }
    ],
    
    // Hero statistics
    heroStats: [
      { hero: "Iron Man", team: "Sentinels", pickRate: 100, winRate: 100, kda: 2.0, damagePerRound: 168 },
      { hero: "Doctor Strange", team: "Sentinels", pickRate: 100, winRate: 100, kda: 2.14, damagePerRound: 145 },
      { hero: "Captain America", team: "Sentinels", pickRate: 100, winRate: 100, kda: 1.73, damagePerRound: 132 },
      { hero: "Spider-Man", team: "Sentinels", pickRate: 100, winRate: 100, kda: 2.0, damagePerRound: 124 },
      { hero: "Magneto", team: "Sentinels", pickRate: 100, winRate: 100, kda: 1.67, damagePerRound: 118 },
      { hero: "Black Panther", team: "Cloud9", pickRate: 100, winRate: 0, kda: 1.44, damagePerRound: 152 },
      { hero: "Hulk", team: "Cloud9", pickRate: 100, winRate: 0, kda: 1.53, damagePerRound: 138 },
      { hero: "Storm", team: "Cloud9", pickRate: 100, winRate: 0, kda: 1.53, damagePerRound: 125 },
      { hero: "Luna Snow", team: "Cloud9", pickRate: 100, winRate: 0, kda: 1.37, damagePerRound: 112 },
      { hero: "Rocket Raccoon", team: "Cloud9", pickRate: 100, winRate: 0, kda: 1.63, damagePerRound: 98 }
    ],

    // Match commentary/analysis
    commentary: [
      {
        id: 1,
        timestamp: "2025-05-05T18:00:00.000Z",
        author: "MRVL Analysis Team",
        content: "Sentinels come into this match as favorites, having dominated the regular season with TenZ in exceptional form."
      },
      {
        id: 2,
        timestamp: "2025-05-05T18:15:30.000Z",
        author: "Live Commentary",
        content: "TenZ with the opening pick! Iron Man's mobility proving crucial in these early engagements."
      },
      {
        id: 3,
        timestamp: "2025-05-05T19:45:32.000Z",
        author: "Post-Match Analysis",
        content: "A dominant performance from Sentinels. TenZ's 24 kills led the way, but the entire team showed up when it mattered."
      }
    ],

    // Social media and sharing
    social: {
      twitter: "https://twitter.com/mrvlnet/status/123456789",
      reddit: "https://reddit.com/r/MarvelRivals/comments/match123",
      highlights: "https://youtube.com/watch?v=highlights123"
    },

    // Betting odds (for reference/future)
    odds: {
      preMatch: { team1: 1.75, team2: 2.10 },
      live: null,
      outcome: "team1_win"
    },

    createdAt: "2025-05-01T10:00:00.000Z",
    updatedAt: "2025-05-05T20:45:32.000Z"
  },

  "2": {
    id: "2",
    team1: {
      id: 3,
      name: "Gen.G",
      shortName: "GEN",
      logo: "/teams/geng-logo.png",
      country: "KOR",
      region: "apac",
      score: 8,
      roster: [
        { 
          id: 11, 
          name: "Meteor", 
          realName: "Kim Tae-oh",
          hero: "Iron Man", 
          kills: 15, 
          deaths: 12, 
          assists: 5, 
          acs: 240,
          kd: 1.25,
          adr: 145,
          firstKills: 3,
          firstDeaths: 2,
          clutches: 1,
          multikills: 2,
          headshotPercentage: 28,
          ultUsage: 3,
          ultSuccess: 2
        },
        { 
          id: 12, 
          name: "Algo", 
          realName: "Kim Jun-tae",
          hero: "Black Panther", 
          kills: 12, 
          deaths: 11, 
          assists: 8, 
          acs: 220,
          kd: 1.09,
          adr: 132,
          firstKills: 2,
          firstDeaths: 3,
          clutches: 0,
          multikills: 1,
          headshotPercentage: 25,
          ultUsage: 4,
          ultSuccess: 3
        },
        { 
          id: 13, 
          name: "Secret", 
          realName: "Lee Jun-seok",
          hero: "Doctor Strange", 
          kills: 10, 
          deaths: 14, 
          assists: 9, 
          acs: 205,
          kd: 0.71,
          adr: 118,
          firstKills: 1,
          firstDeaths: 4,
          clutches: 0,
          multikills: 0,
          headshotPercentage: 22,
          ultUsage: 5,
          ultSuccess: 2
        },
        { 
          id: 14, 
          name: "Munchkin", 
          realName: "Jung Myeong-hoon",
          hero: "Storm", 
          kills: 9, 
          deaths: 15, 
          assists: 7, 
          acs: 180,
          kd: 0.60,
          adr: 98,
          firstKills: 0,
          firstDeaths: 5,
          clutches: 0,
          multikills: 0,
          headshotPercentage: 18,
          ultUsage: 4,
          ultSuccess: 1
        },
        { 
          id: 15, 
          name: "eKo", 
          realName: "Kim Geon-woo",
          hero: "Luna Snow", 
          kills: 8, 
          deaths: 16, 
          assists: 10, 
          acs: 175,
          kd: 0.50,
          adr: 89,
          firstKills: 0,
          firstDeaths: 3,
          clutches: 0,
          multikills: 0,
          headshotPercentage: 15,
          ultUsage: 6,
          ultSuccess: 4
        }
      ]
    },
    team2: {
      id: 4,
      name: "DRX",
      shortName: "DRX",
      logo: "/teams/drx-logo.png",
      country: "KOR",
      region: "apac",
      score: 12,
      roster: [
        { 
          id: 16, 
          name: "stax", 
          realName: "Kim Gu-taek",
          hero: "Captain America", 
          kills: 18, 
          deaths: 9, 
          assists: 8, 
          acs: 256,
          kd: 2.00,
          adr: 158,
          firstKills: 4,
          firstDeaths: 1,
          clutches: 2,
          multikills: 3,
          headshotPercentage: 35,
          ultUsage: 4,
          ultSuccess: 4
        },
        { 
          id: 17, 
          name: "Rb", 
          realName: "Yu Jeong-bin",
          hero: "Spider-Man", 
          kills: 16, 
          deaths: 11, 
          assists: 6, 
          acs: 238,
          kd: 1.45,
          adr: 142,
          firstKills: 3,
          firstDeaths: 2,
          clutches: 1,
          multikills: 2,
          headshotPercentage: 30,
          ultUsage: 5,
          ultSuccess: 4
        },
        { 
          id: 18, 
          name: "Zest", 
          realName: "Gu Sang-min",
          hero: "Magneto", 
          kills: 15, 
          deaths: 12, 
          assists: 7, 
          acs: 230,
          kd: 1.25,
          adr: 135,
          firstKills: 2,
          firstDeaths: 3,
          clutches: 0,
          multikills: 1,
          headshotPercentage: 27,
          ultUsage: 4,
          ultSuccess: 3
        },
        { 
          id: 19, 
          name: "BuZz", 
          realName: "Yu Byung-chul",
          hero: "Hulk", 
          kills: 14, 
          deaths: 10, 
          assists: 9, 
          acs: 225,
          kd: 1.40,
          adr: 128,
          firstKills: 2,
          firstDeaths: 2,
          clutches: 1,
          multikills: 1,
          headshotPercentage: 25,
          ultUsage: 3,
          ultSuccess: 2
        },
        { 
          id: 20, 
          name: "Mako", 
          realName: "Kim Myeong-gwan",
          hero: "Rocket Raccoon", 
          kills: 13, 
          deaths: 12, 
          assists: 14, 
          acs: 218,
          kd: 1.08,
          adr: 115,
          firstKills: 1,
          firstDeaths: 1,
          clutches: 0,
          multikills: 0,
          headshotPercentage: 20,
          ultUsage: 5,
          ultSuccess: 5
        }
      ]
    },
    status: "live",
    winner: null,
    event: {
      id: "pacific2025",
      name: "Champions Tour 2025: Pacific",
      stage: "Playoffs - Upper Final",
      logo: "/events/champions-tour-pacific.png",
      prizePool: "$250,000",
      organizer: "NetEase Games"
    },
    date: "2025-05-22T15:00:00.000Z",
    startTime: "2025-05-22T15:00:00.000Z",
    endTime: null,
    duration: "32m 15s",
    timezone: "UTC",
    livestream: "https://watch.mrvl.net/live/456789",
    region: "apac",
    format: "Bo3",
    liveViewers: 89340,
    peakViewers: 95420,
    chatMessages: 23450,
    
    maps: [
      {
        id: 1,
        name: "Wakanda",
        type: "Escort",
        winner: null,
        score: { team1: 8, team2: 12 },
        firstHalf: { team1: 3, team2: 3 },
        secondHalf: { team1: 5, team2: 9 },
        overtime: null,
        duration: "32m 15s",
        inProgress: true,
        currentRound: 21
      }
    ],
    
    series: {
      type: "Bo3",
      score: { team1: 0, team2: 0 },
      mapsPlayed: 1,
      mapsRemaining: 2
    },
    
    // Live timeline
    timeline: [
      {
        id: 1,
        timestamp: "2025-05-22T15:00:00.000Z",
        type: "match_start",
        description: "Match begins on Wakanda",
        score: { team1: 0, team2: 0 }
      },
      {
        id: 2,
        timestamp: "2025-05-22T15:12:30.000Z",
        type: "first_blood",
        description: "stax (Captain America) gets first blood on Meteor (Iron Man)",
        player: "stax",
        team: "team2",
        score: { team1: 0, team2: 1 }
      },
      {
        id: 3,
        timestamp: "2025-05-22T15:18:45.000Z",
        type: "half_time",
        description: "Half-time reached - tied 3-3",
        score: { team1: 3, team2: 3 }
      },
      {
        id: 4,
        timestamp: "2025-05-22T15:28:20.000Z",
        type: "clutch",
        description: "stax wins incredible 1v3 clutch!",
        player: "stax",
        team: "team2",
        score: { team1: 6, team2: 9 }
      },
      {
        id: 5,
        timestamp: "2025-05-22T15:32:15.000Z",
        type: "live_update",
        description: "DRX takes commanding lead 12-8",
        score: { team1: 8, team2: 12 }
      }
    ],
    
    playerStats: [
      { playerId: 16, name: "stax", team: "DRX", hero: "Captain America", kills: 18, deaths: 9, assists: 8, acs: 256, kd: 2.00, rating: 1.45 },
      { playerId: 17, name: "Rb", team: "DRX", hero: "Spider-Man", kills: 16, deaths: 11, assists: 6, acs: 238, kd: 1.45, rating: 1.32 },
      { playerId: 11, name: "Meteor", team: "Gen.G", hero: "Iron Man", kills: 15, deaths: 12, assists: 5, acs: 240, kd: 1.25, rating: 1.18 },
      { playerId: 18, name: "Zest", team: "DRX", hero: "Magneto", kills: 15, deaths: 12, assists: 7, acs: 230, kd: 1.25, rating: 1.15 },
      { playerId: 19, name: "BuZz", team: "DRX", hero: "Hulk", kills: 14, deaths: 10, assists: 9, acs: 225, kd: 1.40, rating: 1.25 },
      { playerId: 20, name: "Mako", team: "DRX", hero: "Rocket Raccoon", kills: 13, deaths: 12, assists: 14, acs: 218, kd: 1.08, rating: 1.12 },
      { playerId: 12, name: "Algo", team: "Gen.G", hero: "Black Panther", kills: 12, deaths: 11, assists: 8, acs: 220, kd: 1.09, rating: 1.05 },
      { playerId: 13, name: "Secret", team: "Gen.G", hero: "Doctor Strange", kills: 10, deaths: 14, assists: 9, acs: 205, kd: 0.71, rating: 0.88 },
      { playerId: 14, name: "Munchkin", team: "Gen.G", hero: "Storm", kills: 9, deaths: 15, assists: 7, acs: 180, kd: 0.60, rating: 0.78 },
      { playerId: 15, name: "eKo", team: "Gen.G", hero: "Luna Snow", kills: 8, deaths: 16, assists: 10, acs: 175, kd: 0.50, rating: 0.75 }
    ],
    
    heroStats: [
      { hero: "Captain America", team: "DRX", pickRate: 100, winRate: 0, kda: 2.89, damagePerRound: 158 },
      { hero: "Spider-Man", team: "DRX", pickRate: 100, winRate: 0, kda: 2.00, damagePerRound: 142 },
      { hero: "Magneto", team: "DRX", pickRate: 100, winRate: 0, kda: 1.83, damagePerRound: 135 },
      { hero: "Hulk", team: "DRX", pickRate: 100, winRate: 0, kda: 2.30, damagePerRound: 128 },
      { hero: "Rocket Raccoon", team: "DRX", pickRate: 100, winRate: 0, kda: 2.25, damagePerRound: 115 },
      { hero: "Iron Man", team: "Gen.G", pickRate: 100, winRate: 0, kda: 1.67, damagePerRound: 145 },
      { hero: "Black Panther", team: "Gen.G", pickRate: 100, winRate: 0, kda: 1.82, damagePerRound: 132 },
      { hero: "Doctor Strange", team: "Gen.G", pickRate: 100, winRate: 0, kda: 1.36, damagePerRound: 118 },
      { hero: "Storm", team: "Gen.G", pickRate: 100, winRate: 0, kda: 1.07, damagePerRound: 98 },
      { hero: "Luna Snow", team: "Gen.G", pickRate: 100, winRate: 0, kda: 1.13, damagePerRound: 89 }
    ],

    commentary: [
      {
        id: 1,
        timestamp: "2025-05-22T15:00:00.000Z",
        author: "Live Commentary",
        content: "The Korean showdown begins! Both teams looking strong in scrimmages leading up to this match."
      },
      {
        id: 2,
        timestamp: "2025-05-22T15:28:20.000Z",
        author: "Live Commentary",
        content: "WHAT A CLUTCH FROM STAX! The Captain America play was absolutely incredible - 1v3 and he makes it look easy!"
      }
    ],

    social: {
      twitter: "https://twitter.com/mrvlnet/status/live123456",
      reddit: "https://reddit.com/r/MarvelRivals/comments/live_thread",
      highlights: null
    },

    odds: {
      preMatch: { team1: 2.20, team2: 1.65 },
      live: { team1: 3.50, team2: 1.25 },
      outcome: null
    },

    createdAt: "2025-05-20T10:00:00.000Z",
    updatedAt: "2025-05-22T15:32:15.000Z"
  }
};

// Cache for real-time updates
let liveMatchCache = new Map<string, any>();
const LIVE_CACHE_DURATION = 5000; // 5 seconds for live matches

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 50;
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

// Simulate real-time updates for live matches
function updateLiveMatchData(matchId: string) {
  const match = matchDetails[matchId as keyof typeof matchDetails];
  if (!match || match.status !== 'live') return match;

  // Simulate score changes and stats updates
  const now = Date.now();
  const cacheKey = `${matchId}_${Math.floor(now / LIVE_CACHE_DURATION)}`;
  
  if (liveMatchCache.has(cacheKey)) {
    return liveMatchCache.get(cacheKey);
  }

  // Create updated match data with simulated changes
  const updatedMatch = { ...match };
  
  // Simulate viewer count fluctuation
  const baseViewers = match.liveViewers;
  const fluctuation = Math.floor(Math.random() * 2000) - 1000;
  updatedMatch.liveViewers = Math.max(0, baseViewers + fluctuation);
  
  // Update timestamp
  updatedMatch.updatedAt = new Date().toISOString();
  
  // Cache the update
  liveMatchCache.set(cacheKey, updatedMatch);
  
  // Clean old cache entries
  const cutoff = now - (LIVE_CACHE_DURATION * 10);
  for (const [key, timestamp] of liveMatchCache.entries()) {
    if (timestamp < cutoff) {
      liveMatchCache.delete(key);
    }
  }
  
  return updatedMatch;
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

    // Extract match ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    // Find match
    let match = matchDetails[id as keyof typeof matchDetails];
    
    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Update live match data
    if (match.status === 'live') {
      match = updateLiveMatchData(id);
    }

    // Mobile optimization
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      // Reduce data for mobile clients
      const mobileMatch = {
        id: match.id,
        team1: {
          name: match.team1.name,
          shortName: match.team1.shortName,
          logo: match.team1.logo,
          score: match.team1.score,
          country: match.team1.country
        },
        team2: {
          name: match.team2.name,
          shortName: match.team2.shortName,
          logo: match.team2.logo,
          score: match.team2.score,
          country: match.team2.country
        },
        status: match.status,
        winner: match.winner,
        event: match.event,
        date: match.date,
        maps: match.maps,
        playerStats: match.playerStats.slice(0, 5), // Top 5 performers
        liveViewers: match.liveViewers,
        isLive: match.status === 'live'
      };
      
      return NextResponse.json({
        success: true,
        data: mobileMatch,
        meta: {
          mobile: true,
          timestamp: new Date().toISOString(),
          isLive: match.status === 'live'
        }
      });
    }

    // Full desktop response
    return NextResponse.json({
      success: true,
      data: match,
      meta: {
        timestamp: new Date().toISOString(),
        isLive: match.status === 'live',
        mobile: false
      }
    });

  } catch (error) {
    console.error('Match detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update match (Admin only)
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const id = pathSegments[pathSegments.length - 1];
    
    const body = await request.json();
    
    // Find match
    if (!matchDetails[id as keyof typeof matchDetails]) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      );
    }

    // Update match data
    const updatedMatch = {
      ...matchDetails[id as keyof typeof matchDetails],
      ...body,
      updatedAt: new Date().toISOString()
    };

    // Update in database (mock)
    (matchDetails as any)[id] = updatedMatch;

    // Clear live cache
    liveMatchCache.clear();

    console.log(`[ADMIN] Match ${id} updated successfully`);

    return NextResponse.json({
      success: true,
      message: 'Match updated successfully',
      data: updatedMatch
    });

  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
