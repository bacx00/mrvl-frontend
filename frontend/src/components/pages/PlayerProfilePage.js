import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { TeamLogo, getCountryFlag, getImageUrl } from '../../utils/imageUtils';
import HeroImage from '../HeroImage';
import { useMentionUpdates } from '../../hooks/useMentionUpdates';
import liveUpdateService from '../../services/liveUpdateService';

function PlayerProfilePage({ playerId, navigateTo }) {
  const [player, setPlayer] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedMatch, setExpandedMatch] = useState(null);
  const [mentions, setMentions] = useState([]);
  const [mentionCount, setMentionCount] = useState(0);
  
  // Real-time mention updates
  const { mentionCount: liveMentionCount, recentMentions } = useMentionUpdates('player', playerId);

  useEffect(() => {
    loadPlayerData();
    loadMatchHistory();
    loadMentionData();
  }, [playerId, currentPage]);

  // Real-time updates for player data
  useEffect(() => {
    if (!playerId) return;

    const handlePlayerUpdate = (data) => {
      if (data.type === 'player_updated' && data.player_id === parseInt(playerId)) {
        console.log('Real-time player update received:', data);
        // Refetch player data to get latest information
        loadPlayerData();
      }
    };

    // Subscribe to player updates
    liveUpdateService.subscribe('player_updates', handlePlayerUpdate);

    return () => {
      liveUpdateService.unsubscribe('player_updates', handlePlayerUpdate);
    };
  }, [playerId]);

  // Update local state when real-time updates come in
  useEffect(() => {
    if (liveMentionCount !== undefined) {
      setMentionCount(liveMentionCount);
    }
  }, [liveMentionCount]);

  useEffect(() => {
    if (recentMentions && recentMentions.length > 0) {
      setMentions(recentMentions);
    }
  }, [recentMentions]);

  const loadPlayerData = async () => {
    try {
      const response = await api.get(`/players/${playerId}`);
      const playerData = response.data?.data || response.data;
      setPlayer(playerData);
    } catch (error) {
      console.error('Error loading player:', error);
    }
  };

  const loadMentionData = async () => {
    try {
      // Load mention count
      const countResponse = await api.get(`/mentions/player/${playerId}/counts`);
      setMentionCount(countResponse.data?.mention_count || 0);
      
      // Load recent mentions
      const mentionsResponse = await api.get(`/mentions/player/${playerId}/recent?limit=5`);
      setMentions(mentionsResponse.data || []);
    } catch (error) {
      console.error('Error loading mention data:', error);
    }
  };

  const loadMatchHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/players/${playerId}/matches?page=${currentPage}`);
      console.log('Match history response:', response.data);
      
      // Handle our custom API response format
      if (response.data?.matches) {
        setMatchHistory(response.data.matches || []);
        setTotalPages(response.data.total_pages || 1);
      } else {
        setMatchHistory([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading match history:', error);
      setMatchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const formatKDA = (k, d, a) => {
    if (d === 0) return '∞';
    return ((k + a) / d).toFixed(2);
  };

  const formatDamage = (dmg) => {
    if (dmg >= 1000) return `${(dmg / 1000).toFixed(1)}k`;
    return dmg.toString();
  };

  if (!player) return <div>Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Player Header */}
      <div className="card mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Player Avatar */}
            <div className="relative">
              <img 
                src={getImageUrl(player.avatar) || '/images/player-placeholder.svg'}
                alt={player.name}
                className="w-32 h-32 rounded-lg object-cover"
              />
              {player.team && (
                <div className="absolute -bottom-2 -right-2">
                  <TeamLogo team={player.team} size="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Player Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                <h1 className="text-3xl font-bold">{player.username || player.name}</h1>
                {player.country && (
                  <span className="text-2xl">{getCountryFlag(player.country)}</span>
                )}
              </div>
              
              {player.real_name && (
                <p className="text-gray-600 dark:text-gray-400 mb-1">{player.real_name}</p>
              )}
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                {player.team && (
                  <div 
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => navigateTo('team-detail', { id: player.team.id })}
                  >
                    <TeamLogo team={player.team} size="w-5 h-5" />
                    <span className="font-medium">{player.team.name}</span>
                  </div>
                )}
                
                {player.role && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                    {player.role}
                  </span>
                )}
                
                {player.main_hero && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                    <HeroImage hero={player.main_hero} size={20} />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                      {player.main_hero}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Player Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {player.total_matches || 0}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Matches</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {player.win_rate || '0'}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {player.overall_kda || '0.00'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">KDA</div>
              </div>
            </div>

            {/* Social Media Links */}
            {player.social_media && Object.values(player.social_media).some(link => link) && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center md:justify-start flex-wrap gap-2">
                  {player.social_media.twitter && (
                    <a 
                      href={`https://twitter.com/${player.social_media.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <span>🐦</span>
                      <span>Twitter</span>
                    </a>
                  )}
                  {player.social_media.twitch && (
                    <a 
                      href={`https://twitch.tv/${player.social_media.twitch}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    >
                      <span>📺</span>
                      <span>Twitch</span>
                    </a>
                  )}
                  {player.social_media.youtube && (
                    <a 
                      href={`https://youtube.com/@${player.social_media.youtube}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded text-xs hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <span>📹</span>
                      <span>YouTube</span>
                    </a>
                  )}
                  {player.social_media.instagram && (
                    <a 
                      href={`https://instagram.com/${player.social_media.instagram}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-1 px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-300 rounded text-xs hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors"
                    >
                      <span>📷</span>
                      <span>Instagram</span>
                    </a>
                  )}
                  {player.social_media.discord && (
                    <a 
                      href={`https://discord.gg/${player.social_media.discord}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded text-xs hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      <span>💬</span>
                      <span>Discord</span>
                    </a>
                  )}
                  {player.social_media.tiktok && (
                    <a 
                      href={`https://tiktok.com/@${player.social_media.tiktok}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center space-x-1 px-2 py-1 bg-black text-white dark:bg-gray-800 dark:text-gray-200 rounded text-xs hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span>🎵</span>
                      <span>TikTok</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex space-x-8">
          {['overview', 'matches', 'heroes', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Match History Tab */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {matchHistory.map((match) => (
            <div key={match.id} className="card">
              {/* Match Header */}
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                onClick={() => setExpandedMatch(expandedMatch === match.id ? null : match.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Event Logo */}
                    {match.event?.logo && (
                      <img 
                        src={getImageUrl(match.event.logo)}
                        alt={match.event.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    
                    {/* Match Info */}
                    <div>
                      <div className="font-medium">{match.event?.name || 'Match'}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(match.played_at).toLocaleDateString()} • {match.format}
                      </div>
                    </div>
                  </div>

                  {/* Teams and Score */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-3">
                      <TeamLogo team={match.team1} size="w-8 h-8" />
                      <span className={match.team1.id === player.team_id ? 'font-bold' : ''}>
                        {match.team1.name}
                      </span>
                    </div>
                    
                    <div className="text-xl font-bold">
                      <span className={match.team1_score > match.team2_score ? 'text-green-600' : ''}>
                        {match.team1_score}
                      </span>
                      {' - '}
                      <span className={match.team2_score > match.team1_score ? 'text-green-600' : ''}>
                        {match.team2_score}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={match.team2.id === player.team_id ? 'font-bold' : ''}>
                        {match.team2.name}
                      </span>
                      <TeamLogo team={match.team2} size="w-8 h-8" />
                    </div>
                  </div>

                  {/* Result Badge */}
                  <div>
                    {match.player_won ? (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                        Victory
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
                        Defeat
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Match Details */}
              {expandedMatch === match.id && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  {/* Hero Stats Table */}
                  <div className="p-4">
                    <h3 className="font-semibold mb-3">Performance by Map</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="text-left py-2 px-3">Map</th>
                            <th className="text-left py-2 px-3">Hero</th>
                            <th className="text-center py-2 px-3">K</th>
                            <th className="text-center py-2 px-3">D</th>
                            <th className="text-center py-2 px-3">A</th>
                            <th className="text-center py-2 px-3">KDA</th>
                            <th className="text-right py-2 px-3">DMG</th>
                            <th className="text-right py-2 px-3">Heal</th>
                            <th className="text-right py-2 px-3">BLK</th>
                          </tr>
                        </thead>
                        <tbody>
                          {match.player_maps?.map((mapData, idx) => (
                            <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="py-2 px-3">
                                <div>
                                  <div className="font-medium">{mapData.map_name}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {mapData.winner === 'team1' ? match.team1.name : match.team2.name} win
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-3">
                                <div className="flex items-center space-x-2">
                                  <HeroImage hero={mapData.hero} size={24} />
                                  <span>{mapData.hero}</span>
                                </div>
                              </td>
                              <td className="text-center py-2 px-3 font-medium">{mapData.eliminations}</td>
                              <td className="text-center py-2 px-3 font-medium">{mapData.deaths}</td>
                              <td className="text-center py-2 px-3 font-medium">{mapData.assists}</td>
                              <td className="text-center py-2 px-3 font-bold">
                                {formatKDA(mapData.eliminations, mapData.deaths, mapData.assists)}
                              </td>
                              <td className="text-right py-2 px-3">{formatDamage(mapData.damage)}</td>
                              <td className="text-right py-2 px-3">
                                {mapData.healing > 0 ? formatDamage(mapData.healing) : '-'}
                              </td>
                              <td className="text-right py-2 px-3">
                                {mapData.damage_blocked > 0 ? formatDamage(mapData.damage_blocked) : '-'}
                              </td>
                            </tr>
                          ))}
                          
                          {/* Match Totals */}
                          <tr className="font-bold bg-gray-50 dark:bg-gray-800/50">
                            <td className="py-2 px-3" colSpan="2">Match Total</td>
                            <td className="text-center py-2 px-3">{match.total_eliminations}</td>
                            <td className="text-center py-2 px-3">{match.total_deaths}</td>
                            <td className="text-center py-2 px-3">{match.total_assists}</td>
                            <td className="text-center py-2 px-3">
                              {formatKDA(match.total_eliminations, match.total_deaths, match.total_assists)}
                            </td>
                            <td className="text-right py-2 px-3">{formatDamage(match.total_damage)}</td>
                            <td className="text-right py-2 px-3">
                              {match.total_healing > 0 ? formatDamage(match.total_healing) : '-'}
                            </td>
                            <td className="text-right py-2 px-3">
                              {match.total_blocked > 0 ? formatDamage(match.total_blocked) : '-'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
              >
                Previous
              </button>
              
              <div className="flex space-x-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded ${
                      currentPage === i + 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Heroes Tab */}
      {activeTab === 'heroes' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-4">Hero Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4">Hero</th>
                  <th className="text-center py-3 px-4">Matches</th>
                  <th className="text-center py-3 px-4">Win Rate</th>
                  <th className="text-center py-3 px-4">Avg K</th>
                  <th className="text-center py-3 px-4">Avg D</th>
                  <th className="text-center py-3 px-4">Avg A</th>
                  <th className="text-center py-3 px-4">KDA</th>
                  <th className="text-right py-3 px-4">Avg DMG</th>
                </tr>
              </thead>
              <tbody>
                {player.hero_stats?.map((heroStat) => (
                  <tr key={heroStat.hero} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <HeroImage hero={heroStat.hero} size={32} />
                        <span className="font-medium">{heroStat.hero}</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">{heroStat.matches_played}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`font-medium ${
                        heroStat.win_rate >= 60 ? 'text-green-600' : 
                        heroStat.win_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {heroStat.win_rate}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4">{heroStat.avg_eliminations.toFixed(1)}</td>
                    <td className="text-center py-3 px-4">{heroStat.avg_deaths.toFixed(1)}</td>
                    <td className="text-center py-3 px-4">{heroStat.avg_assists.toFixed(1)}</td>
                    <td className="text-center py-3 px-4 font-bold">{heroStat.kda.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">{formatDamage(heroStat.avg_damage)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerProfilePage;