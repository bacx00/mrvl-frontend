import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // Send error to monitoring service (if configured)
    if (window.errorReporting) {
      window.errorReporting.logError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom error UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6 text-center">
            <div className="mb-4">
              <svg className="w-20 h-20 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Oops! Something went wrong</h1>
            <p className="text-gray-400 mb-6">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            {/* Error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-400">
                  Show error details
                </summary>
                <div className="mt-2 p-4 bg-gray-900 rounded text-sm">
                  <p className="text-red-400 font-mono mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-gray-500 text-xs overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}
            
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Try Again
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Go Home
              </button>
            </div>
            
            {this.state.retryCount > 2 && (
              <p className="mt-4 text-sm text-gray-500">
                Still having issues? Try refreshing the page or contact support.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Network-specific error boundary
export class NetworkErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      isOffline: !navigator.onLine,
      retryAttempts: 0
    };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOffline: false });
    if (this.state.hasError) {
      this.retry();
    }
  };

  handleOffline = () => {
    this.setState({ isOffline: true });
  };

  componentDidCatch(error, errorInfo) {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      this.setState({ hasError: true });
    }
  }

  retry = () => {
    this.setState(prevState => ({
      hasError: false,
      retryAttempts: prevState.retryAttempts + 1
    }));
  };

  render() {
    if (this.state.hasError || this.state.isOffline) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6 text-center">
            <div className="mb-4">
              <svg className="w-20 h-20 text-yellow-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">
              {this.state.isOffline ? 'No Internet Connection' : 'Network Error'}
            </h2>
            <p className="text-gray-400 mb-6">
              {this.state.isOffline 
                ? 'Please check your internet connection and try again.'
                : 'Unable to connect to the server. Please try again.'}
            </p>
            
            {!this.state.isOffline && (
              <button
                onClick={this.retry}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Retry
              </button>
            )}
            
            {this.state.retryAttempts > 2 && (
              <p className="mt-4 text-sm text-gray-500">
                Multiple retry attempts failed. The server might be down.
              </p>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;