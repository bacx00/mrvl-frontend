import React, { useState, useEffect, useCallback } from 'react';
import {
  Target, Flame, Star, Calendar, Clock, Check, Trophy, Gift,
  Zap, Coins, Heart, MessageSquare, Users, TrendingUp, X,
  ChevronRight, RefreshCw, Award, Crown, Shield, Gamepad2
} from 'lucide-react';
import { useAuth } from '../../hooks';

// Mobile Challenge Center with Daily Goals and Streaks
function MobileChallengeCenter({ isOpen, onClose, navigateTo }) {
  const { user, api } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');
  const [userProgress, setUserProgress] = useState({
    daily_streak: 0,
    weekly_score: 0,
    monthly_rank: 0,
    total_challenges: 0,
    xp_earned: 0
  });

  // Challenge categories
  const challengeTypes = {
    daily: { icon: Calendar, label: 'Daily', color: 'blue' },
    weekly: { icon: Target, label: 'Weekly', color: 'purple' },
    special: { icon: Crown, label: 'Special', color: 'yellow' },
    community: { icon: Users, label: 'Community', color: 'green' }
  };

  // Mock challenges for demo
  const mockChallenges = {
    daily: [
      {
        id: 1,
        type: 'daily',
        title: 'Comment Streak',
        description: 'Post 3 comments on matches or news',
        icon: MessageSquare,
        progress: 1,
        target: 3,
        xp_reward: 100,
        coin_reward: 50,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        difficulty: 'easy'
      },
      {
        id: 2,
        type: 'daily',
        title: 'Social Butterfly',
        description: 'Follow 2 new users',
        icon: Users,
        progress: 0,
        target: 2,
        xp_reward: 75,
        coin_reward: 25,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        difficulty: 'easy'
      },
      {
        id: 3,
        type: 'daily',
        title: 'Prediction Master',
        description: 'Make predictions for upcoming matches',
        icon: Target,
        progress: 2,
        target: 2,
        xp_reward: 150,
        coin_reward: 75,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        completed: true,
        difficulty: 'medium'
      }
    ],
    weekly: [
      {
        id: 4,
        type: 'weekly',
        title: 'Forum Champion',
        description: 'Create 5 forum posts with positive engagement',
        icon: Trophy,
        progress: 2,
        target: 5,
        xp_reward: 500,
        coin_reward: 200,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        difficulty: 'hard'
      },
      {
        id: 5,
        type: 'weekly',
        title: 'Team Spirit',
        description: 'Support your favorite teams by engaging with their content',
        icon: Heart,
        progress: 15,
        target: 20,
        xp_reward: 300,
        coin_reward: 150,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        difficulty: 'medium'
      }
    ],
    special: [
      {
        id: 6,
        type: 'special',
        title: 'Tournament Predictor',
        description: 'Correctly predict 10 match outcomes during the championship',
        icon: Crown,
        progress: 4,
        target: 10,
        xp_reward: 1000,
        coin_reward: 500,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        difficulty: 'legendary'
      }
    ],
    community: [
      {
        id: 7,
        type: 'community',
        title: 'Helping Hand',
        description: 'Help new users by answering questions in the forums',
        icon: Shield,
        progress: 1,
        target: 5,
        xp_reward: 250,
        coin_reward: 100,
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        completed: false,
        difficulty: 'medium'
      }
    ]
  };

  // Fetch challenges and user progress
  const fetchChallenges = useCallback(async () => {
    try {
      setLoading(true);
      
      const [challengesRes, progressRes] = await Promise.allSettled([
        api.get('/user/challenges'),
        api.get('/user/progress')
      ]);

      if (challengesRes.status === 'fulfilled') {
        const data = challengesRes.value.data;
        setChallenges(data?.challenges || mockChallenges);
        setDailyStreak(data?.daily_streak || 3);
      } else {
        // Use mock data
        setChallenges(mockChallenges);
        setDailyStreak(3);
      }

      if (progressRes.status === 'fulfilled') {
        setUserProgress(progressRes.value.data?.progress || userProgress);
      }

    } catch (error) {
      console.error('Error fetching challenges:', error);
      setChallenges(mockChallenges);
      setDailyStreak(3);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isOpen) {
      fetchChallenges();
    }
  }, [isOpen, fetchChallenges]);

  // Claim reward for completed challenge
  const claimReward = async (challengeId) => {
    try {
      const response = await api.post(`/user/challenges/${challengeId}/claim`);
      
      if (response.data?.success) {
        // Update challenges list
        setChallenges(prev => ({
          ...prev,
          [activeTab]: prev[activeTab].map(challenge => 
            challenge.id === challengeId 
              ? { ...challenge, claimed: true }
              : challenge
          )
        }));
        
        // Show reward toast
        const challenge = challenges[activeTab]?.find(c => c.id === challengeId);
        if (challenge) {
          showToast(
            `Claimed: +${challenge.xp_reward} XP, +${challenge.coin_reward} coins!`, 
            'success'
          );
        }
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      showToast('Failed to claim reward', 'error');
    }
  };

  // Refresh challenges
  const refreshChallenges = async () => {
    setRefreshing(true);
    await fetchChallenges();
    setRefreshing(false);
    showToast('Challenges refreshed!', 'success');
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    const colors = {
      easy: 'text-green-500',
      medium: 'text-yellow-500',
      hard: 'text-red-500',
      legendary: 'text-purple-500'
    };
    return colors[difficulty] || colors.easy;
  };

  // Get difficulty background
  const getDifficultyBg = (difficulty) => {
    const backgrounds = {
      easy: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      medium: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
      hard: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      legendary: 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
    };
    return backgrounds[difficulty] || backgrounds.easy;
  };

  // Time formatting
  const formatTimeRemaining = (expiresAt) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d remaining`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    
    return `${minutes}m remaining`;
  };

  // Toast helper
  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-y-full transition-transform duration-300 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    } text-white font-medium`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
    }, 100);
    
    setTimeout(() => {
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  if (!isOpen) return null;

  const currentChallenges = challenges[activeTab] || [];
  const completedToday = currentChallenges.filter(c => c.completed).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white dark:bg-gray-900 w-full h-full overflow-hidden flex flex-col">
        {/* Header with Streak */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Daily Challenges</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshChallenges}
                disabled={refreshing}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Streak Counter */}
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Flame className="w-8 h-8 text-orange-300" />
                <div>
                  <div className="text-2xl font-bold text-white">{dailyStreak}</div>
                  <div className="text-white/80 text-sm">Day Streak</div>
                </div>
              </div>
              
              <div className="w-px h-12 bg-white/20" />
              
              <div className="text-center">
                <div className="text-lg font-bold text-white">{completedToday}</div>
                <div className="text-white/80 text-sm">Completed Today</div>
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-bold text-white">{userProgress.weekly_score}</div>
              <div className="text-white/80 text-xs">Weekly Score</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white">{userProgress.total_challenges}</div>
              <div className="text-white/80 text-xs">Total Completed</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-white">#{userProgress.monthly_rank || '—'}</div>
              <div className="text-white/80 text-xs">Monthly Rank</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex overflow-x-auto scrollbar-hide">
            {Object.entries(challengeTypes).map(([key, type]) => {
              const Icon = type.icon;
              const isActive = activeTab === key;
              const count = challenges[key]?.length || 0;
              
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{type.label}</span>
                  {count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300' 
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Challenge List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : currentChallenges.length > 0 ? (
            <div className="p-4 space-y-4">
              {currentChallenges.map((challenge) => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onClaimReward={claimReward}
                  onNavigate={navigateTo}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <Target className="w-16 h-16 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No challenges available</h3>
              <p className="text-sm text-center">
                Check back later for new {challengeTypes[activeTab]?.label.toLowerCase()} challenges!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Challenge Card Component
function ChallengeCard({ challenge, onClaimReward, onNavigate }) {
  const Icon = challenge.icon || Target;
  const progressPercentage = (challenge.progress / challenge.target) * 100;
  const isCompleted = challenge.progress >= challenge.target;
  const isExpired = new Date(challenge.expires_at) < new Date();

  const handleCardClick = () => {
    // Navigate to relevant page based on challenge type
    const navigationMap = {
      'Comment Streak': () => onNavigate('matches'),
      'Social Butterfly': () => onNavigate('rankings'),
      'Prediction Master': () => onNavigate('matches'),
      'Forum Champion': () => onNavigate('forums'),
      'Team Spirit': () => onNavigate('teams'),
      'Tournament Predictor': () => onNavigate('events'),
      'Helping Hand': () => onNavigate('forums')
    };
    
    const navigate = navigationMap[challenge.title];
    if (navigate) {
      navigate();
    }
  };

  return (
    <div
      onClick={!isCompleted ? handleCardClick : undefined}
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
        isExpired 
          ? 'opacity-50 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
          : isCompleted
          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
          : `cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${getDifficultyBg(challenge.difficulty)}`
      }`}
    >
      {/* Challenge Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isCompleted
              ? 'bg-green-100 dark:bg-green-900/30'
              : isExpired
              ? 'bg-gray-200 dark:bg-gray-700'
              : getDifficultyBg(challenge.difficulty)
          }`}>
            {isCompleted ? (
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Icon className={`w-6 h-6 ${
                isExpired 
                  ? 'text-gray-400' 
                  : getDifficultyColor(challenge.difficulty)
              }`} />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-semibold ${
              isExpired ? 'text-gray-400' : 'text-gray-900 dark:text-white'
            }`}>
              {challenge.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {challenge.description}
            </p>
          </div>
        </div>

        {/* Difficulty Badge */}
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          isExpired 
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
            : getDifficultyBg(challenge.difficulty) + ' ' + getDifficultyColor(challenge.difficulty)
        }`}>
          {challenge.difficulty?.toUpperCase() || 'EASY'}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className={isExpired ? 'text-gray-400' : 'text-gray-600 dark:text-gray-300'}>
            Progress
          </span>
          <span className={`font-medium ${
            isExpired ? 'text-gray-400' : 'text-gray-900 dark:text-white'
          }`}>
            {Math.min(challenge.progress, challenge.target)}/{challenge.target}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              isExpired
                ? 'bg-gray-400'
                : isCompleted
                ? 'bg-green-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Rewards and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* XP Reward */}
          <div className="flex items-center space-x-1">
            <Zap className={`w-4 h-4 ${
              isExpired ? 'text-gray-400' : 'text-yellow-500'
            }`} />
            <span className={`text-sm font-medium ${
              isExpired ? 'text-gray-400' : 'text-gray-900 dark:text-white'
            }`}>
              +{challenge.xp_reward}
            </span>
          </div>

          {/* Coin Reward */}
          <div className="flex items-center space-x-1">
            <Coins className={`w-4 h-4 ${
              isExpired ? 'text-gray-400' : 'text-yellow-600'
            }`} />
            <span className={`text-sm font-medium ${
              isExpired ? 'text-gray-400' : 'text-gray-900 dark:text-white'
            }`}>
              +{challenge.coin_reward}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Time Remaining */}
          <div className="text-right">
            <div className={`text-xs ${
              isExpired 
                ? 'text-red-500' 
                : 'text-gray-500 dark:text-gray-400'
            }`}>
              <Clock className="w-3 h-3 inline mr-1" />
              {formatTimeRemaining(challenge.expires_at)}
            </div>
          </div>

          {/* Claim Button */}
          {isCompleted && !challenge.claimed && !isExpired && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClaimReward(challenge.id);
              }}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Claim
            </button>
          )}
          
          {challenge.claimed && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Claimed
            </span>
          )}

          {!isCompleted && !isExpired && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function (moved outside component to avoid recreation)
function getDifficultyBg(difficulty) {
  const backgrounds = {
    easy: 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    medium: 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    hard: 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    legendary: 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
  };
  return backgrounds[difficulty] || backgrounds.easy;
}

function getDifficultyColor(difficulty) {
  const colors = {
    easy: 'text-green-500',
    medium: 'text-yellow-500',
    hard: 'text-red-500',
    legendary: 'text-purple-500'
  };
  return colors[difficulty] || colors.easy;
}

function formatTimeRemaining(expiresAt) {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires - now;
  
  if (diff <= 0) return 'Expired';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d remaining`;
  }
  
  if (hours > 0) {
    return `${hours}h ${minutes}m remaining`;
  }
  
  return `${minutes}m remaining`;
}

export default MobileChallengeCenter;