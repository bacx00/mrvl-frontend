// src/components/PostCardSimple.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { formatTimeAgo, formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import VotingButtons from '@/components/shared/VotingButtons';
import { getImageUrl } from '@/utils/imageUtils';

export interface PostAuthor {
  id: string;
  username: string;
  avatar?: string;
  role: string;
  team?: string;
  country?: string;
  isOnline?: boolean;
}

export interface Post {
  id: string;
  content: string;
  author: PostAuthor;
  createdAt: Date;
  editedAt?: Date;
  postNumber: number;
  threadId: string;
  parentPostId?: string; // For nested replies
  replyToUser?: string; // Username being replied to
  upvotes?: number;
  downvotes?: number;
  userVote?: 'upvote' | 'downvote' | null;
}

interface PostCardSimpleProps {
  post: Post;
  isNested?: boolean;
  onReply?: (postId: string, username: string) => void;
  className?: string;
}

const PostCardSimple: React.FC<PostCardSimpleProps> = ({
  post,
  isNested = false,
  onReply,
  className = ''
}) => {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#ef4444';
      case 'moderator': return '#f59e0b';
      case 'vip': return '#8b5cf6';
      default: return '#768894';
    }
  };

  return (
    <div className={`${isNested ? 'ml-12' : ''} ${className}`}>
      <div className="flex space-x-3">
        {/* Post Number */}
        <div className="text-[#768894] text-sm font-medium pt-1">
          #{post.postNumber}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Author Header */}
          <div className="flex items-center space-x-3 mb-2">
            {/* Avatar */}
            <div className="relative">
              {post.author.avatar && !imageError ? (
                <div className="w-8 h-8 relative rounded-full overflow-hidden">
                  <Image
                    src={getImageUrl(post.author.avatar)}
                    alt={post.author.username}
                    fill
                    className="object-cover"
                    sizes="32px"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getImageUrl(null, 'player-avatar');
                      setImageError(true);
                    }}
                  />
                </div>
              ) : (
                <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {post.author.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {post.author.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4ade80] border-2 border-[#1a2332] rounded-full"></div>
              )}
            </div>

            {/* Username and Team */}
            <div className="flex items-center space-x-2">
              <Link
                href={`${ROUTES.PROFILE}/${post.author.username}`}
                className="font-medium hover:text-[#fa4454] transition-colors"
                style={{ color: getRoleColor(post.author.role) }}
              >
                {post.author.username}
              </Link>
              
              {post.author.team && (
                <span className="text-[#768894] text-sm">
                  [{post.author.team}]
                </span>
              )}

              {post.author.country && (
                <span className="text-xs text-[#768894]">
                  {post.author.country}
                </span>
              )}
            </div>

            {/* Reply indicator */}
            {post.replyToUser && (
              <span className="text-[#768894] text-sm">
                replying to <span className="text-[#fa4454]">@{post.replyToUser}</span>
              </span>
            )}

            {/* Timestamp */}
            <time className="text-[#768894] text-sm ml-auto">
              {formatTimeAgo(post.createdAt)}
              {post.editedAt && ' (edited)'}
            </time>
          </div>

          {/* Post Content */}
          <div className="text-white mb-3 whitespace-pre-wrap">
            {post.content}
          </div>

          {/* Post Actions */}
          <div className="flex items-center space-x-4">
            {/* Voting */}
            <VotingButtons
              itemType="forum_post"
              itemId={post.id}
              initialUpvotes={post.upvotes || 0}
              initialDownvotes={post.downvotes || 0}
              userVote={post.userVote}
              size="xs"
              direction="horizontal"
            />

            {/* Reply Button */}
            {user && onReply && (
              <button
                onClick={() => onReply(post.id, post.author.username)}
                className="text-[#768894] hover:text-[#fa4454] text-sm transition-colors"
              >
                reply
              </button>
            )}

            {/* Link */}
            <Link
              href={`#post-${post.postNumber}`}
              className="text-[#768894] hover:text-white text-sm transition-colors"
            >
              link
            </Link>

            {/* Edit/Delete for own posts */}
            {user && user.username === post.author.username && (
              <>
                <button className="text-[#768894] hover:text-white text-sm transition-colors">
                  edit
                </button>
                <button className="text-[#768894] hover:text-[#ef4444] text-sm transition-colors">
                  delete
                </button>
              </>
            )}

            {/* Mod Actions */}
            {user && (user.role === 'admin' || user.role === 'moderator') && (
              <button className="text-[#f59e0b] hover:text-[#fbbf24] text-sm transition-colors">
                moderate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCardSimple;