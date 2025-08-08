import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getImageUrl, getCountryFlag, getCountryName } from '../../utils/imageUtils';

/**
 * Enhanced Team Selection Component
 * Features:
 * - Search functionality
 * - Region-based organization
 * - Team logo previews with fallbacks
 * - Popular/recently selected teams
 * - Hover effects and selection indicators
 * - Loading states and data caching
 * - Accessibility support
 */
const TeamSelector = ({ 
  teams = [], 
  selectedTeamId = null, 
  onTeamSelect, 
  disabled = false,
  placeholder = "Select a team...",
  showRegions = true,
  showSearch = true,
  showPopular = true,
  showRecent = true,
  className = "",
  dropdownClassName = "",
  loading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [recentTeams, setRecentTeams] = useState([]);
  const [popularTeams, setPopularTeams] = useState([]);
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Get recently selected teams from localStorage
  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('mrvl_recent_teams') || '[]');
      setRecentTeams(recent.slice(0, 5)); // Show last 5 teams
    } catch (error) {
      console.error('Failed to load recent teams:', error);
      setRecentTeams([]);
    }
  }, []);

  // Organize teams by region
  const teamsByRegion = useMemo(() => {
    if (!Array.isArray(teams)) return {};
    
    const organized = {};
    teams.forEach(team => {
      const region = team.region || 'Other';
      if (!organized[region]) {
        organized[region] = [];
      }
      organized[region].push(team);
    });

    // Sort teams within each region
    Object.keys(organized).forEach(region => {
      organized[region].sort((a, b) => a.name.localeCompare(b.name));
    });

    return organized;
  }, [teams]);

  // Get popular teams (could be based on actual data or hardcoded for now)
  useEffect(() => {
    if (Array.isArray(teams) && teams.length > 0) {
      // For now, use the first few teams as "popular" - this would typically come from backend analytics
      const popular = teams
        .filter(team => team.is_popular || Math.random() > 0.7) // Simulate popularity
        .slice(0, 6)
        .sort((a, b) => a.name.localeCompare(b.name));
      setPopularTeams(popular);
    }
  }, [teams]);

  // Filter teams based on search term and region
  const filteredTeams = useMemo(() => {
    let filtered = teams;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(team => 
        team.name.toLowerCase().includes(term) ||
        (team.short_name && team.short_name.toLowerCase().includes(term)) ||
        (team.region && team.region.toLowerCase().includes(term))
      );
    }

    if (selectedRegion !== 'all') {
      filtered = filtered.filter(team => team.region === selectedRegion);
    }

    return filtered;
  }, [teams, searchTerm, selectedRegion]);

  // Get currently selected team
  const selectedTeam = useMemo(() => {
    return teams.find(team => team.id == selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  // Handle team selection
  const handleTeamSelect = (team) => {
    if (disabled || !team) return;

    // Update recent teams
    try {
      const recent = JSON.parse(localStorage.getItem('mrvl_recent_teams') || '[]');
      const updated = [team, ...recent.filter(t => t.id !== team.id)].slice(0, 10);
      localStorage.setItem('mrvl_recent_teams', JSON.stringify(updated));
      setRecentTeams(updated.slice(0, 5));
    } catch (error) {
      console.error('Failed to save recent team:', error);
    }

    onTeamSelect?.(team);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen, showSearch]);

  // Available regions
  const regions = useMemo(() => {
    return Object.keys(teamsByRegion).sort();
  }, [teamsByRegion]);

  // Render team option
  const renderTeamOption = (team, isSelected = false, showRegion = false) => (
    <button
      key={team.id}
      onClick={() => handleTeamSelect(team)}
      disabled={disabled}
      className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Team Logo */}
      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
        {team.logo ? (
          <img 
            src={getImageUrl(team.logo, 'team-logo')} 
            alt={team.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = getImageUrl(null, 'team-logo'); }}
            onLoad={(e) => {
              const fallback = e.target?.nextElementSibling;
              if (fallback) fallback.style.display = 'none';
            }}
          />
        ) : null}
        <div 
          className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400"
          style={{ display: team.logo ? 'none' : 'flex' }}
        >
          {team.short_name || team.name.substring(0, 3).toUpperCase()}
        </div>
      </div>

      {/* Team Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className={`font-medium text-gray-900 dark:text-white truncate ${
            isSelected ? 'text-blue-600 dark:text-blue-400' : ''
          }`}>
            {team.name}
          </span>
          {team.short_name && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              {team.short_name}
            </span>
          )}
        </div>
        {showRegion && team.region && (
          <div className="flex items-center space-x-1 mt-1">
            <span className="text-sm">{getCountryFlag(team.region)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {getCountryName(team.region)}
            </span>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <div className="flex-shrink-0">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </button>
  );

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* Selected Team Display / Trigger */}
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
          disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${isOpen ? 'border-blue-500 ring-2 ring-blue-500' : ''}`}
      >
        {loading ? (
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading teams...</span>
          </div>
        ) : selectedTeam ? (
          <div className="flex items-center space-x-3">
            {/* Selected Team Logo */}
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
              {selectedTeam.logo ? (
                <img 
                  src={getImageUrl(selectedTeam.logo, 'team-logo')} 
                  alt={selectedTeam.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = getImageUrl(null, 'team-logo'); }}
                />
              ) : null}
              <div 
                className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400"
                style={{ display: selectedTeam.logo ? 'none' : 'flex' }}
              >
                {selectedTeam.short_name || selectedTeam.name.substring(0, 2).toUpperCase()}
              </div>
            </div>
            <div className="flex-1 text-left">
              <span className="font-medium text-gray-900 dark:text-white">{selectedTeam.name}</span>
              {selectedTeam.region && (
                <div className="flex items-center space-x-1 mt-0.5">
                  <span className="text-xs">{getCountryFlag(selectedTeam.region)}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getCountryName(selectedTeam.region)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <span className="text-gray-600 dark:text-gray-400">{placeholder}</span>
        )}
        
        {/* Dropdown Arrow */}
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className={`absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-96 overflow-hidden ${dropdownClassName}`}>
          {/* Search and Filters */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            {showSearch && (
              <div className="mb-3">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search teams..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            )}
            
            {showRegions && regions.length > 1 && (
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setSelectedRegion('all')}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    selectedRegion === 'all' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  All
                </button>
                {regions.map(region => (
                  <button
                    key={region}
                    onClick={() => setSelectedRegion(region)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      selectedRegion === region 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {getCountryFlag(region)} {region}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Teams List */}
          <div className="max-h-64 overflow-y-auto">
            {/* No Team Option */}
            <button
              onClick={() => handleTeamSelect(null)}
              disabled={disabled}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                !selectedTeamId ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500' : ''
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <span className={`font-medium text-gray-900 dark:text-white ${
                !selectedTeamId ? 'text-blue-600 dark:text-blue-400' : ''
              }`}>
                No team flair
              </span>
              {!selectedTeamId && (
                <div className="flex-shrink-0 ml-auto">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>

            {/* Popular Teams */}
            {showPopular && popularTeams.length > 0 && !searchTerm && selectedRegion === 'all' && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                  Popular Teams
                </div>
                {popularTeams.map(team => renderTeamOption(team, team.id == selectedTeamId, true))}
              </div>
            )}

            {/* Recent Teams */}
            {showRecent && recentTeams.length > 0 && !searchTerm && selectedRegion === 'all' && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                  Recently Selected
                </div>
                {recentTeams.map(team => renderTeamOption(team, team.id == selectedTeamId, true))}
              </div>
            )}

            {/* All Teams (organized by region or filtered) */}
            {showRegions && selectedRegion === 'all' && !searchTerm ? (
              // Show teams organized by region
              Object.entries(teamsByRegion).map(([region, regionTeams]) => (
                <div key={region}>
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50 flex items-center space-x-1">
                    <span>{getCountryFlag(region)}</span>
                    <span>{getCountryName(region)} ({regionTeams.length})</span>
                  </div>
                  {regionTeams.map(team => renderTeamOption(team, team.id == selectedTeamId))}
                </div>
              ))
            ) : (
              // Show filtered teams
              <div>
                {searchTerm && (
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900/50">
                    Search Results ({filteredTeams.length})
                  </div>
                )}
                {filteredTeams.length > 0 ? (
                  filteredTeams.map(team => renderTeamOption(team, team.id == selectedTeamId, true))
                ) : (
                  <div className="px-3 py-8 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No teams found matching your search' : 'No teams available in this region'}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSelector;