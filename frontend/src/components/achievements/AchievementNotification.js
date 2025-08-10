import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const AchievementNotification = ({ 
    notification, 
    onClose, 
    duration = 5000,
    position = 'top-right' 
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose && onClose(notification);
        }, 300);
    };

    const getNotificationIcon = () => {
        switch (notification.type) {
            case 'achievement_earned': return '🏆';
            case 'streak_milestone': return '🔥';
            case 'challenge_completed': return '🎯';
            case 'leaderboard_rank': return '📊';
            default: return '🎉';
        }
    };

    const getNotificationColor = () => {
        switch (notification.type) {
            case 'achievement_earned': return '#F59E0B';
            case 'streak_milestone': return '#EF4444';
            case 'challenge_completed': return '#8B5CF6';
            case 'leaderboard_rank': return '#3B82F6';
            default: return '#10B981';
        }
    };

    const positionClasses = {
        'top-right': 'top-4 right-4',
        'top-left': 'top-4 left-4',
        'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };

    if (!isVisible) return null;

    return (
        <motion.div
            className={`fixed z-50 ${positionClasses[position]}`}
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div 
                className="bg-gray-800 border-l-4 rounded-lg shadow-2xl max-w-sm p-4 cursor-pointer"
                style={{ borderColor: getNotificationColor() }}
                onClick={handleClose}
            >
                {/* Header */}
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                        <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
                            style={{ backgroundColor: `${getNotificationColor()}20` }}
                        >
                            <span className="text-lg">
                                {getNotificationIcon()}
                            </span>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold text-sm">
                                {notification.title}
                            </h4>
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleClose();
                        }}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Message */}
                <p className="text-gray-300 text-sm mb-3">
                    {notification.message}
                </p>

                {/* Additional Data */}
                {notification.data && (
                    <div className="space-y-2">
                        {notification.type === 'achievement_earned' && notification.data.points && (
                            <div className="flex items-center text-yellow-400 text-sm">
                                <span className="mr-2">🎯</span>
                                +{notification.data.points} points earned
                            </div>
                        )}
                        
                        {notification.type === 'streak_milestone' && notification.data.milestone && (
                            <div className="flex items-center text-orange-400 text-sm">
                                <span className="mr-2">🔥</span>
                                {notification.data.milestone} day streak achieved!
                            </div>
                        )}
                        
                        {notification.type === 'challenge_completed' && notification.data.rank && (
                            <div className="flex items-center text-purple-400 text-sm">
                                <span className="mr-2">📊</span>
                                Finished in position #{notification.data.rank}
                            </div>
                        )}
                        
                        {notification.type === 'leaderboard_rank' && notification.data.rank && (
                            <div className="flex items-center text-blue-400 text-sm">
                                <span className="mr-2">🏅</span>
                                Ranked #{notification.data.rank} on {notification.data.leaderboard_name}
                            </div>
                        )}
                    </div>
                )}

                {/* Progress bar for auto-close */}
                {duration > 0 && (
                    <div className="mt-3 bg-gray-700 rounded-full h-1 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: getNotificationColor() }}
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: duration / 1000, ease: "linear" }}
                        />
                    </div>
                )}
            </div>
        </motion.div>
    );
};

// Achievement Notification Manager
const AchievementNotificationManager = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Listen for real-time achievement notifications
        const handleAchievementEarned = (event) => {
            const notification = {
                id: Date.now(),
                type: 'achievement_earned',
                title: 'Achievement Unlocked!',
                message: `You've earned the '${event.achievement.name}' achievement!`,
                data: {
                    achievement_id: event.achievement.id,
                    achievement_name: event.achievement.name,
                    points: event.achievement.points,
                    rarity: event.achievement.rarity
                },
                created_at: new Date().toISOString()
            };
            
            addNotification(notification);
        };

        const handleStreakMilestone = (event) => {
            const notification = {
                id: Date.now(),
                type: 'streak_milestone',
                title: 'Streak Milestone!',
                message: event.message,
                data: {
                    streak_type: event.streak.type,
                    milestone: event.streak.milestone,
                    current_count: event.streak.current_count
                },
                created_at: new Date().toISOString()
            };
            
            addNotification(notification);
        };

        const handleChallengeCompleted = (event) => {
            const notification = {
                id: Date.now(),
                type: 'challenge_completed',
                title: 'Challenge Complete!',
                message: event.message,
                data: {
                    challenge_id: event.challenge.id,
                    challenge_name: event.challenge.name,
                    rank: event.user_challenge.rank,
                    rewards: event.challenge.rewards
                },
                created_at: new Date().toISOString()
            };
            
            addNotification(notification);
        };

        // Set up event listeners (would be connected to WebSocket/EventSource)
        window.addEventListener('achievement.earned', handleAchievementEarned);
        window.addEventListener('streak.milestone', handleStreakMilestone);
        window.addEventListener('challenge.completed', handleChallengeCompleted);

        return () => {
            window.removeEventListener('achievement.earned', handleAchievementEarned);
            window.removeEventListener('streak.milestone', handleStreakMilestone);
            window.removeEventListener('challenge.completed', handleChallengeCompleted);
        };
    }, []);

    const addNotification = (notification) => {
        setNotifications(prev => [...prev, notification]);
    };

    const removeNotification = (notificationToRemove) => {
        setNotifications(prev => 
            prev.filter(n => n.id !== notificationToRemove.id)
        );
    };

    return (
        <div className="achievement-notifications">
            <AnimatePresence>
                {notifications.map((notification, index) => (
                    <motion.div
                        key={notification.id}
                        style={{ zIndex: 1000 + index }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <AchievementNotification
                            notification={notification}
                            onClose={removeNotification}
                            position="top-right"
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export { AchievementNotification, AchievementNotificationManager };
export default AchievementNotification;