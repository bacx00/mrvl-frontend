import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo } from '../../utils/imageUtils';
import SinglePageLiveScoring from './SinglePageLiveScoring';

/**
 * LIVE SCORING DASHBOARD - DEDICATED INTERFACE FOR REAL-TIME MATCH CONTROL
 * Access: Admin/Moderator only
 * Features: Quick match selection, live scoring interface, real-time sync
 */
function LiveScoringDashboard({ navigateTo }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scoringOpen, setScoringOpen] = useState(false);
  const [filter, setFilter] = useState('live');

  const { api, isAdmin, isModerator } = useAuth();

  // Check permissions
  const canLiveScore = isAdmin() || isModerator();

  const fetchMatches = useCallback(async () => {
    if (!canLiveScore) return;
    
    try {
      setLoading(true);
      const response = await api.get('/matches');
      const matches = response.data?.data || response.data || response || [];
      
      // Filter live matches
      const live = matches.filter(match => 
        match.status === 'live' || match.status === 'upcoming'
      );
      
      setLiveMatches(live);
      setAllMatches(matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  }, [api, canLiveScore]);

  useEffect(() => {
    fetchMatches();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMatches, 30000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  const openLiveScoring = (match) => {
    setSelectedMatch(match);
    setScoringOpen(true);
  };

  const closeLiveScoring = () => {
    setSelectedMatch(null);
    setScoringOpen(false);
    fetchMatches(); // Refresh after scoring session
  };

  const updateMatchStatus = async (matchId, newStatus) => {
    try {
      await api.patch(`/admin/matches/${matchId}`, { status: newStatus });
      await fetchMatches();
    } catch (error) {
      console.error('Error updating match status:', error);
    }
  };

  if (!canLiveScore) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-6xl mb-4">Access Denied</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          You need admin or moderator privileges to access live scoring.
        </p>
      </div>
    );
  }

  const displayMatches = filter === 'live' ? liveMatches : allMatches;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Live Scoring Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Real-time match control with comprehensive stats tracking
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={fetchMatches}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={() => navigateTo('admin-match-create')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            New Match
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => setFilter('live')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'live'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Live & Upcoming ({liveMatches.length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-md font-medium transition-colors ${
            filter === 'all'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          All Matches ({allMatches.length})
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading matches...</p>
        </div>
      )}

      {/* Live Matches Grid */}
      {!loading && displayMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayMatches.map((match) => (
            <div key={match.id} className="card p-6 hover:shadow-lg transition-shadow">
              {/* Match Header */}
              <div className="flex items-center justify-between mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  match.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                  match.status === 'upcoming' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                  match.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {match.status === 'live' ? 'LIVE' :
                   match.status === 'upcoming' ? 'UPCOMING' :
                   match.status === 'completed' ? 'COMPLETED' :
                   match.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {match.format || 'BO1'}
                </div>
              </div>

              {/* Teams */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TeamLogo team={match.team1} size="sm" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {match.team1?.name || 'Team 1'}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {match.team1_score || 0}
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <span className="text-gray-400 text-sm">VS</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TeamLogo team={match.team2} size="sm" />
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {match.team2?.name || 'Team 2'}
                    </span>
                  </div>
                  <div className="text-xl font-bold text-red-600 dark:text-red-400">
                    {match.team2_score || 0}
                  </div>
                </div>
              </div>

              {/* Match Info */}
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div>Event: {match.event?.name || 'No event'}</div>
                <div>Scheduled: {new Date(match.scheduled_at).toLocaleString()}</div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => openLiveScoring(match)}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  Open Live Scoring
                </button>
                
                {match.status === 'upcoming' && (
                  <button
                    onClick={() => updateMatchStatus(match.id, 'live')}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                  >
                    Start Live
                  </button>
                )}
                
                {match.status === 'live' && (
                  <button
                    onClick={() => updateMatchStatus(match.id, 'completed')}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Matches */}
      {!loading && displayMatches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl font-bold text-gray-300 dark:text-gray-700 mb-4">No Matches</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No {filter === 'live' ? 'Live ' : ''}Matches Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === 'live' 
              ? 'No live or upcoming matches at the moment.'
              : 'No matches created yet.'}
          </p>
          <button
            onClick={() => navigateTo('admin-match-create')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Create New Match
          </button>
        </div>
      )}

      {/* Comprehensive Match Control Center */}
      {selectedMatch && (
        <SinglePageLiveScoring
          match={selectedMatch}
          isOpen={scoringOpen}
          onClose={closeLiveScoring}
          onUpdate={fetchMatches}
        />
      )}
    </div>
  );
}

export default LiveScoringDashboard;