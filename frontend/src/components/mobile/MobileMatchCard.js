import React, { useState } from 'react';
import { 
  Calendar, Clock, MapPin, ChevronRight, 
  Shield, Zap, Heart, Play, Users, Trophy, Star
} from 'lucide-react';
import { SwipeableItem, TouchFeedback, useLongPress, hapticFeedback } from './MobileGestures';
import { TeamLogo, getCountryFlag } from '../../utils/imageUtils';

// VLR.gg-style Mobile Match Card with Information Density
export const MobileMatchCard = ({ 
  match, 
  onClick, 
  onFavorite, 
  onShare, 
  isFavorited = false,
  showActions = true,
  compact = false 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isLive = match.status === 'live';
  const isUpcoming = match.status === 'upcoming';
  const isCompleted = match.status === 'completed';

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getRoleIcon = (role) => {
    switch(role) {
      case 'Vanguard': return Shield;
      case 'Duelist': return Zap;
      case 'Strategist': return Heart;
      default: return Users;
    }
  };

  // Long press for additional options
  const longPressProps = useLongPress(
    () => {
      hapticFeedback.medium();
      setIsExpanded(!isExpanded);
    },
    500
  );

  // Swipe actions
  const handleSwipeLeft = () => {
    if (onFavorite) {
      hapticFeedback.light();
      onFavorite(match);
    }
  };

  const handleSwipeRight = () => {
    if (onShare) {
      hapticFeedback.light();
      onShare(match);
    }
  };

  const leftAction = onFavorite && (
    <div className="flex items-center justify-center w-16 h-full bg-yellow-500 text-white">
      <Star className={`w-6 h-6 ${isFavorited ? 'fill-current' : ''}`} />
    </div>
  );

  const rightAction = onShare && (
    <div className="flex items-center justify-center w-16 h-full bg-blue-500 text-white">
      <ChevronRight className="w-6 h-6" />
    </div>
  );

  const MatchContent = () => (
    <TouchFeedback 
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-3 touch-optimized"
      {...longPressProps}
    >
      {/* Match Header */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs">
          <Trophy className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-400">
            {match.event?.name || 'Tournament'}
          </span>
          {match.stage && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600 dark:text-gray-400">{match.stage}</span>
            </>
          )}
        </div>
        {isLive && (
          <div className="flex items-center space-x-1 text-red-500 dark:text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold">LIVE</span>
          </div>
        )}
      </div>

      {/* Match Content */}
      <button 
        onClick={onClick}
        className="w-full px-4 py-3 text-left focus:outline-none focus:bg-gray-50 dark:focus:bg-gray-700/50 transition-colors mobile-focus-visible"
        aria-label={`View match details: ${match.team1?.name || 'TBD'} vs ${match.team2?.name || 'TBD'}`}
        role="button"
        tabIndex={0}
      >
        {/* Teams */}
        <div className="space-y-3">
          {/* Team 1 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {match.team1?.logo ? (
                <img 
                  src={match.team1.logo} 
                  alt={match.team1.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div>
                <div className="font-semibold text-sm">{match.team1?.name || 'TBD'}</div>
                {match.team1?.region && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {match.team1.region}
                  </div>
                )}
              </div>
            </div>
            {match.team1_score !== undefined && (
              <div className={`text-2xl font-bold ${
                match.team1_score > match.team2_score ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {match.team1_score}
              </div>
            )}
          </div>

          {/* VS Divider or Match Time */}
          <div className="flex items-center justify-center">
            {isUpcoming ? (
              <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {formatDate(match.scheduled_at)} • {formatTime(match.scheduled_at)}
                </span>
              </div>
            ) : (
              <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {isLive && match.match_timer ? match.match_timer : 'VS'}
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              {match.team2?.logo ? (
                <img 
                  src={match.team2.logo} 
                  alt={match.team2.name}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                  <Users className="w-4 h-4 text-gray-500" />
                </div>
              )}
              <div>
                <div className="font-semibold text-sm">{match.team2?.name || 'TBD'}</div>
                {match.team2?.region && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {match.team2.region}
                  </div>
                )}
              </div>
            </div>
            {match.team2_score !== undefined && (
              <div className={`text-2xl font-bold ${
                match.team2_score > match.team1_score ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'
              }`}>
                {match.team2_score}
              </div>
            )}
          </div>
        </div>

        {/* Match Details for Live/Completed */}
        {(isLive || isCompleted) && match.maps && match.maps.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Map {match.current_map || 1} of {match.best_of || 3}
              </span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        )}
      </button>

      {/* Expandable Details (for tablets) */}
      {isExpanded && match.maps && (
        <div className="px-4 pb-3 border-t border-gray-200 dark:border-gray-700">
          <div className="pt-3 space-y-2">
            {match.maps.map((map, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {map.name}
                </span>
                <span className="font-medium">
                  {map.team1_score} - {map.team2_score}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </TouchFeedback>
  );

  // Return with or without swipe actions
  if (showActions && (onFavorite || onShare)) {
    return (
      <SwipeableItem
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        leftAction={leftAction}
        rightAction={rightAction}
      >
        <MatchContent />
      </SwipeableItem>
    );
  }

  return <MatchContent />;
};

// Mobile Match List with Filters
export const MobileMatchList = ({ matches, onMatchClick, showFilters = true }) => {
  const [filter, setFilter] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'live', label: 'Live' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Results' }
  ];

  const regions = ['all', 'NA', 'EU', 'APAC', 'CN', 'SA'];

  const filteredMatches = matches.filter(match => {
    if (filter !== 'all' && match.status !== filter) return false;
    if (selectedRegion !== 'all' && match.event?.region !== selectedRegion) return false;
    return true;
  });

  return (
    <div>
      {showFilters && (
        <div className="mb-4 space-y-3">
          {/* Status Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === f.id
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Region Filters */}
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedRegion === region
                    ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Match Cards */}
      <div>
        {filteredMatches.length > 0 ? (
          filteredMatches.map(match => (
            <MobileMatchCard 
              key={match.id} 
              match={match} 
              onClick={() => onMatchClick(match)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No matches found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileMatchCard;