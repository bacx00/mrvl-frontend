import React from 'react';
import { motion } from 'framer-motion';

const ChallengeCard = ({ challenge, userChallenge = null, onJoin = null, onClick = null }) => {
    const difficultyColors = {
        easy: '#10B981',
        medium: '#F59E0B',
        hard: '#EF4444',
        extreme: '#7C2D12'
    };

    const getDifficultyIcon = () => {
        switch (challenge.difficulty) {
            case 'easy': return '🟢';
            case 'medium': return '🟡';
            case 'hard': return '🔴';
            case 'extreme': return '🟠';
            default: return '⚪';
        }
    };

    const getTimeRemaining = () => {
        if (!challenge.time_remaining) return null;
        
        const now = new Date();
        const endTime = new Date(challenge.ends_at);
        const diffMs = endTime - now;
        
        if (diffMs <= 0) return 'Ended';
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h left`;
        
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${minutes}m left`;
    };

    const getStatusInfo = () => {
        if (challenge.has_ended) {
            return { text: 'Ended', color: 'text-gray-400', bg: 'bg-gray-600' };
        } else if (challenge.is_upcoming) {
            return { text: 'Coming Soon', color: 'text-blue-400', bg: 'bg-blue-600' };
        } else if (challenge.is_active) {
            return { text: 'Active', color: 'text-green-400', bg: 'bg-green-600' };
        }
        return { text: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-600' };
    };

    const isParticipating = userChallenge !== null;
    const isCompleted = userChallenge && userChallenge.is_completed;
    const progressPercentage = userChallenge 
        ? userChallenge.completion_percentage || 0 
        : 0;
    
    const statusInfo = getStatusInfo();
    const timeRemaining = getTimeRemaining();

    return (
        <motion.div
            className="challenge-card bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                    <span className="text-2xl mr-3">
                        {challenge.icon || '🎯'}
                    </span>
                    <div>
                        <h3 className="text-white font-semibold text-lg">
                            {challenge.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            {/* Difficulty */}
                            <span
                                className="px-2 py-1 rounded-full text-xs font-semibold text-white"
                                style={{ backgroundColor: difficultyColors[challenge.difficulty] }}
                            >
                                {getDifficultyIcon()} {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                            </span>
                            
                            {/* Status */}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${statusInfo.bg}`}>
                                {statusInfo.text}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Completion Badge */}
                {isCompleted && (
                    <motion.div
                        className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                    >
                        ✓
                    </motion.div>
                )}
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                {challenge.description}
            </p>

            {/* Progress (if participating) */}
            {isParticipating && (
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-400 text-sm">Progress</span>
                        <span className="text-white text-sm font-semibold">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                    <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.8 }}
                        />
                    </div>
                    {userChallenge && userChallenge.rank && (
                        <div className="text-center mt-2 text-yellow-400 text-sm">
                            Rank #{userChallenge.rank}
                        </div>
                    )}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                    <div className="text-white font-semibold">
                        {challenge.participant_count || 0}
                    </div>
                    <div className="text-gray-400 text-xs">Participants</div>
                </div>
                <div>
                    <div className="text-white font-semibold">
                        {challenge.completion_count || 0}
                    </div>
                    <div className="text-gray-400 text-xs">Completed</div>
                </div>
                <div>
                    <div className="text-white font-semibold">
                        {Math.round(challenge.completion_percentage || 0)}%
                    </div>
                    <div className="text-gray-400 text-xs">Success Rate</div>
                </div>
            </div>

            {/* Time Remaining */}
            {timeRemaining && timeRemaining !== 'Ended' && (
                <div className="text-center mb-4">
                    <div className="text-orange-400 text-sm font-medium">
                        ⏰ {timeRemaining}
                    </div>
                </div>
            )}

            {/* Rewards Preview */}
            {challenge.rewards && (
                <div className="mb-4">
                    <div className="text-gray-400 text-sm mb-2">Rewards:</div>
                    <div className="flex flex-wrap gap-2">
                        {challenge.rewards.points && (
                            <span className="bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded text-xs">
                                🎯 {challenge.rewards.points} pts
                            </span>
                        )}
                        {challenge.rewards.title && (
                            <span className="bg-purple-600/20 text-purple-400 px-2 py-1 rounded text-xs">
                                👑 {challenge.rewards.title}
                            </span>
                        )}
                        {challenge.rewards.badge && (
                            <span className="bg-blue-600/20 text-blue-400 px-2 py-1 rounded text-xs">
                                🏆 Special Badge
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Action Button */}
            {challenge.is_active && (
                <div className="flex gap-2">
                    {!isParticipating && challenge.can_join && (
                        <motion.button
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                onJoin && onJoin(challenge);
                            }}
                        >
                            Join Challenge
                        </motion.button>
                    )}
                    
                    {isParticipating && (
                        <motion.button
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                // Navigate to challenge details
                            }}
                        >
                            {isCompleted ? 'View Results' : 'Continue'}
                        </motion.button>
                    )}
                    
                    <motion.button
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            // View leaderboard
                        }}
                    >
                        📊
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
};

export default ChallengeCard;