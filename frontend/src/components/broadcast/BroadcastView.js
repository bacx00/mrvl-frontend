import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks';
import BroadcastOverlay, { BroadcastControlPanel } from './BroadcastOverlay';
import { getHeroImageSync, getTeamLogoUrl, getCountryFlag } from '../../utils/imageUtils';

/**
 * BROADCAST VIEW - CLEAN INTERFACE FOR STREAMING
 * 
 * This provides a minimal, clean interface specifically designed for streaming overlays
 * Removes all unnecessary UI elements that would clutter a broadcast
 * Perfect for OBS Studio capture or other streaming software
 * 
 * Features:
 * - Ultra-minimal design optimized for streaming capture
 * - Green screen support with chroma key backgrounds
 * - Multiple aspect ratio support (16:9, 4:3, 21:9)
 * - Real-time match data integration
 * - Professional broadcast quality
 */

const BroadcastView = ({ matchId, viewType = 'overlay', aspectRatio = '16:9' }) => {
  const [match, setMatch] = useState(null);
  const [overlayConfig, setOverlayConfig] = useState({
    scoreboard: { visible: true, position: 'bottom', size: 'large' }
  });
  const [isControlPanelVisible, setIsControlPanelVisible] = useState(false);
  const [chromaKey, setChromaKey] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { api } = useAuth();
  const containerRef = useRef(null);

  // Fetch match data
  useEffect(() => {
    if (!matchId) return;

    const fetchMatchData = async () => {
      try {
        const response = await api.get(`/api/matches/${matchId}`);
        if (response.data && response.data.success) {
          setMatch(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching match data for broadcast:', error);
      }
    };

    fetchMatchData();
    
    // Poll for updates every 5 seconds for live matches
    const interval = setInterval(fetchMatchData, 5000);
    return () => clearInterval(interval);
  }, [matchId, api]);

  // Keyboard shortcuts for broadcast control
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            setIsControlPanelVisible(!isControlPanelVisible);
            break;
          case 'c':
            e.preventDefault();
            setChromaKey(!chromaKey);
            break;
          case 'r':
            e.preventDefault();
            setRefreshTrigger(prev => prev + 1);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isControlPanelVisible, chromaKey]);

  // Get aspect ratio styles
  const getAspectRatioStyles = () => {
    const ratios = {
      '16:9': 'aspect-[16/9]',
      '4:3': 'aspect-[4/3]',
      '21:9': 'aspect-[21/9]',
      '1:1': 'aspect-square',
      '9:16': 'aspect-[9/16]' // For vertical/mobile streams
    };
    return ratios[aspectRatio] || ratios['16:9'];
  };

  // Clean Match Info Component (minimal for broadcast)
  const CleanMatchInfo = () => {
    if (!match) return null;

    return (
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="flex justify-between items-start">
          {/* Tournament Info */}
          {match.event && (
            <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                {match.event.logo && (
                  <img 
                    src={match.event.logo} 
                    alt={match.event.name}
                    className="w-6 h-6 object-cover rounded"
                  />
                )}
                <span className="font-bold text-sm">{match.event.name}</span>
                {match.round && (
                  <span className="text-xs text-gray-300">• {match.round}</span>
                )}
              </div>
            </div>
          )}

          {/* Match Status */}
          <div className="bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
            <div className="flex items-center space-x-2">
              {match.status === 'live' && (
                <>
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-red-400">LIVE</span>
                </>
              )}
              {match.status === 'upcoming' && (
                <span className="text-sm font-bold text-yellow-400">UPCOMING</span>
              )}
              {match.status === 'completed' && (
                <span className="text-sm font-bold text-green-400">COMPLETED</span>
              )}
              <span className="text-xs text-gray-300">
                {match.format || 'BO3'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Team Lineup Display (for pre-match)
  const TeamLineupDisplay = ({ team, side = 'left' }) => {
    if (!team || !team.players) return null;

    const sideClasses = side === 'left' 
      ? 'left-4 items-start text-left' 
      : 'right-4 items-end text-right';

    return (
      <div className={`absolute top-20 ${sideClasses} z-10 max-w-xs`}>
        <div className="bg-black/70 backdrop-blur-sm text-white p-4 rounded-lg">
          {/* Team Header */}
          <div className={`flex items-center space-x-3 mb-3 ${side === 'right' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-800">
              {team.logo ? (
                <img 
                  src={getTeamLogoUrl(team)} 
                  alt={team.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold">
                  {(team.short_name || team.name).slice(0, 2)}
                </div>
              )}
            </div>
            <div className={side === 'right' ? 'text-right' : ''}>
              <div className="font-bold text-lg">{team.name}</div>
              <div className="text-xs text-gray-400 flex items-center">
                {getCountryFlag(team.country_code)}
                <span className="ml-1">{team.country_code}</span>
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="space-y-2">
            {team.players.slice(0, 6).map((player, index) => (
              <div key={index} className={`flex items-center space-x-2 ${side === 'right' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <div className="w-6 h-6 rounded-full bg-gray-700 overflow-hidden">
                  {player.avatar ? (
                    <img 
                      src={player.avatar} 
                      alt={player.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold">
                      {player.username.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className={`text-sm ${side === 'right' ? 'text-right' : ''}`}>
                  <div className="font-medium">{player.username}</div>
                  {player.hero && (
                    <div className="text-xs text-gray-400">{player.hero}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Different broadcast view types
  const renderBroadcastContent = () => {
    switch (viewType) {
      case 'overlay':
        return (
          <>
            {overlayConfig.scoreboard.visible && (
              <BroadcastOverlay 
                match={match}
                overlayType="scoreboard"
                position={overlayConfig.scoreboard.position}
                size={overlayConfig.scoreboard.size}
                theme="minimal"
              />
            )}
            {overlayConfig.heroPicks?.visible && (
              <BroadcastOverlay 
                match={match}
                overlayType="hero-picks"
                position={overlayConfig.heroPicks.position}
                size={overlayConfig.heroPicks.size}
                theme="minimal"
              />
            )}
          </>
        );

      case 'pre-match':
        return (
          <>
            <CleanMatchInfo />
            {match?.team1 && <TeamLineupDisplay team={match.team1} side="left" />}
            {match?.team2 && <TeamLineupDisplay team={match.team2} side="right" />}
          </>
        );

      case 'full-screen':
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white">
              <div className="text-6xl font-bold mb-4">
                {match?.team1?.short_name || 'TBD'} vs {match?.team2?.short_name || 'TBD'}
              </div>
              <div className="text-2xl text-gray-300">
                {match?.event?.name} • {match?.format || 'BO3'}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative">
      {/* Main Broadcast Container */}
      <div 
        ref={containerRef}
        className={`${getAspectRatioStyles()} w-full relative overflow-hidden ${
          chromaKey ? 'bg-green-500' : 'bg-transparent'
        }`}
        style={{
          backgroundColor: chromaKey ? '#00ff00' : 'transparent'
        }}
      >
        {/* Background for non-chroma key mode */}
        {!chromaKey && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black opacity-90" />
        )}

        {/* Broadcast Content */}
        {renderBroadcastContent()}

        {/* Debug Info (only visible in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-2 left-2 bg-black/80 text-white text-xs p-2 rounded">
            <div>Match ID: {matchId}</div>
            <div>View: {viewType}</div>
            <div>Ratio: {aspectRatio}</div>
            <div>Chroma: {chromaKey ? 'ON' : 'OFF'}</div>
          </div>
        )}
      </div>

      {/* Broadcast Control Panel (toggleable) */}
      {isControlPanelVisible && (
        <div className="fixed top-4 right-4 z-50">
          <BroadcastControlPanel 
            onOverlayChange={setOverlayConfig}
            activeOverlays={Object.keys(overlayConfig).filter(key => overlayConfig[key].visible)}
          />
          
          {/* Additional Broadcast Controls */}
          <div className="mt-4 bg-gray-900 text-white p-4 rounded-lg">
            <h4 className="font-bold mb-2">Broadcast Settings</h4>
            
            {/* View Type Selector */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">View Type</label>
              <select 
                value={viewType}
                onChange={(e) => {/* This would need to be handled by parent component */}}
                className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1"
              >
                <option value="overlay">Overlay Mode</option>
                <option value="pre-match">Pre-Match</option>
                <option value="full-screen">Full Screen</option>
              </select>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="mb-3">
              <label className="block text-xs font-medium mb-1">Aspect Ratio</label>
              <select 
                value={aspectRatio}
                onChange={(e) => {/* This would need to be handled by parent component */}}
                className="w-full bg-gray-800 text-white text-sm rounded px-2 py-1"
              >
                <option value="16:9">16:9 (Standard)</option>
                <option value="21:9">21:9 (Ultrawide)</option>
                <option value="4:3">4:3 (Classic)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="9:16">9:16 (Vertical)</option>
              </select>
            </div>

            {/* Chroma Key Toggle */}
            <div className="mb-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={chromaKey}
                  onChange={(e) => setChromaKey(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Chroma Key Background</span>
              </label>
            </div>

            {/* Shortcuts */}
            <div className="text-xs text-gray-400 border-t border-gray-700 pt-2 mt-2">
              <div className="font-medium mb-1">Shortcuts:</div>
              <div>Ctrl+B: Toggle Panel</div>
              <div>Ctrl+C: Toggle Chroma Key</div>
              <div>Ctrl+R: Refresh Data</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// URL-based Broadcast View for easy OBS integration
export const BroadcastViewURL = ({ searchParams }) => {
  const matchId = searchParams.get('match');
  const viewType = searchParams.get('view') || 'overlay';
  const aspectRatio = searchParams.get('ratio') || '16:9';
  const overlay = searchParams.get('overlay') || 'scoreboard';

  return (
    <BroadcastView 
      matchId={matchId}
      viewType={viewType}
      aspectRatio={aspectRatio}
    />
  );
};

export default BroadcastView;