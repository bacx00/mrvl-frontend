import React, { useState } from 'react';
import Image from 'next/image';
import { getImageUrl } from '../../utils/imageUtils';

const EnhancedUserAvatar = ({
  user,
  size = 'md',
  showOnlineStatus = true,
  showRole = false,
  clickable = false,
  className = '',
  onUserClick = null
}) => {
  const [imageError, setImageError] = useState(false);

  // Size configurations
  const sizeClasses = {
    xs: { 
      container: 'w-6 h-6',
      text: 'text-xs',
      online: 'w-2 h-2 -bottom-0.5 -right-0.5',
      role: 'text-[8px] px-1'
    },
    sm: { 
      container: 'w-8 h-8',
      text: 'text-sm',
      online: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
      role: 'text-xs px-1.5 py-0.5'
    },
    md: { 
      container: 'w-12 h-12',
      text: 'text-base',
      online: 'w-3 h-3 -bottom-1 -right-1',
      role: 'text-xs px-2 py-1'
    },
    lg: { 
      container: 'w-16 h-16',
      text: 'text-lg',
      online: 'w-4 h-4 -bottom-1 -right-1',
      role: 'text-sm px-2 py-1'
    },
    xl: { 
      container: 'w-24 h-24',
      text: 'text-xl',
      online: 'w-5 h-5 -bottom-2 -right-2',
      role: 'text-sm px-3 py-1'
    }
  };

  // Role badge styling
  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: '#ef4444', text: 'Admin', icon: '👑' },
      moderator: { bg: '#4ade80', text: 'Mod', icon: '🛡️' },
      vip: { bg: '#f59e0b', text: 'VIP', icon: '⭐' },
      premium: { bg: '#8b5cf6', text: 'Premium', icon: '💎' },
      user: { bg: 'transparent', text: '', icon: '' }
    };
    
    return badges[role] || badges.user;
  };

  const handleClick = (e) => {
    if (clickable && onUserClick && user) {
      e.preventDefault();
      e.stopPropagation();
      onUserClick(user);
    }
  };

  const getUserInitials = () => {
    if (!user?.username) return '?';
    const initials = user.username.split(' ')
      .map(word => word.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return initials || user.username.charAt(0).toUpperCase();
  };

  const AvatarContent = () => (
    <div className={`relative ${sizeClasses[size].container} flex-shrink-0`}>
      {/* Main Avatar */}
      <div className={`${sizeClasses[size].container} rounded-full overflow-hidden relative`}>
        {user?.avatar && !imageError ? (
          <Image
            src={getImageUrl(user.avatar, 'player-avatar')}
            alt={user.username || 'User'}
            fill
            className="object-cover"
            sizes={sizeClasses[size].container.split(' ')[0].replace('w-', '') + 'px'}
            onError={() => setImageError(true)}
            quality={85}
            priority={size === 'xl'}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#fa4454] to-[#e03e4e] flex items-center justify-center">
            <span className={`text-white font-bold ${sizeClasses[size].text}`}>
              {getUserInitials()}
            </span>
          </div>
        )}
      </div>

      {/* Online Status Indicator */}
      {showOnlineStatus && user?.isOnline && (
        <div 
          className={`absolute ${sizeClasses[size].online} bg-[#4ade80] border-2 border-[#0f1419] rounded-full animate-pulse`}
          title="Online"
        />
      )}

      {/* Role Badge Overlay (for larger sizes) */}
      {showRole && user?.role && getRoleBadge(user.role).icon && size !== 'xs' && size !== 'sm' && (
        <div 
          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#1a2332] border-2 border-[#2b3d4d] flex items-center justify-center"
          title={getRoleBadge(user.role).text}
        >
          <span className="text-xs">{getRoleBadge(user.role).icon}</span>
        </div>
      )}
    </div>
  );

  if (clickable) {
    return (
      <button
        onClick={handleClick}
        className={`transition-all duration-200 hover:scale-105 active:scale-95 ${className}`}
        title={`View ${user?.username || 'User'}'s profile`}
      >
        <AvatarContent />
      </button>
    );
  }

  return (
    <div className={`${className}`}>
      <AvatarContent />
    </div>
  );
};

// User info card component for additional details
export const EnhancedUserCard = ({ 
  user, 
  compact = false, 
  showAvatar = true,
  showStats = true,
  showRole = true,
  className = ''
}) => {
  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: '#ef4444', text: 'Admin', icon: '👑' },
      moderator: { bg: '#4ade80', text: 'Mod', icon: '🛡️' },
      vip: { bg: '#f59e0b', text: 'VIP', icon: '⭐' },
      premium: { bg: '#8b5cf6', text: 'Premium', icon: '💎' },
      user: { bg: 'transparent', text: '', icon: '' }
    };
    
    return badges[role] || badges.user;
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {showAvatar && (
          <EnhancedUserAvatar
            user={user}
            size="sm"
            showOnlineStatus={true}
            showRole={false}
          />
        )}
        <div className="min-w-0">
          <div className="flex items-center space-x-2">
            <span className="font-medium text-white truncate">
              {user?.username || 'Unknown User'}
            </span>
            {showRole && user?.role && getRoleBadge(user.role).text && (
              <span 
                className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                style={{ backgroundColor: getRoleBadge(user.role).bg }}
              >
                {getRoleBadge(user.role).icon} {getRoleBadge(user.role).text}
              </span>
            )}
          </div>
          {showStats && (user?.postCount || user?.reputation !== undefined) && (
            <div className="text-xs text-[#768894]">
              {user.postCount && `${formatNumber(user.postCount)} posts`}
              {user.postCount && user.reputation !== undefined && ' • '}
              {user.reputation !== undefined && (
                <span className={user.reputation >= 0 ? 'text-[#4ade80]' : 'text-[#ef4444]'}>
                  {formatNumber(user.reputation)} rep
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-[#1a2332] border border-[#2b3d4d] rounded-lg ${className}`}>
      <div className="flex items-start space-x-3">
        {showAvatar && (
          <EnhancedUserAvatar
            user={user}
            size="lg"
            showOnlineStatus={true}
            showRole={true}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="font-semibold text-white truncate">
              {user?.username || 'Unknown User'}
            </h3>
            {showRole && user?.role && getRoleBadge(user.role).text && (
              <span 
                className="px-2 py-1 rounded text-xs font-bold text-white flex items-center space-x-1"
                style={{ backgroundColor: getRoleBadge(user.role).bg }}
              >
                <span>{getRoleBadge(user.role).icon}</span>
                <span>{getRoleBadge(user.role).text}</span>
              </span>
            )}
          </div>
          
          {user?.customTitle && (
            <p className="text-sm text-[#fa4454] italic mb-2">{user.customTitle}</p>
          )}
          
          {showStats && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              {user?.postCount && (
                <div>
                  <span className="text-[#768894]">Posts:</span>
                  <span className="ml-2 text-white font-medium">
                    {formatNumber(user.postCount)}
                  </span>
                </div>
              )}
              {user?.reputation !== undefined && (
                <div>
                  <span className="text-[#768894]">Reputation:</span>
                  <span className={`ml-2 font-medium ${
                    user.reputation >= 0 ? 'text-[#4ade80]' : 'text-[#ef4444]'
                  }`}>
                    {formatNumber(user.reputation)}
                  </span>
                </div>
              )}
              {user?.joinDate && (
                <div>
                  <span className="text-[#768894]">Joined:</span>
                  <span className="ml-2 text-white">
                    {new Date(user.joinDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              {user?.country && (
                <div>
                  <span className="text-[#768894]">Location:</span>
                  <span className="ml-2 text-white">{user.country}</span>
                </div>
              )}
            </div>
          )}

          {user?.badges && user.badges.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-[#768894] mb-2">Achievements</div>
              <div className="flex flex-wrap gap-1">
                {user.badges.slice(0, 4).map((badge, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-[#2b3d4d] text-[#768894] text-xs rounded"
                  >
                    {badge}
                  </span>
                ))}
                {user.badges.length > 4 && (
                  <span className="px-2 py-1 bg-[#2b3d4d] text-[#768894] text-xs rounded">
                    +{user.badges.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedUserAvatar;