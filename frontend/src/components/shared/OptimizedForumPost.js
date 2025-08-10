import React, { useState } from 'react';
import ForumVotingButtons from './ForumVotingButtons';
import EnhancedUserAvatar, { EnhancedUserCard } from './EnhancedUserAvatar';
import EngagementMetrics, { ActivityIndicator } from './EngagementMetrics';
import { processContentWithMentions } from '../../utils/mentionUtils';
import { formatTimeAgo, formatDateMobile, isMobile } from '../../lib/utils';

const OptimizedForumPost = ({
  post,
  thread,
  showVoting = true,
  showMentions = true,
  showEngagement = true,
  compact = false,
  onVoteChange,
  onMentionClick,
  className = ''
}) => {
  const [showUserCard, setShowUserCard] = useState(false);
  const [expandedContent, setExpandedContent] = useState(false);
  
  const isCompact = compact || (typeof window !== 'undefined' && isMobile());

  // Process content with mentions
  const processedContent = showMentions && post.mentions 
    ? processContentWithMentions(post.content, post.mentions, onMentionClick)
    : post.content;

  // Determine if content should be truncated
  const shouldTruncate = post.content && post.content.length > 300 && !expandedContent;
  const displayContent = shouldTruncate 
    ? post.content.substring(0, 300) + '...' 
    : post.content;

  return (
    <article className={`bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden hover:border-[#fa4454] transition-all duration-200 ${className}`}>
      <div className="p-4">
        
        {/* Header Section */}
        <div className="flex items-start space-x-3 mb-4">
          
          {/* Voting Section (if enabled) */}
          {showVoting && (
            <div className="flex-shrink-0">
              <ForumVotingButtons
                itemType="post"
                itemId={post.id}
                initialUpvotes={post.upvotes || 0}
                initialDownvotes={post.downvotes || 0}
                userVote={post.userVote}
                onVoteChange={onVoteChange}
                direction="vertical"
                size={isCompact ? "sm" : "md"}
              />
            </div>
          )}

          {/* User Avatar Section */}
          <div className="flex-shrink-0">
            <EnhancedUserAvatar
              user={post.author}
              size={isCompact ? "md" : "lg"}
              showOnlineStatus={true}
              showRole={true}
              clickable={true}
              onUserClick={() => setShowUserCard(!showUserCard)}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            
            {/* Post Header Info */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2 text-sm">
                <span className="font-medium text-white">
                  {post.author?.username || 'Unknown User'}
                </span>
                
                {post.author?.role && post.author.role !== 'user' && (
                  <span className="px-2 py-1 bg-[#fa4454] text-white text-xs rounded font-bold">
                    {post.author.role.toUpperCase()}
                  </span>
                )}
                
                <span className="text-[#768894]">•</span>
                
                <time 
                  dateTime={post.createdAt?.toISOString()} 
                  className="text-[#768894]"
                  title={post.createdAt?.toLocaleString()}
                >
                  {isCompact 
                    ? formatDateMobile(post.createdAt) 
                    : formatTimeAgo(post.createdAt)
                  }
                </time>

                {post.editedAt && (
                  <>
                    <span className="text-[#768894]">•</span>
                    <span className="text-[#768894] italic text-xs">
                      edited {formatTimeAgo(post.editedAt)}
                    </span>
                  </>
                )}
              </div>

              {/* Post Number/Link */}
              {post.postNumber && (
                <a
                  href={`#post-${post.postNumber}`}
                  className="text-xs text-[#768894] hover:text-[#fa4454] transition-colors"
                  title={`Link to post #${post.postNumber}`}
                >
                  #{post.postNumber}
                </a>
              )}
            </div>

            {/* Post Content */}
            <div className="text-white leading-relaxed mb-4">
              {showMentions ? (
                <div className="prose prose-invert max-w-none">
                  {shouldTruncate ? displayContent : processedContent}
                </div>
              ) : (
                <div 
                  className="prose prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ 
                    __html: (shouldTruncate ? displayContent : post.content).replace(/\n/g, '<br>') 
                  }}
                />
              )}
              
              {shouldTruncate && (
                <button
                  onClick={() => setExpandedContent(true)}
                  className="text-[#fa4454] hover:text-[#e03e4e] text-sm mt-2 transition-colors inline-flex items-center"
                >
                  Show more
                  <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Attachments (if any) */}
            {post.attachments && post.attachments.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-2 gap-2">
                  {post.attachments.slice(0, 4).map((attachment, index) => (
                    <div key={index} className="aspect-video bg-[#2b3d4d] rounded-lg flex items-center justify-center">
                      <span className="text-[#768894] text-sm">{attachment.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Metrics */}
            {showEngagement && (
              <div className="border-t border-[#2b3d4d] pt-3">
                <EngagementMetrics
                  item={post}
                  type="post"
                  compact={true}
                  showLabels={!isCompact}
                  showLastActivity={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Expandable User Card */}
        {showUserCard && post.author && (
          <div className="border-t border-[#2b3d4d] pt-4 mt-4">
            <EnhancedUserCard
              user={post.author}
              compact={isCompact}
              showAvatar={false}
              showStats={true}
              showRole={true}
            />
          </div>
        )}
      </div>
    </article>
  );
};

// Optimized Thread Row Component
export const OptimizedThreadRow = ({
  thread,
  showPreview = false,
  showVoting = false,
  onThreadClick,
  className = ''
}) => {
  const isCompact = typeof window !== 'undefined' && isMobile();

  return (
    <article 
      className={`bg-[#1a2332] border-b border-[#2b3d4d] hover:bg-[#20303d] transition-all duration-200 cursor-pointer ${className}`}
      onClick={() => onThreadClick && onThreadClick(thread)}
    >
      <div className="p-4">
        
        {/* Main Thread Info */}
        <div className="flex items-start space-x-3">
          
          {/* Thread Status Indicators */}
          <div className="flex-shrink-0 mt-1">
            <div className="flex flex-col space-y-1">
              {/* Unread indicator */}
              {thread.hasUnreadPosts && (
                <div className="w-3 h-3 bg-[#fa4454] rounded-full animate-pulse" />
              )}
              
              {/* Status icons */}
              {thread.isPinned && (
                <div className="text-[#f59e0b]" title="Pinned">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z"/>
                  </svg>
                </div>
              )}
              
              {thread.isLocked && (
                <div className="text-[#ef4444]" title="Locked">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {/* Thread Content */}
          <div className="flex-1 min-w-0">
            
            {/* Title and Prefix */}
            <h3 className="text-lg font-semibold text-white hover:text-[#fa4454] transition-colors mb-2">
              {thread.prefix && (
                <span className="inline-block px-2 py-1 bg-[#fa4454] text-white text-xs rounded mr-2">
                  {thread.prefix}
                </span>
              )}
              <span className={thread.title.length > 60 ? 'line-clamp-2' : ''}>
                {thread.title}
              </span>
            </h3>

            {/* Preview (if enabled) */}
            {showPreview && thread.preview && (
              <p className="text-sm text-[#768894] mb-3 line-clamp-2">
                {thread.preview}
              </p>
            )}

            {/* Thread Meta */}
            <div className="flex items-center justify-between">
              
              {/* Author and Category */}
              <div className="flex items-center space-x-3 text-sm text-[#768894]">
                <EnhancedUserAvatar
                  user={thread.author}
                  size="xs"
                  showOnlineStatus={!isCompact}
                  showRole={false}
                />
                
                <span className="text-white">
                  {thread.author?.username}
                </span>
                
                <span>•</span>
                
                <span style={{ color: thread.category?.color }}>
                  {thread.category?.name}
                </span>
                
                <span>•</span>
                
                <time dateTime={thread.createdAt?.toISOString()}>
                  {isCompact 
                    ? formatDateMobile(thread.createdAt)
                    : formatTimeAgo(thread.createdAt)
                  }
                </time>
              </div>

              {/* Engagement Stats */}
              <EngagementMetrics
                item={thread}
                type="thread"
                compact={true}
                showLabels={false}
                showLastActivity={false}
              />
            </div>

            {/* Last Activity */}
            {thread.lastActivity && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2b3d4d]">
                <div className="flex items-center space-x-2 text-sm text-[#768894]">
                  <EnhancedUserAvatar
                    user={thread.lastActivity.author}
                    size="xs"
                    showOnlineStatus={false}
                  />
                  <span>
                    Last reply by{' '}
                    <span className="text-white">{thread.lastActivity.author?.username}</span>
                  </span>
                </div>
                
                <ActivityIndicator
                  activity={thread.lastActivity}
                  size="sm"
                  showDot={true}
                  showText={true}
                />
              </div>
            )}
          </div>

          {/* Voting (if enabled) */}
          {showVoting && (
            <div className="flex-shrink-0">
              <ForumVotingButtons
                itemType="thread"
                itemId={thread.id}
                initialUpvotes={thread.upvotes || 0}
                initialDownvotes={thread.downvotes || 0}
                userVote={thread.userVote}
                direction="vertical"
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default OptimizedForumPost;