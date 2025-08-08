#!/usr/bin/env node

/**
 * Complete End-to-End Forgot Password Flow Test
 * Tests both frontend and backend integration
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_URL = 'http://localhost:8000/api';
const TEST_EMAIL = 'jhonny@ar-mediia.com';

console.log('🔐 Marvel Rivals Forgot Password Flow Test');
console.log('===========================================\n');

async function testBackendForgotPassword() {
  console.log('1. Testing Backend Forgot Password API...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Backend forgot password API working');
      console.log(`   Response: ${data.message}`);
      return true;
    } else {
      console.log('❌ Backend forgot password API failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend forgot password API error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testFrontendRoutes() {
  console.log('\n2. Testing Frontend Routes...');
  
  // Test home page
  try {
    const homeResponse = await fetch(FRONTEND_URL);
    if (homeResponse.ok) {
      console.log('✅ Frontend home page accessible');
    } else {
      console.log('❌ Frontend home page not accessible');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend not accessible');
    console.log(`   Error: ${error.message}`);
    return false;
  }

  return true;
}

async function extractTokenFromLogs() {
  console.log('\n3. Extracting Password Reset Token from Backend Logs...');
  
  try {
    const logPath = '/var/www/mrvl-backend/storage/logs/laravel.log';
    
    if (!fs.existsSync(logPath)) {
      console.log('❌ Laravel log file not found');
      return null;
    }

    const logContent = fs.readFileSync(logPath, 'utf8');
    const lines = logContent.split('\n');
    
    // Find the most recent reset password URL
    let latestToken = null;
    let latestEmail = null;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      
      if (line.includes('Reset Password:') && line.includes('token=')) {
        const tokenMatch = line.match(/token=([a-f0-9]+)/);
        const emailMatch = line.match(/email=([^&]+)/);
        
        if (tokenMatch && emailMatch) {
          latestToken = tokenMatch[1];
          latestEmail = decodeURIComponent(emailMatch[1]);
          break;
        }
      }
    }
    
    if (latestToken && latestEmail === TEST_EMAIL) {
      console.log('✅ Found password reset token in logs');
      console.log(`   Token: ${latestToken.substring(0, 20)}...`);
      console.log(`   Email: ${latestEmail}`);
      return { token: latestToken, email: latestEmail };
    } else {
      console.log('❌ No valid password reset token found in logs');
      return null;
    }
  } catch (error) {
    console.log('❌ Error reading log file');
    console.log(`   Error: ${error.message}`);
    return null;
  }
}

async function testBackendPasswordReset(token, email) {
  console.log('\n4. Testing Backend Password Reset API...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        token: token,
        email: email,
        password: 'newpassword123',
        password_confirmation: 'newpassword123'
      })
    });

    const data = await response.json();
    
    if (response.ok && data.success) {
      console.log('✅ Backend password reset API working');
      console.log(`   Response: ${data.message}`);
      return true;
    } else {
      console.log('❌ Backend password reset API failed');
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${JSON.stringify(data)}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend password reset API error');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testFrontendComponents() {
  console.log('\n5. Testing Frontend Components...');
  
  // Check if React components exist
  const components = [
    '/var/www/mrvl-frontend/frontend/src/components/pages/ForgotPassword.js',
    '/var/www/mrvl-frontend/frontend/src/components/pages/PasswordReset.js',
    '/var/www/mrvl-frontend/frontend/src/components/AuthModal.js'
  ];
  
  let allComponentsExist = true;
  
  for (const component of components) {
    if (fs.existsSync(component)) {
      const filename = path.basename(component);
      console.log(`✅ ${filename} exists`);
    } else {
      const filename = path.basename(component);
      console.log(`❌ ${filename} missing`);
      allComponentsExist = false;
    }
  }
  
  return allComponentsExist;
}

async function testEmailConfiguration() {
  console.log('\n6. Testing Email Configuration...');
  
  try {
    // Check backend .env file for mail settings
    const envPath = '/var/www/mrvl-backend/.env';
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ Backend .env file not found');
      return false;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let mailDriver = null;
    let mailFromAddress = null;
    
    for (const line of lines) {
      if (line.startsWith('MAIL_MAILER=')) {
        mailDriver = line.split('=')[1];
      }
      if (line.startsWith('MAIL_FROM_ADDRESS=')) {
        mailFromAddress = line.split('=')[1].replace(/"/g, '');
      }
    }
    
    if (mailDriver === 'log') {
      console.log('✅ Mail driver set to log (good for testing)');
      console.log(`   From address: ${mailFromAddress}`);
      return true;
    } else {
      console.log('⚠️  Mail driver not set to log');
      console.log(`   Current driver: ${mailDriver}`);
      console.log(`   From address: ${mailFromAddress}`);
      return true; // Still valid, just different configuration
    }
  } catch (error) {
    console.log('❌ Error checking email configuration');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

// Main test execution
async function runTests() {
  const results = {
    backendForgotPassword: false,
    frontendRoutes: false,
    tokenExtraction: null,
    backendPasswordReset: false,
    frontendComponents: false,
    emailConfiguration: false
  };
  
  // Test 1: Backend Forgot Password
  results.backendForgotPassword = await testBackendForgotPassword();
  
  // Test 2: Frontend Routes
  results.frontendRoutes = await testFrontendRoutes();
  
  // Test 3: Extract Token from Logs
  results.tokenExtraction = await extractTokenFromLogs();
  
  // Test 4: Backend Password Reset (only if we have a token)
  if (results.tokenExtraction) {
    results.backendPasswordReset = await testBackendPasswordReset(
      results.tokenExtraction.token,
      results.tokenExtraction.email
    );
  } else {
    console.log('\n4. Skipping Backend Password Reset (no valid token)');
  }
  
  // Test 5: Frontend Components
  results.frontendComponents = await testFrontendComponents();
  
  // Test 6: Email Configuration
  results.emailConfiguration = await testEmailConfiguration();
  
  // Final Report
  console.log('\n🎯 Test Results Summary');
  console.log('=======================');
  console.log(`Backend Forgot Password API: ${results.backendForgotPassword ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Routes:             ${results.frontendRoutes ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Token Extraction:            ${results.tokenExtraction ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Backend Password Reset API:  ${results.backendPasswordReset ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Components:         ${results.frontendComponents ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Email Configuration:         ${results.emailConfiguration ? '✅ PASS' : '❌ FAIL'}`);
  
  const overallPass = results.backendForgotPassword && 
                     results.frontendRoutes && 
                     results.tokenExtraction && 
                     results.backendPasswordReset && 
                     results.frontendComponents && 
                     results.emailConfiguration;
                     
  console.log(`\n🏆 Overall Status: ${overallPass ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (overallPass) {
    console.log('\n🎉 Forgot Password feature is fully implemented and working!');
    console.log('\nNext steps:');
    console.log('1. Visit http://localhost:3000 in your browser');
    console.log('2. Click on login/signup to open the auth modal');
    console.log('3. Click "Forgot your password?" to test the flow');
    console.log('4. Or navigate directly to /#forgot-password');
    console.log('5. Check backend logs for sent emails: storage/logs/laravel.log');
  } else {
    console.log('\n🔧 Please fix the failing tests before using the feature.');
  }
}

// Run the tests
runTests().catch(console.error);