// src/app/forums/page.tsx - VLR.gg Quality Forums Homepage
'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ForumCategoryCard from '@/components/ForumCategoryCard';
import ForumSidebar from '@/components/ForumSidebar';
import { useAuth } from '@/context/AuthContext';

interface ForumCategory {
  id: string;
  name: string;
  description: string;
  threads: number;
  posts: number;
  lastPost?: {
    title: string;
    author: string;
    date: string;
    threadId: string;
  };
  icon?: string;
}

interface FeaturedThread {
  id: string;
  title: string;
  author: string;
  category: string;
  posts: number;
  views: number;
  lastActivity: string;
  isPinned?: boolean;
  isHot?: boolean;
}

interface ForumStats {
  totalThreads: number;
  totalPosts: number;
  totalUsers: number;
  activeUsers: number;
  newestUser: string;
}

export default function ForumHomePage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [featuredThreads, setFeaturedThreads] = useState<FeaturedThread[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock data for development
  const mockCategories: ForumCategory[] = useMemo(() => [
    {
      id: 'general',
      name: 'General Discussion',
      description: 'General talk about Marvel Rivals',
      threads: 1254,
      posts: 18742,
      icon: '💬',
      lastPost: {
        title: 'Season 1 Thoughts and Feedback',
        author: 'MarvelFan2025',
        date: '2 minutes ago',
        threadId: '12345'
      }
    },
    {
      id: 'strategy',
      name: 'Strategy & Tips',
      description: 'Game strategies, guides, and tips',
      threads: 892,
      posts: 12456,
      icon: '🎯',
      lastPost: {
        title: 'Best Hero Combos for Ranked Play',
        author: 'ProGamer99',
        date: '5 minutes ago',
        threadId: '12344'
      }
    },
    {
      id: 'heroes',
      name: 'Hero Discussion',
      description: 'Discussion about specific heroes',
      threads: 756,
      posts: 9834,
      icon: '🦸',
      lastPost: {
        title: 'Iron Man Build Guide Updated',
        author: 'TonyStarkMain',
        date: '12 minutes ago',
        threadId: '12343'
      }
    },
    {
      id: 'esports',
      name: 'Esports & Competitive',
      description: 'Tournament talk and competitive scene',
      threads: 445,
      posts: 6789,
      icon: '🏆',
      lastPost: {
        title: 'MRVL Championship Grand Finals Discussion',
        author: 'EsportsWatcher',
        date: '18 minutes ago',
        threadId: '12342'
      }
    },
    {
      id: 'technical',
      name: 'Technical Support',
      description: 'Bug reports and technical issues',
      threads: 234,
      posts: 1876,
      icon: '🔧',
      lastPost: {
        title: 'Performance Issues After Latest Patch',
        author: 'TechHelper',
        date: '32 minutes ago',
        threadId: '12341'
      }
    },
    {
      id: 'community',
      name: 'Community Events',
      description: 'Community events and announcements',
      threads: 123,
      posts: 987,
      icon: '🎉',
      lastPost: {
        title: 'Weekly Community Tournament Sign-ups',
        author: 'CommunityMod',
        date: '1 hour ago',
        threadId: '12340'
      }
    }
  ], []);

  const mockFeaturedThreads: FeaturedThread[] = useMemo(() => [
    {
      id: '1',
      title: 'Welcome to the Marvel Rivals Community Forums!',
      author: 'Admin',
      category: 'general',
      posts: 47,
      views: 2341,
      lastActivity: '3 minutes ago',
      isPinned: true
    },
    {
      id: '2',
      title: 'Season 1 Meta Discussion - What Heroes Are Dominating?',
      author: 'MetaAnalyst',
      category: 'strategy',
      posts: 89,
      views: 4567,
      lastActivity: '8 minutes ago',
      isHot: true
    },
    {
      id: '3',
      title: 'MRVL Championship 2025 - Predictions and Analysis',
      author: 'EsportsExpert',
      category: 'esports',
      posts: 156,
      views: 7823,
      lastActivity: '15 minutes ago',
      isHot: true
    },
    {
      id: '4',
      title: 'Iron Man vs Captain America - Ultimate Showdown Guide',
      author: 'HeroMaster',
      category: 'heroes',
      posts: 67,
      views: 3456,
      lastActivity: '22 minutes ago'
    }
  ], []);

  const mockStats: ForumStats = useMemo(() => ({
    totalThreads: 3704,
    totalPosts: 50684,
    totalUsers: 12847,
    activeUsers: 284,
    newestUser: 'SpiderWebSlinger'
  }), []);

  useEffect(() => {
    const fetchForumData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch real data first
        const [categoriesRes, featuredRes] = await Promise.all([
          fetch('/api/public/forums/categories'),
          fetch('/api/public/forums/hot')
        ]);

        if (categoriesRes.ok && featuredRes.ok) {
          const [categoriesData, featuredData] = await Promise.all([
            categoriesRes.json(),
            featuredRes.json()
          ]);

          setCategories(categoriesData);
          setFeaturedThreads(featuredData);
          setStats(mockStats); // Use mock stats for now
        } else {
          throw new Error('API not available');
        }
      } catch (err) {
        console.warn('API failed, using mock data:', err);
        
        // Use mock data as fallback
        setCategories(mockCategories);
        setFeaturedThreads(mockFeaturedThreads);
        setStats(mockStats);
      } finally {
        setLoading(false);
      }
    };

    fetchForumData();
  }, [mockCategories, mockFeaturedThreads, mockStats]);

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
            <div className="lg:w-3/4 space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-[#1a242d] border border-[#2b3d4d] animate-pulse rounded"></div>
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

  if (error && categories.length === 0) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="container mx-auto py-6">
          <div className="bg-[#1a242d] border border-[#fa4454] rounded p-8 text-center">
            <div className="text-[#fa4454] text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Unable to Load Forums</h2>
            <p className="text-[#768894] mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Retry
            </button>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Community Forums</h1>
              <p className="text-[#768894] text-sm mt-1">
                Connect with the Marvel Rivals community
              </p>
            </div>
            {user && (
              <Link 
                href="/forums/new-thread" 
                className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-4 py-2 rounded font-medium transition-colors flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Thread
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4 space-y-6">
            {/* Forum Announcement */}
            <div className="bg-[#1a242d] border-l-4 border-[#fa4454] rounded p-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 mr-3 text-[#fa4454] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h2 className="text-lg font-bold mb-1">Community Guidelines</h2>
                  <p className="text-[#768894] text-sm">
                    Be respectful, stay on topic, and help create a positive environment for all Marvel Rivals fans. 
                    Read our <Link href="/forums/rules" className="text-[#fa4454] hover:underline font-medium">full community guidelines</Link> before posting.
                  </p>
                </div>
              </div>
            </div>

            {/* Featured Threads */}
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
              <div className="bg-[#0f1923] px-4 py-3 border-b border-[#2b3d4d]">
                <h2 className="font-medium">Featured Discussions</h2>
              </div>
              <div className="divide-y divide-[#2b3d4d]">
                {featuredThreads.map((thread) => (
                  <Link 
                    key={thread.id} 
                    href={`/forums/${thread.category}/${thread.id}`}
                    className="flex items-center justify-between hover:bg-[#0f1923] p-4 transition-colors group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-1">
                        {thread.isPinned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-900/30 text-green-400 mr-2">
                            📌 Pinned
                          </span>
                        )}
                        {thread.isHot && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fa4454]/20 text-[#fa4454] mr-2">
                            🔥 Hot
                          </span>
                        )}
                        <h3 className="font-medium group-hover:text-[#fa4454] transition-colors truncate">
                          {thread.title}
                        </h3>
                      </div>
                      <div className="text-xs text-[#768894]">
                        by <span className="text-white">{thread.author}</span> in{' '}
                        <span className="text-[#fa4454]">{categories.find(c => c.id === thread.category)?.name || thread.category}</span>
                        {' '}• {thread.posts} replies • {thread.views} views
                      </div>
                    </div>
                    <div className="text-xs text-[#768894] ml-4 flex-shrink-0">
                      {thread.lastActivity}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Forum Categories */}
            <div>
              <h2 className="text-lg font-bold mb-4">Forum Categories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categories.map(category => (
                  <ForumCategoryCard 
                    key={category.id}
                    id={category.id}
                    name={category.name}
                    description={category.description}
                    threads={category.threads}
                    posts={category.posts}
                    lastPost={category.lastPost}
                    icon={category.icon}
                  />
                ))}
              </div>
            </div>

            {/* Forum Statistics */}
            {stats && (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3 border-b border-[#2b3d4d]">
                  <h2 className="font-medium">Forum Statistics</h2>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-[#fa4454] text-2xl font-bold">{stats.totalThreads.toLocaleString()}</div>
                      <div className="text-[#768894] text-xs mt-1">Threads</div>
                    </div>
                    <div>
                      <div className="text-[#fa4454] text-2xl font-bold">{stats.totalPosts.toLocaleString()}</div>
                      <div className="text-[#768894] text-xs mt-1">Posts</div>
                    </div>
                    <div>
                      <div className="text-[#fa4454] text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
                      <div className="text-[#768894] text-xs mt-1">Members</div>
                    </div>
                    <div>
                      <div className="text-green-400 text-2xl font-bold">{stats.activeUsers}</div>
                      <div className="text-[#768894] text-xs mt-1">Online Now</div>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <div className="text-white text-lg font-bold truncate">{stats.newestUser}</div>
                      <div className="text-[#768894] text-xs mt-1">Newest Member</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
