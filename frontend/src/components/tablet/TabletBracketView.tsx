// src/components/tablet/TabletBracketView.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Match, Tournament } from '@/lib/types';

interface TabletBracketViewProps {
  tournament: Tournament;
  matches: Match[];
  onMatchClick?: (match: Match) => void;
  className?: string;
}

type ViewMode = 'bracket' | 'list' | 'grid';

const TabletBracketView: React.FC<TabletBracketViewProps> = ({
  tournament,
  matches,
  onMatchClick,
  className = ''
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('bracket');
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const bracketRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group matches by round
  const matchesByRound = matches.reduce((acc, match) => {
    const round = match.round || 1;
    if (!acc[round]) acc[round] = [];
    acc[round].push(match);
    return acc;
  }, {} as Record<number, Match[]>);

  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  const maxRound = Math.max(...rounds);

  // Touch/Mouse event handlers for pan and zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      setPanOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Render match card
  const renderMatch = (match: Match, index: number) => (
    <div
      key={match.id}
      className="tablet-bracket-match-card tablet-touchable"
      onClick={() => onMatchClick?.(match)}
      style={{ marginBottom: index < matchesByRound[match.round || 1].length - 1 ? '16px' : '0' }}
    >
      <div className={`tablet-match-card ${match.status === 'live' ? 'live' : ''}`}>
        {/* Match Header */}
        <div className="tablet-match-header">
          <div className="tablet-match-format">{match.format || 'BO3'}</div>
          <div className={`tablet-match-status ${match.status}`}>
            {match.status === 'live' && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2"></div>
            )}
            {match.status.toUpperCase()}
          </div>
        </div>

        {/* Teams */}
        <div className="tablet-match-teams">
          {/* Team 1 */}
          <div className={`tablet-match-team ${match.team1_score > match.team2_score ? 'winner' : ''}`}>
            <div className="tablet-team-info">
              <div className="tablet-team-logo">
                {match.team1.logo ? (
                  <img src={match.team1.logo} alt={match.team1.name} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-sm font-bold">
                    {match.team1.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="tablet-team-name">{match.team1.name}</div>
            </div>
            <div className={`tablet-team-score ${match.team1_score > match.team2_score ? 'winner' : ''}`}>
              {match.team1_score}
            </div>
          </div>

          {/* Team 2 */}
          <div className={`tablet-match-team ${match.team2_score > match.team1_score ? 'winner' : ''}`}>
            <div className="tablet-team-info">
              <div className="tablet-team-logo">
                {match.team2.logo ? (
                  <img src={match.team2.logo} alt={match.team2.name} className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center text-sm font-bold">
                    {match.team2.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="tablet-team-name">{match.team2.name}</div>
            </div>
            <div className={`tablet-team-score ${match.team2_score > match.team1_score ? 'winner' : ''}`}>
              {match.team2_score}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`tablet-bracket-multi-view ${className}`}>
      
      {/* Controls */}
      <div className="tablet-bracket-controls">
        <div className="tablet-bracket-view-modes">
          <button
            className={`tablet-bracket-view-mode ${viewMode === 'bracket' ? 'active' : ''}`}
            onClick={() => setViewMode('bracket')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m0 0V1m0 2h4m0 0V1m0 2h4a1 1 0 011 1v4M3 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Bracket
          </button>
          <button
            className={`tablet-bracket-view-mode ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            List
          </button>
          <button
            className={`tablet-bracket-view-mode ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </button>
        </div>

        {/* Zoom Controls */}
        {viewMode === 'bracket' && (
          <div className="tablet-zoom-controls">
            <button
              className="tablet-zoom-button"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <button
              className="tablet-zoom-button"
              onClick={resetView}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              className="tablet-zoom-button"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
        )}

        {/* Round Selector */}
        <div className="tablet-bracket-view-modes">
          {rounds.map(round => (
            <button
              key={round}
              className={`tablet-bracket-view-mode ${selectedRound === round ? 'active' : ''}`}
              onClick={() => setSelectedRound(round)}
            >
              {round === maxRound ? 'Final' : `Round ${round}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Bracket View */}
      <div className="tablet-bracket-main" ref={containerRef}>
        
        {/* Bracket View */}
        {viewMode === 'bracket' && (
          <div
            ref={bracketRef}
            className="tablet-bracket-viewport tablet-pinch-zoom tablet-pan-container"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div className="tablet-bracket-content">
              {rounds.map(round => (
                <div key={round} className="tablet-bracket-round">
                  <div className="tablet-bracket-round-header">
                    {round === maxRound ? 'Final' : `Round ${round}`}
                  </div>
                  <div className="tablet-bracket-matches">
                    {matchesByRound[round]?.map((match, index) => renderMatch(match, index))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="tablet-match-listing p-6">
            <div className="tablet-match-column-header">
              {selectedRound === maxRound ? 'Final' : `Round ${selectedRound}`}
            </div>
            <div className="space-y-4 mt-4">
              {matchesByRound[selectedRound]?.map((match, index) => renderMatch(match, index))}
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="tablet-match-grid">
            {matchesByRound[selectedRound]?.map((match, index) => renderMatch(match, index))}
          </div>
        )}

        {/* Gesture Hint */}
        {viewMode === 'bracket' && (
          <div className="tablet-gesture-hint">
            Pinch to zoom • Drag to pan
          </div>
        )}
      </div>
    </div>
  );
};

export default TabletBracketView;