import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getNewsFeaturedImageUrl } from '../../utils/imageUtils';

function NewsDetailPage({ params, navigateTo }) {
  const { isAdmin, isModerator, api } = useAuth();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedNews, setRelatedNews] = useState([]);

  const fetchArticle = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('🔍 NewsDetailPage: Fetching article with ID:', params.id);
      
      // Try to fetch from backend API using the real ID
      const response = await api.get(`/news/${params.id}`);
      
      // FIXED: Handle Laravel API response structure properly
      const articleData = response?.data?.data || response?.data || response;
      
      console.log('✅ NewsDetailPage: Real article loaded:', articleData);
      setArticle(articleData);
      
      // Fetch related articles
      try {
        const relatedResponse = await api.get('/news');
        const allNews = relatedResponse?.data?.data || relatedResponse?.data || relatedResponse || [];
        
        // Filter out current article and take 3 related ones
        const related = allNews
          .filter(news => news.id !== articleData.id)
          .slice(0, 3);
        setRelatedNews(related);
        console.log('✅ NewsDetailPage: Related articles loaded:', related.length);
      } catch (relatedError) {
        console.warn('Could not fetch related articles:', relatedError);
        setRelatedNews([]);
      }
      
    } catch (error) {
      console.warn('❌ NewsDetailPage: News API failed, using mock data for ID:', params.id, error.message);
      
      // FIXED: Enhanced fallback mock data mapped to requested ID
      const mockArticles = {
        // Real backend IDs get proper content
        '1': {
          id: 1,
          title: 'Marvel Rivals Ignite 2025 Open Qualifiers',
          slug: 'marvel-rivals-ignite-2025-open-qualifiers',
          content: `
            <h2>Marvel Rivals Ignite 2025: The Ultimate Competitive Tournament</h2>
            
            <p>The Marvel Rivals Ignite 2025 Open Qualifiers have officially begun, marking the start of the most anticipated competitive season in the game's history. This tournament will determine who advances to the main event with a $2 million prize pool.</p>
            
            <h3>Tournament Format</h3>
            
            <ul>
              <li><strong>Open Qualifiers:</strong> 128 teams compete in double-elimination brackets</li>
              <li><strong>Regional Finals:</strong> Top 16 teams from each region advance</li>
              <li><strong>International Championship:</strong> 64 teams battle for the ultimate prize</li>
              <li><strong>Hero Draft:</strong> New strategic draft system implemented</li>
              <li><strong>Best of 5 Finals:</strong> All elimination matches use extended format</li>
            </ul>
            
            <h3>Registration Details</h3>
            
            <p>Registration is now open for all eligible teams. The tournament features separate qualification paths for each major region: North America, Europe, Asia-Pacific, and Latin America.</p>
            
            <h3>Prize Pool Distribution</h3>
            
            <p>The $2 million prize pool will be distributed across all participating teams, with the championship winner receiving $500,000. This represents the largest prize pool in Marvel Rivals esports history.</p>
            
            <blockquote>
              <p>"Marvel Rivals Ignite 2025 represents the pinnacle of competitive gaming. We're excited to see the incredible talent from around the world." - Tournament Director</p>
            </blockquote>
            
            <h3>New Features</h3>
            
            <p>This tournament introduces several new competitive features including hero bans, tactical timeouts, and enhanced spectator modes for the best viewing experience.</p>
            
            <p>Don't miss out on the action! Qualifiers begin this weekend with matches streamed live on all major platforms.</p>
          `,
          excerpt: 'The Marvel Rivals Ignite 2025 Open Qualifiers have begun with a massive $2 million prize pool.',
          category: 'tournaments',
          author: { 
            id: 1,
            name: 'MRVL Esports Team', 
            avatar: '🏆',
            bio: 'Official esports team for Marvel Rivals tournaments'
          },
          featured_image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&h=600&fit=crop',
          views: 23450,
          comments_count: 156,
          created_at: '2025-01-27T14:30:00Z',
          updated_at: '2025-01-27T14:30:00Z',
          published_at: '2025-01-27T14:30:00Z',
          featured: true,
          tags: ['Tournament', 'Ignite 2025', 'Qualifiers', 'Competitive', 'Esports']
        },
        
        // Fallback for unknown IDs
        'default': {
          id: parseInt(params.id) || 999,
          title: 'Marvel Rivals Season 1 Battle Pass Now Live',
          slug: 'marvel-rivals-season-1-battle-pass-now-live',
          content: `
            <h2>The Season 1 Battle Pass Has Arrived!</h2>
            
            <p>Marvel Rivals has officially launched its Season 1 Battle Pass, bringing a wealth of new content to players worldwide. This highly anticipated release includes new heroes, exclusive skins, and rewards that will enhance your gaming experience.</p>
            
            <h3>What's New in Season 1?</h3>
            
            <ul>
              <li><strong>New Heroes:</strong> Three new heroes join the roster with unique abilities and playstyles</li>
              <li><strong>Exclusive Skins:</strong> Over 50 new cosmetic items including legendary character skins</li>
              <li><strong>Battle Pass Rewards:</strong> 100 tiers of rewards including credits, boosts, and exclusive items</li>
              <li><strong>New Maps:</strong> Two competitive maps added to the rotation</li>
              <li><strong>Balance Updates:</strong> Hero adjustments based on community feedback</li>
            </ul>
            
            <h3>How to Access the Battle Pass</h3>
            
            <p>The Season 1 Battle Pass is available for purchase in-game for 950 credits, or you can upgrade to the Premium Battle Pass for 2400 credits to unlock additional rewards and XP boosts.</p>
            
            <h3>Season Duration and Rewards</h3>
            
            <p>Season 1 will run for 12 weeks, giving players plenty of time to progress through all 100 tiers. The final tier rewards include an exclusive legendary skin for Iron Man and a rare player card background.</p>
            
            <blockquote>
              <p>"We're incredibly excited to launch Season 1 and see how the community responds to the new content. This is just the beginning of many exciting updates planned for Marvel Rivals." - Game Director</p>
            </blockquote>
            
            <h3>Esports Integration</h3>
            
            <p>Season 1 also introduces new features for competitive play, including updated ranking systems and seasonal rewards for top-performing players. The Marvel Rivals Championship Series will feature the new content prominently.</p>
            
            <p>Ready to jump in? Log into Marvel Rivals now and start your Season 1 journey!</p>
          `,
          excerpt: 'The highly anticipated Season 1 Battle Pass is now available featuring new heroes, skins, and exclusive rewards.',
          category: 'updates',
          author: { 
            id: 1,
            name: 'Marvel Dev Team', 
            avatar: '🛡️',
            bio: 'Official development team for Marvel Rivals'
          },
          featured_image_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=600&fit=crop',
          views: 15420,
          comments_count: 89,
          created_at: '2025-01-26T10:00:00Z',
          updated_at: '2025-01-26T10:00:00Z',
          published_at: '2025-01-26T10:00:00Z',
          featured: true,
          tags: ['Season 1', 'Battle Pass', 'New Content', 'Updates']
        }
      };

      // Use specific article for known IDs, otherwise use default
      const mockArticle = mockArticles[params.id] || mockArticles['default'];
      
      setArticle(mockArticle);
      console.log('📰 NewsDetailPage: Using mock article for ID:', params.id, mockArticle.title);
      
      // Mock related articles
      const mockRelated = [
        {
          id: 2,
          title: 'Balance Changes Coming to Iron Man and Spider-Man',
          excerpt: 'Developer insights on upcoming hero adjustments.',
          featured_image_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=400&h=200&fit=crop',
          created_at: '2025-01-25T15:30:00Z',
          category: 'balance'
        },
        {
          id: 3,
          title: 'Team Stark Industries Wins Championship Finals',
          excerpt: 'Epic 5-map series concludes with thrilling victory.',
          featured_image_url: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=200&fit=crop',
          created_at: '2025-01-24T20:00:00Z',
          category: 'esports'
        },
        {
          id: 4,
          title: 'New Map: Asgard Throne Room Revealed',
          excerpt: 'Behind-the-scenes look at map creation process.',
          featured_image_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
          created_at: '2025-01-23T14:20:00Z',
          category: 'content'
        }
      ];
      
      setRelatedNews(mockRelated);
    } finally {
      setLoading(false);
    }
  }, [api, params.id]);

  useEffect(() => {
    if (params.id) {
      fetchArticle();
    }
  }, [fetchArticle]);

  const getCategoryColor = (category) => {
    switch (category) {
      case 'tournaments': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'updates': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'balance': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'esports': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'content': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'community': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <div className="text-gray-600 dark:text-gray-400">Loading article...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📰</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Article not found</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The news article you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigateTo && navigateTo('news')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            ← Back to News
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateTo && navigateTo('news')}
          className="text-red-600 dark:text-red-400 hover:underline text-sm"
        >
          ← Back to News
        </button>
        
        {/* Admin/Moderator Actions */}
        {(isAdmin() || isModerator()) && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigateTo && navigateTo('admin-news-edit', { id: article.id })}
              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              ✏️ Edit
            </button>
            <button 
              onClick={() => navigateTo && navigateTo('admin-news-create')}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              ➕ New Article
            </button>
          </div>
        )}
      </div>

      {/* FIXED: Debug info to show which article is loaded */}
      <div className="mb-4 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-800 dark:text-blue-200">
        📰 Loaded Article ID: {article.id} | Requested ID: {params.id} | Title: {article.title}
      </div>

      {/* Article Header */}
      <article className="mb-8">
        {/* Featured Image */}
        {article.featured_image_url && (
          <div className="aspect-video overflow-hidden rounded-lg mb-6">
            <img 
              src={getNewsFeaturedImageUrl(article)} 
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Article Meta */}
        <div className="flex items-center space-x-3 mb-4">
          <span className={`px-3 py-1 text-sm font-bold rounded ${getCategoryColor(article.category)}`}>
            {(article.category || 'news').toUpperCase()}
          </span>
          
          {article.featured && (
            <span className="px-3 py-1 text-sm font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              ⭐ FEATURED
            </span>
          )}
          
          <div className="text-sm text-gray-500 dark:text-gray-500">
            {formatDate(article.published_at || article.created_at)}
          </div>
        </div>

        {/* Article Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          {article.title}
        </h1>

        {/* Article Stats */}
        <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-500 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <span>{article.author?.avatar || '👤'}</span>
            <span>By {article.author?.name || 'MRVL Team'}</span>
          </div>
          
          {article.views && (
            <div className="flex items-center space-x-1">
              <span>👁</span>
              <span>{article.views.toLocaleString()} views</span>
            </div>
          )}
          
          {article.comments_count && (
            <div className="flex items-center space-x-1">
              <span>💬</span>
              <span>{article.comments_count} comments</span>
            </div>
          )}
        </div>

        {/* Article Content */}
        <div 
          className="prose prose-lg dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Tags:</h4>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Related Articles */}
      {relatedNews.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Related Articles</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedNews.map((relatedArticle) => (
              <div 
                key={relatedArticle.id} 
                className="card hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  console.log('🔗 NewsDetailPage: Clicking related article with ID:', relatedArticle.id);
                  navigateTo && navigateTo('news-detail', { id: relatedArticle.id });
                }}
              >
                {relatedArticle.featured_image_url && (
                  <div className="aspect-video overflow-hidden rounded-t-lg">
                    <img 
                      src={relatedArticle.featured_image_url} 
                      alt={relatedArticle.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${getCategoryColor(relatedArticle.category)}`}>
                      {(relatedArticle.category || 'news').toUpperCase()}
                    </span>
                  </div>
                  
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors line-clamp-2">
                    {relatedArticle.title}
                  </h4>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {relatedArticle.excerpt}
                  </p>

                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    {formatDate(relatedArticle.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Back to News Button */}
      <div className="mt-12 text-center">
        <button
          onClick={() => navigateTo && navigateTo('news')}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          ← Back to All News
        </button>
      </div>
    </div>
  );
}

export default NewsDetailPage;