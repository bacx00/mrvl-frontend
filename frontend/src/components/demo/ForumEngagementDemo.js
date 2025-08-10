import React, { useState } from 'react';
import OptimizedForumPost, { OptimizedThreadRow } from '../shared/OptimizedForumPost';
import ForumVotingButtons from '../shared/ForumVotingButtons';
import EnhancedUserAvatar, { EnhancedUserCard } from '../shared/EnhancedUserAvatar';
import EngagementMetrics, { ActivityIndicator, EngagementSummary } from '../shared/EngagementMetrics';

const ForumEngagementDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('voting');

  // Sample data
  const sampleUser = {
    id: 1,
    username: 'ProGamer2024',
    avatar: '/images/avatars/sample-avatar.jpg',
    role: 'moderator',
    isOnline: true,
    postCount: 1847,
    reputation: 2341,
    joinDate: new Date('2023-06-15'),
    country: 'United States',
    customTitle: 'Tournament Champion',
    badges: ['First Blood', 'Team Player', 'Strategist', 'Veteran']
  };

  const samplePost = {
    id: 123,
    content: `Just had an incredible match with @team:sentinels! The coordination was perfect, especially when @player:tenz clutched that 1v4 on Haven. 

The new agent buffs are really making a difference in the meta. What do you all think about the recent patch changes?`,
    author: sampleUser,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    editedAt: null,
    postNumber: 47,
    upvotes: 23,
    downvotes: 2,
    userVote: null,
    mentions: [
      {
        type: 'team',
        name: 'sentinels',
        display_name: 'Sentinels',
        id: 'team_1',
        mention_text: '@team:sentinels'
      },
      {
        type: 'player', 
        name: 'tenz',
        display_name: 'TenZ',
        id: 'player_1',
        mention_text: '@player:tenz'
      }
    ],
    attachments: []
  };

  const sampleThread = {
    id: 456,
    title: 'Discussion: New Agent Meta and Tournament Implications',
    author: sampleUser,
    category: {
      id: 'strategy',
      name: 'Strategy Discussion',
      color: '#4ade80'
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    replyCount: 47,
    viewCount: 1238,
    upvotes: 18,
    downvotes: 3,
    isPinned: false,
    isLocked: false,
    isHot: true,
    hasUnreadPosts: true,
    prefix: 'META',
    preview: 'Deep dive into how the recent agent changes are affecting competitive play...',
    lastActivity: {
      author: {
        id: 2,
        username: 'AnalystPro',
        avatar: null,
        role: 'vip'
      },
      timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      postNumber: 47
    }
  };

  const handleVoteChange = (voteData) => {
    console.log('Vote changed:', voteData);
    // In real implementation, this would update the server and local state
  };

  const handleMentionClick = (mention) => {
    console.log('Mention clicked:', mention);
    // Navigate to the mentioned entity
  };

  const handleThreadClick = (thread) => {
    console.log('Thread clicked:', thread);
    // Navigate to thread
  };

  const demoSections = {
    voting: {
      title: 'Enhanced Voting System',
      description: 'Optimistic UI updates with smooth animations and immediate visual feedback',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a2332] p-4 rounded-lg border border-[#2b3d4d]">
              <h4 className="text-white font-medium mb-3">Vertical Layout</h4>
              <ForumVotingButtons
                itemType="post"
                itemId={samplePost.id}
                initialUpvotes={samplePost.upvotes}
                initialDownvotes={samplePost.downvotes}
                userVote={null}
                onVoteChange={handleVoteChange}
                direction="vertical"
                size="lg"
              />
            </div>
            <div className="bg-[#1a2332] p-4 rounded-lg border border-[#2b3d4d]">
              <h4 className="text-white font-medium mb-3">Horizontal Layout</h4>
              <ForumVotingButtons
                itemType="thread"
                itemId={sampleThread.id}
                initialUpvotes={sampleThread.upvotes}
                initialDownvotes={sampleThread.downvotes}
                userVote={null}
                onVoteChange={handleVoteChange}
                direction="horizontal"
                size="md"
              />
            </div>
          </div>
        </div>
      )
    },
    avatars: {
      title: 'Enhanced User Avatars',
      description: 'Consistent avatar display with role indicators, online status, and user cards',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['xs', 'sm', 'md', 'lg', 'xl'].map(size => (
              <div key={size} className="text-center">
                <div className="mb-2">
                  <EnhancedUserAvatar
                    user={sampleUser}
                    size={size}
                    showOnlineStatus={true}
                    showRole={size !== 'xs'}
                    clickable={true}
                  />
                </div>
                <span className="text-sm text-[#768894]">{size.toUpperCase()}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <EnhancedUserCard
              user={sampleUser}
              compact={false}
              showAvatar={true}
              showStats={true}
              showRole={true}
            />
          </div>
        </div>
      )
    },
    engagement: {
      title: 'Engagement Metrics',
      description: 'Real-time view counts, reply tracking, and activity indicators',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#1a2332] p-4 rounded-lg border border-[#2b3d4d]">
              <h4 className="text-white font-medium mb-3">Compact Metrics</h4>
              <EngagementMetrics
                item={sampleThread}
                type="thread"
                compact={true}
                showLabels={true}
                showLastActivity={true}
              />
            </div>
            <div className="bg-[#1a2332] p-4 rounded-lg border border-[#2b3d4d]">
              <h4 className="text-white font-medium mb-3">Detailed Metrics</h4>
              <EngagementMetrics
                item={sampleThread}
                type="thread"
                compact={false}
                showLabels={true}
                showLastActivity={true}
              />
            </div>
          </div>
          
          <EngagementSummary
            items={[sampleThread, {...sampleThread, id: 457}, {...sampleThread, id: 458}]}
            type="threads"
            timeRange="24h"
          />
        </div>
      )
    },
    mentions: {
      title: 'Enhanced Mentions',
      description: 'Clickable mentions with visual highlighting and proper navigation',
      component: (
        <div className="space-y-6">
          <div className="bg-[#1a2332] p-4 rounded-lg border border-[#2b3d4d]">
            <h4 className="text-white font-medium mb-3">Mention Examples</h4>
            <div className="text-white space-y-2">
              <p>
                Check out this play by <span className="inline-flex items-center font-medium px-2 py-1 rounded-md transition-all duration-200 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                  <span className="inline-flex items-center justify-center w-3 h-3 mr-1 text-xs bg-blue-100 text-blue-600 rounded-full">P</span>
                  @TenZ
                </span> from <span className="inline-flex items-center font-medium px-2 py-1 rounded-md transition-all duration-200 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <span className="inline-flex items-center justify-center w-3 h-3 mr-1 text-xs bg-red-100 text-red-600 rounded-full">T</span>
                  @Sentinels
                </span>!
              </p>
              <p>
                Thanks <span className="inline-flex items-center font-medium px-2 py-1 rounded-md transition-all duration-200 text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20">
                  <span className="inline-flex items-center justify-center w-3 h-3 mr-1 text-xs bg-green-100 text-green-600 rounded-full">U</span>
                  @ProGamer2024
                </span> for the analysis!
              </p>
            </div>
          </div>
        </div>
      )
    },
    integrated: {
      title: 'Complete Integration',
      description: 'All features working together in realistic forum components',
      component: (
        <div className="space-y-6">
          <OptimizedThreadRow
            thread={sampleThread}
            showPreview={true}
            showVoting={true}
            onThreadClick={handleThreadClick}
          />
          
          <OptimizedForumPost
            post={samplePost}
            thread={sampleThread}
            showVoting={true}
            showMentions={true}
            showEngagement={true}
            onVoteChange={handleVoteChange}
            onMentionClick={handleMentionClick}
          />
        </div>
      )
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Forum Engagement Optimization Demo
          </h1>
          <p className="text-[#768894]">
            Interactive demonstration of enhanced voting, mentions, date formatting, and user engagement features
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap gap-2 mb-8">
          {Object.entries(demoSections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setSelectedDemo(key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedDemo === key
                  ? 'bg-[#fa4454] text-white'
                  : 'bg-[#1a2332] text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
              }`}
            >
              {section.title}
            </button>
          ))}
        </div>

        {/* Demo Content */}
        <div className="bg-[#0f1419] rounded-lg">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {demoSections[selectedDemo].title}
            </h2>
            <p className="text-[#768894]">
              {demoSections[selectedDemo].description}
            </p>
          </div>
          
          {demoSections[selectedDemo].component}
        </div>

        {/* Feature Summary */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Optimistic UI Updates',
              description: 'Voting changes reflect immediately with server sync',
              icon: '⚡'
            },
            {
              title: 'Enhanced Mentions',
              description: 'Clickable mentions with proper navigation and highlighting',
              icon: '@'
            },
            {
              title: 'Consistent Dating',
              description: 'Unified time format across all components',
              icon: '🕒'
            },
            {
              title: 'User Engagement',
              description: 'Real-time metrics and user interaction tracking',
              icon: '📊'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-[#768894]">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ForumEngagementDemo;