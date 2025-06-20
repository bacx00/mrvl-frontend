import React, { useState } from 'react';

// ✅ MARVEL RIVALS HERO AVATARS - Real hero roster aligned with backend
const MARVEL_HEROES = {
  'Tank': [
    { name: 'Captain America', image: 'captain-america-headbig.webp', emoji: '🛡️' },
    { name: 'Doctor Strange', image: 'doctor-strange-headbig.webp', emoji: '🔮' },
    { name: 'Groot', image: 'groot-headbig.webp', emoji: '🌳' },
    { name: 'Hulk', image: 'bruce-banner-headbig.webp', emoji: '💚' },
    { name: 'Magneto', image: 'magneto-headbig.webp', emoji: '🧲' },
    { name: 'Peni Parker', image: 'peni-parker-headbig.webp', emoji: '🕷️' },
    { name: 'The Thing', image: 'the-thing-headbig.webp', emoji: '🪨' },
    { name: 'Thor', image: 'thor-headbig.webp', emoji: '⚡' },
    { name: 'Venom', image: 'venom-headbig.webp', emoji: '🖤' }
  ],
  'Duelist': [
    { name: 'Black Panther', image: 'black-panther-headbig.webp', emoji: '🐾' },
    { name: 'Black Widow', image: 'black-widow-headbig.webp', emoji: '🕸️' },
    { name: 'Hawkeye', image: 'hawkeye-headbig.webp', emoji: '🏹' },
    { name: 'Hela', image: 'hela-headbig.webp', emoji: '💀' },
    { name: 'Human Torch', image: 'human-torch-headbig.webp', emoji: '🔥' },
    { name: 'Iron Fist', image: 'iron-fist-headbig.webp', emoji: '👊' },
    { name: 'Iron Man', image: 'iron-man-headbig.webp', emoji: '🤖' },
    { name: 'Magik', image: 'magik-headbig.webp', emoji: '⚔️' },
    { name: 'Moon Knight', image: 'moon-knight-headbig.webp', emoji: '🌙' },
    { name: 'Namor', image: 'namor-headbig.webp', emoji: '🔱' },
    { name: 'Psylocke', image: 'psylocke-headbig.webp', emoji: '🗡️' },
    { name: 'The Punisher', image: 'the-punisher-headbig.webp', emoji: '💀' },
    { name: 'Scarlet Witch', image: 'scarlet-witch-headbig.webp', emoji: '🔴' },
    { name: 'Spider-Man', image: 'spider-man-headbig.webp', emoji: '🕷️' },
    { name: 'Squirrel Girl', image: 'squirrel-girl-headbig.webp', emoji: '🐿️' },
    { name: 'Star-Lord', image: 'star-lord-headbig.webp', emoji: '⭐' },
    { name: 'Storm', image: 'storm-headbig.webp', emoji: '⛈️' }
  ],
  'Support': [
    { name: 'Adam Warlock', image: 'adam-warlock-headbig.webp', emoji: '✨' },
    { name: 'Cloak & Dagger', image: 'cloak-dagger-headbig.webp', emoji: '🌓' },
    { name: 'Invisible Woman', image: 'invisible-woman-headbig.webp', emoji: '👻' },
    { name: 'Jeff the Land Shark', image: 'jeff-the-land-shark-headbig.webp', emoji: '🦈' },
    { name: 'Loki', image: 'loki-headbig.webp', emoji: '🐍' },
    { name: 'Luna Snow', image: 'luna-snow-headbig.webp', emoji: '❄️' },
    { name: 'Mantis', image: 'mantis-headbig.webp', emoji: '🌱' },
    { name: 'Rocket Raccoon', image: 'rocket-raccoon-headbig.webp', emoji: '🦝' }
  ]
};

const getRoleColor = (role) => {
  switch (role) {
    case 'Tank': return 'bg-blue-600 text-white';
    case 'Duelist': return 'bg-red-600 text-white';
    case 'Support': return 'bg-green-600 text-white';
    default: return 'bg-gray-600 text-white';
  }
};

function HeroAvatarSelector({ currentAvatar, onAvatarSelect, onClose }) {
  const [selectedRole, setSelectedRole] = useState('Tank');

  const handleHeroSelect = (hero) => {
    console.log('🦸 Hero avatar selected:', hero.name, hero.image);
    onAvatarSelect({
      name: hero.name,
      image: hero.image,
      emoji: hero.emoji,
      role: selectedRole
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                🦸 Choose Your Hero Avatar
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select a Marvel Rivals hero as your profile picture
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            {Object.keys(MARVEL_HEROES).map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  selectedRole === role
                    ? getRoleColor(role)
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {role === 'Tank' ? '🛡️' : role === 'Duelist' ? '⚔️' : '💚'} {role} ({MARVEL_HEROES[role].length})
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {MARVEL_HEROES[selectedRole].map((hero) => (
              <div key={hero.name} className="group relative">
                <button
                  onClick={() => handleHeroSelect(hero)}
                  className={`w-full aspect-square rounded-xl overflow-hidden border-4 transition-all duration-300 transform hover:scale-105 ${
                    currentAvatar?.name === hero.name
                      ? 'border-red-500 shadow-lg shadow-red-500/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-700'
                  }`}
                >
                  <img 
                    src={`/Heroes/${hero.image}`}
                    alt={hero.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  
                  <div 
                    className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800"
                    style={{ display: 'none' }}
                  >
                    {hero.emoji}
                  </div>
                  
                  <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRoleColor(selectedRole)}`}>
                    {selectedRole === 'Tank' ? '🛡️' : selectedRole === 'Duelist' ? '⚔️' : '💚'}
                  </div>
                  
                  {currentAvatar?.name === hero.name && (
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                      ✓
                    </div>
                  )}
                </button>
                
                <div className="mt-2 text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {hero.name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {MARVEL_HEROES[selectedRole].length} {selectedRole} heroes available
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
              {currentAvatar && (
                <button
                  onClick={() => {
                    onAvatarSelect(null);
                    onClose();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Remove Avatar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroAvatarSelector;
