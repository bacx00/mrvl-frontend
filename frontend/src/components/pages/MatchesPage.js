import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import MatchCard from '../MatchCard';

function MatchesPage({ navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      console.log('MatchesPage: Fetching REAL LIVE BACKEND DATA...');

      const matchesResponse = await api.get('/matches');
      const rawMatches = matchesResponse?.data?.data || matchesResponse?.data || [];

      setMatches(Array.isArray(rawMatches) ? rawMatches : []);
      console.log('MatchesPage: Matches loaded:', rawMatches.length);

    } catch (error) {
      console.error('Error fetching matches:', error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };


  // Get filtered matches based on active tab and filters
  const getFilteredMatches = () => {
    let filtered = [...matches]; // Create a copy to avoid mutations

    // Filter by status (tab) - handle various status formats
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(match =>
          match.status === 'upcoming' ||
          match.status === 'scheduled' ||
          match.status === 'pending'
        );
        break;
      case 'live':
        filtered = filtered.filter(match =>
          match.status === 'live' ||
          match.status === 'ongoing'
        );
        break;
      case 'completed':
        filtered = filtered.filter(match =>
          match.status === 'completed' ||
          match.status === 'finished' ||
          match.status === 'ended'
        );
        break;
      default:
        break;
    }

    // Filter by format (BO1, BO3, BO5, etc.)
    if (selectedFormat && selectedFormat !== 'all') {
      filtered = filtered.filter(match => {
        const matchFormat = match.format?.toUpperCase() || 'BO3';
        return matchFormat === selectedFormat.toUpperCase();
      });
    }

    // Filter by search term - comprehensive search
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(match => {
        // Search in team names
        const team1Match = match.team1_name?.toLowerCase().includes(searchLower) ||
                          match.team1?.name?.toLowerCase().includes(searchLower);
        const team2Match = match.team2_name?.toLowerCase().includes(searchLower) ||
                          match.team2?.name?.toLowerCase().includes(searchLower);

        // Search in event name
        const eventMatch = match.event_name?.toLowerCase().includes(searchLower) ||
                          match.event?.name?.toLowerCase().includes(searchLower);

        // Search in tournament name
        const tournamentMatch = match.tournament_name?.toLowerCase().includes(searchLower);

        // Search in format
        const formatMatch = match.format?.toLowerCase().includes(searchLower);

        return team1Match || team2Match || eventMatch || tournamentMatch || formatMatch;
      });
    }

    // Sort matches for better UX
    filtered.sort((a, b) => {
      // Live matches first
      if (activeTab === 'live') {
        return new Date(b.updated_at || b.scheduled_at) - new Date(a.updated_at || a.scheduled_at);
      }
      // Upcoming matches by scheduled time
      if (activeTab === 'upcoming') {
        return new Date(a.scheduled_at) - new Date(b.scheduled_at);
      }
      // Completed matches by most recent
      if (activeTab === 'completed') {
        return new Date(b.updated_at || b.scheduled_at) - new Date(a.updated_at || a.scheduled_at);
      }
      return 0;
    });

    return filtered;
  };

  const filteredMatches = getFilteredMatches();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading matches...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header - VLR.gg Style */}
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

      {/* Tabs and Filters - VLR.gg Style */}
      <div className="card">
        {/* Match Status Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Upcoming ({matches.filter(m => m.status === 'upcoming').length})
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'live'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {matches.filter(m => m.status === 'live').length > 0 && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
              <span>Live ({matches.filter(m => m.status === 'live').length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Completed ({matches.filter(m => m.status === 'completed').length})
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by team, event, or format..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">All Formats</option>
                <option value="BO1">BO1 - Best of 1</option>
                <option value="BO3">BO3 - Best of 3</option>
                <option value="BO5">BO5 - Best of 5</option>
                <option value="BO7">BO7 - Best of 7</option>
                <option value="BO9">BO9 - Best of 9</option>
              </select>
              {(searchTerm || selectedFormat !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFormat('all');
                  }}
                  className="px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Matches List */}
        <div className="">
          {filteredMatches.length > 0 ? (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMatches.map(match => (
                <div key={match.id} className="p-4">
                  <MatchCard match={match} navigateTo={navigateTo} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <div className="text-6xl mb-4 opacity-20">🎮</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No {activeTab} matches found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {activeTab === 'live'
                  ? 'No matches are currently live'
                  : activeTab === 'upcoming'
                  ? 'No upcoming matches scheduled'
                  : 'No completed matches to show'
                }
              </p>
              {(isAdmin() || isModerator()) && (
                <button
                  onClick={() => navigateTo && navigateTo('admin-match-create')}
                  className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                >
                  Create First Match
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MatchesPage;