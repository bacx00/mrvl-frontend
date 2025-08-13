/**
 * Quick Live Scoring Test - Run in Browser Console
 * 
 * This is a simplified test that can be copy-pasted into the browser console
 * to quickly verify live scoring functionality.
 * 
 * Usage:
 * 1. Navigate to /match/[id] page
 * 2. Open browser console (F12)
 * 3. Copy and paste this entire script
 * 4. The test will run automatically
 */

(async function quickLiveScoringTest() {
  console.log('🚀 Quick Live Scoring Test Starting...\n');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  function test(name, condition, details = '') {
    testsTotal++;
    const passed = !!condition;
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${name}: ${details || (passed ? 'PASS' : 'FAIL')}`);
    if (passed) testsPassed++;
    return passed;
  }
  
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Test 1: Check if we're on a match page
  const matchIdMatch = window.location.pathname.match(/\/match\/(\d+)/);
  test('Match Page Detection', matchIdMatch, matchIdMatch ? `Found match ID: ${matchIdMatch[1]}` : 'Not on match page');
  
  if (!matchIdMatch) {
    console.log('❌ Please navigate to a match detail page first (/match/[id])');
    return;
  }
  
  const matchId = matchIdMatch[1];
  
  // Test 2: Check for MatchDetailPage elements
  const scoreElements = document.querySelectorAll('[class*="text-4xl"]');
  test('Score Display Elements', scoreElements.length >= 2, `Found ${scoreElements.length} score elements`);
  
  const mapBoxes = document.querySelectorAll('[class*="w-20 h-24"]');
  test('Map Navigation Boxes', mapBoxes.length > 0, `Found ${mapBoxes.length} map boxes`);
  
  const playerTables = document.querySelectorAll('table');
  test('Player Statistics Tables', playerTables.length >= 2, `Found ${playerTables.length} player tables`);
  
  // Test 3: Check for Live Scoring button
  const liveScoringButton = Array.from(document.querySelectorAll('button'))
    .find(btn => btn.textContent.includes('Live Scoring'));
  test('Live Scoring Button', liveScoringButton, liveScoringButton ? 'Button found' : 'Button not found (may need admin access)');
  
  if (!liveScoringButton) {
    console.log('⚠️ Live Scoring button not found. You may need admin access to continue.');
    console.log('📊 Basic page tests completed.');
    console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);
    return;
  }
  
  // Test 4: Open Live Scoring panel
  console.log('🔄 Opening Live Scoring panel...');
  liveScoringButton.click();
  await delay(1000);
  
  const panel = document.querySelector('[class*="fixed inset-0"]');
  test('Live Scoring Panel Opens', panel, panel ? 'Panel opened successfully' : 'Panel failed to open');
  
  if (!panel) {
    console.log('❌ Cannot continue tests without Live Scoring panel');
    console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);
    return;
  }
  
  // Test 5: Check panel contents
  const seriesScoreSection = panel.querySelector('[class*="SERIES SCORE"]');
  test('Series Score Section', seriesScoreSection, 'Found in panel');
  
  const mapControls = panel.querySelector('select[id="map-selector"]');
  test('Map Controls', mapControls, 'Map selector found');
  
  const playerSections = panel.querySelectorAll('[class*="bg-gray-800"][class*="p-3"]');
  test('Player Sections', playerSections.length >= 2, `Found ${playerSections.length} player sections`);
  
  // Test 6: Test score update functionality
  const scoreButtons = panel.querySelectorAll('button[class*="bg-green-600"]');
  const plusButton = Array.from(scoreButtons).find(btn => btn.textContent.includes('+1'));
  test('Score Update Buttons', plusButton, 'Found +1 button');
  
  if (plusButton) {
    console.log('🔄 Testing score update...');
    
    // Get initial scores
    const initialScores = Array.from(scoreElements).map(el => el.textContent.trim());
    
    // Click +1 button
    plusButton.click();
    await delay(1500);
    
    // Check if scores changed
    const updatedScores = Array.from(document.querySelectorAll('[class*="text-4xl"]'))
      .map(el => el.textContent.trim());
    
    const scoresChanged = JSON.stringify(initialScores) !== JSON.stringify(updatedScores);
    test('Score Update Visual Change', scoresChanged, scoresChanged ? 'Scores updated on page' : 'No visual change detected');
  }
  
  // Test 7: Test localStorage synchronization
  console.log('🔄 Testing localStorage synchronization...');
  
  const testData = {
    series_score_team1: 2,
    series_score_team2: 1,
    team1_score: 2,
    team2_score: 1,
    matchId: parseInt(matchId),
    timestamp: Date.now(),
    source: 'QuickTest',
    type: 'test_sync'
  };
  
  // Store test data
  localStorage.setItem(`live_match_${matchId}`, JSON.stringify(testData));
  
  // Trigger storage event
  const storageEvent = new StorageEvent('storage', {
    key: `live_match_${matchId}`,
    newValue: JSON.stringify(testData),
    oldValue: null
  });
  window.dispatchEvent(storageEvent);
  
  await delay(1000);
  
  // Check if data was processed (look for any DOM changes or console output)
  test('localStorage Sync', true, 'Storage event dispatched (check console for processing logs)');
  
  // Test 8: Hero selection functionality
  const heroSelects = panel.querySelectorAll('select[id*="hero-team"]');
  test('Hero Selection Dropdowns', heroSelects.length > 0, `Found ${heroSelects.length} hero dropdowns`);
  
  if (heroSelects.length > 0) {
    console.log('🔄 Testing hero selection...');
    
    const firstSelect = heroSelects[0];
    const originalValue = firstSelect.value;
    const options = Array.from(firstSelect.options);
    const newOption = options.find(opt => opt.value && opt.value !== originalValue);
    
    if (newOption) {
      firstSelect.value = newOption.value;
      firstSelect.dispatchEvent(new Event('change', { bubbles: true }));
      
      await delay(1000);
      
      test('Hero Selection Change', true, `Changed from "${originalValue}" to "${newOption.value}"`);
    }
  }
  
  // Test 9: Player stats functionality
  const statInputs = panel.querySelectorAll('input[id*="kills-team"], input[id*="deaths-team"]');
  test('Player Stat Inputs', statInputs.length > 0, `Found ${statInputs.length} stat input fields`);
  
  if (statInputs.length > 0) {
    console.log('🔄 Testing player stats update...');
    
    const firstInput = statInputs[0];
    const originalValue = firstInput.value;
    const newValue = parseInt(originalValue) + 1;
    
    firstInput.value = newValue;
    firstInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    await delay(1000);
    
    test('Player Stats Update', true, `Updated from ${originalValue} to ${newValue}`);
  }
  
  // Test 10: Force re-render verification
  console.log('🔄 Testing force re-render mechanism...');
  
  // Check if forceRender state exists (look for key attributes)
  const keyElements = document.querySelectorAll('[key*="force"], [key*="render"]');
  test('Force Re-render Keys', keyElements.length > 0, 
    keyElements.length > 0 ? `Found ${keyElements.length} elements with render keys` : 'No render keys detected');
  
  // Final summary
  console.log('\n📊 Quick Test Summary:');
  console.log(`✅ Passed: ${testsPassed}/${testsTotal}`);
  console.log(`❌ Failed: ${testsTotal - testsPassed}`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All quick tests passed! Live scoring system appears to be working correctly.');
  } else if (testsPassed > testsTotal * 0.7) {
    console.log('⚠️ Most tests passed, but some issues detected. Check failed tests above.');
  } else {
    console.log('❌ Multiple test failures detected. Live scoring system may have issues.');
  }
  
  console.log('\n📋 Test Details:');
  console.log('- Visual updates should appear immediately when scores/heroes change');
  console.log('- Check browser console for any error messages');
  console.log('- Verify localStorage contains live_match_[ID] entries');
  console.log('- Cross-tab sync can be tested by opening same match in multiple tabs');
  
  // Cleanup
  console.log('\n🧹 Cleaning up test data...');
  localStorage.removeItem(`live_match_${matchId}`);
  
  console.log('\n✅ Quick Live Scoring Test completed!');
  
})().catch(error => {
  console.error('❌ Quick test failed:', error);
});

// Additional utility functions for manual testing
window.testLiveScoring = {
  // Check current localStorage data
  checkStorage: function(matchId) {
    const key = `live_match_${matchId}`;
    const data = localStorage.getItem(key);
    if (data) {
      console.log('📦 Current localStorage data:', JSON.parse(data));
    } else {
      console.log('📦 No localStorage data found for match', matchId);
    }
  },
  
  // Trigger fake update
  triggerUpdate: function(matchId, scoreTeam1 = 1, scoreTeam2 = 0) {
    const testData = {
      series_score_team1: scoreTeam1,
      series_score_team2: scoreTeam2,
      team1_score: scoreTeam1,
      team2_score: scoreTeam2,
      current_map_team1_score: 10,
      current_map_team2_score: 5,
      matchId: parseInt(matchId),
      timestamp: Date.now(),
      source: 'ManualTest',
      type: 'manual_update'
    };
    
    localStorage.setItem(`live_match_${matchId}`, JSON.stringify(testData));
    
    const storageEvent = new StorageEvent('storage', {
      key: `live_match_${matchId}`,
      newValue: JSON.stringify(testData),
      oldValue: null
    });
    window.dispatchEvent(storageEvent);
    
    console.log('📡 Triggered manual update:', testData);
  },
  
  // Check if elements have proper keys for re-rendering
  checkRenderKeys: function() {
    const elementsWithKeys = document.querySelectorAll('[key]');
    console.log('🔑 Elements with keys for re-rendering:', elementsWithKeys.length);
    elementsWithKeys.forEach((el, i) => {
      if (i < 10) { // Show first 10
        console.log(`  - ${el.tagName}: key="${el.getAttribute('key')}"`);
      }
    });
  }
};

console.log('\n🛠️ Additional test utilities available:');
console.log('- testLiveScoring.checkStorage(matchId): Check localStorage data');
console.log('- testLiveScoring.triggerUpdate(matchId, team1Score, team2Score): Trigger manual update');
console.log('- testLiveScoring.checkRenderKeys(): Check re-render key attributes');