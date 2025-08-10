import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AchievementGrid from '../achievements/AchievementGrid';
import AchievementSummary from '../achievements/AchievementSummary';
import LeaderboardWidget from '../achievements/LeaderboardWidget';
import ChallengeCard from '../achievements/ChallengeCard';
import { AchievementNotificationManager } from '../achievements/AchievementNotification';

const AchievementsPage = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [activeTab, setActiveTab] = useState('achievements');
    const [activeCategory, setActiveCategory] = useState('all');
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCurrentUser();
        loadChallenges();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await fetch('/api/user', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (data.success) {
                setCurrentUser(data.data);
            }
        } catch (error) {
            console.error('Error loading current user:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadChallenges = async () => {
        try {
            const response = await fetch('/api/challenges?status=active&limit=6');
            const data = await response.json();
            
            if (data.success) {
                setChallenges(data.data.data || data.data);
            }
        } catch (error) {
            console.error('Error loading challenges:', error);
        }
    };

    const handleJoinChallenge = async (challenge) => {
        if (!currentUser) {
            // Show login prompt
            alert('Please log in to join challenges');
            return;
        }

        try {
            const response = await fetch(`/api/challenges/${challenge.id}/join`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            
            if (data.success) {
                // Reload challenges to update participation status
                loadChallenges();
                
                // Show success notification
                window.dispatchEvent(new CustomEvent('challenge.joined', {
                    detail: { challenge }
                }));
            } else {
                alert(data.error || 'Failed to join challenge');
            }
        } catch (error) {
            console.error('Error joining challenge:', error);
            alert('Failed to join challenge');
        }
    };

    const tabs = [
        { key: 'achievements', label: 'Achievements', icon: '🏆' },
        { key: 'leaderboards', label: 'Leaderboards', icon: '📊' },
        { key: 'challenges', label: 'Challenges', icon: '🎯' },
        { key: 'profile', label: 'My Progress', icon: '👤' }
    ];

    if (loading) {
        return (
            <div className="achievements-page min-h-screen bg-gray-900 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="bg-gray-800 h-8 w-64 rounded mb-8"></div>
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                            <div className="lg:col-span-3">
                                <div className="bg-gray-800 h-96 rounded-lg"></div>
                            </div>
                            <div className="bg-gray-800 h-96 rounded-lg"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="achievements-page min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-800 via-blue-800 to-indigo-800 py-12">
                <div className="container mx-auto px-4">
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="mr-4">🏆</span>
                            Achievement Center
                        </h1>
                        <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                            Track your progress, compete with others, and unlock exclusive rewards
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Navigation Tabs */}
                <div className="flex flex-wrap justify-center mb-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`
                                flex items-center px-6 py-3 mx-2 mb-2 rounded-lg font-semibold transition-all
                                ${activeTab === tab.key
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                                }
                            `}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Achievements Tab */}
                        {activeTab === 'achievements' && (
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                                <div className="lg:col-span-3">
                                    <AchievementGrid
                                        userId={currentUser?.id}
                                        category={activeCategory}
                                    />
                                </div>
                                <div className="space-y-6">
                                    <LeaderboardWidget 
                                        type="points" 
                                        period="all_time" 
                                        limit={5} 
                                    />
                                    <LeaderboardWidget 
                                        type="achievements" 
                                        period="monthly" 
                                        limit={5} 
                                    />
                                </div>
                            </div>
                        )}

                        {/* Leaderboards Tab */}
                        {activeTab === 'leaderboards' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                <LeaderboardWidget 
                                    type="points" 
                                    period="all_time" 
                                    limit={10} 
                                />
                                <LeaderboardWidget 
                                    type="achievements" 
                                    period="all_time" 
                                    limit={10} 
                                />
                                <LeaderboardWidget 
                                    type="streak" 
                                    period="all_time" 
                                    limit={10} 
                                />
                                <LeaderboardWidget 
                                    type="points" 
                                    period="weekly" 
                                    limit={10} 
                                />
                                <LeaderboardWidget 
                                    type="activity" 
                                    period="monthly" 
                                    limit={10} 
                                />
                                <LeaderboardWidget 
                                    type="achievements" 
                                    period="weekly" 
                                    limit={10} 
                                />
                            </div>
                        )}

                        {/* Challenges Tab */}
                        {activeTab === 'challenges' && (
                            <div>
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-bold mb-2">Active Challenges</h2>
                                    <p className="text-gray-400">
                                        Join community challenges and compete for exclusive rewards
                                    </p>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {challenges.map((challenge) => (
                                        <ChallengeCard
                                            key={challenge.id}
                                            challenge={challenge}
                                            onJoin={handleJoinChallenge}
                                        />
                                    ))}
                                </div>

                                {challenges.length === 0 && (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">🎯</div>
                                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                            No Active Challenges
                                        </h3>
                                        <p className="text-gray-500">
                                            Check back soon for new challenges to join!
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div>
                                {currentUser ? (
                                    <div className="space-y-8">
                                        <AchievementSummary 
                                            userId={currentUser.id} 
                                            showDetailed={true} 
                                        />
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            <div>
                                                <h3 className="text-xl font-semibold mb-4 flex items-center">
                                                    <span className="mr-2">🏆</span>
                                                    My Achievements
                                                </h3>
                                                <AchievementGrid
                                                    userId={currentUser.id}
                                                    showEarnedOnly={true}
                                                    limit={20}
                                                />
                                            </div>
                                            
                                            <div>
                                                <h3 className="text-xl font-semibold mb-4 flex items-center">
                                                    <span className="mr-2">🎯</span>
                                                    In Progress
                                                </h3>
                                                <AchievementGrid
                                                    userId={currentUser.id}
                                                    showAvailableOnly={true}
                                                    limit={20}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="text-6xl mb-4">🔒</div>
                                        <h3 className="text-xl font-semibold text-gray-300 mb-2">
                                            Login Required
                                        </h3>
                                        <p className="text-gray-500 mb-6">
                                            Sign in to track your achievements and progress
                                        </p>
                                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                                            Sign In
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Achievement Notifications */}
            <AchievementNotificationManager />
        </div>
    );
};

export default AchievementsPage;