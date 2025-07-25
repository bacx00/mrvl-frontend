import React, { useState, useEffect, useRef } from 'react';
import { TeamLogo, getCountryFlag } from '../utils/imageUtils';
import HeroImage from './shared/HeroImage';
import { subscribeEventUpdates } from '../lib/pusher.ts';
import { MARVEL_RIVALS_MAPS, MARVEL_RIVALS_HEROES } from '../constants/marvelRivalsData';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function MarvelRivalsBracketVisualization({ bracket, event, navigateTo, isAdmin, onMatchUpdate, showPredictions = false }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredMatch, setHoveredMatch] = useState(null);
  const [hoveredTeamPath, setHoveredTeamPath] = useState(null);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [showMapDetails, setShowMapDetails] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [communityPredictions, setCommunityPredictions] = useState({});
  const containerRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!event?.id) return;

    const channel = subscribeEventUpdates(event.id.toString(), (data) => {
      if (data.type === 'match-updated' || data.type === 'bracket-updated') {
        console.log('Real-time bracket update:', data);
      }
    });

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
    };
  }, [event?.id]);

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Handle zoom
  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === '+' || e.key === '=') handleZoom(0.1);
      if (e.key === '-') handleZoom(-0.1);
      if (e.key === 'f') toggleFullscreen();
      if (e.key === 'Escape' && selectedMatch) setSelectedMatch(null);
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedMatch]);

  // Export bracket functionality
  const exportBracket = async (format) => {
    try {
      const element = containerRef.current?.querySelector('.bracket-visualization');
      if (!element) return;

      // Reset zoom for export
      const originalZoom = zoom;
      setZoom(1);
      
      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 100));

      if (format === 'image') {
        const canvas = await html2canvas(element, {
          backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          width: element.scrollWidth,
          height: element.scrollHeight
        });
        
        const link = document.createElement('a');
        link.download = `${event.name}-bracket-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
      } else if (format === 'pdf') {
        const canvas = await html2canvas(element, {
          backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          width: element.scrollWidth,
          height: element.scrollHeight
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'px',
          format: [canvas.width / 2, canvas.height / 2]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
        pdf.save(`${event.name}-bracket-${new Date().toISOString().split('T')[0]}.pdf`);
      }

      // Restore zoom
      setZoom(originalZoom);
      
      console.log(`✅ Bracket exported as ${format}`);
    } catch (error) {
      console.error('❌ Error exporting bracket:', error);
      alert('Failed to export bracket. Please try again.');
    }
  };

  console.log('🔍 MarvelRivalsBracketVisualization received bracket:', bracket);
  console.log('🔍 Bracket type:', typeof bracket);
  console.log('🔍 Bracket rounds:', bracket?.rounds);
  console.log('🔍 Bracket rounds length:', bracket?.rounds?.length);
  
  if (!bracket || !bracket.rounds) {
    console.log('⚠️ MarvelRivalsBracketVisualization: No bracket or rounds');
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-500">No bracket data available</div>
      </div>
    );
  }

  const bracketType = bracket.type || 'single_elimination';
  const isDoubleElim = bracketType === 'double_elimination';

  return (
    <div ref={containerRef} className={`bracket-container ${isFullscreen ? 'fullscreen' : ''}`}>
      {/* Simplified Header */}
      <div className="bracket-controls flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {event?.name}
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
            {bracketType.replace('_', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Minimal zoom controls */}
          <button
            onClick={() => handleZoom(-0.1)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Zoom Out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => handleZoom(0.1)}
            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            title="Zoom In"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bracket Visualization */}
      <div 
        className="bracket-visualization overflow-x-auto overflow-y-hidden"
        style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
      >
        <div className="min-w-max p-6">
          {/* Upper Bracket */}
          <MarvelBracketSection
            title="UPPER BRACKET"
            rounds={bracket.rounds}
            bracket={bracket}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
            showMapDetails={showMapDetails}
            predictions={predictions}
            setPredictions={setPredictions}
            communityPredictions={communityPredictions}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            showPredictions={showPredictions}
          />

          {/* Lower Bracket */}
          {isDoubleElim && bracket.lower_bracket && (
            <div className="mt-16">
              <MarvelBracketSection
                title="LOWER BRACKET"
                rounds={bracket.lower_bracket}
                bracket={bracket}
                isLowerBracket={true}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                hoveredTeamPath={hoveredTeamPath}
                setHoveredTeamPath={setHoveredTeamPath}
                selectedMatch={selectedMatch}
                setSelectedMatch={setSelectedMatch}
                showMapDetails={showMapDetails}
                predictions={predictions}
                setPredictions={setPredictions}
                communityPredictions={communityPredictions}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                showPredictions={showPredictions}
              />
            </div>
          )}

          {/* Grand Finals */}
          {isDoubleElim && bracket.grand_final && (
            <div className="mt-16">
              <MarvelBracketSection
                title="GRAND FINAL"
                rounds={[{ matches: [bracket.grand_final] }]}
                bracket={bracket}
                isGrandFinal={true}
                hoveredMatch={hoveredMatch}
                setHoveredMatch={setHoveredMatch}
                hoveredTeamPath={hoveredTeamPath}
                setHoveredTeamPath={setHoveredTeamPath}
                selectedMatch={selectedMatch}
                setSelectedMatch={setSelectedMatch}
                showMapDetails={showMapDetails}
                predictions={predictions}
                setPredictions={setPredictions}
                communityPredictions={communityPredictions}
                navigateTo={navigateTo}
                isAdmin={isAdmin}
                onMatchUpdate={onMatchUpdate}
                showPredictions={showPredictions}
              />
            </div>
          )}
        </div>
      </div>

      {/* Match Preview Modal */}
      {selectedMatch && (
        <MarvelMatchModal 
          match={selectedMatch} 
          onClose={() => setSelectedMatch(null)}
          navigateTo={navigateTo}
          isAdmin={isAdmin}
          onMatchUpdate={onMatchUpdate}
        />
      )}

      {/* Hover Preview */}
      {hoveredMatch && !selectedMatch && (
        <MarvelMatchPreview match={hoveredMatch} communityPredictions={communityPredictions} />
      )}
    </div>
  );
}

// Marvel Bracket Section Component
function MarvelBracketSection({ 
  title, 
  rounds, 
  bracket,
  isLowerBracket = false,
  isGrandFinal = false,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  selectedMatch,
  setSelectedMatch,
  showMapDetails,
  predictions,
  setPredictions,
  communityPredictions,
  navigateTo,
  isAdmin,
  onMatchUpdate,
  showPredictions
}) {
  return (
    <div className="bracket-section">
      {title && (
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-5 tracking-wide">
          {title}
        </h4>
      )}
      
      <div className="flex items-start space-x-6">
        {rounds.map((round, roundIndex) => (
          <MarvelBracketRound
            key={`${isLowerBracket ? 'lower' : 'upper'}-${roundIndex}`}
            round={round}
            roundIndex={roundIndex}
            totalRounds={rounds.length}
            bracket={bracket}
            isLowerBracket={isLowerBracket}
            isGrandFinal={isGrandFinal}
            hoveredMatch={hoveredMatch}
            setHoveredMatch={setHoveredMatch}
            hoveredTeamPath={hoveredTeamPath}
            setHoveredTeamPath={setHoveredTeamPath}
            selectedMatch={selectedMatch}
            setSelectedMatch={setSelectedMatch}
            showMapDetails={showMapDetails}
            predictions={predictions}
            setPredictions={setPredictions}
            communityPredictions={communityPredictions}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={onMatchUpdate}
            showPredictions={showPredictions}
          />
        ))}
      </div>
    </div>
  );
}

// Marvel-specific Bracket Round
function MarvelBracketRound({
  round,
  roundIndex,
  totalRounds,
  bracket,
  isLowerBracket,
  isGrandFinal,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  selectedMatch,
  setSelectedMatch,
  showMapDetails,
  predictions,
  setPredictions,
  communityPredictions,
  navigateTo,
  isAdmin,
  onMatchUpdate,
  showPredictions
}) {
  // Calculate round name
  const getRoundName = () => {
    if (isGrandFinal) return 'GRAND FINAL';
    if (round.name) return round.name.toUpperCase();
    
    const upperRoundNames = ['ROUND OF 32', 'ROUND OF 16', 'QUARTERFINALS', 'SEMIFINALS', 'UPPER FINAL'];
    const lowerRoundNames = ['LOWER ROUND 1', 'LOWER ROUND 2', 'LOWER ROUND 3', 'LOWER ROUND 4', 'LOWER FINAL'];
    
    if (isLowerBracket) {
      return lowerRoundNames[roundIndex] || `LOWER ROUND ${roundIndex + 1}`;
    }
    
    const roundsFromEnd = totalRounds - roundIndex - 1;
    return upperRoundNames[upperRoundNames.length - roundsFromEnd - 1] || `ROUND ${roundIndex + 1}`;
  };

  // Calculate match spacing (VLR.gg style)
  const matchSpacing = isLowerBracket ? 80 : 80 + (roundIndex * 40);

  return (
    <div className="bracket-round" style={{ minWidth: '200px' }}>
      {/* Round Header */}
      <div className="text-center mb-4">
        <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {getRoundName()}
        </h5>
      </div>

      {/* Matches */}
      <div className="relative">
        {round.matches.map((match, matchIndex) => (
          <div
            key={match.id || `match-${matchIndex}`}
            style={{ 
              marginBottom: matchIndex < round.matches.length - 1 ? `${matchSpacing}px` : 0,
              position: 'relative'
            }}
          >
            <MarvelBracketMatch
              match={match}
              bracket={bracket}
              roundIndex={roundIndex}
              matchIndex={matchIndex}
              totalRounds={totalRounds}
              isLowerBracket={isLowerBracket}
              isGrandFinal={isGrandFinal}
              hoveredMatch={hoveredMatch}
              setHoveredMatch={setHoveredMatch}
              hoveredTeamPath={hoveredTeamPath}
              setHoveredTeamPath={setHoveredTeamPath}
              selectedMatch={selectedMatch}
              setSelectedMatch={setSelectedMatch}
              showMapDetails={showMapDetails}
              predictions={predictions}
              setPredictions={setPredictions}
              communityPredictions={communityPredictions}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={onMatchUpdate}
              showPredictions={showPredictions}
            />
            
            {/* Match Connectors */}
            {roundIndex < totalRounds - 1 && !isGrandFinal && (
              <MatchConnector
                roundIndex={roundIndex}
                matchIndex={matchIndex}
                totalMatches={round.matches.length}
                isLowerBracket={isLowerBracket}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// VLR.gg-style Bracket Match
function MarvelBracketMatch({
  match,
  bracket,
  roundIndex,
  matchIndex,
  totalRounds,
  isLowerBracket,
  isGrandFinal,
  hoveredMatch,
  setHoveredMatch,
  hoveredTeamPath,
  setHoveredTeamPath,
  selectedMatch,
  setSelectedMatch,
  showMapDetails,
  predictions,
  setPredictions,
  communityPredictions,
  navigateTo,
  isAdmin,
  onMatchUpdate,
  showPredictions
}) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live' || match.status === 'ongoing';
  
  const team1Won = isCompleted && match.team1_score > match.team2_score;
  const team2Won = isCompleted && match.team2_score > match.team1_score;

  return (
    <div
      className={`bracket-match relative transition-all duration-150 ${
        hoveredMatch?.id === match.id ? 'z-20' : 'z-10'
      }`}
      onMouseEnter={() => {
        setHoveredMatch(match);
        if (match.team1) setHoveredTeamPath(match.team1.id);
        if (match.team2) setHoveredTeamPath(match.team2.id);
      }}
      onMouseLeave={() => {
        setHoveredMatch(null);
        setHoveredTeamPath(null);
      }}
    >
      <div
        className={`
          w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
          rounded cursor-pointer transition-all duration-150
          ${isLive ? 'border-green-400 shadow-sm' : ''}
          ${hoveredMatch?.id === match.id ? 'shadow-md border-gray-300 dark:border-gray-500' : 'hover:border-gray-300 dark:hover:border-gray-500'}
        `}
        onClick={() => match.id && setSelectedMatch(match)}
      >
        {/* Team 1 */}
        <VLRTeamRow
          team={match.team1}
          score={match.team1_score}
          isWinner={team1Won}
          isLoser={team2Won}
          isFirst={true}
        />

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-600"></div>

        {/* Team 2 */}
        <VLRTeamRow
          team={match.team2}
          score={match.team2_score}
          isWinner={team2Won}
          isLoser={team1Won}
          isFirst={false}
        />

        {/* Live indicator */}
        {isLive && (
          <div className="px-3 py-1 bg-green-50 dark:bg-green-900/20 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-center">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// VLR.gg-style Team Row Component
function VLRTeamRow({ team, score, isWinner, isLoser, isFirst }) {
  return (
    <div className={`
      flex items-center justify-between px-3 py-2 transition-colors
      ${isWinner ? 'bg-green-50 dark:bg-green-900/10' : ''}
      ${isLoser ? 'opacity-50' : ''}
    `}>
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {team ? (
          <>
            <TeamLogo team={team} size="w-5 h-5" />
            <span className={`font-medium text-sm truncate ${
              isWinner ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {team.short_name || team.name}
            </span>
          </>
        ) : (
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded"></div>
            <span className="text-gray-400 dark:text-gray-500 italic text-sm">TBD</span>
          </div>
        )}
      </div>
      
      {/* Score */}
      <div className={`
        text-sm font-bold min-w-[24px] text-right
        ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
      `}>
        {score !== null && score !== undefined ? score : '-'}
      </div>
    </div>
  );
}

// Marvel Match Modal
function MarvelMatchModal({ match, onClose, navigateTo, isAdmin, onMatchUpdate }) {
  const mapsData = match.maps_data || [];
  const team1Roster = match.team1_roster || [];
  const team2Roster = match.team2_roster || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Match Details</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {match.format} • {match.status?.toUpperCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Teams */}
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              {match.team1 && (
                <>
                  <TeamLogo team={match.team1} size="w-16 h-16 mx-auto mb-2" />
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{match.team1.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {match.team1_score || 0}
                  </p>
                </>
              )}
            </div>
            <div className="text-center">
              {match.team2 && (
                <>
                  <TeamLogo team={match.team2} size="w-16 h-16 mx-auto mb-2" />
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{match.team2.name}</h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {match.team2_score || 0}
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Maps */}
          {mapsData.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Maps</h4>
              <div className="space-y-2">
                {mapsData.map((map, index) => (
                  <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        Map {index + 1}: {map.map_name}
                      </span>
                      <span className="text-sm text-purple-600 dark:text-purple-400">
                        {map.mode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-lg font-bold ${
                        map.winner_id === match.team1_id ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {map.team1_score || 0}
                      </span>
                      <span className="text-gray-400">-</span>
                      <span className={`text-lg font-bold ${
                        map.winner_id === match.team2_id ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {map.team2_score || 0}
                      </span>
                    </div>
                    
                    {/* Hero Compositions */}
                    {(map.team1_composition || map.team2_composition) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Team 1 Comp</p>
                            <div className="flex flex-wrap gap-1">
                              {map.team1_composition?.map((comp, idx) => (
                                <HeroImage
                                  key={idx}
                                  hero={comp.hero}
                                  size="w-8 h-8"
                                  showName={false}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Team 2 Comp</p>
                            <div className="flex flex-wrap gap-1">
                              {map.team2_composition?.map((comp, idx) => (
                                <HeroImage
                                  key={idx}
                                  hero={comp.hero}
                                  size="w-8 h-8"
                                  showName={false}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => navigateTo && navigateTo('match-detail', { id: match.id })}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              View Full Details
            </button>
            {isAdmin && match.status === 'upcoming' && (
              <button
                onClick={() => {
                  if (onMatchUpdate) {
                    onMatchUpdate(match.id, { status: 'live' });
                  }
                  onClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                Start Match
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Marvel Match Preview
function MarvelMatchPreview({ match, communityPredictions }) {
  if (!match) return null;
  
  const mapsData = match.maps_data || [];
  
  return (
    <div className="fixed z-50 pointer-events-none" style={{ bottom: '20px', right: '20px' }}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4 min-w-[350px]">
        <div className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          🎮 Marvel Rivals Match
        </div>
        
        {/* Teams */}
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {match.team1?.name || 'TBD'}
            </span>
            <span className="text-sm font-bold">
              {match.team1_score ?? '-'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
              {match.team2?.name || 'TBD'}
            </span>
            <span className="text-sm font-bold">
              {match.team2_score ?? '-'}
            </span>
          </div>
        </div>
        
        {/* Match Info */}
        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          {match.scheduled_at && (
            <div>📅 {new Date(match.scheduled_at).toLocaleString()}</div>
          )}
          {match.format && (
            <div>🎯 Format: {match.format}</div>
          )}
          {mapsData.length > 0 && (
            <div>🗺️ Maps: {mapsData.map(m => m.map_name).join(', ')}</div>
          )}
          {match.stream_urls?.length > 0 && (
            <div>📺 Stream available</div>
          )}
        </div>
        
        {/* Community Predictions */}
        {communityPredictions[match.id] && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              Community Predictions
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-600 font-medium">
                {communityPredictions[match.id].team1_percentage}%
              </span>
              <span className="text-purple-600 font-medium">
                {communityPredictions[match.id].team2_percentage}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// VLR.gg-style Match Connector
function MatchConnector({ roundIndex, matchIndex, totalMatches, isLowerBracket }) {
  const connectToNext = matchIndex % 2 === 0;
  const isLastMatch = matchIndex === totalMatches - 1;
  
  return (
    <svg
      className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none"
      width="30"
      height="120"
      style={{ zIndex: 5 }}
    >
      {/* Horizontal line from match */}
      <line
        x1="0"
        y1="50%"
        x2="15"
        y2="50%"
        stroke="#d1d5db"
        strokeWidth="1.5"
      />
      
      {/* Vertical connector for pairing matches */}
      {!isLastMatch && connectToNext && (
        <line
          x1="15"
          y1="50%"
          x2="15"
          y2="130%"
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
      )}
      
      {/* Horizontal line to next round */}
      {connectToNext && (
        <line
          x1="15"
          y1={isLastMatch ? "50%" : "90%"}
          x2="30"
          y2={isLastMatch ? "50%" : "90%"}
          stroke="#d1d5db"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}

export default MarvelRivalsBracketVisualization;