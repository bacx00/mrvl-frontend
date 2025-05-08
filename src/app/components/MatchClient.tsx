// src/app/components/MatchClient.tsx
'use client';

import { useEffect, useState } from 'react';
import TabNavigation from '@/components/TabNavigation';

export interface MatchData {
  id: string;
  team1: string;
  team2: string;
  eventName: string;
  stage: string;
  status: string;
  winner?: string;
  playerStats: Array<{
    name: string;
    kills: number;
    acs: number;
    kd: string;
  }>;
  team1Roster: string[];
  team2Roster: string[];
}

export default function MatchClient({
  matchId,
}: {
  matchId: string;
}) {
  const [match, setMatch] = useState<MatchData | null>(null);
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Stats' | 'Lineups' | 'Chat'
  >('Overview');
  // chatMessages is the state, _setChatMessages is the unused setter
  const [chatMessages, _setChatMessages] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/matches/${matchId}`)
      .then((res) => res.json())
      .then((data: MatchData) => setMatch(data));
  }, [matchId]);

  if (!match) return <div>Loading match details…</div>;

  return (
    <div className="match-details container py-4">
      <h1 className="mb-3">
        {match.team1} vs {match.team2}
      </h1>

      <TabNavigation
        tabs={['Overview', 'Stats', 'Lineups', 'Chat']}
        activeTab={activeTab}
        onTabSelect={(t) => setActiveTab(t as any)}
      />

      {activeTab === 'Overview' && (
        <section className="mt-4">
          <h3>Overview</h3>
          <p>
            {match.eventName} – {match.stage}
          </p>
          <p>
            Status: {match.status}{' '}
            {match.status === 'completed' && `– Winner: ${match.winner}`}
          </p>
        </section>
      )}

      {activeTab === 'Stats' && (
        <section className="mt-4">
          <h3>Statistics</h3>
          <table className="table table-dark table-striped">
            <thead>
              <tr>
                <th>Player</th>
                <th>Kills</th>
                <th>ACS</th>
                <th>K/D</th>
              </tr>
            </thead>
            <tbody>
              {match.playerStats.map((p) => (
                <tr key={p.name}>
                  <td>{p.name}</td>
                  <td>{p.kills}</td>
                  <td>{p.acs}</td>
                  <td>{p.kd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'Lineups' && (
        <section className="mt-4">
          <h3>Lineups</h3>
          <div className="row">
            <div className="col-md-6">
              <h5>{match.team1}</h5>
              <ul>
                {match.team1Roster.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            <div className="col-md-6">
              <h5>{match.team2}</h5>
              <ul>
                {match.team2Roster.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'Chat' && (
        <section className="mt-4">
          <h3>Chat</h3>
          <div
            className="chat-box bg-secondary p-3"
            style={{ maxHeight: 300, overflowY: 'auto' }}
          >
            {chatMessages.length === 0 ? (
              <p className="text-light">No messages yet.</p>
            ) : (
              chatMessages.map((msg, i) => (
                <div key={i} className="text-light mb-2">💬 {msg}</div>
              ))
            )}
          </div>
          <form className="mt-2 d-flex">
            <input
              type="text"
              className="form-control me-2"
              placeholder="Type a message…"
              disabled
            />
            <button className="btn btn-primary" disabled>
              Send
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
