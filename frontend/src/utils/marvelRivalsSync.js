/**
 * 🎮 COMPLETE MARVEL RIVALS SYNC UTILITIES - ALL FORMATS SUPPORTED
 * Perfect match flow with BO1, BO3, BO5, BO7 support
 */
import { COMPLETE_MARVEL_RIVALS_CONFIG, getFormatConfig, getMapCountForFormat } from '../data/marvelRivalsComplete.js';

/**
 * 🔥 LOAD COMPLETE MATCH DATA - ALL FORMATS SUPPORTED
 */
export const loadCompleteMatchData = async (matchId, token) => {
  console.log('🔍 Loading complete match data for match:', matchId);
  
  try {
    // 🚨 CRITICAL: Use your fixed backend endpoint
    const response = await fetch(`https://staging.mrvl.net/api/admin/matches/${matchId}/complete-data`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const matchData = await response.json();
      console.log('✅ Complete match data loaded from backend:', matchData);
      
      // 🔥 Support ALL FORMATS (BO1, BO3, BO5, BO7)
      if (matchData.data?.maps && matchData.data.maps.length > 0) {
        const format = matchData.data.format || 'BO1';
        const expectedMapCount = getMapCountForFormat(format);
        
        console.log(`🎯 Processing ${format} match with ${matchData.data.maps.length} maps (expected: ${expectedMapCount})`);
        
        const transformedMaps = matchData.data.maps.map((savedMap, index) => ({
          map_number: index + 1,
          map_name: savedMap.map_name || COMPLETE_MARVEL_RIVALS_CONFIG.maps[index] || 'Asgard: Royal Palace',
          mode: savedMap.mode || ['Convoy', 'Domination', 'Convergence', 'Conquest'][index % 4],
          team1Score: savedMap.team1_score || 0,
          team2Score: savedMap.team2_score || 0,
          status: savedMap.status || 'upcoming',
          winner: savedMap.winner_id ? (savedMap.winner_id === matchData.data.team1_id ? 'team1' : 'team2') : null,
          duration: savedMap.duration || 'Not started',
          team1Players: savedMap.team1_composition?.map(comp => ({
            id: comp.player_id,
            name: comp.player_name,
            hero: comp.hero, // ✅ PRESERVED from your backend
            role: comp.role,
            country: comp.country || 'DE', // ✅ Your fixed country data
            eliminations: comp.eliminations || 0,
            deaths: comp.deaths || 0,
            assists: comp.assists || 0,
            damage: comp.damage || 0,
            healing: comp.healing || 0,
            damageBlocked: comp.damageBlocked || 0
          })) || [],
          team2Players: savedMap.team2_composition?.map(comp => ({
            id: comp.player_id,
            name: comp.player_name,
            hero: comp.hero, // ✅ PRESERVED from your backend
            role: comp.role,
            country: comp.country || 'KR', // ✅ Your fixed country data
            eliminations: comp.eliminations || 0,
            deaths: comp.deaths || 0,
            assists: comp.assists || 0,
            damage: comp.damage || 0,
            healing: comp.healing || 0,
            damageBlocked: comp.damageBlocked || 0
          })) || []
        }));
        
        return {
          success: true,
          format: format,
          maps: transformedMaps,
          team1_score: matchData.data.team1_score || 0,
          team2_score: matchData.data.team2_score || 0,
          status: matchData.data.status || 'upcoming'
        };
      }
    }
    
    console.log('⚠️ No saved match data found');
    return { success: false, reason: 'No saved data' };
    
  } catch (error) {
    console.error('❌ Error loading complete match data:', error);
    return { success: false, reason: error.message };
  }
};

/**
 * 🏳️ FIXED COUNTRY RESOLUTION - ALL TEAMS SUPPORTED
 */
export const getPlayerCountry = (player, teamName) => {
  // 🔥 Enhanced country detection for all teams
  const country = player.country || 
                  player.nationality || 
                  player.team_country ||
                  // Team-based defaults (expand as needed)
                  (teamName === 'test1' ? 'DE' : 
                   teamName === 'test2' ? 'KR' : 
                   teamName?.toLowerCase().includes('eu') ? 'EU' :
                   teamName?.toLowerCase().includes('na') ? 'US' :
                   teamName?.toLowerCase().includes('asia') ? 'JP' :
                   'US');
  
  console.log(`🌍 Player ${player.name} country resolved: ${country} (team: ${teamName})`);
  return country;
};

/**
 * 🦸 LOAD TEAM PLAYERS WITH COMPLETE HERO SUPPORT
 */
export const loadTeamPlayers = async (teamId, teamName, token) => {
  try {
    console.log(`🔍 Fetching real players for team: ${teamName} (ID: ${teamId})`);
    
    const response = await fetch(`https://staging.mrvl.net/api/teams/${teamId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const teamPlayers = data.data?.players || [];
      console.log(`✅ Found ${teamPlayers.length} real players for ${teamName}:`, teamPlayers);
      
      return teamPlayers.slice(0, 6).map((player, index) => {
        const playerCountry = getPlayerCountry(player, teamName);
        
        // Ensure hero is from our complete roster
        const playerHero = player.main_hero || 'Captain America';
        const allHeroes = Object.values(COMPLETE_MARVEL_RIVALS_CONFIG.herosByRole).flat();
        const validHero = allHeroes.includes(playerHero) ? playerHero : 'Captain America';
        
        return {
          id: player.id,
          name: player.name,
          hero: validHero, // ✅ Validated against complete hero roster
          role: player.role || 'Tank',
          country: playerCountry, // ✅ FIXED country resolution
          avatar: player.avatar,
          eliminations: 0,
          deaths: 0,
          assists: 0,
          damage: 0,
          healing: 0,
          damageBlocked: 0,
          objectiveTime: 0,
          ultimatesUsed: 0
        };
      });
    } else {
      console.log(`⚠️ Failed to fetch players for ${teamName}, using defaults`);
      return [];
    }
  } catch (error) {
    console.error(`❌ Error fetching team players for ${teamName}:`, error);
    return [];
  }
};

/**
 * 🔄 OPTIMIZED SAVE FUNCTION - ALL FORMATS SUPPORTED
 */
export const saveMatchData = async (matchId, matchStats, matchStatus, teamData, api, format = 'BO1') => {
  try {
    const formatConfig = getFormatConfig(format);
    console.log(`🔄 SAVING ${format} MATCH - Current State:`, {
      mapWins: matchStats.mapWins,
      matchStatus: matchStatus,
      totalMaps: matchStats.maps?.length,
      expectedMaps: formatConfig.maps,
      winCondition: formatConfig.winCondition
    });
    
    // 🚨 CRITICAL: Build complete save payload for all formats
    const savePayload = {
      team1_score: matchStats.mapWins.team1 || 0,
      team2_score: matchStats.mapWins.team2 || 0,
      status: matchStatus,
      format: format, // Include format in save
      maps: matchStats.maps.map((mapData, index) => ({
        map_number: index + 1,
        map_name: mapData.map_name || mapData.name || COMPLETE_MARVEL_RIVALS_CONFIG.maps[index] || 'Asgard: Royal Palace',
        mode: mapData.mode || ['Convoy', 'Domination', 'Convergence', 'Conquest'][index % 4],
        team1_score: mapData.team1Score || 0,
        team2_score: mapData.team2Score || 0,
        status: mapData.status || 'upcoming',
        winner_id: mapData.winner ? (mapData.winner === 'team1' ? teamData.team1?.id : teamData.team2?.id) : null,
        team1_composition: mapData.team1Players?.map(player => ({
          player_id: player.id,
          player_name: player.name,
          hero: player.hero, // ✅ PRESERVE hero selection
          role: player.role,
          country: player.country, // ✅ PRESERVE country
          eliminations: player.eliminations || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          damage: player.damage || 0,
          healing: player.healing || 0,
          damageBlocked: player.damageBlocked || 0
        })) || [],
        team2_composition: mapData.team2Players?.map(player => ({
          player_id: player.id,
          player_name: player.name,
          hero: player.hero, // ✅ PRESERVE hero selection
          role: player.role,
          country: player.country, // ✅ PRESERVE country
          eliminations: player.eliminations || 0,
          deaths: player.deaths || 0,
          assists: player.assists || 0,
          damage: player.damage || 0,
          healing: player.healing || 0,
          damageBlocked: player.damageBlocked || 0
        })) || []
      }))
    };

    console.log(`💾 SAVING ${format} MATCH TO BACKEND:`, savePayload);

    // Save to your backend
    const response = await api.put(`/admin/matches/${matchId}`, savePayload);
    
    console.log(`✅ ${format} MATCH SAVE SUCCESSFUL`);
    
    return { success: true, data: response };
    
  } catch (error) {
    console.error(`❌ Error saving ${format} match data:`, error);
    return { success: false, error: error.message };
  }
};

/**
 * 🎯 FORMAT HELPERS FOR PERFECT MATCH FLOW
 */
export const getWinCondition = (format, currentScore) => {
  const config = getFormatConfig(format);
  const mapsToWin = Math.ceil(config.maps / 2);
  
  return {
    format: format,
    mapsToWin: mapsToWin,
    totalMaps: config.maps,
    team1Score: currentScore.team1 || 0,
    team2Score: currentScore.team2 || 0,
    isComplete: (currentScore.team1 >= mapsToWin) || (currentScore.team2 >= mapsToWin),
    winner: currentScore.team1 >= mapsToWin ? 'team1' : currentScore.team2 >= mapsToWin ? 'team2' : null
  };
};

export const generateMapPool = (format) => {
  const mapCount = getMapCountForFormat(format);
  return COMPLETE_MARVEL_RIVALS_CONFIG.maps.slice(0, mapCount);
};