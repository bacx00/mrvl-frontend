// Achievement Service - Frontend API client for achievement system

class AchievementService {
    constructor() {
        this.baseUrl = '/api';
        this.token = null;
    }

    setAuthToken(token) {
        this.token = token;
    }

    getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            headers: this.getAuthHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || 'Request failed');
            }
            
            return data;
        } catch (error) {
            console.error(`API request failed: ${endpoint}`, error);
            throw error;
        }
    }

    // Achievement methods
    async getAchievements(params = {}) {
        const searchParams = new URLSearchParams(params);
        return this.request(`/achievements?${searchParams.toString()}`);
    }

    async getAchievement(id) {
        return this.request(`/achievements/${id}`);
    }

    async getUserAchievements(userId = null, status = 'all') {
        const endpoint = userId 
            ? `/achievements/user/${userId}?status=${status}`
            : `/achievements/user?status=${status}`;
        return this.request(endpoint);
    }

    async getUserAchievementSummary(userId = null) {
        const endpoint = userId 
            ? `/achievements/summary/${userId}`
            : `/achievements/summary`;
        return this.request(endpoint);
    }

    async trackActivity(activityType, metadata = {}) {
        return this.request('/achievements/track', {
            method: 'POST',
            body: JSON.stringify({
                activity_type: activityType,
                metadata
            })
        });
    }

    async getAchievementCategories() {
        return this.request('/achievements/categories');
    }

    async getAchievementRarities() {
        return this.request('/achievements/rarities');
    }

    async getGlobalAchievementStats() {
        return this.request('/achievements/stats/global');
    }

    // Challenge methods
    async getChallenges(params = {}) {
        const searchParams = new URLSearchParams(params);
        return this.request(`/challenges?${searchParams.toString()}`);
    }

    async getChallenge(id) {
        return this.request(`/challenges/${id}`);
    }

    async joinChallenge(challengeId) {
        return this.request(`/challenges/${challengeId}/join`, {
            method: 'POST'
        });
    }

    async getChallengeProgress(challengeId, userId = null) {
        const endpoint = userId 
            ? `/challenges/${challengeId}/progress/${userId}`
            : `/challenges/${challengeId}/progress`;
        return this.request(endpoint);
    }

    async getUserChallenges(userId = null, status = 'all') {
        const endpoint = userId 
            ? `/challenges/user/${userId}?status=${status}`
            : `/challenges/user?status=${status}`;
        return this.request(endpoint);
    }

    async getChallengeLeaderboard(challengeId, limit = 50) {
        return this.request(`/challenges/${challengeId}/leaderboard?limit=${limit}`);
    }

    async getChallengeDifficulties() {
        return this.request('/challenges/difficulties');
    }

    // Leaderboard methods
    async getLeaderboards() {
        return this.request('/leaderboards');
    }

    async getLeaderboard(id, limit = 50) {
        return this.request(`/leaderboards/${id}?limit=${limit}`);
    }

    async getUserLeaderboardPositions(userId = null) {
        const endpoint = userId 
            ? `/leaderboards/user/${userId}`
            : `/leaderboards/user`;
        return this.request(endpoint);
    }

    async getUserLeaderboardHistory(leaderboardId, userId = null, days = 30) {
        const endpoint = userId 
            ? `/leaderboards/${leaderboardId}/user/${userId}?days=${days}`
            : `/leaderboards/${leaderboardId}/user?days=${days}`;
        return this.request(endpoint);
    }

    async getNearbyRankings(leaderboardId, range = 10) {
        return this.request(`/leaderboards/${leaderboardId}/nearby?range=${range}`);
    }

    async getLeaderboardMetadata() {
        return this.request('/leaderboards/metadata');
    }

    // Streak methods
    async getUserStreaks(userId = null) {
        const endpoint = userId ? `/streaks/user/${userId}` : `/streaks/user`;
        return this.request(endpoint);
    }

    async getStreak(streakId) {
        return this.request(`/streaks/${streakId}`);
    }

    async getStreakLeaderboard(type = 'login', limit = 50) {
        return this.request(`/streaks/leaderboard?type=${type}&limit=${limit}`);
    }

    async getStreaksAtRisk(limit = 20) {
        return this.request(`/streaks/at-risk?limit=${limit}`);
    }

    async getStreakTypes() {
        return this.request('/streaks/types');
    }

    async getStreakStatistics() {
        return this.request('/streaks/statistics');
    }

    // Title methods
    async getUserTitles(userId = null) {
        const endpoint = userId ? `/titles/user/${userId}` : `/titles/user`;
        return this.request(endpoint);
    }

    async getActiveTitle(userId = null) {
        const endpoint = userId ? `/titles/active/${userId}` : `/titles/active`;
        return this.request(endpoint);
    }

    async activateTitle(titleId) {
        return this.request(`/titles/${titleId}/activate`, {
            method: 'POST'
        });
    }

    async removeActiveTitle() {
        return this.request('/titles/active', {
            method: 'DELETE'
        });
    }

    // Notification methods
    async getNotifications(userId = null, params = {}) {
        const searchParams = new URLSearchParams(params);
        const endpoint = userId 
            ? `/notifications/user/${userId}?${searchParams.toString()}`
            : `/notifications/user?${searchParams.toString()}`;
        return this.request(endpoint);
    }

    async getUnreadNotificationCount(userId = null) {
        const endpoint = userId 
            ? `/notifications/unread-count/${userId}`
            : `/notifications/unread-count`;
        return this.request(endpoint);
    }

    async markNotificationAsRead(notificationId) {
        return this.request(`/notifications/${notificationId}/read`, {
            method: 'POST'
        });
    }

    async markNotificationAsUnread(notificationId) {
        return this.request(`/notifications/${notificationId}/unread`, {
            method: 'POST'
        });
    }

    async markAllNotificationsAsRead() {
        return this.request('/notifications/read-all', {
            method: 'POST'
        });
    }

    async deleteNotification(notificationId) {
        return this.request(`/notifications/${notificationId}`, {
            method: 'DELETE'
        });
    }

    async getNotificationTypes() {
        return this.request('/notifications/types');
    }

    // Utility methods
    formatScore(score) {
        if (score >= 1000000) {
            return `${(score / 1000000).toFixed(1)}M`;
        } else if (score >= 1000) {
            return `${(score / 1000).toFixed(1)}K`;
        } else {
            return Math.round(score).toString();
        }
    }

    getRarityColor(rarity) {
        const colors = {
            common: '#6B7280',
            uncommon: '#10B981',
            rare: '#3B82F6',
            epic: '#8B5CF6',
            legendary: '#F59E0B'
        };
        return colors[rarity] || colors.common;
    }

    getDifficultyColor(difficulty) {
        const colors = {
            easy: '#10B981',
            medium: '#F59E0B',
            hard: '#EF4444',
            extreme: '#7C2D12'
        };
        return colors[difficulty] || colors.medium;
    }

    getCategoryIcon(category) {
        const icons = {
            social: '👥',
            activity: '⚡',
            milestone: '🏁',
            streak: '🔥',
            challenge: '🎯',
            special: '⭐'
        };
        return icons[category] || '🏆';
    }

    formatTimeRemaining(endDate) {
        const now = new Date();
        const end = new Date(endDate);
        const diffMs = end - now;
        
        if (diffMs <= 0) return 'Ended';
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (days > 0) return `${days}d ${hours}h left`;
        if (hours > 0) return `${hours}h ${minutes}m left`;
        return `${minutes}m left`;
    }

    // Cache management
    clearCache() {
        // Clear any local cache if implemented
        if (typeof Storage !== 'undefined') {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('achievement_cache_') || 
                    key.startsWith('leaderboard_cache_') || 
                    key.startsWith('challenge_cache_')) {
                    localStorage.removeItem(key);
                }
            });
        }
    }
}

// Create singleton instance
const achievementService = new AchievementService();

// Auto-set token from localStorage
if (typeof window !== 'undefined' && localStorage.getItem('token')) {
    achievementService.setAuthToken(localStorage.getItem('token'));
}

export default achievementService;