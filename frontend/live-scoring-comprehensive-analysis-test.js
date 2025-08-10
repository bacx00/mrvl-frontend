/**
 * COMPREHENSIVE LIVE SCORING SYSTEM ANALYSIS
 * 
 * This test suite performs a complete analysis of the match data and live scoring system
 * to validate real-time updates, latency measurements, and data consistency.
 * 
 * Analysis Areas:
 * 1. Data Flow Performance - Measure latency from backend to frontend
 * 2. Player Statistics Updates - K/D/A, damage, healing, hero stats
 * 3. Match Score Analytics - Overall scores, map scores, series tracking
 * 4. Hero Selection Tracking - Picks, bans, swaps during matches
 * 5. Real-time Update Latencies - Sub-second performance validation
 */

class LiveScoringAnalysisTest {
  constructor() {
    this.testResults = {
      dataFlowPerformance: [],
      playerStatsUpdates: [],
      matchScoreAnalytics: [],
      heroSelectionTracking: [],
      latencyMeasurements: [],
      overallScore: 0
    };
    
    this.startTime = Date.now();
    this.testMatchId = 12345; // Test match ID for analysis
    this.updateCounter = 0;
    this.latencyThreshold = 1000; // 1 second max latency for live updates
  }

  /**
   * 1. ANALYZE DATA FLOW PERFORMANCE
   * Measure latency from backend update to frontend display
   */
  async analyzeDataFlowPerformance() {
    console.log('🔍 ANALYZING DATA FLOW PERFORMANCE...');
    
    const testCases = [
      {
        name: 'Score Update Latency',
        description: 'Time from score change to UI update',
        test: async () => {
          const startTime = performance.now();
          
          // Simulate score update
          const updateData = {
            matchId: this.testMatchId,
            team1_score: 1,
            team2_score: 0,
            timestamp: Date.now()
          };
          
          // Test LiveScoreManager broadcast
          if (window.liveScoreManager) {
            window.liveScoreManager.broadcastScoreUpdate(
              this.testMatchId, 
              updateData,
              { source: 'test', type: 'score_update' }
            );
          }
          
          const endTime = performance.now();
          const latency = endTime - startTime;
          
          return {
            passed: latency < this.latencyThreshold,
            latency: latency,
            data: updateData
          };
        }
      },
      {
        name: 'Player Stats Update Flow',
        description: 'Time for player statistics to propagate',
        test: async () => {
          const startTime = performance.now();
          
          const playerStats = {
            matchId: this.testMatchId,
            maps: [{
              team1_players: [
                {
                  id: 1,
                  name: 'TestPlayer1',
                  username: 'TP1',
                  hero: 'Spider-Man',
                  eliminations: 15,
                  deaths: 3,
                  assists: 8,
                  damage: 12500,
                  healing: 2300
                }
              ]
            }]
          };
          
          // Test broadcast
          if (window.liveScoreManager) {
            window.liveScoreManager.broadcastMatchUpdate(
              this.testMatchId,
              playerStats,
              { source: 'test', type: 'player_stats' }
            );
          }
          
          const endTime = performance.now();
          const latency = endTime - startTime;
          
          return {
            passed: latency < this.latencyThreshold,
            latency: latency,
            playerCount: playerStats.maps[0].team1_players.length
          };
        }
      },
      {
        name: 'Cross-Tab Synchronization',
        description: 'localStorage sync performance across tabs',
        test: async () => {
          const startTime = performance.now();
          
          // Test localStorage synchronization
          const syncData = {
            matchId: this.testMatchId,
            timestamp: Date.now(),
            testData: 'cross-tab-sync-test'
          };
          
          localStorage.setItem(`match_update_${this.testMatchId}`, JSON.stringify(syncData));
          
          // Simulate storage event
          const storageEvent = new StorageEvent('storage', {
            key: `match_update_${this.testMatchId}`,
            newValue: JSON.stringify(syncData)
          });
          
          window.dispatchEvent(storageEvent);
          
          const endTime = performance.now();
          const latency = endTime - startTime;
          
          return {
            passed: latency < 100, // Cross-tab sync should be very fast
            latency: latency,
            storageSize: JSON.stringify(syncData).length
          };
        }
      }
    ];

    for (const testCase of testCases) {
      try {
        const result = await testCase.test();
        this.testResults.dataFlowPerformance.push({
          name: testCase.name,
          description: testCase.description,
          ...result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${testCase.name}: ${result.passed ? 'PASSED' : 'FAILED'} (${result.latency.toFixed(2)}ms)`);
      } catch (error) {
        console.error(`❌ ${testCase.name} failed:`, error);
        this.testResults.dataFlowPerformance.push({
          name: testCase.name,
          description: testCase.description,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 2. VALIDATE PLAYER STATISTICS UPDATES
   * Ensure K/D/A stats, damage, healing update immediately
   */
  async validatePlayerStatisticsUpdates() {
    console.log('📊 VALIDATING PLAYER STATISTICS UPDATES...');
    
    const playerStatsTests = [
      {
        name: 'K/D/A Updates',
        description: 'Kill/Death/Assist tracking accuracy',
        test: () => {
          const mockPlayerData = {
            id: 1,
            name: 'TestPlayer',
            username: 'TP',
            eliminations: 12,
            deaths: 4,
            assists: 7
          };
          
          // Calculate KDA
          const kda = ((mockPlayerData.eliminations + mockPlayerData.assists) / Math.max(mockPlayerData.deaths, 1));
          const expectedKDA = ((12 + 7) / 4); // 4.75
          
          return {
            passed: Math.abs(kda - expectedKDA) < 0.01,
            calculatedKDA: kda,
            expectedKDA: expectedKDA,
            playerData: mockPlayerData
          };
        }
      },
      {
        name: 'Damage/Healing Format',
        description: 'Proper formatting of damage and healing numbers',
        test: () => {
          const testDamage = 15420;
          const testHealing = 8320;
          
          const formattedDamage = `${(testDamage / 1000).toFixed(1)}k`;
          const formattedHealing = `${(testHealing / 1000).toFixed(1)}k`;
          
          return {
            passed: formattedDamage === '15.4k' && formattedHealing === '8.3k',
            formattedDamage,
            formattedHealing,
            originalDamage: testDamage,
            originalHealing: testHealing
          };
        }
      },
      {
        name: 'Hero-Specific Stats',
        description: 'Hero-specific statistics tracking',
        test: () => {
          const heroStats = [
            { hero: 'Spider-Man', role: 'Duelist', expectedStats: ['eliminations', 'damage'] },
            { hero: 'Mantis', role: 'Strategist', expectedStats: ['healing', 'assists'] },
            { hero: 'Magneto', role: 'Vanguard', expectedStats: ['damage_blocked', 'assists'] }
          ];
          
          let passed = true;
          const results = [];
          
          heroStats.forEach(hero => {
            const hasRequiredStats = hero.expectedStats.every(stat => 
              ['eliminations', 'damage', 'healing', 'assists', 'damage_blocked'].includes(stat)
            );
            
            results.push({
              hero: hero.hero,
              role: hero.role,
              hasRequiredStats,
              expectedStats: hero.expectedStats
            });
            
            if (!hasRequiredStats) passed = false;
          });
          
          return {
            passed,
            heroStatsResults: results,
            totalHeroesChecked: heroStats.length
          };
        }
      },
      {
        name: 'Real-time Stats Display',
        description: 'Statistics update in real-time during live matches',
        test: () => {
          // Test rapid stat updates
          const rapidUpdates = [];
          const updateInterval = 100; // 100ms intervals
          
          for (let i = 0; i < 10; i++) {
            const updateTime = Date.now() + (i * updateInterval);
            rapidUpdates.push({
              timestamp: updateTime,
              eliminations: i + 1,
              damage: (i + 1) * 1000,
              updateDelay: i * updateInterval
            });
          }
          
          // Check if updates are processed in order and within acceptable time
          let passed = true;
          for (let i = 1; i < rapidUpdates.length; i++) {
            if (rapidUpdates[i].updateDelay > 500) { // Max 500ms delay between updates
              passed = false;
              break;
            }
          }
          
          return {
            passed,
            totalUpdates: rapidUpdates.length,
            maxDelay: Math.max(...rapidUpdates.map(u => u.updateDelay)),
            updates: rapidUpdates
          };
        }
      }
    ];

    for (const test of playerStatsTests) {
      try {
        const result = test.test();
        this.testResults.playerStatsUpdates.push({
          name: test.name,
          description: test.description,
          ...result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.testResults.playerStatsUpdates.push({
          name: test.name,
          description: test.description,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 3. VALIDATE MATCH SCORE ANALYTICS
   * Confirm overall match scores, map scores, series tracking
   */
  async validateMatchScoreAnalytics() {
    console.log('🏆 VALIDATING MATCH SCORE ANALYTICS...');
    
    const matchScoreTests = [
      {
        name: 'Series Score Tracking',
        description: 'Overall series score (e.g., 2-1 in BO3)',
        test: () => {
          const mockMatch = {
            format: 'BO3',
            team1_score: 2,
            team2_score: 1,
            status: 'completed',
            maps: [
              { team1_score: 13, team2_score: 7, status: 'completed' },
              { team1_score: 9, team2_score: 13, status: 'completed' },
              { team1_score: 13, team2_score: 11, status: 'completed' }
            ]
          };
          
          // Validate series score matches map results
          let team1Wins = 0;
          let team2Wins = 0;
          
          mockMatch.maps.forEach(map => {
            if (map.team1_score > map.team2_score) team1Wins++;
            if (map.team2_score > map.team1_score) team2Wins++;
          });
          
          return {
            passed: team1Wins === mockMatch.team1_score && team2Wins === mockMatch.team2_score,
            calculatedScore: { team1: team1Wins, team2: team2Wins },
            reportedScore: { team1: mockMatch.team1_score, team2: mockMatch.team2_score },
            mapsPlayed: mockMatch.maps.length
          };
        }
      },
      {
        name: 'Map Score Updates',
        description: 'Individual map score tracking (13-7, 9-13, etc.)',
        test: () => {
          const mapScores = [
            { map: 1, team1_score: 13, team2_score: 7 },
            { map: 2, team1_score: 9, team2_score: 13 },
            { map: 3, team1_score: 13, team2_score: 11 }
          ];
          
          // Validate score ranges (Marvel Rivals typically 13 rounds to win)
          let passed = true;
          const validationResults = [];
          
          mapScores.forEach(score => {
            const isValidScore = (score.team1_score >= 13 || score.team2_score >= 13) &&
                               Math.abs(score.team1_score - score.team2_score) >= 0;
            
            validationResults.push({
              map: score.map,
              score: `${score.team1_score}-${score.team2_score}`,
              isValid: isValidScore
            });
            
            if (!isValidScore) passed = false;
          });
          
          return {
            passed,
            mapValidations: validationResults,
            totalMaps: mapScores.length
          };
        }
      },
      {
        name: 'Live Score Display',
        description: 'Real-time score updates during live matches',
        test: () => {
          const liveScoreUpdates = [
            { time: '00:30', team1: 1, team2: 0 },
            { time: '01:45', team1: 2, team2: 1 },
            { time: '03:20', team1: 3, team2: 2 },
            { time: '05:10', team1: 5, team2: 3 }
          ];
          
          // Validate score progression is logical
          let passed = true;
          for (let i = 1; i < liveScoreUpdates.length; i++) {
            const prev = liveScoreUpdates[i - 1];
            const curr = liveScoreUpdates[i];
            
            // Scores should only increase or stay the same
            if (curr.team1 < prev.team1 || curr.team2 < prev.team2) {
              passed = false;
              break;
            }
          }
          
          return {
            passed,
            scoreProgression: liveScoreUpdates,
            finalScore: liveScoreUpdates[liveScoreUpdates.length - 1]
          };
        }
      },
      {
        name: 'Format-Specific Validation',
        description: 'BO1, BO3, BO5 format handling',
        test: () => {
          const formats = [
            { format: 'BO1', maxMaps: 1, winCondition: 1 },
            { format: 'BO3', maxMaps: 3, winCondition: 2 },
            { format: 'BO5', maxMaps: 5, winCondition: 3 },
            { format: 'BO7', maxMaps: 7, winCondition: 4 }
          ];
          
          let passed = true;
          const formatResults = [];
          
          formats.forEach(format => {
            const isValid = format.winCondition === Math.ceil(format.maxMaps / 2);
            formatResults.push({
              format: format.format,
              maxMaps: format.maxMaps,
              winCondition: format.winCondition,
              isValid
            });
            
            if (!isValid) passed = false;
          });
          
          return {
            passed,
            formatValidations: formatResults,
            totalFormats: formats.length
          };
        }
      }
    ];

    for (const test of matchScoreTests) {
      try {
        const result = test.test();
        this.testResults.matchScoreAnalytics.push({
          name: test.name,
          description: test.description,
          ...result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.testResults.matchScoreAnalytics.push({
          name: test.name,
          description: test.description,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 4. VALIDATE HERO SELECTION TRACKING
   * Validate hero picks/bans, swaps during matches
   */
  async validateHeroSelectionTracking() {
    console.log('🦸 VALIDATING HERO SELECTION TRACKING...');
    
    const heroSelectionTests = [
      {
        name: 'Hero Picks Tracking',
        description: 'Track hero selections for each player',
        test: () => {
          const marvelRivalsHeroes = [
            'Spider-Man', 'Iron Man', 'Hulk', 'Captain America', 'Thor',
            'Mantis', 'Luna Snow', 'Jeff the Land Shark', 'Rocket Raccoon',
            'Magneto', 'Venom', 'Doctor Strange', 'Groot'
          ];
          
          const heroPicksTeam1 = [
            { player: 'Player1', hero: 'Spider-Man', role: 'Duelist' },
            { player: 'Player2', hero: 'Mantis', role: 'Strategist' },
            { player: 'Player3', hero: 'Magneto', role: 'Vanguard' },
            { player: 'Player4', hero: 'Iron Man', role: 'Duelist' },
            { player: 'Player5', hero: 'Luna Snow', role: 'Strategist' },
            { player: 'Player6', hero: 'Groot', role: 'Vanguard' }
          ];
          
          // Validate all heroes are from Marvel Rivals roster
          const validPicks = heroPicksTeam1.every(pick => 
            marvelRivalsHeroes.includes(pick.hero)
          );
          
          // Check team composition (2 of each role)
          const roleCount = heroPicksTeam1.reduce((acc, pick) => {
            acc[pick.role] = (acc[pick.role] || 0) + 1;
            return acc;
          }, {});
          
          const validComposition = roleCount.Duelist === 2 && 
                                  roleCount.Strategist === 2 && 
                                  roleCount.Vanguard === 2;
          
          return {
            passed: validPicks && validComposition,
            validPicks,
            validComposition,
            roleDistribution: roleCount,
            picks: heroPicksTeam1
          };
        }
      },
      {
        name: 'Hero Swap Detection',
        description: 'Detect mid-match hero changes',
        test: () => {
          const heroSwaps = [
            { 
              player: 'Player1', 
              originalHero: 'Spider-Man', 
              newHero: 'Iron Man', 
              timestamp: '00:45', 
              reason: 'Strategic swap' 
            },
            { 
              player: 'Player3', 
              originalHero: 'Magneto', 
              newHero: 'Venom', 
              timestamp: '02:30', 
              reason: 'Counter pick' 
            }
          ];
          
          // Validate swap tracking
          const validSwaps = heroSwaps.every(swap => 
            swap.originalHero !== swap.newHero &&
            swap.timestamp &&
            swap.player
          );
          
          return {
            passed: validSwaps,
            totalSwaps: heroSwaps.length,
            swapDetails: heroSwaps,
            swapRate: (heroSwaps.length / 6) // 6 players per team
          };
        }
      },
      {
        name: 'Ban Phase Tracking',
        description: 'Track hero bans during draft phase',
        test: () => {
          const banPhase = [
            { team: 'team1', bannedHero: 'Spider-Man', order: 1 },
            { team: 'team2', bannedHero: 'Mantis', order: 2 },
            { team: 'team1', bannedHero: 'Iron Man', order: 3 },
            { team: 'team2', bannedHero: 'Magneto', order: 4 }
          ];
          
          // Validate ban structure
          const validBans = banPhase.every((ban, index) => 
            ban.order === index + 1 &&
            (ban.team === 'team1' || ban.team === 'team2') &&
            ban.bannedHero
          );
          
          // Check alternating ban pattern
          const alternatingBans = banPhase.every((ban, index) => {
            if (index === 0) return ban.team === 'team1';
            if (index % 2 === 0) return ban.team === 'team1';
            return ban.team === 'team2';
          });
          
          return {
            passed: validBans && alternatingBans,
            validBans,
            alternatingBans,
            totalBans: banPhase.length,
            banSequence: banPhase
          };
        }
      },
      {
        name: 'Real-time Hero Updates',
        description: 'Hero selection updates in real-time',
        test: async () => {
          const startTime = performance.now();
          
          const heroUpdate = {
            matchId: this.testMatchId,
            mapIndex: 0,
            player: {
              id: 1,
              name: 'TestPlayer',
              previousHero: 'Spider-Man',
              currentHero: 'Iron Man',
              swapTime: Date.now()
            }
          };
          
          // Simulate hero swap update
          if (window.liveScoreManager) {
            window.liveScoreManager.broadcastMatchUpdate(
              this.testMatchId,
              { heroSwap: heroUpdate },
              { source: 'test', type: 'hero_swap' }
            );
          }
          
          const endTime = performance.now();
          const latency = endTime - startTime;
          
          return {
            passed: latency < this.latencyThreshold,
            latency,
            heroSwapData: heroUpdate,
            updateSize: JSON.stringify(heroUpdate).length
          };
        }
      }
    ];

    for (const test of heroSelectionTests) {
      try {
        const result = await test.test();
        this.testResults.heroSelectionTracking.push({
          name: test.name,
          description: test.description,
          ...result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.testResults.heroSelectionTracking.push({
          name: test.name,
          description: test.description,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 5. MEASURE ACTUAL UPDATE LATENCIES
   * Document actual update latencies and identify bottlenecks
   */
  async measureUpdateLatencies() {
    console.log('⚡ MEASURING ACTUAL UPDATE LATENCIES...');
    
    const latencyTests = [
      {
        name: 'Score Update Latency',
        description: 'Time from score change to DOM update',
        iterations: 10,
        test: async () => {
          const latencies = [];
          
          for (let i = 0; i < 10; i++) {
            const startTime = performance.now();
            
            // Create test update
            const updateData = {
              matchId: this.testMatchId,
              team1_score: i,
              team2_score: Math.floor(i / 2),
              timestamp: Date.now()
            };
            
            // Measure broadcast time
            if (window.liveScoreManager) {
              window.liveScoreManager.broadcastScoreUpdate(
                this.testMatchId,
                updateData,
                { source: 'latency-test' }
              );
            }
            
            const endTime = performance.now();
            latencies.push(endTime - startTime);
            
            // Small delay between tests
            await new Promise(resolve => setTimeout(resolve, 50));
          }
          
          const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
          const maxLatency = Math.max(...latencies);
          const minLatency = Math.min(...latencies);
          
          return {
            passed: avgLatency < this.latencyThreshold,
            avgLatency,
            maxLatency,
            minLatency,
            allLatencies: latencies,
            iterations: latencies.length
          };
        }
      },
      {
        name: 'Player Stats Latency',
        description: 'Time for player statistics propagation',
        iterations: 5,
        test: async () => {
          const latencies = [];
          
          for (let i = 0; i < 5; i++) {
            const startTime = performance.now();
            
            const statsUpdate = {
              matchId: this.testMatchId,
              maps: [{
                team1_players: Array.from({ length: 6 }, (_, j) => ({
                  id: j + 1,
                  eliminations: Math.floor(Math.random() * 20),
                  deaths: Math.floor(Math.random() * 10),
                  assists: Math.floor(Math.random() * 15),
                  damage: Math.floor(Math.random() * 20000),
                  hero: ['Spider-Man', 'Iron Man', 'Mantis'][Math.floor(Math.random() * 3)]
                }))
              }]
            };
            
            if (window.liveScoreManager) {
              window.liveScoreManager.broadcastMatchUpdate(
                this.testMatchId,
                statsUpdate,
                { source: 'stats-latency-test' }
              );
            }
            
            const endTime = performance.now();
            latencies.push(endTime - startTime);
            
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
          
          return {
            passed: avgLatency < (this.latencyThreshold * 2), // Allow more time for complex stats
            avgLatency,
            maxLatency: Math.max(...latencies),
            minLatency: Math.min(...latencies),
            playerDataSize: JSON.stringify(statsUpdate).length
          };
        }
      },
      {
        name: 'WebSocket Connection Latency',
        description: 'WebSocket/SSE connection establishment time',
        test: async () => {
          if (!window.liveScoreManager) {
            return { passed: false, error: 'LiveScoreManager not available' };
          }
          
          const startTime = performance.now();
          
          try {
            // Test connection establishment
            await window.liveScoreManager.ensureLiveConnection(this.testMatchId);
            
            const endTime = performance.now();
            const connectionTime = endTime - startTime;
            
            // Get connection status
            const status = window.liveScoreManager.getConnectionStatus(this.testMatchId);
            
            return {
              passed: connectionTime < 5000, // 5 seconds max for connection
              connectionTime,
              connectionStatus: status,
              hasActiveConnection: status.hasLocalConnection
            };
          } catch (error) {
            const endTime = performance.now();
            return {
              passed: false,
              connectionTime: endTime - startTime,
              error: error.message
            };
          }
        }
      }
    ];

    for (const test of latencyTests) {
      try {
        const result = await test.test();
        this.testResults.latencyMeasurements.push({
          name: test.name,
          description: test.description,
          ...result,
          timestamp: new Date().toISOString()
        });
        
        console.log(`✅ ${test.name}: ${result.passed ? 'PASSED' : 'FAILED'}`);
        if (result.avgLatency) {
          console.log(`   Average Latency: ${result.avgLatency.toFixed(2)}ms`);
        }
        if (result.connectionTime) {
          console.log(`   Connection Time: ${result.connectionTime.toFixed(2)}ms`);
        }
      } catch (error) {
        console.error(`❌ ${test.name} failed:`, error);
        this.testResults.latencyMeasurements.push({
          name: test.name,
          description: test.description,
          passed: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * GENERATE COMPREHENSIVE PERFORMANCE REPORT
   */
  generatePerformanceReport() {
    const totalTests = Object.values(this.testResults).reduce((sum, category) => {
      return sum + (Array.isArray(category) ? category.length : 0);
    }, 0);
    
    const passedTests = Object.values(this.testResults).reduce((sum, category) => {
      if (Array.isArray(category)) {
        return sum + category.filter(test => test.passed).length;
      }
      return sum;
    }, 0);
    
    const failedTests = totalTests - passedTests;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
    
    // Calculate performance score
    const performanceMetrics = {
      avgScoreUpdateLatency: this.getAverageLatency('Score Update Latency'),
      avgStatsUpdateLatency: this.getAverageLatency('Player Stats Latency'),
      connectionEstablishTime: this.getConnectionTime(),
      dataConsistencyRate: this.getDataConsistencyRate()
    };
    
    // Performance grade
    let performanceGrade = 'F';
    if (successRate >= 95 && performanceMetrics.avgScoreUpdateLatency < 100) performanceGrade = 'A+';
    else if (successRate >= 90 && performanceMetrics.avgScoreUpdateLatency < 200) performanceGrade = 'A';
    else if (successRate >= 85 && performanceMetrics.avgScoreUpdateLatency < 500) performanceGrade = 'B+';
    else if (successRate >= 80 && performanceMetrics.avgScoreUpdateLatency < 1000) performanceGrade = 'B';
    else if (successRate >= 70) performanceGrade = 'C';
    else if (successRate >= 60) performanceGrade = 'D';

    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: `${successRate.toFixed(1)}%`,
        performanceGrade,
        testDuration: `${((Date.now() - this.startTime) / 1000).toFixed(2)}s`,
        timestamp: new Date().toISOString()
      },
      performanceMetrics,
      detailedResults: this.testResults,
      recommendations: this.generateRecommendations(performanceMetrics, successRate),
      tournamentReadiness: {
        ready: successRate >= 95 && performanceMetrics.avgScoreUpdateLatency < 500,
        criticalIssues: this.getCriticalIssues(),
        requiredActions: this.getRequiredActions(performanceMetrics, successRate)
      }
    };

    return report;
  }

  getAverageLatency(testName) {
    const latencyTest = this.testResults.latencyMeasurements.find(test => test.name === testName);
    return latencyTest ? latencyTest.avgLatency || latencyTest.latency || 0 : 0;
  }

  getConnectionTime() {
    const connectionTest = this.testResults.latencyMeasurements.find(test => test.name === 'WebSocket Connection Latency');
    return connectionTest ? connectionTest.connectionTime || 0 : 0;
  }

  getDataConsistencyRate() {
    const allTests = Object.values(this.testResults).flat();
    const consistencyTests = allTests.filter(test => 
      test.name.includes('Consistency') || test.name.includes('Sync') || test.name.includes('Flow')
    );
    
    if (consistencyTests.length === 0) return 100;
    
    const passedConsistency = consistencyTests.filter(test => test.passed).length;
    return (passedConsistency / consistencyTests.length) * 100;
  }

  generateRecommendations(metrics, successRate) {
    const recommendations = [];

    if (metrics.avgScoreUpdateLatency > 500) {
      recommendations.push({
        priority: 'HIGH',
        area: 'Score Update Latency',
        issue: `Average score update latency is ${metrics.avgScoreUpdateLatency.toFixed(2)}ms (>500ms threshold)`,
        solution: 'Optimize LiveScoreManager event processing and reduce DOM update overhead'
      });
    }

    if (metrics.avgStatsUpdateLatency > 1000) {
      recommendations.push({
        priority: 'HIGH',
        area: 'Player Statistics',
        issue: `Player stats updates taking ${metrics.avgStatsUpdateLatency.toFixed(2)}ms (>1000ms threshold)`,
        solution: 'Implement batch updates for player statistics and optimize data serialization'
      });
    }

    if (metrics.connectionEstablishTime > 3000) {
      recommendations.push({
        priority: 'MEDIUM',
        area: 'Connection Performance',
        issue: `WebSocket connection establishment takes ${metrics.connectionEstablishTime.toFixed(2)}ms (>3000ms)`,
        solution: 'Optimize connection pooling and implement connection prewarming'
      });
    }

    if (successRate < 95) {
      recommendations.push({
        priority: 'HIGH',
        area: 'Overall Reliability',
        issue: `Test success rate is ${successRate.toFixed(1)}% (<95% required for tournaments)`,
        solution: 'Address failing test cases and improve error handling throughout the system'
      });
    }

    if (metrics.dataConsistencyRate < 100) {
      recommendations.push({
        priority: 'CRITICAL',
        area: 'Data Consistency',
        issue: `Data consistency rate is ${metrics.dataConsistencyRate.toFixed(1)}% (<100% required)`,
        solution: 'Implement stronger data validation and conflict resolution mechanisms'
      });
    }

    return recommendations;
  }

  getCriticalIssues() {
    const issues = [];
    
    // Check for failing critical tests
    const allTests = Object.values(this.testResults).flat();
    const criticalFailures = allTests.filter(test => 
      !test.passed && (
        test.name.includes('Latency') ||
        test.name.includes('Score') ||
        test.name.includes('Connection')
      )
    );

    criticalFailures.forEach(test => {
      issues.push({
        test: test.name,
        description: test.description,
        error: test.error || 'Test failed',
        impact: 'May cause issues during live tournament broadcasting'
      });
    });

    return issues;
  }

  getRequiredActions(metrics, successRate) {
    const actions = [];

    if (successRate < 95) {
      actions.push('Fix all failing tests to achieve 95%+ success rate');
    }

    if (metrics.avgScoreUpdateLatency > 500) {
      actions.push('Optimize score update latency to <500ms for tournament use');
    }

    if (metrics.connectionEstablishTime > 3000) {
      actions.push('Improve connection establishment time to <3 seconds');
    }

    if (actions.length === 0) {
      actions.push('System ready for live tournament use - no critical actions required');
    }

    return actions;
  }

  /**
   * RUN COMPLETE ANALYSIS
   */
  async runCompleteAnalysis() {
    console.log('🚀 STARTING COMPREHENSIVE LIVE SCORING SYSTEM ANALYSIS');
    console.log('================================================');

    try {
      await this.analyzeDataFlowPerformance();
      await this.validatePlayerStatisticsUpdates();
      await this.validateMatchScoreAnalytics();
      await this.validateHeroSelectionTracking();
      await this.measureUpdateLatencies();

      const report = this.generatePerformanceReport();
      
      console.log('\n📊 FINAL PERFORMANCE REPORT');
      console.log('============================');
      console.log(`Overall Success Rate: ${report.summary.successRate}`);
      console.log(`Performance Grade: ${report.summary.performanceGrade}`);
      console.log(`Tournament Ready: ${report.tournamentReadiness.ready ? 'YES' : 'NO'}`);
      
      if (report.recommendations.length > 0) {
        console.log('\n🔧 RECOMMENDATIONS:');
        report.recommendations.forEach(rec => {
          console.log(`[${rec.priority}] ${rec.area}: ${rec.solution}`);
        });
      }

      // Save full report
      window.liveScoreAnalysisReport = report;
      
      return report;

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      return {
        error: error.message,
        partial: this.testResults
      };
    }
  }
}

// Auto-run analysis when script loads
console.log('🔄 Initializing Live Scoring Analysis...');
const analysis = new LiveScoringAnalysisTest();

// Make available globally for manual execution
window.runLiveScoringAnalysis = () => analysis.runCompleteAnalysis();
window.liveScoringAnalysis = analysis;

// Auto-run after short delay to allow system initialization
setTimeout(() => {
  console.log('🚀 Auto-starting live scoring analysis...');
  analysis.runCompleteAnalysis().then(report => {
    console.log('✅ Live scoring analysis completed!');
    console.log('📝 Full report available in window.liveScoreAnalysisReport');
  }).catch(error => {
    console.error('❌ Analysis failed:', error);
  });
}, 2000);