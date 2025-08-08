// src/components/ForumCategoryCard.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatNumber, formatTimeAgo } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getImageUrl } from '@/utils/imageUtils';

export interface ForumCategory {
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
  
  // Activity data
  lastActivity?: {
    threadId: string;
    threadTitle: string;
    author: {
      id: string;
      username: string;
      avatar?: string;
      role: string;
    };
    timestamp: Date;
    postCount: number;
  };
  
  // Moderators
  moderators?: {
    id: string;
    username: string;
    avatar?: string;
    role: string;
  }[];
  
  // Subcategories
  subcategories?: {
    id: string;
    name: string;
    slug: string;
    threadCount: number;
  }[];
  
  // Statistics
  todaysPosts?: number;
  weeklyPosts?: number;
  onlineUsers?: number;
}

interface ForumCategoryCardProps {
  category: ForumCategory;
  variant?: 'default' | 'compact' | 'detailed';
  showModerators?: boolean;
  showSubcategories?: boolean;
  showActivity?: boolean;
  showStats?: boolean;
  className?: string;
  userRole?: string;
}

const ForumCategoryCard: React.FC<ForumCategoryCardProps> = ({
  category,
  variant = 'default',
  showModerators = true,
  showSubcategories = true,
  showActivity = true,
  showStats = false,
  className = '',
  userRole = 'user'
}) => {
  const [imageError, setImageError] = useState(false);

  // Check if user has access to this category
  const hasAccess = !category.isPrivate || 
    !category.requiredRole || 
    userRole === 'admin' || 
    userRole === 'moderator' ||
    userRole === category.requiredRole;

  // Get category icon
  const getCategoryIcon = () => {
    if (category.icon && !imageError) {
      return (
        <div className="w-8 h-8 relative flex-shrink-0">
          <Image
            src={category.icon}
            alt={category.name}
            fill
            className="object-contain"
            sizes="32px"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageUrl(null, 'news-featured');
              setImageError(true);
            }}
          />
        </div>
      );
    }
    
    // Fallback to emoji or first letter
    const fallback = category.name.match(/[🎮🏆💬🐛💡🎯🎭⚔️🔧📢]/)?.[0] || 
                    category.name.charAt(0).toUpperCase();
    
    return (
      <div 
        className="w-8 h-8 rounded flex items-center justify-center text-white font-bold flex-shrink-0"
        style={{ backgroundColor: category.color }}
      >
        {fallback}
      </div>
    );
  };

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { bg: '#ef4444', text: 'Admin' },
      moderator: { bg: '#4ade80', text: 'Mod' },
      vip: { bg: '#f59e0b', text: 'VIP' },
      user: { bg: 'transparent', text: '' }
    };
    
    return badges[role as keyof typeof badges] || badges.user;
  };

  // Compact variant
  if (variant === 'compact') {
    return (
      <Link 
        href={hasAccess ? `${ROUTES.FORUMS}/${category.slug}` : '#'}
        className={`block group ${!hasAccess ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
      >
        <div className="flex items-center space-x-3 p-3 hover:bg-[#20303d] transition-colors rounded-lg">
          {getCategoryIcon()}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-medium text-white group-hover:text-[#fa4454] transition-colors truncate">
                {category.name}
              </h3>
              
              {category.isLocked && (
                <svg className="w-3 h-3 text-[#f59e0b]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                </svg>
              )}
              
              {category.isPrivate && (
                <svg className="w-3 h-3 text-[#8b5cf6]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            
            <div className="text-xs text-[#768894]">
              {formatNumber(category.threadCount)} threads
            </div>
          </div>
          
          <div className="text-xs text-[#768894]">
            {formatNumber(category.postCount)}
          </div>
        </div>
      </Link>
    );
  }

  // Default/Detailed variant
  return (
    <Link 
      href={hasAccess ? `${ROUTES.FORUMS}/${category.slug}` : '#'}
      className={`block group ${!hasAccess ? 'cursor-not-allowed opacity-60' : ''} ${className}`}
    >
      <article className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#fa4454] hover:shadow-lg">
        
        {/* Header */}
        <div className="p-4 border-b border-[#2b3d4d]">
          <div className="flex items-start space-x-3">
            {getCategoryIcon()}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h2 className="text-lg font-bold text-white group-hover:text-[#fa4454] transition-colors">
                  {category.name}
                </h2>
                
                {/* Status Badges */}
                <div className="flex items-center space-x-1">
                  {category.isLocked && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-[#f59e0b]/20 text-[#f59e0b] rounded text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                      </svg>
                      <span>Locked</span>
                    </div>
                  )}
                  
                  {category.isPrivate && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-[#8b5cf6]/20 text-[#8b5cf6] rounded text-xs">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                      </svg>
                      <span>Private</span>
                    </div>
                  )}
                  
                  {category.todaysPosts && category.todaysPosts > 10 && (
                    <div className="px-2 py-1 bg-[#4ade80]/20 text-[#4ade80] rounded text-xs font-medium">
                      Hot
                    </div>
                  )}
                </div>
              </div>
              
              <p className="text-sm text-[#768894] mb-3 line-clamp-2">
                {category.description}
              </p>
              
              {/* Statistics */}
              <div className="flex items-center space-x-4 text-sm text-[#768894]">
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
                
                {category.onlineUsers && category.onlineUsers > 0 && (
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-[#4ade80] rounded-full"></div>
                    <span>{category.onlineUsers} online</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Subcategories */}
          {showSubcategories && category.subcategories && category.subcategories.length > 0 && (
            <div>
              <div className="text-xs text-[#768894] mb-2">Subcategories</div>
              <div className="flex flex-wrap gap-2">
                {category.subcategories.slice(0, 4).map((sub) => (
                  <Link
                    key={sub.id}
                    href={`${ROUTES.FORUMS}/${category.slug}/${sub.slug}`}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1 bg-[#2b3d4d] hover:bg-[#374555] text-xs text-white rounded transition-colors"
                  >
                    {sub.name} ({sub.threadCount})
                  </Link>
                ))}
                {category.subcategories.length > 4 && (
                  <span className="px-2 py-1 bg-[#2b3d4d] text-xs text-[#768894] rounded">
                    +{category.subcategories.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Last Activity */}
          {showActivity && category.lastActivity && (
            <div>
              <div className="text-xs text-[#768894] mb-2">Latest Activity</div>
              <div className="flex items-start space-x-3">
                
                {/* Author Avatar */}
                <div className="flex-shrink-0">
                  {category.lastActivity.author.avatar ? (
                    <div className="w-8 h-8 relative rounded overflow-hidden">
                      <Image
                        src={category.lastActivity.author.avatar}
                        alt={category.lastActivity.author.username}
                        fill
                        className="object-cover"
                        sizes="32px"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl(null, 'player-avatar');
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-[#fa4454] rounded flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {category.lastActivity.author.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`${ROUTES.FORUMS}/${category.slug}/${category.lastActivity.threadId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-white hover:text-[#fa4454] transition-colors line-clamp-1"
                  >
                    {category.lastActivity.threadTitle}
                  </Link>
                  
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-[#768894]">
                      by {category.lastActivity.author.username}
                    </span>
                    
                    {getRoleBadge(category.lastActivity.author.role).text && (
                      <span 
                        className="px-1 py-0.5 rounded text-xs font-bold text-white"
                        style={{ backgroundColor: getRoleBadge(category.lastActivity.author.role).bg }}
                      >
                        {getRoleBadge(category.lastActivity.author.role).text}
                      </span>
                    )}
                    
                    <span className="text-xs text-[#768894]">
                      {formatTimeAgo(category.lastActivity.timestamp)}
                    </span>
                  </div>
                </div>
                
                {/* Post Count */}
                <div className="text-xs text-[#768894] flex-shrink-0">
                  {category.lastActivity.postCount} replies
                </div>
              </div>
            </div>
          )}
          
          {/* Moderators */}
          {showModerators && category.moderators && category.moderators.length > 0 && (
            <div>
              <div className="text-xs text-[#768894] mb-2">Moderators</div>
              <div className="flex items-center space-x-2">
                {category.moderators.slice(0, 3).map((mod) => (
                  <div key={mod.id} className="flex items-center space-x-1">
                    {mod.avatar ? (
                      <div className="w-6 h-6 relative rounded overflow-hidden">
                        <Image
                          src={mod.avatar}
                          alt={mod.username}
                          fill
                          className="object-cover"
                          sizes="24px"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl(null, 'player-avatar');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-[#4ade80] rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {mod.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-[#4ade80]">{mod.username}</span>
                  </div>
                ))}
                {category.moderators.length > 3 && (
                  <span className="text-xs text-[#768894]">
                    +{category.moderators.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
          
          {/* Additional Stats */}
          {showStats && variant === 'detailed' && (
            <div className="border-t border-[#2b3d4d] pt-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div>
                  <div className="text-sm font-bold text-[#fa4454]">
                    {formatNumber(category.todaysPosts || 0)}
                  </div>
                  <div className="text-xs text-[#768894]">Today</div>
                </div>
                
                <div>
                  <div className="text-sm font-bold text-[#f59e0b]">
                    {formatNumber(category.weeklyPosts || 0)}
                  </div>
                  <div className="text-xs text-[#768894]">This Week</div>
                </div>
                
                <div>
                  <div className="text-sm font-bold text-[#4ade80]">
                    {formatNumber(category.threadCount)}
                  </div>
                  <div className="text-xs text-[#768894]">Total Threads</div>
                </div>
                
                <div>
                  <div className="text-sm font-bold text-[#3b82f6]">
                    {formatNumber(category.postCount)}
                  </div>
                  <div className="text-xs text-[#768894]">Total Posts</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};

export default ForumCategoryCard;
