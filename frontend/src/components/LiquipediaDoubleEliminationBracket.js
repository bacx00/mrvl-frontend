import React, { useMemo, useState } from 'react';
import LiquipediaMatchCard from './LiquipediaMatchCard';

/**
 * Liquipedia-style Double Elimination Bracket
 * Upper bracket, lower bracket, and grand finals visualization
 */
function LiquipediaDoubleEliminationBracket({
  bracket,
  onMatchClick,
  onTeamClick,
  hoveredMatch,
  selectedMatch,
  onMatchHover,
  compact = false,
  collapsible = true
}) {
  const [expandedSections, setExpandedSections] = useState({
    upperBracket: true,
    lowerBracket: true,
    grandFinals: true
  });

  const upperBracket = bracket?.upper_bracket || [];
  const lowerBracket = bracket?.lower_bracket || [];
  const grandFinals = bracket?.grand_final || bracket?.grand_finals;

  const toggleSection = (section) => {
    if (collapsible) {
      setExpandedSections(prev => ({
        ...prev,
        [section]: !prev[section]
      }));
    }
  };

  // Calculate layouts for both brackets
  const upperLayout = useMemo(() => 
    calculateBracketLayout(upperBracket, 'upper'), 
    [upperBracket]
  );
  
  const lowerLayout = useMemo(() => 
    calculateBracketLayout(lowerBracket, 'lower'), 
    [lowerBracket]
  );

  const getRoundName = (round, roundIndex, totalRounds, isLower = false) => {
    if (isLower) {
      // Lower bracket round naming
      const lowerRoundNames = {
        0: 'LB Round 1',
        1: 'LB Round 2', 
        2: 'LB Quarterfinals',
        3: 'LB Semifinals',
        4: 'LB Finals'
      };
      return round.name || lowerRoundNames[roundIndex] || `LB Round ${roundIndex + 1}`;
    } else {
      // Upper bracket round naming
      const upperRoundNames = {
        0: totalRounds > 3 ? 'Round of 16' : 'Quarterfinals',
        1: totalRounds > 3 ? 'Quarterfinals' : 'Semifinals',
        2: totalRounds > 3 ? 'Semifinals' : 'UB Finals',
        3: 'UB Finals'
      };
      return round.name || upperRoundNames[roundIndex] || `UB Round ${roundIndex + 1}`;
    }
  };

  return (
    <div className="double-elimination-bracket w-full space-y-12">
      {/* Upper Bracket */}
      {upperBracket.length > 0 && (
        <BracketSection
          title="Upper Bracket"
          color="blue"
          isExpanded={expandedSections.upperBracket}
          onToggle={() => toggleSection('upperBracket')}
          collapsible={collapsible}
        >
          <div className="relative overflow-x-auto">
            <div className="flex space-x-16 pb-8">
              {upperLayout.rounds.map((round, roundIndex) => (
                <BracketRound
                  key={`upper-${roundIndex}`}
                  round={round}
                  roundIndex={roundIndex}
                  totalRounds={upperLayout.rounds.length}
                  roundName={getRoundName(round, roundIndex, upperLayout.rounds.length)}
                  onMatchClick={onMatchClick}
                  onTeamClick={onTeamClick}
                  hoveredMatch={hoveredMatch}
                  selectedMatch={selectedMatch}
                  compact={compact}
                  isLastRound={roundIndex === upperLayout.rounds.length - 1}
                />
              ))}
            </div>
            <BracketConnectors rounds={upperLayout.rounds} />
          </div>
        </BracketSection>
      )}

      {/* Lower Bracket */}
      {lowerBracket.length > 0 && (
        <BracketSection
          title="Lower Bracket"
          color="red"
          isExpanded={expandedSections.lowerBracket}
          onToggle={() => toggleSection('lowerBracket')}
          collapsible={collapsible}
        >
          <div className="relative overflow-x-auto">
            <div className="flex space-x-16 pb-8">
              {lowerLayout.rounds.map((round, roundIndex) => (
                <BracketRound
                  key={`lower-${roundIndex}`}
                  round={round}
                  roundIndex={roundIndex}
                  totalRounds={lowerLayout.rounds.length}
                  roundName={getRoundName(round, roundIndex, lowerLayout.rounds.length, true)}
                  onMatchClick={onMatchClick}
                  onTeamClick={onTeamClick}
                  hoveredMatch={hoveredMatch}
                  selectedMatch={selectedMatch}
                  compact={compact}
                  isLastRound={roundIndex === lowerLayout.rounds.length - 1}
                />
              ))}
            </div>
            <BracketConnectors rounds={lowerLayout.rounds} />
          </div>
        </BracketSection>
      )}

      {/* Grand Finals */}
      {grandFinals && (
        <BracketSection
          title="Grand Finals"
          color="yellow"
          isExpanded={expandedSections.grandFinals}
          onToggle={() => toggleSection('grandFinals')}
          collapsible={collapsible}
        >
          <div className="flex justify-center py-8">
            <div className="relative">
              <LiquipediaMatchCard
                match={grandFinals}
                onClick={onMatchClick}
                onTeamClick={onTeamClick}
                isHovered={hoveredMatch?.id === grandFinals.id}
                isSelected={selectedMatch?.id === grandFinals.id}
                compact={compact}
              />
              {grandFinals.reset_match && (
                <div className="mt-6">
                  <div className="text-center mb-4">
                    <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                      Bracket Reset
                    </span>
                  </div>
                  <LiquipediaMatchCard
                    match={grandFinals.reset_match}
                    onClick={onMatchClick}
                    onTeamClick={onTeamClick}
                    isHovered={hoveredMatch?.id === grandFinals.reset_match.id}
                    isSelected={selectedMatch?.id === grandFinals.reset_match.id}
                    compact={compact}
                  />
                </div>
              )}
            </div>
          </div>
        </BracketSection>
      )}
    </div>
  );
}

/**
 * Bracket Section with collapsible header
 */
function BracketSection({ title, color, isExpanded, onToggle, collapsible, children }) {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-700 dark:text-blue-300',
    red: 'border-red-500 text-red-700 dark:text-red-300',
    yellow: 'border-yellow-500 text-yellow-700 dark:text-yellow-300'
  };

  return (
    <div className="bracket-section">
      <div className="flex items-center justify-center mb-8">
        <div 
          className={`flex items-center space-x-3 ${collapsible ? 'cursor-pointer' : ''}`}
          onClick={collapsible ? onToggle : undefined}
        >
          <h3 className={`text-lg font-bold tracking-wider uppercase border-b-2 pb-2 ${colorClasses[color]}`}>
            {title}
          </h3>
          {collapsible && (
            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg 
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {isExpanded && (
        <div className="transition-all duration-300">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Individual bracket round
 */
function BracketRound({ 
  round, 
  roundIndex, 
  totalRounds, 
  roundName, 
  onMatchClick, 
  onTeamClick, 
  hoveredMatch, 
  selectedMatch, 
  compact,
  isLastRound 
}) {
  return (
    <div className="relative flex-shrink-0" style={{ minWidth: compact ? '240px' : '300px' }}>
      {/* Round Header */}
      <div className="text-center mb-8 sticky top-0 z-10 bg-white dark:bg-gray-900 py-2">
        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b-2 border-gray-300 dark:border-gray-600 pb-2 inline-block">
          {roundName}
        </h4>
        {round.start_date && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {new Date(round.start_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            })}
          </div>
        )}
      </div>

      {/* Matches */}
      <div className="space-y-8">
        {round.matches?.map((match, matchIndex) => (
          <div key={match.id || matchIndex} className="transition-all duration-300">
            <LiquipediaMatchCard
              match={match}
              onClick={onMatchClick}
              onTeamClick={onTeamClick}
              isHovered={hoveredMatch?.id === match.id}
              isSelected={selectedMatch?.id === match.id}
              compact={compact}
              showConnector={!isLastRound}
            />
          </div>
        )) || []}
      </div>
    </div>
  );
}

/**
 * SVG Bracket Connectors
 */
function BracketConnectors({ rounds }) {
  if (!rounds || rounds.length < 2) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      style={{ zIndex: 1 }}
      preserveAspectRatio="none"
    >
      {rounds.map((round, roundIndex) => {
        if (roundIndex >= rounds.length - 1) return null;

        const nextRound = rounds[roundIndex + 1];
        const roundWidth = 316; // 300px + 16px gap
        const connectorLength = 64;

        return round.matches?.map((match, matchIndex) => {
          const nextMatchIndex = Math.floor(matchIndex / 2);
          const nextMatch = nextRound.matches?.[nextMatchIndex];
          
          if (!nextMatch) return null;

          const fromX = (roundIndex + 1) * roundWidth - connectorLength;
          const fromY = 120 + (matchIndex * 160); // Estimated position
          const toX = fromX + connectorLength;
          const toY = 120 + (nextMatchIndex * 160);
          const midX = fromX + connectorLength / 2;

          return (
            <g key={`connector-${roundIndex}-${matchIndex}`}>
              <line
                x1={fromX}
                y1={fromY}
                x2={midX}
                y2={fromY}
                className="bracket-connector"
              />
              
              {matchIndex % 2 === 0 && matchIndex < round.matches.length - 1 && (
                <line
                  x1={midX}
                  y1={fromY}
                  x2={midX}
                  y2={fromY + 160}
                  className="bracket-connector"
                />
              )}
              
              {matchIndex % 2 === 0 && (
                <line
                  x1={midX}
                  y1={fromY + 80}
                  x2={toX}
                  y2={toY}
                  className="bracket-connector"
                />
              )}
            </g>
          );
        }) || [];
      })}
    </svg>
  );
}

/**
 * Calculate bracket layout helper
 */
function calculateBracketLayout(rounds, type) {
  if (!rounds?.length) return { rounds: [], totalHeight: 0 };

  const processedRounds = rounds.map((round, roundIndex) => {
    const matchSpacing = type === 'lower' ? 120 : Math.pow(2, roundIndex) * 100;
    const baseOffset = matchSpacing / 2;
    
    return {
      ...round,
      roundIndex,
      matchSpacing,
      baseOffset,
      matches: round.matches?.map((match, matchIndex) => ({
        ...match,
        yPosition: baseOffset + (matchIndex * matchSpacing)
      })) || []
    };
  });

  return {
    rounds: processedRounds,
    totalHeight: Math.max(400, rounds[0]?.matches?.length * 160 || 400)
  };
}

export default LiquipediaDoubleEliminationBracket;