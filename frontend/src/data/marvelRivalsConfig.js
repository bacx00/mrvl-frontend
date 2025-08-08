/**
 * 🎮 UPDATED MARVEL RIVALS CONFIG - COMPLETE COVERAGE
 * All maps, modes, formats (including BO7), and heroes
 */
import { COMPLETE_MARVEL_RIVALS_CONFIG } from './marvelRivalsComplete.js';

// Export the complete configuration for use in components
export const MARVEL_RIVALS_CONFIG = COMPLETE_MARVEL_RIVALS_CONFIG;

// ✅ PERFECT MATCH INITIALIZATION WITH ALL FORMATS
export const getInitialMatchData = (format = 'BO1') => {
  const formatConfig = MARVEL_RIVALS_CONFIG.formats.find(f => f.value === format);
  const mapCount = formatConfig?.maps || 1; // Support BO1, BO3, BO5, BO7
  
  console.log(`🎮 COMPLETE INITIALIZATION: ${format} match with ${mapCount} maps`);
  
  return {
    team1_id: '',
    team2_id: '',
    event_id: '',
    scheduled_at: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    format: format,
    status: 'upcoming',
    stream_url: '',
    description: '',
    team1_score: 0,
    team2_score: 0,
    // 🚨 CRITICAL: Support ALL format types (BO1, BO3, BO5, BO7)
    maps: Array.from({ length: mapCount }, (_, index) => ({
      map_number: index + 1,
      map_name: MARVEL_RIVALS_CONFIG.maps[index % MARVEL_RIVALS_CONFIG.maps.length],
      mode: index % 2 === 0 ? 'Convoy' : 'Domination', // Alternate modes
      team1_score: 0,
      team2_score: 0,
      status: 'upcoming',
      winner: null,
      duration: 'Not started',
      // 🚨 EMPTY COMPOSITIONS - WILL BE POPULATED WITH REAL PLAYERS
      team1_composition: [],
      team2_composition: []
    })),
    viewers: 0,
    featured: false,
    map_pool: MARVEL_RIVALS_CONFIG.maps.slice(0, mapCount) // EXACTLY mapCount maps
  };
};

// 🗺️ MAP POOL GENERATOR FOR DIFFERENT FORMATS
export const generateMapPool = (format) => {
  const mapCount = getInitialMatchData(format).maps.length;
  
  // For larger formats, use diverse map selection
  const diverseMaps = [
    'Tokyo 2099: Shibuya Sky',     // Convoy
    'Asgard: Royal Palace',        // Convergence  
    'Klyntar: Symbiote Planet',    // Domination
    'Wakanda: Golden City',        // Conquest
    'Sanctum Sanctorum: Astral Plane', // Convoy
    'Yggsgard: Yggdrasil',         // Convergence
    'Midtown Manhattan: Oscorp Tower'  // Conquest
  ];
  
  return diverseMaps.slice(0, mapCount);
};

// 🎮 MODE ROTATION FOR FORMATS
export const getModeRotation = (format) => {
  const modes = ['Convoy', 'Domination', 'Convergence', 'Conquest'];
  const mapCount = getInitialMatchData(format).maps.length;
  
  // Ensure good mode variety for longer formats
  const rotation = [];
  for (let i = 0; i < mapCount; i++) {
    rotation.push(modes[i % modes.length]);
  }
  
  return rotation;
};

export default MARVEL_RIVALS_CONFIG;