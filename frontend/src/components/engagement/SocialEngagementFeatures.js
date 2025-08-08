import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, ThumbsUp, Flame, Zap, Share2, Users, MessageCircle, 
         Trophy, Target, Eye, UserPlus, UserMinus, Star, Send } from 'lucide-react';
import { hapticFeedback } from '../mobile/MobileGestures';

// One-Tap Reaction System
export const QuickReactionSystem = ({ 
  contentId,
  initialReactions = {},
  onReact = () => {},
  showCounts = true,
  animate = true 
}) => {
  const [reactions, setReactions] = useState(initialReactions);
  const [userReaction, setUserReaction] = useState(null);
  const [animatingReaction, setAnimatingReaction] = useState(null);

  const reactionTypes = [
    { type: 'like', icon: ThumbsUp, color: 'text-blue-500', label: 'Like' },
    { type: 'love', icon: Heart, color: 'text-red-500', label: 'Love' },
    { type: 'fire', icon: Flame, color: 'text-orange-500', label: 'Fire' },
    { type: 'poggers', icon: Zap, color: 'text-purple-500', label: 'Poggers' },
    { type: 'target', icon: Target, color: 'text-green-500', label: 'Prediction' }
  ];

  const handleReaction = useCallback((reactionType) => {
    const isAlreadyReacted = userReaction === reactionType;
    const newReaction = isAlreadyReacted ? null : reactionType;
    
    setUserReaction(newReaction);
    setAnimatingReaction(reactionType);
    
    // Update reaction counts
    setReactions(prev => {
      const newReactions = { ...prev };
      
      // Remove old reaction
      if (userReaction && newReactions[userReaction]) {
        newReactions[userReaction] = Math.max(0, newReactions[userReaction] - 1);
      }
      
      // Add new reaction
      if (newReaction) {
        newReactions[newReaction] = (newReactions[newReaction] || 0) + 1;
      }
      
      return newReactions;
    });
    
    // Haptic feedback based on reaction type
    const hapticMap = {
      like: hapticFeedback.light,
      love: hapticFeedback.medium,
      fire: hapticFeedback.heavy,
      poggers: hapticFeedback.powerUser,
      target: hapticFeedback.success
    };
    
    hapticMap[reactionType]?.();
    
    // Clear animation state
    setTimeout(() => setAnimatingReaction(null), 600);
    
    // Notify parent component
    onReact(contentId, newReaction);
  }, [contentId, userReaction, onReact]);

  return (
    <div className="flex items-center space-x-3 py-2">
      {reactionTypes.map(({ type, icon: Icon, color, label }) => {
        const count = reactions[type] || 0;
        const isActive = userReaction === type;
        const isAnimating = animatingReaction === type;
        
        return (
          <button
            key={type}
            className={`
              flex items-center space-x-1 px-3 py-2 rounded-full
              transition-all duration-200 transform
              ${isActive 
                ? `${color} bg-current bg-opacity-10 scale-110` 
                : 'text-gray-500 hover:text-gray-700'
              }
              ${isAnimating ? 'animate-bounce' : ''}
              active:scale-95 select-none
            `}
            onClick={() => handleReaction(type)}
            aria-label={`${label} reaction`}
          >
            <Icon 
              size={18} 
              className={`
                ${isActive ? '' : 'hover:scale-110'} 
                transition-transform duration-200
              `}
            />
            {showCounts && count > 0 && (
              <span className={`
                text-sm font-medium 
                ${isActive ? 'text-current' : 'text-gray-600'}
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// Quick Share Functionality
export const QuickShareSystem = ({ 
  content,
  title = '',
  url = '',
  showNativeShare = true 
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const shareOptions = [
    { 
      name: 'Copy Link', 
      icon: Share2, 
      action: () => {
        navigator.clipboard?.writeText(url || window.location.href);
        hapticFeedback.success();
        alert('Link copied to clipboard!');
      }
    },
    {
      name: 'Twitter',
      icon: Share2,
      action: () => {
        const text = encodeURIComponent(`${title} ${url || window.location.href}`);
        window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
      }
    },
    {
      name: 'Discord',
      icon: MessageCircle,
      action: () => {
        // Discord doesn't have direct sharing URLs, so copy formatted text
        const text = `**${title}**\n${content}\n${url || window.location.href}`;
        navigator.clipboard?.writeText(text);
        hapticFeedback.success();
        alert('Discord-formatted message copied!');
      }
    }
  ];

  const handleNativeShare = useCallback(async () => {
    if (!navigator.share) return false;
    
    try {
      setIsSharing(true);
      await navigator.share({
        title: title,
        text: content,
        url: url || window.location.href
      });
      hapticFeedback.success();
      return true;
    } catch (error) {
      console.log('Share cancelled or failed');
      return false;
    } finally {
      setIsSharing(false);
    }
  }, [title, content, url]);

  const handleShare = useCallback(async () => {
    hapticFeedback.light();
    
    if (showNativeShare && navigator.share) {
      const shared = await handleNativeShare();
      if (shared) return;
    }
    
    setShowShareMenu(true);
  }, [showNativeShare, handleNativeShare]);

  return (
    <div className="relative">
      <button
        className={`
          flex items-center space-x-2 px-4 py-2 rounded-lg
          bg-red-100 text-red-600 hover:bg-red-200
          transition-colors duration-200 active:scale-95
          ${isSharing ? 'opacity-50' : ''}
        `}
        onClick={handleShare}
        disabled={isSharing}
      >
        <Share2 size={16} />
        <span className="text-sm font-medium">Share</span>
      </button>

      {/* Share Menu */}
      {showShareMenu && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg border z-50">
          {shareOptions.map((option, index) => (
            <button
              key={option.name}
              className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50
                       w-full text-left first:rounded-t-lg last:rounded-b-lg"
              onClick={() => {
                option.action();
                setShowShareMenu(false);
              }}
            >
              <option.icon size={16} className="text-gray-600" />
              <span className="text-sm">{option.name}</span>
            </button>
          ))}
          
          <button
            className="flex items-center justify-center px-4 py-2 text-sm text-gray-500
                     hover:bg-gray-50 w-full border-t"
            onClick={() => setShowShareMenu(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

// Touch-Optimized Friend System
export const FriendSystem = ({ 
  user,
  currentUserId,
  onFriendAction = () => {},
  showStatus = true 
}) => {
  const [friendStatus, setFriendStatus] = useState(user.friendStatus || 'none');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleFriendAction = useCallback(async (action) => {
    setIsLoading(true);
    hapticFeedback.light();
    
    try {
      const result = await onFriendAction(user.id, action);
      if (result.success) {
        setFriendStatus(result.newStatus);
        
        // Different haptic feedback for different actions
        const hapticMap = {
          'add': hapticFeedback.success,
          'accept': hapticFeedback.achievement,
          'remove': hapticFeedback.error,
          'block': hapticFeedback.heavy
        };
        
        hapticMap[action]?.();
      }
    } catch (error) {
      console.error('Friend action failed:', error);
      hapticFeedback.error();
    } finally {
      setIsLoading(false);
    }
  }, [user.id, onFriendAction]);

  const getFriendButton = () => {
    const buttonClass = `
      flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium
      transition-all duration-200 active:scale-95
      ${isLoading ? 'opacity-50' : ''}
    `;

    switch (friendStatus) {
      case 'none':
        return (
          <button
            className={`${buttonClass} bg-red-100 text-red-600 hover:bg-red-200`}
            onClick={() => handleFriendAction('add')}
            disabled={isLoading}
          >
            <UserPlus size={14} />
            <span>Add Friend</span>
          </button>
        );
        
      case 'pending_sent':
        return (
          <button
            className={`${buttonClass} bg-gray-100 text-gray-600`}
            disabled
          >
            <Users size={14} />
            <span>Request Sent</span>
          </button>
        );
        
      case 'pending_received':
        return (
          <div className="flex space-x-2">
            <button
              className={`${buttonClass} bg-green-100 text-green-600 hover:bg-green-200`}
              onClick={() => handleFriendAction('accept')}
              disabled={isLoading}
            >
              <UserPlus size={14} />
              <span>Accept</span>
            </button>
            <button
              className={`${buttonClass} bg-gray-100 text-gray-600 hover:bg-gray-200`}
              onClick={() => handleFriendAction('decline')}
              disabled={isLoading}
            >
              <UserMinus size={14} />
            </button>
          </div>
        );
        
      case 'friends':
        return (
          <button
            className={`${buttonClass} bg-blue-100 text-blue-600 hover:bg-blue-200`}
            onClick={() => handleFriendAction('remove')}
            disabled={isLoading}
          >
            <Users size={14} />
            <span>Friends</span>
          </button>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center space-x-3">
      {/* User Avatar */}
      <div className="relative">
        <img
          src={user.avatar || '/default-avatar.png'}
          alt={user.name}
          className="w-12 h-12 rounded-full object-cover"
        />
        {showStatus && user.isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 
                         rounded-full border-2 border-white" />
        )}
      </div>
      
      {/* User Info and Actions */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {user.name}
            </h4>
            {user.level && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Star size={12} />
                <span>Level {user.level}</span>
              </div>
            )}
          </div>
          
          {user.id !== currentUserId && getFriendButton()}
        </div>
      </div>
    </div>
  );
};

// Social Leaderboards with Touch Interactions
export const SocialLeaderboard = ({ 
  leaderboardData = [],
  currentUserId,
  type = 'points',
  onUserTap = () => {},
  showRank = true 
}) => {
  const [expandedUser, setExpandedUser] = useState(null);
  const leaderboardRef = useRef(null);

  const handleUserTap = useCallback((user, index) => {
    hapticFeedback.light();
    
    if (expandedUser === user.id) {
      setExpandedUser(null);
    } else {
      setExpandedUser(user.id);
      onUserTap(user, index);
    }
  }, [expandedUser, onUserTap]);

  const getLeaderboardIcon = () => {
    const iconMap = {
      points: Trophy,
      predictions: Target,
      engagement: Heart,
      streaks: Flame
    };
    return iconMap[type] || Trophy;
  };

  const Icon = getLeaderboardIcon();

  const formatValue = (value) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toString();
  };

  const getRankStyle = (rank) => {
    if (rank === 1) return 'text-yellow-500';
    if (rank === 2) return 'text-gray-400';
    if (rank === 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Icon size={20} className="text-red-600" />
          <h3 className="text-lg font-semibold">
            {type.charAt(0).toUpperCase() + type.slice(1)} Leaderboard
          </h3>
        </div>
      </div>

      {/* Leaderboard List */}
      <div ref={leaderboardRef} className="divide-y">
        {leaderboardData.map((user, index) => {
          const rank = index + 1;
          const isCurrentUser = user.id === currentUserId;
          const isExpanded = expandedUser === user.id;
          
          return (
            <div key={user.id} className="relative">
              <div
                className={`
                  flex items-center p-4 cursor-pointer transition-all duration-200
                  ${isCurrentUser ? 'bg-red-50 border-l-4 border-red-500' : 'hover:bg-gray-50'}
                  ${isExpanded ? 'bg-gray-50' : ''}
                  active:bg-gray-100
                `}
                onClick={() => handleUserTap(user, index)}
              >
                {/* Rank */}
                {showRank && (
                  <div className={`text-2xl font-bold mr-4 ${getRankStyle(rank)} min-w-[2rem]`}>
                    {rank <= 3 ? (
                      <Trophy size={24} className={getRankStyle(rank)} />
                    ) : (
                      rank
                    )}
                  </div>
                )}

                {/* User Info */}
                <div className="flex-1 flex items-center space-x-3">
                  <img
                    src={user.avatar || '/default-avatar.png'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {user.name}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs text-red-600">(You)</span>
                      )}
                    </h4>
                    {user.team && (
                      <p className="text-sm text-gray-600">{user.team}</p>
                    )}
                  </div>
                </div>

                {/* Score/Value */}
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    {formatValue(user.value)}
                  </div>
                  {user.trend && (
                    <div className={`text-xs ${user.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {user.trend > 0 ? '+' : ''}{user.trend}
                    </div>
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="bg-gray-50 p-4 border-t animate-fadeIn">
                  <div className="grid grid-cols-2 gap-4">
                    {user.stats && Object.entries(user.stats).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <div className="text-lg font-bold text-gray-900">
                          {formatValue(value)}
                        </div>
                        <div className="text-xs text-gray-600 capitalize">
                          {key.replace('_', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {user.recentActivity && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">
                        Recent Activity
                      </h5>
                      <div className="space-y-1">
                        {user.recentActivity.slice(0, 3).map((activity, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            {activity}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Community Challenges with Progress Tracking
export const CommunityChallenge = ({ 
  challenge,
  userProgress = 0,
  communityProgress = 0,
  onParticipate = () => {},
  onShare = () => {} 
}) => {
  const [isParticipating, setIsParticipating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleParticipate = useCallback(async () => {
    setIsParticipating(true);
    hapticFeedback.challenge();
    
    try {
      await onParticipate(challenge.id);
      hapticFeedback.success();
    } catch (error) {
      console.error('Failed to participate:', error);
      hapticFeedback.error();
    } finally {
      setIsParticipating(false);
    }
  }, [challenge.id, onParticipate]);

  const progressPercentage = Math.min((communityProgress / challenge.target) * 100, 100);
  const userProgressPercentage = Math.min((userProgress / challenge.userTarget) * 100, 100);
  const timeLeft = new Date(challenge.endDate) - new Date();
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg text-white overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{challenge.title}</h3>
            <p className="text-red-100 text-sm">{challenge.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-red-200">
              {daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-3 mb-4">
          {/* Community Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Community Progress</span>
              <span>{communityProgress.toLocaleString()} / {challenge.target.toLocaleString()}</span>
            </div>
            <div className="w-full bg-red-800 rounded-full h-2">
              <div
                className="bg-white rounded-full h-2 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* User Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Your Progress</span>
              <span>{userProgress} / {challenge.userTarget}</span>
            </div>
            <div className="w-full bg-red-800 rounded-full h-2">
              <div
                className="bg-yellow-400 rounded-full h-2 transition-all duration-500"
                style={{ width: `${userProgressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            className="flex-1 bg-white text-red-600 py-2 px-4 rounded-lg font-medium
                     hover:bg-red-50 active:bg-red-100 transition-colors
                     disabled:opacity-50"
            onClick={handleParticipate}
            disabled={isParticipating || daysLeft <= 0}
          >
            {isParticipating ? 'Joining...' : 'Participate'}
          </button>
          
          <button
            className="bg-red-700 text-white py-2 px-4 rounded-lg
                     hover:bg-red-800 active:bg-red-900 transition-colors"
            onClick={() => onShare(challenge)}
          >
            <Share2 size={16} />
          </button>
        </div>

        {/* Rewards Preview */}
        {challenge.rewards && challenge.rewards.length > 0 && (
          <div className="mt-4 pt-4 border-t border-red-400">
            <div className="text-sm text-red-200 mb-2">Rewards:</div>
            <div className="flex space-x-2">
              {challenge.rewards.map((reward, index) => (
                <div key={index} className="text-xs bg-red-700 px-2 py-1 rounded">
                  {reward}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default {
  QuickReactionSystem,
  QuickShareSystem,
  FriendSystem,
  SocialLeaderboard,
  CommunityChallenge
};