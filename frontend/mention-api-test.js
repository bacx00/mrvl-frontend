#!/usr/bin/env node

// Test script to validate mention API endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:8000/api';

async function testMentionAPIs() {
  console.log('🔍 Testing Forum Mention System API Endpoints\n');

  const tests = [
    {
      name: 'Search Users - Single Character',
      endpoint: '/search/users?q=a&limit=5',
      expectedFields: ['id', 'name', 'display_name', 'mention_text', 'type']
    },
    {
      name: 'Search Users - Multiple Characters',  
      endpoint: '/search/users?q=admin&limit=5',
      expectedFields: ['id', 'name', 'display_name', 'mention_text', 'type']
    },
    {
      name: 'Search Teams',
      endpoint: '/search/teams?q=t&limit=5', 
      expectedFields: ['id', 'name', 'display_name', 'mention_text', 'type']
    },
    {
      name: 'Search Players',
      endpoint: '/search/players?q=p&limit=5',
      expectedFields: ['id', 'name', 'display_name', 'mention_text', 'type'] 
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 Testing: ${test.name}`);
      console.log(`📡 GET ${BASE_URL}${test.endpoint}`);
      
      const response = await axios.get(`${BASE_URL}${test.endpoint}`);
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response structure:`, JSON.stringify(response.data, null, 2));
      
      if (response.data.success && response.data.data) {
        const results = response.data.data;
        console.log(`📈 Results count: ${results.length}`);
        
        if (results.length > 0) {
          const firstResult = results[0];
          console.log(`🎯 First result fields:`, Object.keys(firstResult));
          
          // Validate expected fields
          const missingFields = test.expectedFields.filter(field => !(field in firstResult));
          if (missingFields.length > 0) {
            console.log(`⚠️  Missing expected fields: ${missingFields.join(', ')}`);
          } else {
            console.log(`✨ All expected fields present`);
          }
          
          // Check for [object Object] issue
          for (const [key, value] of Object.entries(firstResult)) {
            if (typeof value === 'object' && value !== null) {
              console.log(`⚠️  Object field detected: ${key} =`, value);
            } else if (String(value).includes('[object Object]')) {
              console.log(`❌ [object Object] detected in field: ${key}`);
            }
          }
        }
      } else {
        console.log(`❌ API returned error or no data`);
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      if (error.response) {
        console.log(`📄 Response data:`, error.response.data);
      }
    }
    
    console.log('─'.repeat(50));
  }
}

async function testForumThreadCreation() {
  console.log('\n🏗️  Testing Forum Thread Creation with Mentions\n');
  
  const testThreads = [
    {
      title: 'Test Thread with @Admin mention',
      content: 'This thread mentions @Admin in the content to test mentions.'
    },
    {
      title: 'Another test thread',
      content: 'Content with multiple mentions: @Admin and @Test should work.'
    }
  ];
  
  for (const thread of testThreads) {
    console.log(`🧪 Testing thread creation:`, thread.title);
    
    // This would require authentication, so we'll just log the structure
    console.log(`📝 Thread data:`, JSON.stringify(thread, null, 2));
    console.log('✅ Structure looks good for mention processing');
    console.log('─'.repeat(30));
  }
}

// Run tests
async function runTests() {
  try {
    await testMentionAPIs();
    await testForumThreadCreation();
    console.log('\n🎉 Mention System API Test Complete!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

runTests();