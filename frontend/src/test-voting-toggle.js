// Test script to verify voting toggle functionality
// Run this in the browser console while on a forum thread page

const testVotingToggle = async () => {
  console.log('🧪 Testing voting toggle functionality...\n');

  // Find the first voting button on the page
  const voteButtons = document.querySelectorAll('button');
  let upvoteButton = null;
  
  for (const button of voteButtons) {
    if (button.textContent.includes('👍')) {
      upvoteButton = button;
      break;
    }
  }

  if (!upvoteButton) {
    console.error('❌ No upvote button found on the page');
    return;
  }

  console.log('✅ Found upvote button');
  
  // Get initial vote count
  const getVoteCount = () => {
    const voteSpan = upvoteButton.querySelector('span:last-child');
    return voteSpan ? parseInt(voteSpan.textContent) : 0;
  };

  const initialCount = getVoteCount();
  console.log(`📊 Initial upvote count: ${initialCount}`);

  // Test sequence
  console.log('\n📋 Test sequence:');
  console.log('1. Click upvote (should increase by 1)');
  console.log('2. Wait 2 seconds');
  console.log('3. Click upvote again (should decrease by 1 - toggle off)');
  console.log('4. Check if count returns to initial value');

  // First click - upvote
  console.log('\n🔄 Clicking upvote...');
  upvoteButton.click();

  // Wait for UI update
  await new Promise(resolve => setTimeout(resolve, 2000));

  const afterFirstClick = getVoteCount();
  console.log(`📊 After first click: ${afterFirstClick}`);
  
  if (afterFirstClick === initialCount + 1) {
    console.log('✅ First click worked correctly (increased by 1)');
  } else {
    console.error(`❌ First click failed. Expected ${initialCount + 1}, got ${afterFirstClick}`);
  }

  // Second click - toggle off
  console.log('\n🔄 Clicking upvote again to toggle off...');
  upvoteButton.click();

  // Wait for UI update
  await new Promise(resolve => setTimeout(resolve, 2000));

  const afterSecondClick = getVoteCount();
  console.log(`📊 After second click: ${afterSecondClick}`);

  if (afterSecondClick === initialCount) {
    console.log('✅ Toggle off worked correctly (returned to initial count)');
    console.log('\n🎉 VOTING TOGGLE FIX IS WORKING!');
  } else {
    console.error(`❌ Toggle off failed. Expected ${initialCount}, got ${afterSecondClick}`);
    console.log('\n😞 VOTING TOGGLE FIX NOT WORKING - CHECK CONSOLE LOGS');
  }
};

// Run the test
testVotingToggle();