// src/components/MatchClient.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import pusherManager, { subscribeLiveMatches } from '@/lib/pusher';
import { matchesAPI } from '@/lib/api';
import { MatchDetails, PlayerMatchStats } from '@/lib/types';
import { formatDate, formatDuration } from '@/lib/utils';
import TabNavigation from '@/components/TabNavigation';

interface MatchClientProps {
  matchId: string;
  initialData?: MatchDetails;
}

export default function MatchClient({ matchId, initialData }: MatchClientProps) {
  const [match, setMatch] = useState<MatchDetails | null>(initialData || null);
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'timeline' | 'chat'>('overview');
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    user: string;
    message: string;
    timestamp: string;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedMap, setSelectedMap] = useState<number>(0);
  const [predictions, setPredictions] = useState<{
    team1Votes: number;
    team2Votes: number;
    userVote?: 'team1' | 'team2';
  }>({ team1Votes: 0, team2Votes: 0 });
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch match details
  useEffect(() => {
    const fetchMatchData = async () => {
      try {
        const matchData = await matchesAPI.getById(matchId);
        setMatch(matchData);
      } catch (error) {
        console.error('Error fetching match data:', error);
      }
    };

    if (!initialData) {
      fetchMatchData();
    }
  }, [matchId, initialData]);

  // Set up real-time updates for live matches
  useEffect(() => {
    if (!match || match.status !== 'live') return;

    const channel = subscribeLiveMatches((data) => {
      if (data.matchId === matchId) {
        setMatch(prev => prev ? {
          ...prev,
          team1_score: data.team1Score,
          team2_score: data.team2Score,
          status: data.status,
          live_stats: {
            ...prev.live_stats,
            current_map: data.currentMap || prev.live_stats?.current_map
          }
        } : null);
      }
    });

    return () => {
      if (channel) {
        pusherManager.unsubscribe(`live-matches`);
      }
    };
  }, [match, matchId]);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle chat message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const message = {
      id: Date.now().toString(),
      user: user.username,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Handle match prediction
  const handlePrediction = (team: 'team1' | 'team2') => {
    if (!user || match?.status !== 'scheduled') return;

    setPredictions(prev => ({
      ...prev,
      userVote: team,
      team1Votes: team === 'team1' ? prev.team1Votes + 1 : prev.team1Votes,
      team2Votes: team === 'team2' ? prev.team2Votes + 1 : prev.team2Votes
    }));
  };

  // Share match
  const shareMatch = async (platform: 'twitter' | 'discord' | 'copy') => {
    const url = `${window.location.origin}/matches/${matchId}`;
    const text = `${match?.team1.name} vs ${match?.team2.name} - ${match?.event?.name || 'Marvel Rivals Match'}`;

    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
        break;
      case 'discord':
        // Discord sharing would require Discord integration
        navigator.clipboard.writeText(`${text} ${url}`);
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
  };

  if (!match) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#fa4454] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#768894]">Loading match details...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', count: undefined },
    { id: 'stats', label: 'Statistics', count: match.player_stats?.length },
    { id: 'timeline', label: 'Timeline', count: match.timeline?.length },
    { id: 'chat', label: 'Live Chat', count: chatMessages.length }
  ];

  return (
    <div className={`match-client ${isFullscreen ? 'fullscreen' : ''}`}>
      
      {/* Match Header */}
      <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg mb-6">
        <div className="p-6">
          
          {/* Match Status & Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              {match.status === 'live' && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-[#4ade80] rounded-full animate-pulse"></div>
                  <span className="text-[#4ade80] font-semibold">LIVE</span>
                </div>
              )}
              
              <div className="text-sm text-[#768894]">
                {match.event?.name || 'Casual Match'} • {match.format?.toUpperCase() || 'BO3'}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Share Buttons */}
              <button
                onClick={() => shareMatch('twitter')}
                className="p-2 text-[#768894] hover:text-white hover:bg-[#20303d] rounded transition-colors"
                title="Share on Twitter"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>

              <button
                onClick={() => shareMatch('copy')}
                className="p-2 text-[#768894] hover:text-white hover:bg-[#20303d] rounded transition-colors"
                title="Copy Link"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-[#768894] hover:text-white hover:bg-[#20303d] rounded transition-colors"
                title="Toggle Fullscreen"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Teams Display */}
          <div className="flex items-center justify-center">
            
            {/* Team 1 */}
            <div className="flex-1 text-center">
              <div className="w-20 h-20 mx-auto mb-3 relative">
                {match.team1.logo ? (
                  <Image
                    src={match.team1.logo}
                    alt={match.team1.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {match.team1.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{match.team1.name}</h2>
              <div className="text-sm text-[#768894]">{match.team1.region}</div>
            </div>

            {/* Score/Status */}
            <div className="mx-8 text-center">
              {match.status === 'completed' || match.status === 'live' ? (
                <div className="flex items-center space-x-4">
                  <span className={`text-4xl font-bold ${
                    match.team1_score > match.team2_score ? 'text-white' : 'text-[#768894]'
                  }`}>
                    {match.team1_score}
                  </span>
                  <div className="text-2xl text-[#768894]">:</div>
                  <span className={`text-4xl font-bold ${
                    match.team2_score > match.team1_score ? 'text-white' : 'text-[#768894]'
                  }`}>
                    {match.team2_score}
                  </span>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#768894] mb-2">VS</div>
                  <div className="text-sm text-[#768894]">
                    {formatDate(match.scheduled_at)}
                  </div>
                </div>
              )}

              {match.live_stats && (
                <div className="mt-3 text-sm text-[#768894]">
                  Map: {match.live_stats.current_map} • Round {match.live_stats.current_round}
                </div>
              )}
            </div>

            {/* Team 2 */}
            <div className="flex-1 text-center">
              <div className="w-20 h-20 mx-auto mb-3 relative">
                {match.team2.logo ? (
                  <Image
                    src={match.team2.logo}
                    alt={match.team2.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-20 h-20 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {match.team2.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-1">{match.team2.name}</h2>
              <div className="text-sm text-[#768894]">{match.team2.region}</div>
            </div>
          </div>

          {/* Match Predictions */}
          {match.status === 'scheduled' && user && (
            <div className="mt-6 pt-6 border-t border-[#2b3d4d]">
              <div className="text-center mb-4">
                <h3 className="text-sm font-semibold text-white mb-2">Who will win?</h3>
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={() => handlePrediction('team1')}
                    className={`px-4 py-2 rounded transition-colors ${
                      predictions.userVote === 'team1'
                        ? 'bg-[#fa4454] text-white'
                        : 'bg-[#2b3d4d] text-[#768894] hover:bg-[#354c5f]'
                    }`}
                  >
                    {match.team1.name}
                  </button>
                  <button
                    onClick={() => handlePrediction('team2')}
                    className={`px-4 py-2 rounded transition-colors ${
                      predictions.userVote === 'team2'
                        ? 'bg-[#fa4454] text-white'
                        : 'bg-[#2b3d4d] text-[#768894] hover:bg-[#354c5f]'
                    }`}
                  >
                    {match.team2.name}
                  </button>
                </div>
                {(predictions.team1Votes > 0 || predictions.team2Votes > 0) && (
                  <div className="text-xs text-[#768894] mt-2">
                    {Math.round((predictions.team1Votes / (predictions.team1Votes + predictions.team2Votes)) * 100)}% vs{' '}
                    {Math.round((predictions.team2Votes / (predictions.team1Votes + predictions.team2Votes)) * 100)}%
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Map Information */}
      {match.maps && match.maps.length > 0 && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg mb-6">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Maps</h3>
            <div className="flex space-x-2 overflow-x-auto">
              {match.maps.map((map, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMap(index)}
                  className={`flex-shrink-0 p-3 rounded border transition-colors ${
                    selectedMap === index
                      ? 'bg-[#20303d] border-[#fa4454]'
                      : 'bg-[#0f1419] border-[#2b3d4d] hover:border-[#354c5f]'
                  }`}
                >
                  <div className="text-sm font-medium text-white">{map.name}</div>
                  {map.status === 'completed' && (
                    <div className="text-xs text-[#768894] mt-1">
                      {map.team1_score} - {map.team2_score}
                    </div>
                  )}
                  {map.status === 'in_progress' && (
                    <div className="text-xs text-[#4ade80] mt-1">LIVE</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as typeof activeTab)}
      />

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && (
          <OverviewTab match={match} />
        )}

        {activeTab === 'stats' && (
          <StatsTab match={match} selectedMap={selectedMap} />
        )}

        {activeTab === 'timeline' && (
          <TimelineTab match={match} />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            messages={chatMessages}
            newMessage={newMessage}
            onMessageChange={setNewMessage}
            onSendMessage={handleSendMessage}
            chatContainerRef={chatContainerRef}
            user={user}
          />
        )}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ match }: { match: MatchDetails }) {
  return (
    <div className="space-y-6">
      
      {/* Match Information */}
      <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">Match Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-[#768894]">Event</div>
            <div className="text-white font-medium">{match.event?.name || 'Casual Match'}</div>
          </div>
          <div>
            <div className="text-[#768894]">Format</div>
            <div className="text-white font-medium">{match.format?.toUpperCase() || 'BO3'}</div>
          </div>
          <div>
            <div className="text-[#768894]">Status</div>
            <div className="text-white font-medium capitalize">{match.status}</div>
          </div>
          <div>
            <div className="text-[#768894]">Duration</div>
            <div className="text-white font-medium">
              {match.started_at && match.ended_at
                ? formatDuration(match.started_at, match.ended_at)
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Team Lineups */}
      <div className="grid md:grid-cols-2 gap-6">
        <TeamLineup team={match.team1} title="Team 1 Lineup" />
        <TeamLineup team={match.team2} title="Team 2 Lineup" />
      </div>

      {/* MVP Information */}
      {match.mvp && (
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">Match MVP</h3>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-[#2b3d4d] rounded-full flex items-center justify-center">
              <span className="font-bold text-white">{match.mvp.username.charAt(0)}</span>
            </div>
            <div>
              <div className="font-medium text-white">{match.mvp.username}</div>
              <div className="text-sm text-[#768894]">{match.mvp.role}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Team Lineup Component
function TeamLineup({ team, title }: { team: any; title: string }) {
  return (
    <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg">
      <div className="p-4 border-b border-[#2b3d4d]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 relative">
            {team.logo ? (
              <Image src={team.logo} alt={team.name} fill className="object-contain" />
            ) : (
              <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                <span className="text-xs font-bold">{team.name.charAt(0)}</span>
              </div>
            )}
          </div>
          <div>
            <div className="font-medium text-white">{team.name}</div>
            <div className="text-xs text-[#768894]">{team.region}</div>
          </div>
        </div>
        
        {team.players && team.players.length > 0 ? (
          <div className="space-y-2">
            {team.players.map((player: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-white font-medium">{player.username}</span>
                  <span className="text-[#768894] text-xs">({player.role})</span>
                </div>
                <span className="text-[#768894] text-xs">{player.country_code}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-[#768894]">No lineup information available</div>
        )}
      </div>
    </div>
  );
}

// Statistics Tab Component
function StatsTab({ match, selectedMap }: { match: MatchDetails; selectedMap: number }) {
  if (!match.player_stats || match.player_stats.length === 0) {
    return (
      <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-8 text-center">
        <div className="text-[#768894]">No statistics available for this match</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg">
      <div className="p-4 border-b border-[#2b3d4d]">
        <h3 className="text-sm font-semibold text-white">Player Statistics</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2b3d4d]">
              <th className="text-left p-3 text-[#768894] font-medium">Player</th>
              <th className="text-right p-3 text-[#768894] font-medium">Eliminations</th>
              <th className="text-right p-3 text-[#768894] font-medium">Deaths</th>
              <th className="text-right p-3 text-[#768894] font-medium">Assists</th>
              <th className="text-right p-3 text-[#768894] font-medium">Damage</th>
              <th className="text-right p-3 text-[#768894] font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {match.player_stats.map((stat) => (
              <tr key={stat.player.id} className="border-b border-[#2b3d4d] hover:bg-[#20303d]">
                <td className="p-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-medium">{stat.player.username}</span>
                    <span className="text-[#768894] text-xs">({stat.player.role})</span>
                  </div>
                </td>
                <td className="text-right p-3 text-white">{stat.eliminations}</td>
                <td className="text-right p-3 text-white">{stat.deaths}</td>
                <td className="text-right p-3 text-white">{stat.assists}</td>
                <td className="text-right p-3 text-white">{stat.damage_dealt.toLocaleString()}</td>
                <td className="text-right p-3">
                  <span className={`font-medium ${
                    stat.rating >= 1.2 ? 'text-[#4ade80]' :
                    stat.rating >= 1.0 ? 'text-white' : 'text-[#ef4444]'
                  }`}>
                    {stat.rating.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Timeline Tab Component
function TimelineTab({ match }: { match: MatchDetails }) {
  if (!match.timeline || match.timeline.length === 0) {
    return (
      <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-8 text-center">
        <div className="text-[#768894]">No timeline data available for this match</div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg">
      <div className="p-4 border-b border-[#2b3d4d]">
        <h3 className="text-sm font-semibold text-white">Match Timeline</h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {match.timeline.map((event) => (
            <div key={event.id} className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-[#fa4454] rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-sm text-white">{event.description}</div>
                <div className="text-xs text-[#768894] mt-1">
                  {formatDate(event.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Chat Tab Component
function ChatTab({
  messages,
  newMessage,
  onMessageChange,
  onSendMessage,
  chatContainerRef,
  user
}: {
  messages: Array<{ id: string; user: string; message: string; timestamp: string }>;
  newMessage: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  chatContainerRef: React.RefObject<HTMLDivElement>;
  user: any;
}) {
  return (
    <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg">
      <div className="p-4 border-b border-[#2b3d4d]">
        <h3 className="text-sm font-semibold text-white">Live Chat</h3>
      </div>
      
      {/* Chat Messages */}
      <div
        ref={chatContainerRef}
        className="h-64 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="text-center text-[#768894] text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex items-start space-x-2">
              <div className="w-6 h-6 bg-[#2b3d4d] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {msg.user.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white">{msg.user}</span>
                  <span className="text-xs text-[#768894]">
                    {formatDate(msg.timestamp)}
                  </span>
                </div>
                <div className="text-sm text-white mt-1">{msg.message}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-[#2b3d4d]">
        {user ? (
          <form onSubmit={onSendMessage} className="flex space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-[#0f1419] border border-[#2b3d4d] rounded px-3 py-2 text-white text-sm placeholder-[#768894] focus:outline-none focus:border-[#fa4454]"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03e4e] disabled:bg-[#2b3d4d] disabled:text-[#768894] text-white text-sm font-medium rounded transition-colors"
            >
              Send
            </button>
          </form>
        ) : (
          <div className="text-center text-[#768894] text-sm">
            <a href="/user/login" className="text-[#fa4454] hover:underline">
              Log in
            </a>{' '}
            to join the chat
          </div>
        )}
      </div>
    </div>
  );
}
