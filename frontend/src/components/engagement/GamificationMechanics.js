import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Star, Zap, Trophy, Target, Crown, Gift, Coins, 
         Calendar, CheckCircle, Lock, Sparkles, TrendingUp } from 'lucide-react';
import { hapticFeedback } from '../mobile/MobileGestures';

// XP System with Level-Up Animations
export const XPSystem = ({ 
  currentXP = 0, 
  currentLevel = 1, 
  onLevelUp = () => {},
  animated = true 
}) => {
  const [displayXP, setDisplayXP] = useState(currentXP);
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [particles, setParticles] = useState([]);
  const animationRef = useRef(null);

  // XP requirements for each level (exponential curve)
  const getXPForLevel = (level) => Math.floor(100 * Math.pow(1.5, level - 1));
  
  const getLevelFromXP = (xp) => {
    let level = 1;
    let totalXP = 0;
    while (totalXP + getXPForLevel(level) <= xp) {
      totalXP += getXPForLevel(level);
      level++;
    }
    return level;
  };

  const currentLevelXP = () => {
    let totalXP = 0;
    for (let i = 1; i < currentLevel; i++) {
      totalXP += getXPForLevel(i);
    }
    return totalXP;
  };

  const nextLevelXP = () => currentLevelXP() + getXPForLevel(currentLevel);
  const progressXP = displayXP - currentLevelXP();
  const requiredXP = getXPForLevel(currentLevel);
  const progress = (progressXP / requiredXP) * 100;

  // Animate XP gain
  useEffect(() => {
    if (!animated || displayXP === currentXP) return;

    const animateXP = () => {
      setDisplayXP(prev => {
        const diff = currentXP - prev;
        const step = Math.ceil(diff / 30);
        const newXP = prev + step;
        
        if (newXP >= currentXP) {
          return currentXP;
        }
        
        requestAnimationFrame(animateXP);
        return newXP;
      });
    };

    animationRef.current = requestAnimationFrame(animateXP);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [currentXP, animated]);

  // Check for level up
  useEffect(() => {
    const newLevel = getLevelFromXP(displayXP);
    if (newLevel > currentLevel) {
      setIsLevelingUp(true);
      
      // Create celebration particles
      const particleCount = 30;
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 500,
        type: ['star', 'sparkle'][Math.floor(Math.random() * 2)]
      }));
      
      setParticles(newParticles);
      hapticFeedback.levelUp();
      onLevelUp(newLevel);
      
      // Clear particles and animation
      setTimeout(() => {
        setParticles([]);
        setIsLevelingUp(false);
      }, 2000);
    }
  }, [displayXP, currentLevel, onLevelUp]);

  return (
    <div className={`
      relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-4 text-white
      ${isLevelingUp ? 'animate-pulse' : ''}
    `}>
      {/* Level Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <Crown size={20} />
          </div>
          <div>
            <div className="text-sm opacity-80">Level</div>
            <div className="text-2xl font-bold">{currentLevel}</div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-sm opacity-80">XP</div>
          <div className="text-lg font-semibold">
            {displayXP.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="flex justify-between text-sm mb-1 opacity-80">
          <span>{progressXP.toLocaleString()}</span>
          <span>{requiredXP.toLocaleString()} XP</span>
        </div>
        <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full 
                     transition-all duration-500 ease-out relative"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white 
                           via-white to-transparent opacity-30 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Level Up Animation Particles */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className={`
            absolute w-2 h-2 
            ${particle.type === 'star' ? 'bg-yellow-300' : 'bg-blue-300'}
            rounded-full animate-ping pointer-events-none
          `}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}ms`,
            animationDuration: '1.5s'
          }}
        />
      ))}
      
      {/* Level Up Text */}
      {isLevelingUp && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-3xl font-bold animate-bounce">LEVEL UP!</div>
            <div className="text-lg">Level {currentLevel + 1}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Daily Challenges with Swipe-to-Complete
export const DailyChallenges = ({ 
  challenges = [],
  onCompleteChallenge = () => {},
  onClaimReward = () => {} 
}) => {
  const [completedChallenges, setCompletedChallenges] = useState(new Set());
  const [swipingChallenge, setSwipingChallenge] = useState(null);
  const [swipeProgress, setSwipeProgress] = useState(0);

  const challengeTypes = {
    watch: { icon: Target, color: 'from-green-500 to-green-600', label: 'Watch' },
    predict: { icon: Trophy, color: 'from-blue-500 to-blue-600', label: 'Predict' },
    social: { icon: Star, color: 'from-purple-500 to-purple-600', label: 'Social' },
    streak: { icon: Zap, color: 'from-orange-500 to-orange-600', label: 'Streak' }
  };

  const handleSwipeStart = useCallback((challengeId, e) => {
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge && challenge.progress >= challenge.target) {
      setSwipingChallenge(challengeId);
      hapticFeedback.light();
    }
  }, [challenges]);

  const handleSwipeMove = useCallback((challengeId, e) => {
    if (swipingChallenge !== challengeId) return;
    
    const touch = e.touches[0];
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const progress = Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100));
    
    setSwipeProgress(progress);
    
    if (progress > 80) {
      hapticFeedback.medium();
    }
  }, [swipingChallenge]);

  const handleSwipeEnd = useCallback((challengeId) => {
    if (swipingChallenge !== challengeId) return;
    
    if (swipeProgress > 80) {
      // Complete the challenge
      setCompletedChallenges(prev => new Set([...prev, challengeId]));
      onCompleteChallenge(challengeId);
      hapticFeedback.success();
    }
    
    setSwipingChallenge(null);
    setSwipeProgress(0);
  }, [swipingChallenge, swipeProgress, onCompleteChallenge]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Daily Challenges</h3>
        <div className="flex items-center space-x-1 text-sm text-gray-600">
          <Calendar size={16} />
          <span>Resets in 12h</span>
        </div>
      </div>

      <div className="space-y-3">
        {challenges.map(challenge => {
          const isCompleted = completedChallenges.has(challenge.id);
          const canComplete = challenge.progress >= challenge.target;
          const progressPercentage = (challenge.progress / challenge.target) * 100;
          const { icon: Icon, color, label } = challengeTypes[challenge.type] || challengeTypes.watch;
          
          return (
            <div
              key={challenge.id}
              className={`
                relative rounded-lg border overflow-hidden
                ${isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}
                ${canComplete && !isCompleted ? 'cursor-pointer' : ''}
              `}
              onTouchStart={canComplete && !isCompleted ? (e) => handleSwipeStart(challenge.id, e) : undefined}
              onTouchMove={canComplete && !isCompleted ? (e) => handleSwipeMove(challenge.id, e) : undefined}
              onTouchEnd={canComplete && !isCompleted ? () => handleSwipeEnd(challenge.id) : undefined}
            >
              {/* Swipe Progress Background */}
              {swipingChallenge === challenge.id && (
                <div
                  className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-500 opacity-20 transition-all"
                  style={{ width: `${swipeProgress}%` }}
                />
              )}

              <div className="p-4 relative">
                <div className="flex items-center space-x-3">
                  {/* Challenge Icon */}
                  <div className={`
                    w-12 h-12 rounded-lg bg-gradient-to-r ${color} 
                    flex items-center justify-center text-white
                  `}>
                    <Icon size={20} />
                  </div>

                  {/* Challenge Info */}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                    <p className="text-sm text-gray-600">{challenge.description}</p>
                    
                    {/* Progress */}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>{challenge.progress}/{challenge.target}</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 bg-gradient-to-r ${color} rounded-full transition-all duration-300`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Status/Reward */}
                  <div className="text-right">
                    {isCompleted ? (
                      <div className="text-green-600">
                        <CheckCircle size={24} />
                        <div className="text-xs mt-1">+{challenge.reward.xp} XP</div>
                      </div>
                    ) : canComplete ? (
                      <div className="text-orange-600 text-center">
                        <div className="text-sm font-medium">Swipe →</div>
                        <div className="text-xs">+{challenge.reward.xp} XP</div>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <Lock size={20} />
                        <div className="text-xs mt-1">+{challenge.reward.xp} XP</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Touch-based Mini-games during Loading
export const LoadingMiniGame = ({ 
  isLoading = false,
  duration = 3000,
  onGameComplete = () => {},
  gameType = 'tap' 
}) => {
  const [gameActive, setGameActive] = useState(false);
  const [score, setScore] = useState(0);
  const [targets, setTargets] = useState([]);
  const [timeLeft, setTimeLeft] = useState(duration);
  const gameRef = useRef(null);
  const gameTimer = useRef(null);

  useEffect(() => {
    if (isLoading && !gameActive) {
      startGame();
    } else if (!isLoading && gameActive) {
      endGame();
    }
  }, [isLoading]);

  const startGame = () => {
    setGameActive(true);
    setScore(0);
    setTimeLeft(duration);
    
    if (gameType === 'tap') {
      generateTargets();
    }
    
    gameTimer.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          endGame();
          return 0;
        }
        return prev - 100;
      });
    }, 100);
  };

  const endGame = () => {
    setGameActive(false);
    setTargets([]);
    
    if (gameTimer.current) {
      clearInterval(gameTimer.current);
    }
    
    onGameComplete(score);
  };

  const generateTargets = () => {
    const targetCount = 3;
    const newTargets = Array.from({ length: targetCount }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10, // 10-90% position
      y: Math.random() * 80 + 10,
      size: Math.random() * 20 + 30, // 30-50px
      points: Math.floor(Math.random() * 50) + 10,
      duration: Math.random() * 2000 + 1000 // 1-3 seconds
    }));
    
    setTargets(newTargets);
    
    // Generate new targets periodically
    setTimeout(() => {
      if (gameActive) generateTargets();
    }, 1500);
  };

  const handleTargetHit = (target) => {
    setScore(prev => prev + target.points);
    setTargets(prev => prev.filter(t => t.id !== target.id));
    hapticFeedback.success();
  };

  if (!isLoading || !gameActive) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold">Loading Game</h3>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Score: {score}</span>
            <span>Time: {Math.ceil(timeLeft / 1000)}s</span>
          </div>
        </div>

        <div 
          ref={gameRef}
          className="relative bg-gray-100 rounded-lg h-64 overflow-hidden"
        >
          {/* Tap Game */}
          {gameType === 'tap' && targets.map(target => (
            <button
              key={target.id}
              className="absolute bg-red-500 hover:bg-red-600 rounded-full 
                       text-white font-bold text-xs flex items-center justify-center
                       animate-ping cursor-pointer"
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
                width: `${target.size}px`,
                height: `${target.size}px`,
                animationDuration: `${target.duration}ms`
              }}
              onClick={() => handleTargetHit(target)}
            >
              {target.points}
            </button>
          ))}

          {/* Progress Bar */}
          <div className="absolute bottom-2 left-2 right-2 h-2 bg-gray-300 rounded">
            <div
              className="h-full bg-red-500 rounded transition-all duration-100"
              style={{ width: `${((duration - timeLeft) / duration) * 100}%` }}
            />
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-gray-600">
          Tap the targets while loading!
        </div>
      </div>
    </div>
  );
};

// Collector Cards System for Teams/Players
export const CollectorCard = ({ 
  card,
  owned = false,
  onFlip = () => {},
  onTrade = () => {},
  interactive = true 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const cardRef = useRef(null);

  const handleFlip = useCallback(() => {
    if (!interactive || isAnimating) return;
    
    setIsAnimating(true);
    setIsFlipped(prev => !prev);
    hapticFeedback.cardFlip();
    onFlip(card);
    
    setTimeout(() => setIsAnimating(false), 600);
  }, [interactive, isAnimating, card, onFlip]);

  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-blue-400 to-blue-600',
    epic: 'from-purple-400 to-purple-600',
    legendary: 'from-yellow-400 to-orange-500'
  };

  const rarityGlow = {
    common: 'shadow-lg',
    rare: 'shadow-blue-500/50 shadow-xl',
    epic: 'shadow-purple-500/50 shadow-xl',
    legendary: 'shadow-yellow-500/50 shadow-2xl'
  };

  return (
    <div className="perspective-1000">
      <div
        ref={cardRef}
        className={`
          relative w-48 h-64 cursor-pointer transform-style-preserve-3d transition-transform duration-600
          ${isFlipped ? 'rotate-y-180' : ''}
          ${interactive ? 'hover:scale-105' : ''}
        `}
        onClick={handleFlip}
      >
        {/* Card Front */}
        <div className={`
          absolute inset-0 rounded-xl backface-hidden
          bg-gradient-to-br ${rarityColors[card.rarity] || rarityColors.common}
          ${rarityGlow[card.rarity] || rarityGlow.common}
          ${owned ? '' : 'grayscale opacity-50'}
        `}>
          <div className="p-4 h-full flex flex-col">
            {/* Rarity Indicator */}
            <div className="flex justify-between items-start mb-2">
              <div className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-bold uppercase">
                {card.rarity}
              </div>
              <div className="text-white text-xs">#{card.number}</div>
            </div>

            {/* Card Image */}
            <div className="flex-1 flex items-center justify-center mb-3">
              <img
                src={card.image}
                alt={card.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
            </div>

            {/* Card Info */}
            <div className="text-white text-center">
              <h3 className="font-bold text-lg mb-1">{card.name}</h3>
              <p className="text-sm opacity-90">{card.team || card.role}</p>
            </div>
          </div>
        </div>

        {/* Card Back */}
        <div className="absolute inset-0 rounded-xl backface-hidden rotate-y-180 bg-gradient-to-br from-red-600 to-red-800">
          <div className="p-4 h-full flex flex-col text-white">
            <h3 className="font-bold text-lg mb-3 text-center">{card.name}</h3>
            
            {/* Stats */}
            <div className="flex-1 space-y-2">
              {card.stats && Object.entries(card.stats).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{key.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-white bg-opacity-20 rounded-full h-2">
                      <div
                        className="h-full bg-yellow-400 rounded-full"
                        style={{ width: `${Math.min(value, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-6">{value}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            {owned && interactive && (
              <div className="mt-4 space-y-2">
                <button
                  className="w-full bg-white bg-opacity-20 py-2 rounded-lg text-sm font-medium
                           hover:bg-opacity-30 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTrade(card);
                  }}
                >
                  Trade Card
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Battle Pass Progression with Touch Interactions
export const BattlePassTier = ({ 
  tier,
  currentTier = 0,
  unlocked = false,
  onClaimReward = () => {} 
}) => {
  const [isClaiming, setIsClaiming] = useState(false);
  const [showReward, setShowReward] = useState(false);
  
  const isCurrentTier = tier.level === currentTier;
  const isPastTier = tier.level < currentTier;
  const canClaim = unlocked && !tier.claimed && tier.level <= currentTier;

  const handleClaimReward = useCallback(async () => {
    if (!canClaim || isClaiming) return;
    
    setIsClaiming(true);
    hapticFeedback.unlock();
    
    try {
      await onClaimReward(tier);
      setShowReward(true);
      hapticFeedback.achievement();
      
      setTimeout(() => setShowReward(false), 2000);
    } catch (error) {
      console.error('Failed to claim reward:', error);
      hapticFeedback.error();
    } finally {
      setIsClaiming(false);
    }
  }, [canClaim, isClaiming, tier, onClaimReward]);

  return (
    <div className={`
      relative p-4 rounded-lg border-2 transition-all duration-300
      ${isCurrentTier ? 'border-red-500 bg-red-50' : 
        isPastTier ? 'border-green-300 bg-green-50' : 
        'border-gray-200 bg-gray-50'}
      ${canClaim ? 'cursor-pointer hover:shadow-lg' : ''}
    `}>
      {/* Tier Number */}
      <div className={`
        absolute -top-3 -left-3 w-8 h-8 rounded-full flex items-center justify-center
        text-sm font-bold
        ${isCurrentTier ? 'bg-red-500 text-white' :
          isPastTier ? 'bg-green-500 text-white' :
          'bg-gray-300 text-gray-600'}
      `}>
        {tier.level}
      </div>

      {/* Reward Content */}
      <div 
        className="flex items-center space-x-3"
        onClick={canClaim ? handleClaimReward : undefined}
      >
        {/* Reward Icon */}
        <div className={`
          w-16 h-16 rounded-lg flex items-center justify-center
          ${unlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gray-300'}
          ${canClaim && !isClaiming ? 'animate-pulse' : ''}
        `}>
          {tier.reward.type === 'xp' && <Zap size={24} className="text-white" />}
          {tier.reward.type === 'coins' && <Coins size={24} className="text-white" />}
          {tier.reward.type === 'card' && <Star size={24} className="text-white" />}
          {tier.reward.type === 'cosmetic' && <Sparkles size={24} className="text-white" />}
        </div>

        {/* Reward Info */}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{tier.reward.name}</h4>
          <p className="text-sm text-gray-600">{tier.reward.description}</p>
        </div>

        {/* Status */}
        <div className="text-right">
          {tier.claimed ? (
            <div className="text-green-600">
              <CheckCircle size={24} />
              <div className="text-xs mt-1">Claimed</div>
            </div>
          ) : canClaim ? (
            <div className="text-orange-600">
              <Gift size={24} className={isClaiming ? 'animate-spin' : ''} />
              <div className="text-xs mt-1">Claim</div>
            </div>
          ) : !unlocked ? (
            <div className="text-gray-400">
              <Lock size={24} />
              <div className="text-xs mt-1">Locked</div>
            </div>
          ) : (
            <div className="text-blue-600">
              <Trophy size={24} />
              <div className="text-xs mt-1">Available</div>
            </div>
          )}
        </div>
      </div>

      {/* Reward Animation */}
      {showReward && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-lg">
          <div className="text-center animate-bounce">
            <Gift size={48} className="text-yellow-500 mx-auto mb-2" />
            <div className="font-bold text-lg">Reward Claimed!</div>
            <div className="text-sm text-gray-600">+{tier.reward.value}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default {
  XPSystem,
  DailyChallenges,
  LoadingMiniGame,
  CollectorCard,
  BattlePassTier
};