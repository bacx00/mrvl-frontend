'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import BroadcastView from '../../components/broadcast/BroadcastView';

/**
 * BROADCAST PAGE - OBS STUDIO INTEGRATION
 * 
 * This page provides direct URLs for OBS Studio and other streaming software
 * to capture clean broadcast overlays without any website UI elements
 * 
 * URL Examples:
 * /broadcast?match=123&view=overlay&ratio=16:9
 * /broadcast?match=123&view=pre-match&overlay=scoreboard
 * /broadcast?match=123&view=full-screen&chroma=true
 * 
 * Features:
 * - Zero UI chrome (perfect for OBS capture)
 * - Multiple aspect ratio support
 * - Chroma key background support
 * - Real-time data updates
 * - Keyboard shortcuts for broadcast operators
 */

function BroadcastContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Extract URL parameters
  const matchId = searchParams.get('match');
  const viewType = searchParams.get('view') || 'overlay';
  const aspectRatio = searchParams.get('ratio') || '16:9';
  const chromaKey = searchParams.get('chroma') === 'true';
  const overlay = searchParams.get('overlay') || 'scoreboard';
  const size = searchParams.get('size') || 'large';
  const position = searchParams.get('position') || 'bottom';

  // State for broadcast settings
  const [settings, setSettings] = useState({
    matchId,
    viewType,
    aspectRatio,
    chromaKey,
    overlay,
    size,
    position
  });

  const [showHelp, setShowHelp] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  // Update URL when settings change
  useEffect(() => {
    const params = new URLSearchParams();
    if (settings.matchId) params.set('match', settings.matchId);
    if (settings.viewType !== 'overlay') params.set('view', settings.viewType);
    if (settings.aspectRatio !== '16:9') params.set('ratio', settings.aspectRatio);
    if (settings.chromaKey) params.set('chroma', 'true');
    if (settings.overlay !== 'scoreboard') params.set('overlay', settings.overlay);
    if (settings.size !== 'large') params.set('size', settings.size);
    if (settings.position !== 'bottom') params.set('position', settings.position);

    const newUrl = `/broadcast${params.toString() ? `?${params.toString()}` : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [settings]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e) => {
      // F11 for fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen();
          setFullscreen(true);
        } else {
          document.exitFullscreen();
          setFullscreen(false);
        }
      }

      // F1 for help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowHelp(!showHelp);
      }

      // Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setSettings(prev => ({ ...prev, viewType: 'overlay' }));
            break;
          case '2':
            e.preventDefault();
            setSettings(prev => ({ ...prev, viewType: 'pre-match' }));
            break;
          case '3':
            e.preventDefault();
            setSettings(prev => ({ ...prev, viewType: 'full-screen' }));
            break;
          case 'c':
            e.preventDefault();
            setSettings(prev => ({ ...prev, chromaKey: !prev.chromaKey }));
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [showHelp]);

  // Error state
  if (!matchId) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl">📺</div>
          <h1 className="text-3xl font-bold">Broadcast Page</h1>
          <p className="text-gray-400">No match ID provided</p>
          <p className="text-sm text-gray-500">
            Add ?match=ID to the URL to display broadcast overlay
          </p>
          
          {/* Quick Setup Examples */}
          <div className="mt-8 space-y-2 text-left bg-gray-900 p-4 rounded-lg max-w-2xl">
            <h3 className="text-lg font-bold mb-2">Example URLs:</h3>
            <div className="text-sm text-gray-300 space-y-1 font-mono">
              <div>/broadcast?match=123&view=overlay</div>
              <div>/broadcast?match=123&view=pre-match</div>
              <div>/broadcast?match=123&chroma=true</div>
              <div>/broadcast?match=123&ratio=21:9&size=xl</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/90 text-white z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 p-6 rounded-lg max-w-2xl">
            <h2 className="text-2xl font-bold mb-4">Broadcast Help</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h3 className="font-bold mb-2">Keyboard Shortcuts</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>F1: Toggle Help</li>
                  <li>F11: Toggle Fullscreen</li>
                  <li>Ctrl/Cmd + 1: Overlay View</li>
                  <li>Ctrl/Cmd + 2: Pre-Match View</li>
                  <li>Ctrl/Cmd + 3: Full Screen View</li>
                  <li>Ctrl/Cmd + C: Toggle Chroma Key</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-2">URL Parameters</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>match: Match ID (required)</li>
                  <li>view: overlay|pre-match|full-screen</li>
                  <li>ratio: 16:9|21:9|4:3|1:1|9:16</li>
                  <li>chroma: true for green screen</li>
                  <li>size: small|medium|large|xl</li>
                  <li>position: top|bottom|center</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="font-bold mb-2">For OBS Studio</h3>
              <p className="text-gray-300 text-sm">
                1. Add Browser Source in OBS
                2. Use this page's URL as the source
                3. Set width/height to match your stream resolution
                4. Enable chroma key for transparent background
              </p>
            </div>

            <button 
              onClick={() => setShowHelp(false)}
              className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
            >
              Close Help
            </button>
          </div>
        </div>
      )}

      {/* Main Broadcast View */}
      <BroadcastView 
        matchId={settings.matchId}
        viewType={settings.viewType}
        aspectRatio={settings.aspectRatio}
      />

      {/* Debug Info (only show in development or with debug param) */}
      {(process.env.NODE_ENV === 'development' || searchParams.get('debug') === 'true') && (
        <div className="fixed top-4 left-4 bg-black/80 text-white text-xs p-3 rounded font-mono z-40">
          <div className="font-bold mb-1">Broadcast Debug Info</div>
          <div>Match: {settings.matchId}</div>
          <div>View: {settings.viewType}</div>
          <div>Ratio: {settings.aspectRatio}</div>
          <div>Chroma: {settings.chromaKey ? 'ON' : 'OFF'}</div>
          <div>Size: {settings.size}</div>
          <div>Position: {settings.position}</div>
          <div className="mt-2 pt-2 border-t border-gray-600">
            <div>Resolution: {window.innerWidth}x{window.innerHeight}</div>
            <div>Fullscreen: {fullscreen ? 'Yes' : 'No'}</div>
          </div>
        </div>
      )}

      {/* Settings Panel Toggle (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            onClick={() => setShowHelp(true)}
            className="bg-gray-800 text-white p-2 rounded shadow-lg hover:bg-gray-700 transition-colors"
          >
            ⚙️
          </button>
        </div>
      )}
    </div>
  );
}

export default function BroadcastPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading broadcast view...</div>
      </div>
    }>
      <BroadcastContent />
    </Suspense>
  );
}