#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Setup Script for Profile Real-Time Tests
 * Installs dependencies and sets up test environment
 */

console.log('🔧 Setting up Profile Real-Time Test Environment...');

// Check if required packages are installed
const checkPackages = () => {
  const requiredPackages = ['puppeteer', 'ws', 'axios'];
  const packageJsonPath = path.join(__dirname, 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found. Please run from the project root directory.');
    process.exit(1);
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const missing = requiredPackages.filter(pkg => !dependencies[pkg]);
  
  if (missing.length > 0) {
    console.log('⚠️ Missing required packages:', missing.join(', '));
    console.log('Installing missing packages...');
    
    const { execSync } = require('child_process');
    try {
      execSync(`npm install ${missing.join(' ')} --save-dev`, { stdio: 'inherit' });
      console.log('✅ All required packages installed');
    } catch (error) {
      console.error('❌ Failed to install packages:', error.message);
      console.log('Please run manually: npm install puppeteer ws axios --save-dev');
      process.exit(1);
    }
  } else {
    console.log('✅ All required packages are already installed');
  }
};

// Add test scripts to package.json
const addTestScripts = () => {
  const packageJsonPath = path.join(__dirname, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  
  const testScripts = {
    'test:profile-realtime': 'node run-profile-realtime-tests.js',
    'test:profile-manual': 'node manual-profile-test.js',
    'test:profile-websocket': 'node websocket-profile-test.js',
    'test:profile-indicators': 'node profile-live-indicator-test.js',
    'test:profile-full': 'node realtime-profile-update-test.js'
  };
  
  let scriptsAdded = 0;
  Object.entries(testScripts).forEach(([key, value]) => {
    if (!packageJson.scripts[key]) {
      packageJson.scripts[key] = value;
      scriptsAdded++;
    }
  });
  
  if (scriptsAdded > 0) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`✅ Added ${scriptsAdded} test scripts to package.json`);
  } else {
    console.log('✅ All test scripts already exist in package.json');
  }
};

// Create test environment configuration
const createTestConfig = () => {
  const configPath = path.join(__dirname, '.env.test');
  
  if (!fs.existsSync(configPath)) {
    const config = `# Profile Real-Time Test Configuration
FRONTEND_URL=http://localhost:3000
API_URL=http://localhost:8000
WEBSOCKET_URL=ws://localhost:3001
NODE_ENV=test
TEST_USER_EMAIL=testuser@example.com
TEST_USER_PASSWORD=password123
`;
    fs.writeFileSync(configPath, config);
    console.log('✅ Created .env.test configuration file');
  } else {
    console.log('✅ Test configuration file already exists');
  }
};

// Verify test files exist
const verifyTestFiles = () => {
  const testFiles = [
    'realtime-profile-update-test.js',
    'manual-profile-test.js',
    'websocket-profile-test.js',
    'profile-live-indicator-test.js',
    'run-profile-realtime-tests.js'
  ];
  
  const missing = testFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
  
  if (missing.length > 0) {
    console.error('❌ Missing test files:', missing.join(', '));
    process.exit(1);
  } else {
    console.log('✅ All test files are present');
  }
};

// Make test files executable
const makeExecutable = () => {
  const testFiles = [
    'run-profile-realtime-tests.js',
    'manual-profile-test.js'
  ];
  
  testFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      try {
        fs.chmodSync(filePath, '755');
      } catch (error) {
        // Ignore chmod errors on Windows
      }
    }
  });
  
  console.log('✅ Made test files executable');
};

// Main setup function
const setup = () => {
  console.log('Starting setup process...\n');
  
  verifyTestFiles();
  checkPackages();
  addTestScripts();
  createTestConfig();
  makeExecutable();
  
  console.log('\n🎉 Profile Real-Time Test Setup Complete!');
  console.log('\nAvailable test commands:');
  console.log('  npm run test:profile-realtime  # Run all tests');
  console.log('  npm run test:profile-manual    # Interactive manual testing');
  console.log('  npm run test:profile-websocket # WebSocket-specific tests');
  console.log('  npm run test:profile-indicators # Live indicator tests');
  console.log('  npm run test:profile-full      # Full comprehensive test');
  
  console.log('\n📝 Next Steps:');
  console.log('1. Ensure your frontend is running on http://localhost:3000');
  console.log('2. Ensure your API is running on http://localhost:8000');
  console.log('3. Run the tests with: npm run test:profile-realtime');
  console.log('4. Check the generated HTML report for detailed results');
  
  console.log('\n🔍 For manual testing:');
  console.log('  npm run test:profile-manual');
  console.log('  Follow the on-screen instructions to test live updates manually');
};

// Run setup
if (require.main === module) {
  setup();
} else {
  module.exports = { setup };
}