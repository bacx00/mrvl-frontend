import React from 'react';
import HeroImage from '../shared/HeroImage';
import { getImageUrl } from '../../utils/imageUtils';
import RoleBadge from './RoleBadge';

const UserAvatar = ({ user, size = 'md', showFlairs = true, showName = true, showRole = false, className = '' }) => {
  // Get initials as fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const showHeroAvatar = user?.use_hero_as_avatar && user?.hero_flair;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showHeroAvatar ? (
        <HeroImage 
          heroName={user.hero_flair}
          size={size}
          className="rounded-full"
          showRole={false}
        />
      ) : user?.avatar ? (
        <div className={`relative`}>
          <img 
            src={getImageUrl(user.avatar, 'player-avatar')}
            alt={user.name}
            className={`${size === 'xs' ? 'w-6 h-6' : size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : size === 'lg' ? 'w-12 h-12' : 'w-16 h-16'} rounded-full object-cover`}
            onError={(e) => {
              e.target.src = getImageUrl(null, 'player-avatar');
            }}
          />
        </div>
      ) : (
        <div className={`${size === 'xs' ? 'w-6 h-6 text-xs' : size === 'sm' ? 'w-8 h-8 text-sm' : size === 'md' ? 'w-10 h-10 text-base' : size === 'lg' ? 'w-12 h-12 text-lg' : 'w-16 h-16 text-xl'} rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium`}>
          <span className="text-gray-600 dark:text-gray-300">
            {getInitials(user?.name || user?.username)}
          </span>
        </div>
      )}
      
      <div className="flex flex-col">
        {showName && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {user?.name || user?.username || 'Unknown User'}
              </span>
              {showFlairs && user?.show_team_flair && user?.team_flair && (
                <div className="flex items-center">
                  {user.team_flair.logo ? (
                    <img 
                      src={getImageUrl(user.team_flair.logo, 'team-logo')}
                      alt={user.team_flair.name}
                      className="w-5 h-5 object-contain"
                      title={user.team_flair.name}
                      onError={(e) => {
                        e.target.src = getImageUrl(null, 'team-logo');
                      }}
                    />
                  ) : (
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                      [{user.team_flair.short_name || user.team_flair.name}]
                    </span>
                  )}
                </div>
              )}
            </div>
            {showRole && user && (
              <RoleBadge 
                user={user} 
                size="sm" 
                showIcon={true} 
                showText={true}
                variant="default"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAvatar;