// src/components/HeroCarousel.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import OptimizedImage from './OptimizedImage';
import { formatTimeAgo } from '@/lib/utils';

export interface HeroSlide {
  id: string;
  type: 'match' | 'event' | 'news' | 'announcement';
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  link: string;
  ctaText?: string;
  priority: number;
  
  // Match-specific data
  team1?: {
    id: string;
    name: string;
    logo: string;
    score?: number;
  };
  team2?: {
    id: string;
    name: string;
    logo: string;
    score?: number;
  };
  matchStatus?: 'upcoming' | 'live' | 'completed';
  matchTime?: Date;
  
  // Event-specific data
  eventDate?: Date;
  eventLocation?: string;
  prizePool?: number;
  
  // News-specific data
  author?: string;
  publishedAt?: Date;
  category?: string;
  
  // Visual options
  overlayOpacity?: number;
  textPosition?: 'left' | 'center' | 'right';
  textColor?: string;
  accentColor?: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  showIndicators?: boolean;
  showNavigation?: boolean;
  enableSwipe?: boolean;
  enableKeyboard?: boolean;
  pauseOnHover?: boolean;
  className?: string;
  onSlideChange?: (index: number, slide: HeroSlide) => void;
  onSlideClick?: (slide: HeroSlide) => void;
}

const HeroCarousel: React.FC<HeroCarouselProps> = ({
  slides,
  autoPlay = true,
  autoPlayInterval = 5000,
  showIndicators = true,
  showNavigation = true,
  enableSwipe = true,
  enableKeyboard = true,
  pauseOnHover = true,
  className = '',
  onSlideChange,
  onSlideClick
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Ensure we have slides
  if (!slides || slides.length === 0) {
    return (
      <div className={`bg-[#1a2332] border border-[#2b3d4d] rounded-lg h-64 flex items-center justify-center ${className}`}>
        <div className="text-center text-[#768894]">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p>No featured content available</p>
        </div>
      </div>
    );
  }

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying || isPaused || slides.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, autoPlayInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, isPaused, slides.length, autoPlayInterval]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === ' ') {
        event.preventDefault();
        setIsPlaying(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboard]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [slides.length, isTransitioning]);

  const goToPrevious = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [slides.length, isTransitioning]);

  const goToSlide = useCallback((index: number) => {
    if (index === currentSlide || isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [currentSlide, isTransitioning]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!enableSwipe || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Mouse handlers for pause on hover
  const handleMouseEnter = () => {
    if (pauseOnHover) {
      setIsPaused(true);
    }
  };

  const handleMouseLeave = () => {
    if (pauseOnHover) {
      setIsPaused(false);
    }
  };

  // Handle slide change callback
  useEffect(() => {
    if (onSlideChange) {
      onSlideChange(currentSlide, slides[currentSlide]);
    }
  }, [currentSlide, slides, onSlideChange]);

  // Get slide content based on type
  const getSlideContent = (slide: HeroSlide) => {
    switch (slide.type) {
      case 'match':
        return (
          <div className="space-y-2">
            {slide.matchStatus === 'live' && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></div>
                <span className="text-[#4ade80] text-sm font-bold uppercase">LIVE</span>
              </div>
            )}
            
            <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">
              {slide.team1?.name} vs {slide.team2?.name}
            </h2>
            
            {slide.matchStatus === 'completed' && slide.team1?.score !== undefined && slide.team2?.score !== undefined && (
              <div className="text-xl md:text-2xl font-bold text-[#fa4454]">
                {slide.team1.score} - {slide.team2.score}
              </div>
            )}
            
            {slide.subtitle && (
              <p className="text-lg text-[#768894]">{slide.subtitle}</p>
            )}
            
            {slide.matchTime && (
              <p className="text-sm text-[#768894]">
                {slide.matchStatus === 'upcoming' ? 'Starts ' : ''}
                {formatTimeAgo(slide.matchTime)}
              </p>
            )}
          </div>
        );
        
      case 'event':
        return (
          <div className="space-y-2">
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              {slide.title}
            </h2>
            
            {slide.prizePool && (
              <div className="text-xl font-bold text-[#f59e0b]">
                ${slide.prizePool.toLocaleString()} Prize Pool
              </div>
            )}
            
            {slide.subtitle && (
              <p className="text-lg text-[#768894]">{slide.subtitle}</p>
            )}
            
            {slide.eventDate && (
              <p className="text-sm text-[#768894]">
                {slide.eventDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                {slide.eventLocation && ` • ${slide.eventLocation}`}
              </p>
            )}
          </div>
        );
        
      case 'news':
        return (
          <div className="space-y-2">
            {slide.category && (
              <span className="inline-block px-2 py-1 bg-[#fa4454] text-white text-xs font-bold rounded uppercase">
                {slide.category}
              </span>
            )}
            
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              {slide.title}
            </h2>
            
            {slide.description && (
              <p className="text-lg text-[#768894] line-clamp-2">
                {slide.description}
              </p>
            )}
            
            {(slide.author || slide.publishedAt) && (
              <div className="flex items-center space-x-2 text-sm text-[#768894]">
                {slide.author && <span>By {slide.author}</span>}
                {slide.author && slide.publishedAt && <span>•</span>}
                {slide.publishedAt && <span>{formatTimeAgo(slide.publishedAt)}</span>}
              </div>
            )}
          </div>
        );
        
      default:
        return (
          <div className="space-y-2">
            <h2 className="text-2xl md:text-4xl font-bold text-white">
              {slide.title}
            </h2>
            
            {slide.subtitle && (
              <p className="text-xl text-[#768894]">{slide.subtitle}</p>
            )}
            
            {slide.description && (
              <p className="text-lg text-[#768894] line-clamp-2">
                {slide.description}
              </p>
            )}
          </div>
        );
    }
  };

  const currentSlideData = slides[currentSlide];

  return (
    <div 
      ref={carouselRef}
      className={`relative bg-[#0f1419] rounded-lg overflow-hidden ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      
      {/* Main Slide Container */}
      <div className="relative h-64 md:h-96 lg:h-[500px] overflow-hidden">
        
        {/* Background Image */}
        <div className="absolute inset-0">
          <OptimizedImage
            src={currentSlideData.image}
            alt={currentSlideData.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          
          {/* Gradient Overlay */}
          <div 
            className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"
            style={{ 
              opacity: currentSlideData.overlayOpacity || 0.7 
            }}
          />
        </div>
        
        {/* Content */}
        <div className="relative h-full flex items-center">
          <div className="container mx-auto px-6">
            <div className={`max-w-2xl ${
              currentSlideData.textPosition === 'center' ? 'mx-auto text-center' :
              currentSlideData.textPosition === 'right' ? 'ml-auto text-right' :
              'text-left'
            }`}>
              
              {getSlideContent(currentSlideData)}
              
              {/* CTA Button */}
              {currentSlideData.ctaText && (
                <div className="mt-6">
                  <Link
                    href={currentSlideData.link}
                    onClick={() => onSlideClick?.(currentSlideData)}
                    className="inline-flex items-center px-6 py-3 bg-[#fa4454] hover:bg-[#e03e4e] text-white font-bold rounded-lg transition-colors group"
                  >
                    {currentSlideData.ctaText}
                    <svg className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Navigation Arrows */}
      {showNavigation && slides.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Previous slide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={goToNext}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
            aria-label="Next slide"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Slide Indicators */}
      {showIndicators && slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide 
                  ? 'bg-[#fa4454] w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Play/Pause Button */}
      {autoPlay && slides.length > 1 && (
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="absolute top-4 right-4 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors z-10"
          aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
        >
          {isPlaying ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-4-6V8m0 0V7a1 1 0 011-1h0a1 1 0 011 1v1M12 8v.01" />
            </svg>
          )}
        </button>
      )}
      
      {/* Progress Bar */}
      {autoPlay && isPlaying && !isPaused && slides.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-[#fa4454] transition-all duration-100 ease-linear"
            style={{
              width: `${((Date.now() % autoPlayInterval) / autoPlayInterval) * 100}%`
            }}
          />
        </div>
      )}
      
      {/* Slide Counter */}
      <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 text-white text-sm rounded-full">
        {currentSlide + 1} / {slides.length}
      </div>
    </div>
  );
};

export default HeroCarousel;
