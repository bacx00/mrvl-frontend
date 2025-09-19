import React, { useState } from 'react';
import { useAuth } from '../../hooks';

function AdminBulkOperations() {
  const { api } = useAuth();
  const [selectedOperation, setSelectedOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  const operations = [
    {
      id: 'delete_inactive_users',
      name: 'Delete Inactive Users',
      description: 'Delete users who have never logged in and are older than 30 days',
      color: 'bg-red-600 hover:bg-red-700',
      icon: '🗑️'
    },
    {
      id: 'cleanup_old_sessions',
      name: 'Clean Old Sessions',
      description: 'Remove expired user sessions older than 24 hours',
      color: 'bg-yellow-600 hover:bg-yellow-700',
      icon: '🧹'
    },
    {
      id: 'archive_old_matches',
      name: 'Archive Old Matches',
      description: 'Archive completed matches older than 1 year',
      color: 'bg-blue-600 hover:bg-blue-700',
      icon: '📦'
    },
    {
      id: 'delete_test_data',
      name: 'Delete Test Data',
      description: 'Remove all test users, matches, and events (be careful!)',
      color: 'bg-red-800 hover:bg-red-900',
      icon: '⚠️'
    },
    {
      id: 'optimize_database',
      name: 'Optimize Database',
      description: 'Run database optimization and cleanup routines',
      color: 'bg-green-600 hover:bg-green-700',
      icon: '⚡'
    },
    {
      id: 'backup_database',
      name: 'Create Database Backup',
      description: 'Create a full database backup',
      color: 'bg-purple-600 hover:bg-purple-700',
      icon: '💾'
    }
  ];

  const handleOperation = async (operationId) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return;

    const confirmMessage = `Are you sure you want to: ${operation.name}?\n\n${operation.description}\n\nThis action cannot be undone.`;
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    setResult('');
    setSelectedOperation(operationId);

    try {
      const response = await api.post(`/admin/bulk-operations/${operationId}`);
      const data = response.data || response;

      if (data.success) {
        setResult(`✅ Success: ${data.message || 'Operation completed successfully'}`);
        if (data.affected_count) {
          setResult(prev => `${prev}\nAffected items: ${data.affected_count}`);
        }
      } else {
        setResult(`❌ Error: ${data.message || 'Operation failed'}`);
      }
    } catch (error) {
      console.error('Bulk operation error:', error);
      setResult(`❌ Error: ${error.response?.data?.message || error.message || 'Operation failed'}`);
    } finally {
      setLoading(false);
      setSelectedOperation('');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Operations</h1>
        <p className="text-gray-600 dark:text-gray-400">Simplified bulk operations for database maintenance</p>
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          Admin Only - Use with extreme caution
        </div>
      </div>

      {result && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Last Operation Result</h3>
          <pre className="text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {operations.map((operation) => (
          <div
            key={operation.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="text-center">
              <div className="text-4xl mb-3">{operation.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {operation.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {operation.description}
              </p>
              <button
                onClick={() => handleOperation(operation.id)}
                disabled={loading && selectedOperation === operation.id}
                className={`w-full px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                  loading && selectedOperation === operation.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : operation.color
                }`}
              >
                {loading && selectedOperation === operation.id ? 'Processing...' : 'Execute'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Warning */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          ⚠️ Warning
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          Bulk operations affect large amounts of data and cannot be undone. Always create a backup before performing bulk operations.
          Delete operations are permanent and will remove all associated data.
        </p>
      </div>
    </div>
  );
}

export default AdminBulkOperations;