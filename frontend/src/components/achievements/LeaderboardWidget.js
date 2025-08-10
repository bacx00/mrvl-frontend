import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const LeaderboardWidget = ({ type = 'points', period = 'all_time', limit = 10 }) => {
    const [leaderboard, setLeaderboard] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userPosition, setUserPosition] = useState(null);

    useEffect(() => {
        loadLeaderboard();
    }, [type, period]);

    const loadLeaderboard = async () => {
        try {
            // First get the leaderboard info
            const leaderboardsResponse = await fetch('/api/leaderboards');
            const leaderboardsData = await leaderboardsResponse.json();
            
            if (leaderboardsData.success) {
                const targetLeaderboard = leaderboardsData.data.find(lb => 
                    lb.type === type && lb.period === period
                );
                
                if (targetLeaderboard) {
                    setLeaderboard(targetLeaderboard);
                    
                    // Then get the entries
                    const entriesResponse = await fetch(`/api/leaderboards/${targetLeaderboard.id}?limit=${limit}`);
                    const entriesData = await entriesResponse.json();
                    
                    if (entriesData.success) {
                        setEntries(entriesData.data.entries || []);
                        setUserPosition(entriesData.data.user_position);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const formatScore = (score) => {
        if (score >= 1000000) {
            return `${(score / 1000000).toFixed(1)}M`;
        } else if (score >= 1000) {
            return `${(score / 1000).toFixed(1)}K`;
        } else {
            return Math.round(score).toString();
        }
    };

    const getTypeIcon = () => {
        switch (type) {
            case 'points': return '🎯';
            case 'achievements': return '🏆';
            case 'streak': return '🔥';
            case 'activity': return '⚡';
            default: return '📊';
        }
    };

    const getTypeLabel = () => {
        switch (type) {
            case 'points': return 'Points';
            case 'achievements': return 'Achievements';
            case 'streak': return 'Streak';
            case 'activity': return 'Activity';
            default: return 'Leaderboard';
        }
    };

    const getPeriodLabel = () => {
        switch (period) {
            case 'daily': return 'Today';
            case 'weekly': return 'This Week';
            case 'monthly': return 'This Month';
            case 'all_time': return 'All Time';
            default: return period;
        }
    };

    if (loading) {
        return (
            <div className="leaderboard-widget bg-gray-800 rounded-lg p-4">
                <div className="animate-pulse">
                    <div className="bg-gray-700 h-6 w-32 rounded mb-4"></div>
                    <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-gray-700 w-8 h-8 rounded-full mr-3"></div>
                                    <div className="bg-gray-700 h-4 w-24 rounded"></div>
                                </div>
                                <div className="bg-gray-700 h-4 w-12 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!leaderboard || entries.length === 0) {
        return (
            <div className="leaderboard-widget bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">📊</div>
                <div className="text-gray-400">No leaderboard data available</div>
            </div>
        );
    }

    return (
        <div className="leaderboard-widget bg-gray-800 rounded-lg p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                    <span className="text-xl mr-2">{getTypeIcon()}</span>
                    <div>
                        <h3 className="text-white font-semibold">
                            {getTypeLabel()} Leaderboard
                        </h3>
                        <p className="text-gray-400 text-sm">{getPeriodLabel()}</p>
                    </div>
                </div>
            </div>

            {/* Entries */}
            <div className="space-y-2 mb-4">
                {entries.map((entry, index) => (
                    <motion.div
                        key={entry.user.id}
                        className={`
                            flex items-center justify-between p-2 rounded-lg
                            ${entry.rank <= 3 
                                ? 'bg-gradient-to-r from-yellow-500/10 to-transparent' 
                                : 'bg-gray-700/50'
                            }
                        `}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <div className="flex items-center">
                            {/* Rank */}
                            <div className="w-8 text-center mr-3">
                                {typeof getRankIcon(entry.rank) === 'string' && getRankIcon(entry.rank).includes('#') ? (
                                    <span className="text-gray-400 text-sm font-semibold">
                                        {getRankIcon(entry.rank)}
                                    </span>
                                ) : (
                                    <span className="text-lg">{getRankIcon(entry.rank)}</span>
                                )}
                            </div>

                            {/* User */}
                            <div className="flex items-center">
                                {entry.user.avatar ? (
                                    <img 
                                        src={entry.user.avatar} 
                                        alt={entry.user.name}
                                        className="w-6 h-6 rounded-full mr-2"
                                    />
                                ) : (
                                    <div className="w-6 h-6 bg-gray-600 rounded-full mr-2 flex items-center justify-center">
                                        <span className="text-xs text-gray-300">
                                            {entry.user.name.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <span className="text-white font-medium text-sm">
                                    {entry.user.name}
                                </span>
                            </div>
                        </div>

                        {/* Score */}
                        <div className="text-right">
                            <div className="text-white font-semibold">
                                {formatScore(entry.score)}
                            </div>
                            {entry.rank_change && (
                                <div className={`text-xs ${
                                    entry.rank_change > 0 ? 'text-green-400' : 
                                    entry.rank_change < 0 ? 'text-red-400' : 'text-gray-400'
                                }`}>
                                    {entry.rank_change > 0 && '↗'}
                                    {entry.rank_change < 0 && '↘'}
                                    {entry.rank_change === 0 && '→'}
                                </div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* User Position (if not in top entries) */}
            {userPosition && !entries.find(e => e.user.id === userPosition.user.id) && (
                <div className="border-t border-gray-700 pt-3">
                    <div className="text-gray-400 text-xs mb-2">Your Position:</div>
                    <div className="flex items-center justify-between p-2 bg-blue-600/20 rounded-lg">
                        <div className="flex items-center">
                            <div className="w-8 text-center mr-3">
                                <span className="text-blue-400 text-sm font-semibold">
                                    #{userPosition.rank}
                                </span>
                            </div>
                            <span className="text-blue-400 font-medium text-sm">
                                You
                            </span>
                        </div>
                        <div className="text-blue-400 font-semibold">
                            {formatScore(userPosition.score)}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="text-center mt-4">
                <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors">
                    View Full Leaderboard →
                </button>
            </div>
        </div>
    );
};

export default LeaderboardWidget;