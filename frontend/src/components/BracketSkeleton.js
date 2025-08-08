import React from 'react';

/**
 * Skeleton Loading Components for Brackets
 * Provides loading states that match bracket structure
 */

/**
 * Main Bracket Skeleton
 */
function BracketSkeleton({ format = 'single_elimination', compact = false }) {
  return (
    <div className="bracket-skeleton animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-64"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
          </div>
        </div>
      </div>

      {/* Bracket Content */}
      <div className="bracket-section bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <BracketContentSkeleton format={format} compact={compact} />
      </div>
    </div>
  );
}

/**
 * Bracket Content Skeleton based on format
 */
function BracketContentSkeleton({ format, compact }) {
  switch (format) {
    case 'double_elimination':
      return <DoubleEliminationSkeleton compact={compact} />;
    case 'swiss':
      return <SwissSkeleton compact={compact} />;
    case 'round_robin':
      return <RoundRobinSkeleton compact={compact} />;
    default:
      return <SingleEliminationSkeleton compact={compact} />;
  }
}

/**
 * Single Elimination Skeleton
 */
function SingleEliminationSkeleton({ compact = false }) {
  const rounds = [8, 4, 2, 1]; // Match counts per round

  return (
    <div className="flex space-x-16 overflow-x-auto">
      {rounds.map((matchCount, roundIndex) => (
        <div key={roundIndex} className="flex-shrink-0" style={{ minWidth: compact ? '240px' : '280px' }}>
          {/* Round Header */}
          <div className="text-center mb-8">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mx-auto mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mx-auto"></div>
          </div>

          {/* Matches */}
          <div className="space-y-8">
            {Array.from({ length: matchCount }).map((_, matchIndex) => (
              <MatchCardSkeleton key={matchIndex} compact={compact} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Double Elimination Skeleton
 */
function DoubleEliminationSkeleton({ compact = false }) {
  return (
    <div className="space-y-12">
      {/* Upper Bracket */}
      <div>
        <div className="text-center mb-8">
          <div className="h-5 bg-blue-300 dark:bg-blue-600 rounded w-32 mx-auto"></div>
        </div>
        <SingleEliminationSkeleton compact={compact} />
      </div>

      {/* Lower Bracket */}
      <div>
        <div className="text-center mb-8">
          <div className="h-5 bg-red-300 dark:bg-red-600 rounded w-32 mx-auto"></div>
        </div>
        <div className="flex space-x-16 overflow-x-auto">
          {[4, 2, 1, 1].map((matchCount, roundIndex) => (
            <div key={roundIndex} className="flex-shrink-0" style={{ minWidth: compact ? '240px' : '280px' }}>
              <div className="text-center mb-8">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mx-auto"></div>
              </div>
              <div className="space-y-8">
                {Array.from({ length: matchCount }).map((_, matchIndex) => (
                  <MatchCardSkeleton key={matchIndex} compact={compact} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Grand Finals */}
      <div>
        <div className="text-center mb-8">
          <div className="h-5 bg-yellow-300 dark:bg-yellow-600 rounded w-28 mx-auto"></div>
        </div>
        <div className="flex justify-center">
          <MatchCardSkeleton compact={compact} />
        </div>
      </div>
    </div>
  );
}

/**
 * Swiss System Skeleton
 */
function SwissSkeleton({ compact = false }) {
  return (
    <div className="space-y-8">
      {/* Standings Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48"></div>
        </div>
        <StandingsTableSkeleton />
      </div>

      {/* Rounds */}
      <div className="space-y-8">
        {Array.from({ length: 3 }).map((_, roundIndex) => (
          <div key={roundIndex}>
            <div className="text-center mb-6">
              <div className="h-4 bg-blue-300 dark:bg-blue-600 rounded w-20 mx-auto"></div>
            </div>
            <div className={`grid gap-6 ${
              compact 
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' 
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}>
              {Array.from({ length: 4 }).map((_, matchIndex) => (
                <MatchCardSkeleton key={matchIndex} compact={compact} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Round Robin Skeleton
 */
function RoundRobinSkeleton({ compact = false }) {
  return (
    <div className="space-y-8">
      {/* Group Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, groupIndex) => (
          <div key={groupIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
            </div>
            <StandingsTableSkeleton compact={true} />
          </div>
        ))}
      </div>

      {/* Matches Grid */}
      <div className={`grid gap-4 ${
        compact 
          ? 'grid-cols-1 sm:grid-cols-2' 
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
      }`}>
        {Array.from({ length: 6 }).map((_, matchIndex) => (
          <MatchCardSkeleton key={matchIndex} compact={compact} />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual Match Card Skeleton
 */
function MatchCardSkeleton({ compact = false }) {
  return (
    <div className={`
      bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden
      ${compact ? 'min-w-[220px]' : 'min-w-[280px]'}
    `}>
      {/* Match Header */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </div>

      {/* Team 1 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-300 dark:bg-gray-600 rounded`}></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-24 mb-1"></div>
            {!compact && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>}
          </div>
        </div>
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-6"></div>
      </div>

      {/* Team 2 */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} bg-gray-300 dark:bg-gray-600 rounded`}></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20 mb-1"></div>
            {!compact && <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>}
          </div>
        </div>
        <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-6"></div>
      </div>

      {/* Match Footer */}
      <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    </div>
  );
}

/**
 * Standings Table Skeleton
 */
function StandingsTableSkeleton({ compact = false }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {['Pos', 'Team', 'P', 'W', 'L', 'Pts'].map((header, index) => (
              <th key={index} className="px-4 py-3">
                <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-8 mx-auto"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {Array.from({ length: compact ? 4 : 8 }).map((_, index) => (
            <tr key={index}>
              <td className="px-4 py-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-4 mx-auto"></div>
              </td>
              <td className="px-6 py-3">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-20"></div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4 mx-auto"></div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-green-300 dark:bg-green-600 rounded w-4 mx-auto"></div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-red-300 dark:bg-red-600 rounded w-4 mx-auto"></div>
              </td>
              <td className="px-4 py-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-6 mx-auto"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Loading Spinner Component
 */
function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`animate-spin rounded-full border-4 border-blue-500 border-t-transparent ${sizeClasses[size]} ${className}`}></div>
  );
}

/**
 * Generic Loading State
 */
function LoadingState({ message = 'Loading...', showSpinner = true }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      {showSpinner && <LoadingSpinner size="lg" className="mb-4" />}
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        {message}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
        Please wait while we load the tournament data...
      </p>
    </div>
  );
}

/**
 * Error State Component
 */
function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Something went wrong
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        {error?.message || 'We encountered an error while loading the bracket data.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export default BracketSkeleton;
export {
  MatchCardSkeleton,
  StandingsTableSkeleton,
  LoadingSpinner,
  LoadingState,
  ErrorState,
  SingleEliminationSkeleton,
  DoubleEliminationSkeleton,
  SwissSkeleton,
  RoundRobinSkeleton
};