// Utility to handle image URLs from backend
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with /storage/, it's a Laravel public storage path
  if (imagePath.startsWith('/storage/')) {
    return `${process.env.REACT_APP_API_URL || ''}${imagePath}`;
  }
  
  // If it starts with /images/, it's a public image path
  if (imagePath.startsWith('/images/')) {
    return `${process.env.REACT_APP_API_URL || ''}${imagePath}`;
  }
  
  // If it's a path like teams/logos/xxx, add /storage/
  if (imagePath.includes('/') && !imagePath.startsWith('/')) {
    return `${process.env.REACT_APP_API_URL || ''}/storage/${imagePath}`;
  }
  
  // Default case - assume it needs /storage/
  return `${process.env.REACT_APP_API_URL || ''}/storage/${imagePath}`;
};

// Check if image URL is valid
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url, window.location.origin);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};