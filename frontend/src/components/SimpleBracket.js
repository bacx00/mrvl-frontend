import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks';
import { TeamLogo } from '../utils/imageUtils';
import MobileBracketVisualization from './mobile/MobileBracketVisualization';
import TabletBracketVisualization from './tablet/TabletBracketVisualization';
import BracketVisualizationClean from './BracketVisualizationClean';
import { useDeviceType } from '../hooks/useDeviceType';
import '../styles/bracket-clean.css';

function SimpleBracket({ eventId, isAdmin = false, navigateTo }) {
  const { api } = useAuth();
  const { isMobile, isTablet } = useDeviceType();
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [bracketConfig, setBracketConfig] = useState({
    format: 'single_elimination',
    seedingType: 'rating',
    matchFormat: 'bo3',
    finalsFormat: 'bo5'
  });

  useEffect(() => {
    loadBracket();
  }, [eventId]);

  const loadBracket = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/events/${eventId}/bracket`);
      if (response.data) {
        // Handle both API response formats
        const bracketData = response.data.data || response.data;
        setBracket(bracketData);
      }
    } catch (err) {
      console.error('Error loading bracket:', err);
      setError('Failed to load bracket');
    } finally {
      setLoading(false);
    }
  };

  const generateBracket = async (options = {}) => {
    const confirmMessage = bracket?.bracket?.length > 0 
      ? 'Regenerate bracket? This will delete the existing bracket and all match results.'
      : 'Generate new bracket?';
      
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setGenerating(true);
      setError(null);
      
      const response = await api.post(`/admin/events/${eventId}/generate-bracket`, {
        format: options.format || 'single_elimination',
        seeding_type: options.seedingType || 'rating',
        match_format: options.matchFormat || 'bo3',
        finals_format: options.finalsFormat || 'bo5'
      });
      
      if (response.data && response.data.success) {
        // Use the bracket data from the response immediately
        if (response.data.data && response.data.data.bracket) {
          setBracket(response.data.data);
          alert(`Bracket generated successfully! ${response.data.data.matches_created} matches created.`);
        } else {
          // Fallback to reloading if no bracket in response
          await loadBracket();
          alert('Bracket generated successfully!');
        }
      }
    } catch (err) {
      console.error('Error generating bracket:', err);
      const errorMessage = err.response?.data?.message || 'Failed to generate bracket';
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const deleteBracket = async () => {
    if (!window.confirm('Delete the entire bracket? This cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const response = await api.delete(`/admin/events/${eventId}/bracket`);
      
      if (response.data && response.data.success) {
        // Immediately clear the bracket state
        setBracket(null);
        alert('Bracket deleted successfully!');
        // Don't reload, just keep bracket as null
      }
    } catch (err) {
      console.error('Error deleting bracket:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete bracket';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  const updateMatch = async (matchId, updates) => {
    try {
      setError(null);
      const response = await api.put(`/admin/events/${eventId}/bracket/matches/${matchId}`, {
        team1_score: updates.team1_score || 0,
        team2_score: updates.team2_score || 0,
        status: updates.status || 'upcoming'
      });
      
      if (response.data && response.data.success) {
        await loadBracket(); // Reload to get updated bracket
      }
    } catch (err) {
      console.error('Error updating match:', err);
      const errorMessage = err.response?.data?.message || 'Failed to update match';
      setError(errorMessage);
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div>
      {/* Simple Admin Controls */}
      {isAdmin && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="p-12">
            <div style={{ display: 'flex', gap: '12px' }}>
              {!bracket?.bracket || (Array.isArray(bracket.bracket) && bracket.bracket.length === 0) || 
               (bracket.bracket.type === 'swiss' && (!bracket.bracket.rounds || Object.keys(bracket.bracket.rounds).length === 0)) ? (
                <button
                  onClick={() => setShowConfig(true)}
                  disabled={generating}
                  className="btn btn-primary"
                  style={{ opacity: generating ? 0.5 : 1 }}
                >
                  {generating ? 'Generating...' : 'Generate Bracket'}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowConfig(true)}
                    disabled={generating}
                    className="btn btn-secondary"
                    style={{ opacity: generating ? 0.5 : 1 }}
                  >
                    {generating ? 'Regenerating...' : 'Regenerate Bracket'}
                  </button>
                  <button
                    onClick={deleteBracket}
                    className="btn btn-primary"
                    style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
                  >
                    Delete Bracket
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple Configuration Modal */}
      {showConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', padding: 0 }}>
            <div className="p-16">
              <h3 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>Bracket Configuration</h3>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Format</label>
                <select
                  value={bracketConfig.format}
                  onChange={(e) => setBracketConfig({...bracketConfig, format: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="single_elimination">Single Elimination</option>
                  <option value="double_elimination">Double Elimination</option>
                  <option value="swiss">Swiss System</option>
                  <option value="round_robin">Round Robin</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Seeding Type</label>
                <select
                  value={bracketConfig.seedingType}
                  onChange={(e) => setBracketConfig({...bracketConfig, seedingType: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="rating">By Rating</option>
                  <option value="random">Random</option>
                  <option value="manual">Keep Current</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Match Format</label>
                <select
                  value={bracketConfig.matchFormat}
                  onChange={(e) => setBracketConfig({...bracketConfig, matchFormat: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="bo1">Best of 1</option>
                  <option value="bo3">Best of 3</option>
                  <option value="bo5">Best of 5</option>
                  <option value="bo7">Best of 7</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Finals Format</label>
                <select
                  value={bracketConfig.finalsFormat}
                  onChange={(e) => setBracketConfig({...bracketConfig, finalsFormat: e.target.value})}
                  className="form-input"
                  style={{ width: '100%' }}
                >
                  <option value="bo3">Best of 3</option>
                  <option value="bo5">Best of 5</option>
                  <option value="bo7">Best of 7</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowConfig(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfig(false);
                    generateBracket(bracketConfig);
                  }}
                  className="btn btn-primary"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simple Bracket Display */}
      {bracket && (
        (bracket.bracket && bracket.bracket.length > 0) || 
        (bracket.bracket && bracket.bracket.rounds && Object.keys(bracket.bracket.rounds).length > 0) ||
        (bracket.bracket && bracket.bracket.type === 'swiss')
      ) ? (
        <div className="card">
          <div className="p-12">
            {isMobile ? (
              <MobileBracketVisualization
                bracket={bracket}
                isAdmin={isAdmin}
                navigateTo={navigateTo}
                onMatchUpdate={updateMatch}
              />
            ) : isTablet ? (
              <TabletBracketVisualization
                bracket={bracket}
                isAdmin={isAdmin}
                navigateTo={navigateTo}
                onMatchUpdate={updateMatch}
              />
            ) : (
              <BracketVisualizationClean
                bracket={bracket}
                event={{ id: eventId, name: bracket.event_name }}
                isAdmin={isAdmin}
                navigateTo={navigateTo}
                onMatchUpdate={updateMatch}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="p-16 text-center">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
            <div className="text-muted" style={{ fontSize: '16px', marginBottom: '8px' }}>
              No bracket generated yet
            </div>
            {bracket?.teams_count >= 2 && (
              <div className="text-muted">
                {bracket.teams_count} teams registered
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BracketDisplay({ bracket, isAdmin, navigateTo, onMatchUpdate }) {
  // Handle different bracket formats
  if (bracket.bracket && bracket.bracket.type === 'swiss') {
    return <SwissBracketDisplay bracket={bracket.bracket} isAdmin={isAdmin} navigateTo={navigateTo} onMatchUpdate={onMatchUpdate} />;
  }
  
  const rounds = bracket.bracket || [];

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex space-x-8 min-w-full">
        {rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="flex-shrink-0" style={{ minWidth: '280px' }}>
            {/* Round Header */}
            <div className="text-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {round.name}
              </h3>
            </div>

            {/* Matches */}
            <div className="space-y-4">
              {round.matches.map((match, matchIndex) => (
                <Match
                  key={match.id || matchIndex}
                  match={match}
                  isAdmin={isAdmin}
                  navigateTo={navigateTo}
                  onUpdate={onMatchUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Match({ match, isAdmin, navigateTo, onUpdate }) {
  const [scores, setScores] = useState({
    team1: match.team1?.score || 0,
    team2: match.team2?.score || 0
  });
  const [editing, setEditing] = useState(false);

  const isCompleted = match.status === 'completed';
  const hasTeams = match.team1 && match.team2;

  const handleScoreSubmit = () => {
    if (scores.team1 === scores.team2) {
      alert('Scores cannot be tied');
      return;
    }

    onUpdate(match.id, {
      team1_score: scores.team1,
      team2_score: scores.team2,
      status: 'completed'
    });
    setEditing(false);
  };

  const getTeamClasses = (team, isWinner) => {
    if (!isCompleted) return '';
    return isWinner ? 'bg-green-50 dark:bg-green-900/20' : 'opacity-60';
  };

  const isWinner = (teamNumber) => {
    if (!isCompleted) return false;
    return teamNumber === 1 ? 
      match.team1?.score > match.team2?.score : 
      match.team2?.score > match.team1?.score;
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => match.id && navigateTo && navigateTo('match-detail', { id: match.id })}
    >
      {/* Match Header */}
      {match.status === 'live' && (
        <div className="px-3 py-1 bg-red-600 text-white text-xs font-bold text-center">
          LIVE
        </div>
      )}

      {/* Team 1 */}
      <div className={`p-3 border-b border-gray-100 dark:border-gray-700 ${getTeamClasses(match.team1, isWinner(1))}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            {match.team1 ? (
              <>
                <TeamLogo team={match.team1} size="w-6 h-6" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {match.team1.name}
                </span>
              </>
            ) : (
              <span className="text-gray-400 italic">TBD</span>
            )}
          </div>
          
          {isAdmin && editing && hasTeams ? (
            <input
              type="number"
              value={scores.team1}
              onChange={(e) => setScores({ ...scores, team1: parseInt(e.target.value) || 0 })}
              onClick={(e) => e.stopPropagation()}
              className="w-16 px-2 py-1 border rounded text-center"
              min="0"
              max="99"
            />
          ) : (
            <span className={`font-bold text-lg ${isWinner(1) ? 'text-green-600' : ''}`}>
              {match.team1?.score ?? '-'}
            </span>
          )}
        </div>
      </div>

      {/* Team 2 */}
      <div className={`p-3 ${getTeamClasses(match.team2, isWinner(2))}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1">
            {match.team2 ? (
              <>
                <TeamLogo team={match.team2} size="w-6 h-6" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {match.team2.name}
                </span>
              </>
            ) : match.is_bye ? (
              <span className="text-gray-500 italic">BYE</span>
            ) : (
              <span className="text-gray-400 italic">TBD</span>
            )}
          </div>
          
          {isAdmin && editing && hasTeams ? (
            <input
              type="number"
              value={scores.team2}
              onChange={(e) => setScores({ ...scores, team2: parseInt(e.target.value) || 0 })}
              onClick={(e) => e.stopPropagation()}
              className="w-16 px-2 py-1 border rounded text-center"
              min="0"
              max="99"
            />
          ) : (
            <span className={`font-bold text-lg ${isWinner(2) ? 'text-green-600' : ''}`}>
              {match.team2?.score ?? '-'}
            </span>
          )}
        </div>
      </div>

      {/* Match Format Display */}
      {match.format && (
        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">{match.format}</span>
        </div>
      )}

      {/* Admin Controls */}
      {isAdmin && hasTeams && !isCompleted && (
        <div 
          className="px-3 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {editing ? (
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleScoreSubmit}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Update Score
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SwissBracketDisplay({ bracket, isAdmin, navigateTo, onMatchUpdate }) {
  const rounds = bracket.rounds || {};
  const standings = bracket.standings || [];

  return (
    <div className="space-y-8">
      {/* Swiss Standings */}
      {standings.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Swiss Standings</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Team</th>
                  <th className="text-center py-2">W-L</th>
                  <th className="text-center py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr key={standing.team_id} className="border-b dark:border-gray-700">
                    <td className="py-2">{index + 1}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <TeamLogo 
                          src={standing.team_logo} 
                          alt={standing.team_name}
                          size="sm"
                        />
                        <span className="font-medium">{standing.team_name}</span>
                      </div>
                    </td>
                    <td className="text-center py-2">
                      {standing.wins}-{standing.losses}
                    </td>
                    <td className="text-center py-2">{standing.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Swiss Rounds */}
      <div className="overflow-x-auto pb-4">
        <div className="inline-flex space-x-8 min-w-full">
          {Object.entries(rounds).map(([roundNum, matches]) => (
            <div key={roundNum} className="flex-shrink-0" style={{ minWidth: '280px' }}>
              <div className="text-center mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Round {roundNum}
                </h3>
              </div>
              <div className="space-y-4">
                {matches.map((match, matchIndex) => (
                  <Match
                    key={match.id || matchIndex}
                    match={match}
                    isAdmin={isAdmin}
                    navigateTo={navigateTo}
                    onUpdate={onMatchUpdate}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SimpleBracket;