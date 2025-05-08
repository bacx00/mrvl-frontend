import { NextResponse } from 'next/server';

const news = [
  { id: 101, title: 'Patch 1.03 buffs Iron Man',        date: '2025‑05‑04' },
  { id: 102, title: 'Season‑2 format announced',        date: '2025‑05‑02' },
  { id: 103, title: 'Top‑10 plays of last weekend',     date: '2025‑05‑01' },
];

export async function GET() { return NextResponse.json(news); }
