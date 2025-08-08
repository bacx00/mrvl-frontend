// src/app/api/forums/thread/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Type for route params
interface RouteParams {
  params: Promise<{ id: string }>;
}

// Mock data for forum threads with detailed posts
const threadData: Record<string, any> = {
  '1': {
    id: '1',
    title: 'Discussion about Marvel Rivals patch 1.4',
    category: {
      id: 'patch-notes',
      name: 'Patch Notes'
    },
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'user1',
      name: 'MarvelFan2025',
      avatar: '/avatars/default.png',
      posts: 128,
      joinDate: '2023-11-15T00:00:00Z'
    },
    views: 1204,
    isPinned: true,
    isLocked: false,
    tags: ['Discussion', 'Feedback'],
    posts: [
      {
        id: '101',
        content: "# Thoughts on the Latest Patch\n\nI've been playing with the new changes for about a week now, and I have to say I'm impressed with the balance updates. Iron Man feels much more balanced now, and Storm got the buffs she desperately needed.\n\nHowever, I still think Black Panther's ultimate charges too quickly. What are your thoughts?",
        author: {
          id: 'user1',
          name: 'MarvelFan2025',
          avatar: '/avatars/default.png',
          posts: 128,
          joinDate: '2023-11-15T00:00:00Z'
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: [
          { type: '👍', count: 24, userReacted: false },
          { type: '❤️', count: 12, userReacted: false }
        ]
      },
      {
        id: '102',
        content: "I totally agree about Iron Man. The reduction on his repulsor cooldown was just what he needed without making him overpowered.\n\nRegarding Black Panther, I've found that the ultimate charge rate is only a problem when you're facing a team with lots of tanks. Against squishier comps, it seems more balanced because he has to risk more to build charge.",
        author: {
          id: 'user2',
          name: 'RiverTeam',
          avatar: '/avatars/default2.png',
          posts: 86,
          joinDate: '2024-01-22T00:00:00Z'
        },
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: [
          { type: '👍', count: 8, userReacted: false }
        ]
      },
      {
        id: '103',
        content: "The patch notes mentioned a fix for Doctor Strange's portal bug, but I'm still experiencing it occasionally. Has anyone else noticed this? Steps to reproduce:\n\n1. Cast portal\n2. Use ultimate during the portal animation\n3. Sometimes you get stuck in place until you use another ability\n\nHoping they fix this in the next hotfix.",
        author: {
          id: 'user3',
          name: 'StrangeMain',
          avatar: '/avatars/default3.png',
          posts: 214,
          joinDate: '2023-09-05T00:00:00Z'
        },
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        edited: true,
        lastEditedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: [
          { type: '👍', count: 15, userReacted: false },
          { type: '🤔', count: 3, userReacted: false }
        ]
      }
    ]
  },
  '2': {
    id: '2',
    title: 'New Player Guide: Tips and Tricks for Beginners',
    category: {
      id: 'general',
      name: 'General Discussion'
    },
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    author: {
      id: 'user4',
      name: 'ProCoach',
      avatar: '/avatars/default4.png',
      posts: 342,
      joinDate: '2023-08-10T00:00:00Z'
    },
    views: 3567,
    isPinned: true,
    isLocked: false,
    tags: ['Guide', 'Beginners'],
    posts: [
      {
        id: '201',
        content: "# Marvel Rivals: Beginner's Guide\n\nWelcome to Marvel Rivals! This guide is designed to help new players get started and improve quickly.\n\n## Basic Controls\n\n- Movement: WASD\n- Abilities: Q, E, Shift\n- Ultimate: F\n- Jump: Space\n\n## Tips for New Players\n\n1. Start with easier heroes like Captain America or Iron Man\n2. Focus on learning one role initially\n3. Spend time in the practice range\n4. Watch tutorial videos and pro streams\n\nLet me know if you have any specific questions!",
        author: {
          id: 'user4',
          name: 'ProCoach',
          avatar: '/avatars/default4.png',
          posts: 342,
          joinDate: '2023-08-10T00:00:00Z'
        },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: [
          { type: '👍', count: 156, userReacted: false },
          { type: '🔥', count: 42, userReacted: false },
          { type: '🙏', count: 27, userReacted: false }
        ]
      },
      {
        id: '202',
        content: "Thanks for the guide! I'm struggling with aiming - any tips specifically for improving aim?",
        author: {
          id: 'user5',
          name: 'Newbie123',
          avatar: '/avatars/default5.png',
          posts: 12,
          joinDate: '2025-04-02T00:00:00Z'
        },
        createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: []
      },
      {
        id: '203',
        content: "Great question about aiming! Here are some tips:\n\n- Find the right sensitivity that works for you - not too fast, not too slow\n- Practice tracking moving targets in the practice range\n- Consider using aim trainers outside the game\n- Focus on crosshair placement - keep it at head level\n- Don't rush your shots - accuracy is more important than speed at first\n\nStart with these basics and your aim will improve over time!",
        author: {
          id: 'user4',
          name: 'ProCoach',
          avatar: '/avatars/default4.png',
          posts: 342,
          joinDate: '2023-08-10T00:00:00Z'
        },
        createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        reactions: [
          { type: '👍', count: 32, userReacted: false },
          { type: '🎯', count: 8, userReacted: false }
        ]
      }
    ]
  }
};

// Get thread and its posts
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: threadId } = await params;
  
  // Check if thread exists
  if (!threadData[threadId]) {
    return NextResponse.json(
      { error: 'Thread not found' },
      { status: 404 }
    );
  }
  
  // Return thread data
  return NextResponse.json(threadData[threadId]);
}

// Create a new post in a thread
export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: threadId } = await params;
  
  // Check if thread exists
  if (!threadData[threadId]) {
    return NextResponse.json(
      { error: 'Thread not found' },
      { status: 404 }
    );
  }
  
  // Check if thread is locked
  if (threadData[threadId].isLocked) {
    return NextResponse.json(
      { error: 'Thread is locked' },
      { status: 403 }
    );
  }
  
  try {
    const { content, userId, username } = await request.json();
    
    // Validate request
    if (!content || !userId || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Create new post
    const newPost = {
      id: `temp-${Date.now()}`,
      content,
      author: {
        id: userId,
        name: username,
        avatar: '/avatars/default.png', // Default avatar for new posts
        posts: 1, // In a real app, we would fetch the user's post count
        joinDate: new Date().toISOString() // In a real app, we would fetch the user's join date
      },
      createdAt: new Date().toISOString(),
      reactions: []
    };
    
    // Add post to thread
    threadData[threadId].posts.push(newPost);
    
    // Return the new post
    return NextResponse.json(newPost, { status: 201 });
    
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

// Update a post (edit)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: threadId } = await params;
  
  try {
    const { postId, content, userId } = await request.json();
    
    // Validate request
    if (!postId || !content || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if thread exists
    if (!threadData[threadId]) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Find post
    const postIndex = threadData[threadId].posts.findIndex((post: any) => post.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Check if user is the author of the post
    if (threadData[threadId].posts[postIndex].author.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized to edit this post' },
        { status: 403 }
      );
    }
    
    // Update post
    threadData[threadId].posts[postIndex].content = content;
    threadData[threadId].posts[postIndex].edited = true;
    threadData[threadId].posts[postIndex].lastEditedAt = new Date().toISOString();
    
    // Return updated post
    return NextResponse.json(threadData[threadId].posts[postIndex]);
    
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// Add a reaction to a post
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  const { id: threadId } = await params;
  
  try {
    const { postId, reactionType, userId } = await request.json();
    
    // Validate request
    if (!postId || !reactionType || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if thread exists
    if (!threadData[threadId]) {
      return NextResponse.json(
        { error: 'Thread not found' },
        { status: 404 }
      );
    }
    
    // Find post
    const postIndex = threadData[threadId].posts.findIndex((post: any) => post.id === postId);
    
    if (postIndex === -1) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }
    
    // Find existing reaction
    const post = threadData[threadId].posts[postIndex];
    const reactionIndex = post.reactions.findIndex((reaction: any) => reaction.type === reactionType);
    
    // Toggle reaction
    if (reactionIndex !== -1) {
      // Reaction exists, toggle userReacted and update count
      post.reactions[reactionIndex].userReacted = !post.reactions[reactionIndex].userReacted;
      post.reactions[reactionIndex].count += post.reactions[reactionIndex].userReacted ? 1 : -1;
      
      // Remove reaction if count is 0
      if (post.reactions[reactionIndex].count <= 0) {
        post.reactions.splice(reactionIndex, 1);
      }
    } else {
      // Add new reaction
      post.reactions.push({
        type: reactionType,
        count: 1,
        userReacted: true
      });
    }
    
    // Return updated reactions
    return NextResponse.json(post.reactions);
    
  } catch (error) {
    console.error('Error updating reaction:', error);
    return NextResponse.json(
      { error: 'Failed to update reaction' },
      { status: 500 }
    );
  }
}
