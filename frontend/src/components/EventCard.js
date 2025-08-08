import React from 'react';
import { getEventLogoUrl, getCountryFlag } from '../utils/imageUtils';

function EventCard({ event, navigateTo }) {
  // Format date range
  const formatDateRange = (startDate, endDate) => {
    if (!startDate) return 'TBD';
    
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;
    
    const formatOptions = { month: 'short', day: 'numeric' };
    
    if (!end || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    
    // Same month
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}—${end.getDate()}`;
    }
    
    // Different months
    return `${start.toLocaleDateString('en-US', formatOptions)}—${end.toLocaleDateString('en-US', formatOptions)}`;
  };

  // Format prize pool
  const formatPrizePool = (amount, currency = 'USD') => {
    if (!amount || amount === 0) return 'TBD';
    
    // For large amounts, format with K
    if (amount >= 1000) {
      const formatted = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1);
      return `$${formatted}K ${currency}`;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status style
  const getStatusStyle = (status) => {
    switch (status) {
      case 'ongoing':
      case 'live':
        return 'text-green-600 dark:text-green-400 font-semibold';
      case 'upcoming':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-gray-500 dark:text-gray-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  // Get tier badge style
  const getTierBadgeStyle = (tier) => {
    switch (tier) {
      case 'S':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-200';
      case 'A':
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-200';
      case 'B':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900/20 dark:text-gray-200';
    }
  };

  // VLR.gg style event card
  return (
    <div 
      className="card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigateTo && navigateTo('event-detail', { id: event.id })}
    >
      <div className="p-4">
        {/* Event Header with Logo */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Event Logo - VLR.gg style small logo */}
            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-700">
              <img 
                src={getEventLogoUrl(event)} 
                alt={event.name}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-lg font-bold text-gray-500 dark:text-gray-400">?</div>';
                }}
              />
            </div>
            
            <div className="min-w-0 flex-1">
              {/* Event Name */}
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {event.name}
              </h3>
              
              {/* Event Type and Tier */}
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {event.type || 'Tournament'}
                </span>
                {event.tier && (
                  <span className={`px-1.5 py-0.5 text-xs font-bold rounded border ${getTierBadgeStyle(event.tier)}`}>
                    {event.tier}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Region Flag */}
          {event.region && (
            <span className="text-lg ml-2" title={event.region}>
              {getCountryFlag(event.region)}
            </span>
          )}
        </div>

        {/* Event Details Grid - VLR.gg style */}
        <div className="space-y-2">
          {/* Status and Dates */}
          <div className="flex items-center justify-between text-sm">
            <span className={getStatusStyle(event.status)}>
              {event.status?.toUpperCase() || 'UPCOMING'}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {formatDateRange(event.start_date, event.end_date)}
            </span>
          </div>

          {/* Prize Pool */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Prize Pool</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatPrizePool(event.prize_pool, event.currency)}
            </span>
          </div>

          {/* Teams */}
          {(event.max_teams || event.current_teams !== undefined) && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Teams</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {event.current_teams || 0}/{event.max_teams || '?'}
              </span>
            </div>
          )}

          {/* Location */}
          {event.location && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Location</span>
              <span className="text-gray-700 dark:text-gray-300 truncate ml-2" title={event.location}>
                {event.location}
              </span>
            </div>
          )}
        </div>

        {/* Bracket Progress Bar - for ongoing events */}
        {event.status === 'ongoing' && event.bracket_stage && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Current Stage</span>
              <span className="font-medium text-red-600 dark:text-red-400">
                {event.bracket_stage}
              </span>
            </div>
          </div>
        )}

        {/* Featured Teams Preview - show top teams */}
        {event.teams && event.teams.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {event.teams.slice(0, 4).map((team, index) => (
                <div 
                  key={team.id || index}
                  className="w-6 h-6 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden"
                  title={team.name}
                >
                  {team.logo ? (
                    <img 
                      src={getImageUrl(team.logo, 'team-logo')} 
                      alt={team.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = getImageUrl(null, 'team-logo'); }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400">
                      {team.short_name?.substring(0, 2) || team.name?.substring(0, 2) || '??'}
                    </div>
                  )}
                </div>
              ))}
              {event.teams.length > 4 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{event.teams.length - 4}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EventCard;