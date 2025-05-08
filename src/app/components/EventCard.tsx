export default function EventCard({ event }: { event: any }) {
  const { name, startDate, endDate, location } = event;
  return (
    <div className="card bg-dark text-light h-100">
      <div className="card-body">
        <h5 className="card-title">{name}</h5>
        <p className="card-text">
          <small>{startDate} - {endDate}</small><br/>
          <small>{location}</small>
        </p>
        {/* Link to event details or external info if available */}
        <a href="#" className="btn btn-primary btn-sm mt-2 disabled">View Details</a>
      </div>
    </div>
  );
}
