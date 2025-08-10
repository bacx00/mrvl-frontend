import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AchievementModal = ({ achievement, userAchievement, isOpen, onClose }) => {
    if (!achievement) return null;

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

    const isEarned = userAchievement && userAchievement.is_completed;
    const progressPercentage = userAchievement 
        ? Math.min(100, (userAchievement.current_count / userAchievement.required_count) * 100)
        : 0;

    const getRarityLabel = () => {
        return achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1);
    };

    const formatDate = (date) => {
        if (!date) return null;
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black bg-opacity-75"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="relative bg-gray-800 rounded-xl max-w-md w-full mx-4 p-6 border-2"
                        style={{ borderColor: rarityColors[achievement.rarity] }}
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Achievement Icon */}
                        <div className="text-center mb-6">
                            <motion.div
                                className={`
                                    inline-flex items-center justify-center w-24 h-24 rounded-full border-4 mb-4
                                    ${isEarned 
                                        ? 'bg-gradient-to-br from-gray-800 to-gray-900' 
                                        : 'bg-gray-700 opacity-50'
                                    }
                                `}
                                style={{ 
                                    borderColor: rarityColors[achievement.rarity],
                                    boxShadow: isEarned ? `0 0 30px ${rarityColors[achievement.rarity]}40` : 'none'
                                }}
                                animate={isEarned ? { 
                                    boxShadow: [
                                        `0 0 30px ${rarityColors[achievement.rarity]}40`,
                                        `0 0 40px ${rarityColors[achievement.rarity]}60`,
                                        `0 0 30px ${rarityColors[achievement.rarity]}40`
                                    ]
                                } : {}}
                                transition={isEarned ? { 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    ease: "easeInOut" 
                                } : {}}
                            >
                                <span className="text-4xl">
                                    {achievement.icon || categoryIcons[achievement.category] || '🏆'}
                                </span>
                                
                                {/* Completion Badge */}
                                {isEarned && (
                                    <motion.div
                                        className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: "spring", stiffness: 500, delay: 0.3 }}
                                    >
                                        ✓
                                    </motion.div>
                                )}
                            </motion.div>

                            {/* Rarity Badge */}
                            <div
                                className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: rarityColors[achievement.rarity] }}
                            >
                                {getRarityLabel()}
                            </div>
                        </div>

                        {/* Achievement Details */}
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">
                                {achievement.name}
                            </h2>
                            <p className="text-gray-300 mb-4">
                                {achievement.description}
                            </p>

                            {/* Points */}
                            <div className="flex items-center justify-center text-yellow-400 text-lg font-semibold">
                                <span className="mr-2">🎯</span>
                                {achievement.points} points
                            </div>
                        </div>

                        {/* Progress Section */}
                        {userAchievement && (
                            <div className="mb-6">
                                {isEarned ? (
                                    <div className="text-center">
                                        <div className="text-green-400 font-semibold mb-2">
                                            🎉 Achievement Unlocked!
                                        </div>
                                        {userAchievement.completed_at && (
                                            <div className="text-gray-400 text-sm">
                                                Earned on {formatDate(userAchievement.completed_at)}
                                            </div>
                                        )}
                                        {userAchievement.completion_count > 1 && (
                                            <div className="text-blue-400 text-sm mt-1">
                                                Completed {userAchievement.completion_count} times
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-300 text-sm">Progress</span>
                                            <span className="text-gray-300 text-sm">
                                                {userAchievement.current_count || 0} / {userAchievement.required_count || 1}
                                            </span>
                                        </div>
                                        <div className="bg-gray-700 rounded-full h-3 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercentage}%` }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>
                                        <div className="text-center text-gray-400 text-sm mt-2">
                                            {Math.round(progressPercentage)}% complete
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Achievement Stats */}
                        <div className="border-t border-gray-700 pt-4">
                            <div className="grid grid-cols-2 gap-4 text-center text-sm">
                                <div>
                                    <div className="text-gray-400">Category</div>
                                    <div className="text-white font-semibold flex items-center justify-center">
                                        <span className="mr-1">
                                            {categoryIcons[achievement.category]}
                                        </span>
                                        {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400">Completion Rate</div>
                                    <div className="text-white font-semibold">
                                        {achievement.completion_percentage || 0}%
                                    </div>
                                </div>
                            </div>

                            {achievement.is_secret && !isEarned && (
                                <div className="text-center mt-4 text-purple-400 text-sm">
                                    🤫 This is a secret achievement
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default AchievementModal;