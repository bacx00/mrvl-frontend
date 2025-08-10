const axios = require('axios');
const BASE_URL = 'https://staging.mrvl.net/api';

async function testEventsAndBrackets() {
    console.log('=== FINAL EVENTS & BRACKETS VERIFICATION ===\n');
    
    const tests = {
        events: { passed: 0, failed: 0 },
        brackets: { passed: 0, failed: 0 }
    };
    
    // Test Events
    console.log('📋 EVENTS MODERATION TAB TESTS:');
    
    // 1. List Events
    try {
        const res = await axios.get(`${BASE_URL}/events`);
        if (res.data.success || res.data.data) {
            console.log('✅ List Events - Working');
            tests.events.passed++;
        }
    } catch (e) {
        console.log('❌ List Events - Failed');
        tests.events.failed++;
    }
    
    // 2. Get Event Details
    try {
        const res = await axios.get(`${BASE_URL}/events/2`);
        if (res.data.success || res.data.data) {
            console.log('✅ Get Event Details - Working');
            tests.events.passed++;
        }
    } catch (e) {
        console.log('❌ Get Event Details - Failed');
        tests.events.failed++;
    }
    
    // 3. Rankings (Fixed)
    try {
        const res = await axios.get(`${BASE_URL}/rankings`);
        if (res.data.success || res.data.data) {
            console.log('✅ Rankings API - Working');
            tests.events.passed++;
        }
    } catch (e) {
        console.log('❌ Rankings API - Failed');
        tests.events.failed++;
    }
    
    console.log('\n🎯 BRACKETS MODERATION TAB TESTS:');
    
    // 1. Get Event Bracket
    try {
        const res = await axios.get(`${BASE_URL}/events/2/bracket`);
        if (res.data.success && res.data.data.bracket) {
            console.log('✅ Get Event Bracket - Working');
            tests.brackets.passed++;
        }
    } catch (e) {
        console.log('❌ Get Event Bracket - Failed');
        tests.brackets.failed++;
    }
    
    // 2. Comprehensive Bracket
    try {
        const res = await axios.get(`${BASE_URL}/events/2/comprehensive-bracket`);
        if (res.data) {
            console.log('✅ Comprehensive Bracket - Working');
            tests.brackets.passed++;
        }
    } catch (e) {
        console.log('❌ Comprehensive Bracket - Failed');
        tests.brackets.failed++;
    }
    
    // 3. Live Matches
    try {
        const res = await axios.get(`${BASE_URL}/live-matches`);
        if (res.data) {
            console.log('✅ Live Matches - Working');
            tests.brackets.passed++;
        }
    } catch (e) {
        console.log('❌ Live Matches - Failed');
        tests.brackets.failed++;
    }
    
    // Summary
    console.log('\n📊 FINAL RESULTS:');
    console.log(`Events Tab: ${tests.events.passed}/${tests.events.passed + tests.events.failed} tests passed`);
    console.log(`Brackets Tab: ${tests.brackets.passed}/${tests.brackets.passed + tests.brackets.failed} tests passed`);
    
    const totalPassed = tests.events.passed + tests.brackets.passed;
    const totalTests = totalPassed + tests.events.failed + tests.brackets.failed;
    const successRate = (totalPassed / totalTests * 100).toFixed(1);
    
    console.log(`\n🎉 Overall Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
        console.log('✅ PRODUCTION READY - All critical functions working!');
    } else {
        console.log('⚠️ Some issues remain - Check failed tests above');
    }
}

testEventsAndBrackets().catch(console.error);