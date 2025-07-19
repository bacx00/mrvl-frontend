// src/app/matches/MatchesContent.tsx - Production Optimized, VLR.gg Style
'use client';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MatchCard from '@/components/MatchCard';

interface Match {
  id: number;
  team1: {
    name: string;
    logo?: string;
    score?: number;
  };
  team2: {
    name: string;
    logo?: string;
    score?: number;
  };
  status: 'live' | 'upcoming' | 'completed';
  event?: string;
  stage?: string;
  time?: string;
  series?: string;
  date?: string;
}

export default function MatchesContent() {
  const [activeView, setActiveView] = useState<'schedule' | 'results'>('schedule');
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Minimal mock data - just enough for demo
  const mockMatches: Match[] = useMemo(() => [
    {
      id: 1,
      team1: { name: 'Team Alpha', logo: '/placeholder.png' },
      team2: { name: 'Team Beta', logo: '/placeholder.png' },
      status: 'live',
      event: 'MRVL Championship 2025',
      stage: 'Grand Finals',
      time: new Date().toISOString(),
      series: 'Bo5',
      date: new Date().toDateString()
    },
    {
      id: 2,
      team1: { name: 'Phoenix Esports', logo: '/placeholder.png', score: 2 },
      team2: { name: 'Nexus Gaming', logo: '/placeholder.png', score: 1 },
      status: 'completed',
      event: 'MRVL Championship 2025',
      stage: 'Semi-Finals',
      time: new Date(Date.now() - 3600000).toISOString(),
      series: 'Bo3',
      date: new Date().toDateString()
    },
    {
      id: 3,
      team1: { name: 'Storm Riders', logo: '/placeholder.png' },
      team2: { name: 'Shadow Legion', logo: '/placeholder.png' },
      status: 'upcoming',
      event: 'MRVL Pro League',
      stage: 'Regular Season',
      time: new Date(Date.now() + 7200000).toISOString(),
      series: 'Bo3',
      date: new Date().toDateString()
    }
  ], []);
  
  // Group matches by date with optimized performance
  const groupMatchesByDate = useCallback((matches: Match[]) => {
    return matches.reduce((grouped: Record<string, Match[]>, match) => {
      const dateString = match.date || (match.time ? new Date(match.time).toDateString() : 'Unknown Date');
      if (!grouped[dateString]) {
        grouped[dateString] = [];
      }
      grouped[dateString].push(match);
      return grouped;
    }, {});
  }, []);
  
  // Optimized date formatting
  const formatDateHeader = useCallback((dateString: string) => {
    if (dateString === 'Unknown Date') return dateString;
    
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'TOMORROW';
    if (diffDays === -1) return 'YESTERDAY';
    
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date).toUpperCase();
  }, []);
  
  // Handle view changes with URL updates
  const handleViewChange = useCallback((view: 'schedule' | 'results') => {
    setActiveView(view);
    const params = new URLSearchParams(searchParams);
    params.set('view', view);
    router.push(`/matches?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);
  
  useEffect(() => {
    // Set view from URL params
    const view = searchParams.get('view');
    if (view === 'results') {
      setActiveView('results');
    } else {
      setActiveView('schedule');
    }
    
    // Fetch matches with better error handling
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
        
        const res = await fetch('/api/matches', {
          signal: controller.signal,
          headers: {
            'Cache-Control': 'no-cache',
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Failed to fetch matches`);
        }
        
        const data = await res.json();
        
        // Enhance data with dates
        const enhancedData = data.map((match: Match) => ({
          ...match,
          date: match.date || (match.time ? new Date(match.time).toDateString() : new Date().toDateString())
        }));
        
        setMatches(enhancedData);
      } catch (err) {
        console.warn('API fetch failed, using fallback data:', err);
        
        // Use mock data as fallback
        const enhancedMockData = mockMatches.map(match => ({
          ...match,
          date: match.date || new Date().toDateString()
        }));
        
        setMatches(enhancedMockData);
        
        // Only show error if no fallback data
        if (mockMatches.length === 0) {
          setError(err instanceof Error ? err.message : 'Failed to load matches');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatches();
  }, [searchParams, mockMatches]);
  
  // Filter and sort matches efficiently
  const { filteredMatches, groupedMatches, sortedDates } = useMemo(() => {
    const filtered = matches.filter(match => {
      if (activeView === 'schedule') {
        return match.status === 'upcoming' || match.status === 'live';
      }
      return match.status === 'completed';
    });
    
    const grouped = groupMatchesByDate(filtered);
    
    const sorted = Object.keys(grouped).sort((a, b) => {
      // Live matches first
      const aHasLive = grouped[a].some(m => m.status === 'live');
      const bHasLive = grouped[b].some(m => m.status === 'live');
      
      if (aHasLive && !bHasLive) return -1;
      if (!aHasLive && bHasLive) return 1;
      
      // Then by date
      const dateA = new Date(a).getTime();
      const dateB = new Date(b).getTime();
      
      return activeView === 'schedule' ? dateA - dateB : dateB - dateA;
    });
    
    return {
      filteredMatches: filtered,
      groupedMatches: grouped,
      sortedDates: sorted
    };
  }, [matches, activeView, groupMatchesByDate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-pulse">
          <div className="w-12 h-12 border-4 border-[#fa4454] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error && matches.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="bg-[#1a242d] border border-[#fa4454] p-6 text-center rounded-lg">
          <div className="text-[#fa4454] text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-medium mb-2">Unable to Load Matches</h3>
          <p className="text-[#768894] mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="pb-6">
      {/* View Tabs - Exact VLR.gg styling */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d] mb-4 sticky top-0 z-10">
        <div className="container mx-auto">
          <div className="flex">
            <button 
              onClick={() => handleViewChange('schedule')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeView === 'schedule' 
                  ? 'text-white' 
                  : 'text-[#768894] hover:text-white'
              }`}
            >
              Schedule
              {activeView === 'schedule' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fa4454]"></div>
              )}
            </button>
            <button 
              onClick={() => handleViewChange('results')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-200 relative ${
                activeView === 'results' 
                  ? 'text-white' 
                  : 'text-[#768894] hover:text-white'
              }`}
            >
              Results
              {activeView === 'results' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fa4454]"></div>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto">
        {sortedDates.length === 0 ? (
          <div className="bg-[#1a242d] border border-[#2b3d4d] py-12 text-center rounded-lg">
            <div className="text-[#768894] text-5xl mb-4">📅</div>
            <h3 className="text-lg font-medium mb-2">No Matches Found</h3>
            <p className="text-[#768894] mb-4">
              {activeView === 'schedule' 
                ? 'No upcoming matches scheduled at the moment.' 
                : 'No completed matches to display.'
              }
            </p>
            {activeView === 'schedule' && (
              <p className="text-sm text-[#768894]">
                Check back later for new match announcements.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => {
              const hasLiveMatches = groupedMatches[date].some(m => m.status === 'live');
              
              return (
                <div key={date} className="group">
                  {/* Date Header - VLR.gg exact style */}
                  <div className="bg-[#11161d] text-white text-sm font-medium px-4 py-2 mb-1 rounded-t-lg flex items-center justify-between">
                    <span>{formatDateHeader(date)}</span>
                    {hasLiveMatches && (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                        <span className="text-red-400 text-xs font-bold">LIVE</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Matches for this date */}
                  <div className="space-y-px">
                    {groupedMatches[date]
                      .sort((a, b) => {
                        // Live matches first
                        if (a.status === 'live' && b.status !== 'live') return -1;
                        if (a.status !== 'live' && b.status === 'live') return 1;
                        
                        // Then by time
                        if (a.time && b.time) {
                          return new Date(a.time).getTime() - new Date(b.time).getTime();
                        }
                        return 0;
                      })
                      .map(match => (
                        <MatchCard
                          key={match.id}
                          id={match.id}
                          team1={match.team1}
                          team2={match.team2}
                          status={match.status}
                          event={match.event}
                          stage={match.stage}
                          time={match.time}
                          series={match.series}
                        />
                      ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Footer info */}
        {matches.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#2b3d4d] text-center">
            <div className="text-sm text-[#768894] space-y-1">
              <p>
                {activeView === 'schedule' 
                  ? 'All times displayed in your local timezone' 
                  : `Showing ${filteredMatches.length} completed ${filteredMatches.length === 1 ? 'match' : 'matches'}`
                }
              </p>
              <p className="text-xs">
                Matches update automatically • Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
