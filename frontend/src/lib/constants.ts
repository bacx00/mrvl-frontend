// src/lib/constants.ts
// App-wide constants and configuration for MRVL.net

// ═══════════════════════════════════════════════════════════════
//                        BRAND & THEME
// ═══════════════════════════════════════════════════════════════

export const BRAND = {
  NAME: 'MRVL.net',
  TAGLINE: 'The Home of Marvel Rivals Esports',
  DESCRIPTION: 'Your ultimate destination for Marvel Rivals competitive gaming - matches, rankings, events, and community.',
  LOGO_URL: '/logo.svg',
  FAVICON_URL: '/favicon.ico',
  SOCIAL_IMAGE: '/social-preview.jpg',
} as const;

// VLR.gg exact color matching
export const COLORS = {
  // Primary backgrounds
  PRIMARY_DARK: '#0f1419',
  CARD_BACKGROUND: '#1a2332',
  BORDER: '#2b3d4d',
  
  // Brand colors
  MARVEL_RED: '#fa4454',
  ACCENT: '#fa4454',
  
  // Text colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#768894',
  TEXT_MUTED: '#556b7a',
  
  // Status colors
  LIVE_GREEN: '#4ade80',
  WARNING_ORANGE: '#f59e0b',
  SUCCESS: '#10b981',
  ERROR: '#ef4444',
  
  // Additional UI colors
  HOVER: '#2d3748',
  SELECTED: '#374151',
  DISABLED: '#4a5568',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        TYPOGRAPHY
// ═══════════════════════════════════════════════════════════════

export const TYPOGRAPHY = {
  FONT_FAMILY: {
    SYSTEM: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    MONO: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  SIZES: {
    H1: '32px',
    H2: '24px',
    H3: '18px',
    BODY: '14px',
    SMALL: '12px',
    TINY: '10px',
  },
  WEIGHTS: {
    REGULAR: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        BREAKPOINTS
// ═══════════════════════════════════════════════════════════════

export const BREAKPOINTS = {
  XS: 375,  // iPhone SE
  SM: 768,  // Tablet portrait
  MD: 1024, // Tablet landscape
  LG: 1440, // Desktop
  XL: 1920, // Large desktop
} as const;

export const MEDIA_QUERIES = {
  XS: `(min-width: ${BREAKPOINTS.XS}px)`,
  SM: `(min-width: ${BREAKPOINTS.SM}px)`,
  MD: `(min-width: ${BREAKPOINTS.MD}px)`,
  LG: `(min-width: ${BREAKPOINTS.LG}px)`,
  XL: `(min-width: ${BREAKPOINTS.XL}px)`,
  MOBILE: `(max-width: ${BREAKPOINTS.SM - 1}px)`,
  TABLET: `(min-width: ${BREAKPOINTS.SM}px) and (max-width: ${BREAKPOINTS.MD - 1}px)`,
  DESKTOP: `(min-width: ${BREAKPOINTS.MD}px)`,
} as const;

// ═══════════════════════════════════════════════════════════════
//                        API CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  TIMEOUT: {
    DEFAULT: 10000,
    MOBILE: 15000,
    UPLOAD: 30000,
  },
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 1000,
  },
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      ME: '/auth/user',
      REFRESH: '/auth/refresh',
    },
    
    // Matches
    MATCHES: {
      LIST: '/matches',
      DETAIL: '/matches/:id',
      LIVE: '/matches/live',
      UPCOMING: '/matches/upcoming',
      COMPLETED: '/matches/completed',
    },
    
    // Events
    EVENTS: {
      LIST: '/events',
      DETAIL: '/events/:id',
      UPCOMING: '/events/upcoming',
      ONGOING: '/events/ongoing',
    },
    
    // Teams & Players
    TEAMS: {
      LIST: '/teams',
      DETAIL: '/teams/:id',
      RANKINGS: '/teams/rankings',
    },
    PLAYERS: {
      LIST: '/players',
      DETAIL: '/players/:id',
      BY_TEAM: '/teams/:teamId/players',
    },
    
    // Forums
    FORUMS: {
      CATEGORIES: '/forums/categories',
      THREADS: '/forums/categories/:categoryId/threads',
      THREAD_DETAIL: '/forums/threads/:threadId',
      POSTS: '/forums/threads/:threadId/posts',
      TRENDING: '/forums/trending',
    },
    
    // News
    NEWS: {
      LIST: '/news',
      DETAIL: '/news/:id',
      FEATURED: '/news/featured',
    },
    
    // Rankings
    RANKINGS: {
      TEAMS: '/rankings/teams',
      PLAYERS: '/rankings/players',
    },
    
    // Statistics
    STATS: {
      OVERVIEW: '/stats',
      TEAMS: '/stats/teams/:teamId',
      PLAYERS: '/stats/players/:playerId',
    },
    
    // Admin
    ADMIN: {
      STATS: '/admin/stats',
      USERS: '/admin/users',
      USER_DETAIL: '/admin/users/:userId',
    },
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        ROUTES
// ═══════════════════════════════════════════════════════════════

export const ROUTES = {
  HOME: '/',
  
  // Authentication
  LOGIN: '/user/login',
  REGISTER: '/user/register',
  PROFILE: '/user/profile',
  SETTINGS: '/user/settings',
  
  // Matches
  MATCHES: '/matches',
  MATCH_DETAIL: '/matches/:id',
  
  // Events
  EVENTS: '/events',
  EVENT_DETAIL: '/events/:id',
  
  // Forums
  FORUMS: '/forums',
  FORUM_CATEGORY: '/forums/:category',
  FORUM_THREAD: '/forums/:category/:thread',
  FORUM_TRENDING: '/forums/trending',
  
  // Teams & Players
  TEAMS: '/teams',
  TEAM_DETAIL: '/teams/:id',
  PLAYERS: '/players',
  PLAYER_DETAIL: '/players/:id',
  
  // Rankings
  RANKINGS: '/rankings',
  
  // Statistics
  STATS: '/stats',
  
  // News
  NEWS: '/news',
  NEWS_DETAIL: '/news/:id',
  
  // Admin
  ADMIN: '/admin',
  ADMIN_MATCHES: '/admin/matches',
  ADMIN_EVENTS: '/admin/events',
  ADMIN_FORUMS: '/admin/forums',
  ADMIN_USERS: '/admin/users',
  
  // Content Creation
  WRITER: '/writer',
  WRITER_ARTICLES: '/writer/articles',
  WRITER_EDITOR: '/writer/editor',
  EDITOR: '/editor',
  
  // Legal
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ABOUT: '/about',
  CONTACT: '/contact',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        ANIMATION SETTINGS
// ═══════════════════════════════════════════════════════════════

export const ANIMATIONS = {
  DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  EASING: {
    EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
    EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
    EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        FILE UPLOAD LIMITS
// ═══════════════════════════════════════════════════════════════

export const FILE_LIMITS = {
  MAX_SIZE: {
    AVATAR: 2 * 1024 * 1024, // 2MB
    IMAGE: 5 * 1024 * 1024,  // 5MB
    DOCUMENT: 10 * 1024 * 1024, // 10MB
  },
  ALLOWED_TYPES: {
    IMAGES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    DOCUMENTS: ['application/pdf', 'text/plain'],
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        PAGINATION
// ═══════════════════════════════════════════════════════════════

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZES: [10, 20, 50, 100],
  MAX_PAGE_SIZE: 100,
} as const;

// ═══════════════════════════════════════════════════════════════
//                        CACHE SETTINGS
// ═══════════════════════════════════════════════════════════════

export const CACHE = {
  TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    VERY_LONG: 86400, // 24 hours
  },
  KEYS: {
    USER: 'user',
    MATCHES: 'matches',
    EVENTS: 'events',
    TEAMS: 'teams',
    PLAYERS: 'players',
    NEWS: 'news',
    FORUMS: 'forums',
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        ERROR MESSAGES
// ═══════════════════════════════════════════════════════════════

export const ERROR_MESSAGES = {
  NETWORK: 'Network error occurred. Please check your connection.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  LOGIN_FAILED: 'Invalid email or password.',
  REGISTRATION_FAILED: 'Registration failed. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a supported format.',
  GENERIC: 'Something went wrong. Please try again.',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        SUCCESS MESSAGES
// ═══════════════════════════════════════════════════════════════

export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  REGISTRATION: 'Account created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  POST_CREATED: 'Post created successfully!',
  POST_UPDATED: 'Post updated successfully!',
  POST_DELETED: 'Post deleted successfully!',
  THREAD_CREATED: 'Thread created successfully!',
  FILE_UPLOADED: 'File uploaded successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        FORUM CONFIGURATION
// ═══════════════════════════════════════════════════════════════

export const FORUM = {
  CATEGORIES: {
    GENERAL: 'general',
    MATCHES: 'matches',
    TEAMS: 'teams',
    STRATEGIES: 'strategies',
    TECH_SUPPORT: 'tech-support',
    OFF_TOPIC: 'off-topic',
  },
  POST_LIMITS: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 10000,
  },
  THREAD_LIMITS: {
    TITLE_MIN: 5,
    TITLE_MAX: 200,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        MATCH STATUSES
// ═══════════════════════════════════════════════════════════════

export const MATCH_STATUS = {
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  POSTPONED: 'postponed',
} as const;

export const MATCH_STATUS_LABELS = {
  [MATCH_STATUS.SCHEDULED]: 'Scheduled',
  [MATCH_STATUS.LIVE]: 'LIVE',
  [MATCH_STATUS.COMPLETED]: 'Completed',
  [MATCH_STATUS.CANCELLED]: 'Cancelled',
  [MATCH_STATUS.POSTPONED]: 'Postponed',
} as const;

export const MATCH_STATUS_COLORS = {
  [MATCH_STATUS.SCHEDULED]: COLORS.TEXT_SECONDARY,
  [MATCH_STATUS.LIVE]: COLORS.LIVE_GREEN,
  [MATCH_STATUS.COMPLETED]: COLORS.TEXT_PRIMARY,
  [MATCH_STATUS.CANCELLED]: COLORS.ERROR,
  [MATCH_STATUS.POSTPONED]: COLORS.WARNING_ORANGE,
} as const;

// ═══════════════════════════════════════════════════════════════
//                        REGIONS
// ═══════════════════════════════════════════════════════════════

export const REGIONS = {
  GLOBAL: 'global',
  AMERICAS: 'americas',
  EMEA: 'emea',
  APAC: 'apac',
  CHINA: 'china',
} as const;

export const REGION_LABELS = {
  [REGIONS.GLOBAL]: 'Global',
  [REGIONS.AMERICAS]: 'Americas',
  [REGIONS.EMEA]: 'EMEA',
  [REGIONS.APAC]: 'APAC',
  [REGIONS.CHINA]: 'China',
} as const;

export const REGION_FLAGS = {
  [REGIONS.GLOBAL]: '🌍',
  [REGIONS.AMERICAS]: '🌎',
  [REGIONS.EMEA]: '🌍',
  [REGIONS.APAC]: '🌏',
  [REGIONS.CHINA]: '🇨🇳',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        USER ROLES
// ═══════════════════════════════════════════════════════════════

export const USER_ROLES = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  WRITER: 'writer',
  EDITOR: 'editor',
} as const;

export const ROLE_PERMISSIONS = {
  [USER_ROLES.USER]: ['read', 'post', 'comment'],
  [USER_ROLES.MODERATOR]: ['read', 'post', 'comment', 'moderate', 'delete_posts'],
  [USER_ROLES.ADMIN]: ['*'], // All permissions
  [USER_ROLES.WRITER]: ['read', 'post', 'comment', 'write_articles'],
  [USER_ROLES.EDITOR]: ['read', 'post', 'comment', 'write_articles', 'edit_articles', 'publish'],
} as const;

// ═══════════════════════════════════════════════════════════════
//                        SOCIAL LINKS
// ═══════════════════════════════════════════════════════════════

export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/mrvlnet',
  DISCORD: 'https://discord.gg/mrvlnet',
  YOUTUBE: 'https://youtube.com/mrvlnet',
  TWITCH: 'https://twitch.tv/mrvlnet',
  INSTAGRAM: 'https://instagram.com/mrvlnet',
  REDDIT: 'https://reddit.com/r/mrvlnet',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        META DEFAULTS
// ═══════════════════════════════════════════════════════════════

export const META_DEFAULTS = {
  TITLE: 'MRVL.net - Marvel Rivals Esports Hub',
  DESCRIPTION: 'The ultimate hub for Marvel Rivals competitive gaming. Track matches, view rankings, join discussions, and stay updated with the latest esports news.',
  KEYWORDS: [
    'Marvel Rivals',
    'esports',
    'competitive gaming',
    'matches',
    'rankings',
    'tournaments',
    'gaming community',
    'Marvel',
    'superhero gaming'
  ],
  AUTHOR: 'MRVL.net Team',
  ROBOTS: 'index,follow',
  LANGUAGE: 'en',
  REGION: 'US',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        REAL-TIME CHANNELS
// ═══════════════════════════════════════════════════════════════

export const PUSHER_CHANNELS = {
  LIVE_MATCHES: 'live-matches',
  FORUM_UPDATES: 'forum-updates',
  USER_NOTIFICATIONS: 'user-notifications',
  GLOBAL_EVENTS: 'global-events',
  MATCH_UPDATES: 'match-updates',
  EVENT_UPDATES: 'event-updates',
} as const;

export const PUSHER_EVENTS = {
  MATCH_UPDATED: 'match-updated',
  MATCH_STARTED: 'match-started',
  MATCH_ENDED: 'match-ended',
  NEW_POST: 'new-post',
  POST_UPDATED: 'post-updated',
  POST_DELETED: 'post-deleted',
  NOTIFICATION: 'notification',
  MENTION: 'mention',
  MESSAGE: 'message',
  ANNOUNCEMENT: 'announcement',
  SYSTEM_MESSAGE: 'system-message',
  BRACKET_UPDATED: 'bracket-updated',
  MATCH_SCHEDULED: 'match-scheduled',
  EVENT_UPDATED: 'event-updated',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        PERFORMANCE SETTINGS
// ═══════════════════════════════════════════════════════════════

export const PERFORMANCE = {
  INTERSECTION_OBSERVER: {
    ROOT_MARGIN: '50px',
    THRESHOLD: 0.1,
  },
  VIRTUAL_SCROLL: {
    ITEM_HEIGHT: 80,
    OVERSCAN: 5,
  },
  DEBOUNCE_DELAYS: {
    SEARCH: 300,
    RESIZE: 100,
    SCROLL: 50,
  },
  THROTTLE_DELAYS: {
    SCROLL: 16, // ~60fps
    RESIZE: 100,
    API_CALLS: 1000,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        LOCAL STORAGE KEYS
// ═══════════════════════════════════════════════════════════════

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'preferences',
  DRAFT_POSTS: 'draft_posts',
  SEARCH_HISTORY: 'search_history',
  VIEWED_MATCHES: 'viewed_matches',
  NOTIFICATION_SETTINGS: 'notification_settings',
} as const;

// ═══════════════════════════════════════════════════════════════
//                        VALIDATION RULES
// ═══════════════════════════════════════════════════════════════

export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 30,
    PATTERN: /^[a-zA-Z0-9_-]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: false,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  POST_CONTENT: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 10000,
  },
  THREAD_TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 200,
  },
} as const;

// ═══════════════════════════════════════════════════════════════
//                        FEATURE FLAGS
// ═══════════════════════════════════════════════════════════════

export const FEATURES = {
  BETA_FEATURES: process.env.NODE_ENV === 'development',
  REAL_TIME_UPDATES: true,
  PUSH_NOTIFICATIONS: true,
  DARK_MODE: true,
  ANALYTICS: process.env.NODE_ENV === 'production',
  PWA: true,
  OFFLINE_SUPPORT: true,
  ADVANCED_SEARCH: true,
  USER_PROFILES: true,
  SOCIAL_LOGIN: true,
  FILE_UPLOADS: true,
  COMMENTS_SYSTEM: true,
  VOTING_SYSTEM: true,
  ACHIEVEMENTS: false, // Coming soon
  BETTING: false, // Future feature
  LIVE_STREAMING: false, // Future feature
} as const;

// ═══════════════════════════════════════════════════════════════
//                        ENVIRONMENT CONFIG
// ═══════════════════════════════════════════════════════════════

export const ENV = {
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_TEST: process.env.NODE_ENV === 'test',
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  PUSHER_KEY: process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  PUSHER_CLUSTER: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2',
  ANALYTICS_ID: process.env.NEXT_PUBLIC_ANALYTICS_ID || '',
} as const;
