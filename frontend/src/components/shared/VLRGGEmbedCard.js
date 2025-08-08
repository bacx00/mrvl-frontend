import React, { useState, useEffect } from 'react';
import { fetchVLRUrlData, generateVLREmbedData } from '../../services/vlrggService';

/**
 * VLR.gg Embed Card Component
 * Displays VLR.gg content (matches, teams, events, players) in a rich card format
 * Mobile-optimized with responsive design and loading states
 */
function VLRGGEmbedCard({ 
  url, 
  className = '', 
  compact = false, 
  showActions = true,
  onError = null 
}) {
  const [embedData, setEmbedData] = useState(null);
  const [vlrData, setVlrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setError('No URL provided');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch VLR data with API enrichment
        const data = await fetchVLRUrlData(url);
        if (!data) {
          throw new Error('Failed to parse VLR.gg URL');
        }

        setVlrData(data);

        // Generate embed card data
        const cardData = generateVLREmbedData(data);
        setEmbedData(cardData);
      } catch (err) {
        console.error('VLR.gg embed error:', err);
        setError(err.message || 'Failed to load VLR.gg content');
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, onError]);

  if (loading) {
    return (
      <div className={`vlr-embed-card ${className}`}>
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 animate-pulse">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-200 dark:bg-orange-800 rounded-lg flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-orange-200 dark:bg-orange-800 rounded w-3/4"></div>
              <div className="h-3 bg-orange-200 dark:bg-orange-800 rounded w-1/2"></div>
              <div className="h-3 bg-orange-200 dark:bg-orange-800 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !embedData) {
    return (
      <div className={`vlr-embed-card ${className}`}>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-red-200 dark:bg-red-800 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400">
                ⚠️
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100">
                Failed to load VLR.gg content
              </h3>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {error || 'Unknown error occurred'}
              </p>
              {showActions && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 mt-2"
                >
                  View on VLR.gg →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getContentIcon = () => {
    switch (vlrData.type) {
      case 'match': return '⚔️';
      case 'team': return '👥';
      case 'event': return '🏆';
      case 'player': return '👤';
      default: return '🎯';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'text-gray-600 dark:text-gray-400';
    const statusLower = status.toLowerCase();
    if (statusLower.includes('live') || statusLower.includes('ongoing')) {
      return 'text-green-600 dark:text-green-400';
    }
    if (statusLower.includes('completed') || statusLower.includes('finished')) {
      return 'text-blue-600 dark:text-blue-400';
    }
    if (statusLower.includes('upcoming') || statusLower.includes('scheduled')) {
      return 'text-orange-600 dark:text-orange-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className={`vlr-embed-card ${className}`}>
      <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 rounded-lg overflow-hidden transition-all hover:shadow-md">
        <div className={`p-${compact ? '3' : '4'}`}>
          {/* Header */}
          <div className="flex items-start space-x-3">
            {/* Icon/Thumbnail */}
            <div className="flex-shrink-0">
              {embedData.thumbnail ? (
                <img
                  src={embedData.thumbnail}
                  alt={embedData.title}
                  className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} object-cover rounded-lg border border-orange-200 dark:border-orange-700`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`${compact ? 'w-10 h-10' : 'w-12 h-12'} bg-orange-200 dark:bg-orange-800 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400 text-${compact ? 'lg' : 'xl'}`}
                style={embedData.thumbnail ? { display: 'none' } : {}}
              >
                {getContentIcon()}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`${compact ? 'text-sm' : 'text-base'} font-semibold text-orange-900 dark:text-orange-100 truncate`}>
                    {embedData.title}
                  </h3>
                  {embedData.subtitle && (
                    <p className={`${compact ? 'text-xs' : 'text-sm'} text-orange-700 dark:text-orange-300 truncate`}>
                      {embedData.subtitle}
                    </p>
                  )}
                </div>

                {/* Platform badge */}
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 flex-shrink-0">
                  🎯 VLR.gg
                </span>
              </div>

              {/* Enhanced metadata for matches */}
              {vlrData.type === 'match' && vlrData.matchData && (
                <div className="mt-2 space-y-1">
                  {vlrData.matchData.teams && vlrData.matchData.teams.length >= 2 && (
                    <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                      <span className="mr-1">⚔️</span>
                      <span className="truncate">
                        {vlrData.matchData.teams.map(team => team.name || team.shortName).join(' vs ')}
                      </span>
                    </div>
                  )}
                  {vlrData.matchData.status && (
                    <div className="flex items-center text-xs">
                      <span className="mr-1">🎯</span>
                      <span className={getStatusColor(vlrData.matchData.status)}>
                        {vlrData.matchData.status}
                      </span>
                    </div>
                  )}
                  {vlrData.matchData.score && (
                    <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                      <span className="mr-1">📊</span>
                      <span>{vlrData.matchData.score}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Enhanced metadata for teams */}
              {vlrData.type === 'team' && vlrData.teamData && (
                <div className="mt-2 space-y-1">
                  {vlrData.teamData.region && (
                    <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                      <span className="mr-1">🌍</span>
                      <span>{vlrData.teamData.region}</span>
                    </div>
                  )}
                  {vlrData.teamData.rank && (
                    <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                      <span className="mr-1">🏆</span>
                      <span>Rank #{vlrData.teamData.rank}</span>
                    </div>
                  )}
                  {vlrData.teamData.winRate && (
                    <div className="flex items-center text-xs text-orange-700 dark:text-orange-300">
                      <span className="mr-1">📈</span>
                      <span>{vlrData.teamData.winRate}% win rate</span>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {!compact && embedData.description && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-2 line-clamp-2">
                  {embedData.description}
                </p>
              )}

              {/* Actions */}
              {showActions && (
                <div className="flex items-center justify-between mt-3">
                  <a
                    href={embedData.displayUrl || embedData.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 font-medium"
                  >
                    View on VLR.gg
                    <span className="ml-1">→</span>
                  </a>

                  {/* Mobile-optimized share button */}
                  <div className="md:hidden">
                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: embedData.title,
                            text: embedData.description,
                            url: embedData.displayUrl || embedData.originalUrl
                          }).catch(console.error);
                        } else {
                          navigator.clipboard.writeText(embedData.displayUrl || embedData.originalUrl)
                            .then(() => alert('Link copied to clipboard!'))
                            .catch(console.error);
                        }
                      }}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-200 p-1"
                      title="Share"
                    >
                      📤
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Optional bottom border for visual separation */}
        <div className="h-1 bg-gradient-to-r from-orange-400 to-red-400 dark:from-orange-600 dark:to-red-600"></div>
      </div>
    </div>
  );
}

export default VLRGGEmbedCard;