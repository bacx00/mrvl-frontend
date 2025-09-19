// src/app/forums/trending/page.tsx - VLR.gg Quality Trending Topics
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ForumSidebar from '@/components/ForumSidebar';

interface TrendingThread {
  id: string;
  title: string;
  author: string;
  category: {
    id: string;
    name: string;
  };
  posts: number;
  views: number;
  likes: number;
  score: number; // Trending algorithm score
  lastActivity: string;
  createdAt: string;
  tags?: string[];
  excerpt?: string;
}

export default function ForumTrendingPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [threads, setThreads] = useState<TrendingThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Time period filter
  const timePeriod = searchParams.get('period') || '24h';
  const categoryFilter = searchParams.get('category') || 'all';
  
  // Available time periods
  const timePeriods = [
    { id: '24h', name: '24 Hours', label: 'Last 24h' },
    { id: '7d', name: '7 Days', label: 'This Week' },
    { id: '30d', name: '30 Days', label: 'This Month' }
  ];
  
  // Available categories for filtering
  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'general', name: 'General Discussion' },
    { id: 'strategy', name: 'Strategy & Tips' },
    { id: 'heroes', name: 'Hero Discussion' },
    { id: 'esports', name: 'Esports & Competitive' },
    { id: 'technical', name: 'Technical Support' },
    { id: 'community', name: 'Community Events' }
  ];

  // Mock trending data
  const mockTrendingThreads: TrendingThread[] = useMemo(() => [
    {
      id: '1',
      title: 'Season 1 Meta Tier List - Complete Hero Rankings',
      author: 'MetaExpert',
      category: { id: 'strategy', name: 'Strategy & Tips' },
      posts: 342,
      views: 15234,
      likes: 89,
      score: 95.8,
      lastActivity: new Date(Date.now() - 1800000).toISOString(),
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      tags: ['meta', 'tier-list', 'heroes'],
      excerpt: 'Complete breakdown of hero viability in the current competitive meta...'
    },
    {
      id: '2',
      title: 'MRVL Championship Grand Finals Discussion - What a Match!',
      author: 'EsportsWatcher',
      category: { id: 'esports', name: 'Esports & Competitive' },
      posts: 156,
      views: 8976,
      likes: 67,
      score: 89.4,
      lastActivity: new Date(Date.now() - 900000).toISOString(),
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      tags: ['tournament', 'championship', 'finals'],
      excerpt: 'That final team fight was absolutely insane! Alpha Esports clutched it...'
    },
    {
      id: '3',
      title: 'Iron Man Advanced Combo Guide - Master the Repulsors',
      author: 'TonyStarkPro',
      category: { id: 'heroes', name: 'Hero Discussion' },
      posts: 78,
      views: 5432,
      likes: 45,
      score: 82.1,
      lastActivity: new Date(Date.now() - 3600000).toISOString(),
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      tags: ['iron-man', 'combos', 'guide'],
      excerpt: 'Learn the advanced repulsor combos that separate good Iron Man players...'
    },
    {
      id: '4',
      title: 'Performance Issues After Latest Patch - Workarounds Inside',
      author: 'TechHelper',
      category: { id: 'technical', name: 'Technical Support' },
      posts: 234,
      views: 7821,
      likes: 34,
      score: 78.9,
      lastActivity: new Date(Date.now() - 1200000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      tags: ['performance', 'patch', 'workaround'],
      excerpt: 'Several users reporting FPS drops after the latest update. Here are some fixes...'
    },
    {
      id: '5',
      title: 'Community Tournament Weekly #47 - Sign-ups Open!',
      author: 'CommunityMod',
      category: { id: 'community', name: 'Community Events' },
      posts: 89,
      views: 3456,
      likes: 28,
      score: 75.3,
      lastActivity: new Date(Date.now() - 2400000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      tags: ['tournament', 'community', 'weekly'],
      excerpt: 'Join our weekly community tournament! Prizes and bragging rights await...'
    },
    {
      id: '6',
      title: 'Captain America vs Thor - Shield vs Hammer Analysis',
      author: 'HeroAnalyst',
      category: { id: 'strategy', name: 'Strategy & Tips' },
      posts: 123,
      views: 4567,
      likes: 41,
      score: 72.8,
      lastActivity: new Date(Date.now() - 4800000).toISOString(),
      createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      tags: ['captain-america', 'thor', 'comparison'],
      excerpt: 'Deep dive into the matchup between these two iconic heroes...'
    }
  ], []);

  useEffect(() => {
    const fetchTrendingThreads = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch real data
        const res = await fetch(`/api/public/forums/trending?period=${timePeriod}&category=${categoryFilter}`);
        if (res.ok) {
          const data = await res.json();
          setThreads(data);
        } else {
          throw new Error('API not available');
        }
      } catch (err) {
        console.warn('API failed, using mock data:', err);
        
        // Filter mock data based on selections
        let filteredThreads = mockTrendingThreads;
        
        if (categoryFilter !== 'all') {
          filteredThreads = filteredThreads.filter(thread => thread.category.id === categoryFilter);
        }
        
        // Sort by trending score
        filteredThreads.sort((a, b) => b.score - a.score);
        
        setThreads(filteredThreads);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingThreads();
  }, [timePeriod, categoryFilter, mockTrendingThreads]);

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    router.push(`/forums/trending?${params.toString()}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
          <div className="container mx-auto py-4">
            <div className="h-8 w-48 bg-[#2b3d4d] animate-pulse rounded mb-2"></div>
            <div className="h-4 w-72 bg-[#2b3d4d] animate-pulse rounded"></div>
          </div>
        </div>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-3/4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-24 bg-[#1a242d] border border-[#2b3d4d] animate-pulse rounded"></div>
              ))}
            </div>
            <div className="lg:w-1/4">
              <div className="h-64 bg-[#1a242d] border border-[#2b3d4d] animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Page Header */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          <div className="flex items-center text-sm text-[#768894] mb-2">
            <Link href="/" className="hover:text-[#fa4454]">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/forums" className="hover:text-[#fa4454]">Forums</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Trending</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold flex items-center">
                <span className="text-2xl mr-2">🔥</span>
                Trending Topics
              </h1>
              <p className="text-[#768894] text-sm mt-1">
                Most popular discussions in the community
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            {/* Filters */}
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded mb-6 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Time Period Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#768894] font-medium">Time Period:</span>
                  <div className="flex space-x-1">
                    {timePeriods.map(period => (
                      <button
                        key={period.id}
                        onClick={() => handleFilterChange('period', period.id)}
                        className={`px-3 py-1 text-sm rounded transition-colors ${
                          timePeriod === period.id
                            ? 'bg-[#fa4454] text-white'
                            : 'bg-[#2b3d4d] text-[#768894] hover:text-white hover:bg-[#354c5f]'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-[#768894] font-medium">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="bg-[#2b3d4d] text-white border border-[#354c5f] rounded px-3 py-1 text-sm focus:outline-none focus:border-[#fa4454]"
                  >
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Trending Threads */}
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
              <div className="bg-[#0f1923] px-4 py-3 border-b border-[#2b3d4d]">
                <h2 className="font-medium flex items-center">
                  <span className="mr-2">📈</span>
                  Trending Discussions
                  <span className="ml-2 text-xs text-[#768894]">
                    ({threads.length} topics)
                  </span>
                </h2>
              </div>

              {threads.length > 0 ? (
                <div className="divide-y divide-[#2b3d4d]">
                  {threads.map((thread, index) => (
                    <Link
                      key={thread.id}
                      href={`/forums/${thread.category.id}/${thread.id}`}
                      className="block hover:bg-[#0f1923] p-4 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {/* Trending Rank and Title */}
                          <div className="flex items-center mb-2">
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-[#fa4454] text-white text-xs font-bold mr-3">
                              {index + 1}
                            </div>
                            <h3 className="font-medium group-hover:text-[#fa4454] transition-colors truncate">
                              {thread.title}
                            </h3>
                          </div>

                          {/* Excerpt */}
                          {thread.excerpt && (
                            <p className="text-[#768894] text-sm mb-2 line-clamp-2">
                              {thread.excerpt}
                            </p>
                          )}

                          {/* Meta Information */}
                          <div className="flex flex-wrap items-center text-xs text-[#768894] space-x-4">
                            <span>by <span className="text-white">{thread.author}</span></span>
                            <span>in <span className="text-[#fa4454]">{thread.category.name}</span></span>
                            <span>{thread.posts} replies</span>
                            <span>{thread.views.toLocaleString()} views</span>
                            <span>{thread.likes} likes</span>
                          </div>

                          {/* Tags */}
                          {thread.tags && thread.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {thread.tags.slice(0, 3).map(tag => (
                                <span 
                                  key={tag}
                                  className="px-2 py-0.5 bg-[#2b3d4d] text-[#768894] text-xs rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Trending Score and Time */}
                        <div className="ml-4 text-right flex-shrink-0">
                          <div className="text-[#fa4454] font-bold text-lg">
                            {thread.score.toFixed(1)}
                          </div>
                          <div className="text-[#768894] text-xs">trend score</div>
                          <div className="text-[#768894] text-xs mt-1">
                            {formatTimeAgo(thread.lastActivity)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-[#768894] text-4xl mb-4">📊</div>
                  <h3 className="text-lg font-medium mb-2">No Trending Topics</h3>
                  <p className="text-[#768894] mb-4">
                    No trending discussions found for the selected filters.
                  </p>
                  <button
                    onClick={() => {
                      router.push('/forums/trending');
                    }}
                    className="bg-[#2b3d4d] hover:bg-[#354c5f] text-white px-4 py-2 rounded font-medium transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>

            {/* Algorithm Info */}
            <div className="mt-6 bg-[#1a242d] border border-[#2b3d4d] rounded p-4">
              <h3 className="font-medium mb-2 flex items-center">
                <span className="mr-2">ℹ️</span>
                How Trending Works
              </h3>
              <p className="text-[#768894] text-sm leading-relaxed">
                Our trending algorithm considers multiple factors including recent activity, engagement rate, 
                view count, likes, and discussion velocity to surface the most interesting topics. 
                Threads are ranked by a dynamic score that favors both popular and rapidly growing discussions.
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            <ForumSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
