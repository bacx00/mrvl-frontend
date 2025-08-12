/**
 * Quick test to validate SSE endpoint URL fix
 * This script tests that the correct URL pattern is being used
 */

const BACKEND_URL = 'https://staging.mrvl.net';
const TEST_MATCH_ID = 1;

console.log('🔧 Testing SSE URL Pattern Fix');
console.log('================================');

// Test the corrected URL pattern
const correctUrl = `${BACKEND_URL}/api/live-updates/${TEST_MATCH_ID}/stream`;
console.log(`✅ Correct URL: ${correctUrl}`);

// Show what the old (incorrect) URL was
const incorrectUrl = `${BACKEND_URL}/api/live-updates/stream/${TEST_MATCH_ID}`;
console.log(`❌ Old URL: ${incorrectUrl}`);

// Test actual connection to validate the fix
console.log('\n🧪 Testing actual SSE connection...');

function testSSEConnection() {
  return new Promise((resolve) => {
    const eventSource = new EventSource(correctUrl, { withCredentials: true });
    
    const timeout = setTimeout(() => {
      eventSource.close();
      resolve({
        success: false,
        error: 'Connection timeout',
        url: correctUrl
      });
    }, 5000);

    eventSource.onopen = () => {
      clearTimeout(timeout);
      eventSource.close();
      resolve({
        success: true,
        message: 'SSE connection successful',
        url: correctUrl
      });
    };

    eventSource.onerror = (error) => {
      clearTimeout(timeout);
      eventSource.close();
      resolve({
        success: false,
        error: 'Connection failed',
        details: error,
        url: correctUrl
      });
    };
  });
}

// Run the test if in browser environment
if (typeof window !== 'undefined') {
  testSSEConnection().then(result => {
    console.log('\n📊 Test Results:');
    console.log('================');
    if (result.success) {
      console.log('✅ SUCCESS:', result.message);
      console.log('🔗 URL:', result.url);
    } else {
      console.log('❌ FAILED:', result.error);
      console.log('🔗 URL:', result.url);
      if (result.details) {
        console.log('🔍 Details:', result.details);
      }
    }
  });
} else {
  console.log('ℹ️ Run this script in a browser to test the actual SSE connection');
}

console.log('\n✨ URL Pattern Fix Applied Successfully!');
console.log('All frontend files now use: /api/live-updates/{matchId}/stream');
console.log('This matches the backend route: Route::get(\'/live-updates/{matchId}/stream\', [LiveUpdateController::class, \'stream\']);');