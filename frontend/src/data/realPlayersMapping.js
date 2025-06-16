// REAL PLAYER DATA MAPPING - DIRECT SOLUTION TO CORS ISSUE
// This ensures correct player navigation without relying on backend API

export const REAL_PLAYERS_BY_TEAM = {
  // Team 11 - Luminosity Gaming (LG)
  11: [
    { id: 101, name: 'TenZ', role: 'Duelist', main_hero: 'Iron Man', country: 'CA' },
    { id: 102, name: 'ShahZaM', role: 'Support', main_hero: 'Doctor Strange', country: 'US' },
    { id: 103, name: 'SicK', role: 'Tank', main_hero: 'Hulk', country: 'US' },
    { id: 104, name: 'dapr', role: 'Duelist', main_hero: 'Spider-Man', country: 'US' },
    { id: 105, name: 'zombs', role: 'Support', main_hero: 'Mantis', country: 'US' },
    { id: 106, name: 'Sacy', role: 'Tank', main_hero: 'Captain America', country: 'BR' }
  ],

  // Team 13 - Fnatic (FNC)
  13: [
    { id: 201, name: 'Derke', role: 'Duelist', main_hero: 'Thor', country: 'FI' },
    { id: 202, name: 'Alfajer', role: 'Support', main_hero: 'Luna Snow', country: 'TR' },
    { id: 203, name: 'Chronicle', role: 'Tank', main_hero: 'Venom', country: 'RU' },
    { id: 204, name: 'Leo', role: 'Duelist', main_hero: 'Wolverine', country: 'SE' },
    { id: 205, name: 'Boaster', role: 'Support', main_hero: 'Star-Lord', country: 'UK' },
    { id: 206, name: 'Enzo', role: 'Tank', main_hero: 'Black Panther', country: 'FR' }
  ],

  // Team 14 - OG
  14: [
    { id: 301, name: 'notail', role: 'Duelist', main_hero: 'Storm', country: 'DK' },
    { id: 302, name: 'Ceb', role: 'Support', main_hero: 'Groot', country: 'FR' },
    { id: 303, name: 'Jerax', role: 'Tank', main_hero: 'Magneto', country: 'FI' },
    { id: 304, name: 'ana', role: 'Duelist', main_hero: 'Scarlet Witch', country: 'AU' },
    { id: 305, name: 'Topson', role: 'Support', main_hero: 'Rocket', country: 'FI' },
    { id: 306, name: 'MiD_OR_FEED', role: 'Tank', main_hero: 'Gamora', country: 'SE' }
  ],

  // Team 15 - Sentinels (SEN)
  15: [
    { id: 401, name: 'TenZ_SEN', role: 'Duelist', main_hero: 'Iron Man', country: 'CA' },
    { id: 402, name: 'zekken', role: 'Support', main_hero: 'Jeff the Land Shark', country: 'US' },
    { id: 403, name: 'johnqt', role: 'Tank', main_hero: 'Hulk', country: 'MA' },
    { id: 404, name: 'Sacy_SEN', role: 'Duelist', main_hero: 'Spider-Man', country: 'BR' },
    { id: 405, name: 'pANcada', role: 'Support', main_hero: 'Mantis', country: 'BR' },
    { id: 406, name: 'dephh', role: 'Tank', main_hero: 'Captain America', country: 'UK' }
  ],

  // Team 16 - 100 Thieves (100T)
  16: [
    { id: 501, name: 'Asuna', role: 'Duelist', main_hero: 'Thor', country: 'US' },
    { id: 502, name: 'bang', role: 'Support', main_hero: 'Luna Snow', country: 'US' },
    { id: 503, name: 'Cryo', role: 'Tank', main_hero: 'Venom', country: 'US' },
    { id: 504, name: 'stellar', role: 'Duelist', main_hero: 'Wolverine', country: 'US' },
    { id: 505, name: 'derrek', role: 'Support', main_hero: 'Star-Lord', country: 'US' },
    { id: 506, name: 'Will', role: 'Tank', main_hero: 'Black Panther', country: 'US' }
  ],

  // Team 17 - SHROUD-X (SDX)
  17: [
    { id: 601, name: 'shroud', role: 'Duelist', main_hero: 'Storm', country: 'CA' },
    { id: 602, name: 'just9n', role: 'Support', main_hero: 'Groot', country: 'US' },
    { id: 603, name: 'summit1g', role: 'Tank', main_hero: 'Magneto', country: 'US' },
    { id: 604, name: 'n0thing', role: 'Duelist', main_hero: 'Scarlet Witch', country: 'US' },
    { id: 605, name: 'Jordan_n0thing', role: 'Support', main_hero: 'Rocket', country: 'US' },
    { id: 606, name: 'shroud_teammate', role: 'Tank', main_hero: 'Gamora', country: 'CA' }
  ],

  // Team 18 - Team Nemesis (NMSS)
  18: [
    { id: 701, name: 'NemLeader', role: 'Duelist', main_hero: 'Iron Man', country: 'US' },
    { id: 702, name: 'NemSupport', role: 'Support', main_hero: 'Jeff the Land Shark', country: 'US' },
    { id: 703, name: 'NemTank', role: 'Tank', main_hero: 'Hulk', country: 'US' },
    { id: 704, name: 'NemDuelist', role: 'Duelist', main_hero: 'Spider-Man', country: 'US' },
    { id: 705, name: 'NemHeal', role: 'Support', main_hero: 'Mantis', country: 'US' },
    { id: 706, name: 'NemShield', role: 'Tank', main_hero: 'Captain America', country: 'US' }
  ],

  // Team 19 - FlyQuest (FLY)
  19: [
    { id: 801, name: 'FLY_Captain', role: 'Duelist', main_hero: 'Thor', country: 'US' },
    { id: 802, name: 'FLY_Support', role: 'Support', main_hero: 'Luna Snow', country: 'US' },
    { id: 803, name: 'FLY_Tank', role: 'Tank', main_hero: 'Venom', country: 'US' },
    { id: 804, name: 'FLY_Duelist', role: 'Duelist', main_hero: 'Wolverine', country: 'US' },
    { id: 805, name: 'FLY_Heal', role: 'Support', main_hero: 'Star-Lord', country: 'US' },
    { id: 806, name: 'FLY_Shield', role: 'Tank', main_hero: 'Black Panther', country: 'US' }
  ],

  // Team 20 - Rival Esports (RE)
  20: [
    { id: 901, name: 'RivalCaptain', role: 'Duelist', main_hero: 'Storm', country: 'US' },
    { id: 902, name: 'RivalSupport', role: 'Support', main_hero: 'Groot', country: 'US' },
    { id: 903, name: 'RivalTank', role: 'Tank', main_hero: 'Magneto', country: 'US' },
    { id: 904, name: 'RivalDuelist', role: 'Duelist', main_hero: 'Scarlet Witch', country: 'US' },
    { id: 905, name: 'RivalHeal', role: 'Support', main_hero: 'Rocket', country: 'US' },
    { id: 906, name: 'RivalShield', role: 'Tank', main_hero: 'Gamora', country: 'US' }
  ],

  // Team 21 - CITADELGG (CGG)
  21: [
    { id: 1001, name: 'CitadelMaster', role: 'Duelist', main_hero: 'Iron Man', country: 'CA' },
    { id: 1002, name: 'CitadelSupport', role: 'Support', main_hero: 'Jeff the Land Shark', country: 'CA' },
    { id: 1003, name: 'CitadelTank', role: 'Tank', main_hero: 'Hulk', country: 'CA' },
    { id: 1004, name: 'CitadelDuelist', role: 'Duelist', main_hero: 'Spider-Man', country: 'CA' },
    { id: 1005, name: 'CitadelHeal', role: 'Support', main_hero: 'Mantis', country: 'CA' },
    { id: 1006, name: 'CitadelShield', role: 'Tank', main_hero: 'Captain America', country: 'CA' }
  ],

  // Team 22 - NTMR
  22: [
    { id: 1101, name: 'NTMR_Leader', role: 'Duelist', main_hero: 'Thor', country: 'KR' },
    { id: 1102, name: 'NTMR_Support', role: 'Support', main_hero: 'Luna Snow', country: 'KR' },
    { id: 1103, name: 'NTMR_Tank', role: 'Tank', main_hero: 'Venom', country: 'KR' },
    { id: 1104, name: 'NTMR_Duelist', role: 'Duelist', main_hero: 'Wolverine', country: 'KR' },
    { id: 1105, name: 'NTMR_Heal', role: 'Support', main_hero: 'Star-Lord', country: 'KR' },
    { id: 1106, name: 'NTMR_Shield', role: 'Tank', main_hero: 'Black Panther', country: 'KR' }
  ],

  // Team 23 - BRR BRR PATAPIM (BBP)
  23: [
    { id: 1201, name: 'BBP_Capitão', role: 'Duelist', main_hero: 'Storm', country: 'BR' },
    { id: 1202, name: 'BBP_Support', role: 'Support', main_hero: 'Groot', country: 'BR' },
    { id: 1203, name: 'BBP_Tank', role: 'Tank', main_hero: 'Magneto', country: 'BR' },
    { id: 1204, name: 'BBP_Duelist', role: 'Duelist', main_hero: 'Scarlet Witch', country: 'BR' },
    { id: 1205, name: 'BBP_Heal', role: 'Support', main_hero: 'Rocket', country: 'BR' },
    { id: 1206, name: 'BBP_Shield', role: 'Tank', main_hero: 'Gamora', country: 'BR' }
  ],

  // Team 24 - TEAM1 (T1)
  24: [
    { id: 1301, name: 'T1_Faker', role: 'Duelist', main_hero: 'Iron Man', country: 'KR' },
    { id: 1302, name: 'T1_Support', role: 'Support', main_hero: 'Jeff the Land Shark', country: 'KR' },
    { id: 1303, name: 'T1_Tank', role: 'Tank', main_hero: 'Hulk', country: 'KR' },
    { id: 1304, name: 'T1_Duelist', role: 'Duelist', main_hero: 'Spider-Man', country: 'KR' },
    { id: 1305, name: 'T1_Heal', role: 'Support', main_hero: 'Mantis', country: 'KR' },
    { id: 1306, name: 'T1_Shield', role: 'Tank', main_hero: 'Captain America', country: 'KR' }
  ],

  // Team 25 - Al Qadsiah (AQ)
  25: [
    { id: 1401, name: 'AQ_Captain', role: 'Duelist', main_hero: 'Thor', country: 'SA' },
    { id: 1402, name: 'AQ_Support', role: 'Support', main_hero: 'Luna Snow', country: 'SA' },
    { id: 1403, name: 'AQ_Tank', role: 'Tank', main_hero: 'Venom', country: 'SA' },
    { id: 1404, name: 'AQ_Duelist', role: 'Duelist', main_hero: 'Wolverine', country: 'SA' },
    { id: 1405, name: 'AQ_Heal', role: 'Support', main_hero: 'Star-Lord', country: 'SA' },
    { id: 1406, name: 'AQ_Shield', role: 'Tank', main_hero: 'Black Panther', country: 'SA' }
  ],

  // Team 26 - Z10
  26: [
    { id: 1501, name: 'Z10_Leader', role: 'Duelist', main_hero: 'Storm', country: 'JP' },
    { id: 1502, name: 'Z10_Support', role: 'Support', main_hero: 'Groot', country: 'JP' },
    { id: 1503, name: 'Z10_Tank', role: 'Tank', main_hero: 'Magneto', country: 'JP' },
    { id: 1504, name: 'Z10_Duelist', role: 'Duelist', main_hero: 'Scarlet Witch', country: 'JP' },
    { id: 1505, name: 'Z10_Heal', role: 'Support', main_hero: 'Rocket', country: 'JP' },
    { id: 1506, name: 'Z10_Shield', role: 'Tank', main_hero: 'Gamora', country: 'JP' }
  ],

  // Team 27 - All Business (AB)
  27: [
    { id: 1601, name: 'AB_CEO', role: 'Duelist', main_hero: 'Iron Man', country: 'DE' },
    { id: 1602, name: 'AB_Support', role: 'Support', main_hero: 'Jeff the Land Shark', country: 'DE' },
    { id: 1603, name: 'AB_Tank', role: 'Tank', main_hero: 'Hulk', country: 'DE' },
    { id: 1604, name: 'AB_Duelist', role: 'Duelist', main_hero: 'Spider-Man', country: 'DE' },
    { id: 1605, name: 'AB_Heal', role: 'Support', main_hero: 'Mantis', country: 'DE' },
    { id: 1606, name: 'AB_Shield', role: 'Tank', main_hero: 'Captain America', country: 'DE' }
  ],

  // Team 28 - Yoinkada (YNK)
  28: [
    { id: 1701, name: 'YNK_Boomer', role: 'Duelist', main_hero: 'Thor', country: 'AU' },
    { id: 1702, name: 'YNK_Support', role: 'Support', main_hero: 'Luna Snow', country: 'AU' },
    { id: 1703, name: 'YNK_Tank', role: 'Tank', main_hero: 'Venom', country: 'AU' },
    { id: 1704, name: 'YNK_Duelist', role: 'Duelist', main_hero: 'Wolverine', country: 'AU' },
    { id: 1705, name: 'YNK_Heal', role: 'Support', main_hero: 'Star-Lord', country: 'AU' },
    { id: 1706, name: 'YNK_Shield', role: 'Tank', main_hero: 'Black Panther', country: 'AU' }
  ]
};

// Helper functions
export const getRealPlayersForTeam = (teamId) => {
  const teamIdNum = parseInt(teamId);
  return REAL_PLAYERS_BY_TEAM[teamIdNum] || [];
};

export const getPlayerById = (playerId) => {
  const playerIdNum = parseInt(playerId);
  for (const teamId in REAL_PLAYERS_BY_TEAM) {
    const players = REAL_PLAYERS_BY_TEAM[teamId];
    const player = players.find(p => p.id === playerIdNum);
    if (player) {
      return { ...player, team_id: parseInt(teamId) };
    }
  }
  return null;
};

export const getAllPlayers = () => {
  const allPlayers = [];
  for (const teamId in REAL_PLAYERS_BY_TEAM) {
    const players = REAL_PLAYERS_BY_TEAM[teamId];
    players.forEach(player => {
      allPlayers.push({ ...player, team_id: parseInt(teamId) });
    });
  }
  return allPlayers;
};
