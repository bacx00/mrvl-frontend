import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const eventId = pathSegments[eventIdIndex];
    
    // Use the DELETE method of the bracket endpoint to reset
    const baseUrl = url.origin;
    const resetResponse = await fetch(`${baseUrl}/api/admin/events/${eventId}/bracket`, {
      method: 'DELETE',
      headers: request.headers
    });
    
    if (!resetResponse.ok) {
      const error = await resetResponse.json();
      return NextResponse.json(error, { status: resetResponse.status });
    }
    
    const result = await resetResponse.json();
    
    return NextResponse.json({
      success: true,
      message: 'Bracket reset successfully',
      data: result.data
    });
    
  } catch (error) {
    console.error('Reset bracket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}