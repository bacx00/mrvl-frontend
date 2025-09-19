// src/app/forums/[category]/page.tsx - VLR.gg Quality Category View
'use client';
import { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import ForumSidebar from '@/components/ForumSidebar';
import ThreadRow from '@/components/ThreadRow';
import { useAuth } from '@/context/AuthContext';

interface ThreadSummary {
  id: string;
  title: string;
  author: string;
  replies: number;
  views: number;
  lastReplyTime: string;
  lastReplyAuthor: string;
  isPinned?: boolean;
  isLocked?: boolean;
  isHot?: boolean;
  tags?: string[];
}

interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  threads: number;
  posts: number;
  rules?: string[];
  moderators?: string[];
}

export default function ForumCategoryPage() {
  const { category } = useParams();
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [categoryInfo, setCategoryInfo] = useState<CategoryInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'newest' | 'activity' | 'popular'>('activity');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Mock category data
  const mockCategoryInfo: CategoryInfo = useMemo(() => ({
    id: category as string,
    name: getCategoryDisplayName(category as string),
    description: getCategoryDescription(category as string),
    threads: 1254,
    posts: 18742,
    rules: [
      'Keep discussions respectful and on-topic',
      'Use search before creating new threads',
      'No spam or promotional content',
      'Follow the community guidelines'
    ],
    moderators: ['ModeratorOne', 'GameMaster', 'CommunityHelper']
  }), [category]);

  // Mock threads data
  const mockThreads: ThreadSummary[] = useMemo(() => [
    {
      id: '1',
      title: 'Welcome to ' + getCategoryDisplayName(category as string),
      author: 'CommunityMod',
      replies: 23,
      views: 1245,
      lastReplyTime: new Date(Date.now() - 3600000).toISOString(),
      lastReplyAuthor: 'RegularUser',
      isPinned: true,
      tags: ['announcement', 'welcome']
    },
    {
      id: '2',
      title: 'Season 1 Meta Analysis - Top Tier Heroes and Strategies',
      author: 'ProAnalyst',
      replies: 89,
      views: 4567,
      lastReplyTime: new Date(Date.now() - 1800000).toISOString(),
      lastReplyAuthor: 'MetaGamer',
      isHot: true,
      tags: ['meta', 'strategy', 'analysis']
    },
    {
      id: '3',
      title: 'Iron Man Build Guide - Maximizing DPS Output',
      author: 'TonyStarkMain',
      replies: 45,
      views: 2134,
      lastReplyTime: new Date(Date.now() - 7200000).toISOString(),
      lastReplyAuthor: 'BuildExpert',
      tags: ['guide', 'iron-man', 'builds']
    },
    {
      id: '4',
      title: 'Team Composition Discussion - Best Synergies',
      author: 'TeamPlayer',
      replies: 67,
      views: 3456,
      lastReplyTime: new Date(Date.now() - 10800000).toISOString(),
      lastReplyAuthor: 'SynergyMaster',
      tags: ['team-comp', 'strategy']
    },
    {
      id: '5',
      title: 'Bug Report: Captain America Shield Physics Issue',
      author: 'BugHunter',
      replies: 12,
      views: 876,
      lastReplyTime: new Date(Date.now() - 14400000).toISOString(),
      lastReplyAuthor: 'DevTeam',
      isLocked: true,
      tags: ['bug-report', 'captain-america']
    },
    {
      id: '6',
      title: 'Weekly Tournament Sign-ups - Community Event',
      author: 'EventOrganizer',
      replies: 34,
      views: 1987,
      lastReplyTime: new Date(Date.now() - 18000000).toISOString(),
      lastReplyAuthor: 'Participant123',
      isPinned: true,
      tags: ['tournament', 'community', 'event']
    }
  ], [category]);

  function getCategoryDisplayName(categoryId: string): string {
    const names: Record<string, string> = {
      'general': 'General Discussion',
      'strategy': 'Strategy & Tips',
      'heroes': 'Hero Discussion',
      'esports': 'Esports & Competitive',
      'technical': 'Technical Support',
      'community': 'Community Events'
    };
    return names[categoryId] || categoryId.charAt(0).toUpperCase() + categoryId.slice(1).replace('-', ' ');
  }

  function getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      'general': 'General discussion about Marvel Rivals and community topics',
      'strategy': 'Share strategies, tips, and gameplay advice',
      'heroes': 'Discuss specific heroes, builds, and playstyles',
      'esports': 'Competitive scene, tournaments, and esports discussions',
      'technical': 'Bug reports, technical issues, and troubleshooting',
      'community': 'Community events, announcements, and activities'
    };
    return descriptions[categoryId] || 'Discussion forum for ' + getCategoryDisplayName(categoryId);
  }

  useEffect(() => {
    const fetchCategoryData = async () => {
      setLoading(true);
      try {
        // Try to fetch real data
        const categoriesRes = await fetch('/api/public/forums/categories');
        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json();
          const foundCategory = categoriesData.find((cat: any) => cat.id === category);
          
          if (foundCategory) {
            setCategoryInfo(foundCategory);
          } else {
            setCategoryInfo(mockCategoryInfo);
          }

          // Fetch threads for this category
          const threadsRes = await fetch(`/api/public/forums/threads?category=${category}&page=${currentPage}&sort=${sortOrder}`);
          if (threadsRes.ok) {
            const threadsData = await threadsRes.json();
            setThreads(threadsData.threads || []);
            setTotalPages(threadsData.totalPages || 1);
          } else {
            throw new Error('Threads API not available');
          }
        } else {
          throw new Error('Categories API not available');
        }
      } catch (error) {
        console.warn('API failed, using mock data:', error);
        setCategoryInfo(mockCategoryInfo);
        setThreads(mockThreads);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    if (category) {
      fetchCategoryData();
    }
  }, [category, currentPage, sortOrder, mockCategoryInfo, mockThreads]);

  // Sort threads with pinned ones at the top
  const sortedThreads = useMemo(() => {
    return [...threads].sort((a, b) => {
      // Always keep pinned threads at the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Then sort by the selected order
      switch (sortOrder) {
        case 'newest':
          return new Date(b.lastReplyTime).getTime() - new Date(a.lastReplyTime).getTime();
        case 'popular':
          return b.views - a.views;
        case 'activity':
        default:
          return b.replies - a.replies;
      }
    });
  }, [threads, sortOrder]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
          <div className="container mx-auto py-4">
            <div className="h-6 w-32 bg-[#2b3d4d] animate-pulse rounded mb-2"></div>
            <div className="h-8 w-48 bg-[#2b3d4d] animate-pulse rounded"></div>
          </div>
        </div>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-3/4 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-[#1a242d] border border-[#2b3d4d] animate-pulse rounded"></div>
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
      {/* Category Header */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-[#768894] mb-2">
            <Link href="/" className="hover:text-[#fa4454]">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/forums" className="hover:text-[#fa4454]">Forums</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{categoryInfo?.name}</span>
          </div>
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold">{categoryInfo?.name}</h1>
              {categoryInfo?.description && (
                <p className="text-[#768894] text-sm mt-1">{categoryInfo.description}</p>
              )}
              <div className="flex items-center text-xs text-[#768894] mt-2 space-x-4">
                <span>{categoryInfo?.threads.toLocaleString()} threads</span>
                <span>{categoryInfo?.posts.toLocaleString()} posts</span>
              </div>
            </div>
            {user && (
              <Link 
                href={`/forums/${category}/new`}
                className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-4 py-2 rounded font-medium transition-colors"
              >
                New Thread
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            {/* Category Rules (if available) */}
            {categoryInfo?.rules && categoryInfo.rules.length > 0 && (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded mb-6 p-4">
                <h3 className="font-medium mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-[#fa4454]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Category Guidelines
                </h3>
                <ul className="text-[#768894] text-sm space-y-1">
                  {categoryInfo.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#fa4454] mr-2">•</span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Threads Section */}
            <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
              {/* Threads Header */}
              <div className="bg-[#0f1923] px-4 py-3 border-b border-[#2b3d4d] flex justify-between items-center">
                <h2 className="font-medium">Threads</h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-[#768894]">Sort by:</span>
                  <div className="flex space-x-2">
                    <button 
                      className={`text-sm px-2 py-1 rounded transition-colors ${
                        sortOrder === 'activity' 
                          ? 'bg-[#fa4454] text-white' 
                          : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
                      }`}
                      onClick={() => setSortOrder('activity')}
                    >
                      Activity
                    </button>
                    <button 
                      className={`text-sm px-2 py-1 rounded transition-colors ${
                        sortOrder === 'newest' 
                          ? 'bg-[#fa4454] text-white' 
                          : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
                      }`}
                      onClick={() => setSortOrder('newest')}
                    >
                      Newest
                    </button>
                    <button 
                      className={`text-sm px-2 py-1 rounded transition-colors ${
                        sortOrder === 'popular' 
                          ? 'bg-[#fa4454] text-white' 
                          : 'text-[#768894] hover:text-white hover:bg-[#2b3d4d]'
                      }`}
                      onClick={() => setSortOrder('popular')}
                    >
                      Popular
                    </button>
                  </div>
                </div>
              </div>

              {/* Threads List */}
              {sortedThreads.length > 0 ? (
                <div className="divide-y divide-[#2b3d4d]">
                  {sortedThreads.map(thread => (
                    <ThreadRow
                      key={thread.id}
                      id={thread.id}
                      title={thread.title}
                      author={thread.author}
                      replies={thread.replies}
                      views={thread.views}
                      lastReplyTime={thread.lastReplyTime}
                      lastReplyAuthor={thread.lastReplyAuthor}
                      category={category as string}
                      isPinned={thread.isPinned}
                      isLocked={thread.isLocked}
                      isHot={thread.isHot}
                      tags={thread.tags}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-[#768894] text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium mb-2">No threads yet</h3>
                  <p className="text-[#768894] mb-4">Be the first to start a discussion in this category!</p>
                  {user && (
                    <Link 
                      href={`/forums/${category}/new`}
                      className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-4 py-2 rounded font-medium transition-colors inline-flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Start New Thread
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex rounded overflow-hidden border border-[#2b3d4d]">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="bg-[#1a242d] hover:bg-[#2b3d4d] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 text-sm border-r border-[#2b3d4d] transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 text-sm border-r border-[#2b3d4d] last:border-r-0 transition-colors ${
                          currentPage === page 
                            ? 'bg-[#fa4454] text-white' 
                            : 'bg-[#1a242d] hover:bg-[#2b3d4d] text-white'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="bg-[#1a242d] hover:bg-[#2b3d4d] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 text-sm transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:w-1/4">
            <ForumSidebar 
              categoryModerators={categoryInfo?.moderators}
              categoryName={categoryInfo?.name}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
