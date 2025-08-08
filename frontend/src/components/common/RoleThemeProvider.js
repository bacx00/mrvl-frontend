import React, { createContext, useContext } from 'react';

const RoleThemeContext = createContext();

export function RoleThemeProvider({ children, user }) {
  const getRoleTheme = (role) => {
    switch (role) {
      case 'admin':
        return {
          primary: '#dc2626', // Red
          secondary: '#fca5a5',
          background: '#fef2f2',
          text: '#991b1b'
        };
      case 'moderator':
        return {
          primary: '#f59e0b', // Yellow/Orange
          secondary: '#fde68a',
          background: '#fffbeb',
          text: '#92400e'
        };
      default:
        return {
          primary: '#059669', // Green
          secondary: '#86efac',
          background: '#f0fdf4',
          text: '#065f46'
        };
    }
  };

  const theme = getRoleTheme(user?.role);
  
  const config = {
    role: user?.role || 'user',
    canManageUsers: user?.role === 'admin',
    canModerate: user?.role === 'admin' || user?.role === 'moderator'
  };

  return (
    <RoleThemeContext.Provider value={{ theme, config, user }}>
      {children}
    </RoleThemeContext.Provider>
  );
}

export function useRoleTheme() {
  const context = useContext(RoleThemeContext);
  if (!context) {
    throw new Error('useRoleTheme must be used within a RoleThemeProvider');
  }
  return context;
}

export default RoleThemeProvider;