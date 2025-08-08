import React, { useState, useEffect } from 'react';
import { TeamLogo } from '../../utils/imageUtils';

/**
 * Comprehensive Bracket Management Interface
 * Admin interface for creating, managing, and updating tournament brackets
 */
function BracketManagement({ 
  event, 
  bracket, 
  teams = [], 
  onBracketUpdate,
  onMatchUpdate,
  isLoading = false 
}) {
  const [activeTab, setActiveTab] = useState('setup');
  const [bracketConfig, setBracketConfig] = useState({
    format: 'single_elimination',
    teams_count: 8,
    seeding_method: 'manual',
    auto_advance: true,
    reset_enabled: true
  });
  const [teamSeeds, setTeamSeeds] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Initialize team seeding
  useEffect(() => {
    if (teams.length > 0 && teamSeeds.length === 0) {
      setTeamSeeds(teams.slice(0, bracketConfig.teams_count).map((team, index) => ({
        ...team,
        seed: index + 1
      })));
    }
  }, [teams, bracketConfig.teams_count, teamSeeds.length]);

  const tabs = [
    { key: 'setup', label: 'Bracket Setup', icon: '⚙️' },
    { key: 'seeding', label: 'Team Seeding', icon: '🏆' },
    { key: 'schedule', label: 'Match Scheduling', icon: '📅' },
    { key: 'live', label: 'Live Control', icon: '🔴' },
    { key: 'settings', label: 'Settings', icon: '⚡' }
  ];

  const handleGenerateBracket = async () => {
    setGenerating(true);
    try {
      const bracketData = {
        event_id: event.id,
        format: bracketConfig.format,
        teams: teamSeeds.slice(0, bracketConfig.teams_count),
        settings: {
          auto_advance: bracketConfig.auto_advance,
          reset_enabled: bracketConfig.reset_enabled,
          seeding_method: bracketConfig.seeding_method
        }
      };

      if (onBracketUpdate) {
        await onBracketUpdate(bracketData);
      }
    } catch (error) {
      console.error('Failed to generate bracket:', error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bracket-management bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Bracket Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {event?.name} - Configure and manage tournament bracket
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {bracket && (
              <span className="px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-sm rounded-full">
                Bracket Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-4 px-1 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'setup' && (
          <BracketSetupTab
            config={bracketConfig}
            onChange={setBracketConfig}
            teams={teams}
            onGenerate={handleGenerateBracket}
            generating={generating}
            bracket={bracket}
          />
        )}

        {activeTab === 'seeding' && (
          <TeamSeedingTab
            teams={teamSeeds}
            onChange={setTeamSeeds}
            maxTeams={bracketConfig.teams_count}
            availableTeams={teams}
          />
        )}

        {activeTab === 'schedule' && (
          <MatchSchedulingTab
            bracket={bracket}
            onMatchUpdate={onMatchUpdate}
          />
        )}

        {activeTab === 'live' && (
          <LiveControlTab
            bracket={bracket}
            onMatchUpdate={onMatchUpdate}
          />
        )}

        {activeTab === 'settings' && (
          <BracketSettingsTab
            config={bracketConfig}
            onChange={setBracketConfig}
            bracket={bracket}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Bracket Setup Tab
 */
function BracketSetupTab({ config, onChange, teams, onGenerate, generating, bracket }) {
  const formats = [
    { value: 'single_elimination', label: 'Single Elimination', description: 'Standard knockout tournament' },
    { value: 'double_elimination', label: 'Double Elimination', description: 'Teams get second chance in lower bracket' },
    { value: 'swiss', label: 'Swiss System', description: 'Teams play set number of rounds' },
    { value: 'round_robin', label: 'Round Robin', description: 'Every team plays every other team' }
  ];

  const teamCounts = [4, 8, 16, 32, 64];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Tournament Format</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {formats.map(format => (
            <div
              key={format.value}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                config.format === format.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
              onClick={() => onChange({ ...config, format: format.value })}
            >
              <h4 className="font-medium text-gray-900 dark:text-white">{format.label}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{format.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Teams
            </label>
            <select
              value={config.teams_count}
              onChange={(e) => onChange({ ...config, teams_count: parseInt(e.target.value) })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {teamCounts.map(count => (
                <option key={count} value={count} disabled={teams.length < count}>
                  {count} teams {teams.length < count && '(not enough teams)'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Seeding Method
            </label>
            <select
              value={config.seeding_method}
              onChange={(e) => onChange({ ...config, seeding_method: e.target.value })}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="manual">Manual Seeding</option>
              <option value="random">Random Seeding</option>
              <option value="ranking">Ranking-based</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Teams</h3>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {teams.length} teams available • {config.teams_count} teams needed
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-40 overflow-y-auto">
            {teams.slice(0, 12).map(team => (
              <div key={team.id} className="flex items-center space-x-2 text-sm">
                <TeamLogo team={team} size="w-6 h-6" />
                <span className="text-gray-900 dark:text-white truncate">{team.name}</span>
              </div>
            ))}
            {teams.length > 12 && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                +{teams.length - 12} more teams...
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {bracket ? 'Regenerating will reset current bracket' : 'Ready to generate tournament bracket'}
        </div>
        <button
          onClick={onGenerate}
          disabled={generating || teams.length < config.teams_count}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            generating || teams.length < config.teams_count
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {generating ? (
            <span className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              <span>Generating...</span>
            </span>
          ) : bracket ? (
            'Regenerate Bracket'
          ) : (
            'Generate Bracket'
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * Team Seeding Tab
 */
function TeamSeedingTab({ teams, onChange, maxTeams, availableTeams }) {
  const handleTeamReplace = (index, newTeam) => {
    const updated = [...teams];
    updated[index] = { ...newTeam, seed: index + 1 };
    onChange(updated);
  };

  const handleSeedChange = (fromIndex, toIndex) => {
    const updated = [...teams];
    [updated[fromIndex], updated[toIndex]] = [updated[toIndex], updated[fromIndex]];
    // Update seed numbers
    updated.forEach((team, index) => {
      team.seed = index + 1;
    });
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Team Seeding</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Drag to reorder • Click to replace team
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {teams.slice(0, maxTeams).map((team, index) => (
          <SeedingSlot
            key={index}
            seed={index + 1}
            team={team}
            onReplace={(newTeam) => handleTeamReplace(index, newTeam)}
            availableTeams={availableTeams}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual seeding slot
 */
function SeedingSlot({ seed, team, onReplace, availableTeams }) {
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="relative">
      <div
        className="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setShowSelector(true)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold text-sm">
            #{seed}
          </div>
          {team ? (
            <>
              <TeamLogo team={team} size="w-8 h-8" />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{team.name}</div>
                {team.region && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">{team.region}</div>
                )}
              </div>
            </>
          ) : (
            <div className="text-gray-400 dark:text-gray-600 italic">Select team...</div>
          )}
        </div>
        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {showSelector && (
        <TeamSelector
          teams={availableTeams}
          onSelect={(selectedTeam) => {
            onReplace(selectedTeam);
            setShowSelector(false);
          }}
          onClose={() => setShowSelector(false)}
        />
      )}
    </div>
  );
}

/**
 * Team Selector Dropdown
 */
function TeamSelector({ teams, onSelect, onClose }) {
  return (
    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
      {teams.map(team => (
        <div
          key={team.id}
          className="flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
          onClick={() => onSelect(team)}
        >
          <TeamLogo team={team} size="w-6 h-6" />
          <div>
            <div className="font-medium text-gray-900 dark:text-white">{team.name}</div>
            {team.region && (
              <div className="text-xs text-gray-500 dark:text-gray-400">{team.region}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Placeholder components for other tabs
 */
function MatchSchedulingTab({ bracket, onMatchUpdate }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Match Scheduling</h3>
      <p className="text-gray-600 dark:text-gray-400">Schedule matches and set tournament timeline</p>
    </div>
  );
}

function LiveControlTab({ bracket, onMatchUpdate }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Live Tournament Control</h3>
      <p className="text-gray-600 dark:text-gray-400">Real-time match updates and score management</p>
    </div>
  );
}

function BracketSettingsTab({ config, onChange, bracket }) {
  return (
    <div className="text-center py-12">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Bracket Settings</h3>
      <p className="text-gray-600 dark:text-gray-400">Configure advanced bracket options</p>
    </div>
  );
}

export default BracketManagement;