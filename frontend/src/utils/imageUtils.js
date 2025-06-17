import { API_CONFIG } from '../config';

/**
 * CORE IMAGE URL HANDLER - This handles ALL image URLs across the website
 * When backend returns image paths, this converts them to full URLs
 */
export const getImageUrl = (imagePath, type = 'general') => {
  if (!imagePath || imagePath === null || imagePath === undefined || imagePath === '') {
    // Return appropriate placeholder based on type
    switch (type) {
      case 'team-logo':
        return 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=80&h=80&fit=crop&crop=center';
      case 'player-avatar':
        return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=center';
      case 'news-featured':
        return 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=200&h=200&fit=crop&crop=center';
    }
  }

  // CRITICAL FIX: Handle blob URLs from image upload (temporary URLs)
  if (typeof imagePath === 'string' && imagePath.startsWith('blob:')) {
    console.warn('🚨 Blob URL detected:', imagePath, '- This should be replaced with actual storage URL after upload');
    return getImageUrl(null, type); // Return placeholder instead of blob URL
  }

  // CRITICAL FIX: Handle emoji/invalid paths (🔥, 🌊, ⚔️, 🐍)
  if (typeof imagePath === 'string' && /[\u{1F000}-\u{1F6FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(imagePath)) {
    console.warn('🚨 Invalid emoji path detected:', imagePath, 'Using fallback');
    return getImageUrl(null, type); // Return placeholder
  }

  // If it's already a full URL, check if it needs domain correction
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    // CRITICAL FIX: Replace old domain with correct one
    if (imagePath.includes('1039tfjgievqa983.mrvl.net')) {
      const correctedUrl = imagePath.replace('https://1039tfjgievqa983.mrvl.net', API_CONFIG.BASE_URL);
      console.log('🔄 Correcting old domain URL:', imagePath, '→', correctedUrl);
      return correctedUrl;
    }
    return imagePath;
  }

  // CORE FIX: Handle backend storage paths properly
  // Backend returns paths like: "teams/logos/filename.jpg" or "players/avatars/filename.jpg"
  if (imagePath.includes('/')) {
    // Always add /storage/ prefix for backend file paths
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // CRITICAL FIX: Handle paths that already include 'storage' vs those that don't
    if (cleanPath.startsWith('storage/')) {
      return `${API_CONFIG.BASE_URL}/${cleanPath}`;
    } else {
      return `${API_CONFIG.BASE_URL}/storage/${cleanPath}`;
    }
  }

  // If it's just a filename, treat as storage path
  return `${API_CONFIG.BASE_URL}/storage/${imagePath}`;
};

/**
 * Get team logo URL with proper fallback
 */
// Enhanced team logo fallback system with Marvel Rivals themed images
export const getTeamLogoUrl = (team) => {
  console.log('🖼️ getTeamLogoUrl - Team:', team?.name, 'Logo path:', team?.logo);
  
  // Marvel Rivals team-specific fallbacks for real teams
  const teamLogos = {
    'Luminosity Gaming': 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=80&h=80&fit=crop&crop=center',
    'Fnatic': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop&crop=center',
    'OG': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop&crop=center',
    'Sentinels': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=80&h=80&fit=crop&crop=center',
    '100 Thieves': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=80&h=80&fit=crop&crop=center',
    'SHROUD-X': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=80&h=80&fit=crop&crop=center',
    'Team Nemesis': 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=80&h=80&fit=crop&crop=center',
    'FlyQuest': 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=80&h=80&fit=crop&crop=center',
    'Rival Esports': 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=80&h=80&fit=crop&crop=center',
    'CITADELGG': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=80&h=80&fit=crop&crop=center',
    'NTMR': 'https://images.unsplash.com/photo-1607734834519-d8576ae60ea6?w=80&h=80&fit=crop&crop=center',
    'BRR BRR PATAPIM': 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=80&h=80&fit=crop&crop=center',
    'TEAM1': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&h=80&fit=crop&crop=center',
    'Al Qadsiah': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=80&h=80&fit=crop&crop=center',
    'Z10': 'https://images.unsplash.com/photo-1580134774403-d6e7aa4e08ee?w=80&h=80&fit=crop&crop=center',
    'All Buisness': 'https://images.unsplash.com/photo-1590845947698-8924d7409b3b?w=80&h=80&fit=crop&crop=center',
    'Yoinkada': 'https://images.unsplash.com/photo-1553481187-be93c21490a9?w=80&h=80&fit=crop&crop=center'
  };

  // Check for specific team logo fallback first
  if (team?.name && teamLogos[team.name]) {
    console.log('🖼️ getTeamLogoUrl - Using specific fallback for:', team.name);
    return teamLogos[team.name];
  }

  // Try to use the logo path from backend (if valid)
  if (team?.logo && typeof team.logo === 'string' && team.logo.length > 0) {
    // ✅ FIXED: Prevent double /storage/ prefix issue
    let logoUrl = team.logo;
    
    // If it's already a full URL, use as is
    if (logoUrl.startsWith('http')) {
      console.log('🖼️ getTeamLogoUrl - Using full URL:', logoUrl);
      return logoUrl;
    }
    
    // If it already has /storage/ prefix, construct URL properly
    if (logoUrl.startsWith('/storage/')) {
      logoUrl = `https://staging.mrvl.net${logoUrl}`;
    } else {
      logoUrl = `https://staging.mrvl.net/storage/${logoUrl}`;
    }
    
    console.log('🖼️ getTeamLogoUrl - Final URL:', logoUrl);
    return logoUrl;
  }

  // Generic Marvel Rivals themed fallback
  console.log('🖼️ getTeamLogoUrl - Using generic fallback for:', team?.name);
  return 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=80&h=80&fit=crop&crop=center';
};

/**
 * Get team flag URL with proper fallback
 */
export const getTeamFlagUrl = (team) => {
  if (!team) return getImageUrl(null, 'team-logo');
  
  // FIXED: Check ALL possible flag fields from backend response
  const flagPath = team.flag_url || team.flagUrl || team.flag;
  console.log('🖼️ getTeamFlagUrl - Team:', team.name || team.id, 'Flag path:', flagPath);
  
  const finalUrl = getImageUrl(flagPath, 'team-logo');
  console.log('🖼️ getTeamFlagUrl - Final URL:', finalUrl);
  
  return finalUrl;
};

/**
 * Get player avatar URL with proper fallback  
 */
export const getPlayerAvatarUrl = (player) => {
  if (!player) return getImageUrl(null, 'player-avatar');
  
  // FIXED: Check ALL possible avatar fields from backend response
  const avatarPath = player.avatar_url || player.avatarUrl || player.avatar;
  console.log('🖼️ getPlayerAvatarUrl - Player:', player.name || player.username || player.id, 'Avatar path:', avatarPath);
  
  const finalUrl = getImageUrl(avatarPath, 'player-avatar');
  console.log('🖼️ getPlayerAvatarUrl - Final URL:', finalUrl);
  
  return finalUrl;
};

/**
 * Get news featured image URL with fallback
 */
export const getNewsFeaturedImageUrl = (article) => {
  if (!article) return getImageUrl(null, 'news-featured');
  
  const imagePath = article.featured_image_url || article.featuredImageUrl || article.image || article.featured_image;
  return getImageUrl(imagePath, 'news-featured');
};

/**
 * UNIVERSAL COUNTRY FLAG HELPER - Used everywhere on website
 * Returns country flag emoji for consistent display across all pages
 */
export const getCountryFlag = (countryCode) => {
  const flagMap = {
    'US': '🇺🇸',
    'CA': '🇨🇦', 
    'UK': '🇬🇧',
    'DE': '🇩🇪',
    'FR': '🇫🇷',
    'ES': '🇪🇸',
    'SE': '🇸🇪',
    'KR': '🇰🇷',
    'AU': '🇦🇺',
    'BR': '🇧🇷',
    'JP': '🇯🇵',
    'CN': '🇨🇳',
    'INTL': '🌍'
  };
  return flagMap[countryCode] || '🌍';
};

/**
 * UNIVERSAL TEAM LOGO COMPONENT - Used everywhere on website
 * This ensures consistent display across ALL pages
 */
export const TeamLogo = ({ team, size = 'w-8 h-8', className = '' }) => {
  if (!team) {
    return (
      <div className={`${size} rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        TEAM
      </div>
    );
  }
  
  const imageUrl = getTeamLogoUrl(team);
  const teamName = team.name || team.short_name || team.shortName || 'Team';
  const teamInitials = (team.short_name || team.shortName || teamName).substring(0, 4).toUpperCase();
  
  return (
    <div className={`${size} rounded bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
      <img 
        src={imageUrl}
        alt={teamName}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.log('🖼️ TeamLogo - Image failed to load:', imageUrl, 'for team:', teamName);
          // Fallback to text placeholder
          e.target.style.display = 'none';
          if (e.target.parentNode) {
            e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">${teamInitials}</div>`;
          }
        }}
        onLoad={() => {
          console.log('🖼️ TeamLogo - Image loaded successfully:', imageUrl, 'for team:', teamName);
        }}
      />
    </div>
  );
};

/**
 * UNIVERSAL PLAYER AVATAR COMPONENT - Used everywhere on website  
 * This ensures consistent display across ALL pages
 */
export const PlayerAvatar = ({ player, size = 'w-8 h-8', className = '' }) => {
  if (!player) {
    return (
      <div className={`${size} rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        P
      </div>
    );
  }
  
  const imageUrl = getPlayerAvatarUrl(player);
  const playerName = player.name || player.username || player.real_name || 'Player';
  const playerInitials = (player.username || player.name || 'P').substring(0, 2).toUpperCase();
  
  return (
    <div className={`${size} rounded bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
      <img 
        src={imageUrl}
        alt={playerName}
        className="w-full h-full object-cover"
        onError={(e) => {
          // More descriptive error logging
          if (playerName) {
            console.log('🖼️ PlayerAvatar - Image failed to load:', imageUrl, 'for player:', playerName);
          } else {
            console.log('🖼️ PlayerAvatar - Image failed to load:', imageUrl, '(no player name)');
          }
          // Fallback to text placeholder
          e.target.style.display = 'none';
          if (e.target.parentNode) {
            e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">${playerInitials}</div>`;
          }
        }}
        onLoad={() => {
          console.log('🖼️ PlayerAvatar - Image loaded successfully:', imageUrl, 'for player:', playerName);
        }}
      />
    </div>
  );
};

export default {
  getImageUrl,
  getTeamLogoUrl,
  getPlayerAvatarUrl,
  getNewsFeaturedImageUrl,
  TeamLogo,
  PlayerAvatar
};