import React, { useState, useEffect } from 'react';
import { Star, Trophy, Users, Zap } from 'lucide-react';

// Import engagement system components
import {
  EngagementSystemIntegration,
  AccessibilityFeatures,
  PerformanceAnalytics,
  InteractiveAchievementSystem,
  SocialEngagementFeatures,
  GamificationMechanics,
  AdvancedGestureSystem,
  useEngagementSystem,
  ENGAGEMENT_PRESETS,
  hapticFeedback
} from './index';

/**
 * Example: Enhanced Match Card with Full Engagement Features
 * This shows how to integrate all engagement features into an existing component
 */
export const EnhancedMatchCard = ({ 
  match, 
  user = {}, 
  onMatchClick = () => {},
  engagementPreset = 'ENTHUSIAST' 
}) => {
  const { config, isEnabled } = useEngagementSystem(engagementPreset);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [userReaction, setUserReaction] = useState(null);

  // Gesture callbacks for esports-specific actions
  const gestureCallbacks = {
    onQuickLike: () => {
      handleReaction('like');
      hapticFeedback.reaction();
    },
    onFire: () => {
      handleReaction('fire');
      hapticFeedback.streak();
    },
    onTeamSelect: (element) => {
      // Handle team selection gesture
      console.log('Team selected via gesture:', element);
      hapticFeedback.unlock();
    },
    onPredict: ({ team, confidence }) => {
      // Handle prediction gesture
      console.log('Prediction made:', { team, confidence });
      hapticFeedback.success();
    }
  };

  const { elementRef, gestureState, handlers } = isEnabled('advancedGestures') 
    ? AdvancedGestureSystem.useEsportsGestures(gestureCallbacks)
    : { elementRef: null, gestureState: {}, handlers: {} };

  const handleReaction = (reactionType) => {
    setUserReaction(userReaction === reactionType ? null : reactionType);
    setHasInteracted(true);
    
    // Track engagement
    if (isEnabled('performanceTracking')) {
      // This would connect to your analytics
      console.log('User reacted:', { match: match.id, reaction: reactionType });
    }
  };

  const handleShare = () => {
    const shareData = {
      title: `${match.team1.name} vs ${match.team2.name}`,
      content: `Check out this ${match.tournament} match!`,
      url: `/matches/${match.id}`
    };
    
    return shareData;
  };

  return (
    <AccessibilityFeatures.AccessibleCard
      ref={elementRef}
      title={`${match.team1.name} vs ${match.team2.name}`}
      description={`${match.tournament} match`}
      onClick={() => {
        onMatchClick(match);
        setHasInteracted(true);
      }}
      {...(isEnabled('advancedGestures') ? handlers : {})}
      className="bg-white rounded-lg shadow-md overflow-hidden"
    >
      {/* Match Header */}
      <div className="p-4 bg-gradient-to-r from-red-500 to-red-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Trophy size={16} />
            <span className="text-sm font-medium">{match.tournament}</span>
          </div>
          
          {/* Live Indicator with Pulse */}
          {match.isLive && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs">LIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 text-center">
            <img
              src={match.team1.logo}
              alt={match.team1.name}
              className="w-12 h-12 mx-auto mb-2"
            />
            <h3 className="font-semibold text-gray-900">{match.team1.name}</h3>
            {match.score && (
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {match.score.team1}
              </div>
            )}
          </div>

          <div className="px-4">
            <div className="text-sm text-gray-500 text-center">
              {match.status === 'upcoming' ? match.startTime : 'VS'}
            </div>
          </div>

          <div className="flex-1 text-center">
            <img
              src={match.team2.logo}
              alt={match.team2.name}
              className="w-12 h-12 mx-auto mb-2"
            />
            <h3 className="font-semibold text-gray-900">{match.team2.name}</h3>
            {match.score && (
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {match.score.team2}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Features */}
      {isEnabled('socialFeatures') && (
        <div className="px-4 pb-2 border-t">
          <SocialEngagementFeatures.QuickReactionSystem
            contentId={match.id}
            initialReactions={match.reactions || {}}
            onReact={handleReaction}
            showCounts={true}
          />
        </div>
      )}

      {/* Share Button */}
      {isEnabled('socialFeatures') && (
        <div className="px-4 pb-4">
          <SocialEngagementFeatures.QuickShareSystem
            content={`${match.team1.name} vs ${match.team2.name}`}
            title={`${match.tournament} Match`}
            url={`/matches/${match.id}`}
          />
        </div>
      )}

      {/* Gesture Feedback */}
      {isEnabled('advancedGestures') && gestureState.type && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
          {gestureState.type.replace('_', ' ').toUpperCase()}
        </div>
      )}

      {/* Touch Reveal for Additional Info */}
      {isEnabled('achievements') && hasInteracted && (
        <InteractiveAchievementSystem.TouchRevealCard
          achievement={{
            name: 'Match Enthusiast',
            description: 'Engaged with match content',
            rarity: 'common'
          }}
        >
          <div className="p-2 bg-blue-50 text-blue-800 text-xs text-center">
            +10 XP for engaging with match!
          </div>
        </InteractiveAchievementSystem.TouchRevealCard>
      )}
    </AccessibilityFeatures.AccessibleCard>
  );
};

/**
 * Example: User Dashboard with Comprehensive Engagement
 * Shows integration of all engagement systems in a dashboard layout
 */
export const EngagementDashboard = ({ user = {}, matches = [] }) => {
  const [showEngagementHub, setShowEngagementHub] = useState(false);
  const [userStats, setUserStats] = useState({
    level: 12,
    xp: 8450,
    nextLevelXP: 10000,
    achievements: 15,
    friends: 23,
    streaks: { daily: 5, weekly: 2 },
    recentActivity: [
      'Watched VCT Champions final',
      'Achieved "Prediction Master"',
      'Added 3 new friends',
      'Completed daily challenges'
    ]
  });

  // Sample achievement that just unlocked
  const [newAchievement, setNewAchievement] = useState({
    id: 'engagement_master',
    name: 'Engagement Master',
    description: 'Used all engagement features in one session',
    type: 'power_user',
    gradient: 'from-purple-500 to-purple-700',
    unlocked: true,
    unlockedAt: new Date().toISOString()
  });

  const handleLevelUp = (newLevel) => {
    console.log('User leveled up to:', newLevel);
    hapticFeedback.levelUp();
    
    // Show some celebration UI
    setTimeout(() => {
      alert(`Congratulations! You reached Level ${newLevel}!`);
    }, 1000);
  };

  return (
    <PerformanceAnalytics.PerformanceProvider>
      <AccessibilityFeatures.AccessibilityProvider>
        <div className="min-h-screen bg-gray-50">
          {/* Dashboard Header */}
          <div className="bg-white shadow-sm">
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-gray-600">Welcome back, {user.name}!</p>
                </div>
                
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  onClick={() => setShowEngagementHub(true)}
                >
                  <Users size={16} className="inline mr-2" />
                  Engagement Hub
                </button>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {/* XP and Level Progress */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Progress</h2>
              <GamificationMechanics.XPSystem
                currentXP={userStats.xp}
                currentLevel={userStats.level}
                onLevelUp={handleLevelUp}
              />
            </div>

            {/* Achievements and Streaks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Streaks</h2>
                <div className="space-y-4">
                  <InteractiveAchievementSystem.StreakDisplay
                    currentStreak={userStats.streaks.daily}
                    maxStreak={7}
                    type="daily"
                  />
                  <InteractiveAchievementSystem.StreakDisplay
                    currentStreak={userStats.streaks.weekly}
                    maxStreak={4}
                    type="weekly"
                  />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{userStats.achievements}</div>
                    <div className="text-sm text-gray-600">Achievements</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{userStats.friends}</div>
                    <div className="text-sm text-gray-600">Friends</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round((userStats.xp / userStats.nextLevelXP) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Next Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {userStats.streaks.daily + userStats.streaks.weekly}
                    </div>
                    <div className="text-sm text-gray-600">Total Streaks</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Matches with Engagement */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Matches</h2>
              <div className="space-y-4">
                {matches.slice(0, 3).map(match => (
                  <EnhancedMatchCard
                    key={match.id}
                    match={match}
                    user={user}
                    engagementPreset="ENTHUSIAST"
                    onMatchClick={(match) => {
                      console.log('Navigate to match:', match.id);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Daily Challenges */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Daily Challenges</h2>
              <GamificationMechanics.DailyChallenges
                challenges={[
                  {
                    id: 'daily_watch',
                    title: 'Daily Viewer',
                    description: 'Watch 2 matches today',
                    type: 'watch',
                    progress: 1,
                    target: 2,
                    reward: { xp: 100 }
                  },
                  {
                    id: 'social_interact',
                    title: 'Social Butterfly',
                    description: 'React to 5 posts',
                    type: 'social',
                    progress: 3,
                    target: 5,
                    reward: { xp: 75 }
                  },
                  {
                    id: 'prediction_challenge',
                    title: 'Fortune Teller',
                    description: 'Make 1 prediction',
                    type: 'predict',
                    progress: 1,
                    target: 1,
                    reward: { xp: 150 }
                  }
                ]}
                onCompleteChallenge={(challengeId) => {
                  console.log('Challenge completed:', challengeId);
                  hapticFeedback.achievement();
                }}
              />
            </div>
          </div>

          {/* Engagement Hub Modal */}
          <EngagementSystemIntegration.EngagementHub
            user={user}
            isVisible={showEngagementHub}
            onClose={() => setShowEngagementHub(false)}
          />

          {/* Achievement Unlock Notification */}
          <InteractiveAchievementSystem.AchievementShowcase
            achievement={newAchievement}
            isOpen={!!newAchievement}
            onClose={() => setNewAchievement(null)}
            onShare={(achievement) => {
              console.log('Share achievement:', achievement);
              // Implement sharing logic
            }}
          />

          {/* Loading Mini-Game (shows during page transitions) */}
          <GamificationMechanics.LoadingMiniGame
            isLoading={false} // Set to true during loading
            duration={3000}
            gameType="tap"
            onGameComplete={(score) => {
              console.log('Loading game completed with score:', score);
              if (score > 100) {
                hapticFeedback.achievement();
                // Give bonus XP for good performance
              }
            }}
          />
        </div>
      </AccessibilityFeatures.AccessibilityProvider>
    </PerformanceAnalytics.PerformanceProvider>
  );
};

/**
 * Example: Integration with Existing Mobile Components
 * Shows how to enhance existing mobile navigation with engagement features
 */
export const EnhancedMobileNavigation = ({ currentPath = '/', user = {} }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'achievement', message: 'New achievement unlocked!' },
    { id: 2, type: 'friend', message: 'Friend request from Player123' },
    { id: 3, type: 'challenge', message: 'Daily challenge expires in 2 hours' }
  ]);

  const navigationItems = [
    { path: '/', label: 'Home', icon: '🏠', hasNotifications: false },
    { path: '/matches', label: 'Matches', icon: '⚔️', hasNotifications: true },
    { path: '/social', label: 'Social', icon: '👥', hasNotifications: notifications.length > 0 },
    { path: '/profile', label: 'Profile', icon: '👤', hasNotifications: false }
  ];

  return (
    <AccessibilityFeatures.AccessibilityProvider>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-40">
        <div className="flex items-center justify-around py-2">
          {navigationItems.map((item, index) => (
            <EngagementSystemIntegration.EngagementEnhancedCard
              key={item.path}
              contentId={`nav_${item.path}`}
              enableReactions={false}
              enableSharing={false}
              onInteraction={(type, data) => {
                console.log('Navigation interaction:', type, data);
                hapticFeedback.light();
              }}
              className="flex-1"
            >
              <button
                className={`
                  relative w-full flex flex-col items-center py-2 px-1 transition-colors
                  ${currentPath === item.path 
                    ? 'text-red-600' 
                    : 'text-gray-600 hover:text-gray-800'
                  }
                `}
                onClick={() => {
                  console.log('Navigate to:', item.path);
                  hapticFeedback.light();
                }}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
                
                {/* Notification Indicator */}
                {item.hasNotifications && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            </EngagementSystemIntegration.EngagementEnhancedCard>
          ))}
        </div>

        {/* Level Progress Bar at Bottom */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
            style={{ width: '60%' }} // Example: 60% to next level
          />
        </div>
      </div>
    </AccessibilityFeatures.AccessibilityProvider>
  );
};

// Usage Examples and Integration Notes
export const IntegrationExamples = () => {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Integration Guide</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">1. Basic Component Enhancement</h3>
              <p className="text-gray-600 text-sm">
                Wrap existing components with engagement features using the HOC pattern:
              </p>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-2 overflow-x-auto">
{`const EnhancedComponent = withEngagementFeatures(ExistingComponent);`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">2. Provider Setup</h3>
              <p className="text-gray-600 text-sm">
                Wrap your app with the necessary providers:
              </p>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-2 overflow-x-auto">
{`<PerformanceProvider>
  <AccessibilityProvider>
    <App />
  </AccessibilityProvider>
</PerformanceProvider>`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900">3. Configuration Presets</h3>
              <p className="text-gray-600 text-sm">
                Use engagement presets for different user types:
              </p>
              <pre className="bg-gray-50 p-3 rounded text-sm mt-2 overflow-x-auto">
{`const { config } = useEngagementSystem('COMPETITIVE', {
  performanceTracking: true,
  advancedGestures: true
});`}
              </pre>
            </div>
          </div>
        </div>

        {/* Live Examples */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Live Examples</h2>
          
          {/* Sample match data for examples */}
          <EnhancedMatchCard
            match={{
              id: 'sample-1',
              team1: { name: 'Team Liquid', logo: '/team-liquid.png' },
              team2: { name: 'NAVI', logo: '/navi.png' },
              tournament: 'VCT Champions',
              isLive: true,
              score: { team1: 13, team2: 11 },
              reactions: { like: 42, fire: 18, poggers: 7 }
            }}
            user={{ id: 'user-1', name: 'Player' }}
            engagementPreset="ENTHUSIAST"
          />

          <EnhancedMobileNavigation
            currentPath="/matches"
            user={{ id: 'user-1', name: 'Player' }}
          />
        </div>
      </div>
    </div>
  );
};

export default {
  EnhancedMatchCard,
  EngagementDashboard,
  EnhancedMobileNavigation,
  IntegrationExamples
};