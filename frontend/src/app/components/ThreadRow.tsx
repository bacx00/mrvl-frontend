// src/components/ThreadRow.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getImageUrl } from '@/utils/imageUtils';

export interface ThreadAuthor {
  id: string;
  username: string;
  avatar?: string;
  role: string;
  isOnline?: boolean;
}

export interface ThreadLastActivity {
  author: ThreadAuthor;
  timestamp: Date;
  postNumber: number;
}

export interface ThreadData {
  id: string;
  title: string;
  slug?: string;
  author: ThreadAuthor;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  
  // Statistics
  replyCount: number;
  viewCount: number;
  lastActivity: ThreadLastActivity;
  
  // Status
  isPinned?: boolean;
  isLocked?: boolean;
  isHot?: boolean;
  isClosed?: boolean;
  isAnswered?: boolean;
  
  // Metadata
  createdAt: Date;
  tags?: string[];
  prefix?: string;
  
  // User interaction
  hasUnreadPosts?: boolean;
  isSubscribed?: boolean;
  userLastRead?: Date;
  
  // Content preview
  preview?: string;
  thumbnailUrl?: string;
}

interface ThreadRowProps {
  thread: ThreadData;
  variant?: 'default' | 'compact' | 'detailed';
  showCategory?: boolean;
  showPreview?: boolean;
  showTags?: boolean;
  showThumbnail?: boolean;
  className?: string;
}

const ThreadRow: React.FC<ThreadRowProps> = ({
  thread,
  variant = 'default',
  showCategory = true,
  showPreview = false,
  showTags = true,
  showThumbnail = false,
  className = ''
}) => {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  // Get status indicators
  const getStatusIcons = () => {
    const icons = [];
    
    if (thread.isPinned) {
      icons.push(
        <div key="pinned" className="flex items-center space-x-1 px-2 py-1 bg-[#f59e0b] text-white rounded text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
            <path fillRule="evenodd" d="M3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
          </svg>
          <span>PINNED</span>
        </div>
      );
    }
    
    if (thread.isLocked) {
      icons.push(
        <svg key="locked" className="w-4 h-4 text-[#ef4444]" fill="currentColor" viewBox="0 0 20 20" title="Locked">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
        </svg>
      );
    }
    
    if (thread.isHot) {
      icons.push(
        <div key="hot" className="flex items-center space-x-1 px-2 py-1 bg-[#ef4444] text-white rounded text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0112.12 15.12z" clipRule="evenodd"/>
          </svg>
          <span>HOT</span>
        </div>
      );
    }
    
    if (thread.isAnswered) {
      icons.push(
        <div key="answered" className="flex items-center space-x-1 px-2 py-1 bg-[#4ade80] text-white rounded text-xs font-medium">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          <span>SOLVED</span>
        </div>
      );
    }
    
    return icons;
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
        href={`${ROUTES.FORUMS}/${thread.category.slug}/${thread.slug || thread.id}`}
        className={`block group hover:bg-[#20303d] transition-colors ${className}`}
      >
        <div className="flex items-center space-x-3 p-3 border-b border-[#2b3d4d]">
          
          {/* Thread Status Icons */}
          <div className="flex items-center space-x-1 flex-shrink-0">
            {thread.hasUnreadPosts && user && (
              <div className="w-2 h-2 bg-[#fa4454] rounded-full"></div>
            )}
            {thread.isLocked && (
              <svg className="w-3 h-3 text-[#ef4444]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
              </svg>
            )}
          </div>
          
          {/* Title */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white group-hover:text-[#fa4454] transition-colors truncate">
              {thread.prefix && (
                <span className="text-[#fa4454] mr-2">[{thread.prefix}]</span>
              )}
              {thread.title}
            </h3>
            <div className="text-xs text-[#768894] mt-0.5">
              by {thread.author.username} • {formatTimeAgo(thread.createdAt)}
            </div>
          </div>
          
          {/* Stats */}
          <div className="text-xs text-[#768894] text-right flex-shrink-0">
            <div>{formatNumber(thread.replyCount)} replies</div>
            <div>{formatNumber(thread.viewCount)} views</div>
          </div>
        </div>
      </Link>
    );
  }

  // Default/Detailed variant
  return (
    <Link 
      href={`${ROUTES.FORUMS}/${thread.category.slug}/${thread.slug || thread.id}`}
      className={`block group ${className}`}
    >
      <article className="bg-[#1a2332] border-b border-[#2b3d4d] hover:bg-[#20303d] transition-all duration-200">
        <div className="p-4">
          
          {/* Header Row */}
          <div className="flex items-start space-x-3 mb-3">
            
            {/* Thread Status & Unread Indicator */}
            <div className="flex items-center space-x-2 flex-shrink-0 mt-1">
              {thread.hasUnreadPosts && user && (
                <div className="w-3 h-3 bg-[#fa4454] rounded-full animate-pulse" title="New posts"></div>
              )}
              
              {!thread.hasUnreadPosts && (
                <div className="w-3 h-3 border-2 border-[#2b3d4d] rounded-full"></div>
              )}
            </div>
            
            {/* Thumbnail */}
            {showThumbnail && thread.thumbnailUrl && !imageError && (
              <div className="w-12 h-12 relative flex-shrink-0 rounded overflow-hidden">
                <Image
                  src={thread.thumbnailUrl}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="48px"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getImageUrl(null, 'news-featured');
                    setImageError(true);
                  }}
                />
              </div>
            )}
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              
              {/* Status Badges Row */}
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcons()}
              </div>
              
              {/* Title */}
              <h2 className="text-lg font-semibold text-white group-hover:text-[#fa4454] transition-colors mb-2">
                {thread.prefix && (
                  <span 
                    className="inline-block px-2 py-1 text-xs font-bold text-white rounded mr-2"
                    style={{ backgroundColor: thread.category.color }}
                  >
                    {thread.prefix}
                  </span>
                )}
                <span className={thread.title.length > 80 ? 'line-clamp-2' : ''}>
                  {thread.title}
                </span>
              </h2>
              
              {/* Preview Content */}
              {showPreview && thread.preview && (
                <p className="text-sm text-[#768894] mb-3 line-clamp-2">
                  {thread.preview}
                </p>
              )}
              
              {/* Tags */}
              {showTags && thread.tags && thread.tags.length > 0 && (
                <div className="flex items-center space-x-2 mb-3">
                  <svg className="w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="flex flex-wrap gap-1">
                    {thread.tags.slice(0, 4).map((tag) => (
                      <span 
                        key={tag}
                        className="px-2 py-1 bg-[#2b3d4d] text-[#768894] text-xs rounded hover:bg-[#374555] transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                    {thread.tags.length > 4 && (
                      <span className="px-2 py-1 bg-[#2b3d4d] text-[#768894] text-xs rounded">
                        +{thread.tags.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Thread Meta Information */}
              <div className="flex items-center justify-between">
                
                {/* Author & Category Info */}
                <div className="flex items-center space-x-4 text-sm text-[#768894]">
                  
                  {/* Author */}
                  <div className="flex items-center space-x-2">
                    {thread.author.avatar && !imageError ? (
                      <div className="w-6 h-6 relative rounded overflow-hidden">
                        <Image
                          src={thread.author.avatar}
                          alt={thread.author.username}
                          fill
                          className="object-cover"
                          sizes="24px"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl(null, 'player-avatar');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 bg-[#fa4454] rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">
                          {thread.author.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <span className="text-white hover:text-[#fa4454] transition-colors">
                        {thread.author.username}
                      </span>
                      
                      {thread.author.isOnline && (
                        <div className="w-2 h-2 bg-[#4ade80] rounded-full" title="Online"></div>
                      )}
                      
                      {getRoleBadge(thread.author.role).text && (
                        <span 
                          className="px-1 py-0.5 rounded text-xs font-bold text-white"
                          style={{ backgroundColor: getRoleBadge(thread.author.role).bg }}
                        >
                          {getRoleBadge(thread.author.role).text}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <span>•</span>
                  
                  {/* Category */}
                  {showCategory && (
                    <>
                      <Link
                        href={`${ROUTES.FORUMS}/${thread.category.slug}`}
                        onClick={(e) => e.stopPropagation()}
                        className="hover:text-[#fa4454] transition-colors"
                        style={{ color: thread.category.color }}
                      >
                        {thread.category.name}
                      </Link>
                      <span>•</span>
                    </>
                  )}
                  
                  {/* Created Date */}
                  <time dateTime={thread.createdAt.toISOString()}>
                    {formatTimeAgo(thread.createdAt)}
                  </time>
                </div>
                
                {/* Thread Statistics */}
                <div className="flex items-center space-x-4 text-sm">
                  
                  {/* Reply Count */}
                  <div className="flex items-center space-x-1 text-[#768894]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-white font-medium">{formatNumber(thread.replyCount)}</span>
                  </div>
                  
                  {/* View Count */}
                  <div className="flex items-center space-x-1 text-[#768894]">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span className="text-white font-medium">{formatNumber(thread.viewCount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Last Activity Row */}
          <div className="flex items-center justify-between pt-3 border-t border-[#2b3d4d]">
            
            {/* Last Activity Info */}
            <div className="flex items-center space-x-3">
              
              {/* Last Activity Author Avatar */}
              {thread.lastActivity.author.avatar ? (
                <div className="w-8 h-8 relative rounded overflow-hidden">
                  <Image
                    src={thread.lastActivity.author.avatar}
                    alt={thread.lastActivity.author.username}
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
                  <span className="text-white font-bold text-sm">
                    {thread.lastActivity.author.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              {/* Last Activity Details */}
              <div>
                <div className="text-sm text-white">
                  Last reply by{' '}
                  <Link
                    href={`${ROUTES.PROFILE}/${thread.lastActivity.author.username}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#fa4454] hover:text-[#e03e4e] transition-colors"
                  >
                    {thread.lastActivity.author.username}
                  </Link>
                  
                  {getRoleBadge(thread.lastActivity.author.role).text && (
                    <span 
                      className="ml-2 px-1 py-0.5 rounded text-xs font-bold text-white"
                      style={{ backgroundColor: getRoleBadge(thread.lastActivity.author.role).bg }}
                    >
                      {getRoleBadge(thread.lastActivity.author.role).text}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-[#768894]">
                  {formatTimeAgo(thread.lastActivity.timestamp)} • Post #{thread.lastActivity.postNumber}
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              
              {/* Subscribe/Unsubscribe */}
              {user && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    // Handle subscription toggle
                  }}
                  className={`p-2 rounded transition-colors ${
                    thread.isSubscribed 
                      ? 'text-[#fa4454] hover:text-[#e03e4e]' 
                      : 'text-[#768894] hover:text-[#fa4454]'
                  }`}
                  title={thread.isSubscribed ? 'Unsubscribe' : 'Subscribe'}
                >
                  <svg className="w-4 h-4" fill={thread.isSubscribed ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-7a6 6 0 016-6V4H4v15z" />
                  </svg>
                </button>
              )}
              
              {/* Go to Last Post */}
              <Link
                href={`${ROUTES.FORUMS}/${thread.category.slug}/${thread.slug || thread.id}#post-${thread.lastActivity.postNumber}`}
                onClick={(e) => e.stopPropagation()}
                className="p-2 text-[#768894] hover:text-[#fa4454] transition-colors"
                title="Go to last post"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ThreadRow;
