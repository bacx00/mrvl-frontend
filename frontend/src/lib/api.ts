// src/lib/api.ts
// Centralized API client with TypeScript, error handling, and mobile optimization

import { 
  User, 
  Match, 
  MatchDetails, 
  Event, 
  EventDetails, 
  NewsArticle, 
  Team, 
  Player, 
  ForumThread, 
  ForumPost, 
  ForumCategory, 
  Ranking, 
  Statistics,
  ApiResponse,
  LoginCredentials,
  RegisterData,
  ApiError
} from './types';

// API Configuration
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
const DEFAULT_TIMEOUT = 10000; // 10 seconds
const MOBILE_TIMEOUT = 15000; // 15 seconds for mobile

// Mobile device detection
const isMobile = () => {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  return false;
};

// Request configuration
const getRequestConfig = (): RequestInit => {
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
  };

  // Add authentication token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }
  }

  return config;
};

// Enhanced error handling
class APIError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Generic response unwrapper
const unwrap = <T>(payload: any): T => {
  if (Array.isArray(payload)) return payload as T;
  if (Array.isArray(payload?.data)) return payload.data as T;
  if (payload?.data) return payload.data as T;
  return payload as T;
};

// Enhanced fetch with retry logic and mobile optimization
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  retries: number = 3
): Promise<T> {
  const url = `${API_BASE_URL}/${String(endpoint).replace(/^\/+/, '')}`;
  const timeout = isMobile() ? MOBILE_TIMEOUT : DEFAULT_TIMEOUT;
  
  const config = {
    ...getRequestConfig(),
    ...options,
    headers: {
      ...getRequestConfig().headers,
      ...options.headers,
    },
  };

  // Add timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorDetails;

      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
        errorDetails = errorData;
      } catch {
        // Response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }

      throw new APIError(errorMessage, response.status, errorDetails?.code, errorDetails);
    }

    const data = await response.json();
    return unwrap<T>(data);

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle network errors with retry logic
    if (error instanceof APIError) {
      throw error;
    }

    if (error.name === 'AbortError') {
      throw new APIError('Request timeout', 408);
    }

    // Retry logic for network errors
    if (retries > 0 && (!error.status || error.status >= 500)) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return apiRequest<T>(endpoint, options, retries - 1);
    }

    throw new APIError(
      error.message || 'Network error occurred',
      error.status || 0
    );
  }
}

// Generic CRUD operations
export const apiGet = <T>(endpoint: string): Promise<T> => 
  apiRequest<T>(endpoint, { method: 'GET' });

export const apiPost = <T>(endpoint: string, data?: any): Promise<T> => 
  apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T>(endpoint: string, data: any): Promise<T> => 
  apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiDelete = <T>(endpoint: string): Promise<T> => 
  apiRequest<T>(endpoint, { method: 'DELETE' });

// ═══════════════════════════════════════════════════════════════
//                        AUTHENTICATION API
// ═══════════════════════════════════════════════════════════════

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<{ user: User; token: string }> => {
    const response = await apiPost<{ user: User; token: string }>('auth/login', credentials);
    
    // Store token for future requests
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    const response = await apiPost<{ user: User; token: string }>('auth/register', data);
    
    // Store token for future requests
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      await apiPost('auth/logout');
    } finally {
      // Clear local storage regardless of API response
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
  },

  me: (): Promise<User> => apiGet<User>('auth/user'),

  refreshToken: async (): Promise<{ token: string }> => {
    const response = await apiPost<{ token: string }>('auth/refresh');
    
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },
};

// ═══════════════════════════════════════════════════════════════
//                          MATCHES API
// ═══════════════════════════════════════════════════════════════

export const matchesAPI = {
  getAll: (params?: { 
    page?: number; 
    limit?: number; 
    status?: 'live' | 'upcoming' | 'completed';
    region?: string;
    team?: string;
  }): Promise<Match[]> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.region) queryParams.append('region', params.region);
    if (params?.team) queryParams.append('team', params.team);
    
    const endpoint = queryParams.toString() ? `matches?${queryParams}` : 'matches';
    return apiGet<Match[]>(endpoint);
  },

  getById: (id: string | number): Promise<MatchDetails> => 
    apiGet<MatchDetails>(`matches/${id}`),

  getLive: (): Promise<Match[]> => 
    apiGet<Match[]>('matches/live'),

  getUpcoming: (): Promise<Match[]> => 
    apiGet<Match[]>('matches/upcoming'),

  getCompleted: (page?: number): Promise<Match[]> => {
    const endpoint = page ? `matches/completed?page=${page}` : 'matches/completed';
    return apiGet<Match[]>(endpoint);
  },
};

// ═══════════════════════════════════════════════════════════════
//                          EVENTS API
// ═══════════════════════════════════════════════════════════════

export const eventsAPI = {
  getAll: (): Promise<Event[]> => apiGet<Event[]>('events'),
  getById: (id: string | number): Promise<EventDetails> => apiGet<EventDetails>(`events/${id}`),
  getUpcoming: (): Promise<Event[]> => apiGet<Event[]>('events/upcoming'),
  getOngoing: (): Promise<Event[]> => apiGet<Event[]>('events/ongoing'),
};

// ═══════════════════════════════════════════════════════════════
//                          TEAMS & PLAYERS API
// ═══════════════════════════════════════════════════════════════

export const teamsAPI = {
  getAll: (): Promise<Team[]> => apiGet<Team[]>('teams'),
  getById: (id: string | number): Promise<Team> => apiGet<Team>(`teams/${id}`),
  getRankings: (region?: string): Promise<Ranking[]> => {
    const endpoint = region ? `teams/rankings?region=${region}` : 'teams/rankings';
    return apiGet<Ranking[]>(endpoint);
  },
};

export const playersAPI = {
  getAll: (): Promise<Player[]> => apiGet<Player[]>('players'),
  getById: (id: string | number): Promise<Player> => apiGet<Player>(`players/${id}`),
  getByTeam: (teamId: string | number): Promise<Player[]> => 
    apiGet<Player[]>(`teams/${teamId}/players`),
};

// ═══════════════════════════════════════════════════════════════
//                          FORUMS API
// ═══════════════════════════════════════════════════════════════

export const forumsAPI = {
  getCategories: (): Promise<ForumCategory[]> => apiGet<ForumCategory[]>('forums/categories'),
  
  getThreads: (categoryId: string): Promise<ForumThread[]> => 
    apiGet<ForumThread[]>(`forums/categories/${categoryId}/threads`),
  
  getThread: (threadId: string | number): Promise<ForumThread> => 
    apiGet<ForumThread>(`forums/threads/${threadId}`),
  
  getPosts: (threadId: string | number, page?: number): Promise<ForumPost[]> => {
    const endpoint = page ? `forums/threads/${threadId}/posts?page=${page}` : `forums/threads/${threadId}/posts`;
    return apiGet<ForumPost[]>(endpoint);
  },
  
  createThread: (categoryId: string, data: { title: string; content: string }): Promise<ForumThread> => 
    apiPost<ForumThread>(`forums/categories/${categoryId}/threads`, data),
  
  createPost: (threadId: string | number, content: string): Promise<ForumPost> => 
    apiPost<ForumPost>(`forums/threads/${threadId}/posts`, { content }),
  
  getTrending: (): Promise<ForumThread[]> => apiGet<ForumThread[]>('forums/trending'),
};

// ═══════════════════════════════════════════════════════════════
//                          NEWS API
// ═══════════════════════════════════════════════════════════════

export const newsAPI = {
  getAll: (page?: number): Promise<NewsArticle[]> => {
    const endpoint = page ? `news?page=${page}` : 'news';
    return apiGet<NewsArticle[]>(endpoint);
  },
  getById: (id: string | number): Promise<NewsArticle> => apiGet<NewsArticle>(`news/${id}`),
  getFeatured: (): Promise<NewsArticle[]> => apiGet<NewsArticle[]>('news/featured'),
};

// ═══════════════════════════════════════════════════════════════
//                          RANKINGS API
// ═══════════════════════════════════════════════════════════════

export const rankingsAPI = {
  getTeams: (region?: 'global' | 'americas' | 'emea' | 'apac'): Promise<Ranking[]> => {
    const endpoint = region ? `rankings/teams?region=${region}` : 'rankings/teams';
    return apiGet<Ranking[]>(endpoint);
  },
  getPlayers: (region?: string): Promise<Ranking[]> => {
    const endpoint = region ? `rankings/players?region=${region}` : 'rankings/players';
    return apiGet<Ranking[]>(endpoint);
  },
};

// ═══════════════════════════════════════════════════════════════
//                          STATISTICS API
// ═══════════════════════════════════════════════════════════════

export const statsAPI = {
  getOverview: (): Promise<Statistics> => apiGet<Statistics>('stats'),
  getTeamStats: (teamId: string | number): Promise<any> => apiGet(`stats/teams/${teamId}`),
  getPlayerStats: (playerId: string | number): Promise<any> => apiGet(`stats/players/${playerId}`),
};

// ═══════════════════════════════════════════════════════════════
//                          ADMIN API
// ═══════════════════════════════════════════════════════════════

export const adminAPI = {
  getStats: (): Promise<any> => apiGet('admin/stats'),
  getUsers: (): Promise<User[]> => apiGet<User[]>('admin/users'),
  updateUser: (userId: string | number, data: any): Promise<User> => 
    apiPut<User>(`admin/users/${userId}`, data),
};

// Legacy exports for backward compatibility
export const fetchMatches = () => matchesAPI.getAll();
export const fetchMatch = (id: string | number) => matchesAPI.getById(id);
export const fetchEvents = () => eventsAPI.getAll();
export const fetchNews = () => newsAPI.getAll();

// Export error class for error handling
export { APIError };
