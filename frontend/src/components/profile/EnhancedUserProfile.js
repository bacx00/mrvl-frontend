import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks';
import { useActivityStats } from '../../hooks/useActivityStats';
import { useActivityStatsContext } from '../../contexts/ActivityStatsContext';
import UserAvatar from '../common/UserAvatar';
import { XPSystem, DailyChallenges, CollectorCard } from '../engagement/GamificationMechanics';
import { AchievementBadge, StreakDisplay, ProgressIndicator } from '../engagement/InteractiveAchievementSystem';
import { QuickReactionSystem, SocialLeaderboard } from '../engagement/SocialEngagementFeatures';
import { 
  Trophy, Star, Zap, Target, Crown, Gift, Calendar, TrendingUp, 
  Users, MessageCircle, ThumbsUp, Award, Flame, Heart,
  ArrowUp, ArrowDown, AtSign, Activity, Clock, CheckCircle,
  Medal, Sparkles, User, BarChart3 
} from 'lucide-react';

// Enhanced User Profile with Gamification
function EnhancedUserProfile({ userId = null }) {
  const { user: currentUser, api } = useAuth();
  const { triggerStatsUpdate } = useActivityStatsContext();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [achievements, setAchievements] = useState([]);
  const [streaks, setStreaks] = useState({});
  const [dailyChallenges, setDailyChallenges] = useState([]);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [collectionCards, setCollectionCards] = useState([]);
  const [socialStats, setSocialStats] = useState({});
  const [engagementScore, setEngagementScore] = useState(0);
  const [milestones, setMilestones] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;
  
  // Use the enhanced activity stats hook
  const { stats, triggerUpdate } = useActivityStats(targetUserId, {
    enableRealTimeUpdates: true,
    enableActivityTriggers: true,
    updateInterval: 30000
  });

  // Calculate engagement score based on various metrics
  const calculateEngagementScore = useCallback((userStats) => {
    if (!userStats) return 0;
    
    const weights = {
      forum_threads: 15,
      forum_posts: 10,
      total_comments: 8,
      upvotes_received: 5,
      mentions_received: 12,
      days_active: 3,
      activity_score: 2
    };
    
    let score = 0;
    Object.entries(weights).forEach(([key, weight]) => {
      score += (userStats[key] || 0) * weight;
    });
    
    // Bonus multipliers
    if (userStats.days_active > 30) score *= 1.2;
    if (userStats.reputation_score > 100) score *= 1.15;
    if (userStats.total_comments > 100) score *= 1.1;
    
    return Math.floor(score);
  }, []);

  // Calculate user level from XP/engagement score
  const calculateUserLevel = useCallback((score) => {
    return Math.floor(Math.sqrt(score / 100)) + 1;
  }, []);

  // Generate achievements based on user stats
  const generateAchievements = useCallback((userStats) => {
    const achievementList = [];
    
    // Forum achievements
    if (userStats.forum_threads >= 1) {
      achievementList.push({
        id: 'first_thread',
        name: 'Thread Starter',
        description: 'Created your first forum thread',
        icon: '📝',
        rarity: 'common',
        unlocked: true,
        unlockedAt: new Date().toISOString()
      });
    }
    
    if (userStats.forum_threads >= 10) {
      achievementList.push({
        id: 'thread_master',
        name: 'Discussion Leader',
        description: 'Created 10 forum threads',
        icon: '💬',
        rarity: 'rare',
        unlocked: true,
        unlockedAt: new Date().toISOString()
      });
    }
    
    // Comment achievements
    if (userStats.total_comments >= 10) {
      achievementList.push({
        id: 'commenter',
        name: 'Voice in the Crowd',
        description: 'Made 10 comments',
        icon: '🗨️',
        rarity: 'common',
        unlocked: true
      });
    }
    
    if (userStats.total_comments >= 100) {
      achievementList.push({
        id: 'super_commenter',
        name: 'Community Contributor',
        description: 'Made 100 comments',
        icon: '💭',
        rarity: 'epic',
        unlocked: true
      });
    }
    
    // Social achievements
    if (userStats.upvotes_received >= 50) {
      achievementList.push({
        id: 'liked',
        name: 'Community Favorite',
        description: 'Received 50 upvotes',
        icon: '👍',
        rarity: 'rare',
        unlocked: true
      });
    }
    
    if (userStats.mentions_received >= 10) {
      achievementList.push({
        id: 'popular',
        name: 'Popular Member',
        description: 'Mentioned 10 times',
        icon: '⭐',
        rarity: 'epic',
        unlocked: true
      });
    }
    
    // Streak achievements
    if (userStats.days_active >= 7) {
      achievementList.push({
        id: 'week_streak',
        name: 'Weekly Warrior',
        description: 'Active for 7 days',
        icon: '🔥',
        rarity: 'rare',
        unlocked: true
      });
    }
    
    if (userStats.days_active >= 30) {
      achievementList.push({
        id: 'month_streak',
        name: 'Monthly Master',
        description: 'Active for 30 days',
        icon: '🏆',
        rarity: 'legendary',
        unlocked: true
      });
    }
    
    return achievementList;
  }, []);

  // Generate daily challenges
  const generateDailyChallenges = useCallback(() => {
    const challenges = [
      {
        id: 'daily_comment',
        title: 'Share Your Thoughts',
        description: 'Make 3 comments today',
        type: 'social',
        target: 3,
        progress: Math.min(3, stats.total_comments % 10),
        reward: { xp: 50, coins: 10 }
      },
      {
        id: 'daily_vote',
        title: 'Community Participation',
        description: 'Vote on 5 posts today',
        type: 'watch',
        target: 5,
        progress: Math.min(5, (stats.upvotes_given + stats.downvotes_given) % 10),
        reward: { xp: 30, coins: 5 }
      },
      {
        id: 'daily_thread',
        title: 'Start a Discussion',
        description: 'Create 1 forum thread',
        type: 'predict',
        target: 1,
        progress: stats.forum_threads > 0 ? 1 : 0,
        reward: { xp: 100, coins: 25 }
      }
    ];
    
    return challenges;
  }, [stats]);

  // Fetch all profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!targetUserId) return;
      
      try {
        setLoading(true);
        
        // Fetch basic profile
        const profileResponse = await api.get(`/api/users/${targetUserId}`);
        const profile = profileResponse.data?.data || profileResponse.data;
        setProfileData(profile);
        
        // Calculate derived stats
        const score = calculateEngagementScore(stats);
        const level = calculateUserLevel(score);
        
        setEngagementScore(score);
        setUserXP(score);
        setUserLevel(level);
        
        // Generate achievements
        const userAchievements = generateAchievements(stats);
        setAchievements(userAchievements);
        
        // Generate daily challenges (only for own profile)
        if (isOwnProfile) {
          const challenges = generateDailyChallenges();
          setDailyChallenges(challenges);
        }
        
        // Set streak data
        setStreaks({
          loginStreak: Math.min(stats.days_active || 0, 30),
          commentStreak: Math.min(stats.total_comments || 0, 50),
          voteStreak: Math.min((stats.upvotes_given || 0) + (stats.downvotes_given || 0), 100)
        });
        
        // Mock collection cards (could be fetched from API)
        if (profile.team_flair) {
          setCollectionCards([
            {
              id: 1,
              name: profile.team_flair.name,
              team: profile.team_flair.name,
              rarity: 'rare',
              number: '001',
              image: profile.team_flair.logo,
              stats: {
                wins: 75,
                popularity: 85,
                skill: 80
              }
            }
          ]);
        }
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfileData();
  }, [targetUserId, stats, api, calculateEngagementScore, calculateUserLevel, generateAchievements, generateDailyChallenges, isOwnProfile]);

  // Handle level up
  const handleLevelUp = useCallback((newLevel) => {
    console.log(`🎉 Level up! New level: ${newLevel}`);
    // Could trigger notifications, unlock new features, etc.
    triggerStatsUpdate('level_up');
  }, [triggerStatsUpdate]);

  // Handle challenge completion
  const handleChallengeComplete = useCallback((challengeId) => {
    const challenge = dailyChallenges.find(c => c.id === challengeId);
    if (challenge) {
      setUserXP(prev => prev + challenge.reward.xp);
      // Update challenge as completed
      setDailyChallenges(prev => 
        prev.map(c => c.id === challengeId ? { ...c, completed: true } : c)
      );
      triggerStatsUpdate('challenge_complete');
    }
  }, [dailyChallenges, triggerStatsUpdate]);

  // Tab content components
  const OverviewTab = () => (
    <div className="space-y-6">
      {/* XP and Level System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <XPSystem
          currentXP={userXP}
          currentLevel={userLevel}
          onLevelUp={handleLevelUp}
          animated={true}
        />
        
        {/* Engagement Score */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2">
                <Zap size={24} />
              </div>
              <div>
                <div className="text-sm opacity-80">Engagement Score</div>
                <div className="text-3xl font-bold">{engagementScore.toLocaleString()}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm opacity-80">Rank</div>
              <div className="text-xl font-semibold">#{Math.floor(engagementScore / 100) + 1}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-xl font-bold">{stats.total_comments || 0}</div>
              <div className="text-xs opacity-80">Comments</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.upvotes_received || 0}</div>
              <div className="text-xs opacity-80">Upvotes</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{stats.days_active || 0}</div>
              <div className="text-xs opacity-80">Days Active</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Streaks */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Active Streaks</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StreakDisplay
            title="Login Streak"
            currentStreak={streaks.loginStreak || 0}
            maxStreak={30}
            icon={<Calendar size={20} />}
            color="blue"
          />
          <StreakDisplay
            title="Comment Streak"
            currentStreak={streaks.commentStreak || 0}
            maxStreak={50}
            icon={<MessageCircle size={20} />}
            color="green"
          />
          <StreakDisplay
            title="Vote Streak"
            currentStreak={streaks.voteStreak || 0}
            maxStreak={100}
            icon={<ThumbsUp size={20} />}
            color="purple"
          />
        </div>
      </div>
      
      {/* Activity Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Forum Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl mb-2">📚</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.forum_threads || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Forum Threads</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.forum_posts || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl mb-2">💬</div>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {stats.total_comments || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
          <div className="text-2xl mb-2">⭐</div>
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {stats.reputation_score || 0}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Reputation</div>
        </div>
      </div>
    </div>
  );
  
  const AchievementsTab = () => (
    <div className="space-y-6">
      {/* Achievement Showcase */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Achievements</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {achievements.filter(a => a.unlocked).length} / {achievements.length} Unlocked
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {achievements.map(achievement => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              size="lg"
              showProgress={false}
            />
          ))}
          
          {/* Locked achievements preview */}
          {achievements.length < 20 && (
            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 text-center opacity-50">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-sm font-medium text-gray-600 dark:text-gray-400">More Coming Soon</div>
            </div>
          )}
        </div>
      </div>
      
      {/* Collection Cards */}
      {collectionCards.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Collection</h3>
          <div className="flex flex-wrap gap-4">
            {collectionCards.map(card => (
              <CollectorCard
                key={card.id}
                card={card}
                owned={true}
                interactive={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
  
  const ChallengesTab = () => (
    <div className="space-y-6">
      {isOwnProfile && dailyChallenges.length > 0 && (
        <DailyChallenges
          challenges={dailyChallenges}
          onCompleteChallenge={handleChallengeComplete}
        />
      )}
      
      {/* Weekly Goals */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Weekly Goals</h3>
        <div className="space-y-4">
          <ProgressIndicator
            label="Forum Participation"
            current={stats.forum_posts || 0}
            target={10}
            color="blue"
            showPercentage={true}
          />
          <ProgressIndicator
            label="Community Engagement"
            current={stats.total_comments || 0}
            target={25}
            color="green"
            showPercentage={true}
          />
          <ProgressIndicator
            label="Social Interaction"
            current={(stats.upvotes_given || 0) + (stats.mentions_given || 0)}
            target={50}
            color="purple"
            showPercentage={true}
          />
        </div>
      </div>
    </div>
  );
  
  const SocialTab = () => (
    <div className="space-y-6">
      {/* Social Leaderboard */}
      <SocialLeaderboard
        currentUser={profileData}
        timeframe="week"
      />
      
      {/* Social Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Social Impact</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <ArrowUp className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.upvotes_received || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Upvotes Received</div>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <AtSign className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.mentions_received || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mentions</div>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {Math.floor((stats.upvotes_received || 0) / 10)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Community Love</div>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <TrendingUp className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.floor(engagementScore / 100) + 1}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Community Rank</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          {/* Loading skeleton */}
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const profile = profileData || currentUser;
  const getRoleStyles = (role) => {
    switch(role) {
      case 'admin':
        return { bgColor: 'bg-red-100 dark:bg-red-900/30', textColor: 'text-red-800 dark:text-red-300', badge: 'Admin', icon: '👑' };
      case 'moderator':
        return { bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', textColor: 'text-yellow-800 dark:text-yellow-300', badge: 'Moderator', icon: '🛡️' };
      default:
        return { bgColor: 'bg-blue-100 dark:bg-blue-900/30', textColor: 'text-blue-800 dark:text-blue-300', badge: 'User', icon: '👤' };
    }
  };
  
  const roleStyles = getRoleStyles(profile?.role);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Enhanced Profile Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-black bg-opacity-20 p-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between">
            <div className="flex items-center space-x-6 mb-4 lg:mb-0">
              {/* Enhanced Avatar with Level Badge */}
              <div className="relative">
                <UserAvatar 
                  user={profile} 
                  size="xl"
                  className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
                />
                <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-white shadow-lg">
                  LVL {userLevel}
                </div>
              </div>
              
              {/* User Info */}
              <div className="text-white">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  {profile?.name || 'Unknown User'}
                  <div className={`px-3 py-1 text-sm font-bold rounded-full ${roleStyles.bgColor} ${roleStyles.textColor} border-2 border-white`}>
                    {roleStyles.badge}
                  </div>
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    Joined {stats?.join_date ? new Date(stats.join_date).toLocaleDateString() : 'Recently'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity size={16} />
                    {stats?.days_active || 0} days active
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    Last seen {stats?.last_activity ? new Date(stats.last_activity).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
                
                {profile?.team_flair && (
                  <div className="mt-3 flex items-center gap-2 bg-white bg-opacity-20 rounded-lg px-3 py-2 inline-flex">
                    {profile.team_flair.logo && (
                      <img 
                        src={profile.team_flair.logo} 
                        alt={profile.team_flair.name}
                        className="w-6 h-6 rounded"
                      />
                    )}
                    <span className="font-medium">{profile.team_flair.name} Fan</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {isOwnProfile ? (
                <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all transform hover:scale-105">
                  Edit Profile
                </button>
              ) : (
                <div className="space-y-2">
                  <button className="bg-white text-purple-600 px-6 py-3 rounded-lg font-medium hover:bg-opacity-90 transition-all transform hover:scale-105 w-full">
                    Follow User
                  </button>
                  <button className="bg-transparent border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-purple-600 transition-all">
                    Send Message
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-8 px-8" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'achievements', label: 'Achievements', icon: Trophy },
              { id: 'challenges', label: 'Challenges', icon: Target },
              { id: 'social', label: 'Social', icon: Users }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-6 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon size={18} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'achievements' && <AchievementsTab />}
          {activeTab === 'challenges' && <ChallengesTab />}
          {activeTab === 'social' && <SocialTab />}
        </div>
      </div>
    </div>
  );
}

export default EnhancedUserProfile;