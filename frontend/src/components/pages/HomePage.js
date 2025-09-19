import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getNewsFeaturedImageUrl, getEventBannerUrl, getImageUrl, getEventLogoUrl } from '../../utils/imageUtils';
import { formatTimeAgo, formatDateSafe } from '../../lib/utils.js';
import MentionLink from '../shared/MentionLink';
import { safeString } from '../../utils/safeStringUtils';

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

  // Helper function to render content with mentions
  const renderContentWithMentions = (content, mentions = []) => {
    const safeContent = safeString(content);
    if (!safeContent || typeof safeContent !== 'string') return null;

    // If no mentions, return plain text
    if (!mentions || mentions.length === 0) return safeContent;

    // Sort mentions by position to process them in order
    const sortedMentions = [...mentions].sort((a, b) =>
      (a.position_start || 0) - (b.position_start || 0)
    );

    const elements = [];
    let lastIndex = 0;

    sortedMentions.forEach((mention) => {
      const mentionText = mention.mention_text;
      const startPos = safeContent.indexOf(mentionText, lastIndex);

      if (startPos !== -1) {
        // Add text before mention
        if (startPos > lastIndex) {
          elements.push(safeContent.slice(lastIndex, startPos));
        }

        // Add the mention as a clickable component
        elements.push(
          <MentionLink
            key={`mention-${startPos}-${mention.id}`}
            mention={mention}
            navigateTo={navigateTo}
          />
        );

        lastIndex = startPos + mentionText.length;
      }
    });

    // Add remaining text
    if (lastIndex < safeContent.length) {
      elements.push(safeContent.slice(lastIndex));
    }

    return elements.length > 0 ? elements : safeContent;
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
        api.get('/public/forums/threads?limit=5'),
        api.get('/public/news')
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
            status: match.status === 'ongoing' ? 'live' : (match.status === 'scheduled' ? 'upcoming' : (match.status || 'upcoming')),
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
            mentions: thread.mentions || [],
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
          newsData = featured.slice(0, 3).map(article => ({
            ...article,
            mentions: article.mentions || []
          }));
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
      {/* Main 3-column layout: Discussions | Events/News | Matches */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Left Column - Recent Discussions */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <div
              className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              onClick={() => handleNavigationClick('forums')}
            >
              <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Recent Discussions
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {recentDiscussions.length > 0 ? (
                recentDiscussions.map(discussion => (
                  <div
                    key={discussion.id}
                    className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => handleDiscussionClick(discussion)}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 leading-snug">
                          {renderContentWithMentions(discussion.title, discussion.mentions)}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{discussion.author}</span>
                          <span>•</span>
                          <span>{discussion.lastActivity}</span>
                          {discussion.category && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 dark:text-red-400 font-medium">{discussion.category}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                          {discussion.replies}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">replies</div>
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

        {/* Center Column - Events/News */}
        <div className="lg:col-span-1 space-y-4">
          {/* Featured Events Banner */}
          {bannerEvent && shouldShowBanner && (
            <div
              className="relative rounded-lg overflow-hidden cursor-pointer group min-h-[200px] flex items-center justify-center bg-gradient-to-r from-red-900 to-red-700"
              onClick={() => handleEventClick(bannerEvent)}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                {currentBannerUrl && !bannerImageError && (
                  <img
                    src={currentBannerUrl}
                    alt={bannerEvent.name}
                    className={`w-full h-full object-cover transition-opacity duration-500 ${
                      bannerImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={handleBannerImageLoad}
                    onError={handleBannerImageError}
                  />
                )}
                <div className="absolute inset-0 bg-black/50"></div>
              </div>

              {/* Content Overlay */}
              <div className="relative z-10 text-center p-6">
                <div className="mb-2">
                  <span className="inline-block px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded uppercase tracking-wide">
                    {bannerEvent.status === 'live' || bannerEvent.status === 'ongoing' ? 'Live Now' : 'Featured Event'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">
                  {bannerEvent.name}
                </h2>
                <div className="text-sm text-white/90 space-y-1">
                  <div>{bannerEvent.prizePool}</div>
                  <div>{bannerEvent.teams} Teams • {bannerEvent.region}</div>
                </div>
              </div>
            </div>
          )}

          {/* Events List */}
          <div className="card">
            <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Tournament Events
                </h2>
                <div className="flex gap-1">
                  {['live', 'upcoming', 'completed'].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setEventFilter(filter)}
                      className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                        eventFilter === filter
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 5).map(event => (
                  <div
                    key={event.id}
                    className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Event Logo */}
                      <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center overflow-hidden">
                        {getEventLogoUrl(event) ? (
                          <img
                            src={getEventLogoUrl(event)}
                            alt={event.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="text-red-600 dark:text-red-400 text-xs font-bold">
                            {event.name.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                          {event.name}
                        </h3>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                          {event.prizePool} • {event.teams} Teams • {event.region}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          {event.stage}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="flex-shrink-0">
                        {event.status === 'live' || event.status === 'ongoing' ? (
                          <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded">
                            Live
                          </span>
                        ) : event.status === 'upcoming' || event.status === 'scheduled' ? (
                          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded">
                            Completed
                          </span>
                        )}
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
                  No {eventFilter} events
                </div>
              )}
            </div>
          </div>

          {/* Featured News */}
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

                  return (
                    <div
                      key={article.id}
                      className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
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
                            {renderContentWithMentions(article.title, article.mentions)}
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

        {/* Right Column - Matches (with 3 sections) */}
        <div className="lg:col-span-1 space-y-4">
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
              {upcomingMatches.slice(0, 3).length > 0 ? (
                upcomingMatches.slice(0, 3).map(match => (
                  <div
                    key={match.id}
                    className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer min-h-[70px] flex flex-col justify-center"
                    onClick={() => handleMatchClick(match)}
                  >
                    {/* Tournament Name - Top Center */}
                    <div className="text-center mb-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {match.event?.name || 'Tournament'}
                      </div>
                    </div>

                    {/* Teams and Match Info */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Team 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo team={match.team1} className="w-7 h-7 flex-shrink-0 rounded-full" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-tight">
                          {match.team1?.name || 'TBD'}
                        </span>
                      </div>

                      {/* Center: Score and Format */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">vs</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{match.format}</div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-tight">
                          {match.team2?.name || 'TBD'}
                        </span>
                        <TeamLogo team={match.team2} className="w-7 h-7 flex-shrink-0 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No upcoming matches
                </div>
              )}
            </div>
          </div>

          {/* Live Matches */}
          {liveMatches.length > 0 && (
            <div className="card">
              <div
                className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                onClick={() => handleNavigationClick('matches')}
              >
                <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  Live Matches
                </h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {liveMatches.map(match => (
                  <div
                    key={match.id}
                    className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer min-h-[70px] flex flex-col justify-center"
                    onClick={() => handleMatchClick(match)}
                  >
                    {/* Tournament Name - Top Center */}
                    <div className="text-center mb-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {match.event?.name || 'Tournament'}
                      </div>
                    </div>

                    {/* Teams and Match Info */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Team 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo team={match.team1} className="w-7 h-7 flex-shrink-0 rounded-full" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-tight">
                          {match.team1?.name || 'TBD'}
                        </span>
                      </div>

                      {/* Center: Live Score and Format */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                          {match.score || '0-0'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{match.format}</div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 leading-tight">
                          {match.team2?.name || 'TBD'}
                        </span>
                        <TeamLogo team={match.team2} className="w-7 h-7 flex-shrink-0 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Completed Matches */}
          <div className="card">
            <div
              className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              onClick={() => handleNavigationClick('matches')}
            >
              <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                Completed Matches
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {completedMatches.slice(0, 3).length > 0 ? (
                completedMatches.slice(0, 3).map(match => (
                  <div
                    key={match.id}
                    className="px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer min-h-[70px] flex flex-col justify-center"
                    onClick={() => handleMatchClick(match)}
                  >
                    {/* Tournament Name - Top Center */}
                    <div className="text-center mb-2">
                      <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {match.event?.name || 'Tournament'}
                      </div>
                    </div>

                    {/* Teams and Match Info */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Team 1 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <TeamLogo team={match.team1} className="w-7 h-7 flex-shrink-0 rounded-full" />
                        <span className={`text-sm font-medium line-clamp-1 leading-tight ${
                          match.team1_score > match.team2_score
                            ? 'text-green-600 dark:text-green-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {match.team1?.name || 'TBD'}
                        </span>
                      </div>

                      {/* Center: Final Score and Format */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
                          {match.score}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{match.format}</div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                        <span className={`text-sm font-medium line-clamp-1 leading-tight ${
                          match.team2_score > match.team1_score
                            ? 'text-green-600 dark:text-green-400 font-semibold'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}>
                          {match.team2?.name || 'TBD'}
                        </span>
                        <TeamLogo team={match.team2} className="w-7 h-7 flex-shrink-0 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No completed matches
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