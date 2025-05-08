'use client';
import React from 'react';

export default function Carousel({ matches }) {
  if (!matches || matches.length === 0) return null;  // No slides if no data

  return (
    <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner">
        {matches.map((match, idx) => (
          <div 
            key={match.id || idx} 
            className={'carousel-item' + (idx === 0 ? ' active' : '')}
          >
            {match.image ? (
              /* Slide with match image background */
              <>
                <img 
                  src={match.image} 
                  alt={`${match.team1?.name} vs ${match.team2?.name}`} 
                  className="d-block w-100" 
                  style={{ maxHeight: '400px', objectFit: 'cover' }}
                  onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
                />
                <div className="carousel-caption d-none d-md-block">
                  <h5 style={{ color: '#d9dded' }}>
                    {match.team1?.name} vs {match.team2?.name}
                  </h5>
                  {match.event && (
                    <p style={{ color: '#d9dded' }}>{match.event}</p>
                  )}
                </div>
              </>
            ) : (
              /* Slide without image: use dark background with centered text */
              <div 
                className="d-flex flex-column justify-content-center align-items-center w-100"
                style={{ backgroundColor: '#27262d', minHeight: '300px' }}
              >
                <h3 style={{ color: '#d9dded' }}>
                  {match.team1?.name} vs {match.team2?.name}
                </h3>
                {match.event && (
                  <p style={{ color: '#d9dded' }}>{match.event}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Carousel controls (previous/next) */}
      <button 
        className="carousel-control-prev" 
        type="button" 
        data-bs-target="#heroCarousel" 
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button 
        className="carousel-control-next" 
        type="button" 
        data-bs-target="#heroCarousel" 
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}
