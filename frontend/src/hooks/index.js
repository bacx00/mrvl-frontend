import { useState, useEffect, createContext, useContext, useCallback, useMemo } from 'react';
import { API_CONFIG } from '../config';

// API Configuration - Use explicit config
const API_BASE_URL = API_CONFIG.API_URL; // Use API_URL which includes /api

console.log('🔧 API Configuration:', {
  REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
  API_BASE_URL: API_BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  CONFIG: API_CONFIG
});

// Enhanced API client for Laravel backend - BEARER TOKEN ONLY
const api = {
  async request(endpoint, options = {}) {
    // Use the API_URL from config which already includes /api
    let url;
    if (endpoint.startsWith('/')) {
      url = `${API_BASE_URL}${endpoint}`;
    } else {
      url = `${API_BASE_URL}/${endpoint}`;
    }
    
    const token = localStorage.getItem('authToken');
    
    const config = {
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // Laravel requirement
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`🌐 API Request: ${config.method} ${url}`);
      console.log(`📦 Request Data:`, options.body ? (options.body instanceof FormData ? 'FormData' : JSON.parse(options.body)) : 'No body');
      
      const response = await fetch(url, config);
      
      console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
      console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()));
      
      // Get response text first to handle both JSON and text responses
      const responseText = await response.text();
      console.log(`📄 Raw Response:`, responseText.substring(0, 500));
      
      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('⚠️ Non-JSON response received:', responseText.substring(0, 200));
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
      }
      
      // Check if response is successful
      if (!response.ok) {
        console.error(`❌ HTTP Error ${response.status}:`, data);
        
        // Create detailed error message
        let errorMessage = `HTTP ${response.status}`;
        if (data.message) {
          errorMessage += `: ${data.message}`;
        }
        if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          if (Array.isArray(firstError)) {
            errorMessage += ` - ${firstError[0]}`;
          }
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      console.log(`✅ API Success:`, data);
      return data;
    } catch (error) {
      console.error(`❌ API Error (${config.method} ${endpoint}):`, error);
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to server. Please check your connection.');
      }
      
      throw error;
    }
  },

  // FIXED: File uploads using Bearer token only (no CSRF)
  async postFile(endpoint, formData, options = {}) {
    console.log('🔐 File upload - using Bearer token only (no CSRF)...');
    
    let url;
    if (endpoint.startsWith('/')) {
      url = `${API_BASE_URL}${endpoint}`;
    } else {
      url = `${API_BASE_URL}/${endpoint}`;
    }
    
    const token = localStorage.getItem('authToken');
    
    console.log('🔐 File Upload - Auth Token:', token ? 'Found' : 'Missing');
    
    if (!token) {
      throw new Error('Authentication required. Please log in and try again.');
    }
    
    // CRITICAL FIX: Only use Bearer token for file uploads, NO CSRF
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      // REMOVED: No CSRF tokens for file uploads
      ...options.headers,
    };
    
    const config = {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers,
      body: formData,
    };

    try {
      console.log(`🌐 File Upload Request: ${config.method} ${url}`);
      console.log(`📦 FormData keys:`, Array.from(formData.keys()));
      console.log(`📋 Request Headers:`, headers);
      
      const response = await fetch(url, config);
      
      console.log(`📡 File Upload Response Status: ${response.status} ${response.statusText}`);
      console.log(`📋 File Upload Response Headers:`, Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log(`📄 File Upload Raw Response:`, responseText.substring(0, 500));
      
      // No more CSRF error handling - just check for other errors
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.warn('⚠️ File Upload - Non-JSON response received:', responseText.substring(0, 200));
        throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`);
      }
      
      if (!response.ok) {
        console.error(`❌ File Upload HTTP Error ${response.status}:`, data);
        
        let errorMessage = `HTTP ${response.status}`;
        if (data.message) {
          errorMessage += `: ${data.message}`;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      console.log(`✅ File Upload Success:`, data);
      return data;
    } catch (error) {
      console.error(`❌ File Upload Error (${endpoint}):`, error);
      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, data, options = {}) {
    // Handle FormData for file uploads
    const isFormData = data instanceof FormData;
    const config = {
      ...options,
      method: 'POST',
    };
    
    if (isFormData) {
      // Don't set Content-Type for FormData - browser will set it with boundary
      delete config.headers?.['Content-Type'];
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
    
    return this.request(endpoint, config);
  },

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Auth Context
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const response = await api.get('/user');
      // Handle both data structures from backend
      const user = response.data || response.user || response;
      
      // Ensure roles are properly set
      if (user && !user.roles && user.role) {
        user.roles = [user.role];
      }
      
      setUser(user);
      setIsAuthenticated(true);
      console.log('User data fetched successfully:', user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Fetch user data if token exists - WITH TIMEOUT for frontend-only mode
      const initFetchUser = async () => {
        try {
          // Add timeout for frontend-only mode
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('timeout')), 3000)
          );
          
          const userPromise = api.get('/user');
          const response = await Promise.race([userPromise, timeoutPromise]);
          
          // Handle both data structures from backend
          const user = response.data || response.user || response;
          
          // Ensure roles are properly set
          if (user && !user.roles && user.role) {
            user.roles = [user.role];
          }
          
          setUser(user);
          setIsAuthenticated(true);
          console.log('Initial user data loaded:', user);
        } catch (error) {
          console.error('Failed to fetch user from API:', error);
          
          // Try to recover user data from localStorage
          const cachedUserData = localStorage.getItem('userData');
          if (cachedUserData) {
            try {
              const user = JSON.parse(cachedUserData);
              console.log('Recovered user data from cache:', user);
              setUser(user);
              setIsAuthenticated(true);
            } catch (parseError) {
              console.error('Failed to parse cached user data:', parseError);
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            localStorage.removeItem('authToken');
            setUser(null);
            setIsAuthenticated(false);
          }
        } finally {
          setLoading(false);
        }
      };
      initFetchUser();
    } else {
      // No token - set loading to false immediately
      setLoading(false);
    }
  }, []); // No dependencies - only run once on mount

  const login = async (email, password) => {
    try {
      console.log('🔑 Attempting login with:', { email });
      
      const response = await api.post('/auth/login', { 
        email: email.trim(), 
        password: password 
      });
      
      console.log('✅ Login response:', response);
      
      if (response.token && response.user) {
        const token = response.token;
        const userData = response.user;
        
        localStorage.setItem('authToken', token);
        // Also persist user data for role recovery
        localStorage.setItem('userData', JSON.stringify(userData));
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('✅ Login successful, user:', userData);
        return { success: true, user: userData, token };
      } else {
        console.error('❌ Invalid response format:', response);
        throw new Error(response.message || 'Login failed - invalid response format');
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Extract meaningful error message
      let errorMessage = 'Login failed. Please try again.';
      if (error.message.includes('HTTP 401')) {
        errorMessage = 'Invalid email or password.';
      } else if (error.message.includes('HTTP 422')) {
        errorMessage = 'Please check your email and password format.';
      } else if (error.message.includes('Unable to connect')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.message && !error.message.includes('HTTP')) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const register = async (userData) => {
    try {
      console.log('📝 Attempting registration with:', userData);
      
      if (!userData.name || !userData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!userData.email || !userData.email.trim()) {
        throw new Error('Email is required');
      }
      if (!userData.password || userData.password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      if (userData.password !== userData.password_confirmation) {
        throw new Error('Passwords do not match');
      }
      
      const registrationData = {
        name: userData.name.trim(),
        email: userData.email.trim(),
        password: userData.password,
        password_confirmation: userData.password_confirmation
      };
      
      console.log('📝 Sending registration data:', registrationData);
      const response = await api.post('/auth/register', registrationData);
      
      console.log('✅ Registration response:', response);
      
      if (response.token && response.user) {
        const token = response.token;
        const user = response.user;
        
        localStorage.setItem('authToken', token);
        // Also persist user data for role recovery
        localStorage.setItem('userData', JSON.stringify(user));
        setUser(user);
        setIsAuthenticated(true);
        
        console.log('✅ Registration successful, user:', user);
        return { success: true, user: user, token };
      } else {
        console.error('❌ Invalid response format:', response);
        throw new Error(response.message || 'Registration failed - invalid response format');
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.message.includes('HTTP 422')) {
        if (error.data && error.data.errors) {
          const firstError = Object.values(error.data.errors)[0];
          if (Array.isArray(firstError)) {
            errorMessage = firstError[0];
          }
        } else if (error.data && error.data.message) {
          errorMessage = error.data.message;
        }
      } else if (error.message.includes('HTTP 409')) {
        errorMessage = 'This email is already registered. Please try signing in.';
      } else if (error.message.includes('Unable to connect')) {
        errorMessage = 'Unable to connect to server. Please check your connection.';
      } else if (error.message && !error.message.includes('HTTP')) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // FIXED: Handle both array and string roles from Laravel - memoized
  const isAdmin = useCallback(() => {
    if (!user) return false;
    if (Array.isArray(user.roles)) {
      return user.roles.includes('admin') || user.roles.includes('super_admin');
    }
    if (Array.isArray(user.role_names)) {
      return user.role_names.includes('admin') || user.role_names.includes('super_admin');
    }
    return user.role === 'admin' || user.role === 'super_admin';
  }, [user]);

  const isModerator = useCallback(() => {
    if (!user) return false;
    if (Array.isArray(user.roles)) {
      return user.roles.includes('moderator') || user.roles.includes('admin') || user.roles.includes('super_admin');
    }
    if (Array.isArray(user.role_names)) {
      return user.role_names.includes('moderator') || user.role_names.includes('admin') || user.role_names.includes('super_admin');
    }
    return user.role === 'moderator' || user.role === 'admin' || user.role === 'super_admin';
  }, [user]);

  // FIXED: Memoize the context value to prevent infinite re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    isAuthenticated,
    isAdmin,
    isModerator,
    login,
    register,
    logout,
    api,
  }), [user, loading, isAuthenticated, isAdmin, isModerator, login, register, logout]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Data Hooks with improved error handling and fixed dependencies
export const useTeams = (filters = {}) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.region && filters.region !== 'all') {
        params.append('region', filters.region);
      }
      if (filters.sortBy) {
        params.append('sort_by', filters.sortBy);
      }
      
      const endpoint = `/teams${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(endpoint);
      setTeams(response.data || response);
    } catch (err) {
      console.error('Error fetching teams:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, filters.region, filters.sortBy]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  return { teams, loading, error };
};

export const usePlayers = (filters = {}) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.team && filters.team !== 'all') {
        params.append('team', filters.team);
      }
      if (filters.role && filters.role !== 'all') {
        params.append('role', filters.role);
      }
      if (filters.region && filters.region !== 'all') {
        params.append('region', filters.region);
      }
      
      const endpoint = `/players${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(endpoint);
      setPlayers(response.data || response);
    } catch (err) {
      console.error('Error fetching players:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, filters.team, filters.role, filters.region]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  return { players, loading, error };
};

export const useMatches = (filters = {}) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.region && filters.region !== 'all') {
        params.append('region', filters.region);
      }
      if (filters.event && filters.event !== 'all') {
        params.append('event', filters.event);
      }
      
      const endpoint = `/matches${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(endpoint);
      setMatches(response.data || response);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, filters.status, filters.region, filters.event]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  return { matches, loading, error };
};

export const useEvents = (filters = {}) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (filters.status && filters.status !== 'all') {
        params.append('status', filters.status);
      }
      if (filters.region && filters.region !== 'all') {
        params.append('region', filters.region);
      }
      
      const endpoint = `/events${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(endpoint);
      setEvents(response.data || response);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, filters.status, filters.region]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error };
};

export const useRankings = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/rankings');
      setRankings(response.data || response);
    } catch (err) {
      console.error('Error fetching rankings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return { rankings, loading, error };
};

export const useAdminStats = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api, isAdmin } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!isAdmin()) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/stats');
      setStats(response);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api, isAdmin]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error };
};

export const useSearch = (query) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { api } = useAuth();

  const handleSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data || response || []);
    } catch (err) {
      console.error('Error searching:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const debounceTimer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(debounceTimer);
  }, [query, handleSearch]);

  return { results, loading, error };
};