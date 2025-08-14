import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';

function AdminBulkOperations() {
  const { api } = useAuth();
  const [selectedSystem, setSelectedSystem] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [operation, setOperation] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [items, setItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [bulkData, setBulkData] = useState({});

  const systems = {
    news: {
      name: 'News System',
      types: ['articles', 'categories', 'comments', 'tags']
    },
    forums: {
      name: 'Forums System', 
      types: ['threads', 'posts', 'categories', 'reports']
    },
    players: {
      name: 'Players System',
      types: ['players', 'stats', 'achievements', 'transfers']
    },
    teams: {
      name: 'Teams System',
      types: ['teams', 'rosters', 'staff', 'achievements']
    },
    events: {
      name: 'Events System',
      types: ['events', 'tournaments', 'brackets', 'registrations']
    },
    matches: {
      name: 'Matches System',
      types: ['matches', 'rounds', 'maps', 'stats']
    },
    users: {
      name: 'Users System',
      types: ['users', 'roles', 'permissions', 'activity']
    }
  };

  const operations = {
    create: { name: 'Create', color: 'green', requiresData: true },
    read: { name: 'Export/Read', color: 'blue', requiresData: false },
    update: { name: 'Update', color: 'yellow', requiresData: true },
    delete: { name: 'Delete', color: 'red', requiresData: false },
    archive: { name: 'Archive', color: 'gray', requiresData: false },
    restore: { name: 'Restore', color: 'purple', requiresData: false },
    activate: { name: 'Activate', color: 'green', requiresData: false },
    deactivate: { name: 'Deactivate', color: 'orange', requiresData: false }
  };

  useEffect(() => {
    if (selectedSystem && selectedType) {
      fetchItems();
    }
  }, [selectedSystem, selectedType]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/${selectedSystem}/${selectedType}`);
      setItems(response.data || []);
      setSelectedItems([]);
      setSelectAll(false);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectItem = (id) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(item => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const handleBulkOperation = async () => {
    if (!selectedSystem || !selectedType || !operation) {
      alert('Please select system, type, and operation');
      return;
    }

    if (operation !== 'create' && selectedItems.length === 0) {
      alert('Please select items to perform the operation');
      return;
    }

    const operationName = operations[operation].name;
    const confirmMessage = operation === 'create' 
      ? `Are you sure you want to create new ${selectedType} in ${systems[selectedSystem].name}?`
      : `Are you sure you want to ${operationName} ${selectedItems.length} ${selectedType} in ${systems[selectedSystem].name}? This action cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      
      const payload = {
        operation,
        items: selectedItems,
        data: bulkData
      };

      await api.post(`/admin/bulk/${selectedSystem}/${selectedType}`, payload);
      
      alert(`Bulk ${operationName} completed successfully!`);
      fetchItems();
      setSelectedItems([]);
      setSelectAll(false);
      setBulkData({});
    } catch (error) {
      console.error('Error performing bulk operation:', error);
      alert(`Error performing bulk ${operationName}.`);
    } finally {
      setLoading(false);
    }
  };

  const renderBulkDataForm = () => {
    if (!operations[operation]?.requiresData) return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Bulk Data</h4>
        <div className="space-y-3">
          {operation === 'create' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Number of items to create
                </label>
                <input
                  type="number"
                  value={bulkData.count || 1}
                  onChange={(e) => setBulkData({...bulkData, count: e.target.value})}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name prefix
                </label>
                <input
                  type="text"
                  value={bulkData.prefix || ''}
                  onChange={(e) => setBulkData({...bulkData, prefix: e.target.value})}
                  placeholder={`New ${selectedType} `}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
          {operation === 'update' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Field to update
                </label>
                <select
                  value={bulkData.field || ''}
                  onChange={(e) => setBulkData({...bulkData, field: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Select field</option>
                  <option value="status">Status</option>
                  <option value="featured">Featured</option>
                  <option value="published">Published</option>
                  <option value="category">Category</option>
                  <option value="tags">Tags</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New value
                </label>
                <input
                  type="text"
                  value={bulkData.value || ''}
                  onChange={(e) => setBulkData({...bulkData, value: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bulk Operations</h1>
        <p className="text-gray-600 dark:text-gray-400">Perform bulk CRUD operations on platform data</p>
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          Admin Only - Use with extreme caution
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Selection Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Selection</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                System
              </label>
              <select
                value={selectedSystem}
                onChange={(e) => {
                  setSelectedSystem(e.target.value);
                  setSelectedType('');
                  setItems([]);
                  setSelectedItems([]);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">Select System</option>
                {Object.entries(systems).map(([key, system]) => (
                  <option key={key} value={key}>{system.name}</option>
                ))}
              </select>
            </div>

            {selectedSystem && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Data Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Select Type</option>
                  {systems[selectedSystem].types.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Operation
              </label>
              <select
                value={operation}
                onChange={(e) => {
                  setOperation(e.target.value);
                  setBulkData({});
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="">Select Operation</option>
                {Object.entries(operations).map(([key, op]) => (
                  <option key={key} value={key}>{op.name}</option>
                ))}
              </select>
            </div>
          </div>

          {renderBulkDataForm()}

          <div className="mt-6">
            <button
              onClick={handleBulkOperation}
              disabled={loading || !operation || !selectedSystem || !selectedType}
              className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                operation && operations[operation]
                  ? operation === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : operation === 'create'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : operation === 'update'
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processing...' : operation ? `Perform ${operations[operation]?.name || operation}` : 'Select Operation'}
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedType ? `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Items` : 'Select System & Type'}
            </h3>
            {items.length > 0 && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Select All</span>
              </label>
            )}
          </div>

          {selectedSystem && selectedType ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  Loading items...
                </div>
              ) : items.length > 0 ? (
                items.map(item => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      selectedItems.includes(item.id)
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <label className="flex items-center space-x-3 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.name || item.title || `${selectedType} #${item.id}`}
                        </p>
                        {item.status && (
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' :
                            item.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                    </label>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No items found
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Select a system and type to view items
            </div>
          )}

          {selectedItems.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} selected
              </p>
            </div>
          )}
        </div>
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