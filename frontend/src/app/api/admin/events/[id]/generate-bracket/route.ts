import { NextRequest, NextResponse } from 'next/server';

// Import event details to get teams
import { eventDetails } from '../../../[id]/route';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const eventId = pathSegments[eventIdIndex];
    
    const body = await request.json();
    const { seeding_type = 'manual', team_ids, include_third_place } = body;
    
    // Get event details
    const event = eventDetails[eventId as keyof typeof eventDetails];
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }
    
    // Get teams
    let teams = event.teams || [];
    if (team_ids && team_ids.length > 0) {
      // Filter teams by provided IDs in order
      teams = team_ids.map((id: number) => teams.find((t: any) => t.id === id)).filter(Boolean);
    }
    
    if (teams.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required to generate a bracket' },
        { status: 400 }
      );
    }
    
    // Determine bracket format based on event
    let format = 'single_elimination';
    if (event.format?.elimination === 'double' || event.format?.type === 'double_elimination') {
      format = 'double_elimination';
    }
    
    // Call the bracket generation endpoint
    const baseUrl = url.origin;
    const generateResponse = await fetch(`${baseUrl}/api/admin/events/${eventId}/bracket`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
      },
      body: JSON.stringify({
        format,
        teams,
        seeding_type
      })
    });
    
    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      return NextResponse.json(error, { status: generateResponse.status });
    }
    
    const result = await generateResponse.json();
    
    console.log(`[ADMIN] Generated bracket for event ${eventId} with ${teams.length} teams`);
    
    return NextResponse.json({
      success: true,
      message: 'Bracket generated successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('Generate bracket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}