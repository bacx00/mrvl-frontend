"use client";

import { useEffect, useState } from "react";

interface TeamRank {
  rank: number;
  name: string;
  points: number;
  region: string;
}

export default function RankingsPage() {
  const [ranks, setRanks] = useState<TeamRank[]>([]);

  useEffect(() => {
    fetch("/api/rankings")
      .then((res) => res.json())
      .then(setRanks)
      .catch(console.error);
  }, []);

  return (
    <main className="container py-4">
      <h1 className="mb-4">Leaderboard</h1>

      {ranks.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Points</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {ranks.map((r) => (
                <tr key={r.rank}>
                  <td>{r.rank}</td>
                  <td>{r.name}</td>
                  <td>{r.points}</td>
                  <td>{r.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading rankings…</p>
      )}
    </main>
  );
}
