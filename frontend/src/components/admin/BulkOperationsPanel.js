import React, { useState, useEffect, useMemo } from 'react';
import Pagination from '../shared/Pagination';

function BulkOperationsPanel({ api }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [operationType, setOperationType] = useState('');
  const [availableData, setAvailableData] = useState({
    teams: [],
    players: [],
    matches: [],
    events: []
  });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pagination, setPagination] = useState({
    teams: { currentPage: 1, itemsPerPage: 10 },
    players: { currentPage: 1, itemsPerPage: 10 },
    matches: { currentPage: 1, itemsPerPage: 10 },
    events: { currentPage: 1, itemsPerPage: 10 }
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [teamsRes, playersRes, matchesRes, eventsRes] = await Promise.all([
        api.get('/teams').catch(() => ({ data: [] })),
        api.get('/players').catch(() => ({ data: [] })),
        api.get('/matches').catch(() => ({ data: [] })),
        api.get('/events').catch(() => ({ data: [] }))
      ]);

      setAvailableData({
        teams: teamsRes.data || [],
        players: playersRes.data || [],
        matches: matchesRes.data || [],
        events: eventsRes.data || []
      });
    } catch (error) {
      console.error('Error fetching bulk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const bulkOperations = [
    { id: 'delete', label: 'Delete Selected', icon: '', danger: true },
    { id: 'export', label: 'Export to CSV', icon: '', safe: true },
    { id: 'bulk-edit', label: 'Bulk Edit', icon: '', safe: true },
    { id: 'archive', label: 'Archive', icon: '', safe: true },
    { id: 'activate', label: 'Activate', icon: '', safe: true },
    { id: 'deactivate', label: 'Deactivate', icon: '', safe: true }
  ];

  const executeBulkOperation = async () => {
    if (!operationType || selectedItems.length === 0) {
      alert('Please select items and operation type');
      return;
    }

    const confirmMessage = `Are you sure you want to ${operationType} ${selectedItems.length} items?`;
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    setProgress(0);

    try {
      const totalItems = selectedItems.length;
      
      try {
          // Skip export - handle separately
          if (operationType === 'export') {
            exportToCSV(selectedItems);
            setProgress(100);
            return;
          }
          
          // Group items by type for bulk operations
          const itemsByType = selectedItems.reduce((acc, item) => {
            if (!acc[item.type]) acc[item.type] = [];
            acc[item.type].push(item.id);
            return acc;
          }, {});
          
          // Execute bulk operation for each type
          for (const [type, ids] of Object.entries(itemsByType)) {
            try {
              await api.post(`/admin/bulk/${type}s/${operationType}`, { ids });
            } catch (error) {
              console.error(`Error in bulk ${operationType} for ${type}:`, error);
            }
          }
          
          setProgress(100);
      } catch (error) {
        console.error('Bulk operation error:', error);
        alert(`Bulk operation failed: ${error.message}`);
      }

      alert(`Bulk operation ${operationType} completed successfully!`);
      setSelectedItems([]);
      setOperationType('');
      await fetchAllData();
      
    } catch (error) {
      console.error('Bulk operation error:', error);
      alert(`Bulk operation failed: ${error.message}`);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const exportToCSV = (data) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Type,ID,Name,Status\n"
      + data.map(item => `${item.type},${item.id},${item.name},${item.status || 'active'}`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mrvl_bulk_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleItemSelection = (item, type) => {
    const itemWithType = { ...item, type };
    const isSelected = selectedItems.some(selected => selected.id === item.id && selected.type === type);
    
    if (isSelected) {
      setSelectedItems(prev => prev.filter(selected => !(selected.id === item.id && selected.type === type)));
    } else {
      setSelectedItems(prev => [...prev, itemWithType]);
    }
  };

  const selectAllOfType = (type, visibleOnly = false) => {
    const typeData = availableData[type] || [];
    const itemsToConsider = visibleOnly ? getPaginatedData(type) : typeData;
    const typeItems = itemsToConsider.map(item => ({ ...item, type: type.slice(0, -1) }));
    
    const allSelected = typeItems.every(item => 
      selectedItems.some(selected => selected.id === item.id && selected.type === item.type)
    );
    
    if (allSelected) {
      // Deselect items of this type that are in the current selection
      const typeKey = type.slice(0, -1);
      const itemsToDeselect = itemsToConsider.map(item => item.id);
      setSelectedItems(prev => prev.filter(selected => 
        !(selected.type === typeKey && itemsToDeselect.includes(selected.id))
      ));
    } else {
      const newSelections = typeItems.filter(item => 
        !selectedItems.some(selected => selected.id === item.id && selected.type === item.type)
      );
      setSelectedItems(prev => [...prev, ...newSelections]);
    }
  };

  const getPaginatedData = (type) => {
    const typeData = availableData[type] || [];
    const { currentPage, itemsPerPage } = pagination[type];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return typeData.slice(startIndex, startIndex + itemsPerPage);
  };

  const handlePageChange = (type, newPage) => {
    setPagination(prev => ({
      ...prev,
      [type]: { ...prev[type], currentPage: newPage }
    }));
  };

  const handlePageSizeChange = (type, newPageSize) => {
    setPagination(prev => ({
      ...prev,
      [type]: { currentPage: 1, itemsPerPage: newPageSize }
    }));
  };

  const getSelectedCountForType = (type) => {
    const typeKey = type.slice(0, -1);
    return selectedItems.filter(item => item.type === typeKey).length;
  };

  const getTotalPagesForType = (type) => {
    const typeData = availableData[type] || [];
    const { itemsPerPage } = pagination[type];
    return Math.ceil(typeData.length / itemsPerPage);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Bulk Operations</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage multiple items efficiently</p>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedItems.length} items selected
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bulk Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Select Operation
            </label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value)}
              className="form-input"
            >
              <option value="">Choose operation...</option>
              {bulkOperations.map(op => (
                <option key={op.id} value={op.id}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={executeBulkOperation}
              disabled={!operationType || selectedItems.length === 0 || loading}
              className={`btn w-full ${
                operationType && bulkOperations.find(op => op.id === operationType)?.danger
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? `Processing... ${Math.round(progress)}%` : 'Execute Operation'}
            </button>
          </div>
        </div>

        {loading && (
          <div className="mb-4">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Object.entries(availableData).map(([type, items]) => {
          const paginatedItems = getPaginatedData(type);
          const selectedCount = getSelectedCountForType(type);
          const totalPages = getTotalPagesForType(type);
          const { currentPage, itemsPerPage } = pagination[type];
          
          return (
            <div key={type} className="card overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">
                      {type} ({items.length})
                    </h3>
                    {selectedCount > 0 && (
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {selectedCount} selected
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => selectAllOfType(type, true)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700"
                      title="Select/deselect visible items"
                    >
                      {paginatedItems.every(item => selectedItems.some(selected => 
                        selected.id === item.id && selected.type === type.slice(0, -1)
                      )) ? 'Deselect Page' : 'Select Page'}
                    </button>
                    <button
                      onClick={() => selectAllOfType(type, false)}
                      className="text-sm text-green-600 dark:text-green-400 hover:text-green-700"
                      title="Select/deselect all items"
                    >
                      {items.every(item => selectedItems.some(selected => 
                        selected.id === item.id && selected.type === type.slice(0, -1)
                      )) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 min-h-[300px]">
                  {paginatedItems.map(item => {
                    const itemType = type.slice(0, -1);
                    const isSelected = selectedItems.some(selected => 
                      selected.id === item.id && selected.type === itemType
                    );
                    
                    return (
                      <div 
                        key={item.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                        onClick={() => toggleItemSelection(item, itemType)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {item.name || item.title || `${itemType} #${item.id}`}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            ID: {item.id} • Status: {item.status || 'active'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {paginatedItems.length === 0 && items.length > 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No items on this page</p>
                    </div>
                  )}
                  
                  {items.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 dark:text-gray-400">No {type} available</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pagination for each section */}
              {items.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={items.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={(page) => handlePageChange(type, page)}
                  onPageSizeChange={(size) => handlePageSizeChange(type, size)}
                  itemName={type}
                  pageSizeOptions={[5, 10, 25, 50]}
                  className=""
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setSelectedItems([])}
            className="btn btn-ghost"
          >
            Clear Selection
          </button>
          <button 
            onClick={() => exportToCSV(selectedItems)}
            disabled={selectedItems.length === 0}
            className="btn btn-ghost disabled:opacity-50"
          >
            Export Selected
          </button>
          <button 
            onClick={fetchAllData}
            className="btn btn-ghost"
          >
            Refresh Data
          </button>
          <button 
            onClick={() => {
              const allItems = Object.entries(availableData).flatMap(([type, items]) => 
                items.map(item => ({ ...item, type: type.slice(0, -1) }))
              );
              setSelectedItems(allItems);
            }}
            className="btn btn-ghost"
          >
            Select All
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkOperationsPanel;