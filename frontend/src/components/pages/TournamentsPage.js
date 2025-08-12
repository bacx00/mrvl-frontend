import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getEventLogoUrl } from '../../utils/imageUtils';

function TournamentsPage({ navigateTo }) {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ongoing');
  const [searchTerm, setSearchTerm] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [prizePoolFilter, setPrizePoolFilter] = useState('all');
  const { api, isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      console.log('TournamentsPage: Fetching tournaments from API...');
      
      // Use events endpoint for tournaments
      const response = await api.get('/events?sort=recent');
      const tournamentsData = response.data?.data || response.data || [];
      
      console.log('Tournaments fetched:', tournamentsData);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      setTournaments([]);
    } finally {
      setLoading(false);
    }
  };

  // Get filtered tournaments based on all filters
  const getFilteredTournaments = () => {
    let filtered = tournaments;
    
    // Filter by status (tab)
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(tournament => tournament.status === 'upcoming');
        break;
      case 'ongoing':
        filtered = filtered.filter(tournament => tournament.status === 'ongoing' || tournament.status === 'live');
        break;
      case 'completed':
        filtered = filtered.filter(tournament => tournament.status === 'completed');
        break;
      default:
        break;
    }
    
    // Filter by format
    if (formatFilter !== 'all') {
      filtered = filtered.filter(tournament => 
        (tournament.details?.format || tournament.format) === formatFilter
      );
    }
    
    // Filter by region
    if (regionFilter !== 'all') {
      filtered = filtered.filter(tournament => 
        (tournament.details?.region || tournament.region) === regionFilter
      );
    }
    
    // Filter by prize pool
    if (prizePoolFilter !== 'all') {
      switch (prizePoolFilter) {
        case 'under_10k':
          filtered = filtered.filter(t => (t.details?.prize_pool || t.prize_pool || 0) < 10000);
          break;
        case '10k_50k':
          filtered = filtered.filter(t => {
            const prize = t.details?.prize_pool || t.prize_pool || 0;
            return prize >= 10000 && prize < 50000;
          });
          break;
        case '50k_100k':
          filtered = filtered.filter(t => {
            const prize = t.details?.prize_pool || t.prize_pool || 0;
            return prize >= 50000 && prize < 100000;
          });
          break;
        case 'over_100k':
          filtered = filtered.filter(t => (t.details?.prize_pool || t.prize_pool || 0) >= 100000);
          break;
        default:
          break;
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(tournament => 
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tournament.description && tournament.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const filteredTournaments = getFilteredTournaments();

  // Liquipedia-style Tournament Card Component
  const TournamentCard = ({ tournament }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'live': 
        case 'ongoing': 
          return 'bg-green-600 text-white';
        case 'upcoming': 
          return 'bg-blue-600 text-white';
        case 'completed': 
          return 'bg-gray-600 text-white';
        default: 
          return 'bg-gray-400 text-white';
      }
    };

    const formatPrizePool = (amount) => {
      if (!amount || amount === 0) return null;
      if (typeof amount === 'string') {
        return amount;
      }
      return `$${amount.toLocaleString()}`;
    };

    const formatDateRange = () => {
      const startDate = new Date(tournament.schedule?.start_date || tournament.start_date);
      const endDate = new Date(tournament.schedule?.end_date || tournament.end_date);
      
      if (startDate.toDateString() === endDate.toDateString()) {
        return startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
      }
      
      return `${startDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      })} - ${endDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      })}`;
    };

    const getFormatDisplay = (format) => {
      const formatMap = {
        'single_elimination': 'Single Elimination',
        'double_elimination': 'Double Elimination',
        'swiss': 'Swiss System',
        'round_robin': 'Round Robin',
        'group_stage': 'Group Stage',
        'gsl': 'GSL Format',
        'battle_royale': 'Battle Royale'
      };
      return formatMap[format] || format;
    };

    const getTeamCount = () => {
      const teams = tournament.teams || tournament.participating_teams || tournament.event_teams || [];
      const maxTeams = tournament.participation?.max_teams || tournament.max_teams || 0;
      return `${teams.length}${maxTeams ? `/${maxTeams}` : ''} teams`;
    };

    return (
      <div 
        className="liquipedia-tournament-card bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
        onClick={() => navigateTo && navigateTo('tournament-detail', { id: tournament.id })}
      >
        {/* Tournament Banner */}
        <div className="relative h-32 bg-gradient-to-r from-red-600 to-red-800 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
          <div className="relative z-10 p-4 h-full flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Tournament Logo */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/20 flex-shrink-0">
                <img 
                  src={getEventLogoUrl(tournament)} 
                  alt={tournament.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center text-2xl font-bold text-white">🏆</div>`;
                  }}
                />
              </div>
              
              {/* Tournament Info */}
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {tournament.name}
                </h3>
                <div className="text-red-100 text-sm">
                  {tournament.details?.region || tournament.region} • {formatDateRange()}
                </div>
              </div>
            </div>
            
            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(tournament.status)} ${tournament.status === 'live' ? 'animate-pulse' : ''}`}>
              {tournament.status === 'live' && <span className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse inline-block"></span>}
              {tournament.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Tournament Details */}
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {/* Prize Pool */}
            {formatPrizePool(tournament.details?.prize_pool || tournament.prize_pool) && (
              <div>
                <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Prize Pool</div>
                <div className="text-lg font-bold text-green-600 dark:text-green-400">
                  {formatPrizePool(tournament.details?.prize_pool || tournament.prize_pool)}
                </div>
              </div>
            )}
            
            {/* Format */}
            <div>
              <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Format</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {getFormatDisplay(tournament.details?.format || tournament.format)}
              </div>
            </div>
            
            {/* Teams */}
            <div>
              <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Teams</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {getTeamCount()}
              </div>
            </div>
            
            {/* Region */}
            <div>
              <div className="text-gray-500 dark:text-gray-400 font-medium mb-1">Region</div>
              <div className="font-semibold text-gray-900 dark:text-white">
                {tournament.details?.region || tournament.region}
              </div>
            </div>
          </div>

          {/* Tournament Description */}
          {tournament.description && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                {tournament.description}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading tournaments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header - Liquipedia Style */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Marvel Rivals Tournaments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete tournament coverage with brackets, results, and live updates
          </p>
        </div>
        {(isAdmin() || isModerator()) && (
          <button 
            onClick={() => navigateTo && navigateTo('admin-event-create')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
          >
            Create Tournament
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {tournaments.filter(t => t.status === 'ongoing' || t.status === 'live').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Live Tournaments</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {tournaments.filter(t => t.status === 'upcoming').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Upcoming</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {tournaments.filter(t => t.status === 'completed').length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ${tournaments.reduce((total, t) => total + (t.details?.prize_pool || t.prize_pool || 0), 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Prize Pool</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg mb-6">
        {/* Tournament Status Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('ongoing')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'ongoing'
                ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400 bg-green-50 dark:bg-green-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-center space-x-2">
              {tournaments.filter(t => t.status === 'ongoing' || t.status === 'live').length > 0 && (
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              )}
              <span>Live & Ongoing ({tournaments.filter(t => t.status === 'ongoing' || t.status === 'live').length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'upcoming'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Upcoming ({tournaments.filter(t => t.status === 'upcoming').length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'completed'
                ? 'text-gray-600 dark:text-gray-400 border-b-2 border-gray-600 dark:border-gray-400 bg-gray-50 dark:bg-gray-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-gray-600 dark:hover:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            Completed ({tournaments.filter(t => t.status === 'completed').length})
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === 'all'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-900/10'
                : 'text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            All Tournaments ({tournaments.length})
          </button>
        </div>

        {/* Advanced Filters */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Tournaments
              </label>
              <input
                type="text"
                placeholder="Tournament name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 pl-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              <svg className="absolute left-3 top-9 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Format Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tournament Format
              </label>
              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Formats</option>
                <option value="single_elimination">Single Elimination</option>
                <option value="double_elimination">Double Elimination</option>
                <option value="swiss">Swiss System</option>
                <option value="round_robin">Round Robin</option>
                <option value="group_stage">Group Stage</option>
                <option value="gsl">GSL Format</option>
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Region
              </label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Regions</option>
                <option value="INTL">International</option>
                <option value="NA">North America</option>
                <option value="EU">Europe</option>
                <option value="APAC">Asia-Pacific</option>
                <option value="CN">China</option>
                <option value="BR">Brazil</option>
                <option value="LATAM">LATAM</option>
              </select>
            </div>

            {/* Prize Pool Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prize Pool
              </label>
              <select
                value={prizePoolFilter}
                onChange={(e) => setPrizePoolFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">Any Amount</option>
                <option value="under_10k">Under $10,000</option>
                <option value="10k_50k">$10,000 - $50,000</option>
                <option value="50k_100k">$50,000 - $100,000</option>
                <option value="over_100k">Over $100,000</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tournaments Grid */}
      {filteredTournaments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTournaments.map(tournament => (
            <TournamentCard 
              key={tournament.id}
              tournament={tournament}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg py-12 text-center">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No {activeTab === 'all' ? '' : activeTab} tournaments found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {searchTerm 
              ? `No tournaments matching your search criteria`
              : activeTab === 'upcoming' 
                ? 'No upcoming tournaments scheduled at the moment'
                : activeTab === 'ongoing'
                ? 'No tournaments currently running'
                : activeTab === 'completed'
                ? 'No completed tournaments to show'
                : 'No tournaments available'
            }
          </p>
        </div>
      )}
    </div>
  );
}

export default TournamentsPage;