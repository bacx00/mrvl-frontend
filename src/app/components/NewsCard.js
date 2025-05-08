'use client';
import React from 'react';

export default function NewsCard({ news }) {
  if (!news) return null;

  // Determine a short summary text (uses news.summary if available, otherwise a snippet of description/content)
  let summary = '';
  if (news.summary) {
    summary = news.summary;
  } else if (news.description) {
    summary = news.description;
  } else if (news.content) {
    summary = news.content.substring(0, 100) + '...';
  }

  return (
    <div className="card h-100" style={{ border: '1px solid #d9dded' }}>
      {/* Top image thumbnail */}
      {news.image && (
        <img 
          src={news.image} 
          alt={news.title || 'News image'} 
          className="card-img-top"
          style={{ objectFit: 'cover', maxHeight: '160px' }}
          onError={(e) => { e.currentTarget.src = '/placeholder.png'; }}
        />
      )}

      <div className="card-body d-flex flex-column p-2">
        {/* News title */}
        <h6 className="fw-bold mb-2" style={{ color: '#27262d' }}>
          {news.title}
        </h6>
        {/* News summary text */}
        {summary && (
          <p className="card-text small mb-2" style={{ color: '#27262d' }}>
            {summary}
          </p>
        )}
        {/* Read More link/button */}
        {news.url && (
          <a 
            href={news.url} 
            className="mt-auto align-self-start btn btn-sm fw-semibold" 
            style={{ backgroundColor: '#fbdc2c', color: '#27262d' }}
          >
            Read More
          </a>
        )}
      </div>
    </div>
  );
}
