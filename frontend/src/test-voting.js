// Test script to verify voting endpoints
// This can be run in the browser console when on a forum thread or news page

const testVoting = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No auth token found. Please log in first.');
    return;
  }

  console.log('🔍 Testing voting endpoints...\n');

  // Test forum post voting
  const testForumPostVote = async (postId) => {
    try {
      const response = await fetch(`/api/user/forums/posts/${postId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ vote_type: 'upvote' })
      });

      const data = await response.json();
      console.log(`✅ Forum post ${postId} vote response:`, data);
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Action: ${data.action}`);
    } catch (error) {
      console.error(`❌ Forum post ${postId} vote error:`, error);
    }
  };

  // Test news comment voting
  const testNewsCommentVote = async (newsId, commentId) => {
    try {
      const response = await fetch(`/api/user/news/${newsId}/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ vote_type: 'upvote' })
      });

      const data = await response.json();
      console.log(`✅ News comment ${commentId} vote response:`, data);
      console.log(`   Status: ${response.status}`);
      console.log(`   Success: ${data.success}`);
      console.log(`   Action: ${data.action}`);
    } catch (error) {
      console.error(`❌ News comment ${commentId} vote error:`, error);
    }
  };

  // Instructions
  console.log('📝 To test voting:');
  console.log('1. For forum posts: testForumPostVote(POST_ID)');
  console.log('2. For news comments: testNewsCommentVote(NEWS_ID, COMMENT_ID)');
  console.log('\nExample: testForumPostVote(1)');
  
  // Make functions available globally
  window.testForumPostVote = testForumPostVote;
  window.testNewsCommentVote = testNewsCommentVote;
};

// Auto-run
testVoting();