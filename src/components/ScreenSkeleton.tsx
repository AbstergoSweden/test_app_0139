import React from 'react';

export const ScreenSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-6">
    {/* Header skeleton */}
    <div className="h-8 bg-gray-700 rounded-lg w-1/3"></div>
    
    {/* Content area skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left panel */}
      <div className="space-y-4">
        <div className="h-40 bg-gray-700 rounded-xl"></div>
        <div className="h-20 bg-gray-700 rounded-xl"></div>
        <div className="h-12 bg-gray-700 rounded-lg w-2/3"></div>
      </div>
      
      {/* Right panel */}
      <div className="space-y-4">
        <div className="h-64 bg-gray-700 rounded-xl"></div>
        <div className="flex gap-3">
          <div className="h-10 bg-gray-700 rounded-lg flex-1"></div>
          <div className="h-10 bg-gray-700 rounded-lg flex-1"></div>
        </div>
      </div>
    </div>
    
    {/* Bottom row skeleton */}
    <div className="flex gap-4">
      <div className="h-24 bg-gray-700 rounded-xl flex-1"></div>
      <div className="h-24 bg-gray-700 rounded-xl flex-1"></div>
      <div className="h-24 bg-gray-700 rounded-xl flex-1"></div>
    </div>
  </div>
);
