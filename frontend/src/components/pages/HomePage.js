import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getNewsFeaturedImageUrl, getEventBannerUrl, getImageUrl, getEventLogoUrl } from '../../utils/imageUtils';
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
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [eventFilter, setEventFilter] = useState('live'); // 'live', 'upcoming', 'completed'
  const matchesPerPage = 5;

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
    return categoryMap[category] || '';
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
            status: match.status === 'ongoing' ? 'live' : (match.status || 'upcoming'),
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
          eventsData = rawEvents.map(event => {
            // Get prize pool from nested structure or direct field
            let prizePoolValue = event.details?.prize_pool || event.prize_pool;
            let formattedPrizePool = prizePoolValue;
            
            // If it's already formatted with $, use as is
            if (formattedPrizePool && typeof formattedPrizePool === 'string' && formattedPrizePool.startsWith('$')) {
              formattedPrizePool = formattedPrizePool;
            } else if (formattedPrizePool) {
              // Parse the amount and format it
              const amount = parseFloat(formattedPrizePool);
              if (!isNaN(amount)) {
                formattedPrizePool = '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
              }
            }
            
            // Get format from details or direct field
            const formatValue = event.details?.format || event.format;
            const formatDisplay = formatValue ? formatValue.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Tournament';
            
            // Get dates from schedule or direct fields
            const startDate = event.schedule?.start_date || event.start_date;
            const endDate = event.schedule?.end_date || event.end_date;
            
            // Get region from details or direct field
            const regionValue = event.details?.region || event.region || 'International';
            
            // Get teams count from participation or direct field
            const teamsCount = event.participation?.max_teams || event.teams_count || 16;
            
            return {
              id: event.id,
              name: event.name,
              status: event.status === 'ongoing' ? 'live' : event.status,
              stage: event.stage || formatDisplay,
              prizePool: formattedPrizePool || '$100,000',
              teams: teamsCount,
              region: regionValue,
              format: formatDisplay,
              start_date: startDate,
              end_date: endDate,
              banner: event.banner,
              logo: event.logo,
              featured_image: event.featured_image,
              banner_image: event.banner_image,
              featured: event.featured
            };
          });
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
            author: thread.author?.username || thread.author?.name || thread.user_name || 'MRVL User',
            replies: thread.stats?.replies || thread.replies || thread.replies_count || 0,
            lastActivity: thread.meta?.last_reply_at_relative || thread.meta?.created_at_relative || (thread.updated_at ? formatTimeAgo(thread.updated_at) : 'Recently'),
            category: formatCategory(thread.category?.name || thread.category || thread.category_slug)
          }));
        }
      }

      // Process news - ONLY show featured articles on homepage
      let newsData = [];
      if (newsResponse.status === 'fulfilled') {
        const rawNews = newsResponse.value?.data?.data || newsResponse.value?.data || [];
        
        if (Array.isArray(rawNews) && rawNews.length > 0) {
          // Only show featured articles on the homepage
          const featured = rawNews.filter(n => {
            // Check multiple possible locations for featured flag
            return n.featured === true || 
                   n.meta?.featured === true || 
                   n.is_featured === true ||
                   n.featured === 1 ||
                   n.meta?.featured === 1;
          });
          
          // Only use featured articles, don't fallback to non-featured
          newsData = featured.slice(0, 3);
          console.log('HomePage: Showing featured news only:', newsData.length, 'articles');
          
          if (featured.length === 0) {
            console.log('HomePage: No featured articles found. Homepage news section will be empty.');
          }
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
  const completedMatches = useMemo(() => matches.filter(m => m.status === 'completed'), [matches]);
  const liveEventsBanner = useMemo(() => liveEvents.filter(e => e.status === 'live' || e.status === 'ongoing'), [liveEvents]);

  // Filter events based on selected filter
  const filteredEvents = useMemo(() => {
    switch(eventFilter) {
      case 'live':
        return liveEvents.filter(e => e.status === 'live' || e.status === 'ongoing');
      case 'upcoming':
        return liveEvents.filter(e => e.status === 'upcoming' || e.status === 'scheduled');
      case 'completed':
        return liveEvents.filter(e => e.status === 'completed');
      default:
        // Default to live events
        return liveEvents.filter(e => e.status === 'live' || e.status === 'ongoing');
    }
  }, [liveEvents, eventFilter]);
  
  // Only show banner for real featured/live events  
  const featuredEvents = useMemo(() => liveEvents.filter(e => e.featured === true || e.status === 'live' || e.status === 'ongoing'), [liveEvents]);
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
                      {discussion.category && (
                        <div className="mt-1">
                          <span className="inline-block px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded">
                            {discussion.category}
                          </span>
                        </div>
                      )}
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

        {/* Center Content - Events & News */}
        <div className="xl:col-span-6 space-y-4">
          {/* Events - Moved to top */}
          <div className="card">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
              <h2 
                className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors px-2 -mx-2 py-1 rounded"
                onClick={() => handleNavigationClick('events')}
              >
                Events
              </h2>
              <select 
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded border-0 focus:ring-2 focus:ring-red-500 outline-none cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="live">Live</option>
                <option value="upcoming">Upcoming</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 5).map(event => {
                  const eventLogoUrl = getEventLogoUrl(event);
                  return (
                    <div 
                      key={event.id}
                      className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex items-center gap-3">
                        {/* Event Logo on Left */}
                        <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                          <img 
                            src={eventLogoUrl}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs font-bold">
                                  ${event.name.substring(0, 2).toUpperCase()}
                                </div>
                              `;
                            }}
                          />
                        </div>
                        
                        {/* Event Details */}
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {event.name}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {event.region} • {event.format || event.stage} • {event.teams} teams
                              </div>
                              {event.start_date && event.end_date && (
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                  {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                                {event.prizePool}
                              </div>
                              {(event.status === 'live' || event.status === 'ongoing') && (
                                <div className="text-xs text-red-600 dark:text-red-400 font-bold animate-pulse mt-1">LIVE</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
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

          {/* Featured News - Normal cards with image on left */}
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
                      className="px-3 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => handleNewsClick(article)}
                    >
                      <div className="flex gap-3">
                        {articleImageUrl && (
                          <div className="flex-shrink-0 w-24 h-16 overflow-hidden rounded">
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {article.title}
                          </h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                            {article.excerpt || article.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <span>{article.author?.name || 'MRVL Staff'}</span>
                            <span>•</span>
                            <span>{(article.meta?.published_at || article.published_at) ? formatTimeAgo(article.meta?.published_at || article.published_at) : 'Recently'}</span>
                          </div>
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

        {/* Right Sidebar - All Matches with Pagination */}
        <div className="xl:col-span-3 space-y-4">
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
              {(() => {
                const startIndex = (upcomingPage - 1) * matchesPerPage;
                const endIndex = startIndex + matchesPerPage;
                const paginatedUpcoming = upcomingMatches.slice(startIndex, endIndex);
                const totalPages = Math.ceil(upcomingMatches.length / matchesPerPage);

                return (
                  <>
                    {paginatedUpcoming.length > 0 ? (
                      paginatedUpcoming.map(match => (
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
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="px-3 py-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpcomingPage(prev => Math.max(1, prev - 1));
                          }}
                          disabled={upcomingPage === 1}
                          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Page {upcomingPage} of {totalPages}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUpcomingPage(prev => Math.min(totalPages, prev + 1));
                          }}
                          disabled={upcomingPage === totalPages}
                          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>

          {/* Live Matches - Without red banner */}
          {liveMatches.length > 0 && (
            <div className="card">
              <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Live Matches
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {liveMatches.map(match => (
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

          {/* Completed Matches */}
          <div className="card">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Recent Results
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {(() => {
                const startIndex = (completedPage - 1) * matchesPerPage;
                const endIndex = startIndex + matchesPerPage;
                const paginatedCompleted = completedMatches.slice(startIndex, endIndex);
                const totalPages = Math.ceil(completedMatches.length / matchesPerPage);

                return (
                  <>
                    {paginatedCompleted.length > 0 ? (
                      paginatedCompleted.map(match => (
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
                      ))
                    ) : loading ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <div className="animate-pulse">Loading results...</div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        No recent results
                      </div>
                    )}
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="px-3 py-2 flex justify-between items-center border-t border-gray-200 dark:border-gray-600">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompletedPage(prev => Math.max(1, prev - 1));
                          }}
                          disabled={completedPage === 1}
                          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Previous
                        </button>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          Page {completedPage} of {totalPages}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCompletedPage(prev => Math.min(totalPages, prev + 1));
                          }}
                          disabled={completedPage === totalPages}
                          className="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;