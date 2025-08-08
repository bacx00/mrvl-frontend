import React, { useState, useEffect, useCallback } from 'react';
import { TeamLogo } from '../utils/imageUtils';
import { useAuth } from '../hooks';
// Pusher removed - not using real-time updates

function SimplifiedLiquipediaBracket({ eventId, isAdmin = false, navigateTo }) {
  const [bracket, setBracket] = useState(null);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [regenerating, setRegenerating] = useState(false);
  const { api } = useAuth();

  // Fetch bracket data
  const fetchBracketData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch event data
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.data?.data || eventRes.data);

      // Fetch bracket data
      const bracketRes = await api.get(`/events/${eventId}/bracket`);
      const bracketData = bracketRes.data?.data?.bracket || null;
      setBracket(bracketData);
    } catch (err) {
      console.error('Error fetching bracket:', err);
      setError('Failed to load bracket data');
    } finally {
      setLoading(false);
    }
  }, [eventId, api]);

  useEffect(() => {
    fetchBracketData();
  }, [fetchBracketData]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!eventId) return;

    // const channel = subscribeEventUpdates(eventId.toString(), (data) => {
      console.log('Real-time bracket update:', data);
      
      if (data.type === 'bracket-updated' || data.type === 'match-updated') {
        // If bracket data is included, update immediately
        if (data.bracket) {
          setBracket(data.bracket);
        } else {
          // Otherwise refresh the bracket
          fetchBracketData();
        }
      }
    });

    return () => {
      if (channel) {
        channel.unbind_all();
        channel.unsubscribe();
      }
    };
  }, [eventId, fetchBracketData]);

  // Handle bracket regeneration
  const handleRegenerateBracket = async () => {
    if (!window.confirm('Are you sure you want to regenerate the bracket? This will reset all match results.')) {
      return;
    }

    setRegenerating(true);
    try {
      const response = await api.post(`/admin/events/${eventId}/generate-bracket`, {
        seeding_type: 'rating',
        save_history: true
      });
      
      // If the response includes the bracket data, update immediately
      if (response.data?.data?.bracket) {
        setBracket(response.data.data.bracket);
      } else {
        // Otherwise refresh the bracket
        await fetchBracketData();
      }
      
      alert('Bracket regenerated successfully!');
    } catch (err) {
      console.error('Error regenerating bracket:', err);
      alert('Failed to regenerate bracket');
    } finally {
      setRegenerating(false);
    }
  };

  // Handle bracket reset
  const handleResetBracket = async () => {
    if (!window.confirm('Are you sure you want to reset the bracket? This will remove all matches.')) {
      return;
    }

    try {
      const response = await api.post(`/admin/events/${eventId}/reset-bracket`);
      
      // Immediately clear the bracket state
      setBracket(null);
      
      // If response confirms reset, no need to fetch
      if (response.data?.data?.status === 'reset') {
        // Bracket is already cleared
      } else {
        // Otherwise refresh the bracket
        await fetchBracketData();
      }
      
      alert('Bracket reset successfully!');
    } catch (err) {
      console.error('Error resetting bracket:', err);
      alert('Failed to reset bracket');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchBracketData} className="mt-4 btn btn-sm btn-primary">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="liquipedia-bracket-container">
      {/* Header with Admin Controls */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {event?.name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {(event?.format || '').toString().replace('_', ' ').toUpperCase()} • {event?.prize?.total ? `$${event.prize.total.toLocaleString()}` : 'Prize TBD'}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRegenerateBracket}
              disabled={regenerating}
              className="btn btn-sm btn-secondary flex items-center space-x-2"
            >
              {regenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Regenerating...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Regenerate</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleResetBracket}
              className="btn btn-sm btn-error flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        )}
      </div>

      {/* Bracket Display */}
      {!bracket || !bracket.matches ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 mb-4">No bracket generated yet</p>
          {isAdmin && (
            <button
              onClick={handleRegenerateBracket}
              className="btn btn-primary"
            >
              Generate Bracket
            </button>
          )}
        </div>
      ) : (
        <SimplifiedBracketVisualization bracket={bracket} event={event} navigateTo={navigateTo} />
      )}
    </div>
  );
}

// Simplified Bracket Visualization Component
function SimplifiedBracketVisualization({ bracket, event, navigateTo }) {
  const { rounds = [], matches = {} } = bracket;
  
  // Separate upper and lower bracket rounds
  const upperRounds = rounds.filter(round => 
    round.matches.some(matchId => !matchId.startsWith('L') && matchId !== 'GF')
  );
  
  const lowerRounds = rounds.filter(round => 
    round.matches.some(matchId => matchId.startsWith('L'))
  );
  
  const grandFinalRound = rounds.find(round => 
    round.matches.includes('GF')
  );

  return (
    <div className="space-y-12">
      {/* Upper Bracket */}
      {upperRounds.length > 0 && (
        <BracketSection
          title="Upper Bracket"
          rounds={upperRounds}
          matches={matches}
          navigateTo={navigateTo}
        />
      )}

      {/* Lower Bracket */}
      {lowerRounds.length > 0 && (
        <BracketSection
          title="Lower Bracket"
          rounds={lowerRounds}
          matches={matches}
          isLowerBracket={true}
          navigateTo={navigateTo}
        />
      )}

      {/* Grand Final */}
      {grandFinalRound && (
        <BracketSection
          title="Grand Final"
          rounds={[grandFinalRound]}
          matches={matches}
          isGrandFinal={true}
          navigateTo={navigateTo}
        />
      )}
    </div>
  );
}

// Bracket Section Component
function BracketSection({ title, rounds, matches, isLowerBracket = false, isGrandFinal = false, navigateTo }) {
  return (
    <div className="bracket-section">
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
        {title}
      </h3>
      
      <div className="flex items-start space-x-8 overflow-x-auto pb-4 relative">
        {rounds.map((round, roundIndex) => (
          <BracketRound
            key={roundIndex}
            round={round}
            roundIndex={roundIndex}
            totalRounds={rounds.length}
            matches={matches}
            isLowerBracket={isLowerBracket}
            isGrandFinal={isGrandFinal}
            navigateTo={navigateTo}
          />
        ))}
      </div>
    </div>
  );
}

// Bracket Round Component
function BracketRound({ round, roundIndex, totalRounds, matches, isLowerBracket, isGrandFinal, navigateTo }) {
  const getRoundName = () => {
    if (isGrandFinal) return 'Grand Final';
    if (round.name) return round.name;
    
    if (isLowerBracket) {
      const names = ['Lower Round 1', 'Lower Quarter-Finals', 'Lower Semi-Finals', 'Lower Final'];
      return names[roundIndex] || `Lower Round ${roundIndex + 1}`;
    }
    
    const names = ['Quarter-Finals', 'Semi-Finals', 'Upper Final'];
    return names[roundIndex] || `Round ${roundIndex + 1}`;
  };

  return (
    <div className="bracket-round min-w-[240px]">
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {getRoundName()}
        </h4>
        {round.start_date && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {new Date(round.start_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            })}
          </p>
        )}
      </div>

      <div className="space-y-4 relative">
        {round.matches.map((matchId, matchIndex) => {
          const match = matches[matchId];
          if (!match) return null;
          
          return (
            <div key={matchId} className="relative">
              <BracketMatch
                match={match}
                isGrandFinal={isGrandFinal}
                navigateTo={navigateTo}
              />
              
              {/* Add connectors between rounds */}
              {roundIndex < totalRounds - 1 && !isGrandFinal && (
                <BracketConnector
                  roundIndex={roundIndex}
                  matchIndex={matchIndex}
                  totalMatches={round.matches.length}
                  isLowerBracket={isLowerBracket}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bracket Connector Component
function BracketConnector({ roundIndex, matchIndex, totalMatches, isLowerBracket }) {
  const isLastMatch = matchIndex === totalMatches - 1;
  const connectToNext = matchIndex % 2 === 0;
  
  return (
    <svg
      className="absolute left-full top-1/2 -translate-y-1/2 pointer-events-none"
      width="48"
      height="80"
      style={{ zIndex: 5 }}
    >
      {/* Horizontal line from match */}
      <line
        x1="0"
        y1="50%"
        x2="24"
        y2="50%"
        className="bracket-connector"
      />
      
      {/* Vertical connector for paired matches */}
      {!isLastMatch && connectToNext && (
        <line
          className="bracket-connector"
          x1="24"
          y1="50%"
          x2="24"
          y2="150%"
        />
      )}
      
      {/* Horizontal line to next round */}
      {(connectToNext || isLastMatch) && (
        <line
          className="bracket-connector"
          x1="24"
          y1={isLastMatch ? "50%" : "100%"}
          x2="48"
          y2={isLastMatch ? "50%" : "100%"}
        />
      )}
    </svg>
  );
}

// Bracket Match Component
function BracketMatch({ match, isGrandFinal, navigateTo }) {
  const isCompleted = match.finished;
  const isLive = match.status === 'live';
  const team1Won = isCompleted && match.winner === 1;
  const team2Won = isCompleted && match.winner === 2;

  const getMatchFormat = () => {
    if (isGrandFinal) return 'Bo7';
    if (match.bestof) return `Bo${match.bestof}`;
    return 'Bo5';
  };

  const handleMatchClick = () => {
    if (match.id && navigateTo) {
      navigateTo('match-detail', { id: match.id });
    }
  };

  return (
    <div 
      className="bracket-match bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleMatchClick}
    >
      {/* Match Header */}
      <div className="px-3 py-1 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {getMatchFormat()}
        </span>
        {isLive && (
          <div className="flex items-center">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs font-medium text-green-600 dark:text-green-400">LIVE</span>
          </div>
        )}
      </div>

      {/* Teams */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        <TeamRow
          team={match.opponent1}
          score={match.opponent1?.score}
          isWinner={team1Won}
          isLoser={team2Won}
        />
        <TeamRow
          team={match.opponent2}
          score={match.opponent2?.score}
          isWinner={team2Won}
          isLoser={team1Won}
        />
      </div>

      {/* Match Time */}
      {match.date && !isCompleted && (
        <div className="px-3 py-1 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(match.date).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      )}
    </div>
  );
}

// Team Row Component
function TeamRow({ team, score, isWinner, isLoser }) {
  return (
    <div className={`
      flex items-center justify-between px-3 py-2
      ${isWinner ? 'bg-green-50 dark:bg-green-900/20' : ''}
      ${isLoser ? 'opacity-60' : ''}
    `}>
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        {team ? (
          <>
            <TeamLogo team={team} size="w-5 h-5" />
            <span className={`text-sm truncate ${
              isWinner ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
            }`}>
              {team.short_name || team.name}
            </span>
          </>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic text-sm">TBD</span>
        )}
      </div>
      
      <div className={`
        text-sm font-bold min-w-[24px] text-center
        ${isWinner ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}
      `}>
        {score !== null && score !== undefined ? score : '-'}
      </div>
    </div>
  );
}

export default SimplifiedLiquipediaBracket;