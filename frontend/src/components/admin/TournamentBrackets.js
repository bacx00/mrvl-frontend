import React, { useState, useEffect } from 'react';

function TournamentBrackets({ api, navigateTo }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [bracket, setBracket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tournaments');
      const tournamentsData = response.data || response || [];
      
      setTournaments(tournamentsData);
      
      if (tournamentsData.length > 0) {
        setSelectedTournament(tournamentsData[0]);
        fetchBracket(tournamentsData[0].id);
      }
    } catch (error) {
      console.error('❌ Error fetching tournaments:', error);
      const demoTournaments = [
        {
          id: 1,
          name: 'Marvel Rivals World Championship 2025',
          status: 'live',
          format: 'double-elimination',
          teams: 32,
          prizePool: '$2,000,000',
          startDate: '2025-01-15',
          endDate: '2025-01-29'
        },
        {
          id: 2,
          name: 'Winter Showdown 2025',
          status: 'upcoming',
          format: 'single-elimination',
          teams: 16,
          prizePool: '$500,000',
          startDate: '2025-02-15',
          endDate: '2025-02-22'
        }
      ];
      
      setTournaments(demoTournaments);
      setSelectedTournament(demoTournaments[0]);
      generateDemoBracket(demoTournaments[0]);
    } finally {
      setLoading(false);
    }
  };

  const fetchBracket = async (tournamentId) => {
    try {
      const response = await api.get(`/admin/tournaments/${tournamentId}/bracket`);
      setBracket(response.data || response);
    } catch (error) {
      console.error('❌ Error fetching bracket:', error);
      generateDemoBracket(selectedTournament);
    }
  };

  const generateDemoBracket = (tournament) => {
    const teams = [
      'Sentinels', 'SHROUD-X', 'Team Liquid', 'Fnatic',
      'Gen.G', 'NAVI', '100 Thieves', 'Cloud9',
      'TSM', 'G2 Esports', 'FPX', 'LOUD',
      'DRX', 'Paper Rex', 'OpTic Gaming', 'XSET'
    ];

    const rounds = [];
    let currentTeams = [...teams];
    let roundNum = 1;

    while (currentTeams.length > 1) {
      const matches = [];
      const nextRoundTeams = [];

      for (let i = 0; i < currentTeams.length; i += 2) {
        const team1 = currentTeams[i];
        const team2 = currentTeams[i + 1];
        const winner = Math.random() > 0.5 ? team1 : team2;
        
        matches.push({
          id: `${roundNum}-${Math.floor(i/2)}`,
          team1,
          team2,
          winner: roundNum < 3 ? winner : null,
          score: roundNum < 3 ? '2-1' : 'TBD',
          status: roundNum < 3 ? 'completed' : roundNum === 3 ? 'live' : 'upcoming'
        });

        if (roundNum < 3) {
          nextRoundTeams.push(winner);
        } else {
          nextRoundTeams.push(team1, team2);
        }
      }

      rounds.push({
        round: roundNum,
        name: getRoundName(roundNum, currentTeams.length),
        matches
      });

      currentTeams = nextRoundTeams;
      roundNum++;
    }

    setBracket({
      tournament: tournament,
      format: tournament?.format || 'single-elimination',
      rounds
    });
  };

  const getRoundName = (roundNum, teamCount) => {
    if (teamCount === 2) return 'Grand Final';
    if (teamCount === 4) return 'Semi-Finals';
    if (teamCount === 8) return 'Quarter-Finals';
    if (teamCount === 16) return 'Round of 16';
    return `Round ${roundNum}`;
  };

  const createNewTournament = async () => {
    const tournamentData = {
      name: 'New Tournament',
      format: 'single-elimination',
      teams: 16,
      prizePool: '$100,000',
      startDate: new Date().toISOString().split('T')[0]
    };

    try {
      setCreating(true);
      const response = await api.post('/admin/tournaments', tournamentData);
      const newTournament = response.data || response;
      
      setTournaments(prev => [...prev, newTournament]);
      setSelectedTournament(newTournament);
      
      alert('✅ Tournament created successfully!');
    } catch (error) {
      console.error('❌ Error creating tournament:', error);
      alert('❌ Failed to create tournament. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const updateMatchResult = async (matchId, winner, score) => {
    try {
      await api.put(`/admin/tournaments/${selectedTournament.id}/matches/${matchId}`, {
        winner,
        score,
        status: 'completed'
      });
      
      fetchBracket(selectedTournament.id);
      alert('✅ Match result updated!');
    } catch (error) {
      console.error('❌ Error updating match:', error);
      alert('❌ Failed to update match. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading tournaments...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">🏆 Tournament Brackets</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage tournament brackets and match results</p>
        </div>
        <button
          onClick={createNewTournament}
          disabled={creating}
          className="btn bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {creating ? 'Creating...' : '🏆 New Tournament'}
        </button>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Select Tournament
            </label>
            <select
              value={selectedTournament?.id || ''}
              onChange={(e) => {
                const tournament = tournaments.find(t => t.id === parseInt(e.target.value));
                setSelectedTournament(tournament);
                if (tournament) fetchBracket(tournament.id);
              }}
              className="form-input"
            >
              {tournaments.map(tournament => (
                <option key={tournament.id} value={tournament.id}>
                  {tournament.name} ({tournament.teams} teams)
                </option>
              ))}
            </select>
          </div>
          
          {selectedTournament && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{selectedTournament.teams}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Teams</div>
              </div>
              <div>
                <div className="text-lg font-bold text-green-600">{selectedTournament.prizePool}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Prize Pool</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${
                  selectedTournament.status === 'live' ? 'text-red-600' :
                  selectedTournament.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {selectedTournament.status.toUpperCase()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Status</div>
              </div>
              <div>
                <div className="text-lg font-bold text-purple-600 capitalize">{selectedTournament.format}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Format</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {bracket && (
        <div className="card p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {bracket.tournament.name} - Bracket
          </h3>
          
          <div className="overflow-x-auto">
            <div className="flex space-x-8 min-w-max">
              {bracket.rounds.map((round) => (
                <div key={round.round} className="flex flex-col space-y-4 min-w-[300px]">
                  <h4 className="text-lg font-bold text-center text-gray-900 dark:text-white">
                    {round.name}
                  </h4>
                  
                  <div className="space-y-4">
                    {round.matches.map((match) => (
                      <div key={match.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="space-y-2">
                          <div className={`flex items-center justify-between p-2 rounded ${
                            match.winner === match.team1 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'
                          }`}>
                            <span className="font-medium">{match.team1}</span>
                            {match.winner === match.team1 && <span className="text-green-600">✓</span>}
                          </div>
                          
                          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                            {match.score}
                          </div>
                          
                          <div className={`flex items-center justify-between p-2 rounded ${
                            match.winner === match.team2 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-50 dark:bg-gray-700'
                          }`}>
                            <span className="font-medium">{match.team2}</span>
                            {match.winner === match.team2 && <span className="text-green-600">✓</span>}
                          </div>
                        </div>
                        
                        <div className="mt-3 flex items-center justify-between">
                          <span className={`px-2 py-1 text-xs rounded ${
                            match.status === 'live' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                            match.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          }`}>
                            {match.status.toUpperCase()}
                          </span>
                          
                          {match.status !== 'completed' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => updateMatchResult(match.id, match.team1, '2-0')}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                {match.team1} Wins
                              </button>
                              <button
                                onClick={() => updateMatchResult(match.id, match.team2, '2-0')}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                {match.team2} Wins
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Tournament Management</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="btn bg-blue-600 text-white hover:bg-blue-700">
            📊 Generate Bracket
          </button>
          <button className="btn bg-green-600 text-white hover:bg-green-700">
            ⚡ Auto-Advance
          </button>
          <button className="btn bg-purple-600 text-white hover:bg-purple-700">
            📄 Export Results
          </button>
          <button className="btn bg-red-600 text-white hover:bg-red-700">
            🔄 Reset Bracket
          </button>
        </div>
      </div>
    </div>
  );
}

export default TournamentBrackets;