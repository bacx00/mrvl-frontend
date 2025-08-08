/**
 * 🎯 MARVEL RIVALS - PRODUCTION BACKEND INTEGRATION
 * ALIGNED WITH COMPLETE API DOCUMENTATION
 * Backend URL: https://staging.mrvl.net/api
 * Response Structure: data.match_info (not data.match)
 */

/**
 * 🔍 Helper function for country fallback logic
 * Tries multiple sources to resolve player country
 */
function findPlayerCountry(playerId, playerList = []) {
  const player = playerList.find(p => p.id === playerId);
  if (!player) return 'US';
  
  // Try multiple country sources
  return player.country || 
         player.nationality || 
         player.team_country || 
         'US';
}

/**
 * 🎮 PRODUCTION MATCH API - BACKEND ALIGNED
 * Uses EXACT endpoints from API documentation with instant data consistency
 */
export const MatchAPI = {
  // 🔐 ADMIN CONFIGURATION
  ADMIN_TOKEN: '415|ySK4yrjyULCTlprffD0KeT5zxd6J2mMMHOHkX6pv1d5fc012',
  
  // 🔧 ADMIN HEADERS
  getAdminHeaders() {
    return {
      'Authorization': `Bearer ${this.ADMIN_TOKEN}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
  },

  // 🔧 PUBLIC HEADERS  
  getPublicHeaders() {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
  },

  // 🚀 CROSS-TAB SYNC HELPER
  triggerCrossTabSync(type, matchId, additionalData = {}) {
    const syncData = {
      matchId: matchId,
      timestamp: Date.now(),
      type: type,
      ...additionalData
    };
    localStorage.setItem('mrvl-match-sync', JSON.stringify(syncData));
    console.log('🔄 ADMIN: Cross-tab sync triggered for:', { type, matchId, syncData });
    
    // Also dispatch a custom event as fallback
    window.dispatchEvent(new CustomEvent('mrvl-match-updated', {
      detail: syncData
    }));
  },

  /**
   * 🔍 Load complete match scoreboard (PRODUCTION ENDPOINT)
   * Uses /matches/{id}/live-scoreboard - NEW CORRECT STRUCTURE
   */
  async loadCompleteMatch(matchId, apiHelper) {
    try {
      console.log('🔍 MatchAPI: Loading PRODUCTION scoreboard for match:', matchId);
      
      // ✅ CORRECT: Use live-scoreboard endpoint from documentation
      const response = await apiHelper.get(`/matches/${matchId}/live-scoreboard`);
      const data = response?.data;
      
      if (!data) {
        throw new Error('No scoreboard data received from production backend');
      }
      
      console.log('📥 PRODUCTION scoreboard data received:', data);
      console.log('🔍 Data structure debug:', {
        type: typeof data,
        keys: Object.keys(data || {}),
        hasMatchInfo: !!data.match_info,
        hasTeam1Roster: !!data.team1_roster,
        hasTeam2Roster: !!data.team2_roster,
        matchInfoKeys: data.match_info ? Object.keys(data.match_info) : 'NO MATCH_INFO'
      });
      
      // ✅ CORRECT STRUCTURE: The API actually returns data.match (not data.match_info)
      const matchData = data.match || {};
      let team1Players = [];
      let team2Players = [];
      
      // ✅ PARSE MAPS_DATA JSON STRING to get player compositions
      if (matchData.maps_data) {
        try {
          const mapsData = JSON.parse(matchData.maps_data);
          if (mapsData && mapsData[0]) {
            const mapData = mapsData[0];
            team1Players = mapData.team1_composition || [];
            team2Players = mapData.team2_composition || [];
            
            console.log('✅ MatchAPI: Parsed team compositions:', {
              team1Count: team1Players.length,
              team2Count: team2Players.length
            });
          }
        } catch (error) {
          console.error('❌ MatchAPI: Error parsing maps_data JSON:', error);
        }
      }
      
      if (!matchData.id) {
        console.error('❌ No match ID found in response:', data);
        throw new Error('No match ID found in scoreboard response');
      }
      
      console.log('✅ Found match data:', matchData);
      
      // 🚨 CRITICAL: Transform PRODUCTION API response to frontend format  
      const transformedMatch = {
        id: matchData.id,
        status: matchData.status || 'unknown',
        currentMap: 1, // Default to map 1
        format: matchData.format || matchData.match_format || 'BO1',
        viewers: matchData.viewers || 0,
        streamUrl: matchData.stream_url,
        
        // 🏆 Team data - from match data
        team1: {
          id: matchData.team1_id || 'unknown',
          name: matchData.team1_name || 'Team 1',
          logo: matchData.team1_logo || '',
          score: matchData.team1_score || 0,
          shortName: matchData.team1_short || matchData.team1_name || 'T1'
        },
        team2: {
          id: matchData.team2_id || 'unknown',
          name: matchData.team2_name || 'Team 2', 
          logo: matchData.team2_logo || '',
          score: matchData.team2_score || 0,
          shortName: matchData.team2_short || matchData.team2_name || 'T2'
        },
        
        // 🗺️ Map data with team compositions from parsed maps_data
        maps: [{
          mapNumber: 1,
          mapName: matchData.current_map || 'Tokyo 2099: Shibuya Sky',
          mode: data.live_data?.current_mode || 'Domination',
          status: matchData.status,
          team1Score: matchData.team1_score || 0,
          team2Score: matchData.team2_score || 0,
          
          // 🎮 PRODUCTION: Map 6v6 player compositions from parsed maps_data
          team1Composition: team1Players.map((player, index) => ({
            playerId: player.player_id,
            name: player.player_name,
            hero: player.hero || 'Captain America',
            role: MatchAPI.convertRoleToFrontend(player.role),
            country: player.country || 'US',
            avatar: player.avatar,
            // 📊 PRODUCTION API statistics mapping
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damage_blocked || 0,
            ultimateUsage: player.ultimate_usage || 0,
            objectiveTime: player.objective_time || 0
          })),
          
          team2Composition: team2Players.map((player, index) => ({
            playerId: player.player_id,
            name: player.player_name,
            hero: player.hero || 'Hulk',
            role: MatchAPI.convertRoleToFrontend(player.role),
            country: player.country || 'US',
            avatar: player.avatar,
            // 📊 PRODUCTION API statistics mapping
            eliminations: player.eliminations || 0,
            deaths: player.deaths || 0,
            assists: player.assists || 0,
            damage: player.damage || 0,
            healing: player.healing || 0,
            damageBlocked: player.damage_blocked || 0,
            ultimateUsage: player.ultimate_usage || 0,
            objectiveTime: player.objective_time || 0
          }))
        }],
        
        // 🏳️ Full player rosters (6v6 format)
        team1Players: team1Players.map(p => ({
          ...p,
          name: p.player_name,
          country: p.country || 'US',
          role: MatchAPI.convertRoleToFrontend(p.role)
        })),
        team2Players: team2Players.map(p => ({
          ...p,
          name: p.player_name,
          country: p.country || 'US', 
          role: MatchAPI.convertRoleToFrontend(p.role)
        })),
        
        lastUpdated: Date.now()
      };
      
      console.log('✅ PRODUCTION data transformed for frontend:', transformedMatch);
      return transformedMatch;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error loading PRODUCTION scoreboard:', error);
      throw error;
    }
  },

  /**
   * 🏆 LIVE SCORING: Update match scores using live control
   * Uses PUT /api/admin/matches/{id}/live-control (from documentation)
   */
  async updateScores(matchId, scoreData, apiHelper) {
    try {
      console.log('🏆 MatchAPI: Updating scores with live control:', { matchId, scoreData });
      
      // ✅ CORRECT FORMAT: Use live-control endpoint from documentation
      const liveControlData = {
        action: "update_score",
        team1_score: scoreData.team1_score || 0,
        team2_score: scoreData.team2_score || 0,
        current_map: scoreData.current_map || scoreData.map_scores?.[0]?.map_name
      };
      
      console.log('🎯 Sending to live-control endpoint:', liveControlData);
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/live-control`, liveControlData);
      
      // ✅ Backend now returns auto-calculated overall scores
      console.log('🏆 Backend live control response:', response);
      
      // Trigger cross-tab sync with backend-calculated scores
      this.triggerCrossTabSync('score-update', matchId, {
        overallScores: {
          team1: response.data?.team1_score,
          team2: response.data?.team2_score
        },
        action: "live_control_update",
        status: response.data?.status
      });
      
      console.log('✅ Live scores updated via live-control:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating live scores:', error);
      throw error;
    }
  },

  /**
   * 📊 Update player statistics
   * Uses PUT /api/admin/matches/{id}/player/{playerId}/stats
   */
  async updatePlayerStats(matchId, playerId, stats, apiHelper) {
    try {
      console.log('📊 MatchAPI: Updating player stats:', { matchId, playerId, stats });
      
      const statsPayload = {
        eliminations: stats.eliminations || 0,
        deaths: stats.deaths || 0,
        assists: stats.assists || 0,
        damage: stats.damage || 0,
        healing: stats.healing || 0,
        damage_blocked: stats.damageBlocked || 0,
        ultimate_usage: stats.ultimateUsage || 0,
        objective_time: stats.objectiveTime || 0,
        hero_played: stats.hero,
        role_played: stats.role
      };

      const response = await apiHelper.put(`/admin/matches/${matchId}/player/${playerId}/stats`, statsPayload);
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('stats-update', matchId, { playerId, stats });
      
      console.log('✅ Player stats updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating player stats:', error);
      throw error;
    }
  },

  /**
   * 💾 Save player statistics using BULK UPDATE
   * Uses PUT /api/admin/matches/{id}/bulk-player-stats
   */
  async savePlayerStats(matchId, playerId, stats, apiHelper) {
    try {
      console.log('💾 MatchAPI: Saving PRODUCTION player stats:', { matchId, playerId, stats });
      
      // ✅ CORRECT FORMAT: Use bulk update endpoint from documentation
      const bulkData = {
        round_id: 1,
        player_stats: [{
          player_id: playerId,
          eliminations: stats.eliminations || stats.kills || 0,
          deaths: stats.deaths || 0,
          assists: stats.assists || 0,
          damage: stats.damage || 0,
          healing: stats.healing || 0,
          damage_blocked: stats.damage_blocked || 0,
          ultimate_usage: stats.ultimate_usage || 0,
          hero_played: stats.hero || stats.hero_played || "Unknown",
          role_played: stats.role || stats.role_played || "Unknown"
        }]
      };
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/bulk-player-stats`, bulkData);
      
      console.log('✅ PRODUCTION player stats saved:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error saving player stats:', error);
      throw error;
    }
  },

  /**
   * 🎮 Get all Marvel Rivals heroes (39 total)
   * Uses GET /api/game-data/all-heroes
   */
  async getAllHeroes(apiHelper) {
    try {
      console.log('🦸 MatchAPI: Loading all Marvel Rivals heroes');
      
      const response = await apiHelper.get('/game-data/all-heroes');
      
      console.log('✅ Heroes loaded:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error loading heroes:', error);
      throw error;
    }
  },

  /**
   * 🗺️ Get all Marvel Rivals maps (10 total)
   * Uses GET /api/game-data/maps
   */
  async getAllMaps(apiHelper) {
    try {
      console.log('🗺️ MatchAPI: Loading all Marvel Rivals maps');
      
      const response = await apiHelper.get('/game-data/maps');
      
      console.log('✅ Maps loaded:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error loading maps:', error);
      throw error;
    }
  },

  /**
   * 🔄 Convert Marvel Rivals roles from backend to frontend
   * Backend: Vanguard, Duelist, Strategist
   * Frontend: Tank, DPS, Support (for display)
   */
  convertRoleToFrontend(backendRole) {
    const roleMapping = {
      'Vanguard': 'Tank',
      'Duelist': 'DPS', 
      'Strategist': 'Support',
      // Fallbacks for mixed data
      'Tank': 'Tank',
      'Support': 'Support',
      'DPS': 'DPS'
    };
    return roleMapping[backendRole] || 'Tank';
  },

  /**
   * 🔄 Convert frontend roles back to Marvel Rivals backend format
   */
  convertRoleToBackend(frontendRole) {
    const roleMapping = {
      'Tank': 'Vanguard',
      'DPS': 'Duelist',
      'Support': 'Strategist'
    };
    return roleMapping[frontendRole] || 'Vanguard';
  },

  /**
   * 🌍 Load public match data (uses same scoreboard endpoint)
   */
  async loadPublicMatch(matchId, apiHelper) {
    // Use same scoreboard endpoint for public view
    return this.loadCompleteMatch(matchId, apiHelper);
  }
};

export default MatchAPI;