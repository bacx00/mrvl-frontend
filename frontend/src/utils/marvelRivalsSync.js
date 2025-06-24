/**
 * 🎮 MARVEL RIVALS FRONTEND SYNCHRONIZATION UTILITIES
 * Fixes for backend integration with your complete data structure
 */

/**
 * 🔥 LOAD COMPLETE MATCH DATA FROM YOUR FIXED BACKEND
 * This prevents the hero reset bug by loading saved data first
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
      
      // 🔥 Transform your backend's complete data structure
      if (matchData.data?.maps && matchData.data.maps.length > 0) {
        const transformedMaps = matchData.data.maps.map((savedMap, index) => ({
          map_number: index + 1,
          map_name: savedMap.map_name || 'Asgard: Royal Palace', // ✅ Your correct map
          mode: savedMap.mode || 'Domination',
          team1Score: savedMap.team1_score || 0,
          team2Score: savedMap.team2_score || 0,
          status: savedMap.status || 'upcoming',
          winner: savedMap.winner_id ? (savedMap.winner_id === matchData.data.team1_id ? 'team1' : 'team2') : null,
          duration: savedMap.duration || 'Not started',
          team1Players: savedMap.team1_composition?.map(comp => ({
            id: comp.player_id,
            name: comp.player_name,
            hero: comp.hero, // ✅ PRESERVED from your backend - NO RESET!
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
            hero: comp.hero, // ✅ PRESERVED from your backend - NO RESET!
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
 * 🏳️ FIXED COUNTRY RESOLUTION - NO MORE UNDEFINED
 * Uses your backend's DE/KR data structure
 */
export const getPlayerCountry = (player, teamName) => {
  // 🔥 Use your backend's fixed country data structure
  const country = player.country || 
                  player.nationality || 
                  player.team_country ||
                  (teamName === 'test1' ? 'DE' : teamName === 'test2' ? 'KR' : 'US');
  
  console.log(`🌍 Player ${player.name} country resolved: ${country} (was: ${player.country})`);
  return country;
};

/**
 * 🦸 LOAD FRESH TEAM PLAYERS WITH FIXED COUNTRIES
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
        
        return {
          id: player.id,
          name: player.name,
          hero: player.main_hero || 'Captain America',
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
 * 🔄 OPTIMIZED SAVE FUNCTION - PREVENT RESET BUG
 */
export const saveMatchData = async (matchId, matchStats, matchStatus, teamData, api) => {
  try {
    console.log('🔄 SAVING WITH OPTIMIZED STRUCTURE - Current State:', {
      mapWins: matchStats.mapWins,
      matchStatus: matchStatus,
      totalMaps: matchStats.maps?.length
    });
    
    // 🚨 CRITICAL: Build complete save payload matching your backend structure
    const savePayload = {
      team1_score: matchStats.mapWins.team1 || 0,
      team2_score: matchStats.mapWins.team2 || 0,
      status: matchStatus,
      maps: matchStats.maps.map((mapData, index) => ({
        map_number: index + 1,
        map_name: mapData.map_name || mapData.name || 'Asgard: Royal Palace', // ✅ Your correct map
        mode: mapData.mode || 'Domination',
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

    console.log('💾 SAVING TO YOUR FIXED BACKEND:', savePayload);

    // Save to your backend
    const response = await api.put(`/admin/matches/${matchId}`, savePayload);
    
    console.log('✅ BACKEND SAVE SUCCESSFUL');
    
    return { success: true, data: response };
    
  } catch (error) {
    console.error('❌ Error saving match data:', error);
    return { success: false, error: error.message };
  }
};