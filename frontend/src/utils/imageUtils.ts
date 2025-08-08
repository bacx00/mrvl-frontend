import { API_CONFIG } from '../config';

export type ImageType = 'team-logo' | 'player-avatar' | 'event-banner' | 'news-featured' | 'general';

/**
 * CORE IMAGE URL HANDLER - This handles ALL image URLs across the website
 * When backend returns image paths, this converts them to full URLs
 */
export const getImageUrl = (imagePath: string | null | undefined, type: ImageType = 'general'): string => {
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

export default getImageUrl;