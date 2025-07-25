// src/components/Sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { formatDate, formatNumber } from '@/lib/utils';
import { ROUTES } from '@/lib/constants';

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface TrendingThread {
  id: string;
  title: string;
  author: string;
  replies: number;
  lastActivity: string;
  category: string;
}

interface TopTeam {
  id: string;
  name: string;
  logo?: string;
  rank: number;
  points: number;
  region: string;
  change: number;
}

interface UserActivity {
  id: string;
  type: 'post' | 'match' | 'event';
  title: string;
  url: string;
  timestamp: string;
}

export default function Sidebar({ 
  className = '', 
  collapsed = false, 
  onToggleCollapse 
}: SidebarProps) {
  const [trendingThreads, setTrendingThreads] = useState<TrendingThread[]>([]);
  const [topTeams, setTopTeams] = useState<TopTeam[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>('trending');
  
  const { user } = useAuth();

  // Fetch sidebar data
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setIsLoading(true);

        // Fetch trending threads
        const trendingRes = await fetch('/api/forums/trending?limit=8');
        if (trendingRes.ok) {
          const trending = await trendingRes.json();
          setTrendingThreads(trending);
        } else {
          // Fallback mock data
          setTrendingThreads([
            {
              id: '1',
              title: 'Best Thor builds for ranked play',
              author: 'ProGamer',
              replies: 156,
              lastActivity: new Date().toISOString(),
              category: 'Competitive'
            },
            {
              id: '2', 
              title: 'Patch 1.2.0 discussion thread',
              author: 'ModTeam',
              replies: 89,
              lastActivity: new Date(Date.now() - 3600000).toISOString(),
              category: 'Patch Notes'
            },
            {
              id: '3',
              title: 'LFG: Diamond+ players for scrims',
              author: 'TeamCaptain',
              replies: 23,
              lastActivity: new Date(Date.now() - 7200000).toISOString(),
              category: 'Team Recruitment'
            },
            {
              id: '4',
              title: 'Iron Man vs Doctor Doom matchup guide',
              author: 'StrategyGuru',
              replies: 67,
              lastActivity: new Date(Date.now() - 10800000).toISOString(),
              category: 'Guides'
            }
          ]);
        }

        // Fetch top teams
        const teamsRes = await fetch('/api/rankings?limit=8');
        if (teamsRes.ok) {
          const teams = await teamsRes.json();
          setTopTeams(teams);
        } else {
          // Fallback mock data
          setTopTeams([
            { id: '1', name: 'Sentinels', rank: 1, points: 2450, region: 'Americas', change: 2 },
            { id: '2', name: 'Fnatic', rank: 2, points: 2380, region: 'EMEA', change: -1 },
            { id: '3', name: 'Paper Rex', rank: 3, points: 2320, region: 'APAC', change: 1 },
            { id: '4', name: 'LOUD', rank: 4, points: 2280, region: 'Americas', change: 0 },
            { id: '5', name: 'OpTic Gaming', rank: 5, points: 2240, region: 'Americas', change: 3 }
          ]);
        }

        // Fetch user activity if logged in
        if (user) {
          const activityRes = await fetch('/api/user/activity?limit=5');
          if (activityRes.ok) {
            const activity = await activityRes.json();
            setUserActivity(activity);
          }
        }

      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSidebarData();
  }, [user]);

  if (collapsed) {
    return (
      <div className={`w-16 ${className}`}>
        <div className="sticky top-20 space-y-4">
          <button
            onClick={onToggleCollapse}
            className="w-12 h-12 bg-[#1a2332] border border-[#2b3d4d] rounded-lg flex items-center justify-center text-[#768894] hover:text-white hover:bg-[#20303d] transition-colors"
            aria-label="Expand sidebar"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <aside className={`w-80 ${className}`}>
      <div className="sticky top-20 space-y-6">
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Community Hub</h2>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1 text-[#768894] hover:text-white transition-colors"
              aria-label="Collapse sidebar"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-1">
          <SidebarTab
            id="trending"
            label="Trending"
            active={activeSection === 'trending'}
            onClick={() => setActiveSection('trending')}
          />
          <SidebarTab
            id="rankings"
            label="Rankings"
            active={activeSection === 'rankings'}
            onClick={() => setActiveSection('rankings')}
          />
          {user && (
            <SidebarTab
              id="activity"
              label="Activity"
              active={activeSection === 'activity'}
              onClick={() => setActiveSection('activity')}
            />
          )}
        </div>

        {/* Content Sections */}
        {isLoading ? (
          <SidebarSkeleton />
        ) : (
          <>
            {/* Trending Discussions */}
            {activeSection === 'trending' && (
              <SidebarSection
                title="Trending Discussions"
                viewAllLink={ROUTES.FORUMS}
                viewAllText="View Forums"
              >
                <div className="space-y-3">
                  {trendingThreads.map((thread) => (
                    <TrendingThreadItem key={thread.id} thread={thread} />
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* Team Rankings */}
            {activeSection === 'rankings' && (
              <SidebarSection
                title="Team Rankings"
                viewAllLink={ROUTES.RANKINGS}
                viewAllText="View All Rankings"
              >
                <div className="space-y-2">
                  {topTeams.map((team) => (
                    <TeamRankingItem key={team.id} team={team} />
                  ))}
                </div>
              </SidebarSection>
            )}

            {/* User Activity */}
            {activeSection === 'activity' && user && (
              <SidebarSection
                title="Recent Activity"
                viewAllLink="/user/activity"
                viewAllText="View All Activity"
              >
                {userActivity.length > 0 ? (
                  <div className="space-y-3">
                    {userActivity.map((activity) => (
                      <UserActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[#768894] text-sm">
                    <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                    <p>No recent activity</p>
                    <p className="text-xs mt-1">Start engaging with the community!</p>
                  </div>
                )}
              </SidebarSection>
            )}
          </>
        )}

        {/* Popular Topics */}
        <SidebarSection title="Popular Topics">
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Meta Discussion', count: '1.2K' },
              { name: 'Team Comps', count: '890' },
              { name: 'Thor Guide', count: '756' },
              { name: 'Patch Analysis', count: '634' },
              { name: 'Pro Matches', count: '523' },
              { name: 'Ranked Tips', count: '445' }
            ].map((topic) => (
              <Link
                key={topic.name}
                href={`/forums/search?q=${encodeURIComponent(topic.name)}`}
                className="p-2 bg-[#1a2332] border border-[#2b3d4d] rounded text-center hover:bg-[#20303d] hover:border-[#fa4454] transition-colors group"
              >
                <div className="text-xs font-medium text-white group-hover:text-[#fa4454]">
                  {topic.name}
                </div>
                <div className="text-xs text-[#768894] mt-1">
                  {topic.count} posts
                </div>
              </Link>
            ))}
          </div>
        </SidebarSection>

        {/* Quick Actions */}
        {user && (
          <SidebarSection title="Quick Actions">
            <div className="space-y-2">
              <QuickActionButton
                href="/forums/new-thread"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
                text="New Thread"
              />
              <QuickActionButton
                href="/events/create"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                }
                text="Create Event"
              />
              <QuickActionButton
                href="/teams/register"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
                text="Register Team"
              />
            </div>
          </SidebarSection>
        )}

        {/* Ad Space */}
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-4 text-center">
          <div className="text-xs text-[#768894] mb-2">Advertisement</div>
          <div className="bg-[#0f1419] border border-[#2b3d4d] rounded p-8 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[#768894] text-sm">Ad Space</div>
              <div className="text-xs text-[#768894] mt-1">320x200</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

// Sidebar Tab Component
function SidebarTab({ 
  id, 
  label, 
  active, 
  onClick 
}: {
  id: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-2 px-3 text-xs font-medium rounded transition-colors ${
        active 
          ? 'bg-[#fa4454] text-white' 
          : 'text-[#768894] hover:text-white hover:bg-[#20303d]'
      }`}
    >
      {label}
    </button>
  );
}

// Sidebar Section Component
function SidebarSection({ 
  title, 
  children, 
  viewAllLink, 
  viewAllText 
}: {
  title: string;
  children: React.ReactNode;
  viewAllLink?: string;
  viewAllText?: string;
}) {
  return (
    <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg">
      <div className="flex items-center justify-between p-3 border-b border-[#2b3d4d]">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {viewAllLink && (
          <Link 
            href={viewAllLink}
            className="text-xs text-[#fa4454] hover:underline"
          >
            {viewAllText}
          </Link>
        )}
      </div>
      <div className="p-3">
        {children}
      </div>
    </div>
  );
}

// Trending Thread Item Component
function TrendingThreadItem({ thread }: { thread: TrendingThread }) {
  return (
    <Link 
      href={`/forums/${thread.category.toLowerCase().replace(/\s+/g, '-')}/${thread.id}`}
      className="block hover:bg-[#20303d] p-2 rounded transition-colors group"
    >
      <div className="flex items-start space-x-3">
        <div className="w-2 h-2 bg-[#fa4454] rounded-full mt-2 flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white group-hover:text-[#fa4454] line-clamp-2">
            {thread.title}
          </h4>
          <div className="flex items-center justify-between text-xs text-[#768894] mt-1">
            <span>by {thread.author}</span>
            <span>{formatNumber(thread.replies)} replies</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#768894] mt-1">
            <span className="px-1.5 py-0.5 bg-[#0f1419] rounded text-xs">
              {typeof thread.category === 'string' ? thread.category : thread.category?.name || 'General'}
            </span>
            <span>{formatDate(thread.lastActivity)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Team Ranking Item Component
function TeamRankingItem({ team }: { team: TopTeam }) {
  return (
    <Link 
      href={`/teams/${team.id}`}
      className="flex items-center p-2 hover:bg-[#20303d] rounded transition-colors group"
    >
      <div className="w-6 text-center mr-3">
        <span className="text-sm font-semibold text-white">{team.rank}</span>
      </div>
      
      <div className="w-8 h-8 bg-[#2b3d4d] rounded mr-3 flex items-center justify-center flex-shrink-0">
        {team.logo ? (
          <img src={team.logo} alt={team.name} className="w-6 h-6 object-contain" />
        ) : (
          <span className="text-xs font-bold text-white">
            {team.name.charAt(0)}
          </span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white group-hover:text-[#fa4454] truncate">
            {team.name}
          </span>
          <span className="text-xs text-[#768894] ml-2">
            {formatNumber(team.points)} pts
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-[#768894]">
          <span>{team.region}</span>
          {team.change !== 0 && (
            <span className={`flex items-center ${
              team.change > 0 ? 'text-[#4ade80]' : 'text-[#ef4444]'
            }`}>
              {team.change > 0 ? '↗' : '↘'}
              {Math.abs(team.change)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// User Activity Item Component
function UserActivityItem({ activity }: { activity: UserActivity }) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'match':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'event':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <Link 
      href={activity.url}
      className="flex items-start space-x-3 p-2 hover:bg-[#20303d] rounded transition-colors group"
    >
      <div className="text-[#768894] group-hover:text-[#fa4454] mt-0.5">
        {getActivityIcon(activity.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white group-hover:text-[#fa4454] line-clamp-2">
          {activity.title}
        </p>
        <p className="text-xs text-[#768894] mt-1">
          {formatDate(activity.timestamp)}
        </p>
      </div>
    </Link>
  );
}

// Quick Action Button Component
function QuickActionButton({ 
  href, 
  icon, 
  text 
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center space-x-2 p-2 bg-[#0f1419] border border-[#2b3d4d] rounded hover:bg-[#20303d] hover:border-[#fa4454] transition-colors group"
    >
      <div className="text-[#768894] group-hover:text-[#fa4454]">
        {icon}
      </div>
      <span className="text-sm text-white group-hover:text-[#fa4454]">
        {text}
      </span>
    </Link>
  );
}

// Loading Skeleton Component
function SidebarSkeleton() {
  return (
    <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg">
      <div className="p-3 border-b border-[#2b3d4d]">
        <div className="h-4 bg-[#2b3d4d] rounded animate-pulse"></div>
      </div>
      <div className="p-3 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-[#2b3d4d] rounded-full mt-2 animate-pulse"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-[#2b3d4d] rounded animate-pulse"></div>
              <div className="flex space-x-2">
                <div className="h-3 w-16 bg-[#2b3d4d] rounded animate-pulse"></div>
                <div className="h-3 w-12 bg-[#2b3d4d] rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
