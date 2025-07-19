// src/components/ThreadClient.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import PostCardSimple, { Post } from './PostCardSimple';
import RichTextEditor from './RichTextEditor';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface ThreadInfo {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  author: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
  };
  createdAt: Date;
  postCount: number;
  viewCount: number;
  isLocked: boolean;
  isPinned: boolean;
  isSubscribed?: boolean;
  tags?: string[];
}

interface ThreadClientProps {
  categoryId: string;
  threadId: string;
  initialThread?: ThreadInfo;
  initialPosts?: Post[];
}

const ThreadClient: React.FC<ThreadClientProps> = ({
  categoryId,
  threadId,
  initialThread,
  initialPosts = []
}) => {
  const { user } = useAuth();
  const router = useRouter();
  
  // State management
  const [thread, setThread] = useState<ThreadInfo | null>(initialThread || null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(!initialThread || !initialPosts.length);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Reply state
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [quotedContent, setQuotedContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  
  // UI state
  const [showJumpToPost, setShowJumpToPost] = useState(false);
  const [jumpToPostNumber, setJumpToPostNumber] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterAuthor, setFilterAuthor] = useState<string>('');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  
  // Refs
  const replyEditorRef = useRef<HTMLDivElement>(null);
  const postsContainerRef = useRef<HTMLDivElement>(null);
  const observer = useRef<IntersectionObserver | null>(null);

  // Fetch thread and posts
  const fetchThreadData = useCallback(async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      
      const threadResponse = await fetch(`/api/forums/${categoryId}/threads/${threadId}`);
      const postsResponse = await fetch(`/api/forums/${categoryId}/threads/${threadId}/posts?page=${page}&sort=${sortOrder}&author=${filterAuthor}`);
      
      if (!threadResponse.ok || !postsResponse.ok) {
        throw new Error('Failed to fetch thread data');
      }
      
      const threadData: ThreadInfo = await threadResponse.json();
      const postsData = await postsResponse.json();
      
      setThread(threadData);
      
      if (append) {
        setPosts(prev => [...prev, ...postsData.posts]);
      } else {
        setPosts(postsData.posts);
      }
      
      setTotalPages(postsData.totalPages || 1);
      setHasMore(page < (postsData.totalPages || 1));
      setCurrentPage(page);
      
    } catch (err) {
      console.error('Error fetching thread data:', err);
      setError('Failed to load thread');
      
      // Fallback mock data for development
      if (!thread && !posts.length) {
        const mockThread: ThreadInfo = {
          id: threadId,
          title: 'Sample Thread Title - New Meta Discussion',
          categoryId,
          categoryName: 'Strategy & Tips',
          categorySlug: 'strategy-tips',
          author: {
            id: 'user1',
            username: 'MetaAnalyst',
            avatar: '/avatars/default.png',
            role: 'moderator'
          },
          createdAt: new Date(Date.now() - 86400000),
          postCount: 24,
          viewCount: 1523,
          isLocked: false,
          isPinned: false,
          isSubscribed: false,
          tags: ['meta', 'strategy', 'discussion']
        };
        
        const mockPosts: Post[] = [
          {
            id: '1',
            content: 'Welcome to this thread about the current meta! Let\'s discuss the latest strategies and character combinations that are dominating the ranked ladder.',
            author: {
              id: 'user1',
              username: 'MetaAnalyst',
              avatar: '/avatars/default.png',
              role: 'moderator',
              title: 'Meta Expert',
              joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
              postCount: 2847,
              reputation: 1250,
              isOnline: true
            },
            createdAt: new Date(Date.now() - 86400000),
            postNumber: 1,
            threadId,
            reactions: [
              { type: 'like', count: 12, userReacted: false },
              { type: 'informative', count: 8, userReacted: false }
            ]
          }
        ];
        
        setThread(mockThread);
        setPosts(mockPosts);
      }
    } finally {
      setLoading(false);
    }
  }, [categoryId, threadId, sortOrder, filterAuthor, thread, posts.length]);

  // Infinite scroll observer
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        fetchThreadData(currentPage + 1, true);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore, currentPage, fetchThreadData]);

  // Initial load
  useEffect(() => {
    if (!initialThread || !initialPosts.length) {
      fetchThreadData();
    }
  }, [fetchThreadData, initialThread, initialPosts.length]);

  // Handle reactions
  const handleReaction = useCallback((postId: string, reactionType: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const updatedReactions = post.reactions ? [...post.reactions] : [];
          const existingReactionIndex = updatedReactions.findIndex(r => r.type === reactionType);
          
          if (existingReactionIndex >= 0) {
            const wasReacted = updatedReactions[existingReactionIndex].userReacted;
            updatedReactions[existingReactionIndex] = {
              ...updatedReactions[existingReactionIndex],
              count: wasReacted 
                ? updatedReactions[existingReactionIndex].count - 1 
                : updatedReactions[existingReactionIndex].count + 1,
              userReacted: !wasReacted
            };
          } else {
            updatedReactions.push({
              type: reactionType,
              count: 1,
              userReacted: true
            });
          }
          
          return { ...post, reactions: updatedReactions };
        }
        return post;
      })
    );
  }, []);

  // Handle quote
  const handleQuote = useCallback((postId: string, content: string) => {
    setQuotedContent(content);
    setIsReplying(true);
    setReplyContent(prev => prev + content);
    
    // Scroll to reply editor
    setTimeout(() => {
      replyEditorRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  // Handle report
  const handleReport = useCallback(async (postId: string, reason: string) => {
    try {
      const response = await fetch(`/api/forums/posts/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        alert('Report submitted successfully');
      } else {
        throw new Error('Failed to submit report');
      }
    } catch (err) {
      console.error('Error reporting post:', err);
      alert('Failed to submit report. Please try again.');
    }
  }, []);

  // Handle reply submission
  const handleReplySubmit = useCallback(async (content: string) => {
    if (!content.trim() || !user) return;
    
    setSubmittingReply(true);
    
    try {
      const response = await fetch(`/api/forums/${categoryId}/threads/${threadId}/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      
      if (!response.ok) {
        throw new Error('Failed to post reply');
      }
      
      const newPost: Post = await response.json();
      setPosts(prev => [...prev, newPost]);
      setReplyContent('');
      setQuotedContent('');
      setIsReplying(false);
      
      // Update thread post count
      if (thread) {
        setThread(prev => prev ? { ...prev, postCount: prev.postCount + 1 } : null);
      }
      
    } catch (err) {
      console.error('Error posting reply:', err);
      alert('Failed to post reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  }, [user, categoryId, threadId, thread]);

  // Handle subscription toggle
  const handleSubscriptionToggle = useCallback(async () => {
    if (!user || !thread) return;
    
    try {
      const response = await fetch(`/api/forums/threads/${threadId}/subscribe`, {
        method: thread.isSubscribed ? 'DELETE' : 'POST'
      });
      
      if (response.ok) {
        setThread(prev => prev ? { ...prev, isSubscribed: !prev.isSubscribed } : null);
        setShowSubscribeModal(false);
      }
    } catch (err) {
      console.error('Error toggling subscription:', err);
    }
  }, [user, thread, threadId]);

  // Handle jump to post
  const handleJumpToPost = useCallback(() => {
    const postNumber = parseInt(jumpToPostNumber);
    if (postNumber > 0) {
      const element = document.getElementById(`post-${postNumber}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Post not loaded, calculate page and navigate
        const postsPerPage = 20;
        const targetPage = Math.ceil(postNumber / postsPerPage);
        router.push(`${ROUTES.FORUMS}/${thread?.categorySlug}/${threadId}?page=${targetPage}#post-${postNumber}`);
      }
      setShowJumpToPost(false);
      setJumpToPostNumber('');
    }
  }, [jumpToPostNumber, threadId, thread, router]);

  if (loading && !posts.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-[#2b3d4d] rounded"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-[#1a2332] rounded-lg p-6">
              <div className="flex space-x-4">
                <div className="w-16 h-16 bg-[#2b3d4d] rounded"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-[#2b3d4d] rounded w-1/4"></div>
                  <div className="h-4 bg-[#2b3d4d] rounded"></div>
                  <div className="h-4 bg-[#2b3d4d] rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error && !thread) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-white mb-4">Thread Not Found</h1>
          <p className="text-[#768894] mb-6">{error}</p>
          <button
            onClick={() => fetchThreadData()}
            className="px-6 py-3 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      
      {/* Thread Header */}
      {thread && (
        <div className="mb-6">
          
          {/* Breadcrumb */}
          <nav className="text-sm text-[#768894] mb-4">
            <div className="flex items-center space-x-2">
              <a href={ROUTES.FORUMS} className="hover:text-[#fa4454] transition-colors">Forums</a>
              <span>›</span>
              <a 
                href={`${ROUTES.FORUMS}/${thread.categorySlug}`}
                className="hover:text-[#fa4454] transition-colors"
              >
                {thread.categoryName}
              </a>
              <span>›</span>
              <span className="text-white">{thread.title}</span>
            </div>
          </nav>
          
          {/* Thread Title & Info */}
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              
              {/* Title and Status */}
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  {thread.isPinned && (
                    <span className="px-2 py-1 bg-[#f59e0b] text-white text-xs font-bold rounded">
                      PINNED
                    </span>
                  )}
                  {thread.isLocked && (
                    <span className="px-2 py-1 bg-[#ef4444] text-white text-xs font-bold rounded">
                      LOCKED
                    </span>
                  )}
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2">{thread.title}</h1>
                
                {/* Thread Tags */}
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex items-center space-x-2 mb-3">
                    {thread.tags.map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-[#2b3d4d] text-[#768894] text-xs rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Thread Meta */}
                <div className="flex items-center space-x-4 text-sm text-[#768894]">
                  <span>Started by <span className="text-[#fa4454]">{thread.author.username}</span></span>
                  <span>•</span>
                  <span>{formatTimeAgo(thread.createdAt)}</span>
                  <span>•</span>
                  <span>{formatNumber(thread.postCount)} posts</span>
                  <span>•</span>
                  <span>{formatNumber(thread.viewCount)} views</span>
                </div>
              </div>
              
              {/* Thread Actions */}
              <div className="flex items-center space-x-2">
                
                {/* Subscribe Button */}
                {user && (
                  <button
                    onClick={() => setShowSubscribeModal(true)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      thread.isSubscribed 
                        ? 'bg-[#fa4454] text-white hover:bg-[#e03e4e]' 
                        : 'bg-[#2b3d4d] text-white hover:bg-[#374555]'
                    }`}
                  >
                    {thread.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                  </button>
                )}
                
                {/* Jump to Post */}
                <button
                  onClick={() => setShowJumpToPost(true)}
                  className="px-4 py-2 bg-[#2b3d4d] text-white rounded-lg text-sm font-medium hover:bg-[#374555] transition-colors"
                >
                  Jump to Post
                </button>
                
                {/* More Actions */}
                <div className="relative group">
                  <button className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded-lg transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a2332] border border-[#2b3d4d] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                    <div className="p-2">
                      <button
                        onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#2b3d4d] rounded transition-colors"
                      >
                        Sort: {sortOrder === 'asc' ? 'Oldest First' : 'Newest First'}
                      </button>
                      
                      <button
                        onClick={() => window.print()}
                        className="w-full text-left px-3 py-2 text-sm text-white hover:bg-[#2b3d4d] rounded transition-colors"
                      >
                        Print Thread
                      </button>
                      
                      {user && (user.role === 'admin' || user.role === 'moderator') && (
                        <>
                          <div className="border-t border-[#2b3d4d] my-2"></div>
                          <button className="w-full text-left px-3 py-2 text-sm text-[#f59e0b] hover:bg-[#2b3d4d] rounded transition-colors">
                            {thread.isLocked ? 'Unlock Thread' : 'Lock Thread'}
                          </button>
                          <button className="w-full text-left px-3 py-2 text-sm text-[#ef4444] hover:bg-[#2b3d4d] rounded transition-colors">
                            Delete Thread
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Posts List */}
      <div ref={postsContainerRef} className="space-y-4 mb-8">
        {posts.map((post, index) => (
          <div
            key={post.id}
            id={`post-${post.postNumber}`}
            ref={index === posts.length - 1 ? lastPostElementRef : null}
          >
            <PostCardSimple
              post={post}
              isNested={post.parentPostId ? true : false}
              onReply={handleQuote}
            />
          </div>
        ))}
        
        {/* Loading More Posts */}
        {loading && hasMore && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#fa4454]"></div>
          </div>
        )}
      </div>
      
      {/* Reply Section */}
      {user && !thread?.isLocked && (
        <div ref={replyEditorRef} className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              {isReplying ? 'Post a Reply' : 'Quick Reply'}
            </h3>
            
            {!isReplying && (
              <button
                onClick={() => setIsReplying(true)}
                className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg text-sm font-medium transition-colors"
              >
                Write Reply
              </button>
            )}
          </div>
          
          {isReplying && (
            <div className="space-y-4">
              
              {/* Quoted Content Preview */}
              {quotedContent && (
                <div className="bg-[#0f1419] border border-[#2b3d4d] rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#768894]">Quoting:</span>
                    <button
                      onClick={() => setQuotedContent('')}
                      className="text-[#768894] hover:text-[#ef4444] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-sm text-[#768894] italic">
                    {quotedContent.substring(0, 200)}...
                  </div>
                </div>
              )}
              
              {/* Rich Text Editor */}
              <RichTextEditor
                value={replyContent}
                onChange={setReplyContent}
                onSubmit={handleReplySubmit}
                placeholder="Write your reply..."
                loading={submittingReply}
              />
              
              {/* Reply Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-[#768894]">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="text-[#fa4454]" />
                    <span>Subscribe to this thread</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="text-[#fa4454]" />
                    <span>Email notification</span>
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setIsReplying(false);
                      setReplyContent('');
                      setQuotedContent('');
                    }}
                    className="px-4 py-2 text-[#768894] hover:text-white transition-colors"
                    disabled={submittingReply}
                  >
                    Cancel
                  </button>
                  
                  <button
                    onClick={() => handleReplySubmit(replyContent)}
                    disabled={!replyContent.trim() || submittingReply}
                    className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReply ? 'Posting...' : 'Post Reply'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Login Prompt for Guests */}
      {!user && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Join the Discussion</h3>
          <p className="text-[#768894] mb-4">
            You need to be logged in to reply to this thread.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <a
              href={ROUTES.LOGIN}
              className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-lg font-medium transition-colors"
            >
              Log In
            </a>
            <a
              href={ROUTES.REGISTER}
              className="px-6 py-2 bg-[#2b3d4d] hover:bg-[#374555] text-white rounded-lg font-medium transition-colors"
            >
              Sign Up
            </a>
          </div>
        </div>
      )}
      
      {/* Jump to Post Modal */}
      {showJumpToPost && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Jump to Post</h3>
              <button
                onClick={() => setShowJumpToPost(false)}
                className="text-[#768894] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-[#768894] mb-4">
              Enter the post number you want to jump to (1-{thread?.postCount || 0}):
            </p>
            
            <input
              type="number"
              min="1"
              max={thread?.postCount || 0}
              value={jumpToPostNumber}
              onChange={(e) => setJumpToPostNumber(e.target.value)}
              placeholder="Post number"
              className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894]"
              onKeyDown={(e) => e.key === 'Enter' && handleJumpToPost()}
            />
            
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowJumpToPost(false)}
                className="px-4 py-2 text-[#768894] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJumpToPost}
                disabled={!jumpToPostNumber || parseInt(jumpToPostNumber) < 1 || parseInt(jumpToPostNumber) > (thread?.postCount || 0)}
                className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Jump
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {thread?.isSubscribed ? 'Unsubscribe from Thread' : 'Subscribe to Thread'}
              </h3>
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="text-[#768894] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-[#768894] mb-6">
              {thread?.isSubscribed 
                ? 'You will no longer receive notifications when new posts are added to this thread.'
                : 'You will receive notifications when new posts are added to this thread.'
              }
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowSubscribeModal(false)}
                className="px-4 py-2 text-[#768894] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubscriptionToggle}
                className={`px-4 py-2 rounded transition-colors ${
                  thread?.isSubscribed
                    ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white'
                    : 'bg-[#fa4454] hover:bg-[#e03e4e] text-white'
                }`}
              >
                {thread?.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThreadClient;
