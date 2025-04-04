export async function getServerSideProps() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/rankings`);
    const rankings = await res.json();
    return { props: { rankings } };
  }
  
  export default function RankingsPage({ rankings }) {
    return (
      <div>
        <h2>Rankings</h2>
        <table className="table table-bordered table-striped w-50">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((team, index) => (
              <tr key={team.id}>
                <td>{index + 1}</td>
                <td>{team.name}</td>
                <td>{team.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }