/**
 * Test Script for Immediate Live Updates
 * 
 * Run this in browser console while viewing a MatchDetailPage to test that:
 * 1. Score changes immediately update the UI
 * 2. No page refresh is needed
 * 3. Updates propagate correctly between components
 * 
 * Usage:
 * 1. Open MatchDetailPage for any match
 * 2. Open Live Scoring panel (admin only)
 * 3. Run: testImmediateUpdates(matchId)
 * 4. Verify scores update instantly in the main page
 */

function testImmediateUpdates(matchId) {
  console.log('🧪 Testing immediate live updates for match', matchId);
  
  // Test 1: Check if LiveScoreManager is available
  try {
    if (window.liveScoreManager) {
      console.log('✅ LiveScoreManager is available');
      console.log('📊 Current status:', window.liveScoreManager.getDebugInfo());
    } else {
      console.warn('⚠️ LiveScoreManager not available on window object');
    }
  } catch (error) {
    console.error('❌ Error accessing LiveScoreManager:', error);
  }
  
  // Test 2: Simulate a score update
  const testScoreUpdate = {
    series_score_team1: Math.floor(Math.random() * 3),
    series_score_team2: Math.floor(Math.random() * 3),
    status: 'live',
    timestamp: Date.now()
  };
  
  console.log('📤 Broadcasting test score update:', testScoreUpdate);
  
  // Test via localStorage (immediate same-tab)
  try {
    localStorage.setItem(`match_${matchId}_updated`, Date.now().toString());
    console.log('✅ localStorage update triggered');
  } catch (error) {
    console.error('❌ localStorage update failed:', error);
  }
  
  // Test via LiveScoreManager if available
  try {
    if (window.liveScoreManager) {
      window.liveScoreManager.broadcastScoreUpdate(matchId, testScoreUpdate, {
        source: 'test-script',
        type: 'test_update'
      });
      console.log('✅ LiveScoreManager broadcast completed');
    }
  } catch (error) {
    console.error('❌ LiveScoreManager broadcast failed:', error);
  }
  
  // Test 3: Monitor for updates
  let updateCount = 0;
  const monitoringInterval = setInterval(() => {
    updateCount++;
    if (updateCount >= 5) {
      clearInterval(monitoringInterval);
      console.log('🏁 Test monitoring completed');
      return;
    }
    
    // Check if DOM elements show updated scores
    const scoreElements = document.querySelectorAll('[class*="text-4xl"], [class*="font-bold"]');
    const currentScores = Array.from(scoreElements)
      .filter(el => /^\d+$/.test(el.textContent?.trim()))
      .map(el => el.textContent?.trim());
    
    console.log(`📊 Current scores in DOM (check ${updateCount}/5):`, currentScores);
  }, 1000);
  
  console.log('🔍 Monitoring DOM for score changes... (5 seconds)');
  
  return {
    testScoreUpdate,
    instructions: [
      '1. Check browser console for test results',
      '2. Verify scores in the UI match testScoreUpdate values',
      '3. If using Live Scoring panel, change scores and verify immediate updates',
      '4. No page refresh should be needed'
    ]
  };
}

// Test helper to check current match context
function checkMatchContext() {
  const pathname = window.location.pathname;
  const matchIdFromPath = pathname.match(/\/match\/(\d+)/)?.[1];
  
  console.log('🎯 Current page:', pathname);
  console.log('🆔 Match ID from URL:', matchIdFromPath);
  
  if (matchIdFromPath) {
    console.log('✅ Found match context, ready for testing');
    console.log('🚀 Run: testImmediateUpdates(' + matchIdFromPath + ')');
    return matchIdFromPath;
  } else {
    console.warn('⚠️ No match context found. Navigate to a MatchDetailPage first.');
    return null;
  }
}

// Auto-run context check
checkMatchContext();

// Export for global access
window.testImmediateUpdates = testImmediateUpdates;
window.checkMatchContext = checkMatchContext;

console.log('🧪 Live update test functions loaded. Use testImmediateUpdates(matchId) to test.');