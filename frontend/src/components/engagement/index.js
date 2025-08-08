// Main exports for the User Engagement Optimization System
export { default as AdvancedGestureSystem } from './AdvancedGestureSystem';
export { default as InteractiveAchievementSystem } from './InteractiveAchievementSystem';
export { default as SocialEngagementFeatures } from './SocialEngagementFeatures';
export { default as GamificationMechanics } from './GamificationMechanics';
export { default as AccessibilityFeatures } from './AccessibilityFeatures';
export { default as PerformanceAnalytics } from './PerformanceAnalytics';
export { default as EngagementSystemIntegration } from './EngagementSystemIntegration';

// Re-export individual components for easy access
export {
  // Advanced Gesture System
  useMomentumScrolling,
  useEsportsGestures,
  usePowerUserGestures,
  useOptimizedTouch
} from './AdvancedGestureSystem';

export {
  // Interactive Achievement System
  AchievementBadge,
  StreakDisplay,
  ProgressIndicator,
  AchievementShowcase,
  TouchRevealCard
} from './InteractiveAchievementSystem';

export {
  // Social Engagement Features
  QuickReactionSystem,
  QuickShareSystem,
  FriendSystem,
  SocialLeaderboard,
  CommunityChallenge
} from './SocialEngagementFeatures';

export {
  // Gamification Mechanics
  XPSystem,
  DailyChallenges,
  LoadingMiniGame,
  CollectorCard,
  BattlePassTier
} from './GamificationMechanics';

export {
  // Accessibility Features
  AccessibilityProvider,
  AccessibilitySettings,
  AccessibilityToggle,
  AccessibilitySlider,
  VoiceInput,
  ScreenReaderContent,
  FocusManager,
  HighContrastButton,
  AccessibleCard,
  AccessibilityContext
} from './AccessibilityFeatures';

export {
  // Performance Analytics
  PerformanceProvider,
  PerformanceMetrics,
  InteractionHeatmap,
  ABTestProvider,
  useOptimizedTouchHandler,
  useBatteryOptimization,
  PerformanceContext
} from './PerformanceAnalytics';

export {
  // Integration Components
  EngagementHub,
  EngagementEnhancedCard,
  withEngagementFeatures
} from './EngagementSystemIntegration';

// Enhanced Mobile Gestures (from existing mobile components)
export { hapticFeedback } from '../mobile/MobileGestures';

// Utility functions and constants
export const ENGAGEMENT_EVENTS = {
  ACHIEVEMENT_UNLOCK: 'achievement_unlock',
  LEVEL_UP: 'level_up',
  STREAK_MILESTONE: 'streak_milestone',
  SOCIAL_INTERACTION: 'social_interaction',
  CHALLENGE_COMPLETE: 'challenge_complete',
  REACTION_GIVEN: 'reaction_given',
  FRIEND_ADDED: 'friend_added',
  CONTENT_SHARED: 'content_shared',
  VOICE_COMMAND: 'voice_command',
  GESTURE_PERFORMED: 'gesture_performed'
};

export const ACHIEVEMENT_TYPES = {
  FIRST_WIN: 'first_win',
  WIN_STREAK: 'win_streak',
  SOCIAL_BUTTERFLY: 'social_butterfly',
  DAILY_VISITOR: 'daily_visitor',
  SPEED_DEMON: 'speed_demon',
  TRENDING_STAR: 'trending_star',
  COMMUNITY_LOVE: 'community_love',
  PREDICTION_MASTER: 'prediction_master',
  ESPORTS_EXPERT: 'esports_expert',
  COLLECTOR: 'collector',
  POWER_USER: 'power_user'
};

export const REACTION_TYPES = {
  LIKE: 'like',
  LOVE: 'love',
  FIRE: 'fire',
  POGGERS: 'poggers',
  TARGET: 'target'
};

export const HAPTIC_PATTERNS = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  ERROR: 'error',
  NOTIFICATION: 'notification',
  ACHIEVEMENT: 'achievement',
  LEVEL_UP: 'levelUp',
  STREAK: 'streak',
  REACTION: 'reaction',
  UNLOCK: 'unlock',
  CARD_FLIP: 'cardFlip',
  SWIPE_ACTION: 'swipeAction',
  POWER_USER: 'powerUser',
  CHALLENGE: 'challenge'
};

// Configuration presets for different engagement levels
export const ENGAGEMENT_PRESETS = {
  CASUAL: {
    hapticEnabled: true,
    animationsEnabled: true,
    particleEffects: false,
    voiceInput: false,
    advancedGestures: false,
    socialFeatures: true,
    achievements: true,
    challenges: false
  },
  ENTHUSIAST: {
    hapticEnabled: true,
    animationsEnabled: true,
    particleEffects: true,
    voiceInput: true,
    advancedGestures: true,
    socialFeatures: true,
    achievements: true,
    challenges: true
  },
  COMPETITIVE: {
    hapticEnabled: true,
    animationsEnabled: true,
    particleEffects: true,
    voiceInput: true,
    advancedGestures: true,
    socialFeatures: true,
    achievements: true,
    challenges: true,
    powerUserFeatures: true,
    performanceTracking: true
  },
  ACCESSIBILITY_FOCUSED: {
    hapticEnabled: true,
    animationsEnabled: false,
    particleEffects: false,
    voiceInput: true,
    advancedGestures: false,
    socialFeatures: true,
    achievements: true,
    challenges: false,
    highContrast: true,
    largeText: true,
    screenReaderOptimized: true
  }
};

// Hook for easy engagement system setup
export const useEngagementSystem = (preset = 'CASUAL', customConfig = {}) => {
  const baseConfig = ENGAGEMENT_PRESETS[preset] || ENGAGEMENT_PRESETS.CASUAL;
  const config = { ...baseConfig, ...customConfig };
  
  return {
    config,
    isEnabled: (feature) => config[feature] === true,
    getFeatureConfig: (feature, defaultValue = {}) => 
      typeof config[feature] === 'object' ? config[feature] : defaultValue
  };
};