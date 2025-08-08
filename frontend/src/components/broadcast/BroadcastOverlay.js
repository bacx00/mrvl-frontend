import React, { useState, useEffect, useRef } from 'react';
import { getHeroImageSync, getHeroRole, getCountryFlag } from '../../utils/imageUtils';
import { HEROES, GAME_MODES, MAPS } from '../../constants/marvelRivalsData';

/**
 * BROADCAST OVERLAY SYSTEM - ESPORTS PRODUCTION READY
 * 
 * This component creates clean, customizable overlays for streaming broadcasts
 * Perfect for tournaments, live streams, and official broadcasts
 * 
 * Features:
 * - Clean minimal UI optimized for streaming
 * - Hero pick/ban overlay
 * - Live score updates
 * - Team information displays
 * - Customizable positioning and sizing
 * - Professional esports styling
 */

const BroadcastOverlay = ({ 
  match, 
  overlayType = 'scoreboard',
  position = 'bottom',
  size = 'medium',
  theme = 'dark',
  customization = {}
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [currentHeroPicks, setCurrentHeroPicks] = useState({ team1: [], team2: [] });
  const [liveStats, setLiveStats] = useState({ team1_score: 0, team2_score: 0, timer: '00:00' });
  
  const overlayRef = useRef(null);

  // Overlay positioning styles
  const getPositionStyles = () => {
    const positions = {
      'top': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom': 'bottom-4 left-1/2 transform -translate-x-1/2',
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
      'center': 'top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
    };
    return positions[position] || positions.bottom;
  };

  // Size variants
  const getSizeStyles = () => {
    const sizes = {
      'small': 'text-sm scale-75',
      'medium': 'text-base scale-100',
      'large': 'text-lg scale-110',
      'xl': 'text-xl scale-125'
    };
    return sizes[size] || sizes.medium;
  };

  // Theme variants
  const getThemeStyles = () => {
    const themes = {
      'dark': 'bg-black/80 text-white border-gray-700',
      'light': 'bg-white/90 text-black border-gray-300',
      'minimal': 'bg-black/60 text-white border-transparent',
      'branded': 'bg-gradient-to-r from-purple-900/90 to-blue-900/90 text-white border-purple-500'
    };
    return themes[theme] || themes.dark;
  };

  // Scoreboard Overlay Component
  const ScoreboardOverlay = () => (
    <div className={`flex items-center space-x-6 px-6 py-3 rounded-lg border backdrop-blur-sm ${getThemeStyles()}`}>
      {/* Team 1 */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
          {match?.team1?.logo ? (
            <img 
              src={match.team1.logo} 
              alt={match.team1.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
              {(match?.team1?.short_name || match?.team1?.name || 'T1').slice(0, 2)}
            </div>
          )}
        </div>
        <span className="font-bold text-lg">
          {match?.team1?.short_name || match?.team1?.name || 'Team 1'}
        </span>
        <span className="font-mono text-2xl font-bold text-blue-400">
          {liveStats.team1_score || match?.team1_score || 0}
        </span>
      </div>

      {/* VS Divider */}
      <div className="text-gray-400 font-bold">VS</div>

      {/* Team 2 */}
      <div className="flex items-center space-x-3">
        <span className="font-mono text-2xl font-bold text-red-400">
          {liveStats.team2_score || match?.team2_score || 0}
        </span>
        <span className="font-bold text-lg">
          {match?.team2?.short_name || match?.team2?.name || 'Team 2'}
        </span>
        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-700">
          {match?.team2?.logo ? (
            <img 
              src={match.team2.logo} 
              alt={match.team2.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold">
              {(match?.team2?.short_name || match?.team2?.name || 'T2').slice(0, 2)}
            </div>
          )}
        </div>
      </div>

      {/* Timer */}
      {liveStats.timer && liveStats.timer !== '00:00' && (
        <div className="ml-4 px-3 py-1 bg-red-600 rounded text-white font-mono font-bold">
          {liveStats.timer}
        </div>
      )}
    </div>
  );

  // Hero Pick Overlay Component
  const HeroPickOverlay = () => (
    <div className={`px-6 py-4 rounded-lg border backdrop-blur-sm ${getThemeStyles()}`}>
      <div className="text-center text-sm font-bold mb-3 text-gray-300">HERO SELECTION</div>
      <div className="flex justify-between items-center space-x-8">
        {/* Team 1 Heroes */}
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm font-bold text-blue-400">
            {match?.team1?.short_name || 'Team 1'}
          </div>
          <div className="flex space-x-1">
            {currentHeroPicks.team1.slice(0, 6).map((hero, index) => (
              <HeroPickCard key={index} hero={hero} />
            ))}
          </div>
        </div>

        {/* VS */}
        <div className="text-gray-400 font-bold text-lg">VS</div>

        {/* Team 2 Heroes */}
        <div className="flex flex-col items-center space-y-2">
          <div className="text-sm font-bold text-red-400">
            {match?.team2?.short_name || 'Team 2'}
          </div>
          <div className="flex space-x-1">
            {currentHeroPicks.team2.slice(0, 6).map((hero, index) => (
              <HeroPickCard key={index} hero={hero} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Individual Hero Pick Card
  const HeroPickCard = ({ hero }) => {
    const heroImage = getHeroImageSync(hero?.name || hero);
    const heroRole = getHeroRole(hero?.name || hero);
    
    const roleColors = {
      'Duelist': 'border-red-500',
      'Vanguard': 'border-blue-500', 
      'Strategist': 'border-green-500'
    };

    return (
      <div className={`w-12 h-12 rounded border-2 ${roleColors[heroRole] || 'border-gray-500'} overflow-hidden bg-gray-800`}>
        {heroImage ? (
          <img 
            src={heroImage}
            alt={hero?.name || hero}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
            {(hero?.name || hero || '?').slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    );
  };

  // Map Information Overlay
  const MapOverlay = () => (
    <div className={`px-4 py-2 rounded-lg backdrop-blur-sm ${getThemeStyles()}`}>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-300">MAP</span>
        <span className="font-bold">
          {match?.current_map || match?.maps?.[0]?.name || 'Unknown Map'}
        </span>
        <span className="text-sm text-gray-400">
          {match?.game_mode || 'Control'}
        </span>
      </div>
    </div>
  );

  // Series Information Overlay
  const SeriesOverlay = () => (
    <div className={`px-4 py-2 rounded-lg backdrop-blur-sm ${getThemeStyles()}`}>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-300">SERIES</span>
        <span className="font-bold">
          {match?.format || 'BO3'}
        </span>
        <span className="text-sm text-gray-400">
          Map {(match?.current_map_index || 0) + 1} of {match?.total_maps || 3}
        </span>
      </div>
    </div>
  );

  // Tournament Information Overlay
  const TournamentOverlay = () => (
    <div className={`px-4 py-2 rounded-lg backdrop-blur-sm ${getThemeStyles()}`}>
      <div className="flex items-center space-x-4">
        {match?.event?.logo && (
          <img 
            src={match.event.logo} 
            alt={match.event.name}
            className="w-6 h-6 object-cover rounded"
          />
        )}
        <span className="font-bold text-sm">
          {match?.event?.name || 'Tournament'}
        </span>
        {match?.round && (
          <span className="text-xs text-gray-400">
            {match.round}
          </span>
        )}
      </div>
    </div>
  );

  // Render different overlay types
  const renderOverlay = () => {
    switch (overlayType) {
      case 'scoreboard':
        return <ScoreboardOverlay />;
      case 'hero-picks':
        return <HeroPickOverlay />;
      case 'map-info':
        return <MapOverlay />;
      case 'series-info':
        return <SeriesOverlay />;
      case 'tournament-info':
        return <TournamentOverlay />;
      case 'combined':
        return (
          <div className="space-y-2">
            <ScoreboardOverlay />
            <div className="flex space-x-2">
              <MapOverlay />
              <SeriesOverlay />
            </div>
          </div>
        );
      default:
        return <ScoreboardOverlay />;
    }
  };

  // Keyboard shortcuts for broadcasters
  useEffect(() => {
    const handleKeyboard = (e) => {
      // Allow broadcasters to toggle overlay visibility with keyboard shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'h':
            e.preventDefault();
            setIsVisible(!isVisible);
            break;
          case '1':
            e.preventDefault();
            // Toggle to scoreboard
            break;
          case '2':
            e.preventDefault();
            // Toggle to hero picks
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isVisible]);

  // Auto-hide functionality for minimal distraction
  useEffect(() => {
    if (customization.autoHide) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, customization.autoHide * 1000);
      
      return () => clearTimeout(timer);
    }
  }, [customization.autoHide]);

  if (!isVisible || !match) return null;

  return (
    <div 
      ref={overlayRef}
      className={`fixed z-50 ${getPositionStyles()} ${getSizeStyles()}`}
      style={{
        ...customization.style,
        fontFamily: customization.fontFamily || 'system-ui, -apple-system, sans-serif'
      }}
    >
      {renderOverlay()}
      
      {/* Optional watermark for branded overlays */}
      {customization.watermark && (
        <div className="absolute bottom-1 right-2 text-xs text-gray-500 opacity-50">
          {customization.watermark}
        </div>
      )}
    </div>
  );
};

// Broadcast Control Panel for Operators
export const BroadcastControlPanel = ({ onOverlayChange, activeOverlays = [] }) => {
  const [overlaySettings, setOverlaySettings] = useState({
    scoreboard: { visible: true, position: 'bottom', size: 'medium' },
    heroPicks: { visible: false, position: 'top', size: 'medium' },
    mapInfo: { visible: false, position: 'top-left', size: 'small' },
    tournament: { visible: false, position: 'top-right', size: 'small' }
  });

  const toggleOverlay = (overlayType) => {
    const newSettings = {
      ...overlaySettings,
      [overlayType]: {
        ...overlaySettings[overlayType],
        visible: !overlaySettings[overlayType].visible
      }
    };
    setOverlaySettings(newSettings);
    onOverlayChange && onOverlayChange(newSettings);
  };

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-4">Broadcast Control Panel</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(overlaySettings).map(([type, settings]) => (
          <div key={type} className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium capitalize">
                {type.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                type="checkbox"
                checked={settings.visible}
                onChange={() => toggleOverlay(type)}
                className="toggle-checkbox"
              />
            </div>
            
            {settings.visible && (
              <div className="space-y-2">
                <select 
                  value={settings.position}
                  onChange={(e) => {
                    const newSettings = {
                      ...overlaySettings,
                      [type]: { ...settings, position: e.target.value }
                    };
                    setOverlaySettings(newSettings);
                    onOverlayChange && onOverlayChange(newSettings);
                  }}
                  className="w-full bg-gray-800 text-white text-xs rounded px-2 py-1"
                >
                  <option value="top">Top</option>
                  <option value="bottom">Bottom</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
                
                <select 
                  value={settings.size}
                  onChange={(e) => {
                    const newSettings = {
                      ...overlaySettings,
                      [type]: { ...settings, size: e.target.value }
                    };
                    setOverlaySettings(newSettings);
                    onOverlayChange && onOverlayChange(newSettings);
                  }}
                  className="w-full bg-gray-800 text-white text-xs rounded px-2 py-1"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                  <option value="xl">XL</option>
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Keyboard Shortcuts:</div>
          <div>Ctrl/Cmd + H: Toggle Visibility</div>
          <div>Ctrl/Cmd + 1-4: Switch Overlays</div>
        </div>
      </div>
    </div>
  );
};

export default BroadcastOverlay;