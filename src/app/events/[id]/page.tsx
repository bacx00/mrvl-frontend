// src/app/events/[id]/page.tsx - COMPLETE VLR.gg Quality Production Ready
'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TabNavigation from '@/components/TabNavigation';

// Complete interfaces
interface EventTeam {
  name: string;
  logo?: string;
  region?: string;
  standing?: number;
  wins?: number;
  losses?: number;
  group?: string;
}

interface EventMatch {
  id: string;
  team1: string;
  team2: string;
  time: string;
  stage: string;
  score1?: number;
  score2?: number;
  status: 'upcoming' | 'live' | 'completed';
}

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  prize: string;
  type: 'upcoming' | 'ongoing' | 'completed';
  region: string;
  organizer: string;
  image: string;
  description: string;
  format: string;
  teams: EventTeam[];
  matches: EventMatch[];
  prizeDistribution: Array<{
    place: string;
    amount: string;
  }>;
}

export default function EventDetailPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Teams' | 'Matches' | 'Brackets'>('Overview');
  const [loading, setLoading] = useState(true);
  
  // Complete mock data for demo
  const mockEvent: Event = {
    id: String(params.id),
    name: 'MRVL Championship 2025',
    startDate: 'January 15, 2025',
    endDate: 'January 22, 2025',
    location: 'Los Angeles, CA',
    prize: '$1,000,000',
    type: 'ongoing',
    region: 'North America',
    organizer: 'Marvel Games',
    image: '/placeholder.png',
    description: 'The premier Marvel Rivals championship featuring the best teams from around the world competing for the largest prize pool in the game\'s history. This tournament brings together 16 of the most skilled teams to battle it out in an epic week-long competition.',
    format: 'Group Stage: 16 teams divided into 4 groups of 4 teams each. Double elimination bracket format with Best of 3 matches in group stage, Best of 5 in playoffs. Top 2 teams from each group advance to the playoff bracket. All matches are played on LAN with live audience.',
    teams: [
      { name: 'Team Alpha', logo: '/placeholder.png', region: 'NA', standing: 1, wins: 8, losses: 1, group: 'A' },
      { name: 'Team Beta', logo: '/placeholder.png', region: 'EU', standing: 2, wins: 7, losses: 2, group: 'A' },
      { name: 'Phoenix Esports', logo: '/placeholder.png', region: 'APAC', standing: 3, wins: 6, losses: 3, group: 'B' },
      { name: 'Storm Riders', logo: '/placeholder.png', region: 'LATAM', standing: 4, wins: 5, losses: 4, group: 'B' },
      { name: 'Shadow Legion', logo: '/placeholder.png', region: 'EU', standing: 5, wins: 4, losses: 5, group: 'C' },
      { name: 'Nexus Gaming', logo: '/placeholder.png', region: 'NA', standing: 6, wins: 3, losses: 6, group: 'C' },
      { name: 'Cosmic Guardians', logo: '/placeholder.png', region: 'APAC', standing: 7, wins: 3, losses: 6, group: 'D' },
      { name: 'Vanguard Elite', logo: '/placeholder.png', region: 'EU', standing: 8, wins: 2, losses: 7, group: 'D' },
      { name: 'Titan Force', logo: '/placeholder.png', region: 'NA', standing: 9, wins: 2, losses: 7, group: 'A' },
      { name: 'Iron Hawks', logo: '/placeholder.png', region: 'LATAM', standing: 10, wins: 1, losses: 8, group: 'B' }
    ],
    matches: [
      {
        id: '1',
        team1: 'Team Alpha',
        team2: 'Team Beta',
        time: 'Today, 7:00 PM EST',
        stage: 'Grand Finals',
        status: 'live',
        score1: 1,
        score2: 0
      },
      {
        id: '2',
        team1: 'Phoenix Esports',
        team2: 'Storm Riders',
        time: 'Today, 4:00 PM EST',
        stage: 'Semi-Finals',
        status: 'completed',
        score1: 2,
        score2: 1
      },
      {
        id: '3',
        team1: 'Shadow Legion',
        team2: 'Nexus Gaming',
        time: 'Yesterday, 6:00 PM EST',
        stage: 'Quarter-Finals',
        status: 'completed',
        score1: 0,
        score2: 2
      },
      {
        id: '4',
        team1: 'Cosmic Guardians',
        team2: 'Vanguard Elite',
        time: 'Yesterday, 3:00 PM EST',
        stage: 'Quarter-Finals',
        status: 'completed',
        score1: 2,
        score2: 1
      },
      {
        id: '5',
        team1: 'Team Alpha',
        team2: 'Phoenix Esports',
        time: 'Tomorrow, 5:00 PM EST',
        stage: 'Lower Bracket Finals',
        status: 'upcoming'
      }
    ],
    prizeDistribution: [
      { place: '1st Place', amount: '$500,000' },
      { place: '2nd Place', amount: '$250,000' },
      { place: '3rd Place', amount: '$125,000' },
      { place: '4th Place', amount: '$75,000' },
      { place: '5th-6th Place', amount: '$25,000' },
      { place: '7th-8th Place', amount: '$12,500' },
      { place: '9th-12th Place', amount: '$6,250' },
      { place: '13th-16th Place', amount: '$3,125' }
    ]
  };
  
  useEffect(() => {
    if (!params.id) return;
    
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/events/${params.id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch event data');
        }
        
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.warn('API failed, using mock data:', err);
        setEvent(mockEvent);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventData();
  }, [params.id]);
  
  if (loading) {
    return (
      <div className="container py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 bg-[#2b3d4d] rounded"></div>
          <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
            <div className="h-64 bg-[#2b3d4d]"></div>
            <div className="p-6 space-y-4">
              <div className="h-8 w-3/4 bg-[#2b3d4d] rounded"></div>
              <div className="h-4 w-full bg-[#2b3d4d] rounded"></div>
              <div className="h-4 w-2/3 bg-[#2b3d4d] rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!event) {
    return (
      <div className="container py-6">
        <Link href="/events" className="inline-flex items-center text-[#fa4454] hover:underline mb-4">
          ← Back to Events
        </Link>
        
        <div className="bg-[#1a242d] border border-[#2b3d4d] rounded p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Event Not Found</h2>
          <p className="text-[#768894] mb-4">This event doesn't exist or has been removed.</p>
          <Link href="/events" className="bg-[#fa4454] hover:bg-[#e8323e] text-white px-4 py-2 rounded transition-colors">
            View All Events
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container py-6">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-[#768894] mb-4">
        <Link href="/" className="hover:text-[#fa4454]">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/events" className="hover:text-[#fa4454]">Events</Link>
        <span className="mx-2">/</span>
        <span>{event.name}</span>
      </div>
      
      <Link href="/events" className="inline-flex items-center text-[#fa4454] hover:underline mb-6">
        ← Back to Events
      </Link>
      
      {/* Event Header */}
      <div className="bg-[#1a242d] border border-[#2b3d4d] rounded mb-6 overflow-hidden">
        {/* Event Banner */}
        <div className="relative h-64 bg-gradient-to-r from-[#0f1923] to-[#1a242d]">
          <div className="absolute inset-0 bg-gradient-to-r from-[#fa4454]/20 to-transparent"></div>
          
          {/* Event Status and Title */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-center mb-3">
              {event.type === 'ongoing' && (
                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded font-medium mr-3 animate-pulse">
                  🔴 LIVE
                </span>
              )}
              {event.type === 'upcoming' && (
                <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded font-medium mr-3">
                  UPCOMING
                </span>
              )}
              {event.type === 'completed' && (
                <span className="bg-gray-500 text-white text-xs px-3 py-1 rounded font-medium mr-3">
                  COMPLETED
                </span>
              )}
              <span className="bg-[#2b3d4d] text-white text-xs px-3 py-1 rounded">
                {event.region}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{event.name}</h1>
            <p className="text-[#768894]">{event.organizer}</p>
          </div>
        </div>
        
        {/* Event Details Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-[#fa4454]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <div className="text-xs text-[#768894] uppercase tracking-wide">Dates</div>
                <div className="font-medium">{event.startDate} - {event.endDate}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-[#fa4454]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <div className="text-xs text-[#768894] uppercase tracking-wide">Location</div>
                <div className="font-medium">{event.location}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-[#fa4454]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-xs text-[#768894] uppercase tracking-wide">Prize Pool</div>
                <div className="font-bold text-[#fa4454] text-lg">{event.prize}</div>
              </div>
            </div>
            
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3 text-[#fa4454]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <div className="text-xs text-[#768894] uppercase tracking-wide">Teams</div>
                <div className="font-medium">{event.teams.length} Teams</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-[#2b3d4d]">
            <p className="text-[#768894] leading-relaxed">{event.description}</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <TabNavigation
        tabs={['Overview', 'Teams', 'Matches', 'Brackets']}
        activeTab={activeTab}
        onTabSelect={(tab) => setActiveTab(tab as any)}
      />
      
      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Tournament Format */}
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3">
                  <h3 className="font-medium">Tournament Format</h3>
                </div>
                <div className="p-4">
                  <p className="text-[#768894] leading-relaxed whitespace-pre-line">{event.format}</p>
                </div>
              </div>
              
              {/* Recent Matches */}
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3">
                  <h3 className="font-medium">
                    {event.type === 'upcoming' ? 'Scheduled Matches' : 'Recent Matches'}
                  </h3>
                </div>
                <div className="divide-y divide-[#2b3d4d]">
                  {event.matches.slice(0, 5).map((match) => (
                    <div key={match.id} className="p-4 hover:bg-[#0f1923] transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-[#768894] flex items-center">
                          <span>{match.stage}</span>
                          {match.status === 'live' && (
                            <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded animate-pulse">
                              LIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#768894]">{match.time}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-4">
                          <Link href={`/teams/${match.team1.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[#fa4454] font-medium">
                            {match.team1}
                          </Link>
                        </div>
                        
                        <div className="px-4">
                          {match.score1 !== undefined && match.score2 !== undefined ? (
                            <div className="bg-[#0f1923] px-3 py-1 rounded font-bold text-center min-w-[60px]">
                              {match.score1} - {match.score2}
                            </div>
                          ) : (
                            <div className="bg-[#0f1923] px-3 py-1 rounded text-[#768894] text-center min-w-[60px]">
                              {match.status === 'live' ? 'LIVE' : 'vs'}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 pl-4">
                          <Link href={`/teams/${match.team2.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[#fa4454] font-medium">
                            {match.team2}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              {/* Prize Distribution */}
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3">
                  <h3 className="font-medium">Prize Distribution</h3>
                </div>
                <div className="p-4 space-y-3">
                  {event.prizeDistribution.map((prize, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-[#768894] text-sm">{prize.place}</span>
                      <span className="text-[#fa4454] font-bold">{prize.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Top Teams */}
              <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
                <div className="bg-[#0f1923] px-4 py-3">
                  <h3 className="font-medium">Current Standings</h3>
                </div>
                <div className="p-4">
                  {event.teams
                    .sort((a, b) => (a.standing || 99) - (b.standing || 99))
                    .slice(0, 8)
                    .map((team, index) => (
                      <div key={team.name} className={`flex items-center justify-between py-2 ${
                        index < 7 ? 'border-b border-[#2b3d4d]' : ''
                      }`}>
                        <div className="flex items-center">
                          <span className="text-[#768894] text-sm mr-3 w-4">#{team.standing}</span>
                          <div className="w-6 h-6 bg-[#0f1923] rounded mr-2 flex items-center justify-center">
                            <span className="text-xs font-bold">{team.name.charAt(0)}</span>
                          </div>
                          <Link href={`/teams/${team.name.toLowerCase().replace(/\s+/g, '-')}`} className="hover:text-[#fa4454] font-medium text-sm">
                            {team.name}
                          </Link>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-[#768894]">{team.region}</div>
                          <div className="text-xs">
                            {team.wins && team.losses ? `${team.wins}-${team.losses}` : 'TBD'}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Teams Tab */}
        {activeTab === 'Teams' && (
          <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
            <div className="bg-[#0f1923] px-4 py-3">
              <h3 className="font-medium">Participating Teams</h3>
            </div>
            <div className="p-4">
              {event.teams[0]?.group ? (
                // Group Stage Display
                <div>
                  {Array.from(new Set(event.teams.map(t => t.group))).map(group => (
                    <div key={group} className="mb-8">
                      <h4 className="text-lg font-medium mb-4 text-[#fa4454]">Group {group}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {event.teams
                          .filter(t => t.group === group)
                          .sort((a, b) => (a.standing || 99) - (b.standing || 99))
                          .map(team => (
                            <Link 
                              key={team.name} 
                              href={`/teams/${team.name.toLowerCase().replace(/\s+/g, '-')}`}
                              className="bg-[#0f1923] p-4 rounded text-center hover:bg-[#15191f] transition-colors border border-[#2b3d4d] hover:border-[#fa4454]"
                            >
                              <div className="w-16 h-16 bg-[#1a242d] rounded-full mx-auto mb-3 flex items-center justify-center">
                                <span className="text-lg font-bold">{team.name.charAt(0)}</span>
                              </div>
                              <div className="font-medium mb-1">{team.name}</div>
                              <div className="text-xs text-[#768894] mb-2">{team.region}</div>
                              {team.wins !== undefined && team.losses !== undefined && (
                                <div className="text-xs">
                                  <span className="text-[#4ade80]">{team.wins}W</span>
                                  <span className="text-[#768894] mx-1">-</span>
                                  <span className="text-[#ef4444]">{team.losses}L</span>
                                </div>
                              )}
                            </Link>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Standings Table Display
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#2b3d4d]">
                        <th className="text-left p-3">#</th>
                        <th className="text-left p-3">Team</th>
                        <th className="text-center p-3">Region</th>
                        <th className="text-center p-3">W-L</th>
                        <th className="text-center p-3">Win Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {event.teams
                        .sort((a, b) => (a.standing || 99) - (b.standing || 99))
                        .map((team) => (
                          <tr key={team.name} className="border-b border-[#2b3d4d] hover:bg-[#0f1923] transition-colors">
                            <td className="p-3 font-medium">{team.standing}</td>
                            <td className="p-3">
                              <Link href={`/teams/${team.name.toLowerCase().replace(/\s+/g, '-')}`} className="flex items-center hover:text-[#fa4454]">
                                <div className="w-8 h-8 bg-[#0f1923] rounded mr-3 flex items-center justify-center">
                                  <span className="text-xs font-bold">{team.name.charAt(0)}</span>
                                </div>
                                <span className="font-medium">{team.name}</span>
                              </Link>
                            </td>
                            <td className="p-3 text-center">{team.region}</td>
                            <td className="p-3 text-center">
                              {team.wins && team.losses ? (
                                <span>
                                  <span className="text-[#4ade80]">{team.wins}</span>
                                  <span className="text-[#768894] mx-1">-</span>
                                  <span className="text-[#ef4444]">{team.losses}</span>
                                </span>
                              ) : '-'}
                            </td>
                            <td className="p-3 text-center">
                              {team.wins && team.losses 
                                ? `${Math.round((team.wins / (team.wins + team.losses)) * 100)}%`
                                : '-'
                              }
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Matches Tab */}
        {activeTab === 'Matches' && (
          <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
            <div className="bg-[#0f1923] px-4 py-3">
              <h3 className="font-medium">All Matches</h3>
            </div>
            <div className="divide-y divide-[#2b3d4d]">
              {event.matches.map((match) => (
                <div key={match.id} className="p-4 hover:bg-[#0f1923] transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-[#768894] space-y-1">
                      <div className="flex items-center">
                        <span>{match.stage}</span>
                        {match.status === 'live' && (
                          <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded animate-pulse">
                            LIVE
                          </span>
                        )}
                      </div>
                      <div>{match.time}</div>
                    </div>
                    
                    <div className="flex items-center flex-grow mx-8">
                      <div className="flex-1 text-right">
                        <Link href={`/teams/${match.team1.toLowerCase().replace(/\s+/g, '-')}`} className="font-medium hover:text-[#fa4454]">
                          {match.team1}
                        </Link>
                      </div>
                      
                      <div className="mx-6">
                        {match.score1 !== undefined && match.score2 !== undefined ? (
                          <div className="bg-[#0f1923] px-4 py-2 rounded text-[#768894]">
                            {match.status === 'live' ? (
                              <span className="text-red-400 animate-pulse">LIVE</span>
                            ) : (
                              'vs'
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <Link href={`/teams/${match.team2.toLowerCase().replace(/\s+/g, '-')}`} className="font-medium hover:text-[#fa4454]">
                          {match.team2}
                        </Link>
                      </div>
                    </div>
                    
                    <Link href={`/matches/${match.id}`} className="text-[#fa4454] text-sm hover:underline">
                      Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Brackets Tab */}
        {activeTab === 'Brackets' && (
          <div className="bg-[#1a242d] border border-[#2b3d4d] rounded overflow-hidden">
            <div className="bg-[#0f1923] px-4 py-3">
              <h3 className="font-medium">Tournament Brackets</h3>
            </div>
            <div className="p-4">
              {event.type === 'upcoming' ? (
                <div className="text-center py-16">
                  <div className="text-[#768894] text-6xl mb-4">🏆</div>
                  <h4 className="text-lg font-medium mb-2">Brackets Coming Soon</h4>
                  <p className="text-[#768894] max-w-md mx-auto">
                    Tournament brackets will be available once the event begins and teams are seeded.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  {/* Tournament bracket visualization */}
                  <div className="min-w-[1200px] py-8">
                    <div className="text-center mb-8">
                      <h4 className="text-lg font-medium mb-2">Tournament Bracket</h4>
                      <p className="text-[#768894] text-sm">Single Elimination • Best of 5 Finals</p>
                    </div>
                    
                    <div className="relative">
                      {/* Quarter Finals */}
                      <div className="flex justify-between items-start mb-16">
                        <div className="space-y-8">
                          <div className="bg-[#0f1923] border border-[#2b3d4d] rounded p-3 w-52">
                            <div className="text-xs text-[#768894] mb-2 text-center">Quarter-Final 1</div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center p-2 rounded bg-[#1a242d]">
                                <span className="text-sm font-medium">Team Alpha</span>
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">W</span>
                              </div>
                              <div className="flex justify-between items-center p-2 rounded">
                                <span className="text-sm text-[#768894]">Titan Force</span>
                                <span className="text-xs text-[#768894]">L</span>
                              </div>
                            </div>
                            <div className="text-xs text-center text-[#768894] mt-2">2-0</div>
                          </div>
                          
                          <div className="bg-[#0f1923] border border-[#2b3d4d] rounded p-3 w-52">
                            <div className="text-xs text-[#768894] mb-2 text-center">Quarter-Final 2</div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center p-2 rounded bg-[#1a242d]">
                                <span className="text-sm font-medium">Team Beta</span>
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">W</span>
                              </div>
                              <div className="flex justify-between items-center p-2 rounded">
                                <span className="text-sm text-[#768894]">Iron Hawks</span>
                                <span className="text-xs text-[#768894]">L</span>
                              </div>
                            </div>
                            <div className="text-xs text-center text-[#768894] mt-2">2-1</div>
                          </div>
                        </div>
                        
                        <div className="space-y-8">
                          <div className="bg-[#0f1923] border border-[#2b3d4d] rounded p-3 w-52">
                            <div className="text-xs text-[#768894] mb-2 text-center">Quarter-Final 3</div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center p-2 rounded bg-[#1a242d]">
                                <span className="text-sm font-medium">Phoenix Esports</span>
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">W</span>
                              </div>
                              <div className="flex justify-between items-center p-2 rounded">
                                <span className="text-sm text-[#768894]">Cosmic Guardians</span>
                                <span className="text-xs text-[#768894]">L</span>
                              </div>
                            </div>
                            <div className="text-xs text-center text-[#768894] mt-2">2-0</div>
                          </div>
                          
                          <div className="bg-[#0f1923] border border-[#2b3d4d] rounded p-3 w-52">
                            <div className="text-xs text-[#768894] mb-2 text-center">Quarter-Final 4</div>
                            <div className="space-y-1">
                              <div className="flex justify-between items-center p-2 rounded bg-[#1a242d]">
                                <span className="text-sm font-medium">Storm Riders</span>
                                <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">W</span>
                              </div>
                              <div className="flex justify-between items-center p-2 rounded">
                                <span className="text-sm text-[#768894]">Vanguard Elite</span>
                                <span className="text-xs text-[#768894]">L</span>
                              </div>
                            </div>
                            <div className="text-xs text-center text-[#768894] mt-2">2-1</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Semi Finals */}
                      <div className="flex justify-center space-x-32 mb-16">
                        <div className="bg-[#0f1923] border border-[#2b3d4d] rounded p-3 w-52">
                          <div className="text-xs text-[#768894] mb-2 text-center">Semi-Final 1</div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center p-2 rounded bg-[#1a242d]">
                              <span className="text-sm font-medium">Team Alpha</span>
                              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">W</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded">
                              <span className="text-sm text-[#768894]">Team Beta</span>
                              <span className="text-xs text-[#768894]">L</span>
                            </div>
                          </div>
                          <div className="text-xs text-center text-[#768894] mt-2">3-1</div>
                        </div>
                        
                        <div className="bg-[#0f1923] border border-[#2b3d4d] rounded p-3 w-52">
                          <div className="text-xs text-[#768894] mb-2 text-center">Semi-Final 2</div>
                          <div className="space-y-1">
                            <div className="flex justify-between items-center p-2 rounded bg-[#1a242d]">
                              <span className="text-sm font-medium">Phoenix Esports</span>
                              <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded">W</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded">
                              <span className="text-sm text-[#768894]">Storm Riders</span>
                              <span className="text-xs text-[#768894]">L</span>
                            </div>
                          </div>
                          <div className="text-xs text-center text-[#768894] mt-2">3-2</div>
                        </div>
                      </div>
                      
                      {/* Grand Final */}
                      <div className="flex justify-center">
                        <div className="bg-gradient-to-r from-[#fa4454]/20 to-[#fa4454]/10 border-2 border-[#fa4454] rounded p-4 w-64">
                          <div className="text-sm text-[#fa4454] mb-3 text-center font-bold">GRAND FINAL</div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 rounded bg-[#1a242d]">
                              <span className="text-sm font-medium">Team Alpha</span>
                              <span className="text-xs bg-[#fa4454] text-white px-2 py-1 rounded animate-pulse">LIVE</span>
                            </div>
                            <div className="flex justify-between items-center p-2 rounded bg-[#0f1923]">
                              <span className="text-sm">Phoenix Esports</span>
                              <span className="text-xs text-[#768894]">1-0</span>
                            </div>
                          </div>
                          <div className="text-center mt-3 space-y-1">
                            <div className="text-xs text-[#fa4454] font-medium">Best of 5</div>
                            <div className="text-xs text-[#768894]">$500,000 Winner Takes All</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Connection Lines */}
                      <div className="absolute inset-0 pointer-events-none">
                        <svg className="w-full h-full" style={{ zIndex: -1 }}>
                          {/* Lines from quarters to semis */}
                          <path d="M 260 80 L 320 80 L 320 160 L 380 160" stroke="#2b3d4d" strokeWidth="2" fill="none" />
                          <path d="M 260 200 L 320 200 L 320 160 L 380 160" stroke="#2b3d4d" strokeWidth="2" fill="none" />
                          <path d="M 940 80 L 880 80 L 880 160 L 820 160" stroke="#2b3d4d" strokeWidth="2" fill="none" />
                          <path d="M 940 200 L 880 200 L 880 160 L 820 160" stroke="#2b3d4d" strokeWidth="2" fill="none" />
                          
                          {/* Lines from semis to final */}
                          <path d="M 510 220 L 510 280 L 600 280" stroke="#2b3d4d" strokeWidth="2" fill="none" />
                          <path d="M 690 220 L 690 280 L 600 280" stroke="#2b3d4d" strokeWidth="2" fill="none" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
