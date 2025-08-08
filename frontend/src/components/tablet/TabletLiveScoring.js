import React, { useState, useEffect, useRef } from 'react';
import { useDeviceType } from '../../hooks/useDeviceType';
import { TeamLogo } from '../../utils/imageUtils';

const TabletLiveScoring = ({ 
  match, 
  onScoreUpdate, 
  isAdmin = false, 
  showMaps = true,
  showStats = true 
}) => {
  const { isLandscape, width, height } = useDeviceType();
  const [scores, setScores] = useState({
    team1: match.team1?.score || 0,
    team2: match.team2?.score || 0
  });
  const [currentMap, setCurrentMap] = useState(0);
  const [mapScores, setMapScores] = useState(match.maps || []);
  const [isEditing, setIsEditing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  // Auto-refresh for live matches
  useEffect(() => {
    if (match.status === 'live') {
      intervalRef.current = setInterval(() => {
        setLastUpdate(new Date());
      }, 5000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [match.status]);

  const handleScoreChange = (team, value) => {
    const newScores = {
      ...scores,
      [team]: Math.max(0, Math.min(99, parseInt(value) || 0))
    };
    setScores(newScores);
  };

  const submitScoreUpdate = () => {
    if (onScoreUpdate) {
      onScoreUpdate(match.id, {
        team1_score: scores.team1,
        team2_score: scores.team2,
        map_scores: mapScores
      });
    }
    setIsEditing(false);
  };

  const getScoreChangeAnimation = (team) => {
    // This would be triggered when scores change
    return 'tablet-score-update';
  };

  const formatMatchTime = () => {
    if (!match.start_time) return null;
    const start = new Date(match.start_time);
    const now = new Date();
    const duration = Math.floor((now - start) / 1000 / 60);
    return `${duration}m`;
  };

  const getWinnerStyle = (team) => {
    if (match.status !== 'completed') return '';
    const isWinner = team === 'team1' ? 
      scores.team1 > scores.team2 : 
      scores.team2 > scores.team1;
    return isWinner ? 'winner' : 'loser';
  };

  return (
    <div className={`
      tablet-live-scoring relative overflow-hidden
      ${isLandscape ? 'landscape-layout' : 'portrait-layout'}
    `}>
      {/* Live Status Header */}
      <div className="tablet-live-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="live-indicator">
              <div className="live-dot"></div>
              <span className="live-text">LIVE</span>
            </div>
            {match.tournament && (
              <span className="tournament-name">{match.tournament.name}</span>
            )}
          </div>
          
          <div className="match-info">
            {formatMatchTime() && (
              <span className="match-duration">{formatMatchTime()}</span>
            )}
            <span className="match-format">{match.format || 'BO3'}</span>
          </div>
        </div>
      </div>

      {/* Main Scoring Section */}
      <div className={`
        tablet-live-content
        ${isLandscape ? 'landscape-grid' : 'portrait-stack'}
      `}>
        {/* Team 1 */}
        <div className={`tablet-live-team team-1 ${getWinnerStyle('team1')}`}>
          <div className="team-visual">
            <TeamLogo 
              team={match.team1} 
              size={isLandscape ? "w-20 h-20" : "w-16 h-16"} 
              className="team-logo-enhanced"
            />
            <div className="team-details">
              <h2 className="team-name">
                {match.team1?.name || 'Team 1'}
              </h2>
              {match.team1?.region && (
                <p className="team-region">{match.team1.region}</p>
              )}
              {showStats && match.team1?.rating && (
                <p className="team-rating">Rating: {match.team1.rating}</p>
              )}
            </div>
          </div>
          
          {/* Team 1 Score */}
          <div className="score-section">
            {isAdmin && isEditing ? (
              <input
                type="number"
                value={scores.team1}
                onChange={(e) => handleScoreChange('team1', e.target.value)}
                className="score-input tablet-touch-target"
                min="0"
                max="99"
              />
            ) : (
              <div className={`team-score ${getScoreChangeAnimation('team1')}`}>
                {scores.team1}
              </div>
            )}
          </div>
        </div>

        {/* VS Section / Controls */}
        <div className="vs-section">
          <div className="vs-divider">
            <div className="vs-text">VS</div>
            {match.status === 'live' && (
              <div className="live-pulse-ring"></div>
            )}
          </div>
          
          {/* Current Map Info */}
          {showMaps && match.current_map && (
            <div className="current-map-info">
              <div className="map-name">{match.current_map.name}</div>
              <div className="map-mode">{match.current_map.mode}</div>
              {match.current_map.progress && (
                <div className="map-progress">
                  <div 
                    className="progress-bar"
                    style={{ width: `${match.current_map.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          )}

          {/* Admin Controls */}
          {isAdmin && (
            <div className="admin-controls">
              {isEditing ? (
                <div className="edit-controls">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="btn-secondary tablet-touch-target"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitScoreUpdate}
                    className="btn-primary tablet-touch-target"
                  >
                    Update
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-edit tablet-touch-target"
                >
                  Edit Score
                </button>
              )}
            </div>
          )}
        </div>

        {/* Team 2 */}
        <div className={`tablet-live-team team-2 ${getWinnerStyle('team2')}`}>
          <div className="team-visual">
            <TeamLogo 
              team={match.team2} 
              size={isLandscape ? "w-20 h-20" : "w-16 h-16"} 
              className="team-logo-enhanced"
            />
            <div className="team-details">
              <h2 className="team-name">
                {match.team2?.name || 'Team 2'}
              </h2>
              {match.team2?.region && (
                <p className="team-region">{match.team2.region}</p>
              )}
              {showStats && match.team2?.rating && (
                <p className="team-rating">Rating: {match.team2.rating}</p>
              )}
            </div>
          </div>
          
          {/* Team 2 Score */}
          <div className="score-section">
            {isAdmin && isEditing ? (
              <input
                type="number"
                value={scores.team2}
                onChange={(e) => handleScoreChange('team2', e.target.value)}
                className="score-input tablet-touch-target"
                min="0"
                max="99"
              />
            ) : (
              <div className={`team-score ${getScoreChangeAnimation('team2')}`}>
                {scores.team2}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Map Scores */}
      {showMaps && mapScores.length > 0 && (
        <div className="map-scores-section">
          <h3 className="maps-title">Map Scores</h3>
          <div className={`
            maps-grid 
            ${isLandscape ? 'landscape-maps' : 'portrait-maps'}
          `}>
            {mapScores.map((map, index) => (
              <div 
                key={index}
                className={`
                  map-score-card
                  ${index === currentMap ? 'active' : ''}
                  ${map.status === 'completed' ? 'completed' : ''}
                `}
              >
                <div className="map-header">
                  <span className="map-name">{map.name}</span>
                  <span className="map-status">{map.status}</span>
                </div>
                
                <div className="map-teams-score">
                  <div className="map-team">
                    <span className="team-short">
                      {match.team1?.short_name || match.team1?.name?.substr(0, 3)}
                    </span>
                    <span className={`
                      map-team-score 
                      ${map.team1_score > map.team2_score ? 'winner' : ''}
                    `}>
                      {map.team1_score || 0}
                    </span>
                  </div>
                  
                  <div className="map-separator">-</div>
                  
                  <div className="map-team">
                    <span className={`
                      map-team-score 
                      ${map.team2_score > map.team1_score ? 'winner' : ''}
                    `}>
                      {map.team2_score || 0}
                    </span>
                    <span className="team-short">
                      {match.team2?.short_name || match.team2?.name?.substr(0, 3)}
                    </span>
                  </div>
                </div>
                
                {map.duration && (
                  <div className="map-duration">{map.duration}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Match Statistics */}
      {showStats && isLandscape && (
        <div className="match-stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Round Differential</div>
              <div className="stat-value">
                {scores.team1 - scores.team2 > 0 ? '+' : ''}{scores.team1 - scores.team2}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Maps Played</div>
              <div className="stat-value">
                {mapScores.filter(map => map.status === 'completed').length}
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-label">Match Duration</div>
              <div className="stat-value">{formatMatchTime() || 'N/A'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Last Update Indicator */}
      {lastUpdate && (
        <div className="last-update">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      )}

      <style jsx>{`
        .tablet-live-scoring {
          background: linear-gradient(135deg, #1a1a2e, #16213e);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          color: white;
          min-height: ${isLandscape ? '60vh' : '80vh'};
        }

        .tablet-live-header {
          background: linear-gradient(90deg, #dc2626, #ef4444);
          padding: 20px 24px;
          position: relative;
          overflow: hidden;
        }

        .tablet-live-header::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
          animation: live-scan 3s ease-in-out infinite;
        }

        @keyframes live-scan {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .live-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .live-dot {
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 50%;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .live-text {
          font-weight: 800;
          font-size: 16px;
          letter-spacing: 1px;
        }

        .tournament-name {
          font-size: 14px;
          opacity: 0.9;
        }

        .match-info {
          display: flex;
          gap: 16px;
          align-items: center;
          font-size: 14px;
        }

        .landscape-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 32px;
          padding: 32px;
          align-items: center;
          min-height: 400px;
        }

        .portrait-stack {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding: 24px;
        }

        .tablet-live-team {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }

        .tablet-live-team.winner {
          transform: scale(1.05);
        }

        .tablet-live-team.loser {
          opacity: 0.7;
        }

        .team-visual {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .team-logo-enhanced {
          border: 3px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          padding: 8px;
          background: rgba(255, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .team-name {
          font-size: ${isLandscape ? '24px' : '20px'};
          font-weight: 800;
          margin: 0;
          color: white;
        }

        .team-region {
          font-size: 14px;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .team-rating {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .team-score {
          font-size: ${isLandscape ? '72px' : '64px'};
          font-weight: 900;
          color: #dc2626;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
          transition: all 0.3s ease;
        }

        .tablet-score-update {
          animation: score-flash 0.5s ease-out;
        }

        @keyframes score-flash {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); color: #fbbf24; }
          100% { transform: scale(1); }
        }

        .score-input {
          font-size: 48px;
          font-weight: 900;
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          color: white;
          padding: 12px;
          width: 120px;
        }

        .vs-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          text-align: center;
          min-width: 200px;
        }

        .vs-divider {
          position: relative;
          width: 80px;
          height: 80px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
        }

        .vs-text {
          font-size: 18px;
          font-weight: 800;
          color: white;
        }

        .live-pulse-ring {
          position: absolute;
          inset: -8px;
          border: 2px solid #dc2626;
          border-radius: 50%;
          animation: pulse-ring 2s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.3); }
        }

        .current-map-info {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          backdrop-filter: blur(10px);
          min-width: 180px;
        }

        .map-name {
          font-size: 16px;
          font-weight: 700;
          color: white;
          display: block;
          margin-bottom: 4px;
        }

        .map-mode {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          display: block;
          margin-bottom: 8px;
        }

        .map-progress {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #dc2626, #ef4444);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .admin-controls {
          margin-top: 16px;
        }

        .edit-controls {
          display: flex;
          gap: 8px;
        }

        .btn-primary, .btn-secondary, .btn-edit {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 14px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .btn-edit {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .map-scores-section {
          padding: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .maps-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 16px;
          text-align: center;
        }

        .landscape-maps {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .portrait-maps {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .map-score-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 12px;
          transition: all 0.2s ease;
        }

        .map-score-card.active {
          border-color: #dc2626;
          box-shadow: 0 0 0 1px #dc2626;
        }

        .map-score-card.completed {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .map-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          font-size: 12px;
        }

        .map-teams-score {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
        }

        .map-team {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .map-team-score.winner {
          color: #10b981;
          font-weight: 700;
        }

        .match-stats-section {
          padding: 20px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(0, 0, 0, 0.2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .stat-card {
          text-align: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .stat-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .last-update {
          position: absolute;
          bottom: 8px;
          right: 12px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default TabletLiveScoring;