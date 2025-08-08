import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { PlayerAvatar, TeamLogo, getCountryFlag, getHeroImageSync } from '../../utils/imageUtils';
import { parseTextWithMentions } from '../shared/UserDisplay';
import MentionsSection from '../shared/MentionsSection';
import { HEROES } from '../../constants/marvelRivalsData';

function PlayerDetailPageNew({ params, navigateTo }) {
  const [player, setPlayer] = useState(null);
  const [stats, setStats] = useState({});
  const [matchHistory, setMatchHistory] = useState([]);
  const [performanceStats, setPerformanceStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const { api } = useAuth();

  const playerId = params?.id;

  // Country names mapping
  const countryNames = {
    'US': 'United States', 'CA': 'Canada', 'GB': 'United Kingdom', 'DE': 'Germany',
    'FR': 'France', 'ES': 'Spain', 'IT': 'Italy', 'NL': 'Netherlands',
    'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
    'AU': 'Australia', 'NZ': 'New Zealand', 'JP': 'Japan', 'KR': 'South Korea',
    'CN': 'China', 'TW': 'Taiwan', 'SG': 'Singapore', 'TH': 'Thailand',
    'BR': 'Brazil', 'AR': 'Argentina', 'MX': 'Mexico', 'IN': 'India'
  };

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  const fetchPlayerData = async () => {
    try {
      setLoading(true);
      
      // Fetch player data
      const response = await api.get(`/players/${playerId}`);
      const playerData = response.data?.data || response.data || response;
      
      // Transform data
      const transformedPlayer = {
        id: playerData.id,
        username: playerData.username,
        realName: playerData.real_name,
        avatar: playerData.avatar,
        country: playerData.country,
        flag: playerData.flag || getCountryFlag(playerData.country),
        age: playerData.age,
        status: playerData.status,
        biography: playerData.biography,
        role: playerData.role,
        mainHero: playerData.main_hero,
        currentTeam: playerData.current_team,
        teamHistory: playerData.team_history || playerData.past_teams || [],
        socialMedia: playerData.social_media || {},
        region: playerData.region,
        totalEarnings: playerData.earnings || playerData.total_earnings || 0,
        rating: playerData.rating
      };
      
      setPlayer(transformedPlayer);
      
      if (playerData.stats) {
        setStats(playerData.stats);
      }
      
      // Fetch match history with performance data
      await fetchMatchPerformance();
      
    } catch (error) {
      console.error('Error fetching player data:', error);
      setPlayer(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchPerformance = async () => {
    try {
      setDataLoading(true);
      
      // Fetch match history with performance data
      const response = await api.get(`/public/players/${playerId}/match-history?per_page=50`);
      const matches = response.data?.data || [];
      
      // Transform match data into performance records
      const performances = matches.map(match => ({
        matchId: match.match_id || match.id,
        eventName: match.event_name || 'Scrim',
        eventLogo: match.event_logo,
        date: match.date || match.created_at,
        opponent: match.opponent_team,
        result: match.result,
        score: match.score,
        hero: match.hero_played || match.main_hero,
        eliminations: match.eliminations || match.kills || 0,
        deaths: match.deaths || 0,
        assists: match.assists || 0,
        damage: match.damage_dealt || match.damage || 0,
        healing: match.healing_done || match.healing || 0,
        blocked: match.damage_blocked || match.blocked || 0,
        kd: match.kd_ratio || (match.deaths > 0 ? match.eliminations / match.deaths : match.eliminations),
        rating: match.performance_rating || match.rating || 0
      }));
      
      setMatchHistory(matches);
      setPerformanceStats(performances);
      
    } catch (error) {
      console.error('Error fetching match performance:', error);
      setMatchHistory([]);
      setPerformanceStats([]);
    } finally {
      setDataLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Player not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
          <PlayerAvatar 
            player={player} 
            size="large" 
            className="w-24 h-24 rounded-full"
          />
          
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {player.username}
              </h1>
              {player.flag && (
                <span className="text-2xl" title={countryNames[player.country] || player.country}>
                  {player.flag}
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              {player.realName && (
                <span className="font-medium">{player.realName}</span>
              )}
              {player.currentTeam && (
                <button
                  onClick={() => navigateTo('team-detail', { id: player.currentTeam.id })}
                  className="flex items-center space-x-2 hover:text-red-600 dark:hover:text-red-400"
                >
                  <TeamLogo team={player.currentTeam} size="small" className="w-5 h-5" />
                  <span>{player.currentTeam.name}</span>
                </button>
              )}
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                {player.role}
              </span>
              {player.mainHero && (
                <div className="flex items-center space-x-1">
                  <img 
                    src={getHeroImageSync(player.mainHero)} 
                    alt={player.mainHero}
                    className="w-5 h-5 rounded"
                  />
                  <span>{player.mainHero}</span>
                </div>
              )}
            </div>
            
            {/* Stats Summary */}
            <div className="flex flex-wrap gap-6 mt-4">
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500 uppercase">Rating</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {player.rating || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500 uppercase">Earnings</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  ${(player.totalEarnings || 0).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500 uppercase">Win Rate</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.win_rate ? `${stats.win_rate.toFixed(1)}%` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 dark:text-gray-500 uppercase">K/D</div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {stats.kd_ratio ? stats.kd_ratio.toFixed(2) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Social Links */}
          <div className="flex items-center space-x-2">
            {player.socialMedia?.twitter && (
              <a href={player.socialMedia.twitter} target="_blank" rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
            )}
            {player.socialMedia?.twitch && (
              <a href={player.socialMedia.twitch} target="_blank" rel="noopener noreferrer"
                className="p-2 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 dark:hover:bg-gray-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Player/Hero Performance Table */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Performance by Match</h2>
        
        {dataLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : performanceStats.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Event</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Opponent</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Result</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">Hero</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">E</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">D</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">A</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">K/D</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">DMG</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">HEAL</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400">BLK</th>
                </tr>
              </thead>
              <tbody>
                {performanceStats.map((perf, index) => (
                  <tr 
                    key={index}
                    onClick={() => navigateTo('match-detail', { id: perf.matchId })}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(perf.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {perf.eventLogo && (
                          <img 
                            src={perf.eventLogo} 
                            alt={perf.eventName}
                            className="w-6 h-6 rounded"
                          />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {perf.eventName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        {perf.opponent?.logo && (
                          <TeamLogo team={perf.opponent} size="small" className="w-5 h-5" />
                        )}
                        <span className="text-sm text-gray-900 dark:text-white">
                          {perf.opponent?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-medium ${
                        perf.result === 'win' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {perf.score || (perf.result === 'win' ? 'W' : 'L')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={getHeroImageSync(perf.hero)} 
                          alt={perf.hero}
                          className="w-6 h-6 rounded"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">{perf.hero}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {perf.eliminations}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {perf.deaths}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium text-gray-900 dark:text-white">
                      {perf.assists}
                    </td>
                    <td className={`px-4 py-3 text-center text-sm font-medium ${
                      perf.kd >= 1.2 ? 'text-green-600 dark:text-green-400' :
                      perf.kd >= 0.9 ? 'text-gray-900 dark:text-white' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {perf.kd.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                      {perf.damage > 0 ? `${(perf.damage / 1000).toFixed(1)}k` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                      {perf.healing > 0 ? `${(perf.healing / 1000).toFixed(1)}k` : '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                      {perf.blocked > 0 ? `${(perf.blocked / 1000).toFixed(1)}k` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-500">No match performance data available</p>
          </div>
        )}
      </div>

      {/* Team History */}
      {player.teamHistory && player.teamHistory.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Team History</h2>
          <div className="space-y-3">
            {player.teamHistory.map((team, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
                <button
                  onClick={() => navigateTo('team-detail', { id: team.id })}
                  className="flex items-center space-x-3 hover:opacity-80"
                >
                  <TeamLogo team={team} size="small" className="w-10 h-10" />
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">{team.name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-500">{team.region}</div>
                  </div>
                </button>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {team.join_date && team.leave_date ? (
                    <span>{new Date(team.join_date).toLocaleDateString()} - {new Date(team.leave_date).toLocaleDateString()}</span>
                  ) : team.join_date ? (
                    <span>Since {new Date(team.join_date).toLocaleDateString()}</span>
                  ) : (
                    <span>Previous Team</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentions Section */}
      <MentionsSection 
        entityType="player"
        entityId={playerId}
        entityName={player.username}
      />
    </div>
  );
}

export default PlayerDetailPageNew;