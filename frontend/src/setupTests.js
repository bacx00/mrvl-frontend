/**
 * 🧪 MARVEL RIVALS TEST MATCH SETUP
 * Quick function to create test matches via API
 */

const createTestMatches = async () => {
  const API_URL = process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net/api';
  
  try {
    const response = await fetch(`${API_URL}/test/matches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ clean: true })
    });
    
    const data = await response.json();
    console.log('✅ Test matches created:', data);
    
    if (data.live_matches) {
      console.log('🔴 Live matches ready for testing:');
      data.live_matches.forEach(id => {
        console.log(`- Match #${id}: ${window.location.origin}/admin/matches/${id}/live-scoring`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ Error creating test matches:', error);
    throw error;
  }
};

// Export for use in browser console
window.createTestMatches = createTestMatches;

// Also export for tests
export { createTestMatches };