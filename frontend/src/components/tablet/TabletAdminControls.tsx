// src/components/tablet/TabletAdminControls.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Match, Tournament, Team } from '@/lib/types';

interface TabletAdminControlsProps {
  match?: Match;
  tournament?: Tournament;
  onScoreUpdate?: (teamId: string, score: number) => void;
  onStatusChange?: (status: 'scheduled' | 'live' | 'completed' | 'cancelled') => void;
  onMapUpdate?: (mapIndex: number, data: any) => void;
  className?: string;
}

type AdminView = 'scoring' | 'bracket' | 'teams' | 'settings';
type InputMode = 'touch' | 'keyboard';

const TabletAdminControls: React.FC<TabletAdminControlsProps> = ({
  match,
  tournament,
  onScoreUpdate,
  onStatusChange,
  onMapUpdate,
  className = ''
}) => {
  const [activeView, setActiveView] = useState<AdminView>('scoring');
  const [inputMode, setInputMode] = useState<InputMode>('touch');
  const [team1Score, setTeam1Score] = useState(match?.team1_score || 0);
  const [team2Score, setTeam2Score] = useState(match?.team2_score || 0);
  const [isLiveMode, setIsLiveMode] = useState(match?.status === 'live');
  const [selectedMap, setSelectedMap] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>('');
  
  const scoreInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  // Update local state when match changes
  useEffect(() => {
    if (match) {
      setTeam1Score(match.team1_score || 0);
      setTeam2Score(match.team2_score || 0);
      setIsLiveMode(match.status === 'live');
    }
  }, [match]);

  // Quick score adjustment buttons
  const adjustScore = (team: 'team1' | 'team2', delta: number) => {
    const currentScore = team === 'team1' ? team1Score : team2Score;
    const newScore = Math.max(0, currentScore + delta);
    
    if (team === 'team1') {
      setTeam1Score(newScore);
      onScoreUpdate?.(match?.team1.id || '', newScore);
    } else {
      setTeam2Score(newScore);
      onScoreUpdate?.(match?.team2.id || '', newScore);
    }
  };

  // Handle status changes with confirmation
  const handleStatusChange = (status: 'scheduled' | 'live' | 'completed' | 'cancelled') => {
    setPendingAction(`Change match status to ${status}`);
    setShowConfirmation(true);
    
    setTimeout(() => {
      setShowConfirmation(false);
      onStatusChange?.(status);
      setIsLiveMode(status === 'live');
    }, 1500);
  };

  // Render touch-optimized number pad
  const renderNumberPad = (team: 'team1' | 'team2') => {
    const currentScore = team === 'team1' ? team1Score : team2Score;
    
    return (
      <div className="tablet-admin-numberpad">
        <div className="tablet-admin-score-display">
          <span className="text-3xl font-bold">{currentScore}</span>
        </div>
        
        <div className="tablet-admin-numberpad-grid">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              className="tablet-admin-number-btn"
              onClick={() => {
                const newScore = parseInt(currentScore.toString() + num.toString());
                if (team === 'team1') {
                  setTeam1Score(newScore);
                  onScoreUpdate?.(match?.team1.id || '', newScore);
                } else {
                  setTeam2Score(newScore);
                  onScoreUpdate?.(match?.team2.id || '', newScore);
                }
              }}
            >
              {num}
            </button>
          ))}
          <button
            className="tablet-admin-number-btn tablet-admin-clear-btn"
            onClick={() => {
              if (team === 'team1') {
                setTeam1Score(0);
                onScoreUpdate?.(match?.team1.id || '', 0);
              } else {
                setTeam2Score(0);
                onScoreUpdate?.(match?.team2.id || '', 0);
              }
            }}
          >
            Clear
          </button>
          <button
            className="tablet-admin-number-btn"
            onClick={() => {
              if (team === 'team1') {
                setTeam1Score(0);
                onScoreUpdate?.(match?.team1.id || '', 0);
              } else {
                setTeam2Score(0);
                onScoreUpdate?.(match?.team2.id || '', 0);
              }
            }}
          >
            0
          </button>
          <button
            className="tablet-admin-number-btn tablet-admin-backspace-btn"
            onClick={() => {
              const currentStr = currentScore.toString();
              const newScore = currentStr.length > 1 ? parseInt(currentStr.slice(0, -1)) : 0;
              if (team === 'team1') {
                setTeam1Score(newScore);
                onScoreUpdate?.(match?.team1.id || '', newScore);
              } else {
                setTeam2Score(newScore);
                onScoreUpdate?.(match?.team2.id || '', newScore);
              }
            }}
          >
            ⌫
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`tablet-admin-controls ${className}`}>
      
      {/* Header with View Tabs */}
      <div className="tablet-admin-header">
        <div className="tablet-admin-tabs">
          {(['scoring', 'bracket', 'teams', 'settings'] as AdminView[]).map(view => (
            <button
              key={view}
              className={`tablet-admin-tab ${activeView === view ? 'active' : ''}`}
              onClick={() => setActiveView(view)}
            >
              <div className="tablet-admin-tab-icon">
                {view === 'scoring' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                )}
                {view === 'bracket' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4a1 1 0 011-1h4m0 0V1m0 2h4m0 0V1m0 2h4a1 1 0 011 1v4M3 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {view === 'teams' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
                {view === 'settings' && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </div>
              <span className="tablet-admin-tab-label">{view.charAt(0).toUpperCase() + view.slice(1)}</span>
            </button>
          ))}
        </div>

        {/* Input Mode Toggle */}
        <div className="tablet-admin-input-mode">
          <button
            className={`tablet-admin-mode-btn ${inputMode === 'touch' ? 'active' : ''}`}
            onClick={() => setInputMode('touch')}
          >
            Touch
          </button>
          <button
            className={`tablet-admin-mode-btn ${inputMode === 'keyboard' ? 'active' : ''}`}
            onClick={() => setInputMode('keyboard')}
          >
            Keyboard
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="tablet-admin-content">
        
        {/* Live Scoring View */}
        {activeView === 'scoring' && match && (
          <div className="tablet-admin-scoring">
            
            {/* Match Status Controls */}
            <div className="tablet-admin-status-controls">
              <div className="tablet-admin-status-indicator">
                <div className={`tablet-admin-status-dot ${match.status}`}></div>
                <span className="tablet-admin-status-text">{match.status.toUpperCase()}</span>
              </div>
              
              <div className="tablet-admin-status-actions">
                <button
                  className={`tablet-admin-status-btn ${isLiveMode ? 'active' : ''}`}
                  onClick={() => handleStatusChange(isLiveMode ? 'completed' : 'live')}
                >
                  {isLiveMode ? 'End Match' : 'Start Match'}
                </button>
              </div>
            </div>

            {/* Teams and Scores */}
            <div className="tablet-admin-teams-scoring">
              
              {/* Team 1 */}
              <div className="tablet-admin-team-section">
                <div className="tablet-admin-team-header">
                  <div className="tablet-admin-team-info">
                    {match.team1.logo && (
                      <img src={match.team1.logo} alt={match.team1.name} className="w-12 h-12 object-contain" />
                    )}
                    <div>
                      <h3 className="tablet-admin-team-name">{match.team1.name}</h3>
                      <p className="tablet-admin-team-region">{match.team1.region}</p>
                    </div>
                  </div>
                </div>
                
                {inputMode === 'touch' ? (
                  <div className="tablet-admin-touch-controls">
                    <div className="tablet-admin-quick-actions">
                      <button
                        className="tablet-admin-score-btn minus"
                        onClick={() => adjustScore('team1', -1)}
                      >
                        -1
                      </button>
                      <div className="tablet-admin-score-display">
                        <span>{team1Score}</span>
                      </div>
                      <button
                        className="tablet-admin-score-btn plus"
                        onClick={() => adjustScore('team1', 1)}
                      >
                        +1
                      </button>
                    </div>
                    {renderNumberPad('team1')}
                  </div>
                ) : (
                  <div className="tablet-admin-keyboard-controls">
                    <input
                      ref={el => scoreInputRefs.current['team1'] = el}
                      type="number"
                      value={team1Score}
                      onChange={(e) => {
                        const score = parseInt(e.target.value) || 0;
                        setTeam1Score(score);
                        onScoreUpdate?.(match.team1.id, score);
                      }}
                      className="tablet-admin-score-input"
                      min="0"
                    />
                  </div>
                )}
              </div>

              {/* VS Divider */}
              <div className="tablet-admin-vs-divider">
                <div className="tablet-admin-vs-circle">
                  <span>VS</span>
                </div>
                {isLiveMode && (
                  <div className="tablet-admin-live-timer">
                    <div className="tablet-admin-timer-display">45:23</div>
                    <div className="tablet-admin-timer-controls">
                      <button className="tablet-admin-timer-btn">Pause</button>
                      <button className="tablet-admin-timer-btn">Reset</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Team 2 */}
              <div className="tablet-admin-team-section">
                <div className="tablet-admin-team-header">
                  <div className="tablet-admin-team-info">
                    {match.team2.logo && (
                      <img src={match.team2.logo} alt={match.team2.name} className="w-12 h-12 object-contain" />
                    )}
                    <div>
                      <h3 className="tablet-admin-team-name">{match.team2.name}</h3>
                      <p className="tablet-admin-team-region">{match.team2.region}</p>
                    </div>
                  </div>
                </div>
                
                {inputMode === 'touch' ? (
                  <div className="tablet-admin-touch-controls">
                    <div className="tablet-admin-quick-actions">
                      <button
                        className="tablet-admin-score-btn minus"
                        onClick={() => adjustScore('team2', -1)}
                      >
                        -1
                      </button>
                      <div className="tablet-admin-score-display">
                        <span>{team2Score}</span>
                      </div>
                      <button
                        className="tablet-admin-score-btn plus"
                        onClick={() => adjustScore('team2', 1)}
                      >
                        +1
                      </button>
                    </div>
                    {renderNumberPad('team2')}
                  </div>
                ) : (
                  <div className="tablet-admin-keyboard-controls">
                    <input
                      ref={el => scoreInputRefs.current['team2'] = el}
                      type="number"
                      value={team2Score}
                      onChange={(e) => {
                        const score = parseInt(e.target.value) || 0;
                        setTeam2Score(score);
                        onScoreUpdate?.(match.team2.id, score);
                      }}
                      className="tablet-admin-score-input"
                      min="0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Map Controls */}
            {match.maps && match.maps.length > 0 && (
              <div className="tablet-admin-map-controls">
                <div className="tablet-admin-map-tabs">
                  {match.maps.map((map, index) => (
                    <button
                      key={index}
                      className={`tablet-admin-map-tab ${selectedMap === index ? 'active' : ''}`}
                      onClick={() => setSelectedMap(index)}
                    >
                      <span className="tablet-admin-map-name">{map.name}</span>
                      <span className="tablet-admin-map-status">{map.status}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other views can be implemented similarly */}
        {activeView !== 'scoring' && (
          <div className="tablet-admin-placeholder">
            <div className="text-center text-gray-500">
              <h3 className="text-lg font-medium mb-2">{activeView.charAt(0).toUpperCase() + activeView.slice(1)} View</h3>
              <p>This view is under development for tablet optimization.</p>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="tablet-admin-confirmation">
          <div className="tablet-admin-confirmation-content">
            <div className="tablet-admin-confirmation-icon">
              <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="tablet-admin-confirmation-text">{pendingAction}</p>
          </div>
        </div>
      )}

      {/* Tablet Admin Styles */}
      <style jsx>{`
        .tablet-admin-controls {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-primary);
        }

        .tablet-admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-card);
        }

        .tablet-admin-tabs {
          display: flex;
          gap: 8px;
        }

        .tablet-admin-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          transition: all 0.2s ease;
          min-height: 48px;
          cursor: pointer;
        }

        .tablet-admin-tab.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .tablet-admin-tab:not(.active):hover {
          background: var(--bg-primary);
          border-color: var(--color-primary);
        }

        .tablet-admin-input-mode {
          display: flex;
          background: var(--bg-secondary);
          border-radius: 6px;
          overflow: hidden;
        }

        .tablet-admin-mode-btn {
          padding: 8px 16px;
          border: none;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tablet-admin-mode-btn.active {
          background: var(--color-primary);
          color: white;
        }

        .tablet-admin-content {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
        }

        .tablet-admin-scoring {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .tablet-admin-status-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        .tablet-admin-status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tablet-admin-status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .tablet-admin-status-dot.live {
          background: #ef4444;
        }

        .tablet-admin-status-dot.scheduled {
          background: #3b82f6;
        }

        .tablet-admin-status-dot.completed {
          background: #10b981;
        }

        .tablet-admin-status-btn {
          padding: 12px 24px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }

        .tablet-admin-status-btn.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }

        .tablet-admin-teams-scoring {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 24px;
          align-items: start;
        }

        .tablet-admin-team-section {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
        }

        .tablet-admin-team-header {
          margin-bottom: 20px;
        }

        .tablet-admin-team-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .tablet-admin-team-name {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tablet-admin-team-region {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .tablet-admin-quick-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          margin-bottom: 20px;
        }

        .tablet-admin-score-btn {
          width: 60px;
          height: 60px;
          border: 2px solid var(--border-color);
          border-radius: 50%;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tablet-admin-score-btn.plus:hover {
          background: #10b981;
          color: white;
          border-color: #10b981;
          transform: scale(1.1);
        }

        .tablet-admin-score-btn.minus:hover {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
          transform: scale(1.1);
        }

        .tablet-admin-score-display {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100px;
          height: 100px;
          background: var(--bg-primary);
          border: 3px solid var(--border-color);
          border-radius: 50%;
          font-size: 36px;
          font-weight: 900;
          color: var(--text-primary);
        }

        .tablet-admin-numberpad {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tablet-admin-numberpad-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .tablet-admin-number-btn {
          width: 60px;
          height: 60px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tablet-admin-number-btn:hover {
          background: var(--color-primary);
          color: white;
          transform: scale(1.05);
        }

        .tablet-admin-clear-btn {
          grid-column: 1;
          font-size: 14px;
        }

        .tablet-admin-backspace-btn {
          grid-column: 3;
          font-size: 20px;
        }

        .tablet-admin-vs-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .tablet-admin-vs-circle {
          width: 80px;
          height: 80px;
          background: var(--bg-card);
          border: 2px solid var(--border-color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .tablet-admin-live-timer {
          text-align: center;
        }

        .tablet-admin-timer-display {
          font-size: 24px;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 8px;
        }

        .tablet-admin-timer-controls {
          display: flex;
          gap: 8px;
        }

        .tablet-admin-timer-btn {
          padding: 6px 12px;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          background: var(--bg-secondary);
          color: var(--text-secondary);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tablet-admin-timer-btn:hover {
          background: var(--color-primary);
          color: white;
        }

        .tablet-admin-score-input {
          width: 100%;
          padding: 16px;
          border: 2px solid var(--border-color);
          border-radius: 8px;
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 24px;
          font-weight: 700;
          text-align: center;
        }

        .tablet-admin-score-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .tablet-admin-confirmation {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
          z-index: 1000;
          animation: tablet-confirmation-appear 0.3s ease-out;
        }

        .tablet-admin-confirmation-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
        }

        .tablet-admin-confirmation-text {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary);
        }

        @keyframes tablet-confirmation-appear {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @media (max-width: 767px) {
          .tablet-admin-teams-scoring {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .tablet-admin-vs-divider {
            order: 2;
          }
        }
      `}</style>
    </div>
  );
};

export default TabletAdminControls;