import Link from 'next/link';

export async function getServerSideProps() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events`);
  const events = await res.json();
  return { props: { events } };
}

export default function EventsPage({ events }) {
  return (
    <div>
      <h2>Events</h2>
      <ul className="list-group">
        {events.map(event => (
          <li key={event.id} className="list-group-item">
            <h5>
              <Link href={`/events/${event.id}`} className="text-decoration-none">
                {event.name}
              </Link>
            </h5>
            <p>
              {new Date(event.date).toLocaleString()}
              {event.location ? ` – ${event.location}` : ''}
            </p>
            <p>{event.description}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}