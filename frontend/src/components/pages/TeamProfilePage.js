import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { TeamLogo, getCountryFlag, getImageUrl } from '../../utils/imageUtils';
import MatchCard from '../MatchCard';
import { useMentionUpdates } from '../../hooks/useMentionUpdates';

function TeamProfilePage({ teamId, navigateTo }) {
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalMatches: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
    recentForm: []
  });
  const [mentions, setMentions] = useState([]);
  const [mentionCount, setMentionCount] = useState(0);
  
  // Real-time mention updates
  const { mentionCount: liveMentionCount, recentMentions } = useMentionUpdates('team', teamId);

  useEffect(() => {
    loadTeamData();
  }, [teamId]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      
      // Load team info
      const teamResponse = await api.get(`/teams/${teamId}`);
      setTeam(teamResponse.data);
      
      // Load team players
      const playersResponse = await api.get(`/teams/${teamId}/players`);
      setPlayers(playersResponse.data || []);
      
      // Load team matches
      const matchesResponse = await api.get(`/teams/${teamId}/matches`);
      const matchData = matchesResponse.data || [];
      setMatches(matchData);
      
      // Calculate stats
      calculateTeamStats(matchData);
      
      // Load achievements
      const achievementsResponse = await api.get(`/teams/${teamId}/achievements`);
      setAchievements(achievementsResponse.data || []);
      
      // Load mention data
      await loadMentionData();
      
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMentionData = async () => {
    try {
      // Load mention count
      const countResponse = await api.get(`/mentions/team/${teamId}/counts`);
      setMentionCount(countResponse.data?.mention_count || 0);
      
      // Load recent mentions
      const mentionsResponse = await api.get(`/mentions/team/${teamId}/recent?limit=5`);
      setMentions(mentionsResponse.data || []);
    } catch (error) {
      console.error('Error loading mention data:', error);
    }
  };

  const calculateTeamStats = (matchData) => {
    const completed = matchData.filter(m => m.status === 'completed');
    const wins = completed.filter(m => {
      if (m.team1_id === teamId) {
        return m.team1_score > m.team2_score;
      } else {
        return m.team2_score > m.team1_score;
      }
    });
    
    const recentMatches = completed.slice(0, 5);
    const recentForm = recentMatches.map(m => {
      if (m.team1_id === teamId) {
        return m.team1_score > m.team2_score ? 'W' : 'L';
      } else {
        return m.team2_score > m.team1_score ? 'W' : 'L';
      }
    });
    
    setStats({
      totalMatches: completed.length,
      wins: wins.length,
      losses: completed.length - wins.length,
      winRate: completed.length > 0 ? Math.round((wins.length / completed.length) * 100) : 0,
      recentForm: recentForm
    });
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Team Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400">The team you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Team Header */}
      <div className="card mb-6">
        <div className="relative">
          {/* Team Banner */}
          {team.banner && (
            <div className="h-48 overflow-hidden rounded-t-lg">
              <img 
                src={getImageUrl(team.banner)}
                alt={`${team.name} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Team Info */}
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Team Logo */}
              <div className="relative">
                <TeamLogo team={team} size="w-32 h-32" />
                {team.verified && (
                  <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-1">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Team Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{team.name}</h1>
                  {team.country && (
                    <span className="text-2xl">{getCountryFlag(team.country)}</span>
                  )}
                </div>
                
                {team.short_name && (
                  <p className="text-gray-600 dark:text-gray-400 mb-2">Tag: {team.short_name}</p>
                )}
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                  {team.region && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium">
                      {team.region} Region
                    </span>
                  )}
                  
                  {team.founded && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium">
                      Founded {team.founded}
                    </span>
                  )}
                  
                  {team.org && (
                    <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
                      {team.org}
                    </span>
                  )}
                </div>

                {/* Social Links */}
                {(team.twitter || team.website || team.discord) && (
                  <div className="flex items-center justify-center md:justify-start space-x-4 mt-4">
                    {team.twitter && (
                      <a href={team.twitter} target="_blank" rel="noopener noreferrer" 
                         className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                      </a>
                    )}
                    {team.website && (
                      <a href={team.website} target="_blank" rel="noopener noreferrer"
                         className="text-gray-600 dark:text-gray-400 hover:text-blue-500">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {stats.totalMatches}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Matches</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {stats.wins}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Wins</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {stats.losses}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Losses</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {stats.winRate}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Win Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 relative">
                    {mentionCount}
                    {liveMentionCount > mentionCount && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                        !
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Mentions</div>
                </div>
              </div>
            </div>

            {/* Recent Form */}
            {stats.recentForm.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Recent Form:</span>
                  <div className="flex space-x-1">
                    {stats.recentForm.map((result, index) => (
                      <span
                        key={index}
                        className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${
                          result === 'W' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex space-x-8">
          {['overview', 'roster', 'matches', 'achievements', 'mentions'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors relative ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
              {tab === 'mentions' && liveMentionCount > mentionCount && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  !
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* About */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4">About {team.name}</h2>
              <p className="text-gray-600 dark:text-gray-400">
                {team.description || `${team.name} is a professional Marvel Rivals team competing in various tournaments and leagues.`}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Statistics</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Earnings</span>
                <span className="font-semibold">${team.earnings || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">World Ranking</span>
                <span className="font-semibold">#{team.ranking || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Active Players</span>
                <span className="font-semibold">{players.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roster' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map(player => (
            <div 
              key={player.id} 
              className="card p-4 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigateTo('player-detail', { id: player.id })}
            >
              <div className="flex items-center space-x-4">
                <img 
                  src={getImageUrl(player.avatar) || '/images/player-placeholder.svg'}
                  alt={player.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {player.name}
                    </h3>
                    {player.country && (
                      <span className="text-sm">{getCountryFlag(player.country)}</span>
                    )}
                  </div>
                  {player.real_name && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{player.real_name}</p>
                  )}
                  {player.role && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs font-medium">
                      {player.role}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* Match Filters */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex space-x-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">
                All
              </button>
              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-medium">
                Wins
              </button>
              <button className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm font-medium">
                Losses
              </button>
            </div>
          </div>

          {/* Match List */}
          {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map(match => (
                <MatchCard 
                  key={match.id} 
                  match={match} 
                  navigateTo={navigateTo}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Matches Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This team hasn't played any matches yet.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'achievements' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {achievements.length > 0 ? (
            achievements.map((achievement, index) => (
              <div key={index} className="card p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-3xl">🏆</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {achievement.place} Place
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {achievement.tournament}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {achievement.date}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-6xl mb-4">🏅</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No Achievements Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This team hasn't won any tournaments yet.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'mentions' && (
        <div className="space-y-4">
          {/* Mention Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {mentionCount}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Mentions</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {mentions.filter(m => new Date(m.mentioned_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">This Week</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {new Set(mentions.map(m => m.mentioned_by?.id)).size}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Unique Mentioners</div>
            </div>
          </div>

          {/* Recent Mentions */}
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Mentions</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {mentions.length > 0 ? (
                mentions.map((mention, index) => (
                  <div key={mention.id || index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <div className="flex items-start space-x-3">
                      {mention.mentioned_by?.avatar && (
                        <img 
                          src={getImageUrl(mention.mentioned_by.avatar)} 
                          alt={mention.mentioned_by.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {mention.mentioned_by?.name || 'Unknown User'}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            mentioned {team.short_name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(mention.mentioned_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {mention.content_context && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            in {mention.content_context.title}
                          </div>
                        )}
                        
                        {mention.context && (
                          <div className="text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded border-l-2 border-orange-500">
                            "{mention.context}"
                          </div>
                        )}
                        
                        {mention.content_context?.url && (
                          <a 
                            href={mention.content_context.url}
                            className="inline-flex items-center text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                          >
                            View context
                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Mentions Yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This team hasn't been mentioned in any discussions yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TeamProfilePage;