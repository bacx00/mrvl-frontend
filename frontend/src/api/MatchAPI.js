/**
 * 🎯 MARVEL RIVALS - PRODUCTION BACKEND INTEGRATION
 * ALIGNED WITH COMPLETE API DOCUMENTATION
 * 6v6 FORMAT - 12 PLAYERS TOTAL
 * 🚀 NEW: Instant Data Consistency with Admin Live Scoring APIs
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
    console.log('🔄 Cross-tab sync triggered:', syncData);
  },
  /**
   * 🚀 NEW: Load COMPLETE live state for admin dashboard
   * Uses NEW /admin/matches/{id}/live-state endpoint
   */
  async loadLiveState(matchId, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Loading COMPLETE live state for admin:', matchId);
      
      const response = await apiHelper.get(`/admin/matches/${matchId}/live-state`);
      const data = response?.data;
      
      if (!data) {
        throw new Error('No live state data received from backend');
      }
      
      console.log('📥 LIVE STATE data received:', data);
      
      // Transform for frontend consumption
      return {
        id: data.match.id,
        status: data.match.status,
        currentMap: data.match.current_map,
        format: data.match.format,
        viewers: data.match.viewers,
        streamUrl: data.match.stream_url,
        timerData: data.match.timer_data,
        
        // Team data with complete player rosters
        team1: {
          id: data.teams.team1.id,
          name: data.teams.team1.name,
          logo: data.teams.team1.logo,
          score: data.match.team1_score,
          players: data.teams.team1.players
        },
        team2: {
          id: data.teams.team2.id,
          name: data.teams.team2.name, 
          logo: data.teams.team2.logo,
          score: data.match.team2_score,
          players: data.teams.team2.players
        },
        
        // Maps data from your new system
        maps: data.maps || [],
        playerStats: data.player_stats || {},
        
        // Event info
        event: data.event,
        lastUpdated: data.last_updated
      };
      
    } catch (error) {
      console.error('❌ MatchAPI: Error loading live state:', error);
      throw error;
    }
  },

  /**
   * 🔍 Load complete match scoreboard (PRODUCTION ENDPOINT)
   * Uses /matches/{id}/scoreboard - 6v6 format with 12 players
   */
  async loadCompleteMatch(matchId, apiHelper) {
    try {
      console.log('🔍 MatchAPI: Loading PRODUCTION scoreboard for match:', matchId);
      
      // 🚨 CRITICAL: Use PRODUCTION scoreboard endpoint
      const response = await apiHelper.get(`/matches/${matchId}/scoreboard`);
      const data = response?.data;
      
      if (!data) {
        throw new Error('No scoreboard data received from production backend');
      }
      
      console.log('📥 PRODUCTION scoreboard data received:', data);
      
      // 🚨 CRITICAL: Transform PRODUCTION API response to frontend format
      const transformedMatch = {
        id: data.match_info.id,
        status: data.match_info.status,
        currentMap: 1, // Default to map 1
        format: data.match_info.format || 'BO1',
        viewers: data.match_info.viewers || 0,
        streamUrl: data.match_info.stream_url,
        
        // 🏆 Team data from PRODUCTION API
        team1: {
          id: data.teams.team1.id,
          name: data.teams.team1.name,
          logo: data.teams.team1.logo,
          score: data.teams.team1.score || data.match_info.team1_score || 0,
          shortName: data.teams.team1.short_name
        },
        team2: {
          id: data.teams.team2.id,
          name: data.teams.team2.name,
          logo: data.teams.team2.logo,
          score: data.teams.team2.score || data.match_info.team2_score || 0,
          shortName: data.teams.team2.short_name
        },
        
        // 🗺️ CRITICAL FIX: Use actual backend maps data or create smart defaults
        maps: (() => {
          // If backend returns actual maps data, use it
          if (data.maps && data.maps.length > 0) {
            return data.maps.map((map, index) => ({
              mapNumber: index + 1,
              mapName: map.map_name || map.name || 'Tokyo 2099: Shibuya Sky',
              mode: map.mode || 'Conquest',
              status: map.status || data.match_info.status,
              team1Score: map.team1_score || 0,
              team2Score: map.team2_score || 0,
              // 🚨 FIX: Properly transform team compositions from backend maps data
              team1Composition: (map.team1_composition || []).map(comp => ({
                playerId: comp.player_id || comp.id,
                playerName: comp.player_name || comp.name,
                hero: comp.hero || comp.hero_played || 'Captain America',
                role: MatchAPI.convertRoleToFrontend(comp.role),
                country: comp.country || 'US',
                avatar: comp.avatar,
                eliminations: comp.kills || 0,
                deaths: comp.deaths || 0,
                assists: comp.assists || 0,
                damage: comp.damage || 0,
                healing: comp.healing || 0,
                damageBlocked: comp.damage_blocked || 0,
                ultimateUsage: comp.ultimate_usage || 0,
                objectiveTime: comp.objective_time || 0
              })),
              team2Composition: (map.team2_composition || []).map(comp => ({
                playerId: comp.player_id || comp.id,
                playerName: comp.player_name || comp.name,
                hero: comp.hero || comp.hero_played || 'Captain America',
                role: MatchAPI.convertRoleToFrontend(comp.role),
                country: comp.country || 'US',
                avatar: comp.avatar,
                eliminations: comp.kills || 0,
                deaths: comp.deaths || 0,
                assists: comp.assists || 0,
                damage: comp.damage || 0,
                healing: comp.healing || 0,
                damageBlocked: comp.damage_blocked || 0,
                ultimateUsage: comp.ultimate_usage || 0,
                objectiveTime: comp.objective_time || 0
              }))
            }));
          }
          
          // Otherwise create default map with player data
          return [{
            mapNumber: 1,
            mapName: data.match_info.current_map || 'Tokyo 2099: Shibuya Sky',
            mode: 'Conquest', // Marvel Rivals default mode
            status: data.match_info.status,
            team1Score: data.match_info.team1_score || 0,
            team2Score: data.match_info.team2_score || 0,
          
          // 🎮 PRODUCTION: Map 6v6 player statistics correctly
          team1Composition: data.teams.team1.players.map((player, index) => {
            const stats = data.teams.team1.statistics?.find(s => s.player_id === player.id) || {};
            return {
              playerId: player.id,
              playerName: player.name,
              hero: stats.hero_played || player.main_hero || 'Captain America',
              role: MatchAPI.convertRoleToFrontend(player.role), // Convert Vanguard/Duelist/Strategist
              country: player.country || 'DE', // test1 fallback
              avatar: player.avatar,
              // 📊 PRODUCTION API statistics mapping
              eliminations: stats.kills || 0,           // E column
              deaths: stats.deaths || 0,                // D column  
              assists: stats.assists || 0,              // A column
              damage: stats.damage || 0,                // DMG column
              healing: stats.healing || 0,              // HEAL column
              damageBlocked: stats.damage_blocked || 0, // BLK column
              ultimateUsage: stats.ultimate_usage || 0,
              objectiveTime: stats.objective_time || 0
            };
          }),
          
          team2Composition: data.teams.team2.players.map((player, index) => {
            const stats = data.teams.team2.statistics?.find(s => s.player_id === player.id) || {};
            return {
              playerId: player.id,
              playerName: player.name,
              hero: stats.hero_played || player.main_hero || 'Hulk',
              role: MatchAPI.convertRoleToFrontend(player.role),
              country: player.country || 'KR', // test2 fallback
              avatar: player.avatar,
              // 📊 PRODUCTION API statistics mapping
              eliminations: stats.kills || 0,           // E column
              deaths: stats.deaths || 0,                // D column  
              assists: stats.assists || 0,              // A column
              damage: stats.damage || 0,                // DMG column
              healing: stats.healing || 0,              // HEAL column
              damageBlocked: stats.damage_blocked || 0, // BLK column
              ultimateUsage: stats.ultimate_usage || 0,
              objectiveTime: stats.objective_time || 0
            };
          })
        }]
        })(), // End of maps IIFE
        
        // 🏳️ Full player rosters (6v6 format)
        team1Players: data.teams.team1.players.map(p => ({
          ...p,
          country: p.country || 'DE',
          role: MatchAPI.convertRoleToFrontend(p.role)
        })),
        team2Players: data.teams.team2.players.map(p => ({
          ...p,
          country: p.country || 'KR', 
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
   * 💾 Save player statistics using PRODUCTION endpoints
   * Uses /matches/{id}/players/{playerId}/stats
   */
  async savePlayerStats(matchId, playerId, stats, apiHelper) {
    try {
      console.log('💾 MatchAPI: Saving PRODUCTION player stats:', { matchId, playerId, stats });
      
      // 🎯 CRITICAL: Use PRODUCTION player stats endpoint
      const statsPayload = {
        kills: stats.eliminations || 0,        // E → kills
        deaths: stats.deaths || 0,             // D → deaths
        assists: stats.assists || 0,           // A → assists
        damage: stats.damage || 0,             // DMG → damage
        healing: stats.healing || 0,           // HEAL → healing
        damage_blocked: stats.damageBlocked || 0, // BLK → damage_blocked
        hero_played: stats.hero,
        ultimate_usage: stats.ultimateUsage || 0,
        objective_time: stats.objectiveTime || 0
      };

      const response = await apiHelper.post(`/matches/${matchId}/players/${playerId}/stats`, statsPayload);
      
      console.log('✅ PRODUCTION player stats saved:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error saving PRODUCTION player stats:', error);
      throw error;
    }
  },

  /**
   * 📺 Update viewer count using PRODUCTION endpoint
   */
  async updateViewerCount(matchId, viewers, apiHelper) {
    try {
      console.log('📺 MatchAPI: Updating PRODUCTION viewer count:', { matchId, viewers });
      
      const response = await apiHelper.post(`/matches/${matchId}/viewers`, {
        viewers: viewers,
        platform: 'Twitch',
        stream_url: 'https://twitch.tv/marvelrivals'
      });
      
      console.log('✅ PRODUCTION viewer count updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating viewer count:', error);
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

  // 🚀 NEW ADMIN ENDPOINTS - INSTANT DATA CONSISTENCY

  /**
   * 🎮 Update match status in real-time
   * Uses PUT /api/admin/matches/{id}/status
   */
  async updateMatchStatus(matchId, status, apiHelper) {
    try {
      console.log('🎮 MatchAPI: Updating match status:', { matchId, status });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/status`, {
        status: status // 'upcoming', 'live', 'paused', 'completed', 'cancelled'
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('status-update', matchId, { status });
      
      console.log('✅ Match status updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating match status:', error);
      throw error;
    }
  },

  /**
   * 🦸 Update team composition (hero changes) in real-time
   * Uses PUT /api/admin/matches/{id}/team-composition
   */
  async updateTeamComposition(matchId, mapIndex, compositions, apiHelper) {
    try {
      console.log('🦸 MatchAPI: Updating team composition:', { matchId, mapIndex, compositions });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/team-composition`, {
        map_index: mapIndex,
        team1_composition: compositions.team1_composition,
        team2_composition: compositions.team2_composition
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('composition-update', matchId, { mapIndex, compositions });
      
      console.log('✅ Team composition updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating team composition:', error);
      throw error;
    }
  },

  /**
   * 🗺️ Update current map and mode
   * Uses PUT /api/admin/matches/{id}/current-map
   */
  async updateCurrentMap(matchId, mapData, apiHelper) {
    try {
      console.log('🗺️ MatchAPI: Updating current map:', { matchId, mapData });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/current-map`, {
        current_map: mapData.mapName,
        current_mode: mapData.mode,
        map_index: mapData.mapIndex
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('map-update', matchId, mapData);
      
      console.log('✅ Current map updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating current map:', error);
      throw error;
    }
  },

  /**
   * ⏱️ Control timer (start, pause, resume, stop, sync)
   * Uses PUT /api/admin/matches/{id}/timer
   */
  async controlTimer(matchId, action, elapsed = 0, apiHelper) {
    try {
      console.log('⏱️ MatchAPI: Controlling timer:', { matchId, action, elapsed });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/timer`, {
        action: action, // 'start', 'pause', 'resume', 'stop', 'sync'
        elapsed_time: elapsed, // seconds
        round_time: 0,
        phase: 'round' // 'warmup', 'round', 'overtime', 'break'
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('timer-update', matchId, { action, elapsed });
      
      console.log('✅ Timer controlled:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error controlling timer:', error);
      throw error;
    }
  },

  /**
   * 🏆 Update match and map scores
   * Uses PUT /api/admin/matches/{id}/scores
   */
  async updateScores(matchId, scoreData, apiHelper) {
    try {
      console.log('🏆 MatchAPI: Updating scores:', { matchId, scoreData });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/scores`, scoreData);
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('score-update', matchId, scoreData);
      
      console.log('✅ Scores updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating scores:', error);
      throw error;
    }
  },

  /**
   * 📊 Update player statistics
   * Uses PUT /api/admin/matches/{id}/player-stats/{playerId}
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
        hero_played: stats.hero
      };

      const response = await apiHelper.put(`/admin/matches/${matchId}/player-stats/${playerId}`, statsPayload);
      
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
   * 🎮 Get all Marvel Rivals heroes (29 total)
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
   * 🎯 Get all game modes (4 total)
   * Uses GET /api/game-data/modes
   */
  async getAllModes(apiHelper) {
    try {
      console.log('🎯 MatchAPI: Loading all game modes');
      
      const response = await apiHelper.get('/game-data/modes');
      
      console.log('✅ Modes loaded:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error loading modes:', error);
      throw error;
    }
  },

  // 🚀 NEW ADMIN ENDPOINTS - INSTANT DATA CONSISTENCY

  /**
   * 🎮 Update match status in real-time
   * Uses PUT /api/admin/matches/{id}/status
   */
  async updateMatchStatus(matchId, status, apiHelper) {
    try {
      console.log('🎮 MatchAPI: Updating match status:', { matchId, status });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/status`, {
        status: status // 'upcoming', 'live', 'paused', 'completed', 'cancelled'
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('status-update', matchId, { status });
      
      console.log('✅ Match status updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating match status:', error);
      throw error;
    }
  },

  /**
   * 🦸 Update team composition (hero changes) in real-time
   * Uses PUT /api/admin/matches/{id}/team-composition
   */
  async updateTeamComposition(matchId, mapIndex, compositions, apiHelper) {
    try {
      console.log('🦸 MatchAPI: Updating team composition:', { matchId, mapIndex, compositions });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/team-composition`, {
        map_index: mapIndex,
        team1_composition: compositions.team1_composition,
        team2_composition: compositions.team2_composition
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('composition-update', matchId, { mapIndex, compositions });
      
      console.log('✅ Team composition updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating team composition:', error);
      throw error;
    }
  },

  /**
   * 🗺️ Update current map and mode
   * Uses PUT /api/admin/matches/{id}/current-map
   */
  async updateCurrentMap(matchId, mapData, apiHelper) {
    try {
      console.log('🗺️ MatchAPI: Updating current map:', { matchId, mapData });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/current-map`, {
        current_map: mapData.mapName,
        current_mode: mapData.mode,
        map_index: mapData.mapIndex
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('map-update', matchId, mapData);
      
      console.log('✅ Current map updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating current map:', error);
      throw error;
    }
  },

  /**
   * ⏱️ Control timer (start, pause, resume, stop, sync)
   * Uses PUT /api/admin/matches/{id}/timer
   */
  async controlTimer(matchId, action, elapsed = 0, apiHelper) {
    try {
      console.log('⏱️ MatchAPI: Controlling timer:', { matchId, action, elapsed });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/timer`, {
        action: action, // 'start', 'pause', 'resume', 'stop', 'sync'
        elapsed_time: elapsed, // seconds
        round_time: 0,
        phase: 'round' // 'warmup', 'round', 'overtime', 'break'
      });
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('timer-update', matchId, { action, elapsed });
      
      console.log('✅ Timer controlled:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error controlling timer:', error);
      throw error;
    }
  },

  /**
   * 🏆 Update match and map scores
   * Uses PUT /api/admin/matches/{id}/scores
   */
  async updateScores(matchId, scoreData, apiHelper) {
    try {
      console.log('🏆 MatchAPI: Updating scores:', { matchId, scoreData });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/scores`, scoreData);
      
      // Trigger cross-tab sync
      this.triggerCrossTabSync('score-update', matchId, scoreData);
      
      console.log('✅ Scores updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating scores:', error);
      throw error;
    }
  },

  /**
   * 📊 Update player statistics
   * Uses PUT /api/admin/matches/{id}/player-stats/{playerId}
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
        hero_played: stats.hero
      };

      const response = await apiHelper.put(`/admin/matches/${matchId}/player-stats/${playerId}`, statsPayload);
      
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
   * 🎮 Get all Marvel Rivals heroes (29 total)
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
   * 🎯 Get all game modes (4 total)
   * Uses GET /api/game-data/modes
   */
  async getAllModes(apiHelper) {
    try {
      console.log('🎯 MatchAPI: Loading all game modes');
      
      const response = await apiHelper.get('/game-data/modes');
      
      console.log('✅ Modes loaded:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error loading modes:', error);
      throw error;
    }
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