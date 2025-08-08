import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, Edit3, Share2, QrCode, Trophy, Target, Flame, Heart, 
  UserPlus, MessageSquare, Settings, Camera, Star, Award,
  Calendar, TrendingUp, Users, Bell, ChevronRight, Copy,
  Instagram, Twitter, Facebook, Download, Gift, Zap,
  Shield, Crown, Medal, Coins, Gamepad2, Clock
} from 'lucide-react';
import { useAuth } from '../../hooks';
import HeroImage from '../shared/HeroImage';
import QRCodeDisplay from '../shared/QRCodeDisplay';

// Mobile-First User Profile with Engagement Features
function MobileUserProfile({ navigateTo, params, onClose }) {
  const { user, api, updateUser } = useAuth();
  const targetUserId = params?.id;
  const isOwnProfile = !targetUserId || targetUserId === user?.id;
  const [activeTab, setActiveTab] = useState('overview');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showSocialActions, setShowSocialActions] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    avatar: '',
    hero_flair: '',
    bio: '',
    country: 'US',
    level: 1,
    xp: 0,
    nextLevelXp: 1000,
    streak: 0,
    reputation: 0,
    achievements: [],
    stats: {
      matches_watched: 0,
      comments: 0,
      forum_posts: 0,
      upvotes_received: 0,
      days_active: 0
    },
    social: {
      followers: 0,
      following: 0,
      friends: 0,
      is_following: false
    },
    activity: {
      last_seen: null,
      join_date: null,
      recent_achievements: []
    }
  });

  // Engagement data
  const [engagementData, setEngagementData] = useState({
    dailyStreak: 0,
    weeklyGoals: {
      comments: { current: 0, target: 5, completed: false },
      matches: { current: 0, target: 3, completed: false },
      forum_posts: { current: 0, target: 2, completed: false }
    },
    badges: [],
    achievements: [],
    socialScore: 0,
    activityScore: 0
  });

  const [loading, setLoading] = useState(false);
  const shareRef = useRef(null);

  // Fetch user profile data
  const fetchUserProfile = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      if (isOwnProfile && user) {
        // Fetch own profile with engagement data
        const [profileRes, engagementRes, achievementsRes] = await Promise.allSettled([
          api.get('/user/profile'),
          api.get('/user/engagement'),
          api.get('/user/achievements')
        ]);
        
        response = profileRes.value || { data: user };
        
        if (engagementRes.status === 'fulfilled') {
          setEngagementData({
            ...engagementData,
            ...engagementRes.value.data
          });
        }
        
        if (achievementsRes.status === 'fulfilled') {
          setEngagementData(prev => ({
            ...prev,
            achievements: achievementsRes.value.data?.achievements || []
          }));
        }
      } else if (targetUserId) {
        // Fetch other user's profile
        response = await api.get(`/user/profile/display/${targetUserId}`);
      }

      const userData = response.data?.data || response.data || user;
      setProfileData({
        ...profileData,
        ...userData,
        level: userData.level || Math.floor(userData.xp / 1000) + 1,
        xp: userData.xp || 0,
        nextLevelXp: userData.nextLevelXp || ((Math.floor(userData.xp / 1000) + 1) * 1000)
      });

      if (!isOwnProfile) {
        setIsFollowing(userData.social?.is_following || false);
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  }, [api, user, targetUserId, isOwnProfile]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Social actions
  const handleFollow = async () => {
    try {
      const endpoint = isFollowing ? '/user/unfollow' : '/user/follow';
      await api.post(endpoint, { user_id: targetUserId });
      setIsFollowing(!isFollowing);
      
      // Update follower count
      setProfileData(prev => ({
        ...prev,
        social: {
          ...prev.social,
          followers: prev.social.followers + (isFollowing ? -1 : 1)
        }
      }));
      
      // Show feedback
      const action = isFollowing ? 'Unfollowed' : 'Following';
      showToast(`${action} ${profileData.name}!`, 'success');
    } catch (error) {
      console.error('Error following user:', error);
      showToast('Failed to update follow status', 'error');
    }
  };

  const handleAddFriend = async () => {
    try {
      await api.post('/user/friend-request', { user_id: targetUserId });
      showToast('Friend request sent!', 'success');
    } catch (error) {
      console.error('Error sending friend request:', error);
      showToast('Failed to send friend request', 'error');
    }
  };

  const handleMessage = () => {
    // Open messaging interface
    navigateTo('messages', { user_id: targetUserId, name: profileData.name });
  };

  // Share profile
  const handleShare = async (platform) => {
    const profileUrl = `${window.location.origin}/user/${targetUserId || user.id}`;
    const shareText = `Check out ${profileData.name}'s profile on MRVL Esports!`;

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: `${profileData.name} - MRVL Profile`,
          text: shareText,
          url: profileUrl
        });
        return;
      } catch (error) {
        console.log('Native share failed:', error);
      }
    }

    // Fallback: Copy to clipboard
    if (platform === 'copy' || !platform) {
      try {
        await navigator.clipboard.writeText(profileUrl);
        showToast('Profile link copied!', 'success');
      } catch (error) {
        console.error('Failed to copy:', error);
        showToast('Failed to copy link', 'error');
      }
      return;
    }

    // Social media sharing
    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`,
      instagram: profileUrl // Instagram doesn't support direct URL sharing
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }

    setShowShareModal(false);
  };

  // Toast notification helper
  const showToast = (message, type = 'info') => {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = `fixed bottom-24 left-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-y-full transition-transform duration-300 ${
      type === 'success' ? 'bg-green-500' : 
      type === 'error' ? 'bg-red-500' : 
      'bg-blue-500'
    } text-white font-medium`;
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateY(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateY(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  // Calculate XP progress
  const xpProgress = ((profileData.xp % 1000) / 1000) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onClose || (() => navigateTo('home'))}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h1 className="font-semibold text-lg">
            {isOwnProfile ? 'My Profile' : `${profileData.name}'s Profile`}
          </h1>
          
          <div className="flex items-center space-x-2">
            {isOwnProfile && (
              <button
                onClick={() => navigateTo('settings')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Header */}
      <div className="bg-gradient-to-br from-red-500 to-red-600 px-4 pt-6 pb-20">
        <div className="text-center">
          {/* Avatar */}
          <div className="relative mx-auto mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg mx-auto">
              {profileData.hero_flair ? (
                <HeroImage 
                  heroName={profileData.hero_flair}
                  size="2xl"
                  className="w-full h-full object-cover"
                />
              ) : profileData.avatar ? (
                <img 
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-300 flex items-center justify-center text-2xl font-bold text-gray-600">
                  {profileData.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
            </div>
            
            {/* Level Badge */}
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">
              {profileData.level}
            </div>

            {isOwnProfile && (
              <button
                onClick={() => navigateTo('profile-edit')}
                className="absolute bottom-0 right-4 bg-white text-gray-600 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Name and Status */}
          <h1 className="text-2xl font-bold text-white mb-2">{profileData.name}</h1>
          
          {/* Level Progress */}
          <div className="bg-white/20 rounded-full h-2 max-w-xs mx-auto mb-4">
            <div 
              className="bg-white rounded-full h-full transition-all duration-500"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-white/90 text-sm mb-4">
            {profileData.xp % 1000} / 1000 XP to Level {profileData.level + 1}
          </p>

          {/* Quick Stats */}
          <div className="flex justify-center space-x-8 text-white">
            <div className="text-center">
              <div className="font-bold text-lg">{engagementData.dailyStreak}</div>
              <div className="text-sm opacity-90">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{profileData.reputation}</div>
              <div className="text-sm opacity-90">Rep</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg">{profileData.achievements?.length || 0}</div>
              <div className="text-sm opacity-90">Badges</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="px-4 -mt-12 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {!isOwnProfile ? (
            // Other user's profile actions
            <>
              <button
                onClick={handleFollow}
                className={`p-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 font-medium transition-all ${
                  isFollowing 
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <UserPlus className="w-5 h-5" />
                <span>{isFollowing ? 'Following' : 'Follow'}</span>
              </button>
              
              <button
                onClick={handleMessage}
                className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Message</span>
              </button>
            </>
          ) : (
            // Own profile actions
            <>
              <button
                onClick={() => setShowQRCode(true)}
                className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <QrCode className="w-5 h-5" />
                <span>QR Code</span>
              </button>
              
              <button
                onClick={() => setShowAchievements(true)}
                className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 p-4 rounded-xl shadow-lg flex items-center justify-center space-x-2 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Trophy className="w-5 h-5" />
                <span>Achievements</span>
              </button>
            </>
          )}
        </div>

        {/* Social stats for other users */}
        {!isOwnProfile && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow">
              <div className="font-bold text-lg">{profileData.social?.followers || 0}</div>
              <div className="text-sm text-gray-500">Followers</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow">
              <div className="font-bold text-lg">{profileData.social?.following || 0}</div>
              <div className="text-sm text-gray-500">Following</div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg text-center shadow">
              <div className="font-bold text-lg">{profileData.social?.friends || 0}</div>
              <div className="text-sm text-gray-500">Friends</div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="px-4 mb-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'stats', label: 'Stats', icon: TrendingUp },
            { id: 'achievements', label: 'Badges', icon: Award }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-red-500 shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pb-24">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Daily Goals (Own Profile Only) */}
            {isOwnProfile && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <h3 className="font-semibold mb-3 flex items-center">
                  <Target className="w-5 h-5 mr-2 text-blue-500" />
                  Daily Goals
                </h3>
                <div className="space-y-3">
                  {Object.entries(engagementData.weeklyGoals).map(([key, goal]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          goal.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {goal.completed ? '✓' : key.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium capitalize">{key.replace('_', ' ')}</div>
                          <div className="text-sm text-gray-500">
                            {goal.current} / {goal.target}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {goal.completed && (
                          <div className="text-green-600 font-medium text-sm">+50 XP</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-purple-500" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {profileData.activity?.recent_achievements?.length ? (
                  profileData.activity.recent_achievements.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="text-sm">{activity.description}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bio */}
            {profileData.bio && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-gray-600 dark:text-gray-300">{profileData.bio}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Performance Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-4">Performance</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(profileData.stats).map(([key, value]) => (
                  <div key={key} className="text-center">
                    <div className="font-bold text-2xl text-red-500">{value}</div>
                    <div className="text-sm text-gray-500 capitalize">
                      {key.replace('_', ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Score */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-4">Engagement Score</h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-500 mb-2">
                  {engagementData.socialScore || 0}
                </div>
                <div className="text-gray-500">Social Activity Score</div>
                <div className="mt-4 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 rounded-full h-full transition-all duration-500"
                    style={{ width: `${Math.min((engagementData.socialScore / 1000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            {/* Achievement Categories */}
            <div className="grid grid-cols-2 gap-3">
              {engagementData.achievements?.length ? (
                engagementData.achievements.map((achievement, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="font-medium text-sm mb-1">{achievement.name}</div>
                    <div className="text-xs text-gray-500">{achievement.description}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-gray-500 py-8">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No achievements yet</p>
                  <p className="text-sm">Start participating to earn badges!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg mb-2">Share Your Profile</h3>
              <p className="text-gray-500 text-sm">Others can scan this code to view your profile</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg mb-4">
              <QRCodeDisplay 
                value={`${window.location.origin}/user/${user.id}`}
                size={200}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => handleShare('copy')}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowQRCode(false)}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white dark:bg-gray-800 rounded-t-xl p-6 w-full">
            <div className="text-center mb-6">
              <h3 className="font-bold text-lg mb-2">Share Profile</h3>
            </div>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => handleShare('copy')}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Copy className="w-6 h-6 mb-2" />
                <span className="text-xs">Copy</span>
              </button>
              
              <button
                onClick={() => handleShare('twitter')}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Twitter className="w-6 h-6 mb-2 text-blue-400" />
                <span className="text-xs">Twitter</span>
              </button>
              
              <button
                onClick={() => handleShare('facebook')}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Facebook className="w-6 h-6 mb-2 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </button>
              
              <button
                onClick={() => setShowQRCode(true)}
                className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <QrCode className="w-6 h-6 mb-2" />
                <span className="text-xs">QR Code</span>
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
  );
}

export default MobileUserProfile;