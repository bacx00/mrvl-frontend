import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { TeamLogo, getNewsFeaturedImageUrl, getEventBannerUrl, getImageUrl } from '../../utils/imageUtils';
import { formatTimeAgo, formatDateSafe } from '../../lib/utils.js';
import liveScoreManager from '../../utils/LiveScoreManager';

function HomePage({ navigateTo }) {
  const { api } = useAuth();
  const [matches, setMatches] = useState([]);
  const [liveEvents, setLiveEvents] = useState([]);
  const [recentDiscussions, setRecentDiscussions] = useState([]);
  const [featuredNews, setFeaturedNews] = useState([]);
  const [bannerImageLoaded, setBannerImageLoaded] = useState(false);
  const [bannerImageError, setBannerImageError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // CRITICAL FIX: Use REAL BACKEND DATA ONLY - no more mock data
      console.log('HomePage: Fetching REAL LIVE DATA from backend...');
      
      let matchesData = [];
      let eventsData = [];
      let discussionsData = [];
      let newsData = [];

      try {
        // Get REAL matches from backend
        const matchResponse = await api.get('/matches');
        const rawMatches = matchResponse?.data?.data || matchResponse?.data || [];
        
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
            // ✅ FIXED: No more fake viewer generation - use real backend data only
            viewers: match.viewers || 0
          }));
          console.log('HomePage: Using REAL backend matches:', matchesData.length);
        }
      } catch (error) {
        console.error('HomePage: No backend matches available:', error);
        matchesData = []; // Empty if no backend data
      }

      try {
        // Get REAL events from backend
        const eventsResponse = await api.get('/events');
        const rawEvents = eventsResponse?.data?.data || eventsResponse?.data || [];
        
        if (Array.isArray(rawEvents) && rawEvents.length > 0) {
          eventsData = rawEvents.map(event => ({
            id: event.id,
            name: event.name,
            status: event.status,
            stage: event.stage || 'Main Event',
            prizePool: event.prize_pool || '$100,000',
            teams: event.teams_count || 16,
            region: event.region || 'International',
            // ✅ NEW: Live Event Banner Data
            banner: event.banner,
            logo: event.logo,
            featured_image: event.featured_image,
            banner_image: event.banner_image,
            featured: event.featured
          }));
          console.log('HomePage: Using REAL backend events:', eventsData.length);
        }
      } catch (error) {
        console.error('HomePage: No backend events available:', error);
        eventsData = [];
      }

      // CRITICAL FIX: Get REAL forum discussions from backend ONLY  
      try {
        console.log('HomePage: Fetching REAL forum discussions from backend...');
        const forumsResponse = await api.get('/forums/threads');
        const rawDiscussions = forumsResponse?.data?.data || forumsResponse?.data || [];
        
        if (Array.isArray(rawDiscussions) && rawDiscussions.length > 0) {
          // ✅ ENHANCED FIX: Better date validation and debugging
          discussionsData = rawDiscussions
            .filter(thread => thread.id && thread.title && thread.id > 0) // Only valid threads
            .slice(0, 8)
            .map(thread => {
              // Improved date handling with multiple fallbacks - check meta object
              const dateToFormat = thread.updated_at || 
                                  thread.meta?.last_reply_at ||
                                  thread.meta?.created_at ||
                                  thread.last_post_at || 
                                  thread.last_reply_at || 
                                  thread.created_at;
              
              // Debug logging for date issues
              if (!dateToFormat || dateToFormat === 'unknown') {
                console.warn('HomePage: Thread with bad date:', {
                  id: thread.id,
                  title: thread.title,
                  updated_at: thread.updated_at,
                  created_at: thread.created_at,
                  last_post_at: thread.last_post_at,
                  last_reply_at: thread.last_reply_at
                });
              }
              
              return {
                id: thread.id,
                title: thread.title,
                // ✅ FIXED: Use "MRVL User" instead of "Anonymous"
                author: thread.user_name || thread.author?.name || thread.user?.username || 'MRVL User',
                replies: thread.replies || thread.replies_count || thread.posts_count || 0,
                lastActivity: dateToFormat ? formatTimeAgo(dateToFormat) : 'Recently',
                category: formatCategory(thread.category || thread.category_slug)
              };
            });
          console.log('HomePage: Using REAL valid discussions:', discussionsData.length);
        }
      } catch (error) {
        console.error('HomePage: No backend discussions available:', error);
        discussionsData = [];
      }

      // Fetch REAL news from backend
      try {
        const newsResponse = await api.get('/news');
        const rawNews = newsResponse?.data?.data || newsResponse?.data || newsResponse || [];
        
        if (Array.isArray(rawNews) && rawNews.length > 0) {
          const featured = rawNews.filter(n => n.featured).slice(0, 3);
          newsData = featured.length > 0 ? featured : rawNews.slice(0, 3);
          console.log('HomePage: Using REAL backend news:', newsData.length);
        }
      } catch (error) {
        console.error('HomePage: No backend news available:', error);
        newsData = [];
      }
      
      // Set state with REAL backend data ONLY
      setMatches(matchesData);
      setLiveEvents(eventsData);
      setRecentDiscussions(discussionsData); // FIXED: Use real backend discussions
      setFeaturedNews(newsData);
      
      console.log('HomePage: All data loaded with REAL backend data ONLY');
      console.log('HomePage: Events loaded:', eventsData.length, eventsData);
      console.log('HomePage: Live events found:', eventsData.filter(e => e.status === 'live').length);
    } catch (error) {
      console.error('HomePage: Critical error in fetchData:', error);
      
      // CRITICAL FIX: No more fallback to mock data
      setMatches([]);
      setLiveEvents([]);
      setFeaturedNews([]);
      setRecentDiscussions([]);
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ENHANCED: Real-time score update handler for HomePage match cards
  const handleLiveScoreUpdate = useCallback((updateData, source) => {
    console.log(`🏠 HomePage received live update from ${source}:`, updateData);
    
    if (!updateData.data || !updateData.matchId) return;

    const { matchId, data: scoreData } = updateData;
    
    setMatches(prevMatches => {
      return prevMatches.map(match => {
        if (match.id === matchId) {
          const updatedMatch = {
            ...match,
            // Update scores
            team1_score: scoreData.team1_score !== undefined ? scoreData.team1_score : 
                         scoreData.team1Score !== undefined ? scoreData.team1Score : match.team1_score,
            team2_score: scoreData.team2_score !== undefined ? scoreData.team2_score :
                         scoreData.team2Score !== undefined ? scoreData.team2Score : match.team2_score,
            // Update status if provided
            status: scoreData.status || match.status,
            // Update score display
            score: (scoreData.team1_score !== undefined || scoreData.team2_score !== undefined) 
              ? `${scoreData.team1_score || scoreData.team1Score || match.team1_score || 0}-${scoreData.team2_score || scoreData.team2Score || match.team2_score || 0}`
              : match.score
          };
          
          console.log(`✅ HomePage updated match ${matchId} with live scores:`, {
            team1: updatedMatch.team1_score,
            team2: updatedMatch.team2_score,
            source
          });
          
          return updatedMatch;
        }
        return match;
      });
    });
  }, []);

  // REMOVED: HomePage no longer subscribes to live updates to reduce overhead
  // Live updates should only be between MatchDetailPage ↔ LiveScoring panel
  // HomePage will refresh match data on focus/navigation instead

  // Note: formatTimeAgo is now imported from utils for consistency and safety

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

  // CRITICAL FIX: Validate data before clicking handlers
  const handleMatchClick = (match) => {
    if (!match || !match.id) {
      console.error('HomePage: Invalid match data:', match);
      alert('Error: Match data is invalid. Cannot view match details.');
      return;
    }
    
    console.log('HomePage: Clicking match with ID:', match.id);
    handleNavigationClick('match-detail', { id: match.id });
  };

  const handleNewsClick = (article) => {
    if (!article || !article.id) {
      console.error('HomePage: Invalid article data:', article);
      alert('Error: Article data is invalid. Cannot view article.');
      return;
    }
    
    console.log('HomePage: Clicking news article with ID:', article.id, 'Title:', article.title);
    handleNavigationClick('news-detail', { id: article.id });
  };

  // CRITICAL FIX: Use REAL thread IDs from backend
  const handleDiscussionClick = (discussion) => {
    if (!discussion || !discussion.id) {
      console.error('HomePage: Invalid discussion data:', discussion);
      alert('Error: Discussion data is invalid. Cannot view thread.');
      return;
    }
    
    console.log('HomePage: Clicking discussion with REAL ID:', discussion.id, 'Title:', discussion.title);
    handleNavigationClick('thread-detail', { id: discussion.id });
  };

  const liveMatches = matches.filter(m => m.status === 'live');
  const upcomingMatches = matches.filter(m => m.status === 'upcoming');
  const completedMatches = matches.filter(m => m.status === 'completed').slice(0, 3); // Show last 3 completed matches
  const liveEventsBanner = liveEvents.filter(e => e.status === 'live');

  // Only show banner for real featured/live events  
  const featuredEvents = liveEvents.filter(e => e.featured === true || e.status === 'live');
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
                    <h3 className="recent-discussion-title text-gray-900 dark:text-gray-100 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      {discussion.title}
                    </h3>
                    <div className="flex items-center justify-between recent-discussion-meta">
                      <span className="truncate text-xs text-gray-600 dark:text-gray-400">{discussion.author}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">{discussion.replies}</span>
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {discussion.lastActivity}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-500">
                  <div className="text-2xl mb-2"></div>
                  <div className="text-sm">No discussions yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Content - Live Banner + Featured News */}
        <div className="xl:col-span-6">
          {/* ✅ NEW: EVENT BANNER WITH ACTUAL IMAGES */}
          {shouldShowBanner && bannerEvent && (
            <div className="mb-6">
              <div className="relative rounded-lg overflow-hidden shadow-xl transform hover:scale-[1.02] transition-all duration-300 group">
                {/* Loading State */}
                {!bannerImageLoaded && !bannerImageError && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-r from-gray-600 to-gray-700">
                    <div className="flex items-center space-x-2 text-white">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Loading banner...</span>
                    </div>
                  </div>
                )}
                
                {/* Banner Image - Smaller height */}
                <div className="relative w-full h-32 sm:h-36 md:h-40">
                  <img
                    src={currentBannerUrl}
                    alt={`${bannerEvent.name} Banner`}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                      bannerImageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                    onLoad={handleBannerImageLoad}
                    onError={handleBannerImageError}
                  />
                  
                  {/* Gradient Overlay for Text Readability - No blue */}
                  <div className={`absolute inset-0 ${
                    bannerEvent.status === 'live' 
                      ? 'bg-gradient-to-r from-red-900/80 via-red-900/60 to-red-900/80' 
                      : 'bg-gradient-to-r from-gray-900/80 via-gray-900/60 to-gray-900/80'
                  }`}></div>
                  
                  {/* Content Overlay - Smaller padding */}
                  <div className="absolute inset-0 flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 text-white">
                    <div className="flex-1">
                      {/* Status Badge */}
                      <div className="flex items-center space-x-2 mb-2">
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          bannerEvent.status === 'live' 
                            ? 'bg-red-500/90 text-white' 
                            : 'bg-gray-600/90 text-white'
                        }`}>
                          {bannerEvent.status === 'live' && (
                            <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse"></div>
                          )}
                          {bannerEvent.status === 'live' ? 'LIVE NOW' : 'UPCOMING'}
                        </div>
                        {bannerEvent.region && (
                          <span className="text-xs bg-black/30 px-2 py-1 rounded-full">
                            {bannerEvent.region}
                          </span>
                        )}
                      </div>
                      
                      {/* Event Details - Smaller text */}
                      <div className="space-y-1">
                        <h3 className="text-base sm:text-lg font-bold text-white drop-shadow-lg leading-tight">
                          {bannerEvent.name}
                        </h3>
                        <p className="text-white/90 text-xs font-medium">
                          {bannerEvent.stage} • {bannerEvent.prizePool} • {bannerEvent.teams} Teams
                        </p>
                      </div>
                    </div>
                    
                    {/* Action Button - Responsive sizing */}
                    <div className="mt-3 sm:mt-0 sm:ml-6 self-end sm:self-center">
                      <button 
                        onClick={() => {
                          console.log('HomePage: Banner button clicked for event:', bannerEvent.name, 'Status:', bannerEvent.status);
                          if (bannerEvent.id && bannerEvent.id !== 'demo-event') {
                            handleNavigationClick('event-detail', { id: bannerEvent.id });
                          } else {
                            handleNavigationClick('events');
                          }
                        }}
                        className={`px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg ${
                          bannerEvent.status === 'live'
                            ? 'bg-white text-red-600 hover:bg-red-50'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span className="hidden sm:inline">{bannerEvent.status === 'live' ? 'Watch Live →' : 'View Tournament →'}</span>
                        <span className="sm:hidden">{bannerEvent.status === 'live' ? 'Watch →' : 'View →'}</span>
                      </button>
                    </div>
                  </div>
                  
                  {/* Error State Fallback */}
                  {bannerImageError && (
                    <div className={`absolute inset-0 flex items-center justify-center ${
                      bannerEvent.status === 'live' 
                        ? 'bg-gradient-to-r from-red-600 to-red-700' 
                        : 'bg-gradient-to-r from-gray-600 to-gray-700'
                    }`}>
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">🏆</div>
                        <p className="text-sm opacity-75">Tournament Banner</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Featured News */}
          <div className="card">
            <div 
              className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              onClick={() => handleNavigationClick('news')}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-red-600 dark:text-red-400">Featured News</h2>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigationClick('news');
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  View all →
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              {featuredNews.length > 0 ? (
                featuredNews.map((article) => (
                  <div 
                    key={article.id}
                    className="flex space-x-3 cursor-pointer group"
                    onClick={() => handleNewsClick(article)}
                  >
                    <img 
                      src={getNewsFeaturedImageUrl(article)} 
                      alt={article.title}
                      className="w-20 h-16 object-cover rounded group-hover:opacity-80 transition-opacity"
                      onError={(e) => {
                        e.target.onerror = null;
                        // Use a proper placeholder URL instead of question mark
                        e.target.src = 'https://staging.mrvl.net/images/news-placeholder.svg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 line-clamp-1">
                        {article.excerpt || article.content?.substring(0, 100)}
                      </p>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-gray-400 dark:text-gray-500">
                        <span className="text-gray-600 dark:text-gray-400">{article.author?.name || 'MRVL Team'}</span>
                        <span>•</span>
                        <span>{formatDateSafe(article.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-500">
                  <div className="text-2xl mb-2"></div>
                  <div className="text-sm">No news articles yet</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Matches with BIGGER DISPLAYS */}
        <div className="xl:col-span-3">
          <div className="space-y-3">
            {/* Live Matches */}
            {liveMatches.length > 0 && (
              <div className="card">
                <div 
                  className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  onClick={() => handleNavigationClick('matches')}
                >
                  <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide flex items-center">
                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                    Live Matches
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {liveMatches.filter(match => match && match.team1 && match.team2).map(match => (
                    <div 
                      key={match.id} 
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => handleMatchClick(match)}
                    >
                      {/* Event Logo and Info Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {/* Event Logo */}
                          {match.event?.logo && (
                            <img 
                              src={getImageUrl(match.event.logo)}
                              alt={match.event.name}
                              className="w-5 h-5 rounded object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <span className="text-xs font-medium text-red-600 dark:text-red-400">LIVE</span>
                          {/* ✅ FIXED: Show real viewers or nothing if 0 */}
                          {match.viewers > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {match.viewers.toLocaleString()} viewers
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-center">
                        {/* BIGGER TEAM DISPLAYS */}
                        <div className="flex items-center justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
                          <div className={`flex items-center space-x-2 ${match.status === 'completed' && match.team1_score <= match.team2_score ? 'opacity-50' : ''}`}>
                            <TeamLogo team={match.team1} size="w-6 h-6" />
                            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">{match.team1.short_name || match.team1.name}</span>
                          </div>
                          <div className="text-center px-2">
                            <div className="text-red-600 dark:text-red-400 font-bold text-lg">
                              <span className={match.status === 'completed' && match.team1_score > match.team2_score ? 'text-green-600 dark:text-green-400' : ''}>
                                {match.team1_score || 0}
                              </span>
                              -
                              <span className={match.status === 'completed' && match.team2_score > match.team1_score ? 'text-green-600 dark:text-green-400' : ''}>
                                {match.team2_score || 0}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {match.format}
                            </div>
                          </div>
                          <div className={`flex items-center space-x-2 ${match.status === 'completed' && match.team2_score <= match.team1_score ? 'opacity-50' : ''}`}>
                            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">{match.team2.short_name || match.team2.name}</span>
                            <TeamLogo team={match.team2} size="w-6 h-6" />
                          </div>
                        </div>
                        {/* REAL TOURNAMENT NAME */}
                        <div className="text-xs text-gray-500 dark:text-gray-500 truncate font-medium">
                          {match.event?.name}
                        </div>
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
                  upcomingMatches.filter(match => match && match.team1 && match.team2 && match.team1.name && match.team2.name).map(match => (
                    <div 
                      key={match.id} 
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => handleMatchClick(match)}
                    >
                      {/* Event Logo and Time Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {/* Event Logo */}
                          {match.event?.logo && (
                            <img 
                              src={getImageUrl(match.event.logo)}
                              alt={match.event.name}
                              className="w-5 h-5 rounded object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            {match.time}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        {/* BIGGER TEAM DISPLAYS */}
                        <div className="flex items-center justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
                          <div className="flex items-center space-x-2">
                            <TeamLogo team={match.team1} size="w-6 h-6" />
                            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">{match.team1.short_name || match.team1.name}</span>
                          </div>
                          <div className="text-center px-2">
                            <div className="text-gray-400 dark:text-gray-500 font-bold">vs</div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {match.format}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">{match.team2.short_name || match.team2.name}</span>
                            <TeamLogo team={match.team2} size="w-6 h-6" />
                          </div>
                        </div>
                        {/* REAL TOURNAMENT NAME */}
                        <div className="text-xs text-gray-500 dark:text-gray-500 truncate font-medium">
                          {match.event?.name}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-500">
                    <div className="text-2xl mb-2"></div>
                    <div className="text-sm">No upcoming matches</div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Results */}
            {completedMatches.length > 0 && (
              <div className="card">
                <div 
                  className="px-3 py-2 border-b border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  onClick={() => handleNavigationClick('matches')}
                >
                  <h2 className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                    Recent Results
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {completedMatches.filter(match => match && match.team1 && match.team2).map(match => (
                    <div 
                      key={match.id} 
                      className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => handleMatchClick(match)}
                    >
                      {/* Event Logo and Status Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {/* Event Logo */}
                          {match.event?.logo && (
                            <img 
                              src={getImageUrl(match.event.logo)}
                              alt={match.event.name}
                              className="w-5 h-5 rounded object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            Completed
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        {/* Team displays with winner highlighting */}
                        <div className="flex items-center justify-between text-sm font-medium text-gray-900 dark:text-white mb-1">
                          <div className={`flex items-center space-x-2 ${match.team1_score <= match.team2_score ? 'opacity-60' : ''}`}>
                            <TeamLogo team={match.team1} size="w-6 h-6" />
                            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">{match.team1.short_name || match.team1.name}</span>
                          </div>
                          <div className="text-center px-2">
                            <div className="text-red-600 dark:text-red-400 font-bold text-lg">
                              <span className={match.team1_score > match.team2_score ? 'text-green-600 dark:text-green-400' : ''}>
                                {match.team1_score || 0}
                              </span>
                              -
                              <span className={match.team2_score > match.team1_score ? 'text-green-600 dark:text-green-400' : ''}>
                                {match.team2_score || 0}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {match.format}
                            </div>
                          </div>
                          <div className={`flex items-center space-x-2 ${match.team2_score <= match.team1_score ? 'opacity-60' : ''}`}>
                            <span className="truncate text-gray-900 dark:text-gray-100 font-bold">{match.team2.short_name || match.team2.name}</span>
                            <TeamLogo team={match.team2} size="w-6 h-6" />
                          </div>
                        </div>
                        {/* Tournament info */}
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          {match.event?.name}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;