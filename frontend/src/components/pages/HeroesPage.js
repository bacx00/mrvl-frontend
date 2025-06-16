import React, { useState } from 'react';

function HeroesPage() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');

  const mockHeroes = [
    {
      id: 1,
      name: "Iron Man",
      role: "Duelist",
      tier: "S",
      winRate: 67.8,
      pickRate: 78.4,
      banRate: 45.2,
      difficulty: "Medium",
      abilities: ["Repulsor Blast", "Unibeam", "Rocket Punch", "Hulkbuster"],
      description: "High-mobility damage dealer with strong burst potential",
      counters: ["Storm", "Magneto"],
      synergies: ["Spider-Man", "Rocket Raccoon"],
      image: "🤖"
    },
    {
      id: 2,
      name: "Spider-Man",
      role: "Duelist",
      tier: "A",
      winRate: 64.2,
      pickRate: 72.1,
      banRate: 38.7,
      difficulty: "Hard",
      abilities: ["Web Swing", "Web Shot", "Spider Sense", "Ultimate Web"],
      description: "Mobile assassin with excellent positioning tools",
      counters: ["Hulk", "Venom"],
      synergies: ["Iron Man", "Storm"],
      image: "🕷️"
    },
    {
      id: 3,
      name: "Hulk",
      role: "Tank",
      tier: "S",
      winRate: 71.5,
      pickRate: 85.3,
      banRate: 52.8,
      difficulty: "Easy",
      abilities: ["Gamma Leap", "Thunderclap", "Hulk Smash", "Rage Mode"],
      description: "Ultimate frontline tank with massive crowd control",
      counters: ["Magneto", "Storm"],
      synergies: ["Thor", "Rocket Raccoon"],
      image: "💚"
    },
    {
      id: 4,
      name: "Storm",
      role: "Duelist",
      tier: "A",
      winRate: 63.9,
      pickRate: 68.7,
      banRate: 35.4,
      difficulty: "Medium",
      abilities: ["Lightning Strike", "Wind Gust", "Flight", "Lightning Storm"],
      description: "Aerial damage dealer with environmental control",
      counters: ["Spider-Man", "Black Panther"],
      synergies: ["Magneto", "Thor"],
      image: "⚡"
    },
    {
      id: 5,
      name: "Rocket Raccoon",
      role: "Support",
      tier: "A",
      winRate: 69.3,
      pickRate: 74.6,
      banRate: 28.9,
      difficulty: "Hard",
      abilities: ["Healing Beacon", "Explosive Trap", "Jetpack", "BFG Ultimate"],
      description: "Versatile support with healing and area denial",
      counters: ["Iron Man", "Spider-Man"],
      synergies: ["Hulk", "Venom"],
      image: "🦝"
    },
    {
      id: 6,
      name: "Magneto",
      role: "Tank",
      tier: "S",
      winRate: 70.1,
      pickRate: 82.4,
      banRate: 48.3,
      difficulty: "Hard",
      abilities: ["Metal Shield", "Magnetic Pull", "Metal Storm", "Master of Magnetism"],
      description: "Control tank with powerful positioning abilities",
      counters: ["Thor", "Hulk"],
      synergies: ["Storm", "Venom"],
      image: "🧲"
    }
  ];

  const filteredHeroes = mockHeroes.filter(hero => {
    const matchesRole = selectedRole === 'all' || hero.role === selectedRole;
    const matchesTier = selectedTier === 'all' || hero.tier === selectedTier;
    return matchesRole && matchesTier;
  });

  const getTierColor = (tier) => {
    switch (tier) {
      case 'S': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'A': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'B': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'C': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Duelist': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'Tank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Support': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold gradient-text">Heroes Meta</h1>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Patch 2.1.4 • Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Meta Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">⚔️</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
            {mockHeroes.filter(h => h.role === 'Duelist').length}
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">Duelists</div>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">🛡️</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
            {mockHeroes.filter(h => h.role === 'Tank').length}
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">Tanks</div>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">💚</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
            {mockHeroes.filter(h => h.role === 'Support').length}
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">Supports</div>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold text-primary-600 dark:text-primary-400 mb-1">
            {Math.round(mockHeroes.reduce((acc, h) => acc + h.winRate, 0) / mockHeroes.length)}%
          </div>
          <div className="text-slate-600 dark:text-slate-400 text-sm">Avg Win Rate</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Role</label>
            <select 
              value={selectedRole} 
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Roles</option>
              <option value="Duelist">Duelist</option>
              <option value="Tank">Tank</option>
              <option value="Support">Support</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-900 dark:text-white">Tier</label>
            <select 
              value={selectedTier} 
              onChange={(e) => setSelectedTier(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-900 dark:text-white"
            >
              <option value="all">All Tiers</option>
              <option value="S">S Tier</option>
              <option value="A">A Tier</option>
              <option value="B">B Tier</option>
              <option value="C">C Tier</option>
            </select>
          </div>
        </div>
      </div>

      {/* Heroes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredHeroes.map(hero => (
          <div key={hero.id} className="glass rounded-xl p-6 hover:transform hover:scale-105 transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{hero.image}</div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{hero.name}</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(hero.role)}`}>
                      {hero.role}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${getTierColor(hero.tier)}`}>
                      {hero.tier} Tier
                    </span>
                  </div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-medium ${
                hero.difficulty === 'Easy' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                hero.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
              }`}>
                {hero.difficulty}
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{hero.description}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{hero.winRate}%</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Win Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{hero.pickRate}%</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Pick Rate</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600 dark:text-red-400">{hero.banRate}%</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">Ban Rate</div>
              </div>
            </div>

            {/* Abilities */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Abilities</h4>
              <div className="flex flex-wrap gap-1">
                {hero.abilities.map((ability, index) => (
                  <span key={index} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs">
                    {ability}
                  </span>
                ))}
              </div>
            </div>

            {/* Counters and Synergies */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Counters</h4>
                <div className="space-y-1">
                  {hero.counters.map((counter, index) => (
                    <div key={index} className="text-xs text-red-600 dark:text-red-400">• {counter}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Synergies</h4>
                <div className="space-y-1">
                  {hero.synergies.map((synergy, index) => (
                    <div key={index} className="text-xs text-green-600 dark:text-green-400">• {synergy}</div>
                  ))}
                </div>
              </div>
            </div>

            <button className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
              View Guide
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HeroesPage;