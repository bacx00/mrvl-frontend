import React, { memo, useState, useCallback } from 'react';
import { getPlayerAvatarUrl } from '../../utils/imageUtils';

/**
 * Memoized Player Avatar Component - Prevents unnecessary re-renders
 * CRITICAL PERFORMANCE OPTIMIZATION for mobile tournament platform
 */
const MemoizedPlayerAvatar = memo(({ player, size = 'w-8 h-8', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleImageError = useCallback(() => {
    console.log('🖼️ MemoizedPlayerAvatar - Image failed to load for player:', player?.name);
    setImageError(true);
    setIsLoading(false);
  }, [player?.name]);

  const handleImageLoad = useCallback(() => {
    console.log('🖼️ MemoizedPlayerAvatar - Image loaded successfully for player:', player?.name);
    setIsLoading(false);
  }, [player?.name]);

  if (!player) {
    return (
      <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        P
      </div>
    );
  }

  const imageUrl = getPlayerAvatarUrl(player);
  const playerName = player.name || player.username || player.ign || player.real_name || 'Player';

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
        alt={playerName}
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
    prevProps.player?.id === nextProps.player?.id &&
    prevProps.player?.avatar === nextProps.player?.avatar &&
    prevProps.player?.avatar_url === nextProps.player?.avatar_url &&
    prevProps.size === nextProps.size &&
    prevProps.className === nextProps.className
  );
});

MemoizedPlayerAvatar.displayName = 'MemoizedPlayerAvatar';

export default MemoizedPlayerAvatar;