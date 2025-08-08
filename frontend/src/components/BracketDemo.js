import React, { useState } from 'react';
import BracketVisualizationClean from './BracketVisualizationClean';

function BracketDemo() {
  const [selectedFormat, setSelectedFormat] = useState('single_elimination');

  // Sample data for different bracket formats
  const sampleBrackets = {
    single_elimination: {
      format: 'single_elimination',
      event_name: 'Marvel Rivals Championship',
      bracket: [
        {
          name: 'Quarter-Finals',
          matches: [
            {
              id: 1,
              match_number: 1,
              team1: { id: 1, name: 'Cloud9', logo: '/teams/cloud9-logo.png' },
              team2: { id: 2, name: 'Sentinels', logo: '/teams/sentinels-logo.png' },
              team1_score: 2,
              team2_score: 1,
              status: 'completed',
              format: 'BO3',
              scheduled_at: '2025-01-15T18:00:00Z'
            },
            {
              id: 2,
              match_number: 2,
              team1: { id: 3, name: 'GenG', logo: '/teams/geng-logo.png' },
              team2: { id: 4, name: 'Fnatic', logo: '/teams/fnatic-logo.png' },
              team1_score: 0,
              team2_score: 2,
              status: 'completed',
              format: 'BO3',
              scheduled_at: '2025-01-15T19:00:00Z'
            },
            {
              id: 3,
              match_number: 3,
              team1: { id: 5, name: 'Liquid', logo: '/teams/liquid-logo.png' },
              team2: { id: 6, name: 'NRG', logo: '/teams/nrg-logo.png' },
              team1_score: null,
              team2_score: null,
              status: 'live',
              format: 'BO3',
              scheduled_at: '2025-01-15T20:00:00Z'
            },
            {
              id: 4,
              match_number: 4,
              team1: { id: 7, name: 'G2', logo: '/teams/g2-logo.png' },
              team2: { id: 8, name: '100T', logo: '/teams/100t-logo.png' },
              team1_score: null,
              team2_score: null,
              status: 'upcoming',
              format: 'BO3',
              scheduled_at: '2025-01-15T21:00:00Z'
            }
          ]
        },
        {
          name: 'Semi-Finals',
          matches: [
            {
              id: 5,
              match_number: 5,
              team1: { id: 1, name: 'Cloud9', logo: '/teams/cloud9-logo.png' },
              team2: { id: 4, name: 'Fnatic', logo: '/teams/fnatic-logo.png' },
              team1_score: null,
              team2_score: null,
              status: 'upcoming',
              format: 'BO5'
            },
            {
              id: 6,
              match_number: 6,
              team1: null,
              team2: null,
              team1_score: null,
              team2_score: null,
              status: 'upcoming',
              format: 'BO5'
            }
          ]
        },
        {
          name: 'Grand Final',
          matches: [
            {
              id: 7,
              match_number: 7,
              team1: null,
              team2: null,
              team1_score: null,
              team2_score: null,
              status: 'upcoming',
              format: 'BO7'
            }
          ]
        }
      ]
    },
    double_elimination: {
      format: 'double_elimination',
      event_name: 'Marvel Rivals Invitational',
      upper_bracket: [
        {
          name: 'Upper Quarter-Finals',
          matches: [
            {
              id: 1,
              team1: { id: 1, name: 'Cloud9', logo: '/teams/cloud9-logo.png' },
              team2: { id: 2, name: 'Sentinels', logo: '/teams/sentinels-logo.png' },
              team1_score: 2,
              team2_score: 0,
              status: 'completed',
              format: 'BO3'
            },
            {
              id: 2,
              team1: { id: 3, name: 'GenG', logo: '/teams/geng-logo.png' },
              team2: { id: 4, name: 'Fnatic', logo: '/teams/fnatic-logo.png' },
              team1_score: 1,
              team2_score: 2,
              status: 'completed',
              format: 'BO3'
            }
          ]
        },
        {
          name: 'Upper Semi-Finals',
          matches: [
            {
              id: 3,
              team1: { id: 1, name: 'Cloud9', logo: '/teams/cloud9-logo.png' },
              team2: { id: 4, name: 'Fnatic', logo: '/teams/fnatic-logo.png' },
              team1_score: null,
              team2_score: null,
              status: 'upcoming',
              format: 'BO5'
            }
          ]
        }
      ],
      lower_bracket: [
        {
          name: 'Lower Round 1',
          matches: [
            {
              id: 4,
              team1: { id: 2, name: 'Sentinels', logo: '/teams/sentinels-logo.png' },
              team2: { id: 3, name: 'GenG', logo: '/teams/geng-logo.png' },
              team1_score: null,
              team2_score: null,
              status: 'upcoming',
              format: 'BO3'
            }
          ]
        }
      ],
      grand_final: {
        id: 5,
        team1: null,
        team2: null,
        team1_score: null,
        team2_score: null,
        status: 'upcoming',
        format: 'BO7'
      }
    },
    swiss: {
      format: 'swiss',
      event_name: 'Marvel Rivals Swiss Tournament',
      standings: [
        { team_id: 1, team_name: 'Cloud9', team_logo: '/teams/cloud9-logo.png', wins: 3, losses: 0, points: 9 },
        { team_id: 2, team_name: 'Sentinels', team_logo: '/teams/sentinels-logo.png', wins: 2, losses: 1, points: 6 },
        { team_id: 3, team_name: 'GenG', team_logo: '/teams/geng-logo.png', wins: 2, losses: 1, points: 6 },
        { team_id: 4, team_name: 'Fnatic', team_logo: '/teams/fnatic-logo.png', wins: 1, losses: 2, points: 3 },
        { team_id: 5, team_name: 'Liquid', team_logo: '/teams/liquid-logo.png', wins: 1, losses: 2, points: 3 },
        { team_id: 6, team_name: 'NRG', team_logo: '/teams/nrg-logo.png', wins: 0, losses: 3, points: 0 }
      ],
      rounds: {
        1: [
          {
            id: 1,
            team1: { id: 1, name: 'Cloud9', logo: '/teams/cloud9-logo.png' },
            team2: { id: 2, name: 'Sentinels', logo: '/teams/sentinels-logo.png' },
            team1_score: 2,
            team2_score: 1,
            status: 'completed',
            format: 'BO3'
          },
          {
            id: 2,
            team1: { id: 3, name: 'GenG', logo: '/teams/geng-logo.png' },
            team2: { id: 4, name: 'Fnatic', logo: '/teams/fnatic-logo.png' },
            team1_score: 2,
            team2_score: 0,
            status: 'completed',
            format: 'BO3'
          },
          {
            id: 3,
            team1: { id: 5, name: 'Liquid', logo: '/teams/liquid-logo.png' },
            team2: { id: 6, name: 'NRG', logo: '/teams/nrg-logo.png' },
            team1_score: 2,
            team2_score: 1,
            status: 'completed',
            format: 'BO3'
          }
        ],
        2: [
          {
            id: 4,
            team1: { id: 1, name: 'Cloud9', logo: '/teams/cloud9-logo.png' },
            team2: { id: 3, name: 'GenG', logo: '/teams/geng-logo.png' },
            team1_score: 2,
            team2_score: 0,
            status: 'completed',
            format: 'BO3'
          },
          {
            id: 5,
            team1: { id: 2, name: 'Sentinels', logo: '/teams/sentinels-logo.png' },
            team2: { id: 5, name: 'Liquid', logo: '/teams/liquid-logo.png' },
            team1_score: 1,
            team2_score: 2,
            status: 'completed',
            format: 'BO3'
          },
          {
            id: 6,
            team1: { id: 4, name: 'Fnatic', logo: '/teams/fnatic-logo.png' },
            team2: { id: 6, name: 'NRG', logo: '/teams/nrg-logo.png' },
            team1_score: 2,
            team2_score: 1,
            status: 'completed',
            format: 'BO3'
          }
        ],
        3: [
          {
            id: 7,
            team1: { id: 1, name: 'Cloud9', logo: '/teams/cloud9-logo.png' },
            team2: { id: 5, name: 'Liquid', logo: '/teams/liquid-logo.png' },
            team1_score: null,
            team2_score: null,
            status: 'live',
            format: 'BO3'
          },
          {
            id: 8,
            team1: { id: 2, name: 'Sentinels', logo: '/teams/sentinels-logo.png' },
            team2: { id: 3, name: 'GenG', logo: '/teams/geng-logo.png' },
            team1_score: null,
            team2_score: null,
            status: 'upcoming',
            format: 'BO3'
          },
          {
            id: 9,
            team1: { id: 4, name: 'Fnatic', logo: '/teams/fnatic-logo.png' },
            team2: { id: 6, name: 'NRG', logo: '/teams/nrg-logo.png' },
            team1_score: null,
            team2_score: null,
            status: 'upcoming',
            format: 'BO3'
          }
        ]
      }
    }
  };

  const handleMatchUpdate = (matchId, updates) => {
    console.log('Match update:', matchId, updates);
    // In a real app, this would update the backend
  };

  const navigateTo = (route, params) => {
    console.log('Navigate to:', route, params);
  };

  return (
    <div className="bracket-demo p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Clean Bracket Visualization Demo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            A clean, professional bracket visualization component inspired by VLR.gg with SVG connectors and responsive design.
          </p>
          
          {/* Format Selector */}
          <div className="flex space-x-4 mb-6">
            <button
              onClick={() => setSelectedFormat('single_elimination')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFormat === 'single_elimination'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Single Elimination
            </button>
            <button
              onClick={() => setSelectedFormat('double_elimination')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFormat === 'double_elimination'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Double Elimination
            </button>
            <button
              onClick={() => setSelectedFormat('swiss')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedFormat === 'swiss'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Swiss System
            </button>
          </div>
        </div>

        {/* Features List */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Clean VLR.gg-style design</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">SVG connector lines</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Multiple bracket formats</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Responsive design</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Zoom controls</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Admin controls</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Live match indicators</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Dark mode support</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-700 dark:text-gray-300">Swiss standings table</span>
            </div>
          </div>
        </div>

        {/* Bracket Visualization */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <BracketVisualizationClean
            bracket={sampleBrackets[selectedFormat]}
            event={{ 
              id: 1, 
              name: sampleBrackets[selectedFormat].event_name 
            }}
            navigateTo={navigateTo}
            isAdmin={true}
            onMatchUpdate={handleMatchUpdate}
          />
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Usage</h2>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
              <code className="text-sm">
{`import BracketVisualizationClean from './components/BracketVisualizationClean';

function MyComponent() {
  const handleMatchUpdate = (matchId, updates) => {
    // Update match data
  };

  const navigateTo = (route, params) => {
    // Handle navigation
  };

  return (
    <BracketVisualizationClean
      bracket={bracketData}
      event={{ id: eventId, name: eventName }}
      navigateTo={navigateTo}
      isAdmin={userIsAdmin}
      onMatchUpdate={handleMatchUpdate}
    />
  );
}`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BracketDemo;