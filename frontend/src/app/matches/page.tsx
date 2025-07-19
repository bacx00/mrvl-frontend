// src/app/matches/page.tsx - VLR.gg Style Production Ready
'use client';
import { Suspense } from 'react';
import MatchesContent from './MatchesContent';

// Loading skeleton that matches VLR.gg exactly
function MatchesLoadingSkeleton() {
  return (
    <div className="pb-6">
      {/* Tabs skeleton */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d] mb-4">
        <div className="container mx-auto">
          <div className="flex">
            <div className="px-4 py-3 w-24 bg-[#2b3d4d] animate-pulse"></div>
            <div className="px-4 py-3 w-24 bg-[#15191f] animate-pulse ml-1"></div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto space-y-6">
        {/* Date headers with match cards */}
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="bg-[#11161d] h-8 w-32 animate-pulse rounded-t-lg mb-1"></div>
            <div className="space-y-px">
              {[1, 2, 3].map(j => (
                <div key={j} className="bg-[#1a242d] border border-[#2b3d4d] p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#2b3d4d] rounded animate-pulse"></div>
                      <div className="w-24 h-4 bg-[#2b3d4d] rounded animate-pulse"></div>
                    </div>
                    <div className="w-16 h-6 bg-[#2b3d4d] rounded animate-pulse"></div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 h-4 bg-[#2b3d4d] rounded animate-pulse"></div>
                      <div className="w-8 h-8 bg-[#2b3d4d] rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Page Title - VLR.gg style */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Matches</h1>
          <p className="text-[#768894] text-sm mt-1">
            Live scores, results and upcoming matches for Marvel Rivals esports
          </p>
        </div>
      </div>

      <Suspense fallback={<MatchesLoadingSkeleton />}>
        <MatchesContent />
      </Suspense>
    </div>
  );
}
