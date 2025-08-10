import React, { useState } from 'react';
import { 
  Users, Trophy, TrendingUp, MapPin, Star, 
  ChevronRight, Award, Target, Shield
} from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';

// VLR.gg-style Mobile Team Card
export const MobileTeamCard = ({ team, onClick, showRank = false, rank }) => {
  const getRegionFlag = (region) => {
    const flags = {
      'NA': '🇺🇸',
      'EU': '🇪🇺',
      'APAC': '🌏',
      'CN': '🇨🇳',
      'SA': '🌎',
      'KR': '🇰🇷',
      'JP': '🇯🇵',
      'BR': '🇧🇷'
    };
    return flags[region] || '🌍';
  };

  const formatEarnings = (amount) => {
    if (!amount) return '$0';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-left hover:border-gray-300 dark:hover:border-gray-600 transition-colors touch-optimized mobile-focus-visible"
      aria-label={`View team details: ${team?.name || 'Unknown team'}${showRank && rank ? `, ranked ${rank}` : ''}`}
      role="button"
      tabIndex={0}
    >
      <div className="flex items-start justify-between">
        {/* Team Info */}
        <div className="flex items-start space-x-3 flex-1">
          {showRank && (
            <div className="flex-shrink-0 w-8 text-center">
              <span className="text-lg font-bold text-gray-500">#{rank}</span>
            </div>
          )}
          
          {/* Logo */}
          <div className="flex-shrink-0">
            {team.logo ? (
              <img 
                src={team.logo} 
                alt={team.name}
                className="w-12 h-12 object-contain rounded"
                onError={(e) => {
                  e.target.src = getImageUrl(null, 'team-logo');
                }}
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                <Users className="w-6 h-6 text-gray-500" />
              </div>
            )}
          </div>

          {/* Team Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-base truncate">{team.name}</h3>
              {team.verified && (
                <Shield className="w-4 h-4 text-blue-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
              {team.region && (
                <div className="flex items-center space-x-1">
                  <span>{getRegionFlag(team.region)}</span>
                  <span>{team.region}</span>
                </div>
              )}
              {team.rating && (
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-3 h-3" />
                  <span>{team.rating} pts</span>
                </div>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex items-center space-x-4 mt-2 text-xs">
              {team.wins !== undefined && team.losses !== undefined && (
                <div className="flex items-center space-x-1">
                  <Target className="w-3 h-3 text-gray-400" />
                  <span className="font-medium">{team.wins}W-{team.losses}L</span>
                </div>
              )}
              {team.total_earnings > 0 && (
                <div className="flex items-center space-x-1">
                  <Award className="w-3 h-3 text-gray-400" />
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatEarnings(team.total_earnings)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
      </div>

      {/* Active Roster Preview */}
      {team.players && team.players.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {team.players.slice(0, 5).map((player, index) => (
                <div 
                  key={player.id || index}
                  className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium"
                  style={{ zIndex: 5 - index }}
                >
                  {player.name ? player.name.charAt(0).toUpperCase() : '?'}
                </div>
              ))}
              {team.players.length > 5 && (
                <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-medium">
                  +{team.players.length - 5}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {team.players.length} players
            </span>
          </div>
        </div>
      )}
    </button>
  );
};

// Mobile Team List
export const MobileTeamList = ({ teams, onTeamClick, showRankings = false }) => {
  const [sortBy, setSortBy] = useState('rating');
  const [regionFilter, setRegionFilter] = useState('all');

  const regions = ['all', 'NA', 'EU', 'APAC', 'CN', 'SA'];

  const sortedTeams = [...teams].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'earnings':
        return (b.total_earnings || 0) - (a.total_earnings || 0);
      case 'alphabetical':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const filteredTeams = sortedTeams.filter(team => {
    if (regionFilter !== 'all' && team.region !== regionFilter) return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 space-y-3">
        {/* Region Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {regions.map(region => (
            <button
              key={region}
              onClick={() => setRegionFilter(region)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                regionFilter === region
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {region}
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {filteredTeams.length} teams
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="rating">By Rating</option>
            <option value="earnings">By Earnings</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Team Cards */}
      <div className="space-y-3">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team, index) => (
            <MobileTeamCard 
              key={team.id} 
              team={team} 
              onClick={() => onTeamClick(team)}
              showRank={showRankings}
              rank={index + 1}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No teams found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileTeamCard;