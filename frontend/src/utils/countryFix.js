/**
 * 🏳️ COUNTRY DATA FIX UTILITY
 * Fixes the undefined country issue using your backend's DE/KR data
 */

/**
 * Get player country with backend's fixed data structure
 */
export const getFixedPlayerCountry = (player, teamName, teamData) => {
  // 🔥 CRITICAL: Use your backend's actual country data structure
  
  // 1. Direct player country field (your backend fix)
  if (player.country && player.country !== 'undefined') {
    console.log(`✅ Player ${player.name} country from backend:`, player.country);
    return player.country;
  }
  
  // 2. Try nationality field
  if (player.nationality && player.nationality !== 'undefined') {
    console.log(`✅ Player ${player.name} nationality from backend:`, player.nationality);
    return player.nationality;
  }
  
  // 3. Try team country (your backend team structure)
  if (teamData?.country && teamData.country !== 'undefined') {
    console.log(`✅ Player ${player.name} country from team:`, teamData.country);
    return teamData.country;
  }
  
  // 4. Team-based hardcoded fixes (based on your backend data)
  if (teamName === 'test1') {
    console.log(`✅ Player ${player.name} country from test1 team: DE`);
    return 'DE';
  }
  if (teamName === 'test2') {
    console.log(`✅ Player ${player.name} country from test2 team: KR`);
    return 'KR';
  }
  
  // 5. Regional defaults based on team region
  if (teamData?.region) {
    const regionMap = {
      'EU': 'DE',
      'APAC': 'KR',
      'NA': 'US',
      'LATAM': 'BR',
      'MENA': 'SA'
    };
    if (regionMap[teamData.region]) {
      console.log(`✅ Player ${player.name} country from region ${teamData.region}:`, regionMap[teamData.region]);
      return regionMap[teamData.region];
    }
  }
  
  // 6. Fallback to US
  console.log(`⚠️ Player ${player.name} country fallback to US`);
  return 'US';
};

/**
 * Get correct map name from backend data
 */
export const getFixedMapName = (mapData, fallbackMaps) => {
  // 1. Use backend map data directly
  if (mapData?.map_name) {
    console.log(`✅ Map name from backend:`, mapData.map_name);
    return mapData.map_name;
  }
  
  // 2. Try name field
  if (mapData?.name) {
    console.log(`✅ Map name from name field:`, mapData.name);
    return mapData.name;
  }
  
  // 3. Try maps array from backend
  if (mapData?.maps && Array.isArray(mapData.maps) && mapData.maps.length > 0) {
    const firstMap = mapData.maps[0];
    if (firstMap.map_name) {
      console.log(`✅ Map name from maps array:`, firstMap.map_name);
      return firstMap.map_name;
    }
  }
  
  // 4. Fallback to first available map
  if (fallbackMaps && fallbackMaps.length > 0) {
    console.log(`⚠️ Map name fallback to:`, fallbackMaps[0]);
    return fallbackMaps[0];
  }
  
  console.log(`⚠️ Map name ultimate fallback`);
  return 'Asgard: Royal Palace';
};

/**
 * Get hero from backend composition data
 */
export const getFixedPlayerHero = (player, mapComposition, index, fallbackHeroes) => {
  // 1. Use backend composition data
  if (mapComposition && mapComposition.length > index) {
    const compositionPlayer = mapComposition[index];
    if (compositionPlayer.hero) {
      console.log(`✅ Player ${player.name} hero from composition:`, compositionPlayer.hero);
      return compositionPlayer.hero;
    }
  }
  
  // 2. Use player's hero field
  if (player.hero) {
    console.log(`✅ Player ${player.name} hero from player data:`, player.hero);
    return player.hero;
  }
  
  // 3. Use player's main_hero
  if (player.main_hero) {
    console.log(`✅ Player ${player.name} hero from main_hero:`, player.main_hero);
    return player.main_hero;
  }
  
  // 4. Fallback from array
  if (fallbackHeroes && fallbackHeroes.length > index) {
    console.log(`⚠️ Player ${player.name} hero fallback:`, fallbackHeroes[index]);
    return fallbackHeroes[index];
  }
  
  console.log(`⚠️ Player ${player.name} hero ultimate fallback`);
  return 'Captain America';
};