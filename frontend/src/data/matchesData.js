// CENTRALIZED MATCHES AND EVENTS DATA - USING REAL BACKEND TEAM IDs (11-28)
// Synced with staging.mrvl.net backend API structure

import { REAL_TEAMS, getRandomTournament } from './realTeams';

// Get specific teams by their exact backend IDs
const getTeamById = (id) => {
  return REAL_TEAMS.find(team => team.id === parseInt(id));
};

// Get teams by short names for easier matching
const getTeamByShortName = (shortName) => {
  return REAL_TEAMS.find(team => team.short_name === shortName);
};

// CENTRALIZED MATCHES DATA - USING REAL BACKEND TEAM IDs
export const CENTRALIZED_MATCHES = [
  {
    id: 1,
    team1: getTeamById(11), // Luminosity Gaming  
    team2: getTeamById(13), // Fnatic
    status: 'live',
    time: 'LIVE',
    score: '13-8',
    event: { 
      id: 1, 
      name: 'Marvel Rivals Championship 2025',
      stage: 'Grand Final',
      tier: 'S'
    },
    viewers: 45720,
    date: '2025-01-15',
    format: 'BO3',
    scheduled_at: new Date().toISOString(),
    // Backend format fields for API compatibility
    team1_id: 11,
    team2_id: 13,
    team1_score: 13,
    team2_score: 8,
    event_id: 1
  },
  {
    id: 2,
    team1: getTeamById(21), // CITADELGG
    team2: getTeamById(11), // Luminosity Gaming
    status: 'upcoming',
    time: '1:00 PM',
    score: '0-0',
    event: { 
      id: 2, 
      name: 'NA Regional Championship',
      stage: 'Semifinals',
      tier: 'A'
    },
    viewers: 0,
    date: '2025-01-15',
    format: 'BO3',
    scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    team1_id: 21,
    team2_id: 11,
    team1_score: 0,
    team2_score: 0,
    event_id: 2
  },
  {
    id: 3,
    team1: getTeamById(18), // Team Nemesis
    team2: getTeamById(20), // Rival Esports
    status: 'upcoming',
    time: '3:30 PM',
    score: '0-0',
    event: { 
      id: 3, 
      name: 'NA Last Chance Qualifier',
      stage: 'Quarter Final',
      tier: 'A'
    },
    viewers: 0,
    date: '2025-01-15',
    format: 'BO3',
    scheduled_at: new Date(Date.now() + 4.5 * 60 * 60 * 1000).toISOString(),
    team1_id: 18,
    team2_id: 20,
    team1_score: 0,
    team2_score: 0,
    event_id: 3
  },
  {
    id: 4,
    team1: getTeamById(14), // OG
    team2: getTeamById(13), // Fnatic
    status: 'upcoming',
    time: '6:00 PM',
    score: '0-0',
    event: { 
      id: 4, 
      name: 'EU Regional Championship',
      stage: 'Semifinals',
      tier: 'A'
    },
    viewers: 0,
    date: '2025-01-15',
    format: 'BO3',
    scheduled_at: new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString(),
    team1_id: 14,
    team2_id: 13,
    team1_score: 0,
    team2_score: 0,
    event_id: 4
  },
  {
    id: 5,
    team1: getTeamById(11), // Luminosity Gaming
    team2: getTeamById(17), // SHROUD-X
    status: 'upcoming',
    time: '8:30 PM',
    score: '0-0',
    event: { 
      id: 5, 
      name: 'Marvel Rivals Masters',
      stage: 'Final',
      tier: 'S'
    },
    viewers: 0,
    date: '2025-01-15',
    format: 'BO5',
    scheduled_at: new Date(Date.now() + 9.5 * 60 * 60 * 1000).toISOString(),
    team1_id: 11,
    team2_id: 17,
    team1_score: 0,
    team2_score: 0,
    event_id: 5
  },
  {
    id: 6,
    team1: getTeamById(21), // CITADELGG
    team2: getTeamById(18), // Team Nemesis
    status: 'completed',
    time: 'Yesterday',
    score: '2-1',
    event: { 
      id: 6, 
      name: 'Marvel Rivals Open Series',
      stage: 'Group Stage',
      tier: 'B'
    },
    viewers: 0,
    date: '2025-01-14',
    format: 'BO3',
    scheduled_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    team1_id: 21,
    team2_id: 18,
    team1_score: 2,
    team2_score: 1,
    event_id: 6
  },
  {
    id: 7,
    team1: getTeamById(20), // Rival Esports
    team2: getTeamById(14), // OG
    status: 'completed',
    time: '2 days ago',
    score: '2-0',
    event: { 
      id: 7, 
      name: 'Marvel Rivals Invitational',
      stage: 'Round 1',
      tier: 'B'
    },
    viewers: 0,
    date: '2025-01-13',
    format: 'BO3',
    scheduled_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    team1_id: 20,
    team2_id: 14,
    team1_score: 2,
    team2_score: 0,
    event_id: 7
  },
  {
    id: 8,
    team1: getTeamById(13), // Fnatic
    team2: getTeamById(11), // Luminosity Gaming
    status: 'completed',
    time: '3 days ago',
    score: '1-2',
    event: { 
      id: 8, 
      name: 'EU Masters',
      stage: 'Group Stage',
      tier: 'A'
    },
    viewers: 0,
    date: '2025-01-12',
    format: 'BO3',
    scheduled_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    team1_id: 13,
    team2_id: 11,
    team1_score: 1,
    team2_score: 2,
    event_id: 8
  },
  {
    id: 9,
    team1: getTeamById(15), // Sentinels
    team2: getTeamById(16), // 100 Thieves
    status: 'upcoming',
    time: '7:00 PM',
    score: '0-0',
    event: { 
      id: 3, 
      name: 'NA Last Chance Qualifier',
      stage: 'Semifinals',
      tier: 'A'
    },
    viewers: 0,
    date: '2025-01-16',
    format: 'BO3',
    scheduled_at: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    team1_id: 15,
    team2_id: 16,
    team1_score: 0,
    team2_score: 0,
    event_id: 3
  },
  {
    id: 10,
    team1: getTeamById(22), // NTMR
    team2: getTeamById(24), // TEAM1
    status: 'upcoming',
    time: '9:00 PM',
    score: '0-0',
    event: { 
      id: 7, 
      name: 'APAC Regional Championship',
      stage: 'Final',
      tier: 'A'
    },
    viewers: 0,
    date: '2025-01-16',
    format: 'BO5',
    scheduled_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    team1_id: 22,
    team2_id: 24,
    team1_score: 0,
    team2_score: 0,
    event_id: 7
  }
];

// CENTRALIZED EVENTS DATA - CONSISTENT WITH MATCHES
export const CENTRALIZED_EVENTS = [
  {
    id: 1,
    name: "Marvel Rivals Championship 2025",
    status: "live",
    stage: "Grand Finals",
    prizePool: "$1,000,000",
    teams: 8,
    region: "International",
    startDate: "2025-01-15",
    endDate: "2025-01-20",
    location: "Los Angeles, USA",
    description: "The biggest Marvel Rivals tournament of the year featuring the best teams globally.",
    format: "Double Elimination",
    organizer: "Marvel Games"
  },
  {
    id: 2,
    name: "NA Regional Championship",
    status: "live",
    stage: "Semifinals",
    prizePool: "$250,000",
    teams: 16,
    region: "North America",
    startDate: "2025-01-15",
    endDate: "2025-01-18",
    location: "Toronto, Canada",
    description: "North American teams compete for regional supremacy and international qualification.",
    format: "Single Elimination",
    organizer: "NA Marvel Esports"
  },
  {
    id: 3,
    name: "NA Last Chance Qualifier",
    status: "upcoming",
    stage: "Main Event",
    prizePool: "$100,000",
    teams: 8,
    region: "North America",
    startDate: "2025-01-16",
    endDate: "2025-01-17",
    location: "Chicago, USA",
    description: "Final chance for NA teams to qualify for international events.",
    format: "Double Elimination",
    organizer: "NA Marvel Esports"
  },
  {
    id: 4,
    name: "EU Regional Championship",
    status: "upcoming",
    stage: "Group Stage",
    prizePool: "$200,000",
    teams: 12,
    region: "Europe",
    startDate: "2025-01-17",
    endDate: "2025-01-19",
    location: "Berlin, Germany",
    description: "European teams battle for regional qualification spots.",
    format: "Round Robin + Playoffs",
    organizer: "EU Marvel Esports"
  },
  {
    id: 5,
    name: "Marvel Rivals Masters",
    status: "upcoming",
    stage: "Qualifiers",
    prizePool: "$500,000",
    teams: 24,
    region: "International",
    startDate: "2025-01-20",
    endDate: "2025-01-25",
    location: "Seoul, South Korea",
    description: "Elite international competition featuring top teams worldwide.",
    format: "Swiss System + Playoffs",
    organizer: "Marvel Games"
  },
  {
    id: 6,
    name: "Marvel Rivals Open Series",
    status: "completed",
    stage: "Finished",
    prizePool: "$50,000",
    teams: 32,
    region: "International",
    startDate: "2025-01-10",
    endDate: "2025-01-14",
    location: "Online",
    description: "Open tournament series for emerging teams and players.",
    format: "Single Elimination",
    organizer: "Community Tournament"
  },
  {
    id: 7,
    name: "APAC Regional Championship",
    status: "upcoming",
    stage: "Finals",
    prizePool: "$150,000",
    teams: 16,
    region: "Asia Pacific",
    startDate: "2025-01-16",
    endDate: "2025-01-18",
    location: "Tokyo, Japan",
    description: "Asia Pacific teams compete for regional dominance.",
    format: "Double Elimination",
    organizer: "APAC Marvel Esports"
  },
  {
    id: 8,
    name: "EU Masters",
    status: "completed",
    stage: "Finished",
    prizePool: "$150,000",
    teams: 20,
    region: "Europe",
    startDate: "2025-01-05",
    endDate: "2025-01-12",
    location: "London, UK",
    description: "European masters tournament showcasing regional talent.",
    format: "Round Robin + Playoffs",
    organizer: "EU Marvel Esports"
  }
];

// HELPER FUNCTIONS FOR CONSISTENT DATA ACCESS
export const getMatchById = (id) => {
  return CENTRALIZED_MATCHES.find(match => match.id === parseInt(id));
};

export const getEventById = (id) => {
  return CENTRALIZED_EVENTS.find(event => event.id === parseInt(id));
};

export const getLiveMatches = () => {
  return CENTRALIZED_MATCHES.filter(match => match.status === 'live');
};

export const getUpcomingMatches = () => {
  return CENTRALIZED_MATCHES.filter(match => match.status === 'upcoming');
};

export const getCompletedMatches = () => {
  return CENTRALIZED_MATCHES.filter(match => match.status === 'completed');
};

export const getLiveEvents = () => {
  return CENTRALIZED_EVENTS.filter(event => event.status === 'live');
};

export const getUpcomingEvents = () => {
  return CENTRALIZED_EVENTS.filter(event => event.status === 'upcoming');
};

export const getMatchesByEvent = (eventId) => {
  return CENTRALIZED_MATCHES.filter(match => match.event.id === parseInt(eventId));
};

// Generate matches for admin - uses same central data
export const generateAdminMatches = () => {
  return CENTRALIZED_MATCHES.map(match => ({
    ...match,
    team1_id: match.team1_id || match.team1.id,
    team2_id: match.team2_id || match.team2.id,
    event_id: match.event_id || match.event.id,
    team1_score: match.team1_score || (match.status === 'completed' ? parseInt(match.score.split('-')[0]) : 0),
    team2_score: match.team2_score || (match.status === 'completed' ? parseInt(match.score.split('-')[1]) : 0)
  }));
};

// Backend API compatibility functions
export const transformBackendMatchData = (backendMatch) => {
  const team1 = getTeamById(backendMatch.team1_id);
  const team2 = getTeamById(backendMatch.team2_id);
  
  return {
    id: backendMatch.id,
    team1: team1 ? { ...team1, score: backendMatch.team1_score || 0 } : null,
    team2: team2 ? { ...team2, score: backendMatch.team2_score || 0 } : null,
    status: backendMatch.status || 'upcoming',
    event: {
      id: backendMatch.event_id,
      name: backendMatch.event_name || 'Tournament',
      tier: 'A'
    },
    date: backendMatch.match_date || backendMatch.scheduled_at,
    format: backendMatch.format || 'BO3',
    scheduled_at: backendMatch.scheduled_at
  };
};
