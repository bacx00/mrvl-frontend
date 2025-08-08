// src/components/EventCard.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Event } from '@/lib/types';
import { formatDate, formatCurrency, getCountdown } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';
import { getImageUrl } from '@/utils/imageUtils';

interface EventCardProps {
  event: Event;
  compact?: boolean;
  showPrizePool?: boolean;
  showTeams?: boolean;
  showCountdown?: boolean;
  showStatus?: boolean;
  className?: string;
  tabletLayout?: 'standard' | 'enhanced' | 'compact';
  tabletMultiColumn?: boolean;
}

const EventCard: React.FC<EventCardProps> = ({
  event,
  compact = false,
  showPrizePool = true,
  showTeams = true,
  showCountdown = true,
  showStatus = true,
  className = '',
  tabletLayout = 'standard',
  tabletMultiColumn = false
}) => {
  const [countdown, setCountdown] = useState<string>('');
  const [imageError, setImageError] = useState(false);

  // Update countdown every second for upcoming events
  useEffect(() => {
    if (event.status !== 'upcoming' || !showCountdown) return;

    const updateCountdown = () => {
      setCountdown(getCountdown(event.start_date));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [event.start_date, event.status, showCountdown]);

  // Get status styling
  const getStatusColor = () => {
    switch (event.status) {
      case 'ongoing':
        return '#4ade80';
      case 'upcoming':
        return '#f59e0b';
      case 'completed':
        return '#768894';
      case 'cancelled':
        return '#ef4444';
      default:
        return '#768894';
    }
  };

  // Get status label
  const getStatusLabel = () => {
    switch (event.status) {
      case 'ongoing':
        return 'LIVE';
      case 'upcoming':
        return 'UPCOMING';
      case 'completed':
        return 'COMPLETED';
      case 'cancelled':
        return 'CANCELLED';
      default:
        return event.status.toUpperCase();
    }
  };

  // Format date range with proper validation
  const formatDateRange = () => {
    if (!event.start_date) return 'TBD';
    
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    
    // Check if dates are valid
    if (isNaN(startDate.getTime())) return 'TBD';
    if (!event.end_date || isNaN(endDate.getTime())) {
      return formatDate(event.start_date);
    }
    
    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDate(event.start_date);
    }
    
    return `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`;
  };

  // Tablet Enhanced Layout
  if (tabletLayout === 'enhanced' && tabletMultiColumn) {
    return (
      <Link 
        href={`${ROUTES.EVENTS}/${event.id}`}
        className={`block tablet-tournament-card-enhanced touch-optimized ${className}`}
      >
        <div className="tablet-tournament-card-header">
          {/* Tournament Logo */}
          {event.logo && !imageError && (
            <div className="tablet-tournament-logo">
              <Image
                src={event.logo}
                alt={event.name}
                width={32}
                height={32}
                className="object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getImageUrl(null, 'event-banner');
                  setImageError(true);
                }}
              />
            </div>
          )}
          
          {/* Status Badge */}
          {showStatus && (
            <div className={`tablet-tournament-status ${event.status}`}>
              {event.status === 'ongoing' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
              )}
              {getStatusLabel()}
            </div>
          )}
        </div>
        
        <div className="tablet-tournament-card-body">
          <h3 className="tablet-tournament-title">{event.name}</h3>
          
          <div className="tablet-tournament-meta">
            <div className="tablet-tournament-date">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {formatDateRange()}
            </div>
            
            {showPrizePool && event.prize_pool > 0 && (
              <div className="tablet-tournament-prize">
                {formatCurrency(event.prize_pool, event.currency)}
              </div>
            )}
          </div>
          
          {/* Teams Preview */}
          {showTeams && event.teams && event.teams.length > 0 && (
            <div className="tablet-tournament-teams-preview">
              <div className="tablet-tournament-teams-count">
                {event.teams.length} Teams
              </div>
              <div className="tablet-tournament-teams-logos">
                {event.teams.slice(0, 8).map((team) => (
                  <div key={team.id} className="tablet-tournament-team-logo">
                    {team.logo ? (
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={28}
                        height={28}
                        className="object-contain rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getImageUrl(null, 'team-logo');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 rounded flex items-center justify-center text-xs font-bold">
                        {team.name.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
                {event.teams.length > 8 && (
                  <div className="tablet-tournament-team-logo bg-gray-100 flex items-center justify-center">
                    <span className="text-xs font-bold text-gray-500">
                      +{event.teams.length - 8}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Link>
    );
  }

  if (compact) {
    return (
      <Link 
        href={`${ROUTES.EVENTS}/${event.id}`}
        className={`block hover:bg-[#20303d] transition-all duration-200 touch-optimized active:scale-[0.98] tablet:hover:shadow-tablet-card tablet:min-h-[80px] ${className}`}
      >
        <div className="flex items-center space-x-3 p-4 min-h-[72px] tablet:p-6"> {/* VLR.gg minimum touch target */}
          {event.logo && !imageError && (
            <div className="w-14 h-14 tablet:w-16 tablet:h-16 relative flex-shrink-0 rounded-lg overflow-hidden bg-[#2a2a35]">
              <Image
                src={event.logo}
                alt={event.name}
                fill
                className="object-cover"
                sizes="(min-width: 768px) 64px, 56px"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = getImageUrl(null, 'event-banner');
                  setImageError(true);
                }}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {/* VLR.gg style information hierarchy */}
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-base tablet:text-lg font-semibold text-white truncate pr-2 leading-tight">
                {event.name}
              </h3>
              {showStatus && (
                <span 
                  className={`px-2 py-1 tablet:px-3 tablet:py-1.5 rounded-lg text-xs tablet:text-sm font-bold text-white flex-shrink-0 ${
                    event.status === 'ongoing' ? 'animate-pulse' : ''
                  }`}
                  style={{ backgroundColor: getStatusColor() }}
                >
                  {getStatusLabel()}
                </span>
              )}
            </div>
            
            {/* Time-sensitive information first (VLR.gg pattern) */}
            <div className="text-sm tablet:text-base text-[#768894] mb-1 tablet:mb-2">
              {formatDateRange()}
            </div>
            
            {/* Prize pool and region */}
            <div className="flex items-center justify-between tablet:flex-col tablet:items-start tablet:gap-2">
              {showPrizePool && event.prize_pool > 0 && (
                <div className="text-sm tablet:text-base text-[#fa4454] font-semibold">
                  {formatCurrency(event.prize_pool, event.currency)}
                </div>
              )}
              {event.region && (
                <div className="text-xs tablet:text-sm text-[#768894] uppercase font-medium bg-[#0f1419] px-2 py-1 rounded">
                  {event.region}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`${ROUTES.EVENTS}/${event.id}`}
      className={`block group touch-optimized ${className}`}
    >
      <article className="bg-[#1a2332] border border-[#2b3d4d] rounded-xl overflow-hidden transition-all duration-300 hover:border-[#fa4454] hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] mobile-card tablet:hover:shadow-tablet-hover tablet:rounded-lg tablet:min-h-[320px]">
        
        {/* Event Banner/Logo */}
        {(event.banner || event.logo) && !imageError && (
          <div className="relative h-40 overflow-hidden">
            <Image
              src={event.banner || event.logo!}
              alt={event.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            
            {/* Status Badge */}
            {showStatus && (
              <div className="absolute top-3 left-3">
                <span 
                  className="px-2 py-1 rounded text-xs font-bold text-white flex items-center space-x-1"
                  style={{ backgroundColor: getStatusColor() }}
                >
                  {event.status === 'ongoing' && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  )}
                  <span>{getStatusLabel()}</span>
                </span>
              </div>
            )}

            {/* Prize Pool Badge */}
            {showPrizePool && event.prize_pool > 0 && (
              <div className="absolute top-3 right-3">
                <div className="bg-black/70 px-2 py-1 rounded">
                  <div className="text-xs text-[#fa4454] font-bold">
                    {formatCurrency(event.prize_pool, event.currency)}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          
          {/* Event Name */}
          <h2 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-[#fa4454] transition-colors">
            {event.name}
          </h2>
          
          {/* Description */}
          {event.description && (
            <p className="text-sm text-[#768894] mb-3 line-clamp-2">
              {event.description}
            </p>
          )}
          
          {/* Event Details */}
          <div className="space-y-2 mb-4">
            
            {/* Date Range */}
            <div className="flex items-center space-x-2 text-sm">
              <svg className="w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-white">{formatDateRange()}</span>
            </div>
            
            {/* Location */}
            {event.location && (
              <div className="flex items-center space-x-2 text-sm">
                <svg className="w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white">{event.location}</span>
              </div>
            )}
            
            {/* Organizer */}
            {event.organizer && (
              <div className="flex items-center space-x-2 text-sm">
                <svg className="w-4 h-4 text-[#768894]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h10M7 15h10" />
                </svg>
                <span className="text-white">{event.organizer.name}</span>
              </div>
            )}
          </div>
          
          {/* Countdown Timer */}
          {showCountdown && event.status === 'upcoming' && countdown && countdown !== 'Started' && (
            <div className="bg-[#0f1419] border border-[#2b3d4d] rounded p-3 mb-4">
              <div className="text-center">
                <div className="text-xs text-[#768894] mb-1">Starts in</div>
                <div className="text-lg font-bold text-[#fa4454]">{countdown}</div>
              </div>
            </div>
          )}
          
          {/* Teams Preview */}
          {showTeams && event.teams && event.teams.length > 0 && (
            <div className="mb-4">
              <div className="text-xs text-[#768894] mb-2">
                {event.teams.length} Teams Participating
              </div>
              <div className="flex items-center space-x-2 overflow-x-auto">
                {event.teams.slice(0, 6).map((team) => (
                  <div key={team.id} className="flex-shrink-0">
                    {team.logo ? (
                      <div className="w-8 h-8 relative">
                        <Image
                          src={team.logo}
                          alt={team.name}
                          fill
                          className="object-contain"
                          sizes="32px"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getImageUrl(null, 'team-logo');
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-8 h-8 bg-[#2b3d4d] rounded flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {team.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {event.teams.length > 6 && (
                  <div className="w-8 h-8 bg-[#2b3d4d] rounded flex items-center justify-center">
                    <span className="text-xs font-bold text-[#768894]">
                      +{event.teams.length - 6}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Footer Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-[#768894]">
              <span className="capitalize">{(event.format || '').toString().replace('_', ' ')}</span>
              {event.region && (
                <>
                  <span>•</span>
                  <span className="uppercase">{event.region}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Stream Links */}
              {event.streams && event.streams.length > 0 && (
                <div className="flex items-center space-x-1">
                  {event.streams.slice(0, 2).map((stream) => (
                    <a
                      key={stream.id}
                      href={stream.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 text-[#768894] hover:text-[#fa4454] transition-colors"
                      title={`Watch on ${stream.platform}`}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    </a>
                  ))}
                </div>
              )}
              
              {/* Registration Button */}
              {event.status === 'upcoming' && event.registration_url && (
                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1 bg-[#fa4454] hover:bg-[#e03e4e] text-white text-xs font-medium rounded transition-colors"
                >
                  Register
                </a>
              )}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default EventCard;
