import React, { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, Users, Trophy, ChevronRight, Zap, Eye, Calendar, Shield } from 'lucide-react';

const MobileMatchCardVLR = ({ 
  match, 
  onClick, 
  showDetails = true,
  compact = false,
  className = '' 
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [showLiveIndicator, setShowLiveIndicator] = useState(true);
  const cardRef = useRef(null);
  const touchStartY = useRef(null);
  const touchStartX = useRef(null);

  // Format match status
  const getMatchStatus = () => {
    if (!match) return { text: 'TBD', class: 'upcoming' };
    
    switch (match.status) {
      case 'live':
        return { text: 'LIVE', class: 'live', animated: true };
      case 'completed':
        return { text: 'FINAL', class: 'completed' };
      case 'upcoming':
        return { text: formatTimeUntil(match.scheduled_at), class: 'upcoming' };
      default:
        return { text: match.status?.toUpperCase() || 'TBD', class: 'default' };
    }
  };

  // Format time until match
  const formatTimeUntil = (scheduledTime) => {
    if (!scheduledTime) return 'TBD';
    
    const now = new Date();
    const matchTime = new Date(scheduledTime);
    const diffMs = matchTime - now;
    
    if (diffMs < 0) return 'DELAYED';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `IN ${diffDays}D`;
    if (diffHours > 0) return `IN ${diffHours}H`;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `IN ${diffMinutes}M`;
  };

  // Format match time
  const formatMatchTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  // Get winner styling
  const getWinnerClass = (teamScore, opponentScore) => {
    if (match.status !== 'completed') return '';
    return teamScore > opponentScore ? 'winner' : 'loser';
  };

  // Handle touch interactions
  const handleTouchStart = (e) => {
    setIsPressed(true);
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    setIsPressed(false);
    
    if (!touchStartY.current || !touchStartX.current) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    const diffY = Math.abs(touchStartY.current - touchEndY);
    const diffX = Math.abs(touchStartX.current - touchEndX);
    
    // Only trigger click if it wasn't a swipe
    if (diffY < 10 && diffX < 10 && onClick) {
      onClick(match);
    }
    
    touchStartY.current = null;
    touchStartX.current = null;
  };

  // Live match pulse animation
  useEffect(() => {
    if (match?.status === 'live') {
      const interval = setInterval(() => {
        setShowLiveIndicator(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [match?.status]);

  const matchStatus = getMatchStatus();

  if (!match) {
    return (
      <div className={`mobile-match-card-vlr skeleton ${className}`}>
        <div className="skeleton-content">
          <div className="skeleton-line" style={{ width: '60%' }} />
          <div className="skeleton-line" style={{ width: '40%' }} />
          <div className="skeleton-line" style={{ width: '80%' }} />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className={`mobile-match-card-vlr ${matchStatus.class} ${isPressed ? 'pressed' : ''} ${compact ? 'compact' : ''} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={() => !isPressed && onClick && onClick(match)}
    >
      {/* Match Header */}
      <div className="match-header-mobile">
        <div className="match-header-left">
          {match.event && (
            <div className="match-event-badge">
              {match.event.logo ? (
                <img src={match.event.logo} alt={match.event.name} className="event-logo-tiny" />
              ) : (
                <Trophy size={12} />
              )}
              <span className="event-name-mobile">{match.event.name}</span>
            </div>
          )}
        </div>
        <div className="match-header-right">
          <div className={`match-status-badge ${matchStatus.class} ${matchStatus.animated ? 'animated' : ''}`}>
            {matchStatus.class === 'live' && showLiveIndicator && (
              <span className="live-dot-indicator" />
            )}
            <span>{matchStatus.text}</span>
          </div>
        </div>
      </div>

      {/* Teams Section */}
      <div className="match-teams-section">
        {/* Team 1 */}
        <div className={`team-row-mobile ${getWinnerClass(match.team1_score, match.team2_score)}`}>
          <div className="team-info-mobile">
            {match.team1?.logo ? (
              <img 
                src={match.team1.logo} 
                alt={match.team1.name}
                className="team-logo-mobile"
                loading="lazy"
              />
            ) : (
              <div className="team-logo-placeholder">
                <Users size={16} />
              </div>
            )}
            <div className="team-details">
              <span className="team-name-mobile">{match.team1?.name || 'TBD'}</span>
              {match.team1?.region && !compact && (
                <span className="team-region">{match.team1.region}</span>
              )}
            </div>
          </div>
          <div className="team-score-container">
            {match.status === 'live' && match.team1_current_map_score !== undefined && (
              <span className="map-score">({match.team1_current_map_score})</span>
            )}
            <span className={`team-score-mobile ${getWinnerClass(match.team1_score, match.team2_score)}`}>
              {match.team1_score ?? '-'}
            </span>
          </div>
        </div>

        {/* VS Separator */}
        <div className="vs-separator">
          <span>VS</span>
        </div>

        {/* Team 2 */}
        <div className={`team-row-mobile ${getWinnerClass(match.team2_score, match.team1_score)}`}>
          <div className="team-info-mobile">
            {match.team2?.logo ? (
              <img 
                src={match.team2.logo} 
                alt={match.team2.name}
                className="team-logo-mobile"
                loading="lazy"
              />
            ) : (
              <div className="team-logo-placeholder">
                <Users size={16} />
              </div>
            )}
            <div className="team-details">
              <span className="team-name-mobile">{match.team2?.name || 'TBD'}</span>
              {match.team2?.region && !compact && (
                <span className="team-region">{match.team2.region}</span>
              )}
            </div>
          </div>
          <div className="team-score-container">
            {match.status === 'live' && match.team2_current_map_score !== undefined && (
              <span className="map-score">({match.team2_current_map_score})</span>
            )}
            <span className={`team-score-mobile ${getWinnerClass(match.team2_score, match.team1_score)}`}>
              {match.team2_score ?? '-'}
            </span>
          </div>
        </div>
      </div>

      {/* Match Details */}
      {showDetails && !compact && (
        <div className="match-details-mobile">
          <div className="match-detail-item">
            <Clock size={12} />
            <span>{formatMatchTime(match.scheduled_at)}</span>
          </div>
          {match.format && (
            <div className="match-detail-item">
              <Shield size={12} />
              <span>{match.format}</span>
            </div>
          )}
          {match.viewers !== undefined && match.status === 'live' && (
            <div className="match-detail-item highlight">
              <Eye size={12} />
              <span>{match.viewers.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Live Map Indicator */}
      {match.status === 'live' && match.current_map && (
        <div className="live-map-indicator">
          <Zap size={12} />
          <span>Map {match.current_map}: {match.current_map_name || 'In Progress'}</span>
        </div>
      )}

      {/* Match Footer */}
      {showDetails && (
        <div className="match-footer-mobile">
          <div className="match-footer-left">
            {match.round && (
              <span className="match-round">{match.round}</span>
            )}
          </div>
          <div className="match-footer-right">
            <span className="view-details">
              View Details
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Match List Component for multiple matches
export const MobileMatchListVLR = ({ 
  matches = [], 
  onMatchClick,
  loading = false,
  emptyMessage = "No matches found",
  groupByDate = true,
  className = ''
}) => {
  const [filteredMatches, setFilteredMatches] = useState(matches);
  const [activeFilter, setActiveFilter] = useState('all');

  // Group matches by date
  const groupMatchesByDate = (matchList) => {
    if (!groupByDate) return { 'All Matches': matchList };
    
    const grouped = {};
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    const tomorrow = new Date(Date.now() + 86400000).toDateString();
    
    matchList.forEach(match => {
      const matchDate = new Date(match.scheduled_at).toDateString();
      let groupKey;
      
      if (matchDate === today) groupKey = 'Today';
      else if (matchDate === yesterday) groupKey = 'Yesterday';
      else if (matchDate === tomorrow) groupKey = 'Tomorrow';
      else groupKey = new Date(match.scheduled_at).toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
      
      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(match);
    });
    
    return grouped;
  };

  // Filter matches
  const handleFilter = (filter) => {
    setActiveFilter(filter);
    
    switch (filter) {
      case 'live':
        setFilteredMatches(matches.filter(m => m.status === 'live'));
        break;
      case 'upcoming':
        setFilteredMatches(matches.filter(m => m.status === 'upcoming'));
        break;
      case 'completed':
        setFilteredMatches(matches.filter(m => m.status === 'completed'));
        break;
      default:
        setFilteredMatches(matches);
    }
  };

  useEffect(() => {
    setFilteredMatches(matches);
  }, [matches]);

  if (loading) {
    return (
      <div className={`mobile-match-list-vlr loading ${className}`}>
        {[1, 2, 3, 4].map(i => (
          <MobileMatchCardVLR key={i} match={null} />
        ))}
      </div>
    );
  }

  const groupedMatches = groupMatchesByDate(filteredMatches);

  return (
    <div className={`mobile-match-list-vlr ${className}`}>
      {/* Filter Tabs */}
      <div className="match-filter-tabs">
        <button 
          className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilter('all')}
        >
          All
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'live' ? 'active' : ''}`}
          onClick={() => handleFilter('live')}
        >
          <span className="live-dot" />
          Live
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => handleFilter('upcoming')}
        >
          Upcoming
        </button>
        <button 
          className={`filter-tab ${activeFilter === 'completed' ? 'active' : ''}`}
          onClick={() => handleFilter('completed')}
        >
          Results
        </button>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="empty-state-mobile">
          <Calendar size={48} />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} className="match-group">
            {groupByDate && (
              <div className="match-group-header">
                <span className="group-date">{date}</span>
                <span className="group-count">{dateMatches.length} matches</span>
              </div>
            )}
            {dateMatches.map((match, index) => (
              <MobileMatchCardVLR
                key={match.id || index}
                match={match}
                onClick={onMatchClick}
                showDetails={true}
              />
            ))}
          </div>
        ))
      )}
    </div>
  );
};

export default MobileMatchCardVLR;