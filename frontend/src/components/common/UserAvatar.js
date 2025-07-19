import React, { useState } from 'react';

const UserAvatar = ({ user, size = 'md', showFlairs = true, className = '' }) => {
  const [imageError, setImageError] = useState(false);
  
  // Size mappings
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl'
  };

  const sizeClass = sizeClasses[size] || sizeClasses.md;

  // Get hero image URL
  const getHeroImage = (heroFlair) => {
    if (!heroFlair) return null;
    
    const slug = heroFlair.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return `https://staging.mrvl.net/images/heroes/portraits/${slug}.png`;
  };

  // Get initials as fallback
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const heroImage = user?.hero_flair ? getHeroImage(user.hero_flair) : null;
  const showHeroAvatar = user?.show_hero_flair && heroImage && !imageError;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${sizeClass} rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-medium`}>
        {showHeroAvatar ? (
          <img 
            src={heroImage}
            alt={user.hero_flair}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span className="text-gray-600 dark:text-gray-300">
            {getInitials(user?.name || user?.username)}
          </span>
        )}
      </div>
      
      {showFlairs && (
        <div className="flex items-center gap-1">
          {user?.show_hero_flair && user?.hero_flair && (
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {user.hero_flair}
            </span>
          )}
          {user?.show_team_flair && user?.team_flair && (
            <>
              {user?.show_hero_flair && user?.hero_flair && <span className="text-gray-400">•</span>}
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {user.team_flair.name}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;