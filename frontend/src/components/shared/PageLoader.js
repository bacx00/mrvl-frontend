import React from 'react';

const PageLoader = ({ text = "Loading..." }) => (
  <div className="flex flex-col justify-center items-center min-h-[50vh] space-y-4">
    <div className="relative">
      {/* Spinner with MRVL branding */}
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
      <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-600 border-t-transparent absolute top-0 left-0"></div>
      
      {/* Inner logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 bg-red-600 rounded-sm flex items-center justify-center">
          <span className="text-white text-xs font-bold">M</span>
        </div>
      </div>
    </div>
    
    <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
      {text}
    </div>
  </div>
);

export default PageLoader;