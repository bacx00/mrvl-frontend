// src/app/matches/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import MatchCard from '@/components/MatchCard';
import TabNavigation from '@/components/TabNavigation';

type Filter = 'All' | 'Live' | 'Completed';

export default function MatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>('All');

  useEffect(() => {
    fetch('/api/matches')
      .then((res) => res.json())
      .then((data) => setMatches(data));
  }, []);

  const filtered = matches.filter((m) => {
    if (filter === 'Live') return m.status === 'live';
    if (filter === 'Completed') return m.status === 'completed';
    return true;
  });

  return (
    <main className="container py-4">
      <h1>Matches</h1>
      <TabNavigation
        tabs={['All','Live','Completed']}
        activeTab={filter}
        onTabSelect={(tab) => setFilter(tab as Filter)}
      />
      <div className="mt-3">
        {filtered.map((m) => <MatchCard key={m.id} match={m} />)}
      </div>
    </main>
  );
}
