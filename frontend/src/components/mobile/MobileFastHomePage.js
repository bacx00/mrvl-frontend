import React, { useState, useEffect, useCallback, memo } from 'react';
import { useAuth } from '../../hooks';

// Fast mobile-first component with minimal re-renders
const MobileMatchCard = memo(({ match, onClick }) => {
  if (!match || !match.team1 || !match.team2) return null;
  
  return (
    <div 
      className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm active:scale-95 transition-transform"
      onClick={() => onClick(match)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(match)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {match.team1.name} vs {match.team2.name}
          </div>
          {match.status === 'live' && (
            <div className="flex items-center mt-1">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              <span className="text-xs text-red-600 dark:text-red-400 font-bold">LIVE</span>
            </div>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-gray-900 dark:text-white">
            {match.team1_score || 0}-{match.team2_score || 0}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {match.format}
          </div>
        </div>
      </div>
    </div>
  );
});

const MobileNewsCard = memo(({ article, onClick }) => {
  if (!article) return null;
  
  return (
    <div 
      className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm active:scale-95 transition-transform"
      onClick={() => onClick(article)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(article)}
    >
      <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-2">
        {article.title}
      </h3>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {article.author?.name || 'MRVL Team'}
      </div>
    </div>
  );
});

const MobileDiscussionCard = memo(({ discussion, onClick }) => {
  if (!discussion) return null;
  
  return (
    <div 
      className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm active:scale-95 transition-transform"
      onClick={() => onClick(discussion)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(discussion)}
    >
      <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
        {discussion.title}
      </h3>
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="truncate">{discussion.author}</span>
        <span>{discussion.replies} replies</span>
      </div>
    </div>
  );
});

function MobileFastHomePage({ navigateTo }) {
  const { api } = useAuth();
  const [data, setData] = useState({
    matches: [],
    news: [],
    discussions: [],
    loading: true
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch only essential data for mobile
      const [matchesRes, newsRes, forumsRes] = await Promise.allSettled([
        api.get('/matches?limit=5'),
        api.get('/news?limit=3'),
        api.get('/forums/threads?limit=5')
      ]);

      const newData = {
        matches: matchesRes.status === 'fulfilled' ? 
          (matchesRes.value?.data?.data || matchesRes.value?.data || []).slice(0, 5) : [],
        news: newsRes.status === 'fulfilled' ? 
          (newsRes.value?.data?.data || newsRes.value?.data || []).slice(0, 3) : [],
        discussions: forumsRes.status === 'fulfilled' ? 
          (forumsRes.value?.data?.data || forumsRes.value?.data || []).slice(0, 5) : [],
        loading: false
      };

      setData(newData);
    } catch (error) {
      console.error('Mobile HomePage: Error fetching data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, [api]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleMatchClick = useCallback((match) => {
    if (!match?.id) return;
    navigateTo('match-detail', { id: match.id });
  }, [navigateTo]);

  const handleNewsClick = useCallback((article) => {
    if (!article?.id) return;
    navigateTo('news-detail', { id: article.id });
  }, [navigateTo]);

  const handleDiscussionClick = useCallback((discussion) => {
    if (!discussion?.id) return;
    navigateTo('thread-detail', { id: discussion.id });
  }, [navigateTo]);

  if (data.loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
          <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  const liveMatches = data.matches.filter(m => m.status === 'live');
  const upcomingMatches = data.matches.filter(m => m.status === 'upcoming');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 py-6 space-y-6">
        
        {/* Live Matches */}
        {liveMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></span>
                Live Matches
              </h2>
              <button 
                onClick={() => navigateTo('matches')}
                className="text-sm text-red-600 dark:text-red-400 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {liveMatches.map(match => (
                <MobileMatchCard 
                  key={match.id} 
                  match={match} 
                  onClick={handleMatchClick} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Matches */}
        {upcomingMatches.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Upcoming Matches
              </h2>
              <button 
                onClick={() => navigateTo('matches')}
                className="text-sm text-red-600 dark:text-red-400 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {upcomingMatches.map(match => (
                <MobileMatchCard 
                  key={match.id} 
                  match={match} 
                  onClick={handleMatchClick} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Featured News */}
        {data.news.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Latest News
              </h2>
              <button 
                onClick={() => navigateTo('news')}
                className="text-sm text-red-600 dark:text-red-400 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {data.news.map(article => (
                <MobileNewsCard 
                  key={article.id} 
                  article={article} 
                  onClick={handleNewsClick} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent Discussions */}
        {data.discussions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Recent Discussions
              </h2>
              <button 
                onClick={() => navigateTo('forums')}
                className="text-sm text-red-600 dark:text-red-400 font-medium"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {data.discussions.map(discussion => (
                <MobileDiscussionCard 
                  key={discussion.id} 
                  discussion={discussion} 
                  onClick={handleDiscussionClick} 
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!data.loading && data.matches.length === 0 && data.news.length === 0 && data.discussions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Welcome to MRVL
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Check back soon for tournaments, news, and discussions!
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default MobileFastHomePage;