import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const trendingQuerySchema = z.object({
  timeframe: z.enum(['1h', '6h', '24h', '7d', '30d']).optional().default('24h'),
  category: z.string().optional(),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  includeContent: z.string().optional().transform(val => val === 'true')
});

// Trending topics with engagement metrics
const trendingTopics = [
  {
    id: 'thread-1001',
    title: 'Season 2 Meta Discussion - What Changed?',
    category: {
      id: 'competitive',
      name: 'Competitive Discussion',
      color: '#ef4444'
    },
    author: {
      id: 'user123',
      username: 'ProAnalyst',
      avatar: '/avatars/analyst.png',
      verified: true
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
    stats: {
      views: 2847,
      replies: 89,
      likes: 234,
      shares: 12,
      lastActivity: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
    },
    engagement: {
      score: 385.7,
      velocity: 'high', // high/medium/low
      trend: 'rising', // rising/stable/falling
      peakHour: 15 // hour of day with most activity
    },
    tags: ['meta', 'season-2', 'analysis', 'competitive'],
    preview: 'The new season brought major changes to hero balance. Iron Man received significant nerfs while Storm got substantial buffs...',
    hotness: 98.5, // Algorithm score
    isPinned: false,
    isLocked: false
  },
  {
    id: 'thread-1002',
    title: 'BREAKING: TenZ announces retirement from competitive',
    category: {
      id: 'competitive',
      name: 'Competitive Discussion',
      color: '#ef4444'
    },
    author: {
      id: 'user456',
      username: 'EsportsNews',
      avatar: '/avatars/news.png',
      verified: true
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    stats: {
      views: 5234,
      replies: 167,
      likes: 445,
      shares: 34,
      lastActivity: new Date(Date.now() - 1 * 60 * 1000).toISOString() // 1 minute ago
    },
    engagement: {
      score: 542.3,
      velocity: 'high',
      trend: 'rising',
      peakHour: 16
    },
    tags: ['tenz', 'retirement', 'sentinels', 'breaking'],
    preview: 'In a shocking announcement, TenZ has announced his retirement from competitive Marvel Rivals to focus on content creation...',
    hotness: 95.8,
    isPinned: true,
    isLocked: false
  },
  {
    id: 'thread-1003',
    title: 'New Iron Man combo discovered - 40% more damage',
    category: {
      id: 'guides',
      name: 'Guides & Strategy',
      color: '#10b981'
    },
    author: {
      id: 'user789',
      username: 'ComboMaster',
      avatar: '/avatars/combo.png',
      verified: false
    },
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
    stats: {
      views: 1923,
      replies: 73,
      likes: 312,
      shares: 28,
      lastActivity: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
    },
    engagement: {
      score: 267.4,
      velocity: 'medium',
      trend: 'stable',
      peakHour: 14
    },
    tags: ['iron-man', 'combo', 'guide', 'tech'],
    preview: 'Found a new Iron Man combo that increases damage output by 40%. Here\'s the input sequence and timing...',
    hotness: 89.2,
    isPinned: false,
    isLocked: false
  },
  {
    id: 'thread-1004',
    title: 'Patch 2.1 Preview - Developer AMA Tomorrow',
    category: {
      id: 'patch-notes',
      name: 'Patch Notes & Updates',
      color: '#f59e0b'
    },
    author: {
      id: 'dev1',
      username: 'NetEaseDev',
      avatar: '/avatars/dev.png',
      verified: true,
      role: 'developer'
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    stats: {
      views: 3456,
      replies: 234,
      likes: 567,
      shares: 45,
      lastActivity: new Date(Date.now() - 3 * 60 * 1000).toISOString() // 3 minutes ago
    },
    engagement: {
      score: 423.8,
      velocity: 'high',
      trend: 'rising',
      peakHour: 17
    },
    tags: ['patch-2.1', 'developer', 'ama', 'official'],
    preview: 'Join us tomorrow at 3PM PST for a developer AMA about the upcoming Patch 2.1. We\'ll discuss balance changes, new features...',
    hotness: 92.1,
    isPinned: true,
    isLocked: false
  },
  {
    id: 'thread-1005',
    title: 'Insane Storm play compilation - Must watch clips',
    category: {
      id: 'memes',
      name: 'Memes & Highlights',
      color: '#8b5cf6'
    },
    author: {
      id: 'user321',
      username: 'ClipCollector',
      avatar: '/avatars/clips.png',
      verified: false
    },
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    stats: {
      views: 4567,
      replies: 45,
      likes: 423,
      shares: 67,
      lastActivity: new Date(Date.now() - 25 * 60 * 1000).toISOString() // 25 minutes ago
    },
    engagement: {
      score: 356.9,
      velocity: 'medium',
      trend: 'stable',
      peakHour: 20
    },
    tags: ['storm', 'highlights', 'clips', 'compilation'],
    preview: 'Collected the best Storm plays from this week. Some absolutely insane weather control and team fight setups...',
    hotness: 85.4,
    isPinned: false,
    isLocked: false
  },
  {
    id: 'thread-1006',
    title: 'Champions 2025 bracket predictions - Who wins?',
    category: {
      id: 'competitive',
      name: 'Competitive Discussion',
      color: '#ef4444'
    },
    author: {
      id: 'user654',
      username: 'BracketExpert',
      avatar: '/avatars/bracket.png',
      verified: false
    },
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(), // 18 hours ago
    stats: {
      views: 2134,
      replies: 156,
      likes: 189,
      shares: 23,
      lastActivity: new Date(Date.now() - 8 * 60 * 1000).toISOString() // 8 minutes ago
    },
    engagement: {
      score: 298.7,
      velocity: 'medium',
      trend: 'rising',
      peakHour: 19
    },
    tags: ['champions-2025', 'predictions', 'bracket', 'tournament'],
    preview: 'With the Champions 2025 bracket finally revealed, let\'s discuss predictions. My dark horse pick is Paper Rex...',
    hotness: 78.9,
    isPinned: false,
    isLocked: false
  },
  {
    id: 'thread-1007',
    title: 'Bug Report: Doctor Strange portal glitch still exists',
    category: {
      id: 'bug-reports',
      name: 'Bug Reports',
      color: '#f97316'
    },
    author: {
      id: 'user987',
      username: 'BugHunter',
      avatar: '/avatars/bug.png',
      verified: false
    },
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(), // 14 hours ago
    stats: {
      views: 892,
      replies: 34,
      likes: 67,
      shares: 8,
      lastActivity: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
    },
    engagement: {
      score: 89.4,
      velocity: 'low',
      trend: 'stable',
      peakHour: 13
    },
    tags: ['bug-report', 'doctor-strange', 'portal', 'glitch'],
    preview: 'The portal glitch where Doctor Strange gets stuck is still happening after the latest patch. Steps to reproduce...',
    hotness: 45.2,
    isPinned: false,
    isLocked: false
  }
];

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 50;
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

// Calculate trending score based on timeframe
function calculateTrendingScore(topic: any, timeframe: string): number {
  const now = Date.now();
  const topicAge = now - new Date(topic.createdAt).getTime();
  const lastActivityAge = now - new Date(topic.stats.lastActivity).getTime();
  
  // Time decay factors
  const timeMultipliers = {
    '1h': 1 * 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  
  const timeWindow = timeMultipliers[timeframe as keyof typeof timeMultipliers];
  
  // Skip if topic is older than timeframe
  if (topicAge > timeWindow) return 0;
  
  // Base engagement score
  let score = topic.stats.views * 0.1 + 
             topic.stats.replies * 2 + 
             topic.stats.likes * 1.5 + 
             topic.stats.shares * 3;
  
  // Recent activity boost
  const recentActivityBoost = Math.max(0, (timeWindow - lastActivityAge) / timeWindow);
  score *= (1 + recentActivityBoost);
  
  // Velocity multiplier
  const velocityMultipliers = { high: 1.5, medium: 1.2, low: 1.0 };
  score *= velocityMultipliers[topic.engagement.velocity as keyof typeof velocityMultipliers];
  
  // Trend multiplier
  const trendMultipliers = { rising: 1.3, stable: 1.0, falling: 0.8 };
  score *= trendMultipliers[topic.engagement.trend as keyof typeof trendMultipliers];
  
  // Pinned boost
  if (topic.isPinned) score *= 1.2;
  
  return score;
}

// Filter topics by category
function filterByCategory(topics: any[], category?: string) {
  if (!category) return topics;
  return topics.filter(topic => topic.category.id === category);
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
      validatedQuery = trendingQuerySchema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }
    }

    // Filter by category if specified
    let filteredTopics = filterByCategory(trendingTopics, validatedQuery.category);

    // Calculate trending scores and filter by timeframe
    const topicsWithScores = filteredTopics
      .map(topic => ({
        ...topic,
        trendingScore: calculateTrendingScore(topic, validatedQuery.timeframe)
      }))
      .filter(topic => topic.trendingScore > 0);

    // Sort by trending score
    topicsWithScores.sort((a, b) => b.trendingScore - a.trendingScore);

    // Apply limit
    const limitedTopics = topicsWithScores.slice(0, validatedQuery.limit);

    // Mobile optimization - reduce data for mobile clients
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    let responseTopics = limitedTopics;
    
    if (isMobile && !validatedQuery.includeContent) {
      // Minimal data for mobile
      responseTopics = limitedTopics.map(topic => ({
        id: topic.id,
        title: topic.title,
        category: {
          id: topic.category.id,
          name: topic.category.name,
          color: topic.category.color
        },
        author: {
          username: topic.author.username,
          verified: topic.author.verified
        },
        stats: {
          views: topic.stats.views,
          replies: topic.stats.replies,
          likes: topic.stats.likes
        },
        createdAt: topic.createdAt,
        tags: topic.tags.slice(0, 3), // Limit tags for mobile
        hotness: topic.hotness,
        trendingScore: Math.round(topic.trendingScore)
      }));
    } else if (!validatedQuery.includeContent) {
      // Remove full content but keep preview
      responseTopics = limitedTopics.map(topic => {
        const { preview, ...topicWithoutContent } = topic;
        return {
          ...topicWithoutContent,
          preview: preview?.substring(0, 150) + '...' // Truncate preview
        };
      });
    }

    // Calculate category breakdown
    const categoryBreakdown = limitedTopics.reduce((acc: any, topic) => {
      const catId = topic.category.id;
      if (!acc[catId]) {
        acc[catId] = {
          id: catId,
          name: topic.category.name,
          color: topic.category.color,
          count: 0,
          totalScore: 0
        };
      }
      acc[catId].count++;
      acc[catId].totalScore += topic.trendingScore;
      return acc;
    }, {});

    const categoryStats = Object.values(categoryBreakdown)
      .sort((a: any, b: any) => b.totalScore - a.totalScore);

    // Response
    return NextResponse.json({
      success: true,
      data: responseTopics,
      meta: {
        timeframe: validatedQuery.timeframe,
        category: validatedQuery.category,
        limit: validatedQuery.limit,
        total: topicsWithScores.length,
        timestamp: new Date().toISOString(),
        mobile: isMobile
      },
      categoryStats,
      trending: {
        hottest: limitedTopics[0]?.id || null,
        mostActive: limitedTopics.find(t => t.engagement.velocity === 'high')?.id || null,
        newest: limitedTopics.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]?.id || null
      }
    });

  } catch (error) {
    console.error('Trending API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get trending statistics (Admin/Analytics endpoint)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const body = await request.json();
    const { timeframe = '24h', detailed = false } = body;

    // Calculate detailed analytics
    const analytics = {
      totalEngagement: trendingTopics.reduce((sum, topic) => 
        sum + topic.stats.views + topic.stats.replies + topic.stats.likes, 0
      ),
      averageHotness: trendingTopics.reduce((sum, topic) => 
        sum + topic.hotness, 0) / trendingTopics.length,
      categoryDistribution: {},
      hourlyActivity: new Array(24).fill(0),
      topTags: {},
      engagementTrends: {
        rising: trendingTopics.filter(t => t.engagement.trend === 'rising').length,
        stable: trendingTopics.filter(t => t.engagement.trend === 'stable').length,
        falling: trendingTopics.filter(t => t.engagement.trend === 'falling').length
      }
    };

    // Process category distribution
    trendingTopics.forEach(topic => {
      const catId = topic.category.id;
      if (!analytics.categoryDistribution[catId]) {
        analytics.categoryDistribution[catId] = 0;
      }
      analytics.categoryDistribution[catId]++;
    });

    // Process hourly activity
    trendingTopics.forEach(topic => {
      const hour = topic.engagement.peakHour;
      if (hour >= 0 && hour < 24) {
        analytics.hourlyActivity[hour]++;
      }
    });

    // Process top tags
    trendingTopics.forEach(topic => {
      topic.tags.forEach((tag: string) => {
        if (!analytics.topTags[tag]) {
          analytics.topTags[tag] = 0;
        }
        analytics.topTags[tag]++;
      });
    });

    // Sort top tags
    const sortedTags = Object.entries(analytics.topTags)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 20)
      .reduce((obj, [tag, count]) => {
        obj[tag] = count;
        return obj;
      }, {} as any);

    analytics.topTags = sortedTags;

    console.log(`[ANALYTICS] Trending statistics generated for ${timeframe}`);

    return NextResponse.json({
      success: true,
      analytics,
      meta: {
        timeframe,
        detailed,
        generatedAt: new Date().toISOString(),
        totalTopics: trendingTopics.length
      }
    });

  } catch (error) {
    console.error('Trending analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
