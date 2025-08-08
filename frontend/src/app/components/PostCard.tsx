// src/components/PostCard.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getImageUrl } from '@/utils/imageUtils';

export interface PostAuthor {
  id: string;
  username: string;
  avatar?: string;
  role: string;
  title?: string;
  joinDate: Date;
  postCount: number;
  reputation?: number;
  badges?: string[];
  country?: string;
  isOnline?: boolean;
  customTitle?: string;
}

export interface PostReaction {
  type: string;
  count: number;
  userReacted: boolean;
  users?: string[]; // usernames who reacted
}

export interface PostAttachment {
  id: string;
  type: 'image' | 'video' | 'file';
  url: string;
  name: string;
  size: number;
  thumbnail?: string;
}

export interface Post {
  id: string;
  content: string;
  author: PostAuthor;
  createdAt: Date;
  editedAt?: Date;
  editReason?: string;
  postNumber: number;
  threadId: string;
  
  // Reactions and interactions
  reactions?: PostReaction[];
  quotes?: string[]; // post IDs that quote this post
  mentions?: string[]; // user IDs mentioned in this post
  
  // Content features
  attachments?: PostAttachment[];
  poll?: {
    id: string;
    question: string;
    options: { id: string; text: string; votes: number }[];
    allowMultiple: boolean;
    endsAt?: Date;
    userVoted?: boolean;
  };
  
  // Moderation
  isDeleted?: boolean;
  deleteReason?: string;
  isHidden?: boolean;
  warnings?: string[];
  
  // Metadata
  ipAddress?: string; // for admins/mods
  userAgent?: string; // for admins/mods
}

interface PostCardProps {
  post: Post;
  threadTitle?: string;
  showPostNumber?: boolean;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
  onReaction?: (postId: string, reactionType: string) => void;
  onQuote?: (postId: string, content: string) => void;
  onReport?: (postId: string, reason: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  threadTitle,
  showPostNumber = true,
  showActions = true,
  compact = false,
  className = '',
  onReaction,
  onQuote,
  onReport,
  onEdit,
  onDelete
}) => {
  const { user } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showUserCard, setShowUserCard] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [expandedContent, setExpandedContent] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  
  const reactionPickerRef = useRef<HTMLDivElement>(null);
  const userCardRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (reactionPickerRef.current && !reactionPickerRef.current.contains(event.target as Node)) {
        setShowReactionPicker(false);
      }
      if (userCardRef.current && !userCardRef.current.contains(event.target as Node)) {
        setShowUserCard(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available reactions
  const reactionEmojis = {
    like: { emoji: '👍', label: 'Like' },
    dislike: { emoji: '👎', label: 'Dislike' },
    laugh: { emoji: '😂', label: 'Funny' },
    love: { emoji: '❤️', label: 'Love' },
    angry: { emoji: '😠', label: 'Angry' },
    sad: { emoji: '😢', label: 'Sad' },
    wow: { emoji: '😮', label: 'Wow' },
    thinking: { emoji: '🤔', label: 'Thinking' },
    plus_one: { emoji: '➕', label: '+1' },
    informative: { emoji: 'ℹ️', label: 'Informative' }
  };

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    const badges = {
      admin: { bg: '#ef4444', text: 'Admin', icon: '👑' },
      moderator: { bg: '#4ade80', text: 'Mod', icon: '🛡️' },
      vip: { bg: '#f59e0b', text: 'VIP', icon: '⭐' },
      premium: { bg: '#8b5cf6', text: 'Premium', icon: '💎' },
      user: { bg: 'transparent', text: '', icon: '' }
    };
    
    return badges[role as keyof typeof badges] || badges.user;
  };

  // Handle image errors
  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set([...prev, src]));
  };

  // Handle reaction click
  const handleReactionClick = (reactionType: string) => {
    if (user && onReaction) {
      onReaction(post.id, reactionType);
    }
    setShowReactionPicker(false);
  };

  // Handle quote
  const handleQuote = () => {
    if (onQuote) {
      const quotedContent = `[quote="${post.author.username}"]${post.content}[/quote]\n\n`;
      onQuote(post.id, quotedContent);
    }
  };

  // Handle report
  const handleReport = () => {
    if (onReport && reportReason.trim()) {
      onReport(post.id, reportReason);
      setShowReportModal(false);
      setReportReason('');
    }
  };

  // Truncate long content
  const shouldTruncateContent = post.content.length > 500 && !expandedContent;
  const displayContent = shouldTruncateContent 
    ? post.content.substring(0, 500) + '...'
    : post.content;

  // Check if user can moderate this post
  const canModerate = user && (
    user.role === 'admin' || 
    user.role === 'moderator' || 
    user.id === post.author.id
  );

  if (post.isDeleted && !canModerate) {
    return (
      <div className={`bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4 ${className}`}>
        <div className="text-center text-[#768894]">
          <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <p className="text-sm">This post has been deleted</p>
          {post.deleteReason && (
            <p className="text-xs mt-1">Reason: {post.deleteReason}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <article className={`bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4 ${className}`}>
      {/* Post Header with Author Info */}
      <div className="flex items-start space-x-3 mb-3">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
            
            {/* User Avatar */}
            <div className="text-center mb-3">
              <div className="relative inline-block">
                {post.author.avatar && !imageErrors.has(post.author.avatar) ? (
                  <div className="w-16 h-16 relative rounded-full overflow-hidden mx-auto">
                    <Image
                      src={post.author.avatar}
                      alt={post.author.username}
                      fill
                      className="object-cover"
                      sizes="64px"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getImageUrl(null, 'player-avatar');
                        handleImageError(post.author.avatar!);
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-[#fa4454] rounded-full flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-xl">
                      {post.author.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                
                {/* Online Status */}
                {post.author.isOnline && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#4ade80] border-2 border-[#0f1419] rounded-full"></div>
                )}
              </div>
            </div>
            
            {/* Username and Role */}
            <div className="text-center mb-3">
              <Link
                href={`${ROUTES.PROFILE}/${post.author.username}`}
                className="font-semibold text-white hover:text-[#fa4454] transition-colors block"
                onMouseEnter={() => setShowUserCard(true)}
                onMouseLeave={() => setShowUserCard(false)}
              >
                {post.author.username}
              </Link>
              
              {/* Role Badge */}
              {getRoleBadge(post.author.role).text && (
                <div className="flex items-center justify-center space-x-1 mt-1">
                  <span 
                    className="px-2 py-1 rounded text-xs font-bold text-white inline-flex items-center space-x-1"
                    style={{ backgroundColor: getRoleBadge(post.author.role).bg }}
                  >
                    <span>{getRoleBadge(post.author.role).icon}</span>
                    <span>{getRoleBadge(post.author.role).text}</span>
                  </span>
                </div>
              )}
              
              {/* Custom Title */}
              {post.author.customTitle && (
                <div className="text-xs text-[#fa4454] italic mt-1">
                  {post.author.customTitle}
                </div>
              )}
            </div>
            
            {/* User Stats */}
            <div className="text-xs text-[#768894] space-y-1">
              <div className="flex justify-between">
                <span>Posts:</span>
                <span className="text-white">{formatNumber(post.author.postCount)}</span>
              </div>
              
              {post.author.reputation !== undefined && (
                <div className="flex justify-between">
                  <span>Rep:</span>
                  <span className={`${post.author.reputation >= 0 ? 'text-[#4ade80]' : 'text-[#ef4444]'}`}>
                    {formatNumber(post.author.reputation)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Joined:</span>
                <span className="text-white">
                  {post.author.joinDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                  })}
                </span>
              </div>
              
              {post.author.country && (
                <div className="flex justify-between">
                  <span>Location:</span>
                  <span className="text-white">{post.author.country}</span>
                </div>
              )}
            </div>
            
            {/* User Badges */}
            {post.author.badges && post.author.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1 justify-center">
                {post.author.badges.slice(0, 3).map((badge, index) => (
                  <span key={index} className="text-xs bg-[#2b3d4d] text-[#768894] px-1 py-0.5 rounded">
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Post Content */}
        <div className="flex-1 p-4">
          
          {/* Post Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 text-sm text-[#768894]">
              <time dateTime={post.createdAt.toISOString()}>
                {formatTimeAgo(post.createdAt)}
              </time>
              
              {post.editedAt && (
                <>
                  <span>•</span>
                  <span className="italic">
                    Edited {formatTimeAgo(post.editedAt)}
                    {post.editReason && (
                      <span className="ml-1">({post.editReason})</span>
                    )}
                  </span>
                </>
              )}
              
              {showPostNumber && (
                <>
                  <span>•</span>
                  <Link 
                    href={`#post-${post.postNumber}`}
                    className="hover:text-[#fa4454] transition-colors"
                  >
                    #{post.postNumber}
                  </Link>
                </>
              )}
            </div>
            
            {/* Quick Actions */}
            {showActions && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleQuote}
                  className="text-[#768894] hover:text-[#fa4454] transition-colors text-sm"
                  title="Quote this post"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>
                
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-[#768894] hover:text-[#f59e0b] transition-colors text-sm"
                  title="Report this post"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </button>
                
                {canModerate && (
                  <>
                    <button
                      onClick={() => onEdit?.(post.id)}
                      className="text-[#768894] hover:text-[#4ade80] transition-colors text-sm"
                      title="Edit post"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => onDelete?.(post.id)}
                      className="text-[#768894] hover:text-[#ef4444] transition-colors text-sm"
                      title="Delete post"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {/* Warning Messages */}
          {post.warnings && post.warnings.length > 0 && (
            <div className="mb-4 p-3 bg-[#f59e0b]/20 border border-[#f59e0b] rounded">
              <div className="flex items-center space-x-2 text-[#f59e0b]">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-medium">Moderation Warning</span>
              </div>
              <ul className="text-sm text-[#f59e0b] mt-1 list-disc list-inside">
                {post.warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Post Content */}
          <div className="text-[#ffffff] leading-relaxed mb-4">
            <div 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: displayContent.replace(/\n/g, '<br>') 
              }}
            />
            
            {shouldTruncateContent && (
              <button
                onClick={() => setExpandedContent(true)}
                className="text-[#fa4454] hover:text-[#e03e4e] text-sm mt-2 transition-colors"
              >
                Show more...
              </button>
            )}
          </div>
          
          {/* Attachments */}
          {post.attachments && post.attachments.length > 0 && (
            <div className="mb-4">
              <div className="text-sm text-[#768894] mb-2">Attachments</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {post.attachments.map((attachment) => (
                  <div key={attachment.id} className="relative group">
                    {attachment.type === 'image' ? (
                      <div className="aspect-video relative rounded overflow-hidden">
                        <Image
                          src={attachment.url}
                          alt={attachment.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 50vw, 33vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl(null, 'news-featured');
                          }}
                        />
                      </div>
                    ) : (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 p-2 bg-[#2b3d4d] hover:bg-[#374555] rounded transition-colors"
                      >
                        <svg className="w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                        <span className="text-sm text-white truncate">{attachment.name}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Poll */}
          {post.poll && (
            <div className="mb-4 p-4 bg-[#0f1419] border border-[#2b3d4d] rounded">
              <h4 className="text-white font-medium mb-3">{post.poll.question}</h4>
              <div className="space-y-2">
                {post.poll.options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type={post.poll.allowMultiple ? 'checkbox' : 'radio'}
                        name={`poll-${post.poll.id}`}
                        disabled={post.poll.userVoted}
                        className="text-[#fa4454]"
                      />
                      <span className="text-sm text-white">{option.text}</span>
                    </div>
                    <div className="text-sm text-[#768894]">
                      {option.votes} ({((option.votes / Math.max(post.poll.options.reduce((sum, opt) => sum + opt.votes, 0), 1)) * 100).toFixed(1)}%)
                    </div>
                  </div>
                ))}
              </div>
              {post.poll.endsAt && (
                <div className="text-xs text-[#768894] mt-2">
                  Ends: {post.poll.endsAt.toLocaleString()}
                </div>
              )}
            </div>
          )}
          
          {/* Reactions and Footer */}
          <div className="flex items-center justify-between">
            
            {/* Reactions */}
            <div className="flex items-center space-x-2">
              
              {/* Existing Reactions */}
              {post.reactions && post.reactions.length > 0 && (
                <div className="flex items-center space-x-1">
                  {post.reactions.map((reaction) => (
                    <button
                      key={reaction.type}
                      onClick={() => handleReactionClick(reaction.type)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        reaction.userReacted
                          ? 'bg-[#fa4454] text-white shadow-lg'
                          : 'bg-[#2b3d4d] text-[#768894] hover:bg-[#374555]'
                      }`}
                      disabled={!user}
                      title={`${reactionEmojis[reaction.type as keyof typeof reactionEmojis]?.label || reaction.type} (${reaction.count})`}
                    >
                      <span>{reactionEmojis[reaction.type as keyof typeof reactionEmojis]?.emoji || '👍'}</span>
                      <span>{reaction.count}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Add Reaction */}
              {user && (
                <div className="relative" ref={reactionPickerRef}>
                  <button
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                    className="flex items-center space-x-1 px-2 py-1 text-sm text-[#768894] hover:text-[#fa4454] hover:bg-[#2b3d4d] rounded transition-colors"
                  >
                    <span>😊</span>
                    <span>React</span>
                  </button>
                  
                  {showReactionPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-[#1a2332] border border-[#2b3d4d] rounded-lg shadow-xl p-3 z-20">
                      <div className="grid grid-cols-5 gap-2">
                        {Object.entries(reactionEmojis).map(([type, { emoji, label }]) => (
                          <button
                            key={type}
                            onClick={() => handleReactionClick(type)}
                            className="w-8 h-8 rounded hover:bg-[#2b3d4d] flex items-center justify-center text-lg transition-colors"
                            title={label}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Post Link */}
            <div className="text-xs text-[#768894]">
              <Link 
                href={`${ROUTES.FORUMS}/thread/${post.threadId}#post-${post.postNumber}`}
                className="hover:text-[#fa4454] transition-colors"
              >
                #{post.postNumber}
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Report Post</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-[#768894] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-[#768894] mb-4">
              Why are you reporting this post by {post.author.username}?
            </p>
            
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please describe the issue..."
              className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] resize-none"
              rows={4}
            />
            
            <div className="flex items-center justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-[#768894] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default PostCard;
