/**
 * 🎮 MARVEL RIVALS COMPLETE DATA REFERENCE
 * Season 2.5 - July 2025
 * Perfect synchronization between MatchForm, MatchDetailPage, and LiveScoring
 */

// 🗺️ COMPLETE MAP POOL - SEASON 2.5 ACCURATE DATA
export const MARVEL_RIVALS_MAPS = {
  // COMPETITIVE MAPS (4 Total - Season 2)
  competitive: [
    {
      id: 'krakoa',
      name: 'Hellfire Gala: Krakoa',
      mode: 'Domination',
      type: 'competitive',
      icon: '🔥',
      season: 2,
      description: 'NEW Season 2 competitive map'
    },
    {
      id: 'hells_heaven',
      name: 'Hydra Charteris Base: Hell\'s Heaven',
      mode: 'Domination',
      type: 'competitive',
      icon: '⚙️',
      season: 1,
      description: 'Classic domination battleground'
    },
    {
      id: 'birnin_tchalla',
      name: 'Intergalactic Empire of Wakanda: Birnin T\'Challa',
      mode: 'Domination',
      type: 'competitive',
      icon: '💎',
      season: 1,
      description: 'Wakandan capital warfare'
    },
    {
      id: 'central_park',
      name: 'Empire of Eternal Night: Central Park',
      mode: 'Convoy',
      type: 'competitive',
      icon: '🌃',
      season: 1,
      description: 'Payload escort through darkened NYC'
    }
  ],
  
  // ALL MAPS (15 Total including removed)
  all: [
    // Domination (4 maps)
    { name: 'Hellfire Gala: Krakoa', mode: 'Domination', status: 'active', competitive: true },
    { name: 'Yggsgard: Royal Palace', mode: 'Domination', status: 'removed', season: 2 },
    { name: 'Hydra Charteris Base: Hell\'s Heaven', mode: 'Domination', status: 'active', competitive: true },
    { name: 'Intergalactic Empire of Wakanda: Birnin T\'Challa', mode: 'Domination', status: 'active', competitive: true },
    
    // Convoy (4 maps)
    { name: 'Empire of Eternal Night: Central Park', mode: 'Convoy', status: 'active', competitive: true },
    { name: 'Tokyo 2099: Spider-Islands', mode: 'Convoy', status: 'active', competitive: false },
    { name: 'Yggsgard: Yggdrasill Path', mode: 'Convoy', status: 'active', competitive: false },
    { name: 'Empire of Eternal Night: Midtown', mode: 'Convoy', status: 'active', competitive: false },
    
    // Convergence (4 maps)
    { name: 'Empire of Eternal Night: Sanctum Sanctorum', mode: 'Convergence', status: 'active', competitive: false },
    { name: 'Tokyo 2099: Shin-Shibuya', mode: 'Convergence', status: 'removed', season: 2 },
    { name: 'Klyntar: Symbiotic Surface', mode: 'Convergence', status: 'active', competitive: false },
    { name: 'Intergalactic Empire of Wakanda: Hall of Djalia', mode: 'Convergence', status: 'active', competitive: false }
  ],
  
  // ACTIVE CASUAL MAPS (9 Total after removals)
  casual: [
    // Domination Maps (removed from competitive)
    {
      id: 'royal_palace',
      name: 'Yggsgard: Royal Palace',
      mode: 'Domination',
      type: 'casual',
      icon: '👑',
      removed: 'Season 2',
      description: 'REMOVED from competitive Season 2'
    },
    
    // Convoy Maps
    {
      id: 'spider_islands',
      name: 'Tokyo 2099: Spider-Islands',
      mode: 'Convoy',
      type: 'casual',
      icon: '🕸️',
      description: 'Futuristic Tokyo payload escort'
    },
    {
      id: 'yggdrasill_path',
      name: 'Yggsgard: Yggdrasill Path',
      mode: 'Convoy',
      type: 'casual',
      icon: '🌳',
      description: 'World tree convoy route'
    },
    {
      id: 'midtown',
      name: 'Empire of Eternal Night: Midtown',
      mode: 'Convoy',
      type: 'casual',
      icon: '🏢',
      description: 'Manhattan streets payload'
    },
    
    // Convergence Maps
    {
      id: 'sanctum_sanctorum',
      name: 'Empire of Eternal Night: Sanctum Sanctorum',
      mode: 'Convergence',
      type: 'casual',
      icon: '🔮',
      description: 'Mystical hybrid combat'
    },
    {
      id: 'shin_shibuya',
      name: 'Tokyo 2099: Shin-Shibuya',
      mode: 'Convergence',
      type: 'casual',
      icon: '🗼',
      removed: 'Season 2',
      description: 'REMOVED from rotation Season 2'
    },
    {
      id: 'symbiotic_surface',
      name: 'Klyntar: Symbiotic Surface',
      mode: 'Convergence',
      type: 'casual',
      icon: '🖤',
      description: 'Alien world convergence'
    },
    {
      id: 'hall_of_djalia',
      name: 'Intergalactic Empire of Wakanda: Hall of Djalia',
      mode: 'Convergence',
      type: 'casual',
      icon: '✨',
      description: 'Ancestral plane hybrid battle'
    }
  ]
};

// 🎮 GAME MODE SPECIFICATIONS
export const GAME_MODES = {
  Domination: {
    name: 'Domination',
    icon: '🎯',
    type: 'Control Point',
    format: 'Best of 3 rounds',
    timer: {
      preparation: 30, // seconds before unlock
      captureRate: 1.2, // seconds per 1% progress
      roundLimit: null // no hard time limit
    },
    description: 'Control single point, best of 3 rounds',
    overtime: 'Triggered when contested near round end'
  },
  Convoy: {
    name: 'Convoy',
    icon: '🚛',
    type: 'Escort',
    format: '2 rounds in Competitive (swap sides)',
    timer: {
      preparation: 30, // defender setup time
      baseTime: 300, // 5 minutes base
      checkpoint1: 180, // +3 minutes
      checkpoint2: 90 // +1.5 minutes
    },
    description: 'Escort payload through checkpoints',
    checkpoints: 3 // 2 checkpoints + final
  },
  Convergence: {
    name: 'Convergence',
    icon: '🔄',
    type: 'Hybrid',
    format: '2 rounds in Competitive (swap sides)',
    timer: {
      preparation: 30,
      capturePhase: 240, // 4 minutes
      escortPhase: 90 // 1.5 minutes
    },
    description: 'Capture point then escort payload',
    phases: ['Capture', 'Escort']
  }
};

// 🦸 COMPLETE HERO ROSTER (39 Heroes)
export const HEROES = {
  // VANGUARDS (12 Heroes - Season 2.5)
  Vanguard: [
    'Captain America',
    'Doctor Strange',
    'Groot',
    'Hulk',
    'Magneto',
    'Peni Parker',
    'Thor',
    'Venom',
    'Emma Frost', // ⭐ NEW Season 2
    'Bruce Banner',
    'Mr. Fantastic',
    'TBD' // 12th hero (roster evolving)
  ],
  
  // DUELISTS (19 Heroes - Season 2.5)
  Duelist: [
    'Black Panther',
    'Black Widow',
    'Hawkeye',
    'Hela',
    'Iron Man',
    'Magik',
    'Moon Knight',
    'Namor',
    'Psylocke',
    'Punisher',
    'Scarlet Witch',
    'Spider-Man',
    'Star-Lord',
    'Storm',
    'Wolverine',
    'Winter Soldier',
    'Iron Fist',
    'Squirrel Girl',
    'TBD' // 19th hero (roster evolving)
  ],
  
  // STRATEGISTS (8 Heroes - Season 2.5)
  Strategist: [
    'Adam Warlock',
    'Cloak & Dagger',
    'Jeff the Land Shark',
    'Loki',
    'Luna Snow',
    'Mantis',
    'Rocket Raccoon',
    'TBD' // 8th hero (roster evolving)
  ]
};

// 🏆 TOURNAMENT FORMATS
export const MATCH_FORMATS = [
  { 
    value: 'BO1', 
    label: 'Best of 1',
    maps: 1,
    winCondition: 'First to 1',
    usage: ['Open Qualifiers', 'Swiss Rounds', 'Quick Matches']
  },
  { 
    value: 'BO3', 
    label: 'Best of 3',
    maps: 3,
    winCondition: 'First to 2',
    usage: ['Group Stage', 'Regular Season', 'Upper Bracket']
  },
  { 
    value: 'BO5', 
    label: 'Best of 5',
    maps: 5,
    winCondition: 'First to 3',
    usage: ['Playoffs', 'Lower Bracket', 'Semifinals']
  },
  { 
    value: 'BO7', 
    label: 'Best of 7',
    maps: 7,
    winCondition: 'First to 4',
    usage: ['Championship Finals', 'Grand Finals', 'Major Finals']
  },
  { 
    value: 'BO9', 
    label: 'Best of 9',
    maps: 9,
    winCondition: 'First to 5',
    usage: ['World Championship', 'Season Finals', 'Special Events']
  }
];

// 📊 PLAYER STATS STRUCTURE
export const PLAYER_STATS = {
  combat: {
    eliminations: 0,
    assists: 0,
    deaths: 0,
    kda: 0,
    damage_dealt: 0,
    damage_taken: 0,
    healing_done: 0,
    damage_blocked: 0
  },
  objective: {
    objective_time: 0,
    objective_kills: 0,
    payload_distance: 0,
    capture_progress: 0
  },
  ultimate: {
    ultimates_earned: 0,
    ultimates_used: 0,
    ultimate_eliminations: 0
  },
  accuracy: {
    shots_fired: 0,
    shots_hit: 0,
    critical_hits: 0,
    accuracy_percentage: 0
  },
  hero_specific: {
    hero_name: '',
    time_played: 0,
    best_killstreak: 0,
    solo_kills: 0,
    environmental_kills: 0,
    final_blows: 0
  }
};

// 🎯 MATCH STATUS OPTIONS
export const MATCH_STATUSES = [
  { value: 'upcoming', label: 'Upcoming', icon: '📅', color: 'blue' },
  { value: 'live', label: 'Live', icon: '🔴', color: 'red' },
  { value: 'completed', label: 'Completed', icon: '✅', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', icon: '❌', color: 'gray' },
  { value: 'postponed', label: 'Postponed', icon: '⏳', color: 'orange' }
];

// 🏅 RANKING SYSTEM (23 Ranks Total - Season 2.5)
export const RANKS = {
  // Traditional Ranks (21 ranks)
  tiers: [
    { name: 'Bronze', divisions: ['III', 'II', 'I'], color: '#CD7F32', icon: '🥉' },
    { name: 'Silver', divisions: ['III', 'II', 'I'], color: '#C0C0C0', icon: '🥈' },
    { name: 'Gold', divisions: ['III', 'II', 'I'], color: '#FFD700', icon: '🥇' },
    { name: 'Platinum', divisions: ['III', 'II', 'I'], color: '#E5E4E2', icon: '💍' },
    { name: 'Diamond', divisions: ['III', 'II', 'I'], color: '#B9F2FF', icon: '💎' },
    { name: 'Grandmaster', divisions: ['III', 'II', 'I'], color: '#9B59B6', icon: '👑' },
    { name: 'Celestial', divisions: ['III', 'II', 'I'], color: '#F39C12', icon: '✨' }
  ],
  // Elite Ranks (2 ranks - no divisions)
  eliteRanks: [
    { name: 'Eternity', divisions: [], color: '#E74C3C', icon: '♾️' },
    { name: 'One Above All', divisions: [], color: '#FF0000', icon: '🌟' }
  ],
  features: {
    heroBans: 'Gold III+',
    pickBan: 'Gold III+', // Changed from Diamond III in Season 2
    chronoShield: 'Gold and below',
    rankDecay: 'Eternity and One Above All only',
    rankResets: 'Every 2 months (with seasonal updates)'
  },
  totalRanks: 23 // 7 tiers × 3 divisions + 2 elite ranks = 23 total
};

// 🌍 REGIONS
export const REGIONS = [
  { code: 'NA', name: 'North America', flag: '🇺🇸' },
  { code: 'EU', name: 'Europe', flag: '🇪🇺' },
  { code: 'APAC', name: 'Asia-Pacific', flag: '🌏' },
  { code: 'CN', name: 'China', flag: '🇨🇳' },
  { code: 'SA', name: 'South America', flag: '🌎' },
  { code: 'MENA', name: 'Middle East & North Africa', flag: '🌍' },
  { code: 'OCE', name: 'Oceania', flag: '🇦🇺' }
];

// 🎮 TEAM COMPOSITIONS
export const TEAM_COMPS = {
  standard: {
    name: '2-2-2',
    composition: { vanguard: 2, duelist: 2, strategist: 2 },
    winRate: 'Baseline'
  },
  tripleSupport: {
    name: 'Three-healer',
    composition: { vanguard: 2, duelist: 1, strategist: 3 },
    winRate: '+33% vs standard'
  },
  dive: {
    name: 'Dive Comp',
    composition: { vanguard: 1, duelist: 4, strategist: 1 },
    winRate: 'High risk, high reward'
  }
};

// 🎯 MAP POOL GENERATOR
export const getMapPool = (format, mode = 'all') => {
  const allMaps = [...MARVEL_RIVALS_MAPS.competitive, ...MARVEL_RIVALS_MAPS.casual];
  let availableMaps = allMaps;
  
  // Filter by mode if specified
  if (mode !== 'all') {
    availableMaps = allMaps.filter(map => map.mode === mode);
  }
  
  // Remove maps that are marked as removed
  availableMaps = availableMaps.filter(map => !map.removed);
  
  // Get map count based on format
  const formatConfig = MATCH_FORMATS.find(f => f.value === format);
  const mapCount = formatConfig?.maps || 1;
  
  // For competitive matches, prioritize competitive maps
  const competitiveMaps = availableMaps.filter(map => map.type === 'competitive');
  const casualMaps = availableMaps.filter(map => map.type === 'casual');
  
  let mapPool = [];
  
  // Add all competitive maps first
  mapPool.push(...competitiveMaps);
  
  // Fill remaining slots with casual maps
  if (mapPool.length < mapCount) {
    mapPool.push(...casualMaps.slice(0, mapCount - mapPool.length));
  }
  
  return mapPool.slice(0, mapCount);
};

// 🔄 MODE ROTATION FOR FORMATS
export const getModeRotation = (format) => {
  const formatConfig = MATCH_FORMATS.find(f => f.value === format);
  const mapCount = formatConfig?.maps || 1;
  
  // Competitive mode rotation pattern
  const modePattern = ['Domination', 'Convoy', 'Domination', 'Convergence', 'Convoy'];
  
  const rotation = [];
  for (let i = 0; i < mapCount; i++) {
    rotation.push(modePattern[i % modePattern.length]);
  }
  
  return rotation;
};

// 📊 MATCH DURATION ESTIMATES
export const getMatchDuration = (format) => {
  const durations = {
    BO1: { min: 12, max: 20, average: 15 },
    BO3: { min: 25, max: 45, average: 35 },
    BO5: { min: 40, max: 75, average: 60 },
    BO7: { min: 60, max: 120, average: 90 },
    BO9: { min: 80, max: 150, average: 120 }
  };
  
  return durations[format] || durations.BO3;
};

// 👥 TEAM ROSTER CONFIGURATION - CRITICAL FIX FOR 6-PLAYER SUPPORT
export const TEAM_ROSTER_CONFIG = {
  MAX_PLAYERS: 6, // Marvel Rivals supports 6-player rosters
  MIN_PLAYERS: 3, // Minimum players needed to form a team
  STARTING_LINEUP: 6, // All 6 players can play at once
  REQUIRED_ROLES: {
    'Duelist': { min: 2, max: 4 }, // At least 2 damage dealers
    'Vanguard': { min: 1, max: 3 }, // At least 1 tank
    'Strategist': { min: 1, max: 3 } // At least 1 support
  },
  ROLE_DISTRIBUTION: [
    'Duelist', 'Duelist', 'Vanguard', 'Vanguard', 'Strategist', 'Strategist'
  ]
};

// 🎯 MARVEL RIVALS SPECIFIC CONSTANTS
export const MARVEL_RIVALS_CONFIG = {
  TEAM_SIZE: 6,
  MAX_ROSTER_SIZE: 6,
  COMPETITIVE_TEAM_SIZE: 6,
  SUPPORTED_ROSTER_SIZES: [6], // Only 6-player teams supported
  MATCH_TEAM_SIZE: 6,
  TOURNAMENT_TEAM_SIZE: 6
};

// 🏆 TOURNAMENT SPECIFICATIONS
export const TOURNAMENT_FORMATS = {
  competitive: {
    timer: {
      preparation: 45, // seconds
      mapTransition: 90, // seconds between maps
      pickBanPhase: 300 // 5 minutes for draft
    },
    teamUps: {
      webWarriors: ['Spider-Man', 'Venom', 'Peni Parker'],
      xMen: ['Storm', 'Wolverine', 'Psylocke', 'Magik'],
      guardians: ['Star-Lord', 'Rocket Raccoon', 'Groot', 'Mantis'],
      avengers: ['Iron Man', 'Captain America', 'Hulk', 'Thor'],
      fantastic4: ['Mr. Fantastic', 'Invisible Woman', 'Human Torch'],
      midnightSuns: ['Doctor Strange', 'Scarlet Witch', 'Magik']
    },
    meta: {
      season: '2.5',
      lastUpdated: 'July 2025',
      nextUpdate: 'September 2025'
    }
  }
};

// 🏆 PRIZE POOLS
export const TOURNAMENT_PRIZE_POOLS = {
  ignite2025: {
    total: 3050000,
    globalFinals: 1000000,
    midSeasonFinals: 500000,
    regionalChampionship: 14500
  }
};

export default {
  MARVEL_RIVALS_MAPS,
  GAME_MODES,
  HEROES,
  MATCH_FORMATS,
  PLAYER_STATS,
  MATCH_STATUSES,
  RANKS,
  REGIONS,
  TEAM_COMPS,
  TOURNAMENT_FORMATS,
  TOURNAMENT_PRIZE_POOLS,
  TEAM_ROSTER_CONFIG, // 6-PLAYER ROSTER SUPPORT
  MARVEL_RIVALS_CONFIG, // MARVEL RIVALS SPECIFIC CONSTANTS
  getMapPool,
  getModeRotation,
  getMatchDuration
};