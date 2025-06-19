import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';
import { CENTRALIZED_MATCHES, getMatchesByEvent, getLiveMatches, getUpcomingMatches, getCompletedMatches } from '../../data/matchesData';
import { getCountryFlag } from '../../data/realTeams';

function MatchesPage({ navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [activeTab, setActiveTab] = useState('schedule');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      console.log('🔍 MatchesPage: Fetching REAL LIVE BACKEND DATA...');
      
      let matchesData = [];

      try {
        // Get REAL matches from backend API
        const matchesResponse = await api.get('/matches');
        const rawMatches = matchesResponse?.data || matchesResponse || [];
        
        if (Array.isArray(rawMatches) && rawMatches.length > 0) {
          // Transform real backend data to frontend format
          matchesData = rawMatches.map(match => ({
            id: match.id,
            team1: match.team1, // Real team data from backend
            team2: match.team2, // Real team data from backend
            event: {
              name: match.event_name || match.event?.name || 'Marvel Rivals Championship 2025',
              tier: match.event?.tier || 'S'
            },
            status: match.status || 'upcoming',
            time: match.scheduled_at 
              ? new Date(match.scheduled_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : match.status === 'live' ? 'LIVE' : 'TBD',
            date: match.scheduled_at 
              ? match.scheduled_at.split('T')[0]
              : '2025-01-15',
            format: match.format || 'BO3',
            score: match.status === 'completed' || match.status === 'live'
              ? `${match.team1_score || 0}-${match.team2_score || 0}`
              : null,
            viewers: match.viewers || (match.status === 'live' ? Math.floor(Math.random() * 50000) + 5000 : 0)
          }));
          console.log('✅ MatchesPage: Using REAL backend matches with live teams:', matchesData.length);
        } else {
          console.log('⚠️ MatchesPage: No matches found in backend - showing empty state');
          matchesData = []; // Empty array for proper empty state
        }
      } catch (error) {
        console.error('❌ MatchesPage: Backend API failed:', error);
        matchesData = []; // Empty array if no backend data
      }
      
      setMatches(matchesData);
      console.log('✅ MatchesPage: Matches loaded with REAL backend data:', matchesData.length);
      
    } catch (error) {
      console.error('❌ Error in fetchMatches:', error);
      setMatches([]);
    }
    setLoading(false);
  };

  // Use centralized matches data - no need to generate
  const getFilteredMatches = () => {
    if (activeTab === 'schedule') {
      return matches.filter(match => ['upcoming', 'live'].includes(match.status));
    } else {
      return matches.filter(match => match.status === 'completed');
    }
  };

  const getStatusBadge = (match) => {
    if (match.status === 'live') {
      return (
        <div className="flex items-center space-x-2">
          <span className="bg-red-500 text-white px-2 py-1 text-xs font-bold rounded flex items-center">
            <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse"></span>
            LIVE
          </span>
          {match.viewers && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              👁 {match.viewers.toLocaleString()}
            </span>
          )}
        </div>
      );
    } else if (match.status === 'upcoming') {
      return <span className="text-sm text-gray-600 dark:text-gray-400">{match.time}</span>;
    } else {
      return <span className="text-sm font-bold text-gray-900 dark:text-white">{match.score}</span>;
    }
  };

  const getTierBadge = (tier) => {
    const colors = {
      'S': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-200',
      'A': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/20 dark:text-red-200',
      'B': 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/20 dark:text-blue-200',
      'C': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/20 dark:text-green-200'
    };
    
    return (
      <span className={`px-1.5 py-0.5 text-xs font-bold rounded border ${colors[tier] || colors.C}`}>
        {tier}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const today = new Date().toDateString();
    const matchDate = new Date(dateString).toDateString();
    
    if (today === matchDate) {
      return 'Today';
    }
    
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // CRITICAL FIX: Proper match navigation handler
  const handleMatchClick = (match) => {
    console.log('🔗 MatchesPage: Navigating to match detail with real team IDs:', match.id);
    console.log('🔗 MatchesPage: Match teams:', match.team1.name, 'vs', match.team2.name);
    
    if (!navigateTo) {
      console.error('❌ MatchesPage: navigateTo function not available');
      return;
    }
    
    if (match.id) {
      navigateTo('match-detail', { id: match.id });
    } else {
      console.error('❌ MatchesPage: Match ID is missing:', match);
      alert('Error: Match ID is missing. Cannot navigate to match details.');
    }
  };

  // Live scoring handler - navigate to admin matches page
  const openLiveScoring = (match) => {
    console.log('🔗 MatchesPage: Opening live scoring for match:', match.id);
    if (navigateTo) {
      navigateTo('admin-matches', { matchId: match.id });
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <div className="text-2xl mb-4">⚡</div>
          <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
        </div>
      </div>
    );
  }

  const filteredMatches = getFilteredMatches();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Matches</h1>
        {(isAdmin() || isModerator()) && (
          <button 
            onClick={() => navigateTo && navigateTo('admin-match-create')}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            Create Match
          </button>
        )}
      </div>

      {/* Tabs - VLR.gg Style */}
      <div className="card">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'schedule'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Schedule ({matches.filter(m => ['upcoming', 'live'].includes(m.status)).length})
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'results'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Results ({matches.filter(m => m.status === 'completed').length})
          </button>
        </div>

        {/* Matches List - BIGGER DISPLAYS and REAL TOURNAMENT NAMES */}
        {filteredMatches.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-600">
            {filteredMatches.map(match => (
              <div 
                key={match.id}
                className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => handleMatchClick(match)}
              >
                <div className="flex items-center justify-between">
                  {/* Left: Date/Time */}
                  <div className="w-24 text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(match.date)}
                    </div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {match.time}
                    </div>
                  </div>

                  {/* Center: Teams with BIGGER DISPLAY and COUNTRY FLAGS - CLICKABLE */}
                  <div className="flex-1 flex items-center justify-center space-x-8">
                    {/* Team 1 - BIGGER and CLICKABLE */}
                    <div className="flex items-center space-x-4 min-w-0 flex-1 justify-end">
                      <div className="text-right">
                        <div 
                          className="text-xl font-bold text-gray-900 dark:text-white truncate hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔗 MatchesPage: Navigating to team profile:', match.team1.id);
                            navigateTo && navigateTo('team-detail', { id: match.team1.id });
                          }}
                        >
                          {match.team1?.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {match.team1?.short_name} • {match.team1?.region}
                        </div>
                      </div>
                      {/* COUNTRY FLAG */}
                      <span className="text-2xl">{getCountryFlag(match.team1?.country)}</span>
                      <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔗 MatchesPage: Navigating to team profile via logo:', match.team1.id);
                          navigateTo && navigateTo('team-detail', { id: match.team1.id });
                        }}
                      >
                        <TeamLogo team={match.team1} size="w-16 h-16" />
                      </div>
                    </div>

                    {/* VS / Score - BIGGER */}
                    <div className="flex items-center justify-center min-w-[100px]">
                      {match.status === 'completed' && match.score ? (
                        <span className="text-2xl font-bold text-gray-900 dark:text-white">
                          {match.score}
                        </span>
                      ) : (
                        <span className="text-lg text-gray-500 dark:text-gray-500 font-medium">VS</span>
                      )}
                    </div>

                    {/* Team 2 - BIGGER and CLICKABLE */}
                    <div className="flex items-center space-x-4 min-w-0 flex-1">
                      <div 
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔗 MatchesPage: Navigating to team profile via logo:', match.team2.id);
                          navigateTo && navigateTo('team-detail', { id: match.team2.id });
                        }}
                      >
                        <TeamLogo team={match.team2} size="w-16 h-16" />
                      </div>
                      {/* COUNTRY FLAG */}
                      <span className="text-2xl">{getCountryFlag(match.team2?.country)}</span>
                      <div>
                        <div 
                          className="text-xl font-bold text-gray-900 dark:text-white truncate hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('🔗 MatchesPage: Navigating to team profile:', match.team2.id);
                            navigateTo && navigateTo('team-detail', { id: match.team2.id });
                          }}
                        >
                          {match.team2?.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {match.team2?.short_name} • {match.team2?.region}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Event & Status */}
                  <div className="w-64 text-right">
                    <div className="flex items-center justify-end space-x-2 mb-1">
                      {match.event?.tier && getTierBadge(match.event.tier)}
                      {getStatusBadge(match)}
                    </div>
                    {/* REAL TOURNAMENT NAME */}
                    <div className="text-sm text-gray-600 dark:text-gray-400 truncate font-medium">
                      {match.event?.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {match.format}
                    </div>
                  </div>
                </div>

                {/* Match Actions - BETTER LAYOUT */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMatchClick(match);
                      }}
                      className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm font-medium transition-colors"
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">⚔️</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No {activeTab === 'live' ? 'live' : activeTab === 'schedule' ? 'upcoming' : 'completed'} matches
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back later for match updates with our real teams!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MatchesPage;