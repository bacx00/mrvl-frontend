#!/usr/bin/env node

/**
 * COMPREHENSIVE ADMIN FORMS TEST SCRIPT
 * Tests PlayerForm and TeamForm functionality
 * 
 * Usage: node test-admin-forms.js
 */

const fs = require('fs');
const path = require('path');

console.log('='.repeat(60));
console.log('🧪 ADMIN FORMS COMPREHENSIVE TEST REPORT');
console.log('='.repeat(60));

// Test file paths
const playerFormPath = './frontend/src/components/admin/PlayerForm.js';
const teamFormPath = './frontend/src/components/admin/TeamForm.js';
const apiRoutesPath = '../mrvl-backend/routes/api_simple.php';

// Read file contents
const playerFormContent = fs.readFileSync(playerFormPath, 'utf8');
const teamFormContent = fs.readFileSync(teamFormPath, 'utf8');
const apiRoutesContent = fs.readFileSync(apiRoutesPath, 'utf8');

console.log('\n📋 PLAYER FORM FIELD VERIFICATION');
console.log('-'.repeat(40));

// Player form required fields check
const playerRequiredFields = [
    'elo_rating', 'peak_elo', 'skill_rating',
    'main_hero', 'hero_pool',
    'wins', 'losses', 'total_matches', 'kda',
    'status', 'biography', 'total_earnings',
    'jerseyNumber', 'nationality', 'birth_date'
];

const playerFieldsPresent = {};
playerRequiredFields.forEach(field => {
    const formStatePattern = new RegExp(`${field}:\\s*['"][^'"]*['"]`, 'g');
    const inputPattern = new RegExp(`name="${field}"`, 'g');
    const submitPattern = new RegExp(`${field}:\\s*formData\\.${field}`, 'g');
    
    playerFieldsPresent[field] = {
        inFormState: formStatePattern.test(playerFormContent),
        hasInput: inputPattern.test(playerFormContent),
        inSubmitData: submitPattern.test(playerFormContent)
    };
});

// Display player form results
let playerIssues = 0;
Object.entries(playerFieldsPresent).forEach(([field, checks]) => {
    const status = checks.inFormState && checks.hasInput && checks.inSubmitData;
    const icon = status ? '✅' : '❌';
    
    if (!status) {
        playerIssues++;
        console.log(`${icon} ${field.padEnd(20)} - Missing: ${!checks.inFormState ? 'State ' : ''}${!checks.hasInput ? 'Input ' : ''}${!checks.inSubmitData ? 'Submit ' : ''}`);
    } else {
        console.log(`${icon} ${field.padEnd(20)} - Complete`);
    }
});

console.log(`\n📊 Player Form Summary: ${playerRequiredFields.length - playerIssues}/${playerRequiredFields.length} fields correct`);

console.log('\n📋 TEAM FORM FIELD VERIFICATION');
console.log('-'.repeat(40));

// Team form required fields check
const teamRequiredFields = [
    'elo_rating', 'peak_elo',
    'wins', 'losses', 'matches_played', 'win_rate',
    'current_streak_count', 'current_streak_type',
    'founded_date', 'description', 'achievements',
    'manager', 'owner', 'captain', 'status'
];

const teamFieldsPresent = {};
teamRequiredFields.forEach(field => {
    const formStatePattern = new RegExp(`${field}:\\s*['"][^'"]*['"]`, 'g');
    const inputPattern = new RegExp(`name="${field}"`, 'g');
    const submitPattern = new RegExp(`${field}:\\s*formData\\.${field}`, 'g');
    
    teamFieldsPresent[field] = {
        inFormState: formStatePattern.test(teamFormContent),
        hasInput: inputPattern.test(teamFormContent),
        inSubmitData: submitPattern.test(teamFormContent)
    };
});

// Display team form results
let teamIssues = 0;
Object.entries(teamFieldsPresent).forEach(([field, checks]) => {
    const status = checks.inFormState && checks.hasInput && checks.inSubmitData;
    const icon = status ? '✅' : '❌';
    
    if (!status) {
        teamIssues++;
        console.log(`${icon} ${field.padEnd(20)} - Missing: ${!checks.inFormState ? 'State ' : ''}${!checks.hasInput ? 'Input ' : ''}${!checks.inSubmitData ? 'Submit ' : ''}`);
    } else {
        console.log(`${icon} ${field.padEnd(20)} - Complete`);
    }
});

console.log(`\n📊 Team Form Summary: ${teamRequiredFields.length - teamIssues}/${teamRequiredFields.length} fields correct`);

console.log('\n🌐 API ENDPOINT VERIFICATION');
console.log('-'.repeat(40));

// Check API endpoints
const expectedEndpoints = [
    '/players',
    '/teams',
    'Route::get.*players',
    'Route::post.*players',
    'Route::put.*players',
    'Route::get.*teams',
    'Route::post.*teams',
    'Route::put.*teams'
];

const endpointResults = {};
expectedEndpoints.forEach(endpoint => {
    const pattern = new RegExp(endpoint, 'g');
    endpointResults[endpoint] = pattern.test(apiRoutesContent);
});

let endpointIssues = 0;
Object.entries(endpointResults).forEach(([endpoint, exists]) => {
    const icon = exists ? '✅' : '❌';
    if (!exists) endpointIssues++;
    console.log(`${icon} ${endpoint}`);
});

console.log(`\n📊 API Endpoints: ${expectedEndpoints.length - endpointIssues}/${expectedEndpoints.length} routes found`);

console.log('\n💰 EARNINGS FIELD SPECIFIC CHECK');
console.log('-'.repeat(40));

// Check specific earnings fields
const earningsChecks = {
    playerEarningsField: /name="earnings".*value=\{formData\.earnings\}/.test(playerFormContent),
    playerTotalEarningsField: /name="total_earnings".*value=\{formData\.total_earnings\}/.test(playerFormContent),
    teamEarningsField: /name="earnings".*value=\{formData\.earnings\}/.test(teamFormContent),
    earningsInPlayerSubmit: /earnings:\s*formData\.earnings/.test(playerFormContent),
    totalEarningsInPlayerSubmit: /total_earnings:\s*formData\.total_earnings/.test(playerFormContent),
    earningsInTeamSubmit: /earnings:\s*parseFloat\(formData\.earnings\)/.test(teamFormContent)
};

Object.entries(earningsChecks).forEach(([check, passed]) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${check}`);
});

console.log('\n🔍 POTENTIAL ISSUES DETECTED');
console.log('-'.repeat(40));

const issues = [];

// Check for duplicate ELO rating fields in team form
if (teamFormContent.match(/ELO Rating/g)?.length > 1) {
    issues.push('⚠️  Team form may have duplicate ELO rating fields');
}

// Check for missing field mappings
if (!playerFormContent.includes('jersey_number: formData.jerseyNumber')) {
    issues.push('⚠️  Player form: jerseyNumber not mapped to jersey_number in submit data');
}

// Check for correct API endpoints in forms
if (!playerFormContent.includes('api.get(`/players/${playerId}`)')) {
    issues.push('❌ Player form: GET endpoint should be /players/${id}');
}

if (!teamFormContent.includes('api.get(`/teams/${teamId}`)')) {
    issues.push('❌ Team form: GET endpoint should be /teams/${id}');
}

if (issues.length === 0) {
    console.log('✅ No critical issues detected!');
} else {
    issues.forEach(issue => console.log(issue));
}

console.log('\n📈 OVERALL TEST RESULTS');
console.log('-'.repeat(40));

const totalScore = (
    (playerRequiredFields.length - playerIssues) +
    (teamRequiredFields.length - teamIssues) +
    (expectedEndpoints.length - endpointIssues)
);

const totalPossible = playerRequiredFields.length + teamRequiredFields.length + expectedEndpoints.length;
const percentage = Math.round((totalScore / totalPossible) * 100);

console.log(`Overall Score: ${totalScore}/${totalPossible} (${percentage}%)`);

if (percentage >= 90) {
    console.log('🎉 EXCELLENT: Forms are ready for production!');
} else if (percentage >= 75) {
    console.log('✅ GOOD: Minor issues to address');
} else if (percentage >= 50) {
    console.log('⚠️  FAIR: Several issues need attention');
} else {
    console.log('❌ POOR: Major issues require immediate fixes');
}

console.log('\n' + '='.repeat(60));
console.log('✅ Test completed successfully!');
console.log('📝 Save this report for development team review');
console.log('='.repeat(60));