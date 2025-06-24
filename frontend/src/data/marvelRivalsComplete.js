/**
 * 🎮 COMPLETE MARVEL RIVALS GAME DATA - PRODUCTION READY
 * All maps, modes, formats, and heroes for perfect match flow
 */

// 🗺️ ALL 8 MARVEL RIVALS MAPS - COMPLETE LIST
export const MARVEL_RIVALS_MAPS = [
  {
    name: 'Tokyo 2099: Shibuya Sky',
    modes: ['Convoy', 'Domination'],
    icon: '🏙️',
    checkpoints: ['Sky Terminal', 'Neo-Shibuya Plaza', 'Quantum Bridge'],
    description: 'Escort payload through futuristic Tokyo skyline',
    duration: { convoy: '5:00 → 3:00+ → 1:30+', domination: 'Best of 3 rounds' }
  },
  {
    name: 'Klyntar: Symbiote Planet',
    modes: ['Domination', 'Convergence'],
    icon: '🖤',
    checkpoints: ['Symbiote Nest', 'Dark Chambers', 'Venom Core'],
    description: 'Control the single point in alien symbiote world',
    duration: { domination: 'Best of 3 rounds', convergence: '4:00 capture → 1:30 escort' }
  },
  {
    name: 'Asgard: Royal Palace',
    modes: ['Domination', 'Convergence'],
    icon: '⚡',
    checkpoints: ['Rainbow Bridge', 'Throne Chamber', "Odin's Vault"],
    description: 'Capture then escort through Asgardian royal halls',
    duration: { domination: 'Best of 3 rounds', convergence: '4:00 capture → 1:30 escort' }
  },
  {
    name: 'Tokyo 2099: Shin-Shibuya Station',
    modes: ['Convoy', 'Conquest'],
    icon: '🚅',
    checkpoints: ['Platform Alpha', 'Central Hub', 'Departure Terminal'],
    description: 'Push payload through underground metro system',
    duration: { convoy: '5:00 → 3:00+ → 1:30+', conquest: '3:50 minutes' }
  },
  {
    name: 'Wakanda: Golden City',
    modes: ['Conquest', 'Domination'],
    icon: '💎',
    checkpoints: ['Vibranium Mines', 'Royal Plaza', 'Panther Temple'],
    description: 'Battle for 50 Chromium points in Wakandan capital',
    duration: { conquest: '3:50 minutes', domination: 'Best of 3 rounds' }
  },
  {
    name: 'Sanctum Sanctorum: Astral Plane',
    modes: ['Convoy', 'Conquest'],
    icon: '🔮',
    checkpoints: ['Astral Gateway', 'Mystic Library', 'Infinity Sanctum'],
    description: 'Navigate mystical dimensions with Doctor Strange',
    duration: { convoy: '5:00 → 3:00+ → 1:30+', conquest: '3:50 minutes' }
  },
  {
    name: 'Yggsgard: Yggdrasil',
    modes: ['Convergence', 'Domination'],
    icon: '🌳',
    checkpoints: ['World Tree Roots', 'Branches of Reality', 'Crown of Worlds'],
    description: 'Battle across the cosmic world tree',
    duration: { convergence: '4:00 capture → 1:30 escort', domination: 'Best of 3 rounds' }
  },
  {
    name: 'Midtown Manhattan: Oscorp Tower',
    modes: ['Convoy', 'Conquest'],
    icon: '🏢',
    checkpoints: ['Street Level', 'Lab Floors', 'Executive Penthouse'],
    description: 'Fight through Norman Osborn\'s corporate fortress',
    duration: { convoy: '5:00 → 3:00+ → 1:30+', conquest: '3:50 minutes' }
  }
];

// 🎮 ALL 4 GAME MODES - COMPLETE DEFINITIONS
export const MARVEL_RIVALS_MODES = {
  Convoy: {
    name: 'Convoy',
    icon: '🚛',
    type: 'Escort',
    description: 'Escort payload through 3 checkpoints',
    timing: '5:00 → 3:00+ → 1:30+',
    objective: 'Push robot through map to final destination',
    phases: ['Checkpoint 1: 5:00', 'Checkpoint 2: 3:00+', 'Checkpoint 3: 1:30+'],
    winCondition: 'Escort robot furthest or complete the route'
  },
  Domination: {
    name: 'Domination',
    icon: '🎯',
    type: 'Control Point',
    description: 'Control single point, best of 3 rounds',
    timing: 'Best of 3 rounds',
    objective: 'Capture and hold the central control point',
    phases: ['Round 1', 'Round 2', 'Round 3 (if needed)'],
    winCondition: 'First team to win 2 rounds'
  },
  Convergence: {
    name: 'Convergence',
    icon: '🔄',
    type: 'Hybrid',
    description: 'Capture point then escort payload',
    timing: '4:00 capture → 1:30 escort',
    objective: 'Capture control point, then escort robot',
    phases: ['Capture Phase: 4:00', 'Escort Phase: 1:30'],
    winCondition: 'Capture point and escort robot furthest'
  },
  Conquest: {
    name: 'Conquest',
    icon: '💎',
    type: 'Resource Control',
    description: 'First to 50 Chromium points wins',
    timing: '3:50 minutes',
    objective: 'Collect Chromium to reach 50 points',
    phases: ['Single Phase: 3:50'],
    winCondition: 'First team to collect 50 Chromium points'
  }
};

// 🏆 ALL MATCH FORMATS - INCLUDING BO7
export const MARVEL_RIVALS_FORMATS = [
  { 
    value: 'BO1', 
    label: 'BO1 - Best of 1', 
    maps: 1, 
    description: 'Single elimination match',
    winCondition: 'First to win 1 map',
    commonFor: ['Qualifiers', 'Swiss rounds', 'Quick matches']
  },
  { 
    value: 'BO3', 
    label: 'BO3 - Best of 3', 
    maps: 3, 
    description: 'First to win 2 maps',
    winCondition: 'First to win 2 maps',
    commonFor: ['Regular season', 'Group stage', 'Early playoffs']
  },
  { 
    value: 'BO5', 
    label: 'BO5 - Best of 5', 
    maps: 5, 
    description: 'First to win 3 maps',
    winCondition: 'First to win 3 maps',
    commonFor: ['Semifinals', 'Important matches', 'Upper bracket']
  },
  { 
    value: 'BO7', 
    label: 'BO7 - Best of 7', 
    maps: 7, 
    description: 'First to win 4 maps',
    winCondition: 'First to win 4 maps',
    commonFor: ['Grand Finals', 'Championship', 'Lower bracket finals']
  }
];

// 🦸 ALL 22 MARVEL RIVALS HEROES - COMPLETE ROSTER
export const MARVEL_RIVALS_HEROES = {
  Tank: [
    'Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto', 
    'Peni Parker', 'The Thing', 'Thor', 'Venom'
  ],
  Duelist: [
    'Black Panther', 'Black Widow', 'Hawkeye', 'Hela', 'Human Torch',
    'Iron Fist', 'Iron Man', 'Magik', 'Moon Knight', 'Namor', 
    'Psylocke', 'The Punisher', 'Scarlet Witch', 'Spider-Man', 
    'Squirrel Girl', 'Star-Lord', 'Storm', 'Wolverine'
  ],
  Support: [
    'Adam Warlock', 'Cloak & Dagger', 'Invisible Woman', 'Jeff the Land Shark', 
    'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon'
  ]
};

// 🎯 MATCH STATUS OPTIONS
export const MARVEL_RIVALS_STATUSES = [
  { value: 'upcoming', label: '📅 Upcoming', color: 'blue' },
  { value: 'live', label: '🔴 Live', color: 'red' },
  { value: 'paused', label: '⏸️ Paused', color: 'yellow' },
  { value: 'completed', label: '✅ Completed', color: 'green' },
  { value: 'cancelled', label: '❌ Cancelled', color: 'gray' },
  { value: 'postponed', label: '⏳ Postponed', color: 'yellow' }
];

// 🎮 COMPLETE MARVEL RIVALS CONFIGURATION
export const COMPLETE_MARVEL_RIVALS_CONFIG = {
  maps: MARVEL_RIVALS_MAPS.map(map => map.name),
  modes: Object.keys(MARVEL_RIVALS_MODES),
  formats: MARVEL_RIVALS_FORMATS,
  herosByRole: MARVEL_RIVALS_HEROES,
  statuses: MARVEL_RIVALS_STATUSES,
  mapData: MARVEL_RIVALS_MAPS,
  modeData: MARVEL_RIVALS_MODES
};

// 🗺️ MAP SELECTION HELPERS
export const getMapsByMode = (mode) => {
  return MARVEL_RIVALS_MAPS.filter(map => map.modes.includes(mode));
};

export const getModesForMap = (mapName) => {
  const map = MARVEL_RIVALS_MAPS.find(m => m.name === mapName);
  return map ? map.modes : [];
};

export const getMapDuration = (mapName, mode) => {
  const map = MARVEL_RIVALS_MAPS.find(m => m.name === mapName);
  if (map && map.duration[mode.toLowerCase()]) {
    return map.duration[mode.toLowerCase()];
  }
  return MARVEL_RIVALS_MODES[mode]?.timing || 'Unknown';
};

// 🏆 FORMAT HELPERS
export const getFormatConfig = (format) => {
  return MARVEL_RIVALS_FORMATS.find(f => f.value === format) || MARVEL_RIVALS_FORMATS[0];
};

export const getMapCountForFormat = (format) => {
  const config = getFormatConfig(format);
  return config.maps;
};

// 🦸 HERO HELPERS
export const getHeroRole = (heroName) => {
  for (const [role, heroes] of Object.entries(MARVEL_RIVALS_HEROES)) {
    if (heroes.includes(heroName)) {
      return role;
    }
  }
  return 'Tank'; // Default fallback
};

export const getAllHeroes = () => {
  return Object.values(MARVEL_RIVALS_HEROES).flat();
};

export const getHeroesByRole = (role) => {
  return MARVEL_RIVALS_HEROES[role] || [];
};

export default COMPLETE_MARVEL_RIVALS_CONFIG;