export async function getServerSideProps(context) {
    const { id } = context.params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/matches/${id}`);
    const match = await res.json();
    return { props: { match } };
  }
  
  export default function MatchDetailPage({ match }) {
    // Separate players by team for display
    const team1Players = match.players.filter(p => p.team_id === match.team1.id);
    const team2Players = match.players.filter(p => p.team_id === match.team2.id);
  
    return (
      <div>
        <h2>Match Details</h2>
        <p>
          {match.team1.name} vs {match.team2.name} – {new Date(match.date).toLocaleString()}
        </p>
        <h4>
          Score: {match.team1.name} {match.score1} - {match.score2} {match.team2.name}
        </h4>
        <div className="row">
          <div className="col-md-6">
            <h5>{match.team1.name} Players</h5>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Player</th><th>Kills</th><th>Deaths</th><th>Assists</th>
                </tr>
              </thead>
              <tbody>
                {team1Players.map(player => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>{player.pivot.kills}</td>
                    <td>{player.pivot.deaths}</td>
                    <td>{player.pivot.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="col-md-6">
            <h5>{match.team2.name} Players</h5>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Player</th><th>Kills</th><th>Deaths</th><th>Assists</th>
                </tr>
              </thead>
              <tbody>
                {team2Players.map(player => (
                  <tr key={player.id}>
                    <td>{player.name}</td>
                    <td>{player.pivot.kills}</td>
                    <td>{player.pivot.deaths}</td>
                    <td>{player.pivot.assists}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }