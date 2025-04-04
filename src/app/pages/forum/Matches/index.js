import Link from 'next/link';

export async function getServerSideProps() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches`);
  const matches = await res.json();
  return { props: { matches } };
}

export default function MatchesPage({ matches }) {
  return (
    <div>
      <h2>Matches</h2>
      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Date</th>
              <th>Team 1</th>
              <th>Score</th>
              <th>Team 2</th>
            </tr>
          </thead>
          <tbody>
            {matches.map(match => (
              <tr key={match.id}>
                <td>{new Date(match.date).toLocaleString()}</td>
                <td>{match.team1.name}</td>
                <td>
                  <Link href={`/matches/${match.id}`} className="text-decoration-none">
                    {match.score1} - {match.score2}
                  </Link>
                </td>
                <td>{match.team2.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}