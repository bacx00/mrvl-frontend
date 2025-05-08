'use client';
import React from 'react';

export default function MatchCard({ match }) {
  if (!match) return null;
  const status = match.status ? match.status.toLowerCase() : '';
  const isLive = status === 'live';
  const hasScore = 
    match.score1 !== undefined && match.score2 !== undefined;

  return (
    <div className="card h-100" style={{ border: '1px solid #d9dded' }}>
      <div className="card-body p-2">
        {/* Teams and scores row */}
        <div className="d-flex justify-content-between align-items-center">
          {/* Team 1 (left) */}
          <div className="d-flex align-items-center">
            {match.team1?.logo && (
              <img 
                src={match.team1.logo} 
                alt={match.team1.name} 
                className="me-2"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
              />
            )}
            <span className="fw-bold" style={{ color: '#27262d' }}>
              {match.team1?.name || 'Team 1'}
            </span>
          </div>

          {/* Match status or score */}
          <div className="text-center">
            {isLive ? (
              // Live match badge in accent color
              <span 
                className="badge" 
                style={{ backgroundColor: '#fbdc2c', color: '#27262d' }}
              >
                LIVE
              </span>
            ) : (
              // If not live: show score if available, otherwise match time
              <span className="fw-semibold" style={{ color: '#27262d' }}>
                {hasScore 
                  ? `${match.score1} - ${match.score2}` 
                  : (match.time || '')
                }
              </span>
            )}
          </div>

          {/* Team 2 (right) */}
          <div className="d-flex align-items-center">
            <span className="fw-bold" style={{ color: '#27262d' }}>
              {match.team2?.name || 'Team 2'}
            </span>
            {match.team2?.logo && (
              <img 
                src={match.team2.logo} 
                alt={match.team2.name} 
                className="ms-2"
                style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
              />
            )}
          </div>
        </div>

        {/* Event name */}
        {match.event && (
          <div className="text-center mt-2">
            <small style={{ color: '#27262d' }}>{match.event}</small>
          </div>
        )}
      </div>
    </div>
  );
}
