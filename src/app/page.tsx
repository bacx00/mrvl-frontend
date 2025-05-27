'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { matchesAPI, newsAPI, eventsAPI, rankingsAPI } from '@/lib/api';
import { Match, NewsArticle, Event, Ranking } from '@/lib/types';
import MatchCard from '@/components/MatchCard';
import NewsCard from '@/components/NewsCard';
import EventCard from '@/components/EventCard';
import HeroCarousel from '@/components/HeroCarousel';
import { formatDate, formatNumber } from '@/lib/utils';
import { COLORS, ROUTES } from '@/lib/constants';

export default function HomePage() {
  // State management for all homepage data
  const [featuredMatches, setFeaturedMatches] = useState<Match[]>([]);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [recentResults, setRecentResults] = useState<Match[]>([]);
  const [featuredNews, setFeaturedNews] = useState<NewsArticle[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [topTeams, setTopTeams] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all homepage data
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Parallel API calls for better performance
        const [
          allMatches,
          newsData,
          eventsData,
          rankingsData,
        ] = await Promise.all([
          matchesAPI.getAll({ limit: 50 }),
          newsAPI.getFeatured(),
          eventsAPI.getUpcoming(),
          rankingsAPI.getTeams('global'),
        ]);

        // Organize matches by status
        const live = allMatches.filter(m => m.status === 'live');
        const upcoming = allMatches
          .filter(m => m.status === 'scheduled')
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
          .slice(0, 8);
        const completed = allMatches
          .filter(m => m.status === 'completed')
          .sort((a, b) => new Date(b.ended_at || b.scheduled_at).getTime() - new Date(a.ended_at || a.scheduled_at).getTime())
          .slice(0, 8);

        // Set featured match (first live match or most important upcoming)
        const featured = live.length > 0 ? [live[0]] : upcoming.slice(0, 1);

        setFeaturedMatches(featured);
        setLiveMatches(live.slice(1)); // Remove featured from live list
        setUpcomingMatches(upcoming);
        setRecentResults(completed);
        setFeaturedNews(newsData.slice(0, 6));
        setUpcomingEvents(eventsData.slice(0, 4));
        setTopTeams(rankingsData.slice(0, 10));

      } catch (err) {
        console.error('Error fetching homepage data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();

    // Set up real-time updates for live matches
    const interval = setInterval(() => {
      if (liveMatches.length > 0) {
        // Refresh live matches every 30 seconds
        matchesAPI.getLive().then(setLiveMatches).catch(console.error);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#fa4454] border-t-transparent mx-auto mb-4"></div>
          <p className="text-[#768894]">Loading MRVL.net...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <div className="w-16 h-16 bg-[#1a2332] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-[#fa4454] text-2xl">⚠</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Unable to Load Data</h2>
            <p className="text-[#768894] mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#fa4454] hover:bg-[#e03e4e] text-white rounded-md font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero/Featured Match Section */}
      {featuredMatches.length > 0 && (
        <section className="mb-8">
          <HeroCarousel matches={featuredMatches} />
        </section>
      )}

      {/* Main Content Grid - VLR.gg 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Sidebar - Forums & Community (Hidden on mobile, 3 cols on desktop) */}
        <aside className="hidden lg:block lg:col-span-3">
          {/* Stickied Threads */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white flex items-center">
                <span className="w-2 h-2 bg-[#fa4454] rounded-full mr-2"></span>
                Stickied Threads
              </h2>
              <Link href={ROUTES.FORUMS} className="text-[#fa4454] text-xs hover:underline">
                Forums
              </Link>
            </div>
            <div className="space-y-2">
              {[
                { title: "Welcome to MRVL.net!", replies: 156, author: "Admin" },
                { title: "Marvel Rivals Patch 1.2.0 Discussion", replies: 89, author: "ModTeam" },
                { title: "Tournament Rules & Guidelines", replies: 45, author: "Staff" },
              ].map((thread, index) => (
                <Link key={index} href={`${ROUTES.FORUMS}/announcements/${thread.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  <div className="bg-[#1a2332] hover:bg-[#20303d] border border-[#2b3d4d] rounded p-3 transition-colors">
                    <h3 className="text-sm font-medium line-clamp-2 mb-1">{thread.title}</h3>
                    <div className="flex items-center justify-between text-xs text-[#768894]">
                      <span>by {thread.author}</span>
                      <span>{thread.replies} replies</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Discussion */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Recent Discussion</h2>
              <Link href={ROUTES.FORUMS} className="text-[#fa4454] text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { title: "Best team compositions for ranked", author: "ProGamer", time: "5m ago", replies: 12 },
                { title: "Thor nerfs incoming?", author: "MarvelFan", time: "12m ago", replies: 28 },
                { title: "Tournament predictions thread", author: "Analyst", time: "1h ago", replies: 67 },
                { title: "New player guide megathread", author: "Helper", time: "2h ago", replies: 156 },
              ].map((post, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center text-xs font-semibold">
                    {post.author.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`${ROUTES.FORUMS}/thread/${index}`} className="text-sm hover:text-[#fa4454] transition-colors line-clamp-2">
                      {post.title}
                    </Link>
                    <div className="flex items-center justify-between text-xs text-[#768894] mt-1">
                      <span>{post.author}</span>
                      <span>{post.time}</span>
                    </div>
                  </div>
                  <div className="text-xs text-[#768894]">{post.replies}</div>
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Center Content - Matches (6 cols on desktop, full width on mobile) */}
        <main className="lg:col-span-6">
          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
                <h2 className="text-sm font-semibold text-white flex items-center">
                  <span className="w-2 h-2 bg-[#4ade80] rounded-full mr-2 animate-pulse"></span>
                  Live Matches
                </h2>
                <Link href={`${ROUTES.MATCHES}?status=live`} className="text-[#fa4454] text-xs hover:underline">
                  View All
                </Link>
              </div>
              <div className="space-y-1">
                {liveMatches.slice(0, 5).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Matches */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Upcoming Matches</h2>
              <Link href={`${ROUTES.MATCHES}?status=upcoming`} className="text-[#fa4454] text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-1">
              {upcomingMatches.slice(0, 8).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>

          {/* Recent Results */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Recent Results</h2>
              <Link href={`${ROUTES.MATCHES}?status=completed`} className="text-[#fa4454] text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-1">
              {recentResults.slice(0, 8).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        </main>

        {/* Right Sidebar - Events, News, Rankings (3 cols on desktop, full width on mobile) */}
        <aside className="lg:col-span-3">
          {/* Ongoing Events */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Ongoing Events</h2>
              <Link href={ROUTES.EVENTS} className="text-[#fa4454] text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} compact />
              ))}
            </div>
          </section>

          {/* Top Teams */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Rankings</h2>
              <Link href={ROUTES.RANKINGS} className="text-[#fa4454] text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="bg-[#1a2332] border border-[#2b3d4d] rounded overflow-hidden">
              {topTeams.slice(0, 8).map((ranking, index) => (
                <Link 
                  key={ranking.id} 
                  href={`${ROUTES.TEAMS}/${ranking.team?.id}`}
                  className="flex items-center p-3 border-b last:border-b-0 border-[#2b3d4d] hover:bg-[#20303d] transition-colors"
                >
                  <div className="w-6 text-center mr-3">
                    <span className="text-sm font-medium">{ranking.rank}</span>
                  </div>
                  
                  <div className="w-8 h-8 relative mr-3">
                    {ranking.team?.logo ? (
                      <Image
                        src={ranking.team.logo}
                        alt={ranking.team.name}
                        fill
                        className="object-contain rounded"
                        sizes="32px"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-[#2b3d4d] rounded flex items-center justify-center">
                        <span className="text-xs font-bold">
                          {ranking.team?.name.charAt(0) || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {ranking.team?.name || 'Unknown Team'}
                    </div>
                    <div className="text-xs text-[#768894]">
                      {ranking.team?.region || 'Unknown'}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatNumber(ranking.points)} pts</div>
                    {ranking.trend && (
                      <div className={`text-xs flex items-center justify-end ${
                        ranking.trend === 'up' ? 'text-[#4ade80]' : 
                        ranking.trend === 'down' ? 'text-[#ef4444]' : 'text-[#768894]'
                      }`}>
                        {ranking.trend === 'up' && '↗'}
                        {ranking.trend === 'down' && '↘'}
                        {ranking.trend === 'stable' && '→'}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Latest News */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Latest News</h2>
              <Link href={ROUTES.NEWS} className="text-[#fa4454] text-xs hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-3">
              {featuredNews.slice(0, 4).map((article) => (
                <NewsCard key={article.id} article={article} compact />
              ))}
            </div>
          </section>

          {/* Popular Topics */}
          <section className="mb-6">
            <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
              <h2 className="text-sm font-semibold text-white">Popular Topics</h2>
            </div>
            <div className="space-y-2">
              {[
                { topic: "Marvel Rivals", posts: "12.5K" },
                { topic: "Competitive", posts: "8.3K" },
                { topic: "Meta Discussion", posts: "6.1K" },
                { topic: "Team Rankings", posts: "4.7K" },
                { topic: "Patch Notes", posts: "3.2K" },
              ].map((item, index) => (
                <Link 
                  key={index} 
                  href={`${ROUTES.FORUMS}/topics/${item.topic.toLowerCase().replace(/\s+/g, '-')}`}
                  className="flex items-center justify-between py-2 px-3 bg-[#1a2332] hover:bg-[#20303d] border border-[#2b3d4d] rounded transition-colors"
                >
                  <span className="text-sm">{item.topic}</span>
                  <span className="text-xs text-[#768894]">{item.posts}</span>
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      {/* Mobile-only sections */}
      <div className="lg:hidden space-y-6">
        {/* Mobile Forum Quick Links */}
        <section>
          <div className="flex items-center justify-between border-b border-[#2b3d4d] pb-2 mb-3">
            <h2 className="text-sm font-semibold text-white">Community</h2>
            <Link href={ROUTES.FORUMS} className="text-[#fa4454] text-xs hover:underline">
              Forums
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "General", href: "/forums/general" },
              { name: "Competitive", href: "/forums/competitive" },
              { name: "Patch Notes", href: "/forums/patch-notes" },
              { name: "Memes", href: "/forums/memes" },
            ].map((link) => (
              <Link 
                key={link.name}
                href={link.href}
                className="p-3 bg-[#1a2332] border border-[#2b3d4d] rounded text-center text-sm hover:bg-[#20303d] transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
