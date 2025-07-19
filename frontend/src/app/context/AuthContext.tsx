// src/context/AuthContext.tsx
'use client';

import { createContext, useState, useEffect, useContext, useCallback, ReactNode } from 'react';
import { authAPI } from '@/lib/api';
import { User, LoginCredentials, RegisterData, AuthContextType } from '@/lib/types';
import { storage } from '@/lib/utils';
import { STORAGE_KEYS } from '@/lib/constants';

// Create context with proper default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateUser: async () => {},
  refreshToken: async () => {},
});

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Provider component with enhanced functionality
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenRefreshTimeout, setTokenRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize authentication state on mount
  useEffect(() => {
    initializeAuth();
  }, []);

  // Set up token refresh timer when user changes
  useEffect(() => {
    if (user) {
      setupTokenRefresh();
    } else {
      clearTokenRefresh();
    }

    return () => clearTokenRefresh();
  }, [user]);

  // Initialize authentication from stored data
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check for stored user and token
      const storedUser = storage.get<User>(STORAGE_KEYS.USER);
      const storedToken = storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);

      if (storedUser && storedToken) {
        // Verify token is still valid by fetching current user
        try {
          const currentUser = await authAPI.me();
          setUser(currentUser);
        } catch (error) {
          console.warn('Token validation failed, clearing stored auth');
          clearStoredAuth();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearStoredAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up automatic token refresh
  const setupTokenRefresh = useCallback(() => {
    clearTokenRefresh();

    // Refresh token every 45 minutes (assuming 1-hour token expiry)
    const timeout = setTimeout(async () => {
      try {
        await refreshToken();
      } catch (error) {
        console.error('Token refresh failed:', error);
        await logout();
      }
    }, 45 * 60 * 1000); // 45 minutes

    setTokenRefreshTimeout(timeout);
  }, []);

  // Clear token refresh timer
  const clearTokenRefresh = useCallback(() => {
    if (tokenRefreshTimeout) {
      clearTimeout(tokenRefreshTimeout);
      setTokenRefreshTimeout(null);
    }
  }, [tokenRefreshTimeout]);

  // Clear stored authentication data
  const clearStoredAuth = useCallback(() => {
    storage.remove(STORAGE_KEYS.USER);
    storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    setUser(null);
  }, []);

  // Login function with enhanced error handling
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);

      const response = await authAPI.login(credentials);
      
      // Store user data and token
      storage.set(STORAGE_KEYS.USER, response.user);
      storage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      
      setUser(response.user);

      // Track login event (if analytics is enabled)
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'login', {
          method: 'email',
        });
      }

    } catch (error) {
      console.error('Login failed:', error);
      clearStoredAuth();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearStoredAuth]);

  // Registration function with auto-login
  const register = useCallback(async (data: RegisterData) => {
    try {
      setIsLoading(true);

      const response = await authAPI.register(data);
      
      // Store user data and token
      storage.set(STORAGE_KEYS.USER, response.user);
      storage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      
      setUser(response.user);

      // Track registration event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'sign_up', {
          method: 'email',
        });
      }

    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout function with cleanup
  const logout = useCallback(async () => {
    try {
      // Call logout API to invalidate server-side session
      await authAPI.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with client-side logout even if API fails
    } finally {
      clearStoredAuth();
      clearTokenRefresh();

      // Track logout event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'logout');
      }

      // Redirect to home page
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [clearStoredAuth, clearTokenRefresh]);

  // Update user profile
  const updateUser = useCallback(async (userData: Partial<User>) => {
    if (!user) return;

    try {
      // Update user on server
      const updatedUser = await authAPI.updateProfile(userData);
      
      // Update local state and storage
      setUser(updatedUser);
      storage.set(STORAGE_KEYS.USER, updatedUser);

    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }, [user]);

  // Refresh authentication token
  const refreshToken = useCallback(async () => {
    try {
      const response = await authAPI.refreshToken();
      
      // Update stored token
      storage.set(STORAGE_KEYS.AUTH_TOKEN, response.token);
      
      // Set up next refresh
      setupTokenRefresh();

    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }, [setupTokenRefresh]);

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false;
    
    // Admins have all permissions
    if (user.role === 'admin') return true;
    
    // Check specific permissions
    return user.permissions?.includes(permission) || false;
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  }, [user]);

  // Get user initials for avatar fallback
  const getUserInitials = useCallback((): string => {
    if (!user?.name) return '??';
    
    return user.name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  // Check if user account needs verification
  const needsVerification = useCallback((): boolean => {
    return user ? !user.verified : false;
  }, [user]);

  // Biometric authentication (if supported)
  const setupBiometricAuth = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !window.navigator.credentials) {
      return false;
    }

    try {
      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        return false;
      }

      // Implementation would depend on your biometric auth setup
      console.log('Biometric authentication setup - implementation needed');
      return true;
    } catch (error) {
      console.error('Biometric setup failed:', error);
      return false;
    }
  }, []);

  // Social authentication handlers
  const loginWithGoogle = useCallback(async (credential: string) => {
    try {
      setIsLoading(true);
      
      // Implementation depends on your Google OAuth setup
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        throw new Error('Google login failed');
      }

      const data = await response.json();
      
      storage.set(STORAGE_KEYS.USER, data.user);
      storage.set(STORAGE_KEYS.AUTH_TOKEN, data.token);
      
      setUser(data.user);

    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithDiscord = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      
      // Implementation depends on your Discord OAuth setup
      const response = await fetch('/api/auth/discord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Discord login failed');
      }

      const data = await response.json();
      
      storage.set(STORAGE_KEYS.USER, data.user);
      storage.set(STORAGE_KEYS.AUTH_TOKEN, data.token);
      
      setUser(data.user);

    } catch (error) {
      console.error('Discord login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Context value with all functionality
  const value: AuthContextType = {
    // Core state
    user,
    isAuthenticated: !!user,
    isLoading,

    // Core methods
    login,
    register,
    logout,
    updateUser,
    refreshToken,

    // Helper methods
    hasPermission,
    hasRole,
    getUserInitials,
    needsVerification,

    // Advanced features
    setupBiometricAuth,
    loginWithGoogle,
    loginWithDiscord,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Higher-order component for protecting routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, hasRole } = useAuth();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="loading-spinner"></div>
        </div>
      );
    }

    if (!user) {
      return (
        <div className="text-center py-8">
          <p className="text-[#768894] mb-4">Please log in to continue</p>
          <a href="/user/login" className="btn btn-primary">
            Log In
          </a>
        </div>
      );
    }

    if (requiredRole && !hasRole(requiredRole)) {
      return (
        <div className="text-center py-8">
          <p className="text-[#768894] mb-4">
            You don't have permission to access this page
          </p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

export default AuthContext;
