import React, { useState } from 'react';
import { useAuth } from '../../hooks';
import HeroAvatarSelector from '../HeroAvatarSelector';

function TestPage({ navigateTo }) {
  const { user, isAdmin, isModerator } = useAuth();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedHero, setSelectedHero] = useState(null);

  const testFeatures = [
    {
      name: '🦸 Hero Avatar Selector',
      description: 'Test the Marvel Rivals hero avatar selection',
      test: () => setShowAvatarSelector(true),
      status: 'Working'
    },
    {
      name: '🔴 Admin Role Check', 
      description: 'Check if admin role detection works',
      test: () => alert(`Admin Status: ${isAdmin() ? 'YES - You are an admin!' : 'NO - You are not an admin'}`),
      status: isAdmin() ? 'Admin' : 'Not Admin'
    },
    {
      name: '🟡 Moderator Role Check',
      description: 'Check if moderator role detection works', 
      test: () => alert(`Moderator Status: ${isModerator() ? 'YES - You are a moderator!' : 'NO - You are not a moderator'}`),
      status: isModerator() ? 'Moderator' : 'Not Moderator'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          🧪 MRVL Platform Test Suite
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Test all the features and functionality we've built
        </p>
      </div>

      <div className="card p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/10 dark:to-red-800/10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Current User Status
            </h2>
            {user ? (
              <div className="mt-2 space-y-1">
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Name:</strong> {user.name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Email:</strong> {user.email}
                </p>
                <div className="flex space-x-2 mt-2">
                  {isAdmin() && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                      🔴 Admin
                    </span>
                  )}
                  {isModerator() && !isAdmin() && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      🟡 Moderator
                    </span>
                  )}
                  {!isAdmin() && !isModerator() && (
                    <span className="px-2 py-1 text-xs font-bold rounded bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                      🟢 User
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Not logged in - Please sign in to test user features
              </p>
            )}
          </div>
          
          {selectedHero && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mb-2 mx-auto border-4 border-red-500">
                <img 
                  src={`/Heroes/${selectedHero.image}`}
                  alt={selectedHero.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {selectedHero.name}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {testFeatures.map((feature, index) => (
          <div key={index} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {feature.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {feature.description}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs font-bold rounded ${
                feature.status === 'Working' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                  : feature.status === 'Admin' 
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
              }`}>
                {feature.status}
              </span>
            </div>
            
            <button
              onClick={feature.test}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Test Feature
            </button>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          🚀 Quick Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigateTo('home')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            🏠 Go Home
          </button>
          {isAdmin() && (
            <button
              onClick={() => navigateTo('admin-dashboard')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              🛡️ Admin Dashboard
            </button>
          )}
        </div>
      </div>

      {showAvatarSelector && (
        <HeroAvatarSelector
          currentAvatar={selectedHero}
          onAvatarSelect={(hero) => {
            setSelectedHero(hero);
            setShowAvatarSelector(false);
            if (hero) {
              alert(`✅ Hero avatar selected: ${hero.name} (${hero.role})`);
            }
          }}
          onClose={() => setShowAvatarSelector(false)}
        />
      )}
    </div>
  );
}

export default TestPage;
