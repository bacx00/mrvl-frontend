import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FreeAgentsPage.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://mrvl.com.hk/api';

const FreeAgentsPage = () => {
  const [freeAgents, setFreeAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: 'all',
    region: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    total: 0
  });

  useEffect(() => {
    fetchFreeAgents();
  }, [filters, pagination.current_page]);

  const fetchFreeAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current_page,
        per_page: 20,
        ...(filters.role !== 'all' && { role: filters.role }),
        ...(filters.region !== 'all' && { region: filters.region }),
        ...(filters.search && { search: filters.search })
      });

      const response = await axios.get(`${API_BASE_URL}/players/free-agents?${params}`);
      if (response.data.success) {
        setFreeAgents(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching free agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      'Duelist': '⚔️',
      'Vanguard': '🛡️',
      'Strategist': '💊',
      'Flex': '🔄'
    };
    return roleIcons[role] || '🎮';
  };

  const formatEarnings = (amount) => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="players-page">
      <div className="page-header">
        <h1 className="page-title">Free Agents</h1>
        <p className="page-subtitle">Available players looking for teams</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Role</label>
          <select 
            value={filters.role} 
            onChange={(e) => handleFilterChange('role', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Roles</option>
            <option value="Duelist">Duelist</option>
            <option value="Vanguard">Vanguard</option>
            <option value="Strategist">Strategist</option>
            <option value="Flex">Flex</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Region</label>
          <select 
            value={filters.region} 
            onChange={(e) => handleFilterChange('region', e.target.value)}
            className="filter-select"
          >
            <option value="all">All Regions</option>
            <option value="NA">North America</option>
            <option value="EU">Europe</option>
            <option value="ASIA">Asia</option>
            <option value="CN">China</option>
            <option value="KR">Korea</option>
            <option value="JP">Japan</option>
            <option value="OCE">Oceania</option>
            <option value="SA">South America</option>
          </select>
        </div>

        <div className="filter-group search-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search players..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="filter-input"
          />
        </div>
      </div>

      {/* Free Agents Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading free agents...</p>
        </div>
      ) : (
        <>
          <div className="players-grid free-agents-grid">
            {freeAgents.map(player => (
              <a 
                href={`#player-detail/${player.id}`} 
                key={player.id} 
                className="player-card free-agent-card"
              >
                <div className="free-agent-badge">FREE AGENT</div>
                
                <div className="player-header">
                  <img 
                    src={player.avatar} 
                    alt={player.username}
                    className="player-avatar"
                    onError={(e) => {
                      e.target.src = '/images/default-avatar.png';
                    }}
                  />
                  <div className="player-info">
                    <h3 className="player-name">{player.username}</h3>
                    {player.real_name && (
                      <p className="player-real-name">{player.real_name}</p>
                    )}
                  </div>
                </div>

                <div className="player-details">
                  <div className="detail-row">
                    <span className="detail-label">Role:</span>
                    <span className="detail-value">
                      {getRoleIcon(player.role)} {player.role}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Main Hero:</span>
                    <span className="detail-value">{player.main_hero || 'Flexible'}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-label">Rating:</span>
                    <span className="detail-value rating-value">
                      {player.rating || 1000}
                    </span>
                  </div>

                  {player.last_team && (
                    <div className="detail-row last-team">
                      <span className="detail-label">Previous Team:</span>
                      <div className="team-info">
                        <img 
                          src={player.last_team.logo} 
                          alt={player.last_team.name}
                          className="team-logo-small"
                          onError={(e) => {
                            e.target.src = '/images/team-placeholder.svg';
                          }}
                        />
                        <span>{player.last_team.name}</span>
                      </div>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="detail-label">Available Since:</span>
                    <span className="detail-value">{player.available_since}</span>
                  </div>

                  {player.earnings > 0 && (
                    <div className="detail-row">
                      <span className="detail-label">Career Earnings:</span>
                      <span className="detail-value earnings">
                        {formatEarnings(player.earnings)}
                      </span>
                    </div>
                  )}

                  {player.country && (
                    <div className="detail-row">
                      <span className="detail-label">Country:</span>
                      <span className="detail-value">
                        <img 
                          src={player.flag} 
                          alt={player.country}
                          className="country-flag"
                        />
                        {player.country}
                      </span>
                    </div>
                  )}
                </div>

                {/* Social Media Links */}
                {player.social_media && Object.keys(player.social_media).length > 0 && (
                  <div className="social-links">
                    {player.social_media.twitter && (
                      <a 
                        href={`https://twitter.com/${player.social_media.twitter}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link twitter"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fab fa-twitter"></i>
                      </a>
                    )}
                    {player.social_media.twitch && (
                      <a 
                        href={`https://twitch.tv/${player.social_media.twitch}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link twitch"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fab fa-twitch"></i>
                      </a>
                    )}
                    {player.social_media.youtube && (
                      <a 
                        href={`https://youtube.com/@${player.social_media.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-link youtube"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fab fa-youtube"></i>
                      </a>
                    )}
                  </div>
                )}

                <div className="card-footer">
                  <button className="contact-button">
                    Contact Agent
                  </button>
                </div>
              </a>
            ))}
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => setPagination(prev => ({ 
                  ...prev, 
                  current_page: Math.max(1, prev.current_page - 1) 
                }))}
                disabled={pagination.current_page === 1}
              >
                Previous
              </button>
              
              <span className="pagination-info">
                Page {pagination.current_page} of {pagination.last_page} 
                ({pagination.total} total free agents)
              </span>
              
              <button
                className="pagination-btn"
                onClick={() => setPagination(prev => ({ 
                  ...prev, 
                  current_page: Math.min(prev.last_page, prev.current_page + 1) 
                }))}
                disabled={pagination.current_page === pagination.last_page}
              >
                Next
              </button>
            </div>
          )}

          {freeAgents.length === 0 && (
            <div className="no-results">
              <h3>No free agents found</h3>
              <p>Try adjusting your filters or check back later.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FreeAgentsPage;