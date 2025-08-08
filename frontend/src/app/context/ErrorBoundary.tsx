// src/components/ErrorBoundary.tsx
'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { COLORS } from '@/lib/constants';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to monitoring service (e.g., Sentry)
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-6">
              <div 
                className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: COLORS.CARD_BACKGROUND, border: `2px solid ${COLORS.BORDER}` }}
              >
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                Something went wrong
              </h2>
              <p className="mb-4" style={{ color: COLORS.TEXT_SECONDARY }}>
                We're sorry, but something unexpected happened. Please try refreshing the page.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="w-full px-4 py-2 rounded font-medium transition-colors"
                style={{ 
                  backgroundColor: COLORS.MARVEL_RED, 
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e03e4e';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.MARVEL_RED;
                }}
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 rounded font-medium transition-colors"
                style={{ 
                  backgroundColor: COLORS.CARD_BACKGROUND, 
                  color: COLORS.TEXT_PRIMARY,
                  border: `1px solid ${COLORS.BORDER}`,
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#20303d';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = COLORS.CARD_BACKGROUND;
                }}
              >
                Refresh Page
              </button>
            </div>

            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary 
                  className="cursor-pointer mb-2 font-medium"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  Error Details (Development)
                </summary>
                <div 
                  className="p-3 rounded text-xs overflow-auto max-h-40"
                  style={{ 
                    backgroundColor: COLORS.PRIMARY_DARK,
                    border: `1px solid ${COLORS.BORDER}`,
                    fontFamily: 'monospace'
                  }}
                >
                  <div style={{ color: COLORS.ERROR }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div className="mt-2" style={{ color: COLORS.TEXT_SECONDARY }}>
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
