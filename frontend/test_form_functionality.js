const fs = require('fs');
const path = require('path');

// Test script to validate form field mappings and potential issues

console.log('🔍 Testing Form Field Mappings and Functionality...\n');

// Read TeamForm.js content
const teamFormPath = './src/components/admin/TeamForm.js';
const playerFormPath = './src/components/admin/PlayerForm.js';

let issuesFound = [];

function analyzeFormFile(filePath, formType) {
    console.log(`📋 Analyzing ${formType} Form...`);
    
    if (!fs.existsSync(filePath)) {
        issuesFound.push(`❌ ${formType} form file not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for common issues
    const checks = [
        {
            name: 'API endpoint configuration',
            pattern: /apiUrl\s*=|API_BASE_URL|process\.env/g,
            required: true
        },
        {
            name: 'Error handling',
            pattern: /catch\s*\(/g,
            required: true
        },
        {
            name: 'Form validation',
            pattern: /validate|required|maxLength/g,
            required: true
        },
        {
            name: 'Image upload handling',
            pattern: /FormData|upload|image/g,
            required: true
        },
        {
            name: 'Social links handling',
            pattern: /social|twitter|instagram|youtube/g,
            required: true
        }
    ];

    checks.forEach(check => {
        const matches = content.match(check.pattern);
        if (check.required && (!matches || matches.length === 0)) {
            issuesFound.push(`⚠️  ${formType}: Missing ${check.name}`);
        } else if (matches && matches.length > 0) {
            console.log(`  ✅ ${check.name}: Found ${matches.length} occurrence(s)`);
        }
    });

    // Check for specific field mappings
    if (formType === 'Team') {
        const teamFields = [
            'name', 'short_name', 'region', 'country', 'rating', 'earnings',
            'socialLinks', 'logo', 'flag', 'coach'
        ];
        
        teamFields.forEach(field => {
            if (!content.includes(field)) {
                issuesFound.push(`⚠️  Team Form: Missing field handling for '${field}'`);
            }
        });
    }

    if (formType === 'Player') {
        const playerFields = [
            'username', 'real_name', 'team', 'role', 'region', 'country',
            'age', 'rating', 'biography', 'mainHero', 'altHeroes',
            'socialLinks', 'streaming', 'pastTeams'
        ];
        
        playerFields.forEach(field => {
            if (!content.includes(field)) {
                issuesFound.push(`⚠️  Player Form: Missing field handling for '${field}'`);
            }
        });
    }
}

// Analyze forms
analyzeFormFile(teamFormPath, 'Team');
analyzeFormFile(playerFormPath, 'Player');

// Check for common API service issues
const apiServicePath = './src/services/api.js';
if (fs.existsSync(apiServicePath)) {
    console.log('\n📡 Analyzing API Service...');
    const apiContent = fs.readFileSync(apiServicePath, 'utf8');
    
    if (!apiContent.includes('teams') || !apiContent.includes('players')) {
        issuesFound.push('❌ API service missing team/player endpoints');
    }
    
    if (!apiContent.includes('upload')) {
        issuesFound.push('❌ API service missing upload functionality');
    }
    
    console.log('  ✅ API service file exists and has basic endpoints');
} else {
    issuesFound.push('❌ API service file not found');
}

// Summary
console.log('\n📊 ANALYSIS SUMMARY');
console.log('==================');

if (issuesFound.length === 0) {
    console.log('🎉 No critical issues found! Forms appear to be properly structured.');
    console.log('\n✅ All required components detected:');
    console.log('   • Team form with all field handling');
    console.log('   • Player form with all field handling');
    console.log('   • API service integration');
    console.log('   • Error handling patterns');
    console.log('   • Image upload functionality');
    console.log('   • Social media link handling');
} else {
    console.log(`❌ Found ${issuesFound.length} potential issue(s):`);
    issuesFound.forEach(issue => console.log(`   ${issue}`));
}

console.log('\n🔧 RECOMMENDED TESTS:');
console.log('=====================');
console.log('1. Test form submission with all fields filled');
console.log('2. Test image upload with different file formats');
console.log('3. Test validation error handling');
console.log('4. Test social media URL validation');
console.log('5. Test team-player relationship updates');
console.log('6. Test pagination and data loading');

console.log('\n💡 To run full functional tests:');
console.log('   npm test -- --testNamePattern="TeamForm|PlayerForm"');
console.log('   npm run build (to test for build errors)');
console.log('   npm start (to test in browser)');