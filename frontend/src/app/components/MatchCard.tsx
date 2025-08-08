// src/components/MatchCard.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Match } from '@/lib/types';
import { formatDate, formatMatchTime } from '@/lib/utils';
import { ROUTES, MATCH_STATUS_COLORS } from '@/lib/constants';
import { getImageUrl } from '@/utils/imageUtils';

interface MatchCardProps {
  match: Match;
  compact?: boolean;
  showEvent?: boolean;
  showMaps?: boolean;
  className?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({
  match,
  compact = false,
  showEvent = true,
  showMaps = false,
  className = ''
}) => {
  // Determine winner for completed matches
  const team1Won = match.status === 'completed' && 
    match.team1_score > match.team2_score;
  const team2Won = match.status === 'completed' && 
    match.team2_score > match.team1_score;
  const isDraw = match.status === 'completed' && 
    match.team1_score === match.team2_score;

  // Format time display
  const getTimeDisplay = () => {
    switch (match.status) {
      case 'live':
        return 'LIVE';
      case 'scheduled':
        return formatMatchTime(match.scheduled_at);
      case 'completed':
        return match.ended_at ? formatDate(match.ended_at) : 'Completed';
      default:
        return match.status.toUpperCase();
    }
  };

  // Get status styling
  const getStatusColor = () => {
    return MATCH_STATUS_COLORS[match.status] || '#768894';
  };

  // Get team name with fallback
  const getTeamName = (team: any) => {
    return team?.name || 'TBD';
  };

  // Get team logo with fallback
  const getTeamLogo = (team: any) => {
    const logoSize = compact ? 20 : 32;
    
    if (team?.logo) {
      return (
        <div className={`${compact ? 'w-5 h-5' : 'w-8 h-8'} rounded-full overflow-hidden bg-[#0f1419] flex-shrink-0`}>
          <Image
            src={team.logo}
            alt={team.name || 'Team'}
            width={logoSize}
            height={logoSize}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = getImageUrl(null, 'team-logo');
            }}
          />
        </div>
      );
    }
    
    return (
      <div 
        className={`bg-[#0f1419] rounded-full flex items-center justify-center flex-shrink-0 ${
          compact ? 'w-5 h-5' : 'w-8 h-8'
        }`}
      >
        <span className={`font-bold text-white ${compact ? 'text-xs' : 'text-sm'}`}>
          {getTeamName(team).charAt(0)}
        </span>
      </div>
    );
  };

  if (compact) {
    return (
      <Link 
        href={`${ROUTES.MATCHES}/${match.id}`} 
        className={`block hover:bg-[#20303d] transition-all duration-200 touch-optimized active:scale-[0.98] ${className}`}
      >
        <div className="flex items-center py-3 px-4 text-sm min-h-[72px]">
          {/* Status - Enhanced for VLR.gg mobile pattern */}
          <div className="w-16 min-w-16 text-xs flex flex-col items-center">
            {match.status === 'live' ? (
              <div className="flex flex-col items-center">
                <span 
                  className="px-2 py-1 rounded-lg text-xs font-bold text-white animate-pulse"
                  style={{ backgroundColor: getStatusColor() }}
                >
                  LIVE
                </span>
                <div className="w-2 h-2 bg-red-500 rounded-full mt-1 animate-pulse"></div>
              </div>
            ) : (
              <div className="text-center">
                <span className="text-[#768894] font-medium">
                  {getTimeDisplay()}
                </span>
                {match.status === 'scheduled' && match.scheduled_at && (
                  <div className="text-xs text-[#fa4454] mt-0.5">
                    {(() => {
                      const date = new Date(match.scheduled_at);
                      return !isNaN(date.getTime()) ? date.toLocaleDateString([], { 
                        month: 'short', 
                        day: 'numeric' 
                      }) : 'TBD';
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Teams - Enhanced VLR.gg mobile layout */}
          <div className="flex-1 flex items-center justify-center px-3">
            <div className="flex items-center space-x-2 flex-1 justify-end">
              <span className={`text-sm font-semibold truncate ${
                team1Won ? 'text-white' : team2Won ? 'text-[#768894]' : 'text-white'
              }`}>
                {getTeamName(match.team1)}
              </span>
              <div className="flex-shrink-0">
                {getTeamLogo(match.team1)}
              </div>
            </div>

            <div className="mx-4 text-center min-w-[48px]">
              {match.status === 'live' || match.status === 'completed' ? (
                <div className="flex items-center justify-center space-x-1">
                  <span className={`font-bold text-lg ${
                    team1Won ? 'text-white' : 'text-[#768894]'
                  }`}>
                    {match.team1_score}
                  </span>
                  <span className="text-[#768894] text-sm">:</span>
                  <span className={`font-bold text-lg ${
                    team2Won ? 'text-white' : 'text-[#768894]'
                  }`}>
                    {match.team2_score}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-xs text-[#768894] font-medium">VS</div>
                  {match.format && (
                    <div className="text-xs text-[#fa4454] mt-0.5">
                      {match.format.toUpperCase()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 flex-1">
              <div className="flex-shrink-0">
                {getTeamLogo(match.team2)}
              </div>
              <span className={`text-sm font-semibold truncate ${
                team2Won ? 'text-white' : team1Won ? 'text-[#768894]' : 'text-white'
              }`}>
                {getTeamName(match.team2)}
              </span>
            </div>
          </div>

          {/* Event - Enhanced for mobile */}
          {showEvent && (
            <div className="w-24 min-w-24 text-right">
              <div className="text-xs text-[#768894] truncate font-medium">
                {match.event?.name || match.tournament?.name || 'Casual'}
              </div>
              {match.stream_url && (
                <div className="flex items-center justify-end mt-0.5">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                  <span className="text-xs text-[#fa4454] font-semibold">LIVE</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    );
  }

  // Full match card - Enhanced for mobile
  return (
    <Link 
      href={`${ROUTES.MATCHES}/${match.id}`} 
      className={`block bg-[#1a2332] border border-[#2b3d4d] rounded-xl hover:bg-[#20303d] hover:border-[#fa4454] transition-all duration-200 mb-3 touch-optimized active:scale-[0.98] mobile-card ${className}`}
    >
      <div className="flex items-center py-4 px-4 min-h-[88px]">
        
        {/* Match Status */}
        <div className="w-16 min-w-16 text-center">
          {match.status === 'live' ? (
            <div className="flex flex-col items-center">
              <span 
                className="px-2 py-1 rounded text-xs font-bold text-white"
                style={{ backgroundColor: getStatusColor() }}
              >
                LIVE
              </span>
              {match.live_stats?.viewer_count && (
                <span className="text-xs text-[#768894] mt-1">
                  {match.live_stats.viewer_count} viewers
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#768894]">
              {getTimeDisplay()}
            </div>
          )}
        </div>

        {/* Team 1 */}
        <div className="flex-1 flex items-center justify-end mr-4">
          <div className="text-right mr-3">
            <div className={`font-medium ${
              team1Won ? 'text-white' : team2Won ? 'text-[#768894]' : 'text-white'
            }`}>
              {getTeamName(match.team1)}
            </div>
            {match.team1.country_code && (
              <div className="text-xs text-[#768894] mt-0.5">
                {match.team1.country_code}
              </div>
            )}
          </div>
          {getTeamLogo(match.team1)}
        </div>

        {/* Score/VS */}
        <div className="mx-6 text-center min-w-[80px]">
          {match.status === 'live' || match.status === 'completed' ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-2">
                <span className={`text-2xl font-bold ${
                  team1Won ? 'text-white' : 'text-[#768894]'
                }`}>
                  {match.team1_score}
                </span>
                <span className="text-[#768894] text-lg">:</span>
                <span className={`text-2xl font-bold ${
                  team2Won ? 'text-white' : 'text-[#768894]'
                }`}>
                  {match.team2_score}
                </span>
              </div>
              {showMaps && match.maps && match.maps.length > 0 && (
                <div className="flex items-center space-x-1 mt-2">
                  {match.maps.slice(0, 3).map((map, index) => (
                    <div 
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        map.status === 'completed' 
                          ? map.winner?.id === match.team1.id 
                            ? 'bg-[#4ade80]' 
                            : 'bg-[#ef4444]'
                          : 'bg-[#2b3d4d]'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[#768894]">
              <div className="text-lg font-medium">VS</div>
              <div className="text-xs mt-1">
                {match.format?.toUpperCase() || 'BO3'}
              </div>
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className="flex-1 flex items-center ml-4">
          {getTeamLogo(match.team2)}
          <div className="text-left ml-3">
            <div className={`font-medium ${
              team2Won ? 'text-white' : team1Won ? 'text-[#768894]' : 'text-white'
            }`}>
              {getTeamName(match.team2)}
            </div>
            {match.team2.country_code && (
              <div className="text-xs text-[#768894] mt-0.5">
                {match.team2.country_code}
              </div>
            )}
          </div>
        </div>

        {/* Event & Additional Info */}
        <div className="w-32 min-w-32 text-right ml-4">
          {showEvent && (
            <div className="text-xs text-[#768894] truncate">
              {match.event?.name || match.tournament?.name || 'Casual Match'}
            </div>
          )}
          <div className="text-xs text-[#768894] mt-1">
            {match.format?.toUpperCase() || 'BO3'}
          </div>
          {match.stream_url && (
            <div className="flex items-center justify-end mt-1">
              <svg className="w-3 h-3 text-[#fa4454] mr-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.3 10.7l-7.9-7.9c-.4-.4-1-.4-1.4 0L4.3 10.5c-.4.4-.4 1 0 1.4l7.9 7.9c.4.4 1 .4 1.4 0l7.7-7.7c.4-.4.4-1 0-1.4z"/>
              </svg>
              <span className="text-xs text-[#fa4454]">LIVE</span>
            </div>
          )}
        </div>

        {/* Live Indicator */}
        {match.status === 'live' && (
          <div className="ml-2">
            <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Maps Section (if showing maps and available) */}
      {showMaps && match.maps && match.maps.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            {match.maps.map((map, index) => (
              <div 
                key={index}
                className="flex items-center space-x-2 bg-[#0f1419] border border-[#2b3d4d] rounded px-2 py-1 text-xs whitespace-nowrap"
              >
                <span className="text-white">{map.name}</span>
                {map.status === 'completed' && (
                  <span className={`font-bold ${
                    map.team1_score > map.team2_score ? 'text-[#4ade80]' : 'text-[#ef4444]'
                  }`}>
                    {map.team1_score}-{map.team2_score}
                  </span>
                )}
                {map.status === 'in_progress' && (
                  <span className="text-[#fa4454] font-bold">LIVE</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Link>
  );
};

export default MatchCard;
