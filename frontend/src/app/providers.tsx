'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { SearchProvider } from '@/context/SearchContext';
import { NotificationProvider } from '@/context/NotificationContext';
import ErrorBoundary from '@/components/ErrorBoundary';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Combined providers wrapper for the entire application
 * Provides authentication, theme, search, and notification contexts
 * Includes error boundary for graceful error handling
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SearchProvider>
            <NotificationProvider>
              <ClientProviders>
                {children}
              </ClientProviders>
            </NotificationProvider>
          </SearchProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

/**
 * Client-side only providers that require window/document access
 */
function ClientProviders({ children }: ProvidersProps) {
  return (
    <>
      {children}
    </>
  );
}
