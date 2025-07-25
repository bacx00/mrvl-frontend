import { API_CONFIG } from '../config';

/**
 * CORE IMAGE URL HANDLER - This handles ALL image URLs across the website
 * When backend returns image paths, this converts them to full URLs
 */
export const getImageUrl = (imagePath, type = 'general') => {
  if (!imagePath || imagePath === null || imagePath === undefined || imagePath === '') {
    // Return question mark placeholder - using data URIs for instant loading
    switch (type) {
      case 'team-logo':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHRleHQgeD0iMjAiIHk9IjI4IiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PzwvdGV4dD4KPC9zdmc+';
      case 'player-avatar':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHRleHQgeD0iMjAiIHk9IjI4IiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PzwvdGV4dD4KPC9zdmc+';
      case 'news-featured':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDMwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIzMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjE1MCIgeT0iMTEwIiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjQwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PzwvdGV4dD4KPC9zdmc+';
      default:
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHRleHQgeD0iMjAiIHk9IjI4IiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PzwvdGV4dD4KPC9zdmc+';
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
    // Special handling for hero images - they're in public/images/heroes not storage
    if (imagePath.includes('/heroes/') || imagePath.includes('/heroes-portraits/')) {
      const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `${API_CONFIG.BASE_URL}${cleanPath}`;
    }
    
    // Special handling for players directory - direct public access
    if (imagePath.includes('/players/') || imagePath.startsWith('players/')) {
      const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `${API_CONFIG.BASE_URL}${cleanPath}`;
    }
    
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
  
  // Remove team-specific hardcoded fallbacks - use question mark placeholder for all
  const teamLogos = {};

  // Check for specific team logo fallback first
  if (team?.name && teamLogos[team.name]) {
    console.log('🖼️ getTeamLogoUrl - Using specific fallback for:', team.name);
    return teamLogos[team.name];
  }

  // Try to use the logo path from backend (if valid)
  if (team?.logo && typeof team.logo === 'string' && team.logo.length > 0) {
    let logoUrl = team.logo;
    
    // Skip blob URLs as they're invalid for our use case
    if (logoUrl.startsWith('blob:')) {
      console.log('🖼️ getTeamLogoUrl - Skipping blob URL:', logoUrl);
      return getImageUrl(null, 'team-logo');
    }
    
    // If it's already a full URL, use as is
    if (logoUrl.startsWith('http')) {
      console.log('🖼️ getTeamLogoUrl - Using full URL:', logoUrl);
      return logoUrl;
    }
    
    // Clean up the path to prevent double slashes
    if (logoUrl.startsWith('/storage/')) {
      logoUrl = `${API_CONFIG.BASE_URL}${logoUrl}`;
    } else if (logoUrl.startsWith('/teams/')) {
      // Fix: team logos are in /storage/teams/logos/ directory
      logoUrl = `${API_CONFIG.BASE_URL}/storage/teams/logos/${logoUrl.replace('/teams/', '')}`;
    } else if (logoUrl.startsWith('/')) {
      logoUrl = `${API_CONFIG.BASE_URL}/storage${logoUrl}`;
    } else {
      logoUrl = `${API_CONFIG.BASE_URL}/storage/${logoUrl}`;
    }
    
    console.log('🖼️ getTeamLogoUrl - Final URL:', logoUrl);
    return logoUrl;
  }

  // Generic fallback with question mark
  console.log('🖼️ getTeamLogoUrl - Using generic fallback for:', team?.name);
  return getImageUrl(null, 'team-logo');
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
 * Get event logo URL with proper fallback
 * FIXED: Handle backend returning full URLs including domain
 */
export const getEventLogoUrl = (event) => {
  if (!event) return getImageUrl(null, 'team-logo');
  
  // Check various possible logo fields
  const logoPath = event.logo || event.logo_url || event.logoUrl;
  console.log('🖼️ getEventLogoUrl - Event:', event.name || event.id, 'Logo path:', logoPath);
  
  if (!logoPath) {
    return getImageUrl(null, 'team-logo');
  }
  
  // If it's already a full URL, return as is
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    console.log('🖼️ getEventLogoUrl - Using full URL:', logoPath);
    return logoPath;
  }
  
  // If it starts with /storage/, build the full URL
  if (logoPath.startsWith('/storage/')) {
    const finalUrl = `${API_CONFIG.BASE_URL}${logoPath}`;
    console.log('🖼️ getEventLogoUrl - Built URL from /storage/ path:', finalUrl);
    return finalUrl;
  }
  
  // If it's events/logos/ path, add /storage/ prefix
  if (logoPath.startsWith('events/logos/')) {
    const finalUrl = `${API_CONFIG.BASE_URL}/storage/${logoPath}`;
    console.log('🖼️ getEventLogoUrl - Built URL from events/logos/ path:', finalUrl);
    return finalUrl;
  }
  
  // Default case - treat as storage path
  const finalUrl = getImageUrl(logoPath, 'team-logo');
  console.log('🖼️ getEventLogoUrl - Final URL:', finalUrl);
  
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
 * Get user avatar URL with proper fallback
 */
export const getUserAvatarUrl = (user) => {
  if (!user) return getImageUrl(null, 'player-avatar');
  
  // Check if user is using a hero as avatar
  if (user.avatar && user.avatar.includes('/heroes/')) {
    // Hero images are in public/images/heroes/ not storage
    // Remove any /storage prefix if present
    const cleanPath = user.avatar.replace('/storage', '');
    return `${API_CONFIG.BASE_URL}${cleanPath}`;
  }
  
  // Check ALL possible avatar fields from backend response
  const avatarPath = user.avatar_url || user.avatarUrl || user.avatar;
  console.log('🖼️ getUserAvatarUrl - User:', user.name || user.username || user.id, 'Avatar path:', avatarPath);
  
  const finalUrl = getImageUrl(avatarPath, 'player-avatar');
  console.log('🖼️ getUserAvatarUrl - Final URL:', finalUrl);
  
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
  if (!countryCode || typeof countryCode !== 'string') return '🌍';
  
  // Normalize the country code/name
  const normalized = countryCode.trim();
  
  const flagMap = {
    // North America
    'US': '🇺🇸',
    'UNITED STATES': '🇺🇸',
    'USA': '🇺🇸',
    'CA': '🇨🇦', 
    'CANADA': '🇨🇦',
    'MX': '🇲🇽',
    'MEXICO': '🇲🇽',
    
    // Europe
    'UK': '🇬🇧',
    'UNITED KINGDOM': '🇬🇧',
    'GB': '🇬🇧',
    'DE': '🇩🇪',
    'GERMANY': '🇩🇪',
    'FR': '🇫🇷',
    'FRANCE': '🇫🇷',
    'ES': '🇪🇸',
    'SPAIN': '🇪🇸',
    'IT': '🇮🇹',
    'ITALY': '🇮🇹',
    'SE': '🇸🇪',
    'SWEDEN': '🇸🇪',
    'NO': '🇳🇴',
    'NORWAY': '🇳🇴',
    'DK': '🇩🇰',
    'DENMARK': '🇩🇰',
    'FI': '🇫🇮',
    'FINLAND': '🇫🇮',
    'NL': '🇳🇱',
    'NETHERLANDS': '🇳🇱',
    'BE': '🇧🇪',
    'BELGIUM': '🇧🇪',
    'PL': '🇵🇱',
    'POLAND': '🇵🇱',
    'CZ': '🇨🇿',
    'CZECH REPUBLIC': '🇨🇿',
    'PT': '🇵🇹',
    'PORTUGAL': '🇵🇹',
    'GR': '🇬🇷',
    'GREECE': '🇬🇷',
    'RU': '🇷🇺',
    'RUSSIA': '🇷🇺',
    'UA': '🇺🇦',
    'UKRAINE': '🇺🇦',
    'TR': '🇹🇷',
    'TURKEY': '🇹🇷',
    
    // Asia
    'KR': '🇰🇷',
    'SOUTH KOREA': '🇰🇷',
    'KOREA': '🇰🇷',
    'JP': '🇯🇵',
    'JAPAN': '🇯🇵',
    'CN': '🇨🇳',
    'CHINA': '🇨🇳',
    'TW': '🇹🇼',
    'TAIWAN': '🇹🇼',
    'HK': '🇭🇰',
    'HONG KONG': '🇭🇰',
    'SG': '🇸🇬',
    'SINGAPORE': '🇸🇬',
    'MY': '🇲🇾',
    'MALAYSIA': '🇲🇾',
    'TH': '🇹🇭',
    'THAILAND': '🇹🇭',
    'VN': '🇻🇳',
    'VIETNAM': '🇻🇳',
    'PH': '🇵🇭',
    'PHILIPPINES': '🇵🇭',
    'ID': '🇮🇩',
    'INDONESIA': '🇮🇩',
    'IN': '🇮🇳',
    'INDIA': '🇮🇳',
    
    // Oceania
    'AU': '🇦🇺',
    'AUSTRALIA': '🇦🇺',
    'NZ': '🇳🇿',
    'NEW ZEALAND': '🇳🇿',
    
    // South America
    'BR': '🇧🇷',
    'BRAZIL': '🇧🇷',
    'AR': '🇦🇷',
    'ARGENTINA': '🇦🇷',
    'CL': '🇨🇱',
    'CHILE': '🇨🇱',
    'CO': '🇨🇴',
    'COLOMBIA': '🇨🇴',
    'PE': '🇵🇪',
    'PERU': '🇵🇪',
    
    // Middle East
    'AE': '🇦🇪',
    'UAE': '🇦🇪',
    'UNITED ARAB EMIRATES': '🇦🇪',
    'SA': '🇸🇦',
    'SAUDI ARABIA': '🇸🇦',
    'IL': '🇮🇱',
    'ISRAEL': '🇮🇱',
    
    // Africa
    'ZA': '🇿🇦',
    'SOUTH AFRICA': '🇿🇦',
    'EG': '🇪🇬',
    'EGYPT': '🇪🇬',
    'MA': '🇲🇦',
    'MOROCCO': '🇲🇦',
    
    // Special
    'INTL': '🌍',
    'INTERNATIONAL': '🌍',
    'EU': '🇪🇺',
    'EUROPE': '🇪🇺',
    'NA': '🌎',
    'NORTH AMERICA': '🌎',
    'SOUTH_AMERICA': '🌎',
    'ASIA': '🌏',
    'APAC': '🌏'
  };
  
  // Try uppercase first, then as-is for mixed case matches
  return flagMap[normalized.toUpperCase()] || flagMap[normalized] || '🌍';
};

/**
 * UNIVERSAL TEAM LOGO COMPONENT - Used everywhere on website
 * This ensures consistent display across ALL pages
 */
export const TeamLogo = ({ team, size = 'w-8 h-8', className = '' }) => {
  if (!team) {
    return (
      <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        TEAM
      </div>
    );
  }
  
  const imageUrl = getTeamLogoUrl(team);
  const teamName = team.name || team.short_name || team.shortName || 'Team';
  const teamInitials = (team.short_name || team.shortName || teamName).substring(0, 4).toUpperCase();
  
  return (
    <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
      <img 
        src={imageUrl}
        alt={teamName}
        className="w-full h-full object-cover"
        onError={(e) => {
          console.log('🖼️ TeamLogo - Image failed to load:', imageUrl, 'for team:', teamName);
          // Fallback to question mark placeholder
          e.target.src = getImageUrl(null, 'team-logo');
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
      <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        P
      </div>
    );
  }
  
  const imageUrl = getPlayerAvatarUrl(player);
  const playerName = player.name || player.username || player.real_name || 'Player';
  const playerInitials = (player.username || player.name || 'P').substring(0, 2).toUpperCase();
  
  return (
    <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
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
          // Fallback to question mark placeholder
          e.target.src = getImageUrl(null, 'player-avatar');
        }}
        onLoad={() => {
          console.log('🖼️ PlayerAvatar - Image loaded successfully:', imageUrl, 'for player:', playerName);
        }}
      />
    </div>
  );
};

/**
 * 🎮 MARVEL RIVALS HERO IMAGE SYSTEM - PRODUCTION READY
 * ✅ 17 heroes with images, 5 heroes with clean text fallbacks
 */
export const getHeroImageSync = (heroName) => {
  if (!heroName || typeof heroName !== 'string') return null;
  
  // ✅ Map hero names to backend image files
  const heroImageMap = {
    // Duelists
    'Black Widow': 'black-widow-headbig.webp',
    'Hawkeye': 'hawkeye-headbig.webp',
    'Star-Lord': 'star-lord-headbig.webp',
    'Punisher': 'the-punisher-headbig.webp',
    'The Punisher': 'the-punisher-headbig.webp',
    'Winter Soldier': 'winter-soldier-headbig.webp',
    'Squirrel Girl': 'squirrel-girl-headbig.webp',
    'Iron Man': 'iron-man-headbig.webp',
    'Spider-Man': 'spider-man-headbig.webp',
    'Storm': 'storm-headbig.webp',
    'Scarlet Witch': 'scarlet-witch-headbig.webp',
    'Moon Knight': 'moon-knight-headbig.webp',
    'Psylocke': 'psylocke-headbig.webp',
    'Black Panther': 'black-panther-headbig.webp',
    'Iron Fist': 'iron-fist-headbig.webp',
    'Magik': 'magik-headbig.webp',
    'Namor': 'namor-headbig.webp',
    'Wolverine': 'wolverine-headbig.webp',
    'Hela': 'hela-headbig.webp',
    // Vanguards
    'Hulk': 'bruce-banner-headbig.webp',
    'Bruce Banner': 'bruce-banner-headbig.webp',
    'Groot': 'groot-headbig.webp',
    'Doctor Strange': 'doctor-strange-headbig.webp',
    'Magneto': 'magneto-headbig.webp',
    'Captain America': 'captain-america-headbig.webp',
    'Venom': 'venom-headbig.webp',
    'Thor': 'thor-headbig.webp',
    'Peni Parker': 'peni-parker-headbig.webp',
    // Strategists
    'Mantis': 'mantis-headbig.webp',
    'Luna Snow': 'luna-snow-headbig.webp',
    'Adam Warlock': 'adam-warlock-headbig.webp',
    'Cloak & Dagger': 'cloak-dagger-headbig.webp',
    'C&D': 'cloak-dagger-headbig.webp',
    'Jeff the Land Shark': 'jeff-the-land-shark-headbig.webp',
    'Jeff': 'jeff-the-land-shark-headbig.webp',
    'Rocket Raccoon': 'rocket-raccoon-headbig.webp',
    'Loki': 'loki-headbig.webp',
    'Invisible Woman': 'invisible-woman-headbig.webp',
    // Additional heroes found in backend
    'Mister Fantastic': 'mister-fantastic-headbig.webp',
    'Mr. Fantastic': 'mister-fantastic-headbig.webp',
    'Human Torch': 'human-torch-headbig.webp',
    'The Thing': 'the-thing-headbig.webp',
    'Thing': 'the-thing-headbig.webp',
    'Ultron': 'ultron-headbig.webp',
    'Emma Frost': 'emma-frost-headbig.webp'
  };
  
  // Return backend image URL if available
  if (heroImageMap[heroName]) {
    return `${API_CONFIG.BASE_URL}/images/heroes/${heroImageMap[heroName]}`;
  }
  
  return null; // Default to text fallback for unknown heroes
};

/**
 * 🎮 GET HERO ROLE FOR STYLING
 */
export const getHeroRole = (heroName) => {
  const roleMap = {
    // Vanguards (8 heroes) - Marvel Rivals uses "Vanguard" not "Tank"
    'Captain America': 'Vanguard', 'Doctor Strange': 'Vanguard', 'Groot': 'Vanguard', 
    'Hulk': 'Vanguard', 'Magneto': 'Vanguard', 'Thor': 'Vanguard', 'Venom': 'Vanguard',
    'Peni Parker': 'Vanguard',
    
    // Duelists (18 heroes)
    'Black Widow': 'Duelist', 'Hawkeye': 'Duelist', 'Iron Man': 'Duelist',
    'Punisher': 'Duelist', 'Spider-Man': 'Duelist', 'Squirrel Girl': 'Duelist',
    'Star-Lord': 'Duelist', 'Winter Soldier': 'Duelist', 'Storm': 'Duelist',
    'Scarlet Witch': 'Duelist', 'Moon Knight': 'Duelist', 'Psylocke': 'Duelist',
    'Black Panther': 'Duelist', 'Iron Fist': 'Duelist', 'Magik': 'Duelist',
    'Namor': 'Duelist', 'Wolverine': 'Duelist', 'Hela': 'Duelist',
    
    // Strategists (13 heroes) - Marvel Rivals uses "Strategist" not "Support"
    'Adam Warlock': 'Strategist', 'Cloak & Dagger': 'Strategist', 
    'Jeff the Land Shark': 'Strategist', 'Luna Snow': 'Strategist',
    'Mantis': 'Strategist', 'Rocket Raccoon': 'Strategist', 
    'Loki': 'Strategist', 'Invisible Woman': 'Strategist', 'Juno': 'Strategist',
    'Mercy': 'Strategist', 'Zenyatta': 'Strategist', 'C&D': 'Strategist', 'Jeff': 'Strategist'
  };
  
  return roleMap[heroName] || 'Duelist';
};

export default {
  getImageUrl,
  getTeamLogoUrl,
  getEventLogoUrl,
  getTeamFlagUrl,
  getPlayerAvatarUrl,
  getUserAvatarUrl,
  getNewsFeaturedImageUrl,
  TeamLogo,
  PlayerAvatar
};