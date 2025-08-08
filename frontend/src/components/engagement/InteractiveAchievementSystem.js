import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, Star, Zap, Target, Crown, Award, Flame, Heart, 
         TrendingUp, Users, Calendar, Timer } from 'lucide-react';
import { hapticFeedback } from '../mobile/MobileGestures';

// Achievement Badge Component with Touch Interactions
export const AchievementBadge = ({ 
  achievement, 
  size = 'medium', 
  interactive = true, 
  unlocked = false,
  progress = 0,
  showProgress = true,
  onClick = null,
  onLongPress = null
}) => {
  const [isRevealed, setIsRevealed] = useState(unlocked);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particles, setParticles] = useState([]);
  const badgeRef = useRef(null);
  const longPressTimer = useRef(null);

  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16', 
    large: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const iconSizes = {
    small: 16,
    medium: 20,
    large: 32,
    xl: 48
  };

  // Achievement Icons Map
  const achievementIcons = {
    'first_win': Trophy,
    'win_streak': Flame,
    'social_butterfly': Users,
    'daily_visitor': Calendar,
    'speed_demon': Timer,
    'trending_star': TrendingUp,
    'community_love': Heart,
    'prediction_master': Target,
    'esports_expert': Crown,
    'collector': Star,
    'power_user': Zap,
    'default': Award
  };

  const Icon = achievementIcons[achievement.type] || achievementIcons.default;

  // Touch Handlers
  const handleTouchStart = useCallback((e) => {
    if (!interactive) return;
    
    hapticFeedback.light();
    
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress(achievement);
        hapticFeedback.medium();
      }, 500);
    }
  }, [interactive, achievement, onLongPress]);

  const handleTouchEnd = useCallback((e) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    
    if (!interactive) return;
    
    if (unlocked && onClick) {
      onClick(achievement);
    } else if (!unlocked && progress >= 100) {
      // Unlock animation
      unlockAchievement();
    }
  }, [interactive, unlocked, progress, achievement, onClick]);

  // Unlock Animation
  const unlockAchievement = useCallback(() => {
    setIsAnimating(true);
    setIsRevealed(true);
    
    // Create celebration particles
    const particleCount = 20;
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 300,
      type: ['star', 'sparkle', 'confetti'][Math.floor(Math.random() * 3)]
    }));
    
    setParticles(newParticles);
    hapticFeedback.achievement();
    
    // Clean up particles
    setTimeout(() => {
      setParticles([]);
      setIsAnimating(false);
    }, 1500);
  }, []);

  // Progress Circle
  const progressCircle = showProgress && progress < 100 ? (
    <div className="absolute inset-0 rounded-full">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="rgba(239, 68, 68, 0.2)"
          strokeWidth="2"
        />
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          fill="none"
          stroke="rgb(239, 68, 68)"
          strokeWidth="2"
          strokeDasharray={`${2 * Math.PI * 0.45 * 100} ${2 * Math.PI * 0.45 * 100}`}
          strokeDashoffset={`${2 * Math.PI * 0.45 * 100 * (1 - progress / 100)}`}
          className="transition-all duration-500 ease-out"
        />
      </svg>
    </div>
  ) : null;

  return (
    <div
      ref={badgeRef}
      className={`
        relative ${sizeClasses[size]} 
        ${interactive ? 'cursor-pointer select-none' : ''}
        ${isAnimating ? 'animate-pulse' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={!interactive ? undefined : handleTouchEnd}
    >
      {/* Progress Circle */}
      {progressCircle}
      
      {/* Main Badge */}
      <div className={`
        absolute inset-0 rounded-full flex items-center justify-center
        ${isRevealed 
          ? `bg-gradient-to-br ${achievement.gradient || 'from-red-500 to-red-700'} shadow-lg`
          : 'bg-gray-600 opacity-50'
        }
        transition-all duration-300 transform
        ${interactive ? 'hover:scale-105 active:scale-95' : ''}
      `}>
        <Icon 
          size={iconSizes[size]} 
          className={`
            ${isRevealed ? 'text-white' : 'text-gray-400'}
            transition-colors duration-300
          `}
        />
        
        {/* Glow Effect */}
        {isRevealed && (
          <div className={`
            absolute inset-0 rounded-full
            bg-gradient-to-br ${achievement.gradient || 'from-red-500 to-red-700'}
            opacity-30 blur-sm scale-110
          `} />
        )}
      </div>
      
      {/* Progress Text */}
      {showProgress && progress < 100 && progress > 0 && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
          <span className="text-xs text-gray-600 font-medium">
            {Math.round(progress)}%
          </span>
        </div>
      )}
      
      {/* Celebration Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`
            absolute w-2 h-2 rounded-full
            ${particle.type === 'star' ? 'bg-yellow-400' : 
              particle.type === 'sparkle' ? 'bg-blue-400' : 'bg-red-400'}
            animate-ping
          `}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  );
};

// Streak System Component
export const StreakDisplay = ({ 
  currentStreak = 0, 
  maxStreak = 0, 
  type = 'daily',
  interactive = true 
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [flames, setFlames] = useState([]);

  useEffect(() => {
    if (currentStreak > 0) {
      // Create flame particles for streak visualization
      const flameCount = Math.min(currentStreak, 10);
      const newFlames = Array.from({ length: flameCount }, (_, i) => ({
        id: i,
        delay: i * 50,
        height: Math.random() * 20 + 10
      }));
      setFlames(newFlames);
    }
  }, [currentStreak]);

  const handleStreakTouch = useCallback(() => {
    if (!interactive || currentStreak === 0) return;
    
    setShowAnimation(true);
    hapticFeedback.streak();
    
    setTimeout(() => setShowAnimation(false), 800);
  }, [interactive, currentStreak]);

  const getStreakColor = () => {
    if (currentStreak >= 30) return 'from-purple-500 to-pink-500';
    if (currentStreak >= 14) return 'from-red-500 to-orange-500';
    if (currentStreak >= 7) return 'from-orange-500 to-yellow-500';
    return 'from-yellow-500 to-orange-400';
  };

  return (
    <div 
      className={`
        relative p-4 rounded-xl
        bg-gradient-to-r ${getStreakColor()}
        ${interactive ? 'cursor-pointer' : ''}
        ${showAnimation ? 'animate-pulse' : ''}
        transform transition-transform
        ${interactive ? 'hover:scale-105 active:scale-95' : ''}
      `}
      onTouchEnd={handleStreakTouch}
      onClick={handleStreakTouch}
    >
      <div className="flex items-center justify-between text-white">
        <div className="flex items-center space-x-2">
          <Flame size={24} className="animate-bounce" />
          <div>
            <div className="text-2xl font-bold">{currentStreak}</div>
            <div className="text-sm opacity-80">
              {type} streak
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm opacity-80">Best</div>
          <div className="text-lg font-semibold">{maxStreak}</div>
        </div>
      </div>
      
      {/* Flame Animation */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center space-x-1">
        {flames.map(flame => (
          <div
            key={flame.id}
            className="w-1 bg-gradient-to-t from-red-500 to-yellow-300 rounded-full animate-pulse"
            style={{
              height: `${flame.height}px`,
              animationDelay: `${flame.delay}ms`
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Progress Indicator with Particle Effects
export const ProgressIndicator = ({ 
  current = 0, 
  max = 100, 
  label = 'Progress',
  showParticles = true,
  color = 'red',
  animated = true 
}) => {
  const [particles, setParticles] = useState([]);
  const progressRef = useRef(null);
  const percentage = Math.min((current / max) * 100, 100);

  useEffect(() => {
    if (showParticles && percentage > 0) {
      const particleCount = Math.floor(percentage / 10);
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: (percentage / 100) * 100 + Math.random() * 10 - 5,
        opacity: Math.random() * 0.5 + 0.5,
        delay: i * 100
      }));
      setParticles(newParticles);
    }
  }, [percentage, showParticles]);

  const colorClasses = {
    red: 'from-red-500 to-red-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    yellow: 'from-yellow-500 to-yellow-600'
  };

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{current}/{max}</span>
      </div>
      
      <div 
        ref={progressRef}
        className="relative h-3 bg-gray-200 rounded-full overflow-hidden"
      >
        <div
          className={`
            h-full bg-gradient-to-r ${colorClasses[color]}
            rounded-full transition-all duration-500 ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />
        
        {/* Particle Effects */}
        {particles.map(particle => (
          <div
            key={particle.id}
            className="absolute top-1/2 w-1 h-1 bg-white rounded-full animate-ping"
            style={{
              left: `${particle.x}%`,
              transform: 'translateY(-50%)',
              opacity: particle.opacity,
              animationDelay: `${particle.delay}ms`,
              animationDuration: '2s'
            }}
          />
        ))}
      </div>
    </div>
  );
};

// Achievement Showcase Modal
export const AchievementShowcase = ({ 
  achievement, 
  isOpen = false, 
  onClose = () => {},
  onShare = null 
}) => {
  const [confetti, setConfetti] = useState([]);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Create confetti effect
      const confettiCount = 50;
      const newConfetti = Array.from({ length: confettiCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        delay: Math.random() * 1000,
        color: ['red', 'blue', 'yellow', 'green', 'purple'][Math.floor(Math.random() * 5)]
      }));
      
      setConfetti(newConfetti);
      hapticFeedback.levelUp();
      
      // Auto-hide confetti
      setTimeout(() => setConfetti([]), 3000);
    }
  }, [isOpen]);

  if (!isOpen || !achievement) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-2xl p-6 max-w-sm w-full relative overflow-hidden"
      >
        {/* Confetti */}
        {confetti.map(particle => (
          <div
            key={particle.id}
            className={`
              absolute w-3 h-3 
              bg-${particle.color}-400
              transform rotate-45
              animate-bounce
            `}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}ms`,
              animationDuration: '2s',
              transform: `rotate(${particle.rotation}deg)`
            }}
          />
        ))}
        
        {/* Content */}
        <div className="text-center relative z-10">
          <div className="mb-4">
            <AchievementBadge
              achievement={achievement}
              size="xl"
              unlocked={true}
              interactive={false}
            />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {achievement.name}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {achievement.description}
          </p>
          
          <div className="text-sm text-gray-500 mb-6">
            Unlocked on {new Date(achievement.unlockedAt).toLocaleDateString()}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-3">
            {onShare && (
              <button
                className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium
                         hover:bg-red-700 active:bg-red-800 transition-colors"
                onClick={() => onShare(achievement)}
              >
                Share Achievement
              </button>
            )}
            
            <button
              className="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium
                       hover:bg-gray-300 active:bg-gray-400 transition-colors"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Touch-to-Reveal Achievement Details
export const TouchRevealCard = ({ achievement, children }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [pressure, setPressure] = useState(0);
  const cardRef = useRef(null);

  const handleTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    if (touch.force) {
      setPressure(touch.force);
      if (touch.force > 0.5) {
        setIsRevealed(true);
        hapticFeedback.medium();
      }
    } else {
      // Fallback for devices without force touch
      setTimeout(() => {
        setIsRevealed(true);
        hapticFeedback.medium();
      }, 300);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    setPressure(0);
    setTimeout(() => setIsRevealed(false), 2000);
  }, []);

  return (
    <div
      ref={cardRef}
      className="relative overflow-hidden rounded-lg cursor-pointer"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Base Content */}
      <div className={`transition-all duration-300 ${isRevealed ? 'blur-sm' : ''}`}>
        {children}
      </div>
      
      {/* Reveal Overlay */}
      {isRevealed && (
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-700 
                       flex items-center justify-center text-white p-4 animate-fadeIn">
          <div className="text-center">
            <AchievementBadge
              achievement={achievement}
              size="large"
              unlocked={true}
              interactive={false}
            />
            <h3 className="text-lg font-bold mt-2">{achievement.name}</h3>
            <p className="text-sm opacity-90 mt-1">{achievement.description}</p>
          </div>
        </div>
      )}
      
      {/* Pressure Indicator */}
      {pressure > 0 && (
        <div 
          className="absolute bottom-2 left-2 right-2 h-1 bg-white bg-opacity-30 rounded"
        >
          <div 
            className="h-full bg-white rounded transition-all duration-100"
            style={{ width: `${Math.min(pressure * 200, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default {
  AchievementBadge,
  StreakDisplay,
  ProgressIndicator,
  AchievementShowcase,
  TouchRevealCard
};