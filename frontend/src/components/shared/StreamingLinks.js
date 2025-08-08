import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

/**
 * STREAMING LINKS COMPONENT - ENHANCED FOR BROADCAST INTEGRATION
 * 
 * Handles all streaming-related functionality:
 * - Live stream links with platform detection
 * - VOD (Video on Demand) links with timestamps
 * - Betting integration with odds display
 * - Analytics tracking for engagement
 * - Multi-platform support (Twitch, YouTube, etc.)
 */

const StreamingLinks = ({ 
  match, 
  size = 'default', 
  layout = 'horizontal',
  showLabels = true,
  trackAnalytics = true 
}) => {
  const [streamStatus, setStreamStatus] = useState({});
  const [viewerCounts, setViewerCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const { api } = useAuth();

  // Platform detection and styling
  const getPlatformInfo = (url) => {
    const platforms = {
      'twitch.tv': {
        name: 'Twitch',
        icon: '🟣',
        color: 'purple',
        bgClass: 'bg-purple-600 hover:bg-purple-700'
      },
      'youtube.com': {
        name: 'YouTube',
        icon: '🔴',
        color: 'red',
        bgClass: 'bg-red-600 hover:bg-red-700'
      },
      'youtu.be': {
        name: 'YouTube',
        icon: '🔴',
        color: 'red',
        bgClass: 'bg-red-600 hover:bg-red-700'
      },
      'facebook.com': {
        name: 'Facebook',
        icon: '🔵',
        color: 'blue',
        bgClass: 'bg-blue-600 hover:bg-blue-700'
      },
      'kick.com': {
        name: 'Kick',
        icon: '🟢',
        color: 'green',
        bgClass: 'bg-green-600 hover:bg-green-700'
      },
      'discord.gg': {
        name: 'Discord',
        icon: '💬',
        color: 'indigo',
        bgClass: 'bg-indigo-600 hover:bg-indigo-700'
      }
    };

    for (const [domain, info] of Object.entries(platforms)) {
      if (url.includes(domain)) {
        return info;
      }
    }

    return {
      name: 'Stream',
      icon: '📺',
      color: 'gray',
      bgClass: 'bg-gray-600 hover:bg-gray-700'
    };
  };

  // Track analytics when user clicks links
  const trackClick = async (type, url, platform) => {
    if (!trackAnalytics || !match?.id) return;

    try {
      await api.post('/api/analytics/stream-click', {
        match_id: match.id,
        type: type, // 'stream', 'vod', 'betting'
        url: url,
        platform: platform,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  // Check stream status and viewer counts
  useEffect(() => {
    if (!match?.stream_urls?.length) return;

    const checkStreamStatus = async () => {
      setLoading(true);
      try {
        const promises = match.stream_urls.map(async (url) => {
          try {
            const response = await api.get('/api/streams/status', {
              params: { url }
            });
            return { url, ...response.data };
          } catch (error) {
            return { url, live: false, viewers: 0 };
          }
        });

        const results = await Promise.all(promises);
        const statusMap = {};
        const viewerMap = {};

        results.forEach(result => {
          statusMap[result.url] = result.live;
          viewerMap[result.url] = result.viewers;
        });

        setStreamStatus(statusMap);
        setViewerCounts(viewerMap);
      } catch (error) {
        console.error('Failed to check stream status:', error);
      }
      setLoading(false);
    };

    checkStreamStatus();
    
    // Update every 30 seconds for live streams
    const interval = setInterval(checkStreamStatus, 30000);
    return () => clearInterval(interval);
  }, [match?.stream_urls, api]);

  // Size variants
  const getSizeClasses = () => {
    const sizes = {
      'small': 'px-3 py-1 text-sm',
      'default': 'px-4 py-2 text-base',
      'large': 'px-6 py-3 text-lg',
      'xl': 'px-8 py-4 text-xl'
    };
    return sizes[size] || sizes.default;
  };

  // Stream Links Component
  const StreamLinks = () => {
    const streamUrls = match?.stream_urls || (match?.stream_url ? [match.stream_url] : []);
    
    if (!streamUrls.length || !streamUrls.some(url => url)) return null;

    return (
      <div className="space-y-2">
        {showLabels && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            📺 Live Streams
            {loading && <div className="ml-2 animate-spin w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full"></div>}
          </div>
        )}
        
        <div className={`flex ${layout === 'vertical' ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
          {streamUrls.filter(url => url).map((url, index) => {
            const platform = getPlatformInfo(url);
            const isLive = streamStatus[url];
            const viewers = viewerCounts[url];
            
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('stream', url, platform.name)}
                className={`
                  flex items-center justify-center space-x-2 rounded-lg font-medium 
                  transition-all duration-200 ${platform.bgClass} text-white
                  ${getSizeClasses()} relative overflow-hidden
                  transform hover:scale-105 active:scale-95
                  shadow-lg hover:shadow-xl
                `}
              >
                {/* Live indicator */}
                {isLive && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                )}
                
                <span className="text-lg">{platform.icon}</span>
                <span>{platform.name}</span>
                {index > 0 && <span className="text-xs opacity-75">#{index + 1}</span>}
                
                {/* Viewer count */}
                {viewers > 0 && (
                  <span className="text-xs opacity-75 bg-black/20 px-2 py-0.5 rounded-full">
                    {viewers.toLocaleString()}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  // VOD Links Component
  const VODLinks = () => {
    const vodUrls = match?.vod_urls || (match?.vod_url ? [match.vod_url] : []);
    
    if (!vodUrls.length || !vodUrls.some(url => url)) return null;

    return (
      <div className="space-y-2">
        {showLabels && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🎬 Video on Demand
          </div>
        )}
        
        <div className={`flex ${layout === 'vertical' ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
          {vodUrls.filter(url => url).map((url, index) => {
            const platform = getPlatformInfo(url);
            
            return (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('vod', url, platform.name)}
                className={`
                  flex items-center justify-center space-x-2 rounded-lg font-medium 
                  transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white
                  ${getSizeClasses()}
                  transform hover:scale-105 active:scale-95
                  shadow-lg hover:shadow-xl
                `}
              >
                <span className="text-lg">🎬</span>
                <span>VOD</span>
                {index > 0 && <span className="text-xs opacity-75">#{index + 1}</span>}
                
                {/* Platform indicator */}
                <span className="text-xs opacity-75">
                  {platform.name}
                </span>
              </a>
            );
          })}
        </div>
      </div>
    );
  };

  // Betting Links Component  
  const BettingLinks = () => {
    const bettingUrls = match?.betting_urls || (match?.betting_url ? [match.betting_url] : []);
    
    if (!bettingUrls.length || !bettingUrls.some(url => url)) return null;

    const getBettingPlatform = (url) => {
      const platforms = {
        'bet365.com': 'Bet365',
        'draftkings.com': 'DraftKings', 
        'fanduel.com': 'FanDuel',
        'betway.com': 'Betway',
        'unibet.com': 'Unibet',
        'pinnacle.com': 'Pinnacle'
      };

      for (const [domain, name] of Object.entries(platforms)) {
        if (url.includes(domain)) {
          return name;
        }
      }
      return 'Betting Site';
    };

    return (
      <div className="space-y-2">
        {showLabels && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            💰 Betting Sites
          </div>
        )}
        
        <div className={`flex ${layout === 'vertical' ? 'flex-col space-y-2' : 'flex-wrap gap-2'}`}>
          {bettingUrls.filter(url => url).map((url, index) => (
            <a
              key={index}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('betting', url, getBettingPlatform(url))}
              className={`
                flex items-center justify-center space-x-2 rounded-lg font-medium 
                transition-all duration-200 bg-green-600 hover:bg-green-700 text-white
                ${getSizeClasses()}
                transform hover:scale-105 active:scale-95
                shadow-lg hover:shadow-xl
              `}
            >
              <span className="text-lg">💰</span>
              <span>{getBettingPlatform(url)}</span>
              {index > 0 && <span className="text-xs opacity-75">#{index + 1}</span>}
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced VOD with timestamps
  const VODWithTimestamps = () => {
    if (!match?.maps?.length) return <VODLinks />;

    return (
      <div className="space-y-3">
        {showLabels && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            🎬 Match VODs
          </div>
        )}

        {match.maps.map((map, mapIndex) => (
          <div key={mapIndex} className="space-y-2">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Map {mapIndex + 1}: {map.name}
            </div>
            
            {map.vod_urls?.map((vodUrl, vodIndex) => {
              const platform = getPlatformInfo(vodUrl);
              
              return (
                <div key={vodIndex} className="flex items-center space-x-2">
                  <a
                    href={vodUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackClick('vod', vodUrl, platform.name)}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    <span>🎬</span>
                    <span>{platform.name} VOD</span>
                  </a>
                  
                  {map.vod_timestamp && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Starts at {map.vod_timestamp}
                    </span>
                  )}
                </div>
              );
            })} 
          </div>
        ))}
      </div>
    );
  };

  if (!match) return null;

  return (
    <div className="space-y-4">
      <StreamLinks />
      <VODWithTimestamps />
      <BettingLinks />
    </div>
  );
};

// Compact version for overlays and smaller displays
export const CompactStreamingLinks = ({ match, type = 'stream' }) => {
  const { api } = useAuth();

  const trackClick = async (clickType, url, platform) => {
    try {
      await api.post('/api/analytics/stream-click', {
        match_id: match?.id,
        type: clickType,
        url: url,
        platform: platform,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const renderLinks = () => {
    switch (type) {
      case 'stream':
        const streamUrls = match?.stream_urls || (match?.stream_url ? [match.stream_url] : []);
        return streamUrls.filter(url => url).map((url, index) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('stream', url, 'Stream')}
            className="flex items-center justify-center w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title={`Stream ${index + 1}`}
          >
            📺
          </a>
        ));
        
      case 'vod':
        const vodUrls = match?.vod_urls || (match?.vod_url ? [match.vod_url] : []);
        return vodUrls.filter(url => url).map((url, index) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('vod', url, 'VOD')}
            className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            title={`VOD ${index + 1}`}
          >
            🎬
          </a>
        ));
        
      case 'betting':
        const bettingUrls = match?.betting_urls || (match?.betting_url ? [match.betting_url] : []);
        return bettingUrls.filter(url => url).map((url, index) => (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('betting', url, 'Betting')}
            className="flex items-center justify-center w-10 h-10 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            title={`Betting Site ${index + 1}`}
          >
            💰
          </a>
        ));
        
      default:
        return null;
    }
  };

  const links = renderLinks();
  if (!links?.length) return null;

  return (
    <div className="flex space-x-2">
      {links}
    </div>
  );
};

export default StreamingLinks;