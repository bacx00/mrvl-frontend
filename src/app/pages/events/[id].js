export async function getServerSideProps(context) {
    const { id } = context.params;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/events/${id}`);
    const event = await res.json();
    return { props: { event } };
  }
  
  export default function EventDetailPage({ event }) {
    return (
      <div>
        <h2>{event.name}</h2>
        <p><strong>Date:</strong> {new Date(event.date).toLocaleString()}</p>
        {event.location && <p><strong>Location:</strong> {event.location}</p>}
        <p>{event.description}</p>
      </div>
    );
  }