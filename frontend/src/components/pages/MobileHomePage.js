import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { MobileMatchCard, MobileMatchList } from '../mobile/MobileMatchCard';
import { MobileTeamCard } from '../mobile/MobileTeamCard';
import { ScrollToTopButton } from '../mobile/MobileEnhancements';
import { PullToRefresh, hapticFeedback } from '../mobile/MobileGestures';
import { 
  TrendingUp, Calendar, Trophy, Users, Newspaper, 
  MessageSquare, ChevronRight, Star, Globe 
} from 'lucide-react';
import { formatTimeAgo } from '../../utils/dateUtils';
import { getNewsFeaturedImageUrl, getImageUrl } from '../../utils/imageUtils';

// VLR.gg-style Mobile Homepage
const MobileHomePage = ({ navigateTo }) => {
  const { api } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [recentResults, setRecentResults] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [activeEvents, setActiveEvents] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Enhanced pull-to-refresh functionality
  const handleRefresh = useCallback(async () => {
    hapticFeedback.light();
    setRefreshing(true);
    await fetchData();
    hapticFeedback.success();
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Parallel fetch all data
      const [matchesRes, newsRes, teamsRes, eventsRes, forumsRes] = await Promise.allSettled([
        api.get('/matches'),
        api.get('/news?limit=5'),
        api.get('/teams?limit=10'),
        api.get('/events?status=ongoing,upcoming'),
        api.get('/forums/threads?limit=5')
      ]);

      // Process matches
      if (matchesRes.status === 'fulfilled') {
        const matches = matchesRes.value?.data?.data || [];
        setLiveMatches(matches.filter(m => m.status === 'live'));
        setUpcomingMatches(matches.filter(m => m.status === 'upcoming').slice(0, 10));
        setRecentResults(matches.filter(m => m.status === 'completed').slice(0, 5));
      }

      // Process news
      if (newsRes.status === 'fulfilled') {
        setFeaturedNews(newsRes.value?.data?.data || []);
      }

      // Process teams
      if (teamsRes.status === 'fulfilled') {
        setTopTeams(teamsRes.value?.data?.data || []);
      }

      // Process events
      if (eventsRes.status === 'fulfilled') {
        setActiveEvents(eventsRes.value?.data?.data || []);
      }

      // Process forums
      if (forumsRes.status === 'fulfilled') {
        setDiscussions(forumsRes.value?.data?.data || []);
      }

    } catch (error) {
      console.error('Error fetching mobile homepage data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
    // Auto-refresh live matches every 30 seconds
    const interval = setInterval(() => {
      if (liveMatches.length > 0) {
        fetchData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchData, liveMatches.length]);

  // Tab navigation
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'matches', label: 'Matches', icon: Calendar },
    { id: 'events', label: 'Events', icon: Trophy },
    { id: 'teams', label: 'Teams', icon: Users }
  ];

  if (isLoading) {
    return <MobileLoadingSkeleton />;
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={isLoading}>
      <div className="min-h-screen bg-white dark:bg-gray-900 lg:hidden">
        {/* Pull to refresh indicator */}
        {refreshing && (
          <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        {/* VLR.gg-style Live Matches Banner */}
        {liveMatches.length > 0 && (
          <div className="bg-red-600 dark:bg-red-700 text-white py-2 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-sm font-bold">LIVE</span>
                <span className="text-xs opacity-90">{liveMatches.length} match{liveMatches.length > 1 ? 'es' : ''}</span>
              </div>
              <button 
                onClick={() => setActiveTab('matches')}
                className="text-xs underline opacity-90 hover:opacity-100"
              >
                View All
              </button>
            </div>
          </div>
        )}

      {/* Tab Navigation */}
      <div className="sticky top-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-red-600 text-red-600 dark:text-red-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="pb-20">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Live Matches Ticker */}
            {liveMatches.length > 0 && (
              <section className="bg-red-600 dark:bg-red-800 text-white">
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold flex items-center space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>LIVE NOW</span>
                    </h2>
                    <button 
                      onClick={() => setActiveTab('matches')}
                      className="text-xs underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="flex overflow-x-auto scrollbar-hide space-x-3">
                    {liveMatches.map(match => (
                      <LiveMatchTicker 
                        key={match.id} 
                        match={match} 
                        onClick={() => navigateTo('match-detail', { id: match.id })}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Featured News */}
            <section className="px-4">
              <SectionHeader 
                title="Latest News" 
                icon={Newspaper}
                onViewAll={() => navigateTo('news')}
              />
              <div className="space-y-3">
                {featuredNews.slice(0, 3).map(article => (
                  <NewsCard 
                    key={article.id} 
                    article={article} 
                    onClick={() => navigateTo('news-detail', { id: article.id })}
                  />
                ))}
              </div>
            </section>

            {/* Upcoming Matches */}
            <section className="px-4">
              <SectionHeader 
                title="Upcoming Matches" 
                icon={Calendar}
                onViewAll={() => setActiveTab('matches')}
              />
              <div className="space-y-2">
                {upcomingMatches.slice(0, 5).map(match => (
                  <MobileMatchCard 
                    key={match.id} 
                    match={match} 
                    onClick={() => navigateTo('match-detail', { id: match.id })}
                  />
                ))}
              </div>
            </section>

            {/* Top Teams */}
            <section className="px-4">
              <SectionHeader 
                title="Top Teams" 
                icon={Users}
                onViewAll={() => navigateTo('rankings')}
              />
              <div className="space-y-2">
                {topTeams.slice(0, 5).map((team, index) => (
                  <MobileTeamCard 
                    key={team.id} 
                    team={team} 
                    rank={index + 1}
                    showRank={true}
                    onClick={() => navigateTo('team-detail', { id: team.id })}
                  />
                ))}
              </div>
            </section>

            {/* Recent Discussions */}
            <section className="px-4 mb-6">
              <SectionHeader 
                title="Hot Discussions" 
                icon={MessageSquare}
                onViewAll={() => navigateTo('forums')}
              />
              <div className="space-y-2">
                {discussions.map(thread => (
                  <DiscussionCard 
                    key={thread.id} 
                    thread={thread} 
                    onClick={() => navigateTo('thread-detail', { id: thread.id })}
                  />
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="px-4 py-4">
            <MobileMatchList 
              matches={[...liveMatches, ...upcomingMatches, ...recentResults]}
              onMatchClick={(match) => navigateTo('match-detail', { id: match.id })}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <div className="px-4 py-4">
            <div className="space-y-3">
              {activeEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => navigateTo('event-detail', { id: event.id })}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="px-4 py-4">
            <div className="space-y-3">
              {topTeams.map((team, index) => (
                <MobileTeamCard 
                  key={team.id} 
                  team={team} 
                  rank={index + 1}
                  showRank={true}
                  onClick={() => navigateTo('team-detail', { id: team.id })}
                />
              ))}
            </div>
          </div>
        )}
      </div>

        <ScrollToTopButton />
      </div>
    </PullToRefresh>
  );
};

// Component helpers
const SectionHeader = ({ title, icon: Icon, onViewAll }) => (
  <div className="flex items-center justify-between mb-3">
    <h2 className="flex items-center space-x-2 text-lg font-bold">
      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <span>{title}</span>
    </h2>
    {onViewAll && (
      <button 
        onClick={onViewAll}
        className="text-sm text-red-600 dark:text-red-400 font-medium"
      >
        View All
      </button>
    )}
  </div>
);

const LiveMatchTicker = ({ match, onClick }) => (
  <button 
    onClick={onClick}
    className="flex-shrink-0 bg-white/10 rounded-lg p-3 min-w-[200px]"
  >
    <div className="flex items-center justify-between mb-1">
      <span className="text-xs font-semibold">LIVE</span>
      <span className="text-xs">{match.match_timer || '0:00'}</span>
    </div>
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium truncate">{match.team1?.name}</span>
        <span className="text-lg font-bold ml-2">{match.team1_score || 0}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium truncate">{match.team2?.name}</span>
        <span className="text-lg font-bold ml-2">{match.team2_score || 0}</span>
      </div>
    </div>
  </button>
);

const NewsCard = ({ article, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden text-left"
  >
    <div className="flex space-x-3 p-3">
      {article.featured_image && (
        <img 
          src={getNewsFeaturedImageUrl(article.featured_image)}
          alt=""
          className="w-24 h-24 object-cover rounded"
        />
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{article.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
          {article.excerpt}
        </p>
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>{article.category?.name || 'News'}</span>
          <span>•</span>
          <span>{formatTimeAgo(article.created_at)}</span>
        </div>
      </div>
    </div>
  </button>
);

const DiscussionCard = ({ thread, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white dark:bg-gray-800 rounded-lg p-3 text-left"
  >
    <h3 className="font-medium text-sm line-clamp-2 mb-2">{thread.title}</h3>
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{thread.user?.name}</span>
      <div className="flex items-center space-x-3">
        <span>{thread.post_count} replies</span>
        <span>{formatTimeAgo(thread.created_at)}</span>
      </div>
    </div>
  </button>
);

const EventCard = ({ event, onClick }) => (
  <button 
    onClick={onClick}
    className="w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden text-left"
  >
    {event.banner_image && (
      <img 
        src={getImageUrl(event.banner_image, 'events/banners')}
        alt={event.name}
        className="w-full h-32 object-cover"
      />
    )}
    <div className="p-4">
      <h3 className="font-semibold text-base mb-1">{event.name}</h3>
      <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
        <span>{event.status}</span>
        <span>•</span>
        <span>{event.prize_pool}</span>
        <span>•</span>
        <span>{event.teams_count} teams</span>
      </div>
    </div>
  </button>
);

const MobileLoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 space-y-4">
    {[1, 2, 3, 4].map(i => (
      <div key={i} className="bg-white dark:bg-gray-800 rounded-lg h-24 animate-pulse" />
    ))}
  </div>
);

export default MobileHomePage;