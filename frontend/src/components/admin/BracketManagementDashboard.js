import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function BracketManagementDashboard({ eventId, onBracketGenerated }) {
  const [bracketData, setBracketData] = useState(null);
  const [generateForm, setGenerateForm] = useState({
    format: 'single_elimination',
    seeding_method: 'rating',
    randomize_seeds: false,
    best_of: 'bo3',
    third_place_match: false,
    bracket_reset: true,
    groups: 4,
    teams_per_group: 4,
    swiss_rounds: null
  });
  const [loading, setLoading] = useState(false);
  const [activeTeams, setActiveTeams] = useState([]);
  const [bracketAnalysis, setBracketAnalysis] = useState(null);
  const { api } = useAuth();

  useEffect(() => {
    if (eventId) {
      fetchBracketData();
      fetchEventTeams();
      fetchBracketAnalysis();
    }
  }, [eventId]);

  const fetchBracketData = async () => {
    try {
      const response = await api.get(`/events/${eventId}/comprehensive-bracket`);
      setBracketData(response.data.data);
    } catch (error) {
      console.error('Error fetching bracket data:', error);
    }
  };

  const fetchEventTeams = async () => {
    try {
      const response = await api.get(`/events/${eventId}`);
      setActiveTeams(response.data.data.teams || []);
    } catch (error) {
      console.error('Error fetching event teams:', error);
    }
  };

  const fetchBracketAnalysis = async () => {
    try {
      const response = await api.get(`/events/${eventId}/bracket-analysis`);
      setBracketAnalysis(response.data.data);
    } catch (error) {
      console.error('Error fetching bracket analysis:', error);
    }
  };

  const handleGenerateBracket = async () => {
    if (activeTeams.length < 2) {
      alert('Need at least 2 teams to generate a bracket');
      return;
    }

    setLoading(true);
    try {
      // Calculate Swiss rounds if not set
      if (generateForm.format === 'swiss' && !generateForm.swiss_rounds) {
        generateForm.swiss_rounds = Math.ceil(Math.log2(activeTeams.length));
      }

      const response = await api.post(
        `/admin/events/${eventId}/comprehensive-bracket`,
        generateForm
      );

      if (response.data.success) {
        await fetchBracketData();
        if (onBracketGenerated) {
          onBracketGenerated(response.data.data);
        }
        alert('Bracket generated successfully!');
      }
    } catch (error) {
      console.error('Error generating bracket:', error);
      alert('Failed to generate bracket: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateNextSwissRound = async () => {
    if (generateForm.format !== 'swiss') return;

    setLoading(true);
    try {
      const response = await api.post(`/admin/events/${eventId}/swiss/next-round`);
      if (response.data.success) {
        await fetchBracketData();
        alert(`Swiss Round ${response.data.data.round} generated successfully!`);
      }
    } catch (error) {
      console.error('Error generating next Swiss round:', error);
      alert('Failed to generate next round: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getFormatDescription = (format) => {
    const descriptions = {
      single_elimination: 'Single loss eliminates teams. Most straightforward format.',
      double_elimination: 'Teams have two lives. Most fair for competitive integrity.',
      swiss: 'Teams play multiple rounds with similar-skill opponents. Best for ranking.',
      round_robin: 'Every team plays every other team. Most comprehensive.',
      group_stage: 'Teams divided into groups, then playoff. Good for large tournaments.'
    };
    return descriptions[format] || '';
  };

  const getSeedingDescription = (method) => {
    const descriptions = {
      random: 'Teams are randomly ordered',
      rating: 'Teams ordered by current rating/ranking',
      manual: 'Teams ordered by existing seed positions',
      balanced: 'Teams distributed to balance bracket strength'
    };
    return descriptions[method] || '';
  };

  return (
    <div className="bracket-management-dashboard space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Bracket Management Dashboard
        </h2>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="stat-number">{activeTeams.length}</div>
            <div className="stat-label">Active Teams</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{bracketData?.metadata?.total_matches || 0}</div>
            <div className="stat-label">Total Matches</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{bracketData?.metadata?.completed_matches || 0}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {bracketData?.metadata?.tournament_progress ? 
                Math.round(bracketData.metadata.tournament_progress) + '%' : '0%'}
            </div>
            <div className="stat-label">Progress</div>
          </div>
        </div>
      </div>

      {/* Bracket Generation Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Generate Tournament Bracket
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Format Selection */}
          <div className="form-section">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tournament Format
            </label>
            <select
              value={generateForm.format}
              onChange={(e) => setGenerateForm({...generateForm, format: e.target.value})}
              className="form-select w-full"
            >
              <option value="single_elimination">Single Elimination</option>
              <option value="double_elimination">Double Elimination</option>
              <option value="swiss">Swiss System</option>
              <option value="round_robin">Round Robin</option>
              <option value="group_stage">Group Stage + Playoffs</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getFormatDescription(generateForm.format)}
            </p>
          </div>

          {/* Seeding Method */}
          <div className="form-section">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seeding Method
            </label>
            <select
              value={generateForm.seeding_method}
              onChange={(e) => setGenerateForm({...generateForm, seeding_method: e.target.value})}
              className="form-select w-full"
            >
              <option value="rating">By Rating</option>
              <option value="manual">Manual Seeding</option>
              <option value="random">Random</option>
              <option value="balanced">Balanced Distribution</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {getSeedingDescription(generateForm.seeding_method)}
            </p>
          </div>

          {/* Match Format */}
          <div className="form-section">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Match Format
            </label>
            <select
              value={generateForm.best_of}
              onChange={(e) => setGenerateForm({...generateForm, best_of: e.target.value})}
              className="form-select w-full"
            >
              <option value="bo1">Best of 1</option>
              <option value="bo3">Best of 3</option>
              <option value="bo5">Best of 5</option>
            </select>
          </div>

          {/* Swiss Rounds (Swiss format only) */}
          {generateForm.format === 'swiss' && (
            <div className="form-section">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Swiss Rounds
              </label>
              <input
                type="number"
                min="3"
                max="10"
                value={generateForm.swiss_rounds || Math.ceil(Math.log2(activeTeams.length))}
                onChange={(e) => setGenerateForm({...generateForm, swiss_rounds: parseInt(e.target.value)})}
                className="form-input w-full"
                placeholder={`Recommended: ${Math.ceil(Math.log2(activeTeams.length))}`}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Recommended: {Math.ceil(Math.log2(activeTeams.length))} rounds for {activeTeams.length} teams
              </p>
            </div>
          )}

          {/* Group Settings (Group Stage only) */}
          {generateForm.format === 'group_stage' && (
            <>
              <div className="form-section">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Groups
                </label>
                <select
                  value={generateForm.groups}
                  onChange={(e) => setGenerateForm({...generateForm, groups: parseInt(e.target.value)})}
                  className="form-select w-full"
                >
                  <option value="2">2 Groups</option>
                  <option value="4">4 Groups</option>
                  <option value="6">6 Groups</option>
                  <option value="8">8 Groups</option>
                </select>
              </div>

              <div className="form-section">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teams per Group
                </label>
                <select
                  value={generateForm.teams_per_group}
                  onChange={(e) => setGenerateForm({...generateForm, teams_per_group: parseInt(e.target.value)})}
                  className="form-select w-full"
                >
                  <option value="3">3 Teams</option>
                  <option value="4">4 Teams</option>
                  <option value="5">5 Teams</option>
                  <option value="6">6 Teams</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Advanced Options */}
        <div className="advanced-options mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Advanced Options
          </h4>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={generateForm.randomize_seeds}
                onChange={(e) => setGenerateForm({...generateForm, randomize_seeds: e.target.checked})}
                className="form-checkbox mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Randomize Seeds</span>
            </label>

            {generateForm.format === 'single_elimination' && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateForm.third_place_match}
                  onChange={(e) => setGenerateForm({...generateForm, third_place_match: e.target.checked})}
                  className="form-checkbox mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">3rd Place Match</span>
              </label>
            )}

            {generateForm.format === 'double_elimination' && (
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={generateForm.bracket_reset}
                  onChange={(e) => setGenerateForm({...generateForm, bracket_reset: e.target.checked})}
                  className="form-checkbox mr-2"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Bracket Reset</span>
              </label>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activeTeams.length} teams ready • 
            {generateForm.format === 'swiss' && ` ${generateForm.swiss_rounds || Math.ceil(Math.log2(activeTeams.length))} rounds planned`}
            {generateForm.format === 'group_stage' && ` ${generateForm.groups} groups of ${generateForm.teams_per_group}`}
            {generateForm.format === 'round_robin' && ` ${(activeTeams.length * (activeTeams.length - 1)) / 2} total matches`}
          </div>
          
          <div className="flex gap-3">
            {/* Swiss Next Round Button */}
            {generateForm.format === 'swiss' && bracketData?.bracket?.current_round > 0 && (
              <button
                onClick={handleGenerateNextSwissRound}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Next Swiss Round'}
              </button>
            )}

            {/* Main Generate Button */}
            <button
              onClick={handleGenerateBracket}
              disabled={loading || activeTeams.length < 2}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Bracket'}
            </button>
          </div>
        </div>
      </div>

      {/* Current Bracket Status */}
      {bracketData && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Bracket Status
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tournament Info */}
            <div className="tournament-info">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tournament Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Format:</span>
                  <span className="font-medium">{bracketData.bracket?.format}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Teams:</span>
                  <span className="font-medium">{bracketData.metadata?.total_teams}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Round:</span>
                  <span className="font-medium">{bracketData.metadata?.current_round || 1}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Total Rounds:</span>
                  <span className="font-medium">{bracketData.bracket?.total_rounds}</span>
                </div>
              </div>
            </div>

            {/* Match Progress */}
            <div className="match-progress">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Match Progress</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                  <span className="font-medium text-green-600">
                    {bracketData.metadata?.completed_matches || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Remaining:</span>
                  <span className="font-medium text-blue-600">
                    {bracketData.metadata?.remaining_matches || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${bracketData.metadata?.tournament_progress || 0}%`
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  {Math.round(bracketData.metadata?.tournament_progress || 0)}% Complete
                </div>
              </div>
            </div>

            {/* Bracket Integrity */}
            <div className="bracket-integrity">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Bracket Health</h4>
              <div className="space-y-2">
                {bracketData.metadata?.bracket_integrity?.valid ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Bracket Valid
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Issues Detected
                  </div>
                )}
                
                {bracketData.metadata?.estimated_completion && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Est. completion: {new Date(bracketData.metadata.estimated_completion).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Analysis */}
      {bracketAnalysis && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Bracket Analysis
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Format Analysis */}
            <div className="analysis-section">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Format Analysis</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {bracketAnalysis.format_analysis?.description || 'No analysis available'}
              </div>
            </div>

            {/* Seeding Effectiveness */}
            <div className="analysis-section">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Seeding Effectiveness</h4>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {bracketAnalysis.seeding_analysis?.effectiveness || 'No analysis available'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BracketManagementDashboard;