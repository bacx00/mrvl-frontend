import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';

function HeroesPage() {
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedTier, setSelectedTier] = useState('all');
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHeroes();
  }, []);

  const fetchHeroes = async () => {
    try {
      const response = await api.get('/heroes');
      const heroesData = response?.data?.data || response?.data || [];
      setHeroes(heroesData);
    } catch (error) {
      console.error('Error fetching heroes:', error);
      setHeroes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredHeroes = heroes.filter(hero => {
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
      case 'Vanguard':
      case 'Tank': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'Strategist':
      case 'Support': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold gradient-text">Heroes Meta</h1>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-select"
            >
              <option value="all">All Roles</option>
              <option value="Duelist">Duelist</option>
              <option value="Vanguard">Vanguard</option>
              <option value="Strategist">Strategist</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="form-select"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredHeroes.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-slate-600 dark:text-slate-400">No heroes found matching your filters.</p>
          </div>
        ) : (
          filteredHeroes.map((hero) => (
            <div key={hero.id} className="card hover-lift">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{hero.name}</h3>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(hero.role)}`}>
                        {hero.role}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getTierColor(hero.tier)}`}>
                        {hero.tier} Tier
                      </span>
                    </div>
                  </div>
                  <div className="text-4xl">
                    {hero.image || '🦸'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Win Rate</span>
                    <span className="font-medium">{hero.win_rate || hero.winRate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Pick Rate</span>
                    <span className="font-medium">{hero.pick_rate || hero.pickRate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Ban Rate</span>
                    <span className="font-medium">{hero.ban_rate || hero.banRate || 0}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Difficulty</span>
                    <span className="font-medium">{hero.difficulty || 'Medium'}</span>
                  </div>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {hero.description || 'A powerful Marvel Rivals hero.'}
                </p>

                {hero.abilities && hero.abilities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium mb-2">Abilities</h4>
                    <div className="flex flex-wrap gap-1">
                      {hero.abilities.map((ability, idx) => (
                        <span key={idx} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">
                          {ability}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {hero.counters && hero.counters.length > 0 && (
                    <div>
                      <span className="font-medium text-red-600 dark:text-red-400">Weak vs:</span>
                      <div className="text-slate-600 dark:text-slate-400">
                        {hero.counters.join(', ')}
                      </div>
                    </div>
                  )}
                  {hero.synergies && hero.synergies.length > 0 && (
                    <div>
                      <span className="font-medium text-green-600 dark:text-green-400">Strong with:</span>
                      <div className="text-slate-600 dark:text-slate-400">
                        {hero.synergies.join(', ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default HeroesPage;