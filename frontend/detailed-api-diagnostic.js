#!/usr/bin/env node

/**
 * 🔍 DETAILED API DIAGNOSTIC TEST
 * Deep dive analysis of specific API issues found in initial test
 */

const axios = require('axios');
const fs = require('fs');

class DetailedAPIDiagnostic {
  constructor() {
    this.baseURL = 'https://staging.mrvl.net/api';
    this.adminToken = '415|ySK4yrjyULCTlprffD0KeT5zxd6J2mMMHOHkX6pv1d5fc012';
  }

  getAdminHeaders() {
    return {
      'Authorization': `Bearer ${this.adminToken}`,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    };
  }

  getPublicHeaders() {
    return {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache'
    };
  }

  /**
   * 🔬 Deep analysis of match API response
   */
  async analyzeMatchAPI() {
    console.log('\n🔬 DETAILED MATCH API ANALYSIS');
    console.log('=' .repeat(50));

    try {
      const response = await axios.get(`${this.baseURL}/matches/2/live-scoreboard`, {
        headers: this.getPublicHeaders(),
        timeout: 10000
      });

      console.log('📊 Response Status:', response.status);
      console.log('📊 Response Headers:', JSON.stringify(response.headers, null, 2));
      console.log('📊 Raw Response Data:', JSON.stringify(response.data, null, 2));
      
      const data = response.data;
      
      if (data) {
        console.log('\n🔍 Data Structure Analysis:');
        console.log('- Type:', typeof data);
        console.log('- Keys:', Object.keys(data));
        console.log('- Has match:', !!data.match);
        console.log('- Has match_info:', !!data.match_info);
        console.log('- Has data:', !!data.data);
        
        if (data.match) {
          console.log('\n📋 Match Object Keys:', Object.keys(data.match));
          console.log('📋 Match Object Sample:', JSON.stringify(data.match, null, 2).substring(0, 500) + '...');
        }
        
        if (data.match_info) {
          console.log('\n📋 Match Info Keys:', Object.keys(data.match_info));
        }
        
        if (data.data) {
          console.log('\n📋 Data Keys:', Object.keys(data.data));
        }
      }

    } catch (error) {
      console.error('❌ Match API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }

  /**
   * 🦸 Deep analysis of heroes API
   */
  async analyzeHeroesAPI() {
    console.log('\n🦸 DETAILED HEROES API ANALYSIS');
    console.log('=' .repeat(50));

    try {
      // Test both endpoints
      const endpoints = [
        '/public/heroes',
        '/game-data/all-heroes'
      ];

      for (const endpoint of endpoints) {
        console.log(`\n🔍 Testing endpoint: ${endpoint}`);
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, {
            headers: this.getPublicHeaders(),
            timeout: 10000,
            validateStatus: () => true
          });

          console.log('📊 Status:', response.status);
          if (response.status === 200 && response.data) {
            console.log('📊 Data type:', typeof response.data);
            console.log('📊 Data keys:', Object.keys(response.data));
            
            const heroes = response.data.data || response.data;
            if (Array.isArray(heroes) && heroes.length > 0) {
              console.log('📊 Heroes count:', heroes.length);
              console.log('📊 First hero structure:', JSON.stringify(heroes[0], null, 2));
            }
          } else {
            console.log('📊 Error response:', response.data);
          }
        } catch (error) {
          console.log('❌ Error:', error.message);
        }
      }

    } catch (error) {
      console.error('❌ Heroes API Error:', error.message);
    }
  }

  /**
   * 💬 Deep analysis of comments API
   */
  async analyzeCommentsAPI() {
    console.log('\n💬 DETAILED COMMENTS API ANALYSIS');
    console.log('=' .repeat(50));

    try {
      const response = await axios.get(`${this.baseURL}/matches/2/comments`, {
        headers: this.getPublicHeaders(),
        timeout: 10000
      });

      console.log('📊 Response Status:', response.status);
      console.log('📊 Raw Response Data:', JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        const comments = response.data.data || response.data;
        console.log('\n📋 Comments Analysis:');
        console.log('- Type:', typeof comments);
        console.log('- Is Array:', Array.isArray(comments));
        
        if (Array.isArray(comments) && comments.length > 0) {
          console.log('- Count:', comments.length);
          console.log('- First comment structure:', JSON.stringify(comments[0], null, 2));
          console.log('- Has required fields (id, content, author):', 
            !!(comments[0].id && comments[0].content && (comments[0].author || comments[0].user)));
        }
      }

    } catch (error) {
      console.error('❌ Comments API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
    }
  }

  /**
   * 🔐 Test admin authentication
   */
  async testAdminAuth() {
    console.log('\n🔐 ADMIN AUTHENTICATION TEST');
    console.log('=' .repeat(50));

    try {
      // Test various admin endpoints
      const adminEndpoints = [
        '/admin/matches',
        '/admin/tournaments',
        '/admin/users'
      ];

      for (const endpoint of adminEndpoints) {
        console.log(`\n🔍 Testing admin endpoint: ${endpoint}`);
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, {
            headers: this.getAdminHeaders(),
            timeout: 10000,
            validateStatus: () => true
          });

          console.log('📊 Status:', response.status);
          
          if (response.status === 401) {
            console.log('❌ Authentication failed');
          } else if (response.status === 403) {
            console.log('❌ Authorization failed (forbidden)');
          } else if (response.status === 500) {
            console.log('❌ Server error');
            console.log('📊 Error details:', response.data);
          } else if (response.status >= 200 && response.status < 300) {
            console.log('✅ Success');
          }
          
        } catch (error) {
          console.log('❌ Error:', error.message);
        }
      }

    } catch (error) {
      console.error('❌ Admin Auth Test Error:', error.message);
    }
  }

  /**
   * 🌐 Test backend connectivity and health
   */
  async testBackendHealth() {
    console.log('\n🌐 BACKEND HEALTH CHECK');
    console.log('=' .repeat(50));

    try {
      // Test basic connectivity
      const response = await axios.get(this.baseURL, {
        headers: this.getPublicHeaders(),
        timeout: 5000,
        validateStatus: () => true
      });

      console.log('📊 Backend Status:', response.status);
      console.log('📊 Response Headers:', response.headers);
      
      if (response.data) {
        console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
      }

    } catch (error) {
      console.error('❌ Backend Health Check Error:', {
        message: error.message,
        code: error.code,
        status: error.response?.status
      });
    }
  }

  async runDiagnostics() {
    console.log('🔍 MRVL PLATFORM DETAILED API DIAGNOSTICS');
    console.log('📅 Test run:', new Date().toISOString());
    console.log('🔗 Base URL:', this.baseURL);

    await this.testBackendHealth();
    await this.analyzeMatchAPI();
    await this.analyzeHeroesAPI();
    await this.analyzeCommentsAPI();
    await this.testAdminAuth();

    console.log('\n✅ Diagnostic analysis complete!');
  }
}

// Run diagnostics
async function main() {
  const diagnostic = new DetailedAPIDiagnostic();
  await diagnostic.runDiagnostics();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DetailedAPIDiagnostic;