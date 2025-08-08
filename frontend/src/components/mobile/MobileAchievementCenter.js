import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Star, Medal, Crown, Shield, Target, Flame, Zap,
  Gift, Award, CheckCircle, Lock, ChevronRight, Share2,
  Calendar, TrendingUp, Users, MessageSquare, X, Copy,
  Download, Instagram, Twitter, Facebook, Heart, Gamepad2
} from 'lucide-react';
import { useAuth } from '../../hooks';
import HeroImage from '../shared/HeroImage';

// Mobile Achievement Center with Visual Rewards
function MobileAchievementCenter({ isOpen, onClose, navigateTo }) {
  const { user, api } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [userStats, setUserStats] = useState({
    total_achievements: 0,
    total_xp_earned: 0,
    completion_percentage: 0,
    rare_achievements: 0
  });

  // Achievement categories with icons and colors
  const achievementCategories = {
    all: { icon: Trophy, label: 'All', color: 'gray' },
    social: { icon: Users, label: 'Social', color: 'blue' },
    competitive: { icon: Target, label: 'Competitive', color: 'red' },
    community: { icon: Heart, label: 'Community', color: 'pink' },
    milestone: { icon: Star, label: 'Milestones', color: 'yellow' },
    special: { icon: Crown, label: 'Special', color: 'purple' },
    daily: { icon: Calendar, label: 'Daily', color: 'green' }
  };

  // Fetch achievements data
  const fetchAchievements = useCallback(async () => {
    try {
      setLoading(true);
      
      const [achievementsRes, statsRes] = await Promise.allSettled([
        api.get('/user/achievements'),
        api.get('/user/achievements/stats')
      ]);

      if (achievementsRes.status === 'fulfilled') {
        const data = achievementsRes.value.data;
        setAchievements(data?.achievements || mockAchievements);
        setCategories(data?.categories || Object.keys(achievementCategories));
      } else {
        // Mock data for demo
        setAchievements(mockAchievements);
        setCategories(Object.keys(achievementCategories));
      }

      if (statsRes.status === 'fulfilled') {
        setUserStats(statsRes.value.data?.stats || userStats);
      }

    } catch (error) {
      console.error('Error fetching achievements:', error);
      setAchievements(mockAchievements);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (isOpen) {
      fetchAchievements();
    }
  }, [isOpen, fetchAchievements]);

  // Mock achievements for demo
  const mockAchievements = [
    {
      id: 1,
      name: 'First Comment',
      description: 'Post your first comment on any match or news article',
      category: 'milestone',
      icon: MessageSquare,
      rarity: 'common',
      xp_reward: 50,
      unlocked: true,
      unlocked_at: '2024-01-15T10:30:00Z',
      progress: { current: 1, target: 1 }
    },
    {
      id: 2,
      name: 'Social Butterfly',
      description: 'Follow 10 different users',
      category: 'social',
      icon: Users,
      rarity: 'uncommon',
      xp_reward: 100,
      unlocked: true,
      unlocked_at: '2024-01-20T15:45:00Z',
      progress: { current: 10, target: 10 }
    },
    {
      id: 3,
      name: 'Tournament Expert',
      description: 'Correctly predict 5 tournament match outcomes',
      category: 'competitive',
      icon: Target,
      rarity: 'rare',
      xp_reward: 200,
      unlocked: false,
      progress: { current: 2, target: 5 }
    },
    {
      id: 4,
      name: 'Daily Warrior',
      description: 'Complete daily challenges for 7 consecutive days',
      category: 'daily',
      icon: Flame,
      rarity: 'epic',
      xp_reward: 500,
      unlocked: false,
      progress: { current: 3, target: 7 }
    },
    {
      id: 5,
      name: 'Community Legend',
      description: 'Receive 100 upvotes on your forum posts',
      category: 'community',
      icon: Crown,
      rarity: 'legendary',
      xp_reward: 1000,
      unlocked: false,
      progress: { current: 45, target: 100 }
    },
    {
      id: 6,
      name: 'Beta Tester',
      description: 'Participated in the platform beta testing',
      category: 'special',
      icon: Shield,
      rarity: 'special',
      xp_reward: 300,
      unlocked: true,
      unlocked_at: '2024-01-01T00:00:00Z',
      progress: { current: 1, target: 1 }
    }
  ];

  // Get rarity color and styling
  const getRarityStyles = (rarity) => {
    const styles = {
      common: {
        bg: 'bg-gray-100 dark:bg-gray-700',
        text: 'text-gray-600 dark:text-gray-300',
        border: 'border-gray-300 dark:border-gray-600',
        glow: 'shadow-gray-200 dark:shadow-gray-800'
      },
      uncommon: {
        bg: 'bg-green-100 dark:bg-green-900/20',
        text: 'text-green-600 dark:text-green-400',
        border: 'border-green-300 dark:border-green-600',
        glow: 'shadow-green-200 dark:shadow-green-800'
      },
      rare: {
        bg: 'bg-blue-100 dark:bg-blue-900/20',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-600',
        glow: 'shadow-blue-200 dark:shadow-blue-800'
      },
      epic: {
        bg: 'bg-purple-100 dark:bg-purple-900/20',
        text: 'text-purple-600 dark:text-purple-400',
        border: 'border-purple-300 dark:border-purple-600',
        glow: 'shadow-purple-200 dark:shadow-purple-800'
      },
      legendary: {
        bg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20',
        text: 'text-yellow-600 dark:text-yellow-400',
        border: 'border-yellow-300 dark:border-yellow-600',
        glow: 'shadow-yellow-200 dark:shadow-yellow-800'
      },
      special: {
        bg: 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20',
        text: 'text-pink-600 dark:text-pink-400',
        border: 'border-pink-300 dark:border-pink-600',
        glow: 'shadow-pink-200 dark:shadow-pink-800'
      }
    };
    return styles[rarity] || styles.common;
  };

  // Filter achievements by category
  const filteredAchievements = achievements.filter(achievement => 
    selectedCategory === 'all' || achievement.category === selectedCategory
  );

  // Group achievements by unlocked status
  const unlockedAchievements = filteredAchievements.filter(a => a.unlocked);
  const lockedAchievements = filteredAchievements.filter(a => !a.unlocked);

  // Share achievement
  const handleShareAchievement = async (achievement, platform) => {
    const shareText = `I just unlocked the "${achievement.name}" achievement on MRVL Esports! 🏆`;
    const shareUrl = `${window.location.origin}/achievements/${achievement.id}`;

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: achievement.name,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (error) {
        console.log('Native share failed:', error);
      }
    }

    if (platform === 'copy' || !platform) {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        showToast('Achievement shared to clipboard!', 'success');
      } catch (error) {
        showToast('Failed to copy to clipboard', 'error');
      }
      setShowShareModal(false);
      return;
    }

    // Social media sharing
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      instagram: shareUrl
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }

    setShowShareModal(false);
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex">
      <div className="bg-white dark:bg-gray-900 w-full h-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{unlockedAchievements.length}</div>
              <div className="text-white/80 text-sm">Unlocked</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{userStats.total_xp_earned}</div>
              <div className="text-white/80 text-sm">Total XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Math.round((unlockedAchievements.length / achievements.length) * 100) || 0}%
              </div>
              <div className="text-white/80 text-sm">Complete</div>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
            {Object.entries(achievementCategories).map(([key, category]) => {
              const Icon = category.icon;
              const isActive = selectedCategory === key;
              const count = key === 'all' 
                ? achievements.length 
                : achievements.filter(a => a.category === key).length;
              
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Achievement List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Unlocked Achievements */}
              {unlockedAchievements.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Unlocked ({unlockedAchievements.length})
                  </h2>
                  <div className="space-y-3">
                    {unlockedAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        unlocked={true}
                        onShare={() => {
                          setSelectedAchievement(achievement);
                          setShowShareModal(true);
                        }}
                        onClick={() => {
                          // Show achievement detail modal
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Locked Achievements */}
              {lockedAchievements.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Lock className="w-5 h-5 mr-2 text-gray-400" />
                    In Progress ({lockedAchievements.length})
                  </h2>
                  <div className="space-y-3">
                    {lockedAchievements.map((achievement) => (
                      <AchievementCard
                        key={achievement.id}
                        achievement={achievement}
                        unlocked={false}
                        onClick={() => {
                          // Show achievement detail modal with progress
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {filteredAchievements.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-500 mb-2">No achievements found</h3>
                  <p className="text-gray-400">Try a different category or start participating to unlock achievements!</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Share Modal */}
        {showShareModal && selectedAchievement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
            <div className="bg-white dark:bg-gray-800 rounded-t-xl p-6 w-full animate-slide-up">
              <div className="text-center mb-6">
                <h3 className="font-bold text-lg mb-2">Share Achievement</h3>
                <div className="flex items-center justify-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">{selectedAchievement.name}</div>
                    <div className="text-sm text-gray-500">+{selectedAchievement.xp_reward} XP</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <button
                  onClick={() => handleShareAchievement(selectedAchievement, 'copy')}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Copy className="w-6 h-6 mb-2" />
                  <span className="text-xs">Copy</span>
                </button>
                
                <button
                  onClick={() => handleShareAchievement(selectedAchievement, 'twitter')}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Twitter className="w-6 h-6 mb-2 text-blue-400" />
                  <span className="text-xs">Twitter</span>
                </button>
                
                <button
                  onClick={() => handleShareAchievement(selectedAchievement, 'facebook')}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Facebook className="w-6 h-6 mb-2 text-blue-600" />
                  <span className="text-xs">Facebook</span>
                </button>
                
                <button
                  onClick={() => handleShareAchievement(selectedAchievement, 'native')}
                  className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <Share2 className="w-6 h-6 mb-2" />
                  <span className="text-xs">More</span>
                </button>
              </div>
              
              <button
                onClick={() => setShowShareModal(false)}
                className="w-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Achievement Card Component
function AchievementCard({ achievement, unlocked, onShare, onClick }) {
  const Icon = achievement.icon || Trophy;
  const rarityStyles = getRarityStyles(achievement.rarity);
  const progressPercentage = achievement.progress 
    ? (achievement.progress.current / achievement.progress.target) * 100 
    : 0;

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        unlocked 
          ? `${rarityStyles.bg} ${rarityStyles.border} shadow-lg ${rarityStyles.glow}` 
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-75'
      } hover:scale-105 active:scale-95`}
    >
      {/* Achievement Icon and Info */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            unlocked ? rarityStyles.bg : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            {unlocked ? (
              <Icon className={`w-6 h-6 ${rarityStyles.text}`} />
            ) : (
              <Lock className="w-6 h-6 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className={`font-semibold ${
              unlocked ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {achievement.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {achievement.description}
            </p>
          </div>
        </div>

        {/* XP Reward */}
        <div className={`text-right ${unlocked ? rarityStyles.text : 'text-gray-400'}`}>
          <div className="font-bold text-lg">+{achievement.xp_reward}</div>
          <div className="text-xs opacity-80">XP</div>
        </div>
      </div>

      {/* Progress Bar (for locked achievements) */}
      {!unlocked && achievement.progress && (
        <div className="mb-3">
          <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-1">
            <span>Progress</span>
            <span>{achievement.progress.current}/{achievement.progress.target}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-orange-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Rarity Badge and Actions */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          unlocked ? rarityStyles.bg : 'bg-gray-200 dark:bg-gray-700'
        } ${unlocked ? rarityStyles.text : 'text-gray-500 dark:text-gray-400'}`}>
          {achievement.rarity?.toUpperCase() || 'COMMON'}
        </div>

        <div className="flex items-center space-x-2">
          {unlocked && achievement.unlocked_at && (
            <span className="text-xs text-gray-500">
              {new Date(achievement.unlocked_at).toLocaleDateString()}
            </span>
          )}
          
          {unlocked && onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare();
              }}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <Share2 className={`w-4 h-4 ${rarityStyles.text}`} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function (moved outside component to avoid recreation)
function getRarityStyles(rarity) {
  const styles = {
    common: {
      bg: 'bg-gray-100 dark:bg-gray-700',
      text: 'text-gray-600 dark:text-gray-300',
      border: 'border-gray-300 dark:border-gray-600',
      glow: 'shadow-gray-200 dark:shadow-gray-800'
    },
    uncommon: {
      bg: 'bg-green-100 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      border: 'border-green-300 dark:border-green-600',
      glow: 'shadow-green-200 dark:shadow-green-800'
    },
    rare: {
      bg: 'bg-blue-100 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-300 dark:border-blue-600',
      glow: 'shadow-blue-200 dark:shadow-blue-800'
    },
    epic: {
      bg: 'bg-purple-100 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-300 dark:border-purple-600',
      glow: 'shadow-purple-200 dark:shadow-purple-800'
    },
    legendary: {
      bg: 'bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20',
      text: 'text-yellow-600 dark:text-yellow-400',
      border: 'border-yellow-300 dark:border-yellow-600',
      glow: 'shadow-yellow-200 dark:shadow-yellow-800'
    },
    special: {
      bg: 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/20 dark:to-purple-900/20',
      text: 'text-pink-600 dark:text-pink-400',
      border: 'border-pink-300 dark:border-pink-600',
      glow: 'shadow-pink-200 dark:shadow-pink-800'
    }
  };
  return styles[rarity] || styles.common;
}

export default MobileAchievementCenter;