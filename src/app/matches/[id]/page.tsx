'use client';
export const dynamic = 'force-dynamic';

import MatchClient from '@/components/MatchClient';

export default function MatchPage(props: any) {
  const { id } = props.params as { id: string };
  return (
    <main className="container py-4">
      <MatchClient matchId={id} />
    </main>
  );
}
