import React from 'react';
import { API_CONFIG } from '../config';

/**
 * Check if a path is an external URL that should be blocked
 */
const isExternalUrl = (path) => {
  if (!path || typeof path !== 'string') {
    return false;
  }
  
  // Allow our own backend URLs
  if (path.includes('staging.mrvl.net') || path.includes('mrvl.net')) {
    return false;
  }
  
  // Block external HTTP/HTTPS URLs (but not our own)
  if (/^https?:\/\//.test(path)) {
    // Check if it's not our domain
    if (!path.includes('staging.mrvl.net') && !path.includes('mrvl.net')) {
      return true;
    }
    // If it IS our domain, return false to allow it
    return false;
  }
  
  // Block any URLs containing external domains
  const blockedDomains = [
    'liquipedia.net',
    'liquipedia.org', 
    'vlr.gg',
    'hltv.org',
    'cdn.',
    'imgur.com',
    'i.imgur.com'
  ];
  
  for (const domain of blockedDomains) {
    if (path.includes(domain)) {
      return true;
    }
  }
  
  return false;
};

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
      case 'event-banner':
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InRvdXJuYW1lbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZGMyNjI2O3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNiOTFjMWM7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjdG91cm5hbWVudCkiLz4KPHN2ZyB4PSIzNzUiIHk9IjEyNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiPgo8cGF0aCBkPSJNMTIgMkw0IDdsOSA1IDkgLTUtOEwyWk0xMiAyMWwtOC01aDJsNiAyIDYtMmgyTDEyIDIxWiIvPgo8L3N2Zz4KPHR5cGUgeD0iNDAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuNyI+VE9VUk5BTUVOVCA8L3R5cGU+Cjwvc3ZnPg==';
      default:
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHRleHQgeD0iMjAiIHk9IjI4IiBmb250LWZhbWlseT0ic3lzdGVtLXVpIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iIzZCNzI4MCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+PzwvdGV4dD4KPC9zdmc+';
    }
  }

  // CRITICAL FIX: Block ALL external URLs including Liquipedia
  if (typeof imagePath === 'string' && isExternalUrl(imagePath)) {
    console.warn('🚨 External URL blocked:', imagePath, '- Using fallback for security');
    return getImageUrl(null, type); // Return placeholder
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
  if (typeof imagePath === 'string' && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
    // CRITICAL FIX: Replace old domain with correct one
    if (imagePath.includes('1039tfjgievqa983.mrvl.net')) {
      const correctedUrl = imagePath.replace('https://1039tfjgievqa983.mrvl.net', API_CONFIG.BASE_URL);
      // Correcting old domain URL
      return correctedUrl;
    }
    // If it's already a complete URL, return as-is
    return imagePath;
  }

  // CORE FIX: Handle backend storage paths properly
  // Backend returns paths like: "/storage/teams/logos/filename.jpg" or "teams/logos/filename.jpg" or "players/avatars/filename.jpg"
  if (imagePath.includes('/')) {
    // Special handling for public images - they're in public/images/ not storage
    if (imagePath.includes('/heroes/') || imagePath.includes('/heroes-portraits/') || imagePath.includes('/images/')) {
      const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
      return `${API_CONFIG.BASE_URL}${cleanPath}`;
    }
    
    // Handle full storage paths that already start with /storage/
    if (imagePath.startsWith('/storage/')) {
      return `${API_CONFIG.BASE_URL}${imagePath}`;
    }
    
    // Always add /storage/ prefix for backend file paths without it
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
 * SIMPLIFIED: Backend now handles all logic, frontend just processes the response
 */
export const getTeamLogoUrl = (team) => {
  // If team object has logo information from backend ImageHelper
  if (team?.logo && typeof team.logo === 'object' && team.logo.url) {
    // console.log('🖼️ getTeamLogoUrl - Using backend ImageHelper response:', team.logo.url);
    return getImageUrl(team.logo.url, 'team-logo');
  }
  
  // If team has a simple logo path
  if (team?.logo && typeof team.logo === 'string' && team.logo.length > 0) {
    // console.log('🖼️ getTeamLogoUrl - Using simple logo path:', team.logo);
    return getImageUrl(team.logo, 'team-logo');
  }
  
  // Generic fallback with question mark
  // console.log('🖼️ getTeamLogoUrl - Using fallback for team:', team?.name);
  return getImageUrl(null, 'team-logo');
};

/**
 * Get team flag URL with proper fallback
 */
export const getTeamFlagUrl = (team) => {
  if (!team) return getImageUrl(null, 'team-logo');
  
  // FIXED: Check ALL possible flag fields from backend response
  const flagPath = team.flag_url || team.flagUrl || team.flag;
  // console.log('🖼️ getTeamFlagUrl - Team:', team.name || team.id, 'Flag path:', flagPath);
  
  const finalUrl = getImageUrl(flagPath, 'team-logo');
  // console.log('🖼️ getTeamFlagUrl - Final URL:', finalUrl);
  
  return finalUrl;
};

/**
 * Get event logo URL with proper fallback
 * FIXED: Handle backend returning full URLs including domain
 */
export const getEventLogoUrl = (event) => {
  if (!event) return getImageUrl(null, 'team-logo');
  
  // Handle new API logo object structure
  let logoPath = event.logo;
  
  // If logo is an object with url property (new API format)
  if (logoPath && typeof logoPath === 'object' && logoPath.url) {
    // console.log('🖼️ getEventLogoUrl - Event:', event.name || event.id, 'Logo object:', logoPath);
    let url = logoPath.url;
    
    // Fix double slash URLs like "//storage/events/logos/..." or "//events/mrvl-invitational.jpg"
    if (url.startsWith('//storage/') || url.startsWith('//events/')) {
      url = `${API_CONFIG.BASE_URL}${url.substring(1)}`; // Remove one slash and add domain
      // console.log('🖼️ getEventLogoUrl - Fixed double slash URL:', url);
    }
    // Fix single slash URLs like "/events/mrvl-invitational.jpg" or "/storage/..."
    else if (url.startsWith('/events/') || url.startsWith('/storage/')) {
      url = `${API_CONFIG.BASE_URL}${url}`;
      // console.log('🖼️ getEventLogoUrl - Added domain to URL:', url);
    }
    
    return url;
  }
  
  // Check various possible logo fields for backwards compatibility
  logoPath = logoPath || event.logo_url || event.logoUrl;
  // console.log('🖼️ getEventLogoUrl - Event:', event.name || event.id, 'Logo path:', logoPath);
  
  if (!logoPath) {
    return getImageUrl(null, 'team-logo');
  }
  
  // If it's already a full URL, return as is
  if (typeof logoPath === 'string' && (logoPath.startsWith('http://') || logoPath.startsWith('https://'))) {
    // console.log('🖼️ getEventLogoUrl - Using full URL:', logoPath);
    return logoPath;
  }
  
  // If it starts with /storage/, build the full URL
  if (typeof logoPath === 'string' && logoPath.startsWith('/storage/')) {
    const finalUrl = `${API_CONFIG.BASE_URL}${logoPath}`;
    // console.log('🖼️ getEventLogoUrl - Built URL from /storage/ path:', finalUrl);
    return finalUrl;
  }
  
  // If it's events/ path (like /events/championship.jpg), these are in public directory
  if (typeof logoPath === 'string' && (logoPath.startsWith('events/') || logoPath.startsWith('/events/'))) {
    const cleanPath = logoPath.startsWith('/') ? logoPath : `/${logoPath}`;
    const finalUrl = `${API_CONFIG.BASE_URL}${cleanPath}`;
    // console.log('🖼️ getEventLogoUrl - Built URL from public events/ path:', finalUrl);
    return finalUrl;
  }
  
  // Default case - treat as storage path
  const finalUrl = getImageUrl(logoPath, 'team-logo');
  // console.log('🖼️ getEventLogoUrl - Final URL:', finalUrl);
  
  return finalUrl;
};

/**
 * Get player avatar URL with proper fallback  
 * SIMPLIFIED: Backend now handles all logic, frontend just processes the response
 */
export const getPlayerAvatarUrl = (player) => {
  if (!player) return getImageUrl(null, 'player-avatar');
  
  // If player object has avatar information from backend ImageHelper
  if (player?.avatar && typeof player.avatar === 'object' && player.avatar.url) {
    // console.log('🖼️ getPlayerAvatarUrl - Using backend ImageHelper response:', player.avatar.url);
    return getImageUrl(player.avatar.url, 'player-avatar');
  }
  
  // Check ALL possible avatar fields from backend response
  const avatarPath = player.avatar_url || player.avatarUrl || player.avatar;
  // console.log('🖼️ getPlayerAvatarUrl - Player:', player.name || player.username || player.id, 'Avatar path:', avatarPath);
  
  const finalUrl = getImageUrl(avatarPath, 'player-avatar');
  // console.log('🖼️ getPlayerAvatarUrl - Final URL:', finalUrl);
  
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
  // console.log('🖼️ getUserAvatarUrl - User:', user.name || user.username || user.id, 'Avatar path:', avatarPath);
  
  const finalUrl = getImageUrl(avatarPath, 'player-avatar');
  // console.log('🖼️ getUserAvatarUrl - Final URL:', finalUrl);
  
  return finalUrl;
};

/**
 * Get event banner image URL with proper fallback system
 * Priority: banner -> logo -> default tournament banner
 */
export const getEventBannerUrl = (event) => {
  if (!event) {
    // Return default tournament banner for demo purposes
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InRvdXJuYW1lbnQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZGMyNjI2O3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNiOTFjMWM7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjdG91cm5hbWVudCkiLz4KPHN2ZyB4PSIzNzUiIHk9IjEyNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiPgo8cGF0aCBkPSJNMTIgMkw0IDdsOSA1IDkgLTUtOEwyWk0xMiAyMWwtOC01aDJsNiAyIDYtMmgyTDEyIDIxWiIvPgo8L3N2Zz4KPHR5cGUgeD0iNDAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuNyI+VE9VUk5BTUVOVCA8L3R5cGU+Cjwvc3ZnPg==';
  }
  
  // console.log('🖼️ getEventBannerUrl - Event:', event.name || event.id);
  // console.log('🖼️ getEventBannerUrl - Banner field:', event.banner);
  // console.log('🖼️ getEventBannerUrl - Logo field:', event.logo);
  // console.log('🖼️ getEventBannerUrl - Featured image:', event.featured_image);
  // console.log('🖼️ getEventBannerUrl - Banner image:', event.banner_image);
  
  // Priority 1: Use banner field if available
  if (event.banner && event.banner !== null && event.banner.trim() !== '') {
    const bannerUrl = getImageUrl(event.banner, 'event-banner');
    // console.log('🖼️ getEventBannerUrl - Using banner field:', bannerUrl);
    return bannerUrl;
  }
  
  // Priority 2: Use banner_image field if available  
  if (event.banner_image && event.banner_image !== null && event.banner_image.trim() !== '') {
    const bannerUrl = getImageUrl(event.banner_image, 'event-banner');
    // console.log('🖼️ getEventBannerUrl - Using banner_image field:', bannerUrl);
    return bannerUrl;
  }
  
  // Priority 3: Use featured_image field if available
  if (event.featured_image && event.featured_image !== null && event.featured_image.trim() !== '') {
    const bannerUrl = getImageUrl(event.featured_image, 'event-banner');
    // console.log('🖼️ getEventBannerUrl - Using featured_image field:', bannerUrl);
    return bannerUrl;
  }
  
  // Priority 4: Use event logo as banner fallback
  if (event.logo && event.logo !== null) {
    // Handle both string and object logo formats
    const logoValue = typeof event.logo === 'object' ? (event.logo.url || event.logo.path || '') : event.logo;
    if (logoValue && typeof logoValue === 'string' && logoValue.trim() !== '') {
      const logoUrl = getEventLogoUrl(event);
      // console.log('🖼️ getEventBannerUrl - Using logo as banner fallback:', logoUrl);
      return logoUrl;
    }
  }
  
  // Priority 5: Default tournament banner based on event status
  const isLive = event.status === 'live' || event.status === 'ongoing';
  const defaultBanner = isLive 
    ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9ImxpdmUiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgo8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojZGMyNjI2O3N0b3Atb3BhY2l0eToxIiAvPgo8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNiOTFjMWM7c3RvcC1vcGFjaXR5OjEiIC8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9InVybCgjbGl2ZSkiLz4KPHN2ZyB4PSIzNzUiIHk9IjEyNSIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IndoaXRlIiBvcGFjaXR5PSIwLjgiPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiBmaWxsPSJ3aGl0ZSI+PGFuaW1hdGUgYXR0cmlidXRlTmFtZT0icmFkaXVzIiB2YWx1ZXM9IjM7NTszIiBkdXI9IjFzIiByZXBlYXRDb3VudD0iaW5kZWZpbml0ZSIvPjwvY2lyY2xlPgo8L3N2Zz4KPHR5cGUgeD0iNDAwIiB5PSIxNjAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkxJVkUgVE9VUk5BTUVOVCA8L3R5cGU+Cjwvc3ZnPg=='
    : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDgwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxkZWZzPgo8bGluZWFyR3JhZGllbnQgaWQ9InVwY29taW5nIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzI1NjNlYjtzdG9wLW9wYWNpdHk6MSIgLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMWQ0ZWQ4O3N0b3Atb3BhY2l0eToxIiAvPgo8L2xpbmVhckdyYWRpZW50Pgo8L2RlZnM+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iMzAwIiBmaWxsPSJ1cmwoI3VwY29taW5nKSIvPgo8c3ZnIHg9IjM3NSIgeT0iMTI1IiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiIG9wYWNpdHk9IjAuOCI+CjxwYXRoIGQ9Ik0xMiAyTDEzLjA5IDguMjZMMjIgOUwxNiAxNEwxNy4xOCAyMkwxMiAxOEw2LjgyIDIyTDggMTRMMiA5TDEwLjkxIDguMjZMMTIgMloiLz4KPC9zdmc+Cjx0ZXh0IHg9IjQwMCIgeT0iMTcwIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBvcGFjaXR5PSIwLjciPlVQQ09NSU5HIFRPVVJOQU1FTlQgPC90ZXh0Pgo8L3N2Zz4=';
    
  // console.log('🖼️ getEventBannerUrl - Using default banner (', isLive ? 'live' : 'upcoming', ')');
  return defaultBanner;
};

/**
 * Get news featured image URL with fallback
 * ENHANCED: Better debugging and error handling for news images
 */
export const getNewsFeaturedImageUrl = (article) => {
  if (!article) {
    // console.log('🖼️ getNewsFeaturedImageUrl - No article provided, using fallback');
    return getImageUrl(null, 'news-featured');
  }
  
  const imagePath = article.featured_image_url || article.featuredImageUrl || article.image || article.featured_image;
  
  // console.log('🖼️ getNewsFeaturedImageUrl - Article:', article.title || article.id, 'Image path:', imagePath);
  
  // CRITICAL FIX: Handle complex image objects from backend
  if (imagePath && typeof imagePath === 'object') {
    // console.log('🖼️ getNewsFeaturedImageUrl - Complex image object detected:', imagePath);
    // Backend returns: { url: "/images/news-placeholder.svg", exists: true, fallback: {...} }
    // Use the URL directly if it exists and is already complete
    const url = imagePath.url || imagePath.path || null;
    if (url && typeof url === 'string') {
      // If the URL already starts with API_CONFIG.BASE_URL or is a full URL, use as-is
      if (url.startsWith('http') || url.startsWith(API_CONFIG.BASE_URL)) {
        // console.log('🖼️ getNewsFeaturedImageUrl - Using complete URL from object:', url);
        return url;
      }
      // Otherwise, prepend the base URL to make it a complete URL
      const completeUrl = `${API_CONFIG.BASE_URL}${url}`;
      // console.log('🖼️ getNewsFeaturedImageUrl - Built complete URL from object:', completeUrl);
      return completeUrl;
    }
    // Fallback to generic placeholder handling
    // console.log('🖼️ getNewsFeaturedImageUrl - Invalid image object, using fallback');
    return getImageUrl(null, 'news-featured');
  }
  
  const finalUrl = getImageUrl(imagePath, 'news-featured');
  // console.log('🖼️ getNewsFeaturedImageUrl - Final URL:', finalUrl);
  
  return finalUrl;
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
 * UNIVERSAL COUNTRY NAME HELPER - Converts country codes to full names
 * Used for displaying full country names instead of abbreviations
 */
export const getCountryName = (countryCode) => {
  if (!countryCode || typeof countryCode !== 'string') return 'International';
  
  // Normalize the country code/name
  const normalized = countryCode.trim();
  
  const nameMap = {
    // North America
    'US': 'United States',
    'UNITED STATES': 'United States',
    'USA': 'United States',
    'CA': 'Canada', 
    'CANADA': 'Canada',
    'MX': 'Mexico',
    'MEXICO': 'Mexico',
    
    // Europe
    'UK': 'United Kingdom',
    'UNITED KINGDOM': 'United Kingdom',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'GERMANY': 'Germany',
    'FR': 'France',
    'FRANCE': 'France',
    'ES': 'Spain',
    'SPAIN': 'Spain',
    'IT': 'Italy',
    'ITALY': 'Italy',
    'SE': 'Sweden',
    'SWEDEN': 'Sweden',
    'NO': 'Norway',
    'NORWAY': 'Norway',
    'DK': 'Denmark',
    'DENMARK': 'Denmark',
    'FI': 'Finland',
    'FINLAND': 'Finland',
    'NL': 'Netherlands',
    'NETHERLANDS': 'Netherlands',
    'BE': 'Belgium',
    'BELGIUM': 'Belgium',
    'PL': 'Poland',
    'POLAND': 'Poland',
    'CZ': 'Czech Republic',
    'CZECH REPUBLIC': 'Czech Republic',
    'PT': 'Portugal',
    'PORTUGAL': 'Portugal',
    'GR': 'Greece',
    'GREECE': 'Greece',
    'RU': 'Russia',
    'RUSSIA': 'Russia',
    'UA': 'Ukraine',
    'UKRAINE': 'Ukraine',
    'TR': 'Turkey',
    'TURKEY': 'Turkey',
    
    // Asia
    'KR': 'South Korea',
    'SOUTH KOREA': 'South Korea',
    'KOREA': 'South Korea',
    'JP': 'Japan',
    'JAPAN': 'Japan',
    'CN': 'China',
    'CHINA': 'China',
    'TW': 'Taiwan',
    'TAIWAN': 'Taiwan',
    'HK': 'Hong Kong',
    'HONG KONG': 'Hong Kong',
    'SG': 'Singapore',
    'SINGAPORE': 'Singapore',
    'MY': 'Malaysia',
    'MALAYSIA': 'Malaysia',
    'TH': 'Thailand',
    'THAILAND': 'Thailand',
    'VN': 'Vietnam',
    'VIETNAM': 'Vietnam',
    'PH': 'Philippines',
    'PHILIPPINES': 'Philippines',
    'ID': 'Indonesia',
    'INDONESIA': 'Indonesia',
    'IN': 'India',
    'INDIA': 'India',
    
    // Oceania
    'AU': 'Australia',
    'AUSTRALIA': 'Australia',
    'NZ': 'New Zealand',
    'NEW ZEALAND': 'New Zealand',
    
    // South America
    'BR': 'Brazil',
    'BRAZIL': 'Brazil',
    'AR': 'Argentina',
    'ARGENTINA': 'Argentina',
    'CL': 'Chile',
    'CHILE': 'Chile',
    'CO': 'Colombia',
    'COLOMBIA': 'Colombia',
    'PE': 'Peru',
    'PERU': 'Peru',
    
    // Middle East
    'AE': 'United Arab Emirates',
    'UAE': 'United Arab Emirates',
    'UNITED ARAB EMIRATES': 'United Arab Emirates',
    'SA': 'Saudi Arabia',
    'SAUDI ARABIA': 'Saudi Arabia',
    'IL': 'Israel',
    'ISRAEL': 'Israel',
    
    // Africa
    'ZA': 'South Africa',
    'SOUTH AFRICA': 'South Africa',
    'EG': 'Egypt',
    'EGYPT': 'Egypt',
    'MA': 'Morocco',
    'MOROCCO': 'Morocco',
    
    // Special
    'INTL': 'International',
    'INTERNATIONAL': 'International',
    'EU': 'Europe',
    'EUROPE': 'Europe',
    'NA': 'North America',
    'NORTH AMERICA': 'North America',
    'SOUTH_AMERICA': 'South America',
    'ASIA': 'Asia',
    'APAC': 'Asia-Pacific'
  };
  
  // Try uppercase first, then as-is for mixed case matches
  return nameMap[normalized.toUpperCase()] || nameMap[normalized] || normalized;
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
          // Silently fallback to question mark placeholder
          e.target.src = getImageUrl(null, 'team-logo');
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
  const [imageError, setImageError] = React.useState(false);
  
  if (!player) {
    return (
      <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 ${className}`}>
        P
      </div>
    );
  }
  
  const imageUrl = getPlayerAvatarUrl(player);
  const playerName = player.name || player.username || player.ign || player.real_name || 'Player';
  // Get initials from ign, username or name
  const getInitials = () => {
    const nameToUse = player.ign || player.username || player.name || 'P';
    const parts = nameToUse.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return nameToUse.substring(0, 2).toUpperCase();
  };
  const playerInitials = getInitials();
  
  // If image error occurred or using placeholder, show question mark fallback (same as teams)
  if (imageError || !imageUrl || imageUrl.includes('placeholder')) {
    return (
      <div className={`${size} rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg ${className}`}>
        ?
      </div>
    );
  }
  
  return (
    <div className={`${size} rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden ${className}`}>
      <img 
        src={imageUrl}
        alt={playerName}
        className="w-full h-full object-cover"
        onError={(e) => {
          // console.log('🖼️ PlayerAvatar - Image failed to load:', imageUrl, 'for player:', playerName);
          setImageError(true);
        }}
        onLoad={() => {
          // console.log('🖼️ PlayerAvatar - Image loaded successfully:', imageUrl, 'for player:', playerName);
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
  getEventBannerUrl,
  getTeamFlagUrl,
  getPlayerAvatarUrl,
  getUserAvatarUrl,
  getNewsFeaturedImageUrl,
  getCountryName,
  TeamLogo,
  PlayerAvatar
};