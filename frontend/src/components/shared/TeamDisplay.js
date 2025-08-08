import React from 'react';
import { TeamLogo } from '../../utils/imageUtils';

const TeamDisplay = ({ 
  team, 
  score, 
  isWinner = false, 
  showLogo = true, 
  logoSize = 'w-6 h-6',
  nameClass = '',
  scoreClass = '',
  onClick,
  className = ''
}) => {
  const teamName = team?.name || team?.team_name || 'TBD';
  const teamLogo = team?.logo || team?.team_logo;
  const teamId = team?.id || team?.team_id;

  return (
    <div 
      className={`flex items-center ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      onClick={onClick}
    >
      {showLogo && (
        <TeamLogo 
          src={teamLogo} 
          alt={teamName} 
          className={`${logoSize} mr-2`} 
        />
      )}
      
      <span className={`text-sm ${isWinner ? 'font-semibold' : ''} ${nameClass}`}>
        {teamName}
      </span>
      
      {score !== undefined && score !== null && (
        <span className={`ml-auto text-sm ${isWinner ? 'font-bold' : ''} ${scoreClass}`}>
          {score}
        </span>
      )}
    </div>
  );
};

// Compact version for smaller displays
export const CompactTeamDisplay = ({ team, score, isWinner = false }) => {
  const teamShortName = team?.short_name || team?.name?.substring(0, 3)?.toUpperCase() || 'TBD';
  
  return (
    <div className="flex items-center justify-between">
      <span className={`text-xs ${isWinner ? 'font-semibold' : ''}`}>
        {teamShortName}
      </span>
      {score !== undefined && (
        <span className={`text-xs ml-2 ${isWinner ? 'font-bold' : ''}`}>
          {score}
        </span>
      )}
    </div>
  );
};

export default TeamDisplay;