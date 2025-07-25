// src/components/MatchCard.tsx - VLR.gg Style Match Card
'use client';
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Team {
  name: string;
  logo?: string;
  score?: number;
}

interface MatchCardProps {
  id: number;
  team1: Team;
  team2: Team;
  status: 'live' | 'upcoming' | 'completed';
  event?: string;
  stage?: string;
  time?: string;
  series?: string;
}

const MatchCard: React.FC<MatchCardProps> = ({
  id,
  team1,
  team2,
  status,
  event,
  stage,
  time,
  series = 'Bo3'
}) => {
  // Format time display
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'TBD';
    const date = new Date(timeString);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Determine winner for completed matches
  const team1Won = status === 'completed' && (team1.score || 0) > (team2.score || 0);
  const team2Won = status === 'completed' && (team2.score || 0) > (team1.score || 0);

  // Team logo component with proper fallback
  const TeamLogo = ({ team, size = 40 }: { team: Team; size?: number }) => {
    const [imageError, setImageError] = React.useState(false);
    
    if (!team.logo || imageError) {
      // Fallback to first letter of team name
      return (
        <div 
          className="team-logo-container bg-[#0f1419] rounded-full flex items-center justify-center flex-shrink-0 border border-[#2b3d4d]"
          style={{ width: size, height: size }}
        >
          <span className="font-bold text-white" style={{ fontSize: size * 0.4 }}>
            {team.name.charAt(0).toUpperCase()}
          </span>
        </div>
      );
    }

    return (
      <div 
        className="team-logo-container rounded-full overflow-hidden bg-[#0f1419] flex-shrink-0 border border-[#2b3d4d]"
        style={{ width: size, height: size }}
      >
        <Image
          src={team.logo}
          alt={team.name}
          width={size}
          height={size}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          unoptimized // For external images
        />
      </div>
    );
  };

  return (
    <Link 
      href={`/matches/${id}`}
      className="match-card-container block bg-[#1a2332] hover:bg-[#20303d] transition-all duration-200 transform hover:scale-[1.02] border-b border-[#2b3d4d]"
    >
      <div className="p-6"> {/* Increased padding for bigger cards */}
        {/* Event and Stage Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-[#768894]">{event || 'Tournament'}</span>
            {stage && (
              <>
                <span className="text-[#768894]">•</span>
                <span className="text-sm text-[#768894]">{stage}</span>
              </>
            )}
          </div>
          <span className="text-sm text-[#768894] font-medium">{series}</span>
        </div>

        {/* Main Match Content */}
        <div className="flex items-center justify-between">
          {/* Team 1 */}
          <div className={`flex-1 flex items-center space-x-4 ${
            status === 'completed' && !team1Won ? 'opacity-60' : ''
          }`}>
            <TeamLogo team={team1} size={48} /> {/* Bigger team logos */}
            <div>
              <h3 className={`text-lg font-semibold ${
                team1Won ? 'text-white' : 'text-gray-300'
              }`}>
                {team1.name}
              </h3>
            </div>
          </div>

          {/* Score/Status/Time */}
          <div className="px-8 text-center">
            {status === 'live' && (
              <div className="flex flex-col items-center">
                <div className="bg-[#fa4454] text-white px-4 py-2 rounded text-sm font-bold animate-pulse">
                  LIVE
                </div>
                {team1.score !== undefined && team2.score !== undefined && (
                  <div className="mt-3 flex items-center space-x-3">
                    <span className="text-3xl font-bold text-white">{team1.score}</span>
                    <span className="text-2xl text-[#768894]">-</span>
                    <span className="text-3xl font-bold text-white">{team2.score}</span>
                  </div>
                )}
              </div>
            )}
            
            {status === 'completed' && (
              <div className="match-score flex items-center space-x-3">
                <span className={`text-3xl font-bold ${
                  team1Won ? 'text-white' : 'text-[#768894]'
                }`}>
                  {team1.score || 0}
                </span>
                <span className="text-2xl text-[#768894]">-</span>
                <span className={`text-3xl font-bold ${
                  team2Won ? 'text-white' : 'text-[#768894]'
                }`}>
                  {team2.score || 0}
                </span>
              </div>
            )}
            
            {status === 'upcoming' && (
              <div>
                <div className="text-2xl font-semibold text-white">
                  {formatTime(time)}
                </div>
                <div className="text-sm text-[#768894] mt-1">vs</div>
              </div>
            )}
          </div>

          {/* Team 2 */}
          <div className={`flex-1 flex items-center justify-end space-x-4 ${
            status === 'completed' && !team2Won ? 'opacity-60' : ''
          }`}>
            <div className="text-right">
              <h3 className={`text-lg font-semibold ${
                team2Won ? 'text-white' : 'text-gray-300'
              }`}>
                {team2.name}
              </h3>
            </div>
            <TeamLogo team={team2} size={48} /> {/* Bigger team logos */}
          </div>
        </div>

        {/* Live match indicator */}
        {status === 'live' && (
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#fa4454] rounded-full animate-pulse"></div>
              <span className="text-xs text-[#768894]">Match in progress</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default MatchCard;