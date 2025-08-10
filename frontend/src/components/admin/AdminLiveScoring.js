import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminLiveScoring() {
  const { api } = useAuth();
  const [liveMatches, setLiveMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveMatches();
  }, []);

  const fetchLiveMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/matches?status=live');
      const matchesData = response?.data?.data || response?.data || response || [];
      setLiveMatches(Array.isArray(matchesData) ? matchesData.filter(m => m.status === 'live') : []);
    } catch (err) {
      console.error('Error fetching live matches:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Scoring</h1>
        <p className="text-gray-600 dark:text-gray-400">Real-time match control and scoring</p>
      </div>

      {liveMatches.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Live Matches</h3>
          <p className="text-gray-600 dark:text-gray-400">There are no matches currently live.</p>
        </div>
      )}
    </div>
  );
}

export default AdminLiveScoring;