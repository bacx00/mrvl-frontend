// src/app/rankings/page.tsx - VLR.gg Quality Rankings Page
import { Suspense } from 'react';
import RankingsContent from './RankingsContent';

// VLR.gg style loading component
function RankingsLoading() {
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Header Skeleton */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          <div className="h-8 bg-[#2b3d4d] rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-[#2b3d4d] rounded w-72 animate-pulse"></div>
        </div>
      </div>
      
      <div className="container mx-auto py-6">
        {/* Region tabs skeleton */}
        <div className="mb-6 bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
          <div className="flex">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-6 py-3">
                <div className="h-4 bg-[#2b3d4d] rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Table skeleton */}
        <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 text-xs font-medium uppercase tracking-wider bg-[#11161d] py-3 px-4">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5 md:col-span-6">Team</div>
            <div className="col-span-2 text-center hidden md:block">Region</div>
            <div className="col-span-3 md:col-span-2 text-center">Points</div>
            <div className="col-span-3 md:col-span-1 text-center">Form</div>
          </div>
          
          {/* Skeleton rows */}
          <div className="divide-y divide-[#2b3d4d]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="grid grid-cols-12 items-center py-3 px-4">
                {/* Rank */}
                <div className="col-span-1 text-center">
                  <div className="h-6 bg-[#2b3d4d] rounded w-8 mx-auto animate-pulse"></div>
                </div>
                
                {/* Team */}
                <div className="col-span-5 md:col-span-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#2b3d4d] rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-[#2b3d4d] rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-[#2b3d4d] rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Region - Desktop only */}
                <div className="col-span-2 text-center hidden md:block">
                  <div className="h-4 bg-[#2b3d4d] rounded w-16 mx-auto animate-pulse"></div>
                </div>
                
                {/* Points */}
                <div className="col-span-3 md:col-span-2 text-center">
                  <div className="h-4 bg-[#2b3d4d] rounded w-16 mx-auto animate-pulse"></div>
                </div>
                
                {/* Form */}
                <div className="col-span-3 md:col-span-1 flex justify-center space-x-1">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="w-6 h-6 bg-[#2b3d4d] rounded animate-pulse"></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Footer skeleton */}
        <div className="mt-6 flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <div className="h-6 bg-[#2b3d4d] rounded w-24 mb-2 animate-pulse"></div>
            <div className="flex space-x-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center">
                  <div className="w-6 h-6 bg-[#2b3d4d] rounded mr-2 animate-pulse"></div>
                  <div className="h-4 bg-[#2b3d4d] rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="h-4 bg-[#2b3d4d] rounded w-48 mb-1 animate-pulse"></div>
            <div className="h-3 bg-[#2b3d4d] rounded w-56 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RankingsPage() {
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Page Header */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Team Rankings</h1>
          <p className="text-[#768894] text-sm mt-1">
            Official Marvel Rivals competitive team rankings
          </p>
        </div>
      </div>

      <Suspense fallback={<RankingsLoading />}>
        <RankingsContent />
      </Suspense>
    </div>
  );
}
