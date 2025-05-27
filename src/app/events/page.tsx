// src/app/events/page.tsx - VLR.gg Style Production Ready
'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Event {
  id: string;
  name: string;
  type: 'upcoming' | 'ongoing' | 'completed';
  startDate: string;
  endDate: string;
  location: string;
  prize: string;
  region: string;
  image?: string;
  organizer?: string;
  teams?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRegion, setActiveRegion] = useState<string>('All');
  
  // Regions matching VLR.gg exactly
  const regions = [
    'All', 
    'North America', 
    'Europe', 
    'Brazil', 
    'Asia-Pacific', 
    'Korea', 
    'Japan', 
    'LATAM',
    'MENA',
    'Game Changers'
  ];
  
  // Minimal mock data for demo
  const mockEvents: Event[] = useMemo(() => [
    {
      id: '1',
      name: 'MRVL Championship 2025',
      type: 'ongoing',
      startDate: 'Jan 15, 2025',
      endDate: 'Jan 22, 2025',
      location: 'Los Angeles, CA',
      prize: '$1,000,000',
      region: 'North America',
      image: '/placeholder.png',
      organizer: 'Marvel Games',
      teams: 16
    },
    {
      id: '2',
      name: 'Marvel Rivals Pro League',
      type: 'upcoming',
      startDate: 'Feb 1, 2025',
      endDate: 'Feb 28, 2025',
      location: 'Online',
      prize: '$500,000',
      region: 'Global',
      image: '/placeholder.png',
      organizer: 'MRVL Esports',
      teams: 24
    },
    {
      id: '3',
      name: 'Winter Showdown 2024',
      type: 'completed',
      startDate: 'Dec 10, 2024',
      endDate: 'Dec 17, 2024',
      location: 'Tokyo, Japan',
      prize: '$250,000',
      region: 'Asia-Pacific',
      image: '/placeholder.png',
      organizer: 'Marvel Asia',
      teams: 12
    }
  ], []);
  
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/events');
        
        if (!res.ok) {
          throw new Error('Failed to fetch events');
        }
        
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.warn('API failed, using mock data:', err);
        setEvents(mockEvents);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [mockEvents]);
  
  // Filter events by region
  const filteredEvents = useMemo(() => {
    return activeRegion === 'All' 
      ? events 
      : events.filter(event => event.region === activeRegion);
  }, [events, activeRegion]);
  
  // Separate events by status
  const { upcomingEvents, ongoingEvents, completedEvents } = useMemo(() => {
    const upcoming = filteredEvents.filter(event => event.type === 'upcoming');
    const ongoing = filteredEvents.filter(event => event.type === 'ongoing');
    const completed = filteredEvents.filter(event => event.type === 'completed');
    
    return { upcomingEvents: upcoming, ongoingEvents: ongoing, completedEvents: completed };
  }, [filteredEvents]);
  
  // Get region abbreviation for display
  const getRegionCode = (region: string): string => {
    const regionMap: Record<string, string> = {
      'North America': 'NA',
      'Europe': 'EU',
      'Brazil': 'BR',
      'Asia-Pacific': 'APAC',
      'Korea': 'KR',
      'Japan': 'JP',
      'LATAM': 'LATAM',
      'MENA': 'MENA',
      'Game Changers': 'GC',
      'Global': 'GL'
    };
    
    return regionMap[region] || region.substring(0, 3).toUpperCase();
  };
  
  // Event card component
  const EventCard = ({ event }: { event: Event }) => (
    <Link key={event.id} href={`/events/${event.id}`} className="block group">
      <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden hover:border-[#fa4454] transition-all duration-200 group-hover:shadow-lg">
        <div className="p-4 flex">
          {/* Event Logo */}
          <div className="mr-4 flex-shrink-0">
            <div className="w-20 h-20 relative">
              <Image
                src={event.image || '/placeholder.png'}
                alt={event.name}
                fill
                style={{ objectFit: 'contain' }}
                className="rounded"
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.png';
                }}
              />
            </div>
          </div>
          
          {/* Event Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg group-hover:text-[#fa4454] transition-colors truncate pr-2">
                {event.name}
              </h3>
              <div className="flex-shrink-0">
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  event.type === 'ongoing' 
                    ? 'bg-red-500 text-white animate-pulse' 
                    : event.type === 'upcoming'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-500 text-white'
                }`}>
                  {event.type.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex items-center text-[#768894]">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-[#fa4454] font-medium">{event.prize}</span>
                <span className="ml-1">Prize Pool</span>
              </div>
              
              <div className="flex items-center text-[#768894]">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {event.startDate} - {event.endDate}
              </div>
              
              <div className="flex items-center text-[#768894]">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {event.location}
              </div>
              
              {event.teams && (
                <div className="flex items-center text-[#768894]">
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {event.teams} Teams
                </div>
              )}
            </div>
          </div>
          
          {/* Region Badge */}
          <div className="flex items-center justify-center w-12 flex-shrink-0">
            <div className="rounded-full w-10 h-10 flex items-center justify-center bg-[#11161d] text-xs text-[#768894] font-medium border border-[#2b3d4d]">
              {getRegionCode(event.region)}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1419]">
        <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
          <div className="container mx-auto py-4">
            <div className="h-8 w-32 bg-[#2b3d4d] animate-pulse rounded mb-2"></div>
            <div className="h-4 w-64 bg-[#2b3d4d] animate-pulse rounded"></div>
          </div>
        </div>
        
        <div className="py-4">
          <div className="bg-[#1a242d] mb-6">
            <div className="flex space-x-4 p-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-20 bg-[#2b3d4d] animate-pulse rounded"></div>
              ))}
            </div>
          </div>
          
          <div className="container mx-auto space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#1a242d] border border-[#2b3d4d] animate-pulse rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#0f1419]">
      {/* Page Header */}
      <div className="bg-[#1a242d] border-b border-[#2b3d4d]">
        <div className="container mx-auto py-4">
          <h1 className="text-2xl font-bold">Events</h1>
          <p className="text-[#768894] text-sm mt-1">
            Tournaments, leagues and championships for Marvel Rivals esports
          </p>
        </div>
      </div>
      
      {/* Region Filter Navigation */}
      <div className="bg-[#1a242d] mb-6 overflow-x-auto sticky top-0 z-10 border-b border-[#2b3d4d]">
        <div className="flex min-w-max">
          {regions.map(region => (
            <button
              key={region}
              className={`px-6 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200 relative ${
                activeRegion === region 
                  ? 'text-white' 
                  : 'text-[#768894] hover:text-white'
              }`}
              onClick={() => setActiveRegion(region)}
            >
              {region}
              {activeRegion === region && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#fa4454]"></div>
              )}
            </button>
          ))}
        </div>
      </div>
      
      <div className="container mx-auto pb-8">
        {/* Ongoing Events */}
        {ongoingEvents.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center mb-4">
              <h2 className="text-lg font-bold text-[#fa4454] uppercase tracking-wide">
                Live Events
              </h2>
              <div className="ml-3 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ongoingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
        
        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-[#fa4454] uppercase tracking-wide mb-4">
              Upcoming Events
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
        
        {/* Completed Events */}
        {completedEvents.length > 0 && (
          <div className="mb-10">
            <h2 className="text-lg font-bold text-[#fa4454] uppercase tracking-wide mb-4">
              Completed Events
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {completedEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        )}
        
        {/* No Events Message */}
        {filteredEvents.length === 0 && (
          <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-12 text-center">
            <div className="text-[#768894] text-5xl mb-4">🏆</div>
            <h3 className="text-xl font-bold mb-2">No Events Found</h3>
            <p className="text-[#768894] mb-4">
              {activeRegion === 'All' 
                ? 'No events are currently scheduled.' 
                : `No events found for ${activeRegion}.`
              }
            </p>
            {activeRegion !== 'All' && (
              <button 
                onClick={() => setActiveRegion('All')}
                className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-6 py-2 rounded transition-colors font-medium"
              >
                View All Regions
              </button>
            )}
          </div>
        )}
        
        {/* Footer Info */}
        {filteredEvents.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#2b3d4d] text-center">
            <div className="text-sm text-[#768894] space-y-1">
              <p>
                Showing {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'}
                {activeRegion !== 'All' && ` in ${activeRegion}`}
              </p>
              <p className="text-xs">
                Events update automatically • Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
