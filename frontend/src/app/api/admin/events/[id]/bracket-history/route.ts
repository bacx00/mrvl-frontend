import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for bracket history (replace with database in production)
const bracketHistory = new Map<string, any[]>();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const eventId = pathSegments[eventIdIndex];
    
    const history = bracketHistory.get(eventId) || [];
    
    // Format history with metadata
    const formattedHistory = history.map((bracket, index) => ({
      id: `v${index + 1}`,
      version: index + 1,
      created_at: bracket.created_at || new Date(Date.now() - (history.length - index) * 3600000).toISOString(),
      status: bracket.status,
      match_count: Object.keys(bracket.matches || {}).length,
      completed_matches: Object.values(bracket.matches || {}).filter((m: any) => m.finished).length,
      bracket_data: bracket
    }));
    
    return NextResponse.json({
      success: true,
      data: formattedHistory.reverse() // Most recent first
    });
    
  } catch (error) {
    console.error('Get bracket history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}