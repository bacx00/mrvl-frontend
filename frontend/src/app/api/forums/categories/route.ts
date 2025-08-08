import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema
const categoryQuerySchema = z.object({
  includeStats: z.string().optional().transform(val => val === 'true'),
  userRole: z.enum(['admin', 'moderator', 'user', 'guest']).optional().default('guest')
});

// Minimal but comprehensive categories data
const categories = [
  {
    id: 'general',
    name: 'General Discussion',
    description: 'General Marvel Rivals discussion, questions, and community chat',
    color: '#3b82f6',
    icon: '💬',
    order: 1,
    isPublic: true,
    allowGuests: true,
    requiresVerification: false,
    threads: 1247,
    posts: 18392,
    lastActivity: {
      threadId: 'latest-1',
      threadTitle: 'Thoughts on the new season?',
      username: 'PlayerOne',
      timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
    },
    moderators: [
      { id: 'mod1', username: 'CommunityMod', avatar: '/avatars/mod1.png' },
      { id: 'mod2', username: 'MarvelMod', avatar: '/avatars/mod2.png' }
    ],
    rules: [
      'Be respectful to all community members',
      'No spam or excessive self-promotion',
      'Stay on topic when possible',
      'Use search before creating duplicate threads'
    ],
    weeklyStats: {
      newThreads: 23,
      newPosts: 456,
      activeUsers: 189,
      trend: 'up'
    }
  },
  {
    id: 'patch-notes',
    name: 'Patch Notes & Updates',
    description: 'Official game updates, patch notes, and developer announcements',
    color: '#f59e0b',
    icon: '📋',
    order: 2,
    isPublic: true,
    allowGuests: true,
    requiresVerification: false,
    threads: 89,
    posts: 2341,
    lastActivity: {
      threadId: 'patch-2.1',
      threadTitle: 'Patch 2.1.0 - Hero Balance Updates',
      username: 'DevTeam',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
    },
    moderators: [
      { id: 'dev1', username: 'NetEaseDev', avatar: '/avatars/dev1.png' },
      { id: 'mod1', username: 'CommunityMod', avatar: '/avatars/mod1.png' }
    ],
    rules: [
      'Official announcements only in pinned threads',
      'Constructive feedback and discussion encouraged',
      'No bug reports here - use bug report category',
      'Keep discussions civil and productive'
    ],
    weeklyStats: {
      newThreads: 3,
      newPosts: 167,
      activeUsers: 234,
      trend: 'up'
    }
  },
  {
    id: 'competitive',
    name: 'Competitive Discussion',
    description: 'Tournament talk, team discussions, and competitive analysis',
    color: '#ef4444',
    icon: '🏆',
    order: 3,
    isPublic: true,
    allowGuests: true,
    requiresVerification: false,
    threads: 567,
    posts: 8923,
    lastActivity: {
      threadId: 'champs-2025',
      threadTitle: 'Champions 2025 Predictions Thread',
      username: 'EsportsAnalyst',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
    },
    moderators: [
      { id: 'esports1', username: 'TournamentMod', avatar: '/avatars/esports1.png' }
    ],
    rules: [
      'No spoilers in thread titles',
      'Use spoiler tags for recent match results',
      'Respect all teams and players',
      'Back up claims with evidence when possible'
    ],
    weeklyStats: {
      newThreads: 45,
      newPosts: 789,
      activeUsers: 156,
      trend: 'up'
    }
  },
  {
    id: 'guides',
    name: 'Guides & Strategy',
    description: 'Hero guides, tips, strategies, and gameplay discussion',
    color: '#10b981',
    icon: '📚',
    order: 4,
    isPublic: true,
    allowGuests: true,
    requiresVerification: false,
    threads: 234,
    posts: 3456,
    lastActivity: {
      threadId: 'iron-man-guide',
      threadTitle: 'Complete Iron Man Guide for Season 2',
      username: 'ProCoach',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString() // 45 minutes ago
    },
    moderators: [
      { id: 'guide1', username: 'GuidesMod', avatar: '/avatars/guide1.png' }
    ],
    rules: [
      'High-quality guides preferred',
      'Include your rank/experience when giving advice',
      'Be open to feedback and discussion',
      'Update guides when patches change the meta'
    ],
    weeklyStats: {
      newThreads: 12,
      newPosts: 234,
      activeUsers: 98,
      trend: 'stable'
    }
  },
  {
    id: 'memes',
    name: 'Memes & Highlights',
    description: 'Funny moments, memes, clips, and community highlights',
    color: '#8b5cf6',
    icon: '😄',
    order: 5,
    isPublic: true,
    allowGuests: true,
    requiresVerification: false,
    threads: 892,
    posts: 5671,
    lastActivity: {
      threadId: 'weekly-clips',
      threadTitle: 'Best Plays of the Week #47',
      username: 'ClipMaster',
      timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() // 8 minutes ago
    },
    moderators: [
      { id: 'fun1', username: 'FunMod', avatar: '/avatars/fun1.png' }
    ],
    rules: [
      'Keep content appropriate and family-friendly',
      'Give credit to original creators',
      'No low-effort posts or spam',
      'Celebrate great plays from all skill levels'
    ],
    weeklyStats: {
      newThreads: 67,
      newPosts: 423,
      activeUsers: 245,
      trend: 'up'
    }
  },
  {
    id: 'bug-reports',
    name: 'Bug Reports',
    description: 'Report bugs, technical issues, and provide feedback',
    color: '#f97316',
    icon: '🐛',
    order: 6,
    isPublic: true,
    allowGuests: false,
    requiresVerification: true,
    threads: 156,
    posts: 987,
    lastActivity: {
      threadId: 'audio-bug',
      threadTitle: 'Audio cutting out on Wakanda map',
      username: 'BugHunter',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
    },
    moderators: [
      { id: 'dev1', username: 'NetEaseDev', avatar: '/avatars/dev1.png' },
      { id: 'bug1', username: 'BugMod', avatar: '/avatars/bug1.png' }
    ],
    rules: [
      'Use the bug report template',
      'Search for existing reports before posting',
      'Include system specs and reproduction steps',
      'Be patient - developers will respond when possible'
    ],
    weeklyStats: {
      newThreads: 8,
      newPosts: 45,
      activeUsers: 34,
      trend: 'down'
    }
  },
  {
    id: 'off-topic',
    name: 'Off Topic',
    description: 'Non-Marvel Rivals discussion and casual conversation',
    color: '#6b7280',
    icon: '🌐',
    order: 7,
    isPublic: true,
    allowGuests: true,
    requiresVerification: false,
    threads: 445,
    posts: 2234,
    lastActivity: {
      threadId: 'movie-talk',
      threadTitle: 'Favorite Marvel movies?',
      username: 'MovieFan',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
    },
    moderators: [
      { id: 'mod1', username: 'CommunityMod', avatar: '/avatars/mod1.png' }
    ],
    rules: [
      'Keep discussions respectful',
      'No politics or controversial topics',
      'Marvel-related content preferred but not required',
      'Follow general community guidelines'
    ],
    weeklyStats: {
      newThreads: 18,
      newPosts: 156,
      activeUsers: 89,
      trend: 'stable'
    }
  }
];

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_REQUESTS = 30;
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

// Filter categories based on user permissions
function filterCategoriesByPermissions(categories: any[], userRole: string) {
  return categories.filter(category => {
    // Admin can see everything
    if (userRole === 'admin') return true;
    
    // Moderators can see public categories and verification-required ones
    if (userRole === 'moderator') return category.isPublic;
    
    // Registered users can see public categories
    if (userRole === 'user') {
      return category.isPublic && (category.allowGuests || !category.requiresVerification);
    }
    
    // Guests can only see public categories that allow guests
    return category.isPublic && category.allowGuests;
  });
}

// Calculate category activity score for sorting
function calculateActivityScore(category: any): number {
  const hoursAgo = (Date.now() - new Date(category.lastActivity.timestamp).getTime()) / (1000 * 60 * 60);
  const recentActivityWeight = Math.max(0, 24 - hoursAgo) / 24; // Weight recent activity more
  const postVelocity = category.weeklyStats.newPosts / 7; // Posts per day
  const threadVelocity = category.weeklyStats.newThreads / 7; // Threads per day
  
  return (recentActivityWeight * 10) + (postVelocity * 0.1) + (threadVelocity * 2);
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
      validatedQuery = categoryQuerySchema.parse(queryObject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid query parameters', details: error.errors },
          { status: 400 }
        );
      }
    }

    // Filter categories based on user permissions
    let filteredCategories = filterCategoriesByPermissions(categories, validatedQuery.userRole);

    // Sort categories by order, then by activity
    filteredCategories.sort((a, b) => {
      // First sort by order
      if (a.order !== b.order) {
        return a.order - b.order;
      }
      // Then by activity score
      return calculateActivityScore(b) - calculateActivityScore(a);
    });

    // Mobile optimization - reduce data for mobile clients
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    
    if (isMobile && !validatedQuery.includeStats) {
      // Minimal data for mobile
      filteredCategories = filteredCategories.map(category => ({
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        icon: category.icon,
        threads: category.threads,
        posts: category.posts,
        lastActivity: {
          username: category.lastActivity.username,
          timestamp: category.lastActivity.timestamp
        }
      }));
    }

    // Calculate totals
    const totals = filteredCategories.reduce((acc, category) => ({
      threads: acc.threads + category.threads,
      posts: acc.posts + category.posts,
      categories: acc.categories + 1
    }), { threads: 0, posts: 0, categories: 0 });

    // Response
    return NextResponse.json({
      success: true,
      data: filteredCategories,
      totals,
      meta: {
        timestamp: new Date().toISOString(),
        userRole: validatedQuery.userRole,
        mobile: isMobile,
        includeStats: validatedQuery.includeStats
      }
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Create new category (Admin only)
export async function POST(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin role
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['name', 'description', 'color', 'icon'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Create new category
    const newCategory = {
      id: body.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      name: body.name,
      description: body.description,
      color: body.color,
      icon: body.icon,
      order: categories.length + 1,
      isPublic: body.isPublic !== false,
      allowGuests: body.allowGuests !== false,
      requiresVerification: body.requiresVerification === true,
      threads: 0,
      posts: 0,
      lastActivity: null,
      moderators: [],
      rules: body.rules || [],
      weeklyStats: {
        newThreads: 0,
        newPosts: 0,
        activeUsers: 0,
        trend: 'stable'
      }
    };

    categories.push(newCategory);

    console.log(`[ADMIN] New category created: ${newCategory.name}`);

    return NextResponse.json({
      success: true,
      message: 'Category created successfully',
      category: newCategory
    }, { status: 201 });

  } catch (error) {
    console.error('Create category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update category (Admin/Moderator only)
export async function PUT(request: NextRequest) {
  try {
    // TODO: Add authentication middleware to verify admin/moderator role
    const body = await request.json();
    const { categoryId, ...updates } = body;
    
    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Find category
    const categoryIndex = categories.findIndex(c => c.id === categoryId);
    if (categoryIndex === -1) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update category
    categories[categoryIndex] = { ...categories[categoryIndex], ...updates };

    console.log(`[ADMIN] Category updated: ${categoryId}`);

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully',
      category: categories[categoryIndex]
    });

  } catch (error) {
    console.error('Update category error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
