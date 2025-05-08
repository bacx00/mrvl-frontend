import { NextResponse } from 'next/server';

const matches = [
  {
    id: 1, team1: 'Team A', team2: 'Team B', status: 'completed',
    score: { team1: 13, team2: 10 }, event: 'Tournament X Final',
  },
  {
    id: 2, team1: 'Team C', team2: 'Team D', status: 'live',
    score: { team1:  5, team2:  7 }, event: 'Tournament Y Semi‑1',
  },
];

export async function GET() {
  return NextResponse.json(matches);
}
