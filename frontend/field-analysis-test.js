/**
 * MRVL Field Analysis Test
 * Analyzes the actual fields available in player and team data
 */

const https = require('https');

class MRVLFieldAnalyzer {
  constructor() {
    this.baseUrl = 'https://staging.mrvl.net';
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', chunk => responseData += chunk);
        res.on('end', () => {
          try {
            resolve({
              status: res.statusCode,
              data: responseData ? JSON.parse(responseData) : null
            });
          } catch (error) {
            resolve({
              status: res.statusCode,
              data: responseData
            });
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  analyzePlayerFields() {
    return [
      'id', 'name', 'ign', 'real_name', 'username', 'country', 'role', 'rating',
      'elo_rating', 'peak_elo', 'skill_rating', 'earnings', 'total_earnings',
      'wins', 'losses', 'total_matches', 'kda', 'main_hero', 'hero_pool',
      'status', 'nationality', 'jersey_number', 'birth_date', 'age', 'region',
      'team_id', 'biography', 'description', 'created_at', 'updated_at'
    ];
  }

  analyzeTeamFields() {
    return [
      'id', 'name', 'short_name', 'region', 'country', 'rating', 'elo_rating',
      'peak_elo', 'earnings', 'wins', 'losses', 'matches_played', 'win_rate',
      'current_streak_count', 'current_streak_type', 'founded_date',
      'description', 'achievements', 'manager', 'owner', 'captain', 'status',
      'coach_name', 'coach_nationality', 'website', 'social_media',
      'created_at', 'updated_at'
    ];
  }

  async analyzeData() {
    console.log('🔍 Analyzing MRVL Player and Team Data Fields...\n');

    try {
      // Analyze Players
      console.log('🏃 Analyzing Players Data...');
      const playersResponse = await this.makeRequest('/api/players');
      
      if (playersResponse.status === 200 && playersResponse.data?.data) {
        const players = playersResponse.data.data;
        console.log(`📊 Found ${players.length} players`);
        
        if (players.length > 0) {
          const firstPlayer = players[0];
          const actualFields = Object.keys(firstPlayer);
          const expectedFields = this.analyzePlayerFields();
          
          console.log(`\n📋 Player Fields Analysis:`);
          console.log(`   Expected: ${expectedFields.length} fields`);
          console.log(`   Found: ${actualFields.length} fields`);
          
          const foundExpected = expectedFields.filter(field => actualFields.includes(field));
          const missingExpected = expectedFields.filter(field => !actualFields.includes(field));
          const unexpectedFields = actualFields.filter(field => !expectedFields.includes(field));
          
          console.log(`   ✅ Found expected: ${foundExpected.length}/${expectedFields.length} (${(foundExpected.length/expectedFields.length*100).toFixed(1)}%)`);
          
          if (missingExpected.length > 0) {
            console.log(`   ❌ Missing expected: ${missingExpected.join(', ')}`);
          }
          
          if (unexpectedFields.length > 0) {
            console.log(`   🆕 Unexpected fields: ${unexpectedFields.join(', ')}`);
          }
          
          console.log(`\n   📝 All actual fields: ${actualFields.join(', ')}`);
          
          // Check for earnings and statistics fields specifically
          const earningsFields = actualFields.filter(field => field.includes('earning'));
          const statsFields = actualFields.filter(field => ['wins', 'losses', 'kda', 'rating', 'elo'].some(stat => field.includes(stat)));
          
          console.log(`   💰 Earnings fields: ${earningsFields.join(', ') || 'None found'}`);
          console.log(`   📈 Statistics fields: ${statsFields.join(', ') || 'None found'}`);
        }
      } else {
        console.log(`❌ Failed to fetch players data: ${playersResponse.status}`);
      }

      console.log('\n' + '='.repeat(60) + '\n');

      // Analyze Teams
      console.log('🏆 Analyzing Teams Data...');
      const teamsResponse = await this.makeRequest('/api/teams');
      
      if (teamsResponse.status === 200 && teamsResponse.data?.data) {
        const teams = teamsResponse.data.data;
        console.log(`📊 Found ${teams.length} teams`);
        
        if (teams.length > 0) {
          const firstTeam = teams[0];
          const actualFields = Object.keys(firstTeam);
          const expectedFields = this.analyzeTeamFields();
          
          console.log(`\n📋 Team Fields Analysis:`);
          console.log(`   Expected: ${expectedFields.length} fields`);
          console.log(`   Found: ${actualFields.length} fields`);
          
          const foundExpected = expectedFields.filter(field => actualFields.includes(field));
          const missingExpected = expectedFields.filter(field => !actualFields.includes(field));
          const unexpectedFields = actualFields.filter(field => !expectedFields.includes(field));
          
          console.log(`   ✅ Found expected: ${foundExpected.length}/${expectedFields.length} (${(foundExpected.length/expectedFields.length*100).toFixed(1)}%)`);
          
          if (missingExpected.length > 0) {
            console.log(`   ❌ Missing expected: ${missingExpected.join(', ')}`);
          }
          
          if (unexpectedFields.length > 0) {
            console.log(`   🆕 Unexpected fields: ${unexpectedFields.join(', ')}`);
          }
          
          console.log(`\n   📝 All actual fields: ${actualFields.join(', ')}`);
          
          // Check for specific important fields
          const earningsFields = actualFields.filter(field => field.includes('earning'));
          const statsFields = actualFields.filter(field => ['wins', 'losses', 'rating', 'elo', 'matches'].some(stat => field.includes(stat)));
          const socialFields = actualFields.filter(field => field.includes('social'));
          const coachFields = actualFields.filter(field => field.includes('coach'));
          
          console.log(`   💰 Earnings fields: ${earningsFields.join(', ') || 'None found'}`);
          console.log(`   📈 Statistics fields: ${statsFields.join(', ') || 'None found'}`);
          console.log(`   📱 Social media fields: ${socialFields.join(', ') || 'None found'}`);
          console.log(`   👨‍🏫 Coach fields: ${coachFields.join(', ') || 'None found'}`);
          
          // Analyze social media structure if present
          if (firstTeam.social_media) {
            try {
              const socialMedia = typeof firstTeam.social_media === 'string' 
                ? JSON.parse(firstTeam.social_media) 
                : firstTeam.social_media;
              console.log(`   📱 Social media platforms: ${Object.keys(socialMedia).join(', ')}`);
            } catch (e) {
              console.log(`   📱 Social media data format: ${typeof firstTeam.social_media}`);
            }
          }
        }
      } else {
        console.log(`❌ Failed to fetch teams data: ${teamsResponse.status}`);
      }

      console.log('\n' + '='.repeat(60));
      console.log('🎯 Field Analysis Complete!');

    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
    }
  }
}

// Run the analysis
(async () => {
  const analyzer = new MRVLFieldAnalyzer();
  await analyzer.analyzeData();
})().catch(console.error);