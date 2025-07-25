import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import BracketVisualization from '../BracketVisualization';
import VLRBracketVisualization from '../VLRBracketVisualization';
import MarvelRivalsBracketVisualization from '../MarvelRivalsBracketVisualization';
import { TeamLogo } from '../../utils/imageUtils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

function EnhancedBracketManager({ eventId, navigateTo }) {
  const [event, setEvent] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seedingMode, setSeedingMode] = useState('rating'); // rating, manual, random
  const [showSeedingModal, setShowSeedingModal] = useState(false);
  const [manualSeeding, setManualSeeding] = useState([]);
  const [bracketHistory, setBracketHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const { api, isAdmin } = useAuth();

  useEffect(() => {
    if (eventId) {
      fetchEventData();
      fetchBracketHistory();
    }
  }, [eventId]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEventData = async () => {
    try {
      setLoading(true);
      
      // Fetch event details
      const eventRes = await api.get(`/events/${eventId}`);
      const eventData = eventRes.data?.data || eventRes.data;
      setEvent(eventData);
      
      // Fetch teams
      const teamsRes = await api.get(`/events/${eventId}/teams`);
      const teamsData = teamsRes.data?.data || teamsRes.data || [];
      setTeams(teamsData);
      
      // Fetch bracket
      const bracketRes = await api.get(`/events/${eventId}/bracket`);
      const bracketData = bracketRes.data?.data || bracketRes.data;
      console.log('🎯 ADMIN Bracket API response:', bracketData);
      if (bracketData && bracketData.bracket) {
        console.log('✅ ADMIN Setting bracket state:', bracketData.bracket);
        setBracket(bracketData.bracket);
      } else {
        console.log('⚠️ ADMIN No bracket data in response');
        setBracket(null);
      }
      
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBracketHistory = async () => {
    try {
      const response = await api.get(`/admin/events/${eventId}/bracket-history`);
      setBracketHistory(response.data?.data || []);
    } catch (error) {
      console.error('Error fetching bracket history:', error);
    }
  };

  const generateBracket = async () => {
    try {
      setRegenerating(true);
      
      const payload = {
        seeding_type: seedingMode,
        team_ids: seedingMode === 'manual' ? manualSeeding.map(t => t.id) : teams.map(t => t.id),
        include_third_place: event.format === 'single_elimination' && teams.length >= 4,
        save_history: true
      };
      
      await api.post(`/admin/events/${eventId}/generate-bracket`, payload);
      
      // Refresh data
      await fetchEventData();
      await fetchBracketHistory();
      
      alert('Bracket generated successfully!');
      setShowSeedingModal(false);
    } catch (error) {
      console.error('Error generating bracket:', error);
      alert('Failed to generate bracket. Please try again.');
    } finally {
      setRegenerating(false);
    }
  };

  const resetBracket = async () => {
    if (!window.confirm('Are you sure you want to reset the bracket? This will remove all match results.')) {
      return;
    }
    
    try {
      await api.post(`/admin/events/${eventId}/reset-bracket`);
      await fetchEventData();
      alert('Bracket reset successfully!');
    } catch (error) {
      console.error('Error resetting bracket:', error);
      alert('Failed to reset bracket.');
    }
  };

  const exportBracketAsPDF = async () => {
    const bracketElement = document.getElementById('bracket-visualization');
    if (!bracketElement) return;
    
    try {
      const canvas = await html2canvas(bracketElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const pageHeight = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${event.name}-bracket.pdf`);
    } catch (error) {
      console.error('Error exporting bracket:', error);
      alert('Failed to export bracket as PDF.');
    }
  };

  const exportBracketAsImage = async () => {
    const bracketElement = document.getElementById('bracket-visualization');
    if (!bracketElement) return;
    
    try {
      const canvas = await html2canvas(bracketElement, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${event.name}-bracket.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    } catch (error) {
      console.error('Error exporting bracket:', error);
      alert('Failed to export bracket as image.');
    }
  };

  const restoreBracketVersion = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore this bracket version? Current bracket will be overwritten.')) {
      return;
    }
    
    try {
      await api.post(`/admin/events/${eventId}/restore-bracket/${versionId}`);
      await fetchEventData();
      setShowHistory(false);
      alert('Bracket version restored successfully!');
    } catch (error) {
      console.error('Error restoring bracket:', error);
      alert('Failed to restore bracket version.');
    }
  };


  const moveTeamInSeeding = (fromIndex, toIndex) => {
    const newSeeding = [...manualSeeding];
    const [removed] = newSeeding.splice(fromIndex, 1);
    newSeeding.splice(toIndex, 0, removed);
    setManualSeeding(newSeeding);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading bracket data...</div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 dark:text-gray-400">Event not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {event.name} - Bracket Management
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Format: {event.format?.replace(/_/g, ' ').toUpperCase()} | Teams: {teams.length}/{event.max_teams}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Export Options */}
          <div className="relative group">
            <button className="btn btn-secondary">
              Export Bracket ↓
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={exportBracketAsPDF}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                📄 Export as PDF
              </button>
              <button
                onClick={exportBracketAsImage}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                🖼️ Export as Image
              </button>
            </div>
          </div>
          
          {/* Bracket Actions */}
          {isAdmin && (
            <>
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="btn btn-secondary"
              >
                📜 History ({bracketHistory.length})
              </button>
              <button
                onClick={() => setShowSeedingModal(true)}
                className="btn btn-primary"
              >
                🔄 Regenerate Bracket
              </button>
              <button
                onClick={resetBracket}
                className="btn bg-red-600 text-white hover:bg-red-700"
              >
                ⚠️ Reset Bracket
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bracket History Modal */}
      {showHistory && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Bracket History
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {bracketHistory.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    Version {version.version_number}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(version.created_at).toLocaleString()} by {version.created_by_name}
                  </div>
                  {version.changes && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {version.changes}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => restoreBracketVersion(version.id)}
                  className="btn btn-sm btn-secondary"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seeding Modal */}
      {showSeedingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Bracket Generation Settings
            </h3>
            
            {/* Seeding Mode Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Seeding Method</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setSeedingMode('rating')}
                  className={`p-3 rounded border ${seedingMode === 'rating' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600'}`}
                >
                  <div className="font-medium">By Rating</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Teams seeded by ELO</div>
                </button>
                <button
                  onClick={() => {
                    setSeedingMode('manual');
                    setManualSeeding(teams.sort((a, b) => (b.rating || 0) - (a.rating || 0)));
                  }}
                  className={`p-3 rounded border ${seedingMode === 'manual' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600'}`}
                >
                  <div className="font-medium">Manual</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Drag to reorder</div>
                </button>
                <button
                  onClick={() => setSeedingMode('random')}
                  className={`p-3 rounded border ${seedingMode === 'random' 
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20' 
                    : 'border-gray-300 dark:border-gray-600'}`}
                >
                  <div className="font-medium">Random</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Randomize seeds</div>
                </button>
              </div>
            </div>
            
            {/* Manual Seeding Interface */}
            {seedingMode === 'manual' && (
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Drag teams to reorder seeding</label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {manualSeeding.map((team, index) => (
                    <div
                      key={team.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                        moveTeamInSeeding(fromIndex, index);
                      }}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded cursor-move hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-gray-500">#{index + 1}</span>
                        <TeamLogo team={team} size="w-8 h-8" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{team.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Rating: {team.rating || 1000} | {team.region}
                          </div>
                        </div>
                      </div>
                      <span className="text-gray-400">☰</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Additional Options */}
            <div className="mb-6 space-y-3">
              {event.format === 'single_elimination' && teams.length >= 4 && (
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="form-checkbox" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Include 3rd place match
                  </span>
                </label>
              )}
              
              {event.format === 'double_elimination' && (
                <label className="flex items-center space-x-3">
                  <input type="checkbox" defaultChecked className="form-checkbox" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Grand Final bracket reset if needed
                  </span>
                </label>
              )}
              
              <label className="flex items-center space-x-3">
                <input type="checkbox" defaultChecked className="form-checkbox" />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Save current bracket to history before regenerating
                </span>
              </label>
            </div>
            
            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSeedingModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={generateBracket}
                disabled={regenerating}
                className="btn btn-primary"
              >
                {regenerating ? 'Generating...' : 'Generate Bracket'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Visualization */}
      <div id="bracket-visualization" className="card p-6">
        {(console.log('🔍 ADMIN Bracket state at render:', bracket), bracket) ? (
          <MarvelRivalsBracketVisualization
            bracket={bracket}
            event={event}
            navigateTo={navigateTo}
            isAdmin={isAdmin}
            onMatchUpdate={async (matchId, updates) => {
              try {
                await api.put(`/admin/events/${eventId}/bracket/matches/${matchId}`, updates);
                await fetchEventData();
              } catch (error) {
                console.error('Error updating match:', error);
                alert('Failed to update match.');
              }
            }}
            showPredictions={false}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 dark:text-gray-400 mb-4">
              No bracket generated yet
            </div>
            {isAdmin && teams.length >= 2 && (
              <button
                onClick={() => setShowSeedingModal(true)}
                className="btn btn-primary"
              >
                Generate Bracket
              </button>
            )}
          </div>
        )}
      </div>

      {/* Third Place Match (if applicable) */}
      {bracket?.third_place_match && (
        <div className="card p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            3rd Place Match
          </h3>
          <div className="max-w-md mx-auto">
            <BracketMatch
              match={bracket.third_place_match}
              navigateTo={navigateTo}
              isAdmin={isAdmin}
              onMatchUpdate={async (matchId, updates) => {
                try {
                  await api.put(`/admin/events/${eventId}/bracket/matches/${matchId}`, updates);
                  await fetchEventData();
                } catch (error) {
                  console.error('Error updating match:', error);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Individual match component for third place
function BracketMatch({ match, navigateTo, isAdmin, onMatchUpdate }) {
  const isCompleted = match.status === 'completed';
  const isLive = match.status === 'live';
  const team1Won = isCompleted && match.team1_score > match.team2_score;
  const team2Won = isCompleted && match.team2_score > match.team1_score;

  return (
    <div className={`border rounded-lg overflow-hidden transition-all ${
      isLive ? 'border-red-500 shadow-lg' : 'border-gray-300 dark:border-gray-600'
    }`}>
      {/* Teams */}
      <div className="bg-white dark:bg-gray-900">
        {/* Team 1 */}
        <div className={`flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 ${
          team1Won ? 'bg-green-50 dark:bg-green-900/20' : ''
        }`}>
          <div className="flex items-center space-x-2">
            {match.team1 && (
              <>
                <TeamLogo team={match.team1} size="w-6 h-6" />
                <span className="font-medium">{match.team1.name}</span>
              </>
            )}
          </div>
          <span className={`font-bold text-lg ${team1Won ? 'text-green-600' : ''}`}>
            {match.team1_score ?? '-'}
          </span>
        </div>

        {/* Team 2 */}
        <div className={`flex items-center justify-between p-3 ${
          team2Won ? 'bg-green-50 dark:bg-green-900/20' : ''
        }`}>
          <div className="flex items-center space-x-2">
            {match.team2 && (
              <>
                <TeamLogo team={match.team2} size="w-6 h-6" />
                <span className="font-medium">{match.team2.name}</span>
              </>
            )}
          </div>
          <span className={`font-bold text-lg ${team2Won ? 'text-green-600' : ''}`}>
            {match.team2_score ?? '-'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default EnhancedBracketManager;