/**
 * Video URL parsing and embed utilities
 * Supports YouTube, Twitch (clips & videos), Twitter/X, and VLR.gg esports content
 */

// Import VLR.gg service for esports content integration
import { parseVLRUrl, validateVLRUrl } from '../services/vlrggService';

// Enhanced video URL patterns with better edge case handling
const VIDEO_PATTERNS = {
  youtube: {
    patterns: [
      // Standard YouTube watch URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})(?:&[^&]*)*(?:#[^&]*)?/,
      // YouTube short URLs
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?[^&]*)*(?:#[^&]*)?/,
      // YouTube embed URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?[^&]*)*(?:#[^&]*)?/,
      // YouTube /v/ URLs
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})(?:\?[^&]*)*(?:#[^&]*)?/,
      // YouTube Shorts
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?[^&]*)*(?:#[^&]*)?/,
      // YouTube mobile URLs
      /(?:https?:\/\/)?m\.youtube\.com\/watch\?(?:[^&]*&)*v=([a-zA-Z0-9_-]{11})(?:&[^&]*)*(?:#[^&]*)?/
    ],
    embedTemplate: 'https://www.youtube.com/embed/{id}'
  },
  twitchClip: {
    patterns: [
      // Twitch clip URLs
      /(?:https?:\/\/)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)(?:\?[^&]*)*(?:#[^&]*)?/,
      // Channel clip URLs
      /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([^\/\s]+)\/clip\/([a-zA-Z0-9_-]+)(?:\?[^&]*)*(?:#[^&]*)?/,
      // Old format clip URLs
      /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/\w+\/clip\/([a-zA-Z0-9_-]+)(?:\?[^&]*)*(?:#[^&]*)?/
    ],
    embedTemplate: 'https://clips.twitch.tv/embed?clip={id}&parent={domain}'
  },
  twitchVideo: {
    patterns: [
      // Twitch video URLs
      /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)(?:\?[^&]*)*(?:#[^&]*)?/,
      // Mobile Twitch video URLs
      /(?:https?:\/\/)?m\.twitch\.tv\/videos\/(\d+)(?:\?[^&]*)*(?:#[^&]*)?/
    ],
    embedTemplate: 'https://player.twitch.tv/?video={id}&parent={domain}'
  },
  twitchStream: {
    patterns: [
      // Live Twitch streams
      /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]{4,25})(?:\?[^&]*)*(?:#[^&]*)?$/,
      /(?:https?:\/\/)?m\.twitch\.tv\/([a-zA-Z0-9_]{4,25})(?:\?[^&]*)*(?:#[^&]*)?$/
    ],
    embedTemplate: 'https://player.twitch.tv/?channel={id}&parent={domain}'
  },
  twitter: {
    patterns: [
      // Twitter status URLs
      /(?:https?:\/\/)?(?:www\.)?twitter\.com\/(?:[^\/\s]+)\/status\/(\d+)(?:\?[^&]*)*(?:#[^&]*)?/,
      // X.com status URLs  
      /(?:https?:\/\/)?(?:www\.)?x\.com\/(?:[^\/\s]+)\/status\/(\d+)(?:\?[^&]*)*(?:#[^&]*)?/,
      // Mobile Twitter URLs
      /(?:https?:\/\/)?mobile\.twitter\.com\/(?:[^\/\s]+)\/status\/(\d+)(?:\?[^&]*)*(?:#[^&]*)?/,
      // Twitter video URLs (specific to video tweets)
      /(?:https?:\/\/)?(?:www\.)?twitter\.com\/i\/status\/(\d+)(?:\?[^&]*)*(?:#[^&]*)?/
    ],
    embedTemplate: 'https://twitter.com/x/status/{id}'
  },
  vlrgg: {
    patterns: [
      // VLR.gg match URLs
      /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/(\d+)\/([^\/\s?]+)(?:\/[^\/\s?]*)*(?:\?[^&]*)*(?:#[^&]*)?/,
      // VLR.gg team URLs
      /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/team\/(\d+)\/([^\/\s?]+)(?:\/[^\/\s?]*)*(?:\?[^&]*)*(?:#[^&]*)?/,
      // VLR.gg event URLs
      /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/event\/(\d+)\/([^\/\s?]+)(?:\/[^\/\s?]*)*(?:\?[^&]*)*(?:#[^&]*)?/,
      // VLR.gg player URLs
      /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/player\/(\d+)\/([^\/\s?]+)(?:\/[^\/\s?]*)*(?:\?[^&]*)*(?:#[^&]*)?/
    ],
    embedTemplate: null // VLR.gg uses custom card embeds, not iframe embeds
  }
};

/**
 * Detect video/content type from URL
 * @param {string} url - Video/content URL
 * @returns {Object|null} - {type, id, originalUrl, platform} or null
 */
export const detectVideoUrl = (url) => {
  if (!url || typeof url !== 'string') return null;

  url = url.trim();
  
  // Check for VLR.gg URLs first using the dedicated service
  const vlrValidation = validateVLRUrl(url);
  if (vlrValidation.isValid) {
    const vlrData = parseVLRUrl(url);
    return {
      type: 'vlrgg',
      id: vlrData.id,
      originalUrl: url,
      platform: 'vlrgg',
      contentType: vlrData.type, // match, team, event, player
      slug: vlrData.slug,
      displayUrl: vlrData.displayUrl
    };
  }
  
  // Check other video patterns
  for (const [type, config] of Object.entries(VIDEO_PATTERNS)) {
    if (type === 'vlrgg') continue; // Already handled above
    
    for (const pattern of config.patterns) {
      const match = url.match(pattern);
      if (match) {
        let detectedId = match[1];
        let detectedType = type;
        
        // Handle special cases for Twitch
        if (type === 'twitchClip') {
          // For channel clip URLs, use the second match group (clip ID)
          detectedId = match[2] || match[1];
          detectedType = 'twitch-clip';
        } else if (type === 'twitchVideo') {
          detectedType = 'twitch-video';
        } else if (type === 'twitchStream') {
          detectedType = 'twitch-stream';
        }
        
        return {
          type: detectedType,
          id: detectedId,
          originalUrl: url,
          platform: type.startsWith('twitch') ? 'twitch' : 
                   type === 'twitter' ? 'twitter' : 
                   type === 'youtube' ? 'youtube' : type,
          // Add additional metadata for better handling
          ...(type === 'youtube' && {
            isYouTubeShorts: url.includes('/shorts/'),
            isMobileUrl: url.includes('m.youtube.com')
          }),
          ...(type.startsWith('twitch') && {
            isLiveStream: type === 'twitchStream',
            isClip: type === 'twitchClip',
            isVod: type === 'twitchVideo'
          })
        };
      }
    }
  }
  
  return null;
};

/**
 * Extract all video URLs from text content
 * @param {string} content - Text content
 * @returns {Array} - Array of detected video objects
 */
export const extractVideoUrls = (content) => {
  if (!content || typeof content !== 'string') return [];

  const urls = [];
  const urlRegex = /https?:\/\/[^\s\n\r\t]+/gi;
  const matches = content.match(urlRegex) || [];

  for (const url of matches) {
    const video = detectVideoUrl(url);
    if (video) {
      urls.push(video);
    }
  }

  return urls;
};

/**
 * Generate embed URL for a video/content
 * @param {string} type - Video/content type
 * @param {string} id - Video/content ID
 * @param {Object} options - Additional options
 * @returns {string|null} - Embed URL or null for custom embeds
 */
export const generateEmbedUrl = (type, id, options = {}) => {
  let domain = options.domain || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const isMobile = options.isMobile || false;
  const isTablet = options.isTablet || false;
  const autoplay = options.autoplay || false;
  const muted = options.muted || isMobile; // Default muted on mobile
  const startTime = options.startTime || null;
  
  // Handle localhost and development environments for Twitch
  if (domain === 'localhost' || domain.includes('localhost') || domain.includes('127.0.0.1')) {
    domain = 'localhost';
  }
  
  switch (type) {
    case 'youtube': {
      let params = new URLSearchParams({
        rel: '0',
        modestbranding: '1',
        controls: '1',
        showinfo: '0',
        fs: '1'
      });
      
      if (isMobile) params.set('playsinline', '1');
      if (autoplay) {
        params.set('autoplay', '1');
        params.set('mute', muted ? '1' : '0');
      }
      if (startTime) params.set('start', startTime);
      
      return `https://www.youtube.com/embed/${id}?${params.toString()}`;
    }
      
    case 'twitch-clip': {
      let params = new URLSearchParams({
        clip: id,
        parent: domain,
        autoplay: autoplay ? 'true' : 'false',
        muted: muted ? 'true' : 'false'
      });
      
      if (isTablet || isMobile) {
        params.set('allowfullscreen', 'true');
      }
      
      return `https://clips.twitch.tv/embed?${params.toString()}`;
    }
      
    case 'twitch-video': {
      let params = new URLSearchParams({
        video: id,
        parent: domain,
        autoplay: autoplay ? 'true' : 'false',
        muted: muted ? 'true' : 'false'
      });
      
      if (startTime) params.set('time', `${startTime}s`);
      if (isTablet || isMobile) {
        params.set('allowfullscreen', 'true');
      }
      
      return `https://player.twitch.tv/?${params.toString()}`;
    }
    
    case 'twitch-stream': {
      let params = new URLSearchParams({
        channel: id,
        parent: domain,
        autoplay: autoplay ? 'true' : 'false',
        muted: muted ? 'true' : 'false'
      });
      
      if (isTablet || isMobile) {
        params.set('allowfullscreen', 'true');
      }
      
      return `https://player.twitch.tv/?${params.toString()}`;
    }
      
    case 'twitter':
    case 'x':
      return `https://twitter.com/x/status/${id}`;
      
    case 'vlrgg':
      // VLR.gg content uses custom card embeds, not iframe embeds
      return null;
      
    default:
      return null;
  }
};

/**
 * Process content to extract and replace video URLs with placeholders
 * @param {string} content - Original content
 * @returns {Object} - {processedContent, videos}
 */
export const processContentForVideos = (content) => {
  if (!content || typeof content !== 'string') {
    return { processedContent: content || '', videos: [] };
  }

  const videos = extractVideoUrls(content);
  let processedContent = content;
  
  // Replace video URLs with placeholders
  videos.forEach((video, index) => {
    const placeholder = `[VIDEO_EMBED_${index}]`;
    processedContent = processedContent.replace(video.originalUrl, placeholder);
  });

  return { processedContent, videos };
};

/**
 * Restore video URLs from processed content
 * @param {string} processedContent - Content with placeholders
 * @param {Array} videos - Array of video objects
 * @returns {string} - Original content with video URLs
 */
export const restoreVideoUrls = (processedContent, videos) => {
  if (!processedContent || !videos || videos.length === 0) {
    return processedContent || '';
  }

  let content = processedContent;
  videos.forEach((video, index) => {
    const placeholder = `[VIDEO_EMBED_${index}]`;
    content = content.replace(placeholder, video.originalUrl);
  });

  return content;
};

/**
 * Validate video/content URL
 * @param {string} url - Video/content URL to validate
 * @returns {Object} - {isValid, type, error}
 */
export const validateVideoUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const video = detectVideoUrl(url);
  if (!video) {
    return { 
      isValid: false, 
      error: 'Unsupported content platform. Supported: YouTube, Twitch (clips & videos), Twitter/X, VLR.gg (matches, teams, events, players)' 
    };
  }

  return { isValid: true, type: video.type, video };
};

/**
 * Get video thumbnail URL
 * @param {string} type - Video type
 * @param {string} id - Video ID
 * @returns {string|null} - Thumbnail URL
 */
export const getVideoThumbnail = (type, id) => {
  switch (type) {
    case 'youtube':
      return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
      
    case 'twitch-clip':
      // Twitch clip thumbnails require API call, return null for now
      return null;
      
    case 'twitch-video':
      // Twitch video thumbnails require API call, return null for now
      return null;
      
    case 'twitter':
      // Twitter doesn't provide direct thumbnail access
      return null;
      
    default:
      return null;
  }
};

/**
 * Get content platform display name
 * @param {string} type - Content type
 * @returns {string} - Display name
 */
export const getVideoPlatformName = (type) => {
  switch (type) {
    case 'youtube': return 'YouTube';
    case 'twitch-clip': return 'Twitch Clip';
    case 'twitch-video': return 'Twitch VOD';
    case 'twitch-stream': return 'Twitch Stream';
    case 'twitter': 
    case 'x': return 'X (Twitter)';
    case 'vlrgg': return 'VLR.gg';
    default: return 'Content';
  }
};

/**
 * Check if content contains video URLs
 * @param {string} content - Content to check
 * @returns {boolean} - True if contains videos
 */
export const hasVideoUrls = (content) => {
  return extractVideoUrls(content).length > 0;
};

/**
 * Get content embed aspect ratio
 * @param {string} type - Content type
 * @param {boolean} isMobile - Is mobile device
 * @returns {string} - CSS aspect ratio class
 */
export const getVideoAspectRatio = (type, isMobile = false) => {
  if (type === 'twitter' || type === 'vlrgg') {
    return 'auto'; // Twitter and VLR.gg embeds have variable height
  }
  
  if (isMobile) {
    return 'pb-[177.78%] sm:pb-[56.25%]'; // 9:16 on mobile, 16:9 on larger screens
  }
  
  return 'pb-[56.25%]'; // Standard 16:9 aspect ratio
};

/**
 * Enhanced video/content URL detection with better error handling
 * @param {string} text - Text to scan for video/content URLs
 * @returns {Array} - Array of enhanced content objects with validation
 */
export const detectAllVideoUrls = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const videos = [];
  const urlRegex = /https?:\/\/[^\s\n\r\t<>"\[\]{}|\\^`]+/gi;
  const matches = text.match(urlRegex) || [];
  
  matches.forEach((url, index) => {
    const cleanUrl = url.replace(/[.,;:!?]+$/, ''); // Remove trailing punctuation
    const detection = detectVideoUrl(cleanUrl);
    
    if (detection) {
      const validation = validateVideoUrl(cleanUrl);
      const contentItem = {
        ...detection,
        index,
        isValid: validation.isValid,
        error: validation.error,
        embedUrl: generateEmbedUrl(detection.type, detection.id),
        thumbnail: getVideoThumbnail(detection.type, detection.id),
        platformName: getVideoPlatformName(detection.type)
      };

      // Add VLR.gg specific properties
      if (detection.type === 'vlrgg') {
        contentItem.isEsportsContent = true;
        contentItem.requiresApi = true;
        contentItem.contentType = detection.contentType;
        contentItem.slug = detection.slug;
        contentItem.displayUrl = detection.displayUrl;
      }

      videos.push(contentItem);
    }
  });
  
  return videos;
};

export default {
  detectVideoUrl,
  extractVideoUrls,
  generateEmbedUrl,
  processContentForVideos,
  restoreVideoUrls,
  validateVideoUrl,
  getVideoThumbnail,
  getVideoPlatformName,
  hasVideoUrls,
  getVideoAspectRatio,
  detectAllVideoUrls
};