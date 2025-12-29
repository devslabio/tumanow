import React from 'react';
import Skeleton from './Skeleton';

export default function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex-1">
          <Skeleton height={32} width={200} className="mb-2" />
          <Skeleton height={16} width={300} />
        </div>
        <Skeleton height={40} width={120} rounded="md" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-sm p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Skeleton height={40} width={200} rounded="md" />
          <Skeleton height={40} width={300} rounded="md" />
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-sm p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <Skeleton height={20} width="70%" className="mb-2" />
                <Skeleton height={14} width="50%" />
              </div>
              <Skeleton variant="circular" width={32} height={32} className="flex-shrink-0 ml-2" />
            </div>
            <Skeleton height={16} width="100%" className="mb-2" />
            <Skeleton height={16} width="80%" />
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
              <Skeleton height={32} width={32} rounded="md" />
              <Skeleton height={32} width={32} rounded="md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

