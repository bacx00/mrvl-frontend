import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getNewsFeaturedImageUrl, getEventBannerUrl, getImageUrl } from '../../utils/imageUtils';
import { formatTimeAgo, formatDateSafe } from '../../lib/utils.js';

function HomePage({ navigateTo }) {
  const { api } = useAuth();
  const [matches, setMatches] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [recentDiscussions, setRecentDiscussions] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [bannerImageLoaded, setBannerImageLoaded] = useState(false);
  const [bannerImageError, setBannerImageError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);

  // Helper function to format category names
  const formatCategory = (category) => {
    const categoryMap = {
      'general': 'General',
      'tournaments': 'Tournaments',
      'hero-discussion': 'Heroes',
      'strategy': 'Strategy',
      'esports': 'Esports',
      'guides': 'Guides',
      'patch-notes': 'Updates',
      'bugs': 'Bugs',
      'feedback': 'Feedback',
      'team-recruitment': 'Recruitment',
      'meta-discussion': 'Meta'
    };
    return categoryMap[category] || 'Discussion';
  };

  const fetchData = useCallback(async () => {
    if (loading || dataFetched) return; // Prevent duplicate requests
    
    try {
      setLoading(true);
      console.log('HomePage: Fetching REAL LIVE DATA from backend...');
      
      // Fetch all data in parallel for better performance
      const [matchResponse, eventsResponse, forumsResponse, newsResponse] = await Promise.allSettled([
        api.get('/matches'),
        api.get('/events'),
        api.get('/forums/threads?limit=5'),
        api.get('/news')
      ]);

      // Process matches
      let matchesData = [];
      if (matchResponse.status === 'fulfilled') {
        const rawMatches = matchResponse.value?.data?.data || matchResponse.value?.data || [];
        
        if (Array.isArray(rawMatches) && rawMatches.length > 0) {
          matchesData = rawMatches.map(match => ({
            id: match.id,
            team1: match.team1,
            team2: match.team2,
            event: {
              name: match.event_name || match.event?.name || 'Marvel Rivals Championship 2025',
              tier: match.event?.tier || 'S'
            },
            status: match.status || 'upcoming',
            format: match.format || 'BO3',
            time: match.scheduled_at 
              ? new Date(match.scheduled_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })
              : match.status === 'live' ? 'LIVE' : 'TBD',
            team1_score: match.team1_score || 0,
            team2_score: match.team2_score || 0,
            score: match.status === 'completed' || match.status === 'live'
              ? `${match.team1_score || 0}-${match.team2_score || 0}`
              : '0-0',
            viewers: match.viewers || 0
          }));
          console.log('HomePage: Using REAL backend matches:', matchesData.length);
        }
      }

      // Process events
      let eventsData = [];
      if (eventsResponse.status === 'fulfilled') {
        const rawEvents = eventsResponse.value?.data?.data || eventsResponse.value?.data || [];
        
        if (Array.isArray(rawEvents) && rawEvents.length > 0) {
          eventsData = rawEvents.map(event => ({
            id: event.id,
            name: event.name,
            status: event.status,
            stage: event.stage || 'Main Event',
            prizePool: event.prize_pool || '$100,000',
            teams: event.teams_count || 16,
            region: event.region || 'International',
            banner: event.banner,
            logo: event.logo,
            featured_image: event.featured_image,
            banner_image: event.banner_image,
            featured: event.featured
          }));
          console.log('HomePage: Using REAL backend events:', eventsData.length);
        }
      }

      // Process forums
      let discussionsData = [];
      if (forumsResponse.status === 'fulfilled') {
        const rawDiscussions = forumsResponse.value?.data?.data || forumsResponse.value?.data || [];
        
        if (Array.isArray(rawDiscussions) && rawDiscussions.length > 0) {
          discussionsData = rawDiscussions.slice(0, 5).map(thread => ({
            id: thread.id,
            title: thread.title,
            author: thread.user_name || thread.author?.name || 'MRVL User',
            replies: thread.replies || thread.replies_count || thread.posts_count || 0,
            lastActivity: thread.updated_at ? formatTimeAgo(thread.updated_at) : 'Recently',
            category: formatCategory(thread.category || thread.category_slug)
          }));
        }
      }

      // Process news
      let newsData = [];
      if (newsResponse.status === 'fulfilled') {
        const rawNews = newsResponse.value?.data?.data || newsResponse.value?.data || [];
        
        if (Array.isArray(rawNews) && rawNews.length > 0) {
          const featured = rawNews.filter(n => n.featured).slice(0, 3);
          newsData = featured.length > 0 ? featured : rawNews.slice(0, 3);
          console.log('HomePage: Using REAL backend news:', newsData.length);
        }
      }

      // Update all state in a single batch to minimize re-renders
      setMatches(matchesData);
      setLiveEvents(eventsData);
      setRecentDiscussions(discussionsData);
      setFeaturedNews(newsData);
      setDataFetched(true);
      
      console.log('HomePage: All data loaded with REAL backend data ONLY');
      console.log('HomePage: Events loaded:', eventsData.length);
      console.log('HomePage: Live events found:', eventsData.filter(e => e.status === 'live').length);
    } catch (error) {
      console.error('HomePage: Critical error in fetchData:', error);
      
      // CRITICAL FIX: No more fallback to mock data
      setMatches([]);
      setLiveEvents([]);
      setFeaturedNews([]);
      setRecentDiscussions([]);
    } finally {
      setLoading(false);
    }
  }, [api, loading, dataFetched]);

  useEffect(() => {
    if (!dataFetched) {
      fetchData();
    }
  }, [fetchData, dataFetched]);

  // CRITICAL FIX: Ensure all navigation functions work properly with error handling
  const handleNavigationClick = (page, params = {}) => {
    console.log(`HomePage: Navigation clicked - ${page}`, params);
    
    if (!navigateTo || typeof navigateTo !== 'function') {
      console.error('HomePage: navigateTo function not available');
      alert('Navigation error: Please refresh the page and try again.');
      return;
    }
    
    try {
      navigateTo(page, params);
    } catch (error) {
      console.error('HomePage: Navigation error:', error);
      alert('Navigation failed. Please try again.');
    }
  };

  const handleNewsClick = (article) => {
    if (!article || !article.id) {
      console.error('HomePage: Invalid news article data:', article);
      alert('Unable to view this article. Please try again.');
      return;
    }
    
    console.log('HomePage: Clicking news article with REAL ID:', article.id, 'Title:', article.title);
    handleNavigationClick('news-detail', { id: article.id });
  };

  const handleEventClick = (event) => {
    if (!event || !event.id) {
      console.error('HomePage: Invalid event data:', event);
      alert('Unable to view this event. Please try again.');
      return;
    }
    
    console.log('HomePage: Clicking event with REAL ID:', event.id, 'Name:', event.name);
    handleNavigationClick('event-detail', { id: event.id });
  };

  const handleMatchClick = (match) => {
    if (!match || !match.id) {
      console.error('HomePage: Invalid match data:', match);
      alert('Unable to view this match. Please try again.');
      return;
    }
    
    console.log('HomePage: Clicking match with ID:', match.id);
    
    if (match.status === 'upcoming') {
      alert('This match has not started yet. Check back later!');
      return;
    }
    
    handleNavigationClick('match-detail', { id: match.id });
  };

  const handleDiscussionClick = (discussion) => {
    if (!discussion || !discussion.id) {
      console.error('HomePage: Invalid discussion data:', discussion);
      alert('Unable to view this discussion. Please try again.');
      return;
    }
    
    console.log('HomePage: Clicking discussion with REAL ID:', discussion.id, 'Title:', discussion.title);
    handleNavigationClick('thread-detail', { id: discussion.id });
  };

  // Memoize computed values to prevent recalculation
  const liveMatches = useMemo(() => matches.filter(m => m.status === 'live'), [matches]);
  const upcomingMatches = useMemo(() => matches.filter(m => m.status === 'upcoming'), [matches]);
  const completedMatches = useMemo(() => matches.filter(m => m.status === 'completed').slice(0, 3), [matches]);
  const liveEventsBanner = useMemo(() => liveEvents.filter(e => e.status === 'live'), [liveEvents]);

  // Only show banner for real featured/live events  
  const featuredEvents = useMemo(() => liveEvents.filter(e => e.featured === true || e.status === 'live'), [liveEvents]);
  const shouldShowBanner = featuredEvents.length > 0;
  
  console.log('HomePage: All events:', liveEvents.length);
  console.log('HomePage: Featured events found:', featuredEvents.length, featuredEvents.map(e => ({ name: e.name, featured: e.featured, status: e.status })));
  
  let bannerEvent = null;
  
  if (featuredEvents.length > 0) {
    // Show featured or live event
    bannerEvent = featuredEvents[0];
    console.log('HomePage: Showing featured/live event banner:', bannerEvent.name);
  }

  // Reset image loading states when banner event changes
  const currentBannerUrl = bannerEvent ? getEventBannerUrl(bannerEvent) : null;
  const [lastBannerUrl, setLastBannerUrl] = useState(null);
  
  if (currentBannerUrl !== lastBannerUrl) {
    setBannerImageLoaded(false);
    setBannerImageError(false);
    setLastBannerUrl(currentBannerUrl);
  }

  // Handle banner image load/error events
  const handleBannerImageLoad = () => {
    console.log('✅ Banner image loaded successfully:', currentBannerUrl);
    setBannerImageLoaded(true);
    setBannerImageError(false);
  };

  const handleBannerImageError = () => {
    console.error('❌ Banner image failed to load:', currentBannerUrl);
    setBannerImageLoaded(false);
    setBannerImageError(true);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* VLR.gg inspired layout - 4 columns */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        
        {/* Left Sidebar - Recent Discussions */}
        <div className="xl:col-span-3">
          <div className="card">
            <div 
              className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              onClick={() => handleNavigationClick('forums')}
            >
              <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Recent Discussion
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {recentDiscussions.length > 0 ? (
                recentDiscussions.map(discussion => (
                  <div 
                    key={discussion.id} 
                    className="recent-discussion-item cursor-pointer"
                    onClick={() => handleDiscussionClick(discussion)}
                  >
                    <div className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {discussion.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>{discussion.author}</span>
                        <span>•</span>
                        <span>{discussion.replies} replies</span>
                        <span>•</span>
                        <span>{discussion.lastActivity}</span>
                      </div>
                      <div className="mt-1">
                        <span className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                          {discussion.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-pulse">Loading discussions...</div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No discussions available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Content - Live Events & News */}
        <div className="xl:col-span-6 space-y-4">
          {/* Live Event Card - Show only for REAL live events */}
          {shouldShowBanner && bannerEvent && (
            <div 
              className="card overflow-hidden cursor-pointer transform transition-all hover:scale-[1.01]"
              onClick={() => handleEventClick(bannerEvent)}
            >
              {currentBannerUrl ? (
                <div className="relative h-48 bg-gradient-to-br from-red-600 to-red-800">
                  <img 
                    src={currentBannerUrl}
                    alt={bannerEvent.name}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      bannerImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={handleBannerImageLoad}
                    onError={handleBannerImageError}
                    loading="eager"
                  />
                  {!bannerImageLoaded && !bannerImageError && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white">
                        <div className="animate-pulse">Loading banner...</div>
                      </div>
                    </div>
                  )}
                  {bannerImageError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
                      <div className="text-white text-center p-4">
                        <h3 className="text-2xl font-bold mb-2">{bannerEvent.name}</h3>
                        <p className="text-sm opacity-90">{bannerEvent.status === 'live' ? '🔴 LIVE NOW' : bannerEvent.stage}</p>
                      </div>
                    </div>
                  )}
                  {bannerEvent.status === 'live' && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                        LIVE
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-48 bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <div className="text-white text-center p-4">
                    <h3 className="text-2xl font-bold mb-2">{bannerEvent.name}</h3>
                    <p className="text-sm opacity-90">{bannerEvent.status === 'live' ? '🔴 LIVE NOW' : bannerEvent.stage}</p>
                    <p className="text-lg font-bold mt-2">{bannerEvent.prizePool}</p>
                  </div>
                  {bannerEvent.status === 'live' && (
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                        LIVE
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{bannerEvent.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{bannerEvent.stage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-600 dark:text-red-400">{bannerEvent.prizePool}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{bannerEvent.teams} teams</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <div className="card">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-red-600 text-white">
                <h2 className="text-xs font-semibold uppercase tracking-wide flex items-center gap-2">
                  <span className="animate-pulse">🔴</span> Live Matches
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {liveMatches.map(match => (
                  <div 
                    key={match.id}
                    className="px-3 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <TeamLogo team={match.team1} className="w-6 h-6" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.team1?.name || 'TBD'}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {match.score}
                        </div>
                        <div className="flex items-center gap-2">
                          <TeamLogo team={match.team2} className="w-6 h-6" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.team2?.name || 'TBD'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-red-600 dark:text-red-400 font-bold animate-pulse">LIVE</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{match.format}</div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {match.event.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Matches */}
          <div className="card">
            <div 
              className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              onClick={() => handleNavigationClick('matches')}
            >
              <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Upcoming Matches
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {upcomingMatches.length > 0 ? (
                upcomingMatches.slice(0, 5).map(match => (
                  <div 
                    key={match.id}
                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <TeamLogo team={match.team1} className="w-6 h-6" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.team1?.name || 'TBD'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">vs</div>
                        <div className="flex items-center gap-2">
                          <TeamLogo team={match.team2} className="w-6 h-6" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {match.team2?.name || 'TBD'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-600 dark:text-gray-400">{match.time}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{match.format}</div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {match.event.name}
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-pulse">Loading matches...</div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No upcoming matches
                </div>
              )}
            </div>
          </div>

          {/* Completed Matches */}
          {completedMatches.length > 0 && (
            <div className="card">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  Recent Results
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {completedMatches.map(match => (
                  <div 
                    key={match.id}
                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => handleMatchClick(match)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex items-center gap-2">
                          <TeamLogo team={match.team1} className="w-6 h-6" />
                          <span className={`text-sm font-medium ${
                            match.team1_score > match.team2_score 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {match.team1?.name || 'TBD'}
                          </span>
                        </div>
                        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                          {match.score}
                        </div>
                        <div className="flex items-center gap-2">
                          <TeamLogo team={match.team2} className="w-6 h-6" />
                          <span className={`text-sm font-medium ${
                            match.team2_score > match.team1_score 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            {match.team2?.name || 'TBD'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Completed</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{match.format}</div>
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {match.event.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          <div className="card">
            <div 
              className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              onClick={() => handleNavigationClick('events')}
            >
              <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Events
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {liveEvents.length > 0 ? (
                liveEvents.slice(0, 5).map(event => (
                  <div 
                    key={event.id}
                    className="px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {event.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {event.region} • {event.stage}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-red-600 dark:text-red-400">
                          {event.prizePool}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {event.teams} teams
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-pulse">Loading events...</div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No events available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Featured News */}
        <div className="xl:col-span-3">
          <div className="card">
            <div 
              className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              onClick={() => handleNavigationClick('news')}
            >
              <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Featured News
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {featuredNews.length > 0 ? (
                featuredNews.map(article => {
                  const articleImageUrl = getNewsFeaturedImageUrl(article);
                  console.log('🖼️ HomePage - Article image URL:', articleImageUrl);
                  
                  return (
                    <div 
                      key={article.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleNewsClick(article)}
                    >
                      {articleImageUrl && (
                        <div className="aspect-video w-full overflow-hidden">
                          <img 
                            src={articleImageUrl}
                            alt={article.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              console.error('🖼️ HomePage - Failed to load image:', articleImageUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                          {article.title}
                        </h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {article.excerpt || article.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{article.author?.name || 'MRVL Staff'}</span>
                          <span>•</span>
                          <span>{article.published_at ? formatTimeAgo(article.published_at) : 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : loading ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  <div className="animate-pulse">Loading news...</div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No news available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;