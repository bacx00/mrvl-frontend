/**
 * 🎯 MARVEL RIVALS - PRODUCTION BACKEND INTEGRATION
 * ALIGNED WITH COMPLETE API DOCUMENTATION
 * 6v6 FORMAT - 12 PLAYERS TOTAL
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
 * Uses EXACT endpoints from API documentation
 */
export const MatchAPI = {
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
              team1Composition: map.team1_composition || [],
              team2Composition: map.team2_composition || []
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

  /**
   * 🚀 NEW: Update match status using your new endpoint
   */
  async updateMatchStatus(matchId, status, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating match status:', { matchId, status });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/status`, {
        status: status
      });
      
      console.log('✅ Match status updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating match status:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update team composition using your new endpoint
   */
  async updateTeamComposition(matchId, mapIndex, team1Composition, team2Composition, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating team composition:', { matchId, mapIndex });
      
      const payload = { map_index: mapIndex };
      if (team1Composition) payload.team1_composition = team1Composition;
      if (team2Composition) payload.team2_composition = team2Composition;
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/team-composition`, payload);
      
      console.log('✅ Team composition updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating team composition:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update current map using your new endpoint
   */
  async updateCurrentMap(matchId, mapName, mode, mapIndex, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating current map:', { matchId, mapName, mode });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/current-map`, {
        current_map: mapName,
        current_mode: mode,
        map_index: mapIndex
      });
      
      console.log('✅ Current map updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating current map:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update timer using your new endpoint
   */
  async updateTimer(matchId, action, elapsedTime, roundTime, phase, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating timer:', { matchId, action, elapsedTime });
      
      const payload = { action };
      if (elapsedTime !== undefined) payload.elapsed_time = elapsedTime;
      if (roundTime !== undefined) payload.round_time = roundTime;
      if (phase) payload.phase = phase;
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/timer`, payload);
      
      console.log('✅ Timer updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating timer:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update match and map scores using your new endpoint
   */
  async updateScores(matchId, team1Score, team2Score, mapScores, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating scores:', { matchId, team1Score, team2Score });
      
      const payload = {
        team1_score: team1Score,
        team2_score: team2Score
      };
      
      if (mapScores && mapScores.length > 0) {
        payload.map_scores = mapScores;
      }
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/scores`, payload);
      
      console.log('✅ Scores updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating scores:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update individual player stats using your enhanced endpoint
   */
  async updatePlayerStats(matchId, playerId, stats, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating player stats:', { matchId, playerId, stats });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/player-stats/${playerId}`, stats);
      
      console.log('✅ Player stats updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating player stats:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update match status using your new endpoint
   */
  async updateMatchStatus(matchId, status, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating match status:', { matchId, status });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/status`, {
        status: status
      });
      
      console.log('✅ Match status updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating match status:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update team composition using your new endpoint
   */
  async updateTeamComposition(matchId, mapIndex, team1Composition, team2Composition, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating team composition:', { matchId, mapIndex });
      
      const payload = { map_index: mapIndex };
      if (team1Composition) payload.team1_composition = team1Composition;
      if (team2Composition) payload.team2_composition = team2Composition;
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/team-composition`, payload);
      
      console.log('✅ Team composition updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating team composition:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update current map using your new endpoint
   */
  async updateCurrentMap(matchId, mapName, mode, mapIndex, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating current map:', { matchId, mapName, mode });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/current-map`, {
        current_map: mapName,
        current_mode: mode,
        map_index: mapIndex
      });
      
      console.log('✅ Current map updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating current map:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update timer using your new endpoint
   */
  async updateTimer(matchId, action, elapsedTime, roundTime, phase, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating timer:', { matchId, action, elapsedTime });
      
      const payload = { action };
      if (elapsedTime !== undefined) payload.elapsed_time = elapsedTime;
      if (roundTime !== undefined) payload.round_time = roundTime;
      if (phase) payload.phase = phase;
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/timer`, payload);
      
      console.log('✅ Timer updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating timer:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update match and map scores using your new endpoint
   */
  async updateScores(matchId, team1Score, team2Score, mapScores, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating scores:', { matchId, team1Score, team2Score });
      
      const payload = {
        team1_score: team1Score,
        team2_score: team2Score
      };
      
      if (mapScores && mapScores.length > 0) {
        payload.map_scores = mapScores;
      }
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/scores`, payload);
      
      console.log('✅ Scores updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating scores:', error);
      throw error;
    }
  },

  /**
   * 🚀 NEW: Update individual player stats using your enhanced endpoint
   */
  async updatePlayerStats(matchId, playerId, stats, apiHelper) {
    try {
      console.log('🚀 MatchAPI: Updating player stats:', { matchId, playerId, stats });
      
      const response = await apiHelper.put(`/admin/matches/${matchId}/player-stats/${playerId}`, stats);
      
      console.log('✅ Player stats updated:', response);
      return response;
      
    } catch (error) {
      console.error('❌ MatchAPI: Error updating player stats:', error);
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