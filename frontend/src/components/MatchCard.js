import React from 'react';
import { TeamLogo, getCountryFlag, getImageUrl } from '../utils/imageUtils';

function MatchCard({ match, navigateTo, isCompact = false }) {
  // Ensure match data is properly structured
  if (!match) return null;
  
  // Normalize maps_data to always be an array
  if (match.maps_data && !Array.isArray(match.maps_data)) {
    match.maps_data = [];
  }
  
  // Determine match winner
  const isTeam1Winner = match.status === 'completed' && match.team1_score > match.team2_score;
  const isTeam2Winner = match.status === 'completed' && match.team2_score > match.team1_score;
  
  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Get status display
  const getStatusDisplay = () => {
    switch (match.status) {
      case 'live':
        return (
          <div className="flex items-center justify-center">
            <span className="bg-red-600 text-white px-3 py-1 text-xs font-bold rounded-full flex items-center animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full mr-1.5"></span>
              LIVE
            </span>
          </div>
        );
      case 'completed':
        return (
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              <span className={isTeam1Winner ? 'text-green-600 dark:text-green-400' : ''}>
                {match.team1_score || 0}
              </span>
              {' - '}
              <span className={isTeam2Winner ? 'text-green-600 dark:text-green-400' : ''}>
                {match.team2_score || 0}
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {match.format || 'BO3'} FINAL
            </div>
          </div>
        );
      case 'upcoming':
      default:
        return (
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 dark:text-white">
              {formatTime(match.scheduled_at)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500">
              {formatDate(match.scheduled_at)}
            </div>
          </div>
        );
    }
  };

  // VLR.gg-style match card
  if (isCompact) {
    // Compact version for sidebars
    return (
      <div 
        className="p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
        onClick={() => navigateTo && navigateTo('match-detail', { id: match.id })}
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-white">
              {match.team1?.short_name || match.team1?.name || 'TEAM'}
            </div>
            <div className="font-medium text-gray-900 dark:text-white">
              {match.team2?.short_name || match.team2?.name || 'TEAM'}
            </div>
          </div>
          <div className="text-right">
            {match.status === 'live' ? (
              <span className="text-red-600 font-bold text-xs">LIVE</span>
            ) : match.status === 'completed' ? (
              <div className="text-center">
                <div className="font-bold text-lg">
                  {match.team1_score || 0}-{match.team2_score || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {match.format || 'BO3'}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-500">
                {formatTime(match.scheduled_at)}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Full match card
  return (
    <div 
      className="card hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigateTo && navigateTo('match-detail', { id: match.id })}
    >
      <div className="p-4">
        {/* Event and format info - VLR.gg Style with Event Image */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {/* Event Image - VLR.gg Style */}
            {match.event?.logo && (
              <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                <img 
                  src={getImageUrl(match.event.logo)} 
                  alt={match.event.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getImageUrl(null, 'event-banner'); }}
                />
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-500">
              {match.event?.name || ''}
            </span>
            {match.event?.tier && (
              <span className={`px-1.5 py-0.5 text-xs font-bold rounded border ${
                match.event.tier === 'S' ? 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-200' :
                match.event.tier === 'A' ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-200' :
                'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-200'
              }`}>
                {match.event.tier}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-500">
            {match.format || 'BO3'}
          </span>
        </div>

        {/* Teams and score */}
        <div className="flex items-center justify-between space-x-4">
          {/* Team 1 */}
          <div className={`flex-1 min-w-0 ${isTeam1Winner ? 'opacity-100' : match.status === 'completed' ? 'opacity-50' : ''}`}>
            <div className="flex items-center space-x-3">
              <TeamLogo team={match.team1} size="w-10 h-10" className="flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <span 
                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo && navigateTo('team-detail', { id: match.team1?.id });
                    }}
                    title={match.team1?.name || match.team1?.short_name || 'TEAM'}
                  >
                    {match.team1?.name || match.team1?.short_name || 'TEAM'}
                  </span>
                  {match.team1?.country && (
                    <span className="text-sm flex-shrink-0">{getCountryFlag(match.team1.country)}</span>
                  )}
                </div>
                {match.team1?.short_name && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    {match.team1.short_name}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Score/Status */}
          <div className="px-4 flex-shrink-0">
            {getStatusDisplay()}
          </div>

          {/* Team 2 */}
          <div className={`flex-1 min-w-0 ${isTeam2Winner ? 'opacity-100' : match.status === 'completed' ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-end space-x-3">
              <div className="text-right min-w-0 flex-1">
                <div className="flex items-center justify-end space-x-2">
                  {match.team2?.country && (
                    <span className="text-sm flex-shrink-0">{getCountryFlag(match.team2.country)}</span>
                  )}
                  <span 
                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer truncate"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo && navigateTo('team-detail', { id: match.team2?.id });
                    }}
                    title={match.team2?.name || match.team2?.short_name || 'TEAM'}
                  >
                    {match.team2?.name || match.team2?.short_name || 'TEAM'}
                  </span>
                </div>
                {match.team2?.short_name && (
                  <div className="text-xs text-gray-500 dark:text-gray-500 truncate">
                    {match.team2.short_name}
                  </div>
                )}
              </div>
              <TeamLogo team={match.team2} size="w-10 h-10" className="flex-shrink-0" />
            </div>
          </div>
        </div>

        {/* Additional info */}
        {match.status === 'live' && match.viewers && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500 dark:text-gray-500">
              <span>{match.viewers.toLocaleString()} viewers</span>
              {match.stream_url && (
                <a 
                  href={match.stream_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-red-600 dark:text-red-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {(() => {
                    try {
                      const urlObj = new URL(match.stream_url);
                      const hostname = urlObj.hostname.toLowerCase();
                      
                      if (hostname.includes('twitch.tv')) {
                        const pathParts = urlObj.pathname.split('/').filter(p => p);
                        return pathParts[0] || 'Twitch';
                      } else if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
                        const pathParts = urlObj.pathname.split('/').filter(p => p);
                        if (pathParts.includes('c') && pathParts[pathParts.indexOf('c') + 1]) {
                          return pathParts[pathParts.indexOf('c') + 1];
                        } else if (pathParts.includes('channel') && pathParts[pathParts.indexOf('channel') + 1]) {
                          return pathParts[pathParts.indexOf('channel') + 1];
                        } else if (pathParts[0]?.startsWith('@')) {
                          return pathParts[0].replace('@', '');
                        }
                        return 'YouTube';
                      } else if (hostname.includes('kick.com')) {
                        const pathParts = urlObj.pathname.split('/').filter(p => p);
                        return pathParts[0] || 'Kick';
                      } else {
                        return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
                      }
                    } catch {
                      return 'Watch Stream';
                    }
                  })()}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Map score for completed matches */}
        {match.status === 'completed' && match.maps_data && Array.isArray(match.maps_data) && match.maps_data.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center space-x-2 text-xs">
              {match.maps_data.map((map, index) => (
                <div 
                  key={index} 
                  className={`px-2 py-1 rounded ${
                    map.winner === match.team1_id 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                  }`}
                >
                  {map.map_name}: {map.team1_score}-{map.team2_score}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchCard;