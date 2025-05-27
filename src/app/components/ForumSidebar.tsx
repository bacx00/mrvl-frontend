// src/components/ForumSidebar.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon: string;
  color: string;
  threadCount: number;
  postCount: number;
  lastActivity?: {
    threadTitle: string;
    author: string;
    timestamp: Date;
  };
}

interface RecentTopic {
  id: string;
  title: string;
  category: string;
  categorySlug: string;
  replies: number;
  views: number;
  lastActivity: Date;
  author: {
    username: string;
    avatar?: string;
    role: string;
  };
  isPinned?: boolean;
  isHot?: boolean;
  tags?: string[];
}

interface OnlineUser {
  id: string;
  username: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy';
  role: string;
  lastSeen: Date;
}

interface ForumStats {
  totalThreads: number;
  totalPosts: number;
  totalMembers: number;
  onlineCount: number;
  newMembersToday: number;
  activeThreadsToday: number;
}

interface ForumSidebarProps {
  compact?: boolean;
  showCategories?: boolean;
  showRecentActivity?: boolean;
  showOnlineUsers?: boolean;
  showStats?: boolean;
  className?: string;
}

const ForumSidebar: React.FC<ForumSidebarProps> = ({
  compact = false,
  showCategories = true,
  showRecentActivity = true,
  showOnlineUsers = true,
  showStats = true,
  className = ''
}) => {
  const { user } = useAuth();
  const pathname = usePathname();
  
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [recentTopics, setRecentTopics] = useState<RecentTopic[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [forumStats, setForumStats] = useState<ForumStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  // Mock data - replace with actual API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Categories
        const mockCategories: ForumCategory[] = [
          {
            id: '1',
            name: 'General Discussion',
            slug: 'general-discussion',
            description: 'General Marvel Rivals discussion',
            icon: '💬',
            color: '#fa4454',
            threadCount: 1284,
            postCount: 15420,
            lastActivity: {
              threadTitle: 'Best Hero Combinations in Season 1',
              author: 'SpiderFan2024',
              timestamp: new Date(Date.now() - 1000 * 60 * 15)
            }
          },
          {
            id: '2',
            name: 'Strategy & Tips',
            slug: 'strategy-tips',
            description: 'Game strategy, builds, and tips',
            icon: '🎯',
            color: '#4ade80',
            threadCount: 892,
            postCount: 8934,
            lastActivity: {
              threadTitle: 'Luna Snow Support Build Guide',
              author: 'FrostMaster',
              timestamp: new Date(Date.now() - 1000 * 60 * 32)
            }
          },
          {
            id: '3',
            name: 'Competitive & Esports',
            slug: 'competitive-esports',
            description: 'Competitive play and esports discussion',
            icon: '🏆',
            color: '#f59e0b',
            threadCount: 567,
            postCount: 4823,
            lastActivity: {
              threadTitle: 'MSI 2025 Predictions Thread',
              author: 'EsportsAnalyst',
              timestamp: new Date(Date.now() - 1000 * 60 * 45)
            }
          },
          {
            id: '4',
            name: 'Bug Reports',
            slug: 'bug-reports',
            description: 'Report bugs and technical issues',
            icon: '🐛',
            color: '#ef4444',
            threadCount: 234,
            postCount: 1567,
            lastActivity: {
              threadTitle: 'Spider-Man Web Ability Bug',
              author: 'WebCrawler',
              timestamp: new Date(Date.now() - 1000 * 60 * 67)
            }
          },
          {
            id: '5',
            name: 'Suggestions & Feedback',
            slug: 'suggestions-feedback',
            description: 'Game suggestions and feedback',
            icon: '💡',
            color: '#3b82f6',
            threadCount: 456,
            postCount: 2890,
            lastActivity: {
              threadTitle: 'New Hero Ideas: Doctor Doom',
              author: 'MarvelFanatic',
              timestamp: new Date(Date.now() - 1000 * 60 * 89)
            }
          },
          {
            id: '6',
            name: 'Off Topic',
            slug: 'off-topic',
            description: 'Non-game related discussions',
            icon: '🎭',
            color: '#8b5cf6',
            threadCount: 789,
            postCount: 5634,
            lastActivity: {
              threadTitle: 'Marvel Movies Discussion',
              author: 'MCUExpert',
              timestamp: new Date(Date.now() - 1000 * 60 * 123)
            }
          }
        ];

        // Recent Topics
        const mockRecentTopics: RecentTopic[] = [
          {
            id: '1',
            title: 'Season 1 Meta Analysis - Tank Heroes Dominating',
            category: 'Strategy & Tips',
            categorySlug: 'strategy-tips',
            replies: 47,
            views: 1234,
            lastActivity: new Date(Date.now() - 1000 * 60 * 5),
            author: {
              username: 'MetaAnalyst',
              avatar: '/avatars/meta-analyst.png',
              role: 'moderator'
            },
            isPinned: true,
            isHot: true,
            tags: ['meta', 'tanks', 'season1']
          },
          {
            id: '2',
            title: 'Best Crosshair Settings for Projectile Heroes',
            category: 'Strategy & Tips',
            categorySlug: 'strategy-tips',
            replies: 23,
            views: 567,
            lastActivity: new Date(Date.now() - 1000 * 60 * 12),
            author: {
              username: 'AimTrainer',
              role: 'user'
            },
            tags: ['settings', 'aim']
          },
          {
            id: '3',
            title: 'Tournament Bracket Predictions - Who Will Win?',
            category: 'Competitive & Esports',
            categorySlug: 'competitive-esports',
            replies: 89,
            views: 2345,
            lastActivity: new Date(Date.now() - 1000 * 60 * 18),
            author: {
              username: 'EsportsFan',
              role: 'user'
            },
            isHot: true,
            tags: ['tournament', 'predictions']
          },
          {
            id: '4',
            title: 'Iron Man Infinite Flight Bug Still Not Fixed',
            category: 'Bug Reports',
            categorySlug: 'bug-reports',
            replies: 34,
            views: 890,
            lastActivity: new Date(Date.now() - 1000 * 60 * 25),
            author: {
              username: 'BugHunter',
              role: 'user'
            },
            tags: ['bug', 'iron-man']
          }
        ];

        // Online Users
        const mockOnlineUsers: OnlineUser[] = [
          {
            id: '1',
            username: 'SpiderGamer',
            avatar: '/avatars/spider-gamer.png',
            status: 'online',
            role: 'admin',
            lastSeen: new Date()
          },
          {
            id: '2',
            username: 'IronManFan',
            status: 'online',
            role: 'moderator',
            lastSeen: new Date()
          },
          {
            id: '3',
            username: 'CaptainAmerica',
            status: 'online',
            role: 'vip',
            lastSeen: new Date()
          },
          {
            id: '4',
            username: 'ThorLover',
            status: 'away',
            role: 'user',
            lastSeen: new Date(Date.now() - 1000 * 60 * 5)
          },
          {
            id: '5',
            username: 'HulkSmash',
            status: 'online',
            role: 'user',
            lastSeen: new Date()
          }
        ];

        // Forum Stats
        const mockStats: ForumStats = {
          totalThreads: 4239,
          totalPosts: 38394,
          totalMembers: 12847,
          onlineCount: 247,
          newMembersToday: 23,
          activeThreadsToday: 156
        };

        setCategories(mockCategories);
        setRecentTopics(mockRecentTopics);
        setOnlineUsers(mockOnlineUsers);
        setForumStats(mockStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching forum data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { bg: '#ef4444', text: 'Admin' },
      moderator: { bg: '#4ade80', text: 'Mod' },
      vip: { bg: '#f59e0b', text: 'VIP' },
      user: { bg: '#768894', text: '' }
    };
    
    return badges[role as keyof typeof badges] || badges.user;
  };

  // Get status indicator
  const getStatusIndicator = (status: string) => {
    const colors = {
      online: '#4ade80',
      away: '#f59e0b',
      busy: '#ef4444'
    };
    
    return colors[status as keyof typeof colors] || colors.online;
  };

  // Toggle section expansion for mobile
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (loading) {
    return (
      <div className={`w-full lg:w-80 space-y-6 ${className}`}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1a2332] rounded-lg p-4 animate-pulse">
            <div className="h-5 bg-[#2b3d4d] rounded mb-3"></div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-4 bg-[#2b3d4d] rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`w-full lg:w-80 space-y-6 ${className}`}>
      
      {/* User Panel */}
      {user && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4">
          <div className="flex items-center space-x-3 mb-3">
            {user.avatar ? (
              <div className="w-10 h-10 relative rounded-full overflow-hidden">
                <Image
                  src={user.avatar}
                  alt={user.username}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-[#fa4454] rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">
                Welcome back!
              </h3>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-[#768894]">{user.username}</span>
                {getRoleBadge(user.role).text && (
                  <span 
                    className="px-1.5 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: getRoleBadge(user.role).bg }}
                  >
                    {getRoleBadge(user.role).text}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Link 
              href={ROUTES.PROFILE}
              className="text-xs bg-[#fa4454] hover:bg-[#e03e4e] text-white px-3 py-2 rounded transition-colors text-center"
            >
              Profile
            </Link>
            <Link 
              href={ROUTES.SETTINGS}
              className="text-xs bg-[#2b3d4d] hover:bg-[#374555] text-white px-3 py-2 rounded transition-colors text-center"
            >
              Settings
            </Link>
          </div>
        </div>
      )}

      {/* Categories */}
      {showCategories && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden">
          
          {/* Mobile Header */}
          <div className="lg:hidden">
            <button
              onClick={() => toggleSection('categories')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#20303d] transition-colors"
            >
              <h3 className="text-lg font-semibold text-white">Categories</h3>
              <svg 
                className={`w-5 h-5 text-[#768894] transform transition-transform ${
                  expandedSection === 'categories' ? 'rotate-180' : ''
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:block p-4 border-b border-[#2b3d4d]">
            <h3 className="text-lg font-semibold text-white">Categories</h3>
          </div>
          
          {/* Categories List */}
          <div className={`${compact ? 'lg:block' : expandedSection === 'categories' || expandedSection === null ? 'block' : 'hidden'} lg:block`}>
            <div className="p-2 space-y-1">
              {categories.map((category) => {
                const isActive = pathname.includes(category.slug);
                
                return (
                  <Link
                    key={category.id}
                    href={`${ROUTES.FORUMS}/${category.slug}`}
                    className={`
                      group flex items-center justify-between p-3 rounded-lg transition-all duration-200
                      ${isActive 
                        ? 'bg-[#fa4454] text-white' 
                        : 'hover:bg-[#20303d] text-[#768894] hover:text-white'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">{category.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'group-hover:text-white'}`}>
                          {category.name}
                        </div>
                        {!compact && category.lastActivity && (
                          <div className="text-xs text-opacity-75 truncate mt-0.5">
                            {category.lastActivity.threadTitle}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end text-xs flex-shrink-0 ml-2">
                      <span className={`font-medium ${isActive ? 'text-white' : 'text-[#768894]'}`}>
                        {formatNumber(category.threadCount)}
                      </span>
                      {!compact && (
                        <span className={`text-opacity-60 ${isActive ? 'text-white' : 'text-[#768894]'}`}>
                          threads
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {showRecentActivity && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden">
          
          {/* Mobile Header */}
          <div className="lg:hidden">
            <button
              onClick={() => toggleSection('recent')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#20303d] transition-colors"
            >
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <svg 
                className={`w-5 h-5 text-[#768894] transform transition-transform ${
                  expandedSection === 'recent' ? 'rotate-180' : ''
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:block p-4 border-b border-[#2b3d4d]">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          
          {/* Recent Topics List */}
          <div className={`${expandedSection === 'recent' || expandedSection === null ? 'block' : 'hidden'} lg:block`}>
            <div className="divide-y divide-[#2b3d4d]">
              {recentTopics.map((topic) => (
                <Link
                  key={topic.id}
                  href={`${ROUTES.FORUMS}/${topic.categorySlug}/${topic.id}`}
                  className="block p-4 hover:bg-[#20303d] transition-colors group"
                >
                  <div className="flex items-start space-x-3">
                    
                    {/* Author Avatar */}
                    <div className="flex-shrink-0">
                      {topic.author.avatar ? (
                        <div className="w-8 h-8 relative rounded overflow-hidden">
                          <Image
                            src={topic.author.avatar}
                            alt={topic.author.username}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-[#fa4454] rounded flex items-center justify-center">
                          <span className="text-white font-bold text-xs">
                            {topic.author.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      
                      {/* Title and Badges */}
                      <div className="flex items-start space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-white group-hover:text-[#fa4454] line-clamp-2 flex-1 transition-colors">
                          {topic.title}
                        </h4>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {topic.isPinned && (
                            <svg className="w-3 h-3 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                              <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                            </svg>
                          )}
                          {topic.isHot && (
                            <svg className="w-3 h-3 text-[#ef4444]" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0112.12 15.12z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                      </div>
                      
                      {/* Metadata */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2 text-[#768894]">
                          <span className="text-[#fa4454]">{topic.category}</span>
                          <span>•</span>
                          <span>{topic.author.username}</span>
                          {getRoleBadge(topic.author.role).text && (
                            <span 
                              className="px-1 py-0.5 rounded text-xs font-bold text-white"
                              style={{ backgroundColor: getRoleBadge(topic.author.role).bg }}
                            >
                              {getRoleBadge(topic.author.role).text}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-3 text-[#768894]">
                          <span>{formatNumber(topic.replies)} replies</span>
                          <span>{formatTimeAgo(topic.lastActivity)}</span>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {topic.tags && topic.tags.length > 0 && (
                        <div className="flex items-center space-x-1 mt-2">
                          {topic.tags.slice(0, 3).map((tag) => (
                            <span 
                              key={tag}
                              className="px-1.5 py-0.5 bg-[#2b3d4d] text-[#768894] text-xs rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            
            <div className="p-4 border-t border-[#2b3d4d]">
              <Link 
                href={ROUTES.FORUMS}
                className="block text-center text-sm text-[#fa4454] hover:text-[#e03e4e] transition-colors"
              >
                View All Topics →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Online Users */}
      {showOnlineUsers && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden">
          
          {/* Mobile Header */}
          <div className="lg:hidden">
            <button
              onClick={() => toggleSection('online')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#20303d] transition-colors"
            >
              <h3 className="text-lg font-semibold text-white">
                Online Users ({onlineUsers.filter(u => u.status === 'online').length})
              </h3>
              <svg 
                className={`w-5 h-5 text-[#768894] transform transition-transform ${
                  expandedSection === 'online' ? 'rotate-180' : ''
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:block p-4 border-b border-[#2b3d4d]">
            <h3 className="text-lg font-semibold text-white">
              Online Users ({onlineUsers.filter(u => u.status === 'online').length})
            </h3>
          </div>
          
          {/* Online Users List */}
          <div className={`${expandedSection === 'online' || expandedSection === null ? 'block' : 'hidden'} lg:block`}>
            <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
              {onlineUsers.map((onlineUser) => (
                <Link
                  key={onlineUser.id}
                  href={`${ROUTES.PROFILE}/${onlineUser.username}`}
                  className="flex items-center space-x-3 hover:bg-[#20303d] p-2 rounded transition-colors group"
                >
                  
                  {/* User Avatar */}
                  <div className="relative flex-shrink-0">
                    {onlineUser.avatar ? (
                      <div className="w-8 h-8 relative rounded overflow-hidden">
                        <Image
                          src={onlineUser.avatar}
                          alt={onlineUser.username}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-[#fa4454] rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {onlineUser.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* Status Indicator */}
                    <div 
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-[#1a2332] rounded-full"
                      style={{ backgroundColor: getStatusIndicator(onlineUser.status) }}
                    />
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-white group-hover:text-[#fa4454] transition-colors truncate">
                        {onlineUser.username}
                      </span>
                      {getRoleBadge(onlineUser.role).text && (
                        <span 
                          className="px-1 py-0.5 rounded text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: getRoleBadge(onlineUser.role).bg }}
                        >
                          {getRoleBadge(onlineUser.role).text}
                        </span>
                      )}
                    </div>
                    {onlineUser.status !== 'online' && (
                      <div className="text-xs text-[#768894]">
                        {formatTimeAgo(onlineUser.lastSeen)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Forum Stats */}
      {showStats && forumStats && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden">
          
          {/* Mobile Header */}
          <div className="lg:hidden">
            <button
              onClick={() => toggleSection('stats')}
              className="w-full flex items-center justify-between p-4 hover:bg-[#20303d] transition-colors"
            >
              <h3 className="text-lg font-semibold text-white">Forum Stats</h3>
              <svg 
                className={`w-5 h-5 text-[#768894] transform transition-transform ${
                  expandedSection === 'stats' ? 'rotate-180' : ''
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden lg:block p-4 border-b border-[#2b3d4d]">
            <h3 className="text-lg font-semibold text-white">Forum Stats</h3>
          </div>
          
          {/* Stats Content */}
          <div className={`${expandedSection === 'stats' || expandedSection === null ? 'block' : 'hidden'} lg:block`}>
            <div className="p-4 space-y-3">
              
              {/* Main Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-[#fa4454]">
                    {formatNumber(forumStats.totalThreads)}
                  </div>
                  <div className="text-xs text-[#768894]">Total Topics</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-[#fa4454]">
                    {formatNumber(forumStats.totalPosts)}
                  </div>
                  <div className="text-xs text-[#768894]">Total Posts</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-[#4ade80]">
                    {formatNumber(forumStats.totalMembers)}
                  </div>
                  <div className="text-xs text-[#768894]">Total Members</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-[#4ade80]">
                    {formatNumber(forumStats.onlineCount)}
                  </div>
                  <div className="text-xs text-[#768894]">Online Now</div>
                </div>
              </div>
              
              {/* Divider */}
              <div className="border-t border-[#2b3d4d] my-3"></div>
              
              {/* Daily Stats */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#768894]">New members today:</span>
                  <span className="text-sm font-medium text-[#4ade80]">
                    +{formatNumber(forumStats.newMembersToday)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#768894]">Active topics today:</span>
                  <span className="text-sm font-medium text-[#f59e0b]">
                    {formatNumber(forumStats.activeThreadsToday)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumSidebar;
