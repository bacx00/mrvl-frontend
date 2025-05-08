'use client';  // Marks this as a client component (for interactivity like carousel)

// Import necessary components and data hooks
import { useEffect, useState } from 'react';
import HeroCarousel from '@/components/HeroCarousel';
import MatchCard from '@/components/MatchCard';
import NewsCard from '@/components/NewsCard';
import Sidebar from '@/components/Sidebar';

export default function HomePage() {
  // State for matches and news
  const [matches, setMatches] = useState([]); 
  const [news, setNews] = useState([]);

  // Fetch matches and news data from API on mount
  useEffect(() => {
    Promise.all([
      fetch('/api/matches').then(res => res.json()),
      fetch('/api/news').then(res => res.json())
    ]).then(([matchesData, newsData]) => {
      setMatches(matchesData);
      setNews(newsData);
    });
  }, []);

  return (
    <main className="container-fluid py-4 bg-dark text-light">
      {/* Hero carousel showcasing featured content */}
      <HeroCarousel slides={news.slice(0, 3)} />

      {/* Live & Upcoming Matches section */}
      <section className="mt-4">
        <h2 className="section-title">Live & Upcoming Matches</h2>
        <div className="row">
          {matches.filter(m => m.status !== 'completed').map(match => (
            <div key={match.id} className="col-md-6 col-xl-4 mb-3">
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      </section>

      {/* News grid section */}
      <section className="mt-5">
        <h2 className="section-title">Latest News</h2>
        <div className="row">
          {news.map(article => (
            <div key={article.id} className="col-md-4 mb-4">
              <NewsCard article={article} />
            </div>
          ))}
        </div>
      </section>

      {/* Sidebar with trending topics and mini-leaderboard */}
      <aside className="mt-4">
        <Sidebar />
      </aside>
    </main>
  );
}
