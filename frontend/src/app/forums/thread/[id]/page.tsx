// src/app/forums/thread/[id]/page.tsx - Complete VLR.gg Quality Thread Detail
'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PostCard from '@/components/PostCard';
import RichTextEditor from '@/components/RichTextEditor';
import { useAuth } from '@/context/AuthContext';
import ForumSidebar from '@/components/ForumSidebar';

interface Author {
  id: string;
  name: string;
  avatar: string;
  posts: number;
  joinDate: string;
  role?: string;
}

interface Post {
  id: string;
  content: string;
  author: Author;
  createdAt: string;
  edited?: boolean;
  lastEditedAt?: string;
  reactions?: {
    type: string;
    count: number;
    userReacted: boolean;
  }[];
}

interface ThreadDetails {
  id: string;
  title: string;
  category: {
    id: string;
    name: string;
  };
  createdAt: string;
  author: Author;
  views: number;
  isPinned: boolean;
  isLocked: boolean;
  tags: string[];
}

export default function ThreadViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  
  const [threadDetails, setThreadDetails] = useState<ThreadDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Mock data for development
  const mockThreadDetails: ThreadDetails = {
    id: id as string,
    title: 'Iron Man vs Captain America - Meta Analysis and Discussion',
    category: {
      id: 'strategy',
      name: 'Strategy & Tips'
    },
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'user1',
      name: 'MetaAnalyst',
      avatar: '/avatars/default.png',
      posts: 342,
      joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      role: 'Veteran'
    },
    views: 1867,
    isPinned: false,
    isLocked: false,
    tags: ['iron-man', 'captain-america', 'meta', 'analysis']
  };
  
  const mockPosts: Post[] = [
    {
      id: '1',
      content: "After playing both heroes extensively in ranked matches, I want to discuss their current position in the meta.\n\n**Iron Man Strengths:**\n- Excellent mobility with repulsor flight\n- High burst damage potential\n- Great for flanking and picking off supports\n\n**Captain America Strengths:**\n- Superior team utility with shield\n- Better survivability in team fights\n- Shield throw can disrupt enemy formations\n\nWhat's your experience with these heroes? Which one do you think fits better in the current meta?",
      author: {
        id: 'user1',
        name: 'MetaAnalyst',
        avatar: '/avatars/default.png',
        posts: 342,
        joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        role: 'Veteran'
      },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      content: "Great analysis! I've been maining Iron Man this season and his mobility is definitely his biggest asset. The ability to reposition quickly and escape bad situations is huge.\n\nHowever, I think Cap is more valuable in coordinated team play. His shield can save teammates and his ultimate can turn entire team fights around.",
      author: {
        id: 'user2',
        name: 'IronManMain',
        avatar: '/avatars/default.png',
        posts: 156,
        joinDate: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      reactions: [
        { type: 'like', count: 8, userReacted: false },
        { type: 'thumbs-up', count: 3, userReacted: false }
      ]
    },
    {
      id: '3',
      content: "I have to disagree about Iron Man being better for flanking. Cap's shield throw can actually be more effective for picking off isolated targets, especially supports.\n\nThe key difference is that Iron Man is more selfish - he's great for individual plays but doesn't contribute as much to team success. Cap is the opposite.",
      author: {
        id: 'user3',
        name: 'CapMainUSA',
        avatar: '/avatars/default.png',
        posts: 89,
        joinDate: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      edited: true,
      lastEditedAt: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
      reactions: [
        { type: 'like', count: 12, userReacted: true },
        { type: 'thinking', count: 2, userReacted: false }
      ]
    },
    {
      id: '4',
      content: "Looking at the tournament statistics from last month:\n\n**Iron Man:** 67% pick rate, 52% win rate\n**Captain America:** 45% pick rate, 58% win rate\n\nThis suggests that while Iron Man is more popular, Cap might actually be more effective when played properly. The lower pick rate could also mean he's undervalued.",
      author: {
        id: 'user4',
        name: 'TournamentWatcher',
        avatar: '/avatars/default.png',
        posts: 234,
        joinDate: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
        role: 'Data Analyst'
      },
      createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
      reactions: [
        { type: 'like', count: 15, userReacted: false },
        { type: 'informative', count: 8, userReacted: false },
        { type: 'star', count: 3, userReacted: false }
      ]
    }
  ];
  
  useEffect(() => {
    const fetchThreadData = async () => {
      try {
        setLoading(true);
        
        // Try to fetch real data
        const res = await fetch(`/api/public/forums/threads/${id}?page=${currentPage}`);
        if (res.ok) {
          const data = await res.json();
          setThreadDetails(data.thread);
          setPosts(data.posts);
          setTotalPages(data.totalPages || 1);
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        console.warn('API failed, using mock data:', error);
        setThreadDetails(mockThreadDetails);
        setPosts(mockPosts);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchThreadData();
    }
  }, [id, currentPage]);
  
  const handleReplySubmit = async (content: string) => {
    if (!content.trim() || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Try to post to API
      const res = await fetch(`/api/user/forums/threads/${id}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts(prevPosts => [...prevPosts, newPost]);
      } else {
        // Fallback to mock behavior
        const newPost: Post = {
          id: `post-${Date.now()}`,
          content,
          author: {
            id: user.id,
            name: user.username,
            avatar: user.avatar || '/avatars/default.png',
            posts: user.posts || 1,
            joinDate: user.joinDate || new Date().toISOString()
          },
          createdAt: new Date().toISOString(),
          reactions: []
        };
        
        setPosts(prevPosts => [...prevPosts, newPost]);
      }
      
      setReplyContent('');
      
      // Scroll to the bottom
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Error posting reply:', error);
      setError('Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReaction = (postId: string, reactionType: string) => {
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
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
          <div className="container mx-auto py-4">
            <div className="h-4 w-32 bg-[#2b3d4d] animate-pulse rounded mb-2"></div>
            <div className="h-8 w-64 bg-[#2b3d4d] animate-pulse rounded"></div>
          </div>
        </div>
        
        <div className="container mx-auto py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="lg:w-3/4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-[#1a242d] border border-[#2b3d4d] rounded p-6">
                  <div className="h-4 bg-[#2b3d4d] rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-[#2b3d4d] rounded mb-2 animate-pulse"></div>
                  <div className="h-4 bg-[#2b3d4d] rounded w-2/3 animate-pulse"></div>
                </div>
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
  
  if (error && !threadDetails) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="container mx-auto py-6">
          <div className="bg-[#1a242d] border border-[#fa4454] rounded p-8 text-center">
            <div className="text-[#fa4454] text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Thread Not Found</h2>
            <p className="text-[#768894] mb-4">{error || 'This thread may have been deleted or moved.'}</p>
            <Link 
              href="/forums"
              className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded font-medium transition-colors"
            >
              Back to Forums
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  if (!threadDetails) return null;
  
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Thread Header */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-[#768894] mb-3">
            <Link href="/" className="hover:text-[#fa4454] transition-colors">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/forums" className="hover:text-[#fa4454] transition-colors">Forums</Link>
            <span className="mx-2">/</span>
            <Link 
              href={`/forums/${threadDetails.category.id}`}
              className="hover:text-[#fa4454] transition-colors"
            >
              {threadDetails.category.name}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-white">Thread</span>
          </div>
          
          {/* Thread Title and Meta */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center mb-2">
                {threadDetails.isPinned && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded mr-2">
                    📌 Pinned
                  </span>
                )}
                {threadDetails.isLocked && (
                  <span className="inline-flex items-center px-2 py-1 bg-red-900/30 text-red-400 text-xs rounded mr-2">
                    🔒 Locked
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">{threadDetails.title}</h1>
              <div className="flex flex-wrap items-center text-sm text-[#768894] space-x-4">
                <span>by <span className="text-white font-medium">{threadDetails.author.name}</span></span>
                <span>{new Date(threadDetails.createdAt).toLocaleDateString()}</span>
                <span>{threadDetails.views.toLocaleString()} views</span>
                <span>{posts.length} replies</span>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0">
              <Link 
                href={`/forums/${threadDetails.category.id}`}
                className="inline-flex items-center text-[#fa4454] hover:underline text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {threadDetails.category.name}
              </Link>
            </div>
          </div>
          
          {/* Tags */}
          {threadDetails.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {threadDetails.tags.map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-1 bg-[#2b3d4d] text-[#768894] text-xs rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-3/4">
            {/* Posts */}
            <div className="space-y-4 mb-8">
              {posts.map((post) => (
                <PostCard 
                  key={post.id}
                  post={post}
                  onReaction={handleReaction}
                />
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mb-8 flex justify-center">
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
            
            {/* Reply Section */}
            {user && !threadDetails.isLocked ? (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-6">
                <h3 className="text-lg font-bold mb-4">Post a Reply</h3>
                <RichTextEditor
                  value={replyContent}
                  onChange={setReplyContent}
                  onSubmit={handleReplySubmit}
                  placeholder="Write your reply..."
                  isSubmitting={isSubmitting}
                />
              </div>
            ) : threadDetails.isLocked ? (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-6 text-center">
                <div className="text-[#768894] text-4xl mb-4">🔒</div>
                <h3 className="text-lg font-medium mb-2">Thread Locked</h3>
                <p className="text-[#768894]">
                  This thread has been locked by a moderator and cannot be replied to.
                </p>
              </div>
            ) : (
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-6 text-center">
                <div className="text-[#768894] text-4xl mb-4">👤</div>
                <h3 className="text-lg font-medium mb-2">Login Required</h3>
                <p className="text-[#768894] mb-4">
                  You need to be logged in to reply to this thread.
                </p>
                <Link 
                  href="/user/login"
                  className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded font-medium transition-colors"
                >
                  Login to Reply
                </Link>
              </div>
            )}
            
            {/* Bottom reference for auto-scroll */}
            <div ref={bottomRef} />
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
