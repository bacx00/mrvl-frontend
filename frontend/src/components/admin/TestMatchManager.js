import React, { useState } from 'react';
import { useAuth } from '../../hooks';

/**
 *  TEST MATCH MANAGER
 * Quick tool to create test matches for all formats
 */
const TestMatchManager = () => {
  const [loading, setLoading] = useState(false);
  const [testMatches, setTestMatches] = useState([]);
  const [message, setMessage] = useState('');
  const { api } = useAuth();

  const createTestMatches = async (clean = false) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await api.post('/test/matches', { clean });
      
      if (response.data.success) {
        setTestMatches(response.data.matches);
        setMessage(` Created ${response.data.matches.length} test matches!`);
        
        // Show live matches
        if (response.data.live_matches.length > 0) {
          setMessage(prev => prev + `  ${response.data.live_matches.length} matches are LIVE!`);
        }
      }
    } catch (error) {
      setMessage(` Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const simulateUpdate = async (matchId, type) => {
    try {
      const response = await api.post(`/test/matches/${matchId}/simulate`, { type });
      
      if (response.data.success) {
        setMessage(` Simulated ${type} update for match #${matchId}`);
      }
    } catch (error) {
      setMessage(` Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
         Test Match Manager
      </h2>
      
      <div className="mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create test matches for all formats (BO1, BO3, BO5, BO7, BO9) with live scoring data.
        </p>
        
        <div className="flex gap-4">
          <button
            onClick={() => createTestMatches(false)}
            disabled={loading}
            className="btn bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Test Matches'}
          </button>
          
          <button
            onClick={() => createTestMatches(true)}
            disabled={loading}
            className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Cleaning...' : 'Clean & Create'}
          </button>
        </div>
        
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.includes('') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {message}
          </div>
        )}
      </div>

      {testMatches.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Created Test Matches:
          </h3>
          
          <div className="grid gap-4">
            {testMatches.map(match => (
              <div key={match.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl font-bold text-red-600">
                      {match.format}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${
                      match.status === 'live' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {match.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    Match #{match.id}
                  </span>
                </div>
                
                <div className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {match.team1.name} vs {match.team2.name}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Score: {match.team1.score}-{match.team2.score}</span>
                  <span>Maps: {match.maps_count}</span>
                  <span>Round: {match.round}</span>
                </div>
                
                <div className="mt-3 flex gap-2">
                  <a
                    href={match.live_scoring_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm bg-green-600 text-white hover:bg-green-700"
                  >
                    Open Live Scoring
                  </a>
                  
                  {match.status === 'live' && (
                    <>
                      <button
                        onClick={() => simulateUpdate(match.id, 'score')}
                        className="btn btn-sm bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Simulate Score
                      </button>
                      <button
                        onClick={() => simulateUpdate(match.id, 'hero_swap')}
                        className="btn btn-sm bg-purple-600 text-white hover:bg-purple-700"
                      >
                        Simulate Hero Swap
                      </button>
                      <button
                        onClick={() => simulateUpdate(match.id, 'player_stats')}
                        className="btn btn-sm bg-yellow-600 text-white hover:bg-yellow-700"
                      >
                        Simulate Stats
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h4 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
           Test Features:
        </h4>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-300">
          <li>• All formats: BO1, BO3, BO5, BO7, BO9</li>
          <li>• All game modes: Domination, Convoy, Convergence</li>
          <li>• 39 Marvel Rivals heroes with realistic stats</li>
          <li>• Live scoring with real-time updates</li>
          <li>• Hero switching functionality</li>
          <li>• Player performance tracking</li>
          <li>• Timer and preparation phase</li>
          <li>• Cross-tab synchronization</li>
        </ul>
      </div>
    </div>
  );
};

export default TestMatchManager;