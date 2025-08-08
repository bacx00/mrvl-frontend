import React from 'react';

// Base skeleton component with shimmer effect
export const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`animate-pulse bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
};

// Text skeleton for different sizes
export const SkeletonText = ({ lines = 1, className = '' }) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 mb-2 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
};

// Match card skeleton
export const MatchCardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-12" />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-8 w-12" />
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
};

// News card skeleton
export const NewsCardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <SkeletonText lines={2} className="mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
};

// Team card skeleton
export const TeamCardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 text-center">
      <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-20 mx-auto" />
    </div>
  );
};

// Player card skeleton
export const PlayerCardSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-24 mb-2" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
};

// Table skeleton
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
      
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Live match skeleton
export const LiveMatchSkeleton = () => {
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="text-center mb-6">
        <Skeleton className="h-8 w-48 mx-auto mb-2" />
        <Skeleton className="h-4 w-32 mx-auto" />
      </div>
      
      <div className="grid grid-cols-3 gap-8 items-center mb-8">
        <div className="text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-2" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </div>
        
        <div className="text-center">
          <Skeleton className="h-12 w-32 mx-auto mb-2" />
          <Skeleton className="h-4 w-20 mx-auto" />
        </div>
        
        <div className="text-center">
          <Skeleton className="w-20 h-20 rounded-full mx-auto mb-2" />
          <Skeleton className="h-6 w-24 mx-auto" />
        </div>
      </div>
      
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center p-3 bg-gray-700 rounded">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Generic list skeleton
export const ListSkeleton = ({ items = 5, component: Component = MatchCardSkeleton }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
};

// Page skeleton wrapper
export const PageSkeleton = ({ title = true, children }) => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {title && (
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-4 w-96" />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default {
  Skeleton,
  SkeletonText,
  MatchCardSkeleton,
  NewsCardSkeleton,
  TeamCardSkeleton,
  PlayerCardSkeleton,
  TableSkeleton,
  LiveMatchSkeleton,
  ListSkeleton,
  PageSkeleton
};