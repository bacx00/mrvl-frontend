import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const newsQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  category: z.enum(['patch-notes', 'esports', 'community', 'development', 'all']).optional().default('all'),
  featured: z.string().optional().transform(val => val === 'true'),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'views', 'engagement']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

// Comprehensive news data
const newsArticles = [
  {
    id: 'news-001',
    title: 'Season 2 Launch: Major Hero Balance Changes',
    slug: 'season-2-launch-hero-balance-changes',
    excerpt: 'Season 2 brings significant balance changes to Iron Man, Storm, and other popular heroes. Get the full breakdown of what changed.',
    content: '# Season 2 Hero Balance Changes\n\nSeason 2 is finally here with major updates to hero balance...',
    category: 'patch-notes',
    featuredImage: '/news/season-2-balance.jpg',
    thumbnailImage: '/news/season-2-balance-thumb.jpg',
    author: {
      id: 'dev-team',
      name: 'MRVL Dev Team',
      avatar: '/avatars/dev-team.png',
      role: 'developer',
      verified: true
    },
    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    readTime: 5,
    isFeatured: true,
    isBreaking: false,
    tags: ['season-2', 'balance', 'iron-man', 'storm', 'patch-notes'],
    stats: {
      views: 15423,
      likes: 892,
      shares: 156,
      comments: 234
    },
    seo: {
      metaTitle: 'Season 2 Launch: Major Hero Balance Changes | MRVL.net',
      metaDescription: 'Complete breakdown of Season 2 hero balance changes including Iron Man nerfs and Storm buffs.',
      keywords: ['season 2', 'hero balance', 'iron man', 'storm', 'patch notes']
    },
    socialMedia: {
      twitterCard: 'summary_large_image',
      ogImage: '/news/season-2-balance-og.jpg'
    }
  },
  {
    id: 'news-002',
    title: 'Champions 2025 Format Revealed: $1M Prize Pool',
    slug: 'champions-2025-format-revealed-1m-prize-pool',
    excerpt: 'The biggest Marvel Rivals tournament ever announced with a massive $1 million prize pool and innovative format.',
    content: '# Champions 2025: The Ultimate Competition\n\nWe\'re excited to announce Champions 2025...',
    category: 'esports',
    featuredImage: '/news/champions-2025.jpg',
    thumbnailImage: '/news/champions-2025-thumb.jpg',
    author: {
      id: 'esports-team',
      name: 'MRVL Esports',
      avatar: '/avatars/esports-team.png',
      role: 'esports',
      verified: true
    },
    publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    readTime: 8,
    isFeatured: true,
    isBreaking: true,
    tags: ['champions-2025', 'tournament', 'esports', 'prize-pool', '1-million'],
    stats: {
      views: 28947,
      likes: 1567,
      shares: 423,
      comments: 567
    },
    seo: {
      metaTitle: 'Champions 2025 Format Revealed: $1M Prize Pool | MRVL.net',
      metaDescription: 'The biggest Marvel Rivals tournament ever with $1M prize pool. Get all the details on format, teams, and dates.',
      keywords: ['champions 2025', 'tournament', 'esports', '1 million prize pool']
    },
    socialMedia: {
      twitterCard: 'summary_large_image',
      ogImage: '/news/champions-2025-og.jpg'
    }
  },
  {
    id: 'news-003',
    title: 'Community Spotlight: Best Plays of the Week',
    slug: 'community-spotlight-best-plays-week-47',
    excerpt: 'Check out the most incredible plays submitted by our community this week, featuring amazing clutches and team coordination.',
    content: '# Week 47: Community Highlights\n\nThis week brought some absolutely incredible plays...',
    category: 'community',
    featuredImage: '/news/community-plays.jpg',
    thumbnailImage: '/news/community-plays-thumb.jpg',
    author: {
      id: 'community-team',
      name: 'Community Team',
      avatar: '/avatars/community-team.png',
      role: 'community',
      verified: true
    },
    publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    readTime: 3,
    isFeatured: false,
    isBreaking: false,
    tags: ['community', 'highlights', 'plays', 'week-47', 'clutches'],
    stats: {
      views: 8234,
      likes: 423,
      shares: 67,
      comments: 89
    },
    seo: {
      metaTitle: 'Community Spotlight: Best Plays of the Week | MRVL.net',
      metaDescription: 'Amazing community plays featuring incredible clutches and team coordination from Week 47.',
      keywords: ['community highlights', 'best plays', 'clutches', 'marvel rivals']
    },
    socialMedia: {
      twitterCard: 'summary_large_image',
      ogImage: '/news/community-plays-og.jpg'
    }
  },
  {
    id: 'news-004',
    title: 'Developer Insights: Building the New Ranked System',
    slug: 'developer-insights-building-new-ranked-system',
    excerpt: 'Behind-the-scenes look at how our team designed and implemented the new competitive ranking system.',
    content: '# Building a Better Ranked Experience\n\nCreating a fair and engaging ranked system...',
    category: 'development',
    featuredImage: '/news/ranked-system.jpg',
    thumbnailImage: '/news/ranked-system-thumb.jpg',
    author: {
      id: 'lead-dev',
      name: 'Sarah Chen',
      avatar: '/avatars/sarah-chen.png',
      role: 'lead-developer',
      verified: true,
      bio: 'Lead Game Designer at NetEase Games'
    },
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 12,
    isFeatured: false,
    isBreaking: false,
    tags: ['development', 'ranked-system', 'competitive', 'behind-the-scenes', 'design'],
    stats: {
      views: 12456,
      likes: 678,
      shares: 134,
      comments: 156
    },
    seo: {
      metaTitle: 'Developer Insights: Building the New Ranked System | MRVL.net',
      metaDescription: 'Exclusive behind-the-scenes look at designing Marvel Rivals\' new competitive ranking system.',
      keywords: ['developer insights', 'ranked system', 'competitive', 'game design']
    },
    socialMedia: {
      twitterCard: 'summary_large_image',
      ogImage: '/news/ranked-system-og.jpg'
    }
  },
  {
    id: 'news-005',
    title: 'TenZ Joins Content Creator Program',
    slug: 'tenz-joins-content-creator-program',
    excerpt: 'Former Sentinels star TenZ announces partnership with MRVL as official content creator and community ambassador.',
    content: '# TenZ: From Pro Player to Content Creator\n\nWe\'re thrilled to announce that TenZ...',
    category: 'community',
    featuredImage: '/news/tenz-creator.jpg',
    thumbnailImage: '/news/tenz-creator-thumb.jpg',
    author: {
      id: 'pr-team',
      name: 'MRVL PR Team',
      avatar: '/avatars/pr-team.png',
      role: 'pr',
      verified: true
    },
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    readTime: 4,
    isFeatured: false,
    isBreaking: false,
    tags: ['tenz', 'content-creator', 'community', 'partnership', 'announcement'],
    stats: {
      views: 19834,
      likes: 1234,
      shares: 289,
      comments: 445
    },
    seo: {
      metaTitle: 'TenZ Joins MRVL Content Creator Program | MRVL.net',
      metaDescription: 'Former Sentinels pro TenZ becomes official MRVL content creator and community ambassador.',
      keywords: ['tenz', 'content creator', 'community ambassador', 'partnership']
    },
    socialMedia: {
      twitterCard: 'summary_large_image',
      ogImage: '/news/tenz-creator-og.jpg'
    }
  }
];

// Cache and rate limiting
let cachedNews: any[] = [];
let cacheTimestamp = 0;
const CACHE_DURATION = 300000; // 5 minutes

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 60;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT_REQUESTS) {
    return false;
  }

  userLimit.count++;
  return true;
}

// Search functionality
function searchNews(articles: any[], searchTerm: string) {
  const term = searchTerm.toLowerCase();
  return articles.filter(article => 
    article.title.toLowerCase().includes(term) ||
    article.excerpt.toLowerCase().includes(term) ||
    article.tags.some((tag: string) => tag.toLowerCase().includes(term)) ||
    article.author.name.toLowerCase().includes(term)
  );
}

// Filter articles
function filterNews(articles: any[], filters: any) {
  let filtered = [...articles];

  // Category filter
  if (filters.category !== 'all') {
    filtered = filtered.filter(article => article.category === filters.category);
  }

  // Featured filter
  if (filters.featured) {
    filtered = filtered.filter(article => article.isFeatured);
  }

  // Search filter
  if (filters.search) {
    filtered = searchNews(filtered, filters.search);
  }

  return filtered;
}

// Sort articles
function sortNews(articles: any[], sortBy: string, sortOrder: string) {
  return articles.sort((a, b) => {
    let aValue, bValue;

    switch (sortBy) {
      case 'date':
        aValue = new Date(a.publishedAt).getTime();
        bValue = new Date(b.publishedAt).getTime();
        break;
      case 'views':
        aValue = a.stats.views;
        bValue = b.stats.views;
        break;
      case 'engagement':
        aValue = a.stats.likes + a.stats.shares + a.stats.comments;
        bValue = b.stats.likes + b.stats.shares + b.stats.comments;
        break;
      default:
        aValue = new Date(a.publishedAt).getTime();
        bValue = new Date(b.publishedAt).getTime();
    }

    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    }
  });
}

// Paginate results
function paginateResults(articles: any[], page: number, limit: number) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArticles = articles.slice(startIndex, endIndex);

  return {
    articles: paginatedArticles,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(articles.length / limit),
      totalArticles: articles.length,
      hasNextPage: endIndex < articles.length,
      hasPreviousPage: page > 1,
      limit
    }
  };
}

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryObject = Object.fromEntries(searchParams.entries());
    
    let validatedQuery;
    try {
      validatedQuery = newsQuerySchema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }
    }

    // Check cache for performance
    const now = Date.now();
    if (cachedNews.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('[CACHE] Serving news from cache');
    } else {
      cachedNews = [...newsArticles];
      cacheTimestamp = now;
      console.log('[CACHE] Refreshed news cache');
    }

    // Filter articles
    let filteredArticles = filterNews(cachedNews, validatedQuery);

    // Sort articles
    filteredArticles = sortNews(
      filteredArticles, 
      validatedQuery.sortBy, 
      validatedQuery.sortOrder
    );

    // Paginate results
    const result = paginateResults(
      filteredArticles, 
      validatedQuery.page, 
      validatedQuery.limit
    );

    // Mobile optimization - reduce data for mobile clients
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile) {
      // Reduce data for mobile
      result.articles = result.articles.map(article => ({
        id: article.id,
        title: article.title,
        excerpt: article.excerpt.substring(0, 120) + '...',
        category: article.category,
        thumbnailImage: article.thumbnailImage,
        author: {
          name: article.author.name,
          verified: article.author.verified
        },
        publishedAt: article.publishedAt,
        readTime: article.readTime,
        isFeatured: article.isFeatured,
        isBreaking: article.isBreaking,
        tags: article.tags.slice(0, 3),
        stats: {
          views: article.stats.views,
          likes: article.stats.likes
        }
      }));
    }

    // Calculate category stats
    const categoryStats = cachedNews.reduce((acc: any, article) => {
      if (!acc[article.category]) {
        acc[article.category] = 0;
      }
      acc[article.category]++;
      return acc;
    }, {});

    // Response
    return NextResponse.json({
      success: true,
      data: result.articles,
      pagination: result.pagination,
      filters: {
        applied: validatedQuery,
        available: {
          category: ['patch-notes', 'esports', 'community', 'development'],
          sortBy: ['date', 'views', 'engagement'],
          sortOrder: ['asc', 'desc']
        }
      },
      categoryStats,
      featured: cachedNews.filter(a => a.isFeatured).slice(0, 3),
      breaking: cachedNews.filter(a => a.isBreaking).slice(0, 2),
      meta: {
        timestamp: new Date().toISOString(),
        cached: (now - cacheTimestamp) < CACHE_DURATION,
        mobile: isMobile
      }
    });

  } catch (error) {
    console.error('News API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new article (Admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin/editor role
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'excerpt', 'content', 'category', 'authorId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new article
    const newArticle = {
      id: `news-${Date.now()}`,
      title: body.title,
      slug: body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: body.excerpt,
      content: body.content,
      category: body.category,
      featuredImage: body.featuredImage || '/news/default.jpg',
      thumbnailImage: body.thumbnailImage || '/news/default-thumb.jpg',
      author: body.author || {
        id: body.authorId,
        name: 'MRVL Team',
        avatar: '/avatars/default.png',
        verified: true
      },
      publishedAt: body.publishedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      readTime: Math.ceil(body.content.split(' ').length / 200), // Estimate reading time
      isFeatured: body.isFeatured || false,
      isBreaking: body.isBreaking || false,
      tags: body.tags || [],
      stats: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0
      },
      seo: body.seo || {},
      socialMedia: body.socialMedia || {}
    };

    newsArticles.unshift(newArticle); // Add to beginning of array

    // Clear cache
    cachedNews = [];
    cacheTimestamp = 0;

    console.log(`[ADMIN] New article created: ${newArticle.title}`);

    return NextResponse.json({
      success: true,
      message: 'Article created successfully',
      article: newArticle
    }, { status: 201 });

  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
