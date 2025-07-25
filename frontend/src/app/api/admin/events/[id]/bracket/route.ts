import { NextRequest, NextResponse } from 'next/server';
import { 
  createSingleEliminationBracket, 
  createDoubleEliminationBracket,
  resetBracket,
  updateMatchResult,
  generateBracketId,
  LiquipediaBracket,
  LiquipediaOpponent
} from '@/lib/liquipedia-bracket';

// In-memory storage for brackets (replace with database in production)
export const bracketStore = new Map<string, LiquipediaBracket>();
const bracketHistory = new Map<string, LiquipediaBracket[]>();

// Generate bracket for an event
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const eventId = pathSegments[eventIdIndex];
    
    const body = await request.json();
    const { format = 'double_elimination', teams = [], seeding_type = 'manual' } = body;
    
    if (!teams || teams.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 teams are required to generate a bracket' },
        { status: 400 }
      );
    }
    
    // Convert teams to Liquipedia format
    const liquipediaTeams: LiquipediaOpponent[] = teams.map((team: any, index: number) => ({
      id: team.id,
      name: team.name,
      short_name: team.short_name || team.name.substring(0, 4).toUpperCase(),
      logo: team.logo,
      seed: seeding_type === 'manual' ? index + 1 : team.rating || index + 1
    }));
    
    // Sort by seed if rating-based
    if (seeding_type === 'rating') {
      liquipediaTeams.sort((a, b) => (b.seed || 0) - (a.seed || 0));
      liquipediaTeams.forEach((team, index) => {
        team.seed = index + 1;
      });
    }
    
    // Generate bracket based on format
    let bracket: LiquipediaBracket;
    
    switch (format) {
      case 'single_elimination':
        bracket = createSingleEliminationBracket(liquipediaTeams);
        break;
      case 'double_elimination':
        bracket = createDoubleEliminationBracket(liquipediaTeams);
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported bracket format' },
          { status: 400 }
        );
    }
    
    // Store bracket
    bracketStore.set(eventId, bracket);
    
    // Save to history
    const history = bracketHistory.get(eventId) || [];
    history.push(JSON.parse(JSON.stringify(bracket))); // Deep copy
    bracketHistory.set(eventId, history);
    
    console.log(`[ADMIN] Generated ${format} bracket for event ${eventId} with ${teams.length} teams`);
    
    return NextResponse.json({
      success: true,
      message: 'Bracket generated successfully',
      data: {
        bracket,
        event_id: eventId
      }
    });
    
  } catch (error) {
    console.error('Generate bracket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Get bracket for an event
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const eventId = pathSegments[eventIdIndex];
    
    const bracket = bracketStore.get(eventId);
    
    if (!bracket) {
      return NextResponse.json(
        { error: 'No bracket found for this event' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        bracket,
        event_id: eventId,
        last_updated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Get bracket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update bracket (match results)
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const eventId = pathSegments[eventIdIndex];
    
    const body = await request.json();
    const { match_id, winner, score1, score2 } = body;
    
    if (!match_id || !winner || score1 === undefined || score2 === undefined) {
      return NextResponse.json(
        { error: 'match_id, winner, score1, and score2 are required' },
        { status: 400 }
      );
    }
    
    const bracket = bracketStore.get(eventId);
    
    if (!bracket) {
      return NextResponse.json(
        { error: 'No bracket found for this event' },
        { status: 404 }
      );
    }
    
    // Update match result and progress teams
    const updatedBracket = updateMatchResult(bracket, match_id, winner, score1, score2);
    
    // Update status if needed
    const allMatches = Object.values(updatedBracket.matches);
    const finishedMatches = allMatches.filter(m => m.finished);
    
    if (finishedMatches.length === allMatches.length) {
      updatedBracket.status = 'completed';
    } else if (finishedMatches.length > 0) {
      updatedBracket.status = 'ongoing';
    }
    
    // Store updated bracket
    bracketStore.set(eventId, updatedBracket);
    
    console.log(`[ADMIN] Updated match ${match_id} in bracket for event ${eventId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Match result updated successfully',
      data: {
        bracket: updatedBracket,
        event_id: eventId
      }
    });
    
  } catch (error) {
    console.error('Update bracket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Reset bracket
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const eventId = pathSegments[eventIdIndex];
    
    const bracket = bracketStore.get(eventId);
    
    if (!bracket) {
      return NextResponse.json(
        { error: 'No bracket found for this event' },
        { status: 404 }
      );
    }
    
    // Reset bracket
    const resetBracketData = resetBracket(bracket);
    
    // Store reset bracket
    bracketStore.set(eventId, resetBracketData);
    
    // Save to history
    const history = bracketHistory.get(eventId) || [];
    history.push(JSON.parse(JSON.stringify(resetBracketData)));
    bracketHistory.set(eventId, history);
    
    console.log(`[ADMIN] Reset bracket for event ${eventId}`);
    
    return NextResponse.json({
      success: true,
      message: 'Bracket reset successfully',
      data: {
        bracket: resetBracketData,
        event_id: eventId
      }
    });
    
  } catch (error) {
    console.error('Reset bracket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}