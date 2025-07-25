#!/usr/bin/env node

// Test script to create Marvel Rivals Championship event
// Run with: node create_event_test.js

const https = require('https');

const credentials = {
  email: 'jhonny@ar-mediia.com',
  password: 'password123'
};

const eventData = {
  name: 'Marvel Rivals World Championship 2025',
  description: 'The ultimate Marvel Rivals tournament featuring the best teams from around the world competing for glory and prizes. Experience the most intense superhero battles with cutting-edge gameplay and world-class competition.',
  type: 'championship',
  tier: 'S',
  format: 'double_elimination',
  region: 'International',
  game_mode: 'Convoy',
  start_date: '2025-02-15',
  end_date: '2025-02-28',
  registration_start: '2025-01-15',
  registration_end: '2025-02-10',
  max_teams: 32,
  prize_pool: 250000,
  currency: 'USD',
  timezone: 'UTC',
  featured: true,
  public: true,
  status: 'upcoming',
  rules: 'Standard Marvel Rivals competitive rules apply. All matches are best-of-3 format. Teams must have 6 registered players with approved substitutes.'
};

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({ status: res.statusCode, data: response, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

async function createEvent() {
  console.log('🚀 Testing Marvel Rivals Championship Event Creation...\n');
  
  try {
    // Step 1: Login to get token
    console.log('Step 1: Authenticating...');
    const loginOptions = {
      hostname: 'staging.mrvl.net',
      port: 443,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const loginResponse = await makeRequest(loginOptions, credentials);
    console.log(`Login Status: ${loginResponse.status}`);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Login failed:', loginResponse.data);
      return;
    }

    const token = loginResponse.data.access_token || loginResponse.data.token;
    if (!token) {
      console.error('❌ No token received from login');
      return;
    }
    
    console.log('✅ Authentication successful\n');

    // Step 2: Create event
    console.log('Step 2: Creating Marvel Rivals Championship...');
    const eventOptions = {
      hostname: 'staging.mrvl.net',
      port: 443,
      path: '/api/admin/events',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const eventResponse = await makeRequest(eventOptions, eventData);
    console.log(`Event Creation Status: ${eventResponse.status}`);
    
    if (eventResponse.status === 201 || eventResponse.status === 200) {
      console.log('✅ Marvel Rivals Championship created successfully!');
      console.log('Event Details:', JSON.stringify(eventResponse.data, null, 2));
      
      const eventId = eventResponse.data.data?.id || eventResponse.data.id;
      if (eventId) {
        console.log(`\n🎯 Event ID: ${eventId}`);
        console.log('This event can now be used for creating matches!\n');
      }
    } else {
      console.error('❌ Event creation failed:', eventResponse.data);
      
      // Try alternative endpoints if main one fails
      console.log('\nTrying alternative endpoint...');
      const altEventOptions = {
        ...eventOptions,
        path: '/api/events'
      };
      
      const altEventResponse = await makeRequest(altEventOptions, eventData);
      console.log(`Alternative endpoint status: ${altEventResponse.status}`);
      
      if (altEventResponse.status === 201 || altEventResponse.status === 200) {
        console.log('✅ Event created via alternative endpoint!');
        console.log('Event Details:', JSON.stringify(altEventResponse.data, null, 2));
      } else {
        console.error('❌ Alternative endpoint also failed:', altEventResponse.data);
      }
    }

  } catch (error) {
    console.error('❌ Error during event creation:', error.message);
  }
}

// Run the test
createEvent();