import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Shield, Zap, Heart, Clock, Users, 
  TrendingUp, Activity, ChevronDown, Share2, Bell,
  Wifi, WifiOff, RefreshCw
} from 'lucide-react';
import { getHeroImageSync } from '../../utils/imageUtils';

// Mobile-Optimized Match Detail Page
export const MobileMatchDetail = ({ match, onBack, user, api }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLive, setIsLive] = useState(match.status === 'live');
  const [liveData, setLiveData] = useState(match);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const eventSourceRef = useRef(null);
  const pullToRefreshRef = useRef(null);

  // Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Pull to refresh
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let refreshing = false;

    const handleTouchStart = (e) => {
      startY = e.touches[0].pageY;
    };

    const handleTouchMove = (e) => {
      if (window.scrollY === 0 && !refreshing) {
        currentY = e.touches[0].pageY;
        const diff = currentY - startY;
        
        if (diff > 0 && diff < 150) {
          pullToRefreshRef.current.style.transform = `translateY(${diff}px)`;
        }
      }
    };

    const handleTouchEnd = () => {
      const diff = currentY - startY;
      
      if (diff > 100 && !refreshing) {
        refreshing = true;
        setIsRefreshing(true);
        
        // Refresh match data
        fetchLatestMatchData().then(() => {
          setIsRefreshing(false);
          refreshing = false;
        });
      }
      
      pullToRefreshRef.current.style.transform = 'translateY(0)';
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Live updates via SSE
  useEffect(() => {
    if (isLive && isOnline) {
      const eventSource = new EventSource(`/api/matches/${match.id}/live-stream`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setLiveData(prevData => ({
          ...prevData,
          ...data,
          lastUpdate: new Date().toISOString()
        }));

        // Vibrate on score update (if supported)
        if ('vibrate' in navigator && data.type === 'score_update') {
          navigator.vibrate(200);
        }
      };

      return () => {
        eventSource.close();
      };
    }
  }, [isLive, isOnline, match.id]);

  const fetchLatestMatchData = async () => {
    try {
      const response = await api.get(`/matches/${match.id}`);
      setLiveData(response.data.data);
      setIsLive(response.data.data.status === 'live');
    } catch (error) {
      console.error('Failed to refresh match data:', error);
    }
  };

  const enableNotifications = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem(`match_notifications_${match.id}`, 'true');
        setShowNotificationPrompt(false);
      }
    }
  };

  const shareMatch = async () => {
    const shareData = {
      title: `${liveData.team1.name} vs ${liveData.team2.name}`,
      text: `Check out this Marvel Rivals match!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share failed:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Pull to Refresh Indicator */}
      <div 
        ref={pullToRefreshRef}
        className="absolute top-0 left-0 right-0 flex justify-center pt-4 transition-transform"
      >
        <RefreshCw className={`w-6 h-6 text-gray-400 ${isRefreshing ? 'animate-spin' : ''}`} />
      </div>

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="offline-indicator">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span>Offline - Showing cached data</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 -ml-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-3">
            {isLive && (
              <div className="flex items-center space-x-1 text-red-600">
                <Activity className="w-4 h-4 animate-pulse" />
                <span className="text-sm font-medium">LIVE</span>
              </div>
            )}
            
            <button onClick={shareMatch} className="p-2">
              <Share2 className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setShowNotificationPrompt(true)}
              className="p-2"
            >
              <Bell className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Match Header */}
      <div className="bg-white dark:bg-gray-800 p-4">
        <div className="text-center mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {liveData.event?.name || 'Tournament'} • {liveData.round || 'Group Stage'}
          </p>
        </div>

        {/* Score Display */}
        <div className="grid grid-cols-3 items-center mb-4">
          <TeamScore 
            team={liveData.team1} 
            score={liveData.team1_score}
            isLeft={true}
          />
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">VS</div>
            {isLive && liveData.match_timer && (
              <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                <span className="font-mono">{liveData.match_timer}</span>
              </div>
            )}
          </div>
          
          <TeamScore 
            team={liveData.team2} 
            score={liveData.team2_score}
            isLeft={false}
          />
        </div>

        {/* Map Progress */}
        {liveData.maps_data && (
          <MapProgress maps={liveData.maps_data} currentMap={liveData.current_map_number} />
        )}
      </div>

      {/* Tab Navigation */}
      <div className="sticky top-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="flex overflow-x-auto scrollbar-hide">
          {['overview', 'live', 'stats', 'timeline'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-shrink-0 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-red-600 border-red-600'
                  : 'text-gray-500 border-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <OverviewTab match={liveData} isLive={isLive} />
        )}
        
        {activeTab === 'live' && (
          <LiveTab match={liveData} isLive={isLive} />
        )}
        
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-3">Match Statistics</h3>
              <p className="text-sm text-gray-500">Detailed stats coming soon...</p>
            </div>
          </div>
        )}
        
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-medium mb-3">Match Timeline</h3>
              <p className="text-sm text-gray-500">Timeline coming soon...</p>
            </div>
          </div>
        )}
      </div>

      {/* Notification Prompt Modal */}
      {showNotificationPrompt && (
        <NotificationPrompt 
          onEnable={enableNotifications}
          onClose={() => setShowNotificationPrompt(false)}
        />
      )}
    </div>
  );
};

// Team Score Component
const TeamScore = ({ team, score, isLeft }) => {
  return (
    <div className={`text-${isLeft ? 'right' : 'left'}`}>
      <div className="font-medium text-sm text-gray-600 dark:text-gray-400">
        {team?.short_name || team?.name}
      </div>
      <div className="text-3xl font-bold mt-1">
        {score || 0}
      </div>
    </div>
  );
};

// Map Progress Component
const MapProgress = ({ maps, currentMap }) => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {maps.map((map, index) => (
        <div
          key={index}
          className={`w-8 h-2 rounded-full transition-colors ${
            map.winner
              ? map.winner === 'team1'
                ? 'bg-blue-500'
                : 'bg-red-500'
              : index + 1 === currentMap
              ? 'bg-yellow-500'
              : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ match, isLive }) => {
  return (
    <div className="space-y-4">
      {/* Match Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3">Match Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Format</span>
            <span className="font-medium">{match.format}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Server</span>
            <span className="font-medium">{match.server_region || 'TBD'}</span>
          </div>
          {match.prize_pool && (
            <div className="flex justify-between">
              <span className="text-gray-500">Prize Pool</span>
              <span className="font-medium">{match.prize_pool}</span>
            </div>
          )}
        </div>
      </div>

      {/* Team Rosters */}
      <div className="space-y-4">
        <TeamRoster 
          team={match.team1} 
          players={match.team1_players}
          heroData={match.hero_data?.team1}
        />
        <TeamRoster 
          team={match.team2} 
          players={match.team2_players}
          heroData={match.hero_data?.team2}
        />
      </div>
    </div>
  );
};

// Team Roster Component
const TeamRoster = ({ team, players, heroData }) => {
  const roleIcons = {
    'Vanguard': Shield,
    'Duelist': Zap,
    'Strategist': Heart
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <h3 className="font-medium mb-3">{team?.name}</h3>
      <div className="space-y-2">
        {players?.map((player, index) => {
          const hero = heroData?.[index];
          const RoleIcon = hero ? roleIcons[hero.role] : Users;
          
          return (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {hero && (
                  <img 
                    src={getHeroImageSync(hero.hero_key)}
                    alt={hero.name}
                    className="w-8 h-8 rounded-full"
                  />
                )}
                <div>
                  <div className="font-medium text-sm">{player.name}</div>
                  <div className="text-xs text-gray-500">{hero?.name || 'Not selected'}</div>
                </div>
              </div>
              <RoleIcon className="w-5 h-5 text-gray-400" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Live Tab with Real-time Updates
const LiveTab = ({ match, isLive }) => {
  const [events, setEvents] = useState([]);

  if (!isLive) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2" />
        <p>Match hasn't started yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Map */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">Current Map</h3>
          <span className="text-sm text-gray-500">
            Map {match.current_map_number} of {match.maps_data?.length || 3}
          </span>
        </div>
        
        <div className="text-center py-4">
          <div className="text-lg font-medium">
            {match.maps_data?.[match.current_map_number - 1]?.map_name || 'Loading...'}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {match.maps_data?.[match.current_map_number - 1]?.mode || 'Game Mode'}
          </div>
        </div>

        {/* Objective Progress */}
        <ObjectiveProgress 
          objective={match.maps_data?.[match.current_map_number - 1]?.objective_progress}
        />
      </div>

      {/* Live Kill Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
        <h3 className="font-medium mb-3">Kill Feed</h3>
        <KillFeed events={match.live_events || []} />
      </div>

      {/* Player Stats */}
      <LivePlayerStats players={match.player_stats} />
    </div>
  );
};

// Objective Progress Component
const ObjectiveProgress = ({ objective }) => {
  if (!objective) return null;

  return (
    <div className="mt-4">
      <div className="flex justify-between text-sm mb-2">
        <span>Objective Progress</span>
        <span>{objective.percentage || 0}%</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div 
          className="bg-gradient-to-r from-red-500 to-red-600 h-full rounded-full transition-all duration-300"
          style={{ width: `${objective.percentage || 0}%` }}
        />
      </div>
    </div>
  );
};

// Kill Feed Component
const KillFeed = ({ events }) => {
  const latestEvents = events.slice(-5).reverse();

  return (
    <div className="space-y-2">
      {latestEvents.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          Waiting for first blood...
        </p>
      ) : (
        latestEvents.map((event, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <span className={event.team === 'team1' ? 'text-blue-600' : 'text-red-600'}>
              {event.killer}
            </span>
            <span className="text-gray-400">eliminated</span>
            <span className={event.victim_team === 'team1' ? 'text-blue-600' : 'text-red-600'}>
              {event.victim}
            </span>
          </div>
        ))
      )}
    </div>
  );
};

// Live Player Stats
const LivePlayerStats = ({ players = [] }) => {
  const [sortBy, setSortBy] = useState('kills');

  const sortedPlayers = [...players].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">Player Stats</h3>
        <button 
          onClick={() => setSortBy(sortBy === 'kills' ? 'assists' : 'kills')}
          className="text-sm text-gray-500 flex items-center"
        >
          Sort: {sortBy} <ChevronDown className="w-4 h-4 ml-1" />
        </button>
      </div>

      <div className="space-y-2">
        {sortedPlayers.map(player => (
          <PlayerStatRow key={player.id} player={player} />
        ))}
      </div>
    </div>
  );
};

// Player Stat Row
const PlayerStatRow = ({ player }) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center space-x-3">
        <img 
          src={getHeroImageSync(player.hero)}
          alt=""
          className="w-8 h-8 rounded-full"
        />
        <div>
          <div className="font-medium text-sm">{player.name}</div>
          <div className="text-xs text-gray-500">{player.hero}</div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 text-sm">
        <div className="text-center">
          <div className="font-bold">{player.kills}</div>
          <div className="text-xs text-gray-500">K</div>
        </div>
        <div className="text-center">
          <div className="font-bold">{player.deaths}</div>
          <div className="text-xs text-gray-500">D</div>
        </div>
        <div className="text-center">
          <div className="font-bold">{player.assists}</div>
          <div className="text-xs text-gray-500">A</div>
        </div>
      </div>
    </div>
  );
};

// Notification Prompt Modal
const NotificationPrompt = ({ onEnable, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full">
        <div className="text-center mb-4">
          <Bell className="w-12 h-12 mx-auto mb-2 text-red-600" />
          <h3 className="text-lg font-bold">Enable Match Notifications?</h3>
          <p className="text-sm text-gray-500 mt-2">
            Get notified when the match starts, ends, or when major events happen
          </p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
          >
            Not Now
          </button>
          <button
            onClick={onEnable}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileMatchDetail;