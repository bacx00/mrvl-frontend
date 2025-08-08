import React from 'react';

class SafeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    console.error('SafeErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // You can also log the error to an error reporting service here
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // In development, show a minimal error message without red styling
      if (process.env.NODE_ENV === 'development') {
        return (
          <div className="card p-6 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start space-x-3">
              <div className="text-gray-600 dark:text-gray-400 text-lg">ℹ️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-300 mb-2">
                  Component Error (Development)
                </h3>
                <p className="text-gray-700 dark:text-gray-400 mb-4">
                  This component encountered an error and couldn't be displayed. The page will continue to work normally.
                </p>
                
                {this.state.error && (
                  <details className="mb-4">
                    <summary className="cursor-pointer text-gray-600 dark:text-gray-400 font-medium hover:underline">
                      Show error details
                    </summary>
                    <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-800 dark:text-gray-300 overflow-auto">
                      <div className="mb-2">
                        <strong>Error:</strong> {this.state.error.toString()}
                      </div>
                      <div>
                        <strong>Stack:</strong>
                        <pre className="whitespace-pre-wrap">{this.state.errorInfo.componentStack}</pre>
                      </div>
                    </div>
                  </details>
                )}
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                  >
                    Reload Page
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      }

      // In production, silently fail and render nothing instead of red error banner
      return null;
    }

    return this.props.children;
  }
}

// Higher-order component to wrap components with error boundary
export const withErrorBoundary = (Component, fallbackComponent = null) => {
  return function WrappedComponent(props) {
    return (
      <SafeErrorBoundary fallback={fallbackComponent}>
        <Component {...props} />
      </SafeErrorBoundary>
    );
  };
};

export default SafeErrorBoundary;