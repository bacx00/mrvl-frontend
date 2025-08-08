import React, { useState, useEffect } from 'react';
import { 
  Home, Calendar, Trophy, Users, User, Menu, X, Bell, 
  Filter, ChevronDown, Globe, Star, TrendingUp, Clock,
  Gamepad2, Shield, Zap, Heart, Search, ArrowUp
} from 'lucide-react';

// Mobile-First Navigation Component
export const MobileBottomNav = ({ currentPage, navigateTo, user }) => {
  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'matches', icon: Calendar, label: 'Matches' },
    { id: 'teams', icon: Users, label: 'Teams' },
    { id: 'events', icon: Trophy, label: 'Events' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-50">
      <div className="grid grid-cols-5 h-16">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
              currentPage === item.id 
                ? 'text-red-500 dark:text-red-400' 
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Customizable Mobile Dashboard
export const MobileDashboard = ({ navigateTo }) => {
  const [customLayout, setCustomLayout] = useState(() => {
    const saved = localStorage.getItem('mrvl_mobile_layout');
    return saved ? JSON.parse(saved) : {
      showLiveMatches: true,
      showUpcoming: true,
      showNews: true,
      showRankings: false,
      favoriteTeams: [],
      region: 'all'
    };
  });

  const [liveMatches, setLiveMatches] = useState([]);
  const [upcomingMatches, setUpcomingMatches] = useState([]);
  const [news, setNews] = useState([]);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Save preferences
  useEffect(() => {
    localStorage.setItem('mrvl_mobile_layout', JSON.stringify(customLayout));
  }, [customLayout]);

  return (
    <div className="pb-20">
      {/* Quick Actions Bar */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40">
        <div className="flex items-center justify-between p-3">
          <div className="flex space-x-2 overflow-x-auto">
            <QuickFilterButton 
              icon={Globe} 
              label={customLayout.region.toUpperCase()}
              onClick={() => setShowCustomizer(true)}
            />
            <QuickFilterButton 
              icon={Star} 
              label="Favorites"
              active={customLayout.showFavorites}
              onClick={() => setCustomLayout({...customLayout, showFavorites: !customLayout.showFavorites})}
            />
            <QuickFilterButton 
              icon={TrendingUp} 
              label="Live"
              active={customLayout.showLiveOnly}
              onClick={() => setCustomLayout({...customLayout, showLiveOnly: !customLayout.showLiveOnly})}
            />
          </div>
          <button 
            onClick={() => setShowCustomizer(true)}
            className="p-2 text-gray-600 dark:text-gray-400"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Live Score Ticker */}
      {customLayout.showLiveMatches && (
        <LiveScoreTicker matches={liveMatches} navigateTo={navigateTo} />
      )}

      {/* Customizable Content Sections */}
      <div className="p-4 space-y-4">
        {customLayout.showUpcoming && (
          <MobileMatchesSection 
            title="Upcoming Matches" 
            matches={upcomingMatches}
            navigateTo={navigateTo}
            region={customLayout.region}
            favoriteTeams={customLayout.favoriteTeams}
          />
        )}

        {customLayout.showNews && (
          <MobileNewsSection 
            news={news}
            navigateTo={navigateTo}
          />
        )}

        {customLayout.showRankings && (
          <QuickRankings navigateTo={navigateTo} />
        )}
      </div>

      {/* Customization Modal */}
      {showCustomizer && (
        <MobileCustomizer 
          layout={customLayout}
          setLayout={setCustomLayout}
          onClose={() => setShowCustomizer(false)}
        />
      )}
    </div>
  );
};

// Live Score Ticker Component
const LiveScoreTicker = ({ matches, navigateTo }) => {
  return (
    <div className="bg-red-500 dark:bg-red-700 text-white">
      <div className="flex overflow-x-auto scrollbar-hide p-3 space-x-4">
        {matches.length === 0 ? (
          <div className="text-sm">No live matches</div>
        ) : (
          matches.map(match => (
            <LiveMatchCard 
              key={match.id} 
              match={match} 
              onClick={() => navigateTo('match-detail', { matchId: match.id })}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Compact Live Match Card
const LiveMatchCard = ({ match, onClick }) => {
  return (
    <button 
      onClick={onClick}
      className="flex-shrink-0 bg-white/10 rounded-lg p-3 min-w-[200px]"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs opacity-75">LIVE</span>
        <span className="text-xs font-mono">{match.match_timer || '0:00'}</span>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{match.team1?.short_name}</span>
          <span className="text-lg font-bold">{match.team1_score || 0}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{match.team2?.short_name}</span>
          <span className="text-lg font-bold">{match.team2_score || 0}</span>
        </div>
      </div>
    </button>
  );
};

// Mobile Matches Section with Swipe
const MobileMatchesSection = ({ title, matches, navigateTo, region, favoriteTeams }) => {
  const filteredMatches = matches.filter(match => {
    if (region !== 'all' && match.event?.region !== region) return false;
    if (favoriteTeams.length > 0) {
      return favoriteTeams.includes(match.team1_id) || favoriteTeams.includes(match.team2_id);
    }
    return true;
  });

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{title}</h2>
      <div className="space-y-2">
        {filteredMatches.slice(0, 5).map(match => (
          <MobileMatchCard 
            key={match.id} 
            match={match} 
            onClick={() => navigateTo('match-detail', { matchId: match.id })}
          />
        ))}
      </div>
    </div>
  );
};

// Optimized Mobile Match Card
const MobileMatchCard = ({ match, onClick }) => {
  const isLive = match.status === 'live';
  const heroMap = {
    'Vanguard': Shield,
    'Duelist': Zap,
    'Strategist': Heart
  };

  return (
    <button 
      onClick={onClick}
      className="w-full bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-left"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {match.event?.name || 'Tournament'}
        </span>
        {isLive && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">LIVE</span>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 items-center">
        <div className="text-right">
          <div className="font-medium">{match.team1?.short_name}</div>
          {match.team1_score !== undefined && (
            <div className="text-2xl font-bold">{match.team1_score}</div>
          )}
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500">VS</div>
          {match.scheduled_at && !isLive && (
            <div className="text-xs mt-1">
              {new Date(match.scheduled_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
        </div>
        
        <div className="text-left">
          <div className="font-medium">{match.team2?.short_name}</div>
          {match.team2_score !== undefined && (
            <div className="text-2xl font-bold">{match.team2_score}</div>
          )}
        </div>
      </div>

      {/* Hero picks preview for live matches */}
      {isLive && match.hero_data && (
        <div className="mt-2 flex justify-between">
          <div className="flex -space-x-1">
            {match.hero_data.team1?.slice(0, 3).map((hero, i) => {
              const Icon = heroMap[hero.role] || Gamepad2;
              return (
                <div key={i} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Icon className="w-3 h-3" />
                </div>
              );
            })}
          </div>
          <div className="flex -space-x-1">
            {match.hero_data.team2?.slice(0, 3).map((hero, i) => {
              const Icon = heroMap[hero.role] || Gamepad2;
              return (
                <div key={i} className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <Icon className="w-3 h-3" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </button>
  );
};

// Mobile News Section
const MobileNewsSection = ({ news, navigateTo }) => {
  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Latest News</h2>
      <div className="space-y-3">
        {news.slice(0, 3).map(article => (
          <button
            key={article.id}
            onClick={() => navigateTo('news-detail', { newsId: article.id })}
            className="w-full bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 text-left"
          >
            <div className="flex space-x-3">
              {article.featured_image && (
                <img 
                  src={article.featured_image} 
                  alt=""
                  className="w-20 h-20 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h3 className="font-medium line-clamp-2">{article.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {article.category?.name || article.category_name || 'News'} • {new Date(article.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Quick Rankings Widget
const QuickRankings = ({ navigateTo }) => {
  const [rankings, setRankings] = useState([]);

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Top Teams</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        {rankings.slice(0, 5).map((team, index) => (
          <button
            key={team.id}
            onClick={() => navigateTo('team-detail', { teamId: team.id })}
            className="w-full p-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 last:border-0"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg font-bold text-gray-500">#{index + 1}</span>
              <div className="text-left">
                <div className="font-medium">{team.name}</div>
                <div className="text-xs text-gray-500">{team.rating} pts</div>
              </div>
            </div>
            {index === 0 && <Trophy className="w-5 h-5 text-yellow-500" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// Mobile Customizer Modal
const MobileCustomizer = ({ layout, setLayout, onClose }) => {
  const regions = ['all', 'NA', 'EU', 'APAC', 'CN', 'SA'];
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white dark:bg-gray-900 w-full rounded-t-2xl max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Customize Dashboard</h3>
            <button onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Region Selector */}
          <div>
            <label className="text-sm font-medium mb-2 block">Region</label>
            <div className="grid grid-cols-3 gap-2">
              {regions.map(region => (
                <button
                  key={region}
                  onClick={() => setLayout({...layout, region})}
                  className={`p-2 rounded-lg border ${
                    layout.region === region
                      ? 'bg-red-500 text-white border-red-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {region}
                </button>
              ))}
            </div>
          </div>

          {/* Content Toggles */}
          <div className="space-y-3">
            <ToggleOption
              label="Live Matches"
              enabled={layout.showLiveMatches}
              onChange={(enabled) => setLayout({...layout, showLiveMatches: enabled})}
            />
            <ToggleOption
              label="Upcoming Matches"
              enabled={layout.showUpcoming}
              onChange={(enabled) => setLayout({...layout, showUpcoming: enabled})}
            />
            <ToggleOption
              label="News Feed"
              enabled={layout.showNews}
              onChange={(enabled) => setLayout({...layout, showNews: enabled})}
            />
            <ToggleOption
              label="Rankings"
              enabled={layout.showRankings}
              onChange={(enabled) => setLayout({...layout, showRankings: enabled})}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Toggle Option Component
const ToggleOption = ({ label, enabled, onChange }) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium">{label}</span>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

// Quick Filter Button
const QuickFilterButton = ({ icon: Icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-red-500 text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
};

// Mobile-optimized Forum Thread List
export const MobileForumList = ({ threads, navigateTo }) => {
  const [sortBy, setSortBy] = useState('latest');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortedThreads = [...threads].sort((a, b) => {
    switch (sortBy) {
      case 'hot':
        return b.score - a.score;
      case 'top':
        return b.total_votes - a.total_votes;
      case 'latest':
      default:
        return new Date(b.created_at) - new Date(a.created_at);
    }
  });

  return (
    <div className="pb-20">
      {/* Sort Controls - Fixed the VLR.gg issue! */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-40 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Forums</h2>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400"
          >
            <span>Sort: {sortBy}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
        
        {showSortMenu && (
          <div className="absolute right-3 top-12 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
            {['latest', 'hot', 'top'].map(option => (
              <button
                key={option}
                onClick={() => {
                  setSortBy(option);
                  setShowSortMenu(false);
                }}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thread List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedThreads.map(thread => (
          <MobileForumThread 
            key={thread.id} 
            thread={thread} 
            onClick={() => navigateTo('thread-detail', { threadId: thread.id })}
          />
        ))}
      </div>
    </div>
  );
};

// Mobile Forum Thread Component
const MobileForumThread = ({ thread, onClick }) => {
  return (
    <button onClick={onClick} className="w-full p-4 text-left">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-medium line-clamp-2">{thread.title}</h3>
          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span>{thread.user?.name}</span>
            <span>•</span>
            <span>{thread.post_count} replies</span>
            <span>•</span>
            <span>{new Date(thread.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="ml-3 flex flex-col items-center">
          <button className="text-gray-400 hover:text-red-500">
            <ArrowUp className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium">{thread.score}</span>
        </div>
      </div>
    </button>
  );
};

// Scroll to Top Button
export const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      className="md:hidden fixed bottom-20 right-4 bg-red-500 text-white p-3 rounded-full shadow-lg z-40"
    >
      <ArrowUp className="w-5 h-5" />
    </button>
  );
};

export default {
  MobileBottomNav,
  MobileDashboard,
  MobileForumList,
  ScrollToTopButton
};