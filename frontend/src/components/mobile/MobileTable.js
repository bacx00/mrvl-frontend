import React from 'react';

/**
 * Mobile-optimized table component that converts tables to cards on mobile
 * Similar to VLR.gg's approach
 */
function MobileTable({ columns, data, onRowClick, className = '' }) {
  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  if (!isMobile) {
    // Desktop table view
    return (
      <div className={`overflow-x-auto ${className}`}>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                  >
                    {column.render ? column.render(row) : row[column.accessor]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // Mobile card view
  return (
    <div className={`space-y-3 ${className}`}>
      {data.map((row, rowIndex) => (
        <div
          key={rowIndex}
          onClick={() => onRowClick && onRowClick(row)}
          className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${
            onRowClick ? 'cursor-pointer active:scale-98 transition-transform' : ''
          }`}
        >
          {columns.map((column, colIndex) => {
            // Skip columns marked as hideOnMobile
            if (column.hideOnMobile) return null;

            // For primary columns (like rank, name), display prominently
            if (column.primary) {
              return (
                <div key={colIndex} className="mb-3">
                  <div className="text-base font-semibold text-gray-900 dark:text-white">
                    {column.render ? column.render(row) : row[column.accessor]}
                  </div>
                </div>
              );
            }

            // For regular columns, display as label-value pairs
            return (
              <div key={colIndex} className="flex justify-between items-center py-1.5">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {column.header}
                </span>
                <span className="text-sm text-gray-900 dark:text-white font-medium">
                  {column.render ? column.render(row) : row[column.accessor]}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Example usage for rankings table
export function MobileRankingsTable({ rankings, onTeamClick }) {
  const columns = [
    {
      header: 'Rank',
      accessor: 'rank',
      primary: false,
      render: (row) => (
        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold">
          {row.rank}
        </span>
      )
    },
    {
      header: 'Team',
      accessor: 'name',
      primary: true,
      render: (row) => (
        <div className="flex items-center space-x-3">
          {row.logo && (
            <img src={row.logo} alt={row.name} className="w-8 h-8 rounded" />
          )}
          <div>
            <div className="font-semibold">{row.name}</div>
            {row.region && (
              <div className="text-xs text-gray-500">{row.region}</div>
            )}
          </div>
        </div>
      )
    },
    {
      header: 'Rating',
      accessor: 'rating',
      render: (row) => row.rating?.toFixed(0) || '-'
    },
    {
      header: 'W-L',
      accessor: 'record',
      render: (row) => `${row.wins || 0}-${row.losses || 0}`
    },
    {
      header: 'Winrate',
      accessor: 'winrate',
      render: (row) => {
        const winrate = row.wins && row.losses 
          ? ((row.wins / (row.wins + row.losses)) * 100).toFixed(1)
          : 0;
        return `${winrate}%`;
      }
    },
    {
      header: 'Streak',
      accessor: 'streak',
      hideOnMobile: true
    }
  ];

  return <MobileTable columns={columns} data={rankings} onRowClick={onTeamClick} />;
}

// Example usage for match results table
export function MobileMatchResultsTable({ matches, onMatchClick }) {
  const columns = [
    {
      header: 'Match',
      accessor: 'teams',
      primary: true,
      render: (match) => (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {match.team1?.logo && (
                <img src={match.team1.logo} alt="" className="w-6 h-6 rounded" />
              )}
              <span className={match.team1_score > match.team2_score ? 'font-bold' : ''}>
                {match.team1?.name}
              </span>
            </div>
            <span className={`text-lg font-bold ${
              match.team1_score > match.team2_score ? 'text-green-600' : 'text-gray-500'
            }`}>
              {match.team1_score}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {match.team2?.logo && (
                <img src={match.team2.logo} alt="" className="w-6 h-6 rounded" />
              )}
              <span className={match.team2_score > match.team1_score ? 'font-bold' : ''}>
                {match.team2?.name}
              </span>
            </div>
            <span className={`text-lg font-bold ${
              match.team2_score > match.team1_score ? 'text-green-600' : 'text-gray-500'
            }`}>
              {match.team2_score}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Event',
      accessor: 'event',
      render: (match) => match.event?.name || 'Unknown Event'
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (match) => {
        const date = new Date(match.created_at);
        return date.toLocaleDateString();
      }
    }
  ];

  return <MobileTable columns={columns} data={matches} onRowClick={onMatchClick} />;
}

export default MobileTable;