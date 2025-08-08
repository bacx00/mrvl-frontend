// Enhanced API client with comprehensive error handling and authentication fixes
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

// API Configuration with environment-based URLs
const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:8000/api';
    } else {
      return `${window.location.protocol}//${host}/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
})().replace(/\/+$/, '');

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MOBILE_TIMEOUT = 45000; // 45 seconds for mobile

// Enhanced mobile detection
const isMobile = () => {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  }
  return false;
};

// Token management
export const TokenManager = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    }
    return null;
  },

  setToken: (token: string, remember: boolean = true): void => {
    if (typeof window !== 'undefined') {
      if (remember) {
        localStorage.setItem('auth_token', token);
        sessionStorage.removeItem('auth_token'); // Remove from session if in local
      } else {
        sessionStorage.setItem('auth_token', token);
        localStorage.removeItem('auth_token'); // Remove from local if in session
      }
    }
  },

  clearToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
    }
  },

  isAuthenticated: (): boolean => {
    return !!TokenManager.getToken();
  }
};

// Enhanced error handling
export class EnhancedAPIError extends Error {
  public readonly status: number;
  public readonly code?: string;
  public readonly details?: any;
  public readonly timestamp: string;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'EnhancedAPIError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

    // Log error for debugging
    if (typeof window !== 'undefined' && window.console) {
      console.error(`API Error [${status}]:`, message, { code, details });
    }
  }

  public isNetworkError(): boolean {
    return this.status === 0 || this.status >= 500;
  }

  public isAuthenticationError(): boolean {
    return this.status === 401;
  }

  public isAuthorizationError(): boolean {
    return this.status === 403;
  }

  public isValidationError(): boolean {
    return this.status === 422;
  }

  public isNotFoundError(): boolean {
    return this.status === 404;
  }
}

// Request interceptor for authentication
const getAuthHeaders = (): Record<string, string> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const token = TokenManager.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

// Enhanced response handler
const handleResponse = async <T>(response: Response): Promise<T> => {
  let data: any;

  // Handle different content types
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = {};
    }
  } else {
    const text = await response.text();
    data = { message: text || `HTTP ${response.status}` };
  }

  if (!response.ok) {
    // Handle authentication errors
    if (response.status === 401) {
      TokenManager.clearToken();
      if (typeof window !== 'undefined') {
        // Redirect to login or trigger authentication modal
        window.dispatchEvent(new CustomEvent('auth:required'));
      }
    }

    const errorMessage = data.message || data.error || `HTTP ${response.status}: ${response.statusText}`;
    throw new EnhancedAPIError(
      errorMessage,
      response.status,
      data.code,
      data
    );
  }

  // Return the data, handling different response formats
  if (Array.isArray(data)) return data as T;
  if (data && typeof data === 'object') {
    // Handle Laravel-style responses
    if (data.data !== undefined) return data.data as T;
    if (data.success && data.data !== undefined) return data.data as T;
    return data as T;
  }

  return data as T;
};

// Enhanced fetch with retry logic and better error handling
export const enhancedApiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 3
): Promise<T> => {
  const url = `${API_BASE_URL}/${endpoint.replace(/^\/+/, '')}`;
  const timeout = isMobile() ? MOBILE_TIMEOUT : DEFAULT_TIMEOUT;

  // Merge headers with auth headers
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include',
  };

  // Add timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  config.signal = controller.signal;

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);
    return await handleResponse<T>(response);

  } catch (error) {
    clearTimeout(timeoutId);

    // Handle AbortError (timeout)
    if (error.name === 'AbortError') {
      throw new EnhancedAPIError('Request timeout', 408);
    }

    // Re-throw APIError instances
    if (error instanceof EnhancedAPIError) {
      throw error;
    }

    // Handle network errors with retry logic
    const isNetworkError = !error.status || error.status === 0;
    const isServerError = error.status && error.status >= 500;

    if (retries > 0 && (isNetworkError || isServerError)) {
      // Exponential backoff
      const delay = (4 - retries) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return enhancedApiRequest<T>(endpoint, options, retries - 1);
    }

    throw new EnhancedAPIError(
      error.message || 'Network error occurred',
      error.status || 0
    );
  }
};

// Enhanced CRUD operations
export const apiGet = <T>(endpoint: string): Promise<T> => 
  enhancedApiRequest<T>(endpoint, { method: 'GET' });

export const apiPost = <T>(endpoint: string, data?: any): Promise<T> => 
  enhancedApiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });

export const apiPut = <T>(endpoint: string, data: any): Promise<T> => 
  enhancedApiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const apiPatch = <T>(endpoint: string, data: any): Promise<T> => 
  enhancedApiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const apiDelete = <T>(endpoint: string): Promise<T> => 
  enhancedApiRequest<T>(endpoint, { method: 'DELETE' });

// ═══════════════════════════════════════════════════════════════
//                    ENHANCED AUTHENTICATION API
// ═══════════════════════════════════════════════════════════════

export const authAPI = {
  login: async (credentials: LoginCredentials, remember: boolean = true): Promise<{ user: User; token: string }> => {
    try {
      const response = await apiPost<{ user: User; token: string; success: boolean }>('auth/login', credentials);
      
      if (response.token) {
        TokenManager.setToken(response.token, remember);
        
        if (typeof window !== 'undefined') {
          const storage = remember ? localStorage : sessionStorage;
          storage.setItem('user', JSON.stringify(response.user));
          window.dispatchEvent(new CustomEvent('auth:login', { detail: response.user }));
        }
      }
      
      return response;
    } catch (error) {
      if (error instanceof EnhancedAPIError) {
        // Enhanced error messages for login
        if (error.status === 401) {
          throw new EnhancedAPIError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
        } else if (error.status === 422) {
          throw new EnhancedAPIError('Please check your email and password format', 422, 'VALIDATION_ERROR', error.details);
        } else if (error.status === 429) {
          throw new EnhancedAPIError('Too many login attempts. Please try again later.', 429, 'RATE_LIMITED');
        }
      }
      throw error;
    }
  },

  register: async (data: RegisterData): Promise<{ user: User; token: string }> => {
    try {
      const response = await apiPost<{ user: User; token: string; success: boolean }>('auth/register', data);
      
      if (response.token) {
        TokenManager.setToken(response.token, true);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.user));
          window.dispatchEvent(new CustomEvent('auth:register', { detail: response.user }));
        }
      }
      
      return response;
    } catch (error) {
      if (error instanceof EnhancedAPIError && error.status === 422) {
        throw new EnhancedAPIError('Registration validation failed', 422, 'VALIDATION_ERROR', error.details);
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiPost('auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed:', error);
    } finally {
      TokenManager.clearToken();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
  },

  me: async (): Promise<User> => {
    try {
      return await apiGet<User>('auth/me');
    } catch (error) {
      if (error instanceof EnhancedAPIError && error.isAuthenticationError()) {
        TokenManager.clearToken();
      }
      throw error;
    }
  },

  refreshToken: async (): Promise<{ token: string }> => {
    try {
      const response = await apiPost<{ token: string }>('auth/refresh');
      
      if (response.token) {
        TokenManager.setToken(response.token, true);
      }
      
      return response;
    } catch (error) {
      TokenManager.clearToken();
      throw error;
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('auth/forgot-password', { email });
  },

  resetPassword: async (data: { email: string; password: string; password_confirmation: string; token: string }): Promise<{ message: string }> => {
    return apiPost<{ message: string }>('auth/reset-password', data);
  }
};

// Export enhanced error class and token manager
export { EnhancedAPIError as APIError, TokenManager };

// Backward compatibility exports
export const fetchMatches = () => apiGet<Match[]>('matches');
export const fetchMatch = (id: string | number) => apiGet<MatchDetails>(`matches/${id}`);
export const fetchEvents = () => apiGet<Event[]>('events');
export const fetchNews = () => apiGet<NewsArticle[]>('news');