import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const AchievementSummary = ({ userId, showDetailed = false }) => {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userId) {
            loadSummary();
        }
    }, [userId]);

    const loadSummary = async () => {
        try {
            const response = await fetch(`/api/achievements/summary/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setSummary(data.data);
            }
        } catch (error) {
            console.error('Error loading achievement summary:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="achievement-summary bg-gray-800 rounded-lg p-6 animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="text-center">
                            <div className="bg-gray-700 h-8 w-16 mx-auto rounded mb-2"></div>
                            <div className="bg-gray-700 h-4 w-24 mx-auto rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!summary) {
        return null;
    }

    const StatCard = ({ icon, value, label, color = "text-blue-400" }) => (
        <motion.div 
            className="text-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
        >
            <div className={`text-2xl font-bold ${color} mb-1`}>
                <span className="mr-2">{icon}</span>
                {value}
            </div>
            <div className="text-gray-400 text-sm">{label}</div>
        </motion.div>
    );

    return (
        <div className="achievement-summary bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="mr-2">🏆</span>
                Achievement Progress
            </h3>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                    icon="✅"
                    value={summary.completed_achievements || 0}
                    label="Completed"
                    color="text-green-400"
                />
                <StatCard
                    icon="⏳"
                    value={summary.in_progress_achievements || 0}
                    label="In Progress"
                    color="text-yellow-400"
                />
                <StatCard
                    icon="🎯"
                    value={summary.total_points || 0}
                    label="Total Points"
                    color="text-purple-400"
                />
                <StatCard
                    icon="🔥"
                    value={summary.active_streaks?.length || 0}
                    label="Active Streaks"
                    color="text-orange-400"
                />
            </div>

            {showDetailed && (
                <>
                    {/* Recent Achievements */}
                    {summary.recent_achievements && summary.recent_achievements.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-md font-semibold text-white mb-3">
                                Recent Achievements
                            </h4>
                            <div className="space-y-2">
                                {summary.recent_achievements.slice(0, 3).map((recentAchievement, index) => (
                                    <motion.div
                                        key={index}
                                        className="flex items-center bg-gray-700 rounded-lg p-3"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                                            🏆
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-white font-medium">
                                                {recentAchievement.achievement.name}
                                            </div>
                                            <div className="text-gray-400 text-sm">
                                                {new Date(recentAchievement.completed_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="text-yellow-400 font-semibold">
                                            +{recentAchievement.achievement.points}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Streaks */}
                    {summary.active_streaks && summary.active_streaks.length > 0 && (
                        <div className="mb-6">
                            <h4 className="text-md font-semibold text-white mb-3">
                                Active Streaks
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {summary.active_streaks.map((streak, index) => (
                                    <motion.div
                                        key={index}
                                        className="bg-gray-700 rounded-lg p-3"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <span className="text-lg mr-2">🔥</span>
                                                <div>
                                                    <div className="text-white font-medium text-sm">
                                                        {streak.name}
                                                    </div>
                                                    <div className="text-gray-400 text-xs">
                                                        {streak.description}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-orange-400 font-bold">
                                                    {streak.current_count}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    Best: {streak.best_count}
                                                </div>
                                            </div>
                                        </div>
                                        {streak.is_at_risk && (
                                            <div className="mt-2 text-red-400 text-xs flex items-center">
                                                ⚠️ At risk of breaking
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Active Challenges */}
                    {summary.active_challenges && summary.active_challenges.length > 0 && (
                        <div>
                            <h4 className="text-md font-semibold text-white mb-3">
                                Active Challenges
                            </h4>
                            <div className="space-y-3">
                                {summary.active_challenges.map((challengeData, index) => (
                                    <motion.div
                                        key={index}
                                        className="bg-gray-700 rounded-lg p-3"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <span className="text-lg mr-2">🎯</span>
                                                <div>
                                                    <div className="text-white font-medium">
                                                        {challengeData.challenge.name}
                                                    </div>
                                                    <div className="text-gray-400 text-sm">
                                                        Rank #{challengeData.rank}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-blue-400 font-bold">
                                                    {Math.round(challengeData.completion_percentage)}%
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-600 rounded-full h-2 overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${challengeData.completion_percentage}%` }}
                                                transition={{ duration: 1, delay: index * 0.2 }}
                                            />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AchievementSummary;