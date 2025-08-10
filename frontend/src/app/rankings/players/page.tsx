// src/app/rankings/players/page.tsx - Marvel Rivals Player Rankings
import { Suspense } from 'react';
import PlayerRankingsContent from './PlayerRankingsContent';

// Loading component for player rankings
function PlayerRankingsLoading() {
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
        {/* Tab navigation skeleton */}
        <div className="mb-6 bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
          <div className="flex">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-6 py-3">
                <div className="h-4 bg-[#2b3d4d] rounded w-20 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Filters skeleton */}
        <div className="mb-6 flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="h-10 bg-[#1a242d] border border-[#2b3d4d] rounded animate-pulse"></div>
          </div>
          <div className="flex space-x-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-[#1a242d] border border-[#2b3d4d] rounded w-32 animate-pulse"></div>
            ))}
          </div>
        </div>
        
        {/* Player rankings table skeleton */}
        <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 text-xs font-medium uppercase tracking-wider bg-[#11161d] py-3 px-4">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-4 md:col-span-3">Player</div>
            <div className="col-span-2 text-center hidden md:block">Team</div>
            <div className="col-span-2 text-center hidden md:block">Role</div>
            <div className="col-span-2 text-center">Rating</div>
            <div className="col-span-3 md:col-span-2 text-center">Rank</div>
          </div>
          
          {/* Skeleton rows */}
          <div className="divide-y divide-[#2b3d4d]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="grid grid-cols-12 items-center py-3 px-4">
                {/* Rank */}
                <div className="col-span-1 text-center">
                  <div className="h-6 bg-[#2b3d4d] rounded w-8 mx-auto animate-pulse"></div>
                </div>
                
                {/* Player */}
                <div className="col-span-4 md:col-span-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-[#2b3d4d] rounded-full mr-3 animate-pulse"></div>
                    <div>
                      <div className="h-4 bg-[#2b3d4d] rounded w-24 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-[#2b3d4d] rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                </div>
                
                {/* Team - Desktop only */}
                <div className="col-span-2 text-center hidden md:block">
                  <div className="h-4 bg-[#2b3d4d] rounded w-20 mx-auto animate-pulse"></div>
                </div>
                
                {/* Role - Desktop only */}
                <div className="col-span-2 text-center hidden md:block">
                  <div className="h-4 bg-[#2b3d4d] rounded w-16 mx-auto animate-pulse"></div>
                </div>
                
                {/* Rating */}
                <div className="col-span-2 text-center">
                  <div className="h-4 bg-[#2b3d4d] rounded w-16 mx-auto animate-pulse"></div>
                </div>
                
                {/* Rank */}
                <div className="col-span-3 md:col-span-2 text-center">
                  <div className="h-8 bg-[#2b3d4d] rounded w-20 mx-auto animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlayerRankingsPage() {
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Page Header */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Player Rankings</h1>
          <p className="text-[#768894] text-sm mt-1">
            Individual Marvel Rivals competitive player rankings by ELO rating
          </p>
        </div>
      </div>

      <Suspense fallback={<PlayerRankingsLoading />}>
        <PlayerRankingsContent />
      </Suspense>
    </div>
  );
}