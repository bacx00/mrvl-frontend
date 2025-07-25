// Liquipedia-style bracket system
// Based on Liquipedia's bracket structure: https://liquipedia.net/commons/Liquipedia:Brackets

export interface LiquipediaMatch {
  id: string; // Format: RxMy (e.g., R1M1 = Round 1 Match 1)
  bracketId: string; // 10-character alphanumeric ID
  round: number;
  match: number;
  opponent1: LiquipediaOpponent | null;
  opponent2: LiquipediaOpponent | null;
  winner: 1 | 2 | null;
  winnerto?: string; // Next match ID for winner
  loserto?: string; // Next match ID for loser (double elim)
  winnertobracket?: string; // Cross-bracket progression
  losertobracket?: string; // Cross-bracket progression
  date?: string;
  finished: boolean;
  bestof: 1 | 3 | 5 | 7;
  maps?: LiquipediaMap[];
  stream?: string;
  vod?: string;
}

export interface LiquipediaOpponent {
  id: string | number;
  name: string;
  short_name?: string;
  logo?: string;
  score?: number;
  status?: 'W' | 'L' | 'FF' | 'DQ' | null; // Win, Loss, Forfeit, Disqualified
  lastvs?: string; // Previous opponent faced
  seed?: number;
}

export interface LiquipediaMap {
  map: string;
  score1?: number;
  score2?: number;
  winner?: 1 | 2;
  vod?: string;
}

export interface LiquipediaBracket {
  id: string; // 10-character alphanumeric unique ID
  name: string;
  type: 'single' | 'double' | 'swiss' | 'roundrobin' | 'bracket';
  matches: { [matchId: string]: LiquipediaMatch };
  rounds: LiquipediaRound[];
  teamcount: number;
  status: 'setup' | 'ongoing' | 'completed';
  headerHeight?: number; // Default: 25
  matchWidth?: number; // Default: 120
  scoreWidth?: number; // Default: 20
  opponentHeight?: number; // Default: 24
}

export interface LiquipediaRound {
  round: number;
  name: string;
  matches: string[]; // Match IDs for this round
  bestof?: 1 | 3 | 5 | 7;
}

export interface SwissStage {
  rounds: number;
  standings: SwissStanding[];
  matches: { [matchId: string]: LiquipediaMatch };
  qualified: {
    upper: string[]; // Team IDs qualified for upper bracket
    lower: string[]; // Team IDs qualified for lower bracket
  };
}

export interface SwissStanding {
  team: LiquipediaOpponent;
  wins: number;
  losses: number;
  buchholz?: number; // Tiebreaker score
  position: number;
}

// Bracket ID generator (10 random alphanumeric characters)
export function generateBracketId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 10; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Match ID generator
export function generateMatchId(round: number, match: number): string {
  return `R${round}M${match}`;
}

// Create a single elimination bracket
export function createSingleEliminationBracket(teams: LiquipediaOpponent[]): LiquipediaBracket {
  const bracketId = generateBracketId();
  const teamCount = teams.length;
  const rounds = Math.ceil(Math.log2(teamCount));
  const bracket: LiquipediaBracket = {
    id: bracketId,
    name: 'Single Elimination',
    type: 'single',
    matches: {},
    rounds: [],
    teamcount: teamCount,
    status: 'setup'
  };

  // Seed teams
  const seededTeams = seedTeams(teams);
  
  // Generate matches
  let matchCounter = 1;
  let currentRoundTeams = seededTeams;

  for (let round = 1; round <= rounds; round++) {
    const roundObj: LiquipediaRound = {
      round,
      name: getRoundName(round, rounds, 'single'),
      matches: [],
      bestof: round === rounds ? 5 : 3 // Finals Bo5, others Bo3
    };

    const matchesInRound = Math.pow(2, rounds - round);
    const nextRoundTeams: (LiquipediaOpponent | null)[] = [];

    for (let match = 1; match <= matchesInRound; match++) {
      const matchId = generateMatchId(round, match);
      const team1 = currentRoundTeams[match * 2 - 2] || null;
      const team2 = currentRoundTeams[match * 2 - 1] || null;

      const liquipediaMatch: LiquipediaMatch = {
        id: matchId,
        bracketId,
        round,
        match,
        opponent1: team1,
        opponent2: team2,
        winner: null,
        winnerto: round < rounds ? generateMatchId(round + 1, Math.ceil(match / 2)) : undefined,
        finished: false,
        bestof: roundObj.bestof!
      };

      bracket.matches[matchId] = liquipediaMatch;
      roundObj.matches.push(matchId);
      nextRoundTeams.push(null); // Placeholder for winner
    }

    bracket.rounds.push(roundObj);
    currentRoundTeams = nextRoundTeams;
  }

  return bracket;
}

// Create a double elimination bracket
export function createDoubleEliminationBracket(teams: LiquipediaOpponent[]): LiquipediaBracket {
  const bracketId = generateBracketId();
  const teamCount = teams.length;
  const upperRounds = Math.ceil(Math.log2(teamCount));
  const lowerRounds = (upperRounds - 1) * 2;
  
  const bracket: LiquipediaBracket = {
    id: bracketId,
    name: 'Double Elimination',
    type: 'double',
    matches: {},
    rounds: [],
    teamcount: teamCount,
    status: 'setup'
  };

  // Seed teams
  const seededTeams = seedTeams(teams);
  
  // Generate upper bracket
  let currentUpperTeams = seededTeams;
  for (let round = 1; round <= upperRounds; round++) {
    const roundObj: LiquipediaRound = {
      round,
      name: getRoundName(round, upperRounds, 'upper'),
      matches: [],
      bestof: round === upperRounds ? 5 : 3
    };

    const matchesInRound = Math.pow(2, upperRounds - round);
    for (let match = 1; match <= matchesInRound; match++) {
      const matchId = `R${round}M${match}`;
      const team1 = currentUpperTeams[match * 2 - 2] || null;
      const team2 = currentUpperTeams[match * 2 - 1] || null;

      const liquipediaMatch: LiquipediaMatch = {
        id: matchId,
        bracketId,
        round,
        match,
        opponent1: team1,
        opponent2: team2,
        winner: null,
        winnerto: round < upperRounds ? `R${round + 1}M${Math.ceil(match / 2)}` : 'GF',
        loserto: `L${getLowerRoundForUpperLoss(round)}M${getLowerMatchForUpperLoss(round, match)}`,
        finished: false,
        bestof: roundObj.bestof!
      };

      bracket.matches[matchId] = liquipediaMatch;
      roundObj.matches.push(matchId);
    }

    bracket.rounds.push(roundObj);
    currentUpperTeams = currentUpperTeams.map(() => null); // Reset for next round
  }

  // Generate lower bracket
  for (let round = 1; round <= lowerRounds; round++) {
    const roundObj: LiquipediaRound = {
      round: upperRounds + round,
      name: getRoundName(round, lowerRounds, 'lower'),
      matches: [],
      bestof: round === lowerRounds ? 5 : 3
    };

    const matchesInRound = getLowerBracketMatchCount(round, upperRounds);
    for (let match = 1; match <= matchesInRound; match++) {
      const matchId = `L${round}M${match}`;
      
      const liquipediaMatch: LiquipediaMatch = {
        id: matchId,
        bracketId,
        round: upperRounds + round,
        match,
        opponent1: null, // Will be filled by progression
        opponent2: null, // Will be filled by progression
        winner: null,
        winnerto: round < lowerRounds ? getLowerBracketProgression(round, match) : 'GF',
        finished: false,
        bestof: roundObj.bestof!
      };

      bracket.matches[matchId] = liquipediaMatch;
      roundObj.matches.push(matchId);
    }

    bracket.rounds.push(roundObj);
  }

  // Add Grand Final
  const gfRound: LiquipediaRound = {
    round: upperRounds + lowerRounds + 1,
    name: 'Grand Final',
    matches: ['GF'],
    bestof: 7
  };

  bracket.matches['GF'] = {
    id: 'GF',
    bracketId,
    round: gfRound.round,
    match: 1,
    opponent1: null, // Upper bracket winner
    opponent2: null, // Lower bracket winner
    winner: null,
    finished: false,
    bestof: 7
  };

  bracket.rounds.push(gfRound);

  return bracket;
}

// Helper functions
function seedTeams(teams: LiquipediaOpponent[]): LiquipediaOpponent[] {
  // Implement proper seeding logic
  // For now, use teams as-is if they have seeds, otherwise assign
  return teams.map((team, index) => ({
    ...team,
    seed: team.seed || index + 1
  })).sort((a, b) => a.seed! - b.seed!);
}

function getRoundName(round: number, totalRounds: number, bracketType: 'single' | 'upper' | 'lower'): string {
  if (bracketType === 'lower') {
    const lowerRoundNames = [
      'Lower Round 1',
      'Lower Round 2',
      'Lower Quarterfinals',
      'Lower Semifinals',
      'Lower Final'
    ];
    return lowerRoundNames[round - 1] || `Lower Round ${round}`;
  }

  const roundsFromEnd = totalRounds - round;
  const roundNames = [
    'Grand Final',
    'Final',
    'Semifinals',
    'Quarterfinals',
    'Round of 16',
    'Round of 32',
    'Round of 64'
  ];

  if (bracketType === 'upper') {
    if (roundsFromEnd === 0) return 'Upper Final';
    if (roundsFromEnd === 1) return 'Upper Semifinals';
    return roundNames[roundsFromEnd + 1] || `Upper Round ${round}`;
  }

  return roundNames[roundsFromEnd] || `Round ${round}`;
}

function getLowerRoundForUpperLoss(upperRound: number): number {
  // Map upper round losses to lower rounds
  if (upperRound === 1) return 1;
  return (upperRound - 1) * 2;
}

function getLowerMatchForUpperLoss(upperRound: number, upperMatch: number): number {
  // Determine which lower bracket match the loser goes to
  return upperMatch;
}

function getLowerBracketMatchCount(lowerRound: number, upperRounds: number): number {
  // Calculate how many matches in each lower bracket round
  if (lowerRound === 1) return Math.pow(2, upperRounds - 2);
  if (lowerRound % 2 === 0) return Math.pow(2, upperRounds - Math.ceil(lowerRound / 2) - 1);
  return Math.pow(2, upperRounds - Math.ceil(lowerRound / 2) - 1);
}

function getLowerBracketProgression(round: number, match: number): string {
  const nextRound = round + 1;
  let nextMatch = match;
  
  // Every other round halves the matches
  if (round % 2 === 0) {
    nextMatch = Math.ceil(match / 2);
  }
  
  return `L${nextRound}M${nextMatch}`;
}

// Update match result and progress winners/losers
export function updateMatchResult(
  bracket: LiquipediaBracket, 
  matchId: string, 
  winner: 1 | 2,
  score1: number,
  score2: number
): LiquipediaBracket {
  const match = bracket.matches[matchId];
  if (!match) return bracket;

  // Update match
  match.winner = winner;
  match.opponent1!.score = score1;
  match.opponent2!.score = score2;
  match.finished = true;

  // Progress winner
  if (match.winnerto) {
    const winnerTeam = winner === 1 ? match.opponent1 : match.opponent2;
    const nextMatch = bracket.matches[match.winnerto];
    if (nextMatch) {
      // Determine which slot in next match
      const fromUpperHalf = match.match % 2 === 1;
      if (fromUpperHalf) {
        nextMatch.opponent1 = winnerTeam;
      } else {
        nextMatch.opponent2 = winnerTeam;
      }
    }
  }

  // Progress loser (double elimination)
  if (match.loserto) {
    const loserTeam = winner === 1 ? match.opponent2 : match.opponent1;
    const lowerMatch = bracket.matches[match.loserto];
    if (lowerMatch) {
      // Lower bracket placement logic
      if (!lowerMatch.opponent1) {
        lowerMatch.opponent1 = loserTeam;
      } else {
        lowerMatch.opponent2 = loserTeam;
      }
    }
  }

  return bracket;
}

// Reset bracket (clear all results)
export function resetBracket(bracket: LiquipediaBracket): LiquipediaBracket {
  const resetBracket = { ...bracket };
  
  Object.keys(resetBracket.matches).forEach(matchId => {
    const match = resetBracket.matches[matchId];
    match.winner = null;
    match.finished = false;
    
    // Clear scores
    if (match.opponent1) match.opponent1.score = undefined;
    if (match.opponent2) match.opponent2.score = undefined;
    
    // Clear progressed teams (except round 1)
    if (match.round > 1) {
      match.opponent1 = null;
      match.opponent2 = null;
    }
  });

  resetBracket.status = 'setup';
  return resetBracket;
}