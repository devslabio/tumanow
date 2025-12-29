import React from 'react';
import Skeleton from './Skeleton';

export default function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-sm border border-gray-200 p-4 sm:p-6 h-full">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <Skeleton height={14} width={100} className="mb-2" />
          <Skeleton height={32} width={120} className="mb-1" />
          <Skeleton height={12} width={80} />
        </div>
        <Skeleton variant="circular" width={40} height={40} className="sm:w-12 sm:h-12 flex-shrink-0 ml-2" />
      </div>
    </div>
  );
}

