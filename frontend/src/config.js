// ⚠️ CRITICAL FIX: Use environment variable for backend URL
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net',
  API_URL: (process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net') + '/api',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'production',
  
  // COMPREHENSIVE API ENDPOINTS - CRITICAL FIX
  ENDPOINTS: {
    // Team Management
    TEAMS: '/teams',
    ADMIN_TEAMS: '/admin/teams',
    TEAM_BY_ID: (id) => `/teams/${id}`,
    ADMIN_TEAM_BY_ID: (id) => `/admin/teams/${id}`,
    
    // Player Management  
    PLAYERS: '/players',
    ADMIN_PLAYERS: '/admin/players',
    PLAYER_BY_ID: (id) => `/players/${id}`,
    ADMIN_PLAYER_BY_ID: (id) => `/admin/players/${id}`,
    
    // Match Management
    MATCHES: '/matches',
    ADMIN_MATCHES: '/admin/matches', 
    MATCH_BY_ID: (id) => `/matches/${id}`,
    ADMIN_MATCH_BY_ID: (id) => `/admin/matches/${id}`,
    
    // Event Management
    EVENTS: '/events',
    ADMIN_EVENTS: '/admin/events',
    EVENT_BY_ID: (id) => `/events/${id}`,
    ADMIN_EVENT_BY_ID: (id) => `/admin/events/${id}`,
    
    // Forum Management
    FORUMS: '/forums',
    THREADS: '/threads', 
    THREAD_BY_ID: (id) => `/threads/${id}`,
    POSTS: '/posts',
    POST_BY_ID: (id) => `/posts/${id}`,
    
    // User Management
    USERS: '/users',
    ADMIN_USERS: '/admin/users',
    USER_BY_ID: (id) => `/users/${id}`,
    ADMIN_USER_BY_ID: (id) => `/admin/users/${id}`,
    
    // Authentication
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    
    // File Uploads
    UPLOAD_TEAM_LOGO: (teamId) => `/upload/team/${teamId}/logo`,
    UPLOAD_TEAM_FLAG: (teamId) => `/upload/team/${teamId}/flag`,
    UPLOAD_TEAM_COACH_AVATAR: (teamId) => `/upload/team/${teamId}/coach-avatar`,
    UPLOAD_PLAYER_AVATAR: (playerId) => `/upload/player/${playerId}/avatar`,
    UPLOAD_EVENT_IMAGE: (eventId) => `/upload/event/${eventId}/image`,
    UPLOAD_NEWS_IMAGE: (newsId) => `/upload/news/${newsId}/image`,
    
    // Statistics and Rankings
    RANKINGS_TEAMS: '/rankings/teams',
    RANKINGS_PLAYERS: '/rankings/players',
    STATS: '/stats',
    
    // News System
    NEWS: '/news',
    ADMIN_NEWS: '/admin/news',
    NEWS_BY_ID: (id) => `/news/${id}`,
    ADMIN_NEWS_BY_ID: (id) => `/admin/news/${id}`,
    
    // Brackets and Tournaments
    BRACKETS: '/brackets',
    BRACKET_BY_ID: (id) => `/brackets/${id}`,
    TOURNAMENTS: '/tournaments'
  }
};

console.log('🔧 API Configuration Loaded:', API_CONFIG);

export default API_CONFIG;// Cache buster: Mon Jun  2 07:52:49 UTC 2025
