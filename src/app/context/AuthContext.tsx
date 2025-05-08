'use client';
import { createContext, useState, useEffect } from 'react';

// Define user type
interface User { username: string; role: 'admin'|'editor'|'writer'|'user'; /* other user info */ }
interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
}

// Create context
export const AuthContext = createContext<AuthContextType>({
  user: null, token: null, login: () => {}, logout: () => {}
});

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // On mount, check local storage for saved login
    const savedUser = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
  }, []);

  const login = (user: User, token: string) => {
    setUser(user);
    setToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
