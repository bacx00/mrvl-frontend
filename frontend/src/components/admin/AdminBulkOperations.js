import React, { useState } from 'react';
import { useAuth } from '../../hooks';

function AdminBulkOperations() {
  const { api } = useAuth();
  const [selectedType, setSelectedType] = useState('teams');
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBulkOperation = async () => {
    if (!operation) {
      alert('Please select an operation');
      return;
    }

    if (!window.confirm(`Are you sure you want to perform ${operation} on all ${selectedType}? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      await api.post(`/admin/bulk/${selectedType}/${operation}`, {});
      alert('Bulk operation completed successfully!');
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      alert('Error performing bulk operation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Operations</h1>
        <p className="text-gray-600 dark:text-gray-400">Perform bulk operations on platform data</p>
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          Admin Only - Use with caution
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Data Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="teams">Teams</option>
              <option value="players">Players</option>
              <option value="matches">Matches</option>
              <option value="events">Events</option>
              <option value="news">News</option>
              <option value="users">Users</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Operation
            </label>
            <select
              value={operation}
              onChange={(e) => setOperation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Select Operation</option>
              <option value="archive">Archive All</option>
              <option value="activate">Activate All</option>
              <option value="deactivate">Deactivate All</option>
              <option value="update">Bulk Update</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              onClick={handleBulkOperation}
              disabled={loading || !operation}
              className="btn btn-danger w-full"
            >
              {loading ? 'Processing...' : `Perform ${operation} on ${selectedType}`}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Warning
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          Bulk operations affect large amounts of data and cannot be undone. Always create a backup before performing bulk operations.
        </p>
      </div>
    </div>
  );
}

export default AdminBulkOperations;