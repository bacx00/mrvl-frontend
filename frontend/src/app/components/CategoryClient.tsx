// src/components/CategoryClient.tsx
'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThreadRow, { ThreadData } from './ThreadRow';
import ForumCategoryCard, { ForumCategory } from './ForumCategoryCard';
import { formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface CategoryInfo {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  color: string;
  threadCount: number;
  postCount: number;
  isLocked?: boolean;
  isPrivate?: boolean;
  requiredRole?: string;
  moderators?: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
  }[];
  subcategories?: ForumCategory[];
  rules?: string[];
}

interface CategoryClientProps {
  categoryId: string;
  initialCategory?: CategoryInfo;
  initialThreads?: ThreadData[];
}

const CategoryClient: React.FC<CategoryClientProps> = ({
  categoryId,
  initialCategory,
  initialThreads = []
}) => {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [category, setCategory] = useState<CategoryInfo | null>(initialCategory || null);
  const [threads, setThreads] = useState<ThreadData[]>(initialThreads);
  const [loading, setLoading] = useState(!initialCategory || !initialThreads.length);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination & filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sortBy, setSortBy] = useState<'lastActivity' | 'created' | 'replies' | 'title'>('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterBy, setFilterBy] = useState<'all' | 'pinned' | 'locked' | 'hot' | 'unanswered'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  
  // UI state
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'detailed' | 'compact'>('detailed');
  const [selectedThreads, setSelectedThreads] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // New thread state
  const [newThreadTitle, setNewThreadTitle] = useState('');
  const [newThreadContent, setNewThreadContent] = useState('');
  const [newThreadTags, setNewThreadTags] = useState<string[]>([]);
  const [newThreadPrefix, setNewThreadPrefix] = useState('');
  const [submittingThread, setSubmittingThread] = useState(false);
  
  // Refs
  const observer = useRef<IntersectionObserver | null>(null);
  const threadsContainerRef = useRef<HTMLDivElement>(null);

  // Fetch category and threads
  const fetchCategoryData = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        sort: sortBy,
        order: sortOrder,
        filter: filterBy,
        ...(searchQuery && { search: searchQuery }),
        ...(authorFilter && { author: authorFilter }),
        ...(tagFilter && { tag: tagFilter })
      });
      
      const categoryResponse = await fetch(`/api/forums/categories/${categoryId}`);
      const threadsResponse = await fetch(`/api/forums/categories/${categoryId}/threads?${params}`);
      
      if (!categoryResponse.ok || !threadsResponse.ok) {
        throw new Error('Failed to fetch category data');
      }
      
      const categoryData: CategoryInfo = await categoryResponse.json();
      const threadsData = await threadsResponse.json();
      
      setCategory(categoryData);
      
      if (append) {
        setThreads(prev => [...prev, ...threadsData.threads]);
      } else {
        setThreads(threadsData.threads);
      }
      
      setTotalPages(threadsData.totalPages || 1);
      setHasMore(page < (threadsData.totalPages || 1));
      setCurrentPage(page);
      
    } catch (err) {
      console.error('Error fetching category data:', err);
      setError('Failed to load category');
      
      // Fallback mock data for development
      if (!category && !threads.length) {
        const mockCategory: CategoryInfo = {
          id: categoryId,
          name: 'Strategy & Tips',
          slug: 'strategy-tips',
          description: 'Discuss game strategies, builds, team compositions, and pro tips.',
          icon: '🎯',
          color: '#4ade80',
          threadCount: 1247,
          postCount: 18394,
          moderators: [
            {
              id: 'mod1',
              username: 'StrategyMod',
              avatar: '/avatars/strategy-mod.png',
              role: 'moderator'
            }
          ],
          rules: [
            'Keep discussions constructive and helpful',
            'No spam or duplicate posts',
            'Use appropriate thread titles',
            'Search before creating new threads'
          ]
        };
        
        const mockThreads: ThreadData[] = [
          {
            id: '1',
            title: 'Complete Tank Meta Guide - Season 1 Analysis',
            author: {
              id: 'user1',
              username: 'TankExpert',
              avatar: '/avatars/tank-expert.png',
              role: 'vip',
              isOnline: true
            },
            category: {
              id: categoryId,
              name: 'Strategy & Tips',
              slug: 'strategy-tips',
              color: '#4ade80'
            },
            replyCount: 47,
            viewCount: 2341,
            lastActivity: {
              author: {
                id: 'user2',
                username: 'NewPlayer2024',
                role: 'user'
              },
              timestamp: new Date(Date.now() - 1000 * 60 * 15),
              postNumber: 48
            },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
            isPinned: true,
            isHot: true,
            hasUnreadPosts: true,
            tags: ['meta', 'tanks', 'guide'],
            preview: 'In this comprehensive guide, we\'ll analyze the current tank meta and provide strategies for each tank hero...'
          }
        ];
        
        setCategory(mockCategory);
        setThreads(mockThreads);
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, sortBy, sortOrder, filterBy, searchQuery, authorFilter, tagFilter, category, threads.length]);

  // Infinite scroll observer
  const lastThreadElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchCategoryData(currentPage + 1, true);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, currentPage, fetchCategoryData]);

  // Initial load
  useEffect(() => {
    if (!initialCategory || !initialThreads.length) {
      fetchCategoryData();
    }
  }, [fetchCategoryData, initialCategory, initialThreads.length]);

  // URL parameter handling
  useEffect(() => {
    const page = searchParams.get('page');
    const sort = searchParams.get('sort');
    const filter = searchParams.get('filter');
    const search = searchParams.get('search');
    
    if (page && parseInt(page) !== currentPage) {
      setCurrentPage(parseInt(page));
    }
    if (sort && sort !== sortBy) {
      setSortBy(sort as typeof sortBy);
    }
    if (filter && filter !== filterBy) {
      setFilterBy(filter as typeof filterBy);
    }
    if (search && search !== searchQuery) {
      setSearchQuery(search);
    }
  }, [searchParams, currentPage, sortBy, filterBy, searchQuery]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    if (currentPage > 1) params.set('page', currentPage.toString());
    if (sortBy !== 'lastActivity') params.set('sort', sortBy);
    if (filterBy !== 'all') params.set('filter', filterBy);
    if (searchQuery) params.set('search', searchQuery);
    
    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    router.replace(newURL, { scroll: false });
  }, [currentPage, sortBy, filterBy, searchQuery, router]);

  // Handle thread selection
  const handleThreadSelect = useCallback((threadId: string) => {
    setSelectedThreads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(threadId)) {
        newSet.delete(threadId);
      } else {
        newSet.add(threadId);
      }
      setShowBulkActions(newSet.size > 0);
      return newSet;
    });
  }, []);

  // Handle new thread creation
  const handleCreateThread = useCallback(async () => {
    if (!newThreadTitle.trim() || !newThreadContent.trim() || !user) return;
    
    setSubmittingThread(true);
    
    try {
      const response = await fetch(`/api/forums/categories/${categoryId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newThreadTitle,
          content: newThreadContent,
          tags: newThreadTags,
          prefix: newThreadPrefix
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create thread');
      }
      
      const newThread: ThreadData = await response.json();
      setThreads(prev => [newThread, ...prev]);
      
      // Reset form
      setNewThreadTitle('');
      setNewThreadContent('');
      setNewThreadTags([]);
      setNewThreadPrefix('');
      setShowNewThreadModal(false);
      
      // Navigate to new thread
      router.push(`${ROUTES.FORUMS}/${category?.slug}/${newThread.slug || newThread.id}`);
      
    } catch (err) {
      console.error('Error creating thread:', err);
      alert('Failed to create thread. Please try again.');
    } finally {
      setSubmittingThread(false);
    }
  }, [user, categoryId, newThreadTitle, newThreadContent, newThreadTags, newThreadPrefix, category, router]);

  // Check if user has access
  const hasAccess = !category?.isPrivate || 
    !category?.requiredRole || 
    user?.role === 'admin' || 
    user?.role === 'moderator' ||
    user?.role === category?.requiredRole;

  if (loading && !threads.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-[#1a2332] rounded-lg"></div>
          <div className="flex space-x-4">
            <div className="h-10 bg-[#2b3d4d] rounded flex-1"></div>
            <div className="h-10 w-32 bg-[#2b3d4d] rounded"></div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-[#1a2332] rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !category) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">📁</div>
          <h1 className="text-2xl font-bold text-white mb-4">Category Not Found</h1>
          <p className="text-[#768894] mb-6">{error}</p>
          <button
            onClick={() => fetchCategoryData()}
            className="px-6 py-3 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-white mb-4">Access Restricted</h1>
          <p className="text-[#768894] mb-6">
            You don't have permission to view this category.
          </p>
          {!user ? (
            <div className="flex items-center justify-center space-x-4">
              <a
                href={ROUTES.LOGIN}
                className="px-6 py-3 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg transition-colors"
              >
                Log In
              </a>
              <a
                href={ROUTES.REGISTER}
                className="px-6 py-3 bg-[#2b3d4d] hover:bg-[#374555] text-white rounded-lg transition-colors"
              >
                Sign Up
              </a>
            </div>
          ) : (
            <a
              href={ROUTES.FORUMS}
              className="px-6 py-3 bg-[#2b3d4d] hover:bg-[#374555] text-white rounded-lg transition-colors"
            >
              Back to Forums
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      
      {/* Category Header */}
      {category && (
        <div className="mb-6">
          
          {/* Breadcrumb */}
          <nav className="text-sm text-[#768894] mb-4">
            <div className="flex items-center space-x-2">
              <a href={ROUTES.FORUMS} className="hover:text-[#fa4454] transition-colors">Forums</a>
              <span>›</span>
              <span className="text-white">{category.name}</span>
            </div>
          </nav>
          
          {/* Category Info */}
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6 mb-6">
            <div className="flex items-start space-x-4">
              
              {/* Category Icon */}
              <div 
                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
                style={{ backgroundColor: category.color }}
              >
                {category.icon || category.name.charAt(0)}
              </div>
              
              {/* Category Details */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h1 className="text-2xl font-bold text-white">{category.name}</h1>
                  
                  {/* Category Actions */}
                  <div className="flex items-center space-x-2">
                    {user && !category.isLocked && (
                      <button
                        onClick={() => setShowNewThreadModal(true)}
                        className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        New Thread
                      </button>
                    )}
                    
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className="px-4 py-2 bg-[#2b3d4d] hover:bg-[#374555] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Filters
                    </button>
                  </div>
                </div>
                
                <p className="text-[#768894] mb-4">{category.description}</p>
                
                {/* Category Stats */}
                <div className="flex items-center space-x-6 text-sm text-[#768894]">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>{formatNumber(category.threadCount)} threads</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    <span>{formatNumber(category.postCount)} posts</span>
                  </div>
                  
                  {category.moderators && category.moderators.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Moderated by {category.moderators.map(m => m.username).join(', ')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Category Rules */}
            {category.rules && category.rules.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2b3d4d]">
                <h3 className="text-sm font-medium text-white mb-2">Category Rules</h3>
                <ul className="text-sm text-[#768894] space-y-1">
                  {category.rules.map((rule, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-[#fa4454] mt-1">•</span>
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Subcategories */}
          {category.subcategories && category.subcategories.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">Subcategories</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.subcategories.map((subcategory) => (
                  <ForumCategoryCard
                    key={subcategory.id}
                    category={subcategory}
                    variant="compact"
                    showModerators={false}
                    showActivity={false}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Filters & Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          
          {/* Search & Filters */}
          <div className="flex items-center space-x-4 flex-1">
            
            {/* Search Input */}
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search threads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-4 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded-lg text-white placeholder-[#768894] text-sm"
              />
              <svg className="absolute left-2 top-2.5 w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Quick Filters */}
            <div className="flex items-center space-x-2">
              {['all', 'pinned', 'hot', 'unanswered'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterBy(filter as typeof filterBy)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    filterBy === filter
                      ? 'bg-[#fa4454] text-white'
                      : 'bg-[#2b3d4d] text-[#768894] hover:bg-[#374555] hover:text-white'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {/* View Controls */}
          <div className="flex items-center space-x-2">
            
            {/* Sort Dropdown */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sort, order] = e.target.value.split('-');
                setSortBy(sort as typeof sortBy);
                setSortOrder(order as typeof sortOrder);
              }}
              className="px-3 py-2 bg-[#2b3d4d] border border-[#2b3d4d] rounded-lg text-white text-sm"
            >
              <option value="lastActivity-desc">Latest Activity</option>
              <option value="created-desc">Newest First</option>
              <option value="created-asc">Oldest First</option>
              <option value="replies-desc">Most Replies</option>
              <option value="title-asc">Title A-Z</option>
            </select>
            
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#2b3d4d] rounded-lg p-1">
              <button
                onClick={() => setViewMode('detailed')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'detailed' ? 'bg-[#fa4454] text-white' : 'text-[#768894] hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'compact' ? 'bg-[#fa4454] text-white' : 'text-[#768894] hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Advanced Filters */}
        {showFilters && (
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Author</label>
                <input
                  type="text"
                  placeholder="Filter by author..."
                  value={authorFilter}
                  onChange={(e) => setAuthorFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] text-sm"
                />
              </div>
              
              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Tag</label>
                <input
                  type="text"
                  placeholder="Filter by tag..."
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] text-sm"
                />
              </div>
              
              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setAuthorFilter('');
                    setTagFilter('');
                    setFilterBy('all');
                    setSortBy('lastActivity');
                    setSortOrder('desc');
                  }}
                  className="px-4 py-2 bg-[#2b3d4d] hover:bg-[#374555] text-white rounded text-sm transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Bulk Actions */}
        {showBulkActions && user && (user.role === 'admin' || user.role === 'moderator') && (
          <div className="bg-[#fa4454] rounded-lg p-3 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {selectedThreads.size} thread{selectedThreads.size !== 1 ? 's' : ''} selected
              </span>
              
              <div className="flex items-center space-x-2">
                <button className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-sm transition-colors">
                  Pin Selected
                </button>
                <button className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-sm transition-colors">
                  Lock Selected
                </button>
                <button className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-sm transition-colors">
                  Move Selected
                </button>
                <button 
                  onClick={() => {
                    setSelectedThreads(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Threads List */}
      <div ref={threadsContainerRef} className="space-y-2 mb-8">
        {threads.length > 0 ? (
          threads.map((thread, index) => (
            <div
              key={thread.id}
              ref={index === threads.length - 1 ? lastThreadElementRef : null}
              className="relative"
            >
              {/* Bulk Selection Checkbox */}
              {user && (user.role === 'admin' || user.role === 'moderator') && (
                <div className="absolute left-2 top-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedThreads.has(thread.id)}
                    onChange={() => handleThreadSelect(thread.id)}
                    className="w-4 h-4 text-[#fa4454] bg-[#1a2332] border-[#2b3d4d] rounded"
                  />
                </div>
              )}
              
              <ThreadRow
                thread={thread}
                variant={viewMode}
                showCategory={false}
                showPreview={viewMode === 'detailed'}
                showTags={viewMode === 'detailed'}
                className={selectedThreads.has(thread.id) ? 'ml-8' : ''}
              />
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-white mb-2">No threads found</h3>
            <p className="text-[#768894] mb-6">
              {searchQuery || authorFilter || tagFilter 
                ? 'Try adjusting your search criteria'
                : 'Be the first to start a discussion!'
              }
            </p>
            {user && !category?.isLocked && (
              <button
                onClick={() => setShowNewThreadModal(true)}
                className="px-6 py-3 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg font-medium transition-colors"
              >
                Create New Thread
              </button>
            )}
          </div>
        )}
        
        {/* Loading More Indicator */}
        {loading && hasMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fa4454]"></div>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-[#2b3d4d] hover:bg-[#374555] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-2 rounded transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#fa4454] text-white'
                    : 'bg-[#2b3d4d] hover:bg-[#374555] text-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-[#2b3d4d] hover:bg-[#374555] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
      
      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Create New Thread</h2>
                <button
                  onClick={() => setShowNewThreadModal(false)}
                  className="text-[#768894] hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Thread Form */}
              <div className="space-y-4">
                
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Thread Title</label>
                  <input
                    type="text"
                    value={newThreadTitle}
                    onChange={(e) => setNewThreadTitle(e.target.value)}
                    placeholder="Enter thread title..."
                    className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894]"
                    maxLength={200}
                  />
                  <div className="text-xs text-[#768894] mt-1">
                    {newThreadTitle.length}/200 characters
                  </div>
                </div>
                
                {/* Prefix */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Prefix (Optional)</label>
                  <select
                    value={newThreadPrefix}
                    onChange={(e) => setNewThreadPrefix(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white"
                  >
                    <option value="">No prefix</option>
                    <option value="GUIDE">GUIDE</option>
                    <option value="QUESTION">QUESTION</option>
                    <option value="DISCUSSION">DISCUSSION</option>
                    <option value="META">META</option>
                    <option value="NEWS">NEWS</option>
                  </select>
                </div>
                
                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Tags (Optional)</label>
                  <input
                    type="text"
                    placeholder="Add tags separated by commas..."
                    onChange={(e) => setNewThreadTags(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                    className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894]"
                  />
                  <div className="text-xs text-[#768894] mt-1">
                    Separate multiple tags with commas
                  </div>
                </div>
                
                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Content</label>
                  <textarea
                    value={newThreadContent}
                    onChange={(e) => setNewThreadContent(e.target.value)}
                    placeholder="Write your post content..."
                    rows={8}
                    className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] resize-none"
                  />
                </div>
                
                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setShowNewThreadModal(false)}
                    className="px-4 py-2 text-[#768894] hover:text-white transition-colors"
                    disabled={submittingThread}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={handleCreateThread}
                    disabled={!newThreadTitle.trim() || !newThreadContent.trim() || submittingThread}
                    className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingThread ? 'Creating...' : 'Create Thread'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryClient;
