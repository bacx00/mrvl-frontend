import { NextRequest, NextResponse } from 'next/server';

const table = [
  { rank: 1, name: 'Alpha Squad',  region: 'NA', pts: 1980 },
  { rank: 2, name: 'Bravo Club',   region: 'EU', pts: 1850 },
  { rank: 3, name: 'Charlie Five', region: 'AP', pts: 1725 },
  { rank: 4, name: 'Delta Force',  region: 'BR', pts: 1690 },
  { rank: 5, name: 'Echo Unit',    region: 'KR', pts: 1605 },
  { rank: 6, name: 'Foxtrot',      region: 'NA', pts: 1540 },
];

export async function GET(req: NextRequest) {
  const top = Number(req.nextUrl.searchParams.get('top') || '0');
  const sliced = top > 0 ? table.slice(0, top) : table;
  return NextResponse.json(sliced);
}
