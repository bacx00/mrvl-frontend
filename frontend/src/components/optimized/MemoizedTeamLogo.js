import React, { memo, useState, useCallback } from 'react';
import { getTeamLogoUrl } from '../../utils/imageUtils';

/**
 * Memoized Team Logo Component - Prevents unnecessary re-renders
 * CRITICAL PERFORMANCE OPTIMIZATION for mobile tournament platform
 */
const MemoizedTeamLogo = memo(({ team, size = 'w-8 h-8', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = useCallback(() => {
    console.log('🖼️ MemoizedTeamLogo - Image failed to load for team:', team?.name);
    setImageError(true);
    setIsLoading(false);
  }, [team?.name]);

  const handleImageLoad = useCallback(() => {
    console.log('🖼️ MemoizedTeamLogo - Image loaded successfully for team:', team?.name);
    setIsLoading(false);
  }, [team?.name]);

  if (!team) {
    return (
      <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        TEAM
      </div>
    );
  }

  const imageUrl = getTeamLogoUrl(team);
  const teamName = team.name || team.short_name || team.shortName || 'Team';

  // Show fallback if image error or loading failed
  if (imageError || !imageUrl || imageUrl.includes('placeholder')) {
    return (
      <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        ?
      </div>
    );
  }

  return (
    <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-600 animate-pulse rounded-full" />
      )}
      <img 
        src={imageUrl}
        alt={teamName}
        className={`w-full h-full object-cover transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onError={handleImageError}
        onLoad={handleImageLoad}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for shallow equality
  return (
    prevProps.team?.id === nextProps.team?.id &&
    prevProps.team?.logo === nextProps.team?.logo &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className
  );
});

MemoizedTeamLogo.displayName = 'MemoizedTeamLogo';

export default MemoizedTeamLogo;