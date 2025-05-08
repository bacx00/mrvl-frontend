import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MiniRank { position: number; team: string; points: number; }

export default function Sidebar() {
  const [trending, setTrending] = useState<{ title: string; id: string; }[]>([]);
  const [miniRank, setMiniRank] = useState<MiniRank[]>([]);

  useEffect(() => {
    // fetch trending forum threads (or hardcode for now)
    fetch('/api/forums/trending')
      .then(res => res.json())
      .then(data => setTrending(data));
    // fetch top 5 teams for mini leaderboard
    fetch('/api/rankings?top=5')
      .then(res => res.json())
      .then(data => setMiniRank(data.slice(0,5)));
  }, []);

  return (
    <div className="sidebar">
      {/* Trending discussions */}
      <div className="mb-4">
        <h5>Trending Discussions</h5>
        <ul className="list-unstyled">
          {trending.map(thread => (
            <li key={thread.id}>
              <Link href={`/forums/general/${thread.id}`} className="text-light text-decoration-none">
                • {thread.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      {/* Mini leaderboard */}
      <div className="mb-4">
        <h5>Top Teams</h5>
        <ol className="ps-3">
          {miniRank.map(team => (
            <li key={team.position} className="text-light">
              {team.team} <small className="text-muted">{team.points} pts</small>
            </li>
          ))}
        </ol>
      </div>
      {/* Placeholder for ads or additional content */}
      <div className="ads">
        <p className="text-muted">[Ad space]</p>
      </div>
    </div>
  );
}
