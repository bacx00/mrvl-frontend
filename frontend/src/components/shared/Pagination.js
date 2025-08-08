import React from 'react';

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  itemName = 'items',
  className = '',
  showPageSizeSelector = true,
  showItemInfo = true
}) {
  if (totalPages <= 1 && !showPageSizeSelector) return null;

  const startItem = Math.max(1, (currentPage - 1) * itemsPerPage + 1);
  const endItem = Math.min(totalItems, currentPage * itemsPerPage);

  const getVisiblePages = () => {
    const maxVisiblePages = 7;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const sidePages = Math.floor((maxVisiblePages - 1) / 2);
    
    if (currentPage <= sidePages + 1) {
      return Array.from({ length: maxVisiblePages }, (_, i) => i + 1);
    }
    
    if (currentPage >= totalPages - sidePages) {
      return Array.from({ length: maxVisiblePages }, (_, i) => totalPages - maxVisiblePages + i + 1);
    }
    
    return Array.from({ length: maxVisiblePages }, (_, i) => currentPage - sidePages + i);
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`bg-gray-50 dark:bg-gray-800 px-6 py-3 border-t border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Items Info */}
        {showItemInfo && (
          <div className="text-sm text-gray-700 dark:text-gray-300 order-2 sm:order-1">
            {totalItems > 0 ? (
              <>
                Showing <span className="font-medium">{startItem}</span> to{' '}
                <span className="font-medium">{endItem}</span> of{' '}
                <span className="font-medium">{totalItems}</span> {itemName}
              </>
            ) : (
              `No ${itemName} found`
            )}
          </div>
        )}

        {/* Page Size Selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center space-x-2 text-sm order-3 sm:order-2">
            <label className="text-gray-700 dark:text-gray-300">Show:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="form-input text-sm py-1 px-2 min-w-0 w-auto"
            >
              {pageSizeOptions.map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span className="text-gray-700 dark:text-gray-300">per page</span>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center space-x-1 order-1 sm:order-3">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              Previous
            </button>

            {/* First page if not visible */}
            {!visiblePages.includes(1) && (
              <>
                <button
                  onClick={() => onPageChange(1)}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  1
                </button>
                {visiblePages[0] > 2 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
              </>
            )}

            {/* Page Numbers */}
            {visiblePages.map(pageNum => (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={`px-3 py-1 text-sm border rounded transition-colors ${
                  currentPage === pageNum
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {/* Last page if not visible */}
            {!visiblePages.includes(totalPages) && totalPages > 1 && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className="px-2 text-gray-500">...</span>
                )}
                <button
                  onClick={() => onPageChange(totalPages)}
                  className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {totalPages}
                </button>
              </>
            )}

            {/* Next Button */}
            <button
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Mobile-friendly page info */}
      <div className="sm:hidden mt-2 text-center text-xs text-gray-600 dark:text-gray-400">
        Page {currentPage} of {totalPages}
      </div>
    </div>
  );
}

export default Pagination;