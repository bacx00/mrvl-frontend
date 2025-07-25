import { NextRequest, NextResponse } from 'next/server';
import { LiquipediaBracket } from '@/lib/liquipedia-bracket';

// Import shared bracket store from admin endpoint
import { bracketStore } from '../../admin/events/[id]/bracket/route';

// Marvel Rivals Invitational bracket structure (Liquipedia format)
const marvelRivalsInvitationalBracket: LiquipediaBracket = {
  id: "MRI2025NA01",
  name: "Marvel Rivals Invitational 2025: North America",
  type: "double",
  teamcount: 8,
  status: "completed",
  matches: {
    // Upper Bracket Semifinals
    "R1M1": {
      id: "R1M1",
      bracketId: "MRI2025NA01",
      round: 1,
      match: 1,
      opponent1: { id: 1, name: "100 Thieves", short_name: "100T", logo: "/teams/100t-logo.png", seed: 1, score: 3 },
      opponent2: { id: 4, name: "ENVY", short_name: "ENVY", logo: "/teams/envy-logo.png", seed: 4, score: 1 },
      winner: 1,
      winnerto: "R2M1",
      loserto: "L2M1",
      finished: true,
      bestof: 5,
      date: "2025-03-21T18:00:00Z"
    },
    "R1M2": {
      id: "R1M2",
      bracketId: "MRI2025NA01",
      round: 1,
      match: 2,
      opponent1: { id: 2, name: "FlyQuest", short_name: "FLY", logo: "/teams/flyquest-logo.png", seed: 2, score: 2 },
      opponent2: { id: 3, name: "Sentinels", short_name: "SEN", logo: "/teams/sentinels-logo.png", seed: 3, score: 3 },
      winner: 2,
      winnerto: "R2M1",
      loserto: "L2M2",
      finished: true,
      bestof: 5,
      date: "2025-03-21T21:00:00Z"
    },
    // Upper Final
    "R2M1": {
      id: "R2M1",
      bracketId: "MRI2025NA01",
      round: 2,
      match: 1,
      opponent1: { id: 1, name: "100 Thieves", short_name: "100T", logo: "/teams/100t-logo.png", score: 3 },
      opponent2: { id: 3, name: "Sentinels", short_name: "SEN", logo: "/teams/sentinels-logo.png", score: 2 },
      winner: 1,
      winnerto: "GF",
      loserto: "L4M1",
      finished: true,
      bestof: 5,
      date: "2025-03-22T20:00:00Z"
    },
    // Lower Bracket Round 1
    "L1M1": {
      id: "L1M1",
      bracketId: "MRI2025NA01",
      round: 3,
      match: 1,
      opponent1: { id: 5, name: "Shikigami", short_name: "SHK", logo: "/teams/shikigami-logo.png", seed: 5, score: 2 },
      opponent2: { id: 8, name: "Rad Esports", short_name: "RAD", logo: "/teams/rad-logo.png", seed: 8, score: 0 },
      winner: 1,
      winnerto: "L2M1",
      finished: true,
      bestof: 3,
      date: "2025-03-21T15:00:00Z"
    },
    "L1M2": {
      id: "L1M2",
      bracketId: "MRI2025NA01",
      round: 3,
      match: 2,
      opponent1: { id: 6, name: "NTMR", short_name: "NTMR", logo: "/teams/ntmr-logo.png", seed: 6, score: 2 },
      opponent2: { id: 7, name: "SHROUD-X", short_name: "SHRX", logo: "/teams/shroudx-logo.png", seed: 7, score: 1 },
      winner: 1,
      winnerto: "L2M2",
      finished: true,
      bestof: 3,
      date: "2025-03-21T15:00:00Z"
    },
    // Lower Bracket Round 2
    "L2M1": {
      id: "L2M1",
      bracketId: "MRI2025NA01",
      round: 4,
      match: 1,
      opponent1: { id: 4, name: "ENVY", short_name: "ENVY", logo: "/teams/envy-logo.png", score: 3 },
      opponent2: { id: 5, name: "Shikigami", short_name: "SHK", logo: "/teams/shikigami-logo.png", score: 1 },
      winner: 1,
      winnerto: "L3M1",
      finished: true,
      bestof: 5,
      date: "2025-03-22T15:00:00Z"
    },
    "L2M2": {
      id: "L2M2",
      bracketId: "MRI2025NA01",
      round: 4,
      match: 2,
      opponent1: { id: 2, name: "FlyQuest", short_name: "FLY", logo: "/teams/flyquest-logo.png", score: 3 },
      opponent2: { id: 6, name: "NTMR", short_name: "NTMR", logo: "/teams/ntmr-logo.png", score: 0 },
      winner: 1,
      winnerto: "L3M1",
      finished: true,
      bestof: 5,
      date: "2025-03-22T15:00:00Z"
    },
    // Lower Semifinals
    "L3M1": {
      id: "L3M1",
      bracketId: "MRI2025NA01",
      round: 5,
      match: 1,
      opponent1: { id: 4, name: "ENVY", short_name: "ENVY", logo: "/teams/envy-logo.png", score: 1 },
      opponent2: { id: 2, name: "FlyQuest", short_name: "FLY", logo: "/teams/flyquest-logo.png", score: 3 },
      winner: 2,
      winnerto: "L4M1",
      finished: true,
      bestof: 5,
      date: "2025-03-22T18:00:00Z"
    },
    // Lower Final
    "L4M1": {
      id: "L4M1",
      bracketId: "MRI2025NA01",
      round: 6,
      match: 1,
      opponent1: { id: 3, name: "Sentinels", short_name: "SEN", logo: "/teams/sentinels-logo.png", score: 2 },
      opponent2: { id: 2, name: "FlyQuest", short_name: "FLY", logo: "/teams/flyquest-logo.png", score: 3 },
      winner: 2,
      winnerto: "GF",
      finished: true,
      bestof: 5,
      date: "2025-03-23T17:00:00Z"
    },
    // Grand Final
    "GF": {
      id: "GF",
      bracketId: "MRI2025NA01",
      round: 7,
      match: 1,
      opponent1: { id: 1, name: "100 Thieves", short_name: "100T", logo: "/teams/100t-logo.png", score: 4 },
      opponent2: { id: 2, name: "FlyQuest", short_name: "FLY", logo: "/teams/flyquest-logo.png", score: 2 },
      winner: 1,
      finished: true,
      bestof: 7,
      date: "2025-03-23T20:00:00Z"
    }
  },
  rounds: [
    { round: 1, name: "Upper Semifinals", matches: ["R1M1", "R1M2"], bestof: 5 },
    { round: 2, name: "Upper Final", matches: ["R2M1"], bestof: 5 },
    { round: 3, name: "Lower Round 1", matches: ["L1M1", "L1M2"], bestof: 3 },
    { round: 4, name: "Lower Round 2", matches: ["L2M1", "L2M2"], bestof: 5 },
    { round: 5, name: "Lower Semifinals", matches: ["L3M1"], bestof: 5 },
    { round: 6, name: "Lower Final", matches: ["L4M1"], bestof: 5 },
    { round: 7, name: "Grand Final", matches: ["GF"], bestof: 7 }
  ]
};

// Store the MRI bracket
bracketStore.set("100", marvelRivalsInvitationalBracket);

export async function GET(request: NextRequest) {
  try {
    // Extract event ID from URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const id = pathSegments[eventIdIndex];
    
    // Check if bracket exists in store
    let bracket = bracketStore.get(id);
    
    if (!bracket) {
      // Return empty bracket structure
      return NextResponse.json({
        success: true,
        data: {
          event_id: id,
          bracket: null,
          message: "No bracket generated yet"
        }
      });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        event_id: id,
        bracket: bracket,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Bracket API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Update bracket (Admin only)
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const id = pathSegments[eventIdIndex];
    
    const body = await request.json();
    
    // Update bracket in store
    bracketStore.set(id, body);
    
    console.log(`[ADMIN] Bracket updated for event ${id}`);
    
    return NextResponse.json({
      success: true,
      message: 'Bracket updated successfully',
      data: body
    });

  } catch (error) {
    console.error('Update bracket error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate bracket from teams (Admin only)
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const eventIdIndex = pathSegments.findIndex(seg => seg === 'events') + 1;
    const id = pathSegments[eventIdIndex];
    
    const body = await request.json();
    const { teams, format = "double_elimination", seeding_type = "manual", include_swiss = false } = body;
    
    // TODO: Implement bracket generation based on teams and format
    console.log(`[ADMIN] Generating bracket for event ${id} with ${teams?.length} teams`);
    
    return NextResponse.json({
      success: true,
      message: 'Bracket generated successfully',
      data: {
        event_id: id,
        format,
        seeding_type,
        teams_count: teams?.length || 0
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