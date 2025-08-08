/**
 * VLR.gg API Service
 * Integrates with unofficial VLR.gg APIs to fetch Valorant esports data
 * Based on research: https://vlrggapi.vercel.app and https://vlresports.vercel.app
 */

// VLR.gg API endpoints
const VLR_API_BASE = 'https://vlrggapi.vercel.app';
const VLR_ESPORTS_API_BASE = 'https://vlresports.vercel.app';

// Request configuration
const REQUEST_TIMEOUT = 10000; // 10 seconds
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simple in-memory cache for API responses
const apiCache = new Map();

/**
 * Make API request with caching and error handling
 * @param {string} url - API endpoint URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - API response
 */
const apiRequest = async (url, options = {}) => {
  // Check cache first
  const cacheKey = url;
  const cached = apiCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MRVL-News-Integration',
        ...options.headers
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`VLR.gg API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache successful response
    apiCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  } catch (error) {
    console.error('VLR.gg API request failed:', error);
    throw new Error(`Failed to fetch VLR.gg data: ${error.message}`);
  }
};

/**
 * Fetch latest news from VLR.gg
 * @returns {Promise<Array>} - Array of news articles
 */
export const fetchVLRNews = async () => {
  try {
    const data = await apiRequest(`${VLR_API_BASE}/news`);
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error fetching VLR news:', error);
    return [];
  }
};

/**
 * Fetch match information by ID
 * @param {string} matchId - Match ID from VLR.gg
 * @returns {Promise<Object|null>} - Match data or null
 */
export const fetchVLRMatch = async (matchId) => {
  if (!matchId) return null;
  
  try {
    const data = await apiRequest(`${VLR_API_BASE}/match/${matchId}`);
    return data;
  } catch (error) {
    console.error('Error fetching VLR match:', error);
    return null;
  }
};

/**
 * Fetch recent matches
 * @param {Object} filters - Match filters
 * @returns {Promise<Array>} - Array of matches
 */
export const fetchVLRMatches = async (filters = {}) => {
  try {
    let url = `${VLR_API_BASE}/matches`;
    const params = new URLSearchParams();
    
    if (filters.region) params.append('region', filters.region);
    if (filters.limit) params.append('limit', filters.limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const data = await apiRequest(url);
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error fetching VLR matches:', error);
    return [];
  }
};

/**
 * Search for teams on VLR.gg
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of team results
 */
export const searchVLRTeams = async (query) => {
  if (!query || query.trim().length < 2) return [];
  
  try {
    const data = await apiRequest(`${VLR_API_BASE}/teams?search=${encodeURIComponent(query)}`);
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error searching VLR teams:', error);
    return [];
  }
};

/**
 * Fetch team information by ID
 * @param {string} teamId - Team ID from VLR.gg
 * @returns {Promise<Object|null>} - Team data or null
 */
export const fetchVLRTeam = async (teamId) => {
  if (!teamId) return null;
  
  try {
    const data = await apiRequest(`${VLR_API_BASE}/team/${teamId}`);
    return data;
  } catch (error) {
    console.error('Error fetching VLR team:', error);
    return null;
  }
};

/**
 * Fetch events/tournaments
 * @param {Object} filters - Event filters
 * @returns {Promise<Array>} - Array of events
 */
export const fetchVLREvents = async (filters = {}) => {
  try {
    let url = `${VLR_API_BASE}/events`;
    const params = new URLSearchParams();
    
    if (filters.region) params.append('region', filters.region);
    if (filters.limit) params.append('limit', filters.limit);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const data = await apiRequest(url);
    return Array.isArray(data) ? data : data.data || [];
  } catch (error) {
    console.error('Error fetching VLR events:', error);
    return [];
  }
};

/**
 * Parse VLR.gg URL to extract relevant information
 * @param {string} url - VLR.gg URL
 * @returns {Object|null} - Parsed URL data or null
 */
export const parseVLRUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Clean up URL
  url = url.trim();
  
  // VLR.gg URL patterns
  const patterns = [
    {
      type: 'match',
      pattern: /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/(\d+)\/([^\/\s]+)(?:\/.*)?/,
      extract: (match) => ({
        type: 'match',
        id: match[1],
        slug: match[2],
        originalUrl: url,
        displayUrl: `https://www.vlr.gg/${match[1]}/${match[2]}`
      })
    },
    {
      type: 'team',
      pattern: /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/team\/(\d+)\/([^\/\s]+)(?:\/.*)?/,
      extract: (match) => ({
        type: 'team',
        id: match[1],
        slug: match[2],
        originalUrl: url,
        displayUrl: `https://www.vlr.gg/team/${match[1]}/${match[2]}`
      })
    },
    {
      type: 'event',
      pattern: /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/event\/(\d+)\/([^\/\s]+)(?:\/.*)?/,
      extract: (match) => ({
        type: 'event',
        id: match[1],
        slug: match[2],
        originalUrl: url,
        displayUrl: `https://www.vlr.gg/event/${match[1]}/${match[2]}`
      })
    },
    {
      type: 'player',
      pattern: /(?:https?:\/\/)?(?:www\.)?vlr\.gg\/player\/(\d+)\/([^\/\s]+)(?:\/.*)?/,
      extract: (match) => ({
        type: 'player',
        id: match[1],
        slug: match[2],
        originalUrl: url,
        displayUrl: `https://www.vlr.gg/player/${match[1]}/${match[2]}`
      })
    }
  ];

  for (const { pattern, extract } of patterns) {
    const match = url.match(pattern);
    if (match) {
      return extract(match);
    }
  }

  return null;
};

/**
 * Validate VLR.gg URL
 * @param {string} url - URL to validate
 * @returns {Object} - Validation result
 */
export const validateVLRUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'URL is required' };
  }

  const parsed = parseVLRUrl(url);
  if (!parsed) {
    return { 
      isValid: false, 
      error: 'Invalid VLR.gg URL. Supported: matches, teams, events, players' 
    };
  }

  return { isValid: true, type: parsed.type, data: parsed };
};

/**
 * Fetch enriched data for a VLR.gg URL
 * @param {string} url - VLR.gg URL
 * @returns {Promise<Object|null>} - Enriched data or null
 */
export const fetchVLRUrlData = async (url) => {
  const validation = validateVLRUrl(url);
  if (!validation.isValid) {
    return null;
  }

  const { type, data } = validation;
  
  try {
    switch (type) {
      case 'match':
        const matchData = await fetchVLRMatch(data.id);
        return { ...data, matchData, enriched: true };
        
      case 'team':
        const teamData = await fetchVLRTeam(data.id);
        return { ...data, teamData, enriched: true };
        
      case 'event':
        // Events might need different endpoint or handling
        return { ...data, enriched: false };
        
      case 'player':
        // Players might need different endpoint or handling
        return { ...data, enriched: false };
        
      default:
        return data;
    }
  } catch (error) {
    console.error('Error fetching VLR URL data:', error);
    return { ...data, enriched: false, error: error.message };
  }
};

/**
 * Generate VLR.gg embed card data
 * @param {Object} vlrData - VLR.gg data from parseVLRUrl or fetchVLRUrlData
 * @returns {Object} - Embed card data
 */
export const generateVLREmbedData = (vlrData) => {
  if (!vlrData) return null;

  const baseCard = {
    type: 'vlr-embed',
    platform: 'VLR.gg',
    originalUrl: vlrData.originalUrl,
    displayUrl: vlrData.displayUrl,
    contentType: vlrData.type
  };

  switch (vlrData.type) {
    case 'match':
      return {
        ...baseCard,
        title: vlrData.matchData?.teams?.map(t => t.name).join(' vs ') || 'Valorant Match',
        subtitle: vlrData.matchData?.event?.name || 'Match Details',
        description: vlrData.matchData?.status || 'View match details and stats on VLR.gg',
        thumbnail: vlrData.matchData?.teams?.[0]?.logo || null,
        metadata: {
          status: vlrData.matchData?.status,
          score: vlrData.matchData?.score,
          date: vlrData.matchData?.date,
          event: vlrData.matchData?.event?.name
        }
      };
      
    case 'team':
      return {
        ...baseCard,
        title: vlrData.teamData?.name || 'Valorant Team',
        subtitle: vlrData.teamData?.region || 'Team Profile',
        description: vlrData.teamData?.description || 'View team roster, matches, and stats on VLR.gg',
        thumbnail: vlrData.teamData?.logo || null,
        metadata: {
          region: vlrData.teamData?.region,
          rank: vlrData.teamData?.rank,
          winRate: vlrData.teamData?.winRate
        }
      };
      
    case 'event':
      return {
        ...baseCard,
        title: vlrData.slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Valorant Tournament',
        subtitle: 'Tournament Details',
        description: 'View tournament bracket, matches, and results on VLR.gg',
        thumbnail: null
      };
      
    case 'player':
      return {
        ...baseCard,
        title: vlrData.slug?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Valorant Player',
        subtitle: 'Player Profile',
        description: 'View player stats, match history, and achievements on VLR.gg',
        thumbnail: null
      };
      
    default:
      return {
        ...baseCard,
        title: 'VLR.gg Content',
        subtitle: 'Valorant Esports',
        description: 'View on VLR.gg for the latest Valorant esports content',
        thumbnail: null
      };
  }
};

/**
 * Check VLR.gg API health status
 * @returns {Promise<Object>} - Health status
 */
export const checkVLRApiHealth = async () => {
  try {
    const response = await fetch(`${VLR_API_BASE}/status`, {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      available: response.ok,
      status: response.status,
      timestamp: Date.now()
    };
  } catch (error) {
    return {
      available: false,
      error: error.message,
      timestamp: Date.now()
    };
  }
};

export default {
  fetchVLRNews,
  fetchVLRMatch,
  fetchVLRMatches,
  searchVLRTeams,
  fetchVLRTeam,
  fetchVLREvents,
  parseVLRUrl,
  validateVLRUrl,
  fetchVLRUrlData,
  generateVLREmbedData,
  checkVLRApiHealth
};