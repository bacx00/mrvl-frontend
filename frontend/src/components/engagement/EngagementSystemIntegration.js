import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings, Users, Trophy, Zap, Eye, Bell, Share2 } from 'lucide-react';

// Import all engagement components
import { AdvancedGestureSystem } from './AdvancedGestureSystem';
import { InteractiveAchievementSystem } from './InteractiveAchievementSystem';
import { SocialEngagementFeatures } from './SocialEngagementFeatures';
import { GamificationMechanics } from './GamificationMechanics';
import { AccessibilityFeatures } from './AccessibilityFeatures';
import { PerformanceAnalytics } from './PerformanceAnalytics';

// Import existing mobile components
import MobileGestures from '../mobile/MobileGestures';
import MobileNavigation from '../mobile/MobileNavigation';

// Main Engagement Hub Component
export const EngagementHub = ({ 
  user = {},
  isVisible = false,
  onClose = () => {},
  children
}) => {
  const [activeTab, setActiveTab] = useState('achievements');
  const [notifications, setNotifications] = useState([]);
  const [userStats, setUserStats] = useState({
    level: 1,
    xp: 0,
    achievements: [],
    streaks: { daily: 0, weekly: 0 },
    friends: [],
    recentActivity: []
  });

  const tabs = [
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'social', label: 'Social', icon: Users },
    { id: 'challenges', label: 'Challenges', icon: Zap },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  // Sample achievement data
  const sampleAchievements = [
    {
      id: 'first_match',
      name: 'First Match',
      description: 'Watch your first match',
      type: 'first_win',
      gradient: 'from-blue-500 to-blue-700',
      progress: 100,
      unlocked: true,
      unlockedAt: new Date().toISOString()
    },
    {
      id: 'social_butterfly',
      name: 'Social Butterfly',
      description: 'Make 10 friends',
      type: 'social_butterfly',
      gradient: 'from-pink-500 to-pink-700',
      progress: 60,
      unlocked: false
    },
    {
      id: 'prediction_master',
      name: 'Prediction Master',
      description: 'Get 5 predictions correct',
      type: 'prediction_master',
      gradient: 'from-green-500 to-green-700',
      progress: 80,
      unlocked: false
    }
  ];

  // Sample daily challenges
  const sampleChallenges = [
    {
      id: 'daily_watch',
      title: 'Daily Viewer',
      description: 'Watch 1 match today',
      type: 'watch',
      progress: 1,
      target: 1,
      reward: { xp: 100, type: 'xp' }
    },
    {
      id: 'daily_predict',
      title: 'Daily Predictor',
      description: 'Make 3 predictions',
      type: 'predict',
      progress: 1,
      target: 3,
      reward: { xp: 150, type: 'xp' }
    }
  ];

  if (!isVisible) return children;

  return (
    <AccessibilityFeatures.AccessibilityProvider>
      <PerformanceAnalytics.PerformanceProvider>
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end md:items-center md:justify-center">
          <div className="bg-white w-full h-[80vh] md:w-[480px] md:h-[600px] rounded-t-xl md:rounded-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar || '/default-avatar.png'}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <h2 className="font-bold text-lg">{user.name || 'Player'}</h2>
                    <div className="flex items-center space-x-2 text-sm opacity-90">
                      <span>Level {userStats.level}</span>
                      <span>•</span>
                      <span>{userStats.xp.toLocaleString()} XP</span>
                    </div>
                  </div>
                </div>
                
                <button
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg"
                  onClick={onClose}
                >
                  <Eye size={20} />
                </button>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`
                    flex-1 flex items-center justify-center space-x-1 py-3
                    transition-colors duration-200
                    ${activeTab === tab.id 
                      ? 'text-red-600 border-b-2 border-red-600 bg-red-50' 
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }
                  `}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon size={16} />
                  <span className="text-sm font-medium hidden sm:block">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'achievements' && (
                <AchievementsTab 
                  achievements={sampleAchievements}
                  userStats={userStats}
                />
              )}
              
              {activeTab === 'social' && (
                <SocialTab 
                  user={user}
                  friends={userStats.friends}
                />
              )}
              
              {activeTab === 'challenges' && (
                <ChallengesTab 
                  challenges={sampleChallenges}
                  userStats={userStats}
                />
              )}
              
              {activeTab === 'settings' && (
                <SettingsTab />
              )}
            </div>
          </div>
        </div>
        
        {/* Performance Metrics (Dev Mode) */}
        <PerformanceAnalytics.PerformanceMetrics 
          isVisible={process.env.NODE_ENV === 'development'} 
        />
      </PerformanceAnalytics.PerformanceProvider>
    </AccessibilityFeatures.AccessibilityProvider>
  );
};

// Achievements Tab Component
const AchievementsTab = ({ achievements, userStats }) => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  return (
    <div className="space-y-4">
      {/* XP Progress */}
      <GamificationMechanics.XPSystem
        currentXP={userStats.xp}
        currentLevel={userStats.level}
        onLevelUp={(newLevel) => {
          console.log('Level up!', newLevel);
        }}
      />

      {/* Streak Display */}
      <InteractiveAchievementSystem.StreakDisplay
        currentStreak={userStats.streaks.daily}
        maxStreak={15}
        type="daily"
      />

      {/* Achievement Grid */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Achievements</h3>
        <div className="grid grid-cols-3 gap-4">
          {achievements.map(achievement => (
            <InteractiveAchievementSystem.AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size="medium"
              unlocked={achievement.unlocked}
              progress={achievement.progress}
              onClick={(ach) => setSelectedAchievement(ach)}
            />
          ))}
        </div>
      </div>

      {/* Achievement Showcase Modal */}
      <InteractiveAchievementSystem.AchievementShowcase
        achievement={selectedAchievement}
        isOpen={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
        onShare={(achievement) => {
          console.log('Share achievement:', achievement);
        }}
      />
    </div>
  );
};

// Social Tab Component
const SocialTab = ({ user, friends }) => {
  const [friendRequests, setFriendRequests] = useState([]);
  const [leaderboardData] = useState([
    { id: '1', name: 'Player 1', avatar: '/avatar1.jpg', value: 2500, trend: 150 },
    { id: '2', name: 'Player 2', avatar: '/avatar2.jpg', value: 2200, trend: 75 },
    { id: '3', name: user.name, avatar: user.avatar, value: 1800, trend: -50 }
  ]);

  const handleFriendAction = async (userId, action) => {
    // Mock friend action
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ success: true, newStatus: action === 'add' ? 'pending_sent' : 'friends' });
      }, 500);
    });
  };

  return (
    <div className="space-y-4">
      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-900 mb-3">Friend Requests</h3>
          <div className="space-y-2">
            {friendRequests.map(friend => (
              <SocialEngagementFeatures.FriendSystem
                key={friend.id}
                user={friend}
                currentUserId={user.id}
                onFriendAction={handleFriendAction}
              />
            ))}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <SocialEngagementFeatures.SocialLeaderboard
        leaderboardData={leaderboardData}
        currentUserId={user.id}
        type="points"
        onUserTap={(user, index) => {
          console.log('User tapped:', user, index);
        }}
      />

      {/* Quick Reactions Demo */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Quick Reactions</h3>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Try the reaction system!</p>
          <SocialEngagementFeatures.QuickReactionSystem
            contentId="demo"
            initialReactions={{ like: 5, fire: 3, poggers: 1 }}
            onReact={(contentId, reaction) => {
              console.log('Reacted:', contentId, reaction);
            }}
          />
        </div>
      </div>
    </div>
  );
};

// Challenges Tab Component
const ChallengesTab = ({ challenges, userStats }) => {
  const handleCompleteChallenge = (challengeId) => {
    console.log('Challenge completed:', challengeId);
  };

  return (
    <div className="space-y-4">
      {/* Daily Challenges */}
      <GamificationMechanics.DailyChallenges
        challenges={challenges}
        onCompleteChallenge={handleCompleteChallenge}
        onClaimReward={(challengeId) => {
          console.log('Claim reward:', challengeId);
        }}
      />

      {/* Community Challenge Example */}
      <SocialEngagementFeatures.CommunityChallenge
        challenge={{
          id: 'community_1',
          title: 'Community Watch Party',
          description: 'Watch 10,000 matches together as a community',
          target: 10000,
          userTarget: 5,
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          rewards: ['500 XP', 'Exclusive Badge', 'Community Avatar']
        }}
        userProgress={2}
        communityProgress={7500}
        onParticipate={(challengeId) => {
          console.log('Participate in challenge:', challengeId);
        }}
        onShare={(challenge) => {
          console.log('Share challenge:', challenge);
        }}
      />
    </div>
  );
};

// Settings Tab Component
const SettingsTab = () => {
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Engagement Settings</h3>
        <div className="space-y-3">
          <button
            className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg"
            onClick={() => setShowAccessibilitySettings(true)}
          >
            <div className="flex items-center space-x-2">
              <Eye size={16} />
              <span className="text-sm font-medium">Accessibility Options</span>
            </div>
            <span className="text-xs text-gray-500">Configure for better experience</span>
          </button>

          <div className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Bell size={16} />
              <span className="text-sm font-medium">Notifications</span>
            </div>
            <AccessibilityFeatures.AccessibilityToggle
              checked={true}
              onChange={(checked) => console.log('Notifications:', checked)}
            />
          </div>

          <div className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Zap size={16} />
              <span className="text-sm font-medium">Haptic Feedback</span>
            </div>
            <AccessibilityFeatures.AccessibilityToggle
              checked={true}
              onChange={(checked) => console.log('Haptic feedback:', checked)}
            />
          </div>
        </div>
      </div>

      {/* Accessibility Settings Modal */}
      <AccessibilityFeatures.AccessibilitySettings
        isOpen={showAccessibilitySettings}
        onClose={() => setShowAccessibilitySettings(false)}
      />
    </div>
  );
};

// Enhanced Mobile Card with Engagement Features
export const EngagementEnhancedCard = ({ 
  children,
  contentId,
  enableReactions = true,
  enableSharing = true,
  shareContent = {},
  onInteraction = () => {},
  ...props 
}) => {
  const [showEngagementBar, setShowEngagementBar] = useState(false);
  const cardRef = useRef(null);

  // Gesture handlers
  const gestureCallbacks = {
    onQuickLike: () => {
      console.log('Quick like!');
      onInteraction('quick_like', contentId);
    },
    onLove: () => {
      console.log('Love reaction!');
      onInteraction('love', contentId);
    },
    onFire: () => {
      console.log('Fire reaction!');
      onInteraction('fire', contentId);
    },
    onPoggers: () => {
      console.log('Poggers reaction!');
      onInteraction('poggers', contentId);
    }
  };

  const { elementRef, gestureState, handlers } = AdvancedGestureSystem.useEsportsGestures(gestureCallbacks);

  return (
    <div 
      ref={elementRef}
      className="relative group"
      {...handlers}
      {...props}
    >
      {/* Main Card Content */}
      <AccessibilityFeatures.AccessibleCard
        ref={cardRef}
        onLongPress={() => setShowEngagementBar(true)}
      >
        {children}
      </AccessibilityFeatures.AccessibleCard>

      {/* Engagement Bar */}
      {(showEngagementBar || gestureState.type) && (
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t shadow-lg rounded-b-lg">
          <div className="p-2">
            {enableReactions && (
              <SocialEngagementFeatures.QuickReactionSystem
                contentId={contentId}
                onReact={(id, reaction) => {
                  onInteraction('reaction', { contentId: id, reaction });
                  setShowEngagementBar(false);
                }}
                showCounts={false}
              />
            )}
            
            {enableSharing && (
              <div className="mt-2 flex justify-center">
                <SocialEngagementFeatures.QuickShareSystem
                  content={shareContent.content}
                  title={shareContent.title}
                  url={shareContent.url}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Gesture Feedback */}
      {gestureState.type && (
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
          {gestureState.type.replace('_', ' ').toUpperCase()}
        </div>
      )}
    </div>
  );
};

// Integration with existing components
export const withEngagementFeatures = (WrappedComponent) => {
  return React.forwardRef((props, ref) => {
    const [engagementEnabled, setEngagementEnabled] = useState(true);
    
    return (
      <PerformanceAnalytics.PerformanceProvider>
        <AccessibilityFeatures.AccessibilityProvider>
          <div className="engagement-enhanced">
            <WrappedComponent 
              ref={ref} 
              {...props} 
              engagementEnabled={engagementEnabled}
            />
          </div>
        </AccessibilityFeatures.AccessibilityProvider>
      </PerformanceAnalytics.PerformanceProvider>
    );
  });
};

export default {
  EngagementHub,
  EngagementEnhancedCard,
  withEngagementFeatures,
  AchievementsTab,
  SocialTab,
  ChallengesTab,
  SettingsTab
};