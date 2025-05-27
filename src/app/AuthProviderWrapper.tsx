'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';

/**
 * Legacy AuthProviderWrapper component for backward compatibility
 * @deprecated Use the main Providers component instead
 */
export default function AuthProviderWrapper({ children }: { children: ReactNode }) {
  console.warn('AuthProviderWrapper is deprecated. Use the main Providers component instead.');
  
  return <AuthProvider>{children}</AuthProvider>;
}
