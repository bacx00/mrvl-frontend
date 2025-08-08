import React, { useState, useEffect } from 'react';
import {
  ChevronRight, ChevronLeft, Check, Star, Users, Trophy, Bell,
  Target, Gamepad2, Heart, MessageSquare, Flame, Gift, Crown,
  User, Camera, Shield, Zap, Award, X, Calendar
} from 'lucide-react';
import { useAuth } from '../../hooks';
import HeroImage from '../shared/HeroImage';

// Mobile Onboarding Flow for New User Engagement
function MobileOnboarding({ isOpen, onClose, onComplete }) {
  const { user, api, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [userSelections, setUserSelections] = useState({
    favoriteHero: '',
    preferredRole: '',
    favoritTeams: [],
    interests: [],
    notificationPreferences: {
      matches: true,
      news: true,
      achievements: true,
      social: false,
      challenges: true
    }
  });
  const [loading, setLoading] = useState(false);
  const [profileSetup, setProfileSetup] = useState(false);

  // Onboarding steps
  const steps = [
    {
      id: 'welcome',
      title: 'Welcome to MRVL!',
      subtitle: 'Your ultimate Marvel Rivals esports destination',
      component: WelcomeStep
    },
    {
      id: 'hero',
      title: 'Choose Your Main',
      subtitle: 'Select your favorite Marvel Rivals hero',
      component: HeroSelectionStep
    },
    {
      id: 'role',
      title: 'Pick Your Role',
      subtitle: 'What role do you prefer to play?',
      component: RoleSelectionStep
    },
    {
      id: 'teams',
      title: 'Follow Teams',
      subtitle: 'Choose teams to follow for updates',
      component: TeamSelectionStep
    },
    {
      id: 'interests',
      title: 'Your Interests',
      subtitle: 'What brings you to MRVL?',
      component: InterestSelectionStep
    },
    {
      id: 'notifications',
      title: 'Stay Updated',
      subtitle: 'Choose what notifications you want',
      component: NotificationStep
    },
    {
      id: 'complete',
      title: 'Ready to Go!',
      subtitle: 'Your account is all set up',
      component: CompletionStep
    }
  ];

  // Sample data
  const heroes = {
    'Vanguard': [
      'Captain America', 'Doctor Strange', 'Groot', 'Hulk', 'Magneto',
      'Peni Parker', 'Thor', 'Venom', 'Emma Frost', 'Mr. Fantastic'
    ],
    'Duelist': [
      'Black Panther', 'Black Widow', 'Hawkeye', 'Iron Man', 'Magik',
      'Moon Knight', 'Psylocke', 'Spider-Man', 'Storm', 'Wolverine'
    ],
    'Strategist': [
      'Adam Warlock', 'Cloak & Dagger', 'Jeff the Land Shark',
      'Loki', 'Luna Snow', 'Mantis', 'Rocket Raccoon'
    ]
  };

  const roles = [
    { id: 'Vanguard', name: 'Vanguard', icon: Shield, description: 'Tank and protect your team' },
    { id: 'Duelist', name: 'Duelist', icon: Target, description: 'Deal damage and eliminate enemies' },
    { id: 'Strategist', name: 'Strategist', icon: Heart, description: 'Support and heal teammates' }
  ];

  const sampleTeams = [
    { id: 1, name: 'Team Liquid', region: 'NA', logo: null },
    { id: 2, name: 'Sentinels', region: 'NA', logo: null },
    { id: 3, name: 'G2 Esports', region: 'EU', logo: null },
    { id: 4, name: 'FNATIC', region: 'EU', logo: null },
    { id: 5, name: 'DRX', region: 'APAC', logo: null }
  ];

  const interestOptions = [
    { id: 'competitive', name: 'Competitive Play', icon: Trophy, description: 'Tournament brackets and results' },
    { id: 'news', name: 'Esports News', icon: MessageSquare, description: 'Latest updates and announcements' },
    { id: 'community', name: 'Community', icon: Users, description: 'Forums and discussions' },
    { id: 'stats', name: 'Stats & Analytics', icon: Target, description: 'Player and team statistics' },
    { id: 'streams', name: 'Live Streams', icon: Calendar, description: 'Watch matches and content' },
    { id: 'achievements', name: 'Achievements', icon: Award, description: 'Unlock badges and rewards' }
  ];

  // Navigation handlers
  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Complete onboarding
  const completeOnboarding = async () => {
    try {
      setLoading(true);
      
      // Save user preferences
      await api.post('/user/onboarding/complete', {
        favorite_hero: userSelections.favoriteHero,
        preferred_role: userSelections.preferredRole,
        favorite_teams: userSelections.favoritTeams,
        interests: userSelections.interests,
        notification_preferences: userSelections.notificationPreferences,
        onboarding_completed: true
      });

      // Update user context
      await updateUser();
      
      // Show welcome reward
      showWelcomeReward();
      
      // Complete onboarding after reward
      setTimeout(() => {
        onComplete?.();
      }, 3000);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show welcome reward animation
  const showWelcomeReward = () => {
    const reward = document.createElement('div');
    reward.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
    reward.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl p-8 text-center animate-bounce">
        <div class="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome Bonus!</h3>
        <p class="text-gray-600 dark:text-gray-400 mb-4">+500 XP + Welcome Badge</p>
        <div class="text-green-600 font-semibold">Account Setup Complete!</div>
      </div>
    `;
    
    document.body.appendChild(reward);
    
    setTimeout(() => {
      document.body.removeChild(reward);
    }, 3000);
  };

  const CurrentStepComponent = steps[currentStep].component;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-red-500 to-purple-600 z-50 flex flex-col">
      {/* Progress Bar */}
      <div className="bg-white/10 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-2">
            <span className="text-white/80 text-sm">Step {currentStep + 1} of {steps.length}</span>
          </div>
          
          {currentStep > 0 && (
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className="w-full bg-white/20 h-1">
          <div
            className="bg-white h-1 transition-all duration-500 ease-out"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 flex flex-col">
        <CurrentStepComponent
          step={steps[currentStep]}
          selections={userSelections}
          onUpdate={setUserSelections}
          heroes={heroes}
          roles={roles}
          teams={sampleTeams}
          interests={interestOptions}
          user={user}
          loading={loading}
        />
      </div>

      {/* Navigation */}
      <div className="bg-white/10 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 0
                ? 'opacity-50 cursor-not-allowed text-white/50'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button
            onClick={currentStep === steps.length - 1 ? completeOnboarding : nextStep}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-white text-purple-600 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <span>
              {loading ? 'Setting up...' : currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </span>
            {!loading && (
              currentStep === steps.length - 1 ? 
                <Check className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Individual Step Components
function WelcomeStep({ step }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-8 animate-pulse">
        <Gamepad2 className="w-12 h-12 text-white" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4">{step.title}</h1>
      <p className="text-xl text-white/80 mb-8">{step.subtitle}</p>
      
      <div className="space-y-4 text-white/70">
        <div className="flex items-center justify-center space-x-3">
          <Trophy className="w-5 h-5" />
          <span>Track tournament results</span>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <Users className="w-5 h-5" />
          <span>Connect with the community</span>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <Award className="w-5 h-5" />
          <span>Unlock achievements and badges</span>
        </div>
      </div>
    </div>
  );
}

function HeroSelectionStep({ step, selections, onUpdate, heroes }) {
  const handleHeroSelect = (hero) => {
    onUpdate(prev => ({ ...prev, favoriteHero: hero }));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-white/80">{step.subtitle}</p>
      </div>

      <div className="space-y-6">
        {Object.entries(heroes).map(([role, roleHeroes]) => (
          <div key={role}>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
              <span className={`w-3 h-3 rounded-full mr-2 ${
                role === 'Vanguard' ? 'bg-blue-400' : 
                role === 'Duelist' ? 'bg-red-400' : 
                'bg-green-400'
              }`}></span>
              {role}
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {roleHeroes.slice(0, 6).map(hero => (
                <button
                  key={hero}
                  onClick={() => handleHeroSelect(hero)}
                  className={`relative p-3 rounded-xl transition-all ${
                    selections.favoriteHero === hero
                      ? 'bg-white text-purple-600 scale-105 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
                  }`}
                >
                  <div className="w-12 h-12 bg-white/20 rounded-lg mx-auto mb-2 flex items-center justify-center">
                    <HeroImage heroName={hero} size="sm" className="w-full h-full object-cover rounded-lg" />
                  </div>
                  <div className="text-xs font-medium text-center">{hero}</div>
                  {selections.favoriteHero === hero && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleSelectionStep({ step, selections, onUpdate, roles }) {
  const handleRoleSelect = (roleId) => {
    onUpdate(prev => ({ ...prev, preferredRole: roleId }));
  };

  return (
    <div className="flex-1 p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-white/80">{step.subtitle}</p>
      </div>

      <div className="space-y-4">
        {roles.map(role => {
          const Icon = role.icon;
          const isSelected = selections.preferredRole === role.id;
          
          return (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role.id)}
              className={`w-full p-6 rounded-xl transition-all text-left ${
                isSelected
                  ? 'bg-white text-purple-600 scale-105 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30 hover:scale-105'
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-purple-100' : 'bg-white/20'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{role.name}</h3>
                  <p className={`text-sm ${isSelected ? 'text-purple-500' : 'text-white/70'}`}>
                    {role.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TeamSelectionStep({ step, selections, onUpdate, teams }) {
  const handleTeamToggle = (teamId) => {
    onUpdate(prev => ({
      ...prev,
      favoritTeams: prev.favoritTeams.includes(teamId)
        ? prev.favoritTeams.filter(id => id !== teamId)
        : [...prev.favoritTeams, teamId]
    }));
  };

  return (
    <div className="flex-1 p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-white/80">{step.subtitle}</p>
        <p className="text-white/60 text-sm mt-2">Select up to 3 teams</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {teams.map(team => {
          const isSelected = selections.favoritTeams.includes(team.id);
          const canSelect = selections.favoritTeams.length < 3 || isSelected;
          
          return (
            <button
              key={team.id}
              onClick={() => handleTeamToggle(team.id)}
              disabled={!canSelect}
              className={`p-4 rounded-xl transition-all text-left ${
                isSelected
                  ? 'bg-white text-purple-600 scale-105 shadow-lg'
                  : canSelect
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                  isSelected ? 'bg-purple-100 text-purple-600' : 'bg-white/20 text-white'
                }`}>
                  {team.logo ? (
                    <img src={team.logo} alt={team.name} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    team.name.substring(0, 2).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className={`text-sm ${isSelected ? 'text-purple-500' : 'text-white/70'}`}>
                    {team.region}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InterestSelectionStep({ step, selections, onUpdate, interests }) {
  const handleInterestToggle = (interestId) => {
    onUpdate(prev => ({
      ...prev,
      interests: prev.interests.includes(interestId)
        ? prev.interests.filter(id => id !== interestId)
        : [...prev.interests, interestId]
    }));
  };

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-white/80">{step.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {interests.map(interest => {
          const Icon = interest.icon;
          const isSelected = selections.interests.includes(interest.id);
          
          return (
            <button
              key={interest.id}
              onClick={() => handleInterestToggle(interest.id)}
              className={`p-4 rounded-xl transition-all text-left ${
                isSelected
                  ? 'bg-white text-purple-600 scale-105 shadow-lg'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isSelected ? 'bg-purple-100' : 'bg-white/20'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{interest.name}</h3>
                  <p className={`text-sm ${isSelected ? 'text-purple-500' : 'text-white/70'}`}>
                    {interest.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NotificationStep({ step, selections, onUpdate }) {
  const handleNotificationToggle = (type) => {
    onUpdate(prev => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [type]: !prev.notificationPreferences[type]
      }
    }));
  };

  const notificationTypes = [
    { id: 'matches', name: 'Match Updates', icon: Trophy, description: 'Live scores and match results' },
    { id: 'news', name: 'News & Updates', icon: MessageSquare, description: 'Latest esports news' },
    { id: 'achievements', name: 'Achievements', icon: Award, description: 'Badges and milestone rewards' },
    { id: 'social', name: 'Social Activity', icon: Users, description: 'Follows, likes, and mentions' },
    { id: 'challenges', name: 'Daily Challenges', icon: Target, description: 'New challenges and rewards' }
  ];

  return (
    <div className="flex-1 p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">{step.title}</h2>
        <p className="text-white/80">{step.subtitle}</p>
      </div>

      <div className="space-y-3">
        {notificationTypes.map(type => {
          const Icon = type.icon;
          const isEnabled = selections.notificationPreferences[type.id];
          
          return (
            <div
              key={type.id}
              className="flex items-center justify-between p-4 bg-white/20 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{type.name}</h3>
                  <p className="text-sm text-white/70">{type.description}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleNotificationToggle(type.id)}
                className={`w-12 h-6 rounded-full transition-all ${
                  isEnabled ? 'bg-green-500' : 'bg-white/30'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-all ${
                  isEnabled ? 'translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CompletionStep({ step, user, loading }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 animate-bounce">
        <Check className="w-12 h-12 text-white" />
      </div>
      
      <h1 className="text-4xl font-bold text-white mb-4">{step.title}</h1>
      <p className="text-xl text-white/80 mb-8">{step.subtitle}</p>
      
      <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-2">Welcome Bonus</h3>
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-medium">+500 XP</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-white font-medium">Welcome Badge</span>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center space-x-2 text-white/70">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          <span>Setting up your account...</span>
        </div>
      )}
    </div>
  );
}

export default MobileOnboarding;