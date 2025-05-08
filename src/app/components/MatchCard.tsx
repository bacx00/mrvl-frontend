import Link from 'next/link';

export default function MatchCard({ match }: { match: any }) {
  // match object contains: id, team1, team2, team1Score, team2Score, status, time, event, etc.
  const { id, team1, team2, team1Score, team2Score, status, time, eventName } = match;
  const isLive = status === 'live';
  const isCompleted = status === 'completed';
  
  return (
    <div className={`card ${isLive ? 'border-danger' : 'border-secondary'} text-light bg-dark`}>
      <div className="card-body">
        <h5 className="card-title">
          {team1} vs {team2}
        </h5>
        <p className="card-text">
          {isCompleted ? (
            <strong>{team1Score} - {team2Score}</strong>
          ) : (
            <span className="text-muted">{time}</span>  /* show match time if not completed */
          )}
          <br/>
          <small>{eventName}</small>
        </p>
        {isLive && <span className="badge bg-danger me-1">LIVE</span>}
        {isCompleted && <span className="badge bg-secondary me-1">Final</span>}
        {!isLive && !isCompleted && <span className="badge bg-info me-1">Upcoming</span>}
        <Link href={`/matches/${id}`} className="btn btn-primary btn-sm">Details</Link>
      </div>
    </div>
  );
}
