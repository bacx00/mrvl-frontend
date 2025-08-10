import React from 'react';
import { motion } from 'framer-motion';

const AchievementCard = ({ 
    achievement, 
    userAchievement = null, 
    isEarned = false, 
    showProgress = true, 
    size = 'medium',
    onClick = null 
}) => {
    const rarityColors = {
        common: '#6B7280',
        uncommon: '#10B981', 
        rare: '#3B82F6',
        epic: '#8B5CF6',
        legendary: '#F59E0B'
    };

    const categoryIcons = {
        social: '👥',
        activity: '⚡',
        milestone: '🏁',
        streak: '🔥',
        challenge: '🎯',
        special: '⭐'
    };

    const getRarityGlow = () => {
        if (!isEarned) return '';
        return `0 0 20px ${rarityColors[achievement.rarity]}40`;
    };

    const getProgressPercentage = () => {
        if (!userAchievement) return 0;
        return Math.min(100, (userAchievement.current_count / userAchievement.required_count) * 100);
    };

    const sizeClasses = {
        small: 'w-16 h-16 text-xs',
        medium: 'w-24 h-24 text-sm',
        large: 'w-32 h-32 text-base'
    };

    return (
        <motion.div
            className={`achievement-card relative ${sizeClasses[size]} cursor-pointer`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            style={{ boxShadow: getRarityGlow() }}
        >
            {/* Background Circle */}
            <div 
                className={`
                    w-full h-full rounded-full border-4 
                    ${isEarned 
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-opacity-100' 
                        : 'bg-gray-700 border-gray-600 opacity-50'
                    }
                `}
                style={{ 
                    borderColor: isEarned ? rarityColors[achievement.rarity] : '#4B5563'
                }}
            >
                {/* Achievement Icon */}
                <div className="flex items-center justify-center w-full h-full">
                    {achievement.icon ? (
                        <span className="text-2xl">{achievement.icon}</span>
                    ) : (
                        <span className="text-2xl">
                            {categoryIcons[achievement.category] || '🏆'}
                        </span>
                    )}
                </div>

                {/* Progress Bar (for in-progress achievements) */}
                {showProgress && userAchievement && !isEarned && (
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-600 rounded-b-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${getProgressPercentage()}%` }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                        />
                    </div>
                )}

                {/* Completion Badge */}
                {isEarned && (
                    <motion.div
                        className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                    >
                        ✓
                    </motion.div>
                )}

                {/* Secret Achievement Indicator */}
                {achievement.is_secret && !isEarned && (
                    <div className="absolute top-1 right-1 text-purple-400 text-xs">
                        🤫
                    </div>
                )}
            </div>

            {/* Tooltip on Hover */}
            <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap">
                <div className="font-semibold">{achievement.name}</div>
                {userAchievement && !isEarned && (
                    <div className="text-gray-300">
                        {userAchievement.current_count}/{userAchievement.required_count}
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default AchievementCard;