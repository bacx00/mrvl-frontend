import React from 'react';

const Breadcrumbs = ({ items, navigateTo }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span>›</span>}
          {item.onClick || navigateTo ? (
            <button
              onClick={() => item.onClick ? item.onClick() : navigateTo(item.route)}
              className="text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              {item.label}
            </button>
          ) : (
            <span className={index === items.length - 1 ? 'text-gray-900 font-medium' : ''}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default Breadcrumbs;