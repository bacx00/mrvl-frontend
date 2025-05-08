// src/app/events/page.tsx
'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import EventCard from '@/components/EventCard';

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data: Event[]) => setEvents(data));
  }, []);

  return (
    <main className="container py-4">
      <h1>Upcoming Events</h1>
      <div className="row">
        {events.map((evt) => (
          <div key={evt.id} className="col-md-4 mb-3">
            <EventCard event={evt} />
          </div>
        ))}
      </div>
    </main>
  );
}
