import React, { useState, useEffect } from 'react';
import AchievementCard from './AchievementCard';
import AchievementModal from './AchievementModal';
import { motion, AnimatePresence } from 'framer-motion';

const AchievementGrid = ({ 
    userId = null, 
    category = 'all', 
    showEarnedOnly = false, 
    showAvailableOnly = false,
    limit = null 
}) => {
    const [achievements, setAchievements] = useState([]);
    const [userAchievements, setUserAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [sortBy, setSortBy] = useState('order');
    const [filterRarity, setFilterRarity] = useState('all');

    useEffect(() => {
        loadAchievements();
        if (userId) {
            loadUserAchievements();
        }
    }, [userId, category, sortBy, filterRarity]);

    const loadAchievements = async () => {
        try {
            const params = new URLSearchParams();
            if (category !== 'all') params.append('category', category);
            if (sortBy !== 'order') params.append('sort', sortBy);
            if (filterRarity !== 'all') params.append('rarity', filterRarity);

            const response = await fetch(`/api/achievements?${params.toString()}`);
            const data = await response.json();
            
            if (data.success) {
                setAchievements(data.data.data || data.data);
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    };

    const loadUserAchievements = async () => {
        try {
            const status = showEarnedOnly ? 'completed' : 
                         showAvailableOnly ? 'available' : 'all';
            
            const response = await fetch(`/api/achievements/user/${userId}?status=${status}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setUserAchievements(data.data.data || data.data);
            }
        } catch (error) {
            console.error('Error loading user achievements:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserAchievement = (achievementId) => {
        return userAchievements.find(ua => ua.achievement_id === achievementId);
    };

    const isAchievementEarned = (achievementId) => {
        const userAchievement = getUserAchievement(achievementId);
        return userAchievement && userAchievement.is_completed;
    };

    const getFilteredAchievements = () => {
        let filtered = achievements;

        if (showEarnedOnly) {
            filtered = filtered.filter(achievement => 
                isAchievementEarned(achievement.id)
            );
        } else if (showAvailableOnly) {
            filtered = filtered.filter(achievement => 
                !isAchievementEarned(achievement.id)
            );
        }

        if (limit) {
            filtered = filtered.slice(0, limit);
        }

        return filtered;
    };

    const categories = [
        { key: 'all', label: 'All', icon: '🎯' },
        { key: 'social', label: 'Social', icon: '👥' },
        { key: 'activity', label: 'Activity', icon: '⚡' },
        { key: 'milestone', label: 'Milestones', icon: '🏁' },
        { key: 'streak', label: 'Streaks', icon: '🔥' },
        { key: 'challenge', label: 'Challenges', icon: '🎯' },
        { key: 'special', label: 'Special', icon: '⭐' }
    ];

    const rarities = [
        { key: 'all', label: 'All Rarities' },
        { key: 'common', label: 'Common', color: '#6B7280' },
        { key: 'uncommon', label: 'Uncommon', color: '#10B981' },
        { key: 'rare', label: 'Rare', color: '#3B82F6' },
        { key: 'epic', label: 'Epic', color: '#8B5CF6' },
        { key: 'legendary', label: 'Legendary', color: '#F59E0B' }
    ];

    const sortOptions = [
        { key: 'order', label: 'Default Order' },
        { key: 'rarity', label: 'By Rarity' },
        { key: 'points', label: 'By Points' },
        { key: 'name', label: 'Alphabetical' }
    ];

    if (loading) {
        return (
            <div className="achievement-grid-loading">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {Array.from({ length: 16 }).map((_, index) => (
                        <div 
                            key={index} 
                            className="w-24 h-24 bg-gray-700 rounded-full animate-pulse"
                        />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="achievement-grid">
            {/* Filters */}
            {!limit && (
                <div className="achievement-filters mb-6 space-y-4">
                    {/* Category Filter */}
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat.key}
                                onClick={() => window.dispatchEvent(new CustomEvent('categoryChange', { detail: cat.key }))}
                                className={`
                                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                                    ${category === cat.key 
                                        ? 'bg-blue-600 text-white' 
                                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }
                                `}
                            >
                                <span className="mr-2">{cat.icon}</span>
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Sort and Rarity Filters */}
                    <div className="flex flex-wrap gap-4">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2"
                        >
                            {sortOptions.map(option => (
                                <option key={option.key} value={option.key}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filterRarity}
                            onChange={(e) => setFilterRarity(e.target.value)}
                            className="bg-gray-700 text-white border border-gray-600 rounded-lg px-3 py-2"
                        >
                            {rarities.map(rarity => (
                                <option key={rarity.key} value={rarity.key}>
                                    {rarity.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Achievement Grid */}
            <motion.div 
                className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4"
                layout
            >
                <AnimatePresence>
                    {getFilteredAchievements().map((achievement, index) => {
                        const userAchievement = getUserAchievement(achievement.id);
                        const isEarned = isAchievementEarned(achievement.id);

                        return (
                            <motion.div
                                key={achievement.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ 
                                    duration: 0.3, 
                                    delay: index * 0.05,
                                    layout: { duration: 0.3 }
                                }}
                                className="group"
                            >
                                <AchievementCard
                                    achievement={achievement}
                                    userAchievement={userAchievement}
                                    isEarned={isEarned}
                                    onClick={() => setSelectedAchievement(achievement)}
                                />
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Empty State */}
            {getFilteredAchievements().length === 0 && (
                <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        No achievements found
                    </h3>
                    <p className="text-gray-500">
                        {showEarnedOnly 
                            ? "You haven't earned any achievements in this category yet."
                            : showAvailableOnly 
                            ? "No available achievements in this category."
                            : "No achievements match your current filters."
                        }
                    </p>
                </div>
            )}

            {/* Achievement Detail Modal */}
            <AchievementModal
                achievement={selectedAchievement}
                userAchievement={selectedAchievement ? getUserAchievement(selectedAchievement.id) : null}
                isOpen={!!selectedAchievement}
                onClose={() => setSelectedAchievement(null)}
            />
        </div>
    );
};

export default AchievementGrid;