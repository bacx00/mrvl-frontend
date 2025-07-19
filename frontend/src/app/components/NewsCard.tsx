// src/components/NewsCard.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { NewsArticle } from '@/lib/types';
import { formatDate, truncate } from '@/lib/utils';
import { getImageUrl } from '@/utils/imageUrlUtils';
import { ROUTES } from '@/lib/constants';

interface NewsCardProps {
  article: NewsArticle;
  compact?: boolean;
  showImage?: boolean;
  showExcerpt?: boolean;
  showAuthor?: boolean;
  showCategory?: boolean;
  showReadingTime?: boolean;
  className?: string;
}

const NewsCard: React.FC<NewsCardProps> = ({
  article,
  compact = false,
  showImage = true,
  showExcerpt = true,
  showAuthor = true,
  showCategory = true,
  showReadingTime = false,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Handle sharing
  const shareArticle = async (platform: 'twitter' | 'facebook' | 'copy', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}${ROUTES.NEWS}/${article.id}`;
    const text = article.title;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        // You could show a toast notification here
        break;
    }
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      'news': '#4ade80',
      'updates': '#3b82f6',
      'patch notes': '#f59e0b',
      'esports': '#fa4454',
      'guides': '#8b5cf6',
      'community': '#06b6d4'
    };
    return colors[category.toLowerCase()] || '#768894';
  };

  // Calculate reading time (rough estimate)
  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
  };

  if (compact) {
    return (
      <Link 
        href={`${ROUTES.NEWS}/${article.id}`}
        className={`block hover:bg-[#20303d] transition-colors ${className}`}
      >
        <div className="flex items-start space-x-3 p-3">
          {showImage && article.featured_image && !imageError && (
            <div className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden">
              <Image
                src={getImageUrl(article.featured_image)}
                alt={article.featured_image_alt || article.title}
                fill
                className="object-cover"
                sizes="64px"
                onError={() => setImageError(true)}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white line-clamp-2 mb-1">
              {article.title}
            </h3>
            
            <div className="flex items-center space-x-2 text-xs text-[#768894]">
              {showCategory && article.category && (
                <span 
                  className="px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{ 
                    backgroundColor: `${getCategoryColor(article.category.name)}20`,
                    color: getCategoryColor(article.category.name)
                  }}
                >
                  {article.category.name}
                </span>
              )}
              <span>{formatDate(article.published_at)}</span>
              {showAuthor && article.author && (
                <span>by {article.author.username}</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`${ROUTES.NEWS}/${article.id}`}
      className={`block group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <article className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden transition-all duration-300 hover:border-[#fa4454] hover:shadow-lg hover:-translate-y-1">
        
        {/* Featured Image */}
        {showImage && article.featured_image && !imageError && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={getImageUrl(article.featured_image)}
              alt={article.featured_image_alt || article.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              priority={false}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            
            {/* Category Badge */}
            {showCategory && article.category && (
              <div className="absolute top-3 left-3">
                <span 
                  className="px-2 py-1 rounded text-xs font-semibold text-white"
                  style={{ backgroundColor: getCategoryColor(article.category.name) }}
                >
                  {article.category.name.toUpperCase()}
                </span>
              </div>
            )}

            {/* Share Button (appears on hover) */}
            {isHovered && (
              <div className="absolute top-3 right-3">
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => shareArticle('twitter', e)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    title="Share on Twitter"
                  >
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                  <button
                    onClick={(e) => shareArticle('copy', e)}
                    className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                    title="Copy Link"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          
          {/* Title */}
          <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#fa4454] transition-colors">
            {article.title}
          </h2>
          
          {/* Excerpt */}
          {showExcerpt && article.excerpt && (
            <p className="text-sm text-[#768894] mb-3 line-clamp-3">
              {truncate(article.excerpt, 150)}
            </p>
          )}
          
          {/* Meta Information */}
          <div className="flex items-center justify-between text-xs text-[#768894]">
            <div className="flex items-center space-x-3">
              {showAuthor && article.author && (
                <div className="flex items-center space-x-1">
                  <div className="w-5 h-5 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      {article.author.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span>{article.author.username}</span>
                </div>
              )}
              
              <span>{formatDate(article.published_at)}</span>
              
              {showReadingTime && (
                <span>{calculateReadingTime(article.content)} min read</span>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              {/* View Count */}
              {article.views_count > 0 && (
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{article.views_count.toLocaleString()}</span>
                </div>
              )}
              
              {/* Comment Count */}
              {article.comments_count > 0 && (
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{article.comments_count}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {article.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-[#0f1419] border border-[#2b3d4d] rounded-full text-xs text-[#768894] hover:border-[#fa4454] hover:text-[#fa4454] transition-colors"
                >
                  #{tag}
                </span>
              ))}
              {article.tags.length > 3 && (
                <span className="px-2 py-1 text-xs text-[#768894]">
                  +{article.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
};

export default NewsCard;
